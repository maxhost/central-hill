# Spec y plan del editor de Services

Fecha: 2026-10-18. Estado: implementación y QA aprobados; candidato de código `23f2409`. Integración local autorizada.

Flujo operativo: [AGENTS.md](../../AGENTS.md) y
[multi-agent-workflow.md](../multi-agent-workflow.md). Esta spec concreta el reparto y los
criterios de Services; el procedimiento común rige worktrees, handoffs, QA e integración.

Hacer editables las cuatro secciones de `/{locale}/services` mostradas en las capturas del owner desde `/admin/pages/services`, siguiendo `/admin/pages/home`. Se conserva la composición pública actual. Los botones permiten cambiar su texto; sus enlaces siguen definidos en código.

## Auditoría de lo existente

Referencia pública: [Services en español](https://central-hill-umber.vercel.app/es/services). Consulta HTTP de solo lectura: 200; sus cuatro títulos coinciden con las capturas. Base local auditada: `main`, commit `8ca2d3d`, árbol limpio antes de esta spec. La auditoría inicial comprende código y HTML publicado; las pruebas visuales y de guardado forman parte de QA.

| Área | Situación verificada | Trabajo necesario |
|---|---|---|
| Página pública | `src/slices/services/ui/services-listing.tsx` usa `Hero`, `SectionHead`, `IconFeatureGrid` y `FeatureCtaBand`. Textos en `services.*`, dos fotos Unsplash fijas | Leer los contenidos editoriales del contrato de `pages` |
| Catálogo | Tarjetas desde `listServices(locale)`; CRUD en `/admin/services`, categorías aparte | Conservar su propiedad y funcionamiento |
| Iconos | Los tres de «Cómo funciona» vienen de `getGlobals().icons.services_how_1/2/3` | Overrides por página, con fallback a Settings |
| Editor Home | Ruta genérica `/admin/pages/[key]`, `PageEditor`, campos derivados de Zod, layout por tarjetas, OG y cola de subidas | Registrar `services` y su layout; reutilizar el formulario |
| Datos | `page_content.key` es texto único; falta `services` en registro Zod y unión TS | Añadir clave, schema, traducciones y lectura cacheada |
| Publicación | Guardar aplica inmediatamente; `revalidatePage` invalida tag y rutas localizadas | Añadir `services` al mapa de rutas |
| Medios | Pipeline R2 con JPG, PNG, WebP, AVIF, MP4 y WebM; `optionalAnimated`, `sideMedia` y `LoopVideo` ya existen | Reutilizar; adaptar el fondo hero sin importar internos entre slices |
| SEO | Ruta con título/descripción i18n, canonical y hreflang; Home añade overrides y OG | Añadir SEO editable con el patrón de Home |

Dos detalles para la implementación: el README de `services` todavía describe markup estático, pero el componente actual ya es React; `pages/validation.ts` conserva una unión de solo cinco páginas, que debe ampliarse con Services sin convertir este trabajo en una limpieza de las demás páginas.

## Formulario y correspondencia pública

En `/admin/pages` aparece «Services», que abre `/admin/pages/services`. Se reutilizan navegación, errores por campo, feedback de guardado y bloqueo durante preparación/subida de medios de Home. Tarjetas con IDs estables, en este orden:

| Tarjeta | Referencia | Campos propuestos |
|---|---|---|
| `seo` | Como Home | `seo.meta_title`, `seo.meta_description`, `og_image_media_id` en su columna existente |
| `hero` | Imagen 1 | `hero.eyebrow`, `headline`, `body`, `media_media_id`, `media_alt`, `poster_media_id` |
| `intro` | Imagen 2 | `intro.eyebrow`, `headline`, `body` |
| Información del catálogo | Debajo de la introducción | Nota de solo lectura y enlace a `/admin/services`; tarjetas y categorías se editan allí |
| `how_it_works` | Imagen 3 | `how_it_works.eyebrow`, `headline`, `items[3].icon_key/title/body` |
| `final_cta` | Imagen 4 | `final_cta.eyebrow`, `headline`, `body`, `media_media_id`, `media_alt`, `poster_media_id`, `cta_label`, `contact_note` |

`items` tiene exactamente tres posiciones; sin agregar, borrar ni reordenar. El selector de iconos usa el catálogo Iconoir existente. No se crean campos `url` o `href`; el CTA final conserva `/${locale}/buildings`. La flecha se añade una sola vez desde la presentación. Los enlaces de tarjetas conservan sus slugs y funcionamiento.

`contact_note` edita la frase anterior al email y WhatsApp. Los datos de contacto siguen viniendo de `/admin/settings`, con nota y enlace en el formulario, para evitar duplicar información empresarial.

Los labels e instrucciones del BO deben ser legibles y existir en EN/PT/ES/FR; los nombres técnicos anteriores describen el contrato, no la interfaz del formulario. Los límites recomendados: eyebrow 80, headline 200, body 1200, título de ítem 160, cuerpo de ítem 600, CTA 80, nota de contacto 240 y alt 300 caracteres; SEO usa `seoShape` existente.

## Datos y compatibilidad

- Crear `src/slices/pages/schemas/services.ts`: `servicesSchema`, `ServicesContent`, `defaultServices`. Secciones opcionales y textos con `tStrOpt`; referencias de medios opcionales y validadas como UUID o vacío. Si hay `items`, son exactamente tres; el scaffold de un formulario vacío debe producir un payload válido.
- Registrar `services` en `pageKey`, `pageSchemas`, `translatablePathsByPage`, tipo de `page_content.key`, `pageContentSchema` y mapa `PAGE_PATH`.
- Nuevo contrato aditivo: `ServicesPage = PageResult<ServicesContent>`, `getServicesPage(locale): Promise<ServicesPage>` y `buildServicesMetadata(locale)`. El getter nunca devuelve null: fila ausente o inválida → `defaultServices`, sin 404.
- Textos vacíos → mensaje actual `services.*` del idioma visitante mediante `orMessage`; imágenes vacías → fotos actuales; iconos vacíos → Settings y luego defaults existentes. Un primer guardado sin cambios conserva el resultado público en los cuatro idiomas.
- Texto fuente en EN y campos traducibles por el mecanismo `page_content` / `block:<path>` existente; traducciones aprobadas y fallback a fuente. Iconos, IDs y enlaces no se traducen. No se añade un sistema nuevo de traducción ni pestañas de idiomas.
- Lectura por `unstable_cache` con tag `page:services`. `savePage` conserva validación servidor y `requireStaff`, y revalida `/en/services`, `/pt/services`, `/es/services`, `/fr/services`. Mantener dependencia de `service-list` y Settings en la composición pública.
- No se necesita migración estructural: la clave es texto y `savePage` hace upsert. La página y el editor funcionan sin fila inicial; no se propone seed ni cambio de datos de producción.

## Medios y accesibilidad

Ambos campos visuales aceptan JPG/JPEG, PNG, WebP estático o animado, AVIF, MP4 y WebM. Usar `optionalAnimated` y la cola/pipeline existente; heredar Lottie si se reutiliza ese selector, pero Lottie no es requisito de aceptación y no exige cambios de CORS en esta tarea. No prometer GIF/SVG, ausentes de la lista actual.

- Hero: fondo con `object-cover`, conserva overlay y geometría responsive actuales. Ayuda: paisaje 16:9, 1920×1080; foto ideal <500 KB, loop MP4 H.264 sin audio de 10–20 s ideal <15 MB.
- CTA final: conserva marco 4:5. Ayuda: foto 1200×1500 ideal <500 KB, vídeo de 6–15 s ideal <10 MB, WebP animado ideal <5 MB. Son recomendaciones; los límites duros siguen siendo los del uploader.
- Poster opcional de imagen fija para cada vídeo; sin poster elegido, usar la foto de respaldo de esa sección. `media_alt` editable y traducible para imagen informativa; fondos decorativos con alt vacío y vídeos decorativos ocultos a lectores de pantalla.
- MP4: muted, loop y playsInline. Con movimiento reducido, mostrar poster en lugar de autoplay; el WebP animado debe conservar sus frames al subir y servir el original, evitando el optimizador que lo aplana. Si se ofrece una alternativa estática para WebP, usar el poster.
- Reservar espacio para evitar saltos; prioridad de carga del hero, lazy en el CTA. Comprobar que el texto del hero sigue siendo legible con cualquier medio.

La lógica de medios de `pages` permanece dentro de ese slice. Sus secciones editoriales pueden exportarse por `pages/contract.ts` para que `services` las componga alrededor de su catálogo, siguiendo el precedente de Buildings. No importar `pages/ui/components/side-media` directamente desde `services`. Si hace falta ampliar un componente de `core`, el orquestador presenta CCR/ADR antes de modificar el kernel.

## SEO

`buildServicesMetadata` reutiliza `seoMetadataInput` y `core/seo.buildMetadata`: título y descripción editables, fallback a `services.metaTitle/metaDescription`, OG de imagen fija y Twitter. OG no acepta vídeo; mantener el fallback social global cuando no haya override.

Canonical absoluto al dominio configurado para `/{locale}/services`, alternates EN/PT/ES/FR y `x-default` a `/services`, siguiendo las rutas existentes. En el HTML publicado inspeccionado el canonical aparece relativo; resolverlo en esta superficie usando el helper de URL del contrato SEO existente y verificar el HTML resultante. No copiar el host de preview como dominio canónico.

Mantener un H1, jerarquía H2/H3, contenido renderizado en servidor y enlaces rastreables. Verificar presencia de Services en sitemap y robots sin duplicar entradas; conservar JSON-LD global existente. No añadir `Service`, `Offer` o `FAQPage` a un listado sin la información correspondiente: quedan fuera de esta tarea.

## Plan de implementación con agentes

### Fase 0 Auditoría y contrato por el orquestador

La auditoría inicial anterior ya está hecha. Antes de implementar: comprobar HEAD y trabajo pendiente; capturar baseline desktop/móvil de público y Home BO; confirmar entorno DB de pruebas y acceso de QA. El servidor local puede apuntar a producción: verificarlo antes de cualquier guardado o subida.

El orquestador fija primero `servicesSchema`, sus campos/defaults y las firmas del contrato público en una base común. Es dueño exclusivo de `schemas/index.ts`, `schema.ts`, `validation.ts`, `contract.ts`, `server/queries.ts`, `server/metadata.ts`, `server/publish.ts`, `messages/{en,pt,es,fr}.json`, ruta `src/app/[locale]/services/page.tsx` y documentación compartida. Prepara getter, SEO y registro base antes del trabajo paralelo. Sin migraciones ni nuevas dependencias previstas.

### Fase 1 Página del editor y render público en paralelo

Dos implementadores en worktrees/ramas aislados, derivados de la misma base con contrato estable:

| Responsable | Escritura exclusiva | Entrega |
|---|---|---|
| Implementador A, BO | `src/slices/pages/admin/layout.ts`, nuevo `src/slices/pages/tests/services-editor.test.ts` | Registro del layout, aparición en Pages por el registro común, cinco tarjetas y nota del catálogo, OG en SEO; tests de cobertura y orden |
| Implementador B, público | Nuevos `src/slices/pages/ui/components/services-sections.tsx`, helpers de medios específicos y `src/slices/pages/tests/services-content.test.ts`; `src/slices/services/ui/services-listing.tsx` | Cuatro secciones alimentadas por el contrato de Pages; listado conserva sus tarjetas y fallbacks; medios, posters e iconos |
| Orquestador | Archivos compartidos indicados en fase 0 | Labels i18n solicitados por A, exports de componentes solicitados por B, ensamblaje de ruta/SEO y resolución de integración |

No hay dos agentes editando el mismo archivo. Los implementadores comunican claves, exports y necesidades comunes al orquestador. A reutiliza `PageEditor`/`NodeField`; si necesita cambiarlos, eleva una petición concreta antes de ampliar su alcance. B trabaja con exports definidos antes de integrar. Cada implementador entrega diff, commit y verificaciones; no integra en `main` ni hace push.

### Fase 2 Formulario conectado y revisión del orquestador

Integrar ambos trabajos en una rama de integración, resolver imports por contrato y comprobar que cada campo del formulario cambia su elemento público. Completar labels y notas en cuatro idiomas, documentación y metadata. Revisar permisos, medios, validaciones, fallbacks y revalidación; ningún campo editable debe modificar un destino.

### Fase 3 QA independiente

Un agente QA revisa el resultado integrado y prueba en una DB aislada. No implementa correcciones silenciosas: devuelve hallazgos a A/B o al orquestador y repite solo los casos afectados. Evidencias mínimas:

- BO: acceso autorizado y rechazo sin sesión; Services visible; formulario vacío válido; errores claros; guardar bloqueado durante subidas; fallo de subida no persiste un ID incompleto; recargar conserva campos y medios.
- Correspondencia: editar todos los textos de las cuatro capturas, cada uno de los tres iconos, ambos medios, label del botón y nota de contacto; verificar que todos aparecen en público y que hrefs siguen iguales. Email/WhatsApp se siguen resolviendo desde Settings.
- Compatibilidad: sin fila, fila vacía, fila inválida y borrado de overrides; comprobar fallbacks por idioma e iconos de Settings. Publicar un servicio sigue refrescando catálogo y Home.
- Medios: subida real de foto, MP4 y WebP animado en hero y CTA; poster y movimiento reducido; frames del WebP conservados; rechazo de archivo incompatible y de medios no admitidos para OG. Verificar respuesta de red y render, no solo extensión o preview.
- Caché: después de guardar, comprobar contenido y metadata sin reiniciar servidor ni limpiar caché manualmente, en EN/PT/ES/FR.
- Visual: desktop y móvil en una ronda conjunta, sin overflow, recortes accidentales ni saltos; teclado y labels en BO; jerarquía de encabezados y legibilidad pública. Revisar textos largos y catálogo vacío.
- SEO: inspeccionar HTML de los cuatro idiomas para overrides/fallbacks, canonical absoluto, alternates, OG/Twitter y enlaces; comprobar sitemap y robots.

Comandos de cierre: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm db:check` y pruebas reales con `pnpm exec tsx --test` sobre `src/slices/pages/tests/*.test.ts`, `src/slices/services/tests/*.test.ts`, `src/core/media/tests/media-inputs.test.ts`, `src/slices/backoffice/tests/media-accept.test.ts` y `src/slices/seo/tests/seo.test.ts`. Verificar los códigos de salida. `pnpm test` actualmente solo imprime un placeholder: no constituye evidencia de pruebas. QA entrega casos, resultados, capturas y defectos pendientes.

### Fase 4 Integración en main local

Con QA aprobado y sin defectos bloqueantes: revisar diff completo y límites entre slices, actualizar READMEs de Pages/Services, `docs/data-model.md` y estado de esta spec. Crear commits de implementación, integrar en `main` local preservando cambios ajenos y confirmar HEAD/árbol de trabajo. No hacer push ni desplegar. El resultado de QA debe corresponder al commit integrado; repetir verificaciones solo si la integración cambia el código probado.

## Criterios de aceptación y límites

Entrega aceptable cuando las cuatro capturas quedan mapeadas al editor, se guardan textos/iconos/medios y SEO, los cambios aparecen por revalidación en los cuatro idiomas, los enlaces permanecen fijos, se conserva el catálogo y QA documenta las pruebas anteriores. No se da por aprobada una prueba de guardado que solo haya sido simulada; si falta DB aislada, documentar el bloqueo antes de integrar.

Fuera de alcance: rediseño, CRUD/detalle de servicios, editor libre de secciones, enlaces editables, nueva pipeline de traducción, cambios globales de iconos, optimización SEO del resto del sitio y despliegue. La implementación se completó en la reanudación autorizada del owner; ver el cierre y la evidencia de QA al final.


## Ejecución 2026-10-18 — reanudación

- Base limpia: `a29ebf24596a3c60bb9cbca03fb08fb3d9eacc00`, rama original `main`, sin cambios previos.
- Orquestador: `/Users/maxi/Documents/claude-workspace/central-hill`, rama `services/integration`.
- A: `/private/tmp/central-hill-services-editor`, rama `services/editor`.
- B: `/private/tmp/central-hill-services-public`, rama `services/public`.
- Base común: commit de schema/registro/getter/metadata inmediatamente anterior a crear worktrees; ambos agentes deben verificar HEAD/rama/cwd/status y reportarlos.
- Escritura A: `src/slices/pages/admin/layout.ts`, `src/slices/pages/admin/form-model.ts`, `src/slices/pages/admin/ui/schema-fields.tsx`, nuevo `src/slices/pages/tests/services-editor.test.ts`. Ampliación explícita para respetar `items.meta({fixed_order:true})` sin afectar otros arrays; ayudas localizadas de Services por claves de mensajes, manteniendo compatibilidad.
- Escritura B: nuevos `src/slices/pages/ui/components/services-sections.tsx`, `services-media.tsx`, `services-loop-media.tsx`, `src/slices/pages/tests/services-content.test.ts`; `src/slices/services/ui/services-listing.tsx`. Export solicitado al orquestador antes de checks. Secciones: `ServicesHero`, `ServicesIntro`, `ServicesHowItWorks`, `ServicesFinalCta`, props `{page:ServicesPage,locale:Locale}`; cada una resuelve sus mensajes y Settings por contratos cuando necesita.
- Solo orquestador: schema Services, registros, contrato, queries/metadata/publish, ruta, `messages/{en,pt,es,fr}.json`, documentación, pruebas compartidas adicionales e infraestructura temporal QA. No kernel, migraciones ni dependencias nuevas.
- Contrato: `ServicesContent` y `ServicesPage`, `getServicesPage` nunca null; campos de la tabla de esta spec. Iconos/medios no traducibles; textos opcionales vacíos -> mensajes por idioma. Cache `page:services`; catálogo `service-list`; Settings mantiene dependencia propia.
- Entorno existente: `.env.local` apunta a Neon remoto y bucket compartido; no se copiará. Usuario autorizó preparar entorno local aislado con datos ficticios. Docker/Postgres/S3 local por verificar; sin escrituras a recursos remotos.
- Node 22.23.3 disponible; pnpm. Verificaciones: typecheck/lint/tests explícitos/build/db:check, QA desktop+móvil, guardado/recarga y revalidación real. Tests/boundary placeholders excluidos. Sin integración a main antes de QA aprobado.
- Baseline visual público/BO todavía pendiente de entorno aislado; no afirmar prueba visual o persistencia como aprobadas.


### Integración del candidato

- Base contractual `f790718`; A `c649c44` integrado como `f702efe`; B `0d66853` integrado como `ac3ca6e`.
- Scope A ampliado a `admin/ui/page-editor.tsx` para pasar contexto Services a ayudas localizadas.
- Scope orquestador ampliado a `admin/actions.ts`, nuevo `admin/services-media-validation.ts`, nuevo
  `tests/services-media-validation.test.ts`, `tests/pages-admin.test.ts`: validar referencias/mimes en
  servidor y actualizar fixture obsoleta que suponía Services sin layout. QA debe probar rechazo real.
- Transporte QA temporal `/private/tmp/central-hill-services-qa/preload.cjs`: redirige únicamente
  el endpoint ficticio Neon `api.local` a proxy local 4448; no cambia implementación/kernel.
- Runtime checkout `/private/tmp/central-hill-services-runtime`, env ficticio propio, puerto 3048;
  PostgreSQL contenedor `central-hill-services-db`, proxy `central-hill-services-proxy`, red exclusiva.
- S3rver temporal en 9048, bucket `servicesqa` y credenciales ficticias; MinIO no disponible en registros.
  Herramienta QA instalada solo en /private/tmp, sin dependencia nueva del proyecto.
- Baseline público desktop/móvil capturado desde base contractual en entorno local; Home BO baseline
  en curso. Usuario ficticio `services-qa@example.test`. No credenciales remotas copiadas ni recursos remotos escritos.
- Candidato integrado: typecheck exit 0; 218 tests reales exit 0; lint exit 0 con 5 advertencias
  preexistentes; db:check exit 0 (19 migraciones, advertencia preexistente por breakpoint de 0008).
  Build, QA browser/persistencia y revisión independiente pendientes; no merge main todavía.


### Correcciones tras revisión y QA

- `86566c9`: validar fila Services antes de resolver IDs de medios (fila malformada -> fallback,
  nunca error SQL por UUID inválido). Typecheck exit 0; QA incluye fixture inválida en DB local.
- Build de `86566c9` en `/private/tmp/central-hill-services-build`: Node22, `pnpm build` exit0,
  73 páginas generadas, rutas Services SSG/ISR cuatro idiomas. Producción local3049 para probar
  revalidación real, con `BETTER_AUTH_URL` propio; no es despliegue.
- QA P2 labels: Field visible no estaba asociado a controles en editor heredado. A corrige
  `schema-fields.tsx`/`page-editor.tsx` con IDs/htmlFor, grupos de medios y estados accesibles.
- B corrige herencia de Lottie y carga de vídeo CTA solo al intersectar viewport; sin cambios kernel.
- Env QA S3 endpoint final `http://127.0.0.1:9048` (SDK path-style), base pública
  `http://localhost:9048/servicesqa`; S3rver CORS permite3048/3049. Fallo inicial de host virtual
  fue problema de infraestructura local, guardado correctamente abortó sin IDs incompletos.
- Preferencia de usuario vigente: implementación/QA y comandos contenidos en este proyecto en automático;
  solo consultar integración a producción GitHub, eliminación de DB/funcionalidades completas o cambios
  agresivos de arquitectura. No push/despliegue dentro de esta entrega local.


## Cierre de implementación y verificación

Código final probado: `23f2409850006f6f007c5c34bc6e85483183f691`. Aprobación independiente QA
posterior al retest de todas las correcciones; [informe duradero](services-admin-editor-qa.md).
Cambios posteriores a ese commit: documentación únicamente. `main` sigue la base `a29ebf2`
hasta el fast-forward final de la rama `services/integration`; el commit de documentación que
contiene este cierre identifica el HEAD integrado (`git log -1`). No push ni despliegue.

Comandos reales ejecutados con Node22.23.3 y pnpm, sin placeholders:

```sh
pnpm typecheck
pnpm lint
pnpm exec tsx --test src/slices/pages/tests/pages.test.ts src/slices/pages/tests/pages-admin.test.ts src/slices/pages/tests/services-content.test.ts src/slices/pages/tests/services-editor.test.ts src/slices/pages/tests/services-media-validation.test.ts src/slices/services/tests/services.test.ts src/slices/services/tests/services-admin.test.ts src/core/media/tests/media-inputs.test.ts src/slices/backoffice/tests/media-accept.test.ts src/slices/seo/tests/seo.test.ts
pnpm build
pnpm db:check
git diff a29ebf2 --check
```

Resultados: todos exit0;220 tests reales, build73 páginas con Services SSG/ISR en EN/PT/ES/FR.
Lint conserva5 advertencias previas; db:check19 migraciones y advertencia previa de0008 por
statement-breakpoint. Un typecheck intermedio detectó narrowing imposible de `window` en el
helper nuevo; corregido en `e9373e7`, verificado por typecheck/build final. Detector visual
mecánico sobre UI nueva/modificada: exit0, `[]`; revisión de fronteras manual por raíz y QA.

QA:23 textos guardados/recargados;3 iconos; fotos/MP4/WebP animado3 frames/Lottie en ambas
posiciones; posters y movimiento reducido; carga diferida CTA; permisos y payloads inválidos;
fallos reales de subida sin persistencia de IDs incompletos; guardado deshabilitado durante
preparación; fallbacks por fila ausente/vacía/inválida; ES aprobado/FR borrador; SEO/OG/Twitter,
canonical/alternates absolutos/sitemap/robots; desktop1440/móvil390 sin overflow. Publicación y
edición reales del catálogo refrescan Home y Services cacheados. No reinicios ni limpieza de
caché entre el guardado observado y la comprobación pública de revalidación.

Adaptador de entorno QA adicional: Next rechaza correctamente upstreams privados del optimizador;
el preload temporal habilita `imageConfigDefault.dangerouslyAllowLocalIP=true` solo en el build
local para comprobar JPG optimizado200 y naturalWidth>0. No modifica config del repositorio.
Build final pasó tanto sin como con ese adaptador. Nunca se copió `.env.local` del usuario.

Hallazgo previo fuera del alcance: Better Auth genera IDs de usuario textuales, mientras
`translation.updated_by` es UUID; el CRUD existente de catálogo falla al auditar un staff cuyo
ID no es UUID. Pages/Services editor no escribe ese campo y funciona con ambos tipos. Se
conservó el primer usuario ficticio y se añadió un segundo staff ficticio UUID para verificar
el catálogo existente. No se cambió kernel/esquema ni se ocultó el fallo; requiere tarea futura
con ADR/migración adecuada. Ningún dato remoto afectado.

Artefactos temporales preservados en `/private/tmp/central-hill-services-qa`: scripts,fixtures,
report.txt,capturas baseline/final y fallo de subida; sin añadirlos a Git. Worktrees/ramas de
implementadores conservados con commits capturados. Entorno propio preservado para revisión:
S3 PID65040 puerto9048; dev PID66646 puerto3048; build final PID74142 puerto3049; DB/proxy
contenedores exclusivos `central-hill-services-db`/`central-hill-services-proxy`. No tocar otros
worktrees/procesos (incluido GLaDOS preexistente). Sin archivos ajenos absorbidos.
