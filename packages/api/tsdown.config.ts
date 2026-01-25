import { defineConfig } from "tsdown";

export default defineConfig({
  dts: false,
  entry: ["src/Api.ts", "src/ApiError.ts"],
  format: "esm",
  outDir: "dist",
  outExtensions: () => ({ js: ".js" }),
});
