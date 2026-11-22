# Editor save/publish feedback — QA independiente

QA aprueba el producto `15aea40dceb06726604d9f6a8caa23d959f42eb0`, ejecutado como producción aislada en `127.0.0.1:3096`, Node 22.23.3. La matriz finita termina con **309 contratos aprobados y cero pendientes**. No se hizo merge a main, push ni deploy.

La evidencia privada está en `/private/tmp/central-hill-editor-feedback/qa/`. `matrix-final.json` identifica cada contrato, artefacto, caso y SHA realmente ejecutado. No se presentan los 309 contratos como 309 E2E independientes: 259 tienen ejecución E2E aplicable, 46 combinan un guard de UI real con validación focal y cuatro cardinalidades de Services combinan inspección del guard fuente con pruebas focales de estados imposibles de emitir por UI. Las excepciones de arquitectura se explican por subparte; no encubren casos pendientes.

## Cobertura terminal

| Familia | Contratos | Evidencia principal |
|---|---:|---|
| Acciones F01–F12, sin F03 | 60 | `core-*.json`, `create-only.json`, `persistence.json`, `multi-correction.json`, `routes-optionals.json` |
| Idiomas L01–L09, L03 por los cuatro idiomas | 60 | `core-*.json`, `*-managed-source.json`, `page-managed-source-after.json`, `no-publication.json`, `page-fallback.json`, `pages-upload-isolation.json`, `upload-known-context-after.json` |
| Requisitos F03 | 97 | `fields-pages.json`, `fields-service.json`, `groups-*.json`, `blog-fields.json`, `required-cta.json`, `create-extra.json`, `empty-list-guard.json`, focales |
| Pipeline de archivos U01–U11 | 15 | `uploads.json`, `public-media.json`, `rich-upload.json` |
| Integraciones adicionales de rutas/templates/categorías | 20 | `routes-optionals.json` |
| Condicionales | 18 | `conditionals-native-guide.json`, `conditionals-native-service.json`, `conditionals-blog.json` |
| Cardinalidades Services no emitibles por UI | 4 | `service-cardinality-source-review.json`, `focal-structural.json` |
| Compatibilidad legacy | 4 | `legacy.json` |
| Grupos estructurales de Pages | 31 | `structural-without-home.json`, `structural-without-owners,real_estate,about,guest,buildings.json`, `focal-structural.json` |
| **Total** | **309** | `matrix-final.json` |

Los 97 requisitos son 25 de Pages, 13 de Guides, 41 de Services y 18 de Blog. Incluyen asterisco real del campo/grupo, rechazo aplicable a Save o Publish, identificación humana, estado rojo, asociación del mensaje, destino de foco y corrección. Los trece iconos obligatorios de Pages, el icono de fact de Service y la cardinalidad cero de lista Blog tienen guard de UI más focal; no se fabricó entrada mediante cambios de DOM. Las cuatro cardinalidades adicionales de Services declaran explícitamente inspección del guard, no un error browser que el editor impide representar.

Se completaron las doce Pages, ambas superficies de Blog Page, SEO, los nueve templates de Guide y las tres categorías de Service. F05 Pages prueba valores opcionales montados, incluidos textarea, medios, iconos y listas con mínimo cero, con SQL vacío/false/default permitido, Save real y Publish real. El inventario visible corregido tiene 416 patrones escalares/icon/media: `owners.plans.helpers[].cta.url` está oculto y se retiró de los visibles; no cambia los 25 F03 ni los 31 grupos.

## Idiomas, publicación y archivos

EN, ES, PT y FR se guardaron y publicaron por separado, comparando las filas completas de los otros tres locales: publicaciones, drafts, revisiones y fechas. La corrección parcial de ES conserva otro error ES y los errores conocidos EN/PT; completar ES permite su publicación sin publicar ni corregir los otros idiomas. Las pestañas rojas persisten al cerrar el toast y navegar; los destinos del resumen, foco, móvil y aviso de fallo desde la parte baja se verificaron en `persistence.json` para los cinco contratos editoriales.

La pérdida de respuesta antes del commit dejó SQL intacto; después del commit real produjo estado incierto, sin afirmar guardado confirmado ni perder el working. Los seis retests de Guide/Service/Blog incluyen PT/FR y sus cantidades en el único toast de fallo (`transport-known-all.json`). Upload también conserva los otros idiomas conocidos, sin duplicar toast ni errores (`upload-known-context-after.json`).

Se usaron reserva, presign, PUT y finalización reales contra almacenamiento QA. Los fallos por etapa, mezcla de archivos, Retry fallido/exitoso, Close, Save y Publish explícitos, operación lenta, teclado y móvil están separados en la matriz. Retry no guardó ni publicó contenido y no retransfirió el archivo ya completado. U01 incluye poster Page, hero Guide, cover Service/Blog y rich image Blog: bytes S3, hash, dimensiones, referencia publicada y decodificación/pintura efectiva desktop/móvil.

L08 distingue dependencias: Guide/Service pueden necesitar un archivo seleccionado en EN para Save ES, con origen EN e intento ES explícitos. Un rich image ES independiente fallido no bloqueó PT Blog válido. En Pages, los archivos target/OG son readonly y el cuerpo legal es text-only; el fallo de un archivo EN working independiente no hizo ningún PUT durante Save/Publish ES y mantuvo intactas las otras tres filas.

