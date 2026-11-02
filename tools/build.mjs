/* INPRECASA static site generator.
 *
 * Input : src/home.template.html (shared shell + home sections), src/i18n.json
 * Output: /index.html (language selector), /{lang}/index.html, /{lang}/{services}/{slug}/index.html,
 *         assets/js/i18n/{lang}.js, sitemap.xml, robots.txt
 *
 *   npm run build           production (https://inprecasa.com, indexable)
 *   npm run build:preview   GitHub Pages preview (noindex, URLs point to the preview host)
 */
import { load } from "cheerio";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = (process.env.SITE_URL || "https://inprecasa.com").replace(/\/$/, "");
const PREVIEW = !!process.env.PREVIEW;

const LANGS = ["en", "es", "de", "fr", "it"];
const LOCALE = { en: "en_US", es: "es_ES", de: "de_DE", fr: "fr_FR", it: "it_IT" };
const LANG_NAME = { en: "English", es: "Español", de: "Deutsch", fr: "Français", it: "Italiano" };
const SVC_DIR = { en: "services", es: "servicios", de: "leistungen", fr: "services", it: "servizi" };

const SERVICES = [
  { id: "liferafts", img: "liferafts", eq: ["services.lsa.eq1", "services.lsa.eq3"],
    slug: { en: "liferafts", es: "balsas-salvavidas", de: "rettungsinseln", fr: "radeaux-de-sauvetage", it: "zattere-di-salvataggio" } },
  { id: "lifeboats", img: "lifeboats", eq: ["services.lsa.eq2", "services.lsa.eq4"],
    slug: { en: "lifeboats", es: "botes-salvavidas", de: "rettungsboote", fr: "canots-de-sauvetage", it: "imbarcazioni-di-salvataggio" } },
  { id: "fire", img: "firefighting", eq: ["services.fire.eq1", "services.fire.eq2", "services.fire.eq3"],
    slug: { en: "fire-fighting-systems", es: "sistemas-contra-incendios", de: "brandbekaempfung", fr: "systemes-incendie", it: "sistemi-antincendio" } },
  { id: "ppe", img: "ppe", eq: ["services.ppe.eq1", "services.ppe.eq2", "services.ppe.eq3", "services.ppe.eq4"],
    slug: { en: "personal-protective-equipment", es: "equipos-proteccion-individual", de: "schutzausruestung", fr: "equipements-protection-individuelle", it: "dispositivi-protezione-individuale" } },
  { id: "crane", img: "crane-load-test", eq: ["services.testing.eq1", "services.testing.eq2"],
    slug: { en: "crane-load-tests", es: "pruebas-carga-grua", de: "kranlastpruefung", fr: "essais-de-charge-grues", it: "prove-di-carico-gru" } },
  { id: "calib", img: "calibration", eq: ["services.testing.eq3", "services.testing.eq4"],
    slug: { en: "calibration-services", es: "servicios-calibracion", de: "kalibrierung", fr: "etalonnage", it: "calibrazione" } }
];

const DICT = JSON.parse(readFileSync(join(ROOT, "src/i18n.json"), "utf8"));
const TEMPLATE = readFileSync(join(ROOT, "src/home.template.html"), "utf8");
const TODAY = new Date().toISOString().slice(0, 10);

/* ---------- URL helpers ---------- */
const pathHome = (l) => `/${l}/`;
const pathSvc = (l, s) => `/${l}/${SVC_DIR[l]}/${s.slug[l]}/`;
const abs = (p) => SITE + p;
const trunc = (s, n = 158) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

function write(rel, content) {
  const f = join(ROOT, rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, content);
}

/* ---------- Generated output cleanup ---------- */
for (const l of LANGS) rmSync(join(ROOT, l), { recursive: true, force: true });

