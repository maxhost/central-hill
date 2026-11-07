# ADR0058 — Edificios y apartamentos por idioma

2026-11-06. Implementación local autorizada desde savepoint5a1456d.
Spec/ownership en docs/specs/property-locale-editors-{spec,plan}.md.

Cada slice posee su tabla locale_content por identidad/idioma, draft/published
versionados y revisión monotónica. Se preserva legacy para bootstrap staff y
fallback público sólo en ausencia de fila. Nullable published no reactiva fallback.
Manual Save/Publish por idioma, medios/referencias EN congelados en cada snapshot,
adopción metadata local explícita y revisión de plantilla para drafts existentes.
FAQ estable por UUID, texto target por ID. Sin nuevo kernel ni proveedor.

Apartamentos permanecen dentro de su Building inmutable y sin ruta pública propia.
Parent publication/archival por idioma protege su visibilidad pública. Contadores
visibles se derivan una vez por apartamento del conjunto publicado de ese idioma;
denormalizados legacy se mantienen por identidad con alguna publicación. Orden
Apartment es una acción operacional global explícita sobre apartment.position.

URL efectiva se resuelve únicamente con override y base congelados en el documento;
sin URL propia Apartment conserva #book al band del padre del mismo idioma.
Building booking_enabled/featured conservan sus reglas, todo consumidor recibe
la URL localizada y el botón superior deja de fijar booking general a inglés.

Coordinación Building/Apartment por advisory lock compartido7158/1 en batch HTTP
no interactivo, statement de mutación con snapshot fresco. Fragmentos SQL de
identidad se exportan por contratos de su propietario para guardas parent/delete;
ningún slice consulta directamente la tabla del otro. Parent delete rechaza hijos
de todo estado. Archive no borra documentos. Slugs existentes no se renombrarán.

Backoffice sólo agrega tipos cliente genéricos y wrapper preview sobre su shell
actual. Primer Save navega realmente a Edit con identidad estable; otros idiomas
no están disponibles antes y las mutaciones posteriores preservan su trabajo.
Migración0025 aditiva sólo en DB sintética nueva autorizada. Blog3072/DB anterior
se conservan, sin main merge, push, despliegue o Neon remoto.
