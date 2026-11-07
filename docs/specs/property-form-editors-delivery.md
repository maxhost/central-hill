# Edificios y Departamentos — formularios por idioma

2026-11-06. Código **fed9fb8** en `property-forms/main-integration`, checkout
`/private/tmp/central-hill-property-forms-main-integration`, preparado sobre
main0e72983 por solicitud explícita del usuario. Fuente equivalente2bb313d en
property-forms/integration. [Spec/ejecución](property-form-editors-execution.md),
[QA independiente](property-form-editors-qa.md),
[integración main/entorno](property-forms-main-integration.md),
[ADR0061](../decisions/0061-property-forms-and-shared-data.md).

## Comportamiento

Formularios tradicionales con pestañas EN/ES/PT/FR, Guardar borrador y Publicar
por idioma; sin canvas, inspector ni preview embebida. EN alimenta idiomas sin
contenido propio hasta la primera edición real de texto, SEO o reserva de ese
idioma, incluso si todavía no se guardó. Ediciones compartidas/no-op no fijan el
idioma. Traducciones propias/pendientes y snapshots previos editados se conservan.
Cada publicación es explícita; textos y SEO públicos sólo cambian con Publish de
ese idioma. FAQ localizada con identidades estables, sin sincronización por índice.

Fotos y datos físicos son valores únicos, editables en cualquier pestaña y visibles
en todos los idiomas ya publicados al Guardar. Texto/SEO local permanece en borrador.
CAS común separado y overlay vigente impiden restaurar fotos/capacidad obsoletas al
guardar una traducción. Medios persistidos normalizados preceden blobs. Lectores
públicos, listados y contadores usan datos comunes actuales. Se mantienen guardas de
padre/idioma, archivo/borrado/orden y bloqueo de traducciones legacy. SEO Apartment
expuesto; sin nueva ruta pública Apartment ni reintroducir campos retirados.

## Esquema y datos

Usuario autorizó0026 y pruebas locales, luego pidió un único localhost de main.
0026 aplicada sólo en DB/rol `propertylocalesqa` verificados, proxy4558/Postgres5658:
dos tablas propias de datos compartidos con FK/unique/revisión. No replay de
migraciones anteriores ni cambios Neon remoto. Nuevos e400/e500/e700 fixtures
sintéticos y nuevas identidades de navegador registradas por QA; d*/f* previos se
conservan. El lector no inicializa tablas en GET. Viejos cambios comunes de ENdraft
permanecen privados hasta Save; Publish directo los rechaza sin consumir el draft.

## Verificación

Candidato sobre mainfed9fb8: typecheck0, lint0(7warnings existentes),104/104tests0
incluyendo12grupos DB reales, db:check0(27migraciones y warning histórico0008),
`pnpm build` completo0(95páginas). Logs y comandos en spec/artifacts. Primera ronda
DB detectó precedencia JSONB incorrecta; se parentetizaron las extracciones antes
de restar claves. Ambas suites propietarias8/8+4/4 y luego integrado104/104pasan.
Revisión independiente de fuente corrigió Publish directo de common legacy pendiente.

QA funcional independiente **aprobada** en fed9fb8:10grupos,3scripts exit0,
cero excepciones browser y ningún bloqueante. Incluye4idiomas,3uploads reales,
Save/reload/pin/herencia/publicaciones/SEO/booking, common live/físicos/contadores,
New estable/parent gating, móvil390px/foco/guardas y huellas d*/f* idénticas.
Capturas desktop/móvil/público revisadas en una ronda. No se reutiliza aprobación
del editor visual anterior. Detalles y límites en el informe independiente.

## Entorno de revisión

Única aplicación local de revisión: `http://localhost:3071/admin/buildings`, desde el
checkout principal real de main. Cuenta sintética `propertyqa@example.test` /
`PropertyLocalesQA2026!`. Storage9077 con copia de medios y CORS3071;9073 preservado
por restricción de revisión automática, DB/proxy necesarios. Apps viejas3072/3073/
3075 detenidas por autorización explícita, datos/worktrees conservados. Otros
proyectos sin cambios. Storage local simula PUT/HEAD/GET, no valida firmaS3.

El.env.local principal usa sólo datos sintéticos; original guardado en archivo
ignorado.env.before-property-forms-20261106.local(mode600). Launcher/env seguros en
`/private/tmp/central-hill-property-forms-qa`; preload bloquea Neon remoto. Config
Next local de runtime permite imágenes9077 sin cambiar kernel/config de producto.
Un symlink local sin rastrear `public/propertylocalesqa` sirve imágenes relativas
SSG anteriores desde el storage sintético. Preservar ese artefacto y el logo original.

Ningún push/deploy/GitHub ni escritura remota. Integración local y PID/hash final
quedan registrados en property-forms-main-integration.md al cerrar la revisión.
