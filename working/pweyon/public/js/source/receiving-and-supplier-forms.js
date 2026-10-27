

/*
  V3.1 requested revision of the attached V3 prototype.
  Ordinary workflow pages; single receiving form; supplier autocomplete.
  Supplier advances use stable supplier IDs. Local browser prototype only.
*/
'use strict';
const revisionBase={render,save,seed,openReceiptDetail,renderReceiptRows,renderCashBody,openPricing,setupView};
let workView=null,workSerial=0,workEpoch=0,workDirty=false,historyRestoring=false;
let lastReceiptSaved=null,comboIndex={supplier:-1,product:-1};
const pageSnapshots=new Map();
function supplierBy(id){return state.masters.partners.find(p=>p.id===id);}
function searchText(s){return cleanText(s).normalize('NFC').replace(/[\u200b-\u200d\ufeff]/g,'').replace(/(?:ဦး|ဉီး|ဉီုး)/g,'ဦး').replace(/\s+/g,' ').toLocaleLowerCase();}
function supplierLabel(p){return p?p.name+(p.locality?' ('+p.locality+')':''):'';}
function supplierBalance(id){
 return (state.partnerAdvances||[]).filter(a=>a.partnerId===id)
 .reduce((s,a)=>s+Math.max(0,a.amount-(a.allocations||[]).reduce((n,x)=>n+x.amount,0)),0);
}
function initPageRevision(){
 ensureMasters();state.masters.partners.forEach(p=>{p.locality??='';p.phone??='';});
 if(!state.pageRevision){
  [{id:'DEMO-SUP-PHYU-1',name:'ဦးဖြူ',locality:'သပိတ်ကျင်း'},{id:'DEMO-SUP-PHYU-2',name:'ဦးဖြူ',locality:'ကြာညှပ်'}]
  .forEach(p=>{if(!supplierBy(p.id))state.masters.partners.push({...p,phone:'',kind:'supplier',active:true,demo:true});});
 }
 for(const r of state.receipts){
  if(supplierBy(r.partnerId))continue;
  const matches=state.masters.partners.filter(p=>p.kind==='supplier'&&searchText(p.name)===searchText(r.name));
  let p=matches.length===1?matches[0]:null;
  if(!p){p={id:uid('C'),name:r.name,locality:r.locality||'',phone:'',kind:'supplier',active:true,legacy:true};state.masters.partners.push(p);}
  r.partnerId=p.id;r.locality??=p.locality;
 }
 state.partnerAdvances??=[];
 if(!state.pageRevision){
  for(const r of state.receipts){
   if(!(r.advance>0))continue;
   const id='LEGACY-ADV-'+r.id;
   if(!state.partnerAdvances.some(a=>a.id===id)){
    state.partnerAdvances.push({id,partnerId:r.partnerId,date:r.date,amount:r.advance,account:null,reason:'ယခင်မှတ်တမ်းမှ ကြိုငွေ',legacy:true,sourceReceiptId:r.id,
     allocations:r.status==='purchased'?[{receiptId:r.id,amount:r.advance,date:r.purchaseDate||r.date}]:[]});
   }
   if(r.status!=='purchased'){r.legacyAdvance=r.advance;r.advance=0;}
  }
 }
 state.lots.forEach(l=>{if(l.owner==='supplier'&&!l.partnerId){const r=state.receipts.find(r=>r.id===l.receiptId);if(r)l.partnerId=r.partnerId;}});
 state.pageRevision='3.1';state.uiVersion=3;
}
save=function(){workEpoch++;revisionBase.save();};
function clearOldModal(){
 const root=document.getElementById('modalRoot');root.classList.remove('visible');root.innerHTML='';root.removeAttribute('aria-modal');root.setAttribute('aria-hidden','true');
 document.body.style.overflow='';const app=document.getElementById('app');app.inert=false;app.removeAttribute('aria-hidden');
}
function rememberPage(){
 if(!workView)return;
 const main=document.getElementById('main'),clone=main.cloneNode(true);
 const live=main.querySelectorAll('input,select,textarea,details'),copy=clone.querySelectorAll('input,select,textarea,details');
 live.forEach((el,i)=>{
  const c=copy[i];
  if(el.tagName==='INPUT'){c.setAttribute('value',el.value);c.toggleAttribute('checked',el.checked);}
  else if(el.tagName==='TEXTAREA')c.textContent=el.value;
  else if(el.tagName==='SELECT')Array.from(c.options).forEach((o,j)=>o.toggleAttribute('selected',el.options[j].selected));
  else c.toggleAttribute('open',el.open);
 });
 clone.querySelectorAll('.name-options').forEach(el=>el.hidden=true);
 pageSnapshots.set(workView.id,{html:clone.innerHTML,view:{...workView},page,epoch:workView.epoch,dirty:workDirty,productReturn,
  wizard:wizard?JSON.parse(JSON.stringify(wizard)):null,receiptWizard:receiptWizard?JSON.parse(JSON.stringify(receiptWizard)):null,scroll:window.scrollY});
}
function writeRoute(kind,id,route,replace=false){
 if(historyRestoring)return;
 try{history[replace?'replaceState':'pushState']({pweRevision:true,kind,id,page,epoch:workEpoch},'','#/'+route);}catch(e){}
}
function routeFor(body){
 const routes=[['id="newReceiptForm"','receive/new'],['id="purchaseForm"','purchase/settle'],['id="purchasePayForm"','purchase/payment'],
 ['id="saleStep1"','sale/goods'],['id="saleStep2"','sale/payment'],['v2-delivery-choice','sale/delivery'],['id="partnerForm"','setup/partner'],
 ['id="productMasterForm"','setup/product'],['id="advanceForm"','supplier/advance']];
 return routes.find(([test])=>body.includes(test))?.[1]||'work/'+(workSerial+1);
}
openModal=function(title,subtitle,body,footer='',wide=false){
 rememberPage();clearToast();clearOldModal();
 const receiving=body.includes('id="newReceiptForm"'),route=routeFor(body);
 workView={id:++workSerial,route,receiving,returnPage:page,epoch:workEpoch};workDirty=false;renderNav();
 document.getElementById('main').innerHTML=`<section class="work-page ${receiving?'receiving':''}" aria-labelledby="modalTitle">
 <button type="button" class="v2-back" onclick="leaveWorkPage()">${I('back')}စာရင်းသို့ ပြန်မယ်</button>
 <div class="page-heading"><div><h1 id="modalTitle">${title}</h1>${subtitle?`<p class="subtitle">${subtitle}</p>`:''}</div></div>
 <div class="page-panel"><div class="modal-body"><div id="modalError" class="form-error" role="alert"></div>${body}</div>
 ${footer?`<footer class="modal-footer">${footer}</footer>`:''}</div>
 <div class="work-footer"><span>${storageOK?'စမ်းသပ်နမူနာ · ဤဘရောက်ဇာတွင် သိမ်းသည်။':'သတိ — ဘရောက်ဇာတွင် သိမ်းမရပါ။ ပိတ်ပါက ဒေတာပျောက်နိုင်သည်။'}</span><span>ပွဲရုံ</span></div></section>`;
 if(receiving)document.getElementById('modalError').style.margin='20px 25px 0';
 writeRoute('work',workView.id,route);window.scrollTo({top:0,behavior:'instant'});
 const id=workView.id;
 setTimeout(()=>{if(workView?.id===id)document.querySelector('#main input:not([type="hidden"]):not([readonly]),#main select,#main textarea')?.focus({preventScroll:true});},10);
};
render=function(){if(workView){renderNav();return;}revisionBase.render();};
function mayDiscard(){return !workView||!workDirty||window.confirm('မသိမ်းရသေးသော အချက်အလက်များ ရှိပါတယ်။ မသိမ်းဘဲ ထွက်မလား။');}
closeModal=function(){clearOldModal();workView=null;workDirty=false;productReturn=null;revisionBase.render();writeRoute('page',null,page,true);};
function leaveWorkPage(){
 if(!mayDiscard())return;
 if(productReturn==='receipt'&&receiptWizard){productReturn=null;receiptCargo();workDirty=true;return;}
 closeModal();
}
navigate=function(p){
 if(!mayDiscard())return;rememberPage();clearOldModal();workView=null;workDirty=false;productReturn=null;page=p;filter='all';searchTerm='';
 revisionBase.render();writeRoute('page',null,p);window.scrollTo({top:0,behavior:'instant'});
};
beginSetup=function(section='overview'){
 if(!mayDiscard())return;
 workDirty=false;setupSection=section;setupQuery='';navigate('setup');
};
changeRole=function(role){
 if(!mayDiscard()){document.getElementById('roleSelect').value=state.role;return;}
 workDirty=false;state.role=role;save();navigate(role==='owner'?'owner':'home');
};
window.addEventListener('popstate',event=>{
 rememberPage();historyRestoring=true;
 const h=event.state,s=h?.kind==='work'?pageSnapshots.get(h.id):null;
 if(s&&s.epoch===workEpoch){
  workView={...s.view};page=s.page;wizard=s.wizard;receiptWizard=s.receiptWizard;productReturn=s.productReturn;workDirty=s.dirty;
  clearOldModal();renderNav();document.getElementById('main').innerHTML=s.html;window.scrollTo({top:s.scroll,behavior:'instant'});
 }else{workView=null;workDirty=false;clearOldModal();page=h?.page||'home';revisionBase.render();}
 historyRestoring=false;
});
document.addEventListener('input',e=>{if(workView&&e.target.closest('#main form'))workDirty=true;});
window.addEventListener('beforeunload',e=>{if(workView&&workDirty){e.preventDefault();e.returnValue='';}});
/* Single continuous receiving form. */
function emptyReceiptForm(){
 return {name:'',partnerId:'',locality:'',supplierQuery:'',productQuery:'',product:'',productId:'',productRevision:null,standardViss:null,grade:'',
 qty:'',actualBags:'',source:'scale',car:'',note:'',advanceAmount:'',advanceAccount:'cash',advanceReason:'အသုံး',carriageAmount:'',carriageAccount:'cash'};
}
startReceipt=function(){
 if(!guardWork())return;if(!products(true).length){beginSetup('products');toast('ကုန်ပစ္စည်းကို အရင်သတ်မှတ်ပါ။',true);return;}
 page='receipts';receiptWizard=emptyReceiptForm();lastReceiptSaved=null;receiptCargo();
};
receiptIntro=function(){receiptCargo();};receiptIntroNext=function(){receiptCargo();};receiptCargoBack=function(){leaveWorkPage();};
chooseSupplierType=function(){};matchSupplierType=function(){};
function captureReceiving(){
 if(!receiptWizard||!document.getElementById('newReceiptForm'))return;
 Object.assign(receiptWizard,{supplierQuery:value('supplierSearch'),productQuery:value('productSearch'),qty:value('newQty'),grade:value('newGrade'),actualBags:value('newActualBags'),
 source:value('newSource')||'scale',car:value('newCar'),note:value('newNote'),advanceAmount:value('newAdvanceAmount'),advanceAccount:value('newAdvanceAccount')||'cash',advanceReason:value('newAdvanceReason')||'အသုံး',carriageAmount:value('newCarriageAmount'),carriageAccount:value('newCarriageAccount')||'cash'});
}
captureCargo=captureReceiving;
function toggleReceiveCarriage(){
 const amount=moneyInput(value('newCarriageAmount'));const box=document.getElementById('newCarriageDetails');
 if(box)box.hidden=!(Number.isFinite(amount)&&amount>0);
 if(receiptWizard)receiptWizard.carriageAmount=value('newCarriageAmount');
}
function nameCombo(kind,label,text,placeholder){
 return `<div class="name-combo" id="${kind}Combo"><label for="${kind}Search">${label} <span class="req">*</span></label><div class="name-combo-box">${I('search')}
 <input id="${kind}Search" value="${E(text)}" type="text" placeholder="${placeholder}" maxlength="160" autocomplete="off" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-controls="${kind}Options"
 oninput="comboChanged('${kind}')" onfocus="showNames('${kind}')" onclick="showNames('${kind}')" onkeydown="nameKey(event,'${kind}')">
 <button type="button" class="combo-clear" onclick="clearName('${kind}')" aria-label="ရွေးထားသည်ကို ဖျက်ရန်">${I('close')}</button>
 <div class="name-options" id="${kind}Options" role="listbox" hidden></div></div><div id="${kind}Selected" class="combo-help"></div></div>`;
}
receiptCargo=function(){
 const w=receiptWizard||emptyReceiptForm();receiptWizard=w;
 const p=productBy(w.productId),supplier=supplierBy(w.partnerId),last=state.receipts.find(r=>r.id===lastReceiptSaved);
 const notice=last?`<div class="saved-notice">${I('check')}<div class="grow">သိမ်းပြီးပါပြီ — ${E(last.name)}${last.locality?' ('+E(last.locality)+')':''}<small>${E(last.product)} · ${vissText37(last.qty)} ပိဿာ · ${recordBagInfo(last)} · ${last.status==='draft'?'အကြမ်း':'အချော'}</small></div><button class="btn-link" type="button" onclick="openReceiptProcess('${last.id}')">စာရင်းကြည့်မယ်</button></div>`:'';
 const body=`<form id="newReceiptForm" novalidate onsubmit="event.preventDefault();saveReceiveAndNew(false)">${notice}
 <div class="receive-grid"><section class="receive-section" aria-label="ကုန်သည်နှင့် ကြိုယူငွေ"><h2>${I('users')}ကုန်လာချသူ</h2>
 ${nameCombo('supplier','ကုန်သည်အမည်',w.supplierQuery||supplierLabel(supplier),'အမည် သို့မဟုတ် နေရပ် ရိုက်ရှာပါ')}
 <input type="hidden" id="newPartnerId" value="${E(w.partnerId)}"><input type="hidden" id="newName" value="${E(w.name)}"><div id="inlineSupplierForm" hidden></div>
 <div class="divider"></div><div class="advance-heading"><strong>ကြိုယူငွေ</strong><small>ရွေးထားသော ကုန်သည်အတွက်</small></div>
 <div id="supplierAdvanceBalance" class="advance-balance"></div>
 ${field('ယခု ကြိုသုံးမည့်ငွေ','newAdvanceAmount',{value:w.advanceAmount,suffix:'ကျပ်',placeholder:'မရှိလျှင် အလွတ်ထားပါ',extra:'inputmode="numeric" autocomplete="off" oninput="toggleReceiveAdvance()"'})}
 <div id="newAdvanceDetails" ${w.advanceAmount?'':'hidden'}>${accountField('newAdvanceAccount',w.advanceAccount,'ဘယ်ငွေသိမ်းရာမှ ထုတ်မလဲ')}${selectField('ကြိုယူသည့်အကြောင်း','newAdvanceReason',[['အသုံး','အသုံး'],['ကားခ','ကားခ']],w.advanceReason)}</div>
 <p class="field-help">သိမ်းသည့်အခါမှ ငွေထွက်မည်။ ကုန်သည်၏ ကြိုငွေစာရင်းတွင် သိမ်းထားမည်။</p>
 <div class="divider"></div><div class="advance-heading"><strong>တန်ဆာခ (ခေါက်ရှည်)</strong><small>ပွဲရုံပိုင်ရှင် ယာယီစိုက်ပေးမည့် အသုံးစရိတ်</small></div>
 ${field('တန်ဆာခ ငွေပမာဏ','newCarriageAmount',{value:w.carriageAmount,suffix:'ကျပ်',placeholder:'မရှိလျှင် အလွတ်ထားပါ',extra:'inputmode="numeric" autocomplete="off" oninput="toggleReceiveCarriage()"'})}
 <div id="newCarriageDetails" ${w.carriageAmount?'':'hidden'}>${accountField('newCarriageAccount',w.carriageAccount,'တန်ဆာခ ယာယီစိုက်ပေးမည့် ငွေစာရင်း')}</div>
 <p class="field-help">ဒီငွေကို ကုန်လက်ခံချိန်မှာ ပွဲရုံအသုံးစရိတ်အဖြစ် ယာယီစိုက်ပေးပြီး၊ ဈေးဖြတ်ချိန်မှာ ကုန်သည်ရငွေမှ ပြန်နုတ်ပါမည်။</p></section>
 <section class="receive-section" aria-label="ကုန်နှင့် အလေးချိန်"><h2>${I('receive')}ကုန်နှင့် အလေးချိန်</h2>
 ${nameCombo('product','ကုန်ပစ္စည်းအမည်',w.productQuery||p?.name||'','ကုန်အမည် ရိုက်ရှာပါ')}<input type="hidden" id="newProduct" value="${E(w.product)}">
 <div id="receiveGradeField">${selectField('အရည်အသွေး','newGrade',p?p.grades.map(g=>[g,'အဆင့် '+g]):[['','ကုန်ကို အရင်ရွေးပါ']],w.grade,'onchange="receiptWizard.grade=this.value"')}</div>
 <div id="receiptStandardHint" class="v3-rate-hint"></div>
 <div class="v3-weight-input">${field('စုစုပေါင်း အလေးချိန်','newQty',{value:w.qty,required:true,suffix:'ပိဿာ',placeholder:'ဥပမာ 250',extra:'inputmode="decimal" autocomplete="off" oninput="updateReceiptBags()" aria-describedby="receiptCalculation"'})}</div>
 <div id="receiptCalculation" class="v3-auto-result" role="status" aria-live="polite"><div class="v3-auto-top"><span>${I('check')}အလိုအလျောက် တွက်ထားသောအိတ်</span><span class="v3-auto-tag">ပြန်ရိုက်ရန် မလိုပါ</span></div><div class="v3-auto-number"><input id="newBags" readonly tabindex="-1" aria-label="အလိုအလျောက်တွက်ထားသော အိတ်အရေအတွက်" placeholder="—"><span>အိတ်</span></div><div id="receiptBagDetail" class="v3-auto-detail"></div></div>
 </section></div>
 <details class="receive-optional" ${w.car||w.note||w.actualBags?'open':''}><summary>ကားနံပါတ်၊ မှတ်ချက်နှင့် အခြားအချက်အလက် <span class="muted">(လိုအပ်မှ ဖြည့်ပါ)</span></summary>
 <div class="field-row">${field('ကားနံပါတ်','newCar',{value:w.car,placeholder:'ကားနံပါတ်ရှိပါက ဖြည့်ပါ',extra:'maxlength="40"'})}${selectField('အလေးချိန်ရရှိပုံ','newSource',[['scale','ကတ္တားဖြင့် ချိန်ထားသည်'],['declared','ပေးလာသော အလေးချိန်'],['reweighed','ပြန်ချိန်ထားသည်']],w.source)}</div>
 <div class="field-row">${field('တကယ်ရေတွက်ထားသောအိတ်','newActualBags',{value:w.actualBags,placeholder:'လိုအပ်မှ ဖြည့်ပါ',suffix:'အိတ်',extra:'inputmode="numeric"',help:'ကိုင်ခအတွက် တကယ်ကိုင်တွယ်သည့်အိတ်ကိုသာ သုံးမည်။'})}${field('မှတ်ချက်','newNote',{value:w.note,placeholder:'လိုအပ်သောအကြောင်းအရာ',extra:'maxlength="400"'})}</div>
 </details></form>`;
 openModal('ကုန်လက်ခံမယ်','ကုန်သည်တစ်ဦးထံမှ ကုန်အမျိုးအစားများစွာကို ဆက်တိုက်လက်ခံနိုင်ပါတယ်။',body,
 `<span class="save-hint">“ကုန်တစ်မျိုး ထပ်ထည့်မယ်” သည် လက်ရှိကုန်ကိုသိမ်းပြီး ကုန်သည်မပြောင်းဘဲ နောက်ကုန်တစ်မျိုး ဆက်ထည့်ရန် ဖြစ်ပါတယ်။ “သိမ်းပြီး အသစ်တစ်ဦးထည့်မယ်” သည် လက်ရှိစာရင်းကိုသိမ်းပြီး ကုန်သည်အသစ်အတွက် ဖောင်အသစ်ဖွင့်ရန် ဖြစ်ပါတယ်။</span>`+
 btn('ကုန်တစ်မျိုး ထပ်ထည့်မယ်','saveReceiveAndNextProduct(false)','secondary','plus','id="saveReceiptProduct"')+
 btn('သိမ်းပြီး အသစ်တစ်ဦးထည့်မယ်','saveReceiveAndNew(false)','secondary','plus','id="saveReceiptNew"')+
 btn('အချောသိမ်းပြီး အသစ်တစ်ဦးထည့်မယ်','saveReceiveAndNew(true)','primary','check','id="saveReceiptNext"'),true);
 refreshSupplier();refreshProduct(false);updateReceiptBags();
};
function hideNames(kind){
 const input=document.getElementById(kind+'Search'),box=document.getElementById(kind+'Options');
 if(box)box.hidden=true;if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}comboIndex[kind]=-1;
}
function showNames(kind){
 const input=document.getElementById(kind+'Search'),box=document.getElementById(kind+'Options');if(!input||!box)return;
 const selected=kind==='supplier'?supplierLabel(supplierBy(receiptWizard.partnerId)):productBy(receiptWizard.productId)?.name||'';
 const query=searchText(input.value)===searchText(selected)?'':searchText(input.value);
 const choices=(kind==='supplier'?partners('supplier'):products(true)).filter(p=>searchText(kind==='supplier'?supplierLabel(p):p.name).includes(query));
 box.innerHTML=choices.slice(0,20).map((p,i)=>`<div role="option" tabindex="-1" id="${kind}Option${i}" aria-selected="false" class="name-option" data-id="${E(p.id)}" onclick="selectName('${kind}','${E(p.id)}')">${I(kind==='supplier'?'users':'grain')}<div class="grow"><strong>${E(p.name)}${kind==='supplier'&&p.locality?` <span class="locality">(${E(p.locality)})</span>`:''}</strong><small>${kind==='supplier'?(p.phone?E(p.phone):p.locality?'ကုန်သည်':'နေရပ် မသတ်မှတ်ရသေး'):p.standardViss?'၁ အိတ် = '+vissText37(p.standardViss)+' ပိဿာ':'စံပိဿာ မသတ်မှတ်ရသေး'}</small></div></div>`).join('')||`<div class="combo-empty">ကိုက်ညီသော ${kind==='supplier'?'ကုန်သည်':'ကုန်ပစ္စည်း'} မတွေ့ပါ။</div>`;
 if(kind==='supplier')box.innerHTML+=`<div id="supplierCreateOption" role="option" tabindex="-1" aria-selected="false" class="name-option create" data-create="true" onclick="openInlineSupplier()">${I('plus')}ကုန်သည်အမည် အသစ်ထည့်မယ်</div>`;
 box.hidden=false;input.setAttribute('aria-expanded','true');comboIndex[kind]=-1;
}
function comboChanged(kind){
 workDirty=true;
 if(kind==='supplier'){Object.assign(receiptWizard,{partnerId:'',name:'',locality:'',supplierQuery:value('supplierSearch')});document.getElementById('newPartnerId').value='';document.getElementById('newName').value='';refreshSupplier();}
 else{Object.assign(receiptWizard,{productId:'',product:'',standardViss:null,grade:'',productQuery:value('productSearch')});refreshProduct(true);}
 showNames(kind);
}
function clearName(kind){const el=document.getElementById(kind+'Search');if(el){el.value='';comboChanged(kind);el.focus({preventScroll:true});}}
function selectName(kind,id){
 if(kind==='supplier'){
  const p=supplierBy(id);if(!p||!p.active)return;
  Object.assign(receiptWizard,{partnerId:p.id,name:p.name,locality:p.locality,supplierQuery:supplierLabel(p)});
  document.getElementById('supplierSearch').value=supplierLabel(p);document.getElementById('newPartnerId').value=p.id;document.getElementById('newName').value=p.name;
  document.getElementById('inlineSupplierForm').hidden=true;refreshSupplier();
 }else{
  const p=productBy(id);if(!p||!p.active)return;
  Object.assign(receiptWizard,{productId:p.id,product:p.name,productRevision:p.revision,standardViss:p.standardViss,grade:p.grades.includes(receiptWizard.grade)?receiptWizard.grade:p.grades[0],productQuery:p.name});
  document.getElementById('productSearch').value=p.name;refreshProduct(true);
 }
 workDirty=true;hideNames(kind);
}
function nameKey(event,kind){
 if(event.key==='Escape'){event.preventDefault();hideNames(kind);return;}
 if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;
 const box=document.getElementById(kind+'Options');
 if(box.hidden){if(event.key==='Enter'){event.preventDefault();showNames(kind);return;}showNames(kind);}
 const options=Array.from(box.querySelectorAll('[role="option"]'));if(!options.length)return;event.preventDefault();
 if(event.key==='Enter'){const el=options[comboIndex[kind]];if(el){if(el.dataset.create)openInlineSupplier();else selectName(kind,el.dataset.id);}return;}
 comboIndex[kind]=comboIndex[kind]<0?(event.key==='ArrowDown'?0:options.length-1):(comboIndex[kind]+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
 options.forEach((el,i)=>el.setAttribute('aria-selected',String(i===comboIndex[kind])));
 const el=options[comboIndex[kind]];document.getElementById(kind+'Search').setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});
}
document.addEventListener('click',event=>{['supplier','product'].forEach(k=>{if(!event.target.closest('#'+k+'Combo'))hideNames(k);});});
function refreshSupplier(){
 const p=supplierBy(receiptWizard?.partnerId),help=document.getElementById('supplierSelected'),balance=document.getElementById('supplierAdvanceBalance');
 if(help)help.innerHTML=p?I('check')+'စာရင်းထဲမှ ကုန်သည်ကို ရွေးထားသည်။':'အမည်တူပါက နေရပ်ကိုကြည့်ပြီး ရွေးပါ။';
 if(balance)balance.innerHTML=`<span>နုတ်ရန်ကျန်သော ကြိုငွေ</span><strong>${p?cashText(supplierBalance(p.id)):'ကုန်သည် ရွေးပါ'}</strong>`;
}
function refreshProduct(resetGrade=true){
 const w=receiptWizard,p=productBy(w.productId),help=document.getElementById('productSelected');
 if(help)help.innerHTML=p?I('check')+'သတ်မှတ်ချက်ထဲမှ ကုန်ကို ရွေးထားသည်။':'';
 document.getElementById('newProduct').value=p?.name||'';
 if(resetGrade)document.getElementById('receiveGradeField').innerHTML=selectField('အရည်အသွေး','newGrade',p?p.grades.map(g=>[g,'အဆင့် '+g]):[['','ကုန်ကို အရင်ရွေးပါ']],w.grade,'onchange="receiptWizard.grade=this.value"');
 document.getElementById('receiptStandardHint').innerHTML=I('scale')+`<span>${p?.standardViss?`၁ အိတ် = <strong>${vissText37(w.standardViss)} ပိဿာ</strong>`:p?'တစ်အိတ် စံပိဿာ မသတ်မှတ်ရသေးပါ။':'ကုန်ရွေးလျှင် စံပိဿာ ပြမည်။'}</span>`+(p&&!p.standardViss?`<button class="btn-link" type="button" onclick="setupFromReceipt()">သတ်မှတ်မယ်</button>`:'');
 updateReceiptBags();
}
function toggleReceiveAdvance(){const raw=numericText(value('newAdvanceAmount'));document.getElementById('newAdvanceDetails').hidden=raw===''||Number(raw)===0;}
updateReceiptBags=function(){
 const w=receiptWizard,c=bagCalc(parseDecimal(value('newQty')),w?.standardViss),input=document.getElementById('newBags'),detail=document.getElementById('receiptBagDetail');if(!input||!detail)return;
 if(!c){input.value='';input.dataset.exact='';detail.textContent=!w?.productId?'ကုန်ကိုရွေးပြီး အလေးချိန်ထည့်ပါ။':!w.standardViss?'ကုန်သတ်မှတ်ချက်မှာ စံပိဿာ ဖြည့်ပါ။':value('newQty')?'သုညထက်ကြီးသော ပိဿာကို ထည့်ပါ။ ဒဿမ ၃ လုံးအထိ ရသည်။':'အလေးချိန်ထည့်တာနဲ့ အိတ်ကို တွက်ပေးမယ်။';return;}
 input.value=bagNumber(c.bags);input.dataset.exact=String(c.bags);
 detail.innerHTML=c.remainder?`<strong>${bagDisplay(c)}</strong><span>${vissText37(c.qty)} ÷ ${vissText37(c.standard)} · အိတ်ပြည့်တင် မဝိုင်းထားပါ။</span>`:`${vissText37(c.qty)} ပိဿာ ÷ ${vissText37(c.standard)} ပိဿာ = ${N(c.whole)} အိတ်`;
};
selectReceiptProduct=function(id){selectName('product',id);};
selectReceiptGrade=function(i){const p=productBy(receiptWizard.productId);if(p){receiptWizard.grade=p.grades[i];document.getElementById('newGrade').value=p.grades[i];}};
setupFromReceipt=function(){captureReceiving();openProductEdit(receiptWizard.productId,'receipt');};
/* Inline master creation, deliberately no nested form or modal. */
function matchingPartner(name,locality,kind,except=''){
 return state.masters.partners.find(p=>p.id!==except&&p.kind===kind&&searchText(p.name)===searchText(name)&&searchText(p.locality)===searchText(locality));
}
function openInlineSupplier(){
 const query=value('supplierSearch'),el=document.getElementById('inlineSupplierForm');hideNames('supplier');el.hidden=false;
 el.innerHTML=`<section class="inline-supplier" aria-label="ကုန်သည်အသစ် ထည့်ရန်"><h3>ကုန်သည်အသစ် ထည့်မယ်</h3><div id="inlineSupplierError" class="inline-error" role="alert"></div>
 ${field('ကုန်သည်အမည်','inlineSupplierName',{value:query,placeholder:'ဥပမာ ဦးဖြူ',extra:'maxlength="80"'})}
 ${field('နေရပ် / မြို့နယ်','inlineSupplierLocality',{placeholder:'ဥပမာ သပိတ်ကျင်း',extra:'maxlength="100"'})}
 ${field('ဖုန်းနံပါတ်','inlineSupplierPhone',{placeholder:'ရှိပါက ဖြည့်ပါ',extra:'maxlength="30" inputmode="tel"'})}
 <div class="inline-supplier-actions">${btn('မထည့်တော့ပါ','cancelInlineSupplier()','secondary')}${btn('သိမ်းပြီး ရွေးမယ်','saveInlineSupplier()','primary','check')}</div></section>`;
 document.getElementById('inlineSupplierName').focus({preventScroll:true});
}
function cancelInlineSupplier(){const el=document.getElementById('inlineSupplierForm');el.hidden=true;el.innerHTML='';}
function saveInlineSupplier(){
 const name=cleanText(value('inlineSupplierName')),locality=cleanText(value('inlineSupplierLocality')),phone=cleanText(value('inlineSupplierPhone')),err=document.getElementById('inlineSupplierError');
 if(!name||!locality){err.textContent='ကုန်သည်အမည်နှင့် နေရပ်ကို ဖြည့်ပါ။';return;}
 const existing=matchingPartner(name,locality,'supplier');
 if(existing){
  if(!existing.active){err.textContent='ဤကုန်သည်ကို အသုံးမပြုတော့ပါ။ သတ်မှတ်ချက်တွင် ပြန်စစ်ပါ။';return;}
  selectName('supplier',existing.id);cancelInlineSupplier();toast('ရှိပြီးသား ကုန်သည်ကို ရွေးထားပါပြီ။');return;
 }
 const p={id:uid('C'),name,locality,phone,kind:'supplier',active:true};
 state.masters.partners.push(p);masterLog('partner',p.id,null,p);save();if(workView)workView.epoch=workEpoch;
 selectName('supplier',p.id);cancelInlineSupplier();toast('ကုန်သည်အသစ် သိမ်းပြီး ရွေးထားပါပြီ။');workDirty=true;
}
function moneyInput(raw){const s=numericText(raw);if(!s)return 0;return /^\d+$/.test(s)&&Number.isSafeInteger(Number(s))&&Number(s)<=1000000000000?Number(s):NaN;}
function issueSupplierAdvance(partnerId,amount,account,reason,receiptId=null){
 const p=supplierBy(partnerId),a={id:uid('ADV'),partnerId,date:today(),amount,account,reason,sourceReceiptId:receiptId,allocations:[]};
 state.partnerAdvances.push(a);txn(account,-amount,'ကုန်သည် ကြိုယူငွေ — '+reason,a.id,supplierLabel(p));
 const t=state.transactions[state.transactions.length-1];if(t){t.partnerId=partnerId;t.advanceId=a.id;}
 activity(supplierLabel(p)+' ကို '+cashText(amount)+' ကြိုသုံးခဲ့သည်။');return a;
}
function saveReceiveAndNew(finalized=false){
 if(!guardWork()||!document.getElementById('newReceiptForm'))return;
 const form=document.getElementById('newReceiptForm');if(form.dataset.saving)return;
 captureReceiving();const w=receiptWizard,p=productBy(w.productId),supplier=supplierBy(w.partnerId);
 if(!document.getElementById('inlineSupplierForm').hidden)return error('ကုန်သည်အသစ်ကို အရင်သိမ်းပါ သို့မဟုတ် မထည့်တော့ပါကို နှိပ်ပါ။');
 if(!supplier||!supplier.active||supplier.kind!=='supplier')return error('ရှိပြီးသားကုန်သည်ကို ရွေးပါ သို့မဟုတ် ကုန်သည်အသစ် ထည့်ပါ။');
 if(!p||!p.active)return error('ရှိပြီးသား ကုန်ပစ္စည်းကို ရွေးပါ။');
 const c=bagCalc(parseDecimal(w.qty),w.standardViss);if(!c)return error('ကုန်၏ စံပိဿာနှင့် သုညထက်ကြီးသော အလေးချိန်ကို ထည့်ပါ။');
 if(!p.grades.includes(w.grade))return error('အရည်အသွေးကို ရွေးပါ။');
 const actual=w.actualBags===''?null:moneyInput(w.actualBags),advance=moneyInput(w.advanceAmount),carriage=moneyInput(w.carriageAmount);
 if(actual!==null&&(!Number.isFinite(actual)||actual<=0))return error('တကယ်ရှိအိတ်ကို အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
 if(!Number.isFinite(advance)||advance<0)return error('ကြိုယူငွေကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
 if(!Number.isFinite(carriage)||carriage<0)return error('တန်ဆာခကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
 const account=state.masters.accounts.find(a=>a.id===w.advanceAccount&&a.active&&a.type!=='home'&&canViewAccount68(a));
 if(advance>0&&(!account||advance>bal(account.id)))return error('ရွေးထားသော ငွေသိမ်းရာတွင် ကြိုသုံးရန် ငွေမလောက်ပါ။');
 const carriageAccount=state.masters.accounts.find(a=>a.id===w.carriageAccount&&a.active&&a.type!=='home'&&canViewAccount68(a));
 if(carriage>0&&(!carriageAccount||carriage>bal(carriageAccount.id)-(advance>0&&account?.id===carriageAccount.id?advance:0)))return error('တန်ဆာခ ယာယီစိုက်ပေးရန် ရွေးထားသော ငွေစာရင်း လက်ကျန်မလောက်ပါ။');
 form.dataset.saving='true';
 const id=uid('R'),snapshot={productId:p.id,productRevision:w.productRevision,standardViss:w.standardViss,wholeBags:c.whole,remainderViss:c.remainder,method:'weight-divided-by-standard'};
 const r={id,no:'အလ-'+String(state.counter).padStart(3,'0'),date:today(),partnerId:supplier.id,name:supplier.name,locality:supplier.locality,
 product:w.product,productId:p.id,grade:w.grade,bags:c.bags,qty:c.qty,actualBags:actual,bagCalculation:snapshot,source:w.source,car:w.car,
 status:finalized?'await':'draft',price:null,advance:0,wage:0,weigh:0,carriageAdvance:carriage,carriageExpenseId:null,paid:0,note:w.note};
 state.receipts.unshift(r);
 state.lots.push({id:uid('L'),product:r.product,productId:p.id,grade:r.grade,qty:r.qty,bags:r.bags,actualBags:actual,bagCalculation:{...snapshot},owner:'supplier',name:r.name,partnerId:supplier.id,cost:0,receiptId:id});
 if(advance>0)r.issuedAdvanceId=issueSupplierAdvance(supplier.id,advance,account.id,w.advanceReason,id).id;
 if(carriage>0){const eid=uid('E');r.carriageExpenseId=eid;state.expenses.push({id:eid,date:today(),reason:'တန်ဆာခ (ခေါက်ရှည်)',amount:carriage,account:carriageAccount.id,partnerId:supplier.id,receiptId:id,recoverable:true,recovered:false});txn(carriageAccount.id,-carriage,'ယာယီစိုက်ထုတ် — တန်ဆာခ (ခေါက်ရှည်)',eid,supplierLabel(supplier));activity(supplierLabel(supplier)+' အတွက် တန်ဆာခ '+cashText(carriage)+' ယာယီစိုက်ပေးခဲ့သည်။');}
 move(r.product,r.grade,r.qty,r.bags,'in',r.no);activity(supplierLabel(supplier)+' ထံမှ '+r.product+' '+vissText37(r.qty)+' ပိဿာ လက်ခံ'+(finalized?' အချော':' အကြမ်း')+' သိမ်းခဲ့သည်။');
 save();workDirty=false;lastReceiptSaved=id;receiptWizard=emptyReceiptForm();receiptCargo();document.getElementById('supplierSearch').focus({preventScroll:true});
}
function saveReceiveAndNextProduct(finalized=false){
 if(!guardWork()||!document.getElementById('newReceiptForm'))return;
 const form=document.getElementById('newReceiptForm');if(form.dataset.saving)return;
 captureReceiving();
 const keep={partnerId:receiptWizard.partnerId,name:receiptWizard.name,locality:receiptWizard.locality,supplierQuery:receiptWizard.supplierQuery,source:receiptWizard.source||'scale',car:receiptWizard.car};
 const beforeCount=state.receipts.length;
 saveReceiveAndNew(finalized);
 if(state.receipts.length===beforeCount)return;
 receiptWizard=emptyReceiptForm();
 Object.assign(receiptWizard,keep,{productId:'',product:'',productQuery:'',productRevision:null,standardViss:null,grade:'',qty:'',actualBags:'',note:'',advanceAmount:'',advanceReason:'အသုံး',carriageAmount:'',carriageAccount:'cash'});
 receiptCargo();
 const p=supplierBy(receiptWizard.partnerId);
 if(p){document.getElementById('supplierSearch').value=supplierLabel(p);document.getElementById('newPartnerId').value=p.id;document.getElementById('newName').value=p.name;refreshSupplier();}
 document.getElementById('productSearch').focus({preventScroll:true});
 toast('လက်ရှိကုန်ကို သိမ်းပြီးပါပြီ။ ဒီကုန်သည်အတွက် နောက်ကုန်တစ်မျိုး ဆက်ထည့်နိုင်ပါတယ်။');
}
saveNewReceipt=function(next){saveReceiveAndNew(Boolean(next));};
/* Supplier master and balances. */
setupView=function(){return revisionBase.setupView().replace('ကုန်သည်၊ ဝယ်သူ အမည်စာရင်း','ကုန်သည်နှင့် ဝယ်သူ အမည်စာရင်း');};
partnerList=function(){
 const list=state.masters.partners.filter(p=>p.kind===partnerKind);
 return setupBack()+heading('','ကုန်သည်နှင့် ဝယ်သူများ','အမည်တူပါက နေရပ်ဖြင့် ခွဲထားမည်။',btn('အမည်အသစ် ထည့်မယ်','openPartnerEdit()','primary','plus'))+
 `<div class="toolbar"><div class="tabs">${[['supplier','ကုန်သည်'],['buyer','ဝယ်သူ']].map(([k,t])=>`<button class="tab ${partnerKind===k?'active':''}" onclick="partnerKind='${k}';render()">${t}</button>`).join('')}</div><span class="small muted">${list.length} ဦး</span></div>
 <div class="v2-list">${list.map(p=>`<div class="v3-partner-row"><span class="icon-box">${I('users')}</span><div class="grow"><strong>${E(supplierLabel(p))}</strong><div class="record-meta">${E(p.phone)||'ဖုန်း မထည့်ရသေး'}${!p.active?' · အသုံးမပြုတော့ပါ':''}</div>${p.kind==='supplier'?`<p class="field-help">နုတ်ရန်ကျန်ကြိုငွေ — ${cashText(supplierBalance(p.id))}</p>`:''}</div>${p.kind==='supplier'&&p.active?btn('ကြိုငွေ',`openSupplierAdvance('${p.id}')`,'soft','wallet'):''}${btn('ပြင်မယ်',`openPartnerEdit('${p.id}')`,'secondary')}</div>`).join('')||empty('အမည်စာရင်း မရှိသေးပါ။','users')}</div>`;
};
openPartnerEdit=function(id=''){
 const p=supplierBy(id)||{id:'',name:'',locality:'',phone:'',kind:partnerKind,active:true};
 openModal(p.kind==='buyer'?'ဝယ်သူအမည် သတ်မှတ်မယ်':'ကုန်သည်အမည် သတ်မှတ်မယ်','အမည်နှင့် နေရပ်ကို တွဲပြီး ပြသမည်။',
 `<form id="partnerForm" onsubmit="event.preventDefault();savePartnerMaster('${id}','${p.kind}')">
 ${field('အမည်','masterPartnerName',{value:p.name,required:true,extra:'maxlength="80"'})}
 ${field('နေရပ် / မြို့နယ်','masterPartnerLocality',{value:p.locality,required:!id,placeholder:'ဥပမာ သပိတ်ကျင်း',extra:'maxlength="100"'})}
 ${field('ဖုန်းနံပါတ်','masterPartnerPhone',{value:p.phone,extra:'maxlength="30" inputmode="tel"'})}
 ${selectField('အခြေအနေ','masterPartnerActive',[[true,'အသုံးပြုမည်'],[false,'အသစ်ထည့်ရာတွင် မသုံးတော့ပါ']],p.active)}</form>
 ${p.id&&p.kind==='supplier'?supplierAdvanceSummary(p.id):''}`,
 btn('မပြင်တော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`savePartnerMaster('${id}','${p.kind}')`,'primary','check'));
};
savePartnerMaster=function(id,kind){
 if(!validForm('partnerForm'))return;
 const name=cleanText(value('masterPartnerName')),locality=cleanText(value('masterPartnerLocality')),phone=cleanText(value('masterPartnerPhone'));
 if(!name||(!id&&!locality))return error('အမည်နှင့် နေရပ် ထည့်ပါ။');
 if(matchingPartner(name,locality,kind,id))return error('ဤအမည်နှင့် နေရပ်တူသော စာရင်း ရှိပြီးသားဖြစ်ပါတယ်။');
 const existing=supplierBy(id),before=existing?{...existing}:null,p=existing||{id:uid('C')};
 Object.assign(p,{name,locality,phone,kind,type:kind==='buyer'?'buyer':'trader',active:value('masterPartnerActive')==='true'});if(!existing)state.masters.partners.push(p);
 masterLog('partner',p.id,before,p);save();workDirty=false;closeModal();toast('အမည်စာရင်း သိမ်းပြီးပါပြီ။');
};
rSummary=function(r){
 const locality=r.locality||supplierBy(r.partnerId)?.locality;
 return `<div class="v2-person-summary"><div><strong>${E(r.name)}${locality?' ('+E(locality)+')':''}</strong><small>${E(r.car)||'ကားနံပါတ် မထည့်ထားပါ'}</small></div><div class="right"><strong>${E(r.product)} · ${E(r.grade)}</strong><small>${vissText37(r.qty)} ပိဿာ · ${recordBagInfo(r)}</small>${r.bagCalculation?`<small>၁ အိတ် = ${vissText37(r.bagCalculation.standardViss)} ပိဿာ</small>`:''}</div></div>`;
};
renderReceiptRows=function(){
 let rows=state.receipts.filter(r=>filter==='all'||filter==='draft'&&r.status==='draft'||filter==='hold'&&['await','deposit'].includes(r.status)||filter==='payable'&&r.status==='purchased'&&due(r)>0||filter==='purchased'&&r.status==='purchased'&&due(r)<=0);
 rows=rows.filter(r=>searchText(r.name+' '+(r.locality||supplierBy(r.partnerId)?.locality||'')+' '+r.product+' '+r.no).includes(searchText(searchTerm)));
 const el=document.getElementById('receiptRows');if(!el)return;
 el.innerHTML=rows.length?`<div class="v2-list">${rows.map(r=>{
 const purchased=r.status==='purchased',action=purchased?(due(r)>0?`openPurchasePayment('${r.id}')`:`openReceiptDetail('${r.id}')`):`openReceiptProcess('${r.id}')`,
 label=purchased?(due(r)>0?'ငွေရှင်းမယ်':'ဘောက်ချာကြည့်မယ်'):r.status==='draft'?'အချောဖြည့်မယ်':'ဈေးထည့်မယ်',locality=r.locality||supplierBy(r.partnerId)?.locality||'';
 return `<div class="v2-record"><div><button class="name-btn" onclick="openReceiptDetail('${r.id}')">${E(r.name)}${locality?' ('+E(locality)+')':''}</button><div class="record-meta">${E(r.product)} · အဆင့် ${E(r.grade)} · ${E(r.no)}</div></div><div class="record-weight"><div class="record-qty">${vissText37(r.qty)} <small>ပိဿာ</small></div><div class="record-sub">${recordBagInfo(r)}</div></div><div class="record-status">${receiptStatus(r)}<span class="record-sub">${shortDate(r.date)}</span></div><div class="record-button">${btn(label,action,'secondary')}</div></div>`;}).join('')}</div>`:empty('ကိုက်ညီသော အဝယ်စာရင်း မရှိပါ။');
};
advanceTotal=function(){return state.masters.partners.filter(p=>p.kind==='supplier').reduce((s,p)=>s+supplierBalance(p.id),0);};
function supplierAdvanceSummary(id){return `<div class="advance-balance"><span>${E(supplierLabel(supplierBy(id)))} · နုတ်ရန်ကျန်ကြိုငွေ</span><strong>${cashText(supplierBalance(id))}</strong></div>`;}
function openSupplierAdvance(partnerId,receiptId='',back='detail'){
 if(!guardWork())return;const p=supplierBy(partnerId);if(!p)return;
 openModal('ကုန်သည် ကြိုယူငွေ ထုတ်မယ်',E(supplierLabel(p)),
 `${supplierAdvanceSummary(partnerId)}<form id="advanceForm" onsubmit="event.preventDefault();saveSupplierAdvance('${partnerId}','${receiptId}','${back}')">
 ${field('ယခု ကြိုသုံးမည့်ငွေ','advanceAmount',{required:true,suffix:'ကျပ်',placeholder:'ငွေပမာဏ ထည့်ပါ',extra:'inputmode="numeric"'})}${accountField('advanceAccount')}
 ${selectField('ကြိုယူသည့်အကြောင်း','advanceReason',[['အသုံး','အသုံး'],['ကားခ','ကားခ']])}</form>
 <p class="field-help">ဤကုန်သည်၏ ကြိုငွေအဖြစ် သိမ်းမည်။ အဝယ်တစ်စောင်တည်းနှင့် မချည်ထားပါ။</p>`,
 btn('ပြန်မယ်',receiptId?(back==='pricing'?`openPricing('${receiptId}')`:`openReceiptDetailForm('${receiptId}')`):'closeModal()','secondary','back')+
 btn('ကြိုငွေထုတ်ပြီး သိမ်းမယ်',`saveSupplierAdvance('${partnerId}','${receiptId}','${back}')`,'primary','check'));
}
openAdvance=function(id,back='detail'){const r=state.receipts.find(r=>r.id===id);if(r)openSupplierAdvance(r.partnerId,id,back);};
function saveSupplierAdvance(id,receiptId='',back='detail'){
 if(!guardWork()||!validForm('advanceForm'))return;
 const p=supplierBy(id),amount=moneyInput(value('advanceAmount')),account=value('advanceAccount'),acc=state.masters.accounts.find(a=>a.id===account&&a.active&&a.type!=='home'&&canViewAccount68(a));
 if(!p||!p.active||!Number.isFinite(amount)||amount<=0)return error('ကုန်သည်နှင့် သုညထက်ပိုသော ကြိုငွေကို ထည့်ပါ။');
 if(!acc||amount>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာတွင် ငွေမလောက်ပါ။');
 issueSupplierAdvance(id,amount,account,value('advanceReason'));save();workDirty=false;
 if(receiptId){if(back==='pricing')openPricing(receiptId);else openReceiptDetailForm(receiptId);}else closeModal();toast('ကုန်သည်၏ ကြိုယူငွေစာရင်းတွင် သိမ်းပြီးပါပြီ။');
}
saveAdvance=function(id,back){const r=state.receipts.find(r=>r.id===id);if(r)saveSupplierAdvance(r.partnerId,id,back);};
openReceiptDetailForm=function(id){
 const r=state.receipts.find(r=>r.id===id);if(!r)return;
 openModal('အချောစာရင်း ဖြည့်မယ်','ကုန်သည်၊ ကုန်နဲ့ အလေးချိန်ကို သိမ်းထားပြီးဖြစ်သည်။',
 `${rSummary(r)}<form id="receiptDetailForm" onsubmit="event.preventDefault();saveReceiptDetail('${id}',true)">
 ${field('ကားနံပါတ်','detailCar',{value:r.car,placeholder:'ကားနံပါတ်ရှိပါက ဖြည့်ပါ',extra:'maxlength="40"'})}
 ${field('မှတ်ချက်','detailNote',{value:r.note,extra:'maxlength="400"'})}</form>
 ${supplierAdvanceSummary(r.partnerId)}${btn('ကုန်သည် ကြိုငွေ ထုတ်မယ်',`saveDraftDetailsAndAdvance('${id}')`,'secondary','wallet')}`,
 btn('အချောသိမ်းပြီး အသစ်ထပ်ထည့်မယ်',`saveDetailAndNew('${id}')`,'secondary','plus')+
 btn('သိမ်းပြီး ဈေးထည့်မယ်',`saveReceiptDetail('${id}',true)`,'primary','arrow'));
};
function saveDetailAndNew(id){
 if(!guardWork())return;const r=state.receipts.find(r=>r.id===id);if(!r)return;
 r.car=value('detailCar');r.note=value('detailNote');if(r.status==='draft')r.status='await';save();workDirty=false;page='receipts';lastReceiptSaved=id;receiptWizard=emptyReceiptForm();receiptCargo();
}
openPricing=function(id){
 revisionBase.openPricing(id);const r=state.receipts.find(r=>r.id===id);if(!r)return;
 const row=document.querySelector('#main .modal-body>.row.between.wrap.mt');
 if(row)row.innerHTML=`<span class="small muted">ကုန်သည်၏ နုတ်ရန်ကျန်ကြိုငွေ <strong>${cashText(supplierBalance(r.partnerId))}</strong></span>${btn('ကြိုငွေ ထုတ်မယ်',`openAdvance('${id}','pricing')`,'ghost','wallet')}`;
};
/* Supplier-level advance allocation; FIFO is a prototype convention, not an approved accounting rule. */
openPurchaseSettlement=function(){
 const r=state.receipts.find(r=>r.id===wizard.id);if(!r)return;
 const pool=supplierBalance(r.partnerId),base=Math.round(r.qty*wizard.price)-(r.wage||0)-(r.weigh||0),used=Math.min(pool,Math.max(0,base));
 openModal('အဝယ်ငွေ ရှင်းမယ်','ကုန်သည်၏ ကြိုငွေကို ရှင်းလင်းစွာ နုတ်ပြီး ငွေရှင်းမယ်။',
 `${rSummary(r)}<form id="purchaseForm" onsubmit="event.preventDefault();commitPurchase()">${supplierAdvanceSummary(r.partnerId)}
 ${field('ဤအဝယ်မှ နုတ်မည့် ကြိုငွေ','purchaseAdvanceUse',{type:'number',min:0,max:pool,value:used,required:true,suffix:'ကျပ်',extra:'oninput="this.dataset.edited=\'1\';updatePurchaseTotal()"',help:'ကုန်သည်၏ လက်ကျန်ကြိုငွေမှ နုတ်မည်။ ကျန်ကြိုငွေကို နောက်အဝယ်တွင် ဆက်သုံးနိုင်သည်။'})}
 <div id="purchaseSummary" class="summary-box mb"></div>
 <details class="details mb"><summary>လုပ်သားခ၊ ချိန်ခ နုတ်ငွေ</summary>
 <div class="field-row mt">${field('လုပ်သားခ','purchaseWage',{type:'number',min:0,value:r.wage||0,suffix:'ကျပ်',required:true,extra:'oninput="updatePurchaseTotal()"'})}${field('ချိန်ခ / လုပ်အားခ','purchaseWeigh',{type:'number',min:0,value:r.weigh||0,suffix:'ကျပ်',required:true,extra:'oninput="updatePurchaseTotal()"'})}</div>
 <details class="details"><summary>ကိုင်ခ တွက်မယ်</summary><div class="mt">${field('တကယ်ကိုင်သည့်အိတ်','handlingActualBags',{type:'number',min:1,value:r.actualBags??(!r.bagCalculation?r.bags:''),suffix:'အိတ်'})}</div>
 <div class="field-row">${field('ကိုင်သည့်အကြိမ်','handlingTimes',{type:'number',min:1,value:1})}${field('တစ်ပိုင်း တစ်ခါကိုင်နှုန်း','handlingRate',{type:'number',min:0,value:state.masters.handling.rate??'',suffix:'ကျပ်'})}</div>${btn('တွက်ပြီး ထည့်မယ်','applyHandling()','secondary','scale')}</details></details>
 <div class="field-row">${accountField('purchaseAccount','cash','ဘယ်ငွေသိမ်းရာမှ ပေးမလဲ')}${field('ယခု ထုတ်ပေးမည့်ငွေ','purchasePay',{type:'number',min:0,value:Math.max(0,base-used),required:true,suffix:'ကျပ်',extra:'oninput="this.dataset.edited=\'1\';updatePurchaseTotal()"'})}</div></form>`,
 btn('ဈေးသတ်မှတ်ချက်သို့',`openPricing('${r.id}')`,'secondary','back')+
 btn('အတည်ပြုပြီး သိမ်းမယ်','commitPurchase()','primary','check','id="commitPurchaseBtn"'));updatePurchaseTotal();
};
updatePurchaseTotal=function(){
 const r=state.receipts.find(r=>r.id===wizard?.id);if(!r||!document.getElementById('purchaseSummary'))return;
 const g=Math.round(r.qty*wizard.price),w=number('purchaseWage')||0,h=number('purchaseWeigh')||0,pool=supplierBalance(r.partnerId),advanceInput=document.getElementById('purchaseAdvanceUse');
 if(!advanceInput.dataset.edited)advanceInput.value=Math.min(pool,Math.max(0,g-w-h));
 const advance=number('purchaseAdvanceUse')||0,net=g-w-h-advance,payInput=document.getElementById('purchasePay');if(!payInput.dataset.edited)payInput.value=Math.max(0,net);
 const pay=number('purchasePay')||0;
 document.getElementById('purchaseSummary').innerHTML=`
 <div class="summary-line"><span>ကုန်ဖိုး (${vissText37(r.qty)} × ${M(wizard.price)})</span><strong>${cashText(g)}</strong></div>
 <div class="summary-line"><span>လုပ်သားခနှင့် ချိန်ခ</span><strong>− ${cashText(w+h)}</strong></div>
 <div class="summary-line"><span>ကုန်သည်ကြိုငွေမှ နုတ်မည်</span><strong>− ${cashText(advance)}</strong></div>
 <div class="summary-line total"><span>အသားတင် ရှင်းရန်ငွေ</span><strong>${cashText(net)}</strong></div>
 <div class="summary-line"><span>ဤအဝယ်အတွက် ပေးရန်ကျန်မည်</span><strong>${cashText(net-pay)}</strong></div>
 <div class="summary-line"><span>ကုန်သည်ကြိုငွေ ကျန်မည်</span><strong>${cashText(pool-advance)}</strong></div>`;
};
function allocateSupplierAdvance(partnerId,receiptId,amount){
 let remaining=amount;const links=[];
 for(const a of state.partnerAdvances.filter(a=>a.partnerId===partnerId)){
  if(remaining<=0)break;const available=a.amount-(a.allocations||[]).reduce((s,x)=>s+x.amount,0),used=Math.min(Math.max(0,available),remaining);
  if(used){(a.allocations??=[]).push({receiptId,amount:used,date:today()});links.push({advanceId:a.id,amount:used});remaining-=used;}
 }
 return links;
}
commitPurchase=function(){
 if(!guardWork()||!validForm('purchaseForm'))return;
 const r=state.receipts.find(r=>r.id===wizard?.id);if(!r)return error('အဝယ်စာရင်း မတွေ့ပါ။');if(r.status==='purchased')return error('ဤအဝယ်ကို သိမ်းပြီးသားဖြစ်သည်။');
 const wage=number('purchaseWage'),weigh=number('purchaseWeigh'),pay=number('purchasePay'),advance=number('purchaseAdvanceUse'),account=value('purchaseAccount'),pool=supplierBalance(r.partnerId);
 if([wage,weigh,pay,advance].some(n=>!Number.isFinite(n)||n<0||!Number.isInteger(n)))return error('ငွေပမာဏများကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
 const net=Math.round(r.qty*wizard.price)-wage-weigh-advance;
 if(advance>pool)return error('ကုန်သည်၏ လက်ကျန်ကြိုငွေထက် ပိုနုတ်၍မရပါ။');
 if(net<0||pay>net)return error('နုတ်ငွေ သို့မဟုတ် ပေးချေငွေက ကုန်ဖိုးထက် မများရပါ။');
 if(!state.masters.accounts.some(a=>a.id===account&&a.active&&a.type!=='home'&&canViewAccount68(a))||pay>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာတွင် ငွေမလောက်ပါ။');
 const lot=state.lots.find(l=>l.receiptId===r.id&&l.owner==='supplier');if(!lot)return error('ဆက်စပ်အပ်ကုန် မတွေ့ပါ။');
 r.advanceAllocations=allocateSupplierAdvance(r.partnerId,r.id,advance);
 Object.assign(r,{advance,price:wizard.price,priceDate:today(),wage,weigh,paid:pay,status:'purchased',purchaseDate:today(),purchaseNo:'အဝ-'+String(++state.counter).padStart(3,'0')});
 if(wizard.handlingBasis)r.handlingBasis={...wizard.handlingBasis};
 lot.owner='owned';lot.name='ပွဲရုံပိုင်';lot.cost=r.price;
 txn(account,-pay,'ကုန်ဝယ် ငွေရှင်းခြင်း',r.purchaseNo,supplierLabel(supplierBy(r.partnerId)));
 activity(r.name+' ၏အဝယ်တွင် ကြိုငွေ '+cashText(advance)+' နုတ်၍ '+cashText(pay)+' ရှင်းခဲ့သည်။');
 save();workDirty=false;openReceiptDetail(r.id);toast('အဝယ်သိမ်းပြီးပါပြီ။ ကြိုငွေထုတ်မှုကို ထပ်မတွက်ပါ။');
};
openReceiptDetail=function(id){
 revisionBase.openReceiptDetail(id);const r=state.receipts.find(r=>r.id===id);
 if(r&&r.status!=='purchased')document.querySelector('#main .modal-body')?.insertAdjacentHTML('beforeend',supplierAdvanceSummary(r.partnerId));
};
renderCashBody=function(){
 revisionBase.renderCashBody();if(cashTab!=='debts')return;
 const footer=document.querySelector('#cashBody .v2-home-footer');
 if(footer)footer.innerHTML=`<span>ကုန်သည်များ၏ နုတ်ရန်ကျန်ကြိုငွေ — ${cashText(advanceTotal())}</span>${btn('ကုန်သည်စာရင်း',`partnerKind='supplier';beginSetup('partners')`,'secondary','users')}`;
 const suppliers=state.masters.partners.filter(p=>p.kind==='supplier'&&supplierBalance(p.id)>0);
 if(suppliers.length)document.getElementById('cashBody').insertAdjacentHTML('beforeend',`<section class="card supplier-advances"><div class="card-title"><h3>ကုန်သည်အလိုက် ကြိုယူငွေ</h3></div>${suppliers.map(p=>`<div class="v3-partner-row"><div class="grow"><strong>${E(supplierLabel(p))}</strong><div class="record-meta">နုတ်ရန်ကျန် ${cashText(supplierBalance(p.id))}</div></div>${btn('ကြည့်မယ်',`openSupplierAdvanceHistory('${p.id}')`,'secondary')}</div>`).join('')}</section>`);
};
function openSupplierAdvanceHistory(id){
 const p=supplierBy(id),advances=state.partnerAdvances.filter(a=>a.partnerId===id);
 openModal('ကုန်သည် ကြိုယူငွေစာရင်း',E(supplierLabel(p)),supplierAdvanceSummary(id)+
 `<div class="stack">${advances.map(a=>`<section class="summary-box"><div class="summary-line"><span>${shortDate(a.date)} · ${E(a.reason)}</span><strong>${cashText(a.amount)}</strong></div>
 <div class="summary-line"><span>နုတ်ပြီးငွေ</span><strong>${cashText(a.allocations.reduce((s,x)=>s+x.amount,0))}</strong></div>
 ${a.allocations.map(x=>`<p class="field-help">${E(state.receipts.find(r=>r.id===x.receiptId)?.purchaseNo||x.receiptId)} — ${cashText(x.amount)}</p>`).join('')}
 ${a.legacy?'<p class="field-help">ယခင်မှတ်တမ်းမှ ဆက်ယူထားသည်။ ငွေထွက်အသစ် မတင်ပါ။</p>':''}</section>`).join('')}</div>`,
 btn('စာရင်းသို့','closeModal()','secondary')+btn('ကြိုငွေ ထပ်ထုတ်မယ်',`openSupplierAdvance('${id}')`,'primary','wallet'));
}
resetDemo=function(){
 state=revisionBase.seed();initPageRevision();wizard=null;receiptWizard=null;productReturn=null;workView=null;workDirty=false;lastReceiptSaved=null;
 invTab='overview';cashTab='movements';setupSection='overview';save();page='home';revisionBase.render();writeRoute('page',null,'home',true);toast('နမူနာဒေတာကို အစပြန်ဖွင့်ထားပါပြီ။');
};
openHelp=function(){
 openModal('အသုံးပြုနည်း','ပြင်ဆင်ထားသော V3.1 · စာမျက်နှာအလိုက် လုပ်ဆောင်မည်။',
 `<div class="stack">
 <section><h3>ကုန်လက်ခံမယ်</h3><p>ကုန်သည်အမည်ကို ရိုက်ရှာပါ။ “ဦးဖြူ” ကို ရှာလျှင် သပိတ်ကျင်းနှင့် ကြာညှပ်ကို နေရပ်ဖြင့် ခွဲရွေးနိုင်သည်။ မရှိပါက အောက်တွင် ကုန်သည်အသစ် ထည့်ပါ။</p></section>
 <section><h3>ကုန်နှင့် အလေးချိန်</h3><p>အဲဒီစာမျက်နှာပေါ်တွင်ပဲ ကုန်ကို ရှာရွေးပြီး ပိဿာထည့်ပါ။ ပြောင်းစံ ၂၅ ပိဿာဖြင့် ၂၅၀ ပိဿာ = ၁၀ အိတ်၊ ၂၆၀ ပိဿာ = ၁၀ အိတ် + ၁၀ ပိဿာ ဖြစ်သည်။</p></section>
 <section><h3>သိမ်းပြီး နောက်တစ်ခုထည့်မယ်</h3><p>“သိမ်းပြီး အသစ်ထပ်ထည့်မယ်” က အကြမ်းသိမ်းမည်။ “အချောသိမ်းပြီး အသစ်ထပ်ထည့်မယ်” က ဈေးစောင့်စာရင်းသို့ ရောက်မည်။ ခလုတ်နှစ်ခုလုံးက သိမ်းပြီး ဖောင်အလွတ် ပြန်ဖွင့်ပေးမည်။</p></section>
 <section><h3>ကုန်သည် ကြိုယူငွေ</h3><p>ကြိုယူငွေကို ကုန်သည်အောက်တွင် မှတ်နိုင်သည်။ အဝယ်ငွေရှင်းရာတွင် နုတ်မည့်ပမာဏကို ပြပြီး ကျန်ကြိုငွေကို ကုန်သည်အောက်တွင် ဆက်သိမ်းမည်။ အမည်တူသော်လည်း နေရပ်ကွဲသော ကုန်သည်များကို သီးခြားထားသည်။</p></section>
 <section><h3>နမူနာအကန့်အသတ်</h3><p>ဤဖိုင်သည် ဘရောက်ဇာအတွင်းသာ ဒေတာသိမ်းသော UI Prototype ဖြစ်သည်။ ဆာဗာ၊ လုံခြုံရေးနှင့် တကယ့်ငွေပေးချေမှု မပါပါ။ ကြိုငွေအဟောင်းမှ အစဉ်လိုက်နုတ်ခြင်းနှင့် တစ်စိတ်တစ်ပိုင်း နုတ်သုံးခြင်းကို စမ်းသုံးနိုင်ရန် ပြထားသည်။ နောက်ဆုံးလုပ်ငန်းစည်းမျဉ်းကို အတည်ပြုရန် လိုသည်။ ဘရောက်ဇာဒေတာဖျက်လျှင် နမူနာဒေတာ ပျောက်နိုင်သည်။</p></section>
 </div>`,btn('နမူနာ ပြန်စမယ်','openReset()','secondary','reset')+btn('စာရင်းသို့','closeModal()','primary','back'));
};

/* V3.3 pricing revision: automatic bag-based deductions from Master Setup, advance deduction, net amount, print voucher. */
const v32ReceiptCargo=receiptCargo;
receiptCargo=function(){
 v32ReceiptCargo();
 const next=document.getElementById('saveReceiptNext');
 if(next){next.innerHTML=I('price')+'ဈေးဖြတ်မယ်';next.setAttribute('onclick','saveReceiveAndPrice()');}
 const hint=document.querySelector('.modal-footer .save-hint');
 if(hint)hint.textContent='အကြမ်းသိမ်းပြီး နောက်တစ်ခုထည့်နိုင်သလို၊ တန်းပြီး ဈေးဖြတ်နိုင်ပါတယ်။';
};
function saveReceiveAndPrice(){
 lastReceiptSaved=null;saveReceiveAndNew(true);
 const id=lastReceiptSaved;if(id)openPricing(id);
}
const v32RenderReceiptRows=renderReceiptRows;
renderReceiptRows=function(){
 v32RenderReceiptRows();
 document.querySelectorAll('#receiptRows .record-button .btn').forEach(b=>{if(b.textContent.includes('အချောဖြည့်မယ်')||b.textContent.includes('ဈေးထည့်မယ်'))b.textContent='ဈေးဖြတ်မယ်';});
};
function pricingBagCount(r){return Number(r.actualBags??r.bags)||0;}
function pricingCalc(id){
 const r=state.receipts.find(x=>x.id===id);if(!r)return null;
 const price=number('receiptPrice')||0,bags=pricingBagCount(r);
 const rates=state.masters?.purchaseDeductions||{workRate:0,laborRate:0,borderRate:0};
 const workRate=Number(rates.workRate)||0,laborRate=Number(rates.laborRate)||0,borderRate=Number(rates.borderRate)||0;
 const gross=Math.round(r.qty*price),work=Math.round(bags*workRate),labor=Math.round(bags*laborRate),border=Math.round(bags*borderRate);
 const carriage=Math.max(0,Number(r.carriageAdvance)||0);
 const beforeAdvance=Math.max(0,gross-work-labor-border-carriage),pool=supplierBalance(r.partnerId),advance=Math.min(pool,beforeAdvance),net=beforeAdvance-advance;
 return {r,price,bags,workRate,laborRate,borderRate,gross,work,labor,border,carriage,pool,advance,net};
}
openPricing=function(id){
 if(!guardWork())return;const r=state.receipts.find(x=>x.id===id);if(!r)return;
 const key=r.product+'|'+r.grade,market=(state.priceDate===today()&&state.prices[key])?state.prices[key]:'';
 const prior=r.price&&r.priceDate===today()?r.price:'';const rate=market||prior||'';
 const defaults=state.masters?.purchaseDeductions||{};
 openModal('ဈေးဖြတ်မယ်',market?'ယနေ့ပေါက်ဈေးကို အလိုအလျောက် ထည့်ထားပါတယ်။ လိုအပ်လျှင် ပြင်နိုင်ပါတယ်။':'ယနေ့ပေါက်ဈေး မသတ်မှတ်ရသေးပါ။ ဈေးကို တိုက်ရိုက်ရိုက်ထည့်နိုင်ပါတယ်။',
 `${rSummary(r)}
 <form id="pricingForm" onsubmit="event.preventDefault();commitPriceVoucher('${id}')">
 ${field('တစ်ပိဿာ ဈေး','receiptPrice',{type:'number',min:1,value:rate,suffix:'ကျပ်',required:true,placeholder:'ဈေးနှုန်း ရိုက်ထည့်ပါ',extra:`oninput="updatePricingSheet('${id}')"`,help:market?'ယနေ့ပေါက်ဈေးမှ Auto ဖြည့်ထားသည်။ ပြင်၍လည်း ရသည်။':'ပေါက်ဈေးမရှိသေးသဖြင့် ကိုယ်တိုင်ထည့်ပါ။'})}
 <div class="pricing-bag-basis"><span>နုတ်ငွေတွက်မည့် အိတ်အရေအတွက်</span><strong>${N(pricingBagCount(r))} အိတ်</strong></div>
 <div class="deduction-grid">
  <div class="auto-deduction-box"><span>ဝန်ဆောင်ခ</span><strong id="autoWorkAmount">0 ကျပ်</strong><small>${M(defaults.workRate||0)} ကျပ် × ${N(pricingBagCount(r))} အိတ်</small></div>
  <div class="auto-deduction-box"><span>လုပ်သားခ</span><strong id="autoLaborAmount">0 ကျပ်</strong><small>${M(defaults.laborRate||0)} ကျပ် × ${N(pricingBagCount(r))} အိတ်</small></div>
  <div class="auto-deduction-box"><span>ဘော်ဒါကြေး</span><strong id="autoBorderAmount">0 ကျပ်</strong><small>${M(defaults.borderRate||0)} ကျပ် × ${N(pricingBagCount(r))} အိတ်</small></div>
 </div>
 ${r.carriageAdvance>0?`<div class="summary-box mb"><div class="summary-line"><span>တန်ဆာခ (ခေါက်ရှည်) · ကုန်လက်ခံချိန် ပွဲရုံမှ ယာယီစိုက်ထား</span><strong>− ${cashText(r.carriageAdvance)}</strong></div><p class="field-help">ကုန်လက်ခံဖောင်မှာ Manual ထည့်ခဲ့တဲ့ Amount ဖြစ်ပြီး ဒီဈေးဖြတ်စာရင်းမှာ ပြန်နုတ်ပါမည်။</p></div>`:''}
 <div class="row between wrap" style="margin:-6px 0 18px"><span class="field-help">Master Setup က တစ်အိတ်နှုန်းထားအတိုင်း Auto တွက်ထားသည်။</span><button type="button" class="btn-link" onclick="closeModal();beginSetup('deductions')">နှုန်းထား ပြင်မယ်</button></div>
 <div id="pricingSheet" class="summary-box pricing-sheet"></div>
 </form>
 ${supplierAdvanceSummary(r.partnerId)}
 <p class="field-help">ကြိုတင်ယူငွေရှိပါက ကုန်သည်၏ လက်ကျန်ကြိုငွေမှ အလိုအလျောက်နုတ်မည်။ ကုန်ဖိုးထက်ပို၍ မနုတ်ပါ။</p>`,
 btn('အပ်ထားမယ်',`saveDeposit('${id}')`,'secondary','stock')+btn('ဈေးဖြတ်ပြီး Print ထုတ်မယ်',`commitPriceVoucher('${id}')`,'primary','print','id="pricePrintBtn"'),true);
 updatePricingSheet(id);
};
function updatePricingSheet(id){
 const c=pricingCalc(id),box=document.getElementById('pricingSheet');if(!c||!box)return;
 const noPrice=!(c.price>0);
 const aw=document.getElementById('autoWorkAmount'),al=document.getElementById('autoLaborAmount'),ab=document.getElementById('autoBorderAmount');
 if(aw)aw.textContent=cashText(c.work);if(al)al.textContent=cashText(c.labor);if(ab)ab.textContent=cashText(c.border);
 box.innerHTML=noPrice?note('ဈေးနှုန်းထည့်ပြီးပါက ကုန်ဖိုး၊ နုတ်ငွေနှင့် အသားတင်ရငွေကို အလိုအလျောက်တွက်ပေးပါမယ်။','amber'):`
 <div class="summary-line"><span>ကုန်ဖိုး (${vissText37(c.r.qty)} ပိဿာ × ${M(c.price)} ကျပ်)</span><strong>${cashText(c.gross)}</strong></div>
 <div class="summary-line"><span>ဝန်ဆောင်ခ (${N(c.bags)} အိတ် × ${M(c.workRate)})</span><strong>− ${cashText(c.work)}</strong></div>
 <div class="summary-line"><span>လုပ်သားခ (${N(c.bags)} အိတ် × ${M(c.laborRate)})</span><strong>− ${cashText(c.labor)}</strong></div>
 <div class="summary-line"><span>ဘော်ဒါကြေး (${N(c.bags)} အိတ် × ${M(c.borderRate)})</span><strong>− ${cashText(c.border)}</strong></div>
 ${c.carriage>0?`<div class="summary-line"><span>တန်ဆာခ (ခေါက်ရှည်) · ယာယီစိုက်ငွေ ပြန်နုတ်</span><strong>− ${cashText(c.carriage)}</strong></div>`:''}
 <div class="summary-line"><span>ကြိုတင်ယူငွေ</span><strong>− ${cashText(c.advance)}</strong></div>
 <div class="summary-line total"><span>အသားတင် ရငွေ</span><strong>${cashText(c.net)}</strong></div>`;
 const b=document.getElementById('pricePrintBtn');if(b)b.disabled=noPrice;
}
function commitPriceVoucher(id){
 if(!guardWork()||!validForm('pricingForm'))return;const c=pricingCalc(id);if(!c||!(c.price>0))return error('ဈေးနှုန်းကို သုညထက်ပို၍ ထည့်ပါ။');
 const vals=[c.workRate,c.laborRate,c.borderRate];if(vals.some(v=>!Number.isFinite(v)||v<0))return error('နှုန်းထားများကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။');
 const r=c.r;if(r.status==='purchased')return printPriceVoucher(r.id);
 const lot=state.lots.find(l=>l.receiptId===r.id&&l.owner==='supplier');if(!lot)return error('ဆက်စပ်အပ်ကုန် မတွေ့ပါ။');
 r.advanceAllocations=allocateSupplierAdvance(r.partnerId,r.id,c.advance);
 Object.assign(r,{price:c.price,priceDate:today(),wage:c.work,weigh:c.labor,borderFee:c.border,workRate:c.workRate,laborRate:c.laborRate,borderRate:c.borderRate,advance:c.advance,paid:0,status:'purchased',purchaseDate:today(),purchaseNo:'အဝ-'+String(++state.counter).padStart(3,'0')});
 if(r.carriageExpenseId){const ex=state.expenses.find(x=>x.id===r.carriageExpenseId);if(ex){ex.recovered=true;ex.recoveredDate=today();ex.recoveredReceiptId=r.id;}}
 lot.owner='owned';lot.name='ပွဲရုံပိုင်';lot.cost=r.price;
 activity(r.name+' ၏ '+r.product+' ကို ဈေးဖြတ်ပြီး အသားတင် '+cashText(c.net)+' ဖြင့် အဝယ်ဘောက်ချာ ထုတ်ခဲ့သည်။');
 save();workDirty=false;printPriceVoucher(r.id);setTimeout(()=>{closeModal();page='receipts';revisionBase.render();toast('ဈေးဖြတ်ပြီး အဝယ်ဘောက်ချာ သိမ်းထားပါတယ်။');},250);
}
function printPriceVoucher(id){
 const r=state.receipts.find(x=>x.id===id);if(!r)return;const bags=pricingBagCount(r),net=purchaseNet(r);
 const area=document.getElementById('printArea');area.innerHTML=`<div class="print-title"><h1>အဝယ်ဘောက်ချာ</h1><p>${E(r.purchaseNo||r.no)} · ${shortDate(r.purchaseDate||today())}</p></div>
 <p>ကုန်သည် — <strong>${E(r.name)}${r.locality?' ('+E(r.locality)+')':''}</strong></p>
 <p>ကုန် — <strong>${E(r.product)} · အဆင့် ${E(r.grade)}</strong></p>
 <table style="margin-top:18px"><thead><tr><th>အလေးချိန်</th><th>အိတ်</th><th>တစ်ပိဿာဈေး</th><th>ကုန်ဖိုး</th></tr></thead><tbody><tr><td>${vissText37(r.qty)} ပိဿာ</td><td>${N(bags)} အိတ်</td><td>${M(r.price)} ကျပ်</td><td>${cashText(gross(r))}</td></tr></tbody></table>
 <div style="margin-top:20px"><p>ဝန်ဆောင်ခ — − ${cashText(r.wage||0)}</p><p>လုပ်သားခ — − ${cashText(r.weigh||0)}</p><p>ဘော်ဒါကြေး — − ${cashText(r.borderFee||0)}</p>${r.carriageAdvance?`<p>တန်ဆာခ (ခေါက်ရှည်) — − ${cashText(r.carriageAdvance)}</p>`:''}<p>ကြိုတင်ယူငွေ — − ${cashText(r.advance||0)}</p><h2 style="margin-top:14px">အသားတင် ရငွေ — ${cashText(net)}</h2></div>`;
 window.print();
}

/* V3.4 requested changes: add an advance action beside pricing and allow an
   explicit home-to-payment-account transfer when purchase cash is short. */
const v33RenderReceiptRows=renderReceiptRows;
renderReceiptRows=function(){
 v33RenderReceiptRows();
 document.querySelectorAll('#receiptRows .v2-record').forEach(row=>{
  const nameButton=row.querySelector('.name-btn');
  const id=nameButton?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
  const receipt=state.receipts.find(r=>r.id===id);
  const actions=row.querySelector('.record-button');
  if(!receipt||receipt.status==='purchased'||!actions)return;
  row.classList.add('advance-price-row');
  actions.classList.add('purchase-actions');
  const priceButton=actions.querySelector('.btn');
  if(priceButton)priceButton.innerHTML=I('price')+'ဈေးဖြတ်မည်';
  actions.insertAdjacentHTML('afterbegin',btn('ကြိုငွေထုတ်မည်',`openAdvance('${receipt.id}','pricing')`,'soft','wallet'));
 });
};

function purchaseFundingState(id){
 const receipt=state.receipts.find(r=>r.id===id);
 const account=value('payPurchaseAccount')||'cash';
 const amount=number('payPurchaseAmount');
 const requested=Number.isFinite(amount)?amount:(receipt?due(receipt):0);
 const available=bal(account);
 const shortfall=Math.max(0,requested-available);
 const home=state.masters.accounts.find(a=>a.active&&a.type==='home')||state.masters.accounts.find(a=>a.id==='home');
 return {receipt,account,requested,available,shortfall,home,homeAvailable:home?bal(home.id):0};
}

openPurchasePayment=function(id){
 if(!guardWork())return;
 const r=state.receipts.find(x=>x.id===id);
 if(!r)return error('အဝယ်စာရင်း မတွေ့ပါ။');
 if(due(r)<=0){toast('ငွေရှင်းပြီးသား ဖြစ်ပါတယ်။');return;}
 const accounts=state.masters.accounts.filter(a=>a.active&&a.type!=='home'&&canViewAccount68(a)).map(a=>[a.id,a.name]);
 openModal('ကျန်ရှိသော အဝယ်ငွေ ရှင်းမယ်',`${E(r.name)} · ${r.purchaseNo||r.no}`,
 `${rSummary(r)}<div class="summary-box mb"><div class="summary-line"><span>ကုန်ဖိုး</span><strong>${cashText(gross(r))}</strong></div><div class="summary-line"><span>ဝန်ဆောင်ခ / လုပ်သားခ / အခြားနုတ်ငွေ</span><strong>${cashText((r.wage||0)+(r.weigh||0)+(r.borderFee||0))}</strong></div>${r.carriageAdvance?`<div class="summary-line"><span>တန်ဆာခ (ခေါက်ရှည်) ပြန်နုတ်ထား</span><strong>${cashText(r.carriageAdvance)}</strong></div>`:''}<div class="summary-line"><span>ကြိုရှင်းငွေ + ထပ်ရှင်းပြီးငွေ</span><strong>${cashText((r.advance||0)+(r.paid||0))}</strong></div><div class="summary-line total"><span>ယခု ရှင်းရန်ကျန်</span><strong>${cashText(due(r))}</strong></div></div>
 <form id="purchasePayForm" onsubmit="event.preventDefault();savePurchasePayment('${id}')"><div class="field-row">${selectField('ငွေသိမ်းရာ / ပေးချေမှု','payPurchaseAccount',accounts,'cash',`onchange="updatePurchaseFunding('${id}')"`)}${field('ယခု ထုတ်ပေးမည့်ငွေ','payPurchaseAmount',{type:'number',min:1,max:due(r),value:due(r),required:true,suffix:'ကျပ်',extra:`oninput="updatePurchaseFunding('${id}')"`})}</div></form>
 <div id="purchaseHomeFunding" class="purchase-home-funding" aria-live="polite"></div>`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('အိမ်မှ ယူမည်',`takePurchaseMoneyFromHome('${id}')`,'soft','home','id="takeFromHomeBtn"')+btn('ငွေရှင်းပြီး သိမ်းမယ်',`savePurchasePayment('${id}')`,'primary','check'));
 updatePurchaseFunding(id);
};

function updatePurchaseFunding(id){
 const f=purchaseFundingState(id),box=document.getElementById('purchaseHomeFunding'),button=document.getElementById('takeFromHomeBtn');
 if(!box||!button)return;
 if(!(f.requested>0)){
  box.innerHTML=note('ထုတ်ပေးမည့်ငွေကို ထည့်ပါ။','amber');
  button.disabled=true;
 }else if(f.shortfall===0){
  box.innerHTML=note(`ရွေးထားသော ငွေသိမ်းရာတွင် ${cashText(f.available)} ရှိ၍ လက်ကျန်လုံလောက်ပါသည်။`,'blue');
  button.disabled=true;
 }else if(!f.home||f.shortfall>f.homeAvailable){
  box.innerHTML=note(`ရွေးထားသော ငွေသိမ်းရာတွင် ${cashText(f.shortfall)} လိုနေပြီး အိမ်ငွေလက်ကျန်လည်း မလောက်ပါ။`,'amber');
  button.disabled=true;
 }else{
  box.innerHTML=note(`ရွေးထားသော ငွေသိမ်းရာတွင် ${cashText(f.shortfall)} လိုနေပါသည်။ “အိမ်မှ ယူမည်” ကိုနှိပ်ပြီး လိုငွေကို ဖြည့်နိုင်ပါသည်။`,'amber');
  button.disabled=false;
 }
}

function takePurchaseMoneyFromHome(id){
 if(!guardWork())return;
 const f=purchaseFundingState(id);
 if(!f.receipt||!(f.requested>0))return error('အဝယ်နှင့် ထုတ်ပေးမည့်ငွေကို ပြန်စစ်ပါ။');
 if(f.shortfall<=0){updatePurchaseFunding(id);return toast('ရွေးထားသော ငွေသိမ်းရာတွင် လက်ကျန်လုံလောက်ပါသည်။');}
 if(!f.home||f.shortfall>f.homeAvailable)return error('အိမ်ငွေလက်ကျန် မလောက်ပါ။');
 const ref=f.receipt.purchaseNo||f.receipt.no;
 txn(f.home.id,-f.shortfall,'အဝယ်ငွေအတွက် ထုတ်ယူခြင်း',ref,f.receipt.name);
 txn(f.account,f.shortfall,'အိမ်မှ အဝယ်ငွေ ဖြည့်ခြင်း',ref,f.receipt.name);
 activity(f.receipt.name+' ၏ အဝယ်ငွေအတွက် အိမ်မှ '+cashText(f.shortfall)+' ယူခဲ့သည်။');
 save();updatePurchaseFunding(id);toast('အိမ်မှလိုငွေကို ရွေးထားသော ငွေသိမ်းရာသို့ ထည့်ပြီးပါပြီ။');
}

savePurchasePayment=function(id){
 if(!guardWork()||!validForm('purchasePayForm'))return;
 const r=state.receipts.find(x=>x.id===id),amount=number('payPurchaseAmount'),account=value('payPurchaseAccount');
 if(!r)return error('အဝယ်စာရင်း မတွေ့ပါ။');
 if(!Number.isFinite(amount)||amount<=0||amount>due(r))return error('ထုတ်ပေးငွေသည် သုညထက်ပိုပြီး ရှင်းရန်ကျန်ငွေထက် မများရပါ။');
 if(amount>bal(account)){updatePurchaseFunding(id);return error('ရွေးထားသော ငွေသိမ်းရာတွင် ငွေမလောက်ပါ။ “အိမ်မှ ယူမည်” ကိုနှိပ်ပြီး လိုငွေဖြည့်ပါ။');}
 r.paid=(r.paid||0)+amount;
 txn(account,-amount,'အဝယ်ကျန်ငွေ ရှင်းခြင်း',r.purchaseNo||r.no,r.name);
 activity(r.name+' ၏ အဝယ်ကျန်ငွေ '+cashText(amount)+' ရှင်းခဲ့သည်။');
 save();closeModal();render();toast('ကျန်ငွေရှင်းပြီးပါပြီ။ ကုန်စာရင်းကို ထပ်မပြောင်းပါ။');
};

/* V3.5 requested change: expense reasons are selected from Master Setup. */
const defaultExpenseReasons=()=>[
 {id:'ER01',name:'ပွဲရုံခံ သယ်ယူခ',active:true},
 {id:'ER02',name:'မီးဖိုး',active:true},
 {id:'ER03',name:'ရေဖိုး',active:true},
 {id:'ER04',name:'အထွေထွေ အသုံးစရိတ်',active:true}
];
function ensureExpenseReasonMasters(){
 if(!Array.isArray(state.masters.expenseReasons))state.masters.expenseReasons=defaultExpenseReasons();
 state.masters.expenseReasons.forEach(r=>{r.name=cleanText(r.name);r.active=r.active!==false;});
}
function expenseReasonBy(id){return state.masters.expenseReasons.find(r=>r.id===id);}
function activeExpenseReasons(){return state.masters.expenseReasons.filter(r=>r.active);}

const v34InitPageRevision=initPageRevision;
initPageRevision=function(){v34InitPageRevision();ensureExpenseReasonMasters();};

const v34SetupView=setupView;
setupView=function(){
 if(setupSection==='expenseReasons')return expenseReasonList();
 let html=v34SetupView();
 if(setupSection!=='overview')return html;
 const reasons=activeExpenseReasons();
 const card=`<button class="v2-records-card v3-master-card" onclick="beginSetup('expenseReasons')"><span class="icon-box">${I('note')}</span><strong>အသုံးစရိတ် အကြောင်းအရာများ</strong><p>အသုံးစရိတ်မှတ်တမ်းတွင် ရွေးချယ်အသုံးပြုမည့် စာရင်း</p><div class="v3-card-bottom"><span>${reasons.length} မျိုး အသုံးပြုနေသည်</span><span class="end-link">ပြင်ဆင်မယ် ${I('arrow')}</span></div></button>`;
 return html.replace('</div><div class="v3-rule-strip">',card+'</div><div class="v3-rule-strip">');
};

function expenseReasonList(){
 ensureExpenseReasonMasters();
 const reasons=state.masters.expenseReasons;
 return setupBack()+heading('','အသုံးစရိတ် အကြောင်းအရာများ','အသုံးစရိတ်မှတ်တမ်းတွင် Dropdown ဖြင့် ရွေးချယ်အသုံးပြုမည့် စာရင်း။',btn('အကြောင်းအရာအသစ် ထည့်မယ်','openExpenseReasonEdit()','primary','plus'))+
 `<div class="v2-list">${reasons.map(r=>{
  const used=state.expenses.filter(x=>x.reasonId===r.id||(!x.reasonId&&x.reason===r.name)).length;
  return `<div class="v3-partner-row"><span class="icon-box">${I('note')}</span><div class="grow"><strong>${E(r.name)}</strong><div class="record-meta">${r.active?'အသုံးပြုနေသည်':'အသုံးမပြုတော့ပါ'} · အသုံးစရိတ်မှတ်တမ်း ${used} ခု</div></div>${btn('ပြင်မယ်',`openExpenseReasonEdit('${r.id}')`,'secondary','edit')}</div>`;
 }).join('')||empty('အသုံးစရိတ် အကြောင်းအရာ မရှိသေးပါ။','note')}</div>
 <p class="field-help mt">အသုံးမပြုတော့သော အကြောင်းအရာကို အသစ်မှတ်တမ်းတင်ရာတွင် မပြပါ။ ယခင်အသုံးစရိတ်မှတ်တမ်းများ မပျက်ပါ။</p>`;
}

function openExpenseReasonEdit(id=''){
 const existing=expenseReasonBy(id),reason=existing||{id:'',name:'',active:true};
 const used=existing?state.expenses.filter(x=>x.reasonId===id||(!x.reasonId&&x.reason===existing.name)).length:0;
 openModal(existing?'အသုံးစရိတ် အကြောင်းအရာ ပြင်မယ်':'အသုံးစရိတ် အကြောင်းအရာအသစ် ထည့်မယ်','နေ့စဉ်အသုံးစရိတ်မှတ်တမ်းတွင် ရွေးချယ်ရန် အသုံးပြုမည်။',
 `<form id="expenseReasonMasterForm" onsubmit="event.preventDefault();saveExpenseReasonMaster('${id}')">
 ${field('အကြောင်းအရာအမည်','masterExpenseReasonName',{value:reason.name,required:true,placeholder:'ဥပမာ — ဖုန်းဘေလ်',extra:'maxlength="80"'})}
 ${existing?selectField('အခြေအနေ','masterExpenseReasonActive',[[true,'အသုံးပြုမည်'],[false,'အသစ်မှတ်တမ်းတင်ရာတွင် မသုံးတော့ပါ']],reason.active):''}
 </form>${existing?`<p class="field-help">ယခင်အသုံးစရိတ်မှတ်တမ်း ${used} ခုတွင် သိမ်းထားသောအမည်ကို မပြောင်းပါ။</p>`:''}`,
 btn('မပြင်တော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveExpenseReasonMaster('${id}')`,'primary','check'));
}

function saveExpenseReasonMaster(id=''){
 if(!validForm('expenseReasonMasterForm'))return;
 const name=cleanText(value('masterExpenseReasonName'));
 if(!safeLabel(name))return error('အကြောင်းအရာအမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
 if(state.masters.expenseReasons.some(r=>r.id!==id&&searchText(r.name)===searchText(name)))return error('အမည်တူ အသုံးစရိတ်အကြောင်းအရာ ရှိပြီးသားဖြစ်ပါသည်။');
 const existing=expenseReasonBy(id),before=existing?{...existing}:null,reason=existing||{id:uid('ER'),active:true};
 reason.name=name;if(existing)reason.active=value('masterExpenseReasonActive')==='true';
 if(!existing)state.masters.expenseReasons.push(reason);
 masterLog('expenseReason',reason.id,before,reason);save();workDirty=false;closeModal();render();toast('အသုံးစရိတ် အကြောင်းအရာကို သိမ်းပြီးပါပြီ။');
}

openExpense=function(){
 if(!guardWork())return;
 ensureExpenseReasonMasters();
 const reasons=activeExpenseReasons();
 if(!reasons.length){
  openModal('အသုံးစရိတ် အကြောင်းအရာ မရှိသေးပါ။','အခြေခံသတ်မှတ်ချက်များတွင် အရင်သတ်မှတ်ပါ။',note('အသုံးစရိတ်မှတ်တမ်းတင်ရန် အနည်းဆုံး အကြောင်းအရာတစ်ခု လိုအပ်ပါသည်။','amber'),
  btn('ပိတ်မယ်','closeModal()','secondary')+btn('အကြောင်းအရာ သတ်မှတ်မယ်',"closeModal();beginSetup('expenseReasons')",'primary','settings'));
  return;
 }
 openModal('ပွဲရုံခံ အသုံးစရိတ် မှတ်မယ်','လုပ်ငန်းက ကိုယ်တိုင်ခံရသော အသုံးစရိတ်ကိုသာ ထည့်ပါ။',
 `<form id="expenseForm" onsubmit="event.preventDefault();saveExpense()">
 ${selectField('အသုံးစရိတ် အကြောင်းအရာ','expenseReason',reasons.map(r=>[r.id,r.name]),reasons[0].id)}
 <p class="field-help">အကြောင်းအရာစာရင်းကို အခြေခံသတ်မှတ်ချက်များတွင် ပြင်ဆင်နိုင်ပါသည်။</p>
 <div class="field-row">${accountField('expenseAccount')}${field('ထုတ်ပေးသော ငွေပမာဏ','expenseAmount',{type:'number',min:1,required:true,suffix:'ကျပ်'})}</div></form>
 ${note('အဝယ်ဘောက်ချာမှ နုတ်ထားသော လုပ်သားခကို ဤနေရာတွင် ပွဲရုံခံကုန်ကျစရိတ်အဖြစ် ထပ်မမှတ်ပါနှင့်။ ထိုငွေ ပြန်ရှင်းပုံ၏ စာရင်းကိုင်စည်းမျဉ်း အတည်ပြုရန်ကျန်သည်။','amber')}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('အသုံးစရိတ် သိမ်းမယ်','saveExpense()','primary','check'));
};

saveExpense=function(){
 if(!guardWork()||!validForm('expenseForm'))return;
 const reasonId=value('expenseReason'),reason=expenseReasonBy(reasonId),amount=number('expenseAmount'),account=value('expenseAccount');
 if(!reason||!reason.active)return error('အသုံးပြုနိုင်သော အသုံးစရိတ် အကြောင်းအရာကို ရွေးပါ။');
 if(!Number.isFinite(amount)||amount<=0)return error('ငွေပမာဏကို သုညထက်ပို၍ ထည့်ပါ။');
 if(amount>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာလက်ကျန် မလောက်ပါ။');
 const id=uid('E');
 state.expenses.push({id,date:today(),reasonId:reason.id,reason:reason.name,amount,account});
 txn(account,-amount,'ပွဲရုံခံအသုံး — '+reason.name,id);activity(reason.name+' အတွက် '+cashText(amount)+' သုံးစွဲခဲ့သည်။');
 save();closeModal();render();toast('အသုံးစရိတ်နှင့် ငွေထွက်မှတ်တမ်း သိမ်းပြီးပါပြီ။');
};

/* V3.6 requested change: shared Date Range filters for all owner reports. */
function isoFromDate(d){
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function shiftIso(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return isoFromDate(d);}
let ownerDateTo=today(),ownerDateFrom=today().slice(0,8)+'01',ownerDatePreset='month';
function inOwnerDateRange(date){const d=String(date||'');return d>=ownerDateFrom&&d<=ownerDateTo;}
function ownerDatedValues(){
 const values=[
  ...state.receipts.flatMap(r=>[r.date,r.purchaseDate]),...state.sales.map(x=>x.date),...state.expenses.map(x=>x.date),
  ...state.transactions.map(x=>x.date),...state.moves.map(x=>x.date),...state.requests.flatMap(x=>[x.date,x.receivedDate]),
  ...state.activity.map(x=>x.date),...Object.values(state.grounds||{}).map(x=>x.date)
 ].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||'')));
 return values.length?values:[today()];
}
function setOwnerDatePreset(preset){
 const end=today();ownerDatePreset=preset;ownerDateTo=end;
 if(preset==='today')ownerDateFrom=end;
 else if(preset==='7days')ownerDateFrom=shiftIso(end,-6);
 else if(preset==='month')ownerDateFrom=end.slice(0,8)+'01';
 else{const dates=ownerDatedValues().sort();ownerDateFrom=dates[0];ownerDateTo=dates[dates.length-1];}
 render();
}
function applyOwnerDateRange(){
 const from=document.getElementById('ownerDateFrom')?.value,to=document.getElementById('ownerDateTo')?.value;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||''))return toast('From Date နှင့် To Date ကို ရွေးပါ။',true);
 if(from>to)return toast('From Date သည် To Date ထက် နောက်ကျ၍ မရပါ။',true);
 ownerDateFrom=from;ownerDateTo=to;ownerDatePreset='custom';render();
}
function ownerRangeText(){return ownerDateFrom===ownerDateTo?shortDate(ownerDateFrom):shortDate(ownerDateFrom)+' မှ '+shortDate(ownerDateTo)+' အထိ';}
function ownerDateFilterBar(noteText='ရွေးထားသော Date Range အလိုက် Report ကို ပြပါမည်။'){
 const presets=[['today','ယနေ့'],['7days','၇ ရက်'],['month','ယခုလ'],['all','အားလုံး']];
 return `<section class="owner-date-filter"><div class="owner-date-filter-top"><div class="owner-date-filter-title"><strong>Date Range</strong><span>${E(noteText)}</span></div>
 <div class="owner-date-fields"><label for="ownerDateFrom">From Date<input id="ownerDateFrom" type="date" value="${ownerDateFrom}" max="${ownerDateTo}"></label><label for="ownerDateTo">To Date<input id="ownerDateTo" type="date" value="${ownerDateTo}" min="${ownerDateFrom}"></label>${btn('ကြည့်မယ်','applyOwnerDateRange()','primary','search')}</div></div>
 <div class="owner-date-quick">${presets.map(([k,t])=>`<button type="button" class="${ownerDatePreset===k?'active':''}" onclick="setOwnerDatePreset('${k}')">${t}</button>`).join('')}</div></section>`;
}

const v35OwnerPage=ownerPage;
ownerPage=function(){
 const allActivity=state.activity;state.activity=allActivity.filter(a=>inOwnerDateRange(a.date));
 let html=v35OwnerPage();state.activity=allActivity;
 const purchases=state.receipts.filter(r=>r.status==='purchased'&&inOwnerDateRange(r.purchaseDate||r.date));
 const sales=state.sales.filter(s=>inOwnerDateRange(s.date));
 const expenses=state.expenses.filter(x=>inOwnerDateRange(x.date));
 const purchaseValue=purchases.reduce((n,r)=>n+gross(r),0),saleValue=sales.reduce((n,s)=>n+s.total,0),expenseValue=expenses.reduce((n,x)=>n+x.amount,0);
 const rangeSummary=`<div class="owner-period-title"><strong>ရွေးထားသောကာလ အကျဉ်းချုပ်</strong><span>${ownerRangeText()}</span></div><div class="v2-kpis">${simpleKpi('ကာလအတွင်း အဝယ်တန်ဖိုး',purchaseValue,`${purchases.length} စောင်`)}${simpleKpi('ကာလအတွင်း အရောင်းတန်ဖိုး',saleValue,`${sales.length} စောင်`)}${simpleKpi('ကာလအတွင်း အသုံးစရိတ်',expenseValue,`${expenses.length} ခု`)}${simpleKpi('ကာလအတွင်း လုပ်ဆောင်ချက်',allActivity.filter(a=>inOwnerDateRange(a.date)).length,'ခု')}</div>`;
 return html.replace('<div class="v2-kpis">',ownerDateFilterBar('ကာလအကျဉ်းချုပ်နှင့် လုပ်ဆောင်ချက်များကို စစ်ထုတ်ပါမည်။ လက်ကျန်များသည် လက်ရှိအခြေအနေဖြစ်သည်။')+rangeSummary+'<div class="owner-period-title"><strong>လက်ရှိ လက်ကျန်အခြေအနေ</strong><span>ယခုအချိန်</span></div><div class="v2-kpis">');
};

const v35InventoryPage=inventoryPage;
inventoryPage=function(){
 const html=v35InventoryPage();
 if(state.role!=='owner')return html;
 return html.replace('<div class="grid cols-4 mb">',ownerDateFilterBar('ကုန်လယ်ဂျာနှင့် မြေပြင်စစ်ချက်ကို Date Range အလိုက် စစ်ထုတ်ပါမည်။ ပိုင်ဆိုင်မှုလက်ကျန်သည် လက်ရှိအခြေအနေဖြစ်သည်။')+'<div class="grid cols-4 mb">');
};
function ownerInventoryLedger(){
 const current=new Map(stockGroups(state.lots).map(g=>[g.key,g]));
 const keys=new Set([...(state.stockOpening||[]).map(x=>x.key),...state.moves.map(m=>m.product+'|'+m.grade),...current.keys()]);
 const rows=[...keys].sort().map(key=>{
  const [product,grade]=key.split('|'),base=state.stockOpening.find(x=>x.key===key)?.qty||0;
  const before=state.moves.filter(m=>m.product===product&&m.grade===grade&&m.date<ownerDateFrom).reduce((n,m)=>n+(m.direction==='in'?m.qty:-m.qty),0);
  const range=state.moves.filter(m=>m.product===product&&m.grade===grade&&inOwnerDateRange(m.date));
  const ins=range.filter(m=>m.direction==='in').reduce((n,m)=>n+m.qty,0),outs=range.filter(m=>m.direction==='out').reduce((n,m)=>n+m.qty,0),opening=base+before,closing=opening+ins-outs;
  const ground=state.grounds[key]&&inOwnerDateRange(state.grounds[key].date)?state.grounds[key]:null;
  return `<tr><td><strong>${E(product)} · ${E(grade)}</strong></td><td class="right">${vissText37(opening)}</td><td class="right green">${vissText37(ins)}</td><td class="right">${vissText37(outs)}</td><td class="right"><strong>${vissText37(closing)}</strong></td><td class="right">${ground?N(ground.qty):'—'}</td><td class="right ${ground&&ground.difference!==0?'danger-text':'green'}">${ground?N(ground.difference):'—'}</td></tr>`;
 }).join('');
 return `<div class="mb">${note(`ကုန်အဝင်/အထွက်ကို ${ownerRangeText()} အတွင်းတွက်ထားသည်။ ကာလမစမီ လှုပ်ရှားမှုများကို အဖွင့်လက်ကျန်ထဲ ထည့်တွက်ထားပါသည်။`)}</div><div class="table-wrap"><table><thead><tr><th>ကုန် / အဆင့်</th><th class="right">ကာလအဖွင့်</th><th class="right">ကုန်ဝင်</th><th class="right">ကုန်ထွက်</th><th class="right">ကာလအပိတ်</th><th class="right">မြေပြင်စစ်ချက်</th><th class="right">ကွာဟချက်</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function ownerGroundReport(){
 const entries=Object.entries(state.grounds||{}).filter(([,g])=>inOwnerDateRange(g.date));
 return `<div class="mb">${note(`မြေပြင်စစ်ချက်ကို ${ownerRangeText()} အတွင်း စစ်ထုတ်ထားသည်။`,'blue')}</div>`+(entries.length?`<div class="table-wrap"><table><thead><tr><th>ကုန် / အဆင့်</th><th>ရက်စွဲ</th><th class="right">စာရင်းလက်ကျန်</th><th class="right">တကယ်ရရှိ</th><th class="right">ပိဿာကွာဟချက်</th><th>မှတ်ချက်</th></tr></thead><tbody>${entries.map(([k,g])=>`<tr><td><strong>${E(k.split('|').join(' · '))}</strong></td><td>${shortDate(g.date)}<div class="sub">${E(g.time)}</div></td><td class="right">${vissText37(g.expectedQty)} ပိဿာ</td><td class="right">${vissText37(g.qty)} ပိဿာ<div class="sub">${N(g.bags)} အိတ်</div></td><td class="right ${g.difference?'danger-text':'green'}">${N(g.difference)}</td><td>${E(g.note)||'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('ရွေးထားသောကာလအတွင်း မြေပြင်စစ်ချက် မရှိပါ။','scale'));
}
const v35RenderInventoryBody=renderInventoryBody;
renderInventoryBody=function(){
 if(state.role==='owner'&&invTab==='ledger'){document.getElementById('inventoryBody').innerHTML=ownerInventoryLedger();return;}
 if(state.role==='owner'&&invTab==='ground'){document.getElementById('inventoryBody').innerHTML=ownerGroundReport();return;}
 v35RenderInventoryBody();
};

const v35CashPage=cashPage;
cashPage=function(){
 const html=v35CashPage();
 if(state.role!=='owner')return html;
 return html.replace('<div class="v2-cash-strip">',ownerDateFilterBar('ငွေအဝင်/အထွက်နှင့် ငွေယူလက်မှတ်များကို Date Range အလိုက် စစ်ထုတ်ပါမည်။ လက်ကျန်နှင့် အကြွေးများသည် လက်ရှိအခြေအနေဖြစ်သည်။')+'<div class="v2-cash-strip">');
};
function ownerCashMovementReport(){
 const rows=state.transactions.filter(t=>inOwnerDateRange(t.date)),incoming=rows.filter(t=>t.amount>0).reduce((n,t)=>n+t.amount,0),outgoing=-rows.filter(t=>t.amount<0).reduce((n,t)=>n+t.amount,0);
 return `<div class="grid cols-3 mb">${stat('ကာလအတွင်း ငွေဝင်',M(incoming),'ကျပ်','receive',ownerRangeText(),'compact')}${stat('ကာလအတွင်း ငွေထွက်',M(outgoing),'ကျပ်','transfer',ownerRangeText(),'compact')}${stat('အသားတင် လှုပ်ရှားမှု',M(incoming-outgoing),'ကျပ်','wallet','ငွေသိမ်းရာကြား ရွှေ့ခြင်းပါဝင်သည်','compact')}</div>`+
 (rows.length?`<div class="table-wrap"><table><thead><tr><th>ရက်စွဲ / အကြောင်းအရာ</th><th>ငွေသိမ်းရာ</th><th>သက်ဆိုင်သူ / အမှတ်</th><th class="right">ငွေဝင်</th><th class="right">ငွေထွက်</th></tr></thead><tbody>${rows.slice().reverse().map(t=>`<tr><td><strong>${E(t.title)}</strong><div class="sub">${shortDate(t.date)} · ${E(t.time)}</div></td><td>${E(ACCOUNT_NAMES[t.account]||t.account)}</td><td>${E(t.party)||'—'}<div class="sub">${E(t.ref)}</div></td><td class="right green">${t.amount>0?cashText(t.amount):'—'}</td><td class="right">${t.amount<0?cashText(-t.amount):'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('ရွေးထားသောကာလအတွင်း ငွေအဝင် / အထွက် မရှိပါ။','wallet'))+
 `<div class="mt">${note('အိမ်နှင့် ပွဲရုံကြား ငွေရွှေ့ခြင်းသည် ငွေဝင်နှင့် ငွေထွက် နှစ်ဖက်လုံးတွင် ပါဝင်သည်။ အမြတ်/အရှုံးအဖြစ် မတွက်ပါ။')}</div>`;
}
const v35RenderCashBody=renderCashBody;
renderCashBody=function(){
 if(state.role==='owner'&&cashTab==='movements'){document.getElementById('cashBody').innerHTML=ownerCashMovementReport();return;}
 if(state.role==='owner'&&cashTab==='requests'){
  const all=state.requests;state.requests=all.filter(r=>inOwnerDateRange(r.date));v35RenderCashBody();state.requests=all;return;
 }
 v35RenderCashBody();
};

profitPage=function(){
 const sales=state.sales.filter(s=>inOwnerDateRange(s.date)),expenses=state.expenses.filter(x=>inOwnerDateRange(x.date));
 const revenue=sales.reduce((n,s)=>n+s.total,0),cost=sales.reduce((n,s)=>n+s.cost,0),expenseTotal=expenses.reduce((n,x)=>n+x.amount,0),profit=revenue-cost-expenseTotal;
 return heading('ပိုင်ရှင်အတွက်','အရှုံးအမြတ် · နမူနာတွက်ချက်မှု','ရွေးထားသော Date Range အလိုက် တွက်ချက်ထားပါသည်။',pill('တွက်ချက်နည်း အတည်ပြုရန်ကျန်','amber'))+
 ownerDateFilterBar('အရောင်း၊ ရောင်းကုန်ဝယ်ရင်းနှင့် လုပ်ငန်းအသုံးစရိတ်ကို Date Range အလိုက် တွက်ချက်ပါမည်။')+
 `<div class="mb">${note('ဝယ်ရင်းကုန်ဖိုးနှင့် ကုန်ကျစရိတ်သတ်မှတ်ပုံ မအတည်ပြုရသေးပါ။ အောက်ပါအမြတ်သည် နမူနာတွက်ချက်မှုသာ ဖြစ်သည်။','amber')}</div>
 <div class="grid cols-4 mb">${stat('ကာလအတွင်း အရောင်း',M(revenue),'ကျပ်','sale',`${sales.length} စောင်`,'compact')}${stat('ရောင်းကုန်ဝယ်ရင်း',M(cost),'ကျပ်','stock',ownerRangeText(),'compact')}${stat('လုပ်ငန်းအသုံးစရိတ်',M(expenseTotal),'ကျပ်','transfer',`${expenses.length} ခု`,'compact')}${stat('ယာယီ အမြတ် / အရှုံး',M(profit),'ကျပ်','chart',ownerRangeText(),'compact')}</div>
 <div class="main-grid"><section class="card"><h3>တွက်ချက်ပုံ</h3><div class="summary-line mt"><span>ကုန်ရောင်းတန်ဖိုး</span><strong>${cashText(revenue)}</strong></div><div class="summary-line"><span>နုတ် — ရောင်းကုန်ဝယ်ရင်း</span><strong>${cashText(cost)}</strong></div><div class="summary-line"><span>အကြမ်းအမြတ်</span><strong>${cashText(revenue-cost)}</strong></div><div class="summary-line"><span>နုတ် — လုပ်ငန်းအသုံးစရိတ်</span><strong>${cashText(expenseTotal)}</strong></div><div class="summary-line total"><span>ယာယီ အမြတ် / အရှုံး</span><strong>${cashText(profit)}</strong></div></section>
 <section class="card"><h3>ဤတွက်ချက်မှုထဲ မပေါင်းထားပါ</h3><p class="small muted mt">ကြိုရှင်းငွေ၊ အကြွေးပြန်ရှင်းငွေနှင့် အိမ် / ပွဲရုံ ငွေရွှေ့ခြင်းတို့ကို အရောင်းအသစ် သို့မဟုတ် ကုန်ကျစရိတ်အသစ်အဖြစ် မထည့်ထားပါ။</p><div class="mt">${note('လုပ်သားခနုတ်ငွေကို ဝင်ငွေအဖြစ် အလိုအလျောက် မယူထားပါ။')}</div></section></div>
 <section class="card mt"><h3>ကာလအတွင်း အရောင်းစာရင်း</h3>${sales.length?`<div class="table-wrap mt"><table><thead><tr><th>ရက်စွဲ</th><th>ဝယ်သူ / ကုန်</th><th class="right">ရောင်းတန်ဖိုး</th><th class="right">ဝယ်ရင်း</th><th class="right">ခြားနားငွေ</th></tr></thead><tbody>${sales.map(s=>`<tr><td>${shortDate(s.date)}</td><td><strong>${E(s.name)}</strong><div class="sub">${E(s.product)} · ${vissText37(s.qty)} ပိဿာ</div></td><td class="right">${cashText(s.total)}</td><td class="right">${cashText(s.cost)}</td><td class="right">${cashText(s.total-s.cost)}</td></tr>`).join('')}</tbody></table></div>`:empty('ရွေးထားသောကာလအတွင်း အရောင်းမရှိပါ။','chart')}</section>
 <section class="card mt"><h3>ကာလအတွင်း အသုံးစရိတ်စာရင်း</h3>${expenses.length?`<div class="table-wrap mt"><table><thead><tr><th>ရက်စွဲ</th><th>အသုံးစရိတ် အကြောင်းအရာ</th><th>ငွေသိမ်းရာ</th><th class="right">ငွေပမာဏ</th></tr></thead><tbody>${expenses.map(x=>`<tr><td>${shortDate(x.date)}</td><td><strong>${E(x.reason)}</strong></td><td>${E(ACCOUNT_NAMES[x.account]||x.account)}</td><td class="right">${cashText(x.amount)}</td></tr>`).join('')}</tbody></table></div>`:empty('ရွေးထားသောကာလအတွင်း အသုံးစရိတ်မရှိပါ။','doc')}</section>`;
};

/* V3.7 — quality is a purchase-price tier, product stock is aggregated, and
   physical packaging is tracked separately from the product's standard bag. */
const v36InitPageRevision=initPageRevision;
initPageRevision=function(){
 v36InitPageRevision();
 state.packagingTransactions??=[];state.adjustments??=[];
 state.masters.purchaseDeductions??={workRate:0,laborRate:0};
 state.masters.purchaseDeductions.borderRate=0;
 for(const p of state.masters.products){
  if(!(Number(p.standardViss)>0)){
   const sample=state.lots.find(l=>l.product===p.name&&Number(l.bags)>0&&Number(l.qty)>0);
   if(sample)p.standardViss=sample.qty/sample.bags;
  }
 }
 for(const r of state.receipts){
  r.payments??=[];r.priceBasis??=(r.status==='purchased'?'legacy_viss':'standard_bag');
  if((r.paid||0)>0&&!r.payments.length)r.payments.push({id:'LEGACY-PAY-'+r.id,date:r.purchaseDate||r.date,amount:r.paid,account:'cash',legacy:true});
 }
 for(const s of state.sales){
  s.payments??=[];s.priceBasis??='legacy_viss';
  if((s.paid||0)>0&&!s.payments.length)s.payments.push({id:'LEGACY-PAY-'+s.id,date:s.date,amount:s.paid,account:'cash',legacy:true});
 }
 for(const l of state.lots){
  if(!l.stockForm){
   l.stockForm=l.owner==='supplier'?'loose':'packaged';
   if(l.stockForm==='packaged'){
    const count=Number(l.actualBags??l.bags)||0;
    l.packageCount=count;l.packageViss=count?l.qty/count:(productBy(l.product)?.standardViss||0);
   }
  }
 }
 state.stockModelVersion='3.7';
};
function isoDateValue(id,fallback=today()){const v=value(id);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:fallback;}
function productStandard(name){return Number(productBy(name)?.standardViss)||0;}
function standardComposition(product,qty){
 const standard=productStandard(product),q=Number(qty)||0;if(!standard)return `${vissText37(q)} ပိဿာ`;
 const c=bagCalc(q,standard),bags=bagDisplay(c);return `${bags} · စုစုပေါင်း ${vissText37(q)} ပိဿာ`;
}
function bagComposition(product,qty){const standard=productStandard(product),q=Number(qty)||0;return standard?bagDisplay(bagCalc(q,standard)):'—';}
function dateTxn(account,amount,title,ref='',party='',date=today()){
 if(amount)state.transactions.push({id:uid('T'),date,account,amount,title,ref,party,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});
}
function dateMove(product,qty,direction,ref,date=today(),kind='stock'){
 state.moves.push({product,grade:'စုစုပေါင်း',qty,bags:0,direction,ref,date,kind});
}
function productStockRows(owner='owned'){
 const map=new Map();
 state.lots.filter(l=>l.owner===owner&&l.qty>0.0001).forEach(l=>{
  const x=map.get(l.product)||{product:l.product,loose:0,packaged:0,total:0,packageCount:0,cost:0};
  x.total+=l.qty;x.cost+=l.qty*(Number(l.cost)||0);
  if(l.stockForm==='packaged'){x.packaged+=l.qty;x.packageCount+=Number(l.packageCount??l.bags)||0;}else x.loose+=l.qty;
  map.set(l.product,x);
 });
 return [...map.values()].sort((a,b)=>a.product.localeCompare(b.product));
}
function looseQty(product){return state.lots.filter(l=>l.owner==='owned'&&l.product===product&&l.stockForm!=='packaged').reduce((n,l)=>n+l.qty,0);}
function packagedOptions(product){
 const m=new Map();state.lots.filter(l=>l.owner==='owned'&&l.product===product&&l.stockForm==='packaged'&&l.qty>0.0001).forEach(l=>{
  const size=Number(l.packageViss)||((Number(l.packageCount)||0)?l.qty/l.packageCount:0);if(size>0)m.set(size,(m.get(size)||0)+(Number(l.packageCount)||0));
 });return [...m].sort((a,b)=>a[0]-b[0]);
}
function consumeLoose(product,qty){
 let need=qty,cost=0,taken=0;
 for(const l of state.lots.filter(l=>l.owner==='owned'&&l.product===product&&l.stockForm!=='packaged'&&l.qty>0)){
  const use=Math.min(need,l.qty);l.qty-=use;cost+=use*(Number(l.cost)||0);taken+=use;need-=use;if(need<.000001)break;
 }
 return {ok:need<.000001,qty:taken,cost};
}
function consumePackages(product,size,count){
 let need=count,cost=0,qty=0;
 for(const l of state.lots.filter(l=>l.owner==='owned'&&l.product===product&&l.stockForm==='packaged'&&Math.abs((Number(l.packageViss)||0)-size)<.000001&&l.qty>0)){
  const available=Number(l.packageCount)||0,use=Math.min(need,available);if(!use)continue;
  const useQty=use*size;l.packageCount=available-use;l.qty=Math.max(0,l.qty-useQty);l.bags=l.packageCount;cost+=useQty*(Number(l.cost)||0);qty+=useQty;need-=use;if(need<.000001)break;
 }
 return {ok:need<.000001,qty,cost};
}
function addLooseLot(product,qty,costPerViss,ref){
 if(qty<=.000001)return;state.lots.push({id:uid('L'),product,productId:productBy(product)?.id,grade:'စုစုပေါင်း',qty,bags:0,owner:'owned',name:'ပွဲရုံပိုင်',cost:costPerViss||0,stockForm:'loose',ref});
}
function paymentHistory(payments=[],outgoing=false){
 return payments.length?`<div class="table-wrap mt"><table><thead><tr><th>ငွေရှင်းရက်</th><th>ငွေသိမ်းရာ</th><th class="right">ပမာဏ</th></tr></thead><tbody>${payments.slice().reverse().map(p=>`<tr><td>${shortDate(p.date)}</td><td>${E(ACCOUNT_NAMES[p.account]||p.account)}</td><td class="right">${outgoing?'− ':''}${cashText(p.amount)}</td></tr>`).join('')}</tbody></table></div>`:`<p class="field-help mt">ငွေရှင်း Transaction မရှိသေးပါ။</p>`;
}

/* Receiving date and vocabulary. */
const v36EmptyReceiptForm=emptyReceiptForm;
emptyReceiptForm=function(){return {...v36EmptyReceiptForm(),date:today()};};
const v36CaptureReceiving=captureReceiving;
captureReceiving=function(){v36CaptureReceiving();if(receiptWizard)receiptWizard.date=isoDateValue('newReceiptDate',receiptWizard.date||today());};
captureCargo=captureReceiving;
const v36ReceiptCargo=receiptCargo;
receiptCargo=function(){
 v36ReceiptCargo();
 const form=document.getElementById('newReceiptForm');if(!form)return;
 form.insertAdjacentHTML('afterbegin',`<div class="field-row v37-date-row">${field('အဝယ် / ကုန်လက်ခံရက်','newReceiptDate',{type:'date',value:receiptWizard.date||today(),required:true,extra:'onchange="receiptWizard.date=this.value"'})}<div class="v3-standard-note">${I('info')}ရွေးထားသောရက်ဖြင့် ကုန်ဝင်မှတ်တမ်း သိမ်းမည်။</div></div>`);
 document.querySelectorAll('#main label').forEach(l=>{if(l.textContent.trim().startsWith('အရည်အသွေး'))l.childNodes[0].textContent='အဝယ်ဈေးတန်း (အရည်အသွေး)';});
 document.querySelectorAll('#main .v3-auto-top span:first-child').forEach(x=>x.innerHTML=I('check')+'အလိုအလျောက် တွက်ထားသော အိတ်');
 document.querySelectorAll('#main .v3-auto-number span').forEach(x=>x.textContent='အိတ်');
 const actual=document.getElementById('newActualBags')?.closest('.field');if(actual)actual.remove();
};
const v36SaveReceiveAndNew=saveReceiveAndNew;
saveReceiveAndNew=function(finalized=false){
 const chosen=isoDateValue('newReceiptDate',receiptWizard?.date||today());const before=state.receipts.length;
 v36SaveReceiveAndNew(finalized);
 if(state.receipts.length>before&&lastReceiptSaved){
  const r=state.receipts.find(x=>x.id===lastReceiptSaved),lot=state.lots.find(l=>l.receiptId===lastReceiptSaved);
  if(r){r.date=chosen;r.priceBasis='standard_bag';}
  if(lot){lot.stockForm='loose';lot.packageCount=0;lot.packageViss=0;}
  const mv=state.moves.findLast?.(m=>m.ref===r?.no);if(mv)mv.date=chosen;
  if(r?.issuedAdvanceId){const a=state.partnerAdvances.find(x=>x.id===r.issuedAdvanceId);if(a)a.date=chosen;}
  save();
 }
};
recordBagInfo=function(r){return standardComposition(r.product,r.qty);};
rSummary=function(r){return `<div class="summary-box mb"><div class="row between wrap"><div><strong>${E(r.name)}</strong><div class="small muted">${shortDate(r.purchaseDate||r.date)} · ${E(r.car)||'ကားနံပါတ် မရှိ'}</div></div><div class="right"><strong>${E(r.product)}</strong><div class="small muted">ဝယ်ဈေးတန်း ${E(r.grade)} · ${standardComposition(r.product,r.qty)}</div></div></div></div>`;};

/* Standard-bag purchase pricing; border fee removed. */
gross=function(r){const p=Number(r.price)||0;return Math.round(r.priceBasis==='standard_bag'?(r.qty/(productStandard(r.product)||1))*p:r.qty*p);};
purchaseNet=function(r){return gross(r)-(r.wage||0)-(r.weigh||0)-(r.advance||0);};
pricingBagCount=function(r){return productStandard(r.product)?r.qty/productStandard(r.product):(Number(r.bags)||0);};
pricingCalc=function(id){
 const r=state.receipts.find(x=>x.id===id);if(!r)return null;const price=number('receiptPrice')||0,bags=pricingBagCount(r),rates=state.masters.purchaseDeductions||{};
 const workRate=Number(rates.workRate)||0,laborRate=Number(rates.laborRate)||0,gross=Math.round(bags*price),work=Math.round(bags*workRate),labor=Math.round(bags*laborRate),beforeAdvance=Math.max(0,gross-work-labor),pool=supplierBalance(r.partnerId),advance=Math.min(pool,beforeAdvance);
 return {r,price,bags,workRate,laborRate,gross,work,labor,pool,advance,net:beforeAdvance-advance};
};
openPricing=function(id){
 if(!guardWork())return;const r=state.receipts.find(x=>x.id===id);if(!r)return;const key=r.product+'|'+r.grade,market=state.priceDate===today()?state.prices[key]||'':'';
 openModal('ဈေးဖြတ်မယ်',market?'ယနေ့ တစ်အိတ်ပေါက်ဈေးကို Auto ဖြည့်ထားပါတယ်။ Admin မှ ပြင်နိုင်ပါတယ်။':'ယနေ့ပေါက်ဈေး မရှိသေးပါ။ ကိုယ်တိုင်ထည့်ပါ။',`${rSummary(r)}
 <form id="pricingForm" onsubmit="event.preventDefault();commitPriceVoucher('${id}')"><div class="field-row">${field('အဝယ်ရက်','purchaseDate',{type:'date',value:r.purchaseDate||r.date||today(),required:true})}${field('တစ်အိတ် ဝယ်ဈေး','receiptPrice',{type:'number',min:1,value:market||r.price||'',required:true,suffix:'ကျပ်',extra:`oninput="updatePricingSheet('${id}')"`})}</div>
 <p class="field-help">၁ အိတ် = ${vissText37(productStandard(r.product))} ပိဿာ · ဝယ်ဈေးတန်း ${E(r.grade)}</p><div id="pricingSheet" class="summary-box pricing-sheet"></div></form>${supplierAdvanceSummary(r.partnerId)}`,
 btn('အပ်ထားမယ်',`saveDeposit('${id}')`,'secondary','stock')+btn('ဈေးဖြတ်ပြီး Print ထုတ်မယ်',`commitPriceVoucher('${id}')`,'primary','print','id="pricePrintBtn"'),true);updatePricingSheet(id);
};
updatePricingSheet=function(id){const c=pricingCalc(id),box=document.getElementById('pricingSheet');if(!c||!box)return;box.innerHTML=!(c.price>0)?note('တစ်အိတ် ဝယ်ဈေး ထည့်ပါ။','amber'):`<div class="summary-line"><span>ကုန်ဖိုး (${N(c.bags)} အိတ် × ${M(c.price)})</span><strong>${cashText(c.gross)}</strong></div><div class="summary-line"><span>ဝန်ဆောင်ခ</span><strong>− ${cashText(c.work)}</strong></div><div class="summary-line"><span>လုပ်သားခ</span><strong>− ${cashText(c.labor)}</strong></div><div class="summary-line"><span>ကြိုတင်ယူငွေ</span><strong>− ${cashText(c.advance)}</strong></div><div class="summary-line total"><span>အသားတင် ရငွေ</span><strong>${cashText(c.net)}</strong></div>`;};
commitPriceVoucher=function(id){
 if(!guardWork()||!validForm('pricingForm'))return;const c=pricingCalc(id);if(!c||!(c.price>0))return error('တစ်အိတ် ဝယ်ဈေး ထည့်ပါ။');const r=c.r;if(r.status==='purchased')return printPriceVoucher(id);
 const lot=state.lots.find(l=>l.receiptId===id&&l.owner==='supplier');if(!lot)return error('ဆက်စပ်အပ်ကုန် မတွေ့ပါ။');const date=isoDateValue('purchaseDate',r.date);
 r.advanceAllocations=allocateSupplierAdvance(r.partnerId,r.id,c.advance);Object.assign(r,{price:c.price,priceBasis:'standard_bag',priceDate:date,wage:c.work,weigh:c.labor,borderFee:0,workRate:c.workRate,laborRate:c.laborRate,borderRate:0,advance:c.advance,paid:0,payments:[],status:'purchased',purchaseDate:date,purchaseNo:'အဝ-'+String(++state.counter).padStart(3,'0')});
 lot.owner='owned';lot.name='ပွဲရုံပိုင်';lot.cost=c.gross/r.qty;lot.grade='စုစုပေါင်း';lot.stockForm='loose';lot.packageCount=0;lot.packageViss=0;
 state.activity.unshift({id:uid('A'),text:r.name+' ၏ '+r.product+' ကို '+cashText(c.net)+' ဖြင့် ဝယ်ယူခဲ့သည်။',date,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});save();workDirty=false;printPriceVoucher(id);setTimeout(()=>{closeModal();page='receipts';revisionBase.render();toast('အဝယ်ဘောက်ချာ သိမ်းပြီး မထုပ်ပိုးရသေး Stock ထဲဝင်ပါပြီ။');},250);
};
printPriceVoucher=function(id){const r=state.receipts.find(x=>x.id===id);if(!r)return;document.getElementById('printArea').innerHTML=`<div class="print-title"><h1>အဝယ်ဘောက်ချာ</h1><p>${E(r.purchaseNo||r.no)} · ${shortDate(r.purchaseDate||r.date)}</p></div><p>ကုန်သည် — <strong>${E(r.name)}</strong></p><p>ကုန် — <strong>${E(r.product)} · ဝယ်ဈေးတန်း ${E(r.grade)}</strong></p><table style="margin-top:18px"><thead><tr><th>အလေးချိန်</th><th>အိတ်ဖွဲ့စည်းပုံ</th><th>တစ်အိတ်ဈေး</th><th>ကုန်ဖိုး</th></tr></thead><tbody><tr><td>${vissText37(r.qty)} ပိဿာ</td><td>${E(standardComposition(r.product,r.qty))}</td><td>${cashText(r.price)}</td><td>${cashText(gross(r))}</td></tr></tbody></table><p>ဝန်ဆောင်ခ — − ${cashText(r.wage||0)}</p><p>လုပ်သားခ — − ${cashText(r.weigh||0)}</p><p>ကြိုတင်ယူငွေ — − ${cashText(r.advance||0)}</p><h2>အသားတင် — ${cashText(purchaseNet(r))}</h2>`;window.print();};

/* Current market prices are purchase prices per standard bag. */
pricesPage=function(){
 const ps=products(true);return heading('','ယနေ့ပေါက်ဈေး','အရည်အသွေးသည် Stock Variation မဟုတ်ပါ။ ဝယ်ယူရာတွင်သုံးမည့် တစ်အိတ်ဈေးတန်းသာ ဖြစ်သည်။',pill(state.priceDate===today()?'ယနေ့ဈေး ထည့်ထားသည်':'မထည့်ရသေး',state.priceDate===today()?'':'amber'))+
 `<form id="priceForm" onsubmit="savePrices(event)"><div class="grid cols-3">${ps.map((p,i)=>`<section class="card market-card"><div class="row"><div class="icon-box">${I('grain')}</div><div><h2>${E(p.name)}</h2><div class="small muted">၁ အိတ် = ${vissText37(p.standardViss)} ပိဿာ</div></div></div>${p.grades.map(g=>`<div class="market-row"><label for="price_${i}_${E(g)}">ဝယ်ဈေးတန်း ${E(g)}</label><input id="price_${i}_${E(g)}" type="number" min="1" placeholder="တစ်အိတ်ဈေး" value="${state.prices[p.name+'|'+g]||''}"></div>`).join('')}</section>`).join('')}</div><div class="row between wrap mt">${note('ဤဈေးသည် အဝယ် > ဈေးဖြတ်မယ်တွင် Auto ပေါ်မည်။ အရောင်းဈေးကို မသက်ရောက်ပါ။','blue')}<button class="btn btn-primary" type="submit">${I('check')}ပေါက်ဈေး သိမ်းမယ်</button></div></form>`;
};
savePrices=function(event){event.preventDefault();if(!guardWork())return;const values={};let count=0;products(true).forEach((p,i)=>p.grades.forEach(g=>{const el=document.getElementById(`price_${i}_${g}`);if(el?.value.trim()){values[p.name+'|'+g]=Number(el.value);count++;}}));if(!count)return toast('အနည်းဆုံး ဈေးတစ်ခု ထည့်ပါ။',true);state.prices=values;state.priceDate=today();activity('တစ်အိတ် အဝယ်ပေါက်ဈေး '+count+' မျိုး သိမ်းခဲ့သည်။');save();render();toast('ယနေ့ အဝယ်ပေါက်ဈေး သိမ်းပြီးပါပြီ။');};

/* Inventory packaging and adjustments. */
inventoryPage=function(){
 const rows=productStockRows(),loose=rows.reduce((n,x)=>n+x.loose,0),packaged=rows.reduce((n,x)=>n+x.packaged,0);return heading('','ကုန်လက်ကျန်','Grade မခွဲဘဲ ကုန်ပစ္စည်းအလိုက် စုစုပေါင်းပြထားသည်။',state.role==='staff'?`<div class="row wrap">${btn('ကုန်ချိန်ညှိ','openAdjustment()','secondary','scale')}${btn('ထုပ်ပိုးမည်','openPackaging()','primary','stock')}</div>`:'')+
 (state.role==='owner'?ownerDateFilterBar('ကုန်လယ်ဂျာကို Date Range အလိုက် စစ်ထုတ်ပါမည်။ လက်ကျန်သည် လက်ရှိအခြေအနေဖြစ်သည်။'):'')+`<div class="grid cols-3 mb">${stat('မထုပ်ပိုးရသေးသောကုန်',vissText37(loose),'ပိဿာ','grain','ပုံထားသောကုန်','compact')}${stat('ထုပ်ပိုးပြီးသားကုန်',vissText37(packaged),'ပိဿာ','stock','ထုပ်ပိုးအိတ်အတွင်း','compact')}${stat('စုစုပေါင်းကုန်',N(loose+packaged),'ပိဿာ','check','၁ + ၂','compact')}</div><div class="toolbar"><div class="tabs">${[['overview','Stock အကျဉ်းချုပ်'],['packages','ထုပ်ပိုးမှတ်တမ်း'],['adjustments','ကုန်ချိန်ညှိမှတ်တမ်း'],['ledger','ကုန်လယ်ဂျာ']].map(([k,t])=>`<button class="tab ${invTab===k?'active':''}" onclick="invTab='${k}';render()">${t}</button>`).join('')}</div>${pill('Stock ကို Grade မခွဲပါ','gray')}</div><div id="inventoryBody"></div>`;
};
renderInventoryBody=function(){
 const root=document.getElementById('inventoryBody');if(!root)return;const rows=productStockRows();
 if(invTab==='overview')root.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>ကုန်ပစ္စည်း</th><th class="right">ထုပ်ပိုးအိတ်</th><th class="right">အိတ်</th><th class="right">စုစုပေါင်းပိဿာ</th></tr></thead><tbody>${rows.map(x=>{const packages=packagedOptions(x.product);return `<tr><td><strong>${E(x.product)}</strong></td><td class="right">${packages.length?packages.map(([size,count])=>`<div><strong>${vissText37(size)}</strong> ပိဿာဝင် <strong>${N(count)}</strong> အိတ်</div>`).join(''):'—'}</td><td class="right">${E(bagComposition(x.product,x.total))}</td><td class="right"><strong>${vissText37(x.total)} ပိဿာ</strong></td></tr>`;}).join('')}</tbody></table></div>`:empty('ပွဲရုံပိုင်ကုန် မရှိသေးပါ။','stock');
 else if(invTab==='packages')root.innerHTML=state.packagingTransactions.length?`<div class="table-wrap"><table><thead><tr><th>ရက်စွဲ</th><th>ကုန်</th><th class="right">ပိဿာ</th><th class="right">ထုပ်ပိုးအိတ်</th><th>တစ်အိတ်ဝင်</th></tr></thead><tbody>${state.packagingTransactions.slice().reverse().map(x=>`<tr><td>${shortDate(x.date)}</td><td><strong>${E(x.product)}</strong><div class="sub">${E(x.type==='repack'?'အိတ်ပြန်ပြင်':'ထုပ်ပိုး')}</div></td><td class="right">${vissText37(receiptReceivedQuantity2(x))}</td><td class="right">${N(x.bagCount)}</td><td>${vissText37(x.packageViss)} ပိဿာ</td></tr>`).join('')}</tbody></table></div>`:empty('ထုပ်ပိုးမှတ်တမ်း မရှိသေးပါ။','stock');
 else if(invTab==='adjustments')root.innerHTML=state.adjustments.length?`<div class="table-wrap"><table><thead><tr><th>ရက်စွဲ</th><th>ကုန်</th><th>တိုး / လျှော့</th><th class="right">ပမာဏ</th><th>အကြောင်းပြချက်</th></tr></thead><tbody>${state.adjustments.slice().reverse().map(x=>`<tr><td>${shortDate(x.date)}</td><td>${E(x.product)}</td><td>${x.direction==='increase'?pill('တိုး','blue'):pill('လျှော့','amber')}</td><td class="right">${vissText37(receiptReceivedQuantity2(x))} ပိဿာ</td><td>${E(x.reason)}</td></tr>`).join('')}</tbody></table></div>`:empty('ကုန်ချိန်ညှိမှတ်တမ်း မရှိသေးပါ။','scale');
 else{const moves=state.moves.filter(m=>state.role!=='owner'||inOwnerDateRange(m.date));root.innerHTML=moves.length?`<div class="table-wrap"><table><thead><tr><th>ရက်စွဲ</th><th>ကုန်</th><th>အကြောင်း</th><th class="right">အဝင်</th><th class="right">အထွက်</th></tr></thead><tbody>${moves.slice().reverse().map(m=>`<tr><td>${shortDate(m.date)}</td><td>${E(m.product)}</td><td>${E(m.ref||m.kind||'')}</td><td class="right green">${m.direction==='in'?N(m.qty):'—'}</td><td class="right">${m.direction==='out'?N(m.qty):'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('ကုန်လှုပ်ရှားမှု မရှိသေးပါ။','doc');}
};
let packRowSeq=0;
function packagingRowHtml(index,removable=false){return `<section class="card packaging-row" data-pack-row="${index}" style="padding:18px;margin-bottom:12px"><div class="row between"><strong>ထုပ်ပိုးအိတ် အမျိုးအစား</strong>${removable?`<button class="btn btn-secondary btn-small" type="button" onclick="removePackagingRow(${index})">ဖယ်ရှားမယ်</button>`:''}</div><div class="field-row mt">${field('တစ်ထုပ်ပိုးအိတ်ဝင်','packSize_'+index,{type:'number',min:.001,step:.001,suffix:'ပိဿာ',placeholder:'ဥပမာ 30',extra:`inputmode="decimal" oninput="updatePackagingRows(${index},true)"`})}${field('ထုပ်ပိုးအိတ်အရေအတွက်','packCount_'+index,{type:'number',min:1,step:1,suffix:'အိတ်',placeholder:'Auto တွက်မည်',extra:`inputmode="numeric" oninput="updatePackagingRows()"`})}</div><div id="packRowSummary_${index}" class="small muted"></div></section>`;}
function packagingRowsData(){return [...document.querySelectorAll('.packaging-row')].map(row=>{const index=Number(row.dataset.packRow);return {index,size:number('packSize_'+index),count:number('packCount_'+index)};});}
function updatePackagingRows(changedIndex=null,autoCount=false){
 const product=value('packProduct'),available=looseQty(product);if(autoCount&&changedIndex!==null){const size=number('packSize_'+changedIndex),otherUsed=packagingRowsData().filter(x=>x.index!==changedIndex).reduce((n,x)=>n+x.size*x.count,0),countInput=document.getElementById('packCount_'+changedIndex);if(countInput)countInput.value=size>0?Math.max(0,Math.floor((available-otherUsed+.000001)/size)):'';}
 const rows=packagingRowsData();let used=0;rows.forEach(x=>{const qty=x.size*x.count;used+=qty;const summary=document.getElementById('packRowSummary_'+x.index);if(summary)summary.textContent=x.size>0&&x.count>0?`${vissText37(x.size)} ပိဿာဝင် × ${N(x.count)} ထုပ်ပိုးအိတ် = ${vissText37(qty)} ပိဿာ`:'';});const remaining=available-used,box=document.getElementById('packagingSummary');if(box)box.innerHTML=`<div class="summary-line"><span>လက်ရှိ မထုပ်ပိုးရသေးသောကုန်</span><strong>${vissText37(available)} ပိဿာ</strong></div><div class="summary-line"><span>ထုပ်ပိုးမည့် စုစုပေါင်း</span><strong>${vissText37(used)} ပိဿာ</strong></div><div class="summary-line total"><span>${remaining<-.000001?'ပိုနေသောပမာဏ':'ထုပ်ပိုးပြီး ကျန်မည့်ပမာဏ'}</span><strong>${vissText37(Math.abs(remaining))} ပိဿာ</strong></div>`;if(box)box.classList.toggle('error-box',remaining<-.000001);
}
function resetPackagingRows(){packRowSeq=1;const root=document.getElementById('packagingRows');if(root)root.innerHTML=packagingRowHtml(0);updatePackagingRows();}
function addPackagingRow(){const root=document.getElementById('packagingRows');if(!root)return;const index=packRowSeq++;root.insertAdjacentHTML('beforeend',packagingRowHtml(index,true));updatePackagingRows();document.getElementById('packSize_'+index)?.focus();}
function removePackagingRow(index){document.querySelector(`.packaging-row[data-pack-row="${index}"]`)?.remove();updatePackagingRows();}
function openPackaging(){
 if(!guardWork())return;const opts=productStockRows().filter(x=>x.loose>0).map(x=>[x.product,`${x.product} · ${standardComposition(x.product,x.loose)}`]);if(!opts.length)return toast('ထုပ်ပိုးရန် မထုပ်ပိုးရသေးသောကုန် မရှိပါ။',true);
 openModal('ထုပ်ပိုးမည်','တစ်ထုပ်ပိုးအိတ်ဝင် ပိဿာထည့်လျှင် လက်ရှိကုန်ပမာဏအပေါ်မူတည်ပြီး အိတ်အရေအတွက် Auto တွက်မည်။',`<form id="packForm" onsubmit="event.preventDefault();savePackaging()">${selectField('ထုပ်ပိုးလိုသောကုန်','packProduct',opts,opts[0][0],'onchange="resetPackagingRows()"')}<div id="packagingRows"></div><button class="btn btn-secondary" type="button" onclick="addPackagingRow()">${I('plus')}ထုပ်ပိုးအိတ် ထပ်ထည့်မယ်</button><div id="packagingSummary" class="summary-box mt" aria-live="polite"></div>${field('ထုပ်ပိုးရက်','packDate',{type:'date',value:today(),required:true})}</form>${note('အိတ်အရေအတွက်ကို Auto တွက်ပေးသော်လည်း လိုအပ်ပါက ကိုယ်တိုင်ပြင်နိုင်သည်။ ကျန်ပိဿာကို နောက်ထပ် ထုပ်ပိုးအိတ်အမျိုးအစားအဖြစ် ထည့်နိုင်သည်။','blue')}`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('ထုပ်ပိုးပြီး သိမ်းမယ်','savePackaging()','primary','check'),true);resetPackagingRows();
}
function savePackaging(){
 if(!validForm('packForm'))return;const product=value('packProduct'),date=isoDateValue('packDate'),rows=packagingRowsData().filter(x=>x.size>0||x.count>0);if(!rows.length)return error('တစ်ထုပ်ပိုးအိတ်ဝင် ပိဿာ ထည့်ပါ။');if(rows.some(x=>!(x.size>0)||!Number.isInteger(x.count)||x.count<=0))return error('အိတ်ဝင်ပိဿာနှင့် အိတ်အရေအတွက်ကို မှန်ကန်စွာ ထည့်ပါ။');const qty=rows.reduce((n,x)=>n+x.size*x.count,0),available=looseQty(product);if(qty>available+.000001)return error('ထုပ်ပိုးမည့် စုစုပေါင်းပိဿာသည် လက်ရှိကုန်ထက် မပိုရပါ။');const used=consumeLoose(product,qty);if(!used.ok)return error('မထုပ်ပိုးရသေး Stock မလောက်ပါ။');const cost=used.cost/qty;rows.forEach(x=>{const rowQty=x.size*x.count;state.lots.push({id:uid('L'),product,productId:productBy(product)?.id,grade:'စုစုပေါင်း',qty:rowQty,bags:x.count,packageCount:x.count,packageViss:x.size,owner:'owned',name:'ပွဲရုံပိုင်',cost,stockForm:'packaged'});state.packagingTransactions.push({id:uid('PK'),date,product,qty:rowQty,bagCount:x.count,packageViss:x.size,type:'pack'});});save();closeModal();render();toast(`${N(rows.reduce((n,x)=>n+x.count,0))} ထုပ်ပိုးအိတ်အဖြစ် ပြောင်းထားပါပြီ။`);
}
function openAdjustment(){
 if(!guardWork())return;const opts=products(true).map(p=>[p.name,p.name]);openModal('ကုန်ချိန်ညှိ','Stock တိုး/လျှော့ကို အကြောင်းပြချက်နှင့် မှတ်တမ်းတင်မည်။',`<form id="adjustForm" onsubmit="event.preventDefault();saveAdjustment()">${selectField('ကုန်ပစ္စည်း','adjustProduct',opts,opts[0]?.[0])}${selectField('တိုး / လျှော့','adjustDirection',[['increase','တိုးမည်'],['decrease','လျှော့မည်']],'increase')}<div class="field-row">${field('ပမာဏ','adjustQty',{type:'number',min:.001,step:.001,required:true,suffix:'ပိဿာ'})}${field('ရက်စွဲ','adjustDate',{type:'date',value:today(),required:true})}</div>${field('အကြောင်းပြချက်','adjustReason',{required:true,placeholder:'ဥပမာ — မြေပြင်ချိန်စစ်ချက်',extra:'maxlength="180"'})}</form>`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('ချိန်ညှိပြီး သိမ်းမယ်','saveAdjustment()','primary','check'));
}
function saveAdjustment(){
 if(!validForm('adjustForm'))return;const product=value('adjustProduct'),direction=value('adjustDirection'),qty=number('adjustQty'),reason=value('adjustReason'),date=isoDateValue('adjustDate');if(!(qty>0)||!reason)return error('ပမာဏနှင့် အကြောင်းပြချက် ထည့်ပါ။');
 if(direction==='increase')addLooseLot(product,qty,0,'Adjustment');
 else{
  const available=productStockRows().find(x=>x.product===product)?.total||0;if(qty>available+.000001)return error('လက်ကျန်ထက် ပိုလျှော့၍ မရပါ။');
  let remaining=qty,used=consumeLoose(product,Math.min(remaining,looseQty(product)));remaining-=used.qty;
  if(remaining>.000001){for(const [size,count] of packagedOptions(product)){const needBefore=remaining,bags=Math.min(count,Math.ceil(needBefore/size)),take=consumePackages(product,size,bags);remaining-=Math.min(needBefore,take.qty);const excess=Math.max(0,take.qty-needBefore);if(excess)addLooseLot(product,excess,take.cost/take.qty,'Adjustment excess');if(remaining<=.000001)break;}}
 }
 state.adjustments.push({id:uid('ADJ'),date,product,direction,qty,reason});dateMove(product,qty,direction==='increase'?'in':'out','Adjustment — '+reason,date,'adjustment');invTab='adjustments';page='inventory';save();closeModal();render();toast('ကုန်ချိန်ညှိမှတ်တမ်း သိမ်းပြီးပါပြီ။');
}

/* Sale uses packaged stock and a manually entered price per standard bag. */
function saleProductOptions(){return productStockRows().filter(x=>x.total>0).map(x=>[x.product,x.product]);}
function refreshSalePackageOptions(){
 const product=value('saleProduct'),stockInfo=document.getElementById('saleProductStockInfo'),desired=document.getElementById('saleDesiredSize');
 if(!product){if(desired)desired.value='';if(stockInfo){stockInfo.hidden=true;stockInfo.innerHTML='';}updateSalePreview();return;}
 const row=productStockRows().find(x=>x.product===product),packages=packagedOptions(product),packageText=packages.map(([s,c])=>`${vissText37(s)} ပိဿာဝင် ${N(c)} အိတ်`).join(' · '),loose=looseQty(product);if(stockInfo&&row){const details=[packageText,loose>0?`မထုပ်ပိုးရသေး ${vissText37(loose)} ပိဿာ`:''].filter(Boolean).join(' · ');stockInfo.hidden=false;stockInfo.innerHTML=`<strong>${E(product)}</strong> လက်ကျန် — ${E(standardComposition(product,row.total))}${details?` · ${E(details)}`:''}`;}const p=productBy(product);if(desired)desired.value=p?.standardViss||'';updateSalePreview();
}
function chooseSaleSource(product,desired,count){const qty=(Number(desired)||0)*(Number(count)||0),packs=packagedOptions(product);if(qty>0){const candidates=packs.filter(([s,c])=>Math.ceil(qty/s)<=c).sort((a,b)=>{const exactA=Math.abs(a[0]-desired)<.000001?0:1,exactB=Math.abs(b[0]-desired)<.000001?0:1;if(exactA!==exactB)return exactA-exactB;return Math.ceil(qty/a[0])*a[0]-qty-(Math.ceil(qty/b[0])*b[0]-qty);});if(candidates.length)return String(candidates[0][0]);if(looseQty(product)>=qty)return 'loose';}return packs.length?String(packs[0][0]):looseQty(product)>0?'loose':'';}
function updateSalePreview(){const product=value('saleProduct'),size=number('saleDesiredSize'),count=number('salePackageCount'),price=number('saleBagPrice'),box=document.getElementById('salePreview');if(!box)return;const qty=(size>0&&count>0)?size*count:0,standard=productStandard(product),total=standard?Math.round(qty/standard*(price||0)):0;box.innerHTML=qty?`<div class="summary-line"><span>ရောင်းမည့်ကုန်</span><strong>${N(count)} ထုပ်ပိုးအိတ် × ${vissText37(size)} ပိဿာ = ${vissText37(qty)} ပိဿာ</strong></div><div class="summary-line"><span>အိတ်ဖွဲ့စည်းပုံ</span><strong>${E(standardComposition(product,qty))}</strong></div><div class="summary-line total"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(total)}</strong></div>`:note('အိတ်ဝင်ပိဿာနှင့် အိတ်အရေအတွက် ထည့်ပါ။','amber');}
startSale=function(){
 if(!guardWork())return;const opts=saleProductOptions();if(!opts.length)return toast('ရောင်းနိုင်သော ပွဲရုံပိုင်ကုန် မရှိပါ။',true);const buyers=partners('buyer').map(p=>[p.id,p.name]);
 openModal('ကုန်ရောင်းမယ်','ကုန်ပစ္စည်းကိုသာ ရွေးပြီး တစ်အိတ်ရောင်းဈေးကို ကိုယ်တိုင်ထည့်ပါ။',`<form id="saleFormV37" onsubmit="event.preventDefault();saveSaleV37()"><div class="field-row">${selectField('ဝယ်သူ','saleBuyer',buyers,buyers[0]?.[0])}${field('ကုန်ရောင်းရက်','saleDate',{type:'date',value:today(),required:true})}</div>${selectField('ကုန်ပစ္စည်း','saleProduct',[['','ကုန်ပစ္စည်းရွေးပါ'],...opts],'','onchange="refreshSalePackageOptions()"')}<div id="saleProductStockInfo" class="v3-mini-preview" hidden aria-live="polite"></div>${field('ဝယ်သူလိုချင်သော တစ်အိတ်ဝင်','saleDesiredSize',{type:'number',min:.001,step:.001,required:true,suffix:'ပိဿာ',extra:'oninput="updateSalePreview()"'})}<div class="field-row">${field('ထုပ်ပိုးအိတ်အရေအတွက်','salePackageCount',{type:'number',min:1,required:true,suffix:'အိတ်',extra:'oninput="updateSalePreview()"'})}${field('တစ်အိတ် ရောင်းဈေး','saleBagPrice',{type:'number',min:1,required:true,suffix:'ကျပ်',extra:'oninput="updateSalePreview()"'})}</div>${selectField('ကုန်ထုတ်ပုံ','saleMode',[['direct','ယခုချက်ချင်း ထုတ်ပေးမည်'],['hold','ဝယ်သူပိုင်ကုန်အဖြစ် သိမ်းထားမည်']],'direct')}<div class="field-row">${field('ယခု လက်ခံငွေ','salePaid',{type:'number',min:0,value:0,suffix:'ကျပ်'})}${accountField('saleAccount','cash','လက်ခံသည့် ငွေသိမ်းရာ')}</div><div id="salePreview" class="summary-box"></div></form>${note('ရှိပြီးသား ထုပ်ပိုးအိတ်ကို System က အလိုအလျောက်ရွေးသုံးမည်။ အိတ်ဝင်ပိဿာ ပြောင်းလျှင် ပိုသောပိဿာကို မထုပ်ပိုးရသေး Stock ထဲ ပြန်ထည့်မည်။','blue')}`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('အရောင်း သိမ်းမယ်','saveSaleV37()','primary','check'),true);refreshSalePackageOptions();
};
function saveSaleV37(){
 if(!validForm('saleFormV37'))return;const buyer=state.masters.partners.find(p=>p.id===value('saleBuyer')),product=value('saleProduct'),desired=number('saleDesiredSize'),count=number('salePackageCount'),source=chooseSaleSource(product,desired,count),price=number('saleBagPrice'),paid=number('salePaid')||0,account=value('saleAccount'),date=isoDateValue('saleDate'),mode=value('saleMode'),standard=productStandard(product),qty=desired*count,total=Math.round(qty/standard*price);if(!buyer||!(desired>0)||!Number.isInteger(count)||count<=0||!(price>0)||!standard)return error('အရောင်းအချက်အလက်ကို ပြန်စစ်ပါ။');if(!source)return error('ရောင်းရန် အသုံးပြုနိုင်သော Stock မရှိပါ။');if(paid<0||paid>total)return error('လက်ခံငွေသည် ရောင်းတန်ဖိုးထက် မများရပါ။');let consumed;if(source==='loose'){if(qty>looseQty(product)+.000001)return error('မထုပ်ပိုးရသေး Stock မလောက်ပါ။');consumed=consumeLoose(product,qty);}else{const size=Number(source),bagsNeeded=Math.ceil(qty/size);const available=packagedOptions(product).find(x=>Math.abs(x[0]-size)<.000001)?.[1]||0;if(bagsNeeded>available)return error('ရှိပြီးသား ထုပ်ပိုးအိတ် Stock မလောက်ပါ။');consumed=consumePackages(product,size,bagsNeeded);const excess=consumed.qty-qty;if(excess>.000001)addLooseLot(product,excess,consumed.cost/consumed.qty,'Repack excess');if(Math.abs(size-desired)>.000001)state.packagingTransactions.push({id:uid('PK'),date,product,qty,bagCount:count,packageViss:desired,type:'repack',sourcePackageViss:size,excess});}
 const cost=consumed.cost*(qty/consumed.qty),id=uid('S'),s={id,no:'အရ-'+String(state.counter).padStart(3,'0'),date,name:buyer.name,buyerId:buyer.id,product,grade:'စုစုပေါင်း',qty,bags:count,packageCount:count,packageViss:desired,standardBagQty:qty/standard,price,priceBasis:'standard_bag',total,cost,paid,mode,deliveredQty:mode==='direct'?qty:0,deliveredBags:mode==='direct'?count:0,dispatches:[],payments:[]};state.sales.unshift(s);if(paid>0){s.payments.push({id:uid('PAY'),date,amount:paid,account});dateTxn(account,paid,'အရောင်းငွေ လက်ခံခြင်း',s.no,s.name,date);}if(mode==='hold')state.lots.push({id:uid('L'),product,grade:'စုစုပေါင်း',qty,bags:count,packageCount:count,packageViss:desired,owner:'customer',name:s.name,cost:cost/qty,saleId:id,stockForm:'packaged'});else dateMove(product,qty,'out',s.no,date,'sale');save();closeModal();page='sales';render();toast('အရောင်းစာရင်း သိမ်းပြီးပါပြီ။');
}
renderSaleRows=function(){let rows=state.sales.filter(s=>filter==='all'||filter==='collect'&&saleRemaining(s)>0||filter==='debt'&&receivable(s)>0||filter==='delivered'&&saleRemaining(s)===0);rows=rows.filter(s=>(s.name+s.product+s.no).toLowerCase().includes(searchTerm.toLowerCase()));document.getElementById('saleRows').innerHTML=rows.length?`<div class="v2-list">${rows.map(s=>`<article class="v2-record"><div><button class="name-btn" onclick="openSaleDetail('${s.id}')">${E(s.name)}</button><div class="record-meta">${E(s.product)} · ${shortDate(s.date)} · ${standardComposition(s.product,s.qty)}</div></div><div class="record-weight"><div class="record-qty">${N(s.packageCount??s.bags)} <small>ထုပ်ပိုးအိတ်</small></div><div class="record-sub">${vissText37(s.packageViss||0)} ပိဿာဝင်</div></div><div class="record-status">${saleStatus(s)}<span class="record-sub">${receivable(s)>0?'ရရန် '+M(receivable(s)):'ငွေရပြီး'}</span></div><div class="record-button">${btn(saleRemaining(s)>0?'ထုတ်ပေးမယ်':receivable(s)>0?'ငွေလက်ခံမယ်':'ကြည့်မယ်',saleRemaining(s)>0?`openDispatch('${s.id}')`:receivable(s)>0?`openSalePayment('${s.id}')`:`openSaleDetail('${s.id}')`,'secondary')}</div></article>`).join('')}</div>`:empty('ကိုက်ညီသော အရောင်းစာရင်း မရှိပါ။','sale');};
openSaleDetail=function(id){const s=state.sales.find(x=>x.id===id);if(!s)return;openModal('အရောင်းအသေးစိတ်',`${E(s.name)} · ${s.no}`,`<div class="summary-box"><div class="summary-line"><span>ကုန် / ရက်စွဲ</span><strong>${E(s.product)} · ${shortDate(s.date)}</strong></div><div class="summary-line"><span>ထုပ်ပိုးအိတ်</span><strong>${N(s.packageCount??s.bags)} အိတ် × ${vissText37(s.packageViss||0)} ပိဿာ</strong></div><div class="summary-line"><span>စုစုပေါင်း</span><strong>${E(standardComposition(s.product,s.qty))}</strong></div><div class="summary-line"><span>တစ်အိတ် ရောင်းဈေး</span><strong>${cashText(s.price)}</strong></div><div class="summary-line total"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(s.total)}</strong></div></div><h3 class="mt">ငွေရှင်း Transactions</h3>${paymentHistory(s.payments,false)}`,btn('ပိတ်မယ်','closeModal()','secondary')+(receivable(s)>0?btn('ငွေလက်ခံမယ်',`openSalePayment('${id}')`,'primary','wallet'):''),true);};
openSalePayment=function(id){if(!guardWork())return;const s=state.sales.find(x=>x.id===id);if(!s||receivable(s)<=0)return toast('ငွေအားလုံး လက်ခံပြီးပါပြီ။');openModal('အရောင်းကျန်ငွေ လက်ခံမယ်',`${E(s.name)} · ${s.no}`,`<div class="summary-box mb"><div class="summary-line total"><span>ငွေရရန်ကျန်</span><strong>${cashText(receivable(s))}</strong></div></div><form id="salePayForm" onsubmit="event.preventDefault();saveSalePayment('${id}')"><div class="field-row">${field('ငွေရှင်းရက်','salePayDate',{type:'date',value:today(),required:true})}${accountField('salePayAccount','cash','လက်ခံသည့် ငွေသိမ်းရာ')}</div>${field('ယခုရရှိငွေ','salePayAmount',{type:'number',min:1,max:receivable(s),value:receivable(s),required:true,suffix:'ကျပ်'})}</form><h3 class="mt">ယခင် Transactions</h3>${paymentHistory(s.payments,false)}`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('ငွေလက်ခံပြီး သိမ်းမယ်',`saveSalePayment('${id}')`,'primary','check'))};
saveSalePayment=function(id){if(!guardWork()||!validForm('salePayForm'))return;const s=state.sales.find(x=>x.id===id),amount=number('salePayAmount'),account=value('salePayAccount'),date=isoDateValue('salePayDate');if(!(amount>0)||amount>receivable(s))return error('ရရှိငွေကို ပြန်စစ်ပါ။');s.paid+=amount;s.payments??=[];s.payments.push({id:uid('PAY'),date,amount,account});dateTxn(account,amount,'အရောင်းကျန်ငွေ လက်ခံခြင်း',s.no,s.name,date);save();closeModal();render();toast('အရောင်းငွေရှင်း Transaction သိမ်းပြီးပါပြီ။');};

/* Settlement dates and histories on purchases. */
openPurchasePayment=function(id){if(!guardWork())return;const r=state.receipts.find(x=>x.id===id);if(!r||due(r)<=0)return toast('ငွေရှင်းပြီးသား ဖြစ်ပါတယ်။');const accounts=state.masters.accounts.filter(a=>a.active&&a.type!=='home'&&canViewAccount68(a)).map(a=>[a.id,a.name]);openModal('အဝယ်ကျန်ငွေ ရှင်းမယ်',`${E(r.name)} · ${r.purchaseNo||r.no}`,`${rSummary(r)}<div class="summary-box mb"><div class="summary-line"><span>အသားတင် အဝယ်တန်ဖိုး</span><strong>${cashText(purchaseNet(r))}</strong></div><div class="summary-line total"><span>ယခုရှင်းရန်ကျန်</span><strong>${cashText(due(r))}</strong></div></div><form id="purchasePayForm" onsubmit="event.preventDefault();savePurchasePayment('${id}')"><div class="field-row">${field('ငွေရှင်းရက်','payPurchaseDate',{type:'date',value:today(),required:true})}${selectField('ပေးချေသည့် ငွေသိမ်းရာ','payPurchaseAccount',accounts,'cash',`onchange="updatePurchaseFunding('${id}')"`)}</div>${field('ယခုထုတ်ပေးငွေ','payPurchaseAmount',{type:'number',min:1,max:due(r),value:due(r),required:true,suffix:'ကျပ်',extra:`oninput="updatePurchaseFunding('${id}')"`})}</form><div id="purchaseHomeFunding" class="purchase-home-funding"></div><h3 class="mt">ယခင် Transactions</h3>${paymentHistory(r.payments,true)}`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('အိမ်မှ ယူမည်',`takePurchaseMoneyFromHome('${id}')`,'soft','home','id="takeFromHomeBtn"')+btn('ငွေရှင်းပြီး သိမ်းမယ်',`savePurchasePayment('${id}')`,'primary','check'));updatePurchaseFunding(id);};
savePurchasePayment=function(id){if(!guardWork()||!validForm('purchasePayForm'))return;const r=state.receipts.find(x=>x.id===id),amount=number('payPurchaseAmount'),account=value('payPurchaseAccount'),date=isoDateValue('payPurchaseDate');if(!r||!(amount>0)||amount>due(r))return error('ထုတ်ပေးငွေကို ပြန်စစ်ပါ။');if(amount>bal(account))return error('ငွေမလောက်ပါ။ “အိမ်မှ ယူမည်” ကို သုံးပါ။');r.paid=(r.paid||0)+amount;r.payments??=[];r.payments.push({id:uid('PAY'),date,amount,account});dateTxn(account,-amount,'အဝယ်ကျန်ငွေ ရှင်းခြင်း',r.purchaseNo||r.no,r.name,date);save();closeModal();render();toast('အဝယ်ငွေရှင်း Transaction သိမ်းပြီးပါပြီ။');};
const v36TakePurchaseMoneyFromHome=takePurchaseMoneyFromHome;
takePurchaseMoneyFromHome=function(id){const before=state.transactions.length,date=isoDateValue('payPurchaseDate',today());v36TakePurchaseMoneyFromHome(id);state.transactions.slice(before).forEach(t=>t.date=date);save();};
openReceiptDetail=function(id){const r=state.receipts.find(x=>x.id===id);if(!r)return;openModal('အဝယ်စာရင်းအသေးစိတ်',`${E(r.name)} · ${r.purchaseNo||r.no}`,`${rSummary(r)}<div class="summary-box"><div class="summary-line"><span>တစ်အိတ် ဝယ်ဈေး</span><strong>${r.status==='purchased'?cashText(r.price):'မဖြတ်ရသေး'}</strong></div><div class="summary-line"><span>ကုန်ဖိုး</span><strong>${cashText(gross(r))}</strong></div><div class="summary-line total"><span>ငွေရှင်းရန်ကျန်</span><strong>${cashText(due(r))}</strong></div></div><h3 class="mt">ငွေရှင်း Transactions</h3>${paymentHistory(r.payments,true)}`,btn('ပိတ်မယ်','closeModal()','secondary')+(due(r)>0?btn('ငွေရှင်းမယ်',`openPurchasePayment('${id}')`,'primary','wallet'):''),true);};

/* Home shortcut, aggregate list wording, and deduction master. */
const v36HomePage=homePage;
homePage=function(){let html=v36HomePage().replace('class="v2-action-grid"','class="v2-action-grid v63-notes-grid"');const packaging=`<button class="v2-action" aria-label="ထုပ်ပိုးမည်" onclick="openPackaging()"><span class="icon-box">${I('stock')}</span><strong>ထုပ်ပိုးမည်</strong><small>ပုံထားသောကုန်ကို ထုပ်ပိုးအိတ်အဖြစ် ပြောင်းမယ်</small>${I('arrow')}</button>`,expense=`<button class="v2-action" aria-label="အသုံးစရိတ်" onclick="openExpense()"><span class="icon-box amber">${I('note')}</span><strong>အသုံးစရိတ်</strong><small>နေ့စဉ်အသုံးစရိတ် တန်းမှတ်မယ်</small>${I('arrow')}</button>`;const noteShortcut63=`<button class="v2-action" aria-label="မှတ်စုမှတ်မည်" onclick="openNotebook63()"><span class="icon-box">${I('note')}</span><strong>မှတ်စုမှတ်မည်</strong><small>မှတ်စုအသစ် ရေးပြီး သိမ်းထားမယ်</small>${I('arrow')}</button>`;return html.replace('</div>\n <section>',packaging+expense+noteShortcut63+'</div>\n <section>');};
const v36RenderReceiptRows=renderReceiptRows;
renderReceiptRows=function(){v36RenderReceiptRows();document.querySelectorAll('#receiptRows .record-meta').forEach(x=>x.innerHTML=x.innerHTML.replace('အဆင့်','ဝယ်ဈေးတန်း'));};
deductionRatesPage=function(){const d=state.masters.purchaseDeductions||{};return setupBack()+heading('','ပေါင်းနုတ်ငွေ နှုန်းထား','တစ်အိတ်အလိုက် ဝန်ဆောင်ခနှင့် လုပ်သားခကို သတ်မှတ်ပါ။')+`<section class="card v3-narrow-card"><form id="deductionMasterForm" onsubmit="event.preventDefault();saveDeductionRates()">${field('ဝန်ဆောင်ခ · တစ်အိတ်နှုန်း','masterWorkRate',{type:'number',min:0,value:d.workRate||0,suffix:'ကျပ်',required:true})}${field('လုပ်သားခ · တစ်အိတ်နှုန်း','masterLaborRate',{type:'number',min:0,value:d.laborRate||0,suffix:'ကျပ်',required:true})}<p class="field-help">ဘော်ဒါကြေးကို အဝယ်တွက်ချက်မှုမှ ဖယ်ရှားထားသည်။</p><div class="mt">${btn('နှုန်းထား သိမ်းမယ်','saveDeductionRates()','primary','check')}</div></form></section>`;};
saveDeductionRates=function(){if(!validForm('deductionMasterForm'))return;const workRate=Number(value('masterWorkRate')||0),laborRate=Number(value('masterLaborRate')||0);if([workRate,laborRate].some(v=>!Number.isFinite(v)||v<0))return toast('နှုန်းထားကို ပြန်စစ်ပါ။',true);const before={...state.masters.purchaseDeductions};state.masters.purchaseDeductions={workRate,laborRate,borderRate:0};masterLog('purchaseDeductions','purchaseDeductions',before,state.masters.purchaseDeductions);save();render();toast('အဝယ်နုတ်ငွေ နှုန်းထား သိမ်းပြီးပါပြီ။');};
const v36SetupView=setupView;
setupView=function(){let html=v36SetupView();return html.replace(/တစ်အိတ် စံပိဿာနှင့် အရည်အသွေး/g,'တစ်အိတ်ပိဿာနှင့် အဝယ်ဈေးတန်း').replace(/လုပ်ခနှင့် လုပ်သားခကို တစ်အိတ်နှုန်း သတ်မှတ်မယ်/g,'ဝန်ဆောင်ခနှင့် လုပ်သားခကို တစ်အိတ်နှုန်း သတ်မှတ်မယ်').replace(/ · ဘော်ဒါ [^<]*/g,'');};
const v36ProductList=productList;
productList=function(){return v36ProductList().replace(/ကုန်ပစ္စည်း \/ အရည်အသွေး/g,'ကုန်ပစ္စည်း / အဝယ်ဈေးတန်း');};
const v36OpenProductEdit=openProductEdit;
openProductEdit=function(id='',returnTo=null){v36OpenProductEdit(id,returnTo);document.querySelectorAll('#main label').forEach(l=>{if(l.textContent.trim().startsWith('အရည်အသွေးအဆင့်များ'))l.childNodes[0].textContent='အဝယ်ဈေးတန်းများ (အရည်အသွေး)';if(l.textContent.trim().startsWith('တစ်အိတ် စံအလေးချိန်'))l.childNodes[0].textContent='တစ်အိတ် အလေးချိန်';});};
ownerInventoryLedger=function(){
 const names=new Set([...state.moves.map(m=>m.product),...state.lots.map(l=>l.product)]);
 const rows=[...names].sort().map(product=>{const range=state.moves.filter(m=>m.product===product&&inOwnerDateRange(m.date)),before=state.moves.filter(m=>m.product===product&&m.date<ownerDateFrom).reduce((n,m)=>n+(m.direction==='in'?m.qty:-m.qty),0),base=(state.stockOpening||[]).filter(x=>x.product===product).reduce((n,x)=>n+receiptReceivedQuantity2(x),0),ins=range.filter(m=>m.direction==='in').reduce((n,m)=>n+m.qty,0),outs=range.filter(m=>m.direction==='out').reduce((n,m)=>n+m.qty,0),opening=base+before;return `<tr><td><strong>${E(product)}</strong></td><td class="right">${vissText37(opening)}</td><td class="right green">${vissText37(ins)}</td><td class="right">${vissText37(outs)}</td><td class="right"><strong>${N(opening+ins-outs)}</strong></td></tr>`;}).join('');
 return `<div class="mb">${note(`${ownerRangeText()} အတွင်း Product အလိုက် စုစုပေါင်းလှုပ်ရှားမှု။ Grade မခွဲပါ။`)}</div><div class="table-wrap"><table><thead><tr><th>ကုန်ပစ္စည်း</th><th class="right">ကာလအဖွင့်</th><th class="right">အဝင်</th><th class="right">အထွက်</th><th class="right">ကာလအပိတ်</th></tr></thead><tbody>${rows}</tbody></table></div>`;
};
ownerPage=function(){
 const rows=productStockRows(),purchases=state.receipts.filter(r=>r.status==='purchased'&&inOwnerDateRange(r.purchaseDate||r.date)),sales=state.sales.filter(s=>inOwnerDateRange(s.date)),expenses=state.expenses.filter(x=>inOwnerDateRange(x.date));
 return heading('','လုပ်ငန်းခြုံငုံမြင်ကွင်း','Stock ကို Product အလိုက် စုထားပြီး Report များကို Date Range ဖြင့် စစ်နိုင်သည်။',btn('ငွေယူလက်မှတ် ရေးမယ်','openMoneyRequest()','primary','doc'))+ownerDateFilterBar('အဝယ်၊ အရောင်းနှင့် အသုံးစရိတ်ကို Date Range အလိုက် စစ်ထုတ်ပါမည်။')+
 `<div class="grid cols-4 mb">${stat('ကာလအတွင်း အဝယ်',M(purchases.reduce((n,r)=>n+gross(r),0)),'ကျပ်','receive',`${purchases.length} စောင်`,'compact')}${stat('ကာလအတွင်း အရောင်း',M(sales.reduce((n,s)=>n+s.total,0)),'ကျပ်','sale',`${sales.length} စောင်`,'compact')}${stat('ကာလအတွင်း အသုံးစရိတ်',M(expenses.reduce((n,x)=>n+x.amount,0)),'ကျပ်','note',`${expenses.length} ခု`,'compact')}${stat('လက်ရှိပွဲရုံပိုင် Stock',N(rows.reduce((n,x)=>n+x.total,0)),'ပိဿာ','stock','Grade မခွဲ','compact')}</div><section class="card"><div class="card-title"><h3>လက်ရှိကုန်လက်ကျန်</h3>${smallbtn('အသေးစိတ်','navigate(\'inventory\')','secondary','arrow')}</div>${rows.length?`<div class="table-wrap"><table><thead><tr><th>ကုန်ပစ္စည်း</th><th class="right">ထုပ်ပိုးအိတ်</th><th class="right">အိတ်</th><th class="right">စုစုပေါင်းပိဿာ</th></tr></thead><tbody>${rows.map(x=>{const packages=packagedOptions(x.product);return `<tr><td><strong>${E(x.product)}</strong></td><td class="right">${packages.length?packages.map(([size,count])=>`<div><strong>${vissText37(size)}</strong> ပိဿာဝင် <strong>${N(count)}</strong> အိတ်</div>`).join(''):'—'}</td><td class="right">${E(bagComposition(x.product,x.total))}</td><td class="right"><strong>${vissText37(x.total)} ပိဿာ</strong></td></tr>`;}).join('')}</tbody></table></div>`:empty('Stock မရှိသေးပါ။','stock')}</section>`;
};

/* V3.8 — enforce the product-only sales model on every sales surface. */
const productOnlyStartSale=startSale;
startSale=function(){
 productOnlyStartSale();
 const form=document.getElementById('saleFormV37');
 if(form)document.documentElement.dataset.saleModel='product-only';
};
openDispatch=function(id){
 if(!guardWork())return;const s=state.sales.find(x=>x.id===id);if(!s)return;const q=saleRemaining(s),b=(s.packageCount??s.bags)-(s.deliveredBags||0);
 if(q<=0)return toast('ဤအရောင်း၏ကုန် အားလုံးထုတ်ပေးပြီးပါပြီ။');
 openModal('သိမ်းထပ်ထားသည့်ကုန် ထုတ်ပေးမယ်',`${E(s.name)} · ${s.no}`,`<div class="summary-box mb"><div class="row between wrap"><div><strong>${E(s.product)}</strong><div class="small muted">ဝယ်သူပိုင်ကုန် — ဝယ်ပြီး မသယ်သေးဘဲ အပ်ထားသောကုန်</div></div><div class="right"><strong>${vissText37(q)} ပိဿာ</strong><div class="small muted">${N(b)} ထုပ်ပိုးအိတ် ထုတ်ရန်ကျန်</div></div></div></div><form id="dispatchForm" onsubmit="event.preventDefault();saveDispatch('${id}')"><div class="field-row">${field('ပစ္စည်းလာယူသူ / အလုပ်သမား','dispatchCollector',{required:true,placeholder:'လာယူသူအမည်',extra:'maxlength="80"'})}${field('တင်သွားသော ကားနံပါတ်','dispatchCar',{placeholder:'ကားနံပါတ်',extra:'maxlength="40"'})}</div><div class="field-row">${field('စာရင်းအချိုးအရ ထုပ်ပိုးအိတ်','dispatchBags',{type:'number',min:0,value:b,suffix:'အိတ်',extra:'readonly step="any"'})}${field('ယခု ထုတ်ပေးမည့်အလေးချိန်','dispatchQty',{type:'number',min:.001,max:q,step:.001,value:q,required:true,suffix:'ပိဿာ',extra:`oninput="updateDispatchBags('${id}')"`})}</div></form>${note('မူလအရောင်းကို ထပ်မတင်ဘဲ ကုန်ထုတ်မှတ်တမ်းသာ သိမ်းပါမည်။','blue')}`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('ကုန်ထုတ်ပေးပြီး သိမ်းမယ်',`saveDispatch('${id}')`,'primary','check'));
 updateDispatchBags(id);
};
printSale=function(id){
 const s=state.sales.find(x=>x.id===id);if(!s)return;
 printDocument('အရောင်းဘောက်ချာ',s.no,`<p>ဝယ်သူ — <strong>${E(s.name)}</strong></p><p>အရောင်းရက် — ${shortDate(s.date)}</p><table style="margin-top:20px"><thead><tr><th>ကုန်ပစ္စည်း</th><th>ထုပ်ပိုးအိတ်</th><th>စုစုပေါင်းပိဿာ</th><th>တစ်အိတ်ရောင်းဈေး</th><th>ကုန်ဖိုး</th></tr></thead><tbody><tr><td>${E(s.product)}</td><td>${N(s.packageCount??s.bags)} အိတ် × ${vissText37(s.packageViss||0)} ပိဿာဝင်</td><td>${vissText37(s.qty)} ပိဿာ</td><td>${cashText(s.price)}</td><td>${cashText(s.total)}</td></tr></tbody></table><div style="margin-top:25px"><p>အိတ်ဖွဲ့စည်းပုံ — ${E(standardComposition(s.product,s.qty))}</p><p>လက်ခံပြီးငွေ — ${cashText(s.paid)}</p><h3>ငွေရရန်ကျန် — ${cashText(receivable(s))}</h3><p>ထုတ်ပေးပြီး — ${vissText37(s.deliveredQty)} ပိဿာ / ${N(s.deliveredBags)} ထုပ်ပိုးအိတ်</p><p>ထုတ်ပေးရန်ကျန် — ${vissText37(saleRemaining(s))} ပိဿာ / ${N((s.packageCount??s.bags)-s.deliveredBags)} ထုပ်ပိုးအိတ်</p></div>`);
};


/* Ownership views: preserve transaction ownership and existing stock tools. */
const ownershipDefinitions=[
 ['owned','ပွဲရုံပိုင်ကုန်','ပွဲရုံက ဝယ်ယူပိုင်ဆိုင်ထားပြီး ရောင်းချနိုင်သောကုန်'],
 ['supplier','ကုန်သည်ပိုင်ကုန်','ကုန်သည်က လာရောင်းသော်လည်း ဈေးမကြိုက်၍ မရောင်းသေးဘဲ အပ်ထားသောကုန်'],
 ['customer','ဝယ်သူပိုင်ကုန်','ဝယ်သူက ဝယ်ယူပြီး မသယ်သေးဘဲ ပွဲရုံတွင် သိမ်းထားသောကုန်']
];
const ownershipInventoryPage=inventoryPage;
const ownershipInventoryBody=renderInventoryBody;
inventoryPage=function(){
 let html=ownershipInventoryPage();
 html=html.replace('Grade မခွဲဘဲ ကုန်ပစ္စည်းအလိုက် စုစုပေါင်းပြထားသည်။','ကုန်ပိုင်ဆိုင်မှု သုံးမျိုးခွဲ၍ ကြည့်နိုင်သည်။ ကုန်သည်ပိုင်နှင့် ဝယ်သူပိုင်ကုန်ကို ပွဲရုံပိုင်အဖြစ် ထပ်ရောင်း၍ မရပါ။');
 html=html.replace('မထုပ်ပိုးရသေးသောကုန်','ပွဲရုံပိုင် — မထုပ်ပိုးရသေး').replace('ထုပ်ပိုးပြီးသားကုန်','ပွဲရုံပိုင် — ထုပ်ပိုးပြီး').replace('စုစုပေါင်းကုန်','ပွဲရုံပိုင် စုစုပေါင်း');
 const summary=`<div class="mb">${note(`ပွဲရုံတွင်ရှိသော ကုန်စုစုပေါင်း ${vissText37(stock())} ပိဿာ = ပွဲရုံပိုင် ${vissText37(stock('owned'))} + ကုန်သည်ပိုင် ${vissText37(stock('supplier'))} + ဝယ်သူပိုင် ${vissText37(stock('customer'))} ပိဿာ။`,'blue')}</div>`;
 return html.replace('<div class="toolbar">',summary+'<div class="toolbar">');
};
function chooseStockOwnership(kind){
 if(!ownershipDefinitions.some(x=>x[0]===kind))return;
 inventoryOwner=kind;renderInventoryBody();
}
renderInventoryBody=function(){
 if(invTab!=='overview'){ownershipInventoryBody();return;}
 const root=document.getElementById('inventoryBody');if(!root)return;
 if(!ownershipDefinitions.some(x=>x[0]===inventoryOwner))inventoryOwner='owned';
 const definition=ownershipDefinitions.find(x=>x[0]===inventoryOwner);
 let body='';
 if(inventoryOwner==='owned'){
  ownershipInventoryBody();body=root.innerHTML;
 }else{
  const supplier=inventoryOwner==='supplier';
  const lots=activeLots(inventoryOwner);
  body=lots.length?`<div class="table-wrap"><table><thead><tr><th>${supplier?'ကုန်သည်အမည်':'ဝယ်သူအမည်'}</th><th>ကုန်ပစ္စည်း</th><th>ဆက်စပ်မှတ်တမ်း / ရက်စွဲ</th><th class="right">လက်ကျန်ပိဿာ</th><th>ဆက်လုပ်ရန်</th></tr></thead><tbody>${lots.map(l=>{
   const record=supplier?state.receipts.find(r=>r.id===l.receiptId):state.sales.find(s=>s.id===l.saleId);
   const detail=record?smallbtn('အသေးစိတ်',`${supplier?'openReceiptDetail':'openSaleDetail'}('${record.id}')`,'secondary','eye'):'';
   const action=record&&state.role==='staff'?(supplier?smallbtn('ဈေး / ဆုံးဖြတ်ချက်',`openReceiptProcess('${record.id}')`,'secondary'):smallbtn('ကုန်ထုတ်ပေးမယ်',`openDispatch('${record.id}')`,'primary','truck')):'';
   return `<tr><td><strong>${E(l.name||record?.name||'—')}</strong></td><td>${E(l.product)}</td><td>${record?`${E(record.no)}<div class="sub">${shortDate(record.date)}</div>`:'—'}</td><td class="right"><strong>${vissText37(l.qty)} ပိဿာ</strong></td><td><div class="table-actions">${detail}${action}</div></td></tr>`;
  }).join('')}</tbody></table></div>`:empty(definition[1]+' မရှိသေးပါ။','stock');
 }
 root.innerHTML=`<div class="v2-ownership">${ownershipDefinitions.map(([key,title,description])=>`<button class="v2-owner-choice ${inventoryOwner===key?'active':''}" aria-pressed="${inventoryOwner===key}" onclick="chooseStockOwnership('${key}')"><strong>${title}</strong><span class="number">${N(stock(key))}<small>ပိဿာ</small></span><small>${description}</small></button>`).join('')}</div><section class="card"><div class="card-title"><h3>${definition[1]}</h3></div><p class="small muted mb">${definition[2]}</p>${body}</section><div class="mt">${note(inventoryOwner==='supplier'?'ဈေးဖြတ်ပြီး ပွဲရုံက ဝယ်ယူမှသာ ပွဲရုံပိုင်ကုန်သို့ ပြောင်းမည်။ ဈေးမဖြတ်ရသေးသော လက်ခံကုန်ကိုလည်း ကုန်သည်ပိုင်အဖြစ် ထိန်းထားသည်။':inventoryOwner==='customer'?'ဝယ်ပြီး သိမ်းထားသောကုန်ဖြစ်သည်။ ကုန်ထုတ်ပေးလျှင် ဝယ်သူပိုင်လက်ကျန် လျော့မည်။ အရောင်းအသစ် ထပ်မတင်ပါ။':'ပွဲရုံပိုင်ကုန်ကိုသာ ရောင်းချခြင်း၊ ထုပ်ပိုးခြင်းနှင့် ကုန်ချိန်ညှိခြင်းတွင် သုံးမည်။','blue')}</div>`;
};

initPageRevision();save();clearOldModal();workView=null;workDirty=false;revisionBase.render();writeRoute('page',null,page,true);

