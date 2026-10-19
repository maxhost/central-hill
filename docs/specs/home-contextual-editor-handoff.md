# Handoff para iniciar el editor contextual de Home

2026-10-18. Trabajo siguiente: piloto Home de un editor contextual común, con
preview izquierda/inspector derecha, selección, viewports, idiomas EN/ES/PT/FR y SEO.

## Lectura y base

Checkout actual /private/tmp/central-hill-form-builder-integration,
rama form-builder/integration. Código Forms QA-aprobadoe33f078; informeb7d8d4c.
Ajustes L0 posteriores: a665c01 selector de template normalizado;64da451
“Back to Forms” con flecha Iconoir. Usuarios los validaron visualmente.
Los commits posteriores son documentación; verificar HEAD/status antes de continuar.

Leer AGENTS.md, CLAUDE.md, docs/multi-agent-workflow.md y:
- docs/specs/home-contextual-editor-plan.md (plan vigente cerrado).
- docs/specs/contextual-editor/00-spec.md y03-review.md (referencia de concepto).
- docs/specs/form-builder/02-handoff.md (Forms real y límites actuales).

## Decisiones que no deben reabrirse

- Sólo Home en el primer arco. Base reutilizable + adaptador por página; luego
  Owners, Guest, About y demás, pantalla por pantalla. No duplicar shell/render.
- Home NO tiene formulario propio. No crear slot ni selector de Forms en Home.
- Avantio es externo: no se edita, sustituye, configura ni envía desde el editor.
- Cuando se adapte una página con formulario hardcoded, como Owners, se incorporará
  el selector de Forms para sustituirlo por uno creado allí. Su publicación/runtime/
  envío público es trabajo futuro real; staff test actual no lo implementa.
- Preview MVP de contenido guardado, indicadores de pendientes y refresco tras save;
  sin live preview por pulsación, snapshot sin guardar ni draft persistente.
- Preservar diseño fijo, toda la cobertura actual, SEO, i18n e ISR. No reorder de
  secciones. Idiomas con fuente/targets, aprobación/fallback/stale, no tabs cosméticas.

## Ejecución siguiente

Preparar spec ejecutable/ADR/contratos y archivos exactos antes de delegar. Crear
rama/worktree Home desde esta base, conservar Forms y su preview. Dos implementadores
con escrituras disjuntas, raíz integra y un QA independiente. No comenzar otras páginas.
QA normal de lo tocado, sin matriz excesiva ni replicar todos los casos por idioma.
Local QA automática autorizada; no pedir autorización por cada test. No main/push/
despliegue, GitHub ni Neon producción. Sólo entorno nuevo aislado para Home.

## Previews y estado

Forms3064 en /private/tmp/central-hill-form-builder-integration, DBformbuilderqa local
5598/proxy4498, correo consola. Prototipo3070 preservado en checkout de concepto.
No modificar esos entornos ni los anteriores. Al cerrar Forms se observaron listeners
3063/3064/3070; no se afirmó que3059–3062 siguieran corriendo (artefactos preservados).
No copiar credenciales productivas. No hay implementación Home pendiente a medio hacer.
