/* Opening Cash Flow Detail Update 2: server-backed review, evidence links and recount. */
(function(){
 'use strict';
 const labels={pending:'ပိုင်ရှင်စစ်ဆေးရန်',reviewed:'စစ်ဆေးပြီး · ဖြေရှင်းရန်ကျန်',linked:'စာရင်းချိန်ညှိပြီး',recounted:'ပြန်စစ်၍ ဖြေရှင်းပြီး',invalid:'ချိတ်ထားသောစာရင်း ပြန်စစ်ရန်',matched:'ငွေကိုက်ညီသည်'};
 const unresolved=o=>['pending','reviewed','invalid'].includes(o.status);
 const checks=()=>state.openingCashChecks||[];
 const find=id=>checks().find(o=>String(o.id)===String(id));
 const owner=()=>state.role==='owner'&&canViewAccount68('cash');
 const stamp=value=>{const d=value?new Date(value):null;return d&&!Number.isNaN(d.getTime())?d.toLocaleString('en-GB',{timeZone:'Asia/Yangon',hour12:false}):'—';};
 const status=o=>pill(labels[o.status]||'မစစ်ရသေးပါ',unresolved(o)?'blue':'green');
 function totals(o){return `<div class="opening-cash-totals"><div><span>စာရင်းအရ အဖွင့်ငွေ</span><strong>${cashText(o.expected)}</strong></div><div><span>လက်တွေ့ ရေတွက်ငွေ</span><strong>${cashText(o.actual)}</strong></div><div class="opening-cash-difference"><span>ငွေ${Number(o.difference)<0?'လို':'ပို'}ပမာဏ</span><strong>${cashText(Math.abs(Number(o.difference)))}</strong></div></div>`;}
 function history(o){
  if(!o.history?.length)return '';
  return `<details class="opening-cash-resolution"><summary>ယခင်ဖြေရှင်းမှတ်တမ်းများ (${o.history.length})</summary>${o.history.map(r=>`<section class="mt">${row4('ဖြေရှင်းသည့်အချိန်',E(stamp(r.resolvedAt)))}${row4('ဖြေရှင်းသူ',E(r.resolvedBy?.name)||'—')}${row4('ဖြေရှင်းသည့်အကြောင်း',E(r.note))}${r.method==='recount'?row4('ပြန်စစ်အဖွင့်ငွေ',cashText(r.actual)):(r.entries||[]).map(e=>`<p>${E(e.number||'#'+e.id)} · ${E(shortDate(e.date))} · ${cashText(e.amount)}</p>`).join('')}</section>`).join('')}</details>`;
 }
 function notice(){
  if(!canViewAccount68('cash'))return '';
  if(owner()){
   const all=checks().filter(o=>!['matched','unchecked'].includes(o.status));if(!all.length)return '';
   const rows=all.filter(unresolved);
   return `<section class="opening-pending2 mb"><div><strong>အဖွင့်ငွေကွာဟချက်</strong><p>စစ်ဆေးရန် ${rows.filter(o=>o.status==='pending').length} · ဖြေရှင်းရန်ကျန် ${rows.filter(o=>o.status!=='pending').length}</p></div>${btn('စစ်ချက်မှတ်တမ်း ကြည့်မယ်','openOpeningPending2()','secondary','eye')}</section>`;
  }
  const o=state.opening;if(!o.checked||!Number(o.difference))return '';
  return `<section class="opening-pending2 mb"><div><strong>အဖွင့်ငွေ စစ်ချက်တင်ပြီးပါပြီ</strong><p>မိမိလုပ်ပိုင်ခွင့်အတိုင်း အလုပ်ဆက်လုပ်နိုင်ပါသည်။</p>${status(o)}</div>${btn('စစ်ချက်ကြည့်မယ်','openCashCheck()','secondary','eye')}</section>`;
 }
 for(const name of ['homePage','ownerPage']){
  const before=window[name];window[name]=function(...args){return notice()+before.apply(this,args).replace(/<section class="opening-pending2\b[\s\S]*?<\/section>/g,'');};
 }
 window.openingPendingRecords2=()=>checks().filter(unresolved).map(o=>({date:o.date,opening:o,current:o.date===today()}));
 let filter='unresolved',listPage=1,currentId=null,currentFingerprint=null,refreshing=false;
 window.openOpeningPending2=function(next='unresolved',pageNumber=1){
  if(!owner())return;
  filter=next;listPage=pageNumber;
  const all=checks().filter(o=>!['matched','unchecked'].includes(o.status));
  const match=(o,key)=>key==='all'||(key==='unresolved'?unresolved(o):key==='resolved'?['linked','recounted'].includes(o.status):key==='reviewed'?['reviewed','invalid'].includes(o.status):o.status===key);
  const rows=all.filter(o=>match(o,filter)),pages=Math.max(1,Math.ceil(rows.length/30));listPage=Math.min(Math.max(1,listPage),pages);
  const tabs=[['unresolved','ဖြေရှင်းရန်ကျန်'],['pending','စစ်ဆေးရန်'],['reviewed','စစ်ဆေးပြီး'],['resolved','ဖြေရှင်းပြီး'],['all','အားလုံး']];
  const body=`<div class="opening-cash-flow"><p class="muted mb">စာရေးမသည် စစ်ချက်တင်ပြီး မိမိလုပ်ပိုင်ခွင့်အတိုင်း အလုပ်ဆက်လုပ်နိုင်ပါသည်။</p><div class="opening-cash-tabs">${tabs.map(([key,label])=>btn(label+' '+all.filter(o=>match(o,key)).length,`openOpeningPending2('${key}')`,filter===key?'primary':'secondary')).join('')}</div>${rows.slice((listPage-1)*30,listPage*30).map(o=>`<article class="opening-cash-record"><div class="row between wrap"><div><strong>${E(shortDate(o.date))}</strong><div class="sub">${E(stamp(o.submittedAt))}</div></div>${status(o)}</div>${totals(o)}<p>${E(o.note)||'—'}</p><div class="opening-cash-actions">${btn('အသေးစိတ်ကြည့်မယ်',`openOpeningCashDetail('${o.id}')`,'secondary')}${o.status==='pending'?btn('စစ်ဆေးမယ်',`openOpeningCashDetail('${o.id}')`):['reviewed','invalid'].includes(o.status)?btn('ဖြေရှင်းမယ်',`openOpeningCashResolve('${o.id}')`):''}</div></article>`).join('')||'<p class="muted">မှတ်တမ်း မရှိပါ။</p>'}${pages>1?`<div class="opening-cash-actions">${btn('ရှေ့',`openOpeningPending2('${filter}',${listPage-1})`,'secondary','',listPage===1?'disabled':'')}<span>${listPage} / ${pages} · ${rows.length}</span>${btn('နောက်',`openOpeningPending2('${filter}',${listPage+1})`,'secondary','',listPage===pages?'disabled':'')}</div>`:''}</div>`;
  openModal('အဖွင့်ငွေ စစ်ချက်မှတ်တမ်း','ယခင်ရက်မှ မဖြေရှင်းသေးသော စစ်ချက်များကိုလည်း ဆက်ပြထားပါသည်။',body,btn('ပြန်မယ်','closeModal()','secondary'));
 };
 window.openOpeningCashDetail=function(id){
  const o=find(id);if(!o||!canViewAccount68('cash')||(!owner()&&o.date!==today()))return;
  currentId=o.id;currentFingerprint=o.fingerprint;
  const r=o.resolution;
  const links=r?.entries?.map(e=>`<div class="opening-cash-link"><strong>${E(e.number||'#'+e.id)}</strong><span>${E(shortDate(e.date))} · ${E(e.title)}</span><strong>${cashText(e.amount)}</strong>${e.reference?`<small>ဆက်စပ်မှတ်တမ်း #${E(String(e.reference))}</small>`:''}</div>`).join('')||'';
  const rows=row4('စစ်ဆေးရက်',E(shortDate(o.date)))+row4('အကြောင်းပြချက်',E(o.note)||'—')+row4('တင်သည့်ရက် / အချိန်',E(stamp(o.submittedAt)))+row4('စစ်ချက်တင်သူ',E(o.submittedBy?.name)||'—')+row4('စစ်ချက်တင်သူ အခန်းကဏ္ဍ',o.submittedRole==='owner'?'ပိုင်ရှင်':o.submittedRole==='clerk'?'စာရေးမ':'—')+row4('အခြေအနေ',status(o))+(o.reviewedAt?row4('ပိုင်ရှင်စစ်ဆေးသည့်အချိန်',E(stamp(o.reviewedAt)))+row4('စစ်ဆေးသူ',E(o.reviewedBy?.name)||'—')+row4('ပိုင်ရှင်မှတ်ချက်',E(o.reviewNote)||'—'):'');
  const review=owner()&&o.status==='pending'?`<form id="openingCashReviewForm" onsubmit="event.preventDefault();saveOpeningCashReview()">${field('ပိုင်ရှင်မှတ်ချက် (မဖြစ်မနေ မဟုတ်ပါ)','openingReviewNote')}<label class="opening-cash-confirm"><input id="openingReviewConfirmed" type="checkbox" onchange="openingCashValidate()">ကွာဟချက်ကို စစ်ဆေးသိရှိပြီးပါပြီ။ ငွေစာရင်း မချိန်ညှိရသေးပါ။</label></form>`:'';
  openModal('အဖွင့်ငွေ စစ်ချက်အသေးစိတ်','စစ်ဆေးခြင်းနှင့် ငွေစာရင်းချိန်ညှိခြင်းကို သီးခြားမှတ်ထားပါသည်။',`<div class="opening-cash-flow">${totals(o)}${rows}${r?`<section class="opening-cash-resolution"><h3>${r.method==='recount'?'မူလရေတွက်မှားကြောင်း ပြန်စစ်ထားသည်':'ပြင်ဆင်ထားသော ငွေမှတ်တမ်းနှင့် ချိတ်ထားသည်'}</h3>${row4('ဖြေရှင်းသည့်အကြောင်း',E(r.note))}${row4('ဖြေရှင်းသည့်အချိန်',E(stamp(r.resolvedAt)))}${row4('ဖြေရှင်းသူ',E(r.resolvedBy?.name)||'—')}${r.method==='recount'?row4('ပြန်စစ်အတည်ပြု မူလအဖွင့်ငွေ',cashText(r.actual)):links}${o.status==='invalid'?note(labels.invalid,'amber'):''}</section>`:''}${history(o)}${review}<p class="field-help mt">စစ်ဆေးခြင်း၊ ချိတ်ဆက်ခြင်းနှင့် ပြန်စစ်အတည်ပြုခြင်းက ငွေလက်ကျန်ကို မပြောင်းပါ။</p></div>`,btn('ပြန်မယ်',owner()?'openOpeningPending2()':'closeModal()','secondary')+(review?btn('စစ်ဆေးပြီးဟု မှတ်မယ်','saveOpeningCashReview()','primary','','id="openingCashSubmit" disabled'):owner()&&['reviewed','invalid'].includes(o.status)?btn('ကွာဟချက် ဖြေရှင်းမယ်',`openOpeningCashResolve('${o.id}')`):''));
 };
 window.saveOpeningCashReview=async function(){
  if(!owner()||!document.getElementById('openingReviewConfirmed')?.checked)return;
  const id=currentId;
  return pweServer.command('day.review',{id,fingerprint:currentFingerprint,note:document.getElementById('openingReviewNote').value,confirmed:true},{after:()=>openOpeningCashDetail(id)});
 };
 window.openOpeningCashResolve=function(id){
  const o=find(id);if(!owner()||!o||!['reviewed','invalid'].includes(o.status))return;
  currentId=o.id;currentFingerprint=o.fingerprint;
  openModal('အဖွင့်ငွေကွာဟချက် ဖြေရှင်းမယ်','အကြောင်းရင်းမှန်ကို ကိုက်ညီသော ဖြေရှင်းပုံ ရွေးပါ။',`<div class="opening-cash-flow">${totals(o)}<form id="openingCashResolveForm" onsubmit="event.preventDefault();saveOpeningCashResolution()"><div class="field"><label for="openingResolutionMethod">ဖြေရှင်းပုံ</label><select id="openingResolutionMethod" onchange="openingCashMethodChanged()"><option value="">ဖြေရှင်းပုံ ရွေးပါ</option><option value="link">ပြင်ဆင်ထားသော ငွေမှတ်တမ်းနှင့် ချိတ်မယ်</option><option value="recount">မူလရေတွက်မှားကြောင်း ပြန်စစ်ထားသည်</option></select></div><div id="openingResolutionFields"></div>${field('ဖြေရှင်းသည့်အကြောင်း','openingResolutionNote',{required:true,extra:'oninput="openingCashValidate()"'})}<label class="opening-cash-confirm"><input id="openingResolutionConfirmed" type="checkbox" onchange="openingCashValidate()">မူလစစ်ချက်နှင့် ဖြေရှင်းမှတ်တမ်းကို စစ်ပြီး မှန်ကန်ပါသည်။</label></form><p class="field-help">ဤနေရာမှ ငွေအဝင် / အထွက် ထပ်မတင်ပါ။ မူလငွေစစ်ချက်ကို မဖျက်ပါ။</p></div>`,btn('ပြန်မယ်',`openOpeningCashDetail('${o.id}')`,'secondary')+btn('ဖြေရှင်းမှတ်တမ်း သိမ်းမယ်','saveOpeningCashResolution()','primary','','id="openingCashSubmit" disabled'));
 };
 window.openingCashMethodChanged=function(){
  const o=find(currentId),method=document.getElementById('openingResolutionMethod').value,target=document.getElementById('openingResolutionFields');
  target.innerHTML=method==='link'?`${note('အဖွင့်ငွေ နောက်ပိုင်းမှတ်တမ်း ရွေးပါ။ ကွာဟချက်နှင့် သက်ဆိုင်သော မှတ်တမ်းကိုသာ ရွေးချိတ်ပါ။','blue')}${o.legacy?`<div class="opening-cash-legacy"><strong>ယခင်စစ်ချက်၏ နေ့တူငွေမှတ်တမ်းများ</strong><label class="opening-cash-confirm"><input id="openingIncludeLegacy" type="checkbox" onchange="openingCashCandidates()">တစ်ရက်တည်းမှ ငွေမှတ်တမ်းများကိုပါ ပြန်စစ်ရွေးမယ်</label></div>`:''}<div id="openingCashCandidates"></div><div class="opening-cash-actions">${btn('ငွေစာရင်း စစ်မယ်','closeModal();goCash()','secondary')}${btn('မှတ်တမ်းများ ပြန်ဖတ်မယ်','refreshOpeningCashRecords()','secondary','','id="openingCashRefresh"')}</div><div id="openingCashSelectedTotal" class="mt"></div>`:method==='recount'?`${note('မနက်က မူလအဖွင့်ငွေကိုသာ ပြန်စစ်ပါ။ လက်ရှိအံဆွဲငွေ မဟုတ်ပါ။ မူလစာရင်းအရ အဖွင့်ငွေနှင့် ကိုက်ညီရပါမည်။','blue')}${field('ပြန်စစ်အတည်ပြုထားသော မူလအဖွင့်ငွေ','openingRecountActual',{type:'number',min:0,step:'0.01',required:true,suffix:'ကျပ်',extra:'oninput="openingCashValidate()"'})}`:'';
  if(method==='link')openingCashCandidates();
  openingCashValidate();
 };
 window.openingCashCandidates=function(){
  const o=find(currentId),rows=document.getElementById('openingIncludeLegacy')?.checked?o.legacyCandidates:o.candidates;
  document.getElementById('openingCashCandidates').innerHTML=(rows||[]).map(e=>`<label class="opening-cash-link"><input type="checkbox" data-opening-entry="${E(e.id)}" onchange="openingCashValidate()"><span><strong>${E(e.number)}</strong><small>#${E(e.id)} · ${E(shortDate(e.date))} · ${E(e.title)}</small></span><strong>${cashText(e.amount)}</strong></label>`).join('')||'<p class="muted mt">ချိတ်ရန် ရွေးစရာ မရှိသေးပါ။ ငွေစာရင်း စစ်မယ် မှ မှတ်တမ်းကို စစ်ပါ။</p>';
  openingCashValidate();
 };
 window.openingCashValidate=function(){
  const button=document.getElementById('openingCashSubmit');if(!button)return;
  if(document.getElementById('openingCashReviewForm')){button.disabled=!document.getElementById('openingReviewConfirmed').checked;return;}
  const o=find(currentId),method=document.getElementById('openingResolutionMethod')?.value;
  let matches=false;
  if(method==='recount'){
   const input=document.getElementById('openingRecountActual');matches=input.value.trim()!==''&&input.checkValidity()&&Math.round(Number(input.value)*100)===Math.round(Number(o.expected)*100);
  }else if(method==='link'){
   const ids=[...document.querySelectorAll('[data-opening-entry]:checked')].map(el=>el.dataset.openingEntry);
   const rows=document.getElementById('openingIncludeLegacy')?.checked?o.legacyCandidates:o.candidates;
   const sum=(rows||[]).filter(e=>ids.includes(e.id)).reduce((total,e)=>total+Math.round(Number(e.amount)*100),0);
   matches=ids.length>0&&sum===Math.round(Number(o.difference)*100);
   document.getElementById('openingCashSelectedTotal').innerHTML=row4('ရွေးထားသော စာရင်းစုစုပေါင်း',cashText(sum/100))+row4('မူလကွာဟချက်',cashText(o.difference));
  }
  button.disabled=refreshing||!matches||!document.getElementById('openingResolutionNote')?.value.trim()||!document.getElementById('openingResolutionConfirmed')?.checked;
 };
 window.saveOpeningCashResolution=async function(){
  openingCashValidate();if(!owner()||document.getElementById('openingCashSubmit')?.disabled)return;
  const id=currentId,method=document.getElementById('openingResolutionMethod').value;
  return pweServer.command('day.resolve',{id,fingerprint:currentFingerprint,method,note:document.getElementById('openingResolutionNote').value,confirmed:true,...(method==='recount'?{actual:document.getElementById('openingRecountActual').value}:{entry_ids:[...document.querySelectorAll('[data-opening-entry]:checked')].map(el=>el.dataset.openingEntry),include_legacy_same_day:!!document.getElementById('openingIncludeLegacy')?.checked})},{after:()=>openOpeningCashDetail(id)});
 };
 window.refreshOpeningCashRecords=async function(){
  if(refreshing||!owner())return;
  const id=currentId,fingerprint=currentFingerprint;refreshing=true;openingCashValidate();
  const refreshButton=document.getElementById('openingCashRefresh');if(refreshButton)refreshButton.disabled=true;
  try{
   const response=await fetch('/api/state',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});if(!response.ok)throw Error('မှတ်တမ်းများ ပြန်ဖတ်မရပါ။');
   const fresh=pweHydrate(await response.json());
   // Read-only refresh cannot replace committed business state used by the command bridge.
   if(currentId!==id||currentFingerprint!==fingerprint)return;
   state.openingCashChecks=fresh.openingCashChecks;
   const o=find(id);if(!o||o.fingerprint!==fingerprint){openOpeningCashDetail(id);toast('စစ်ချက် ပြောင်းလဲသွားပါသည်။ အသစ်ပြန်စစ်ပါ။',true);return;}
   openingCashCandidates();
  }catch(e){error(e.message);}
  finally{refreshing=false;if(refreshButton?.isConnected)refreshButton.disabled=false;openingCashValidate();}
 };
 const beforeCashCheck=openCashCheck;
 openCashCheck=function(...args){
  if(!canViewAccount68('cash'))return;
  if(state.opening.checked&&state.opening.id)return openOpeningCashDetail(state.opening.id);
  const result=beforeCashCheck.apply(this,args);
  const label=document.querySelector('.v2-expected .label');if(label)label.textContent='ပွဲရုံ ငွေသား · စာရင်းအရ အဖွင့်ငွေ';
  const title=document.getElementById('modalTitle');if(title)title.textContent='မနက် အဖွင့်ငွေ စစ်မယ်';
  const input=document.getElementById('openingActual');if(input)input.step='0.01';
  const button=document.getElementById('saveOpeningBtn')||document.querySelector('[onclick="saveOpening()"]');if(button){button.id='saveOpeningBtn';button.textContent='စစ်ချက်သိမ်းပြီး အလုပ်စမယ်';}
  return result;
 };
 saveOpening=function(){if(!validForm('openingForm'))return;return pweServer.command('day.open',{actual:document.getElementById('openingActual').value,note:document.getElementById('openingNote')?.value||''},{page:'home'});};
 window.approvePendingOpening2=date=>{const o=checks().find(o=>o.date===date);if(o)openOpeningCashDetail(o.id);};
 approveOpening4=function(){if(owner()&&state.opening.id)openOpeningCashDetail(state.opening.id);};
 render();
})();
