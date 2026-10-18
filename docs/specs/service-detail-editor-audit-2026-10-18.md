# Auditoría del editor de servicios individuales

Fecha: 2026-10-18. Estado: auditoría y propuesta; implementación no iniciada.
Continuación: [spec de ejecución](service-detail-editor-execution.md), con contrato,
ownership, gates y criterios de QA. Su preparación no inicia implementación.

## Alcance y procedencia

Petición: evaluar con agentes cómo editar contenidos generales y seleccionar las secciones
de cada servicio en `/admin/services`, conservando el layout público común. Incluye textos,
labels, iconos, imágenes, tarifas y SEO por servicio. No confundir con el editor editorial
del listado `/admin/pages/services`, entregado en la tarea anterior.

Base auditada: `main`, `62b622b534587d30189943696a02d28e1cbbd4d8`, checkout
`/Users/maxi/Documents/claude-workspace/central-hill`, sin cambios previos.
Orquestador: síntesis y documentación. Tres agentes de solo lectura: modelo/persistencia,
UX del formulario y contraste independiente de los diez servicios publicados. Sin escritores
paralelos, worktrees nuevos, cambios de aplicación, guardados de contenido ni escrituras remotas.
Escritura exclusiva del orquestador: este informe y el puntero de tarea en `AGENTS.md`.

Referencias: `CLAUDE.md`, `docs/multi-agent-workflow.md`, README de Services, spec/handoff
del editor del listado y ADR 0006/0007, 0012/0013, 0019/0021, 0030 y 0034.
Guía UX: habilidad Impeccable, modo Operate, preservando el backoffice existente.

## Veredicto

La propuesta es viable y gran parte de los campos ya existe. Conviene elegir qué secciones
mostrar mediante activaciones independientes y desplegar únicamente sus campos. Un selector
obligatorio y exclusivo entre tres alternativas no cubre todos los casos: Luggage storage
usa socios y ningún bloque de esos tres; el modelo también admite combinaciones futuras.
No hace falta cambiar el layout público ni crear un constructor libre de páginas.

## Matriz del contenido publicado

Contraste de HTML SSR obtenido por HTTP de solo lectura del host
`https://central-hill-umber.vercel.app/es/services/`, para los diez slugs indicados por el owner.
La matriz distingue el importe destacado de la sección de tabla de tarifas.

| Servicio / slug | Sección entre las tres consultadas | Tabla de tarifas | Otros bloques variables | Importe destacado |
|---|---|---|---|---|
| `private-airport-transfer` | Qué incluye | Sí | — | Sí |
| `luggage-storage` | Ninguna | No | Socios | Bajo consulta |
| `chef-at-home` | Opciones | Sí | — | Sí |
| `grocery-pre-stocking` | Qué incluye | No | — | Sí |
| `babysitting` | Qué incluye | No | — | Sí |
| `mid-stay-housekeeping` | Qué incluye | No | — | Sí |
| `sintra-day-tour` | Qué harás / itinerario | Sí | — | Sí |
| `fatima-tour` | Qué harás / itinerario | Sí | — | Sí |
| `tagus-sunset-sailing` | Opciones | Sí | Extras | Sí |
| `surf-lesson` | Qué incluye | Sí | — | Sí |

Todos incluyen «Conviene saber». Hoy no se observó coexistencia entre los tres bloques
consultados; su independencia está demostrada por schema y renderer, no por una página
publicada que actualmente combine los tres. El seed local sirve de contraste, no sustituye
la evidencia remota ni describe necesariamente futuras ediciones del catálogo.

## Qué existe y qué falta

