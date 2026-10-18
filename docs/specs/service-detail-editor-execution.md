# Editor condicional de servicios individuales — spec de ejecución

Fecha: 2026-10-18. Estado: spec preparada y revisada para iniciar G0/G1;
implementación iniciada tras savepoint solicitado por el owner.
Base: [auditoría con tres agentes](service-detail-editor-audit-2026-10-18.md).
Procedimiento: [workflow autoritativo](../multi-agent-workflow.md).

## 1. Objetivo y frontera de entrega

Mejorar `/admin/services/new` y `/admin/services/[id]` para editar cada servicio sobre
su layout público actual: contenidos generales, secciones elegibles, textos/labels,
iconos, imágenes, precio y tarifas, solicitud/reserva y SEO. Preservar EN/PT/ES/FR,
ISR, URLs y composición. `/admin/pages/services` sigue siendo el editor del listado.

Owner autorizó continuar tras crear el savepoint local `a1107f8`. La entrega sigue
el acuerdo de Services: commits e integración en
`main` local tras QA independiente; sin push, despliegue ni escrituras de producción.

No incluye constructor libre de páginas, reordenación de bloques públicos, compra de
opciones, cálculo automático de precios, nuevas plantillas por categoría, editor nuevo de
traducciones, nuevo proveedor LLM, vídeo en galerías ni Service/Offer JSON-LD. El enlace
«Ver página publicada» no se presenta como preview de cambios pendientes. Un preview de
borradores completo queda fuera de esta entrega; la expansión contextual sí es parte del editor.

## 2. Baseline y preflight de lanzamiento

- Checkout de preparación: `/Users/maxi/Documents/claude-workspace/central-hill`.
- Rama: `main`; HEAD observado `62b622b534587d30189943696a02d28e1cbbd4d8`.
- Cambios ya presentes antes de esta spec: `AGENTS.md` modificado y
  `docs/specs/service-detail-editor-audit-2026-10-18.md` sin seguimiento. Son documentación
  de la auditoría previa; preservarlos y capturarlos explícitamente al preparar el commit.
- Última migración actual: `0018_settings_checkin_website`. Reservar
  `0019_service_presentation.sql`, `drizzle/meta/0019_snapshot.json` y nueva entrada de
  journal al arrancar; volver a comprobar que ningún otro trabajo ocupó el número.
- Worktrees anteriores de Services y Glados existen. No reutilizar, modificar, borrar,
  integrar ni detener procesos de esos trabajos como parte de esta tarea.
- Shell actual: Node `v24.20.0`; ejecutable verificado de Node requerido:
  `/Users/maxi/.nvm/versions/node/v22.23.3/bin/node` → `v22.23.3`.
  Usar ese directorio primero en PATH durante los checks, y pnpm `10.8.0` según
  `packageManager`. Verificado con
  `PATH=/Users/maxi/.nvm/versions/node/v22.23.3/bin:$PATH COREPACK_ENABLE_NETWORK=0 pnpm --version`
  → `10.8.0`, exit 0. Una consulta anterior al pnpm de Node24 se interrumpió (exit130).
  Revalidar runtime en cada worktree durante G0.

### Gates operativos

| Gate | Condición de salida | Momento |
|---|---|---|
| G0 | Revalidar HEAD/status, Node22/pnpm10.8.0, disponibilidad de paths/ramas/puertos, DB/media aislados y staff de prueba; registrar identidad sin secretos | Antes de ejecutar checks con DB o delegar escritores |
| G1 | Orquestador implementa y prueba schema, migración, tipos, validadores, helpers, queries/actions y mensajes compartidos; los captura en un commit contractual | Antes de crear las ramas de consumidores |
| G2 | A y B entregan commits y checks de archivos asignados; integración revisada | Antes de QA |
| G3 | Checks integrados y QA independiente aprobados, incluyendo guardado/recarga real | Antes de integrar en main local |

G0 y G1 son trabajo de arranque, no resultados cumplidos por tener esta spec.
No inventar hashes futuros. Registrar aquí el commit contractual y el candidato exacto
cuando existan; las ramas A/B deben partir del mismo commit G1.

## 3. Contrato de datos definitivo

### 3.1. Presentación neutral

Nuevo archivo puro `src/slices/services/presentation.ts`. Columna nullable
`service.presentation` JSONB, sin default/backfill obligatorio, propiedad de Services.
Schema Zod cerrado, con `version: 1`; campos opcionales preservan comportamiento histórico.

```ts
type ServiceSectionKey =
  | "included" | "itinerary" | "options" | "pricing"
  | "extras" | "partners" | "good_to_know";
type ServicePriceDisplay = "auto" | "from" | "on_request" | "hidden";
type ServiceIconSlot =
  | "service_photos" | "service_badge" | "service_included" | "service_note"
  | "know_included" | "know_cancellation" | "know_practical";
type ServicePresentation = {
  version: 1;
  sections?: Partial<Record<ServiceSectionKey, boolean>>;
  price_display?: ServicePriceDisplay;
  icons?: Partial<Record<ServiceIconSlot, string>>;
};
```

Validar claves de iconos con `iconKey` existente. No aceptar claves desconocidas ni
versiones desconocidas en guardado. Lectura pública de configuración inválida → herencia
histórica; BO detecta el problema y bloquea sobrescritura silenciosa (apartado 5).
Config ausente y objeto `{version:1}` son equivalentes para render.

Reglas de visibilidad, aplicadas después de resolver el `detail` localizado:

