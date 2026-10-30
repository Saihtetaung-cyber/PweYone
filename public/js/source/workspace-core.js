

'use strict';
const STORE_KEY='pwe-yon-version2-clean-start-20261021';
// Clean-start edition uses its own data store and does not import previous test records.

const PRODUCTS=['နှမ်း','ပြောင်း','ဂျုံ'];
const ACCOUNT_NAMES={cash:'ပွဲရုံ ငွေသား',bank:'ဘဏ် / ငွေပေးချေမှုအကောင့်',home:'အိမ် ငွေသိမ်းရာ'};
const icons={
home:'M3 10l9-7 9 7M5 9v12h14V9M9 21v-7h6v7',
grain:'M12 21V3M12 8C7 8 6 5 6 3c4 0 6 2 6 5ZM12 13c-5 0-6-3-6-5 4 0 6 2 6 5ZM12 10c5 0 6-3 6-5-4 0-6 2-6 5ZM12 16c5 0 6-3 6-5-4 0-6 2-6 5Z',
receive:'M4 6h16v15H4ZM4 6l3-3h10l3 3M12 9v8M9 14l3 3 3-3',
sale:'M4 6h16v15H4ZM4 6l3-3h10l3 3M12 17V9M9 12l3-3 3 3',
stock:'M3 8l9-5 9 5v11H3ZM3 8h18M8 19v-7h8v7M3 19v2h18v-2',
wallet:'M4 5h14v4M4 5a2 2 0 0 0 0 4h17v12H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM16 13h5v4h-5Z',
price:'M3 3h8l10 10-8 8L3 11ZM7 7h.01',
arrow:'M5 12h14M14 7l5 5-5 5',
back:'M19 12H5M10 7l-5 5 5 5',
plus:'M12 5v14M5 12h14',
check:'M5 12l4 4L19 6',
clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
truck:'M1 5h13v12H1ZM14 9h4l4 4v4h-8M4 17a2 2 0 1 0 4 0M16 17a2 2 0 1 0 4 0',
info:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6M12 7h.01',
doc:'M5 3h9l5 5v13H5ZM14 3v6h5M8 13h8M8 17h6',
close:'M6 6l12 12M18 6L6 18',
search:'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14ZM15 15l6 6',
eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
moon:'M20.8 13a9 9 0 1 1-9.8-9.8A7 7 0 0 0 20.8 13Z',
users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM22 21v-2a4 4 0 0 0-3-3.8M17 2.2a4 4 0 0 1 0 7.6',
chart:'M4 3v18h17M8 16V9M13 16V5M18 16v-4',
transfer:'M3 7h17M16 3l4 4-4 4M21 17H4M8 13l-4 4 4 4',
scale:'M12 3v18M5 21h14M3 7h18M6 7l-4 8h8L6 7ZM18 7l-4 8h8l-4-8Z',
bank:'M2 9l10-6 10 6H2ZM4 21h16M6 10v8M12 10v8M18 10v8',
print:'M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6ZM17 11h.01',
reset:'M3 11a9 9 0 1 1 2.5 7M3 4v7h7',
help:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
lock:'M5 11h14v10H5ZM8 11V7a4 4 0 0 1 8 0v4',
note:'M4 3h16v18H4ZM8 7h8M8 11h8M8 15h5',
chevron:'M9 5l7 7-7 7',
bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'
};
const I=(n,c='')=>`<svg class="icon ${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[n]||icons.doc}"/></svg>`;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(Number(n)||0);

// Decimal weight policy: 1 ပိဿာ = 100 ကျပ်သား; two digits represent ကျပ်သား.
function vissText37(n){
 const value=Number(n);
 return new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(value)?value:0);
}
function vissBreakdown37(n){
 const numeric=Number(n);
 if(!Number.isFinite(numeric)||numeric<0)return 'မှန်ကန်သော ပိဿာအလေးချိန် ထည့်ပါ။';
 const hundredths=Math.round(numeric*100);
 const whole=Math.floor(hundredths/100), kyattha=hundredths%100;
 return `${whole} ပိဿာ ${String(kyattha).padStart(2,'0')} ကျပ်သား`;
}
function isWeightField37(label,id,opts){
 return (opts.type==='number')&&(opts.suffix==='ပိဿာ'||/ပိဿာ|အလေးချိန်/.test(label)||/^(?:grnQty|newQty|saleQty|dispatchQty|groundQty|adjustQty|packSize_)/.test(id));
}

const M=n=>N(Math.round(Number(n)||0));
const cashText=n=>`${M(n)} ကျပ်`;
/* V68: Account opening balance and owner-controlled staff visibility only. */
function staffAccountVisible68(a){return a?.staffCanView===true||(a?.staffCanView===undefined&&a?.type!=='home');}
function canViewAccount68(account){
 const a=typeof account==='object'?account:state.masters?.accounts?.find(x=>x.id===account)||(!state.masters?{id:account,type:account==='home'?'home':'cash'}:null);
 return !!a&&(state.role==='owner'||staffAccountVisible68(a));
}
function accountValue68(id,amount,format=cashText){return canViewAccount68(id)?format(amount):'ကြည့်ခွင့်မရှိ';}
function accountPermissionField68(id,checked,label='စာရေးမ ကြည့်ခွင့်ရှိ',extra=''){
 return `<label class="account-permission68" for="${E(id)}"><input type="checkbox" id="${E(id)}" ${checked?'checked':''} ${extra}><span>${E(label)}</span></label>`;
}
function setAccountVisibility68(id,checked){
 if(state.role!=='owner')return toast('ပိုင်ရှင်မှသာ ကြည့်ခွင့် ပြင်နိုင်သည်။',true);
 const a=state.masters.accounts.find(x=>x.id===id);if(!a)return;
 const before={...a};a.staffCanView=!!checked;
 masterLog('account',a.id,before,a);save();render();toast('စာရေးမ ကြည့်ခွင့် သိမ်းပြီးပါပြီ။');
}

