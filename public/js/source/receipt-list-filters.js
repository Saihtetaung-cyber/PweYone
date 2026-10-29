
/* Version 2: receiving-list filters only; keep voucher grouping and native actions. */
(function(){
 'use strict';
 const dates={from:'',to:''};
 function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
 function issue(){return (dates.from&&!validDate(dates.from)||dates.to&&!validDate(dates.to))?'မှန်ကန်သော ရက်စွဲကို ရွေးပါ။':dates.from&&dates.to&&dates.from>dates.to?'စရက်သည် ဆုံးရက်ထက် မကျော်ရပါ။':'';}
 window.receiptDateMatches2=function(date){
  if(issue())return false;
  if(!dates.from&&!dates.to)return true;
  return validDate(date)&&(!dates.from||date>=dates.from)&&(!dates.to||date<=dates.to);
 };
 function showIssue(){const e=document.getElementById('receiptDateError2');if(e){e.textContent=issue();e.hidden=!e.textContent;}}
 window.receiptDatesChanged2=function(){
  dates.from=document.getElementById('receiptFrom2')?.value||'';dates.to=document.getElementById('receiptTo2')?.value||'';
  showIssue();renderReceiptRows();
 };
 window.clearReceiptFilters2=function(){
  dates.from='';dates.to='';searchTerm='';
  for(const id of ['receiptFrom2','receiptTo2','receiptSearch']){const el=document.getElementById(id);if(el)el.value='';}
  showIssue();renderReceiptRows();
 };
 const previousPage=receiptsPage;
 receiptsPage=function(...args){
  const root=document.createElement('div');root.innerHTML=previousPage.apply(this,args);
  const toolbar=root.querySelector('.toolbar'),search=toolbar?.querySelector('.search'),rows=root.querySelector('#receiptRows');
  if(!toolbar||!search||!rows)return root.innerHTML;
  toolbar.classList.add('receipt-tabs-toolbar2');search.remove();
  const controls=document.createElement('div');controls.className='receipt-search-controls2';
  controls.innerHTML='<div class="receipt-text-filter2"><label for="receiptSearch">အမည် / ကုန် ရှာရန်</label>'+search.outerHTML+'</div>'+
   '<label for="receiptFrom2">ကုန်ဝင်ရက် မှ<input type="date" id="receiptFrom2" value="'+E(dates.from)+'" onchange="receiptDatesChanged2()"></label>'+
   '<label for="receiptTo2">ကုန်ဝင်ရက် အထိ<input type="date" id="receiptTo2" value="'+E(dates.to)+'" onchange="receiptDatesChanged2()"></label>'+
   '<button type="button" class="btn btn-secondary receipt-clear2" onclick="clearReceiptFilters2()">Filter ရှင်းမယ်</button>';
  rows.before(controls);
  const errorNode=document.createElement('p');errorNode.id='receiptDateError2';errorNode.className='receipt-date-error2';errorNode.setAttribute('role','alert');errorNode.textContent=issue();errorNode.hidden=!errorNode.textContent;rows.before(errorNode);
  return root.innerHTML;
 };
 if(page==='receipts'&&!workView)render();
})();

