# Translations retirement — QA independiente

**APROBADO** para producto `b30a18c85fbb916e62bf4d5ada97bf0f0169a5d9`.
La matriz principal terminó **52/52**, Q6 cerró sus condiciones y el rollup final
tiene **pending:0**. No quedan hallazgos de producto P1/P2 abiertos. Esta aprobación
no afirma que las suites antiguas destructivas o el conjunto completo de tests
históricos estén verdes.

QA se ejecutó en producción propia `localhost:3081`, build del candidato (105
rutas, dos workers), DB/rol/host exactos `translationsretirementqa` /
`translationsretirementqa.local`. Admin sintético propio creado por signup normal;
navegador público en otro contexto sin cookies Admin. No se usó sesión del usuario,
cookies fabricadas, SQL para valores bajo prueba, endpoints ocultos, cache flush,
reinicios para hacer aparecer publicaciones ni cambios de producto hechos por QA.
Main3071 y su contenido permanecieron fuera de las mutaciones QA.

## Evidencia funcional

Cada unidad principal usa controles reales: editar campos configurados, Save draft,
recargar, comprobar draft y público baseline, Publish y verificar salida pública
visible/atributos/metadata. Se verificó preview privado donde existe (Pages/Post);
Service/Guide prueban draft recargado y público baseline, sin inventar preview.
El marcador nuevo tampoco aparece en HTML/RSC público antes de Publish. Se comparan
snapshots y revisiones de otros idiomas; title/description nuevos y canonical,
alternates, idioma y URL contra su baseline real, sin asumir origin para SEO.

| Gate | Unidades | Resultado |
| --- | ---: | --- |
| Q4a Home, Owners, Guests ×4 | 12 | Aprobadas;41/93/49 paths por idioma |
| Q4b About, Real Estate, Buildings ×4 | 12 | Aprobadas;46/121/26 paths por idioma |
| Q4c Services, Guides, Blog listing ×4 | 12 | Aprobadas;15/22/9 paths; empty Guides cerrado Q6 |
| Q5a Article Sidebar ×4 + Post ×4 | 8 | Aprobadas;4/11 paths; resto Blog intacto; rich text/ALT/listing/aside |
| Q5b Service ×4 | 4 |66 paths guardados;53 salidas activas,12 condicionales Q6,1 legado sin renderer |
| Q5c Guide ×4 | 4 |27 paths evaluados; EN3 categorías son clasificación/código; targets sí editados |
| Total principal | **52** | **52 aprobadas,0 fallos,0 pendientes** |

Se intercalaron drafts reales EN+ES pendientes antes de Publish PT en Owners,
Post, Service y Guide. PT conservó exactamente drafts/revisiones/publicaciones
ajenos; públicos EN/ES mantuvieron baseline y sus marcadores draft no aparecieron
ni en DOM ni en HTML/RSC. Después EN/ES se publicaron desde esos mismos drafts.
No se aceptó una comparación con drafts nulos como prueba de aislamiento.

Los incrementales previos también pasaron: Q1 compatibilidad29 casos y Service ES;
Q2 Guide PT, About FR46 campos y FAQ FR vacío sin heredar EN; ausencia de menú/UI
S14 y errores de namespace. El final About FR volvió a elegir su grupo propio y
probó públicamente sus textos FAQ. Se conserva el histórico de cada gate.

## Q6 y conservación

| Obligación | Evidencia final |
| --- | --- |
| Service condicional |12 campos×4 idiomas: enquiry/contact/noPayment, requestShort móvil, on_request, partners, modal allPhotos/close. Cambios de modo por UI; external/auto y publicaciones originales restaurados; ninguna submission/email/booking. |
| Guides empty_message |Archive del único Guide propio→4 mensajes públicos→Restore. Publicaciones/drafts/revisiones exactos y rutas recuperadas. Se hizo antes de crear el Guide auxiliar. |
| Lectores legacy |FAQ FR approved question+answer mediante grupo histórico propio; ALT Guide FR vacío usa target asset ALT aprobado. Owners restaurados por UI.13 filas translation/asset con hash exacto y transacción seed original; otras2 identidades FAQ conservan la misma transacción original. |
| Móvil |390×844: Pages/Post/Service/Guide navegan por enlace de listado, editan/guardan/recargan/publican un campo y restauran publicación completa original por UI. |
| Compatibilidad final |12 rutas antiguas, login anónimo, sin enlaces S14 ni Intl errors;42 tablas de negocio QA idénticas antes/después de esos GETs. Las pruebas de los seis stubs/generator del root y revisión Q3 se conservan; QA no invoca acciones mediante endpoints ocultos. |
| Neutral/shared |12 unidades principales publicadas en4 idiomas sin drafts pendientes; estructura/media/OG y campos comunes exactos salvo precondiciones documentadas;36 slugs originales exactos. |
| Entorno del usuario |Root produjo fingerprints42 tablas antes/después; QA comparó independientemente los JSON completos: exactos, Settings0. QA no conectó esa DB. |

0 pageerrors y boundaries `[]` en los52 casos y verificaciones Q6 correspondientes.
El rollup resuelve los `conditionalPending` históricos de los casos principales
con referencias explícitas a Q6; no se reejecutaron los52 para cambiar su estado.

## Herencia: capacidades reales, sin falsos BrowserPass

