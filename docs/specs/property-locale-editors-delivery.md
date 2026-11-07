# Buildings y Apartments — entrega local por idioma

2026-11-06. Savepoint previo **5a1456d** (Blog aprobado conservado).
Rama `property-locales/integration`, checkout
`/private/tmp/central-hill-property-locales-integration`.
Candidato funcional **76cd66c**; documentación posterior **2caf28f**.
**QA independiente aprobada:9fb41e3** (informe inicial8e130ee; follow-up de
redacción únicamente). [Informe completo](property-locale-editors-qa.md).
No quedan bloqueantes del alcance local acordado. [Spec](property-locale-editors-spec.md),
[ejecución](property-locale-editors-plan.md),
[ADR0058](../decisions/0058-property-locale-snapshots.md).

## Resultado implementado

Edificios y apartamentos anidados tienen pestañas EN/ES/PT/FR, Save draft y
Publish independientes, borradores completos y revisiones persistentes. Los
textos y los enlaces de reserva se editan por idioma. Las referencias físicas,
media y estructura se authoran en EN y se adoptan explícitamente en cada idioma.
La publicación EN posterior no cambia un idioma ya publicado. Las FAQs conservan
IDs estables. El primer Save de una entidad nueva pasa a su URL de edición y
permite continuar guardando sin crear otra identidad.

El apartamento puede prepararse antes que el idioma de su edificio; sólo aparece
públicamente cuando ese idioma del padre está publicado. Contadores públicos por
idioma, orden operacional global y archivo del padre respetan ese alcance. Los
links de reserva resuelven override localizado, default congelado y finalmente
el fallback definido en la spec. No hay nueva ruta pública de apartamento.

Los previews privados usan el renderer público real, con cambios locales
efímeros y media blob hasta Save explícito. Bootstrap preserva la salida pública
legacy de cuatro idiomas y las traducciones pendientes; ninguna lectura hace
esa migración. Translations excluye Buildings, Apartments y Building FAQs; los
links viejos redirigen a sus editores. Amenities y Geography siguen allí.

## Entorno aislado y autorización

Usuario autorizó explícitamente propertylocalesqa y pruebas sintéticas. DB/rol
verificados ambos `propertylocalesqa`; Postgres5658, proxy4558, storage9073,
preview **http://localhost:3073/admin/buildings**, PID14719/session22769.
Login sintético: `propertyqa@example.test` / `PropertyLocalesQA2026!`.
Artefactos/logs/harness: `/private/tmp/central-hill-property-locales-qa`.
Preload de QA enruta sólo el host sintético al proxy local y rechaza Neon remoto.
Migraciones0000..0025 aplicadas sólo allí; **0025** añade las dos tablas de
snapshots con FKs al propietario, unique(entity,locale), locale/revision checks.
No migración de datos remotos, GitHub, main merge, push ni deploy.

Storage9073 es un servidor HTTP sintético con PUT/HEAD/GET y metadatos; no valida
firmas S3. Para cargar las imágenes recién subidas, el launcher de este preview
usa remotePatterns y dangerouslyAllowLocalIP sólo en su configuración runtime
ignorada, con URL127.0.0.1:9073. El producto no cambia next.config ni el kernel.

3071 PID58381 permanece en main48ae09c; Blog3072 PID69153 y postlocalesqa
permanecen preservados. Main sólo tiene el logo previo sin rastrear. En este
checkout `public/propertylocalesqa` es un symlink sin rastrear al storage de QA;
.env.local es ignorado y contiene exclusivamente configuración sintética.
Worktrees de ambos implementadores permanecen conservados.

Límite de fixture: Home no tiene page_content sintético y devuelve404. Su
FeaturedPortfolio fue revisado en fuente: conserva el link interno localizado al
detalle. No se amplió esta entrega a crear/validar un editor Home. Las superficies
funcionales de reserva modificadas son Building listing/detail/top y UnitCard.

## Verificación integrada

- Node22.23.3 y pnpm10.8.0. `pnpm typecheck` y `pnpm lint`: exit0; siete warnings
  de lint existentes. Logs typecheck-integrated.log y lint-integrated.log; repetidos después del
  ajuste SEO final76cd66c: typecheck-final.log y lint-final.log, ambos exit0.
