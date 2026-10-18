# Blog público y CMS — auditoría de cobertura

Fecha: 2026-10-18. Estado: auditoría y propuesta; **sin implementación autorizada**.
Base documental `1c48555`, código `d4e13c9`, rama `about-cms/integration`,
checkout `/private/tmp/central-hill-about-cms-integration`. Estado inicial limpio.
Antecedente: [handoff About](handoff-about-cms.md). Plan: [blog-cms-plan.md](blog-cms-plan.md).

## Revisión de alcance según capturas del usuario

El usuario precisó como siguiente entrega el editor `/admin/pages/blog`: cabecera
(incluidos textos del buscador), etiqueta Destacado, eyebrow/título de Últimos
artículos, los tres textos de newsletter, SEO e integración del flujo de traducción
EN/PT/ES/FR. El plan revisado mapea explícitamente las cuatro capturas a campos.
Los hallazgos de artículos, búsqueda funcional y entidades auxiliares siguen
documentados en esta auditoría; quedan como seguimientos, no como gates de ese
editor. Las capturas aportan evidencia de secciones con artículos, sin identificar
su runtime/DB; no cambian la limitación de la comprobación local vacía en3062.

## Alcance y método

Se recorrieron rutas públicas de listado/artículo, contratos, consultas, esquemas,
formularios, guardado, traducción, invalidación y SEO. Referencias: CLAUDE.md,
workflow canónico, READMEs de Blog/Pages/SEO, convenciones, seo-i18n, content-briefs
§6 y ADR0012/0013/0019/0020/0021/0022/0034/0035. La skill `impeccable` se usó
para revisar la interfaz existente dentro de este alcance, sin rediseño.

Comprobación browser de sólo lectura sobre runtime About `d4e13c9`, puerto3062,
entorno sintético `aboutcmsqa` descrito en su handoff. Login con usuario sintético;
sin guardar formularios, subir archivos, enviar newsletter ni modificar datos.
No se iniciaron, detuvieron ni reconstruyeron servidores. Previews3059–3062 preservadas.

Esta DB no contiene posts, categorías ni autores disponibles en los selectores.
Se observaron listado vacío EN desktop1440, ES móvil390, Pages→Blog, Posts y New
post (todos HTTP200; sin overflow horizontal en esas capturas). **El detalle,
los filtros con datos, las imágenes publicadas y la persistencia se auditaron por
código; no tienen comprobación funcional browser en esta pasada.** No se infiere
el inventario de artículos real/producción a partir de este entorno vacío.

## Mapa de cobertura

| Superficie / elemento | Fuente y editor actuales | Cobertura real / hueco |
|---|---|---|
| Listado: eyebrow, H1, introducción | `blog.*` en `messages/{en,pt,es,fr}.json` | Localizados, sin CMS |
| Buscador: placeholder y nombre accesible | `blog.searchPlaceholder/searchLabel`; `PageHeadSearch` | Visible; GET `?q=…`; ninguna consulta/estado de Blog consume q |
| Categorías: nombre, color, orden | `/admin/blog-categories`; `blog_category` y traducción `name` | CRUD existente; chips filtran grid en cliente; featured permanece visible |
| Featured: elección y contenido | `is_featured` en Posts; gana el publicado más reciente | Imagen/textos/destino derivados del post; etiqueta de sección y enlace desde mensajes |
| Grid: título, excerpt, categoría, fecha, minutos, portada | `/admin/posts/[id]` y entidades relacionadas | Cubierto; newest-first, excluye sólo el featured elegido; 9 cards iniciales, load-more local |
| Encabezado del grid, Leer artículo, Cargar más, vacío | `blog.latestEyebrow/latestTitle/readArticle/loadMore/empty` | Sin CMS |
| Newsletter de listado y detalle | `blog.newsletter.*`; `NewsletterSignup` → contrato Leads | Copy de banda sin CMS; email/consent/submit/success pertenecen a `leads.*` |
| Detalle: H1/excerpt/categoría/autor/fecha/minutos | Posts, categorías y autores | Cubierto; breadcrumb y patrones de fecha/tiempo son interfaz/localización |
| Portada y OG individual | Dos `MediaField` en Posts; `cover_media_id/og_image_media_id` | Selección/carga de imágenes; portada obligatoria en formulario; OG→cover fallback |
| Alt portada | Traducción `media_asset.alt`→título del post | No hay override de alt por post en su formulario |
| Cuerpo: heading H2/H3/H4, número, párrafo | `BodyEditor`; `body.ts` | Añadir/quitar/subir/bajar bloques; textos simples, sin HTML ni formato inline |
| Cuerpo: listas UL/OL | `list{ordered,items[]}` | Añadir/quitar/editar 1–50 ítems; no mover ítems con controles |
| Cuerpo: imagen, alt y caption | Bloque image + MediaField | Cubierto; alt local→alt de media; sin imagen resuelta el bloque se omite |
| Cuerpo: cita/atribución, callout, separador, botón | Bloques quote/callout/divider/cta | Cubiertos; cuatro variantes callout; etiqueta de variante desde mensajes |
| Botones dentro del cuerpo | `cta{label,url}` | Editable; URL absoluta requerida por Zod; no localiza enlaces internos automáticamente |
| TOC | Derivado de H2/H3 con anchors deduplicados | Correcta derivación; H4 fuera del TOC; título fijo en mensajes |
| Byline final y biografía | `/admin/authors`; fallback `blog.bylineFallback` | Nombre/bio visibles; se dibuja inicial, no el avatar que permite cargar Authors |
| CTA lateral compartido | `/admin/pages/blog`: `post_aside{eyebrow,title,body,cta_label}` | Textos editables; destino fijo `/{locale}/owners` |
| CTA lateral particular | Posts `cta_label/cta_url` | Sustituye sólo botón; conserva eyebrow/title/body globales; URL absoluta |
| Relacionados | Checkboxes Posts; `blog_post_related.position` | 0–3, orden de selección; sin controles de orden visibles; público sólo publicados |
| Títulos de relacionados y resto de chrome | `blog.relatedEyebrow/related/toc/callout.*`, etc. | Localizados en mensajes; sin CMS |
| Iconos de búsqueda, fecha, lectura, listas, callouts, TOC | Settings→Site icons | Ya editables globalmente; no duplicar en Blog |
| SEO del listado | `app/[locale]/blog/page.tsx` | Title/description fijos en inglés; canonical/alternates generados |
| Imagen social de Pages→Blog | `page_content.og_image_media_id` | Control visible y persistible; ruta del listado no lo lee, sin efecto en su metadata |
| SEO individual | Posts meta_title/meta_description/OG | [T], fallback a title/excerpt/cover; canonical y alternates por slugs |
| JSON-LD individual | `blog-post.tsx` + builders `core/seo` | BlogPosting + BreadcrumbList; no edición manual necesaria |
| Sitemap/descubribilidad | SEO consume `listPostParams()` por contrato | Publish invalida `sitemap`; conservar esta integración |
| Header/footer/contactos y newsletter del footer | Settings y Leads | Compartidos, fuera del editor Blog; no duplicar |

