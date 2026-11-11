# Plan de ejecución por etapas para retirar Translations

2026-11-11. Depende del [spec](translations-retirement-spec.md). El inventario y
las decisiones de producto están en la [auditoría](translations-retirement-plan.md).
Estado: adversarial documental aprobado, AD01–AD04 cerrados. Preparación O0–O3
en inicio; no hay lotes de producto ni E2E aprobados todavía.

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
