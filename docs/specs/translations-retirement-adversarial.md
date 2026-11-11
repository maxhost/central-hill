# Revisión adversarial del spec y plan de retirada de Translations

2026-11-11. QA independiente. Base de código `f947c4f`; revisión documental de
`translations-retirement-spec.md` y `translations-retirement-execution-plan.md`,
contrastada con los consumidores y pruebas actuales. Sin ejecución de producto,
tests, build, navegador o SQL. Sólo se escribe este reporte.

**Resultado inicial: cambios requeridos en el plan antes de ejecutar los gates
afectados.** No hay hallazgos P1. Hay tres ajustes P2 y una recomendación P3.
Son huecos de secuencia/cobertura del plan; no prueban defectos del producto.

## P2 AD01 Adaptar las pruebas de acciones en el mismo lote que las acciones

Evidencia:

- Plan de ejecución, líneas 57 y 65: A1 cambia todas las acciones/generador y Q1
  requiere pruebas relevantes aprobadas.
- Plan, línea 76: la adaptación genérica de pruebas antiguas queda asignada a A2,
  que ocurre después de Q1.
- `src/slices/translation/tests/fixed-navigation-guards.test.ts:51` exige que FAQ
  siga siendo revisable, aprobable y generable. Sus líneas 56–60 esperan éxito.
- Ese mismo archivo, línea 40, y
  `src/slices/translation/tests/settings-website-guards.test.ts:32` verifican
  mensajes antiguos específicos del generador.
- `src/slices/pages/tests/page-locale-drafts.integration.test.ts:121` importa
  `generateDrafts` por el contrato público; la línea 127 exige `/page editor/`.
  Este archivo está fuera del write set asignado a A.

Riesgo: el gate Q1 sólo podría pasar omitiendo regresiones afectadas o cambiando
archivos no asignados. El caso positivo de FAQ contradice deliberadamente el
nuevo comportamiento, no es un fallo de producto que deba preservarse.

Corrección: asignar a A1 las adaptaciones de expectativas de acciones/generador
en los tests propios de Translation, conservando las aserciones de no escritura.
Reservar a A2 únicamente los cambios asociados a eliminar queries/derivación/UI.
El orquestador debe ser dueño explícito del ajuste del consumidor externo de
Pages, o conservar un mensaje compatible documentado. Registrar qué regresiones
se ejecutan por lote; no eliminar pruebas de conservación de datos.

Gate: resolver antes de integrar A1 y aprobar Q1.

## P2 AD02 Definir qué hacer con las suites DB antiguas antes de ejecutarlas

Evidencia:

- Spec, líneas 152–158: todas las escrituras van a una base nueva de la tarea,
  sin usar `propertylocalesqa` ni Neon remoto.
- Plan, líneas 140–145: ordena pruebas/regresión relevantes, pero no identifica
  las suites DB que se excluyen o adaptan a ese entorno nuevo.
- `src/slices/translation/tests/settings-website-guards.test.ts:20` y
  `fixed-navigation-guards.test.ts:18` exigen hostname, DB y rol
  `propertylocalesqa`; después crean/borran filas.
- `src/slices/pages/tests/editorial-test-environment.ts:6` exige
  `pageeditors2qa`, con verificaciones SQL en las líneas 10–11.
- `src/slices/pages/tests/page-locale-drafts.integration.test.ts:23` toma
  snapshots de Home y, en las líneas 33–40, lo modifica y hace delete/restore.
  No es seguro ejecutarlo en la base que contiene las fixtures E2E en curso.

Riesgo: para conseguir que una regresión antigua arranque se podría apuntar al
entorno anterior, debilitar su guard o destruir/reponer un fixed Page key usado
por otro grupo. Son alternativas incompatibles con el spec.

Corrección: añadir un inventario explícito de suites permitidas. Las pruebas
puras y de dependencias con mocks no requieren DB. Las pruebas nuevas de no
escritura y lector histórico deben verificar el hostname/DB/rol exactos nuevos.
Si se decide reutilizar una suite DB antigua, asignar su adaptación a un dueño y
ejecutarla en una base scratch propia sin fixtures E2E activas; no aceptar una
allowlist amplia de nombres ni quitar guards. Las suites destructivas no elegidas
se declaran fuera de la ejecución con su cobertura equivalente identificada,
sin presentarlas como aprobadas.

Gate: resolver la selección/harness antes de cualquier suite con escrituras y
antes de O6. No bloquea el trabajo puro de A1/B1.

## P2 AD03 Hacer no vacua la prueba de borradores simultáneos entre idiomas

Evidencia:

- Spec TR13, línea 52: publicar un target no debe publicar cambios pendientes
  en EN u otros targets.
- El ciclo de las líneas 124–136 guarda y publica cada idioma antes de pasar
  al siguiente. La comparación con otros idiomas puede tener todos sus drafts
  vacíos y no demostrar la condición de TR13.
- Plan Q1/Q2, líneas 68–90, pide aislamiento pero tampoco reserva un caso con
  borradores pendientes simultáneos.

