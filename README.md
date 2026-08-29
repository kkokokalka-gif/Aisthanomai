# αισθάνομαι — aisthanomai.gr

Site για ψυχολόγο–ψυχοθεραπεύτρια: κράτηση ραντεβού, υπηρεσίες (χωρίς τιμές), διαπιστευτήρια,
σύνοψη ερευνών, feed του Instagram αντί για blog, και **διαδραστικά εργαλεία
ηρεμίας** (καθοδηγούμενη αναπνοή με χρονόμετρο για κρίσεις πανικού, γείωση
5-4-3-2-1, ερωτηματολόγια GAD-7 / PHQ-9).

Στατικό: HTML / CSS / vanilla JS. **Χωρίς build step, χωρίς dependencies.**

```bash
python3 -m http.server 8000     # → http://localhost:8000
```

Δουλεύει και με διπλό κλικ στο `index.html` (δεν υπάρχει fetch, όλα inline).

**Preview:** [ζωντανή έκδοση](https://claude.ai/code/artifact/297fe074-b3bf-4594-8572-911cc7e71901)
— ένα αρχείο με όλα inline. Στο preview δεν κατεβαίνει το `.ics` (ο viewer μπλοκάρει
τα downloads)· στο κανονικό site δουλεύει.

---

## Δομή

```
index.html              όλες οι σελίδες (hash router, μία σελίδα ανά menu item)
assets/css/main.css     tokens + όλα τα components, φωτεινό & σκοτεινό θέμα
assets/data/site.js     ⭐ όλο το περιεχόμενο — κείμενα, υπηρεσίες, έρευνες, ώρες
assets/js/app.js        router, θέμα, μενού, rendering, SOS modal
assets/js/breathe.js    εργαλείο αναπνοής + γείωση 5-4-3-2-1
assets/js/screening.js  GAD-7 / PHQ-9
assets/js/booking.js    ροή κράτησης, ημερολόγιο, .ics
CNAME robots.txt sitemap.xml   για GitHub Pages στο aisthanomai.gr
```

**Το `assets/data/site.js` είναι η μία πηγή αλήθειας.** Σχεδόν κάθε αλλαγή
περιεχομένου γίνεται εκεί, χωρίς να πειραχτεί HTML.

---

## ⚠ Τι πρέπει να αλλάξει πριν βγει live

Όλα τα παρακάτω είναι placeholders. Στο `site.js` έχουν σήμανση `TODO`.

| Πού | Τι |
|-----|-----|
| `site.js → profile` | Όνομα, ιδιότητα, **αριθμός άδειας ασκήσεως επαγγέλματος**, κείμενα, τα τρία νούμερα του hero |
| `site.js → credentials` | Πραγματικοί τίτλοι, φορείς, έτη. **Μην αφήσεις τα δείγματα** |
| `site.js → memberships` | Πραγματικοί σύλλογοι |
| `site.js → services` | Διάρκειες και περιγραφές |
| `site.js → contact` | Email, τηλέφωνο, διεύθυνση, links Instagram / LinkedIn, Google Maps |
| `site.js → hours` | Ώρες γραφείου |
| `site.js → booking` | Ώρες ανά ημέρα, αργίες (`blockedDates`), πιασμένες ώρες (`booked`) |
| `site.js → instagram` | Πραγματικά posts ή live feed (πιο κάτω) |
| `index.html` | Η φωτογραφία προφίλ (τώρα είναι placeholder κύκλος), το JSON-LD schema, το embed του χάρτη |
| `#/aporrito` | Η πολιτική απορρήτου είναι **πρότυπο** — θέλει έλεγχο από νομικό |

Γρήγορος έλεγχος: `grep -n "TODO" assets/data/site.js`

---

## Κράτηση ραντεβού

Η ροή έχει 5 βήματα (υπηρεσία → τρόπος → ημέρα/ώρα → στοιχεία → επιβεβαίωση).
Οι διαθέσιμες ώρες βγαίνουν από το `site.js → booking`: ανά ημέρα εβδομάδας,
μείον οι αργίες, μείον οι πιασμένες, μείον όσες πέφτουν μέσα στο `leadHours`
(προεπιλογή 24 ώρες). Το ημερολόγιο ανοίγει στον πρώτο μήνα με διαθεσιμότητα.

**Χωρίς backend** το αίτημα φεύγει με `mailto:` και ο χρήστης παίρνει επίσης
αρχείο `.ics` για το ημερολόγιό του. Για αυτόματη αποστολή, βάλε ένα endpoint:

```js
config: { formEndpoint: "https://formspree.io/f/xxxxxxx" }
```

Στέλνει `POST` με JSON (`service, mode, date, time, minutes, name, email,
phone, firstTime, note`). Δουλεύει με Formspree, Netlify Forms, Google Apps
Script webhook ή ό,τι δέχεται JSON. Αν αποτύχει, πέφτει πίσω στο `mailto:`.

Για πλήρες σύστημα κρατήσεων με συγχρονισμό ημερολογίου, το επόμενο βήμα είναι
Cal.com ή Calendly σε iframe — αλλά τότε χάνεται το στήσιμο της παρούσας ροής.

## Feed του Instagram

Τρεις επιλογές, κατά σειρά κόπου:

1. **Χειροκίνητα** (τώρα): `site.js → instagram.posts`. Κάθε post δέχεται
   `img` (URL ή data URI) — χωρίς αυτό μπαίνει ένα διαβαθμισμένο πλακίδιο.
2. **Widget τρίτου** (Elfsight, Behold, LightWidget): κόλλα το snippet τους στο
   `#feedGrid` και βγάλε την κλήση `renderFeed()` από το `app.js`.
3. **Instagram Graph API**: χρειάζεται long-lived token, άρα και μια serverless
   function (Netlify / Vercel / Cloudflare Worker) που το κρατά κρυφό. Το token
   **δεν** μπαίνει ποτέ σε στατικό αρχείο. Μετά, `feedMode: "api"` και ένα
   `fetch` στο endpoint σου μέσα στο `renderFeed()`.

## Χάρτης

Στη σελίδα Επικοινωνία, μέσα στο `<div class="map">`, αντικατέστησε το
placeholder με το embed του Google Maps:

```html
<iframe src="https://www.google.com/maps/embed?pb=..." loading="lazy"
        referrerpolicy="no-referrer-when-downgrade" title="Χάρτης"></iframe>
```

---

## Εργαλεία ηρεμίας — σημειώσεις

- **Αναπνοή**: πέντε μοτίβα, ρυθμιζόμενη διάρκεια, μετρητής κύκλων, προαιρετικός
  ήχος (WebAudio) και δόνηση. Κρατά την οθόνη αναμμένη (Wake Lock) όσο τρέχει,
  σταματά αυτόματα αν αλλάξεις σελίδα ή καρτέλα. Space = start/pause.
  Το μοτίβο **4-6** (παρατεταμένη εκπνοή) είναι η προεπιλογή, ως το πιο ανεκτό
  σε κρίση πανικού.
- **GAD-7 / PHQ-9**: σταθμισμένα εργαλεία διαλογής, ελεύθερα προς χρήση. Αν το
  θετικό item 9 του PHQ-9 απαντηθεί, εμφανίζεται μήνυμα με γραμμές βοήθειας.
- **Τίποτα δεν αποθηκεύεται.** Καμία απάντηση δεν φεύγει από τη συσκευή, ούτε
  γράφεται σε `localStorage`. Στο `localStorage` πάει μόνο η επιλογή θέματος.
- Το site **δεν αναγράφει τηλέφωνα έκτακτης ανάγκης** και δεν παραπέμπει
  αλλού· κατόπιν ρητής επιλογής.

## Έρευνα

Οι κάρτες αποδίδουν δημοσιευμένες μετα-αναλύσεις και ανασκοπήσεις. Ο σύνδεσμος
κάθε κάρτας δεν είναι DOI αλλά **αναζήτηση Google Scholar με τον ακριβή τίτλο**,
ώστε να μη σπάει ποτέ και να οδηγεί πάντα στην πρωτότυπη εργασία. Αν προτιμάς
απευθείας DOI, βάλε ένα πεδίο `doi` στο `research` και άλλαξε τη `scholar()`
στο `app.js`.

Δεν υπάρχουν testimonials πελατών — οι κώδικες δεοντολογίας των ψυχολόγων τα
αποθαρρύνουν ή τα απαγορεύουν. Δεν προστέθηκαν σκόπιμα.

---

## Δημοσίευση σε GitHub Pages

Settings → Pages → Deploy from branch → `main` / root. Το `CNAME` δείχνει ήδη
στο `aisthanomai.gr`· στον DNS του domain βάλε `A` records στις IP του GitHub
Pages ή `CNAME` στο `<user>.github.io`. Το `.nojekyll` υπάρχει ώστε να μη
φιλτράρει τίποτα ο Jekyll.

## Προσβασιμότητα & απόδοση

Semantic HTML, `aria-*` στα διαδραστικά, ορατό focus ring, skip link, σεβασμός
του `prefers-reduced-motion` (σταματά και η κίνηση του κύκλου αναπνοής), σεβασμός
του `prefers-color-scheme`. Μηδέν εξωτερικά scripts — μόνο οι γραμματοσειρές
Google. Χωρίς cookies και χωρίς analytics.

## Επόμενα βήματα (προτάσεις)

- Αγγλική έκδοση με διακόπτη ΕΛ/EN (η δομή του `site.js` το σηκώνει εύκολα)
- Πραγματικές φωτογραφίες γραφείου και προφίλ
- Σύνδεση της φόρμας με πραγματικό σύστημα κρατήσεων
- Σελίδα «Πόροι» με PDF ασκήσεων προς κατέβασμα
