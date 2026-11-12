# Plan — formulario configurable para el contacto del encabezado

Fecha: 2026-11-12. Estado: **lotes0–6 implementados y aprobados para integración local; lote7 Resend pendiente**.

Actualización: se añade un punto de restauración obligatorio antes de implementar
y se separa la integración local del envío real por Resend, todavía sin configurar.

## Resultado acordado

En `/admin/settings`, una sección **Formulario de contacto del encabezado** permite
elegir un formulario creado en `/admin/forms`. La selección se guarda con el Save
existente. El contacto del navbar, tanto en escritorio como en el menú móvil,
abre ese formulario en todas las páginas públicas.

El formulario aporta sus campos, filas, columnas, pasos, textos, idiomas,
destinatario y reply-to. La ubicación identifica el envío como contacto general
(`lead.kind=contact`, origen `header-contact`); la plantilla elegida en Forms es
un punto de partida para construir los campos, no otro destino de procesamiento.

Este cambio tiene una sola ubicación: el contacto del encabezado. About, los
contactos de los heroes/CTA, servicios, newsletter y rentabilidad conservan sus
integraciones propias. No se introduce todavía un sistema general de ubicaciones.

## Hallazgos que condicionan la implementación

- [SiteHeader](../../../src/slices/settings/ui/site-header.tsx) monta dos
  `ContactDialog`: utilidades de escritorio y drawer móvil.
- [ContactDialog](../../../src/slices/settings/ui/components/contact-dialog.tsx)
  incluye directamente el `ContactForm` fijo. También lo usan otros CTA públicos;
  cambiar su contenido globalmente ampliaría el alcance por accidente.
- [Forms](../../../src/slices/forms/README.md) tiene definiciones guardadas,
  traducciones, filas/columnas, Date/File y pruebas **solo para staff**. `listForms`,
  `getFormEditor` y `testForm` requieren autenticación. No hay envío público.
- Su runtime importa controles del Backoffice y muestra textos de prueba. Hay que
  separar la presentación pública antes de usarlo en el navbar.
- Settings guarda un singleton y revalida los layouts públicos. El guardado de
  Forms solo invalida sus pantallas de Admin; falta invalidación pública.
- El contacto actual conserva consultas en Leads antes del email. La nueva
  integración debe mantener esa captura, aunque sus campos tengan IDs dinámicos.
- `core/email` ya tiene un adaptador de Resend. Su configuración está pendiente:
  el localhost actual usa console; esto permite probar la captura y el contenido
  de las notificaciones, pero no demuestra entrega ni recepción de adjuntos.

## Reglas propuestas para esta entrega

| Situación | Comportamiento |
|---|---|
| Sin configuración / Settings ausente | Se mantiene el formulario de contacto actual. No se crea contenido al leer. |
| Selector | Formularios no archivados, con nombre y referencia a su editor. La plantilla no restringe la selección. |
| Formulario incompleto | Se indica el motivo y se rechaza la asignación si falta destinatario válido o la definición es inválida. |
| Sin formularios disponibles | Estado vacío con enlace a Forms para crear uno. |
| Guardar selección | Solo después de Save cambia el sitio. Permite volver explícitamente al formulario actual. |
| Editar un formulario asignado | La última revisión guardada se aplica al público. Los cambios locales sin guardar no se publican. |
| Idioma | Textos aprobados del idioma activo, con el fallback EN existente de Forms. |
| Archivar el formulario asignado | Se rechaza con un mensaje que remite a Settings para cambiar antes la selección. |
| Referencia inválida por datos antiguos/manuales | El sitio usa el contacto actual; Settings muestra la incidencia para corregirla. No se borra la referencia al leer. |
| Cambia selección/revisión mientras alguien lo completa | El servidor rechaza el formulario desactualizado sin capturarlo ni enviar email; la UI ofrece cargar la versión actual. |

El catálogo llama `draft` a los formularios editables y `archived` a los retirados;
todavía no existe un estado `published`. La asignación será la activación pública
de la versión guardada. No se añade un botón Publish en este trabajo. Settings
debe explicar que los futuros Saves de ese formulario actualizan el contacto.

## Lote 0 — punto de restauración de la versión estable

**Obligatorio antes de cambiar código de producto o aplicar cualquier migración.**
Se creará al iniciar la implementación, tomando el estado real de ese momento;
el export anterior de Neon no sustituye al respaldo actualizado de la base local.
Checkpoint ejecutado y verificado: etiqueta `restore/header-contact-2026-11-12-1794491175278`, commit `34ada31`. Respaldo en `/private/tmp/central-hill-header-contact/checkpoint`; 48 tablas incluyendo ledger/auth y 1509 filas totales. Dos restauraciones aisladas coinciden en esquema lógico, constraints, ledger y huellas.