| Área | Estado actual y evidencia | Mejora necesaria |
|---|---|---|
| Modelo de secciones | `services/detail.ts:112`: listas independientes para incluidos, itinerario, opciones, tarifas, extras y socios | Configuración explícita para ocultar conservando contenido |
| Render público | `services/ui/service-detail.tsx:324`: muestra cada bloque si tiene contenido; orden fijo | Respetar activaciones sin alterar composición |
| Formulario | `services/admin/ui/detail-editor.tsx:195` y `service-form.tsx:357`: campos existentes para todos los bloques, siempre expuestos | Resumen de secciones y campos condicionales |
| Títulos y labels | Solo About e incluidos tienen override de título; la mayoría de encabezados y CTA salen de mensajes compartidos | Overrides opcionales traducibles por servicio, con fallback actual |
| Iconos | Facts propios; incluidos, badges y Conviene saber heredan Settings (`service-detail.tsx:158`, `:329`, `:384`) | Overrides por servicio con fallback a Settings y luego defaults |
| Medios | Portada, galería, OG y miniaturas del itinerario ya existen | Conservar selectores; aclarar alt compartido del recurso frente a override contextual |
| SEO | Ruta `src/app/[locale]/services/[slug]/page.tsx:29`: meta title, description, OG y alternates por servicio | Mantener, con feedback de fallback; no duplicar SEO del listado |
| Precio | `service-form.tsx:369`: importe en céntimos; tabla/extras son texto libre | Editar euros en la interfaz y convertir a céntimos al guardar; separar controles |

Rutas abreviadas `services/…` en esta tabla corresponden a `src/slices/services/…`.
La etiqueta guardada `cta_label` no controla actualmente el CTA principal de solicitudes:
en modo enquiry el renderer genera el texto desde mensajes (`service-detail.tsx:170`).
Debe cerrarse esa correspondencia para cumplir «labels editables por servicio».

## Propuesta de UX

Mantener el lenguaje visual y componentes actuales. Un formulario por servicio, con grupos
claros y en orden de trabajo:

1. **Información general:** nombre, categoría, slug, descripción corta y presentación; datos
   destacados e iconos, duración y badges. Estado y orden editorial claramente identificados.
2. **Imágenes:** portada, galería y, dentro de cada paso, su miniatura. OG se presenta en SEO.
3. **Secciones del servicio:** resumen con casillas independientes «Qué incluye», «Qué harás»,
   «Opciones» y «Socios». Cada fila indica activa/oculta y cantidad de elementos. Al activar
   se abre el editor correspondiente; las inactivas no exponen campos vacíos. Se permite
   ninguna de las tres primeras o varias. «Conviene saber» mantiene su editor propio.
4. **Precio y reserva:** presentación del importe destacado, tabla de tarifas, extras y modo
   de solicitud/reserva. Activar tabla y activar extras son decisiones separadas. El tipo de
   reserva no depende del bloque editorial seleccionado.
5. **SEO:** título, descripción e imagen social específicos; mostrar claramente los fallbacks.

Ejemplo de configuración del Chef:

```text
Secciones del servicio
  [ ] Qué incluye
  [ ] Qué harás
  [x] Opciones                    3 grupos · Editar
  [ ] Socios

Precio y reserva
  Precio destacado: Desde un importe
  Importe: 35,00 €     Unidad: / persona
  [x] Mostrar tabla de tarifas
  [ ] Mostrar extras
```

El ejemplo es de estructura de interfaz, no un mock visual implementado ni una promesa de
sincronización automática entre tabla e importe destacado.

Campos contextuales:

| Sección | Campos al activarla |
|---|---|
| Qué incluye | Label, título, icono del bloque y lista de incluidos |
| Qué harás | Label, título y pasos con marcador horario, título, descripción y foto opcional |
| Opciones | Label, título, grupos y opciones con nombre/descripción opcional |
| Tarifas | Label, título, columnas, filas, importes/textos y nota al pie |
| Extras | Nombre, precio mostrado y descripción de cada extra |
| Socios | Label, título, nombre, descripción, texto del botón y enlace de cada socio |
| Conviene saber | Labels e iconos de columnas; incluidos, cancelación e información práctica |

Las opciones actuales son contenido informativo: no son un selector de compra ni variantes
con precio calculado. Vincular automáticamente una opción a una tarifa sería otra capacidad,
que esta propuesta no presupone.

No hacer obligatoria una plantilla por tipo de servicio ni derivar secciones de la categoría.
Se pueden ofrecer configuraciones iniciales para altas, como comodidad opcional posterior.
Los servicios existentes deben abrir con su configuración actual ya reconocida.

### Estados y comportamiento

