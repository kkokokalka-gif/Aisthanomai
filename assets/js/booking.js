/* ==========================================================================
   αισθάνομαι — ροή κράτησης ραντεβού
   Πέντε βήματα: υπηρεσία → τρόπος → ημέρα/ώρα → στοιχεία → επιβεβαίωση.
   Χωρίς backend: στέλνει με mail ή POST σε endpoint (SITE.config.formEndpoint)
   και δίνει αρχείο .ics για το ημερολόγιο του χρήστη.
   ========================================================================== */
(function () {
  "use strict";

  var S = window.SITE;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var STEPS = ["Υπηρεσία", "Τρόπος", "Ημέρα & ώρα", "Στοιχεία", "Επιβεβαίωση"];
  var DOW = ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"];   /* η εβδομάδα ξεκινά Δευτέρα */

  var st = {
    step: 0,
    service: null,
    mode: null,
    date: null,      /* Date στην αρχή της ημέρας */
    time: null,      /* "HH:MM" */
    view: new Date(),
    form: {}
  };

  /* ── ημερομηνίες ──────────────────────────────────────────────────── */
  function ymd(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function slotDate(day, time) {
    var p = time.split(":");
    var x = new Date(day);
    x.setHours(+p[0], +p[1], 0, 0);
    return x;
  }
  function fmtLong(d) {
    return d.toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function fmtMonth(d) {
    return d.toLocaleDateString("el-GR", { month: "long", year: "numeric" });
  }

  /* ── διαθεσιμότητα ────────────────────────────────────────────────── */
  function slotsFor(day) {
    var b = S.booking;
    var list = b.slots[day.getDay()] || [];
    if (b.blockedDates.indexOf(ymd(day)) > -1) return [];
    var min = new Date(Date.now() + b.leadHours * 3600 * 1000);
    var max = addDays(startOfDay(new Date()), b.horizonDays);
    if (day > max) return [];
    return list.map(function (t) {
      var when = slotDate(day, t);
      var taken = b.booked.indexOf(ymd(day) + " " + t) > -1;
      return { t: t, free: !taken && when >= min };
    });
  }
  function dayHasFree(day) {
    return slotsFor(day).some(function (s) { return s.free; });
  }
  /* Ο μήνας που ανοίγει πρώτος: ο πρώτος με έστω μία ελεύθερη ώρα. */
  function firstFreeDay() {
    var d = startOfDay(new Date());
    for (var i = 0; i <= S.booking.horizonDays; i++) {
      var day = addDays(d, i);
      if (dayHasFree(day)) return day;
    }
    return null;
  }

  /* ── τρόποι ανά υπηρεσία ──────────────────────────────────────────── */
  function modesFor(sv) {
    var tag = (sv.tags[0] || "").toLowerCase();
    if (tag.indexOf("ή") > -1) return ["online", "onsite"];
    if (tag.indexOf("online") > -1) return ["online"];
    return ["onsite"];
  }
  var MODE_INFO = {
    online: { l: "Online συνεδρία", d: "Μέσω κρυπτογραφημένης βιντεοκλήσης. Ο σύνδεσμος έρχεται με την επιβεβαίωση.", icon: "video" },
    onsite: { l: "Στο γραφείο",     d: "", icon: "pin" }
  };

  /* ── βήματα ───────────────────────────────────────────────────────── */
  function paintSteps() {
    $("#bookSteps").innerHTML = STEPS.map(function (s, i) {
      var cls = i === st.step ? "is-on" : (i < st.step ? "is-done" : "");
      return '<li class="' + cls + '"><b>' + (i < st.step ? "✓" : i + 1) + "</b>" + s + "</li>";
    }).join("");
    $$(".step").forEach(function (el, i) { el.classList.toggle("is-active", i === st.step); });
  }

  function goStep(n) {
    st.step = Math.max(0, Math.min(STEPS.length - 1, n));
    paintSteps();
    paintSummary();
    var box = $("#bookWizard");
    if (box && st.step > 0) {
      var top = box.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  /* ── 1 · υπηρεσία ─────────────────────────────────────────────────── */
  function paintServices() {
    $("#bookServices").innerHTML = S.services.map(function (sv) {
      return '<button class="choice' + (st.service && st.service.id === sv.id ? " is-on" : "") + '" data-sv="' + sv.id + '">' +
        "<b>" + window.esc(sv.t) + "<span>" + sv.mins + "′</span></b>" +
        "<p>" + window.esc(sv.d) + "</p></button>";
    }).join("");
  }

  /* ── 2 · τρόπος ───────────────────────────────────────────────────── */
  function paintModes() {
    if (!st.service) return;
    var allowed = modesFor(st.service);
    $("#bookModes").innerHTML = ["online", "onsite"].map(function (m) {
      var info = MODE_INFO[m];
      var ok = allowed.indexOf(m) > -1;
      var d = m === "onsite" ? S.contact.address + ", " + S.contact.city : info.d;
      return '<button class="choice' + (st.mode === m ? " is-on" : "") + '" data-mode="' + m + '"' +
        (ok ? "" : " disabled style=\"opacity:.4;cursor:not-allowed\"") + ">" +
        "<b>" + window.esc(info.l) + "</b><p>" + window.esc(ok ? d : "Δεν προσφέρεται για αυτή την υπηρεσία") + "</p></button>";
    }).join("");
    if (allowed.length === 1 && !st.mode) st.mode = allowed[0];
  }

  /* ── 3 · ημερολόγιο ───────────────────────────────────────────────── */
  function paintCalendar() {
    var view = st.view;
    $("#calMonth").textContent = fmtMonth(view);

    var first = new Date(view.getFullYear(), view.getMonth(), 1);
    var offset = (first.getDay() + 6) % 7;         /* Δευτέρα = 0 */
    var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var today = startOfDay(new Date());

    var cells = DOW.map(function (d) { return '<div class="cal__dow">' + d + "</div>"; });
    for (var i = 0; i < offset; i++) cells.push("<div></div>");
    for (var d = 1; d <= days; d++) {
      var day = new Date(view.getFullYear(), view.getMonth(), d);
      var free = day >= today && dayHasFree(day);
      var cls = ["day"];
      if (free) cls.push("is-free"); else cls.push("is-off");
      if (st.date && ymd(st.date) === ymd(day)) cls.push("is-on");
      if (ymd(day) === ymd(today)) cls.push("is-today");
      cells.push('<button class="' + cls.join(" ") + '"' + (free ? "" : " disabled") +
        ' data-day="' + ymd(day) + '" aria-label="' + fmtLong(day) + '">' + d + "</button>");
    }
    $("#calGrid").innerHTML = cells.join("");

    /* πλοήγηση μήνα: όχι πριν από τον τρέχοντα, όχι πέρα από τον ορίζοντα */
    var max = addDays(today, S.booking.horizonDays);
    $("#calPrev").disabled = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
    $("#calNext").disabled = view.getFullYear() === max.getFullYear() && view.getMonth() === max.getMonth();

    paintSlots();
  }

  function paintSlots() {
    var box = $("#bookSlots");
    if (!st.date) {
      box.innerHTML = '<p class="small muted" style="grid-column:1/-1;margin:0">Διάλεξε πρώτα ημέρα από το ημερολόγιο.</p>';
      return;
    }
    var list = slotsFor(st.date);
    $("#slotsDay").textContent = fmtLong(st.date);
    box.innerHTML = list.length
      ? list.map(function (s) {
          return '<button class="slot' + (st.time === s.t ? " is-on" : "") + '" data-slot="' + s.t + '"' +
            (s.free ? "" : " disabled") + ">" + s.t + "</button>";
        }).join("")
      : '<p class="small muted" style="grid-column:1/-1;margin:0">Δεν υπάρχουν διαθέσιμες ώρες αυτή την ημέρα.</p>';
  }

  /* ── σύνοψη ───────────────────────────────────────────────────────── */
  function paintSummary() {
    var rows = [];
    if (st.service) rows.push(["Υπηρεσία", st.service.t]);
    if (st.mode)    rows.push(["Τρόπος", MODE_INFO[st.mode].l]);
    if (st.date && st.time) rows.push(["Πότε", fmtLong(st.date) + " · " + st.time]);
    if (st.service) rows.push(["Διάρκεια", st.service.mins + " λεπτά"]);

    $("#bookSummary").innerHTML = rows.length
      ? "<dl>" + rows.map(function (r) {
          return "<dt>" + window.esc(r[0]) + "</dt><dd>" + window.esc(r[1]) + "</dd>";
        }).join("") + "</dl>"
      : '<p class="small muted" style="margin:0">Διάλεξε υπηρεσία για να ξεκινήσουμε.</p>';
  }

  /* ── 4 · φόρμα ────────────────────────────────────────────────────── */
  function validate() {
    var ok = true;
    var f = $("#bookForm");
    $$(".field", f).forEach(function (fl) { fl.classList.remove("has-err"); });

    var name = $("#fName").value.trim();
    var mail = $("#fEmail").value.trim();
    if (name.length < 2) { $("#fName").closest(".field").classList.add("has-err"); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { $("#fEmail").closest(".field").classList.add("has-err"); ok = false; }
    if (!$("#fConsent").checked) {
      $("#consentWrap").classList.add("has-err");
      ok = false;
    } else {
      $("#consentWrap").classList.remove("has-err");
    }
    if (!ok) window.toast("Συμπλήρωσε τα πεδία που επισημαίνονται.");
    return ok;
  }

  function collect() {
    st.form = {
      name:  $("#fName").value.trim(),
      email: $("#fEmail").value.trim(),
      phone: $("#fPhone").value.trim(),
      first: $("#fFirst").value,
      note:  $("#fNote").value.trim()
    };
  }

  function summaryText() {
    var l = [
      "Αίτημα ραντεβού — aisthanomai.gr",
      "",
      "Υπηρεσία: " + st.service.t,
      "Τρόπος: " + MODE_INFO[st.mode].l,
      "Ημερομηνία: " + fmtLong(st.date),
      "Ώρα: " + st.time + " (" + st.service.mins + " λεπτά)",
      "",
      "Ονοματεπώνυμο: " + st.form.name,
      "Email: " + st.form.email,
      "Τηλέφωνο: " + (st.form.phone || "—"),
      "Πρώτη φορά σε ψυχοθεραπεία: " + st.form.first
    ];
    if (st.form.note) l.push("", "Σημείωση:", st.form.note);
    return l.join("\n");
  }

  /* ── .ics ─────────────────────────────────────────────────────────── */
  function icsStamp(d) {
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") +
      "T" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + "00";
  }
  function downloadIcs() {
    var start = slotDate(st.date, st.time);
    var end = new Date(start.getTime() + st.service.mins * 60000);
    var loc = st.mode === "onsite" ? S.contact.address + ", " + S.contact.city : "Online — σύνδεσμος με την επιβεβαίωση";
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//aisthanomai.gr//booking//EL", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + "@aisthanomai.gr",
      "DTSTAMP:" + icsStamp(new Date()),
      "DTSTART:" + icsStamp(start),
      "DTEND:" + icsStamp(end),
      "SUMMARY:" + st.service.t + " — " + S.profile.name,
      "LOCATION:" + loc,
      "DESCRIPTION:Αίτημα ραντεβού μέσω aisthanomai.gr. Εκκρεμεί επιβεβαίωση.",
      "STATUS:TENTATIVE",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");

    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rantevou-aisthanomai.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function mailtoHref() {
    return "mailto:" + S.contact.email +
      "?subject=" + encodeURIComponent("Αίτημα ραντεβού — " + st.form.name) +
      "&body=" + encodeURIComponent(summaryText());
  }

  function submit() {
    if (!validate()) return;
    collect();

    var done = function () {
      goStep(4);
      $("#doneWhen").textContent = fmtLong(st.date) + " · " + st.time;
      $("#doneWhat").textContent = st.service.t + " · " + MODE_INFO[st.mode].l;
      $("#doneMail").href = mailtoHref();
    };

    var endpoint = S.config.formEndpoint;
    if (endpoint) {
      var btn = $("#bookSubmit");
      btn.disabled = true;
      btn.textContent = "Αποστολή…";
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          service: st.service.t, mode: MODE_INFO[st.mode].l,
          date: ymd(st.date), time: st.time, minutes: st.service.mins,
          name: st.form.name, email: st.form.email, phone: st.form.phone,
          firstTime: st.form.first, note: st.form.note
        })
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        done();
      }).catch(function () {
        window.toast("Η αυτόματη αποστολή απέτυχε — άνοιξε το email σου να το στείλεις.");
        done();
      }).then(function () {
        btn.disabled = false;
        btn.innerHTML = window.icon("check") + "<span>Στείλε το αίτημα</span>";
      });
    } else {
      done();
      window.location.href = mailtoHref();
    }
  }

  /* ── init ─────────────────────────────────────────────────────────── */
  function init() {
    if (!$("#bookWizard")) return;

    var first = firstFreeDay();
    if (first) st.view = new Date(first.getFullYear(), first.getMonth(), 1);

    paintServices();
    paintCalendar();
    paintSummary();
    paintSteps();

    $("#bookServices").addEventListener("click", function (e) {
      var b = e.target.closest("[data-sv]");
      if (!b) return;
      st.service = S.services.filter(function (s) { return s.id === b.getAttribute("data-sv"); })[0];
      st.mode = null;
      paintServices();
      paintModes();
      goStep(1);
    });

    $("#bookModes").addEventListener("click", function (e) {
      var b = e.target.closest("[data-mode]");
      if (!b || b.disabled) return;
      st.mode = b.getAttribute("data-mode");
      paintModes();
      goStep(2);
    });

    $("#calGrid").addEventListener("click", function (e) {
      var b = e.target.closest("[data-day]");
      if (!b || b.disabled) return;
      var p = b.getAttribute("data-day").split("-");
      st.date = new Date(+p[0], +p[1] - 1, +p[2]);
      st.time = null;
      paintCalendar();
      paintSummary();
    });

    $("#bookSlots").addEventListener("click", function (e) {
      var b = e.target.closest("[data-slot]");
      if (!b || b.disabled) return;
      st.time = b.getAttribute("data-slot");
      paintSlots();
      paintSummary();
    });

    $("#calPrev").addEventListener("click", function () {
      st.view = new Date(st.view.getFullYear(), st.view.getMonth() - 1, 1);
      paintCalendar();
    });
    $("#calNext").addEventListener("click", function () {
      st.view = new Date(st.view.getFullYear(), st.view.getMonth() + 1, 1);
      paintCalendar();
    });

    $$("[data-book-next]").forEach(function (b) {
      b.addEventListener("click", function () {
        var n = st.step;
        if (n === 2 && (!st.date || !st.time)) { window.toast("Διάλεξε ημέρα και ώρα."); return; }
        goStep(n + 1);
      });
    });
    $$("[data-book-back]").forEach(function (b) {
      b.addEventListener("click", function () { goStep(st.step - 1); });
    });

    $("#bookSubmit").addEventListener("click", submit);
    $("#doneIcs").addEventListener("click", downloadIcs);
    $("#doneCopy").addEventListener("click", function () {
      var txt = summaryText();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(function () { window.toast("Τα στοιχεία αντιγράφηκαν."); });
      } else {
        window.prompt("Αντίγραψε τα στοιχεία:", txt);
      }
    });
    $("#doneAgain").addEventListener("click", function () {
      st.service = null; st.mode = null; st.date = null; st.time = null;
      $("#bookForm").reset();
      paintServices(); paintCalendar(); paintSummary();
      goStep(0);
    });

    /* προεπιλογή υπηρεσίας όταν έρχεσαι από κάρτα «Κλείσε» */
    document.addEventListener("route", function (e) {
      if (e.detail.route !== "rantevou" || !window.__preselectService) return;
      var pre = S.services.filter(function (s) { return s.id === window.__preselectService; })[0];
      window.__preselectService = null;
      if (!pre) return;
      st.service = pre; st.mode = null;
      paintServices(); paintModes(); paintSummary();
      goStep(1);
    });
  }

  window.Booking = { init: init };
})();
