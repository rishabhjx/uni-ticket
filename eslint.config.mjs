import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    /**
     * Vendored ReUI components, kept close to upstream so they stay diffable
     * when the library moves. Their prop-to-state syncing trips the React
     * Compiler rules; rewriting a thousand lines of someone else's state
     * handling to satisfy a linter would invite real bugs. Code this project
     * actually authors is still held to the full rule set.
     */
    files: ["src/components/reui/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
