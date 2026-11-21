/** Turbopack may preload a tiny async loader; distinguish it from the actual player payload. */
export function playerNetwork(context) {
  const requests = [],
    chunks = [],
    pending = [];
  context.on("request", (request) =>
    requests.push({ url: request.url(), type: request.resourceType() }),
  );
  context.on("response", (response) => {
    if (response.request().resourceType() !== "script") return;
    pending.push(
      (async () => {
        try {
          const body = await response.text();
          if (
            /dotlottie.web/i.test(response.url()) ||
            /DotLottiePlayerWasm|DotLottieWasmLoader/.test(body)
          )
            chunks.push({
              url: response.url(),
              bytes: body.length,
              asyncLoader:
                /ecmascript, async loader/.test(body) && body.length < 4096,
            });
        } catch {
          /* Cancelled unrelated prefetch has no payload to count. */
        }
      })(),
    );
  });
  return async () => {
    await Promise.allSettled(pending);
    return {
      requests,
      chunks,
      playerPayloads: chunks.filter((chunk) => !chunk.asyncLoader),
      wasmRequests: requests.filter((request) =>
        /dotlottie-player\.wasm/i.test(request.url),
      ),
    };
  };
}
