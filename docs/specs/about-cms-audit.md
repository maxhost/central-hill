# About CMS — auditoría de cobertura

2026-10-18. Alcance autorizado: auditar, proponer plan y spec. Sin implementación.
Base documental `6849427562825712f257570055af4d21d71141ce`, código Guides aprobado
`1a2739c`. Checkout `/private/tmp/central-hill-guides-cms-integration`, rama
`guides-cms/integration`, inicialmente limpio. No integración a main, push ni despliegue.

## Evidencia y límites

Se leyeron AGENTS.md, CLAUDE.md, workflow canónico, handoff Guides, README de Pages,
spec histórica `about-admin-editor.md` y ADR 0012, 0018, 0033 y 0034. La spec histórica
ya completó una primera alineación de About; esta revisión añade requisitos del usuario.
Las doce capturas son referencia visual aportada, con texto EN aunque se revisa `/es/about`.
No se consultó ni modificó producción.

Revisión de código: schema, layout/editor, save, resolución de traducciones/media,
metadata, revalidación, componentes públicos y equivalente multimedia de Home.
Browser Chromium headless sobre preview **3061**, desktop 1440×1000 y móvil emulado
390×844. Login exclusivamente con staff sintético; no Save, upload ni envío de leads.
SELECT confirmó DB/rol `guidescmsqa` y **0 filas About**. La página pública usa
`defaultAbout`; el editor muestra slots vacíos. Esto limita la evidencia: no prueba
el contenido guardado de la instancia de las capturas ni persistencia de About.

Los cuatro GET `/en|pt|es|fr/about` devolvieron 200; title/description y canonical
siguen el idioma. El contenido editorial es EN por fallback; no es evidencia de que
la instancia del usuario carezca de traducciones. En desktop no se detectó overflow.
Se guardaron capturas desktop/móvil, activando Reveal mediante scroll antes de las
capturas públicas finales. No se certifican a11y, rendimiento, gestos físicos ni
contraste por esta revisión de cobertura; no se asigna una puntuación general UI.

Evidencia local: `/private/tmp/central-hill-about-audit/results.json`,
`public-es-desktop.png`, `public-es-mobile.png`, `editor-desktop.png`,
`editor-mobile.png`; harness `/private/tmp/about-cms-audit.cjs`.
El selector de headings públicos del JSON busca `main h2` y devuelve vacío por el
shell actual: no debe interpretarse como ausencia de h2 en el documento.

Verificación existente con Node22.23.3/pnpm10.8.0:

```sh
pnpm exec tsx --test src/slices/pages/tests/pages.test.ts src/slices/pages/tests/pages-admin.test.ts
```

Exit0, **140/140**; log `/private/tmp/about-cms-baseline-tests.log`.
Primera ejecución de tsx y Chromium bloqueadas por sandbox (socket IPC/MachPort);
reintentos autorizados fuera del sandbox completados. No se ejecutó build,
typecheck/lint ni migraciones: no se modificó código. Tests históricos verdes no
demuestran que los requisitos nuevos estén cubiertos.

Previews: se comprobó listener3061 PID64605. No aparecieron listeners3059/3060 en
esta consulta; no se arrancaron, detuvieron ni reconstruyeron sus entornos. No se
tocaron procesos, fixtures o configuración de ninguna preview.

## Matriz de las doce capturas

| Captura / sección pública | Campos y control actual en About | Cobertura / brecha |
|---|---|---|
| 1 Hero | `hero.eyebrow`, `headline`, `mission`, `image_media_id`, `image_alt` | Textos, foto y alt editables. Sin CTA en este hero. Foto únicamente. |
| 2 Historia, dos columnas | `story.eyebrow`, `headline`, `narrative[3]`, imagen y alt | Todos los textos; exactamente3 párrafos. No vídeo/Lottie; WebP pasa por renderer de imágenes normal. |
| 3 Cifras | `stats[5].value`, `.label` | Texto/valor editables, cinco filas obligatorias. No altas/bajas. Render usa `StatBand columns={5}`. |
| 4 Cabecera plataforma | `serve.eyebrow`, `headline`, `intro` | Alineado. El contenido no depende del título de la tarjeta del admin. |
| 5 Audiencias, tres columnas | `serve.audiences[3]`: icono, título, descripción, imagen | Todo el contenido visible editable; tres slots obligatorios, reordenación disponible. Fondos decorativos sin alt semántico. |
| 6 Valores | `values.eyebrow`, `headline`, `intro`, `items[4]` título/descripción | Editable; cuatro slots obligatorios. Numeración01… automática. |
| 7 Organización | `organisation.eyebrow`, `headline`, `intro`, `departments[6]` icono/nombre/descripción | Editable; seis slots obligatorios. No altas/bajas. |
| 8 Media y badge organización | `organisation.image_media_id`, `image_alt`, `badge` | Texto del badge editable; su check es fijo. Foto únicamente; falta paridad multimedia con Home. |
| 9 Cabecera certificaciones | `certifications.eyebrow`, `headline`, `intro` | Alineado; el eyebrow repetido es contenido editable, no hardcode. |
| 10 Certificaciones | `items[1..12]`: icono, logo, logo_alt, título, issuer, descripción | Ya permite añadir/quitar/reordenar. Logo sustituye al icono. Issuer se comparte entre idiomas por diseño histórico. |
| 11 Comunidad, dos columnas | `community.eyebrow`, `headline`, `copy[2]`, imagen y alt | Textos editables; dos párrafos obligatorios. Falta multimedia. |
| 12 Contacto, tres columnas | `contact.eyebrow`, `headline`, `cards[3]`: icono/título/descripción/link_label | Labels editables. Destino calculado por índice; reordenar desacopla contenido y URL. |
| SEO, fuera de capturas | `seo.meta_title`, `seo.meta_description`, columna OG | Ya cubierto, límites70/200, canonicals/hreflang y fallback localizado. |

