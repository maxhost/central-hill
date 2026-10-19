# Editor común Pages — entrega local

Implementación autorizada desde8223f4a en rama page-editors/integration, checkout
/private/tmp/central-hill-page-editors-integration. Handoff de planificación y checkout
/private/tmp/central-hill-page-drafts-integration conservados; Home/live3067 no sustituido.

Un motor por key/idioma y un PageContextualEditor consumen descriptores serializables.
Home conserva wrapper compatible. Owners prueba planes/features anidados; Buildings
inyecta sólo contenido editorial en BuildingsListingRenderer por contract y conserva
catálogo publicado independiente. Real Estate conserva adjunto PDF en su CTA y Guest
conserva sus teasers/destinos. Formularios actuales sin selector Forms/captura/envíos nuevos.

IDs legacy_N resuelven índice original de traducción/fallback; UUID nuevos usan @UUID.
Metadata hija se ancla en identidad del padre, no posición. JSON Home no se reescribe por
la extracción. Draft/publicación/CAS y revisión persistente por página/idioma; preview
local efímera usa el mismo renderer público sin guardar/flush/invalidation.

Entorno nuevo: http://127.0.0.1:3068/admin/pages/home y paths owners/buildings/real_estate/guest.
SQL DB/rol pageeditorsqa, Postgres5628/proxy4528/storage9068, correo consola. Fixtures staff,
catálogo publicado pequeño y medios sintéticos; artefactos env/SQL/logs/screenshots en
/private/tmp/central-hill-page-editors-qa. Se aplicaron sólo migraciones existentes0000..0023;
no migración de producto nueva ni producción. Dependencias clonadas del lock existente.

Ejecución sigue [plan](page-editor-platform-plan.md), aceptación en
[spec](page-editor-platform-spec.md). Verificación integrada e informe QA se registran al
cerrar el candidato. Entrega sólo en rama local: sin main/push/despliegue/GitHub.
