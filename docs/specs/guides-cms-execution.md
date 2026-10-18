# CMS de guías individuales — spec y plan de ejecución

Fecha: 2026-10-18. Estado: ejecución autorizada por el usuario; G0/G1 en curso.
Evidencia: [auditoría](guides-cms-audit.md).
Brief: [guides-cms-audit-brief.md](guides-cms-audit-brief.md).
Procedimiento: [multi-agent-workflow.md](../multi-agent-workflow.md).

## Baseline, alcance y propietarios de esta auditoría

- Checkout: `/Users/maxi/Documents/claude-workspace/central-hill`, rama `main`.
- Base observada: `8a61bd782078c721abfea42cf49ed41aa77db804`; status inicial limpio.
- Entrega actual: inventario, auditoría, spec y plan; únicamente documentación.
- Orquestador: único escritor de `docs/specs/guides-cms-audit.md`, este archivo y
  actualización de estado de `docs/specs/guides-cms-audit-brief.md`.
- Agentes `model_inventory`, `published_variants`, `editor_ux`: solo lectura en el mismo
  checkout; verifican cwd/rama/HEAD/status. Sin worktrees escritores ni delegación anidada.
- Contratos por estudiar: Guides, Geography, Pages, Backoffice, Settings, i18n/media/SEO.
- Preservar previews 3059 y 3060, sus DB/media y worktrees. Las dos guías sintéticas de
  guidespageqa no son inventario real. No leer/copiar `.env.local`, ejecutar seeds,
  migraciones, builds con DB remota, escrituras de contenido, push ni despliegue.
- Verificación de esta entrega: cruzar rutas publicadas, código y seeds; comprobar enlaces
  documentales, matriz y diff/paths. No se afirma QA funcional ni checks de implementación.

## Trabajo de agentes

| Agente | Resultado esperado | Escrituras |
|---|---|---|
| model_inventory | Todas las guías/árboles del seed, campos, persistencia, traducciones | Ninguna |
| published_variants | Inventario publicado y contraste con composición/SEO reales | Ninguna |
| editor_ux | Admin existente, módulos, contratos, UX y reparto futuro | Ninguna |

## Decisión de producto propuesta

Editar el árbol existente **guía → secciones → lugares**, con módulos independientes
por sección. Conservar `template` como categoría editorial/icono; conservar `layout`
legacy sin exponerlo como selector visual: el render actual no ramifica por ninguno.
No crear ocho formularios, ni un constructor de bloques arbitrarios. La futura
implementación requiere una nueva instrucción del usuario; este documento no la inicia.

Alcance v1: listado `/admin/guides`, alta `/admin/guides/new`, edición
`/admin/guides/[id]`, CRUD y orden de secciones/lugares, publicación de guía,
SEO, fotos y CTA por sección, datos prácticos de lugares y visibilidad reversible.
Los lugares pertenecen a una sección; no son catálogo global ni relación con Buildings.
Las ciudades se gestionan en Geography; el CMS solo las referencia.

No incluye vídeo de detalle (no existe soporte ni evidencia de contenido actual), mapas
embebidos, nuevo JSON-LD turístico, preview de borradores, duplicación de guías,
drag-and-drop obligatorio, editor HTML, traducción nueva ni redirecciones de slugs.
El vídeo del hero del **índice** sigue en Pages y no se transfiere al detalle.

## Fuentes únicas y composición

| Contenido | Propietario / comportamiento v1 |
|---|---|
| Título, intro, ciudad, categoría, estado, posición, hero, OG y SEO | Guides, entidad guía |
| Título, prosa, imagen, consejo, lugares y CTA | Guides, entidad sección |
| Nombre/descripción, categoría, dirección, teléfono, precio €/€€/€€€, horario, coordenadas, web/reserva, foto | Guides, entidad lugar |
| `guide_aside` alojamiento, foto y botón hacia Buildings | Pages → Guides; enlace contextual al editor, sin copia ni override |
| Iconos de categoría, ubicación, consejo y TOC | Settings → Site icons; sin override por guía |
| Labels Local tip, Directions, Website, Book, Hours, TOC y More guides | Mensajes `guides.*` EN/PT/ES/FR; sin duplicarlos como textos por guía |
| Nombre/slugs/publicación de ciudad | Geography por contrato |
| Alt de fotos | Entidad media y traducciones del kernel; mostrar fallback actual, no inventar un campo local divergente |

