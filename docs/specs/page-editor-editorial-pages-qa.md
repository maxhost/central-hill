# QA independiente — adaptadores Services/About/Guides/Blog

2026-10-19. Revisión independiente del candidato ejecutable `59c1ce3` en
`/private/tmp/central-hill-page-editors-editorial-integration`, rama
`page-editors-editorial/integration`. Base documental `85676c3`.
Resultado: **APROBADO** el candidato corregido `48cc3c2`, sin fallos bloqueantes
pendientes, dentro del alcance local acotado.

Entrega y entorno limitados a local: preview3069, base/rol `pageeditors2qa`,
DB5638/proxy4538, storage9069; fixtures sintéticas. Preview3068 preservado.
Artefactos: `/private/tmp/central-hill-page-editors-editorial-qa`.
Sin main/push/despliegue/producción ni submits/correos reales.

## Revisión estática

Leídos AGENTS, CLAUDE, workflow, spec/plan, README Pages y ADR0039/0040.
Diff contra85676c3 revisado: los nueve adapters usan registry común; contratos
entre slices, kernel/migraciones intactos; ampliación form-model limitada al import
ABOUT_LIST_PATHS. Los cuatro mensajes incluyen sharedBlock. Preview/actions requieren
staff, allowlist de key/locale/surface y validación de envelope/media. Las superficies
shared_aside sólo permiten Guides/Blog. Ruta preview force-dynamic, revalidate0,
robots noindex; bridge bloquea navegación/submits.

Publicación invalida tag de página/idioma tras guardar; Guides/Blog invalidan layout
del idioma para detalles ya cacheados. Published snapshots son autoridad; seam legacy
separa pending drafts del contenido aprobado, conserva políticas About/Guides/Blog y
los defaults vacíos de Services. Media no se persiste desde live preview. Catálogos y
entidades permanecen en slices dueños; About oficina conserva Settings.

Hallazgo estático confirmado con raíz: `getPageForEdit` de Services recolectaba media
legacy inválida antes de devolver sourceInvalid, pudiendo llegar a SQL UUID incluso
con snapshots completos. Corregido por raíz en `48cc3c2`: calcular sourceInvalid antes de IDs y omitir
IDs/OG de legacy inválido. `pnpm typecheck` y `pnpm exec eslint src/slices/pages/admin/queries.ts` exit0,
logs `typecheck-legacy-guard.log`/`lint-legacy-guard.log` leídos por QA.
Build final `build-legacy-guard-final.log` exit0; runtime48cc3c2.
`confirm.cjs`/`confirm.log` exit0: source Services temporalmente inválida no bloquea
cuatro snapshots autoritativos, todos intactos; source restaurada y comparada en finally. No fixes de producto escritos por QA.

## Checks integrados de raíz

QA consume logs existentes; no repite globals. Node22/pnpm. `typecheck-final.log`
exit0, `lint.log` exit0 con warnings históricos; `build.log` exit0 según raíz.
Suite explícita59casos:58pass inicial y un fallo Buildings por fixture; fixture
corregida y caso afectado1pass en `tests-buildings-fixture-final.log`. Diez casos nuevos
exactos,43 existentes afectados y6 About editor adicionales por import form-model.
Sin DDL nuevo; db:check no requerido por plan. No se cuentan scripts placeholder.

## Pase browser agrupado

Harness independiente `browser.cjs`, logs `browser.log`, checkpoints
`browser-state.json`; Node22 + Playwright. Primer intento sandbox falló EPERM4538 antes
de abrir navegador. Escalation de QA fue abortada mientras esperaba; raíz ejecuta el
mismo harness para destrabar permisos, sin instancia duplicada. QA evalúa evidencia.
Cada browser se cierra en finally; selector fallido se continúa desde checkpoint.

- Home: PASS teclado continuo/foco/caret, live, Refresh sin cambiar iframe; reload
  descarta cambios sin guardar. Evidencia registrada por harness.
- Services: PASS live→draft→reload→publish EN, título/description públicos, exactamente
  tres pasos sin acciones de reorden/add, catálogo real readonly; mobile inspector/acciones.
