const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));let purchaseRequests=0;
  page.on('request',request=>{if(request.url().endsWith('/api/commands')&&request.postDataJSON()?.action==='purchase.create')purchaseRequests++;});
  await page.goto('http://127.0.0.1:8001/login');await page.locator('#email').fill(fixture.clerk.email);await page.locator('#password').fill(fixture.clerk.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);await page.waitForFunction(()=>!!window.pweServer);
  async function receive(advance='0'){
   await page.evaluate(()=>{workView=null;workDirty=false;openReceive4();});await page.locator('#fParty').selectOption(fixture.trader);await page.locator('#rp0').selectOption(fixture.product);await page.locator('#rbt0').selectOption('weight');await page.locator('#rwoq0').fill('1000');
   await page.locator('#fAdvanceAmount').fill(advance);assert.ok(await page.evaluate(()=>saveReceive4('list')));await page.reload();await page.waitForFunction(()=>!!window.pweServer);
  }
  await receive('100000');
  await page.evaluate(()=>{workDirty=false;purchase4(state.receipts[0].id);});
  assert.equal(await page.locator('#fAdvance').inputValue(),'100,000');assert.equal(await page.locator('#fAdvance').isEditable(),true);
  await page.locator('#fAdvance').fill('25000');await page.locator('#vr0').fill('800');await page.locator('#vPurchaseBag470').fill('25');await page.locator('#vPurchaseCount550').fill('40');
  await page.locator('#fAdvance').fill('-1');assert.ok(!await page.evaluate(()=>commitVoucher4()));assert.equal(purchaseRequests,0);
  await page.locator('#fAdvance').fill('100001');assert.ok(!await page.evaluate(()=>commitVoucher4()));assert.equal(purchaseRequests,0);
  await page.locator('#fAdvance').fill('25000');
  assert.equal(await page.locator('#fAdvance').inputValue(),'25,000');assert.equal(await page.evaluate(()=>readCharges4().advance),25000);
  assert.ok(await page.evaluate(()=>commitVoucher4()));await page.reload();await page.waitForFunction(()=>state.receipts[0]?.status==='purchased');
  assert.equal(purchaseRequests,1);
  assert.equal(await page.evaluate(()=>supplierBalance(state.receipts[0].partnerId)),75000);
  assert.equal(await page.evaluate(()=>state.receipts[0].charges4.advance),25000);
  assert.equal(await page.evaluate(()=>state.receipts[0].net4),775000);
  assert.equal(await page.evaluate(()=>state.transactions.reduce((sum,entry)=>sum+entry.amount,0)),-100000);
  results.push('Real receiving advance 100000 autofills purchase; manually reduced 25000 is posted once, net is 775000, balance is 75000 after reload and recovery does not move cash again');
  await receive();
  await page.evaluate(()=>{workDirty=false;purchase4(state.receipts.find(r=>r.status!=='purchased').id);});
  assert.equal(await page.locator('#fAdvance').inputValue(),'75,000');await page.locator('#fAdvance').fill('0');await page.locator('#vr0').fill('900');assert.equal(await page.locator('#fAdvance').inputValue(),'0');
  results.push('Next voucher autofills remaining 75000, and manually choosing zero survives later price edits');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/purchase-advance-browser.json',JSON.stringify({passed:!errors.length,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
