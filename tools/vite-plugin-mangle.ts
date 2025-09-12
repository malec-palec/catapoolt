import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { Packer } from "roadroller";
import type { Plugin } from "vite";

interface ManglePluginOptions {
  bundlePath?: string;
  optLevel?: number;
  enableTransforms?: boolean;
  enableRoadroller?: boolean;
  enableWordAnalysis?: boolean;
}

const defaultOptions: Required<ManglePluginOptions> = {
  bundlePath: "index.js",
  optLevel: 1,
  enableTransforms: true,
  enableRoadroller: true,
  enableWordAnalysis: true,
};

export const manglePlugin = (options: ManglePluginOptions = {}): Plugin => {
  const config = { ...defaultOptions, ...options };

  return {
    name: "vite-plugin-mangle",
    enforce: "pre", // Run before other plugins to ensure we can process the chunks

    renderChunk(code: string, chunk: unknown) {
      if (!config.enableTransforms) {
        return null;
      }

      // Apply code transformations similar to the original Rollup plugin
      // Be more precise with transformations to avoid breaking code
      let transformedCode = code;

      // Replace const declarations but not constructor/const in other contexts
      transformedCode = transformedCode.replace(/\bconst\s+/g, "let ");

      // Replace strict equality with loose equality
      transformedCode = transformedCode.replaceAll("===", "==");

      // Replace forEach with map (though this might change semantics)
      transformedCode = transformedCode.replace(/\bforEach\b/g, "map");

      return {
        code: transformedCode,
        map: null,
      };
    },

    async generateBundle(options, bundle) {
      // Find the main bundle file - look for any JS chunk
      const bundleFiles = Object.keys(bundle).filter(
        (fileName) => fileName.endsWith(".js") && bundle[fileName].type === "chunk",
      );

      if (bundleFiles.length === 0) {
        console.warn("⚠️  No JavaScript chunks found for processing");
        console.log("Available bundle files:", Object.keys(bundle));
        return;
      }

      // Use the specified bundle path or the first JS chunk found
      const bundleFile = bundleFiles.find((fileName) => fileName === config.bundlePath) || bundleFiles[0];
      const bundleInfo = bundle[bundleFile];

      console.log(`🔧 Processing bundle: ${bundleFile}`);
      const source = bundleInfo.code;

      // Apply Roadroller packing if enabled
      if (config.enableRoadroller) {
        try {
          console.log("🔄 Applying Roadroller compression...");

          const packer = new Packer(
            [
              {
                data: source,
                type: "js",
                action: "eval",
              },
            ],
            {},
          );

          await packer.optimize(config.optLevel);
          const { firstLine, secondLine } = packer.makeDecoder();

          // Update the bundle with compressed code
          bundleInfo.code = firstLine + secondLine;

          console.log(`✅ Roadroller compression applied with optimization level ${config.optLevel}`);
        } catch (error) {
          console.error("❌ Roadroller compression failed:", error);
        }
      }

      // Generate word analysis if enabled
      if (config.enableWordAnalysis) {
        try {
          console.log("📊 Generating word frequency analysis...");

          const matches = source.match(/\b([a-zA-Z]+?)\b/gm);

          if (matches) {
            const words = matches.reduce((obj: Record<string, number>, match: string) => {
              if (match in obj) {
                obj[match] += 1;
              } else {
                obj[match] = 1;
              }
              return obj;
            }, {});

            const wordAnalysis = Object.keys(words)
              .filter((word) => word.length > 3)
              .map((word) => `${word}:${words[word]}`)
              .sort((a, b) => b.length - a.length);

            // Write words.json to temp folder in project root instead of including in build
            try {
              const tempDir = resolve(process.cwd(), "temp");
              mkdirSync(tempDir, { recursive: true });
              const wordsFilePath = resolve(tempDir, "words.json");
              writeFileSync(wordsFilePath, JSON.stringify(wordAnalysis, null, 2), "utf-8");
              console.log(`✅ Word analysis complete: ${wordAnalysis.length} words analyzed`);
              console.log(`📄 Words.json saved to: ${wordsFilePath}`);
            } catch (writeError) {
              console.error("❌ Failed to write words.json to temp folder:", writeError);
            }
          }
        } catch (error) {
          console.error("❌ Word analysis failed:", error);
        }
      }
    },
  };
};

export default manglePlugin;