1. **Identificar el punto:** fecha/hora, rama, commit, estado del working tree,
   identidad SQL de DB/rol/host, ledger de migraciones y configuración del runtime.
   La revisión actual encuentra `main` en `34ada31`; se volverá a verificar antes
   de crear una etiqueta local `restore/header-contact-2026-11-12-<hora>`.
2. **Código:** conservar el commit con esa etiqueta y una copia recuperable de los
   cambios sin commit y archivos locales necesarios. Incluir los documentos del
   plan y preservar logo, symlinks y archivos previos del usuario. No usar un reset
   que descarte trabajo ajeno. No hacer push de la etiqueta ni de los respaldos.
3. **Datos:** exportar de forma consistente la DB local activa completa, incluyendo
   esquema, datos, auth local y ledger. Registrar conteos y huellas por tabla.
   Comprobar host/DB/rol exactos y lectura de solo lectura; no exportar ni modificar
   la DB remota. No depender de que las tablas afectadas estén vacías hoy.
4. **Entorno y medios:** respaldar en privado `.env.local`, referencias/preload del
   runtime, comando de arranque, versiones y destinos de almacenamiento/symlinks.
   Inventariar y preservar los medios locales y cachés existentes. Si una operación
   futura fuera a modificar medios, respaldar sus bytes antes de esa operación.
   Pruebas con uploads usarán almacenamiento propio de QA.
5. **Custodia:** archivos de datos/auth/config fuera del repositorio, en directorio
   privado con permisos 700 y archivos sensibles 600. Manifest con rutas y SHA256;
   sin contraseñas, tokens ni claves en Git, logs o documentación compartida.
6. **Verificar que restaura:** restaurar el dump en una DB local nueva y aislada,
   comparar esquema, ledger, conteos y huellas, y comprobar código/config recuperables.
   Preparar un preload que admita únicamente la DB restaurada: el actual rechaza
   cualquier DB distinta de `neoncontentlocal20261111`. No conmutar el localhost
   principal para ensayar la restauración ni sobrescribir la base activa.

**Salida requerida:** punto identificado, copias verificadas y procedimiento
reproducible para recuperar juntos código, esquema y datos. Si falla esta prueba,
se corrige el respaldo antes de iniciar los lotes de implementación.

### Procedimiento si hay que volver atrás

1. Conservar primero el estado nuevo de código y DB, incluidos leads o cambios del
   usuario posteriores al checkpoint. Detener únicamente el runtime propio para
   evitar escrituras durante la conmutación.
2. Recuperar el código estable y su estado local respaldado en un checkout aislado.
   Restaurar los datos del checkpoint en otra DB local, sin borrar la actual.
   Recuperar código y esquema del mismo punto; no mezclar la versión antigua con
   una DB parcialmente migrada.
3. Validar identidad, huellas y medios. Preparar el env/preload específico de esa
   DB y arrancar la versión restaurada en el puerto del localhost. Conservar los
   envs, cachés, medios y artefactos de ambas versiones.
4. Verificar login normal al BO, Settings, Forms, contacto del navbar y apertura
   pública de solo lectura. Registrar qué punto se restauró y qué estado nuevo
   queda preservado para recuperar cambios legítimos; no prometer fusionarlos
   automáticamente. Restaurar código/DB no revoca emails que ya se hayan enviado.

## Lote 1 — contratos, datos y compatibilidad

1. Añadir `company_settings.header_contact_form_id`, UUID nullable, con integridad
   referencial hacia `form_definition`. `null` representa el contacto actual.
2. Incorporarlo al modelo editable, validador, Save, defaults y `SiteGlobals`.
   Un cliente antiguo que omita el campo conserva la selección existente; un
   `null` explícito la desactiva. Validar existencia/disponibilidad al guardar.
3. Forms expone contratos para opciones de Admin, lectura pública y validación
   de la definición guardada. El DTO público solo contiene ID, revisión, idioma y
   definición localizada; no destinatario, historial de pruebas ni textos pendientes.
4. Mantener la captura en `lead`/`lead_field`. Propuesta de almacenamiento aditivo:
   `lead.form_snapshot` JSONB nullable con ID/nombre/revisión del formulario y los
   campos en orden, IDs, etiquetas localizadas, respuestas normalizadas y avisos
   aceptados; `lead.submission_key` UUID nullable único para idempotencia.
   Los leads existentes mantienen su lectura actual.
