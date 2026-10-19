# Editor común Pages — plan de ejecución

2026-10-18. [Spec](page-editor-platform-spec.md) aprobada como planificación por el usuario;
**no código/agentes/worktrees/DB nuevos en este turno**. Reanudar tras clear y nueva orden.
Base anterior a estos documentos8de459a; código8da3519 y QA f8d7c91. Checkout documental
/private/tmp/central-hill-page-drafts-integration, rama page-drafts/integration, limpio al
comenzar. Registrar el HEAD documental final/status al iniciar implementación.

## Reglas de ejecución y entorno

Seguir CLAUDE.md y multi-agent-workflow.md. Raíz orquesta/posee compartidos, dos implementadores
con scopes disjuntos y worktrees separados, después QA independiente. **Máximo dos escritores**;
este plan no adopta la excepción anterior propuesta de tres agentes de página. Sin delegación
anidada. Raíz es único integrador; no blanket stage/reset/cleanup ni reescritura de historia.

Checkouts propuestos (NO crearlos hoy):

| Fase / rol | Rama | Checkout /private/tmp/ |
|---|---|---|
| Integración raíz | page-editors/integration | central-hill-page-editors-integration |
| Motor A | page-editors/engine | central-hill-page-editors-engine |
| Motor UI B | page-editors/ui | central-hill-page-editors-ui |
| Owners modelo A | page-editors/owners-model | central-hill-page-editors-owners-model |
| Owners renderer B | page-editors/owners-render | central-hill-page-editors-owners-render |
| Buildings A | page-editors/buildings | central-hill-page-editors-buildings |
| Real Estate B | page-editors/real-estate | central-hill-page-editors-real-estate |
| Guest A al liberar Buildings | page-editors/guest | central-hill-page-editors-guest |

Cada consumidor parte del contrato integrado de su fase, no de una rama todavía escribiéndose.
Verificar pwd/branch/HEAD/status antes de editar y pasar workdir explícito a todos los comandos.
Retener worktrees hasta capturar commits/archivos nuevos. Mantener branches de fases previas.

Nuevo entorno propuesto **pageeditorsqa**, preview3068/storage9068, Postgres5628/proxy4528,
network/containers central-hill-page-editors-qa / central-hill-page-editors-{db,proxy}.
Verificar puertos/nombres libres al ejecutar, registrar PID/owner reales y usar alternativa
libre si hay colisión. Ninguna provisión aún. No reutilizar DB pagedraftsqa ni .env productivos.
Fixtures pequeñas para las cinco páginas, staff sintético, edificios publicados de ejemplo
sólo para grid/portfolio, medios locales y correo consola; no submissions/envíos nuevos.

Preservar Home3065 y Home/live3067 (actual PID25042/session29066, pagedraftsqa5618/proxy4518/
storage9067, storage PID90200), Forms3064, demás previews y todos sus artefactos. La entrega
nueva ofrece los cuatro paths bajo3068, no sustituye3067 automáticamente. No main/push/deploy/
GitHub/Neon producción. QA/local sandbox seguro ya autorizado; no repetir preguntas funcionales.
Las restricciones reales del sandbox siguen aplicando.

Dependencias por worktree con lockfile existente/Node22. Evitar symlink node_modules fuera del
root al construir: Turbopack lo rechaza. Dependencias locales o instalación con lockfile; no
cambiar package/lockfile como efecto de bootstrap. Nunca compartir .next de builds escritores.

## Antes de delegar: registro de raíz y contratos

1. Confirmar base limpia, ownership/inventario actual y fixtures aisladas; actualizar este plan
   con commits, paths y comandos exactos si cambian desde la propuesta.
2. Aterrizar tipos por key, formato metadata de listas anidadas, interfaz de adaptador y
   descriptor UI serializable en commit root. Runtime Home coherente; no stubs en entrega.
3. Separar registry tipado/metadata cliente de registry servidor con schemas/funciones.
   Nombres de archivos nuevos abajo son decisiones de este plan, no archivos ya existentes.
4. Definir seam BuildingsListingRenderer en Buildings contract y props inyectables. Raíz
   implementa su seam mínima y la revisa con A antes del consumidor Buildings. No imports de
   internals ni copia de grid. Evitar inicialización circular Pages↔Buildings mediante
   renderer sólo al usarlo. No cambios kernel previstos; si aparece necesidad, ADR y scope
   root antes de editar, no expansión unilateral por implementadores.
5. Política de publicación toma publicPath/tag desde registry. Guards legacy y rutas sólo
   habilitan una key cuando su adaptador, renderer/getter/SEO y bloqueo legacy estén listos.

