# Services — independent QA evidence

Independent QA — Services editor — 2026-10-18

Final code candidate: 23f2409850006f6f007c5c34bc6e85483183f691 (services/integration).
Read-only repository QA; all QA scripts/media/screenshots/report under /private/tmp/central-hill-services-qa. Root initial verified branch services/integration and clean ebb578a; final root candidate23f2409 had only orchestrator documentation edits in progress. Runtime dev3048 detached checkout and production3049 separate build checkout; same final code. No production access or writes.

Isolation: synthetic PostgreSQL servicesqa, central-hill-services-db container, local Neon transport proxy4448 test preload. S3rver9048 servicesqa bucket synthetic credentials. Test-only endpoint changed to IP path style after emulator vhost CORS failure. Production image tests use test preload imageConfigDefault.dangerouslyAllowLocalIP=true because Next correctly rejects local private-address image upstreams by default. No repository/kernel/dependency changes for test adapters. User services-qa@example.test, local staff admin. Root owns all servers; QA stopped none.

Findings:
P2 accessibility: initial candidate all23 text controls had visual labels but no associated id/htmlFor; getByLabel(meta title).count0. Reported to orchestrator; fixed by A and retested final getByLabel count1, all23 native controls .labels.length>0. CLOSED.
Root independently identified malformed legacy UUID before media resolution, missing Settings OG fallback and incomplete animation viewport/Lottie behavior. Final browser retests below verify these root-led corrections. No remaining QA product finding.

Verified final behavior:
- Authenticated Services editor visible, five editable cards and read-only catalogue note. Anonymous BO navigation redirects /admin/login; anonymous actual server action303 to login.
- All23 editable text/SEO fields persisted by real UI save and reload. Public mapping checked all copy, Settings email/WhatsApp, fixed localized Buildings CTA and exactly one terminal arrow.
- All3 icons selected with real picker UI, saved/reloaded, public inline SVG exact path geometry matched Iconoir airplane/home/sun-light. No add/remove/reorder controls in fixed3 step array.
- Production warmed all4 locale pages, actual authenticated save updated all4 public SEO/body without restarting or manually clearing caches. ES approved block:hero.headline appears; FR draft excluded and source value appears. Absolute https://centralhill.pt/{locale}/services canonical,5 absolute alternates including x-default/services; SEO title/description, OG/Twitter verified. Clearing page OG resolves Settings image. sitemap index followed to /sitemaps/pages:4 unique localized Services entries; robots200.
- Real network JPG uploads all5 image slots PUT200 and persisted; final production both hero and CTA optimized images200 and naturalWidth>0 after test-only local optimizer adapter.
- Real H264 MP4 generated in Chromium and uploaded both slots PUT200; public video source/poster, muted, loop, readyState4,currentTime>0. Final CTA src absent before viewport, set in viewport. Reduced motion removes both src and pauses, actual still poster configured.
- Real animated WebP uploads both slots PUT200; public URLs original assets, response200, sharp(animated:true).metadata.pages===3 both. Reduced motion picture currentSrc changes to configured JPEG both.
- Valid Lottie JSON real uploads both slots final candidate;2 public canvas players, reduced motion0 canvases and actual still JPEG loaded naturalWidth>0.
- Actual save server action rejects invalid UUID, nonexistent media UUID, wrong3-item count, video OG, video poster. Client OG rejects video with visible 'That file type isn’t allowed here.'
- Real local SQL malformed raw UUID row, invalid items count, empty row each render200 with exact default H1 in all4 locales. Real action invalidates caches before fixture; original source restored via real save. Initial no-row defaults also captured before content creation by root/QA.
- Desktop1440x1000/mobile390x844 public+editor no horizontal overflow, one H1, headings/copy legible, fixed3 icons, empty catalogue localized. Reveals activated by scrolling before screenshots. Fullpage captures include fixed header at current scroll position, a screenshot artifact. Orange photos intentionally synthetic.

Commands/evidence:
node inspect.cjs first sandbox launch1 (Mach browser permission), escalated0. Initial DOM evidence/editor-initial.png.
node content.cjs initial1 (CSS uppercase innerText assertion), corrected textContent rerun0. Real save,4 locales,auth,bad references,SEO; content-action.json.
node media.cjs initial1 due emulator CORS; reconfigured test endpoint then all9 uploads200. Later script exit1 from incorrect 'main video' selector (surface has no main); corrected retry reached all media/reduce/frames passed then exit1 solely incorrect expected client error wording. Error actual correct, narrow finish script verifies exact wording. Never count failed harness as full pass.
node fallback.cjs exit0 final candidate. Invalid UUID/count/empty rows4 locales and restored source; final-dev-action.json.
node final.cjs initial1 because labels fix changes accessible icon name to Icon (selector No icon obsolete); corrected rerun passes labels/icons/4locale save/globalOG/JPG/visual/video/Lottie then exit1 because sitemap.xml is index (no page URLs). Narrow finish.cjs follows index child and asserts actual URLs.
node finish.cjs final exit0:4 unique sitemap entries,3 exact public icon SVG geometries,Save disabled while reservation pending,forced PUT failure prevents page persistence after reload,OG client video rejection. Earlier finish retries failed solely because BetterAuth requires explicit Origin header after public navigation; corrected header to local origin, auth200.
Root verification reported final220 real tests0, typecheck0,lint0 (5 existing warnings),db:check0 (existing0008 breakpoint warning),final build0. QA independently reviewed import boundaries: pages/services imports other slices only contract.ts; no kernel/migrations changed. Placeholder test/boundary commands not counted.

Screenshots:
baseline-public-desktop.png,baseline-public-mobile.png,baseline-home-bo-desktop.png,baseline-home-bo-mobile.png (root baseline).
final-public-desktop.png,final-public-mobile.png,final-editor-desktop.png,final-editor-mobile.png; failed-upload.png.
Source fixtures photo.jpg,video.mp4,animated.webp,lottie.json and scripts in this directory are synthetic QA artifacts, not production assets.

Services editor independent QA: PASS on final23f2409, with no unresolved product finding. Overall QA closure PASS: root catalogue/Home regression passed on the same final candidate; script independently reviewed by QA as recorded below. No push/deployment performed.

Final failure-case evidence: finish.cjs exit0 observed Save.disabled=true during file reservation; aborting local PUT displayed network error; reload preserved previous SEO title rather than unsaved modified title. failed-upload.png captured.

Catalogue/Home closure: orchestrator ran node /private/tmp/central-hill-services-qa/catalog-retest.cjs exit0 on final23f2409. QA independently inspected the complete script: real authenticated BO save of Synthetic catalog original, HTTP requests assert published source appears in warmed /en and /en/services; second real BO save changes name to Synthetic catalog updated, HTTP asserts new value present and old absent on both routes. Four public cache assertions, without restart/cache clear. Fixture synthetic local Home/category/service only. UUID publisher user used because initial generated BetterAuth text-id exposes preexisting catalogue translation.updated_by UUID mismatch, outside Services code. Original partial synthetic row repaired through actual BO save. No unresolved Services regressions; final integrated candidate approved for authorized local integration.
