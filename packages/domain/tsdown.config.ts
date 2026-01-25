import { defineConfig } from "tsdown";

export default defineConfig({
  dts: false,
  entry: ["src/Recurrence.ts", "src/Budget.ts", "src/Currency.ts"],
  format: "esm",
  outDir: "dist",
  outExtensions: () => ({ js: ".js" }),
});
