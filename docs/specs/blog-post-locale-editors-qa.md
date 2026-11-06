# Blog Posts por idioma — QA funcional independiente

2026-11-05. **Aprobado en el alcance funcional local acordado.**
Candidato final: **`58ba96a`**, rama `post-locales/integration`, checkout
`/private/tmp/central-hill-post-locales-integration`. Sin defectos bloqueantes
abiertos en esta revisión. Spec: [editores por idioma](entity-locale-editors-spec.md).
Plan y ownership: [piloto Blog](blog-post-locale-editors-plan.md).

## Entorno y alcance

SQL independiente confirmó `current_database()=postlocalesqa` y
`current_user=postlocalesqa` antes de las mutaciones. Preview de producción3072,
Postgres5648, proxy4548, storage9072. Cuenta, datos e imágenes sintéticos.
Sin acceso a Neon remoto ni acciones sobre3071. Capturas, arneses y logs propios
se conservan en `/private/tmp/central-hill-post-locales-qa/independent/`.

La primera ronda de navegador verificó el baseline sobre ejecutable `c87dcd8`.
Las continuaciones acotadas confirmaron los cambios sobre `2f67116`,
`9b875d7`/código `30ce88a` y, finalmente, `58ba96a`. Los casos aprobados no se
repitieron como una suite completa; los casos corregidos se confirmaron contra
el candidato que los incorpora. Los hallazgos y fallos de los arneses quedan
registrados abajo para distinguir sus causas.

El storage local implementa PUT/HEAD/GET de bytes y metadatos; **no verifica
firmas S3**. El runtime final usa URLs absolutas de127.0.0.1:9072 y la opción
existente de configuración standalone de Next: optimizer autorizado sólo para
ese host/puerto/ruta local y `dangerouslyAllowLocalIP=true` únicamente en QA.
No cambió la configuración de producto ni el kernel por este ajuste. Los assets
relativos del build siguen disponibles mediante el symlink no rastreado
`public/postlocalesqa`. No se afirma verificación de R2 remoto, email o producción.

## Hallazgos corregidos y confirmación

| Hallazgo | Corrección y evidencia |
|---|---|
| Borrar un artículo relacionado dejaba IDs ocultos en snapshots de otros posts y bloqueaba su siguiente Save | Delete ahora rechaza referencias de drafts/publicaciones sin mutar documentos ajenos. El browser confirmó el mensaje `in_use` y snapshots intactos. Las pruebas DB acotadas del candidato cubren también retirada de referencia y carrera Delete/CAS |
| Un target iniciado sin draft podía conservar templateRevision anterior tras Save/Publish EN | Se actualizan sólo los campos compartidos derivados de targets sin draft, conservando su texto/cuerpo. Revisión de código y tests de estado finales; los drafts ya guardados siguen exactos |
| Editar de nuevo un target recién publicado con referencias congeladas antiguas podía rechazar Save | La primera edición posterior prepara las referencias EN guardadas. Browser: ES publicó su portada antigua, luego su nuevo título se guardó con la portada EN nueva, conservando su cuerpo y su publicación anterior hasta Publish |
| Primer Save EN de `/posts/new` se completaba pero una respuesta RSC posterior reiniciaba el formulario | Se retiró la key nueva inestable y el primer Save navega a la ruta Edit real con transición bloqueada. Nuevo artículo de regresión: título/referencias sobreviven a la navegación y respuesta diferida, segundo Save crea revision2, recarga recupera su título |
| ES guardado antes de completar portada EN congelaba null en un campo readonly, sin vía de completarlo | Control local explícito `Use saved English details`, sin tercera acción editorial. Browser guardó ES sin portada, completó EN, comprobó que ES seguía intacto, adoptó datos sólo localmente y guardó manteniendo todo su párrafo traducido |

Los hallazgos se remitieron al orquestador; QA no modificó código de producto.
La confirmación final no introduce sincronización silenciosa de drafts ni
reescribe publicaciones de otros idiomas.

## Evidencia funcional de navegador

