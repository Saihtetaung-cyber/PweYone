const fs=require('node:fs');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/closing-preview.html','utf8');
html=html.replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const errors=[],checks=[],console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:console,beforeParse(window){window.scrollTo=()=>{};window.HTMLElement.prototype.scrollIntoView=()=>{};window.matchMedia=()=>({matches:false,addEventListener(){}});window.fetch=async()=>({ok:false,json:async()=>({message:'UI fixture only'})});}});
setTimeout(()=>{
 try{
  const window=dom.window,state=window.eval('state'),original={...state.receipts[0]};
  function setup({paid=10000,linked=false,confirmed=true,settlementPaid=6000,mixed=false,soldOnly=false}={}){
   const receipt={...original,status:soldOnly?'await':'purchased',net4:10000,paid,qty:soldOnly?1000:400,payments:[],remainingPurchase2:linked&&!soldOnly?{schema:1,original:{qty:1000,bags:30,weightKnown:true},sourceSaleIds:['linked-sale']}:null};
   state.receipts=[receipt];state.lots=[];state.sales=[];state.traderSettlements74=[];
   if(mixed)state.receipts.push({...receipt,id:'unpaid-line',product:'Corn',net4:5000,paid:0});
   if(linked){
    state.sales=[{id:'linked-sale',voucherNo:'SALE-LINK',no:'SALE-LINK',date:receipt.date,product:receipt.product,grade:receipt.grade,qty:soldOnly?1000:600,sourceOwner:'supplier',sourceSupplierId:receipt.partnerId,sourceReceiptId:receipt.id,grossTotal:6000,total:6000,paid:6000,payments:[],dispatches:[]}];
    state.traderSettlements74=[{id:'settlement',partnerId:receipt.partnerId,saleVoucher:'SALE-LINK',saleIds:['linked-sale'],sourceKey:JSON.stringify(['SALE-LINK',receipt.partnerId]),status:confirmed?'confirmed':'pending',gross:6000,serverNet:6000,serverPaid:settlementPaid,charges:{service:0,labor:0,others:[],advance:0,recoveries:[],loanTotal38:0},payments:[{amount:settlementPaid}]}];
   }
   window.eval("workView=null;workDirty=false;page='receipts';filter='all';searchTerm='';render()");
   return window.document.querySelector('#receiptRows article');
  }
  function assertPaid(card){
   assert.equal(card.dataset.receiptSettled,'true');assert.equal(card.querySelector('.pill').textContent,'ငွေရှင်းပြီးသား');
   assert.equal([...card.querySelectorAll('[onclick]')].some(button=>button.getAttribute('onclick').startsWith('openSupplierAdvance(')),false);
   assert.equal([...card.querySelectorAll('button')].some(button=>button.textContent.trim()==='ကုန်သည်ငွေရှင်းသို့'),false);
  }
  assertPaid(setup());checks.push('Fully paid purchase has paid label and no advance action');
  let card=setup({paid:9999.99});assert.equal(card.dataset.receiptSettled,undefined);assert.ok([...card.querySelectorAll('[onclick]')].some(button=>button.getAttribute('onclick').startsWith('openSupplierAdvance(')));checks.push('One-cent unpaid balance retains actions');
  card=setup({mixed:true});assert.equal(card.dataset.receiptSettled,undefined);checks.push('One unpaid line keeps a mixed voucher unpaid');
  assertPaid(setup({linked:true}));checks.push('Paid residual purchase plus paid supplier settlement hides both actions');
  card=setup({linked:true,settlementPaid:5999.99});assert.equal(card.dataset.receiptSettled,undefined);checks.push('Unpaid supplier side is not masked by a paid residual purchase');
  card=setup({linked:true,confirmed:false});assert.equal(card.dataset.receiptSettled,undefined);checks.push('Unconfirmed settlement is not marked paid');
  assertPaid(setup({linked:true,soldOnly:true}));checks.push('Fully sold supplier receipt with confirmed full settlement is paid');
  assertPaid(setup({linked:true}));window.eval(`receiptDetail4('${original.id}')`);
  assert.ok(window.document.querySelector('.modal-body [data-receipt-settled]'));assert.ok(window.document.querySelector('[data-receipt-print]'));
  assert.equal([...window.document.querySelectorAll('.modal-footer button')].some(button=>button.textContent.trim()==='ကုန်သည်ငွေရှင်းသို့'),false);checks.push('Paid detail retains printing and removes further settlement actions');
  assert.deepEqual(errors,[]);
 }catch(error){errors.push(error.stack);}
 fs.writeFileSync('docs/evidence/receipt-paid-status.json',JSON.stringify({passed:errors.length===0,checks,errors},null,2));process.stdout.write(JSON.stringify({checks,errors},null,2)+'\n');process.exit(errors.length?1:0);
},300);
