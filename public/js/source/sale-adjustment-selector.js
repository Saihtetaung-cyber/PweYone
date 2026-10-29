
/* Version_2: explicit sale addition/deduction selector. Preserve the existing
   batch, stock, cash receipt, trader settlement and purchase implementations. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),num=x=>Number(x)||0,sum=(rows,fn)=>rows.reduce((n,r)=>n+num(fn(r)),0),round=x=>Math.round(x*1e8)/1e8;
 const rules=()=>deductionRatesFor('sale',true).filter(r=>r.calcMode==='manual');
 const name=r=>String(r?.displayName||r?.customType||r?.name||'');
 const subtractionNodes=()=>[...document.querySelectorAll('#saleDeductionRows58 .sale-subtraction-row2')];
 let sequence=0;
 function subtractions(){return subtractionNodes().map(el=>{
  const i=el.dataset.subtractionIndex,r=deductionRateById(value('ssr2-'+i));
  return {rateId:r?.id||'',itemType:r?.itemType||'custom',customType:r?.customType||'',label:name(r),basis:'manual',rate:0,amount:number('ssa2-'+i),direction:'subtract'};
 }).filter(r=>r.rateId);}
 const plusBefore=addSaleDeductionRow58;
 addSaleDeductionRow58=function(...args){
  const result=plusBefore.apply(this,args);
  if(v4Kind==='sale')document.querySelectorAll('#saleDeductionRows58 .sale-deduction-row58').forEach(el=>{
   const heading=el.querySelector('.row>strong'),label=el.querySelector('label');
   if(heading)heading.textContent='+ ပေါင်းငွေ';if(label)label.textContent='ပေါင်းငွေအမျိုးအစား';
  });return result;
 };
 window.addSaleSubtractionRow2=function(){
  const root=$('saleDeductionRows58');if(v4Kind!=='sale'||!root)return;
  const opts=rules();if(!opts.length)return error('ပေါင်းနုတ်ငွေ နှုန်းထားတွင် အရောင်းအတွက် Manual အသုံးပြုမည့် အမျိုးအစားကို အရင်ထည့်ပါ။');
  const i=sequence++;
  root.insertAdjacentHTML('beforeend',`<section class="card sale-subtraction-row2" data-subtraction-index="${i}"><div class="row between wrap"><strong>− နုတ်ငွေ</strong>${smallbtn('ဖယ်ရှားမယ်','this.closest(\'.sale-subtraction-row2\').remove();calcVoucher4()','ghost')}</div><div class="field-row mt">${selectField('နုတ်ငွေအမျိုးအစား','ssr2-'+i,[['','ရွေးပါ'],...opts.map(r=>[r.id,name(r)])],'','onchange="calcVoucher4()"')}<div>${field('ငွေပမာဏ','ssa2-'+i,{type:'number',min:0,step:1,value:0,suffix:'ကျပ်',extra:'oninput="calcVoucher4()"'})}</div></div></section>`);
  calcVoucher4();
 };
 window.saleAdjustmentChoice2=function(){
  const mode=$('saleAdjustmentKind2')?.value,button=$('saleAdjustmentAdd2'),hint=$('saleAdjustmentHint2');if(!button||!hint)return;
  button.disabled=!['add','subtract'].includes(mode);
  button.textContent=mode==='add'?'+ ပေါင်းငွေ Row ထည့်မည်':mode==='subtract'?'− နုတ်ငွေ Row ထည့်မည်':'Row အသစ်ထည့်မည်';
  hint.textContent=mode==='add'?'ပေါင်းငွေကို ရွေးထားပါသည်။ ကျသင့်ငွေ တိုးပါမည်။':mode==='subtract'?'နုတ်ငွေကို ရွေးထားပါသည်။ ကျသင့်ငွေ လျော့ပါမည်။':'ထည့်မည့် Row အတွက် နုတ်ငွေ သို့မဟုတ် ပေါင်းငွေကို အရင်ရွေးပါ။';
 };
 window.addSelectedSaleAdjustment2=function(){
  if(v4Kind!=='sale')return;const select=$('saleAdjustmentKind2'),mode=select?.value,root=$('saleDeductionRows58');
  if(!['add','subtract'].includes(mode)||!root)return;
  const count=root.children.length;
  if(mode==='add')addSaleDeductionRow58();else addSaleSubtractionRow2();
  if(root.children.length<=count)return;
  select.value='';saleAdjustmentChoice2();root.lastElementChild?.querySelector('select')?.focus({preventScroll:true});
 };
 const formBefore=voucherForm4;
 voucherForm4=function(...args){
  sequence=0;const result=formBefore.apply(this,args);if(v4Kind!=='sale'||!$('voucher4'))return result;
  const form=$('voucher4'),button=form.querySelector('[onclick="addSaleDeductionRow58()"]');
  if(button){const actions=button.parentElement;actions.classList.add('sale-adjustment-actions2');
   actions.innerHTML='<div class="sale-adjustment-picker2"><label for="saleAdjustmentKind2">ထည့်မည့်ငွေအမျိုးအစား</label><select id="saleAdjustmentKind2" aria-describedby="saleAdjustmentHint2" onchange="saleAdjustmentChoice2()"><option value="">နုတ်ငွေ / ပေါင်းငွေ ရွေးပါ</option><option value="subtract">− နုတ်ငွေ</option><option value="add">+ ပေါင်းငွေ</option></select></div>'+
    '<button type="button" id="saleAdjustmentAdd2" class="btn btn-secondary" onclick="addSelectedSaleAdjustment2()" disabled>Row အသစ်ထည့်မည်</button>'+
    '<p id="saleAdjustmentHint2" role="status" aria-live="polite">ထည့်မည့် Row အတွက် နုတ်ငွေ သို့မဟုတ် ပေါင်းငွေကို အရင်ရွေးပါ။</p>';
  }
  const heading=form.querySelector('.v55-fees .v55-section-heading h2');if(heading)heading.textContent='ဝန်ဆောင်ခနှင့် ပေါင်းနုတ်ငွေများ';
  const sub=form.querySelector('.v55-fees .v55-section-heading p');if(sub)sub.textContent='ပေါင်းငွေက ကျသင့်ငွေကို တိုးပြီး နုတ်ငွေက ကျသင့်ငွေကို လျှော့ပေးပါမည်။';
  const summary=form.querySelector('.v55-fees details>summary');if(summary)summary.textContent='ပေါင်းနုတ်ငွေ ထည့်ရန်';
  form.querySelectorAll('.v55-fees p').forEach(p=>{if(p.textContent.includes('အခြားထပ်ပေါင်းငွေများကို'))p.textContent='ဝန်ဆောင်ခနှင့် လုပ်သားခမှလွဲ၍ အရောင်းအတွက် သတ်မှတ်ထားသော အမျိုးအစားများကို ပေါင်းငွေ သို့မဟုတ် နုတ်ငွေအဖြစ် ရွေးပြီး ငွေပမာဏထည့်ပါ။';});
  const note=form.querySelector('.v55-fees .v57-recovery-note');if(note)note.innerHTML='<strong>ပေါင်းနုတ်ငွေ · တစ်ကြိမ်သာ တွက်ရန်</strong><span>စုစုပေါင်းကုန်ဖိုး + ပေါင်းငွေ − နုတ်ငွေ = ဝယ်သူကျသင့်ငွေ</span>';
  const side=form.querySelector('.v55-aside-head small');if(side)side.textContent='ဈေးနှုန်း၊ ပေါင်းငွေ / နုတ်ငွေ ပြောင်းလျှင် Auto ပြန်တွက်ပါမည်။';
  calcVoucher4();return result;
 };
 const readBefore=readCharges4;
 readCharges4=function(){
  const c=readBefore();if(v4Kind!=='sale'||!$('voucher4'))return c;
  const rows=subtractions(),deduct=round(sum(rows,r=>r.amount));
  const add=round(num(c.truck)+num(c.labor)+num(c.clean)+num(c.plastic)+num(c.sack)+num(c.advance)+num(c.serviceFee));
  c.saleAdjustments2={schema:1,deductionRows:rows,deductionTotal:deduct,additionTotal:add};
  return c;
 };
 function detail(c){return [['ဝန်ဆောင်ခ'+(num(c.serviceRateValue)>0?' · '+N(c.serviceRateValue)+'%':''),num(c.serviceFee)],['လုပ်သားခ',num(c.labor)],...(c.dynamicRows||[]).map(r=>[r.label||r.name||'ပေါင်းငွေ',num(r.amount)])]
  .filter(([,amount])=>amount>0).map(([label,amount])=>row4(E(label),'+ '+cashText(amount))).join('')+
  (c.saleAdjustments2.deductionRows||[]).filter(r=>r.amount>0).map(r=>row4(E(r.label),'− '+cashText(r.amount))).join('');}
 function net(c,g){return round(g+c.saleAdjustments2.additionTotal-c.saleAdjustments2.deductionTotal);}
 const calcBefore=calcVoucher4;
 calcVoucher4=function(){
  const result=calcBefore();if(v4Kind!=='sale'||!$('voucherSummary4'))return result;
  const c=readCharges4(),g=sum(readVoucherLines4(),r=>r.total),total=net(c,g),paid=number('fPaid')||0;
  $('voucherSummary4').classList.add('sale-signed-summary2');
  $('voucherSummary4').innerHTML=row4('စုစုပေါင်းကုန်ဖိုး',cashText(g))+'<div class="v41-fee-title">ပေါင်းနုတ်ငွေအသေးစိတ်</div>'+detail(c)+
   row4('စုစုပေါင်းပေါင်းငွေ','+ '+cashText(c.saleAdjustments2.additionTotal))+row4('စုစုပေါင်းနုတ်ငွေ','− '+cashText(c.saleAdjustments2.deductionTotal))+
   '<div class="summary-line total"><span>စုစုပေါင်း ကျသင့်ငွေ</span><strong>'+cashText(total)+'</strong></div>'+row4('ယခုလက်ခံငွေ',cashText(paid))+row4('ရရန်ကျန်',cashText(round(total-paid)));
  return result;
 };
 function validate(){
  const seen=new Set();
  for(const el of [...document.querySelectorAll('#saleDeductionRows58 .sale-deduction-row58'),...subtractionNodes()]){
   const sub=el.classList.contains('sale-subtraction-row2'),i=sub?el.dataset.subtractionIndex:el.dataset.i;
   const id=value((sub?'ssr2-':'sdr58')+i),input=$((sub?'ssa2-':'sda58')+i),amount=Number(input?.value);
   if(!input||input.value===''||!Number.isFinite(amount)||amount<0)return 'ပေါင်းငွေ / နုတ်ငွေပမာဏကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။';
   if(!id&&amount>0)return 'ငွေပမာဏထည့်ထားသော Row ၏ အမျိုးအစားကို ရွေးပါ။';
   if(!id)continue;
   const rule=rules().find(r=>r.id===id);if(!rule)return 'ရွေးထားသော ပေါင်းငွေ / နုတ်ငွေအမျိုးအစားကို အသုံးပြု၍ မရတော့ပါ။';
   const key=(sub?'subtract:':'add:')+(typeof recoveryCategory57==='function'?recoveryCategory57(rule):id);
   if(seen.has(key))return 'အမျိုးအစားတူကို တူညီသော ပေါင်းငွေ သို့မဟုတ် နုတ်ငွေအဖြစ် တစ်ကြိမ်သာ ရွေးပါ။';seen.add(key);
  }
  return '';
 }
 const commitBefore=commitVoucher4;
 commitVoucher4=function(...args){
  if(v4Kind==='sale'&&$('voucher4')){
   const msg=validate();if(msg)return error(msg);
   const c=readCharges4(),total=net(c,sum(readVoucherLines4(),r=>r.total)),paid=number('fPaid');
   if(!Number.isFinite(total)||total<0||!Number.isFinite(paid)||paid<0||paid>total)return error('ပေါင်းငွေ၊ နုတ်ငွေနှင့် ယခုလက်ခံငွေကို ပြန်စစ်ပါ။ ကျသင့်ငွေသည် သုညအောက် မဖြစ်ရပါ။');
  }
  return commitBefore.apply(this,args);
 };
 const summaryBefore=chargesSummary4;
 chargesSummary4=function(c){
  if(!c?.saleAdjustments2)return summaryBefore(c);
  return '<section class="v41-details-card v41-itemized sale-signed-summary2"><h3>အရောင်း ပေါင်းနုတ်ငွေအသေးစိတ်</h3>'+detail(c)+row4('စုစုပေါင်းပေါင်းငွေ','+ '+cashText(c.saleAdjustments2.additionTotal))+row4('စုစုပေါင်းနုတ်ငွေ','− '+cashText(c.saleAdjustments2.deductionTotal))+row4('စုစုပေါင်း ကျသင့်ငွေ',cashText(net(c,num(c.gross))))+'</section>';
 };
 const usedBefore=rateUsed;
 rateUsed=function(id){return usedBefore(id)||state.sales.some(s=>s.charges4?.saleAdjustments2&&[...(s.charges4.dynamicRows||[]),...(s.charges4.saleAdjustments2.deductionRows||[])].some(r=>r.rateId===id));};
})();

