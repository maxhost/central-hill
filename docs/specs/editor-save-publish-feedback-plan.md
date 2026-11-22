# Plan — feedback y validación de Save draft / Publish

2026-11-22. **Solo planificación; implementación no iniciada.** Base observada de
`main`: `931a28bb3b7b6becc874d595af7dbe0a0353591a`. Este documento se prepara en
`plan/editor-save-publish-feedback-2026-11-22`, worktree separado. No modifica
producto ni datos y no autoriza ejecutar la implementación todavía.

## Objetivo

Que el administrador sepa si el borrador se guardó, si se publicó, por qué se
rechazó una acción y dónde corregirla. Incorporar:

1. Toasts de éxito y error con mensajes claros en inglés.
2. Asterisco `*` en los campos realmente obligatorios, incluidas reglas condicionales.
3. Campos inválidos en rojo, explicación junto al campo y navegación al error.
4. Modal de progreso que permanezca abierto y muestre el error si falla una subida.
5. E2E con datos completos, obligatorios incompletos, opcionales vacíos y fallos reales
   controlados de subida, antes de considerar una integración a `main`.

La implementación tendrá dos implementadores, un QA independiente y un orquestador.
Se aislarán código, base de datos y almacenamiento; la rama por sí sola no aísla los datos.

## Evidencia de partida y alcance

Diagnóstico previo: 16 escenarios de navegador, cuatro responsables por editor,
lectura de código y contraste UI/respuesta/draft/publicación. Evidencia privada en
`/private/tmp/central-hill-editor-publish-diagnosis/diagnosis.json` y sus subdirectorios.
El código siguió en `931a28b` y las 49 tablas/1534 filas originales quedaron exactas.

| Editor | Defecto confirmado que debe cerrarse |
| --- | --- |
| Pages visual | Error de otra sección oculto al publicar desde SEO; aviso genérico sin destino. Confirmaciones de éxito recortadas por el inspector. |
| Guides | CTA apagada con etiqueta sin URL sigue bloqueando Publish. Mensajes de publicación hablan de guardar. |
| Services | URL externa inválida retenida al pasar a None bloquea Save con el control desmontado; banner y resumen pueden quedar fuera del viewport. |
| Blog Post | El aviso ante un fallo de red controlado queda fuera de pantalla, sin toast visible. |

Los cuatro flujos válidos Save→Publish funcionaron. Los conflictos y la conservación
de publicaciones anteriores funcionaron. No se confirmó un hang general de las acciones.
No se sustituirá ese diagnóstico por la suposición de que todo error es de red o caché.

Alcance funcional:

- Pages visual: Home, Owners, Real Estate, About, Guests, Blog landing, Guides landing,
  Buildings landing, Services landing, Privacy, Cookies y Complaints; superficies y
  bindings activos, SEO, rich text, listas y campos condicionales.
- Guides: creación y edición; nueve templates y sus módulos/secciones/Places activos.
- Services: creación y edición; categorías/layouts activos y Booking External/Enquiry/None.
- Blog Posts: creación y edición, rich body, cover, OG, referencias y campos condicionales.
- Infraestructura compartida de esos editores: Field, controles, toasts y MediaQueue/modal.

No añadir migraciones, nuevos campos de contenido ni reglas de negocio ajenas al
problema; no modificar MIME/límites de archivos, permisos, auth/orígenes, publicación
por idioma ni contenido existente. No extender la mejora funcional a otros editores.
Los consumidores de componentes compartidos tendrán una regresión acotada de compatibilidad.

## Contrato de guardado y publicación

Se mantiene el flujo de dos pasos y su protección frente a revisiones obsoletas:

- Save draft puede guardar contenido incompleto cuando el contrato actual lo permite.
- En Guides/Services, Save también actualiza determinados campos compartidos que
  consumen publicaciones existentes. Inventariar ese efecto y conservarlo; no afirmar
  que todo cambio queda privado hasta Publish ni cambiar a snapshot esos campos en
  este trabajo. Conservar/clarificar la advertencia antes de guardar campos compartidos.
