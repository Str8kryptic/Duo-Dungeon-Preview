// Duo Dungeon — Scriptable Save Export
// Run this in Scriptable on the iPhone that currently has your DuoFolds saves.
// It reads the existing files and creates one JSON bundle for the browser importer.
const fm=FileManager.local();
const folder=fm.joinPath(fm.documentsDirectory(),"DuoFolds");
const names=["duo-log.json","dungeon-game.json","dungeon-rewards.json"];
const bundle={format:"duo-dungeon-scriptable-export",version:1,exportedAt:new Date().toISOString(),files:{}};
for(const name of names){
  const path=fm.joinPath(folder,name);
  if(fm.fileExists(path)){
    try{bundle.files[name]=JSON.parse(fm.readString(path));}
    catch(e){throw new Error("Could not read "+name+": "+e.message);}
  }else{
    bundle.files[name]=null;
  }
}
if(!bundle.files["duo-log.json"])throw new Error("duo-log.json was not found. Check Scriptable's DuoFolds folder.");
if(!bundle.files["dungeon-game.json"])throw new Error("dungeon-game.json was not found. Check Scriptable's DuoFolds folder.");
const output=JSON.stringify(bundle,null,2);
const outPath=fm.joinPath(fm.documentsDirectory(),"DuoDungeon-Export.json");
fm.writeString(outPath,output);
QuickLook.present(output);
await ShareSheet.present([outPath]);
