# ADR0085 — Owners email y columnas de contacto del footer

2026-11-12. Aceptado para implementación local aislada; migraciónmain pendiente de
autorización conforme al Working agreement.

El usuario pide email independiente de propietarios, editable en Settings, y agrupar
visualmente los contactos para huéspedes/propietarios. Se añade owners_email nullable
con default de la captura partners@centralhill.pt. No se reutiliza emailgeneral ni
se oculta el dato en social/translationJSON. Se mantiene compatibilidad omisión/null.

Root es propietario del cambio de kernel Footer: FooterContact amplía opcionalmente
ownersEmail, guestsTitle, ownersTitle y whatsappIcon. Solo presentation props; no
dependencia del kernel hacia Settings ni cambios de emails/notificaciones. Separa
grupos de contacto con responsive2columnas/1móvil conservando el resto del footer.

El compositorSettings resuelve labelslocalizados y contactosglobales; el Save sigue
su invalidación actual de4layouts. Migración0031 aditiva sin backfill de otroscampos,
sin migración remota. Ver spec settings-owners-email-footer.md ycheckpoint pareado.
