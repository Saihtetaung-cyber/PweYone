
/* V50: Cash In funding and internal transfers. Scoped to Cash Management + COA Settings. */
(function(){
  const priorCash50=cashPage;
  const priorCashBody50=renderCashBody;
  const priorSetup50=setupView;
  let cash50Filter='all';
  const COA_DEFAULT50=[
    {id:'COA50-CAPITAL',code:'3101',name:'ပိုင်ရှင်ထည့်ဝင်ငွေ (Owner Capital)',type:'equity',active:true,locked:true},
    {id:'COA50-OWNERLOAN',code:'2101',name:'ပိုင်ရှင်ချေးငွေ (Owner Loan)',type:'liability',active:true,locked:true},
    {id:'COA50-LOAN',code:'2102',name:'ပြင်ပချေးငွေ (External Loan)',type:'liability',active:true,locked:true},
    {id:'COA50-OTHER',code:'3901',name:'အခြားငွေဖြည့်သွင်းမှု (Other Funding)',type:'other',active:true,locked:true},
    {id:'COA50-TRANSFER',code:'1901',name:'ငွေသိမ်းရာအချင်းချင်း လွှဲပြောင်းခြင်း (Internal Transfer)',type:'transfer',active:true,locked:true}
  ];
  const coaTypeLabels50={equity:'အရင်းထည့်ဝင်ငွေ',liability:'ချေးငွေ / တာဝန်ခံငွေ',other:'အခြားငွေဖြည့်သွင်းမှု',transfer:'Internal Transfer'};
  function ensureCash50(){
    if(!Array.isArray(state.cashIns50))state.cashIns50=[];
    if(!Array.isArray(state.coa50))state.coa50=COA_DEFAULT50.map(x=>({...x}));
    for(const def of COA_DEFAULT50){
      if(!state.coa50.some(x=>x.id===def.id))state.coa50.push({...def});
    }
  }
  function coa50(id){ensureCash50();return state.coa50.find(x=>x.id===id);}
  function localTime50(){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
  function cash50Owner(){if(state.role!=='owner'){toast('Cash In မှတ်တမ်းတင်ခြင်းနှင့် COA ပြင်ဆင်ခြင်းကို ပိုင်ရှင်မြင်ကွင်းမှသာ လုပ်နိုင်ပါသည်။',true);return false;}return true;}
  function cash50Ready(){if(!cash50Owner())return false;if(state.closed){toast('ယနေ့စာရင်း ပိတ်ထားပြီးပါပြီ။',true);return false;}if(!state.opening.checked){openCashCheck();return false;}return true;}
  function account50(k){return ACCOUNT_NAMES[k]||k;}
  function acctOptions50(keys){return keys.map(x=>[x,account50(x)]);}
  function activeAccounts50(){return (state.masters?.accounts||[]).filter(a=>a.active);}
  function accountOpts51(){return activeAccounts50().map(a=>[a.id,a.name]);}
  function defaultAccount51(preferred,other){const all=activeAccounts50().map(a=>a.id);return all.includes(preferred)?preferred:all.find(id=>id!==other)||'';}
  function cash50RequestRows(){return (state.requests||[]).flatMap(r=>{
    const tranches=Array.isArray(r.receipts62)?r.receipts62:[];
    if(tranches.length)return tranches.map((t,i)=>({id:'request-'+r.id+'-'+t.id,ref:r.no+' / '+(i+1),requestId:r.id,type:'transfer',date:t.date||r.date,time:t.time||'',amount:t.amount,source:'home',destination:'cash',coaId:'COA50-TRANSFER',description:(r.reason||'အိမ်မှ ငွေယူလက်မှတ်')+' · Request '+r.no+(t.reference?' · '+t.reference:''),reference:t.reference||r.no,external:false,legacy:true,by:t.by||r.collector||'—',status:'posted',txnIds:t.txnIds||[]}));
    return r.status==='received'?[{id:'request-'+r.id,ref:r.no,requestId:r.id,type:'transfer',date:r.receivedDate||r.date,amount:r.amount,source:'home',destination:'cash',coaId:'COA50-TRANSFER',description:r.reason||'အိမ်မှ ငွေယူလက်မှတ်ဖြင့် လက်ခံခြင်း',external:false,legacy:true,by:r.collector||'—',status:'posted'}]:[];
  });}
  cashPage=function(){
    ensureCash50();
    const shell=document.createElement('div');shell.innerHTML=priorCash50();
    const tabs=shell.querySelector('.tabs');
    if(tabs)tabs.insertAdjacentHTML('beforeend',`<button type="button" class="tab ${cashTab==='cashins50'?'active':''}" onclick="cashTab='cashins50';render()">Cash In History</button>`);
    const body=shell.querySelector('#cashBody');
    if(body){
      const actions=document.createElement('div');actions.className='cash50-action-bar';
      actions.innerHTML=`<div><strong>Cash In · လည်ပတ်ငွေဖြည့်သွင်းမှု</strong><p>ပြင်ပငွေဖြည့်ခြင်းနှင့် ငွေသိမ်းရာအချင်းချင်း လွှဲခြင်းကို သီးခြားမှတ်တမ်းတင်မည်။</p></div><div class="row wrap">${state.role==='owner'?btn('Create Cash In','openCashIn50()','primary','plus'):''}${smallbtn('History',"cashTab='cashins50';render()",'secondary','doc')}${state.role==='owner'?smallbtn('COA Settings',"beginSetup('coa50')",'secondary','settings'):''}</div>`;
      body.parentNode.insertBefore(actions,body);
    }
    return shell.innerHTML;
  };
  renderCashBody=function(){
    if(cashTab!=='cashins50')return priorCashBody50();
    ensureCash50();
    const all=[...state.cashIns50,...cash50RequestRows()].sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||b.ref).localeCompare(String(a.createdAt||a.ref)));
    const chosen=all.filter(x=>(!x.source||canViewAccount68(x.source))&&canViewAccount68(x.destination)).filter(x=>cash50Filter==='all'||(cash50Filter==='external'?x.type==='external':x.type==='transfer'));
    const rows=state.role==='owner'&&typeof inOwnerDateRange==='function'?chosen.filter(x=>inOwnerDateRange(x.date)):chosen;
    const posted=rows.filter(x=>x.status==='posted');
    const external=posted.filter(x=>x.type==='external').reduce((n,x)=>n+x.amount,0);
    const transfer=posted.filter(x=>x.type==='transfer').reduce((n,x)=>n+x.amount,0);
    document.getElementById('cashBody').innerHTML=`<section class="cash50-history">
      <div class="grid cols-3 mb">${stat('ပြင်ပမှ ထည့်ဝင်ငွေ',M(external),'ကျပ်','wallet','လည်ပတ်ငွေအသစ်','compact')}${stat('အတွင်းလွှဲပြောင်းမှု',M(transfer),'ကျပ်','transfer','စုစုပေါင်းလုပ်ငန်းငွေ မတိုး','compact')}${stat('Cash In History',N(rows.length),'ခု','doc','ငွေရရှိပြီးသော မှတ်တမ်း','compact')}</div>
      <div class="toolbar cash50-history-toolbar"><div class="tabs">${[['all','အားလုံး'],['external','ပြင်ပငွေဖြည့်'],['transfer','အတွင်းလွှဲ']].map(([k,t])=>`<button class="tab ${cash50Filter===k?'active':''}" onclick="filterCashIn50('${k}')">${t}</button>`).join('')}</div>${state.role==='owner'?btn('Create Cash In','openCashIn50()','primary','plus'):''}</div>
      ${rows.length?`<div class="table-wrap"><table><thead><tr><th>ရက် / Voucher</th><th>အမျိုးအစား / COA</th><th>ငွေသိမ်းရာ</th><th class="right">Amount</th><th>အခြေအနေ</th><th class="right">လုပ်ဆောင်ချက်</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${E(r.ref)}</strong><div class="sub">${E(r.date)} · ${E(r.time||'')}</div></td><td><strong>${r.type==='external'?'ပြင်ပမှ ငွေဖြည့်':'ငွေအတွင်းလွှဲ'}</strong><div class="sub">${E(coa50(r.coaId)?.name||r.coaName||'—')}</div></td><td>${r.source?E(r.sourceName||account50(r.source))+' → ':''}${E(r.destinationName||account50(r.destination))}</td><td class="right"><strong>${cashText(r.amount)}</strong></td><td>${r.status==='reversed'?pill('Reversed','red'):r.legacy?pill('ငွေယူလက်မှတ်ဖြင့် ရရှိပြီး','blue'):pill('Posted')}</td><td class="right">${smallbtn('အသေးစိတ်',`viewCashIn50('${r.id}')`,'secondary','doc')}</td></tr>`).join('')}</tbody></table></div>`:empty('Cash In မှတ်တမ်း မရှိသေးပါ။','wallet')}
      <div class="mt">${note('အိမ်မှ ငွေယူလက်မှတ်ဖြင့် လက်ခံပြီးသားငွေများကိုလည်း ဤ History မှာပြထားသည်။ လက်ကျန်ကို ထပ်တိုးမတွက်ပါ။ ပြင်ပငွေဖြည့်သွင်းခြင်းသည် အရောင်းဝင်ငွေဟု မယူဆပါ။','blue')}</div></section>`;
  };
  window.filterCashIn50=function(kind){cash50Filter=kind;renderCashBody();};
  function cash50FieldBody(mode){
    const extern=mode==='external';
    return `<div class="cash50-mode-help">${extern?'လုပ်ငန်းပြင်ပမှ ငွေအသစ် ဝင်လာခြင်းဖြစ်၍ ရွေးထားသည့် ငွေသိမ်းရာတစ်ခုသာ တိုးမည်။':'ရှိပြီးသား ငွေသိမ်းရာတစ်ခုမှ အခြားတစ်ခုသို့ ရွှေ့ခြင်းဖြစ်၍ တစ်ဖက်မှနုတ်ပြီး တစ်ဖက်သို့တိုးမည်။'}</div>
      ${selectField('COA (Chart of Accounts) *','cash50Coa',extern?state.coa50.filter(x=>x.active&&x.type!=='transfer').map(x=>[x.id,x.code+' · '+x.name]):[['COA50-TRANSFER','1901 · Internal Transfer']],extern?'COA50-CAPITAL':'COA50-TRANSFER',extern?'required':'disabled')}
      ${extern?'':selectField('From Account (ငွေထွက်မည့်နေရာ) *','cash50Source',accountOpts51(),defaultAccount51('home'),'required onchange="updateCash50Preview()"')}
      ${selectField('To Account (ငွေဝင်မည့်နေရာ) *','cash50Destination',accountOpts51(),defaultAccount51('cash'),'required onchange="updateCash50Preview()"')}
      ${field('Amount (MMK)','cash50Amount',{type:'number',min:1,required:true,suffix:'ကျပ်',placeholder:'ငွေပမာဏ ထည့်ပါ',extra:'step="1" oninput="updateCash50Preview()"'})}
      ${field('Description','cash50Description',{required:true,placeholder:extern?'ဥပမာ — ပိုင်ရှင်မှ ပွဲရုံလည်ပတ်ငွေ ထပ်ဖြည့်ခြင်း':'ဥပမာ — အိမ်ငွေမှ ပွဲရုံငွေသားသို့ ပြောင်းရွှေ့ခြင်း',extra:'maxlength="400"'})}
      ${field('Reference (ရှိပါက)','cash50Reference',{placeholder:'အထောက်အထားအမှတ် / ဘဏ်လွှဲနံပါတ်',extra:'maxlength="80"'})}
      <div id="cash50Preview" class="cash50-preview" aria-live="polite"></div>
      <label class="cash50-confirm"><input id="cash50Confirmed" type="checkbox" required><span>${extern?'ငွေအမှန်တကယ် ရရှိပြီးကြောင်း':'ရွေးထားသော ငွေသိမ်းရာနှစ်ခုအကြား ငွေအမှန်တကယ် လွှဲပြီးကြောင်း'} အတည်ပြုပါသည်။</span></label>
      <div class="cash51-account-help">KBZ → AYA လို Bank-to-Bank လွှဲနိုင်ပါသည်။ Bank Account အသစ်လိုပါက <button type="button" class="btn-link" onclick="beginSetup('accounts')">Settings → ငွေသိမ်းရာ</button> မှ ထည့်ပါ။</div>
      ${extern?'':note('Pending Request ရှိလျှင် Request ID ကို ရွေးပြီး ငွေတကယ်လက်ခံချိန်မှ တစ်ကြိမ်သာ Post လုပ်ပါ။ သီးခြားငွေလွှဲဖြစ်ပါက Reference နှင့် Confirmation ဖြည့်ရပါမည်။','amber')}`;
  }
  window.openCashIn50=function(){
    ensureCash50();if(!cash50Ready())return;
    openModal('Create Cash In','ပွဲရုံလည်ပတ်ငွေ ထပ်ဖြည့်သွင်းရန် · ငွေတကယ်ရရှိ/ရွှေ့ပြီးမှ သိမ်းပါ။',
      `<form id="cash50Form" onsubmit="event.preventDefault();saveCashIn50()"><div class="cash50-date">Date: <strong>${E(today())}</strong></div>${selectField('Cash In Type *','cash50Mode',[['external','ပြင်ပမှ ငွေအသစ်ထည့်ခြင်း'],['transfer','ငွေသိမ်းရာအချင်းချင်း လွှဲခြင်း']],'external','required onchange="cash50SwitchMode()"')}<div id="cash50Fields">${cash50FieldBody('external')}</div></form>`,
      btn('ပိတ်မယ်','closeModal()','secondary')+btn('Save Cash In','saveCashIn50()','primary','check'),true);
    updateCash50Preview();
  };
  window.cash50SwitchMode=function(){const mode=value('cash50Mode');document.getElementById('cash50Fields').innerHTML=cash50FieldBody(mode);updateCash50Preview();};
  window.updateCash50Preview=function(){
    const box=document.getElementById('cash50Preview');if(!box)return;
    const mode=value('cash50Mode'),dst=value('cash50Destination')||'cash',src=value('cash50Source')||'home';
    const raw=number('cash50Amount'),amt=Number.isFinite(raw)&&raw>0?raw:0;
    const before=bal(dst),after=before+amt;
    box.innerHTML=`<div class="cash50-balance-title">Balance Preview (MMK) · Auto Calculation</div>`+
      (mode==='transfer'?`<div class="summary-line"><span>${E(account50(src))} · Before</span><strong>${cashText(bal(src))}</strong></div><div class="summary-line"><span>ငွေထွက်ပြီး ကျန်လက်ကျန်</span><strong class="${amt>bal(src)?'danger-text':''}">${cashText(bal(src)-amt)}</strong></div>`:'')+
      `<div class="summary-line"><span>${E(account50(dst))} · Before</span><strong>${cashText(before)}</strong></div><div class="summary-line"><span>Cash In Amount</span><strong>+ ${cashText(amt)}</strong></div><div class="summary-line total"><span>New Balance</span><strong>${cashText(after)}</strong></div>`+
      (mode==='transfer'&&src===dst?`<p class="danger-text">ငွေထွက်နေရာနဲ့ ငွေဝင်နေရာ တူ၍ မရပါ။</p>`:'')+
      (mode==='transfer'&&amt>bal(src)?`<p class="danger-text">From Account လက်ကျန် မလုံလောက်ပါ။</p>`:'');
  };
  let inSave50=false;
  window.saveCashIn50=function(){
    ensureCash50();if(inSave50||!cash50Ready())return;
    const f=document.getElementById('cash50Form');if(!f||!f.reportValidity())return;
    const mode=value('cash50Mode'),amt=number('cash50Amount'),dst=value('cash50Destination'),src=mode==='transfer'?value('cash50Source'):null;
    const coaId=mode==='transfer'?'COA50-TRANSFER':value('cash50Coa'),coa=coa50(coaId),desc=value('cash50Description'),reference=value('cash50Reference');
    if(!Number.isSafeInteger(amt)||amt<=0)return error('Amount ကို ၀ ထက်ကြီးသော ကျပ်ငွေကိန်းပြည့်ဖြင့် ထည့်ပါ။');
    if(!desc||desc.length>400)return error('Description ဖြည့်ပါ။');
    if(!activeAccounts50().some(a=>a.id===dst))return error('အသုံးပြုနိုင်သော To Account ကို ရွေးပါ။');
    if(!coa||!coa.active||(mode==='external'&&coa.type==='transfer')||(mode==='transfer'&&coa.type!=='transfer'))return error('သုံးနိုင်သော COA ကို ရွေးပါ။');
    if(!['external','transfer'].includes(mode))return error('Cash In Type မမှန်ပါ။');
    if(mode==='transfer'&&(!activeAccounts50().some(a=>a.id===src)||src===dst))return error('မတူညီသော Active From / To Account ကို ရွေးပါ။');
    if(mode==='transfer'&&amt>bal(src))return error('From Account လက်ကျန်မလုံလောက်ပါ။');
    // V62: Request-ID linkage and independent-transfer acknowledgement are validated in the scoped saveCashIn50 wrapper.
    if(!document.getElementById('cash50Confirmed')?.checked)return error('ငွေတကယ်ရရှိ/လွှဲပြီးကြောင်း အတည်ပြုပါ။');
    if(!Number.isSafeInteger(bal(dst)+amt))return error('လက်ကျန် ပမာဏ အလွန်များနေပါသည်။');
    inSave50=true;
    try{
      const id=uid('CI'),ref='CI-'+String(state.counter).padStart(5,'0'),when=localTime50();
      const x={id,ref,date:today(),time:when,createdAt:new Date().toISOString(),type:mode,source:src,destination:dst,sourceName:src?account50(src):null,destinationName:account50(dst),coaId,coaCode:coa.code,coaName:coa.name,amount:amt,description:desc,reference,by:state.role,status:'posted',balanceBefore:bal(dst),balanceAfter:bal(dst)+amt,sourceBefore:src?bal(src):null,sourceAfter:src?bal(src)-amt:null,txnIds:[]};
      // Posting exactly one positive entry for external funding, two offsetting entries for internal transfer.
      if(src){txn(src,-amt,'Cash In · အတွင်းလွှဲ (ထွက်)',ref,desc);x.txnIds.push(state.transactions[state.transactions.length-1].id);}
      txn(dst,amt,mode==='external'?'Cash In · ပြင်ပငွေဖြည့်':'Cash In · အတွင်းလွှဲ (ဝင်)',ref,desc);
      x.txnIds.push(state.transactions[state.transactions.length-1].id);
      state.cashIns50.unshift(x);
      activity(ref+' · '+(mode==='external'?'ပြင်ပငွေဖြည့်ခြင်း':'အတွင်းလွှဲခြင်း')+' '+cashText(amt));
      save();closeModal();cashTab='cashins50';render();toast(ref+' Cash In မှတ်တမ်း သိမ်းပြီးပါပြီ။');
    }finally{inSave50=false;}
  };
  window.viewCashIn50=function(id){
    ensureCash50();const r=[...state.cashIns50,...cash50RequestRows()].find(x=>x.id===id);if(!r)return toast('History မှတ်တမ်း ရှာမတွေ့ပါ။',true);
    const coa=coa50(r.coaId);const isLegacy=!!r.legacy;
    openModal('Cash In Details',E(r.ref)+' · '+(r.type==='external'?'ပြင်ပမှ ငွေဖြည့်':'အတွင်းလွှဲ'),
      `<div class="summary-box">${row4('Date',E(r.date)+' · '+E(r.time||''))}${row4('Voucher',E(r.ref))}${row4('Type',r.type==='external'?'External Cash In':'Internal Transfer')}${row4('COA',E(r.coaName||coa?.name||'Internal Transfer'))}${r.source?row4('From Account',E(r.sourceName||account50(r.source))):''}${row4('To Account',E(r.destinationName||account50(r.destination)))}${row4('Amount',cashText(r.amount))}${!isLegacy?row4('Balance Before',cashText(r.balanceBefore))+row4('Balance After',cashText(r.balanceAfter)):''}${!isLegacy&&r.source?row4('Source Before',cashText(r.sourceBefore))+row4('Source After',cashText(r.sourceAfter)):''}${row4('Description',E(r.description))}${r.reference?row4('Reference',E(r.reference)):''}${row4('Status',r.status==='reversed'?'Reversed':'Posted')}${r.reversedRef?row4('Reversal No',E(r.reversedRef)):''}</div>
       <div class="mt">${note(isLegacy?'ဤမှတ်တမ်းသည် မူလ “ငွေယူလက်မှတ်” ထဲမှ ဖြစ်သည်။ Cash In ထပ်မံ Post မလုပ်ထားပါ။':'Balance Before / After သည် ထို Voucher ကို Save လုပ်စဉ်က လက်ကျန်ဖြစ်သည်။ နောက်ဆက်တွဲငွေစာရင်းကြောင့် မူလမှတ်တမ်း မပြောင်းပါ။','blue')}</div>`,
      btn('ပိတ်မယ်','closeModal()','secondary')+(!isLegacy&&r.status==='posted'&&state.role==='owner'?btn('Reverse Entry',`confirmReverseCashIn50('${r.id}')`,'danger','transfer'):'')+(!isLegacy?btn('Print Voucher',`printCashIn50('${r.id}')`,'secondary','print'):''),true);
  };
  window.printCashIn50=function(id){const r=(state.cashIns50||[]).find(x=>x.id===id);if(!r)return;printDocument('Cash In Voucher',r.ref,`<p>${E(r.date)} · ${r.type==='external'?'ပြင်ပငွေဖြည့်':'ငွေအတွင်းလွှဲ'}</p>`+table4(['အချက်အလက်','တန်ဖိုး'],[['COA',r.coaName],['From',r.source?(r.sourceName||account50(r.source)):'ပြင်ပမှ ဝင်ငွေ'],['To',r.destinationName||account50(r.destination)],['Amount',cashText(r.amount)],['Before',cashText(r.balanceBefore)],['After',cashText(r.balanceAfter)],['Description',r.description],['Status',r.status]].map(([k,v])=>`<tr><td>${E(k)}</td><td>${E(v)}</td></tr>`)));};
  window.confirmReverseCashIn50=function(id){
    ensureCash50();if(!cash50Ready())return;const r=state.cashIns50.find(x=>x.id===id);if(!r||r.status!=='posted')return toast('ဤမှတ်တမ်းကို Reverse လုပ်ပြီးသား သို့မဟုတ် မရှိပါ။',true);
    if(bal(r.destination)<r.amount)return toast('To Account လက်ကျန် မလုံလောက်သဖြင့် Reverse မလုပ်နိုင်ပါ။',true);
    openModal('Cash In Reversal','မူလမှတ်တမ်းကို မဖျက်ဘဲ ပြန်ညှိငွေစာရင်း အသစ်ဖန်တီးပါမည်။',`<div class="summary-box">${row4('Voucher',E(r.ref))}${row4('Reverse Amount',cashText(r.amount))}${row4('Reason','Entry မှားယွင်း၍ ပြန်ညှိခြင်း')}</div><div class="mt">${note('မူလ Cash In နှင့် Reversal မှတ်တမ်း နှစ်ခုစလုံး History ထဲတွင် ကျန်ပါမည်။','amber')}</div>`,btn('မလုပ်တော့ပါ','closeModal()','secondary')+btn('Confirm Reverse',`reverseCashIn50('${r.id}')`,'danger','check'));
  };
  window.reverseCashIn50=function(id){
    if(!cash50Ready())return;const r=state.cashIns50.find(x=>x.id===id);if(!r||r.status!=='posted')return error('ပြန်ညှိပြီးသားမှတ်တမ်း ဖြစ်သည်။');
    if(bal(r.destination)<r.amount)return error('To Account လက်ကျန် မလုံလောက်ပါ။');
    const ref='RV-'+String(state.counter+1).padStart(5,'0');
    txn(r.destination,-r.amount,'Cash In Reversal (ထွက်)',ref,r.ref);
    if(r.source)txn(r.source,r.amount,'Cash In Reversal (ပြန်ဝင်)',ref,r.ref);
    r.status='reversed';r.reversedRef=ref;r.reversedDate=today();r.reversedTime=localTime50();
    activity(r.ref+' Cash In ကို '+ref+' ဖြင့် ပြန်ညှိခဲ့သည်။');save();closeModal();cashTab='cashins50';render();toast('Reversal မှတ်တမ်း သိမ်းပြီးပါပြီ။');
  };
  function coa50View(){
    ensureCash50();const editable=state.role==='owner';
    return setupBack()+heading('','Chart of Accounts (COA)','Cash In မှာအသုံးပြုမည့် Source of Funds Account များကို စီမံရန်။',editable?btn('Create COA','editCoa50()','primary','plus'):'')+
      `<div class="mb">${note('Cash / Bank Account သည် ငွေသိမ်းရာ ဖြစ်ပြီး COA သည် ငွေဝင်ရခြင်း၏ အမျိုးအစားဖြစ်သည်။ Internal Transfer ကို ပုံသေသတ်မှတ်ထား၍ အရောင်းဝင်ငွေ မဟုတ်ပါ။','blue')}</div>`+
      `<div class="table-wrap"><table><thead><tr><th>COA Code</th><th>Account Name</th><th>Type</th><th>Status</th><th class="right">Actions</th></tr></thead><tbody>${state.coa50.map(x=>`<tr><td><strong>${E(x.code)}</strong></td><td>${E(x.name)}</td><td>${E(coaTypeLabels50[x.type]||x.type)}</td><td>${x.active?pill('Active'):pill('Inactive','gray')}</td><td class="right"><div class="table-actions">${editable&&x.type!=='transfer'?smallbtn('Edit',`editCoa50('${x.id}')`,'secondary','note'):''}${editable&&x.type!=='transfer'?smallbtn(x.active?'Inactive':'Active',`toggleCoa50('${x.id}')`,'secondary'):''}${editable&&!x.locked&&x.type!=='transfer'?smallbtn('Delete',`confirmDeleteCoa50('${x.id}')`,'danger'):''}</div></td></tr>`).join('')}</tbody></table></div>`+
      `<p class="field-help mt">အသုံးပြုပြီး COA ကို Delete မလုပ်နိုင်ပါ။ ယခင်မှတ်တမ်းကို ထိန်းထားရန် Inactive သတ်မှတ်ပါ။</p>`;
  }
  setupView=function(){
    ensureCash50();if(setupSection==='coa50')return coa50View();
    const html=priorSetup50();if(setupSection!=='overview')return html;
    const node=document.createElement('div');node.innerHTML=html;const grid=node.querySelector('.v3-master-grid');
    if(grid)grid.insertAdjacentHTML('beforeend',`<button type="button" class="v2-records-card v3-master-card" onclick="beginSetup('coa50')"><span class="icon-box">${I('bank')}</span><strong>Chart of Accounts (COA)</strong><p>Cash In အတွက် အရင်းငွေ၊ ချေးငွေနှင့် ငွေလွှဲ COA သတ်မှတ်ရန်</p><div class="v3-card-bottom"><span>${N(state.coa50.filter(x=>x.active).length)} COA Active</span><span class="end-link">စီမံမယ် ${I('arrow')}</span></div></button>`);
    return node.innerHTML;
  };
  window.editCoa50=function(id=''){
    ensureCash50();if(!cash50Owner())return;const x=id?coa50(id):null;if(id&&!x)return toast('COA ရှာမတွေ့ပါ။',true);
    if(x?.type==='transfer')return toast('Internal Transfer COA ကို ပြင်လို့မရပါ။',true);
    openModal(x?'Edit COA':'Create COA','Cash In အတွက် Source of Funds COA သတ်မှတ်ချက်',
      `<form id="coaForm50" onsubmit="event.preventDefault();saveCoa50('${E(id)}')">${field('COA Code','coaCode50',{required:true,value:x?.code||'',extra:'maxlength="12"',placeholder:'ဥပမာ 3102'})}${field('Account Name','coaName50',{required:true,value:x?.name||'',extra:'maxlength="80"',placeholder:'ဥပမာ ပိုင်ရှင်ထည့်ဝင်ငွေ'})}${selectField('Account Type','coaType50',Object.entries(coaTypeLabels50).filter(([k])=>k!=='transfer').map(([k,v])=>[k,v]),x?.type||'equity')}${selectField('Status','coaStatus50',[['active','Active'],['inactive','Inactive']],x?.active===false?'inactive':'active')}</form>`,btn('ပိတ်မယ်','closeModal()','secondary')+btn('Save COA',`saveCoa50('${E(id)}')`,'primary','check'));
  };
  window.saveCoa50=function(id=''){
    ensureCash50();if(!cash50Owner()||!validForm('coaForm50'))return;
    const code=value('coaCode50'),name=value('coaName50'),type=value('coaType50'),active=value('coaStatus50')==='active',x=id?coa50(id):null;
    if(!/^[A-Za-z0-9_-]{2,12}$/.test(code))return error('COA Code ကို အင်္ဂလိပ်/ဂဏန်း ၂–၁၂ လုံးဖြင့် ထည့်ပါ။');
    if(!name||name.length>80||/[<>]/.test(name))return error('Account Name ကို ၁–၈၀ လုံးအတွင်း ထည့်ပါ။');
    if(!['equity','liability','other'].includes(type))return error('Account Type မမှန်ပါ။');
    if(state.coa50.some(y=>y.id!==id&&y.code.toLowerCase()===code.toLowerCase()))return error('COA Code ထပ်နေပါသည်။');
    if(x){if(x.locked&&(x.code!==code||x.type!==type))return error('မူလ COA ၏ Code / Type ကို မပြောင်းနိုင်ပါ။');Object.assign(x,{code,name,type,active});}
    else state.coa50.push({id:uid('COA'),code,name,type,active,locked:false});
    activity('Cash In COA '+code+' '+(x?'ပြင်ဆင်':'အသစ်ထည့်')+'ခဲ့သည်။');save();closeModal();setupSection='coa50';page='setup';render();toast('COA သိမ်းပြီးပါပြီ။');
  };
  window.toggleCoa50=function(id){ensureCash50();if(!cash50Owner())return;const x=coa50(id);if(!x||x.type==='transfer')return toast('COA ပြောင်းမရပါ။',true);x.active=!x.active;save();render();toast('COA Status ပြောင်းပြီးပါပြီ။');};
  window.confirmDeleteCoa50=function(id){ensureCash50();if(!cash50Owner())return;const x=coa50(id);if(!x||x.locked||x.type==='transfer')return toast('ပုံသေ COA ကို Delete မလုပ်နိုင်ပါ။',true);if(state.cashIns50.some(r=>r.coaId===id))return toast('မှတ်တမ်းရှိပြီးသား COA ကို Delete မလုပ်နိုင်ပါ။ Inactive ပြောင်းပါ။',true);
    openModal('Delete COA','အသုံးမပြုရသေးသော COA ကိုသာ Delete လုပ်နိုင်သည်။',`<div class="summary-box">${row4('Code',E(x.code))}${row4('Account Name',E(x.name))}</div>`,btn('Cancel','closeModal()','secondary')+btn('Delete',`deleteCoa50('${x.id}')`,'danger'));
  };
  window.deleteCoa50=function(id){ensureCash50();if(!cash50Owner())return;const index=state.coa50.findIndex(x=>x.id===id);if(index<0)return error('COA ရှာမတွေ့ပါ။');if(state.coa50[index].locked||state.cashIns50.some(x=>x.coaId===id))return error('ဤ COA ကို ဖျက်၍မရပါ။');state.coa50.splice(index,1);save();closeModal();setupSection='coa50';page='setup';render();toast('COA ဖျက်ပြီးပါပြီ။');};
  ensureCash50();
  document.title='ပွဲရုံ · V51 Bank-to-Bank Cash In';
})();

