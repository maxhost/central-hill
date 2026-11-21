import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHarness } from "./harness.mjs";
import { playerNetwork } from "./player-network.mjs";
const h = await createHarness("lazy-diagnostic");
const { b, root, publicPage, box, record, finish } = h;
try {
  await record("image-page-lazy-player", async () => {
    const c = await b.newContext();
    const network = playerNetwork(c);
    const p = await publicPage("en", { context: c });
    await box(p, "image-lazy-diagnostic", { ready: true });
    await p.waitForTimeout(1000);
    const details = await network();
    const observation = {
      ...details,
      canvasCount: await p.locator("canvas").count(),
      welcomeImages: await p.locator("[data-intro-media-frame] img").count(),
    };
    await fs.writeFile(
      root + "/welcome-qa/lazy-observation.json",
      JSON.stringify(observation, null, 2),
    );
    await c.close();
    assert.equal(
      details.playerPayloads.length,
      0,
      "image page must not download actual Lottie player payload",
    );
    assert.equal(details.wasmRequests.length, 0, "no Lottie WASM request");
    return observation;
  });
} finally {
  await finish();
}
