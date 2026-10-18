# About CMS — plan y spec de alineación

2026-10-18. **Estado: implementación autorizada por el usuario; fase0 en curso.**
Base `6849427`, rama actual `guides-cms/integration` en
`/private/tmp/central-hill-guides-cms-integration`. No se autoriza por este documento
merge a main, push, despliegue, migraciones ni escrituras de producción.
Auditoría y límites de evidencia: [about-cms-audit.md](about-cms-audit.md).

## Resultado esperado

Que el editor refleje el contenido que muestra About, permita gestionar sus listas,
conserve identidad/destinos/traducciones y soporte el mismo repertorio multimedia
de Home en Historia, Organización y Comunidad. Mantener diseño y orden de secciones.
Textos/iconos/labels/SEO ya cubiertos no se reconstruyen innecesariamente.

## Registro de ejecución

- Inicio autorizado 2026-10-18. Base6849427, worktree nuevo
  `/private/tmp/central-hill-about-cms-integration`, rama `about-cms/integration`.
  Inicialmente limpio; se copian exclusivamente los dos documentos de auditoría
  propios de la fase anterior. Dependencias por symlink local, sin env remoto.
- Refinamiento de fase0: mantener para siempre las claves numéricas **originales**
  de ítems legacy mediante IDs `legacy_N`; ítems nuevos usan UUID y claves `@UUID`.
  Así no se copian/renombran traducciones existentes ni cambian sus actores/estado.
  Metadata `_list_ids` por colección y `_retired_ids` evita reutilización. No es
  fallback por índice actual: el índice original está anclado al ID estable.
  Strings de párrafo conservan su forma. Contact destination viaja con el ítem.
- Guardado About mediante un único statement PostgreSQL con CTE de page upsert
  condicionado al snapshot previo + sincronización de source T en seam kernel.
  Conflicto produce error/recarga sin writes; fallo SQL revierte el statement entero.
  Campos target conservan su política approved/stale actual. Source sync elimina
  sólo claves block ya retiradas/limpiadas de esta entidad.
- Ownership adicional root fase0: nuevo `src/core/i18n/source-snapshot.ts`, export
  en `src/core/i18n/index.ts`, ADR0037; nuevo
  `src/slices/pages/admin/about-save.ts`. Shared core helpers no importan Pages.
  Contratos y tests se completan antes de arrancar A/B.

Los campos continúan siendo source EN; textos T resueltos en EN/PT/ES/FR mediante
Translations. No prometer edición directa del ES en About ni traducción automática
real. El editor debe explicar source/fallback y enlazar al flujo de traducciones.

## Contrato funcional propuesto

1. **Fuente:** fila ausente→`defaultAbout` completo en editor y público. Fila válida
   conserva valores. Fila inválida→aviso de diagnóstico, edición/guardado bloqueados
   hasta reparación explícita; no sustituirla por defaults ni escribir sobre ella.
   Objetos/campos nuevos opcionales; no backfill destructivo ni ejecución de seeds.
2. **SEO:** mantener meta title/description, OG, canonicals, hreflang, title fallbacks.
   Validar OG como imagen existente. Ningún cambio a robots/sitemap/URLs públicas.
3. **Media:** conservar nombres `image_media_id` e `image_alt`. Cambiar accept de
   Story/Organisation/Community a `animated`: JPG/PNG/AVIF/WebP, MP4/WebM y Lottie
   JSON/dotLottie. Hero, audiencias, logos y OG continúan con accept imagen.
   Dispatch por MIME; WebP del slot animado sirve bytes originales; imágenes
   estáticas restantes mantienen optimización. Vídeo muted/loop/playsInline y
   comportamiento reduced-motion como Home; Lottie carga bajo demanda.
   No introducir audio, embed remoto ni controles de vídeo editorial.
4. **Marcos:** Organización4:5 como Home. Story/Community mantienen altura flexible
   de IntroSplit, cover, mínimos y apilado actuales. Reutilizar lógica multimedia
   con configuración del marco en Pages; no modificar kernel sólo para un wrapper.
   Alts de imagen=campo About→mensaje localizado. Vídeo decorativo no anuncia alt
   de fotografía; Lottie recibe label resuelto. Hints de formato/peso/ratio claros.