Propuesta de tipos (documentación, no implementación en este turno):
- EditorialPageKey = home|owners|buildings|real_estate|guest.
- PageContentMap y PageEnvelope<K>, PageLocaleEditorialModel<K>, PageEditorialResult<K>.
- PageEditorialAdapter<K> con hooks enumerados en la spec; validación de runtime por key.
- PageEditorialDescriptor serializable para PageContextualEditor común.
- getPageEditorialModel(key,locale), savePageDraft({key,locale,expectedRevision,...}),
  publishPageDraft({key,locale,expectedRevision}), getPageDraftPreview(key,locale),
  getPublishedPageLocale(key,locale), renderPageLivePreview(key,locale,payload).

Para listas nuevas, _list_ids continúa record<string,string[]> y _retired_ids mantiene scope
por lista/padre. Definición para hijos: plans.tiers.@<tierId>.features (o legacy parent ID
canónico equivalente), no índice mutable. Documentar encode/decode de legacy_N↔posición y
@UUID↔identidad en el contrato root, incluyendo listas de strings y rutas anidadas. Home
conserva su representación existente, sin reserializar published/draft al extraer el motor.

Refs live propuestas desde slots schema: Home6, Owners10, Buildings3, Real Estate5 (incluye
PDF), Guest16. Confirmar conteo contra schema en ejecución; deduplicar por UUID. Contenido
máx200000 caracteres como Home, snapshot total máx256KiB con metadata; mismo techo del bridge.
No aumentar límites globales sin evidencia de payload válido que no cabe. No bytes de archivos.

## Write sets: motor y UI comunes

Prefijos P=src/slices/pages/, B=src/slices/backoffice/. Todos los archivos listados tienen un
único dueño; nuevos también. Si se requiere otro, pedir scope a raíz y actualizar esta tabla.

