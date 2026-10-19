# Plan — segunda tanda de adaptadores Pages

Sólo planificación en este encargo. Base13fdec8 limpia, ejecutable7e13d9f aceptado por el
usuario. [Spec](page-editor-editorial-pages-spec.md), [handoff](page-editor-editorial-pages-handoff.md).
Sin agentes de implementación ni provisión/worktrees/DB en este encargo. No cambios src/messages/kernel.

## Preparación futura y orden

Un orquestador, máximo dos implementadores en worktrees separados; QA independiente al
integrar. No delegación anidada. Entrega local sin main/push/deploy/GitHub/producción.
Nueva integración propuesta page-editors-editorial/integration en
/private/tmp/central-hill-page-editors-editorial-integration, desde el HEAD documental final
que cierre este plan. Confirmar status/base reales antes de comenzar.

Nuevo entorno propuesto pageeditors2qa, preview3069/storage9069/DB5638/proxy4538;
containers central-hill-page-editors-editorial-{db,proxy}, red central-hill-page-editors-editorial-qa.
Puertos sin listener en comprobación de planificación; verificar otra vez al provisionar,
no reservarlos ni afirmar en este encargo que hay un entorno nuevo. Artefactos propuestos
/private/tmp/central-hill-page-editors-editorial-qa. Preservar3068/pageeditorsqa y sus datos
aceptados, storage9068, procesos/worktrees previos. No copiar .env productivos.

Antes de writes/build: SQL current_database/current_user deben ser ambos pageeditors2qa.
Aplicar sólo migraciones existentes0000..0023 a DB nueva, sin migración nueva prevista.
Node22/pnpm, dependencias locales del lock; no symlink node_modules fuera del root Turbopack.
Staff sintético, nueve Pages pequeñas, una Building para regresión, servicios de ejemplo,
dos ciudades de guías, una guía publicada y un artículo con CTA propio, categoría/autor.
Imagen QA neutra real, no captura de otra UI. Home fixture conserva pending ES SEO con EN
vacío y media46d4b557-b1f1-4ac2-96b3-a32004b68283 requerida por tests existentes.
Correos consola y ningún submit real. No clonar DB3068 para hacer fixture writes.

Secuencia:
1. Raíz audita base, registra asignaciones y aterriza contratos/extensiones compartidas
   coherentes, incluidos exports y renderers inyectables realmente existentes.
2. Tanda1: A Services, B About. Integrar secuencialmente; validar defaults/IDs existentes.
3. Tanda2 desde integración anterior: A Guides, B Blog. Superficies/legacy hooks ya estables.
4. Raíz habilita cada adapter completo, integra checks una vez y lanza QA independiente.
5. Corregir sólo defectos reproducibles; confirmar afectados y cerrar entrega/handoff.

Worktrees propuestos, todos bajo /private/tmp/central-hill-page-editors-editorial-:
services (rama page-editors-editorial/services), about (.../about), guides (.../guides),
blog (.../blog). Cada escritor verifica pwd/branch/HEAD/status y usa workdir explícito.
Conservarlos hasta capturar commits y archivos nuevos. Sin builds/global lint/typecheck por rama.

## Contratos que raíz debe aterrizar antes de consumidores

- Ampliar EditorialPageKey/PageContentMap a9 y actualizar metadata cliente/paths en el mismo
  commit. Separar keys conocidas de keys habilitadas: las4nuevas siguen legacy hasta estar
  completas; usesPageLocaleDrafts no puede activarlas sólo por ampliar el tipo/enum.
- Seam servidor legacy snapshots por adapter, con fuente {id,data,og,fechas}, locale y status.
  Salida published equivalente o fallback y captura pendiente separada. Reusar pipelines
  Blog/Guides/About reales descritos en spec; evitar getters públicos adaptados recursivos.
  Helper nuevo server/editorial-legacy.ts: raíz único dueño. Store/query/public fallback usan
  esa seam, no otra cascada creciente de if(key). Políticas actuales de5keys se conservan.
  Integrity/status bloquea sólo adopción de legacy corrupto; snapshots completos son autoridad.
- Política publicación server publicationScope:"page"|"layout" default page; sólo Blog/Guides
  layout seleccionado. updateTag por key+locale después de commit, revalidatePath del locale.
- Descriptor opcional sectionPreviews:Record<sectionId,"shared_aside">, visible sólo para secciones
  compartidas Guides/Blog; adapter soporta superficie page por default y shared_aside validada.
  Mismo payload envelope/localMedia, renderer elegido por servidor. Ruta/action bound surface
  allowlist por key. Cinco adapters actuales sin comportamiento diferente.
