# Inventario de subidas de imagen — Guests Welcome

Base `ec7f610`; inventario construido antes de editar producto. Generador: `scripts/qa/guests-welcome-media/inventory.ts` recorre el mismo `describe(pageSchemas)` que el editor y distingue nodos ocultos y accept video/document. Cruce manual de todos los usos MediaField/MediaGalleryField y renderizadores. Estado inicial de cada caso: **PENDIENTE**, nunca aprobado por compartir uploader.

D=1440×1000; M=390×844; Welcome añade880/881. Cada campo visible requiere ciclo UI selección local → Save Draft → recarga → Publish → destinos públicos y preview si disponible. Fixtures conocido recomendado +3:2+2:3+1:1 (sin duplicar el recomendado);16:9 cuando hint/contrato lo pide. Captura+medición D/M en cada destino y ratio; metadata/naturalWidth/naturalHeight/fit/posición/overflow. En listas: cada campo tipado, creación+sustitución y variantes de layout, sin dar por cubierto otro destino.

## Páginas fijas

| Caso | Página/campo | Editor/preview | Destino público | Contrato D/M | Estado |
|---|---|---|---|---|---|
| P01 | home.hero.poster_media_id | /admin/pages/home; live preview | /<locale> | Hero: cover centrado; altura mínima por Hero, contenido/viewport (sin ratio fijo) | PENDIENTE |
| P02 | home.guests_pitch.image_media_id | /admin/pages/home; live preview | /<locale> | 4:5 fijo; cover centrado D/M | PENDIENTE |
| P03 | home.dual_cta.owner.image_media_id | /admin/pages/home; live preview | /<locale> | Panel: cover centrado; alto contenido, D dos columnas/M apilado | PENDIENTE |
| P04 | home.dual_cta.guest.image_media_id | /admin/pages/home; live preview | /<locale> | Panel: cover centrado; alto contenido, D dos columnas/M apilado | PENDIENTE |
| P05 | owners.hero.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | Hero: cover centrado; altura contenido/viewport | PENDIENTE |
| P06 | owners.services.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | 4:5 fijo; cover centrado D/M | PENDIENTE |
| P07 | owners.journey.steps[].image_media_id; repetible {'min': 5, 'max': 5} | /admin/pages/owners; live preview | /<locale>/owners | StepGallery: cover centrado; min360px, columnas5/2/1, alto contenido; NO3:4 fijo | PENDIENTE |
| P08 | owners.dashboard.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | 4:5 fijo; cover centrado D/M | PENDIENTE |
| P09 | owners.final_cta.image_media_id | /admin/pages/owners; live preview | /<locale>/owners | 4:5 fijo; cover centrado D/M | PENDIENTE |
| P10 | real_estate.hero.image_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | Hero: cover centrado; altura contenido/viewport | PENDIENTE |
| P11 | real_estate.capabilities.image_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | 4:5 fijo; cover centrado D/M | PENDIENTE |
| P12 | real_estate.asset_management.benefits[].image_media_id; repetible {'min': 6, 'max': 6} | /admin/pages/real_estate; live preview | /<locale>/real-estate | PhotoFeatureGrid card: cover centrado; alto según texto/grid | PENDIENTE |
| P13 | real_estate.market.fundamentals.image_left_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | MarketVisualPair: cover centrado; marcos horizontales del bento | PENDIENTE |
| P14 | real_estate.market.fundamentals.image_right_media_id | /admin/pages/real_estate; live preview | /<locale>/real-estate | MarketVisualPair: cover centrado; marcos horizontales del bento | PENDIENTE |
| P15 | real_estate.process.steps[].image_media_id; repetible {'min': 3, 'max': 8} | /admin/pages/real_estate; live preview | /<locale>/real-estate | StepGallery: cover centrado; min360px/alto contenido; NO2:3 fijo | PENDIENTE |
| P16 | about.hero.image_media_id | /admin/pages/about; live preview | /<locale>/about | Hero compacto: cover centrado; altura viewport/contenido | PENDIENTE |
| P17 | about.story.image_media_id | /admin/pages/about; live preview | /<locale>/about | IntroSplit stretch; imagen intrínseca si no domina texto; cover cuando estira; min380D/280M | PENDIENTE |
| P18 | about.serve.audiences[].image_media_id; repetible {'min': 1, 'max': 12} | /admin/pages/about; live preview | /<locale>/about | PhotoFeatureGrid: cover centrado; alto según texto/grid | PENDIENTE |
| P19 | about.organisation.image_media_id | /admin/pages/about; live preview | /<locale>/about | 4:5 fijo; cover centrado D/M | PENDIENTE |
| P20 | about.certifications.items[].logo_media_id; repetible {'min': 1, 'max': 12} | /admin/pages/about; live preview | /<locale>/about | contain sin deformar; alto48px anchoauto max160px D/M | PENDIENTE |
| P21 | about.community.image_media_id | /admin/pages/about; live preview | /<locale>/about | IntroSplit stretch; imagen intrínseca si no domina texto; cover cuando estira; min380D/280M | PENDIENTE |
| P22 | about.contact.cards[].image_media_id; repetible {'min': 1, 'max': 12} | /admin/pages/about; live preview | /<locale>/about | PhotoFeatureGrid: cover centrado; alto según texto/grid | PENDIENTE |
| P23 | guest.hero.poster_media_id | /admin/pages/guest; live preview | /<locale>/guests | Hero: cover centrado; altura viewport/contenido | PENDIENTE |
| P24 | guest.welcome.image_media_id | /admin/pages/guest; live preview | /<locale>/guests | Candidato3:2 fijo D/M/880/881; cover centrado. Base falla esperado. | PENDIENTE |
| P25 | blog.hero.image_media_id | /admin/pages/blog; live preview | /<locale>/blog | Hero compacto: cover centrado; altura viewport/contenido | PENDIENTE |
| P26 | guides.hero.poster_media_id | /admin/pages/guides; live preview | /<locale>/guides | Hero compacto: cover centrado; altura viewport/contenido | PENDIENTE |
| P27 | guides.guide_aside.image_media_id | /admin/pages/guides; live preview | /<locale>/guides/<slug> | 16:10 fijo D/M; cover centrado en cada guide detail | PENDIENTE |
| P28 | buildings.hero.image_media_id | /admin/pages/buildings; live preview | /<locale>/buildings | Hero: cover centrado; altura viewport/contenido | PENDIENTE |
| P29 | buildings.calculator.media_media_id | /admin/pages/buildings; live preview | /<locale>/buildings | 4:5 fijo D/M; cover centrado | PENDIENTE |
| P30 | services.hero.media_media_id | /admin/pages/services; live preview | /<locale>/services | Hero: cover centrado; altura viewport/contenido | PENDIENTE |
| P31 | services.hero.poster_media_id | /admin/pages/services; live preview | /<locale>/services | Poster de vídeo/Lottie/WebP reduced motion; mismo frame Hero | PENDIENTE |
| P32 | services.final_cta.media_media_id | /admin/pages/services; live preview | /<locale>/services | 4:5 fijo D/M; cover centrado | PENDIENTE |
| P33 | services.final_cta.poster_media_id | /admin/pages/services; live preview | /<locale>/services | Poster de vídeo/Lottie/WebP reduced motion; mismo frame4:5 | PENDIENTE |

