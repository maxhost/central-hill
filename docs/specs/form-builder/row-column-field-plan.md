# Plan de implementación — Forms por filas, columnas y campos

Fecha: 2026-11-11. Estado: **plan preparado; implementación no iniciada**.

Base revisada: `226d0d8f74e7bc9b5517d79ee4be83a5f3c71fab`, rama `main`.
Spec funcional: propuesta acordada en la conversación después de Date/File:
añadir filas de una o dos columnas, añadir un campo dentro de cada columna,
editar sus propiedades en el inspector y controlar la posición directamente.
Este documento concreta la implementación de ese acuerdo.

Referencias: [Forms](../../../src/slices/forms/README.md),
[Date/File](date-file-fields.md),
[ADR0038](../../decisions/0038-form-builder-and-resend.md),
[ADR0078](../../decisions/0078-form-date-and-email-attachments.md),
[procedimiento](../../multi-agent-workflow.md).

## 1. Resultado esperado y reglas de interacción

La jerarquía será **formulario → paso → fila → columna → campo**. Un formulario
de un solo paso usará exactamente el mismo modelo. El inspector conserva la
configuración general, los textos y las propiedades de los nueve tipos actuales.

| Acción | Comportamiento previsto |
|---|---|
| Añadir fila | Elegir una o dos columnas y añadirla al paso activo. |
| Añadir campo | Cada columna vacía muestra su propio botón; elegir tipo crea y selecciona el campo allí. |
| Seleccionar | El título selecciona el formulario; los controles de fila seleccionan la fila; el campo selecciona sus propiedades. |
| Reordenar filas | Controles subir/bajar; la fila viaja con sus campos. |
| Mover campo | Destino explícito: paso, fila y columna. Si está ocupado, ofrecer intercambiar; nunca sobrescribir silenciosamente. |
| Cambiar una columna a dos | Conservar el campo existente a la izquierda y crear una columna vacía a la derecha. |
| Cambiar dos columnas a una | Si ambas tienen campo, convertirlas en dos filas consecutivas de una columna, izquierda antes que derecha. Con cero o un campo, conservar una sola fila. |
| Quitar campo | Vaciar esa columna sin eliminar automáticamente la fila. Limpiar reply-to solo si apuntaba al campo eliminado. |
| Quitar fila | Vacía: inmediato. Con campos: confirmación en la interfaz que indique qué se eliminará del borrador. Persistencia solo con Save. |
| Cambiar paso de una fila | Trasladar la fila completa con sus campos al final del paso de destino. |
| Quitar paso | Mantener la regla actual de conservar contenido: trasladar sus filas, en orden, al final del primer paso restante. |
| Móvil | Apilar por fila, izquierda y después derecha; omitir huecos sin cambiar los datos guardados. |

Cada columna contiene **cero o un campo** en esta primera entrega. Más campos se
añaden mediante más filas; no habrá columnas con listas anidadas ni filas dentro
de columnas. Los huecos se pueden guardar para continuar construyendo: la prueba
omite filas totalmente vacías y conserva la posición derecha de una columna
ocupada en escritorio. En móvil, los huecos no generan espacios vacíos.

Se retiran del editor el selector global de columnas y el ancho individual del
campo. Se mantienen las pestañas EN/ES/PT/FR, el inspector, la prueba de la versión
guardada y los controles de tamaño de preview. Las operaciones de estructura se
hacen en EN; los demás idiomas conservan su edición de textos y la misma estructura.

La primera entrega usa botones y destinos accesibles con teclado. Arrastrar y
soltar no es una dependencia ni un requisito de este plan.

## 2. Auditoría técnica y modelo propuesto

Actualmente `FormBlueprint` tiene `schemaVersion:1`, `columns` global y campos
planos con `stepId` y `width`. Editor y runtime calculan la distribución mediante
CSS Grid. `form_definition.definition` y los snapshots de prueba son JSONB: el
cambio puede hacerse sin ALTER TABLE, nueva tabla, backfill o migración SQL.

Se introducirá `schemaVersion:2` con estos contratos:

