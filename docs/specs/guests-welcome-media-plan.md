# Plan de encuadre de medios de Welcome en Guests

2026-11-21. Estado: planificación actualizada tras diagnóstico transversal y revisión
adversarial independiente. El usuario exige trabajar en una rama separada, disponer
de un punto de restauración verificado y superar E2E de todos los campos de subida
de imágenes de cada página antes de integrar a main. Esta actualización documenta
esas condiciones; no crea aún la rama, el respaldo ni ejecuta la implementación.

## Objetivo y alcance confirmado

Welcome debe conservar un recuadro horizontal 3:2 al sustituir su imagen por otra
imagen, vídeo o Lottie, tanto en preview como en la página pública. El archivo y la
longitud del texto no deben determinar la proporción del recuadro.

El único defecto confirmado de esta causa es Guests → Welcome. El original se
renderiza como imagen directa dentro de IntroSplit; el medio seleccionado pasa por
welcomeSideMedia y sideMedia, que añade aspect-ratio 4:5. El envoltorio conserva ese
ratio y aumenta la altura de la celda. object-fit cover recorta después los costados.

En Chromium aislado, la misma imagen 2250×1500 pasó de aproximadamente 536×380 a
536×670 px en escritorio, y de 334×280 a 334×417,5 px en móvil. La composición de
vídeo y canvas Lottie reprodujo geométricamente el problema; esa comprobación no
demuestra reproducción real de archivos ni carga del reproductor WASM.

## Diagnóstico de las otras páginas

El inventario abarcó las familias de rutas públicas. Se realizaron 136 mediciones
geométricas aisladas con los estilos compilados existentes, en anchos de 1440, 881,
880 y 390 px y texto controlado corto/largo. No equivale a una prueba funcional de
cada publicación real ni a un ciclo de subida, guardado y publicación.

| Página | Resultado y función en la validación futura |
| --- | --- |
| Guests | Corregir Welcome; preservar Hero, portfolio y teasers. |
| Home | Sin otro caso detectado; conservar el 4:5 de Guests pitch. |
| Owners | Sin otro caso detectado; conservar Services, Dashboard y CTA. |
| About | Story y Community usan AboutMedia sin el 4:5 heredado; Organisation mantiene 4:5 intencional. Controles de regresión. |
| Real Estate | Sin otro caso detectado; conservar Capabilities, Manage y los marcos de tarjetas. |
| Buildings y detalle | Sin esta causa; conservar calculadora 4:5, tarjetas 4:3 y comportamiento de galería. |
| Services y detalle | Sin esta causa; conservar los frames de ServicesMedia y galería adaptive. |
| Guides y detalle | Sin esta causa; conservar Hero, tarjetas, aside y galería adaptive. |
| Blog y artículo | Sin esta causa; conservar portada, tarjetas, imágenes del cuerpo y aside. |
| Privacy, Cookies y Complaints | No aplica al medio configurable de este reporte. |

La galería de Building detail calcula alturas a partir de las proporciones de las
fotografías por diseño. Ese comportamiento no se incluye como defecto de Welcome.
No existe una ruta pública independiente de Apartments; sus tarjetas usan frame 4:3.

El alcance de corrección confirmado es Welcome; el alcance E2E obligatorio es más
amplio e incluye todos los campos de subida de imágenes de las páginas. Si esas
pruebas descubren otro defecto, registrarlo con evidencia, actualizar el alcance y
corregirlo antes de declarar la matriz aprobada.

## Rama de trabajo y punto de restauración

Antes de modificar producto o preparar fixtures, registrar el SHA estable de main,
el estado de Git y los procesos existentes. Crear una referencia de restauración
restore/guests-welcome-media-<fecha> y trabajar en una rama independiente
fix/guests-welcome-media, preferentemente en un worktree separado. Si esos nombres
ya existen, usar nombres únicos sin sobrescribir referencias. Conservar cambios
locales y archivos no rastreados; no emplear reset, clean ni stash destructivo.

Crear un respaldo emparejado de código, base de datos y estado local: bundle o
archivo de código verificable, dump consistente completo, esquema, restricciones,
conteos y hashes de filas; env y configuración privada; logos, symlinks y medios
realmente disponibles con manifiesto de hashes. Secretos y respaldos se guardan
fuera de Git. Si faltan medios, registrar su ausencia sin afirmar que se respaldaron.

