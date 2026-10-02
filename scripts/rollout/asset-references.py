"""Read-only proof for the 313 images removed by the audit.

Usage: python3 scripts/rollout/asset-references.py BASELINE FINAL OUTPUT.json
Scans every tracked blob (including Android/configs), SQLite bytes and every text
cell. Reports dynamic image builders separately for human review. No checkout or
application database is modified. Filename matches deliberately overapproximate.
"""
import fnmatch
import hashlib
import json
import re
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import quote, unquote

BASE, FINAL, OUTPUT = sys.argv[1:]
REMOVAL = "836f188"


def git(*args):
    return subprocess.check_output(["git", *args])


# Resolve symbolic refs once: a concurrent local commit cannot change the tree
# halfway through a proof or make its revision label disagree with its blobs.
BASE = git("rev-parse", BASE).decode().strip()
FINAL = git("rev-parse", FINAL).decode().strip()


def glob_matches(filename, pattern):
    # Vite's globstar includes zero directory segments; Python fnmatch does not.
    return fnmatch.fnmatch(filename, pattern) or (
        "**/" in pattern and fnmatch.fnmatch(filename, pattern.replace("**/", ""))
    )


assert glob_matches("images/example.png", "images/**/*")
assert glob_matches("images/nested/example.png", "images/**/*")
assert not glob_matches("other/example.png", "images/**/*")

removed = [p for p in git("diff-tree", "--no-commit-id", "--name-only", "--diff-filter=D", "-r", REMOVAL).decode().splitlines()
           if p.startswith("public/images/") and Path(p).suffix.lower() in (".png", ".jpg", ".jpeg")]
assert len(removed) == 313, len(removed)
needles = {p: {Path(p).name, p, p.removeprefix("public"), quote(Path(p).name), json.dumps(Path(p).name)[1:-1]} for p in removed}
report = {"baseline": git("rev-parse", BASE).decode().strip(), "final": git("rev-parse", FINAL).decode().strip(),
          "method": __doc__, "images": [{"path": p, "revisions": {}} for p in removed], "dynamic": {}, "coverage": {}}

for ref in (BASE, FINAL):
    matches = {p: [] for p in removed}
    paths = git("ls-tree", "-rz", ref).split(b"\0")
    dynamic = []
    text_files = sqlite_files = text_cells = 0
    inventory = []
    for entry in paths:
        if not entry:
            continue
        meta, raw_path = entry.split(b"\t", 1)
        filename = raw_path.decode()
        mode, kind, oid = meta.decode().split()
        if kind != "blob":
            continue
        blob = git("cat-file", "blob", oid)
        inventory.append({"path": filename, "sha256": hashlib.sha256(blob).hexdigest()})
        if blob.startswith(b"SQLite format 3"):
            sqlite_files += 1
            for p, variants in needles.items():
                if any(n.encode() in blob for n in variants):
                    matches[p].append({"file": filename, "kind": "sqlite-bytes"})
            with tempfile.TemporaryDirectory() as tmp:
                dbpath = Path(tmp) / "snapshot.sqlite"
                dbpath.write_bytes(blob)
                con = sqlite3.connect(f"file:{dbpath}?mode=ro", uri=True)
                for (table,) in con.execute("SELECT name FROM sqlite_master WHERE type='table'"):
                    escaped = '"' + table.replace('"', '""') + '"'
                    cursor = con.execute(f"SELECT * FROM {escaped}")
                    cols = [d[0] for d in cursor.description]
                    for row_index, row in enumerate(cursor):
                        for col, value in zip(cols, row):
                            if not isinstance(value, str):
                                continue
                            text_cells += 1
                            for p, variants in needles.items():
                                if any(n in unquote(value) for n in variants):
                                    matches[p].append({"file": filename, "kind": "sqlite-text", "table": table, "column": col, "rowIndex": row_index})
                con.close()
            continue
        if b"\0" in blob:
            continue
        try:
            content = blob.decode("utf8")
        except UnicodeDecodeError:
            continue
        text_files += 1
        if filename == "vite.config.js":
            include = re.search(r"includeAssets:\s*\[([^]]*)\]", content, re.S)
            for pattern in re.findall(r"[\"']([^\"']+)[\"']", include.group(1) if include else ""):
                for p in removed:
                    if glob_matches(p.removeprefix("public/"), pattern):
                        matches[p].append({"file": filename, "kind": "pwa-includeAssets-glob", "pattern": pattern})
        for number, line in enumerate(content.splitlines(), 1):
            normalized = unquote(line.replace("\\/", "/"))
            for p, variants in needles.items():
                if any(n in normalized for n in variants):
                    matches[p].append({"file": filename, "kind": "text", "line": number})
            if re.search(r"images/|image.*(?:replace|join)|(?:png|webp|jpe?g).*replace", line, re.I) and re.search(r"\$\{|\+|replace|join|import\.meta\.glob", line):
                dynamic.append({"file": filename, "line": number, "source": line.strip()[:500], "lineSha256": hashlib.sha256(line.encode()).hexdigest()})
    for image in report["images"]:
        p = image["path"]
        metadata = next((item for item in inventory if item["path"] == p), None)
        image["revisions"][ref] = {"present": metadata is not None, "sha256": metadata["sha256"] if metadata else None, "references": matches[p]}
    report["dynamic"][ref] = dynamic
    report["coverage"][ref] = {"trackedBlobs": len(inventory), "textFiles": text_files, "sqliteFiles": sqlite_files, "sqliteTextCells": text_cells,
                                "inventorySha256": hashlib.sha256(json.dumps(inventory, sort_keys=True).encode()).hexdigest()}
Path(OUTPUT).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"images": len(removed), "referencedImages": sum(any(v["references"] for v in i["revisions"].values()) for i in report["images"]), "coverage": report["coverage"]}, indent=2))

missing = [i["path"] for i in report["images"] if not i["revisions"][FINAL]["present"] and any(v["references"] for v in i["revisions"].values())]
if missing:
    print("FAIL: referenced deleted images remain absent:", len(missing))
    sys.exit(1)
