import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // e2e/ é do Playwright (npm run e2e), contra a pilha no ar.
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], exclude: [...configDefaults.exclude, "e2e/**"] },
});