- `undefined`: mostrar si existe contenido, como hoy.
- `false`: ocultar, conservando contenido persistido.
- `true`: mostrar si existe contenido válido; validar mínimos de origen al guardar.
- Ninguna, una o varias de las tres secciones principales son válidas; categoría y
  `booking_type` no deciden qué bloques se muestran.
- Orden fijo: descripción → incluidos → itinerario → opciones → tarifas/extras → socios
  → Conviene saber. Facts, título, galería, tarjeta y formulario conservan su ubicación.
- Tabla y extras se filtran por separado; contenedor de tarifas solo si queda alguno.
- Socios ocultos no pueden generar un botón que enlace a un `#partners` inexistente.
- La adaptación de `notes` antiguas a información práctica se hace antes de evaluar
  `good_to_know`; mantener su contenido y su acción de traslado existente.

Helpers puros, exportados por `contract.ts` si los necesita un consumidor externo:

```ts
parseServicePresentation(value: unknown): ServicePresentation | null;
isServiceSectionVisible(key, presentation, detail): boolean;
applyServicePresentation(detail, presentation): ServiceDetailContent;
resolveServicePriceDisplay(presentation, priceFrom): "from" | "on_request" | "hidden";
resolveServiceIcons(overrides, siteIcons): Record<ServiceIconSlot, string>;
```

El helper de aplicación devuelve una copia filtrada, nunca muta ni persiste los datos
originales. `getServiceForEdit` obtiene siempre los arrays íntegros. `getServiceBySlug`
devuelve `detail` con la presentación aplicada y miniaturas correspondientes a los pasos
visibles. Los identificadores de medios y flags no forman parte de los nuevos textos.
Las refs ya incluidas en el `detail` histórico se conservan en su formato actual;
no se migra el antiguo sistema de traducción del JSON completo en esta entrega.

### 3.2. Precio destacado y tarifas

Almacenamiento de `price_from` continúa en céntimos enteros; el usuario edita euros
con hasta dos decimales, coma o punto. Conversión por representación decimal, sin truncar
`35,50` a 35 ni aceptar notación exponencial/valores negativos. Importe cero es válido.
Rango: 0–2.147.483.647 céntimos, techo de PostgreSQL integer, aplicado en validación
Services y conversión BO; el helper `cents` compartido hoy no impone ese máximo.
Rechazar precisión extra antes de escribir, sin cambiar el helper del kernel.

| Modo | Regla de render | Requisito de guardado |
|---|---|---|
| auto | Número presente → Desde + importe; ausente → Bajo consulta | Compatibilidad histórica |
| from | Desde + importe + sufijo + nota | Importe válido obligatorio |
| on_request | Label Bajo consulta; sin importe/sufijo/nota monetaria | Conservar los datos anteriores |
| hidden | Sin label Desde, importe, Bajo consulta, sufijo ni nota monetaria | Conservar datos; mantener acciones y filas no monetarias |

En `auto`, una `price_note` histórica bajo «Bajo consulta» sigue apareciendo para
compatibilidad. La supresión de esa nota en `on_request`/`hidden` es explícita al elegir
esos modos. Tabla y extras nunca se sincronizan automáticamente con `price_from`.
Sus precios siguen siendo texto de presentación («40 € / persona», «A consultar»).
Las opciones siguen siendo informativas, sin importe dedicado ni elección de compra.

`ServiceSummary` añade `priceDisplay: "from" | "on_request" | "hidden"` resuelto.
`priceFrom`/`priceSuffix` conservan su significado de datos, no se sobrecargan para ocultar.
Los consumidores que muestran precios deben usar `priceDisplay`. En el código actual
solo el detalle los muestra: **ni el listado ni el carrusel Home muestran importes**;
no añadirlos. Revisar ambos consumidores del contrato y conservar su invalidación.

En móvil, `price` de `ServiceMobileBar` pasa a `string | null`; null omite el bloque
monetario y mantiene el CTA. No sustituir oculto por «Bajo consulta».

### 3.3. Labels traducibles por servicio

Nuevo archivo puro `src/slices/services/copy.ts` con whitelist y Zod. Añadir al payload
`copy?: Partial<Record<ServiceCopyKey, string>>`; draft BO admite string vacío, guardado
normaliza trim. Cada override se guarda como campo traducible escalar
`copy:<key>` mediante `setSourceContent`, no como otro JSON traducible.
La pipeline existente descubre campos fuente desde las filas de traducción; no necesita
un registro nuevo de keys ni cambios de kernel/Translation. Texto fuente EN y revisión
aprobada EN/PT/ES/FR según sistema actual. No afirmar generación automática funcional
sin proveedor verificado.

Whitelist exacta, usando nombres de `services.detail.*` para trazabilidad:

```text
aboutEyebrowService aboutEyebrowExperience includedEyebrow
itineraryEyebrow itineraryTitle optionsEyebrow optionsTitle
ratesEyebrow ratesTitle partnersEyebrow partnersTitle
knowEyebrow knowTitle knowIncluded knowCancellation knowPractical
from onRequest whatsappCta seePartners noPayment
showAllPhotos allPhotos close guestFavourite
relatedEyebrow relatedTitle
enquiryEyebrow enquiryTitle enquiryIntro enquiryInfoTitle
phone whatsapp email requestShort bookingLabel breadcrumbLabel home
```

Excepciones con una única fuente de edición:

- About e incluidos mantienen `detail.about_title` y `detail.included_title`; no crear
  `copy:aboutTitle` ni `copy:includedTitle` duplicados.
