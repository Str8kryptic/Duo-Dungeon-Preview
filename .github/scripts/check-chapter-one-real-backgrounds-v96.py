#!/usr/bin/env python3
"""Validate that v9.6 uses all 35 ORIGINAL Figma-exported floor PNGs' web derivatives.

The original source master bytes remain in the archival v9.4 release. This
checks the derivative file identities and SHA-256 recorded during derivation.
"""
import hashlib
import json
import pathlib
import sys

root=pathlib.Path(sys.argv[1])
floor_records=json.loads((root/'data/floors.json').read_text())
registry=json.loads((root/'data/asset_registry.json').read_text())
audit=json.loads((root/'FLOOR_01_35_WEB_ART_AUDIT_v9_6.json').read_text())
assert len(floor_records)==len(audit)==35, 'Expected 35 original floor scenes'
ref={r['entityId']:r for r in registry}
for i,(floor,rec) in enumerate(zip(floor_records,audit),start=1):
    assert floor['number']==i and rec['floor']==i and floor['id']==rec['id'], f'Floor ID/order mismatch {i}'
    art=ref[floor['id']]
    assert art['path']==rec['webPath']==f'assets/floors/{floor["id"]}.webp'
    assert art['sourceMasterSha256']==rec['pngSha256']
    assert art['webPreviewSha256']==rec['webSha256']
    web=root/art['path']
    assert web.is_file() and web.stat().st_size==rec['webBytes']
    assert hashlib.sha256(web.read_bytes()).hexdigest()==rec['webSha256'],f'Wrong derivative bytes {i}'
    assert web.read_bytes()[:4]==b'RIFF' and web.read_bytes()[8:12]==b'WEBP', f'Not a WebP image {i}'
assert (root/'src/app.js').read_text().count("image=section==='explore'?asset(floor.id):'assets/refuge-floor0.svg'")==1
print('PASS: all 35 original Floor 1-35 image derivatives and independent Refuge reference verified')
