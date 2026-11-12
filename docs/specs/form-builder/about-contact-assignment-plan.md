# Plan — formulario configurable en About → Contact

Fecha: 2026-11-12. Estado: **aprobado por el usuario; implementación local en curso**.

## Resultado y alcance

En `/admin/pages/about`, al seleccionar **Contact**, añadir un selector
**Formulario** inmediatamente debajo de **Subtitle**. Sus opciones proceden de
`/admin/forms`. El formulario elegido sustituye al contacto fijo situado junto al
panel de oficina en la página pública About.

El usuario confirmó **un mismo formulario para EN/ES/PT/FR**, con las traducciones
aprobadas del propio formulario y el fallback EN existente de Forms. El título y
Subtitle siguen perteneciendo a About; el formulario aporta campos, filas,
columnas, pasos, validaciones, consentimiento, respuestas de éxito/error,
destinatario y reply-to. No se duplican título y descripción de Forms en el bloque.

El alcance comprende esta ubicación de About. El encabezado conserva su selección
independiente de Settings; las tarjetas Contact, la oficina, otros contactos,
servicios, newsletter y rentabilidad conservan sus integraciones.

## Hallazgos del código actual

- [aboutSchema](../../../src/slices/pages/schemas/about.ts) contiene
  `contact.form.headline` y `contact.form.subheadline`; todavía no tiene referencia
  a un formulario. El contenido se almacena en JSON, con snapshots draft/published
  por idioma en `page_locale_content`.
- [PageContextualEditor](../../../src/slices/pages/admin/ui/page-contextual-editor.tsx)
  deriva el inspector del esquema y mantiene cambios locales por idioma.
  [AboutPage](../../../src/slices/pages/ui/about-page.tsx) renderiza el contacto
  fijo `ContactForm source="about-contact"`; la preview actual lo mantiene inerte.
- Los snapshots publicados de cada idioma son independientes. Publicar EN no
  reemplaza los snapshots de ES/PT/FR: añadir una propiedad al esquema por sí sola
  **no garantiza una selección común**. Se necesita una lectura explícita de la
  referencia publicada EN para esta ubicación, conservando el contenido localizado.
- La entrega del encabezado ya proporciona catálogo validado, DTO público,
  runtime, captura en Leads, adjuntos, idempotencia y límites durables. Sin embargo,
  su acción pública valida exclusivamente Settings y su captura fija el origen
  `header-contact`. About requiere su propia autoridad de asignación publicada.

## Comportamiento propuesto

| Situación | Resultado |
|---|---|
| Selector | Nombre de cada formulario guardado y disponible, sin restringir por plantilla inicial. |
| Ubicación en inspector | Debajo de Subtitle dentro de Contact. Mantener los controles y estilo existentes. |
| Idiomas del editor | Selección editable en EN, como referencia compartida; visible en ES/PT/FR con explicación y acceso a EN. |
| Sin selección | Opción explícita «Usar formulario de contacto actual»; conserva el contacto fijo de About. |
| Sin formularios disponibles | Mensaje y enlace para crear en Forms. |
| Formularios no disponibles | Mostrar motivo; conservar visible una referencia actual inválida y permitir sustituirla o quitarla. |
| Crear/editar | Enlaces a Forms en otra pestaña y actualización del catálogo sin perder cambios de About. |
| Cambiar selección | Actualiza la preview privada; no cambia el sitio público. |
| Save draft EN | Guarda la referencia con el borrador de About; el público sigue usando la selección publicada anterior. |
| Publish EN | Activa la selección común para los cuatro idiomas de About. No publica ni modifica sus textos ES/PT/FR. |
| Save/Publish ES/PT/FR | Conserva la referencia común; un payload antiguo o manipulado no puede reemplazarla. |
| Editar el formulario elegido | Su último Save válido y sus traducciones aprobadas se reflejan sin republicar About. Los cambios de Forms sin guardar no se reflejan. |
| Referencia inválida por datos manuales/antiguos | El público conserva el contacto fijo; el editor señala la incidencia. La lectura no corrige datos. |
| Formulario abierto que queda obsoleto | Rechazo estructurado sin capturar ni enviar correo; ofrecer cargar la versión vigente. |

La ayuda del selector debe explicar las dos publicaciones distintas: **la selección
se activa al publicar About EN; los futuros Saves del formulario asignado actualizan
sus campos públicos**. El catálogo llama `draft` a un formulario guardado y editable;
no se añade un Publish en Forms.

## Lote 0 — nuevo punto de restauración

Antes de implementar, identificar el commit estable real, working tree, runtime,
DB/rol/host y ledger. Crear un checkpoint nuevo de código y DB local completa,
incluyendo auth y migraciones, con manifiesto de conteos/huellas y procedimiento
para recuperar ambos juntos. Verificar el dump en una base aislada antes de editar
producto. Respaldos privados fuera de Git, permisos 700/600 para datos y secretos.