## OG de páginas (fuera del schema data)

| Caso | Campo/editor | Destinos | Contrato | Estado |
|---|---|---|---|---|
| O01 | home.og_image_media_id — /admin/pages/home → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O02 | owners.og_image_media_id — /admin/pages/owners → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O03 | real_estate.og_image_media_id — /admin/pages/real_estate → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
| O04 | about.og_image_media_id — /admin/pages/about → SEO | metadata OG/Twitter de ruta propia en4locales | persistencia URL y dimensiones reales; sin marco visible | PENDIENTE |
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
| E04 | apartment.cover_media_id — /admin/apartments/new + /admin/apartments/<id> | editor; tarjetas apartamentos en Building detail (no ruta apartment) | 4:3 cover centrado | PENDIENTE |
| E05 | service.cover_media_id — /admin/services/new + /admin/services/<id> | preview detalle; Home carousel, Guests teaser, Services listing, Service detail galería | Cards4:3 cover; adaptive gallery1/2/3/4/5+ | PENDIENTE |
| E06 | service.gallery[] — mismo → Media | preview detalle; Service detail galería+Show all dialog | adaptive1/2/3/4/5+; dialog contain/intrínseco; creación+sustitución | PENDIENTE |
| E07 | service.detail.itinerary[].media_id — mismo → Detail/Itinerary | preview detalle; Service detail itinerary | square cover; lista crear+sustituir en cada plantilla que admite itinerary | PENDIENTE |
| E08 | service.og_image_media_id — mismo → SEO | Service detail metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E09 | guide.hero_media_id — /admin/guides/new + /admin/guides/<id> | guide preview; Guides listing, Guests activities teaser, Guide detail hero/gallery | cards4:3 cover; detail adaptive gallery; todos templates9 | PENDIENTE |
| E10 | guide.og_image_media_id — mismo → SEO | Guide detail metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E11 | guide.sections[].header_media_id — mismo → section image | guide preview; Guide detail section | 16:9 cover; layouts standard/with_cta/with_media/featured_places según controles visibles; creación+sustitución | PENDIENTE |
| E12 | guide.sections[].places[].media_id — mismo → section place image | guide preview; Guide detail place/card, Guides recommendations | layouts/presentation variantes; recomendaciones4:3 cover; creación+sustitución | PENDIENTE |
| E13 | post.cover_media_id — /admin/blog/posts/new + /admin/blog/posts/<id> | live post preview; Blog featured, journal cards, Blog post cover; OG fallback | Cards4:3; featured alto340D/240M cover; post hero layout definido | PENDIENTE |
| E14 | post.og_image_media_id — mismo → SEO | Blog post metadata4locales | URL/dimensiones; sin marco | PENDIENTE |
| E15 | post.body[].image.media_id — post nuevo BodyEditor → image | legacy post preview/public migrado | legacy imagen3:2 clase+hauto; comprobar resultado real; crear+sustituir | PENDIENTE |
| E16 | post.body.doc.image.attrs.media_id — post existente rich editor → Image | live post preview; Blog post body | variantes de alignment/width permitidas; intrínseco/cover según attrs; crear+sustituir | PENDIENTE |
| E17 | author.avatar_media_id — /admin/blog/authors/new + /admin/blog/authors/<id> | Sin destino visual público: blog-post.tsx dibuja inicial del nombre, no avatar; persistencia en editor | Persistencia obligatoria; sin frame público, blog-post.tsx líneas194–198 usa inicial | PENDIENTE |
| E18 | city.hero_media_id — /admin/cities/new + /admin/cities/<id> | Sin destino visual actual: City DTO resuelve hero, guides-listing.tsx solo usa id/name y hero de Pages | Persistencia obligatoria; no hay frame público actual | PENDIENTE |
| E19 | settings.default_og_image_media_id — /admin/settings → SEO | metadata default de9páginas+3legales+Building/Service/Guide/Post en ausencia override | URL/dimensiones; sin marco; Settings guarda inmediatamente, no Publish separado | PENDIENTE |

