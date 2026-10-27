const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[],errors=[];
 try{
  const fixture=JSON.parse(fs.readFileSync('development/runtime/packaging-history-state.json','utf8'));
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/')return route.fulfill({contentType:'text/html',body:fs.readFileSync('development/runtime/closing-preview.html','utf8')});
   if(path.startsWith('/js/')||path.startsWith('/css/'))return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync('working/pweyon/public'+path)});
   return route.fulfill({status:422,contentType:'application/json',body:'{"message":"Read-only UI test"}'});
  });
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:950});await page.goto('https://pwe.test/');await page.waitForFunction(()=>!!window.pwePagination);
   await page.evaluate(fixture=>{
    state.packagingTransactions=pweHydrate({items:[fixture.snapshot,fixture.legacy]}).items;
    workView=null;workDirty=false;page='inventory';invTab='packages';render();
   },fixture);
   const rows=page.locator('.ph2-history-table tbody tr');assert.equal(await rows.count(),2);
   for(let i=0;i<2;i++){
    const text=await rows.nth(i).innerText();
    for(const expected of ['Sesame','Trader','Main','20 viss','200','10','100',fixture.snapshot.history2.sourceReceiptNo])assert.ok(text.includes(expected),'Missing '+expected+' at '+width);
   }
   await page.evaluate(()=>openPackagingHistoryDetail2(0));
   const detail=await page.locator('.ph2-detail').innerText();
   for(const expected of ['Sesame','Trader','Main','300','200','100','20 viss','10',fixture.snapshot.history2.sourceReceiptNo])assert.ok(detail.includes(expected));
   await page.evaluate(()=>backPackagingHistory2());assert.equal(await page.locator('.ph2-history-table tbody tr').count(),2);
   await page.evaluate(()=>{
    const original=state.packagingTransactions[0];state.packagingTransactions=Array.from({length:65},(_,i)=>({...original,id:String(1000+i)}));renderInventoryBody();
   });
   assert.equal(await page.locator('.ph2-history-table tbody tr:visible').count(),30);
   await page.locator('.pwe-pagination button').nth(1).click();assert.equal(await page.locator('.ph2-history-table tbody tr:visible').count(),30);
   await page.locator('.pwe-pagination button').nth(1).click();assert.equal(await page.locator('.ph2-history-table tbody tr:visible').count(),5);
   results.push(width+'px: real projected snapshot and legacy fields render in table/detail, back navigation works, and all 65 packaging records remain reachable at 30/30/5');
  }
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/packaging-history-browser.json',JSON.stringify({passed:!errors.length,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