5. **Badge:** `organisation.badge_icon_key?`, vacío→check; label vacío oculta badge.
6. **Referencias:** validar existencia/UUID/MIME de cada referencia, también al
   llamar la acción sin UI. Slot mixto acepta sólo repertorio soportado; logos/OG/
   hero/audiencias sólo imagen. No guardar JSON si hay error de medios.

### Listas, límites propuestos y columnas

| Ruta | Ahora | Propuesta | Presentación |
|---|---|---|---|
| `story.narrative` | 3 strings | 1–8 párrafos | Flujo de texto |
| `stats` | 5 objetos | 0–8 | Hasta5 columnas desktop, adaptar1–4;0 oculta banda |
| `serve.audiences` | 3 | 1–12 | Hasta3 columnas desktop; nuevas filas |
| `values.items` | 4 | 1–12 | Hasta4 columnas; numeración automática |
| `organisation.departments` | 6 | 1–12 | Mantener lista2 columnas donde corresponde |
| `certifications.items` | 1–12 | Mantener1–12 | Hasta3 columnas |
| `community.copy` | 2 strings | 1–8 párrafos | Flujo de texto |
| `contact.cards` | 3 | 1–12 | Hasta3 columnas, destinos semánticos |

«Tres columnas» define el grid; no obliga a tres elementos. Las secciones no se
reordenan. Alta/baja/mover elementos con controles accesibles, límites visibles,
errores ligados a su elemento y estado coherente tras guardar/recargar. Campos de
identidad internos no se muestran como inputs. No introducir rich text/HTML libre.
No cambiar de forma los strings de párrafo existentes sin adaptador legacy.

Para contacto añadir `destination? = buildings | owners | real_estate` por tarjeta.
Legacy sin destination deriva una vez su destino de su posición original. Tras
normalizar, viaja con el elemento y se valida; nuevo elemento requiere escoger uno.
No aceptar URL libre ni derivar destinos por el índice final. Añadir texto de ayuda
que distingue destino de label; locale se incorpora al render. Si la lista supera
las tres posiciones sin destino explícito, rechazar como inválida.

## Fase0 obligatoria: identidad y traducciones antes de delegar

No basta con relajar `.length(n)`. Actualmente tanto las traducciones aprobadas
como los destinos dependen del índice. La siguiente fase comienza con el contrato
de identidad y su prueba integrada; después se crean las ramas de los consumidores.

Diseño preferido: identidad estable de cada elemento, independiente del texto,
posición e idioma; conservar el JSON legacy de párrafos mediante un mapa opcional
de IDs por lista en metadatos About. IDs legacy deterministas por colección/posición
original, persistidos al primer guardado; IDs nuevos únicos y nunca reutilizados.
La UI mueve/elimina contenido e identidad conjuntamente. Copiar títulos iguales no
puede colisionar. No confiar en IDs/metadata arbitrarios enviados por cliente.

Las claves T de elementos nuevos deben derivar de identidad estable. En transición
se migran/asocian **una vez** las traducciones numéricas existentes al ID original,
preservando value/state/source_hash/review y actor. Tras esa transición no se vuelve
a consultar una clave numérica para un elemento nuevo o movido. Borrar un elemento
no puede hacer reaparecer su traducción en otro. El contenido no perteneciente a
listas conserva sus claves actuales. Usar las APIs de `@core/i18n`, nunca escribir
la tabla de traducciones desde Pages.

El orquestador debe concretar antes de consumidores:

- Tipos/validación de metadata, shape exacto de claves T, normalización legacy y
  extracción/source sync para que `/admin/translations` vea las nuevas hojas.
- Operación de guardado que no deje JSON e identidades/traducciones incoherentes
  ante error parcial; token de revisión para rechazar formularios viejos. El driver
  actual es `drizzle/neon-http`: no asumir transacciones interactivas disponibles.
- Compatibilidad de aprobaciones concurrentes y clears de traducciones; conflictos
  explícitos y recarga, sin pérdida silenciosa de cambios ajenos.
- ADR acotado para la enmienda de listas de ADR0012 y cualquier extensión del kernel
  necesaria. Número asignado al iniciar fase0; no reservarlo contra trabajo ajeno.

