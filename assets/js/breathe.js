/* ==========================================================================
   αισθάνομαι — εργαλείο αναπνοής & γείωσης
   Καθοδηγούμενη αναπνοή με ρυθμό, χρονόμετρο, μετρητή κύκλων, ήχο και
   δόνηση· και άσκηση γείωσης 5-4-3-2-1. Όλα τοπικά, χωρίς αποστολή δεδομένων.
   ========================================================================== */
(function () {
  "use strict";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Μοτίβα: [εισπνοή, κράτημα, εκπνοή, κράτημα] σε δευτερόλεπτα. */
  var PATTERNS = [
    { id: "478",   name: "4-7-8 — για ύπνο και έντονο άγχος", r: [4, 7, 8, 0],
      d: "Μακρύ κράτημα και πολύ μακριά εκπνοή. Το πιο κατευναστικό μοτίβο· ίσως ζαλιστείς στην αρχή — μείωσε τους κύκλους." },
    { id: "box",   name: "Τετράγωνη αναπνοή 4-4-4-4", r: [4, 4, 4, 4],
      d: "Συμμετρικό και εύκολο να το θυμάσαι. Καλό για πριν από κάτι που σε αγχώνει." },
    { id: "coh",   name: "Συνεκτική αναπνοή 5-5", r: [5, 0, 5, 0],
      d: "Έξι αναπνοές το λεπτό. Το μοτίβο με τα περισσότερα ευρήματα για τη μεταβλητότητα του καρδιακού ρυθμού." },
    { id: "panic", name: "Παρατεταμένη εκπνοή 4-6 — για κρίση πανικού", r: [4, 0, 6, 0],
      d: "Χωρίς κρατήματα, με την εκπνοή πιο μακριά από την εισπνοή. Το πιο ανεκτό μοτίβο όταν η ανάσα είναι ήδη κοφτή." },
    { id: "calm",  name: "Ήρεμο 6-2-6-2", r: [6, 2, 6, 2],
      d: "Αργός ρυθμός για μεγαλύτερες συνεδρίες, όταν έχεις ήδη κάποια εξοικείωση." }
  ];

  var LABEL = ["Εισπνοή", "Κράτα", "Εκπνοή", "Κράτα"];
  var HINT  = ["από τη μύτη, χαμηλά στην κοιλιά", "χωρίς ένταση στους ώμους",
               "αργά, από το στόμα", "άφησε το σώμα χαλαρό"];

  var st = {
    pattern: PATTERNS[3],   /* ξεκινάμε στο μοτίβο για κρίση πανικού */
    running: false,
    phase: 0,
    phaseStart: 0,
    cycleStart: 0,
    cycles: 0,
    elapsed: 0,
    startedAt: 0,
    goalMs: 3 * 60 * 1000,  /* 3 λεπτά */
    sound: false,
    haptics: true,
    raf: null,
    wake: null,
    audio: null
  };

  var el = {};

  /* ── ήχος ─────────────────────────────────────────────────────────── */
  function beep(freq, ms) {
    if (!st.sound) return;
    try {
      if (!st.audio) st.audio = new (window.AudioContext || window.webkitAudioContext)();
      var ctx = st.audio;
      if (ctx.state === "suspended") ctx.resume();
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + ms / 1000 + 0.05);
    } catch (e) { /* χωρίς ήχο, χωρίς δράμα */ }
  }
  function buzz(ms) {
    if (st.haptics && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  /* ── βοηθητικά ────────────────────────────────────────────────────── */
  function activePhases() {
    /* παραλείπουμε τις φάσεις μηδενικής διάρκειας */
    var out = [];
    st.pattern.r.forEach(function (sec, i) { if (sec > 0) out.push({ i: i, sec: sec }); });
    return out;
  }
  function cycleSeconds() {
    return st.pattern.r.reduce(function (a, b) { return a + b; }, 0);
  }
  function mmss(ms) {
    var t = Math.max(0, Math.round(ms / 1000));
    return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  }

  /* ── κύκλος ζωής ──────────────────────────────────────────────────── */
  function start() {
    if (st.running) return;
    st.running = true;
    st.startedAt = performance.now() - st.elapsed;
    st.phaseStart = performance.now();
    st.cycleStart = performance.now();
    setPhase(0, true);
    el.play.innerHTML = window.icon("pause") + "<span>Παύση</span>";
    el.stage.setAttribute("aria-live", "polite");
    requestWakeLock();
    st.raf = requestAnimationFrame(tick);
  }
  function pause() {
    st.running = false;
    cancelAnimationFrame(st.raf);
    el.play.innerHTML = window.icon("play") + "<span>Συνέχεια</span>";
    releaseWakeLock();
  }
  function reset() {
    pause();
    st.phase = 0; st.cycles = 0; st.elapsed = 0;
    el.play.innerHTML = window.icon("play") + "<span>Ξεκίνα</span>";
    el.core.classList.remove("is-big");
    el.core.style.setProperty("--phase-dur", ".4s");
    el.phase.textContent = "Έτοιμη;";
    el.count.textContent = "—";
    el.hint.textContent = "Κάθισε κάπου σταθερά. Πάτα «Ξεκίνα».";
    el.prog.style.strokeDashoffset = CIRC;
    paintReadout();
  }

  var CIRC = 0;

  function setPhase(idx, force) {
    var phases = activePhases();
    var p = phases[idx % phases.length];
    st.phase = idx % phases.length;
    st.phaseStart = performance.now();
    var kind = p.i;                       /* 0 in · 1 hold · 2 out · 3 hold */
    el.phase.textContent = LABEL[kind];
    el.hint.textContent = HINT[kind];
    el.core.style.setProperty("--phase-dur", p.sec + "s");
    if (kind === 0) el.core.classList.add("is-big");
    else if (kind === 2) el.core.classList.remove("is-big");
    /* στα κρατήματα το μέγεθος μένει ως έχει */
    if (!force) {
      beep(kind === 0 ? 528 : kind === 2 ? 396 : 440, kind === 1 || kind === 3 ? 90 : 160);
      buzz(kind === 1 || kind === 3 ? 18 : 34);
    }
    el.stage.setAttribute("aria-label", LABEL[kind] + " για " + p.sec + " δευτερόλεπτα");
  }

  function tick(now) {
    if (!st.running) return;
    st.elapsed = now - st.startedAt;

    var phases = activePhases();
    var p = phases[st.phase];
    var phaseMs = p.sec * 1000;
    var inPhase = now - st.phaseStart;

    /* αντίστροφη μέτρηση φάσης */
    var left = Math.max(0, Math.ceil((phaseMs - inPhase) / 1000));
    if (el.count.textContent !== String(left)) el.count.textContent = left;

    /* δακτύλιος: πρόοδος μέσα στον πλήρη κύκλο */
    var cycleMs = cycleSeconds() * 1000;
    var inCycle = (now - st.cycleStart) % cycleMs;
    el.prog.style.strokeDashoffset = CIRC * (1 - inCycle / cycleMs);

    if (inPhase >= phaseMs) {
      var next = st.phase + 1;
      if (next >= phases.length) {
        next = 0;
        st.cycles++;
        st.cycleStart = now;
      }
      setPhase(next);
    }

    paintReadout();

    if (st.goalMs && st.elapsed >= st.goalMs) { finish(); return; }
    st.raf = requestAnimationFrame(tick);
  }

  function finish() {
    pause();
    el.phase.textContent = "Τέλος";
    el.count.textContent = "✓";
    el.hint.textContent = "Πάρε λίγο χρόνο πριν σηκωθείς.";
    el.core.classList.remove("is-big");
    beep(660, 300);
    buzz([30, 60, 30]);
    window.toast("Ολοκλήρωσες " + st.cycles + " κύκλους σε " + mmss(st.elapsed) + ".");
  }

  function paintReadout() {
    el.time.textContent = mmss(st.elapsed);
    el.cycles.textContent = st.cycles;
    el.rate.textContent = Math.round(600 / cycleSeconds()) / 10;
  }

  /* ── wake lock ────────────────────────────────────────────────────── */
  function requestWakeLock() {
    if (!navigator.wakeLock) return;
    navigator.wakeLock.request("screen").then(function (w) { st.wake = w; }).catch(function () {});
  }
  function releaseWakeLock() {
    if (st.wake) { try { st.wake.release(); } catch (e) {} st.wake = null; }
  }

  /* ── UI ───────────────────────────────────────────────────────────── */
  function renderPatterns() {
    $("#patternList").innerHTML = PATTERNS.map(function (p) {
      return '<button class="pattern' + (p.id === st.pattern.id ? " is-on" : "") + '" data-pat="' + p.id + '">' +
        "<b>" + window.esc(p.name) + "</b>" +
        '<span class="rhythm">' + p.r.filter(function (n) { return n > 0; }).join("–") + "</span>" +
        "<p>" + window.esc(p.d) + "</p></button>";
    }).join("");
  }

  function renderGoals() {
    var goals = [
      { ms: 60000,  l: "1′" },
      { ms: 120000, l: "2′" },
      { ms: 180000, l: "3′" },
      { ms: 300000, l: "5′" },
      { ms: 0,      l: "Ελεύθερα" }
    ];
    $("#goalList").innerHTML = goals.map(function (g) {
      return '<button class="chip' + (g.ms === st.goalMs ? " is-on" : "") + '" data-goal="' + g.ms + '">' + g.l + "</button>";
    }).join("");
  }

  /* ── γείωση 5-4-3-2-1 ─────────────────────────────────────────────── */
  var GROUND = [
    { n: 5, t: "πράγματα που βλέπεις", p: "Κοίτα γύρω σου και ονόμασέ τα — χρώμα, σχήμα, υφή." },
    { n: 4, t: "πράγματα που αγγίζεις", p: "Το ύφασμα στα πόδια σου, το πάτωμα, τα χέρια σου." },
    { n: 3, t: "ήχοι που ακούς", p: "Κοντινοί και μακρινοί. Χωρίς να τους κρίνεις." },
    { n: 2, t: "μυρωδιές", p: "Ή δύο μυρωδιές που σου αρέσουν, αν δεν υπάρχει κάτι τώρα." },
    { n: 1, t: "πράγμα που γεύεσαι", p: "Ή μια γεύση που θα ήθελες να έχεις στο στόμα σου." }
  ];

  function renderGround() {
    $("#groundList").innerHTML = GROUND.map(function (g, i) {
      return '<div class="ground__step" data-step="' + i + '">' +
        '<header><span class="ground__n">' + g.n + "</span><b>" + g.n + " " + window.esc(g.t) + "</b></header>" +
        "<p>" + window.esc(g.p) + "</p>" +
        '<input type="text" placeholder="Γράψ\' τα εδώ (μένουν μόνο στη συσκευή σου)" ' +
        'aria-label="' + g.n + " " + window.esc(g.t) + '"></div>';
    }).join("");

    $("#groundList").addEventListener("input", function (e) {
      var step = e.target.closest(".ground__step");
      if (!step) return;
      step.classList.toggle("is-done", e.target.value.trim().length > 0);
      var done = $$(".ground__step.is-done", this).length;
      $("#groundProg").style.width = (done / GROUND.length * 100) + "%";
      $("#groundCount").textContent = done + "/" + GROUND.length;
      if (done === GROUND.length) window.toast("Πέντε βήματα, ολοκληρωμένα. Πώς είναι το σώμα σου τώρα;");
    });

    $("#groundReset").addEventListener("click", function () {
      $$("#groundList input").forEach(function (i) { i.value = ""; });
      $$(".ground__step").forEach(function (s) { s.classList.remove("is-done"); });
      $("#groundProg").style.width = "0%";
      $("#groundCount").textContent = "0/" + GROUND.length;
    });
  }

  /* ── init ─────────────────────────────────────────────────────────── */
  function init() {
    el = {
      stage:  $("#breathStage"),
      core:   $("#orbCore"),
      prog:   $("#orbProg"),
      phase:  $("#orbPhase"),
      count:  $("#orbCount"),
      hint:   $("#orbHint"),
      play:   $("#breathPlay"),
      time:   $("#roTime"),
      cycles: $("#roCycles"),
      rate:   $("#roRate")
    };
    if (!el.stage) return;

    var r = el.prog.r.baseVal.value;
    CIRC = 2 * Math.PI * r;
    el.prog.style.strokeDasharray = CIRC;
    el.prog.style.strokeDashoffset = CIRC;

    renderPatterns();
    renderGoals();
    renderGround();
    reset();

    el.play.addEventListener("click", function () { st.running ? pause() : start(); });
    $("#breathReset").addEventListener("click", reset);

    $("#patternList").addEventListener("click", function (e) {
      var b = e.target.closest("[data-pat]");
      if (!b) return;
      st.pattern = PATTERNS.filter(function (p) { return p.id === b.getAttribute("data-pat"); })[0];
      $$(".pattern", this).forEach(function (x) { x.classList.remove("is-on"); });
      b.classList.add("is-on");
      reset();
    });

    $("#goalList").addEventListener("click", function (e) {
      var b = e.target.closest("[data-goal]");
      if (!b) return;
      st.goalMs = parseInt(b.getAttribute("data-goal"), 10);
      $$(".chip", this).forEach(function (x) { x.classList.remove("is-on"); });
      b.classList.add("is-on");
      reset();
    });

    $("#optSound").addEventListener("change", function () {
      st.sound = this.checked;
      if (st.sound) beep(528, 120);
    });
    $("#optHaptics").addEventListener("change", function () { st.haptics = this.checked; buzz(20); });

    /* πλήκτρο διαστήματος = start/pause όσο είμαστε στη σελίδα εργαλείων */
    document.addEventListener("keydown", function (e) {
      if (e.code !== "Space") return;
      var page = $("#page-ergaleia");
      if (!page || !page.classList.contains("is-active")) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "button") return;
      e.preventDefault();
      st.running ? pause() : start();
    });

    /* σταματάμε όταν φεύγεις από τη σελίδα ή αλλάζεις καρτέλα */
    document.addEventListener("route", function (e) {
      if (e.detail.route !== "ergaleia" && st.running) pause();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && st.running) pause();
    });
  }

  window.Breather = { init: init };
})();
