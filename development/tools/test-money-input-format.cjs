const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[],errors=[],commands=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));let openingState;
  await page.route('**/*',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path==='/')return route.fulfill({contentType:'text/html',body:fs.readFileSync('development/runtime/closing-preview.html','utf8')});
   if(path.startsWith('/js/')||path.startsWith('/css/'))return route.fulfill({contentType:path.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync('working/pweyon/public'+path)});
   if(path==='/api/commands'){
    const command=route.request().postDataJSON();commands.push(command);
    if(command.action==='opening.draft')return route.fulfill({contentType:'application/json',body:JSON.stringify({result:{saved:true},state:{...openingState,initialOpening69:command.input.draft}})});
   }
   return route.fulfill({status:422,contentType:'application/json',body:'{"message":"Read-only UI fixture"}'});
  });
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:950});await page.goto('https://pwe.test/');await page.waitForFunction(()=>!!window.pweMoneyInputs);
   await page.evaluate(()=>{workView=null;workDirty=false;state.closed=false;state.opening.checked=true;state.role='staff';openReceive4();});
   const amount=page.locator('#fAdvanceAmount');await amount.fill('1234567');
   assert.equal(await amount.inputValue(),'1,234,567');assert.equal(await amount.evaluate(el=>el.value),'1234567');
   await amount.press('End');await page.keyboard.insertText('8');assert.equal(await amount.evaluate(el=>pweMoneyInputs.display(el)),'12,345,678');
   await amount.evaluate(el=>{el.focus();el.setSelectionRange(2,2);});await page.keyboard.insertText('9');
   assert.equal(await amount.evaluate(el=>el.value),'129345678');assert.equal(await amount.evaluate(el=>pweMoneyInputs.display(el)),'129,345,678');
   assert.equal(await amount.evaluate(el=>el===document.activeElement),true);
   await amount.fill('1,234,567');assert.equal(await amount.evaluate(el=>el.value),'1234567');
   assert.equal(await page.locator('#rb0').getAttribute('type'),'number');
   results.push(width+'px: receiving amounts group while typing/pasting, preserve caret/focus for middle edits, and bag counts stay numeric');
   await page.evaluate(()=>{
    workDirty=false;closeModal();state.role='owner';pweEditLoanPolicy();
   });
   assert.equal(await page.locator('#loanPolicyRate').getAttribute('type'),'number');await page.locator('#loanPolicyRate').fill('0');
   assert.equal(await page.locator('#loanPolicyRate').evaluate(el=>el.checkValidity()),true);
   await page.evaluate(()=>{pweCloseLoanPolicy();const host=document.createElement('form');host.id='moneyExampleForm';host.innerHTML=field('ငွေပမာဏ','moneyExample',{name:'amount',type:'number',min:0,max:9999999999,step:0.01,value:1000,required:true});document.getElementById('main').append(host);});
   const example=page.locator('#moneyExample');await example.fill('1,234,567.50');
   assert.equal(await example.evaluate(el=>pweMoneyInputs.display(el)),'1,234,567.50');assert.equal(await example.evaluate(el=>el.value),'1234567.50');
   assert.equal(await example.evaluate(el=>el.valueAsNumber),1234567.5);
   assert.equal(await page.evaluate(()=>new FormData(document.getElementById('moneyExampleForm')).get('amount')),'1234567.50');
   await example.fill('၀၁၂၃၄.၅၀');assert.equal(await example.evaluate(el=>el.value),'01234.50');
   for(const invalid of ['-1','10000000000','123.456','invalid','']){await example.fill(invalid);assert.equal(await example.evaluate(el=>el.checkValidity()),false,'Must reject '+invalid);}
   await example.fill('0');assert.equal(await example.evaluate(el=>el.value),'0');assert.equal(await example.evaluate(el=>el.checkValidity()),true);
   await example.evaluate(el=>{el.value='2500000.25';});assert.equal(await example.evaluate(el=>pweMoneyInputs.display(el)),'2,500,000.25');
   await page.evaluate(()=>document.getElementById('moneyExampleForm').reset());
   await page.waitForFunction(()=>pweMoneyInputs.display(document.getElementById('moneyExample'))==='1,000');
   await page.evaluate(()=>{const clone=document.getElementById('moneyExample').cloneNode(true);clone.id='moneyClone';clone.name='amountClone';document.getElementById('moneyExampleForm').append(clone);});
   await page.waitForFunction(()=>document.getElementById('moneyClone').value==='1000');
   assert.equal(await page.locator('#moneyClone').inputValue(),'1,000');
   results.push(width+'px: decimals/zero, programmatic updates, FormData raw decimal, Myanmar digits, reset and min/max/step/required validation pass; percentage fields unchanged');
   await page.evaluate(()=>{
    document.getElementById('moneyExampleForm').remove();
    state.initialOpening69={schema:1,status:'draft',startDate:state.day,accounts:{},own:{stock:'no',rows:[],checked:false},parties:{},groups:{supplier:false,buyer:false},balances:[],dispatches:[],revisions:[]};
    workDirty=false;openInitial69();opening69Scope('owned');opening69OwnTab('cash');
   });
   openingState=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
   const draftSaved=page.waitForResponse(response=>response.url().endsWith('/api/commands')&&response.request().postDataJSON()?.action==='opening.draft');
   const cash=page.locator('#op69Cash_cash');await cash.fill('1000000');
   assert.equal(await cash.evaluate(el=>pweMoneyInputs.display(el)),'1,000,000');
   assert.equal(await page.evaluate(()=>String(state.initialOpening69.accounts.cash.amount)),'1000000');
   await draftSaved;await page.waitForFunction(()=>!document.getElementById('serverSaveStatus')||document.getElementById('serverSaveStatus').hidden);
   results.push(width+'px: opening-balance draft stores raw amounts while showing commas, without losing input focus');
   await page.evaluate(()=>{workView=null;workDirty=false;page='prices';render();});
   const price=page.locator('#priceForm .market-row input').first();await price.fill('1234567');
   assert.equal(await price.inputValue(),'1,234,567');
   await page.evaluate(()=>savePrices({preventDefault(){}}));
   assert.equal(commands.at(-1).action,'prices.save');assert.equal(commands.at(-1).input.prices[0].price,'1234567');
   results.push(width+'px: market-price entry displays commas but sends an unformatted decimal in the actual command payload');
  }
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/money-input-format-browser.json',JSON.stringify({passed:!errors.length,results,errors,commandCount:commands.length},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
