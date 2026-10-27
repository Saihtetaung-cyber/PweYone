
/* Version 2: independent empty test workspace; ordinary saves and all business flows stay intact. */
(function(){
 'use strict';
 const settingsArrays=new Set(['warehouses','laborBagRates','laborRateMasters51','laborMaelMasters51','coa50']);
 function currentDate(){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=kind=>parts.find(x=>x.type===kind).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
 }
 function emptyState(){
  const fresh=JSON.parse(JSON.stringify(state));
  // Clear every transaction/history array, including extensions loaded by later revisions.
  for(const [key,value] of Object.entries(fresh))if(Array.isArray(value)&&!settingsArrays.has(key))fresh[key]=[];
  fresh.masters.products=[];fresh.masters.partners=[];fresh.masters.changes=[];fresh.masters.notes=[];
  fresh.packTypes=[];
  fresh.day=currentDate();fresh.role='staff';fresh.counter=Math.max(100,Number(fresh.counter)||100);
  fresh.bases=Object.fromEntries(fresh.masters.accounts.map(a=>[a.id,0]));
  fresh.masters.accounts.forEach(a=>{a.openingBalance=0;delete a.openingDate;delete a.pendingOpening69;});
  fresh.opening={checked:false,expected:0,actual:null,difference:0,note:''};
  fresh.grounds={};fresh.prices={};fresh.priceDate=null;fresh.closed=false;fresh.closing=null;
  fresh.interestPolicy={...fresh.interestPolicy,rates:{}};
  delete fresh.initialOpening69;
  fresh.cleanStart2={schema:1,clearedAt:new Date().toISOString()};
  return fresh;
 }
 function persistEmpty(){
  const fresh=emptyState();
  try{
   throw new Error('Server business data cannot be reset here.');
   if(null!==JSON.stringify(fresh))throw Error('Storage verification failed');
  }catch(_){error('ဒေတာရှင်းပြီး သိမ်းမရပါ။ Browser ၏ သိမ်းဆည်းခွင့်ကို စစ်ပါ။');return false;}
  state=fresh;syncMasters();return true;
 }
 openReset=function(){
  openModal('စမ်းဒေတာများ ရှင်းပြီး အစပြန်စမလား။','အရောင်း၊ အဝယ်၊ ကုန်လက်ကျန်၊ ငွေလက်ကျန်နှင့် History များကို အလွတ်ပြန်ထားမည်။',
   note('ကုန်ပစ္စည်း၊ ကုန်သည်နှင့် ဝယ်သူစာရင်းများပါ ရှင်းမည်။ UI နှင့် အခြေခံသတ်မှတ်ချက်များကို ဆက်ထားမည်။ နမူနာဒေတာ ပြန်မထည့်ပါ။','amber'),
   btn('မဖျက်တော့ပါ','closeModal()','secondary')+btn('ဒေတာရှင်းပြီး ပြန်စမယ်','resetDemo()','danger','reset'));
 };
 resetDemo=function(){
  if(!persistEmpty())return;
  // Reload clears all in-memory form drafts, route snapshots and module-local selection state.
  workDirty=false;workView=null;pageSnapshots.clear();
  writeRoute('page',null,'home',true);
  location.reload();
 };
 const originalHome=homePage;
 homePage=function(...args){
  let html=originalHome.apply(this,args);
  if(!state.masters.products.length&&!state.receipts.length&&!state.sales.length){
   html=`<div class="clean-start-guide2 mb">${note('ဒေတာအလွတ်ဖြင့် စမ်းနိုင်ပါပြီ။ သတ်မှတ်ချက်တွင် ကုန်ပစ္စည်း၊ ကုန်သည်နှင့် ဝယ်သူများကို အရင်ထည့်ပါ။','blue')}<div class="mt">${btn('သတ်မှတ်ချက်များ ထည့်မယ်',"beginSetup('overview')",'secondary','settings')}</div></div>`+html;
  }
  return html+`<div class="v2-home-footer">${btn('ဒေတာရှင်းပြီး ပြန်စမယ်','openReset()','ghost','reset')}</div>`;
 };
 if(!state.cleanStart2){
  if(persistEmpty()){
   wizard=null;receiptWizard=null;productReturn=null;workView=null;workDirty=false;lastReceiptSaved=null;
   pageSnapshots.clear();invTab='overview';cashTab='movements';setupSection='overview';page='home';
   ownerDateFrom=state.day;ownerDateTo=state.day;ownerDatePreset='today';
   closeModal();writeRoute('page',null,'home',true);
  }
 }
 render();
})();

