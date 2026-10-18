# QA independiente del CMS Guides

Estado: **QA APROBADA** sobre `1a2739cb397daef05a7c226b48ee4d0ecb293998`.
Fecha: 2026-10-18. Sin bloqueantes funcionales pendientes dentro de la spec.

## Candidatos, entorno y método

Primera pasada: `0e8fc755378733ce1560597187950110a354e65a`.
Segunda pasada: `bec225ee6b13025936d8f3bc8eec8911915b4e97`.
Retest final: `1a2739cb397daef05a7c226b48ee4d0ecb293998`, servidor production3061
PID64605, sin cambios de código entre ese build y el cierre20:35:42UTC.
Rama `guides-cms/integration`, `/private/tmp/central-hill-guides-cms-integration`.
Cwd/rama/HEAD/status verificados; agente independiente sin cambios al código app.
QA escribe sólo este documento y evidencia nueva con prefijo `qa-` en
`/private/tmp/central-hill-guides-cms-qa/`.

App production `http://127.0.0.1:3061`, Node22.23.3, Playwright. DB/rol
`guidescmsqa`, proxy4468, PostgreSQL17 dedicado5568, bucket local `guidescmsqa`
vía9061. No producción, previews3059/3060 ni credenciales reales. Las escrituras
DB/media fueron exclusivamente aisladas. El navegador también leyó la imagen pública
remota del aside Pages preexistente; por ello no se afirma que **todos** los recursos
leídos por browser fueran sintéticos. Ninguna escritura a ese recurso remoto.

Evidencia reproducible: `qa-results.jsonl` y scripts/capturas indicados abajo en ese
directorio. Acciones reales Next ejecutadas con sesión staff, por UI y por replay
HTTP `Next-Action` del manifiesto de producción. Las pruebas HTTP usan HTML anterior
al payload RSC o DOM visible, sin contar textos sólo presentes en Flight.

Acceso loopback/Chromium necesitó escalación por sandbox EPERM. Hubo una espera larga
de herramienta entre la ejecución parcial y su devolución; timestamps JSONL son la
fuente de tiempo. No se contabiliza esa espera como tiempo de guardado de producto.

## Hallazgos y retests

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| QA-01 | P1 | Publicar nueva guía no refresca sitemap cacheado | Corregido y retest PASS en bec225e |
| QA-02 | P1 | Lugar admite UUID de imagen inexistente; helper omite clave `media_id` | Corregido y retest PASS en bec225e; MIME incorrecto también rechazado |
| QA-03 | P2 | Guardados no-op reescriben slugs y cargan medios repetidos | Root optimizó; save aislado final4431ms, limitación local registrada |
| QA-04 | P2 | Alta tras baja intermedia reutiliza position y cambia orden al recargar | Corregido; retest UI ambos niveles y API defaults PASS en1a2739c |

### QA-01 · sitemap

`qa-sitemap.cjs`: calentar `/sitemaps/guides` (200,28833bytes), crear draft custom
con sección/body válidos, publicar y comprobar detalle200. En0e8fc75 el XML siguió
28833bytes y omitió `qa-new-sitemap-1792350975170`, aunque detalle200.
Root añadió invalidación `sitemap`. Enbec225e nueva guía
`13da9651-7a03-4fa1-b25c-4061561edb16`, detalle200 y sitemap31775bytes incluyó su
slug. Alta archivada al finalizar. Además `qa-close.cjs` comprobó cambio de slug EN:
nueva URL200, anterior404, sitemap actualizado y slugs PT/ES/FR retenidos.

### QA-02 · medios manipulados

`qa-adversarial.cjs`: `saveGuidePlace(page0,section0,{id:place0,
changes:{media_id:randomUUID},source:{}})` devolvió `ok:true` en0e8fc75.
Helper sólo examinaba sufijo `_media_id`, omitiendo clave exacta `media_id`.
Referencia original restaurada a `38e0ac23-8361-437e-87c6-cf14b01c6d65`.
Enbec225e mismo payload devuelve `validation`, fieldError del `media_id`.
`qa-extra.cjs`: asset aislado con MIME video/mp4 rechazado en slots página,
sección y lugar; asset falso eliminado en finally. No writes de refs inválidas.

### QA-03 · duración

Primer no-op live1sección/3lugares:7102ms; publish de1sección8558ms,
archive9523ms. Root eliminó reescritura de4slugs omitidos y agrupó referencias de
medios. Segunda pasada ejecutó hasta3pipelines concurrentes: resultados4–17s no
son comparación válida con la primera pasada. Último save aislado en1a2739c (sin otros pipelines QA):4431ms, `ok:true`.
No se afirma mejora porcentual ni presupuesto de producción basado en cargas distintas.
La optimización elimina trabajo innecesario; admin sigue mostrando estado Saving
durante la persistencia. Esto no mide TTFB/LCP público ni es un test de carga.

