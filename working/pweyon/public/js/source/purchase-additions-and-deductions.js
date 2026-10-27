
/* Version_2: manual purchase additions/subtractions; retain the existing payment,
   stock, advance and loan engine. Legacy saved vouchers and sales are unchanged. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),sum=(rows,fn)=>rows.reduce((n,x)=>n+fn(x),0);
 const money=x=>Number(x)||0,round=x=>Math.round(x*1e8)/1e8;
 const title='ပေါင်းနုတ်ငွေ နှုန်းထား';let additionSeq=0;
 const rules=()=>deductionRatesFor('purchase',true).filter(r=>r.calcMode==='manual');
 const name=r=>typeof deductionName48==='function'?deductionName48(r):r.displayName||r.name||r.customType;
 const manualRows=()=>[...document.querySelectorAll('#purchaseDeductionRows4 .purchase-addition-row2')];
 function additions(){return manualRows().map(el=>{
  const i=el.dataset.additionIndex,rule=deductionRateById(value('par2-'+i));
  return {rateId:rule?.id||'',itemType:rule?.itemType||'custom',customType:rule?.customType||'',label:rule?name(rule):'',basis:'manual',rate:0,amount:number('paa2-'+i),direction:'add'};
 }).filter(r=>r.rateId);}
 function replaceText(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while(n=walker.nextNode()){
   n.nodeValue=n.nodeValue.replace(/အဝယ် နုတ်ငွေ နှုန်းထား|အဝယ်နုတ်ငွေ နှုန်းထား/g,title)
    .replace(/နုတ်ငွေအမျိုးအစား/g,'ပေါင်းငွေ / နုတ်ငွေအမျိုးအစား');
  }
 }
 const setupBefore=setupView;
 setupView=function(){
  const root=document.createElement('div');root.innerHTML=setupBefore();
  if(setupSection==='deductions'){
   replaceText(root);
   const desc=root.querySelector('.page-heading p');
   if(desc)desc.textContent='ဝန်ဆောင်ခနှင့် လုပ်သားခကို မူလအတိုင်း Auto တွက်ပါမည်။ အခြားအမျိုးအစားများကို ဈေးဖြတ်ချိန်တွင် ပေါင်းငွေ သို့မဟုတ် နုတ်ငွေအဖြစ် ရွေးသုံးနိုင်ပါသည်။';
  }else if(setupSection==='overview'){
   const buttons=[...root.querySelectorAll('[onclick]')].filter(el=>(el.getAttribute('onclick')||'').includes("'deductions'"));
   buttons.forEach(el=>replaceText(el));
   // Some setup layouts put the click handler on a card descendant.
   root.querySelectorAll('.v3-master-card,.setup2-card').forEach(card=>{if(card.innerHTML.includes("'deductions'"))replaceText(card);});
  }
  return root.innerHTML;
 };
 const usedBefore=rateUsed;
 rateUsed=function(id){return usedBefore(id)||state.receipts.some(r=>(r.charges4?.purchaseAdjustments2?.additionRows||[]).some(row=>row.rateId===id));};
 const subtractBefore=addPurchaseDeductionRow4;
 addPurchaseDeductionRow4=function(...args){
  const result=subtractBefore.apply(this,args);
  if(v4Kind==='purchase')document.querySelectorAll('#purchaseDeductionRows4 .deduction-row4>.row>strong').forEach(el=>{if(!el.textContent.startsWith('−'))el.textContent='− '+el.textContent;});
  return result;
 };
 window.addPurchaseAdditionRow2=function(rateId=''){
  const root=$('purchaseDeductionRows4');if(v4Kind!=='purchase'||!root)return;
  const opts=rules();if(!opts.length)return error('ပေါင်းနုတ်ငွေ နှုန်းထားတွင် Manual အသုံးပြုမည့် အမျိုးအစားကို အရင်ထည့်ပါ။');
  const i=additionSeq++;
  root.insertAdjacentHTML('beforeend',`<section class="card purchase-addition-row2" data-addition-index="${i}"><div class="row between wrap"><strong class="purchase-addition-title2">+ ပေါင်းငွေ</strong>${smallbtn('ဖယ်ရှားမယ်','removePurchaseAdditionRow2(this)','ghost')}</div><div class="field-row mt">${selectField('ပေါင်းငွေအမျိုးအစား','par2-'+i,[['','ရွေးပါ'],...opts.map(r=>[r.id,name(r)])],rateId,'onchange="calcVoucher4()"')}<div>${field('ငွေပမာဏ','paa2-'+i,{type:'number',min:0,step:1,value:0,suffix:'ကျပ်',extra:'oninput="calcVoucher4()"'})}</div></div></section>`);
  calcVoucher4();
 };
 window.removePurchaseAdditionRow2=function(button){button.closest('.purchase-addition-row2')?.remove();calcVoucher4();};
 const formBefore=voucherForm4;
 voucherForm4=function(...args){
  additionSeq=0;const result=formBefore.apply(this,args);
  if(v4Kind!=='purchase'||!$('voucher4'))return result;
  const form=$('voucher4'),button=form.querySelector('[onclick="addPurchaseDeductionRow4()"]');
  if(button&&!form.querySelector('.purchase-adjustment-actions2')){
   const actions=button.parentElement;actions.classList.add('purchase-adjustment-actions2');
   button.innerHTML='<span aria-hidden="true">−</span> နုတ်ငွေ Row အသစ်ထည့်မည်';
   actions.insertAdjacentHTML('beforeend',btn('+ ပေါင်းငွေ Row အသစ်ထည့်မည်','addPurchaseAdditionRow2()','secondary'));
  }
  const heading=form.querySelector('.v55-fees .v55-section-heading h2');if(heading)heading.textContent='ဝန်ဆောင်ခနှင့် ပေါင်းနုတ်ငွေများ';
  const sub=form.querySelector('.v55-fees .v55-section-heading p');if(sub)sub.textContent='နုတ်ငွေက ပေးရန်ငွေကို လျှော့ပြီး ပေါင်းငွေက ပေးရန်ငွေကို တိုးပေးပါမည်။';
  const summary=form.querySelector('.v55-fees details>summary');if(summary)summary.textContent='ပေါင်းနုတ်ငွေ ထည့်ရန်';
  form.querySelectorAll('.v55-fees p').forEach(hint=>{if(hint.textContent.includes('ကျန်နုတ်ငွေအမျိုးအစားများ'))hint.textContent='ဝန်ဆောင်ခနှင့် လုပ်သားခမှလွဲ၍ အခြားအမျိုးအစားများကို ပေါင်းငွေ သို့မဟုတ် နုတ်ငွေအဖြစ် ရွေးပြီး ငွေပမာဏထည့်ပါ။';});
  const note=form.querySelector('.v55-fees .v57-recovery-note');
  if(note){const strong=note.querySelector('strong');if(strong)strong.textContent='ပေါင်းနုတ်ငွေ · တစ်ကြိမ်သာ တွက်ရန်';}
  const side=form.querySelector('.v55-aside-head small');if(side)side.textContent='ဈေးနှုန်း၊ ပေါင်းငွေ / နုတ်ငွေ ပြောင်းလျှင် Auto ပြန်တွက်ပါမည်။';
  calcVoucher4();return result;
 };
 const readBefore=readCharges4;
 readCharges4=function(){
  const c=readBefore();if(v4Kind!=='purchase'||!$('voucher4'))return c;
  const rows=additions(),add=round(sum(rows,r=>money(r.amount)));
  const debit=round(money(c.truck)+money(c.labor)+money(c.clean)+money(c.plastic)+money(c.sack)+money(c.advance)+money(c.serviceFee)+money(c.loanTotal38));
  c.purchaseAdjustments2={schema:1,additionRows:rows,additionTotal:add,deductionTotal:debit};
  // Keep every existing charge positive and intact. The purchase commit uses the
  // explicit addition total when computing the final payable.
  return c;
 };
 function detail(c){
  const rows=[['ဝန်ဆောင်ခ'+(money(c.serviceRateValue)>0?' · '+N(c.serviceRateValue)+'%':''),money(c.serviceFee)],['လုပ်သားခ',money(c.labor)],
   ['တန်ဆာခ (ခေါက်ရှည်) · ယာယီစိုက်ငွေ ပြန်နုတ်',money(c.carriage)],
   ...(c.dynamicRows||[]).map(r=>[r.label||r.name||'နုတ်ငွေ',money(r.amount)]),
   ['ကြိုသုံးငွေ (အတိုးမဲ့) ပြန်နုတ်',money(c.advance)],
   ['ကြိုထုတ်ငွေ အရင်းပြန်ဆပ်',sum(c.loanPayments38||[],r=>money(r.principal))],
   ['ကြိုထုတ်ငွေ အတိုးပေး',sum(c.loanPayments38||[],r=>money(r.interest))]];
  return rows.filter(([,amount])=>amount>0).map(([label,amount])=>row4(E(label),'− '+cashText(amount))).join('')+
   (c.purchaseAdjustments2.additionRows||[]).filter(r=>r.amount>0).map(r=>row4(E(r.label),'+ '+cashText(r.amount))).join('');
 }
 function totals(c,gross){const a=c.purchaseAdjustments2;return {add:a.additionTotal,deduct:a.deductionTotal,net:round(gross+a.additionTotal-a.deductionTotal)};}
 const calcBefore=calcVoucher4;
 calcVoucher4=function(){
  const result=calcBefore();if(v4Kind!=='purchase'||!$('voucherSummary4'))return result;
  const c=readCharges4(),g=sum(readVoucherLines4(),r=>money(r.total)),t=totals(c,g),paid=number('fPaid')||0;
  $('voucherSummary4').classList.add('purchase-signed-summary2');
  $('voucherSummary4').innerHTML=row4('စုစုပေါင်းကုန်ဖိုး',cashText(g))+'<div class="v41-fee-title">ပေါင်းနုတ်ငွေအသေးစိတ်</div>'+detail(c)+
   row4('စုစုပေါင်းပေါင်းငွေ','+ '+cashText(t.add))+row4('စုစုပေါင်းနုတ်ငွေ','− '+cashText(t.deduct))+
   '<div class="summary-line total"><span>အသားတင် ပေးရန်</span><strong>'+cashText(t.net)+'</strong></div>'+row4('ယခု ငွေရှင်း',cashText(paid))+row4('ပေးရန်ကျန်',cashText(round(t.net-paid)));
  return result;
 };
 function validate(){
  const seen=new Set();
  for(const el of [...document.querySelectorAll('#purchaseDeductionRows4 .deduction-row4'),...manualRows()]){
   const add=el.classList.contains('purchase-addition-row2'),i=add?el.dataset.additionIndex:el.dataset.i;
   const id=value((add?'par2-':'pdr')+i),input=$((add?'paa2-':'pda')+i),amount=Number(input?.value);
   if(!input||input.value===''||!Number.isFinite(amount)||amount<0)return 'ပေါင်းငွေ / နုတ်ငွေပမာဏကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။';
   if(!id&&amount>0)return 'ငွေပမာဏထည့်ထားသော Row ၏ အမျိုးအစားကို ရွေးပါ။';
   if(!id)continue;
   const rule=rules().find(r=>r.id===id);if(!rule)return 'ရွေးထားသော ပေါင်းငွေ / နုတ်ငွေအမျိုးအစားကို အသုံးပြု၍ မရတော့ပါ။';
   if(add){const key=typeof recoveryCategory57==='function'?recoveryCategory57(rule):id;if(seen.has(key))return 'ပေါင်းငွေအမျိုးအစားတူကို တစ်ကြိမ်သာ ရွေးပါ။';seen.add(key);}
  }
  return '';
 }
 const commitBefore=commitVoucher4;
 commitVoucher4=function(...args){
  if(v4Kind==='purchase'&&$('voucher4')){
   const message=validate();if(message)return error(message);
   const c=readCharges4(),g=sum(readVoucherLines4(),r=>money(r.total)),t=totals(c,g),paid=number('fPaid');
   if(!Number.isFinite(t.net)||t.net<0||!Number.isFinite(paid)||paid<0||paid>t.net)return error('ပေါင်းငွေ၊ နုတ်ငွေနှင့် ယခုငွေရှင်းပမာဏကို ပြန်စစ်ပါ။ အသားတင်ငွေသည် သုညအောက် မဖြစ်ရပါ။');
  }
  return commitBefore.apply(this,args);
 };
 const summaryBefore=chargesSummary4;
 chargesSummary4=function(c){
  if(!c?.purchaseAdjustments2||c.chargeTreatment67==='add')return summaryBefore(c);
  const t=totals(c,money(c.gross));
  return '<section class="v41-details-card v41-itemized purchase-signed-summary2"><h3>အဝယ် ပေါင်းနုတ်ငွေအသေးစိတ်</h3>'+detail(c)+row4('စုစုပေါင်းပေါင်းငွေ','+ '+cashText(t.add))+row4('စုစုပေါင်းနုတ်ငွေ','− '+cashText(t.deduct))+row4('အသားတင် ပေးရန်',cashText(t.net))+'</section>';
 };
 if(page==='setup'&&!workView)render();
})();

