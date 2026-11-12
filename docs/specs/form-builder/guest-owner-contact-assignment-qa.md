# QA independiente — Guest Owner Contact

2026-11-12. **APROBADO para integración funcional local** del candidato `24fa21331cefa041396911a43c21782eaf1fc09b`, producto `752c791`, en `/private/tmp/central-hill-guest-contact-integration`, producción local `http://localhost:3084`. Sin defectos de producto abiertos. Resend real permanece fuera de alcance.

## Identidad y límites

Guardas exactas de host/DB/rol: `guestcontactqa20261112.local` / `guestcontactqa20261112` / `guestcontactqa20261112`; preload propio exclusivo hacia4558, EMAIL_PROVIDER console y medios locales9081. Login normal con cuenta local autorizada; sin extraer cookies, tokens o storageState. QA no cambió fuente, env, runtime ni cachés. Main3071 y authoredDB quedaron excluidos; sin DDL, remoteDB/R2 writes, envío real, push o despliegue.

El dataset QA es un clon completo. Las excepciones de edición autorizadas fueron los snapshots Guest, About EN y Settings para probar las tres ubicaciones, sus traducciones de Settings, los contadores durables y los nuevos formularios A/B con sus traducciones, leads y test. About/Guest/Settings del clon no se declaran inmutables: sus cambios fueron intencionales y se conservaron. Raíz verifica el main original por separado.

## Resultado funcional

**33 casos registrados pasan a la primera, cero pageerrors/adminerrors**, en tres grupos acotados; el segundo se ejecutó como captura y locales para facilitar reproducción:

1. `qa/group1-editor.json`,9casos. Selector inmediatamente debajo de Owner contact dialog intro, dentro del grupo del diálogo. Refresh conserva selección e intro sin guardar; crear/editar enlazan Forms. Preview inicial legado y preview configurada con A sin guardar tienen cuerpo inerte; foco desde Close con Tab/ShiftTab permanece en el diálogo y Show/Hide conserva el puente contextual. ES utiliza la elección EN de trabajo sin guardar, localizada y sin lead; selector target bloqueado con acceso EN. Save draft/reload conserva A pero el público mantiene legado. Archive queda bloqueado por draft EN. Publish EN activa A en los cuatro idiomas sin alterar sus JSON publicados target; título/intro siguen siendo de Guest, sin encabezado Forms duplicado.
2. `qa/group2-capture.json`,10casos. Modal EN desktop con dos columnas, nueve tipos y dos pasos; archivo>5MiB rechazado en cliente y PDF falso rechazado en servidor sin lead. Date/File y las respuestas sobreviven Next/Back. Captura real `contact` / `guests-dual-cta`, marketing false, nueve campos históricos, labels/opciones/fecha/consentimiento y metadata PDF exactos, sin test privado. Replay del POST anónimo real idempotente; misma clave con payload modificado rechazada; dos POST concurrentes con clave nueva producen un ganador. BO muestra etiquetas legibles y console registra una notificación por ganador.
3. `qa/group2-locales.json`,3casos más las visitas ES/FR/PT registradas. Labels aprobados localizados; el label FR pendiente usa EN y no filtra texto pendiente, destinatario o nombre interno. PT390px apila una columna sin overflow; modal con scroll, body lock y foco contenido. Close restaura foco/cuerpo, reabre y Escape cierra. Captura PT guarda origen Guest y labels/consentimiento PT exactos.
4. `qa/group3-lifecycle.json`,11casos. Guest A permanece independiente de header/About B; el mismo A puede usarse en los tres sitios. Guest A abierto antes de Save draft B sigue capturando; el header captura su propio origen. POST anónimos reales con claves cruzadas Guest/header se rechazan en ambos sentidos. Save Forms/Approve PT actualizan Guest sin cambiar su revisión/publicación y el lead antiguo conserva su label. Archive A bloqueado por Guest EN publicado mientras draft apunta B y About/header están null; Publish B vuelve A stale sin captura extra; B publicado también bloquea archive. Test staff queda separado/logged. Null+Publish restaura legado EN/PT, preserva CTA de reserva por locale y los contactos independientes de About/header.

A se creó por UI desde la plantilla **newsletter** y B desde contact; recipient y copy inicial se guardaron por UI. A recibió los nueve tipos, dos pasos, filas de una/dos columnas y120textos target mediante seed SQL limitado a ese formulario nuevo. Ese seed es preparación de fixtures, no una prueba browser del constructor de cada campo. La captura pública real de A sigue siendo `kind=contact` / `source_page=guests-dual-cta` pese a su plantilla newsletter. Los posteriores Save EN y Approve PT sí se ejercitaron por UI.

