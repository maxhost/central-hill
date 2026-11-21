# Guests Welcome — QA de imágenes de entidades

2026-11-21. Implementador A; trabajo aislado en
`/private/tmp/central-hill-guests-welcome/media`, rama
`fix/guests-welcome-media-renderer`. Ejecución exclusivamente en
`welcomeqa20261121`/rol homónimo, aplicación3091 y almacenamiento S3 real de bytes
9092. Ningún dato ni medio de autoría/producción se usa como fixture de escritura.
Los resultados y capturas se conservan fuera de Git en
`/private/tmp/central-hill-guests-welcome/entities`.

## Método

Los controles reales reservan la subida, transfieren el archivo mediante PUT y
finalizan su metadata. Cada campo se prueba con Save, recarga y Publish donde el
editor dispone de publicación. City, Author y Settings aplican sus cambios en Save;
no tienen un Publish separado. Se comprueban filas `media_asset`, dimensiones
conocidas, decodificación real, geometría y recorte/centrado en1440×1000 y390×844.
La imagen tiene marcas centrales y bordes para revisión visual. Las galerías y
fondos CSS se comprueban en sus destinos, no solo en el thumbnail del editor.

El namespace de fixtures es `welcome-qa-entity-*`; identidades en el archivo privado
`entities/state.json`. Se conservan los fixtures y todas las evidencias; no hay
limpieza de bases o medios ajenos. Los scripts comprueban la identidad SQL antes de
operar y solo permiten el origen fijo QA.

## Correcciones del inventario contrastadas con rutas actuales

- Posts nuevos y existentes utilizan `PostLocaleEditor` y `PostRichTextEditor`:
  `src/app/(admin)/admin/(panel)/posts/new/page.tsx` y `posts/[id]/page.tsx`.
  El antiguo `PostForm`/`BodyEditor` no está montado por una ruta. E15 se marca N/A
  por ausencia de control; E16 cubre inserción nueva y sustitución rich reales.
  Sus nodos de imagen permiten media/caption/alt; no hay controles de alignment/width.
- Authors viven en `/admin/authors`, no `/admin/blog/authors`. Su avatar no se
  dibuja públicamente: `blog-post.tsx` usa la inicial del nombre.
- Apartments se crean/editan dentro de `/admin/buildings/[id]/apartments`.
  `/admin/apartments/new` solo redirige. No hay ruta pública Apartment independiente.
- Guides se publican en `/<locale>/guides/<city>/<slug>`. Los nueve valores de
  Editorial category se recorren explícitamente. El layout legacy de sección
  `standard/with_cta/with_media/featured_places` no dispone de selector en el editor
  actual; hay módulos con checkboxes. Se registran como variantes sin control UI,
  no como cuatro pruebas ejecutadas.
- Service y Guide no exponen preview de detalle en la aplicación actual. Tienen
  thumbnails reales en sus editores y destinos públicos. Building, Apartment y Post
  sí disponen de rutas preview, que requieren `instance` válido.
- Home ServicesCarousel usa3:4. Services listing usa4:3. Los teasers de Service y
  Guide en Guests son fondos CSS cover centrados con mínimo260px/alto por contenido,
  no imágenes4:3. La galería Service siempre conserva cuatro tiles, con fotos de
  muestra en posiciones aún vacías; más de cuatro fotos abre Show all photos.
- Settings default social image tiene metadata fallback en Blog/Services/Guides
  y alimenta Organization/LodgingBusiness JSON-LD del layout. No se atribuye fallback
  general a rutas cuyo generador no lo implementa. El hint fue corregido por el
  orquestador en los cuatro idiomas para describir estos consumidores reales.

## Hallazgo E07 y corrección

La imagen vertical2:3 de un paso de Service medía108×162 dentro de su frame108×108
(escritorio). La imagen participaba en el sizing de una celda grid; `h-full` no
impedía que su altura intrínseca creciese, con recorte descentrado. Fuente base
`ec7f610` idéntica en este componente. Evidencia privada: `service-error.json`,
fixture `entity-service-2-3.png` y el grupo E07 correspondiente. Ese caso no se aprobó.

Commit de corrección separado `4dfc43f`, integrado por el orquestador como
`6fe3f1d`: únicamente `src/slices/services/ui/components/service-itinerary.tsx`.
El frame ahora es relativo y la imagen lo llena con posición absoluta y cover
centrado; el número de respaldo conserva su grid original. ESLint focal:0errores.
El retest exige cinco ratios y las tres categorías reales, con imágenes y frames
108×108D/76×76M y comprobación de dimensiones naturales.

## Hallazgo E16 y corrección

La reserva real de una imagen rich terminaba mientras `queue.isPreparing` seguía
activo. El callback invocaba el setter genérico protegido por `busy`; el nuevo
`media_id` se descartaba y el render controlado restablecía el nodo vacío. La
imagen nunca llegaba al Save. Esto se reprodujo en el editor real y no se aprobó.

