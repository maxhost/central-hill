# Concepto de editor contextual

Estudio standalone de interfaz, **no feature del CMS**. Base b4c97e4, rama
contextual-editor/concept. Spec: ../../docs/specs/contextual-editor/00-spec.md.

- `index.html`: Home, canvas izquierda e inspector derecha.
- `home-preview.html`: representación conceptual dentro de iframe; en producto
  se reutilizará la presentación real, no este HTML duplicado.
- `forms.html`: concepto separado del catálogo/edición de formularios y selección
  compatible ilustrativa para About/Settings/Blog. No añade un formulario a Home.

## Abrir

Servidor estático activo: http://127.0.0.1:3070/ y /forms.html.
Para otra sesión, desde este checkout:
`python3 -m http.server 3070 --bind 127.0.0.1 --directory mock/contextual-editor`
(si el puerto ya se usa, conservar su proceso y elegir otro).

HTML/CSS con JS mínimo para selección, idiomas y viewports. Sin React, dependencias
instaladas, API, DB, almacenamiento persistente, envío ni guardado real. Todos los
valores de idioma, estados de revisión, nombres de archivos, formas/versiones y
asignaciones son ilustrativos. Guardar demo sólo actualiza memoria; recargar vuelve
al ejemplo. No meter datos reales, contraseñas o información personal.

## Recorrido propuesto

1. Seleccionar título, descripción, botón o fondo del Hero; ver campos del inspector.
2. Cambiar EN/ES/PT/FR conservando selección. FR ilustra fallback a EN.
3. Editar texto y pulsar Actualizar vista; no requiere guardarlo ni publica nada.
4. Cambiar desktop/tablet/móvil: el iframe usa ancho real1440/768/390, luego escala.
5. Secciones → SEO o FAQ sin contenido; seleccionar Avantio/catálogo para ver dueño.
6. Abrir Formularios: seleccionar una plantilla, editar una etiqueta por idioma,
   elegir un slot compatible y simular selección. No captura ni envía datos.

La simulación no cubre todos los campos de Home. Listas, múltiples medios, diseño,
traducciones/persistencia reales y flujos completos del form builder quedan en spec.
En futuro producto: guardar fuente publica según modelo vigente; el botón demo
no establece una nueva política de publicación ni un sistema de borradores.

## Assets

Fraunces obtenida de Google Fonts, licencia SIL OFL en assets/FONT-LICENSE.txt.
Fotos ilustrativas de las URLs fallback usadas por el sitio actual:
- images.unsplash.com/photo-1555881400-74d7acaacd8b (Hero Home, Portugal).
- images.unsplash.com/photo-1600585154340-be6161a56a0c (vivienda).
No representan el catálogo real de Central Hill. Assets locales para revisar el
concepto sin requests externos. El servidor estático sólo expone esta carpeta.

No se modificaron src/, DB, paquetes ni previews3059–3063. No build del producto.
