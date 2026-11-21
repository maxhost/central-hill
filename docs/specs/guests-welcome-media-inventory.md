# Inventario de subidas de imagen — Guests Welcome

Base `ec7f610`; inventario construido antes de editar producto. Generador: `scripts/qa/guests-welcome-media/inventory.ts` recorre el mismo `describe(pageSchemas)` que el editor y distingue nodos ocultos y accept video/document. Cruce manual de todos los usos MediaField/MediaGalleryField y renderizadores. Estado inicial de cada caso: **PENDIENTE**, nunca aprobado por compartir uploader.

D=1440×1000; M=390×844; Welcome añade880/881. Cada campo visible requiere ciclo UI selección local → Save Draft → recarga → Publish → destinos públicos y preview si disponible. Fixtures conocido recomendado +3:2+2:3+1:1 (sin duplicar el recomendado);16:9 cuando hint/contrato lo pide. Captura+medición D/M en cada destino y ratio; metadata/naturalWidth/naturalHeight/fit/posición/overflow. En listas: cada campo tipado, creación+sustitución y variantes de layout, sin dar por cubierto otro destino.

## Páginas fijas

| Caso | Página/campo | Editor/preview | Destino público | Contrato D/M | Estado |
|---|---|---|---|---|---|
| P01 | home.hero.poster_media_id | /admin/pages/home; live preview | /<locale> | Hero: cover centrado; altura mínima por Hero, contenido/viewport (sin ratio fijo) | APROBADO — Home4ratios |
| P02 | home.guests_pitch.image_media_id | /admin/pages/home; live preview | /<locale> | 4:5 fijo; cover centrado D/M | APROBADO — Home4ratios |
| P03 | home.dual_cta.owner.image_media_id | /admin/pages/home; live preview | /<locale> | Panel: cover centrado; alto contenido, D dos columnas/M apilado | APROBADO — Home4ratios |
| P04 | home.dual_cta.guest.image_media_id | /admin/pages/home; live preview | /<locale> | Panel: cover centrado; alto contenido, D dos columnas/M apilado | APROBADO — Home4ratios |
| P05 | owners.hero.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | Hero: cover centrado; altura contenido/viewport | APROBADO — Owners9instancias/4ratios |
| P06 | owners.services.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | 4:5 fijo; cover centrado D/M | APROBADO — Owners9instancias/4ratios |
| P07 | owners.journey.steps[].image_media_id; repetible {'min': 5, 'max': 5} | /admin/pages/owners; live preview | /<locale>/owners | StepGallery: cover centrado; min360px, columnas5/2/1, alto contenido; NO3:4 fijo | APROBADO — Owners9instancias/4ratios |
| P08 | owners.dashboard.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | 4:5 fijo; cover centrado D/M | APROBADO — Owners9instancias/4ratios |
| P09 | owners.final_cta.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | 4:5 fijo; cover centrado D/M | APROBADO — Owners9instancias/4ratios |
| P10 | real_estate.hero.image_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | Hero: cover centrado; altura contenido/viewport | APROBADO — RE47originales+Processcreado/reemplazado |
| P11 | real_estate.capabilities.image_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | 4:5 fijo; cover centrado D/M | APROBADO — RE47originales+Processcreado/reemplazado |
| P12 | real_estate.asset_management.benefits[].image_media_id; repetible {'min': 6, 'max': 6} | /admin/pages/real_estate; live preview | /<locale>/real-estate | PhotoFeatureGrid card: cover centrado; alto según texto/grid | APROBADO — RE47originales+Processcreado/reemplazado |
| P13 | real_estate.market.fundamentals.image_left_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | MarketVisualPair: cover centrado; marcos horizontales del bento | APROBADO — RE47originales+Processcreado/reemplazado |
| P14 | real_estate.market.fundamentals.image_right_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | MarketVisualPair: cover centrado; marcos horizontales del bento | APROBADO — RE47originales+Processcreado/reemplazado |
| P15 | real_estate.process.steps[].image_media_id; repetible {'min': 3, 'max': 8} | /admin/pages/real_estate; live preview | /<locale>/real-estate | StepGallery: cover centrado; min360px/alto contenido; NO2:3 fijo | APROBADO — RE47originales+Processcreado/reemplazado |
| P16 | about.hero.image_media_id | /admin/pages/about; live preview | /<locale>/about | Hero compacto: cover centrado; altura viewport/contenido | APROBADO — Aboutoriginales+creación/reemplazos |
| P17 | about.story.image_media_id | /admin/pages/about; live preview | /<locale>/about | IntroSplit stretch; imagen intrínseca si no domina texto; cover cuando estira; min380D/280M | APROBADO — Aboutoriginales+creación/reemplazos |
| P18 | about.serve.audiences[].image_media_id; repetible {'min': 1, 'max': 12} | /admin/pages/about; live preview | /<locale>/about | PhotoFeatureGrid: cover centrado; alto según texto/grid | APROBADO — Aboutoriginales+creación/reemplazos |
| P19 | about.organisation.image_media_id | /admin/pages/about; live preview | /<locale>/about | 4:5 fijo; cover centrado D/M | APROBADO — Aboutoriginales+creación/reemplazos |
| P20 | about.certifications.items[].logo_media_id; repetible {'min': 1, 'max': 12} | /admin/pages/about; live preview | /<locale>/about | contain sin deformar; alto48px anchoauto max160px D/M | APROBADO — Aboutoriginales+creación/reemplazos |
| P21 | about.community.image_media_id | /admin/pages/about; live preview | /<locale>/about | IntroSplit stretch; imagen intrínseca si no domina texto; cover cuando estira; min380D/280M | APROBADO — Aboutoriginales+creación/reemplazos |
| P22 | about.contact.cards[].image_media_id; repetible {'min': 1, 'max': 12} | /admin/pages/about; live preview | /<locale>/about | PhotoFeatureGrid: cover centrado; alto según texto/grid | APROBADO — Aboutoriginales+creación/reemplazos |
| P23 | guest.hero.poster_media_id | /admin/pages/guest; live preview | /<locale>/guests | Hero: cover centrado; altura viewport/contenido | APROBADO —4ratios, preview/publicD/M; Welcome conservado |
| P24 | guest.welcome.image_media_id | /admin/pages/guest; live preview | /<locale>/guests | Candidato3:2 fijo D/M/880/881; cover centrado. Base falla esperado. | PENDIENTE |
| P25 | blog.hero.image_media_id | /admin/pages/blog; live preview | /<locale>/blog | Hero compacto: cover centrado; altura viewport/contenido | APROBADO —4ratios, preview/publicD/M |
| P26 | guides.hero.poster_media_id | /admin/pages/guides; live preview | /<locale>/guides | Hero compacto: cover centrado; altura viewport/contenido | APROBADO —4ratios, preview/publicD/M |
| P27 | guides.guide_aside.image_media_id | /admin/pages/guides; live preview surface=shared_aside | /<locale>/guides/<city>/<slug> | 16:10 fijo D/M; cover centrado en cada guide detail | APROBADO —4ratios, preview/publicD/M |
| P28 | buildings.hero.image_media_id | /admin/pages/buildings; live preview | /<locale>/buildings | Hero: cover centrado; altura viewport/contenido | APROBADO —4ratiosUI |
| P29 | buildings.calculator.media_media_id | /admin/pages/buildings; live preview | /<locale>/buildings | Desktop≥981px: altura del formulario; ≤980px:4:5 fijo. Cover centrado en ambos | APROBADO —4ratios y981/980boundary |
| P30 | services.hero.media_media_id | /admin/pages/services; live preview | /<locale>/services | Hero: cover centrado; altura viewport/contenido | APROBADO —4ratios, preview/publicD/M |
| P31 | services.hero.poster_media_id | /admin/pages/services; live preview | /<locale>/services | Poster de vídeo/Lottie/WebP reduced motion; mismo frame Hero | APROBADO —4ratios, preview/publicD/M |
| P32 | services.final_cta.media_media_id | /admin/pages/services; live preview | /<locale>/services | 4:5 fijo D/M; cover centrado | APROBADO —4ratios, preview/publicD/M |
| P33 | services.final_cta.poster_media_id | /admin/pages/services; live preview | /<locale>/services | Poster de vídeo/Lottie/WebP reduced motion; mismo frame4:5 | APROBADO —4ratios, preview/publicD/M |

