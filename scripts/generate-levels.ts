import fs from "node:fs";
import path from "node:path";

interface LevelData {
  height: number;
  width: number;
  tilewidth: number;
  tileheight: number;
  layers: Array<{
    data: number[];
    name: string;
    objects?: Array<{
      name: string;
      x: number;
      y: number;
    }>;
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

  const levels: Array<{ map: string; items: Record<string, number> }> = [];

  for (const file of levelFiles) {
    const filePath = path.join(rawLevelsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const levelData: LevelData = JSON.parse(content);

    const { layers } = levelData;
    const data = layers[0]?.data || [];
    const map = compress(data);

    const objLayer = layers.find((layer) => layer.name === "objs");
    const items = (objLayer?.objects || []).reduce<Record<string, number>>((acc, object) => {
      acc[object.name] = getCellIndex(object.x, object.y, levelData.tilewidth, levelData.height);
      return acc;
    }, {});

    levels.push({ map, items });
  }

  const levelsContent = levels.map((level) => `{map:"${level.map}",items:${JSON.stringify(level.items)}}`).join(", ");

  return `export default [${levelsContent}];`;
}

function getCellIndex(x: number, y: number, cellSize: number, cols: number): number {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  return row * cols + col;
}

export function getCellCoordinates(index: number, cellSize: number, cols: number): { x: number; y: number } {
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: col * cellSize,
    y: row * cellSize,
  };
}
