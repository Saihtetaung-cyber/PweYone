
/* Version 2: a submitted cash check permits work; owner review remains separate. */
(function(){
 'use strict';
 function allowSubmittedCheck(){
  const o=state.opening;
  if(o?.status==='pending'&&Number.isFinite(o.actual)&&Number.isFinite(o.difference)&&!o.checked){o.checked=true;return true;}
  return false;
 }
 const originalInit=initV4;
 initV4=function(...args){const result=originalInit.apply(this,args);allowSubmittedCheck();return result;};
 window.openingPendingRecords2=function(){
  const rows=new Map();
  for(const day of state.days||[])if(day.opening?.status==='pending')rows.set(day.date,{date:day.date,opening:day.opening,current:false});
  if(state.opening?.status==='pending')rows.set(today(),{date:today(),opening:state.opening,current:true});
  return [...rows.values()].sort((a,b)=>b.date.localeCompare(a.date));
 };
 function notice(){
  if(!canViewAccount68('cash'))return '';
  if(state.role==='owner'){
   const count=openingPendingRecords2().length;
   if(!count)return '';
   return `<section class="opening-pending2 mb" aria-label="အဖွင့်ငွေ အတည်ပြုရန်ကျန်"><div><strong>အဖွင့်ငွေ အတည်ပြုရန်ကျန် <span class="pill amber">Pending · ${count}</span></strong><p>ငွေကွာဟချက်များကို ကြည့်ပြီး အဆင်ပြေသည့်အချိန် အတည်ပြုနိုင်ပါသည်။</p></div>${btn('ကွာဟချက်များ ကြည့်မယ်','openOpeningPending2()','secondary','eye')}</section>`;
  }
  if(state.opening?.status!=='pending')return '';
  return `<section class="opening-pending2 mb"><div><strong>အဖွင့်ငွေ စစ်ချက်တင်ပြီး <span class="pill amber">Pending</span></strong><p>ပိုင်ရှင်အတည်ပြုရန် စောင့်ဆိုင်းနေစဉ် မိမိလုပ်ပိုင်ခွင့်အတိုင်း အလုပ်ဆက်လုပ်နိုင်ပါသည်။</p></div>${btn('စစ်ဆေးချက် ကြည့်မယ်','openCashCheck()','secondary','eye')}</section>`;
 }
 const originalHome=homePage,originalOwner=ownerPage;
 homePage=function(...args){allowSubmittedCheck();return notice()+originalHome.apply(this,args);};
 ownerPage=function(...args){allowSubmittedCheck();return notice()+originalOwner.apply(this,args);};
 window.openOpeningPending2=function(){
  if(!owner4()||!canViewAccount68('cash'))return;
  const rows=openingPendingRecords2();
  const table=table4(['ရက်စွဲ','မျှော်မှန်းဖွင့်ငွေ','လက်တွေ့ဖွင့်ငွေ','ကွာဟချက်','အကြောင်းပြချက်','တင်သည့်ရက် / အချိန်','ဆက်လုပ်ရန်'],rows.map(({date,opening:o})=>{
   const stamp=o.submittedAt?new Date(o.submittedAt):null;
   const time=stamp&&!Number.isNaN(stamp.getTime())?stamp.toLocaleString('en-GB',{timeZone:'Asia/Rangoon'}):'—';
   return `<tr><td>${E(shortDate(date))}<div class="sub">Pending</div></td><td>${cashText(o.expected)}</td><td>${cashText(o.actual)}</td><td><strong class="danger-text">${cashText(o.difference)}</strong></td><td>${E(o.note)||'—'}</td><td>${E(time)}</td><td>${btn('အတည်ပြုမယ်',`approvePendingOpening2('${date}')`,'primary','check')}</td></tr>`;
  }));
  openModal('အဖွင့်ငွေ အတည်ပြုရန်ကျန်','ယခင်ရက်များ၏ Pending မှတ်တမ်းများကိုလည်း ဆက်လက်အတည်ပြုနိုင်ပါသည်။',`<div class="mb">${note('ပိုင်ရှင်အတည်ပြုရန် စောင့်ဆိုင်းနေစဉ် မိမိလုပ်ပိုင်ခွင့်အတိုင်း အလုပ်ဆက်လုပ်နိုင်ပါသည်။','blue')}</div>${table}<div class="mt">${note('အတည်ပြုခြင်းသည် ငွေဝင်စာရင်းအသစ် မဟုတ်ပါ။ ကွာဟချက်ကို စာရင်းလက်ကျန်သို့ အလိုအလျောက် မပေါင်းပါ။')}</div>`,btn('ပြန်မယ်','closeModal()','secondary'));
 };
 window.approvePendingOpening2=function(date){
  if(!owner4()||!canViewAccount68('cash'))return;
  const record=openingPendingRecords2().find(row=>row.date===date);
  if(!record)return;
  if(record.current)return approveOpening4(true);
  Object.assign(record.opening,{checked:true,status:'approved',approver:'ပိုင်ရှင်/စီမံခန့်ခွဲသူ',approvedAt:new Date().toLocaleString('en-GB',{timeZone:'Asia/Rangoon'})});
  audit4(shortDate(date)+' နေ့ဖွင့်ငွေကွာဟချက် အတည်ပြုခဲ့သည်။');
  done4('အတည်ပြုပြီးပါပြီ။');
 };
 const migrated=allowSubmittedCheck();
 if(migrated)save();
 render();
})();

