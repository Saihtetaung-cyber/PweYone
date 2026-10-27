
/* V81: warehouse/batch display filters only. No stock or financial mutations. */
(function(){
 'use strict';
 const normal=s=>String(s??'').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase();
 function day(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s?s:'';}
 function context(){return {receipts:new Map((state.receipts||[]).map(r=>[r.id,r])),sales:new Map((state.sales||[]).map(s=>[s.id,s])),people:new Map((state.masters?.partners||[]).map(p=>[p.id,p])),lots:new Map((state.lots||[]).map(l=>[l.id,l]))};}
 function entryDate(l,c){
  const direct=day(l.entryDate);if(direct)return direct;
  const r=c.receipts.get(l.receiptId||l.sourceReceiptId),receiptDate=day(r?.date);if(receiptDate)return receiptDate;
  // Held buyer stock can retain its original receiving reference through the sale.
  const s=c.sales.get(l.saleId),source=c.lots.get(s?.sourceLot),sourceDate=day(source?.entryDate)||day(c.receipts.get(s?.sourceReceiptId||source?.receiptId)?.date);
  return sourceDate||'';
 }
 function ownerInfo(l,c){
  const label=ownershipDefinitions.find(d=>d[0]===l.owner)?.[1]||'',r=c.receipts.get(l.receiptId),s=c.sales.get(l.saleId);
  const id=l.owner==='supplier'?(l.partnerId||r?.partnerId||l.originPartnerId):l.owner==='customer'?(l.buyerId||s?.buyerId):'';
  const p=c.people.get(id),name=l.owner==='owned'?'ပွဲရုံပိုင်':l.name||(p?supplierLabel(p):'');
  const text=l.owner==='owned'?[label,'ပွဲရုံပိုင်']:[label,name,p?.name,p?.locality];
  return {label,name,text:normal(text.filter(Boolean).join(' '))};
 }
 const heads=['ကုန် / အသုတ်','ကုန်ဝင်ရက်','ဂိုဒေါင်','ပိုင်ဆိုင်မှု / ပိုင်ရှင်','ပုံစံ','ပိဿာ / အိတ်'];
 stockRows4=function(){
  const wh=value('stockWh4')||'all',owner=value('stockOwner4')||'all',product=value('stockProduct78'),query=normal(value('stockSearch81')),tokens=query.split(' ').filter(Boolean),from=value('stockFrom81'),to=value('stockTo81');
  const errorBox=document.getElementById('stockFilterError81'),countBox=document.getElementById('stockFilterCount81'),end=document.getElementById('stockTo81');
  const invalid=[['stockFrom81',from],['stockTo81',to]].some(([id,s])=>s&&!day(s)||document.getElementById(id)?.validity.badInput);
  const message=invalid?'မှန်ကန်သော ကုန်ဝင်ရက်ကို ရွေးပါ။':from&&to&&from>to?'စရက်သည် ဆုံးရက်ထက် နောက်မကျရပါ။ ရက်စွဲကို ပြန်ရွေးပါ။':'';
  if(errorBox){errorBox.hidden=!message;errorBox.textContent=message;}
  if(end)end.setAttribute('aria-invalid',message?'true':'false');
  if(message){if(countBox)countBox.textContent='ရက်စွဲကာလကို ပြန်စစ်ပါ။';return table4(heads,['<tr><td colspan="6">'+empty('မှန်ကန်သော ရက်စွဲကာလကို ရွေးပါ။','clock')+'</td></tr>']);}
  const c=context(),rows=[];let undated=0;
  for(const l of state.lots||[]){
   if(!(l.qty>0||l.weightKnown===false)||(wh!=='all'&&l.warehouse!==wh)||(owner!=='all'&&l.owner!==owner)||(product&&l.product!==product))continue;
   const person=ownerInfo(l,c);if(!tokens.every(t=>person.text.includes(t)))continue;
   const date=entryDate(l,c);
   if(from||to){if(!date){undated++;continue;}if(from&&date<from||to&&date>to)continue;}
   rows.push('<tr data-stock-lot81="'+E(l.id)+'"><td><strong>'+E(l.product)+'</strong><div class="small muted">'+E(l.batch)+'</div></td><td>'+(date?shortDate(date):'ရက်မသိရသေး')+'</td><td>'+E(W(l.warehouse))+'</td><td>'+E(person.label)+'<div class="small muted">'+E(person.name)+'</div></td><td>'+(l.stockForm==='packaged'?E(l.packName||'ထုပ်ပိုးပြီး')+' · '+vissText37(l.packageViss)+' ပိဿာ/အိတ်':'မထုပ်ပိုးရသေး')+'</td><td><strong>'+(l.weightKnown===false?'မသိသေး':N(l.qty))+'</strong>'+stockBagCell2(l)+'</td></tr>');
  }
  if(countBox)countBox.textContent='တွေ့ရှိသော အသုတ် '+N(rows.length)+' ခု'+(undated?' · ကုန်ဝင်ရက်မရှိသော အသုတ် '+N(undated)+' ခု မပါဝင်ပါ။':'');
  return table4(heads,rows.length?rows:['<tr><td colspan="6">'+empty('ကိုက်ညီသော ကုန်လက်ကျန် မရှိပါ။','stock')+'</td></tr>']);
 };
 window.clearStockFilters81=function(){
  for(const [id,v] of [['stockWh4','all'],['stockOwner4','all'],['stockProduct78',''],['stockSearch81',''],['stockFrom81',''],['stockTo81','']]){const el=document.getElementById(id);if(el)el.value=v;}
  stockTable4();document.getElementById('stockSearch81')?.focus({preventScroll:true});
 };
 const previous=renderInventoryBody;
 renderInventoryBody=function(){const result=previous();if(invTab==='batches'&&document.getElementById('stockTable4'))stockTable4();return result;};
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
})();

