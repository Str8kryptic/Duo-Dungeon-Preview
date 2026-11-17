"use strict";
/* QA: every original floor background must be visible on the REAL live browser,
   even while gameplay remains at the first unlocked floor. Read-only except
   UI state; never writes saves or unlocks a floor. */
const assert=require("node:assert/strict");
const cp=require("node:child_process");
const {chromium}=require("playwright-core");
const base="https://str8kryptic.github.io/Duo-Dungeon-Preview/chapter-one-alpha/";
(async()=>{
  const binary=cp.execSync("command -v google-chrome || command -v chromium || command -v chromium-browser",{encoding:"utf8"}).trim().split("\n")[0];
  const browser=await chromium.launch({headless:true,executablePath:binary,args:["--no-sandbox","--disable-dev-shm-usage"]});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(base,{waitUntil:"networkidle",timeout:60000});
    await page.locator('button[data-nav="explore"]').click();
    await page.waitForSelector('[data-art-preview="35"]',{timeout:15000});
    assert.equal(await page.locator('[data-art-preview]').count(),35,"All 35 floor art preview controls must exist");
    const locked=page.locator('button[data-floor="2"]');
    assert.equal(await locked.isDisabled(),true,"Floor 2 gameplay must remain locked");
    const saveBefore=await page.evaluate(()=>JSON.stringify({...localStorage}));
    for (const i of [1,2,3,4,5,9,10,20,35]){
      await page.locator('[data-art-preview="'+i+'"]').click();
      const id=await page.evaluate(()=>document.querySelector('.scene>img')?.getAttribute('src'));
      assert.equal(id,await page.evaluate(i=>{
        const name=String(i).padStart(2,"0");
        const f=[...document.querySelectorAll('[data-floor]')].find(x=>Number(x.dataset.floor)===i);
        const preview=f?.querySelector('img')?.getAttribute('src')||'';
        return preview;
      },i),"Big image must match the floor card's own original art for Floor "+i);
      assert.ok(id.includes('.webp'),"Floor "+i+" must load original v9.6 art, got "+id);
      const result=await page.locator('.scene>img').evaluate(async image=>{
        if (!image.complete) await new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});});
        return {width:image.naturalWidth,height:image.naturalHeight};
      });
      assert.ok(result.width>100&&result.height>100,"Floor "+i+" artwork must fully load");
      assert.equal(await locked.isDisabled(),true,"Viewing art cannot unlock Floor 2");
      console.log("PASS floor",i,id,result.width+"x"+result.height);
    }
    assert.equal(await page.evaluate(()=>JSON.stringify({...localStorage})),saveBefore,"Artwork browsing must never change save data");
    await page.locator('button[data-floor="1"]').click();
    assert.ok((await page.locator('.scene>img').getAttribute("src")).includes('flr_01_cryo_spillway.webp'),"Returning to gameplay must show the active floor");
    await page.locator('button[data-nav="home"]').click();
    assert.equal(await page.locator('.scene>img').getAttribute('src'),'assets/refuge-floor0.svg',"Refuge must show its own scene");
    console.log("PASS original floor art browser: image matched each floor, every image loaded, saves and locks unchanged, Refuge restored");
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
