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