- El botón principal usa `cta_label` existente como override tanto en enquiry como
  external. Sin override, enquiry conserva Request Service/Experience según categoría.
  No crear `copy:requestService`/`copy:requestExperience` duplicados. En enquiry, el label
  móvil usa `copy:requestShort`, después `cta_label`, después el fallback móvil actual.
  En external usa `cta_label`; en none con socios visibles usa `copy:seePartners` o su
  fallback. `requestShort` nunca cambia el botón externo ni el enlace a socios.
- Nombre, excerpt, descripción, price_suffix, price_note y SEO mantienen sus campos.
  No duplicar contactos empresariales: se editan sus labels; números/direcciones siguen
  en Settings. Labels del formulario ContactForm pertenecen a Leads y quedan globales.
- Flecha decorativa del CTA se añade una sola vez por el renderer.

Límites: eyebrow 80, títulos 200, labels de botones/contacto 80, labels auxiliares 120,
`noPayment` 400, `enquiryIntro` 1200; mapear cada key a una categoría en el schema.
`enquiryTitle` admite y exige una ocurrencia literal de `{name}` (interpolada con el nombre
localizado, como hoy). No aceptar llaves ni plantillas ICU arbitrarias en otros overrides.
Texto se renderiza escapado, nunca HTML proporcionado por el editor.

Override faltante/vacío → mensaje del idioma visitante. En BO usar placeholders/hints
de fallback sin copiarlos a los inputs: abrir/guardar sin cambios no crea overrides.
Campo omitido del payload antiguo → preservar overrides existentes; `copy` presente
representa el mapa completo y una entrada vacía eliminada limpia ese override y sus targets
mediante el seam existente. No borrar overrides por una actualización parcial omitida.
Validar cada override también al leerlo, porque Translation puede aprobar texto que no
pasó por Zod Services: un target con placeholder inválido cae al source válido, después
al mensaje del locale. Un override inválido no invalida los demás ni rompe el render.

`ServiceDetail` añade `copy: Partial<Record<ServiceCopyKey, string>>` localizado y
`presentation: ServicePresentation | null`. El renderer resuelve faltantes con `t()`.
`ServiceEditData` incluye ambos en origen EN. `ServiceSummary` no necesita copy completo.

### 3.4. Iconos y medios

Los siete slots nuevos usan override neutral → Settings → `SITE_ICON_DEFAULTS`.
Facts siguen con su selector Iconoir existente. Añadir botón «Usar icono global» que
borra el override; no mostrar una elección heredada como valor persistido. Estrellas y
controles de navegación son iconos funcionales del sistema, sin selector ornamental nuevo.

Imágenes: conservar portada, galería, imagen OG y miniaturas de itinerario; pickers y
cola actual. Validar en servidor existencia y MIME de todas las refs mediante `loadMedia`;
lista exacta para estas superficies: `image/jpeg`, `image/png`, `image/webp`, `image/avif`,
la misma que `IMAGE_MIMES`. Sin GIF, SVG, vídeo, PDF ni Lottie. Conservar WebP animados
históricos admitidos por el pipeline; no introducir su rechazo al guardar sin cambios.
OG admite esos MIME de imagen, sin vídeo/Lottie. `loadMedia` no expone frames: esta
entrega garantiza tipo de recurso, no detección de animación ni un primer frame concreto
en redes sociales. El hint recomienda una foto estática; no prometer rechazo de un WebP
animado ni añadir inspección remota de bytes para ello.
Compartir un recurso no cambia su alt global: el formulario
explica que el texto alternativo se gestiona en Media. No añadir otro almacén de alt.
No tocar el pipeline de upload ni optimización del kernel.

## 4. UX y correspondencia de campos

Preservar componentes, tokens y visual actual del BO. Sin wizard obligatorio ni presets.
Orden del formulario:

1. Estado/orden e información general: categoría, nombre, slug, resumen, descripción;
   título About, facts, iconos, duración, valoración y badges en sus grupos relacionados.
2. Imágenes: portada y galería. OG se mueve a SEO si hoy aparece en Medios.
3. Secciones del servicio: checkboxes independientes para Qué incluye, Qué harás /
   itinerario, Opciones y Socios. Resumen por fila con cantidad y estado. Paneles activos
   muestran sus campos; ocultos conservan un resumen y «Mostrar de nuevo». Conviene saber
   tiene su panel activable con las tres columnas y la migración explícita de notas antiguas.
4. Precio y reserva: modo de precio, euros/unidad/nota, filas de tarjeta, tabla y extras
   activables por separado; formulario/enlace externo/sin solicitud. Los campos de enlace
   externo aparecen solo en ese modo; el label principal se edita también para enquiry.
5. SEO: meta title, meta description, OG. Mantener slug/canonical/hreflang y fallbacks.

Dentro de cada bloque, agrupar «Encabezado» (eyebrow/título) y «Contenido». Labels
secundarios, galería, contactos, reserva y otros overrides de copy aparecen en un panel
colapsable «Textos adicionales» agrupado por superficie; no 38 inputs abiertos a la vez.
Opciones con descripciones siguen pasando a tarjetas con la regla actual; mostrar ayuda
para evitar que parezca una elección de reserva. Mantener subir/bajar elementos existentes.

