
/* V79: replace the inventory packaging tab label, colocate its native action
   with existing history, and return here after native packaging saves. */
(function(){
 const previous=renderInventoryBody;
 renderInventoryBody=function(){
  const result=previous();
  if(invTab!=='packages')return result;
  const root=document.getElementById('inventoryBody');if(!root)return result;
  const records=root.innerHTML;
  root.innerHTML='<div id="packagingWorkspace79"><div class="pack79-header"><div><h3>အသုတ်မှ ထုပ်ပိုးမည်</h3><p>ကုန်အသုတ်ရွေးပြီး ထုပ်ပိုးပါ။ သိမ်းထားသော မှတ်တမ်းများကို အောက်တွင် ကြည့်နိုင်ပါသည်။</p></div>'+btn('ထုပ်ပိုးအသစ်','openPackaging()','primary','plus')+'</div><section class="card pack79-history"><h3>ထုပ်ပိုးထားသော မှတ်တမ်းများ</h3>'+records+'</section></div>';
  return result;
 };
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
})();