const pill=(t,c='')=>`<span class="pill ${c}"><span class="dot"></span>${t}</span>`;
const note=(t,c='')=>`<div class="note ${c}">${I('info')}<div>${t}</div></div>`;
const btn=(text,fn,kind='primary',icon='',extra='')=>`<button type="button" class="btn btn-${kind}" onclick="${fn}" ${extra}>${icon?I(icon):''}${text}</button>`;
const smallbtn=(text,fn,kind='soft',icon='')=>`<button type="button" class="btn btn-${kind} btn-sm" onclick="${fn}">${icon?I(icon):''}${text}</button>`;
const empty=(text,icon='doc')=>`<div class="empty"><div class="icon-box">${I(icon)}</div>${text}</div>`;
function seed(){
 const s={version:1,day:'2026-09-17',role:'staff',counter:100,
 opening:{checked:false,expected:1250000,actual:null,difference:0,note:''},
 bases:{cash:1250000,bank:6500000,home:3000000},transactions:[],moves:[],grounds:{},closed:false,closing:null,
 prices:{},priceDate:null,requests:[],expenses:[],days:[],activity:[],
 receipts:[
 {id:'R001',no:'အလ-၀၀၁',date:'2026-09-16',name:'ဦးတင်မောင်',type:'farmer',product:'နှမ်း',grade:'A',bags:12,qty:360,source:'scale',car:'MDY 7A-1234',status:'await',price:null,advance:150000,wage:0,weigh:0,paid:0,note:'ဈေးထွက်ပြီးမှ ရောင်းမည်။'},
 {id:'R002',no:'အလ-၀၀၂',date:'2026-09-16',name:'ဦးလှအောင်',type:'trader',product:'ပြောင်း',grade:'B',bags:20,qty:600,source:'declared',car:'',status:'draft',price:null,advance:0,wage:0,weigh:0,paid:0,note:''},
 {id:'R003',no:'အလ-၀၀၃',date:'2026-09-16',name:'ဒေါ်ခင်စန်း',type:'farmer',product:'ဂျုံ',grade:'A',bags:8,qty:240,source:'scale',car:'MDY 9D-6821',status:'deposit',price:1900,priceDate:'2026-09-16',advance:50000,wage:0,weigh:0,paid:0,note:'ကြိုက်ဈေးရသည့်နေ့မှ ရောင်းမည်။'},
 {id:'R004',no:'အဝ-၀၀၄',date:'2026-09-16',purchaseDate:'2026-09-16',name:'ဦးစိုးမြင့်',type:'trader',product:'ပြောင်း',grade:'B',bags:10,qty:300,source:'declared',car:'YGN 5B-2208',status:'purchased',price:1500,advance:100000,wage:6000,weigh:0,paid:0,note:''}
 ],
 sales:[{id:'S001',no:'အရ-၀၀၁',date:'2026-09-16',name:'ရွှေစပါးကုန်သွယ်ရေး',product:'နှမ်း',grade:'A',bags:10,qty:300,price:8000,total:2400000,cost:2160000,paid:1800000,deliveredQty:0,deliveredBags:0,mode:'hold',dispatches:[]}],
 lots:[
 {id:'L001',product:'နှမ်း',grade:'A',qty:1500,bags:50,owner:'owned',name:'ပွဲရုံပိုင်',cost:7200},
 {id:'L002',product:'ပြောင်း',grade:'B',qty:2400,bags:80,owner:'owned',name:'ပွဲရုံပိုင်',cost:1400},
 {id:'L003',product:'ဂျုံ',grade:'A',qty:900,bags:30,owner:'owned',name:'ပွဲရုံပိုင်',cost:1800},
 {id:'L004',product:'ပြောင်း',grade:'B',qty:300,bags:10,owner:'owned',name:'ပွဲရုံပိုင်',cost:1500,receiptId:'R004'},
 {id:'L005',product:'နှမ်း',grade:'A',qty:360,bags:12,owner:'supplier',name:'ဦးတင်မောင်',cost:0,receiptId:'R001'},
 {id:'L006',product:'ပြောင်း',grade:'B',qty:600,bags:20,owner:'supplier',name:'ဦးလှအောင်',cost:0,receiptId:'R002'},
 {id:'L007',product:'ဂျုံ',grade:'A',qty:240,bags:8,owner:'supplier',name:'ဒေါ်ခင်စန်း',cost:0,receiptId:'R003'},
 {id:'L008',product:'နှမ်း',grade:'A',qty:300,bags:10,owner:'customer',name:'ရွှေစပါးကုန်သွယ်ရေး',cost:7200,saleId:'S001'}
 ]
 };
 s.stockOpening=stockGroups(s.lots).map(x=>({key:x.key,product:x.product,grade:x.grade,qty:x.total,bags:x.bags}));
 return s;
}
function stockGroups(lots){
 const map={};
 lots.forEach(l=>{
  const key=l.product+'|'+l.grade;
  if(!map[key])map[key]={key,product:l.product,grade:l.grade,total:0,bags:0,owned:0,supplier:0,customer:0,cost:0,ownedBags:0};
  const x=map[key];x.total+=l.qty;x.bags+=l.bags;x[l.owner]+=l.qty;
  if(l.owner==='owned'){x.cost+=l.qty*l.cost;x.ownedBags+=l.bags;}
 });
 return Object.values(map).sort((a,b)=>PRODUCTS.indexOf(a.product)-PRODUCTS.indexOf(b.product)||a.grade.localeCompare(b.grade));
}
let storageOK=true,state=pweHydrate(JSON.parse(JSON.stringify(window.__PWE_BOOT__)));
let page=state.role==='owner'?'owner':'home',filter='all',searchTerm='',invTab='overview',cashTab='movements',modalReturnFocus=null,wizard=null;
function save() { /* Initialization only; replaced by server command bridge after source scripts. */ }
function uid(prefix){return prefix+(++state.counter);}
function today(){return state.day;}
function dayLabel(d=state.day){
 const months=['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','ဩဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
 const weekdays=['တနင်္ဂနွေ','တနင်္လာ','အင်္ဂါ','ဗုဒ္ဓဟူး','ကြာသပတေး','သောကြာ','စနေ'];
 const date=new Date(d+'T12:00:00'),mm=n=>String(n).replace(/[0-9]/g,x=>'၀၁၂၃၄၅၆၇၈၉'[Number(x)]);
 return mm(date.getDate())+' '+months[date.getMonth()]+' '+mm(date.getFullYear())+'၊ '+weekdays[date.getDay()]+'နေ့';
}
function shortDate(d){const a=d.split('-');return `${a[2]}/${a[1]}/${a[0]}`;}
function bal(acc){return state.bases[acc]+state.transactions.filter(t=>t.account===acc).reduce((a,t)=>a+t.amount,0);}
function stock(owner){return state.lots.filter(l=>!owner||l.owner===owner).reduce((a,l)=>a+l.qty,0);}
function ownedValue(){return state.lots.filter(l=>l.owner==='owned').reduce((a,l)=>a+l.qty*l.cost,0);}
function gross(r){return Math.round(r.qty*(r.price||0));}
function purchaseNet(r){return gross(r)-(r.wage||0)-(r.weigh||0)-(r.borderFee||0)-(r.carriageAdvance||0)-(r.advance||0);}
function due(r){return Math.max(0,purchaseNet(r)-(r.paid||0));}
function receivable(s){return Math.max(0,s.total-s.paid);}
function payableTotal(){return state.receipts.filter(r=>r.status==='purchased').reduce((a,r)=>a+due(r),0);}
function receivableTotal(){return state.sales.reduce((a,s)=>a+receivable(s),0);}
function advanceTotal(){return state.receipts.filter(r=>r.status!=='purchased').reduce((a,r)=>a+r.advance,0);}
function saleRemaining(s){return Math.max(0,s.qty-s.deliveredQty);}
function activeLots(owner){return state.lots.filter(l=>l.owner===owner&&l.qty>0.0001);}
function txn(account,amount,title,ref='',party=''){if(amount)state.transactions.push({id:uid('T'),date:today(),account,amount,title,ref,party,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});}
function activity(text){state.activity.unshift({id:uid('A'),text,date:today(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});}
function move(product,grade,qty,bags,direction,ref){state.moves.push({product,grade,qty,bags,direction,ref,date:today()});}
function receiptStatus(r){
 if(r.status==='draft')return pill('အကြမ်းမှတ်ထား','gray');
 if(r.status==='await')return pill('ဈေးမဖြတ်ရသေး','amber');
 if(r.status==='deposit')return pill('အပ်ထားသည်','blue');
 return due(r)>0?pill('ငွေရှင်းရန်ကျန်','amber'):pill('ငွေရှင်းပြီး');
}
function saleStatus(s){return saleRemaining(s)>0?pill('ထုတ်ပေးရန်ကျန်','blue'):pill('ထုတ်ပေးပြီး');}
function guardWork(){
 if(state.closed){toast('ယနေ့စာရင်း ပိတ်ပြီးပါပြီ။ နောက်နေ့ကို ဖွင့်ပြီးမှ ဆက်လုပ်ပါ။',true);return false;}
 if(!state.opening.checked){openCashCheck();return false;}
 return true;
}
function clearToast(){const el=document.getElementById('toast');if(el)el.classList.remove('show');clearTimeout(toast.timer);}
function toast(text,error=false){const el=document.getElementById('toast');el.className='show'+(error?' error':'');el.innerHTML=I(error?'info':'check')+E(text);clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4400);}
function navigate(p){
 page=p;filter='all';searchTerm='';closeModal();toggleNav(false);render();window.scrollTo({top:0,behavior:'instant'});
}
function changeRole(role){state.role=role;save();navigate(role==='owner'?'owner':'home');}
function toggleNav(force){const el=document.getElementById('sidebar');const isOpen=typeof force==='boolean'?force:!el.classList.contains('open');el.classList.toggle('open',isOpen);document.getElementById('navOverlay').classList.toggle('visible',isOpen);}
function renderNav(){
 const staff=[['home','home','နေ့စဉ်အလုပ်'],['receipts','receive','အဝယ်နှင့် အပ်ကုန်'],['sales','sale','အရောင်းနှင့် ကုန်ထုတ်'],['inventory','stock','ကုန်လက်ကျန်'],['cash','wallet','ငွေစာရင်း'],['prices','price','ယနေ့ပေါက်ဈေး']];
 const owner=[['owner','chart','လုပ်ငန်းခြုံငုံမြင်ကွင်း'],['inventory','stock','ကုန်နှင့် ကုန်တန်ဖိုး'],['cash','wallet','ငွေနှင့် အကြွေး'],['profit','chart','အရှုံးအမြတ် နမူနာ']];
 const items=state.role==='owner'?owner:staff;
 document.getElementById('sidebar').innerHTML=`<div class="brand"><div class="brandmark">${I('grain')}</div><div><div class="brand-title">ပွဲရုံ</div><div class="brand-sub">နေ့စဉ်လုပ်ငန်းစီမံမှု</div></div></div>
 <div class="navlabel">${state.role==='owner'?'ပိုင်ရှင်အတွက်':'ယနေ့လုပ်ငန်းများ'}</div>
 <nav class="nav-list">${items.map(([p,i,t])=>`<button class="nav-btn ${page===p?'active':''}" onclick="navigate('${p}')" ${page===p?'aria-current="page"':''}>${I(i)}<span>${t}</span>${p==='receipts'?`<span class="count">${state.receipts.filter(r=>r.status!=='purchased').length}</span>`:''}</button>`).join('')}</nav>
 <div class="side-bottom"><div class="side-helper"><div class="row" style="gap:8px;margin-bottom:6px;color:var(--green)">${I('help','sm')}<strong>ဘယ်က စရမလဲ။</strong></div><p class="muted small">နမူနာလုပ်ငန်းစဉ်ကို အဆင့်လိုက် စမ်းကြည့်ပါ။</p><button class="btn-link" onclick="openHelp()" style="margin-top:10px">အသုံးပြုနည်း ကြည့်မယ် →</button></div><div class="side-foot">ငွေအစစ်၊ ကုန်အစစ် မပြောင်းပါ။<br>စမ်းထားသည့်ဒေတာကို ဤဘရောက်ဇာတွင် သိမ်းထားသည်။</div><button class="btn btn-ghost btn-sm" style="font-size:11px;margin-top:7px" onclick="openReset()">${I('reset','sm')}နမူနာကို အစပြန်စမယ်</button></div>`;
 document.getElementById('roleSelect').value=state.role;
 document.getElementById('avatar').textContent=state.role==='owner'?'ပ':'စ';
 document.querySelector('.topbar .date').innerHTML=`<span class="day-dot"></span>${dayLabel()}${state.closed?' · စာရင်းပိတ်ပြီး':''}`;
}
function heading(eyebrow,title,sub,action=''){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${sub?`<p class="subtitle">${sub}</p>`:''}</div>${action}</div>`;}
function stat(label,value,unit,icon,foot='',cls=''){return `<div class="card stat ${cls}"><div class="stat-top"><span>${label}</span>${I(icon)}</div><div class="stat-value num">${value}<span class="unit">${unit}</span></div>${foot?`<div class="stat-note">${foot}</div>`:''}</div>`;}
function render(){
 clearToast();renderNav();
 let content=page==='home'?homePage():page==='receipts'?receiptsPage():page==='sales'?salesPage():page==='inventory'?inventoryPage():page==='cash'?cashPage():page==='prices'?pricesPage():page==='owner'?ownerPage():profitPage();
 document.getElementById('main').innerHTML=content+``+(!storageOK?`<div class="mt">${note('ဤဘရောက်ဇာတွင် ဒေတာအမြဲသိမ်းဆည်းမရပါ။ စာမျက်နှာပိတ်ပါက စမ်းထားသည့်ဒေတာ ပျောက်နိုင်ပါသည်။','amber')}</div>`:'');
 if(page==='receipts')renderReceiptRows();
 if(page==='sales')renderSaleRows();
 if(page==='inventory')renderInventoryBody();
 if(page==='cash')renderCashBody();
}
function homePage(){
 const pending=state.receipts.filter(r=>r.status!=='purchased').length;
 const held=state.sales.filter(s=>saleRemaining(s)>0).length;
 const opening=state.opening;
 const hero=state.closed?`<div class="banner"><div class="row"><div class="icon-box large">${I('check')}</div><div><h2>ယနေ့စာရင်း ပိတ်ပြီးပါပြီ။</h2><p>နောက်နေ့အတွက် စာရင်းအရ ချန်ငွေ <strong>${accountValue68('cash',bal('cash'),cashText)}</strong> ဖြစ်ပါတယ်။</p></div></div>${btn('နောက်နေ့ စာရင်းဖွင့်မယ်','openNextDay()','primary','sun')}</div>`:
 !opening.checked?`<div class="banner open"><div class="row"><div class="icon-box large amber">${I('sun')}</div><div><h2>ဒီနေ့အလုပ်မစခင် ငွေစစ်ကြမယ်။</h2><p>အံဆွဲထဲက ငွေသားကို ရေတွက်ပြီး မနေ့ကလက်ကျန်နဲ့ တိုက်စစ်ပါ။</p><div class="cash-split"><div><div class="l">မနေ့က ချန်ထားခဲ့သည့်ငွေ</div><div class="v num">${accountValue68('cash',opening.expected,M)} <small>ကျပ်</small></div></div></div></div></div>${btn('အဖွင့်ငွေ စစ်မယ်','openCashCheck()','primary','arrow','id="openCashBtn"')}</div>`:
 `<div class="banner"><div class="row"><div class="icon-box large">${I(opening.difference?'info':'check')}</div><div><h2>${opening.difference?'အဖွင့်ငွေ ကွာဟချက်ကို မှတ်တမ်းတင်ထားသည်။':'အဖွင့်ငွေ စစ်ပြီးပါပြီ။ အလုပ်ဆက်လုပ်နိုင်ပါပြီ။'}</h2><p>${opening.difference?`ကွာဟချက် ${cashText(opening.difference)} · စာရင်းလက်ကျန်ကို အလိုအလျောက် မပြင်ထားပါ။`:'မနေ့ကလက်ကျန်နဲ့ ဒီမနက်တကယ်ရှိငွေ ကိုက်ညီပါတယ်။'}</p></div></div>${smallbtn('စစ်ထားတာ ကြည့်မယ်','openCashCheck()','secondary','eye')}</div>`;
 const queue=[];
 state.receipts.filter(r=>r.status!=='purchased').slice(0,3).forEach(r=>queue.push(`<div class="queue-row"><div class="icon-box ${r.status==='deposit'?'blue':r.status==='draft'?'gray':'amber'}">${I(r.status==='draft'?'note':r.status==='deposit'?'stock':'clock')}</div><div class="grow"><div class="name">${E(r.name)}</div><div class="meta">${E(r.product)} · အဆင့် ${r.grade} · ${vissText37(r.qty)} ပိဿာ</div></div><div class="line-end">${receiptStatus(r)}${smallbtn(r.status==='draft'?'ဆက်ဖြည့်မယ်':'ဆက်လုပ်မယ်',`openReceiptProcess('${r.id}')`,'secondary','arrow')}</div></div>`));
 const pay=state.receipts.find(r=>r.status==='purchased'&&due(r)>0);
 if(pay)queue.push(`<div class="queue-row"><div class="icon-box amber">${I('wallet')}</div><div class="grow"><div class="name">${E(pay.name)}</div><div class="meta">ရှင်းရန်ကျန် ${cashText(due(pay))}</div></div><div class="line-end">${pill('ငွေရှင်းရန်','amber')}${smallbtn('ငွေရှင်းမယ်',`openPurchasePayment('${pay.id}')`,'secondary','arrow')}</div></div>`);
 const lastSale=state.sales.find(s=>saleRemaining(s)>0);
 if(lastSale)queue.push(`<div class="queue-row"><div class="icon-box blue">${I('truck')}</div><div class="grow"><div class="name">${E(lastSale.name)}</div><div class="meta">${E(lastSale.product)} · ${vissText37(saleRemaining(lastSale))} ပိဿာ လာယူရန်ကျန်</div></div><div class="line-end">${pill('သိမ်းထပ်ထား','blue')}${smallbtn('ထုတ်ပေးမယ်',`openDispatch('${lastSale.id}')`,'secondary','arrow')}</div></div>`);
 return heading('နေ့စဉ်အလုပ်','မင်္ဂလာပါ။ အလုပ်စလိုက်ရအောင်။','လုပ်စရာတွေကို တစ်ဆင့်ချင်း၊ ရှင်းရှင်းလင်းလင်း။',pill(state.closed?'စာရင်းပိတ်ပြီး':'ဆိုင်ဖွင့်ချိန်',state.closed?'gray':''))+
 `<div class="stack">${hero}<div class="grid cols-4">${stat('လက်ရှိ ပွဲရုံငွေသား',M(bal('cash')),'ကျပ်','wallet','စာရင်းအရ ငွေလက်ကျန်')}${stat('ဆက်လုပ်ရန် အဝယ်',pending,'စောင်','receive','အကြမ်း၊ ဈေးစောင့်နှင့် အပ်ကုန်')}${stat('ပွဲရုံပိုင် ရောင်းနိုင်ကုန်',vissText37(stock('owned')),'ပိဿာ','stock','အပ်ကုန်နှင့် ဝယ်သူပိုင်ကုန် မပါ')}${stat('လာယူရန် ကျန်သောအရောင်း',held,'စောင်','truck','ရောင်းပြီး ပွဲရုံမှာထားသည့်ကုန်')}</div>
 <div class="grid cols-2"><button class="work-action" onclick="startReceipt()"><div class="icon-box">${I('receive')}</div><div><strong>ကုန်လက်ခံမယ်</strong><small>ကုန်သည်၊ ကုန်အမျိုးအစားနဲ့ အလေးချိန် မှတ်မယ်</small></div>${I('arrow')}</button><button class="work-action" onclick="startSale()"><div class="icon-box blue">${I('sale')}</div><div><strong>ကုန်ရောင်းမယ်</strong><small>ဈေးဖြတ်၊ ငွေရှင်းပြီး ကုန်သိမ်းပုံ ရွေးမယ်</small></div>${I('arrow')}</button></div>
 <div class="main-grid"><section class="card"><div class="card-title"><div><h3>ဆက်လုပ်ဖို့ ကျန်နေပါတယ်</h3><p class="small muted" style="margin-top:4px">ယခင်ရက်မှ ဆက်လာသောစာရင်းများလည်း ပါဝင်သည်။</p></div><span class="pill gray">${queue.length} ခု</span></div>${queue.join('')||empty('ဆက်လုပ်ရန်စာရင်း မရှိသေးပါ။')}</section>
 <section class="card"><div class="card-title"><h3>တစ်နေ့တာ အလုပ်အစဉ်</h3>${I('sun')}</div>
 ${[['ငွေစစ်ခြင်း','မနေ့ကလက်ကျန်နဲ့ တိုက်စစ်မယ်',opening.checked?'done':'current'],['ကုန်လက်ခံခြင်း','အကြမ်းမှတ်ပြီး အချောဖြည့်မယ်',opening.checked?'current':''],['ဈေးသတ်မှတ်၊ ငွေရှင်းခြင်း','ဈေးကြိုက်မှ ဝယ်ယူမယ်',''],['အရောင်းနှင့် ကုန်ထုတ်ခြင်း','ရောင်းခြင်းနဲ့ ထုတ်ခြင်း ခွဲမှတ်မယ်',''],['နေ့ပိတ် ငွေစစ်ခြင်း','ချန်ငွေက နောက်နေ့ အဖွင့်ငွေဖြစ်မယ်',state.closed?'done':'']].map((x,i)=>`<div class="timeline"><div class="step-circle ${x[2]}">${x[2]==='done'?I('check','sm'):i+1}</div><div><strong>${x[0]}</strong><p>${x[1]}</p></div></div>`).join('')}
 <div style="margin-top:17px">${note('စာရင်းတစ်ခု ဈေးစောင့်နေချိန်မှာ အခြားအလုပ်တွေကို ဆက်လုပ်နိုင်ပါတယ်။')}</div></section></div>
 <div class="bottom-banner"><div class="row"><div class="icon-box gray">${I('moon')}</div><div><h3>ဆိုင်ပိတ်ချိန် ရောက်ပြီလား။</h3><p class="small muted">လက်ထဲရှိငွေစစ်ပြီး အိမ်ပို့ငွေနဲ့ ချန်ငွေကို မှတ်မယ်။</p></div></div>${btn(state.closed?'ပိတ်ထားတာ ကြည့်မယ်':'နေ့ပိတ် စာရင်းစစ်မယ်','openCloseDay()','secondary','moon')}</div></div>`;
}
function receiptsPage(){
 return heading('အဝယ်လုပ်ငန်း','အဝယ်နှင့် အပ်ကုန်','ကုန်ရောက်တာနဲ့ ဝယ်ပြီးသား မဖြစ်သေးပါ။ ဈေးကြိုက်မှ ဝယ်ယူမယ်။',btn('ကုန်အသစ် လက်ခံမယ်','startReceipt()','primary','plus'))+
 `<div class="grid cols-3 mb">${stat('အပ်ထား / ဈေးစောင့်ကုန်',vissText37(stock('supplier')),'ပိဿာ','receive','ကုန်သည်ပိုင်','compact')}${stat('ပေးထားသော ကြိုရှင်းငွေ',M(advanceTotal()),'ကျပ်','wallet','မဝယ်ရသေးသော အပ်ကုန်များအတွက်','compact')}${stat('ဝယ်ပြီး ငွေရှင်းရန်ကျန်',M(payableTotal()),'ကျပ်','doc','ပေးပြီးသားကြိုငွေ နုတ်ထားပြီး','compact')}</div>
 <div class="toolbar"><div class="tabs">${[['all','အားလုံး'],['draft','အကြမ်း'],['hold','ဈေးစောင့် / အပ်ကုန်'],['payable','ငွေရှင်းရန်'],['purchased','ဝယ်ယူပြီး']].map(([k,v])=>`<button class="tab ${filter===k?'active':''}" onclick="setFilter('${k}')">${v}</button>`).join('')}</div><div class="search">${I('search')}<input id="receiptSearch" aria-label="အဝယ်ရှာရန်" placeholder="နာမည်၊ ကုန်အမျိုးအစား ရှာမယ်" oninput="searchTerm=this.value;renderReceiptRows()" value="${E(searchTerm)}"></div></div>
 <div id="receiptRows"></div><div class="mt">${note('အကြမ်းမှတ်တမ်းကို အချောမှာ ဆက်ဖြည့်ရုံပါ။ အပ်ကုန်ကို ဝယ်ယူရာတွင် ကုန်ဝင်အသစ် ထပ်မတွက်ပါ။')}</div>`;
}
function setFilter(k){filter=k;render();}
function renderReceiptRows(){
 let rows=state.receipts.filter(r=>filter==='all'||filter==='draft'&&r.status==='draft'||filter==='hold'&&['await','deposit'].includes(r.status)||filter==='payable'&&r.status==='purchased'&&due(r)>0||filter==='purchased'&&r.status==='purchased'&&due(r)<=0);
 rows=rows.filter(r=>(r.name+r.product+r.no).toLowerCase().includes(searchTerm.toLowerCase()));
 document.getElementById('receiptRows').innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>ကုန်လာချသူ</th><th>ကုန် / အရည်အသွေး</th><th class="right">အိတ် / ပိဿာ</th><th class="right">ကြိုရှင်းငွေ</th><th>အခြေအနေ</th><th class="right">ဆက်လုပ်ရန်</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${E(r.name)}</strong><div class="sub">${r.type==='farmer'?'ကုန်သည်':'ကုန်သည်'} · ${r.no}<br>${shortDate(r.date)}</div></td><td><strong>${E(r.product)}</strong><div class="sub">အဆင့် ${r.grade}</div></td><td class="right nowrap"><strong>${vissText37(r.qty)} ပိဿာ</strong><div class="sub">${N(r.bags)} အိတ်</div></td><td class="right nowrap">${cashText(r.advance)}</td><td>${receiptStatus(r)}</td><td><div class="table-actions">${r.status==='purchased'?(due(r)>0?smallbtn('ငွေရှင်းမယ်',`openPurchasePayment('${r.id}')`):''):smallbtn(r.status==='draft'?'အချောဖြည့်မယ်':'ဈေး / ဆုံးဖြတ်ချက်',`openReceiptProcess('${r.id}')`)}<button class="btn-icon" aria-label="${E(r.name)} မှတ်တမ်းကြည့်ရန်" onclick="openReceiptDetail('${r.id}')">${I('eye')}</button></div></td></tr>`).join('')}</tbody></table></div>`:empty('ရှာဖွေမှုနှင့် ကိုက်ညီသည့်စာရင်း မရှိပါ။');
}
function salesPage(){
 return heading('အရောင်းလုပ်ငန်း','အရောင်းနှင့် ကုန်ထုတ်','ဈေးဖြတ်ခြင်း၊ ငွေလက်ခံခြင်းနဲ့ ကုန်ထုတ်ခြင်းကို သီးခြားမှတ်မယ်။',btn('အရောင်းအသစ် မှတ်မယ်','startSale()','primary','plus'))+
 `<div class="grid cols-3 mb">${stat('ပွဲရုံပိုင် ရောင်းနိုင်ကုန်',vissText37(stock('owned')),'ပိဿာ','stock','သူများပိုင်ကုန်ကို မရွေးနိုင်ပါ','compact')}${stat('ရောင်းပြီး သိမ်းထပ်ထား',vissText37(stock('customer')),'ပိဿာ','truck','ပွဲရုံထဲရှိသေးသည့် ဝယ်သူပိုင်ကုန်','compact')}${stat('ရောင်းရငွေ ရရန်ကျန်',M(receivableTotal()),'ကျပ်','wallet','ကုန်ထုတ်ပြီး / မထုတ်ရသေး အားလုံး','compact')}</div>
 <div class="toolbar"><div class="tabs">${[['all','အားလုံး'],['collect','လာယူရန်ကျန်'],['debt','ငွေရရန်ကျန်'],['delivered','ထုတ်ပေးပြီး']].map(([k,v])=>`<button class="tab ${filter===k?'active':''}" onclick="setFilter('${k}')">${v}</button>`).join('')}</div><div class="search">${I('search')}<input aria-label="အရောင်းရှာရန်" placeholder="ဝယ်သူ၊ ကုန်အမျိုးအစား ရှာမယ်" oninput="searchTerm=this.value;renderSaleRows()" value="${E(searchTerm)}"></div></div>
 <div id="saleRows"></div><div class="mt">${note('သိမ်းထပ်ထားသည့်ကုန်ကို နောက်မှထုတ်ပေးတာက အရောင်းအသစ် မဟုတ်ပါ။ မူလအရောင်းနဲ့ချိတ်ပြီး ထုတ်ပေးမှတ်တမ်းပဲ တင်ပါမယ်။','blue')}</div>`;
}
function renderSaleRows(){
 let rows=state.sales.filter(s=>filter==='all'||filter==='collect'&&saleRemaining(s)>0||filter==='debt'&&receivable(s)>0||filter==='delivered'&&saleRemaining(s)===0);
 rows=rows.filter(s=>(s.name+s.product+s.no).toLowerCase().includes(searchTerm.toLowerCase()));
 document.getElementById('saleRows').innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>ဝယ်သူ</th><th>ရောင်းထားသောကုန်</th><th class="right">ထုတ်ရန်ကျန်</th><th class="right">ငွေရရန်ကျန်</th><th>ကုန်ထုတ်အခြေအနေ</th><th class="right">ဆက်လုပ်ရန်</th></tr></thead><tbody>${rows.map(s=>`<tr><td><strong>${E(s.name)}</strong><div class="sub">${s.no} · ${shortDate(s.date)}</div></td><td><strong>${E(s.product)} · အဆင့် ${s.grade}</strong><div class="sub">${vissText37(s.qty)} ပိဿာ · ${N(s.bags)} အိတ်</div></td><td class="right nowrap"><strong>${vissText37(saleRemaining(s))} ပိဿာ</strong><div class="sub">${N(s.bags-s.deliveredBags)} အိတ်</div></td><td class="right nowrap">${cashText(receivable(s))}</td><td>${saleStatus(s)}</td><td><div class="table-actions">${saleRemaining(s)>0?smallbtn('ထုတ်ပေးမယ်',`openDispatch('${s.id}')`):receivable(s)>0?smallbtn('ငွေလက်ခံမယ်',`openSalePayment('${s.id}')`):''}<button class="btn-icon" aria-label="${E(s.name)} အရောင်းကြည့်ရန်" onclick="openSaleDetail('${s.id}')">${I('eye')}</button></div></td></tr>`).join('')}</tbody></table></div>`:empty('ဤအခြေအနေရှိသော အရောင်းစာရင်း မရှိသေးပါ။','sale');
}
function inventoryPage(){
 const isOwner=state.role==='owner';
 return heading('ကုန်စာရင်း','ကုန်လက်ကျန်နှင့် ပိုင်ဆိုင်မှု','ပွဲရုံထဲမှာ ရှိနေတာနဲ့ ပွဲရုံပိုင်တာကို ခွဲကြည့်မယ်။',!isOwner?btn('မြေပြင်စစ်ချက် မှတ်မယ်','openGround()','secondary','scale'):'')+
 `<div class="grid cols-4 mb">${stat('ပွဲရုံထဲရှိ စုစုပေါင်း',vissText37(stock()),'ပိဿာ','stock','ပိုင်ဆိုင်မှု အမျိုးအစားအားလုံး','compact')}${stat('ပွဲရုံပိုင်ကုန်',vissText37(stock('owned')),'ပိဿာ','check','ရောင်းနိုင်သောကုန်','compact')}${stat('ကုန်သည်ပိုင်ကုန်',vissText37(stock('supplier')),'ပိဿာ','receive','မဝယ်ရသေးသောကုန်','compact')}${stat('ဝယ်သူပိုင်ကုန်',vissText37(stock('customer')),'ပိဿာ','truck','ရောင်းပြီး မထုတ်ရသေး','compact')}</div>
 <div class="toolbar"><div class="tabs">${[['overview','ပိုင်ဆိုင်မှုအလိုက်'],['ledger','ကုန်လယ်ဂျာ'],['ground','မြေပြင်စစ်ချက်']].map(([k,v])=>`<button class="tab ${invTab===k?'active':''}" onclick="invTab='${k}';render()">${v}</button>`).join('')}</div>${pill('အလေးချိန်ယူနစ် · ပိဿာ','gray')}</div><div id="inventoryBody"></div>`;
}
function renderInventoryBody(){
 const groups=stockGroups(state.lots);
 let html='';
 if(invTab==='overview'){
  html=`<div class="table-wrap"><table><thead><tr><th>ကုန် / အရည်အသွေး</th><th class="right">ပွဲရုံပိုင်</th><th class="right">အပ်ကုန်</th><th class="right">ဝယ်သူပိုင်</th><th class="right">မြေပြင်ရှိသင့်</th>${state.role==='owner'?'<th class="right">ပွဲရုံပိုင် ဝယ်ရင်းတန်ဖိုး</th>':''}</tr></thead><tbody>${groups.map(g=>`<tr><td><strong>${g.product}</strong><div class="sub">အဆင့် ${g.grade}</div></td><td class="right"><strong class="green">${vissText37(g.owned)}</strong></td><td class="right">${vissText37(g.supplier)}</td><td class="right">${vissText37(g.customer)}</td><td class="right"><strong>${vissText37(g.total)} ပိဿာ</strong><div class="sub">${N(g.bags)} အိတ်</div></td>${state.role==='owner'?`<td class="right nowrap">${cashText(g.cost)}</td>`:''}</tr>`).join('')}</tbody></table></div>
 <div class="grid cols-2 mt"><section class="card"><h3>ကုန်သည်ပိုင်ကုန်</h3><p class="small muted mt" style="margin-top:7px">ဈေးစောင့်နေသည့်ကုန်လည်း ပါဝင်သည်။</p>${activeLots('supplier').map(l=>`<div class="product-row"><div class="icon-box amber" style="width:36px;height:36px">${I('receive','sm')}</div><div><strong class="small">${E(l.name)}</strong><div class="small muted" style="font-size:11px">${l.product} · အဆင့် ${l.grade}</div></div><div class="amount">${vissText37(l.qty)}<small>ပိဿာ · ${N(l.bags)} အိတ်</small></div></div>`).join('')||empty('အပ်ကုန် မရှိပါ။')}</section>
 <section class="card"><h3>ဝယ်သူပိုင်ကုန် — ဝယ်ပြီး မသယ်သေးဘဲ အပ်ထားသောကုန်</h3><p class="small muted mt" style="margin-top:7px">အခြားဝယ်သူကို ထပ်ရောင်းလို့ မရပါ။</p>${activeLots('customer').map(l=>`<div class="product-row"><div class="icon-box blue" style="width:36px;height:36px">${I('truck','sm')}</div><div><strong class="small">${E(l.name)}</strong><div class="small muted" style="font-size:11px">${l.product} · အဆင့် ${l.grade}</div></div><div class="amount">${vissText37(l.qty)}<small>ပိဿာ · ${N(l.bags)} အိတ်</small></div></div>`).join('')||empty('သိမ်းထပ်ထားသောကုန် မရှိပါ။')}</section></div>
 <div class="mt">${note('ကုန်လာချချိန်တွင်သာ မြေပြင်ကုန်ဝင်တိုးပါသည်။ အပ်ကုန်ကို ဝယ်ခြင်း၊ ရောင်းပြီးသိမ်းထပ်ထားခြင်းတို့မှာ ပိုင်ဆိုင်မှုသာ ပြောင်းပါသည်။')}</div>`;
 }else if(invTab==='ledger'){
  html=`<div class="mb">${note('ဤလယ်ဂျာသည် ပိုင်ဆိုင်မှုအားလုံးပါဝင်သည့် မြေပြင်ကုန်အဝင် / အထွက်စာရင်း ဖြစ်သည်။ ပိုင်ရှင်ပြောင်းခြင်းကို ကုန်ဝင် / ကုန်ထွက်အဖြစ် ထပ်မတွက်ပါ။')}</div><div class="table-wrap"><table><thead><tr><th>ကုန် / အဆင့်</th><th class="right">ယနေ့နှုန်း</th><th class="right">စာရင်းဖွင့်</th><th class="right">ကုန်ဝင်</th><th class="right">စုစုပေါင်း</th><th class="right">ကုန်ထွက်</th><th class="right">စာရင်းလက်ကျန်</th><th class="right">မြေပြင်စစ်ချက်</th><th class="right">ကွာဟချက်</th></tr></thead><tbody>${groups.map(g=>{
   const op=state.stockOpening.find(x=>x.key===g.key)?.qty||0;
   const ms=state.moves.filter(m=>m.product===g.product&&m.grade===g.grade);
   const ins=ms.filter(m=>m.direction==='in').reduce((a,m)=>a+m.qty,0),outs=ms.filter(m=>m.direction==='out').reduce((a,m)=>a+m.qty,0),ground=state.grounds[g.key];
   return `<tr><td class="nowrap"><strong>${g.product} · ${g.grade}</strong></td><td class="right">${state.prices[g.key]?M(state.prices[g.key]):'—'}</td><td class="right">${vissText37(op)}</td><td class="right">${vissText37(ins)}</td><td class="right">${N(op+ins)}</td><td class="right">${vissText37(outs)}</td><td class="right"><strong>${vissText37(g.total)}</strong></td><td class="right">${ground?N(ground.qty):'မစစ်ရသေး'}</td><td class="right ${ground&&ground.difference!==0?'danger-text':'green'}">${ground?N(ground.difference):'—'}</td></tr>`;
  }).join('')}</tbody></table></div><p class="field-help">နှုန်း = နမူနာ တစ်ပိဿာပေါက်ဈေး (ကျပ်)။ ကွာဟချက်ကို စစ်ဆေးချိန်ရှိ စာရင်းလက်ကျန်နှင့် တွက်ထားသည်။</p>`;
 }else{
  const gs=Object.entries(state.grounds);
  html=`<div class="mb">${note('မြေပြင်လက်ကျန်ကို မှတ်ပြီး ကွာဟချက်သာ ပြပါမယ်။ စာရင်းကုန်လက်ကျန်ကို အလိုအလျောက် မပြင်ပါ။','amber')}</div>`;
  html+=gs.length?`<div class="table-wrap"><table><thead><tr><th>ကုန် / အဆင့်</th><th class="right">စစ်ချိန်ရှိ စာရင်းလက်ကျန်</th><th class="right">တကယ်ရေတွက်ရရှိ</th><th class="right">ပိဿာ ကွာဟချက်</th><th class="right">အိတ် ကွာဟချက်</th><th>မှတ်ချက်</th></tr></thead><tbody>${gs.map(([k,g])=>`<tr><td><strong>${E(k.split('|')[0])} · ${k.split('|')[1]}</strong><div class="sub">${shortDate(g.date)} · ${g.time}</div></td><td class="right">${vissText37(g.expectedQty)} ပိဿာ<div class="sub">${N(g.expectedBags)} အိတ်</div></td><td class="right">${vissText37(g.qty)} ပိဿာ<div class="sub">${N(g.bags)} အိတ်</div></td><td class="right ${g.difference?'danger-text':'green'}">${N(g.difference)}</td><td class="right ${g.bagDifference?'danger-text':'green'}">${N(g.bagDifference)}</td><td>${E(g.note)||'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('ယနေ့ မြေပြင်စစ်ချက် မမှတ်ရသေးပါ။','scale');
 }
 document.getElementById('inventoryBody').innerHTML=html;
}
function cashPage(){
 const owner=state.role==='owner';
 return heading('ငွေစာရင်း','ငွေလက်ကျန်၊ ပေးရန်နှင့် ရရန်','လက်မှတ်ပေးထားရုံနဲ့ ငွေလက်ကျန် မပြောင်းပါ။ ငွေတကယ်ရမှ မှတ်မယ်။',owner?btn('ငွေယူလက်မှတ် ရေးမယ်','openMoneyRequest()','primary','doc'):btn('အသုံးစရိတ် မှတ်မယ်','openExpense()','secondary','plus'))+
 `<div class="grid cols-3 mb">${stat('ပွဲရုံ ငွေသား',M(bal('cash')),'ကျပ်','wallet','လက်ရှိစာရင်းအရ လက်ကျန်','compact')}${stat('ဘဏ် / ငွေပေးချေမှုအကောင့်',M(bal('bank')),'ကျပ်','bank','နမူနာ အကောင့်တစ်ခု','compact')}${owner?stat('အိမ် ငွေသိမ်းရာ',M(bal('home')),'ကျပ်','home','နမူနာတွင် လုပ်ငန်းငွေသိမ်းရာအဖြစ် သတ်မှတ်ထား','compact'):stat('ယနေ့ ငွေသားအသုံးထွက်',M(-state.transactions.filter(t=>t.account==='cash'&&t.amount<0).reduce((a,t)=>a+t.amount,0)),'ကျပ်','transfer','ငွေသားအထွက် အားလုံးပါဝင်','compact')}</div>
 ${state.opening.difference?`<div class="mb">${note(`အဖွင့်ငွေ ကွာဟချက် ${cashText(state.opening.difference)} ရှိသည်။ မှတ်ချက် — ${E(state.opening.note)}။ လက်ကျန်ကို အလိုအလျောက် မပြင်ထားပါ။`,'amber')}</div>`:''}
 <div class="toolbar"><div class="tabs">${[['movements','ငွေအဝင် / အထွက်'],['debts','ပေးရန် / ရရန်'],['requests','အိမ်မှ ငွေယူလက်မှတ်']].map(([k,v])=>`<button class="tab ${cashTab===k?'active':''}" onclick="cashTab='${k}';render()">${v}${k==='requests'&&state.requests.filter(r=>r.status==='issued').length?` (${state.requests.filter(r=>r.status==='issued').length})`:''}</button>`).join('')}</div>${!owner?smallbtn(state.closed?'နေ့ပိတ်မှတ်တမ်း':'နေ့ပိတ်မယ်','openCloseDay()','secondary','moon'):''}</div><div id="cashBody"></div>`;
}
function renderCashBody(){
 let html='';
 if(cashTab==='movements'){
  html=state.transactions.some(t=>canViewAccount68(t.account))?`<div class="table-wrap"><table><thead><tr><th>အချိန် / အကြောင်းအရာ</th><th>ငွေသိမ်းရာ</th><th>သက်ဆိုင်သူ / အမှတ်</th><th class="right">ငွေဝင်</th><th class="right">ငွေထွက်</th></tr></thead><tbody>${state.transactions.filter(t=>canViewAccount68(t.account)).slice().reverse().map(t=>`<tr><td><strong>${E(t.title)}</strong><div class="sub">${t.time}</div></td><td>${ACCOUNT_NAMES[t.account]}</td><td>${E(t.party)||'—'}<div class="sub">${E(t.ref)}</div></td><td class="right green">${t.amount>0?cashText(t.amount):'—'}</td><td class="right">${t.amount<0?cashText(-t.amount):'—'}</td></tr>`).join('')}</tbody></table></div>`:empty('ယနေ့ ငွေအဝင် / အထွက် မမှတ်ရသေးပါ။','wallet');
  html+=`<div class="mt">${note('အိမ်နှင့် ပွဲရုံကြား ငွေရွှေ့ခြင်းကို နှစ်ဖက်ငွေသိမ်းရာတွင် ချိတ်ဆက်မှတ်ထားသည်။ နမူနာအမြတ်တွက်ချက်မှုထဲ မပေါင်းပါ။')}</div>`;
 }else if(cashTab==='debts'){
  html=`<div class="grid cols-3 mb">${stat('ကုန်ဝယ် ပေးရန်ကျန်',M(payableTotal()),'ကျပ်','receive','','compact')}${stat('ကုန်ရောင်း ရရန်ကျန်',M(receivableTotal()),'ကျပ်','sale','','compact')}${stat('ဝယ်ယူရန် ကြိုသုံးထားငွေ',M(advanceTotal()),'ကျပ်','wallet','အရောင်းရရန်ငွေနှင့် မရောထားပါ','compact')}</div>`;
  const payRows=state.receipts.filter(r=>r.status==='purchased'&&due(r)>0);
  const dueRows=state.sales.filter(s=>receivable(s)>0);
  html+=`<div class="grid cols-2"><section class="card"><h3>ပေးရန်ရှိ</h3>${payRows.map(r=>`<div class="queue-row"><div class="grow"><strong class="small">${E(r.name)}</strong><div class="small muted">${r.no} · ${cashText(due(r))}</div></div>${state.role==='staff'?smallbtn('ငွေရှင်းမယ်',`openPurchasePayment('${r.id}')`):pill('ပေးရန်','amber')}</div>`).join('')||empty('ပေးရန်မရှိပါ။')}</section><section class="card"><h3>ရရန်ရှိ</h3>${dueRows.map(s=>`<div class="queue-row"><div class="grow"><strong class="small">${E(s.name)}</strong><div class="small muted">${s.no} · ${cashText(receivable(s))}</div></div>${state.role==='staff'?smallbtn('လက်ခံမယ်',`openSalePayment('${s.id}')`):pill('ရရန်','blue')}</div>`).join('')||empty('ရရန်မရှိပါ။')}</section></div>`;
 }else{
  html=`<div class="mb">${note('ပိုင်ရှင်မြင်ကွင်းမှာ ငွေယူလက်မှတ်ရေးပါ။ စာရေးမမြင်ကွင်းမှာ ငွေတကယ်ရရှိမှ “ငွေရရှိပြီ” ကိုနှိပ်ပါ။','blue')}</div>`;
  html+=state.requests.length?`<div class="table-wrap"><table><thead><tr><th>ငွေယူလက်မှတ်</th><th>သွားယူသူ / အကြောင်းအရာ</th><th class="right">ငွေပမာဏ</th><th>အခြေအနေ</th><th class="right">ဆက်လုပ်ရန်</th></tr></thead><tbody>${state.requests.slice().reverse().map(r=>`<tr><td><strong>${E(r.no)}</strong><div class="sub">${shortDate(r.date)}</div></td><td>${E(r.collector)}<div class="sub">${E(r.reason)}</div></td><td class="right nowrap">${cashText(r.amount)}${r.receivedAmount>0?`<div class="sub">လက်ခံပြီး ${cashText(r.receivedAmount)} · ကျန် ${cashText(Math.max(0,r.amount-r.receivedAmount))}</div>`:''}</td><td>${r.status==='issued'?(r.receivedAmount>0?pill('တစ်စိတ်တစ်ပိုင်း ရရှိပြီး','amber'):pill('ငွေမရသေး','amber')):pill('ငွေရရှိပြီး')}</td><td class="right"><div class="table-actions">${r.status==='issued'&&state.role==='staff'?smallbtn(r.receivedAmount>0?'ကျန်ငွေ လက်ခံမယ်':'ငွေရရှိပြီ',`openReceiveMoney('${r.id}')`):''}${smallbtn('လက်မှတ်',`printRequest('${r.id}')`,'secondary','print')}</div></td></tr>`).join('')}</tbody></table></div>`:empty('ငွေယူလက်မှတ် မရှိသေးပါ။','doc');
 }
 document.getElementById('cashBody').innerHTML=html;
}
function pricesPage(){
 return heading('ပေါက်ဈေး','ယနေ့ ကုန်ပေါက်ဈေး','ကုန်စည်ဒိုင်မှ ဈေးသိရသောအခါ ထည့်ပါ။ ဈေးမသိသေးလျှင် အလွတ်ထားနိုင်ပါတယ်။',pill(state.priceDate===today()?'ယနေ့ဈေး ထည့်ထားသည်':'ယနေ့ဈေး မထည့်ရသေး',state.priceDate===today()?'':'amber'))+
 `<form id="priceForm" onsubmit="savePrices(event)"><div class="grid cols-3">${PRODUCTS.map((p,i)=>`<section class="card market-card"><div class="row"><div class="icon-box ${i===1?'amber':i===2?'blue':''}">${I('grain')}</div><div><h2>${p}</h2><div class="small muted">တစ်ပိဿာနှုန်း · ကျပ်</div></div></div>${['A','B','C'].map(g=>`<div class="market-row"><label for="price_${i}_${g}">အဆင့် ${g}</label><input id="price_${i}_${g}" name="price_${i}_${g}" type="number" min="1" step="1" inputmode="numeric" placeholder="ဈေးမထွက်သေး" value="${state.prices[p+'|'+g]||''}"></div>`).join('')}<p class="market-status">သက်ဆိုင်ရာအဆင့်၏ ဈေးကိုသာ ဖြည့်ပါ။</p></section>`).join('')}</div>
 <div class="row between wrap mt">${note('ဤနမူနာတွင် တစ်ပိဿာနှုန်းကို သုံးထားသည်။ ပေါက်ဈေး / တွက်ဈေး စည်းမျဉ်းအမှန်ကို အတည်ပြုရန် လိုပါသည်။','amber')}<button class="btn btn-primary" type="submit">${I('check')}ပေါက်ဈေး သိမ်းမယ်</button></div></form>
 <section class="card mt"><div class="card-title"><h3>ဈေးရပြီး ဆက်လုပ်နိုင်မည့် အပ်ကုန်များ</h3>${smallbtn('အဝယ်စာရင်း','navigate(\'receipts\')','secondary','arrow')}</div>${state.receipts.filter(r=>r.status!=='purchased').map(r=>`<div class="queue-row"><div class="icon-box amber">${I('price')}</div><div class="grow"><strong class="small">${E(r.name)}</strong><div class="small muted">${E(r.product)} · အဆင့် ${r.grade} · ${vissText37(r.qty)} ပိဿာ</div></div><div class="right"><strong class="small">${state.prices[r.product+'|'+r.grade]?cashText(state.prices[r.product+'|'+r.grade]):'ဈေးမထည့်ရသေး'}</strong><div style="margin-top:6px">${smallbtn('ဆုံးဖြတ်ချက် မှတ်မယ်',`openReceiptProcess('${r.id}')`)}</div></div></div>`).join('')||empty('ဈေးစောင့်နေသော အပ်ကုန် မရှိပါ။')}</section>`;
}
function savePrices(event){
 event.preventDefault();if(!guardWork())return;
 const values={};let count=0;
 PRODUCTS.forEach((p,i)=>['A','B','C'].forEach(g=>{const val=document.getElementById(`price_${i}_${g}`).value.trim();if(val!==''){values[p+'|'+g]=Number(val);count++;}}));
 if(!count){toast('သိရှိပြီးသော ဈေးနှုန်း အနည်းဆုံးတစ်ခု ထည့်ပါ။',true);return;}
 state.prices=values;state.priceDate=today();activity('ယနေ့ပေါက်ဈေး '+count+' မျိုး မှတ်တမ်းတင်ခဲ့သည်။');save();render();toast('ပေါက်ဈေး သိမ်းပြီးပါပြီ။ အပ်ကုန်တွေကို ဆက်လုပ်နိုင်ပါပြီ။');
}
function ownerPage(){
 const groups=stockGroups(state.lots),totalStock=stock(),pending=state.requests.filter(r=>r.status==='issued');
 const marketKnown=activeLots('owned').every(l=>state.prices[l.product+'|'+l.grade]>0);
 const marketValue=activeLots('owned').reduce((a,l)=>a+l.qty*(state.prices[l.product+'|'+l.grade]||0),0);
 return heading('ပိုင်ရှင်အတွက်','ပွဲရုံအခြေအနေကို တစ်နေရာတည်းမှာ။','ကိုယ့်ကုန်၊ သူများကုန်၊ ငွေနှင့်အကြွေးကို သီးခြားကြည့်မယ်။',btn('ငွေယူလက်မှတ် ရေးမယ်','openMoneyRequest()','primary','doc'))+
 `<div class="stack"><div class="grid cols-4">${stat('ပွဲရုံ ငွေသား',M(bal('cash')),'ကျပ်','wallet',state.opening.checked?'ယနေ့ အဖွင့်ငွေစစ်ပြီး':'ယနေ့ အဖွင့်ငွေ မစစ်ရသေး')}${stat('ကိုယ်ပိုင်ကုန် ဝယ်ရင်းတန်ဖိုး',M(ownedValue()),'ကျပ်','stock','အပ်ကုန်နှင့် ဝယ်သူပိုင်ကုန် မပါ')}${stat('ရရန်ရှိ',M(receivableTotal()),'ကျပ်','sale','ကုန်ရောင်းပြီး ရရန်ကျန်ငွေ')}${stat('ပေးရန်ရှိ',M(payableTotal()),'ကျပ်','receive','ကြိုရှင်းငွေ နုတ်ပြီး ပေးရန်ကျန်ငွေ')}</div>
 <div class="main-grid"><section class="card"><div class="card-title"><div><h3>လက်ရှိကုန် · ပိုင်ဆိုင်မှုအလိုက်</h3><p class="small muted" style="margin-top:5px">မြေပြင်ရှိ စုစုပေါင်း ${vissText37(totalStock)} ပိဿာ</p></div>${smallbtn('အသေးစိတ်','navigate(\'inventory\')','secondary','arrow')}</div>
 <div class="stock-strip">${['owned','supplier','customer'].map((k,i)=>`<span class="${['own','supplier','customer'][i]}-bg" style="width:${totalStock?stock(k)/totalStock*100:0}%"></span>`).join('')}</div>
 <div class="legend"><span><i class="own-bg"></i>ပွဲရုံပိုင် ${vissText37(stock('owned'))}</span><span><i class="supplier-bg"></i>အပ်ကုန် ${vissText37(stock('supplier'))}</span><span><i class="customer-bg"></i>ဝယ်သူပိုင် ${vissText37(stock('customer'))}</span></div>
 <div class="divider"></div>${groups.map(g=>`<div class="product-row"><div class="product-emoji">${I('grain')}</div><div><strong>${g.product} · အဆင့် ${g.grade}</strong><div class="small muted">ကိုယ်ပိုင် ${vissText37(g.owned)} ပိဿာ</div></div><div class="amount">${cashText(g.cost)}<small>ကိုယ်ပိုင်ကုန် ဝယ်ရင်းတန်ဖိုး</small></div></div>`).join('')}
 <div class="summary-box mt"><div class="summary-line"><span>လက်ရှိပေါက်ဈေးဖြင့် ကိုယ်ပိုင်ကုန်တန်ဖိုး</span><strong>${marketKnown?cashText(marketValue):'ဈေးမပြည့်စုံသေး'}</strong></div><p class="field-help">ဝယ်ရင်းတန်ဖိုးနှင့် ခွဲပြထားသည်။ ဈေးမသိသေးသောကုန်ကို သုညတန်ဖိုးဟု မတွက်ပါ။</p></div></section>
 <section class="card"><div class="card-title"><h3>ငွေသိမ်းရာအလိုက် လက်ကျန်</h3>${I('wallet')}</div>${['cash','bank','home'].map((a,i)=>`<div class="product-row"><div class="icon-box ${i===1?'blue':i===2?'amber':''}">${I(i===0?'wallet':i===1?'bank':'home')}</div><div><div class="small">${ACCOUNT_NAMES[a]}</div><strong class="num">${cashText(bal(a))}</strong></div></div>`).join('')}
 <div class="summary-line total"><span>ငွေသိမ်းရာအားလုံး စုစုပေါင်း</span><strong style="font-size:19px">${cashText(bal('cash')+bal('bank')+bal('home'))}</strong></div>
 <div class="mt">${note('ဤနမူနာတွင် “အိမ်” ကို လုပ်ငန်း၏ ငွေသိမ်းရာတစ်ခုအဖြစ်သာ သတ်မှတ်ထားသည်။ ပိုင်ရှင်ကိုယ်ပိုင်ငွေလားဆိုတာ အတည်ပြုရန် လိုသည်။','amber')}</div></section></div>
 <div class="grid cols-2"><section class="card"><div class="card-title"><h3>စောင့်ကြည့်ရမည့်အချက်များ</h3>${I('bell')}</div>
 <div class="queue-row"><div class="icon-box amber">${I('wallet')}</div><div class="grow"><strong class="small">အပ်ကုန်များအတွက် ကြိုသုံးထားငွေ</strong><div class="small muted">မဝယ်ရသေးသောကုန်နှင့် ဆက်စပ်ထားသည်။</div></div><strong class="small">${cashText(advanceTotal())}</strong></div>
 <div class="queue-row"><div class="icon-box blue">${I('truck')}</div><div class="grow"><strong class="small">ရောင်းပြီး မထုတ်ရသေးသောကုန်</strong><div class="small muted">ပွဲရုံပိုင်အဖြစ် ထပ်မရောင်းရပါ။</div></div><strong class="small">${vissText37(stock('customer'))} ပိဿာ</strong></div>
 ${state.opening.difference?`<div class="queue-row"><div class="icon-box amber">${I('info')}</div><div class="grow"><strong class="small">အဖွင့်ငွေ ကွာဟချက်</strong><div class="small muted">${E(state.opening.note)}</div></div><strong class="danger-text small">${cashText(state.opening.difference)}</strong></div>`:''}
 <div class="queue-row"><div class="icon-box gray">${I('doc')}</div><div class="grow"><strong class="small">ငွေမရသေးသော ငွေယူလက်မှတ်</strong><div class="small muted">လက်မှတ်ပေးထားရုံဖြင့် လက်ကျန်မတိုးပါ။</div></div><strong class="small">${pending.length} စောင်</strong></div></section>
 <section class="card"><div class="card-title"><h3>ယနေ့ လုပ်ဆောင်ချက်များ</h3>${pill(state.activity.length+' ခု','gray')}</div>${state.activity.length?state.activity.slice(0,4).map(a=>`<div class="audit-row"><span class="time">${a.time}</span><div class="small">${E(a.text)}</div></div>`).join(''):empty('စမ်းသပ်လုပ်ဆောင်ချက် မရှိသေးပါ။','clock')}</section></div></div>`;
}
function profitPage(){
 const sales=state.sales.filter(s=>s.date===today()),revenue=sales.reduce((a,s)=>a+s.total,0),cost=sales.reduce((a,s)=>a+s.cost,0),expenses=state.expenses.filter(x=>x.date===today()).reduce((a,x)=>a+x.amount,0),profit=revenue-cost-expenses;
 return heading('ပိုင်ရှင်အတွက်','အရှုံးအမြတ် · နမူနာတွက်ချက်မှု','အတည်ပြုထားသော အမြတ်အစီရင်ခံစာ မဟုတ်ပါ။ တွက်ချက်ပုံကို စမ်းကြည့်ရန်သာ ဖြစ်သည်။',pill('တွက်ချက်နည်း အတည်ပြုရန်ကျန်','amber'))+
 `<div class="mb">${note('ဝယ်ရင်းကုန်ဖိုး၊ လုပ်သားခခံယူသူနှင့် ကုန်ကျစရိတ်သတ်မှတ်ပုံ မအတည်ပြုရသေးပါ။ အောက်ပါအမြတ်သည် နမူနာကုန်ဖိုးနှင့် မှတ်ထားသောအသုံးစရိတ်ကိုသာ အခြေခံထားသည်။','amber')}</div>
 <div class="grid cols-3 mb">${stat('ယနေ့ ကုန်ရောင်းတန်ဖိုး',M(revenue),'ကျပ်','sale','ငွေမရသေးသော အရောင်းလည်းပါဝင်')}${stat('နမူနာ ရောင်းကုန်ဝယ်ရင်း',M(cost),'ကျပ်','stock','ရွေးထားသောကုန်အုပ်စု၏ နမူနာဝယ်ရင်းနှုန်း')}${stat('ယာယီ အမြတ် / အရှုံး',M(profit),'ကျပ်','chart','အတည်ပြုချက်မဟုတ် · နမူနာတွက်ချက်မှု')}</div>
 <div class="main-grid"><section class="card"><h3>နမူနာတွက်ချက်ပုံ</h3><div class="summary-line mt"><span>ကုန်ရောင်းတန်ဖိုး</span><strong>${cashText(revenue)}</strong></div><div class="summary-line"><span>နုတ် — ရောင်းပြီးကုန်၏ နမူနာဝယ်ရင်း</span><strong>${cashText(cost)}</strong></div><div class="summary-line"><span>အကြမ်းအမြတ်</span><strong>${cashText(revenue-cost)}</strong></div><div class="summary-line"><span>နုတ် — သီးခြားမှတ်ထားသော လုပ်ငန်းအသုံးစရိတ်</span><strong>${cashText(expenses)}</strong></div><div class="summary-line total"><span>ယာယီ အမြတ် / အရှုံး</span><strong>${cashText(profit)}</strong></div></section>
 <section class="card"><h3>ဤတွက်ချက်မှုထဲ မပေါင်းထားပါ</h3><p class="small muted mt">ကြိုရှင်းငွေ၊ အကြွေးပြန်ရှင်းငွေနှင့် အိမ် / ပွဲရုံ ငွေရွှေ့ခြင်းတို့ကို အရောင်းအသစ် သို့မဟုတ် ကုန်ကျစရိတ်အသစ်အဖြစ် မထည့်ထားပါ။</p><div class="mt">${note('လုပ်သားခနုတ်ငွေကို ဝင်ငွေအဖြစ် အလိုအလျောက် မယူထားပါ။ စာရင်းကိုင်သတ်မှတ်ချက် အတည်ပြုပြီးမှ အမြတ်အစီရင်ခံစာ အပြီးသတ်နိုင်ပါမယ်။')}</div></section></div>
 <section class="card mt"><h3>ယနေ့အရောင်း အခြေခံစာရင်း</h3>${sales.length?`<div class="table-wrap mt"><table><thead><tr><th>ဝယ်သူ / ကုန်</th><th class="right">ရောင်းတန်ဖိုး</th><th class="right">နမူနာဝယ်ရင်း</th><th class="right">ခြားနားငွေ</th></tr></thead><tbody>${sales.map(s=>`<tr><td><strong>${E(s.name)}</strong><div class="sub">${E(s.product)} · ${vissText37(s.qty)} ပိဿာ</div></td><td class="right">${cashText(s.total)}</td><td class="right">${cashText(s.cost)}</td><td class="right">${cashText(s.total-s.cost)}</td></tr>`).join('')}</tbody></table></div>`:empty('ယနေ့အရောင်းအသစ် မတင်ရသေးပါ။ စာရေးမမြင်ကွင်းမှာ အရောင်းတစ်ခု စမ်းတင်ကြည့်ပါ။','chart')}</section>`;
}

function openModal(title,subtitle,body,footer='',wide=false){
 clearToast();
 const root=document.getElementById('modalRoot');
 if(!root.classList.contains('visible'))modalReturnFocus=document.activeElement;
 root.innerHTML=`<section class="modal ${wide?'wide':''}"><header class="modal-head"><div><h2 id="modalTitle">${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div><button type="button" class="btn-icon" aria-label="ပိတ်ရန်" onclick="closeModal()">${I('close')}</button></header><div class="modal-body"><div id="modalError" class="form-error" role="alert"></div>${body}</div>${footer?`<footer class="modal-footer">${footer}</footer>`:''}</section>`;
 root.classList.add('visible');document.body.style.overflow='hidden';
 setTimeout(()=>{const el=root.querySelector('input:not([readonly]),select,textarea,.modal-footer button,.modal-head button');if(el)el.focus({preventScroll:true});},30);
}
function closeModal(){
 document.getElementById('modalRoot').classList.remove('visible');document.getElementById('modalRoot').innerHTML='';document.body.style.overflow='';
 if(modalReturnFocus&&modalReturnFocus.isConnected)modalReturnFocus.focus({preventScroll:true});
}
function error(text){
 const el=document.getElementById('modalError');
 if(!el){toast(text,true);return false;}el.style.display='block';el.textContent=text;el.scrollIntoView({block:'nearest',behavior:'smooth'});return false;
}
function validForm(id){const f=document.getElementById(id);return f?f.reportValidity():true;}
function number(id){const el=document.getElementById(id);if(!el||el.value.trim()==='')return NaN;return Number(el.value);}
function value(id){return document.getElementById(id)?.value.trim()||'';}
function field(label,id,opts={}){
 // Allow two decimal places for weight, while bag counts, prices and MMK stay unchanged.
 const type=opts.type||'text', isWeight=isWeightField37(label,id,{...opts,type});
 if(isWeight){
  const val=opts.value;
  opts={...opts,step:0.01,min:opts.min===undefined?0:Math.max(0,opts.min<0.01&&opts.min>0?0.01:opts.min),
   value:(val!==undefined&&val!==null&&val!==''&&Number.isFinite(Number(val)))?Number(val).toFixed(2):(val??''),
   placeholder:opts.placeholder||'ဥပမာ 60.25'};
 }
 const suffix=opts.suffix,help=opts.help;
 const input=`<input id="${id}" ${opts.name?`name="${opts.name}"`:''} type="${type}" ${opts.required?'required':''} ${opts.readonly?'readonly':''} ${opts.min!==undefined?`min="${opts.min}"`:''} ${opts.max!==undefined?`max="${opts.max}"`:''} ${type==='number'?`step="${opts.step??1}" inputmode="decimal"`:''} ${isWeight?'data-viss-weight="1"':''} value="${E(opts.value??'')}" placeholder="${E(opts.placeholder||'')}" ${opts.extra||''}>`;
 const sample=isWeight?`<p class="field-help viss-weight-guide" data-weight-guide="${id}">${opts.value!==''&&Number.isFinite(Number(opts.value))?vissBreakdown37(opts.value):'ဥပမာ 60.25 = 60 ပိဿာ 25 ကျပ်သား'}</p>`:'';
 return `<div class="field"><label for="${id}">${label}${opts.required?'<span class="req">*</span>':''}</label>${suffix?`<div class="input-suffix">${input}<span>${suffix}</span></div>`:input}${sample}${help?`<p class="field-help">${help}</p>`:''}</div>`;
}
function selectField(label,id,options,selected='',extra=''){
 return `<div class="field"><label for="${id}">${label}</label><select id="${id}" ${extra}>${options.map(([v,t])=>`<option value="${E(v)}" ${String(v)===String(selected)?'selected':''}>${E(t)}</option>`).join('')}</select></div>`;
}
function accountField(id,selected='cash',label='ငွေသိမ်းရာ / ပေးချေမှု'){
 return selectField(label,id,[['cash',ACCOUNT_NAMES.cash],['bank',ACCOUNT_NAMES.bank]],selected);
}
function steps(active,names=['အကြမ်းမှတ်','အချောဖြည့်','ဈေးနှင့်ဝယ်ယူ']){
 return `<div class="wizard-steps">${names.map((n,i)=>`<div class="wizard-item ${i===active?'active':i<active?'done':''}"><span class="wizard-num">${i<active?I('check','sm'):i+1}</span><span>${n}</span></div>`).join('')}</div>`;
}
function rSummary(r){
 return `<div class="summary-box mb"><div class="row between wrap"><div><strong>${E(r.name)}</strong><div class="small muted">${r.type==='farmer'?'ကုန်သည်':'ကုန်သည်'} · ${E(r.car)||'ကားနံပါတ် မထည့်ရသေး'}</div></div><div class="right"><strong>${E(r.product)} · အဆင့် ${r.grade}</strong><div class="small muted">${N(r.bags)} အိတ် · ${vissText37(r.qty)} ပိဿာ</div></div></div></div>`;
}
function openCashCheck(){
 if(!canViewAccount68('cash'))return toast('ဤငွေသိမ်းရာကို ကြည့်ခွင့်မရှိပါ။',true);
 const o=state.opening;
 if(o.checked){
  openModal('အဖွင့်ငွေ စစ်ထားသောမှတ်တမ်း',dayLabel(),`<div class="summary-box"><div class="summary-line"><span>မနေ့က စာရင်းပိတ်လက်ကျန်</span><strong>${cashText(o.expected)}</strong></div><div class="summary-line"><span>ယနေ့ ရေတွက်ရရှိငွေ</span><strong>${cashText(o.actual)}</strong></div><div class="summary-line total"><span>ကွာဟချက်</span><strong>${cashText(o.difference)}</strong></div></div><p class="field-help mt">မှတ်ချက် — ${E(o.note)||'ငွေစာရင်း ကိုက်ညီသည်။'}</p><div class="mt">${note('ငွေစစ်ခြင်းသည် အရင်းငွေအသစ်ထည့်ခြင်း မဟုတ်ပါ။ ရေတွက်ရရှိငွေကို မှတ်ထားပြီး စာရင်းလက်ကျန်ကို အလိုအလျောက် မပြင်ထားပါ။')}</div>`,btn('ပိတ်မယ်','closeModal()','primary','check'));return;
 }
 openModal('မနက် အဖွင့်ငွေ စစ်မယ်','အံဆွဲထဲက ငွေကို ရေတွက်ပြီး ထည့်ပါ။',
 `<div class="balance-big"><div class="label">မနေ့က စာရင်းပိတ်လက်ကျန်</div><div class="value num">${accountValue68('cash',o.expected,M)} <small>ကျပ်</small></div><div class="small muted">စနစ်ထဲမှာ ရှိပြီးသား လက်ကျန်ဖြစ်ပါတယ်။</div></div>
 <form id="openingForm" onsubmit="event.preventDefault();saveOpening()">${field('အခု တကယ်ရေတွက်ရရှိသောငွေ','openingActual',{type:'number',min:0,required:true,suffix:'ကျပ်',placeholder:'ရေတွက်ရရှိငွေ ရိုက်ထည့်ပါ',extra:'oninput="updateOpeningDiff()"'})}
 <div id="openingDiff"></div><div id="openingNoteWrap" style="display:none;margin-top:18px">${field('ကွာဟချက် မှတ်ချက်','openingNote',{placeholder:'ငွေပို / ငွေလို ဖြစ်နေသည့်အကြောင်း မှတ်ထားပါ'})}</div></form>
 <div class="mt">${note('စာရင်းငွေနဲ့ တကယ်ရှိငွေကို နှိုင်းယှဉ်စစ်တာပါ။ အဖွင့်ငွေကို နောက်တစ်ကြိမ် ဝင်ငွေအဖြစ် မတိုးပါ။')}</div>`,
 btn('နောက်မှ စစ်မယ်','closeModal()','secondary')+btn('ငွေစစ်ချက် သိမ်းမယ်','saveOpening()','primary','check','id="saveOpeningBtn"'));
}
function updateOpeningDiff(){
 const a=number('openingActual');if(!Number.isFinite(a)){document.getElementById('openingDiff').innerHTML='';return;}
 const d=a-state.opening.expected;
 document.getElementById('openingDiff').innerHTML=`<div class="result-banner ${d?'mismatch':''}">${d?`ငွေ${d>0?'ပို':'လို'} ${cashText(Math.abs(d))}`:'ငွေစာရင်း ကိုက်ညီပါတယ်။'}</div>`;
 document.getElementById('openingNoteWrap').style.display=d?'block':'none';
}
function saveOpening(){
 if(!validForm('openingForm'))return;const actual=number('openingActual'),d=actual-state.opening.expected;
 if(!Number.isFinite(actual)||actual<0)return error('ရေတွက်ရရှိငွေကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။');
 if(d&&!value('openingNote'))return error('ငွေကွာဟနေသည့်အတွက် မှတ်ချက်ထည့်ပါ။ စာရင်းလက်ကျန်ကို အလိုအလျောက် မပြင်ပါ။');
 state.opening={...state.opening,checked:true,actual,difference:d,note:value('openingNote')};
 activity('ယနေ့အဖွင့်ငွေ စစ်ဆေးပြီး '+(d?'ကွာဟချက် '+cashText(d)+' မှတ်တမ်းတင်ခဲ့သည်။':'ငွေစာရင်းကိုက်ညီသည်။'));
 save();closeModal();render();toast(d?'ကွာဟချက်နှင့် ငွေစစ်မှတ်တမ်းကို သိမ်းပြီးပါပြီ။':'အဖွင့်ငွေ ကိုက်ညီပါတယ်။ အလုပ်စနိုင်ပါပြီ။');
}
function startReceipt(){
 if(!guardWork())return;
 openModal('ကုန်အသစ် လက်ခံမယ်','ပထမဦးဆုံး အကြမ်းမှတ်ထားမယ်။ ကျန်တာကို နောက်အဆင့်မှာ ဆက်ဖြည့်နိုင်ပါတယ်။',
 `${steps(0)}<form id="newReceiptForm" onsubmit="event.preventDefault();saveNewReceipt(true)">
 <div class="field-row"><input type="hidden" id="newType" value="trader">${field('ကုန်လာချသူ အမည်','newName',{required:true,placeholder:'အမည် ရိုက်ထည့်ပါ',extra:'list="supplierNames" maxlength="80"'})}</div>
 <datalist id="supplierNames">${[...new Set(state.receipts.map(r=>r.name))].map(n=>`<option value="${E(n)}"></option>`).join('')}</datalist>
 <div class="field-row">${selectField('ကုန်အမျိုးအစား','newProduct',PRODUCTS.map(p=>[p,p]))}${selectField('အရည်အသွေး','newGrade',['A','B','C'].map(g=>[g,'အဆင့် '+g]))}</div>
 <div class="field-row">${field('အိတ်အရေအတွက်','newBags',{type:'number',min:1,required:true,suffix:'အိတ်',placeholder:'ဥပမာ 10'})}${field('စုစုပေါင်း အလေးချိန်','newQty',{type:'number',min:.001,step:.001,required:true,suffix:'ပိဿာ',placeholder:'ချိန်ထားသည့် အလေးချိန်'})}</div>
 <div id="sourceField">${selectField('အလေးချိန်ရရှိပုံ','newSource',[['scale','ကတ္တားဖြင့် တကယ်ချိန်ထားသည်']])}</div>
 </form>${note('အိတ်နှင့် ပိဿာကို သီးခြားဖြည့်ပါ။ တစ်အိတ်အလေးချိန်ကို ပုံသေသတ်မှတ်ပြီး အလိုအလျောက် မပြောင်းပါ။')}`,
 btn('အကြမ်းပဲ သိမ်းမယ်','saveNewReceipt(false)','secondary','note')+btn('သိမ်းပြီး အချောဆက်ဖြည့်မယ်','saveNewReceipt(true)','primary','arrow','id="saveReceiptNext"'),true);
}
function updateReceiptSource(){
 const farmer=value('newType')==='farmer';
 document.getElementById('sourceField').innerHTML=selectField('အလေးချိန်ရရှိပုံ','newSource',farmer?[['scale','ကတ္တားဖြင့် တကယ်ချိန်ထားသည်']]:[['declared','ကုန်သည်ပေးလာသော အလေးချိန်'],['reweighed','လိုအပ်သဖြင့် ပြန်ချိန်ထားသည်']]);
}
function saveNewReceipt(next){
 if(!guardWork()||!validForm('newReceiptForm'))return;
 const qty=number('newQty'),bags=number('newBags');
 if(!value('newName'))return error('ကုန်လာချသူ အမည်ထည့်ပါ။');
 if(!Number.isFinite(qty)||qty<=0||!Number.isInteger(bags)||bags<=0)return error('ပိဿာကို သုညထက်ပို၍၊ အိတ်အရေအတွက်ကို အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
 const id=uid('R'),r={id,no:'အလ-'+String(state.counter).padStart(3,'0'),date:today(),name:value('newName'),type:value('newType'),product:value('newProduct'),grade:value('newGrade'),bags,qty,source:value('newSource'),car:'',status:'draft',price:null,advance:0,wage:0,weigh:0,paid:0,note:''};
 state.receipts.unshift(r);state.lots.push({id:uid('L'),product:r.product,grade:r.grade,qty,bags,owner:'supplier',name:r.name,cost:0,receiptId:id});
 move(r.product,r.grade,qty,bags,'in',r.no);activity(r.name+' ထံမှ '+r.product+' '+vissText37(qty)+' ပိဿာ လက်ခံအကြမ်းမှတ်ခဲ့သည်။');
 save();render();if(next)openReceiptDetailForm(id);else{closeModal();toast('အကြမ်းမှတ်တမ်း သိမ်းပြီးပါပြီ။ နောက်မှ အချောဆက်ဖြည့်နိုင်ပါတယ်။');}
}
function openReceiptProcess(id){
 if(!guardWork())return;
 const r=state.receipts.find(x=>x.id===id);if(!r)return;
 if(r.status==='purchased')return openReceiptDetail(id);
 if(r.status==='draft')return openReceiptDetailForm(id);
 openPricing(id);
}
function openReceiptDetailForm(id){
 const r=state.receipts.find(x=>x.id===id);
 openModal('အချောစာရင်း ဆက်ဖြည့်မယ်','အကြမ်းမှတ်ထားသော အမည်၊ ကုန်နဲ့ အလေးချိန်ကို ပြန်မရိုက်ရပါ။',
 `${steps(1)}${rSummary(r)}<form id="receiptDetailForm" onsubmit="event.preventDefault();saveReceiptDetail('${id}',true)">
 ${field('လာချသော ကားနံပါတ်','detailCar',{value:r.car,placeholder:'ဥပမာ MDY 7A-1234',extra:'maxlength="40"'})}
 <div class="field"><label for="detailNote">မှတ်ချက်</label><textarea id="detailNote" maxlength="400" placeholder="လိုအပ်သည့်အကြောင်းအရာသာ မှတ်ပါ။">${E(r.note)}</textarea></div>
 </form><div class="summary-box mt"><div class="row between wrap"><div><div class="small muted">ပေးပြီးသား ကြိုရှင်းငွေ</div><strong>${cashText(r.advance)}</strong></div>${smallbtn('ကြိုငွေ ထုတ်ပေးမယ်',`saveDraftDetailsAndAdvance('${id}')`,'secondary','wallet')}</div></div>
 <div class="mt">${note('ဈေးမထွက်သေးလည်း အချောစာရင်း သိမ်းနိုင်ပါတယ်။ ဈေးသိရတဲ့အချိန်မှာ အဲဒီမှတ်တမ်းကိုပဲ ဆက်လုပ်ပါမယ်။')}</div>`,
 btn('သိမ်းပြီး ဈေးစောင့်မယ်',`saveReceiptDetail('${id}',false)`,'secondary','clock')+btn('ဈေး / ဆုံးဖြတ်ချက် ဆက်မယ်',`saveReceiptDetail('${id}',true)`,'primary','arrow'),true);
}
function saveDraftDetailsAndAdvance(id){
 const r=state.receipts.find(x=>x.id===id);r.car=value('detailCar');r.note=value('detailNote');save();openAdvance(id,'detail');
}
function saveReceiptDetail(id,next){
 if(!guardWork())return;
 const r=state.receipts.find(x=>x.id===id);r.car=value('detailCar');r.note=value('detailNote');if(r.status==='draft')r.status='await';save();render();
 if(next)openPricing(id);else{closeModal();toast('အချောစာရင်း သိမ်းပြီး ဈေးစောင့်စာရင်းထဲ ထည့်ထားပါပြီ။');}
}
function openPricing(id){
 const r=state.receipts.find(x=>x.id===id),rate=state.prices[r.product+'|'+r.grade]||((r.priceDate||r.date)===today()?r.price:'')||'';
 openModal('ဈေးသတ်မှတ်ပြီး ဆုံးဖြတ်မယ်','ဈေးကြိုက်မှ ပွဲရုံက ဝယ်ယူမယ်။ မကြိုက်လျှင် အပ်ထားနိုင်ပါတယ်။',
 `${steps(2)}${rSummary(r)}${r.price&&(r.priceDate||r.date)!==today()?`<div class="mb">${note(`ယခင် ${shortDate(r.priceDate||r.date)} တွင် မှတ်ထားသည့်ဈေး ${cashText(r.price)} ဖြစ်သည်။ ယနေ့သဘောတူဈေးကို ပြန်အတည်ပြုပါ။ ယခင်ဈေးကို အလိုအလျောက် မသုံးထားပါ။`,'amber')}</div>`:''}
 <form id="pricingForm" onsubmit="event.preventDefault();beginPurchase('${id}')">
 ${field('ယခုတွက်မည့် တစ်ပိဿာဈေး','receiptPrice',{type:'number',min:1,value:rate,suffix:'ကျပ်',placeholder:'ဈေးမသိသေးလျှင် အလွတ်ထားပါ',extra:`oninput="updatePricePreview('${id}')"`,help:'နမူနာတွင် တစ်ပိဿာနှုန်းဖြင့် တွက်ထားသည်။ ပေါက်ဈေးနှင့် တွက်ဈေးကွာခြားမှုကို အတည်ပြုရန်ကျန်သည်။'})}
 <div id="pricePreview"></div></form>
 <div class="row between wrap mt"><span class="small muted">ပေးပြီးသား ကြိုငွေ — <strong>${cashText(r.advance)}</strong></span>${smallbtn('ကြိုငွေ ထုတ်ပေးမယ်',`openAdvance('${id}','pricing')`,'secondary','wallet')}</div>
 <div class="divider"></div><div class="choice-grid"><div class="choice"><span class="icon-box blue">${I('stock')}</span><div><strong>မရောင်းသေးဘဲ အပ်ထားမယ်</strong><small>ကုန်ပိုင်ရှင် မပြောင်းပါ။ ကုန်ဝင်လည်း ထပ်မတိုးပါ။</small></div></div><div class="choice selected"><span class="icon-box">${I('check')}</span><div><strong>ဈေးကြိုက်လို့ ရောင်းမယ်</strong><small>နုတ်ငွေတွက်ပြီး အဝယ်ဘောက်ချာထုတ်ပါမယ်။</small></div></div></div>`,
 btn('အပ်ထားမယ်',`saveDeposit('${id}')`,'secondary','stock')+btn('ဝယ်ယူပြီး ငွေရှင်းမယ်',`beginPurchase('${id}')`,'primary','arrow'),true);
 updatePricePreview(id);
}
function updatePricePreview(id){
 const r=state.receipts.find(x=>x.id===id),p=number('receiptPrice');
 document.getElementById('pricePreview').innerHTML=Number.isFinite(p)&&p>0?`<div class="summary-box"><div class="summary-line"><span>${vissText37(r.qty)} ပိဿာ × ${M(p)} ကျပ်</span><strong>${cashText(r.qty*p)}</strong></div><p class="field-help">နုတ်ငွေမနုတ်ရသေးသော ကုန်ဖိုး ဖြစ်ပါတယ်။</p></div>`:note('ဈေးမသတ်မှတ်ရသေးပါ။ သုညကျပ်ဖြင့် ဝယ်ထားတာ မဟုတ်ပါ။','amber');
}
function saveDeposit(id){
 if(!guardWork())return;
 const raw=value('receiptPrice'),p=number('receiptPrice');
 if(raw!==''&&(!Number.isFinite(p)||p<=0))return error('ဈေးနှုန်းသည် သုညထက်ပိုရပါမည်။ ဈေးမသိသေးပါက အလွတ်ထားပါ။');
 const r=state.receipts.find(x=>x.id===id);r.price=raw===''?null:p;r.priceDate=raw===''?null:today();r.status=raw===''?'await':'deposit';
 activity(r.name+' ၏ '+r.product+' ကို '+(r.status==='await'?'ဈေးစောင့်':'အပ်ကုန်')+'အဖြစ် မှတ်ခဲ့သည်။');save();closeModal();render();toast('ကုန်ပိုင်ရှင် မပြောင်းဘဲ အပ်ကုန်စာရင်းမှာ သိမ်းထားပါပြီ။');
}
function beginPurchase(id){
 if(!guardWork())return;const p=number('receiptPrice');
 if(!Number.isFinite(p)||p<=0)return error('ဝယ်ယူရန် ဈေးနှုန်းအရင်ထည့်ပါ။ ဈေးမသိသေးပါက အပ်ထားနိုင်ပါတယ်။');
 wizard={type:'purchase',id,price:p};openPurchaseSettlement();
}
function openPurchaseSettlement(){
 const r=state.receipts.find(x=>x.id===wizard.id),price=wizard.price,net=Math.round(r.qty*price)-r.wage-r.weigh-r.advance;
 openModal('အဝယ်ဘောက်ချာနှင့် ငွေရှင်းခြင်း','ကြိုသုံးထားငွေကို ပြန်မထုတ်ပါ။ ယခုရှင်းရမည့်ငွေကိုသာ ထုတ်ပေးပါမယ်။',
 `${rSummary(r)}<form id="purchaseForm" onsubmit="event.preventDefault();commitPurchase()"><div class="field-row">
 ${field('လုပ်သားခ နုတ်ငွေ','purchaseWage',{type:'number',min:0,value:r.wage,suffix:'ကျပ်',required:true,extra:'oninput="updatePurchaseTotal()"'})}
 ${field('ချိန်ခ / သီးခြားလုပ်အားခ နုတ်ငွေ','purchaseWeigh',{type:'number',min:0,value:r.weigh,suffix:'ကျပ်',required:true,extra:'oninput="updatePurchaseTotal()"'})}</div>
 <details class="details mb"><summary>ကိုင်ခ နမူနာတွက်ကြည့်မယ်</summary><p>တစ်အိတ် = နှစ်ပိုင်း။ ကိုင်သည့်အကြိမ်နှင့် တစ်ခါကိုင်နှုန်းကို ကိုယ်တိုင်ဖြည့်ပါ။ ကုန်သည်အလိုက် နောက်ဆုံးတွက်ပုံ အတည်ပြုရန်လိုသည်။</p>
 <div class="field-row mt">${field('ကိုင်သည့်အကြိမ်','handlingTimes',{type:'number',min:1,value:1})}${field('တစ်ပိုင်း တစ်ခါကိုင်နှုန်း','handlingRate',{type:'number',min:0,value:100,suffix:'ကျပ်'})}</div>${smallbtn('နမူနာတွက်ပြီး နုတ်ငွေထဲထည့်မယ်','applyHandling()','secondary','scale')}</details>
 <div id="purchaseSummary" class="summary-box mb"></div><div class="field-row">${accountField('purchaseAccount')}${field('ယခု ထုတ်ပေးမည့်ငွေ','purchasePay',{type:'number',min:0,value:Math.max(0,net),required:true,suffix:'ကျပ်',extra:'oninput="this.dataset.edited=\'1\';updatePurchaseTotal()"',help:'သုညထားလျှင် နောက်မှငွေရှင်းရန် ကျန်ပါမယ်။'})}</div></form>
 ${note('နမူနာတွင် တစ်စိတ်တစ်ပိုင်း ငွေရှင်းနိုင်အောင် ပြထားသည်။ အကြွေးနှင့် လုပ်သားခခံယူသူဆိုင်ရာ စည်းမျဉ်းကို အတည်ပြုရန်လိုပါသည်။','amber')}`,
 btn('နောက်ပြန်',`openPricing('${r.id}')`,'secondary','back')+btn('ဘောက်ချာထုတ်ပြီး သိမ်းမယ်','commitPurchase()','primary','check','id="commitPurchaseBtn"'),true);
 updatePurchaseTotal();
}
function applyHandling(){
 const r=state.receipts.find(x=>x.id===wizard.id),times=number('handlingTimes'),rate=number('handlingRate');
 if(!Number.isFinite(times)||times<1||!Number.isInteger(times)||!Number.isFinite(rate)||rate<0)return error('ကိုင်သည့်အကြိမ်နှင့် နှုန်းထားကို မှန်ကန်စွာ ထည့်ပါ။');
 document.getElementById('purchaseWage').value=Math.round(r.bags*2*times*rate);updatePurchaseTotal();
}
function updatePurchaseTotal(){
 const r=state.receipts.find(x=>x.id===wizard.id),g=Math.round(r.qty*wizard.price),w=number('purchaseWage')||0,h=number('purchaseWeigh')||0,net=g-w-h-r.advance;
 const input=document.getElementById('purchasePay');if(!input.dataset.edited)input.value=Math.max(0,net);
 const pay=number('purchasePay')||0;
 document.getElementById('purchaseSummary').innerHTML=`<div class="summary-line"><span>ကုန်ဖိုး (${vissText37(r.qty)} ပိဿာ × ${M(wizard.price)} ကျပ်)</span><strong>${cashText(g)}</strong></div><div class="summary-line"><span>လုပ်သားခနှင့် လုပ်အားခ နုတ်ငွေ</span><strong>− ${cashText(w+h)}</strong></div><div class="summary-line"><span>ပေးပြီးသား ကြိုရှင်းငွေ</span><strong>− ${cashText(r.advance)}</strong></div><div class="summary-line total"><span>အသားတင် ရှင်းရန်ငွေ</span><strong>${cashText(net)}</strong></div><div class="summary-line"><span>ယခုရှင်းပြီးနောက် ကျန်ငွေ</span><strong class="${net-pay<0?'danger-text':''}">${cashText(net-pay)}</strong></div>`;
}
function commitPurchase(){
 if(!guardWork()||!validForm('purchaseForm'))return;
 const r=state.receipts.find(x=>x.id===wizard.id);
 if(r.status==='purchased')return error('ဤကုန်ကို ဝယ်ယူပြီးသား ဖြစ်ပါတယ်။ အဝယ်နှစ်ခါ မတင်နိုင်ပါ။');
 const wage=number('purchaseWage'),weigh=number('purchaseWeigh'),pay=number('purchasePay'),account=value('purchaseAccount'),net=Math.round(r.qty*wizard.price)-wage-weigh-r.advance;
 if([wage,weigh,pay].some(x=>!Number.isFinite(x)||x<0))return error('နုတ်ငွေနှင့် ပေးချေငွေသည် သုည သို့မဟုတ် အပေါင်းကိန်း ဖြစ်ရပါမယ်။');
 if(net<0)return error('ကြိုငွေနှင့် နုတ်ငွေက ကုန်ဖိုးထက် များနေပါတယ်။ ဤအခြေအနေအတွက် စည်းမျဉ်းမသတ်မှတ်ရသေးသဖြင့် နမူနာတွင် ဆက်မလုပ်နိုင်ပါ။');
 if(pay>net)return error('ယခုထုတ်ပေးမည့်ငွေက အသားတင်ရှင်းရန်ငွေထက် မများရပါ။');
 if(pay>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာမှာ ငွေမလောက်ပါ။ ပိုင်ရှင်မြင်ကွင်းမှ ငွေယူလက်မှတ်ရေးပြီး ငွေလက်ခံပါ၊ သို့မဟုတ် ပေးချေမှုကို ပြန်ရွေးပါ။');
 const lot=state.lots.find(l=>l.receiptId===r.id&&l.owner==='supplier');
 if(!lot)return error('ဆက်စပ်အပ်ကုန် မတွေ့ပါ။ နမူနာဒေတာကို ပြန်စစ်ပါ။');
 r.price=wizard.price;r.priceDate=today();r.wage=wage;r.weigh=weigh;r.paid=pay;r.status='purchased';r.purchaseDate=today();r.purchaseNo='အဝ-'+String(++state.counter).padStart(3,'0');
 lot.owner='owned';lot.name='ပွဲရုံပိုင်';lot.cost=r.price;
 txn(account,-pay,'ကုန်ဝယ် ငွေရှင်းခြင်း',r.purchaseNo,r.name);
 activity(r.name+' ထံမှ '+r.product+' ဝယ်ယူပြီး '+cashText(pay)+' ရှင်းပေးခဲ့သည်။');
 save();closeModal();render();toast('အဝယ်သိမ်းပြီးပါပြီ။ ပိုင်ဆိုင်မှုသာပြောင်းပြီး မြေပြင်ကုန်ဝင် ထပ်မတိုးပါ။');
 openReceiptDetail(r.id);
}
function openAdvance(id,back='detail'){
 if(!guardWork())return;const r=state.receipts.find(x=>x.id===id);
 if(r.status==='purchased')return error('ဝယ်ပြီးသားစာရင်းအတွက် ငွေရှင်းခြင်းကို သုံးပါ။');
 openModal('ကြိုငွေ ထုတ်ပေးမယ်',`${E(r.name)} · ${E(r.product)} · ${r.no}`,
 `${rSummary(r)}<form id="advanceForm" onsubmit="event.preventDefault();saveAdvance('${id}','${back}')">
 <div class="field-row">${selectField('ကြိုယူသည့်အကြောင်းအရာ','advanceReason',[['အသုံး','အသုံးအတွက် ကြိုယူခြင်း'],['ကားခ','ကားခရှင်းရန် ကြိုယူခြင်း']])}${accountField('advanceAccount')}</div>
 ${field('ယခု ကြိုသုံးမည့်ငွေ','advanceAmount',{type:'number',min:1,required:true,suffix:'ကျပ်',help:'ပေးပြီးသား ကြိုငွေ '+cashText(r.advance)+' ရှိသည်။'})}</form>
 ${note('ဤငွေကို ထုတ်ပေးချိန်မှာ ငွေလက်ကျန် လျော့မယ်။ အဝယ်ငွေရှင်းချိန်မှာ ပြန်နုတ်ပေမဲ့ ငွေထွက်ကို နှစ်ခါ မမှတ်ပါ။')}`,
 btn('နောက်ပြန်',back==='detail'?`openReceiptDetailForm('${id}')`:`openPricing('${id}')`,'secondary','back')+btn('ကြိုငွေ ထုတ်ပေးပြီး သိမ်းမယ်',`saveAdvance('${id}','${back}')`,'primary','check'));
}
function saveAdvance(id,back){
 if(!guardWork()||!validForm('advanceForm'))return;const r=state.receipts.find(x=>x.id===id),amount=number('advanceAmount'),account=value('advanceAccount'),reason=value('advanceReason');
 if(!Number.isFinite(amount)||amount<=0)return error('ထုတ်ပေးမည့်ငွေကို သုညထက်ပို၍ ထည့်ပါ။');
 if(amount>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာမှာ ငွေမလောက်ပါ။');
 r.advance+=amount;(r.advanceDetails??=[]).push({amount,account,reason,date:today()});
 txn(account,-amount,'ကြိုရှင်းငွေ — '+reason,r.no,r.name);activity(r.name+' ကို '+reason+'အတွက် '+cashText(amount)+' ကြိုသုံးခဲ့သည်။');
 save();render();toast('ကြိုငွေမှတ်တမ်းကို သက်ဆိုင်ရာအပ်ကုန်နဲ့ ချိတ်ထားပါပြီ။');
 if(back==='detail')openReceiptDetailForm(id);else openPricing(id);
}
function openPurchasePayment(id){
 if(!guardWork())return;const r=state.receipts.find(x=>x.id===id);
 if(due(r)<=0){toast('ငွေရှင်းပြီးသား ဖြစ်ပါတယ်။');return;}
 openModal('ကျန်ရှိသော အဝယ်ငွေ ရှင်းမယ်',`${E(r.name)} · ${r.purchaseNo||r.no}`,
 `${rSummary(r)}<div class="summary-box mb"><div class="summary-line"><span>ကုန်ဖိုး</span><strong>${cashText(gross(r))}</strong></div><div class="summary-line"><span>လုပ်သားခ / ချိန်ခနုတ်ငွေ</span><strong>${cashText(r.wage+r.weigh)}</strong></div><div class="summary-line"><span>ကြိုရှင်းငွေ + ထပ်ရှင်းပြီးငွေ</span><strong>${cashText(r.advance+r.paid)}</strong></div><div class="summary-line total"><span>ယခု ရှင်းရန်ကျန်</span><strong>${cashText(due(r))}</strong></div></div>
 <form id="purchasePayForm" onsubmit="event.preventDefault();savePurchasePayment('${id}')"><div class="field-row">${accountField('payPurchaseAccount')}${field('ယခု ထုတ်ပေးမည့်ငွေ','payPurchaseAmount',{type:'number',min:1,max:due(r),value:due(r),required:true,suffix:'ကျပ်'})}</div></form>`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ငွေရှင်းပြီး သိမ်းမယ်',`savePurchasePayment('${id}')`,'primary','check'));
}
function savePurchasePayment(id){
 if(!guardWork()||!validForm('purchasePayForm'))return;const r=state.receipts.find(x=>x.id===id),amount=number('payPurchaseAmount'),account=value('payPurchaseAccount');
 if(!Number.isFinite(amount)||amount<=0||amount>due(r))return error('ထုတ်ပေးငွေသည် သုညထက်ပိုပြီး ရှင်းရန်ကျန်ငွေထက် မများရပါ။');
 if(amount>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာမှာ ငွေမလောက်ပါ။ အိမ်မှငွေယူပြီးမှ ဆက်ရှင်းပါ။');
 r.paid+=amount;txn(account,-amount,'အဝယ်ကျန်ငွေ ရှင်းခြင်း',r.purchaseNo||r.no,r.name);activity(r.name+' ၏ အဝယ်ကျန်ငွေ '+cashText(amount)+' ရှင်းခဲ့သည်။');
 save();closeModal();render();toast('ကျန်ငွေရှင်းပြီးပါပြီ။ ကုန်စာရင်းကို ထပ်မပြောင်းပါ။');
}
function openReceiptDetail(id){
 const r=state.receipts.find(x=>x.id===id),p=r.status==='purchased';
 openModal(p?'အဝယ်ဘောက်ချာ':'ကုန်လက်ခံ / အပ်ကုန်မှတ်တမ်း',`${r.purchaseNo||r.no} · ${shortDate(r.date)}`,
 `${rSummary(r)}<div class="row between mb">${receiptStatus(r)}<span class="small muted">${r.source==='scale'?'ကတ္တားဖြင့် ချိန်ထားသည်':r.source==='reweighed'?'ပြန်ချိန်ထားသည်':'ကုန်သည်ပေးသော အလေးချိန်'}</span></div>
 <div class="summary-box"><div class="summary-line"><span>တစ်ပိဿာဈေး</span><strong>${r.price?cashText(r.price):'ဈေးမသတ်မှတ်ရသေး'}</strong></div><div class="summary-line"><span>ကုန်ဖိုး${p?'':' (ကမ်းလှမ်းဈေးဖြင့်သာ)'}</span><strong>${r.price?cashText(gross(r)):'—'}</strong></div><div class="summary-line"><span>ပေးပြီးသား ကြိုငွေ</span><strong>${cashText(r.advance)}</strong></div>${p?`<div class="summary-line"><span>လုပ်သားခ / ချိန်ခ နုတ်ငွေ</span><strong>${cashText(r.wage+r.weigh)}</strong></div><div class="summary-line"><span>ဝယ်ယူပြီးနောက် ထပ်ရှင်းပြီးငွေ</span><strong>${cashText(r.paid)}</strong></div><div class="summary-line total"><span>ရှင်းရန်ကျန်ငွေ</span><strong>${cashText(due(r))}</strong></div>`:''}</div>
 ${r.advanceDetails?.length?`<details class="details mt"><summary>ကြိုငွေထုတ်ပေးထားသော မှတ်တမ်း</summary>${r.advanceDetails.map(a=>`<div class="summary-line"><span>${shortDate(a.date)} · ${E(a.reason)}</span><strong>${cashText(a.amount)}</strong></div>`).join('')}</details>`:''}<p class="field-help mt">မှတ်ချက် — ${E(r.note)||'မရှိပါ။'}</p>`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ပုံနှိပ်မယ်',`printReceipt('${id}')`,'secondary','print')+(state.role==='staff'&&p&&due(r)>0?btn('ကျန်ငွေရှင်းမယ်',`openPurchasePayment('${id}')`,'primary','wallet'):state.role==='staff'&&!p?btn('ဆက်လုပ်မယ်',`openReceiptProcess('${id}')`,'primary','arrow'):''),true);
}
function ownedGroups(){return stockGroups(state.lots).filter(g=>g.owned>0);}
function startSale(){
 if(!guardWork())return;const groups=ownedGroups();
 if(!groups.length){toast('ရောင်းနိုင်သော ပွဲရုံပိုင်ကုန် မရှိသေးပါ။',true);return;}
 wizard={type:'sale',name:'',key:groups[0].key,qty:'',bags:'',price:state.prices[groups[0].key]||'',paid:null,account:'cash',mode:'hold',collector:'',car:''};
 openSaleStep(0);
}
function openSaleStep(step){
 const w=wizard,groups=ownedGroups(),g=groups.find(x=>x.key===w.key);
 const stepsHtml=steps(step,['ဈေးဖြတ်မယ်','ငွေလက်ခံမယ်','ကုန်သိမ်းပုံ']);
 if(step===0){
  openModal('အရောင်းအသစ် · ဈေးဖြတ်မယ်','ပွဲရုံပိုင် ရောင်းနိုင်သောကုန်ကိုပဲ ရွေးလို့ရပါတယ်။',
  `${stepsHtml}<form id="saleStep1" onsubmit="event.preventDefault();saleStep1Next()">${field('ဝယ်သူအမည်','saleName',{value:w.name,required:true,placeholder:'ဝယ်သူ အမည်ရိုက်ပါ',extra:'list="buyerNames" maxlength="80"'})}<datalist id="buyerNames">${[...new Set(state.sales.map(s=>s.name))].map(n=>`<option value="${E(n)}"></option>`).join('')}</datalist>
  ${selectField('ကုန်အမျိုးအစား / အရည်အသွေး','saleGroup',groups.map(x=>[x.key,x.product+' · အဆင့် '+x.grade]),w.key,'onchange="updateSaleAvailability()"')}
  <div id="saleAvailable" class="mb"></div><div class="field-row">${field('ရောင်းမည့် အိတ်အရေအတွက်','saleBags',{type:'number',min:1,value:w.bags,required:true,suffix:'အိတ်'})}${field('ရောင်းမည့် အလေးချိန်','saleQty',{type:'number',min:.001,step:.001,value:w.qty,required:true,suffix:'ပိဿာ',extra:'oninput="updateSaleTotalPreview()"'})}</div>
  ${field('သဘောတူထားသော တစ်ပိဿာဈေး','salePrice',{type:'number',min:1,value:w.price,required:true,suffix:'ကျပ်',extra:'oninput="updateSaleTotalPreview()"'})}<div id="saleTotalPreview"></div></form>`,
  btn('ပိတ်မယ်','closeModal()','secondary')+btn('ငွေလက်ခံမှု ဆက်မယ်','saleStep1Next()','primary','arrow'),true);
  updateSaleAvailability(false);
 }else if(step===1){
  const total=Math.round(w.qty*w.price);if(w.paid===null)w.paid=total;
  openModal('အရောင်းအသစ် · ငွေလက်ခံမယ်','ကုန်ထုတ်ခြင်းနဲ့ ငွေလက်ခံခြင်းကို သီးခြားမှတ်ပါမယ်။',
  `${stepsHtml}<div class="summary-box mb"><div class="row between"><div><strong>${E(w.name)}</strong><div class="small muted">${E(w.key.split('|')[0])} · အဆင့် ${w.key.split('|')[1]} · ${vissText37(w.qty)} ပိဿာ</div></div><strong>${N(w.bags)} အိတ်</strong></div><div class="summary-line total"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(total)}</strong></div></div>
  <form id="saleStep2" onsubmit="event.preventDefault();saleStep2Next()"><div class="field-row">${accountField('saleAccount',w.account,'လက်ခံမည့် ငွေသိမ်းရာ')}${field('ယခု လက်ခံရရှိမည့်ငွေ','salePaid',{type:'number',min:0,max:total,value:w.paid,required:true,suffix:'ကျပ်',extra:'oninput="updateSaleDuePreview()"'})}</div><div id="saleDuePreview"></div></form><div class="mt">${note('ဤနမူနာတွင် ငွေမရသေးလျှင် သုည၊ တစ်စိတ်တစ်ပိုင်းရလျှင် ရသည့်ငွေကို ဖြည့်နိုင်ပါတယ်။ အကြွေးခွင့်ပြုချက်စည်းမျဉ်းကို အတည်ပြုရန်ကျန်သည်။','amber')}</div>`,
  btn('နောက်ပြန်','captureSalePaymentAndBack()','secondary','back')+btn('ကုန်သိမ်းပုံ ဆက်ရွေးမယ်','saleStep2Next()','primary','arrow'),true);
  updateSaleDuePreview();
 }else{
  openModal('အရောင်းအသစ် · ကုန်သိမ်းပုံ ရွေးမယ်','ရောင်းပြီးပေမဲ့ ပွဲရုံမှာ ဆက်ထားနိုင်ပါတယ်။',
  `${stepsHtml}<div class="choice-grid mb"><button type="button" class="choice ${w.mode==='direct'?'selected':''}" onclick="chooseDelivery('direct')"><span class="radio-dot"></span><div><strong>ပစ္စည်းသိမ်းတင်</strong><small>အခုတစ်ခါတည်း ကားပေါ်တင်ပြီး ယူသွားမယ်။ မြေပြင်ကုန်လည်း လျော့မယ်။</small></div></button><button type="button" class="choice ${w.mode==='hold'?'selected':''}" onclick="chooseDelivery('hold')"><span class="radio-dot"></span><div><strong>သိမ်းထပ်ထား</strong><small>ဝယ်သူပိုင်ဖြစ်သွားပြီး ပွဲရုံမှာထားမယ်။ နောက်မှ လာယူမယ်။</small></div></button></div>
  ${w.mode==='direct'?`<form id="deliveryForm" onsubmit="event.preventDefault();commitSale()"><div class="field-row">${field('လာသိမ်းသူ / အလုပ်သမား အမည်','saleCollector',{value:w.collector,required:true,placeholder:'ပစ္စည်းလက်ခံယူသူ',extra:'maxlength="80"'})}${field('တင်သွားမည့် ကားနံပါတ်','saleCar',{value:w.car,placeholder:'ကားနံပါတ်',extra:'maxlength="40"'})}</div></form>`:note('ပစ္စည်းက ပွဲရုံထဲမှာရှိနေမယ်။ ဒါပေမဲ့ ဝယ်သူပိုင်ကုန်ဖြစ်လို့ အခြားသူကို ထပ်ရောင်းလို့ မရတော့ပါ။','blue')}
  <div class="summary-box mt"><div class="summary-line"><span>ဝယ်သူ</span><strong>${E(w.name)}</strong></div><div class="summary-line"><span>${E(w.key.split('|')[0])} · အဆင့် ${w.key.split('|')[1]}</span><strong>${N(w.bags)} အိတ် / ${vissText37(w.qty)} ပိဿာ</strong></div><div class="summary-line"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(w.qty*w.price)}</strong></div><div class="summary-line"><span>ယခုလက်ခံမည့်ငွေ · ${ACCOUNT_NAMES[w.account]}</span><strong>${cashText(w.paid)}</strong></div><div class="summary-line total"><span>နောက်ထပ် ရရန်ကျန်ငွေ</span><strong>${cashText(Math.round(w.qty*w.price)-w.paid)}</strong></div></div>`,
  btn('နောက်ပြန်','captureDeliveryAndBack()','secondary','back')+btn('အရောင်း အတည်ပြုပြီး သိမ်းမယ်','commitSale()','primary','check','id="commitSaleBtn"'),true);
 }
}
function updateSaleAvailability(changePrice=true){
 const g=ownedGroups().find(x=>x.key===value('saleGroup'));
 document.getElementById('saleAvailable').innerHTML=note(`ရောင်းနိုင်သော ပွဲရုံပိုင်ကုန် — <strong>${N(g.ownedBags)} အိတ် / ${vissText37(g.owned)} ပိဿာ</strong>။ အပ်ကုန်နှင့် ဝယ်သူပိုင်ကုန် မပါ။`);
 if(changePrice)document.getElementById('salePrice').value=state.prices[g.key]||'';
 updateSaleTotalPreview();
}
function updateSaleTotalPreview(){
 const q=number('saleQty'),p=number('salePrice');
 document.getElementById('saleTotalPreview').innerHTML=Number.isFinite(q)&&Number.isFinite(p)&&q>0&&p>0?`<div class="summary-box"><div class="summary-line total" style="border:0;margin:0;padding:0"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(q*p)}</strong></div></div>`:'';
}
function saleStep1Next(){
 if(!validForm('saleStep1'))return;
 const name=value('saleName'),key=value('saleGroup'),qty=number('saleQty'),bags=number('saleBags'),price=number('salePrice'),g=ownedGroups().find(x=>x.key===key);
 if(!name)return error('ဝယ်သူအမည် ထည့်ပါ။');
 if([qty,bags,price].some(x=>!Number.isFinite(x)||x<=0)||!Number.isInteger(bags))return error('အိတ်၊ အလေးချိန်နှင့် ဈေးနှုန်းကို မှန်ကန်စွာ ဖြည့်ပါ။');
 if(qty>g.owned+.00001||bags>g.ownedBags)return error('ပွဲရုံပိုင် ရောင်းနိုင်သောကုန်ထက် ပိုရောင်းလို့ မရပါ။ အပ်ကုန် / ဝယ်သူပိုင်ကုန်ကို ထည့်မတွက်ပါ။');
 if((Math.abs(qty-g.owned)<.00001)!==(bags===g.ownedBags))return error('ကုန်အားလုံးရောင်းမယ်ဆိုရင် အိတ်နှင့် ပိဿာလက်ကျန် နှစ်ခုစလုံးကို အပြည့်ရွေးပါ။');
 const oldTotal=Number(wizard.qty)*Number(wizard.price),newTotal=Math.round(qty*price);if(oldTotal!==newTotal)wizard.paid=null;
 Object.assign(wizard,{name,key,qty,bags,price});openSaleStep(1);
}
function updateSaleDuePreview(){
 const total=Math.round(wizard.qty*wizard.price),paid=number('salePaid')||0;
 document.getElementById('saleDuePreview').innerHTML=`<div class="summary-box"><div class="summary-line"><span>ငွေရရန်ကျန်မည်</span><strong class="${paid>total?'danger-text':''}">${cashText(total-paid)}</strong></div></div>`;
}
function captureSalePaymentAndBack(){wizard.paid=number('salePaid')||0;wizard.account=value('saleAccount');openSaleStep(0);}
function saleStep2Next(){
 if(!validForm('saleStep2'))return;const paid=number('salePaid'),total=Math.round(wizard.qty*wizard.price);
 if(!Number.isFinite(paid)||paid<0||paid>total)return error('လက်ခံငွေသည် သုညမှ ရောင်းတန်ဖိုးအထိသာ ဖြစ်ရပါမည်။');
 wizard.paid=paid;wizard.account=value('saleAccount');openSaleStep(2);
}
function chooseDelivery(mode){if(document.getElementById('saleCollector')){wizard.collector=value('saleCollector');wizard.car=value('saleCar');}wizard.mode=mode;openSaleStep(2);}
function captureDeliveryAndBack(){if(wizard.mode==='direct'){wizard.collector=value('saleCollector');wizard.car=value('saleCar');}openSaleStep(1);}
function commitSale(){
 if(!guardWork())return;const w=wizard,g=ownedGroups().find(x=>x.key===w.key);
 if(!g||w.qty>g.owned+.00001||w.bags>g.ownedBags)return error('ရွေးထားသောကုန် မလုံလောက်တော့ပါ။ အရောင်းကို ပြန်စပါ။');
 if(w.mode==='direct'){if(!validForm('deliveryForm'))return;w.collector=value('saleCollector');w.car=value('saleCar');if(!w.collector)return error('ပစ္စည်းလာယူသူ အမည်ထည့်ပါ။');}
 const unitCost=g.cost/g.owned,cost=Math.round(w.qty*unitCost),id=uid('S'),direct=w.mode==='direct';
 const s={id,no:'အရ-'+String(state.counter).padStart(3,'0'),date:today(),name:w.name,product:g.product,grade:g.grade,qty:w.qty,bags:w.bags,price:w.price,total:Math.round(w.qty*w.price),cost,paid:w.paid,deliveredQty:direct?w.qty:0,deliveredBags:direct?w.bags:0,mode:w.mode,dispatches:[]};
 state.lots=state.lots.filter(l=>!(l.owner==='owned'&&l.product===g.product&&l.grade===g.grade));
 const remainQ=Math.max(0,g.owned-w.qty),remainB=g.ownedBags-w.bags;
 if(remainQ>0.00001)state.lots.push({id:uid('L'),product:g.product,grade:g.grade,qty:remainQ,bags:remainB,owner:'owned',name:'ပွဲရုံပိုင်',cost:unitCost});
 if(!direct)state.lots.push({id:uid('L'),product:g.product,grade:g.grade,qty:w.qty,bags:w.bags,owner:'customer',name:w.name,cost:unitCost,saleId:id});
 else {s.dispatches.push({date:today(),qty:w.qty,bags:w.bags,collector:w.collector,car:w.car});move(g.product,g.grade,w.qty,w.bags,'out',s.no);}
 state.sales.unshift(s);txn(w.account,w.paid,'ကုန်ရောင်း ငွေလက်ခံခြင်း',s.no,w.name);
 activity(w.name+' သို့ '+g.product+' '+vissText37(w.qty)+' ပိဿာ ရောင်းပြီး '+(direct?'တစ်ခါတည်း ထုတ်ပေးခဲ့သည်။':'သိမ်းထပ်ထားခဲ့သည်။'));
 save();closeModal();render();toast(direct?'အရောင်းနှင့် ကုန်ထုတ်မှတ်တမ်း သိမ်းပြီးပါပြီ။':'အရောင်းသိမ်းပြီး ဝယ်သူပိုင်ကုန်အဖြစ် ခွဲထားပါပြီ။');openSaleDetail(s.id);
}
function openSaleDetail(id){
 const s=state.sales.find(x=>x.id===id);
 openModal('အရောင်းဘောက်ချာနှင့် ကုန်ထုတ်မှတ်တမ်း',`${s.no} · ${shortDate(s.date)}`,
 `<div class="row between mb"><h3>${E(s.name)}</h3>${saleStatus(s)}</div><div class="key-value mb"><div><div class="key">ကုန် / အရည်အသွေး</div><div class="value">${E(s.product)} · အဆင့် ${s.grade}</div></div><div><div class="key">ရောင်းထားသောပမာဏ</div><div class="value">${vissText37(s.qty)} ပိဿာ · ${N(s.bags)} အိတ်</div></div><div><div class="key">ထုတ်ပေးပြီး</div><div class="value">${vissText37(s.deliveredQty)} ပိဿာ · ${N(s.deliveredBags)} အိတ်</div></div><div><div class="key">ထုတ်ပေးရန်ကျန်</div><div class="value">${vissText37(saleRemaining(s))} ပိဿာ · ${N(s.bags-s.deliveredBags)} အိတ်</div></div></div>
 <div class="summary-box"><div class="summary-line"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(s.total)}</strong></div><div class="summary-line"><span>ငွေလက်ခံပြီး</span><strong>${cashText(s.paid)}</strong></div><div class="summary-line total"><span>ငွေရရန်ကျန်</span><strong>${cashText(receivable(s))}</strong></div></div>
 ${s.dispatches.length?`<div class="mt"><h3>ကုန်ထုတ်ပေးခဲ့သော မှတ်တမ်း</h3>${s.dispatches.map(d=>`<div class="queue-row"><div class="grow"><strong class="small">${E(d.collector)}</strong><div class="small muted">${shortDate(d.date)} · ${E(d.car)||'ကားနံပါတ် မရှိ'}</div></div><span class="small">${N(d.bags)} အိတ် / ${vissText37(d.qty)} ပိဿာ</span></div>`).join('')}</div>`:`<div class="mt">${note('ပစ္စည်း မထုတ်ရသေးပါ။ ဝယ်သူပိုင်ကုန်အဖြစ် ပွဲရုံထဲမှာ ဆက်ရှိနေသည်။','blue')}</div>`}
 ${state.role==='staff'&&receivable(s)>0?`<div class="mt">${btn('ကျန်ငွေ လက်ခံမယ်',`openSalePayment('${id}')`,'secondary','wallet')}</div>`:''}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ပုံနှိပ်မယ်',`printSale('${id}')`,'secondary','print')+(state.role==='staff'&&saleRemaining(s)>0?btn('ကုန်ထုတ်ပေးမယ်',`openDispatch('${id}')`,'primary','truck'):''),true);
}
function openDispatch(id){
 if(!guardWork())return;const s=state.sales.find(x=>x.id===id),q=saleRemaining(s),b=s.bags-s.deliveredBags;
 if(q<=0){toast('ဤအရောင်း၏ကုန် အားလုံးထုတ်ပေးပြီးပါပြီ။');return;}
 openModal('သိမ်းထပ်ထားသည့်ကုန် ထုတ်ပေးမယ်',`${E(s.name)} · ${s.no}`,
 `<div class="summary-box mb"><div class="row between wrap"><div><strong>${E(s.product)} · အဆင့် ${s.grade}</strong><div class="small muted">ဝယ်သူပိုင်ကုန် — ဝယ်ပြီး မသယ်သေးဘဲ အပ်ထားသောကုန်</div></div><div class="right"><strong>${vissText37(q)} ပိဿာ</strong><div class="small muted">${N(b)} အိတ် ထုတ်ရန်ကျန်</div></div></div></div>
 <form id="dispatchForm" onsubmit="event.preventDefault();saveDispatch('${id}')"><div class="field-row">${field('ပစ္စည်းလာယူသူ / အလုပ်သမား','dispatchCollector',{required:true,placeholder:'လာယူသူအမည်',extra:'maxlength="80"'})}${field('တင်သွားသော ကားနံပါတ်','dispatchCar',{placeholder:'ကားနံပါတ်',extra:'maxlength="40"'})}</div>
 <div class="field-row">${field('ယခု ထုတ်ပေးမည့်အိတ်','dispatchBags',{type:'number',min:1,max:b,value:b,required:true,suffix:'အိတ်'})}${field('ယခု ထုတ်ပေးမည့်အလေးချိန်','dispatchQty',{type:'number',min:.001,max:q,step:.001,value:q,required:true,suffix:'ပိဿာ'})}</div></form>
 ${note('မူလအရောင်းကို ထပ်မတင်ပါ။ ငွေစာရင်းလည်း မပြောင်းပါ။ နမူနာတွင် ခွဲထုတ်နိုင်အောင် ပြထားပြီး ခွဲထုတ်ခွင့်စည်းမျဉ်း အတည်ပြုရန်လိုသည်။','blue')}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ကုန်ထုတ်ပေးပြီး သိမ်းမယ်',`saveDispatch('${id}')`,'primary','check'));
}
function saveDispatch(id){
 if(!guardWork()||!validForm('dispatchForm'))return;
 const s=state.sales.find(x=>x.id===id),qty=number('dispatchQty'),bags=number('dispatchBags'),collector=value('dispatchCollector'),car=value('dispatchCar'),remainQ=saleRemaining(s),remainB=s.bags-s.deliveredBags;
 if(!collector)return error('ပစ္စည်းလာယူသူ အမည်ထည့်ပါ။');
 if(!Number.isFinite(qty)||qty<=0||qty>remainQ+.00001||!Number.isInteger(bags)||bags<=0||bags>remainB)return error('ထုတ်ပေးမည့်ပမာဏက ထုတ်ရန်ကျန်ပမာဏထက် မများရပါ။');
 if((Math.abs(qty-remainQ)<.00001)!==(bags===remainB))return error('ကုန်အပြည့်ထုတ်ပေးရာတွင် ကျန်အိတ်နှင့် ကျန်ပိဿာ နှစ်ခုလုံးကို ကိုက်ညီစွာ ဖြည့်ပါ။');
 const lot=state.lots.find(l=>l.saleId===s.id&&l.owner==='customer');
 if(!lot)return error('ဆက်စပ်ဝယ်သူပိုင်ကုန် မရှိတော့ပါ။');
 lot.qty=Math.max(0,lot.qty-qty);lot.bags-=bags;s.deliveredQty+=qty;s.deliveredBags+=bags;
 s.dispatches.push({date:today(),qty,bags,collector,car});move(s.product,s.grade,qty,bags,'out',s.no);activity(s.name+' ၏ သိမ်းထပ်ကုန် '+vissText37(qty)+' ပိဿာကို '+collector+' ထံ ထုတ်ပေးခဲ့သည်။');
 save();closeModal();render();toast('ကုန်ထုတ်မှတ်တမ်း သိမ်းပြီးပါပြီ။ အရောင်းအသစ် ထပ်မတင်ပါ။');
}
function openSalePayment(id){
 if(!guardWork())return;const s=state.sales.find(x=>x.id===id);
 if(receivable(s)<=0){toast('ငွေအားလုံး လက်ခံရရှိပြီးပါပြီ။');return;}
 openModal('အရောင်းကျန်ငွေ လက်ခံမယ်',`${E(s.name)} · ${s.no}`,
 `<div class="summary-box mb"><div class="summary-line total" style="margin:0;border:0;padding:0"><span>ငွေရရန်ကျန်</span><strong>${cashText(receivable(s))}</strong></div></div>
 <form id="salePayForm" onsubmit="event.preventDefault();saveSalePayment('${id}')"><div class="field-row">${accountField('salePayAccount','cash','လက်ခံသည့် ငွေသိမ်းရာ')}${field('ယခု ရရှိသည့်ငွေ','salePayAmount',{type:'number',min:1,max:receivable(s),value:receivable(s),required:true,suffix:'ကျပ်'})}</div></form>
 ${note('အကြွေးပြန်ရှင်းတာဖြစ်လို့ အရောင်းအသစ် မတင်ပါ။ ကုန်ပမာဏလည်း မပြောင်းပါ။')}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ငွေလက်ခံပြီး သိမ်းမယ်',`saveSalePayment('${id}')`,'primary','check'));
}
function saveSalePayment(id){
 if(!guardWork()||!validForm('salePayForm'))return;const s=state.sales.find(x=>x.id===id),amount=number('salePayAmount'),account=value('salePayAccount');
 if(!Number.isFinite(amount)||amount<=0||amount>receivable(s))return error('ရရှိငွေသည် သုညထက်ပိုပြီး ငွေရရန်ကျန်ထက် မများရပါ။');
 s.paid+=amount;txn(account,amount,'အရောင်းကျန်ငွေ လက်ခံခြင်း',s.no,s.name);activity(s.name+' ထံမှ အရောင်းကျန်ငွေ '+cashText(amount)+' လက်ခံခဲ့သည်။');save();closeModal();render();toast('ကျန်ငွေ လက်ခံမှတ်တမ်း သိမ်းပြီးပါပြီ။');
}

function openMoneyRequest(){
 if(state.role!=='owner'){toast('ငွေယူလက်မှတ်ကို ပိုင်ရှင်မြင်ကွင်းမှ ရေးနိုင်ပါတယ်။',true);return;}
 if(state.closed){toast('ယနေ့စာရင်း ပိတ်ပြီးပါပြီ။ နောက်နေ့ကို ဖွင့်ပြီးမှ ဆက်လုပ်ပါ။',true);return;}
 openModal('အိမ်မှ ငွေယူလက်မှတ် ရေးမယ်','ပိုင်ရှင်ပေးသော ငွေယူလက်မှတ် · ငွေလက်ကျန်ကို ယခု မပြောင်းပါ။',
 `<form id="requestForm" onsubmit="event.preventDefault();saveMoneyRequest()">${field('သွားယူမည့်သူ အမည်','requestCollector',{required:true,placeholder:'ငွေသွားယူသူ အမည်',extra:'maxlength="80"'})}
 <div class="field-row">${field('ယူလာရမည့်ငွေ','requestAmount',{type:'number',min:1,required:true,suffix:'ကျပ်',placeholder:'ယူမည့်ငွေ ရိုက်ထည့်ပါ'})}${field('အကြောင်းအရာ','requestReason',{required:true,value:'ကုန်ဝယ် ငွေရှင်းရန်',extra:'maxlength="180"'})}</div></form>
 <div class="summary-box mb"><div class="summary-line"><span>ငွေယူမည့်နေရာ</span><strong>အိမ် ငွေသိမ်းရာ</strong></div><div class="summary-line"><span>ငွေလက်ခံမည့်နေရာ</span><strong>ပွဲရုံ ငွေသား</strong></div></div>
 ${note('လက်မှတ်ရေးပြီးနောက် စာရေးမက ငွေတကယ်ယူလာပြီး “ငွေရရှိပြီ” ဟု မှတ်မှသာ ငွေသိမ်းရာနှစ်ဖက်ကို ပြောင်းပါမယ်။','blue')}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ငွေယူလက်မှတ် ထုတ်မယ်','saveMoneyRequest()','primary','doc'));
}
function saveMoneyRequest(){
 if(!validForm('requestForm'))return;const amount=number('requestAmount'),collector=value('requestCollector'),reason=value('requestReason');
 if(!collector||!reason||!Number.isFinite(amount)||amount<=0)return error('သွားယူသူ၊ ငွေပမာဏနှင့် အကြောင်းအရာကို ဖြည့်ပါ။');
 const id=uid('H'),r={id,no:'ငယ-'+String(state.counter).padStart(3,'0'),date:today(),amount,collector,reason,status:'issued'};
 state.requests.push(r);activity(collector+' အတွက် '+cashText(amount)+' ငွေယူလက်မှတ် ထုတ်ပေးခဲ့သည်။ ငွေလက်ကျန် မပြောင်းသေးပါ။');
 save();closeModal();render();
 openModal('ငွေယူလက်မှတ် ထုတ်ပြီးပါပြီ။',r.no,
 `<div class="balance-big"><div class="icon-box large" style="margin:0 auto 15px">${I('doc')}</div><div class="label">ထုတ်ယူခွင့်ပေးထားသောငွေ</div><div class="value">${M(amount)} <small>ကျပ်</small></div><div class="small muted">သွားယူသူ — ${E(collector)}</div></div>
 ${note('ငွေတကယ်ရရှိချိန်မှာ စာရေးမမြင်ကွင်း → ငွေစာရင်း → အိမ်မှ ငွေယူလက်မှတ် → “ငွေရရှိပြီ” ကိုနှိပ်ပါ။','blue')}`,
 btn('လက်မှတ် ပုံနှိပ်မယ်',`printRequest('${id}')`,'secondary','print')+btn('ပြီးပါပြီ','closeModal()','primary','check'));
}
function openReceiveMoney(id){
 if(!guardWork())return;const r=state.requests.find(x=>x.id===id);
 if(!r||r.status!=='issued'){toast('ဤလက်မှတ်ကို ငွေလက်ခံပြီးသား ဖြစ်ပါတယ်။',true);return;}
 openModal('အိမ်မှ ငွေတကယ်ရရှိပြီလား။',`${r.no} · သွားယူသူ ${E(r.collector)}`,
 `<div class="balance-big"><div class="label">အမှန်တကယ် လက်ခံရရှိကြောင်း မှတ်မည့်ငွေ</div><div class="value">${M(r.amount)} <small>ကျပ်</small></div></div>
 <div class="summary-box"><div class="summary-line"><span>အိမ် ငွေသိမ်းရာမှ လျော့မည်</span><strong>− ${cashText(r.amount)}</strong></div><div class="summary-line"><span>ပွဲရုံ ငွေသားထဲ တိုးမည်</span><strong>+ ${cashText(r.amount)}</strong></div></div>
 <div class="mt">${note('ဤနမူနာတွင် လက်မှတ်ပါငွေကို အပြည့်ရရှိသည်ဟု မှတ်ပါမယ်။ မရသေးလျှင် မနှိပ်ပါနှင့်။ တစ်စိတ်တစ်ပိုင်းရရှိမှုစည်းမျဉ်း မသတ်မှတ်ရသေးပါ။','amber')}</div>`,
 btn('မရသေးပါ','closeModal()','secondary')+btn('ငွေအပြည့် ရရှိပြီးပါပြီ',`receiveMoney('${id}')`,'primary','check'));
}
function receiveMoney(id){
 if(!guardWork())return;const r=state.requests.find(x=>x.id===id);
 if(!r||r.status!=='issued')return error('ဤလက်မှတ်ကို ငွေလက်ခံပြီးသား ဖြစ်ပါတယ်။ ထပ်လက်ခံလို့ မရပါ။');
 if(r.amount>bal('home'))return error('နမူနာ အိမ်ငွေသိမ်းရာလက်ကျန် မလောက်ပါ။ လက်ရှိနမူနာတွင် ထိုပမာဏကို ထုတ်ယူမရပါ။');
 r.status='received';r.receivedDate=today();
 txn('home',-r.amount,'ပွဲရုံသို့ ငွေရွှေ့ခြင်း',r.no,r.collector);txn('cash',r.amount,'အိမ်မှ ငွေလက်ခံခြင်း',r.no,r.collector);
 activity(r.no+' ဖြင့် အိမ်မှ '+cashText(r.amount)+' လက်ခံရရှိခဲ့သည်။');save();closeModal();render();toast('ငွေရရှိမှုကို တစ်ကြိမ်တည်း မှတ်ပြီး ငွေသိမ်းရာနှစ်ဖက် ချိတ်ထားပါပြီ။');
}
function openExpense(){
 if(!guardWork())return;
 openModal('ပွဲရုံခံ အသုံးစရိတ် မှတ်မယ်','လုပ်ငန်းက ကိုယ်တိုင်ခံရသော အသုံးစရိတ်ကိုသာ ထည့်ပါ။',
 `<form id="expenseForm" onsubmit="event.preventDefault();saveExpense()">${field('အသုံးစရိတ် အကြောင်းအရာ','expenseReason',{required:true,placeholder:'ဥပမာ ပွဲရုံခံ သယ်ယူခ',extra:'maxlength="180"'})}
 <div class="field-row">${accountField('expenseAccount')}${field('ထုတ်ပေးသော ငွေပမာဏ','expenseAmount',{type:'number',min:1,required:true,suffix:'ကျပ်'})}</div></form>
 ${note('အဝယ်ဘောက်ချာမှ နုတ်ထားသော လုပ်သားခကို ဤနေရာတွင် ပွဲရုံခံကုန်ကျစရိတ်အဖြစ် ထပ်မမှတ်ပါနှင့်။ ထိုငွေ ပြန်ရှင်းပုံ၏ စာရင်းကိုင်စည်းမျဉ်း အတည်ပြုရန်ကျန်သည်။','amber')}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('အသုံးစရိတ် သိမ်းမယ်','saveExpense()','primary','check'));
}
function saveExpense(){
 if(!guardWork()||!validForm('expenseForm'))return;
 const reason=value('expenseReason'),amount=number('expenseAmount'),account=value('expenseAccount');
 if(!reason||!Number.isFinite(amount)||amount<=0)return error('အကြောင်းအရာနှင့် ငွေပမာဏကို ဖြည့်ပါ။');
 if(amount>bal(account))return error('ရွေးထားသော ငွေသိမ်းရာလက်ကျန် မလောက်ပါ။');
 const id=uid('E');state.expenses.push({id,date:today(),reason,amount,account});txn(account,-amount,'ပွဲရုံခံအသုံး — '+reason,id);activity(reason+' အတွက် '+cashText(amount)+' သုံးစွဲခဲ့သည်။');
 save();closeModal();render();toast('အသုံးစရိတ်နှင့် ငွေထွက်မှတ်တမ်း သိမ်းပြီးပါပြီ။');
}
function openGround(){
 if(!guardWork())return;
 const groups=stockGroups(state.lots);
 openModal('မြေပြင်ကုန်လက်ကျန် စစ်မယ်','ပိုင်ဆိုင်မှုအားလုံးပါဝင်သော မြေပြင်ရှိကုန်ကို ရေတွက် / ချိန်တွယ်စစ်ပါ။',
 `<form id="groundForm" onsubmit="event.preventDefault();saveGround()">${selectField('ကုန် / အရည်အသွေး','groundGroup',groups.map(g=>[g.key,g.product+' · အဆင့် '+g.grade]),groups[0]?.key,'onchange="updateGroundPreview()"')}
 <div id="groundExpected" class="mb"></div><div class="field-row">${field('တကယ်ရေတွက်ရရှိသော အိတ်','groundBags',{type:'number',min:0,required:true,suffix:'အိတ်',extra:'oninput="updateGroundPreview()"'})}${field('တကယ်စစ်ဆေးရရှိသော အလေးချိန်','groundQty',{type:'number',min:0,step:.001,required:true,suffix:'ပိဿာ',extra:'oninput="updateGroundPreview()"'})}</div>
 <div id="groundDiff" class="mb"></div>${field('မှတ်ချက်','groundNote',{placeholder:'ကုန်ကွာဟပါက မှတ်ချက် ထည့်ပါ',extra:'maxlength="300"'})}</form>
 ${note('ကွာဟချက်ကိုသာ မှတ်ထားပါမယ်။ စာရင်းကုန်ကို အလိုအလျောက် မတိုး / မလျှော့ပါ။ ပြင်ဆင်ခွင့်နှင့် အတည်ပြုစည်းမျဉ်း မသတ်မှတ်ရသေးပါ။','amber')}`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('မြေပြင်စစ်ချက် သိမ်းမယ်','saveGround()','primary','check'));
 updateGroundPreview();
}
function updateGroundPreview(){
 const g=stockGroups(state.lots).find(x=>x.key===value('groundGroup'));if(!g)return;
 document.getElementById('groundExpected').innerHTML=`<div class="summary-box"><div class="summary-line"><span>လက်ရှိ မြေပြင်ရှိသင့်သော စာရင်းပမာဏ</span><strong>${N(g.bags)} အိတ် / ${vissText37(g.total)} ပိဿာ</strong></div><p class="field-help">ပွဲရုံပိုင် ${vissText37(g.owned)} + အပ်ကုန် ${vissText37(g.supplier)} + ဝယ်သူပိုင် ${vissText37(g.customer)} ပိဿာ</p></div>`;
 const q=number('groundQty'),b=number('groundBags');
 document.getElementById('groundDiff').innerHTML=Number.isFinite(q)&&Number.isFinite(b)?`<div class="result-banner ${q!==g.total||b!==g.bags?'mismatch':''}">ကွာဟချက် — ${N(b-g.bags)} အိတ် / ${vissText37(q-g.total)} ပိဿာ</div>`:'';
}
function saveGround(){
 if(!guardWork()||!validForm('groundForm'))return;
 const key=value('groundGroup'),g=stockGroups(state.lots).find(x=>x.key===key),qty=number('groundQty'),bags=number('groundBags'),n=value('groundNote'),difference=qty-g.total,bagDifference=bags-g.bags;
 if(!Number.isFinite(qty)||qty<0||!Number.isInteger(bags)||bags<0)return error('ရေတွက်ရရှိပမာဏကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။');
 if((Math.abs(difference)>.0001||bagDifference)&&!n)return error('စာရင်းနှင့် မြေပြင် မကိုက်ညီသောကြောင့် မှတ်ချက်ထည့်ပါ။');
 state.grounds[key]={date:today(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),qty,bags,expectedQty:g.total,expectedBags:g.bags,difference,bagDifference,note:n};
 activity(g.product+' အဆင့် '+g.grade+' မြေပြင်စစ်ချက် မှတ်တမ်းတင်ခဲ့သည်။');save();closeModal();invTab='ground';page='inventory';render();toast('မြေပြင်စစ်ချက် သိမ်းပြီးပါပြီ။ စာရင်းကုန်ကို မပြင်ထားပါ။');
}
function openCloseDay(){
 if(state.closed){
  const c=state.closing;
  openModal('နေ့ပိတ်စာရင်း သိမ်းပြီးပါပြီ။',dayLabel(),
  `<div class="summary-box"><div class="summary-line"><span>မပို့ခင် စာရင်းအရ ငွေသား</span><strong>${cashText(c.expectedBefore)}</strong></div><div class="summary-line"><span>မပို့ခင် တကယ်ရေတွက်ရရှိငွေ</span><strong>${cashText(c.actualBefore)}</strong></div><div class="summary-line"><span>အိမ်သို့ တကယ်ပို့ပြီးငွေ</span><strong>${cashText(c.transfer)}</strong></div><div class="summary-line"><span>စာရင်းအရ ပွဲရုံချန်ငွေ</span><strong>${cashText(c.expectedAfter)}</strong></div><div class="summary-line total"><span>တကယ်ရေတွက် ချန်ထားငွေ</span><strong>${cashText(c.actualAfter)}</strong></div></div>
  ${c.difference?`<div class="mt">${note(`ကွာဟချက် ${cashText(c.difference)}။ ${E(c.note)}။ ကွာဟချက်ကို သိမ်းထားပြီး စာရင်းလက်ကျန် မပြင်ထားပါ။`,'amber')}</div>`:note('စာရင်းလက်ကျန်နှင့် တကယ်ချန်ထားငွေ ကိုက်ညီပါတယ်။ နောက်နေ့ အဖွင့်စစ်ချက်အဖြစ် ဆက်ပါမယ်။')}`,
  btn('ပိတ်မယ်','closeModal()','secondary')+btn('နောက်နေ့ ဖွင့်မယ်','openNextDay()','primary','sun'));return;
 }
 if(!guardWork())return;const expected=bal('cash');
 openModal('နေ့ပိတ် ငွေစစ်ပြီး ချန်ငွေသတ်မှတ်မယ်','အိမ်ပို့မည့်ငွေကို တကယ်ပို့ပြီးမှ နေ့ပိတ်သိမ်းပါ။',
 `<div class="balance-big" style="padding-top:0"><div class="label">ယခု စာရင်းအရ ပွဲရုံငွေသား</div><div class="value">${M(expected)} <small>ကျပ်</small></div></div>
 <form id="closeDayForm" onsubmit="event.preventDefault();saveCloseDay()"><div class="field-row">
 ${field('လက်ထဲ တကယ်ရေတွက်ရရှိငွေ','closeActual',{type:'number',min:0,required:true,suffix:'ကျပ်',extra:'oninput="updateClosePreview()"'})}
 ${field('အိမ်သို့ တကယ်ပို့ပြီးသောငွေ','closeTransfer',{type:'number',min:0,value:0,required:true,suffix:'ကျပ်',extra:'oninput="updateClosePreview()"',help:'မပို့ပါက သုညထားပါ။'})}</div>
 <div id="closePreview" class="mb"></div>${field('နေ့ပိတ် မှတ်ချက်','closeNote',{placeholder:'ငွေကွာဟပါက အကြောင်းအရာ မှတ်ပါ',extra:'maxlength="300"'})}</form>
 ${note('အိမ်သို့ပို့သောငွေက ပွဲရုံငွေသားမှ လျော့ပြီး အိမ်ငွေသိမ်းရာမှာ တိုးမယ်။ ငွေကွာဟချက်ကို မှတ်ထားပေမဲ့ စာရင်းလက်ကျန်ကို အလိုအလျောက် မပြင်ပါ။')}`,
 btn('မပိတ်သေးပါ','closeModal()','secondary')+btn('ငွေပို့ပြီး နေ့ပိတ်သိမ်းမယ်','saveCloseDay()','primary','moon'),true);
 updateClosePreview();
}
function updateClosePreview(){
 const actual=number('closeActual'),transfer=number('closeTransfer')||0,expected=bal('cash');
 if(!Number.isFinite(actual)){document.getElementById('closePreview').innerHTML=note('လက်ထဲငွေကို ရေတွက်ပြီး ဖြည့်ပါ။ အိမ်ပို့ငွေနဲ့ ချန်ငွေကို တွက်ပြပါမယ်။');return;}
 const diff=actual-expected;
 document.getElementById('closePreview').innerHTML=`<div class="summary-box"><div class="summary-line"><span>စာရင်းနှင့် ရေတွက်ငွေ ကွာဟချက်</span><strong class="${diff?'danger-text':'green'}">${cashText(diff)}</strong></div><div class="summary-line"><span>အိမ်သို့ပို့ပြီးနောက် စာရင်းလက်ကျန်</span><strong>${cashText(expected-transfer)}</strong></div><div class="summary-line total"><span>တကယ်ချန်ထားမည့်ငွေ</span><strong>${cashText(actual-transfer)}</strong></div></div>`;
}
function saveCloseDay(){
 if(state.closed)return error('ယနေ့စာရင်း ပိတ်ပြီးသား ဖြစ်ပါတယ်။');
 if(!validForm('closeDayForm'))return;
 const actual=number('closeActual'),transfer=number('closeTransfer'),expected=bal('cash'),n=value('closeNote'),difference=actual-expected;
 if([actual,transfer].some(x=>!Number.isFinite(x)||x<0))return error('ရေတွက်ငွေနှင့် ပို့ငွေသည် သုည သို့မဟုတ် အပေါင်းကိန်း ဖြစ်ရပါမယ်။');
 if(transfer>actual||transfer>expected)return error('အိမ်ပို့ငွေက လက်တွေ့ရရှိငွေ သို့မဟုတ် စာရင်းလက်ကျန်ထက် မများရပါ။');
 if(difference&&!n)return error('ငွေကွာဟနေသောကြောင့် မှတ်ချက်ထည့်ပါ။ ငွေလက်ကျန်ကို အလိုအလျောက် မပြင်ပါ။');
 const ref='နေ့ပိတ်-'+today();
 if(transfer){txn('cash',-transfer,'နေ့ပိတ် အိမ်သို့ငွေပို့ခြင်း',ref);txn('home',transfer,'နေ့ပိတ် ပွဲရုံမှငွေလက်ခံခြင်း',ref);}
 state.closing={date:today(),expectedBefore:expected,actualBefore:actual,transfer,expectedAfter:expected-transfer,actualAfter:actual-transfer,difference,note:n};
 state.closed=true;activity('နေ့ပိတ်ပြီး '+cashText(transfer)+' အိမ်ပို့ကာ '+cashText(actual-transfer)+' တကယ်ချန်ထားခဲ့သည်။');
 save();closeModal();render();toast('နေ့ပိတ်စာရင်း သိမ်းပြီးပါပြီ။ ချန်ငွေကို နောက်နေ့အတွက် ဆက်ထားပါမယ်။');
}
function openNextDay(){
 if(!state.closed)return;
 const date=new Date(state.day+'T12:00:00');date.setDate(date.getDate()+1);
 const next=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 openModal('နောက်နေ့အတွက် စာရင်းဖွင့်မယ်',dayLabel(next),
 `<div class="summary-box"><div class="summary-line"><span>နောက်နေ့ စာရင်းအရ အဖွင့်ငွေ</span><strong>${accountValue68('cash',bal('cash'),cashText)}</strong></div><div class="summary-line"><span>ယနေ့တကယ်ချန်ထားသောငွေ</span><strong>${cashText(state.closing.actualAfter)}</strong></div></div><div class="mt">${note('အပ်ကုန်၊ ရောင်းပြီးမထုတ်ရသေးသောကုန်၊ ပေးရန် / ရရန်နှင့် ငွေလက်ကျန်တို့ကို ဆက်ယူပါမယ်။ နောက်နေ့မနက်တွင် ငွေပြန်ရေတွက်စစ်ရပါမယ်။')}</div>`,
 btn('မဖွင့်သေးပါ','closeModal()','secondary')+btn('နောက်နေ့ ဖွင့်မယ်',`startNextDay('${next}')`,'primary','sun'));
}
function startNextDay(next){
 if(!state.closed)return;
 state.days.push({date:today(),opening:{...state.opening},closing:{...state.closing},transactions:[...state.transactions],moves:[...state.moves],grounds:JSON.parse(JSON.stringify(state.grounds)),activity:[...state.activity]});
 const balances={cash:bal('cash'),bank:bal('bank'),home:bal('home')};
 state.day=next;state.bases=balances;state.transactions=[];state.moves=[];state.grounds={};state.activity=[];state.prices={};state.priceDate=null;
 state.stockOpening=stockGroups(state.lots).map(x=>({key:x.key,product:x.product,grade:x.grade,qty:x.total,bags:x.bags}));
 state.opening={checked:false,expected:balances.cash,actual:null,difference:0,note:''};state.closed=false;state.closing=null;state.role='staff';
 save();navigate('home');toast('နောက်နေ့ဖွင့်ပြီးပါပြီ။ မနေ့ကချန်ငွေနဲ့ မနက်ရှိငွေကို တိုက်စစ်ပါ။');
}
function printDocument(title,no,body){
 document.getElementById('printArea').innerHTML=`<div class="print-title"><h1>ပွဲရုံ</h1><h2>${title}</h2><p>${no} · ${shortDate(today())}</p><p style="font-size:10pt">နမူနာဘောက်ချာ — ငွေအစစ် / ကုန်အစစ်အတွက် မသုံးရပါ။</p></div>${body}<div style="display:flex;justify-content:space-between;margin-top:55px"><span>စာရင်းတင်သူ __________________</span><span>လက်ခံသူ __________________</span></div>`;
 window.print();
}
function printReceipt(id){
 const r=state.receipts.find(x=>x.id===id),p=r.status==='purchased';
 printDocument(p?'အဝယ်ဘောက်ချာ':'ကုန်လက်ခံ / အပ်ကုန်မှတ်တမ်း',r.purchaseNo||r.no,
 `<p>ကုန်လာချသူ — <strong>${E(r.name)}</strong></p><p>ကားနံပါတ် — ${E(r.car)||'—'}</p><p>လက်ခံသည့်ရက် — ${shortDate(r.date)}${p?' · ဝယ်သည့်ရက် — '+shortDate(r.purchaseDate):''}</p><table style="margin-top:20px"><thead><tr><th>ကုန် / အဆင့်</th><th>အိတ်</th><th>ပိဿာ</th><th>တစ်ပိဿာဈေး</th><th>ကုန်ဖိုး</th></tr></thead><tbody><tr><td>${E(r.product)} / ${r.grade}</td><td>${N(r.bags)}</td><td>${vissText37(r.qty)}</td><td>${r.price?M(r.price):'မသတ်မှတ်ရသေး'}</td><td>${r.price?M(gross(r)):'—'}</td></tr></tbody></table>
 <div style="margin-top:25px"><p>ကြိုရှင်းငွေ — ${cashText(r.advance)}</p>${p?`<p>လုပ်သားခ / ချိန်ခနုတ်ငွေ — ${cashText(r.wage+r.weigh)}</p><p>ထပ်မံရှင်းပေးပြီးငွေ — ${cashText(r.paid)}</p><h3>ရှင်းရန်ကျန်ငွေ — ${cashText(due(r))}</h3>`:'<p>အပ်ကုန်ဖြစ်ပြီး ပွဲရုံပိုင်မဟုတ်သေးပါ။</p>'}</div>`);
}
function printSale(id){
 const s=state.sales.find(x=>x.id===id);
 printDocument('အရောင်းဘောက်ချာ',s.no,`<p>ဝယ်သူ — <strong>${E(s.name)}</strong></p><p>အရောင်းရက် — ${shortDate(s.date)}</p><table style="margin-top:20px"><thead><tr><th>ကုန် / အဆင့်</th><th>အိတ်</th><th>ပိဿာ</th><th>ဈေး</th><th>ကုန်ဖိုး</th></tr></thead><tbody><tr><td>${E(s.product)} / ${s.grade}</td><td>${N(s.bags)}</td><td>${vissText37(s.qty)}</td><td>${M(s.price)}</td><td>${M(s.total)}</td></tr></tbody></table>
 <div style="margin-top:25px"><p>လက်ခံပြီးငွေ — ${cashText(s.paid)}</p><h3>ငွေရရန်ကျန် — ${cashText(receivable(s))}</h3><p>ထုတ်ပေးပြီး — ${vissText37(s.deliveredQty)} ပိဿာ / ${N(s.deliveredBags)} အိတ်</p><p>ထုတ်ပေးရန်ကျန် — ${vissText37(saleRemaining(s))} ပိဿာ / ${N(s.bags-s.deliveredBags)} အိတ်</p></div>`);
}
function printRequest(id){
 const r=state.requests.find(x=>x.id===id);
 printDocument('အိမ်မှ ငွေယူလက်မှတ်',r.no,`<p>လက်မှတ်ရက် — ${shortDate(r.date)}</p><p>သွားယူသူ — <strong>${E(r.collector)}</strong></p><p>အကြောင်းအရာ — ${E(r.reason)}</p><h2 style="margin:28px 0">ယူရန်ငွေ — ${cashText(r.amount)}</h2><p>ငွေယူမည့်နေရာ — အိမ် ငွေသိမ်းရာ</p><p>လက်ခံမည့်နေရာ — ပွဲရုံ ငွေသား</p><p>အခြေအနေ — ${r.status==='issued'?'လက်မှတ်ပေးထားသည်၊ ငွေမရသေးပါ။':'ငွေလက်ခံရရှိပြီးပါပြီ။'}</p>`);
}
function openHelp(){
 openModal('နမူနာကို ဘယ်လိုစမ်းမလဲ။','စမ်းသပ်မှုအတွက်သာ ဖြစ်ပါတယ်။ ပြင်ပဆော့ဖ်ဝဲ၊ ဘဏ် သို့မဟုတ် ငွေအစစ်နှင့် မချိတ်ထားပါ။',
 `<div class="stack">
 <div class="row"><span class="step-circle current">1</span><div><h3>စာရေးမမြင်ကွင်းမှာ အဖွင့်ငွေစစ်ပါ။</h3><p class="small muted">အစနမူနာတွင် မနေ့ကချန်ငွေ 1,250,000 ကျပ်ဖြစ်သည်။ တူညီသည့်ငွေထည့်ပြီး စမ်းနိုင်ပါတယ်။</p></div></div>
 <div class="row"><span class="step-circle current">2</span><div><h3>ကုန်လက်ခံ၊ ဈေးသတ်မှတ်ပြီး ဝယ်ယူပါ။</h3><p class="small muted">အကြမ်းသိမ်း → အချောဖြည့် → ဈေးစောင့် / အပ်ထား / ဝယ်ယူခြင်းကို စမ်းပါ။ ကြိုငွေထုတ်ပြီး နုတ်ငွေတွက်နိုင်ပါတယ်။</p></div></div>
 <div class="row"><span class="step-circle current">3</span><div><h3>အရောင်းနှင့် သိမ်းထပ်ထားခြင်းကို စမ်းပါ။</h3><p class="small muted">ပွဲရုံပိုင်ကုန်ကို ရောင်းပြီး “သိမ်းထပ်ထား” ရွေးပါ။ ကုန်လက်ကျန်မှာ ဝယ်သူပိုင်ကုန်ဖြစ်သွားတာ ကြည့်ပါ။ နောက်မှ ကုန်ထုတ်ပေးနိုင်ပါတယ်။</p></div></div>
 <div class="row"><span class="step-circle current">4</span><div><h3>ပိုင်ရှင်နဲ့ စာရေးမမြင်ကွင်း ပြောင်းစမ်းပါ။</h3><p class="small muted">ညာအပေါ်မှ မြင်ကွင်းပြောင်းပါ။ ပိုင်ရှင်က ငွေယူလက်မှတ်ရေးပြီး စာရေးမက ငွေတကယ်ရမှ လက်ခံမှတ်ပါ။</p></div></div>
 <div class="row"><span class="step-circle current">5</span><div><h3>ကုန်စစ်၊ နေ့ပိတ်ပြီး နောက်နေ့ဖွင့်ပါ။</h3><p class="small muted">ကုန်လယ်ဂျာနဲ့ မြေပြင်ကို တိုက်စစ်ပါ။ နေ့ပိတ်မှာ လက်ရှိငွေဖြည့်၊ အိမ်ပို့ငွေထည့်ပြီး ချန်ငွေ နောက်နေ့ကိုဆက်သွားတာ စမ်းပါ။</p></div></div>
 </div><div class="divider"></div><h3>နမူနာသတ်မှတ်ချက်များ</h3>
 <p class="small muted mt">ဈေးကို တစ်ပိဿာနှုန်းဖြင့် တွက်ထားသည်။ အိတ်အလေးချိန် ပုံသေမထားပါ။ ပိဿာကို ဒဿမသုံးလုံး၊ ငွေကို ကျပ်ပြည့်ဖြင့် စမ်းထားသည်။ အတည်ပြုစည်းမျဉ်းမဟုတ်ပါ။</p>
 <p class="small muted mt">ကိုင်ခနှုန်း 100 ကျပ်သည် ဖြည့်ထားသော နမူနာသာဖြစ်ပြီး ပြင်နိုင်သည်။ ချိန်ခ၊ လုပ်အားခနှင့် ဘယ်သူခံရမလဲဆိုတာ အတည်ပြုရန်ကျန်သည်။</p>
 <p class="small muted mt">တစ်စိတ်တစ်ပိုင်းငွေရှင်းခြင်း၊ ခွဲထုတ်ခြင်းနှင့် အကြွေးစည်းမျဉ်းများကို နမူနာအဖြစ်သာ ပြထားသည်။ အပ်ကုန်ပြန်ယူခြင်းနှင့် အပ်ကုန်တစ်စိတ်တစ်ပိုင်းဝယ်ယူခြင်း မထည့်ထားသေးပါ။</p>
 <p class="small muted mt">နမူနာဝယ်ရင်းနှုန်းကို ကုန်အမျိုးအစား / အဆင့်အလိုက် ပျမ်းမျှဖြင့်တွက်ထားသည်။ “အိမ်” ကို လုပ်ငန်းငွေသိမ်းရာတစ်ခုအဖြစ်သာ သတ်မှတ်ထားသည်။ အမြတ်တွက်ပုံနှင့် စာရင်းကိုင်သတ်မှတ်ချက်များကို အတည်ပြုရန်လိုသည်။</p>
 <div class="mt">${note('ဤဖိုင်မှာ ဘရောက်ဇာအတွင်းသိမ်းဆည်းသည့် UI နမူနာသာဖြစ်သည်။ အသုံးပြုသူအကောင့်စစ်ခြင်း၊ တကယ့်ခွင့်ပြုချက်ထိန်းချုပ်မှု၊ ဆာဗာ၊ ဒေတာဘေ့စ်၊ တရားဝင်ငွေစာရင်းနှင့် လုံခြုံရေးစနစ် မပါသေးပါ။','amber')}</div>`,
 btn('စမ်းကြည့်မယ်','closeModal()','primary','arrow'),true);
}
function openReset(){
 openModal('နမူနာဒေတာကို အစပြန်စမလား။','ဤဘရောက်ဇာတွင် စမ်းထားသောမှတ်တမ်းများကို ဖျက်ပြီး မူလနမူနာဒေတာသို့ ပြန်သွားမည်။',
 note('စမ်းထားသော အဝယ်၊ အရောင်း၊ ငွေစစ်ချက်၊ ငွေလွှဲနှင့် နေ့ပိတ်မှတ်တမ်းများ ပျောက်ပါမယ်။ ပြင်ပဒေတာနှင့် မသက်ဆိုင်ပါ။','amber'),
 btn('မဖျက်တော့ပါ','closeModal()','secondary')+btn('နမူနာ အစပြန်စမယ်','resetDemo()','danger','reset'));
}
function resetDemo(){state=seed();wizard=null;invTab='overview';cashTab='movements';save();navigate('home');toast('မူလနမူနာဒေတာဖြင့် အစပြန်ဖွင့်ထားပါပြီ။');}
document.addEventListener('keydown',event=>{
 const root=document.getElementById('modalRoot');
 if(event.key==='Escape'){if(root.classList.contains('visible'))closeModal();else toggleNav(false);}
 if(event.key==='Tab'&&root.classList.contains('visible')){
  const focusables=Array.from(root.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')).filter(el=>el.offsetParent!==null);
  if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
window.addEventListener('storage',e=>{if(e.key===STORE_KEY)toast('အခြားတက်ဘ်တွင် နမူနာဒေတာ ပြောင်းထားနိုင်ပါသည်။ တက်ဘ်တစ်ခုတည်းဖြင့် စမ်းသပ်ပါ။',true);});
// Initialized by the v2 presentation layer below.
