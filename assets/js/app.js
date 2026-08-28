/* ==========================================================================
   αισθάνομαι — κορμός: router, θέμα, πλοήγηση, rendering περιεχομένου
   Vanilla JS, χωρίς dependencies. Τα δεδομένα έρχονται από assets/data/site.js
   ========================================================================== */
(function () {
  "use strict";

  var S = window.SITE;
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ── εικονίδια ────────────────────────────────────────────────────────
     Ένα μικρό set, γραμμικό, 24×24, stroke currentColor. */
  var ICON = {
    spark:  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>',
    leaf:   '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16z"/><path d="M4 20c3-6 6-8 9-9"/>',
    link:   '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    heart:  '<path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-7.3a5 5 0 0 0 0-7.1z"/>',
    wind:   '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h8"/>',
    users:  '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin:    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    mail:   '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone:  '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    video:  '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4V8z"/>',
    plus:   '<path d="M12 5v14M5 12h14"/>',
    check:  '<path d="m4 12 5 5L20 6"/>',
    arrow:  '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left:   '<path d="M15 6l-6 6 6 6"/>',
    right:  '<path d="M9 6l6 6-6 6"/>',
    x:      '<path d="M6 6l12 12M18 6L6 18"/>',
    menu:   '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:   '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
    life:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m5 5 4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>',
    play:   '<path d="M7 4l13 8-13 8V4z"/>',
    pause:  '<path d="M8 4v16M16 4v16"/>',
    reset:  '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
    ig:     '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/>',
    inn:    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4"/>',
    copy:   '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    down:   '<path d="M12 3v13M7 12l5 5 5-5M4 21h16"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    book:   '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/>'
  };

  function icon(name, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           (ICON[name] || "") + "</svg>";
  }
  window.icon = icon;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  window.esc = esc;

  /* ── toast ──────────────────────────────────────────────────────────── */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3200);
  }
  window.toast = toast;

  /* ── κεφαλαία χωρίς τόνους ─────────────────────────────────────────────
     Το text-transform: uppercase δεν αφαιρεί τον τόνο σε κάθε browser, οπότε
     γράφουμε το κείμενο ήδη κεφαλαίο και άτονο. Τα διαλυτικά μένουν. */
  var CAPS_SEL = ".eyebrow, .brand small, .readout span, .summary dt, .footer h4, .hero__portrait span";
  function toCaps(t) {
    return t.toLocaleUpperCase("el-GR").normalize("NFD").replace(/[\u0300\u0301]/g, "").normalize("NFC");
  }
  function capsFix(root) {
    $$(CAPS_SEL, root || document).forEach(function (el) {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = w.nextNode())) {
        var up = toCaps(n.nodeValue);
        if (up !== n.nodeValue) n.nodeValue = up;
      }
    });
  }
  function watchCaps() {
    capsFix();
    if (!window.MutationObserver) return;
    var queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; capsFix(); });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ── θέμα ───────────────────────────────────────────────────────────── */
  var THEME_KEY = "aisth.theme";
  function readTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = $("#themeBtn");
    if (btn) {
      btn.innerHTML = icon(t === "dark" ? "sun" : "moon");
      btn.setAttribute("aria-label", t === "dark" ? "Φωτεινό θέμα" : "Σκοτεινό θέμα");
    }
  }
  function initTheme() {
    var saved = readTheme();
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
    var btn = $("#themeBtn");
    if (btn) btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ── router (hash) ──────────────────────────────────────────────────── */
  var PAGES = ["arxiki", "profil", "ypiresies", "erevna", "ergaleia", "feed", "rantevou", "epikoinonia", "aporrito"];
  var TITLES = {
    arxiki: "αισθάνομαι — Ψυχολόγος & Ψυχοθεραπεύτρια",
    profil: "Προφίλ · αισθάνομαι",
    ypiresies: "Υπηρεσίες · αισθάνομαι",
    erevna: "Έρευνα · αισθάνομαι",
    ergaleia: "Εργαλεία ηρεμίας · αισθάνομαι",
    feed: "Feed · αισθάνομαι",
    rantevou: "Κλείσε ραντεβού · αισθάνομαι",
    epikoinonia: "Επικοινωνία · αισθάνομαι",
    aporrito: "Απόρρητο · αισθάνομαι"
  };

  function currentRoute() {
    var h = (location.hash || "").replace(/^#\/?/, "").split("?")[0];
    return PAGES.indexOf(h) > -1 ? h : "arxiki";
  }

  function go(route, opts) {
    opts = opts || {};
    $$(".page").forEach(function (p) { p.classList.toggle("is-active", p.id === "page-" + route); });
    $$("[data-route]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-route") === route);
    });
    document.title = TITLES[route] || TITLES.arxiki;
    closeDrawer();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "instant" in document.body.style ? "instant" : "auto" });
    observeReveals();
    document.dispatchEvent(new CustomEvent("route", { detail: { route: route } }));
  }

  function initRouter() {
    window.addEventListener("hashchange", function () { go(currentRoute()); });
    /* εσωτερικοί σύνδεσμοι */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#/']");
      if (!a) return;
      var route = a.getAttribute("href").replace(/^#\//, "");
      if (route === currentRoute()) { e.preventDefault(); go(route); }
    });
    go(currentRoute());
  }

  /* ── συρτάρι κινητού ────────────────────────────────────────────────── */
  function openDrawer() {
    $("#drawer").classList.add("is-open");
    document.body.classList.add("is-locked");
    $("#drawerClose").focus();
  }
  function closeDrawer() {
    var d = $("#drawer");
    if (d && d.classList.contains("is-open")) {
      d.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    }
  }
  function initDrawer() {
    $("#navToggle").addEventListener("click", openDrawer);
    $("#drawerClose").addEventListener("click", closeDrawer);
    $("#drawer").addEventListener("click", function (e) { if (e.target === this) closeDrawer(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  }

  /* ── sticky header ──────────────────────────────────────────────────── */
  function initHeader() {
    var h = $("#header");
    var onScroll = function () { h.classList.toggle("is-stuck", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── reveal ─────────────────────────────────────────────────────────── */
  var io;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) {
      $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: .06 });
    }
    $$(".page.is-active .reveal:not(.is-in)").forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i, 6) * 55 + "ms";
      io.observe(el);
    });
  }

  /* ── rendering: υπηρεσίες ───────────────────────────────────────────── */
  function renderServices() {
    var html = S.services.map(function (sv) {
      return '<article class="card card--lift service reveal">' +
        '<div class="card__icon">' + icon(sv.icon) + "</div>" +
        '<div class="service__meta">' + sv.tags.map(function (t, i) {
          return '<span class="pill' + (i === 0 ? " pill--accent" : "") + '">' + esc(t) + "</span>";
        }).join("") + "</div>" +
        "<h3>" + esc(sv.t) + "</h3><p>" + esc(sv.d) + "</p>" +
        "<ul>" + sv.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" +
        '<div class="service__foot">' +
          '<span class="small muted">' + sv.mins + " λεπτά</span>" +
          '<a class="btn btn--soft" href="#/rantevou" data-service="' + sv.id + '">Κλείσε ' + icon("arrow") + "</a>" +
        "</div></article>";
    }).join("");
    $("#servicesGrid").innerHTML = html;
    $("#servicesTeaser").innerHTML = S.services.slice(0, 3).map(function (sv) {
      return '<article class="card card--lift reveal">' +
        '<div class="card__icon">' + icon(sv.icon) + "</div>" +
        "<h3>" + esc(sv.t) + "</h3>" +
        '<p class="small muted">' + esc(sv.d) + "</p>" +
        '<p class="small" style="margin-top:1rem"><a href="#/ypiresies" style="color:var(--accent);font-weight:600;text-decoration:none">Περισσότερα →</a></p>' +
        "</article>";
    }).join("");
    /* προεπιλογή υπηρεσίας όταν έρχεσαι από κάρτα */
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-service]");
      if (a) window.__preselectService = a.getAttribute("data-service");
    });
  }

  /* ── rendering: διαπιστευτήρια ──────────────────────────────────────── */
  function renderCreds() {
    $("#credList").innerHTML = S.credentials.map(function (c) {
      return '<li><span class="yr">' + esc(c.yr) + "</span><div><b>" + esc(c.t) + "</b><span>" + esc(c.s) + "</span></div></li>";
    }).join("");
    $("#memberships").innerHTML = S.memberships.map(function (m) {
      return '<span class="pill">' + esc(m) + "</span>";
    }).join(" ");
    $("#approachGrid").innerHTML = S.profile.approach.map(function (a) {
      return '<article class="card reveal"><h3>' + esc(a.t) + '</h3><p class="small muted">' + esc(a.d) + "</p></article>";
    }).join("");
  }

  /* ── rendering: έρευνα ──────────────────────────────────────────────── */
  function scholar(title) {
    return "https://scholar.google.com/scholar?q=" + encodeURIComponent(title);
  }
  function renderResearch() {
    var cats = ["Όλα"].concat(S.research.map(function (r) { return r.cat; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    $("#researchFilters").innerHTML = cats.map(function (c, i) {
      return '<button class="chip' + (i === 0 ? " is-on" : "") + '" data-cat="' + esc(c) + '">' + esc(c) + "</button>";
    }).join("");

    function draw(cat) {
      var list = cat === "Όλα" ? S.research : S.research.filter(function (r) { return r.cat === cat; });
      $("#researchGrid").innerHTML = list.map(function (r) {
        /* ο τίτλος της εργασίας είναι ό,τι προηγείται του πρώτου "." μετά το έτος */
        var q = r.src.replace(/^[^)]*\)\.\s*/, "").split(/\.\s/)[0];
        return '<article class="card card--lift study reveal">' +
          '<span class="pill pill--sky" style="align-self:flex-start;margin-bottom:.9rem">' + esc(r.cat) + "</span>" +
          "<h3>" + esc(r.t) + "</h3>" +
          '<p class="study__take">' + r.take + "</p>" +
          '<p class="small muted">' + esc(r.why) + "</p>" +
          '<p class="study__src">' + esc(r.src) + "<br>" +
            '<a href="' + esc(scholar(q)) + '" target="_blank" rel="noopener">Δες την πηγή ↗</a></p>' +
          "</article>";
      }).join("");
      observeReveals();
    }
    draw("Όλα");
    $("#researchFilters").addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      $$(".chip", this).forEach(function (c) { c.classList.remove("is-on"); });
      b.classList.add("is-on");
      draw(b.getAttribute("data-cat"));
    });
  }

  /* ── rendering: feed ────────────────────────────────────────────────── */
  function renderFeed() {
    var ig = S.instagram;
    function postHtml(p) {
      var bg = p.img
        ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">'
        : "";
      var kindIcon = p.kind === "reel" ? "play" : p.kind === "carousel" ? "copy" : "ig";
      return '<a class="post" href="' + esc(p.url || ig.url) + '" target="_blank" rel="noopener">' +
        '<span class="post__bg" style="background:linear-gradient(150deg,' + esc(p.g[0]) + "," + esc(p.g[1]) + ')">' + bg + "</span>" +
        '<span class="post__veil"></span>' +
        '<span class="post__kind">' + icon(kindIcon) + "</span>" +
        '<span class="post__body"><p>' + esc(p.cap) + "</p>" +
          '<span class="post__stats"><span>♥ ' + p.likes + "</span><span>💬 " + p.comments + "</span><span>" + esc(p.when) + "</span></span>" +
        "</span></a>";
    }
    $("#feedGrid").innerHTML = ig.posts.map(postHtml).join("");
    $("#feedTeaser").innerHTML = ig.posts.slice(0, 4).map(postHtml).join("");
    $$("[data-ig-handle]").forEach(function (el) { el.textContent = ig.handle; });
    $$("[data-ig-url]").forEach(function (el) { el.href = ig.url; });
  }

  /* ── rendering: FAQ ─────────────────────────────────────────────────── */
  function renderFaq() {
    $("#faqList").innerHTML = S.faq.map(function (f, i) {
      return '<div class="faq__item"><h3 style="margin:0">' +
        '<button class="faq__q" aria-expanded="false" aria-controls="faq-a-' + i + '">' +
        "<span>" + esc(f.q) + "</span>" + icon("plus") + "</button></h3>" +
        '<div class="faq__a" id="faq-a-' + i + '"><div><p>' + esc(f.a) + "</p></div></div></div>";
    }).join("");
    $("#faqList").addEventListener("click", function (e) {
      var b = e.target.closest(".faq__q");
      if (!b) return;
      var item = b.closest(".faq__item");
      var open = item.classList.toggle("is-open");
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ── rendering: επικοινωνία, ώρες, footer ───────────────────────────── */
  function renderContact() {
    var c = S.contact;
    $("#contactList").innerHTML = [
      { i: "pin",   t: "Γραφείο", v: esc(c.address) + "<br>" + esc(c.city), href: c.mapsUrl, ext: true },
      { i: "mail",  t: "Email",   v: esc(c.email), href: "mailto:" + c.email },
      { i: "phone", t: "Τηλέφωνο", v: esc(c.phone), href: "tel:" + c.phoneHref },
      { i: "video", t: "Online συνεδρίες", v: "Σύνδεσμος βιντεοκλήσης αποστέλλεται με την επιβεβαίωση." }
    ].map(function (r) {
      var body = r.href
        ? '<a href="' + esc(r.href) + '"' + (r.ext ? ' target="_blank" rel="noopener"' : "") + ">" + r.v + "</a>"
        : "<span>" + r.v + "</span>";
      return '<li><span class="ico">' + icon(r.i) + "</span><div><b>" + r.t + "</b>" + body + "</div></li>";
    }).join("");

    var today = new Date().getDay();
    $("#hoursList").innerHTML = S.hours.map(function (h) {
      return '<li class="' + (h.d === today ? "is-today" : "") + '"><span>' + esc(h.l) + "</span><span>" + esc(h.h) + "</span></li>";
    }).join("");

    $$("[data-contact-email]").forEach(function (el) { el.textContent = c.email; el.href = "mailto:" + c.email; });
    $$("[data-contact-phone]").forEach(function (el) { el.textContent = c.phone; el.href = "tel:" + c.phoneHref; });
    $("#socials").innerHTML =
      '<a href="' + esc(c.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon("ig") + "</a>" +
      '<a href="' + esc(c.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn">' + icon("inn") + "</a>" +
      '<a href="mailto:' + esc(c.email) + '" aria-label="Email">' + icon("mail") + "</a>";
    $("#year").textContent = new Date().getFullYear();
  }

  /* ── προφίλ στο DOM ─────────────────────────────────────────────────── */
  function renderProfile() {
    var p = S.profile;
    $$("[data-p-name]").forEach(function (el) { el.textContent = p.name; });
    $$("[data-p-role]").forEach(function (el) { el.textContent = p.role; });
    $$("[data-p-licence]").forEach(function (el) { el.textContent = p.licence; });
    $("#heroFacts").innerHTML = p.facts.map(function (f) {
      return '<div class="hero__fact"><strong>' + esc(f.n) + "</strong><span>" + esc(f.l) + "</span></div>";
    }).join("");
    $("#heroIntro").textContent = p.intro;
  }

  /* ── init ───────────────────────────────────────────────────────────── */
  function init() {
    renderProfile();
    renderServices();
    renderCreds();
    renderResearch();
    renderFeed();
    renderFaq();
    renderContact();
    initTheme();
    initHeader();
    initDrawer();
    initRouter();
    observeReveals();
    watchCaps();

    if (window.Breather)  window.Breather.init();
    if (window.Screening) window.Screening.init();
    if (window.Booking)   window.Booking.init();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
