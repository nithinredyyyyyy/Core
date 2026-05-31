import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
}

const viteResult = run("npx", ["vite", "build", "--configLoader", "runner"]);

if (viteResult.status === 0) {
  process.exit(0);
}

if (process.platform !== "win32") {
  process.exit(viteResult.status ?? 1);
}

console.warn(
  "Vite build failed on Windows. Falling back to the PowerShell build script.",
);

const fallbackResult = run("powershell", [
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  ".\\tools\\build-fallback.ps1",
]);

process.exit(fallbackResult.status ?? 1);
