# Auditoría del CMS de guías individuales

Fecha: 2026-10-18. Base auditada: `8a61bd782078c721abfea42cf49ed41aa77db804`
(`main`, checkout inicialmente limpio). Entrega documental, sin implementación.
Ver [brief](guides-cms-audit-brief.md) y [spec/plan ejecutable](guides-cms-execution.md).

## Conclusión

Hay **8 guías publicadas de Lisboa**, con **59 secciones y 86 lugares**. El sitemap
declara **32 URLs localizadas** EN/PT/ES/FR; no se descubrieron guías publicadas de
Porto ni de categoría `custom`. El inventario público coincide con las ocho guías
del seed en slugs, títulos de secciones y conteos. No se consultó la DB remota:
esto no demuestra ausencia de borradores, archivos u otras filas no publicadas.

Las ocho categorías **no son ocho layouts diferentes**. El render compone siempre
la misma estructura y activa los contenidos según presencia. Recomiendo conservar
el árbol y `template` semántico, y añadir módulos independientes por sección con
ocultación reversible. No se justifica un page builder ni formularios restrictivos
por temática. Clima, eventos, emergencias, deportes, idiomas y familias son hoy
contenido editorial; no tienen widgets exclusivos que necesiten nuevos modelos.

## Método, fuentes y límites

Tres agentes de solo lectura verificaron cwd/rama/HEAD/status y leyeron instrucciones,
READMEs y ADRs: `model_inventory` (seed/modelo), `published_variants` (sitio/render),
`editor_ux` (admin/contratos). El orquestador cruzó evidencia y es único escritor de
documentación. No hubo agentes implementadores, cambios de aplicación, DB/media
writes, seeds ejecutados, migraciones, build, commits, push ni despliegue.

Fuentes públicas observadas el 2026-10-18:

