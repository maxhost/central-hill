# Home — spec cerrada de borradores y publicación por idioma

2026-10-18. Diseño cerrado; implementación autorizada por el usuario desde e06272b.
La ejecución y evidencia vigentes se registran en page-locale-drafts-plan.md.
Base de producto3c55a1b; checkout /private/tmp/central-hill-home-contextual-integration,
rama home-contextual/integration. Home6359b6d aprobado por QA; toolbar SEO3c55a1b
comprobada por raíz. El siguiente contexto registra el HEAD documental final como base.
ADR0040 gobierna este arco y reemplaza las reglas anteriores de guardado live/aprobación
para Home y las páginas que se adapten después. Antes de Owners.

## Contrato de producto

- Exactamente dos acciones editoriales: **Guardar borrador** y **Publicar**.
- Ambas afectan **sólo al idioma seleccionado** EN/ES/PT/FR. El estado indica ese idioma.
- Guardar borrador persiste su JSON en DB; cerrar/recargar recupera ese borrador.
- Al abrir, preview usa el draft guardado o published del idioma. Por petición posterior del
  usuario, el formulario envía sus cambios locales a preview en vivo, sin persistirlos.
  Refresh vuelve a representar ese estado local. Recargar el editor recupera sólo lo guardado.
  Ver home-live-preview-execution.md; esta petición sustituye la restricción saved-only.
- Publicar toma el borrador **ya guardado** del idioma, valida, actualiza su versión pública
  y elimina únicamente su JSON de borrador (`draft=NULL`). Su preview pasa al JSON público
  y debe verse igual. No limpia borradores ni publica contenidos de otros idiomas.
- Publicar EN permite continuar ES con su borrador y sus cambios locales intactos.
- Publicar deshabilitado sin borrador guardado o con cambios locales sin guardar en ese
  idioma. Cambios pendientes en otro idioma no bloquean la publicación del seleccionado.
- Ningún botón, badge ni bloqueo de aprobar/revisar/stale. Traducción manual normal del JSON.
- SEO EN/ES/PT/FR en toolbar, fuera de Sections/Element. Título y descripción SIEMPRE
  visibles y editables en su idioma, incluso con SEO EN vacío/heredado. Sin filtro por
  source EN no vacío. Canonical/hreflang automáticos. OG sigue autoría compartida desde EN.
- No historial, rollback UI, descartar borrador, autosave ni formulario nuevo.
  No conversión de otras páginas, Forms público ni cambios a Avantio.

## Persistencia simple y aislamiento

Una tabla Pages propuesta `page_locale_content`, unique `(page_key, locale)`:
- page_key, locale, id si lo requieren convenciones;
- published JSONB nullable (nunca escrito por Guardar borrador salvo inicialización equivalente);
- draft JSONB nullable;
- revision entero monotónico por idioma, que sobrevive al borrado del JSON draft;
- timestamps published_at/draft_saved_at/updated_at y actor staff.

Los JSON usan un envelope versionado `{schemaVersion:1, content:<modelo de la página>,
ogImageMediaId:string|null}`. Guardan copy de ese idioma, estructura, IDs estables y
referencias a medios, no bytes/URLs resueltas ni componentes React. No JSON en archivos del repo.
Es una publicación completa de página por idioma, no una nueva tabla de traducciones por campo.

`page_content`/translation legacy quedan intactos para los demás editores y como fuente de
bootstrap. La página pública Home pasa a leer el JSON published del idioma; su renderer y
metadata conservan el mismo contrato. No hace overlay de aprobaciones sobre ese snapshot.
El kernel continúa resolviendo textos/media de otros slices cuando corresponde.

### Inicialización sin cambios visibles

Para Home existente, resolver sus cuatro versiones actualmente públicas con el pipeline
legacy y capturarlas como baseline published, sin alterar su contenido. La inicialización
es idempotente, nunca sobreescribe filas nuevas ni borradores. Puede ocurrir dentro de la
primera operación staff guardada y condicionada por revisión; la lectura pública no crea filas.
Hasta disponer de baseline se admite fallback legacy de sólo lectura. Al activar Home, todas
sus escrituras legacy quedan bloqueadas para que ese fallback no publique por otra vía.

Si hay traducciones legacy guardadas pero no públicas, importar sus textos como draft de su
idioma, conservando la versión pública actual. No perderlas ni aprobarlas/publicarlas en el
bootstrap. Registrar ese caso con fixture; conservar filas legacy originales.

