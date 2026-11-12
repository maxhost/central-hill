# Contacto configurable del encabezado — ejecución local

2026-11-12. [Plan](header-contact-assignment-plan.md),
[QA independiente](header-contact-assignment-qa.md), ADR0080.
**Integración funcional local aprobada. Resend real pendiente.**

## Resultado

Settings → Header contact form selecciona una definición de Forms para los dos
contactos del encabezado, escritorio y drawer móvil. La selección es global; los
textos siguen EN/ES/PT/FR y el fallback aprobado de Forms. El Save de Settings
activa la selección; los futuros Saves/Approve del formulario actualizan el popup.
Sin selección se mantiene el contacto anterior. Los otros contactos/formularios
de las páginas conservan sus integraciones.

El runtime comparte filas/columnas/pasos y los nueve tipos sin importar controles
del BO. Date/File permanecen montados al cambiar de paso. La acción pública valida
la asignación/revisión vigente, campos y adjuntos; captura un contacto en Leads
con etiquetas históricas y envía por core/email al destinatario configurado.
Los tests privados siguen separados en form_test_submission.

## Checkpoint y conservación

Antes de cambios de producto se creó el tag local
`restore/header-contact-2026-11-12-1794491175278` sobre `34ada31`.
Directorio privado: `/private/tmp/central-hill-header-contact/checkpoint/`.

- Dump completo consistente de48tablas incluyendo auth/ledger y1509filas totales.
  Dos restauraciones aisladas coinciden en esquema lógico, constraints, ledger y
  huellas de todas las tablas. Se normalizaron posiciones físicas de columnas
  eliminadas para comparar el orden lógico que conserva pg_dump.
- Los1303archivos del archivo Git extraído coinciden con los objetos del commit.
  Se conservaron cambios/archivos locales, plan previo, logo y symlinks. Los183medios
  locales mantienen sus SHA256. Env/auth/dump privados, sin credenciales en Git.
- Base de restauración `headercontactrestore20261112`, sin usos de QA. Base de QA
  `headercontactqa20261112`; primera inserción de Settings se comprobó además en
  `headercontactunitqa20261112`, solo esquema y fixtures propias.
- `RESTORE.md` contiene el procedimiento para conmutar código y DB juntos, con un
  guard específico de la DB restaurada, conservando primero los cambios recientes.
- Justo antes de migrar main se creó `pre-main-migration.dump` adicional y se
  archivó su `.next` en `checkpoint/main-before-integration.next`. Env principal
  original y medios se conservaron. No reset duro ni eliminación de bases.

## Implementación y revisión

Dos implementadores aislados a partir del contrato fbdc5b9:
UI2bd34fa y captura ded1e26, integrados en d861bc8/8884bac. Root añadió serialización,
lectores, caché y contratos explícitos. Producto aprobado: **68a6171**.
Worktrees y ramas quedan retenidos bajo `/private/tmp/central-hill-header-contact-*`.

Neon HTTP no ofrece transacciones interactivas. El core ejecuta un batch READ
COMMITTED: advisory lock en un statement y mutación en el siguiente. Las guardas
de asignación, revisiones y archivado/captura comparten esa serialización. Captura
y campos son atómicos; un único ganador por clave notifica. El payload hash incluye
bytes verificados de adjuntos, nunca base64 persistido.

El build inicial detectó un helper server-only exportado por un barrel consumido
en cliente. Se corrigió separando server-contract.ts en Forms/Settings/Leads y
documentando esos contratos, más schema-contract.ts, en ADR0080. No se desactivaron
las comprobaciones de servidor/cliente.

## Verificación

-143casos de dominio/UI:132nativos y11de lectores puros existentes de Settings
  ejecutados con sus dependencias de escritura/UI aisladas en VM. Los primeros
  intentos nativos de esos dos archivos no cargaban server-only/PNG fuera de Next;
  no se alteraron sus assertions ni el producto para forzar el resultado.
-4pruebas DB reales de captura/rate, con claves propias y limpieza acotada:
  ganador concurrente único, conflicto/stale/consentimiento, rollback integral
  ante fallo de un campo y límites compartidos con reintentos.
-3casos de primer Save real en PostgreSQL: null, selección válida y dos lecturas
  vacías concurrentes → un solo singleton. Auth/revalidación/IO secundarios aislados;
  Drizzle, executeSerialized y la mutación fueron reales. Dataset propio vacío al final.
- Core real con snapshot fresco tras esperar el lock y ocho writers concurrentes.
- Typecheck0, lint0 con7warnings anteriores, detector UI sin findings,
  db:check31migraciones con el warning histórico0008.
- Build Turbopack0,215rutas estáticas y2workers. Se limitó solo el proceso de build
  a dos páginas y cuatro consultas concurrentes por worker para no agotar conexiones
  locales con el catálogo copiado. Un único preload conserva la guarda de QA al
  crear workers de Next. No hay cambios de configuración de producto por este ajuste.
- QA independiente:27comprobaciones/3grupos/15capturas, cero errores de página/BO,
  sin defectos abiertos ni cambios de producto posteriores al candidato aprobado.
  A/B se crearon en UI; tipos/estructura/textos extra de A se sembraron solo en esa
  nueva fixture. El informe distingue seed, UI, source y DB; no inventa cobertura.

Artefactos y logs, incluidos intentos fallidos, bajo
`/private/tmp/central-hill-header-contact/`. QA conserva sus fixtures únicamente en
su base. Las36tablas ajenas y filas originales de las cuatro tablas Forms/Leads
mantienen sus huellas al excluir las fixtures propias; Settings/traducciones/rate
fueron datos autorizados del dataset de QA, no del usuario.

## Entrega y límite de correo

Main avanzó por fast-forward34ada31→68a6171 después de QA. La migración
0030_header_contact_form añade selección nullable/FK, snapshot/clave de lead y
contadores rate. Se aplicó únicamente en bases locales; ledger31. Los47hashes de
tablas previas al ALTER de main son exactos al excluir los nuevos atributos nullable.
No se sembró una selección ni formularios/leads de QA en la DB del usuario.

El localhost principal se relanzó en3071 con su preload obligatorio para
neoncontentlocal20261111 y su env original. La apertura final es de solo lectura,
sin Save, uploads, envío de formulario, reseed o nueva matriz pública.

**Resend aún no está configurado.** El adaptador y el transporte simulado se
comprobaron; localhost sigue EMAIL_PROVIDERconsole. La captura funcional y el log
no prueban recepción de email ni adjuntos. Lote7 requiere configuración privada
de RESEND_API_KEY/EMAIL_FROM/EMAIL_PROVIDER y prueba real controlada autorizada.
Los bytes de adjuntos no se conservan para reintentar un email fallido.

Sin migraciones Neon remotas, R2 writes, push o despliegue. Se conservan todas las
bases, envs, cachés, worktrees, artefactos, logos y symlinks preexistentes.

## Apertura final y estado actual

Main dev3071PID2270/parent2264/session81406, cwd workspace verificado, preload
original obligatorio conservado. Medios9081PID13693 sigue activo. QA3082PID1318
se detuvo tras aprobación; todas sus bases, fixtures y artefactos permanecen.

QA independiente aprobó la apertura de main: Settings200/nueva sección con selección
por defecto actual, Forms200, contacto EN/PT200 con fallback anterior y0pageerrors.
Solo login local normal; sin Save, Create, Publish, upload o submit. Evidencia
main-open.json y capturas en el directorio de la tarea. La conservación final en
main-conservation.json confirma42tablas/1473filas de negocio previas exactas,
ledger31, rate0 y selecciónNULL. Auth de login normal se excluye explícitamente.