Ubicaciones principales: `src/slices/blog/{body.ts,contract.ts,schema.ts}`,
`admin/{validation.ts,queries.ts,actions.ts,ui/post-form.tsx,ui/body-editor.tsx}`,
`server/{queries.ts,publish.ts}`, `ui/{blog-listing.tsx,blog-post.tsx,components/*}`;
`src/slices/pages/{schemas/blog.ts,server/queries.ts,server/publish.ts,admin/queries.ts}`;
`src/slices/translation/{server/generate.ts,admin/actions.ts}` y las dos rutas públicas Blog.

## Hallazgos priorizados

Prioridad relativa al objetivo CMS, no calificación general de seguridad o accesibilidad.
No se detecta P0 dentro de la evidencia disponible.

1. **P1 — Pages→Blog deja casi todo el listado fuera del CMS.** Sólo describe el
   CTA lateral. La copy comercial de cabecera, secciones y newsletter requiere
   tocar mensajes/código. Ampliar el esquema fijo y conectar listado/detalle por
   contrato, conservando fallback y locales. No convertirlo en constructor libre.
2. **P1 — SEO del listado fijo y control de OG desconectado.** Confirmado en HTML
   EN/ES: misma descripción inglesa. Pages→Blog ofrece Social share image pero
   `generateMetadata` no consume esa fila. Conectar SEO/OG editables y fallback
   localizado. El SEO de los artículos ya existe y debe preservarse.
3. **P1 — Buscador visible sin búsqueda.** Submit observado cambia URL a
   `/en/blog?q=zzzz-no-blog-match`; el código confirma que no filtra nada. La DB
   vacía impide comparar resultados reales. Proponer filtro local sobre contenido
   ya renderizado, sin volver dinámica la ruta ni crear motor remoto.
4. **P1 — Traducciones de Page Blog y entidades auxiliares no invalidan los tags
   que consume Blog.** `translation/admin/actions.ts:revalidateEntity` purga
   `page:about` para cualquier `page_content`, además de tags genéricos por UUID;
   no purga `page:blog`. Categories/Authors purgan tags genéricos de su tipo,
   mientras sus nombres/bios están cacheados bajo `blog_post-list`. Sus saves
   fuente sí purgan Blog. Corregir enlaces de invalidación por contrato para que
   aprobación/reset se vea sin rebuild. Hallazgo estático, sin mutaciones de QA.
5. **P2 — Avatar de autor sin efecto público.** Se ofrece y guarda en Authors,
   pero `summarySelect` no lo selecciona y la byline siempre usa inicial. Resolver
   imagen por contrato y mantener inicial como fallback, sin añadir gestor nuevo.
6. **P2 — Ordenación incompleta de listas/relacionados.** Bloques completos sí
   se mueven; ítems de lista sólo se editan/añaden/quitan. Relacionados siguen orden
   de selección, con límite3 pero sin botones de mover. Añadir controles simples.
