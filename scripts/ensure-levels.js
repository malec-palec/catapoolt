import fs from "node:fs";
import path from "node:path";

const targetDir = path.join("src", "screens", "game");
const targetFile = path.join(targetDir, "levels.ts");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (!fs.existsSync(targetFile)) {
  fs.writeFileSync(targetFile, "export default [];");
  console.log("✅ Created empty levels.ts file");
}
