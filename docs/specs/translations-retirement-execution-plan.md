# Plan de ejecución por etapas para retirar Translations

2026-11-11. Depende del [spec](translations-retirement-spec.md). El inventario y
las decisiones de producto están en la [auditoría](translations-retirement-plan.md).
Estado: adversarial documental aprobado, AD01–AD04 cerrados. Q1 aprobado en
`a5dd998`, Q2 cerrado en `b30a18c` tras B3. Producto congelado en `b30a18c`;
batería final52/52 y Q6 aprobados por QA independiente. Entrega local pendiente de
apertura final en main; no hay push/deploy.

## Registro de ejecución

- O0 documental `0c14786` en main; contratos base `250b244` en integración.
  Worktrees A/B/QA creados según los paths propuestos. Main3071 PID72223 sigue
  activo, sin fuente de producto nueva ni cambios a su `.env`/`.next`.
- Nuevos targets `translationsretirementqa` y `translationsretirementunitqa`,
  hostname `{dbname}.local`, rol homónimo y proxy4558. Cada ledger tiene30hashes/
  timestamps exactos y47tablas. Contienen los scaffolds originales de migración,
  no están vacíos después del replay. No hay transferencia de datos de otra DB.
- Primera inicialización de esquema QA abortó por SQL con varios comandos en una
  prepared statement. La transacción revirtió completamente; se comprobó0tablas
  antes de separar léxicamente statements, sin cambiar SQL/hash, y completar ambas
  inicializaciones. No se reaplicó SQL sobre datos o esquema parcialmente creado.
- A1 `d40f9b1`, integrado como `b63c441`: pure16/DB5/typecheck/scopedlint0;
  fixtures unitarias propias limpias. B1 `71e59ff`:44pruebas/typecheck/lint0.
- O4 candidato `a5dd998`: rutas autenticadas/export/consumidor Pages adaptados.
  Root61pure0 (incluye engine Pages),5DB0,typecheck0,lintfocal0. Un primer comando
  de pure omitió el loader auth requerido y falló por env ausente; se corrigió el
  comando y los16casos de acciones/Testimonial pasaron. No fue corrección de producto.
- QA hizo guard de DB y paró antes del seed al encontrar4Page scaffolds. Root
  verificó IDs/keys/hashes y su origen0012/0016/0017. Seed247statements en una
  transacción adoptó sólo esas4raíces con CAS, insertó5restantes y36publicaciones
  Page, Service4, Guide4,2Posts8 y auxiliares propios. FAQbootstrap2/14/28exactos.
- Admin sintético propio con signup/login normal; nada de tokens extraídos o
  cookies manuales. Sources/evidence/secret envs bajo el directorio de QA; los
  secretos no se incorporan a git/reportes. Root guardó42huellas de negocio del
  entorno del usuario en `protected-user-before.json` para comparación final.
- QA congeló baseline/media antes del build; manifiesto concreto SHA256
  `4d3b009e540a31f5cda27d9186e7e815b463a7110f8c1f039ad049c503d9d98c`.
  Build `a5dd998`0/105rutas/2workers; producción3081 PID97768/session24147,
  cwd QA runtime verificado. Main3071 PID72223 sigue intacto.
- QA Q1 aprobado `a5dd998`:29rutas/auth/conservación42hashes0deltas; ServiceES
  ocho campos+ALT por UI, Save draft/reload/public baseline/Publish/update normal,
  otras tres publicaciones+drafts exactos y0pageerrors. Harness corrigió un selector
  `<main>` inexistente en ServiceDetail; reanudó desde draft guardado sin repetir
  Save ni rutas. Ninguna corrección de producto. Evidencia en results y checkpoints
  del directorio QA. A2/B2/O5 se abren ahora, batería final52pendiente.