- Publish exige los requisitos de publicación del idioma seleccionado.
- Los requisitos de la primera creación, identidad/slug o referencias se siguen
  exigiendo también al guardar donde ya corresponda.
- Cambios posteriores a Save vuelven a requerir Save antes de Publish. Mostrar la
  razón cerca del botón: `Save your changes before publishing.`
- No hacer Publish automático después de Save, de una subida ni de Retry.
- No usar HTML `required` de forma que impida guardar borradores legítimamente incompletos.
- Un HTTP200 de Server Action no acredita éxito: comprobar el resultado semántico y
  el estado persistido. Un `ok: true` con advertencia de refresco no es una publicación fallida.
- EN no publica automáticamente los documentos de ES/PT/FR. Conservar working,
  draft, publicación, referencias compartidas y reglas legales independientes.

## Inventario de requisitos antes de implementar

Los implementadores prepararán un registro cruzado con los validadores reales, no
deducido únicamente de `optional()` o de los labels actuales. Por campo/binding:

| Dato obligatorio del registro | Contenido |
| --- | --- |
| Identidad | Editor/ruta/superficie, campo y ruta estable de error; índice o ID estable en listas. |
| Requisito | Obligatorio para Save inicial, para Publish, condicional u opcional. |
| Condición | Idioma editable, template, módulo activo, tipo de Booking o dependencia de otro campo. |
| Destino UI | Label en inglés, sección/pestaña/acordeón y control real al que llevar el foco. |
| Validación | Fuente de servidor y correspondencia con el requisito visible. |
| Efecto de Save | Texto/valor en draft por locale frente a dato compartido que puede actualizar vistas publicadas; mensaje y prueba correspondientes. |
| E2E | Caso que deja vacío el requisito, caso que lo corrige y cobertura del opcional. |

Cada requisito activo debe tener `*`; un campo opcional no debe recibirlo por
compartir componente con otro obligatorio. Mostrar una leyenda en inglés:
`* Required to publish. You can save an incomplete draft.` Los requisitos específicos
de creación/guardado deben identificarse con su propio hint.

Un checkbox opcional sin marcar es válido. `false`, `0`, `null`, arrays vacíos y
rich text vacío se evalúan según su contrato real, sin una comprobación genérica de
falsedad. Un opcional vacío es válido; un opcional rellenado con un valor inválido
puede requerir corrección si está activo.

Las restricciones de grupo —por ejemplo, al menos una sección visible o una opción
entre varias— se marcan en el grupo con `*` y una instrucción explícita. No convertir
cada checkbox individual en obligatorio ni inventar un input para una restricción
de grupo. El registro distingue campo, grupo y error global; cada uno tiene destino
real, incluido Add section cuando corresponda. El caso “opcionales vacíos” conserva
esos grupos obligatorios satisfechos.

Los campos heredados/read-only no deben exigir una edición imposible: indicar
`Managed in English` y ofrecer una ruta explícita al source cuando proceda,
respetando los cambios sin guardar. No cambiar automáticamente de idioma.

## Contrato de feedback en inglés

Reutilizar ToastProvider. Un toast agregado por intento de acción, no uno por campo.
El toast complementa un resumen persistente: un error no puede desaparecer al expirar
la notificación ni quedar recortado por el scroll del inspector.

| Resultado | Ejemplo de mensaje |
| --- | --- |
| Draft confirmado, mensaje base seguro | `Draft saved (EN).` |
| Draft completamente privado, cuando el contrato lo acredita | `Draft saved (EN). These changes are not published yet.` |
| Save que actualizó campos compartidos | `Draft saved (EN). Shared fields were also updated for all languages.` |
| Publish confirmado | `Changes published (EN).` |
| Faltan requisitos | `Cannot publish: complete 3 required fields. First: Hero → Primary button URL.` |
| Valor inválido | `Cannot save: enter a valid website URL in Booking → External URL.` |
| Validación mixta | `Cannot publish: fix 2 fields. First: Section 2 → Button URL.` |
| Conflicto | `This content changed since you opened it. Reload the latest version before trying again.` |
| Resultado incierto por transporte | `We could not confirm whether your draft was saved. Your edits are still here. Reload to check before trying again.` |
| Commit con refreshWarning | `Published (EN), but the public view could not be refreshed. Please check the page.` |
| Upload fallido | `Could not upload “cover.png”. Your draft has not been saved. Retry the upload.` |

