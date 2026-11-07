# FAQ elegida por idioma de página

2026-11-07. Usuario autoriza permitir selección de FAQ en cada idioma: «no se toma
desde EN». Base mainfc609a8, tracked limpio; sólo PNGlogo/symlinkmedia untracked
previos. Entrega main local + único3071, sin push/deploy/remoto. No cambiar editores
de FAQ ni traducir sus preguntas aquí; se podrán elegir grupos distintos creados
en /admin/faq con contenido propio para EN/ES/PT/FR. No ciudades/barrios/testimonios.

## Inventario y comportamiento

Cinco páginas tienen faq_group_key: Home, Owners, Real Estate, Guest y About. Las
otras cuatro Pages no ganan una sección nueva. La referencia ya está en cada JSON
de borrador/publicación, pero Pages hoy la trata como neutral: sólo editable EN,
prepareTargetEnvelope la copia de EN y sharedEnvelope la protege de cambios target.
Public/preview YA renderizan la referencia del envelope elegido mediante
FaqSection(locale,groupKey), que carga sólo preguntas publicadas del grupo elegido.

Nuevo metadata opcional PageEditorialDescriptor.localeReferencePaths: string[].
Root declara ["faq_group_key"] sólo en esos cinco descriptores y en el descriptor
Home default del helper. No es [T]: identifica una referencia elegible por idioma,
no un texto traducible/slug traducido ni una nueva fila en translation. No mezclar
con textPatterns, textPaths o translationField. Sin kernel/schema/migración nueva.

prepareTargetEnvelope conserva referencias de su target guardado/publicado,
incluidos vacío y ausencia. Si no hay target, nunca usa EN: referencia ausente o
vacía significa sin FAQ. Mantener ausencia como undefined cuando no había valor
para evitar falso dirty de snapshots antiguos; nunca sustituir por key EN. Una
selección existente antes de esta entrega se conserva como elección propia: no
vaciar ni migrar datos en GET. Baseline legacy público y borradores guardados
siguen intactos. Ningún backfill/autosave. EN posterior no altera referencia ES,
PT ni FR aun si no cambian textos, tras Save/Publish/reapertura/cambio de tabs.

sharedEnvelope excluye sólo referencias declaradas además de los textos existentes.
validateDraftMutation así permite selector target, pero conserva guardas de media,
iconos/listas/IDs/OG y CAS/revisiones/firsttemplate. Cada selector va al borrador
del idioma activo, Guardar borrador/Publicar explícitos actuales; Publish ES no
publica EN/PT/FR. Limpiarlo se publica como sin FAQ, sin fallback EN. Título/intro
de FAQ conservan autoría por idioma. Grupo con0items publicados sigue elegible y
renderiza vacío como hoy; no nueva validación/filtrado de grupos por idioma.

En inspector FAQ de cualquier tab mostrar el mismo NodeField select actual,
catalogue faq_group existente, valor del locale activo, no textarea ni copia de
EN. Disponible incluso si EN no tiene título FAQ ni selección. Mantener otros
campos neutros EN-only, trabajo pendiente de otros tabs y guardas de navegación,
preview privado ephemeral y filas/selecciones actuales. Hint claro: elegir aquí
es independiente; vacío oculta FAQ en este idioma. Sin rediseño visual.

El editor de grupos sigue siendo una ficha de contenido sin etiqueta de idioma:
crear comprar-en/comprar-es/... y escribir preguntas/respuestas correspondientes.
Se preservan traducciones legacy de FAQ y su lector actual. No retirar genéricamente
faq_item de Translations en esta petición: su cierre es un paso técnico posterior,
sin perder su contenido existente. Global Translations permanece.

## Propiedad y workflow

Root: spec/ADR0068/index/AGENTS/roadmap/README Pages+FAQ/data-model; metadata tipo
src/slices/pages/editorial-adapter-types.ts, descriptor en adapters/home.ts y
{owners,real-estate,guest,about}-content.ts y descriptorHome dentro editorial-content.ts
(sólo adición inicial antes de writers); comentario schemas/_shared.ts, mensajes4;
fixtures/entorno/runtime/integración. No nueva API kernel ni tabla.

