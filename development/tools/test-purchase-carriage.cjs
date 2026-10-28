const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/closing-preview.html','utf8');
html=html.replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const errors=[],checks=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>({ok:false,json:async()=>({message:'UI fixture only'})});}});
setTimeout(()=>{
 try{
  const w=dom.window,s=w.eval('state'),base={...s.receipts[0],status:'await',price:null,qty:100,weightKnown:true,backendDocumentId:10,carriageAdvance:20000,carriageExpenseId:'outlay-1'};
  s.receipts=[base,{...base,id:'second-line'}];s.sales=[];s.partnerAdvances=[];
  s.expenses=[{id:'outlay-1',partnerId:base.partnerId,amount:20000,sourceDocumentId:'10',recoverable:true,recovered:false,settlementRecoveries74:[{amount:5000}]},{id:'other-receipt',partnerId:base.partnerId,amount:90000,sourceDocumentId:'99',recoverable:true},{id:'other-party',partnerId:'someone-else',amount:80000,sourceDocumentId:'10',recoverable:true}];
  function open(){s.lots=s.receipts.map(r=>({id:'lot-'+r.id,receiptId:r.id,product:r.product,owner:'supplier',qty:100,weightKnown:true}));w.eval("workDirty=false;v4Kind='purchase';v4ReceiptIds=state.receipts.map(r=>r.id);voucherForm4(state.receipts)");w.pweMoneyInputs.refresh();return w.document.getElementById('fCarriageRecovery');}
  let input=open();assert.equal(input.value,'15000');assert.equal(w.pweMoneyInputs.display(input),'15,000');assert.equal(input.readOnly,false);assert.equal(input.max,'15000');assert.equal(w.document.querySelectorAll('#fCarriageRecovery').length,1);
  assert.equal(w.eval('readCharges4().carriage'),15000);assert.equal(w.eval('readCharges4().purchaseAdjustments2.deductionTotal'),15000);
  checks.push('Linked receipt remaining outlay autofills once across multiple lines; unrelated receipt/trader funds are excluded and summary deducts once');
  input.value='1234.56';input.dispatchEvent(new w.Event('input',{bubbles:true}));w.document.getElementById('vr0').value='800';w.eval('calcVoucher4()');
  const basis=w.document.getElementById('fBasis');basis.value='bag';basis.dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(input.value,'1234.56');
  assert.equal(w.eval('readCharges4().carriage'),1234.56);assert.equal(Number(w.eval('readCharges4().purchaseAdjustments2.deductionTotal').toFixed(2)),1234.56);
  checks.push('Edited decimal recovery drives totals and survives price/basis changes');
  input.value='0';w.eval('calcVoucher4()');assert.equal(w.eval('readCharges4().purchaseAdjustments2.deductionTotal'),0);assert.equal(input.value,'0');checks.push('Explicit zero removes the deduction without restoring original carriage');
  input.value='15000.01';assert.equal(input.checkValidity(),false);input.value='-1';assert.equal(input.checkValidity(),false);checks.push('Negative and excess values are invalid');
  s.receipts=[{...base,carriageExpenseId:undefined,carriageAdvance:undefined,id:'later-line'}];input=open();assert.equal(input.value,'15000');checks.push('Document link still finds carriage when the first receiving line is unavailable');
  s.expenses[0].recovered=true;input=open();assert.equal(input.value,'0');assert.equal(w.eval('readCharges4().purchaseAdjustments2.deductionTotal'),0);checks.push('Already recovered outlay defaults to zero');
  s.expenses=[{id:'cent-a',partnerId:base.partnerId,sourceDocumentId:'10',amount:0.1,settlementRecoveries74:[{amount:0.01}],recoverable:true},{id:'cent-b',partnerId:base.partnerId,sourceDocumentId:'10',amount:0.2,recoverable:true}];input=open();assert.equal(input.value,'0.29');checks.push('Decimal balances sum to cents without a floating-point display tail');
  s.expenses=[];input=open();assert.equal(input.value,'0');assert.equal(input.max,'0');checks.push('Missing carriage presents a zero-valued field');
  w.eval("v4Kind='sale';voucherForm4([{}])");assert.equal(w.document.getElementById('fCarriageRecovery'),null);checks.push('Sales do not receive the purchase-only carriage field');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);}
 fs.writeFileSync('docs/evidence/purchase-carriage.json',JSON.stringify({passed:!errors.length,checks,errors},null,2));process.stdout.write(JSON.stringify({checks,errors},null,2)+'\n');process.exit(errors.length?1:0);
},300);