La redacción final se centraliza en un catálogo de feedback en inglés, separado del
contenido editorial. Debe seguir en inglés aunque el idioma de contenido sea otro,
sin reemplazar traducciones existentes ni el idioma de los documentos.

- Distinguir `save`, `publish` y `upload` en texto y estado; no llamar “save” al fallo de Publish.
- Elegir el aviso de cambios compartidos por diferencias semánticas reales, no por
  un incremento de revisión sin cambios de valores. Probar Save de solo texto y
  Save que modifica un valor compartido en Guides/Services.
- Contar “required fields” solo si esos errores están identificados como requisitos;
  para otros errores usar “fields” y describir la causa.
- Traducir paths técnicos a labels y breadcrumbs humanos: nunca UUIDs ni paths de JSON.
- No mostrar stacks, URLs firmadas, tokens ni respuestas crudas del almacenamiento.
- Éxitos breves; errores con tiempo suficiente para leer y cierre manual. Mantener
  resumen persistente y accesible, incluso después de cerrar el toast.
- No emitir éxito antes de completar uploads y confirmar la acción de contenido.
- Un fallo de upload produce un solo toast agregado, propiedad del adaptador de
  cola/modal. El editor no emite otro error genérico al recibir `flush=false`.
  Cada Retry es un intento de subida separado y nunca confirma Save/Publish.
- Ante un error de transporte no afirmar que no hubo escritura si el cliente no puede
  saberlo; no reintentar Save/Publish automáticamente ni descartar los cambios locales.
- Mantener locks, protección de navegación, conflicto, revisión y comportamiento de auth.

## Campos rojos, resumen y foco

Usar los errores reales de la acción y sus rutas estables para:

1. Mostrar borde/estado rojo y mensaje en inglés junto a **cada** campo inválido,
   con `aria-invalid` y asociación de descripción/error al control.
2. Dar el mismo tratamiento a inputs, textarea, selects, rich text, MediaField,
   galerías y grupos repetibles; no limitarlo al wrapper o al texto del label.
3. Mostrar un resumen persistente cerca de las acciones, fuera de regiones que
   puedan recortarlo. Cada entrada debe llevar al error correspondiente.
4. En Pages seleccionar la sección/superficie correcta; en otros editores abrir
   acordeones/paneles y hacer scroll/foco al control real. El foco no puede terminar
   en el DIV raíz sin mostrar el error, como ocurría en Services.
5. Al corregir y validar un valor, quitar el error de ese campo sin borrar errores
   de otros campos ni declarar éxito de toda la operación antes del servidor.

El catálogo inglés, las leyendas y el nuevo comportamiento de feedback/modal se
activan explícitamente para estos cuatro flujos. Los demás consumidores conservan
idioma, mensajes, requisitos y semántica de cola actuales. Las APIs compartidas
mantienen defaults compatibles; no cambiar globalmente el idioma del backoffice.

Si hay varios errores, todos se marcan y aparecen en el resumen; el primero recibe
el foco. Los errores globales/conflictos no se atribuyen arbitrariamente a un campo.
Un error conocido sin mapping de campo/sección es un defecto pendiente, no un caso aprobado.

## Reglas condicionales que deben corregirse

- **Guides CTA OFF:** la pareja label/URL no es un requisito activo de publicación.
  No obligar a completarla mientras el módulo esté apagado. Conservar los valores
  dormidos para reactivación; al activar, recalcular requisitos y validar la pareja.
