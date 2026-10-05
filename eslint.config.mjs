import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// eslint-config-next v16 ships native flat configs (Linter.Config[]); consume
// them directly. The legacy FlatCompat path crashes on their plugin objects.
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    // ".claude/worktrees/**" excludes isolated agent worktrees living inside the repo
    // tree (see docs/component-extraction-workflow.md) — each has its own .next/
    // node_modules that would otherwise get swept into this flat-config scan, since
    // the plain ".next/**"/"node_modules/**" globs below only match at the repo root.
    ignores: [".next/**", "node_modules/**", "drizzle/**", ".claude/worktrees/**"],
  },
];

export default config;
