import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to increment the patch version in package.json before deployment
 * This ensures every deployment has a unique version number
 */

const packageJsonPath = path.join(__dirname, "..", "package.json");

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  // Parse current version
  const currentVersion = packageJson.version;
  const versionParts = currentVersion.split(".");

  if (versionParts.length !== 3) {
    throw new Error(`Invalid version format: ${currentVersion}. Expected format: x.y.z`);
  }

  // Increment patch version (the third number)
  const major = parseInt(versionParts[0]);
  const minor = parseInt(versionParts[1]);
  const patch = parseInt(versionParts[2]) + 1;

  const newVersion = `${major}.${minor}.${patch}`;

  // Update package.json
  packageJson.version = newVersion;

  // Write back to package.json with proper formatting
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf8");

  console.log(`✅ Version incremented: ${currentVersion} → ${newVersion}`);
} catch (error) {
  console.error("❌ Error incrementing version:", error.message);
  process.exit(1);
}
