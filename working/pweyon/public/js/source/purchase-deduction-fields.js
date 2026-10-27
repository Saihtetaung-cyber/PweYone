
/* V4.4 — Purchase pricing uses only deduction rows created in Purchase Deduction Rates master. */
(function(){
 const bagIdx=deductionItemChoices.findIndex(x=>x[0]==='bag_fee');
 if(bagIdx<0){
  const otherIdx=deductionItemChoices.findIndex(x=>x[0]==='other');
  deductionItemChoices.splice(otherIdx<0?deductionItemChoices.length:otherIdx,0,['bag_fee','အိတ်ခ']);
 }
 const wh=deductionItemChoices.find(x=>x[0]==='warehouse');
 if(wh)wh[1]='ဂိုထောင်အိတ်ထိန်းသိမ်းခ';
})();
let purchaseDeductionRowSeq4=0;
function purchaseDeductionOptions4(){
 ensureDeductionRateMastersV43();
 return deductionRatesFor('purchase',true).filter(r=>r.itemType!=='labor');
}
function purchaseLaborOptions4(){
 ensureDeductionRateMastersV43();
 return deductionRatesFor('purchase',true).filter(r=>r.itemType==='labor');
}
function purchaseLaborField4(){
 const opts=purchaseLaborOptions4();
 return `<div class="field mt">${selectField('လုပ်သားခနှုန်းထား','purchaseLaborFixed4',[['','မရွေးပါ'],...opts.map(r=>[r.id,deductionOptionLabel(r)])],'','onchange="calcVoucher4()"')}<p class="field-help">လုပ်သားခကို Add Row မသုံးဘဲ ဤနေရာမှ တိုက်ရိုက်ရွေးသုံးပါ။ နှုန်းထားကို “အဝယ် နုတ်ငွေ နှုန်းထား” တွင် Create လုပ်နိုင်သည်။</p></div>`;
}
function readPurchaseLabor4(rows){
 const id=value('purchaseLaborFixed4');
 if(!id)return {rateId:'',amount:0,rule:null};
 const rule=deductionRateById(id);
 if(!deductionApplicable(rule,'purchase')||rule.itemType!=='labor')return {rateId:'',amount:0,rule:null};
 const gross=rows.reduce((n,r)=>n+r.total,0),bags=purchaseDeductionBagCount4(rows);
 return {rateId:id,amount:rateAmount(rule,gross,bags),rule};
}