| Entidad | Información propia |
|---|---|
| Formulario | Pasos, filas ordenadas, catálogo de campos, textos y reply-to. |
| Fila | ID estable, paso propietario y una o dos columnas ordenadas. |
| Columna | ID estable y referencia a un campo, o vacío. |
| Campo | El mismo ID y propiedades actuales, sin ancho ni paso duplicados. |

El paso de un campo se deriva de su fila. El número de columnas se deriva de la
lista de columnas; no habrá otro contador editable que pueda contradecirla.
Los campos permanecen en un catálogo plano por identidad, referenciados desde
las columnas. Sus IDs, opciones y rutas `block:fields.<id>.*` se conservan.

Un helper común resolverá filas de un paso, ubicación de un campo y campos en
orden visual: pasos → filas → izquierda/derecha. Editor, runtime, validación y
notificación usarán ese mismo orden; no podrán discrepar por el orden del catálogo.
Filas y columnas no contienen textos traducibles nuevos.

Se mantienen 40 campos, 6 pasos y 30 opciones por select. Se acotan a 40 las filas
totales, incluidas las vacías. Toda operación que exceda un límite se rechaza con
un mensaje, sin aplicar un cambio parcial ni descartar campos.

## 3. Compatibilidad y guardado

1. Conservar un tipo/validador explícito del formato v1 y otro del formato v2.
   Los JSON persistidos y snapshots históricos pueden seguir siendo de cualquiera
   de ambas versiones; la interfaz nueva trabajará con v2 normalizado.
2. Convertir v1 en memoria mediante una función pura y determinista. No generar
   IDs nuevos en cada render ni marcar el formulario como modificado solo al abrirlo.
3. Con una columna global, crear una fila de una columna por campo. Con dos,
   reproducir la colocación actual por paso: dos campos de medio ancho pueden
   compartir fila; un campo de ancho completo ocupa una fila de una columna.
4. Un campo de ancho completo cierra cualquier media fila pendiente. Ejemplo:
   medio A → completo B → medio C se convierte en A/ vacío, B, C/ vacío;
   **no** juntar A y C cruzando B. Una media fila final mantiene su mitad vacía.
5. Preservar IDs de campos, pasos, opciones, textos, reglas, recipient, reply-to y
   traducciones; derivar IDs de filas/columnas legacy estables sin escrituras.
6. Crear formularios nuevos directamente en v2. Guardar la conversión de uno
   existente únicamente al hacer Save EN explícito, con la revisión esperada.
7. Guardar una traducción no convierte ni reescribe la definición legacy. Mover
   campos no cambia rutas de traducción ni marca como obsoleto un texto idéntico.
8. La prueba siempre parte de la definición persistida, normalizada y localizada;
   nunca del layout sin guardar. El nuevo snapshot describe esa versión efectiva
   con la revisión guardada. No se reescriben snapshots históricos.
9. Rechazar versiones desconocidas y downgrade v2→v1. Un cliente antiguo no
   debe poder borrar las filas de una definición v2; aplicar control de revisión
   y mensaje de recarga antes de cualquier escritura.
10. Si un JSON legacy no cumple su propio contrato, mostrar un error legible;
    nunca reparar descartando campos o referencias silenciosamente.

## 4. Fases y puertas de salida

| Fase | Trabajo | Evidencia para continuar |
|---|---|---|
| 0 · Contratos | Registrar ADR del modelo JSON v2, tipos v1/v2, helpers de layout y contratos de normalización/operaciones. Definir firmas y errores. | Contratos revisados y pruebas puras de normalización/orden; commit base compartido antes de delegar. |
| 1A · Modelo y servidor | Adaptar plantillas, validadores, carga/guardado y snapshots. Resolver orden visual en correos y mantener identidades i18n. | Pruebas focalizadas de compatibilidad, límites, revisiones y entradas inválidas. |
| 1B · Editor y runtime | Canvas por filas con botones por columna, inspector de fila, movimientos, colapso sin pérdida y runtime responsive. Añadir textos en cuatro idiomas. | Comprobaciones de operaciones, controles accesibles y render de filas. |
| 2 · Integración | Integrar A/B secuencialmente, resolver referencias y revisar que ningún consumidor siga dependiendo de columnas/ancho legacy. | Typecheck, lint, pruebas afectadas y build del candidato integrado. |
| 3 · QA independiente | Guardado/recarga y pruebas de formularios v1/v2 en entorno aislado; desktop/móvil, idiomas y Date/File. | Informe contra commit exacto, con casos ejercitados y sin bloqueantes abiertos. |
| 4 · Entrega local | Incorporar el candidato aprobado al localhost dentro del alcance autorizado y documentar evidencia. | Código igual al aprobado, apertura final de solo lectura y estado Git claro. |

