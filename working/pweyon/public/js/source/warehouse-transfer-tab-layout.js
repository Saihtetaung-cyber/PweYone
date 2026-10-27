
/* V82: move native warehouse transfer action/history into one inventory tab.
   Stock splitting, source ownership, amounts and validation remain native. */
(function(){
 const previous=renderInventoryBody;
 function history82(){return `<section class="card transfer82-history"><h3>ဂိုဒေါင် ပြောင်းရွှေ့မှတ်တမ်းများ</h3>${table4(['ရက်','ကုန် / အသုတ်','မူလ → လက်ခံ','ပိဿာ','ပိုင်ရှင်'],state.transfers.map(t=>`<tr><td>${shortDate(t.date)}</td><td>${E(t.product)}<div class="small muted">${E(t.batch)}</div></td><td>${E(W(t.from))} → ${E(W(t.to))}</td><td>${vissText37(t.qty)}</td><td>${E(t.name)}</td></tr>`))}</section>`;}
 renderInventoryBody=function(){
  if(invTab!=='transfers')return previous();
  const root=document.getElementById('inventoryBody');if(!root)return;
  root.innerHTML='<div id="transferWorkspace82"><div class="transfer82-header"><div><h3>ဂိုဒေါင် ပြောင်းရွှေ့မည်</h3><p>ကုန်အသုတ်ရွေးပြီး ဂိုဒေါင်တစ်ခုမှ တစ်ခုသို့ ပြောင်းရွှေ့ပါ။</p></div>'+btn('ပြောင်းရွှေ့အသစ်','transfer4()','primary','plus')+'</div>'+history82()+'</div>';
 };
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
})();
