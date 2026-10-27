
/* V44 sales-only test usability: guides the required cash opening and lets
   users try a sample trader/batch in the current SALE form without saving it. */
(function(){
 'use strict';
 document.title='ပွဲရုံ · V45 Trader Only';
 const esc44 = s => E(String(s));
 const firstSalePage44=window.salesPage;
 window.salesPage=function(){
   const html=firstSalePage44();
   const checked=!!state.opening?.checked;
   const guide=checked?
    '<div id="saleDemoGuide44" class="note blue"><div class="row"><div><strong>အရောင်းစမ်းသပ်ရန် အဆင်သင့်ဖြစ်ပါပြီ။</strong><div>“ကုန်ရောင်းမယ်” ကိုနှိပ်ပါ။ ဖောင်ထဲက “နမူနာ Batch ဖြည့်စမ်းမယ်” ကို နှိပ်ပြီး ကုန်သည်နဲ့ Batch ကို တစ်ခါတည်း ရွေးနိုင်ပါတယ်။ Save ကို ကိုယ်တိုင် အတည်ပြုရပါမယ်။</div></div></div></div>':
    '<div id="saleDemoGuide44" class="demo-warn"><div class="row"><div><strong>အရောင်းမစခင် နေ့ဖွင့်ငွေ စစ်ရန် လိုအပ်ပါသည်။</strong><div>အဖွင့်ငွေ '+cashText(state.opening.expected)+' ထည့်၍ “စစ်ဆေးချက် တင်မယ်” ကို နှိပ်ပြီးမှ အရောင်းဖောင်ကို စမ်းပါ။</div></div>'+btn('နေ့ဖွင့်ငွေ စစ်မယ်','openCashCheck()','secondary')+'</div></div>';
   return html.replace('<div class="toolbar">',guide+'<div class="toolbar">');
 };
 const prevSaleForm44=window.voucherForm4;
 window.voucherForm4=function(rs){
   prevSaleForm44(rs);
   if(v4Kind!=='sale')return;
   const rows=document.getElementById('voucherLines4');
   if(!rows||document.getElementById('saleDemoForm44'))return;
   rows.insertAdjacentHTML('beforebegin',
     '<div id="saleDemoForm44" class="sale-demo-note44"><strong>ကုန်သည် / ကုန်အသုတ် အရောင်း စမ်းသပ်ရန်</strong><div>နမူနာ Batch တစ်ခုကို အလိုအလျောက် ဖြည့်ကြည့်နိုင်ပါတယ်။ စစ်ဆေး၊ ပြင်ဆင်ပြီးမှ “အရောင်း သိမ်းမယ်” ကိုနှိပ်ပါ။</div>'+ 
     btn('နမူနာ Batch ဖြည့်စမ်းမယ်','fillSampleSale44()','secondary','check')+
     '<div id="saleDemoFeedback44" role="status" aria-live="polite"></div></div>');
 };
 window.fillSampleSale44=function(){
   if(v4Kind!=='sale')return;
   // Use only existing stock. Never create fake stock or commit a sale.
   const lot=(state.lots||[]).find(x=>x.owner==='supplier'&&x.qty>0&&x.weightKnown!==false);
   const feedback=document.getElementById('saleDemoFeedback44');
   if(!lot){if(feedback)feedback.textContent='စမ်းသပ်ရန် ကုန်သည်ပိုင် Batch လက်ကျန်မရှိပါ။ ကုန်လက်ခံမှတ်တမ်းတွင် ကုန်ရှိ/မရှိ စစ်ပါ။';return;}
   if(!document.querySelector('#voucherLines4 .req-line'))addVoucherLine4();
   const row=document.querySelector('#voucherLines4 .req-line');
   const i=row.dataset.i;
   const owner=document.getElementById('fSaleOwner60');
   if(owner){owner.value='supplier';saleOwnerChanged43();}
   const prod=document.getElementById('vsp59'+i);prod.value=lot.product;saleProductChanged43(i);
   const origin=document.getElementById('vso43'+i);
   const receipt=(state.receipts||[]).find(r=>r.id===lot.receiptId);
   const name=String(receipt?.name||lot.originSupplierName||lot.name||'').trim();
   const partnerId=String(receipt?.partnerId||lot.partnerId||lot.originPartnerId||'');
   const options=[...origin.options];
   const originOption=options.find(o=>o.value===partnerId&&o.value!=='')||
      options.find(o=>o.value!==''&&o.textContent.trim()===name)||options.find(o=>o.value!=='');
   if(!originOption){if(feedback)feedback.textContent='သက်ဆိုင်ရာ ကုန်သည်မတွေ့ပါ။ ကိုယ်တိုင်ရွေးချယ်ပါ။';return;}
   origin.value=originOption.value;saleOriginChanged43(i);
   const wh=document.getElementById('vsw59'+i);wh.value=lot.warehouse;saleWarehouseChanged43(i);
   const batch=document.getElementById('vl'+i);batch.value=lot.id;saleBatchChanged43(i);
   const qty=document.getElementById('vq'+i), price=document.getElementById('vr'+i);
   if(qty){qty.value=String(Math.min(30,Math.floor(Number(lot.qty)*100)/100));qty.dispatchEvent(new Event('input',{bubbles:true}));}
   if(price){price.value='2500';price.dispatchEvent(new Event('input',{bubbles:true}));}
   calcVoucher4();
   if(feedback)feedback.textContent='နမူနာထည့်ပြီးပါပြီ — '+name+' / '+String(lot.batch||lot.id)+' ။ 2,500 ကျပ်သည် စမ်းသပ်ရန် နမူနာဈေးသာဖြစ်ပါသည်။ Save မလုပ်ရသေးပါ။';
   row.scrollIntoView({behavior:'smooth',block:'center'});
 };
})();