- Descriptor opcional de colapso por toggle: sección city_filter, path city_filter.enabled,
  valor false → sólo toggle visible en inspector/Element; undefined equivale true. No borrar
  datos escondidos ni mezclar source controls con copias traducibles target.
- Contratos ServicesListingRenderer/GuidesListingRenderer/BlogListingRenderer con
  {locale,page?,preview?}. Alias público coherente al renderer existente, grid por slice.
  GuideSharedAside/BlogSharedAside extraídos de call sites reales y exportados por contrato.
  Raíz entrega esos componentes y consumidores públicos ya equivalentes antes de ramas;
  luego transfiere ownership de implementación/annotations a los dueños de tabla siguiente.
  Nuevos exports nunca apuntan a módulos inexistentes; evitar ciclos con lazy render import.

Root describe funciones/tipos y hashes exactos en este plan al ejecutar. Sin stubs como
entrega contractual ni expansión unilateral de scopes. No ampliar kernel ni payload límites.
Máx refs/localMedia: Services5, About29, Guides4, Blog1; confirmar contra schemas sin duplicar
UUIDs. Content200000 caracteres, snapshot total256KiB como bridge actual.

## Ownership exacto

Prefijos P=src/slices/pages/, S=src/slices/services/, G=src/slices/guides/, B=src/slices/blog/.
Archivos nuevos incluidos; no autoriza escribir otras rutas. Schemas se asignan sólo para
metadata/compatibilidad de tipos necesaria, sin cambiar cardinalidades/copy/destinos.

Raíz posee durante toda la tanda:
- P/editorial-types.ts, editorial-adapter-types.ts, editorial-registry.ts,
  admin/editorial-ui-registry.ts, server/editorial-adapters.ts, schema.ts (tipos sin DDL), contract.ts.
- P/server/editorial-legacy.ts nuevo; admin/editorial-store.ts, editorial-queries.ts,
  editorial-validation.ts, editorial-actions.ts, live-preview-actions.tsx, live-preview-validation.ts;
  server/editorial-publication.ts, editorial-preview.ts, editorial-policy.ts, queries.ts,
  metadata.ts, editorial-translation-policy.ts, translation-revalidation.ts, publish.ts.
- P/admin/queries.ts, P/admin/actions.ts, P/admin/editorial-preview-route.tsx,
  P/admin/home-contextual.ts, P/admin/ui/page-contextual-editor.tsx; editorial-content.ts, editorial-identities.ts sólo si lo exige
  contrato compartido. No cambio esperado en NodeField/form-model/AboutListEditor.
