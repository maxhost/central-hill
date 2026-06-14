import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// eslint-config-next v16 ships native flat configs (Linter.Config[]); consume
// them directly. The legacy FlatCompat path crashes on their plugin objects.
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "drizzle/**"],
  },
];

export default config;
