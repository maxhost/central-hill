# Editor contextual — plan y estimación

2026-10-18. Baseline `b4c97e4`, rama `contextual-editor/concept`. Esta fase entrega
spec + prototipo, no cambios a editores reales. Ver [spec](00-spec.md),
[formularios](02-formularios.md) y [revisión](03-review.md).

## Secuencia y gates

1. **Concepto actual.** Auditar estructura/dueños, construir HTML/CSS y JS mínimo;
   revisar selección/idiomas/viewports/catálogo en una pasada; entregar para pulido
   del usuario. Mantener previews3059–3063. Sin DB ni paquetes nuevos.
2. **Pulido y spec definitiva.** Consolidar feedback sobre el mismo concepto;
   cerrar selección, labels, toolbar, estados, tabs y límites. Actualizar spec y
   contratos antes de programar producto. Aprobación del usuario de este resultado
   concreto es el gate de entrada a feature.
3. **Contratos e infraestructura.** ADR contextual/preview + i18n/identidades,
   contrato PageEditorAdapter/Translation y selección. Orquestador registra
   savepoint/base/asignaciones. Separar presentación Home de su lector servidor,
   sin migrar a un cliente universal. Shell/bridge y controles comunes.
4. **Home con idiomas.** Cubrir todos los campos/estados existentes, SEO y fuentes
   externas; source sync y targets confiables. Guard/revisión y compatibilidad
   de listas. Preview guardada; snapshot privado manual sólo si aprobado.
5. **QA piloto.** Datos sintéticos nuevos, un guardado/recarga/revalidación,
   medios reales representativos, target EN/ES/PT/FR, listas e identidad, viewport,
   selection mapping, navegación/submits bloqueados y regresión pública/ISR/SEO.
   Normal funcional, sin multiplicar todas las combinaciones por idioma/formato.
6. **Owners segundo piloto.** Prueba de reutilización con listas, wizard, catálogo
   y secciones no presentes en Home; ajustar el shell común, no bifurcarlo.
7. **Rollout revisado página por página.** Guest, About, Blog, Services, Guides,
   Buildings y Real Estate. Inventario de cobertura por adaptador y handoff QA.
   No desactivar el formulario anterior hasta cubrir el contrato correspondiente.
8. **Catálogo de formularios.** Feature paralela posterior a contratos estables:
   Contact/Newsletter primero, especializados después. Selección de placements
   se integra con el shell existente; no bloquear Home por construir todo el builder.

## Workstreams futuros (todavía no asignaciones de implementación)

- Orquestador: ADRs/contratos, metadatos de campos, mensajes compartidos, límites,
  migraciones/ownership, coordinación de source sync y publicación.
- A: shell, inspector, navegación, bridge, viewports y estados de UI.
- B: presentación compartida, adaptador Home, bindings y resolución de datos.
- Integración i18n y persistencia se reparte sólo después de contratos y archivos
  exactos definidos; no dos escritores en acciones, contratos o mensajes.
- QA independiente sólo tras integrar candidato; corrige cada dueño y QA retesta
  sólo lo afectado. Worktrees separados para escritores; preservar hasta captura.

No se crean agentes implementadores ni ADR aceptado en esta fase. Las revisiones
actuales fueron dos agentes read-only y un agente QA del concepto. Orquestador
es el único escritor de docs/mock.

## Estimación orientativa

Unidades: **jornadas-persona de ingeniería enfocada**, con QA funcional y margen
de integración, no horas reales de esta sesión, presupuesto ni fecha prometida.
Los agentes pueden reducir tiempo de calendario en trabajo independiente; contratos,
pulido del usuario, integración y revisiones no se paralelizan linealmente.

| Entregable | Rango |
|---|---:|
| Spec, concepto HTML y una ronda de pulido | 2–4 |
| Shell común, iframe/bridge, selección, inspector y viewports | 4–7 |
| Home, render compartido y cobertura de bindings | 3–5 |
| Idiomas, source sync, revisión e identidades de Home | 4–7 |
| QA integrado y cierre Home | 2–3 |
| Segundo piloto Owners, ajustes comunes y QA | 4–7 |
| Adaptación de cada otra página tras estabilizar estándar | 1–3, según complejidad |

**Home de producto después del concepto:13–22 jornadas-persona.** Estándar
probado con Owners:17–29. El rollout completo requiere contar cada adaptador y
revisar su complejidad; no extrapolar sólo desde un Hero.

**Catálogo inicial Contact/Newsletter:11–17 jornadas-persona adicionales**, con
versiones, idiomas, selección de slots, integración Leads y QA. El alcance ampliado
con Owners/Real Estate/footer y otros placements:18–29 en total para formularios,
excluyendo infraestructura del editor contextual. Detalle en02-formularios.
No sumar el catálogo inicial y el total ampliado como si fueran fases independientes.

No incluidos: drafts persistentes de página, historial/rollback de contenido,
snapshot privado manual, live preview automático, formulario libre con lógica
condicional, uploads de usuarios, campañas/email marketing, CRM externo, migración
producción o despliegue. Si se aprueban, estimar por separado antes de sumar.

## Riesgos concretos y cómo acotarlos

- **Dos renders divergen:** producción reutiliza presentación, el HTML de estudio
  se descarta. Comparación público vs preview por sección en la QA del piloto.
- **Tabs cosméticas:** implementar source sync, paths, approved/fallback/stale y
  contrato Translation antes de declarar edición por idioma completa.
- **Lista traducida al ítem equivocado:** identidad estable y compatibilidad legacy
  antes de habilitar modificaciones en listas traducibles.
- **Vista que no representa el viewport:** iframe con ancho interno real; escala
  sólo para encajar. La QA mide innerWidth, no sólo observa un rectángulo pequeño.
- **Guardar publica sin intención:** acciones explícitas y estado vista guardada/
  pendiente; preview privada no utiliza guardado público como transporte.
- **Formularios parecen funcionales pero no envían:** inventario real de02,
  adapters y un envío sintético normal por plantilla implementada.
- **Formulario compartido cambia todas las páginas:** versiones publicadas y
  actualización de usos explícita, con revalidación/dependencias documentadas.

## Verificación futura de producto

Node22/pnpm, typecheck/lint, tests explícitos por contratos y comportamiento
realmente cambiado, build en entorno aislado, db:check para migraciones nuevas.
Boundary review manual; no contar placeholders pnpm test/boundary:check.
Browser save/reload/public/translation/media, desktop+móvil. Todos los editores
mantienen EN/PT/ES/FR, SEO e ISR. No GitHub/Neon producción/main/push/deploy sin
alcance posterior separado. QA local automática autorizada por el usuario.

## Estado actual

- Checkout de concepto aislado creado desde b4c97e4, sin dependencias/env del CMS.
- Auditorías read-only de arquitectura/i18n y formularios completadas.
- HTML/CSS/JS local en3070; QA funcional del concepto completada y dos P2
  corregidos/confirmados. Detector con deuda de tipografía documentada en03;
  el pulido definitivo sigue pendiente de feedback del usuario.
- Ninguna feature React, tabla o editor real cambiado. El pulido del usuario y
  revisión de spec quedan por delante de cualquier implementación de producto.