Dependencias: `0 → (1A || 1B) → 2 → 3 → 4`. La fase 0 entrega contratos
consumibles; ningún implementador inventa una variante distinta del modelo.
No se crean agentes, ramas o worktrees como parte de esta planificación.

## 5. Reparto previsto de archivos

Rutas relativas a `src/slices/forms/`, salvo indicación. Los nombres nuevos son
propuestos; se confirman al congelar contratos sin permitir dos escritores por archivo.

| Responsable | Archivos de escritura |
|---|---|
| Raíz/orquestador | `types.ts`, `contract.ts`, nuevos `layout.ts` y `tests/layout.test.ts`, ADR y este plan. Integración y documentación final de `README.md`. |
| Implementador A | `domain.ts`, `validation.ts`, `schema.ts` (tipos TypeScript; sin DDL), `server/queries.ts`, `server/actions.ts`, `server/notification.ts`, `server/attachments.ts` si requiere recorrer el orden común; `tests/forms.test.ts`, `tests/attachments.test.ts`, nuevos `tests/layout-persistence.integration.test.ts`. |
| Implementador B | `admin/form-editor.tsx`, nuevos `admin/form-layout-canvas.tsx` y `admin/form-row-controls.tsx` si ayudan a dividir el editor; `ui/form-runtime.tsx`, `messages/{en,es,pt,fr}.json`, `tests/runtime-date-file.test.tsx` y nuevas pruebas de interacción del layout. |
| QA independiente | Harness, capturas e informe en directorio temporal propio; producto de solo lectura. Las correcciones vuelven al escritor asignado. |

Worktrees previstos para la implementación, todavía no creados:

- Integración: `/private/tmp/central-hill-form-row-layout-integration`, rama `forms/row-layout-integration`.
- A: `/private/tmp/central-hill-form-row-layout-model`, rama `forms/row-layout-model`.
- B: `/private/tmp/central-hill-form-row-layout-editor`, rama `forms/row-layout-editor`.
- Runtime y evidencia: `/private/tmp/central-hill-form-row-layout-runtime` y
  `/private/tmp/central-hill-form-row-layout-qa`.

Verificar base, cwd, branch y estado antes de ejecutar el plan. Registrar cualquier
cambio posterior del usuario. Mantener los archivos ajenos separados del cambio.
No se prevén cambios en `core/email`, `core/auth`, el kernel i18n ni `next.config.ts`.

## 6. Validaciones e invariantes

- Cada fila pertenece a un paso existente y contiene exactamente una o dos columnas.
- Cada campo aparece exactamente una vez; ninguna referencia apunta a un campo inexistente.
- IDs de filas, columnas, pasos, campos y opciones válidos y únicos según su contrato.
- Rechazar campos huérfanos, duplicados, referencias cruzadas inválidas y versiones desconocidas.
- Un movimiento conserva la identidad y las traducciones del campo. Intercambiar
  posiciones conserva ambos campos y sus propiedades.
- Las operaciones son atómicas en el borrador: ningún paso intermedio inválido
  puede perder campos, dejar referencias rotas o desincronizar la selección.
- Tras quitar la selección activa, el inspector enfoca un elemento existente;
  insertar o mover un campo mantiene su selección y lleva al paso correcto.
- Respetar el guardado explícito, trabajo local de otros idiomas, dirty real,
  conflicto entre pestañas, archived y comprobación de permisos actuales.
