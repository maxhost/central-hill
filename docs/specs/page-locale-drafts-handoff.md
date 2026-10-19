# Home drafts por idioma — handoff de implementación

Código actual63a628a incluye corrección de foco del shell; verificación focal de raíz:
escritura continua EN/ES desktop/mobile, selección preview, typecheck/lint/3tests/build0.
QA independiente original b4bb282; seguimiento documentado en QA.
Preview3067 actual PID5230/session43430.

2026-10-18. Usuario autorizó implementación desde e06272b y reiteró QA/DB local automático.
Código b4bb282 aprobado por QA independiente (informe fd7892c), rama page-drafts/integration, checkout
/private/tmp/central-hill-page-drafts-integration. Entrega local detallada en
[page-locale-drafts-delivery.md](page-locale-drafts-delivery.md).

## Completado

Guardar borrador y Publicar actúan sólo sobre EN/ES/PT/FR seleccionado. JSON completo,
revisión persistente, publicación atómica y limpieza sólo del draft propio. Preview privada
saved draft→published; web/SEO published con ISR por idioma. Estado local de otras pestañas
conservado, campos SEO visibles con EN vacío. Sin aprobar/revisar/stale para Home.
Bootstrap preserva versiones públicas legacy y textos pendientes como drafts. Mutaciones
Home/Translation legacy bloqueadas; Home review redirige y sale del inbox genérico.

## Evidencia y entorno

Leer spec, plan y ADR0040; [QA](page-locale-drafts-qa.md) independiente completa evidencia.
Typecheck/lint/nueve tests focales/build/db:check pasan en b4bb282. No batería149 ni
matrices de idiomas. Un pase browser EN/ES desktop/mobile; cierre de evidencia en QA.
Preview http://127.0.0.1:3067/admin/pages/home; synthetic pagedraftsqa DB5618/proxy4518,
storage9067, correo consola. Staff pagedraftsqa@example.test / test1234.
Migrations0000..0023 aplicadas sólo en esta DB local nueva; ninguna en producción.
Logs/env/harness/screenshots en /private/tmp/central-hill-page-drafts-qa.
Server raíz PID92677/session3471, storage PID90200/session59103.

## Preservación y siguiente tarea

Home3065 permanece activo y su checkout home-contextual/integration sigue limpio en e06272b.
Worktrees backend/editor retenidos; commits7c7fed8,4757ec4/bc44d6b integrados localmente.
Sin merge a main, push, GitHub, despliegue, Neon producción ni emails reales.
Owners no se inició. Depende de esta base y del catálogo Forms público real.
Los page adapters futuros consumen contratos ya estabilizados; no lanzar nueva fase
sin una solicitud de implementación. Ver page-editors-parallel-plan.md.