## OG de páginas (fuera del schema data)

| Caso | Campo/editor | Destinos | Contrato | Estado |
|---|---|---|---|---|
| O01 | home.og_image_media_id — /admin/pages/home → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O02 | owners.og_image_media_id — /admin/pages/owners → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O03 | real_estate.og_image_media_id — /admin/pages/real_estate → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | APROBADO —4ratios ×4locales; recibo og-about-real-estate/results-about-real_estate.json |
| O04 | about.og_image_media_id — /admin/pages/about → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | APROBADO —4ratios ×4locales; recibo og-about-real-estate/results-about-real_estate.json |
| O05 | guest.og_image_media_id — /admin/pages/guest → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O06 | blog.og_image_media_id — /admin/pages/blog → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O07 | guides.og_image_media_id — /admin/pages/guides → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O08 | buildings.og_image_media_id — /admin/pages/buildings → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O09 | services.og_image_media_id — /admin/pages/services → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O10 | privacy_policy.og_image_media_id — /admin/pages/privacy_policy → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O11 | cookies_policy.og_image_media_id — /admin/pages/cookies_policy → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O12 | complaints_book.og_image_media_id — /admin/pages/complaints_book → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |

## Entidades y campos compartidos

| Caso | Campo/editor | Preview/destinos explícitos | Contrato D/M / variantes | Estado |
|---|---|---|---|---|
| E01 | building.cover_media_id — /admin/buildings/new + /admin/buildings/<id> | live detail preview; Home portfolio, Guests portfolio, Buildings listing, Building detail hero; OG fallback | Cards4:3 cover; Hero cover viewport/contenido; metadata | PENDIENTE |
| E02 | building.gallery[] — mismo → Gallery | live detail preview; Building detail MosaicGallery | intrínseco/mosaico según ratios; cubrir creación+sustitución y1/2/3/4/5+ | PENDIENTE |
| E03 | building.og_image_media_id — mismo → SEO | Building detail metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E04 | apartment.cover_media_id — /admin/buildings/<building-id>/apartments/new + /admin/buildings/<building-id>/apartments/<id> | editor; tarjetas apartamentos en Building detail (no ruta apartment) | 4:3 cover centrado | PENDIENTE |
| E05 | service.cover_media_id — /admin/services/new + /admin/services/<id> | preview detalle; Home carousel, Guests teaser, Services listing, Service detail galería | Home carousel3:4; Services listing4:3; Guests teaser background min260px/alto texto; Service detail galería4tiles | PENDIENTE |
| E06 | service.gallery[] — mismo → Media | preview detalle; Service detail galería+Show all dialog | Service detail siempre4tiles, rellenados con placeholders si faltan; probar1–6selecciones; >4ShowAll dialog contain/intrínseco; creación+sustitución | PENDIENTE |
| E07 | service.detail.itinerary[].media_id — mismo → Detail/Itinerary | preview detalle; Service detail itinerary | square cover; lista crear+sustituir en cada plantilla que admite itinerary | PENDIENTE |
| E08 | service.og_image_media_id — mismo → SEO | Service detail metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E09 | guide.hero_media_id — /admin/guides/new + /admin/guides/<id> | guide preview; Guides listing, Guests activities teaser, Guide detail hero/gallery | cards4:3 cover; detail adaptive gallery; todos templates9 | PENDIENTE |
| E10 | guide.og_image_media_id — mismo → SEO | Guide detail metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E11 | guide.sections[].header_media_id — mismo → section image | guide preview; Guide detail section | 16:9 cover; layouts standard/with_cta/with_media/featured_places según controles visibles; creación+sustitución | PENDIENTE |
| E12 | guide.sections[].places[].media_id — mismo → section place image | guide preview; Guide detail place/card, Guides recommendations | layouts/presentation variantes; recomendaciones4:3 cover; creación+sustitución | PENDIENTE |
| E13 | post.cover_media_id — /admin/posts/new + /admin/posts/<id> | live post preview; Blog featured, journal cards, Blog post cover; OG fallback | Journal4:3 centrado; featured min340D/240M cover centrado; article singlecover adaptiveclamp300–480px con object-position50%62% | PENDIENTE |
| E14 | post.og_image_media_id — mismo → SEO | Blog post metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E15 | post.body[].image.media_id — BodyEditor/PostForm legacy | NO APLICA: no montado en ruta actual; /admin/posts/new y existente usan PostLocaleEditor→PostRichTextEditor | Control retirado; los documentos legacy se migran al editor rich (E16) | N/A, código consumidor verificado |
| E16 | post.body.doc.image.attrs.media_id — /admin/posts/new y /admin/posts/<id>, rich editor → Image | live post preview; Blog post body | Figura3:2 cover; controles media_id/caption/alt (sin alignment/width); crear+sustituir, documentos EN/ES propios | PENDIENTE |
| E17 | author.avatar_media_id — /admin/authors/new + /admin/authors/<id> | Sin destino visual público: blog-post.tsx dibuja inicial del nombre, no avatar; persistencia en editor | Persistencia obligatoria; sin frame público, blog-post.tsx líneas194–198 usa inicial | PENDIENTE |
| E18 | city.hero_media_id — /admin/cities/new + /admin/cities/<id> | Sin destino visual actual: City DTO resuelve hero, guides-listing.tsx solo usa id/name y hero de Pages | Persistencia obligatoria; no hay frame público actual | PENDIENTE |
| E19 | settings.default_og_image_media_id — /admin/settings → SEO | metadata default de Blog/Services/Guides sin override propio; SiteJsonLd.logo global en todas las rutas (pages, legales y detalles) | URL/dimensiones; sin marco; Settings guarda inmediatamente, no Publish separado | PENDIENTE |

