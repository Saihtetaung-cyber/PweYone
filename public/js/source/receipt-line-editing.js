
/* Version 2: preserve receipt/lot identities when editing; packed lines are immutable. */
(function(){
 'use strict';
 const voucher=r=>r.voucherNo||r.no;
 const near=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<.000001;
 window.receiveLineLocked2=function(receipt){
  if(!receipt)return false;
  const lots=state.lots.filter(l=>l.receiptId===receipt.id),ids=new Set(lots.map(l=>l.id));
  return lots.some(l=>!!l.sourcePackagingLot48)||(state.packagingTransactions||[]).some(t=>
   t.sourceReceiptId===receipt.id||t.history2?.sourceReceiptId===receipt.id||
   ids.has(t.sourceLot)||ids.has(t.history2?.sourceLotId)||ids.has(t.history2?.outputLotId));
 };
 function sameLine(row,receipt){
  const type=receipt.bagType||'raw';
  return row.product===receipt.product&&row.grade===receipt.grade&&row.bagType===type&&
   near(row.qty,receipt.qty)&&near(row.bags,type==='weight'?0:receipt.bags)&&
   near(row.rawBags,type==='raw'?(receipt.rawBags??receipt.bags):0)&&
   near(row.packageViss,type==='finished'?receipt.packageViss:0)&&
   near(row.packageCount,type==='finished'?(receipt.packageCount??receipt.bags):0);
 }
 function linkedMoney(receipt){return !!receipt.carriageExpenseId||
  (state.partnerAdvances||[]).some(a=>a.sourceReceiptId===receipt.id)||
  state.expenses.some(e=>e.receiptId===receipt.id)||(receipt.payments||[]).length>0;}
 window.applyReceiptLineEdits2=function(old,rows,no,party,carriage,carriageAccount){
  if(!rows.length)return error('ကုန်တစ်မျိုး အနည်းဆုံးပါရမည်။');
  const oldById=new Map(old.map(r=>[r.id,r])),locked=old.filter(receiveLineLocked2),seen=new Set();
  for(const row of rows){
   const id=row.el.dataset.rid||'';
   if(id&&(!oldById.has(id)||seen.has(id)))return error('ကုန်လိုင်းမှတ်တမ်းကို ပြန်စစ်ပါ။');
   if(id)seen.add(id);
   if(id&&receiveLineLocked2(oldById.get(id))&&!sameLine(row,oldById.get(id)))return error('ထုပ်ပိုးထားသော ကုန်လိုင်းကို ပြင်၍မရပါ။ ကျန်လိုင်းများကိုသာ ပြင်ပါ။');
  }
  if(locked.some(r=>!seen.has(r.id)))return error('ထုပ်ပိုးထားသော ကုန်လိုင်းကို ဖယ်ရှား၍မရပါ။');
  const first=old[0],oldExpense=first?.carriageExpenseId?state.expenses.find(e=>e.id===first.carriageExpenseId):null;
  const originalCarriageAccount=first?.carriageAccount||oldExpense?.account||'cash';
  if(locked.length&&(!first||no!==voucher(first)||party.id!==first.partnerId||value('fDate')!==first.date||value('fWh')!==first.warehouse||
    value('fNote')!==(first.note||'')||value('fCar')!==(first.car||'')||(number('fAdvanceAmount')||0)!==0||!near(carriage,Number(first.carriageAdvance)||0)||carriageAccount!==originalCarriageAccount))
   return error('ထုပ်ပိုးထားသောလိုင်း ပါသဖြင့် ဘောက်ချာအချက်အလက်များကို မပြောင်းနိုင်ပါ။ ကျန်ကုန်လိုင်းများကို ပြင်နိုင်ပါသည်။');
  const removed=old.filter(r=>!seen.has(r.id));
  if(removed.some(linkedMoney))return error('ငွေစာရင်းချိတ်ဆက်ထားသော ကုန်လိုင်းကို ဖယ်ရှား၍မရပါ။ အချက်အလက်ကိုသာ ပြင်ပါ။');
  const changes=[];
  for(const [index,row] of rows.entries()){
   const receipt=oldById.get(row.el.dataset.rid);
   if(receipt&&receiveLineLocked2(receipt))continue;
   if(!productBy(row.product)?.grades?.includes(row.grade)||!productBy(row.product)?.active)return error('ကုန်ပစ္စည်းနှင့် ဝယ်ဈေးတန်းကို ပြန်စစ်ပါ။');
   const common=receipt&&(receipt.partnerId!==party.id||receipt.date!==value('fDate')||receipt.warehouse!==value('fWh')||voucher(receipt)!==no||receipt.note!==value('fNote')||(receipt.car||'')!==value('fCar'));
   if(receipt&&!common&&sameLine(row,receipt))continue;
   const lots=receipt?state.lots.filter(l=>l.receiptId===receipt.id):[];
   if(receipt&&(lots.length!==1||lots[0].owner!=='supplier'||!near(lots[0].qty,receipt.qty)||lots[0].warehouse!==receipt.warehouse))
    return error('အသုံးပြုထားသော ကုန်အသုတ်ကို ဤဖောင်မှ ပြင်၍မရပါ။');
   changes.push({row,receipt,lot:lots[0],index});
  }
  // Validation above is complete before any record is mutated.
  const removedIds=new Set(removed.map(r=>r.id));
  state.receipts=state.receipts.filter(r=>!removedIds.has(r.id));state.lots=state.lots.filter(l=>!removedIds.has(l.receiptId));
  const ids=rows.map(row=>row.el.dataset.rid).filter(Boolean);
  const usedNos=new Set(state.receipts.map(r=>r.no));let suffix=1;
  function nextNo(){while(usedNos.has(no+' / '+suffix))suffix++;const result=no+' / '+suffix++;usedNos.add(result);return result;}
  for(const {row:x,receipt,lot} of changes){
   const r=receipt||{id:uid('R'),status:'await',price:null,advance:0,wage:0,weigh:0,paid:0,payments:[],v4:true,carriageAdvance:0,carriageAccount:''};
   const recordNo=receipt&&voucher(receipt)===no?receipt.no:nextNo();
   Object.assign(r,{no:recordNo,voucherNo:no,date:value('fDate'),partnerId:party.id,name:supplierLabel(party),type:party.type||'trader',
    product:x.product,grade:x.grade,bagType:x.bagType,rawBags:x.rawBags,bags:x.bags,packageCount:x.packageCount,packageViss:x.packageViss,
    qty:x.qty,weightKnown:x.qty>0,warehouse:value('fWh'),note:value('fNote'),car:value('fCar')});
   if(!receipt){state.receipts.push(r);ids.push(r.id);}
   const l=lot||{id:uid('L'),owner:'supplier',cost:0,receiptId:r.id};
   Object.assign(l,{product:x.product,grade:'စုစုပေါင်း',qty:x.qty,bags:x.bags,rawBags:x.rawBags,packageCount:x.packageCount,packageViss:x.packageViss,
    bagType:x.bagType,owner:'supplier',name:r.name,warehouse:r.warehouse,batch:no,entryDate:r.date,stockForm:x.bagType==='finished'?'packaged':'loose',weightKnown:r.weightKnown});
   if(!lot)state.lots.push(l);
  }
  // Original row order determines the existing voucher-level cash/advance anchor.
  return rows.map(row=>row.el.dataset.rid||ids.find(id=>!oldById.has(id)&&state.receipts.find(r=>r.id===id)?.product===row.product)).filter(Boolean);
 };
 const previousOpen=openReceive4;
 openReceive4=function(edit=''){
  previousOpen(edit);if(!edit)return;
  const old=state.receipts.filter(r=>voucher(r)===edit),locked=old.filter(receiveLineLocked2),form=document.getElementById('receive4');if(!form)return;
  for(const receipt of locked){
   const row=[...document.querySelectorAll('#receiveLines4 .req-line')].find(el=>el.dataset.rid===receipt.id);if(!row)continue;
   row.classList.add('receive-locked2');row.dataset.receiveLocked2='true';
   row.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=true);
   row.insertAdjacentHTML('afterbegin','<div class="receive-lock-note2">'+I('lock')+'<span>ထုပ်ပိုးထားပြီး · ဤကုန်လိုင်းကို ပြင် / ဖယ်ရှား၍မရပါ။</span></div>');
  }
  if(locked.length){
   const first=old[0],expense=first?.carriageExpenseId?state.expenses.find(e=>e.id===first.carriageExpenseId):null;
   const account=first?.carriageAccount||expense?.account||'cash',select=document.getElementById('fCarriageAccount');
   if(select){if(![...select.options].some(o=>o.value===account)){const option=document.createElement('option');option.value=account;option.textContent=canViewAccount68(account)?(ACCOUNT_NAMES[account]||'—'):'ကြည့်ခွင့်မရှိ';select.append(option);}select.value=account;}
   for(const id of ['fParty','fDate','fNo','fWh','fAdvanceAmount','fAdvanceAccount','fAdvanceReason','fCarriageAmount','fCarriageAccount','fNote','fCar']){const el=document.getElementById(id);if(el)el.disabled=true;}
   form.insertAdjacentHTML('afterbegin','<div class="mb">'+note('ထုပ်ပိုးထားသော ကုန်လိုင်းကို ပိတ်ထားပါသည်။ ကျန်ကုန်လိုင်းများကို ပြင်နိုင်ပါသည်။ ကုန်သည်၊ ရက်စွဲ၊ ဂိုဒေါင်နှင့် ဘောက်ချာဆိုင်ရာငွေများကို ဆက်ထိန်းထားပါမည်။','blue')+'</div>');
  }
  const saveButton=document.getElementById('receiveSupplier73');
  if(saveButton?.getAttribute('onclick')==="saveReceive4('list')")saveButton.textContent='ပြင်ဆင်သိမ်းမယ်';
  const actions=document.querySelector('#main .modal-footer .receive-action-stack4');
  if(actions){const next=actions.querySelector('[onclick="saveReceive4(\'new\')"]');if(next)next.remove();const price=actions.querySelector('[onclick="saveReceive4(\'price\')"]');if(price)price.innerHTML=I('price')+'<span>သိမ်းပြီး ဈေးဖြတ်မယ်</span>';}
  document.getElementById('receiveSupplierHelp73')?.remove();
 };
 const previousRemove=removeLine4;
 removeLine4=function(button){const id=button.closest('.req-line')?.dataset.rid;if(id&&receiveLineLocked2(state.receipts.find(r=>r.id===id)))return error('ထုပ်ပိုးထားသော ကုန်လိုင်းကို ဖယ်ရှား၍မရပါ။');return previousRemove(button);};
})();