- **Services Booking None/Enquiry:** no bloquear por la validez de la URL de un
  External inactivo. Al volver a External, validar su URL activa y señalarla en rojo.
- Mantener límites de tipo/tamaño, integridad de referencias y seguridad. Si un dato
  estructural debe rechazarse incluso estando oculto, debe existir una corrección
  visible y accesible; no eliminarlo o repararlo por GET ni silenciosamente.
- Opcionales vacíos/grupos apagados no provocan errores de “required”. Un grupo
  opcional activado o parcialmente rellenado puede imponer sus requisitos condicionales,
  siempre indicados con `*` y asociados a campos visibles.

Guides conserva sus estados efectivos; un checkbox visualmente marcado no permite
deducir que el módulo fue activado explícitamente:

| Estado CTA de Guide | Requisito de Publish y `*` |
| --- | --- |
| Sección desactivada | CTA inactiva; no exigir contenido ni pareja. Mantener límites estructurales seguros. |
| `modules.cta=false` | CTA OFF; campos dormidos sin requisito de contenido/pareja. |
| `presentation=null` o `modules.cta` ausente | Automático/legacy. Ambos vacíos son válidos; si se aporta un miembro de la pareja, indicar el miembro faltante. No convertir automático en ON al abrir/guardar. |
| `modules.cta=true` y sección activa | ON explícito: label y URL son requisitos de Publish. Save mantiene el permiso actual de draft incompleto. |

La corrección de inactivos atraviesa todas las capas que hoy validan el dato:
schema de draft/envelope, validación de publicación/árbol y lector público efectivo,
incluida la composición de valores compartidos. No basta cambiar un único chequeo
de Publish mientras Save o el parser público continúan rechazándolo. Mantener la
validación estricta de formato en enlaces activos y de tipo/tamaño en valores dormidos;
no relajar globalmente los validadores de enlaces.

Las parejas devuelven errores al miembro realmente inválido: si falta solo label,
marcar label; si falta solo URL, marcar URL. Probar ambas direcciones, ambos vacíos y
URL malformada. Aplicar el mismo criterio a las parejas CTA de Blog/otros controles
del alcance, sin marcar artificialmente la URL cuando el problema es la etiqueta.

## Errores de subida y modal de progreso

Reutilizar la cola actual y el pipeline real de reserva/presign → PUT → finalize.
Actualmente `flush()` ya conserva el modal cuando falla una subida; esa propiedad
debe preservarse y comprobarse, no reemplazarse con un modal nuevo.

- Mientras hay progreso real, mostrar nombre del archivo, estado y progreso real.
  El 100% de transferencia no equivale a finalize exitoso ni a draft guardado.
- Si falla una operación dentro del modal, el modal **permanece abierto** con estado
  rojo, nombre del archivo y causa comprensible en inglés. No cerrarlo automáticamente
  por un catch/finally ni por devolver false a Save.
- Mostrar también el toast de error, sin sustituir el detalle persistente dentro del modal.
- Si falla la reserva/selección antes de comenzar una subida y no hay modal abierto,
  mostrar toast y error del MediaField; no inventar progreso o una subida exitosa.
- El Save que encuentra una subida fallida no guarda el contenido ni habilita una
  publicación del archivo sin finalizar. La publicación anterior queda intacta.
- Si los archivos terminaron correctamente y luego falla la validación del contenido,
  el error pertenece al formulario: resumen/toast y campos rojos. No presentarlo
  como upload fallido ni reabrir falsamente el modal de subida.
- Retry reintenta solo los archivos fallidos/pendientes; no vuelve a transferir los
  ya completados ni crea duplicados. Si vuelve a fallar, conserva el modal y el error.
- Si Retry termina correctamente después de un Save abortado, mostrar:
  `Files uploaded. Close this window, then save your draft.` Mantener el modal hasta
  Close; el usuario vuelve a Save draft y después a Publish. No publicar ni guardar
  automáticamente desde el botón Retry.
