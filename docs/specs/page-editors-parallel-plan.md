# Adaptación de editores de página en paralelo — propuesta posterior

**Sustituido para el siguiente arco por [spec](page-editor-platform-spec.md),
[plan](page-editor-platform-plan.md) y [handoff](page-editor-platform-handoff.md).**
El usuario acordó Owners, Buildings listado, Real Estate y Guest; Home se conserva.
About no entra. Formularios actuales conservados; Forms público es otro arco.
Máximo dos escritores, sin excepción de tres. Sólo documentación antes de clear;
ningún agente/worktree/implementación iniciado hoy. La propuesta histórica de abajo
no amplía alcance ni restablece la dependencia de Forms.

## Propuesta histórica, no ejecutable

2026-10-18. Plan, sin agentes lanzados. Depende de cerrar primero ADR0040 y Home
Guardar borrador/Publicar POR IDIOMA. No es permiso para convertir todas las páginas hoy.

## Qué se puede paralelizar

Un agente propietario por adaptador de página, cuando schema/contratos/registro/persistencia/
shell estén estabilizados. Cada uno conserva diseño y campos de su página y consume la misma
base: JSON draft/published por idioma, preview compartida, SEO toolbar y acciones simples.
No se copia el shell ni se reimplementa publicación en cada adaptador.

Candidatos concretos:

| Página | Key / editor | Diferencia que auditar antes de asignar |
|---|---|---|
| Owners | owners /admin/pages/owners | Planes/features anidados, fotos y Forms propio con publicación/captura real pendiente |
| Guest | guest /admin/pages/guest | Listas/medios, referencias de catálogo y composición existente |
| About | about /admin/pages/about | Listas/identidades ya existentes; conservar destinos semánticos y medios |
| Real Estate | real_estate /admin/pages/real_estate | Listas y formulario de consulta; adaptar placement con su contrato, no asumir el de Owners |

Fuera: CMS de Servicios, Buildings y Blog posts; también cualquier editor de entidad no
listado. No tocar sus tablas/rutas/forms para lograr una conversión masiva. Los lectores de
catálogo usados por páginas continúan por contrato. Listings Blog/Guides no se incluyen en
esta primera tanda; se pueden planificar después como editores de página, sin sus CMS detalle.

## Orden y capacidad real

La capacidad actual es4slots contando raíz: máximo **3agentes escritores de página a la vez**.
Propuesta de tanda: Owners, Guest y About; Real Estate entra cuando queda un slot libre.
No prometer4escritores simultáneos con este runtime. QA independiente utiliza un slot liberado
tras integrar el candidato de la tanda; no es un cuarto escritor sobre archivos compartidos.

La idea de un agente por página es una excepción PROPUESTA al patrón de dos implementadores
para una feature compartida. Se aplica sólo al encargo futuro de adaptadores ya desacoplados,
no a la base Home drafts ni al backend compartido de Forms. Root+dos implementadores+QA se
mantiene para esos arcos. Nada se lanza hasta el nuevo encargo de implementación del usuario.

Owners depende además de Forms público, que hoy no existe. Real Estate también requiere
inventario de su formulario. Antes de asignarlos, raíz aterriza los contratos comunes de
placement/release/renderer/captura requeridos. Ese backend no pertenece a ningún agente de
página. Si no está listo, no marcar Owners/Real Estate completos con placeholders: avanzar
Guest/About mientras la dependencia se resuelve, o preparar esa dependencia antes de la tanda.
El detalle sigue en owners-contextual-editor-plan.md; no se construye en el arco Home drafts.

## Preparación que hace raíz una sola vez

1. Registrar base probada Home drafts y freeze del contrato PageEditorialAdapter.
2. Crear integración y worktree/branch por página. Verificar cwd/HEAD/status de cada escritor.
3. Registrar por página: inventario de campos/listas/formularios, métodos públicos de lectura,
   identidad, fallback, SEO/ISR, schema y matriz de aceptación mínima.
4. Dar a cada agente archivos existentes/nuevos exactos. Ejemplos de nombres:
   owners-content / owners-contextual / owners-contextual-editor / owners-page / testsOwners;
   equivalentes guest/about/real-estate. Un schema/renderer/adaptador pertenece a un solo dueño.
5. Raíz posee schema DB/registro de adaptadores/contratos/rutas comunes, messages de4idiomas,
   componentes Backoffice, migraciones y helpers compartidos. Agentes envían peticiones a raíz;
   no editan esos archivos en paralelo ni crean contratos incompatibles por su cuenta.
6. Aislar datos/env/procesos por escritor; verificar DB y prefijos de fixtures, sin credenciales
   productivas. Puertos se verifican/asignan al arrancar; preservar3065 y el piloto drafts.

El registro por página permite plugins/adaptadores; el getter público accede al published
correcto sin una implementación de publicación distinta por página. La habilitación es
explícita para no convertir editores legacy por añadir una fila al nav.

## Pruebas que no multiplican tiempo

La base ya probó lifecycle/idiomas/atomicidad/CAS. Cada agente verifica sólo lo propio:
- Un caso de mapeo/cobertura de campos y su caso distintivo (lista anidada/destino/media).
- Si hay nuevas reglas reales, añadir sólo su caso; no duplicar10tests del motor por página.
- No builds/lint globales en3worktrees. Raíz hace typecheck/lint/build una vez en integrado y
  tests explícitos de lo cambiado. QA consume logs y no repite todos los comandos.
- QA independiente: un flujo corto por página, editar→guardar draft→preview→publicar del
  idioma, reload/público/SEO. Sólo una página representativa repite aislamiento EN/ES del motor.
- Formularios nuevos requieren su captura real/Leads/console en su fase, sin volver a probar
  todas las plantillas, campos y locales del catálogo Forms.
- Un pase agrupado desktop/mobile, correcciones y confirmación sólo de afectados. No matrices
  de4idiomas×4páginas×3viewports ni barridos de todo el CMS.

Si al integrar se rompe un contrato común, raíz corrige y verifica sus consumidores afectados
una sola vez. No múltiples rondas globales por cambios puramente documentales.

## Handoff de la tanda

Por agente: commit/paths/nuevos archivos/check focal y limitaciones; sólo raíz integra.
QA aprueba el candidato integrado y entrega su informe; raíz deja localhost/commits/handoff.
No main/push/deployment/producción. Usuarios prueban visualmente las URLs locales de la tanda.