- 93/93 casos reales en632c54d: exit0, tests-integrated.log. Las diferencias
  funcionales posteriores son copia4locales y metadataSEO, compiladas en76cd66c
  y verificadas en navegador independiente. No se repitió la suite sin necesidad. Archivos explícitos:
  Buildings property-locale-state / property-locale-store.integration / buildings /
  buildings-admin / amenity-admin; Apartments property-locale-editor /
  property-locale-store.integration / apartments / apartments-admin /
  apartments-admin-derive; Blog post-editor-state; Backoffice page-editor-bridge.
  Queries de integración reales; el adaptador standalone sólo suple contexto
  Next/cachemiss y metadataPNG. Comando exacto desde el checkout:

```sh
source /private/tmp/central-hill-property-locales-qa/env.sh
NODE_OPTIONS="$NODE_OPTIONS --require /private/tmp/property-buildings-node-runtime.cjs" pnpm exec tsx --import /private/tmp/central-hill-property-locales-qa/apartments-test-runtime.mjs --test \
  src/slices/buildings/tests/property-locale-state.test.ts \
  src/slices/buildings/tests/property-locale-store.integration.test.ts \
  src/slices/buildings/tests/buildings.test.ts \
  src/slices/buildings/tests/buildings-admin.test.ts \
  src/slices/buildings/tests/amenity-admin.test.ts \
  src/slices/apartments/tests/property-locale-editor.test.ts \
  src/slices/apartments/tests/property-locale-store.integration.test.ts \
  src/slices/apartments/tests/apartments.test.ts \
  src/slices/apartments/tests/apartments-admin.test.ts \
  src/slices/apartments/tests/apartments-admin-derive.test.ts \
  src/slices/blog/tests/post-editor-state.test.ts \
  src/slices/backoffice/tests/page-editor-bridge.test.ts
```

- `pnpm db:check`: exit0,26migraciones; warning histórico0008, sin error nuevo.
- `pnpm build` inicial y final76cd66c: exit0. Log final build-final.log.
- Imports cruzados revisados: sólo contracts; ningún cambio src/core. Los49keys
  propertyEditor coinciden en los cuatro idiomas. Revalidación de edificios,
  apartamentos, listado y sitemap revisada. Impeccable detector sobre cuatro
  archivos UI: exit0, lista vacía (design-detector.json).
- Fallos encontrados y corregidos antes del candidato: ciclo ESM de tags
  evaluados al importar contracts; los tags ahora se evalúan al consultar.
  Campos explícitamente vacíos del snapshot no reviven valores legacy en admin.
  QA de fuente detectó hreflang de idiomas no publicados;76cd66c deriva sólo de
  alternateSlugs válidos y canonical real. La confirmación final de navegador pasó. El grupo Buildings verificó
  Save/Publish EN/ES/PT/FR con cuatro URLs distintas, FAQs por UUID/reordenado,
  adopción explícita, guardia de navegación, preview sin persistencia y móvil FR.
  Apartments verificó siete grupos: Save/Publish de los cuatro idiomas, pending FR
  conservado, adopción explícita, referencias físicas congeladas por idioma,
  agregado legacy por identidad, cuatro URLs distintas, móvil PT y redirects
  de los tres tipos antiguos. Nuevas identidades verificadas con primer y segundo Save en la misma URL/UUID.
  Child ES antes del padre queda privado y se revela sólo al publicar el padre ES;
  EN permanece404. Canonical/hreflang/sitemap reales sólo anuncian ES. Orden,
  lifecycle y media verificadas: orden global sin cambiar snapshots, padre con
  hijos no borrable, archive conserva documentos y oculta la familia, borrado
  de unidad limpia sus snapshots/contadores. Dos imágenes pendientes EN no
  suben al guardar ES; Save EN sube exactamente ambas y el preview usa las URLs
  persistidas. Guardas HTTP reales y lecturas finales de contadores pasaron. Acceso y acciones
  anónimas denegados; las acciones legacy rechazaron propiedades sin modificar
  sus traducciones; Amenities mantuvo su flujo. Preview de origen/media no
  modifica revisiones. Generador y saves retirados revisados con harness de fuente.

