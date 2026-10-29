
/* V4.6 — Labor charge is calculated once for the whole purchase: keep one labor row only. */
(function(){
 const before=chargesForm4;
 chargesForm4=function(){
  if(v4Kind!=='purchase') return before();
  purchaseDeductionRowSeq4=0;
  laborSeq=1;
  return `<details class="req-details mt" open><summary>အဝယ်နုတ်ငွေ ထည့်ရန်</summary>
   <div class="row between wrap mt"><h3>လုပ်သားခ</h3></div>
   <p class="small muted mt">လုပ်သားခကို အဝယ်တစ်စောင်လုံးအတွက် တစ်ကြိမ်တည်း ခြုံတွက်ပါမယ်။</p>
   <div id="purchaseLaborRows">${laborRowHtml(0)}</div>
   <div class="divider"></div>
   <p class="small muted">လုပ်သားခမှလွဲ၍ “အဝယ် နုတ်ငွေ နှုန်းထား” တွင် Create လုပ်ထားသော အခြားနုတ်ငွေများထဲမှ လိုအပ်တာကို Row အဖြစ် ထည့်သုံးပါ။</p>
   <div id="purchaseDeductionRows4" class="stack-sm mt"></div>
   <div class="mt">${btn('နုတ်ငွေ Row အသစ်ထည့်မယ်','addPurchaseDeductionRow4()','secondary','plus')}</div>
   <div class="divider"></div>${num4('ကြိုသုံးငွေ ပြန်နုတ်ရန်','fAdvance',0,0,'oninput="calcVoucher4()"')}
  </details>`;
 };

 /* The purchase form intentionally has no labor-size CRUD panel and no extra labor-row button. */
 const oldCommit=commitVoucher4;
 commitVoucher4=function(){
  if(v4Kind==='purchase' && document.getElementById('purchaseLaborRows')){
   const rows=purchaseLaborRows();
   if(rows.some(r=>!Number.isInteger(r.bags)||r.bags<0||r.bags>0&&(!r.active||r.rate===null||!Number.isInteger(r.multiple)||r.multiple<1||r.multiple>8)))
    return error('လုပ်သားခအတွက် အိတ်ဆိုဒ်၊ တစ်မယ်နှုန်း၊ မယ်နှင့် အိတ်အရေအတွက်ကို ပြန်စစ်ပါ။');
  }
  return bagCommitBase();
 };
})();