- About: PASS reorden párrafo/audience/contact, blob local sin fila media anticipada,
  save/reload/publicación, IDs/destinos conservados y Settings byte-equivalente; mobile.
  Fixture imagen heredada era captura de otra UI; reemplazada por PNG neutral
  sintético mediante upload/save/reload/publish real. Screenshot mobile corregida vista
  independientemente; no defecto de producto. Storage común sintético también corregido.
- Guides: PASS template {city}, toggle off/on conserva label, aside live dedicado, draft
  privado/reload/publicación actualiza guía ya cacheada y mobile. Cambios reales de ciudad
  comprobados en público con ambos paneles y títulos localizados. Primer intento detenido
  por Porto sin guías disponibles en caché de fixture.
  Raíz sembró segunda guía sintética/section y refrescó mediante editor existente.
  Selección privada de chips queda bloqueada por el bridge readonly existente; prueba
  real de ciudad pasa a público tras publicar. El template privado se comprueba en DOM
  incluyendo panel oculto. Sin fallo de producto atribuido; continuación desde Guides,
  sin repetir Services/About.
- Blog: PASS EN/ES completo. Publicar EN conserva fila ES y trabajo local ES;
  después save/publish/reload ES conserva headline y SEO propios con EN SEO vacío.
  Newsletter y shared aside live se publican en artículo ya cacheado; CTA propio
  conserva URL y label. About EN conserva fila íntegra. Mobile teclado continuo
  conserva foco/caret y actualiza renderer; screenshot registra estado transitorio
  del debounce tras retirar sufijo de prueba; reload final confirma headline exacto.
- Guards: PASS anónimo redirige login, direct saved shared_aside muestra contenido
  publicado/noindex y cabecera `private, no-cache, no-store, max-age=0, must-revalidate`.
  Submit cancelado dentro de preview. Translation legacy de Blog redirige editor
  común; entidad Building mantiene su editor anterior. No JavaScript page errors
  observados. Browsers cerrados por finally.

Screenshots mobile Services/About/Guides/Blog inspeccionadas independientemente;
inspector/acciones/live visibles a390px, sin overflow horizontal comprobado por harness.
Desktop funcional se ejecutó a1600×1000. No se afirma matriz visual4×4×3 ni QA remoto.
Los reintentos fueron continuaciones de checkpoint por selector/debounce o fixture,
no repeticiones completas de lo aprobado. Selector SEO se corrigió para usar toolbar,
como editor validado existente. Fixture Porto necesitó una sección publicada para
estar disponible; la captura old no se interpreta como defecto de producto.

Incidencia de harness: public layout no incluye main; se corrigió selector a body,
continuando desde Services antes de cualquier mutación en esa página.

Los seis puntos acotados del plan están completos en runtime59c1ce3. Única corrección
de código48cc3c2 confirmada en runtime final mediante caso afectado; no fallos
funcionales bloqueantes pendientes. No se amplía matriz histórica MIME/entidades/forms.


## Cierre de entorno

Raíz informa que listener3068 dejó de estar presente en comprobación final; sólo se
detuvo el proceso propio3069. Código/DB/worktree3068 no fueron modificados; raíz
restauró el proceso original desde su checkout/build/env: checkout limpio85676c3,
PID9272/session34102, DB original pageeditorsqa, HTTP200 en login. QA comprobó
checkout limpio y leyó `fixture-evidence.log` exit0. No se afirma continuidad
ininterrumpida del listener. Runtime final3069 PID8680/session73545.

Imagen común corregida con nueva clave local `qa-neutral.png` para mismo ID sintético,
original qa.png también neutral; caché previa preservada en artefactos, no eliminada.
QA inspeccionó `neutral-fixture-final.png`: Services renderer y catálogo muestran la
imagen neutral, editor HTTP200. About upload individual ya corregido. No nueva ronda
funcional ni cambios de código para esta corrección de fixture.

Commands browser reales: Node22 `node .../browser.cjs` (continuaciones desde Services,
Guides y Blog tras selectores/fixtures, final exit0), `node .../confirm.cjs` exit0,
`node .../fixture-evidence.cjs` exit0 por raíz. Checks integrados: `pnpm typecheck`,
`pnpm lint`, `pnpm exec tsx --test` con los archivos explícitos del bloque del plan,
`pnpm build`; logs y exits descritos arriba. Publicación/permisos globales no se
amplían; entrega permanece en rama local, sin main/push/despliegue/producción.