- A2 `c0e42f6`, B2 `5d4db7d` integrado como `1d26c93`, O5 `fc244bc`:
  retiro completo de menú/mensajes/UI interna; root68pure0,4DB0,typecheck0,
  lint0(7warnings anteriores),detector[]. Build0/105rutas/2workers. QA aprobó
  GuidePT10campos+ALT y ausencia UI9editores+3compat,0errores; AboutFR no guardó.
- QA detectó error boundary preexistente al seleccionar Certifications en About
  FR; helper original homeNode idéntico a basef947c4f sólo recorría objetos.
  B3 `b30a18c`: regresión real6casos antes3fail/3pass; arreglo y suites focales
 17/17pass,typecheck/lint0; root confirmó17/17. Sólo helper y test asignados.
  QA revisó el fix sin observaciones, build corregido0/105rutas/2workers.
- Q2 cerrado en `b30a18c`: CertFR retest sin boundary ni escrituras por abrir;
  AboutFR46campos+ALT anidado Save/reload/privatepreview/publicbaseline/Publish/
  public correctos; FAQblancoFR no heredaEN,0errores. GuidePT/UIabsence retenidos.
  QA fuente revisó retiro y fix: contratos/auth/zero writes correctos, sin cambios
  kernel/schema/publicreaders. Producto congelado salvo defecto confirmado nuevo.
- QA producción3081 PID4574/session32378, cwd QA runtime verificado. Q1/Q2
  `.next` originales archivados completos antes de cambiar candidato, sin borrar
  caches; ningún reinicio se usó para aprobar una revalidación dentro de un caso.
- Q3 baseline actual:12unidades×4custom distintas,drafts null; manifest v3 SHA256
  `f8f8c7f9c4aae26202e4a5d7e6cd87f7bf6754b784f46e66d78a91a0031fe047`.
  IDs422controles comprobados sólo EN; targets usan descriptor/guard de cantidad
  y comprobación del path persistido. Exclusiones legacy/editor-only se documentan
  con renderer, nunca como pass público. Campos código/clasificación no son copy.
- Batería final Q4/Q5 aprobada:52/52, nueve Pages×4, sidebar Blog×4 y
  Post/Service/Guide×4. Cada ciclo usa controles reales, Save draft/reload,
  preview donde existe, público sin filtración y Publish con invalidación normal.
  Owners/Post/Service/Guide preservaron drafts EN/ES realmente pendientes al
  publicar PT. Cero pageerrors y error boundaries en los casos finales.
- Q6 aprobado:12campos condicionales Service×4, catálogo Guides vacío×4 mediante
  Archive/Restore propio, FAQ/ALT históricos y edición móvil de cuatro familias.
  Guide source-only comprobó working heredado, público404 antes de publicar,
  snapshot publicado estable frente a EN nuevo y transición custom por UI.
  Pages/Post/Service:42pruebas puras de helpers/modelos y fuente, sin afirmar
  browser pass de herencia donde faltan slots/media. Nueva Service mínima conserva
  sólo draft EN: publicar requiere cover y se detuvo sin añadir infraestructura.
- Q6 conservación:13filas históricas propias con hashes/estado/source_hash/xmin
  exactos más2identidades FAQ; bootstrap FAQ2/14/28 intacto. Cierre de12unidades
  principales con drafts nulos, compartidos/media/OG invariantes y36slugs exactos.
  Compatibilidad final12rutas+auth, GETs sin delta en42tablas QA. Root y QA
  compararon las42tablas originales del usuario: conteos/huellas exactos,
  Settings0. Evidencia `protected-user-comparison.json`; sin escrituras allí.
- Blog hero decorativo conserva ALT vacío por renderer; los campos heredados
  sin consumidor se registran como editor-only, no como traducción pública.
  Harness retoma checkpoints tras ajustes de selectores sin duplicar Publish.
  El PDF opcional inválido del fixture Real Estate se retiró por UI antes de sus
  ciclos; el label secundario sigue renderizado mediante el enlace fallback.
