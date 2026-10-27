
/* V80: colocate the existing staff adjustment action and saved history.
   Native adjustment validation, amounts, posting and role visibility stay intact. */
(function(){
 const previous=renderInventoryBody;
 renderInventoryBody=function(){
  const result=previous();
  if(invTab!=='adjustments')return result;
  const root=document.getElementById('inventoryBody');if(!root)return result;
  const records=root.innerHTML;
  root.innerHTML='<div id="adjustmentWorkspace80"><div class="adjust80-header"><div><h3>ကုန်ချိန်ညှိ</h3><p>ကုန်လက်ကျန် တိုး / လျှော့ကို အကြောင်းပြချက်နှင့် မှတ်တမ်းတင်ပါ။</p></div>'+(state.role==='staff'?btn('ကုန်ချိန်ညှိအသစ်','openAdjustment()','primary','plus'):'')+'</div><section class="card adjust80-history"><h3>ကုန်ချိန်ညှိထားသော မှတ်တမ်းများ</h3>'+records+'</section></div>';
  return result;
 };
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
})();
