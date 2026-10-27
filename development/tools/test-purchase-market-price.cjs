const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/closing-preview.html','utf8');
html=html.replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const errors=[],checks=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>({ok:false,json:async()=>({message:'UI fixture only'})});}});
setTimeout(()=>{
 try{
  const w=dom.window,s=w.eval('state'),base={...s.receipts[0],status:'await',price:null,qty:100,weightKnown:true};
  s.sales=[];s.receipts=[base];s.priceDate=s.day;s.prices={[base.product+'|'+base.grade]:45000};
  function open(){s.lots=s.receipts.map(r=>({id:'lot-'+r.id,receiptId:r.id,product:r.product,owner:'supplier',qty:r.qty,weightKnown:true}));w.eval("workDirty=false;v4Kind='purchase';voucherForm4(state.receipts)");}
  function choose(basis){const select=w.document.querySelector('#fBasis');select.value=basis;select.dispatchEvent(new w.Event('change',{bubbles:true}));}
  open();assert.equal(w.document.querySelector('#fBasis').value,'viss');assert.equal(w.document.querySelector('#vr0').value,'');
  checks.push('Opening a per-viss form does not select standard-bag mode or autofill its quote');
  choose('bag');
  const input=w.document.querySelector('#vr0');assert.equal(input.value,'45000');assert.equal(input.readOnly,false);assert.equal(input.disabled,false);
  checks.push('Current product and grade quote fills editable standard-bag price directly');
  input.value='47000';input.dispatchEvent(new w.Event('input',{bubbles:true}));
  w.document.querySelector('#vq0').value='125';w.eval('calcVoucher4()');assert.equal(input.value,'47000');
  assert.equal(w.eval('readVoucherLines4()[0].price'),47000);
  checks.push('Manual price survives quantity and charge recalculation and is used by purchase rows');
  choose('viss');assert.equal(input.value,'');input.value='1350';input.dispatchEvent(new w.Event('input',{bubbles:true}));
  choose('bag');assert.equal(input.value,'47000');choose('viss');assert.equal(input.value,'1350');
  checks.push('Unit changes keep independent manual drafts; bag prices never carry into per-viss prices');
  choose('bag');input.value='';choose('viss');choose('bag');assert.equal(input.value,'');
  checks.push('An intentionally cleared bag price stays empty after switching modes');
  s.priceDate='2000-01-01';open();assert.equal(w.document.querySelector('#vr0').value,'');assert.equal(w.document.querySelector('#fBasis').value,'viss');
  checks.push('Stale daily quote is not used');
  choose('bag');assert.equal(w.document.querySelector('#vr0').value,'');
  s.priceDate=s.day;s.prices={[base.product+'|Different']:50000};open();choose('bag');assert.equal(w.document.querySelector('#vr0').value,'');
  checks.push('Other grade does not supply a price');
  s.prices={[base.product+'|'+base.grade]:0};open();choose('bag');assert.equal(w.document.querySelector('#vr0').value,'');
  checks.push('Missing or zero quote leaves manual entry available');
  s.prices={[base.product+'|'+base.grade]:45000};s.receipts.push({...base,id:'second-line',grade:'Different'});open();choose('bag');
  assert.equal(w.document.querySelector('#vr0').value,'45000');assert.equal(w.document.querySelector('#vr1').value,'');
  checks.push('Mixed-grade voucher fills only matching lines');
  w.eval("v4Kind='sale';voucherForm4([{}])");assert.equal(w.document.querySelector('#vr0').value,'');
  checks.push('Sales do not inherit purchase market prices');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);}
 fs.writeFileSync('docs/evidence/purchase-market-price.json',JSON.stringify({passed:!errors.length,checks,errors},null,2));
 process.stdout.write(JSON.stringify({checks,errors},null,2)+'\n');process.exit(errors.length?1:0);
},300);
