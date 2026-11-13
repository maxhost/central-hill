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

## Progreso verificado

- Checkpoint local `restore/go-live-2026-11-13-1794540578542`:49tablas/1524filas,
  ledger32,1385blobs y183medios exactos; dos restauraciones verificadas.
- Backup remoto privado completo:48tablas/1568filas, ledger30; dos restauraciones
  locales exactas de columnas/constraints/datos incluidas auth. `deployed-code.tar`
  empareja el dump con el código realmente publicado f947c4f1 (1242blobs verificados);
  el archivo `code.tar` separado conserva el estado local previo2ecdd87.
- Ensayo0030/31 en `goliveprodqa20261113`:ledger32,4columnas nullable,3constraints
  validadas,rate0;47tablas antiguas/1538filas exactas incluidas auth. Su base hermana
  `goliveprodrestore20261113` permanece intacta en ledger30.
- A f9104af y B ca44fbe integrados e120e8a/ffd2577; harness nuevo FormData corregido
  por B65f7b90 e integrado3d35204. Candidato de producto3d35204.
- Raíz51tests focales0fallos, typecheck0, lint0 (7warnings anteriores), db:check32
  (warning0008 anterior). Arranque inicial de db:check bloqueado por IPC sandbox;
  rerun autorizado pasa. Primer build bloqueado por symlink de node_modules fuera
  de raíz Turbopack; instalación propia offline/lockfile exacto completada. Build
  corregido en curso en worktree aislado, sin tocar caché/main3071.
- Barrido de559blobs de historial nuevo:0hallazgos en patrones de credenciales
  seleccionados; única URL sintética en test reconocida. No auditoría exhaustiva.
- Vercel confirmado:proyecto prj_XgbTMPavHqLQiYx6jC8XwpQKGXnu, equipo
  team_1g2bepRsIjW2NsHwFk8S7VT3, repo maxhost/central-hill, productionBranch main,
  dominio único verificado central-hill-umber.vercel.app. Rollback actual
  dpl_DHXcvKFfu3y12sFrQCtY8j8PnRyx. Node24→22 y EMAIL_PROVIDER=disabled para
  Production configurados según autorización; resto de variables preservado.
- La sesión Vercel existente se renovó con CLI local60.0.1 ya instalada/verificada.
  Auto-review rechazó npx latest y exportación masiva de secretos; alternativas
  seguras usadas:CLI preexistente y consulta de cinco variables concretas sin
  exportarlas. Vercel las marca sensibles/no legibles; no se copiaron credenciales.
  Solo metadatos/settings previos respaldados, sin afirmar backup de sus valores.
- CLI Neon local pertenece a otra organización/proyecto. No se creó rama ni cambió
  configuración Neon por esa CLI. La conexión SQL de producción original está
  verificada por endpoint/DB/rol y ledger/contenido exactos; ensayo y backup se
  hicieron por esa conexión y bases locales propias. No se afirma nueva verificación
  API de los IDs históricos de proyecto/rama ni disponibilidad de PITR.
- Preview usa build de producción local/DB propia:el entorno Preview remoto comparte
  actualmente DATABASE_URL de Production; no se harán fixtures ni QA con escritura
  contra él. Tras migrar, Vercel se comprobará en lectura con el SHA publicado.
- Inventario del backup productivo:1Form,0campos File,0asignaciones publicadas de
  Page/Service; Header no existía antes0030. No hay adjuntos configurados en Forms
  públicas activas. Con correo disabled los nuevos archivos futuros se validan y
  guardan solo como metadatos en Leads, sin bytes descargables; limitación informada.

## QA y migración productiva

- Build corregido0:219/219rutas, compile10.9s/TS11.2s/static6.7min,2workers; sin
  retries/errores. Warning metadataBase anterior conservado.
- QA independiente APRUEBA3d35204:17tests+13casos navegador,0pageerrors/defectos.
  Envíos reales3MiB individual(3146475bytes multipart) y dosarchivos(3146656bytes)
  aceptados, excesos cliente/servidor rechazados sin captura parcial;3leads propios
  con EMAIL_PROVIDERdisabled visibles en Leads.43tablas originales y ledger32
  exactos al excluir únicamente fixtures propias. Informe privado qa-independent.md.
- Main local integrado FFd69419e→3d35204 después de QA.
- Neon PRODUCCIÓN migrado0030+0031 en una sola transacción con guardas, el
  2026-11-13T03:55:37Z:ledger32 hashes/timestamps exactos,4columnas nullable,
  3constraints validadas,rate0,47tablas/1538filas antiguas exactas incluidas auth.
  Evidencia migration-production.json; backup intacto y no fixture productiva.
