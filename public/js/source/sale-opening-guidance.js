
/* Sales opening-cash guidance. */
(function(){
 'use strict';
 document.title='ပွဲရုံ · V45 Trader Only';
 const firstSalePage44=window.salesPage;
 window.salesPage=function(){
   const html=firstSalePage44();
   if(state.opening?.checked)return html;
   const guide=
    '<div id="saleDemoGuide44" class="demo-warn"><div class="row"><div><strong>အရောင်းမစခင် နေ့ဖွင့်ငွေ စစ်ရန် လိုအပ်ပါသည်။</strong><div>အဖွင့်ငွေ '+cashText(state.opening.expected)+' ထည့်၍ “စစ်ဆေးချက် တင်မယ်” ကို နှိပ်ပြီးမှ အရောင်းဖောင်ကို စမ်းပါ။</div></div>'+btn('နေ့ဖွင့်ငွေ စစ်မယ်','openCashCheck()','secondary')+'</div></div>';
   return html.replace('<div class="toolbar">',guide+'<div class="toolbar">');
 };
})();
