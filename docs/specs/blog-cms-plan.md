# Blog público y CMS — plan/spec revisado

2026-10-18. **Plan aprobado para implementar por el usuario.**
Estado y comprobaciones: [blog-page-execution.md](blog-page-execution.md).
Revisión según las cuatro capturas del usuario: editor `/admin/pages/blog`, salida
`/es/blog` y equivalentes EN/PT/FR. Auditoría: [blog-cms-audit.md](blog-cms-audit.md).
Base documental `1c48555`, código `d4e13c9`, rama `about-cms/integration`, checkout
`/private/tmp/central-hill-about-cms-integration`. Al aprobar este plan sólo había cambios documentales en
este plan, la auditoría y AGENTS.md. La implementación se registra en su execution.
Sin main, push ni despliegue.
Preservar previews3059–3062 y sus entornos.

## Resultado y alcance de esta entrega propuesta

`/admin/pages/blog` debe permitir editar los textos de las cuatro capturas y el
SEO del listado, y registrar esos campos en el flujo de traducción por idioma.
Se conserva la composición y el diseño público actuales. No se necesita rehacer
el editor de artículos para lograrlo.

| Captura / sección pública | Controles en Pages → Blog | Campos propuestos |
|---|---|---|
| 1: “El diario de Central Hill”, título principal, párrafo y “Buscar artículos…” | Cabecera: texto superior, título, introducción, placeholder y etiqueta accesible del buscador | `hero.eyebrow`, `hero.headline`, `hero.intro`, `hero.search_placeholder`, `hero.search_label` |
| 2: “Destacado” | Destacado: etiqueta de sección | `featured.eyebrow` |
| 3: “Últimos artículos” / “Del Diario” | Últimos artículos: texto superior y título | `journal.eyebrow`, `journal.title` |
| 4: “Newsletter”, “Mantente informado. Mantente por delante.” y descripción | Newsletter: texto superior, título y descripción | `newsletter.eyebrow`, `newsletter.title`, `newsletter.description` |
| SEO del listado | Título SEO, descripción SEO e imagen social existente | `seo.meta_title`, `seo.meta_description`, columna `og_image_media_id` |
| CTA lateral ya existente en este editor | Conservar sus cuatro campos actuales, sin perder datos | `post_aside.eyebrow`, `title`, `body`, `cta_label` |

Las frases de las capturas identifican los campos, no constituyen nuevos textos
fuente ingleses. Se preservan los valores actuales de cada idioma como fallback.
La cabecera no lleva foto en el diseño mostrado: no añadir un campo hero image.
La imagen social pertenece a SEO y no se presenta como foto visible del listado.

Orden del formulario: SEO e imagen social → Cabecera → Destacado → Últimos
artículos → Newsletter → CTA lateral de artículos (existente). Labels y ayudas
claros; indicar que el CTA lateral aparece en artículos y que newsletter comparte
copy con su banda en los artículos. Evitar una tarjeta social duplicada.

Contenido dinámico: el artículo destacado, fotos, títulos y excerpts de tarjetas
siguen saliendo de Posts; categorías de Categories. Un enlace/nota breve desde
Pages→Blog puede indicar dónde gestionarlos. No crear otra copia de esos datos.
Los títulos Destacado/Últimos artículos conservan sus condiciones de visibilidad
actuales: no forzar secciones vacías cuando no hay artículos.

## Traducción por lenguaje: comportamiento obligatorio

Se conserva el modelo del proyecto: fuente EN en Pages→Blog; revisión de PT/ES/FR
en Translation. No se añaden cuatro copias de página ni un editor fuente español.
La ayuda del formulario debe explicar este flujo y enlazar la revisión de esta
entidad cuando ya exista. Esta fase prepara y conecta los campos; no implica
redactar automáticamente nuevas traducciones de todo el contenido real.

- Cada texto de la tabla, incluidos SEO y placeholder/label accesible, se marca
  como [T] mediante `tStr/tStrOpt` y se enumera en `translatablePathsByPage.blog`.
