
/* V5.0 — active multi-product receive flow: carriage advance (ခေါက်ရှည်) + purchase recovery. */
(function(){
  function receiptCarriage50(){
    if(v4Kind!=='purchase') return 0;
    return (v4ReceiptIds||[]).reduce((n,id)=>n+(Number(state.receipts.find(r=>r.id===id)?.carriageAdvance)||0),0);
  }

  openReceive4=function(edit=''){
    v4Edit=edit;v4Rows=0;
    const rs=edit?state.receipts.filter(r=>(r.voucherNo||r.no)===edit):[],r=rs[0];
    const carriage=Number(r?.carriageAdvance)||0;
    const carriageAccount=r?.carriageAccount||state.expenses.find(e=>e.id===r?.carriageExpenseId)?.account||'cash';
    openModal(edit?'ကုန်လက်ခံမှတ်တမ်း ပြင်မယ်':'ကုန်မျိုးစုံ လက်ခံမယ်','ကုန်လိုင်းတစ်ခုချင်းတွင် ကုန်ပစ္စည်းနှင့် ဝယ်ဈေးတန်းကို ရွေးပြီး အကြမ်းအိတ်၊ အချောအိတ် သို့မဟုတ် စုစုပေါင်းပိဿာချိန်ဖြင့် လက်ခံနိုင်သည်။',
      `<form id="receive4" onsubmit="event.preventDefault();saveReceive4('price')">
        <div class="field-row">${selectField('ကုန်သည်','fParty',partners('supplier').map(p=>[p.id,supplierLabel(p)]),r?.partnerId||'','onchange="updateReceiveAdvance4()"')}${field('ကုန်ဝင်ရက်','fDate',{type:'date',value:r?.date||today(),required:true})}</div>
        <div class="field-row">${field('ကုန်လက်ခံမှတ်တမ်းအမှတ်','fNo',{value:r?.voucherNo||'အလ-'+(state.counter+1),required:true,help:'နမူနာအမှတ်ကို ပြင်နိုင်သည်။ အမှတ်ဖွဲ့စည်းပုံ အတည်ပြုရန်ကျန်သည်။'})}${selectField('လက်ခံဂိုဒေါင်','fWh',whOpts(),r?.warehouse||'W1')}</div>
        <section class="summary-box mb"><div class="advance-heading"><strong>ကြိုသုံးငွေ</strong><small>ရွေးထားသော ကုန်သည်အတွက်</small></div><div id="receiveAdvanceBalance4" class="advance-balance"></div><div class="field-row">${field('ယခု ကြိုသုံးငွေ','fAdvanceAmount',{type:'number',min:0,step:1,value:'',suffix:'ကျပ်',placeholder:'မရှိလျှင် 0 သို့ အလွတ်ထားပါ'})}${selectField('ငွေထုတ်မည့် စာရင်း','fAdvanceAccount',aOpts(),'cash')}</div>${selectField('ကြိုသုံးငွေ အကြောင်း','fAdvanceReason',[['အသုံး','အသုံး'],['ကားခ','ကားခ'],['အခြား','အခြား']],'အသုံး')}</section>
        <section class="summary-box mb"><div class="advance-heading"><strong>တန်ဆာခ (ခေါက်ရှည်)</strong><small>ပွဲရုံပိုင်ရှင် ယာယီစိုက်ပေးမည့် အသုံးစရိတ်</small></div><div class="field-row">${field('တန်ဆာခ ငွေပမာဏ','fCarriageAmount',{type:'number',min:0,step:1,value:carriage||'',suffix:'ကျပ်',placeholder:'မရှိလျှင် 0 သို့ အလွတ်ထားပါ'})}${selectField('ယာယီစိုက်ပေးမည့် ငွေစာရင်း','fCarriageAccount',aOpts(),carriageAccount)}</div><p class="field-help">ကုန်လက်ခံချိန်မှာ ပွဲရုံက အသုံးစရိတ်အဖြစ် ယာယီစိုက်ပေးပြီး ဈေးဖြတ်ချိန်မှာ ကုန်သည်ရငွေမှ ပြန်နုတ်ပါမည်။</p></section>
        <div id="receiveLines4"></div><div class="receive-meta-car2">${field('မှတ်ချက်','fNote',{value:r?.note||''})}${field('ကားနံပါတ်','fCar',{value:r?.car||'',placeholder:'ဥပမာ 3A-1234',extra:'maxlength="40" autocomplete="off"'})}</div>
      </form>`,
      btn('ပြန်မယ်','closeModal()','secondary')+`<div class="receive-action-stack4"><button type="button" class="btn btn-secondary receive-action4" onclick="saveCurrentReceiveLineAndAdd4()">${I('plus')}<span>ကုန်တစ်မျိုး ထပ်ထည့်မယ်</span></button><button type="button" class="btn btn-secondary receive-action4" onclick="saveReceive4('new')">${I('plus')}<span>သိမ်းပြီး အသစ်တစ်ဦးထည့်မယ်</span></button><button type="button" class="btn btn-primary receive-action4" onclick="saveReceive4('price')">${I('price')}<span>ဈေးဖြတ်မယ်</span></button></div>`,true);
    (rs.length?rs:[{}]).forEach(x=>addReceiveLine4(x));updateReceiveAdvance4();
  };

  saveReceive4=function(next='list'){
    if(!guardWork()||!validForm('receive4'))return;
    const no=value('fNo'),party=supplierBy(value('fParty'));
    if(!safeLabel(no))return error('မှတ်တမ်းအမှတ်ကို မှန်ကန်စွာ ထည့်ပါ။');
    if(!party)return error('ကုန်သည် ရွေးပါ။');
    if(state.receipts.some(r=>(r.voucherNo||r.no)===no&&(r.voucherNo||r.no)!==v4Edit))return error('ကုန်လက်ခံမှတ်တမ်းအမှတ် အသုံးပြုပြီးဖြစ်သည်။');
    const rows=[...document.querySelectorAll('#receiveLines4 .req-line')].map(el=>{const i=el.dataset.i,bagType=value('rbt'+i),finished=bagType==='finished',weightOnly=bagType==='weight',bags=finished?number('rfc'+i):(weightOnly?0:number('rb'+i)),packageViss=finished?number('rfv'+i):0,qty=finished?packageViss*bags:(weightOnly?number('rwoq'+i):(value('rw'+i)==='yes'?number('rq'+i):0));return {el,product:value('rp'+i),grade:value('rg'+i),bagType,bags,rawBags:finished||weightOnly?0:bags,packageViss,packageCount:finished?bags:0,qty};});
    if(new Set(rows.map(x=>x.product)).size!==rows.length)return error('ကုန်တစ်မျိုးကို တစ်လိုင်းသာ ထည့်ပါ။ ထပ်ထည့်ခွင့် အတည်ပြုရန်ကျန်သည်။');
    if(rows.some(x=>!Number.isFinite(x.qty)||x.qty<0||x.bagType==='finished'&&(!Number.isInteger(x.bags)||x.bags<=0||!(x.packageViss>0)||!(x.qty>0))||x.bagType==='raw'&&(!Number.isInteger(x.bags)||x.bags<=0)||x.bagType==='weight'&&!(x.qty>0)))return error('အမျိုးအစားနှင့် အလေးချိန်ကို ပြန်စစ်ပါ။');
    const old=state.receipts.filter(r=>(r.voucherNo||r.no)===v4Edit);
    if(old.some(r=>r.status==='purchased'))return error('ဈေးဖြတ်ပြီးမှတ်တမ်းကို ပြင်၍မရပါ။');
    const hasPackedLines2=old.some(receiveLineLocked2);
    if(old.filter(r=>!receiveLineLocked2(r)).some(r=>state.lots.filter(l=>l.receiptId===r.id).some(l=>l.warehouse!==r.warehouse||Math.abs(l.qty-r.qty)>.0001)))return error('ကုန်ရွှေ့ထားသည့်မှတ်တမ်းကို ဤနေရာမှ ပြင်၍မရပါ။');

    const advanceAmount=number('fAdvanceAmount')||0,advanceAccount=value('fAdvanceAccount'),advanceReason=value('fAdvanceReason')||'အသုံး';
    const carriage=Math.max(0,number('fCarriageAmount')||0),carriageAccount=value('fCarriageAccount');
    if(advanceAmount<0)return error('ကြိုသုံးငွေကို သုညထက်မနည်း ထည့်ပါ။');
    const oldFirst=old[0],oldExpense=oldFirst?.carriageExpenseId?state.expenses.find(e=>e.id===oldFirst.carriageExpenseId):null;
    if(!hasPackedLines2&&advanceAmount>0){const acc=state.masters.accounts.find(a=>a.id===advanceAccount&&a.active&&a.type!=='home'&&canViewAccount68(a));if(!acc||advanceAmount>bal(acc.id))return error('ရွေးထားသော ငွေစာရင်းတွင် ကြိုသုံးငွေ ထုတ်ရန် ငွေမလောက်ပါ။');}
    if(!hasPackedLines2&&carriage>0){const acc=state.masters.accounts.find(a=>a.id===carriageAccount&&a.active&&a.type!=='home'&&canViewAccount68(a));const refundable=oldExpense&&oldExpense.account===carriageAccount?Number(oldExpense.amount)||0:0;const afterAdvance=bal(carriageAccount)+refundable-(advanceAmount>0&&advanceAccount===carriageAccount?advanceAmount:0);if(!acc||carriage>afterAdvance)return error('တန်ဆာခ ယာယီစိုက်ပေးရန် ရွေးထားသော ငွေစာရင်း လက်ကျန်မလောက်ပါ။');}

    let newIds=[];
    if(v4Edit){
      const ids=applyReceiptLineEdits2(old,rows,no,party,carriage,carriageAccount);
      if(!ids)return;
      newIds=ids;
      if(!hasPackedLines2)for(const [index,id] of newIds.entries()){
        const r=state.receipts.find(r=>r.id===id);
        r.carriageAdvance=index===0?carriage:0;r.carriageAccount=index===0?carriageAccount:'';
      }
    }else{
    rows.forEach((x,index)=>{const id=uid('R'),r={id,no:no+' / '+(index+1),voucherNo:no,date:value('fDate'),partnerId:party.id,name:supplierLabel(party),type:party.type||'trader',product:x.product,grade:x.grade,bagType:x.bagType,rawBags:x.rawBags,bags:x.bags,packageCount:x.packageCount,packageViss:x.packageViss,qty:x.qty,weightKnown:x.qty>0,warehouse:value('fWh'),status:'await',price:null,advance:0,wage:0,weigh:0,paid:0,payments:[],note:value('fNote'),car:value('fCar'),v4:true,carriageAdvance:index===0?carriage:0,carriageAccount:index===0?carriageAccount:''};state.receipts.push(r);newIds.push(id);state.lots.push({id:uid('L'),product:x.product,grade:'စုစုပေါင်း',qty:x.qty,bags:x.bags,rawBags:x.rawBags,packageCount:x.packageCount,packageViss:x.packageViss,bagType:x.bagType,owner:'supplier',name:r.name,cost:0,receiptId:id,warehouse:r.warehouse,batch:no,entryDate:r.date,stockForm:x.bagType==='finished'?'packaged':'loose',weightKnown:r.weightKnown});});
    }

    if(!hasPackedLines2){
    if(advanceAmount>0)issueSupplierAdvance(party.id,advanceAmount,advanceAccount,advanceReason,newIds[0]||'');
    if(oldExpense){
      const oldAmt=Number(oldExpense.amount)||0,oldAcc=oldExpense.account;
      if(carriage<=0){txn(oldAcc,oldAmt,'တန်ဆာခ ယာယီစိုက်ငွေ ပြန်လည်ညှိ','CAR-REV-'+no,supplierLabel(party));state.expenses=state.expenses.filter(e=>e.id!==oldExpense.id);}
      else if(oldAcc===carriageAccount){const delta=oldAmt-carriage;if(delta)txn(oldAcc,delta,'တန်ဆာခ ယာယီစိုက်ငွေ ပြင်ဆင်',oldExpense.id,supplierLabel(party));Object.assign(oldExpense,{date:value('fDate'),amount:carriage,account:carriageAccount,partnerId:party.id,receiptId:newIds[0],recoverable:true,recovered:false});state.receipts.find(r=>r.id===newIds[0]).carriageExpenseId=oldExpense.id;}
      else {txn(oldAcc,oldAmt,'တန်ဆာခ ယာယီစိုက်ငွေ အကောင့်ပြောင်း — ပြန်သွင်း',oldExpense.id,supplierLabel(party));txn(carriageAccount,-carriage,'တန်ဆာခ (ခေါက်ရှည်) ယာယီစိုက်ထုတ်',oldExpense.id,supplierLabel(party));Object.assign(oldExpense,{date:value('fDate'),amount:carriage,account:carriageAccount,partnerId:party.id,receiptId:newIds[0],recoverable:true,recovered:false});state.receipts.find(r=>r.id===newIds[0]).carriageExpenseId=oldExpense.id;}
    }else if(carriage>0){
      const eid=uid('E');state.expenses.push({id:eid,date:value('fDate'),reason:'တန်ဆာခ (ခေါက်ရှည်)',title:'တန်ဆာခ (ခေါက်ရှည်) · ယာယီစိုက်ထုတ်',amount:carriage,account:carriageAccount,partnerId:party.id,receiptId:newIds[0]||'',recoverable:true,recovered:false});txn(carriageAccount,-carriage,'ယာယီစိုက်ထုတ် — တန်ဆာခ (ခေါက်ရှည်)',eid,supplierLabel(party));const first=state.receipts.find(r=>r.id===newIds[0]);if(first)first.carriageExpenseId=eid;activity(supplierLabel(party)+' အတွက် တန်ဆာခ '+cashText(carriage)+' ယာယီစိုက်ပေးခဲ့သည်။');
    }

    }

    audit4(no+' ကုန်လက်ခံမှတ်တမ်း '+(v4Edit?'ပြင်ဆင်':'ဖန်တီး')+'ခဲ့သည်။');v4Kind='';
    if(next==='price'&&newIds.length){save();workDirty=false;closeModal();page='receipts';render();toast('ကုန်လက်ခံမှတ်တမ်း သိမ်းပြီးပါပြီ။ ဈေးဖြတ်ခြင်း ဆက်လုပ်နိုင်ပါပြီ။');purchase4(newIds[0]);}
    else if(next==='new'){save();workDirty=false;closeModal();page='receipts';render();toast('လက်ရှိကုန်သည်၏ ကုန်လက်ခံစာရင်း သိမ်းပြီးပါပြီ။ နောက်ကုန်သည်အတွက် အသစ်ထည့်နိုင်ပါပြီ။');setTimeout(()=>openReceive4(),0);}
    else done4('ကုန်လက်ခံမှတ်တမ်း သိမ်းပြီးပါပြီ။','receipts');
  };

  const chargesForm50=chargesForm4;
  chargesForm4=function(){
    const html=chargesForm50();
    if(v4Kind!=='purchase')return html;
    const carriage=receiptCarriage50();
    return (carriage>0?`<div class="summary-box mb"><div class="summary-line"><span>တန်ဆာခ (ခေါက်ရှည်) · ကုန်လက်ခံချိန် ပွဲရုံမှ ယာယီစိုက်ထား</span><strong>− ${cashText(carriage)}</strong></div><p class="field-help">ကုန်လက်ခံဖောင်တွင် Manual ထည့်ထားသော Amount ဖြစ်ပြီး ဤဈေးဖြတ်စာရင်းတွင် ကုန်သည်ရငွေမှ ပြန်နုတ်ပါမည်။</p></div>`:'')+html;
  };

  const readCharges50=readCharges4;
  readCharges4=function(){
    const c=readCharges50();
    if(v4Kind==='purchase'){const carriage=receiptCarriage50();c.carriage=carriage;c.truck=carriage;}
    return c;
  };

  const calcSale50=calcVoucher4;
  calcVoucher4=function(){
    if(v4Kind!=='purchase')return calcSale50();
    if(document.getElementById('purchaseLaborRows'))purchaseLaborRows().forEach(r=>{const box=document.getElementById('laborCalculation'+r.index);if(box)box.innerHTML=r.rate===null?note('ရွေးထားသောအိတ်ဆိုဒ်၏ တစ်မယ်နှုန်း မသတ်မှတ်ရသေးပါ။','amber'):row4('တစ်မယ်နှုန်း',cashText(r.rate))+row4('ရွေးထားသည့်မယ်',N(r.multiple)+' မယ်')+row4('တစ်အိတ်လုပ်သားခ',`${N(r.rate)} × ${N(r.multiple)} = ${cashText(r.unitRate)}`)+row4('စုစုပေါင်းလုပ်သားခ',`${N(r.unitRate)} × ${N(r.bags)} အိတ် = ${cashText(r.total)}`);});
    const root=document.getElementById('voucherSummary4');if(!root)return;
    const rows=readVoucherLines4(),gross=rows.reduce((n,r)=>n+r.total,0),c=readCharges4(),manual=(c.dynamicRows||[]).reduce((n,x)=>n+x.amount,0),deductionTotal=(c.serviceFee||0)+(c.labor||0)+manual+(c.advance||0)+(c.carriage||0),net=gross-deductionTotal,paid=number('fPaid')||0;
    const sr=c.serviceRateId?deductionRateById(c.serviceRateId):null,serviceLine=c.serviceFee?row4(`ဝန်ဆောင်ခ · ${N(sr?.rate||0)}%`,'− '+cashText(c.serviceFee)):'';
    const laborLine=c.labor?row4('လုပ်သားခ','− '+cashText(c.labor)):'';
    const manualLines=(c.dynamicRows||[]).map(x=>row4(E(x.label)+' · Manual','− '+cashText(x.amount))).join('');
    root.innerHTML=row4('အနုတ်ငွေမနုတ်ခင် စုစုပေါင်း',cashText(gross))+serviceLine+laborLine+(c.carriage?row4('တန်ဆာခ (ခေါက်ရှည်) · ယာယီစိုက်ငွေ ပြန်နုတ်','− '+cashText(c.carriage)):'')+manualLines+(c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု','− '+cashText(c.advance)):'')+row4('စုစုပေါင်းနုတ်ငွေ',cashText(deductionTotal))+row4('အသားတင်',cashText(net))+row4('ယခုငွေရှင်း',cashText(paid))+row4('ပေးရန်ကျန်',cashText(net-paid));
  };

  const chargesSummary50=chargesSummary4;
  chargesSummary4=function(c){
    const html=chargesSummary50(c);
    return c?.carriage?`<div class="summary-box mt">${row4('တန်ဆာခ (ခေါက်ရှည်) · ကုန်လက်ခံချိန် ယာယီစိုက် / ပြန်နုတ်',cashText(c.carriage))}</div>`+html:html;
  };
})();