5. Definir el contrato servidor de Leads para capturar este contacto dinámico de
   forma atómica. Forms valida su definición y valores; Leads conserva la consulta.
   Adaptar la ficha/listado de Leads para mostrar etiquetas y opciones capturadas,
   sin depender del formulario actual ni exponer UUID como nombre de cada campo.
6. Generar una migración append-only con columnas nullable e índices/constraints.
   Documentar la primera conexión pública de Forms en un ADR que amplíe ADR0038.
   Acceso entre slices solo por sus contratos; revisión explícita de dependencias.

**Salida:** tipos, reglas de disponibilidad, captura y migración revisables antes
de conectar la interfaz. No hay backfill, selección automática ni cambio de leads antiguos.

## Lote 2 — sección de Settings

1. Cargar las opciones mediante la consulta autenticada de Forms. Usar un DTO
   resumido para el selector, sin enviar todas las definiciones al formulario de Settings.
2. Añadir una tarjeta con título, selector, ayuda sobre su alcance global y enlace
   «Crear/editar formularios». Reutilizar los componentes y el Save existentes.
3. Incluir estados sin opciones, selección actual, error de validación,
   guardando, guardado y referencia no disponible. Mantener la selección ante error.
4. Añadir las etiquetas de interfaz en EN/ES/PT/FR. La selección es compartida;
   no se elige un formulario distinto por idioma.

## Lote 3 — renderizado público del popup

1. Separar el motor de estado/validación/pasos del aspecto de prueba del runtime.
   Reutilizar layout y validadores; el renderer público usa controles públicos,
   sin dependencias visuales del BO ni acciones autenticadas de prueba.
2. Permitir un contenido de formulario explícito en `ContactDialog` o crear un
   wrapper del encabezado con esa capacidad. Solo los dos montajes de SiteHeader
   reciben el formulario configurado. Los demás consumidores siguen su camino actual.
3. Mostrar título y descripción del formulario una sola vez. Conservar el botón
   de contacto, apertura/cierre, Escape y navegación por teclado. El contenido largo
   debe desplazarse dentro del viewport; móvil apila las dos columnas por fila.
4. Soportar los nueve tipos actuales y múltiples pasos. Conservar Date/File al
   avanzar/retroceder; mensajes de éxito/error proceden de la definición localizada.

## Lote 4 — envío público y registro en Leads

1. Crear una acción anónima específica para esta ubicación. `testForm` continúa
   autenticada y separada: los contactos públicos no se guardan como pruebas.
2. Al enviar, releer en servidor la asignación vigente y la definición/revisión.
   Validar idioma, campos, todos los pasos, opciones, fechas y adjuntos. No aceptar
   del navegador destinatario, etiquetas, definición ni tipo de lead como autoridad.
3. Añadir honeypot, límites de frecuencia para este endpoint y clave de envío
   idempotente. La limitación debe funcionar entre procesos, no depender solo de
   memoria local o del botón deshabilitado. Mantener comprobaciones de origen y
   límites de cuerpo de las server actions.
4. Reutilizar la política existente: PDF/imágenes admitidas, máximo 5 MiB por
   archivo y 20 MiB agregados, comprobación de contenido en servidor. Los bytes
   van al email; se conserva metadata, sin convertirlos en assets públicos.
5. Capturar lead y respuestas/snapshot en una operación atómica; después intentar
   el email mediante el adaptador **Resend** de `core/email`, al destinatario
   guardado y con reply-to validado. Las pruebas locales pueden usar console o
   transporte simulado mientras Resend siga sin configurar.
   La notificación pública lleva asunto propio, no `[Form test]`.
6. La captura determina el éxito para el visitante, igual que en Leads actual;
   un fallo del proveedor no elimina la consulta ni provoca captura duplicada.
   No se promete entrega real en modo console/disabled.
7. Conservar los textos exactos de las casillas de consentimiento realmente
   aceptadas. No inferir consentimiento de marketing por la plantilla ni fabricar
   aceptación/fecha cuando no se recogió. Mostrar ese estado con precisión en BO.
8. Devolver errores estructurados y asociarlos a campos/pasos; conservar respuestas
   válidas tras errores recuperables y evitar doble envío por clics o reintentos.

## Lote 5 — caché y ciclo de vida

- Cachear la lectura pública por formulario/idioma y por asignación. La lectura
  del layout sigue las convenciones ISR; la validación de envío usa datos vigentes.
- Save de Settings invalida globals y layouts de los cuatro idiomas. Incrementar
  el identificador de forma del caché de `SiteGlobals` al incorporar la propiedad.
- Save EN y Save/Approve de traducciones de un formulario asignado invalidan su
  caché público y los layouts que lo incorporan. No requieren publicar cada Page.