### QA-04 · orden tras borrar y añadir

`qa-add-after-delete.cjs`, guía `bdd71d24-1943-4f69-8a72-72a6998716f6`, sección
`f408c46b-6a00-4217-9ed9-73d744ba5004`:

1. Lugares en posiciones0,1,2; borrar el intermedio mediante acción real.
2. Abrir editor y controlar `crypto.randomUUID()` sólo en navegador QA para devolver
   UUIDv4 `00000000-0000-4000-8000-000000000001`.
3. Añadir/guardar lugar: UI lo añade después de `QA retained last`.
4. Recargar: nuevo lugar aparece antes del último. Ambos persisten con position2;
   desempate por UUID cambia su orden. Evidencia `qa-add-after-delete.png` y JSONL.

No depende del azar del UUID. La causa es `position=children.length` con huecos.
Root y A corrigieron en7f9c391+1a2739c (max position+1).
`qa-order-retest.cjs`, exit0: nueva fixture con posiciones0,1,2; borrar1,
controlar UUID mínimo y añadir desde UI. Tras save/reload, sección y lugar nuevos
quedan después del anterior último, con position3 y mismo orden DOM/DB. Create
por API sin position asigna4 en ambos niveles. También borrar una sección con un
lugar elimina sus filas/translation rows y conserva el asset sintético compartido.
Todos los retests PASS, sin compacción destructiva de datos previos.

## Cobertura funcional efectivamente ejecutada

| Área | Resultado y evidencia |
|---|---|
| Navegación/listado | Login admin,10guías iniciales, categorías/conteos; búsqueda Eat filtra correctamente; `qa-initial.cjs`, `qa-ui.cjs` |
| Alta/editor | Draft desde UI, sección y lugar, guardado/recarga; save de sección retiene draft de título de página y no lo persiste inadvertidamente; `qa-ui.cjs` PASS |
| Responsive/teclado | Desktop1440×1000; editor390×844 sin overflow; Tab desde title a intro; público390×844 sin overflow. Capturas revisadas visualmente |
| Corpus preservado | `qa-corpus-bounded.cjs`:8page+8section+8place saves con source actual explícito y assert `ok:true`; snapshots íntegros8/59/86 antes/después iguales en IDs, columnas, fotos, layout/presentation, valores/estados/source_hash de traducciones y slugs. Se ignoran timestamps/actor de source reescrito |
| Variantes corpus | Un representante por8templates; eat teléfono/precio/foto, beaches dirección/foto, secrets Feira da Ladra horario y travellers barrios. `qa-corpus-before.json`/`qa-corpus-after.json` |
| Reorder existente | Eat3lugares: reverse y restore reales conservan3IDs, medios y9translation rows; `qa-corpus-reorder.cjs` PASS |
| CRUD adicional | Fixture custom/standard con CTA y dos secciones; reorder secciones/lugares; delete lugar y sección limpia traducciones hijas; títulos duplicados admitidos; `qa-extra.cjs` PASS hasta su check SEO incompleto |
| Módulos | `qa-modules.cjs`:5módulos independientes y sección completa off/save/reload/on, valores/textos/fotos/IDs preservados; markers visibles desaparecen/reaparecen;5PASS y whole-sectionPASS |
| Orden final | UI append después de middle-delete en sección/lugar y API create sin position PASS; `qa-order-retest.cjs`, 1a2739c |
| Cascade final | Delete sección con lugar limpia ambos contenidos/traducciones y conserva media compartida; mismo script PASS |
| Recomendaciones/cache final | Ocultar places en guía inicial retira su Restaurant del índice y selecciona siguiente elegible real de la ciudad (`QA PLACE CONTENT`); body temporal y flags restaurados; `qa-final-close.cjs` PASS |
| Archivo/clear final | Archive retira detalle404 y sitemap; clear description elimina EN+target ES; `qa-final-close.cjs` PASS |
| Composición pública | Horarios, website/book HTTPS, teléfono tel:+351123456789, Directions coordenadas38.7,-9.1 y CTA real observados en DOM. `qa-close.cjs`: ocultar imagen quitó2imgs (header+mosaico) de8a6 |
| Validación | Rechaza sección/lugar ajenos, orden duplicado, JS/userinfo URLs, phone inválido, coordenada sin pareja, CTA incompleta, ciudad draft en guía live y ocultar última sección; `qa-adversarial.cjs` PASS |
| Config desconocida | presentation version99 guardada mediante SQL QA: admin bloquea guardar y action devuelve invalid_stored_content conservando JSON desconocido; finally restaura original; `qa-integrity-actors.cjs` PASS |
| Auth/atribución | Translator y noStaff: action303 sin éxito; admin textual source guarda updated_by null y updated_by_user_id textual; editor UUID guarda ambas columnas UUID; `qa-integrity-actors.cjs` PASS |
| Medios reales | JPEG generado localmente, queue/remove sin upload, PUT+finalize real, persist/reload y clear; PUT abortado sólo en browser deja DB sin referencia nueva y modal Failed, sin falso éxito; `qa-media.cjs` PASS |
| Fallo parcial | Trigger aislado rechaza únicamente valor QA-PARTIAL-INJECT en translation. UI bloquea edición y ofrece reload; trigger eliminado en finally; reload/retry conserva ID y persiste body correcto; `qa-partial.cjs` PASS |
| Traducciones/cache | `qa-translations.cjs`: save/approve/reset reales de page.title/section.title/place.name enES/PT/FR,9combos reflejados en DOM sin restart; ENsource correcto.25rows originales restauradas con script dedicado |
| SEO/rutas | Wrong-city/missing404; canonical,4hreflang y OG→hero local observados; slug EN nuevo200/anterior404/sitemap actualizado/PTESFR retenidos. Local canonical relativo a ruta, como metadata del entorno; no auditoría SEO de producción |

