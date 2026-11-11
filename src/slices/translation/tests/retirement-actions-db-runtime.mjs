import { registerHooks } from "node:module";

// Only authentication is doubled. The SQL connection and i18n reads/writes stay real.
const authUrl = new URL("./retirement-actions-mocks.mjs", import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    if (specifier === "@core/auth") {
      return { url: authUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
