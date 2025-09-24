import { advzipPlugin, defaultAdvzipOptions, defaultEctOptions, ectPlugin } from "js13k-vite-plugins";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { viteSingleFile } from "vite-plugin-singlefile";
import packageJson from "./package.json";
import { manglePlugin } from "./tools/vite-plugin-mangle";
import { pico8Plugin } from "./tools/vite-plugin-pico8";

export default defineConfig(({ command }) => ({
  base: "./",
  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      // dev → TS source
      ...(command === "serve"
        ? { "/entry/index": resolve(__dirname, "src/index.ts") }
        : // build → tsc output with inlined enums
          { "/entry/index": resolve(__dirname, "build/index.js") }),
    },
  },
  plugins: [
    pico8Plugin(),
    manglePlugin({
      optLevel: 2,
      enableTransforms: true,
      enableRoadroller: true,
      enableWordAnalysis: true,
    }),
    viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true }),
    createHtmlPlugin({ minify: true }),
    ectPlugin(defaultEctOptions),
    advzipPlugin(defaultAdvzipOptions),
  ],
  build: {
    assetsDir: ".",
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    minify: "terser",
    terserOptions: {
      mangle: {
        properties: {
          // Mangle all properties for maximum compression
          regex: /./, // This will mangle all property names
          // Keep some properties that might be accessed externally
          reserved: [
            // Canvas context properties that might be accessed
            "canvas",
            "getContext",
            "width",
            "height",
            // Event properties that might be needed
            "preventDefault",
            "stopPropagation",
            "target",
            "type",
            // Essential DOM properties
            "style",
            "cursor",
            // Audio context properties (if used)
            "AudioContext",
            "webkitAudioContext",
            // Common method names that might be called externally
            "addEventListener",
            "removeEventListener",
            // Package.json properties
            "version",
            "name",
          ],
        },
      },
      compress: {
        // Additional compression options
        drop_console: true, // Remove console.log statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ["console.log", "console.info", "console.debug"], // Remove specific function calls
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: "[name].[ext]", // Keep original asset names
      },
    },
  },
}));
