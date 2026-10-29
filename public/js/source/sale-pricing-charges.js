
/* V5.8 — Sales pricing flow mirrors Purchase: multi-product + Service/Labor auto + other deductions manual. */
(function(){
  let saleDeductionSeq58=0;

  function dedName58(r){
    return String(r?.displayName||r?.customType||r?.name||'').trim();
  }
  function saleServiceRules58(){
    return deductionRatesFor('sale',true).filter(r=>r.calcMode==='service_percent');
  }
  function saleManualRules58(){
    return deductionRatesFor('sale',true).filter(r=>r.calcMode==='manual');
  }
  function saleServiceField58(){
    const opts=saleServiceRules58();
    return `<div class="field mt">${selectField('ဝန်ဆောင်ခ','saleService58',[['','မသုံးပါ'],...opts.map(r=>[r.id,(typeof deductionOptionLabel==='function'?deductionOptionLabel(r):dedName58(r)+' · '+N(r.rate||0)+'%')])],opts[0]?.id||'','onchange="calcVoucher4()"')}<p class="field-help">အနုတ်ငွေများ မနုတ်ခင် အရောင်းစုစုပေါင်းပေါ်မှ ရာခိုင်နှုန်းအလိုက် Auto တွက်မည်။</p></div>`;
  }

  window.addSaleDeductionRow58=function(rateId=''){
    const root=document.getElementById('saleDeductionRows58');if(!root)return;
    const opts=saleManualRules58();
    if(!opts.length)return error('အရောင်းတွင် Manual အသုံးပြုမည့် နုတ်ငွေအမျိုးအစားကို “နုတ်ငွေ နှုန်းထား” တွင် အရင် Create လုပ်ပြီး အသုံးပြုမည့်အချိန်ကို “ကုန်ရောင်းချိန်” သို့မဟုတ် “နှစ်မျိုးလုံး” ရွေးပါ။');
    const i=saleDeductionSeq58++;
    root.insertAdjacentHTML('beforeend',`<section class="card sale-deduction-row58" data-i="${i}"><div class="row between wrap"><strong>နုတ်ငွေ ${i+1}</strong>${smallbtn('ဖယ်ရှားမယ်','this.closest(\'.sale-deduction-row58\').remove();calcVoucher4()','ghost')}</div><div class="field-row mt">${selectField('နုတ်ငွေအမျိုးအစား','sdr58'+i,[['','ရွေးပါ'],...opts.map(r=>[r.id,dedName58(r)])],rateId,'onchange="calcVoucher4()"')}<div>${field('ငွေပမာဏ','sda58'+i,{type:'number',min:0,step:1,value:0,suffix:'ကျပ်',extra:'oninput="calcVoucher4()"'})}</div></div></section>`);
    calcVoucher4();
  };

  function readSaleManual58(){
    const seen=new Set(),items=[];
    document.querySelectorAll('#saleDeductionRows58 .sale-deduction-row58').forEach(el=>{
      const i=el.dataset.i,id=value('sdr58'+i);if(!id||seen.has(id))return;seen.add(id);
      const rule=deductionRateById(id);
      if(!deductionApplicable(rule,'sale')||rule.calcMode!=='manual')return;
      const amount=Math.max(0,number('sda58'+i)||0);
      items.push({rateId:id,itemType:rule.itemType,customType:rule.customType||'',label:dedName58(rule),basis:'manual',rate:0,amount});
    });
    return items;
  }

  const chargesForm58Base=chargesForm4;
  chargesForm4=function(){
    if(v4Kind!=='sale')return chargesForm58Base();
    saleDeductionSeq58=0;laborSeq=1;
    return `<details class="req-details mt" open><summary>အရောင်း ထပ်ပေါင်းငွေ ထည့်ရန်</summary>
      ${saleServiceField58()}
      <div class="row between wrap mt"><h3>လုပ်သားခ</h3></div>
      <p class="small muted mt">အဝယ် Flow အတိုင်း မယ်နှုန်း × မယ် × အိတ်အရေအတွက်ဖြင့် အရောင်းတစ်စောင်လုံးအတွက် Auto တွက်ပါမယ်။</p>
      <div id="purchaseLaborRows">${laborRowHtml(0)}</div>
      <div class="divider"></div>
      <p class="small muted">ဝန်ဆောင်ခနှင့် လုပ်သားခမှလွဲ၍ အရောင်းအတွက် Create လုပ်ထားသော အခြားထပ်ပေါင်းငွေများကို လိုအပ်သလို Row ထည့်ပြီး Amount ကို Manual ရိုက်ထည့်ပါ။</p>
      <div id="saleDeductionRows58" class="stack-sm mt"></div>
      <div class="mt">${btn('ထပ်ပေါင်းငွေ Row အသစ်ထည့်မယ်','addSaleDeductionRow58()','secondary','plus')}</div>
    </details>`;
  };

  const readCharges58Base=readCharges4;
  readCharges4=function(){
    const base=readCharges58Base();
    if(v4Kind==='purchase'){
      /* Generic voucher commit still reads `truck`; carry dynamic manual purchase rows into it. */
      const manual=(base.dynamicRows||base.deductionRows||[]).reduce((n,x)=>n+(Number(x.amount)||0),0);
      base.truck=(Number(base.carriage)||0)+manual;
      return base;
    }
    if(v4Kind!=='sale')return base;
    const rows=readVoucherLines4(),gross=rows.reduce((n,r)=>n+r.total,0);
    const serviceRule=deductionRateById(value('saleService58'));
    const serviceFee=serviceRule?.calcMode==='service_percent'&&deductionApplicable(serviceRule,'sale')?Math.round(gross*(Number(serviceRule.rate)||0)/100):0;
    const laborRows=document.getElementById('purchaseLaborRows')?purchaseLaborRows().filter(r=>r.bags>0):[];
    const labor=laborRows.reduce((n,r)=>n+(Number(r.total)||0),0);
    const manualRows=readSaleManual58();
    const manualTotal=manualRows.reduce((n,x)=>n+x.amount,0);
    return {
      trip:'',truck:manualTotal,laborAuto:labor,labor,
      laborBasis:'mael-rate',laborRange:laborRows.map(r=>r.maelName||r.name||'').join(', '),laborRows,
      clean:0,plastic:0,sack:0,advance:0,
      serviceRateId:serviceRule?.id||'',serviceRateBasis:'percent_total',serviceRateValue:Number(serviceRule?.rate)||0,serviceFee,
      dynamicRows:manualRows,deductionRows:manualRows
    };
  };

  const calcVoucher58Base=calcVoucher4;
  calcVoucher4=function(){
    if(v4Kind!=='sale')return calcVoucher58Base();
    const root=document.getElementById('voucherSummary4');if(!root)return;
    const rows=readVoucherLines4();
    rows.forEach(r=>{
      const node=document.getElementById('lineSummary4'+r.i);if(!node)return;
      node.innerHTML=`${value('fBasis')==='bag'?'စံအိတ်ဝင် '+vissText37(productStandard(r.product))+' ပိဿာ · ':''}ကုန်ဖိုး <strong>${cashText(r.total)}</strong>${r.l?' · ရနိုင်လက်ကျန် '+vissText37(r.l.qty)+' ပိဿာ · '+E(r.l.stockForm==='packaged'?'ထုပ်ပိုးပြီး':'မထုပ်ပိုးရသေး'):''}`;
    });
    if(document.getElementById('purchaseLaborRows')){
      purchaseLaborRows().forEach(r=>{
        const box=document.getElementById('laborCalculation'+r.index);if(!box)return;
        box.innerHTML=(r.rate===null||!r.maelId)
          ?note('မယ်နှုန်းနှင့် မယ်ကို ရွေးပါ။','amber')
          :row4('မယ်နှုန်း',cashText(r.rate)+' / မယ်')+row4('ရွေးထားသည့်မယ်',E(r.maelName||N(r.multiple)+' မယ်'))+row4('တစ်အိတ်လုပ်သားခ',`${N(r.rate)} × ${N(r.multiple)} = ${cashText(r.unitRate)}`)+row4('စုစုပေါင်းလုပ်သားခ',`${N(r.unitRate)} × ${N(r.bags)} အိတ် = ${cashText(r.total)}`);
      });
    }
    const gross=rows.reduce((n,r)=>n+r.total,0),c=readCharges4(),manual=(c.dynamicRows||[]).reduce((n,x)=>n+x.amount,0);
    const deductionTotal=(c.serviceFee||0)+(c.labor||0)+manual,net=gross+deductionTotal,paid=number('fPaid')||0;
    const sr=c.serviceRateId?deductionRateById(c.serviceRateId):null;
    const serviceLine=c.serviceFee?row4(`ဝန်ဆောင်ခ · ${N(c.serviceRateValue||sr?.rate||0)}%`,'+ '+cashText(c.serviceFee)):'';
    const laborLine=c.labor?row4('လုပ်သားခ','+ '+cashText(c.labor)):'';
    const manualLines=(c.dynamicRows||[]).map(x=>row4(E(x.label)+' · Manual','+ '+cashText(x.amount))).join('');
    root.innerHTML=row4('စုစုပေါင်းကုန်ဖိုး',cashText(gross))+serviceLine+laborLine+manualLines+row4('စုစုပေါင်း ထပ်ပေါင်းငွေ',cashText(deductionTotal))+row4('စုစုပေါင်း ကျသင့်ငွေ',cashText(net))+row4('ယခုလက်ခံငွေ',cashText(paid))+row4('ရရန်ကျန်',cashText(net-paid));
  };

  const commitVoucher58Base=commitVoucher4;
  commitVoucher4=function(){
    if(v4Kind==='sale'&&document.getElementById('purchaseLaborRows')){
      const rows=purchaseLaborRows();
      if(rows.some(r=>!Number.isInteger(r.bags)||r.bags<0||(r.bags>0&&(!r.active||r.rate===null||!r.maelId||!(r.multiple>0)))))
        return error('အရောင်းလုပ်သားခအတွက် မယ်နှုန်း၊ မယ်နှင့် အိတ်အရေအတွက်ကို ပြန်စစ်ပါ။');
    }
    return commitVoucher58Base();
  };

  /* Make the shared sale entry read like the purchase pricing flow. */
  const voucherForm58Base=voucherForm4;
  voucherForm4=function(rs){
    voucherForm58Base(rs);
    if(v4Kind!=='sale')return;
    const head=document.querySelector('#modalRoot .modal-head h2');
    const sub=document.querySelector('#modalRoot .modal-head p');
    if(head)head.textContent='ဈေးဖြတ် ရောင်းချမယ်';
    if(sub)sub.textContent='အဝယ် Flow အတိုင်း ကုန်မျိုးစုံ၊ ဈေးတွက်နည်း၊ နုတ်ငွေ၊ ငွေလက်ခံမှုနှင့် ကုန်ထုတ်ပုံကို တစ်စောင်တည်းတွင် ဆောင်ရွက်နိုင်သည်။';
  };
})();
