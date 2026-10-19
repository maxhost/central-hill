# Home — plan cerrado del editor contextual reutilizable

> Histórico del piloto ya implementado. El nuevo modelo editorial solicitado por el usuario
> está en [spec de drafts por idioma](page-locale-drafts-spec.md),
> [plan](page-locale-drafts-plan.md) y ADR0040. Sus reglas Guardar borrador/Publicar
> por idioma sustituyen aquí las referencias a guardado live, review y ausencia de drafts.

2026-10-18. Estado: alcance y decisiones cerrados con las aclaraciones del usuario;
**sin implementar Home todavía**. Próximo paso: spec de ejecución/contratos y Home.
Base de producto64da451, rama actual form-builder/integration,
checkout /private/tmp/central-hill-form-builder-integration. Continúa el concepto
[contextual-editor](contextual-editor/00-spec.md) y la entrega
[Forms](form-builder/02-handoff.md); el catálogo ya implementado no se vuelve a construir.

## Objetivo y decisiones confirmadas

Convertir /admin/pages/home en el primer adaptador del estándar contextual: página
visible a la izquierda, inspector del elemento seleccionado a la derecha, navegación
por secciones, preview desktop/tablet/mobile y contenido EN/ES/PT/FR. Sin mover,
añadir o eliminar secciones del diseño. Reutilizable después en Owners, Guest y otros
editores, con adaptadores y cobertura revisados por página.

**Confirmado por usuario: el formulario de reservas de Avantio no se toca desde
nuestro editor.** Se identifica como integración externa en la preview, sin campos,
selector Forms ni sustitución. Forms corresponde a formularios propios de contacto,
newsletter o rentabilidad. Tampoco se modifican reservas ni configuración de Avantio.

El editor Forms conserva ownership de campos/pasos/reglas/copy/traducciones/destino.
En futuras páginas que tengan formulario, el editor de página seleccionará uno de
Forms y sustituirá el formulario actualmente escrito en código. Mostrará resumen,
preview y enlace “Edit form”, sin duplicar el constructor. **Home no tiene formulario
propio: no tendrá selector, slot nuevo ni integración pública de Forms en este arco.**

## Base real y trabajo que falta

- Forms cuenta con tres plantillas, catálogo, esquemas editables, traducciones y
  pruebas staff con persistencia; código basee33f078, ajustes L0 posteriores hasta64da451.
- Aún no existen publicación/releases, placements, runtime de envío anónimo ni
  registro de submissions públicos de estos formularios. testForm no se reutiliza
  como endpoint público: exige staff y guarda pruebas separadas.
- Home usa schema fijo y guardado EN directamente público. No tiene borradores
  persistentes ni control de revisión como About. Su source sync/i18n integrado
  necesita trabajo real, además de añadir tabs.
- HomePage es async, con composición de datos y presentación. La preview de producto
  debe compartir renderer con la web, conservando RSC/ISR; el HTML3070 es referencia
  de interacción, no un segundo renderer para producción.
- Home **no tiene un slot de formulario propio inline**. Sus CTA actuales llevan a
  Owners/Avantio/enlaces configurados; el contacto del header pertenece a Settings.
  No se añade una sección ni se alteran esos destinos. No queda ninguna decisión
  pendiente de ubicación de formulario en Home: **no hay formulario que seleccionar**.
  El selector se implementará al adaptar una página con formulario real (ejemplo Owners).

## Cobertura de Home

| Área | Edición / tratamiento |
|---|---|
| Hero | Vídeo/poster, textos y botones existentes; distinguir destinos fijos |
| Buscador de reservas | Avantio externo: sin edición ni selector Forms |
| Cifras | Título y lista; valores compartidos, etiquetas traducibles, identidad estable |
| Guests pitch | Textos, beneficios/iconos, medio, CTA y badge |
| Portfolio | Copy de sección; cards pertenecen a Buildings |
| Services | Copy, garantías y categoría; cards pertenecen a Services |
| FAQ | Título y selección de grupo; contenido pertenece a FAQ |
| Cierre dual | Imágenes/copy de paneles; conservar destinos existentes |
| SEO | Inspector específico para title/description/OG; canonical/hreflang automáticos |
| Formularios propios | No aplicable en Home; selector y sustitución al adaptar páginas que sí los tengan |

Secciones ocultas/sin resultados siguen accesibles desde el índice. Todos los campos
actuales deben conservar acceso; listas con límites actuales, sin perder capacidades.

## Entregables pequeños y dependencias

1. **Spec ejecutable y contratos.** Definir PageEditorAdapter, bindings, metadatos
   traducibles y bridge de preview. ADR para instrumentación compartida. Registrar
   base, worktrees, archivos exactos, ownership y checks antes de delegar escritores.
2. **Shell contextual + Home de lectura.** Canvas/iframe privado con renderer público
   compartido, selección y outline, inspector, viewport real1440/768/390, foco y
   bloqueo de navegación/submits en preview. Avantio identificado como externo;
   su formulario no se activa ni se altera durante edición.
3. **Edición Home completa e idiomas.** Reusar controles/media queue/validación del
   CMS, añadir source sync atómico, revisión contra sobrescritura e identidad de
   listas traducibles. Tabs conservan selección y borradores locales por idioma;
   estructura/medios/referencias compartidos, copy/SEO traducibles, estados y fallback.
