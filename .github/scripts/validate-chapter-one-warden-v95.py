#!/usr/bin/env python3
"""Verify approved Floor 9 art in an extracted v9.5 release. Read-only."""
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
registry = json.loads((root / "data/asset_registry.json").read_text())
enemy = [a for a in registry if a.get("entityId") == "enm_warden_enforcer"]
assert len(enemy) == 1
a = enemy[0]
assert a["id"] == "asset_enm_warden_enforcer"
assert a["path"] == "assets/enemies/enm_warden_enforcer.png"
assert a["status"] == "production_approved" and a["reviewApproved"] is True
master = root / a["path"]
assert master.is_file()
assert hashlib.sha256(master.read_bytes()).hexdigest() == "a6a4a03905e66f6207b8055f4ee468d0bac1516369a76ed6b2682aca350ab81a"
for size in ("128", "256"):
    assert (root / a["thumbnails"][size]).is_file(), f"Missing {size} thumbnail"
floors = json.loads((root / "data/floors.json").read_text())
assert floors[8]["enemyIds"] == ["enm_warden_enforcer"] and len(floors) == 35
entity_art = {a["entityId"]: a for a in registry}
for floor in floors[:10]:
    for eid in floor["enemyIds"]:
        assert entity_art[eid]["path"].endswith(".png"), f"Missing generated enemy art {eid}"
        assert (root / entity_art[eid]["path"]).is_file()
print("PASS: Floor 9 original master and thumbnails; all ten floor enemy PNGs; 35-floor identities")
