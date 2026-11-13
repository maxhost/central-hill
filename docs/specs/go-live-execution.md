# Ejecución de salida a producción — 2026-11-12/13

Plan: [go-live-plan.md](go-live-plan.md). El usuario autoriza ejecutar la salida
(«ok, vamos a live»), incluidas las migraciones remotas y el push de `main`.
Confirma además 3 MiB por archivo y 3 MiB acumulados por envío, y operación temporal
sin correo con revisión de solicitudes en Admin → Leads. No configurar Resend ni
enviar correo real durante esta salida.

## Base y contratos de implementación

- Base de producto: `2ecdd87d307a01474da5f4b17ceba4ebb935ac24` en `main`.
  El plan y su handoff son cambios documentales locales aún sin commit al comenzar.
- Artefactos privados: `/private/tmp/central-hill-go-live/`.
- Antes de implementar: checkpoint emparejado nuevo de código, DB local y medios,
  con restauración verificada; además backup remoto verificado antes de DDL Neon.
- Orquestador: raíz; único escritor de esta spec, AGENTS, plan, integración y runner
  de migración/despliegue. Mantiene main3071 y media9081 sin reiniciar.
- Implementador A, worktree `/private/tmp/central-hill-go-live/writer-policy`, rama
  `go-live/attachment-policy`: escribe únicamente `src/slices/forms/file-policy.ts`,
  `src/slices/forms/server/attachments.ts`, `next.config.ts` y los cuatro
  `src/slices/forms/messages/{en,es,pt,fr}.json`.
- Implementador B, worktree `/private/tmp/central-hill-go-live/writer-tests`, rama
  `go-live/attachment-tests`: escribe únicamente
  `src/slices/forms/tests/attachments.test.ts`,
  `src/slices/forms/tests/runtime-date-file.test.tsx`,
  `src/slices/forms/README.md` y `docs/decisions/0086-production-attachment-budget.md`.
- Ambos parten de la misma base, con worktrees separados y sin credenciales de
  producción. A y B hacen commits propios; solo raíz integra. B verifica de nuevo
  contra el resultado integrado, no declara tests nuevos pasados con política vieja.
- Contrato: `MAX_FILE_BYTES = MAX_TOTAL_FILE_BYTES = 3 * 1024 * 1024`, una subida
  por campo, agregado entre todos los pasos/campos; conservar MIME/bytes/atomicidad,
  sin persistencia nueva ni correo. Etiquetas EN/ES/PT/FR coherentes en MiB.
  Mantener un presupuesto de petición Next de 4 MB como guardia adicional dejando
  margen multipart bajo Vercel 4,5 MB; no convertirlo en límite de media CMS sin
  revisar su flujo. Si esto interfiere con uploads, informar antes de integrar.
- Criterios: archivo exacto 3 MiB aceptado, +1 byte rechazado; varios archivos
  sumando 3 MiB aceptados, agregado +1 rechazado sin salida parcial; runtime y
  mensajes mantienen límites coherentes. Transporte multipart válido bajo el techo
  de plataforma para el caso permitido. Captura sin proveedor sigue disponible.
- QA independiente revisa el candidato integrado y ejecuta checks focales; checks
  DB/browser usan solo `goliveqa20261113` y fixtures propias. No writes en contenido
  main ni producción para QA. Registro posterior incluirá SHA exacto y evidencias.
- Verificación raíz: Node22/pnpm, typecheck, lint, db:check, tests tsx focales,
  build aislado y smoke de producción. No contar scripts placeholder como tests.

## Estado

En curso: accesos/configuración, checkpoint y respaldo. No se han ejecutado DDL
remoto, push ni despliegue al crear este registro. Registrar aquí resultados reales,
desviaciones y estado de rollback durante la ejecución.