Al abrir sin presentación persistida, calcular checkboxes desde contenido real, pero
conservar herencia al guardar si no se cambiaron. Al interactuar con una casilla se escribe
su boolean explícito; no materializar falsos de bloques vacíos solo por abrir el formulario.
Cada sección ofrece «Usar comportamiento automático» para eliminar su flag sin borrar
contenido; el modo de precio ofrece «Automático». Mostrar cuándo el estado se hereda,
frente a una elección explícita, y conservar esa diferencia tras guardar/recargar.

Contraer cambia UI; ocultar cambia la web; eliminar borra un elemento con acción distinta.
Desactivar no borra ni reinicia contenido o encabezados. Reactivar después de guardar y
recargar recupera los datos. Cambios se aplican al guardar, con feedback «Guardado» y
`role=status`/live region; no se promete un paso separado de publicación.

Errores: resumen con enlaces, abrir sección afectada y enfocar primer campo; controles
con labels únicos por ítem, estado de expansión y teclado. No esconder errores detrás
de un bloque colapsado. Aviso al navegar/cerrar con cambios pendientes o subidas.
El aviso cubre enlaces propios del formulario y cierre/recarga del navegador mediante
beforeunload. La navegación del menú lateral global queda fuera de esa garantía; no
modificar el shell global para interceptarla ni afirmar protección universal de salida.

## 5. Validación, compatibilidad y errores

- Validar primero el payload completo y referencias antes de cualquier escritura.
  El código actual tiene guardado secuencial: no afirmar transacción global ni atomicidad.
- `presentation` omitido por cliente antiguo → preservar columna actual; null explícito
  → restaurar herencia. Nunca borrar configuración como efecto de un cliente desactualizado.
  Validar el contenido contra la presentación efectiva resultante, incluida la persistida
  si el payload la omite. Un cliente antiguo no puede vaciar un bloque persistido `true`
  eludiendo los mínimos por omitir la configuración.
- Bloque explícitamente activo requiere al menos un elemento válido para guardar, tanto
  en draft como published. Esta entrega no añade borradores con filas incompletas.
  Los campos generales mantienen sus requisitos actuales.
- Contenido oculto sigue teniendo que cumplir el schema persistido. Si se edita una fila
  hasta dejarla inválida y se desactiva el bloque, conservarla en memoria, abrir el bloque
  al guardar y ofrecer corregirla o «Descartar cambios de esta sección», restaurando la
  última versión válida cargada/guardada de contenido y encabezados de esa sección,
  conservando su decisión actual de visibilidad y todos los otros campos del formulario.
  Las refs de imágenes del bloque vuelven con su contenido; no revertir galería/SEO/copy
  de otra sección ni descartar valores automáticamente al desactivar.
- `external` requiere URL http(s) válida y label no vacío; enquiry no exige URL externa.
  Valores de campos no aplicables se conservan, pero no alteran la acción actual.
- Slug conflict, error de upload, error servidor o fallo parcial conservan formulario/dirty;
  no navegar ni anunciar éxito. Tras fallo parcial, invalidar lecturas potencialmente
  cambiadas y mostrar error: no dejar cache histórica que oculte el resultado parcial.
- JSON fuente `detail` o presentación inválidos: `ServiceEditData` añade
  `integrity: { detail: "valid"|"missing"|"invalid"; presentation: "valid"|"missing"|"invalid" }`.
  BO permite leer y muestra aviso con recuperación fuera del guardado ordinario. Bloquear
  guardado cliente y servidor si original inválido; no convertirlo a EMPTY y sobrescribir.
  La reparación manual de esos datos no se añade a esta entrega.
- API de guardado añade errores discriminados `invalid_stored_content` y
  `unsupported_actor_id`, además de los actuales, con mensajes cuatro idiomas.

### Compatibilidad de staff IDs: gate explícito

`translation.updated_by` es UUID y `staff.userId` puede ser texto. No resolverlo
silenciosamente omitiendo autor, inventando UUID o cambiando el kernel dentro de un agente.
G0 reproduce guardado con staff UUID y con ID textual en DB aislada. Mientras el kernel
mantenga el contrato actual, acción Services detecta ID no UUID antes de cualquier mutación
y devuelve `unsupported_actor_id` con explicación localizada. Probar que no se altera fila,
slugs, contenido ni galería. Esto sustituye el fallo SQL parcial por un rechazo controlado.

Nota histórica anterior a ADR0036 (reemplazada por ampliación al final):
No declarar soporte funcional de guardado con staff textual: queda bloqueado por el
contrato existente. Si el staff real al que debe entregarse el editor usa ID textual,
el orquestador documenta un ADR/remediación del kernel antes de G3; QA no puede aprobar
el editor para ese usuario usando solo un fixture UUID. La decisión de cambiar el esquema
de auditoría de identidad queda fuera de esta spec de Services y se eleva con evidencia.

## 6. Contrato base y ownership

### Orquestador: único escritor de compartidos y backend

Existentes:

```text
AGENTS.md
src/slices/services/schema.ts
src/slices/services/contract.ts
src/slices/services/validation.ts
src/slices/services/server/queries.ts
src/slices/services/server/publish.ts
src/slices/services/admin/queries.ts
src/slices/services/admin/actions.ts
src/slices/services/admin/validation.ts
src/slices/services/tests/services.test.ts
src/slices/services/tests/services-admin.test.ts
src/slices/services/README.md
messages/en.json
messages/pt.json
messages/es.json
messages/fr.json
drizzle/meta/_journal.json
docs/data-model.md
docs/specs/service-detail-editor-audit-2026-10-18.md
docs/specs/service-detail-editor-execution.md
```

Nuevos:

```text
src/slices/services/presentation.ts
src/slices/services/copy.ts
src/slices/services/admin/service-media-validation.ts
src/slices/services/tests/services-presentation.test.ts
src/slices/services/tests/services-copy.test.ts
src/slices/services/tests/services-save-guards.test.ts
src/slices/services/tests/services-media-validation.test.ts
drizzle/0019_service_presentation.sql
drizzle/meta/0019_snapshot.json
docs/specs/service-detail-editor-qa.md
docs/specs/handoff-service-detail-editor.md
```

Crear copia de trabajo de integración en
`/private/tmp/central-hill-service-detail-integration`, rama `service-detail/integration`.
Preparación/documentación actual permanece en raíz hasta capturar solo estos archivos
en commit. No copiar `.env.local`. Backend integra `presentation`, copy, lectura compatible,
guardas, migración y mensajes antes de delegar A/B. El commit G1 debe compilar y sus
tests puros pasar; puede conservar el UI antiguo hasta que lleguen consumidores.
No cambiar exports sin avisar y verificar A/B. Lockfile y package.json quedan read-only:
no dependencias nuevas previstas.

### Implementador A: editor

Worktree previsto: `/private/tmp/central-hill-service-detail-editor`.
Rama: `service-detail/editor`; base: commit G1 registrado por orquestador.

Escritura exclusiva existente:

```text
src/slices/services/admin/ui/service-form.tsx
src/slices/services/admin/ui/detail-editor.tsx
src/slices/services/admin/detail-draft.ts
```

Escritura exclusiva nueva:

```text
src/slices/services/admin/ui/service-section-controls.tsx
src/slices/services/admin/ui/service-copy-editor.tsx
src/slices/services/admin/form-model.ts
src/slices/services/tests/services-editor-model.test.ts
```

Entrega: formulario por grupos, activaciones persistidas, herencia intacta, copy/iconos,
EUR→céntimos, integridad, errores con foco, confirmación de salida y medios/OG usando
componentes existentes. Helper de conversión y payload testable en `form-model.ts`;
no llamar directamente tablas ni cambiar server actions. Claves i18n adicionales se
solicitan al orquestador y se integran antes de verificar el consumidor.

### Implementador B: render público

Worktree previsto: `/private/tmp/central-hill-service-detail-public`.
Rama: `service-detail/public`; base: el mismo commit G1.

Escritura exclusiva existente:

```text
src/slices/services/ui/service-detail.tsx
src/slices/services/ui/components/service-booking-card.tsx
src/slices/services/ui/components/service-mobile-bar.tsx
src/slices/services/ui/components/service-good-to-know.tsx
```

Escritura exclusiva nueva:

```text
src/slices/services/ui/detail-view-model.ts
src/slices/services/tests/services-detail-view.test.ts
```

Entrega: consumir detail filtrado, copy localizado y overrides neutrales de iconos;
resolver CTA enquiry/external/none sin anclas rotas; precio oculto real en desktop/móvil;
fallbacks y semántica actuales. `detail-view-model.ts` contiene decisiones puras para
probar correspondencia y modos sin duplicar implementación backend.
No cambiar Home/listado ni core; revisar sus contratos como consumidores read-only.

### QA independiente

Sin escrituras de aplicación. Tras G2 recibe cwd/rama/commit integrado, identidad
verificada de entorno y matriz de casos; no hereda credenciales remotas. Capturas/scripts
temporales en `/private/tmp/central-hill-service-detail-qa/`; informe al orquestador para
registro en `docs/specs/service-detail-editor-qa.md`. No modifica código para aprobarse.
Devuelve severidad, reproducción, esperado/real, evidencia y checks con exit codes.

Cada agente verifica `pwd`, rama, HEAD y `git status --short` antes de empezar y usa
`workdir` explícito. Ningún archivo fuera de estos listados se modifica sin ampliación
registrada por el orquestador; las rutas de detalle Next y el slice Pages son read-only.
Si aparece una necesidad de kernel, presentar CCR/ADR, no importar internos de otro slice.

## 7. Entorno aislado previsto

No se provisiona durante esta etapa de spec. Antes de pruebas se verifica realmente:

| Recurso | Identidad propuesta | Estado actual |
|---|---|---|
| App dev | checkout integración, puerto 3058 | No iniciado |
| App build/start | checkout integración, puerto 3059 | No iniciado |
| PostgreSQL | contenedor `central-hill-service-detail-db`, DB `servicedetailqa`, puerto local 5558 | No creado |
| Neon HTTP test adapter | proxy local 4458, endpoint ficticio propio | No creado |
| S3 local | puerto 9058, bucket `servicedetailqa`, directorio QA propio | No creado |
| Staff | usuarios ficticios UUID y textual; sin sesión remota | No creados |
| Fixtures | diez patrones de servicio, categorías, imágenes locales y targets aprobados antiguos | No cargados |

Puertos se reservan tras comprobar disponibilidad; si están ocupados se cambian aquí
antes de lanzar procesos. Registrar PID, owner, cwd y host/DB/bucket sin contraseñas.
La infraestructura anterior es referencia, no recurso compartido a reutilizar sin verificar.
Preload de transporte local y autorización del image optimizer para medios privados de QA
solo en archivos temporales; nunca incorporarlos al kernel o configuración de producción.

