
/* Display only: current lot bags beside the existing warehouse/batch weight. */
window.stockBagCell2=function(l){
 const count=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))&&Number.isInteger(Number(x))&&Number(x)>=0;
 const show=(n,title='')=>'<div class="stock-bags2"'+(title?' title="'+E(title)+'"':'')+'>'+N(n)+' အိတ်</div>';
 const unavailable=()=>'<div class="stock-bags2 stock-bags2-unknown" title="အိတ်အရေအတွက် မမှတ်ထားပါ။">— အိတ်</div>';
 if(l.stockForm==='packaged'){
  const size=Number(l.packageViss),qty=Number(l.qty);
  if(l.weightKnown===false||!Number.isFinite(size)||size<=0||!Number.isFinite(qty)||qty<0)return unavailable();
  const recorded=l.packageCount??l.bags;
  if(recorded!==undefined&&recorded!==null&&recorded!==''){
   if(count(recorded)&&Math.abs(Number(recorded)*size-qty)<.000001)return show(Number(recorded));
   return '<div class="stock-bags2 stock-bags2-check" title="အိတ်အရေအတွက်နှင့် ပိဿာ မကိုက်ပါ။">အိတ်စာရင်း စစ်ဆေးရန်</div>';
  }
  const calculated=qty/size,whole=Math.round(calculated);
  return Math.abs(calculated-whole)<.000001?show(whole,'တစ်အိတ်ဝင်ပိဿာအရ တွက်ထားပါသည်။'):unavailable();
 }
 if(l.transferBagsKnown2===false)return unavailable();
 if(count(l.actualBags))return show(Number(l.actualBags));
 if(count(l.bags)&&(Number(l.bags)>0||l.bagType==='raw'))return show(Number(l.bags));
 return unavailable();
};

