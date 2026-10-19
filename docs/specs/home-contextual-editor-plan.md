# Home — plan del editor contextual y selector de Forms

2026-10-18. Estado: propuesta para revisión; **sin implementar Home todavía**.
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
El editor de página selecciona el formulario y su versión publicada en un slot
compatible; muestra resumen, preview y enlace “Edit form”. No duplica su constructor.

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
  No añadir una sección ni alterar esos destinos silenciosamente. El plan incluye
  infraestructura del selector, pero su ubicación funcional en Home se define al
  revisar el mapa de bloques. Si Home no incorpora un slot propio, se identifica
  como externo y se habilita el selector al adaptar una página con un slot real.

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
| Formularios propios | Sólo slots explícitos compatibles; nunca el widget de Avantio |

Secciones ocultas/sin resultados siguen accesibles desde el índice. Todos los campos
actuales deben conservar acceso; listas con límites actuales, sin perder capacidades.

## Entregables pequeños y dependencias

1. **Spec ejecutable y contratos.** Confirmar mapa/slot de formularios; definir
   PageEditorAdapter, bindings, metadatos traducibles y bridge de preview. ADR para
   instrumentación compartida y publicación/placements Forms. Registrar base,
   worktrees, archivos exactos, ownership y checks antes de delegar escritores.
2. **Shell contextual + Home de lectura.** Canvas/iframe privado con renderer público
   compartido, selección y outline, inspector, viewport real1440/768/390, foco y
   bloqueo de navegación/submits en preview. Avantio identificado como externo;
   su formulario no se activa ni se altera durante edición.
3. **Edición Home completa e idiomas.** Reusar controles/media queue/validación del
   CMS, añadir source sync atómico, revisión contra sobrescritura e identidad de
   listas traducibles. Tabs conservan selección y borradores locales por idioma;
   estructura/medios/referencias compartidos, copy/SEO traducibles, estados y fallback.
4. **Forms publicables + selector.** Publicar una release inmutable con esquema y
   copy resuelta por idioma; permitir seguir editando borrador sin cambiar la
   release en uso. Contratos listCompatibleForms/getPublishedForm/submitPublishedForm
   propiedad de Forms. Placement guarda formId+releaseId; selector y preview muestran
   nombre, versión, idiomas y enlace a Forms. Actualizar versión es explícito.
5. **Uso público funcional del placement acordado.** Render por contrato Forms,
   validación servidor contra release/slot guardados, consentimiento exacto,
   persistencia pública separada de tests y notificación Resend. Definir integración
   con Leads por contrato sin forzar schemas dinámicos en sus cuatro kinds legacy.
   Protección básica de envío (honeypot/límites/duplicados), sin convertir esto en CRM
   ni motor de automatizaciones. La preview nunca ejecuta el envío público.
6. **QA independiente y cierre local.** Integrar los entregables, verificar sólo las
   superficies tocadas, corregir y retestar afectados. Después planificar Owners
   como segunda prueba del estándar, sin convertir todas las páginas en este arco.

El selector no se presenta como funcional si sólo guarda un ID y no tiene renderer,
publicación y envío reales. Si se entrega Home antes del slot público, se declara
explícitamente esa división y no se anuncia integración pública de Forms.

## Preview, guardado e idiomas

Preview autenticada, privada y fuera del ISR público; anotaciones y scripts de
selección no llegan al visitante. Iframe same-origin con bridge validado por origin,
source e identidad de instancia. Ancho real del documento, no sólo escala visual.

Base propuesta: preview de la versión guardada con estado de cambios pendientes y
refresco después del guardado. EN: “Save and publish”, porque actualmente guardar
Pages publica; targets: guardar para revisión/aprobar con semánticas distintas.
Sin live preview por pulsación ni promesa de draft persistente. Un refresco manual
con snapshot privado sin publicar es una ampliación concreta a decidir en la spec
antes de implementarlo, no un requisito oculto de esta propuesta.

Traducciones mediante kernel existente, nunca otra tabla paralela. EN fuente y
ES/PT/FR target; absent/unapproved→EN, approved stale visible según política actual.
Guardar Forms no cambia automáticamente la versión insertada en una página. El
slot/release es compartido por idioma; textos se resuelven desde esa release.

## Ejecución y QA proporcional

Raíz: ADR/contratos, migraciones, shell de rutas, mensajes/registries compartidos e
integración. Dos implementadores en worktrees independientes: uno shell/inspector/
bridge, otro adaptador/render/persistencia de Home; el puente Forms se asigna en
pasos posteriores con archivos disjuntos, sin tercer escritor sobre archivos comunes.
Un QA independiente revisa candidato integrado. No agentes implementadores en esta
fase documental. No main, push, despliegue, GitHub ni Neon producción.

Entorno nuevo aislado para Home; preservar Forms3064, concepto3070 y entornos
anteriores. No copiar credenciales de producción. Resend con transporte simulado/
consola en QA; entrega real requiere configuración posterior, fuera de este plan.

QA normal: seleccionar texto/medio/botón, editar/guardar/recargar/ver público; un
upload representativo; lista y target ES con fallback/aprobación/stale; comprobar
claves EN/PT/ES/FR sin repetir toda la batería por idioma; SEO/ISR conservados;
un placement compatible y envío sintético real por contrato, cambio de release
explícito, controles de preview que impiden envíos. Un pase agrupado desktop/mobile,
confirmación sólo de correcciones. No matriz global ni todas las combinaciones.

Checks reales Node22/pnpm: typecheck/lint/tests explícitos afectados/build; db:check
si hay migración. Boundary review manual. Informar commit probado y limitaciones.

## Estado de esta propuesta

Plan inicial redactado desde código real y concepto previo; pendiente revisar las
ubicaciones de Forms y cerrar spec/contratos de ejecución. Ningún cambio al editor
Home, a páginas públicas, Avantio, DB o env de previews para crear este documento.
