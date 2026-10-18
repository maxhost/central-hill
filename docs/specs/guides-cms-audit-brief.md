# Próxima tarea: auditoría y spec del CMS de guías individuales

Fecha: 2026-10-18. Estado: solicitada; auditoría todavía no iniciada.
El usuario pidió cerrar contexto antes de invertir recursos en esta tarea.
No iniciar implementación hasta terminar inventario, auditoría, spec y plan.

## Petición del usuario

Crear después un CMS similar a `/admin/services`, para cada guía individual.
Primero mapear TODAS las guías existentes y distinguir lo repetido de lo exclusivo.
Referencias iniciales (no son el inventario completo):

- https://central-hill-umber.vercel.app/es/guides/lisbon/things-to-do-in-lisbon
- https://central-hill-umber.vercel.app/es/guides/lisbon/beaches-near-lisbon

Usar agentes de solo lectura para auditar modelo/datos, render público/variantes
reales y UX del editor. Cruzar el sitio publicado con el código y los seeds;
no deducir todos los tipos a partir de solo dos URLs. Preparar matriz por guía,
campos comunes, módulos opcionales/exclusivos, reglas de composición, imágenes,
vídeos donde existan, labels, iconos, enlaces, SEO y relación con ciudades/lugares.
Determinar si conviene activar módulos independientes como en Services o conservar
plantillas concretas según evidencia. No convertirlo en un page builder genérico.

Entregar auditoría + spec + reparto ejecutable (orquestador, dos implementadores,
QA independiente), contratos y aceptación antes de lanzar escritores.

## Contexto confirmado del repositorio

Leer AGENTS.md, CLAUDE.md, docs/multi-agent-workflow.md, README de Guides/Pages y ADRs.
Guides ya posee guide_page → guide_section → guide_place; detalles e índice públicos
existen. El CMS de detalles no se implementó en la tarea anterior.
El tipo GuideTemplate contiene landing/eat/beaches/events/secrets/families/groups/
travellers/custom; es inventario técnico inicial, NO conclusión sobre las variantes
reales publicadas. Inspeccionar también layouts de secciones y lugares.

Referencia Services: docs/specs/service-detail-editor-execution.md,
service-detail-editor-qa.md y handoff-service-detail-editor.md. Secciones activables
independientes, datos retenidos al ocultar, overrides y precios separados; no copiar
su shape a Guides sin auditar las necesidades reales.

La página índice `/admin/pages/guides` ya se implementó: SEO, hero foto/vídeo,
copy/iconos y filtro conjunto de ciudades. Su guide_aside es CTA compartido en
TODOS los detalles, se conserva dentro de Pages. El nuevo CMS debe evitar duplicar
ese contenido sin una decisión explícita sobre override por guía.

## Estado local que debe preservarse

Entrega del editor de página: main local df4ccd8, código fc1daac aprobado por QA,
228tests y23casos browser. Ver docs/specs/handoff-guides-page-editor.md.
Follow-up posterior: checkbox Show city filter colapsa solo sus campos; mantiene
valores en el estado. Usuario confirmó «funcionó». Typecheck/lint/build pasaron;
comprobación automatizada de navegador cancelada por el usuario, no se afirma
QA independiente nueva. Cambio en pages/admin/ui/schema-fields.tsx.
Todo se captura en un commit local antes de limpiar contexto; consultar HEAD.

Servidor3060: worktree /private/tmp/central-hill-guides-integration,
branch guides-page/integration, modo production, sesión74270. Env fake en
/private/tmp/central-hill-guides-qa/env.sh. DB/rol guidespageqa, PostgreSQL5558,
proxy4458; S3rver9060 bucketguidespageqa. Datos sintéticos: DOS guías para pruebas,
NO constituyen inventario del contenido real. Acceso ficticio
guidespageqa@example.test / test1234. Mantener también preview3059/servicedetailqa.
No copiar .env.local raíz (remoto) ni usarlo para writes/fixtures/builds.

Worktrees previos y evidencias conservados. No push ni despliegue realizados.
Savepoints anteriores: pre-service-detail-editor y pre-guides-page-editor del
2026-10-18. Registrar nuevo savepoint estable antes de eventual implementación.

## Prompt para retomar

Continúa la auditoría y spec del CMS de guías individuales descrita en
`docs/specs/guides-cms-audit-brief.md`. Usa agentes para mapear todas las guías
reales y distinguir campos comunes y módulos específicos. Conserva el trabajo
existente y los entornos locales. Todavía no implementes el CMS.
