
/* V53: Dedicated Daily Closing & archived snapshots. Scoped to closing UI, navigation and saved closing metadata. */
(function(){
 'use strict';
 let daily53Tab='today',daily53HistoryDate='';
 const number53=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};
 const fmt53=v=>cashText(number53(v));
 const date53=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?shortDate(d):E(d||'—');
 const unique53=a=>new Set(a.filter(Boolean)).size;
 const sum53=(a,fn)=>a.reduce((total,x)=>total+number53(fn(x)),0);
 const line53=(label,amount,hint='')=>`<div class="daily53-line"><span>${E(label)}${hint?`<small>${E(hint)}</small>`:''}</span><strong>${fmt53(amount)}</strong></div>`;
 const count53=(label,n,hint='')=>`<div class="daily53-line"><span>${E(label)}</span><strong>${typeof n==='string'?E(n):N(n)} ${E(hint)}</strong></div>`;
 const tile53=(label,value,hint='')=>`<article class="daily53-tile"><small>${E(label)}</small><strong>${E(value)}</strong>${hint?`<div class="hint">${E(hint)}</div>`:''}</article>`;
 const panel53=(title,body,subtitle='')=>`<section class="daily53-panel"><h3>${title}</h3>${subtitle?`<p class="daily53-sub">${E(subtitle)}</p>`:''}${body}</section>`;
 function accounts53(){
   const masters=state.masters?.accounts||[];
   const ids=[...new Set([...Object.keys(state.bases||{}),...masters.map(a=>a.id)])];
   return ids.filter(id=>typeof state.bases[id]==='number'||masters.some(a=>a.id===id)).map(id=>{
     const a=masters.find(x=>x.id===id)||{};
     const movements=(state.transactions||[]).filter(t=>t.account===id&&t.date===today());
     const opening=number53(state.bases[id]);
     return {id,name:a.name||id,type:a.type||'cash',opening,balance:bal(id),moneyIn:sum53(movements,x=>Math.max(0,number53(x.amount))),moneyOut:sum53(movements,x=>Math.max(0,-number53(x.amount)))};
   });
 }
 function snapshot53(){
   const d=today();
   const receipts=(state.receipts||[]).filter(r=>r.date===d);
   const purchased=(state.receipts||[]).filter(r=>r.status==='purchased'&&(r.purchaseDate||r.date)===d);
   const sales=(state.sales||[]).filter(s=>s.date===d);
   const expenses=(state.expenses||[]).filter(e=>e.date===d);
   const transfers=(state.cashIns50||[]).filter(x=>x.date===d&&x.status==='posted');
   const receivedRequests=(state.requests||[]).flatMap(r=>Array.isArray(r.receipts62)&&r.receipts62.length?r.receipts62.filter(x=>x.date===d).map(x=>({amount:x.amount,requestNo:r.no})):((r.receivedDate||r.date)===d&&r.status==='received'?[r]:[]));
   const masters=state.warehouses||[];
   const warehouseMap=new Map();
   const ownership={owned:{qty:0,packages:0,loose:0},supplier:{qty:0,packages:0,loose:0},customer:{qty:0,packages:0,loose:0}};
   for(const lot of state.lots||[]){
     if(!ownership[lot.owner])continue;
     const qty=Math.max(0,number53(lot.qty));
     ownership[lot.owner].qty+=qty;
     if(lot.stockForm==='packaged')ownership[lot.owner].packages+=qty;else ownership[lot.owner].loose+=qty;
     const wh=masters.find(w=>w.id===lot.warehouse)?.name||lot.warehouse||'မသတ်မှတ်ရသေး';
     const val=warehouseMap.get(wh)||{warehouse:wh,owned:0,supplier:0,customer:0};val[lot.owner]+=qty;warehouseMap.set(wh,val);
   }
   const cashBefore=bal('cash');
   const expenseSplit={operating:sum53(expenses,e=>e.recoverable||e.paymentPending?0:e.amount),recoverable:sum53(expenses,e=>e.recoverable||e.paymentPending?e.amount:0)};
   return {
     version:53,date:d,createdAt:new Date().toISOString(),opening:{...state.opening},
     accounts:accounts53(),
     receipts:{count:unique53(receipts.map(r=>r.voucherNo||r.no||r.id)),pending:receipts.filter(r=>r.status!=='purchased').length},
     purchases:{count:unique53(purchased.map(r=>r.purchaseNo||r.voucherNo||r.no||r.id)),gross:sum53(purchased,r=>gross(r)),paidToday:0},
     sales:{count:unique53(sales.map(s=>s.voucherNo||s.no||s.id)),total:sum53(sales,s=>s.total),gross:sum53(sales,s=>s.grossTotal??s.total)},
     expenses:{count:expenses.length,operating:expenseSplit.operating,recoverable:expenseSplit.recoverable,total:sum53(expenses,e=>e.amount)},
     funding:{external:sum53(transfers.filter(x=>x.type==='external'),x=>x.amount),externalCount:transfers.filter(x=>x.type==='external').length,internal:sum53(transfers.filter(x=>x.type==='transfer'),x=>x.amount)+sum53(receivedRequests,x=>x.amount),transferCount:transfers.filter(x=>x.type==='transfer').length+receivedRequests.length},
     debts:{payable:payableTotal(),traderPayable74:globalThis.traderDue74?.()||0,traderPending74:(globalThis.traderRecords74?.()||[]).filter(x=>x.status!=='confirmed').reduce((n,x)=>n+x.gross,0),receivable:receivableTotal(),advance:advanceTotal(),openRequests:(state.requests||[]).filter(r=>r.status==='issued').length},
     inventory:{ownership,warehouses:[...warehouseMap.values()]},
     groundIssues:Object.values(state.grounds||{}).filter(g=>Math.abs(number53(g.difference))>.0001||g.bagDifference!=null&&number53(g.bagDifference)!==0).length,
     cashBefore,transfers:[],notes:'',cashAfter:cashBefore,actualBefore:null,actualAfter:null,difference:null
   };
 }
 function rows53(list,headers,mapper,emptyLabel){
   if(!list||!list.length)return `<div class="daily53-note">${E(emptyLabel||'မှတ်တမ်းမရှိပါ။')}</div>`;
   return `<div class="daily53-scroll"><table class="daily53-table"><thead><tr>${headers.map(h=>`<th>${E(h)}</th>`).join('')}</tr></thead><tbody>${list.map(x=>`<tr>${mapper(x).map((c,i)=>`<td class="${i?'numcell':''}">${E(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 function summaryBlock53(s){
   const inv=s.inventory?.ownership||{},own=inv.owned||{},supplier=inv.supplier||{},customer=inv.customer||{};
   const acc=(s.accounts||[]).filter(a=>canViewAccount68(a.id));
   const amtTotal=sum53(acc,x=>x.balance);
   const tileRow=`<div class="daily53-tiles">${tile53('ပွဲရုံလက်ကျန် ငွေသား',accountValue68('cash',acc.find(a=>a.id==='cash')?.balance||0,fmt53),'ငွေသားစာရင်းလက်ကျန်')}${tile53('ယနေ့ အဝယ်',fmt53(s.purchases?.gross||0),N(s.purchases?.count||0)+' Voucher')}${tile53('ယနေ့ အရောင်း (Net)',fmt53(s.sales?.total||0),N(s.sales?.count||0)+' Voucher')}${tile53('စုစုပေါင်းငွေသိမ်းရာလက်ကျန်',fmt53(amtTotal),'ငွေသား / ဘဏ် / Wallet / အိမ်')}</div>`;
   const accountRows=rows53(acc,['ငွေသိမ်းရာ','အဖွင့်','အဝင်','အထွက်','လက်ကျန်'],a=>[a.name,N(a.opening),N(a.moneyIn),N(a.moneyOut),N(a.balance)],'ငွေသိမ်းရာမရှိပါ။');
   const stockRows=rows53((s.inventory?.warehouses||[]),['ဂိုဒေါင်','ပွဲရုံပိုင်','ကုန်သည်ပိုင်','ဝယ်သူပိုင်'],a=>[a.warehouse,vissText37(a.owned),vissText37(a.supplier),vissText37(a.customer)],'ဂိုဒေါင်ကုန်လက်ကျန်မရှိပါ။');
   return tileRow+
      `<div class="daily53-grid">${panel53('ကုန်အဝယ် / အရောင်း အနှစ်ချုပ်',count53('ကုန်လက်ခံ',s.receipts?.count||0,'Voucher')+count53('ဈေးမဖြတ်ရသေးသော ယနေ့လက်ခံစာရင်း',s.receipts?.pending||0,'လိုင်း')+count53('ဈေးဖြတ်ဝယ်ယူပြီး',s.purchases?.count||0,'Voucher')+line53('ဝယ်ယူတန်ဖိုး (Gross)',s.purchases?.gross||0)+count53('အရောင်း',s.sales?.count||0,'Voucher')+line53('အရောင်းတန်ဖိုး (Net Voucher)',s.sales?.total||0),'ဝယ်ရင်း/ရောင်းဈေးနှင့် ငွေရှင်းငွေကို မရောတွက်ပါ။')}
      ${panel53('ငွေဝင် / ငွေထွက် အနှစ်ချုပ်',line53('ပြင်ပ Cash In',s.funding?.external||0)+line53('Internal Transfer (အတွင်းရွှေ့)',s.funding?.internal||0)+line53('ပွဲရုံခံ Expense',s.expenses?.operating||0)+line53('ပြန်ရမည့် ယာယီစိုက်ငွေ',s.expenses?.recoverable||0)+count53('Expense Voucher',s.expenses?.count||0,'ခု'),'Transfer ကို ဝင်ငွေမတွက်ပါ၊ Cash In ကို P&L ဝင်ငွေအဖြစ် မတွက်ပါ။')}
      ${panel53('ပေးရန် / ရရန်နှင့် ကြိုသုံးငွေ',line53('ကုန်သည်ထံ ပေးရန်ကျန်',s.debts?.payable||0)+(s.debts?.traderPayable74?line53('ရောင်းပေးကုန်ဖိုး ပေးရန် (အထက်တွင်ပါပြီး)',s.debts.traderPayable74):'')+(s.debts?.traderPending74?line53('နုတ်ငွေ မစစ်ရသေးသော ကုန်ဖိုး',s.debts.traderPending74,'အထက်ပါပေးရန်တွင် ကုန်ဖိုးအပြည့်ဖြင့် ယာယီပါဝင်သည်။'):'')+line53('ဝယ်သူထံမှ ရရန်ကျန်',s.debts?.receivable||0)+line53('ဈေးမဖြတ်ရသေးသော ကြိုသုံးငွေ',s.debts?.advance||0)+count53('ငွေယူလက်မှတ် (Pending)',s.debts?.openRequests||0,'စောင်'),'ရက်အဆုံးရှိ လက်ကျန်များဖြစ်ပြီး ယနေ့အသစ်ဖြစ်သည့်ငွေများသာ မဟုတ်ပါ။')}
      ${panel53('ကုန်ပိုင်ဆိုင်မှုအလိုက် Stock',count53('ပွဲရုံပိုင်ကုန်',vissText37(own.qty||0),'ပိဿာ')+count53('ကုန်သည်ပိုင်ကုန်',vissText37(supplier.qty||0),'ပိဿာ')+count53('ဝယ်သူပိုင်ကုန်',vissText37(customer.qty||0),'ပိဿာ')+count53('မြေပြင်စစ်ချက် ကွာဟမှု',s.groundIssues||0,'ခု'),'ကုန်သည်ပိုင်နဲ့ ဝယ်သူပိုင် Stock ကို ပွဲရုံပိုင်တန်ဖိုးထဲ မပေါင်းပါ။')}</div>`+
      `<div class="daily53-section-label"><h2>ငွေသိမ်းရာတစ်ခုချင်း လက်ကျန်</h2></div>${panel53('အဖွင့်၊ အဝင်၊ အထွက်နှင့် လက်ကျန်',accountRows,'အဖွင့်လက်ကျန် + ယနေ့အဝင် − ယနေ့အထွက် = စာရင်းလက်ကျန်')}`+
      `<div class="daily53-section-label"><h2>ဂိုဒေါင်အလိုက် ကုန်လက်ကျန်</h2></div>${panel53('ပိုင်ဆိုင်မှုအလိုက် ကုန်လက်ကျန်',stockRows,'ပိဿာအလိုက် — ပိုင်ဆိုင်မှုမရောဘဲ ပြထားပါသည်။')}`;
 }
 function closingForm53(s){
   if(!state.opening.checked)return panel53('နေ့ပိတ်မလုပ်မီ အဖွင့်ငွေစစ်ပါ',note('ယနေ့အဖွင့်ငွေ မစစ်ရသေးပါ။ နေ့ပိတ်ခြင်းကို ဆက်မလုပ်နိုင်ပါ။','amber')+btn('အဖွင့်ငွေစစ်မယ်','openCashCheck()','primary','sun'));
   return `<section class="daily53-panel daily53-cash"><h3>နေ့ပိတ် ငွေရေတွက်ခြင်းနှင့် အိမ်ပို့ငွေ</h3><p class="daily53-sub">တကယ်ရေတွက်ငွေနှင့် အိမ်ပို့ငွေကို ဖြည့်ပါ။ ငွေကွာဟပါက မှတ်ချက်ရေးပါ။ စာရင်းလက်ကျန်ကို အလိုအလျောက် မပြင်ပါ။</p>
     <div class="daily53-line"><span>အဖွင့်စာရင်းအရ ငွေသား</span><strong>${accountValue68('cash',state.opening.expected||0,fmt53)}</strong></div>
     <div class="daily53-line"><span>နေ့ပိတ်မတိုင်မီ စာရင်းအရ ငွေသား</span><strong>${accountValue68('cash',s.cashBefore,fmt53)}</strong></div>
     <form class="daily53-form" id="closeDayForm" onsubmit="event.preventDefault();saveCloseDay()">
       <div class="field-row">${field('လက်ထဲ တကယ်ရေတွက်ရရှိငွေ','closeActual',{type:'number',min:0,required:true,suffix:'ကျပ်',extra:'step="1" oninput="updateClosePreview()"'})}
       ${field('အိမ်သို့ တကယ်ပို့ပြီးသောငွေ','closeTransfer',{type:'number',min:0,value:0,required:true,suffix:'ကျပ်',extra:'step="1" oninput="updateClosePreview()"',help:'တကယ်မပို့ပါက သုညထားပါ။'})}</div>
       <div id="closePreview" class="mb" aria-live="polite"></div>
       ${field('နေ့ပိတ် မှတ်ချက်','closeNote',{placeholder:'ငွေကွာဟချက်နှင့် စစ်ဆေးချက် မှတ်သားရန်',extra:'maxlength="300"'})}
       <label class="daily53-confirm"><input type="checkbox" id="close53Confirm" required><span>ငွေသားကို တကယ်ရေတွက်ပြီးပါပြီ။ အိမ်ပို့ငွေဖြည့်ထားပါက အမှန်တကယ် ပို့ပြီးဖြစ်ကြောင်း အတည်ပြုပါသည်။</span></label>
       <div class="daily53-actions">${btn('ယနေ့ ငွေစာရင်းကြည့်မယ်',"navigate('cash')",'secondary','wallet')}${btn('အတည်ပြု၍ နေ့ပိတ်သိမ်းမယ်','saveCloseDay()','primary','moon')}</div>
     </form>
     <p class="daily53-note">နေ့ပိတ်ပြီးပါက ယနေ့လုပ်ငန်း အသစ်တင်ခြင်းများကို ရပ်တန့်ပေးပါမည်။ နောက်နေ့စာရင်းဖွင့်လျှင် မူလလက်ကျန်များ ဆက်သယ်ပါမည်။</p>
   </section>`;
 }
 function archived53(){
   const all=(state.days||[]).map(d=>({date:d.date,closing:d.closing||null,summary:d.closing?.summary53||null,archived:true}));
   if(state.closed&&state.closing)all.push({date:state.closing.date||today(),closing:state.closing,summary:state.closing.summary53||null,archived:false});
   const uniq=new Map();for(const d of all)uniq.set(d.date,d);
   return [...uniq.values()].sort((a,b)=>b.date.localeCompare(a.date));
 }
 function historicDetail53(item){
   if(!item)return '';
   const c=item.closing||{},s=item.summary;
   const head=`<div class="daily53-section-label"><h2>${E(date53(item.date))} – နေ့ပိတ်မှတ်တမ်း</h2>${btn('Print / PDF',`printDaily53('${E(item.date)}')`,'secondary','print')}</div>`;
   const core=!canViewAccount68('cash')?'':panel53('နေ့ပိတ် ငွေသား ပြန်လည်စစ်ချက်',line53('စာရင်းအရ (မပို့မီ)',c.expectedBefore||0)+line53('တကယ်ရေတွက်ငွေ',c.actualBefore||0)+line53('အိမ်သို့ပို့ငွေ',c.transfer||0)+line53('စာရင်းအရချန်ငွေ',c.expectedAfter||0)+line53('တကယ်ချန်ငွေ',c.actualAfter||0)+line53('ကွာဟချက်',c.difference||0)+`<p class="daily53-note">မှတ်ချက် — ${E(c.note||'မရှိ')}</p>`);
   return head+core+(s?`<div class="daily53-section-label"><h2>နေ့ပိတ်ချိန် သိမ်းထားသော အနှစ်ချုပ်</h2></div>${summaryBlock53(s)}`:`<div class="daily53-notice">ဤရက်သည် V53 မတိုင်မီ နေ့ပိတ်ခဲ့သော History ဖြစ်သည်။ ငွေပိတ်စာရင်းသာ ရရှိပြီး ယနေ့အစီရင်ခံစာအပြည့်အစုံ မသိမ်းထားခဲ့ပါ။</div>`);
 }
 function todayPage53(){
   const s=state.closed&&state.closing?.summary53?state.closing.summary53:snapshot53();
   const c=state.closing;
   let completion='';
   if(state.closed&&c)completion=`<div class="daily53-notice" style="background:#f0f7f2;border-color:#d4e5d8;color:#3b6f51">${I('check')} ယနေ့စာရင်းပိတ်ပြီးပါပြီ။ ယခုစာမျက်နှာသည် သိမ်းထားသည့်နေ့ပိတ်မှတ်တမ်းဖြစ်သည်။</div>`+
       historicDetail53({date:today(),closing:c,summary:c.summary53||null})+
       `<div class="daily53-actions">${btn('နောက်နေ့ဖွင့်မယ်','openNextDay()','primary','sun')}</div>`;
   else completion=canViewAccount68('cash')?closingForm53(s):note('နေ့ပိတ်ငွေရေတွက်ရန် ပွဲရုံငွေသား ကြည့်ခွင့်လိုပါသည်။','blue');
   return state.closed?completion:`${summaryBlock53(s)}<div class="daily53-section-label"><h2>နေ့ပိတ်အတည်ပြုမည်</h2></div>${completion}`;
 }
 function historyPage53(){
   const all=archived53(),chosen=all.find(x=>x.date===daily53HistoryDate)||all[0];
   const rows=all.map(x=>`<div class="daily53-history-row"><div><div class="date">${E(date53(x.date))} · ${pill('နေ့ပိတ်ပြီး')}</div><div class="sub">စာရင်းအရချန်ငွေ ${accountValue68('cash',x.closing?.expectedAfter||0,fmt53)} · တကယ်ချန်ငွေ ${accountValue68('cash',x.closing?.actualAfter||0,fmt53)}</div></div><div class="actions">${smallbtn('View',`viewDailyHistory53('${E(x.date)}')`,'secondary','doc')}${smallbtn('Print',`printDaily53('${E(x.date)}')`,'secondary','print')}</div></div>`).join('');
   return panel53('နေ့ပိတ်မှတ်တမ်း',rows||empty('နေ့ပိတ်ပြီးသော မှတ်တမ်း မရှိသေးပါ။','doc'),'ရက်အလိုက် သိမ်းထားသော နေ့ပိတ်စာရင်းများကို ပြန်ကြည့်နိုင်ပါသည်။')+(chosen?historicDetail53(chosen):'');
 }
 function dailyClosingPage53(){
   const nowClosed=state.closed;
   const toolbar=`<div class="daily53-heading"><div><h1>နေ့ပိတ် စာရင်းစစ်မယ်</h1><p>${E(date53(today()))} · Cash / Bank / Wallet / အဝယ် / အရောင်း / Stock</p></div><div class="row wrap">${pill(nowClosed?'နေ့ပိတ်ပြီး':'နေ့ပိတ်ရန် စစ်ဆေးနေ','' )}${smallbtn('ငွေစာရင်း','navigate(\'cash\')','secondary','wallet')}</div></div>`;
   return `<div class="daily53">${toolbar}<div class="daily53-tabs"><button type="button" class="${daily53Tab==='today'?'active':''}" onclick="setDaily53Tab('today')">ယနေ့စာရင်း / နေ့ပိတ်မယ်</button><button type="button" class="${daily53Tab==='history'?'active':''}" onclick="setDaily53Tab('history')">နေ့ပိတ်မှတ်တမ်း (${N(archived53().length)})</button></div>`+
   `${daily53Tab==='history'?historyPage53():todayPage53()}<p class="daily53-note">ငွေစာရင်းအရ လက်ကျန်နှင့် တကယ်ရေတွက်ငွေ မတူပါက ကွာဟချက်ကို မှတ်ချက်နှင့်အတူ သိမ်းထားပါမည်။</p></div>`;
 }
 window.setDaily53Tab=function(x){if(!['today','history'].includes(x))return;daily53Tab=x;render();};
 window.viewDailyHistory53=function(d){daily53Tab='history';daily53HistoryDate=d;render();document.querySelector('.daily53-section-label')?.scrollIntoView({behavior:'smooth',block:'start'});};
 window.printDaily53=function(date){
   const item=archived53().find(x=>x.date===date);if(!item)return toast('နေ့ပိတ်မှတ်တမ်း မရှိသေးပါ။',true);
   const s=item.summary,c=item.closing||{};
   const plain=(label,value)=>`<tr><td>${E(label)}</td><td style="text-align:right">${E(value)}</td></tr>`;
   const cashRows=[['နေ့ပိတ်ရက်',date53(date)],['စာရင်းအရငွေ (မပို့မီ)',accountValue68('cash',c.expectedBefore,fmt53)],['တကယ်ရေတွက်ငွေ',accountValue68('cash',c.actualBefore,fmt53)],['အိမ်ပို့ငွေ',accountValue68('cash',c.transfer,fmt53)],['စာရင်းအရချန်ငွေ',accountValue68('cash',c.expectedAfter,fmt53)],['တကယ်ချန်ငွေ',accountValue68('cash',c.actualAfter,fmt53)],['ကွာဟချက်',accountValue68('cash',c.difference,fmt53)],['မှတ်ချက်',c.note||'—']];
   const ledger=s?.accounts?.filter(a=>canViewAccount68(a.id)).map(a=>[a.name+' – လက်ကျန်',fmt53(a.balance)])||[];
   const summary=s?[['အဝယ် (Gross)',fmt53(s.purchases?.gross)],['အရောင်း (Net)',fmt53(s.sales?.total)],['Cash In (External)',fmt53(s.funding?.external)],['Internal Transfer',fmt53(s.funding?.internal)],['ပွဲရုံခံ အသုံးစရိတ်',fmt53(s.expenses?.operating)],['ပေးရန်ကျန်',fmt53(s.debts?.payable)],['ရရန်ကျန်',fmt53(s.debts?.receivable)],['ပွဲရုံပိုင် Stock',vissText37(s.inventory?.ownership?.owned?.qty||0)+' ပိဿာ'],['ကုန်သည်ပိုင် Stock',vissText37(s.inventory?.ownership?.supplier?.qty||0)+' ပိဿာ'],['ဝယ်သူပိုင် Stock',vissText37(s.inventory?.ownership?.customer?.qty||0)+' ပိဿာ']]:[];
   document.getElementById('printArea').innerHTML=`<div class="print-title"><h1>ပွဲရုံ</h1><h2>နေ့ပိတ်စာရင်း – ${E(date53(date))}</h2><p>စမ်းသပ်နမူနာ – Production Accounting မဟုတ်ပါ။</p></div><h3>Daily Closing Cash Reconciliation</h3><table><tbody>${cashRows.map(x=>plain(...x)).join('')}</tbody></table>${s?`<h3 style="margin-top:22px">ငွေသိမ်းရာအလိုက်</h3><table><tbody>${ledger.map(x=>plain(...x)).join('')}</tbody></table><h3 style="margin-top:22px">နေ့စဉ်လုပ်ငန်းအနှစ်ချုပ်</h3><table><tbody>${summary.map(x=>plain(...x)).join('')}</tbody></table>`:''}<div style="display:flex;justify-content:space-between;margin-top:45px"><span>စာရင်းတင်သူ ___________________</span><span>အတည်ပြုသူ ___________________</span></div>`;
   window.print();
 };
 const priorNav53=renderNav;
 renderNav=function(){
   priorNav53();const nav=document.getElementById('topNav');if(!nav||nav.querySelector('[data-daily53]'))return;
   nav.insertAdjacentHTML('beforeend',`<button type="button" data-daily53 class="top-nav-btn ${page==='closing'?'active':''}" onclick="openCloseDay()" ${page==='closing'?'aria-current="page"':''}>${I('moon')}နေ့ပိတ်</button>`);
 };
 const priorRender53=render;
 render=function(){
   if(page==='closing'&&!workView){clearToast();renderNav();document.getElementById('main').innerHTML=dailyClosingPage53();if(!state.closed&&daily53Tab==='today'&&state.opening.checked&&document.getElementById('closeDayForm'))updateClosePreview();return;}
   priorRender53();
 };
 // The legacy navigate() invokes its saved renderer directly; force this new route through V53's renderer.
 const priorNavigate53=navigate;
 navigate=function(p){priorNavigate53(p);if(p==='closing'&&page==='closing'&&!workView)render();};
 // Existing buttons in Home/Records/Cash now lead to the dedicated page.
 openCloseDay=function(){daily53Tab='today';navigate('closing');};
 const priorSave53=saveCloseDay;
 saveCloseDay=function(){
   if(page==='closing'&&!state.closed){const checked=document.getElementById('close53Confirm');if(!checked?.checked)return toast('ငွေရေတွက်ပြီး၊ အိမ်ပို့ငွေရှိပါက တကယ်ပို့ပြီးကြောင်း အတည်ပြုပါ။',true);}
   const wasClosed=state.closed;
   const before=wasClosed?null:snapshot53();
   priorSave53();
   if(!wasClosed&&state.closed&&state.closing&&before){
     before.notes=state.closing.note||'';
     before.actualBefore=state.closing.actualBefore;
     before.actualAfter=state.closing.actualAfter;
     before.difference=state.closing.difference;
     before.cashAfter=state.closing.expectedAfter;
     // Historical account balances are captured after the original closing engine posts the transfer.
     before.accounts=before.accounts.map(a=>a.id==='cash'?{...a,balance:state.closing.expectedAfter,moneyOut:a.moneyOut+number53(state.closing.transfer)}:a.id==='home'?{...a,balance:a.balance+number53(state.closing.transfer),moneyIn:a.moneyIn+number53(state.closing.transfer)}:a);
     state.closing.summary53=before;
     state.closing.closedAt=new Date().toISOString();
     save();daily53Tab='today';render();
   }
 };
 document.title='ပွဲရုံ · V54 Owner-Only Advance';
 if(document.getElementById('main'))render();
})();