Node22 y pnpm10.8.0 con lockfile existente en cada worktree. Sin `.env.local` del checkout
raíz. Antes de migrar/seed/build, comprobar host y DB reales del entorno ficticio; una URL
localhost de la app no prueba aislamiento. No ejecutar `scripts/seed-services.ts`: sube
imágenes a storage configurado. Crear fixtures sintéticos propios en la DB/media aislados.
La migración nueva se prueba contra copia de schema anterior y contra DB vacía; no
efectuar migraciones ni writes remotos. Infra/instalaciones que necesiten permisos usan
el mecanismo normal de aprobación del entorno.

## 8. Aceptación y QA reproducible

| ID | Caso | Resultado requerido |
|---|---|---|
| AC01 | Diez patrones de la auditoría, presentación null | Mismo layout, headings, precio, CTA y medios; sin materializar overrides al guardar sin cambios |
| AC02 | Ninguno / cada uno / combinaciones de incluidos, itinerario y opciones | Combinaciones válidas, orden fijo y solo campos activos visibles en BO |
| AC03 | Ocultar bloque con contenido, guardar, recargar y reactivar | Datos íntegros, encabezados e imágenes conservados; vuelve a mostrarse |
| AC03b | Restaurar automático de sección, precio e iconos; guardar/recargar | Flags/overrides eliminados; herencia reconocible, contenido intacto |
| AC04 | Ocultar tabla, extras, socios y Conviene saber independientemente | Sin contenedor vacío ni CTA #partners roto; notes legacy conserva fallback |
| AC05 | auto/from/on_request/hidden; 0, 35,50 y 35.50 | Render y conversión correctos; hidden no muestra Bajo consulta; datos recuperables |
| AC06 | Precio sin tabla, tabla sin precio, extras sin tabla | Configuraciones independientes sin sincronización ni borrado |
| AC07 | Modificar cada copy key, About/Included, cta_label | Cada campo llega al elemento correspondiente; variables seguras, flecha única |
| AC07b | requestShort presente con enquiry, external y none/socios | Solo enquiry usa requestShort; external usa cta_label y socios seePartners |
| AC08 | Siete overrides de iconos, facts y restaurar herencia | Override local → Settings → default, sin cambiar otros servicios |
| AC09 | Guardar con targets aprobados antiguos EN/PT/ES/FR | Estructura y precio siempre obedecen presentación neutral; textos siguen pipeline/fallback |
| AC10 | Copy traducido aprobado, draft, ausente y borrado de override | Gating y fallback correctos; sin tablas de idiomas ficticias ni pérdida por payload omitido |
| AC10b | Target aprobado con {name} inválido o exceso de longitud | Fallback por campo a source válido/mensaje; resto de overrides intacto |
| AC11 | Portada/galería/OG/miniatura: subir, guardar y recargar | Referencias reales válidas, bloqueado durante cola; MIME/UUID inválidos rechazados antes de writes |
| AC12 | JSON detail/presentación inválido, legacy notes y campos nuevos ausentes | Aviso y bloqueo seguro en inválido; compatibilidad en ausente/legacy |
| AC13 | Bloque activo vacío; bloque oculto con edición incompleta; URL externa vacía | Errores accesibles; corregir/descartar explícito; ningún descarte silencioso |
| AC13b | Payload omite presentación y vacía bloque persistido true | Rechazo previo por mínimos usando configuración efectiva |
| AC13c | Descartar cambios de bloque incompleto con otras ediciones pendientes | Restaura solo contenido/encabezados/refs del bloque, conserva ocultación y otros cambios |
| AC14 | Sin sesión/no staff; staff UUID; staff textual | Acceso denegado; UUID guarda; textual rechazo previo sin ninguna mutación o remediación ADR verificada |
| AC15 | Error servidor parcial, upload fallido, conflicto slug y salida con cambios | Estado conservado, feedback veraz, cache coherente y recuperación; aviso en enlaces propios y browser unload |
| AC16 | Guardar sin reiniciar app ni limpiar cache manualmente | Detalle, listado y Home se actualizan por ISR; SEO corresponde al servicio y locale |
| AC17 | SEO title/description/OG/canonical/alternates y slug inexistente | Metadata/fallbacks actuales intactos, cuatro idiomas y 404 correcto |
| AC18 | BO y público a 1440×960 / 390×960, teclado y textos largos | Sin overflow, foco visible, controles etiquetados, feedback anunciado y acciones accesibles |
| AC19 | Migrar schema previo y DB vacía; datos antes/después | Columna aditiva, datos existentes preservados y null hereda sin backfill |
| AC20 | Importe cero, techo PostgreSQL, techo+1, negativo, tres decimales y exponente | Solo representaciones admitidas se convierten exactamente; inválidos rechazados antes de writes |

QA debe realizar save/reload y comprobar HTML público real de AC03–AC11 y AC16;
tests de helpers no sustituyen persistencia. Crear fixtures de copy por campo para detectar
campos que se guardan pero no se renderizan. Verificar idiomas sin depender de que el
proveedor traduzca automáticamente. Introducir fallos solo en entorno de prueba propio.

Una ronda conjunta desktop/móvil y correcciones agrupadas; segunda pasada confirma
correcciones. Si persiste un defecto obligatorio no aprobar ni integrar; registrar el bloqueo.
La pasada es acotada, no una licencia para cerrar hallazgos sin resolver.

## 9. Comandos reales de verificación

Con Node22/pnpm10.8.0 y entorno aislado verificados, desde integración:

