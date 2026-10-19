# Revisión del concepto contextual

2026-10-18. Base b4c97e4; los cambios son únicamente spec/plan y mock standalone.
Orquestador único escritor; dos agentes de auditoría sólo lectura y un QA de
concepto independiente. No implementación React ni cambios funcionales del CMS.

## Auditorías previas

Arquitectura: source de Home/Owners/Guest, layouts, contratos, source sync,
Translation y políticas de publicación/identidad. Hallazgos incorporados en00.
Formularios: inventario de montajes reales vs UI estática, validación/envío/consent,
propiedad y slots compatibles. Hallazgos incorporados en02. Ambos verificaron
cwd/branch/HEAD/status antes de revisar y no escribieron ni ejecutaron writes.

## Evidencia browser

QA independiente en http://127.0.0.1:3070/ y forms.html, Playwright Chromium con
Node22. Script y artefactos en `/private/tmp/central-hill-contextual-editor-review/`:
`qa.cjs`, `results.json`, `editor-desktop.png`, `editor-mobile.png`,
`forms-desktop.png`, `forms-mobile.png`.

Primera pasada agrupada: selección Hero/título/media/botón, tabs EN/ES/PT/FR y
referencia EN, edición pendiente y refresco manual, guardado simulado, outline
SEO/FAQ/Avantio, forms etiqueta/idioma/compatibilidad y responsive.
Ancho real del iframe medido en390/768/1440; no sólo rectángulo visual reducido.
Sin errores de consola/pageerror, HTTP assets ausentes, requests externos o
mutaciones de red. Sin overflow horizontal a390 en ambas pantallas.

27/28 checks funcionales pasaron después de corregir dos esperas postMessage del
script QA (no defectos de producto). Dos hallazgos P2 corrigieron un único lote:

- Templates Newsletter→Contact no refrescaba título/intro/botón; ahora template()
  llama update() al seleccionar cualquiera.
- La regla genérica `[data-edit]{position:relative}` desplazaba el header fuera
  del Hero; texto blanco en crema. `.site-nav[data-edit]{position:absolute}`
  devuelve navegación al fondo del Hero sin cambiar la página pública real.

Confirmación afectada aprobada: ambos P2 resueltos, sin errores de ejecución.
Evidencia `results-confirmation.json`, `editor-desktop-final.png` y
`forms-contact-final.png`. La posición del header se midió absolute/top0 sobre
Hero y el retorno a Contacto restauró heading/intro/submit/campos.
No se realizan rondas abiertas de pulido: el próximo ajuste es feedback del usuario.

## Comprobaciones proporcionales

`node --check` de editor.js/home-preview.js exit0. Diff-check exit0.
Detector ejecutado una vez sobre los7 archivos de UI; exit0 con59 warnings, **no**
resultado limpio. Resumen revisado:37 avisos de tamaño de texto (18 under11px
funcionales y19 body under12px),10 de familias Inter/Fraunces,3 de paleta crema,
5 de contraste y4 de padding de la fila de reservas.

Inter/Fraunces y Warm Editorial son la identidad aprobada del proyecto, por lo
que no se sustituyen por el detector. El cálculo de contraste sobre fondos
transparentes no incorpora la foto/overlay del Hero: se revisó el render real y
no se acepta el ratio contra crema como prueba válida de contraste; tampoco se
proclama cumplimiento WCAG desde esas capturas. La fila Avantio es una
representación estática, no su formulario real.

Los tamaños secundarios pequeños son deuda real de legibilidad del concepto,
especialmente metadatos y labels al reducir la vista; se dejan identificados para
el pulido con el usuario, sin otra ronda autónoma después de la confirmación.
La feature debe definir una escala legible para el inspector y distinguir tamaño
real del preview de su escala. No hay gate de producción aprobado por este mock. No typecheck/lint/build/tests del producto: no código src,
dependencias o migraciones modificados. Estos resultados son QA del HTML y no
aprobación de una feature conectada a DB, traducciones o formularios reales.

El primer servidor Python dentro del sandbox falló con bind EPERM; inicio local
autorizado fuera del sandbox completado. Servidor sólo mock/contextual-editor,
puerto3070/sesión74600; log en /private/tmp/central-hill-contextual-editor-server.log.
Previews3059–3063 sin cambios. Sin GitHub, Neon producción, main, push ni despliegue.

## Próximo gate

Usuario revisa/pule el concepto. Consolidar ese feedback en00/01/02 y cerrar los
contratos de feature antes de autorizar implementación. No crear un editor real
sólo por aprobar este artefacto visual.
