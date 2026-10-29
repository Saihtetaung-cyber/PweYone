
/* Version 2: historical packaging presentation. The view does not mutate stock or history. */
(function(){
 'use strict';
 const textOrDash=x=>x===null||x===undefined||x===''?'—':E(x);
 const numeric=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
 const weight=x=>numeric(x)?vissText37(x)+' ပိဿာ':'—';
 const bags=x=>numeric(x)?N(x)+' အိတ်':'—';
 function stamp(iso){const d=iso?new Date(iso):null;return d&&!Number.isNaN(d.getTime())?d.toLocaleString('en-GB',{timeZone:'Asia/Rangoon',hour12:false}):'—';}
 function record(index){
  const event=state.packagingTransactions[index];if(!event)return null;
  const h=event.history2?.schema===1?event.history2:null;
  const lot=state.lots.find(l=>l.id===event.sourceLot);
  const receipt=state.receipts.find(r=>r.id===(event.sourceReceiptId||lot?.receiptId));
  const data=h?{...h}:{
   product:event.product,owner:event.owner||'',ownerName:event.ownerName||'',
   warehouseName:event.warehouse?W(event.warehouse):'',sourceBatch:event.batch||'',
   sourceReceiptNo:event.sourceReceiptNo||receipt?.voucherNo||receipt?.no||'',
   sourceLotId:event.sourceLot||'',packName:event.packName||'',packageViss:event.packageViss,
   qtyBefore:numeric(event.measuredSourceQty2)?event.measuredSourceQty2:null,
   qtyAfter:numeric(event.measuredSourceQty2)&&numeric(event.qty)?Number(event.measuredSourceQty2)-Number(event.qty):null,
   packedQty:event.qty,bagCount:event.bagCount,originalRawBags:event.sourceRawBags2??null,
   recordedAt:event.recordedAt||'',role:'',sourceBagType:'',originalTraderName:'',
  };
  data.id=event.id;data.date=event.date;data.type=event.type;data.snapshot=!!h;
  return data;
 }
 function ownerLabel(r){return r.owner==='supplier'?'ကုန်သည်ပိုင်':r.owner==='owned'?'ပွဲရုံပိုင်':r.owner==='customer'?'ဝယ်သူပိုင်':'မမှတ်ထား';}
 function ownerCell(r){return `<strong>${E(r.ownerName||'—')}</strong><div class="sub">${ownerLabel(r)}</div>`;}
 function table(){
  const rows=state.packagingTransactions.map((_,index)=>({index,data:record(index)})).reverse();
  if(!rows.length)return empty('ထုပ်ပိုးမှတ်တမ်း မရှိသေးပါ။','stock');
  return `<div class="table-wrap ph2-table-scroll"><table class="ph2-history-table"><thead><tr>${['ရက် / မှတ်တမ်းချိန်','ကုန်ပိုင်ရှင်','ကုန် / ဂိုဒေါင် / မူလအသုတ်','ထုပ်ပိုးပုံစံ / တစ်အိတ်ဝင်','ယခုထုပ်ပိုးပမာဏ','မထုပ်ပိုးရသေးသော လက်ကျန်','အသေးစိတ်'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(({index,data:r})=>`<tr data-pack-index="${index}"><td><strong>${textOrDash(r.date?shortDate(r.date):'')}</strong><div class="sub">${textOrDash(stamp(r.recordedAt))}</div></td><td>${ownerCell(r)}</td><td><strong>${textOrDash(r.product)}</strong><div class="sub">${textOrDash(r.warehouseName)}</div><div class="sub">${textOrDash(r.sourceReceiptNo||r.sourceBatch)}</div>${r.sourceBatch&&r.sourceReceiptNo&&r.sourceBatch!==r.sourceReceiptNo?`<div class="sub">${E(r.sourceBatch)}</div>`:''}</td><td><strong>${textOrDash(r.packName)}</strong><div class="sub">${weight(r.packageViss)}</div></td><td><strong>${weight(r.packedQty)}</strong><div class="sub">${bags(r.bagCount)}</div></td><td><strong>${weight(r.qtyAfter)}</strong></td><td>${smallbtn('ကြည့်မယ်',`openPackagingHistoryDetail2(${index})`,'secondary','eye')}</td></tr>`).join('')}</tbody></table></div><p class="ph2-help">ဇယားကို ဘေးတိုက်ရွှေ့ကြည့်နိုင်ပါသည်။ အသေးစိတ်ကို ကြည့်မယ် ခလုတ်မှ ဖွင့်ပါ။</p>`;
 }
 window.openPackagingHistoryDetail2=function(index){
  if(!Number.isInteger(index)||index<0)return;
  const r=record(index);if(!r)return toast('မှတ်တမ်း မရှိသေးပါ။',true);
  const labelValue=(label,value)=>`<div class="ph2-info-row"><span>${label}</span><strong>${value}</strong></div>`;
  const role=r.role==='owner'?'ပိုင်ရှင်':r.role==='staff'?'စာရေးမ':r.role||'—';
  const sourceType=r.sourceBagType==='raw'?'အကြမ်းအိတ်':r.sourceBagType==='weight'?'စုစုပေါင်းပိဿာ':r.sourceBagType==='finished'?'အချောအိတ်':'—';
  const body=`<div class="ph2-detail"><section class="ph2-info">${labelValue('မှတ်တမ်းအမှတ်',textOrDash(r.id))}${labelValue('ထုပ်ပိုးရက်',textOrDash(r.date?shortDate(r.date):''))}${labelValue('မှတ်တမ်းတင်သည့် ရက် / အချိန်',textOrDash(stamp(r.recordedAt)))}${labelValue('မှတ်တမ်းတင်သူ အခန်းကဏ္ဍ',E(role))}${labelValue('ထုပ်ပိုးစဉ် ကုန်ပိုင်ရှင်',ownerCell(r))}${r.originalTraderName?labelValue('မူလကုန်သည်',E(r.originalTraderName)):''}${labelValue('ကုန်ပစ္စည်း',textOrDash(r.product))}${labelValue('ထုပ်ပိုးစဉ် ဂိုဒေါင်',textOrDash(r.warehouseName))}${labelValue('မူလကုန်လက်ခံမှတ်တမ်း',textOrDash(r.sourceReceiptNo))}${labelValue('မူလအသုတ်',textOrDash(r.sourceBatch))}${labelValue('မူလလက်ခံပုံစံ',E(sourceType))}${numeric(r.originalRawBags)?labelValue('ကုန်လက်ခံစဉ် မူလအကြမ်းအိတ်',bags(r.originalRawBags)):''}</section><section class="summary-box mt"><h3>ထုပ်ပိုးပမာဏ အသေးစိတ်</h3>${row4('မထုပ်ပိုးမီ လက်ကျန်ပိဿာ',weight(r.qtyBefore))}${row4('ယခုထုပ်ပိုးပိဿာ',weight(r.packedQty))}${row4('ထုပ်ပိုးပြီး မထုပ်ပိုးရသေးသော လက်ကျန်',weight(r.qtyAfter))}${row4('ထုပ်ပိုးပုံစံ',textOrDash(r.packName))}${row4('တစ်အိတ်ဝင်',weight(r.packageViss))}${row4('ထုပ်ပိုးအိတ်အရေအတွက်',bags(r.bagCount))}</section><p class="ph2-help">ဤလက်ကျန်သည် ထုပ်ပိုးသိမ်းဆည်းခဲ့သည့်အချိန်က မထုပ်ပိုးရသေးသော မူလအသုတ်လက်ကျန် ဖြစ်ပါသည်။</p>${!r.snapshot?`<div class="mt">${note('ယခင်မှတ်တမ်းတွင် မသိမ်းထားသော အချိန်နှင့် လက်ကျန်အချက်အလက်များကို — ဖြင့် ပြထားပါသည်။','amber')}</div>`:''}</div>`;
  openModal('ထုပ်ပိုးမှတ်တမ်း အသေးစိတ်','မူလကုန်ပိုင်ရှင်၊ လက်ခံအသုတ်နှင့် ထုပ်ပိုးပမာဏကို တစ်နေရာတည်းတွင် ကြည့်နိုင်ပါသည်။',body,btn('ထုပ်ပိုးမှတ်တမ်းသို့ ပြန်မယ်','backPackagingHistory2()','secondary','back'),true);
 };
 window.backPackagingHistory2=function(){closeModal();navigate('inventory');invTab='packages';render();};
 const previous=renderInventoryBody;
 renderInventoryBody=function(...args){
  const result=previous.apply(this,args);
  if(invTab==='packages'){
   const root=document.querySelector('#packagingWorkspace79 .pack79-history');
   if(root)root.innerHTML='<h3>ထုပ်ပိုးထားသော မှတ်တမ်းများ</h3>'+table();
  }
  return result;
 };
 if(page==='inventory'&&!workView)renderInventoryBody();
})();