Todos los arrays fijos permiten **editar cada elemento** y mover arriba/abajo: el
editor sólo limita altas/bajas mediante min=max. No confundir cantidad fija con
elementos no editables. En browser sólo aparece `+ New certification`.

## Hallazgos priorizados

### P1 — Traducciones asociadas a índices

`server/overlay.ts` expande `items[]` en rutas numéricas;
`server/resolve.ts` consulta `block:<ruta>`. `admin/ui/schema-fields.tsx` intercambia
objetos/strings sin trasladar identidad de traducción; `savePage` sólo actualiza JSON.
Una traducción aprobada de índice0 se puede aplicar al nuevo elemento de índice0
tras reordenar o eliminar. Existe ya en certificaciones y movimientos de listas fijas.
Reproducción lógica de código; no se hicieron writes para reproducirlo en DB.
No habilitar más operaciones estructurales sin resolver identidad y compatibilidad.

### P1 — Destinos de contacto ligados a posición

`ui/about-page.tsx`: `CONTACT_CARD_PATHS[i]`; el editor permite swap. Mover Owners
al primer puesto le asignaría `/es/buildings`. Mantener destino semántico asociado
al elemento, con rutas localizadas; no introducir URLs libres como efecto secundario.
Si se permiten más de tres tarjetas, el índice actual también agotaría el mapa.

### P1 — Editor vacío frente a fallback público

`getPageForEdit` usa `{}` cuando falta fila; `applyDefaults` crea campos vacíos.
`AboutPage` en cambio usa `defaultAbout` si falta fila o falla safeParse.
Browser + SELECT confirmaron caso sin fila. El operador no edita lo que está viendo
y un guardado posterior puede reemplazar secciones con contenido reconstruido a mano.
Además no existe el guard de fuente inválida que ya tiene Guides. Defaults sólo
cuando no hay fila; si existe y es inválida, informar y bloquear reemplazo silencioso.

### P1 — Falta multimedia en los tres bloques de dos columnas

`story`, `organisation`, `community` usan `optionalImage`, picker image-only y
`photo()` sin dispatch por MIME. Home usa `optionalAnimated` + `sideMedia()` para
imágenes, WebP original sin optimizador, vídeo MP4/WebM y Lottie. Copiar únicamente
el accept no resuelve el render. IntroSplit tiene marco de alto flexible; no imponer
el 4:5 de Home a Story/Community al reutilizar lógica. Organización sí usa4:5.
WebP se admite como imagen hoy; preservación de animación en CDN no está garantizada.

### P1 — Referencias multimedia no comprobadas por About al guardar

`admin/actions.ts` valida existencia/MIME de Guides y Services, pero no About.
UUID válido no demuestra que el asset exista o sea compatible con ese slot.
Añadir validación de todos los slots About, incluidos OG/logos y fondos sólo imagen.

### P2 — Listas de cantidad fija

Historia3, cifras5, audiencias3, valores4, departamentos6 y comunidad2. La solicitud
actual requiere gestión de elementos, además de edición del contenido. Proponer
listas acotadas y grids que mantengan su máximo de columnas sin fijar el número de
filas. Certificaciones ya es el precedente1..12. Contacto necesita semántica antes
de flexibilizar. Texto como «Three», «six» o «01–04» no debe convertirse en una
promesa fija del admin; el contenido editorial sigue siendo responsabilidad humana.

### P2 — Icono del badge sin control

`TwoColumnShowcase` ya acepta `badgeIcon`, pero About sólo pasa `badge`. Añadir
`organisation.badge_icon_key` opcional, vacío→check, igual al patrón de Home.

## Contenido adicional y propietarios

Fuera de las capturas hay oficina, formulario y FAQ. About edita título de oficina,
cinco labels y títulos del formulario; valores de oficina y label de horarios se
editan en Settings. FAQ: grupo/título en About, preguntas en `/admin/faq`.
Labels de inputs, consentimiento, Submit, pendiente, errores/éxito pertenecen al
formulario compartido `leads.*` y no son editables en About. Header, footer,
WhatsApp y navegación también son globales. Mantener estas separaciones visibles
en notas del editor; ampliar el formulario compartido sería otra decisión de alcance.
No se considera que «todo editable» incluya esos textos por el mero README histórico.

No se necesitan entidades Team/Certification ni un builder libre. Conservar
composición, orden de secciones, EN/PT/ES/FR, SEO e ISR.

Plan de implementación propuesto: [About CMS spec](about-cms-execution.md).
