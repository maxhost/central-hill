# Blog Posts — entrega local de edición por idioma

2026-11-05. **Implementación local completada y QA funcional independiente aprobado.**
Código ejecutable aprobado **58ba96a**, informe independiente **060c195**.
Los commits posteriores de cierre son documentales y no cambian el ejecutable.

Savepoint documental **48ae09c**, contratos e03d2c5. Integración local en
`post-locales/integration`, `/private/tmp/central-hill-post-locales-integration`.
Backend escritor `/private/tmp/central-hill-post-locales-backend`, rama
`post-locales/backend`; UI `/private/tmp/central-hill-post-locales-ui`, rama
`post-locales/ui`. Preservados. Main sigue en48ae09c con logo previo no rastreado.

## Comportamiento

- Artículos reales con pestañas EN/ES/PT/FR, traducción manual y Save draft/Publish
  independientes. Guardar no cambia la web; ES puede publicarse antes que EN.
- Preview privada efímera con el mismo renderer público, medios locales y Refresh;
  sin JSON-LD privado, envíos, uploads ni persistencia desde preview.
- Baselines existentes y traducciones pendientes preservados, slugs existentes
  conservados. Metadatos, sitemap y alternates sólo de idiomas publicados.
- Cambios de tabs y acciones conservan trabajo local; guardas de salida/conflicto.
  Campos compartidos EN congelados por publicación, cuerpo/enlaces por idioma.
- Translations redirige y bloquea Blog Posts; autores/categorías/otros tipos siguen
  allí. Delete bloquea referencias entrantes sin modificar otros snapshots.

## Entorno y alcance

Usuario autorizó explícitamente creación/migración/pruebas sólo en postlocalesqa.
DB/rol SQL verificados ambos postlocalesqa; Postgres5648/proxy4548, storage9072
con bytes locales, preview3072. Cuenta sintética blogqa@example.test, contraseña
BlogLocalesQA2026!. Env/harness/logs bajo `/private/tmp/central-hill-post-locales-qa`.
No credenciales copiadas de producción. Preload local bloquea Neon remoto.
Migration0000..0024 aplicada exclusivamente allí con psql ON_ERROR_STOP.
Storage S3 emulado no verifica firmas; el flujo real presign/PUT/finalize y el
optimizador Next usan archivos sintéticos locales. El runtime local permite
únicamente imágenes del endpoint127.0.0.1:9072 mediante configuración QA generada
(start-preview.cjs / __NEXT_PRIVATE_STANDALONE_CONFIG); no cambia next.config.ts
ni habilita IPs privadas en producto. Esto evita el inventario estático de archivos
public al subir imágenes nuevas. El symlink no rastreado public/postlocalesqa
conserva los assets baseline relativos para review; es un artefacto de runtime.

3071 original se restableció al encontrarlo sin listener (PID58381/sesión62782),
mismo checkout/env; login200. No se aplicó migración ni guardó contenido allí.
No actualización de contactos, main integration, push, deploy o escritura remota.
Fases edificios/apartamentos, servicios y guías aún no iniciadas.

## Evidencia

- Primera integraciónc819e66: typecheck/lint0,46tests0. Lint mantiene7warnings
  preexistentes. db:check0 con25migraciones y warning0008preexistente.
- Build inicial compiló pero falló prerender por max_connections100 de la DB
  sintética; se aumentó sólo esa DB a400 y build-finalc87dcd8 pasó.
- Candidato2f67116: typecheck-candidate/lint-candidate/build-candidate0,
 16tests afectados0 (12backend+4UI), incluyendo carrera Delete/Save real.
- Confirmación9b875d7 (code30ce88a): typecheck-confirm/lint-confirm/build-confirm0,
 5state tests0 para primer cambio target después de Publish. No se repiten
 pruebas DB ni consumidores inalterados; candidato conservado.
- Preview final3072 PID62000/sesión12717, login y optimizador HTTP200.
- Correcciones finales58ba96a: typecheck-release/lint-release/tests-release19/
 build-release0;13backend+6UI. Runtime3072 PID69153/sesión73284, login200.
- Detector mecánico de diseño0, resultado[]; no sustituye QA de navegador.
- QA independiente aprobado, con recorridos/correcciones/límites en
  [QA](blog-post-locale-editors-qa.md). Spec y comandos exactos en
  [plan](blog-post-locale-editors-plan.md).

