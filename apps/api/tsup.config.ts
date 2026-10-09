import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  // The shared package ships TypeScript source, so bundle it into the API.
  noExternal: ["@restfit/shared"],
});