Integración page-faq-locales/integration en /private/tmp/central-hill-page-faq-locales-integration.
Root estabiliza metadata antes de abrir consumidores. Dos writers aislados, sin
nested agents, luego QA independiente sobre ensamblaje.

Backend /private/tmp/central-hill-page-faq-locales-backend, rama page-faq-locales/backend:
owns editorial-content.ts (helpers prepare/shared, descriptor inicial root ya enbase),
admin/editorial-validation.ts si precisa, nuevo tests/page-faq-locales.test.ts y
tests/page-faq-locales.integration.test.ts. No descriptors/schema/UI/messages/kernel.
Cubrir cinco páginas, fuera-de-scope sin cambio, target fresh noEN y existentes/
blank/absent, ENcambios/CAS/Save/reload/Publish/clear/public/legacy no-write, shared
media guards y textos/listas intactos. DB sólo nuevo slot Owners reservado abajo.

UI /private/tmp/central-hill-page-faq-locales-ui, rama page-faq-locales/ui: owns
admin/ui/page-contextual-editor.tsx; tests/page-faq-ui.test.ts nuevo sólo si prueba
comportamiento real no espejo de JSX; nuevo helper client si necesario con archivo
acordado root antes de editar. Reusar NodeField y options, no duplicar state ni
crear overrides/flags de ownership. Tabs pueden cambiar múltiples selecciones
pendientes sin cruzarse. Root prepara mensajes por pedido. Leer Impeccable/craft
floor; launcher ya ejecutado en esta conversación, no repetir. Usuario valida
apariencia; QA sólo funcional desktop/mobile, sin screenshot/polish loops.

QA independiente: owns docs/specs/page-faq-locale-selection-qa.md + artifacts
/private/tmp/central-hill-page-faq-locales-qa/independent. Tres grupos acotados:
1EN/ES/PT/FR selectors+Save/reload/publish/public distintos en nuevaAbout;
2noinheritfreshPT/blankFR/ENchanges y conservar drafts/otraspubs/CAS/sharedguards;
3clear sin fallback/privatepreview/mobile/Home readonly+otros5codecoverage,
hashes antiguos intactos y FAQ grupos/preguntas originales preservados. Sin
matriz amplia ni repeatedgroups aprobados salvo cambio/defecto confirmado.

## Entorno/autorización/datos

Mantener main3071PID35581/parent35575/session36923 hasta candidato listo; root
gestiona único3071 QA→main. Safeenv /private/tmp/central-hill-building-status-qa/env.sh,
Node22/propertylocalesqa DB5658+rol/proxy4558/storage9077PID30456. Verificar hostname
y SQLdb/rol antes de writes; no copiar .env remoto ni imprimir secretos. Sólo
contenido sintético nuevo autorizado vigente, sin schema ni permisos nuevos.

Inventario readonly actual: page_content keys blog/buildings/guest/guides;
page_locale_content sólo Home4locales; FAQ2grupos. HOME Y ESOS DATOS PROTEGIDOS.
Backend reserva Owners ausente, raíz e810 y grupos/ítems e810; preflight debe
negarse si existe fuente o cualquier localeOwners. Crear fixture propia, nunca
snapshot/delete/restore de páginas previas. Cleanup sólo sus IDs y rowsOwners
cuya raíz e810 propia conserva control. No otros fixedkeys. Root reserva About
ausente e811 para browser, conserva demo al final; no tocar Owners mientrastests.
Root seedcuatro grupos e811 (cada lengua literal en su fuente) + About completa;
media existentes sólo lectura, todos los otros datos protegidos por42hashes.

Verificación real integrada: typecheck/lint; tsx explícito nuevos pure/DB y regresión
Pages adapters/engine/Home/FAQ consumidores. No tests placeholders. Build con
CIRCLE_NODE_TOTAL=3/2workers DESPUÉS cleanupOwners; no config change/migración.
QA production3071, después ffmain local + apertura final sólo lectura. No push,
deploy, DBremota, lifecycleProperties ni otros auxiliares.

## Progreso

Inventario/spec antes de implementar. Contratos metadata root siguen.