Orden público fijo: cabecera → mosaico → secciones → otras guías. Dentro de cada
sección: prosa → imagen 16:9 → consejo → lugares → CTA. El editor sí permite
ordenar las secciones y los lugares con botones subir/bajar accesibles por teclado.
El mosaico conserva deduplicación por URL y máximo de cinco imágenes; no añade fotos
de lugares. Las tarjetas de guía usan hero, no un cover duplicado.

Horario, web y reserva ya se almacenan/resuelven pero hoy no se pintan: v1 los
mostrará cuando existan en la tarjeta de lugar, con labels del namespace existente.
Teléfono y Directions conservan su comportamiento. No deducir reservas a partir del
teléfono ni convertir precio orientativo en importe de compra.

## Contratos que debe estabilizar el orquestador antes de A/B

Nombres siguientes son contrato **propuesto**, no exports existentes.

### Presentación de sección

Una nueva columna nullable `guide_section.presentation` JSONB (migración aditiva,
número por reservar al arrancar; no modificar 0019/0020). Nuevo módulo puro
`src/slices/guides/presentation.ts`:

```ts
type GuideModuleKey = "body" | "image" | "local_tip" | "places" | "cta";
type GuideSectionPresentation = {
  version: 1;
  enabled?: boolean;
  modules?: Partial<Record<GuideModuleKey, boolean>>;
};
```

