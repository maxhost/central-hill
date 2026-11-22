# Handoff — nueva ventana para baseline quality

Este handoff prepara trabajo futuro; todavía no hay correcciones de los 17 hallazgos.

El usuario autorizó el merge local del feedback: main ya está en `80bd3f376ffb4a479cdee3e8bc5c083452afd4cc`, exactamente el candidato aprobado. No hubo push/deploy ni escrituras de datos. La nueva tarea está documentada en `docs/specs/baseline-quality-cleanup-plan.md`, rama `plan/baseline-quality-cleanup-2026-11-22`, worktree `/private/tmp/central-hill-baseline-quality-plan`. Obtener su commit exacto con `git log -1` en ese worktree.

Instrucción para la ventana limpia:

> Ejecuta el plan `/private/tmp/central-hill-baseline-quality-plan/docs/specs/baseline-quality-cleanup-plan.md`, rama `plan/baseline-quality-cleanup-2026-11-22`, en el commit documental indicado en la entrega. Primero crea y verifica un punto de restauración NUEVO y pareado post-merge. Trabaja con dos implementadores, un QA independiente y tú como orquestador, con ramas/worktrees y DB/almacenamiento QA separados. Cierra los siete warnings, la advertencia histórica sin editar SQL aplicado y los nueve tests heredados, incluyendo controles negativos y regresiones acotadas del plan. Entrega el candidato validado. Sin merge a main, push ni deploy.

Leer AGENTS y el plan antes de usar entornos. El checkpoint previo de editor-feedback conserva código anterior931a y no sustituye al nuevo. No reutilizar sus fixtures ni limpiar artefactos. No ejecutar `pnpm test` como gate: es un placeholder. No reescribir la migración0008 ni su hash/ledger. No exponer legacy oculto para hacer pasar tests. Los hallazgos pueden ser expectativas desactualizadas o faltas reales de traducción; justificar cada cambio.

El plan asigna A a Pages/tests/labels y B a lint/checker histórico; QA no edita producto. No arrancar agentes ni implementar en esta ventana de planificación. Las credenciales permanecen privadas. La entrega de planificación sólo añade estos dos documentos en la rama separada; main permanece en el candidato de feedback.