```sh
pnpm typecheck
pnpm lint
pnpm exec tsx --test src/slices/services/tests/services.test.ts src/slices/services/tests/services-admin.test.ts src/slices/services/tests/services-presentation.test.ts src/slices/services/tests/services-copy.test.ts src/slices/services/tests/services-save-guards.test.ts src/slices/services/tests/services-media-validation.test.ts src/slices/services/tests/services-editor-model.test.ts src/slices/services/tests/services-detail-view.test.ts
pnpm exec tsx --test src/slices/pages/tests/pages.test.ts src/slices/pages/tests/services-content.test.ts src/slices/pages/tests/services-editor.test.ts src/slices/pages/tests/services-media-validation.test.ts src/slices/translation/tests/translation.test.ts src/slices/seo/tests/seo.test.ts
pnpm db:check
pnpm build
git diff --check
```

Los nuevos tests todavía no existen: los comandos son criterios de ejecución futuros,
no evidencia de éxito actual. Tests puros no deben importar módulos server-only; usar
helpers puros e inyección para guardas. Si un test requiere tsconfig especial, fijarlo
explícitamente y registrar el comando final. No contar `pnpm test` ni `boundary:check`.
Revisar manualmente imports de slice, cobertura de keys EN/PT/ES/FR y cache tags.

A ejecuta tests de modelo de editor y typecheck/lint en su worktree; B los de view model
y typecheck/lint. Orquestador ejecuta todos los anteriores sobre candidato integrado.
QA aporta comandos de browser y migración aislada con paths, exit codes y commit exacto.
Tras cambios, repetir solo afectados más los checks integrados exigidos para el candidato.

## 10. Secuencia y registro de entrega

1. Capturar documentación de planificación sin absorber otros cambios. Revalidar baseline,
   resolver G0 y crear integración con entorno propio. Registrar paths/ramas reales.
2. Orquestador prepara G1; contract commit probado y mensajes listos antes de abrir
   worktrees A/B desde él. Entregar a cada uno el contrato de delegación del workflow.
3. A/B trabajan en paralelo con archivos disjuntos y entregan commits, paths nuevos,
   comandos/exit codes y limitaciones. Orquestador integra secuencialmente y revisa diff.
4. Checks integrados → QA independiente → correcciones por propietario → retest de casos
   afectados. Ningún blocker ni check requerido faltante permite G3.
5. Actualizar README/data-model/spec/QA/handoff; registrar candidato, commit final,
   archivos nuevos y existentes, checks y limitaciones. Integrar en main local dentro del
   acuerdo vigente; preservar worktrees hasta capturar todo. Sin push/despliegue.

| Registro | Valor en esta etapa |
|---|---|
| Base observada | `62b622b534587d30189943696a02d28e1cbbd4d8` |
| Commit de planificación | Identificado por `savepoint/pre-service-detail-editor-2026-10-18` al crear el checkpoint |
| Infra aislada / PID / identidad | G0 verificado; registro al final |
| Commit contractual G1 | `a4717eab06c6b1213758b60eb0fd4a44033752af` |
| Commit A / B | A `505d1a4` integrado como `3008671`; B `079243f` como `23cc475` |
| Candidato integrado / QA | No existe |
| Cambios de esta etapa | Nueva spec y actualización de punteros/documentación de auditoría |
| Checks de esta etapa | Solo revisión documental y whitespace; sin tests de aplicación |

Esta spec fija decisiones y ownership para iniciar G0/G1. Los implementadores de UI/público
se lanzan cuando G1 esté capturado, no solamente porque exista un plan escrito.

### Revisión de la spec

Dos agentes de solo lectura revisaron contratos/backend y UX/aceptación. Incorporadas sus
precisiones: tope PostgreSQL de precio, copy validado también en lectura, garantía real de
MIME sin inventar detección de frames, configuración efectiva al validar payloads antiguos,
CTA móvil según booking_type, restauración de herencia y alcance acotado del aviso de salida.
No hay aprobación de QA de aplicación ni gates ejecutados implícitamente por esa revisión.

Verificación documental: `git diff --check` exit 0; comprobación de whitespace y newline
de documentos nuevos exit 0; las 38 copy keys existen en messages EN y los 43 paths de
escritura listados tienen propietario único. Node22 y pnpm10.8.0 verificados (exit0).
La app no cambió; typecheck/lint/build/tests quedan para la implementación.

### Savepoint previo a implementación

Solicitado por el owner antes de empezar. Referencia Git local reservada:
`savepoint/pre-service-detail-editor-2026-10-18`, que se crea sobre el commit que captura
esta spec, la auditoría y el puntero de `AGENTS.md`. El código de aplicación coincide con
la base estable `62b622b534587d30189943696a02d28e1cbbd4d8`; los únicos cambios del
checkpoint son esos tres documentos. El hash se obtiene con
`git rev-parse 'savepoint/pre-service-detail-editor-2026-10-18^{commit}'`.

El savepoint conserva código y documentación versionados, no snapshots de DB, bucket,
secretos ni procesos. Esta preparación no migró ni modificó datos. Para inspeccionar o
recuperar el checkpoint sin descartar trabajo posterior, crear otro worktree desde la
referencia, en una ruta libre; evitar reset/restore global del checkout de trabajo.
Referencia local, sin push ni despliegue. Su creación y verificación se reportan al owner.

## Ejecución tras savepoint — 2026-10-18

- Savepoint verificado: `a1107f859944e98757134bdb25d776976d51023f`, tag local
  `savepoint/pre-service-detail-editor-2026-10-18`. Raíz permanece limpia en ese commit.
- Orquestador: `/private/tmp/central-hill-service-detail-integration`, rama
  `service-detail/integration`, base savepoint. A/B todavía no lanzados al preparar G1.
