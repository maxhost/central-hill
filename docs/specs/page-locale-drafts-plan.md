# Ejecución propuesta — borrador/publicación Home por idioma

2026-10-18. Alcance cerrado en page-locale-drafts-spec.md y ADR0040.
El usuario autorizó implementación desde e06272b; ver Active execution al final.

## Base y preparación

Producto3c55a1b; checkout actual /private/tmp/central-hill-home-contextual-integration,
home-contextual/integration. Hay documentación del handoff/Owners/SEO pendiente del turno
anterior, escrita por raíz; se captura con este cierre. No hay cambios de src sin commit.
Leer el HEAD final de documentación y registrar hash/status antes de ramificar.

Propuesta de checkouts, todos desde el mismo contrato root ya registrado:
- /private/tmp/central-hill-page-drafts-integration — page-drafts/integration.
- /private/tmp/central-hill-page-drafts-backend — page-drafts/backend.
- /private/tmp/central-hill-page-drafts-editor — page-drafts/editor.

Orquestador aterriza primero tabla/tipos/contrato y registry Home, con stub coherente sólo
si es necesario para compilar el contrato. El producto no se entrega con stubs. Registro
DB real en este repo: inspeccionar drizzle.config.ts; no asumir src/core/db/schema.ts.
Reservar0023_page_locale_content.sql si sigue siendo el siguiente número al ejecutar;
generar snapshot/journal con herramienta, no editar migraciones anteriores.

Entorno nuevo `pagedraftsqa`, preview3067/storage9067 y puertos DB/proxy a verificar antes
de iniciar. No tocar Home3065 ni reutilizar su DB para writes. Seeds pequeños EN/ES, medios
locales y un usuario; correo consola. No copiar .env productivos a ningún agente.

## Asignaciones exactas propuestas

El orquestador confirma los archivos actuales y estabiliza contratos ANTES de delegar.
Un escritor por archivo, incluidos nuevos. Sin delegación anidada.