El checkpoint anterior de header contact se conserva; no sustituye a este nuevo
punto, porque precede a la integración ya entregada. Preservar los cambios del
usuario, medios, envs, preload, cachés, logos, symlinks y artefactos existentes.
No conmutar el localhost principal para ensayar el restore ni sobrescribir su DB.

Una recuperación conservará primero el estado posterior y sus consultas legítimas,
restaurará en otra DB y checkout, y validará código/datos/configuración antes de
conmutar. No se borrarán las versiones originales ni se prometerá fusionar datos
posteriores automáticamente.

## Lote 1 — referencia compartida y contratos

1. Añadir `contact.form.form_id` opcional y nullable al esquema About, sin marca
   traducible. Ausencia/null significa contacto actual. Mantener compatibles los
   documentos antiguos; no materializar defaults ni escribir al abrir el editor.
2. La autoridad común será exclusivamente ese campo del **snapshot EN publicado**.
   El renderer de cada idioma resolverá esa referencia por separado de sus propios
   textos. No usará la copia del campo en snapshots ES/PT/FR ni el borrador EN
   para el público. Conservar la ausencia de páginas/filas y sus fallbacks actuales.
3. La preview privada utilizará la referencia EN de trabajo del editor, también al
   mirar otro idioma. No dependerá de que ya esté guardada o publicada. Transferir
   solo ese override explícito a la preview autenticada; nunca al lector público.
4. Reutilizar el catálogo/validador de Forms a través de contratos de servidor con
   nombres adecuados a ambas ubicaciones. El catálogo requiere staff y entrega
   solamente ID/nombre/disponibilidad/motivo. El DTO público excluye destinatario,
   configuración privada, historial de pruebas y textos pendientes.
5. Definir contratos de Pages para leer/validar la asignación publicada y detectar
   su uso. Mantener módulos `server-only` separados de barrels consumidos por el
   cliente; revisar ciclos entre Pages, Forms, Settings y Leads.

**Datos:** se prevé usar el JSON existente, `lead.source_page` y los campos de
captura añadidos en 0030. No se prevé nueva tabla, columna, migración SQL o backfill.
La referencia JSON no tiene FK: la integridad dependerá de validación y mutaciones
coordinadas. Si la implementación revela una necesidad de esquema distinta,
actualizar este plan antes de aplicar DDL.

## Lote 2 — selector y persistencia editorial

1. Incorporar el selector debajo de Subtitle en Contact, con etiqueta, ayuda,
   errores asociados, estados vacío/no disponible, enlaces crear/editar y refresh.
   Reutilizar el Save draft y Publish existentes; no añadir guardado automático.
2. Mantener la selección y todos los cambios locales ante refresh del catálogo,
   navegación entre idiomas y fallos de guardado. Actualizar las opciones no debe
   reinicializar los snapshots ni otros campos del editor.
3. Validar UUID, existencia, definición y destinatario al guardar una nueva
   selección; repetir la validación vigente al publicar. Devolver errores del
   campo, sin convertir un fallo de asignación en pérdida del borrador.
4. Para clientes anteriores, omitir el nuevo campo preserva la selección existente;
   null explícito la quita. En ES/PT/FR la referencia común no es editable y el
   servidor impide alterarla aunque el navegador envíe otro valor.
5. Traducir etiquetas y mensajes del selector en EN/ES/PT/FR, conservando el patrón
   de campos estructurales de Pages. Publicar EN invalida el contacto de About en
   los cuatro idiomas; los textos localizados mantienen su ciclo editorial propio.

## Lote 3 — render público y preview

1. Resolver el formulario desde la referencia publicada común y localizarlo por
   idioma de visita. Sustituir únicamente el cuerpo del formulario en ContactSplit;
   conservar título/Subtitle de About, panel de oficina y tarjetas.
2. Reutilizar FormRuntime/PublicContactForm con una ubicación About explícita.
   Mantener filas de una/dos columnas, nueve tipos de campo y múltiples pasos;
   apilar columnas en móvil y conservar Date/File al avanzar o retroceder.
3. En preview, resolver la definición guardada elegida y mostrar los campos de
   forma inerte. No permitir captura ni correo desde el iframe, ni confundirlo con
   la acción privada «Test» de Forms. Mantener la selección contextual Contact y
   el puente de preview sin errores de hidratación.
4. Ausencia/null o referencia inválida mantiene el ContactForm antiguo con su
   origen `about-contact`. No asignar automáticamente el formulario del navbar.

## Lote 4 — envío público, integridad y concurrencia

1. Añadir una acción pública de About que relea su asignación **publicada** y la
   definición vigente. Compartir el servicio de validación/captura/notificación,
   manteniendo entradas explícitas para header y About. El cliente no elige un
   destino arbitrario, destinatario, origen libre ni definición de autoridad.
