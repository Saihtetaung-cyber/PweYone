
/* Version 2: block purchasing an original receiving voucher after its goods were sold.
 * All quantities are derived from exact persisted receipt/lot links, including held sales.
 * This patch posts no stock, cash, payable, settlement or replacement receiving record.
 * Partial sales deliberately block the original whole-voucher purchase operation as well.
 */
(function(){
 'use strict';
 const eps=.000001,$=id=>document.getElementById(id);
 const n=v=>Number.isFinite(Number(v))?Number(v):0;
 const known=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
 const weight=v=>v===null?'—':vissText37(v)+' ပိဿာ';
 const voucher=r=>r.voucherNo||r.no||r.id;
 const message='ရောင်းထားသော ကုန်လိုင်းပါသဖြင့် မူလဘောက်ချာအပြည့်ကို ဈေးဖြတ်ဝယ်ယူ၍မရပါ။ ကုန်သည်ငွေရှင်းကို ဆက်လုပ်ပါ။';
 const stockMessage='မူလလက်ခံပမာဏနှင့် လက်ရှိကုန်သည်ပိုင်လက်ကျန် မကိုက်ပါ။ အသုတ်အသုံးပြုမှုကို စစ်ပြီးမှ ဈေးဖြတ်ဝယ်ယူပါ။';
 function saleReceipt(s){
  // An explicit receiving ID is authoritative; display labels never identify a source.
  if(s.sourceReceiptId)return s.sourceReceiptId;
  const visited=new Set();let id=s.sourceLot||s.sourceLotId;
  while(id&&!visited.has(id)){
   visited.add(id);const l=(state.lots||[]).find(x=>x.id===id);if(!l)break;
   if(l.receiptId)return l.receiptId;
   id=l.sourcePackagingLot48||l.sourceLotId||l.sourceLot;
  }
  return '';
 }
 function info(r){
  const sales=(state.sales||[]).filter(s=>saleReceipt(s)===r.id&&n(s.qty)>eps);
  const lots=(state.lots||[]).filter(l=>l.receiptId===r.id);
  const supplierLots=lots.filter(l=>l.owner==='supplier');
  const sold=sales.reduce((sum,s)=>sum+n(s.qty),0);
  const expected=typeof adjustmentExpectedQty2==='function'?adjustmentExpectedQty2(r):n(r.qty);
  const weighed=r.weightKnown!==false&&known(r.qty)&&n(r.qty)>0;
  const remaining=supplierLots.some(l=>l.weightKnown===false)?null:supplierLots.reduce((sum,l)=>sum+Math.max(0,n(l.qty)),0);
  const mismatch=r.status!=='purchased'&&weighed&&(remaining===null||Math.abs(remaining-expected)>eps||lots.some(l=>l.owner!=='supplier'&&n(l.qty)>eps));
  return {r,sales,sold,remaining,expected,mismatch,blocked:r.status!=='purchased'&&(sales.length>0||mismatch),full:sales.length>0&&remaining!==null&&remaining<=eps};
 }
 window.receiptSalePurchaseInfo2=id=>{const r=state.receipts.find(x=>x.id===id);return r?info(r):null;};
 const records=id=>voucherRecords4('purchase',id);
 const affected=rs=>rs.map(info).filter(x=>x.blocked);
 function status(items,rs){
  if(!items.some(x=>x.sales.length))return 'အသုတ်လက်ကျန် စစ်ရန်';
  if(rs.some(r=>r.status!=='purchased'&&!items.some(x=>x.r.id===r.id)))return 'ရောင်းထားသောလိုင်း ပါသည်';
  if(items.every(x=>x.full))return 'ရောင်းပြီး';
  return 'တစ်စိတ်တစ်ပိုင်း ရောင်းပြီး';
 }
 function sourceGroups(item){
  const groups=new Map();for(const s of item.sales){const key=voucher(s);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s);}return [...groups.values()];
 }
 function linkButtons(item,rows){
  const first=rows[0],wrap=document.createElement('div');wrap.className='sold2-actions';
  const detail=document.createElement('button');detail.type='button';detail.className='btn btn-secondary';detail.textContent='အရောင်းအသေးစိတ်';detail.addEventListener('click',()=>saleDetail4(first.id));wrap.append(detail);
  if(typeof openTraderList74==='function'){
   const button=document.createElement('button');button.type='button';button.className='btn btn-secondary';button.textContent='ကုန်သည်ငွေရှင်းသို့';button.addEventListener('click',()=>openTraderList74(item.r.partnerId||first.sourceSupplierId||first.originPartnerId||'',voucher(first)));wrap.append(button);
  }
  return wrap;
 }
 function panel(rs,compact=false){
  const items=affected(rs),section=document.createElement('section');section.className='sold2-summary'+(compact?' sold2-compact':'');
  const title=document.createElement('h3');title.textContent='ကုန်အသုတ် အသုံးပြုမှု';section.append(title);
  for(const item of items){
   const line=document.createElement('div');line.className='sold2-line';line.dataset.receiptId=item.r.id;
   line.innerHTML='<div class="sold2-line-head"><strong>'+E(item.r.product)+'</strong><span>'+E(voucher(item.r))+'</span></div><div class="sold2-metrics"><div><span>မူလလက်ခံပမာဏ</span><strong>'+weight(item.r.weightKnown===false||!known(item.r.qty)||n(item.r.qty)<=0?null:n(item.r.qty))+'</strong></div><div><span>ရောင်းပြီးပမာဏ</span><strong>'+weight(item.sales.length?item.sold:null)+'</strong></div><div><span>မရောင်းရသေးသော လက်ကျန်</span><strong>'+weight(item.remaining)+'</strong></div></div>';
   if(!item.sales.length){const note=document.createElement('p');note.className='sold2-help';note.textContent='ချိတ်ဆက်ထားသော အရောင်းမှတ်တမ်း မတွေ့ပါ။ လက်ကျန်ကွာဟချက်ကို ရောင်းပြီးပမာဏအဖြစ် မတွက်ထားပါ။';line.append(note);}
   if(!compact&&item.sales.length){
    const details=document.createElement('details');details.className='sold2-links';const summary=document.createElement('summary');summary.innerHTML='<span>အရောင်းချိတ်ဆက်မှု ကြည့်မယ်</span> ('+sourceGroups(item).length+')';details.append(summary);
    for(const rows of sourceGroups(item)){
     const first=rows[0],entry=document.createElement('div');entry.className='sold2-link-row';entry.innerHTML='<div><strong>'+E(voucher(first))+'</strong><span>'+E(first.name||'—')+' · '+E(shortDate(first.date))+' · '+weight(rows.reduce((sum,s)=>sum+n(s.qty),0))+'</span></div>';entry.append(linkButtons(item,rows));details.append(entry);
    }
    line.append(details);
   }
   section.append(line);
  }
  const help=document.createElement('p');help.className='sold2-help';help.textContent=items.some(x=>x.sales.length)?message:stockMessage;section.append(help);
  if(items.some(x=>x.remaining>eps)){
   const partial=document.createElement('p');partial.className='sold2-help';partial.textContent='လက်ကျန်ကုန် ရှိသော်လည်း ဤဖောင်သည် မူလဘောက်ချာအပြည့်ကို ဝယ်ယူသည့်ပုံစံဖြစ်၍ ပိတ်ထားပါသည်။';section.append(partial);
  }
  return section;
 }
 function blockedButton(){const b=document.createElement('button');b.type='button';b.disabled=true;b.className='btn btn-secondary sold2-disabled';b.textContent='ဈေးဖြတ်ဝယ်ယူမှု ပိတ်ထားသည်';return b;}
 function traderButton(id){const b=document.createElement('button');b.type='button';b.className='btn btn-primary sold2-trader';b.textContent='ကုန်သည်ငွေရှင်းသို့';b.addEventListener('click',()=>openReceiptTraderSales2(id));return b;}
 window.openReceiptTraderSales2=function(id){
  const items=affected(records(id)).filter(x=>x.sales.length),groups=items.flatMap(item=>sourceGroups(item).map(rows=>({item,rows})));
  if(groups.length===1&&typeof openTraderList74==='function'){const {item,rows}=groups[0];return openTraderList74(item.r.partnerId||rows[0].sourceSupplierId||rows[0].originPartnerId||'',voucher(rows[0]));}
  openSoldReceiptPurchase2(id);document.querySelectorAll('.sold2-links').forEach(e=>e.open=true);
 };
 window.openSoldReceiptPurchase2=function(id){
  const rs=records(id),items=affected(rs);if(!items.length)return receiptDetail4(id);
  const first=rs[0];openModal('ကုန်အသုတ် အသုံးပြုမှု',first.name+' · '+voucher(first),'<div id="soldReceiptPurchaseGuard2"></div>',btn('ပြန်မယ်',"navigate('receipts')",'secondary','back'),true);
  $('soldReceiptPurchaseGuard2')?.append(panel(rs));$('soldReceiptPurchaseGuard2')?.closest('.work-page')?.classList.add('sold2-guard-page');
  const footer=document.querySelector('#main .work-page .modal-footer')||document.querySelector('#modalRoot .modal-footer');if(footer&&items.some(x=>x.sales.length))footer.append(traderButton(id));
 };
 function guard(rs){return affected(rs).some(x=>!window.isRemainingPurchaseNative2?.(x.r));}
 function refuse(rs){
  const items=affected(rs),form=$('voucher4')||$('pricingForm')||$('purchaseForm');
  if(form){form.querySelector('.sold2-summary')?.remove();form.prepend(panel(rs));}
  return error(items.some(x=>x.sales.length)?message:stockMessage);
 }
 // Opening routes, including the historical pricing entry point.
 const previousPurchase=purchase4;
 purchase4=function(id){if(!guardWork())return;const rs=records(id);if(guard(rs))return openSoldReceiptPurchase2(id);return previousPurchase.apply(this,arguments);};
 const previousPricing=openPricing;
 openPricing=function(id){if(!guardWork())return;const rs=records(id);if(guard(rs))return openSoldReceiptPurchase2(id);return previousPricing.apply(this,arguments);};
 const previousForm=voucherForm4;
 voucherForm4=function(rs){if(v4Kind==='purchase'&&guard(rs))return openSoldReceiptPurchase2(rs[0].id);return previousForm.apply(this,arguments);};
 const previousSettlement=openPurchaseSettlement;
 openPurchaseSettlement=function(){const id=typeof wizard!=='undefined'?wizard?.id:null,rs=id?records(id):[];if(guard(rs))return openSoldReceiptPurchase2(id);return previousSettlement.apply(this,arguments);};
 // Re-read live source records before any counter, money, stock or history is changed.
 const previousCommit=commitVoucher4;
 commitVoucher4=function(){
  if(v4Kind==='purchase'){
   const ids=new Set([...(v4ReceiptIds||[]),...[...document.querySelectorAll('#voucherLines4 [data-rid]')].map(e=>e.dataset.rid)]);
   const rs=state.receipts.filter(r=>ids.has(r.id));if(guard(rs))return refuse(rs);
  }
  return previousCommit.apply(this,arguments);
 };
 const previousPriceCommit=commitPriceVoucher;
 commitPriceVoucher=function(id){const rs=records(id);if(guard(rs))return refuse(rs);return previousPriceCommit.apply(this,arguments);};
 const previousLegacyCommit=commitPurchase;
 commitPurchase=function(){const id=typeof wizard!=='undefined'?wizard?.id:null,rs=id?records(id):[];if(guard(rs))return refuse(rs);return previousLegacyCommit.apply(this,arguments);};
 // Keep the existing receipt and all historical receiving quantities readable.
 const previousRows=renderReceiptRows;
 renderReceiptRows=function(){
  const result=previousRows.apply(this,arguments),root=$('receiptRows');if(!root)return result;
  root.querySelectorAll('article').forEach(card=>{
   const a=card.querySelector('[onclick^="receiptDetail4("]'),id=a?.getAttribute('onclick')?.match(/^receiptDetail4\('([^']+)'/)?.[1];if(!id)return;
   const rs=records(id),items=affected(rs);if(!items.length)return;
   const badge=card.querySelector('.pill');if(badge){badge.textContent=status(items,rs);badge.classList.remove('amber');badge.classList.add('blue');}
   const buy=card.querySelector('[onclick^="purchase4("]');if(buy){buy.replaceWith(blockedButton());if(items.some(x=>x.sales.length))a.parentElement.append(traderButton(id));}
   card.querySelector('.req-chip-row')?.after(panel(rs,true));
  });return result;
 };
 const previousDetail=receiptDetail4;
 receiptDetail4=function(id){
  const result=previousDetail.apply(this,arguments),rs=records(id),items=affected(rs);if(!items.length)return result;
  const body=document.querySelector('#main .work-page .modal-body')||document.querySelector('#modalRoot .modal-body');if(body&&!body.querySelector('.sold2-summary'))body.prepend(panel(rs));
  const footer=document.querySelector('#main .work-page .modal-footer')||document.querySelector('#modalRoot .modal-footer');if(footer){footer.querySelectorAll('[onclick]').forEach(b=>{if(/^(purchase4|openPricing)\(/.test(b.getAttribute('onclick')||''))b.replaceWith(blockedButton());});if(items.some(x=>x.sales.length)&&!footer.querySelector('.sold2-trader')){const b=traderButton(id);b.classList.add('sold2-trader');footer.append(b);}}
  return result;
 };
 // Existing packed-line edit rules also protect sold-line IDs and shared headers.
 const previousLock=receiveLineLocked2;
 receiveLineLocked2=function(r){return previousLock(r)||(!!r&&info(r).sales.length>0);};
 const previousEdits=applyReceiptLineEdits2;
 applyReceiptLineEdits2=function(old,rows,...args){
  for(const r of old.filter(r=>info(r).sales.length)){
   const row=rows.find(x=>x.el.dataset.rid===r.id);
   const same=(a,b)=>Math.abs(n(a)-n(b))<eps;
   if(!row||row.product!==r.product||row.grade!==r.grade||row.bagType!==(r.bagType||'raw')||!same(row.qty,r.qty)||!same(row.bags,r.bagType==='weight'?0:r.bags)||!same(row.rawBags,r.bagType==='raw'?(r.rawBags??r.bags):0)||!same(row.packageViss,r.bagType==='finished'?r.packageViss:0)||!same(row.packageCount,r.bagType==='finished'?(r.packageCount??r.bags):0))return error('ရောင်းထားသော ကုန်လိုင်းကို ပြင် / ဖယ်ရှား၍မရပါ။ ကျန်လိုင်းများကိုသာ ပြင်ပါ။');
  }
  return previousEdits.call(this,old,rows,...args);
 };
 const previousReceive=openReceive4;
 openReceive4=function(edit=''){
  const result=previousReceive.apply(this,arguments);if(!edit)return result;
  const rs=state.receipts.filter(r=>voucher(r)===edit),sold=rs.filter(r=>info(r).sales.length);
  if(!sold.length)return result;
  for(const r of sold){const row=[...document.querySelectorAll('#receiveLines4 [data-rid]')].find(e=>e.dataset.rid===r.id);const note=row?.querySelector('.receive-lock-note2 span');if(note)note.textContent='ရောင်းထားပြီး · ဤကုန်လိုင်းကို ပြင် / ဖယ်ရှား၍မရပါ။';}
  const shared=$('receive4')?.querySelector(':scope > .mb');if(shared){shared.textContent='အသုံးပြုထားသော ကုန်လိုင်းနှင့် ဘောက်ချာအချက်အလက်များကို ပိတ်ထားပါသည်။ ကျန်ကုန်လိုင်းများကို ပြင်နိုင်ပါသည်။';shared.classList.add('sold2-help');}
  const price=document.querySelector('[onclick="saveReceive4(\'price\')"]');if(price)price.replaceWith(blockedButton());return result;
 };
 if(page==='receipts'&&!workView)renderReceiptRows();
 document.title='ပွဲရုံ · Version 2 · Remaining Stock Purchase Update';
})();