L06 conserva el contrato existente: sin publicación propia, Guide/Service/Blog permanecen ausentes/404; legales usan el documento EN completo; Pages generales conservan defaults/legacy, sin inventar fallback EN. L07 valida dependencias realmente guardadas: City Guide, Category Service y referencias OG Pages. El rechazo conserva el idioma seleccionado; el resumen lleva explícitamente al origen EN y conserva el texto ES. En Blog, una referencia propia congelada no resoluble requiere reparación/adopción explícita de detalles EN; la validez de otro snapshot EN no es requisito de publicación ES. Los MIME temporales de los assets exclusivamente QA se restauraron a su fila exacta incluso al fallar el harness.

Pages tiene doce claves fijas y no ruta de creación de identidad: sólo esa subparte de F12 es N/A. Los guards y la primera autoría/publicación propia EN/target sí tienen E2E. Los módulos condicionales inexistentes de legales y los archivos propios target inexistentes se declaran N/A por subparte.

## Defectos y ejecuciones heredadas

Se cerraron la normalización de errores Service; asociaciones y marcadores de grupos Guide; la persistencia de errores/ARIA y foco del Rich Text; errores condicionales que persistían al desactivar; el prefetch automático Service cuyo solapamiento observado motivó la corrección; el origen de archivos EN necesarios para ES; idiomas conocidos omitidos en fallos inciertos/de subida; el breadcrumb/foco del grupo Photo; y los orígenes compartidos EN de Guide y OG Pages, también legales.

Las primeras evidencias defectuosas siguen privadas. Los fallos del harness —selectores distintos por arquitectura, paneles/RAF, fixtures incompletas, opcionales por defecto y login 429— no se clasifican como producto ni como aprobación. Las fases F05 y las cinco correcciones Pages inicialmente incompletas se reabrieron y sólo cerraron con comprobación semántica y SQL. La sesión reutilizada procede exclusivamente de un login normal propio QA; no se alteró autenticación ni rate limits.

Los SHA ejecutados se conservan por caso:

- `b0c918f669c53d57585d7d7bd0c44ef8833b4703`: contratos iniciales, transporte/SQL, grupos/guardas, uploads y legacy.
- `b40589832523adcfa32505b26e528be0358bb660`: Category/time Service, grupos Guide, condicionales Service, creación Guide/Service y tres ciclos públicos Service sin prefetch.
- `53088f3538c9c720d97f02199aef3c621e32c8ff`: Rich Text, cuerpos/correcciones Pages afectados, condicionales Guide y creación Blog mínima.
- `56052386cdfd356af8b3258e19008d24f13bdf6e`: contexto de idiomas de transporte/subida, L08 compartido y pipeline/pintura rich image.
- `15aea40dceb06726604d9f6a8caa23d959f42eb0`: Photo, fuentes EN Guide/OG Pages, F05/rutas finales, cuatro CTA obligatorios, condicionales Blog/URL opcional Page, persistencia y L08 Pages finales.

La revisión de cambios y de los dos implementadores justifica la herencia por componente; los requisitos afectados se retestaron. No se renombró ninguna ejecución previa con el SHA final. El primer stale público Guide fue provocado por reiniciar el runtime entre Publish y lectura, perdiendo invalidaciones en memoria; se preservó y repitió con acción real. El stale Service independiente sí motivó desactivar prefetch del enlace del editor. Los tres ciclos diagnósticos anteriores pasaron: no se presentan falsamente como fallidos; los tres posteriores dieron SQL/H1 exactos y cero prefetch.

## Aislamiento y conservación

Main y la restauración intacta se comprobaron por el orquestador: 49 tablas/1534 filas originales, auth y ledger exactos; main `931a28b`, 1480 archivos y once entradas env/logo/symlink preservados. QA independiente comprobó sus 49 tablas y **1530 filas originales protegidas exactas**, con cero cambios. Sólo se excluyeron ocho identidades Page Home/Privacy declaradas antes de los writes; no tablas completas. Las otras cuarenta filas Page son nuevas QA. El ledger de 32 entradas permanece exacto.

`originals-check.json` y `originals-final-check.log` contienen la conservación; `final-fixture-identities.json` enumera 849 filas nuevas de 16 tablas, las ocho identidades preexistentes autorizadas y las cuatro entidades creadas por UI. Los snapshots, credenciales, sesiones, datos auth, archivos y evidencia raw permanecen privados, fuera de Git, sin limpieza de DB/almacenamiento.

El código de configuración de producto se mantuvo intacto. Para probar el optimizador real contra S3 local se declaró un overlay runtime privado: `images.dangerouslyAllowLocalIP` y un patrón limitado a `127.0.0.1:9095/editor-feedback-qa/**`. Los manifests de cada build registran ese delta; no se fingieron bytes, respuestas PUT, Save ni Publish. El build final arrancó con el adapter desde el inicio y caché nueva.

Raíz acredita build/typecheck/lint sin errores, 104 pruebas focales/regresión sin skips y revisión visual final. `root-visual-review.json` y `root-matrix-final-audit.json` complementan la revisión independiente. La entrega documental posterior sólo puede heredar esta aprobación si conserva exactamente los 1205 archivos de producto —968 en src/messages— del build aprobado. El SHA documental final se verificará por separado antes de entregar el candidato.