- [Índice ES](https://central-hill-umber.vercel.app/es/guides),
  [sitemap raíz](https://central-hill-umber.vercel.app/sitemap.xml) y
  [sitemap Guides](https://central-hill-umber.vercel.app/sitemaps/guides).
- Las ocho páginas ES enlazadas en la matriz; HTML servido contrastado con código y
  seeds, sin contar el payload RSC como contenido visible.
- Los locales adicionales se inventariaron por sitemap; no se afirma revisión visual
  completa de las 32 páginas. En ES, los textos editoriales/SEO observados siguen EN
  mientras los labels de interfaz están traducidos.

Fuentes locales: `scripts/seed-guides.ts:112`, `guides/schema.ts:8`,
`guides/validation.ts:33`, `guides/contract.ts:49`,
`guides/server/queries.ts:159`, `guides/ui/guide-page.tsx:117`,
`guides/ui/components/recommendation-card.tsx:105` (paths bajo `src/slices/`).
ADRs: 0002 ISR, 0005 contratos, 0006/0007 traducciones, 0009 auth, 0010 migraciones,
0012 sin builder genérico, 0018 media, 0019 seams y slugs, 0021 traducciones,
0030 uploads diferidos, 0034 iconos, 0036 atribución de actores.

El agente de modelo extrajo únicamente helpers puros y el literal `GUIDES` como texto,
transpilados en VM aislada, sin importar el script completo (que llama `main()` y
escribe datos). Los conteos de secciones/lugares se contrastaron con HTML publicado.
No se inspeccionaron visualmente todas las fotos, no se probaron destinos externos,
no se midió rendimiento ni contraste, ni se ejecutó QA interactiva del CMS: no existe
todavía. Las previews sintéticas 3059/3060 se conservaron y no sirvieron de inventario.

## Matriz exhaustiva de guías publicadas

URLs ES con ciudad `/lisbon/`; los mismos slugs aparecen en EN/PT/FR. Conteos de
estructura coincidentes entre seed y HTML publicado. Tips/fotos indican contenido,
no módulos obligatorios de una categoría.

| Guía / template | Secciones | Lugares | Tips | Fotos sección | Fotos lugar | Diferencia editorial |
|---|---:|---:|---:|---:|---:|---|
| [Things to Do](https://central-hill-umber.vercel.app/es/guides/lisbon/things-to-do-in-lisbon) · landing | 9 | 18 | 6 | 9 | 4 | Barrios, monumentos, miradores, museos y fado; lugares mayormente sin datos de contacto |
| [Where and What to Eat](https://central-hill-umber.vercel.app/es/guides/lisbon/where-and-what-to-eat-in-lisbon) · eat | 10 | 30 | 0 | 10 | 30 | Todas las fichas con dirección, teléfono, banda de precio y foto |
| [Beaches Near Lisbon](https://central-hill-umber.vercel.app/es/guides/lisbon/beaches-near-lisbon) · beaches | 6 | 9 | 4 | 6 | 9 | Playas agrupadas por zona, dirección y foto; para quién son dentro de descripción |
| [Events and Festivals](https://central-hill-umber.vercel.app/es/guides/lisbon/events-and-festivals-in-lisbon) · events | 4 | 8 | 0 | 4 | 0 | Festivales y deporte como prosa/fichas, sin fechas estructuradas |
| [Secrets of Lisbon](https://central-hill-umber.vercel.app/es/guides/lisbon/secrets-of-lisbon) · secrets | 7 | 3 | 6 | 7 | 0 | Muchos consejos; único horario estructurado, Feira da Ladra, hoy invisible |
| [Families and Kids](https://central-hill-umber.vercel.app/es/guides/lisbon/lisbon-for-families-and-kids) · families | 7 | 4 | 3 | 7 | 0 | Atracciones infantiles y recomendaciones editoriales, sin widget familiar |
| [Groups and Friends](https://central-hill-umber.vercel.app/es/guides/lisbon/lisbon-for-groups-and-friends) · groups | 9 | 10 | 5 | 9 | 0 | Ocio, rooftops, restaurantes y actividades de grupo |
| [Information for Travellers](https://central-hill-umber.vercel.app/es/guides/lisbon/information-for-travellers) · travellers | 7 | 4 | 1 | 7 | 0 | Clima, transporte, barrios, idioma, horarios y emergencias como texto |
| **Total** | **59** | **86** | **25** | **59** | **43** | **8 hero adicionales; ningún vídeo de detalle observado** |

Las 59 secciones tienen body e imagen; 29 tienen lugares y 30 no. El seed deriva
29 layouts `featured_places` y 30 `with_media`; cero `standard`/`with_cta`. `custom`
existe solo como opción técnica en este corpus. No es evidencia para eliminar esas
opciones del modelo: deben cubrirse con fixtures cuando exista implementación.

Hay 110 referencias editoriales de imagen (8 hero + 59 headers + 43 lugares), no
necesariamente 110 assets únicos. Todas las páginas observadas muestran mosaico de
cinco tiles. Los 174 `<img>` del corpus incluyen también mosaicos, CTA compartido y
otras guías: no confundir número de nodos HTML con número de assets originales.

## Campos comunes, opcionales y exclusivos

| Nivel | Campo / alcance real | Traducción / efecto público |
|---|---|---|
| Guía | Ciudad Lisbon, template, slug, published, position; título/intro/SEO/hero en 8/8 | Título/intro/meta_title/meta_description [T]; slugs por locale; OG opcional con fallback hero |
| Sección | Título, body, position e imagen 59/59 | Título/body [T]; prosa por párrafos, no HTML |
| Sección | local_tip 25/59 | [T], label global Local tip; no exclusivo de temática |
| Sección | places en 29/59 | Árbol ordenado, no relación con catálogo global |
| Sección | cta_url + cta_label | Label [T], render solo con ambos; cero casos seed |
| Lugar | Nombre/categoría 86/86; description 56/86 | Nombre/description [T]; categoría neutral, solo tres tipos con labels traducidos |
| Lugar | Dirección 39/86 | 30 eat + 9 beaches; alimenta Directions y elegibilidad del índice |
| Lugar | Teléfono/precio 30/86 cada uno | Solo eat en seed; datos opcionales, no restricción de plantilla |
| Lugar | Foto 43/86 | 30 eat + 9 beaches + 4 landing; alt desde media o nombre |
| Lugar | opening_hours 1/86 | Feira da Ladra; campo neutral y actualmente no renderizado |
| Lugar | latitude/longitude, website_url, booking_url | Modelo existente, cero casos seed; coordenadas dan Directions; web/reserva hoy invisibles |

Descripción por categoría: eat30, beaches9, events8, families4, travellers4,
groups1, landing0, secrets0. Categorías como Tasca/Brunch/Vegan/Neighbourhood son texto
neutral; no se traducen automáticamente ni enlazan con Geography. Lugares repetidos
en varias guías son copias editoriales independientes; no fusionarlos por nombre.

No existen campos de vídeo, fechas de festival, clima, mapa interactivo, idiomas o
teléfonos de emergencia como módulos especializados. Tampoco galería manual: hero y
headers forman mosaico deduplicado por URL, máximo cinco; imágenes de lugares no entran.

## Hallazgos y decisiones requeridas antes de implementar

| Prioridad | Hallazgo, impacto y evidencia | Decisión en spec |
|---|---|---|
| P1 | CMS ausente: no admin Guides ni registro de pantallas (`app/(admin)/admin/(panel)/layout.tsx:39`) | Crear lista/alta/editor, acciones staff-gated y nav |
| P1 | `layout` no controla render; exponerlo como plantilla engañaría al editor (`guide-page.tsx:196`) | Un árbol con módulos opcionales, template semántico |
| P1 | Seed recrea hijos y elimina contenido, cambiando IDs/traducciones (`scripts/seed-guides.ts:1330,1384`) | Nunca reutilizarlo como guardado CMS; conservar IDs y operaciones explícitas |
| P1 | Vacío/null/undefined en `setSourceContent` elimina todas las traducciones de una clave (`core/i18n/content-write.ts:69,107`) | Ocultar retiene valores; omitir claves no editadas; limpiar solo explícitamente |
| P1 | Aprobación de traducciones invalida tags distintos de `guide-list` (`translation/admin/actions.ts:32`, Guides queries:343) | Integración cross-slice por contrato; QA de approve/reset sin restart |
| P1 | Writes multitabla secuenciales sin transacción global (`core/i18n/content-write.ts:21`) | Saves granulares idempotentes, feedback de fallo parcial y reintentos con IDs estables |
| P1 | Ciudad no tiene FK en guide_page; lectores públicos solo aceptan ciudad publicada (`guides/schema.ts:10`, queries:159–184) | Validar ciudad por contrato y ampliar opciones admin all-status con propietario |
| P1 | Slug único por tipo/locale, global entre ciudades; cambio no crea redirect (`core/i18n/content-write.ts:120–144`) | Conservar variantes locales, preflight de conflicto, cambios explícitos |
| P1 | UUID media no prueba MIME y `z.url()` no limita HTTP(S) (`guides/validation.ts:48–78`) | Validar existencia/MIME y protocolos en servidor; CTA y coordenadas por pares |
| P2 | Horario/web/reserva almacenados pero invisibles (`queries.ts:258`, recommendation-card:105) | Mostrar opcionales explícitamente en la futura tarjeta |
| P2 | Cambiar categoría/foto/dirección/orden altera Top Recommendations (`queries.ts:349`) | Mantener selección actual y avisar de impacto; probar hide/reorder/publish |
| P2 | Los targets approved se muestran aunque stale (`core/i18n/content.ts:68`) | Explicar workflow real, no prometer fallback por staleness |
| P2 | Guardar una guía published cambia contenido vivo; no hay revisión draft paralela | Indicar “Guardar cambios publicados”; draft retira página; sin preview ficticia |
| P2 | Reejecutar seed tras CMS podría borrar fotos seed-owned reutilizadas | Retirar seed del flujo editorial; revisión explícita antes de futura reutilización |

P1 significa requisito para entrega futura fiable, no incidente de producción probado.
No se midieron WCAG/performance y no se asigna una puntuación visual ficticia. Positivos
que conservar: composición legible compartida, imágenes responsive, HTML escapado,
TOC derivado de las mismas secciones, direcciones seguras por coordenadas/address,
separación de contenido Pages/Guides/Settings y fallback de traducciones establecido.

## Reglas públicas y responsabilidades

`template` selecciona icono (`guide-page.tsx:135`); Settings posee guide_*, location,
callout_tip y table_of_contents. Pages posee `guide_aside` para todos los detalles,
incluida foto y CTA localizado hacia Buildings (`guide-page.tsx:271`). Mantener
fuentes únicas y enlaces contextuales en el CMS, sin overrides locales en v1.

Los labels de navegación, consejo, direcciones, tipos y otras guías vienen de
`messages/{en,pt,es,fr}.json`. Los textos del árbol son source EN + targets aprobados
por entidad `guide_page`, `guide_section`, `guide_place`; alt es de media_asset.
No prometer LLM funcional sin proveedor verificado ni traducción de campos neutrales.

Queries cachean `guide-list` + `city-list`. `revalidateGuides()` ya invalida guide-list;
GUIDE_TAGS.page(id) está reservado, no es el mecanismo usado por detalles. Revalidar
tras cambios de cualquier hijo y desde aprobación/reset de traducciones; el ISR de
ruta a 3600 no garantiza refrescar un data cache sin TTL mal invalidado.

SEO actual: ruta locale/city/slug, 404 por ciudad equivocada, canonical, alternates
cuando ciudad y guía tienen slug, OG→hero y BreadcrumbList; sitemap desde publicados.
`x-default` usa URL sin prefijo EN en la ruta actual; registrarlo como preexistente,
no mezclar una corrección SEO global sin acordar alcance.

## Apéndice: inventario de cada sección y lugar

Números entre paréntesis son líneas de `scripts/seed-guides.ts` en la base auditada;
`—` significa sin lugares. Este apéndice enumera las 59 secciones y los 86 lugares,
no solo los casos con fotos o recomendaciones.

### Things to Do · landing · página línea 114

| Sección | Lugares |
|---|---|
| Walk the Historic Districts (125) | — |
| São Jorge Castle (134) | — |
| Lisbon's Best Viewpoints & Rooftops (147) | Miradouro da Graça; São Pedro de Alcântara; Portas do Sol; Nossa Senhora do Monte; Topo Martim Moniz; Park Rooftop |
| Day Trips: Sintra & Fátima (183) | — |
| Taste Authentic Lisbon (192) | — |
| An Evening of Fado (201) | Adega Machado; Parreirinha de Alfama; Clube de Fado; Museu do Fado |
| Belém's Monuments (215) | Jerónimos Monastery; Belém Tower; Padrão dos Descobrimentos; MAAT |
| Lisbon's Museums (228) | Calouste Gulbenkian Museum; National Tile Museum; Coleção Berardo; National Coach Museum |
| Beaches, Boats & Nightlife (241) | — |

### Where and What to Eat · eat · página línea 251

| Sección | Lugares |
|---|---|
| Typical & Authentic (262) | A Provinciana; Cantinho do Bem Estar; Solar dos Presuntos |
| Fish & Seafood (299) | Ramiro; Cervejaria Quintada; Ponto Final |
| Restaurants for Large Groups (334) | Adega do Tagarro; Cervejaria Trindade; Príncipe do Calhariz |
| Trendy Tables (369) | Time Out Market; Seen; Guilty |
| Restaurants with a View (403) | The Insólito; Madame Petisca; Noobai |
| Michelin Star (437) | Belcanto; 100 Maneiras; Alma |
| Best Brunches (471) | Nicolau; Heim; Zenith |
| Best Terraces (505) | Miradouro do Adamastor; Ribeira das Naus; Jardim do Príncipe Real |
| Vegan (539) | AO 26 – Vegan Food Project; Orteá – Vegan Collective; The Green Affair |
| Vegetarian (573) | PSI; Jardim dos Sentidos; Os Tibetanos |

### Beaches Near Lisbon · beaches · página línea 609

| Sección | Lugares |
|---|---|
| Costa da Caparica (620) | São João Beach; Castelo Beach; Cova do Vapor |
| Carcavelos & Oeiras (651) | Carcavelos Beach; Santo Amaro Beach |
| Cascais & Estoril (675) | Praia da Poça; Praia da Conceição |
| Guincho (698) | — |
| Comporta & Arrábida (705) | Praia da Figueirinha; Galapinhos |
| Water Sports (729) | — |

### Events and Festivals · events · página línea 739

| Sección | Lugares |
|---|---|
| Santos Populares (750) | — |
| Music Festivals (762) | NOS Alive; Rock in Rio Lisboa; Super Bock Super Rock |
| Culture & Technology (794) | Web Summit; Lisbon OutJazz; Lisbon Film Festivals |
| Sport in the City (820) | MEO Rip Curl Pro Portugal; EDP Lisbon Marathon |

### Secrets of Lisbon · secrets · página línea 843

| Sección | Lugares |
|---|---|
| Viewpoints & Hidden Corners (854) | Aqueduto das Águas Livres |
| A Taste of Local Ritual (869) | — |
| Vintage Shopping & Markets (878) | A Vida Portuguesa; Feira da Ladra |
| Underground & Off-Radar Lisbon (896) | — |
| Gardens & Quiet Museums (905) | — |
| Street Art & the Other Side of the River (914) | — |
| Lisbon's Hidden Palaces (923) | — |

### Families and Kids · families · página línea 937

| Sección | Lugares |
|---|---|
| Oceanário & Lisbon Zoo (948) | Lisbon Oceanarium; Lisbon Zoo |
| Hands-On Fun (960) | Pavilion of Knowledge; Puppet Museum |
| Riverside Bikes & Easy Adventures (972) | — |
| A Family Day Trip to Sintra & Fátima (980) | — |
| Dolphin Watching & the Beach (993) | — |
| Christmas Fairs & Festive Lisbon (1002) | — |
| A Portuguese Dinner, Cooked at Home (1010) | — |

### Groups and Friends · groups · página línea 1019

| Sección | Lugares |
|---|---|
| Boat Trips on the Tagus (1030) | — |
| Lisbon's Nightlife (1038) | LUX Frágil; Urban Beach; BOSQ |
| Learn to Surf Together (1050) | — |
| The Best Rooftop Bars (1057) | Park Rooftop; TOPO Martim Moniz; Rio Maravilha |
| Eat Together (1069) | Príncipe do Calhariz; Time Out Market; Adega do Tagarro; Cervejaria Trindade |
| Bikes, Tuk-Tuks & Segways (1083) | — |
| LX Factory & Street Art (1091) | — |
| Free Walking Tours & Football (1100) | — |
| Relax at the Beach (1108) | — |

### Information for Travellers · travellers · página línea 1122

| Sección | Lugares |
|---|---|
| Weather & Best Time to Visit (1133) | — |
| Getting from the Airport (1145) | — |
| Where to Stay in Lisbon (1152) | Alfama; Príncipe Real / Bairro Alto; Baixa / Chiado; Avenida da Liberdade |
| Portuguese for Beginners (1186) | — |
| Business Hours & Traffic (1193) | — |
| The Lisboa Card (1205) | — |
| Emergency Contacts (1212) | — |

## Cierre de esta entrega

La [spec](guides-cms-execution.md) fija UX, contratos propuestos, migración de flags,
reglas de visibilidad, ownership, dos write sets disjuntos y QA independiente, con
gates y aceptación verificables. Los nombres de APIs nuevas son propuestas, no código
existente. No hay candidato de implementación ni aprobación QA del CMS.

Verificación documental: revisión cruzada de tres agentes y orquestador, referencias
locales/públicas y comprobación de diff/archivos. Typecheck/lint/tests/build/db:check
quedan para implementación, no se declaran pasados en esta auditoría.
