import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [path.resolve(__dirname, "tests", "setup.js")],
    testTimeout: 20000,
  },
});
