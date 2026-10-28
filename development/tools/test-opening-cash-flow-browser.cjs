const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const results=[],errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8001/login');
  await page.locator('#email').fill(fixture.owner.email);await page.locator('#password').fill(fixture.owner.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);
  await page.waitForFunction(()=>!!window.pweServer);
  const command=async(action,input)=>{assert.ok(await page.evaluate(({action,input})=>pweServer.command(action,input),{action,input}),action);};
  const cash=await page.evaluate(()=>state.__ids.accounts.cash);
  await command('day.close',{actual:'2000000',transfer:'0',confirmed:true});await command('day.next',{});
  await page.evaluate(()=>{workDirty=false;openCashCheck();});
  await page.locator('#openingActual').fill('1980000');await page.locator('#openingNote').fill('Original count needs investigation');
  await page.locator('#saveOpeningBtn').click();
  await page.waitForFunction(()=>state.opening.status==='pending');
  const id=await page.evaluate(()=>state.opening.id);
  assert.equal(await page.evaluate(()=>state.opening.checked),true);
  assert.equal(await page.evaluate(()=>bal('cash')),2000000);
  await page.evaluate(()=>openCashCheck());
  assert.equal(await page.locator('#openingCashReviewForm').count(),0,'Clerk must have no review action');
  await page.evaluate(()=>closeModal());
  results.push('Clerk submits a discrepancy through the form, retains work access and sees immutable detail without owner actions');

  await page.locator('#roleSelect').selectOption('owner');await page.locator('#ownerViewPassword').fill(fixture.owner.password);
  assert.ok(await page.evaluate(()=>pweConfirmOwnerView()));
  assert.equal(await page.locator('.opening-pending2').count(),1);
  await page.evaluate(()=>openOpeningPending2());
  await page.screenshot({path:'docs/evidence/opening-cash-records-1440.png',fullPage:true});
  await page.evaluate(id=>openOpeningCashDetail(id),id);
  assert.ok(await page.locator('#openingCashSubmit').isDisabled());
  await page.locator('#openingReviewNote').fill('Reviewed, cash not adjusted');await page.locator('#openingReviewConfirmed').check();
  await page.locator('#openingCashSubmit').click();await page.waitForFunction(()=>state.opening.status==='reviewed');
  assert.equal(await page.evaluate(()=>bal('cash')),2000000);
  await page.screenshot({path:'docs/evidence/opening-cash-detail-1440.png',fullPage:true});
  results.push('Password-gated owner reviews a count; status and actor/time persist with no cash movement');

  await page.evaluate(id=>openOpeningCashResolve(id),id);
  await page.locator('#openingResolutionMethod').selectOption('link');
  assert.equal(await page.locator('[data-opening-entry]').count(),0);
  assert.ok(await page.locator('#openingCashSubmit').isDisabled());
  const record=async(action,input)=>{
   const response=await page.evaluate(async({action,input})=>{
    const r=await fetch('/api/commands',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-TOKEN':document.querySelector('meta[name=csrf-token]').content,'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({action,input})});
    return {status:r.status,data:await r.json()};
   },{action,input});
   assert.equal(response.status,200,JSON.stringify(response.data));return response.data;
  };
  for(const amount of ['12000','8000'])await record('expense.create',{amount,reason:'Omitted morning expense',account_id:cash});
  await page.locator('#openingCashRefresh').click();await page.waitForFunction(()=>document.querySelectorAll('[data-opening-entry]').length===2);
  await page.locator('#openingResolutionNote').fill('Verified both omitted expenses');await page.locator('#openingResolutionConfirmed').check();
  await page.locator('[data-opening-entry]').first().check();assert.ok(await page.locator('#openingCashSubmit').isDisabled());
  await page.locator('[data-opening-entry]').nth(1).check();assert.ok(await page.locator('#openingCashSubmit').isEnabled());
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'docs/evidence/opening-cash-resolve-390.png',fullPage:true});
  await page.locator('#openingCashSubmit').click();await page.waitForFunction(()=>state.opening.status==='linked');
  assert.equal(await page.evaluate(()=>bal('cash')),1980000);
  assert.equal(await page.evaluate(()=>state.opening.resolution.entries.length),2);
  await page.reload();await page.waitForFunction(()=>state.opening.status==='linked');
  assert.equal(await page.evaluate(()=>bal('cash')),1980000);
  assert.equal(await page.evaluate(()=>state.opening.actual),1980000);
  results.push('Empty evidence refresh finds two real cash expenses; partial total blocks saving, complete links persist without a second cash deduction; 390px form fits');

  await page.setViewportSize({width:1440,height:1000});
  await command('day.close',{actual:'1980000',transfer:'0',confirmed:true});await command('day.next',{});
  await page.evaluate(()=>{workDirty=false;openCashCheck();});await page.locator('#openingActual').fill('1980100');await page.locator('#openingNote').fill('Counting mistake');await page.locator('#saveOpeningBtn').click();
  await page.waitForFunction(()=>state.opening.status==='pending');
  const second=await page.evaluate(()=>state.opening.id);
  await page.evaluate(id=>openOpeningCashDetail(id),second);await page.locator('#openingReviewConfirmed').check();await page.locator('#openingCashSubmit').click();
  await page.waitForFunction(()=>state.opening.status==='reviewed');
  await page.evaluate(id=>openOpeningCashResolve(id),second);await page.locator('#openingResolutionMethod').selectOption('recount');
  await page.locator('#openingResolutionNote').fill('Recounted original opening bundle');await page.locator('#openingResolutionConfirmed').check();
  await page.locator('#openingRecountActual').fill('1980099');assert.ok(await page.locator('#openingCashSubmit').isDisabled());
  await page.locator('#openingRecountActual').fill('1980000');assert.ok(await page.locator('#openingCashSubmit').isEnabled());
  await page.screenshot({path:'docs/evidence/opening-cash-recount-1440.png',fullPage:true});
  await page.locator('#openingCashSubmit').click();await page.waitForFunction(()=>state.opening.status==='recounted');
  assert.equal(await page.evaluate(()=>state.opening.actual),1980100);
  assert.equal(await page.evaluate(()=>state.opening.resolution.actual),1980000);
  assert.equal(await page.evaluate(()=>bal('cash')),1980000);
  await page.evaluate(()=>openOpeningPending2('resolved'));assert.equal(await page.locator('.opening-cash-record').count(),2);
  await page.evaluate(()=>openOpeningPending2('unresolved'));assert.equal(await page.locator('.opening-cash-record').count(),0);
  await page.evaluate(()=>closeModal());assert.equal(await page.locator('.opening-pending2').count(),1,'Resolved history must remain reachable');
  results.push('Next day preserves prior records; owner recount must match original expected amount, keeps clerk count and balance, and updates history filters');

  // Native tests exercise persisted legacy links; this read-only UI fixture checks the legacy opt-in control.
  await page.evaluate(id=>{
   const o=state.openingCashChecks.find(o=>o.id===id);
   o.legacy=true;o.status='reviewed';o.candidates=[];o.legacyCandidates=o.resolution.entries;
   openOpeningCashResolve(id);
  },id);
  await page.locator('#openingResolutionMethod').selectOption('link');
  assert.equal(await page.locator('[data-opening-entry]').count(),0);
  await page.locator('#openingIncludeLegacy').check();assert.equal(await page.locator('[data-opening-entry]').count(),2);
  for(const checkbox of await page.locator('[data-opening-entry]').all())await checkbox.check();
  await page.locator('#openingResolutionNote').fill('Legacy evidence review');await page.locator('#openingResolutionConfirmed').check();
  assert.ok(await page.locator('#openingCashSubmit').isEnabled());
  await page.locator('#openingIncludeLegacy').uncheck();assert.equal(await page.locator('[data-opening-entry]:checked').count(),0);
  assert.ok(await page.locator('#openingCashSubmit').isDisabled());
  results.push('Read-only legacy UI fixture: same-day evidence requires explicit opt-in, and opting out clears selection and disables saving');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack||error.message);throw error;}
 finally{
  await browser.close();
  fs.writeFileSync('docs/evidence/opening-cash-flow-browser.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));
 }
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
