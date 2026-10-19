# Catálogo y editor de formularios reutilizables

2026-10-18. Nota posterior: el usuario autorizó primero el constructor real;
[spec de ejecución Forms](../form-builder/00-execution.md) y ADR0038 sustituyen las
propuestas de ownership/plantillas limitadas de este concepto. El selector de página
sigue fuera del arco actual.

Diseño histórico de feature futura; sin cambios de producto ni migraciones.
Parte del estándar contextual, con lifecycle propio. Su HTML es sólo un concepto
separado (`mock/contextual-editor/forms.html`). No se inserta un formulario nuevo
en Home. Esta separación permite pulir el editor Home antes de construir todo el
catálogo y sus adaptadores de envío.

## Inventario real auditado

| Ubicación | Código / comportamiento actual | Tratamiento propuesto |
|---|---|---|
| Home, bajo Hero | `pages/ui/home-page.tsx` → Settings `AvantioSearchBar`; reservas externas | Integración externa, fuera del catálogo de Leads |
| Header, CTA Owners, cierre Guest | `settings/ui/components/contact-dialog.tsx` → Leads ContactForm; envía leads reales con source distinto | Plantilla Contacto compatible con modal; placement global Settings o instancia correspondiente |
| About contacto | `pages/ui/about-page.tsx` → ContactForm source about-contact | Contacto inline/split |
| Service detail enquiry | `services/ui/service-detail.tsx` → ContactForm source service:<slug> | Contacto sidebar |
| Blog listado/artículo | NewsletterSignup → Leads NewsletterForm source blog | Newsletter de banda |
| Owners Hero y Buildings calculadora | `pages/ui/components/owner-estimate-form.tsx`; wizard3pasos que no hace submit real | Adapter especializado de estimación, implementación pendiente |
| Real Estate consulta | `pages/ui/components/deal-enquiry-section.tsx`; StaticFormCard, submit cancelado | Adapter Partnership con mapping explícito |
| Footer newsletter | `settings/ui/components/footer-newsletter.tsx`; email abre modal y confirmación visual, sin lead real | Integración adicional; presentación modal Newsletter |

Guest no tiene un formulario inline de Leads propio. Las afirmaciones históricas
de integración en el README de Leads no sustituyen este inventario: el código
actual monta Blog y About reales, mientras Owners/RealEstate/footer aún tienen
controles visuales sin envío. No declararlos ya funcionales ni asignar una plantilla
sin implementar/validar su backend.

## Ownership y capacidades

Leads es el dueño propuesto de definiciones, validación, envío y contratos de
formularios, con admin 'Formularios'. Pages guarda referencia de placement y copy
que rodea el formulario; Settings guarda placements globales y configuración de
Avantio. Cross-slice por contract.ts. Si se opta por otro slice para definiciones,
resolver el ADR antes de crear tablas; no duplicar reglas de Leads.

Primer catálogo: Contacto y Newsletter desde plantillas controladas. Crear una
instancia, nombrarla, editar labels/ayudas/placeholders/botón/success y traducciones.
Los identificadores de campos, tipos, valores de opciones y reglas esenciales de
envío son estables. Permitir opciones/campos opcionales y orden acotado sólo donde
la plantilla lo autorice. El usuario puede crear varios formularios reutilizables;
no queda restringido a una instancia global de cada tipo.

El objetivo 'crear formularios' puede ampliarse después a tipos de campos propios
(text/email/tel/textarea/select/checkbox/number), con IDs y validaciones definidas.
Un constructor completamente libre, lógica condicional, archivos, pagos y acciones
arbitrarias NO se incluyen en el MVP controlado ni en su estimación. Esa elección
se debe confirmar al pulir; no vender plantillas limitadas como libertad total.

La página sólo selecciona formularios publicados **compatibles con su slot**:
About.contact acepta Contact, Blog.newsletter acepta Newsletter; Owners.hero.estimate
necesita la plantilla especializada. No intercambiar un formulario de contacto por
Avantio ni aceptar scripts/HTML/URLs de envío/recipients arbitrarios desde el editor.
Un slot mantiene presentación inline/modal/sidebar/band/wizard y estructura fija.

## Contratos ilustrativos

```ts
type FormTemplateKey = 'contact.v1' | 'newsletter.v1'
  | 'partnership.v1' | 'owner-estimate.v1';
type FormSlotDefinition = {
  slotId: string;
  allowedTemplates: FormTemplateKey[];
  presentation: 'inline' | 'modal' | 'sidebar' | 'band' | 'wizard';
  required: boolean;
};
type FormDefinition = {
  id: string;
  internalName: string;
  template: FormTemplateKey;
  state: 'draft' | 'published' | 'archived';
  schemaVersion: number;
  configuration: TemplateValidatedConfiguration;
};
type FormPlacement = { formId: string; releaseId: string };
type SubmitPublishedForm = {
  formId: string;
  releaseId: string;
  placementId: string;
  locale: Locale;
  values: Record<string, unknown>;
  consentAnswers: Record<string, boolean>;
};
```