- Close explícito solo cuando las operaciones estén asentadas. Si se cierra con
  errores, conservar selección/cola y aviso de que el draft no se guardó; otro Save
  permite volver a intentar. No cerrar por backdrop ni permitir interacción detrás
  del modal durante todo el ciclo abierto, también después de fallo o Retry exitoso.
  Mantener fondo inerte, foco contenido y Save/Publish del fondo inaccesibles hasta
  Close aunque el editor haya liberado busy. Escape no cierra mientras haya trabajo;
  tras asentarse equivale a Close intencional. Restaurar foco al cerrarlo.
- En un lote mixto conservar los éxitos y sus IDs. No perder la selección del usuario,
  los labels/alt ni la asociación de errores con rich-body/cover/OG.
- No añadir un timeout global que declare fallida una escritura ya confirmada. La
  investigación no reprodujo un hang general; cualquier ampliación de transporte
  necesita evidencia y revisión de alcance antes de integrarla.

## Aislamiento y punto de restauración de ejecución

Antes de tocar producto:

1. Resolver el HEAD real de `main`, cambios locales, archivos no rastreados, procesos,
   env y configuración. Si avanzó desde `931a28b`, actualizar la base del plan.
2. Crear una referencia nueva `restore/editor-feedback-<fecha>-<sufijo>` sin
   sobrescribir referencias anteriores. Preparar respaldo emparejado de código,
   DB completa incluidas auth/ledger, configuración privada, logos/symlinks y medios
   realmente existentes. No afirmar que se respaldaron assets ausentes.
3. Verificar recuperación de código y dos restores aislados: esquema efectivo,
   restricciones, conteos y hashes. Mantener uno intacto y otro exclusivo para QA.
4. Escribir RESTORE.md privado: conservar primero estado posterior y restaurar en
   un checkout/DB nuevos. No sobrescribir datos posteriores ni restaurar sobre main.
5. Crear `fix/editor-save-publish-feedback` en worktree separado; ramas/worktrees
   propios para A/B. No ejecutar implementación hasta verificar el checkpoint.
6. Crear env, DB/rol, cuenta de prueba y almacenamiento locales exclusivos, con guards
   por DB/rol/host. No reutilizar para escrituras las bases viejas de Welcome,
   restauración ni `editordiag20261122`; conservarlas y conservar todos sus artefactos.

No writes, Save/Publish, fixtures, migraciones ni cambios de auth/env/cache/procesos
en autoría o producción durante implementación y QA. Ningún push ni deploy.

## Equipo y propiedad de archivos

| Responsable | Propiedad y entregable |
| --- | --- |
| Orquestador | Checkpoint/aislamiento, inventario y contrato de interfaz inicial, ramas/worktrees, integración, checks, conservación y revisión visual. Documentación/ADR si cambia contrato compartido. No repartir el mismo archivo entre escritores. |
| Implementador A | Backoffice compartido: form/Field/controles, MediaField/MediaGalleryField, toast, media-queue/modal, nuevo catálogo/adaptador de feedback y contrato/export client-safe. Único propietario de `blog/admin/ui/post-rich-text-editor.tsx`, por ser RTE compartido con Pages legales: solo presentación/errores/registro/foco. Integración Pages visual, schema-fields/rich fields y mappings; acciones/tipos/resultados Pages para distinguir rechazo, commit confirmado y refreshWarning sin alterar su semántica editorial. Pruebas focales de backoffice/Pages/RTE compartido. |
| Implementador B | Integración en GuideEditor/GuideSectionEditor, ServiceForm y PostLocaleEditor; mappings/requisitos, schemas draft/publicación y validadores condicionales. Lectores públicos de esos dominios solo cuando la corrección de inactivos los requiera, sin rediseñar renderizadores. Acciones/tipos/resultados para distinguir rechazo, commit confirmado, refreshWarning e incertidumbre. Pruebas focales de esos dominios. No editar RTE compartido, shared UI ni archivos de A. |
| QA independiente | Scripts E2E, fixtures exclusivamente propios, evidencia, reporte y aprobación del candidato exacto. No corregir producto: devuelve defectos al propietario por medio del orquestador. |

