# Edificios y apartamentos — spec de edición por idioma

2026-11-06. Hito2 autorizado por el usuario desde savepoint **5a1456d**,
conservando Blog aprobado58ba96a/QA060c195/cierreaf3a4a1. Plan/ownership:
[property-locale-editors-plan.md](property-locale-editors-plan.md).
Entrega local en rama propia; sin main merge/push/deploy/DB remota.

## Producto y alcance cerrado

- Traducir manualmente EN/ES/PT/FR en cada edificio y apartamento, con exactamente
  dos acciones editoriales: Save draft y Publish para el idioma seleccionado.
- Cada idioma tiene JSON completo draft/published/revisión monotónica. Save no
  cambia público, contadores publicados ni otros idiomas; Publish valida el draft
  guardado y limpia sólo ese draft. No Publish con localdirty. Sin autosave/review.
- Mantener workspace Building/Apartments; apartamento pertenece a un edificio
  inmutable (D6), sin menú nuevo ni nueva URL pública de apartamento. No restaurar
  campos/prosa retirados; conservarlos en snapshots/legacy para compatibilidad.
- Reutilizar shell Backoffice/preview privada renderer real. Estado por idioma,
  scopedmedia flush, navegación guardada sobre todos los idiomas iniciados.
- Primera creación guarda EN incompleto, conserva UUID de retry y navega a su
  ruta Edit real con controles ocupados hasta montar. No key UUID regenerada en
  /new, ni history.replaceState reteniendo el árbol RSC anterior. Subsecuentes
  mutaciones sólo actualizan el idioma afectado, sin router.refresh global.
- Slug Building se define al primer Save, después sólo lectura; conservar cada
  slug legacy localizado. Apartment slug interno se genera una vez desde nombre
  o UUID si está incompleto; nunca implica una página pública nueva.

## Propiedad de campos

Edificio: name, teaser, SEO y FAQ question/answer por idioma. Prosa retirada
headline/description_intro/description_neighbourhood se conserva sin nuevos
controles. Autoría EN de city/neighbourhood/address/coordenadas, position,
is_new/is_featured, cover/OG/gallery, amenity_ids, avantio_id, default_booking_url,
booking_enabled y estructura/orden/IDs FAQ. Referencias congeladas por publicación.
Apartment: name, badge y booking_url por idioma. Autoría EN de bedrooms,
max_guests, beds_count, size_m2, cover, avantio_id/default_booking_url. Mantener
bathrooms/floor/description/gallery/OG/SEO legacy sin volver a exponer controles
retirados, conservando su versión localizada. Cada snapshot retiene datos propios.

Abrir un target sin draft prepara desde EN guardado más reciente (draft o
published), conservando sus textos por IDs FAQ y su propio contenido localizado.
Draft target existente se conserva exacto. Control local explícito Use saved
English details adopta sólo metadata/estructura EN guardada preservando textos
por IDs; no guarda ni publica. templateRevision no-null indica adopción expresa
en Save y exige revisión EN actual bajo CAS. Permite completar un target que
se guardó antes de una foto/dato compartido EN. No sincronización silenciosa.
Después de Publish target, preview inicialmente igual a publicación; primera
edición prepara metadata actual EN para el siguiente draft sin perder copy.
Cambiar EN mantiene textos/localwork de targets y nunca cambia drafts guardados.

FAQ IDs UUID estables, sólo EN añade/ordena/retira; targets editan preguntas y
respuestas. Legacy building_faq rows se conservan para bootstrap/redirecciones,
no se borran al retirar un FAQ del snapshot. Adoptar estructura EN es explícito
y conserva textos de IDs que permanezcan. IDs retirados no se reasignan por índice.
Amenities/city labels siguen siendo entidades ajenas y conservan Translations.

## Reservas localizadas: misma resolución en todas las superficies

Cada documento contiene default_booking_url (base compartida authored EN) y
booking_url (override de ese idioma, nullable). Destino efectivo se resuelve
exclusivamente dentro del snapshot: booking_url no vacío → default_booking_url
no vacío → ausencia. Como ambos valores quedan congelados, publicar EN no cambia
el enlace ES publicado. Guardar campo vacío no desactiva reservas ni fabrica URLs.

Baseline: copiar avantio_url actual a default_booking_url en los4idiomas,
booking_url=null; no inventar destinos. Nuevas URLs HTTP(S), sin protocolos
ejecutables. Avantio ID no se traduce. booking_enabled controla si la tarjeta
Building abre URL externa o detalle interno; preservar semántica del catálogo
y de featured cuando este último siempre enlaza al detalle.

UnitCard utiliza URL propia efectiva, si no #book como hoy; el band #book usa
URL efectiva del edificio publicado en ese idioma. No guardar una URL dinámica
del padre en el snapshot del hijo. Botón superior de reserva en la sección de
apartamentos usa URL efectiva Building si existe, si no booking general del
idioma solicitado: corregir avantioBookingUrl('en') hardcoded. No modificar
Home/Avantio search, proveedor de reservas o formularios.

Cubrir listado Buildings, featured/Home y otros consumidores, detalle/banda,
UnitCards y preview. La corrección de URL no se limita a un input BO.

