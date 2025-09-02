import fs from "node:fs";
import path from "node:path";

interface LevelData {
  layers: Array<{
    data: number[];
  }>;
}

function compress(a: number[]): string {
  let r = "",
    c = 1;
  for (let i = 1; i <= a.length; i++) {
    if (a[i] === a[i - 1] && c < 31) c++;
    else {
      r += String.fromCharCode((a[i - 1] << 5) | c);
      c = 1;
    }
  }
  return r;
}

export function generateLevelsCode(): string {
  const rawLevelsDir = path.resolve("raw-levels");
  const levelFiles = fs
    .readdirSync(rawLevelsDir)
    .filter((file) => file.endsWith(".tmj"))
    .sort();

  const compressedLevels: string[] = [];

  for (const file of levelFiles) {
    const filePath = path.join(rawLevelsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const levelData: LevelData = JSON.parse(content);

    // Extract the first layer's data (assuming single layer levels)
    const data = levelData.layers[0]?.data || [];
    const compressed = compress(data);
    compressedLevels.push(compressed);
  }

  // Generate the levels array as a string
  const levelsArray = compressedLevels.map((level) => `"${level}"`).join(", ");

  return `export default [${levelsArray}];`;
}
