# Editor contextual — concepto y spec

2026-10-18. Base `b4c97e4`; rama `contextual-editor/concept`, checkout
`/private/tmp/central-hill-contextual-editor-concept`, estado inicial limpio.
Usuario autoriza spec/plan y prototipo HTML/CSS para pulir Home antes de autorizar
la implementación de la feature. Agentes autorizados explícitamente.

## Contrato de esta fase

Entregar una propuesta de estándar reutilizable con preview izquierda, inspector
derecha, selección contextual, vistas desktop/tablet/móvil y pestañas EN/ES/PT/FR.
Home es piloto, no excepción arquitectónica. Planificar un editor independiente
de formularios reutilizables y asignación de un formulario a cada slot compatible.
El prototipo usa sólo datos ilustrativos locales, sin escribir al CMS o publicar.
No se modifica src/, DB, dependencias ni previews3059–3063. Sin main/push/deploy.

## Roles y archivos autorizados

Orquestador único escritor: referencia de tarea en `AGENTS.md`, este documento,
`01-plan.md`, `02-formularios.md`,
`03-review.md` en esta carpeta, `mock/contextual-editor/` (HTML/CSS/JS/assets/README).
El JS, si se necesita, sólo simula selección/cambio de idioma/viewport y estado
local temporal. No implementa backend ni la feature React.
Agente arquitectura: sólo lectura del repo; devolver mapa de Home/Owners/Guest,
contratos/adaptadores/i18n/render y estimación. Sin archivos ni commits.
Agente formularios: sólo lectura de Leads/Pages/Settings; mapear formas actuales,
restricciones, contratos y plan de catálogo reutilizable con estimación. Sin writes.
QA concepto posterior: sólo lectura + scripts/capturas en carpeta temporal propia;
devolver hallazgos de interacción/legibilidad desktop/mobile, no editar prototipo.
No son agentes implementadores de producto ni se crean worktrees de escritura
paralela. Cada uno verificará cwd/branch/base/status. Orquestador integra resultados.

## Criterios de revisión

- Abrir concepto standalone y seleccionar título/medio/botón/sección en Home.
- Inspector claro, estructura fija; sin insertar/reordenar secciones.
- Idiomas mantienen selección; texto traducible y campos compartidos diferenciados.
- Distinguir borrador/preview/publicado y estados de traducción sin publicar nada.
- Selector de formulario ilustra un slot compatible sin tratar Avantio como lead form.
- SEO y secciones ocultas alcanzables desde navegación.
- Desktop y preview móvil cambian ancho real del documento, no sólo el tamaño visual.
- HTML/CSS dominante con interacciones mínimas; sin paquetes instalados.
- Una revisión browser agrupada desktop/móvil, corrección en lote si se necesita,
  y máximo una confirmación. No rebuild/tests del producto por ser sólo mock/docs.
- Estimación separa concepto, infraestructura, Home+idiomas, rollout y formularios;
  no prometer universalidad automática ni migración sin revisar cada editor.

## Estado

Spec/plan y prototipo entregables completados; auditorías read-only y QA del
concepto registradas en03. Pulido del usuario pendiente. No hay implementación
de producto.

## Dirección de experiencia

Capa contextual propia, inspirada en la distribución de Puck y conservando el CMS
actual. Modo Operate: encontrar qué se edita, editarlo y entender qué se publicará.
Sin constructor libre, insertar/mover secciones ni controles arbitrarios de diseño.
La estética del editor conserva el lenguaje del backoffice; la página conserva
Warm Editorial. El canvas ocupa la izquierda, el inspector la derecha; Secciones
es navegación accesible desplegable, no una tercera columna permanente.

Barra superior: página, EN/ES/PT/FR, estado de cambios y acción de guardado con
semántica explícita. Barra del canvas: Secciones, Desktop/Tablet/Móvil, ancho/escala
real y refresco manual. Inspector: breadcrumb, selección, campos, referencia EN,
estado de traducción, ayudas y controles de medios existentes. En pantallas de
administración pequeñas, preview e inspector se apilan. El viewport público puede
ser móvil aunque el administrador trabaje en desktop; son conceptos diferentes.

Selección por campo cuando sea posible, por sección cuando reúna varias opciones.
Contorno hover/selección y nombre del elemento; sólo mostrar controles reales.
Seleccionar botón evita navegación; seleccionar un formulario evita envíos.
Los elementos de layout fijos informan por qué no se editan. El teclado puede
navegar a las secciones/campos y el inspector mantiene un foco predecible.

