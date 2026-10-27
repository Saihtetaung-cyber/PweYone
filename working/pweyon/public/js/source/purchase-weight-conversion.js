
/* V47: purchase pricing changes ONLY. Sale workflows and prior vouchers are preserved.
  viss = received total viss * one-viss price
  bag = (received total viss / MASTER standard-bag viss) * standard-bag price
  purchase requested bag size is a separately saved field, not the standard divisor.
*/
(function(){
 'use strict';
 window.v47PurchasePricingEnabled=true;
 const STR={
   requested:'ဝယ်ယူလိုသော တစ်အိတ်ဝင်',
   standard:'ကုန်ပစ္စည်း Master စံအိတ်ဝင်',
   viss:'တစ်ပိဿာဈေး',
   bag:'တစ်စံအိတ်ဈေး',
   unit:'ပိဿာ',
   amount:'စုစုပေါင်းကုန်ဖိုး'
 };
 const previousForm=voucherForm4;
 const previousRead=readVoucherLines4;
 const previousCalc=calcVoucher4;
 const previousCommit=commitVoucher4;
 const previousGross=gross;
 const previousPrint=printVoucher4;
 const previousDetail=receiptDetail4;
 const previousPrintReceipt=printReceipt;
 const rounding=(n)=>Math.round(n*1000)/1000;
 const finitePositive=n=>Number.isFinite(n)&&n>0;
 function standardOf(record){return productStandard(record.product)||0;}
 function desiredInput(i){return document.getElementById('vPurchaseBag47'+i);}
 function incomingBagSize(record){
   const master=standardOf(record);
   if(master>0)return master;
   const fromPackage=Number(record.packageViss)||0;
   if(fromPackage>0)return fromPackage;
   const bags=Number(record.rawBags??record.bags)||0;
   return bags>0&&Number(record.qty)>0?rounding(Number(record.qty)/bags):0;
 }
 function basis(){return value('fBasis')==='bag'?'bag':'viss';}
 window.purchaseBagChanged47=function(){if(v4Kind==='purchase')calcVoucher4();};
 voucherForm4=function(records){
   previousForm(records);
   if(v4Kind!=='purchase')return;
   const mode=document.getElementById('fBasis');
   if(mode){
     const perViss=mode.querySelector('option[value="viss"]');
     const perStd=mode.querySelector('option[value="bag"]');
     if(perViss){perViss.disabled=false;perViss.textContent=STR.viss;}
     if(perStd){perStd.disabled=false;perStd.textContent=STR.bag;}
     mode.removeAttribute('title');
     mode.value='viss';
   }
   const form=document.getElementById('voucher4');
   const noteNode=form?.querySelector('.note.blue');
   if(noteNode)noteNode.textContent='ဈေးတွက်နည်းကို ရွေးနိုင်ပါသည်။ တစ်ပိဿာဈေးဖြစ်ပါက စုစုပေါင်းပိဿာ × တစ်ပိဿာဈေး။ တစ်စံအိတ်ဈေးဖြစ်ပါက စုစုပေါင်းပိဿာ ÷ ကုန်ပစ္စည်း Master စံအိတ်ဝင် × တစ်စံအိတ်ဈေး။ ဝယ်ယူလိုသော တစ်အိတ်ဝင်သည် ဈေးတွက်စံအိတ်ဝင်ကို မပြောင်းပါ။';
   form?.querySelectorAll('#voucherLines4 .req-line').forEach(line=>{
     const i=line.dataset.i;
     const r=records.find(rec=>String(rec.id)===String(line.dataset.rid));
     if(!r)return;
     const qtyFields=line.querySelector('.field-row');
     if(!qtyFields)return;
     const std=standardOf(r),initial=Number(r.purchaseBagViss47)||incomingBagSize(r);
     qtyFields.insertAdjacentHTML('beforebegin',`<section class="v47-purchase-bag"><div class="field-row">${field(STR.requested,'vPurchaseBag47'+i,{type:'number',min:.001,step:.001,value:initial>0?initial:'',required:true,suffix:STR.unit,extra:'oninput="purchaseBagChanged47()"',help:'ဤအိတ်ဝင်ပိဿာကို အဝယ်မှတ်တမ်းတွင် သီးခြား သိမ်းမည်။ ကုန်လက်ခံထားသော စုစုပေါင်းပိဿာနှင့် စံအိတ်ဝင်ကို မပြောင်းပါ။'})}<div class="v47-standard">${STR.standard}<strong>${std>0?vissText37(std)+' '+STR.unit:'Master တွင် မသတ်မှတ်ရသေး'}</strong><span>${STR.bag} ရွေးလျှင် ဤစံအိတ်ဝင်နှင့်သာ တွက်ပါမည်။</span></div></div><div id="v47BagInfo${i}" class="v47-purchase-hint" aria-live="polite"></div></section>`);
     // Pricing bag count from V39/40 stays editable and remains a separate receipt field.
     const oldHelp=line.querySelector('.pricing-raw-bags39 .field-help');
     if(oldHelp)oldHelp.textContent='ကုန်လက်ခံထားသော အကြမ်းအိတ်အရေအတွက်ကို လိုအပ်သလို ပြင်နိုင်ပါသည်။ ဈေးတွက်ပုံသည် အပေါ်ရှိ ဈေးတွက်နည်းကို လိုက်နာမည်။';
     const oldCountLabel=line.querySelector('.pricing-raw-bags39 .field label');
     if(oldCountLabel)oldCountLabel.textContent='ဈေးဖြတ်ချိန် တကယ်လက်ခံအိတ်အရေအတွက်';
   });
   calcVoucher4();
 };
 readVoucherLines4=function(){
   const rows=previousRead();
   if(v4Kind!=='purchase')return rows;
   const chosen=basis();
   for(const x of rows){
     const std=productStandard(x.product)||0;
     const input=desiredInput(x.i);
     x.purchaseBagViss47=input&&input.value!==''?Number(input.value):NaN;
     x.standardBagViss47=std;
     x.priceBasis47=chosen;
     x.total=Math.round((chosen==='bag'?(std>0?x.qty/std:0):x.qty)*x.price);
   }
   return rows;
 };
 calcVoucher4=function(){
   previousCalc();
   if(v4Kind!=='purchase')return;
   const chosen=basis();
   readVoucherLines4().forEach(x=>{
     const rate=document.getElementById('vr'+x.i),rateLabel=rate?.closest('.field')?.querySelector('label');
     if(rateLabel)rateLabel.textContent=chosen==='bag'?STR.bag:STR.viss;
     const result=document.getElementById('lineSummary4'+x.i);
     if(result){
       const formula=chosen==='viss'?
         `${vissText37(x.qty)} ${STR.unit} × ${cashText(x.price)}`:
         (x.standardBagViss47>0?`${vissText37(x.qty)} ${STR.unit} ÷ ${vissText37(x.standardBagViss47)} ${STR.unit} × ${cashText(x.price)}`:'ကုန်ပစ္စည်း Master စံအိတ်ဝင်ကို အရင် သတ်မှတ်ပါ။');
       result.innerHTML=`<div class="v47-formula">${chosen==='viss'?STR.viss:STR.bag} · <strong>${formula}${chosen==='viss'||x.standardBagViss47>0?' = '+cashText(x.total):''}</strong></div>`;
     }
     const hint=document.getElementById('v47BagInfo'+x.i);
     if(hint){
       const wanted=x.purchaseBagViss47;
       hint.textContent=finitePositive(wanted)&&x.qty>0?
         `ဝယ်ယူလိုသော ${vissText37(wanted)} ပိဿာဝင်ဖြင့် စီစဉ်ပါက ${N(rounding(x.qty/wanted))} အိတ်နှင့် ညီမျှသည် (ညီမျှတွက်ချက်မှုသာ ဖြစ်ပါသည်)။`:
         'ဝယ်ယူလိုသော တစ်အိတ်ဝင်ပိဿာကို ထည့်ပါ။';
     }
   });
 };
 commitVoucher4=function(){
   if(v4Kind!=='purchase')return previousCommit();
   const rows=readVoucherLines4();
   if(rows.some(x=>!finitePositive(x.purchaseBagViss47)))return error('ဝယ်ယူလိုသော တစ်အိတ်ဝင်ပိဿာကို သုညထက်ပိုသော တန်ဖိုးဖြင့် ထည့်ပါ။');
   if(basis()==='bag'&&rows.some(x=>!finitePositive(x.standardBagViss47)))return error('တစ်စံအိတ်ဈေးတွက်ရန် ကုန်ပစ္စည်း Master တွင် စံအိတ်ဝင်ပိဿာကို သတ်မှတ်ပါ။');
   const chosen=basis();
   const snapshot=rows.map(x=>({id:x.r?.id,requested:x.purchaseBagViss47,standard:x.standardBagViss47}));
   previousCommit();
   // Only attach the new saved fields if the existing purchase/loan/payment engine succeeded.
   let updated=false;
   for(const item of snapshot){
     const r=state.receipts.find(r=>r.id===item.id);
     if(!r||r.status!=='purchased')continue;
     // The current form can only open for unpurchased receipts.
     r.purchaseBagViss47=item.requested;
     r.standardBagViss47=item.standard;
     r.priceBasis=chosen==='bag'?'standard_bag':'viss';
     updated=true;
   }
   if(updated){save();render();}
 };
 gross=function(r){
   if(r&&finitePositive(Number(r.purchaseBagViss47))&&r.priceBasis==='standard_bag'){
     const std=Number(r.standardBagViss47)||productStandard(r.product);
     return std>0?Math.round((Number(r.qty)||0)/std*(Number(r.price)||0)):0;
   }
   return previousGross(r);
 };
 receiptDetail4=function(id){
   previousDetail(id);
   const records=voucherRecords4('purchase',id).filter(r=>finitePositive(Number(r.purchaseBagViss47)));
   if(!records.length)return;
   const root=document.querySelector('.work-page .modal-body')||document.querySelector('#modalRoot .modal-body');
   if(!root)return;
   const html=records.map(r=>`<div class="summary-line"><span>${E(r.product)} · ${STR.requested}</span><strong>${vissText37(r.purchaseBagViss47)} ${STR.unit}</strong></div><div class="summary-line"><span>${r.priceBasis==='standard_bag'?STR.bag:STR.viss} · ${E(r.product)}</span><strong>${cashText(r.price)}${r.priceBasis==='standard_bag'?' / '+vissText37(r.standardBagViss47||productStandard(r.product))+' '+STR.unit:''}</strong></div>`).join('');
   const box=document.createElement('section');box.className='summary-box mt';box.innerHTML='<h3>အဝယ်တစ်အိတ်ဝင်နှင့် ဈေးတွက်နည်း</h3>'+html;
   const table=root.querySelector('table');if(table)table.insertAdjacentElement('afterend',box);else root.appendChild(box);
 };
 printVoucher4=function(kind,id){
   if(kind!=='purchase')return previousPrint(kind,id);
   const records=voucherRecords4(kind,id),first=records[0];
   if(!first||!records.some(r=>finitePositive(Number(r.purchaseBagViss47))))return previousPrint(kind,id);
   const body=`<p>${E(first.name)} · ${E(first.purchaseDate||first.date)}</p>${first.car?`<p>ကားနံပါတ် — ${E(first.car)}</p>`:''}`+
     table4(['ကုန်','ပိဿာ','မူလ အကြမ်းအိတ်','တကယ်လက်ခံအိတ်','ကုန်ဖိုး'],records.map(r=>`<tr><td>${E(r.product)}</td><td>${vissText37(r.qty)}</td><td>${r.bagType==='raw'?N(r.rawBags??r.bags??0):r.bagType==='finished'?N(r.packageCount??r.bags??0):'&mdash;'}</td><td>${r.bagType==='raw'?N(r.priceBags??r.rawBags??r.bags??0):r.bagType==='finished'?N(r.packageCount??r.bags??0):'&mdash;'}</td><td>${cashText(gross(r))}</td></tr>`))+
     '<h3 style="margin-top:17px">အဝယ်တစ်အိတ်ဝင်နှင့် ဈေးတွက်နည်း</h3>'+records.map(r=>`<p>${E(r.product)} — ${STR.requested} ${finitePositive(Number(r.purchaseBagViss47))?vissText37(r.purchaseBagViss47)+' ပိဿာ':'—'} · ${r.priceBasis==='standard_bag'?STR.bag+' ('+vissText37(r.standardBagViss47||productStandard(r.product))+' ပိဿာ စံအိတ်ဝင်)':STR.viss} ${cashText(r.price)}</p>`).join('')+
     (first.charges4?chargesSummary4(first.charges4).replaceAll('<details','<details open'):'')+
     row4('အသားတင် ပေးရန်',cashText(records.reduce((n,r)=>n+purchaseNet(r),0)))+
     row4('ပေးရန်ကျန်',cashText(records.reduce((n,r)=>n+due(r),0)));
   printDocument('အဝယ် / ဈေးဖြတ်ဘောက်ချာ',first.purchaseNo||first.voucherNo||first.no,body);
 };
 printReceipt=function(id){
   const r=state.receipts.find(r=>r.id===id);
   if(r?.status==='purchased'&&finitePositive(Number(r.purchaseBagViss47)))return printVoucher4('purchase',id);
   return previousPrintReceipt(id);
 };
 document.title='ပွဲရုံ - V47 Purchase Bag Size & Pricing';
})();