- Gitpush dry-run rechazado403:credencial local55mais sin permiso; selección
  maxhost no tiene credencial y SSH no dispone de identidad. Conector GitHub puede
  escribir archivos, pero no transferir historial local completo conservandoSHAs.
  Se pidió al usuario habilitar credencial Git correcta, sin pegar tokens en chat.
  No usar PAT expuesto, no squash/reconstrucción de historia ni cambios de permisos.
- Para completar live mientras se resuelve ese acceso, se prepara despliegue directo
  Vercel desde git archive3d35204,1388blobs exactos SHA256
  4f80ddab3e0a90147960c4eeeb6e76726a2df415f8b4d13a1eabf255c1b7f76e.
  Dryrun1387archivos/14341803bytes:sin .env.local,medioslocales,node_modules o caché.
  Production --skip-domain evita promover antes de revisar; las variables sensibles
  existentes siguen en Vercel y no forman parte del archivo subido.

## Resultado publicado

- Vercel construyó la copia verificada como
  `dpl_JCetLbnHeef4GFh4ewb4Aw8qNAui`, URL individual
  `central-hill-o3yl2sz43-maxhost27-6230s-projects.vercel.app`. Metadata releaseSha
  exacta3d35204 y SHA256 del archivo coincidente, Node22, targetProduction.
- Build real de Vercel0:215/215rutas productivas,1worker, compile36.2s/TS31.7s/
  static24.6s, total aproximado2min, sin override de configuración de producto.
  Las4rutas adicionales de QA local no existen en producción.
- Antes de promover:CLI oficial `vercel curl` verificó Home(430016bytes),
  About(300537bytes), redirección de Admin(114937bytes) e imagen optimizada
  (49946bytes), sin contenido local/media localhost. Vercelcurl generó su token
  gestionado de bypass para visualizar el despliegue protegido; ningún valor se
  imprimió ni se añadió al repositorio.
- Promoción completada; API del alias confirma que
  **https://central-hill-umber.vercel.app** apunta al deployment nuevo, comprobado
  2026-11-13T04:02:06Z. El deployment anterior queda disponible para rollback.
- Smoke productivo de solo lectura:12casos,0pageerrors,0respuestas5xx; Home en
  EN/ES/PT/FR, About/Guests/RealEstate/Services/Blog/Guides EN, footer móvilPT y
  redirección AdminSettings→/admin/login. FooterGuests/Owners en2columnasdesktop
  y apilado móvil, partnersmailto dentro deOwners solamente; capturas revisadas.
  No se probaron Save/Publish ni login con cuentas productivas; no hubo envíos o
  fixtures productivos. Pruebas funcionales con escritura quedaron en QA propia.
- Consulta Vercel de errores del deployment desde15min:0registros. Esto es una
  observación inicial, no una garantía futura. Monitorización de la primera hora
  y día siguiente queda como operación manual, sin automatización creada.
- Neon post-live READONLY RepeatableRead2026-11-13T04:03:54Z:ledger32 exacto,
  ninguna migración pendiente,42tablas/1473filas de negocio con huellas exactas
  respecto a la revisión previa al plan (solo se excluyen4atributos nuevos).
- Main3071 sigue en el workspace, PID61227/parent8550 por recarga automática de
  Next al cambiar configuración; no hubo restart manual. Media9081PID8524 retenido,
  .env.local/logo/bothpublicsymlinks exactos frente al checkpoint. Solo QA3088
  PID61007 se detuvo al terminar. Bases/restauraciones/worktrees/cachés retenidos.
- El canonical relativo `/en` ya existía en el deployment anterior y sigue igual;
  no se cambió dominio personalizado/DNS ni se declara ese trabajo resuelto.

## Trabajo pendiente y siguiente paso

**Sitio publicado y Neon migrado; push GitHub pendiente de autenticación.**
El remoto sigue en f947c4f1; los cambios están conservados en main local y en los
worktrees. No se forzó historia ni se usó el PAT expuesto. Cuando el usuario
configure una credencial Git con permiso, refrescar remoto y comprobar ascendencia,
revisar el SHA local final y ejecutar el push fast-forward de main solamente.
Vercel tiene producción conectada a main:ese push puede construir/promover otra
release con el mismo producto y documentación posterior; comprobar el resultado.
No repetir0030/31 ni trasladar contenido o fixtures QA.

Correo permanece **disabled** por decisión del usuario; revisar Admin→Leads.
Resend/remitente/recepción real y adjuntos descargables siguen pendientes. Al estar
deshabilitado, solo persiste metadato del archivo, no sus bytes. Actualmente no hay
Forms públicas activas con File. No se crean avisos de entrega que no ocurrieron.

Evidencia privada adicional:staged-deployment.json, deployment-latest.json,
staged-smoke.json, production-smoke.json y capturas, production-errors.jsonl,
neon-post-live.json, promote.log, release-source.json y los dos checkpoints.