## Fuente de verdad y mapa de Home

Fuentes revisadas: `pages/schemas/home.ts`, `pages/ui/home-page.tsx`,
`pages/admin/{form-model,layout,actions,queries}.ts`, componentes de cada sección,
contratos de Settings/Buildings/Services/FAQ/Translation. No inferir capacidad de
un comentario antiguo si el código actual la contradice.

| ID de sección | Qué edita Pages | Contenido de otro dueño / restricción |
|---|---|---|
| `hero` | Vídeo, poster, eyebrow, título, subtítulo y textos de botones; URL primaria | No existe modo genérico imagen/vídeo; el Hero actual es vídeo+poster. URL secundaria fija por locale `/owners` |
| `search_bar` (informativo) | Nada de lead forms | Avantio en Settings; integración de reservas externa |
| `stats` | Título, 0–8 cifras y etiquetas | Valores/afijos compartidos; etiquetas [T]; cero oculta sección |
| `guests_pitch` | Copy, 4 beneficios/iconos, medio, CTA y badge | Marco/formatos actuales; sin controles de diseño nuevos |
| `portfolio` | Copy/labels del catálogo | Cards/fotos de Buildings; no duplicarlas en Home |
| `services_carousel` | Copy, garantías y filtro de categoría | Cards de Services; se oculta sin resultados |
| `faq` | Título y selección de grupo | Preguntas/respuestas de FAQ; accesible en outline aunque no visible |
| `dual_cta` | Fotos/copy de ambos paneles | Destinos internos actuales fijos por idioma; contacto Settings |
| `seo` | Título/description/OG actuales | Canonical/hreflang automáticos; no hay elemento visual en canvas |

Registro de cobertura debe distinguir `editable`, `shared`, `external`, `fixed`,
`hidden` y `unsupported`. Todo campo existente debe poder alcanzarse: si aún no
hay binding visual, mantener acceso a los campos de su sección y a Otros campos.
Nunca eliminar una capacidad por no tener un elemento visible en el canvas.

Owners será la segunda prueba del estándar: Hero+wizard, planes de1–4 tiers,
journey, testimonios, FAQ y cierre. Guest agrega teasers, portfolio y contacto
modal. Blog prueba una página corta con secciones condicionales. Adaptación por
página necesaria; no prometer que un registro convierte todo automáticamente.

## Arquitectura propuesta para la feature futura

Shell genérico en el área admin; adaptadores de páginas en Pages; infraestructura
compartida de UI sólo por contrato y ADR si modifica `src/core`. No instalar Puck
ni sustituir `page_content` por un modelo externo. La screenshot de Puck es una
referencia de interacción, no dependencia ni autorización de drag-and-drop.

El preview definitivo debe reutilizar la presentación pública y sus resolutores.
`HomePage` hoy es async y carga sus propios datos: requiere separar composición
con datos de presentación, manteniendo RSC y componentes de servidor. No convertir
la página completa a cliente ni importar consultas servidor al bundle admin.
La duplicación HTML del prototipo está permitida sólo como estudio descartable;
no es la arquitectura para producción y no se copiará como renderer paralelo.

Contrato ilustrativo, todavía no implementado:

```ts
type Selection = {
  pageKey: string;
  sectionId: string;
  fieldPath?: string;
  itemId?: string;
};
type EditableBinding = {
  selection: Selection;
  scope: 'localized' | 'shared' | 'external' | 'fixed';
  translationField?: string;
  ownerHref?: string;
};
type PageEditorAdapter = {
  pageKey: string;
  sections: EditorSection[];
  bindings: EditableBinding[];
  sourceRevision: string;
  locales: LocaleEditorState[];
};
```

Se reutilizan `FieldNode`, `[T]` del esquema, MediaField/IconField, media queue,
layouts y límites de listas. El mapa de campos no sustituye validación servidor.
Los bindings usan identidad estable de ítem donde exista repetición; no convertir
una posición visual en la identidad permanente de una traducción.

Ruta de preview administrativa protegida, con render dinámico privado fuera del
ISR público. Iframe same-origin con documento interno1440/768/390px y escala para
encajar. Los media queries responden al ancho real del iframe. Bridge tipado:
ready/select/reveal/viewport y render snapshot opcional. Verificar origin,
event.source, sesión de frame y bindings autorizados. No emitir anotaciones ni
JS de edición al público; no exponer datos no publicados en rutas públicas.
La selección de textos dentro de componentes de core (p.ej. Hero) requiere un
contrato de instrumentación: un wrapper externo sólo identifica la sección,
no cada título/botón. Acordar esa API mediante ADR antes de implementarla.