function purchaseDeductionBagCount4(rows){
 return rows.reduce((sum,x)=>{
  const r=x.r||{};
  if(r.bagType==='finished')return sum+(Number(r.packageCount??r.bags)||0);
  if(r.bagType==='raw')return sum+(Number(r.rawBags??r.bags)||0);
  const std=productStandard(x.product)||0;
  return sum+(std>0?(Number(x.qty)||0)/std:0);
 },0);
}
function purchaseDeductionRowsHtml4(){
 return `<details class="req-details mt" open><summary>အဝယ်နုတ်ငွေ ထည့်ရန်</summary>
 ${purchaseLaborField4()}
 <p class="small muted mt">လုပ်သားခမှလွဲ၍ “အဝယ် နုတ်ငွေ နှုန်းထား” တွင် Create လုပ်ထားသော အခြားနုတ်ငွေများထဲမှ လိုအပ်တာကိုပဲ Row အဖြစ် ထည့်သုံးပါ။</p>
 <div id="purchaseDeductionRows4" class="stack-sm mt"></div>
 <div class="mt">${btn('နုတ်ငွေ Row အသစ်ထည့်မယ်','addPurchaseDeductionRow4()','secondary','plus')}</div>
 <div class="divider"></div>${num4('ကြိုသုံးငွေ ပြန်နုတ်ရန်','fAdvance',0,0,'oninput="calcVoucher4()"')}
 </details>`;
}
function addPurchaseDeductionRow4(rateId=''){
 const root=document.getElementById('purchaseDeductionRows4');if(!root)return;
 const opts=purchaseDeductionOptions4();
 if(!opts.length)return error('အဝယ် နုတ်ငွေ နှုန်းထားတွင် အသုံးပြုမည့် နုတ်ငွေကို အရင် Create လုပ်ပါ။');
 const i=purchaseDeductionRowSeq4++;
 root.insertAdjacentHTML('beforeend',`<section class="card deduction-row4" data-i="${i}">
  <div class="row between wrap"><strong>နုတ်ငွေ ${i+1}</strong>${smallbtn('ဖယ်ရှားမယ်','removePurchaseDeductionRow4(this)','ghost')}</div>
  <div class="field-row mt">${selectField('နုတ်ငွေအမျိုးအစား','pdr'+i,[['','ရွေးပါ'],...opts.map(r=>[r.id,deductionOptionLabel(r)])],rateId,'onchange="calcVoucher4()"')}
  ${field('တွက်ချက်ရလဒ်','pda'+i,{value:'0 ကျပ်',readonly:true})}</div>
 </section>`);
 calcVoucher4();
}
function removePurchaseDeductionRow4(btnEl){btnEl.closest('.deduction-row4')?.remove();calcVoucher4();}
function readPurchaseDeductionRows4(rows){
 const gross=rows.reduce((n,r)=>n+r.total,0),bags=purchaseDeductionBagCount4(rows),seen=new Set(),items=[];
 document.querySelectorAll('#purchaseDeductionRows4 .deduction-row4').forEach(el=>{
  const i=el.dataset.i,id=value('pdr'+i);if(!id)return;
  if(seen.has(id))return;seen.add(id);
  const rule=deductionRateById(id);if(!deductionApplicable(rule,'purchase'))return;
  const amount=rateAmount(rule,gross,bags);
  const out=document.getElementById('pda'+i);if(out)out.value=cashText(amount);
  items.push({rateId:id,itemType:rule.itemType,customType:rule.customType||'',label:deductionItemLabel(rule.itemType,rule.customType),basis:rule.basis,rate:Number(rule.rate)||0,amount});
 });
 return {items,total:items.reduce((n,x)=>n+x.amount,0),gross,bags};
}
const chargesFormBeforeV44=chargesForm4;
chargesForm4=function(){
 if(v4Kind==='purchase'){purchaseDeductionRowSeq4=0;return purchaseDeductionRowsHtml4();}
 return chargesFormBeforeV44();
};
const readChargesBeforeV44=readCharges4;
readCharges4=function(){
 if(v4Kind!=='purchase')return readChargesBeforeV44();
 const rows=readVoucherLines4(),d=readPurchaseDeductionRows4(rows),l=readPurchaseLabor4(rows);
 return {trip:'',truck:0,laborAuto:l.amount,labor:l.amount,laborBasis:l.rule?.basis||'',laborRange:'',laborRateId:l.rateId,clean:0,plastic:0,sack:0,advance:number('fAdvance')||0,serviceFee:d.total,dynamicRows:d.items,deductionRows:d.items};
};
const calcVoucherBeforeV44=calcVoucher4;
calcVoucher4=function(){
 if(v4Kind!=='purchase')return calcVoucherBeforeV44();
 const root=document.getElementById('voucherSummary4');if(!root)return;
 const rows=readVoucherLines4(),gross=rows.reduce((n,r)=>n+r.total,0),c=readCharges4(),deductionTotal=(c.serviceFee||0)+(c.labor||0)+(c.advance||0),net=gross-deductionTotal,paid=number('fPaid')||0;
 const detail=(c.dynamicRows||[]).map(x=>row4(`${E(x.label)} · ${E(x.basis==='percent_total'?N(x.rate)+'%':'တစ်အိတ် '+cashText(x.rate))}`,'− '+cashText(x.amount))).join('');
 const laborRule=c.laborRateId?deductionRateById(c.laborRateId):null;
 const laborLine=c.labor?row4(`လုပ်သားခ${laborRule?' · '+E(deductionBasisLabel(laborRule)):''}`,'− '+cashText(c.labor)):'';
 root.innerHTML=row4('စုစုပေါင်းကုန်ဖိုး',cashText(gross))+laborLine+detail+(c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု','− '+cashText(c.advance)):'')+row4('စုစုပေါင်းနုတ်ငွေ',cashText(deductionTotal))+row4('အသားတင်',cashText(net))+row4('ယခုငွေရှင်း',cashText(paid))+row4('ပေးရန်ကျန်',cashText(net-paid))+`<p class="small muted mt">လိုအပ်သည့်နုတ်ငွေကို “နုတ်ငွေ Row အသစ်ထည့်မယ်” ဖြင့် ထည့်ပြီး Master နှုန်းထားအတိုင်း Auto တွက်သည်။</p>`;
};
const chargesSummaryBeforeV44=chargesSummary4;
chargesSummary4=function(c){
 if(!Array.isArray(c?.dynamicRows))return chargesSummaryBeforeV44(c);
 const lines=c.dynamicRows.map(x=>row4(`${E(x.label)} · ${E(x.basis==='percent_total'?N(x.rate)+'%':'တစ်အိတ် '+cashText(x.rate))}`,cashText(x.amount))).join('');
 const laborRule=c.laborRateId?deductionRateById(c.laborRateId):null;
 const laborLine=c.labor?row4(`လုပ်သားခ${laborRule?' · '+E(deductionBasisLabel(laborRule)):''}`,cashText(c.labor)):'';
 return `<details class="req-details mt"><summary>နုတ်ငွေအသေးစိတ်</summary><div class="summary-box">${laborLine}${lines||(!laborLine?row4('နုတ်ငွေ','မရှိပါ'):'')}${c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု',cashText(c.advance)):''}${row4('စုစုပေါင်းနုတ်ငွေ',cashText(c.total??((c.serviceFee||0)+(c.labor||0)+(c.advance||0))))}</div></details>`;
};
const voucherFormBeforeV44=voucherForm4;
voucherForm4=function(rs){
 voucherFormBeforeV44(rs);
 if(v4Kind==='purchase')calcVoucher4();
};
