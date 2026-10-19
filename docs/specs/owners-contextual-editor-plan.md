# Owners — plan para adoptar el editor contextual

**Alcance actual de conversión:** [spec común](page-editor-platform-spec.md) y
[plan](page-editor-platform-plan.md) prevalecen. Owners se adapta conservando su formulario
actual. Releases/selector/captura/Leads de Forms descritos aquí quedan pendientes en otro arco
y no bloquean esta conversión. Este documento conserva el inventario/propuesta histórica;
no se ha implementado Forms público ni debe declararse completo al terminar el editor.

2026-10-18. Estado: planificación solicitada; **implementación de Owners no iniciada**.
Base de producto3c55a1b (Home97d8bc5, código inicial QA-aprobado6359b6d y ajuste
SEO de toolbar3c55a1b). Ver el handoff Home para sus comprobaciones. Checkout actual
/private/tmp/central-hill-home-contextual-integration, rama home-contextual/integration.
El usuario validó visualmente Home. Este documento no autoriza publicar ni escribir producción.

**Prioridad actual:** primero page-locale-drafts-spec.md / plan / ADR0040. Owners queda en
espera de esa base. Las decisiones posteriores del usuario sustituyen EN-live/review por
Guardar borrador/Publicar POR IDIOMA, con JSON independiente. Ver también
page-editors-parallel-plan.md para la adaptación posterior por agentes de página.

## Resultado esperado

Convertir /admin/pages/owners en el segundo adaptador del editor contextual existente.
Reusar PageEditorShell, PageEditorAdapter, bridge privado, selección, inspector,
viewports reales1440/768/390, cola de medios y guardado. Misma composición pública,
EN/ES/PT/FR con borrador/publicación independientes; sin aprobación de traducciones; SEO por idioma.

Decisión UX del usuario: SEO se abre desde **SEO EN/ES/PT/FR**, junto a Desktop,
Tablet y Mobile. No aparece en Sections ni en el selector Element. El inspector
muestra sus campos; title/description traducibles, imagen OG compartida; canonical/
hreflang automáticos. Aplicar el mismo estándar en Owners.

Owners sí tiene formulario propio. Su inspector selecciona un formulario de Forms,
muestra nombre/versión/estado/resumen y enlace Edit form, y sustituye el wizard
hardcoded cuando se guarda una selección publicada válida. Campos, pasos, reglas,
copy, traducciones y destinatario se editan en Forms. No duplicar el constructor en Pages.

## Inventario comprobado en código

Fuentes: schemas/owners.ts, ui/owners-page.tsx, admin/layout.ts y spec histórico
owners-admin-editor.md dentro de Pages; Forms README/types/domain/validation/schema/
contract/server/actions; Leads contract/validation/schema/server/actions.
Los comentarios históricos sobre cifras de Settings o envío real no prevalecen
sobre el código actual: cifras pertenecen a Owners; OwnerEstimateForm hace preventDefault
sin captura real. Su implementación se comparte con Buildings: no reemplazarla globalmente.

| Sección | Adaptación y ownership |
|---|---|
| Hero | Foto, título con saltos `;`, copy y CTA Contact con título/intro de su diálogo |
| Formulario del Hero | Placement de Forms en la misma tarjeta/posición; selección/resumen/enlace, sin campos duplicados |
| Cifras | stats,0–8 filas; valores/afijos compartidos, etiquetas traducibles; cero oculta banda manteniendo anchor |
| Why | Títulos,6beneficios/iconos, CTA y nota; destinos actuales #worth/#start |
| Services | Copy,4beneficios, medio4:5, badge/icono y CTA |
| Plans | Copy,1–4planes, features1–20/plan, popular/corner badge/CTA y helper único |
| Journey | Copy y5pasos con fotos3:4 |
| Dashboard | Copy,4beneficios, medio4:5, badge/icono y CTA |
| Testimonials | Título; reseñas del slice Testimonials |
| FAQ | Título y grupo; preguntas del slice FAQ |
| Cierre | Copy, contacto/fallback Settings, foto y CTA #worth |
| SEO | Acceso dedicado en toolbar, title/description por idioma, OG compartida |

Conservar anclas, navegación, destinos fijos, campos ocultos e integraciones ajenas.
El contacto del Hero y los formularios globales de Settings conservan su implementación;
el primer placement de este arco es sólo la tarjeta de estimación del Hero.
No convertir Buildings, Guest, About ni otras páginas.

## Persistencia e idiomas de Owners

