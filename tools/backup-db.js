import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "server", "data");
const backupDir = path.join(dataDir, "backups");
const dbPath = path.join(dataDir, "stagecore.sqlite");

fs.mkdirSync(backupDir, { recursive: true });

const dateStr = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
const backupFileName = "stagecore-" + dateStr + ".sqlite";
const backupFilePath = path.join(backupDir, backupFileName);

try {
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupFilePath);
    console.log("[Backup Success] Copied stagecore.sqlite to " + backupFilePath);
    
    const files = fs.readdirSync(backupDir).filter(f => f.startsWith("stagecore-") && f.endsWith(".sqlite"));
    if (files.length > 7) {
        files.sort();
        const toDelete = files.slice(0, files.length - 7);
        for (const file of toDelete) {
            fs.unlinkSync(path.join(backupDir, file));
            console.log("[Backup Cleanup] Deleted old backup " + file);
        }
    }
  } else {
    console.error("[Backup Error] Source database not found at " + dbPath);
    process.exit(1);
  }
} catch (error) {
  console.error("[Backup Error] Failed to copy database:", error);
  process.exit(1);
}