Riesgo: aprobar todas las comparaciones de snapshots sin ejercitar el caso
concreto de EN/otro target pendientes que exige el spec.

Corrección: añadir un caso acotado por familia (Pages, Post, Service y Guide)
que prepare por navegador un draft EN y otro target con sentinelas inéditos,
guarde/publica un tercer idioma y verifique que los dos borradores y revisiones
pendientes se conservan, y que el público de esos idiomas sigue en su baseline.
Publicar o descartar después sólo esos drafts propios mediante el editor para
continuar los ciclos finales. Registrar los snapshots públicos y draft por
separado. Este caso puede integrarse en una de las cuatro unidades de cada
familia; no requiere repetir todos los ciclos ni aumentar la matriz completa.

Gate: incorporar al manifiesto/harness antes de los E2E finales de cada familia.

## P3 AD04 Adelantar el manifiesto de campos y fijar baselines por idioma

Spec, línea 114, exige el manifiesto antes de los E2E; el plan lo sitúa en Q3,
después de los incrementales Q1/Q2. Conviene definir una entrega Q0 del QA antes
del primer E2E y ampliarla para Q3. Seed → build → start → prueba debería ser
el orden explícito también para los dos candidatos incrementales, no sólo el
final; la excepción de reordenar O6/Q3 puede sustituirse por ese orden directo.

El manifiesto debe distinguir publicaciones y drafts iniciales EN/ES/PT/FR de
los valores `working` que proyecta cada editor. Por ejemplo,
`src/slices/services/server/locale-model.ts:48` usa modo `inherit` cuando falta
un target y proyecta el template EN en las líneas 49–52. La matriz principal
puede comenzar con publicaciones propias para los cuatro idiomas; los casos
inherit/custom deben tener expectativas distintas y explícitas. Un cambio
esperado en `working` no equivale a un cambio de publicación o de draft guardado.

No bloquea la arquitectura ni requiere cambios de producto.

## Aspectos correctos del plan

- Dos implementadores con write sets diferentes; contratos, app shell y mensajes
  del orquestador; integración secuencial y QA sobre candidato integrado.
- Cierre universal de acciones/generación, incluidos tipos desconocidos y Forms,
  en lugar de ampliar indefinidamente exclusiones del inbox.
- Conservación de `core/i18n`, datos históricos, FAQ independiente por idioma y
  ALT del documento; no se inventa un editor de City intro ni una media library.
- Base nueva y medios sintéticos, login normal, protección de main3071 y
  rechazo explícito de extracción de tokens/cookies manuales.
- 48 ciclos principales más cuatro del sidebar, sin reducir las nueve Pages a
  una muestra; prueba pública sin sesión y sin aceptar scripts RSC como DOM.
- E2E incremental y una batería final después de retirar todo el traductor,
  sin cache flush/restart como forma de demostrar revalidación.

## Resolución

Relectura focal independiente el 2026-11-11 tras las correcciones documentales
del orquestador. **Spec y plan aprobados documentalmente para ejecutar sus gates.**
Los tres P2 y la recomendación P3 quedan cerrados:

| Hallazgo | Resolución comprobada |
| --- | --- |
| AD01 | A1 posee las adaptaciones semánticas de guardas/FAQ y mensajes; O4 posee el consumidor externo Pages. A2 queda para las queries/UI retiradas. Evidencia: plan A1/O4, líneas 72–74, y allowlist, líneas 181–185. |
| AD02 | O1 introduce el target unitario nuevo separado del E2E con guard exacto. La allowlist asigna adaptaciones y excluye expresamente la suite Home delete/restore y los glob de integración antiguos; nombra su cobertura equivalente y prohíbe declararla aprobada. Evidencia: plan líneas 31–33 y 167–189; spec líneas 111–117. |
| AD03 | Caso intercalado real para Page/Post/Service/Guide: drafts EN/ES pendientes, Publish PT, snapshots/revisiones exactos y públicos baseline; después completar los drafts por UI dentro de las cuatro unidades. Evidencia: plan líneas 132–138 y spec líneas 146–154. |
| AD04 | Q0 entrega manifiesto y baseline antes de Q1, con cuatro publicaciones propias, drafts nulos y estados published/draft/working diferenciados. Media/fixtures preceden el build y Q3 sólo confirma el candidato final. Evidencia: plan líneas 35–44 y 116–121; spec líneas 119–125 y 186–195. |

ADR0077 está creado e indexado y conserva el límite entre retirada de S14 y
kernel/datos multilingües. No se identifican blockers documentales pendientes.
El historial de hallazgos anterior se conserva como evidencia de la revisión.

Esta aprobación corresponde al **diseño y secuencia del trabajo**. No aprueba
código ni E2E: no se ejecutaron producto, tests, build, browser o SQL en esta
revisión. O0–O6, los lotes A/B, los gates incrementales y los 52 ciclos finales
siguen pendientes y deben producir su propia evidencia antes de la entrega.