Verificar la recuperación del código y restaurar el dump en una base aislada,
comparando esquema, restricciones, conteos y hashes. Mantener esa restauración
intacta y usar otra base para QA. No iniciar implementación hasta completar esta
verificación y conservar sus resultados.

Documentar RESTORE.md en el directorio privado del checkpoint. La recuperación
debe preservar primero cualquier estado posterior y restaurar código y datos
emparejados en un checkout y una base nuevos. Nunca sobrescribir main o una base
con escrituras posteriores de forma automática. Volver al código estable no debe
eliminar publicaciones ni otros cambios legítimos posteriores al checkpoint.

## E2E de todas las subidas de imágenes

Construir antes de implementar un inventario verificable de cada campo de subida
de imágenes y sus destinos visuales. Cruzar schemas/descriptores de editor,
MediaField y controles equivalentes con renderizadores y rutas. Registrar página,
sección, ruta de campo, editor, preview disponible, destino público, contrato de
ratio por viewport y caso E2E. No dar cobertura por el solo hecho de que varios
campos utilicen el mismo componente.

Incluir Home, Guests, Owners, About, Real Estate, Buildings, Services, Guides y
Blog; sus detalles y galerías; Apartments aunque no tengan ruta pública propia;
campos de listas repetibles e imágenes de cuerpo cuando admitan subida. Incluir
imágenes compartidas de Settings, branding y entidades que se muestren en esas
páginas, siguiendo cada destino. Enumerar también imágenes OG y otros campos sin
recuadro visible: comprobar su subida y persistencia y el contrato de metadata
correspondiente. Marcar como no aplicable solo un campo o página que realmente no
admita imagen, con su motivo. Verificar el inventario contra el código final.

Implementar pruebas E2E reproducibles en navegador mediante los controles reales
de subida, guardado y publicación, exclusivamente en la aplicación y base QA con
almacenamiento de pruebas aislado. Para cada campo, cubrir selección local,
guardado, recarga y publicación y comprobar sus destinos públicos; ejercitar la
preview cuando exista. No sustituir ese ciclo por inyección de DOM, mocks de
subida exitosa o mediciones sobre HTML aislado.

Cada campo visible debe probar una imagen con el ratio recomendado y reemplazos
horizontal 3:2, vertical 2:3 y cuadrado 1:1. Añadir otros ratios que exija su contrato,
incluido 16:9. Usar archivos de dimensiones conocidas, con marcas en centro y
bordes para reconocer recorte y deformación. Para listas repetibles cubrir cada
campo y sus variantes de layout, incluida creación y sustitución de un elemento;
no basta una prueba global del uploader.

Comprobar dimensiones naturales y metadata conforme a la orientación visual del
archivo, carga/decodificación del medio efectivamente seleccionado, dimensiones
del recuadro, object-fit, centrado y ausencia de desbordes o deformación. Conservar
capturas y resultados de medición en escritorio y móvil. Un status 200 o una
miniatura visible en el selector no acredita el resultado de la página.

El criterio de ratio depende de cada destino: Welcome será 3:2 fijo; los marcos 4:5,
4:3 o 16:10 intencionales deben conservarlo al cambiar el archivo, con recorte cover
documentado. Los espacios de proporción intrínseca deben respetar el ratio del
archivo. No exigir que un marco fijo adopte cualquier ratio subido ni convertir
todos los encuadres existentes a 3:2. Una discrepancia entre hint, contrato y
resultado se registra y resuelve antes de aprobar ese campo.

Mantener una matriz con todos los campos y destinos: caso, fixture, resultado,
mediciones y evidencia. Un campo sin ejecutar, bloqueado o sin evidencia queda
pendiente; no se contabiliza como aprobado. Los campos compartidos pueden reutilizar
fixtures y helpers, pero cada destino debe tener una comprobación explícita.

## Arquitectura prevista

Separar la selección del tipo de medio de las reglas de encuadre:

1. Extraer un renderizador de contenido sin aspect-ratio propio, que reutilice
   MediaImage, LoopVideo y LottiePlayer según MIME, manteniendo el tratamiento de
   WebP animado sin optimización que pueda aplanarlo.