## No aplicable / controles de exclusión

- Hero video-only: Home.hero.video_media_id, Guests.hero.video_media_id, Guides.hero.video_media_id no admiten imagen. Welcome vídeo/Lottie real se cubre adicionalmente por el orquestador.
- Real Estate.hero.capability_statement_media_id admite únicamente PDF; no es upload de imagen.
- Real Estate.asset_management.image_media_id está retirado/adminHidden; no existe control UI público. Los seis benefits[].image_media_id activos sí están arriba.
- Guests.services_teaser.items y activities_teaser.items están retirados/adminHidden; sus imágenes reales proceden de Services/Guides, con destinos explícitos arriba.
- Branding/navbar/footer logos usan archivos estáticos en código; Settings no expone upload de logo/favicon. Site icons son Iconoir, sin fichero imagen.
- Privacy/Cookies/Complaints admiten rich text solo textual, sin inserción de imagen; sí tienen uploader OG independiente (O10–O12).
- Apartments no ofrece gallery/OG/description uploader en los editores actuales ni ruta pública propia: columnas legacy no equivalen a controles disponibles.

## Auditoría reproducible

`rg -n "MediaField|MediaGalleryField" src --glob "*.tsx"` cubre todos los controles directos. `inventory.ts` cubre schemas dinámicos incluidos descendientes ocultos. Cruce con `src/slices/pages/admin/ui/schema-fields.tsx`, `page-contextual-editor.tsx` y renderizadores públicos. El body legacy retirado se marca N/A; los controles rich se verifican en creación y edición, junto con el resto de entidades.

