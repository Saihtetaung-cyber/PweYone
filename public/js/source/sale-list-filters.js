
/* Version 2: sales-list filters only; keep voucher grouping and native actions. */
(function(){
 'use strict';
 const dates={from:'',to:''};
 function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
 function issue(){return (dates.from&&!validDate(dates.from)||dates.to&&!validDate(dates.to))?'မှန်ကန်သော ရက်စွဲကို ရွေးပါ။':dates.from&&dates.to&&dates.from>dates.to?'စရက်သည် ဆုံးရက်ထက် မကျော်ရပါ။':'';}
 window.saleDateMatches2=function(date){
  if(issue())return false;
  if(!dates.from&&!dates.to)return true;
  return validDate(date)&&(!dates.from||date>=dates.from)&&(!dates.to||date<=dates.to);
 };
 function showIssue(){const e=document.getElementById('saleDateError2');if(e){e.textContent=issue();e.hidden=!e.textContent;}}
 window.saleDatesChanged2=function(){
  dates.from=document.getElementById('saleFrom2')?.value||'';dates.to=document.getElementById('saleTo2')?.value||'';
  showIssue();renderSaleRows();
 };
 window.clearSaleFilters2=function(){
  dates.from='';dates.to='';searchTerm='';
  for(const id of ['saleFrom2','saleTo2','saleSearch']){const el=document.getElementById(id);if(el)el.value='';}
  showIssue();renderSaleRows();
 };
 const previousPage=salesPage;
 salesPage=function(...args){
  const root=document.createElement('div');root.innerHTML=previousPage.apply(this,args);
  const toolbar=root.querySelector('.toolbar'),search=toolbar?.querySelector('.search'),rows=root.querySelector('#saleRows');
  if(!toolbar||!search||!rows)return root.innerHTML;
  toolbar.classList.add('sale-tabs-toolbar2');search.remove();
  const controls=document.createElement('div');controls.className='sale-search-controls2';
  controls.innerHTML='<div class="sale-text-filter2"><label for="saleSearch">အမည် / ကုန် ရှာရန်</label>'+search.outerHTML+'</div>'+
   '<label for="saleFrom2">အရောင်းရက် မှ<input type="date" id="saleFrom2" value="'+E(dates.from)+'" onchange="saleDatesChanged2()"></label>'+
   '<label for="saleTo2">အရောင်းရက် အထိ<input type="date" id="saleTo2" value="'+E(dates.to)+'" onchange="saleDatesChanged2()"></label>'+
   '<button type="button" class="btn btn-secondary sale-clear2" onclick="clearSaleFilters2()">Filter ရှင်းမယ်</button>';
  rows.before(controls);
  const errorNode=document.createElement('p');errorNode.id='saleDateError2';errorNode.className='sale-date-error2';errorNode.setAttribute('role','alert');errorNode.textContent=issue();errorNode.hidden=!errorNode.textContent;rows.before(errorNode);
  return root.innerHTML;
 };
 if(page==='sales'&&!workView)render();
})();