- Dependencias: directorio `node_modules` local ignorado con links a las dependencias
  existentes del checkout raíz, solo lectura; sin instalar ni cambiar package/lockfile.
- Infra G0 a cargo de agente auxiliar solo en `/private/tmp/central-hill-service-detail-qa`
  y contenedores nuevos dedicados; no escribe aplicación ni toca trabajos anteriores.
- G1: migración0019 generada, solo ADD COLUMN presentation jsonb; guardas previas,
  copy escalar y lectura filtrada implementados. Shared helpers/interfaces y labels
  `services.admin.presentation` en cuatro idiomas antes de consumidores.
- Checks G1 antes de última revisión: typecheck exit0, lint exit0 con5 warnings previos,
  52 tests Services exit0, db:check exit0 (20 migraciones; warning0008 previo).
  tsx inicial falló EPERM de IPC dentro sandbox; repetido con permisos, éxito real.
- Revisión G1 por agente de modelo detectó catch de invalidación situado en categoría:
  corregido al catch de saveService; sin cambios de comportamiento de categoría.
  Pruebas de predicados no equivalen a I/O: QA debe comprobar AC14/15 realmente.
- `admin.presentation` ofrece labels title/hint/visible/hidden/inherited/explicit/reset,
  elements(count), show/edit/discard/discardHint/headings/additional/additionalHint,
  copyFieldLabel(label), serviceNameExample/globalIcon/icons/priceMode/euros/eurosHint,
  modes.{auto,from,on_request,hidden}, source/published/unsaved/integrity/actor/emptySection,
  priceRequired/invalidEuros/externalUrl/externalLabel/mediaError/saveError/copyInvalid.
  A mapea frases de guardas a esos mensajes localizados y solicita claves nuevas al owner.

### G0 verificado y consumidores en curso

- DB dedicada `servicedetailqa`, contenedor `central-hill-service-detail-db`, puerto5558;
  proxy `central-hill-service-detail-proxy` puerto4458, red propia.
  Driver Neon real confirmó database/user servicedetailqa. Sin endpoint/credencial remoto.
- S3rver puerto9058, bucket servicedetailqa, PID10096, sesión70146, dir temporal propio.
  PUT/GET real comprobado, HTTP200. Staff ficticios UUID y textual creados, sin login remoto.
- Migraciones0000–0018 aplicadas a DB vacía por agente infra; orquestador aplicó0019
  y diez patrones de servicios con medios sintéticos/targets antiguos aprobados en una
  transacción propia, exit0. No se ejecutó el seed que sube medios remotos.
  SQL y manifest en `/private/tmp/central-hill-service-detail-qa/`.
- G1 commit `a4717ea`: typecheck/lint y52tests reejecutados exit0 tras corrección de catch.
  db:check exit0. A/B creados desde ese mismo commit, paths/ramas de sección6 verificados.
- B commit `079243f` (5archivos asignados) integrado como `23cc475`; typecheck/lint,
  8tests de render y detector[] exit0. A todavía trabajando en archivos exclusivos.
- Enquiry ahora respeta cta_label ya existente: corrección intencional frente a baseline,
  excepción documentada a «mismo CTA» AC01. Valores antiguos no se descartan ni se inventan.
- Dev propio en3058, worktree integración, sesión72315, entorno ficticio sourced desde
  `/private/tmp/central-hill-service-detail-qa/env.sh`; Next webpack. QA integrado pendiente.

### Ampliación de scope del orquestador: ADR0036

Evidencia del flujo normal `scripts/create-admin.ts` (signup sin política UUID), los IDs
textuales de Auth y el fallo SQL previo hacen insuficiente entregar solo rechazo seguro.
Para dar soporte real a personal normal sin perder atribución, el orquestador aprobó
[ADR0036](../decisions/0036-translation-actor-attribution.md): columna text aditiva para
actor real y compatibilidad con campo UUID anterior. Reemplaza el gate UUID-only de
sección5/AC14: QA ahora debe guardar con ambos tipos, no aceptar rechazo para textual.

Escritura adicional EXCLUSIVA orquestador, registrada antes de editar kernel:
`src/core/i18n/schema.ts`, `src/core/i18n/content-write.ts`, nuevos
`src/core/i18n/actor-attribution.ts`, `src/core/i18n/tests/actor-attribution.test.ts`,
`docs/decisions/0036-translation-actor-attribution.md`, `docs/decisions/README.md`,
`drizzle/0020_translation_actor_attribution.sql`, `drizzle/meta/0020_snapshot.json`,
entrada journal y docs compartidas ya asignadas. Sin nueva tecnología ni cambio auth.
No agentes escritores de kernel; A/B conservan alcance. Incluir la suite nueva y QA
real de escritura source/target en candidato integrado antes de G3.

- A `505d1a4` integrado como `3008671`:6archivos asignados; typecheck/lint9tests de
  modelo y detector[] exit0. Ninguna nueva clave i18n. Ambos worktrees preservados.
- AC19 adicional: DB ficticia servicedetailmigrationqa en el mismo contenedor, schema
  anterior hasta0018, servicio previo con precio3550. Aplicar0019 preservó slug/precio y
  presentation null; SQL assertion exit0. Script migration-preservation.sql en QA tmp.
- ADR0036/migración0020 aplicada solo servicedetailqa: nueva columna text para actor real,
  sin reescribir anteriores; source y target seam comparten helper probado. Se elimina
  rechazo UUID-only de Services. Estado final textual debe ser guardado exitoso con autor.
