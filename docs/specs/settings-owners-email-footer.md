# Owners email y contactos del footer

2026-11-12 (hora local). Solicitud: input Owners email en Settings → Contact y
contactos del footer en columnas For Guests / For Owners según captura del usuario.
Base60c9d69 incluye el botón Back to top ya entregado y conserva los3untrackedprevios.

## Contrato y alcance

Campo global compartido `company_settings.owners_email`, text nullable con default
`partners@centralhill.pt` suministrado en la captura. Migración aditiva0031, sin
reescribir columnas existentes ni emails de huéspedes/notificación. Admin input
opcionalnullable/email.trim/max254; omisión antigua conserva guardado, null explícito
oculta solo filaemailOwners. Ausencia singleton usa DEFAULT_GLOBALS; persistido null/
blank nunca revive default. Public SiteGlobals.ownersEmail opcional string|null,
GlobalsEditData.owners_email opcionalstring, cache shapev9. Save Settings existente
invalida globals/layout4locales sin PagePublish. No traduce direcciónemail ni envía mail.

Footer conserva marca/dirección/social/nav/newsletter/copyright. Contactos: Guests
con Bookings, Check-in, emailgeneral yWhatsApp; Owners con teléfono yemailpropietarios.
Tel labels antes de números como referencia. Dos columnas enancho suficiente, apiladas
en móvil; email largo puede envolver sin overflow. Owners ausente siambos datosvacíos.
Iconos existentes phone/mail/whatsapp y headings EN/ES/PT/FR. Kernel Footer solo
props/presentación, sin Settingsqueries ni destinatario de emails. ADR0085 autoriza
root para cambio presentacional del kernel.

## Seguridad y entrega

Checkpoint nuevo verificado antes de código: tag
restore/owners-email-2026-11-12-1794531961066 sobre60c9d69. Privado
/private/tmp/central-hill-owners-email/checkpoint:49tablas1522filas auth+ledger31,
2restores exactos ownersemailrestore20261112 yownersemailqa20261112,
1377objetosGit/183mediaSHA exactos; env/logo/symlinks preservados. RESTORE.md pareado
conserva estado posterior primero y restaura código+DB en checkout/base nuevos.

Implementación yDDL de prueba solo en nuevosdatasets aislados. No main fixtures ni
Save en authoredmain. La aplicación de0031 al DBmain se prepara y revisa despuésQA;
Working agreement exige autorización para cambiosDB. No remoteDB/R2writes, push/
deploy, mailprovidersetup, limpieza de bases/roles/media/envs/cachés/worktrees.

## Ownership

Root: plan/ADR/schema/contratos/defaults/validadores/tipo EditData inicial, migración+
journal/snapshot, core/ui/footer.tsx y sus pruebas SSR, messages4, integración/build,
provisión/checkpoint/autorizaciónDDLmain y conservación/apertura final readonly.

A backend aislado: settings/admin/actions.ts y admin/queries.ts (incluye mapping del
tipo ya preparado), server/queries.ts y nuevas pruebas owners-email pure/DB. No UI/
schema/core/messages. Own DB schema-only ownersemailunitqa20261112, guard exacto.

B UI aislado: settings/admin/ui/globals-form.tsx, settings/ui/site-footer.tsx y pruebas
UI pertinentes. Input owners-email typeemail/autocompleteemail/max254 en Contact junto
aOwnersphone; payloadorNull/error/busy. Composer pasa OwnersEmail/headings/WhatsAppicon
según contrato; no core/persistencia/messages.

QA independiente: candidato integrado sin editar producto, browser en3087 y clon QA
propio. Inputdefault/Save/reload/custom/invalid/clear/omitted compatibilidad; footer4
locales/links/categorías/emptyOwners/mailto/mobilelongemail; SQLconservación de datos
originales except Settings autorizado y sus traducciones. Formas/capturas/contactos
previos independientes. Unavisualbatchdesktop/mobile, corrección focal solo si defecto.
Typecheck/lint/dbcheck32/build y pruebas DB/SSR pertinentes antes entrega. Main3071 y
media9081 retenidos con env/preload original; no activar código main antes de0031.

## Implementación y checks

Contratos7802210; UIe442deb integrado39b94c9, backendc3b80da integrado458dec7,
Footerkernel854fe7b. Backend4pure+6DB inicialmente pasan; UItypecheck/scopedlint0.
Root46pure/render integrados (35iniciales+11focales de dos archivos legacy que
necesitan loader PNG/AsyncLocalStorage/env fuera deNext) y6DBintegrados0skip pasan.
Primer typecheck detectó3narrowings en testSSR y faltaba next-env.d.ts ignorado;
se corrigieron solo tests/copia del archivo generado. Typecheck final0, lint0 con
7warnings antiguos, detectorUI[], dbcheck32(old0008warn). Sin cambio producto por
esos ajustes del harness. No repetición de35casos aprobados.

Build completo0/215static/2workers:compile10.1s/TS13.7s/static5.2s usando caché clonada
del checkpoint anterior y preload de build a4queries/worker. Configproducto intacto,
main/media/env/caché originales retenidos. Candidato listo para QA independiente.

0031 aplicada y verificada SOLO en ownersemailqa20261112 (ledger31→32) y propia
schema-only ownersemailunitqa20261112 (ledger0→1). SHA256
deca1f97d4f4dc5c2b2f3e5020386fc2a6d89a58285eaa2f148490da351f1b5e.
Todoslosoldtables/columnasSettings exactos al añadir atributo; nuevo valorpartners en
singletonQA existente. Authoredmain y restoreDB se conservan con ledger31/sincolumna.
