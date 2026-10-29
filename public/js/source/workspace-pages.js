

/* SIMPLE UI v2
 * Reuses the original prototype's transaction, stock-ownership, settlement,
 * printing, localStorage and day-close logic. Only the presentation is simplified.
 */
let homeTab='todo', taskKind='all', inventoryOwner='owned', receiptWizard=null;
const oldInventoryBody=renderInventoryBody;
const oldCashBody=renderCashBody;
const oldCashCheck=openCashCheck;
const oldSaveNewReceipt=saveNewReceipt;
const oldOpenHelp=openHelp;

function detailHelp(title,text){
 return `<details class="details v2-help-details"><summary>${title}</summary><p>${text}</p></details>`;
}
function goCash(tab='movements'){cashTab=tab;navigate('cash');}
function goReceipts(tab='all'){navigate('receipts');filter=tab;render();}
function goSales(tab='all'){navigate('sales');filter=tab;render();}
function goInventory(){invTab='overview';navigate('inventory');}
function simpleKpi(label,amount,foot,action=''){
 const tag=action?'button':'div';
 return `<${tag} class="v2-kpi" ${action?`type="button" onclick="${action}"`:''}><div class="label">${label}</div><div class="value">${M(amount)}</div><div class="foot">${foot}</div></${tag}>`;
}
function taskItems(){
 const out=[];
 state.receipts.filter(r=>r.status!=='purchased').forEach(r=>out.push({
  key:r.id,kind:'purchase',name:r.name,meta:`${r.product} · အဆင့် ${r.grade} · ${vissText37(r.qty)} ပိဿာ`,
  status:receiptStatus(r),icon:r.status==='draft'?'note':r.status==='deposit'?'stock':'clock',
  label:r.status==='draft'?'ဆက်ဖြည့်မယ်':'ဈေးထည့်မယ်',action:`openReceiptProcess('${r.id}')`
 }));
 state.receipts.filter(r=>r.status==='purchased'&&due(r)>0).forEach(r=>out.push({
  key:r.id+'pay',kind:'money',name:r.name,meta:`အဝယ်ငွေ ရှင်းရန် · ${cashText(due(r))}`,
  status:pill('ပေးရန်ရှိ','amber'),icon:'wallet',label:'ငွေရှင်းမယ်',action:`openPurchasePayment('${r.id}')`
 }));
 state.sales.filter(s=>saleRemaining(s)>0).forEach(s=>out.push({
  key:s.id+'dispatch',kind:'dispatch',name:s.name,meta:`${s.product} · ${vissText37(saleRemaining(s))} ပိဿာ ထုတ်ရန်ကျန်`,
  status:pill('ဝယ်သူပိုင်ကုန်','blue'),icon:'truck',label:'ထုတ်ပေးမယ်',action:`openDispatch('${s.id}')`
 }));
 state.sales.filter(s=>receivable(s)>0).forEach(s=>out.push({
  key:s.id+'cash',kind:'money',name:s.name,meta:`အရောင်းငွေ ရရန် · ${cashText(receivable(s))}`,
  status:pill('ရရန်ရှိ','blue'),icon:'wallet',label:'ငွေလက်ခံမယ်',action:`openSalePayment('${s.id}')`
 }));
 state.requests.filter(r=>r.status==='issued').forEach(r=>out.push({
  key:r.id,kind:'money',name:'အိမ်မှ ငွေယူလက်မှတ်',meta:`${r.no} · ${cashText(r.amount)}`,
  status:pill('ငွေမရသေး','amber'),icon:'doc',label:'ငွေရရှိပြီ',action:`openReceiveMoney('${r.id}')`
 }));
 return out;
}
function taskRow(t){
 return `<div class="v2-task"><span class="task-icon">${I(t.icon)}</span><div class="grow"><strong>${E(t.name)}</strong><div class="meta">${E(t.meta)}</div></div>${t.status}${btn(t.label,t.action,'secondary')}</div>`;
}
renderNav=function(){
 const staff=[['home','home','ယနေ့အလုပ်'],['receipts','receive','အဝယ်'],['sales','sale','အရောင်း'],['records','doc','စာရင်းများ']];
 const owner=[['owner','home','ခြုံငုံကြည့်ရန်'],['inventory','stock','ကုန်စာရင်း'],['cash','wallet','ငွေစာရင်း'],['profit','chart','အရှုံးအမြတ်']];
 const active=state.role==='owner'?page:page==='tasks'?'home':['inventory','cash','prices'].includes(page)?'records':page;
 document.getElementById('topNav').innerHTML=(state.role==='owner'?owner:staff).map(([p,icon,label])=>
 `<button class="top-nav-btn ${active===p?'active':''}" onclick="navigate('${p}')" ${active===p?'aria-current="page"':''}>${I(icon)}${label}</button>`).join('');
 document.getElementById('roleSelect').value=state.role;
 document.getElementById('avatar').textContent=state.role==='owner'?'ပ':'စ';
};
heading=function(eyebrow,title,sub,action=''){
 return `<div class="page-heading"><div><h1>${title}</h1>${sub?`<p class="subtitle">${sub}</p>`:''}</div>${action}</div>`;
};
render=function(){
 clearToast();renderNav();
 const views={home:homePage,receipts:receiptsPage,sales:salesPage,inventory:inventoryPage,cash:cashPage,prices:pricesPage,owner:ownerPage,profit:profitPage,records:recordsPage,tasks:tasksPage};
 const content=(views[page]||homePage)();
 document.getElementById('main').innerHTML=content+
 ``+
 (!storageOK?`<div class="mt">${note('ဘရောက်ဇာတွင် ဒေတာမသိမ်းနိုင်ပါ။ ပိတ်လိုက်ပါက စမ်းထားသောဒေတာ ပျောက်နိုင်ပါသည်။','amber')}</div>`:'');
 if(page==='receipts')renderReceiptRows();
 if(page==='sales')renderSaleRows();
 if(page==='inventory')renderInventoryBody();
 if(page==='cash')renderCashBody();
};
homePage=function(){
 const o=state.opening,tasks=taskItems();
 let banner='';
 if(state.closed){
  banner=`<div class="v2-opening closed"><div class="v2-opening-info"><div class="icon-box">${I('check')}</div><div><h2>ဒီနေ့အလုပ် ပြီးပါပြီ။</h2><p>နောက်နေ့ချန်ငွေ ${accountValue68('cash',bal('cash'),cashText)}</p></div></div>${btn('နောက်နေ့ ဖွင့်မယ်','openNextDay()','primary','arrow')}</div>`;
 }else if(!o.checked){
  banner=`<div class="v2-opening"><div class="v2-opening-info"><div class="icon-box">${I('sun')}</div><div class="v2-opening-main"><div><h2>အလုပ်မစခင် ငွေစစ်မယ်။</h2><p>အံဆွဲထဲက ငွေကို ရေတွက်ထားပါ။</p></div><div><div class="v2-amount-label">မနေ့က ချန်ငွေ</div><div class="v2-opening-amount"><strong>${accountValue68('cash',o.expected,M)}</strong><span>ကျပ်</span></div></div></div></div>${btn('ငွေစစ်ပြီး စမယ်','openCashCheck()','primary','arrow','id="openCashBtn"')}</div>`;
 }else{
  banner=`<div class="v2-opening checked"><div class="v2-opening-info"><div class="icon-box">${I('wallet')}</div><div class="v2-opening-main"><div><h2>လက်ရှိ ပွဲရုံငွေသား</h2><p>${o.difference?'အဖွင့်ငွေ ကွာဟချက် မှတ်ထားသည်။':'မနက် အဖွင့်ငွေစစ်ပြီးပါပြီ။'}</p></div><div class="v2-opening-amount"><strong>${accountValue68('cash',bal('cash'),M)}</strong><span>ကျပ်</span></div></div></div>${btn('ငွေစာရင်း',`goCash()`,'secondary','wallet')}</div>`;
 }
 return heading('','ဒီနေ့ ဘာလုပ်မလဲ။',dayLabel(),state.closed?pill('နေ့ပိတ်ပြီး','gray'):pill(o.checked?'အလုပ်စနိုင်ပါပြီ':'အဖွင့်ငွေ စစ်ရန်',o.checked?'':'amber'))+
 banner+
 `<div class="v2-action-grid">
 <button class="v2-action" aria-label="ကုန်လက်ခံမယ်" onclick="startReceipt()"><span class="icon-box">${I('receive')}</span><strong>ကုန်လက်ခံမယ်</strong><small>လာချတဲ့ကုန်ကို အကြမ်းမှတ်မယ်</small>${I('arrow')}</button>
 <button class="v2-action" aria-label="ငွေရှင်းမယ်" onclick="goCash('debts')"><span class="icon-box">${I('wallet')}</span><strong>ငွေရှင်းမယ်</strong><small>ပေးရန်၊ ရရန်ငွေ ဆက်ရှင်းမယ်</small>${I('arrow')}</button>
 <button class="v2-action" aria-label="ကုန်ရောင်းမယ်" onclick="startSale()"><span class="icon-box">${I('sale')}</span><strong>ကုန်ရောင်းမယ်</strong><small>ဝယ်သူနဲ့ ဈေးဖြတ်ပြီး ရောင်းမယ်</small>${I('arrow')}</button>
 </div>
 <section><div class="v2-section-top"><h2>ဆက်လုပ်ရန် <span class="count-text">${tasks.length}</span></h2>${tasks.length?btn('အားလုံးကြည့်မယ်',`taskKind='all';navigate('tasks')`,'ghost','arrow'):''}</div>
 <div class="v2-list">${tasks.length?tasks.slice(0,3).map(taskRow).join(''):empty('လုပ်ရန်ကျန် မရှိပါ။','check')}</div></section>
 <div class="v2-home-footer"><span>${I('check')}ဆိုင်ပိတ်ချိန်မှာ ငွေလက်ကျန်ကို ပြန်စစ်ပါ။</span>${btn(state.closed?'နေ့ပိတ်မှတ်တမ်း':'နေ့ပိတ်မယ်','openCloseDay()','ghost','moon')}</div>`;
};
function tasksPage(){
 const tasks=taskItems().filter(t=>taskKind==='all'||t.kind===taskKind);
 return `<button class="v2-back" onclick="navigate('home')">${I('back')}ယနေ့အလုပ်သို့</button>`+
 heading('','ဆက်လုပ်ရန် ကျန်နေသည်','မှတ်တမ်းတစ်ခုကို ရွေးပြီး ဆက်လုပ်ပါ။')+
 `<div class="toolbar"><div class="tabs">${[['all','အားလုံး'],['money','ငွေရှင်းရန်'],['dispatch','ကုန်ထုတ်ရန်']].map(([k,t])=>`<button class="tab ${taskKind===k?'active':''}" onclick="taskKind='${k}';render()">${t}</button>`).join('')}</div><span class="small muted">${tasks.length} ခု</span></div>`+
 `<div class="v2-list">${tasks.map(taskRow).join('')||empty('လုပ်ရန်ကျန် မရှိပါ။','check')}</div>`;
}
function recordsPage(){
 const cards=[
 ['stock','ကုန်လက်ကျန်','ပွဲရုံပိုင်၊ အပ်ကုန်၊ ဝယ်သူပိုင်ကုန် ခွဲကြည့်မယ်။','goInventory()'],
 ['wallet','ငွေစာရင်း','လက်ကျန်ငွေ၊ ငွေအဝင်အထွက်နဲ့ အကြွေးကြည့်မယ်။',"goCash()"],
 ['price','ယနေ့ပေါက်ဈေး','သိရှိပြီးတဲ့ ကုန်ဈေးနှုန်းတွေ ထည့်မယ်။',"navigate('prices')"]
 ];
 return heading('','ဘာစာရင်း ကြည့်မလဲ။','နေ့စဉ်လိုအပ်တဲ့ စာရင်းတွေကို ဒီနေရာမှာ ကြည့်နိုင်ပါတယ်။')+
 `<div class="v2-links-grid">${cards.map(([i,t,d,a])=>`<button class="v2-records-card" onclick="${a}"><span class="icon-box">${I(i)}</span><strong>${t}</strong><p>${d}</p><span class="end-link">ဖွင့်ကြည့်မယ် ${I('arrow')}</span></button>`).join('')}</div>`+
 `<div class="v2-home-footer" style="margin-top:27px"><span>${I('moon')}ဆိုင်ပိတ်ချိန်မှာ ငွေလက်ကျန်ကို ပြန်စစ်ပါ။</span>${btn('နေ့ပိတ်မယ်','openCloseDay()','secondary','moon')}</div>`;
}
receiptsPage=function(){
 const tabs=[['all','အားလုံး'],['hold','ဈေးစောင့် / အပ်ကုန်'],['payable','ငွေရှင်းရန်'],['purchased','ဝယ်ပြီး']];
 return heading('','အဝယ်နှင့် အပ်ကုန်','ကုန်လာချချိန်မှ ငွေရှင်းချိန်အထိ။',btn('ကုန်လက်ခံမယ်','startReceipt()','primary','plus'))+
 `<div class="toolbar"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${filter===k?'active':''}" onclick="setFilter('${k}')">${t}</button>`).join('')}</div><div class="search">${I('search')}<input id="receiptSearch" aria-label="အဝယ်စာရင်းရှာရန်" placeholder="နာမည်၊ ကုန် ရှာမယ်" value="${E(searchTerm)}" oninput="searchTerm=this.value;renderReceiptRows()"></div></div>
 <div id="receiptRows"></div>
 <div class="v2-home-footer"><span>မဝယ်ရသေးသော အပ်ကုန် ${vissText37(stock('supplier'))} ပိဿာ</span>${btn('ယနေ့ပေါက်ဈေး',`navigate('prices')`,'secondary','price')}</div>`;
};
renderReceiptRows=function(){
 let rows=state.receipts.filter(r=>filter==='all'||filter==='draft'&&r.status==='draft'||filter==='hold'&&['await','deposit'].includes(r.status)||filter==='payable'&&r.status==='purchased'&&due(r)>0||filter==='purchased'&&r.status==='purchased'&&due(r)<=0);
 rows=rows.filter(r=>(r.name+r.product+r.no).toLowerCase().includes(searchTerm.toLowerCase()));
 document.getElementById('receiptRows').innerHTML=rows.length?`<div class="v2-list">${rows.map(r=>{
  const paid=r.status==='purchased',owing=paid&&due(r)>0;
  const action=owing?`openPurchasePayment('${r.id}')`:paid?`openReceiptDetail('${r.id}')`:`openReceiptProcess('${r.id}')`;
  const label=owing?'ငွေရှင်းမယ်':paid?'ကြည့်မယ်':r.status==='draft'?'ဆက်ဖြည့်မယ်':'ဈေးထည့်မယ်';
  return `<article class="v2-record"><div><button class="name-btn" onclick="openReceiptDetail('${r.id}')">${E(r.name)}</button><div class="record-meta">${E(r.product)} · အဆင့် ${r.grade} · ${r.type==='farmer'?'ကုန်သည်':'ကုန်သည်'}</div></div><div class="record-weight"><div class="record-qty">${vissText37(r.qty)} <small>ပိဿာ</small></div><div class="record-sub">${N(r.bags)} အိတ်</div></div><div class="record-status">${receiptStatus(r)}${owing?`<span class="record-sub">${cashText(due(r))}</span>`:r.advance?`<span class="record-sub">ကြိုငွေ ${M(r.advance)}</span>`:''}</div><div class="record-button">${btn(label,action,'secondary')}</div></article>`;
 }).join('')}</div>`:empty('ကိုက်ညီသော အဝယ်စာရင်း မရှိပါ။','receive');
};
salesPage=function(){
 return heading('','အရောင်းနှင့် ကုန်ထုတ်','ရောင်းပြီး ဆက်ထားတဲ့ကုန်ကိုလည်း ဒီနေရာမှာ ထုတ်ပေးမယ်။',btn('ကုန်ရောင်းမယ်','startSale()','primary','plus'))+
 `<div class="toolbar"><div class="tabs">${[['all','အားလုံး'],['collect','ကုန်ထုတ်ရန်'],['debt','ငွေရရန်'],['delivered','ထုတ်ပြီး']].map(([k,t])=>`<button class="tab ${filter===k?'active':''}" onclick="setFilter('${k}')">${t}</button>`).join('')}</div><div class="search">${I('search')}<input id="saleSearch" aria-label="အရောင်းစာရင်းရှာရန်" placeholder="ဝယ်သူ၊ ကုန် ရှာမယ်" value="${E(searchTerm)}" oninput="searchTerm=this.value;renderSaleRows()"></div></div>
 <div id="saleRows"></div><div class="v2-list-summary"><span>ကုန်ထုတ်ရန် <strong>${vissText37(stock('customer'))} ပိဿာ</strong></span><span>ရောင်းရငွေ ရရန် <strong>${cashText(receivableTotal())}</strong></span></div>`;
};
renderSaleRows=function(){
 let rows=state.sales.filter(s=>filter==='all'||filter==='collect'&&saleRemaining(s)>0||filter==='debt'&&receivable(s)>0||filter==='delivered'&&saleRemaining(s)===0);
 rows=rows.filter(s=>(s.name+s.product+s.no).toLowerCase().includes(searchTerm.toLowerCase()));
 document.getElementById('saleRows').innerHTML=rows.length?`<div class="v2-list">${rows.map(s=>{
  const collect=saleRemaining(s)>0,money=receivable(s)>0;
  const cashAction=filter==='debt'&&money;
  const label=cashAction?'ငွေလက်ခံမယ်':collect?'ထုတ်ပေးမယ်':money?'ငွေလက်ခံမယ်':'ကြည့်မယ်';
  const action=cashAction?`openSalePayment('${s.id}')`:collect?`openDispatch('${s.id}')`:money?`openSalePayment('${s.id}')`:`openSaleDetail('${s.id}')`;
  return `<article class="v2-record"><div><button class="name-btn" onclick="openSaleDetail('${s.id}')">${E(s.name)}</button><div class="record-meta">${E(s.product)} · အဆင့် ${s.grade} · ${vissText37(s.qty)} ပိဿာ ရောင်းထား</div></div><div class="record-weight"><div class="record-qty">${N(saleRemaining(s))} <small>ပိဿာ</small></div><div class="record-sub">ထုတ်ရန်ကျန်</div></div><div class="record-status">${saleStatus(s)}<span class="record-sub">${money?'ငွေရရန် '+M(receivable(s)):'ငွေရပြီး'}</span></div><div class="record-button">${btn(label,action,'secondary')}</div></article>`;
 }).join('')}</div>`:empty('ကိုက်ညီသော အရောင်းစာရင်း မရှိပါ။','sale');
};
inventoryPage=function(){
 const owner=state.role==='owner';
 return (owner?'':`<button class="v2-back" onclick="navigate('records')">${I('back')}စာရင်းများသို့</button>`)+
 heading('','ကုန်လက်ကျန်',`ပွဲရုံထဲရှိသင့်သော စုစုပေါင်း ${vissText37(stock())} ပိဿာ`,owner?'':btn('မြေပြင်စစ်မယ်','openGround()','secondary','scale'))+
 `<div class="toolbar"><div class="tabs">${[['overview','လက်ကျန်ကြည့်မယ်'],['ledger','ကုန်လယ်ဂျာ'],['ground','မြေပြင်စစ်ချက်']].map(([k,t])=>`<button class="tab ${invTab===k?'active':''}" onclick="invTab='${k}';render()">${t}</button>`).join('')}</div></div><div id="inventoryBody"></div>`;
};
renderInventoryBody=function(){
 if(invTab!=='overview'){oldInventoryBody();return;}
 const ownerInfo=[['owned','ပွဲရုံပိုင်ကုန်','ရောင်းနိုင်သော ကိုယ်ပိုင်ကုန်'],['supplier','ကုန်သည်ပိုင်ကုန်','မဝယ်ရသေးသော သူများပိုင်ကုန်'],['customer','ဝယ်သူပိုင်ကုန်','ရောင်းပြီး မထုတ်ရသေးသောကုန်']];
 let rows='';
 if(inventoryOwner==='owned'){
  rows=stockGroups(state.lots).filter(g=>g.owned>0).map(g=>`<div class="v2-stock-row"><span class="icon-box">${I('grain')}</span><div class="grow"><strong>${E(g.product)} · အဆင့် ${g.grade}</strong><div class="meta">ပွဲရုံပိုင် ${N(g.ownedBags)} အိတ်</div></div><div class="amount">${vissText37(g.owned)} ပိဿာ${state.role==='owner'?`<small>ဝယ်ရင်း ${cashText(g.cost)}</small>`:''}</div></div>`).join('');
 }else{
  rows=activeLots(inventoryOwner).map(l=>`<div class="v2-stock-row"><span class="icon-box">${I(inventoryOwner==='supplier'?'receive':'truck')}</span><div class="grow"><strong>${E(l.name)}</strong><div class="meta">${E(l.product)} · အဆင့် ${l.grade} · ${N(l.bags)} အိတ်</div></div><div class="amount">${vissText37(l.qty)} ပိဿာ</div></div>`).join('');
 }
 document.getElementById('inventoryBody').innerHTML=`<div class="v2-ownership">${ownerInfo.map(([k,t,d])=>`<button class="v2-owner-choice ${inventoryOwner===k?'active':''}" aria-pressed="${inventoryOwner===k}" onclick="inventoryOwner='${k}';renderInventoryBody()"><strong>${t}</strong><span class="number">${N(stock(k))}<small>ပိဿာ</small></span><small>${d}</small></button>`).join('')}</div>
 <div class="v2-list">${rows||empty('ဤပိုင်ဆိုင်မှုအမျိုးအစားမှာ ကုန်မရှိပါ။','stock')}</div>
 <p class="field-help mt">${inventoryOwner==='owned'?'အပ်ကုန်နဲ့ ဝယ်သူပိုင်ကုန်ကို ဤစာရင်းမှာ ထည့်မတွက်ထားပါ။':'ပွဲရုံထဲမှာ ရှိပေမဲ့ ကိုယ်ပိုင်ကုန်အဖြစ် ထပ်ရောင်းလို့ မရပါ။'}</p>
 ${state.role==='owner'&&inventoryOwner==='owned'?`<details class="details mt"><summary>ဝယ်ရင်းတန်ဖိုးနဲ့ ပေါက်ဈေးတန်ဖိုး နှိုင်းယှဉ်မယ်</summary><div class="summary-line mt"><span>ဝယ်ရင်းတန်ဖိုး</span><strong>${cashText(ownedValue())}</strong></div><div class="summary-line"><span>ယနေ့ပေါက်ဈေးဖြင့် တန်ဖိုး</span><strong>${activeLots('owned').every(l=>state.prices[l.product+'|'+l.grade]>0)?cashText(activeLots('owned').reduce((s,l)=>s+l.qty*state.prices[l.product+'|'+l.grade],0)):'ဈေးမပြည့်စုံသေး'}</strong></div><p>ကိုယ်ပိုင်ကုန်ကိုသာ တွက်ထားသည်။ ဈေးမသိသေးသောကုန်ကို သုညတန်ဖိုးဟု မယူပါ။</p></details>`:''}`;
};
cashPage=function(){
 const owner=state.role==='owner';
 const headerAction=owner?btn('ငွေယူလက်မှတ်','openMoneyRequest()','primary','doc'):btn('အသုံးစရိတ် မှတ်မယ်','openExpense()','secondary','plus');
 return (owner?'':`<button class="v2-back" onclick="navigate('home')">${I('back')}ယနေ့အလုပ်သို့</button>`)+
 heading('','ငွေစာရင်း','လက်ကျန်ငွေ၊ ပေးရန်နဲ့ ရရန်ကို ခွဲကြည့်မယ်။',headerAction)+
 `<div class="v2-cash-strip">${[['cash','ပွဲရုံ ငွေသား'],['bank','ဘဏ် / ငွေပေးချေမှုအကောင့်'],[owner?'home':'out',owner?'အိမ် ငွေသိမ်းရာ':'ယနေ့ ငွေသားအထွက်']].map(([a,t])=>`<div><span class="label">${t}</span><strong>${M(a==='out'?-state.transactions.filter(t=>t.account==='cash'&&t.amount<0&&t.date===today()).reduce((s,t)=>s+t.amount,0):bal(a))}</strong><small>ကျပ်</small></div>`).join('')}</div>
 ${state.opening.difference?`<div class="mb">${note(`အဖွင့်ငွေကွာဟချက် ${cashText(state.opening.difference)} — စာရင်းလက်ကျန်ကို အလိုအလျောက် မပြင်ထားပါ။`,'amber')}</div>`:''}
 <div class="toolbar"><div class="tabs">${[['movements','အဝင် / အထွက်'],['payables','ပေးရန်ရှိ'],['receivables','ရရန်ရှိ'],['requests','ငွေယူလက်မှတ်']].map(([k,t])=>`<button class="tab ${cashTab===k?'active':''}" onclick="cashTab='${k}';render()">${t}</button>`).join('')}</div></div><div id="cashBody"></div>`;
};
renderCashBody=function(){
 if(cashTab==='payables'){
  const pay=state.receipts.filter(r=>r.status==='purchased'&&due(r)>0);
  document.getElementById('cashBody').innerHTML=`<section class="card cash-debt-section"><div class="card-title"><div><h3>ပေးရန်ရှိ</h3><p class="small muted" style="margin-top:4px">ကုန်ဝယ်ယူပြီး ကုန်သည်ထံ ပေးရန်ကျန်ငွေများ</p></div>${pill(cashText(payableTotal()),'amber')}</div>
  ${pay.length?`<div class="v2-list cash-debt-list">${pay.map(r=>`<article class="v2-record cash-debt-row"><div><strong>${E(r.name)}</strong><div class="record-meta">${E(r.product)} · ${r.purchaseNo||r.no}</div></div><div class="record-weight"><div class="record-qty">${vissText37(r.qty)} <small>ပိဿာ</small></div><div class="record-sub">${N(r.bags)} အိတ်</div></div><div class="record-status">${pill('ပေးရန်','amber')}<span class="record-sub">${cashText(due(r))}</span></div><div class="record-button">${state.role==='staff'?btn('ငွေရှင်းမယ်',`openPurchasePayment('${r.id}')`,'secondary'):btn('အသေးစိတ်',`openReceiptDetail('${r.id}')`,'secondary')}</div></article>`).join('')}</div>`:empty('ပေးရန်မရှိပါ။','check')}
  </section><div class="v2-home-footer"><span>အပ်ကုန်အတွက် ကြိုသုံးထားငွေ — <strong>${cashText(advanceTotal())}</strong></span>${state.role==='staff'?btn('ကြိုငွေ ထုတ်မယ်',`goReceipts('hold')`,'secondary','wallet'):''}</div>
  ${detailHelp('ပေးရန်စာရင်းအကြောင်း','အဝယ်စာရင်းတစ်စောင်ချင်းအလိုက် ပေးပြီးသားကြိုငွေနှင့် ရှင်းပြီးငွေကို နုတ်ပြီး ကျန်ငွေကိုသာ ပေးရန်ရှိအဖြစ် ပြထားသည်။')}`;
  return;
 }
 if(cashTab==='receivables'){
  const rec=state.sales.filter(s=>receivable(s)>0);
  document.getElementById('cashBody').innerHTML=`<section class="card cash-debt-section"><div class="card-title"><div><h3>ရရန်ရှိ</h3><p class="small muted" style="margin-top:4px">ကုန်ရောင်းပြီး ဝယ်သူထံမှ ရရန်ကျန်ငွေများ</p></div>${pill(cashText(receivableTotal()),'blue')}</div>
  ${rec.length?`<div class="v2-list cash-debt-list">${rec.map(s=>`<article class="v2-record cash-debt-row"><div><strong>${E(s.name)}</strong><div class="record-meta">${E(s.product)} · ${s.no}</div></div><div class="record-weight"><div class="record-qty">${vissText37(s.qty)} <small>ပိဿာ</small></div><div class="record-sub">${N(s.bags)} အိတ်</div></div><div class="record-status">${pill('ရရန်','blue')}<span class="record-sub">${cashText(receivable(s))}</span></div><div class="record-button">${state.role==='staff'?btn('လက်ခံမယ်',`openSalePayment('${s.id}')`,'secondary'):btn('အသေးစိတ်',`openSaleDetail('${s.id}')`,'secondary')}</div></article>`).join('')}</div>`:empty('ရရန်မရှိပါ။','check')}
  </section>${detailHelp('ရရန်စာရင်းအကြောင်း','အရောင်းတစ်စောင်ချင်းအလိုက် လက်ခံပြီးသားငွေကို နုတ်ပြီး ဝယ်သူထံမှ ကျန်ရရန်ငွေကိုသာ ပြထားသည်။')}`;
  return;
 }
 if(cashTab==='debts'){cashTab='payables';renderCashBody();return;}
 oldCashBody();
};
ownerPage=function(){
 const groups=stockGroups(state.lots).filter(g=>g.owned>0);
 return heading('','ပွဲရုံအခြေအနေ',dayLabel(),btn('ငွေယူလက်မှတ်','openMoneyRequest()','primary','doc'))+
 `<div class="v2-kpis">${simpleKpi('ပွဲရုံ ငွေသား',bal('cash'),'ကျပ် · လက်ရှိစာရင်းလက်ကျန်',`goCash()`)}${simpleKpi('ကိုယ်ပိုင်ကုန် ဝယ်ရင်း',ownedValue(),'ကျပ် · သူများပိုင်ကုန် မပါ',`goInventory()`)}${simpleKpi('ရရန်ရှိ',receivableTotal(),'ကျပ် · အရောင်းကျန်ငွေ',`goCash('receivables')`)}${simpleKpi('ပေးရန်ရှိ',payableTotal(),'ကျပ် · အဝယ်ကျန်ငွေ',`goCash('payables')`)}</div>
 <div class="v2-owner-grid"><section class="card"><div class="card-title"><h3>ကိုယ်ပိုင်ကုန်လက်ကျန်</h3>${btn('အသေးစိတ်','goInventory()','ghost','arrow')}</div>
 ${groups.map(g=>`<div class="v2-stock-row" style="padding-left:0;padding-right:0"><span class="icon-box">${I('grain')}</span><div class="grow"><strong>${g.product} · အဆင့် ${g.grade}</strong><div class="meta">${N(g.ownedBags)} အိတ် · ${cashText(g.cost)}</div></div><div class="amount">${vissText37(g.owned)} ပိဿာ</div></div>`).join('')}
 <div class="divider"></div><div class="row between wrap small"><span class="muted">ကုန်သည်ပိုင်ကုန်</span><strong>${vissText37(stock('supplier'))} ပိဿာ</strong></div>
 <div class="row between wrap small mt" style="margin-top:13px"><span class="muted">ဝယ်သူပိုင် ကျန်ကုန်</span><strong>${vissText37(stock('customer'))} ပိဿာ</strong></div>
 <p class="field-help mt">အပ်ကုန်နှင့် ဝယ်သူပိုင်ကုန်ကို ကိုယ်ပိုင်ကုန်တန်ဖိုးထဲ မပေါင်းထားပါ။</p></section>
 <section class="card"><div class="card-title"><h3>ငွေသိမ်းရာအလိုက်</h3>${I('wallet')}</div>
 ${[['cash','ပွဲရုံ ငွေသား'],['bank','ဘဏ် / ငွေပေးချေမှုအကောင့်'],['home','အိမ် ငွေသိမ်းရာ']].map(([a,t])=>`<div class="v2-balance-row"><span class="label">${t}</span><div class="right"><strong>${M(bal(a))}</strong><span class="muted">ကျပ်</span></div></div>`).join('')}
 <div class="v2-finance-total"><span>စုစုပေါင်း</span><div class="right"><strong>${M(bal('cash')+bal('bank')+bal('home'))}</strong><div class="small muted">ကျပ်</div></div></div>
 ${detailHelp('“အိမ်” အကောင့်အကြောင်း','ဤနမူနာတွင် အိမ်ကို လုပ်ငန်း၏ ငွေသိမ်းရာတစ်ခုအဖြစ် သတ်မှတ်ထားသည်။ ပိုင်ရှင်ကိုယ်ပိုင်ငွေလားဆိုတာ အတည်ပြုရန်လိုသည်။')}</section></div>
 ${state.opening.difference?`<div class="mt">${note(`အဖွင့်ငွေကွာဟချက် ${cashText(state.opening.difference)} ရှိသည်။ ${E(state.opening.note)}`,'amber')}</div>`:''}
 <div class="v2-home-footer"><span>${I('doc')}ငွေမရသေးသော ငွေယူလက်မှတ် ${state.requests.filter(r=>r.status==='issued').length} စောင်</span>${btn('လက်မှတ်ကြည့်မယ်',`goCash('requests')`,'secondary','arrow')}</div>
 <details class="details mt"><summary>လတ်တလော လုပ်ဆောင်ချက်များ</summary>${state.activity.length?state.activity.slice(0,8).map(a=>`<div class="audit-row"><span class="time">${a.time}</span><span class="small">${E(a.text)}</span></div>`).join(''):'<p>စမ်းသပ်လုပ်ဆောင်ချက် မရှိသေးပါ။</p>'}</details>`;
};

/* Compact, accessible dialogs, with focus retained between steps. */
openModal=function(title,subtitle,body,footer='',wide=false){
 clearToast();
 const root=document.getElementById('modalRoot');
 if(!root.classList.contains('visible'))modalReturnFocus=document.activeElement;
 root.innerHTML=`<section class="modal"><header class="modal-head"><div><h2 id="modalTitle">${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div><button type="button" class="btn-icon" aria-label="ပိတ်ရန်" onclick="closeModal()">${I('close')}</button></header><div class="modal-body"><div id="modalError" class="form-error" role="alert"></div>${body}</div>${footer?`<footer class="modal-footer">${footer}</footer>`:''}</section>`;
 root.classList.add('visible');document.body.style.overflow='hidden';document.getElementById('app').inert=true;document.getElementById('app').setAttribute('aria-hidden','true');
 setTimeout(()=>{const el=root.querySelector('input:not([type="hidden"]):not([readonly]),select,textarea,.modal-footer button,.modal-head button');if(el)el.focus({preventScroll:true});},30);
};
closeModal=function(){
 const root=document.getElementById('modalRoot');
 root.classList.remove('visible');root.innerHTML='';document.body.style.overflow='';document.getElementById('app').inert=false;document.getElementById('app').removeAttribute('aria-hidden');
 if(modalReturnFocus&&modalReturnFocus.isConnected)modalReturnFocus.focus({preventScroll:true});
};
rSummary=function(r){
 return `<div class="v2-person-summary"><div><strong>${E(r.name)}</strong><small>${r.type==='farmer'?'ကုန်သည်':'ကုန်သည်'}${r.car?' · '+E(r.car):''}</small></div><div class="right"><strong>${E(r.product)} · ${r.grade}</strong><small>${N(r.bags)} အိတ် · ${vissText37(r.qty)} ပိဿာ</small></div></div>`;
};
openCashCheck=function(){
 if(state.opening.checked){oldCashCheck();return;}
 openModal('အံဆွဲထဲမှာ ငွေဘယ်လောက်ရှိလဲ။','ငွေကိုရေတွက်ပြီး ရရှိတဲ့ပမာဏ ထည့်ပါ။',
 `<div class="v2-expected"><div class="label">မနေ့က စာရင်းပိတ်လက်ကျန်</div><strong>${M(state.opening.expected)}</strong><span>ကျပ်</span></div>
 <form id="openingForm" onsubmit="event.preventDefault();saveOpening()">${field('အခု ရေတွက်ရရှိငွေ','openingActual',{type:'number',min:0,required:true,suffix:'ကျပ်',placeholder:'ငွေပမာဏ ထည့်ပါ',extra:'oninput="updateOpeningDiff()"'})}
 <div id="openingDiff"></div><div id="openingNoteWrap" style="display:none;margin-top:18px">${field('ငွေကွာဟချက် မှတ်ချက်','openingNote',{placeholder:'ပိုနေ၊ လိုနေသည့်အကြောင်း မှတ်ပါ'})}</div></form>`,
 btn('မစစ်သေးပါ','closeModal()','secondary')+btn('စစ်ပြီး စမယ်','saveOpening()','primary','check','id="saveOpeningBtn"'));
};
updateOpeningDiff=function(){
 const a=number('openingActual');
 if(!Number.isFinite(a)){document.getElementById('openingDiff').innerHTML='';document.getElementById('openingNoteWrap').style.display='none';return;}
 const d=a-state.opening.expected;
 document.getElementById('openingDiff').innerHTML=`<div class="result-banner ${d?'mismatch':''}">${d?`ငွေ${d>0?'ပို':'လို'} ${cashText(Math.abs(d))}`:I('check')+' ငွေစာရင်း ကိုက်ညီပါတယ်။'}</div>`;
 document.getElementById('openingNoteWrap').style.display=d?'block':'none';
};

/* Receiving now asks only one small group of questions at a time. */
startReceipt=function(){
 if(!guardWork())return;
 receiptWizard={name:'',type:'trader',product:PRODUCTS[0],grade:'A',bags:'',qty:'',source:'scale'};
 receiptIntro();
};
function receiptIntro(){
 const w=receiptWizard;
 openModal('ကုန်လက်ခံမယ်','ကုန်လာချသူ အချက်အလက်ကို အရင်မှတ်မယ်။',
 `${steps(0,['ကုန်လာချသူ','ကုန်နှင့်အလေးချိန်'])}
 <div class="simple-form">
  <div class="simple-form-head"><div><strong>အဆင့် ၁ · ကုန်လာချသူ</strong><small>အမည်ကို အရင်သေချာမှတ်ထားပြီး နောက်အဆင့်မှာ ကုန်နှင့် အလေးချိန်ကို ဆက်ဖြည့်ပါ။</small></div><span class="simple-badge">ကုန်လက်ခံမည်</span></div>
  <form id="receiptIntroForm" onsubmit="event.preventDefault();receiptIntroNext()" class="simple-form">
   <section class="simple-form-section">
    <div class="simple-form-title"><span class="num">1</span><strong>ကုန်လာချသူ အချက်အလက်</strong></div>
    <p class="simple-form-note">လက်ရှိ Flow မပြောင်းဘဲ ကုန်သည်အမည်ကို ပထမဦးစွာ မှတ်တမ်းတင်ပါမည်။</p>
    <div class="simple-inline-card"><strong>အမျိုးအစား</strong><p>ကုန်သည်</p></div>
    <div class="mt">${field('အမည်','introName',{value:w.name,required:true,placeholder:'ကုန်လာချသူအမည် ထည့်ပါ',extra:'list="supplierNames" maxlength="80"'})}</div>
    <datalist id="supplierNames">${[...new Set(state.receipts.map(r=>r.name))].map(n=>`<option value="${E(n)}"></option>`).join('')}</datalist>
   </section>
  </form>
 </div>`,
 btn('ပိတ်မယ်','closeModal()','secondary')+btn('ဆက်မယ်','receiptIntroNext()','primary','arrow','id="receiptIntroNext"'));
}function chooseSupplierType(type){
 receiptWizard.name=value('introName');receiptWizard.type=type;
 receiptWizard.source=type==='farmer'?'scale':'declared';
 receiptIntro();
}
function receiptIntroNext(){
 if(!validForm('receiptIntroForm'))return;
 const name=value('introName');if(!name)return error('ကုန်လာချသူအမည် ထည့်ပါ။');
 receiptWizard.name=name;receiptCargo();
}
function receiptCargo(){
 const w=receiptWizard;
 openModal('ကုန်လက်ခံမယ်',`${E(w.name)} · ကုန်နှင့် အလေးချိန်ကို ဖြည့်ပါ။`,
 `${steps(1,['ကုန်လာချသူ','ကုန်နှင့်အလေးချိန်'])}
 <form id="newReceiptForm" class="simple-form" onsubmit="event.preventDefault();saveNewReceipt(false)">
 <input type="hidden" id="newName" value="${E(w.name)}"><input type="hidden" id="newType" value="${w.type}">
 <input type="hidden" id="newProduct" value="${w.product}"><input type="hidden" id="newGrade" value="${w.grade}">
 <div class="simple-form-head"><div><strong>အဆင့် ၂ · ကုန်အချက်အလက်</strong><small>ကုန်အမျိုးအစား၊ အရည်အသွေး၊ အလေးချိန်နဲ့ အိတ်အရေအတွက်ကို တစ်နေရာထဲမှာ ရိုးရိုးရှင်းရှင်း ဖြည့်နိုင်အောင် စီထားပါတယ်။</small></div><span class="simple-badge">${E(w.name)}</span></div>
 <section class="simple-form-section">
  <div class="simple-form-title"><span class="num">1</span><strong>ကုန်အမျိုးအစားနှင့် အရည်အသွေး</strong></div>
  <p class="simple-form-note">ရွေးချယ်စရာတွေကို မပြောင်းဘဲ Chip ပုံစံနဲ့ပဲ ရွေးနိုင်ပါတယ်။</p>
  <label>ကုန်အမျိုးအစား</label><div class="v2-chips" id="productChips" role="group" aria-label="ကုန်အမျိုးအစား">${PRODUCTS.map(p=>`<button type="button" class="v2-chip ${w.product===p?'selected':''}" aria-pressed="${w.product===p}" onclick="receiptChip('product','${p}')">${p}</button>`).join('')}</div>
  <div class="mt"></div>
  <label>အရည်အသွေး</label><div class="v2-chips grade" id="gradeChips" role="group" aria-label="အရည်အသွေး">${['A','B','C'].map(g=>`<button type="button" class="v2-chip grade-chip ${w.grade===g?'selected':''}" aria-pressed="${w.grade===g}" onclick="receiptChip('grade','${g}')">${g}</button>`).join('')}</div>
 </section>
 <section class="simple-form-section">
  <div class="simple-form-title"><span class="num">2</span><strong>ပမာဏနှင့် အရေအတွက်</strong></div>
  <p class="simple-form-note">အလေးချိန်နဲ့ အိတ်အရေအတွက်ကို သီးခြားမှတ်ထားပါမည်။</p>
  <div class="field-row">${field('အလေးချိန်','newQty',{type:'number',min:.001,step:.001,value:w.qty,required:true,suffix:'ပိဿာ',placeholder:'ဥပမာ 300'})}${field('အိတ်အရေအတွက်','newBags',{type:'number',min:1,value:w.bags,required:true,suffix:'အိတ်',placeholder:'ဥပမာ 10'})}</div>
 </section>
 <section class="simple-form-section">
  <div class="simple-form-title"><span class="num">3</span><strong>အလေးချိန်ရရှိပုံ</strong></div>
  ${w.type==='farmer'?'<input type="hidden" id="newSource" value="scale"><div class="simple-inline-card"><strong>ကတ္တားဖြင့် ချိန်ထားသောအလေးချိန်</strong><p>တောင်သူ / ကုန်သည်ဘက်မှ ကတ္တားချိန်ပမာဏကို မှတ်သားထားပါသည်။</p></div>':selectField('အလေးချိန်ရရှိပုံ','newSource',[['declared','ကုန်သည်ပေးလာသော အလေးချိန်'],['reweighed','ပြန်ချိန်ထားသော အလေးချိန်']],w.source)}
  <p class="field-help mt">ဈေး၊ ကားနံပါတ်၊ ကြိုငွေတို့ကို နောက်အဆင့်များတွင် ဆက်လက်ဖြည့်နိုင်ပါသည်။</p>
 </section>
 </form>`,
 btn('နောက်ပြန်','receiptCargoBack()','secondary','back')+btn('အကြမ်း သိမ်းမယ်','saveNewReceipt(false)','primary','check','id="saveReceiptNext"'));
}function receiptChip(key,val){
 receiptWizard[key]=val;
 const id=key==='product'?'newProduct':'newGrade';
 document.getElementById(id).value=val;
 document.querySelectorAll(`#${key==='product'?'productChips':'gradeChips'} button`).forEach(b=>{
  const selected=b.textContent.trim()===val;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
 });
}
function receiptCargoBack(){
 receiptWizard.qty=value('newQty');receiptWizard.bags=value('newBags');receiptWizard.source=value('newSource');
 receiptIntro();
}
saveNewReceipt=function(next){
 const before=state.receipts.length;
 oldSaveNewReceipt(false);
 if(state.receipts.length===before)return;
 const r=state.receipts[0];
 openModal('ကုန်လက်ခံပြီးပါပြီ။','အကြမ်းမှတ်တမ်းကို သိမ်းထားပါပြီ။',
 `<div class="v2-success"><div class="icon-box">${I('check')}</div><h3>${E(r.name)}</h3><p>${E(r.product)} · အဆင့် ${r.grade} · ${vissText37(r.qty)} ပိဿာ · ${N(r.bags)} အိတ်</p><div class="summary-box"><p class="small">ကားနံပါတ်၊ ကြိုငွေနဲ့ ဈေးတို့ကို အခုဆက်ဖြည့်နိုင်ပါတယ်။ နောက်မှလည်း ပြန်ဆက်လုပ်နိုင်ပါတယ်။</p></div></div>`,
 btn('ပြီးပါပြီ','closeModal()','secondary')+btn('အချောဆက်ဖြည့်မယ်',`openReceiptDetailForm('${r.id}')`,'primary','arrow'));
};
openReceiptDetailForm=function(id){
 const r=state.receipts.find(x=>x.id===id);
 openModal('အချောစာရင်း ဆက်ဖြည့်မယ်','အရင်မှတ်ထားတာတွေကို ပြန်ရိုက်စရာ မလိုပါ။',
 `${rSummary(r)}<form id="receiptDetailForm" onsubmit="event.preventDefault();saveReceiptDetail('${id}',true)">
 ${field('ကားနံပါတ်','detailCar',{value:r.car,placeholder:'ကားနံပါတ်ရှိပါက ဖြည့်ပါ',extra:'maxlength="40"'})}
 <details class="details"><summary>မှတ်ချက် ထည့်မယ်</summary><div class="field mt"><label for="detailNote">မှတ်ချက်</label><textarea id="detailNote" maxlength="400" placeholder="လိုအပ်တာကိုပဲ မှတ်ပါ">${E(r.note)}</textarea></div></details></form>
 <div class="summary-box mt"><div class="row between wrap"><div><span class="small muted">ကြိုသုံးထားငွေ</span><div><strong>${cashText(r.advance)}</strong></div></div>${btn('ကြိုငွေ ထုတ်မယ်',`saveDraftDetailsAndAdvance('${id}')`,'secondary','wallet')}</div></div>`,
 btn('ဈေးစောင့်မယ်',`saveReceiptDetail('${id}',false)`,'secondary','clock')+btn('ဈေးထည့်မယ်',`saveReceiptDetail('${id}',true)`,'primary','arrow'));
};
openPricing=function(id){
 const r=state.receipts.find(x=>x.id===id),rate=state.prices[r.product+'|'+r.grade]||((r.priceDate||r.date)===today()?r.price:'')||'';
 openModal('ဈေးကြိုက်ရင် ဝယ်မယ်။','မရောင်းသေးရင် အပ်ထားနိုင်ပါတယ်။',
 `${rSummary(r)}
 ${r.price&&(r.priceDate||r.date)!==today()?`<p class="field-help mb">ယခင်ဈေး ${cashText(r.price)} ဖြစ်သည်။ ယနေ့ဈေးကို ပြန်အတည်ပြုပါ။</p>`:''}
 <form id="pricingForm" onsubmit="event.preventDefault();beginPurchase('${id}')">
 ${field('သဘောတူထားသော တစ်ပိဿာဈေး','receiptPrice',{type:'number',min:1,value:rate,suffix:'ကျပ်',placeholder:'ဈေးမသိသေးရင် အလွတ်ထားပါ',extra:`oninput="updatePricePreview('${id}')"`})}<div id="pricePreview"></div></form>
 <div class="row between wrap mt"><div class="small muted">ကြိုငွေ <strong>${cashText(r.advance)}</strong></div>${btn('ကြိုငွေ ထုတ်မယ်',`openAdvance('${id}','pricing')`,'ghost','wallet')}</div>
 ${detailHelp('ဈေးတွက်ပုံ · နမူနာသတ်မှတ်ချက်','ဤနမူနာတွင် တစ်ပိဿာနှုန်းဖြင့် တွက်ထားသည်။ ပေါက်ဈေးနှင့် တွက်ဈေးကွာခြားမှု၊ အိတ်အလေးချိန်နှင့် နုတ်ငွေသတ်မှတ်ချက်များကို အတည်ပြုရန်ကျန်သည်။')}`,
 btn('အပ်ထားမယ်',`saveDeposit('${id}')`,'secondary','stock')+btn('ဝယ်မယ်',`beginPurchase('${id}')`,'primary','arrow'));
 updatePricePreview(id);
};
openPurchaseSettlement=function(){
 const r=state.receipts.find(x=>x.id===wizard.id),net=Math.round(r.qty*wizard.price)-r.wage-r.weigh-r.advance;
 openModal('အဝယ်ငွေ ရှင်းမယ်','ကြိုသုံးထားငွေကို နုတ်ပြီးသား ဖြစ်ပါတယ်။',
 `${rSummary(r)}<form id="purchaseForm" onsubmit="event.preventDefault();commitPurchase()">
 <div id="purchaseSummary" class="summary-box mb"></div>
 <details class="details mb"><summary>လုပ်သားခ၊ ချိန်ခ နုတ်ငွေ ပြင်မယ်</summary>
 <div class="field-row mt">${field('လုပ်သားခ','purchaseWage',{type:'number',min:0,value:r.wage,suffix:'ကျပ်',required:true,extra:'oninput="updatePurchaseTotal()"'})}${field('ချိန်ခ / လုပ်အားခ','purchaseWeigh',{type:'number',min:0,value:r.weigh,suffix:'ကျပ်',required:true,extra:'oninput="updatePurchaseTotal()"'})}</div>
 <details class="details"><summary>ကိုင်ခ တွက်ကြည့်မယ်</summary><p>နမူနာ — တစ်အိတ်ကို နှစ်ပိုင်းဟု သတ်မှတ်ထားသည်။ အကြိမ်နဲ့ နှုန်းကို ပြင်နိုင်သည်။</p>
 <div class="field-row mt">${field('ကိုင်သည့်အကြိမ်','handlingTimes',{type:'number',min:1,value:1})}${field('တစ်ပိုင်း တစ်ခါကိုင်နှုန်း','handlingRate',{type:'number',min:0,value:100,suffix:'ကျပ်'})}</div>${btn('တွက်ပြီး ထည့်မယ်','applyHandling()','secondary','scale')}</details></details>
 <div class="field-row">${accountField('purchaseAccount','cash','ဘယ်အကောင့်က ပေးမလဲ')}${field('ယခု ထုတ်ပေးမည့်ငွေ','purchasePay',{type:'number',min:0,value:Math.max(0,net),required:true,suffix:'ကျပ်',extra:'oninput="this.dataset.edited=\'1\';updatePurchaseTotal()"'})}</div>
 </form>${detailHelp('ငွေရှင်းပုံ · နမူနာသတ်မှတ်ချက်','တစ်စိတ်တစ်ပိုင်းငွေရှင်းခြင်းကို နမူနာအဖြစ် ပြထားသည်။ ငွေမရှင်းသေးလျှင် သုညထည့်နိုင်သည်။ အကြွေးခွင့်၊ လုပ်သားခနှင့် ချိန်ခကို မည်သူခံရမည်ဆိုသည့် စည်းမျဉ်းများကို အတည်ပြုရန်ကျန်သည်။')}`,
 btn('နောက်ပြန်',`openPricing('${r.id}')`,'secondary','back')+btn('အတည်ပြုပြီး သိမ်းမယ်','commitPurchase()','primary','check','id="commitPurchaseBtn"'));
 updatePurchaseTotal();
};
openSaleStep=function(step){
 const w=wizard,groups=ownedGroups(),g=groups.find(x=>x.key===w.key);
 const stepHtml=steps(step,['ရောင်းမည့်ကုန်','ငွေလက်ခံမှု','ကုန်သိမ်းပုံ']);
 if(step===0){
  openModal('ဘာကုန် ရောင်းမလဲ။','ပွဲရုံပိုင်ကုန်ကိုသာ ရွေးနိုင်ပါတယ်။',
  `${stepHtml}<form id="saleStep1" onsubmit="event.preventDefault();saleStep1Next()">
  ${field('ဝယ်သူအမည်','saleName',{value:w.name,required:true,placeholder:'ဝယ်သူအမည်',extra:'list="buyerNames" maxlength="80"'})}
  <datalist id="buyerNames">${[...new Set(state.sales.map(s=>s.name))].map(n=>`<option value="${E(n)}"></option>`).join('')}</datalist>
  ${selectField('ကုန်နှင့် အရည်အသွေး','saleGroup',groups.map(x=>[x.key,x.product+' · အဆင့် '+x.grade]),w.key,'onchange="updateSaleAvailability()"')}
  <div id="saleAvailable" class="mb"></div>
  <div class="field-row">${field('ရောင်းမည့် အလေးချိန်','saleQty',{type:'number',min:.001,step:.001,value:w.qty,required:true,suffix:'ပိဿာ',extra:'oninput="updateSaleTotalPreview()"'})}${field('အိတ်အရေအတွက်','saleBags',{type:'number',min:1,value:w.bags,required:true,suffix:'အိတ်'})}</div>
  ${field('တစ်ပိဿာ ရောင်းဈေး','salePrice',{type:'number',min:1,value:w.price,required:true,suffix:'ကျပ်',extra:'oninput="updateSaleTotalPreview()"'})}<div id="saleTotalPreview"></div></form>`,
  btn('ပိတ်မယ်','closeModal()','secondary')+btn('ဆက်မယ်','saleStep1Next()','primary','arrow'));
  updateSaleAvailability(false);
 }else if(step===1){
  const total=Math.round(w.qty*w.price);if(w.paid===null)w.paid=total;
  openModal('ငွေဘယ်လောက် ရပြီလဲ။',`${E(w.name)} · ${E(w.key.split('|')[0])} ${vissText37(w.qty)} ပိဿာ`,
  `${stepHtml}<div class="v2-summary-total"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(total)}</strong></div>
  <form id="saleStep2" onsubmit="event.preventDefault();saleStep2Next()">
  ${accountField('saleAccount',w.account,'ဘယ်အကောင့်နဲ့ လက်ခံမလဲ')}
  ${field('ယခု လက်ခံရရှိငွေ','salePaid',{type:'number',min:0,max:total,value:w.paid,required:true,suffix:'ကျပ်',extra:'oninput="updateSaleDuePreview()"'})}<div id="saleDuePreview"></div></form>
  ${detailHelp('ငွေမရသေးရင် ဘယ်လိုမှတ်မလဲ။','ငွေမရသေးလျှင် သုည၊ တစ်စိတ်တစ်ပိုင်းရလျှင် ရသည့်ငွေကို ထည့်ပါ။ ဤအကြွေးငွေရှင်းပုံသည် နမူနာဖြစ်ပြီး အကြွေးခွင့်ပြုချက်စည်းမျဉ်းကို အတည်ပြုရန်ကျန်သည်။')}`,
  btn('နောက်ပြန်','captureSalePaymentAndBack()','secondary','back')+btn('ဆက်မယ်','saleStep2Next()','primary','arrow'));
  updateSaleDuePreview();
 }else{
  openModal('ကုန်ကို အခုယူသွားမလား။','ရောင်းပြီး ပွဲရုံမှာပဲ ဆက်ထားနိုင်ပါတယ်။',
  `${stepHtml}<div class="v2-delivery-choice">
  <button type="button" class="choice ${w.mode==='direct'?'selected':''}" aria-pressed="${w.mode==='direct'}" onclick="chooseDelivery('direct')"><span class="radio-dot"></span><div><strong>အခု ယူသွားမယ်</strong><small>ပစ္စည်းသိမ်းတင် · ကားပေါ်တင်ပြီး ထုတ်ပေးမယ်။</small></div></button>
  <button type="button" class="choice ${w.mode==='hold'?'selected':''}" aria-pressed="${w.mode==='hold'}" onclick="chooseDelivery('hold')"><span class="radio-dot"></span><div><strong>ပွဲရုံမှာ ထားမယ်</strong><small>သိမ်းထပ်ထား · ဝယ်သူပိုင်ကုန်အဖြစ် ခွဲထားမယ်။</small></div></button></div>
  ${w.mode==='direct'?`<form id="deliveryForm" onsubmit="event.preventDefault();commitSale()">${field('လာယူသူအမည်','saleCollector',{value:w.collector,required:true,placeholder:'ပစ္စည်းလက်ခံယူသူ',extra:'maxlength="80"'})}${field('ကားနံပါတ်','saleCar',{value:w.car,placeholder:'ကားနံပါတ်ရှိပါက ထည့်ပါ',extra:'maxlength="40"'})}</form>`:`<div class="v2-inline-info">${I('lock')}ဝယ်သူပိုင်ဖြစ်သွားလို့ အခြားသူကို ထပ်မရောင်းရပါ။</div>`}
  <div class="summary-box mt"><div class="summary-line"><span>ရောင်းတန်ဖိုး</span><strong>${cashText(w.qty*w.price)}</strong></div><div class="summary-line"><span>ငွေလက်ခံမည်</span><strong>${cashText(w.paid)}</strong></div><div class="summary-line total"><span>ရရန်ကျန်မည်</span><strong>${cashText(w.qty*w.price-w.paid)}</strong></div></div>`,
  btn('နောက်ပြန်','captureDeliveryAndBack()','secondary','back')+btn('အရောင်း သိမ်းမယ်','commitSale()','primary','check','id="commitSaleBtn"'));
 }
};
updateSaleAvailability=function(changePrice=true){
 const key=value('saleGroup'),g=ownedGroups().find(x=>x.key===key);
 if(!g)return;
 document.getElementById('saleAvailable').innerHTML=`<div class="simple-inline-card"><strong>${E(g.product)} · အဆင့် ${E(g.grade)}</strong><p>ရောင်းနိုင်သော လက်ကျန် — ${vissText37(g.owned)} ပိဿာ · ${N(g.ownedBags)} အိတ်</p></div>`;
 if(changePrice)document.getElementById('salePrice').value=state.prices[key]||'';
 updateSaleTotalPreview();
};
openHelp=function(){
 oldOpenHelp();
 const footer=document.querySelector('.modal-footer');
 footer.insertAdjacentHTML('afterbegin',btn('နမူနာ ပြန်စမယ်','openReset()','secondary','reset'));
};

save();render();

