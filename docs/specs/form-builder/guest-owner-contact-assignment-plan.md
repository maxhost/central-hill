# Guest → Closing dual CTA → Owner contact form

2026-11-12. Implementación local autorizada por «el mismo trabajo» que About.

## Resultado

En /admin/pages/guest, elemento Closing dual CTA, insertar Form inmediatamente debajo
de Owner contact dialog intro dentro del grupo del diálogo de propietarios. Catálogo
/admin/forms con nombres/disponibilidad/motivo, crear/editar en otra pestaña y refresh
sin perder cambios. Selección común EN/ES/PT/FR como About: editableEN, targets muestran
valor común y accesoEN; traducciones aprobadas del Form y fallbackEN. El diálogo público
del botón Owner muestra el Form guardado elegido conservando su título/intro propios,
sin duplicar heading/description de Forms. Guest booking CTA/header/About/otros contactos
conservan sus integraciones y selecciones independientes.

JSON opcional nullable dual_cta.owner.contact.form_id. Ausente/null/referencia inválida
mantiene ContactForm source=guests-dual-cta; invalididad nunca descarta textos Guest ni
corrige datos al leer. No migración SQL/backfill ni cambio de tablas. Un mismo Form puede
usarse en varias ubicaciones; usar siempre la autoridad de cada ubicación.

## Restauración previa

Base613b798 y workingtree solo PNGlogo+2symlinks preexistentes. Checkpoint nuevo
restore/guest-contact-2026-11-12-1794504562503, privado
/private/tmp/central-hill-guest-contact/checkpoint. Dump completo49tablas/1513filas inclauth
+ledger31, dos restores con columnas/constraints/conteos/huellas exactos:
guestcontactrestore20261112 (preservar) y guestcontactqa20261112 (QAaislado).
Código/env/preload/archivos no seguidos/symlinks preservados. Verificar inventarioGit y
183media SHA antes de producto. RESTORE.md exige preservar estado posterior y recuperar
código+DB juntos en nuevo checkout/base, nunca sobreescribir main ni mezclar automáticamente
consultas posteriores. Conservar todos los checkpoints/bases/artifacts anteriores.

## Editorial y preview

Autoridad pública únicamente publishedEN del JSON Guest, independiente de snapshots targets
y draftEN. Save draftEN conserva público; PublishEN activa elección4locales sin cambiar
sus textos. Omitir campo en cliente viejo preserva; null explícito quita. Targets no pueden
reemplazar referencia común en servidor. Validar UUID, definición, status y recipient en
nueva selección; repetir al publicar. Conservar errores/localdraft y revisión/template guards.

Preview autenticada recibe override explícito del ENworking sin guardar también al mirar
targets; render guardado reciente del Form, inerte/sin captura/email. Conservar botón
Show contact form/Hide contact form y puente de diálogo contextual. Público nunca recibe
ese override desde payload ni lee draft. No autosave ni GET writes.

## Envío e integridad

Acción explícita submitGuestOwnerContactForm relee asignación publicada y definición vigente;
cliente no decide recipiente/origen arbitrario. kindcontact/source_page=guests-dual-cta sea
cual sea template. Captura lead+fields atómica con etiquetas/valores/consent históricos,
marketingfalse y consent_atnull sin aviso aceptado; solo ganador notifica.
Idempotencia ligada a ubicación+identidad publicada y payload, claves cruzadas con header o
About rechazadas. Mantener hashes/reintentos anteriores Header/About. Identidad usa ID+
published_at y no revisión draft: draftSave no invalida el Form público abierto.

Reutilizar cuotas durables/globales/honeypot compartidos; alternar ubicación no multiplica
cuota. Filas1/2columnas, pasos,9tipos, Date/File retenidos. PDF/imagen5MiB cada/20MiBagregado,
validación servidor; bytes solo email, no media pública ni persistencia/retry de adjuntos.

Save/Publish Guest se une a HEADER_CONTACT_LOCK existente compartido con Forms/Settings/
About/captura. BatchNeonHTTP READCOMMITTED: lock en statement separado, freshsnapshot en
mutación; guard de asignación/revisión dentro de captura. Mantener EN-first rowlock y
revision/template predicates. Archive bloqueado por Guest ENdraft O published además de
About y Settings; targets no crean usos independientes. Comparaciones UUID case-insensitive.

PublishGuestEN invalida tag común y4rutas /<locale>/guests. FormSave/Approve actualiza DTO
público y rutas usadas sin republicar Guest, manteniendo invalidaciones Header/About.
Contratos server-only separados de barrels cliente, sin ciclos ni imports internos cruzados.

## QA y entrega

Dos implementadores aislados y QA independiente, root orquestador. Fixtures solo en bases
propias strict env/preload; NO Save/Publish/Forms/Leads sintéticos en authoredmain.
RealDB lifecycle/replays/origen/atomicidad/archivo/concurrencia+freshsnapshot; pruebas
puras afectadas, typecheck, lint, build y dbcheck31 sin aplicarSQL. Browser desktop/mobile
agrupado: selector debajoIntro, refresh/unsavedENpreview target, save/reload/publicanterior,
publishEN4locales textos exactos, pasos/date/file/captura anónima, stale/draftidentity,
FormSave/Approve cache, archivo por ambos snapshots, nulllegacy; independencia Header/About
compartiendoForm y claves cruzadas, staffTest separado/DTOsinprivados. Regresión acotada
About/header/contactosGuest restantes, no matriz global repetida.

Resendconsole sin configuración externa/realmail. Localmain tras QA y apertura final
readonly. Sin remoteDB/R2writes, push/deploy, rolecleanup o borrado de bases/cachés/artifacts.