- **Contraer** un editor solo cambia la interfaz. **Ocultar** modifica la página pública.
  **Eliminar** borra contenido mediante una acción explícita. Son acciones distintas.
- Desactivar conserva contenido válido también después de guardar/recargar. Reactivar lo
  recupera. No utilizar vaciado de arrays como mecanismo para ocultar.
- Activar un bloque nuevo revela campos y ayuda concreta. Antes de publicarlo se valida
  su contenido mínimo; errores junto al campo y resumen que abre y enfoca el bloque afectado.
  Los controles condicionales deben funcionar con teclado y anunciar su estado.
- Mantener las reglas de formato del contenido persistido incluso cuando esté oculto.
  No guardar JSON inválido para evitar un error; separar entradas transitorias del formulario
  de contenido persistible. La política de borradores incompletos se define antes de implementar.
- Avisar sobre cambios sin guardar y mostrar feedback claro de guardado. Una vista previa
  local del formulario debe distinguirse de «Ver página», que muestra lo guardado/publicado.
  El preview de borradores no existe como capacidad demostrada y requiere trabajo explícito.
- Los cambios en servicios ya publicados se aplican con el guardado actual: no prometer un
  flujo separado de revisión/publicación sin implementarlo.

## Modelo técnico recomendado

Conservar `detail` y sus listas como contenido. Añadir configuración neutral por servicio
para visibilidad, heredable cuando esté ausente. Recomendación: columna JSONB nullable
propiedad del slice Services, mediante migración aditiva. No es un cambio del kernel.

Contrato conceptual, todavía no implementado:

```ts
type ServicePresentation = {
  sections?: {
    included?: boolean;
    itinerary?: boolean;
    options?: boolean;
    pricing?: boolean;
    extras?: boolean;
    partners?: boolean;
    good_to_know?: boolean;
  };
  price_display?: "auto" | "from" | "on_request" | "hidden";
  // Overrides de iconos no traducibles, a concretar en contrato.
};
```

Ausencia de flag → regla histórica según contenido; false → ocultar conservando datos;
true → mostrar solo con contenido válido. En tarifas, se evalúan tabla y extras por
separado; el contenedor aparece si alguno queda visible. Ausencia de configuración debe
preservar exactamente la salida actual, sin backfill obligatorio.

El modo `auto` preserva el precio actual. En la UX se explica como «Automático (actual)»;
los modos explícitos son «Desde un importe», «Bajo consulta» y «No mostrar precio».
Importe, sufijo y nota relacionados no deben seguir visibles al ocultarlo. Aplicar la regla
a tarjeta lateral, barra móvil y consumidores que muestran precios para evitar
contradicciones. Ni el catálogo actual ni el carrusel Home muestran importes;
la inspección de `pages/ui/components/services-carousel.tsx` durante la spec posterior
corrigió la suposición inicial sobre Home. No añadirlos
como efecto de esta mejora.
La tabla y extras tienen sus controles propios: ocultar el importe destacado no los borra.
El modo `from` exige un importe válido. `on_request` ignora importe y sufijo al renderizar,
pero los conserva para recuperarlos al volver a mostrar el precio.

### Traducciones: condición técnica crítica

`detail` se guarda como **un JSON traducible completo**, no como textos independientes
(`detail.ts:7`; `admin/actions.ts:192`). La lectura prefiere la traducción aprobada;
`src/core/i18n/content.ts:63` no descarta por antigüedad del hash. Meter únicamente flags
dentro de ese JSON permitiría que una traducción anterior siguiera mostrando una sección
que el editor acaba de ocultar.

Por eso visibilidad, modos de precio y overrides de iconos deben aplicarse desde datos
neutrales después de resolver el contenido localizado. Los labels/títulos sí son traducibles,
con defaults en EN/PT/ES/FR. No colocar UUID, flags o claves de iconos en textos a traducir
como parte de la ampliación. Mantener compatibility con los datos existentes y revisión humana.
No prometer traducción automática estructurada sin validar el proveedor y su resultado.

## Riesgos y verificaciones antes de implementación