- QA aprueba producto exacto `b30a18c`; no hubo otro arreglo de fuente después
  de B3. Build corregido0/105rutas/2workers;68pure+4DB del lote2 y17focales B3,
  typecheck0/lint0(7warnings previos). Suites no ejecutadas permanecen explícitas.
  Informe independiente: [QA](translations-retirement-qa.md).

## Base y archivos preexistentes

Main `f947c4f`, workspace `/Users/maxi/Documents/claude-workspace/central-hill`.
Ya estaban modificados por la auditoría `entity-locale-editors-spec.md` y
`translations-final-closeout-review.md`, más `translations-retirement-plan.md`
nuevo. También existen el PNG de logo y `public/propertylocalesqa` sin seguimiento:
son ajenos a esta entrega y se preservan. No usar staging global.

Esta fase redacta spec y plan y pide adversarial. La implementación comienza sólo
después del cierre de los hallazgos; la revisión del plan no es una aprobación de
código ni de los E2E futuros.

## Preparación y contratos del orquestador

**O0 — Base revisable.** Guardar los documentos de la tarea y el resultado del
adversarial en un commit documental explícito cuando se inicie la ejecución.
Confirmar HEAD/status y registrar el commit fuente antes de abrir writers.

**O1 — Entorno.** Crear la base nueva aislada del spec y provisionar esquema
existente, cuenta Admin sintética/login normal, media local, puertos libres y
manifiesto de fixtures. No copiar auth/content de main o producción. Verificar
identidades y secretos sin mostrarlos. Mantener main3071 y su `.next` intactos.
Este gate debe completarse antes de QA con escrituras; la revisión de código y
pruebas puras pueden avanzar si una parte de la infraestructura está pendiente.
Las suites DB que creen/retiren slots o fuentes se ejecutan en otro target nuevo
`translationsretirementunitqa`, nunca en la base de los E2E. Cada target comprueba
host/DB/rol exactos. No reutilizar los DB names hardcodeados de las suites antiguas.

**Q0 — Manifiesto y baseline, antes de Q1.** QA inventaría campos/control/DOM de
todas las superficies y sus exclusiones explícitas, incluidos los casos
incrementales. El orquestador provisiona el baseline sintético de todas las
fixtures y media antes del primer build de QA. QA verifica que puede entrar por
login normal y que los públicos baseline existen. Si faltan helpers/bytes o una
referencia válida, se resuelve antes de empezar ediciones. Q3 revalida este
manifiesto/baseline para el candidato final; no lo descubre por primera vez.
La matriz principal comienza con cuatro publicaciones custom diferenciadas y
drafts nulos. Manifestar published/draft/working por separado. Las expectativas
inherit/custom se ejercitan en casos propios, sin contaminar ese baseline.
El preflight detectó cuatro Page scaffolds insertados por las propias migraciones
en la DB nueva. Adoptarlos sólo por CAS UPDATE ID/key/hash del inventario root;
no borrarlos/restaurarlos. Insertar los cinco slots restantes ausentes. Preservar
los dos grupos FAQ/14items/28traducciones del bootstrap; usar grupos propios extra.
Ver excepción concreta en el spec, limitada exclusivamente a esta nueva base.

**O2 — Contratos.** Estabilizar los helpers de resolución de padres que falten en
Geography y FAQ, con exports por `contract.ts`, y su política de ID inválido/padre
ausente. No cambiar los helpers existentes de Blog/Properties/Guides salvo un
fallo confirmado dentro del alcance. Registrar si algún destino ignora `locale`.
Los helpers de Geography/FAQ y todos los `contract.ts` son del orquestador, en una
base común que compila antes de abrir A/B. No introducir imports cruzados internos.
Registrar ADR0077 de retirada de S14 conservando el kernel y los datos.

**O3 — Aislamiento.** Crear worktrees/ramas desde esa misma base:

