/* Opening template import: preview first, merge draft only, retain the existing owner review. */
(function(){
 'use strict';
 let preview=null,busy=false,generation=0,pages={accounts:1,stock:1,balances:1};
 const escape=E;
 function controls(root=document.getElementById('opening69')){
  if(!root||root.querySelector('[data-opening-excel]'))return;
  const card=document.createElement('section');card.className='card mb';card.dataset.openingExcel='true';
  card.innerHTML=`<div class="row between wrap"><div><strong>Excel မှ စတင်လက်ကျန် ထည့်မယ်</strong><p class="field-help">နမူနာဖိုင် Download လုပ်ပြီး အကြောင်း ၆ မှစဖြည့်ပါ။ Import ပြီးလည်း ပြန်စစ်အတည်ပြုရပါမည်။</p></div><div class="row wrap"><a class="btn btn-secondary" href="/opening/import/template" download>Excel နမူနာ Download</a>${state.initialOpening69?.status==='draft'?btn('Excel Import လုပ်မယ်','openOpeningExcelImport()','primary','receive'):''}</div></div>`;
  root.querySelector('.op69-heading')?.after(card);
 }
 const beforeSetup=setupView;
 setupView=function(...args){
  const html=beforeSetup.apply(this,args);if(setupSection!=='opening69')return html;
  const host=document.createElement('div');host.innerHTML=html;controls(host.querySelector('#opening69'));return host.innerHTML;
 };
 const errorText=message=>{const e=document.getElementById('openingExcelError');if(e){e.textContent=message;e.hidden=false;e.style.display='block';e.scrollIntoView({block:'nearest'});}};
 window.openOpeningExcelImport=function(){
  if(state.initialOpening69?.status!=='draft')return;
  if(busy)return;
  generation++;preview=null;pages={accounts:1,stock:1,balances:1};
  openModal('Excel မှ စတင်လက်ကျန် ထည့်မယ်','Excel အချက်အလက်များကို အရင်စစ်ပြီး မူကြမ်းထဲ ထည့်ပါမယ်။',`<section id="openingExcelImport"><p class="mb"><a class="btn btn-secondary" href="/opening/import/template" download>Excel နမူနာ Download</a></p><ol><li>နမူနာ Sheet သုံးခု၏ ခေါင်းစဉ်များကို မပြောင်းပါနှင့်။ အကြောင်း ၆ မှ စဖြည့်ပါ။</li><li>မသုံးသော Sheet ကို အလွတ်ထားနိုင်ပါသည်။ အမည်အသစ်များကို သတ်မှတ်ချက်တွင် အရင်ထည့်ပါ။</li><li>ရှိပြီးသား ငွေသိမ်းရာ/တစ်ဦးချင်းငွေကျန်ကို အစားထိုးပြီး ကုန်လိုင်းများကို ထပ်ပေါင်းပါမည်။ ဖိုင်တူကို နှစ်ခါ မထည့်ပါ။</li><li>အများဆုံး 2 MB၊ စုစုပေါင်း အတန်း ၃,၀၀၀။ Formula အစား တန်ဖိုးကိုသာ ဖြည့်ပါ။</li></ol><label for="openingExcelFile">ဖြည့်ပြီးသော Excel ဖိုင် (.xlsx)</label><input id="openingExcelFile" type="file" accept=".xlsx" onchange="openingExcelReset()"><p id="openingExcelError" class="form-error" role="alert" style="white-space:pre-wrap" hidden></p><p class="mt">${btn('ဖိုင်ကို အရင်စစ်မယ်','previewOpeningExcel()','secondary','','id="openingExcelPreviewButton"')}</p><div id="openingExcelPreview" aria-live="polite"></div></section>`,btn('ပြန်မယ်','closeModal();openInitial69()','secondary')+btn('မူကြမ်းထဲ Import လုပ်မယ်','applyOpeningExcel()','primary','','id="openingExcelApply" disabled'));
 };
 window.openingExcelReset=function(){generation++;preview=null;document.getElementById('openingExcelPreview').innerHTML='';const error=document.getElementById('openingExcelError');error.hidden=true;error.style.display='none';error.textContent='';document.getElementById('openingExcelApply').disabled=true;};
 window.previewOpeningExcel=async function(){
  if(busy)return;
  const file=document.getElementById('openingExcelFile')?.files[0];if(!file)return errorText('Excel ဖိုင်ကို ရွေးပါ။');
  if(!/\.xlsx$/i.test(file.name)||file.size>2*1024*1024)return errorText('.xlsx ဖိုင် 2 MB အောက်ကို ရွေးပါ။');
  openingExcelReset();busy=true;const current=generation,fileInput=document.getElementById('openingExcelFile');fileInput.disabled=true;
  const button=document.getElementById('openingExcelPreviewButton');button.disabled=true;button.textContent='စစ်ဆေးနေသည်…';
  try{
   if(!await pweServer.prepareOpeningImport())return errorText('လက်ရှိမူကြမ်းကို သိမ်းမရသေးပါ။ အမှားကို အရင်ပြင်ပါ။');
   const response=await fetch('/api/opening/import/preview',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','X-Pwe-File-Name':encodeURIComponent(file.name),'X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').content},body:file});
   const data=await response.json();
   if(!response.ok)throw Error(Object.entries(data.errors||{}).map(([key,messages])=>key+' — '+[].concat(messages).join(' ')).join('\n')||data.message||'ဖိုင် စစ်မရပါ။');
   if(current!==generation||!button.isConnected)return;
   preview=data;pages={accounts:1,stock:1,balances:1};renderPreview();
  }catch(e){errorText(e.message);}
  finally{busy=false;if(fileInput.isConnected)fileInput.disabled=false;if(button.isConnected){button.disabled=false;button.textContent='ဖိုင်ကို အရင်စစ်မယ်';}}
 };
 const columns={accounts:[['row','Excel အတန်း'],['name','ငွေသိမ်းရာ'],['amount','ပမာဏ']],stock:[['ownership','ပိုင်ဆိုင်မှု'],['row','Excel အတန်း'],['partyName','ကုန်ပိုင်ရှင်'],['product','ကုန်ပစ္စည်း'],['grade','အဆင့်'],['warehouseName','ဂိုဒေါင်'],['batch','အသုတ်'],['qty','ပိဿာ'],['bags','အိတ်'],['costBasis','ဈေးတွက်ပုံ'],['costInput','ဝယ်ရင်းနှုန်း'],['costStandardViss','စံအိတ်ဝင်ပိဿာ'],['originName','မူရင်းကုန်သည်'],['note','မှတ်ချက်']],balances:[['row','Excel အတန်း'],['partyName','အမည်နှင့်နေရပ်'],['typeName','ငွေကျန်အမျိုးအစား'],['amount','ပမာဏ'],['loanRate','အတိုးနှုန်း'],['loanInterest','အတိုးကျန်']]};
 function renderPreview(){
  const root=document.getElementById('openingExcelPreview');if(!root||!preview)return;
  const titles={accounts:'ငွေလက်ကျန်',stock:'ကုန်လက်ကျန်',balances:'တစ်ဦးချင်းငွေကျန်'};
  root.innerHTML=`<div class="summary-box mb mt"><strong>ဖိုင်စစ်ဆေးပြီးပါပြီ</strong><p>ငွေလက်ကျန် ${preview.counts.accounts} ကြောင်း၊ ကုန် ${preview.counts.stock} ကြောင်း၊ တစ်ဦးချင်းငွေကျန် ${preview.counts.balances} ကြောင်း</p><p class="field-help">စသုံးမည့်ရက် ${escape(state.initialOpening69.startDate)} ကို ဆက်သုံးပါမည်။ တင်သွင်းသောအပိုင်းများကို မစစ်ရသေးအဖြစ် ပြန်သတ်မှတ်ပါမည်။</p></div>${Object.entries(titles).map(([key,title])=>{
   const rows=preview.data[key],count=Math.max(1,Math.ceil(rows.length/30)),page=pages[key];
   return `<details open class="mb"><summary>${title} (${rows.length})</summary><div style="overflow-x:auto"><table class="data-table"><thead><tr>${columns[key].map(([,label])=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${rows.slice((page-1)*30,page*30).map(row=>`<tr>${columns[key].map(([column])=>`<td>${escape(column==='costBasis'?(row.kind==='owned'?(row[column]==='bag'?'တစ်စံအိတ်ဈေး':'တစ်ပိဿာဈေး'):'—'):String(row[column]??''))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${count>1?`<div class="row between">${btn('ရှေ့',`openingExcelPage('${key}',-1)`,'secondary','',page===1?'disabled':'')}<span>${page} / ${count}</span>${btn('နောက်',`openingExcelPage('${key}',1)`,'secondary','',page===count?'disabled':'')}</div>`:''}</details>`;
  }).join('')}<label class="account-permission68"><input id="openingExcelConfirm" type="checkbox" onchange="document.getElementById('openingExcelApply').disabled=!this.checked"><span>အထက်ပါ အချက်အလက်များကို စစ်ပြီး မူကြမ်းထဲ ထည့်မည်။ ငွေ/ကုန်စာရင်း အတည်မပြုသေးပါ။</span></label>`;
 }
 window.openingExcelPage=function(key,delta){if(!preview)return;pages[key]=Math.max(1,Math.min(Math.ceil(preview.data[key].length/30),pages[key]+delta));renderPreview();document.getElementById('openingExcelApply').disabled=true;};
 window.applyOpeningExcel=async function(){
  if(busy||!preview||!document.getElementById('openingExcelConfirm')?.checked)return;
  busy=true;
  try{return await pweServer.command('opening.import',{token:preview.token},{page:'setup',after:()=>{preview=null;openInitial69();opening69View('review');}});}
  finally{busy=false;}
 };
 controls();
})();
