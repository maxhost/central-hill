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
| P23 | guest.hero.poster_media_id | /admin/pages/guest; live preview | /<locale>/guests | Hero: cover centrado; altura viewport/contenido | PENDIENTE |
| P24 | guest.welcome.image_media_id | /admin/pages/guest; live preview | /<locale>/guests | Candidato3:2 fijo D/M/880/881; cover centrado. Base falla esperado. | PENDIENTE |
| P25 | blog.hero.image_media_id | /admin/pages/blog; live preview | /<locale>/blog | Hero compacto: cover centrado; altura viewport/contenido | PENDIENTE |
| P26 | guides.hero.poster_media_id | /admin/pages/guides; live preview | /<locale>/guides | Hero compacto: cover centrado; altura viewport/contenido | PENDIENTE |
| P27 | guides.guide_aside.image_media_id | /admin/pages/guides; live preview surface=shared_aside | /<locale>/guides/<city>/<slug> | 16:10 fijo D/M; cover centrado en cada guide detail | PENDIENTE |
| P28 | buildings.hero.image_media_id | /admin/pages/buildings; live preview | /<locale>/buildings | Hero: cover centrado; altura viewport/contenido | APROBADO —4ratiosUI |
| P29 | buildings.calculator.media_media_id | /admin/pages/buildings; live preview | /<locale>/buildings | Desktop≥981px: altura del formulario; ≤980px:4:5 fijo. Cover centrado en ambos | APROBADO —4ratios y981/980boundary |
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
| E16 | post.body.doc.image.attrs.media_id — /admin/posts/new y /admin/posts/<id>, rich editor → Image | live post preview; Blog post body | variantes de alignment/width permitidas; intrínseco/cover según attrs; crear+sustituir | PENDIENTE |
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

- Home P01–P04:4campos×4ratios, ciclos UI completos y públicoD/M; preview local y guardada, Mobile explícito adicional en recomendados. Evidencia privada `matrix/home-3-2-results.json`, `home-2-3-1-1-history.json`, `home-recommended-results.json`. Los archivos históricos conservan el fallo posterior de infraestructura/harness; sus casos completos tienen medidas y capturas propias.
- Owners P05–P09:5tipos/9instancias×4ratios, cero fallos de producto. Evidencia `owners-3-2-results.json`, `owners-2-3-results.json`, `owners-recommended-results.json` (contiene también1:1). Journey es5fijo: no existe creación de sexta fila; se reemplazó cada uno de sus5campos.
- Incidencias de harness corregidas: selector usa nombre accesible Mobile390px; espera exacta de blob en preview; no guardar antes de reemplazar referencias huérfanas legacy; snapshot publicado tiene draftnull. Infraestructura antigua agotó conexiones53300; casos completos conservados y solo interrumpidos retomados después de gateway/puentePGreal verificado.
- Exclusión equivalente: `FormsRuntime` tiene input de adjunto del visitante; no es un campo de medio editorial, no produce un frame ni publica una imagen y persiste metadatos privados. No se crearon File fields ni asignaciones de Forms para este plan. La matriz cubre todos los uploads CMS montados.

### P29 — resolución del hint de Calculator

El E2E real mostró568×489.890625px en desktop, igual a la altura del formulario; el diagnóstico inicial había supuesto4:5 también allí. `buildings-sections.tsx` ya documenta explícitamente y aplica desde981px `aspect-auto`/altura del formulario; por debajo conserva4:5. Se conserva ese diseño, se corrige solo el hint inglés y el comentario del schema, y la prueba exige ambas ramas. Los archivos con la aserción inicial universal4:5 se conservan como evidencia de la discrepancia; no se acreditan como P29 aprobado.

- About P16–P22:49ciclos de las13instancias originales;3creaciones conpreview/publicD/M y9reemplazos nuevos.12fotos repetibles verificadas a768px;Story/Community cumplen su regla intrínseca/stretch ylogoscontain48/max160.
- Real Estate P10–P15:47ciclos de15instancias originales;Process6°creado y reemplazado en2:3/1:1.12fotos repetibles(6Asset+6Process)verificadas a768px.
- P28HeroBuildings:4ratios aprobados; P29 se retesta solo tras corregirhint, preservando evidencia inicial y la cobertura Hero.
- P01Homeposter:suplemento `home-poster-visible-results.json` confirmaPNGseleccionadodecodificado y ausencia de fotogramas de vídeo(readyState0/videoWidth0)enD/M. Se induce fallo de descarga del vídeo solo en ese contexto de lectura; la subida exitosa jamás se simula.

- P29retestfinal:4ratios completos condesktopframe=alturaFormulario±1px y móvil4:5. Fuente `buildings-calculator-recommended-results.json`; medidas ycapturas a1440/981/980/768/390en `calculator-contract-results.json`. El cambio de ratio de archivo no cambia la altura del frame desktop, verificado por comparación de medidas.
- Manifiesto reproducible: `node scripts/qa/guests-welcome-media/manifest.mjs` genera el índice privado `matrix/pages-manifest.json` porP01–P33, instancias concretas, ratios requeridos, IDs/metadatos de archivos propios, recibos y capturas. No acredita un caso sin evidencia; exige creación de listas variables/tablet yvisibilidadrealdeposters. P24remite alrecibo independiente y no se aprueba implícitamente.
