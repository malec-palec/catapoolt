import fs from "node:fs";
import path from "node:path";
import { Plugin } from "vite";
import { generateLevelsCode } from "./generate-levels.js";

const LEVELS_FILE_ID = "virtual:levels";
const LEVELS_TARGET = "src/screens/game/levels.ts";

export function levelsPlugin(): Plugin {
  let isDev = false;

  return {
    name: "levels-generator",
    configResolved(config) {
      isDev = config.command === "serve";
    },
    configureServer(server) {
      if (isDev) {
        // Watch raw-levels directory for changes
        const rawLevelsDir = path.resolve("raw-levels");

        server.watcher.add(rawLevelsDir);

        server.watcher.on("change", (file) => {
          if (file.includes("raw-levels") && file.endsWith(".json")) {
            console.log(`📦 Level file changed: ${path.basename(file)}`);
            updateLevelsFile();
            // Trigger HMR
            const module = server.moduleGraph.getModuleById(LEVELS_TARGET);
            if (module) {
              server.reloadModule(module);
            }
          }
        });

        server.watcher.on("add", (file) => {
          if (file.includes("raw-levels") && file.endsWith(".json")) {
            console.log(`📦 New level file added: ${path.basename(file)}`);
            updateLevelsFile();
            const module = server.moduleGraph.getModuleById(LEVELS_TARGET);
            if (module) {
              server.reloadModule(module);
            }
          }
        });

        server.watcher.on("unlink", (file) => {
          if (file.includes("raw-levels") && file.endsWith(".json")) {
            console.log(`📦 Level file removed: ${path.basename(file)}`);
            updateLevelsFile();
            const module = server.moduleGraph.getModuleById(LEVELS_TARGET);
            if (module) {
              server.reloadModule(module);
            }
          }
        });
      }
    },
    buildStart() {
      // Generate levels.ts at build start
      updateLevelsFile();
    },
    load(id) {
      if (id === LEVELS_FILE_ID) {
        return generateLevelsCode();
      }
    },
    resolveId(id) {
      if (id === LEVELS_FILE_ID) {
        return id;
      }
    },
  };
}

function updateLevelsFile(): void {
  try {
    const levelsCode = generateLevelsCode();
    fs.writeFileSync(LEVELS_TARGET, levelsCode);
    console.log("✅ Generated levels.ts with compressed level data");
  } catch (error) {
    console.error("❌ Failed to generate levels.ts:", error);
  }
}
