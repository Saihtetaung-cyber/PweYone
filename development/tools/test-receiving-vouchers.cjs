const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const fixture=JSON.parse(fs.readFileSync('development/runtime/browser-fixture.json','utf8'));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/api/commands')&&response.status()>=500)errors.push('Command HTTP '+response.status());});
  await page.goto('http://127.0.0.1:8001/login');await page.locator('#email').fill(fixture.clerk.email);await page.locator('#password').fill(fixture.clerk.password);
  await Promise.all([page.waitForURL('http://127.0.0.1:8001/'),page.locator('button[type=submit]').click()]);await page.waitForFunction(()=>!!window.pweServer);
  for(const name of ['Browser Corn','Browser Wheat'])assert.ok(await page.evaluate(name=>pweServer.command('master.save',{kind:'product',data:{name,grades:['A'],standardViss:'25'}}),name));
  await page.evaluate(()=>{workView=null;workDirty=false;openReceive4();addReceiveLine4();addReceiveLine4();});
  await page.locator('#fParty').selectOption(fixture.trader);await page.locator('#fWh').selectOption(fixture.warehouse);
  const firstNumber=await page.locator('#fNo').inputValue();
  assert.equal(await page.locator('#fNo').evaluate(input=>input.readOnly),true);
  const indexes=await page.locator('#receiveLines4 .req-line').evaluateAll(rows=>rows.map(row=>row.dataset.i));
  for(const [position,name] of [fixture.product,'Browser Corn','Browser Wheat'].entries()){
   const index=indexes[position];await page.locator('#rp'+index).selectOption(name);
   await page.locator('#rbt'+index).selectOption(['raw','weight','finished'][position]);
   if(position===0){await page.locator('#rb'+index).fill('4');await page.locator('#rw'+index).selectOption('no');}
   if(position===1)await page.locator('#rwoq'+index).fill('1500');
   if(position===2){await page.locator('#rfv'+index).fill('25');await page.locator('#rfc'+index).fill('2');}
  }
  assert.ok(await page.evaluate(()=>saveReceive4('list')));
  await page.reload();await page.waitForFunction(()=>state.receipts.length===3);
  assert.equal(await page.evaluate(()=>state.lots.length),3);
  await page.evaluate(()=>{workDirty=false;openReceive4();});
  const nextNumber=await page.locator('#fNo').inputValue();assert.notEqual(nextNumber,firstNumber);
  await page.locator('#fParty').selectOption(fixture.trader);await page.locator('#rp0').selectOption(fixture.product);
  await page.locator('#rbt0').selectOption('weight');await page.locator('#rwoq0').fill('750');
  assert.equal(await page.locator('#fNo').evaluate(input=>input.readOnly),true);
  await page.locator('#fNo').evaluate((input,stale)=>{input.value=stale;},firstNumber);
  assert.ok(await page.evaluate(()=>saveReceive4('list')));
  await page.reload();await page.waitForFunction(()=>state.receipts.length===4);
  assert.equal(await page.evaluate(()=>new Set(state.receipts.map(receipt=>receipt.voucherNo)).size),2);
  assert.equal(await page.evaluate(()=>state.lots.length),4);
  assert.equal(await page.evaluate(number=>state.receipts.some(receipt=>receipt.voucherNo===number),nextNumber),true);
  results.push('Readonly receiving numbers keep the existing format; server generates unique numbers even after a stale preview is injected; mixed-product receiving and reload passed');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.message);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/receiving-voucher-browser.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
