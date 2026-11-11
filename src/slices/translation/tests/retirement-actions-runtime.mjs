import { registerHooks } from "node:module";
import { state } from "./retirement-actions-mocks.mjs";

const doubles = new Set(["@core/auth", "@core/i18n", "@core/revalidate"]);
const mockUrl = new URL("./retirement-actions-mocks.mjs", import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (doubles.has(specifier)) {
      if (specifier !== "@core/auth") state.dependencyLoads.push(specifier);
      return { url: mockUrl, shortCircuit: true };
    }
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
