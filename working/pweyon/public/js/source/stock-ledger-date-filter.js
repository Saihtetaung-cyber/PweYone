
/* V83: inventory tab order and ledger-only date-control layout.
   Reuse all native date fields, presets and range handlers. */
function stockLedgerDateFilter83(){
 return ownerDateFilterBar('ကုန်လယ်ဂျာ၏ စာရင်းရက်ကို ရွေးပါ။')
  .replace('class="owner-date-filter"','class="owner-date-filter stock-ledger-range83"')
  .replace('<strong>Date Range</strong>','<strong>ရက်ကာလရွေးရန်</strong>')
  .replace('>From Date<input','>စရက်<input')
  .replace('>To Date<input','>ဆုံးရက်<input');
}
document.title='ပွဲရုံ · Version 2 Daily Closing UI';
