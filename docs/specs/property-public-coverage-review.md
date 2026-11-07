# Buildings / Apartments — cobertura de formularios y Home local

2026-11-06. Revisión solicitada por el usuario sobre main954f7da con los cambios
visuales de pestañas pendientes de commit. Sin nueva implementación de formularios,
sin tests/QA estética, sin migración. Revisión de fuentes + lecturas de los cuatro
formularios reales y páginas públicas en el único main dev3071PID5677/session63080.
DB/rol verificadospropertylocalesqa; no Neon remoto ni push/deploy.

## Resultado

Crear y editar reutilizan exactamente BuildingLocaleEditor y ApartmentLocaleEditor;
los campos de contenido son iguales en ambas variantes. El contenido propio que
actualmente aparece en las fichas/tarjetas públicas está cubierto. Esto no equivale
a poder editar todos los textos/atributos públicos desde cada formulario: plantillas,
ALT y SEO de apartamentos tienen los límites indicados más abajo.

## Mapa de cobertura

| Superficie pública | Datos / componente | Dónde se controla | Resultado |
| --- | --- | --- | --- |
| Tarjeta Buildings listing | nombre, teaser, portada, badge New, dirección/barrio, enlace | Building: Name/Teaser/Cover/New/Street/Neighbourhood, booking_enabled/default/override | Cubierto |
| Hero del edificio | nombre, ciudad/barrio, dirección, portada, New | Building: Name, City, Neighbourhood, Street, Cover, New | Cubierto; el título usa name, no el headline legacy |
| Galería MosaicGallery | imágenes y orden | Building Gallery: añadir, quitar, ordenar | Cubierto |
| SpecStrip | apartamentos, capacidad, camas, barrio | Apartment publicados del idioma + shared max_guests/beds_count; Building Neighbourhood | Derivado automáticamente, no contador manual |
| Tarjetas Apartment dentro del edificio | nombre, badge, portada, dormitorios, camas, huéspedes, m² y enlace | Apartment Name/Badge/Cover/Bedrooms/Beds/Max guests/Size/booking override/base | Cubierto |
| Orden de apartamentos | orden de tarjetas | Flechas operacionales en la lista Apartments del edificio | Cubierto fuera del formulario; creación asigna última posición |
| Amenities | selección de servicios/comodidades | Building selección; catálogo Amenities y sus traducciones para etiquetas/iconos | Cubierto por composición, no texto distinto por edificio |
| FAQ | preguntas/respuestas/orden y FAQPage JSON-LD | Building FAQ localizada | Cubierto, IDs estables |
| Banda Book y CTA superior | destino de reserva | Building Avantio/default_booking_url/booking_url por idioma | Cubierto; booking_enabled cambia salida de la tarjeta listing, no elimina la banda |
| SEO del edificio | title, description, OG, canonical/hreflang | Building Meta title/description/OG; slug estable/publicaciones por idioma | Cubierto |
| Portfolio Home/Guest | nombre, foto, Featured, orden, número/capacidad | Building is_featured/position/name/cover + Apartment counters | Cubierto; textos del carrusel pertenecen a Pages |
| Hero/panel propietarios/cifras/calculadora del LISTING Buildings | contenido editorial de la página general | /admin/pages/buildings | Ya tiene editor separado; no son campos de un inmueble |
| Header/footer, títulos de secciones, textos comunes de botones, iconos specs | plantillas compartidas/localizadas | messages + Settings/site icons; Pages en bloques editoriales | No son authoring por entidad |

## Límites y pendientes reales

1. **Apartment archivado sigue bloqueado.** Su UI conserva disabled por archived,
   sus stores rechazan Save/Publish y no tiene Restore. La corrección reversible
   anterior se implementó sólo para Building. Es una inconsistencia funcional
   pendiente de unificar, independiente de la cobertura de campos públicos.
2. **ALT de imágenes sin campo en estos formularios.** Los lectores resuelven
   media_asset.alt si existe traducción y, si falta, usan el nombre del inmueble.
   MediaField sólo permite escoger/subir/quitar. Personalizar ALT por imagen/idioma
   desde este flujo requiere una ampliación explícita de authoring y ownership.
