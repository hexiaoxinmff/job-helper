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
    // Sandbox build temp dirs (never lint generated artifacts)
    ".build-tmp/**",
    "_jb_build/**",
    // Build-time tool scripts (CommonJS, not part of the app bundle)
    "scripts/*.cjs",
    // CloudBase cloud functions (standalone Node.js deployments, CommonJS)
    "cloudfunctions/**",
  ]),
]);

export default eslintConfig;