- Guardar la página debe sincronizar filas source `entity_type=page_content`,
  `entity_id=<UUID de la fila blog>`, `field=block:<path>`. Ejemplos:
  `block:hero.headline`, `block:featured.eyebrow`, `block:journal.title`,
  `block:newsletter.description`, `block:seo.meta_description`.
  El marcado del esquema sin source sync no cumple esta aceptación.
- Mantener paths e identidad de la fila/CTA existentes. No sobrescribir targets
  aprobados al guardar source; conservar el mecanismo de revisión por cambios.
  Limpiar un override debe retirar su source y targets para que no sobreviva
  una traducción huérfana de ese override.
- En público: target aprobado no vacío → source EN no vacío → mensaje localizado
  actual del campo. Un draft target no se publica. Un override vacío significa
  fallback, no ocultar el bloque. Mostrar esta regla en ayuda del editor.
- Sin fila o con grupos nuevos ausentes: abrir con representación coherente del
  fallback actual; no convertir textos de fallback en overrides por el simple
  hecho de guardar un campo diferente. Distinguir valor heredado y override.
- Una fila legacy válida no debe fallar por no tener grupos nuevos. Una fila
  inválida debe advertir/bloquear reemplazo silencioso y preservar lo almacenado.
- La imagen OG es referencia compartida entre idiomas; no traducir su UUID.
  No se solicita imagen diferente por idioma en esta fase.
- Save y aprobación/reset de traducción deben invalidar el tag real `page:blog`.
  Resolver el page key por UUID a través del contrato Pages; no purgar sólo
  `page:about` o `page_content:<UUID>`. Conservar comportamiento de otras páginas.

## Contratos, SEO y persistencia

Extender `BlogContent` con grupos opcionales compatibles `hero`, `featured`,
`journal`, `newsletter`, `seo`; conservar `post_aside` y su destino actual owners.
Los nuevos overrides textuales son opcionales. Usar límites coherentes con los
esquemas de otras páginas y validar la imagen OG como imagen subida existente.
No se prevé migración SQL: datos en JSON y columna OG ya existentes.

Exponer `getBlogPage(locale)` por `pages/contract.ts`: contenido normalizado,
media/OG y resolución de textos por idioma. Mantener `getBlogAsideCta` compatible.
`BlogListing` consume ese contrato para las cuatro secciones. `BlogPost` sólo
necesita conectar la banda newsletter compartida a esos mismos tres campos,
conservando el resto del artículo. No importar internals entre slices.

Añadir `buildBlogMetadata(locale)` siguiendo el patrón de Pages y conectar
`app/[locale]/blog/page.tsx`. Title/description usan el mismo flujo traducible;
si no hay overrides, usar defaults de metadata localizados en los cuatro idiomas,
conservando el significado de los textos actuales. Consumir realmente la imagen
social guardada. Canonical propio `/{locale}/blog`, EN/PT/ES/FR y x-default
continúan generados; no son inputs editables. No cambiar SEO individual de posts,
BlogPosting, breadcrumbs ni sitemap como efecto secundario.

Revalidación: `page:blog` y rutas/árbol de Blog por locale, incluido newsletter y
CTA compartidos en artículos. No depender del rebuild ni asumir que el ISR horario
elimina una entrada de datos cacheada sin TTL. Sin cambiar primitivas del kernel.

## Seguimientos separados del alcance inmediato

La auditoría conserva estos hallazgos, pero no son requisitos de esta entrega:
activar búsqueda (aquí sólo se editan sus textos), avatar de autor, mover ítems o
relacionados, alt de portada individual, destinos nuevos de CTA, formato/validación
JSON de traducciones del cuerpo y ayuda de fecha. No ampliar Posts/Categories/
Authors ni corregir sus tags de traducción como condición para este editor.
Las etiquetas Leer artículo, Cargar más, Todos, vacío y chrome del detalle siguen
en mensajes; no fueron señaladas en las capturas. Su eventual edición se revisa
por separado. Leads conserva labels, consentimiento y envío de newsletter.