No se ejecutaron145saves redundantes del corpus. La primera pasada completa se acotó
por decisión del orquestador y se reinició con asserts/source explícitos; sus exits
por SIGTERM son del proceso QA propio, sin matar servidores/procesos ajenos. Los
snapshots8/59/86 cubren toda estructura aunque sólo se escriben24representantes.

## Scripts, capturas y checks

Ejecutados con `/Users/maxi/.nvm/versions/node/v22.23.3/bin/node` sobre archivos QA:
`qa-initial.cjs`, `qa-sitemap.cjs`, `qa-adversarial.cjs`, `qa-ui.cjs`,
`qa-partial.cjs`, `qa-media.cjs`, `qa-integrity-actors.cjs`,
`qa-corpus-bounded.cjs`, `qa-corpus-reorder.cjs`, `qa-modules.cjs`,
`qa-translations.cjs`, `qa-restore-translations.cjs`, `qa-add-after-delete.cjs`,
`qa-extra.cjs`, `qa-close.cjs` (parciales por expectativas harness),
`qa-order-retest.cjs` y `qa-final-close.cjs` (ambos exit0).
Todos resultados y exits en `qa-results.jsonl`; `qa-run.cjs` encadena scripts.

Capturas: `qa-list-desktop.png`, `qa-editor-desktop.png`, `qa-editor-mobile.png`,
`qa-public-mobile.png`, `qa-partial-ui.png`, `qa-upload-failure.png`,
`qa-add-after-delete.png`. No se afirma revisión WCAG completa por capturas.

Checks compilación del **orquestador**, distintos de QA funcional propia:
bec225e typecheck0/lint0(5warnings históricos)/build0/91tests0.
Final1a2739c: typecheck0/lint0(5warnings históricos)/build0/92tests0.
Leídos `order-build.log`, `order-full-tests.log` (92pass/0fail) y `order-lint.log`.
Logs `fix-build.log`, `fix-full-tests.log`, `fix-lint.log` leídos. Root informó
cadena0000..0021 aplicada tanto desde schema anterior como DB vacía dedicada.
No se repitieron migraciones desde QA; evidencia G0/G1 en spec.
`pnpm db:check` exit0 en G1 según spec, warning histórico0008 sin breakpoints;
P2 sólo cambia defaults/UI y no añade migraciones.
Revisión propia del diff: sin cambios kernel ni import interslice interno en los
consumidores revisados; Geography/Backoffice/Translation usan contratos.

## Dictamen y límites

**QA aprobada para integración local** de1a2739c. Los dos P1 y el P2 de orden
fueron corregidos y reproduciblemente retesteados. Persistencia, aislamiento y
checks exigidos están cubiertos; no queda un caso requerido bloqueado.

QA autoriza al orquestador a stage/commit de este informe dentro de la entrega
local autorizada. No concede push, despliegue ni escrituras de producción. No
se entrega benchmark de producción, auditoría WCAG completa ni revisión visual
exhaustiva de32URLs: las ocho variantes se verificaron por modelo/snapshot y
representantes; los4locales se ejercitaron mediante el árbol sintético traducido.

Los fallos de harness se registran como tales: selector `main` inexistente en público,
mayúscula de copy de invalidStored, locator lazy al añadir hijos, meta OG esperado
erróneamente en fixture sin hero y rec Porto esperado ignorando scope por ciudad.
Ninguno se usa para afirmar defecto app ni aprobación. Warning nativo libvips duplicado
observado al coexistir dependencias heredadas; upload real funcionó. Sin cambios de
paquetes/binarios por ese warning. No push, deploy ni writes de producción.
