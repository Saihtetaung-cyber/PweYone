
/* Version 2: purchase the entire unsold residual of a partially sold receiving voucher.
 * Reuse native charge, loan, payment, lot-conversion and audit engines once.
 * The original receiving quantity is retained in remainingPurchase2.original; qty is
 * the actual purchased quantity for existing purchase accounting/report consumers.
 * Receiving-only views use receiptReceivedQuantity2, without creating a second receipt.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),eps=.000001,n=v=>Number.isFinite(Number(v))?Number(v):0;
 const clone=v=>JSON.parse(JSON.stringify(v));
 const weight=v=>v===null?'—':vissText37(v)+' ပိဿာ';
 const fields=['qty','bagType','bags','rawBags','packageCount','packageViss','weightKnown','date','no','voucherNo','warehouse','car','note'];
 let session=null,nativeContext=null,opening=null,sequence=0;
 window.isRemainingPurchaseNative2=r=>!!r&&!!((nativeContext?.ids.has(r.id))||(opening?.has(r.id)));
 const originalQty=r=>receiptReceivedQuantity2(r);
 const related=id=>voucherRecords4('purchase',id);
 function entries(rs){return rs.map(r=>{
  const i=receiptSalePurchaseInfo2(r.id),lots=state.lots.filter(l=>l.receiptId===r.id);
  const current=lots.filter(l=>l.owner==='supplier'),qty=current.reduce((sum,l)=>sum+n(l.qty),0);
  const expected=typeof adjustmentExpectedQty2==='function'?adjustmentExpectedQty2(r):n(r.qty);
  const sold=i?.sold||0;
  const valid=r.status!=='purchased'&&r.weightKnown!==false&&n(r.qty)>0&&qty>eps&&
   current.every(l=>l.weightKnown!==false&&Number.isFinite(Number(l.qty))&&n(l.qty)>=0)&&lots.every(l=>l.owner==='supplier'||n(l.qty)<=eps)&&Math.abs(qty+sold-expected)<.001;
  return {r,lots:current,qty,sold,expected,valid};
 });}
 function partialVoucher(rs){return rs.some(r=>r.remainingPurchase2)||rs.some(r=>r.status!=='purchased'&&receiptSalePurchaseInfo2(r.id)?.sales.length);}
 function ready(rs){return entries(rs).every(e=>e.r.status==='purchased'||e.valid||(e.sold>eps&&e.qty<=eps&&e.r.weightKnown!==false));}
 function fingerprint(e){return JSON.stringify({receipt:e.r.id,status:e.r.status,qty:e.r.qty,sold:e.sold,
  sales:receiptSalePurchaseInfo2(e.r.id).sales.map(s=>[s.id,s.qty,s.sourceReceiptId,s.sourceLot]).sort(),
  lots:e.lots.map(l=>[l.id,l.qty,l.bags,l.packageCount,l.packageViss,l.warehouse,l.owner,l.stockForm,l.weightKnown]).sort()});}
 function original(r){const o={};for(const k of fields)if(Object.hasOwn(r,k))o[k]=r[k];return clone(o);}
 function receivingShape(r,o){for(const k of fields.filter(k=>k!=='qty')){if(Object.hasOwn(o,k))r[k]=o[k];else delete r[k];}}
 function view(e){return {...e.r,qty:e.qty,...(e.sold>eps?{bagType:'weight',bags:0,rawBags:0,packageCount:0,packageViss:0}:{}),weightKnown:true};}
 function traderSales(r){const ids=r.remainingPurchase2?.sourceSaleIds;return ids?state.sales.filter(s=>ids.includes(s.id)):receiptSalePurchaseInfo2(r.id).sales.filter(s=>!s.sourceOwner||s.sourceOwner==='supplier');}
 function traderGroups(rs){const map=new Map();for(const r of rs)for(const s of traderSales(r)){const ref=s.voucherNo||s.no||s.id,key=JSON.stringify([r.partnerId,ref]);if(!map.has(key))map.set(key,{partner:r.partnerId,ref,sales:[]});if(!map.get(key).sales.some(x=>x.id===s.id))map.get(key).sales.push(s);}return [...map.values()];}
 function summary(rs,showLinks=true){
  const box=document.createElement('section');box.className='remaining2-summary';box.innerHTML='<h3>ကုန်လက်ခံ၊ အရောင်းနှင့် အဝယ်</h3>';
  for(const r of rs){const e=entries([r])[0],p=r.remainingPurchase2;
   const row=document.createElement('div');row.className='remaining2-line';
   row.innerHTML='<strong>'+E(r.product)+'</strong><div class="remaining2-metrics"><div><span>မူလလက်ခံပမာဏ</span><strong>'+weight((p?.original||r).weightKnown===false?null:originalQty(r))+'</strong></div><div><span>ကုန်သည်ပိုင်မှ ရောင်းပြီး</span><strong>'+weight(p?.soldQty??e.sold)+'</strong></div><div><span>'+(p?'လက်ကျန်မှ ဝယ်ယူပြီး':!e.valid&&(e.qty>eps||r.weightKnown===false)?'လက်ကျန် စစ်ဆေးရန်':'ယခုဝယ်ယူနိုင်သော လက်ကျန်')+'</span><strong>'+weight(p?.qty??(e.lots.some(l=>l.weightKnown===false)?null:e.qty))+'</strong></div></div>';
   box.append(row);
  }
  const groups=traderGroups(rs);if(showLinks&&groups.length){const details=document.createElement('details');details.className='remaining2-sales';details.innerHTML='<summary>အရောင်းချိတ်ဆက်မှု ကြည့်မယ် ('+groups.length+')</summary>';for(const g of groups){const line=document.createElement('div');line.className='remaining2-sale';line.innerHTML='<span>'+E(g.ref)+' · '+weight(g.sales.reduce((sum,s)=>sum+n(s.qty),0))+'</span>';line.append(button('ကုန်သည်ငွေရှင်းသို့',()=>openTraderList74(g.partner,g.ref)));details.append(line);}box.append(details);}
  const help=document.createElement('p');help.textContent='ရောင်းပြီးသားကုန်ကို အဝယ်ထဲ ထပ်မထည့်ပါ။ လက်ကျန်ကို ဝယ်ယူခြင်းသည် ပိုင်ဆိုင်မှုပြောင်းခြင်းသာ ဖြစ်ပြီး ကုန်ပမာဏ ထပ်မတိုးပါ။';box.append(help);return box;
 }
 function button(label,action,primary=false){const b=document.createElement('button');b.type='button';b.className='btn '+(primary?'btn-primary':'btn-secondary')+' remaining2-action';b.textContent=label;b.addEventListener('click',action);return b;}
 function buyButton(id){return button('လက်ကျန်ကို ဈေးဖြတ်ဝယ်မယ်',()=>purchaseRemainingReceipt2(id),true);}
 function canBuy(rs){return partialVoucher(rs)&&ready(rs)&&entries(rs).some(e=>e.valid);}
 window.purchaseRemainingReceipt2=function(id){
  if(!guardWork())return;const rs=related(id),all=entries(rs),chosen=all.filter(e=>e.valid);
  if(!partialVoucher(rs)||!chosen.length||!ready(rs))return previousPurchase(id);
  session={token:'remaining2-'+(++sequence),sourceId:id,sourceIds:rs.map(r=>r.id),items:chosen.map(e=>({id:e.r.id,qty:e.qty,sold:e.sold,expected:e.expected,original:original(e.r),fingerprint:fingerprint(e)}))};
  v4Kind='purchase';v4ReceiptIds=chosen.map(e=>e.r.id);opening=new Set(v4ReceiptIds);
  try{voucherForm4(chosen.map(view));}finally{opening=null;}
  const form=$('voucher4');if(!form)return;form.dataset.remainingPurchase2=session.token;form.prepend(summary(rs,false));
  form.closest('.work-page')?.classList.add('remaining2-page');
  const intro=form.querySelector('.v55-intro strong');if(intro)intro.textContent='လက်ကျန်ကို ဈေးဖြတ်ဝယ်ယူမည်';
  const introHelp=form.querySelector('.v55-intro p');if(introHelp)introHelp.textContent='မရောင်းရသေးသော လက်ကျန်ပမာဏအတွက်သာ ဈေးနှင့် ပေါင်းနုတ်ငွေများကို တွက်ပါမည်။';
  const head=form.closest('.work-page')?.querySelector('.modal-head h2');if(head)head.textContent='လက်ကျန်ကို ဈေးဖြတ်ဝယ်ယူမည်';
  for(const el of form.querySelectorAll('#voucherLines4 .req-line')){const qty=$('vq'+el.dataset.i);if(qty){qty.readOnly=true;qty.closest('.field')?.querySelector('label')?.replaceChildren(document.createTextNode('ဝယ်ယူမည့် လက်ကျန်ပိဿာ'));const bag=$('vPurchaseBag47'+el.dataset.i),count=$('vPurchaseCount55'+el.dataset.i);if(bag&&n(bag.value)>n(qty.value))bag.value=qty.value;if(count&&(!n(count.value)||n(count.value)*n(bag?.value)>n(qty.value)+eps))count.value=String(Math.max(1,Math.floor((n(qty.value)+eps)/n(bag?.value))));}}
  calcVoucher4();
 };
 const previousPurchase=purchase4;
 purchase4=function(id){const rs=related(id);if(canBuy(rs))return purchaseRemainingReceipt2(id);session=null;return previousPurchase.apply(this,arguments);};
 const previousPricing=openPricing;
 openPricing=function(id){if(canBuy(related(id)))return purchaseRemainingReceipt2(id);session=null;return previousPricing.apply(this,arguments);};
 const previousRead=readVoucherLines4;
 readVoucherLines4=function(){
  const rows=previousRead.apply(this,arguments);if(!session||nativeContext||v4Kind!=='purchase')return rows;
  return rows.map(x=>{const item=session.items.find(e=>e.id===x.r?.id);return item&&item.sold>eps?{...x,r:{...x.r,bagType:'weight',bags:0,rawBags:0,packageCount:0,packageViss:0,qty:item.qty}}:x;});
 };
 const previousDelta=adjustmentReceiptDelta2;
 adjustmentReceiptDelta2=function(r){return nativeContext?.ids.has(r?.id)?0:previousDelta.apply(this,arguments);};
 function finalize(){
  if(!nativeContext||!nativeContext.items.every(e=>state.receipts.find(r=>r.id===e.id)?.status==='purchased'))return false;
  for(const item of nativeContext.items){const r=state.receipts.find(r=>r.id===item.id);
   receivingShape(r,item.original);r.qty=item.qty;r.weightKnown=true;
   if(!r.remainingPurchase2)r.remainingPurchase2={schema:1,recordedAt:nativeContext.recordedAt,qty:item.qty,soldQty:item.sold,
    original:item.original,expectedQty:item.expected,sourceSaleIds:nativeContext.saleIds[item.id],sourceLots:nativeContext.lots[item.id]};
  }
  nativeContext.posted=true;return true;
 }
 const previousSave=save;
 save=function(){
  // Native validations may initialize view defaults; rejected transactions never persist these.
  if(nativeContext&&!finalize())return;
  return previousSave.apply(this,arguments);
 };
 const previousCommit=commitVoucher4;
 commitVoucher4=function(){
  const form=$('voucher4');if(v4Kind!=='purchase'||!session||form?.dataset.remainingPurchase2!==session.token)return previousCommit.apply(this,arguments);
  if(!guardWork())return;
  const source=related(session.sourceId),current=entries(source),rows=readVoucherLines4(),ids=rows.map(x=>x.r?.id);
  if(!ready(source)||source.length!==session.sourceIds.length||source.some(r=>!session.sourceIds.includes(r.id))||current.filter(e=>e.valid).some(e=>!session.items.some(x=>x.id===e.r.id)))return error('ဖောင်ဖွင့်ပြီးနောက် ကုန်လက်ကျန် ပြောင်းသွားပါသည်။ မသိမ်းရသေးပါ။ ဖောင်ကို အသစ်ပြန်ဖွင့်ပါ။');
  if(ids.length!==session.items.length||new Set(ids).size!==ids.length||session.items.some(item=>!ids.includes(item.id)))return error('ဝယ်ယူမည့် ကုန်လိုင်းများကို ပြန်စစ်ပါ။ ဖောင်ကို အသစ်ပြန်ဖွင့်ပါ။');
  for(const item of session.items){const e=current.find(e=>e.r.id===item.id),row=rows.find(x=>x.r?.id===item.id);
   if(!e?.valid||fingerprint(e)!==item.fingerprint||Math.abs(n(row?.qty)-item.qty)>eps)return error('ဖောင်ဖွင့်ပြီးနောက် ကုန်လက်ကျန် ပြောင်းသွားပါသည်။ မသိမ်းရသေးပါ။ ဖောင်ကို အသစ်ပြန်ဖွင့်ပါ။');
  }
  const before=clone(state),active=session;
  nativeContext={items:active.items,ids:new Set(active.items.map(e=>e.id)),recordedAt:new Date().toISOString(),saleIds:{},lots:{},posted:false};
  for(const item of active.items){const e=current.find(e=>e.r.id===item.id);nativeContext.saleIds[item.id]=receiptSalePurchaseInfo2(item.id).sales.map(s=>s.id);nativeContext.lots[item.id]=clone(e.lots.map(l=>({id:l.id,qty:l.qty,bags:l.bags,warehouse:l.warehouse,packageViss:l.packageViss,stockForm:l.stockForm})));
   e.r.qty=item.qty;if(item.sold>eps)Object.assign(e.r,{bagType:'weight',bags:0,rawBags:0,packageCount:0,packageViss:0});
  }
  let ok=false;
  try{previousCommit.apply(this,arguments);ok=finalize();if(ok){previousSave();session=null;}}
  catch(e){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);previousSave();error('အဝယ်ကို မသိမ်းနိုင်သေးပါ။ ပြန်စစ်ပြီး ထပ်သိမ်းပါ။');throw e;}
  finally{if(!ok){for(const k of Object.keys(state))delete state[k];Object.assign(state,before);if(nativeContext?.posted)previousSave();}nativeContext=null;}
  if(ok){workDirty=false;receiptDetail4(active.sourceId);toast('လက်ကျန်ပမာဏအတွက်သာ ဝယ်ယူပြီးပါပြီ။');}
 };
 // Add the two operational choices to the existing receiving list/details.
 function actions(root,id,rs){
  root.querySelectorAll('.remaining2-action').forEach(b=>b.remove());
  const disabled=root.querySelector('.sold2-disabled');if(canBuy(rs)){const b=buyButton(id);if(disabled)disabled.replaceWith(b);else root.append(b);}
  const left=entries(rs).filter(e=>e.valid);if(partialVoucher(rs)&&left.length)root.append(button('လက်ကျန်ကို ရောင်းမယ်',()=>sellRemainingReceipt2(id)));
  const purchased=rs.find(r=>r.status==='purchased'&&due(r)>0);if(purchased&&!root.querySelector('[onclick^="payVoucher4("]'))root.append(button('အဝယ်ငွေ ပေးချေမယ်',()=>payVoucher4('purchase',purchased.id)));
  if(traderGroups(rs).length&&!root.querySelector('.sold2-trader'))root.append(button('ကုန်သည်ငွေရှင်းသို့',()=>{const groups=traderGroups(rs);if(groups.length===1)return openTraderList74(groups[0].partner,groups[0].ref);receiptDetail4(id);document.querySelectorAll('.remaining2-sales').forEach(e=>e.open=true);}));
 }
 const previousRows=renderReceiptRows;
 renderReceiptRows=function(){const result=previousRows.apply(this,arguments),root=$('receiptRows');if(!root)return result;
  root.querySelectorAll('article').forEach(card=>{const id=card.querySelector('[onclick^="receiptDetail4("]')?.getAttribute('onclick')?.match(/^receiptDetail4\('([^']+)'/)?.[1];if(!id)return;const rs=related(id);
   if(!partialVoucher(rs)&&!rs.some(r=>r.remainingPurchase2))return;
   card.querySelectorAll('.sold2-summary').forEach(e=>e.remove());card.querySelector('.req-chip-row')?.after(summary(rs));
   const badge=card.querySelector('.pill');if(badge&&rs.some(r=>r.remainingPurchase2))badge.textContent='ရောင်းပေး / လက်ကျန်ဝယ်ယူပြီး';
   const action=card.querySelector('[onclick^="receiptDetail4("]')?.parentElement;if(action)actions(action,id,rs);
  });return result;};
 const previousDetail=receiptDetail4;
 receiptDetail4=function(id){const result=previousDetail.apply(this,arguments),rs=related(id);if(!partialVoucher(rs)&&!rs.some(r=>r.remainingPurchase2))return result;
  const body=document.querySelector('#main .work-page .modal-body');if(body){body.querySelectorAll('.sold2-summary,.remaining2-summary').forEach(e=>e.remove());body.prepend(summary(rs));
   const table=body.querySelector('table');if(table)Array.from(table.querySelectorAll('tbody tr')).forEach((tr,i)=>{const r=rs[i];if(r?.remainingPurchase2){const cells=tr.querySelectorAll('td');if(cells.length>=6){cells[5].textContent='ရောင်းပေး / ပွဲရုံဝယ်ယူ';if(r.bagType==='raw')cells[2].textContent=N(r.remainingPurchase2.original.rawBags??r.remainingPurchase2.original.bags??0)+' မူလ အကြမ်းအိတ်';}}});
  }
  const footer=document.querySelector('#main .work-page .modal-footer');if(footer)actions(footer,id,rs);return result;};
 window.sellRemainingReceipt2=function(id){
  if(!guardWork())return;const eligible=entries(related(id)).filter(e=>e.valid),lots=eligible.flatMap(e=>e.lots).filter(l=>n(l.qty)>eps);if(!lots.length)return error('ရောင်းချနိုင်သော ကုန်သည်ပိုင်လက်ကျန် မရှိပါ။');
  session=null;startSale();const owner=$('fSaleOwner60');if(owner){owner.value='supplier';saleOwnershipChanged60();}
  const lot=lots[0],r=eligible.find(e=>e.lots.some(l=>l.id===lot.id)).r;
  const choose=(id,val,handler)=>{const el=$(id);if(!el||![...el.options].some(o=>o.value===val))return false;el.value=val;handler(0);return true;};
  if(choose('vsp590',lot.product,saleProductChanged43)&&choose('vso430',r.partnerId,saleOriginChanged43)&&choose('vsw590',lot.warehouse,saleWarehouseChanged43)&&choose('vl0',lot.id,saleBatchChanged43)){workDirty=true;calcVoucher4();$('vq0')?.focus();}
  else saleSourcePicker76('ready',0);
 };
 // Purchase print uses purchased quantity; the original receiving quantity remains explicit.
 const previousPrint=printVoucher4;
 printVoucher4=function(kind,id){const rs=kind==='purchase'?related(id):[];if(kind!=='purchase'||!rs.some(r=>r.remainingPurchase2))return previousPrint.apply(this,arguments);
  const bought=rs.filter(r=>r.status==='purchased'),first=bought[0];if(!first)return;
  const lines=table4(['ကုန်','မူလလက်ခံပိဿာ','ရောင်းပေးပြီးပိဿာ','ယခုဝယ်ယူပိဿာ','ကုန်ဖိုး'],bought.map(r=>'<tr><td>'+E(r.product)+'</td><td>'+vissText37(originalQty(r))+'</td><td>'+vissText37(r.remainingPurchase2?.soldQty||0)+'</td><td>'+vissText37(r.qty)+'</td><td>'+cashText(gross(r))+'</td></tr>'));
  const anchor=bought.find(r=>r.charges4),detail=anchor?chargesSummary4(anchor.charges4).replaceAll('<details','<details open'):'';
  printDocument('လက်ကျန် ဈေးဖြတ်အဝယ်ဘောက်ချာ',first.purchaseNo||first.voucherNo||first.no,'<p>'+E(first.name)+' · '+E(first.purchaseDate||first.date)+'</p><p>မူလကုန်ဝင် — '+E(first.voucherNo||first.no)+'</p>'+(first.car?'<p>ကားနံပါတ် — '+E(first.car)+'</p>':'')+lines+detail+row4('အသားတင် ပေးရန်',cashText(bought.reduce((s,r)=>s+purchaseNet(r),0)))+row4('ပေးရန်ကျန်',cashText(bought.reduce((s,r)=>s+due(r),0))));
 };
 const previousPricePrint=printPriceVoucher;
 printPriceVoucher=function(id){if(related(id).some(r=>r.remainingPurchase2))return printVoucher4('purchase',id);return previousPricePrint.apply(this,arguments);};
 if(page==='receipts'&&!workView)renderReceiptRows();
 document.title='ပွဲရုံ · Version 2 · Remaining Stock Purchase Update';
})();