## Ejecución futura y propietarios

Antes de implementar, el orquestador registra base/savepoint definitivos, ramas,
worktrees, estado Git, contratos, nuevos archivos exactos y entorno sintético.
Nueva preview propuesta3063 sólo si libre, con DB/bucket propios y sin credenciales
de producción. No modificar/reiniciar/reconstruir previews3059–3062.

Según workflow: contratos primero; dos implementadores con archivos disjuntos y
worktrees separados; integración en rama de tarea; QA independiente funcional.
Inventario propuesto para cerrar antes de delegar:

- Orquestador: schema/contract Pages; mensajes EN/PT/ES/FR; shell de ruta listado;
  conexión Translation→Pages para invalidar la página correcta y su prueba focal;
  README Pages/Blog, data-model, spec/QA/handoff. Sin asignación `src/core/*`.
- A: Pages admin (queries/actions/layout, extensión mínima de page-editor sólo si
  hace falta); normalización/defaults y source sync de Blog; tests de ese comportamiento.
- B: Pages lectura/metadata y contrato ya asentado; BlogListing y conexión de la
  banda newsletter en BlogPost; tests de presentación, metadata y fallbacks.
- QA: informe y evidencias propios; no editar código. Asignaciones exactas y
  nombres de archivos nuevos deben quedar registrados antes de iniciar agentes.

Esta revisión precedió a la autorización posterior del usuario; las ramas, agentes
y asignaciones definitivas se registran en blog-page-execution.md.
Sin integración a main, push, despliegue ni escrituras de producción.

## Aceptación y verificación funcional normal

1. Abrir `/admin/pages/blog`: están todos los campos de la tabla en secciones
   reconocibles; el CTA y OG existentes conservan valores. Un source legacy abre
   sin error; no se materializan overrides por guardar campos ajenos.
2. En DB aislada, cambiar los textos de las cuatro capturas, SEO y una imagen OG
   real; Save, reload y segundo Save. Ver cambios en listado sin rebuild y copy
   newsletter compartida en un artículo. No repetir cada variante de formato.
3. El inbox Translation contiene los campos source correctos. Aprobar una
   traducción ES de cabecera/sección y SEO; comprobar salida inmediata en `/es/blog`.
   Smoke PT/FR con fallback correcto, sin repetir todo el formulario por idioma.
   Test focal de draft→fallback y de preservación de traducciones existentes.
4. Inspeccionar title/description/OG, canonical y alternates de los cuatro idiomas.
   Imagen OG subida conecta con metadata; no aparece como hero ni cambia SEO de posts.
5. Una revisión desktop1440 y móvil390 con featured y al menos un post de grid
   para ver los encabezados, sin overflow ni cambio de diseño. Una imagen social,
   un guardado normal y una traducción representativa bastan; sin matriz ampliada.

Fixture mínimo: una categoría, un autor y dos posts publicados (uno featured,
otro grid); uno sirve para comprobar newsletter/CTA compartidos. Crear todo en el
entorno nuevo, no poblar la preview About vacía ni exigir contenido de producción.

Node22/pnpm: `pnpm typecheck`, `pnpm lint`, tests reales mediante
`pnpm exec tsx --test <archivos explícitos afectados>` y `pnpm build` sobre
candidato integrado en runtime aislado. Cerrar nombres definitivos de tests de
Blog page/metadata/source sync/invalidación al registrar contratos; reutilizar
suites afectadas Pages/Blog/Translation. Registrar comandos/exit codes/commit.
No contar `pnpm test` ni `pnpm boundary:check` (placeholders). `db:check` sólo si
se necesita migración. QA independiente hace Save/reload/public/OG/traducción
normales; retestar únicamente fallos concretos y cambios afectados.

Este documento define el alcance aprobado; los resultados de implementación y QA
se registran por separado en execution y QA, sin inferirlos del propio plan.