| Rol | Worktree propuesto | Rama |
| --- | --- | --- |
| Integración | `/private/tmp/central-hill-translations-retirement-integration` | `translations-retirement/integration` |
| A | `/private/tmp/central-hill-translations-retirement-actions` | `translations-retirement/actions` |
| B | `/private/tmp/central-hill-translations-retirement-routes` | `translations-retirement/routes` |
| QA/runtime | `/private/tmp/central-hill-translations-retirement-qa-runtime` | checkout del candidato de cada gate |

Si un path/rama ya existe, no reutilizarlo ni borrarlo a ciegas: inspeccionar y
elegir un sufijo nuevo. Registrar paths reales, branch y HEAD en el spec. Writer
envs sólo sintéticos; no hacen DB tests contra la base que usa QA. Un solo QA
serializa escrituras y guarda el manifiesto de sus IDs.

## Lote 1 Cerrar las operaciones y resolver enlaces

| Unidad | Dueño y archivos | Entrega verificable |
| --- | --- | --- |
| A1 Denegaciones | A: `src/slices/translation/admin/actions.ts`, `server/generate.ts`; tests nuevos `tests/retirement-actions.test.ts`, tests existentes de guardas bajo `translation/tests/` afectados y soporte propio | Las seis firmas antiguas conservan tipos compatibles y exigen staff antes de negar. `generateDrafts` falla sin cargar proveedor/contenido. Probar tipos conocidos/desconocidos/Forms, argumentos malformados y cero writes/llamadas al proveedor. Adaptar ahora los casos positivos FAQ y regex antiguos; no diferirlos hasta A2 dejando Q1 incoherente. |
| B1 Resolutor | B: nuevo `src/slices/translation/server/legacy-redirect.ts`, `tests/legacy-redirect.test.ts` y soporte propio | Resolver todos los destinos del spec a través de contratos, con fallbacks acotados y sin SQL ajeno/redirect abierto. Probar matrices de tipos, UUID inválido, padres ausentes y `locale` válido/inválido. No editar contratos compartidos. |
| O4 Ensamblaje | Orquestador: `translation/contract.ts`; ambas rutas app `translations/page.tsx` y `translations/[type]/[id]/page.tsx`; consumidor externo `pages/tests/page-locale-drafts.integration.test.ts` | Reexport del resolutor; rutas exigen sesión y redirigen. La raíz va a Pages. Integrar A1 y B1 secuencialmente antes de probar rutas. Ajustar la expectativa de rechazo del generador en el consumidor externo. No ejecutar su delete/restore Home en una base con contenido previo ni en los fixtures E2E. |

Dependencia: A1 y B1 son paralelizables después de O2/O3. No comparten archivos.
O4 consume ambos y es secuencial. En este candidato puede quedar el enlace del
menú: lleva a la ruta de compatibilidad, ya sin bandeja ni acciones útiles.

**Q1 — Gate del QA.** Candidato integrado con typecheck/lint focal y pruebas
relevantes y Q0 completo. Login normal, raíz con filtros, todos los destinos, padres ausentes,
IDs inválidos y sesión anónima. Confirmar que abrir enlaces no cambia contenido.
E2E incremental S1 ES: cambiar cuerpo/detalle/CTA/ALT en el servicio propio,
Save draft → recarga → público sin cambios → Publish → público actualizado.
Comprobar otros idiomas intactos. Reportar commit y evidencia antes del lote 2.
Service/Guide no tienen preview privado: se verifica draft recargado en el editor
y público baseline. Pages/Post sí ejercitan su preview existente.

## Lote 2 Retirar las superficies y el pipeline sin consumidores

