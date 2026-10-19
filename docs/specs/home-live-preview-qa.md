# Home live preview — QA independiente

2026-10-18. **Aprobado**, sin defectos de producto ni bloqueos abiertos en el alcance acordado.
Candidato ejecutable `8da3519256ec6839164368828fca1870a1c95425`, base `5ea4608`.
Checkout `/private/tmp/central-hill-page-drafts-integration`, rama `page-drafts/integration`.
QA verificó ruta/rama/HEAD/status; comenzó revisión sobre597fb2d y probó únicamente el
candidato final8da3519 tras la corrección MIME. QA sólo escribe este informe en repo;
los cambios documentales simultáneos del orquestador se preservan.

## Entorno y evidencia

Next production3067, PID raíz25042/session29066, DB/rol sintéticos **pagedraftsqa**
verificados antes de navegar; Postgres5618/proxy4518/storage9067. Staff sintético
`pagedraftsqa@example.test`, correo consola. Entorno seguro existente reutilizado;
Home3065 y los demás entornos intactos. Sin producción, main, push, deployment ni GitHub.
Artefactos: `/private/tmp/central-hill-home-live-qa/`.

Un único pase funcional Chromium EN/ES, desktop1600×1000 y mobile390×844:

- Acceso anónimo a preview redirige al login staff.
- Escritura continua real con teclado EN en inspector de campo único y múltiple; ES en
  desktop/mobile. Preview actualiza sin Save. Foco, caret y texto escrito se conservan;
  URL iframe estable y Publish deshabilitado con cambios pendientes.
- Una respuesta RSC anterior retrasada1200ms no reemplaza el texto posterior; se muestra
  la revisión más reciente. Refresh reenvía estado local sin navegación del iframe.
- Alternar EN/ES conserva trabajo independiente. Una eliminación de fila stats cambia
  la estructura renderizada. Selección sobre DOM rerenderizado funciona; scroll iframe
  se conserva tras editar y recibir nueva salida.
- Seleccionar local-preview.png muestra un blob del mismo origen, decodificado con
  naturalWidth positivo, en el renderer real. Miniatura local sobrevive a navegar entre
  campos. Ningún PUT ni llamada a endpoint media observados durante el pase.
- Payload de texto inválido conserva la última preview válida y muestra el mensaje de
  validación localizado; corregirlo recupera la preview. No pageerror.
- Snapshots completos de todas las filas de page_content, page_locale_content y translation
  son idénticos byte por byte antes/después; media_asset mantiene su conteo. No Save/Publish
  en este QA. Público EN/ES conserva headline/SEO publicados y no recibe marcadores locales.
- Reabrir y recargar el editor recupera el baseline guardado EN sin blob efímero.
  Capturas desktop/mobile inspeccionadas una vez: acciones/foco visibles, sin overflow.

Evidencias: browser.cjs/browser.log, browser-evidence.json, db-before.json/db-after.json,
public-final.json, hero-fields.json, mobile-live-es.png y desktop-live-local-image.png.
La imagen local se comprobó directamente en DOM y decodificación; la captura desktop final
está en Hero y no pretende mostrar el slot de imagen situado más abajo.

El guion completó todas las interacciones y falló sólo al comparar innerText público:
los contadores animados se capturaron transitoriamente en0 frente a25/12. Se conservó
browser.log; no fue fuga de contenido. La continuación de sólo lectura compara datos
estables publicados y snapshots DB, sin repetir edición, imagen ni matrices.
Su primer login API tras visitar público devolvió non-ok; la aserción sólo conservó el
booleano, sin status/body, por lo que no se atribuye un código HTTP concreto. Añadir Origin
al login del harness resolvió ese paso (coherente con cookies previas y el guard de origen).
Resultado final exit0 en browser-continuation-auth.log, mediante
browser-continuation.cjs. No cambio de auth/producto ni repetición del pase funcional.
Los navegadores se cierran en finally. Esperas por ready/revisión/estado live del iframe,
no por un mensaje Saved ambiguo.

## Revisión y checks consumidos

Leídos AGENTS, spec activa y follow-up ADR0040. Revisión manual confirma:

- renderHomeLivePreview exige requireStaff, valida locale/envelope/media y llama al mismo
  HomePage RSC. Sólo resuelve lecturas; no guarda, publica, hace flush ni invalida caché.
  El público no monta el wrapper live ni incorpora payload privado.
- Bridge valida origen, ventana, instancia, revision entera y payload JSON acotado.
  Debounce300ms, una petición en vuelo y último payload pendiente; descarta respuestas
  antiguas, conserva última salida válida y vuelve a enlazar selección sin mover foco.
- Blob sólo del origen autorizado, UUID/referencia coincidentes y MIME/metadatos acotados;
  referencias persistidas resueltas por el pipeline existente. Sin HTML arbitrario ni DOM
  text patcher. Imports entre slices por contract.ts; sin cambios de kernel/migración.
- Mensajes editor/live/local/updating/invalid/error presentes y localizados EN/ES/PT/FR.
  PT/FR revisados por código/claves, sin matriz adicional de navegador.

Checks de raíz consumidos, **sin volver a ejecutarlos**:

| Comando Node22/pnpm | Exit | Evidencia |
|---|---:|---|
| pnpm typecheck | 0 | typecheck.log |
| pnpm lint | 0 | lint.log;7warnings preexistentes |
| pnpm exec tsx --test src/slices/pages/tests/home-live-preview.test.ts src/slices/backoffice/tests/page-editor-bridge.test.ts | 0 | tests.log;7/7,A2+B5 |
| pnpm build | 0 | build.log |

Dos tests nuevos de validación Home y dos nuevos de bridge; tres de bridge ya existentes.
Typecheck/build iniciales detectaron PageMedia.mime opcional; mapper explícito en8da3519
corrige el tipo y rechaza MIME ausente. Logs iniciales preservados; typecheck/build finales
exit0 y lint focal del mapper exit0 (lint-mime-fix.log), sin necesidad de repetir los tests
puros no afectados. No db:check: sin migración nueva.

Límites: QA funcional acotado Home, sin repetir nueve pruebas de persistencia,149tests
históricos, matriz PT/FR, batería MIME/correos ni producción. Auth de la acción se revisó
directamente; el acceso anónimo de navegador cubrió la ruta. No se presenta esa revisión
como una matriz adicional de llamadas Server Action anónimas.