Para una página aún sin publicación, published=null; Guardar borrador sigue funcionando,
pero la URL pública no aparece hasta Publicar. No crear/autorizar nuevas páginas en este piloto.

### Campos compartidos y JSON de idiomas

La autoría de estructura/medios/referencias sigue en EN. Publicación independiente significa
que cada idioma congela sus valores compartidos en su propio JSON; EN publicado no modifica
ES público. Settings/FAQ/Buildings/Services son contenido ajeno publicado por sus dueños y
no se convierten en snapshots internos de Home.

Al iniciar un trabajo target SIN draft persistido, preparar su modelo local desde el template
EN guardado más reciente (draft EN si existe, si no published EN), conservando textos target
por IDs estables. La preview privada refleja ese modelo local sin publicarlo; Guardar borrador lo persiste. Si hay diferencia local,
indicar cambios pendientes. La primera escritura valida su template/base de campos compartidos.
Cuando YA existe un draft target, editar ese JSON tal cual: no sustituirlo ni reordenarlo
al publicar EN. Guardar/publicar ese target usa su propia revisión. No exige publicar EN
ni reaprobar traducciones. No sincronizar automáticamente drafts existentes.

Mantener identidades/retirados de figures, benefits y assurances. IDs y campos compartidos
no pueden ser alterados por un payload target fuera de su template guardado. Las referencias
EN fuente se pueden mostrar como ayuda, sin convertirlas en requisito de aprobación.

## Guardado, publicación y conflictos

Guardar permite texto requerido aún incompleto; valida envelope, tipos, límites de listas/
longitud, IDs, payload acotado y referencias de medios ya subidos. No guarda JSON arbitrario
sin validación. La cola termina uploads antes de persistir un draft con esos IDs.

Publicar exige el schema completo de la página/idioma, identidades y MIME/referencias válidas.
Fallo de validación conserva el borrador y no cambia published. `UPDATE` con revisión esperada
aplica published=draft, draft=NULL y revision+1 atómicamente para una sola fila/idioma.
Conflicto no modifica ninguna versión ni otro idioma. La revisión persistente evita el caso
ABA: una pestaña anterior a Publicar no recrea el JSON recién borrado usando revision antigua.

Guardar borrador nunca invalida el contenido público. Publicar invalida sólo la ruta/tag del
idioma publicado; mantener dependencias externas y SEO. La transacción precede a ISR. No
reconstruir todo el sitio ni usar draft DB en rutas públicas. Error de refresh posterior al
commit se distingue de fallo de guardado; no afirmar rollback si DB ya publicó.

Los JSON de idiomas no seleccionados no se actualizan, reserializan o eliminan al publicar.
El estado React de tabs no seleccionadas tampoco se reinicializa por router.refresh.

## Lecturas y preview compartida

Separar el modelo privado de edición/preview del getter público. Propuesta:
- getPageEditorialModel(key, locale): envelope de trabajo, published/draft y revision del idioma;
- savePageDraft(key, locale, expectedRevision, payload): nueva revision/modelo;
- publishPageDraft(key, locale, expectedRevision): nueva revision y hasDraft=false;
- getPageDraftPreview(key, locale): draft guardado o published, auth/no-cache;
- getPublishedPageLocale(key, locale): published, caché/ISR.

Handlers validan PageKey/locale y requireStaff. Registry habilita sólo Home inicialmente.
El shell no importa queries de Pages. Tipos genéricos se exportan por contract.ts; cada
adaptador aporta schema, identidad y validación/media. La preview inyecta PageResult ya
resuelto al MISMO HomePage renderer; el público sigue recibiendo sólo datos publicados.
No copiar HomePage ni incorporar auth/draft queries al path público.

Home en /admin/translations redirige al contextual y se excluye de la revisión genérica.
Bloquear save/clear/approve/reset/generate legacy para Home en sus entradas servidor,
además de la UI. Bloquear también savePage(home)/saveHomeLocale antiguos como vía live.
No modificar flujos de Translation, Forms o catálogos ajenos para otras entidades.

## Aceptación y límites del QA

Plan de pruebas único y acotado en page-locale-drafts-plan.md. Casos críticos: draft no live;
preview correcta; SEO ES con EN vacío; publicar EN sólo borra EN y mantiene ES byte por byte;
continuar/publicar ES después; fallo/concurrencia no pierde trabajo; no bypass legacy.
Home3065 y su DB actual se preservan; nueva QA aislada sólo con fixtures sintéticas.
No GitHub, Neon producción, main, push, despliegue o correos reales.
