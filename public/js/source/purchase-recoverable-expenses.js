
/* V57 - Recoverable expenses, no double transport deduction.
   Only wraps the purchase/sale deduction UI and purchase voucher recording.
   No changes to stock, pricing-basis, permissions, loan interest or cash transfers. */
(function(){
 'use strict';
 const val=n=>Number.isFinite(Number(n))?Number(n):0;
 const kind57=rule=>{
   if(!rule)return '';
   const name=String(typeof deductionName48==='function'?deductionName48(rule):rule.name||'');
   if(rule.itemType==='transport'||/တန်ဆာ|ကားခ|ခေါက်တို|ခေါက်ရှည်/.test(name))return 'transport';
   if(rule.itemType==='labor'||/လုပ်သားခ/.test(name))return 'labor';
   if(rule.itemType==='service'||/ဝန်ဆောင်ခ/.test(name))return 'service';
   if(rule.itemType==='custom')return 'custom:'+String(rule.customType||name).trim().toLocaleLowerCase();
   return String(rule.itemType||name).trim().toLocaleLowerCase();
 };
 function receiptCarriage57(){
   return (typeof v4ReceiptIds!=='undefined'&&Array.isArray(v4ReceiptIds)?v4ReceiptIds:[])
      .reduce((sum,id)=>sum+val((state.receipts||[]).find(r=>r.id===id)?.carriageAdvance),0);
 }
 function selectedRows57(){
   return [...document.querySelectorAll('#purchaseDeductionRows4 .deduction-row4')].map(row=>{
     const i=row.dataset.i,select=document.getElementById('pdr'+i),rule=select?deductionRateById(select.value):null;
     return {row,select,rule,key:kind57(rule),id:select?.value||''};
   });
 }
 function duplicate57(){
   if(v4Kind!=='purchase')return '';
   const seen=new Set();
   for(const item of selectedRows57()){
     if(!item.id||!item.rule)continue;
     if(item.key==='transport'&&receiptCarriage57()>0)return 'တန်ဆာခကို ကုန်လက်ခံချိန်မှာ စိုက်ထုတ်ထားပြီးဖြစ်လို့ ဈေးဖြတ်ချိန်မှာ ထပ်မနုတ်နိုင်ပါ။';
     if(seen.has(item.key))return 'နုတ်ငွေအမျိုးအစားတူကို တစ်ဘောက်ချာထဲမှာ နှစ်ကြိမ် မရွေးနိုင်ပါ။ ခေါက်တို/ခေါက်ရှည် တန်ဆာခထဲက တစ်မျိုးသာ ရွေးပါ။';
     seen.add(item.key);
   }
   return '';
 }
 function sync57(){
   if(v4Kind!=='purchase')return;
   const root=document.getElementById('purchaseDeductionRows4');if(!root)return;
   const records=selectedRows57(),carriage=receiptCarriage57();
   for(const record of records){
     record.row.classList.toggle('v57-invalid',!!record.id&&(record.key==='transport'&&carriage>0||records.some(other=>other!==record&&other.id&&other.key===record.key)));
     if(!record.select)continue;
     [...record.select.options].forEach(option=>{
       if(!option.value)return;
       const k=kind57(deductionRateById(option.value));
       option.disabled=(k==='transport'&&carriage>0)||(option.value!==record.id&&records.some(other=>other!==record&&other.id&&other.key===k));
     });
   }
   let warning=document.getElementById('v57DeductionWarning');
   if(!warning){warning=document.createElement('div');warning.id='v57DeductionWarning';warning.setAttribute('role','alert');root.after(warning);}
   warning.textContent=duplicate57();
 }
 window.validateDuplicateDeductions57=duplicate57;
 window.recoveryCategory57=kind57;
 const oldAdd=addPurchaseDeductionRow4;
 addPurchaseDeductionRow4=function(rateId=''){
   oldAdd(rateId);
   if(v4Kind!=='purchase')return;
   sync57();
 };
 const oldCalc=calcVoucher4;
 calcVoucher4=function(){oldCalc();if(v4Kind==='purchase')sync57();};
 const oldVoucherForm=voucherForm4;
 voucherForm4=function(records){
   oldVoucherForm(records);
   if(!['purchase','sale'].includes(v4Kind))return;
   const feeBlock=document.querySelector('.v55-fees');
   if(feeBlock){
     const p=feeBlock.querySelector('.v55-section-heading p');if(p)p.textContent='ပွဲရုံမှ ယာယီစိုက်ထုတ်ထားပြီး နောက်ပိုင်း ပြန်နုတ်မည့်ငွေများကို တစ်ကြိမ်သာ မှတ်တမ်းတင်ပါ။';
     if(!feeBlock.querySelector('.v57-recovery-note')){
       const info=document.createElement('div');info.className='v57-recovery-note';
       const extra=v4Kind==='purchase'&&receiptCarriage57()>0?`ကုန်လက်ခံချိန်က တန်ဆာခ ${cashText(receiptCarriage57())} ကို ဈေးဖြတ်စာရင်းမှာ Auto ပြန်နုတ်ထားပြီး ဖြစ်ပါတယ်။ ထပ်ရွေးရန် မလိုပါ။`:'အလုပ်သမားခ၊ တန်ဆာခနှင့် အခြားနုတ်ငွေများသည် ပြန်လည်ရှင်းလင်းရမည့် ယာယီစိုက်ငွေများဖြစ်သည်။';
       info.innerHTML='<strong>ယာယီစိုက်ထုတ်ငွေ · တစ်ကြိမ်သာ ပြန်နုတ်ရန်</strong><span>'+E(extra)+'</span>';
       feeBlock.querySelector('.v55-section-heading')?.after(info);
     }
   }
   if(v4Kind==='purchase')sync57();
 };
 const beforeCommit=commitVoucher4;
 commitVoucher4=function(){
   if(v4Kind!=='purchase')return beforeCommit();
   const msg=duplicate57();if(msg)return error(msg);
   const current=readCharges4(),rows=readVoucherLines4(),before=state.receipts.filter(r=>r.status==='purchased').map(r=>r.id);
   const breakdown=[];
   if(val(current.carriage)>0)breakdown.push({kind:'transport',name:'တန်ဆာခ (ခေါက်ရှည်) · လက်ခံချိန်စိုက်ထား',amount:val(current.carriage),source:'receiving'});
   if(val(current.serviceFee)>0)breakdown.push({kind:'service',name:'ဝန်ဆောင်ခ · ယာယီစိုက်ငွေ',amount:val(current.serviceFee),source:'settlement'});
   if(val(current.labor)>0)breakdown.push({kind:'labor',name:'လုပ်သားခ · ယာယီစိုက်ငွေ',amount:val(current.labor),source:'settlement'});
   (current.dynamicRows||[]).forEach(r=>{if(val(r.amount)>0)breakdown.push({kind:kind57(r),name:String(r.label||r.name||'အခြားစိုက်ငွေ'),amount:val(r.amount),source:'settlement'});});
   const receiptIds=rows.map(x=>x.r?.id).filter(Boolean);
   const result=beforeCommit();
   const newly=receiptIds.map(id=>state.receipts.find(r=>r.id===id)).filter(r=>r?.status==='purchased'&&!before.includes(r.id));
   if(newly.length){
     const first=newly[0],voucher=first.purchaseNo||first.voucherNo||first.no;
     if(first.charges4){first.charges4.recoverable57=true;first.charges4.recoverableBreakdown57=breakdown;first.charges4.recoverableTotal57=breakdown.reduce((n,x)=>n+x.amount,0);}
     // Receiving carriage is already a cash-out item; purchase deduction only recovers it.
     newly.forEach(r=>{if(r.carriageExpenseId){const e=(state.expenses||[]).find(x=>x.id===r.carriageExpenseId);if(e&&e.recoverable){e.recovered=true;e.recoveredByVoucher=voucher;e.recoveryMethod='purchase_offset';}}});
     // Existing generated placeholder has no cash-out: keep that status but give complete recoverable detail.
     const e=(state.expenses||[]).slice().reverse().find(x=>x.ref===voucher&&x.paymentPending&&x.recoverable);
     if(e){e.title='ယာယီစိုက်ထုတ် / ပြန်နုတ်ရန် (ငွေထုတ်မှတ်တမ်း မဟုတ်)';e.reason='ယာယီစိုက်ထုတ် / ပြန်နုတ်ရန်';e.recoverableBreakdown57=breakdown.filter(x=>x.source==='settlement');e.amount=e.recoverableBreakdown57.reduce((n,x)=>n+x.amount,0);e.recovered=true;e.recoveredByVoucher=voucher;}
     save();
   }
   return result;
 };
 const oldSummary=chargesSummary4;
 chargesSummary4=function(c){
   const html=oldSummary(c);
   if(!c||!c.recoverable57)return html;
   return '<p class="v57-recovery-note">အောက်ပါနုတ်ငွေများသည် ပွဲရုံမှ ယာယီစိုက်ထုတ်၍ ပြန်ရှင်းယူသောငွေများဖြစ်ပြီး ပွဲရုံ၏ Operating Expense သို့မဟုတ် Revenue အသစ်အဖြစ် အလိုအလျောက် မတွက်ပါ။</p>'+html;
 };
 document.title='ပွဲရုံ · V57 Temporary Advances (No Duplicate Deductions)';
})();
