#!/usr/bin/env python3
"""Content signature of the BMPS 2025 GF stage, for idempotency comparison.

Hashes the stage's match identity and result values so a second apply that changed
anything would produce a different signature. Read-only.
"""
import hashlib
import sqlite3
import sys

TOUR = "843e95ec-51ab-4cff-8b1d-ceb5ebfcce1c"

db_path = sys.argv[1]
c = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
h = hashlib.sha256()
queries = [
    f"SELECT id, match_number, map, source_slug FROM matches "
    f"WHERE tournament_id='{TOUR}' AND stage='Grand Finals' ORDER BY match_number",
    f"SELECT mr.match_id, mr.team_id, mr.placement, mr.kill_points, mr.placement_points, mr.total_points "
    f"FROM match_results mr JOIN matches m ON m.id = mr.match_id "
    f"WHERE m.tournament_id='{TOUR}' AND m.stage='Grand Finals' ORDER BY mr.match_id, mr.team_id",
    f"SELECT COUNT(*) FROM matches WHERE tournament_id='{TOUR}' AND stage='Grand Finals'",
]
for q in queries:
    for row in c.execute(q):
        h.update(repr(row).encode())
print(h.hexdigest())