/* ---------- Shared pieces ---------- */
function orgGraph() {
  return [
    {
      "@type": "Organization", "@id": abs("/#organization"), name: "INPRECASA",
      legalName: "Industria de Prevención Canaria, S.L.", url: abs("/"),
      logo: abs("/assets/img/inprecasa-logo.svg"), email: "inprecasa@inprecasa.com", slogan: "Your safety at sea",
      areaServed: "Canary Islands",
      department: [
        { "@type": "LocalBusiness", "@id": abs("/#tenerife"), name: "INPRECASA Tenerife", telephone: "+34922650131",
          address: { "@type": "PostalAddress", streetAddress: "C/ Fonseca, 10, La Cuesta", postalCode: "38320", addressLocality: "San Cristóbal de La Laguna", addressRegion: "Santa Cruz de Tenerife", addressCountry: "ES" },
          geo: { "@type": "GeoCoordinates", latitude: 28.4578823, longitude: -16.2939048 } },
        { "@type": "LocalBusiness", "@id": abs("/#laspalmas"), name: "INPRECASA Las Palmas", telephone: "+34928469422",
          address: { "@type": "PostalAddress", streetAddress: "C/ Sucre, 22 Izq, El Sebadal", postalCode: "35008", addressLocality: "Las Palmas de Gran Canaria", addressRegion: "Las Palmas", addressCountry: "ES" },
          geo: { "@type": "GeoCoordinates", latitude: 28.1568198, longitude: -15.416858 } }
      ]
    },
    { "@type": "WebSite", "@id": abs("/#website"), url: abs("/"), name: "INPRECASA", publisher: { "@id": abs("/#organization") }, inLanguage: LANGS }
  ];
}

function translate($, dict) {
  $("[data-i18n]").each((_, el) => {
    const v = dict[$(el).attr("data-i18n")];
    if (v !== undefined) $(el).text(v);
    $(el).removeAttr("data-i18n");
  });
  $("#nav-toggle").attr("aria-label", dict["nav.menu"]);
  $("[data-i18n-html]").each((_, el) => {
    const v = dict[$(el).attr("data-i18n-html")];
    if (v !== undefined) $(el).html(v);
    $(el).removeAttr("data-i18n-html");
  });
}

function applyHead($, { lang, title, description, canonicalPath, alternates, rel, ld, ogType = "website" }) {
  $("html").attr("lang", lang);
  $("title").text(title);
  $('meta[name="description"]').attr("content", description);
  $('link[rel="canonical"], meta[property^="og:"], meta[name="twitter:card"], script[type="application/ld+json"], link[rel="alternate"]').remove();
  const head = $("head");
  const tags = [];
  if (PREVIEW) tags.push('<meta name="robots" content="noindex, nofollow">');
  tags.push(`<link rel="canonical" href="${abs(canonicalPath)}">`);
  for (const [hl, p] of Object.entries(alternates)) tags.push(`<link rel="alternate" hreflang="${hl}" href="${abs(p)}">`);
  tags.push(
    `<meta property="og:type" content="${ogType}">`, '<meta property="og:site_name" content="INPRECASA">',
    `<meta property="og:title" content="${title.replace(/"/g, "&quot;")}">`,
    `<meta property="og:description" content="${description.replace(/"/g, "&quot;")}">`,
    `<meta property="og:url" content="${abs(canonicalPath)}">`,
    `<meta property="og:image" content="${abs("/assets/img/og-image.jpg")}">`,
    `<meta property="og:locale" content="${LOCALE[lang]}">`,
    ...LANGS.filter((x) => x !== lang).map((x) => `<meta property="og:locale:alternate" content="${LOCALE[x]}">`),
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": ld })}</script>`
  );
  $('meta[name="theme-color"]').after("\n" + tags.join("\n") + "\n");
}

function fixPaths($, rel) {
  $("[src], [href]").each((_, el) => {
    for (const a of ["src", "href"]) {
      const v = $(el).attr(a);
      if (v && (v.startsWith("assets/") || v.startsWith("legal.html"))) $(el).attr(a, rel + v);
    }
  });
  $('script[src="' + rel + 'assets/js/i18n.js"]').remove();
}

