
/* V52: report-only calculations: do NOT alter purchase/sale/cash/stock posting. */
(function(){
 'use strict';
 let view52='summary', filters52={product:'',trader:'',warehouse:''};
 const toNum=v=>Number.isFinite(Number(v))?Number(v):0;
 const positive=v=>Math.max(0,toNum(v));
 const amount52=v=>cashText(v);
 const saleOwner52=s=>s.sourceOwner==='supplier'?'supplier':'owned';
 const saleTrader52=s=>s.originPartnerName||s.sourceSupplierName||(s.sourceOwner==='supplier'?'မူလကုန်သည်မသိ':'မူလကုန်သည်မသတ်မှတ်ရသေး')
 const saleBatch52=s=>s.sourceReceiptNo||s.originReceiptNo||s.batch||'—';
 const saleRef52=s=>String(s.voucherNo||s.no||s.id);
 const purchaseRef52=r=>String(r.purchaseNo||r.voucherNo||r.no||r.id);
 const el52=(v,caption='')=>`<span class="pnl52-figure">${amount52(v)}</span>${caption?`<div class="sub">${E(caption)}</div>`:''}`;
 function saleCharges52(c){
   if(!c)return [];
   const known=[['ဝန်ဆောင်ခ','serviceFee'],['လုပ်သားခ','labor'],['ကားခ','truck'],['သန့်စင်ခ','clean'],['အိတ်ဖိုး / ပလတ်စတစ်','plastic'],['အိတ်ဖိုး','sack'],['ကြိုသုံးငွေ','advance'],['ချေးငွေပြန်နုတ်','loanTotal38']];
   const result=known.map(([name,key])=>({name,key,amount:positive(c[key])})).filter(x=>x.amount>0);
   (c.dynamicRows||c.deductionRows||[]).forEach((r,i)=>{
     if(positive(r.amount))result.push({name:String(r.name||'နုတ်ငွေ'),key:'dynamic:'+i,amount:positive(r.amount)});
   });
   // Older vouchers may not contain the detail fields even though their deduction total was saved.
   const counted=result.reduce((n,x)=>n+x.amount,0),total=positive(c.total);
   if(total>counted+.01)result.push({name:'မခွဲခြားရသေးသော နုတ်ငွေ',key:'undisclosed',amount:total-counted});
   return result;
 }
 function build52(){
   const allSales=(state.sales||[]).filter(s=>inOwnerDateRange(s.date));
   const allExpenses=(state.expenses||[]).filter(e=>inOwnerDateRange(e.date));
   const saleGroups=new Map(),purchaseGroups=new Map();
   for(const s of allSales){const k=saleRef52(s);if(!saleGroups.has(k))saleGroups.set(k,[]);saleGroups.get(k).push(s);}
   for(const r of state.receipts||[]){
     if(r.status!=='purchased'||!inOwnerDateRange(r.purchaseDate||r.date))continue;
     const k=purchaseRef52(r);if(!purchaseGroups.has(k))purchaseGroups.set(k,[]);purchaseGroups.get(k).push(r);
   }
   const sales=[],reviews=[];
   let ownedRevenue=0,serviceRevenue=0,saleServiceRevenue=0,purchaseServiceRevenue=0,cogs=0,supplierGross=0,unclassified=0,advanceOffsets=0,unknownCosts=0;
   for(const [voucher,group] of saleGroups){
     const c=(group.find(s=>s.charges4)||{}).charges4;
     const lineItems=group.map(s=>{
       const gross=s.grossTotal!=null?toNum(s.grossTotal):toNum(s.total);
       const net=toNum(s.total),ownership=saleOwner52(s);
       const cost=ownership==='owned'?toNum(s.cost):0;
       if(ownership==='owned'){ownedRevenue+=gross;cogs+=cost;if(s.cost==null||(cost===0&&positive(gross)>0)){unknownCosts++;reviews.push({date:s.date,voucher,type:'ဝယ်ရင်းစစ်ဆေးရန်',description:(s.product||'ကုန်')+' ၏ အရောင်းဝယ်ရင်း 0 သို့မဟုတ် မသိမ်းထား',amount:gross});}}
       else supplierGross+=gross;
       return {s,ownership,gross,net,cost,qty:toNum(s.qty),voucher};
     });
     const charges=saleCharges52(c);
     const supplierValue=lineItems.filter(x=>x.ownership==='supplier').reduce((n,x)=>n+positive(x.gross),0);
     const grossValue=lineItems.reduce((n,x)=>n+positive(x.gross),0);
     const supplierRatio=grossValue>0?supplierValue/grossValue:0;
     // Only the explicitly labelled service fee on trader-owned sales is a recognizable fee.
     // This treatment remains provisional until fee ownership is confirmed by the client.
     const explicitlyCharged=!!(c?.serviceFeeTaken58&&positive(c.serviceRateValue)>0)?positive(c.serviceFee):0;
     // A charge on Pwe Yon-owned merchandise is already part of its gross sales;
     // only the trader-owned portion can be added as separate service revenue without double counting.
     const service=Math.round(explicitlyCharged*supplierRatio);
     serviceRevenue+=service;saleServiceRevenue+=service;
     const otherRevenue74=globalThis.buyerOther74?.(group)||0;serviceRevenue+=otherRevenue74;saleServiceRevenue+=otherRevenue74;
     if(explicitlyCharged>service+.01)reviews.push({date:group[0].date,voucher,type:'ဝန်ဆောင်ခအမျိုးအစား စစ်ဆေးရန်',description:'ပွဲရုံပိုင်ကုန်အပေါ် ဝန်ဆောင်ခကို Gross Sales ထဲ ထည့်ထားပြီးဖြစ်၍ Revenue ထပ်မတိုးထားပါ',amount:explicitlyCharged-service});
     if(positive(c?.serviceFee)>0&&!c?.serviceFeeTaken58)reviews.push({date:group[0].date,voucher,type:'Legacy Service Fee',description:'ဝန်ဆောင်ခတကယ်ယူခဲ့ကြောင်း အတည်မပြုရသေး၍ Revenue အဖြစ်မတင်',amount:positive(c.serviceFee)});
     for(const x of lineItems){if(!(x.s.originPartnerId||x.s.sourceSupplierId)||!x.s.sourceReceiptId){reviews.push({date:x.s.date,voucher,type:'Legacy Batch / Trader',description:'မူလကုန်သည် သို့မဟုတ် ကုန်လက်ခံအသုတ် ID မပြည့်စုံ — အလိုအလျောက်ခန့်မှန်းမထည့်ပါ',amount:0});}}
     const bookDeductions=lineItems.reduce((n,x)=>n+Math.max(0,x.gross-x.net),0);
     const settlementOffsets=charges.filter(x=>['advance','loanTotal38'].includes(x.key)).reduce((n,x)=>n+x.amount,0);
     advanceOffsets+=settlementOffsets;
     const pending=Math.max(0,bookDeductions-explicitlyCharged-settlementOffsets);
     unclassified+=pending;
     if(pending>.01)reviews.push({date:group[0].date,voucher,type:'အရောင်းနုတ်ငွေ',description:'ယာယီစိုက်ထုတ်/ပြန်နုတ်ငွေ — P&L တွင် မထည့်ထား',amount:pending});
     if(service>0)reviews.push({date:group[0].date,voucher,type:'ဝန်ဆောင်ခ ယူပြီး',description:'ကုန်သည်ပိုင်ကုန်၏ သီးခြား Service Fee — တစ်ကြိမ်သာ Revenue တွက်ထား',amount:service});
     sales.push({voucher,date:group[0].date,buyer:group[0].name||'—',lines:lineItems,charges,service:service+otherRevenue74,pending,advances:settlementOffsets,ownedRevenue:lineItems.filter(x=>x.ownership==='owned').reduce((n,x)=>n+x.gross,0),supplierGross:supplierValue,cost:lineItems.reduce((n,x)=>n+x.cost,0)});
   }
   let purchaseUnclassified=0;
   for(const [voucher,group] of purchaseGroups){
     const c=(group.find(r=>r.charges4)||{}).charges4;
     if(!c)continue;
     const charges=saleCharges52(c);
     const charged=!!(c.serviceFeeTaken58&&positive(c.serviceRateValue)>0)?positive(c.serviceFee):0;
     if(charged>0){purchaseServiceRevenue+=charged;serviceRevenue+=charged;}
     if(positive(c.serviceFee)>0&&!c.serviceFeeTaken58)reviews.push({date:group[0].purchaseDate||group[0].date,voucher,type:'Legacy Purchase Fee',description:'ဝန်ဆောင်ခ ယူခဲ့/မယူခဲ့ မသေချာသဖြင့် P&L Revenue မတွက်',amount:positive(c.serviceFee)});
     const amount=charges.filter(x=>!['advance','loanTotal38'].includes(x.key)&&!(x.key==='serviceFee'&&charged>0)).reduce((n,x)=>n+x.amount,0);
     if(amount>.01){purchaseUnclassified+=amount;reviews.push({date:group[0].purchaseDate||group[0].date,voucher,type:'အဝယ်နုတ်ငွေ',description:'နုတ်ငွေများကို ယာယီစိုက်ထုတ်/ပြန်ရှင်းငွေအဖြစ် P&L မှဖယ်ထား',amount});}
   }
   const expMap=new Map();let operatingExpenses=0,excludedExpenses=0;
   const expenseRows=allExpenses.map(e=>{
     const amount=positive(e.amount),excluded=!!(e.recoverable||e.paymentPending);
     const reason=String(e.reason||e.title||'အမျိုးအစားမသတ်မှတ်ရသေး');
     if(excluded)excludedExpenses+=amount;else {operatingExpenses+=amount;expMap.set(reason,(expMap.get(reason)||0)+amount);}
     return {e,reason,amount,excluded};
   });
   for(const lot of state.lots||[]){
     if(!['owned','supplier'].includes(lot.owner)||!(positive(lot.qty)>0))continue;
     if(!(lot.receiptId||lot.originReceiptNo)&&!(lot.originPartnerId||lot.partnerId||lot.sourceSupplierId)){
       reviews.push({date:today(),voucher:String(lot.batch||lot.id||'Legacy Lot'),type:'Legacy Stock / Trader',description:'လက်ရှိ Stock တွင် မူလကုန်သည် / ကုန်လက်ခံ Batch ID မပြည့်စုံ။ Data မပြင်ဘဲ Review အတွက်သာ ပြသည်။',amount:0});
     }
   }
   const cashAdvances=allExpenses.filter(e=>e.recoverable&&!e.paymentPending);
   const cashAdvanced52=cashAdvances.reduce((n,e)=>n+positive(e.amount),0);
   const cashRecovered52=cashAdvances.reduce((n,e)=>n+(e.recovered?positive(e.amount):(e.settlementRecoveries74||[]).reduce((a,x)=>a+positive(x.amount),0)),0);
   const cashOutstanding52=Math.max(0,cashAdvanced52-cashRecovered52);
   const pendingNotPaid52=allExpenses.filter(e=>e.paymentPending).reduce((n,e)=>n+positive(e.amount),0);
   const traderFees74=globalThis.traderPnl74?.()||{revenue:0,recoveries:0};serviceRevenue+=traderFees74.revenue;
   const grossProfit=ownedRevenue+serviceRevenue-cogs,netProfit=grossProfit-operatingExpenses;
   const funding=(state.cashIns50||[]).filter(x=>x.type==='external'&&x.status!=='reversed'&&inOwnerDateRange(x.date));
   const fundingTotal=funding.reduce((n,x)=>n+positive(x.amount),0);
   return {traderFees74,sales,expenseRows,expenseCategories:[...expMap].sort((a,b)=>b[1]-a[1]),reviews,ownedRevenue,serviceRevenue,saleServiceRevenue,purchaseServiceRevenue,cashAdvanced52,cashRecovered52,cashOutstanding52,pendingNotPaid52,cogs,supplierGross,unclassified,advanceOffsets,purchaseUnclassified,unknownCosts,operatingExpenses,excludedExpenses,grossProfit,netProfit,fundingTotal,fundingCount:funding.length};
 }
 function reportRow52(label,v,extra=''){
   return `<div class="pnl52-line ${extra}"><span>${label}</span><strong>${E(amount52(v))}</strong></div>`;
 }
 function gridTable52(headers,body,placeholder){
   return body.length?`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody></table></div>`:empty(placeholder||'ဤကာလအတွင်း မှတ်တမ်းမရှိပါ။');
 }
 function details52(x){
   const allLines=x.sales.flatMap(g=>g.lines);
   const products=[...new Set(allLines.map(l=>l.s.product))].filter(Boolean).sort();
   const traders=[...new Set(allLines.map(l=>saleTrader52(l.s)))].filter(Boolean).sort();
   const warehouses=[...new Set(allLines.map(l=>l.s.warehouse||''))].filter(Boolean).sort();
   const choose=(label,key,values)=>`<label>${label}<select aria-label="${label}" onchange="setPnL52Filter('${key}',this.value)"><option value="">အားလုံး</option>${values.map(v=>`<option value="${E(v)}" ${filters52[key]===v?'selected':''}>${E(v)}</option>`).join('')}</select></label>`;
   return `<div class="pnl52-filters">${choose('ကုန်ပစ္စည်း','product',products)}${choose('ကုန်သည် / မူလကုန်ရှင်','trader',traders)}${choose('ဂိုဒေါင်','warehouse',warehouses)}${smallbtn('Filter ဖယ်မယ်','resetPnL52Filters()','secondary')}</div>`;
 }
 function filteredLines52(x){return x.sales.flatMap(g=>g.lines).filter(l=>(!filters52.product||l.s.product===filters52.product)&&(!filters52.trader||saleTrader52(l.s)===filters52.trader)&&(!filters52.warehouse||(l.s.warehouse||'')===filters52.warehouse));}
 function productView52(x){
   const map=new Map();
   for(const l of filteredLines52(x)){
     const key=l.s.product+'\u0000'+l.ownership,v=map.get(key)||{product:l.s.product,owner:l.ownership,qty:0,ownedGross:0,supplierGross:0,cost:0,fee:0};
     v.qty+=l.qty;v.cost+=l.cost;
     if(l.ownership==='owned')v.ownedGross+=l.gross;else v.supplierGross+=l.gross;
     const g=x.sales.find(a=>a.voucher===l.voucher);
     const sumSupplierGross=g?.lines.filter(a=>a.ownership==='supplier').reduce((n,a)=>n+Math.max(0,a.gross),0)||0;
     if(l.ownership==='supplier'&&sumSupplierGross>0)v.fee+=g.service*Math.max(0,l.gross)/sumSupplierGross;
     map.set(key,v);
   }
   const rows=[...map.values()].sort((a,b)=>a.product.localeCompare(b.product)||a.owner.localeCompare(b.owner)).map(a=>`<tr><td><strong>${E(a.product)}</strong><div class="sub">${a.owner==='owned'?'ပွဲရုံပိုင်':'ကုန်သည်ပိုင်'}</div></td><td class="right pnl52-figure">${vissText37(a.qty)}</td><td class="right">${el52(a.ownedGross)}</td><td class="right">${el52(a.supplierGross)}</td><td class="right">${el52(a.cost)}</td><td class="right">${el52(a.fee)}</td><td class="right">${el52(a.ownedGross+a.fee-a.cost)}</td></tr>`);
   return `<section class="pnl52-card"><h3>ကုန်ပစ္စည်း / ပိုင်ဆိုင်မှုအလိုက်</h3>${details52(x)}${note('ကုန်သည်ပိုင်ကုန်၏ ကုန်ရောင်းတန်ဖိုးကို ပွဲရုံ Revenue အဖြစ် မတွက်ပါ။ ဝန်ဆောင်ခ ယူမည်ဟု အတည်ပြုထားသောကုန်သည်ပိုင်အရောင်းအတွက်သာ သီးခြား Service Revenue တွက်ပါသည်။ အခြားစိုက်ထုတ်/ပြန်နုတ်ငွေများကို P&L မှ ဖယ်ထားသည်။','blue')}${gridTable52(['ကုန် / ပိုင်ဆိုင်မှု','ပိဿာ','ပွဲရုံရောင်းတန်ဖိုး','ကုန်သည်ပိုင်ရောင်းတန်ဖိုး (ဖယ်)','ဝယ်ရင်း','Service Fee','အကြမ်းအမြတ်'],rows,'ရွေးထားသော Filter အတွက် အရောင်းမရှိပါ။')}</section>`;
 }
 function voucherView52(x){
   const lines=filteredLines52(x).sort((a,b)=>b.s.date.localeCompare(a.s.date));
   const rows=lines.map(l=>`<tr><td>${E(l.s.date)}<div class="sub">${E(l.voucher)}</div></td><td><strong>${E(l.s.name||'—')}</strong><div class="sub">${l.ownership==='owned'?'ပွဲရုံပိုင်':'ကုန်သည်ပိုင်'}</div></td><td>${E(l.s.product)}<div class="sub">${E(saleTrader52(l.s))}</div></td><td>${E(l.s.warehouse||'—')}<div class="sub">${E(saleBatch52(l.s))}</div></td><td class="right pnl52-figure">${vissText37(l.qty)}</td><td class="right">${el52(l.gross)}</td><td class="right">${el52(l.cost)}</td><td class="right">${el52(l.net)}</td><td class="right">${smallbtn('ကြည့်',`openSaleDetail('${E(l.s.id)}')`,'secondary','eye')}</td></tr>`);
   const visibleGroups=x.sales.filter(g=>g.lines.some(l=>lines.includes(l)));
   const chargeRows=visibleGroups.map(g=>`<tr><td>${E(g.date)} · ${E(g.voucher)}</td><td>${el52(g.ownedRevenue)}</td><td>${el52(g.supplierGross)}</td><td>${el52(g.service)}</td><td>${el52(g.pending)}</td><td>${el52(g.advances)}</td></tr>`);
   const itemRows=visibleGroups.flatMap(g=>g.charges.map(c=>`<tr><td>${E(g.date)}<div class="sub">${E(g.voucher)}</div></td><td>${E(c.name)}</td><td class="right">${el52(c.amount)}</td><td>${['advance','loanTotal38'].includes(c.key)?pill('Settlement — P&L ဖယ်','blue'):c.key==='serviceFee'&&g.service>0?pill('ဝန်ဆောင်ခ ယူပြီး (Revenue)','blue'):pill('စစ်ဆေးရန်','amber')}</td></tr>`));
   return `<section class="pnl52-card"><h3>အရောင်း Voucher / မူလအသုတ်အလိုက်</h3>${details52(x)}${gridTable52(['ရက် / Voucher','ဝယ်သူ / ပိုင်ဆိုင်မှု','ကုန် / ကုန်သည်','ဂိုဒေါင် / အသုတ်','ပိဿာ','Gross','ဝယ်ရင်း','Net Settlement','Detail'],rows,'ရွေးထားသော Filter အတွက် Voucher မရှိပါ။')}</section><section class="pnl52-card"><h3>Voucher နုတ်ငွေ ပြန်လည်စစ်ဆေးရန်</h3>${gridTable52(['Voucher','ပွဲရုံပိုင်ရောင်းတန်ဖိုး','ကုန်သည်ပိုင်ကုန်ဖိုး (ဖယ်)','Service Fee','အမျိုးအစားမသတ်မှတ်ရသေး','ကြိုသုံး/ချေးငွေနုတ်'],chargeRows,'နုတ်ငွေမှတ်တမ်း မရှိပါ။')}</section><section class="pnl52-card"><h3>နုတ်ငွေအမျိုးအစားတစ်ခုချင်းစီ</h3>${gridTable52(['Voucher / ရက်စွဲ','နုတ်ငွေအမည်','ပမာဏ','P&L Treatment'],itemRows,'နုတ်ငွေအသေးစိတ် မရှိပါ။')}</section>`;
 }
 function expenseView52(x){
   const groupRows=x.expenseCategories.map(([reason,sum])=>`<tr><td><strong>${E(reason)}</strong></td><td class="right">${el52(sum)}</td><td>Operating Expense</td></tr>`);
   const entries=x.expenseRows.slice().reverse().map(z=>`<tr><td>${E(z.e.date||'—')}</td><td><strong>${E(z.reason)}</strong><div class="sub">${E(z.e.ref||z.e.receiptId||z.e.id||'—')}</div></td><td>${E(z.e.account||'—')}</td><td class="right">${el52(z.amount)}</td><td>${z.excluded?pill('ပြန်ရရန် / ယာယီစိုက်','amber'):pill('Operating Expense')}</td></tr>`);
   return `<section class="pnl52-card"><h3>အသုံးစရိတ် အမျိုးအစားအလိုက် (Expense Reason)</h3>${note('လက်ရှိ Expense Reason ကို အမျိုးအစားခွဲထားပါသည်။ Cash In COA သည် ရင်းနှီးငွေ/ချေးငွေ/Transfer အတွက်ဖြစ်သောကြောင့် Expense COA အဖြစ် မယူထားပါ။','blue')}${gridTable52(['Expense Reason','အမှန်တကယ်အသုံးစရိတ်','P&L Category'],groupRows,'ပွဲရုံခံအသုံးစရိတ်မရှိပါ။')}</section><section class="pnl52-card"><h3>အသုံးစရိတ် Voucher အသေးစိတ်</h3>${gridTable52(['ရက်စွဲ','အကြောင်းအရာ / Ref','ငွေသိမ်းရာ','ပမာဏ','P&L Status'],entries,'အသုံးစရိတ်မှတ်တမ်း မရှိပါ။')}</section>`;
 }
 function reviewView52(x){
   const rows=x.reviews.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(r=>`<tr><td>${E(r.date||'—')}</td><td><strong>${E(r.voucher)}</strong><div class="sub">${E(r.type)}</div></td><td>${E(r.description)}</td><td class="right">${el52(r.amount)}</td></tr>`);
   return `<section class="pnl52-card"><h3>Accounting Review & Exceptions</h3>${note('အောက်ပါစာရင်းသည် Profit & Loss ထဲ မထည့်သေးသော နုတ်ငွေများနှင့် အတည်ပြုရန်လိုသော ဝန်ဆောင်ခများဖြစ်သည်။ အရောင်း/အဝယ် Save Logic မပြောင်းထားပါ။','amber')}${gridTable52(['ရက်စွဲ','Voucher / အမျိုးအစား','ပြန်လည်စစ်ဆေးရန်','ပမာဏ'],rows,'ဤကာလအတွက် Review Item မရှိပါ။')}</section>`;
 }
 function summary52(x){
   const margin=x.ownedRevenue+x.serviceRevenue>0?100*x.netProfit/(x.ownedRevenue+x.serviceRevenue):0;
   const revenue=x.ownedRevenue+x.serviceRevenue;
   return `<section class="pnl52-card"><h3>Profit & Loss Statement — ${E(ownerRangeText())}</h3>`+
     reportRow52('A. ပွဲရုံပိုင်ကုန် အရောင်းတန်ဖိုး (Gross)',x.ownedRevenue)+
     reportRow52('ပွဲခနှင့် ကောက်ခံခရငွေ (အဝယ် + နှစ်ဘက်အရောင်း)',x.serviceRevenue,'sub')+
     reportRow52('စုစုပေါင်း Revenue',revenue,'heading')+
     reportRow52('B. Cost of Goods Sold — အရောင်းမှတ်တမ်းတွင် သိမ်းထားသောဝယ်ရင်း',-x.cogs)+
     reportRow52('Gross Profit',x.grossProfit,'heading')+
     reportRow52('C. Operating Expenses (ပြန်ရမည့်ငွေများဖယ်)',-x.operatingExpenses)+
     reportRow52('Net Profit / Loss (ယာယီ)',x.netProfit,'final')+
     `<p class="pnl52-note mt">Net Margin (ယာယီ) — ${Number.isFinite(margin)?N(margin):'0'}% · ရှင်းလင်းရမည့်နုတ်ငွေများရှိလျှင် အတည်ပြု Profit/Loss မဟုတ်သေးပါ။</p></section>`+
     `<section class="pnl52-card"><h3>မရောတွက်သည့် ငွေများ</h3>`+
     reportRow52('ကုန်သည်ပိုင်ကုန် အရောင်းတန်ဖိုး (ပွဲရုံဝင်ငွေမဟုတ်)',x.supplierGross)+
     reportRow52('အရောင်း နုတ်ငွေ (ယာယီစိုက်/ပြန်ရရန်)' ,x.unclassified)+
     reportRow52('အဝယ် နုတ်ငွေ (ယာယီစိုက်/ပြန်ရရန်)' ,x.purchaseUnclassified)+
     reportRow52('ကြိုသုံးငွေ / ချေးငွေ Settlement နုတ်ငွေ',x.advanceOffsets)+
     reportRow52('ယာယီစိုက်ထုတ် / ပြန်ရရန် Expense',x.excludedExpenses)+
     reportRow52('ငွေတကယ်စိုက်ထုတ်ပြီး (Cash Out)',x.cashAdvanced52)+
     reportRow52('စိုက်ထုတ်ငွေ ပြန်ရှင်းပြီး',x.cashRecovered52)+
     reportRow52('ငွေပြန်ရရန် ကျန် (Cash Out အခြေခံ)',x.cashOutstanding52,'heading')+
     reportRow52('ငွေမထုတ်ရသေးသော Voucher placeholder (Cash Out မဟုတ်)',x.pendingNotPaid52)+
     reportRow52('Cash In — ပြင်ပငွေဖြည့်မှု (Revenue မဟုတ်)',x.fundingTotal)+
     `<div class="mt">${note('စိုက်ထုတ်ငွေ Outstanding သည် ငွေတကယ်ထွက်သော Expense Record များအပေါ်သာတွက်ထားသည်။ Voucher မှာ အလိုအလျောက်ပေါ်သော Placeholder ကို Cash Out လို့ မယူပါ။ Internal Transfer၊ Loan Principal နှင့် Owner Capital များကို P&L ထဲမထည့်ပါ။','blue')}</div></section>`;
 }
 window.setPnL52View=function(v){if(!['summary','product','voucher','expense','review'].includes(v))return;view52=v;render();};
 window.setPnL52Filter=function(k,v){if(!(k in filters52))return;filters52[k]=v;render();};
 window.resetPnL52Filters=function(){filters52={product:'',trader:'',warehouse:''};render();};
 window.printPnL52=function(){
   const x=build52();printDocument('Profit & Loss Report (ယာယီ)',ownerRangeText(),`<p>ဝယ်ရင်း၊ ကုန်သည်ပိုင်ကုန် နုတ်ငွေ/Service Fee Classification အတည်ပြုရန်ကျန်ပါသည်။</p><table><thead><tr><th>အကြောင်းအရာ</th><th>ကျပ်</th></tr></thead><tbody>${[['ပွဲရုံပိုင်ကုန် အရောင်း',x.ownedRevenue],['Confirmed commission and charges',x.serviceRevenue],['ကုန်သည်ဘက် ကောက်ခံခ (အထက်တွင်ပါပြီး)',x.traderFees74.revenue],['ရောင်းကုန်ဝယ်ရင်း',-x.cogs],['လုပ်ငန်းအသုံးစရိတ်',-x.operatingExpenses],['Net Profit / Loss (ယာယီ)',x.netProfit],['မခွဲခြားရသေးသော အရောင်းနုတ်ငွေ',x.unclassified],['မခွဲခြားရသေးသော အဝယ်နုတ်ငွေ',x.purchaseUnclassified],['တကယ်စိုက်ထုတ်ထားငွေ',x.cashAdvanced52],['ပြန်ရှင်းပြီးငွေ (လက်ရှိ Status)',x.cashRecovered52],['ပြန်ရရန်လက်ကျန် (လက်ရှိ Status)',x.cashOutstanding52]].map(([name,amount])=>`<tr><td>${E(name)}</td><td style="text-align:right">${E(amount52(amount))}</td></tr>`).join('')}</tbody></table>`);
 };
 window.exportPnL52CSV=function(){
   const x=build52(),rows=[['Profit & Loss Report (Provisional)',ownerRangeText()],['Description','Amount MMK'],['Owned goods gross sales',x.ownedRevenue],['Confirmed commission and charges recorded as revenue',x.serviceRevenue],['Trader-side confirmed charges included above',x.traderFees74.revenue],['Cost of goods sold',-x.cogs],['Operating expenses',-x.operatingExpenses],['Net profit/loss (provisional)',x.netProfit],['Unclassified sale deductions',x.unclassified],['Unclassified purchase deductions',x.purchaseUnclassified],['Cash advances actually paid',x.cashAdvanced52],['Cash advances recovered',x.cashRecovered52],['Cash advances outstanding',x.cashOutstanding52],['Voucher placeholders not paid',x.pendingNotPaid52],['Trader-owned gross excluded',x.supplierGross],['External cash funding excluded',x.fundingTotal],[],['Date','Voucher','Buyer','Ownership','Product','Trader','Warehouse','Batch','Viss','Gross','COGS','Net settlement']];
   for(const l of filteredLines52(x))rows.push([l.s.date,l.voucher,l.s.name,l.ownership,l.s.product,saleTrader52(l.s),l.s.warehouse||'',saleBatch52(l.s),l.qty,l.gross,l.cost,l.net]);
   rows.push([],['Expense Date','Reason','Amount','Excluded']);
   for(const z of x.expenseRows)rows.push([z.e.date,z.reason,z.amount,z.excluded?'Yes':'No']);
   rows.push([],['Review Date','Voucher','Review Type','Description','Amount']);
   for(const r of x.reviews)rows.push([r.date,r.voucher,r.type,r.description,r.amount]);
   const csv='\ufeff'+rows.map(r=>r.map(cell=>{let t=String(cell??'');if(/^[=+@\t\r]/.test(t)||(/^-/.test(t)&&!/^-[0-9]+(?:\.[0-9]+)?$/.test(t)))t="'"+t;return '"'+t.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');
   const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='PweYon_Profit_Loss_'+ownerDateFrom+'_'+ownerDateTo+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 window.profitPage=function(){
   const x=build52();const warnings=x.unknownCosts||x.unclassified>.01||x.purchaseUnclassified>.01||x.reviews.some(r=>/Legacy|စစ်ဆေးရန်/.test(r.type));
   const tabs=[['summary','P&L Summary'],['product','ကုန်ပစ္စည်းအလိုက်'],['voucher','Voucher Detail'],['expense','Expense Detail'],['review','စစ်ဆေးရန်']];
   const html=heading('ပိုင်ရှင်အတွက်','Profit & Loss Report','အရောင်း၊ မူလအသုတ်၊ ကုန်ရင်းနှင့် လုပ်ငန်းအသုံးစရိတ်အလိုက် အသေးစိတ်။',pill('ယာယီ Report','amber'))+
      ownerDateFilterBar('P&L Summary သည် ကာလအတွင်း လုပ်ငန်းတစ်ခုလုံးအတွက် ဖြစ်ပြီး Product/Trader/Warehouse Filter သည် Detail Table များကိုသာ သက်ရောက်ပါသည်။')+
      `<div id="pnl52"><div class="pnl52-alerts">${note('အရောင်းမှတ်တမ်းအတွင်းရှိ အမှန်တကယ်သိမ်းထားသော Cost ကို အသုံးပြုထားပြီး ခန့်မှန်းဝယ်ရင်း မထည့်ထားပါ။ ကုန်သည်ပိုင်ကုန် Gross ကို Revenue မတွက်ပါ။', 'blue')}`+
      (warnings?note(`ယာယီ Profit/Loss ဖြစ်ပါသည်။ ဝယ်ရင်းမရှိ/0 ဖြစ်သည့် ပွဲရုံပိုင်အရောင်း ${N(x.unknownCosts)} လိုင်း၊ အရောင်းနုတ်ငွေ ${amount52(x.unclassified)}၊ အဝယ်နုတ်ငွေ ${amount52(x.purchaseUnclassified)} နှင့် ကုန်သည်ပိုင် Service Fee ကို သက်ဆိုင်ရာစာရင်းကိုင်စည်းမျဉ်းအတိုင်း အတည်ပြုရန် လိုအပ်ပါသည်။`,'amber'):'')+
      `</div><div class="pnl52-metrics">`+
      `<div class="pnl52-metric"><span>Revenue (ပွဲရုံပိုင် + ပွဲခနှင့် ကောက်ခံခ)</span><strong>${amount52(x.ownedRevenue+x.serviceRevenue)}</strong><small>${ownerRangeText()}</small></div>`+
      `<div class="pnl52-metric"><span>Cost of Goods Sold</span><strong>${amount52(x.cogs)}</strong><small>ပွဲရုံပိုင်ကုန်သာ</small></div>`+
      `<div class="pnl52-metric"><span>Operating Expenses</span><strong>${amount52(x.operatingExpenses)}</strong><small>ယာယီစိုက်ငွေ မပါ</small></div>`+
      `<div class="pnl52-metric ${x.netProfit<0?'negative':''}"><span>Net Profit / Loss (ယာယီ)</span><strong>${amount52(x.netProfit)}</strong><small>${x.netProfit<0?'အရှုံး':'အမြတ်'}</small></div></div>`+
      `<div class="pnl52-top"><div class="pnl52-tabs">${tabs.map(([k,t])=>`<button type="button" class="${view52===k?'active':''}" onclick="setPnL52View('${k}')">${t}</button>`).join('')}</div><div class="pnl52-actions">${smallbtn('Excel CSV','exportPnL52CSV()','secondary','doc')}${smallbtn('Print / PDF','printPnL52()','secondary','print')}</div></div>`+
      (view52==='summary'?summary52(x):view52==='product'?productView52(x):view52==='voucher'?voucherView52(x):view52==='expense'?expenseView52(x):reviewView52(x))+
      (globalThis.traderPnlPanel74?.()||'')+
      `<p class="pnl52-note">V74 · ကုန်သည်ဘက် အတည်ပြုပြီးအခများနှင့် ဝယ်သူဘက် ကောက်ခံခများကို သီးခြားတစ်ကြိမ်စီတွက်သည်။ V52 Report-only update · Cash In, Bank Transfer, Purchase, Sales, Stock, Packaging နှင့် ဘောက်ချာသိမ်းဆည်းမှု Logic များကို မပြောင်းထားပါ။</p></div>`;
   return html;
 };
 document.title='ပွဲရုံ · V52 Detailed Profit & Loss';
})();
