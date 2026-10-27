
/* V6.2 — Partner / Buyer individual detail ledger. */
(function(){
  const setupView62Base=setupView;
  const partnerList62Base=partnerList;
  const pd62={id:'',tab:'all',range:'all',from:'',to:''};

  function p62(){return (state.masters?.partners||[]).find(x=>x.id===pd62.id);}
  function wh62(id){try{return typeof W==='function'?W(id):(state.warehouses||[]).find(w=>w.id===id)?.name||id||'—';}catch(e){return id||'—';}}
  function acc62(id){return (state.masters?.accounts||[]).find(a=>a.id===id)?.name||ACCOUNT_NAMES[id]||id||'—';}
  function d62(v){return v&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:today();}
  function minusDays62(dateStr,n){const d=new Date(dateStr+'T12:00:00');d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);}
  function monthStart62(dateStr){return String(dateStr).slice(0,8)+'01';}
  function inRange62(date){date=d62(date);if(pd62.range==='all')return true;return (!pd62.from||date>=pd62.from)&&(!pd62.to||date<=pd62.to);}
  function partnerLots62(p){
    if(!p)return [];
    if(p.kind==='supplier')return (state.lots||[]).filter(l=>l.owner==='supplier' && (l.partnerId===p.id || (l.receiptId&&state.receipts.some(r=>r.id===l.receiptId&&r.partnerId===p.id))));
    return (state.lots||[]).filter(l=>l.owner==='customer' && (l.buyerId===p.id || (l.saleId&&state.sales.some(s=>s.id===l.saleId&&s.buyerId===p.id))));
  }
  function supplierReceipts62(p){return (state.receipts||[]).filter(r=>r.partnerId===p.id);}
  function buyerSales62(p){return (state.sales||[]).filter(s=>s.buyerId===p.id);}
  function supplierSales62(p){return (state.sales||[]).filter(s=>s.sourceOwner==='supplier'&&s.sourceSupplierId===p.id);}
  function groupVoucher62(rows){
    const m=new Map();for(const r of rows){const k=r.voucherNo||r.purchaseNo||r.no||r.id;if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return [...m.values()];
  }
  function pay62(p){return (p.kind==='supplier'?supplierReceipts62(p).filter(r=>r.status==='purchased').reduce((n,r)=>n+due(r),0):0)+(globalThis.opening69Balance?.('payable',p.id)||0)+(globalThis.traderDue74?.(p.id)||0);}
  function recv62(p){return (p.kind==='buyer'?buyerSales62(p).reduce((n,s)=>n+receivable(s),0):0)+(globalThis.opening69Balance?.('receivable',p.id)||0);}
  function adv62(p){return p.kind==='supplier'&&typeof supplierBalance==='function'?supplierBalance(p.id):0;}
  function stockQty62(p){return partnerLots62(p).reduce((n,l)=>n+(Number(l.qty)||0),0);}
  function dispatchRemain62(p){return p.kind==='buyer'?buyerSales62(p).reduce((n,s)=>n+saleRemaining(s),0):0;}
  function receivedQty62(p){return p.kind==='supplier'?supplierReceipts62(p).reduce((n,r)=>n+receiptReceivedQuantity2(r),0):buyerSales62(p).reduce((n,s)=>n+(Number(s.qty)||0),0);}

  function moneyEvents62(p){
    const a=[];
    if(p.kind==='supplier'){
      for(const r of supplierReceipts62(p))for(const x of (r.payments||[]))a.push({date:x.date,ref:r.voucherNo||r.purchaseNo||r.no,type:'အဝယ်ငွေပေး',account:x.account,out:x.amount||0,receiptId:r.id,note:r.product});
      for(const x of (state.partnerAdvances||[]).filter(x=>x.partnerId===p.id))a.push({date:x.date,ref:x.id,type:'ကြိုသုံးငွေ',account:x.account,out:x.amount||0,advanceId:x.id,note:x.reason||''});
      for(const e of (state.expenses||[]).filter(e=>e.partnerId===p.id))a.push({date:e.date,ref:e.id,type:e.reason||'အသုံးစရိတ်',account:e.account,out:e.amount||0,receiptId:e.receiptId||'',note:e.recoverable?'ယာယီစိုက်ထုတ် / ပြန်နုတ်ရန်':''});
    }else{
      for(const s of buyerSales62(p))for(const x of (s.payments||[]))a.push({date:x.date,ref:s.voucherNo||s.no,type:'အရောင်းငွေလက်ခံ',account:x.account,in:x.amount||0,saleId:s.id,note:s.product});
    }
    if(p.kind==='supplier')a.push(...(globalThis.traderMoneyEvents74?.(p.id)||[]));
    return a.sort((x,y)=>(y.date||'').localeCompare(x.date||''));
  }

  function goodsEvents62(p){
    const a=[];
    if(p.kind==='supplier'){
      for(const r of supplierReceipts62(p))a.push({date:r.date,ref:r.voucherNo||r.no,type:'ကုန်ဝင်',product:r.product,warehouse:r.warehouse,batch:r.voucherNo||r.no,in:receiptReceivedQuantity2(r),receiptId:r.id,note:r.status==='purchased'?'နောက်ပိုင်း ပွဲရုံပိုင်အဖြစ် ဝယ်ယူပြီး':'ကုန်သည်ပိုင်ကုန်'});
      for(const r of supplierReceipts62(p).filter(r=>r.status==='purchased'))a.push({date:r.purchaseDate||r.date,ref:r.purchaseNo||r.voucherNo||r.no,type:'ပိုင်ဆိုင်မှုပြောင်း',product:r.product,warehouse:r.warehouse,batch:r.voucherNo||r.no,out:r.qty||0,receiptId:r.id,note:'ကုန်သည်ပိုင် → ပွဲရုံပိုင်'});
      for(const s of supplierSales62(p))a.push({date:s.date,ref:s.voucherNo||s.no,type:'ကုန်သည်ပိုင်ကုန် အရောင်း',product:s.product,warehouse:s.warehouse,batch:s.batch,out:s.qty||0,saleId:s.id,note:s.name||''});
      for(const t of (state.transfers||[]).filter(t=>t.owner==='supplier'&&t.name===p.name))a.push({date:t.date,ref:t.id,type:'ဂိုထောင်ပြောင်း',product:t.product,warehouse:t.to,batch:t.batch,in:0,out:0,note:wh62(t.from)+' → '+wh62(t.to)+' · '+transferStatementAmount2(t)});
    }else{
      for(const s of buyerSales62(p)){
        if(s.mode==='direct')a.push({date:s.date,ref:s.voucherNo||s.no,type:'ကုန်ထုတ်',product:s.product,warehouse:s.warehouse,batch:s.batch,out:s.qty||0,saleId:s.id,note:'အရောင်းနှင့်တပြိုင်နက် ထုတ်ပေး'});
        for(const d of (s.dispatches||[]))a.push({date:d.date,ref:s.voucherNo||s.no,type:'ကုန်ထုတ်',product:s.product,warehouse:d.warehouse||s.warehouse,batch:s.batch,out:d.qty||0,saleId:s.id,note:'ဝယ်သူထံ ထုတ်ပေး'});
      }
      for(const t of (state.transfers||[]).filter(t=>t.owner==='customer'&&t.name===p.name))a.push({date:t.date,ref:t.id,type:'ဂိုထောင်ပြောင်း',product:t.product,warehouse:t.to,batch:t.batch,in:0,out:0,note:wh62(t.from)+' → '+wh62(t.to)+' · '+transferStatementAmount2(t)});
    }
    return a.sort((x,y)=>(y.date||'').localeCompare(x.date||''));
  }

  function advanceRows62(p){
    if(p.kind!=='supplier')return [];
    return (state.partnerAdvances||[]).filter(a=>a.partnerId===p.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  }

  function chargeItems62(p){
    const out=[];
    const add=(date,ref,voucherType,name,amount,recordId,kind)=>{amount=Number(amount)||0;if(amount>0)out.push({date,ref,voucherType,name,amount,recordId,kind});};
    if(p.kind==='supplier'){
      const seen=new Set();
      for(const r of supplierReceipts62(p).filter(r=>r.status==='purchased')){
        const key=r.voucherNo||r.purchaseNo||r.no;if(seen.has(key))continue;seen.add(key);
        const group=supplierReceipts62(p).filter(x=>(x.voucherNo||x.purchaseNo||x.no)===key), first=group.find(x=>x.charges4)||r, c=first.charges4||{};
        add(r.purchaseDate||r.date,key,'အဝယ်','ဝန်ဆောင်ခ',c.serviceFee,r.id,'receipt');
        add(r.purchaseDate||r.date,key,'အဝယ်','လုပ်သားခ',c.labor,r.id,'receipt');
        add(r.purchaseDate||r.date,key,'အဝယ်','တန်ဆာခ (ခေါက်ရှည်)',c.carriage||r.carriageAdvance,r.id,'receipt');
        for(const x of (c.dynamicRows||c.deductionRows||[]))add(r.purchaseDate||r.date,key,'အဝယ်',x.name||'နုတ်ငွေ',x.amount,r.id,'receipt');
        if(!first.charges4){add(r.purchaseDate||r.date,key,'အဝယ်','လုပ်သားခ',r.wage,r.id,'receipt');add(r.purchaseDate||r.date,key,'အဝယ်','ချိန်ခ / လုပ်အားခ',r.weigh,r.id,'receipt');}
      }
    }else{
      const seen=new Set();
      for(const s of buyerSales62(p)){
        const key=s.voucherNo||s.no;if(seen.has(key))continue;seen.add(key);
        const group=buyerSales62(p).filter(x=>(x.voucherNo||x.no)===key), first=group.find(x=>x.charges4)||s, c=first.charges4||{};
        add(s.date,key,'အရောင်း','ဝန်ဆောင်ခ',c.serviceFee,s.id,'sale');add(s.date,key,'အရောင်း','လုပ်သားခ',c.labor,s.id,'sale');
        for(const x of (c.dynamicRows||c.deductionRows||[]))add(s.date,key,'အရောင်း',x.name||'နုတ်ငွေ',x.amount,s.id,'sale');
      }
    }
    if(p.kind==='supplier')for(const s of (globalThis.traderRecords74?.()||[]).filter(s=>s.partnerId===p.id))for(const x of globalThis.traderChargeItems74(s))out.push({date:s.confirmedDate,ref:s.no,voucherType:'ကုန်သည်ရောင်းပေးငွေရှင်း',name:x.name,amount:x.amount,recordId:s.id,kind:'trader74'});
    return out.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  }

  function tradeRows62(p){
    const out=[];
    if(p.kind==='supplier'){
      for(const g of groupVoucher62(supplierReceipts62(p).filter(r=>r.status==='purchased'))){const r=g[0];out.push({date:r.purchaseDate||r.date,ref:r.voucherNo||r.purchaseNo||r.no,type:'အဝယ်',products:g.map(x=>x.product).join('၊ '),qty:g.reduce((n,x)=>n+(Number(x.qty)||0),0),gross:g.reduce((n,x)=>n+gross(x),0),net:g.reduce((n,x)=>n+purchaseNet(x),0),balance:g.reduce((n,x)=>n+due(x),0),recordId:r.id,kind:'receipt'});}
      for(const g of groupVoucher62(supplierSales62(p))){const s=g[0];out.push({date:s.date,ref:s.voucherNo||s.no,type:'ကုန်သည်ပိုင်ကုန် အရောင်း',products:g.map(x=>x.product).join('၊ '),qty:g.reduce((n,x)=>n+(Number(x.qty)||0),0),gross:g.reduce((n,x)=>n+(Number(x.grossTotal??x.total)||0),0),net:globalThis.traderRecordForSale74?.(s.id)?globalThis.traderNet74(globalThis.traderRecordForSale74(s.id)):g.reduce((n,x)=>n+(Number(x.grossTotal??x.total)||0),0),balance:globalThis.traderDue74?.(p.id)===undefined?0:(globalThis.traderRecordForSale74?.(s.id)?Math.max(0,globalThis.traderNet74(globalThis.traderRecordForSale74(s.id))-(globalThis.traderRecordForSale74(s.id).payments||[]).reduce((n,x)=>n+x.amount,0)):0),recordId:globalThis.traderRecordForSale74?.(s.id)?.id||s.id,kind:globalThis.traderRecordForSale74?.(s.id)?'trader74':'sale'});}
    }else{
      for(const g of groupVoucher62(buyerSales62(p))){const s=g[0];out.push({date:s.date,ref:s.voucherNo||s.no,type:'အရောင်း',products:g.map(x=>x.product).join('၊ '),qty:g.reduce((n,x)=>n+(Number(x.qty)||0),0),gross:g.reduce((n,x)=>n+(Number(x.grossTotal??x.total)||0),0),net:g.reduce((n,x)=>n+(Number(x.total)||0),0),balance:g.reduce((n,x)=>n+receivable(x),0),recordId:s.id,kind:'sale'});}
    }
    return out.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  }

  function allEvents62(p){
    const a=[];
    for(const x of goodsEvents62(p))a.push({...x,desc:x.note||'',goodsIn:x.in||0,goodsOut:x.out||0,cashIn:0,cashOut:0});
    for(const x of moneyEvents62(p))a.push({...x,desc:(x.note?x.note+' · ':'')+acc62(x.account),goodsIn:0,goodsOut:0,cashIn:x.in||0,cashOut:x.out||0});
    for(const x of advanceRows62(p))for(const u of (x.allocations||[]))a.push({date:u.date||x.date,ref:x.id,type:'ကြိုငွေပြန်နုတ်',desc:(state.receipts||[]).find(r=>r.id===u.receiptId)?.purchaseNo||u.receiptId||'',goodsIn:0,goodsOut:0,cashIn:0,cashOut:0,advanceUse:u.amount||0});
    for(const x of tradeRows62(p))a.push({date:x.date,ref:x.ref,type:x.type,desc:x.products+' · '+vissText37(x.qty)+' ပိဿာ · '+cashText(x.net),goodsIn:0,goodsOut:0,cashIn:0,cashOut:0,recordId:x.recordId,kind:x.kind});
    return a.sort((x,y)=>(y.date||'').localeCompare(x.date||'')||String(y.ref||'').localeCompare(String(x.ref||'')));
  }

  function txnBtn62(x){
    if(x.kind==='trader74')return smallbtn('ငွေရှင်းကြည့်',`openTrader74('${x.recordId}')`,'secondary','doc');
    if(x.receiptId||x.kind==='receipt')return smallbtn('ကြည့်',`openPartnerTxn62('receipt','${x.receiptId||x.recordId}')`,'secondary','eye');
    if(x.saleId||x.kind==='sale')return smallbtn('ကြည့်',`openPartnerTxn62('sale','${x.saleId||x.recordId}')`,'secondary','eye');
    return '';
  }

  function rangeBar62(){
    const presets=[['today','ယနေ့'],['7','၇ ရက်'],['month','ယခုလ'],['all','အားလုံး']];
    return `<section class="partner-range62"><div class="tabs">${presets.map(([k,t])=>`<button class="tab ${pd62.range===k?'active':''}" onclick="setPartnerRange62('${k}')">${t}</button>`).join('')}</div><div class="partner-range-fields62">${field('မှ ရက်','pdFrom62',{type:'date',value:pd62.from||'',extra:'onchange="setPartnerCustomRange62()"'})}${field('ထိ ရက်','pdTo62',{type:'date',value:pd62.to||'',extra:'onchange="setPartnerCustomRange62()"'})}</div></section>`;
  }

  function summary62(p){
    if(p.kind==='supplier')return `<div class="grid cols-4 partner-summary62 partner-loans58">${stat('လက်ရှိပေးရန်',M(pay62(p)),'ကျပ်','wallet','အဝယ်နှင့် ရောင်းပေးကုန်ဖိုးရှင်းရန်ကျန်','compact')}${stat('ကြိုသုံးလက်ကျန်',M(adv62(p)),'ကျပ်','wallet','အတိုးမဲ့ · အဝယ် / ရောင်းပေးငွေရှင်းတွင် ပြန်နုတ်နိုင်','compact')}${stat('ကြိုထုတ်ငွေလက်ကျန်',M((state.supplierLoans38||[]).filter(l=>l.partnerId===p.id).reduce((n,l)=>n+loanBalance38(l).principal,0)),'ကျပ်','wallet','ကျန်အရင်း · အတိုးသီးခြား '+cashText((state.supplierLoans38||[]).filter(l=>l.partnerId===p.id).reduce((n,l)=>n+loanBalance38(l).interest,0)),'compact')}${stat('ကုန်သည်ပိုင်လက်ကျန်',vissText37(stockQty62(p)),'ပိဿာ','stock','ပွဲရုံအတွင်းရှိ သူပိုင်ကုန်','compact')}${stat('စုစုပေါင်းကုန်လက်ခံ',vissText37(receivedQty62(p)),'ပိဿာ','receive','မှတ်တမ်းအားလုံး','compact')}</div>`;
    return `<div class="grid cols-4 partner-summary62">${stat('လက်ရှိရရန်',M(recv62(p)),'ကျပ်','wallet','အရောင်းငွေရရန်ကျန်','compact')}${stat('ဝယ်သူပိုင်လက်ကျန်',vissText37(stockQty62(p)),'ပိဿာ','stock','ဝယ်ပြီး ပွဲရုံမှာထားသောကုန်','compact')}${stat('ထုတ်ပေးရန်ကျန်',vissText37(dispatchRemain62(p)),'ပိဿာ','truck','အရောင်းမှ ကုန်ထုတ်ရန်ကျန်','compact')}${stat('စုစုပေါင်းအရောင်းကုန်',vissText37(receivedQty62(p)),'ပိဿာ','sale','မှတ်တမ်းအားလုံး','compact')}</div>`;
  }

  function currentStock62(p){
    const rows=partnerLots62(p).filter(l=>(Number(l.qty)||0)>0 || l.weightKnown===false);
    return `<section class="card mt"><div class="card-title"><div><h3>လက်ရှိကုန်လက်ကျန်</h3><p class="small muted">${p.kind==='supplier'?'ကုန်သည်ပိုင်အဖြစ် ကျန်ရှိသည့်ကုန်':'ဝယ်ပြီး မထုတ်ရသေးသည့် ဝယ်သူပိုင်ကုန်'}</p></div><strong>${vissText37(stockQty62(p))} ပိဿာ</strong></div>${table4(['ကုန်','ဂိုထောင်','အသုတ်','ပုံစံ','လက်ကျန်'],rows.map(l=>`<tr><td><strong>${E(l.product)}</strong></td><td>${E(wh62(l.warehouse))}</td><td>${E(l.batch||'—')}</td><td>${l.stockForm==='packaged'?'ထုပ်ပိုးပြီး':'မထုပ်ပိုးရသေး'}</td><td><strong>${l.weightKnown===false?'မသိသေး':vissText37(l.qty)+' ပိဿာ'}</strong></td></tr>`))}</section>`;
  }

  function allTab62(p){const rows=allEvents62(p).filter(x=>inRange62(x.date));return table4(['ရက် / အမှတ်','အမျိုးအစား','အသေးစိတ်','ကုန်အဝင်','ကုန်အထွက်','ငွေအဝင်','ငွေအထွက်',''],rows.map(x=>`<tr><td>${shortDate(d62(x.date))}<div class="small muted">${E(x.ref||'—')}</div></td><td><strong>${E(x.type)}</strong></td><td>${E(x.desc||'—')}${x.advanceUse?`<div class="small muted">ကြိုငွေပြန်နုတ် ${cashText(x.advanceUse)}</div>`:''}</td><td>${x.goodsIn?vissText37(x.goodsIn)+' ပိဿာ':'—'}</td><td>${x.goodsOut?vissText37(x.goodsOut)+' ပိဿာ':'—'}</td><td>${x.cashIn?cashText(x.cashIn):'—'}</td><td>${x.cashOut?cashText(x.cashOut):'—'}</td><td>${txnBtn62(x)}</td></tr>`));}
  function goodsTab62(p){const rows=goodsEvents62(p).filter(x=>inRange62(x.date));return table4(['ရက် / အမှတ်','အမျိုးအစား','ကုန်','ဂိုထောင် / အသုတ်','အဝင်','အထွက်','မှတ်ချက်',''],rows.map(x=>`<tr><td>${shortDate(d62(x.date))}<div class="small muted">${E(x.ref||'—')}</div></td><td>${E(x.type)}</td><td><strong>${E(x.product||'—')}</strong></td><td>${E(wh62(x.warehouse))}<div class="small muted">${E(x.batch||'—')}</div></td><td>${x.in?vissText37(x.in)+' ပိဿာ':'—'}</td><td>${x.out?vissText37(x.out)+' ပိဿာ':'—'}</td><td>${E(x.note||'—')}</td><td>${txnBtn62(x)}</td></tr>`));}
  function tradeTab62(p){const rows=tradeRows62(p).filter(x=>inRange62(x.date));return table4(['ရက် / ဘောက်ချာ','အမျိုးအစား','ကုန်','ပိဿာ','မူလတန်ဖိုး','အသားတင်','လက်ကျန်',''],rows.map(x=>`<tr><td>${shortDate(d62(x.date))}<div class="small muted">${E(x.ref)}</div></td><td>${E(x.type)}</td><td>${E(x.products)}</td><td>${vissText37(x.qty)}</td><td>${cashText(x.gross)}</td><td><strong>${cashText(x.net)}</strong></td><td>${cashText(x.balance)}</td><td>${txnBtn62(x)}</td></tr>`));}
  function moneyTab62(p){const rows=moneyEvents62(p).filter(x=>inRange62(x.date));const inc=rows.reduce((n,x)=>n+(x.in||0),0),out=rows.reduce((n,x)=>n+(x.out||0),0);return `<div class="grid cols-2 mb">${stat('ကာလအတွင်း ငွေအဝင်',M(inc),'ကျပ်','wallet','ရွေးထားသောရက်ကာလ','compact')}${stat('ကာလအတွင်း ငွေအထွက်',M(out),'ကျပ်','wallet','ရွေးထားသောရက်ကာလ','compact')}</div>`+table4(['ရက် / အမှတ်','အကြောင်းအရာ','ငွေစာရင်း','ငွေအဝင်','ငွေအထွက်','မှတ်ချက်',''],rows.map(x=>`<tr><td>${shortDate(d62(x.date))}<div class="small muted">${E(x.ref||'—')}</div></td><td><strong>${E(x.type)}</strong></td><td>${E(acc62(x.account))}</td><td>${x.in?cashText(x.in):'—'}</td><td>${x.out?cashText(x.out):'—'}</td><td>${E(x.note||'—')}</td><td>${txnBtn62(x)}</td></tr>`));}
  function advanceTab62(p){if(p.kind!=='supplier')return note('ဝယ်သူအတွက် ကြိုသုံးငွေမှတ်တမ်း မသုံးသေးပါ။','blue');const rows=advanceRows62(p).filter(x=>inRange62(x.date));return `<div class="summary-box mb">${row4('လက်ရှိ ကြိုသုံးလက်ကျန်',cashText(adv62(p)))}</div>`+table4(['ရက် / အမှတ်','အကြောင်း','ထုတ်ပေးငွေ','ပြန်နုတ်ပြီး','လက်ကျန်','အသုံးပြုသည့်ဘောက်ချာ'],rows.map(a=>{const used=(a.allocations||[]).reduce((n,x)=>n+(Number(x.amount)||0),0),links=(a.allocations||[]).map(x=>{const r=(state.receipts||[]).find(r=>r.id===x.receiptId),ts=globalThis.traderRecords74?.().find(s=>s.id===x.receiptId);return `${E(r?.purchaseNo||r?.voucherNo||ts?.no||x.receiptId)} · ${cashText(x.amount)}`;}).join('<br>')||'—';return `<tr><td>${shortDate(d62(a.date))}<div class="small muted">${E(a.id)}</div></td><td>${E(a.reason||'—')}<div class="small muted">${E(acc62(a.account))}</div></td><td>${cashText(a.amount)}</td><td>${cashText(used)}</td><td><strong>${cashText((Number(a.amount)||0)-used)}</strong></td><td>${links}</td></tr>`;}));}
  function chargesTab62(p){const rows=chargeItems62(p).filter(x=>inRange62(x.date));const total=rows.reduce((n,x)=>n+x.amount,0);return `<div class="summary-box mb">${row4('ရွေးထားသောကာလ စုစုပေါင်းနုတ်ငွေ / ဝန်ဆောင်ခ',cashText(total))}</div>`+table4(['ရက် / ဘောက်ချာ','အမျိုးအစား','နုတ်ငွေအမည်','ပမာဏ',''],rows.map(x=>`<tr><td>${shortDate(d62(x.date))}<div class="small muted">${E(x.ref)}</div></td><td>${E(x.voucherType)}</td><td><strong>${E(x.name)}</strong></td><td>${cashText(x.amount)}</td><td>${txnBtn62(x)}</td></tr>`));}

  function detailBody62(p){
    if(pd62.tab==='loan38')return loanStatement38(p.id,pd62.from,pd62.to);
    if(pd62.tab==='goods')return goodsTab62(p);
    if(pd62.tab==='trade')return tradeTab62(p);
    if(pd62.tab==='money')return moneyTab62(p);
    if(pd62.tab==='advance')return advanceTab62(p);
    if(pd62.tab==='charges')return chargesTab62(p);
    return allTab62(p);
  }

  function partnerDetailPage62(){
    const p=p62();if(!p){setupSection='partners';return partnerList();}
    const tabs=[['all','အားလုံး'],['goods','ကုန်အဝင် / အထွက်'],['trade',p.kind==='supplier'?'အဝယ် / ရောင်းပေးမှု':'အရောင်း'],['money','ငွေအဝင် / အထွက်'],['advance','ကြိုသုံးငွေ'],['loan38','ကြိုထုတ်ငွေ'],['charges','နုတ်ငွေ / ဝန်ဆောင်ခ']];
    const meta=[p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်',p.locality,p.phone].filter(Boolean).join(' · ');
    return `<button class="v2-back" onclick="backPartnerList62()">${I('back')}ကုန်သည် / ဝယ်သူစာရင်းသို့</button>`+
      heading('',E(p.name),meta||'တစ်ဦးချင်း စာရင်းအသေးစိတ်',`<div class="row wrap">${btn('စာရင်းရှင်းတမ်း ကြည့်ရန်',`openPartnerStatement62('${p.id}')`,'secondary','doc')}${btn('ပြင်မယ်',`openPartnerEdit('${p.id}')`,'secondary','edit')}${btn('Print','printPartnerDetail62()','secondary','print')}</div>`)+
      summary62(p)+currentStock62(p)+rangeBar62()+
      `<div class="toolbar partner-tabs62"><div class="tabs">${tabs.map(([k,t])=>`<button class="tab ${pd62.tab===k?'active':''}" onclick="setPartnerTab62('${k}')">${t}</button>`).join('')}</div></div>`+
      `<section class="card partner-ledger62"><div id="partnerDetailBody62">${detailBody62(p)}</div></section>`;
  }

  window.openPartnerDetail62=function(id){openPartnerStatement62(id);};
  window.backPartnerList62=function(){const p=p62();if(p)partnerKind=p.kind;setupSection='partners';render();};
  window.setPartnerTab62=function(tab){pd62.tab=tab;render();};
  window.setPartnerRange62=function(k){pd62.range=k;const t=today();if(k==='today'){pd62.from=t;pd62.to=t;}else if(k==='7'){pd62.from=minusDays62(t,6);pd62.to=t;}else if(k==='month'){pd62.from=monthStart62(t);pd62.to=t;}else{pd62.from='';pd62.to='';}render();};
  window.setPartnerCustomRange62=function(){const f=document.getElementById('pdFrom62')?.value||'',t=document.getElementById('pdTo62')?.value||'';if(f&&t&&f>t){toast('မှ ရက်သည် ထိ ရက်ထက် မကျော်ရပါ။',true);return;}pd62.range='custom';pd62.from=f;pd62.to=t;render();};
  window.openPartnerTxn62=function(kind,id){if(kind==='receipt'){if(typeof openReceiptDetail==='function')openReceiptDetail(id);else if(typeof purchaseDetail4==='function')purchaseDetail4(id);}else{if(typeof saleDetail4==='function')saleDetail4(id);else if(typeof openSaleDetail==='function')openSaleDetail(id);}};
  window.printPartnerDetail62=function(){const p=p62();if(!p)return;const body=document.getElementById('partnerDetailBody62')?.innerHTML||'';printDocument('ကုန်သည် / ဝယ်သူ တစ်ဦးချင်းစာရင်း',p.name,`<p>${E(p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်')}</p>${body.replace(/<button[\s\S]*?<\/button>/g,'')}`);};

  partnerList=function(){
    const list=(state.masters?.partners||[]).filter(p=>p.kind===partnerKind);
    return setupBack()+heading('','ကုန်သည်နှင့် ဝယ်သူများ','တစ်ဦးချင်းစီ၏ စာရင်းရှင်းတမ်းသို့ တစ်ချက်နှိပ်ပြီး တိုက်ရိုက်ဝင်ကြည့်နိုင်သည်။',btn('အမည်အသစ် ထည့်မယ်','openPartnerEdit()','primary','plus'))+
      `<div class="toolbar"><div class="tabs">${[['supplier','ကုန်သည်'],['buyer','ဝယ်သူ']].map(([k,t])=>`<button class="tab ${partnerKind===k?'active':''}" onclick="partnerKind='${k}';render()">${t}</button>`).join('')}</div><span class="small muted">${list.length} ဦး</span></div>`+
      `<div class="v2-list">${list.map(p=>`<div class="v3-partner-row partner-row62"><span class="icon-box">${I('users')}</span><div class="grow"><strong>${E(p.name)}</strong><div class="record-meta">${p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်'}${p.locality?' · '+E(p.locality):''}${!p.active?' · အသုံးမပြုတော့ပါ':''}</div></div><div class="partner-mini62">${p.kind==='supplier'?`<span>ပေးရန် <strong>${cashText(pay62(p))}</strong></span><span>ကြိုငွေ <strong>${cashText(adv62(p))}</strong></span>`:`<span>ရရန် <strong>${cashText(recv62(p))}</strong></span>`}<span>ကုန် <strong>${vissText37(stockQty62(p))} ပိဿာ</strong></span></div><div class="row partner-actions62">${btn('စာရင်းရှင်းတမ်း',`openPartnerStatement62('${p.id}')`,'secondary','doc')}${btn('ပြင်မယ်',`openPartnerEdit('${p.id}')`,'secondary','edit')}</div></div>`).join('')||empty('အမည်စာရင်း မရှိသေးပါ။','users')}</div>`;
  };

  setupView=function(){if(setupSection==='partner-detail')setupSection='partners';return setupView62Base();};

  /* V37: detailed Partner Statement inside Operations; reuse the verified partner-detail ledgers. */
  const st62={id:'',from:today().slice(0,8)+'01',to:today(),tab:'ledger',viewed:false};
  const statementTabs62=[
    ['ledger','စာရင်းရှင်းတမ်း'],
    ['all','အားလုံး'],
    ['goods','ကုန်အဝင် / အထွက်'],
    ['trade','အဝယ် / အရောင်း'],
    ['money','ငွေအဝင် / အထွက်'],
    ['advance','ကြိုသုံးငွေ'],['loan38','ကြိုထုတ်ငွေ'],
    ['charges','နုတ်ငွေ / ဝန်ဆောင်ခ']
  ];
  function statementParty62(){return (state.masters?.partners||[]).find(p=>p.id===st62.id)||null;}
  // Searchable partner picker for the statement. The hidden ID is the only valid selection.
  function statementSearchField62(partners){
    const selected=partners.find(p=>p.id===st62.id);
    const text=selected?selected.name:'';
    return `<div class="field statement-search-field62"><label for="stPartySearch62">သက်ဆိုင်သူ <span class="req">*</span></label>`+
      `<div class="statement-search-wrap62">${I('search')}<input type="search" id="stPartySearch62" class="statement-search-input62" value="${E(text)}" placeholder="ကုန်သည် / ဝယ်သူ အမည်၊ ဖုန်း၊ နေရပ် ရိုက်ရှာပါ" autocomplete="off" required role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="false" aria-controls="stPartyMatches62" oninput="filterStatementParties62(true)" onfocus="filterStatementParties62(false)" onkeydown="statementSearchKey62(event)">`+
      `<input type="hidden" id="stParty" name="stParty" value="${E(st62.id)}"><div id="stPartyMatches62" class="statement-search-results62" role="listbox" hidden></div></div>`+
      `<p id="stPartyHint62" class="field-help">စာရင်းကြည့်လိုသူကို အမည်ရိုက်ရှာပြီး ရွေးချယ်ပါ။</p></div>`;
  }
  function closeStatementMatches62(){
    const results=document.getElementById('stPartyMatches62'),input=document.getElementById('stPartySearch62');
    if(results)results.hidden=true;
    if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');}
  }
  window.filterStatementParties62=function(changed=false){
    const input=document.getElementById('stPartySearch62'),results=document.getElementById('stPartyMatches62');
    if(!input||!results)return;
    if(changed){const hid=document.getElementById('stParty');if(hid)hid.value='';markStatementDirty62();}
    const q=input.value.trim().toLocaleLowerCase();
    const partners=(state.masters?.partners||[]).filter(p=>
      [p.name,p.locality,p.phone,p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်'].join(' ').toLocaleLowerCase().includes(q));
    st62.highlight=0;
    results.innerHTML=partners.slice(0,35).map((p,i)=>`<button type="button" id="stPartyOption62-${i}" class="statement-search-option62 ${i===0?'focused':''}" role="option" aria-selected="${i===0}" data-id="${E(p.id)}" onmousedown="event.preventDefault()" onclick="selectStatementParty62(this.dataset.id)"><strong>${E(p.name)}</strong><span>${E([p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်',p.locality,p.phone].filter(Boolean).join(' · '))}</span></button>`).join('')||`<div class="statement-search-empty62">ရှာဖွေမှုနဲ့ ကိုက်ညီတဲ့ အမည်မရှိပါ။</div>`;
    results.hidden=false;input.setAttribute('aria-expanded','true');
    if(partners.length)input.setAttribute('aria-activedescendant','stPartyOption62-0');
    else input.removeAttribute('aria-activedescendant');
    const hint=document.getElementById('stPartyHint62');if(hint)hint.textContent=`အမည်စာရင်း ${partners.length} ဦး ကိုက်ညီပါသည်။ ရွေးချယ်ပါ။`;
  };
  window.statementSearchKey62=function(event){
    const results=document.getElementById('stPartyMatches62');
    if(!results)return;
    if(event.key==='Escape'){closeStatementMatches62();return;}
    if(event.key==='Tab'){closeStatementMatches62();return;}
    const opts=[...results.querySelectorAll('.statement-search-option62')];
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();if(results.hidden){filterStatementParties62();return;}
      if(!opts.length)return;
      st62.highlight=(st62.highlight+(event.key==='ArrowDown'?1:-1)+opts.length)%opts.length;
      opts.forEach((b,i)=>{b.classList.toggle('focused',i===st62.highlight);b.setAttribute('aria-selected',String(i===st62.highlight));});
      const active=opts[st62.highlight];document.getElementById('stPartySearch62')?.setAttribute('aria-activedescendant',active.id);
      active.scrollIntoView({block:'nearest'});return;
    }
    if(event.key==='Enter'&&!results.hidden){
      event.preventDefault();if(opts.length)selectStatementParty62(opts[st62.highlight]?.dataset.id||opts[0].dataset.id);
    }
  };
  window.selectStatementParty62=function(id){
    const p=(state.masters?.partners||[]).find(x=>x.id===id);if(!p)return;
    const input=document.getElementById('stPartySearch62'),hid=document.getElementById('stParty');
    if(input)input.value=p.name;
    if(hid)hid.value=p.id;
    closeStatementMatches62();
    const hint=document.getElementById('stPartyHint62');if(hint)hint.textContent=`ရွေးထားသူ — ${p.name}`;
    renderStatement4();
  };
  document.addEventListener('pointerdown',event=>{
    if(!event.target.closest('.statement-search-field62'))closeStatementMatches62();
  });
  function statementLedger62(p){
    const d=statementData4(p,st62.from,st62.to);
    if(!d)return note('ရက်စွဲကာလ မမှန်ပါ။','amber');
    let pay=d.sum(d.opening,'payable'),recv=d.sum(d.opening,'receivable'),advance=d.sum(d.opening,'advance');
    const open=`<div class="summary-box mb">${row4('ကာလအစ ပေးရန်',cashText(pay))}${row4('ကာလအစ ရရန်',cashText(recv))}${row4('ကာလအစ ကြိုငွေ',cashText(advance))}</div>`;
    const rows=d.selected.map(x=>{
      pay+=x.payable||0;recv+=x.receivable||0;advance+=x.advance||0;
      const qty=(x.qty===undefined||x.qty===null)?'':`<div class="small muted">${x.qty<0?'− ':''}${vissText37(Math.abs(Number(x.qty)||0))} ပိဿာ</div>`;
      return `<tr><td>${shortDate(x.date)}<div class="small muted">${E(x.ref||'—')}</div></td><td><strong>${E(x.type)}</strong></td><td>${E(x.product||'—')}${qty}</td><td>${cashText(pay)}</td><td>${cashText(recv)}</td><td>${cashText(advance)}</td></tr>`;
    });
    return `<h3 class="mb">ကာလအလိုက် ငွေလက်ကျန်ပြောင်းလဲမှု</h3>`+open+
      table4(['ရက် / အမှတ်','အကြောင်းအရာ','ကုန် / အလေးချိန်','ပေးရန်လက်ကျန်','ရရန်လက်ကျန်','ကြိုငွေလက်ကျန်'],rows)+
      `<div class="summary-box mt">${row4('ကာလပိတ် ပေးရန်',cashText(pay))}${row4('ကာလပိတ် ရရန်',cashText(recv))}${row4('ကာလပိတ် ကြိုငွေ',cashText(advance))}</div>`;
  }
  function statementDetailTab62(p,tab){
    const saved={...pd62};
    pd62.id=p.id;pd62.tab=tab;pd62.range='custom';pd62.from=st62.from;pd62.to=st62.to;
    try{return detailBody62(p);}finally{Object.assign(pd62,saved);}
  }
  function statementBody62(){
    if(!st62.viewed)return note('သက်ဆိုင်သူနှင့် ရက်ကာလရွေးပြီး စာရင်းရှင်းတမ်း ကြည့်မယ် ကိုနှိပ်ပါ။');
    const p=statementParty62();if(!p)return note('သက်ဆိုင်သူကို ပြန်ရွေးပါ။','amber');
    const meta=[p.kind==='buyer'?'ဝယ်သူ':p.type==='farmer'?'ကုန်သည်':'ကုန်သည်',p.locality,p.phone].filter(Boolean).join(' · ');
    const tabs=statementTabs62.filter(([k])=>!['advance','loan38'].includes(k)||p.kind==='supplier');
    const inner=st62.tab==='ledger'?statementLedger62(p):statementDetailTab62(p,st62.tab);
    return `<div class="statement-person62"><div><h2>${E(p.name)}</h2><p class="small muted">${E(meta)}</p></div>${btn('ယခု Tab ကို Print','printStatement4()','secondary','print')}</div>`+
      `<h3 class="statement-section-heading62">လက်ရှိအခြေအနေ <span class="small muted">(ယနေ့လက်ကျန် — အောက်ပါရက်စွဲ Filter နှင့် မသက်ဆိုင်)</span></h3>`+
      summary62(p)+currentStock62(p)+
      `<div class="statement-period-note62">${I('doc','sm')} <span><strong>ကာလအလိုက် အသေးစိတ်</strong> · ${shortDate(st62.from)} မှ ${shortDate(st62.to)} အထိ။ အောက်ပါ Tab များတွင် ရွေးထားသောရက်ကာလအတွင်း မှတ်တမ်းများကိုသာ ပြထားသည်။ အပေါ်က လက်ရှိလက်ကျန်နှင့် ဂိုဒေါင်စာရင်းမှာ ယနေ့အခြေအနေဖြစ်သည်။</span></div>`+
      `<div class="statement-tabs62" role="group" aria-label="စာရင်းရှင်းတမ်းအမျိုးအစား">${tabs.map(([key,name])=>`<button type="button" class="tab ${st62.tab===key?'active':''}" aria-pressed="${st62.tab===key}" onclick="setStatementTab62('${key}')">${name}</button>`).join('')}</div>`+
      `<section class="card partner-ledger62 statement-ledger62"><div>${inner}</div></section>`+(p.kind==='supplier'?(globalThis.traderPanel74?.(p.id,st62.from,st62.to)||''):'');
  }
  // The original Operations tab remains the same navigation destination.
  statements4=function(){
    const partners=(state.masters?.partners||[]);
    if(!st62.id&&partners.length)st62.id=(partners.find(p=>p.active!==false)||partners[0]).id;
    return `<section class="card statement-form62"><div class="statement-top62"><div><h2>ကုန်သည် / ဝယ်သူ စာရင်းရှင်းတမ်း</h2><p class="small muted">ကုန်သည်/ဝယ်သူအလိုက် ကုန်၊ ငွေ၊ ကြိုငွေ၊ နုတ်ငွေနှင့် ဂိုဒေါင်အသုတ်စာရင်းများကို တစ်နေရာတည်းတွင် ကြည့်နိုင်သည်။</p></div></div>`+
      `<form id="statementForm4" onsubmit="event.preventDefault();renderStatement4()"><div class="statement-fields62">`+
      statementSearchField62(partners)+
      field('မှ ရက်','stFrom',{type:'date',value:st62.from,required:true,extra:'onchange="markStatementDirty62()"'})+
      field('ထိ ရက်','stTo',{type:'date',value:st62.to,required:true,extra:'onchange="markStatementDirty62()"'})+
      `</div><div class="statement-form-actions62"><div class="row wrap statement-quick62">${[['today','ယနေ့'],['week','၇ ရက်'],['month','ယခုလ'],['all','အားလုံး']].map(([k,name])=>`<button type="button" class="btn btn-secondary btn-sm" onclick="quickStatement62('${k}')">${name}</button>`).join('')}</div>${btn('စာရင်းရှင်းတမ်း ကြည့်မယ်','renderStatement4()','primary','doc')}</div></form></section>`+
      `<div id="statementBody4" class="statement-body62 mt">${statementBody62()}</div>`;
  };
  renderStatement4=function(){
    if(!validForm('statementForm4'))return;
    const id=value('stParty'),from=value('stFrom'),to=value('stTo');
    if(!id||!(state.masters?.partners||[]).some(p=>p.id===id)||!from||!to||from>to)return toast('သက်ဆိုင်သူကို Search မှ ရွေးပြီး ရက်စွဲကာလကို မှန်ကန်စွာရွေးပါ။',true);
    st62.id=id;st62.from=from;st62.to=to;st62.viewed=true;
    if(st62.tab==='advance'&&statementParty62()?.kind!=='supplier')st62.tab='ledger';
    render();
  };
  window.markStatementDirty62=function(){
    st62.viewed=false;
    const root=document.getElementById('statementBody4');
    if(root)root.innerHTML=statementBody62();
  };
  window.setStatementTab62=function(tab){
    if(!statementTabs62.some(([key])=>key===tab))return;
    if(tab==='advance'&&statementParty62()?.kind!=='supplier')return;
    st62.tab=tab;const root=document.getElementById('statementBody4');if(root)root.innerHTML=statementBody62();
  };
  window.quickStatement62=function(k){
    const t=today();let from=t;
    if(k==='week')from=minusDays62(t,6);
    else if(k==='month')from=t.slice(0,8)+'01';
    else if(k==='all')from='1900-01-01';
    st62.from=from;st62.to=t;
    const a=document.getElementById('stFrom'),b=document.getElementById('stTo');if(a)a.value=from;if(b)b.value=t;
    // Do not display stale results after the date selection changes.
    st62.viewed=false;
    const root=document.getElementById('statementBody4');if(root)root.innerHTML=statementBody62();
  };
  window.openPartnerStatement62=function(id){
    if(!(state.masters?.partners||[]).some(p=>p.id===id))return;
    st62.id=id;st62.tab='ledger';st62.viewed=true;st62.from='1900-01-01';st62.to=today();
    goOps('statements');
  };
  printStatement4=function(){
    const p=statementParty62();if(!p||!st62.viewed)return toast('အရင်ဆုံး စာရင်းရှင်းတမ်း ကြည့်ပါ။',true);
    const title=statementTabs62.find(([k])=>k===st62.tab)?.[1]||'စာရင်းရှင်းတမ်း';
    const html=document.getElementById('statementBody4')?.innerHTML||'';
    printDocument('စာရင်းရှင်းတမ်း — '+title,E(p.name),`<p>${shortDate(st62.from)} – ${shortDate(st62.to)}</p>`+html.replace(/<button\b[^>]*>[\s\S]*?<\/button>/g,''));
  };

})();
