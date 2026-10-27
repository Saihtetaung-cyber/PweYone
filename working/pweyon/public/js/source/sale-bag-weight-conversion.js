
/* V46 - sale-only helper: pricing stays independent of buyer bag size.
   per-viss price = total viss * rate;
   standard-bag price = (total viss / product standard viss) * rate. */
(function(){
 'use strict';
 const M={
  bag:"\u101d\u101a\u103a\u101e\u1030\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u101e\u1031\u102c \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u101d\u1004\u103a",
  viss:"\u1015\u102d\u103f\u102c",
  vissPrice:"\u1010\u1005\u103a\u1015\u102d\u103f\u102c\u1008\u1031\u1038",
  stdPrice:"\u1010\u1005\u103a\u1005\u1036\u1021\u102d\u1010\u103a\u1008\u1031\u1038",
  stdWeight:"\u1005\u1036\u1021\u102d\u1010\u103a\u101d\u1004\u103a",
  amount:"\u1000\u102f\u1014\u103a\u1016\u102d\u102f\u1038"
 };
 window.saleDesiredBagChanged46=function(i){
   if(v4Kind!=='sale')return;
   const bags=document.getElementById('vbag43'+i),weight=document.getElementById('vBuyerBag46'+i),qty=document.getElementById('vq'+i);
   if(bags&&qty&&weight&&bags.value!==''){
     const n=Number(bags.value),v=Number(weight.value);
     qty.value=Number.isInteger(n)&&n>0&&v>0&&Number.isFinite(v)?String(Math.round(n*v*1000)/1000):'';
   }
   calcVoucher4();
 };
 const oldCalc46=calcVoucher4;
 calcVoucher4=function(){
   oldCalc46();
   if(v4Kind!=='sale')return;
   const basis=value('fBasis')==='bag'?'bag':'viss';
   const rows=readVoucherLines4();
   rows.forEach(r=>{
     const i=r.i,pr=document.getElementById('vr'+i),label=pr?.closest('.field')?.querySelector('label');
     if(label)label.textContent=basis==='bag'?M.stdPrice:M.vissPrice;
     const node=document.getElementById('lineSummary4'+i);
     if(!node)return;
     const std=productStandard(r.product)||0,desired=Number(value('vBuyerBag46'+i))||0;
     const formula=(basis==='viss')
       ?`${vissText37(r.qty)} ${M.viss} \u00d7 ${cashText(r.price)}`
       :(std>0?`${vissText37(r.qty)} ${M.viss} \u00f7 ${vissText37(std)} ${M.viss} \u00d7 ${cashText(r.price)}`:'--');
     const bags=value('vbag43'+i),countText=bags!==''?`${N(Number(bags))} \u1021\u102d\u1010\u103a \u00d7 ${vissText37(desired)} ${M.viss} = ${vissText37(r.qty)} ${M.viss}`:'';
     const existing=node.innerHTML;
     // Old summary is retained; show explicit formula and buyer bag conversion below.
     node.innerHTML=existing+`<div class="v46-pricing-hint">${M.bag}: <strong>${desired>0?vissText37(desired):'--'} ${M.viss}</strong>`+
       (countText?`<div>${countText}</div>`:'')+`<div>${basis==='bag'?M.stdPrice+' ('+M.stdWeight+' '+vissText37(std)+' '+M.viss+')':M.vissPrice}: <strong>${formula} = ${cashText(r.total)}</strong></div></div>`;
   });
 };
 document.title='\u1015\u103d\u1032\u101b\u102f\u1036 - V46 Buyer Bag Size & Sale Pricing';
})();
