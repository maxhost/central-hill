# Home por idioma — QA independiente

2026-10-18. **Aprobado**, sin defectos de producto ni bloqueos abiertos dentro del alcance acordado.
Candidato ejecutable `b4bb282f1a9896781116deea342a563914a66156`, base `e06272b`;
checkout `/private/tmp/central-hill-page-drafts-integration`, rama `page-drafts/integration`.
QA verificó pwd/rama/HEAD/status antes de revisar. El `node_modules` inicialmente sin seguimiento
era infraestructura local; raíz lo sustituyó para compilar. Al cerrar, los cambios de
AGENTS/plan/handoff/delivery pertenecen al orquestador. QA sólo escribe este informe en repo.

## Entorno y límites

Preview `http://127.0.0.1:3067/admin/pages/home`, Next production start del candidato,
PID raíz92677. DB/rol **pagedraftsqa**, comprobados por SQL antes del navegador;
Postgres5618, proxy4518, storage9067 y bucket pagedraftsqa. Staff sintético
`pagedraftsqa@example.test`, correo consola, datos/referencias de medios sintéticos.
No se usaron credenciales de producción ni correos reales. Home3065 y los demás entornos
se preservaron; sin main, push, deployment, GitHub ni Neon producción.
Artefactos exclusivos de QA: `/private/tmp/central-hill-page-drafts-qa/`.

## Evidencia funcional

Un pase EN/ES con Chromium, desktop1600×1000 y mobile390×844 en la misma sesión:

- Preview anónima redirige al login staff. No entrega el contenido privado.
- Editar EN marca cambios locales; Publicar permanece deshabilitado antes de guardar.
  Preview sigue guardada. Guardar borrador cambia preview privada, mientras la web pública
  conserva su headline y SEO anteriores. Recargar recupera el borrador y habilita Publicar.
- SEO EN título/descripción vacíos; ES presenta ambos campos editables. Guardar ES conserva
  su título/descripción en DB y deja la versión pública ES anterior.
- Con draft ES guardado y headline ES adicional sin guardar, Publicar EN elimina únicamente
  draft EN y actualiza público EN. `published::text`, `draft::text`, revisión y timestamp ES
  son idénticos antes/después. Público ES permanece igual y el input local ES sigue intacto.
- ES continúa con cambios pendientes, preview todavía muestra su draft guardado y Publicar
  sigue deshabilitado. En mobile se guarda el trabajo local y se publica ES. Draft ES queda
  NULL; preview y público coinciden en headline; título/descripción SEO públicos corresponden
  al draft ES. Publicar se deshabilita al terminar. EN conserva su publicación.
- Capturas desktop/mobile revisadas: sin overflow horizontal, acciones visibles/accesibles,
  tabs y SEO utilizables. Ausencia de controles approve/review/stale. Sin errores pageerror.
- Comprobación final de sólo lectura: canonical ES correcto y hreflang EN/ES/PT/FR/x-default.

Evidencias: `browser.cjs`, `browser.log`, `browser-evidence.json`,
`es-before-en-publication.json`, `mobile-es-unsaved.png`, `mobile-es-draft.png`,
`desktop-es-published.png`, `final-public.json`.

El primer lanzamiento de Chromium falló antes de navegar por sandbox MachPort EPERM;
se ejecutó con permiso local ya autorizado. El pase funcional terminó todas las mutaciones
correctamente y luego falló una aserción del harness: `/approve|review/i` también coincide con
**Refresh preview**. Se corrigió únicamente esa comprobación en
`browser-continuation.cjs` (regex anclada); continuación de sólo lectura exit0,
`browser-continuation.log`. No se repitieron saves/publicaciones ni el guion funcional.
Ambos harness cierran siempre el navegador en finally. Esperas basadas en revisión de URL
iframe y señal ready del shell (`aria-busy=false`), sin usar Saved como confirmación ambigua.

## Revisión de código y checks consumidos

QA leyó AGENTS, CLAUDE, workflow, spec/plan, ADR0040 y Pages README. Revisión manual:

- Nueva tabla/migración0023 aditiva, revisión persistente por idioma, CAS atómico y bootstrap
  idempotente. Drafts no invalidan rutas; publicar invalida sólo tag/ruta del idioma tras commit.
  Fallo de refresh posterior se distingue de fallo de publicación.
- Getter público usa exclusivamente published o fallback legacy de sólo lectura antes de
  bootstrap. Preview staff/no-cache usa draft guardado o published e inyecta el mismo renderer.
  SEO continúa por getHomePage; dependencias Settings/FAQ/Buildings/Services siguen externas.
- Nuevas queries/actions privadas exigen requireStaff. savePage(home) y saveHomeLocale
  rechazan la vía live legacy. Translation save/clear/approve/reset/approveEntity/generate
  bloquean Home antes de mutar; generator también. Review redirige al contextual e inbox
  excluye Home. Otras entidades conservan sus vías anteriores.
- Imports nuevos entre slices usan contract.ts, sin cambios de kernel. Registry sólo Home.
  UI devuelve/reemplaza únicamente el estado seleccionado, sin router.refresh. PT/FR se
  verificaron por modelos y claves de mensajes; no se amplió la matriz de navegador.

Checks ejecutados por raíz sobre el candidato e inspeccionados por QA, **sin repetirlos**:

| Comando Node22/pnpm | Exit | Evidencia |
|---|---:|---|
| `pnpm typecheck` | 0 | `typecheck.log` |
| `pnpm lint` | 0 | `lint.log`;7 warnings preexistentes |
| `pnpm exec tsx --test src/slices/pages/tests/page-locale-drafts.test.ts src/slices/pages/tests/page-locale-drafts.integration.test.ts` | 0 | `tests.log`;9/9 |
| `pnpm build` | 0 | `build.log` final |
| `pnpm db:check` | 0 | `db-check.log`;24migraciones, warning histórico0008 |

Los9casos cubren bootstrap equivalente/import de SEO ES legacy no publicado, draft privado,
SEO sin EN, aislamiento/publicación secuencial, invalidación schema/MIME sin perder contenido,
CAS concurrente/ABA y template, IDs estables al reordenar y bloqueo del generator legacy.
Los casos DB críticos usaron pagedraftsqa real. Guards auth y mutaciones legacy restantes
se revisaron directamente; no se presenta esa revisión como batería automatizada ejecutada.

Infra previa al build final: symlink node_modules fuera de raíz Turbopack produjo fallo;
raíz preservó el log de infraestructura y usó dependencias locales antes del build exitoso,
sin cambio de código. Migraciones0000–0023 se aplicaron al entorno sintético mediante psql
ON_ERROR_STOP, exit0 (`migrate-psql.log`); intento drizzle-kit previo falló por transporte
WebSocket local y no se contabiliza como migración exitosa.

No se ejecutaron pnpm test/boundary:check ni149tests históricos, matriz PT/FR, batería MIME,
correos ni prueba de producción. El informe aprueba únicamente el piloto Home y el QA
acotado acordado; no afirma exhaustividad de entidades ajenas o flujos excluidos.