3. **SEO de Apartment almacenado sin página pública propia.** Hay inputs Meta/OG y
   un read model ApartmentDetail, pero no hay route /[locale]/apartments/[slug]. La
   web actual sólo monta UnitCard dentro del edificio. Los meta del apartamento no
   generan un title/description/OG propios en una página pública de apartamento.
4. **Textos de plantilla no editables por inmueble.** “Apartments in this Building”,
   intro de la sección, Amenities/FAQ, Book title/body/CTA/note y Check availability
   provienen de messages. Cambiar su copy por inmueble requiere una decisión nueva;
   no falta el dato de reserva ni el contenido FAQ, pero no es edición total de copy.

Campos legacy ocultos no equivalen a componentes perdidos: la prosa Building/The
Neighbourhood fue retirada del renderer; Apartment description/gallery/bathrooms/
floor tampoco se usan en la tarjeta pública actual. Se preservan en datos. Lat/lng
Building se pueden editar pero el detalle actual no monta un mapa. No se restauraron
campos ni se crearon páginas públicas nuevas durante esta revisión.

## Evidencia y fuentes

8lecturas de formularios/público (incluida revisión adicional de FAQ/galería sobre
un Building con datos), sin Save/Publish de inmuebles. Crear/editar Building tienen
el mismo conjunto de20labels base; Apartment13. Campos FAQ son dinámicos y se
comprobaron adicionalmente con contenido existente. Los cuatro formularios200,
/en/buildings200 y detalle con UnitCard/FAQ/Amenities200; no pageerrors. Home era404.
No nuevas pruebas de persistencia ni auditoría estética; los flujos anteriores
conservan su informe de QA específico.

Fuentes: src/slices/buildings/ui/building-detail.tsx,
ui/components/building-listing-card.tsx, ui/buildings-listing.tsx,
server/queries.ts; src/core/ui/unit-card.tsx; src/slices/apartments/server/queries.ts;
ambos admin/ui/*-locale-editor.tsx y sus cuatro rutas new/edit;
src/slices/pages/ui/components/featured-portfolio.tsx y home-page.tsx.
Artefactos JSON/logs/scripts: /private/tmp/central-hill-property-coverage-review.

## Home /en recuperada con autorización explícita

Causa confirmada por SQL de sólo lectura: page_content no tenía home y no existía
ninguna fila home en page_locale_content. getPublishedPageLocale devolvía null;
HomePage llama notFound cuando no hay contenido publicado. El mensaje no provenía
de una ruta mal declarada. El entorno sintético anterior no incluía esa página.

Usuario autorizó crear únicamente Home EN de ejemplo. Payload home-en.json validado
con homeSchema y homeIdentityErrors; script seed-home.cjs verifica DB/rol y aborta
si Home ya existe. Se crearon4filas de Home: ENdraft(rev1) y ES/PT/FRvacíos. Luego
se ejecutó Publish EN real desde /admin/pages/home, que invalida la caché pública.
Resultado: **/enHTTP200**, h1“Central Hill — local preview”,0pageerrors. SQL final:
ENpublished/rev2/sindraft; ES/PT/FRsinpublicar/rev0. Ningún contenido existente
sobrescrito, ninguna otra página creada y ningún dato de Building/Apartment cambiado.
No se cambió el fallback de producción ni se publicaron idiomas implícitamente.

La Home es una muestra sintética local, no copia de contenido remoto. Usa un asset
local de prueba, sin estadísticas inventadas; portfolio compone el catálogo actual.
Otras páginas que no existen en esta DB (por ejemplo Owners/About/Real Estate) no
se crearon en este alcance y sus enlaces pueden seguir devolviendo404 localmente.
La edición/traducción de esta Home queda disponible en Pages/Home normalmente.
No restart: proceso main3071 permanece. Pendientes visuales de tabs siguen intactos.