Durante QA navegador se detectó que la revalidación RSC posterior al primer Save
podía regenerar el key/UUID de New; ahora sólo esa creación navega realmente al
ID con controles bloqueados hasta montar su modelo guardado. También se ofrece
adopción local explícita de metadata EN para completar un target draft congelado
sin portada, con revisión protegida al guardar y texto/cuerpo intactos.
Durante QA se corrigieron referencias de plantilla EN en traducciones locales,
rechazo de Delete con referencias y mensajes de estado simultáneos. La revisión
final incluye continuar un target tras publicar su draft congelado y empezar
una nueva edición. Todas las correcciones quedaron confirmadas en58ba96a.

## Revisión y cierre

Abrir http://localhost:3072/admin/posts o el artículo activo
http://localhost:3072/admin/posts/a4000000-0000-4000-8000-000000000001.
Entrar con la cuenta sintética indicada arriba. EN/ES/FR publicados y PTdraft
permiten revisar el comportamiento. Primer Save nuevo estable y segundo Save,
adopción metadata local, uploads aislados, ES publicado antes de EN, público/SEO,
referencias/Delete, acceso anónimo y Archive confirmados por QA independiente.

No defectos bloqueantes abiertos. No trabajo de implementación/QA obligatorio
pendiente en este piloto. Mantener worktrees, DB/storage y ambos previews para
revisión del usuario. Las fases siguientes requieren su spec/solicitud propia.

## Archivos entregados

Manifest real respecto al savepoint48ae09c, incluido el informe QA:

```text
docs/data-model.md
docs/decisions/0057-blog-post-locale-snapshots.md
docs/specs/blog-post-locale-editors-delivery.md
docs/specs/blog-post-locale-editors-plan.md
docs/specs/blog-post-locale-editors-qa.md
docs/specs/entity-locale-editors-spec.md
drizzle/0024_blog_post_locale_content.sql
drizzle/meta/0024_snapshot.json
drizzle/meta/_journal.json
messages/en.json
messages/es.json
messages/fr.json
messages/pt.json
scripts/seed-blog.ts
src/app/(admin)/admin/(panel)/posts/[id]/page.tsx
src/app/(admin)/admin/(panel)/posts/new/page.tsx
src/app/(admin)/admin/preview/posts/[id]/page.tsx
src/slices/backoffice/page-editor-types.ts
src/slices/backoffice/ui/admin-workspace.tsx
src/slices/backoffice/ui/media-queue.tsx
src/slices/backoffice/ui/page-editor-shell.tsx
src/slices/blog/README.md
src/slices/blog/admin/actions.ts
src/slices/blog/admin/editorial-contract.ts
src/slices/blog/admin/post-locale-actions.ts
src/slices/blog/admin/post-preview-actions.ts
src/slices/blog/admin/queries.ts
src/slices/blog/admin/ui/body-editor.tsx
src/slices/blog/admin/ui/list.tsx
src/slices/blog/admin/ui/post-editor-adapter.tsx
src/slices/blog/admin/ui/post-editor-preview.tsx
src/slices/blog/admin/ui/post-editor-state.ts
src/slices/blog/admin/ui/post-locale-editor.tsx
src/slices/blog/contract.ts
src/slices/blog/editorial-types.ts
src/slices/blog/schema.ts
src/slices/blog/server/editorial-translation-policy.ts
src/slices/blog/server/post-locale-bootstrap.ts
src/slices/blog/server/post-locale-model.ts
src/slices/blog/server/post-locale-store.ts
src/slices/blog/server/post-locale-validation.ts
src/slices/blog/server/queries.ts
src/slices/blog/tests/post-editor-state.test.ts
src/slices/blog/tests/post-locale-store.integration.test.ts
src/slices/blog/tests/post-locale-validation.test.ts
src/slices/blog/ui/blog-post.tsx
src/slices/translation/README.md
src/slices/translation/admin/actions.ts
src/slices/translation/admin/queries.ts
src/slices/translation/admin/ui/review.tsx
src/slices/translation/server/generate.ts
```

Artefactos no rastreados/ignorados que se conservan: public/postlocalesqa
(symlink runtime), .env.local sintético del worktree y todo el directorio
/private/tmp/central-hill-post-locales-qa (env/preload/storage, arneses, imágenes
y logs, incluidas primeras aserciones fallidas). No van en el commit. En el
checkout original permanece el PNG de logo previo no rastreado, sin modificación.