2. Conservar sideMedia como fachada compatible para sus consumidores 4:5 actuales.
   Mantener sus nodos raíz, clases y comportamiento observables; evitar un nuevo
   envoltorio global que altere selectores descendientes o dimensionamiento.
3. Añadir a IntroSplit un modo explícito de encuadre fijo. Su valor predeterminado
   conserva el comportamiento actual; solo Welcome activa 3:2.
4. En ese modo, retirar de la celda las reglas de estiramiento y mínimos 280/380 que
   impiden garantizar el ratio. La caja exterior se dimensiona por ancho, reserva
   espacio desde SSR y contiene el medio sin que este participe en su altura.
5. Aplicar el mismo encuadre al original de respaldo y al medio seleccionado.

El contenido puede llenar la caja mediante posicionamiento absoluto y dimensiones
explícitas dentro de un contenedor relativo. No depender de alturas porcentuales
contra ancestros cuya altura depende del contenido. Texto largo crece en su columna
sin estirar ni recortar la caja de medios.

El 3:2 exacto es una decisión visual respecto al diseño actual, que no lo fija:
en móvil un ancho de 334 px tendrá unos 223 px de altura, frente a los 280 actuales.

## Contrato por tipo de medio

| Tipo | Contrato |
| --- | --- |
| Imagen 3:2 | Llena el frame sin recorte por diferencia de ratio; sin deformación. |
| Imagen de otro ratio | Cover centrado dentro del 3:2, con recorte previsible. |
| Vídeo MP4 o WebM | Mismo frame antes de metadata, durante carga, reproducción y pausa; cover centrado, muted, loop y playsInline. |
| Lottie JSON o dotLottie | Wrapper y canvas llenan el frame; el reproductor conserva layout fit cover y alineación central. |

object-fit en el wrapper no gobierna el dibujo interno de Lottie. Un lienzo 3:2 se
ajusta sin recorte por ratio; uno vertical, cuadrado o 16:9 se recorta al centro.
No se promete mostrar todos sus elementos y llenar el frame sin bandas a la vez.
La transparencia de una animación debe mostrar la superficie de la sección, sin una
foto de respaldo visible detrás.

La selección local puede llegar como blob con dimensiones desconocidas. El frame
no puede depender de las dimensiones provisionales 1200×1500 que introduce la
preview. Usar una imagen directa para blobs cuando corresponda; conservar dimensiones
reales y optimización de imágenes guardadas. No modificar el pipeline de ingestión.

## Carga y fallos en Welcome

Reservar siempre la caja 3:2. Mientras carga o no existe JavaScript para Lottie,
mantener una superficie neutra. Para vídeo, permitir el fotograma que el navegador
pueda mostrar; no prometer un poster que no existe.

Ante un fallo confirmado del archivo o reproductor, mantener la superficie neutra
y mostrar un aviso accesible en la preview, sin exponer URLs ni detalles técnicos.
En público, degradar dentro del mismo marco sin controles inoperantes ni una foto
que aparente representar el archivo seleccionado. Conservar la imagen original de
respaldo para ausencia de medio, diferenciándola del error de un medio seleccionado.

En Lottie, contemplar importación, creación, loadError y renderError. La disponibilidad
del motor o el evento load no equivalen al primer render del canvas. No considerar
un screenshot de canvas vacío como reproducción correcta. Mantener la importación
dinámica para que una página sin Lottie no descargue el reproductor.

Un autoplay rechazado, waiting o buffering no es un fallo confirmado del archivo.
El frame debe seguir estable. No añadir timeouts que declaren roto un recurso lento.

Reiniciar estados al cambiar el medio; ignorar callbacks antiguos y destruir el
reproductor al desmontar. Si hacen falta callbacks en reproductores compartidos,
serán opcionales y no alterarán por defecto otros consumidores.

Conservar y verificar el comportamiento existente de movimiento reducido. Sus
limitaciones previas, incluida la falta de pausa nativa de WebP animado, no quedan
resueltas por este cambio geométrico. No ampliar a una refactorización global de
playback ni prometer cumplimiento adicional sin validación específica.

## Orden de implementación futura

1. Crear y verificar el punto de restauración; establecer rama/worktree separado y
   entorno QA con base y almacenamiento propios, preservando el entorno de autoría.
2. Completar el inventario de uploads y contratos y preparar los E2E de todas las
   páginas. Reproducir el defecto de Welcome en la base estable para que el caso
   correspondiente falle por el encuadre, antes de probar la corrección.