Antes de escribir en paralelo, acordar tipos/imports del adaptador, rutas de error,
labels humanos, registro de controles, reglas de required y ciclo de subida/Retry.
A publica el contrato compartido primero; B integra contra ese contrato. Cualquier
archivo adicional cambia de propietario explícitamente antes de tocarlo. A es el
único escritor del catálogo de feedback compartido; B entrega sus necesidades de copy.
No crear un segundo sistema de toasts ni contaminar barrels cliente con módulos server.
La clasificación de resultados se decide en el punto que conoce el estado real del
commit; el cliente no inventa un refreshWarning ni deduce éxito de una excepción.

## Matriz E2E obligatoria

QA debe registrar por caso: editor/ruta/idioma/variante, estado inicial, acciones UI,
respuesta semántica cuando esté disponible, estado real draft/publicado/revisión,
toast/resumen/campos/estado del modal, captura y resultado. Datos auxiliares y
credenciales permanecen fuera de Git.

La QA de aceptación usa un build de producción local del candidato inmutable, con
manifest de fuente/configuración y entorno QA propios. No ejecutar la matriz final
contra un dev server que esté recibiendo HMR de los implementadores ni reutilizar
sin comprobar un build/cache de otro estado de fixtures. Si cambia producto para
cerrar un defecto, generar el candidato corregido y repetir los casos afectados y
sus dependencias; conservar los intentos anteriores, sin reiniciar toda la matriz
por rutina ni contar como pass un render de caché ajena.

### Formularios: repetir los grupos aplicables en los cuatro editores

| ID | Caso | Resultado exigido |
| --- | --- | --- |
| F01 | Formulario completo → Save draft → Publish | Toasts ingleses correctos, draft guardado, luego publicación real y draft consumido según contrato. Recarga y público muestran el cambio. |
| F02 | Dejar incompletos los requisitos de Publish | Save permitido donde lo admite el draft; Publish rechazado con toast claro y todos los campos faltantes rojos. El rechazo no agrega cambios a la publicación: comparar con el estado inmediatamente anterior al intento, y registrar aparte los efectos compartidos legítimos del Save previo. |
| F03 | Vaciar cada obligatorio por separado | `*`, error y foco corresponden al campo real. Inventario acredita cada requisito, sin inferir cobertura por componente compartido. |
| F04 | Corregir uno de varios errores; después todos y publicar | Solo desaparece el error corregido; los restantes siguen rojos y en el resumen. Al completar todos se publica efectivamente sin errores viejos ni toast falso. |
| F05 | Obligatorios completos, todos los opcionales vacíos/sin marcar | Save/Publish exitosos sin toast de error ni rojos falsos. Opcionales no reciben `*`; false/null/vacíos conservan semántica. |
| F06 | Opcional activo con valor inválido; grupo condicional ON/OFF | Reglas y `*` cambian según uso; la regla activa rechaza y guía al campo; el grupo apagado no obliga a completarlo. Completar Save→Publish y comprobar también el render público con los valores dormidos. |
| F07 | Error en sección/panel distinto, lista o rich text | Resumen visible, entrada humana, abrir panel/seleccionar binding y foco al control; rojo y mensaje correctos incluso con scroll largo. |
| F08 | Editar después de Save; pulsaciones rápidas | Publish deshabilitado con explicación; sin solicitudes duplicadas ni pérdida de cambios; Save vuelve a habilitarlo cuando corresponde. |
| F09 | Dos pestañas con revisión obsoleta | Toast y mensaje persistente en inglés, acción de recarga explícita; no sobrescribir el ganador ni recargar perdiendo trabajo sin confirmación. |
| F10a | Rechazo de red/server action previo al commit | Sin toast de éxito, salida correcta de busy ante error asentado, working conservado y explicación visible incluso al final del formulario. Verificar que no hubo escritura. |
| F10b | Pérdida de respuesta después de un commit real | Provocar el fallo de entrega en QA después de la mutación real, sin fabricar un éxito. Mostrar resultado incierto y preservar working; SQL/público acreditan la escritura. No afirmar que falló/no cambió ni reintentar automáticamente. |
| F11 | Repetir desde sección baja y tras expirar/cerrar toast | Resumen de error sigue accesible; confirmación no queda recortada por el inspector. |
| F12 | Creación frente a edición; EN y target propio | Requisitos iniciales/readonly correctos; feedback menciona idioma actual; no altera publicaciones/textos ajenos ni elimina guards de idioma. |

