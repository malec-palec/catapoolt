import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { viteSingleFile } from "vite-plugin-singlefile";
import packageJson from "./package.json";
import { pico8Plugin } from "./vite-plugin-pico8";

export default defineConfig({
  base: "./",
  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
  },
  plugins: [
    pico8Plugin(),
    viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true }),
    createHtmlPlugin({ minify: true }),
    {
      name: "final-transformations",
      enforce: "post",
      renderChunk: async (code: string) => {
        return {
          code: code.replaceAll("const ", "let "),
          map: null,
        };
      },
    },
  ],
  build: {
    assetsDir: ".",
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: "[name].[ext]", // Keep original asset names
      },
    },
  },
});
