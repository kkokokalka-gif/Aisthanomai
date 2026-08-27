/* ==========================================================================
   αισθάνομαι — ερωτηματολόγια αυτοπαρατήρησης (GAD-7 / PHQ-9)
   Σταθμισμένα εργαλεία διαλογής, ελεύθερα προς χρήση. ΔΕΝ είναι διάγνωση.
   Οι απαντήσεις υπολογίζονται στη συσκευή· τίποτα δεν αποθηκεύεται και
   τίποτα δεν αποστέλλεται.
   ========================================================================== */
(function () {
  "use strict";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var OPTS = ["Καθόλου", "Κάποιες μέρες", "Πάνω από τις μισές μέρες", "Σχεδόν κάθε μέρα"];

  var TESTS = {
    gad7: {
      name: "GAD-7 — άγχος",
      intro: "Τις τελευταίες 2 εβδομάδες, πόσο συχνά σε ενόχλησαν τα παρακάτω;",
      max: 21,
      q: [
        "Νευρικότητα, άγχος ή ένταση",
        "Αδυναμία να σταματήσεις ή να ελέγξεις την ανησυχία",
        "Υπερβολική ανησυχία για διάφορα πράγματα",
        "Δυσκολία να χαλαρώσεις",
        "Τόση ανησυχία που δυσκολεύεσαι να καθίσεις ήσυχα",
        "Ευερεθιστότητα ή εκνευρισμός",
        "Φόβος ότι κάτι τρομερό πρόκειται να συμβεί"
      ],
      bands: [
        { max: 4,  l: "Ελάχιστα συμπτώματα άγχους",  d: "Το σκορ δεν δείχνει σημαντικό άγχος αυτή την περίοδο." },
        { max: 9,  l: "Ήπια συμπτώματα άγχους",      d: "Συχνά βοηθούν εργαλεία αυτοφροντίδας· αν επιμένει, μια συζήτηση αξίζει." },
        { max: 14, l: "Μέτρια συμπτώματα άγχους",    d: "Σε αυτό το εύρος η ψυχοθεραπεία έχει τεκμηριωμένο όφελος." },
        { max: 21, l: "Σοβαρά συμπτώματα άγχους",    d: "Καλό είναι να μιλήσεις με επαγγελματία ψυχικής υγείας σύντομα." }
      ]
    },
    phq9: {
      name: "PHQ-9 — διάθεση",
      intro: "Τις τελευταίες 2 εβδομάδες, πόσο συχνά σε ενόχλησαν τα παρακάτω;",
      max: 27,
      riskIndex: 8,
      q: [
        "Λίγο ενδιαφέρον ή ευχαρίστηση στο να κάνεις πράγματα",
        "Αίσθημα κατήφειας, μελαγχολίας ή απελπισίας",
        "Δυσκολία στον ύπνο ή υπερβολικός ύπνος",
        "Κόπωση ή έλλειψη ενέργειας",
        "Μειωμένη ή αυξημένη όρεξη",
        "Άσχημη γνώμη για τον εαυτό σου — ότι είσαι αποτυχία ή απογοήτευσες τους δικούς σου",
        "Δυσκολία συγκέντρωσης, π.χ. στο διάβασμα ή στην τηλεόραση",
        "Κινήσεις ή ομιλία τόσο αργές που το πρόσεξαν άλλοι — ή το αντίθετο, υπερβολική ανησυχία και κίνηση",
        "Σκέψεις ότι θα ήταν καλύτερα να μην ζεις ή σκέψεις να κάνεις κακό στον εαυτό σου"
      ],
      bands: [
        { max: 4,  l: "Ελάχιστα καταθλιπτικά συμπτώματα", d: "Το σκορ δεν δείχνει σημαντική δυσφορία αυτή την περίοδο." },
        { max: 9,  l: "Ήπια συμπτώματα",                  d: "Αξίζει να το ξαναδείς σε δύο εβδομάδες και να προσέξεις ύπνο και κίνηση." },
        { max: 14, l: "Μέτρια συμπτώματα",                d: "Σε αυτό το εύρος συνιστάται συζήτηση με επαγγελματία ψυχικής υγείας." },
        { max: 19, l: "Μετρίως σοβαρά συμπτώματα",        d: "Καλό είναι να αναζητήσεις υποστήριξη σύντομα." },
        { max: 27, l: "Σοβαρά συμπτώματα",                d: "Επικοινώνησε με επαγγελματία ψυχικής υγείας το συντομότερο δυνατόν." }
      ]
    }
  };

  var current = "gad7";

  function render(key) {
    current = key;
    var t = TESTS[key];
    $$("#quizTabs .chip").forEach(function (c) {
      c.classList.toggle("is-on", c.getAttribute("data-quiz") === key);
    });
    $("#quizIntro").textContent = t.intro;
    $("#quizForm").innerHTML = t.q.map(function (q, i) {
      return '<div class="quiz__q"><p><b>' + (i + 1) + ".</b> " + window.esc(q) + "</p>" +
        '<div class="opts">' + OPTS.map(function (o, v) {
          return '<label class="opt"><input type="radio" name="' + key + "-" + i + '" value="' + v + '">' +
                 "<span>" + o + "</span></label>";
        }).join("") + "</div></div>";
    }).join("");
    $("#quizResult").hidden = true;
    $("#quizRisk").hidden = true;
  }

  function score() {
    var t = TESTS[current];
    var total = 0, answered = 0, riskAnswer = 0;
    t.q.forEach(function (_, i) {
      var picked = $('input[name="' + current + "-" + i + '"]:checked');
      if (picked) {
        answered++;
        total += parseInt(picked.value, 10);
        if (t.riskIndex === i) riskAnswer = parseInt(picked.value, 10);
      }
    });
    if (answered < t.q.length) {
      window.toast("Απάντησε και στις " + t.q.length + " ερωτήσεις (" + answered + "/" + t.q.length + ").");
      return;
    }
    var band = t.bands.filter(function (b) { return total <= b.max; })[0];
    $("#quizScoreNum").textContent = total + " / " + t.max;
    $("#quizBand").textContent = band.l;
    $("#quizBandNote").textContent = band.d;
    $("#quizMeter").style.width = (total / t.max * 100) + "%";
    $("#quizResult").hidden = false;
    $("#quizRisk").hidden = riskAnswer === 0;
    $("#quizResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function init() {
    if (!$("#quizForm")) return;
    $("#quizTabs").innerHTML = Object.keys(TESTS).map(function (k, i) {
      return '<button class="chip' + (i === 0 ? " is-on" : "") + '" data-quiz="' + k + '">' + TESTS[k].name + "</button>";
    }).join("");
    $("#quizTabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-quiz]");
      if (b) render(b.getAttribute("data-quiz"));
    });
    $("#quizScore").addEventListener("click", score);
    $("#quizClear").addEventListener("click", function () { render(current); });
    render("gad7");
  }

  window.Screening = { init: init };
})();
