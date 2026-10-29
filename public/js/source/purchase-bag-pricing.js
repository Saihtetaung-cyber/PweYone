
(function(){
  const prevForm40=voucherForm4;
  const prevRead40=readVoucherLines4;
  const prevGross40=gross;
  const prevChange40=window.priceBagChanged39;
  const prevCalc40=calcVoucher4;
  const prevCommit40=commitVoucher4;
  const original40=r=>(Number(r.rawBags??r.bags)||0);
  const countLabel40='\u1010\u1000\u101a\u103a\u101c\u1000\u103a\u1001\u1036\u1021\u102d\u1010\u103a';
  const rawLabel40='\u1019\u1030\u101c \u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a';
  const unitLabel40='\u1010\u1005\u103a\u1021\u102d\u1010\u103a\u1008\u1031\u1038';
  const totalLabel40='\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038\u1000\u102f\u1014\u103a\u1016\u102d\u102f\u1038';

  // For raw bags, gross depends on the verified number of actually received bags.
  readVoucherLines4=function(){
    const rows=prevRead40();
    if(v4Kind==='purchase')rows.forEach(x=>{
      if(x.r?.bagType==='raw'){
        const bags=x.pricingBags;
        x.total=Number.isInteger(bags)&&bags>0?Math.round(bags*x.price):0;
      }
    });
    return rows;
  };

  // Saved purchase records and printed vouchers must use exactly the same calculation.
  gross=function(r){
    if(r?.priceBasis==='actual_bag')return Math.round((Number(r.priceBags??r.rawBags??r.bags)||0)*(Number(r.price)||0));
    return prevGross40(r);
  };

  voucherForm4=function(rs){
    prevForm40(rs);
    if(v4Kind!=='purchase'||!rs.some(r=>r.bagType==='raw'))return;
    const basis=document.getElementById('fBasis');
    if(basis){
      const bag=basis.querySelector('option[value="bag"]');
      const viss=basis.querySelector('option[value="viss"]');
      if(bag)bag.textContent=unitLabel40+' ('+countLabel40+')';
      if(viss)viss.disabled=true;
      basis.value='bag';
      basis.title='\u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a\u104f \u1008\u1031\u1038\u1010\u103d\u1000\u103a\u1014\u100a\u103a\u1038\u1000\u102d\u102f \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u1008\u1031\u1038\u1021\u1016\u103c\u1005\u103a \u101e\u1010\u103a\u1019\u103e\u1010\u103a\u1011\u102c\u1038\u101e\u100a\u103a\u104b';
    }
    const form=document.getElementById('voucher4');
    if(form){
      const warning=form.querySelector('.note.blue');
      if(warning)warning.textContent='\u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a\u1021\u1010\u103d\u1000\u103a \u1010\u1000\u101a\u103a\u101c\u1000\u103a\u1001\u1036\u1021\u102d\u1010\u103a \u00d7 \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u1008\u1031\u1038 \u1016\u103c\u1004\u1037\u103a \u1000\u102f\u1014\u103a\u1016\u102d\u102f\u1038\u1010\u103d\u1000\u103a\u1015\u102b\u1019\u100a\u103a\u104b \u1019\u1030\u101c\u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a\u1000\u102d\u102f \u1019\u103e\u1010\u103a\u1010\u1019\u103a\u1038\u1021\u1016\u103c\u1005\u103a\u101e\u102c \u1011\u102c\u1038\u101b\u103e\u102d\u1015\u102b\u1019\u100a\u103a\u104b';
      form.querySelectorAll('#voucherLines4 .req-line').forEach(row=>{
        const count=row.querySelector('.pricing-raw-bags39');
        if(!count)return;
        const original=count.querySelector('.pricing-received39 span');
        if(original)original.textContent=rawLabel40+' (\u1000\u102f\u1014\u103a\u101c\u1000\u103a\u1001\u1036\u1001\u103b\u102d\u1014\u103a)';
        const label=count.querySelector('.field label');
        if(label)label.textContent=countLabel40+' (\u1008\u1031\u1038\u1016\u103c\u1010\u103a\u1001\u103b\u102d\u1014\u103a)';
        const help=count.querySelector('.field-help');
        if(help)help.textContent='\u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a \u1015\u102d\u102f/\u101c\u103b\u1031\u102c\u1037\u1014\u102d\u102f\u1004\u103a\u1015\u102b\u101e\u100a\u103a\u104b \u1004\u103d\u1031\u1010\u103d\u1000\u103a\u1001\u103b\u1000\u103a\u1019\u103e\u102f\u1000\u102d\u102f \u1010\u1000\u101a\u103a\u101c\u1000\u103a\u1001\u1036\u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a\u1021\u1015\u1031\u102b\u103a\u101e\u102c \u1019\u1030\u1010\u100a\u103a\u1015\u102b\u1019\u100a\u103a\u104b';
        const unitPrice=row.querySelector('input[id^="vr"]')?.closest('.field')?.querySelector('label');
        if(unitPrice)unitPrice.textContent=unitLabel40;
      });
    }
    prevChange40();
    calcVoucher4();
  };

  window.priceBagChanged39=function(){
    prevChange40();
    if(v4Kind!=='purchase')return;
    let originalSum=0,actualSum=0;
    document.querySelectorAll('#voucherLines4 .pricing-raw-bags39').forEach(section=>{
      const original=Number(section.dataset.originalBags)||0;
      const input=section.querySelector('input');
      const actual=input?.value===''?NaN:Number(input?.value);
      const hint=section.querySelector('.pricing-change39');
      originalSum+=original;
      if(Number.isInteger(actual)&&actual>0){
        actualSum+=actual;
        const difference=actual-original;
        if(hint){
          hint.textContent=difference>0?'\u1021\u102d\u1010\u103a\u1015\u102d\u102f +'+N(difference):difference<0?'\u1021\u102d\u1010\u103a\u101c\u103b\u1031\u102c\u1037 '+N(difference):'\u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a \u1010\u1030\u100a\u102e\u101e\u100a\u103a\u104b';
          hint.classList.toggle('difference40',difference!==0);
        }
      }else if(hint){hint.textContent='\u1010\u1000\u101a\u103a\u101c\u1000\u103a\u1001\u1036\u1021\u102d\u1010\u103a\u1021\u101b\u1031\u1021\u1010\u103d\u1000\u103a\u1000\u102d\u102f \u1000\u102d\u1014\u103a\u1038\u1015\u103c\u100a\u1037\u103a \u1021\u1015\u1031\u102b\u1004\u103a\u1038\u1016\u103c\u1004\u1037\u103a \u1011\u100a\u1037\u103a\u1015\u102b\u104b';hint.classList.add('difference40');}
    });
    const summary=document.getElementById('pricingBagTotal39');
    if(summary)summary.innerHTML=rawLabel40+': <strong>'+N(originalSum)+'</strong> &nbsp; | &nbsp; '+countLabel40+': <strong>'+N(actualSum)+'</strong>';
  };
  calcVoucher4=function(){
    prevCalc40();
    if(v4Kind!=='purchase')return;
    const rows=readVoucherLines4();
    rows.forEach(x=>{
      if(x.r?.bagType!=='raw')return;
      const el=document.getElementById('lineSummary4'+x.i);
      if(el)el.innerHTML=countLabel40+' <strong>'+N(x.pricingBags)+'</strong> \u1021\u102d\u1010\u103a &times; '+unitLabel40+' <strong>'+cashText(x.price)+'</strong> = '+totalLabel40+' <strong>'+cashText(Number.isFinite(x.total)?x.total:0)+'</strong>';
    });
  };
  commitVoucher4=function(){
    if(v4Kind==='purchase'&&!window.v47PurchasePricingEnabled&&readVoucherLines4().some(x=>x.r?.bagType==='raw')&&value('fBasis')!=='bag')return error('\u1021\u1000\u103c\u1019\u103a\u1038\u1021\u102d\u1010\u103a\u104f \u1008\u1031\u1038\u1010\u103d\u1000\u103a\u1014\u100a\u103a\u1038\u1000\u102d\u102f \u1010\u1005\u103a\u1021\u102d\u1010\u103a\u1008\u1031\u1038\u1021\u1016\u103c\u1005\u103a \u101e\u1010\u103a\u1019\u103e\u1010\u103a\u1011\u102c\u1038\u101e\u100a\u103a\u104b');
    return prevCommit40();
  };
})();
