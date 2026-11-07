# ADR0066 — Guía completa por idioma, formulario y medios comunes

2026-11-06. Usuario autoriza idiomas en el formulario individual de Guías, herencia
de EN hasta editar texto localizado y secciones/lugares antes de primer guardado.

GuidePage + sections + places forman un único documento version1 con draft/pub
y revisión independiente por idioma. Mismo estado/controles de Services/Buildings;
no visual editor ni guardados live de hijos. Dos tablas aditivas de Guides (0028)
separan locales y shared content vivo; batch/graphlock/CAS atómico y lazy baseline
sin GET writes. Legacy público/pending/slugs/textos y filas originales preservados.

Textos/SEO/enlaces/categoría visible/horarios son localizados. Medios, datos
físicos, ciudad/plantilla y presentación neutral comparten mapas por UUID. EN
deriva clasificación neutral para recommendations, independiente del label de
categoría traducido. Estructuras target personalizadas no se reescriben por EN.
IDs de hijos también se registran en tablas existentes para propiedad; no borrado
de historia al quitar un nodo de un locale. Mapas completos cubren nodos target-only;
se podan sólo claves nunca guardadas sin referencias en ningún idioma.

New permite componer todo localmente; Save persiste agregado del locale elegido.
Publish valida agregado visible completo y ciudad publicada. Nuevos locales sin
publicación no aparecen en ninguna superficie pública/metadata/sitemap. Legacy
SourceActions y Translation guardadas/redirigidas vía Guides contract, sin retirar
global Translations ni tocar kernel. Archive/Restore preservan documentos.

Sin nuevas tecnologías/kernel. Metadata/media/i18n/geography siguen sus contratos.
Aplicar0028 sólo tras autorización explícita a DB sintética verificada. Inventario,
propietarios, aceptación y evidencia en guide-locale-forms-execution.md.
