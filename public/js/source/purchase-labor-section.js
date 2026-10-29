
/* V4.5 — Restore screenshot-style labor charge section in Purchase Pricing. */
(function(){
 const prevChargesForm=chargesForm4;
 chargesForm4=function(){
  if(v4Kind!=='purchase') return prevChargesForm();
  purchaseDeductionRowSeq4=0;
  laborSeq=1;
  return `<details class="req-details mt" open><summary>အဝယ်နုတ်ငွေ ထည့်ရန်</summary>
   <div class="row between wrap mt"><h3>အိတ်ဆိုဒ်အလိုက် လုပ်သားခ</h3></div>
   <p class="small muted mt">တစ်မယ်နှုန်း × မယ် = တစ်အိတ်လုပ်သားခ။ တစ်အိတ်လုပ်သားခ × အိတ်အရေအတွက် = စုစုပေါင်းလုပ်သားခ။</p>
   <div id="purchaseLaborRows">${laborRowHtml(0)}</div>
   ${btn('နောက်ထပ် အိတ်ဆိုဒ် ထည့်မယ်','addLaborRow()','secondary','plus')}
   ${laborEditorPanel()}
   <div class="divider"></div>
   <p class="small muted">လုပ်သားခမှလွဲ၍ “အဝယ် နုတ်ငွေ နှုန်းထား” တွင် Create လုပ်ထားသော အခြားနုတ်ငွေများထဲမှ လိုအပ်တာကို Row အဖြစ် ထည့်သုံးပါ။</p>
   <div id="purchaseDeductionRows4" class="stack-sm mt"></div>
   <div class="mt">${btn('နုတ်ငွေ Row အသစ်ထည့်မယ်','addPurchaseDeductionRow4()','secondary','plus')}</div>
   <div class="divider"></div>${num4('ကြိုသုံးငွေ ပြန်နုတ်ရန်','fAdvance',0,0,'oninput="calcVoucher4()"')}
  </details>`;
 };

 const prevReadCharges=readCharges4;
 readCharges4=function(){
  if(v4Kind!=='purchase') return prevReadCharges();
  const rows=readVoucherLines4();
  const d=readPurchaseDeductionRows4(rows);
  const laborRows=document.getElementById('purchaseLaborRows')?purchaseLaborRows().filter(r=>r.bags>0):[];
  const labor=laborRows.reduce((n,r)=>n+(r.total||0),0);
  return {trip:'',truck:0,laborAuto:labor,labor,laborBasis:'bag-size-multiplier',laborRange:laborRows.map(r=>r.name+' · '+r.weight).join(', '),laborRows,clean:0,plastic:0,sack:0,advance:number('fAdvance')||0,serviceFee:d.total,dynamicRows:d.items,deductionRows:d.items};
 };

 const prevCalc=calcVoucher4;
 calcVoucher4=function(){
  if(v4Kind!=='purchase') return prevCalc();
  if(document.getElementById('purchaseLaborRows')){
   purchaseLaborRows().forEach(r=>{
    const box=document.getElementById('laborCalculation'+r.index);
    if(!box) return;
    box.innerHTML=r.rate===null
      ? note('ရွေးထားသောအိတ်ဆိုဒ်၏ တစ်မယ်နှုန်း မသတ်မှတ်ရသေးပါ။','amber')
      : row4('တစ်မယ်နှုန်း',cashText(r.rate))
       +row4('ရွေးထားသည့်မယ်',N(r.multiple)+' မယ်')
       +row4('တစ်အိတ်လုပ်သားခ',`${N(r.rate)} × ${N(r.multiple)} = ${cashText(r.unitRate)}`)
       +row4('စုစုပေါင်းလုပ်သားခ',`${N(r.unitRate)} × ${N(r.bags)} အိတ် = ${cashText(r.total)}`);
   });
  }
  const root=document.getElementById('voucherSummary4'); if(!root) return;
  const rows=readVoucherLines4(),gross=rows.reduce((n,r)=>n+r.total,0),c=readCharges4();
  const deductionTotal=(c.serviceFee||0)+(c.labor||0)+(c.advance||0),net=gross-deductionTotal,paid=number('fPaid')||0;
  const laborLine=c.labor?row4('လုပ်သားခ','− '+cashText(c.labor)):'';
  const detail=(c.dynamicRows||[]).map(x=>row4(`${E(x.label)} · ${E(x.basis==='percent_total'?N(x.rate)+'%':'တစ်အိတ် '+cashText(x.rate))}`,'− '+cashText(x.amount))).join('');
  root.innerHTML=row4('စုစုပေါင်းကုန်ဖိုး',cashText(gross))+laborLine+detail+(c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု','− '+cashText(c.advance)):'')+row4('စုစုပေါင်းနုတ်ငွေ',cashText(deductionTotal))+row4('အသားတင်',cashText(net))+row4('ယခုငွေရှင်း',cashText(paid))+row4('ပေးရန်ကျန်',cashText(net-paid));
 };

 const prevSummary=chargesSummary4;
 chargesSummary4=function(c){
  if(!Array.isArray(c?.laborRows) && !Array.isArray(c?.dynamicRows)) return prevSummary(c);
  const laborDetail=(c.laborRows||[]).length?`<section class="card mt"><h3>လုပ်သားခ တွက်ချက်မှု</h3>${table4(['အိတ်ဆိုဒ် / အလေးချိန်','တစ်မယ်နှုန်း','မယ်','တစ်အိတ်လုပ်သားခ','အိတ်အရေအတွက်','လုပ်သားခ'],c.laborRows.map(r=>`<tr><td>${E(r.name)}<div class="small muted">${E(r.weight)}</div></td><td>${cashText(r.rate)}</td><td>${N(r.multiple)} မယ်</td><td>${cashText(r.unitRate)}</td><td>${N(r.bags)}</td><td><strong>${cashText(r.total)}</strong></td></tr>`))}</section>`:'';
  const lines=(c.dynamicRows||[]).map(x=>row4(`${E(x.label)} · ${E(x.basis==='percent_total'?N(x.rate)+'%':'တစ်အိတ် '+cashText(x.rate))}`,cashText(x.amount))).join('');
  const total=(c.serviceFee||0)+(c.labor||0)+(c.advance||0);
  return laborDetail+`<details class="req-details mt"><summary>နုတ်ငွေအသေးစိတ်</summary><div class="summary-box">${c.labor?row4('လုပ်သားခ',cashText(c.labor)):''}${lines}${c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု',cashText(c.advance)):''}${row4('စုစုပေါင်းနုတ်ငွေ',cashText(c.total??total))}</div></details>`;
 };
})();