Commit separado `7cb46e6`, integrado como `0f7bf87`: setter específico de body en
`post-locale-editor.tsx` y siete pruebas focales. Permite completar la reserva,
conserva los bloqueos de Save/Publish/archive/delete/navegación y el editor
deshabilitado durante busy. El setter genérico no cambia. Pruebas, typecheck y
ESLint focal aprobados. El E2E posterior verifica IDs válidos en draft y published,
cinco ratios, creación en `/admin/posts/new`, sustitución y publicación reales.
Un body ES propio se sube por el control: toda la fila EN (draft/publicación,
revisión y timestamps) permanece idéntica y cada idioma muestra su propia imagen.

## Matriz ejecutada

| Casos | Evidencia privada | Cobertura |
|---|---|---|
| E01–E03 Building | `building-results.json` | 6 ratios; Home/Guests/listing/detail/gallery/preview D/M; OG4 idiomas |
| E04 Apartment | `apartment-results.json` | 4 ratios; Save/recarga/Publish; card del Building y preview D/M |
| E05–E08 Service | `service-results.json`, `itinerary-retests.json` | 5 ratios; Home/Guests/listing/detail/galería/OG; E07 retestado5×3 categorías tras fix |
| E09–E12 Guide | `guide-results.json`, `guide-templates.json` | 6 ratios y9 templates; todos los4 uploaders por template, destinos list/detail/Guests/recomendaciones y OG |
| E13/E14/E16 Post rich | `post-results.json`, `post-new-route.json`, `post-es-own-body.json` | 5 ratios; Featured/detail/journal/body/preview D/M, OG4 idiomas; creación y aislamiento ES |
| E15 legacy BodyEditor | imports de rutas documentados | N/A: ningún control montado |
| E17 Author | `reference-results.json` | 4 ratios; metadata/recarga/thumbnails D/M; sin destino visual público |
| E18 City | `reference-results.json` | 4 ratios; metadata/recarga/thumbnails D/M; sin destino visual público |
| E19 Settings | `settings-results.json` | 4 ratios;48 páginas de metadata (Blog/Services/Guides×4 idiomas×4 ratios) y JSON-LD |

`gallery-results.json` conserva21 grupos: Building1/2/3/4/5/6 imágenes; Service
1/2/3/4/5/6 fotos y modal Show all para5/6; Guide1/2/3/4/5/6 imágenes con galería
capped5 y todos los headers de sección16:9; Photo module off/on; creación y
sustitución de un Place repetido; quitar el thumbnail de itinerario recupera el
número centrado, y otra subida real lo restablece. Cada destino se mide y captura
en escritorio y móvil. Building conserva su mosaico intrínseco actual; no se le
atribuye un ratio fijo nuevo.

Suplementos de cierre: `cover-fallback-results.json` exige16 grupos de cover→OG
(Building6/Service5/Post5) con4 idiomas cada uno; `site-structured-data.json` exige
64 rutas del layout; `apartment-locales.json` exige ES/PT/FR con EN intacto.
`asset-bytes-audit.json` compara SHA256 y dimensiones del archivo realmente servido
con cada fixture seleccionado. `completion-audit.json` solo se produce si todos
esos resultados están completos. La auditoría de bytes terminó con182 assets seleccionados: todos sus SHA256,
dimensiones y MIME coinciden con los archivos originales;64/64 rutas del layout
contienen Organization y LodgingBusiness con el asset guardado. Los16 grupos
cover→OG y64 comprobaciones de metadata correspondientes están aprobados. Solo
queda el suplemento Apartment ES/PT/FR: la ruta nested devolvió404 en el dev QA,
aunque SQL y Drizzle CLI confirman la fila y su Building correctos. Se conserva
`apartment-locales-error.json`; no se aprueba esa ejecución incompleta. La matriz
E04 anterior4 ratios/Publish/preview/public card permanece válida.

## Incidencias de infraestructura y harness

El proxy NeonHTTP anterior agotó conexiones (`53300`, HTTP500 control plane).
Los runners se detuvieron y los casos incompletos quedaron pendientes; el
orquestador creó un gateway limitado y después un bridge PostgreSQL real con la
misma semántica y guard de identidad. Los resultados completos anteriores se
conservaron. No se trató un500de infraestructura como una aprobación de producto.

Se corrigieron esperas del harness (Publish queda deshabilitado tras publicar;
la nueva espera usa ACK real y recarga), la URL de preview sin `instance`, un
selector Add step con prefijo+ y fixtures Guide sin dirección (requisito real de
Top Recommendations). Solo se repiten los casos incompletos o afectados.

También se corrigió una selección de tab antes de terminar hidratación: el harness
ahora confirma `aria-selected` antes de Save. La metadata de ES detectó la
publicación del valor previo; ese caso incompleto se repitió y no se contó como pass.
El keep-alive HTTP privado fue ampliado por el orquestador tras capturar ECONNRESET;
no se cambió código de producto para el transporte de QA.

No se atribuye Safari físico ni otros motores a estas pruebas de Chromium.