`pnpm test` y `pnpm boundary:check` no se cuentan: son placeholders. La revisión
independiente documenta los casos realmente ejecutados y sus límites.

## Manifiesto rastreado frente al savepoint

```text
AGENTS.md
docs/data-model.md
docs/decisions/0058-property-locale-snapshots.md
docs/specs/property-locale-editors-delivery.md
docs/specs/property-locale-editors-plan.md
docs/specs/property-locale-editors-qa.md
docs/specs/property-locale-editors-spec.md
drizzle/0025_property_locale_content.sql
drizzle/meta/0025_snapshot.json
drizzle/meta/_journal.json
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
scripts/seed-demo.ts
src/app/(admin)/admin/(panel)/buildings/[id]/apartments/[aptId]/page.tsx
src/app/(admin)/admin/(panel)/buildings/[id]/apartments/new/page.tsx
src/app/(admin)/admin/(panel)/buildings/[id]/page.tsx
src/app/(admin)/admin/(panel)/buildings/new/page.tsx
src/app/(admin)/admin/preview/apartments/[id]/page.tsx
src/app/(admin)/admin/preview/buildings/[id]/page.tsx
src/app/[locale]/buildings/[slug]/page.tsx
src/slices/apartments/README.md
src/slices/apartments/admin/actions.ts
src/slices/apartments/admin/editorial-actions.ts
src/slices/apartments/admin/queries.ts
src/slices/apartments/admin/ui/apartment-locale-editor.tsx
src/slices/apartments/admin/ui/list.tsx
src/slices/apartments/admin/ui/property-editor-sections.ts
src/slices/apartments/admin/ui/property-editor-state.ts
src/slices/apartments/contract.ts
src/slices/apartments/editorial-types.ts
src/slices/apartments/schema.ts
src/slices/apartments/server/editorial-bootstrap.ts
src/slices/apartments/server/editorial-model.ts
src/slices/apartments/server/editorial-store.ts
src/slices/apartments/server/editorial-validation.ts
src/slices/apartments/server/queries.ts
src/slices/apartments/server/stats.ts
src/slices/apartments/tests/property-locale-editor.test.ts
src/slices/apartments/tests/property-locale-store.integration.test.ts
src/slices/backoffice/contract.ts
src/slices/backoffice/property-editor-types.ts
src/slices/backoffice/ui/admin-workspace.tsx
src/slices/backoffice/ui/property-live-preview.tsx
src/slices/buildings/README.md
src/slices/buildings/admin/actions.ts
src/slices/buildings/admin/editorial-actions.ts
src/slices/buildings/admin/queries.ts
src/slices/buildings/admin/ui/building-locale-editor.tsx
src/slices/buildings/admin/ui/list.tsx
src/slices/buildings/admin/ui/property-editor-sections.ts
src/slices/buildings/admin/ui/property-editor-state.ts
src/slices/buildings/contract.ts
src/slices/buildings/editorial-types.ts
src/slices/buildings/schema.ts
src/slices/buildings/server/editorial-bootstrap.ts
src/slices/buildings/server/editorial-model.ts
src/slices/buildings/server/editorial-store.ts
src/slices/buildings/server/editorial-translation-policy.ts
src/slices/buildings/server/editorial-validation.ts
src/slices/buildings/server/publish.ts
src/slices/buildings/server/queries.ts
src/slices/buildings/server/stats.ts
src/slices/buildings/tests/property-locale-state.test.ts
src/slices/buildings/tests/property-locale-store.integration.test.ts
src/slices/buildings/ui/building-detail.tsx
src/slices/translation/README.md
src/slices/translation/admin/actions.ts
src/slices/translation/admin/queries.ts
src/slices/translation/admin/ui/review.tsx
src/slices/translation/server/generate.ts
```

## Retomar

Entrega local completa. Resolver el último commit documental con `git log -1`.
No quedan verificaciones requeridas pendientes. Usuario puede revisar3073 con el
login sintético indicado. No iniciar Services (siguiente hito), Guides ni limpieza
sin nueva solicitud. Mantener todos los artefactos y previews existentes.
