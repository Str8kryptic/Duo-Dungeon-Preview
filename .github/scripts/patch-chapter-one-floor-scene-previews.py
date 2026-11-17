#!/usr/bin/env python3
"""Display-only 35-floor artwork browser. Never changes progression/save state."""
from pathlib import Path
import sys
p=Path(sys.argv[1]); source=p.read_text()
changes=[
 ("let selectedFloor=null,section='home'","let selectedFloor=null,artPreviewFloor=null,section='home'"),
 ('return `<button class="${selected?', 'return `<div class="floor-art-row"><button class="${selected?'),
 ('></span></button>`;}\nfunction chapterEndingPanel','></span></button><button class="secondary floor-preview" type="button" data-art-preview="${f.number}" aria-label="View original artwork for Floor ${f.number}: ${f.name}">View Scene</button></div>`;}\nfunction chapterEndingPanel'),
 ("const floor=r.floors[selectedFloor||state.floor.highestUnlocked],image=section==='explore'?asset(floor.id):'assets/refuge-floor0.svg';app.innerHTML=","const floor=r.floors[selectedFloor||state.floor.highestUnlocked],preview=section==='explore'&&artPreviewFloor!==null?r.floors[artPreviewFloor]:null,sceneFloor=preview||floor,image=section==='explore'?asset(sceneFloor.id):'assets/refuge-floor0.svg';app.innerHTML="),
 ("${section==='explore'?floor.name:'THE REFUGE / '+section.toUpperCase()}","${section==='explore'?(preview?'ART PREVIEW · FLOOR '+sceneFloor.number+' · '+sceneFloor.name:floor.name):'THE REFUGE / '+section.toUpperCase()}"),
 ("${section==='explore'?'Objective: '+floor.objective:'Crafting, survival and travel converge here.'}","${section==='explore'?(preview?'Artwork preview only — gameplay remains on Floor '+floor.number+'.': 'Objective: '+floor.objective):'Crafting, survival and travel converge here.'}"),
 ("[data-nav],[data-action],[data-inspect],[data-floor],#close-modal,#modal-back","[data-nav],[data-action],[data-inspect],[data-floor],[data-art-preview],#close-modal,#modal-back"),
 ("if(b.dataset.inspect){inspect(b.dataset.inspect);return;}if(b.dataset.floor){","if(b.dataset.inspect){inspect(b.dataset.inspect);return;}if(b.dataset.artPreview){const n=Number(b.dataset.artPreview);if(Number.isInteger(n)&&n>=1&&n<=35&&r.floors[n]){artPreviewFloor=n;notice='Viewing original Floor '+n+' artwork (preview only; progression unchanged).';render();}return;}if(b.dataset.floor){"),
 ("selectedFloor=num;notice=","selectedFloor=num;artPreviewFloor=null;notice="),
]
for old,new in changes:
  matches=source.count(old)
  if matches!=1:raise RuntimeError(f"Art-preview guard: expected 1 occurrence, found {matches}, snippet {old[:64]!r}")
  source=source.replace(old,new,1)
p.write_text(source)
assert source.count('data-art-preview')==2
print("PASS: 35 original floor art images can be previewed without unlocking floors")