Contratos públicos previstos de Leads: `listCompatibleForms`, `getPublishedForm`,
`ReusableForm`, `submitPublishedForm` y tipos de slots. El servidor verifica que
placement/release/template son compatibles y publicados, valida campos, resuelve
source attribution y aplica sus reglas. No confiar en el payload cliente para
schema de envío, destinatario o prueba de consentimiento.

Versiones inmutables publicadas y referencia a release concreta como default de
propuesta: publicar una definición no cambia silenciosamente todas las páginas.
Mostrar usos y ofrecer actualización explícita de los placements elegidos. Debe
purgar tags de formulario y páginas/idiomas dependientes. Archivar en lugar de
eliminar formularios usados; proteger referencias y conservar histórico de leads.
Revisión/expectedRevision en saves administrativos y prevención de sobreescritura.

## Idiomas, copy y consentimiento

EN fuente con ES/PT/FR y estados de revisión existentes. IDs/estructura/reglas/
valores de opciones son compartidos; labels/placeholder/ayuda/consent/botón/success
son traducibles. Usar una entidad y paths estables por definición/release, contrato
de source sync y publicación definidos antes de migrar. Publicar sólo targets
aprobados con fallback explícito; mostrar stale según política actual.

La copy del formulario vive en la definición, no en cada página. Los títulos,
introducciones y medios de la sección siguen en Pages. La migración de los títulos
de pasos Owners y submit/note RealEstate requiere un mapa explícito; no introducir
overrides locales invisibles que hagan divergentes las instancias reutilizadas.

Datos personales introducidos por el visitante nunca se traducen. El envío debe
registrar la definición/release/placement/locale realmente usados y la copia exacta
resuelta del consentimiento. Separar aceptación de términos, aviso de privacidad
y marketing opcional; no reinterpretar el booleano actual como las tres cosas.
El servidor resuelve la versión publicada del aviso y valida aceptaciones;
conservar leads históricos sin reescritura. Campos de provenance nuevos nullable.

## Límites del pipeline actual y adapters especializados

`leads/validation.ts` define cuatro kinds con contratos distintos:

- Contact requiere name/email/subject/message.
- Newsletter requiere email.
- EarningsEstimate requiere dirección y números enteros positivos de propiedades/
  dormitorios. No captura nombre/email/teléfono.
- DealEnquiry requiere contact_name/email; muchos datos de compañía/activo opcionales.

Owners wizard ofrece Studio y6+, datos de contacto y dos checks. No puede conectarse
sin decidir semántica, schema y validaciones. RealEstate tiene nombres UI distintos
(company/contact/asset-type/units/status/model) de los keys de Leads y required de
compañía/teléfono/país diferentes. Sus adapters son trabajo real, no mapeo automático.

Pipeline actual persiste lead+lead_field, guarda consent y emite email best-effort.
No hay CRM externo ni destinatarios configurables por formulario (hay LEAD_NOTIFY_TO).
Honeypot y validación servidor se conservan. La inserción actual lead/fields no es
una transacción única; revisar la persistencia del nuevo contrato sin convertir
esta fase documental en una reparación de toda la plataforma.

## Fases y esfuerzo

Jornadas-persona enfocadas; incluyen QA normal, no son plazo ni presupuesto:

| Fase | Rango |
|---|---:|
| Inventario, ADR/contratos y mapa de migración | 2–3 |
| Contact/Newsletter: catálogo, versiones, idiomas, selector y adapter Leads | 7–11 |
| QA funcional normal y correcciones del catálogo inicial | 2–3 |
| Owners/RealEstate especializados, validación/consent y envío real | 5–8 |
| Footer/placements restantes | 2–4 |

Inicial11–17; alcance ampliado18–29, excluyendo infraestructura contextual y
producción/deploy. Son etapas del mismo esfuerzo, no sumar inicial al total.

QA futura: crear/save/reload/publicar formulario, asignar slot compatible, aprobar
traducción y render público, un envío sintético real por template implementada,
validación/consent snapshot/provenance en inbox y email stub, actualización de
usos/revalidación. Preview siempre sin submissions reales. Entorno nuevo aislado;
no escribir en Neon producción ni reutilizar bases de previews previas.