Se utilizaron cinco claves públicas nuevas en total: fallo PDF/éxito/replays comparten clave; la carrera usa otra; PT, supervivencia del draft y header compartido completan cinco. No se borraron cuotas ni reiniciaron cachés para lograr resultados. No se repitió la matriz general de páginas.

## Revisión visual y de fuente

Una tanda visual posicionada, `qa/visual-batch.json`: selector debajo de Intro, modal EN de dos columnas y PT de una, título/intro correctos, Date/File/hint/botones legibles y scroll móvil real sin overflow. Evidencia `visual-selector-desktop.png`, `public-A-EN-step1.png`, `public-A-PT-mobile.png` y `public-A-PT-mobile-lower.png`. Sin defecto visual ni iteración estética.

Revisión fuente independiente: autoridad publicada Guest EN, identidad ID+published_at independiente del draft, uso EN draft OR published y UUID case-insensitive. Contratos server-only fuera de barrels cliente; acción fija el origen y comparte admisión entre tres ubicaciones; invalidación de cuatro rutas Guest preservando Header/About. Una referencia inválida se retira aisladamente del render sin perder textos Guest. El cuerpo inerte y filtro de foco de ContactDialog solo se activan en preview privada; se comprobaron en el primer candidato. Las ocho cadenas loading se parsearon como U+2026 correcto; no se produjo un falso hallazgo por serialización.

Raíz aporta153pruebas afectadas,10casos DB reales, typecheck/lint/build/dbcheck/detector. QA revisó las costuras y distingue esa evidencia de sus casos browser. Concurrencia archive/publicación, snapshot fresco, omisión de cliente anterior, tampering target, inválidos/uppercase y seis direcciones de claves cruzadas entre tres ubicaciones consumen evidencia dominio/DB de raíz/B. Browser solo afirma los dos sentidos Guest/header ejercitados; no se presenta un envío público About adicional ni corrupción de datos/bundle antiguo como probado en navegador.

## Datos protegidos y estado final

`qa/protected-check.json` pasa:35tablas ajenas completas exactas; filas originales form_definition, form_test_submission, lead y lead_field exactas excluyendo únicamente fixtures A/B; otros page_locale_content exactos; traducciones originales exactas salvo la excepción autorizada Settings. Ledger31 exacto; ninguna migración.

`qa/final-data.json` confirma cinco leads propios (cuatro Guest y uno header), un test staff y exactamente una notificación console por cada ganador. Final QA: Guest EN publicado null/draft null, About EN publicado null/draft null y header Settings null. El intro sintético Guest y los demás cambios autorizados del clon se conservan. No limpieza de datos ajenos.

- A `a60e5a5e-5ece-4352-9e16-577182c0c940` (newsletter).
- B `2bccf019-ff8e-4f71-8e82-089d1882e7d6` (contact).
- Leads Guest: EN `1864012a-dc39-4502-aab9-529687373b7f`; carrera `6dbb76ee-7cdc-4926-815f-08a3930c2495`; PT `61b37e6d-9c1b-4709-995d-8c6a117dd434`; supervivencia del draft `ed37f9a9-5f84-4f1f-9b51-54b8ac281015`.
- Lead header `147572fb-995a-4644-bdfc-14c6617022e5`.
- Test staff B `68bfd994-e001-497d-8a68-56765defae6a`, delivery logged.

## Comandos y cierre

Node22, cwd candidato y RUN_GUEST_CONTACT_QA=approved: prepare-browser.mjs0, seed-layout.mjs0, group1-editor.mjs0, group2-capture.mjs0, group2-locales.mjs0, visual-mobile-lower.mjs0, group3-lifecycle.mjs0, final-data.mjs0 y protected-check.mjs0. Scripts/JSON/capturas bajo `/private/tmp/central-hill-guest-contact/qa`; sin fallos de harness, correcciones de producto ni retest funcional. HEAD final24fa213 permanece; durante el cierre raíz actualizaba únicamente el documento de ejecución, además de los dos symlinks públicos retenidos no seguidos. QA no editó esos archivos.

Aprobación funcional local sin bloqueantes. Resend sigue sin configurar: console demuestra construcción y notificación local tras captura durable, no entrega o recepción real de correo/adjuntos. Ningún envío real intentado. Integración, apertura final main y conservación de authored data corresponden a raíz.