- Comprobar en servidor el uso del formulario antes de archivarlo. Coordinar esa
  comprobación con asignación/archivado concurrentes para no crear una referencia
  inválida mediante dos acciones que por separado parecen válidas.

## Lote 6 — verificación funcional local

**Pruebas de dominio/DB:** omisión frente a null, IDs inválidos/archivados,
destinatario, fallback de idiomas, revisiones desactualizadas, archivo asignado,
captura atómica, idempotencia, campos ajenos, fechas, adjuntos y fallos de email.
Simular el transporte de Resend para verificar destinatario, remitente, reply-to,
adjuntos y respuestas de éxito/error/timeout sin enviar correos reales.

**Playwright, en datos propios de QA:** crear A/B en Forms, seleccionar A en
Settings, guardar/recargar, abrir contacto desktop y móvil; comprobar dos columnas,
pasos, fechas y archivos; enviar y revisar un solo lead y notificación local.
Cambiar a B y volver al contacto actual. Verificar EN/ES/PT/FR, actualización tras
editar/aprobar textos, formulario abierto que queda obsoleto y bloqueo de archivado.
Una apertura adicional desde otra página confirma el alcance global. Regresiones
acotadas de los otros contactos y de las pruebas privadas de Forms.

Ejecutar pruebas afectadas, typecheck, lint, `db:check` y build reales. El QA con
escrituras usa una base/dataset propio: la copia local de contenido de Neon ya es
contenido del usuario. Conservar runtime/preload, media, envs, cachés y artefactos.

La migración se valida primero en QA. La entrega local verifica el checkpoint del
lote 0 y la identidad de DB/rol antes de aplicarla al destino autorizado, conserva
los datos existentes y termina con una apertura de solo lectura. No hay migración
remota, push ni despliegue dentro de este plan. Hasta completar el lote 7, el informe
de entrega dirá **captura funcional verificada; envío real por Resend pendiente**.

## Lote 7 — configurar y comprobar Resend

Este es un hito separado, pendiente de disponer de la configuración real. No es
necesario activarlo para construir el selector, el popup o la captura en Leads.

1. Comprobar el remitente/dominio admitido por la cuenta de Resend y preparar la
   configuración del entorno que vaya a enviar. Usar `RESEND_API_KEY`, `EMAIL_FROM`
   y `EMAIL_PROVIDER=resend`, las variables que consume el adaptador existente.
   La API key se configura de forma privada; no se pide pegarla en el chat ni se
   guarda en Settings, en la DB o en Git.
2. Mantener como destinatario el configurado en cada formulario de Forms; el
   remitente es `EMAIL_FROM` y reply-to procede del campo de email elegido en Forms.
   No inventar credenciales, direcciones ni cambiar automáticamente a envío real.
3. Cuando estén configurados y se indique/autorice el destinatario de prueba,
   realizar un envío controlado: un único lead, recepción del mensaje, reply-to y
   apertura de un PDF/imagen de prueba. Registrar el resultado del proveedor sin
   exponer la clave. Un ID aceptado por Resend no demuestra recepción en el buzón.
4. Verificar que un fallo de Resend conserva el lead y se registra como fallo de
   notificación. Guardar el estado anterior del env para poder desactivar el envío
   real sin perder consultas ni cambiar la selección del formulario.

## Criterio de terminado

**Integración local:** checkpoint de código/datos verificado; un Admin puede crear
el formulario en Forms, asignarlo desde Settings y capturar una consulta anónima
del navbar en Leads con sus etiquetas históricas. El mismo formulario funciona en
los cuatro idiomas, escritorio y móvil, y las ediciones guardadas se reflejan sin
republicar las páginas. La notificación se comprueba localmente sin afirmar entrega.

**Correo operativo:** además, Resend queda configurado y se comprueba la recepción
real del envío controlado y sus adjuntos. Mientras ese paso esté pendiente, no se
declara que el email esté operativo ni que toda la entrega esté cerrada.

La ejecución se registra en este documento. El correo real continúa pendiente de Resend.

## Detalle técnico de ejecución

La limitación entre procesos usa `form_public_rate_limit`, una tabla de contadores de ventana corta propia de Forms. ADR0080 documenta el nuevo contrato público y la transacción Neon HTTP con bloqueo y mutación en statements separados READ COMMITTED.

## Entrega local

Producto aprobado por QA independiente en68a6171 e integrado a main. Migración0030
aplicada únicamente en DBs locales propias y en neoncontentlocal20261111 tras QA;
los47 hashes de tablas previas se conservaron excluyendo los nuevos atributos nullable.
Neon remoto no migrado. Ver ejecución y QA adjuntos; Resend real sigue pendiente.