| Recorrido | Resultado observado | Evidencia propia |
|---|---|---|
| Login y baseline legacy | Cuatro títulos públicos resueltos iguales a los iniciales; GET/preview no crean snapshots de contenido | `inspect.log`, `baseline-results.json` |
| Escritura y preview | Escritura continua conserva foco; título cambia en el renderer real; Refresh conserva el cambio; sin persistencia de contenido | `desktop-live-preview.png`, `baseline-results.json` |
| Save EN/reload | Crea cuatro baselines, conserva ES público y PT pendiente como draft, no cambia EN público; recarga abre lo guardado | `baseline-results.json` |
| ES independiente y CTA | Save conserva la publicación anterior; Publish cambia sólo ES y utiliza su URL/label propios. JSON-LD contiene el BlogPosting correcto | `baseline.log`, `continuation-results.json`, comprobación corregida de JSON-LD |
| EN Publish y otros idiomas | Documentos y revisiones ES/PT/FR permanecen intactos; sus publicaciones no cambian | `final-existing-results.json` |
| PT/FR y Refresh | PT recupera la traducción pendiente; edición y Save propios. FR edita, refresca y publica su título independientemente | `final-existing-results.json` |
| Navegación | Cancel/Escape conservan lo local; Continue deja sólo lo guardado y la reapertura recupera ese valor | `final-existing-results.json` |
| Móvil390 | Edición y guardado PT funcionan; preview cambia y el control de viewport sigue accesible | `mobile-editor.png`, `final-existing-results.json` |
| Rutas legacy/preview | Review redirige al post y locale; preview privada sin scripts JSON-LD | `final-existing-results.json` |
| Creación incompleta | Primer Save reserva identidad y slugs, permite traducir sin publicar y deja cuatro URLs404/publicaciones null | `new-post-results.json`; confirmación del reset corregido en `first-save-result.json` |
| Primer/segundo Save corregidos | Navegación real a Edit, título/referencias estables, revision2 y recuperación de segundo título al recargar | `first-save-confirm.log`, `first-save-result.json` |
| Adopción explícita de metadatos | Draft ES con portada null no cambia al guardar EN; adopción no escribe DB; Save adopta portada y preserva su cuerpo | `new-post-resume-results.json` |
| Uploads por idioma | Dos imágenes en cola, una ES y otra EN: Save EN crea exactamente un asset; ES sigue pendiente. Save ES crea el segundo y conserva su cuerpo distinto | `new-post-resume-results.json` |
| ES antes de EN | ES se publica con su cuerpo y portada congelados, EN permanece404. Siguiente edición ES guarda con nueva portada EN sin modificar su publicación hasta Publish | `new-post-resume-results.json` |
| Público/SEO/ISR/medios | Nuevo ES200 con canonical ES y sólo hreflang ES; `/sitemaps/blog` incluye ES y excluye EN/PT/FR. Portada e imagen inline nuevas se cargan mediante optimizer200 | `remaining-results.json`, `images-inspect.log`, `public-new-article.png` |
| Referencias y Delete | Intento de eliminar el post referenciado muestra motivo; no elimina el destino ni altera snapshots ajenos | `remaining-results.json` |
| Autenticación real | Cliente sin cookie redirigido desde editor/preview; replay de Save real redirige al login sin modificar revisiones | `remaining-results.json` |
| Archive | Oculta la URL ES publicada, conserva todos los snapshots y deshabilita Save/Publish al reabrir el editor | `remaining-results.json` |

No se registraron `pageerror` en las continuaciones finales completadas.
Las capturas desktop/móvil se inspeccionaron para comprobar uso y contenido;
no constituyen una ronda estética adicional ni validación visual del usuario.

## Guardas legacy y revisión de límites

El arnés `guards.mts` ejecutó los módulos reales de Translation y del antiguo
Save con autenticación de prueba y una seam de datos que falla ante cualquier
acceso. Las seis mutaciones Translation para `blog_post`, el generador directo y
el antiguo `savePost` rechazaron antes de datos. Una acción `guide_page` continuó
alcanzando su seam anterior. El stub anónimo rechazó las siete acciones staff
antes de datos. Log `guards.log`. Esta comprobación aislada se complementó con
la denegación anónima real anterior; no se presenta el stub como auth de producción.

La revisión del candidato confirma: published null impide fallback; los lectores
resuelven referencias de su snapshot; los slugs existentes no se reescriben;
los parámetros/alternates filtran publicaciones por idioma; previews validan
blobs del mismo origen, priorizan assets persistidos y usan el bridge existente
que bloquea formularios/enlaces. No se enviaron formularios ni correos reales.

