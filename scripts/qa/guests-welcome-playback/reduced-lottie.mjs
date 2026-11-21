import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createHarness } from "./harness.mjs";
import { playerNetwork } from "./player-network.mjs";
const h = await createHarness("reduced-lottie-diagnostic"),
  { b, publicPage, box, artifact, record, finish } = h;
try {
  await record("lottie-reduced-motion-real-canvas", async () => {
    const c = await b.newContext({ reducedMotion: "reduce" }),
      network = playerNetwork(c),
      p = await publicPage("en", { context: c });
    const consoleEvents = [],
      pageErrors = [];
    p.on("console", (m) => {
      if (m.type() === "error") consoleEvents.push(m.text());
    });
    p.on("pageerror", (e) => pageErrors.push(e.message));
    await p.locator("[data-intro-media-frame]").scrollIntoViewIfNeeded();
    await p.waitForTimeout(2000);
    const measurement = await box(p, "lottie-reduced-diagnostic");
    const pixels = await p
      .locator("[data-intro-media-frame] canvas")
      .evaluate((e) => {
        const data = e
          .getContext("2d")
          .getImageData(0, 0, e.width, e.height).data;
        let nontransparent = 0,
          green = 0;
        for (let k = 0; k < data.length; k += 4) {
          if (data[k + 3]) nontransparent++;
          if (data[k + 1] > 80 && data[k + 1] < 170 && data[k + 3] > 200)
            green++;
        }
        return {
          width: e.width,
          height: e.height,
          nontransparent,
          green,
          preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      });
    const a = await p.locator("[data-intro-media-frame] canvas").screenshot();
    await p.waitForTimeout(700);
    const z = await p.locator("[data-intro-media-frame] canvas").screenshot();
    const observation = {
      measurement,
      pixels,
      stable: a.equals(z),
      network: await network(),
      consoleEvents,
      pageErrors,
    };
    await fs.writeFile(
      artifact + "/lottie-reduced-observation.json",
      JSON.stringify(observation, null, 2),
    );
    await c.close();
    assert.ok(
      pixels.nontransparent > 100,
      "actual first drawing must be present",
    );
    assert.ok(pixels.green > 100, "known green marker must be painted");
    assert.equal(observation.stable, true, "real first frame must hold");
    assert.equal(pageErrors.length, 0);
    return observation;
  });
} finally {
  await finish();
}