| Dueño | Archivos/rutas de escritura |
|---|---|
| Raíz | Pages schema.ts, contract.ts, editorial-types.ts, editorial-registry.ts; drizzle0023 + meta; drizzle.config.ts si requiere registro; app/admin pages/[key] y preview/home; Pages server/queries.ts y publish.ts; admin/actions.ts y home-actions.ts para cerrar vía legacy; ui/home-page.tsx para inyección PageResult; Translation admin/actions.ts, queries.ts, ui/review.tsx y server/generate.ts para guard/redirect Home; cuatro messages/*.json, README/docs/AGENTS |
| A backend | Pages editorial-content.ts; admin/editorial-queries.ts, editorial-actions.ts, editorial-store.ts, editorial-validation.ts; server/editorial-preview.ts, editorial-publication.ts, editorial-policy.ts; tests/page-locale-drafts.test.ts, tests/page-locale-drafts.integration.test.ts |
| B editor | Pages admin/ui/home-contextual-editor.tsx, admin/ui/page-editorial-state.ts, admin/ui/page-publication-actions.tsx; Backoffice page-editor-types.ts y ui/page-editor-shell.tsx sólo si el contrato root demuestra que hacen falta; tests/editorial-state.test.ts sólo con casos de estado reales dentro del presupuesto |
| QA independiente | docs/specs/page-locale-drafts-qa.md; harness/logs/screenshots sólo /private/tmp/central-hill-page-drafts-qa |

Paths de Pages se prefijan src/slices/pages/; Backoffice con src/slices/backoffice/.
Si root decide que el shell no necesita cambio, quitarlo del write set B. A/B no escriben
schemas/contratos/mensajes compartidos. Ningún kernel change previsto; si aparece uno, raíz
lo justifica en ADR y ajusta scope antes de editar, sin rehacer el pipeline global i18n.
La política Home para Translation se ofrece vía Pages contract; no importar sus internals.

## Secuencia mínima

1. Raíz: confirmar base/entorno, tabla y contrato, CAS por idioma y payloads; commit de contrato.
2. Dos implementadores en sus worktrees: A persistencia/preview/publicación, B estado/controles
   Home. Todos los botones editoriales usan idioma seleccionado, sin aprobación/review.
3. Raíz integra secuencialmente, adapta getter público/renderer privado, bloquea bypass legacy,
   registra la migración y mensajes. Una revisión manual de imports/ownership/SEO/ISR.
4. Checks integrados una vez; QA independiente con el pequeño guion siguiente; correcciones
   sólo en scope de dueño y confirmación sólo de lo corregido. Handoff y localhost al usuario.

## Pruebas acotadas: techo explícito

Objetivo: máximo **10 casos automatizados nuevos** entre unit/integración. No generar matrices
por idioma/viewport ni repetir los149tests anteriores de Home como rutina. Si se necesita
superar ese techo, justificar el fallo/regresión concreta y la evidencia que falta.
No escribir tests que sólo reflejen JSX o clases CSS. No tests globales del CMS ni de emails.

Asignar los10casos entre A/B antes de lanzar; agrupar estas comprobaciones sin duplicarlas:
1. Guardar EN persiste draft al recargar y no altera web pública.
2. Preview draft→published cuando no hay draft; contenido idéntico tras Publicar/borrar JSON.
3. SEO ES se edita/guarda con SEO EN vacío y sólo se hace público al publicar ES.
4. Publicar EN limpia sólo EN; published y draft ES permanecen idénticos.
5. Seguir editando ES después y publicarlo conserva separación, sin aprobación.
6. Publicar inválido/referencia media inválida conserva draft y published anteriores.
7. Dos pestañas/revisión obsoleta y guardado posterior a eliminación no pierden/resucitan draft.
8. IDs estables/reordenamiento preservan textos al preparar el nuevo JSON target.
9. Bootstrap equivalente y traducciones legacy no públicas preservadas como draft.
10. Mutaciones legacy Home/Translations no pueden publicar por fuera del nuevo flujo.

Al menos los casos4/6/7 se prueban contra la DB aislada real, no mocks de SQL. A puede
agruparlos en un test de integración con subpasos; no ocultar una matriz grande detrás de
un test wrapper. Los otros son puros si cubren la conducta sin navegador.

Un SOLO pase de navegador: EN draft/save/reload/preview vs público; ES SEO/guardar; publicar
EN y comprobar que ES sigue draft; publicar ES y comprobar preview/público; desktop + mobile
en la misma sesión. Reusar uploads existentes de fixtures; no probar otra batería de MIME.
Un acceso anónimo a preview + la revisión del guard existente bastan para el límite auth.
No repetir toda la traducción en PT/FR: comprobar claves/modelos de esos idiomas.
Una ronda de confirmación sólo para defectos reales. Sin rondas abiertas de pulido visual.

Comandos Node22/pnpm, con código/exit registrados:
- pnpm typecheck
- pnpm lint
- pnpm exec tsx --test src/slices/pages/tests/page-locale-drafts.test.ts
  src/slices/pages/tests/page-locale-drafts.integration.test.ts
  (añadir editorial-state.test.ts sólo si B creó casos necesarios dentro de los10)
- pnpm build (entorno aislado verificado)
- pnpm db:check (hay migración)

Cada implementador ejecuta sólo su comprobación focal; no dos builds ni baterías completas
en ramas individuales. Raíz ejecuta los checks globales una vez en candidato integrado;
QA consume esos resultados y no los vuelve a ejecutar. Repetir sólo si hay un cambio/fallo
que lo justifique. Esperas de iframe por ready/revisión, no por un texto Saved ambiguo.
Si un harness falla por selector/espera, corregir esa parte y continuar desde el punto
alcanzado, no recomenzar el flujo entero. Browser siempre se cierra en finally.

## Entrega

Código probado, informe QA y handoff con commits/archivos/limitaciones. Una URL para que
el usuario pruebe. No integración a main/push/despliegue/producción. Mantener worktrees y
artefactos. Después se retoma Owners y la adaptación paralela de page-editors.

## Active execution — 2026-10-18

Implementation authorized by current user request. Base e06272b, clean status verified.
Integration /private/tmp/central-hill-page-drafts-integration, page-drafts/integration.
Root owns the shared files listed above plus this plan and final handoff. A/B paths remain
as assigned above; B shell/types allowed if necessary. Root owns home-queries.ts too
(legacy model retained read-only for old tests; route moves to editorial-queries).
Contracts: editorial-types.ts (numeric persistent per-locale revisions, complete envelopes,
first-target templateRevision), editorial-registry.ts, page_locale_content.
Backend exports getHomeEditorialModel(), getPageEditorialModel(key,locale),
savePageDraft(input), publishPageDraft(input), getPageDraftPreview(key,locale),
getPublishedPageLocale(key,locale). Preview/public getters return resolved PageResult|null;
public getter falls back legacy read-only before initialization. Actions return only selected
locale model; editor must never reset other locale state. No router.refresh on mutation.
Test budget: A owns up to 8 cases (1–7 and 9 above grouped only when one scenario);
root owns cases8 and10 if not already covered by A; B adds no automated cases, browser
checks cover dirty/tab state. Required DB cases4/6/7 remain real DB.
QA environment pending new synthetic pagedraftsqa, preview3067; Home3065 preserved.
Global checks once after integration, logs under /private/tmp/central-hill-page-drafts-qa.

Root scope additions: server/editorial-translation-policy.ts (Pages-owned identity lookup
exported via contract for Translation guards), global messages/en|es|pt|fr.json (actual
message registry), Translation README, Pages README/data-model docs. No kernel change.
Environment ready: pagedraftsqa DB/role, owned containers central-hill-page-drafts-db5618
and proxy4518, network central-hill-page-drafts-qa, synthetic staff only. New files
env.sh/preload.cjs/fixtures.cjs/seed.cjs under QA artifact directory; no copied production env.
All0000..0023 migrations applied with psql ON_ERROR_STOP. drizzle-kit migrate failed
(local WebSocket transport unavailable), psql exit0; record logs. Existing3065 preserved.
ES pending legacy SEO fixture includes value when EN SEO empty; baseline must retain it.

Integrated editor commits042741c/2028271 and backend7c7fed8 (cherry-picked candidate).
Root additionally owns the final ninth case in page-locale-drafts.integration.test.ts
(identity policy + legacy generator rejects Home before mutation). Backend owns8 cases
(two pure, six DB); final total9. Independent QA reviews auth-wrapped legacy mutation guards.
ES unpublished legacy SEO persisted without EN value; all baseline data remains synthetic.
QA-only ESM loader stubs server-only for standalone Node tests; Next uses its normal guard.
