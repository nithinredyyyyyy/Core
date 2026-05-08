$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $root "dist"
$assetsDir = Join-Path $distDir "assets"
$publicDir = Join-Path $root "public"
$tempEntry = Join-Path $PSScriptRoot ".build-main.jsx"
$tempCss = Join-Path $assetsDir "index.css"
$tempJs = Join-Path $assetsDir "index.js"
$tailwindCli = Join-Path $root "node_modules\tailwindcss\lib\cli.js"
$esbuildExe = Join-Path $root "node_modules\@esbuild\win32-x64\esbuild.exe"

if (Test-Path $distDir) {
  Remove-Item -Recurse -Force $distDir
}

New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

if (Test-Path $publicDir) {
  Copy-Item -Path (Join-Path $publicDir "*") -Destination $distDir -Recurse -Force
}

$mainLines = Get-Content (Join-Path $root "src\main.jsx")
$entryLines = ($mainLines | Where-Object { $_ -notmatch "index\.css" }) -join [Environment]::NewLine
[System.IO.File]::WriteAllText($tempEntry, $entryLines, [System.Text.UTF8Encoding]::new($false))

try {
  & node $tailwindCli -i (Join-Path $root "src\index.css") -o $tempCss --minify

  & $esbuildExe $tempEntry `
    --bundle `
    --format=esm `
    --platform=browser `
    --jsx=automatic `
    --outdir=$assetsDir `
    --entry-names=index `
    --chunk-names=chunk-[name]-[hash] `
    --asset-names=asset-[name]-[hash] `
    --public-path=/assets `
    --alias:@=./src `
    --loader:.js=jsx `
    --loader:.svg=file `
    --loader:.png=file `
    --loader:.jpg=file `
    --loader:.jpeg=file `
    --loader:.gif=file `
    --loader:.webp=file `
    --loader:.woff=file `
    --loader:.woff2=file `
    --loader:.ttf=file `
    --loader:.eot=file

  $html = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/images/core-logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StageCore - Control the Game. Own the Stage.</title>
    <meta
      name="description"
      content="StageCore is an esports tournament platform for tournaments, teams, matches, schedules, standings, and news."
    />
    <meta property="og:title" content="StageCore - Esports Tournament Platform" />
    <meta
      property="og:description"
      content="Control the game. Own the stage. Follow tournaments, track results, and publish esports updates."
    />
    <meta
      property="og:image"
      content="https://media.base44.com/images/public/user_68ac92df3a1b474cdb95da21/ed64a54f1_3c2ad61d-d348-4cab-be8c-56737d0aa014.png"
    />
    <link rel="stylesheet" href="/assets/index.css" />
    <script type="module" src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"@

  [System.IO.File]::WriteAllText((Join-Path $distDir "index.html"), $html, [System.Text.UTF8Encoding]::new($false))
}
finally {
  if (Test-Path $tempEntry) {
    Remove-Item -Force $tempEntry
  }
}
