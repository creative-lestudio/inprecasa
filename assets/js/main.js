/* INPRECASA — site behaviour (vanilla JS, no dependencies) */
(function () {
  "use strict";

  /* ======================================================================
     Configuration — edit here
     ====================================================================== */
  // Optional form backend. Leave "" to open the visitor's email app (mailto) instead.
  // Example: "https://formspree.io/f/xxxxxxx" — receives a JSON POST.
  var FORM_ENDPOINT = "";
  var FORM_TO = "inprecasa@inprecasa.com";

  // Approvals / certifications / manufacturer authorisations.
  // Add real entries once the documentation is supplied; they render in #approvals.
  // { name: "Name of approval", logo: "assets/img/approvals/file.svg" }
  var APPROVALS = [];

  var SERVICES = [
    { id: "liferafts", img: "assets/img/liferafts", alt: "Liferaft inflated on open water", eq: ["services.lsa.eq1", "services.lsa.eq3"] },
    { id: "lifeboats", img: "assets/img/lifeboats", alt: "Lifeboat entering the water", eq: ["services.lsa.eq2", "services.lsa.eq4"] },
    { id: "fire", img: "assets/img/firefighting", alt: "Firefighter handling a fire extinguisher", eq: ["services.fire.eq1", "services.fire.eq2", "services.fire.eq3"] },
    { id: "ppe", img: "assets/img/ppe", alt: "Lifebuoys on a vessel deck at sunset", eq: ["services.ppe.eq1", "services.ppe.eq2", "services.ppe.eq3", "services.ppe.eq4"] },
    { id: "crane", img: "assets/img/crane-load-test", alt: "Crane lifting a heavy load at a port", eq: ["services.testing.eq1", "services.testing.eq2"] },
    { id: "calib", img: "assets/img/calibration", alt: "Technician calibrating gas detectors in a laboratory", eq: ["services.testing.eq3", "services.testing.eq4"] }
  ];

  var META = {
    en: { t: "INPRECASA | Maritime Safety & Fire Protection — Canary Islands", d: "Inspection, servicing and certification of liferafts, lifeboats, fire-fighting systems and personal protective equipment, plus crane load tests and calibration. Bases in Tenerife and Las Palmas." },
    es: { t: "INPRECASA | Seguridad marítima y protección contra incendios — Canarias", d: "Inspección, mantenimiento y certificación de balsas salvavidas, botes, sistemas contra incendios y EPI, además de pruebas de carga de grúas y calibración. Sedes en Tenerife y Las Palmas." },
    de: { t: "INPRECASA | Schiffssicherheit & Brandschutz — Kanarische Inseln", d: "Inspektion, Wartung und Zertifizierung von Rettungsinseln, Rettungsbooten, Brandbekämpfungssystemen und Schutzausrüstung sowie Kranlastprüfungen und Kalibrierung. Standorte auf Teneriffa und in Las Palmas." },
    fr: { t: "INPRECASA | Sécurité maritime et protection incendie — Îles Canaries", d: "Inspection, maintenance et certification de radeaux, canots, systèmes anti-incendie et EPI, essais de charge de grues et étalonnage. Bases à Tenerife et à Las Palmas." },
    it: { t: "INPRECASA | Sicurezza marittima e antincendio — Isole Canarie", d: "Ispezione, manutenzione e certificazione di zattere, imbarcazioni di salvataggio, sistemi antincendio e DPI, prove di carico gru e calibrazione. Sedi a Tenerife e Las Palmas." }
  };

  var T = window.INPRECASA_I18N || {};
  var supported = ["en", "es", "de", "fr", "it"];
  var STORAGE_KEY = "inprecasa-lang";
  var lang = "en";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function t(key) { var d = T[lang] || T.en || {}; return d[key] !== undefined ? d[key] : ((T.en || {})[key] || ""); }

  /* ======================================================================
     i18n
     ====================================================================== */
  function initialLang() {
    try { var s = localStorage.getItem(STORAGE_KEY); if (s && supported.indexOf(s) > -1) return s; } catch (e) {}
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return supported.indexOf(n) > -1 ? n : "en";
  }

  function applyLang(l) {
    if (supported.indexOf(l) === -1) l = "en";
    lang = l;
    $$("[data-i18n]").forEach(function (el) { var v = t(el.getAttribute("data-i18n")); if (v) el.textContent = v; });
    $$("[data-i18n-html]").forEach(function (el) { var v = t(el.getAttribute("data-i18n-html")); if (v) el.innerHTML = v; });
    document.documentElement.lang = l;
    document.title = META[l].t;
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", META[l].d);
    $$(".lang-option, .footer-lang").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-lang") === l); });
    $("#lang-label").textContent = l.toUpperCase();
    $("#nav-toggle").setAttribute("aria-label", t("nav.menu"));
    try { localStorage.setItem(STORAGE_KEY, l); } catch (e) {}
    renderServices();
    renderApprovals();
    buildServiceSelect();
  }

  var langSwitch = $("#lang-switch"), langToggle = $("#lang-toggle");
  function closeLang() { langSwitch.classList.remove("is-open"); langToggle.setAttribute("aria-expanded", "false"); }
  langToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = langSwitch.classList.toggle("is-open");
    langToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", function (e) { if (!langSwitch.contains(e.target)) closeLang(); });
  $$(".lang-option, .footer-lang").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); applyLang(b.getAttribute("data-lang")); closeLang(); });
  });

  /* ======================================================================
     Header, mobile menu, call sheet
     ====================================================================== */
  var header = $("#site-header");
  function onScroll() { header.classList.toggle("is-condensed", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var navToggle = $("#nav-toggle"), mobileMenu = $("#mobile-menu");
  function setMenu(open) {
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("no-scroll", open);
  }
  navToggle.addEventListener("click", function () { setMenu(!mobileMenu.classList.contains("is-open")); });
  $$("a", mobileMenu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 1024) setMenu(false); });

  var sheet = $("#sheet"), sheetBackdrop = $("#sheet-backdrop"), lastFocus = null;
  function setSheet(open) {
    sheet.classList.toggle("is-open", open);
    sheetBackdrop.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("no-scroll", open);
    if (open) { lastFocus = document.activeElement; var f = $("a", sheet); if (f) f.focus(); }
    else if (lastFocus) { lastFocus.focus(); }
  }
  $("#m-call").addEventListener("click", function () { setSheet(true); });
  $("#sheet-close").addEventListener("click", function () { setSheet(false); });
  sheetBackdrop.addEventListener("click", function () { setSheet(false); });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeLang();
    if (mobileMenu.classList.contains("is-open")) setMenu(false);
    if (sheet.classList.contains("is-open")) setSheet(false);
  });

  /* ======================================================================
     Services explorer (accessible tabs)
     ====================================================================== */
  var tabsEl = $("#svc-tabs"), activeSvc = 0;

  function svcName(s) { return t("svc." + s.id + ".name"); }

  function renderServices() {
    tabsEl.innerHTML = "";
    SERVICES.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "svc-tab"; b.setAttribute("role", "tab");
      b.id = "svc-tab-" + s.id;
      b.setAttribute("aria-selected", i === activeSvc ? "true" : "false");
      b.tabIndex = i === activeSvc ? 0 : -1;
      b.innerHTML = '<span class="svc-tab-n">0' + (i + 1) + '</span><span class="svc-tab-name"></span>';
      b.lastChild.textContent = svcName(s);
      b.addEventListener("click", function () { selectService(i, true); });
      b.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % SERVICES.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + SERVICES.length) % SERVICES.length;
        else if (e.key === "Home") n = 0; else if (e.key === "End") n = SERVICES.length - 1;
        if (n !== null) { e.preventDefault(); selectService(n, true); $("#svc-tab-" + SERVICES[n].id).focus(); }
      });
      tabsEl.appendChild(b);
    });
    fillPanel(false);
  }

  function fillPanel(animate) {
    var s = SERVICES[activeSvc], img = $("#svc-img");
    $("#svc-panel").setAttribute("aria-labelledby", "svc-tab-" + s.id);
    $("#svc-code").textContent = "0" + (activeSvc + 1) + " / 0" + SERVICES.length;
    $("#svc-name").textContent = svcName(s);
    $("#svc-what").textContent = t("svc." + s.id + ".what");
    var ul = $("#svc-eq"); ul.innerHTML = "";
    s.eq.forEach(function (k) { var li = document.createElement("li"); li.textContent = t(k); ul.appendChild(li); });
    $("#svc-cta").setAttribute("data-service", s.id);
    var src = s.img + ".webp";
    if (img.getAttribute("src") !== src) { img.src = src; }
    img.alt = s.alt;
    if (animate) { var p = $(".svc-text"); p.classList.remove("svc-fade"); void p.offsetWidth; p.classList.add("svc-fade"); }
  }

  function selectService(i, animate) {
    activeSvc = i;
    $$(".svc-tab", tabsEl).forEach(function (b, k) {
      b.setAttribute("aria-selected", k === i ? "true" : "false"); b.tabIndex = k === i ? 0 : -1;
    });
    fillPanel(animate);
  }

  /* Pre-select service in the form from any [data-service] CTA */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-service]");
    if (!a) return;
    var sel = $("#f-service");
    sel.value = a.getAttribute("data-service") === "approvals" ? "other" : a.getAttribute("data-service");
    if (a.getAttribute("data-service") === "approvals") {
      var m = $('textarea[name="message"]');
      if (m && !m.value) m.value = t("comp.dossier.t");
    }
  });

  function buildServiceSelect() {
    var sel = $("#f-service"), cur = sel.value;
    sel.innerHTML = "";
    var o0 = document.createElement("option"); o0.value = ""; o0.textContent = t("form.serviceSelect"); sel.appendChild(o0);
    SERVICES.forEach(function (s) { var o = document.createElement("option"); o.value = s.id; o.textContent = svcName(s); sel.appendChild(o); });
    var oo = document.createElement("option"); oo.value = "other"; oo.textContent = t("form.serviceOther"); sel.appendChild(oo);
    sel.value = cur;
  }

  /* ======================================================================
     Approvals (rendered only when data exists)
     ====================================================================== */
  function renderApprovals() {
    var box = $("#approvals"); box.innerHTML = "";
    APPROVALS.forEach(function (a) {
      var d = document.createElement("div"); d.className = "approval";
      if (a.logo) { var im = document.createElement("img"); im.src = a.logo; im.alt = a.name; im.loading = "lazy"; d.appendChild(im); }
      var s = document.createElement("span"); s.textContent = a.name; d.appendChild(s);
      box.appendChild(d);
    });
  }

  /* ======================================================================
     Maps — load Google Maps only on request (privacy + performance)
     ====================================================================== */
  $$(".loc-map").forEach(function (box) {
    var btn = $(".loc-map-load", box);
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = box.getAttribute("data-map"); f.title = box.getAttribute("data-title") + " — Google Maps";
      f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true;
      box.appendChild(f); btn.remove();
    });
  });

  /* ======================================================================
     Scroll effects: reveal, process, stat counters, nav highlight, action bar
     ====================================================================== */
  function observe(els, cb, opts) {
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { cb(e, true, null); }); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { cb(en.target, en.isIntersecting, io); }); }, opts);
    els.forEach(function (e) { io.observe(e); });
  }

  observe($$("[data-reveal]"), function (el, vis, io) { if (vis) { el.classList.add("is-visible"); if (io) io.unobserve(el); } }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  observe($$(".proc-step"), function (el, vis) { if (vis) el.classList.add("is-active"); }, { threshold: 0.7, rootMargin: "0px 0px -10% 0px" });

  observe($$("[data-count]"), function (el, vis, io) {
    if (!vis) return; if (io) io.unobserve(el);
    var end = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = end; return; }
    var t0 = null, dur = 1100;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    el.textContent = "0"; requestAnimationFrame(step);
  }, { threshold: 0.6 });

  var navLinks = $$(".main-nav a");
  observe($$("main section[id]"), function (el, vis) {
    if (!vis) return;
    navLinks.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + el.id); });
  }, { rootMargin: "-45% 0px -50% 0px" });

  var mbar = $("#m-bar");
  observe([$("#contact")], function (el, vis) { mbar.classList.toggle("is-hidden", vis); }, { threshold: 0.25 });

  /* ======================================================================
     Contact form
     ====================================================================== */
  function validIMO(v) {
    if (!/^\d{7}$/.test(v)) return false;
    var s = 0; for (var i = 0; i < 6; i++) s += parseInt(v[i], 10) * (7 - i);
    return s % 10 === parseInt(v[6], 10);
  }

  var form = $("#contact-form"), statusEl = $("#form-status");
  function setErr(input, msg) {
    var wrap = input.closest(".field"); if (!wrap) return;
    wrap.classList.toggle("has-error", !!msg);
    var e = $(".field-err", wrap); if (e) e.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function status(msg, kind) { statusEl.textContent = msg || ""; statusEl.className = "form-status" + (kind ? " is-" + kind : ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault(); status("");
    var f = form.elements, ok = true, first = null;
    function bad(el, m) { setErr(el, m); ok = false; if (!first) first = el; }
    ["company", "name", "email", "imo"].forEach(function (n) { setErr(f[n], ""); });
    $("#privacy-err").textContent = "";
    if (!f.company.value.trim()) bad(f.company, t("form.required"));
    if (!f.name.value.trim()) bad(f.name, t("form.required"));
    if (!f.email.value.trim()) bad(f.email, t("form.required"));
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.value.trim())) bad(f.email, t("form.errEmail"));
    if (f.imo.value.trim() && !validIMO(f.imo.value.trim())) bad(f.imo, t("form.errImo"));
    if (!f.privacy.checked) { $("#privacy-err").textContent = t("form.errPrivacy"); ok = false; if (!first) first = f.privacy; }
    if (!ok) { first.focus(); return; }
    if (f.website.value) return; // honeypot

    var svcLabel = f.service.value ? f.service.options[f.service.selectedIndex].text : "—";
    var data = {
      company: f.company.value.trim(), name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
      vessel: f.vessel.value.trim(), imo: f.imo.value.trim(), service: svcLabel, location: f.location.value || "—",
      date: f.date.value || "—", message: f.message.value.trim(), language: lang
    };

    if (FORM_ENDPOINT) {
      var btn = $("#f-submit"); btn.disabled = true; status(t("form.sending"));
      fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); status(t("form.sent"), "ok"); form.reset(); })
        .catch(function () { status(t("form.error"), "err"); })
        .then(function () { btn.disabled = false; });
      return;
    }

    var subject = "Service request — " + svcLabel + (data.vessel ? " — " + data.vessel : "");
    var body = [
      "Company: " + data.company, "Contact: " + data.name, "Email: " + data.email, "Phone: " + (data.phone || "—"),
      "Vessel: " + (data.vessel || "—") + (data.imo ? " (IMO " + data.imo + ")" : ""),
      "Service: " + data.service, "Location: " + data.location, "Preferred date: " + data.date, "",
      data.message || ""
    ].join("\n");
    status(t("form.statusMsg"), "ok");
    window.location.href = "mailto:" + FORM_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
  $$("input, select, textarea", form).forEach(function (el) { el.addEventListener("input", function () { setErr(el, ""); }); });

  /* ======================================================================
     Init
     ====================================================================== */
  $("#year").textContent = new Date().getFullYear();
  var deep = (location.hash.match(/^#services\/(\w+)/) || [])[1];
  if (deep) { var ix = SERVICES.map(function (s) { return s.id; }).indexOf(deep); if (ix > -1) activeSvc = ix; }
  applyLang(initialLang());
})();