## No aplicable / controles de exclusión

- Hero video-only: Home.hero.video_media_id, Guests.hero.video_media_id, Guides.hero.video_media_id no admiten imagen. Welcome vídeo/Lottie real se cubre adicionalmente por el orquestador.
- Real Estate.hero.capability_statement_media_id admite únicamente PDF; no es upload de imagen.
- Real Estate.asset_management.image_media_id está retirado/adminHidden; no existe control UI público. Los seis benefits[].image_media_id activos sí están arriba.
- Guests.services_teaser.items y activities_teaser.items están retirados/adminHidden; sus imágenes reales proceden de Services/Guides, con destinos explícitos arriba.
- Branding/navbar/footer logos usan archivos estáticos en código; Settings no expone upload de logo/favicon. Site icons son Iconoir, sin fichero imagen.
- Privacy/Cookies/Complaints admiten rich text solo textual, sin inserción de imagen; sí tienen uploader OG independiente (O10–O12).
- Apartments no ofrece gallery/OG/description uploader en los editores actuales ni ruta pública propia: columnas legacy no equivalen a controles disponibles.

## Auditoría reproducible

`rg -n "MediaField|MediaGalleryField" src --glob "*.tsx"` cubre todos los controles directos. `inventory.ts` cubre schemas dinámicos incluidos descendientes ocultos. Cruce con `src/slices/pages/admin/ui/schema-fields.tsx`, `page-contextual-editor.tsx` y renderizadores públicos. Los módulos de body legacy/rich y entidades nuevos/existentes se enumeran por separado cuando cambian los controles.

Totales iniciales: 33 campos de imagen de páginas (tipos lógicos; listas expanden instancias),12OG páginas,19campos entidad/compartidos; 64tipos de campo. Consumer avatar/city comprobado: no imagen pública, solo persistencia. Contratos de instancias repetibles se medirán en ejecución. Ningún caso ejecutado todavía.
