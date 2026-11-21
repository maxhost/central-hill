# QA independiente — Guests Welcome media

2026-11-21. **En ejecución; no aprobado para merge.** Candidato en `fix/guests-welcome-media`; la matriz general completa, las comprobaciones y la revisión del código final siguen siendo puertas obligatorias.

## Entornos y método

Solo QA local: candidata3091/DB `welcomeqa20261121`/S3 local9092 `welcome-qa`; base3092/DB `welcomebaseqa20261121`/S3 local9093 `welcome-base-qa`. No se usa autoría para fixtures. Playwright Chromium; no acredita Safari real.

Las subidas usan controles reales, presign/PUT/finalize, Save draft, recarga y Publish. Se comprueban IDs/dimensiones persistidos y el medio realmente renderizado, con capturas D/M y mediciones de frame/fit/posición/desbordes. Ninguna subida exitosa se simula. Los fallos se provocan bloqueando peticiones reales o haciendo fallar la salida del canvas del reproductor real; quedan identificados como inyección de fallos.

La lentitud y saturación inicial del proxy NeonHTTP produjo intentos incompletos conservados. QA cambió a un puente HTTP→PostgreSQL local real, con paridad de tipos/resultados/transacciones/errores verificada y guard DB/rol/host, sin simular consultas. Después se añadió guard persistente de fetch para que Next no lo sustituyera y un límite de conexiones4. Los intentos con HTTP500, timeout o fallos del harnés no se cuentan como aprobados.

Evidencia privada: `/private/tmp/central-hill-guests-welcome/welcome-qa`; imagen base en `baseline`, vídeo/Lottie base en `baseline-playback`. Índice final: `welcome-qa/final-receipt.json`, generado con44grupos obligatorios aprobados, IDs exactos y mapeo explícito UUID/key para cinco registros históricos sin caseId. Nunca se infiere identidad por posición. El recibo conserva errores y fallos de intentos excluidos; dos fallos de consultas Building se registraron globalmente en un run interrumpido sin timestamp por caso, por lo que no se declara cero errores en todos los intentos. Runners reproducibles en `scripts/qa/guests-welcome-playback/`; las credenciales, medios y resultados permanecen fuera de Git.

## Resultados completados

- **Reproducción base completa con tres tipos reales.** Imagen2250×1500, WebM900×600 y Lottie JSON900×600 pasan por UI/Save/recarga/Publish. Los tres muestran4:5:535.8×669.73D y334×417.5M. WebM avanza1.197→1.687s; el canvas contiene dibujo real y avanza. Sin usar un canvas vacío como prueba de reproducción.
- **Imagen candidata.**3:2,2:3,1:1,16:9 y WebP animado pasan el ciclo editorial y destinos públicos D/M. Original guardado medido además a1440/881/880/390. Frame3:2±1px, cover centrado, metadata coherente, sin desbordes. WebP conserva sus dos frames y bytes originales sin optimizador; se verificó su limitación previa: continúa animándose con movimiento reducido.
- **Vídeo candidato.** MP4 y WebM reales900×600, muted/loop/inline, avance y pausa, con ciclo editorial y D/M. Un sondeo inicial WebM de500ms no observó avance; el retest observa duración finita1.981s, readyState4, sin error y avance1.307→1.824s. No se declara roto un recurso por buffering.
- **Lottie candidato.** JSON y dotLottie con lienzos3:2/2:3/1:1/16:9 pasan los ocho ciclos completos. Canvas real no vacío y frames distintos. El círculo marcado conserva el diámetro que exige cover y el recorte vertical es central; transparencia sobre papel251/248/243 y ninguna imagen de respaldo detrás.
- **Carga de imagen.** Se confirmó un defecto: blurhash visible mientras el archivo aún no había cargado. Welcome ahora omite solo su blurhash. Retest con petición real retenida: estado loading, naturalWidth0, sin backgroundImage y0/191888píxeles distintos del papel; tras liberar bytes queda ready y muestra el archivo. Dimensiones y optimización conservadas; otros consumidores mantienen sus placeholders.
- **Estados editoriales/locales.** Fallback cuando no hay selección; texto corto/largo a1440/881/880/390; ES/PT/FR con su propio Save draft/recarga/Publish e ID seleccionado comprobado, preservando textos propios. EN Publish no se interpreta como publicación automática de los targets.
- **Otros estados de imagen.** Blob sin atributos de dimensiones provisionales, imagen sin JavaScript, EXIF6 con dimensiones visuales1200×800 sobre archivo800×1200, metadata legacy sin dimensiones (solo asset QA propio, restaurada después), error real público neutro y aviso accesible privado sin URL técnica.
- **Carga diferida.** El único archivo inicial de dotLottie en página de imagen es un loader async de Turbopack de795bytes. No se descargan sus payloads reales ni WASM y no hay canvas. El primer harnés lo confundió con el motor; se corrigió la clasificación y se retestó.
- **Vídeo adverso.** Antes de metadata y durante descarga retenida el frame y papel permanecen estables; después decodifica. Denegación nativa de reproducción sin gesto verificada mediante Chromium/CDP (se desactiva mute para provocar la política, sin falsificar una promesa). No se convierte en error de archivo. Fallo real de red: público neutro sin controles, preview con aviso accesible.
- **Lottie importación fallida.** Bloqueo del payload dinámico real, permitiendo el loader y la hidratación de la página: frame neutro y estado de fallo correcto.

