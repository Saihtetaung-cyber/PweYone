
/* V3: same V2 visual system; product-specific bag conversion and compact masters.
   Stored transactions keep their own conversion snapshot. No server or real RBAC. */
'use strict';
icons.settings='M4 7h16M4 17h16M8 4v6M16 14v6';
icons.edit='M15 4l5 5M4 20l4-1L21 6l-5-5L3 14v6Z';
let setupSection='overview', setupQuery='', partnerKind='supplier', productReturn=null;
const v2Render=render, v2RenderNav=renderNav, v2Seed=seed, v2ReceiptRows=renderReceiptRows;
const v2Rsummary=rSummary, v2OpenPurchase=openPurchaseSettlement, v2CommitPurchase=commitPurchase;
const v2OpenSaleStep=openSaleStep, v2CommitSale=commitSale, v2PrintReceipt=printReceipt;
const v2OpenHelp=openHelp, v2CloseModal=closeModal;
function cleanText(s){return String(s??'').normalize('NFC').trim();}
function numericText(raw){return String(raw??'').replace(/[၀-၉]/g,c=>String(c.charCodeAt(0)-0x1040)).replace(/[,\s]/g,'');}
function parseDecimal(raw,max=1000000000){
 const s=numericText(raw);if(!/^\d+(?:\.\d{1,2})?$/.test(s))return null;
 const n=Number(s);return Number.isFinite(n)&&n>0&&n<=max?n:null;
}
function bagCalc(qty,standard){
 if(!Number.isFinite(qty)||!Number.isFinite(standard)||qty<=0||standard<=0)return null;
 const q=Math.round(qty*1000),s=Math.round(standard*1000);if(!s||!q)return null;
 return {qty:q/1000,standard:s/1000,bags:q/s,whole:Math.floor(q/s),remainder:(q%s)/1000};
}
function bagDisplay(c){return c?c.remainder?`${N(c.whole)} အိတ် + ${vissText37(c.remainder)} ပိဿာ`:`${N(c.whole)} အိတ်`:'';}
function bagNumber(n){return new Intl.NumberFormat('en-US',{maximumFractionDigits:6}).format(n);}
function setupSeed(){
 return {schema:1,products:[
 {id:'P01',name:'ပြောင်း',standardViss:25,grades:['A','B','C'],active:true,revision:1,aliases:[]},
 {id:'P02',name:'နှမ်း',standardViss:null,grades:['A','B','C'],active:true,revision:1,aliases:[]},
 {id:'P03',name:'ဂျုံ',standardViss:null,grades:['A','B','C'],active:true,revision:1,aliases:[]}
 ],partners:[
 {id:'C01',name:'ဦးတင်မောင်',kind:'supplier',type:'farmer',active:true},
 {id:'C02',name:'ဦးလှအောင်',kind:'supplier',type:'trader',active:true},
 {id:'C03',name:'ဒေါ်ခင်စန်း',kind:'supplier',type:'farmer',active:true},
 {id:'C04',name:'ဦးစိုးမြင့်',kind:'supplier',type:'trader',active:true},
 {id:'C05',name:'ရွှေစပါးကုန်သွယ်ရေး',kind:'buyer',type:'buyer',active:true}
 ],accounts:[
 {id:'cash',name:'ပွဲရုံ ငွေသား',type:'cash',active:true},
 {id:'bank',name:'ဘဏ် / ငွေပေးချေမှုအကောင့်',type:'bank',active:true},
 {id:'home',name:'အိမ် ငွေသိမ်းရာ',type:'home',active:true}
 ],expenseReasons:[
 {id:'ER01',name:'ပွဲရုံခံ သယ်ယူခ',active:true},
 {id:'ER02',name:'မီးဖိုး',active:true},
 {id:'ER03',name:'ရေဖိုး',active:true},
 {id:'ER04',name:'အထွေထွေ အသုံးစရိတ်',active:true}
 ],handling:{piecesPerBag:2,rate:null},purchaseDeductions:{workRate:0,laborRate:0,borderRate:0},changes:[]};
}
function ensureMasters(){if(!state.masters||state.masters.schema!==1)state.masters=setupSeed();if(!state.masters.purchaseDeductions)state.masters.purchaseDeductions={workRate:0,laborRate:0,borderRate:0};state.uiVersion=3;syncMasters();}
function products(activeOnly=false){return state.masters.products.filter(p=>!activeOnly||p.active);}
function productBy(key){return state.masters.products.find(p=>p.id===key||p.name===key||(p.aliases||[]).includes(key));}
function syncMasters(){
 PRODUCTS.splice(0,PRODUCTS.length,...state.masters.products.filter(p=>p.active).map(p=>p.name));
 state.masters.accounts.forEach(a=>{ACCOUNT_NAMES[a.id]=a.name;if(!Number.isFinite(state.bases[a.id]))state.bases[a.id]=0;});
}
function masterLog(kind,id,oldData,newData){state.masters.changes.unshift({date:today(),kind,id,before:oldData,after:JSON.parse(JSON.stringify(newData))});activity('အခြေခံသတ်မှတ်ချက် ပြင်ဆင်ခဲ့သည်။');}
function recordBagInfo(r){
 if(r.bagCalculation){const c=bagCalc(r.qty,r.bagCalculation.standardViss);return bagDisplay(c);}
 return `${N(r.bags)} အိတ်`;
}
function partners(kind){return state.masters.partners.filter(p=>p.kind===kind&&p.active);}
function ensurePartner(name,kind,type){
 if(state.masters.partners.some(p=>p.name===name&&p.kind===kind))return;
 state.masters.partners.push({id:uid('C'),name,kind,type,active:true});
}
function beginSetup(section='overview'){
 setupSection=section;setupQuery='';closeModal();navigate('setup');
}
renderNav=function(){
 v2RenderNav();
 if(page==='setup')document.querySelectorAll('#topNav button').forEach(b=>{b.classList.remove('active');b.removeAttribute('aria-current');});
 const target=document.querySelector('.v2-role');
 if(!document.getElementById('masterSetupBtn'))target.insertAdjacentHTML('beforebegin',`<button id="masterSetupBtn" class="v3-setup-btn" onclick="beginSetup()" title="အခြေခံသတ်မှတ်ချက်များ" aria-label="အခြေခံသတ်မှတ်ချက်များ">${I('settings')}<span>သတ်မှတ်ချက်</span></button>`);
 document.getElementById('masterSetupBtn').classList.toggle('selected',page==='setup');
};
render=function(){
 if(page!=='setup'){v2Render();patchCashViews();return;}
 clearToast();renderNav();
 document.getElementById('main').innerHTML=setupView()+``+(!storageOK?note('ဘရောက်ဇာတွင် ဒေတာမသိမ်းနိုင်ပါ။ ပိတ်ပါက ပျောက်နိုင်သည်။','amber'):'');
};
function setupView(){
 if(setupSection==='products')return productList();
 if(setupSection==='partners')return partnerList();
 if(setupSection==='accounts')return accountList();
 if(setupSection==='handling')return handlingPage();
 if(setupSection==='deductions')return deductionRatesPage();
 const ready=products().filter(p=>p.standardViss>0).length;
 const cards=[
 ['grain','ကုန်ပစ္စည်းများ','တစ်အိတ် စံပိဿာနှင့် အရည်အသွေး',`${ready} / ${products().length} မျိုး စံပိဿာသတ်မှတ်ပြီး`,'products'],
 ['users','ကုန်သည်နှင့် ဝယ်သူများ','ကုန်သည်၊ ဝယ်သူ အမည်စာရင်း',`${state.masters.partners.filter(p=>p.active).length} ဦး`,'partners'],
 ['wallet','ငွေသိမ်းရာများ','ငွေသားနှင့် ငွေပေးချေမှုအကောင့်',`${state.masters.accounts.filter(canViewAccount68).length} နေရာ`,'accounts'],
 ['scale','လုပ်သားခနှုန်း','တစ်ပိုင်း တစ်ခါကိုင်နှုန်း',state.masters.handling.rate===null?'နှုန်းထား မသတ်မှတ်ရသေး':`${cashText(state.masters.handling.rate)} / တစ်ခါကိုင်`,'handling'],
 ['price','ပေါင်းနုတ်ငွေ နှုန်းထား','ဝန်ဆောင်ခနှင့် လုပ်သားခကို တစ်အိတ်နှုန်း သတ်မှတ်မယ်',`ဝန်ဆောင်ခ ${cashText(state.masters.purchaseDeductions.workRate||0)} · လုပ်သားခ ${cashText(state.masters.purchaseDeductions.laborRate||0)} · ဘော်ဒါ ${cashText(state.masters.purchaseDeductions.borderRate||0)}`,'deductions']
 ];
 return `<button class="v2-back" onclick="navigate(state.role==='owner'?'owner':'home')">${I('back')}ယနေ့အလုပ်သို့</button>`+
 heading('','အခြေခံသတ်မှတ်ချက်များ','တစ်ခါသတ်မှတ်ထားပြီး နေ့စဉ်စာရင်းမှာ ပြန်သုံးမယ်။')+
 `<div class="v3-master-grid">${cards.map(([i,t,d,c,k])=>`<button class="v2-records-card v3-master-card" onclick="beginSetup('${k}')"><span class="icon-box">${I(i)}</span><strong>${t}</strong><p>${d}</p><div class="v3-card-bottom"><span>${c}</span><span class="end-link">ပြင်ဆင်မယ် ${I('arrow')}</span></div></button>`).join('')}</div>`+
 `<div class="v3-rule-strip">${I('scale')}<div><strong>အလေးချိန်ထည့်ရုံနဲ့ အိတ်အရေအတွက် တွက်ပေးမယ်။</strong><p>ဥပမာ — ပြောင်း ၁ အိတ် = ၂၅ ပိဿာ။ ၂၅၀ ပိဿာ လက်ခံလျှင် ၁၀ အိတ်။</p></div></div>`;
}
function setupBack(){return `<button class="v2-back" onclick="beginSetup()">${I('back')}အခြေခံသတ်မှတ်ချက်များသို့</button>`;}
function productList(){
 return setupBack()+heading('','ကုန်ပစ္စည်းများ','ကုန်တစ်မျိုးချင်းအတွက် တစ်အိတ် စံအလေးချိန် သတ်မှတ်ပါ။',btn('ကုန်အသစ် ထည့်မယ်',"openProductEdit()",'primary','plus'))+
 `<div class="v3-list-header"><span>ကုန်ပစ္စည်း / ဝယ်ဈေးတန်း</span><span>တစ်အိတ် စံပိဿာ</span><span></span></div><div class="v2-list">${products().map(p=>`<article class="v3-product-row"><div class="row"><span class="icon-box">${I('grain')}</span><div><strong>${E(p.name)}</strong><div class="record-meta">${p.grades.map(E).join(' · ')}${!p.active?' · အသုံးမပြုတော့ပါ':''}</div></div></div><div class="v3-standard">${p.standardViss?`<strong>${N(p.standardViss)}</strong> <span>ပိဿာ / အိတ်</span>`:pill('သတ်မှတ်ရန်လို','amber')}</div>${btn('ပြင်မယ်',`openProductEdit('${p.id}')`,'secondary')}</article>`).join('')}</div>`+
 `<p class="field-help mt">ပြောင်း ၂၅ ပိဿာသည် ပေးထားသောဥပမာအတိုင်း ဖြစ်သည်။ နှမ်းနှင့် ဂျုံကို ကိုယ်တိုင်သတ်မှတ်ပါ။ ယခင်မှတ်တမ်းများ၏ အိတ်အရေအတွက် မပြောင်းပါ။</p>`;
}
function safeLabel(s){return s.length>0&&s.length<=60&&!/[<>"'|\u0000-\u001f]/.test(s);}
function openProductEdit(id='',returnTo=null){
 const p=id?productBy(id):null;productReturn=returnTo;
 const v=p||{id:'',name:'',standardViss:null,grades:['A','B','C'],active:true};
 openModal(p?'ကုန်သတ်မှတ်ချက် ပြင်မယ်':'ကုန်အသစ် ထည့်မယ်','တစ်အိတ်ရဲ့ စံပိဿာနှင့် ဝယ်ဈေးတန်းများကို ဒီနေရာမှာ သတ်မှတ်ပါ။',
 `<form id="productMasterForm" onsubmit="event.preventDefault();saveProductMaster('${v.id}')">
 ${field('ကုန်အမည်','masterProductName',{value:v.name,required:true,placeholder:'ဥပမာ — ပြောင်း',extra:'maxlength="60"'})}
 ${field('တစ်အိတ် စံအလေးချိန်','masterStandard',{value:v.standardViss??'',required:true,placeholder:'ဥပမာ 25',suffix:'ပိဿာ',extra:'inputmode="decimal" oninput="updateMasterPreview()" autocomplete="off"'})}
 <div class="v3-standard-note">${I('info')}ကုန်တစ်မျိုးချင်းစီအတွက် သီးခြားသတ်မှတ်နိုင်ပါတယ်။</div>
 ${field('ဝယ်ဈေးတန်းများ','masterGrades',{value:v.grades.join(', '),required:true,placeholder:'ဥပမာ — A, B, C သို့မဟုတ် အမြင့်, အလတ်, အနိမ့်',help:'ဝယ်ဈေးတန်းတစ်ခုချင်းကို ကော်မာဖြင့် ခွဲထည့်ပါ။',extra:'maxlength="180"'})}
 <details class="details"><summary>စမ်းတွက်ကြည့်မယ်</summary><div class="mt">${field('စုစုပေါင်း အလေးချိန်','masterTestQty',{value:250,suffix:'ပိဿာ',extra:'inputmode="decimal" oninput="updateMasterPreview()"'})}<div id="masterTestResult" class="v3-mini-preview" aria-live="polite"></div></div></details>
 ${p?`<details class="details mt"><summary>အသုံးပြုမှု</summary><div class="mt">${selectField('အခြေအနေ','masterProductActive',[[true,'အသုံးပြုမည်'],[false,'အသစ်ထည့်ရာတွင် မသုံးတော့ပါ']],v.active)}</div></details>`:''}
 </form><p class="field-help mt">စံပိဿာကို ပြင်လျှင် အသစ်လက်ခံမည့်စာရင်းတွင်သာ သက်ရောက်မည်။ သိမ်းပြီးစာရင်းကို နောက်ကြောင်းပြန်မတွက်ပါ။</p>`,
 btn('မပြင်တော့ပါ','cancelProductMaster()','secondary')+btn('သိမ်းမယ်',`saveProductMaster('${v.id}')`,'primary','check','id="saveProductMasterBtn"'));
 updateMasterPreview();
}
function cancelProductMaster(){const back=productReturn;productReturn=null;if(back==='receipt')receiptCargo();else closeModal();}
function updateMasterPreview(){
 const standard=parseDecimal(value('masterStandard'),1000000),qty=parseDecimal(value('masterTestQty'));
 const el=document.getElementById('masterTestResult');if(!el)return;
 const c=bagCalc(qty,standard);el.innerHTML=c?`<span>${vissText37(qty)} ÷ ${vissText37(standard)}</span><strong>${bagDisplay(c)}</strong>`:'မှန်ကန်သော စံပိဿာနှင့် အလေးချိန် ထည့်ပါ။';
}
function saveProductMaster(id){
 if(!validForm('productMasterForm'))return;
 const name=cleanText(value('masterProductName')),standard=parseDecimal(value('masterStandard'),1000000);
 const grades=[...new Set(value('masterGrades').split(/[,၊]/).map(cleanText).filter(Boolean))];
 if(!safeLabel(name))return error('ကုန်အမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
 if(!standard)return error('စံပိဿာကို သုညထက်ကြီးသော ကိန်းဖြင့် ထည့်ပါ။ ဒဿမ ၃ လုံးအထိ ရသည်။');
 if(!grades.length||grades.length>12||grades.some(g=>!safeLabel(g)||g.length>15))return error('ဝယ်ဈေးတန်းများကို မှန်ကန်စွာ ထည့်ပါ။');
 if(products().some(p=>p.id!==id&&(p.name===name||(p.aliases||[]).includes(name))))return error('ဤကုန်အမည် ရှိပြီးသားဖြစ်ပါတယ်။');
 const existing=id?productBy(id):null,before=existing?JSON.parse(JSON.stringify(existing)):null;
 const p=existing||{id:uid('P'),aliases:[],revision:0};
 if(existing&&existing.name!==name){p.aliases=[...new Set([...p.aliases,p.name])];existing.grades.forEach(g=>{const old=p.name+'|'+g;if(state.prices[old])state.prices[name+'|'+g]=state.prices[old];});}
 Object.assign(p,{name,standardViss:standard,grades,active:existing?value('masterProductActive')!=='false':true,revision:p.revision+1});
 if(!existing)state.masters.products.push(p);
 masterLog('product',p.id,before,p);syncMasters();save();
 const back=productReturn;productReturn=null;
 if(back==='receipt'){
  const selected=productBy(receiptWizard.productId);receiptWizard.product=selected.name;receiptWizard.standardViss=selected.standardViss;receiptWizard.productRevision=selected.revision;
  if(!selected.grades.includes(receiptWizard.grade))receiptWizard.grade=selected.grades[0];
  receiptCargo();
 }else{closeModal();setupSection='products';page='setup';render();toast('ကုန်သတ်မှတ်ချက် သိမ်းပြီးပါပြီ။');}
}
function partnerList(){
 const list=state.masters.partners.filter(p=>p.kind===partnerKind);
 return setupBack()+heading('','ကုန်သည်နှင့် ဝယ်သူများ','အမည်ကို ကြိုသိမ်းထားပြီး စာရင်းသွင်းချိန်မှာ ရွေးသုံးမယ်။',btn('အမည်အသစ် ထည့်မယ်','openPartnerEdit()','primary','plus'))+
 `<div class="toolbar"><div class="tabs">${[['supplier','ကုန်သည်'],['buyer','ဝယ်သူ']].map(([k,t])=>`<button class="tab ${partnerKind===k?'active':''}" onclick="partnerKind='${k}';render()">${t}</button>`).join('')}</div><span class="small muted">${list.length} ဦး</span></div>`+
 `<div class="v2-list">${list.map(p=>`<div class="v3-partner-row"><span class="icon-box">${I('users')}</span><div class="grow"><strong>${E(p.name)}</strong><div class="record-meta">${p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်'}${!p.active?' · အသုံးမပြုတော့ပါ':''}</div></div>${btn('ပြင်မယ်',`openPartnerEdit('${p.id}')`,'secondary')}</div>`).join('')||empty('အမည်စာရင်း မရှိသေးပါ။','users')}</div>`;
}
function openPartnerEdit(id=''){
 const p=state.masters.partners.find(x=>x.id===id)||{id:'',name:'',kind:partnerKind,type:partnerKind==='buyer'?'buyer':'trader',active:true};
 openModal(p.kind==='buyer'?'ဝယ်သူအမည် သတ်မှတ်မယ်':'ကုန်လာချသူအမည် သတ်မှတ်မယ်','သိမ်းထားသည့်အမည်ကို နေ့စဉ်အလုပ်မှာ ပြန်ရွေးနိုင်မယ်။',
 `<form id="partnerForm" onsubmit="event.preventDefault();savePartnerMaster('${id}','${p.kind}')">${field('အမည်','masterPartnerName',{value:p.name,required:true,extra:'maxlength="80"'})}${p.kind==='supplier'?'<input type="hidden" id="masterPartnerType" value="trader">':''}${selectField('အခြေအနေ','masterPartnerActive',[[true,'အသုံးပြုမည်'],[false,'အသစ်ထည့်ရာတွင် မသုံးတော့ပါ']],p.active)}</form>`,btn('မပြင်တော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`savePartnerMaster('${id}','${p.kind}')`,'primary','check'));
}
function savePartnerMaster(id,kind){
 if(!validForm('partnerForm'))return;const name=cleanText(value('masterPartnerName'));
 if(!name)return error('အမည် ထည့်ပါ။');
 if(state.masters.partners.some(p=>p.id!==id&&p.name===name&&p.kind===kind))return error('ဤအမည် ရှိပြီးသားဖြစ်ပါတယ်။');
 const existing=state.masters.partners.find(p=>p.id===id),before=existing?{...existing}:null,p=existing||{id:uid('C')};
 Object.assign(p,{name,kind,type:kind==='buyer'?'buyer':value('masterPartnerType'),active:value('masterPartnerActive')==='true'});
 if(!existing)state.masters.partners.push(p);masterLog('partner',p.id,before,p);save();closeModal();render();toast('အမည်စာရင်း သိမ်းပြီးပါပြီ။');
}
/* V51: Account Master additions apply only to cash/bank/wallet master data. */
function accountMasterUsed51(id){
 const found=(state.transactions||[]).some(t=>t.account===id)||(state.cashIns50||[]).some(x=>x.source===id||x.destination===id);
 if(found||Number(state.bases[id]||0)!==0||Math.abs(bal(id))>0.000001)return true;
 const records=[state.receipts,state.sales,state.expenses,state.requests,state.supplierAdvances,state.collectionSlips].filter(Array.isArray);
 return records.some(arr=>JSON.stringify(arr).includes('"'+id+'"'));
}
function accountList(){
 const editable=state.role==='owner';
 const types={home:'အိမ်ငွေ',bank:'Bank Account',wallet:'Wallet',cash:'Cash Account'};
 return setupBack()+heading('','ငွေသိမ်းရာများ','Bank Account တစ်ခုချင်းစီကို သီးခြားဖွင့်ပြီး Cash In / Internal Transfer တွင် ရွေးနိုင်သည်။',editable?btn('Create Account','openAccountMaster()','primary','plus'):'')+
 `<div class="mb">${note('မူလ “ဘဏ် (မူလအကောင့်)” တွင် ယခင်ငွေလက်ကျန်များ ဆက်ရှိနေမည်။ KBZ / AYA / CB အကောင့်အသစ်များကို အောက်မှ ထည့်ပါ။ အသစ်ဖွင့်ချိန်တွင် Opening Balance ထည့်နိုင်သည်။ စာရေးမ ကြည့်ခွင့်ကို ငွေသိမ်းရာတစ်ခုချင်းစီအလိုက် သတ်မှတ်ပါ။','blue')}</div>`+
 `<div class="v2-list">${state.masters.accounts.filter(canViewAccount68).map(a=>`<div class="v3-partner-row"><span class="icon-box">${I(a.type==='bank'?'bank':'wallet')}</span><div class="grow"><strong>${E(a.name)}</strong><div class="record-meta">${E(types[a.type]||a.type)} · ${a.active?'Active':'Inactive'} · လက်ကျန် ${cashText(bal(a.id))}</div></div>${editable?accountPermissionField68('accountView68_'+a.id,staffAccountVisible68(a),'စာရေးမ ကြည့်ခွင့်ရှိ',`onchange="setAccountVisibility68('${a.id}',this.checked)"`):''}${a.active?pill('Active'):pill('Inactive','gray')}${editable?btn('ပြင်မယ်',`openAccountMaster('${a.id}')`,'secondary'):''}</div>`).join('')}</div>`+
 `<p class="field-help mt">Account Name ပြင်ခြင်းက ယခင်ငွေလက်ကျန်ကို မပြောင်းပါ။ သုံးပြီးသား Account ကို ဖျက်မရပါ။ Balance ရှိနေသော Account ကို Inactive မပြောင်းနိုင်ပါ။</p>`;
}
function openAccountMaster(id=''){
 if(state.role!=='owner')return toast('ပိုင်ရှင်မှသာ Account Master ကို ပြင်နိုင်သည်။',true);
 const a=state.masters.accounts.find(x=>x.id===id)||{id:'',name:'',type:'bank',active:true,staffCanView:true};
 const base=['cash','bank','home','kpay','wave'].includes(id);
 const footer=btn('မပြင်တော့ပါ','closeModal()','secondary')+
 (!base&&id?btn('Delete',`confirmDeleteAccountMaster51('${id}')`,'danger'): '')+
 btn('သိမ်းမယ်',`saveAccountMaster('${id}')`,'primary','check');
 openModal(id?'Edit Account':'Create Account','Bank အချင်းချင်း လွှဲရန် Bank Account တစ်ခုစီကို သီးခြားထားပါ။',
 `<form id="accountMasterForm" onsubmit="event.preventDefault();saveAccountMaster('${id}')">`+
 field('Account Name *','masterAccountName',{value:a.name,required:true,extra:'maxlength="60"'})+
 (id?`<div class="v2-inline-info">${I('lock')}Account Type, Balance နှင့် ယခင် Transactions မပြောင်းပါ။</div>`:selectField('Account Type *','masterAccountType',[['bank','Bank Account'],['cash','Cash Account'],['wallet','Wallet / Mobile Money']],'bank','required'))+
 (!id?field('Opening Balance (အဖွင့်လက်ကျန်)','masterAccountOpening68',{type:'number',min:0,step:1,value:0,required:true,suffix:'ကျပ်',extra:'max="9007199254740991"'}):'')+
 accountPermissionField68('masterAccountStaffView68',staffAccountVisible68(a))+
 '<p class="field-help">အမှန်ခြစ်ထားလျှင် စာရေးမက ဤငွေသိမ်းရာကို ကြည့်နိုင်မည်။ အမှန်ခြစ်ဖြုတ်ထားလျှင် စာရေးမမြင်ကွင်းတွင် မပြပါ။</p>'+
 selectField('Status *','masterAccountActive',[['true','Active'],['false','Inactive']],String(a.active),'required')+
 (id?`<div class="summary-box mt">${row4('Current Balance',cashText(bal(id)))}</div>`:'')+
 '</form>',footer,true);
}
function saveAccountMaster(id){
 if(state.role!=='owner')return toast('ပိုင်ရှင်မှသာ သိမ်းနိုင်သည်။',true);
 if(!validForm('accountMasterForm'))return;
 const name=cleanText(value('masterAccountName')),active=value('masterAccountActive')==='true';
 if(!safeLabel(name)||state.masters.accounts.some(a=>a.id!==id&&a.name.toLowerCase()===name.toLowerCase()))return error('အမည်မှန်ကန်စွာ ဖြည့်ပါ။ တူညီသော Account Name နှစ်ခု မရပါ။');
 const existing=state.masters.accounts.find(a=>a.id===id);
 if(id&&!existing)return error('Account ရှာမတွေ့ပါ။');
 if(!active&&existing&&Math.abs(bal(id))>0.000001)return error('လက်ကျန်ငွေရှိသော Account ကို Inactive မပြောင်းနိုင်ပါ။ အရင်ငွေရွှေ့ပါ။');
 const type=existing?.type||value('masterAccountType');
 if(!['bank','cash','wallet','home'].includes(type))return error('Account Type မှားနေပါသည်။');
 if(!existing&&!active)return error('အကောင့်အသစ်ကို Active ဖြင့် စတင်ပါ။');
 const opening=existing?null:Number(value('masterAccountOpening68'));
 if(!existing&&(value('masterAccountOpening68')===''||!Number.isSafeInteger(opening)||opening<0))return error('Opening Balance ကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် မှန်ကန်စွာ ထည့်ပါ။');
 const before=existing?{...existing}:null,a=existing||{id:uid('ACC'),type,active:true};
 a.name=name;a.active=active;a.staffCanView=document.getElementById('masterAccountStaffView68').checked;
 if(!existing){a.openingBalance=opening;a.openingDate=today();state.masters.accounts.push(a);state.bases[a.id]=opening;}

 masterLog('account',a.id,before,a);syncMasters();save();closeModal();render();toast('Account Master သိမ်းပြီးပါပြီ။');
}
function confirmDeleteAccountMaster51(id){
 if(state.role!=='owner')return;
 const a=state.masters.accounts.find(x=>x.id===id);
 if(!a||['cash','bank','home','kpay','wave'].includes(id))return error('မူလ Account များကို Delete မလုပ်နိုင်ပါ။');
 if(accountMasterUsed51(id))return error('လက်ကျန် သို့မဟုတ် မှတ်တမ်းရှိသော Account ကို Delete မလုပ်နိုင်ပါ။ Inactive ပြောင်းပါ။');
 openModal('Delete Account','အသုံးမပြုရသေးသော Account ကိုသာ Delete လုပ်နိုင်ပါသည်။',
 `<p>${E(a.name)} ကို ဖျက်လိုပါသလား။</p>`,btn('မဖျက်တော့ပါ','closeModal()','secondary')+btn('Delete',`deleteAccountMaster51('${id}')`,'danger'));
}
function deleteAccountMaster51(id){
 if(state.role!=='owner')return;
 if(['cash','bank','home','kpay','wave'].includes(id)||accountMasterUsed51(id))return error('အသုံးပြုပြီးသော Account ကို Delete မလုပ်နိုင်ပါ။');
 const idx=state.masters.accounts.findIndex(a=>a.id===id);if(idx<0)return error('Account ရှာမတွေ့ပါ။');
 const before={...state.masters.accounts[idx]};state.masters.accounts.splice(idx,1);
 masterLog('account',id,before,{deleted:true});delete state.bases[id];delete ACCOUNT_NAMES[id];
 save();closeModal();setupSection='accounts';page='setup';render();toast('Account ဖျက်ပြီးပါပြီ။');
}
function handlingPage(){
 const h=state.masters.handling;
 return setupBack()+heading('','လုပ်သားခနှုန်း','အဝယ်ငွေရှင်းချိန်မှာ ပြန်သုံးမည့် ကိုင်ခနှုန်း။')+
 `<section class="card v3-narrow-card"><form id="handlingMasterForm" onsubmit="event.preventDefault();saveHandlingMaster()"><div class="v3-rule-strip compact">${I('scale')}<div><strong>တစ်အိတ် = နှစ်ပိုင်း</strong><p>တစ်ပိုင်းကို တစ်ခါကိုင်အဖြစ် တွက်မယ်။</p></div></div>${field('တစ်ပိုင်း တစ်ခါကိုင်နှုန်း','masterHandlingRate',{value:h.rate??'',type:'number',min:0,suffix:'ကျပ်',placeholder:'နှုန်းထား ထည့်ပါ'})}<p class="field-help">ကိုင်ခတွက်ရာမှာ တကယ်ကိုင်သည့်အိတ်နှင့် အကြိမ်ကို ထည့်ရမည်။ စံပိဿာမှတွက်ထားသော ဒဿမအိတ်ကို တကယ့်အိတ်ဟု အလိုအလျောက် မယူပါ။</p><div class="mt">${btn('နှုန်းထား သိမ်းမယ်','saveHandlingMaster()','primary','check')}</div></form></section>`;
}
function saveHandlingMaster(){
 const raw=value('masterHandlingRate'),rate=raw===''?null:Number(raw);
 if(rate!==null&&(!Number.isFinite(rate)||rate<0||!Number.isInteger(rate))){toast('နှုန်းထားကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။',true);return;}
 const before={...state.masters.handling};state.masters.handling.rate=rate;masterLog('handling','handling',before,state.masters.handling);save();render();toast('ကိုင်ခနှုန်း သိမ်းပြီးပါပြီ။');
}
function deductionRatesPage(){
 const d=state.masters.purchaseDeductions||{workRate:0,laborRate:0,borderRate:0};
 return setupBack()+heading('','ပေါင်းနုတ်ငွေ နှုန်းထား','ဈေးဖြတ်ချိန်မှာ အိတ်အရေအတွက်အလိုက် Auto တွက်ရန် တစ်အိတ်နှုန်းထားများ သတ်မှတ်ပါ။')+
 `<section class="card v3-narrow-card"><form id="deductionMasterForm" onsubmit="event.preventDefault();saveDeductionRates()">
 <div class="v3-rule-strip compact">${I('price')}<div><strong>ဈေးဖြတ်ချိန်မှာ ကိုယ်တိုင် ပြန်မရိုက်ရပါ။</strong><p>အိတ်အရေအတွက် × Master နှုန်းထားဖြင့် ဝန်ဆောင်ခနှင့် လုပ်သားခကို Auto တွက်ပေးမယ်။</p></div></div>
 ${field('ဝန်ဆောင်ခ · တစ်အိတ်နှုန်း','masterWorkRate',{type:'number',min:0,value:d.workRate||0,suffix:'ကျပ်',required:true})}
 ${field('လုပ်သားခ · တစ်အိတ်နှုန်း','masterLaborRate',{type:'number',min:0,value:d.laborRate||0,suffix:'ကျပ်',required:true})}
 ${field('ဘော်ဒါကြေး · တစ်အိတ်နှုန်း','masterBorderRate',{type:'number',min:0,value:d.borderRate||0,suffix:'ကျပ်',required:true})}
 <div class="mt">${btn('နှုန်းထား သိမ်းမယ်','saveDeductionRates()','primary','check')}</div></form></section>`;
}
function saveDeductionRates(){
 if(!validForm('deductionMasterForm'))return;
 const workRate=Number(value('masterWorkRate')||0),laborRate=Number(value('masterLaborRate')||0),borderRate=Number(value('masterBorderRate')||0);
 if([workRate,laborRate,borderRate].some(v=>!Number.isFinite(v)||v<0))return toast('နှုန်းထားများကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။',true);
 const before={...(state.masters.purchaseDeductions||{})};state.masters.purchaseDeductions={workRate,laborRate,borderRate};masterLog('purchaseDeductions','purchaseDeductions',before,state.masters.purchaseDeductions);save();render();toast('အဝယ်နုတ်ငွေ နှုန်းထားများ သိမ်းပြီးပါပြီ။');
}
accountField=function(id,selected='cash',label='ငွေသိမ်းရာ / ပေးချေမှု'){
 return selectField(label,id,state.masters.accounts.filter(a=>a.active&&a.type!=='home'&&canViewAccount68(a)).map(a=>[a.id,a.name]),selected);
};
function patchCashViews(){
 if(!state.masters)return;
 if(page==='cash'){
 const strip=document.querySelector('.v2-cash-strip');if(strip){const list=state.masters.accounts.filter(a=>a.active&&canViewAccount68(a));strip.classList.add('v3-cash-strip');strip.innerHTML=list.map(a=>`<div><span class="label">${E(a.name)}</span><strong>${M(bal(a.id))}</strong><small>ကျပ်</small></div>`).join('');}
 }
 if(page==='owner'){
 const panel=document.querySelector('.v2-owner-grid>section:nth-child(2)');if(panel)panel.innerHTML=`<div class="card-title"><h3>ငွေသိမ်းရာအလိုက်</h3>${I('wallet')}</div>${state.masters.accounts.map(a=>`<div class="v2-balance-row"><span class="label">${E(a.name)}</span><div class="right"><strong>${M(bal(a.id))}</strong><span class="muted">ကျပ်</span></div></div>`).join('')}<div class="v2-finance-total"><span>စုစုပေါင်း</span><div class="right"><strong>${M(state.masters.accounts.reduce((s,a)=>s+bal(a.id),0))}</strong><div class="small muted">ကျပ်</div></div></div>`;
 }
}/* Receiving: measured viss is authoritative; equivalent bag count is read-only. */
startReceipt=function(){
 if(!guardWork())return;
 const p=products(true).find(p=>p.standardViss>0)||products(true)[0];
 if(!p){toast('ကုန်ပစ္စည်းကို အရင်သတ်မှတ်ပါ။',true);beginSetup('products');return;}
 receiptWizard={name:'',type:'trader',product:p.name,productId:p.id,productRevision:p.revision,standardViss:p.standardViss,grade:p.grades[0],bags:'',qty:'',actualBags:'',source:'scale'};
 receiptIntro();
};
receiptIntro=function(){
 const w=receiptWizard;
 openModal('ဘယ်သူ ကုန်လာချသလဲ။','အမည်ကို အရင်မှတ်မယ်။',
 `${steps(0,['ကုန်လာချသူ','ကုန်နှင့်အလေးချိန်'])}<form id="receiptIntroForm" onsubmit="event.preventDefault();receiptIntroNext()">
 <label>ကုန်လာချသူ</label><div class="v2-chips" role="group" aria-label="ကုန်လာချသူအမျိုးအစား"><span class="v2-chip selected">ကုန်သည်</span></div>
 ${field('အမည်','introName',{value:w.name,required:true,placeholder:'အမည် ရွေးပါ သို့မဟုတ် ရိုက်ထည့်ပါ',extra:'list="supplierNames" maxlength="80" onchange="matchSupplierType()"'})}
 <datalist id="supplierNames">${partners('supplier').map(p=>`<option value="${E(p.name)}"></option>`).join('')}</datalist></form>`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ဆက်မယ်','receiptIntroNext()','primary','arrow','id="receiptIntroNext"'));
};
function matchSupplierType(){
 const p=partners('supplier').find(p=>p.name===value('introName'));
 if(p&&p.type!==receiptWizard.type){receiptWizard.name=p.name;receiptWizard.type=p.type;receiptWizard.source=p.type==='farmer'?'scale':'declared';receiptIntro();}
}
function captureCargo(){
 if(!document.getElementById('newQty'))return;
 receiptWizard.qty=value('newQty');receiptWizard.actualBags=value('newActualBags');receiptWizard.source=value('newSource');
}
receiptCargo=function(){
 const w=receiptWizard,p=productBy(w.productId);
 if(!p)return error('ကုန်သတ်မှတ်ချက် မတွေ့ပါ။');
 openModal('ဘာကုန်၊ ဘယ်လောက် လာချသလဲ။',`${E(w.name)} · ${w.type==='farmer'?'ကုန်သည်':'ကုန်သည်'}`,
 `${steps(1,['ကုန်လာချသူ','ကုန်နှင့်အလေးချိန်'])}<form id="newReceiptForm" onsubmit="event.preventDefault();saveNewReceipt(false)">
 <input type="hidden" id="newName" value="${E(w.name)}"><input type="hidden" id="newType" value="${w.type}"><input type="hidden" id="newProduct" value="${E(w.product)}"><input type="hidden" id="newGrade" value="${E(w.grade)}">
 <label>ကုန်အမျိုးအစား</label><div class="v2-chips" id="productChips" role="group" aria-label="ကုန်အမျိုးအစား">${products(true).map(x=>`<button type="button" class="v2-chip ${w.productId===x.id?'selected':''}" aria-pressed="${w.productId===x.id}" onclick="selectReceiptProduct('${x.id}')">${E(x.name)}</button>`).join('')}</div>
 <label>အရည်အသွေး</label><div class="v2-chips grade" id="gradeChips" role="group" aria-label="အရည်အသွေး">${p.grades.map((g,i)=>`<button type="button" class="v2-chip grade-chip ${w.grade===g?'selected':''}" aria-pressed="${w.grade===g}" onclick="selectReceiptGrade(${i})">${E(g)}</button>`).join('')}</div>
 <div class="v3-rate-hint" id="receiptStandardHint">${I('scale')}<span>${w.standardViss?`၁ အိတ် = <strong>${vissText37(w.standardViss)} ပိဿာ</strong>`:'တစ်အိတ် စံပိဿာ မသတ်မှတ်ရသေးပါ။'}</span>${!w.standardViss?`<button type="button" class="btn-link" onclick="setupFromReceipt()">သတ်မှတ်မယ်</button>`:''}</div>
 <div class="v3-weight-input">${field('စုစုပေါင်း အလေးချိန်','newQty',{value:w.qty,required:true,suffix:'ပိဿာ',placeholder:'ဥပမာ 250',extra:'inputmode="decimal" autocomplete="off" oninput="updateReceiptBags()" aria-describedby="receiptCalculation"'})}</div>
 <div id="receiptCalculation" class="v3-auto-result" role="status" aria-live="polite"><div class="v3-auto-top"><span>${I('check')}အလိုအလျောက် တွက်ထားသောအိတ်</span><span class="v3-auto-tag">ပြန်ရိုက်ရန် မလိုပါ</span></div><div class="v3-auto-number"><input id="newBags" readonly tabindex="-1" aria-label="အလိုအလျောက်တွက်ထားသော အိတ်အရေအတွက်" value="" placeholder="—"><span>အိတ်</span></div><div id="receiptBagDetail" class="v3-auto-detail"></div></div>
 ${w.type==='farmer'?'<input type="hidden" id="newSource" value="scale"><div class="v2-inline-info mt">'+I('scale')+'ကတ္တားဖြင့် ချိန်ထားသောအလေးချိန်</div>':selectField('အလေးချိန်ရရှိပုံ','newSource',[['declared','ကုန်သည်ပေးလာသော အလေးချိန်'],['reweighed','ပြန်ချိန်ထားသော အလေးချိန်']],w.source)}
 <details class="details mt"><summary>တကယ်ရှိအိတ် မှတ်မယ် <span class="muted">(လိုအပ်မှ)</span></summary><div class="mt">${field('တကယ်ရေတွက်ထားသော အိတ်','newActualBags',{value:w.actualBags,type:'number',min:1,suffix:'အိတ်',placeholder:'ရေတွက်ထားမှ ထည့်ပါ',help:'မြေပြင်စစ်ခြင်းနှင့် ကိုင်ခတွက်ရာမှာ သုံးမယ်။ စံပိဿာမှတွက်ထားသောအိတ်ကို မပြောင်းပါ။'})}</div></details>
 </form>`,
 btn('နောက်ပြန်','receiptCargoBack()','secondary','back')+btn('အကြမ်း သိမ်းမယ်','saveNewReceipt(false)','primary','check','id="saveReceiptNext"'));
 updateReceiptBags();
}
function selectReceiptProduct(id){
 captureCargo();const p=productBy(id);Object.assign(receiptWizard,{productId:p.id,product:p.name,standardViss:p.standardViss,productRevision:p.revision,grade:p.grades.includes(receiptWizard.grade)?receiptWizard.grade:p.grades[0]});receiptCargo();
}
function selectReceiptGrade(index){
 const p=productBy(receiptWizard.productId);receiptWizard.grade=p.grades[index];document.getElementById('newGrade').value=receiptWizard.grade;
 document.querySelectorAll('#gradeChips button').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});
}
function setupFromReceipt(){captureCargo();openProductEdit(receiptWizard.productId,'receipt');}
function updateReceiptBags(){
 const w=receiptWizard,qty=parseDecimal(value('newQty')),c=bagCalc(qty,w.standardViss),input=document.getElementById('newBags'),detail=document.getElementById('receiptBagDetail');
 if(!input||!detail)return;
 document.getElementById('saveReceiptNext').disabled=!c;
 if(!c){input.value='';detail.innerHTML=!w.standardViss?'စံပိဿာ သတ်မှတ်ပြီးမှ တွက်နိုင်မယ်။':value('newQty')?'သုညထက်ကြီးသော ပိဿာကို ထည့်ပါ။ ဒဿမ ၃ လုံးအထိ ရသည်။':'အလေးချိန်ထည့်တာနဲ့ ဒီနေရာမှာ တွက်ပေးမယ်။';return;}
 input.value=bagNumber(c.bags);input.dataset.exact=String(c.bags);
 const rational=(Math.round(c.bags*1000000)/1000000!==c.bags);
 detail.innerHTML=c.remainder?`<strong>${bagDisplay(c)}</strong><span>${vissText37(qty)} ÷ ${vissText37(w.standardViss)}${rational?' · ဒဿမဖော်ပြမှု အနီးစပ်ဆုံး':''} · အိတ်ပြည့်တင် မဝိုင်းထားပါ။</span>`:`${vissText37(qty)} ပိဿာ ÷ ${vissText37(w.standardViss)} ပိဿာ = ${N(c.whole)} အိတ်`;
}
receiptCargoBack=function(){captureCargo();receiptIntro();};
saveNewReceipt=function(next){
 if(!guardWork()||!validForm('newReceiptForm'))return;
 const w=receiptWizard,p=productBy(w.productId),qty=parseDecimal(value('newQty')),c=bagCalc(qty,w.standardViss),actualText=value('newActualBags'),actual=actualText===''?null:Number(actualText);
 if(!p||!p.active)return error('အသုံးပြုနိုင်သော ကုန်ပစ္စည်းကို ရွေးပါ။');
 if(!c)return error('စံပိဿာနှင့် အလေးချိန်ကို မှန်ကန်စွာ ထည့်ပါ။');
 if(!w.name||!p.grades.includes(w.grade))return error('အမည်နှင့် အရည်အသွေးကို ပြန်စစ်ပါ။');
 if(actual!==null&&(!Number.isInteger(actual)||actual<=0))return error('တကယ်ရှိအိတ်ကို အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
 const id=uid('R'),snapshot={productId:p.id,productRevision:w.productRevision,standardViss:w.standardViss,wholeBags:c.whole,remainderViss:c.remainder,method:'weight-divided-by-standard'};
 const r={id,no:'အလ-'+String(state.counter).padStart(3,'0'),date:today(),name:w.name,type:w.type,product:w.product,productId:p.id,grade:w.grade,bags:c.bags,qty:c.qty,actualBags:actual,bagCalculation:snapshot,source:value('newSource'),car:'',status:'draft',price:null,advance:0,wage:0,weigh:0,paid:0,note:''};
 state.receipts.unshift(r);state.lots.push({id:uid('L'),product:r.product,productId:p.id,grade:r.grade,qty:r.qty,bags:r.bags,actualBags:actual,bagCalculation:{...snapshot},owner:'supplier',name:r.name,cost:0,receiptId:id});
 ensurePartner(r.name,'supplier',r.type);move(r.product,r.grade,r.qty,r.bags,'in',r.no);activity(r.name+' ထံမှ '+r.product+' '+vissText37(r.qty)+' ပိဿာ လက်ခံခဲ့သည်။');
 save();render();
 openModal('ကုန်လက်ခံပြီးပါပြီ။','အလေးချိန်နှင့် တွက်ချက်ထားသောအိတ်ကို သိမ်းပြီးပါပြီ။',
 `<div class="v2-success"><div class="icon-box">${I('check')}</div><h3>${E(r.name)}</h3><p>${E(r.product)} · အဆင့် ${E(r.grade)} · ${vissText37(r.qty)} ပိဿာ</p><div class="v3-success-bags"><strong>${recordBagInfo(r)}</strong><small>၁ အိတ် = ${vissText37(snapshot.standardViss)} ပိဿာဖြင့် သိမ်းထားသည်။</small></div><p class="field-help">ကားနံပါတ်၊ ကြိုငွေနှင့် ဈေးကို နောက်မှလည်း ဆက်ဖြည့်နိုင်ပါတယ်။</p></div>`,
 btn('ပြီးပါပြီ','closeModal()','secondary')+btn('အချောဆက်ဖြည့်မယ်',`openReceiptDetailForm('${id}')`,'primary','arrow'));
};
rSummary=function(r){
 return `<div class="v2-person-summary"><div><strong>${E(r.name)}</strong><small>${r.type==='farmer'?'ကုန်သည်':'ကုန်သည်'}${r.car?' · '+E(r.car):''}</small></div><div class="right"><strong>${E(r.product)} · ${E(r.grade)}</strong><small>${vissText37(r.qty)} ပိဿာ · ${recordBagInfo(r)}</small>${r.bagCalculation?`<small>၁ အိတ် = ${vissText37(r.bagCalculation.standardViss)} ပိဿာ</small>`:''}</div></div>`;
};
renderReceiptRows=function(){
 v2ReceiptRows();
 const rendered=Array.from(document.querySelectorAll('#receiptRows .v2-record'));
 rendered.forEach(el=>{
  const nameBtn=el.querySelector('.name-btn'),id=nameBtn?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1],r=state.receipts.find(r=>r.id===id);
  if(r?.bagCalculation){const sub=el.querySelector('.record-weight .record-sub');if(sub)sub.innerHTML=recordBagInfo(r);}
 });
};
openPurchaseSettlement=function(){
 v2OpenPurchase();const r=state.receipts.find(r=>r.id===wizard.id),input=document.getElementById('handlingRate');
 if(input)input.value=state.masters.handling.rate??'';
 const times=document.getElementById('handlingTimes');
 if(times){const row=times.closest('.field-row');row.insertAdjacentHTML('beforebegin',field('တကယ်ကိုင်သည့်အိတ်','handlingActualBags',{type:'number',min:1,value:r.actualBags??(!r.bagCalculation?r.bags:''),suffix:'အိတ်',help:'ကိုင်ခအတွက် တကယ်ကိုင်သောအိတ်ကိုသာ သုံးပါ။'}));}
};
applyHandling=function(){
 const actual=number('handlingActualBags'),times=number('handlingTimes'),rate=number('handlingRate');
 if(!Number.isInteger(actual)||actual<=0)return error('ကိုင်ခတွက်ရန် တကယ်ကိုင်သည့် အိတ်အရေအတွက် ထည့်ပါ။');
 if(!Number.isInteger(times)||times<1||!Number.isFinite(rate)||rate<0)return error('ကိုင်သည့်အကြိမ်နှင့် တစ်ခါကိုင်နှုန်း ထည့်ပါ။');
 const total=Math.round(actual*state.masters.handling.piecesPerBag*times*rate);
 document.getElementById('purchaseWage').value=total;wizard.handlingBasis={actualBags:actual,piecesPerBag:2,times,rate,total};updatePurchaseTotal();
};
commitPurchase=function(){
 const id=wizard?.id,basis=wizard?.handlingBasis?{...wizard.handlingBasis}:null;
 v2CommitPurchase();const r=state.receipts.find(r=>r.id===id);
 if(r?.status==='purchased'&&basis){r.handlingBasis=basis;save();}
};
/* The sale/dispatch bag field follows the saved stock ratio, NOT a newly changed
   product standard. This avoids rewriting existing quantities after setup edits. */
openSaleStep=function(step){
 const w=wizard,groups=ownedGroups(),g=groups.find(x=>x.key===w.key);
 const stepHtml=steps(step,['ရောင်းမည့်ကုန်','ငွေလက်ခံမှု','ကုန်သိမ်းပုံ']);
 if(step===0){
  openModal('ရောင်းဖောင်','ပွဲရုံပိုင်ကုန်ကို ရွေးပြီး အရေအတွက်၊ အလေးချိန်နဲ့ ဈေးကို ဖြည့်ပါ။',
  `${stepHtml}<div class="simple-form">
    <div class="simple-form-head"><div><strong>အဆင့် ၁ · ရောင်းမည့်ကုန်</strong><small>ဝယ်သူ၊ ကုန်အမျိုးအစား၊ ပမာဏနှင့် ရောင်းဈေးကို ရိုးရိုးရှင်းရှင်း စီထားပါတယ်။</small></div><span class="simple-badge">ရောင်းဖောင်</span></div>
    <form id="saleStep1" class="simple-form" onsubmit="event.preventDefault();saleStep1Next()">
      <section class="simple-form-section">
        <div class="simple-form-title"><span class="num">1</span><strong>ဝယ်သူနှင့် ကုန်ရွေးချယ်မှု</strong></div>
        ${field('ဝယ်သူအမည်','saleName',{value:w.name,required:true,placeholder:'ဝယ်သူအမည်',extra:'list="buyerNames" maxlength="80"'})}
        <datalist id="buyerNames">${[...new Set(state.sales.map(s=>s.name))].map(n=>`<option value="${E(n)}"></option>`).join('')}</datalist>
        <div class="mt">${selectField('ကုန်နှင့် အရည်အသွေး','saleGroup',groups.map(x=>[x.key,x.product+' · အဆင့် '+x.grade]),w.key,'onchange="updateSaleAvailability()"')}</div>
        <div id="saleAvailable" class="mt"></div>
      </section>
      <section class="simple-form-section">
        <div class="simple-form-title"><span class="num">2</span><strong>ရောင်းမည့် ပမာဏ</strong></div>
        <div class="field-row">${field('ရောင်းမည့် အလေးချိန်','saleQty',{type:'number',min:.001,step:.001,value:w.qty,required:true,suffix:'ပိဿာ',extra:'oninput="updateSaleTotalPreview()"'})}${field('အိတ်အရေအတွက်','saleBags',{type:'number',min:1,value:w.bags,required:true,suffix:'အိတ်'})}</div>
        <div class="mt">${field('တစ်ပိဿာ ရောင်းဈေး','salePrice',{type:'number',min:1,value:w.price,required:true,suffix:'ကျပ်',extra:'oninput="updateSaleTotalPreview()"'})}</div>
        <div id="saleTotalPreview"></div>
      </section>
    </form>
  </div>`,
  btn('ပိတ်မယ်','closeModal()','secondary')+btn('ဆက်မယ်','saleStep1Next()','primary','arrow'));
  updateSaleAvailability(false);
 }else if(step===1){
  const total=Math.round(w.qty*w.price);if(w.paid===null)w.paid=total;
  openModal('ရောင်းဖောင်',`${E(w.name)} · ငွေလက်ခံမှု အချက်အလက်`,
  `${stepHtml}<div class="simple-form">
    <div class="simple-form-head"><div><strong>အဆင့် ၂ · ငွေလက်ခံမှု</strong><small>ရောင်းတန်ဖိုး၊ လက်ခံပြီးငွေနှင့် ကျန်ငွေကို အလွယ်တကူ စစ်နိုင်အောင် ပြထားပါတယ်။</small></div><span class="simple-badge">${cashText(total)}</span></div>
    <div class="simple-summary two"><div class="simple-summary-item"><span class="label">ရောင်းတန်ဖိုး</span><strong>${cashText(total)}</strong><small>${E(w.key.split('|')[0])} · ${vissText37(w.qty)} ပိဿာ</small></div><div class="simple-summary-item"><span class="label">ရွေးထားသော ဝယ်သူ</span><strong>${E(w.name)}</strong><small>ငွေလက်ခံမှု ဆက်ဖြည့်ပါ</small></div></div>
    <form id="saleStep2" class="simple-form" onsubmit="event.preventDefault();saleStep2Next()">
      <section class="simple-form-section">
        <div class="simple-form-title"><span class="num">1</span><strong>လက်ခံငွေ ဖြည့်မယ်</strong></div>
        ${accountField('saleAccount',w.account,'ဘယ်အကောင့်နဲ့ လက်ခံမလဲ')}
        <div class="mt">${field('ယခု လက်ခံရရှိငွေ','salePaid',{type:'number',min:0,max:total,value:w.paid,required:true,suffix:'ကျပ်',extra:'oninput="updateSaleDuePreview()"'})}</div>
        <div id="saleDuePreview"></div>
      </section>
    </form>
    ${detailHelp('ငွေမရသေးရင် ဘယ်လိုမှတ်မလဲ။','ငွေမရသေးလျှင် သုည၊ တစ်စိတ်တစ်ပိုင်းရလျှင် ရသည့်ငွေကို ထည့်ပါ။ ဤအကြွေးငွေရှင်းပုံသည် နမူနာဖြစ်ပြီး အကြွေးခွင့်ပြုချက်စည်းမျဉ်းကို အတည်ပြုရန်ကျန်သည်။')}
  </div>`,
  btn('နောက်ပြန်','captureSalePaymentAndBack()','secondary','back')+btn('ဆက်မယ်','saleStep2Next()','primary','arrow'));
  updateSaleDuePreview();
 }else{
  openModal('ရောင်းဖောင်','ကုန်ကို အခုယူသွားမလား၊ ပွဲရုံမှာ ဆက်ထားမလား ရွေးပါ။',
  `${stepHtml}<div class="simple-form">
    <div class="simple-form-head"><div><strong>အဆင့် ၃ · ကုန်သိမ်းပုံ</strong><small>ကုန်ထုတ်ပေးမလား၊ ပွဲရုံမှာ ထားမလားကို နောက်ဆုံးအဆင့်မှာ ရွေးပါ။</small></div><span class="simple-badge">နောက်ဆုံးအတည်ပြု</span></div>
    <section class="simple-form-section">
      <div class="simple-form-title"><span class="num">1</span><strong>ကုန်ထုတ်ပုံ ရွေးချယ်ပါ</strong></div>
      <div class="v2-delivery-choice">
        <button type="button" class="choice ${w.mode==='direct'?'selected':''}" aria-pressed="${w.mode==='direct'}" onclick="chooseDelivery('direct')"><span class="radio-dot"></span><div><strong>အခု ယူသွားမယ်</strong><small>ပစ္စည်းသိမ်းတင် · ကားပေါ်တင်ပြီး ထုတ်ပေးမယ်။</small></div></button>
        <button type="button" class="choice ${w.mode==='hold'?'selected':''}" aria-pressed="${w.mode==='hold'}" onclick="chooseDelivery('hold')"><span class="radio-dot"></span><div><strong>ပွဲရုံမှာ ထားမယ်</strong><small>သိမ်းထပ်ထား · ဝယ်သူပိုင်ကုန်အဖြစ် ခွဲထားမယ်။</small></div></button>
      </div>
      ${w.mode==='direct'?`<div class="mt"><form id="deliveryForm" class="simple-form" onsubmit="event.preventDefault();commitSale()"><div class="field-row">${field('လာယူသူအမည်','saleCollector',{value:w.collector,required:true,placeholder:'ပစ္စည်းလက်ခံယူသူ',extra:'maxlength="80"'})}${field('ကားနံပါတ်','saleCar',{value:w.car,placeholder:'ကားနံပါတ်ရှိပါက ထည့်ပါ',extra:'maxlength="40"'})}</div></form></div>`:`<div class="v2-inline-info mt">${I('lock')}ဝယ်သူပိုင်ဖြစ်သွားလို့ အခြားသူကို ထပ်မရောင်းရပါ။</div>`}
    </section>
    <section class="simple-form-section">
      <div class="simple-form-title"><span class="num">2</span><strong>အနှစ်ချုပ်</strong></div>
      <div class="summary-box"><div class="summary-line"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(w.qty*w.price)}</strong></div><div class="summary-line"><span>ငွေလက်ခံမည်</span><strong>${cashText(w.paid)}</strong></div><div class="summary-line total"><span>ရရန်ကျန်မည်</span><strong>${cashText(w.qty*w.price-w.paid)}</strong></div></div>
    </section>
  </div>`,
  btn('နောက်ပြန်','captureDeliveryAndBack()','secondary','back')+btn('အရောင်း သိမ်းမယ်','commitSale()','primary','check','id="commitSaleBtn"'));
 }
};
updateSaleAvailability=function(changePrice=true){v2SaleAvailability(changePrice);updateSaleBagRatio();};
function updateSaleBagRatio(){
 const q=number('saleQty'),g=ownedGroups().find(x=>x.key===value('saleGroup')),b=document.getElementById('saleBags');
 if(!b)return;b.value=g&&q>0?bagNumber(q>=g.owned-0.000001?g.ownedBags:q*g.ownedBags/g.owned):'';
}
saleStep1Next=function(){
 if(!validForm('saleStep1'))return;
 const name=value('saleName'),key=value('saleGroup'),qty=number('saleQty'),price=number('salePrice'),g=ownedGroups().find(x=>x.key===key);
 if(!name||!g||[qty,price].some(n=>!Number.isFinite(n)||n<=0))return error('အမည်၊ အလေးချိန်နှင့် ဈေးနှုန်းကို မှန်ကန်စွာ ဖြည့်ပါ။');
 if(qty>g.owned+0.000001)return error('ပွဲရုံပိုင် လက်ကျန်ထက် ပိုရောင်းလို့ မရပါ။');
 const bags=Math.abs(qty-g.owned)<0.000001?g.ownedBags:qty*g.ownedBags/g.owned;
 const oldTotal=Number(wizard.qty)*Number(wizard.price),newTotal=Math.round(qty*price);if(oldTotal!==newTotal)wizard.paid=null;
 Object.assign(wizard,{name,key,qty,bags,price});openSaleStep(1);
};
commitSale=function(){
 const before=state.sales.length;v2CommitSale();
 if(state.sales.length>before){const s=state.sales[0];ensurePartner(s.name,'buyer','buyer');save();}
};
const v2OpenDispatch=openDispatch;
openDispatch=function(id){
 v2OpenDispatch(id);const b=document.getElementById('dispatchBags'),q=document.getElementById('dispatchQty');
 if(b){b.readOnly=true;b.removeAttribute('required');b.step='any';b.min='0';b.closest('.field').querySelector('label').textContent='စာရင်းအချိုးအရ အိတ်';}
 if(q)q.setAttribute('oninput',`updateDispatchBags('${id}')`);updateDispatchBags(id);
};
function dispatchBagQty(s,qty){const q=saleRemaining(s),b=s.bags-s.deliveredBags;return Math.abs(qty-q)<0.000001?b:qty*b/q;}
function updateDispatchBags(id){const s=state.sales.find(s=>s.id===id),q=number('dispatchQty'),el=document.getElementById('dispatchBags');if(el)el.value=q>0?bagNumber(dispatchBagQty(s,q)):'';}
saveDispatch=function(id){
 if(!guardWork()||!validForm('dispatchForm'))return;
 const s=state.sales.find(x=>x.id===id),qty=number('dispatchQty'),collector=value('dispatchCollector'),car=value('dispatchCar'),remain=saleRemaining(s);
 if(!collector||!Number.isFinite(qty)||qty<=0||qty>remain+0.000001)return error('လာယူသူအမည်နှင့် ထုတ်ပေးမည့်အလေးချိန်ကို ပြန်စစ်ပါ။');
 const bags=dispatchBagQty(s,qty),lot=state.lots.find(l=>l.saleId===s.id&&l.owner==='customer');
 if(!lot)return error('ဆက်စပ်ဝယ်သူပိုင်ကုန် မတွေ့ပါ။');
 lot.qty=Math.max(0,lot.qty-qty);lot.bags=Math.max(0,lot.bags-bags);s.deliveredQty+=qty;s.deliveredBags+=bags;
 s.dispatches.push({date:today(),qty,bags,collector,car});move(s.product,s.grade,qty,bags,'out',s.no);activity(s.name+' ၏ ကုန် '+vissText37(qty)+' ပိဿာ ထုတ်ပေးခဲ့သည်။');save();closeModal();render();toast('ကုန်ထုတ်မှတ်တမ်း သိမ်းပြီးပါပြီ။ အရောင်းအသစ် ထပ်မတင်ပါ။');
};
pricesPage=function(){
 return heading('','ယနေ့ ကုန်ပေါက်ဈေး','စံပိဿာနှင့် မတူပါ။ ဈေးသည် နေ့စဉ်ပြောင်းနိုင်သည်။')+
 `<form id="priceForm" onsubmit="savePrices(event)"><div class="grid cols-3">${products(true).map(p=>`<section class="card market-card"><h2>${E(p.name)}</h2><p class="small muted">တစ်ပိဿာဈေး · ကျပ်</p>${p.grades.map((g,i)=>`<div class="market-row"><label for="price_${p.id}_${i}">${E(g)}</label><input id="price_${p.id}_${i}" type="number" min="1" step="1" placeholder="မသိသေး" value="${state.prices[p.name+'|'+g]||''}"></div>`).join('')}</section>`).join('')}</div><div class="row between wrap mt">${btn('အဝယ်သို့ ပြန်မယ်',"navigate('receipts')",'secondary','back')}<button type="submit" class="btn btn-primary">${I('check')}ပေါက်ဈေး သိမ်းမယ်</button></div></form>`;
};
savePrices=function(event){
 event.preventDefault();if(!guardWork()||!validForm('priceForm'))return;
 const vals={...state.prices};let count=0,bad=false;
 products(true).forEach(p=>p.grades.forEach((g,i)=>{const raw=value(`price_${p.id}_${i}`),n=Number(raw),key=p.name+'|'+g;if(raw===''){delete vals[key];return;}if(!Number.isInteger(n)||n<=0){bad=true;return;}vals[key]=n;(p.aliases||[]).forEach(a=>vals[a+'|'+g]=n);count++;}));
 if(bad||!count){toast('မှန်ကန်သော ဈေးနှုန်း အနည်းဆုံးတစ်ခု ထည့်ပါ။',true);return;}state.prices=vals;state.priceDate=today();activity('ယနေ့ပေါက်ဈေး '+count+' မျိုး သိမ်းခဲ့သည်။');save();render();toast('ပေါက်ဈေး သိမ်းပြီးပါပြီ။');
};
printReceipt=function(id){
 const r=state.receipts.find(x=>x.id===id),p=r.status==='purchased';
 printDocument(p?'အဝယ်ဘောက်ချာ':'ကုန်လက်ခံ / အပ်ကုန်မှတ်တမ်း',r.purchaseNo||r.no,
 `<p>ကုန်လာချသူ — <strong>${E(r.name)}</strong></p><p>ကားနံပါတ် — ${E(r.car)||'—'}</p><p>လက်ခံသည့်ရက် — ${shortDate(r.date)}${p?' · ဝယ်သည့်ရက် — '+shortDate(r.purchaseDate):''}</p><table style="margin-top:20px"><thead><tr><th>ကုန် / အဆင့်</th><th>အလေးချိန်</th><th>အိတ်ဖွဲ့</th><th>တစ်ပိဿာဈေး</th><th>ကုန်ဖိုး</th></tr></thead><tbody><tr><td>${E(r.product)} / ${E(r.grade)}</td><td>${vissText37(r.qty)} ပိဿာ</td><td>${recordBagInfo(r)}</td><td>${r.price?M(r.price):'မသတ်မှတ်ရသေး'}</td><td>${r.price?M(gross(r)):'—'}</td></tr></tbody></table>${r.bagCalculation?`<p>သိမ်းထားသောစံ — ၁ အိတ် = ${vissText37(r.bagCalculation.standardViss)} ပိဿာ။</p>`:''}<div style="margin-top:25px"><p>ကြိုရှင်းငွေ — ${cashText(r.advance)}</p>${p?`<p>လုပ်သားခ / ချိန်ခနုတ်ငွေ — ${cashText(r.wage+r.weigh)}</p><p>ရှင်းပေးပြီးငွေ — ${cashText(r.paid)}</p><h3>ရှင်းရန်ကျန် — ${cashText(due(r))}</h3>`:'<p>အပ်ကုန်ဖြစ်ပြီး ပွဲရုံပိုင် မဟုတ်သေးပါ။</p>'}</div>`);
};/* Physical sacks and standard-equivalent sacks must never be compared as if equal. */
function actualBagTotal(key){
 const ls=state.lots.filter(l=>l.qty>0&&l.product+'|'+l.grade===key);
 if(ls.some(l=>l.bagCalculation&&l.actualBags==null||!l.bagCalculation&&!Number.isInteger(l.bags)))return null;
 return ls.reduce((s,l)=>s+(l.actualBags??l.bags),0);
}
updateGroundPreview=function(){
 const key=value('groundGroup'),g=stockGroups(state.lots).find(x=>x.key===key);if(!g)return;
 const expected=actualBagTotal(key);
 document.getElementById('groundExpected').innerHTML=`<div class="summary-box"><div class="summary-line"><span>စာရင်းအရ အလေးချိန်</span><strong>${vissText37(g.total)} ပိဿာ</strong></div><div class="summary-line"><span>တကယ်ရှိအိတ် မှတ်တမ်း</span><strong>${expected===null?'မပြည့်စုံသေး':N(expected)+' အိတ်'}</strong></div><p class="field-help">ပွဲရုံပိုင်၊ အပ်ကုန်နှင့် ဝယ်သူပိုင်ကုန် အားလုံးပါဝင်သည်။ စံပိဿာဖြင့်တွက်ထားသောအိတ်ကို တကယ့်အိတ်အဖြစ် မနှိုင်းယှဉ်ပါ။</p></div>`;
 const q=number('groundQty'),b=number('groundBags');
 document.getElementById('groundDiff').innerHTML=Number.isFinite(q)&&Number.isFinite(b)?`<div class="result-banner ${Math.abs(q-g.total)>0.0001||expected!==null&&b!==expected?'mismatch':''}">အလေးချိန် ကွာဟချက် — ${vissText37(q-g.total)} ပိဿာ${expected===null?'<div class="small">အိတ်ကွာဟချက်ကို မတွက်ထားပါ။</div>':`<div class="small">အိတ်ကွာဟချက် — ${N(b-expected)} အိတ်</div>`}</div>`:'';
};
saveGround=function(){
 if(!guardWork()||!validForm('groundForm'))return;
 const key=value('groundGroup'),g=stockGroups(state.lots).find(x=>x.key===key),qty=number('groundQty'),bags=number('groundBags'),n=value('groundNote'),expectedBags=actualBagTotal(key),difference=qty-g.total,bagDifference=expectedBags===null?null:bags-expectedBags;
 if(!Number.isFinite(qty)||qty<0||!Number.isInteger(bags)||bags<0)return error('အလေးချိန်နှင့် တကယ်ရှိအိတ်ကို မှန်ကန်စွာ ထည့်ပါ။');
 if((Math.abs(difference)>0.0001||bagDifference!==null&&bagDifference!==0)&&!n)return error('မြေပြင်ကွာဟချက်အတွက် မှတ်ချက် ထည့်ပါ။');
 state.grounds[key]={date:today(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),qty,bags,expectedQty:g.total,expectedBags,difference,bagDifference,note:n};
 activity(g.product+' မြေပြင်စစ်ချက် သိမ်းခဲ့သည်။');save();closeModal();invTab='ground';page='inventory';render();toast('မြေပြင်စစ်ချက် သိမ်းပြီးပါပြီ။ စာရင်းကုန်ကို မပြင်ထားပါ။');
};
const v2InventoryBody=renderInventoryBody;
renderInventoryBody=function(){
 if(invTab!=='ground'){
  v2InventoryBody();
  if(invTab==='overview')document.getElementById('inventoryBody').insertAdjacentHTML('beforeend',`<details class="details mt"><summary>အိတ်အရေအတွက် ဖတ်ရန်</summary><p>အသစ်လက်ခံသောကုန်တွင် သတ်မှတ်စံပိဿာဖြင့်တွက်ထားသည့် အိတ်အချိုးကို ပြသည်။ အဟောင်းနမူနာများတွင် ယခင်မှတ်ထားသည့်အိတ်ကို ထိန်းထားသည်။ မြေပြင်တကယ်ရှိအိတ်နှင့် ကိုင်ခကို သီးခြားရေတွက်ပါ။</p></details>`);
  return;
 }
 const gs=Object.entries(state.grounds);
 document.getElementById('inventoryBody').innerHTML=gs.length?`<div class="table-wrap"><table><thead><tr><th>ကုန် / အဆင့်</th><th>စာရင်းအလေးချိန်</th><th>မြေပြင်အလေးချိန်</th><th>ပိဿာကွာဟချက်</th><th>အိတ်ကွာဟချက်</th><th>မှတ်ချက်</th></tr></thead><tbody>${gs.map(([k,g])=>`<tr><td><strong>${E(k.split('|').join(' · '))}</strong><div class="sub">${shortDate(g.date)}</div></td><td>${vissText37(g.expectedQty)} ပိဿာ</td><td>${vissText37(g.qty)} ပိဿာ<div class="sub">တကယ်ရေတွက် ${N(g.bags)} အိတ်</div></td><td>${N(g.difference)}</td><td>${g.bagDifference===null?'မနှိုင်းယှဉ်ထား':N(g.bagDifference)+' အိတ်'}</td><td>${E(g.note)||'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('ယနေ့ မြေပြင်စစ်ချက် မမှတ်ရသေးပါ။','scale');
};
const v2NextDay=startNextDay;
startNextDay=function(next){
 if(!state.closed)return;
 const extra=Object.fromEntries(state.masters.accounts.filter(a=>!['cash','bank','home'].includes(a.id)).map(a=>[a.id,bal(a.id)]));
 v2NextDay(next);Object.assign(state.bases,extra);save();render();
};
/* Existing product names used as legacy keys are protected; changing standards
   and grade choices does not mutate past transactions. */
const v3OpenProductEdit=openProductEdit;
openProductEdit=function(id='',returnTo=null){
 v3OpenProductEdit(id,returnTo);const p=productBy(id);
 if(p&&state.lots.some(l=>l.product===p.name)){
  const el=document.getElementById('masterProductName');el.readOnly=true;
  el.closest('.field').insertAdjacentHTML('beforeend','<p class="field-help">စာရင်းတွင် အသုံးပြုပြီးသော ကုန်အမည်ဖြစ်သည်။ စံပိဿာနှင့် အရည်အသွေးကို ပြင်နိုင်ပါတယ်။</p>');
 }
};
const v3SaveProductMaster=saveProductMaster;
saveProductMaster=function(id){
 const p=productBy(id);
 if(p&&state.lots.some(l=>l.product===p.name)&&cleanText(value('masterProductName'))!==p.name)return error('အသုံးပြုပြီးသောကုန်အမည်ကို မပြောင်းပါ။');
 return v3SaveProductMaster(id);
};
openHelp=function(){
 openModal('နမူနာကို ဘယ်လိုစမ်းမလဲ။','Version 3 · Design မပြောင်းဘဲ အခြေခံသတ်မှတ်ချက်များ ထပ်ထည့်ထားသည်။',
 `<div class="stack"><div><h3>၁။ ကုန်ပစ္စည်း သတ်မှတ်ပါ။</h3><p>ညာအပေါ်က “သတ်မှတ်ချက်” → “ကုန်ပစ္စည်းများ” မှာ တစ်အိတ် စံပိဿာ ဖြည့်ပါ။ ပြောင်းကို ၂၅ ပိဿာဖြင့် နမူနာထည့်ထားသည်။ နှမ်းနှင့် ဂျုံကို မခန့်မှန်းဘဲ အလွတ်ထားသည်။</p></div><div><h3>၂။ အဝယ်မှာ အလေးချိန်ထည့်ပါ။</h3><p>အဖွင့်ငွေ 1,250,000 ကျပ် စစ်ပြီး “ကုန်လက်ခံမယ်” ကို ရွေးပါ။ ပြောင်း 250 ပိဿာ ထည့်လျှင် 10 အိတ်၊ 260 ပိဿာ ထည့်လျှင် 10 အိတ်နှင့် 10 ပိဿာ အလိုအလျောက်ပြမည်။</p></div><div><h3>၃။ သိမ်းပြီး စာရင်းဆက်လုပ်ပါ။</h3><p>သိမ်းထားသောစံပိဿာကို အကြမ်း၊ အချောနှင့် ဘောက်ချာမှာ ဆက်သုံးမည်။ စံပိဿာကို နောက်မှပြင်လည်း ယခင်စာရင်း မပြောင်းပါ။</p></div></div>
 <details class="details mt"><summary>တွက်ချက်မှု နမူနာသတ်မှတ်ချက်များ</summary><p>အိတ်ပြည့်မဝိုင်းဘဲ အိတ်ပြည့်နှင့် ကျန်ပိဿာကို ခွဲပြသည်။ ပိဿာကို ဒဿမ ၃ လုံးအထိ လက်ခံပြီး အိတ်ဒဿမကို ၆ လုံးအထိ ပြသည်။ သိမ်းရာတွင် မူလအလေးချိန်နှင့် စံပိဿာကို ထိန်းထားသည်။ အိတ်ပြည့်ဝိုင်းနည်းနှင့် လက်တွေ့ထုပ်ပိုးနည်းကို အတည်ပြုရန်ကျန်သည်။</p><p>အရောင်းနှင့် နောက်မှကုန်ထုတ်ရာတွင် လက်ကျန်စာရင်း၏ အိတ်/ပိဿာအချိုးကို သုံးသည်။ အသစ်ပြင်ထားသောစံဖြင့် အဟောင်းကုန်ကို ပြန်မတွက်ပါ။</p><p>တကယ်ရှိအိတ်ကို သီးခြားမှတ်နိုင်သည်။ ကိုင်ခတွက်လျှင် တကယ်ကိုင်အိတ် × ၂ ပိုင်း × ကိုင်အကြိမ် × နှုန်းဖြင့် စမ်းတွက်ပေးသည်။ ချိန်ခနှင့် အခြားနုတ်ငွေစည်းမျဉ်းများကို အတည်ပြုရန်ကျန်သည်။</p></details>
 <details class="details mt"><summary>ဤနမူနာ၏ အကန့်အသတ်များ</summary><p>သတ်မှတ်ချက်များကို စာရေးမနှင့် ပိုင်ရှင်မြင်ကွင်းနှစ်ခုလုံးတွင် စမ်းပြင်နိုင်သည်။ တကယ့်ပြင်ဆင်ခွင့်ကို အတည်ပြုရန်ကျန်သည်။ ဆာဗာ၊ ဒေတာဘေ့စ်၊ လုံခြုံရေးနှင့် တကယ့်ခွင့်ပြုချက်ထိန်းချုပ်မှု မပါသေးပါ။</p><p>V2 နှင့် သီးခြားနမူနာဒေတာကို ဤဘရောက်ဇာထဲတွင် သိမ်းသည်။ V2 ဖိုင်နှင့် စမ်းထားသည့်ဒေတာကို မပြင်ပါ။ ဘရောက်ဇာဒေတာဖျက်လျှင် ဤဖိုင်၏စမ်းထားသည့်ဒေတာ ပျောက်နိုင်သည်။</p><p>အမြတ်၊ တစ်စိတ်တစ်ပိုင်းငွေရှင်းခြင်း၊ ငွေသိမ်းရာနှင့် အကြွေးစည်းမျဉ်းများမှာ အတည်ပြုရန်ကျန်သော နမူနာများဖြစ်သည်။ အပ်ကုန်တစ်စိတ်တစ်ပိုင်းဝယ်ယူခြင်းနှင့် အပ်ကုန်ပြန်ယူခြင်း မထည့်ထားသေးပါ။</p></details>`,
 btn('နမူနာ ပြန်စမယ်','openReset()','secondary','reset')+btn('စမ်းကြည့်မယ်','closeModal()','primary','arrow'));
};
seed=function(){const s=v2Seed();s.masters=setupSeed();s.uiVersion=3;return s;};
resetDemo=function(){state=seed();ensureMasters();wizard=null;receiptWizard=null;productReturn=null;invTab='overview';cashTab='movements';setupSection='overview';save();navigate('home');toast('နမူနာဒေတာကို အစပြန်ဖွင့်ထားပါပြီ။');};
ensureMasters();save();render();/* Harden shared labels, and mark merged sale stock as a calculated quantity. */
const checkedAccountMaster=saveAccountMaster;
saveAccountMaster=function(id){if(!safeLabel(cleanText(value('masterAccountName'))))return error('ငွေသိမ်းရာအမည်ကို မှန်ကန်စွာ ထည့်ပါ။');return checkedAccountMaster(id);};
const checkedSaleCommit=commitSale;
commitSale=function(){
 const before=state.sales.length;checkedSaleCommit();
 if(state.sales.length>before){
  const s=state.sales[0];state.lots.filter(l=>l.product===s.product&&l.grade===s.grade&&(l.owner==='owned'||l.saleId===s.id)).forEach(l=>{l.bagBasis='stock-ratio';l.actualBags=null;});save();
 }
};
actualBagTotal=function(key){
 const ls=state.lots.filter(l=>l.qty>0&&l.product+'|'+l.grade===key);
 if(ls.some(l=>(l.bagCalculation||l.bagBasis==='stock-ratio')&&l.actualBags==null||!l.bagCalculation&&!Number.isInteger(l.bags)))return null;
 return ls.reduce((s,l)=>s+(l.actualBags??l.bags),0);
};
