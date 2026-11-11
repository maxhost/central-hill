import { registerHooks } from "node:module";

// Auth is a unit-test double. The SQL connection and every i18n read/write stay real.
const paths = {
  "@core/auth": "./retirement-actions-mocks.mjs",
  "@slices/apartments/contract": "./retirement-actions-apartment-parent.mjs",
  "@slices/settings/contract": "./retirement-actions-settings-policy.mjs",
  "@slices/blog/contract": "../../blog/server/editorial-translation-policy.ts",
  "@slices/buildings/contract": "../../buildings/server/editorial-translation-policy.ts",
  "@slices/guides/contract": "../../guides/server/editorial-translation-policy.ts",
  "@slices/pages/contract": "../../pages/server/editorial-translation-policy.ts",
  "@slices/testimonials/contract": "../../testimonials/server/editorial-translation-policy.ts",
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    if (Object.hasOwn(paths, specifier)) {
      return {
        url: new URL(paths[specifier], import.meta.url).href,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});
