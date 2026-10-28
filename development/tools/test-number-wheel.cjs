const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/')return route.fulfill({contentType:'text/html',body:fs.readFileSync('development/runtime/closing-preview.html','utf8')});
   if(path.startsWith('/js/')||path.startsWith('/css/'))return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync('working/pweyon/public'+path)});
   return route.fulfill({status:422,contentType:'application/json',body:'{"message":"Read-only UI fixture"}'});
  });
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});await page.goto('https://pwe.test/');await page.waitForFunction(()=>!!window.pweServer);
   await page.evaluate(()=>{
    workView=null;workDirty=false;state.closed=false;state.opening.checked=true;state.role='staff';openReceive4();
   });
   const amount=page.locator('#fAdvanceAmount');await amount.fill('123456');await amount.focus();await amount.hover();
   await page.mouse.wheel(0,-120);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await amount.inputValue(),'123,456');
   await amount.scrollIntoViewIfNeeded();await amount.focus();await amount.hover();await page.mouse.wheel(0,120);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await amount.inputValue(),'123,456');
   await amount.fill('765432');assert.equal(await amount.inputValue(),'765,432');
   results.push(width+'px: receiving amount is unchanged by actual wheel-up/down events and remains manually editable');
   await page.evaluate(()=>{workDirty=false;closeModal();state.role='owner';pweEditServiceRate();});
   const percent=page.locator('#serviceRatePercent');await percent.fill('2.5');await percent.focus();await percent.hover();await page.mouse.wheel(0,120);
   await page.waitForFunction(()=>document.activeElement?.id!=='serviceRatePercent');assert.equal(await percent.inputValue(),'2.5');
   await percent.fill('3.25');assert.equal(await percent.inputValue(),'3.25');
   results.push(width+'px: dynamically opened service-rate dialog retains decimal percentage after wheel scrolling');
  }
  await page.evaluate(()=>{
   document.getElementById('serviceRateDialog').close();document.getElementById('serviceRateDialog').remove();
   const panel=document.createElement('section');panel.id='wheelScrollPanel';panel.style.cssText='position:fixed;inset:50px 15px;height:400px;overflow-y:auto;background:white;z-index:99999';
   panel.innerHTML='<div style="height:1600px;padding:20px"><input id="wheelScrollAmount" type="number" step="0.01" value="100.25"></div>';document.body.append(panel);
  });
  const input=page.locator('#wheelScrollAmount');await input.focus();await input.hover();await page.mouse.wheel(0,240);
  await page.mouse.wheel(0,240);
  await page.waitForFunction(()=>document.getElementById('wheelScrollPanel').scrollTop>0);
  assert.equal(await input.inputValue(),'100.25');
  results.push('Wheel scrolling over a focused numeric field still scrolls its enclosing panel and does not change the number');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/number-wheel-browser.json',JSON.stringify({passed:!errors.length,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