4. **QA independiente y cierre Home.** Integrar los entregables, verificar sólo las
   superficies tocadas, corregir y retestar afectados. Entregar Home funcional sin
   convertir Owners/Guest/About ni añadir publicación/envíos públicos de Forms.

## Estándar reutilizable, adaptación pantalla por pantalla

La parte común pertenece al backoffice: shell, selección, outline, toolbar, viewport,
estados pendientes/guardados, inspector y controles reutilizables. Cada página aporta
un adaptador con secciones/bindings, modelo de datos, preview y callbacks de guardado.
Pages conserva validación, persistencia, fuentes externas, traducción y revalidación.
El shell no importa queries de Pages ni ramifica su lógica por nombre de página.

Usar los FieldNode y controles actuales como base; no copiar el formulario gigante
a un segundo componente ni crear un renderer público alternativo. Los componentes
públicos sólo reciben instrumentación opcional cuando sea necesaria, con ADR si son
kernel; no cargar JS/anotaciones de edición al público. No generalizar reglas de
negocio de Home a otras páginas.

Criterio de diseño: incorporar Owners debe requerir su adaptador y bindings, no
copiar el shell. Las diferencias reales (listas, wizard, secciones exclusivas) se
resuelven en cada adaptador. No prometer conversión automática sin inventario. El
estándar se confirma con la segunda página, sin implementar esa página en el piloto.

Secuencia posterior: Owners como segundo piloto; después Guest, About y restantes,
una pantalla y un handoff a la vez. Al llegar a Owners se añade el selector de Forms
y se sustituye el wizard hardcoded por un formulario elegido del catálogo, manteniendo
la presentación/placement acordados. Revisar su compatibilidad funcional entonces.

La integración pública de Forms tendrá su spec/ADR dentro de ese arco: releases
inmutables, slots compatibles, selector formId/releaseId, renderer, envío anónimo
validado, captura/consentimiento, Resend e integración con Leads por contrato. Las
pruebas staff actuales no son ese endpoint. No construir ahora APIs/placeholders
sin uso ni bloquear Home por ese trabajo futuro.

## Preview, guardado e idiomas

Preview autenticada, privada y fuera del ISR público; anotaciones y scripts de
selección no llegan al visitante. Iframe same-origin con bridge validado por origin,
source e identidad de instancia. Ancho real del documento, no sólo escala visual.

Base propuesta: preview de la versión guardada con estado de cambios pendientes y
refresco después del guardado. EN: “Save and publish”, porque actualmente guardar
Pages publica; targets: guardar para revisión/aprobar con semánticas distintas.
Sin live preview por pulsación, snapshots privados sin guardar ni borrador persistente
en el MVP. Esta decisión cierra el piloto: navegación contextual y preview guardada,
con indicación clara de cambios pendientes. Esas ampliaciones pueden pedirse después.

Traducciones mediante kernel existente, nunca otra tabla paralela. EN fuente y
ES/PT/FR target; absent/unapproved→EN, approved stale visible según política actual.
Los formularios conservan su edición por idioma en Forms; no se duplican aquí.
Su futura publicación/selección por página queda fuera del piloto Home.

## Ejecución y QA proporcional

Raíz: ADR/contratos, migraciones, shell de rutas, mensajes/registries compartidos e
integración. Dos implementadores en worktrees independientes: uno shell/inspector/
bridge, otro adaptador/render/persistencia de Home; sin dos escritores sobre archivos comunes.
Un QA independiente revisa candidato integrado. No agentes implementadores en esta
fase documental. No main, push, despliegue, GitHub ni Neon producción.

Entorno nuevo aislado para Home; preservar Forms3064, concepto3070 y entornos
anteriores. No copiar credenciales de producción. No envíos de correo en este arco Home.

QA normal: seleccionar texto/medio/botón, editar/guardar/recargar/ver público; un
upload representativo; lista y target ES con fallback/aprobación/stale; comprobar
claves EN/PT/ES/FR sin repetir toda la batería por idioma; SEO/ISR conservados;
controles de preview que impiden navegación/envíos y Avantio sin editar. Un pase agrupado desktop/mobile,
confirmación sólo de correcciones. No matriz global ni todas las combinaciones.

Checks reales Node22/pnpm: typecheck/lint/tests explícitos afectados/build; db:check
si hay migración. Boundary review manual. Informar commit probado y limitaciones.

## Estado y siguiente sesión

Plan de alcance cerrado: Home contextual reutilizable, idiomas y SEO; sin Forms
ni Avantio editables en Home. No quedan decisiones de ubicación de formulario.
Preparar spec ejecutable, ADR y contratos/ownership antes de iniciar implementadores.
No se ha empezado la implementación de Home en esta sesión.

Se recomienda contexto nuevo antes del trabajo grande. Handoff de entrada:
[home-contextual-editor-handoff](home-contextual-editor-handoff.md).
Ningún cambio al editor Home, páginas públicas, Avantio, DB o env de previews para
cerrar este plan. Sólo documentación; diff-check, sin repetir tests de producto.
