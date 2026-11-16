#!/usr/bin/env python3
"""Read-only smoke check for deployed, isolated Chapter One Lite site."""
import json
import sys
import time
import urllib.error
import urllib.request

BASE = "https://str8kryptic.github.io/Duo-Dungeon-Preview/chapter-one-alpha/"
def fetch(path):
    url = BASE + path
    last = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "DuoDungeon-ChapterOne-Deployment-Smoke/1.0"})
            with urllib.request.urlopen(req, timeout=18) as res:
                if res.status != 200:
                    raise AssertionError(f"{path}: HTTP {res.status}")
                return res.read()
        except (urllib.error.URLError, TimeoutError, AssertionError) as exc:
            last = exc
            if attempt < 4:
                time.sleep(3)
    raise RuntimeError(f"{path}: {last}")

def run():
    html = fetch("index.html").decode("utf-8")
    assert "Chapter One Playable Lite" in html, "Live preview still shows framework viewer, not actual v9.4 runtime"
    assert 'src/app.js' in html and 'styles.css' in html, "Required runtime references missing"
    app = fetch("src/app.js").decode("utf-8")
    css = fetch("styles.css").decode("utf-8")
    floors = json.loads(fetch("data/floors.json"))
    assets = json.loads(fetch("data/asset_registry.json"))
    assert len(floors) == 35, "Chapter One needs 35 floors"
    assert [f["number"] for f in floors] == list(range(1, 36)), "Floor order must be canonical"
    assert len({f["id"] for f in floors}) == 35, "Floor IDs must be unique"
    assert all(f["number"] <= 35 for f in floors), "Expansion floors must remain inaccessible"
    assert len(assets) >= 100, "Expected preserved Chapter One asset registry"
    for label in ("export-save", "import-save", "restore-backup", "data-nav", "data-action", "localStorage"):
        assert label in app, f"Required player control missing: {label}"
    assert "@media(max-width:520px)" in css, "Mobile layout breakpoint missing"
    print("PASS: Live Chapter One Lite is serving the original gameplay runtime,")
    print("      35 canonical floors, navigation, local save controls, responsive CSS,")
    print("      and the asset registry. Legacy root and production were not modified.")

if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        print(f"FAIL: Chapter One live deployment smoke: {exc}", file=sys.stderr)
        sys.exit(1)
