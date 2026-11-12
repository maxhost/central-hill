# ADR0084 — Forms por Service individual

Fecha: 2026-11-12. Estado: aceptado para implementación local.

Services combina snapshots editoriales por idioma con datos comunes vivos. Una
referencia en `service_shared_content` se publicaría con Save draft. La selección
común de Forms debe respetar la activación explícita por Publish EN.

Guardar `content.enquiry_form_id` opcional/nullable en el snapshot EN existente,
fuera de shared. La lectura pública y los guards usan solo EN published. Targets
conservan sus publicaciones/textos/modos independientes y no son autoridad. Omisión
conserva la elección y null restaura el contacto anterior; sin migración/backfill.

La ubicación `service-enquiry` usa serviceId UUID estable, no slug. Su acción fija
source_page `service:<UUID>` y kind contact; snapshot/hash incluyen servicio e
identidad EN publicada. La identidad incluye published_at y no draft revision.
La captura exige servicio publicado, booking enquiry y publicación del idioma.
Form Save/Approve aplica la última definición guardada sin ServicePublish.

Mutaciones Services se serializan con el lock común Forms antes del graph lock
existente. Archivo de Forms bloqueado por cualquier EN draft OR published Service,
incluyendo servicios temporalmente ocultos. Contracts server-only impiden mezclar
lectores SQL con barrels cliente. Las cuatro ubicaciones anteriores conservan sus
guards y hashes. Ver [plan](../specs/form-builder/service-enquiry-assignment-plan.md).

External/none y contacto legacy permanecen; elegir Form no modifica booking_type.
Resend continúa console/unconfigured. Checkpoint pareado verificado y QA en bases
aisladas son requisitos de integración; no hay escrituras remotas ni despliegue.
