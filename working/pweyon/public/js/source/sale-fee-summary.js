
/* V67: Sale fees are additions; purchase deductions and historical records remain unchanged. */
(function(){
 const previous=chargesSummary4;
 chargesSummary4=function(c){
   if(c?.chargeTreatment67!=='add')return previous(c);
   const items=[['ပွဲခ / ဝန်ဆောင်ခ',c.serviceFee],['လုပ်သားခ',c.labor],...(c.dynamicRows||[]).map(x=>[x.label||x.name||'အခြားအခ',x.amount])];
   return '<section class="v41-details-card v41-itemized"><h3>အရောင်း ထပ်ပေါင်းငွေအသေးစိတ်</h3>'+items.filter(x=>Number(x[1])>0).map(x=>row4(E(x[0]),'+ '+cashText(x[1]))).join('')+row4('စုစုပေါင်း ထပ်ပေါင်းငွေ',cashText(c.total))+row4('စုစုပေါင်း ကျသင့်ငွေ',cashText(c.gross+c.total))+'</section>';
 };
 document.title='ပွဲရုံ · V67 Purchase Deductions / Sale Additions';
})();
