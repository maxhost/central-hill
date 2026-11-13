# Volver arriba en los editores del admin

2026-11-12. Solicitud implementada localmente sobre base3e74ca0. Cambio simple a
cargo del agente principal, conforme al Working agreement; sin delegación.

El contenedor común AdminWorkspace incorpora un botón circular con arrow-up de
UiIcon, fijo abajo a la derecha. Aparece al superar64px de scroll de la página
o del inspector de campos marcado explícitamente. Devuelve ambas superficies al
inicio sin tocar el iframe del preview ni emitir mensajes de selección. Smooth
normal e instant con movimiento reducido, nombre accesible y título localizados
EN/ES/PT/FR, target48px y foco visible. Padding inferior y posición de toasts dejan
espacio. Se monta en todo panel autenticado, incluidas altas/ediciones/listados y
Settings; login y previews independientes quedan fuera del contenedor.

Write set: Backoffice admin-scroll-to-top.tsx nuevo, admin-workspace.tsx,
page-editor-shell.tsx (marca del inspector), toast.tsx (espacio inferior),
messages4/locales, README Backoffice, este spec y nota AGENTS. Sin contratos de
persistencia, kernel, schema, DB/content/media writes ni cambios de preview.

Verificación: pnpm typecheck0; pnpm lint0 con7warnings anteriores; detectorUI[];
build completo0 con Node22 en copia aislada,217rutas estáticas/2workers, compile13.9s,
TypeScript y generación estática2.5s. Env/preload exclusivo de la base QA existente
serviceenquiryqa20261112; caché y dependencias copiadas por clonefile del build previo,
sin tocar caché/runtime de main. Ningún nuevo dataset ni fixture.

Browser de solo lectura en main3071:11comprobaciones,0pageerrors/0requests bloqueadas.
Home escritorio: scroll solo dentro del preview no muestra el control; scroll del
inspector y scroll de documento activan el botón y vuelven a0, manteniendo exacto el
scroll del iframe. Activación por Enter. Services/new, Posts/new, Guides/new,
Settings, Forms/editor y Buildings/new vuelven a0; FAQ/new y Apartments/new eran
superficies cortas sin scroll suficiente y mantienen el control oculto. Home móvil
390px, Enter y movimiento reducido pasan, sin overflow. Una tanda visual desktop/
móvil revisada, sin corrección de producto.

El primer intento de browser asumía que la selección inicial del preview no había
desplazado la página. Se estabilizó ese estado y se colocó la página en0 antes del
caso de aislamiento. Solo cambió el harness; producto intacto. No se escribieron
tests unitarios que dupliquen esta interacción simple.

Artefactos privados: /private/tmp/central-hill-admin-scroll-top (browser.json,
capturas, logs, copia de build). Main3071 y media9081 retenidos, con env/preload
originales; únicamente login local normal, navegación y scroll. No Save/Publish,
upload, envío de formularios, configuración externa, push/deploy o limpieza.