Reusar el motor cerrado en ADR0040: JSON por idioma con draft/published y CAS por idioma.
Guardar borrador no publica. Publicar sólo afecta al idioma seleccionado y elimina únicamente
su JSON draft. La preview usa draft guardado si existe, en otro caso published. ES sigue en
trabajo cuando se publica EN; sin aprobar/revisar/stale ni publicación conjunta. Los borradores
son persistentes en DB. Estructura y medios conservan autoría EN con snapshot por idioma para
que la publicación sea independiente. El pipeline de estados legacy no gobierna la publicación.

Toda lista que se pueda mover necesita identidad estable, aunque tenga tamaño fijo:
stats, why.benefits, services.benefits, plans.tiers, plans.tiers[].features,
plans.helpers, journey.steps y dashboard.benefits. Las features conservan también la
identidad de su plan padre: mover un plan no debe reasignar sus traducciones internas.
Preservar claves legacy numéricas, usar @UUID para nuevas identidades y retirar IDs
por lista/padre. Mantener fotos fallback asociadas al paso original al reordenar Journey.
No cambiar semánticas Home por generalizar: extraer helpers sólo cuando los dos adaptadores
los necesiten, con pruebas de sus consumidores.

Validar source persistida antes de editar, referencias/MIME de medios antes de guardar,
conflictos, IDs y límites actuales. Hero/Journey/cierre/OG son imagen; Services y Dashboard
conservan imagen/WebP animado/MP4/WebM/Lottie y sus dimensiones/reduced motion.

## Trabajo real adicional de Forms

Forms actual sólo tiene definiciones draft/archived y tests staff. No hay releases,
placement público, renderer de envío anónimo ni submissions públicos. testForm exige
staff y no se transforma en endpoint público. No dar por completado Owners con un selector
decorativo o una prueba staff dentro de la página.

Propuesta para el ADR de ejecución:

1. **Releases inmutables de Forms.** Publicación staff de una revisión válida; snapshot
   de estructura, copy/idiomas guardados y fallback, recipient y reply-to. Cambiar un draft
   no cambia un release ya utilizado. Archivo impide nuevas publicaciones/selecciones;
   no rompe releases ya vinculados. Pages guarda formId + releaseId, compartidos entre idiomas.
2. **Placement owners.hero_estimate.** Validar compatibilidad de la versión elegida con
   la tarjeta/wizard existente. Reusar layout, controles y estilo de OwnerEstimateForm,
   parametrizados por blueprint; conservar una/dos columnas y pasos admitidos. La elegibilidad
   no se decide sólo por el nombre de la plantilla: validar datos, contacto/consentimiento y
   configuración de la versión. Mostrar el motivo si un formulario no sirve en este slot.
3. **Copy y aspecto.** El blueprint actual no contiene badge ni nota de pie separados;
   extender copy opcionalmente para conservar esos elementos, con defaults compatibles,
   edición y traducción en Forms. No recodificar esos textos en Pages tras vincular un release.
   Crear una acción staff para preparar un formulario a partir del wizard actual, copiando
   sus textos/campos/opciones/traducciones a IDs estables; mostrarlo antes de publicar/elegir.
4. **Renderer y captura públicos.** Leer releases por contrato y caché/ISR. Endpoint dedicado
   resuelve slot/release/destinatario en servidor, valida todos los pasos contra el snapshot,
   rechaza claves desconocidas y conserva IDs/labels exactos de opciones/consentimientos.
   Validación previa al avanzar, volver conserva valores, éxito sólo tras captura confirmada.
5. **Submissions y Leads.** Captura pública separada de form_test_submission. Persistir
   release/idioma/blueprint/valores/consentimientos/contexto y resultado de notificación.
   Nuevo contrato server-only de Leads para captura genérica de Forms e inbox con resumen
   legible; no forzar estos datos por la unión legacy submitLead. La validación earnings_estimate
   actual no incluye nombre/email/teléfono y no admite una definición arbitraria: mapear por
   IDs/roles explícitos, nunca por label/posición. Cerrar en el ADR el contrato atómico entre
   captura Forms y Leads (CTEs propiedad de cada slice o protocolo idempotente persistido);
   no dejar leads parciales o duplicados sin un estado/reintento definido.
6. **Envío y protección del endpoint.** Resend por core/email ya existente; datos/destinatario
   del release, sin credenciales en cliente. Capturar antes de notificar; distinguir accepted,
   logged, skipped y failed sin prometer entrega final. Idempotencia de captura, payload acotado,
   honeypot, verificación de origen y límite persistente por cliente/placement. QA sólo consola
   o transporte ficticio, sin envíos reales. Política de retención de submissions/IP y permisos
   del inbox se documentan antes de habilitar captura pública.