## Padre, visibilidad, orden y contadores

Apartment puede guardar/publicar ES aunque Building ES aún no esté publicado;
no aparece públicamente hasta que Building ES se publique. Archivar Building
oculta todos sus idiomas y unidades sin borrar sus documentos. Archivar Apartment
oculta esa identidad en todo idioma, conservando snapshots. Eliminación de
Building se rechaza si tiene cualquier identidad Apartment, incluso draft/archived;
no cascada destructiva ni huérfanos. Revalidar padre e hijos según sus contratos.

Datos de capacidad son shared authoring EN, congelados por locale. Los contadores
públicos por idioma se derivan del conjunto de apartamentos publicados visibles
en ese idioma, una identidad una vez, coincidiendo con la grilla. Building llama
el agregado Apartments por contrato (sin consultar su tabla), no acumula4traducciones.
Los denormalizados legacy se mantienen al publicar/archivar/eliminar Apartment
con un agregado único por identidad con alguna publicación; Save draft no los
recalcula. Baseline válido mantiene contenido/capacidades; cualquier discrepancia
legacy de contador se registra, no se aprovecha para modificar DB remota.

Orden Apartment es operacional global en apartment.position, fuera del snapshot;
se mantiene la acción explícita ↑/↓ actual para todos los idiomas, sin mover de
padre ni tocar copy/publicación. Nueva identidad se añade al final. Los contadores
BO published cuentan identidades con alguna publicación, no filas de traducción;
mostrar estado por locale además del archivo global.

## Persistencia, contratos y activación

Migración0025 aditiva: building_locale_content y apartment_locale_content,
propiedad de sus slices, FK a identidad respectiva con cascade al borrar esa
identidad, unique(entity_id,locale), draft/published nullable, revisión persistente,
timestamps y actor textual. Legacy rows/translation/slugs intactos. GET público y
privado nunca inicializa; bootstrap staff en primera escritura captura4versiones
públicas resueltas y targets pendientes como drafts sin aprobarlos/publicarlos.
Ausencia de fila admite fallback legacy de sólo lectura; fila published=null
impide fallback. Legacy inválido bloquea reemplazo silencioso sin vaciar contenido.

Neon HTTP db.batch transacción no interactiva con lock compartido
pg_advisory_xact_lock(7158,1) y segundo statement READ COMMITTED fresco para CAS,
parent/child lifecycle y guardas. Se comprueba revisión locale y template EN.
Building y Apartments exponen por contract fragments SQL de sus identidades para
proteger delete padre/create hijo atómicamente sin consultas de tablas ajenas.
No cambios a core DB/auth/i18n. ADR0058 registra la extensión.

Campos JSON limitados a192KiB UTF8 por envelope, preview total256KiB, tipos/listas
acotadas, media existentes de MIME válido para Save/Publish; Save permite texto
incompleto, no JSON arbitrario. Building Publish requiere name/teaser/address y
ciudad válida; cover opcional conserva placeholder actual. Apartment Publish
requiere name/max_guests positivo/specs válidas; cover opcional como hoy.
Draft permite valores parciales; referencias presentes no pueden ser inválidas.
Preview representa contenido válido con aviso de incompleto, no muta ni sube
medios, blobs same-origin sólo temporales, persistidos prevalecen. No JSON-LD
privado, formularios/reservas inertes. Autorización actual requireStaff conservada.

Translations excluye building/apartment/building_faq, review antiguo redirige
a editor propietario/locale,6mutaciones/generador directo rechazados antes de
escribir. FAQ resuelve padre mediante contrato Buildings. Amenity/geography y
otros tipos siguen activos. saveBuilding/saveApartment live quedan retirados.
Scripts seed/backfill que escriben estas entidades se retiran de la vía soportada.

Public readers conservan contratos summary/detail, SEO/ISR/canonical/hreflang y
parametrización Building de idiomas efectivamente publicados. Apartment no añade
params/sitemap públicos. Caches Apartment dependen también de visibilidad Building;
Building se invalida al publicar hijos, incluyendo Home/listados que los consumen.
No renderer paralelo para preview: BuildingDetailRenderer acepta documento y
apartments inyectados; preview Apartment usa misma composición del padre y
UnitCard real, sustituyendo/agregando sólo la unidad local seleccionada.

## Aceptación y frontera

Baseline4locales + pendientes; Save/reload/Publish aislados; primer/segundo Save
nuevo estables; adopción metadata explícita y FAQ por IDs;2imágenes en cola sólo
se suben las del idioma guardado;4destinos Booking distintos y fallbacks reales;
Building/Apartment ES antes de EN y parent visibility; contadores grilla coherentes
sin duplicados; orden/parent inmutable; Archive/Delete seguros; preview/foco/Refresh
sin writes; SEO/ISR/sitemap Building; permisos/guardas legacy; desktop/móvil.
Ronda funcional normal agrupada y correcciones dirigidas, sin matriz adversarial
expandida. Entorno sintético nuevo autorizado antes de escrituras, conservando
Blog3072 y original3071. Typecheck/lint/tests explícitos/build/db:check integrados
y QA independiente. Cambios estéticos puros futuros son L0 y los revisa el usuario.
