# INPRECASA — sitio web

Sitio estático (HTML + CSS + JS vanilla, sin dependencias ni paso de build) de **Industria de Prevención Canaria, S.L.** — seguridad marítima y protección contra incendios, Canarias.

```bash
python3 -m http.server 8000   # abrir http://localhost:8000
```

## Estructura
| Ruta | Contenido |
|---|---|
| `index.html` | Página principal (SEO, JSON-LD, secciones) |
| `legal.html` | Aviso legal, privacidad y cookies |
| `assets/css/styles.css` | Estilos mobile-first; tokens de marca en `:root` |
| `assets/js/main.js` | Comportamiento. Config al inicio: `FORM_ENDPOINT`, `APPROVALS`, `SERVICES` |
| `assets/js/i18n.js` | Traducciones EN / ES / DE / FR / IT (`data-i18n`) |
| `assets/img` | Fotos propias de INPRECASA (webp), logo SVG, favicon, og-image |
| `assets/fonts` | Archivo Expanded, IBM Plex Sans/Mono (self-hosted woff2) |

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

## Siguientes pasos recomendados
1. URLs por idioma (`/es/`, `/en/`…) con `hreflang` para SEO multilingüe.
2. Páginas por servicio (palabras clave: «revisión balsas salvavidas Tenerife», etc.).
3. Analítica respetuosa con la privacidad + banner de cookies solo si se añade.
4. Casos de éxito / clientes y homologaciones con logos cuando haya material.
