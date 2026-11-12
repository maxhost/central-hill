# QA independiente — Real Estate Enquiry

2026-11-12. **APROBADO para integración funcional local** del candidato final `daf041b2a5203e7307ac49034d3a7e31cf27b44b`, producto `d7bf8dd`, servido desde `/private/tmp/central-hill-real-estate-enquiry-corrected-runtime` en3085. Candidato inicial cdf15c3/product71116df retenido como evidencia.32 casos funcionales aprobados, cero pageerrors/adminerrors; P2 heredado cerrado mediante corrección acotada y confirmación focal. Resend real fuera de alcance.

## Entorno y límites

Host/DB/rol exactos realestateenquiryqa20261112.local / realestateenquiryqa20261112 / realestateenquiryqa20261112; preload propio a4558, EMAIL_PROVIDERconsole y medios locales9081. Login normal cuenta local, sin extraer cookies/tokens/storageState. QA no cambia producto/env/runtime/cachés. Main3071 y authoredDB excluidos; sin DDL/remoteDB/R2writes/envío real/push/deploy.

El clon contiene datos originales. QA modificó únicamente snapshots Real Estate y Settings necesarios para header independiente/compartido, traducciones Settings, contadores durables y nuevos A/B/translations/leads/test. About/Guest se leyeron como regresión sin editarlos; su protección final es exacta junto a todos los demás snapshots fuera de RealEstate. No limpieza de filas ajenas. Raíz conserva el main por separado.

## P2 encontrado y corrección acotada

Los primeros6 casos de group1 pasaron. Save draft devolvió validation `hero.image_media_id: Select an uploaded file of the supported type.`; la ficha Enquiry solo mostraba el aviso general. La referencia histórica `8c343da2-a2bd-4ff1-9416-9e0bc9a2a7a0` ya estaba en el legacy page_content y no tenía fila media_asset. Todos los snapshots publicados conservaban el mismo ID. Los validadores relevantes eran idénticos a la base: defecto preexistente que bloqueaba el trabajo autorizado.

Raíz/A corrigieron solo la compatibilidad para conservar una referencia Hero RealEstate válida e inmutable ya presente en el snapshot publicado servidor cuando no puede resolverse. No acepta Hero nuevo/cambiado/malformado, MIME resuelto no soportado, otros media/OG u otras Pages. QA advirtió que Publish recibe draft como previous: la versión final usa current.published leído en servidor como autoridad adicional, y tests niegan que un draft inyectado se autorice a sí mismo. No se cambió Hero, media ni fixture para hacer pasar el caso.

Confirmación focal `qa/group1-resume.mjs`: solo3 casos restantes desde Save draft, mismos A/Note/Submit label, manteniendo los6pasados sin repetirlos. Save/reload y Publish funcionan; HeroID permanece exacto en draft/published y media_asset sigue ausente. Target publishedJSON exacto; público anterior permanece estático hasta Publish. Evidencia completa en finding-save-hero.md, diagnose-save.json, diagnose-media.json y group1-editor.json. P2 cerrado funcionalmente en candidato corregido.

## Casos reales

- Group1:9 casos (6iniciales retenidos +3confirmados en corrected). Original estático EN/PT con12 campos,2 accordions, Submit/Note registrados y submit válido EN sin POST/lead. Aperturas public/editor sin escribir snapshots. Selector bajo Note y ayuda sobre Submit label/Note legado; refresh conserva A y ambos textos; preview ENworking sin guardar también en ES, inerte, sin lead, target selector bloqueado/accesoEN. Frame presentacional con un form; no nested forms. Save draft/reload mantiene público anterior, archive por draftEN bloqueado; PublishEN activaA4locales sin tocar JSONtarget, headline/contacts originales y sin Forms heading ni Note/Submitlabel de Page duplicados.
- Group2 capture:10 casos pasan en corrected. ENdoscolumnas,9 tipos/2 steps; client>5MiB y serverfalsePDF rechazados sin lead; Date/File retenidos Next/Back. Captura newsletter-originA como deal_enquiry/real-estate-enquiry, marketingfalse,9campos históricos/select/date/consent/filemetadata exactos. BO muestra categoría Deal enquiry y etiquetas legibles. POST anónimo real replay idempotente, alteredpayload rechazado, dos concurrentes un ganador y una notificación console por ganador.
- Group2locales:3 casos pasan, ES/FR/PT. Labels aprobados, FRpendiente fallbackEN y sin datos privados; PTmóvil1columna sin overflow y captura institucional PT con consentimiento/labels exactos.
- Group3 lifecycle:10 casos pasan en corrected. Header B independiente de RealEstate A y About/Guest originales; mismoA sirve ambas ubicaciones con kinddeal_enquiry en RealEstate y contact enheader. DraftB no invalida A abierto; POSTs reales con claves cruzadas entreheader/RealEstate rechazan ambos sentidos. FormSave/ApprovePT refrescan público sin cambiar revisión/publicaciónPage y el histórico permanece. Archive bloqueado por publishedA mientrasdraftB y por Bpublicado; PublishB vuelve A stale sin captura extra. Teststaff separado/logged. NullEN/PT restaura exactamente12 campos/2 accordions/Submitlabel/Note: enviar con campos válidos sigue sin POST ni lead.

