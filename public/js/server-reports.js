(function(){
 'use strict';
 const cache=new Map();let current=null;
 async function report(kind,params){
  const query=new URLSearchParams(params),key=kind+'?'+query+'#'+(state.activity[0]?.id||'initial');
  if(!cache.has(key))cache.set(key,fetch('/api/reports/'+kind+'?'+query,{credentials:'same-origin',headers:{Accept:'application/json'}}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.message||'Report unavailable.');return data;}).catch(e=>{cache.delete(key);throw e;}));
  return cache.get(key);
 }
 const formatted=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(Number(n));
 async function refresh(){
  if(page==='owner'&&!workView){
   const root=document.getElementById('main'),params={from:ownerDateFrom||'1900-01-01',to:ownerDateTo||state.day};
   try{const x=await report('overview',params);if(page!=='owner'||workView||params.from!==(ownerDateFrom||'1900-01-01')||params.to!==(ownerDateTo||state.day))return;
    root.querySelectorAll('.v2-kpi,.stat').forEach(card=>{const label=card.querySelector('.label,.stat-top>span')?.textContent||'';const key=label.includes('ကာလအတွင်း အဝယ်')?'purchaseGross':label.includes('ကာလအတွင်း အရောင်း')?'saleNet':label.includes('ကာလအတွင်း အသုံးစရိတ်')?'expenses':null;const value=card.querySelector('.value,.stat-value');if(key&&value){if(value.firstChild?.nodeType===3)value.firstChild.nodeValue=formatted(x[key]);else value.textContent=formatted(x[key]);}});
   }catch(e){const box=document.createElement('p');box.setAttribute('role','alert');box.textContent=e.message;root.prepend(box);}
  }
  if(page==='profit'&&!workView){
   const root=document.getElementById('pnl52');if(!root)return;
   const params={from:ownerDateFrom||'1900-01-01',to:ownerDateTo||state.day},token=JSON.stringify(params);current=token;
   const metric=root.querySelectorAll('.pnl52-metric strong');metric.forEach(e=>e.textContent='…');
   try{const x=await report('profit',params);if(page!=='profit'||current!==token)return;
    const values=[x.totalRevenue,x.cogs,x.operatingExpenses,x.netProfit];metric.forEach((e,i)=>{if(values[i]!==undefined)e.textContent=formatted(values[i])+' ကျပ်';});
    const byText={'ပွဲရုံပိုင်ကုန် အရောင်းတန်ဖိုး':x.ownedRevenue,'စုစုပေါင်း ရငွေ':x.totalRevenue,'ရောင်းပြီးကုန်၏ ဝယ်ရင်း':x.cogs,'အကြမ်းအမြတ်':x.grossProfit,'ပွဲရုံခံ အသုံးစရိတ်':x.operatingExpenses,'အသားတင် အမြတ် / အရှုံး (ယာယီ)':x.netProfit};
    root.querySelectorAll('.pnl52-line').forEach(row=>{const label=row.querySelector('span')?.textContent;if(label in byText)row.querySelector('strong').textContent=formatted(byText[label])+' ကျပ်';});
   }catch(e){metric.forEach(el=>el.textContent='—');const box=document.createElement('p');box.setAttribute('role','alert');box.textContent=e.message;root.prepend(box);}
  }
  if(page==='inventory'&&invTab==='ledger'&&!workView&&window.stockLedger2){
   const ui=stockLedger2.filters;const params={from:ui.from,to:ui.to,...(ui.warehouse?{warehouse_id:ui.warehouse}:{}),...(ui.owner?{owner:ui.owner}:{})};
   try{const x=await report('stock',params);if(page!=='inventory'||invTab!=='ledger')return;
    document.querySelectorAll('.sl2-summary-table tbody tr:not(.sl2-extra)').forEach(row=>{const name=row.querySelector('td strong')?.textContent;const p=state.masters.products.find(p=>p.name===name),g=x.groups.find(g=>g.product_id===Number(p?.id));if(!g)return;const cells=row.querySelectorAll('td');[g.opening,g.physicalIn,g.physicalOut,g.otherChange,g.closing].forEach((n,i)=>{if(cells[i+1])cells[i+1].textContent=(i===0&&g.openingUnknown)||(i===4&&g.unknown)?'—':formatted(n);});});
   }catch(e){const root=document.getElementById('inventoryBody');if(root){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=e.message;root.prepend(p);}}
  }
 }
 const renderBase=render;render=function(...args){const result=renderBase.apply(this,args);refresh();return result;};
 const ledgerBase=renderInventoryBody;renderInventoryBody=function(...args){const result=ledgerBase.apply(this,args);if(invTab==='ledger')queueMicrotask(refresh);return result;};
 window.printPnL52=async()=>{try{const x=await report('profit',{from:ownerDateFrom||'1900-01-01',to:ownerDateTo||state.day});const rows=[['ပွဲရုံပိုင်ကုန် အရောင်း',x.ownedRevenue],['အတည်ပြုပြီး ကောက်ခံခ',x.serviceRevenue],['ရောင်းပြီးကုန်၏ ဝယ်ရင်း',x.cogs],['ပွဲရုံခံ အသုံးစရိတ်',x.operatingExpenses],['အသားတင် အမြတ် / အရှုံး (ယာယီ)',x.netProfit]];printDocument('အရှုံးအမြတ် (ယာယီ)',x.from+' → '+x.to,table4(['အကြောင်းအရာ','ကျပ်'],rows.map(([label,n])=>'<tr><td>'+E(label)+'</td><td>'+E(formatted(n))+'</td></tr>')));}catch(e){toast(e.message,true);}};
 window.addEventListener('pwe:workspace-change',()=>{cache.clear();current=null;});
 window.pweReports={report,refresh};refresh();
})();
