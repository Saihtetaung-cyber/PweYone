const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/')return route.fulfill({contentType:'text/html',body:fs.readFileSync('development/runtime/closing-preview.html','utf8')});
   if(path.startsWith('/js/')||path.startsWith('/css/'))return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync('working/pweyon/public'+path)});
   return route.fulfill({status:422,contentType:'application/json',body:'{"message":"Read-only UI fixture"}'});
  });
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});await page.goto('https://pwe.test/');await page.waitForFunction(()=>!!window.pwePagination);
   await page.evaluate(()=>{
    const base=state.receipts[0];state.receipts=Array.from({length:65},(_,i)=>({...base,id:String(i+100),voucherNo:'RC-'+i,no:'RC-'+i,name:'Supplier '+i,status:'await',date:state.day}));state.sales=[];state.lots=[];
    workView=null;workDirty=false;page='receipts';filter='all';searchTerm='';render();
   });
   assert.equal(await page.locator('#receiptRows article:visible').count(),30);
   assert.ok((await page.locator('#receiptRows article:visible').first().innerText()).includes('RC-64'));
   await page.locator('.pwe-pagination button').nth(1).click();
   await page.waitForFunction(()=>document.querySelector('.pwe-pagination [role="status"]').textContent.includes('31–60'));
   assert.equal(await page.locator('#receiptRows article:visible').count(),30);
   assert.equal(await page.locator('.pwe-pagination button').nth(1).evaluate(el=>el===document.activeElement),true);
   await page.locator('.pwe-pagination button').nth(1).click();assert.equal(await page.locator('#receiptRows article:visible').count(),5);
   const nav=await page.locator('.pwe-pagination').boundingBox();assert.ok(nav.x>=0&&nav.x+nav.width<=width+1);
   await page.evaluate(()=>{
    const root=document.getElementById('receiptRows'),first=root.querySelector('article'),copy=first.cloneNode(true);copy.querySelector('[onclick]').setAttribute('onclick',"receiptDetail4('999')");copy.dataset.asyncRecord='true';root.append(copy);
   });
   await page.waitForFunction(()=>document.querySelector('#receiptRows article').dataset.asyncRecord==='true');
   assert.equal(await page.locator('#receiptRows article:visible').count(),30);
   assert.equal(await page.locator('.pwe-pagination').count(),1);
   await page.emulateMedia({media:'print'});assert.equal(await page.locator('#receiptRows article.pwe-page-hidden').first().evaluate(el=>getComputedStyle(el).display==='none'),false);assert.equal(await page.locator('.pwe-pagination:visible').count(),0);await page.emulateMedia({media:'screen'});
   results.push(width+'px: newest-first, 30/30/5 navigation, button focus, responsive controls, asynchronous list refresh and print pagination rules passed; existing app print output uses separate markup');
  }
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/list-pagination-browser.json',JSON.stringify({passed:!errors.length,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