Conservar JSON/copy históricos de earnings_form y sus traducciones. Sin binding válido,
la fila antigua conserva su renderer; nunca presentar una tarjeta vacía al desplegar código.
Al seleccionar una versión publicada, la tarjeta pasa al renderer Forms y no mezcla overrides
legacy. En QA se debe demostrar una vinculación real que reemplaza el wizard; una conversión
de contenido en producción requerirá autorización independiente.

## Secuencia de ejecución propuesta

**A. Contratos y base.** Nueva rama/worktree Owners desde el Home final, checkout limpio,
base exacta y entorno aislado. Orquestador cierra ADR de releases/placement/captura/Leads,
esquemas/migraciones aditivas, fuentes de copy y ownership antes de consumidores.
Publicar contratos por contract.ts. No modificar migraciones existentes ni copiar credenciales.

**B. Forms público para el slot.** Dos implementadores con archivos disjuntos: backend
releases/captura y frontend renderer/controles. Orquestador posee contratos, migraciones,
registro DB, mensajes compartidos y puente Leads. Integrar y comprobar en aislado antes
que el adaptador dependa de ello. No extender placements a otras páginas.

**C. Adaptador Owners.** Si se ejecuta como arco individual, dos implementadores con archivos disjuntos: modelo/persistencia/
i18n/identidades y adaptador/inspector/instrumentación del renderer. Reusar shell y bridge;
extraer controles comunes puntuales en vez de copiar HomeContextualEditor entero.
Orquestador integra rutas y registros. En la tanda posterior propuesta, un único agente
puede poseer este adaptador ya desacoplado según page-editors-parallel-plan.md.
Establecer archivos exactos en spec de ejecución,
con worktree/branch/base por escritor y un único dueño por archivo compartido.

**D. QA independiente y cierre.** Un pase normal agrupado desktop/mobile, seguido sólo de
confirmación de fallos corregidos. Documentar commits de código/QA/handoff y limitaciones.
No empezar otras páginas durante este arco.

Candidatos de archivos (inventario para preparar write sets, no permiso para editar hoy):
Pages schemas/owners, owners-content, admin/owners-{queries,save,actions,contextual},
admin/ui/owners-contextual-editor, ui/owners-page, server/owners-translations, tests;
Forms types/validation/schema/contract, releases/runtime/submission y componentes públicos;
Leads contract/captura/inbox; raíz rutas/admin/preview, contratos compartidos, mensajes,
ADRs/migraciones/registro y docs. Cualquier cambio kernel se registra y pertenece a raíz.

## Criterios de aceptación y comprobaciones

- Todos los campos actuales tienen acceso y límites correctos; las secciones ocultas
  siguen en el índice. SEO únicamente en toolbar con idioma y panel derecho completo.
- Cambios de texto/botón/medio guardan draft sin tocar público; Publicar revalida sólo /<idioma>/owners.
- Una lista simple y planes/features anidados conservan identidad/traducciones al mover.
- ES: draft persistente y cambios locales conservados al publicar EN; JSON ES borrado sólo
  al publicar ES. Claves PT/FR completas sin repetir la batería por idioma. Sin aprobación.
- Elegir un release de Forms reemplaza el wizard de Owners preservando tarjeta/placement.
  Edit form lleva al constructor real; modificar draft no altera el release publicado.
- Envío anónimo válido registra snapshot/lead/consentimiento y resultado console; un error
  de validación no captura, un reintento no duplica captura, un fallo de correo no pierde lead.
- Preview staff/noindex con renderer compartido; navegación/submits bloqueados tanto iframe
  como ventana directa; ninguna anotación o bridge JS en público. Home sigue funcionando.
- Node22/pnpm: typecheck, lint, tests explícitos afectados y build; db:check por nuevas
  migraciones. Revisar boundaries, ISR/SEO e idiomas. No usar placeholders como evidencia.

Entorno propuesto: nuevo ownerscontextualqa, preview3066 y storage9066; verificar puertos
antes de asignar DB/proxy. Sembrar Owners/Form/Leads sintéticos; no reutilizar/modificar
Home3065 ni Forms/concepto/otros entornos. QA y operaciones sandbox seguras del proyecto
ya autorizadas automáticamente; Neon producción/GitHub requieren autorización aparte.
No main, push, despliegue ni envíos reales como efecto de este plan.

## Handoff

Leer owners-contextual-editor-handoff.md al iniciar el siguiente contexto. No hay cambios
Owners/Forms/Leads, migraciones ni bases de datos realizados al escribir este plan.
La implementación requerirá el siguiente encargo del usuario, después de cerrar Home drafts.
El presupuesto de tests se hereda del plan acotado y de la propuesta de tanda paralela;
no repetir todo el motor por adaptar Owners.
