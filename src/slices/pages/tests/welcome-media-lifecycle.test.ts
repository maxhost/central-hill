import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

/** Exercise actual effects against the optional player boundary, without a WASM/browser claim. */
function evaluate(file: string, dependencies: Record<string, unknown>, globals = {}) {
  const compiled = { exports: {} as Record<string, (...args: never[]) => unknown> };
  const source = ts.transpileModule(readFileSync(new URL(`../ui/components/${file}.tsx`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, {
    module: compiled, exports: compiled.exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      assert.ok(name in dependencies, `Unexpected dependency ${name}`);
      const value = dependencies[name];
      if (value instanceof Error) throw value;
      return value;
    },
    ...globals,
  });
  return compiled.exports;
}

type Player = { config: Record<string, unknown>; destroyed: number; emit(type: string): void };
function lottie({ reduced = false, importError = false, constructorError = false } = {}) {
  const effects: Array<() => (() => void) | void> = [];
  const players: Player[] = [];
  let ready = 0, errors = 0;
  class FakePlayer implements Player {
    config: Record<string, unknown>;
    destroyed = 0;
    listeners = new Map<string, () => void>();
    constructor(config: Record<string, unknown>) {
      if (constructorError) throw new Error("constructor failed");
      this.config = config;
      players.push(this);
    }
    addEventListener(type: string, fn: () => void) { this.listeners.set(type, fn); }
    emit(type: string) { this.listeners.get(type)?.(); }
    destroy() { this.destroyed++; }
  }
  const source = evaluate("lottie-player", {
    react: { useRef: () => ({ current: {} }), useEffect: (fn: () => void) => effects.push(fn) },
    "./media-status": { useMediaStatus: () => null },
    "@lottiefiles/dotlottie-web": importError ? new Error("import failed") : { DotLottie: FakePlayer },
  }, { window: { matchMedia: () => ({ matches: reduced }) } });
  const render = source.LottiePlayer as unknown as (props: Record<string, unknown>) => unknown;
  return {
    players,
    counts: () => ({ ready, errors }),
    mount: (src = "/fixture.json") => {
      render({ src, onReady: () => ready++, onError: () => errors++ });
      return effects.at(-1)!();
    },
  };
}
const settled = () => new Promise(resolve => setImmediate(resolve));

test("Lottie readiness means first render, not engine ready or resource load; central cover and reduced motion survive", async () => {
  const h = lottie({ reduced: true }); h.mount(); await settled();
  const player = h.players[0]!;
  assert.equal(player.config.autoplay, false);
  assert.equal(player.config.loop, true);
  assert.deepEqual(JSON.parse(JSON.stringify(player.config.layout)), { fit: "cover", align: [0.5, 0.5] });
  player.emit("ready"); player.emit("load");
  assert.deepEqual(h.counts(), { ready: 0, errors: 0 });
  player.emit("render"); player.emit("render");
  assert.deepEqual(h.counts(), { ready: 1, errors: 0 });
});

test("Lottie load and render errors are confirmed failures, reported once, and cannot subsequently report ready", async () => {
  for (const event of ["loadError", "renderError"]) {
    const h = lottie(); h.mount(); await settled();
    const player = h.players[0]!;
    player.emit(event); player.emit(event); player.emit("render");
    assert.deepEqual(h.counts(), { ready: 0, errors: 1 });
  }
});

test("Lottie import and constructor failures use the same optional failure callback", async () => {
  for (const options of [{ importError: true }, { constructorError: true }]) {
    const h = lottie(options); h.mount(); await settled();
    assert.deepEqual(h.counts(), { ready: 0, errors: 1 });
  }
});

test("Lottie unmount before import resolves prevents player creation", async () => {
  const h = lottie(); const cleanup = h.mount(); cleanup?.(); await settled();
  assert.equal(h.players.length, 0);
  assert.deepEqual(h.counts(), { ready: 0, errors: 0 });
});

test("Same-type replacement destroys old Lottie and ignores its late callbacks", async () => {
  const h = lottie(); const cleanup = h.mount("/first.json"); await settled();
  const old = h.players[0]!; cleanup?.();
  h.mount("/second.json"); await settled();
  old.emit("render"); old.emit("renderError");
  assert.equal(old.destroyed, 1);
  assert.deepEqual(h.counts(), { ready: 0, errors: 0 });
  h.players[1]!.emit("render");
  assert.equal(h.players[1]!.config.src, "/second.json");
  assert.deepEqual(h.counts(), { ready: 1, errors: 0 });
});

test("Video reduced motion pauses and rewinds; ready is loadeddata; waiting and autoplay rejection have no failure handler", () => {
  const effects: Array<() => void> = [];
  let pauses = 0, ready = 0, errors = 0;
  const video = { autoplay: true, currentTime: 3, readyState: 0, error: null, pause: () => pauses++ };
  const source = evaluate("loop-video", {
    react: { useRef: () => ({ current: video }), useEffect: (fn: () => void) => effects.push(fn) },
    "./media-status": { useMediaStatus: () => null },
  }, { window: { matchMedia: () => ({ matches: true }) } });
  const render = source.LoopVideo as unknown as (props: Record<string, unknown>) => { props: Record<string, unknown> };
  const node = render({ src: "/fixture.mp4", onReady: () => ready++, onError: () => errors++ });
  effects[0]!();
  assert.equal(pauses, 1); assert.equal(video.currentTime, 0); assert.equal(video.autoplay, false);
  assert.equal(ready, 0); assert.equal(errors, 0);
  assert.equal(node.props.muted, true); assert.equal(node.props.loop, true); assert.equal(node.props.playsInline, true);
  assert.equal(node.props.onWaiting, undefined); assert.equal(node.props.onPause, undefined);
  (node.props.onLoadedData as () => void)(); assert.equal(ready, 1);
  (node.props.onError as () => void)(); assert.equal(errors, 1);
});

test("Media content preserves optimized stored dimensions and animated WebP bytes; local blobs never use provisional dimensions", () => {
  const source = evaluate("media-content", {
    "@core/media": { MediaImage: "MediaImage" },
    "@core/media/mime": { isLottieMime: (mime: string) => ["application/json", "application/zip+dotlottie"].includes(mime) },
    "./loop-video": { LoopVideo: "LoopVideo" }, "./lottie-player": { LottiePlayer: "LottiePlayer" },
  });
  const render = source.MediaContent as unknown as (props: Record<string, unknown>) => { type: string; props: Record<string, unknown> } | null;
  const media = { url: "/saved.jpg", width: 2250, height: 1500, alt: "Selected", blurhash: null, mime: "image/jpeg" };
  const saved = render({ media, className: "fill-frame", sizes: "560px" })!;
  assert.equal(saved.type, "MediaImage"); assert.equal(saved.props.data, media); assert.equal(saved.props.className, "fill-frame");
  assert.equal(saved.props.sizes, "560px"); assert.equal(saved.props.unoptimized, false);
  assert.equal(render({ media: { ...media, mime: "image/webp" } })!.props.unoptimized, true);
  const local = render({ media: { ...media, url: "blob:local", width: 1200, height: 1500 } })!;
  assert.equal(local.type, "img"); assert.equal(local.props.width, undefined); assert.equal(local.props.height, undefined);
  assert.equal(render({ media: { ...media, width: 0, height: 0 } })!.type, "img");
  assert.equal(render({ media: { ...media, mime: "video/webm" } })!.type, "LoopVideo");
  assert.equal(render({ media: { ...media, mime: "application/json" } })!.type, "LottiePlayer");
  assert.equal(render({ media: { ...media, mime: "application/pdf" } }), null);
});

test("The existing 4:5 facade forwards its original root classes without an extra wrapper", () => {
  let request: Record<string, unknown> | undefined;
  const sentinel = {};
  const source = evaluate("side-media", { "./media-content": { MediaContent: (props: Record<string, unknown>) => { request = props; return sentinel; } } });
  const render = source.sideMedia as unknown as (media: unknown) => unknown;
  const media = { url: "/frame.webp" };
  assert.equal(render(media), sentinel);
  assert.equal(request!.media, media);
  assert.equal(request!.className, "aspect-[4/5] w-full rounded-sm object-cover");
  assert.equal(request!.lottieClassName, "aspect-[4/5] w-full overflow-hidden rounded-sm");
});
