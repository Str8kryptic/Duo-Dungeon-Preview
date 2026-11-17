#!/usr/bin/env python3
"""Visual-only patch: use the preserved clean-slate Refuge art on ALL hub screens."""
from pathlib import Path
import sys

p=Path(sys.argv[1])
js=p.read_text()
needle="image=section==='explore'?asset(floor.id):"
target="image=section==='explore'?asset(floor.id):'assets/refuge-floor0.svg'"
assert js.count(needle)==1, "Unexpected app.js scene selector: stop before changing gameplay"
start=js.index(needle)
end=js.index(";app.innerHTML=",start)
current=js[start:end]
if current!=target:
    # Only replace the scene image expression: preserve controls and all gameplay.
    assert current.startswith(needle)
    js=js[:start]+target+js[end:]
    p.write_text(js)
assert target in js
print("PASS: clean-slate Refuge art in home/station panels; original floor art in exploration")
