
/* Version 2: read-only receipt-line packaging evidence in purchase and receipt detail.
 * No transaction, packing, quantity, pricing, payment or permission engine is replaced.
 */
(function(){
 'use strict';
 const numeric=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
 const numberOrNull=v=>numeric(v)?Number(v):null;
 const q=v=>numeric(v)?vissText37(v)+' ပိဿာ':'—';
 const b=v=>numeric(v)?N(v)+' အိတ်':'—';
 const text=v=>v===null||v===undefined||v===''?'—':E(v);
 const sum=(items,key)=>items.every(x=>numeric(x[key]))?items.reduce((n,x)=>n+Number(x[key]),0):null;
 const sourceId=event=>event.history2?.sourceReceiptId||event.sourceReceiptId||
  state.lots.find(l=>l.id===(event.history2?.sourceLotId||event.sourceLot))?.receiptId||'';
 const owner=o=>o==='supplier'?'ကုန်သည်ပိုင်':o==='owned'?'ပွဲရုံပိုင်':o==='customer'?'ဝယ်သူပိုင်':'မမှတ်ထား';
 function historyFor(receipt){
  return (state.packagingTransactions||[]).map((event,index)=>({event,index}))
   .filter(({event})=>sourceId(event)===receipt.id&&(!event.type||event.type==='pack'))
   .map(({event:e,index})=>{
    const h=e.history2?.schema===1?e.history2:{};
    return {index,id:e.id,date:e.date,recordedAt:h.recordedAt||e.recordedAt||'',
     product:h.product||e.product||'',owner:h.owner||e.owner||'',ownerName:h.ownerName||e.ownerName||'',
     warehouse:h.warehouseName||(e.warehouse?W(e.warehouse):''),
     sourceNo:h.sourceReceiptNo||e.sourceReceiptNo||receipt.voucherNo||receipt.no||'',
     sourceBatch:h.sourceBatch||e.batch||'',packName:h.packName||e.packName||'',
     size:numberOrNull(h.packageViss??e.packageViss),count:numberOrNull(h.bagCount??e.bagCount),
     qty:numberOrNull(h.packedQty??e.qty),after:numberOrNull(h.qtyAfter??
      (numeric(e.measuredSourceQty2)&&numeric(e.qty)?Number(e.measuredSourceQty2)-Number(e.qty):null))};
   });
 }
 function time(iso){
  const d=iso?new Date(iso):null;
  return d&&!Number.isNaN(d.getTime())?d.toLocaleString('en-GB',{timeZone:'Asia/Rangoon',hour12:false}):'';
 }
 function activeLots(receipt){
  return (state.lots||[]).filter(l=>l.receiptId===receipt.id&&
   (Number(l.qty)>0||(l.weightKnown===false&&Number(l.bags??l.rawBags)>0)));
 }
 function lotWeight(l){return l.weightKnown===false?null:numberOrNull(l.qty);}
 function totalWeight(lots){return lots.every(l=>lotWeight(l)!==null)?lots.reduce((n,l)=>n+Number(l.qty),0):null;}
 function lotBags(l){
  if(l.weightKnown===false||!numeric(l.packageViss)||Number(l.packageViss)<=0||!numeric(l.qty))return null;
  const n=Number(l.qty)/Number(l.packageViss),whole=Math.round(n);
  return Math.abs(n-whole)<.000001?whole:null;
 }
 function currentGroups(lots){
  const groups=new Map();
  for(const l of lots){
   const size=numberOrNull(l.packageViss),key=JSON.stringify([l.warehouse,l.owner,size,l.packType||l.packName||'']);
   if(!groups.has(key))groups.set(key,{warehouse:l.warehouse,owner:l.owner,size,name:l.packName||'',lots:[]});
   groups.get(key).lots.push(l);
  }
  return [...groups.values()].map(g=>{
   const counts=g.lots.map(lotBags),count=counts.every(n=>n!==null)?counts.reduce((a,n)=>a+n,0):null;
   return '<div class="ppl2-current-line"><strong><span>တစ်အိတ်ဝင်</span> '+q(g.size)+' · '+b(count)+'</strong><span>'+q(totalWeight(g.lots))+' · '+text(g.warehouse?W(g.warehouse):'')+' · '+owner(g.owner)+'</span></div>';
  }).join('');
 }
 function historyRows(records){
  return [...records].reverse().map(r=>{
   const stamp=time(r.recordedAt);
   return '<div class="ppl2-history-row" role="listitem" data-pack-id="'+E(r.id||'')+'">'+
    '<div><strong>'+text(r.date?shortDate(r.date):'')+'</strong><span>'+text(stamp||'အချိန် မမှတ်ထား')+'</span><span>'+text(r.id)+'</span>'+ 
    '<span>'+text(r.ownerName)+' · '+owner(r.owner)+'</span><span>'+text(r.warehouse)+'</span></div>'+
    '<div><strong>'+text(r.packName)+'</strong><span>'+q(r.size)+' × '+b(r.count)+'</span><span>'+text(r.sourceNo)+'</span>'+
    (r.sourceBatch&&r.sourceBatch!==r.sourceNo?'<span>'+text(r.sourceBatch)+'</span>':'')+'</div>'+
    '<div class="ppl2-history-amount"><span>ယခုထုပ်ပိုးပိဿာ</span><strong>'+q(r.qty)+'</strong><span>ထိုအကြိမ်ပြီးနောက် မထုပ်ပိုးရသေးသော လက်ကျန်</span><strong>'+q(r.after)+'</strong></div></div>';
  }).join('');
 }
 function panel(receipt,id){
  const records=historyFor(receipt),lots=activeLots(receipt),packed=lots.filter(l=>l.stockForm==='packaged'),loose=lots.filter(l=>l.stockForm!=='packaged');
  // Ordinary, unpacked receiving/purchase screens retain their existing layout.
  if(!records.length&&!packed.some(l=>l.sourcePackagingLot48))return '';
  const historicalQty=sum(records,'qty'),historicalCount=sum(records,'count');
  const originalBags=receipt.bagType==='raw'?b(receipt.rawBags??receipt.bags):receipt.bagType==='finished'?b(receipt.packageCount??receipt.bags):'အိတ် မသတ်မှတ်ထား';
  const method=receipt.bagType==='raw'?'မူလအကြမ်းအိတ်':receipt.bagType==='finished'?'မူလအချောအိတ်':'မူလလက်ခံပုံစံ';
  const packedCounts=packed.map(lotBags),currentCount=packedCounts.every(n=>n!==null)?packedCounts.reduce((a,n)=>a+n,0):null;
  return '<section class="ppl2-panel" aria-labelledby="'+id+'-title" data-receipt-id="'+E(receipt.id)+'">'+
   '<div class="ppl2-heading"><h3 id="'+id+'-title">ထုပ်ပိုးမှုအနှစ်ချုပ်</h3><span class="ppl2-badge" title="ထုပ်ပိုးမှတ်တမ်းအရေအတွက်">'+N(records.length)+'</span></div>'+
   '<p class="ppl2-source">'+text(receipt.product)+' · '+text(receipt.name)+' · '+text(receipt.voucherNo||receipt.no)+'</p>'+
   '<div class="ppl2-original"><div><span>'+method+'</span><strong>'+originalBags+'</strong></div><div><span>ကုန်လက်ခံမှတ်တမ်းပိဿာ</span><strong>'+q(receipt.weightKnown===false?null:receiptReceivedQuantity2(receipt))+'</strong></div></div>'+
   '<div class="ppl2-current"><div><span>လက်ရှိ ထုပ်ပိုးပြီးကုန်</span><strong class="ppl2-current-packed">'+q(totalWeight(packed))+'</strong><small>'+b(currentCount)+'</small></div>'+
   '<div><span>လက်ရှိ မထုပ်ပိုးရသေးသောကုန်</span><strong class="ppl2-current-loose">'+q(totalWeight(loose))+'</strong></div></div>'+
   (packed.length?'<div class="ppl2-current-groups">'+currentGroups(packed)+'</div>':'')+
   '<p class="ppl2-help">မူလအသုတ်ကို အိတ်ပုံစံပြောင်းထားခြင်းဖြစ်ပါသည်။ ထုပ်ပိုးပိဿာကို ကုန်လက်ခံပိဿာပေါ် ထပ်မပေါင်းပါ။</p>'+
   (records.length?'<details class="ppl2-records"><summary>ထုပ်ပိုးမှတ်တမ်း ကြည့်မယ် <span>('+N(records.length)+')</span></summary>'+
    '<div class="ppl2-history-total"><span>ထုပ်ပိုးခဲ့ပြီး စုစုပေါင်း</span><strong>'+q(historicalQty)+' · '+b(historicalCount)+'</strong></div>'+
    '<div class="ppl2-history-list" role="list">'+historyRows(records)+'</div><p class="ppl2-help">မှတ်တမ်းထဲက လက်ကျန်သည် ထုပ်ပိုးခဲ့သည့်အချိန်က လက်ကျန်ဖြစ်ပြီး အပေါ်တွင် လက်ရှိလက်ကျန်ကို ပြထားပါသည်။ မမှတ်ထားသောအချက်ကို — ဖြင့် ပြပါသည်။</p></details>':
    '<p class="ppl2-help">ဤအသုတ်အတွက် ချိတ်ဆက်ထားသော ထုပ်ပိုးမှတ်တမ်း မတွေ့ပါ။ လက်ရှိအသုတ်လက်ကျန်ကိုသာ ပြထားပါသည်။</p>')+'</section>';
 }
 function mountPurchase(){
  if(v4Kind!=='purchase'||!document.getElementById('voucher4'))return;
  document.querySelectorAll('#voucherLines4 .req-line').forEach((row,index)=>{
   row.querySelectorAll('.ppl2-panel').forEach(n=>n.remove());
   const r=state.receipts.find(r=>r.id===row.dataset.rid);if(!r)return;
   const html=panel(r,'ppl2-purchase-'+index);if(!html)return;
   const field=row.querySelector('[id^="vp"]')?.closest('.field');
   if(field)field.insertAdjacentHTML('afterend',html);else row.insertAdjacentHTML('beforeend',html);
  });
 }
 const previousForm=voucherForm4;
 voucherForm4=function(...args){const result=previousForm.apply(this,args);mountPurchase();return result;};
 const previousDetail=receiptDetail4;
 receiptDetail4=function(id){
  const result=previousDetail(id),body=document.querySelector('#main .work-page .modal-body');
  if(!body)return result;
  body.querySelectorAll('.ppl2-detail-panels').forEach(n=>n.remove());
  const html=voucherRecords4('purchase',id).map((r,index)=>panel(r,'ppl2-detail-'+index)).join('');
  if(!html)return result;
  const table=body.querySelector('.table-wrap');
  if(table){
   const headers=table.querySelectorAll('thead th');
   if(headers.length===6){headers[1].textContent='မူလလက်ခံပုံစံ';headers[2].textContent='မူလလက်ခံအိတ်';}
   table.insertAdjacentHTML('afterend','<div class="ppl2-detail-panels">'+html+'</div>');
  }else body.insertAdjacentHTML('afterbegin','<div class="ppl2-detail-panels">'+html+'</div>');
  return result;
 };
 document.title='ပွဲရုံ · Version 2 · Remaining Stock Purchase Update';
})();

