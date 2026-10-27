
/* V84: requested inventory tab order and owner-overview date-bar presentation.
   Reuse V83 layout and native report/date handlers without changing their results. */
(function(){
 const previous=ownerPage;
 ownerPage=function(){
  return previous()
   .replace('class="owner-date-filter"','class="owner-date-filter stock-ledger-range83 owner-overview-range84"')
   .replace('<strong>Date Range</strong>','<strong>ရက်ကာလရွေးရန်</strong>')
   .replace('>From Date<input','>စရက်<input')
   .replace('>To Date<input','>ဆုံးရက်<input')
   .replace('အဝယ်၊ အရောင်းနှင့် အသုံးစရိတ်ကို Date Range အလိုက် စစ်ထုတ်ပါမည်။','အဝယ်၊ အရောင်းနှင့် အသုံးစရိတ်၏ စာရင်းရက်ကို ရွေးပါ။');
 };
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
 if(page==='owner'&&!workView)render();
})();
