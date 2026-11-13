# QA independiente — Owners email y contactos del footer

2026-11-12, hora local. **APROBADO para integración funcional local** del candidato
`aaa19d40ce578d01a040c36f64d78ff05fd5c400`, producto `458dec7` (Footer raíz `854fe7b`),
servido desde `/private/tmp/central-hill-owners-email-integration` en3087.
13casos funcionales, cero defectos de producto, cero pageerrors/adminerrors y cero
fallos de harness. Sin cambios de producto ni nueva compilación durante QA.
Aplicación de0031 y apertura de authoredmain corresponden a raíz, fuera de esta prueba.

## Entorno y protección

Host/DB/rol exactos `ownersemailqa20261112.local` / `ownersemailqa20261112` /
`ownersemailqa20261112`; preload exclusivo a4558, Node22.23.3, EMAIL_PROVIDERconsole,
medios locales9081. Login local normal, sin extraer tokens/cookies/storageState.
Las operaciones UI exigen RUN_OWNERS_EMAIL_QA=approved. QA no editó código, env,
runtime, cachés, schema ni medios, y no accedió al main3071.

El clon se restauró y0031 se aplicó por raíz antes del baseline. Lectura inicial
confirmó43tablas de negocio, ledger32 y una fila Settings con default
`partners@centralhill.pt`. Baseline completo antes de cualquier Save conservado en
`qa/data-before-browser.json`, más fila original Settings y sus traducciones.
El checkpoint de raíz es `restore/owners-email-2026-11-12-1794531961066`, código60c9d69,
49tablas1522filas inclauth/ledger31, dos restores exactos,1377objetosGit/183mediosSHA.

Solo se permitieron cambios en el singleton Settings del clon y sus filas de
traducción manual necesarias para Save normal. No fixtures ni cambios en Pages,
Forms, Leads, traducciones de otros documentos, medios, slugs, cuotas o esquema.
No se enviaron mensajes ni formularios públicos y no se configuraron proveedores.

## Pruebas de navegador

`group1-input.json`,7casos aprobados:

1. Settings→Contact muestra Owners email junto a Owners phone, default de la captura,
   label asociado, typeemail, autocompleteemail y maxlength254.
2. Público EN/ES/PT/FR muestra el email por defecto solo en Owners; Guests conserva
   Bookings, Check-in, email general y WhatsApp. Encabezados localizados correctos.
3. Save real de `owners-qa@example.test` y recarga persisten el valor normalizado;
   emailgeneral/phones/WhatsApp/headerselection permanecen exactos.
4. Los cuatro footers reflejan el mailto nuevo después del Save sin PagePublish;
   navlinks, social, marca y newsletter permanecen presentes e independientes.
5. `not-an-email` llega al guard servidor y produce invalidstate del input; el
   valor local se conserva y la fila Settings completa queda exactamente sin cambios.
6. Vacío+Save persiste null, reload sigue vacío; EN/PT ocultan únicamente el email
   Owners, conservando teléfono Owners y Guests sin revivir el default.
7. Save normal restaura `partners@centralhill.pt`.

`group2-layout.json`,6casos aprobados:

1. Desktop: grupos de contactos alineados lado a lado, dirección y marca encima,
   sin overflow horizontal. Se conserva el footer restante.
2. PTmóvil390px: grupos apilados, textos y enlaces legibles, sin overflow.
3. Email largo válido se guarda y envuelve en móvil sin recorte ni cambio del mailto.
4. Borrar ambos contactos Owners oculta la sección vacía; Guests permanece intacto.
5. Solo email Owners, sin teléfono, mantiene su encabezado y mailto sin fabricar fila.
6. Save final restaura teléfono Owners original y email de referencia, conservando
   datos de huéspedes y selección Header.

Todos los cambios se hicieron desde la UI real y se contrastaron con lectura SQL.
No seed SQL ni mutaciones directas sobre filas; tampoco capturas/email públicos.

## Visual y fuente

Una sola tanda posicionada desktop/móvil, sin correcciones ni segunda ronda:
`visual-settings-desktop.png`, `visual-footer-desktop.png`, `visual-footer-mobile.png`
y `visual-footer-mobile-long-email.png`. El campo nuevo respeta FieldGrid; contactos
For Guests/For Owners coinciden con el agrupamiento de la referencia. Mail largo
se parte entre líneas sin desbordamiento. Marca/dirección/social/nav/newsletter
conservan su identidad. `visual-batch.json` errores0.

Fuente revisada de forma independiente: owners_email columna propia nullable con
supplieddefault, validators trim/email/max254, actualización opcional que preserva
omisión de clientes antiguos; query pública devuelve string|null y nunca sustituye
persistednull por default. Cache shapev9 y revalidación globals/layout4locales.
El compositor transmite Owners email y títulos traducidos; Footer es presentacional,
usa mailto y tel existentes y no lee Settings ni cambia destinos de notificación.
Owners depende de que al menos teléfono o email esté presente. Los anchos y
min-w-0/overflow-wrap permiten envolver direcciones.

Raíz aporta por separado46pruebas pure/render y6DB reales, typecheck0,
lint0(7warnings anteriores), dbcheck32, detector[] y build0/215static/2workers.
Se distinguen de estos13casos browser. Ausencia de singleton, firstSave con default,
omisión antigua preservando valor/null y demás costuras DB consumen esa evidencia;
no se presentan como prueba browser de un cliente antiguo o una DB vacía.

## Conservación y estado final

`protected-check.json` aprobado por lectura RepeatableRead:

- 41 tablas de negocio ajenas completas exactas, incluidas todas Pages, Forms,
  Leads/Fields, medios, slugs y cuotas.
- Todas las filas translation fuera de company_settings exactas.
- Ledger32 exacto a la línea base posterior a0031, sin DDL durante QA.
- Email/phone/WhatsApp/Check-in/Ownersphone/Headerselection originales exactos;
  site_icons, stats, Avantio y flags retirados también exactos.
- Únicas excepciones: Save normal de company_settings (timestamps/valores activos
  normalizados) y sus traducciones manuales autorizadas. Auth excluida por login.

`final-settings.json`: Owners email `partners@centralhill.pt`, Owners phone
`+351 910 438 062`, guestemail `info@centralhill.pt`, headerselectionnull. El clon
queda revisable con ambos grupos completos. Sin limpieza de datos ajenos ni bases.

Comandos reales: inspect-baseline0; group1-input0(7); group2-layout0(6);
protected-check0. Las conexiones locales usaron escalación de sandbox autorizada,
siempre con guard del destino exacto. No cambio de producto, reinicio, caché manual,
repetición de matriz o corrección de harness.

HEAD integration permaneció `aaa19d40ce578d01a040c36f64d78ff05fd5c400`, trackedclean,
solo dos symlinks públicos de entorno sin seguimiento. Informe y todos los scripts,
JSON y screenshots en `/private/tmp/central-hill-owners-email/qa` y este informe en
`/private/tmp/central-hill-owners-email/qa-independent.md`.

No bloqueantes abiertos en el candidato. Resend continúa console/unconfigured;
no se afirma entrega o recepción real de correo/adjuntos. Main y su migración están
fuera del alcance de este QA y requieren la decisión/autorización correspondiente.
