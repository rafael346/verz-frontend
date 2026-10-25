import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // e2e/ é Playwright, não React: o `use` dos fixtures não é o hook `use` do React.
  { files: ["e2e/**"], rules: { "react-hooks/rules-of-hooks": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Gerados pelo Playwright a cada execução da suíte ponta a ponta.
    "playwright-report/**",
    "e2e/test-results/**",
  ]),
]);

export default eslintConfig;
