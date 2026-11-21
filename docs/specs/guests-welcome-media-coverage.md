# Guests Welcome — cobertura de aceptación

La firma final se registra en [QA independiente](guests-welcome-media-qa.md). Este índice no sustituye los recibos ni aprueba pendientes.

| Inventario | Evidencia obligatoria |
| --- | --- |
| P01–P33:33 tipos activos |32 tipos/55 instancias/202 ciclos reales del implementador B; P24 tiene44 grupos independientes de Welcome. |
| O01–O12:12 tipos activos |48 ciclos de upload con cuatro ratios,192 publicaciones propias por locale y metadata real; aislamiento de drafts y publicación legal propia. |
| E01–E19:18 tipos activos |166 entradas primarias+2 extras Post;9 templates Guide;21 grupos de galerías/repetibles;16 fallbacks×4locales;64 JSON-LD;182 archivos con SHA256/dimensiones exactos. |
| E15 legacy |N/A: BodyEditor/PostForm no están montados; el control rich activo E16 sí está probado en creación y edición. |

Total:64 entradas lógicas,63 activas. Author/City siguen siendo uploads activos de persistencia aunque no tengan consumidor visual público. OG y JSON-LD se comprueban como metadata, sin atribuirles un frame. Forms adjuntos y otros controles excluidos tienen justificación en el [inventario](guests-welcome-media-inventory.md).

Los ciclos usan los controles reales, almacenamiento QA de bytes reales, Save draft, recarga y Publish; se comprueban IDs, dimensiones y destinos D/M. No se consideran aprobadas las respuestas HTTP200 por sí solas. Los documentos por idioma se publican mediante su propio Save/Publish; EN nunca publica un target automáticamente.

Evidencia privada bajo `/private/tmp/central-hill-guests-welcome/`:

- `checkpoint/RESTORE.md`, `checkpoint/receipt.json` y ambos manifiestos de restauración.
- `matrix/pages-manifest.json`, `matrix/natural-dimensions-results.json`; suplemento de pintura tras Reveal y auditoría de clips conservados.
- `welcome-qa/final-receipt.json`:44 grupos, archivos históricos y retests identificados explícitamente; identidad pública de las ocho variantes Lottie.
- `entities/completion-audit.json`, `entities/asset-bytes-audit.json`, `entities/apartment-locales.json`; suplemento de destinos con Reveal.
- `og/complete-receipt.json`:48 ciclos; journals `og`, `og-about-real-estate`, `og-services`, `og-guest`.
- `og/draft-isolation.json` y `og/public-smoke.json`: el último debe acreditar48 rutas y snapshots editoriales exactos tras GET.
- `tests-final.log`, `typecheck-final.log`, `lint-final.log`, `db-check-final.log`, `build-final-product.log`, `final-build-source-comparison.json`.
- `qa-conservation.json`, `qa-conservation-including-auth.json`, `final-local-conservation.json` y verificación final de la base original.

TypeScript y45 pruebas focales pasan; lint0errores/7warnings previos;32 migraciones consistentes con el warning antiguo0008. Build final240items/2workers, compile28.9s/TS35.8s/static5.9s;950archivos src/messages idénticos al candidato. Configuración privada de QA/build fuera del producto. Los intentos incompletos se conservan y no cuentan como pass. Chromium no acredita Safari físico; WebP animado conserva su limitación previa con movimiento reducido. Los marcadores internos de loading bajo reduced motion no sustituyen la comprobación del fotograma/canvas real y su pausa.

Conservación: base de autoría49tablas/1534filas exactas; QA43tablas/1501filas originales protegidas exactas y48tablas/1526filas incluyendo auth, excluyendo únicamente Pages de fixtures y dos atributos Settings autorizados en QA. Env/logos/symlinks originales exactos. El checkpoint contiene los directorios de medios actualmente vacíos; no promete recuperar assets anteriores ausentes.
