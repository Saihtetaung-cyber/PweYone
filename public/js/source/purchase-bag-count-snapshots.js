
/* V39: keep received rawBags unchanged; priceBags is the saved final pricing count. */
(function(){
 const line39=addVoucherLine4;
 const read39=readVoucherLines4;
 const form39=voucherForm4;
 const commit39=commitVoucher4;
 const deductionBag39=purchaseDeductionBagCount4;
 const originalRaw39=r=>(Number(r.rawBags??r.bags)||0);

 addVoucherLine4=function(r={}){
   line39(r);
   if(v4Kind!=='purchase'||r.bagType!=='raw')return;
   const row=Array.from(document.querySelectorAll('#voucherLines4 .req-line')).find(el=>el.dataset.rid===r.id);
   if(!row)return;
   const i=row.dataset.i,received=originalRaw39(r),initial=Number(r.priceBags??received);
   const firstField=row.querySelector('.field-row');if(!firstField)return;
   firstField.insertAdjacentHTML('beforebegin',`<section class="pricing-raw-bags39" data-original-bags="${received}">
     <div class="pricing-received39"><span>\u1000\u102f\u1014\u103a\u101c\u1000\u103a\u1001\u1036\u1011\u102c\u1038\u101e\u1031\u102c \u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a</span><strong>${N(received)}</strong></div>
     ${field('\u1008\u1031\u1038\u1016\u103c\u1010\u103a\u1019\u100a\u1037\u103a \u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a','vpriceBags39'+i,{type:'number',min:1,step:1,value:Number.isInteger(initial)&&initial>0?initial:received,required:true,extra:'oninput="priceBagChanged39()"',help:'\u1000\u102f\u1014\u103a\u101c\u1000\u103a\u1001\u1036\u1019\u103e Auto \u1016\u103c\u100a\u1037\u103a\u1011\u102c\u1038\u101e\u100a\u103a\u104b \u1008\u1031\u1038\u1016\u103c\u1010\u103a\u1001\u103b\u102d\u1014\u103a\u1010\u103d\u1004\u103a \u101c\u102d\u102f\u1021\u1015\u103a\u101e\u101c\u102d\u102f \u1015\u103c\u1004\u103a\u1014\u102d\u102f\u1004\u103a\u101e\u100a\u103a\u104b'})}
     <p class="pricing-change39" id="vpriceBagDiff39${i}" aria-live="polite"></p>
   </section>`);
 };
 readVoucherLines4=function(){
   const rows=read39();
   if(v4Kind==='purchase')rows.forEach(x=>{
     if(x.r?.bagType==='raw'){
       const el=document.getElementById('vpriceBags39'+x.i);
       x.pricingBags=el?Number(el.value):Number(x.r.priceBags??originalRaw39(x.r));
     }
   });
   return rows;
 };
 purchaseDeductionBagCount4=function(rows){
   if(v4Kind!=='purchase')return deductionBag39(rows);
   return rows.reduce((total,x)=>{
     if(x.r?.bagType==='raw')return total+(Number.isFinite(x.pricingBags)?x.pricingBags:originalRaw39(x.r));
     if(x.r?.bagType==='finished')return total+(Number(x.r.packageCount??x.r.bags)||0);
     const std=productStandard(x.product)||0;
     return total+(std>0?(Number(x.qty)||0)/std:0);
   },0);
 };

 window.priceBagChanged39=function(){
   if(v4Kind!=='purchase')return;
   let receivedTotal=0,finalTotal=0;
   document.querySelectorAll('#voucherLines4 .pricing-raw-bags39').forEach(section=>{
      const el=section.querySelector('input'),received=Number(section.dataset.originalBags)||0;
      const final=el?.value===''?0:Number(el?.value),n=Number.isFinite(final)?final:0;
      receivedTotal+=received;finalTotal+=n;
      const hint=section.querySelector('.pricing-change39');
      if(hint)hint.textContent=n===received?'':('('+N(received)+' \u2192 '+N(n)+')');
   });
   const summary=document.getElementById('pricingBagTotal39');
   if(summary)summary.innerHTML='\u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038: <strong>'+N(receivedTotal)+' \u2192 '+N(finalTotal)+'</strong>';
   const labor=document.getElementById('laborBags0');
   if(labor&&labor.dataset.priceBagManual39!=='yes'){
      const rows=readVoucherLines4();
      const all=purchaseDeductionBagCount4(rows);
      labor.value=Number.isInteger(all)?all:Math.round(all*1000)/1000;
   }
   calcVoucher4();
 };
 voucherForm4=function(rs){
    form39(rs);
    if(v4Kind!=='purchase')return;
    const root=document.getElementById('voucherLines4');
    if(root&&root.querySelector('.pricing-raw-bags39')){
       root.insertAdjacentHTML('afterend','<div id="pricingBagTotal39" class="pricing-bag-total39" aria-live="polite"></div>');
       const labor=document.getElementById('laborBags0');
       if(labor)labor.addEventListener('input',()=>{labor.dataset.priceBagManual39='yes';});
       priceBagChanged39();
    }
 };
 commitVoucher4=function(){
   if(v4Kind==='purchase'){
     const rows=readVoucherLines4();
     if(rows.some(x=>x.r?.bagType==='raw'&&(!Number.isInteger(x.pricingBags)||x.pricingBags<=0)))
       return error('\u1008\u1031\u1038\u1016\u103c\u1010\u103a\u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a\u1000\u102d\u102f \u1021\u1015\u1031\u102b\u1004\u103a\u1038\u1000\u102d\u1014\u103a\u1038\u1015\u103c\u100a\u1037\u103a\u1016\u103c\u1004\u1037\u103a \u1011\u100a\u1037\u103a\u1015\u102b\u104b');
   }
   return commit39();
 };
})();