Totales iniciales: 33 campos de imagen de páginas (tipos lógicos; listas expanden instancias),12OG páginas,19campos entidad/compartidos; 64entradas iniciales;63tipos activos y1control legacy retirado. Consumer avatar/city comprobado: no imagen pública, solo persistencia. Contratos de instancias repetibles se medirán en ejecución. El estado vigente figura en cada fila y en el avance de ejecución.

## Correcciones del cruce con rutas efectivas

Durante la ejecución se comprobó `src/app/(admin)/admin/posts/new/page.tsx`: usa PostLocaleEditor→PostRichTextEditor también al crear; BodyEditor/PostForm no está montado. E15 queda N/A con motivo, E16 debe acreditar creación y sustitución reales en ambos estados. Las rutas efectivas de Posts/Authors son `/admin/posts` y `/admin/authors`; Apartments están anidados en Buildings. Estas correcciones de inventario no implican cambios de producto ni omisión de un control disponible.

## Avance de ejecución

Los recibos privados están en `/private/tmp/central-hill-guests-welcome/matrix`. El manifiesto reproducible `node scripts/qa/guests-welcome-media/manifest.mjs` genera `pages-manifest.json`, con cada P01–P33, instancia concreta, ratios exigidos, IDs, metadatos, URLs originales, medidas, recibos y capturas. Solo acredita ciclos completos: upload real por UI, blob local, Save Draft, reload, Publish, preview guardado y público desktop/móvil. P24 remite al recibo independiente; no recibe aprobación implícita.