- **Lottie adverso adicional.** Creación fallida de canvas y no-JS/transparencia aprobados. Con movimiento reducido, el primer dibujo real tiene20564píxeles no transparentes y permanece idéntico tras700ms, sin errores JS. El SDK conserva el marcador interno loading al no emitir render con autoplay=false; no hay indicador visible ni se modifica playback por ese detalle. Se verificaron loadError/renderError reales y fallo tardío tras sustituir, sin arrastrar error/contenido. Se comprobaron también ambos avisos accesibles en la preview real de Lottie, sin URL técnica.

## Cierre de Welcome

Los44grupos Welcome están aprobados. El suplemento de ocho variantes Lottie verifica URL/UUID solicitado y bytes SHA256 exactos del archivo elegido, más render/crop real desktop. Conserva los ocho ciclos geométricos anteriores. La cadena completa imagen→WebM→MP4→JSON→dotLottie→imagen pasa UI/Save/recarga/Publish y D/M sin errores JS. Vídeo reducido: fuente real900×600, readyState4, primer frame visible, pausado/time0/autoplayfalse y estable tras700ms. Como Lottie reducido, su marcador interno permanece loading sin UI de carga visible; la prueba observa decoder/píxeles en vez de esperar ese marcador. La espera inicial del marcador falló y queda excluida. Tanda visual D/M final en archivos visual-chain-\* y errores; sin bucle de pulido.

## Revisión de cambios adicionales detectados por la matriz general

- `sideMedia` conserva nodos raíz/clases4:5. IntroSplit predeterminado conserva stretch/mínimos; solo Welcome usa3:2.
- ServiceItinerary: cambio focal a padre relativo e imagen absoluta/cover centrado, manteniendo cuadros108D/76M y el número cuando no hay imagen. Revisados los15retests E07: tres categorías por cinco ratios, con108×108D/76×76M, cover centrado y sin desborde.
- Post rich image: setter específico de body permite finalizar reservas mientras queue.isPreparing, pero conserva lock/operación/navegación/archivado y UI bloqueada. No cambia Save/Publish. Se revisaron las siete pruebas focales y los runners/resultados E16: IDs reales en draft/publicado, body propio por locale, creación /admin/posts/new y fila EN íntegra tras autoría ES. No se usa HTTP200 como prueba de publicación.
- OG legal: lector público vuelve exactamente al anterior; mantiene publicación propia completa y draft privado. Solo el working target adopta el picker OG source, conservando texto/SEO. El E2E general debe comprobar publicación propia por locale, sin overlay público automático EN.

Welcome P24 queda aprobado. La aprobación global y el merge siguen pendientes de la matriz general, checks/build, conservación y revisión del candidato exacto final.

## Revisión de la matriz general

Inventario activo:63tipos (33Pages,12OG y18entidades); E15 legacy BodyEditor no tiene ruta montada y queda N/A documentado, sin atribuir controles de ancho/alineación al editor rich actual. El manifiesto Pages acredita32tipos propios/55instancias/202ciclos, más Welcome independiente. El recibo de entidades acredita166grupos y2suplementos,182archivos con SHA256 exacto, galerías1–6 y nueve plantillas Guide. Apartment ES/PT/FR se verificó también en el build compilado3094: en PT/FR el stream RSC no finaliza dentro de10s y eso se declara; reload/reselección de locale, contenido draft/publicado SQL real y destinos D/M acreditan persistencia. Se restauró el nombre QA original y se comprobó la fila EN íntegra.

O05 Guest completó4ratios con16destinos de metadata, publicación propia Save/recarga/Publish de ES/PT/FR y0errores. Recibo privado `og-guest/results-guest.json`. El lector legal conserva las publicaciones propias y los drafts siguen privados. Pendientes globales al redactar: suplemento visual readonly B para Reveal, smoke final48destinos, conservación final y revisión del commit exacto.
