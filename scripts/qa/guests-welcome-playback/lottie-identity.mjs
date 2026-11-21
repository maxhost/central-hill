import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";
const h = await createHarness("lottie-identity"),
  { req, root, persist, record, finish } = h;
try {
  for (const ext of ["json", "lottie"])
    for (const ratio of ["3-2", "2-3", "1-1", "16-9"]) {
      await record("lottie-identity-" + ratio + "-" + ext, async () => {
        const file = root + `/fixtures/lottie-${ratio}.${ext}`,
          v = await persist(file, "identity-" + ratio + "-" + ext, {
            publicWidths: [1440],
          });
        const canvas = v.out.locator("[data-intro-media-frame] canvas"),
          image = await canvas.screenshot();
        const { data, info } = await req("sharp")(image)
          .raw()
          .toBuffer({ resolveWithObject: true });
        let minX = info.width,
          maxX = 0,
          minY = info.height,
          maxY = 0,
          pixels = 0;
        for (let y = 0; y < info.height; y++)
          for (let x = 0; x < info.width; x++) {
            const k = (y * info.width + x) * info.channels;
            if (
              Math.abs(data[k] - 13) < 15 &&
              Math.abs(data[k + 1] - 128) < 20 &&
              Math.abs(data[k + 2] - 77) < 20
            ) {
              pixels++;
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        assert.ok(pixels > 100, "selected real animation draws its marker");
        const expectedDiameter =
          v.media.width *
          0.3 *
          Math.max(info.width / v.media.width, info.height / v.media.height);
        assert.ok(
          Math.abs(maxX - minX + 1 - expectedDiameter) < 4,
          "selected canvas cover width",
        );
        assert.ok(
          Math.abs(maxY - minY + 1 - expectedDiameter) < 4,
          "selected canvas cover height",
        );
        assert.ok(
          Math.abs((minY + maxY) / 2 - info.height / 2) < 2,
          "selected canvas central crop",
        );
        await v.out.close();
        return {
          ...v,
          out: undefined,
          identityVerified: true,
          render: {
            pixels,
            expectedDiameter,
            bounds: { minX, maxX, minY, maxY },
          },
        };
      });
    }
} finally {
  await finish();
}
