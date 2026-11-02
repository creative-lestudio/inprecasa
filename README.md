# INPRECASA — sitio web

Sitio estático (HTML + CSS + JS vanilla, sin dependencias ni paso de build) de **Industria de Prevención Canaria, S.L.** — seguridad marítima y protección contra incendios, Canarias.

## Cómo funciona
El sitio es estático, pero **se genera** con un script (`tools/build.mjs`, usa `cheerio`) a partir de `src/home.template.html` + `src/i18n.json`:

- `/` → selector de idioma (redirige según el navegador; `x-default`).
- `/{en,es,de,fr,it}/` → portada completa, traducida y con `hreflang`, canonical y JSON-LD propios.
- `/{lang}/{servicios}/{slug}/` → **30 páginas de servicio** (6 servicios × 5 idiomas, con slugs traducidos, p. ej. `/es/servicios/balsas-salvavidas/`).
- `sitemap.xml` con alternates `hreflang`, `robots.txt`, `assets/js/i18n/{lang}.js`.

```bash
npm install            # solo la primera vez
npm run build:preview  # GitHub Pages (URLs del preview, noindex) ← estado actual del repo
npm run build          # producción: https://inprecasa.com, indexable
npm run serve          # http://localhost:8000
```
**Editar textos:** `src/i18n.json` (todos los idiomas) o `src/home.template.html` (estructura), y volver a ejecutar el build. No edites a mano `es/`, `en/`, `de/`, `fr/`, `it/`, `sitemap.xml` ni `robots.txt`: se regeneran.

**Salir a producción:** ejecutar `npm run build`, subir el resultado y apuntar el dominio `inprecasa.com` a Pages (Settings → Pages → Custom domain). Hasta entonces el preview lleva `noindex` para no competir con la web actual.

## Estructura
| Ruta | Contenido |
|---|---|
| `src/` | Plantilla fuente y diccionario i18n |
| `tools/build.mjs` | Generador (páginas por idioma y servicio, SEO) |
| `assets/css/styles.css` | Estilos mobile-first; tokens de marca en `:root` |
| `assets/js/main.js` | Comportamiento. Config al inicio: `FORM_ENDPOINT`, `APPROVALS`, `SERVICES` |
| `assets/img` | Fotos propias de INPRECASA (webp), logo SVG, favicon, og-image |
| `assets/fonts` | **Fjalla One** (titulares, la más cercana al logotipo), IBM Plex Sans/Mono (self-hosted) |
| `legal.html` | Aviso legal, privacidad y cookies |

## Pendiente de datos del cliente
- **Homologaciones / certificaciones**: añadir a `APPROVALS` en `main.js` (nombre + logo). Mientras esté vacío, la web muestra solo la tarjeta «solicitar homologaciones» (no hay marcadores de posición visibles).
- **Formulario**: sin backend usa `mailto:`. Para envío directo, poner un endpoint (p. ej. Formspree) en `FORM_ENDPOINT`.
- **Aviso legal**: añadir CIF y datos registrales (comentario `TODO` en `legal.html`).
- **Subvenciones**: el pie enlaza a los 3 PDF de inprecasa.com; falta confirmar su contenido y, si procede, mostrar los logos de financiación.
- **Fotos de instalaciones/equipo**: no se ha publicado ninguna foto genérica de stock; solo imágenes propias.
- **Cifras**: solo se usan las de la web original (30+ años, 2 sedes, 6 líneas de servicio).

## Auditoría resumida (prototipo anterior → esta versión)
| Hallazgo | Acción |
|---|---|
| 12 tarjetas «CERTIFICADO (por subir)» en marquesina | Eliminadas; sección «Cumplimiento y documentación» honesta + `APPROVALS` data-driven |
| Fotos de stock (Unsplash/Pexels) hotlinkeadas, con un comentario sobre Fred. Olsen | Sustituidas por las 8 fotos reales de inprecasa.com, optimizadas y alojadas en el repo |
| Información incoherente: «Five areas» / 4 pestañas / 6 servicios reales | 6 líneas de servicio, igual que la web actual de INPRECASA |
| Formulario no conectado; subida de archivos sin backend | `mailto:`/endpoint, validación, IMO con dígito de control, honeypot, consentimiento RGPD |
| Google Fonts y Google Maps cargaban al entrar (RGPD) | Fuentes propias; mapas solo al pulsar «Ver mapa» |
| Sin datos estructurados, sitemap, robots, favicon, og:image | JSON-LD (Organization, 2 sedes con geo, FAQPage), sitemap, robots, favicon, og-image |
| Móvil: barra con un solo teléfono (Las Palmas) | Barra «Llamar / Solicitar» con selector de sede, menú a pantalla completa, pestañas numeradas, objetivos táctiles ≥ 44 px, inputs 16 px, safe-area |
| Erratas en la web actual («INMEDIACY», «PHILOSPHY») | Valores redactados correctamente en 5 idiomas |

## Pendiente / siguientes pasos
1. Texto técnico propio para cada página de servicio (hoy usan solo contenido verificado de la web actual).
2. Analítica respetuosa con la privacidad + banner de cookies, solo si se decide añadirla.
3. Casos de éxito / clientes y homologaciones con logos cuando haya material.
