# QA independiente — About Contact

2026-11-12. **APROBADO para integración funcional local** del candidato `8dee5d680f84864263156c04bd95a083badaf316` (producto `17b3199`) en `/private/tmp/central-hill-about-contact-integration`, producción local `http://localhost:3083`. Recepción real de Resend fuera de alcance. La observación P3 de copy de carga quedó cerrada como falso positivo de serialización mediante parse independiente de8cadenas y Loading real en navegador; no hubo corrección de producto ni cambio del candidato.

## Identidad y límites

Guardas verifican host/DB/rol `aboutcontactqa20261112.local` / `aboutcontactqa20261112` / `aboutcontactqa20261112`, EMAIL_PROVIDER console, endpoint de medios local9081 y la variable de readiness entregada por raíz. Preload exclusivo de ese destino. Login normal con cuenta local autorizada, sin extraer cookies/tokens/storageState. No main3071, remoteDB/R2 writes, proveedor real, DDL ni cambios de fuente/env/runtime/cachés por QA.

El clon QA contiene filas originales del usuario. Se autorizaron en ese clon únicamente los cambios About EN y Settings necesarios para header independiente/compartido, sus traducciones de Settings, contadores de admisión y fixtures nuevos A/B con sus traducciones/leads/test. No se declaran inmutables About/Settings de QA. El main original está excluido de estas pruebas; raíz aporta su conservación por separado.

## Resultado funcional

**33 casos registrados, todos pasan; cero pageerrors/adminerrors**, en tres grupos funcionales acotados (el segundo dividido en capture/locales para ejecutar la misma tanda de forma reproducible):

1. `qa/group1-editor.json`,8casos: selector inmediatamente después de Subtitle; catálogo refresh conserva selección y Subtitle sin guardar; enlaces crear/editar; EN de trabajo sin guardar aparece en preview ES inerte, selector ES bloqueado con acceso EN y sin lead. Save draft/reload conserva A, público anterior continúa legado. Archivo bloqueado por draft EN. PublishEN activa A en4idiomas y los JSON publicados ES/PT/FR permanecen exactos. About mantiene título/Subtitle, sin duplicar encabezado de Forms.
2. `qa/group2-capture.json`,10casos: ENdesktop2columnas; archivo>5MiB rechazado en cliente; falsoPDF rechazado en servidor sin lead; Date/File y respuestas preservados entre pasos. Captura real contact/about-contact, marketingfalse,9campos históricos, labels/select/date/consent y metadataPDF exactos, ningún testprivado. Replay del POST anónimo real idempotente, misma clave/payload alterado rechazado,2POST concurrentes con clave nueva producen1lead. BO legible y una notificación console por cada ganador.
3. `qa/group2-locales.json`,3casos más ES/FR/PT registrados: labels aprobados localizados; FRpendiente usaEN y texto pendiente no aparece. PT390px1columna sin overflow; captura PT guarda labels y consentimiento PT exactos.
4. `qa/group3-lifecycle.json`,12casos: headerB independiente de AboutA; mismoA en ambos destinos captura orígenes correctos; draftEN cambiaB pero A abierto conserva captura válida; replays anónimos con clave del otro destino rechazados en ambos sentidos. SaveForms/ApprovePT actualizan About sin cambiar revision/publicación About; labels históricos conservados. A abierto queda stale al publicarB, sin lead adicional. Archivo bloqueado por publishedEN mientras draftapuntaotro, y por Bpublicado. Teststaff separado/logged sin lead. Null+PublishEN vuelve contacto legadoEN/PT. Service inline y Ownershero conservan integración anterior.

A/B y su recipient/copy inicial se crearon/guardaron por UI. La estructura compleja de A (9tipos/2pasos/filas1o2columnas) y120textos ES/PT/FR se prepararon por SQL limitado a ese formulario propio después de su creación UI. Esta preparación no se presenta como prueba browser de crear cada campo/traducción. SaveEN y ApprovePT posteriores sí se ejercitaron en la UI real.

La admisión usó5claves nuevas en toda la secuencia pública: falloPDF/éxito/replays comparten clave; carrera usa otra; PT, supervivencia del draft y header compartido completan5. No se borraron contadores ni se reiniciaron cachés para conseguir aprobación. No se volvió a ejecutar la matriz global de páginas.

## Visual y correcciones

Una tanda visual correctamente posicionada `qa/visual-batch.json`: selector debajo de Subtitle legible y consistente con el editor; público ENdoscolumnas y PTmóvilunacolumna, Date/File y botones legibles, sin overflow. Capturas finales `visual-selector-desktop/detail.png`, `visual-form-en-desktop/detail.png` y `visual-form-pt-mobile/detail.png`. No defecto visual adicional.

