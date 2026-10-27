
/* Version 2: stock-ledger projection only. Native stock, cash and approval engines remain unchanged. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),num=x=>Number.isFinite(Number(x))?Number(x):0;
 const known=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
 const round=x=>Math.round((x+Number.EPSILON)*1e6)/1e6,arr=x=>Array.isArray(x)?x:[];
 const en=()=>document.documentElement.lang==='en',t=(my,english)=>en()?english:my;
 const esc=x=>E(String(x??'')),qty=x=>known(x)?vissText37(round(Number(x))):'—';
 const ownerName=o=>({owned:t('ပွဲရုံပိုင်','Market owned'),supplier:t('ကုန်သည်ပိုင်','Trader owned'),customer:t('ဝယ်သူပိုင်','Buyer owned')})[o]||t('မမှတ်ထား','Not recorded');
 const whName=id=>id?((state.warehouses||[]).find(w=>w.id===id)?.name||id):t('မမှတ်ထား','Not recorded');
 const ui={from:today().slice(0,8)+'01',to:today(),product:'',warehouse:'',owner:'',tab:'summary',page:1};
 let model=null,backScroll=0,purchaseContext=null;
 function stamp(iso){const d=iso?new Date(iso):null;return d&&!isNaN(d)?d.toLocaleString('en-GB',{timeZone:'Asia/Rangoon',hour12:false}):t('အချိန် မမှတ်ထား','Time not recorded');}
 function sourceReceipt(s){return state.receipts.find(r=>r.id===s.sourceReceiptId)||null;}
 function leg(warehouse,owner,delta,category){return {warehouse:warehouse||'',owner:owner||'',delta:known(delta)?round(Number(delta)):null,category};}
 function metadata(id){return state.stockLedgerMeta2?.events?.[id]||{};}
 function events(){
  const out=[],receipts=arr(state.receipts),sales=arr(state.sales),lots=arr(state.lots);
  const add=e=>{const m=metadata(e.id);out.push({...e,recordedAt:e.recordedAt||m.recordedAt||'',role:e.role||m.role||'',order:out.length});};
  for(const r of receipts){
   const original=r.remainingPurchase2?.original||r,received=typeof receiptReceivedQuantity2==='function'?receiptReceivedQuantity2(r):r.qty;
   const included=arr(state.adjustments).filter(a=>a.receiptQtyIncluded2&&a.sourceReceiptId===r.id).reduce((sum,a)=>sum+(a.direction==='increase'?1:-1)*num(a.qty),0);
   const q=r.weightKnown===false&&!(received>0)?null:round(num(received)-included),ref=r.voucherNo||r.no||r.id;
   if(!r.opening69)add({id:'receipt:'+r.id,kind:'receive',date:r.date,product:r.product,ref,receiptId:r.id,party:r.name,warehouse:r.warehouse,owner:'supplier',batch:ref,
    qty:q,bags:original.bagType==='weight'?null:known(original.rawBags)&&original.bagType==='raw'?num(original.rawBags):known(original.bags)?num(original.bags):null,
    bagType:original.bagType,packageViss:original.packageViss,car:r.car,note:r.note,recordedAt:r.receivedAt2||r.createdAt||'',legs:[leg(r.warehouse,'supplier',q,'physical')]});
   if(r.status==='purchased'){
    const id='purchase:'+r.id,m=metadata(id),p=r.remainingPurchase2;
    let slices=p?.sourceLots?p.sourceLots.filter(l=>num(l.qty)>0).map(l=>({warehouse:l.warehouse,qty:num(l.qty)})):arr(m.lots);
    if(!slices.length){
     const moved=arr(state.transfers).some(x=>x.product===r.product&&(x.history2?.sourceReceiptId===r.id||x.batch===ref)&&String(x.date)<=String(r.purchaseDate||r.date));
     slices=[{warehouse:moved?'':r.warehouse,qty:num(r.qty)}];
    }
    const legs=slices.flatMap(x=>[leg(x.warehouse,'supplier',-num(x.qty),'ownership'),leg(x.warehouse,'owned',num(x.qty),'ownership')]);
    add({id,kind:'purchase',date:r.purchaseDate||r.date,product:r.product,ref:r.purchaseNo||ref,receiptId:r.id,party:r.name,batch:ref,warehouse:slices.length===1?slices[0].warehouse:'',warehouseName:[...new Set(slices.map(x=>whName(x.warehouse)))].join(' / '),fromOwner:'supplier',toOwner:'owned',qty:slices.reduce((n,x)=>n+num(x.qty),0),bags:null,
     recordedAt:p?.recordedAt||'',note:t('ကုန်သည်ပိုင် → ပွဲရုံပိုင်။ ကုန်အသစ် ထပ်မဝင်ပါ။','Trader → market ownership. No additional physical receipt.'),legs});
   }
  }
  for(const s of sales){
   const r=sourceReceipt(s),source=s.sourceOwner||'',ref=s.voucherNo||s.no||s.id;
   const base={date:s.date,product:s.product,ref,saleId:s.id,receiptId:r?.id||s.sourceReceiptId||'',sourceRef:s.sourceReceiptNo||r?.voucherNo||r?.no||'',party:s.name,trader:s.sourceSupplierName||s.originPartnerName||r?.name||'',warehouse:s.warehouse,batch:s.batch,packageViss:s.buyerBagViss46||s.packageViss,car:s.car,qty:num(s.qty),bags:s.saleBagsEntered43===true?num(s.saleBagsCount43):known(s.bags)?num(s.bags):null};
   if(s.mode==='hold')add({...base,id:'hold:'+s.id,kind:'hold',fromOwner:source,toOwner:'customer',note:t('ရောင်းပြီး သိမ်းထပ်ထား။ တကယ်ထုတ်ပေးချိန်မှ ကုန်အထွက်တွက်ပါသည်။','Sold and held. Physical stock leaves only when dispatched.'),legs:[leg(s.warehouse,source,-num(s.qty),'ownership'),leg(s.warehouse,'customer',num(s.qty),'ownership')]});
   const dispatches=arr(s.dispatches),recorded=dispatches.reduce((n,d)=>n+num(d.qty),0);
   const direct=s.mode==='direct'?Math.max(0,num(s.deliveredQty??s.qty)-recorded):0;
   if(direct>0)add({...base,id:'direct:'+s.id,kind:'dispatch',owner:source,qty:direct,bags:Math.abs(direct-num(s.qty))<.000001?base.bags:null,recordedAt:s.directDispatch2?.recordedAt||'',note:t('အရောင်းနှင့်တစ်ပြိုင်နက် ထုတ်ပေး','Dispatched with sale'),legs:[leg(s.warehouse,source,-direct,'physical')]});
   dispatches.forEach((d,index)=>{
    const h=d.history2||{},warehouse=d.warehouse||lots.find(l=>l.id===h.lotId)?.warehouse||'',b=known(h.bagCount)?num(h.bagCount):known(d.bags)?num(d.bags):null;
    add({...base,id:'dispatch:'+s.id+':'+index,kind:'dispatch',date:d.date,owner:s.mode==='hold'?'customer':source,warehouse,warehouseName:h.warehouseName||'',qty:num(d.qty),bags:b,packageViss:h.bagSize||base.packageViss,car:d.car||s.car,collector:d.collector,recordedAt:h.recordedAt||d.recordedAt||'',role:h.role||'',batch:h.lotBatch||s.batch,lotId:h.lotId,lotAfter:h.lotQtyAfter,note:t('ဝယ်သူထံ ကုန်ထုတ်ပေး','Goods dispatched to buyer'),legs:[leg(warehouse,s.mode==='hold'?'customer':source,-num(d.qty),'physical')]});
   });
   const missing=s.mode!=='direct'?Math.max(0,num(s.deliveredQty)-recorded):0;
   if(missing>.000001)add({...base,id:'unrecorded-dispatch:'+s.id,kind:'dispatch',date:'',warehouse:'',owner:'customer',qty:missing,bags:null,note:t('ထုတ်ပြီးပမာဏရှိသော်လည်း သက်ဆိုင်ရာထုတ်ပေးရက် မမှတ်ထားပါ။','Delivered quantity exists without a recorded dispatch date.'),legs:[leg('','customer',-missing,'physical')]});
  }
  arr(state.initialOpening69?.dispatches).forEach(d=>{
   const l=lots.find(x=>x.id===d.lotId);
   add({id:'opening-dispatch:'+d.id,kind:'dispatch',date:d.date,product:d.product,ref:d.id,party:state.masters?.partners?.find(p=>p.id===d.buyerId)?.name||'',owner:'customer',warehouse:d.warehouse,batch:d.batch,qty:num(d.qty),bags:known(d.bags)?num(d.bags):null,note:t('စတင်လက်ကျန် ဝယ်သူပိုင်ကုန် ထုတ်ပေး','Dispatch from buyer opening stock'),sourceRef:l?.originReceiptNo||'',legs:[leg(d.warehouse,'customer',-num(d.qty),'physical')]});
  });
  arr(state.transfers).forEach((x,index)=>{
   const h=x.history2||{},q=h.schema===1?(known(h.qtyMoved)?num(h.qtyMoved):null):x.weightKnown===false?null:known(x.qty)?num(x.qty):null;
   add({id:'transfer:'+x.id,kind:'transfer',date:x.date,product:x.product,ref:x.id,party:h.ownerName||x.name,owner:h.owner||x.owner,fromWh:x.from,toWh:x.to,warehouse:x.from,batch:h.sourceBatch||x.batch,receiptId:h.sourceReceiptId,sourceRef:h.sourceReceiptNo,qty:q,bags:known(h.bagsMoved)?num(h.bagsMoved):known(x.bags)?num(x.bags):null,packageViss:h.packageViss,recordedAt:h.recordedAt||x.recordedAt,role:h.role,transferIndex:index,note:t('ဂိုဒေါင်ပြောင်းခြင်း။ စုစုပေါင်းကုန် မတိုးမလျော့ပါ။','Warehouse transfer. Total physical stock is unchanged.'),legs:[leg(x.from,h.owner||x.owner,q===null?null:-q,'transfer'),leg(x.to,h.owner||x.owner,q,'transfer')]});
  });
  arr(state.adjustments).forEach((x,index)=>{
   const h=x.history2||{},d=h.schema===1?(known(h.qtyDelta)?num(h.qtyDelta):null):(x.direction==='increase'?1:-1)*num(x.qty);
   add({id:'adjust:'+x.id,kind:'adjust',date:x.date,product:x.product,ref:x.id,party:h.ownerName||'',owner:h.owner||x.owner,warehouse:h.warehouseId||x.warehouse,batch:h.sourceBatch||x.batch,receiptId:h.sourceReceiptId||x.sourceReceiptId,sourceRef:h.sourceReceiptNo,qty:Math.abs(d||0),unknownQty:d===null,bags:known(h.bagsDelta)?Math.abs(num(h.bagsDelta)):null,bagDelta:known(h.bagsDelta)?num(h.bagsDelta):null,recordedAt:h.recordedAt||x.recordedAt,role:h.role,adjustIndex:index,note:x.reason||h.note||'',lotAfter:h.qtyAfter,legs:[leg(h.warehouseId||x.warehouse,h.owner||x.owner,d,'adjust')]});
  });
  arr(state.packagingTransactions).forEach((x,index)=>{
   const h=x.history2||{},r=receipts.find(r=>r.id===(h.sourceReceiptId||x.sourceReceiptId));
   add({id:'pack:'+x.id,kind:'pack',date:x.date,product:x.product,ref:x.id,owner:h.owner||x.owner||'',party:h.ownerName||x.ownerName||'',warehouse:h.warehouseId||x.warehouse||'',warehouseName:h.warehouseName||'',batch:h.sourceBatch||x.batch,receiptId:h.sourceReceiptId||x.sourceReceiptId,sourceRef:h.sourceReceiptNo||r?.voucherNo||r?.no||'',qty:known(h.packedQty)?num(h.packedQty):num(x.qty),bags:known(h.bagCount)?num(h.bagCount):known(x.bagCount)?num(x.bagCount):null,packageViss:h.packageViss||x.packageViss,recordedAt:h.recordedAt||x.recordedAt,role:h.role,packIndex:index,note:t('ထုပ်ပိုးပုံစံပြောင်းခြင်း။ ကုန်အဝင် ထပ်မတွက်ပါ။','Packing changes the stock form. It is not another receipt.'),legs:[]});
  });
  // Reuse unmatched legacy movements only. Exact references, date, direction and
  // product consume a quantity budget; a voucher total may match several lines.
  const budget=new Map(),signature=(p,d,dir,ref)=>JSON.stringify([p,d||'',dir,ref||'']);
  for(const e of out){if(!['receive','dispatch','adjust'].includes(e.kind))continue;
   for(const l of e.legs){if(!known(l.delta)||!l.delta)continue;const dir=l.delta>0?'in':'out',refs=new Set([e.ref,e.sourceRef]);
    if(e.receiptId){const r=receipts.find(x=>x.id===e.receiptId);if(e.kind==='receive'){refs.add(r?.no);refs.add(r?.voucherNo);}}
    if(e.saleId){const s=sales.find(x=>x.id===e.saleId);refs.add(s?.no);refs.add(s?.voucherNo);}
    if(e.kind==='adjust'){const a=state.adjustments[e.adjustIndex];refs.add(a?.id+' — '+(a?.history2?.reasonLabel||''));if(a?.groundCheckId)refs.add('Ground Check '+a.groundCheckId);refs.add('Adjustment — '+a?.reason);}
    // Each alias points at the same remaining budget, preventing duplicate counts.
    const pool={remaining:Math.abs(l.delta)};for(const ref of refs)if(ref){const k=signature(e.product,e.date,dir,ref);if(!budget.has(k))budget.set(k,[]);budget.get(k).push(pool);}
   }
  }
  arr(state.moves).forEach((m,index)=>{
   let q=Math.max(0,num(m.qty));const pools=budget.get(signature(m.product,m.date,m.direction,m.ref))||[];
   for(const p of pools){const used=Math.min(q,p.remaining);q=round(q-used);p.remaining=round(p.remaining-used);if(q<=.000001)break;}
   if(q<=.000001)return;
   const kind=/adjust|ground/.test(m.kind||'')?'adjust':m.direction==='in'?'receive':'dispatch',delta=m.direction==='out'?-q:q;
   add({id:'legacy-move:'+index,kind,date:m.date,product:m.product,ref:m.ref||'',owner:m.owner||'',warehouse:m.warehouse||'',qty:q,bags:known(m.bags)&&num(m.bags)>0&&q===num(m.qty)?num(m.bags):null,note:t('ယခင်ကုန်လှုပ်ရှားမှု။ မသိမ်းထားသော အသုတ် / ပိုင်ရှင်ကို မခန့်မှန်းထားပါ။','Legacy stock movement. Missing lot and ownership details have not been inferred.'),recordedAt:m.recordedAt||'',legs:[leg(m.warehouse,m.owner,delta,kind==='adjust'?'adjust':'physical')]});
  });
  return out;
 }
 function openingRows(){
  const o=state.initialOpening69,rows=[],remaining=new Map();
  for(const x of arr(state.stockOpening)){const key=x.product+'|'+(x.grade||'');remaining.set(key,(remaining.get(key)||0)+num(x.qty));}
  if(o?.status==='approved'){
   const src=[...arr(o.own?.rows).filter(()=>o.own?.stock==='yes').map(r=>({...r,owner:'owned'})),...Object.entries(o.parties||{}).flatMap(([id,d])=>d.answers?.stock==='yes'?arr(d.rows).map(r=>({...r,owner:state.masters?.partners?.find(p=>p.id===id)?.kind==='buyer'?'customer':'supplier'})):[])];
   for(const r of src){const key=r.product+'|'+(r.grade||''),available=remaining.get(key)||0,q=Math.min(num(r.qty),Math.max(0,available));if(q){rows.push({product:r.product,warehouse:r.warehouse,owner:r.owner,qty:q,date:o.startDate||''});remaining.set(key,round(available-q));}}
  }
  for(const [key,q] of remaining)if(Math.abs(q)>.000001){const split=key.lastIndexOf('|');rows.push({product:key.slice(0,split),warehouse:'',owner:'',qty:q,date:'',legacy:true});}
  return rows;
 }
 function matchLeg(l){return (!ui.warehouse||l.warehouse===ui.warehouse)&&(!ui.owner||l.owner===ui.owner);}
 function uncertain(l){return !!((ui.warehouse&&!l.warehouse)||(ui.owner&&!l.owner));}
 function effect(e){
  let delta=0,ins=0,outs=0,adjust=0,transferIn=0,transferOut=0,ownershipIn=0,ownershipOut=0,missing=false,any=false;
  for(const l of e.legs){if(uncertain(l)){// An explicitly different known field rules out this leg.
    if(ui.warehouse&&l.warehouse&&ui.warehouse!==l.warehouse||ui.owner&&l.owner&&ui.owner!==l.owner)continue;missing=true;continue;
   }
   if(!matchLeg(l))continue;any=true;
   if(!known(l.delta)){missing=true;continue;}const d=num(l.delta);delta+=d;
   if(l.category==='physical'){if(d>=0)ins+=d;else outs-=d;}
   if(l.category==='adjust')adjust+=d;
   if(l.category==='transfer'&&ui.warehouse){if(d>=0)transferIn+=d;else transferOut-=d;}
   if(l.category==='ownership'&&ui.owner){if(d>=0)ownershipIn+=d;else ownershipOut-=d;}
  }
  // Both sides cancel for an all-warehouse / all-owner report, even when the
  // moved weight was not measured. Such an internal move cannot change total weight.
  if(e.kind==='transfer'&&!ui.warehouse&&( !ui.owner||e.owner===ui.owner))missing=false;
  if(['purchase','hold'].includes(e.kind)&&!ui.owner&&!ui.warehouse)missing=false;
  if(e.kind==='pack'){any=(!ui.warehouse||e.warehouse===ui.warehouse)&&(!ui.owner||e.owner===ui.owner);missing=false;}
  return {delta:round(delta),ins,outs,adjust,transferIn,transferOut,ownershipIn,ownershipOut,missing,visible:any||missing};
 }
 function project(){
  const es=events(),opens=openingRows(),names=new Set([...es.map(e=>e.product),...opens.map(x=>x.product),...arr(state.lots).map(l=>l.product)].filter(Boolean)),groups=[],details=[];
  const eventsByProduct=new Map();for(const e of es){if(!eventsByProduct.has(e.product))eventsByProduct.set(e.product,[]);eventsByProduct.get(e.product).push(e);}
  for(const product of [...names].sort((a,b)=>a.localeCompare(b))){
   if(ui.product&&ui.product!==product)continue;
   const g={product,opening:0,ins:0,outs:0,adjust:0,transferIn:0,transferOut:0,ownershipIn:0,ownershipOut:0,closing:0,missing:false,unknownDates:0,count:0};
   for(const x of opens.filter(x=>x.product===product)){
    if(ui.warehouse&&x.warehouse&&ui.warehouse!==x.warehouse||ui.owner&&x.owner&&ui.owner!==x.owner)continue;
    if(x.date&&ui.to<x.date)continue;
    if(uncertain(x)){g.missing=true;continue;}if(matchLeg(x))g.opening+=x.qty;
    // Undated aggregate opening stock can already include old receiving rows.
    // Without a recorded cutoff, do not claim a second exact closing balance.
    if(x.legacy&&es.some(e=>e.product===product&&e.kind==='receive'&&e.receiptId&&!e.recordedAt))g.missing=true;
   }
   const list=(eventsByProduct.get(product)||[]).map(e=>({...e,effect:effect(e)})).filter(e=>e.effect.visible);
   const missingDays=new Set();const days=new Map();
   for(const e of list){if(!e.date){g.unknownDates++;g.missing=true;continue;}if(e.date>ui.to)continue;
    if(e.date<ui.from){g.opening+=e.effect.delta;if(e.effect.missing)g.missing=true;continue;}
    if(!days.has(e.date))days.set(e.date,[]);days.get(e.date).push(e);
   }
   for(const [date,rows] of days)if(rows.length>1&&rows.some(e=>!e.recordedAt))missingDays.add(date);
   let balance=round(g.opening),incomplete=g.missing;
   list.filter(e=>e.date&&e.date>=ui.from&&e.date<=ui.to).sort((a,b)=>a.date.localeCompare(b.date)||(a.recordedAt||'').localeCompare(b.recordedAt||'')||a.order-b.order).forEach(e=>{
    const f=e.effect;for(const k of ['ins','outs','adjust','transferIn','transferOut','ownershipIn','ownershipOut'])g[k]+=f[k];
    balance=round(balance+f.delta);if(f.missing){incomplete=true;g.missing=true;}
    details.push({...e,balance:incomplete||missingDays.has(e.date)?null:balance,orderUnknown:missingDays.has(e.date)});g.count++;
   });
   g.opening=round(g.opening);g.closing=balance;
   g.current=arr(state.lots).filter(l=>l.product===product&&(!ui.warehouse||l.warehouse===ui.warehouse)&&(!ui.owner||l.owner===ui.owner)).reduce((n,l)=>n+num(l.qty),0);
   if(!g.missing&&ui.to===today()&&Math.abs(g.closing-g.current)>.001){g.missing=true;g.reconciliationMismatch=true;for(const e of details)if(e.product===product)e.balance=null;}
   if(g.count||g.opening||g.current||g.missing)groups.push(g);
  }
  details.sort((a,b)=>b.date.localeCompare(a.date)||(b.recordedAt||'').localeCompare(a.recordedAt||'')||b.order-a.order);
  return {groups,details,events:es,opens,missing:groups.some(g=>g.missing)};
 }
 const labels=()=>({receive:t('ကုန်လက်ခံ','Goods received'),dispatch:t('ကုန်ထုတ်ပေး','Goods dispatched'),transfer:t('ဂိုဒေါင်ပြောင်း','Warehouse transfer'),adjust:t('ကုန်ချိန်ညှိ','Stock adjustment'),purchase:t('ဈေးဖြတ်ဝယ်ယူ','Purchase / ownership'),hold:t('ရောင်းပြီး သိမ်းထပ်','Sale / held stock'),pack:t('ထုပ်ပိုး','Packing')});
 const badge=e=>`<span class="sl2-badge sl2-${esc(e.kind)}">${esc(labels()[e.kind])}</span>`;
 function option(value,label,current){return `<option value="${esc(value)}" ${value===current?'selected':''}>${esc(label)}</option>`;}
 function options(values,current,all){return option('',all,current)+values.map(x=>option(x[0],x[1],current)).join('');}
 function filters(){
  const names=[...new Set([...arr(state.receipts).map(x=>x.product),...arr(state.lots).map(x=>x.product),...arr(state.moves).map(x=>x.product),...arr(state.stockOpening).map(x=>x.product),...arr(state.sales).map(x=>x.product)].filter(Boolean))].sort();
  return `<form class="sl2-filters" onsubmit="event.preventDefault();stockLedgerApply2()"><div class="sl2-date"><label>${t('စရက်','From date')}<input id="sl2From" type="date" value="${esc(ui.from)}" required></label><label>${t('ဆုံးရက်','To date')}<input id="sl2To" type="date" value="${esc(ui.to)}" required></label><button class="btn btn-primary" type="submit">${t('ကြည့်မယ်','View ledger')}</button></div><div class="sl2-presets">${[['today',t('ယနေ့','Today')],['month',t('ယခုလ','This month')],['all',t('အားလုံး','All dates')]].map(([k,l])=>`<button type="button" class="btn btn-secondary btn-sm" onclick="stockLedgerPreset2('${k}')">${l}</button>`).join('')}</div><div class="sl2-selects"><label>${t('ကုန်ပစ္စည်း','Product')}<select id="sl2Product" onchange="stockLedgerApply2()">${options(names.map(n=>[n,n]),ui.product,t('ကုန်အားလုံး','All products'))}</select></label><label>${t('ဂိုဒေါင်','Warehouse')}<select id="sl2Warehouse" onchange="stockLedgerApply2()">${options(arr(state.warehouses).map(w=>[w.id,w.name]),ui.warehouse,t('ဂိုဒေါင်အားလုံး','All warehouses'))}</select></label><label>${t('ပိုင်ဆိုင်မှု','Ownership')}<select id="sl2Owner" onchange="stockLedgerApply2()">${options(['supplier','owned','customer'].map(o=>[o,ownerName(o)]),ui.owner,t('ပိုင်ဆိုင်မှုအားလုံး','All ownership'))}</select></label><button type="button" class="btn btn-secondary" onclick="stockLedgerClear2()">${t('ရှင်းမယ်','Clear filters')}</button></div><p id="sl2Error" role="alert" hidden></p></form>`;
 }
 function summary(m){
  const gs=m.groups,tot=k=>gs.reduce((n,g)=>n+num(g[k]),0),metric=(l,k)=>`<div><span>${l}</span><strong>${m.missing&&['opening','closing'].includes(k)?'—':qty(tot(k))}</strong><small>${t('ပိဿာ','viss')}</small></div>`;
  const rows=gs.map(g=>`<tr><td><strong>${esc(g.product)}</strong>${g.missing?`<small class="sl2-warn-text">${t('မှတ်တမ်းစစ်ရန်','Review history')}</small>`:''}</td><td>${g.missing?'—':qty(g.opening)}</td><td class="sl2-in">${qty(g.ins)}</td><td>${qty(g.outs)}</td><td>${(g.adjust>0?'+':'')+qty(g.adjust)}</td><td><strong>${g.missing?'—':qty(g.closing)}</strong></td><td><button class="btn btn-secondary btn-sm" onclick="stockLedgerProduct2(${esc(JSON.stringify(g.product))})">${t('အသေးစိတ်','Details')}</button></td></tr>${(g.transferIn||g.transferOut||g.ownershipIn||g.ownershipOut)?`<tr class="sl2-extra"><td colspan="7">${ui.warehouse?t('ဂိုဒေါင်ရွှေ့ အဝင်','Transfer in')+' '+qty(g.transferIn)+' · '+t('ဂိုဒေါင်ရွှေ့ အထွက်','Transfer out')+' '+qty(g.transferOut)+' · ':''}${ui.owner?t('ပိုင်ဆိုင်မှုရရှိ','Ownership received')+' '+qty(g.ownershipIn)+' · '+t('ပိုင်ဆိုင်မှုလွှဲပေး','Ownership transferred')+' '+qty(g.ownershipOut):''} ${t('ပိဿာ','viss')}</td></tr>`:''}`).join('');
  return `<div class="sl2-metrics">${metric(t('ကာလအဖွင့်','Opening'),'opening')}${metric(t('ကုန်အဝင်','Physical in'),'ins')}${metric(t('ကုန်အထွက်','Physical out'),'outs')}${metric(t('ကာလအပိတ်','Closing'),'closing')}</div><p class="sl2-help">${t('အပိတ် = အဖွင့် + အဝင် − အထွက် ± ချိန်ညှိမှု။ ဂိုဒေါင် / ပိုင်ဆိုင်မှု ရွေးထားလျှင် သက်ဆိုင်ရာ အလွှဲအပြောင်းပါ ထည့်တွက်ပါသည်။','Closing = opening + physical in − physical out ± adjustments, including internal transfers applicable to the selected warehouse or owner.')}</p><div class="table-wrap sl2-scroll"><table class="sl2-summary-table"><thead><tr>${[t('ကုန်ပစ္စည်း','Product'),t('အဖွင့်','Opening'),t('အဝင်','Physical in'),t('အထွက်','Physical out'),t('ချိန်ညှိ ±','Adjustment ±'),t('အပိတ်','Closing'),''].map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${rows||`<tr><td colspan="7">${t('ရွေးထားသောကာလအတွက် ကုန်စာရင်း မရှိပါ။','No stock records for this selection.')}</td></tr>`}</tbody></table></div>`;
 }
 function details(m){
  const pages=Math.max(1,Math.ceil(m.details.length/30));ui.page=Math.min(ui.page,pages);const start=(ui.page-1)*30;
  const rows=m.details.slice(start,start+30).map((e,i)=>`<tr><td><strong>${esc(shortDate(e.date))}</strong><small>${esc(stamp(e.recordedAt))}</small></td><td>${badge(e)}<strong class="sl2-product">${esc(e.product)}</strong><small>${esc(e.ref||'—')}</small><small class="sl2-mobile-quantity">${qty(e.qty)} ${t('ပိဿာ','viss')}${known(e.bags)?' · '+qty(e.bags)+' '+t('အိတ်','bags'):''}</small></td><td><strong>${esc(e.party||ownerName(e.owner||e.fromOwner))}</strong><small>${esc(e.kind==='transfer'?whName(e.fromWh)+' → '+whName(e.toWh):e.warehouseName||whName(e.warehouse))}</small><small>${esc(e.sourceRef||e.batch||'—')}</small></td><td>${known(e.bags)?qty(e.bags)+' '+t('အိတ်','bags'):t('မမှတ်ထား','Not recorded')}${e.packageViss?`<small>${qty(e.packageViss)} ${t('ပိဿာ / အိတ်','viss / bag')}</small>`:''}</td><td class="sl2-in">${e.effect.ins?qty(e.effect.ins):'—'}</td><td>${e.effect.outs?qty(e.effect.outs):'—'}</td><td>${e.kind==='adjust'?(e.effect.adjust>0?'+':'')+qty(e.effect.adjust):['transfer','hold','purchase'].includes(e.kind)?(e.effect.delta>0?'+':'')+qty(e.effect.delta):'—'}${['transfer','hold','purchase','pack'].includes(e.kind)?`<small>${qty(e.qty)} ${t('ပိဿာ လုပ်ဆောင်မှု','viss handled')}</small>`:''}</td><td data-label="${t('ပြီးနောက်လက်ကျန်','Balance after')}"><strong>${qty(e.balance)}</strong></td><td><button type="button" class="btn btn-secondary btn-sm" onclick="stockLedgerDetail2(${start+i})">${t('ကြည့်မယ်','View')}</button></td></tr>`).join('');
  return `<p class="sl2-help">${t('နောက်ဆုံးမှတ်တမ်းကို အပေါ်တွင် ပြထားသည်။ လက်ကျန်သည် ကုန်တစ်မျိုးချင်းအလိုက် ဖြစ်သည်။ တစ်ရက်တည်း အစဉ်မသိသော မှတ်တမ်းများတွင် တစ်ကြိမ်ပြီးနောက်လက်ကျန်ကို — ဖြင့် ပြထားသည်။','Newest records appear first. Running balances are per product. A dash is shown where same-day record order cannot be established.')}</p><div class="table-wrap sl2-scroll"><table class="sl2-history-table"><thead><tr>${[t('ရက် / မှတ်တမ်းချိန်','Date / recorded time'),t('လုပ်ဆောင်ချက် / ကုန်','Activity / product'),t('သက်ဆိုင်သူ / ဂိုဒေါင် / အသုတ်','Party / warehouse / lot'),t('အိတ်','Bags'),t('အဝင်','Physical in'),t('အထွက်','Physical out'),t('အခြားပြောင်းလဲမှု ±','Other change ±'),t('ပြီးနောက်လက်ကျန်','Balance after'),t('အသေးစိတ်','Details')].map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${rows||`<tr><td colspan="9">${t('ရွေးထားသောကာလအတွက် လှုပ်ရှားမှု မရှိပါ။','No movements for this selection.')}</td></tr>`}</tbody></table></div><div class="sl2-pagination"><span>${m.details.length} ${t('မှတ်တမ်း','records')} · ${ui.page} / ${pages}</span><button class="btn btn-secondary btn-sm" ${ui.page===1?'disabled':''} onclick="stockLedgerPage2(-1)">${t('ရှေ့','Previous')}</button><button class="btn btn-secondary btn-sm" ${ui.page===pages?'disabled':''} onclick="stockLedgerPage2(1)">${t('နောက်','Next')}</button></div>`;
 }
 function mount(){
  const root=$('inventoryBody');if(!root)return;model=project();
  root.innerHTML=`<section class="sl2-shell"><div class="sl2-heading"><div><h2>${t('ကုန်လယ်ဂျာ','Stock ledger')}</h2><p>${t('ကုန်အဝင်၊ အထွက်နှင့် ဆက်စပ်လှုပ်ရှားမှုကို တစ်နေရာတည်းတွင် စစ်ပါ။','Review physical stock and its related movements in one place.')}</p></div></div>${filters()}<div class="sl2-tabs" role="group" aria-label="${t('ကုန်လယ်ဂျာ ကြည့်ရှုရန်','Ledger views')}">${[['summary',t('အကျဉ်းချုပ်','Summary')],['details',t('အသေးစိတ်မှတ်တမ်း','Detailed history')]].map(([k,l])=>`<button type="button" class="tab ${ui.tab===k?'active':''}" aria-pressed="${ui.tab===k}" onclick="stockLedgerTab2('${k}')">${l}</button>`).join('')}</div>${model.missing?`<div class="sl2-notice" role="status">${t('အချို့ယခင်မှတ်တမ်းများတွင် အလေးချိန်၊ ရက်စွဲ၊ ဂိုဒေါင် သို့မဟုတ် ပိုင်ဆိုင်မှု မပြည့်စုံပါ။ အတိအကျ မတွက်နိုင်သော လက်ကျန်ကို — ဖြင့် ပြထားပါသည်။ ကုန်လက်ကျန် → ဂိုဒေါင် / အသုတ်တွင် လက်ရှိလက်ကျန်ကို တိုက်စစ်နိုင်ပါသည်။','Some historical weights, dates, warehouses or ownership details are missing. Balances that cannot be established are shown as —. Compare current stock under Inventory → Warehouse / Lots.')}</div>`:''}${ui.tab==='summary'?summary(model):details(model)}<details class="sl2-guide"><summary>${t('စာရင်းဖတ်ပုံ','How to read this ledger')}</summary><p>${t('ကုန်လက်ခံနှင့် တကယ်ထုတ်ပေးမှုကိုသာ မြေပြင်အဝင် / အထွက်တွင် တွက်ပါသည်။ ထုပ်ပိုးခြင်းက ပမာဏထပ်မတိုးပါ။ သိမ်းထပ်အရောင်းနှင့် ဈေးဖြတ်အဝယ်က ပိုင်ရှင်ပြောင်းခြင်းဖြစ်ပါသည်။ ဂိုဒေါင်အားလုံးကြည့်လျှင် ဂိုဒေါင်ရွှေ့မှုမှာ စုစုပေါင်း မတိုးမလျော့ပါ။','Only actual receiving and dispatch count as physical in/out. Packing does not add stock. Held sales and purchases transfer ownership. Warehouse transfers do not change the all-warehouse total.')}</p><p>${t('အိတ်ကို သက်ဆိုင်ရာအကြိမ်တွင် မှတ်ထားသော အရေအတွက်အတိုင်း ပြပါသည်။ အကြမ်းအိတ်နှင့် ထုပ်ပိုးအိတ်ကို တိုက်ရိုက်ပေါင်း၍ အိတ်လက်ကျန် မတွက်ပါ။','Bag counts use the recorded event. Raw and packed bags are not summed into a misleading bag balance.')}</p></details></section>`;
 }
 window.stockLedgerApply2=function(){
  const from=$('sl2From')?.value,to=$('sl2To')?.value;
  if(!from||!to||from>to){const el=$('sl2Error');if(el){el.hidden=false;el.textContent=t('စရက်နှင့် ဆုံးရက်ကို မှန်ကန်စွာ ရွေးပါ။','Choose a valid start and end date.');}return;}
  Object.assign(ui,{from,to,product:$('sl2Product').value,warehouse:$('sl2Warehouse').value,owner:$('sl2Owner').value,page:1});mount();
 };
 window.stockLedgerPreset2=function(k){const es=events(),dates=es.map(e=>e.date).filter(Boolean).concat(openingRows().map(x=>x.date).filter(Boolean));ui.from=k==='today'?today():k==='month'?today().slice(0,8)+'01':dates.sort()[0]||today();ui.to=today();ui.page=1;mount();};
 window.stockLedgerClear2=function(){Object.assign(ui,{from:today().slice(0,8)+'01',to:today(),product:'',warehouse:'',owner:'',page:1});mount();};
 window.stockLedgerTab2=function(tab){if(!['summary','details'].includes(tab))return;ui.tab=tab;ui.page=1;mount();};
 window.stockLedgerProduct2=function(product){ui.product=product;ui.tab='details';ui.page=1;mount();};
 window.stockLedgerPage2=function(n){ui.page=Math.max(1,ui.page+n);mount();};
 const info=(label,value)=>`<div><span>${label}</span><strong>${esc(value===null||value===undefined||value===''?'—':value)}</strong></div>`;
 window.stockLedgerDetail2=function(index){
  const e=model?.details[index];if(!e)return;backScroll=window.scrollY;
  const body=`<section class="sl2-detail-grid">${info(t('လုပ်ဆောင်ချက်','Activity'),labels()[e.kind])}${info(t('ဘောက်ချာ / မှတ်တမ်း','Reference'),e.ref)}${info(t('ရက်စွဲ','Date'),shortDate(e.date))}${info(t('မှတ်တမ်းချိန် (မြန်မာစံတော်ချိန်)','Recorded time (Myanmar)'),stamp(e.recordedAt))}${info(t('ကုန်ပစ္စည်း','Product'),e.product)}${info(t('သက်ဆိုင်သူ','Related party'),e.party)}${info(t('ကုန်ပိုင်ဆိုင်မှု','Ownership'),e.fromOwner?ownerName(e.fromOwner)+' → '+ownerName(e.toOwner):ownerName(e.owner))}${info(t('မူလကုန်သည်','Original trader'),e.trader||state.receipts.find(r=>r.id===e.receiptId)?.name||'')}${info(t('ဂိုဒေါင်','Warehouse'),e.kind==='transfer'?whName(e.fromWh)+' → '+whName(e.toWh):e.warehouseName||whName(e.warehouse))}${info(t('မူလကုန်လက်ခံအမှတ်','Receiving reference'),e.sourceRef||state.receipts.find(r=>r.id===e.receiptId)?.voucherNo||'')}${info(t('မူလအသုတ်','Source lot'),e.batch)}${info(t('ယခုအကြိမ်ပမာဏ','Event quantity'),(e.unknownQty?'—':qty(e.qty))+' '+t('ပိဿာ','viss'))}${info(t('ယခုအကြိမ်အိတ်','Event bags'),known(e.bags)?qty(e.bags)+' '+t('အိတ်','bags'):t('မမှတ်ထား','Not recorded'))}${info(t('တစ်အိတ်ဝင်','Viss per bag'),e.packageViss?qty(e.packageViss):'—')}${info(t('ကုန်အဝင်','Physical in'),qty(e.effect.ins))}${info(t('ကုန်အထွက်','Physical out'),qty(e.effect.outs))}${info(t('ရွေးထားသောစာရင်း ပြီးနောက်လက်ကျန်','Balance after in selected scope'),qty(e.balance))}${info(t('ကားနံပါတ်','Vehicle number'),e.car)}${info(t('လက်ခံယူသူ','Collector'),e.collector)}${info(t('မှတ်ချက်','Note'),e.note)}</section>${e.orderUnknown?`<p class="sl2-notice">${t('တစ်ရက်တည်းမှတ်တမ်းများ၏ အစဉ်မသိသဖြင့် တစ်ကြိမ်ပြီးနောက်လက်ကျန်ကို မခန့်မှန်းထားပါ။','Same-day sequence is unknown, so an event balance has not been inferred.')}</p>`:''}`;
  const link=(key,label)=>`<button type="button" class="btn btn-secondary" onclick="stockLedgerSource2('${key}',${index})">${label}</button>`;
  const links=(e.receiptId?link('receipt',t('ကုန်လက်ခံအသေးစိတ်','Receiving details')):'')+(e.saleId?link('sale',t('အရောင်းအသေးစိတ်','Sale details')):'')+(e.packIndex!==undefined?link('pack',t('ထုပ်ပိုးအသေးစိတ်','Packing details')):'')+(e.transferIndex!==undefined?link('transfer',t('ရွှေ့ပြောင်းအသေးစိတ်','Transfer details')):'');
  openModal(t('ကုန်လယ်ဂျာ အသေးစိတ်','Stock ledger details'),e.product+' · '+e.ref,body,`<button type="button" class="btn btn-primary" onclick="backStockLedger2()">${t('ကုန်လယ်ဂျာသို့ ပြန်မယ်','Back to stock ledger')}</button>`+links,true);
 };
 window.stockLedgerSource2=function(kind,index){const e=model?.details[index];if(!e)return;
  if(kind==='receipt')receiptDetail4(e.receiptId);if(kind==='sale')saleDetail4(e.saleId);if(kind==='pack')openPackagingHistoryDetail2(e.packIndex);if(kind==='transfer')openTransferDetail2(e.transferIndex);
  const footer=document.querySelector('#main .work-page .modal-footer');if(footer&&!footer.querySelector('[data-ledger-back]'))footer.insertAdjacentHTML('afterbegin',`<button type="button" class="btn btn-secondary" data-ledger-back onclick="backStockLedger2()">${t('ကုန်လယ်ဂျာသို့ ပြန်မယ်','Back to stock ledger')}</button>`);
 };
 window.backStockLedger2=function(){workDirty=false;closeModal();navigate('inventory');invTab='ledger';render();window.scrollTo(0,backScroll);};
 // Capture metadata for future events at the existing successful persistence
 // boundary. Never add a movement, dispatch, payment, or inferred old timestamp.
 let seen=new Set(events().map(e=>e.id));const persist=save;
 save=function(...args){
  const es=events(),fresh=es.filter(e=>!seen.has(e.id));
  if(fresh.length){state.stockLedgerMeta2??={schema:1,events:{}};state.stockLedgerMeta2.events??={};const recordedAt=new Date().toISOString();
   for(const e of fresh){if(state.stockLedgerMeta2.events[e.id])continue;
    const m={recordedAt:e.recordedAt||recordedAt,role:state.role};
    if(e.kind==='purchase')m.lots=purchaseContext?.get(e.receiptId)||[];
    state.stockLedgerMeta2.events[e.id]=m;
   }
  }
  const result=persist.apply(this,args);seen=new Set(events().map(e=>e.id));return result;
 };
 const commit=commitVoucher4;
 commitVoucher4=function(...args){
  const previous=purchaseContext;
  if(v4Kind==='purchase')purchaseContext=new Map(arr(state.receipts).filter(r=>r.status!=='purchased').map(r=>[r.id,arr(state.lots).filter(l=>l.receiptId===r.id&&l.owner==='supplier'&&num(l.qty)>0).map(l=>({warehouse:l.warehouse,qty:num(l.qty)}))]));
  try{return commit.apply(this,args);}finally{purchaseContext=previous;}
 };
 const inventory=inventoryPage,body=renderInventoryBody;
 inventoryPage=function(...args){const html=inventory.apply(this,args);if(invTab!=='ledger')return html;const tpl=document.createElement('template');tpl.innerHTML=html;tpl.content.querySelectorAll('.stock-ledger-range83').forEach(x=>x.remove());return tpl.innerHTML;};
 renderInventoryBody=function(...args){if(invTab==='ledger')return mount();return body.apply(this,args);};
 window.stockLedger2={data:()=>project(),filters:ui};
 document.addEventListener('click',e=>{if(e.target.closest('#uiLanguageSwitch2 [data-language]'))setTimeout(()=>{if(page==='inventory'&&invTab==='ledger'&&!workView)mount();},0);});
 if(page==='inventory'&&invTab==='ledger'&&!workView)render();
})();

