# Blog — descripción y paginación de relacionados

2026-11-06. Usuario solicita explicar para qué sirven los relacionados, mostrar
10opciones por página con Atrás/N/Adelante y crear más posts de ejemplo.
Base40ab05d, blog-form/integration, /private/tmp/central-hill-blog-form-integration.
Tarea pequeña a cargo de root, sin agentes. Preservar3071/3072/3073 y datos previos.

Ownership root: blog/admin/ui/post-locale-editor.tsx; messages4locales; este doc
y enlace de continuidad AGENTS.md. Seed/harness nuevos fuera del repo en
/private/tmp/central-hill-blog-form-qa/related-pagination. Sin schema/core/migración.

Descripción: recomendaciones opcionales al final del artículo, máximo3 elegidos.
Paginación local de opciones ya cargadas,10por página; actualpost excluido,
selección conservada entre páginas, límite3global, navegar no ensucia ni guarda.
Controles accesibles Atrás/Ntotal/Adelante sólo si más de10opciones; extremos
deshabilitados. Targets mantienen política EN compartida, paginación consultable.

Usuario autoriza explícitamente crear ejemplos; sólo12posts sintéticos nuevos
namespacef500* en DB/rolpropertylocalesqa ya autorizada, preview3075/storage9075.
Cada ejemplo queda ENdraft, sin publicación automática ni uploads. Categoría/autor
sintéticos f100/f200 existentes se referencian sin modificarlos. No tocar los
posts que el usuario estaba viendo/editando. Verificar DB/rol antes de seed.

Verificar typecheck/lint, suite estado afectada y build integrado. Navegador
normal acotado:10opciones/segunda página/autopost excluido, selección3desde ambas
páginas y maxglobal, navegación mantiene trabajo y no crea dirty por sí sola,
Save/reload de un ejemplo nuevo propio con3relacionados. Desktop+móvil y labels
4idiomas en código; sin matriz ampliada ni tests que reflejen implementación.

Scope adicional antes de editar: blog/admin/queries.ts, sólo desempate estable
por created_at/id en el orden actual de listPostsAdmin. Evita cambios arbitrarios
de página al refrescar opciones con fechas de publicación iguales o nulas.

## Entrega y verificación

Código2fa60b0, misma rama/checkout. Nuevas12identidades f5000000-0000-4000-8000-
000000000001..000000000012, todas ENdraft/revisión1 excepto Example01 tras prueba
de Save(revisión2). No publicadas. Los otros3posts anteriores se conservaron.

Root verificó DB/rolpropertylocalesqa y ejecutó seed preparado con guardia de IDs
ya existentes. Artifacts /private/tmp/central-hill-blog-form-qa/related-pagination:
seed.cjs/examples.json, check.mjs/browser.log/results.json, capturas finales.
No nueva DB/migración/medios ni contenido remoto.

Typecheck0, lint0(7warnings previos),8tests de post-editor-state0 y build0.
DetectorUI lista vacía. Navegador real root con datos sintéticos nuevos:14opciones
para Example01,10en primera y4en segunda, controles/extremos/counter correctos,
self excluido y paginar no dirty. Elegir3entre páginas bloquea el cuarto;
selecciones preservadas al volver de página y Save/reload. Save únicamente del
Example01 propio, no de los posts previos del usuario. Móvil390 sin overflow;
pageErrors[]. No nueva aprobación de QA independiente: seguimiento pequeño root.

Primeras fullpage capturas se hicieron tras scroll a relacionados y mostraban
la cabecera sticky en mitad de imagen (artefacto de captura). Recapturadas desde
scroll0 como desktop-final.png/mobile-final.png, sin repetir writes/casos.

Preview3075 PID76083/session12583 con2fa60b0. Revisar el editor habitual o
/admin/posts/f5000000-0000-4000-8000-000000000001. Login sintético anterior.
3071/3072/3073 conservados; sin main merge/push/deploy/Neon remoto.