La observación P3 de raíz sobre8cadenas loading/loadingSelection fue un falso positivo al interpretar la salida JSON doblemente escapada de herramientas. Las cadenas fuente ya decodifican U+2026 correcto; no hubo cambios de producto, commit de corrección ni rebuild. QA confirma el parse de8valores y el estado Loading real del navegador en la misma producción3083 (`qa/loading-confirmation.json`). Los33resultados funcionales permanecen vigentes.

El primer intento de group1 fue un error de harness: esperar visibilidad de un `<option>` nativo, que Chromium mantiene oculto. Se corrigió a estado attached antes de cualquier mutación About. Las primeras capturas generales estaban fuera del formulario o durante Reveal; se sustituyeron como evidencia visual por la tanda posicionada, sin cambio de producto. No son defectos funcionales ni justifican repetir casos aprobados.

## Datos protegidos y fixtures retenidos

`qa/protected-check.json`:35tablas ajenas completas exactas; filas originales form_definition/form_test_submission/lead/lead_field exactas excluyendo solo fixtures A/B; otros page_locale_content exactos; traducciones originales exactas salvo la excepción autorizada company_settings. Ledger31 exacto, sin migración.

- A `f4f0546c-218b-4a92-972e-b09ea8740b3d`.
- B `b8439b57-121a-4953-82e8-2d58a74d9445`.
- Leads About: EN `14abc0d6-6c62-4489-a5e8-427e031d73b7`, carrera `6137e544-183e-47ec-a833-fe87d8db269f`, PT `34400389-6d08-4d80-8835-064824fe7735`; supervivencia draft `48261c03-341a-42e2-8d8d-73338fac93e7` y header `ec58ef83-9307-48c6-80bb-0b26bac302d1`.
- Teststaff B `f52d4efd-e360-4c8c-8e1e-87d54a1d1895`, logged.
- Estado final QA tras visual: About EN publicadoA/draftnull; headerSettingsnull. El caso null ya se aprobó antes de reasignar A únicamente para capturas visuales. Fixtures retenidos, sin limpieza de datos ajenos.

## Evidencia de raíz y alcance no probado por browser

Raíz aporta por separado checkpoint/restores exactos,123pruebas afectadas,7grupos/casos DB reales, typecheck/lint/build/dbcheck y detector. QA revisó fuente de contratos/guardas, no ejecutó esos comandos como browser. Se verifican autoridad publishedEN, identidad independiente del draft, SQLguard bajo lock común, snapshot fresco READCOMMITTED y origen idempotente. Casos UUIDinválidos, omisión de cliente viejo, tamperingtarget, uppercaseIDs y concurrencia editorial/archive consumen esa evidencia de dominio/DB, no se presentan como bundles antiguos o corrupción de datos en browser.

Resend sigue sin configurar. Console prueba construcción y captura durable; no prueba entrega, recepción de adjuntos, remitente o DNS. No envío real intentado.

## Cierre de aprobación

`qa/loading-confirmation.json` confirma los8valores U+2026 (8230) y el botón real «Loading…»/opción «Loading selected form…»,0pageerrors. No defecto de producto abierto. `qa/final-data.json` verifica5leads propios (4About/1header),1testprivado y exactamente1notificación console por ganador. Relectura final de protección después de las capturas visuales mantiene todas las huellas protegidas y31migraciones exactas. HEAD final sigue8dee5d6, sin cambios tracked; solo los2symlinks públicos retenidos no seguidos.

Comandos Node22 con RUN_ABOUT_CONTACT_QA=approved en cwd candidato: prepare-browser.mjs0; seed-layout.mjs0; group1-editor.mjs0 tras corrección de espera de harness; group2-capture.mjs0; group2-locales.mjs0; group3-lifecycle.mjs0; visual-batch.mjs0; loading-confirmation.mjs0; final-data.mjs0; protected-check.mjs0. No rebuild ni repetición funcional tras el falso positivo P3. Los artefactos de QA se conservan en /private/tmp/central-hill-about-contact/qa.

Raíz informó que main3071 y medios9081 heredados dejaron de escuchar fuera de acciones QA; QA no los detuvo ni tocó. Raíz reabrió el mismo servicio de medios local con los183archivos existentes. No afecta la fuente aprobada ni las pruebas de Forms. Apertura final de main y conservación authored data siguen responsabilidad de raíz.