- src/app/(admin)/admin/(panel)/pages/[key]/page.tsx,
  src/app/(admin)/admin/preview/[key]/page.tsx y src/app/(admin)/admin/preview/home/page.tsx;
  S/contract.ts, G/contract.ts, B/contract.ts; cuatro messages/*.json, docs/READMEs/AGENTS.
- P/tests/editorial-test-environment.ts, page-locale-drafts.integration.test.ts,
  editorial-engine.integration.test.ts sólo para guard/actor fixture nueva; nuevos
  tests/editorial-rollout.test.ts y tests/editorial-rollout.integration.test.ts (un caso cada uno).
- Translation acciones/generate/queries/review sólo si auditoría revela un guard que no
  consulte ya Pages policy; nombrar archivo exacto/scope antes de editar, no paquete entero.

La creación inicial de seams en archivos de composición siguientes es de raíz; después
transfiere expresamente writer a A/B desde commit contractual. Raíz no vuelve a escribirlos
mientras un agente tenga ownership. Cada tabla es un único dueño y rama independiente.

| Tanda/dueño | Write set existente y nuevo |
|---|---|
| 1 A Services | P/schemas/services.ts; P/services-content.ts nuevo; P/adapters/services.ts nuevo; P/admin/services-media-validation.ts; P/ui/components/services-sections.tsx; S/ui/services-listing.tsx; P/tests/services-editorial-adapter.test.ts nuevo |
| 1 B About | P/schemas/about.ts; P/about-content.ts; P/adapters/about.ts nuevo; P/admin/about-media-validation.ts; P/ui/about-page.tsx; P/tests/about-editorial-adapter.test.ts nuevo |
| 2 A Guides | P/schemas/guides.ts; P/guides-content.ts nuevo; P/adapters/guides.ts nuevo; P/admin/guides-media-validation.ts; P/ui/components/guides-sections.tsx; G/ui/guides-listing.tsx; G/ui/components/guide-shared-aside.tsx nuevo; G/ui/guide-page.tsx; P/tests/guides-editorial-adapter.test.ts nuevo |
| 2 B Blog | P/schemas/blog.ts; P/blog-content.ts; P/adapters/blog.ts nuevo; P/admin/blog-media-validation.ts nuevo; B/ui/blog-listing.tsx; B/ui/blog-post.tsx; B/ui/components/blog-shared-aside.tsx nuevo; B/ui/components/newsletter-signup.tsx; P/tests/blog-editorial-adapter.test.ts nuevo |

Read-only inicialmente: P/server/guides-content.ts, server/about-translations.ts,
admin/{about,blog,guides}-defaults.ts, P/ui/about-presentation.ts, P/ui/about-office.ts, P/ui/about-certifications.ts y schemas/media
helper actuales. Root legacy seam los consume sin reescribir su política. Si hace falta
cambiar alguno, raíz registra scope/razón y un dueño antes, sin escrituras cruzadas ocultas.
Otros slices/entity editors (incluidos Services/Guides/Blog admin y Leads) quedan intactos.
QA escribe sólo docs/specs/page-editor-editorial-pages-qa.md y harness/logs/screenshots en
su directorio QA. No fixes silenciosos; raíz asigna correcciones al dueño correspondiente.

## Casos y presupuesto de QA

Máximo10casos automatizados nuevos en total, sin matrices ocultas en un wrapper:
- Services2: cobertura/fallbacks+MIME/5refs y pasos3fijos con bootstrap equivalente.
- About2:8listas/29refs/metadata previa y reorder de párrafo/audience/contact conservando
  texto, foto, destino y retiro de ID. Reusar funciones existentes en lugar de recodificarlas.
- Guides2: fuente salvada+target {city}/enabled defaults y shared aside/publicación sin
  congelar catálogo. No se recorre cada ciudad/plantilla/idioma como matriz.
- Blog2: overrides EN vacíos no reviven targets viejos y copy compartida/CTA propio del post
  conservado, OG único con renderer reutilizado.
- Compartidos2: un caso puro superficies/visibilidad/igualdad de snapshot y un escenario DB
  representativo Blog bootstrap→draft→publish EN/ES con revisión persistente y scope layout.
  El resto de adaptadores comprueba su política legacy en sus dos casos, no otro DB matrix.

No pruebas espejo de clases/JSX. A/B ejecutan sólo sus casos y eslint focal, reportan exits.
Root una vez integrado ejecuta Node22:

```sh
pnpm typecheck
pnpm lint
pnpm exec tsx --test src/slices/pages/tests/services-editorial-adapter.test.ts src/slices/pages/tests/about-editorial-adapter.test.ts src/slices/pages/tests/guides-editorial-adapter.test.ts src/slices/pages/tests/blog-editorial-adapter.test.ts src/slices/pages/tests/editorial-rollout.test.ts src/slices/pages/tests/editorial-rollout.integration.test.ts src/slices/pages/tests/editorial-engine.test.ts src/slices/pages/tests/editorial-engine.integration.test.ts src/slices/pages/tests/page-locale-drafts.test.ts src/slices/pages/tests/page-locale-drafts.integration.test.ts src/slices/pages/tests/home-live-preview.test.ts src/slices/backoffice/tests/page-editor-bridge.test.ts src/slices/pages/tests/services-content.test.ts src/slices/pages/tests/about-content.test.ts src/slices/pages/tests/guides-content.test.ts src/slices/pages/tests/blog-content.test.ts src/slices/guides/tests/listing-presentation.test.ts
pnpm build
```

En esta base son43casos existentes afectados y10nuevos previstos, no149tests históricos.
Actualizar guard SQL de tests para que sólo permita nueva DB/rol pageeditors2qa; no relajar
para aceptar cualquier DATABASE_URL ni escribir fixtures sobre3068. Respetar transporte
HTTP/loader server-only del harness para standalone, sin convertirlo en cambio de producto.
No db:check salvo DDL nuevo justificado (entonces ADR/número disponible antes de ejecutar).
Sólo si el diff afecta realmente NodeField/form-model se añade el archivo legacy específico,
con motivo registrado; no repetir por rutina los71About/Pages ni las baterías de entidades.
Revisión manual de imports,9keys/4locales, SEO/ISR, guards y contratos. QA consume logs sin
volver a ejecutar globals. Repetición sólo por falla/cambio concreto y sólo scopes afectados.

Un pase independiente agrupado desktop/mobile:
1. Home breve regresión teclado→live/foco/Refresh/reload; sin reabrir todo su ciclo histórico.
2. Services EN live→draft→reload→publish→público/SEO; tres pasos fijos y catálogo readonly.
3. About EN mismo flujo con párrafo, audience/contact movidos, media pendiente una vez,
   logo/mixto comprobado por referencias; destino/fallback correcto, oficina Settings intacta.
4. Guides EN mismo flujo con {city}, selección real de ciudad y toggle off/on; campos
   colapsan/restauran conservando valores. guide_aside live en superficie propia, draft
   privado y publicación visible en una guía ya cacheada sin rebuild.
5. Blog es la única comprobación EN/ES completa de aislamiento en esta tanda: ES SEO aunque
   EN esté vacío, draft+trabajo local ES intactos al publicar EN, luego ES/reload. Newsletter
   y aside live; ambos actualizan artículo ya cacheado, CTA propio del artículo conservado.
   Publicación Blog no altera About ni otras key/locale. No submit newsletter/emails.
6. Cada una de las4páginas nueva al menos una comprobación mobile de inspector/acciones/live;
   teclado continuo mobile en una representativa, sin matriz4×4×3. Una comprobación anónima
   preview y acceso directo shared_aside guardado, noindex/no-cache/submits bloqueados;
   revisión guards legacy + una entidad individual sin cambios.

Comparar datos públicos estables y SEO, no counters animados. Esperar revisión/ready real,
no Saved ambiguo. Session Origin normal al login. Cerrar browsers finally. Cambiar superficie
sólo al seleccionar el bloque compartido, no al escribir. Si un selector falla, continuar
checkpoint pendiente; no reiniciar el guion entero. Una confirmación de defectos reales,
sin rondas abiertas de polish. Sin broad adversarial matrix MIME/formularios/entidades.

## Cierre esperado

QA aprueba candidato integrado con checks requeridos completos. Root entrega commits,
archivos incluidos nuevos, informe, URL3069 y handoff; mantiene3068 validado intacto.
La tarea termina en rama local, sin main/push/despliegue. Este documento en este encargo no ejecuta
ninguna de esas fases: sólo revisión de código y documentación.

## Ejecución autorizada 2026-10-18

Base documental verificada85676c3, checkout original limpio. Nueva integración
`/private/tmp/central-hill-page-editors-editorial-integration`, rama
`page-editors-editorial/integration`. Usuario autoriza implementación y QA automático;
entrega sólo local, sin main/push/despliegue/producción. Preview3068 PID73105 preservado.
Write sets y criterios/commands de este plan siguen vigentes. Raíz aterriza tipos9keys
con enablement separado, seam `legacySource/legacyEditorialRows`, renderers inyectables,
shared asides extraídos, `surface` validada servidor y `publicationScope` antes de consumidores.
Tanda1 tendrá worktrees Services/About con los paths de la tabla; tanda2 Guides/Blog.
Sin cambios DDL/kernel. Preparación entorno pageeditors2qa en curso; no writes a3068.

Contratos e2dffe6; Services integrado17a64dd desde1d63814, About desdefbef7785.
Expansión mínima autorizada: About mueve ABOUT_LIST_PATHS a schemas/about.ts y
form-model cambia sólo import, para romper ciclo ESM descriptor→form-model→About.
NodeField ya da destination=buildings a nuevas contact.cards; no se cambió esa lógica.
Tanda1 dos tests por adapter y eslint focal exit0. Sin globals por rama.
Nueva DB SQL identidad pageeditors2qa/pageeditors2qa verificada; migraciones existentes
aplicadas exit0. Infra técnica del proxy local corregida, ningún DDL de producto nuevo.
Storage9069 PID85502. Tanda2 usa la integración de tanda1 con registry/getters Services/About
habilitados y seam legacy con pending exacto separado del published validado.

Tanda2 integrada139cd4b/3395da0 desde d7d9453/e8b75bc; 2casos por adapter pasan.
Registro nueve keys activado coherentemente con getters publicados, guards legacy,
metadata cliente y renderers existentes. Root exporta blogAsideCta por contrato y
getters shared reutilizan mappers puros. Cambio superficie modifica previewVersion
para negociar nuevo ready y reenviar payload temporal actual, sin reload al escribir.
Regresión adicional acotada about-editor.test.ts justificada por cambio import form-model.
Suite integrada59casos:58pass/1fail inicial por fallback Buildings; root restaura
excepción Buildings y confirma sólo ese test. Lint exit0 (warnings históricos y un
warning wrapper Home corregido). Typecheck inicial detectó narrowing never en guard
legacy al completar9keys; guard runtime conserva comportamiento con Boolean.
Build/checks finales y QA independiente en curso; evidencias en directorio QA.
