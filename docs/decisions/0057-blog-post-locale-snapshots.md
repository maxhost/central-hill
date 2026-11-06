# ADR0057 — Blog Posts: borrador y publicación por idioma

2026-11-05. Implementación local autorizada desde el savepoint48ae09c.
Spec: [CMS por idioma](../specs/entity-locale-editors-spec.md).

Blog adopta el patrón editorial de ADR0040, conservando la propiedad de sus
modelos y tablas. `blog_post_locale_content` contiene un snapshot versionado
draft/published y revisión monotónica por post/idioma. Save no cambia público;
Publish hace CAS atómico y limpia sólo el draft seleccionado. El cuerpo completo
se edita independientemente por idioma, sin mezcla posicional ni cambio del
block set de ADR0013. Referencias/portada/OG/fecha/featured/relacionados se authoran
en EN y se congelan al publicar cada idioma. Texto, enlaces y tiempo de lectura
se localizan manualmente. No proveedor automático.

Bootstrap staff idempotente conserva las cuatro versiones públicas actuales y
targets pendientes como drafts. No se borran filas legacy. Ausencia de fila
permite compatibilidad de lectura; published null impide fallback dinámico.
Nuevos posts reservan identidad/slug al primer Save EN; ningún slug reservado
implica publicación. Los slugs existentes se conservan y quedan en sólo lectura
en el piloto. Publicar no escribe slugs ni usa el anterior guardado live.

El archivado es global y prevalece sobre Save/Publish: la operación condicional
serializa con la fila padre antes de escribir el idioma. Neon HTTP no permite
asumir transacciones interactivas; se usa SQL condicional/CTEs para garantías
atómicas y creación recuperable para la reserva de identidad/slugs.

La auditoría de código confirma que las rutas/acciones actuales de posts usan
`requireStaff()` sin restricción de roles: admin/editor/translator ya tienen
acceso directo. El nuevo flujo conserva esa autorización, también en preview;
no amplía ningún permiso por la redirección de Translations. Sus seis acciones
legacy y el generador directo rechazan Blog antes de escribir. Categorías y
autores conservan su flujo. Public readers/SEO filtran idiomas publicados.

Se reutiliza Backoffice por contrato. La media queue admite selección opcional
de IDs en flush para que guardar un locale no suba archivos de otro; la llamada
sin argumento conserva la conducta existente. No hay cambios al kernel de DB,
auth ni i18n. El schema se descubre mediante el glob actual de drizzle.config.ts.
La migración0024 se aplica sólo al entorno sintético autorizado postlocalesqa;
producción y Neon remoto requieren solicitud independiente.