function languageSwitch($, lang, altPaths, rel) {
  $(".lang-option").each((_, el) => {
    const l = $(el).attr("data-lang");
    const a = $(`<a class="lang-option${l === lang ? " is-active" : ""}" role="menuitem" data-lang="${l}" hreflang="${l}" lang="${l}" href="${rel_from(rel, altPaths[l])}"><span class="lang-option-code">${l.toUpperCase()}</span>${LANG_NAME[l]}</a>`);
    $(el).replaceWith(a);
  });
  $(".footer-lang").each((_, el) => {
    const l = $(el).attr("data-lang");
    $(el).attr({ href: rel_from(rel, altPaths[l]), hreflang: l, lang: l });
    if (l === lang) $(el).addClass("is-active");
  });
  $("#lang-label").text(lang.toUpperCase());
}
// relative URL from the current page (depth encoded in `rel`) to an absolute site path
function rel_from(rel, p) { return rel + p.replace(/^\//, ""); }

function footerServices($, lang, rel) {
  const dict = DICT[lang];
  const links = SERVICES.map((s) => `<a href="${rel_from(rel, pathSvc(lang, s))}">${dict[`svc.${s.id}.name`]}</a>`).join("");
  const col = $(`<div class="footer-col"><h4>${dict["footer.services"]}</h4>${links}</div>`);
  $(".footer-grid .footer-col").eq(1).before(col);
}

/* ---------- Home page ---------- */
function buildHome(lang) {
  const dict = DICT[lang];
  const rel = "../";
  const $ = load(TEMPLATE);
  translate($, dict);

  const alternates = Object.fromEntries(LANGS.map((l) => [l, pathHome(l)])); alternates["x-default"] = "/";
  const altPaths = Object.fromEntries(LANGS.map((l) => [l, pathHome(l)]));

  const faq = ["1", "2", "3"].map((n) => ({ "@type": "Question", name: dict[`faq.q${n}`], acceptedAnswer: { "@type": "Answer", text: dict[`faq.a${n}`] } }));
  applyHead($, {
    lang, rel, canonicalPath: pathHome(lang), alternates,
    title: dict["meta.title"] || $("title").text(), description: dict["meta.description"] || $('meta[name="description"]').attr("content"),
    ld: [...orgGraph(), { "@type": "FAQPage", mainEntity: faq }]
  });

  const slugs = Object.fromEntries(SERVICES.map((s) => [s.id, `${SVC_DIR[lang]}/${s.slug[lang]}/`]));
  $("#svc-tabs").attr("data-slugs", JSON.stringify(slugs));
  $("#svc-cta").after(`<a href="#" class="btn btn-outline" id="svc-more">${dict["svc.more"]}</a>`);
  $("#year").text(new Date().getFullYear());

  fixPaths($, rel);
  $('script[src$="assets/js/main.js"]').before(`<script src="${rel}assets/js/i18n/${lang}.js"></script>\n`);
  languageSwitch($, lang, altPaths, rel);
  footerServices($, lang, rel);
  write(`${lang}/index.html`, $.html());
}

/* ---------- Service pages ---------- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildService(lang, svc, idx) {
  const dict = DICT[lang];
  const rel = "../../../";
  const homeRel = "../../";
  const $ = load(TEMPLATE);
  const name = dict[`svc.${svc.id}.name`], what = dict[`svc.${svc.id}.what`];
  const processHtml = $.html($("#process"));
  const ctaHtml = $.html($(".cta-band"));
  const contactHtml = $.html($("#contact"));

  const eq = svc.eq.map((k) => `<li>${esc(dict[k])}</li>`).join("");
  const related = SERVICES.filter((s) => s.id !== svc.id).map((s) =>
    `<a class="rel-card" href="${rel_from(rel, pathSvc(lang, s))}"><img src="assets/img/${s.img}-640.webp" alt="" loading="lazy" width="640" height="485"><span class="rel-name">${esc(dict[`svc.${s.id}.name`])}</span><span class="rel-more">${esc(dict["svc.more"])} →</span></a>`).join("");
  const faqHtml = svc.id === "liferafts"
    ? `<section class="section" id="faq"><div class="section-inner faq-wrap"><div><span class="kicker">${esc(dict["faq.kicker"])}</span><h2 class="section-title">${esc(dict["faq.title"])}</h2></div><div class="faq-list">` +
      ["1", "2", "3"].map((n) => `<details class="faq"><summary>${esc(dict[`faq.q${n}`])}</summary><p>${esc(dict[`faq.a${n}`])}</p></details>`).join("") + `</div></div></section>` : "";

  const main = `
  <section class="sp-hero">
    <div class="section-inner">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${homeRel}">${esc(dict["nav.home"] || "Home")}</a><span aria-hidden="true">/</span><a href="${homeRel}#services">${esc(dict["crumb.services"])}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(name)}</span></nav>
      <div class="sp-grid">
        <div class="sp-copy">
          <span class="kicker">INPRECASA · ${esc(dict["svc.page.sub"])}</span>
          <h1 class="sp-title">${esc(name)}</h1>
          <p class="sp-lead">${esc(what)}</p>
          <p class="svc-label">${esc(dict["svc.eq"])}</p>
          <ul class="svc-eq">${eq}</ul>
          <div class="sp-actions">
            <a class="btn btn-primary" href="#contact" data-service="${svc.id}">${esc(dict["svc.requestThis"])}</a>
            <a class="btn btn-outline" href="tel:+34922650131">${esc(dict["floating.call"])} · +34 922 650 131</a>
          </div>
        </div>
        <div class="sp-media"><img src="assets/img/${svc.img}.webp" alt="${esc(name)}" width="1090" height="826" fetchpriority="high" decoding="async"></div>
      </div>
    </div>
  </section>
  ${processHtml}
  ${faqHtml}
  <section class="section section--tint related">
    <div class="section-inner">
      <span class="kicker">${esc(dict["services.kicker"])}</span>
      <h2 class="section-title">${esc(dict["svc.related"])}</h2>
      <div class="rel-grid">${related}</div>
    </div>
  </section>
  ${ctaHtml}
  ${contactHtml}`;
  $("main").html(main);
  $("body").attr("data-service", svc.id);
  translate($, dict);

  // Header / menu / footer anchors point back to the home page sections (except the local #contact)
  $('a[href^="#"]').each((_, el) => {
    const h = $(el).attr("href");
    if (h === "#contact" || h === "#main" || h === "#faq" && svc.id === "liferafts") return;
    if ($(el).closest("main").length && h === "#contact") return;
    $(el).attr("href", homeRel + (h === "#home" ? "" : h));
  });

  const alternates = Object.fromEntries(LANGS.map((l) => [l, pathSvc(l, svc)])); alternates["x-default"] = pathSvc("en", svc);
  const altPaths = Object.fromEntries(LANGS.map((l) => [l, pathSvc(l, svc)]));
  const title = `${name} — ${dict["svc.page.sub"]} | INPRECASA`;
  const url = pathSvc(lang, svc);
  applyHead($, {
    lang, rel, canonicalPath: url, alternates, title, description: trunc(what + " " + dict["svc.page.sub"] + "."),
    ld: [
      ...orgGraph(),
      { "@type": "Service", "@id": abs(url) + "#service", name, description: what, url: abs(url), serviceType: name,
        provider: { "@id": abs("/#organization") }, areaServed: [{ "@type": "AdministrativeArea", name: "Canary Islands" }] },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "INPRECASA", item: abs(pathHome(lang)) },
        { "@type": "ListItem", position: 2, name: dict["crumb.services"], item: abs(pathHome(lang) + "#services") },
        { "@type": "ListItem", position: 3, name, item: abs(url) } ] },
      ...(svc.id === "liferafts" ? [{ "@type": "FAQPage", mainEntity: ["1", "2", "3"].map((n) => ({ "@type": "Question", name: dict[`faq.q${n}`], acceptedAnswer: { "@type": "Answer", text: dict[`faq.a${n}`] } })) }] : [])
    ]
  });
  $("#year").text(new Date().getFullYear());

  fixPaths($, rel);
  $('script[src$="assets/js/main.js"]').before(`<script src="${rel}assets/js/i18n/${lang}.js"></script>\n`);
  languageSwitch($, lang, altPaths, rel);
  footerServices($, lang, rel);
  write(`${lang}${url.slice(lang.length + 1)}index.html`, $.html());
}

/* ---------- Runtime dictionaries (one per language) ---------- */
for (const l of LANGS) {
  write(`assets/js/i18n/${l}.js`, `/* generated by tools/build.mjs */\nwindow.INPRECASA_I18N = ${JSON.stringify({ [l]: DICT[l] })};\n`);
}

/* ---------- Root language selector ---------- */
function buildRoot() {
  const alts = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${abs(pathHome(l))}">`).join("\n") + `\n<link rel="alternate" hreflang="x-default" href="${abs("/")}">`;
  const links = LANGS.map((l) => `<a class="btn btn-outline" href="${l}/" hreflang="${l}" lang="${l}">${LANG_NAME[l]}</a>`).join("\n      ");
  write("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>INPRECASA | Maritime Safety &amp; Fire Protection — Canary Islands</title>
<meta name="description" content="INPRECASA — maritime safety and fire protection in the Canary Islands. Choose your language.">
<meta name="theme-color" content="#0D2E38">
${PREVIEW ? '<meta name="robots" content="noindex, nofollow">' : ""}
<link rel="canonical" href="${abs("/")}">
${alts}
<link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
<meta property="og:title" content="INPRECASA | Maritime Safety &amp; Fire Protection">
<meta property="og:image" content="${abs("/assets/img/og-image.jpg")}">
<link rel="stylesheet" href="assets/css/styles.css">
<script>
(function () {
  if (/[?&]choose\\b/.test(location.search)) return;
  var s = ["en", "es", "de", "fr", "it"], l;
  try { l = localStorage.getItem("inprecasa-lang"); } catch (e) {}
  if (s.indexOf(l) < 0) { l = (navigator.language || "en").slice(0, 2).toLowerCase(); if (s.indexOf(l) < 0) l = "en"; }
  location.replace(l + "/" + location.hash);
})();
</script>
</head>
<body style="background:var(--navy-950);color:#fff;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px">
  <main>
    <img src="assets/img/inprecasa-logo-white.svg" alt="INPRECASA" width="220" style="margin:0 auto 32px;height:auto">
    <p style="color:var(--steel-light);margin-bottom:24px">Maritime Safety &amp; Fire Protection — Canary Islands</p>
    <p style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">
      ${links}
    </p>
  </main>
  <style>main .btn-outline{border-color:rgba(255,255,255,.35);color:#fff}main .btn-outline:hover{background:#fff;color:var(--navy-950)}</style>
</body>
</html>
`);
}

/* ---------- Sitemap & robots ---------- */
function buildSitemap() {
  const entry = (loc, alts) => `  <url>\n    <loc>${abs(loc)}</loc>\n    <lastmod>${TODAY}</lastmod>\n${alts.map(([h, p]) => `    <xhtml:link rel="alternate" hreflang="${h}" href="${abs(p)}"/>`).join("\n")}\n  </url>`;
  const urls = [];
  const homeAlts = [...LANGS.map((l) => [l, pathHome(l)]), ["x-default", "/"]];
  for (const l of LANGS) urls.push(entry(pathHome(l), homeAlts));
  for (const s of SERVICES) {
    const alts = [...LANGS.map((l) => [l, pathSvc(l, s)]), ["x-default", pathSvc("en", s)]];
    for (const l of LANGS) urls.push(entry(pathSvc(l, s), alts));
  }
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`);
  write("robots.txt", PREVIEW ? "User-agent: *\nDisallow: /\n" : `User-agent: *\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`);
}

/* ---------- Run ---------- */
buildRoot();
for (const l of LANGS) {
  buildHome(l);
  SERVICES.forEach((s, i) => buildService(l, s, i));
}
buildSitemap();
console.log(`Built ${LANGS.length} home pages, ${LANGS.length * SERVICES.length} service pages for ${SITE}${PREVIEW ? " (preview, noindex)" : ""}`);