- Home P01–P04: 16 ciclos. `home-3-2-results.json`, `home-2-3-1-1-history.json` y `home-recommended-results.json`. El suplemento `home-poster-visible-results.json` confirma el poster seleccionado decodificado y ausencia de fotogramas de vídeo (readyState0/videoWidth0) en desktop/móvil.
- Owners P05–P09: nueve instancias y 36 ciclos. Journey tiene cinco filas fijas: crear una sexta es N/A; se reemplazaron las cinco existentes y se midieron también a768px, con cinco/dos/una columnas según breakpoint.
- About P16–P22: 49 operaciones de las13 instancias originales, tres creaciones reales con preview/public desktop/móvil y nueve reemplazos de nuevas filas. Son60 casos únicos porque el recomendado de logos coincide con3:2. Doce imágenes repetibles verificadas a768px. Story/Community conservan su regla intrínseca/stretch; logos usan contain, alto48px y ancho máximo160px.
- Real Estate P10–P15: 47 ciclos de15 instancias originales; sexta fila Process creada y sustituida en2:3/1:1, total50 casos únicos. Doce fotos repetibles (seis Asset y seis Process) verificadas a768px.
- Buildings P28/P29: cuatro ratios por campo. `buildings-calculator-recommended-results.json` valida el contrato real del Calculator; `calculator-contract-results.json` añade1440/981/980/768/390px.
- Blog P25 y Guides P26/P27: cuatro ratios por campo. Se usaron las superficies privadas `page`/`shared_aside` y un Guide propio publicado. Solo el primer Hero3:2 requirió retest por inicialización del preview; `guides-hero-retest-3-2-results.json` cierra ese caso.
- Services P30–P33: 16 ciclos completos en `services-images-recommended-results.json` y `services-posters-recommended-results.json`. Los posters se seleccionan con vídeo MP4 real y reduced motion, manteniendo src ausente; se decodifica la imagen efectiva y se comprueban dimensiones naturales, cover centrado y frame.
- Guest Hero P23: cuatro ratios completos, cero fallos, en `guest-hero-final-results.json`. La igualdad profunda del bloque Welcome se comprobó después de cada Save Draft y Publish. El poster seleccionado permaneció visible sin fotogramas de vídeo, en desktop/móvil. Welcome P24 pertenece a QA independiente y mantiene su estado separado.

