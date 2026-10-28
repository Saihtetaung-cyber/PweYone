const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/closing-preview.html','utf8');
html=html.replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const errors=[],checks=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>({ok:false,json:async()=>({message:'UI fixture only'})});}});
setTimeout(()=>{
 try{
  const w=dom.window,s=w.eval('state'),base={...s.receipts[0],status:'await',price:null,qty:100,weightKnown:true};
  s.receipts=[base];s.sales=[];
  function open(){s.lots=[{id:'source',receiptId:base.id,product:base.product,owner:'supplier',qty:100,weightKnown:true}];w.eval("workDirty=false;v4Kind='purchase';voucherForm4(state.receipts)");w.pweMoneyInputs.refresh();return w.document.getElementById('fAdvance');}
  s.partnerAdvances=[{id:'advance-1',partnerId:base.partnerId,amount:100000,allocations:[{amount:30000}]},{id:'other',partnerId:'other-party',amount:900000,allocations:[]}];
  let input=open();assert.equal(input.value,'70000');assert.equal(input.max,'70000');assert.equal(input.readOnly,false);assert.equal(input.disabled,false);
  assert.equal(w.pweMoneyInputs.display(input),'70,000');checks.push('Autofill uses this supplier remaining advance after allocations, not other supplier funds, with editable grouped amount');
  input.value='25000';input.dispatchEvent(new w.Event('input',{bubbles:true}));w.document.getElementById('vq0').value='200';w.eval('calcVoucher4()');
  const basis=w.document.getElementById('fBasis');basis.value='bag';basis.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(input.value,'25000');assert.equal(w.eval('readCharges4().advance'),25000);
  checks.push('Manual partial recovery survives quantity and price-basis recalculation');
  input.value='0';w.eval('calcVoucher4()');assert.equal(input.value,'0');checks.push('Explicit zero remains zero instead of being refilled');
  input.value='70001';assert.equal(input.checkValidity(),false);input.value='-1';assert.equal(input.checkValidity(),false);checks.push('Input validation rejects excess and negative recovery amounts');
  s.partnerAdvances[0].allocations.push({amount:20000});input=open();assert.equal(input.value,'50000');checks.push('Reopening reads the latest remaining advance');
  s.partnerAdvances[0].allocations=[{amount:100000}];input=open();assert.equal(input.value,'0');checks.push('Fully recovered advance defaults to zero');
  s.partnerAdvances=[s.partnerAdvances[1]];input=open();assert.equal(input.value,'0');checks.push('No advance for the selected supplier defaults to zero');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);}
 fs.writeFileSync('docs/evidence/purchase-advance.json',JSON.stringify({passed:!errors.length,checks,errors},null,2));process.stdout.write(JSON.stringify({checks,errors},null,2)+'\n');process.exit(errors.length?1:0);
},300);
