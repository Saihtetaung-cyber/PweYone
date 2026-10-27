const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const errors=[],results=[];
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  let holdDraft=false,draftArrived;
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/api/commands'&&holdDraft&&route.request().postDataJSON()?.action==='opening.draft'){
    holdDraft=false;draftArrived(route);return;
   }
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:fs.readFileSync('development/runtime/test-workspace.html','utf8')});
   if(url.pathname.startsWith('/js/')||url.pathname.startsWith('/css/'))return route.fulfill({contentType:url.pathname.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync('working/pweyon/public'+url.pathname)});
   return route.fulfill({status:422,contentType:'application/json',body:'{"message":"UI fixture only; no writes"}'});
  });
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000});await page.goto('https://pwe.test/');
   await page.waitForFunction(()=>!!window.pweServer);
   holdDraft=true;const backgroundRequest=new Promise(resolve=>{draftArrived=resolve;});
   await page.evaluate(()=>{
    state.masters.products=[{id:'preview-a',name:'Sesame',grades:['A','B'],standardViss:25,active:true},{id:'preview-b',name:'Corn',grades:['C'],standardViss:25,active:true},{id:'preview-inactive',name:'Inactive',grades:['Z'],active:false}];
    workView=null;workDirty=false;openInitial69();opening69Stock('owned');
   });
   const product=page.locator('#op69Product');
   const pendingRoute=await backgroundRequest;
   const persistedState=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
   await page.evaluate(()=>{window.openingInputBeforeSave=document.getElementById('op69Qty');openingInputBeforeSave.focus();});
   assert.equal(await page.locator('#op69Qty').isEnabled(),true);
   assert.equal(await page.locator('#serverSaveStatus').isVisible(),false);
   await page.locator('#op69Qty').fill('42');
   await pendingRoute.fulfill({contentType:'application/json',body:JSON.stringify({state:persistedState,result:{saved:true}})});
   await page.waitForFunction(()=>document.getElementById('op69Qty')===window.openingInputBeforeSave&&document.activeElement===window.openingInputBeforeSave);
   assert.equal(await page.locator('#op69Qty').inputValue(),'42');
   await page.locator('#op69Qty').fill('42');await page.locator('#op69Bags').fill('7');
   await page.locator('.opening-product-toggle').click();
   assert.equal(await page.locator('#openingProductOptions [role=option]').count(),2);
   await product.fill('corn');assert.equal(await page.locator('#openingProductOptions [role=option]').count(),1);
   await page.locator('#openingProductOptions [role=option]').click();
   assert.equal(await product.inputValue(),'Corn');assert.equal(await page.locator('#op69Grade').inputValue(),'C');
   assert.equal(await page.locator('#op69Qty').inputValue(),'42');assert.equal(await page.locator('#op69Bags').inputValue(),'7');
   await product.fill('missing-product');assert.equal(await page.locator('.opening-product-empty').count(),1);
   await product.press('Escape');assert.equal(await product.getAttribute('aria-expanded'),'false');
   await product.fill('sesame');await product.press('ArrowDown');await product.press('Enter');
   assert.equal(await product.inputValue(),'Sesame');
   await page.locator('.opening-product-toggle').click();
   assert.equal(await page.locator('#openingProductOptions [aria-selected=true]').count(),1);
   assert.equal(await page.locator('#openingProductOptions').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true);
   await page.screenshot({path:'docs/evidence/opening-product-picker-'+width+'.png',fullPage:true});
   await page.locator('#op69Qty').click();assert.equal(await product.getAttribute('aria-expanded'),'false');
   results.push('Width '+width+': active products, search, selection, grade update, quantity preservation, keyboard, empty state and outside close passed');
  }
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.message);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/opening-product-picker.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