A/B se crearon por UI: A desde newsletter, B contact; recipient/copy inicial guardados UI. Nueve tipos, dos pasos, filas1/2columnas y120 textos target de A se prepararon SQL limitado a A; no se presenta ese seed como prueba browser de builder. La captura real de A prueba la categoría institucional independiente de template. SaveEN/ApprovePT posteriores se ejercitan UI en lifecycle.

El último assert de console en capture leyó el log del runtime inicial, tras el cambio de servidor, y falló después de9checks correctos. Se corrigió solo la ruta a qa-corrected-runtime.log y se finalizó la lectura de notificaciones/IDs con group2-finalize.mjs; ningún envío o clave se repitió. El primer diagnóstico de Save tuvo una espera prematura sobre LivePreviewstatus; se corrigió para extraer la respuesta Save estructurada. No son defectos adicionales de producto.

## Visual, fuente y evidencia de raíz

Una tanda posicionada: selector bajo Note, inline EN de dos columnas con sección/contactos conservados, móvil PT una columna y Date/File/hint/botones legibles; sin overflow ni nuevo defecto visual. Archivos visual-selector-desktop.png, public-A-EN-step1.png, public-A-PT-mobile.png, public-A-PT-mobile-lower.png y visual-batch.json. No iteración estética ni matriz global repetida.

Fuente: autoridad publicada EN independiente de targets/draft, identidad ID+published_at, server-only contracts, guard SQL bajo lock compartido con freshsnapshot, archivo por ENdraftORpublished4placements y UUIDcase-insensitive. Kind deal_enquiry derivado solo del nuevo origen; replay exige kind además de source/hash/revision, preservando tres contactos previos. Preview explícita staff-only/inert y DTO sin recipient/private test. Nuevo frame evita FormCard<form> alrededor de Runtime<form>. Null conserva StaticFormCard cancelando submit; nunca se montó el viejo DealEnquiryForm sin consumidores.

Raíz aporta179 pruebas afectadas finales,13 DB (10 Forms previas sin cambio +3 Pages repetidas), typecheck/lint/build/dbcheck/detector. QA revisó y distingue esos comandos de browser. Cuatro orígenes/doce direcciones con snapshots idénticos, kind incorrecto no-replay, concurrencia/freshsnapshot/omisión/tampering/invalid/uppercase y límites de compatibilidad consumen evidencia dominio/DB; no se presentan como corrupción de datos o bundles antiguos ejercitados en navegador.

Resend continúa sin configurar. Console no demuestra entrega o recepción real de correo/adjuntos; no envío real intentado.

## Protección final y fixtures retenidos

`qa/protected-check.json` pasa:35 tablas ajenas completas exactas; filas originales FormDefinition/Test/Lead/LeadField exactas al excluir solo A/B y sus capturas; todos los page_locale_content fuera de RealEstate, incluyendo About/Guest, exactos; traducciones originales exactas salvo la excepción Settings autorizada. Ledger31 exacto. PageContent legacy y media_asset permanecen exactos: no corrección de Hero ni fixture de media.

`qa/final-data.json`:4 leads deal_enquiry/real-estate-enquiry y1 contact/header-contact, Atemplate newsletter;1 test privado logged y exactamente1 console notification por ganador. HeroID8c343da2-a2bd-4ff1-9416-9e0bc9a2a7a0 sigue publicado y su asset ausente; targetpublishedJSON sigue exacto después de todo lifecycle. RealEstate EN termina publicadoformnull/draftnull yheadernull; los textos sintéticos de Note/Submitlabel del clon se conservan. No cambios en authoredmain.

- A f523f413-1255-4468-9190-db0daaec5462 (newsletter).
- B 47b583ce-7b9e-47fd-afc9-cdd69928e820 (contact).
- Leads RealEstate: EN 0049f6c5-be84-4d30-ab8f-04702c117694; carrera 6f117af8-f60b-4e08-863e-e966bad416ac; PT 0c5edd70-c0b7-42c2-a4cc-560e1e3e8d5b; supervivencia draft 45aeeaa4-60a9-4a3e-9455-9b5449f1f9a7.
- Header ee9fd834-60ea-4285-90ed-769b7e1616d2.
- Test privado B 1534414d-d533-443c-8d65-442ab70e0a06, deliverylogged.

## Comandos y límites de aprobación

Node22, cwdintegration y RUN_REAL_ESTATE_ENQUIRY_QA=approved. prepare-browser0, seed-layout0; group1-editor1 por P2 después de6 casos; diagnose-save0 tras corregir espera de harness y diagnose-media0 identifican causa; group1-resume0 confirma únicamente3 casos restantes con el mismo Hero/A/textos. group2-capture1 únicamente por ruta del log anterior después de9checks válidos; group2-finalize0 finaliza últimoassert de sololectura sin repetir capturas. group2-locales0, visual-mobile-lower0, group3-lifecycle0, final-data0 yprotected-check0.32 casos totales (9+10+3+10), una corrección funcional acotada, una confirmación focal y ninguna repetición de matriz general. Cinco claves nuevas totales para los cinco ganadores; filefail/retries/replays usan las mismas claves, sin reset de cuotas o cachés.

Informe y scripts/JSON/capturas en /private/tmp/central-hill-real-estate-enquiry. HEADintegration finaldaf041b, sin cambios tracked; solo los2symlinks públicos retenidos no seguidos. QA no editó producto ni env/runtime. No bloqueantes abiertos; integración local, apertura main y conservación authoreddata corresponden a raíz. Resend sigueconsole/unconfigured y no se afirma recepción real de correo o adjuntos.
