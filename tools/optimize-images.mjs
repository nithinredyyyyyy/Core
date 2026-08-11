import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = path.join(rootDir, "public", "images");
const WEBP_QUALITY = 82;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await walk(imagesDir);
  let created = 0;
  let bytes = 0;
  for (const file of files) {
    const webpPath = file.replace(/\.(png|jpe?g)$/i, ".webp");
    try {
      const buffer = await sharp(file).webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
      await writeFile(webpPath, buffer);
      created += 1;
      bytes += buffer.length;
    } catch (error) {
      console.error(`FAILED ${path.relative(imagesDir, file)}: ${error.message}`);
    }
  }
  console.log(`Generated ${created} webp files, ${(bytes / 1048576).toFixed(1)} MB total.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