Casos concretos de regresión obligatoria: Home URL requerida vista desde SEO; legal
Body vacío visto desde SEO; Guide CTA OFF con label sin URL y ON con pareja válida;
Service External URL inválida → None y Enquiry → External; Blog excerpt vacío y
error de red desde sección inferior; Blog rich-image reservation completion conservada.
Añadir CTA Guide automática vacía, automática parcial, ON explícita vacía y sección
desactivada, además de las dos direcciones de error de pareja y su público efectivo.

El inventario cubre todas las Pages activas, nueve templates Guide y categorías/
Booking de Services. No exige un producto cartesiano de idiomas×viewports×campos;
sí un caso por regla/variante real y un mapa explícito que no deje requisitos sin prueba.
Contenido target independiente y controles heredados se prueban en cada arquitectura.
Antes de implementar, publicar el número finito de campos/reglas/variantes y de
casos resultantes de F03. Un requisito diferente conserva su caso propio; variantes
que comparten exactamente contrato y renderer pueden compartir evidencia solo con
mapping revisado por QA, más una comprobación de integración en cada ruta/template.
No ampliar ni reducir silenciosamente la matriz durante la ejecución.

### Subidas: pipeline real y fallos acotados

| ID | Caso | Resultado exigido |
| --- | --- | --- |
| U01 | Archivo válido, progreso real, Save y Publish | Modal de progreso real; éxito solo después de finalize y Save. DB/bytes/archivo publicado corresponden a la selección. Cubrir integración en cada editor y rich-image de Blog. |
| U02 | Rechazo de selección/reserva previo a modal | Toast inglés y MediaField inválido; no éxito ni referencias a archivo inexistente; no simular progreso. |
| U03 | Fallo al iniciar transferencia/presign durante flush | Modal permanece abierto con nombre/causa en inglés, fila roja, sin Save ni Publish exitosos. |
| U04 | PUT falla o se aborta realmente | Error dentro del modal y toast; publicación/draft anteriores intactos; selección disponible para retry. |
| U05 | PUT real termina y finalize falla | No confundir 100% con archivo listo; modal/error persistentes y contenido sin guardar referencias no finalizadas. |
| U06 | Lote de dos o más archivos con éxito parcial | Éxitos conservados, fallidos identificados; comparar IDs y número de PUT para acreditar que Retry no repite completados ni genera duplicados. |
| U07 | Retry falla, luego Retry funciona | Primer error conserva modal; éxito muestra instrucciones; durante Retry cero llamadas Save/Publish y revisión/draft/publicación de contenido exactos, separados de los media_asset legítimamente finalizados. Close→Save→Publish explícitos y archivo efectivo correcto. |
| U08 | Cerrar error manualmente y volver a Save | Se conserva cola/selección; modal vuelve a mostrar/reintentar fallidos; sin falso éxito ni pérdida de valores. |
| U09 | Descarga/subida lenta y clics repetidos | Progreso pendiente honesto, modal estable y acciones protegidas; no inventar fallos por demora ni doble Save. |
| U10 | Teclado y móvil | Foco dentro del modal, sin interacción de fondo ni overflow; error/Retry/Close visibles y restauración de foco. |
| U11 | Quitar una selección opcional cuya subida falló | Tras Close y Remove explícitos, Save/Publish funciona con requisitos reales completos; el archivo descartado no sigue bloqueando la cola. Quitar un archivo obligatorio vuelve a señalar su requisito al publicar. |