**Gate:** publicar un contrato comprobado y actualizar esta spec con nombres reales
de exports/archivos y commit antes de arrancar A/B. El diseño de persistencia atómica
de fase0 aún no se ha implementado ni verificado; no presentar este plan como
contrato técnico ya listo para paralelizar. No elegir el atajo de borrar traducciones
aprobadas o dejar traducciones de otro elemento como fallback.

## Plan de ejecución y ownership

Sólo después de la siguiente autorización de implementación. Crear savepoint del
HEAD real de entonces, comprobar tracked/untracked y no absorber trabajo ajeno.
Propuesta de integración nueva `/private/tmp/central-hill-about-cms-integration`,
rama `about-cms/integration`, partiendo del código Guides aprobado y su cierre
documental, sin integrar Guides a main como prerrequisito.

El orquestador es único escritor de contratos/schema/registro/mensajes/acciones,
docs y cambios kernel bajo ADR. Antes de delegar anotará HEAD de contratos, ramas,
worktrees y verificación de pwd/branch/status de cada agente. Archivos propuestos:

| Dueño | Writable existentes / nuevos propuestos |
|---|---|
| Orquestador | `src/slices/pages/schemas/about.ts`, `src/slices/pages/contract.ts`, `src/slices/pages/admin/actions.ts`, `src/slices/pages/admin/queries.ts`, `src/slices/pages/admin/layout.ts`, `src/slices/pages/server/resolve.ts`, `src/slices/pages/server/queries.ts`, `src/slices/pages/tests/pages-admin.test.ts`, `src/slices/pages/tests/pages.test.ts`, `src/slices/pages/README.md`, `docs/data-model.md`, `messages/{en,pt,es,fr}.json`, esta spec y auditoría |
| Orquestador, fase0 | Nuevos `src/slices/pages/about-content.ts`, `src/slices/pages/admin/about-defaults.ts`, `src/slices/pages/admin/about-media-validation.ts`, `src/slices/pages/server/about-translations.ts`, tests `about-content.test.ts`, `about-defaults.test.ts`, `about-media-validation.test.ts`, `about-translations.test.ts`; ADR nuevo; posibles `src/core/i18n/content-write.ts`, `src/core/i18n/index.ts` y nuevo test kernel de compatibilidad bajo ADR |
| A, editor | `src/slices/pages/admin/ui/page-editor.tsx`, `src/slices/pages/admin/ui/schema-fields.tsx`, `src/slices/pages/admin/form-model.ts`; nuevos `src/slices/pages/admin/ui/about-list-editor.tsx`, `src/slices/pages/tests/about-editor.test.ts` |
| B, público/media | `src/slices/pages/ui/about-page.tsx`; nuevos `src/slices/pages/ui/components/about-media.tsx`, `src/slices/pages/ui/about-presentation.ts`, `src/slices/pages/tests/about-presentation.test.ts` |
| QA independiente | Código read-only; nuevos `docs/specs/about-cms-qa.md` y evidencias en su carpeta temporal |

A: `/private/tmp/central-hill-about-cms-admin`, rama `about-cms/admin`.
B: `/private/tmp/central-hill-about-cms-public`, rama `about-cms/public`.
Son destinos propuestos, **no creados**. Ningún writer comparte worktree. Archivos
compartidos permanecen con root; cambios a `side-media.tsx` o kernel UI sólo si la
fase0 justifica y asigna explícitamente, nunca simultáneamente por A/B. Tests nuevos
de cada implementador no editan el archivo histórico compartido.

No se prevé cambio DDL sólo por listas JSON/media. Si el contrato exige migración,
detener esa decisión para actualizar ADR/ownership/plan y reservar número real;
no aplicar0021 ni ninguna migración remota. Archivos nuevos no listados requieren
ampliación explícita del write set por root antes de editar.

Orden: fase0 contratos → A/B en worktrees aislados → handoffs con commits y checks
→ root integra en rama de tarea → QA independiente → correcciones y retest afectados
→ handoff local. Commit/main/push/deploy respetarán la autorización de esa fase.

## Entorno de verificación previsto

