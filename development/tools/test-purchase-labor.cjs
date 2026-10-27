const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8001/login');await page.locator('#email').fill(fixture.clerk.email);await page.locator('#password').fill(fixture.clerk.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);await page.waitForFunction(()=>!!window.pweServer);
  assert.equal(await page.evaluate(()=>state.laborMaelMasters51.some(mael=>Number(mael.value)===1)),false);
  assert.ok(await page.evaluate(()=>pweServer.command('master.save',{kind:'labor',data:{name:'Handling rate',kind:'rate',rate:'500'}})));
  await page.evaluate(()=>{workView=null;workDirty=false;openReceive4();});
  await page.locator('#fParty').selectOption(fixture.trader);await page.locator('#rp0').selectOption(fixture.product);
  await page.locator('#rbt0').selectOption('weight');await page.locator('#rwoq0').fill('100');assert.ok(await page.evaluate(()=>saveReceive4('list')));
  await page.reload();await page.waitForFunction(()=>state.receipts.length===1);
  await page.evaluate(()=>{workDirty=false;purchase4(state.receipts[0].id);});
  assert.equal(await page.locator('#laborMultiple0 option[value="LM51-1"]').count(),0);
  const mael=await page.evaluate(()=>state.laborMaelMasters51.find(mael=>Number(mael.value)===2).id);
  assert.equal(await page.locator('#laborMultiple0').inputValue(),mael);
  await page.locator('#vr0').fill('800');await page.locator('#vPurchaseBag470').fill('25');await page.locator('#vPurchaseCount550').fill('4');await page.locator('#laborBags0').fill('4');
  const purchased=await page.evaluate(()=>commitVoucher4());assert.ok(purchased,purchased?undefined:await page.locator('#modalError').textContent());
  await page.reload();await page.waitForFunction(()=>state.receipts[0]?.status==='purchased');
  assert.equal(await page.evaluate(()=>state.receipts[0].charges4.labor),4000);
  assert.equal(await page.evaluate(()=>state.receipts[0].net4),76000);
  assert.equal(await page.evaluate(()=>state.lots.filter(lot=>lot.owner==='owned').length),1);
  results.push('With no one-mael database record, only the saved two-mael option appears; real HTTP purchase posts 500 x 2 x 4 = 4000 labor, net 76000, and survives reload');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.message);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/purchase-labor-browser.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