| Prioridad | Hallazgo | Requisito |
|---|---|---|
| Alta | Estructura dentro de traducciones antiguas puede divergir | Controles neutrales y pruebas con target aprobado anterior |
| Alta | JSON inválido se convierte a detalle vacío al abrir (`admin/queries.ts:195`) | Advertir y preservar original; no sobrescribirlo silenciosamente |
| Alta | Handoff previo registra staff textual vs `translation.updated_by` UUID | Reproducir y resolver o delimitar antes de declarar QA del CRUD aprobado |
| Media | Labels y parte de iconos actuales son globales | Matriz campo → elemento público, con overrides por servicio |
| Media | Precio destacado, tabla y extras no están sincronizados | Ayuda y controles independientes; no cálculo implícito |
| Media | Guardado secuencial puede quedar parcial ante fallo | Ejercitar error y recuperación; no afirmar atomicidad inexistente |
| Media | Medios solo validados como UUID; external no exige URL/label | Validación condicional servidor y recursos admitidos |

Para una implementación posterior: orquestador estabiliza contrato y migración primero;
dos implementadores en worktrees con archivos disjuntos, uno para BO y otro para render
público; orquestador conserva schema/contratos/actions/queries, mensajes y documentación
compartidos. Un QA independiente revisa el candidato integrado. Antes de delegar escritores,
registrar commits, paths exactos, ownership, DB/media aislados y comandos en una spec de
ejecución; este informe no constituye una asignación de implementación.

Criterios de aceptación mínimos: los diez servicios conservan su aspecto al abrir/guardar
sin cambios; cada bloque se activa, oculta y reactiva sin perder contenido tras recarga;
se admiten ninguno/uno/varios de los tres; tabla/extras/precio destacado independientes;
labels e iconos se reflejan por servicio; errores condicionales accesibles; upload y
save/reload reales aislados; controles coherentes EN/PT/ES/FR con traducciones antiguas;
SEO y revalidación en detalle, listado y Home conservados; desktop/móvil sin desbordes.

Checks de la futura implementación: Node 22; `pnpm typecheck`, `pnpm lint`, tests reales
de Services por archivos explícitos con `pnpm exec tsx --test`, consumidores afectados,
`pnpm build` y `pnpm db:check` si se añade migración. No contar placeholders
`pnpm test`/`pnpm boundary:check`. Ningún push, despliegue o cambio de producción implícito.

## Evidencia y límites de esta auditoría

Los tres agentes contrastaron fuentes sin modificar aplicación ni DB. La herramienta web
no pudo acceder al host; el contraste remoto se hizo con curl y HTML SSR de los diez
detalles. La verificación de frontend privado autenticado y de persistencia corresponde a
la futura implementación, no se declara aprobada en esta auditoría. El servidor local
anterior en 3049 no estaba disponible al consultarlo.

El agente público ejecutó una ronda de navegador de solo lectura para Chef, Sintra y Surf
en 1440×960 y 390×960: encabezados contrastados y sin overflow horizontal en los seis casos.
Inspeccionó visualmente Chef móvil y Sintra desktop. `/admin/services` redirigió a
`/admin/login`; no se inició sesión remota. Script
`/private/tmp/central-hill-audit-public-browser.cjs`, exit 0 tras aprobación del lanzamiento
de Chromium fuera del sandbox. Capturas:
`/private/tmp/central-hill-audit-{chef-at-home,sintra-day-tour,surf-lesson}-{1440,390}.png`.
Estas capturas respaldan el inventario público; no son una auditoría visual del editor privado.

Precios destacados contrastados en esas lecturas: aeropuerto 72 €, Chef 35 €/persona,
compra previa 20 €, babysitting 18 €, limpieza 45 €, Sintra 65 €/persona, Fátima
86 €/persona, barco 199 € y surf 40 €/persona. No son presupuestos nuevos ni una propuesta
de modificación de precios.

No se ejecutaron typecheck/lint/build/tests de aplicación: no cambió código ejecutable.
La revisión documental se cierra con `git diff --check` y control de archivos cambiados.
El agente de modelo revisó el informe consolidado: sin bloqueantes; incorporadas sus
precisiones sobre validación del precio y consumidores que actualmente muestran importes.
La auditoría no autoriza ni inicia una nueva implementación.
