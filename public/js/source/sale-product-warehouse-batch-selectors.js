
/* V5.9 — Sales line: choose Product and Warehouse separately, then choose Purchase Batch. */
(function(){
  const addVoucherLine59Base = window.addVoucherLine4;

  function ownedLots59(){
    return (state.lots||[]).filter(l=>l.owner==='owned' && Number(l.qty)>0);
  }
  function unique59(values){ return [...new Set(values)]; }
  function setSelectOptions59(id, options, selected=''){
    const el=document.getElementById(id); if(!el)return;
    el.innerHTML=options.map(([v,t])=>`<option value="${E(v)}" ${String(v)===String(selected)?'selected':''}>${E(t)}</option>`).join('');
  }
  function saleProductOptions59(){
    const names=unique59(ownedLots59().map(l=>l.product)).sort((a,b)=>String(a).localeCompare(String(b)));
    return [['','ကုန်ပစ္စည်း ရွေးပါ'],...names.map(n=>[n,n])];
  }
  function saleWarehouseOptions59(product){
    if(!product)return [['','ဂိုဒေါင် ရွေးပါ']];
    const ids=unique59(ownedLots59().filter(l=>l.product===product).map(l=>l.warehouse));
    return [['','ဂိုဒေါင် ရွေးပါ'],...ids.map(id=>[id,W(id)])];
  }
  function saleBatchOptions59(product,warehouse){
    if(!product||!warehouse)return [['','အဝယ်အသုတ် ရွေးပါ']];
    const lots=ownedLots59().filter(l=>l.product===product&&l.warehouse===warehouse);
    return [['','အဝယ်အသုတ် ရွေးပါ'],...lots.map(l=>[l.id,`${l.batch||'အသုတ်မရှိ'} · ${vissText37(l.qty)} ပိဿာ · ${l.stockForm==='packaged'?'ထုပ်ပိုးပြီး':'မထုပ်ပိုးရသေး'}`])];
  }

  window.saleProductChanged59=function(i){
    const product=value('vsp59'+i);
    const whOpts=saleWarehouseOptions59(product);
    setSelectOptions59('vsw59'+i,whOpts,'');
    setSelectOptions59('vl'+i,[['','အဝယ်အသုတ် ရွေးပါ']],'');
    calcVoucher4();
  };
  window.saleWarehouseChanged59=function(i){
    const product=value('vsp59'+i),warehouse=value('vsw59'+i);
    setSelectOptions59('vl'+i,saleBatchOptions59(product,warehouse),'');
    calcVoucher4();
  };
  window.saleBatchChanged59=function(i){
    calcVoucher4();
  };

  window.addVoucherLine4=function(r={}){
    if(v4Kind!=='sale')return addVoucherLine59Base(r);
    const root=document.getElementById('voucherLines4'); if(!root)return;
    const i=v4Rows++;
    root.insertAdjacentHTML('beforeend',`<section class="req-line" data-i="${i}" data-rid="${r.id||''}">
      <div class="row between mb"><h3>ကုန်လိုင်း ${i+1}</h3>${smallbtn('ဖယ်ရှားမယ်','removeLine4(this)','ghost')}</div>
      <div class="field-row">
        ${selectField('ကုန်ပစ္စည်း','vsp59'+i,saleProductOptions59(),'','onchange="saleProductChanged59('+i+')"')}
        ${selectField('ဂိုဒေါင်','vsw59'+i,[['','ဂိုဒေါင် ရွေးပါ']],'','onchange="saleWarehouseChanged59('+i+')"')}
      </div>
      ${selectField('အဝယ်အသုတ်','vl'+i,[['','အဝယ်အသုတ် ရွေးပါ']],'','onchange="saleBatchChanged59('+i+')"')}
      <div class="field-row">
        ${num4('စုစုပေါင်းပိဿာ','vq'+i,r.qty||'',.001,'oninput="calcVoucher4()"')}
        ${num4('တစ်ယူနစ်ဈေး','vr'+i,r.price||'',.001,'oninput="calcVoucher4()"')}
      </div>
      <div id="lineSummary4${i}" class="muted small"></div>
    </section>`);
    calcVoucher4();
  };
})();
