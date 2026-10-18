# About CMS — QA funcional independiente

2026-10-18. Resultado: **aprobado para el alcance funcional solicitado**.
Sin fallos funcionales observados. Por instrucción posterior del usuario, el cierre
se limita al flujo normal de edición, persistencia, contenido público y multimedia;
no constituye aprobación de una matriz adversarial completa.

## Candidato y entorno

- Listas/textos/SEO: servidor construido en `4d3e157`.
- Comprobación final multimedia y guardado/recarga: código `d4e13c9`, construido en
  `/private/tmp/central-hill-about-cms-runtime`, preview `http://127.0.0.1:3062`.
  El único cambio posterior a la primera prueba afecta el aviso/draft de conflicto
  de Translations; no cambia listas, composición pública ni multimedia About.
- Checkout revisado: `/private/tmp/central-hill-about-cms-integration`, rama
  `about-cms/integration`. QA no modificó código de implementación.
- SELECT verificó base y rol `aboutcmsqa`; almacenamiento local S3rver9062,
  bucket `aboutcmsqa`. Usuario y datos sintéticos. Previews3059/3060/3061 intactas.

## Evidencia funcional

1. Editor en orden público, con textos, iconos, destino y label de tarjetas,
   SEO y cantidades/límites de listas visibles; metadata interna oculta.
2. En las ocho listas se movió un elemento, se eliminó un elemento y se añadió uno
   nuevo mediante controles reales. Save y reload conservaron contenido e identidad.
   Incluye párrafos string, cifras, audiencias, valores, departamentos,
   certificaciones, comunidad y contacto.
3. Un segundo guardado consecutivo persistió texto, icono de badge y SEO; reload
   mantuvo `QA SECOND SAVE`. Público EN/PT/ES/FR mostró el cambio sin rebuild.
   Las traducciones aprobadas de B siguieron B después de mover/borrar/añadir,
   y las de A eliminado no se reasignaron al elemento nuevo.
4. Las tarjetas de contacto conservaron destinos semánticos Owners/Real Estate
   después de moverlas, con prefijo de cada locale. Metadata title/description,
   canonical por idioma y hreflang EN/PT/ES/FR presentes.
5. Sobre el build final se subió **JPG en Historia, MP4 en Organización y WebP
   animado en Comunidad** desde los inputs del editor; Save completó uploads y
   guardó IDs nuevos. Reload mantuvo campos. La página pública mostró JPG cargado,
   MP4 decodificado (`readyState=4`, ancho160, muted/loop/playsInline) y WebP cargado
   desde su URL original, sin optimizador que sustituya sus bytes animados.
6. Editor móvil390 y público desktop1440/móvil390 sin desbordamiento horizontal.
   Capturas locales disponibles; no equivale a auditoría completa de accesibilidad.

Comandos QA ejecutados con Node22:

```sh
node /private/tmp/central-hill-about-cms-qa/qa-inspect.cjs
node /private/tmp/central-hill-about-cms-qa/qa-lists.cjs
node /private/tmp/central-hill-about-cms-qa/qa-media-basic.cjs
```

Los tres terminaron exit0 tras corregir un error inicial del harness de listas
(creación de contexto Playwright, antes de guardar). Resultados:
`qa-editor-dom.json`, `qa-lists-results.json`, `qa-media-basic-results.json`,
`qa-editor-{desktop,mobile}.png`, `qa-public-{desktop,mobile}.png`, en
`/private/tmp/central-hill-about-cms-qa/`.

La primera espera del harness de stale editor coincidió con una región aria-live
vacía: su `staleConflict:""` **no se cuenta como prueba browser de conflictos**.
El chequeo negativo posterior no se ejecutó (interrumpido antes de arrancar).
No se ampliaron matrices de permisos, límites, fallos de upload ni concurrencia
tras la reducción de alcance del usuario. Tampoco se certifican todos los formatos
en los tres slots, CDN de producción o movimiento reducido.

Antes de esa reducción, revisión independiente señaló la carrera de una traducción
contra una fuente retirada y la pérdida de draft cuando la UI ignoraba el conflicto.
Root corrigió ambos; el seam aislado de fuente retirada retornó false sin crear
huérfano (`qa-race.ts`, exit0). No se declara retest browser de la UI de conflicto.

Los checks integrados y el build final corresponden al registro del orquestador,
no a ejecuciones duplicadas de QA. Sin migraciones nuevas, main, push ni despliegue.
La preview conserva fixtures sintéticas de QA; snapshot previo en `qa-baseline.json`.
