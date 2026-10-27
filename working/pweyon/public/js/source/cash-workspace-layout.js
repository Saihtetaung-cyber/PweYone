
/* Version 2: approved cash workspace presentation. Native posting functions,
   account permissions, loan calculations and voucher links remain authoritative. */
(function(){
 const oldPage=cashPage,oldBody=renderCashBody;
 const tabs=[['movements','ငွေအဝင် / အထွက်'],['cashins50','ငွေဖြည့် / ငွေလွှဲ'],['expenses2','အသုံးစရိတ်'],['payables','ပေးရန်ရှိ'],['receivables','ရရန်ရှိ'],['loans2','ကြိုထုတ်ငွေ'],['requests','အိမ်မှ ငွေယူလက်မှတ်'],['collections','အရောင်းငွေ တောင်းခံလက်မှတ်']];
 const ui={};let loanMarkup='';
 function filters(){const key=state.role+':'+cashTab;return ui[key]||(ui[key]={query:'',status:'all',from:state.role==='owner'?ownerDateFrom:'',to:state.role==='owner'?ownerDateTo:'',account:'',kind:'all',reason:'',party:'',page:1});}
 function dom(html){const x=document.createElement('div');x.innerHTML=html;return x;}
 function norm(s){return String(s||'').normalize('NFC').replace(/[\u200B-\u200D\uFEFF]/g,'').toLocaleLowerCase().trim();}
 function match(text,q){return norm(q).split(/\s+/).every(w=>norm(text).includes(w));}
 function label(title,id,control){return `<label for="${id}">${title}${control}</label>`;}
 function select(id,options,current,handler='cash2Refresh()'){return `<select id="${id}" onchange="${handler}">${options.map(([k,t])=>`<option value="${E(k)}" ${k===current?'selected':''}>${E(t)}</option>`).join('')}</select>`;}
 function dateValid(s){if(!s)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;}
 function invalid(f){return !dateValid(f.from)||!dateValid(f.to)||(f.from&&f.to&&f.from>f.to);}
 function inRange(d,f){return (!f.from&&!f.to)||(/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&dateValid(d)&&(!f.from||d>=f.from)&&(!f.to||d<=f.to));}
 function accountOptions(){return [['','ငွေသိမ်းရာအားလုံး'],...(state.masters?.accounts||[]).filter(canViewAccount68).map(a=>[a.id,a.name])];}
 function dateControls(f,expense){return `<div class="cash2-controls">`+
  label('စရက်','cash2From',`<input id="cash2From" type="date" value="${E(f.from)}" onchange="cash2Refresh()">`)+
  label('ဆုံးရက်','cash2To',`<input id="cash2To" type="date" value="${E(f.to)}" onchange="cash2Refresh()">`)+
  label('ငွေသိမ်းရာ','cash2Account',select('cash2Account',accountOptions(),f.account))+
  (expense?label('အကြောင်းအရာ','cash2Reason',select('cash2Reason',[['','အကြောင်းအရာအားလုံး'],...[...new Set((state.expenses||[]).filter(x=>!x.recoverable&&!x.paymentPending&&canViewAccount68(x.account)).map(x=>x.reason||x.title||'အခြား'))].map(x=>[x,x])],f.reason)):
   label('အဝင် / အထွက်','cash2Kind',select('cash2Kind',[['all','အားလုံး'],['in','ငွေဝင်'],['out','ငွေထွက်']],f.kind)))+
  smallbtn('Filter ရှင်းမယ်','cash2Clear()','secondary')+'</div>';
 }
 function searchControls(f,status){const choices=[['all','အားလုံး'],['pending','မရသေး'],['partial','တစ်စိတ်တစ်ပိုင်း ရပြီး'],['complete','အပြည့်ရပြီး']];return `<div class="cash2-controls cash2-search-controls ${status?'':'cash2-search-only'}">`+
  label(cashTab==='payables'?'ကုန်သည်အမည် / ဘောက်ချာ ရှာရန်':'ဝယ်သူအမည် / လက်မှတ် ရှာရန်','cash2Search',`<input type="search" id="cash2Search" value="${E(f.query)}" placeholder="အမည် သို့မဟုတ် အမှတ် ရိုက်ရှာပါ" oninput="cash2Search(this.value)">`)+
  (status?label('အခြေအနေ','cash2Status',select('cash2Status',choices,f.status,"cash2Status(this.value)")):'')+smallbtn('Filter ရှင်းမယ်','cash2Clear()','secondary')+'</div>';
 }
 function ownerRange(){if(state.role!=='owner')return '';return ownerDateFilterBar('အောက်ပါမှတ်တမ်း၏ ရက်ကာလကို ရွေးပါ။').replace('class="owner-date-filter"','class="owner-date-filter stock-ledger-range83"').replace('<strong>Date Range</strong>','<strong>ရက်ကာလရွေးရန်</strong>').replace('>From Date<input','>စရက်<input').replace('>To Date<input','>ဆုံးရက်<input');}
 function header(title,desc,actions=''){return `<header class="cash2-header"><div><h2>${title}</h2><p>${desc}</p></div>${actions?`<div class="cash2-actions">${actions}</div>`:''}</header>`;}
 function metadata(count){return `<p class="cash2-meta" id="cash2Results" role="status" aria-live="polite">မှတ်တမ်း ${N(count)} ခု</p>`;}
 function pages(count,f){const total=Math.max(1,Math.ceil(count/20));f.page=Math.min(f.page,total);return count>20?`<div class="cash2-pages">${smallbtn('ရှေ့စာမျက်နှာ',"cash2Page(-1)",'secondary').replace('<button ','<button '+(f.page===1?'disabled ':''))}<span>စာမျက်နှာ ${N(f.page)} / ${N(total)}</span>${smallbtn('နောက်စာမျက်နှာ',"cash2Page(1)",'secondary').replace('<button ','<button '+(f.page===total?'disabled ':''))}</div>`:'';}
 function movement(f){
  const rows=invalid(f)?[]:state.transactions.filter(t=>canViewAccount68(t.account)&&inRange(t.date,f)&&(!f.account||f.account===t.account)&&(f.kind==='all'||(f.kind==='in'?t.amount>0:t.amount<0))).slice().reverse();
  const incoming=rows.reduce((n,t)=>n+Math.max(0,t.amount),0),outgoing=rows.reduce((n,t)=>n+Math.max(0,-t.amount),0),pagination=pages(rows.length,f),part=rows.slice((f.page-1)*20,f.page*20);
  return `<div class="grid cols-3 mb">${stat('ငွေဝင်',M(incoming),'ကျပ်','receive','ရွေးထားသောစာရင်း','compact')}${stat('ငွေထွက်',M(outgoing),'ကျပ်','transfer','ရွေးထားသောစာရင်း','compact')}${stat('အသားတင် လှုပ်ရှားမှု',M(incoming-outgoing),'ကျပ်','wallet','ငွေလွှဲအဝင် / အထွက် ပါဝင်သည်','compact')}</div>`+metadata(rows.length)+(rows.length?table4(['ရက် / အကြောင်းအရာ','ငွေသိမ်းရာ','သက်ဆိုင်သူ / အမှတ်','ငွေဝင်','ငွေထွက်'],part.map(t=>`<tr><td><strong>${E(t.title)}</strong><div class="sub">${dateValid(t.date)&&t.date?shortDate(t.date):'ရက်မသိရသေး'} · ${E(t.time||'')}</div></td><td>${E(ACCOUNT_NAMES[t.account]||t.account)}</td><td>${E(t.party||'—')}<div class="sub">${E(t.ref||'')}</div></td><td>${t.amount>0?cashText(t.amount):'—'}</td><td>${t.amount<0?cashText(-t.amount):'—'}</td></tr>`)):empty('ရွေးထားသော Filter နှင့် ကိုက်ညီသော ငွေမှတ်တမ်း မရှိပါ။','wallet'))+pagination+`<p class="cash2-meta">ငွေသိမ်းရာအချင်းချင်း လွှဲငွေကို အမြတ် / အရှုံးအဖြစ် မတွက်ပါ။</p>`;
 }
 function expenses(f){
  const rows=invalid(f)?[]:(state.expenses||[]).filter(x=>!x.recoverable&&!x.paymentPending&&canViewAccount68(x.account)&&inRange(x.date,f)&&(!f.account||x.account===f.account)&&(!f.reason||(x.reason||x.title||'အခြား')===f.reason)).slice().reverse();
  const pagination=pages(rows.length,f),part=rows.slice((f.page-1)*20,f.page*20),total=rows.reduce((n,x)=>n+x.amount,0);
  return `<div class="summary-box mb">${row4('ရွေးထားသော ပွဲရုံခံအသုံးစရိတ်စုစုပေါင်း',cashText(total))}</div>`+metadata(rows.length)+(rows.length?table4(['ရက်စွဲ / အမှတ်','အသုံးစရိတ် အကြောင်းအရာ','ငွေသိမ်းရာ','ငွေပမာဏ'],part.map(x=>`<tr><td>${dateValid(x.date)&&x.date?shortDate(x.date):'ရက်မသိရသေး'}<div class="sub">${E(x.id)}</div></td><td>${E(x.reason||x.title||'အခြား')}</td><td>${E(ACCOUNT_NAMES[x.account]||x.account)}</td><td><strong>${cashText(x.amount)}</strong></td></tr>`)):empty('ရွေးထားသော Filter နှင့် ကိုက်ညီသော အသုံးစရိတ် မရှိပါ။','note'))+pagination;
 }
 cashPage=function(){
  const source=dom(oldPage()),strip=source.querySelector('.v2-cash-strip');
  loanMarkup=source.querySelector('#loanList38')?.closest('section')?.innerHTML||'';
  if(cashTab==='debts')cashTab='payables';if(!tabs.some(x=>x[0]===cashTab))cashTab='movements';
  return `<div class="cash2-shell">${heading('','ငွေစာရင်း','လုပ်ဆောင်လိုသော Tab ကိုရွေးပြီး သက်ဆိုင်ရာစာရင်းကို ကြည့်ပါ။')}${strip?.outerHTML||''}`+
   (state.opening.difference?`<div class="mb">${note('အဖွင့်ငွေ ကွာဟချက် '+cashText(state.opening.difference),'amber')}</div>`:'')+
   `<nav class="cash2-tabs tabs" aria-label="ငွေစာရင်း အပိုင်းများ">${tabs.map(([k,t])=>`<button type="button" class="tab ${cashTab===k?'active':''}" ${cashTab===k?'aria-current="page"':''} onclick="cash2Tab('${k}')">${t}</button>`).join('')}</nav><div id="cashBody"></div></div>`;
 };
 window.cash2Tab=function(tab){if(!tabs.some(x=>x[0]===tab))return;cashTab=tab;render();};
 window.cash2StartCash=function(mode){openCashIn50();const s=document.getElementById('cash50Mode');if(s&&mode==='transfer'){s.value='transfer';cash50SwitchMode();}const title=document.getElementById('modalTitle');if(title&&document.getElementById('cash50Form'))title.textContent=mode==='transfer'?'ငွေသိမ်းရာအချင်းချင်း လွှဲမယ်':'ပြင်ပမှ ငွေဖြည့်မယ်';};
 window.cash2Refresh=function(){const f=filters();for(const [id,key] of [['cash2From','from'],['cash2To','to'],['cash2Account','account'],['cash2Kind','kind'],['cash2Reason','reason']]){const el=document.getElementById(id);if(el)f[key]=el.value;}f.page=1;renderCashBody();};
 window.cash2Page=function(delta){filters().page=Math.max(1,filters().page+delta);renderCashBody();};
 window.cash2Clear=function(){const f=filters();Object.assign(f,{query:'',status:'all',from:'',to:'',account:'',kind:'all',reason:'',page:1});if(cashTab==='requests'&&state.role==='owner'){setOwnerDatePreset('all');return;}renderCashBody();};
 window.cash2Search=function(q){filters().query=q;applySearch();};
 window.cash2Status=function(s){filters().status=s;applySearch();};
 window.cash2LoanFilter=function(party){filters().party=party;document.getElementById('loanList38').innerHTML=loanTable38(party);};
 function applySearch(){
  const f=filters(),root=document.getElementById('cash2Native');if(!root)return;
  const items=[...root.querySelectorAll('tbody>tr:not(:has(td[colspan])),.op69-line')];let count=0;
  for(const row of items){let status='all';if(cashTab==='requests'){const no=row.querySelector('td:first-child strong')?.textContent;const r=state.requests.find(x=>x.no===no);if(r)status=r.status==='received'?'complete':r.receivedAmount>0?'partial':'pending';}
   row.hidden=!match(row.textContent,f.query)||(f.status!=='all'&&cashTab==='requests'&&status!==f.status);if(!row.hidden)count++;
  }
  const result=document.getElementById('cash2Results');if(result)result.textContent=`ကိုက်ညီသော မှတ်တမ်း ${N(count)} ခု`;
  const emptyBox=document.getElementById('cash2SearchEmpty');if(emptyBox)emptyBox.hidden=count>0||(!f.query&&f.status==='all');
 }
 renderCashBody=function(){
  const root=document.getElementById('cashBody');if(!root)return;
  const f=filters();let title='',desc='',actions='',controls='',content='';
  if(cashTab==='movements'||cashTab==='expenses2'){
   const expense=cashTab==='expenses2';title=expense?'အသုံးစရိတ်':'ငွေအဝင် / အထွက်';desc=expense?'ပွဲရုံခံအသုံးစရိတ်များကို ရက်နှင့် အကြောင်းအရာအလိုက် ကြည့်ပါ။':'ငွေသိမ်းရာအလိုက် ငွေလှုပ်ရှားမှုကို ကြည့်ပါ။';
   if(expense&&state.role==='staff')actions=btn('အသုံးစရိတ် မှတ်မယ်','openExpense()','primary','plus');
   controls=dateControls(f,expense);content=(invalid(f)?'<div class="cash2-error" role="alert">စရက်သည် ဆုံးရက်ထက် မကျော်ရပါ။ ရက်ကာလကို ပြန်ရွေးပါ။</div>':'')+(expense?expenses(f):movement(f));
  }else if(cashTab==='loans2'){
   title='ကြိုထုတ်ငွေ';desc='ကုန်သည်အလိုက် အတိုးပါကြိုထုတ်ငွေနှင့် ပြန်ဆပ်မှတ်တမ်းကို ကြည့်ပါ။';if(state.role==='owner')actions=btn('ကြိုထုတ်ငွေ ပေးမယ်','newLoan38()','primary','plus');
   const loan=dom(loanMarkup);loan.firstElementChild?.remove();const help=loan.querySelector('.note');if(help){const details=document.createElement('details');details.className='cash2-loan-help';details.innerHTML='<summary>ကြိုထုတ်ငွေ အတိုးတွက်ပုံ ကြည့်ရန်</summary>';help.replaceWith(details);details.append(help);}
   const select=loan.querySelector('#loanFilter38');if(select){select.setAttribute('onchange','cash2LoanFilter(this.value)');for(const o of select.options)o.selected=o.value===f.party;}
   const list=loan.querySelector('#loanList38');if(list)list.innerHTML=loanTable38(f.party);
   content='<p class="cash2-meta">ကြိုသုံးငွေ (အတိုးမဲ့) နှင့် သီးခြားဖြစ်ပါသည်။</p><div class="cash2-loan-content">'+loan.innerHTML+'</div>';
  }else{
   oldBody();const native=dom(root.innerHTML);
   if(cashTab==='cashins50'){
    title='ငွေဖြည့် / ငွေလွှဲ';desc='ပြင်ပမှ ငွေဖြည့်ခြင်းနှင့် ရှိပြီးသား ငွေသိမ်းရာအချင်းချင်း လွှဲခြင်း။';
    if(state.role==='owner')actions=btn('ငွေဖြည့်မယ်',"cash2StartCash('external')",'primary','plus')+btn('ငွေလွှဲမယ်',"cash2StartCash('transfer')",'secondary','transfer');
    native.querySelectorAll('.cash50-history-toolbar>.btn').forEach(x=>x.remove());native.querySelectorAll('.stat-top>span').forEach(x=>{if(x.textContent==='Cash In History')x.textContent='ငွေဖြည့် / ငွေလွှဲ မှတ်တမ်း';});
    controls=ownerRange();
   }else if(cashTab==='payables'||cashTab==='receivables'){
    const payable=cashTab==='payables';title=payable?'ပေးရန်ရှိ':'ရရန်ရှိ';desc=payable?'ကုန်သည်ထံ ပေးရန်ကျန်ငွေနှင့် သက်ဆိုင်ရာဘောက်ချာများ။':'ဝယ်သူထံမှ ရရန်ကျန်ငွေနှင့် သက်ဆိုင်ရာဘောက်ချာများ။';controls=searchControls(f,false)+metadata(0);
   }else if(cashTab==='requests'){
    title='အိမ်မှ ငွေယူလက်မှတ်';desc='လက်မှတ်အလိုက် လက်ခံပြီးငွေနှင့် ရရန်ကျန်ငွေကို ကြည့်ပါ။';if(state.role==='owner')actions=btn('လက်မှတ်အသစ် ရေးမယ်','openMoneyRequest()','primary','plus');
    controls=ownerRange()+searchControls(f,true).replace('ဝယ်သူအမည် / လက်မှတ် ရှာရန်','လက်မှတ် / သွားယူသူ ရှာရန်')+metadata(0);
   }else if(cashTab==='collections'){
    title='အရောင်းငွေ တောင်းခံလက်မှတ်';desc='သက်ဆိုင်ရာအရောင်းမှ လက်မှတ်ထုတ်ပြီး ရရှိငွေကို မှတ်ပါ။';controls=searchControls(f,false)+metadata(0);
   }
   content='<div class="cash2-native" id="cash2Native">'+native.innerHTML+'</div>'+(controls.includes('cash2Search')?'<div id="cash2SearchEmpty" hidden>'+empty('ရှာထားသောအချက်နှင့် ကိုက်ညီသော မှတ်တမ်း မရှိပါ။','doc')+'</div>':'');
  }
  root.innerHTML=`<section class="cash2-panel" aria-label="${title}">${header(title,desc,actions)}${controls}${content}</section>`;
  applySearch();
 };
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
 if(page==='cash'&&!workView)render();
})();

