# Property forms — revisión independiente local

2026-11-06. Candidato inicial **d3d160d**; corrección de fuente confirmada en **8cbd0e0**, rama `property-forms/integration`,
checkout `/private/tmp/central-hill-property-forms-integration`.

**Revisión de fuente completada; aprobación funcional pendiente.** No se ha
aplicado0026 ni ejecutado guardado/publicación, uploads, navegador o build completo
para esta corrección. La autorización DB sigue pendiente en este corte. Este
informe no reutiliza la aprobación del editor visual anterior ni la de Blog.

[Alcance y ejecución](property-form-editors-execution.md),
[ADR0061](../decisions/0061-property-forms-and-shared-data.md).

## Procedimiento y límites

Inspección independiente acotada del candidato integrado: modelos/estado, bootstrap
legacy, Save/Publish y CTEs bajo graph lock, esquema y contratos, lecturas públicas,
contadores, validación, invalidación y ambos formularios. Se revisaron los casos
puros añadidos y los logs reales del orquestador; no se repitieron las mismas suites
sin cambios ni se ejecutó una matriz nueva.

El orquestador registra en d3d160d: typecheck exit0, lint exit0 con7warnings previos,
92/92 casos puros de11archivos exit0 y compilación de producción **sólo compile**
exit0 (`pnpm exec next build --experimental-build-mode compile`). Logs en
`/private/tmp/central-hill-property-forms-qa/{typecheck,lint,tests-pure,build-compile}.log`.
La compilación parcial no cuenta como `pnpm build` completo ni como prueba de
prerender/publicación. QA examinó esos logs; son ejecuciones del orquestador.

No se realizaron escrituras DB en esta revisión ni se lanzó el nuevo preview.
El entorno preparado es DB/rol sintético `propertylocalesqa`, proxy4558, nuevo
preview3077/storage9077. La identidad SQL y las huellas de fixtures d*/f* anteriores
fueron registradas por root antes de cualquier mutación. No se tocaron los previews
3071/3073/3075, main, Neon remoto, GitHub ni despliegues.

## Resultado de la revisión de fuente

| Grupo | Observación en el candidato integrado |
| --- | --- |
| Formularios | Ambos editores montan controles tradicionales, tabs EN/ES/PT/FR, volver y Save/Publish; no PageEditorShell, PropertyLivePreview ni iframe. Se conservan campos legacy ocultos y se expone SEO textual Apartment. |
| Propiedad del idioma | Primera edición localizada real fija custom inmediatamente. No-op y cambios comunes conservan inherit. EN actualiza sólo working heredado; texto/SEO/booking custom, incluso sin guardar, se conserva. Publicaciones no se reemplazan desde el estado local. |
| Legacy | Los lectores distinguen contenido real aprobado/pendiente y snapshots editados antes de inferir ownership. GET no inicializa tablas. La base common pública prioriza EN publicado y conserva common ENdraft anterior como working privado. |
| Common y CAS | Tablas propias con unique/FK/revisión; Save combina draft locale y common en statement fresco tras graph lock. Si sharedChanged=false, la proyección común vigente prevalece sobre el payload viejo. Se espejan columnas y relaciones neutrales. |
| Público y contadores | Se exige publicación del idioma; Apartment también exige publicación/estado del padre. Las lecturas superponen common actual. Agregados cuentan identidades una vez y usan capacidad común, conservando orden operacional global. |
| Media e invalidación | Flush limitado a IDs referenciados por la entidad; previews persistidos preceden blobs. Common Save invalida superficies públicas y texto Save conserva alcance privado. No nueva ruta pública Apartment. |
| Límites de propiedad | Cambios confinados a los dos slices, contratos Backoffice/workspace, mensajes y documentación/schema definidos. Imports cruzados revisados por contracts; no nuevo cambio kernel/Blog. |

Estas son observaciones de código, no resultados de Save/reload ni browser.

## Hallazgo y corrección de fuente

**P2 — Publish directo de un borrador antiguo puede saltarse el Save común.**
Reproducción lógica contra d3d160d, sin mutar DB: entidad con EN publicado,
ENdraft anterior que cambia fotos/datos físicos y ninguna fila shared. El getter
proporciona common publicado más `shared.working` privado. Los formularios bloquean
Publish por common dirty, pero las acciones directas podían alcanzar los stores.

Building valida una copia overlay con common público, pero llama a
commitBuildingLocale sin baseline shared. Si no existe fila común, normalized
conserva el common original de target.draft; al publicar EN cambia el fallback
público y expone el cambio pendiente sin Save. Apartment sí superpone baseline
público, pero elimina el draft y con él la única copia common pendiente. Ambos
incumplen conservar esos cambios hasta Save explícito. Evidencia:
`buildings/server/editorial-store.ts` Publish y CTE normalized;
`apartments/server/editorial-store.ts` Publish/saved y ambos shared-content.ts.

Corrección solicitada a root: rechazar Publish cuando `shared.working` existe,
con ayuda para guardar primero, preservando el draft. Root aceptó el hallazgo y
asignó corrección mínima a ambos propietarios, más regresiones DB preparadas.
Correcciones integradas y revisadas independientemente: Apartment **fbd871d** y
Building **8cbd0e0**. Ambos stores rechazan `shared.working` antes de consumir el
draft y devuelven ayuda para guardar primero. Los diffs incorporan regresiones
DB con identidad e* que comprueban el rechazo y la conservación del draft; no se
han ejecutado sin autorización. La corrección está confirmada en fuente, pendiente
de confirmación funcional con la DB autorizada. No se encontraron otros bloqueos
de código en esta revisión acotada.

Observación no bloqueante: en Apartment, un draft inherit que queda obsoleto tras
EN Save mantiene el texto “Draft saved” y deshabilita Publish. Una indicación de
que es necesario guardar otra vez ese idioma haría más claro el siguiente paso.
No implica pérdida de texto ni habilita una publicación incorrecta.

## Verificación funcional restante tras autorización DB

Ronda normal agrupada sobre nuevos e* fixtures y nuevas identidades propias:

- Baseline legacy/GET sin bootstrap y pendientes PT conservados; cuatro idiomas.
- Nuevo Building y Apartment: primer/segundo Save con identidad/ruta estables,
  herencia EN y pin PT, texto/SEO/booking independiente y publicación explícita.
- Fotos y datos físicos guardados desde otra tab actualizan todo idioma público,
  conservando texto/SEO draft privado; dos uploads y previews normalizados.
- Counter público/legacy coherente, padre/idioma gating, revisiones/common CAS,
  Save/reload, navegación con cambios locales y móvil en ambos formularios.
- Regresión concreta del Publish de common pending anterior y confirmación de
  que fixtures d*/f* anteriores mantienen sus huellas.
- Suites de integración reales y `pnpm build` completo sobre el esquema autorizado.

No aprobación funcional ni integración en main hasta confirmar la corrección y
completar esos checks requeridos con el entorno autorizado. No se solicita una matriz más amplia.
