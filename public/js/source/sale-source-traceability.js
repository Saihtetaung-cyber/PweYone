
/* V43 SCOPED PATCH: Sales source trader + receiving lot traceability ONLY.
   Purchase, pricing, cash, loans, setup and unrelated modules are unchanged. */
(function(){
 'use strict';
 const T={
  product:'\u1000\u102f\u1014\u103a\u1015\u1005\u1039\u1005\u100a\u103a\u1038',
  productPick:'\u1000\u102f\u1014\u103a\u1015\u1005\u1039\u1005\u100a\u103a\u1038 \u101b\u103d\u1031\u1038\u1015\u102b',
  who:'\u1019\u1030\u101b\u1004\u103a\u1038 \u1000\u102f\u1014\u103a\u101e\u100a\u103a',
  whoPick:'\u1019\u1030\u101b\u1004\u103a\u1038\u1000\u102f\u1014\u103a\u101e\u100a\u103a \u101b\u103d\u1031\u1038\u1015\u102b',
  unknown:'\u1019\u1030\u101b\u1004\u103a\u1038\u1019\u101e\u102d (Legacy / Adjustment)',
  warehouse:'\u1002\u102d\u102f\u1012\u1031\u102b\u1004\u103a',
  whPick:'\u1002\u102d\u102f\u1012\u1031\u102b\u1004\u103a \u101b\u103d\u1031\u1038\u1015\u102b',
  batch:'\u1000\u102f\u1014\u103a\u1021\u101e\u102f\u1010\u103a (Batch)',
  batchPick:'\u1000\u102f\u1014\u103a\u1021\u101e\u102f\u1010\u103a \u101b\u103d\u1031\u1038\u1015\u102b',
  receiveBatch:'\u1000\u102f\u1014\u103a\u101c\u1000\u103a\u1001\u1036\u1021\u101e\u102f\u1010\u103a',
  qty:'\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038\u1015\u102d\u103f\u102c',
  unit:'\u1010\u1005\u103a\u101a\u1030\u1014\u1005\u103a\u1008\u1031\u1038',
  remain:'\u101c\u1000\u103a\u1000\u103b\u1014\u103a',
  viss:'\u1015\u102d\u103f\u102c',
  bag:'\u1021\u102d\u1010\u103a',
  line:'\u1000\u102f\u1014\u103a\u101c\u102d\u102f\u1004\u103a\u1038',
  remove:'\u1016\u101a\u103a\u101b\u103e\u102c\u1038\u1019\u101a\u103a',
  owner:'\u1000\u102f\u1014\u103a\u1015\u102d\u102f\u1004\u103a\u101b\u103e\u1004\u103a',
  own:'\u1015\u103d\u1032\u101b\u102f\u1036\u1015\u102d\u102f\u1004\u103a',
  supplier:'\u1000\u102f\u1014\u103a\u101e\u100a\u103a\u1015\u102d\u102f\u1004\u103a',
  delivered:'\u1011\u102f\u1010\u103a\u1015\u103c\u102e\u1038',
  deliver:'\u1011\u102f\u1010\u103a\u1015\u1031\u1038\u1019\u101a\u103a',
  pending:'\u1011\u102f\u1010\u103a\u1015\u1031\u1038\u101b\u1014\u103a\u1000\u103b\u1014\u103a',
  buyer:'\u101d\u101a\u103a\u101e\u1030',
  amount:'\u1010\u1014\u103a\u1016\u102d\u102f\u1038',
  total:'\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038',
  due:'\u101b\u101b\u1014\u103a\u1000\u103b\u1014\u103a',
  source:'\u1000\u102f\u1014\u103a\u101d\u1004\u103a\u1021\u101e\u102f\u1010\u103a',
  saleDetail:'\u1021\u101b\u1031\u102c\u1004\u103a\u1038\u1021\u101e\u1031\u1038\u1005\u102d\u1010\u103a',
  salesReport:'\u1000\u102f\u1014\u103a\u101e\u100a\u103a / Batch \u1021\u101c\u102d\u102f\u1000\u103a \u1021\u101b\u1031\u102c\u1004\u103a\u1038\u101b\u103e\u1004\u103a\u1038\u1010\u1019\u103a\u1038',
  date:'\u1021\u101b\u1031\u102c\u1004\u103a\u1038\u101b\u1000\u103a',
  details:'\u1021\u101e\u1031\u1038\u1005\u102d\u1010\u103a',
  noSales:'\u1021\u101b\u1031\u102c\u1004\u103a\u1038\u1019\u103e\u1010\u103a\u1010\u1019\u103a\u1038 \u1019\u101b\u103e\u102d\u1015\u102b\u104b',
  pay:'\u1004\u103d\u1031\u101c\u1000\u103a\u1001\u1036\u1019\u101a\u103a',
  back:'\u1015\u103c\u1014\u103a\u1019\u101a\u103a',
  note:'\u1019\u1030\u101b\u1004\u103a\u1038\u1000\u102f\u1014\u103a\u101e\u100a\u103a\u104a \u1002\u102d\u102f\u1012\u1031\u102b\u1004\u103a\u1014\u103e\u1004\u1037\u103a Batch \u1000\u102d\u102f \u1000\u102f\u1014\u103a\u101c\u102d\u102f\u1004\u103a\u1038\u1010\u1005\u103a\u1001\u102f\u1001\u103b\u1004\u103a\u1038\u1005\u102e \u101b\u103d\u1031\u1038\u1015\u102b\u104b \u1000\u102f\u1014\u103a\u1010\u1005\u103a\u1019\u103b\u102d\u102f\u1038\u1000\u102d\u102f Batch \u1019\u1010\u1030\u101c\u103b\u103e\u1004\u103a \u1011\u1015\u103a\u101b\u103d\u1031\u1038\u1014\u102d\u102f\u1004\u103a\u1015\u102b\u101e\u100a\u103a\u104b'
 };
 document.title=document.title.replace(/V41 Itemized Deduction Details/,'V43 Farmer / Batch Sales Tracking');
 const old={add:window.addVoucherLine4,form:window.voucherForm4,commit:window.commitVoucher4,rows:window.renderSaleRows,detail:window.saleDetail4,print:window.printVoucher4,salesPage:window.salesPage};
 const empty43=[['','--']];
 const chosenOwner=()=>value('fSaleOwner60')||'owned';
 const uniq43=values=>[...new Set(values)];
 const bagsShown43=s=>(s.saleBagsEntered43?`<div class="small muted">${N(s.saleBagsCount43??s.bags)} ${T.bag}</div>`:'')+(Number(s.buyerBagViss46)>0?`<div class="small muted">${"\u101d\u101a\u103a\u101e\u1030\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u101e\u1031\u102c \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u101d\u1004\u103a"}: ${vissText37(s.buyerBagViss46)} ${T.viss}</div>`:'');
 const lotById=id=>(state.lots||[]).find(l=>l.id===id);
 const priceShown46=s=>`<div class="small muted">${s.priceBasis==='standard_bag'?"\u1010\u1005\u103a\u1005\u1036\u1021\u102d\u1010\u103a\u1008\u1031\u1038":"\u1010\u1005\u103a\u1015\u102d\u103f\u102c\u1008\u1031\u1038"}: ${cashText(s.price)}${s.priceBasis==='standard_bag'?' / '+vissText37(s.standardBagViss46||productStandard(s.product))+' '+T.viss:''}</div>`;

 function provenance43(l){
   if(!l)return {id:'',name:T.unknown,receiptNo:'',receiptId:'',key:'__unlinked__'};
   const r=(state.receipts||[]).find(x=>x.id===l.receiptId);
   const id=r?.partnerId||l.partnerId||l.originPartnerId||'';
   const partner=(state.masters?.partners||[]).find(p=>p.id===id);
   let name=(r?.name|| (partner && (typeof supplierLabel==='function'?supplierLabel(partner):partner.name)) || l.originSupplierName || ((l.owner==='supplier')?l.name:'') || '').trim();
   if(!name || name==='\u1015\u103d\u1032\u101b\u102f\u1036\u1015\u102d\u102f\u1004\u103a')name=T.unknown;
   // Legacy seed data has no partnerId: resolve the person by the stock-origin name when unique.
   let key=id;
   if(!key&&name!==T.unknown){
     const hits=(state.masters?.partners||[]).filter(p=>p.kind==='supplier'&& (p.name===name || (typeof supplierLabel==='function'&&supplierLabel(p)===name)));
     if(hits.length===1)key=hits[0].id;
   }
   if(!key)key=name===T.unknown?'__unlinked__':'legacy:'+name;
   return {id:id|| (key==='__unlinked__'||key.startsWith('legacy:')?'':key),name,receiptNo:r?.voucherNo||r?.no||l.originReceiptNo||l.batch||'',receiptId:r?.id||l.receiptId||'',key};
 }
 function allEligible43(){return (state.lots||[]).filter(l=>l.owner===chosenOwner()&&Number(l.qty)>0&&l.weightKnown!==false);}
 function opt43(el,options){if(!el)return;el.innerHTML=options.map(([v,n])=>`<option value="${E(v)}">${E(n)}</option>`).join('');el.disabled=options.length<=1;el.setAttribute('aria-disabled',String(el.disabled));}
 // V72: keep each sale-line selector in sync with current stock ownership.
 function choiceGuide72(i){const hint=document.getElementById('slineHint43'+i);if(!hint)return;const stock=allEligible43();const text=!stock.length?(chosenOwner()==='supplier'?'ရောင်းချနိုင်သော ကုန်သည်ပိုင်လက်ကျန် မရှိပါ။ ကုန်ဝင်စာရင်းနှင့် တိုင်းပြီးပိဿာကို စစ်ဆေးပါ။':'ရောင်းချနိုင်သော ပွဲရုံပိုင်လက်ကျန် မရှိပါ။ ကုန်လက်ကျန်စာရင်းကို စစ်ဆေးပါ။'):!value('vsp59'+i)?'ကုန်ပစ္စည်းကို အရင်ရွေးပါ။':!value('vso43'+i)?'ရွေးထားသောကုန်အတွက် မူရင်းကုန်သည်ကို ရွေးပါ။':!value('vsw59'+i)?'ကုန်ရှိသော ဂိုဒေါင်ကို ရွေးပါ။':'ရောင်းမည့် ကုန်အသုတ်ကို ရွေးပါ။';hint.textContent=text;}
 function stockNotice72(){const block=document.getElementById('saleStockSource60');if(!block)return;let box=document.getElementById('saleStockNotice72');if(!box){box=document.createElement('div');box.id='saleStockNotice72';box.className='note blue';box.setAttribute('role','status');box.setAttribute('aria-live','polite');block.appendChild(box);}const rows=allEligible43(),held=(state.lots||[]).filter(l=>l.owner===chosenOwner()&&(Number(l.qty)>0||l.weightKnown===false));box.textContent=rows.length?'ကုန်ပစ္စည်း → မူရင်းကုန်သည် → ဂိုဒေါင် → အသုတ် အစဉ်အတိုင်း ရွေးပါ။ ရွေးစရာတစ်ခုသာရှိသော နောက်အဆင့်များကို အလိုအလျောက် ဖြည့်ပေးပါမည်။':held.some(l=>l.weightKnown===false)?'ရွေးထားသောပိုင်ဆိုင်မှုတွင် ပိဿာမတိုင်းရသေးသော ကုန်ရှိပါသည်။ ကုန်ဝင်မှတ်တမ်းတွင် တကယ်ရှိပိဿာ ဖြည့်ပြီးမှ ရောင်းနိုင်ပါမည်။':'ရွေးထားသောပိုင်ဆိုင်မှုအတွက် ရောင်းချနိုင်သော ကုန်လက်ကျန်မရှိပါ။ ကုန်ဝင် / စတင်လက်ကျန်တွင် သက်ဆိုင်ရာပိုင်ဆိုင်မှုဖြင့် ကုန်မှတ်တမ်းရှိကြောင်း စစ်ဆေးပါ။';}
 window.refreshSaleSelectors72=function(){if(v4Kind!=='sale')return;const owner=document.getElementById('fSaleOwner60');if(owner)owner.setAttribute('onchange','saleOwnerChanged43()');document.querySelectorAll('#voucherLines4 .req-line').forEach(line=>{const i=line.dataset.i;const handlers=[['vsp59','saleProductChanged43'],['vso43','saleOriginChanged43'],['vsw59','saleWarehouseChanged43'],['vl','saleBatchChanged43']];for(const [prefix,handler] of handlers){const el=document.getElementById(prefix+i);if(el)el.setAttribute('onchange',handler+'('+i+')');}reset43(i);});stockNotice72();};
 function products43(){return [['',T.productPick],...uniq43(allEligible43().map(l=>l.product)).sort().map(x=>[x,x])];}
 function origins43(product){const rows=allEligible43().filter(l=>l.product===product),map=new Map();for(const l of rows){const p=provenance43(l);map.set(p.key,p.name);}return [['',T.whoPick],...[...map.entries()].map(([k,n])=>[k,n])];}
 function warehouses43(product,originKey){return [['',T.whPick],...uniq43(allEligible43().filter(l=>l.product===product&&provenance43(l).key===originKey).map(l=>l.warehouse)).map(id=>[id,W(id)])];}
 function batches43(product,originKey,warehouse){return [['',T.batchPick],...allEligible43().filter(l=>l.product===product&&l.warehouse===warehouse&&provenance43(l).key===originKey).map(l=>{
   const p=provenance43(l),receipt=(p.receiptNo&&p.receiptNo!==l.batch)?` | ${T.receiveBatch}: ${p.receiptNo}`:'';
   return [l.id,`${l.batch||l.id}${receipt} | ${vissText37(l.qty)} ${T.viss} | ${l.stockForm==='packaged'?'Packaged':'Loose'}`];
 })];}
 function reset43(i){opt43(document.getElementById('vsp59'+i),products43());opt43(document.getElementById('vso43'+i),[['','ကုန်ပစ္စည်းကို အရင်ရွေးပါ']]);opt43(document.getElementById('vsw59'+i),[['','မူရင်းကုန်သည်ကို အရင်ရွေးပါ']]);opt43(document.getElementById('vl'+i),[['','ဂိုဒေါင်ကို အရင်ရွေးပါ']]);saleBatchChanged43(i);choiceGuide72(i);}
 window.saleOwnerChanged43=function(){const wrap=document.getElementById('saleSupplierWrap60');if(wrap){wrap.hidden=true;wrap.style.display='none';}document.querySelectorAll('#voucherLines4 .req-line').forEach(el=>reset43(el.dataset.i));stockNotice72();calcVoucher4();};
 window.saleProductChanged43=function(i){const product=value('vsp59'+i),origin=document.getElementById('vso43'+i);opt43(origin,origins43(product));opt43(document.getElementById('vsw59'+i),[['','မူရင်းကုန်သည်ကို အရင်ရွေးပါ']]);opt43(document.getElementById('vl'+i),[['','ဂိုဒေါင်ကို အရင်ရွေးပါ']]);saleBatchChanged43(i);if(origin?.options.length===2){origin.selectedIndex=1;saleOriginChanged43(i);}else choiceGuide72(i);};
 window.saleOriginChanged43=function(i){const product=value('vsp59'+i),k=value('vso43'+i),warehouse=document.getElementById('vsw59'+i);opt43(warehouse,warehouses43(product,k));opt43(document.getElementById('vl'+i),[['','ဂိုဒေါင်ကို အရင်ရွေးပါ']]);saleBatchChanged43(i);if(warehouse?.options.length===2){warehouse.selectedIndex=1;saleWarehouseChanged43(i);}else choiceGuide72(i);};
 window.saleWarehouseChanged43=function(i){const batch=document.getElementById('vl'+i);opt43(batch,batches43(value('vsp59'+i),value('vso43'+i),value('vsw59'+i)));if(batch?.options.length===2)batch.selectedIndex=1;saleBatchChanged43(i);if(!value('vl'+i))choiceGuide72(i);};
 window.saleBagCountChanged43=function(i){
   const lot=lotById(value('vl'+i)),el=document.getElementById('vbag43'+i),q=document.getElementById('vq'+i);
   if(!el||!q)return;
   const count=el.value===''?0:Number(el.value),weight=lot?Number(value('vBuyerBag46'+i)):0;
   if(!(count>0)&&el.value===''){q.value='';calcVoucher4();return;}
   q.value=Number.isInteger(count)&&count>0&&weight>0?Math.round(count*weight*1000)/1000:'';
   calcVoucher4();
 };
 window.saleWeightChanged43=function(i){const el=document.getElementById('vbag43'+i);if(el)el.value='';calcVoucher4();};
 window.saleBatchChanged43=function(i){
   const lot=lotById(value('vl'+i)),hint=document.getElementById('slineHint43'+i);
   const bags=document.getElementById('vbag43'+i),qty=document.getElementById('vq'+i);
   if(bags)bags.value='';if(qty)qty.value='';
   const desired=document.getElementById('vBuyerBag46'+i);
   if(desired)desired.value=lot?String(productStandard(lot.product)||Number(lot.packageViss)||(Number(lot.bags)>0?lot.qty/lot.bags:0)||''):'';
   if(hint)hint.innerHTML=lot?`${T.who}: <strong>${E(provenance43(lot).name)}</strong> | ${T.source}: <strong>${E(provenance43(lot).receiptNo||'--')}</strong> | ${T.remain}: <strong>${vissText37(lot.qty)} ${T.viss}</strong>`:'';if(!lot)choiceGuide72(i);
   calcVoucher4();
 };
 window.addVoucherLine4=function(r={}){
   if(v4Kind!=='sale')return old.add(r);
   const root=document.getElementById('voucherLines4');if(!root)return;
   const i=v4Rows++;
   root.insertAdjacentHTML('beforeend',`<section class="req-line" data-i="${i}" data-rid="${E(r.id||'')}">
     <div class="row between mb"><h3>${T.line} ${i+1}</h3>${smallbtn(T.remove,'removeLine4(this)','ghost')}</div>
     <div class="field-row">${selectField(T.product,'vsp59'+i,products43(),'','onchange="saleProductChanged43('+i+')"')}${selectField(T.who,'vso43'+i,[['',T.whoPick]],'','onchange="saleOriginChanged43('+i+')"')}</div>
     <div class="field-row">${selectField(T.warehouse,'vsw59'+i,[['',T.whPick]],'','onchange="saleWarehouseChanged43('+i+')"')}${selectField(T.batch,'vl'+i,[['',T.batchPick]],'','onchange="saleBatchChanged43('+i+')"')}</div>
     <div id="slineHint43${i}" class="note blue" aria-live="polite" style="margin-bottom:14px;min-height:0"></div>
     <div class="field-row">${field("\u101d\u101a\u103a\u101e\u1030\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u101e\u1031\u102c \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u101d\u1004\u103a",'vBuyerBag46'+i,{type:'number',min:.001,step:.001,required:true,suffix:T.viss,help:"\u1010\u1005\u103a\u1021\u102d\u1010\u103a\u101d\u1004\u103a\u1015\u102d\u103f\u102c \u1015\u103c\u1031\u102c\u1004\u103a\u1038\u101c\u103b\u103e\u1004\u103a \u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a\u1021\u101c\u102d\u102f\u1000\u103a \u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038\u1015\u102d\u103f\u102c \u1015\u103c\u1014\u103a\u1010\u103d\u1000\u103a\u1015\u102b\u1019\u100a\u103a\u104b",extra:'oninput="saleDesiredBagChanged46('+i+')"'})}${field(T.bag,'vbag43'+i,{type:'number',min:1,step:1,extra:'oninput="saleBagCountChanged43('+i+')"'})}</div>
     <div class="field-row">${num4(T.qty,'vq'+i,r.qty||'',.001,'oninput="saleWeightChanged43('+i+')"')}${num4(T.unit,'vr'+i,r.price||'',.001,'oninput="calcVoucher4()"')}</div>
     <div id="lineSummary4${i}" class="muted small"></div></section>`);
   reset43(i);stockNotice72();calcVoucher4();
 };
 window.voucherForm4=function(rs){
   old.form(rs);
   if(v4Kind!=='sale')return;
   const owner=document.getElementById('fSaleOwner60'),wrap=document.getElementById('saleSupplierWrap60'),block=document.getElementById('saleStockSource60');
   if(owner)owner.setAttribute('onchange','saleOwnerChanged43()');
   if(wrap)wrap.hidden=true;
   if(block){const note=block.querySelector('.field-help');if(note)note.textContent=T.note;}
   document.querySelectorAll('#voucherLines4 .req-line').forEach(el=>reset43(el.dataset.i));
   calcVoucher4();
 };
 function matching43(row){
   const i=row.i,l=row.l,p=provenance43(l);
   return !!l&&l.owner===chosenOwner()&&l.weightKnown!==false&&l.qty>0&&value('vsp59'+i)===l.product&&value('vso43'+i)===p.key&&value('vsw59'+i)===l.warehouse&&value('vl'+i)===l.id;
 }
 window.commitVoucher4=function(){
   if(v4Kind!=='sale')return old.commit();
   if(!guardWork()||!validForm('voucher4'))return;
   if(document.getElementById('purchaseLaborRows')){
     const labor=purchaseLaborRows();
     if(labor.some(r=>!Number.isInteger(r.bags)||r.bags<0||(r.bags>0&&(!r.active||r.rate===null||!r.maelId||!(r.multiple>0)))))return error('Please check Sale Labor Rate, Mael and Bag Count.');
   }
   const rows=readVoucherLines4(),c=readCharges4(),gross=rows.reduce((n,r)=>n+r.total,0),deductions=(c.truck||0)+(c.labor||0)+(c.clean||0)+(c.plastic||0)+(c.sack||0)+(c.advance||0)+(c.serviceFee||0)-(c.saleAdjustments2?.deductionTotal||0),net=gross+deductions,paid=number('fPaid'),date=value('fDate'),buyer=state.masters.partners.find(p=>p.id===value('fParty')&&p.kind==='buyer');
   if(!buyer)return error('Please select a buyer.');
   if(!rows.length||rows.some(r=>!matching43(r)||!Number.isFinite(r.qty)||!(r.qty>0)||!Number.isFinite(r.price)||!(r.price>0)))return error('Select Product, Trader, Warehouse, Batch, Qty and Price for every sale line.');
   if(rows.some(r=>{const el=document.getElementById('vbag43'+r.i);return el&&el.value!==''&&(!Number.isInteger(Number(el.value))||Number(el.value)<=0);}))return error('Please enter whole positive sale bag counts.');
   if(rows.some(r=>!(Number(value('vBuyerBag46'+r.i))>0)||!Number.isFinite(Number(value('vBuyerBag46'+r.i)))))return error("\u101d\u101a\u103a\u101e\u1030\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u101e\u1031\u102c \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u101d\u1004\u103a\u1015\u102d\u103f\u102c\u1000\u102d\u102f \u1011\u100a\u1037\u103a\u1015\u102b\u104b");
   if(rows.some(r=>{const b=value('vbag43'+r.i);return b!==''&&Math.abs(r.qty-Number(b)*Number(value('vBuyerBag46'+r.i)))>.0011;}))return error('Buyer bag count and sale viss do not match.');
   if(value('fBasis')==='bag'&&rows.some(r=>!(productStandard(r.product)>0)))return error('Set standard bag size for this product.');
   if(!(gross>0)||!Number.isFinite(net)||net<0||!Number.isFinite(paid)||paid<0||paid>net)return error('Please check total charges and payment amount.');
   const totals=new Map();for(const r of rows)totals.set(r.l.id,(totals.get(r.l.id)||0)+r.qty);
   for(const [id,qty] of totals){const lot=lotById(id);if(!lot||qty>lot.qty+.000001)return error('Not enough stock in the selected batch. Multiple sale lines from the same batch are summed before saving.');}
   const splits=splits4(paid,false);if(!splits)return;
   const no='\u1021\u101b-'+(++state.counter),recs=[];let allocatedDed=0;
   rows.forEach((x,index)=>{
     const share=index===rows.length-1?deductions-allocatedDed:Math.round(deductions*x.total/gross);allocatedDed+=share;
     const source=provenance43(x.l),buyerBagViss46=Number(value('vBuyerBag46'+x.i)),bagWeight43=buyerBagViss46,cost=takeLot4(x.l,x.qty),id=uid('S'),inputBags=value('vbag43'+x.i),bags=inputBags!==''?Number(inputBags):x.qty/bagWeight43,holding=value('fDelivery')==='hold';
     const rec={id,no:no+' / '+(index+1),voucherNo:no,date,buyerId:buyer.id,name:buyer.name,product:x.product,grade:'\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038',qty:x.qty,bags,packageCount:bags,packageViss:buyerBagViss46,buyerBagViss46,standardBagViss46:productStandard(x.product)||0,price:x.price,priceBasis:value('fBasis')==='bag'?'standard_bag':'viss',total:x.total+share,grossTotal:x.total,cost,paid:0,payments:[],mode:value('fDelivery'),deliveredQty:holding?0:x.qty,deliveredBags:holding?0:bags,dispatches:[],warehouse:x.l.warehouse,batch:x.l.batch,sourceLot:x.l.id,sourceOwner:x.l.owner,sourceSupplierId:x.l.owner==='supplier'?source.id:'',sourceSupplierName:x.l.owner==='supplier'?source.name:'',originPartnerId:source.id,originPartnerName:source.name,sourceReceiptId:source.receiptId,sourceReceiptNo:source.receiptNo,saleBagsEntered43:inputBags!=='',saleBagsCount43:inputBags!==''?Number(inputBags):null,v4:true};
     state.sales.push(rec);recs.push(rec);
     if(holding){state.lots.push({id:uid('L'),product:x.product,grade:rec.grade,qty:x.qty,bags,packageCount:bags,packageViss:buyerBagViss46,owner:'customer',name:buyer.name,cost:Number(x.l.cost)||0,saleId:id,warehouse:x.l.warehouse,batch:x.l.batch,stockForm:x.l.stockForm||'loose',sourceOwner:rec.sourceOwner,sourceSupplierId:rec.sourceSupplierId,originPartnerId:source.id,originSupplierName:source.name,originReceiptNo:source.receiptNo});}
     else dateMove(x.product,x.qty,'out',no,date,'sale');
   });
   recs[0].charges4={...c,gross,serviceFee:c.serviceFee||0,total:deductions,chargeTreatment67:"add"};
   allocatePayment4(recs,splits,true,date,no);
   audit4(no+' Sale recorded with trader and originating lot linked per line.');
   done4('Sale saved with individual trader and batch tracking.','sales');v4Kind='';
 };
 function sourceForSale43(s){
   if(s?.originPartnerName)return {name:s.originPartnerName,receiptNo:s.sourceReceiptNo||s.batch||'',id:s.originPartnerId||''};
   const l=lotById(s?.sourceLot);return l?provenance43(l):{name:s?.sourceSupplierName||T.unknown,receiptNo:s?.batch||'',id:s?.sourceSupplierId||''};
 }
 function saleOwnerLabel43(s){return s.sourceOwner==='supplier'?T.supplier:T.own;}
 window.renderSaleRows=function(){
   const root=document.getElementById('saleRows');if(!root)return old.rows?.();
   const term=String(searchTerm||'').toLocaleLowerCase();
   const groups=group4(state.sales).filter(g=>g.some(s=>[s.name,s.product,s.no,s.voucherNo,s.batch,sourceForSale43(s).name,sourceForSale43(s).receiptNo].join(' ').toLocaleLowerCase().includes(term))).filter(g=>typeof saleDateMatches2!=='function'||saleDateMatches2(g[0].date)).filter(g=>filter==='all'||g.some(s=>filter==='collect'?saleRemaining(s)>0:filter==='debt'?receivable(s)>0:filter==='delivered'?saleRemaining(s)===0:true));
   root.innerHTML=groups.map(rs=>{const first=rs[0],remain=rs.reduce((n,s)=>n+saleRemaining(s),0),debt=rs.reduce((n,s)=>n+receivable(s),0);
     return `<article class="card mb"><div class="row between wrap"><div><h3>${E(first.name)}</h3><span class="small muted">${E(first.voucherNo||first.no)} | ${shortDate(first.date)}</span></div>${pill(remain?T.pending:T.delivered,remain?'blue':'')}</div><div class="req-chip-row">${rs.map(s=>`<span>${E(s.product)} | ${E(sourceForSale43(s).name)} | ${E(sourceForSale43(s).receiptNo||s.batch)} | ${vissText37(s.qty)} ${T.viss}</span>`).join('')}</div><div class="row between wrap mt"><strong>${T.due} ${cashText(debt)}</strong><div class="row wrap">${btn(T.details,`saleDetail4('${first.id}')`,'secondary','eye')}${debt?btn(T.pay,`payVoucher4('sale','${first.id}')`,'primary','wallet')+smallbtn('Print',`openSlip4('${first.id}')`,'secondary','print'):''}</div></div></article>`;
   }).join('')||empty(T.noSales);
 };
 window.saleDetail4=function(id){
   const rs=voucherRecords4('sale',id),first=rs[0];if(!first)return old.detail(id);
   const lines=table4([T.product,T.who,T.receiveBatch,T.warehouse,T.qty,T.amount,'Stock / Delivery'],rs.map(s=>{
     const source=sourceForSale43(s);return `<tr><td><strong>${E(s.product)}</strong><div class="small muted">${E(saleOwnerLabel43(s))}</div></td><td>${E(source.name)}</td><td>${E(source.receiptNo||'--')}<div class="small muted">Lot: ${E(s.batch||'--')}</div></td><td>${E(W(s.warehouse))}</td><td>${vissText37(s.qty)}${bagsShown43(s)}</td><td>${cashText(s.total)}${priceShown46(s)}</td><td>${saleRemaining(s)>0?smallbtn(T.deliver,`dispatch4('${s.id}')`,'primary'):pill(T.delivered)}</td></tr>`;
   }));
   openModal(T.saleDetail,first.name+' | '+(first.voucherNo||first.no),lines+`<div class="summary-box mt">${row4(T.total,cashText(rs.reduce((n,s)=>n+s.total,0)))}${row4(T.due,cashText(rs.reduce((n,s)=>n+receivable(s),0)))}</div>`+(first.charges4?chargesSummary4(first.charges4):'')+`<h3 class="mt">${T.pay}</h3>${paymentHistory(rs.flatMap(s=>s.payments||[]),false)}`,btn(T.back,'closeModal()','secondary')+btn('Print',`printVoucher4('sale','${id}')`,'secondary','print')+(rs.some(s=>receivable(s)>0)?btn(T.pay,`payVoucher4('sale','${id}')`):''),true);
 };
 window.openSaleDetail=window.saleDetail4;
 window.printVoucher4=function(kind,id){
   if(kind!=='sale')return old.print(kind,id);
   const rs=voucherRecords4('sale',id),first=rs[0];if(!first)return;
   const body=`<p>${E(first.name)} | ${shortDate(first.date)}</p>`+table4([T.product,T.who,T.receiveBatch,T.warehouse,T.qty,T.amount],rs.map(s=>`<tr><td>${E(s.product)}</td><td>${E(sourceForSale43(s).name)}</td><td>${E(sourceForSale43(s).receiptNo||s.batch||'--')}</td><td>${E(W(s.warehouse))}</td><td>${vissText37(s.qty)}${bagsShown43(s)}</td><td>${cashText(s.total)}${priceShown46(s)}</td></tr>`))+row4(T.total,cashText(rs.reduce((n,s)=>n+s.total,0)))+(first.charges4?chargesSummary4(first.charges4).replaceAll('<details','<details open'):'')+row4(T.due,cashText(rs.reduce((n,s)=>n+receivable(s),0)));
   printDocument('\u1021\u101b\u1031\u102c\u1004\u103a\u1038\u1018\u1031\u102c\u1000\u103a\u1001\u103b\u102c',first.voucherNo||first.no,body);
 };
 function reports43(){
   const persons=uniq43((state.sales||[]).map(s=>sourceForSale43(s).name)).sort();
   return `<details class="card mt" id="saleTracePanel43"><summary style="cursor:pointer;font-weight:700;font-size:18px">${T.salesReport}</summary><div class="field-row mt">${selectField(T.who,'saleTraceFarmer43',[['',T.whoPick],...persons.map(n=>[n,n])],'','onchange="saleTraceRender43()"')}<div><label>${T.source} / Batch</label><input type="search" id="saleTraceText43" placeholder="Batch / Product / Voucher" oninput="saleTraceRender43()"></div></div><div id="saleTraceRows43" class="mt"></div></details>`;
 }
 window.salesPage=function(){return old.salesPage()+reports43();};
 window.saleTraceRender43=function(){
   const root=document.getElementById('saleTraceRows43');if(!root)return;
   const farmer=value('saleTraceFarmer43'),term=value('saleTraceText43').trim().toLocaleLowerCase();
   const rows=[...(state.sales||[])].filter(s=>(!farmer||sourceForSale43(s).name===farmer)&&[s.product,s.voucherNo,s.no,s.batch,sourceForSale43(s).receiptNo].join(' ').toLocaleLowerCase().includes(term)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
   root.innerHTML=table4([T.date,'Voucher',T.buyer,T.who,T.product,T.receiveBatch,T.warehouse,T.qty,T.remain],rows.map(s=>{const source=sourceForSale43(s),lot=lotById(s.sourceLot);return `<tr><td>${shortDate(s.date)}</td><td>${E(s.voucherNo||s.no)}</td><td>${E(s.name)}</td><td>${E(source.name)}<div class="small muted">${E(saleOwnerLabel43(s))}</div></td><td>${E(s.product)}</td><td>${E(source.receiptNo||'--')}<div class="small muted">${E(s.batch||'--')}</div></td><td>${E(W(s.warehouse))}</td><td>${vissText37(s.qty)}${bagsShown43(s)}</td><td>${lot?vissText37(lot.qty):'--'}</td></tr>`;}));
 };
 const previousRender=window.render;
 window.render=function(){previousRender();if(page==='sales'&&document.getElementById('saleTraceRows43'))saleTraceRender43();};
 const previousSaleRows=window.renderSaleRows;
 window.renderSaleRows=function(){previousSaleRows();if(document.getElementById('saleTraceRows43'))saleTraceRender43();};
})();

