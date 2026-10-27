const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await page.goto('http://127.0.0.1:8001/login');await page.locator('#email').fill(fixture.owner.email);await page.locator('#password').fill(fixture.owner.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);
  await page.waitForFunction(()=>!!window.pweServer);await page.locator('#roleSelect').selectOption('owner');await page.locator('#ownerViewPassword').fill(fixture.owner.password);
  assert.ok(await page.evaluate(()=>pweConfirmOwnerView()));
  await page.evaluate(()=>{workView=null;workDirty=false;beginSetup('additional38');pweEditLoanPolicy();});
  await page.locator('#loanPolicyName').fill('Browser monthly policy');await page.locator('#loanPolicyRate').fill('2.5');
  assert.ok(await page.evaluate(()=>pweSaveLoanPolicy()));
  await page.reload();await page.waitForFunction(()=>state.loanInterestPolicies.some(p=>p.name==='Browser monthly policy'));
  const id=await page.evaluate(()=>state.loanInterestPolicies.find(p=>p.name==='Browser monthly policy').id);
  await page.evaluate(()=>{workView=null;workDirty=false;newLoan38();});
  await page.locator('#loanRate38').selectOption(id);await page.locator('#loanParty38').selectOption(fixture.trader);
  await page.locator('#loanAmount38').fill('100000');await page.locator('#loanDate38').fill('2026-10-15');await page.locator('#loanAccount38').selectOption('cash');
  assert.ok(await page.evaluate(()=>saveLoan38()));
  await page.reload();await page.waitForFunction(()=>state.supplierLoans38.length===1);
  assert.equal(await page.evaluate(()=>state.supplierLoans38[0].rate),2.5);
  await page.evaluate(id=>{workView=null;workDirty=false;beginSetup('additional38');pweEditLoanPolicy(id);},id);
  await page.locator('#loanPolicyRate').fill('5');assert.ok(await page.evaluate(()=>pweSaveLoanPolicy()));
  assert.equal(await page.evaluate(()=>state.supplierLoans38[0].rate),2.5);
  assert.equal(await page.evaluate(()=>loanBalance38(state.supplierLoans38[0]).interest),833.33);
  await page.evaluate(id=>pweDisableLoanPolicy(id),id);
  await page.evaluate(()=>{workDirty=false;newLoan38();});assert.equal(await page.locator('#loanRate38 option[value="'+id+'"]').count(),0);
  await page.evaluate(id=>{workDirty=false;closeModal();beginSetup('additional38');pweEditLoanPolicy(id);},id);
  await page.locator('#loanPolicyActive').selectOption('yes');assert.ok(await page.evaluate(()=>pweSaveLoanPolicy()));
  await page.evaluate(()=>newLoan38());assert.equal(await page.locator('#loanRate38 option[value="'+id+'"]').count(),1);
  await page.evaluate(()=>{workDirty=false;closeModal();});
  await page.locator('#roleSelect').selectOption('staff');await page.waitForFunction(()=>state.role==='staff');
  await page.evaluate(()=>beginSetup('additional38'));assert.equal(await page.locator('[onclick="pweEditLoanPolicy()"]').count(),0);
  results.push('Real HTTP policy create/reload/edit/deactivate/reactivate and loan policy selection passed; existing 2.5% loan retains 833.33 interest after policy changes; staff cannot edit');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.message);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/loan-policy-browser.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