3. Implementar separación de renderizador y encuadre, modo explícito de IntroSplit
   y composición de Welcome; mantener compatibles los consumidores existentes.
4. Incorporar la gestión de carga, fallos y reemplazo limitada a Welcome.
5. Actualizar el hint de welcome.image_media_id en schemas/guest.ts y sus pruebas:
   3:2 estable también en móvil, cover centrado y zona segura para texto/logos de
   animaciones. Retirar la promesa anterior de altura móvil fija de 280 px. Respetar
   el mecanismo actual del hint, que está escrito en inglés.
6. Ejecutar la matriz E2E completa de uploads y la validación específica de vídeo y
   Lottie. Corregir los defectos detectados y repetir los casos afectados y sus
   dependencias; actualizar contrato y evidencia cuando cambie el alcance.
7. Completar las demás comprobaciones y revisar el candidato final. Integrar a main
   únicamente después de cumplir todas las condiciones de merge de este plan.

## Validación y aceptación

Medir el frame con tolerancia de redondeo de hasta 1 px respecto al 3:2, antes y
después de carga y al reemplazar el medio. Cubrir escritorio, móvil y 880/881 px,
texto corto/largo y EN/ES/PT/FR sin repetir un producto cartesiano innecesario.

| Grupo | Casos necesarios |
| --- | --- |
| Imagen | Original, 2250×1500, vertical, 16:9, dimensiones desconocidas y WebP animado preservado. |
| Vídeo real | MP4/WebM reproducibles; sin metadata inicial; pausa; autoplay bloqueado; descarga lenta y fallo real. |
| Lottie real | JSON y dotLottie; lienzos 3:2 y distintos; transparencia; primer render y avance de frames; errores de carga/renderizado. |
| Estados editoriales | Selección local blob, preview guardada y público publicado en entorno QA aislado. |
| Sustituciones | Imagen → vídeo → Lottie → imagen y sustitución entre dos archivos del mismo tipo; sin contenido anterior ni eventos tardíos. |
| Regresiones | About Story/Community, Home Guests pitch, Owners Services/Dashboard, Real Estate, Buildings y ServicesMedia; encuadres 4:5 y otros marcos preservados. |

Las pruebas deben comprobar reproducción efectiva de vídeo y Lottie, además de
geometría. Distinguir fallos de recurso, codec, CORS o WASM de defectos de encuadre;
el nuevo frame no corrige recursos externos inválidos. Comprobar movimiento reducido
según el contrato existente y documentar límites; no atribuir cobertura de Safari
real a una prueba exclusiva de Chromium.

Ejecutar typecheck, lint, pruebas focales de contrato con valor real y build aislado.
Revisar una tanda visual escritorio/móvil y confirmar correcciones solo si aparecen
defectos. Las mediciones aisladas previas no sustituyen la matriz E2E completa que
ha pedido el usuario. Repetir casos tras cambios o fallos y evitar repeticiones
adicionales cuando el candidato final ya esté validado.

## Condiciones para integrar a main

El trabajo permanece en la rama separada hasta que se cumplan todas estas condiciones:

1. El checkpoint está verificado y las instrucciones de restauración disponibles.
2. El E2E reproduce el defecto original de Welcome en la base estable y demuestra
   su corrección en el candidato, con imagen, vídeo y Lottie reales.
3. Todos los campos de imagen del inventario y sus destinos tienen E2E aprobados;
   no quedan casos bloqueados, omitidos o fallos de ratio, carga o persistencia.
4. Pasan typecheck, lint, pruebas pertinentes, build y revisión visual del candidato.
   Cualquier fallo previo ajeno queda identificado y contrastado con la base; no
   permite omitir los E2E de uploads exigidos.
5. Se verifica la conservación de datos ajenos a fixtures, del entorno de autoría y
   de los encuadres intencionales de otras secciones. No se integran credenciales,
   medios privados ni fixtures de contenido en main.
6. El código que se integra coincide con el candidato validado. Si main avanzó,
   integrar sus cambios en la rama de trabajo y validar el resultado antes del merge;
   no asumir que el resultado integrado conserva las comprobaciones anteriores.

