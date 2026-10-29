
/* V6.0 — Sales stock ownership: sell Pwe Yon-owned or supplier-owned stock. */
(function(){
  const voucherForm60Base = window.voucherForm4;
  const addVoucherLine60Base = window.addVoucherLine4;
  const commitVoucher60Base = window.commitVoucher4;
  const renderSaleRows60Base = window.renderSaleRows;
  const saleDetail60Base = window.saleDetail4;
  const printVoucher60Base = window.printVoucher4;

  function saleOwner60(){
    return document.getElementById('fSaleOwner60') ? value('fSaleOwner60') : 'owned';
  }
  function saleSupplier60(){
    return document.getElementById('fSaleSupplier60') ? value('fSaleSupplier60') : '';
  }
  function lotSupplierId60(l){
    if(!l)return '';
    if(l.partnerId)return l.partnerId;
    const r=(state.receipts||[]).find(r=>r.id===l.receiptId);
    return r?.partnerId||'';
  }
  function eligibleSaleLots60(){
    const owner=saleOwner60(),supplierId=saleSupplier60();
    return (state.lots||[]).filter(l=>{
      if(Number(l.qty)<=0 || l.owner!==owner)return false;
      if(owner==='supplier' && (!supplierId || lotSupplierId60(l)!==supplierId))return false;
      return true;
    });
  }
  function unique60(values){ return [...new Set(values)]; }
  function setOptions60(id,options,selected=''){
    const el=document.getElementById(id);if(!el)return;
    el.innerHTML=options.map(([v,t])=>`<option value="${E(v)}" ${String(v)===String(selected)?'selected':''}>${E(t)}</option>`).join('');
  }
  function saleProductOptions60(){
    const names=unique60(eligibleSaleLots60().map(l=>l.product)).sort((a,b)=>String(a).localeCompare(String(b)));
    return [['','ကုန်ပစ္စည်း ရွေးပါ'],...names.map(n=>[n,n])];
  }
  function saleWarehouseOptions60(product){
    if(!product)return [['','ဂိုဒေါင် ရွေးပါ']];
    const ids=unique60(eligibleSaleLots60().filter(l=>l.product===product).map(l=>l.warehouse));
    return [['','ဂိုဒေါင် ရွေးပါ'],...ids.map(id=>[id,W(id)])];
  }
  function saleBatchOptions60(product,warehouse){
    if(!product||!warehouse)return [['','ကုန်အသုတ် ရွေးပါ']];
    const lots=eligibleSaleLots60().filter(l=>l.product===product&&l.warehouse===warehouse);
    return [['','ကုန်အသုတ် ရွေးပါ'],...lots.map(l=>{
      const ownerText=l.owner==='supplier'?'ကုန်သည်ပိုင်':'ပွဲရုံပိုင်';
      return [l.id,`${l.batch||'အသုတ်မရှိ'} · ${vissText37(l.qty)} ပိဿာ · ${l.stockForm==='packaged'?'ထုပ်ပိုးပြီး':'မထုပ်ပိုးရသေး'} · ${ownerText}`];
    })];
  }
  function resetSaleLine60(i){
    setOptions60('vsp59'+i,saleProductOptions60(),'');
    setOptions60('vsw59'+i,[['','ဂိုဒေါင် ရွေးပါ']],'');
    setOptions60('vl'+i,[['','ကုန်အသုတ် ရွေးပါ']],'');
  }
  function resetAllSaleLines60(){
    document.querySelectorAll('#voucherLines4 .req-line').forEach(el=>resetSaleLine60(el.dataset.i));
    calcVoucher4();
  }

  window.saleOwnershipChanged60=function(){
    const owner=saleOwner60(),wrap=document.getElementById('saleSupplierWrap60');
    if(wrap)wrap.style.display=owner==='supplier'?'block':'none';
    if(owner!=='supplier' && document.getElementById('fSaleSupplier60'))document.getElementById('fSaleSupplier60').value='';
    resetAllSaleLines60();
  };
  window.saleSupplierChanged60=function(){ resetAllSaleLines60(); };
  window.saleProductChanged59=function(i){
    const product=value('vsp59'+i);
    setOptions60('vsw59'+i,saleWarehouseOptions60(product),'');
    setOptions60('vl'+i,[['','ကုန်အသုတ် ရွေးပါ']],'');
    calcVoucher4();
  };
  window.saleWarehouseChanged59=function(i){
    const product=value('vsp59'+i),warehouse=value('vsw59'+i);
    setOptions60('vl'+i,saleBatchOptions60(product,warehouse),'');
    calcVoucher4();
  };
  window.saleBatchChanged59=function(i){ calcVoucher4(); };

  window.addVoucherLine4=function(r={}){
    if(v4Kind!=='sale')return addVoucherLine60Base(r);
    const root=document.getElementById('voucherLines4');if(!root)return;
    const i=v4Rows++;
    root.insertAdjacentHTML('beforeend',`<section class="req-line" data-i="${i}" data-rid="${r.id||''}">
      <div class="row between mb"><h3>ကုန်လိုင်း ${i+1}</h3>${smallbtn('ဖယ်ရှားမယ်','removeLine4(this)','ghost')}</div>
      <div class="field-row">
        ${selectField('ကုန်ပစ္စည်း','vsp59'+i,saleProductOptions60(),'','onchange="saleProductChanged59('+i+')"')}
        ${selectField('ဂိုဒေါင်','vsw59'+i,[['','ဂိုဒေါင် ရွေးပါ']],'','onchange="saleWarehouseChanged59('+i+')"')}
      </div>
      ${selectField('ကုန်အသုတ်','vl'+i,[['','ကုန်အသုတ် ရွေးပါ']],'','onchange="saleBatchChanged59('+i+')"')}
      <div class="field-row">
        ${num4('စုစုပေါင်းပိဿာ','vq'+i,r.qty||'',.001,'oninput="calcVoucher4()"')}
        ${num4('တစ်ယူနစ်ဈေး','vr'+i,r.price||'',.001,'oninput="calcVoucher4()"')}
      </div>
      <div id="lineSummary4${i}" class="muted small"></div>
    </section>`);
    calcVoucher4();
  };

  window.voucherForm4=function(rs){
    voucherForm60Base(rs);
    if(v4Kind!=='sale')return;
    const form=document.getElementById('voucher4');if(!form)return;
    const firstRow=form.querySelector('.field-row');if(!firstRow)return;
    const supplierOpts=[['','ကုန်သည် ရွေးပါ'],...partners('supplier').map(p=>[p.id,supplierLabel(p)])];
    firstRow.insertAdjacentHTML('afterend',`<section class="summary-box mt mb" id="saleStockSource60">
      <div class="field-row">
        ${selectField('ရောင်းမည့်ကုန်ပိုင်ဆိုင်မှု','fSaleOwner60',[['owned','ပွဲရုံပိုင်ကုန်'],['supplier','ကုန်သည်ပိုင်ကုန်']],'owned','onchange="saleOwnershipChanged60()"')}
        <div id="saleSupplierWrap60" style="display:none">${selectField('ကုန်သည်','fSaleSupplier60',supplierOpts,'','onchange="saleSupplierChanged60()"')}</div>
      </div>
      <p class="field-help">ကုန်သည်ပိုင်ကုန်ကို ရောင်းမည်ဆိုပါက အရင်ဆုံး ကုန်သည်ကိုရွေးပြီး အဲဒီကုန်သည်ပိုင် လက်ကျန်ကုန်များကိုသာ ရွေးနိုင်ပါမည်။</p>
    </section>`);
    resetAllSaleLines60();
  };

  function validateLabor60(){
    if(!document.getElementById('purchaseLaborRows'))return true;
    const rows=purchaseLaborRows();
    if(rows.some(r=>!Number.isInteger(r.bags)||r.bags<0||(r.bags>0&&(!r.active||r.rate===null||!r.maelId||!(r.multiple>0))))){
      error('အရောင်းလုပ်သားခအတွက် မယ်နှုန်း၊ မယ်နှင့် အိတ်အရေအတွက်ကို ပြန်စစ်ပါ။');
      return false;
    }
    return true;
  }

  window.commitVoucher4=function(){
    if(v4Kind!=='sale')return commitVoucher60Base();
    if(!guardWork()||!validForm('voucher4'))return;
    if(!validateLabor60())return;

    const owner=saleOwner60(),supplierId=saleSupplier60();
    const supplier=owner==='supplier'?supplierBy(supplierId):null;
    if(owner==='supplier'&&!supplier)return error('ကုန်သည်ပိုင်ကုန် ရောင်းမည်ဆိုပါက ကုန်သည်ကို ရွေးပါ။');

    const rows=readVoucherLines4(),c=readCharges4(),g=rows.reduce((n,x)=>n+x.total,0),
      deductions=(c.truck||0)+(c.labor||0)+(c.clean||0)+(c.plastic||0)+(c.sack||0)+(c.advance||0)+(c.serviceFee||0),
      net=g-deductions,paid=number('fPaid'),date=value('fDate'),
      buyer=state.masters.partners.find(p=>p.id===value('fParty')&&p.kind==='buyer');

    if(!buyer)return error('ဝယ်သူကို ရွေးပါ။');
    if(!rows.length||rows.some(x=>!x.product||!(x.qty>0)||!(x.price>0)))return error('ကုန်၊ အလေးချိန်နှင့် ဈေးကို မှန်ကန်စွာထည့်ပါ။');
    if(new Set(rows.map(x=>x.product)).size!==rows.length)return error('ကုန်တစ်မျိုးကို တစ်လိုင်းသာ ထည့်ပါ။');
    if(value('fBasis')==='bag'&&rows.some(x=>!(productStandard(x.product)>0)))return error('ကုန်ပစ္စည်း၏ စံအိတ်ဝင်ပိဿာ သတ်မှတ်ပါ။');
    if(net<0||paid<0||paid>net)return error('နုတ်ငွေ/ငွေရှင်းပမာဏကို ပြန်စစ်ပါ။');

    const badLot=rows.find(x=>{
      if(!x.l||x.qty>x.l.qty+.000001||x.l.owner!==owner)return true;
      if(owner==='supplier'&&lotSupplierId60(x.l)!==supplierId)return true;
      return false;
    });
    if(badLot)return error(owner==='supplier'?'ရွေးထားသော ကုန်သည်ပိုင်ကုန်လက်ကျန် မလောက်ပါ သို့မဟုတ် ကုန်သည်မကိုက်ပါ။':'ရွေးထားသော ပွဲရုံပိုင်ကုန်လက်ကျန် မလောက်ပါ။');

    const splits=splits4(paid,false);if(!splits)return;
    const no='အရ-'+(++state.counter),ids=[],recs=[];let assignedDed=0;
    rows.forEach((x,index)=>{
      const share=index===rows.length-1?deductions-assignedDed:Math.round(deductions*x.total/g);assignedDed+=share;
      const lineNet=x.total-share,cost=takeLot4(x.l,x.qty),id=uid('S'),bags=x.qty/(x.l.packageViss||productStandard(x.product)||1);
      const r={id,no:no+' / '+(index+1),voucherNo:no,date,buyerId:buyer.id,name:buyer.name,product:x.product,grade:'စုစုပေါင်း',qty:x.qty,bags,packageCount:bags,packageViss:x.l.packageViss||0,price:x.price,priceBasis:value('fBasis')==='bag'?'standard_bag':'viss',total:lineNet,grossTotal:x.total,cost,paid:0,payments:[],mode:value('fDelivery'),deliveredQty:value('fDelivery')==='direct'?x.qty:0,deliveredBags:value('fDelivery')==='direct'?bags:0,dispatches:[],warehouse:x.l.warehouse,batch:x.l.batch,sourceLot:x.l.id,sourceOwner:owner,sourceSupplierId:owner==='supplier'?supplierId:'',sourceSupplierName:owner==='supplier'?supplierLabel(supplier):'',v4:true};
      state.sales.push(r);ids.push(id);recs.push(r);
      if(r.mode==='hold'){
        state.lots.push({id:uid('L'),product:x.product,grade:'စုစုပေါင်း',qty:x.qty,bags,packageCount:bags,packageViss:x.l.packageViss||0,owner:'customer',name:buyer.name,cost:Number(x.l.cost)||0,saleId:id,warehouse:x.l.warehouse,batch:x.l.batch,stockForm:x.l.stockForm||'loose',sourceOwner:owner,sourceSupplierId:owner==='supplier'?supplierId:''});
      }else dateMove(x.product,x.qty,'out',no,date,'sale');
    });
    recs[0].charges4={...c,gross:g,serviceFee:c.serviceFee||0,total:deductions};
    allocatePayment4(recs,splits,true,date,no);
    audit4(no+' အရောင်း အတည်ပြုခဲ့သည်။ ကုန်ပိုင်ဆိုင်မှု — '+(owner==='supplier'?'ကုန်သည်ပိုင် · '+supplierLabel(supplier):'ပွဲရုံပိုင်'));
    done4('ကုန်မျိုးစုံ အရောင်းဘောက်ချာ သိမ်းပြီးပါပြီ။','sales');
    v4Kind='';
  };

  function sourceLabel60(s){
    return s?.sourceOwner==='supplier' ? `ကုန်သည်ပိုင် · ${s.sourceSupplierName||supplierLabel(supplierBy(s.sourceSupplierId))||'—'}` : 'ပွဲရုံပိုင်';
  }

  window.renderSaleRows=function(){
    const root=document.getElementById('saleRows');if(!root)return renderSaleRows60Base?.();
    const groups=group4(state.sales).filter(rs=>rs.some(s=>(s.name+s.product+s.no).toLowerCase().includes(searchTerm.toLowerCase()))).filter(rs=>filter==='all'||rs.some(s=>filter==='collect'?saleRemaining(s)>0:filter==='debt'?receivable(s)>0:filter==='delivered'?saleRemaining(s)===0:true));
    root.innerHTML=groups.map(rs=>{const r=rs[0],rem=rs.reduce((n,s)=>n+saleRemaining(s),0),d=rs.reduce((n,s)=>n+receivable(s),0);return `<article class="card mb"><div class="row between wrap"><div><h3>${E(r.name)}</h3><span class="small muted">${E(r.voucherNo||r.no)} · ${shortDate(r.date)} · ${E(sourceLabel60(r))}</span></div>${pill(rem?'ထုတ်ပေးရန်ကျန်':'ထုတ်ပေးပြီး',rem?'blue':'')}</div><div class="req-chip-row">${rs.map(s=>`<span>${E(s.product)} · ${vissText37(s.qty)} ပိဿာ · ${E(W(s.warehouse))}</span>`).join('')}</div><div class="row between wrap mt"><strong>ရရန် ${cashText(d)}</strong><div class="row wrap">${btn('အသေးစိတ်',`saleDetail4('${r.id}')`,'secondary','eye')}${d?btn('ငွေလက်ခံမယ်',`payVoucher4('sale','${r.id}')`,'primary','wallet')+smallbtn('တောင်းခံလက်မှတ်',`openSlip4('${r.id}')`,'secondary','print'):''}</div></div></article>`;}).join('')||empty('အရောင်းမှတ်တမ်း မရှိပါ။');
  };

  window.saleDetail4=function(id){
    const rs=voucherRecords4('sale',id),r=rs[0];if(!r)return saleDetail60Base(id);
    openModal('အရောင်းအသေးစိတ်',r.name+' · '+(r.voucherNo||r.no),
      `<div class="summary-box mb">${row4('ရောင်းသည့်ကုန်ပိုင်ဆိုင်မှု',E(sourceLabel60(r)))}</div>`+
      table4(['ကုန် / အသုတ်','ဂိုဒေါင်','ပိဿာ','တန်ဖိုး','ကုန်ထုတ်'],rs.map(s=>`<tr><td>${E(s.product)}<div class="small muted">${E(s.batch||'—')}</div></td><td>${E(W(s.warehouse))}</td><td>${vissText37(s.qty)}</td><td>${cashText(s.total)}</td><td>${saleRemaining(s)>0?smallbtn('ထုတ်ပေးမယ်',`dispatch4('${s.id}')`,'primary'):pill('ထုတ်ပြီး')}</td></tr>`))+
      `<div class="summary-box mt">${row4('စုစုပေါင်း',cashText(rs.reduce((n,s)=>n+s.total,0)))}${row4('ရရန်ကျန်',cashText(rs.reduce((n,s)=>n+receivable(s),0)))}</div>`+(r.charges4?chargesSummary4(r.charges4):'')+`<h3 class="mt">ငွေပေးချေနည်းအလိုက် လက်ခံမှတ်တမ်း</h3>${paymentHistory(rs.flatMap(s=>s.payments||[]),false)}`,
      btn('ပြန်မယ်','closeModal()','secondary')+btn('ဘောက်ချာ Print',`printVoucher4('sale','${id}')`,'secondary','print')+(rs.some(s=>receivable(s)>0)?btn('ငွေလက်ခံမယ်',`payVoucher4('sale','${id}')`):''),true);
  };

  window.printVoucher4=function(kind,id){
    if(kind!=='sale')return printVoucher60Base(kind,id);
    const rs=voucherRecords4('sale',id),r=rs[0];if(!r)return;
    printDocument('အရောင်းဘောက်ချာ',r.voucherNo||r.no,`<p>${E(r.name)} · ${shortDate(r.date)}</p><p>ကုန်ပိုင်ဆိုင်မှု — ${E(sourceLabel60(r))}</p>`+table4(['ကုန်','ပိဿာ','တန်ဖိုး'],rs.map(x=>`<tr><td>${E(x.product)}</td><td>${vissText37(x.qty)}</td><td>${cashText(x.total)}</td></tr>`)));
  };
})();