Working proyectado desde EN no equivale a fallback público EN. Pages/Post no tienen
`localeMode`; Service/Guide publican el snapshot guardado propio, incluso cuando
su modo es inherit. Un target adaptado sin publicación propia permanece invisible.

| Familia | Alcance aprobado |
| --- | --- |
| Pages |No Reset/Inherit UI y nueve keys ya custom. Proyección working, separación published/draft y conservación propias: puro/source. Browser prueba cuatro publicaciones propias e aislamiento, no un reset inexistente. |
| Post |Puro/source para target ausente y autoría propia. Crear/publicar un source-only nuevo requiere cover/upload; no se amplió media/infra para este requisito secundario. |
| Service |Puro/source. Se intentó el mínimo UI nuevo: draft EN1 correcto, Publish exige cover UUID. No se añadió upload/infra. Draft auxiliar aislado `eefd5560-a3ad-4ab4-a779-4bc980ad071f` queda no público; no se tocó ningún target existente. |
| Guide |Browser source-only mínimo con una sección de texto/sin uploads: ES working toma EN pero público404; Save/Publish inherit crea snapshotES; EN posterior cambia working pero no públicoES; editar ES→Save/Publish custom. Auxiliar `d6c9048d-9ea2-4822-9616-4a034a2c4ae7`, EN4/ES4; PT/FR sin publicación. |

Apoyo A:42/42 pruebas puras (12 temporales sobre modelos reales+30 existentes),
cinco procesos con guardas IO sin intentos. QA revisó reporte/TAP. No son pruebas
DB ni BrowserPass; selección de lectores no exportados se documenta como source.
Informe `/private/tmp/central-hill-translations-retirement-inherit-check/report.md`.

## Exclusiones y desviaciones transparentes

- 37 paths admin-hidden se contrastaron con renderers: legado sin consumo actual;
no se cuentan como salida pública aprobada. No se eliminan sus datos.
- Owners `why.cta_secondary.note`, `plans.helpers[].title/copy`, y Service
`duration_label`: controles persistidos sin renderer; no public-edit-pass. Sólo
`helpers[0].cta.label` sigue activo y se probó.
- BlogHero fuerza `alt=''` por intención decorativa, igual que f947c4f. ALT propio
se guarda/recarga; DOM vacío se comprueba separadamente, sin declarar texto ALT
publicado. No se cambia el significado de la imagen para hacer pasar un marcador.
- Guide EN preserva restaurant/viewpoint/beach como clasificación canónica y observa
sus labels de código. ES/PT/FR sí prueban labels libres traducidos por UI.

Se encontró un P2 preexistente real: `homeNode` no recorría índices de arrays y
About FR Certifications rompía el Inspector antes de Save. Root/B corrigieron
sólo el helper en b30a18c; QA revisó el diff y retest Cert FR+About completo pasó.
Los52 finales se hicieron en ese mismo build congelado.

Otras desviaciones fueron de fixture/harness, sin sourcefix: PDF opcional propio
Real Estate apuntaba a PNG (accept=document); se quitó por Remove UI y cuatro
Saves/Publishes, conservando el CTA label activo con fallback; filename guard no
aceptaba underscore; raw CTA vacío es '' y no null; TipTap exige selección del
texto del bloque+teclado en lugar de fill; bookingLabel es aria-label del aside;
summary FAQ incluye '+' decorativo; primer Save nuevo debe esperar draft completo
y no sólo identidad. Se conservaron intentos/checkpoints y se retomaron estados
comprobados sin repetir Saves/Publishes completados a ciegas. El draft TipTap
mal introducido se corrigió explícitamente antes de publicar.

## Artefactos y reproducibilidad

Base `/private/tmp/central-hill-translations-retirement-qa/`:
`results/final-scoreboard.json`, `results/final-rollup.json`, gates Q1/Q2/Q4a–c/
Q5a–c, `q3-source-review.md`, manifiestos e históricos de intentos. Manifiesto
final v7 SHA256 `2491cf226e81614dc69cf3d8d4ac7fe6fac49bea160c4f29b53f677c99bf98fd`.
El rollup final contiene pending0 y referencias de resolución; las limitaciones
browser anteriores son explícitas, no casos falsamente aprobados.

Fuentes reutilizables sin credenciales conservadas en
[`scripts/qa/translations-retirement/`](../../scripts/qa/translations-retirement/README.md), con
README parametrizado/allowlist. No se copian envs, login-private, sesiones ni
resultados masivos al repositorio. Los originales temporales se preservan. Main,
logo original, symlink público y otros archivos/worktrees/envs/caches no se limpian.
La integración/apertura final de main corresponde al orquestador después de revisar
esta entrega; QA no hace push, deploy, migraciones o cambios de código de producto.

## Entrega local del orquestador

Main integrado localmente, fuente de producto idéntica a `b30a18c`. Nuevo dev3071
PID49033/parent49027/session91704, cwd workspace real verificado. Apertura final
sólo lectura de Guests EN/PT, login y dos URLs antiguas anónimas:5/5,0pageerrors.
No Save ni autenticación nueva sobre el entorno original. QA3081 detenido; bases,
fixtures, builds y artefactos retenidos. Scripts incorporados mediante allowlist
explícita:33MJS/CJS+3docs, sin secretos; sintaxis33/33 y scoped lint0/0. Sólo
se quitaron imports/bindings sin uso, preservando acciones await. Sin nuevo código
de producto ni repetición de los52ciclos por empaquetado. Sin push/deploy.