La tabla/validación permanece en Blog. Los cambios compartidos son mínimos y
opcionales —locale deshabilitado y flush por IDs—; las llamadas anteriores
conservan su contrato. Los imports entre slices nuevos usan contratos, además de
las composiciones `app/` ya presentes. No se exigió construir una biblioteca de
medios o scanner inexistente en este checkout.

## Comandos y comprobaciones consultadas

QA no repitió las suites globales aprobadas por el orquestador. En el directorio
QA padre se consultaron:

- `pnpm typecheck`: exit0, incluyendo `typecheck-release.log` del candidato final.
- `pnpm lint`: exit0, siete warnings preexistentes, sin errores;
  `lint-release.log` para el candidato final.
- Ocho archivos explícitos de tests afectados en `tests.log`:46passed en la
  integración inicial. Tras los fixes, `tests-release.log`:19passed
  —13backend y6estado UI—, cubriendo también las correcciones.
- `pnpm db:check`: exit0,25migraciones y warning0008preexistente.
- `pnpm build`: `build-release.log` exit0 para58ba96a. El primer build falló por
  conexiones locales agotadas; sólo se ajustó el límite de esa DB sintética.

Comandos propios, siempre tras `source .../env.sh` con Node22.23.3:

```sh
pnpm exec tsx --import /private/tmp/central-hill-post-locales-qa/independent/guards-runtime.mjs /private/tmp/central-hill-post-locales-qa/independent/guards.mts
node /private/tmp/central-hill-post-locales-qa/independent/inspect.mjs
node /private/tmp/central-hill-post-locales-qa/independent/baseline.mjs
node /private/tmp/central-hill-post-locales-qa/independent/final-existing.mjs
node /private/tmp/central-hill-post-locales-qa/independent/first-save.mjs
node /private/tmp/central-hill-post-locales-qa/independent/first-save-confirm.mjs
node /private/tmp/central-hill-post-locales-qa/independent/new-post-resume.mjs
node /private/tmp/central-hill-post-locales-qa/independent/images-inspect.mjs
node /private/tmp/central-hill-post-locales-qa/independent/remaining.mjs
```

Los arneses son recorridos escalonados de una sola ronda y confirmaciones de
fixes, no scripts para reejecutar indiscriminadamente sobre sus fixtures mutadas.
Los archivos JSON/logs conservan los checkpoints y candidatos descritos.

## Correcciones de arnés y límites de la evidencia

Se preservan las evidencias iniciales, incluso las fallidas. Hubo aserciones o
selectores corregidos sin cambios de producto: se esperaba un único script
JSON-LD cuando existen global+artículo; el label EN incluye «English source»;
Category/Author incluyen marcador requerido; el artículo público no tiene un
wrapper `main`; `/sitemap.xml` es un índice y sus URLs Blog viven en
`/sitemaps/blog`. La primera comprobación del segundo Save consultó DB mientras
el botón aún mostraba Saving; se confirmó su revision2 y reapertura después de
completar, sin repetir la mutación. Los intentos iniciales del arnés de guardas
requirieron extensión ESM y aislar el contrato relativo para evitar cargar PNG
fuera del runtime Next. Estas correcciones no se reportan como defectos de producto.

La independencia/concurrencia CAS, importación inválida, null de tiempo de
lectura, guardas de referencias y carreras Delete/CAS se apoyan en tests DB reales
acotados del candidato y revisión de sus logs; no se amplió una matriz adversarial
en navegador. La preparación de target sin draft tras EN cuenta además con tests
de estado. Las pruebas no cubren R2 remoto, firmas S3 reales, producción,
despliegue, otros catálogos CMS ni una nueva auditoría completa de Pages.

## Estado final de fixtures

- `a4000000-0000-4000-8000-000000000001`: artículo activo de revisión; EN y ES
  publicados con títulos QA, FR publicado y PT con borrador guardado. Slugs
  ES/PT diferentes conservados. Útil para revisión en `/admin/posts/<id>`.
- `86f32423-0c0b-4d6c-88e7-933e1811ee10`: artículo creado en el recorrido, slug
  `qa-new-independent`; archivado al final, sus cuatro documentos conservados.
- `629aa724-9d4d-4503-a6a8-20edb6ef072a`: regresión de creación resuelta; ENdraft
  revision2, título `QA retained second save`, sin publicación pública.
- Assets subidos y archivos de QA se conservan para reproducibilidad. Ninguna
  limpieza destructiva de entornos ajenos, push, main integration o despliegue.