Solo entonces realizar un merge local normal a main, sin force ni reescritura de
su historia. La instrucción del usuario condiciona ese merge a estas pruebas; no
autoriza un merge anticipado, push ni despliegue. Entregar SHA, matriz de cobertura,
evidencia y referencia al punto de restauración.

## Conservación y entrega

No requiere migración, cambios de contenido, nuevos campos de poster ni modificación
de MIME, permisos, Save/Publish o publicación por locale. No tocar DB/R2 de autoría
o producción, env, procesos existentes ni realizar push/deploy dentro de este plan.
Los fixtures de validación pertenecen al entorno aislado.

Referencias de código: guest-page.tsx, components/side-media.tsx,
components/about-media.tsx, components/loop-video.tsx, components/lottie-player.tsx,
core/ui/intro-split.tsx y pages/schemas/guest.ts.

Evidencia privada del diagnóstico: /private/tmp/central-hill-welcome-diagnosis y
/private/tmp/central-hill-media-pages-diagnosis. La revisión adversarial exige
resolver conjuntamente el ratio heredado, el estiramiento de IntroSplit y el
dimensionamiento interno del canvas; no convertir los 4:5 intencionales en 3:2.

## Registro de ejecución — 2026-11-21

Base estable ec7f610f2364683e445060c75374fe71f6bc499e. Rama de integración fix/guests-welcome-media, worktree /private/tmp/central-hill-guests-welcome/worktree. Restore restore/guests-welcome-media-2026-11-21; checkpoint privado /private/tmp/central-hill-guests-welcome/checkpoint/RESTORE.md.49 tablas1534filas, esquema/restricciones/hashes exactos en welcomerestore20261121 (intacto) y welcomeqa20261121 (QA).1416 archivos de código verificados. Medios locales actualmente vacíos. Main sin cambios; proceso media9081 conservado; proceso main3071 previamente registrado ya no aparece activo, no reiniciado.

Asignación disjunta conforme AGENTS.md:
- Implementador A: rama fix/guests-welcome-media-renderer, worktree ../media. Solo components/side-media.tsx, components/media-content.tsx, components/welcome-media.tsx, components/loop-video.tsx, components/lottie-player.tsx y pruebas nuevas de estos componentes. Contrato MediaContent elige tipo sin ratio propio; sideMedia conserva nodos raíz/clases4:5. WelcomeMedia(media, preview, errorLabel) contiene carga/error sin respaldo detrás; callbacks opcionales de Lottie/video. Sin modificar guest-page.tsx, IntroSplit o schemas.
- Implementador B: rama test/guests-welcome-media, worktree ../e2e. Solo scripts/qa/guests-welcome-media/** y docs/specs/guests-welcome-media-inventory.md. Inventario antes de producto y E2E reales todos los uploads/destinos; nada aprobado sin evidencia. QA usa welcomeqa20261121, puerto3091 y almacenamiento local exclusivo; nunca env/DB/R2 de autoría.
- Orquestador: IntroSplit (imageFrame?: 'stretch'|'3:2', predeterminado stretch), guest-page.tsx, schema Welcome/hint/tests, ADR de kernel, infraestructura privada/checkpoint, integración y verificaciones.

Puertas de merge: matriz completa del plan, vídeo/Lottie real, typecheck/lint/pruebas/build/revisión visual/conservación y revisión QA independiente sobre candidato exacto. No push/deploy. Comandos: pnpm typecheck; pnpm lint; pnpm exec tsx --test <pruebas focales explícitas>; pnpm build aislado; scripts E2E inventariados. No se cuentan pnpm test ni boundary:check.

### Alcance ampliado por E2E: OG compartido de legales

El ciclo real O10 seleccionó/subió/guardó/publicó OG EN; EN emitió imagen/dimensiones correctas pero ES con publicación propia emitió cero og:image/twitter:image. Evidencia privada og/failure-privacy_policy-cookies_policy-complaints_book.json y og/es-privacy.html. El lector elegía todo el envelope ES, incluido OG obsoleto, aunque sharedEnvelope declara OG compartido y el picker solo admite EN. Se corrige únicamente composición de envelope privado y selección pública legal: copiar OG de EN (working en preview, publicado en público), conservando documento/SEO target íntegros. Sin escrituras GET, migración, backfill ni modificación de Save/Publish. Se añaden contrato focal y E2E de O10–O12 en4locales y aislamiento draft/published.
