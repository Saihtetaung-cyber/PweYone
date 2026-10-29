
/* V74: trader-owned goods only. Two independent fee sides share the original
   sale/lot references. Settlement never creates a purchase or moves stock. */
(function(){
 'use strict';
 const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
 const sum=(a,f)=>round(a.reduce((n,x)=>n+(Number(f(x))||0),0));
 const validMoney=n=>Number.isFinite(n)&&n>=0&&n<=1e12&&Math.abs(n*100-Math.round(n*100))<.0001;
 const dateOK=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!Number.isNaN(Date.parse(d))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 const party=s=>supplierBy(s.partnerId);
 const saleRef=s=>s.voucherNo||s.no||s.id;
 const supplierId=s=>s.sourceSupplierId||s.originPartnerId||'';
 const paid=s=>sum(s.payments||[],x=>x.amount);
 const fees=c=>round((c.service||0)+(c.labor||0)+sum(c.others||[],x=>x.amount));
 const deductions=c=>round(fees(c)+(c.advance||0)+sum(c.recoveries||[],x=>x.amount)+(c.loanTotal38||0));
 const net=s=>round(s.gross-(s.status==='confirmed'?deductions(s.charges):0));
 const due74=s=>Math.max(0,round(net(s)-paid(s)));
 let ensuring=false,listContext={partnerId:'',voucher:''};
 function ensure(){
  if(ensuring)return;ensuring=true;
  try{
   state.traderSettlements74??=[];
   const grouped=new Map();
   for(const sale of state.sales||[]){
    if(sale.sourceOwner!=='supplier'||!supplierId(sale))continue;
    const key=JSON.stringify([saleRef(sale),supplierId(sale)]);
    if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(sale);
   }
   for(const [key,rows] of grouped){
    if(state.traderSettlements74.some(x=>x.sourceKey===key))continue;
    const first=rows[0],gross=sum(rows,x=>x.grossTotal??x.total);
    if(!validMoney(gross)||gross<=0)continue;
    state.traderSettlements74.push({id:'TS74-'+first.id,sourceKey:key,no:'ကရှ-'+first.id,
     partnerId:supplierId(first),saleVoucher:saleRef(first),saleIds:rows.map(x=>x.id),date:first.date,gross,
     status:'pending',charges:{mode:'no',rate:0,service:0,labor:0,others:[],advance:0,recoveries:[]},payments:[],changes:[]});
   }
  }finally{ensuring=false;}
 }
 const records=()=>{ensure();return state.traderSettlements74;};
 const record=id=>records().find(x=>x.id===id);
 const sourceRows=s=>(state.sales||[]).filter(x=>s.saleIds.includes(x.id));
 function consistent(s){const rows=sourceRows(s);return rows.length===s.saleIds.length&&rows.every(x=>x.sourceOwner==='supplier'&&supplierId(x)===s.partnerId&&saleRef(x)===s.saleVoucher)&&Math.abs(sum(rows,x=>x.grossTotal??x.total)-s.gross)<.005;}
 function writable(){return ['owner','staff','accountant'].includes(state.role)&&guardWork();}
 function atomic(fn){
  const previous=JSON.parse(JSON.stringify(state)),epoch=workEpoch;
  try{fn();storageOK=true;save();if(!storageOK)throw Error('storage');return true;}
  catch(e){state=previous;workEpoch=epoch;error('မှတ်တမ်းကို သိမ်းမရပါ။ ငွေနှင့် လက်ကျန်ကို မပြောင်းထားပါ။ ပြန်စစ်ပြီး ထပ်သိမ်းပါ။');return false;}
 }
 function rates(){return [...new Set([.5,1,1.5,2,2.5,3,...deductionRatesFor('purchase',true).filter(x=>x.calcMode==='service_percent').map(x=>Number(x.rate))])].filter(x=>x>0&&x<=100).sort((a,b)=>a-b);}
 function recoveryBalance(e){return e.recovered?0:Math.max(0,round(Number(e.amount)-sum(e.settlementRecoveries74||[],x=>x.amount)));}
 function recoverable(s){const ids=new Set(sourceRows(s).map(x=>x.sourceReceiptId));return (state.expenses||[]).filter(e=>e.recoverable&&!e.paymentPending&&recoveryBalance(e)>0&&(e.partnerId===s.partnerId||ids.has(e.receiptId)));}
 function status(s){return s.status!=='confirmed'?'ပေါင်းနုတ်ငွေ စစ်ရန်':due74(s)<=0?'ရှင်းပြီး':paid(s)>0?'တစ်စိတ်တစ်ပိုင်း ပေးပြီး':'ပေးရန်ကျန်';}
 function action(s){return btn(s.status==='confirmed'?'ငွေရှင်း အသေးစိတ်':'ပေါင်းနုတ်ငွေ စစ်မယ်',`openTrader74('${s.id}')`,'secondary','doc');}
 function sourceTable(s){return table4(['ကုန် / မူရင်းကုန်ဝင်','ဂိုဒေါင် / အသုတ်','ပိဿာ','ကုန်ဖိုး'],sourceRows(s).map(x=>`<tr><td>${E(x.product)}<div class="small muted">${E(x.sourceReceiptNo||'—')}</div></td><td>${E(W(x.warehouse))}<div class="small muted">${E(x.batch||'—')}</div></td><td>${vissText37(x.qty)}</td><td>${cashText(x.grossTotal??x.total)}</td></tr>`));}
 function chargeRows(s){
  const c=s.charges;
  return row4('မူရင်း ကုန်ရောင်းတန်ဖိုး',cashText(s.gross))+
   (c.service?row4('နုတ် · ပွဲခ '+N(c.rate)+'%','− '+cashText(c.service)):'')+
   (c.labor?row4('နုတ် · လုပ်သားခ','− '+cashText(c.labor)):'')+
   (c.others||[]).map(x=>row4('နုတ် · '+E(x.name),'− '+cashText(x.amount))).join('')+
   (c.advance?row4('နုတ် · ယခင်ကြိုသုံးငွေ','− '+cashText(c.advance)):'')+
   (c.recoveries||[]).map(x=>row4('နုတ် · ယခင်စိုက်ထုတ် '+E(x.name),'− '+cashText(x.amount))).join('')+
   (c.loanTotal38?row4('နုတ် · ကြိုထုတ်ငွေ အရင်း','− '+cashText(sum(c.loanPayments38||[],x=>x.principal)))+row4('နုတ် · ကြိုထုတ်ငွေ အတိုး','− '+cashText(sum(c.loanPayments38||[],x=>x.interest))):'')+
   row4('စုစုပေါင်း နုတ်ငွေ',cashText(deductions(c)))+row4('ကုန်သည်ကို ရှင်းပေးရမည့် အသားတင်',cashText(net(s)))+
   row4('ပေးပြီးငွေ',cashText(paid(s)))+row4('ပေးရန်ကျန်',cashText(due74(s)));
 }
 function splitDescription(splits){return splits.map(a=>canViewAccount68(a.account)?E(state.masters.accounts.find(z=>z.id===a.account)?.name||a.account)+' · '+cashText(a.amount):'ကြည့်ခွင့်မရှိသော ငွေသိမ်းရာ').join('<br>');}
 function paymentRows(s,print=false){if(!s.payments.length)return '<p class="note blue mt">ယခုဘောက်ချာအတွက် ပေးချေမှု မရှိသေးပါ။</p>';return table4(['ရက် / အမှတ်','ငွေသိမ်းရာ','ပေးချေငွေ',...(print?[]:[''])],(s.payments||[]).map(x=>`<tr><td>${shortDate(x.date)}<div class="small muted">${E(x.no)}</div></td><td>${splitDescription(x.splits)}</td><td>${cashText(x.amount)}</td>${print?'':`<td>${smallbtn('ငွေပေးချေလက်မှတ်',`printTraderPayment74('${s.id}','${x.id}')`,'secondary','print')}</td>`}</tr>`));}
 function buyerSummary(s){
  const ids=new Set(s.saleIds),all=(state.sales||[]).filter(x=>saleRef(x)===s.saleVoucher);
  const buyerPart=sourceRows(s),extra=round(sum(buyerPart,x=>x.total)-s.gross);
  return `<section class="ts74-side"><h3>ဝယ်သူဘက် · သီးခြားပေါင်းကောက်ပြီး</h3><p class="small muted">${E(all[0]?.name||'')} · ${E(s.saleVoucher)}${all.some(x=>!ids.has(x.id))?' · ဤကုန်သည်၏ ကုန်လိုင်းများအတွက်သာ':''}</p>${row4('ကုန်ဖိုး',cashText(s.gross))}${row4('ဝယ်သူဘက် ထပ်ပေါင်းအခများ','+ '+cashText(extra))}${row4('ဝယ်သူဘက် စုစုပေါင်း',cashText(sum(buyerPart,x=>x.total)))}<p class="field-help">ဝယ်သူထံမှ ငွေရရှိမှုနှင့် ကုန်သည်ကို ငွေပေးမှုကို သီးခြားမှတ်တမ်းတင်ပါသည်။ ဝယ်သူငွေ မရသေးလည်း ကုန်သည်ကို ရှင်းပေးနိုင်ပါသည်။</p></section>`;
 }
 window.traderRecords74=records;
 window.traderDue74=id=>sum(records().filter(s=>!id||s.partnerId===id),due74);
 window.traderRecordForSale74=id=>records().find(s=>s.saleIds.includes(id));
 window.traderNet74=s=>net(s);
 window.traderChargeItems74=s=>s.status!=='confirmed'?[]:[{name:'ပွဲခ',amount:s.charges.service},{name:'လုပ်သားခ',amount:s.charges.labor},...s.charges.others,{name:'ယခင်ကြိုသုံးငွေ ပြန်နုတ်',amount:s.charges.advance},...s.charges.recoveries.map(x=>({name:'ယခင်စိုက်ထုတ် '+x.name,amount:x.amount})),{name:'ကြိုထုတ်ငွေ အရင်းပြန်နုတ်',amount:sum(s.charges.loanPayments38||[],x=>x.principal)},{name:'ကြိုထုတ်ငွေ အတိုးပေး',amount:sum(s.charges.loanPayments38||[],x=>x.interest)}].filter(x=>x.amount>0);
 window.traderMoneyEvents74=id=>records().filter(s=>s.partnerId===id).flatMap(s=>s.payments.flatMap(p=>p.splits.filter(x=>canViewAccount68(x.account)).map(x=>({date:p.date,ref:p.no,type:'ကုန်သည်ရောင်းပေးငွေ ရှင်း',account:x.account,out:x.amount,note:s.saleVoucher,recordId:s.id,kind:'trader74'}))));
 window.traderEvents74=id=>records().filter(s=>s.partnerId===id).flatMap(s=>[
  {date:s.date,ref:s.no,type:'ကုန်သည်ပိုင် ရောင်းပေးကုန်ဖိုး · '+s.saleVoucher,payable:s.gross},
  ...(s.changes||[]).map(x=>({date:x.date,ref:s.no,type:'ကုန်သည်ဘက် အခနှင့် ပြန်နုတ်ငွေ',payable:-x.amount})),
  ...s.payments.map(x=>({date:x.date,ref:x.no,type:'ကုန်သည်ရောင်းပေးငွေ ပေးချေ',payable:-x.amount}))]);
 function listHTML(rows){if(!rows.length)return '<p class="note blue mt">ကိုက်ညီသော ငွေရှင်းမှတ်တမ်း မရှိပါ။</p>';return table4(['ကုန်သည် / အရောင်း','ကုန်ဖိုး','ပေါင်းနုတ်ငွေ','အသားတင် / ပေးပြီး','ပေးရန်ကျန်','အခြေအနေ / လုပ်ဆောင်ရန်'],rows.map(s=>`<tr><td><strong>${E(party(s)?.name||s.partnerId)}</strong><div class="small muted">${E(s.saleVoucher)} · ${shortDate(s.date)}</div></td><td>${cashText(s.gross)}</td><td>${s.status==='confirmed'?cashText(deductions(s.charges)):'စစ်ရန်'}</td><td>${cashText(net(s))}<div class="small muted">ပေးပြီး ${cashText(paid(s))}</div></td><td><strong>${cashText(due74(s))}</strong></td><td>${pill(status(s),s.status!=='confirmed'?'amber':due74(s)?'blue':'')}<div class="mt">${action(s)}</div></td></tr>`));}
 window.traderPanel74=function(id='',from='',to=''){
  const rows=records().filter(s=>(!id||s.partnerId===id)&&(!from||s.date>=from)&&(!to||s.date<=to));
  if(!rows.length)return '';
  return `<section class="card ts74-panel mt"><div class="row between wrap"><h3>ကုန်သည်ပိုင်ကုန် · ရောင်းပေးငွေရှင်း</h3>${btn('ငွေရှင်းမှတ်တမ်းအားလုံး',`openTraderList74('${id}')`,'secondary','doc')}</div><p class="field-help">ပေါင်းနုတ်ငွေ မစစ်ရသေးသောဘောက်ချာကို ကုန်ဖိုးအပြည့်ဖြင့် ပေးရန်ယာယီပြထားသည်။ ပေါင်းနုတ်ငွေ အတည်ပြုပြီးမှ ငွေပေးချေနိုင်ပါသည်။</p>${listHTML(rows)}</section>`;
 };
 window.openTraderList74=function(partnerId='',voucher=''){
  listContext={partnerId,voucher};
  openModal('ကုန်သည်ပိုင်ကုန် · ရောင်းပေးငွေရှင်း','ဝယ်သူဘက် ပေါင်းကောက်ခနှင့် ကုန်သည်ဘက် နုတ်ယူခကို သီးခြားစစ်ဆေးပါ။',
   `<div class="field-row">${selectField('အခြေအနေ','tsFilter74',[['all','အားလုံး'],['pending','ပေါင်းနုတ်ငွေ စစ်ရန်'],['due','ပေးရန်ကျန်'],['paid','ရှင်းပြီး']],'all','onchange="filterTraderList74()"')}${field('ကုန်သည် / အရောင်းအမှတ် ရှာရန်','tsSearch74',{extra:'oninput="filterTraderList74()"'})}</div><div id="tsListBody74"></div>`,btn('ပြန်မယ်','closeModal()','secondary'),true);
  filterTraderList74();
  document.querySelector('#main .work-page')?.classList.add('ts74-work');
 };
 window.filterTraderList74=function(){
  const term=searchText(value('tsSearch74')),mode=value('tsFilter74');
  const rows=records().filter(s=>(!listContext.partnerId||s.partnerId===listContext.partnerId)&&(!listContext.voucher||s.saleVoucher===listContext.voucher))
   .filter(s=>!term||searchText((party(s)?.name||'')+' '+s.saleVoucher+' '+s.no).includes(term))
   .filter(s=>mode==='all'||mode==='pending'&&s.status!=='confirmed'||mode==='due'&&due74(s)>0||mode==='paid'&&s.status==='confirmed'&&due74(s)===0);
  document.getElementById('tsListBody74').innerHTML=listHTML(rows);
 };
 // V75: purchase-style sections 03 / 04, using existing labor and deduction masters.
 const sourceReceipts75=s=>new Set(sourceRows(s).map(x=>x.sourceReceiptId).filter(Boolean));
 const unusedAdvance75=a=>Math.max(0,round(Number(a.amount)-sum(a.allocations||[],x=>x.amount)));
 const linkedAdvance75=s=>sum((state.partnerAdvances||[]).filter(a=>a.partnerId===s.partnerId&&sourceReceipts75(s).has(a.sourceReceiptId)),unusedAdvance75);
 const linkedRecovery75=(s,e)=>sourceReceipts75(s).has(e.receiptId)||sourceRows(s).some(x=>state.receipts.find(r=>r.id===x.sourceReceiptId)?.carriageExpenseId===e.id);
 const manualRules75=()=>deductionRatesFor('purchase',true).filter(r=>r.calcMode==='manual');
 const ruleName75=r=>r?.displayName||r?.customType||r?.name||'';
 let initialFormSeq75=0;
 function loanBox75(s){
  const loans=(state.supplierLoans38||[]).filter(l=>l.partnerId===s.partnerId);
  return `<section class="ts75-loans"><h3>ကြိုထုတ်ငွေ · အရင်းပြန်နုတ် / အတိုးပေး</h3><p class="note blue">ကြိုသုံးငွေ (အတိုးမဲ့) နှင့် သီးခြားဖြစ်ပါသည်။ မူရင်းကြိုထုတ်ငွေစာရင်း၏ ရက်အလိုက် အရင်း / အတိုးလက်ကျန်ကို အသုံးပြုပါသည်။</p>${loans.map(l=>`<div class="ts75-loan" data-loan="${E(l.id)}"><strong>${E(l.id)} · ${E(l.date)} · ${N(l.rate)}% / လ</strong><div class="ts75-loan-balance"></div><div class="field-row"><label>ယခု အရင်းပြန်နုတ်မည်<input class="ts75-loan-principal" type="number" min="0" step="0.01" value="0" oninput="calcTrader74()"></label><label>ယခု အတိုးပေးမည်<input class="ts75-loan-interest" type="number" min="0" step="0.01" value="0" oninput="calcTrader74()"></label></div></div>`).join('')||'<p class="field-help">ဤကုန်သည်အတွက် ကြိုထုတ်ငွေ မရှိပါ။</p>'}</section>`;
 }
 function allocateAdvance75(s,amount,date){
  const ids=sourceReceipts75(s),all=(state.partnerAdvances||[]).filter(a=>a.partnerId===s.partnerId);
  const ordered=[...all.filter(a=>ids.has(a.sourceReceiptId)),...all.filter(a=>!ids.has(a.sourceReceiptId))];
  let remaining=amount;const links=[];
  for(const a of ordered){const used=Math.min(unusedAdvance75(a),remaining);if(used>0){(a.allocations??=[]).push({receiptId:s.id,settlementId74:s.id,date,amount:used});links.push({advanceId:a.id,amount:used});remaining=round(remaining-used);}if(remaining<=0)break;}
  if(remaining>.001)throw Error('advance allocation changed');
  return links;
 }
 function recoveryBox75(s,e){
  const linked=linkedRecovery75(s,e),r=state.receipts.find(r=>r.id===e.receiptId),label=e.reason||e.title||'စိုက်ထုတ်ငွေ';
  return `<div class="ts74-recovery ts75-recovery" data-expense="${E(e.id)}" data-linked="${linked?'yes':'no'}"><label>${E(label)} · ပြန်နုတ်ရန်</label><p class="field-help">${E(r?.voucherNo||r?.no||'ယခင်မှတ်တမ်း')} · ပြန်နုတ်ရန်ကျန် ${cashText(recoveryBalance(e))}${linked?' · ဤအရောင်း၏ မူရင်းကုန်ဝင်မှ':''}</p><input type="number" min="0" step="0.01" max="${recoveryBalance(e)}" value="${linked?recoveryBalance(e):0}" aria-label="${E(label)} ပြန်နုတ်ပမာဏ" oninput="calcTrader74()"></div>`;
 }
 function step75(n,title,caption){return `<div class="ts75-step-title"><span>${n}</span><div><h3>${title}</h3><p>${caption}</p></div></div>`;}
 window.openTrader74=function(id){
  const s=record(id);if(!s)return;
  if(!consistent(s))return toast('မူရင်းအရောင်းနှင့် ငွေရှင်းမှတ်တမ်း မကိုက်ပါ။ မူရင်းအရောင်းကို ပြန်စစ်ပါ။',true);
  const confirmed=s.status==='confirmed',available=recoverable(s),linked=available.filter(e=>linkedRecovery75(s,e)),other=available.filter(e=>!linkedRecovery75(s,e));
  const intro=`<section class="ts75-section ts75-source"><h3>ကုန်သည်ဘက် ရောင်းပေးငွေရှင်း</h3><p class="field-help">${E(party(s)?.name||s.partnerId)} · ${E(s.saleVoucher)}</p>${confirmed?'':field('ငွေရှင်းတွက်ချက်ရက်','tsDate74',{type:'date',value:today(),required:true,extra:`min="${E(s.date)}" max="${E(today())}" onchange="calcTrader74()"`})}${sourceTable(s)}<details class="ts75-buyer"><summary>ဝယ်သူဘက် ပေါင်းကောက်ထားသည့်စာရင်း ကြည့်ရန်</summary>${buyerSummary(s)}</details></section>`;
  const laborHTML=laborRowHtml(0).replaceAll('calcVoucher4()','calcTrader74()');
  const main=confirmed?`<div class="ts75-main">${intro}<section class="ts75-section">${step75('03','အတည်ပြုပြီး ပေါင်းနုတ်ငွေများ','ကုန်သည်ဘက် သီးခြားနုတ်ယူထားသောအခများ')}${chargeRows(s)}${s.charges.laborRows?.length?'<p class="field-help">လုပ်သားခ — '+s.charges.laborRows.map(r=>E(r.name)+' × '+E(r.maelName)+' × '+N(r.bags)+' အိတ် = '+cashText(r.total)).join('၊ ')+'</p>':''}</section><section class="ts75-section">${step75('04','ကုန်သည်ငွေ ပေးချေမှု','ဘောက်ချာအလိုက် ပေးပြီးငွေနှင့် ကျန်ငွေ')}${paymentRows(s)}</section></div>`:
   `<form id="tsForm74" class="ts75-main" data-record="${E(id)}" data-token="TSFIRST75-${E(id)}-${++initialFormSeq75}-${Date.now()}" onsubmit="event.preventDefault();confirmTrader74('${id}')">
    ${intro}<section class="ts75-section ts75-fees">${step75('03','ပေါင်းနုတ်ငွေနှင့် အခများ','ပွဲခ၊ လုပ်သားခ၊ အခြားနုတ်ငွေနှင့် ကုန်လက်ခံချိန်က စိုက်ထုတ်ငွေများကို စစ်ပြီး ဖြည့်ပါ။')}
     <div class="note blue ts75-auto-note"><strong>ကုန်လက်ခံချိန်က ပြန်နုတ်ရန်ငွေ</strong><p>ကြိုသုံးငွေ ${cashText(linkedAdvance75(s))}၊ တန်ဆာခ / စိုက်ထုတ်ငွေ ${cashText(sum(linked,recoveryBalance))} ကို အောက်ပါ Box များတွင် ဖြည့်ပေးထားပါသည်။ ယခုပြန်နုတ်မည့်ပမာဏကို ပြင်နိုင်ပါသည်။</p></div>
     <div class="ts75-service"><h3>ဝန်ဆောင်ခ / ပွဲခ</h3><div class="field-row">${selectField('ဝန်ဆောင်ခ ယူမလား','tsMode74',[['no','မယူပါ'],['yes','ယူမည်']],'no','onchange="calcTrader74()"')}<div id="tsRateWrap75" hidden>${selectField('ရာခိုင်နှုန်း (%)','tsRate74',[['','ရာခိုင်နှုန်း ရွေးပါ'],...rates().map(n=>[String(n),N(n)+'%'])],'','onchange="calcTrader74()"')}</div></div><p class="field-help">အနုတ်ငွေ မနုတ်ခင် ကုန်ဖိုးပေါ်မှ ရာခိုင်နှုန်းဖြင့် တွက်ပါသည်။ ဝယ်သူဘက်နှုန်းနှင့် သီးခြားဖြစ်ပါသည်။</p></div>
     <h3 class="mt">လုပ်သားခ</h3><p class="field-help">အဝယ်ဖောင်အတိုင်း မယ်နှုန်း × မယ် × အိတ်အရေအတွက်ဖြင့် Auto တွက်ပါမည်။</p><div id="tsLaborRows75">${laborHTML}</div>
     <div class="divider"></div><p class="field-help">ဝန်ဆောင်ခနှင့် လုပ်သားခမှလွဲ၍ ကျန်နုတ်ငွေအမျိုးအစားကို ရွေးပြီး ငွေပမာဏ ထည့်ပါ။</p>
     <div id="tsOtherRows74"></div>${btn('နုတ်ငွေ Row အသစ်ထည့်မယ်','addTraderOther74()','secondary','plus')}<div id="tsDuplicate75" role="alert"></div>
     <div class="divider"></div><div class="ts75-advance">${field('ကြိုသုံးငွေ ပြန်နုတ်ရန်','tsAdvance74',{type:'number',value:linkedAdvance75(s),min:0,max:supplierBalance(s.partnerId),step:.01,required:true,suffix:'ကျပ်',extra:'oninput="calcTrader74()"'})}<p class="field-help">ဤကုန်ဝင်မှ ကျန်ငွေ ${cashText(linkedAdvance75(s))} · ကုန်သည်၏ စုစုပေါင်းကြိုသုံးလက်ကျန် ${cashText(supplierBalance(s.partnerId))}။ ယခုပြန်နုတ်မည့်ငွေကို ပြင်နိုင်ပါသည်။</p></div>
     ${linked.map(e=>recoveryBox75(s,e)).join('')}
     ${other.length?`<details class="req-details ts75-other-recoveries"><summary>ယခင်အခြားစိုက်ထုတ်ငွေမှ ပြန်နုတ်လိုလျှင်</summary>${other.map(e=>recoveryBox75(s,e)).join('')}</details>`:''}
    </section><section class="ts75-section ts75-payment">${step75('04','ကုန်သည်ငွေ ပေးချေခြင်း','ယခုပေးမည့်ငွေကို ဖြည့်ပါ။ နောက်မှပေးမည်ဆိုလျှင် 0 ထားနိုင်ပါသည်။')}
     ${field('ယခု ပေးချေမည့်ငွေ','tsInitialPaid75',{type:'number',min:0,step:.01,value:0,required:true,suffix:'ကျပ်',extra:'oninput="syncTraderInitial75()"'})}
     <div id="tsInitialSplits75"><div id="splitRows4"></div>${btn('ငွေပေးချေနည်း ထပ်ထည့်မယ်','addTraderSplit75()','secondary','plus')}<p class="field-help">ငွေခွဲပမာဏ စုစုပေါင်းသည် ယခုပေးချေငွေနှင့် တူရပါမည်။</p></div>
     <label class="account-permission68" id="tsInitialCheckWrap75" hidden><input id="tsInitialCheck75" type="checkbox"><span>ကုန်သည်ထံ ယခုပေးချေငွေကို တကယ်ပေးချေပြီးပါပြီ။</span></label>
     ${loanBox75(s)}
    </section><section class="ts75-section">${field('မှတ်ချက်','tsNote74',{extra:'maxlength="300"'})}<label class="account-permission68"><input type="checkbox" id="tsCheck74"><span>ပေါင်းနုတ်ငွေ၊ အသားတင်နှင့် ပေးချေငွေတို့ကို စစ်ပြီး မှန်ကန်ပါသည်။</span></label></section>
   </form>`;
  const preview=`<aside class="ts75-preview"><h3>ကုန်သည် ငွေရှင်းအနှစ်ချုပ်</h3><p class="field-help">နှုန်းထားနှင့် ငွေပမာဏပြောင်းလျှင် Auto ပြန်တွက်ပါမည်။</p><div id="tsPreview74" aria-live="polite">${confirmed?chargeRows(s):''}</div><p class="note blue">ကုန်သည်ဘက် နုတ်ငွေကိုသာ ဤဘောက်ချာတွင် ပြထားပါသည်။</p></aside>`;
  openModal('ကုန်သည်ငွေရှင်းဘောက်ချာ',`${E(party(s)?.name||s.partnerId)} · ${E(s.no)} · အရောင်း ${E(s.saleVoucher)}`,
   `<div class="ts74-detail ts75-layout">${main}${preview}</div>`,
   btn('စာရင်းသို့','openTraderList74()','secondary')+(confirmed?btn('ကုန်သည်ဘောက်ချာ Print',`printTrader74('${id}')`,'secondary','print')+(due74(s)>0?btn('ငွေပေးချေမယ်',`payTrader74('${id}')`,'primary','wallet'):''):btn('ကုန်သည်ငွေရှင်း အတည်ပြုမယ်',`confirmTrader74('${id}')`,'primary','check')),true);
  document.querySelector('#main .work-page')?.classList.add('ts74-work','ts75-work');
  if(!confirmed){if(aOpts().length)addTraderSplit75();else document.getElementById('tsInitialSplits75').innerHTML='<p class="note blue">ကြည့်ခွင့်ရှိသော ငွေသိမ်းရာ မရှိပါ။ ယခုပေးချေငွေ 0 ဖြင့် နုတ်ငွေကို အတည်ပြုထားနိုင်ပါသည်။</p>';calcTrader74();}
 };
 window.addTraderOther74=function(rateId=''){
  const root=document.getElementById('tsOtherRows74');if(!root)return;
  const rules=manualRules75();if(!rules.length)return error('သတ်မှတ်ချက်များ → ပေါင်းနုတ်ငွေ နှုန်းထားတွင် အဝယ် သို့မဟုတ် နှစ်မျိုးလုံးအတွက် Manual နုတ်ငွေအမျိုးအစားကို အရင် Create လုပ်ပါ။');
  const row=document.createElement('div');row.className='ts74-other ts75-other';
  row.innerHTML='<label>နုတ်ငွေအမျိုးအစား<select class="ts74-other-name" onchange="calcTrader74()"><option value="">ရွေးပါ</option>'+rules.map(r=>`<option value="${E(r.id)}" ${r.id===rateId?'selected':''}>${E(ruleName75(r))}</option>`).join('')+'</select></label><label>ငွေပမာဏ<input type="number" class="ts74-other-amount" min="0" step="0.01" value="0" oninput="calcTrader74()"></label><button type="button" class="btn btn-secondary" onclick="this.closest(\'.ts74-other\').remove();calcTrader74()">ဖယ်မယ်</button>';
  root.appendChild(row);calcTrader74();
 };
 window.addTraderSplit75=function(){
  if(!document.getElementById('tsForm74'))return;addSplit4();
  const row=document.querySelector('#tsForm74 .req-split:last-child');if(!row)return;
  row.querySelector('input').setAttribute('oninput','calcTrader74()');
  row.querySelector('select').setAttribute('onchange','calcTrader74()');
  row.querySelector('button')?.setAttribute('onclick',"this.closest('.req-split').remove();calcTrader74()");
  syncTraderInitial75();
 };
 window.syncTraderInitial75=function(){const rows=document.querySelectorAll('#tsForm74 .req-split');if(rows.length===1)rows[0].querySelector('input[type="number"]').value=value('tsInitialPaid75');calcTrader74();};
 function readForm(s){
  const mode=value('tsMode74'),rate=mode==='yes'?Number(value('tsRate74')):0;
  const others=[...document.querySelectorAll('#tsOtherRows74 .ts74-other')].map(r=>{const rateId=r.querySelector('.ts74-other-name').value,rule=deductionRateById(rateId);return {rateId,name:ruleName75(rule),amount:Number(r.querySelector('.ts74-other-amount').value),itemType:rule?.itemType,customType:rule?.customType||''};});
  const recoveries=[...document.querySelectorAll('#tsForm74 .ts74-recovery')].map(r=>{const e=state.expenses.find(e=>e.id===r.dataset.expense);return {expenseId:r.dataset.expense,name:e?.reason||e?.title||'စိုက်ထုတ်ငွေ',amount:Number(r.querySelector('input').value)};});
  const laborRows=purchaseLaborRows().filter(r=>r.bags!==0);
  const loanPayments38=[...document.querySelectorAll('#tsForm74 .ts75-loan')].map(el=>({loanId:el.dataset.loan,principal:Number(el.querySelector('.ts75-loan-principal').value),interest:Number(el.querySelector('.ts75-loan-interest').value)}));
  return {mode,rate,service:Math.round(s.gross*rate/100),labor:sum(laborRows,r=>r.total),laborRows,others,advance:number('tsAdvance74'),recoveries,loanPayments38,loanTotal38:sum(loanPayments38,x=>x.principal+x.interest),sourceVersion75:true};
 }
 function duplicate75(s,c){
  const seen=new Set();for(const x of c.others){if(!x.rateId)continue;const rule=deductionRateById(x.rateId),key=typeof recoveryCategory57==='function'?recoveryCategory57(rule):x.rateId;
   if(seen.has(key))return 'နုတ်ငွေအမျိုးအစားတူကို တစ်ဘောက်ချာတွင် နှစ်ကြိမ် မရွေးနိုင်ပါ။';seen.add(key);
   if(key==='transport'&&recoverable(s).some(e=>linkedRecovery75(s,e)&&/တန်ဆာ|ကားခ|ခေါက်ရှည်/.test(e.reason||e.title||'')))return 'ကုန်လက်ခံချိန်က တန်ဆာခကို Box ထဲတွင် ပြထားပြီးဖြစ်ပါသည်။ ထပ်မရွေးဘဲ ထို Box မှာ ပြန်နုတ်ပမာဏကို ပြင်ပါ။';
   if(key==='labor'&&c.labor>0)return 'လုပ်သားခကို မယ်နှုန်းဖြင့် တွက်ထားပြီးဖြစ်ပါသည်။ Manual Row တွင် ထပ်မရွေးပါနှင့်။';
   if(key==='service'&&c.service>0)return 'ပွဲခကို ရာခိုင်နှုန်းဖြင့် တွက်ထားပြီးဖြစ်ပါသည်။ Manual Row တွင် ထပ်မရွေးပါနှင့်။';
  }return '';
 }
 window.calcTrader74=function(){
  const form=document.getElementById('tsForm74');if(!form)return;
  const s=record(form.dataset.record),yes=value('tsMode74')==='yes';document.getElementById('tsRate74').disabled=!yes;document.getElementById('tsRateWrap75').hidden=!yes;
  if(!yes)document.getElementById('tsRate74').value='';
  const c=readForm(s),total=deductions(c),remaining=round(s.gross-total),pay=number('tsInitialPaid75');
  for(const el of document.querySelectorAll('#tsForm74 .ts75-loan')){const l=(state.supplierLoans38||[]).find(l=>l.id===el.dataset.loan);if(!l)continue;const b=loanBalance38(l,value('tsDate74'));el.querySelector('.ts75-loan-balance').innerHTML=row4('အရင်းလက်ကျန်',cashText(b.principal))+row4('ငွေရှင်းရက်အထိ အတိုးလက်ကျန်',cashText(b.interest));}
  for(const r of purchaseLaborRows()){const box=document.getElementById('laborCalculation'+r.index);if(!box)continue;box.innerHTML=r.rate===null?'<p class="note blue">မယ်နှုန်းနှင့် မယ်ကို သတ်မှတ်ချက်ထဲမှ ရွေးပါ။</p>':row4('မယ်နှုန်း',cashText(r.rate)+' / မယ်')+row4('ရွေးထားသည့်မယ်',E(r.maelName||N(r.multiple)+' မယ်'))+row4('တစ်အိတ်လုပ်သားခ',N(r.rate)+' × '+N(r.multiple)+' = '+cashText(r.unitRate))+row4('စုစုပေါင်းလုပ်သားခ',N(r.unitRate)+' × '+N(r.bags)+' အိတ် = '+cashText(r.total));}
  const line=(name,amount,kind)=>`<div class="summary-line ts75-deduction" data-kind="${kind}"><span>${E(name)}</span><strong>− ${cashText(amount)}</strong></div>`;
  document.getElementById('tsPreview74').innerHTML=row4('စုစုပေါင်း ကုန်ဖိုး',cashText(s.gross))+'<h4 class="ts75-preview-label">ပေါင်းနုတ်ငွေတစ်ခုချင်း အသေးစိတ်</h4>'+line('ဝန်ဆောင်ခ / ပွဲခ'+(yes?' · '+N(c.rate)+'%':''),c.service,'service')+line('လုပ်သားခ',c.labor,'labor')+c.others.filter(x=>x.name).map((x,i)=>line(x.name,x.amount,'other-'+i)).join('')+c.recoveries.map(x=>line(x.name+' ပြန်နုတ်',x.amount,'recovery')).join('')+line('ကြိုသုံးငွေ ပြန်နုတ်',c.advance,'advance')+line('ကြိုထုတ်ငွေ အရင်းပြန်နုတ်',sum(c.loanPayments38,x=>x.principal),'loan-principal')+line('ကြိုထုတ်ငွေ အတိုးပေး',sum(c.loanPayments38,x=>x.interest),'loan-interest')+row4('စုစုပေါင်း နုတ်ငွေ',cashText(total))+row4('အသားတင် ပေးရန်',cashText(remaining))+row4('ယခု ပေးချေငွေ',cashText(pay))+row4('ပေးရန်ကျန်',cashText(round(remaining-pay)))+((remaining<0||pay>remaining)?'<p class="ts75-warning">နုတ်ငွေ သို့မဟုတ် ပေးချေငွေကို ပြန်စစ်ပါ။</p>':'');
  document.getElementById('tsInitialCheckWrap75').hidden=!(pay>0);
  document.getElementById('tsDuplicate75').textContent=duplicate75(s,c);
 };
 window.confirmTrader74=function(id){
  const form=document.getElementById('tsForm74'),s=record(id);
  if(!form||form.dataset.record!==id||!s||s.status==='confirmed'||!writable()||!validForm('tsForm74'))return;
  const c=readForm(s),date=value('tsDate74'),note=cleanText(value('tsNote74')),amount=number('tsInitialPaid75');
  if(!consistent(s)||!party(s)||!dateOK(date)||date<s.date||date>today())return error('မူရင်းအရောင်း၊ ကုန်သည်နှင့် ရက်စွဲကို ပြန်စစ်ပါ။');
  if(!['yes','no'].includes(c.mode)||c.mode==='yes'&&!rates().includes(c.rate))return error('ပွဲခ ရာခိုင်နှုန်းကို ရွေးပါ။');
  if(purchaseLaborRows().some(r=>!Number.isInteger(r.bags)||r.bags<0||r.bags>0&&(!r.active||r.rate===null||!Number.isFinite(r.rate)||r.rate<0||!(r.multiple>0)||!r.maelId)))return error('လုပ်သားခအတွက် မယ်နှုန်း၊ မယ်နှင့် အိတ်အရေအတွက်ကို ပြန်စစ်ပါ။');
  if(![c.service,c.labor,c.advance,amount,...c.others.map(x=>x.amount),...c.recoveries.map(x=>x.amount),...c.loanPayments38.flatMap(x=>[x.principal,x.interest])].every(validMoney)||c.others.some(x=>!safeLabel(x.name)||!manualRules75().some(r=>r.id===x.rateId)))return error('နုတ်ငွေအမျိုးအစားနှင့် သုညထက်မနည်းသော ငွေပမာဏများကို ပြန်စစ်ပါ။');
  for(const x of c.loanPayments38){const l=(state.supplierLoans38||[]).find(l=>l.id===x.loanId);if(!l||l.partnerId!==s.partnerId)return error('ကြိုထုတ်ငွေစာရင်း မကိုက်ပါ။');if(x.principal+x.interest>0){const b=loanBalance38(l,date);if(date<(l.payments?.at(-1)?.date||l.date)||date<b.last||x.principal>b.principal+.001||x.interest>b.interest+.001)return error('ကြိုထုတ်ငွေ အရင်း / အတိုး သို့မဟုတ် ရက်စွဲ မမှန်ပါ။ လက်ကျန်ထက် မပိုရပါ။');}}
  const duplicate=duplicate75(s,c);if(duplicate)return error(duplicate);
  if(c.advance>supplierBalance(s.partnerId)+.001)return error('ကြိုသုံးလက်ကျန်ထက် ပိုနုတ်၍ မရပါ။');
  for(const x of c.recoveries){const e=recoverable(s).find(e=>e.id===x.expenseId);if(x.amount>0&&(!e||x.amount>recoveryBalance(e)+.001))return error('စိုက်ထုတ်ငွေကို ပြန်နုတ်ပြီးဖြစ်သည် သို့မဟုတ် ကျန်ငွေထက် ပိုနေပါသည်။');}
  if(deductions(c)>s.gross+.001)return error('စုစုပေါင်းနုတ်ငွေသည် ကုန်ဖိုးထက် မကျော်ရပါ။');
  if(amount>round(s.gross-deductions(c))+.001)return error('ယခုပေးချေငွေသည် အသားတင်ပေးရန်ထက် မကျော်ရပါ။');
  if(!document.getElementById('tsCheck74').checked)return error('ပေါင်းနုတ်ငွေ၊ အသားတင်နှင့် ပေးချေငွေကို စစ်ပြီး အမှန်ခြစ်ပါ။');
  if(amount>0&&!document.getElementById('tsInitialCheck75').checked)return error('ကုန်သည်ထံ ယခုပေးချေငွေကို တကယ်ပေးချေပြီးကြောင်း အမှန်ခြစ်ပါ။');
  const splits=amount>0?splits4(amount,true):[];if(!splits||!splits.every(x=>validMoney(x.amount)))return;
  c.others=c.others.filter(x=>x.amount>0);c.recoveries=c.recoveries.filter(x=>x.amount>0);
  const token=form.dataset.token;
  if(!atomic(()=>{
   s.charges=c;s.status='confirmed';s.confirmedDate=date;s.note=note;s.confirmedBy=state.role;
   s.changes.push({date,amount:deductions(c),advance:c.advance});
   if(c.advance)s.advanceAllocations=allocateAdvance75(s,c.advance,date);
   if(c.loanTotal38)postLoanOffsets38([{id:s.id}],c,date,s.no);
   for(const x of c.recoveries){const e=state.expenses.find(e=>e.id===x.expenseId);(e.settlementRecoveries74??=[]).push({settlementId:s.id,date,amount:x.amount});if(sum(e.settlementRecoveries74,y=>y.amount)>=Number(e.amount)-.001){e.recovered=true;e.recoveredDate=date;}}
   if(amount>0){const payment={id:uid('TSPAY'),token,no:s.no+' / '+(s.payments.length+1),date,amount,splits,role:state.role};s.payments.push(payment);for(const x of splits)dateTxn(x.account,-x.amount,'ကုန်သည် ရောင်းပေးငွေရှင်း',payment.no,party(s)?.name||s.partnerId,date);}
   audit4(s.no+' ကုန်သည်ဘက် နုတ်ငွေ '+cashText(deductions(c))+'၊ ယခုပေးချေငွေ '+cashText(amount)+' အတည်ပြုခဲ့သည်။');
  }))return;
  workDirty=false;openTrader74(id);toast('ကုန်သည်ငွေရှင်း အတည်ပြုပြီးပါပြီ။ ပေါင်းနုတ်ငွေ၊ ပေးပြီးငွေနှင့် ပေးရန်ကျန် ချိတ်ထားပါပြီ။');
 };

 window.payTrader74=function(id){
  const s=record(id);if(!s||s.status!=='confirmed'||!consistent(s)||!(due74(s)>0)||!writable())return;
  if(!aOpts().length)return toast('ပေးချေရန် ကြည့်ခွင့်ရှိသော ငွေသိမ်းရာ မရှိပါ။',true);
  const token=uid('TSP74');
  openModal('ကုန်သည်ကို ငွေပေးချေမယ်',E(party(s)?.name||s.partnerId)+' · '+E(s.no),
   `<div class="summary-box mb">${row4('အသားတင်',cashText(net(s)))}${row4('ပေးပြီး',cashText(paid(s)))}${row4('ပေးရန်ကျန်',cashText(due74(s)))}</div>
    <form id="tsPayForm74" data-record="${E(id)}" data-token="${E(token)}" onsubmit="event.preventDefault();saveTraderPayment74('${id}')">
    ${field('ပေးချေရက်','tsPayDate74',{type:'date',value:today(),required:true,extra:`min="${E(s.confirmedDate)}" max="${E(today())}"`})}${field('ယခု ပေးချေငွေ','tsPayAmount74',{type:'number',min:.01,max:due74(s),step:.01,value:due74(s),required:true,suffix:'ကျပ်',extra:'oninput="syncTraderPayment74()"'})}${splitForm4()}
    <label class="account-permission68"><input id="tsPayCheck74" type="checkbox"><span>ကုန်သည်ထံ ငွေတကယ်ပေးချေပြီးပါပြီ။</span></label></form>`,
   btn('ပြန်မယ်',`openTrader74('${id}')`,'secondary')+btn('ပေးချေမှု သိမ်းမယ်',`saveTraderPayment74('${id}')`,'primary','check'));
  document.querySelector('#main .work-page')?.classList.add('ts74-work');
  addSplit4();const first=document.querySelector('#splitRows4 input[type="number"]');if(first)first.value=due74(s);
 };
 window.syncTraderPayment74=function(){const rows=document.querySelectorAll('#tsPayForm74 .req-split');if(rows.length===1){const input=rows[0].querySelector('input[type="number"]');if(input)input.value=value('tsPayAmount74');}};
 window.saveTraderPayment74=function(id){
  const form=document.getElementById('tsPayForm74'),s=record(id);
  if(!form||form.dataset.record!==id||!s||s.status!=='confirmed'||!writable()||!validForm('tsPayForm74'))return;
  const token=form.dataset.token,amount=number('tsPayAmount74'),date=value('tsPayDate74');
  if(s.payments.some(x=>x.token===token))return;
  if(!consistent(s)||!dateOK(date)||date<s.confirmedDate||date>today()||!validMoney(amount)||amount<=0||amount>due74(s)+.001)return error('ရက်စွဲနှင့် ပေးရန်ကျန်ငွေထက် မပိုသော ပေးချေငွေကို ပြန်စစ်ပါ။');
  if(!document.getElementById('tsPayCheck74').checked)return error('ငွေတကယ်ပေးချေပြီးကြောင်း အမှန်ခြစ်ပါ။');
  const splits=splits4(amount,true);if(!splits||!splits.every(x=>validMoney(x.amount)))return;
  const payment={token,no:s.no+' / '+(s.payments.length+1),date,amount,splits,role:state.role};
  if(!atomic(()=>{payment.id=uid('TSPAY');s.payments.push(payment);for(const x of splits)dateTxn(x.account,-x.amount,'ကုန်သည် ရောင်းပေးငွေရှင်း',payment.no,party(s)?.name||s.partnerId,date);audit4(payment.no+' '+cashText(amount)+' ပေးချေခဲ့သည်။');}))return;
  workDirty=false;openTrader74(id);toast('ပေးချေမှု သိမ်းပြီးပါပြီ။ ပေးရန်ကျန်နှင့် ငွေသိမ်းရာ လျော့ပြီးပါပြီ။');
 };
 window.printTrader74=function(id){const s=record(id);if(!s||s.status!=='confirmed')return;printDocument('ကုန်သည် ရောင်းပေးငွေရှင်းဘောက်ချာ',E(s.no),`<p>ကုန်သည် — <strong>${E(party(s)?.name||s.partnerId)}</strong></p><p>မူရင်းအရောင်း — ${E(s.saleVoucher)} · ငွေရှင်းတွက်ချက်ရက် — ${shortDate(s.confirmedDate)}</p>${sourceTable(s)}<section>${chargeRows(s)}</section><p>${E(s.note||'')}</p><h3>ပေးချေမှုမှတ်တမ်း</h3>${paymentRows(s,true)}`);};
 window.printTraderPayment74=function(id,paymentId){const s=record(id),p=s?.payments.find(p=>p.id===paymentId);if(!p)return;printDocument('ကုန်သည်ငွေ ပေးချေလက်မှတ်',E(p.no),`<p>ကုန်သည် — ${E(party(s)?.name||s.partnerId)}</p><p>အရောင်း — ${E(s.saleVoucher)} · ငွေရှင်း — ${E(s.no)}</p><p>ပေးချေရက် — ${shortDate(p.date)}</p>${row4('ယခု ပေးချေငွေ',cashText(p.amount))}<p>${splitDescription(p.splits)}</p>${row4('လက်ရှိ ပေးရန်ကျန်',cashText(due74(s)))}`);};
 // Same source state and same save: no separate cash or stock posting on settlement creation.
 const previousSave=save;
 save=function(){ensure();return previousSave();};
 const previousPayable=payableTotal;
 payableTotal=function(){return round(previousPayable()+traderDue74());};
 const previousCommit=commitVoucher4;
 commitVoucher4=function(){
  const kind=v4Kind,before=new Set((state.sales||[]).map(s=>s.id));const result=previousCommit();
  const fresh=(state.sales||[]).filter(s=>!before.has(s.id)&&s.sourceOwner==='supplier');
  if(kind==='sale'&&fresh.length){const found=records().filter(s=>s.saleIds.some(id=>fresh.some(x=>x.id===id)));if(found.length===1)openTrader74(found[0].id);else if(found.length)openTraderList74('',saleRef(fresh[0]));}
  return result;
 };
 const previousRows=renderSaleRows;
 renderSaleRows=function(){previousRows();document.querySelectorAll('#saleRows article').forEach(card=>{
  const attr=card.querySelector('[onclick*="saleDetail4"]')?.getAttribute('onclick'),id=attr?.match(/saleDetail4\('([^']+)'\)/)?.[1];
  const sale=state.sales.find(s=>s.id===id);if(!sale||card.querySelector('.ts74-sale-links'))return;
  const rs=records().filter(s=>s.saleVoucher===saleRef(sale));if(!rs.length)return;
  const box=document.createElement('div');box.className='ts74-sale-links row wrap mt';box.innerHTML=rs.map(s=>btn('ကုန်သည်ငွေရှင်း · '+(party(s)?.name||s.partnerId),`openTrader74('${s.id}')`,'secondary','doc')+`<span class="small muted">${E(status(s))} · ${cashText(due74(s))}</span>`).join('');card.appendChild(box);
 });};
 const previousDetail=saleDetail4;
 saleDetail4=function(id){previousDetail(id);const rs=voucherRecords4('sale',id),ids=new Set(rs.map(x=>x.id));const related=records().filter(s=>s.saleIds.some(x=>ids.has(x)));const root=document.querySelector('#main .modal-body');if(root&&related.length)root.insertAdjacentHTML('beforeend',`<section class="card ts74-panel mt"><h3>ကုန်သည်ဘက် သီးခြားငွေရှင်း</h3>${listHTML(related)}</section>`);};
 openSaleDetail=saleDetail4;
 const previousCash=renderCashBody;
 renderCashBody=function(){previousCash();if(cashTab==='payables'){const root=document.getElementById('cashBody');if(root){root.insertAdjacentHTML('beforeend',traderPanel74());const title=root.querySelector('.cash-debt-section .pill');if(title)title.textContent=cashText((state.receipts||[]).filter(r=>r.status==='purchased').reduce((n,r)=>n+due(r),0));}}};
 const previousList=partnerList;
 partnerList=function(){const root=document.createElement('div');root.innerHTML=previousList();root.querySelectorAll('.partner-row62').forEach(row=>{const attr=row.querySelector('[onclick*="openPartnerStatement62"]')?.getAttribute('onclick'),id=attr?.match(/openPartnerStatement62\('([^']+)'\)/)?.[1];if(id&&supplierBy(id)?.kind==='supplier'&&records().some(s=>s.partnerId===id))row.querySelector('.partner-actions62')?.insertAdjacentHTML('beforeend',btn('ရောင်းပေးငွေရှင်း',`openTraderList74('${id}')`,'secondary','wallet'));});return root.innerHTML;};
 const previousStatement=statementData4;
 statementData4=function(...args){const d=previousStatement(...args);if(!d||d.p.kind!=='supplier')return d;const events=traderEvents74(d.p.id);return {...d,opening:[...d.opening,...events.filter(x=>x.date<d.from)].sort((a,b)=>a.date.localeCompare(b.date)),selected:[...d.selected,...events.filter(x=>x.date>=d.from&&x.date<=d.to)].sort((a,b)=>a.date.localeCompare(b.date))};};
 window.buyerOther74=function(rows){
  const supplier=rows.filter(s=>s.sourceOwner==='supplier');if(!supplier.length)return 0;
  const c=rows.find(s=>s.charges4)?.charges4;if(c?.chargeTreatment67!=='add')return 0;
  const gross=sum(rows,s=>s.grossTotal??s.total),ratio=gross?sum(supplier,s=>s.grossTotal??s.total)/gross:0;
  return round(Math.max(0,(Number(c.total)||0)-(Number(c.serviceFee)||0)-(Number(c.advance)||0)-(Number(c.loanTotal38)||0))*ratio);
 };
 window.traderPnl74=function(){
  const rows=records().filter(s=>s.status==='confirmed'&&inOwnerDateRange(s.confirmedDate));
  return {rows,revenue:sum(rows,s=>fees(s.charges)),recoveries:sum(rows,s=>round((s.charges.advance||0)+sum(s.charges.recoveries,x=>x.amount)))};
 };
 window.traderPnlPanel74=function(){const x=traderPnl74();if(!x.rows.length)return '';return `<section class="pnl52-card"><h3>ကုန်သည်ဘက် အတည်ပြုပြီး ကောက်ခံခရငွေ</h3><p class="pnl52-note">အတည်ပြုရက်အလိုက် တွက်ထားပြီး အထက်ပါ Revenue တွင် တစ်ကြိမ်သာ ပါဝင်ပါသည်။ ယခင်ကြိုသုံးငွေ၊ စိုက်ထုတ်ငွေ ပြန်နုတ်မှုကို ရငွေအသစ်အဖြစ် မတွက်ပါ။</p>${table4(['ကုန်သည် / အရောင်း','ပွဲခ','လုပ်သားခ / အခြားအခ','ရငွေစုစုပေါင်း'],x.rows.map(s=>`<tr><td>${E(party(s)?.name||s.partnerId)} · ${E(s.saleVoucher)}<div>${shortDate(s.confirmedDate)}</div></td><td>${cashText(s.charges.service)}</td><td>${cashText(round(s.charges.labor+sum(s.charges.others,x=>x.amount)))}</td><td>${cashText(fees(s.charges))}</td></tr>`))}</section>`;};
 ensure();
 document.title='ပွဲရုံ · V75 Purchase-Style Trader Settlement';
})();