| Dueño | Archivos exactos / responsabilidad |
|---|---|
| Raíz | P/schema.ts (tipos JSON, no DDL esperado), contract.ts, editorial-types.ts, editorial-adapter-types.ts nuevo, editorial-registry.ts, admin/editorial-ui-registry.ts nuevo; app/(admin)/admin/(panel)/pages/[key]/page.tsx; app/(admin)/admin/preview/home/page.tsx y nuevo app/(admin)/admin/preview/[key]/page.tsx; P/admin/editorial-preview-route.tsx nuevo para helper de rutas; P/server/queries.ts, metadata.ts, publish.ts, editorial-translation-policy.ts, translation-revalidation.ts; P/admin/actions.ts y home-actions.ts guards; Translation admin/actions.ts, queries.ts, ui/review.tsx y server/generate.ts sólo si exige policy generalizada; B/contract.ts/page-editor-types.ts; cuatro messages/*.json, README/docs/AGENTS y contratos de slices |
| Raíz seam Buildings | src/slices/buildings/contract.ts y ui/buildings-listing.tsx: renderer exportado/inyección/bindings privados de composición; A solicita cambios de seam, nunca escribe esos archivos en paralelo |
| A motor | P/admin/editorial-store.ts, editorial-queries.ts, editorial-actions.ts, editorial-validation.ts, live-preview-actions.tsx, live-preview-validation.ts; P/server/editorial-policy.ts, editorial-publication.ts, editorial-preview.ts; P/editorial-content.ts, editorial-identities.ts nuevo; P/adapters/home.ts nuevo; P/tests/page-locale-drafts.test.ts, page-locale-drafts.integration.test.ts, home-live-preview.test.ts, editorial-engine.test.ts nuevo, editorial-engine.integration.test.ts nuevo, editorial-test-environment.ts nuevo |
| B UI | P/admin/ui/page-contextual-editor.tsx nuevo y home-contextual-editor.tsx wrapper compatible; P/admin/home-contextual.ts, form-model.ts, ui/schema-fields.tsx, ui/about-list-editor.tsx (extensión compatible para políticas declaradas, conservar About legacy); B/ui/page-editor-shell.tsx, page-editor-bridge.ts, page-editor-preview-bridge.tsx, page-editor-live-preview.tsx sólo si la extracción lo necesita; B/tests/page-editor-bridge.test.ts si cambia el bridge |

A no copia Home a cuatro actions/stores. B no crea cuatro componentes con estado duplicado.
Helpers actuales home-content/home-media-validation y schemas Home son referencias read-only
iniciales; cualquier ajuste necesario se asigna una vez por raíz. Registro sólo Home habilitado
mientras se extrae. Los wrappers Home mantienen compatibility o delegan, nunca lógica divergente.
Los tests Home actualizados pueden importar nuevos helpers, pero no se reescriben para ocultar
regresiones. Guard DB de tests debe verificar el nuevo pageeditorsqa real antes de fixture writes,
con aislamiento explícito; no relajar a aceptar cualquier DATABASE_URL. Fixture Home pendiente
ES SEO y medios debe conservar requisitos de las pruebas existentes.

## Owners: segunda página real antes de ampliar la tanda

Después de integrar motor A/UI B, root fija el contrato de adapter y crea sus dos worktrees
Owners desde ese hash. Todos usan IDs/layouts acordados según OWNERS_CARD_IDS existente.

| Dueño | Write set |
|---|---|
| A modelo Owners | P/schemas/owners.ts, owners-content.ts nuevo, adapters/owners.ts nuevo, admin/owners-media-validation.ts nuevo, tests/owners-editorial-adapter.test.ts nuevo |
| B renderer Owners | P/ui/owners-page.tsx (PageResult inyectado y binding attrs privados), tests/owners-preview.test.ts sólo si se necesita un caso dentro del presupuesto; no nuevo estado React/acción/store Owners |
| Raíz | Registrar Owners, actualizar lector/SEO/ruta/policy, resolver schema/types/contrato compartido; helpers de anotación P/editorial-bindings.ts nuevo si evita duplicación sin tocar kernel |

A y B pueden trabajar en paralelo sólo con contrato de campos/binding IDs e identidades ya
registrado por raíz. Stats/planes/features/steps y fallbacks de Journey mantienen identidad;
formularios actuales y sus props se conservan. No selector Forms ni falsa captura nueva.
Si hacen falta props nuevas de core/ui para anotar hojas, priorizar wrapper sólo privado o
selección de sección + Element, como Home. Kernel seam nueva requiere ADR; no añadir wrappers
públicos por instrumentation. Todos los campos siguen disponibles en inspector/Element.

Integrar Owners y sus checks focales antes de que el siguiente adaptador dependa de cambios
al motor. Ajustar contrato común ahora si Owners revela una necesidad real; no duplicar engine.

## Resto de adaptadores desacoplados, máximo dos escritores

| Agente | Página / write set |
|---|---|
| A | Buildings: P/schemas/buildings.ts, buildings-content.ts nuevo, adapters/buildings.ts nuevo, admin/buildings-media-validation.ts nuevo, ui/components/buildings-sections.tsx, tests/buildings-editorial-adapter.test.ts nuevo |
| B | Real Estate: P/schemas/real-estate.ts, real-estate-content.ts nuevo, adapters/real-estate.ts nuevo, admin/real-estate-media-validation.ts nuevo, ui/real-estate-page.tsx, tests/real-estate-editorial-adapter.test.ts nuevo |
| A cuando Buildings entregue | Guest: P/schemas/guest.ts, guest-content.ts nuevo, adapters/guest.ts nuevo, admin/guest-media-validation.ts nuevo, ui/guest-page.tsx, tests/guest-editorial-adapter.test.ts nuevo |

Cada adapter incluye descriptor de sus secciones, políticas listas/identidad, media refs,
validación y render. Usa renderer público con inyección; ninguna variante JSX completa en
otro archivo. Raíz integra secuencialmente y posee registry/rutas/getters/SEO/messages/guards.
Buildings A edita secciones Pages, root controla wrapper del slice Buildings. Solicitudes
cross-scope se integran por raíz antes de consumidores, con contrato estable.
No agentes About/Forms/Leads/entidades. QA usa slot libre después de integración total.

## QA acotado: presupuesto y guion único

Máximo **10 casos automatizados nuevos** en toda esta conversión:
- A motor2: aislamiento página+idioma/CAS con revisión persistente real DB; bootstrap por key
  equivalente con pending target preservado (una fixture representativa, no matriz16casos).
- Owners2: cobertura/mapeo de campos/medios/hidden y caso planes+features/fallback Journey.
- Buildings2: cobertura/defaults y caso stats/listado con catálogo publicado fuera del snapshot.
- Real Estate2: cobertura de campos/listas y caso IDs anidados + PDF en slot propio.
- Guest2: cobertura y caso orden/IDs/textos+fotos fallback de teasers.
Los dos tests Owners los posee A; B propone su caso a A si hace falta y cuenta dentro de2.
No ocultar una matriz grande tras un wrapper. No tests de clases/JSX que reflejen implementación.

Se vuelven a correr una vez los tests Home afectados por extraer el motor: 9de draft/publish,
2de live y5del bridge existentes. Eso es regresión justificada por cambio compartido, no149tests
históricos ni repetición por cada página. Si un fallo pide ampliar presupuesto, documentar
regresión concreta y evidencia faltante; no crecer por rutina.

Un pase independiente agrupado con DB real nueva:
1. Home: escribir teclado→live conserva foco/caret, Refresh local, draft/reload y público
   anterior; publicación de otra página no toca Home. No repetir todo su antiguo guion.
2. Owners EN/ES: mover plan/features y paso con fallback; live/teclado, guardar draft,
   publicar EN con draft+trabajo local ES intactos; luego ES, reload/público/SEO. Es la única
   página que repite aislamiento EN/ES completo del motor. Caso extra DB por otra key puede
   usar Buildings para confirmar independencia entre páginas.
3. Buildings/Real Estate/Guest: un flujo corto EN por página de live→draft→reload→publish→
   público/SEO, con ES title/description visible (EN vacío) en una representativa. Comprueba
   respectivamente stats+grid, PDF+lista, teaser+foto; no repetir ciclo completo en4idiomas.
4. Un pase visual desktop/mobile agrupado, no4×4×3matriz. Cada página al menos una comprobación
   mobile de inspector/acciones/live, con teclado continuo en una representativa. Medios
   locales pendientes se demuestran una vez; PDF es verificación de su tipo/destino separado.
5. Un acceso anónimo a preview + revisión de guards; validar policy legacy por keys adaptadas
   y una entidad no adaptada conservada. No batería de submits/forms ni emails.

QA escribe sólo docs/specs/page-editor-platform-qa.md y harness/logs/screenshots en
/private/tmp/central-hill-page-editors-qa. No implementa fixes silenciosos. Reporta candidato,
SQL identity, reproducción y defectos; cada dueño corrige su scope. Una confirmación sólo de
fallos reales; no rondas abiertas de polish. Esperas por revisión/ready, no Saved ambiguo;
finally cierra browsers. Comparar público por datos estables, no counters animados0/target;
APIRequest login tras cookies envía Origin normal. No reiniciar toda la secuencia por selector.

## Comandos integrados una sola vez

Node22/pnpm en entorno nuevo verificado; root conserva logs y exit codes. Cada implementador
corre sólo tests focales/eslint de su scope; sin builds/lint/typecheck globales por rama.
Después de integrar todos los adaptadores, raíz:

```
pnpm typecheck
pnpm lint
pnpm exec tsx --test src/slices/pages/tests/page-locale-drafts.test.ts src/slices/pages/tests/page-locale-drafts.integration.test.ts src/slices/pages/tests/home-live-preview.test.ts src/slices/backoffice/tests/page-editor-bridge.test.ts src/slices/pages/tests/editorial-engine.test.ts src/slices/pages/tests/editorial-engine.integration.test.ts src/slices/pages/tests/owners-editorial-adapter.test.ts src/slices/pages/tests/buildings-editorial-adapter.test.ts src/slices/pages/tests/real-estate-editorial-adapter.test.ts src/slices/pages/tests/guest-editorial-adapter.test.ts
pnpm build
```

Asegurar que los dos casos nuevos de motor realmente se reparten en los dos archivos nuevos
listados; no crear archivo vacío para satisfacer comando. Ajustar archivos exactos sólo si
hay motivo documentado y sin duplicar casos. Pruebas DB requieren transporte local/loader
server-only de QA para Node standalone; producto Next usa sus guards habituales. Build usa
DB sintética verificada, nunca prod. pnpm db:check sólo si aparece migración justificada.
Si cambia la conducta de form-model/about-list-editor para consumidores legacy, añadir
explícitamente pnpm exec tsx --test src/slices/pages/tests/about-editor.test.ts y/o
src/slices/pages/tests/pages-admin.test.ts según el diff; no toda la batería About. Son
regresiones existentes afectadas, no casos nuevos del presupuesto.
pnpm test/boundary:check placeholders no cuentan. Revisión manual de imports/ownership,
locales/SEO/ISR y guards. QA consume logs y no vuelve a correr estos comandos.
Repetir sólo checks afectados por cambios/fallos concretos y registrar motivo.

## Cierre local

QA aprueba el ejecutable integrado sin blockers ni checks requeridos pendientes. Root entrega
commit probado, paths incluidos nuevos, limitaciones, informe y handoff/URLs3068. Home3067
continúa en versión validada preservada. Ningún merge a main/push/despliegue como efecto de
terminar la tanda. Conservar worktrees/fixtures/procesos propios para revisión del usuario.
Estado actual de este plan: sólo documentación, ninguna de las fases iniciada.
