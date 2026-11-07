# Handoff antes del clear — Servicios y categorías por idioma

2026-11-06. El usuario pide hacer clear y deja definida la próxima tarea.
**Este checkpoint sólo documenta; no empezar implementación antes del clear.**
Al regresar, seguir esta petición y la nueva indicación del usuario, no retomar
otros hitos históricos. Base de producto actual: main52eda11. Resolver el hash del
checkpoint documental con `git log -1`. Sin push/deploy ni escrituras de DB aquí.

## Petición confirmada por el usuario

1. En `/admin/services/new` y el editor existente, **mantener el formulario**,
   añadiendo las mismas tabs EN/ES/PT/FR de Blog/Buildings. No convertirlo en live
   editor, canvas, inspector ni editor visual de Pages.
2. Se empieza en EN. Los idiomas todavía no personalizados siguen el contenido
   guardado de EN. El primer cambio localizado real hace propio ese idioma:
   posteriores cambios EN no sobrescriben su trabajo, borrador o publicación.
   Cambiar de tab o editar sólo datos compartidos no debe personalizar un idioma.
3. Conservar el modelo actual de Blog/Buildings: trabajo local independiente,
   Guardar borrador/Publicar explícitos para el idioma elegido, publicación pública
   propia y navegación protegida. EN no publica automáticamente los otros idiomas.
   Traducción manual; automatización sigue pospuesta.
4. Imágenes compartidas: una portada/galería/imagen de cada posición para todos los
   idiomas. No copias divergentes por traducción. Aplicar la política vigente de
   datos compartidos de Buildings (Save actualiza el valor común) al cerrar la spec.
5. Categoría seleccionada única y compartida. Se elige en EN; en las otras tabs se
   conserva el mismo ID seleccionado y se muestra su nombre traducido.
6. Iconos compartidos y elegidos en EN, usados en todos los idiomas. Esto incluye
   auditar iconos de presentación y los anidados en módulos; no confundir el icono
   compartido con el texto localizado que lo acompaña.
7. En `/admin/service-categories/new` y edición, cuatro inputs de Label/name
   EN/ES/PT/FR, exactamente el modelo recién entregado en Amenities. Un Save de
   taxonomía aplica los nombres manuales; targets vacíos usan EN. Slug, icono,
   posición e identidad siguen compartidos.
8. El selector del servicio y la web pública deben consumir el nombre de categoría
   del idioma correspondiente. Elegir una categoría no crea selecciones diferentes
   por idioma. Renombrar su traducción no exige volver a traducir cada servicio.

No hay duda de producto pendiente en lo anterior. La auditoría técnica/matriz de
campos y el plan ejecutable deben cerrarse al retomar, antes de escribir código.
No interpretar esta nota como una spec técnica ya implementada ni una QA aprobada.

## Puntos de partida y auditoría al retomar

- Roadmap existente: `entity-locale-editors-spec.md`, fase3, ahora subordinado a
  esta instrucción y a las correcciones posteriores de formularios/datos comunes.
  Sus notas antiguas sobre remoto3071 y editores visuales no describen el runtime
  actual. No existe todavía un plan ejecutable de esta nueva conversión Services.
- Alcance: entidades `/admin/services/*` y `/admin/service-categories/*`; no
  convertir el editor Pages→Services ni cambiar su contenido global.
- Leer `src/slices/services/README.md`, `schema.ts`, `detail.ts`, `copy.ts`,
  `presentation.ts`, `admin/form-model.ts`, `admin/detail-draft.ts`, `admin/ui/` y
  `admin/{actions,queries,validation}.ts`, `server/{queries,publish}.ts`.
- El formulario real ya tiene módulos condicionales (itinerary/options/pricing/
  extras/partners/good-to-know), `detail` JSON traducible, copy, presentación,
  selector de iconos y medios. Preservar sus funciones/datos y campos retirados.
  No hacer sólo tabs cosméticas sobre escrituras EN/live existentes.
- Inventariar TODOS los textos (incluidos módulos/copy, duración textual, SEO y
  label/URL CTA) frente a imágenes/iconos/categoría/datos neutrales. Services sí
  tiene detalle público: no copiar la retirada de SEO de Apartments.
