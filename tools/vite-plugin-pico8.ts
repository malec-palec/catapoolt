import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "path";
import type { Plugin } from "vite";

interface Pico8Data {
  sfx: string;
  music: string;
}

const parsePico8File = (filePath: string): Pico8Data => {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let sfxSection = false;
  let musicSection = false;
  const sfxLines: string[] = [];
  const musicLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("__sfx__")) {
      sfxSection = true;
      musicSection = false;
      continue;
    }

    if (line.startsWith("__music__")) {
      sfxSection = false;
      musicSection = true;
      continue;
    }

    if (line.startsWith("__")) {
      sfxSection = false;
      musicSection = false;
      continue;
    }

    if (sfxSection && line.trim()) {
      sfxLines.push(line);
    }

    if (musicSection && line.trim()) {
      musicLines.push(line);
    }
  }

  return {
    sfx: sfxLines.join("\n"),
    music: musicLines.join("\n"),
  };
};

const generateTunesFile = (data: Pico8Data, outputPath: string): void => {
  const content = `export const sfx = 
\`${data.sfx}\`;
export const music = 
\`${data.music}\`;`;

  writeFileSync(outputPath, content, "utf-8");
};

export const pico8Plugin = (): Plugin => {
  return {
    name: "vite-plugin-pico8",
    buildStart() {
      // Find the .p8 file in assets folder
      const assetsPath = resolve("assets");

      try {
        if (!existsSync(assetsPath)) {
          console.warn("⚠️  Assets folder not found");
          return;
        }

        const files = readdirSync(assetsPath);
        const p8File = files.find((file: string) => file.endsWith(".p8"));

        if (p8File) {
          const p8FilePath = resolve(assetsPath, p8File);
          const outputPath = resolve("src", "tunes.ts");

          console.log(`🎵 Generating tunes.ts from ${p8File}`);

          const pico8Data = parsePico8File(p8FilePath);
          generateTunesFile(pico8Data, outputPath);

          console.log(
            `✅ Generated tunes.ts with ${pico8Data.sfx.split("\n").length} SFX and ${pico8Data.music.split("\n").length} music tracks`,
          );
        } else {
          console.warn("⚠️  No .p8 file found in assets folder");
        }
      } catch (error) {
        console.error("❌ Error reading assets folder:", error);
      }
    },
  };
};
