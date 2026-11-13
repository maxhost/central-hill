# Plan de salida a producción — 2026-11-12

Estado: **plan preparado; publicación y migraciones remotas sin ejecutar**.
La petición actual es preparar la salida. Esta revisión hizo consultas de solo
lectura a GitHub, Neon y la base local; no cambió código de producto, datos,
variables del hosting ni servicios externos.

## Estado comprobado

| Elemento | Resultado |
| --- | --- |
| Repositorio | `maxhost/central-hill`, público, rama principal `main` |
| `main` remoto, consultado en GitHub | `f947c4f1eb756d8ac96126abde95aba3681c6d47` |
| `main` local al preparar el plan | `2ecdd87d307a01474da5f4b17ceba4ebb935ac24` |
| Diferencia | 82 commits locales por publicar; 0 exclusivos del remoto |
| Hosting observado | El último commit remoto tiene estado Vercel satisfactorio |
| Neon comprobado | Endpoint `ep-polished-boat-aixkv1v4-pooler.c-4.us-east-1.aws.neon.tech`, `neondb` / `neondb_owner` |
| Migraciones remotas | 30: `0000`–`0029`, hashes y timestamps exactos respecto al repositorio |
| Migraciones locales | 32: faltan en Neon `0030_header_contact_form` y `0031_settings_owners_email` |
| Objetos pendientes | Las cuatro columnas nuevas y `form_public_rate_limit` todavía no existen en Neon |
| Contenido | 42 tablas de negocio / 1.473 filas: conteos y huellas coinciden local↔Neon al excluir solamente las cuatro columnas nuevas |

La consulta remota se ejecutó en una transacción `READ ONLY`, `REPEATABLE READ`,
el 2026-11-13 a las 03:18 UTC (2026-11-12 local). La comparación excluye las tablas
de autenticación. No demuestra que usuarios o sesiones sean iguales ni requiere
que lo sean. Tampoco reemplaza una nueva comprobación inmediatamente antes de salir.

Las identidades de proyecto/rama registradas anteriormente son `central-hill` /
`weathered-cake-89640915`, `main` / `br-little-heart-aihh9v63`. Confirmarlas otra vez
en la consola/API de Neon antes de cualquier escritura: esta sesión verificó el
endpoint y la base, pero no volvió a consultar esos identificadores en su API.

**No hace falta importar el contenido local según esta comparación.** Las nuevas
asignaciones de Forms son capacidades del código; publicar no crea formularios ni
elige asignaciones automáticamente. No restaurar la base local sobre producción.

El alcance incluye los 82 commits completos: editores y traducciones, Forms y sus
cinco ubicaciones, contactos, footer y botón de volver arriba. No es una publicación
limitada al último cambio de Owners email. Los únicos cambios de migraciones desde
el remoto son los SQL `0030`, `0031`, sus snapshots y el journal.

## Decisiones y comprobaciones previas

1. **Vercel y dominio.** Confirmar proyecto conectado, rama de producción, despliegue
   activo y dominios reales. `central-hill-umber.vercel.app` es la URL histórica;
   `centralhill.pt` aparece como origen predeterminado en código, pero esta revisión
   no confirmó el dominio final ni su DNS. Registrar el deployment ID activo para
   rollback. Hay configuración de Netlify en el repositorio, pero el estado remoto
   observado corresponde a Vercel.
