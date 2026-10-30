(function(){
 'use strict';
 const tab='adjustments',titles={purchase:'အဝယ်',sale:'အရောင်း',settlement:'ကုန်သည်ငွေရှင်း'};
 const baseCategories=[{id:'labor',label:'လုပ်သားခ'},{id:'service',label:'ဝန်ဆောင်ခ'},{id:'other',label:'အခြားပေါင်းနုတ်ငွေ'}];
 let filters=null,categories=baseCategories,request=0,currentRows=[];
 const $=id=>document.getElementById(id);
 const money=value=>{
  const match=String(value).match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if(!match)return '—';
  const fraction=(match[3]||'').padEnd(2,'0');
  return match[1]+BigInt(match[2]).toLocaleString('en-US')+(fraction==='00'?'':'.'+fraction)+' ကျပ်';
 };
 const options=(rows,selected)=>'<option value="">အားလုံး</option>'+rows.map(row=>`<option value="${E(row.id)}" ${selected===row.id?'selected':''}>${E(row.label)}</option>`).join('');
 function panel(){
  filters??={from:state.day,to:state.day,direction:'',category:'',q:'',source_kind:''};
  return `<section class="card adjustment-ledger"><h2>ပေါင်းနုတ်ငွေစာရင်း</h2><p class="field-help">မူရင်းဘောက်ချာတွင် သိမ်းထားသော ပေါင်းငွေနှင့် နုတ်ငွေများကို ပြထားပါသည်။</p>
   <form id="adjustmentFilters" class="adjustment-filters" onsubmit="event.preventDefault();applyAdjustmentFilters()">
    <label>မှရက်<input id="adjFrom" type="date" required value="${E(filters.from)}"></label>
    <label>အထိရက်<input id="adjTo" type="date" required value="${E(filters.to)}"></label>
    <label>ပေါင်းငွေ / နုတ်ငွေ<select id="adjDirection">${options([{id:'add',label:'ပေါင်းငွေ'},{id:'subtract',label:'နုတ်ငွေ'}],filters.direction)}</select></label>
    <label>အကြောင်းအရာ<select id="adjCategory">${options(categories,filters.category)}</select></label>
    <label class="adjustment-search">အမည် / ဘောက်ချာနံပါတ်<input id="adjSearch" type="search" maxlength="200" value="${E(filters.q)}" placeholder="အမည် သို့မဟုတ် ဘောက်ချာနံပါတ်ဖြင့် ရှာပါ"></label>
    <label>မူရင်းစာရင်း<select id="adjSource">${options(Object.entries(titles).map(([id,label])=>({id,label})),filters.source_kind)}</select></label>
    <div class="adjustment-buttons"><button type="submit" class="btn btn-primary">ရှာမယ်</button><button type="button" class="btn btn-secondary" onclick="resetAdjustmentFilters()">Filter ရှင်းမယ်</button></div>
   </form><div id="adjustmentResults" aria-live="polite"></div></section>`;
 }
 function results(data){
  const totals=data.totals;
  return `<div class="adjustment-summary">${[['ပေါင်းငွေ စုစုပေါင်း',totals.additions],['နုတ်ငွေ စုစုပေါင်း',totals.deductions],['အသားတင် စုစုပေါင်း',totals.net]].map(([label,amount])=>`<div><span>${label}</span><strong>${E(money(amount))}</strong></div>`).join('')}</div>
   <p class="field-help">မှတ်တမ်း ${N(data.count)} ခု</p><div class="table-wrap"><table><thead><tr><th>ရက်စွဲ / အချိန်</th><th>ဘောက်ချာ / အမည်</th><th>မူရင်းစာရင်း</th><th>ပေါင်း / နုတ်</th><th>အကြောင်းအရာ</th><th class="right">ငွေပမာဏ</th><th>အသေးစိတ်</th></tr></thead>
    <tbody>${data.rows.length?data.rows.map((row,index)=>`<tr><td>${E(shortDate(row.date))}<div class="sub">${E(row.recordedAt||'')}</div></td><td><strong>${E(row.voucher)}</strong><div class="sub">${E(row.party)}</div></td><td>${titles[row.kind]||'—'}</td><td><span class="pill ${row.direction==='add'?'blue':'amber'}">${row.direction==='add'?'ပေါင်းငွေ':'နုတ်ငွေ'}</span></td><td>${E(row.label)}${row.rate!==null?`<div class="sub">${E(row.rate)}%</div>`:''}</td><td class="right nowrap">${row.direction==='add'?'+ ':''}${E(money(row.signedAmount))}</td><td>${row.linkId?`<button type="button" class="btn btn-secondary btn-sm" onclick="openAdjustmentVoucher(${index})">အသေးစိတ်</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7" class="muted">ရှာဖွေမှုနှင့် ကိုက်ညီသော ပေါင်းနုတ်ငွေ မရှိပါ။</td></tr>'}</tbody>
    <tfoot><tr><th colspan="5">ပေါင်းငွေ စုစုပေါင်း</th><td class="right" colspan="2">${E(money(totals.additions))}</td></tr><tr><th colspan="5">နုတ်ငွေ စုစုပေါင်း</th><td class="right" colspan="2">${E(money(totals.deductions))}</td></tr><tr class="adjustment-net"><th colspan="5">အသားတင် စုစုပေါင်း (Total)<div class="sub">ပေါင်းငွေ − နုတ်ငွေ</div></th><td class="right" colspan="2">${E(money(totals.net))}</td></tr></tfoot></table></div>
   <p class="field-help">ပြထားသော ဘောက်ချာပေါင်းနုတ်ငွေများ၏ စုစုပေါင်းဖြစ်ပြီး ငွေလက်ခံ/ပေးချေမှုအသစ် မဟုတ်ပါ။</p>`;
 }
 async function load(){
  const target=$('adjustmentResults'),token=++request;if(!target)return;
  currentRows=[];target.innerHTML='<p role="status">စာရင်းဖတ်နေပါသည်…</p>';
  try{
   const query=new URLSearchParams(Object.entries(filters).filter(([,value])=>value!==''));
   const response=await fetch('/api/reports/adjustments?'+query,{credentials:'same-origin',headers:{Accept:'application/json'}});
   const data=await response.json();
   if(token!==request||cashTab!==tab||!target.isConnected)return;
   if(!response.ok)throw Error(Object.values(data.errors||{}).flat().join(' ')||data.message||'စာရင်းဖတ်မရပါ။');
   categories=data.categories;currentRows=data.rows;
   if($('adjCategory'))$('adjCategory').innerHTML=options(categories,filters.category);
   target.innerHTML=results(data);
  }catch(error){if(token===request&&target.isConnected)target.innerHTML=`<p role="alert" class="form-error">${E(error.message)}</p>`;}
 }
 window.applyAdjustmentFilters=function(){
  const form=$('adjustmentFilters');if(!form?.reportValidity())return;
  ++request;
  filters={from:$('adjFrom').value,to:$('adjTo').value,direction:$('adjDirection').value,category:$('adjCategory').value,q:$('adjSearch').value.trim(),source_kind:$('adjSource').value};
  if(filters.from>filters.to){$('adjustmentResults').innerHTML='<p role="alert" class="form-error">အထိရက်သည် မှရက်ထက် မစောရပါ။</p>';currentRows=[];return;}
  load();
 };
 window.resetAdjustmentFilters=function(){filters=null;renderCashBody();};
 window.openAdjustmentVoucher=function(index){
  const row=currentRows[index];if(!row?.linkId)return;
  if(row.kind==='purchase')receiptDetail4(row.linkId);
  else if(row.kind==='sale')saleDetail4(row.linkId);
  else openTrader74(row.linkId);
 };
 const cashBodyBase=renderCashBody;
 renderCashBody=function(...args){
  if(cashTab!==tab)return cashBodyBase.apply(this,args);
  const root=$('cashBody');if(root){root.innerHTML=panel();load();}
 };
 window.addEventListener('pwe:workspace-change',()=>{++request;currentRows=[];categories=baseCategories;});
})();
