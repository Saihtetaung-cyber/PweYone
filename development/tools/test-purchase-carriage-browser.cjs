const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));let purchases=0;
  page.on('request',request=>{if(request.url().endsWith('/api/commands')&&request.postDataJSON()?.action==='purchase.create')purchases++;});
  await page.goto('http://127.0.0.1:8001/login');await page.locator('#email').fill(fixture.clerk.email);await page.locator('#password').fill(fixture.clerk.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);await page.waitForFunction(()=>!!window.pweServer);
  assert.ok(await page.evaluate(()=>pweServer.command('master.save',{kind:'product',data:{name:'Carriage Corn',grades:['A'],standardViss:'25'}})));
  async function receive(amount,multi=false){
   await page.evaluate(multi=>{workView=null;workDirty=false;openReceive4();if(multi)addReceiveLine4();},multi);
   await page.locator('#fParty').selectOption(fixture.trader);await page.locator('#rp0').selectOption(fixture.product);await page.locator('#rbt0').selectOption('weight');await page.locator('#rwoq0').fill('1000');
   if(multi){await page.locator('#rp1').selectOption('Carriage Corn');await page.locator('#rbt1').selectOption('weight');await page.locator('#rwoq1').fill('500');}
   await page.locator('#fCarriageAmount').fill(amount);assert.ok(await page.evaluate(()=>saveReceive4('list')));await page.reload();await page.waitForFunction(()=>!!window.pweServer);
  }
  await receive('20000',true);await page.evaluate(()=>{workDirty=false;purchase4(state.receipts[0].id);});
  for(const width of [1440,390]){await page.setViewportSize({width,height:950});assert.equal(await page.locator('#fCarriageRecovery').inputValue(),'20,000');assert.equal(await page.locator('#fCarriageRecovery').isEditable(),true);assert.equal(await page.locator('#fCarriageRecovery').count(),1);}
  for(const [i,count] of [[0,'40'],[1,'20']]){await page.locator('#vr'+i).fill('800');await page.locator('#vPurchaseBag47'+i).fill('25');await page.locator('#vPurchaseCount55'+i).fill(count);}
  await page.locator('#fCarriageRecovery').fill('0');assert.equal(await page.evaluate(()=>readCharges4().purchaseAdjustments2.deductionTotal),0);
  await page.locator('#vr0').fill('801');assert.equal(await page.locator('#fCarriageRecovery').inputValue(),'0');await page.locator('#vr0').fill('800');
  for(const invalid of ['20000.01','-1','1.001']){await page.locator('#fCarriageRecovery').fill(invalid);assert.ok(!await page.evaluate(()=>commitVoucher4()));assert.equal(purchases,0);}
  await page.locator('#fCarriageRecovery').fill('12,345.67');assert.equal(await page.evaluate(()=>readCharges4().carriage),12345.67);
  assert.equal(Number((await page.evaluate(()=>readCharges4().purchaseAdjustments2.deductionTotal)).toFixed(2)),12345.67);
  assert.ok(await page.evaluate(()=>commitVoucher4()));assert.equal(purchases,1);await page.reload();await page.waitForFunction(()=>state.receipts.filter(r=>r.status==='purchased').length===2);
  assert.equal(await page.evaluate(()=>state.receipts[0].charges4.carriage),12345.67);
  assert.equal(Number((await page.evaluate(()=>state.receipts.reduce((sum,r)=>sum+r.net4,0))).toFixed(2)),1187654.33);
  assert.equal(await page.evaluate(()=>state.expenses.find(e=>e.recoverable).settlementRecoveries74.length),1);
  assert.equal(await page.evaluate(()=>state.expenses.find(e=>e.recoverable).amount),20000);
  assert.equal(await page.evaluate(()=>state.expenses.find(e=>e.recoverable).recovered),false);
  assert.equal(await page.evaluate(()=>state.transactions.reduce((sum,t)=>sum+t.amount,0)),-20000);
  results.push('Desktop/mobile multi-line voucher autofills one editable 20000 carriage field; decimal 12345.67 deducts once, net totals 1187654.33, original outlay stays 20000 with 7654.33 outstanding, and no second cash movement occurs');
  await receive('30000');await page.evaluate(()=>{workDirty=false;purchase4(state.receipts.find(r=>r.status!=='purchased').id);});
  assert.equal(await page.locator('#fCarriageRecovery').inputValue(),'30,000');
  await page.locator('#fCarriageRecovery').fill('0');await page.locator('#vr0').fill('800');await page.locator('#vPurchaseBag470').fill('25');await page.locator('#vPurchaseCount550').fill('40');
  assert.ok(await page.evaluate(()=>commitVoucher4()));await page.reload();await page.waitForFunction(()=>state.receipts.filter(r=>r.status==='purchased').length===3);
  assert.equal(await page.evaluate(()=>state.expenses.find(e=>e.amount===30000).settlementRecoveries74.length),0);
  assert.equal(await page.evaluate(()=>state.receipts.find(r=>Number(r.backendGross)===800000&&r.charges4.carriage===0).net4),800000);
  results.push('Next receipt uses only its own 30000 outlay; choosing zero persists without automatically recovering that outlay or a previous receipt balance');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/purchase-carriage-browser.json',JSON.stringify({passed:!errors.length,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
