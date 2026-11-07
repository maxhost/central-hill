# Buildings y Apartments — QA independiente local

2026-11-06. **Aprobado en el alcance funcional local acordado.** Candidato
ejecutable **76cd66c**, rama `property-locales/integration`, checkout
`/private/tmp/central-hill-property-locales-integration`. Los cambios posteriores
al candidato durante la ronda fueron documentales. No quedan hallazgos de producto
bloqueantes dentro de esta ronda normal acotada.

[Spec](property-locale-editors-spec.md), [ejecución](property-locale-editors-plan.md),
[entrega y verificación integrada](property-locale-editors-delivery.md),
[ADR0058](../decisions/0058-property-locale-snapshots.md).

## Entorno y procedimiento

Revisión independiente de la fuente integrada y una ronda funcional en Chromium
headless contra el build de producción local **3073**, PID14719/session22769.
DB y rol comprobados independientemente mediante el driver real antes de las
escrituras: ambos **propertylocalesqa**. Postgres5658/proxy4558/storage9073;
Node22.23.3. Sólo credenciales y datos sintéticos. El preload local rechaza Neon
remoto y dirige el host sintético al proxy aislado.

Artefactos, scripts, resultados JSON, capturas y logs permanecen en
`/private/tmp/central-hill-property-locales-qa/independent`. Cada script de
persistencia comprueba de nuevo la identidad de DB/rol. Se usó login editor
sintético; las pruebas anónimas abrieron un contexto sin sus cookies. Las
operaciones HTTP invocaron las acciones reales identificadas en el manifest del
build, con Origin local y sesión real. Las esperas finales de mutaciones usan la
respuesta Next-Action y la confirmación de estado/DB, sin temporizadores fijos.

Comandos reproducibles, ejecutados desde el checkout con su `env.sh`:

```sh
source /private/tmp/central-hill-property-locales-qa/env.sh
node /private/tmp/central-hill-property-locales-qa/independent/inspect.mjs
node /private/tmp/central-hill-property-locales-qa/independent/baseline.mjs
node /private/tmp/central-hill-property-locales-qa/independent/baseline-continuation.mjs
node /private/tmp/central-hill-property-locales-qa/independent/apartment.mjs
node /private/tmp/central-hill-property-locales-qa/independent/new-entities.mjs
node /private/tmp/central-hill-property-locales-qa/independent/new-entities-continuation.mjs
node /private/tmp/central-hill-property-locales-qa/independent/media-booking.mjs
node /private/tmp/central-hill-property-locales-qa/independent/media-booking-continuation.mjs
node /private/tmp/central-hill-property-locales-qa/independent/http-guards.mjs
node --import tsx --import /private/tmp/central-hill-property-locales-qa/independent/guards-runtime.mjs /private/tmp/central-hill-property-locales-qa/independent/guards-source.mjs
```

Estos comandos documentan la secuencia y sus continuaciones; no son un script
idempotente sobre la DB ya editada. Los primeros intentos y sus correcciones se
conservan abajo. No se reseteó la DB ni se repitieron los baselines ya comprobados.

## Resultado funcional observado