Resultado Pages propio: 32 tipos y55 instancias, 202 casos únicos acreditados, cero pendientes propios y cero discrepancias de estabilidad del frame entre ratios. El suplemento readonly `natural-dimensions-results.json` decodifica los202 originales en Chromium y contrasta ancho/alto naturales exactos con los metadatos persistidos. Esto incluye los recibos antiguos de CSS background y poster que no almacenaban esas dimensiones en su JSON. No representa cobertura de otros motores de navegador.

Los fallos históricos de infraestructura/harness se conservan. Se corrigieron el selector accesible Mobile390px, la espera de hidratación del uploader, la espera del blob exacto y el manejo de snapshots publicados sin draft. El proxy antiguo agotó conexiones53300; los casos completos se conservaron y solo los interrumpidos se retomaron tras verificar el gateway y puente a PostgreSQL real. Nunca se simuló una subida exitosa. Para medir posters se induce un fallo real de descarga del vídeo solo en el contexto de navegador correspondiente, o se usa reduced motion; no se acredita el mero atributo poster mientras otro contenido reproduce.

### P29 — resolución del hint de Calculator

El E2E mostró568×489.890625px en desktop, igual a la altura del formulario. El diagnóstico inicial suponía4:5 también allí; `buildings-sections.tsx` ya aplica explícitamente desde981px `aspect-auto` y altura del formulario, y por debajo conserva4:5. Se conserva ese diseño y se corrige solo el hint inglés y su comentario. Los cuatro ratios de archivo cumplen desktop frame=formulario±1px y móvil4:5, sin cambiar la altura del frame por ratio. Los recibos de la aserción inicial universal4:5 permanecen como evidencia de la discrepancia y no se acreditan como aprobados.

### Cierre visual de Reveal

La revisión visual de root detectó un clip móvil de Owners Services completamente papel. La auditoría de398 clips públicos PNG encontró67 clips sin píxeles del fixture (35 desktop y32 móvil), correspondientes a15 tipos y18 instancias. Las mediciones anteriores habían esperado la decodificación y geometría, pero algunas capturas precedían a la aparición del ancestro Reveal: se reprodujo opacity0 inmediatamente después de scroll y opacity1 al completar la transición. Esos67 archivos se conservan y no acreditan por sí mismos una imagen visible.

`visual-close.mjs` audita los PNG y recaptura solo lectura las18 instancias actualmente publicadas en desktop/móvil. Espera identidad del medio seleccionado, decodificación y aspecto natural, opacidad/visibilidad de todos los ancestros, dos animationframes y scroll/geometría estables; captura medio y sección y comprueba píxeles no papel. El resultado privado es `matrix/visual-close-results.json`; los nombres `visual-close-*-media.png` y `visual-close-*-section.png` son la evidencia de pintura posterior al Reveal. En Services FinalCTA el principal publicado ya es el MP4 real de la matriz anterior; el suplemento usa reduced motion y valida el UUID de su poster PNG efectivo con src ausente, videoWidth0 y readyState0. No se acredita un fotograma MP4 como prueba de ese poster. No se repiten uploads ni Save/Publish, no se reemplaza el DOM y se contrasta que los snapshots de Pages permanecen exactos.

El cierre terminó con36/36 checks de pintura aprobados (18 instancias × desktop/móvil), píxeles reales en cada clip y snapshots exactos. Services móvil se centró explícitamente antes del clip para evitar que el navbar ocultara su borde superior; la primera captura también se conserva. El suplemento acredita el estado publicado actual de esas superficies; los ciclos previos de todos los ratios siguen identificados por sus recibos originales. El fallo404 transitorio durante el cierre ocurrió antes de medir Services, se conservó y solo esos checks pendientes se retomaron tras reabrir QA con caché propia nueva.