Usar archivos propios y almacenamiento QA con bytes reales. Inyectar fallos de red
o dependencia de forma explícita en el entorno aislado; no fingir respuestas de
upload/Save/Publish exitosas ni sustituir campos mediante DOM para aprobar casos.
Warnings de cache/refresh se cubren con prueba focal del resultado real y, cuando sea
reproducible, fallo real controlado; no etiquetar como E2E un resultado fabricado.

QA debe verificar publicación real, no solo toast/HTTP200. Rechazos conservan la
publicación inmediatamente anterior al intento, sin confundirla con los efectos
compartidos legítimos de un Save previo. Fallos de Save conservan el draft anterior salvo una escritura
real confirmada y declarada. En incertidumbre de transporte se registra el estado
efectivo y se verifica el mensaje, sin prometer rollback automático.
Las esperas del harnés están acotadas y distinguen UI asentada, respuesta y stream:
un `response.finished()` pendiente no prueba un hang del editor. No recargar para
ocultar pending ni convertir un intento incompleto en pass; registrar UI/SQL antes
de cualquier recuperación explícita.

## Comprobaciones, revisión y puerta de integración

1. Pruebas focales del mapping de errores, requisitos condicionales, copy semántica,
   estilos de invalidación y ciclo de cola/retry; incluir regresiones detectadas.
2. Typecheck, lint, comprobación de migraciones y build aislado del candidato final.
   No modificar configuración de producto para acelerar QA/build.
3. E2E obligatorios y matriz final sin pendientes. Evidencia desktop y móvil; una
   tanda visual conjunta de toast/resumen/rojos/modal, con retest solo de defectos.
4. Regresión acotada de consumidores de Field/controles: formularios fuera del
   alcance conservan labels, idioma, mensajes, requisitos y comportamiento; ningún
   required nuevo implícito. Comprobar también un upload fallido de un consumidor legacy.
5. Conservación de originales: schema/constraints/hashes/filas incluidas auth/ledger,
   env/logos/symlinks, contenido/publicaciones y procesos. Excluir únicamente los
   fixtures de la nueva QA y declararlos por identidad, no mediante exclusiones amplias.
6. Configuración privada de QA fuera del producto; credenciales, dumps, archivos y
   evidencias fuera de Git. Preservar bases, builds, caches y evidencias anteriores.
7. QA independiente revisa SHA exacto; fuente que se integra coincide con la validada.
   Si `main` avanzó, integrar su estado en la rama aislada y validar el resultado.

Ningún caso bloqueado, screenshot sin pintura, fallo de harnés ni resultado HTTP200
sin confirmación cuenta como aprobado. No atribuir Safari físico a Chromium emulado.
No repetir la antigua matriz de ratios/media de Welcome: solo las regresiones que
estos cambios de editor/componentes requieran.

**Main no recibe cambios de implementación durante este trabajo.** Al ejecutar el
plan se entrega primero candidato, SHA, cobertura, QA y conservación. El merge a main
requiere autorización explícita del usuario y todos los gates anteriores; este plan
no autoriza merge automático, push ni deploy. La autorización de merge puede venir
en el encargo de ejecución; no se vuelve a pedir si ya fue otorgada expresamente.

## Entregables de ejecución

- Inventario de requisitos y mapping campo→error→sección→E2E.
- Implementación A/B integrada exclusivamente en rama aislada y commits trazables.
- Reporte QA independiente con matriz, evidencia visual y pruebas de publicación real.
- Ejecución/decisiones, SHA validado, recibos de conservación y RESTORE.md privado.
- Lista explícita de defectos pendientes o limitaciones; si existe un bloqueo de
  aceptación, conservar la rama y no integrar a main.
