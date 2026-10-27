const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');

(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const results=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:fs.readFileSync('development/runtime/test-workspace.html','utf8')});
   if(url.pathname.startsWith('/js/')||url.pathname.startsWith('/css/'))return route.fulfill({contentType:url.pathname.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync('working/pweyon/public'+url.pathname)});
   return route.fulfill({status:422,contentType:'application/json',body:'{"message":"Read-only UI test"}'});
  });
  for(const role of ['owner','staff'])for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000});await page.goto('https://pwe.test/');await page.waitForFunction(()=>!!window.pweServer);
   await page.evaluate(role=>{
    state.role=role;
    if(role==='staff')state.masters.accounts=state.masters.accounts.filter(account=>account.staffCanView);
    state.masters.partners=[{id:'3',name:'Review supplier',locality:'Town',kind:'supplier',active:true},{id:'5',name:'Review buyer',locality:'Town',kind:'buyer',active:true}];
    const parties=[];
    const draft=(answers,values)=>({answers,values,rows:[],checked:false});
    parties[3]=draft({stock:'no',payable:'yes',advance:'no',loan:'no'},{payable:'125000',loanInterest:'',loanRate:'3'});
    parties[5]=draft({stock:'no',receivable:'yes',deposit:'no'},{receivable:'50000'});
    state.initialOpening69=pweHydrate({initialOpening69:{schema:1,status:'draft',startDate:state.day,accounts:[],own:{stock:'no',rows:[],checked:false},parties:JSON.parse(JSON.stringify(parties)),groups:{supplier:false,buyer:false},balances:[],dispatches:[],revisions:[]}}).initialOpening69;
    workView=null;workDirty=false;openInitial69();
   },role);
   await page.locator('[onclick="opening69View(\'review\')"]').click();
   assert.equal(await page.locator('[onclick="opening69View(\'home\')"]').count()>0,true);
   const text=await page.locator('#opening69').innerText();
   assert.ok(text.includes('Review supplier')&&text.includes('125,000'));
   assert.ok(text.includes('Review buyer')&&text.includes('50,000'));
   assert.equal(await page.evaluate(()=>Array.isArray(state.initialOpening69.parties)),false);
   assert.equal(await page.evaluate(()=>Object.keys(state.initialOpening69.parties).join(',')),'3,5');
   if(role==='owner')assert.equal(await page.locator('#op69Confirm').isDisabled(),true);
   else assert.equal(await page.locator('#op69Confirm').count(),0);
   await page.evaluate(()=>{state.initialOpening69=pweHydrate(JSON.parse(JSON.stringify({initialOpening69:state.initialOpening69}))).initialOpening69;opening69View('review');});
   assert.ok((await page.locator('#opening69').innerText()).includes('125,000'));
   results.push(role+' at '+width+': sparse drafts review, existing amounts, reload serialization and approval guards passed');
  }
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.message);throw error;}
 finally{await browser.close();fs.writeFileSync('docs/evidence/opening-review.json',JSON.stringify({passed:errors.length===0,results,errors},null,2));}
 console.log(JSON.stringify({results,errors},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
