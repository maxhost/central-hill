# Próximo trabajo tras clear — Forms en Consulta del servicio

2026-11-12. **Relevo guardado; implementación NO iniciada.** El usuario hará clear y
retomará después este trabajo. No iniciar código, migraciones, fixtures ni QA hasta
que vuelva y pida continuar.

## Solicitud exacta

Añadir un apartado en el formulario de **creación y edición de cada servicio** para
seleccionar uno de los formularios creados en `/admin/forms`. Ese formulario se
mostrará en la sección pública **«Consulta del servicio»** del servicio correspondiente.

Ejemplo de ficha indicado por el usuario:
http://localhost:3071/admin/services/4e1e32d3-927d-47de-8b57-dee7a1079e2b

El alcance es el catálogo individual `/admin/services`, no Pages → Services
(`/admin/pages/services`) ni un único selector global para todos los servicios.
La selección debe pertenecer a cada servicio y funcionar también al crearlo.

## Patrón previo y puntos a auditar antes de decidir persistencia

Reutilizar la experiencia y el runtime de Forms ya entregados para Header, About,
Guest y Real Estate: catálogo con disponibilidad/motivo y enlaces crear/editar/refresh,
campos/filas/columnas/pasos, traducciones aprobadas→EN, validación, consentimientos,
adjuntos, captura histórica, idempotencia, cuotas compartidas y notificación console.
Sin selección se debe conservar el contacto actual y las demás integraciones.
Conservar las selecciones independientes de las cuatro ubicaciones anteriores.

La expectativa por continuidad es una selección común EN/ES/PT/FR por servicio,
con textos del Form localizados. **Auditar y documentar el ciclo de guardado/publicación
propio de Services antes de fijar cómo se guarda y activa la referencia.** No copiar
mecánicamente las acciones de Pages ni añadirla a datos compartidos vivos que hagan
público un borrador por accidente. Revisar `inherit/custom`, servicios nuevos sin ID,
publicación/archivo, cambios de slug y `booking_type` enquiry/external/none. Mantener
el comportamiento actual de external/none y no cambiar automáticamente el tipo de reserva.

El tipo de lead del contacto actual es contact; definir el enlace verificado a la
identidad estable del servicio, histórico/origen y replays sin confiar en el slug o
un destino libre enviado por el cliente. Extender los guards de uso/archivo de Forms,
concurrencia, cache/revalidation y DTO privado siguiendo los contratos actuales.
No comprometer un esquema o una migración antes de la auditoría.

## Código relevante leído durante el relevo

- `src/slices/services/admin/ui/service-form.tsx`: formulario compartido alta/edición,
  workspace, Save draft/Publish por idioma; tarjetas de detalle/media/booking.
- `src/slices/services/admin/ui/detail-editor.tsx` y `service-copy-editor.tsx`:
  campos y textos de secciones.
- `src/slices/services/editorial-types.ts`: `ServiceEnvelope`, modelos por idioma,
  `SERVICE_SHARED_KEYS` y revisiones compartidas/editoriales.
- `src/slices/services/schema.ts`: `service`, `service_locale_content` y
  `service_shared_content`; son un sistema distinto del JSON fijo de Pages.
- `src/slices/services/admin/locale-actions.ts`, `server/locale-store.ts`,
  `server/locale-validation.ts`, `server/queries.ts`, `server/publish.ts`:
  persistencia, publicación y resolución pública.
- `src/slices/services/ui/service-detail.tsx`: sección `#enquire`, hoy solo cuando
  `booking_type === enquiry`, compone `EnquirySplit` y
  `ContactForm source={\`service:${svc.slug}\`}`. Mantener títulos/intro/contactos propios.
- `src/slices/services/ui/detail-view-model.ts`, `copy.ts`, `README.md`:
  comportamiento de reserva y copy `enquiryTitle/enquiryIntro/enquiryInfoTitle`.
- `src/slices/forms/{contract,server-contract,public-types}.ts`, acciones/queries públicas,
  captura de Leads y contratos server-only de Pages: puntos previos para reutilizar.

Leer AGENTS.md y los planes/ejecuciones/QA de las cuatro asignaciones entregadas;
seguir dos implementadores aislados + QA independiente para esta implementación.
Primero preparar un **nuevo checkpoint de código y DB completa**, verificarlo en
restauración aislada y actualizar spec/plan/contratos/write sets antes de delegar.
Las pruebas deben usar nuevas bases propias, nunca guardar fixtures en authored main.

## Estado a conservar después del clear

Main documental al preparar este relevo: `06d01d6`; producto Real Estate aprobado
`d7bf8dd` (QA `daf041b`). Ver ejecución y QA de Real Estate para la corrección acotada
del Hero heredado y las pruebas. No hay trabajo de Servicios empezado ni asignado.

Main `http://localhost:3071`, PID42708/parent42702/session64963, cwd del workspace;
media9081 PID42630/session56332. Ambos escuchaban durante este relevo, sin reinicios.
Node22, `.env.local` original y REQUIRED NODE_OPTIONS=
`--require=/private/tmp/central-hill-neon-content-local-copy/runtime.cjs`, que solo
acepta DB/rol `neoncontentlocal20261111` por proxy4558. Resend sigue sin configurar,
EMAIL_PROVIDERconsole; no correo real ni recepción de adjuntos afirmados.

Preservar todas las bases/checkpoints/worktrees/envs/cachés/artefactos y los tres
untracked preexistentes: PNGlogo + public/neoncontentlocal + public/propertylocalesqa.
Sin remoteDB/R2 writes, push/deploy, limpieza de roles/bases ni configuración externa.
Este relevo solo lee código/procesos y guarda documentación; no toca contenido o DB.