- Date conserva YYYY-MM-DD; File conserva bytes, límite de 5 MiB por archivo,
  20 MiB total y metadatos sin bytes en DB. Mantener sus inputs montados y claves
  estables al navegar los pasos de la prueba; cancelar sigue limpiando selecciones.

## 7. Matriz de verificación

| Grupo | Casos mínimos |
|---|---|
| Legacy | Tres plantillas v1; uno/dos globales; medias filas impares; medio/completo/medio; varios pasos; normalización repetida idéntica; abrir sin writes ni dirty. |
| Operaciones | Añadir fila/campo; 1→2 y 2→1 con cero/uno/dos campos; subir/bajar; mover e intercambiar; mover entre pasos; quitar campo/fila/paso; límites sin pérdidas. |
| Persistencia | V1 se lee sin convertir DB; Save EN escribe v2 una vez; recarga conserva layout/IDs; Save de traducción no convierte v1; conflicto entre dos pestañas y rechazo de downgrade sin modificación. |
| Idiomas | Mover filas/campos no cambia rutas, valores ni estados de traducción existentes. Comprobar EN/ES/PT/FR y fallback aprobado actual. |
| Runtime | Igual orden en canvas, DOM, teclado, prueba y correo. Dos columnas desktop, apilado móvil, derecha ocupada/izquierda vacía y filas vacías sin espacios. |
| Date/File | Campo obligatorio, fecha válida/incorrecta; archivo exacto 5 MiB, rechazo de mayor/spoof; vuelta entre pasos conserva archivo; cancelar lo limpia; bytes exactos del adjunto en transporte falso. |
| Acceso y estados | Anónimo, archived, guardado pendiente, errores visibles, falta de recipient y prueba exclusiva de versión guardada. |

Ejecutar con Node22 y pnpm: pruebas explícitas de `forms/tests/forms.test.ts`,
`layout.test.ts`, `attachments.test.ts`, `runtime-date-file.test.tsx`, nuevas
pruebas de interacción/persistencia y la regresión de
`src/core/email/tests/resend.test.ts`. Usar `node --import tsx --test ...` cuando
el CLI de tsx encuentre la limitación IPC documentada del sandbox.

Sobre el candidato integrado: `pnpm typecheck`, `pnpm lint`, `pnpm build` en
runtime separado, dos workers, y revisión explícita de fronteras. `pnpm test` y
`boundary:check` son placeholders y no cuentan. No hace falta `db:check` si el
alcance sigue sin migraciones. Registrar comandos reales, resultados y commit.

QA ejecuta una pasada funcional acotada y corrige/repite únicamente los casos
afectados por defectos confirmados; no ampliar a matrices públicas ajenas.

## 8. Entorno y límites de ejecución

Planificación actual: solo se escribe este documento. No hay cambios de producto,
DB, env, servidor, caché o formularios guardados, ni agentes de implementación iniciados.

Al implementar, las escrituras de QA serán solo fixtures propias en una base
sintética aislada, con host/DB/rol verificados y login normal. Registrar su identidad
y autorización antes de escribir; no asumir aislamiento por usar localhost ni
modificar el formulario del usuario para probar. Si hace falta provisionar esquema
o una base no autorizada, resolver ese requisito antes de la fase dependiente.
Usar correo interceptado con credenciales ficticias; la configuración local real
sigue siendo console y no acredita entrega de email.

Preservar `.env.local`, `.next`, worktrees, fixtures previas, PNG del logo y
`public/propertylocalesqa`. Mantener el localhost actual durante la implementación
aislada; cualquier reapertura final debe cargar el adaptador local correcto del
proxy4558. No conectar estos formularios a Services/Guides/Pages, ni añadir
publicación pública, nuevas plantillas, drag-and-drop, SMTP/configuración Resend,
schema SQL, push o deploy dentro de este cambio.

Antes de comenzar la fase 0, revisar este plan buscando pérdida de campos,
conversiones inesperadas, desajustes de orden/idioma y regresiones de Date/File.
La implementación queda pendiente de la siguiente instrucción del usuario.