| Unidad | Dueño y archivos | Entrega verificable |
| --- | --- | --- |
| A2 Retirada interna | A: `translation/admin/queries.ts`, `admin/derive.ts`, `admin/ui/{inbox,review,row-actions,entity-actions}.tsx`; tests exclusivos del pipeline, README de Translation | Retirar módulos sin consumidores después de las rutas nuevas. Mantener tests útiles adaptados a denegación/compatibilidad; no borrar pruebas de otro comportamiento para ocultar fallos. Documentar qué stubs de S14 quedan y por qué. |
| B2 Enlaces contextuales | B: `src/slices/pages/admin/ui/page-editor.tsx`; prueba focal nueva sólo si verifica comportamiento, no un espejo de JSX | Retirar las notas/enlaces a Translations sin cambiar el formulario, sus otros campos o publicación. Revisar por búsqueda si aparece otra referencia; informar al orquestador antes de ampliar archivos. |
| O5 Shell y mensajes | Orquestador: panel `layout.tsx`, `translation/admin/screens.ts`, `translation/contract.ts`, navegación Backoffice/types si procede y `messages/{en,es,pt,fr}.json` | Retirar registro/sidebar/grupo vacío y textos exclusivos huérfanos. Conservar roles. Retirar `TranslationFieldRow`/export sólo si no queda otro consumidor. No tocar kernel i18n ni lockfile. |

Abrir A2/B2 desde el gate Q1, con los commits de A1/B1 ya integrados; no seguir en
una base antigua. O5 elimina imports después de las entregas correspondientes y
ensambla un candidato que compila. Si se toca una UI, seguir la guía Impeccable
del repositorio para ese cambio acotado; no introducir un rediseño ni bucles de
screenshots/estética.

**Q2 — Gate del QA.** Sidebar/contextos sin traductor y URLs de compatibilidad
vivas; sin errores de consola por namespaces/exports retirados. E2E incremental
G1 PT: Guide title/intro + sección + lugar + ALT en su editor y salida pública;
otro target sin cambios. E2E incremental P7 FR: About copy y selección de su FAQ
propia, incluyendo blank sin herencia. Reabrir y comprobar aislamiento. Sólo el
orquestador asigna defectos a A/B; QA no corrige producto.

**B3 — Corrección acotada requerida por Q2.** QA reprodujo en `fc244bc` un P2
preexistente: seleccionar Certifications en About FR activa el error boundary
antes de guardar (por tanto pageerrors[] no basta para aprobar). `homeNode`
devuelve undefined para ALT dentro de una lista. El implementador B recibe nuevo
worktree `/private/tmp/central-hill-translations-retirement-page-array-fix`, rama
`translations-retirement/page-array-fix`, base `fc244bc`; escribe sólo
`pages/admin/home-contextual.ts` (función homeNode) y
`pages/tests/home-node-arrays.test.ts`. Recorrer índices canónicos de array hacia
element sin mutar datos ni unwrap hidden; mantener objetos/paths inválidos.
Test real About rojo antes del arreglo, luego suites focales y typecheck/lint.
QA retesta selección/edición/publicación de About FR y nested ALT en el nuevo
build. GuidePT y ausencia UI ya aprobados se conservan; la batería final todavía
no empezó. No se repite una matriz anterior ni se crea otro editor/preview.

## Lote 3 Verificación final por grupos pequeños

**O6 — Congelar producto.** Resolver hallazgos de Q1/Q2, revisar importaciones y
búsqueda completa de referencias al traductor. Mantener sólo compatibilidad
documentada. Ejecutar `pnpm typecheck`, `pnpm lint`, tests explícitos de acciones y
resolutores y regresión relevante. Build en QA, sin leer DB remota ni tocar main.
Registrar commit de producto; cambios posteriores sólo documentales hasta QA.

**Q3 — Confirmación del manifiesto y baseline final.** QA revalida el mapa de Q0
y registra cambios de fixture previstos después de Q1/Q2. El baseline final se
registra antes del build de O6; Q3 confirma que coincide. Si hay que corregir el
seed/media, hacerlo fuera de una unidad E2E y preparar un build nuevo en runtime
separado antes de comenzar Q4. No usar una publicación ajena o reinicio como parte
de un caso de revalidación.