7. **P2 — Destinos de CTA y alts de portada incompletos.** CTA global tiene
   destino interno fijo; CTA por post/cuerpo exige URL absoluta y no conserva el
   locale por sí solo. Portada carece de alt local editable. Exponer destino
   interno explícito y alt opcional con fallback; conservar URLs externas existentes.
8. **P2 — Ayuda de fecha contradice publicación.** New post dice “Leave blank to
   keep unpublished”; las consultas públicas sólo filtran `status='published'`.
   Un post publicado sin fecha puede aparecer. Corregir ayuda y aclarar que no
   existe scheduling; no introducir scheduler por esta auditoría.

## Límites y diferencias documentales

- `body` es **un campo traducible JSON completo**, no claves por bloque. El
  generador pasa el string al provider genérico y la revisión es genérica. Un JSON
  target aprobado que no valida produce cuerpo vacío (el parser no reintenta con
  source). ADR0013 aún menciona paths por bloque, mientras README/código describen
  el campo completo. Alinear documentación y validar el JSON target en una futura
  corrección acotada; no migrar todo el modelo i18n ni agregar IDs por bloque aquí.
- Al cambiar source, targets aprobados del JSON completo pueden conservar su versión
  anterior hasta nueva revisión: no prometer sincronización de imágenes/estructura
  por bloque entre idiomas. Dejarlo visible como comportamiento del modelo actual.
- `savePage('blog')` guarda JSON pero no registra nuevas filas source para el inbox;
  éste se construye únicamente desde `translation`. El futuro editor ampliado debe
  sincronizar sus campos [T] mediante el seam existente. No asumir que “tStr” basta.
- Medios actuales del Blog son imágenes (JPG/PNG/WebP/AVIF en picker); no hay bloque
  video/Lottie. No asumir soporte de About por compartir MediaField. No se pide
  ampliación multimedia en esta tarea. No se verificó animación WebP.
- Textos no soportan enlaces inline, negrita, tablas ni embeds. Es una limitación
  del conjunto cerrado, no un bug de los ocho bloques presentes.
- README/schema/data-model dicen “exactamente3 relacionados”; validación y público
  permiten0–3. El contrato real gobierna el plan; no exigir tres artificialmente.
- `getPostBySlug` está cacheado con `blog_post-list`, no con el tag individual que
  menciona el comentario de publish. La invalidación funciona por el tag de lista;
  no diagnosticar un fallo sólo por esa diferencia documental.
- Saves de Posts son secuenciales, no una transacción única. No se hizo matriz de
  concurrencia/fallos parciales ni se convierte en gate pendiente de esta auditoría.
- Los saves copian el slug fuente a los cuatro idiomas. No existe un editor de
  slugs localizados; no prometerlo como cobertura existente.

## Evidencia y comprobaciones

- Browser: `/private/tmp/central-hill-blog-audit.cjs`, exit0 con Node22.23.3.
  Artefactos: `/private/tmp/central-hill-blog-audit/results.json` y capturas
  `listing-desktop.png`, `listing-mobile.png`, `pages-blog.png`, `posts.png`,
  `post-new.png`. Los selectores `main` del extractor sólo cubren admin: público
  no tiene ese wrapper; arrays públicos de links/inputs vacíos **no** prueban ausencia
  de controles. Capturas y selector directo `input[name=q]` sustentan la inspección.
- Comando: `PATH=/Users/maxi/.nvm/versions/node/v22.23.3/bin:$PATH pnpm exec tsx --test src/slices/blog/tests/blog.test.ts src/slices/blog/tests/blog-admin.test.ts src/slices/blog/tests/headings.test.ts`.
  **20/20, exit0**, sobre código d4e13c9/HEAD documental1c48555.
- Detector: `/Users/maxi/.agents/skills/impeccable/scripts/impeccable detect --json src/slices/blog/ui/blog-listing.tsx src/slices/blog/ui/blog-post.tsx src/slices/blog/admin/ui/body-editor.tsx src/slices/blog/admin/ui/post-form.tsx`.
  Exit0, `[]`. No equivale a aprobación funcional ni evaluación WCAG.
- Primeros intentos browser/tsx bloqueados por permisos del sandbox (Mach/IPC);
  repetidos con escalación y completados. Curl sin escalación tampoco alcanzó
  localhost; la evidencia HTTP200 procede del browser autorizado.
- Sin typecheck/lint/build nuevos: sólo auditoría/docs, sin cambio ejecutable ni
  reconstrucción de previews. Los checks About pertenecen a su handoff.
- Sin save/reload, uploads, submissions ni QA independiente del Blog todavía.
  No se atribuye cobertura de artículos o los cuatro idiomas en browser.

## Resultado

Hay una base útil: editor de ocho bloques, imágenes, SEO individual, categorías,
autores, filtros y revalidación de saves ya existen. El trabajo principal es cerrar
la cobertura de Pages→Blog y conectar fielmente formularios, traducción y salida
pública. La siguiente etapa es aprobar el plan y registrar contratos/asignaciones
antes de implementar; la auditoría no concede esa autorización.
