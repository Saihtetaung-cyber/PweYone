const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8001/login');await page.locator('#email').fill(fixture.owner.email);await page.locator('#password').fill(fixture.owner.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);
  await page.waitForFunction(()=>!!window.pweServer);await page.locator('#roleSelect').selectOption('owner');
  await page.locator('#ownerViewPassword').fill(fixture.owner.password);assert.ok(await page.evaluate(()=>pweConfirmOwnerView()));
  await page.evaluate(()=>{workView=null;workDirty=false;openInitial69();opening69View('review');});
  assert.equal(await page.locator('#op69Confirm').isDisabled(),true);
  await page.locator('[onclick="opening69Approve()"]').click();
  assert.equal(await page.locator('[onclick="opening69CheckOwn()"]').count(),1);
  results.push('Incomplete approval guides the owner to the required stock review without bypassing checks');
  await page.evaluate(()=>opening69StockAnswer('owned','','no'));
  await page.locator('[onclick="opening69CheckOwn()"]').click();
  for(const checkbox of await page.locator('[data-op69="cash-check"]').all())await checkbox.check();
  await page.evaluate(()=>opening69Scope('supplier'));await page.locator('[data-op69="group"][data-kind="supplier"]').check();
  // Viewing an unfilled party creates a placeholder; it must not block approval.
  await page.evaluate(id=>{opening69Party(id);opening69Scope('buyer');},fixture.trader);
  await page.locator('[data-op69="group"][data-kind="buyer"]').check();
  await page.locator('[onclick="opening69View(\'review\')"]').first().click();
  assert.equal(await page.locator('#op69Confirm').isEnabled(),true);await page.locator('#op69Confirm').check();
  assert.ok(await page.evaluate(()=>opening69Approve()),await page.locator('#opening69Error').textContent());
  await page.reload();await page.waitForFunction(()=>state.initialOpening69?.status==='approved');
  await page.evaluate(()=>openInitial69());assert.equal(await page.locator('#op69Confirm').count(),0);
  assert.equal(await page.evaluate(()=>state.lots.length),0);
  results.push('Reviewed opening with an untouched party approves over real HTTP, remains approved after reload and creates no fake stock');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.message);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/opening-approval-browser.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
