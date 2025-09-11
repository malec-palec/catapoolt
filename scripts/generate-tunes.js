import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const parsePico8File = (filePath) => {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  let sfxSection = false;
  let musicSection = false;
  const sfxLines = [];
  const musicLines = [];

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

const generateTunesFile = (data, outputPath) => {
  const content = `export const sfx = 
\`${data.sfx}\`;
export const music = 
\`${data.music}\`;`;

  // Ensure the directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, content, "utf-8");
};

const generateEmptyTunesFile = (outputPath) => {
  const content = `export const sfx = "";
export const music = "";`;

  // Ensure the directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, content, "utf-8");
};

const main = async () => {
  const projectRoot = resolve(__dirname, "..");
  const assetsPath = resolve(projectRoot, "assets");
  const outputPath = resolve(projectRoot, "src", "tunes.ts");

  try {
    // Check if assets directory exists
    if (!existsSync(assetsPath)) {
      console.log("📁 Assets folder not found, generating empty tunes.ts");
      generateEmptyTunesFile(outputPath);
      return;
    }

    const fs = await import("fs");
    const files = fs.readdirSync(assetsPath);
    const p8File = files.find((file) => file.endsWith(".p8"));

    if (p8File) {
      const p8FilePath = resolve(assetsPath, p8File);
      console.log(`🎵 Generating tunes.ts from ${p8File}`);

      const pico8Data = parsePico8File(p8FilePath);
      generateTunesFile(pico8Data, outputPath);

      console.log(
        `✅ Generated tunes.ts with ${pico8Data.sfx.split("\n").length} SFX and ${pico8Data.music.split("\n").length} music tracks`,
      );
    } else {
      console.log("📁 No .p8 file found in assets folder, generating empty tunes.ts");
      generateEmptyTunesFile(outputPath);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    console.log("📁 Generating empty tunes.ts as fallback");
    generateEmptyTunesFile(outputPath);
  }
};

main().catch(console.error);