## Guardado y significado del preview

Estado actual: guardar Pages publica fuente inmediatamente (ADR0023); no existe
borrador persistente de página. Sólo About tiene guard de revisión; About y Blog
sincronizan filas source atómicamente. No presentar 'Guardar borrador' como una
capacidad ya disponible para Home.

MVP propuesto: preview de valores persistidos, cambios pendientes locales y acción
EN 'Guardar y publicar' explícita. Traducciones tienen acciones distintas.
Cambios por locale no se descartan al cambiar pestaña. La vista indica si muestra
contenido guardado, traducción de revisión o edición local aún no representada.

Incremento opcional, presupuestado aparte: 'Actualizar vista previa' con snapshot
validado en servidor sin persistir/publicar. No implica live preview por pulsación
ni draft/publish persistente. El prototipo lo simula en memoria para evaluar UX;
no prueba ni implementa ese render privado. Si se solicita borrador duradero,
revisiones/historial o programación de publicación, será otro alcance/modelo.

## Edición por idioma integrada

EN fuente; ES/PT/FR targets. Todas las pestañas muestran la misma estructura y
conservan selección. Cada campo muestra valor propio o fallback, referencia EN,
estado y qué idiomas tienen cambios pendientes. Guardar target mantiene revisión;
aprobar publica conforme al modelo actual. Roles/acciones servidor siguen gated.

Distinguir sin traducir, needs_review, approved y fuente modificada. Actualmente
una traducción approved stale sigue pública: la UI no debe prometer su retirada
automática. Los campos compartidos (medios, iconos, flags, números y referencias)
no se duplican por idioma; textos/alts permitidos por esquema sí son [T].
Cambiar idioma del contenido es independiente del idioma del backoffice.

Trabajo previo real, además de dibujar tabs:

- Source sync de Home (y luego cada página), preservando targets y limpiando fuentes
  retiradas. Reutilizar el seam existente, sin tocar tablas kernel desde slices.
- Extender el contrato Translation con lectura/guardado/aprobación necesarias;
  hoy la UI de revisión consume acciones internas que Pages no puede importar.
- Trasladar metadatos [T] del esquema al modelo de campos; no traducir por heurística.
- Identidad estable para listas mutables: Home cifras, Owners tiers, etc., con
  compatibilidad de paths legacy. About es referencia, no migración automática.
- Guardado con revisión/control de cambios para no sobrescribir silenciosamente
  datos mientras se alternan idiomas. Definir conflictos según semántica de fuente.
- Revalidación por UUID→page key ya genérica desde la entrega Blog; conservarla.
- Provider LLM actual puede ser stub identity; no prometer generación de textos
  reales por el hecho de mostrar botones o tabs.

## Formularios como feature independiente

Se define en [02-formularios.md](02-formularios.md). El editor de página selecciona
una definición publicada compatible; el editor de formularios administra sus
campos, textos y versiones. Página conserva el texto que rodea al formulario.
Home no incorpora un slot nuevo de lead forms en esta fase. El prototipo muestra
catálogo separado y asignación ilustrativa a About/Settings/Blog.

## Qué representa el prototipo y qué queda abierto

En `mock/contextual-editor/`, accesible localmente en3070. Interactivos: selección
Hero/título/subtítulo/botones/medios, tabs de idioma, edición de textos en memoria,
refresco manual, anchos reales, outline/SEO, estados de ejemplo y catálogo simple.
No todos los campos ni todos los estados están simulados: los inspectores indican
cuando una capacidad es sólo representada. Sin uploads, submissions, guardado o
traducciones reales. Archivo local seleccionado sólo genera un object URL temporal.
Reiniciar/recargar restablece todo; no localStorage ni requests al CMS.

Decisiones a pulir con el usuario antes de implementar:

1. Conformidad con distribución, navegación y granularidad de selección.
2. MVP con preview guardada o incluir snapshot privado manual desde el inicio.
3. Fuente y traducción en inspector único, semántica de aprobación y guardado.
4. Catálogo de formularios inicial Contact/Newsletter o incluir especializados.
5. Pantallas pequeñas apiladas; el trabajo editorial completo es desktop-first.

La siguiente fase después del pulido es revisar esta spec y sus contratos; recién
entonces se autoriza y ejecuta la feature React. No interpretar el HTML como esa
implementación ni como aprobación del diseño definitivo.
