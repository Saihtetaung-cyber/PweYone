
/* Append dispatch balance snapshots to each native dispatch record; do not post any additional stock/cash movement. */
(function(){
 'use strict';
 const originalSaveDispatch=saveDispatch4,originalPersist=save,originalRows=renderSaleRows,originalDetail=saleDetail4,originalOpenDetail=openSaleDetail,originalDispatch=dispatch4,originalOpenDispatch=openDispatch;
 let pending=null;
 const numeric=v=>Number.isFinite(Number(v))?Number(v):0;
 const display=v=>new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(numeric(v));
 const bagDisplay=v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:6}).format(numeric(v));
 const weight=v=>display(v)+' ပိဿာ';
 const sameSize=(a,b)=>a>0&&b>0&&Math.abs(a-b)<0.000001;
 function saleSize(s){return s.qty>0&&s.bags>0?Number(s.qty)/Number(s.bags):0;}
 function lotSize(l,s){return [Number(l?.packageViss),l?.bags>0?Number(l.qty)/Number(l.bags):0,Number(s?.buyerBagViss46),Number(s?.packageViss),saleSize(s)].find(n=>Number.isFinite(n)&&n>0)||0;}
 function knownBags(value){return typeof value==='number'&&Number.isFinite(value)&&value>=0;}
 function metric(label,qty,bags,kind=''){
  return `<div class="dh2-metric ${kind}"><span>${E(label)}</span><strong>${weight(qty)}</strong>${knownBags(bags)?`<small>${bagDisplay(bags)} အိတ်</small>`:''}</div>`;
 }
 function snapshotPending(){
  const p=pending;if(!p)return;
  const s=state.sales.find(x=>x.id===p.id),records=s?.dispatches||[];
  if(!s||records.length!==p.count+1)return;
  const d=records[p.count],q=numeric(d.qty),delta=numeric(s.deliveredQty)-p.delivered;
  if(!(q>0)||Math.abs(q-delta)>0.000001)return;
  const lot=state.lots.find(x=>x.id===p.lotId),basis=saleSize(s);
  d.history2={schema:1,sequence:p.count+1,recordedAt:new Date().toISOString(),role:state.role,
   lotId:p.lotId,warehouseName:p.warehouseName,lotBatch:p.batch,entryUnit:p.unit,
   qtyBefore:p.before,qtyAfter:saleRemaining(s),bagSize:p.size,bagCount:p.size>0?q/p.size:null,
   saleBagSize:basis,saleBagsBefore:p.saleBagsBefore,saleBagsAfter:s.bags>0?Math.max(0,numeric(s.bags)-numeric(s.deliveredBags)):null,
   lotQtyBefore:p.lotBefore,lotQtyAfter:lot?numeric(lot.qty):Math.max(0,p.lotBefore-q),lotBagsAfter:p.size>0?(lot?numeric(lot.qty):Math.max(0,p.lotBefore-q))/p.size:null};
  pending=null;
 }
 // This runs before the existing persistence call, so each dispatch is saved once with its snapshot.
 save=function(...args){snapshotPending();return originalPersist(...args);};
 saveDispatch4=function(id){
  const form=document.getElementById('dispatch4'),s=state.sales.find(x=>x.id===id),lot=state.lots.find(x=>x.id===form?.querySelector('#dLot')?.value&&x.saleId===id&&x.owner==='customer');
  if(form&&s&&lot)pending={id,count:(s.dispatches||[]).length,delivered:numeric(s.deliveredQty),before:saleRemaining(s),saleBagsBefore:s.bags>0?Math.max(0,numeric(s.bags)-numeric(s.deliveredBags)):null,
   lotId:lot.id,warehouseName:W(lot.warehouse),batch:lot.batch||s.batch||'',lotBefore:numeric(lot.qty),size:lotSize(lot,s),unit:form.querySelector('#dispatchUnit2')?.value||'viss'};
  try{return originalSaveDispatch(id);}finally{pending=null;}
 };
 function recordsFor(s){
  const source=(s.dispatches||[]),recorded=source.reduce((n,d)=>n+numeric(d.qty),0),unrecorded=Math.max(0,numeric(s.deliveredQty)-recorded),basis=saleSize(s),rows=[];
  const direct=s.mode==='direct'&&unrecorded>0;
  if(direct){const q=Math.min(numeric(s.qty),unrecorded);rows.push({date:s.date,qty:q,before:numeric(s.qty),after:Math.max(0,numeric(s.qty)-q),bagCount:basis>0?q/basis:null,beforeBags:basis>0?numeric(s.qty)/basis:null,afterBags:basis>0?Math.max(0,numeric(s.qty)-q)/basis:null,warehouse:W(s.warehouse),batch:s.batch||'',direct:true,legacy:false});}
  let issued=unrecorded;
  source.forEach((d,index)=>{
   const q=numeric(d.qty),h=d.history2,hasSnapshot=h?.schema===1&&Number.isFinite(h.qtyBefore)&&Number.isFinite(h.qtyAfter),before=Math.max(0,numeric(s.qty)-issued),after=Math.max(0,before-q);
   const compatible=hasSnapshot?sameSize(h.saleBagSize,h.bagSize):true;
   rows.push({date:d.date,qty:q,before:hasSnapshot?h.qtyBefore:before,after:hasSnapshot?h.qtyAfter:after,
    bagCount:hasSnapshot?(knownBags(h.bagCount)?h.bagCount:null):(knownBags(d.bags)?d.bags:basis>0?q/basis:null),
    beforeBags:compatible?(hasSnapshot?h.saleBagsBefore:basis>0?before/basis:null):null,
    afterBags:compatible?(hasSnapshot?h.saleBagsAfter:basis>0?after/basis:null):null,
    recordedAt:hasSnapshot?h.recordedAt:'',warehouse:hasSnapshot?h.warehouseName:W(d.warehouse||s.warehouse),batch:hasSnapshot?h.lotBatch:(s.batch||''),
    lotAfter:hasSnapshot?h.lotQtyAfter:null,lotBagsAfter:hasSnapshot?h.lotBagsAfter:null,showLotBalance:hasSnapshot&&(Math.abs(numeric(h.lotQtyAfter)-h.qtyAfter)>0.000001||!compatible),
    unit:hasSnapshot?h.entryUnit:'',direct:false,legacy:!hasSnapshot,nativeIndex:index});
   issued+=q;
  });
  return {rows,missing:!direct?unrecorded:0,legacy:source.some(d=>!d.history2)};
 }
 function timeText(iso){const d=new Date(iso);return Number.isNaN(d.getTime())?'':new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(d);}
 function historyRecordedAt(s,r){
  const native=Number.isInteger(r.nativeIndex)?s.dispatches?.[r.nativeIndex]:null;
  const candidate=r.recordedAt||native?.recordedAt||native?.createdAt||((r.direct||(s.mode==='direct'&&r.nativeIndex===0))?(s.directDispatch2?.recordedAt||s.createdAt):'');
  return candidate&&!Number.isNaN(new Date(candidate).getTime())?candidate:'';
 }
 function historyDateCell(s,r,index){
  const date=E(shortDate(r.date)),recordedAt=historyRecordedAt(s,r),stamp=recordedAt?new Date(recordedAt):null;
  let dateAndTime=date+' · <span class="dh2-missing-time">—</span>';
  if(stamp&&!Number.isNaN(stamp.getTime())){
   const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(stamp).map(x=>[x.type,x.value]));
   const clock=parts.hour+':'+parts.minute+':'+parts.second,recordDate=parts.year+'-'+parts.month+'-'+parts.day;
   dateAndTime=recordDate===r.date?`${date} · <time datetime="${E(recordedAt)}">${E(clock)}</time>`:`${date}<span class="dh2-recorded-line"><span>မှတ်တမ်းချိန်</span> · <time datetime="${E(recordedAt)}">${E(parts.day+'/'+parts.month+'/'+parts.year+' · '+clock)}</time></span>`;
  }
  return `<strong class="dh2-row-title"><span>အကြိမ်</span> ${index+1}</strong><div class="dh2-row-date">${dateAndTime}</div>`;
 }
 function historyQuantityCell(qty,bags,kind=''){
  return `<td class="dh2-quantity-cell ${kind}"><strong>${weight(qty)}</strong>${knownBags(bags)?`<span class="dh2-row-bags">${bagDisplay(bags)} အိတ်</span>`:''}</td>`;
 }
 function lineHTML(s){
  const {rows,missing,legacy}=recordsFor(s);
  const summary=`<div class="dh2-summary-line"><span><span>အရောင်းပမာဏ</span> <strong>${weight(s.qty)}</strong></span><span><span>စုစုပေါင်း ထုတ်ပေးပြီး</span> <strong>${weight(s.deliveredQty)}</strong></span><span><span>လက်ရှိ ထုတ်ပေးရန်ကျန်</span> <strong>${weight(saleRemaining(s))}</strong></span></div>`;
  const items=rows.map((r,index)=>`<tr data-sale-id="${E(s.id)}" data-history-index="${index}"><td>${historyDateCell(s,r,index)}</td><td class="dh2-source-cell"><strong>${E(r.warehouse||'—')}</strong>${r.batch?`<span>${E(r.batch)}</span>`:''}${r.direct?'<span>အရောင်းနှင့်တစ်ပါတည်း ထုတ်ပေး</span>':''}</td>${historyQuantityCell(r.before,r.beforeBags)}${historyQuantityCell(r.qty,r.bagCount,'dh2-issued-cell')}<td class="dh2-quantity-cell"><strong>${weight(r.after)}</strong>${knownBags(r.afterBags)?`<span class="dh2-row-bags">${bagDisplay(r.afterBags)} အိတ်</span>`:''}${r.showLotBalance?`<span class="dh2-row-lot-balance"><span>အသုတ်ကျန်</span> · ${weight(r.lotAfter)}${knownBags(r.lotBagsAfter)?' · '+bagDisplay(r.lotBagsAfter)+' အိတ်':''}</span>`:''}</td></tr>`).reverse().join('');
  const table=`<div class="dh2-table-scroll" role="region" aria-label="ကုန်ထုတ်မှတ်တမ်းဇယား" tabindex="0"><table class="dh2-history-table"><thead><tr><th scope="col">ရက် / အချိန်</th><th scope="col">ဂိုဒေါင် / အသုတ်</th><th scope="col" class="dh2-number-heading">မထုတ်မီကျန်</th><th scope="col" class="dh2-number-heading">ထုတ်ပေးပမာဏ</th><th scope="col" class="dh2-number-heading">ထုတ်ပြီးနောက်ကျန်</th></tr></thead><tbody>${items||'<tr><td colspan="5" class="dh2-table-empty">ကုန်ထုတ်မှတ်တမ်း မရှိသေးပါ။</td></tr>'}</tbody></table></div>`;
  return `<section class="dh2-product"><div class="dh2-product-head"><div><h3>${E(s.product)}</h3><span>${E(s.no||s.voucherNo||'')}</span></div><span class="dh2-record-count">မှတ်တမ်း ${rows.length} ခု</span></div>${summary}${missing>0?`<p class="dh2-note"><span>တစ်ကြိမ်ချင်းမှတ်တမ်း မပါသော ယခင်ထုတ်ပေးပမာဏ</span> · ${weight(missing)}</p>`:''}${table}<p class="dh2-mobile-scroll-hint">ဇယားကို ဘေးတိုက်ရွှေ့ကြည့်နိုင်ပါသည်။</p>${legacy?'<p class="dh2-note">ယခင်မှတ်တမ်းများ၏ လက်ကျန်ကို သိမ်းထားသော ကုန်ထုတ်အစဉ်အတိုင်း ပြန်တွက်ပြထားပါသည်။</p>':''}${rows.some(r=>!historyRecordedAt(s,r))?'<p class="dh2-note">အချိန်မသိမ်းထားသော ယခင်မှတ်တမ်းများတွင် — ဖြင့် ပြထားပါသည်။</p>':''}</section>`;
 }
 function historyHTML(sales,compact=false,standalone=false){
  return `<section class="dispatch-history2 ${compact?'dh2-compact':''} ${standalone?'dh2-standalone':''}"><div class="dh2-heading">${standalone?'':'<h2>ကုန်ထုတ်မှတ်တမ်း</h2>'}<p>မထုတ်မီကျန်၊ ယခုထုတ်ပေးနှင့် ထုတ်ပြီးနောက်ကျန်ကို တစ်ကြိမ်ချင်း ကြည့်နိုင်ပါသည်။</p></div>${sales.map(lineHTML).join('')}<p class="dh2-note">အပေါ်ဆုံးတွင် နောက်ဆုံးထုတ်ပေးခဲ့သော မှတ်တမ်းကို ပြထားပါသည်။ အရောင်းလက်ကျန်အိတ်သည် မူလအရောင်းအချိုးအရ ဖြစ်သည်။</p></section>`;
 }
 window.openDispatchHistory2=function(id){const sales=voucherRecords4('sale',id),first=sales[0];if(!first)return;openModal('ကုန်ထုတ်မှတ်တမ်း',first.name+' · '+(first.voucherNo||first.no),historyHTML(sales,false,true),btn('ပြန်မယ်','closeModal()','secondary')+btn('အရောင်းအသေးစိတ်',`saleDetail4('${E(id)}')`,'primary','doc'),true);};
 function appendFormHistory(id){const form=document.getElementById('dispatch4'),s=state.sales.find(x=>x.id===id);if(!form||!s||document.querySelector('.dispatch-history2'))return;form.insertAdjacentHTML('afterend',historyHTML([s],true));}
 dispatch4=function(id){originalDispatch(id);appendFormHistory(id);};
 openDispatch=originalOpenDispatch===originalDispatch?dispatch4:function(id){originalOpenDispatch(id);appendFormHistory(id);};
 saleDetail4=function(id){originalDetail(id);const root=document.querySelector('#main .modal-body'),sales=voucherRecords4('sale',id);if(root&&sales.length&&!root.querySelector('.dispatch-history2'))root.insertAdjacentHTML('beforeend',historyHTML(sales));};
 openSaleDetail=originalOpenDetail===originalDetail?saleDetail4:function(id){originalOpenDetail(id);const root=document.querySelector('#main .modal-body'),sales=voucherRecords4('sale',id);if(root&&sales.length&&!root.querySelector('.dispatch-history2'))root.insertAdjacentHTML('beforeend',historyHTML(sales));};
 renderSaleRows=function(){
  originalRows();const root=document.getElementById('saleRows');if(!root)return;
  root.querySelectorAll('article').forEach(card=>{
   const detail=[...card.querySelectorAll('[onclick]')].find(b=>/^saleDetail4\('/.test(b.getAttribute('onclick')||'')),match=detail?.getAttribute('onclick').match(/^saleDetail4\('([^']+)'\)/);if(!match||card.querySelector('.dh2-list-link'))return;
   const id=match[1],sales=voucherRecords4('sale',id),issued=sales.reduce((n,s)=>n+numeric(s.deliveredQty),0),remaining=sales.reduce((n,s)=>n+saleRemaining(s),0);
   const status=document.createElement('div');status.className='dh2-list-status';status.innerHTML='<span>ထုတ်ပေးပြီး</span> <strong>'+weight(issued)+'</strong><span class="dh2-list-separator">·</span><span>ထုတ်ပေးရန်ကျန်</span> <strong>'+weight(remaining)+'</strong>';
   const chips=card.querySelector('.req-chip-row');if(chips)chips.after(status);else detail.parentElement.before(status);
   const button=document.createElement('button');button.type='button';button.className='btn btn-secondary dh2-list-link';button.textContent='ကုန်ထုတ်မှတ်တမ်း';button.addEventListener('click',()=>openDispatchHistory2(id));detail.after(button);
  });
 };
 if(page==='sales'&&!workView)renderSaleRows();
})();