2. **Adjuntos.** El contrato actual acepta 5 MiB por archivo y 20 MiB acumulados,
   enviados dentro de una petición al servidor. Vercel limita el cuerpo a 4,5 MB:
   el `bodySizeLimit: "21mb"` de Next.js no elimina ese límite. Antes de ofrecer
   adjuntos en producción, elegir y verificar una solución: reducir límites
   individuales y acumulados con margen para multipart y actualizar validación/UI,
   o diseñar un transporte alternativo que conserve validación, privacidad y
   limpieza de archivos. No introducir almacenamiento público ni persistencia de
   adjuntos como consecuencia implícita de este plan. Si se conserva el contrato
   5/20 MiB, esta incompatibilidad bloquea la salida completa en Vercel.
   [Límite oficial de funciones](https://vercel.com/docs/functions/limitations).
3. **Correo.** Resend no está configurado en el entorno local y no hay prueba de
   recepción real. Inspeccionar la configuración efectiva de Production. Con
   `EMAIL_PROVIDER` ausente el código de producción usa `disabled`, por lo que
   capturar un lead no prueba que se haya notificado. Preparar remitente verificado,
   credencial privada y destinatarios; probar recepción y adjunto en una bandeja
   acordada. Si se aplaza, documentar expresamente operación sin notificaciones y
   responsable de revisar Leads; no declarar listo el circuito de correo.
4. **Accesos.** Hay conexión autenticada a GitHub para esta inspección. Antes del
   push comprobar también el transporte Git autorizado. Revocar el token compartido
   en el chat; no utilizarlo ni almacenarlo. Las conexiones de consola de Neon y
   Vercel siguen pendientes en esta sesión: se pueden instalar/conectar sus plugins
   o usar acceso privado existente. No enviar claves por el chat.

## Orden de ejecución propuesto

### 1. Fijar la versión y revisar la configuración

- Registrar SHA final de release; si se corrigen adjuntos u otro bloqueo, usar ese
  nuevo SHA y sus verificaciones. Releer el remoto y comprobar que sigue siendo
  ancestro. Si cambió, integrar y revisar antes de publicar; no forzar la rama.
- Revisar el diff y secretos en archivos e historial que se van a publicar, porque
  el repositorio es público. El barrido limitado de 259 archivos modificados al
  HEAD actual detectó únicamente una URL ficticia de test en `unreachable.invalid`;
  no es una auditoría completa del historial ni de todos los tipos de credenciales.
- No añadir los tres archivos/links preexistentes sin seguimiento: PNG de `logos/`,
  `public/neoncontentlocal` y `public/propertylocalesqa`. Excluir `.env*` privados,
  dumps, preloads, bases, cachés y artefactos privados.
- Inspeccionar variables de **Production y Preview por separado**, sin registrar
  valores secretos. Cambiarlas antes del build correspondiente: Vercel aplica las
  variables a nuevos despliegues. [Ámbitos de variables](https://vercel.com/docs/environment-variables).

| Configuración | Validación requerida |
| --- | --- |
| `DATABASE_URL` | Production apunta a la base Neon confirmada; Preview a una base/rama aislada |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Secreto estable de producción, origen HTTPS correcto y login real; no copiar auth local |
| `SITE_URL`, `NEXT_PUBLIC_SITE_URL` si se usa | Dominio canónico, enlaces, sitemap y hreflang correctos |
| Variables `R2_*` | Bucket/endpoint EU y claves reales correctos; URL pública disponible durante el build |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM` | Configuración privada coherente con la decisión sobre correo |
| `LEAD_NOTIFY_TO` y destinatario de cada Form | Bandejas reales acordadas; destinatario Forms y contactos visibles del footer son independientes |
| Runtime y build | Node 22, pnpm 10.8, lockfile congelado, `pnpm build` |

No trasladar `NODE_OPTIONS` con el preload local, hosts localhost, credenciales
sintéticas ni URLs `public/neoncontentlocal` al hosting. La copia privada de un
antiguo `.env` permitió consultar Neon, pero **no prueba** las variables actuales
del despliegue.

### 2. Ensayar migraciones y release en un entorno aislado

- Crear una rama/base de ensayo a partir de una instantánea reciente de producción;
  registrar identidad y endpoint propios. No usar producción como dataset de QA.
  [Ramas de Neon](https://neon.com/docs/introduction/branching).
- Ensayar exactamente `0030` y `0031`, con las mismas guardas y verificación de
  conservación que se usarán en producción. No ejecutar `db:push`, seeds ni
  reparaciones automáticas del ledger.
- Preparar Preview con esa base, correo de prueba controlado y almacenamiento
  separado para uploads. Los activos existentes pueden leerse sin alterarlos.
  Los envíos, pruebas y fixtures deben pertenecer exclusivamente a este entorno.
- Una rama Git de release puede generar el Preview una vez configurado su entorno;
  su push forma parte de la ejecución posterior. No empujar `main` para ensayar.
- Sobre el SHA candidato, Node 22: `pnpm install --frozen-lockfile`,
  `pnpm typecheck`, `pnpm lint`, `pnpm db:check` y `pnpm build`.
  Ejecutar tests reales afectados con `pnpm exec tsx --test <archivos explícitos>`:
  adjuntos/runtime, placements/captura/replay/cuotas, Settings/Owners email y footer;
  pruebas de DB solamente contra la base propia y sus guardas.
  `pnpm test` y `pnpm boundary:check` son placeholders; no cuentan como validación.
- QA de la release integrada: navegación y páginas representativas EN/ES/PT/FR,
  login, Save/reload/Publish y preview privado, footer desktop/móvil y volver arriba
  sin mover el iframe. Probar Forms en Header/About/Guest/Real Estate/Service,
  fallback legacy, routing Service enquiry/external/none y una captura idempotente.
  Verificar el límite real elegido para archivos, imagen optimizada, vídeo y una
  subida propia que ejercite `sharp`/R2 en Linux. Si se habilita Resend, verificar
  recepción real, Reply-To y adjunto. Registrar casos, SHA y deployment ID.
- Hacer QA sobre el resultado integrado con la independencia prevista en AGENTS
  si hay implementación adicional. No reabrir matrices históricas sin relación;
  repetir únicamente lo afectado por correcciones.

### 3. Preparar un punto de restauración de producción

- Antes de DDL, guardar código desplegado, SHA candidato, configuración identificada
  sin secretos, ledger y backup consistente completo de Neon, incluidos auth y
  constraints, en almacenamiento privado. Verificar restauración en otra base.
  [Backup con pg_dump](https://neon.com/docs/manage/backup-pg-dump).
- Confirmar ventana real de recuperación y registrar timestamp/LSN o snapshot
  utilizable. No asumir una retención fija: depende de la configuración/plan.
  [Ventana de recuperación](https://neon.com/docs/postgres/backup-restore/history-window).
- Acordar una breve ventana sin cambios editoriales durante la captura/migración.
  Conservar envíos públicos legítimos; registrar su concurrencia para distinguir
  actividad normal de una alteración causada por la migración.

### 4. Aplicar primero las dos migraciones en Neon

La versión antigua puede seguir funcionando con estas adiciones. El nuevo código
necesita las columnas; por eso la migración va **antes del push de `main`** que
pueda activar producción.

| Migración | Efecto |
| --- | --- |
| `0030_header_contact_form` | Tabla de cuotas públicas; `lead.form_snapshot`, `lead.submission_key`, unique de submission key y FK nullable `company_settings.header_contact_form_id` |
| `0031_settings_owners_email` | `company_settings.owners_email`, nullable con default `partners@centralhill.pt` |

Antes de abrir la transacción de escritura, verificar proyecto/rama/DB/rol,
ledger exacto `0000`–`0029` y ausencia de objetos pendientes. Revalidar dentro de
una ejecución serializada. Ejecutar los SQL existentes sin cambios en orden,
junto con sus dos registros Drizzle, en una transacción con advisory lock,
`lock_timeout` breve (por ejemplo 5 s) y `statement_timeout` acotado (por ejemplo
60 s). Cualquier discrepancia o fallo cancela la transacción; no continuar al push.
El runner concreto se prepara y revisa durante la ejecución; no existe todavía
un runner de escritura creado por esta revisión.

Identidades esperadas del journal:

| Migración | SHA-256 SQL | `created_at` |
| --- | --- | --- |
| `0030` | `3416ee1fce4e366574075325147b7f4b42e9378959b2f1c9fe293dfc782a27e3` | `1794491522828` |
| `0031` | `deca1f97d4f4dc5c2b2f3e5020386fc2a6d89a58285eaa2f148490da351f1b5e` | `1794532141029` |

Postflight: 32 entradas exactas, columnas/tipos/default/FK/unique correctos, tabla
de cuotas vacía antes del nuevo tráfico y filas antiguas conservadas al excluir
solamente los nuevos atributos. Comparar snapshots coherentes; explicar cambios
de leads legítimos concurrentes, sin borrarlos para hacer coincidir huellas.
No reejecutar `0000`–`0029`, importar fixtures ni sustituir auth por usuarios locales.

### 5. Publicar el SHA verificado en GitHub y Vercel

- Refrescar el remoto, comprobar SHA aprobado en `main` y ausencia de cambios
  inesperados. Empujar únicamente `main:main`, sin `--force`, `--all` ni todos los
  tags; los checkpoints privados siguen locales.
- Antes del push, haber confirmado si `main` dispara producción automáticamente:
  ese es el comportamiento habitual de la integración Git de Vercel, y el push
  podría publicar inmediatamente. [Integración Git](https://vercel.com/docs/git).
- Verificar que el deployment usa exactamente el SHA aprobado y variables de
  Production, completa build y asigna el dominio correcto. Conservar logs e ID.
  Si se prepara un despliegue de Production sin asignar dominios, promoverlo solo
  tras su revisión. Un Preview puede requerir reconstrucción para Production;
  no asumir que lleva las variables productivas.
  [Promoción de despliegues](https://vercel.com/docs/deployments/promoting-a-deployment).

### 6. Verificar producción y observar

- Abrir en modo lectura páginas públicas EN/ES/PT/FR, footer Guests/Owners y
  `mailto:partners@centralhill.pt`, login/admin, imágenes/vídeo, navegación,
  canonical/hreflang/sitemap y ausencia de errores de servidor/hidratación.
- Probar una captura real controlada solo con datos y destinatario acordados;
  identificarla como prueba y registrar el lead. Comprobar recepción si se anunció
  correo operativo. Un resultado aceptado por el proveedor no demuestra recepción.
- No guardar ni publicar contenido existente para hacer smoke tests. Las pruebas
  funcionales con fixtures ya se hicieron en Preview; cualquier prueba productiva
  con escritura debe tener alcance definido, no una matriz automática sobre datos
  de usuario.
- Revisar logs del deployment, errores HTTP/413/500, captura, correo e imágenes al
  salir; repetir observación durante la primera hora y al día siguiente. Registrar
  responsable, resultado y cualquier incidencia antes de cerrar la salida.

## Rollback

- Si falla la migración, rollback de la transacción y conservar la versión activa;
  no publicar el código nuevo.
- Si el esquema queda correcto y falla código/build/comportamiento, devolver el
  dominio al deployment anterior compatible y conservar las adiciones de esquema.
  No borrar las columnas, la tabla ni las dos entradas del ledger para revertir UI.
- Restaurar toda la base es último recurso: preservar primero los datos posteriores,
  evaluar leads y cambios legítimos desde el backup y decidir su recuperación.
  No ejecutar una restauración que los descarte automáticamente.
- Corregir hacia delante y volver a verificar el cambio afectado. Una nueva versión
  o nuevos cambios de esquema requieren actualizar este plan y sus evidencias.

## Evidencia y pendientes

Reportes privados en `/private/tmp/central-hill-go-live/`:
`neon-readonly.json`, `local-readonly.json`, `content-comparison.json` y
`credential-pattern-audit.json`. No contienen dumps de filas en los reportes de
comparación y no se añaden al repositorio. Los scripts leen credenciales privadas
existentes y no imprimen sus valores.

Pendientes antes de ejecutar: resolver política de adjuntos, decisión/configuración
de correo, confirmar dominio y configuración real de Vercel, ensayo y backup de
producción verificado. No se ejecutaron nuevos builds ni QA de aplicación durante
esta revisión documental; las evidencias previas siguen en las specs de cada cambio.
No hubo push, deploy, migración remota, envío de correo ni escritura R2 en este turno.