| Gate final | Unidades completas EN/ES/PT/FR | Dependencias |
| --- | --- | --- |
| Q4a | Home + Owners + Guests: 12 | Baseline, referencias propias, FAQ groups. |
| Q4b | About + Real Estate + Buildings listing: 12 | Q4a almacenado; sin escribir sus Pages. |
| Q4c | Services listing + Guides listing + Blog listing: 12 | Referencias de servicio/guía/post ya publicadas. |
| Q5a | Blog article sidebar: 4 adicionales; Blog post: 4 | Q4c; conservar el resto del snapshot Blog al editar sidebar. |
| Q5b | Servicio: 4 | Q4c; comprobar también la tarjeta pública relevante tras publicar. |
| Q5c | Guía: 4 | Q4c; comprobar aside de Guides, sección/lugar y ruta pública. |

En Q4a (Owners), Q5a (Post), Q5b (Service) y Q5c (Guide), intercalar el caso de
TR13: Save draft EN + Save draft ES por navegador, ambos pendientes con sentinelas
distintos; guardar/publicar PT; comparar drafts/revisiones EN/ES exactos, sus
públicos baseline y FR intacto. Después completar EN/ES desde sus drafts con
Publish normal. Registrar cada estado intermedio; no aceptar una comparación con
drafts nulos como prueba de este requisito. No cambiar estructura/media compartida
en ese caso. Cuenta dentro de las cuatro unidades, no como repetición completa.

Cada gate es una ejecución manejable con su script y reporte. La suma es
**48 unidades principales + 4 del sidebar**, aparte de los tres casos incrementales
Q1/Q2. No sustituir el grupo de nueve Pages por una sola Page representativa.
Comprobar superficies desktop y una navegación/edición móvil representativa por
familia; el móvil no obliga a repetir los 52 ciclos completos.

Si un caso falla, detener su grupo y diagnosticar antes de repetir. Un arreglo de
producto invalida sus grupos dependientes; un selector roto sólo requiere retomar
la unidad afectada desde el estado comprobado, sin repetir Save/Publish ya hechos
a ciegas. El QA mantiene un registro del estado de cada unidad y revisión DB.

**Q6 — Compatibilidad y conservación.** Comprobaciones finales de rutas/stubs,
lectores históricos FAQ/ALT y fallback de fichas; referencias compartidas y slugs
sin cambios por las traducciones. Comparar contenido protegido del entorno del
usuario mediante lecturas acotadas y las invariantes del entorno QA, excluyendo
sólo escrituras previstas de fixtures/auth propias. No tomar un hash global de
QA como inmutable después de sus ediciones deliberadas.

## Entregas y comandos

Cada unidad A/B devuelve commit, archivos incluidos, comandos/exit codes,
riesgos y dependencias. El orquestador revisa su write set antes de integrar.
Los cambios compartidos tienen un único autor. No hay delegación anidada.

Pruebas de los lotes: Node22 + `pnpm exec tsx --test` con archivos explícitos y
tsconfig/loader local documentados si requieren contexto server-only. Las rutas
se comprueban por navegador y sus resolutores mediante tests de comportamiento.
Antes de fijar los comandos, enumerar las suites elegidas, sus guardas/fixtures y
DB destino. `fixed-navigation-guards.test.ts` deja de exigir generación/aprobación
de FAQ; los tests Settings/Testimonial dejan de esperar mensajes del pipeline
activo. Retargetar sólo las suites necesarias a la base unitaria nueva con guardas
exactas; ninguna prueba se ejecuta en `propertylocalesqa` o `pageeditors2qa` por
arrastrar su configuración antigua. Una suite de setup destructivo que no se
adapte queda fuera de los comandos, con su cobertura relevante reemplazada por
pruebas aisladas explícitas; no se declara aprobada ni se borra para ocultarla.

Allowlist inicial de ejecución, que el orquestador concreta en comandos antes
de los lotes; cualquier ampliación identifica primero efectos y target:

| Suite | Dueño de adaptación | Target permitido |
| --- | --- | --- |
| `translation/tests/retirement-actions.test.ts` nueva | A1 | Sin DB para spies de auth/contenido/proveedor; las invariantes SQL reales, si se incluyen, sólo en `translationsretirementunitqa` con guard exacto. |
| `translation/tests/legacy-redirect.test.ts` nueva | B1 | Mocks de contratos sin DB; resolución real por rutas se cubre en QA aislado. |
| `translation/tests/{fixed-navigation-guards,settings-website-guards,testimonial-quote-guards}.test.ts` | A1 adapta semántica; A2 retira únicamente pruebas de queries desaparecidas | Si hay SQL, sólo target unitario nuevo, guard/harness actualizados explícitamente. Preservar aserciones de datos intactos; ningún caso exige que FAQ siga generándose. |
| `pages/tests/editorial-engine.test.ts` | Sin cambio salvo defecto de la tarea | Pura, sin SQL; regresión de envelopes/herencia/identidad. |
| `pages/tests/page-locale-drafts.integration.test.ts` | Orquestador adapta sólo expectativa de rechazo afectada | **No se ejecuta en esta tarea**: su setup Home delete/restore y target anterior no son el entorno nuevo. La nueva prueba de denegación preserva snapshots y Q4a cubre publicación/aislamiento real de Pages. No se declara verde esta suite no ejecutada. |

Las suites DB de otras tareas y los glob amplios de `*.integration.test.ts` quedan
fuera de la ejecución. No utilizar un loader que salte guards o convierta una
escritura real en mock para presentar esa misma suite como prueba de persistencia.

Q6 debe reflejar soporte real de herencia: no existe control UI Reset/inherit
para targets ya custom. Los9Page keys están ocupados por fixtures propias y Post
exige cover/media sin un picker de assets existentes. Esas familias se verifican
mediante pruebas puras/helpers/fuente para target ausente, sin inventar browser
pass ni crear una feature/infra de uploads. Service/Guide pueden añadir ficha
source-only nueva por UI sólo si el flujo mínimo lo soporta; no se resetean los
targets ya probados. La tabla final separa evidencias browser y pure/source.
El requisito principal de52cicloscustom+aislamiento y las demás variantes Q6
permanece; no se relajan a raíz de un control que la tarea nunca debía construir.
Antes de QA final: `pnpm typecheck`, `pnpm lint`, suites relevantes y `pnpm build`
con identidad local verificada. `pnpm test`/`boundary:check` no son evidencia.
`db:check` sólo si el entorno de esquema lo requiere; no hay nueva migración.

QA conserva fuentes reutilizables y resultados por grupo bajo un directorio de
la tarea en `/private/tmp`, con JSON de casos/campos, URLs, revisiones observadas,
errores y comandos. Nada de contraseñas, cookies, tokens o `.env` en reportes.
Los scripts de QA no dependen de recuperar artefactos temporales viejos que
pueden haber desaparecido; sus dependencias se registran al provisionar.

## Adversarial y entrega

El QA revisa spec y plan antes de O0 de implementación: dependencias/propiedad,
conservación de datos, rutas huérfanas, cierre total de entrypoints, acceso normal,
aislamiento de fixed Pages, cobertura de los 52 ciclos, revalidación real,
fixtures previas al build y criterios de fallo. Registra severidad, evidencia,
corrección propuesta y resolución en `translations-retirement-adversarial.md`.
Hallazgos que comprometan TR01–TR17 se resuelven antes de comenzar su lote.

Después de Q6, QA entrega aprobación independiente del commit exacto. El
orquestador compara main con la base, conserva cambios ajenos e integra localmente
el candidato autorizado. No push/deploy. El cambio de localhost final se hace sólo
con candidato aprobado y cwd/env verificados; una apertura de lectura confirma
panel/URLs/editores, sin un nuevo ciclo sobre contenido del usuario. Se preservan
worktrees, artifacts, envs, caches, logo y symlink de medios.