| Grupo | Evidencia y resultado |
| --- | --- |
| Compatibilidad inicial | Cuatro URLs públicas Building con slugs ES/PT distintos, nombres aprobados y fallback EN correctos; una unidad por idioma; reservas legacy válidas. GET público/editor/preview mantuvo ambas tablas locale vacías hasta Save. |
| Preview y foco | Escritura continua EN en ambos editores conserva valor y foco; Refresh refleja cambios privados sin guardar. No JSON-LD privado. El bridge impide submit del formulario de footer y los destinos de reserva del renderer quedan inertes. |
| Save/Publish por idioma | Save/reload en Building y Apartment conserva el draft sin cambiar la publicación. Bootstrap captura cuatro publicaciones y pendientes PT Building/FAQ y FR Apartment badge. Publicación EN/ES/PT/FR independiente, con comparación de los documentos/revisiones de los otros idiomas. |
| Referencias y trabajo local | Capacidades EN actualizadas quedan congeladas por idioma: ES conserva4huéspedes/3camas frente a EN6/4. Los drafts target existentes no cambian al guardar/publicar EN. La adopción explícita cambia sólo working local hasta Save. Texto ES local sobrevive otro Save EN. |
| FAQ | Añadir y reordenar EN conserva el UUID legacy; adopción PT mantiene la pregunta traducida del UUID correspondiente y añade la nueva identidad en el orden EN. Sin reasignación por índice. |
| Nuevas identidades | Primer y segundo Save de ambos tipos usan un UUID estable, revisión EN2 y ruta Edit real. Targets bloqueados antes del primer Save y disponibles después. No duplicado Building por slug ni Apartment por identidad. |
| Padre y SEO | Child ES publicado antes que el padre permanece oculto. Publish padre ES lo revela sin publicar EN; EN sigue404. Canonical ES, hreflang sólo ES+x-default ES y sitemap sólo ES comprobados en las respuestas reales. |
| Contadores | Cuatro strips públicos coinciden exactamente con una unidad visible y sus capacidades/camas congeladas. Legacy cuenta una identidad, no cuatro traducciones:1/6/4 en el fixture original tras publicación EN. Save draft no recalcula. Archive/Delete del segundo hijo vuelve a1/3/2 en el padre nuevo. |
| Orden y ciclo de vida | ↑/↓ cambia posiciones globales sin modificar ningún JSON/revisión locale. Ruta de padre incorrecto devuelve404. Delete padre con hijos rechaza. Archive Apartment conserva snapshots; Delete elimina su identidad/snapshots y mantiene contadores. Archive Building oculta su publicación y unidades, preservando documentos de ambos. |
| Reservas | Cuatro overrides Building y Unit se verificaron como hrefs públicos reales. Listing, detalle/banda y botón superior resuelven la URL del idioma. Target guardado conserva su base anterior tras un EN Publish posterior. Override Unit vacío usa su base; sin ambos usa#book. Building booking_enabled=false conserva enlace interno; sin URL, banda sin CTA y botón superior general del idioma, incluido PT distinto de EN. |
| Media | Dos imágenes EN en cola no crean filas/PUTs. Save ES no sube ninguna; Save EN sube exactamente ambas referencias. Tras guardar, el preview usa URLs persistidas sobre blobs. Acciones preview reales de ambos tipos rechazan blob de origen ajeno y prefieren media persistida a blob same-origin, sin cambiar suma de revisiones. |
| Navegación y móvil | Guards sobre idiomas iniciados detectan dirty oculto al cambiar idioma; Cancel/Escape conserva cambios y Continue deja sólo lo guardado. Probados enlaces del workspace y Back to catalogue. Browser desktop1600×1100 y móvil390×844; Building FR y Apartment PT editan, refrescan y guardan. |
| Translations y permisos | Las seis acciones antiguas reales rechazan Building, Apartment y Building FAQ sin cambiar filas legacy. Review antiguo redirige al editor, padre y locale correctos. Amenities permite guardar/aprobar/limpiar traducción. Contexto anónimo rechaza editores, previews y acciones Save/Publish/render de ambos tipos, con contadores y revisiones intactos. |
| Vías antiguas y rutas | Harness de fuente ejecuta el generador directo contra los tres tipos y los antiguos saveBuilding/saveApartment: rechazan antes de acceder a seams de datos; los dos Save antiguos mantienen gate staff. Sin nueva URL pública Apartment; petición /es/apartments/qa-unit devuelve404. |

Evidencia principal: `apartment-results.json`,
`baseline-continuation-results.json`, `new-entities-continuation-results.json`,
`media-booking-continuation-results.json`, `http-guards-results.json`,
`guards-source.log`, y los resultados iniciales preservados que contienen los
baselines/primeras creaciones/media ya aprobados. Las rondas principales registran
`PAGE_ERRORS []`. Capturas: `desktop-live-preview.png`, `mobile-building.png`,
`mobile-apartment.png`, `es-only-public-building.png`,
`saved-media-precedence.png`, `booking-no-base.png`.