Ausente/null/`{version:1}` conserva exactamente el render histórico. Flag omitido
significa mostrar si hay contenido; `false` oculta sin borrar; `true` exige mínimos
de origen al guardar el módulo (body/tip no vacío, imagen existente image/*,
places con al menos un lugar válido, CTA con label+URL). Estos mínimos se exigen
en secciones habilitadas de guías publicadas; en draft o sección deshabilitada se
pueden preparar datos incompletos. Sección habilitada de guía published requiere
título y al menos un módulo visible con contenido; guía published requiere al menos
una sección visible válida. Ocultar la sección conserva todo el árbol.

El parser público tolera configuración inválida usando fallback histórico; admin
detecta formato/versiones desconocidos y bloquea sobrescritura silenciosa. El editor
siempre recibe datos completos. Ocultar nunca manda strings vacíos a traducciones.

Filtrar **antes** de construir TOC, numeración, anchors, contadores y mosaico.
Una imagen desactivada no se filtra al mosaico. Sección oculta/módulo places desactivado
no participan en Top Recommendations; los demás módulos no alteran selección de
lugares. No hay ocultación individual de lugares en v1. Mantener regla primer candidato por restaurant/viewpoint/beach y scope del
índice; no introducir featured flag. Query y helper deben compartir estas reglas.

### Admin, acciones y resultados

Tipos compartidos puros nuevos en `admin/model.ts`, validadores en
`admin/validation.ts`; el UI no importa módulos server-only. Bundle de edición:
guía fuente EN, slugs existentes por locale, todos los hijos con IDs/posiciones y
presentation sin filtrar, previews, ciudades `{id,name,slug,status}`, advertencias
de contenido inválido y URL publicada calculada solo cuando sea resoluble.

Acciones propuestas (todas `requireStaff`, admin/editor, validación en servidor):

```text
listGuidesAdmin({cityId?,status?,search?})
getGuideForEdit(id)
saveGuidePage(input)
saveGuideSection(pageId,input)
saveGuidePlace(pageId,sectionId,input)
reorderGuideSections(pageId,orderedIds)
reorderGuidePlaces(pageId,sectionId,orderedIds)
deleteGuidePlace(pageId,sectionId,id)
deleteGuideSection(pageId,id)
```

Cada save devuelve `{ok:true,id}` o `{ok:false,error,fieldErrors?}`; errores
cerrados: `validation`, `not_found`, `ownership`, `slug_conflict`,
`invalid_stored_content`, `partial_write`, `server`. Un error de auth conserva
la semántica redirect del kernel. No poner un éxito global tras guardado parcial.
No borrar guía en v1: archivar conserva árbol y traducciones. Eliminar sección/lugar
es acción explícita confirmada con conteo de hijos/traducciones; no borra assets R2.

`partial_write` añade `{entityIds: string[], completedSteps: string[],
failedStep: string, reloadRequired: true}`: solo pasos confirmados. Si la red deja
resultado incierto, mostrar estado desconocido y recargar antes de afirmar éxito.

Contrato de payload propuesto:

```ts
type Mutation<Columns, Source> = {
  id: string; // UUID estable obligatorio, incluso en altas
  create?: boolean;
  changes: Partial<Columns>;
  source: Partial<Source>;
};
```

| Input | Whitelist `changes` | Whitelist `source` |
|---|---|---|
| Página | city_id, template, status, position, hero_media_id, og_image_media_id | title, intro, meta_title, meta_description |
| Sección | position, header_media_id, cta_url, presentation | title, body, local_tip, cta_label |
| Lugar | position, category, address, phone, price_tier, opening_hours, latitude, longitude, website_url, booking_url, media_id | name, description |

Page añade `slugs?: Partial<Record<Locale,string>>` fuera de changes; seam de slugs
y `guide_page.slug` EN deben concordar. No admitir padres en changes: pageId/sectionId
son argumentos contrastados con DB. Objetos estrictos, omisión conserva, undefined
explícito inválido y null limpia campos opcionales. Cada patch mezcla con el estado
persistido antes de validar; source vacío normaliza null solo si el campo es opcional.
Crear requiere city/template/title y `slugs.en` en página, title en sección, name en lugar;
defaults: draft, position0, nulls y layout=standard solo en nuevas secciones.
`layout` existente no se modifica. Aplicar límites actuales de validation.ts y
no aceptar títulos/nombres vacíos aunque el validador histórico no imponga min.

Guardar por entidad, con feedback propio; primero crear guía borrador, luego hijos.
Un indicador visible informa qué sección/lugar tiene cambios pendientes. No ofrecer
“Guardar todo” si no existe garantía real. Bloquear publicación mientras haya cambios
locales sin guardar y validar árbol persistido completo al publicar.
Guardar en guía ya published modifica contenido vivo: no hay revisión draft paralela.
Indicarlo en botones/ayuda; pasar a draft retira la página. Toda mutación de published
(incluidas bajas, orden y flags) valida el árbol efectivo resultante antes de escribir.
Crear nuevas secciones incompletas deshabilitadas, completar hijos y activar después.
Rechazar borrar último lugar si deja places=true sin mínimos, o desactivar último
módulo/sección visible; señalar cómo resolver el conflicto.

IDs UUID nuevos preasignados y retenidos durante reintentos; existentes se actualizan
in situ. Reintento de creación con el mismo ID no duplica ni toma un registro de otro
padre. Sección/lugar nunca se recrean al guardar. Ausencia de un hijo no significa
eliminarlo. Reorder exige conjunto exacto sin duplicados del padre, asigna posiciones
contiguas; solo ejecutarlo tras guardar nuevos hijos y resolver bajas pendientes.
No trasladar entidades entre guías en v1. Ordenar con desempate por ID para lectura
determinista, incluido Top Recommendations.

Neon HTTP y los seams actuales usan sentencias secuenciales, **sin atomicidad global**.
Validar todas las refs/ownership/slugs/media antes de escribir. Distinguir pasos ya
persistidos si falla un seam, retener formulario e IDs, permitir recargar/reintentar
sin duplicar y revalidar lo que pudo cambiar aun tras error parcial. No prometer
rollback. Pruebas con fallos intermedios son obligatorias. Cambio a transacciones,
control optimista fuerte o borradores de revisión requeriría ADR de kernel separado.
Dos editores simultáneos siguen la limitación actual: última escritura prevalece;
documentarla, sin fingir bloqueo de concurrencia.

`setSourceContent` solo recibe claves explícitas del formulario de esa entidad;
vaciar una clave implica borrar sus traducciones en todos los idiomas y necesita
feedback claro. No mandar `undefined` de campos omitidos ni tocar hijos al guardar
el padre. Preservar slugs PT/ES/FR distintos en ediciones ordinarias; crear slugs de
las cuatro locales en altas (mismo slug inicial). Cambio de slug EN es explícito y
avisa de que no hay redirect; no sobreescribir automáticamente los demás.
La unicidad de slugs es global por tipo+locale, no por ciudad. Comprobar conflictos
antes de la primera escritura y manejar la carrera del constraint.

### Contratos ajenos e invalidación

- Geography: añadir por su `contract.ts` un lector staff-gated
  `listGuideCityOptions()` con todas las ciudades/status; implementación dentro de
  Geography. Validar existencia en cada save; no publicar guía de ciudad no publicada.
  Mantener ciudad draft/archived seleccionada visible al editar, sin borrar referencia.
- Guides: exportar `guidesAdminScreens` y los entrypoints de pantalla por contrato
  para las nuevas rutas finas; incluir helper público `revalidateGuides()` para
  consumidores autorizados de servidor.
- Translation: en `admin/actions.ts`, para `guide_page`, `guide_section`, `guide_place`
  invalidar `guide-list` a través de Guides contract además de tags genéricos.
  No importar tablas internas ni buscar padre: tag global actual basta.
- Cada cambio de guía/hijo/orden/estado invalida `guide-list` y rutas admin afectadas;
  las queries conservan `city-list`. Pages y Settings siguen sus tags existentes.
- Fuente [T] EN y targets aprobados mediante seams existentes. Enlace a revisión por
  entidad, fallback EN; no afirmar que LLM genera traducciones si proveedor no verificado.
- SEO mantiene canonical localizado, alternates válidos ciudad+guía, fallback OG→hero,
  BreadcrumbList y sitemap de publicados; ciudad incorrecta devuelve 404. Revisar
  `x-default` actual sin prefijo EN como observación existente, no corregir SEO global
  incidentalmente en esta tarea.

## Validación y UX requerida

Formulario sobre primitivas Backoffice, sin generar nuevos componentes del kernel.
Listado con ciudad/categoría/estado/posición, acciones Editar/Ver publicada, filtros
y vacío útil. Cabecera del editor con título, badge y estado de guardado; tarjetas
General, SEO y secciones plegables con resumen de lugares/fotos/estado.
Campos internos de módulos apagados colapsan y retienen estado y persistencia.
Guardar sección/lugar independiente, errores junto al campo y resumen que abre/enfoca
el bloque afectado; toast de éxito tras persistencia real. Identificadores de error
por ID estable, no solo índice susceptible a reorder.

Validar longitudes actuales del slice, UUIDs, enums y enteros de posición; body es
texto por párrafos, no HTML/Markdown. CTA completa o ninguna; URL absoluta HTTP(S)
en CTA/web/reserva, rechazar javascript/data/file. Coordenadas ambas o ninguna,
rango lat/lng; teléfono sin introducir enlaces vacíos. Media existente y MIME imagen
en hero/OG/imagen sección/foto lugar, también con UUID enviado directamente a acción.
Limpiar foto desasocia; no borra medio global. Imágenes 16:9 sección, 4:3 lugar,
hero apto para mosaico; hints de tamaño y tratamiento de alt acordes al picker real.

Integrar `useMediaQueue`/`isPreparing` y bloqueo de submit por las dos vías (botón y
handler); ejecutar `await queue.flush()` antes de cada save con medios, fuera de
`startTransition`, respetando flujo diferido de upload actual. No perder formulario al fallar
subida o acción. Guardar contenidos ocultos y restituirlos tras reload/activar.
Accesibilidad: labels, errores asociados, aria-expanded, foco tras alta/baja/error,
subir/bajar por teclado, confirmación explícita de bajas, controles táctiles cómodos,
sin overflow a 390px. Preservar estilos admin actuales; no rediseñar sitio público.

## Reparto futuro y gates (todavía NO iniciado)

G0: revalidar HEAD/status y cambios ajenos; savepoint estable; Node22/pnpm10.8.0;
reservar migración siguiente libre; preparar entorno **nuevo** aislado DB/rol/proxy,
bucket y staff de prueba. No reutilizar ni cambiar previews 3059/3060. Registrar
identidades sin secretos, puertos/PID/propietario y comandos exactos antes de usarlo.
No hay worktrees/ramas escritoras ni candidato implementado en esta entrega.

G1: el orquestador implementa y prueba contratos compartidos y los captura antes de
crear ramas A/B desde el mismo commit. G1 compila sin pantallas futuras: los exports
de entrypoints UI de A y la incorporación a rutas/nav se hacen en integración, sin
exportar archivos todavía inexistentes. La implementación de contratos también exige
autorización posterior. Si un contrato cambia después, verificar ambos consumidores.

| Responsable | Write set exacto propuesto |
|---|---|
| Orquestador G1/integración | `src/slices/guides/{schema.ts,validation.ts,contract.ts,presentation.ts,README.md}`, `src/slices/guides/admin/{model.ts,validation.ts,queries.ts,actions.ts,media-validation.ts,screens.ts}`, `src/slices/guides/server/publish.ts`, `src/slices/geography/contract.ts`, nuevo `src/slices/geography/server/guide-city-options.ts`, `src/slices/translation/admin/actions.ts`, `src/app/(admin)/admin/(panel)/layout.tsx`, `messages/{en,pt,es,fr}.json`, `docs/data-model.md`, documentos de esta tarea, migración SQL/snapshot/journal de número reservado y pruebas contractuales nuevas `src/slices/guides/tests/{admin-validation,admin-actions,media-validation,presentation,city-options,translation-revalidation}.test.ts` |
| Implementador A: editor admin | Nuevos `src/slices/guides/admin/ui/{guide-list,guide-editor,guide-section-editor,guide-place-editor}.tsx`, nuevos `src/app/(admin)/admin/(panel)/guides/page.tsx`, `guides/new/page.tsx`, `guides/[id]/page.tsx`; nuevas pruebas puras `src/slices/guides/tests/editor-model.test.ts` y helper puro `src/slices/guides/admin/ui/editor-model.ts` |
| Implementador B: render/queries | `src/slices/guides/server/queries.ts`, `src/slices/guides/ui/guide-page.tsx`, `src/slices/guides/ui/components/recommendation-card.tsx`, `src/slices/guides/tests/{format,guides,recommendation-scope,listing-presentation}.test.ts`, nueva `src/slices/guides/tests/detail-presentation.test.ts` |
| QA independiente tras integrar | Solo lectura de código/candidato; escritor único de `docs/specs/guides-cms-qa.md` y evidencia nueva en `/private/tmp/central-hill-guides-cms-qa/`; fixtures sobre DB/media aislados autorizados en G0 |

No ampliar directorios enteros por comodidad. Ningún implementador edita mensajes,
contrato, migración, app layout ni archivos del otro. Si se requiere helper nuevo,
registrar el path y propietario aquí antes. Orquestador es único integrador.

Worktrees propuestos, sujetos a disponibilidad en G0: integración
`/private/tmp/central-hill-guides-cms-integration` / `guides-cms/integration`, A
`/private/tmp/central-hill-guides-cms-admin` / `guides-cms/admin`, B
`/private/tmp/central-hill-guides-cms-public` / `guides-cms/public`.
Registrar base contractual, hashes, cwd/rama/status verificados y runtime de cada uno.
No copiar `.env.local` remoto a ningún worktree. Mantener worktrees tras handoff.

G2: integrar A/B, revisión de límites y checks reales. G3: QA independiente sobre el
candidato integrado exacto; corregir por propietario y retestar lo afectado. G4:
entrega local según nueva autorización; commits/integración a main para Guides **no**
se heredan de la autorización histórica de Services. Sin push/despliegue/producción.

## Aceptación y verificación futura

1. Las ocho guías y sus 59 secciones/86 lugares se pueden representar sin pérdida;
   IDs, textos, fotos, tips y slugs localizados existentes sobreviven a guardado.
   Fixtures sintéticas cubren además standard, CTA, custom, sin imagen, sin lugares,
   duplicados de títulos y otras ciudades; no ejecutar seed real sobre producción.
2. CRUD por entidad, recarga, reorder, archivo y publicación verificables. Bajas
   explícitas limpian traducciones hijas por seam sin borrar assets compartidos.
   ID de otro padre, duplicados y reorderedIds incompletos se rechazan sin cambios.
3. Cinco módulos independientes y ocultación de sección conservan valores al guardar,
   recargar y reactivar. TOC/anchors/contadores/mosaico/Top Recommendations coherentes;
   config inválida/version desconocida no se destruye al abrir/guardar.
4. Horarios/web/reserva aparecen solo con contenido; teléfono/directions/€ conservados;
   CTA incompleta o esquemas peligrosos rechazados en servidor. MIME y existencia de
   media comprobados aun con payload manipulado; subida ocupada bloquea submit.
5. Página/hijo EN guarda usando seams; aprobar/resetear PT/ES/FR actualiza SSR de
   detalle e índice sin reinicio. Ocultar no borra traducciones; borrar texto sí es
   explícito. Conservar slugs PT/ES/FR distintos tras cambiar título/slug EN.
6. Ningún staff → denegado en acciones y lectores admin; admin/editor autorizados.
   Ciudad inexistente/no publicada, borrador y archive no se publican por accidente.
7. Forzar fallo intermedio de persistencia/upload: no falso éxito, no duplicados en
   reintento ni pérdida de formulario. Documentar cambios parciales reales.
8. Browser desktop 1440px y móvil 390px, teclado y save/reload reales en DB/media
   aislados; comprobar EN/PT/ES/FR públicos, SEO/404/canonical/hreflang/OG/sitemap y
   caches de índice, detalle, related y Pages/Settings compartidos.
9. Migración desde schema previo (incluidas 0019/0020) y DB vacía, con datos existentes
   preservados, presentation null y paridad pública antes/después. Source y target
   guardados con staff de ID UUID y textual conforme ADR0036. No repetir el error
   de atribución histórica ni omitir migraciones prerequisito en QA aislada.

Comandos previstos con Node22 en PATH y entorno aislado verificado (no ejecutados
como parte de la auditoría documental):

```sh
pnpm typecheck
pnpm lint
pnpm exec tsx --test src/slices/guides/tests/guides.test.ts src/slices/guides/tests/format.test.ts src/slices/guides/tests/listing-presentation.test.ts src/slices/guides/tests/recommendation-scope.test.ts src/slices/guides/tests/admin-validation.test.ts src/slices/guides/tests/admin-actions.test.ts src/slices/guides/tests/media-validation.test.ts src/slices/guides/tests/presentation.test.ts src/slices/guides/tests/city-options.test.ts src/slices/guides/tests/translation-revalidation.test.ts src/slices/guides/tests/editor-model.test.ts src/slices/guides/tests/detail-presentation.test.ts
pnpm exec tsx --test src/slices/translation/tests/translation.test.ts src/slices/pages/tests/guides-content.test.ts src/slices/pages/tests/guides-editor.test.ts src/slices/pages/tests/guides-media-validation.test.ts src/slices/pages/tests/guides-defaults.test.ts src/slices/backoffice/tests/backoffice.test.ts
pnpm db:check
pnpm build
git diff --check
```

En G0 confirmar qué suites requieren tsconfig específico y registrar comandos reales,
salidas, commit y evidencia browser en el informe QA. `pnpm test`/`boundary:check`
son placeholders; revisar límites de imports manualmente. No aprobar QA si falta
save/reload, entorno aislado o checks requeridos. Tests futuros deben verificar
comportamiento/riesgos; no replicar mecánicamente implementación.

## Estado de la entrega documental

Auditoría cruzada terminada con tres agentes de lectura. Revisión independiente de
documentos por `editor_ux`: cinco hallazgos corregidos y cierre confirmado, sin
nuevos bloqueantes documentales en esos puntos; no equivale a QA funcional.
Comprobación Python de enlaces relativos existentes, espacios finales y newline
final en los tres documentos: exit0. Recuento del apéndice: 59 secciones y 86 lugares,
exit0. `git diff --check`: exit0. Base revisada `8a61bd7`; sin candidato de código.
Cambios de esta entrega: este archivo nuevo, `guides-cms-audit.md` nuevo y estado de
`guides-cms-audit-brief.md`. Sin modificaciones de aplicación, dependencias ni entornos.
G0–G4 de implementación permanecen pendientes de la siguiente instrucción del usuario.

## Arranque autorizado — 2026-10-18

Usuario autorizó «si estás listo lanzas» tras explicar G0/G1. Se autoriza trabajo local
en ramas de tarea, contratos, implementación y QA; sin push ni despliegue.
Auditoría capturada en `6a3c1ce`; savepoint de arranque
`savepoint/pre-guides-cms-implementation-2026-10-18`. El tag anterior
`savepoint/pre-guides-cms-2026-10-18` ya existía y se conservó intacto.
Integración: `/private/tmp/central-hill-guides-cms-integration`, rama `guides-cms/integration`,
base `6a3c1ce`. Sin .env.local; dependencias compartidas por symlink node_modules.
Entorno nuevo: DB/rol guidescmsqa, contenedor central-hill-guides-cms-db PostgreSQL17,
host5568; proxy central-hill-guides-cms-proxy host4468, red central-hill-guides-cms-qa.
S3rver9061, bucketguidescmsqa, PID71268/session76507; futura app3061.
Env ficticio `/private/tmp/central-hill-guides-cms-qa/env.sh`; preload solo transporte local.
Migraciones0000..0020 aplicadas en DB nueva, exit0; reservar0021 para presentation.
Previews3059/3060, contenedores y worktrees anteriores conservados.

### G0/G1 evidencia y contrato de consumidores

- G0 completado: identidad current_database/current_user=guidescmsqa comprobada por Neon
  HTTP local. Fixtures sintéticas 4ciudades/2guías/6lugares/5imágenes, staff ficticio
  guidescmsqa@example.test (ID textual) y cuenta local; no credenciales reales.
- G1: presentación, tipos `admin/model.ts`, patches strict `admin/validation.ts`,
  acciones por entidad, query bundle/source, media guards y lector Geography disponibles.
  Payload, nombres y bundles de esta spec se reflejan en esos módulos; consumidores
  importan tipos puros, acciones desde admin/actions y lecturas desde admin/queries.
- La columna 0021 se generó con drizzle-kit; SQL aditiva aplicada a la DB aislada y
  journal registrado. Dos secciones existentes siguen con presentation=null (2/2).
  `pnpm db:migrate` falló exit1 por transporte websocket del CLI contra entorno local;
  se aplicó el SQL generado con psql, exit0, sin cambiar la migración.
- Checks G1 Node22: typecheck exit0 (tras corregir blurhash del fixture nuevo);
  lint exit0, solo cinco warnings históricos; 41 tests Guides/contratos exit0;
  db:check exit0 (warning histórico0008 sin breakpoints). Build integrado pendiente
  de consumidores y QA. No afirmar verificación browser todavía.
- `node_modules` es un symlink local no versionado a las dependencias del checkout
  principal; no forma parte del entregable. No se copiarán .env.local remotos.
- Write sets de A/B se mantienen. Rutas de A pueden importar sus componentes directos
  como composición del app shell; orquestador añadirá exports de pantalla por contrato
  tras integrar, sin exportar UI inexistente en G1. Todos los imports entre slices
  continúan exclusivamente por contract.ts.
