# Blog y topbar — integración selectiva en main

2026-11-06. Usuario autoriza merge local y aclara explícitamente: sólo Blog y
topbar; Edificios/Departamentos pendiente de su revisión, conservar fuera de main.
Main base48ae09c, sólo logo previo sin rastrear. Blog piloto aprobadoaf3a4a1;
fuente final29db0c5 en blog-form/integration contiene también Properties, por lo
que no se mergea esa rama entera. Checkout de preparación blog-main/integration
en /private/tmp/central-hill-blog-main-integration desdeaf3a4a1.

Root aplica delta sólo src/slices/blog,package/lockfile,clienteUIicon+generator;
messages sólo namespaceBlog y labels genéricos media/sidebar. Workspace mantiene
reglas anteriores de Buildings/Apartments; sólo quita modoPages de los posts y
cambia icono cliente. AdminShell queda igual a la base (sin importserver-only).
Sin src/slices/buildings/apartments, rutas de propiedades, namespacepropertyEditor,
guardas Translation de Properties, seed-demo ni migración0025. Blog0024 ya está
en el piloto heredado. Docs de Blog copiados como evidencia de sus ramas originales;
este registro distingue el alcance de main. No copiar secreto ni env remoto.

Verificación requerida por esta selección: equivalencia exacta de src/slices/blog
con29db0c5; ausencia de cambios de Properties frente48ae09c; typecheck/lint/focused
state+richtext e icons/build en entorno sintéticopropertylocalesqa ya autorizado,
lecturas sin Save/Publish. QA funcional original8064fab/report984e9a0 permanece
como evidencia de producto; root comprueba adaptación de ensamblaje.

Entrega final será fast-forward a main sólo tras checks, instalar deps segúnlock
y preservar logo/previews. No push/deploy, migraciones ni DBremota.3071 sigue
env remoto: no solicitar rutas/Save de prueba allí como parte de este merge.
Edificios/Departamentos permanece en3073 para revisión manual con propertyqa.