- Auditar imágenes/iconos anidados y estructura/identidades para que un cambio
  común EN no borre textos PT ni se fusione por índices de arrays. Definir la
  matriz y compatibilidad legacy antes de elegir arquitectura/migraciones.
- Preservar booking_type enquiry/external/none, precios/rating, formularios,
  comportamiento condicional, slugs, SEO/ISR y contenido público existente.
  No cambiar correo/proveedor ni enviar mensajes externos.
- Categorías usan actualmente el campo traducible **name**, no label. Mantener
  esa identidad de datos; aplicar el patrón manual de Amenities sin renombrados
  destructivos. Reutilizar core i18n read/write seams, no escribir tablas kernel
  por fuera del contrato ni copiar borradores pendientes como traducciones EN.
- Servicios: reutilizar patrones de per-locale drafts/publication, herencia hasta
  custom y shared data de las entregas Blog/Property; sus detalles técnicos finales
  dependen de la auditoría. Si hacen falta migraciones, son aditivas y requieren
  la autorización de DB aplicable antes de ejecutarlas. No aplicar ninguna ahora.

Referencias de implementación recientes:

- ADR0061, `property-form-editors-execution.md` y `property-locale-editors-*`.
- Blog: `blog-form-editor-delivery.md` y `blog-post-locale-editors-*`.
- Amenities: ADR0064, `amenity-label-locales.md`, `amenity-label-locales-qa.md`;
  `src/slices/buildings/server/amenity-labels.ts`,
  `src/slices/buildings/admin/ui/amenity-form.tsx`, `amenity-payload.ts`,
  consultas y `BuildingLocaleEditor`.
- Reserva Building: ADR0062; Apartment: ADR0063. No extrapolar su eliminación de
  SEO a Services, ni reintroducir sus antiguos campos técnicos ocultos.

## Runtime y límites que deben sobrevivir el clear

- Main real: `/Users/maxi/Documents/claude-workspace/central-hill`.
- Único frontend `http://localhost:3071`, Nextdev relanzado por petición del
  usuario: PID84793, padre84787, sesión56260. Cwd main verificado. No detenerlo
  sólo por hacer clear; revalidar PID/puerto antes de futuras acciones.
- Entorno **local sintético propertylocalesqa**, Postgres5658/proxy4558,
  storage9077. El main actual NO usa el remoto descrito en handoffs viejos.
  Safe env: `/private/tmp/central-hill-building-status-qa/env.sh`; Node22/pnpm;
  preload local en `/private/tmp/central-hill-property-locales-qa/preload.cjs`.
  No imprimir credenciales ni copiar el backup remoto ignorado a agentes.
- Reinicio actual: `/private/tmp/central-hill-amenity-locales-qa/main-restart.log`;
  login HTTP200 confirmado. No nueva suite ni QA de producto por reiniciar.
- Preservar todos los worktrees/artifacts/fixtures. Únicos untracked main antes
  del checkpoint: logo base PNG en `logos/` y symlink `public/propertylocalesqa`.
  No incluirlos en el commit, no limpiar/resetear ni pisar uploads del usuario.
- Amenities executablecdab195, QA07fca86, entrega main52eda11: cuatro labels,
  selector/public4locales, selección común; pruebas/browser aprobadas registradas.
  Apartment37a8fe1/QA797b5ef y Buildingfdb462f/QA573c4a4 también integrados.
- Sólo documentación en este checkpoint: no código, tests, DB, migración, upload,
  push/deploy ni agentes nuevos. El próximo cambio pendiente es Services + sus
  categorías; no arrancar Guides ni la retirada global de Translations.
- Contact DB remoto sigue explícitamente diferido. No retomarlo tras el clear.

Al retomar: leer esta nota y AGENTS, verificar git status/log/runtime, revisar la
petición del usuario y preparar el spec/plan ejecutable del formulario Services.
Seguir el workflow vigente de dos implementadores disjuntos y QA independiente
para la implementación autorizada; tareas simples/documentales quedan en root.