2. About captura `lead.kind=contact` y `source_page=about-contact`, sea cual sea la
   plantilla con la que se creó el formulario. Conservar etiquetas/respuestas
   históricas, consentimiento explícito y marketing false como en la integración
   existente. Solo el ganador de una captura única intenta la notificación.
3. Vincular idempotencia a la ubicación verificada, además de formulario/revisión/
   valores. Reutilizar una clave entre header y About debe rechazarse y nunca
   reconocerse como replay exitoso del otro origen. Mantener compatibilidad con
   los leads y reintentos válidos del encabezado anterior.
4. Incluir una identidad de asignación publicada para detectar cambios mientras
   se completa el formulario. No usar la revisión editorial general como única
   identidad: Save draft EN no debe invalidar el formulario público vigente.
5. Reutilizar honeypot, límites durables y límites globales de envío existentes;
   no permitir que alternar ubicación o reintentar multiplique los cupos.
   Mantener Date/File, PDF/imágenes de hasta 5 MiB por archivo y 20 MiB agregados,
   validación real en servidor y adjuntos solo en email. No almacenar bytes ni
   crear assets públicos.
6. Extender el bloqueo real compartido ya usado por Forms/Settings/captura a las
   mutaciones relevantes de About. Mantener su clave coordinada y el batch NeonHTTP
   READ COMMITTED con lock en un statement y mutación en otro con snapshot fresco.
   Validar asignación y revisión de formulario dentro de la mutación de captura.
   Conservar además los guards editoriales de revisión/template y el orden de locks.
7. Bloquear archivar un formulario referenciado en el draft EN o published EN de
   About, además del uso en Settings. El mensaje debe identificar dónde cambiarlo.
   Reemplazar el draft no libera la referencia publicada hasta Publish; quitarla
   del público no libera otra referencia que aún permanezca en el draft.
   Save/Publish/asignación, Form Save/Archive y captura concurrentes no deben dejar
   referencias inválidas. Los snapshots ES/PT/FR no crean usos independientes.

## Lote 5 — caché y notificación

1. Reutilizar las etiquetas públicas de Forms y añadir la invalidación de About
   en sus cuatro idiomas cuando cambia la referencia común publicada EN.
2. Save/Approve de un formulario usado por About invalida su modelo y las rutas
   About afectadas. Si también está asignado al header, mantener ambas
   invalidaciones. La preview privada relee sin depender de caché público antiguo.
3. Mantener notificación mediante `core/email`, con destinatario guardado y reply-to
   validado. Resend sigue pendiente de configuración: QA utiliza console/transporte
   simulado, y un fallo del proveedor conserva el lead sin duplicarlo.
4. No activar Resend, configurar servicios externos ni realizar envíos reales
   automáticamente en esta entrega. La comprobación real de recepción/adjuntos
   pertenece al hito pendiente del plan de header contact.

## Lote 6 — QA acotado y entrega

Las escrituras de QA se harán en una base/dataset propio con env/preload estricto.
La copia local de Neon contiene datos del usuario; no guardar About, Forms,
Settings ni leads sintéticos en ella para probar.

- **Dominio/DB:** ausencia/null/omisión, IDs no disponibles, referencia común y
  prohibición de cambios por targets, separación draft/publicado, published EN
  ausente y documentos antiguos. Replays y claves cruzadas entre ubicaciones,
  captura atómica, consentimiento, adjuntos y error de notificación. Concurrencia
  de About Publish/Save, Form Save/Archive y captura con snapshot fresco.
- **Playwright en fixtures propias:** crear A/B, elegir A debajo de Subtitle,
  preview sin escrituras, Save draft/reload y público anterior, Publish EN y mismo
  A en los cuatro idiomas sin alterar sus textos. Cambiar a B, quitar selección,
  guardar traducciones del Form, comprobar formulario obsoleto y archivo bloqueado.
  Cubrir móvil, dos columnas/pasos/Date/File y una captura anónima en Leads.
- **Regresiones focales:** header mantiene su propia selección, ambos sitios pueden
  compartir formulario, origen de cada lead correcto, otros contactos intactos,
  Test staff separado y ningún dato privado en DTO público.
- Ejecutar pruebas afectadas, typecheck, lint y build; comprobar ledger sin aplicar
  migraciones no previstas. Inspección desktop/móvil agrupada y corrección acotada
  de defectos encontrados, sin repetir la matriz general ya aprobada.

Entrega: código integrado localmente tras QA, informe con resultados y apertura
final de solo lectura en localhost. Preservar runtime/preload, DBs, medios y
artefactos. No migración remota, push, despliegue ni limpieza de roles/bases.

## Criterio de terminado

Un Admin puede seleccionar un Form debajo de Subtitle en Contact de About,
previsualizarlo, guardar borrador y publicar la selección común. Las cuatro rutas
About lo muestran localizado, capturan correctamente en Leads y conservan la
selección independiente del encabezado. Quitar la selección recupera el contacto
anterior. Checkpoint verificado y QA aprobado; correo real sigue pendiente de Resend.