Conservar previews3059/3060/3061, procesos, worktrees, DB y buckets. Crear preview
nueva, candidato3062 si sigue libre; DB/rol/bucket propios `aboutcmsqa`, fixtures
sintéticas About completas y traducciones ES/PT/FR aprobadas para listas. Registrar
puertos DB/proxy/storage, PID, cwd, build commit, identidad de DB/bucket antes de
cualquier write. Sin copiar .env remoto ni datos personales. No usar3061 para
guardar About; su uso en esta auditoría fue exclusivamente lectura + sesión fake.

## Aceptación y QA

- Las doce capturas tienen correspondencia con controles en orden público; títulos,
  eyebrow/intro, todos los ítems, iconos, badge, labels y SEO editan el elemento real.
- Fila ausente muestra defaults coherentes en editor/público. Fuente inválida se
  detecta y no se sobrescribe. No-op sobre legacy válido preserva datos/traducciones.
- Añadir/borrar/reordenar y recargar cada lista, incluidos strings de párrafo,
  duplicados de título, límites y huecos. Probar eliminar intermedio→añadir.
- Traducir A/B/C, mover/eliminar B, añadir D, editar fuente, aprobar/clear en
  Translations y verificar EN/PT/ES/FR: ninguna traducción se reasigna por posición.
  Simular stale editor y fallo de guardado. No duplicados ni writes parciales ocultos.
- Reordenar tarjetas contacto conserva su destino semántico en cuatro locales.
- Probar imagen, WebP animado real, MP4, WebM y Lottie en los tres slots mixtos;
  guardar/recargar y observar animación, red y reduced-motion. Comparar layouts
  Story/Community altos con Organización4:5. Quitar media restaura foto fallback.
  Comprobar WebP original sin declarar probado el CDN de producción desde localhost.
- Probar referencia inexistente, MIME incorrecto, OG/logo con vídeo, upload fallido,
  doble submit y permiso no-staff. Datos anteriores permanecen tras error.
- Guardar texto/SEO/icono/media y comprobar ISR público sin rebuild en cuatro locales;
  aprobar traducción también invalida `page:about`. Canonical/hreflang/OG conservados.
- Desktop1440, tablet880, móvil390, teclado/focus y formularios legibles; fixtures
  con counts mínimo/máximo, textos largos y0cifras. Regresión Home/otra página por
  edición de componentes compartidos; no alteración de hero ni grids existentes.

Checks integrados obligatorios Node22/pnpm, registrar exit codes y commit:

```sh
pnpm typecheck
pnpm lint
pnpm exec tsx --test src/slices/pages/tests/pages.test.ts src/slices/pages/tests/pages-admin.test.ts src/slices/pages/tests/about-content.test.ts src/slices/pages/tests/about-defaults.test.ts src/slices/pages/tests/about-media-validation.test.ts src/slices/pages/tests/about-translations.test.ts src/slices/pages/tests/about-editor.test.ts src/slices/pages/tests/about-presentation.test.ts
pnpm build
git diff --check
```

Añadir tests kernel/Translations explícitos si la fase0 los modifica; `pnpm db:check`
si hay migración o lo pide el contrato final. No contar `pnpm test`/`boundary:check`.
Revisar imports cross-slice por contract, no sólo placeholders. Detector Impeccable
una vez sobre UI final. QA de persistencia sólo en DB nueva aislada; no sustituir
save/reload por unit tests o capturas. No declarar aceptación hasta QA integrado.

## Fuera del alcance propuesto

Rediseño público, builder libre, orden de secciones, URLs arbitrarias, edición
directa de traducciones en pestañas About, nuevos perfiles Team, vídeo en hero o
fondos de tarjetas, envío de leads en producción. Datos de oficina siguen en
Settings; FAQ en su catálogo. Texto Submit/consent/errores del formulario compartido
permanece en `leads.*`: si se solicita control local, especificarlo por separado con
ownership de Leads y fallback compartido, antes de ampliar archivos.

## Entrega de esta fase

Únicamente esta spec y `about-cms-audit.md` añadidos. Sin cambios de código,
commits, implementación, migraciones, merge a main, push ni despliegue. Las
decisiones de fase0 se resolverán como parte de la implementación posterior;
no se delegó trabajo a implementadores en esta revisión.