## Revisión de fuente y verificación integrada

Se revisaron contratos, estado por idioma, validación, bootstrap, CAS/revisión EN,
advisory lock compartido y statement fresco, guardas de identidad/parent/delete,
lecturas públicas, agregados únicos, invalidación y rutas. Building preview usa
`BuildingDetailRenderer`; Apartment inyecta la unidad en ese mismo renderer y usa
`UnitCard`. Fragmentos SQL cruzados salen del contract de su dueño; no hay nuevo
kernel. El interceptor de navegación actúa sobre el documento completo, por lo
que cubre también links de sidebar además de los recorridos de workspace probados.

La revisión encontró que el metadata route anunciaba idiomas no publicados;
**76cd66c** lo corrigió antes de esta ronda. La confirmación HTML/sitemap ES-only
anterior verifica esa corrección. También se corrigió la copia heredada de Blog
antes del build final.

La evidencia del orquestador, revisada sin repetir suites, registra typecheck y
lint exit0 sobre el candidato final (siete warnings existentes), build final
76cd66c exit0 y db:check exit0 para26migraciones con warning histórico0008.
`tests-integrated.log` confirma **93/93** casos en **632c54d**, incluyendo los
grupos reales de DB de ambos escritores. Los cambios funcionales posteriores
fueron copia y metadata, cubiertos por el build final y esta ronda. Comandos y
archivos exactos están en la entrega. No se cuentan pnpm test/boundary:check.

## Intentos corregidos y límites

Se conservaron logs/capturas de todos los fallos de harness, sin tratarlos como
defectos del producto ni ocultarlos bajo un reset:

- `baseline-initial-form-assumption*`: asumía ausencia de todo form. El footer
  existente sí lo contiene; la comprobación correcta confirma que el bridge
  cancela submit. Ningún Save había ocurrido.
- `baseline-publish-wait-assumption*`: esperaba el header Published, ya presente
  por la publicación anterior, y leyó público antes de acabar la acción. DB y
  GET posterior confirmaron ES correcto. Las continuaciones esperan la respuesta
  real y notice exacto del inspector.
- `baseline-en-selector-assumption*`: EN incluye el texto accesible English
  source. Se corrigió el selector antes de nuevas mutaciones del grupo.
- `new-entities-move-wait-assumption*`: leer tras700ms precedió la finalización de
  Move. Lectura posterior confirmó orden correcto; continuación usa respuesta real
  y compara snapshots durante un recorrido explícito ↓/↑.
- `media-seo-selector-assumption*`: el selector Element no existe al seleccionar
  SEO; se usó el menú Sections. Sólo había reservas gratis sin uploads/filas.
- `media-home-fixture-limit*`: el fixture sintético no contiene Home y /en
  devuelve404. FeaturedPortfolio se revisó en fuente: conserva su enlace interno
  localizado. No se añadió Home ni se amplió esta ronda; la comprobación funcional
  de URLs cubre las superficies de propiedades modificadas.

Storage es HTTP sintético: comprueba flujo PUT/HEAD/GET, bytes/normalización y
scoped flush, sin validar firmas S3 ni proveedor real. El launcher sólo de QA
permite imágenes127.0.0.1:9073; no cambia next.config del producto. No hubo envíos
reales, DB remota, push, deploy ni merge a main. El harness de generador/Save
antiguos usa seams instrumentados; los demás guards descritos fueron HTTP real.
Los casos CAS/concurrencia pertenecen a los tests DB integrados revisados; no se
añadió estrés de navegador ni matriz adversarial ampliada.

Fixtures/artefactos quedan para revisión: `d*` con ediciones QA normales, dos
media nuevos, padre nuevo archivado con un hijo preservado y segundo hijo borrado;
identidades exactas en `new-identities.json`. Symlink sin rastrear
`public/propertylocalesqa`, previews3071/3072 y logo original se conservan. El
único archivo de repositorio escrito por este agente es este informe.
