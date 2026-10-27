
/* V4.7 — remove the redundant “လုပ်သားခ 1” row heading and make deduction-rate creation horizontal. */
(function(){
  const oldLaborRowHtml = laborRowHtml;
  laborRowHtml = function(i){
    const html = oldLaborRowHtml(i);
    return html.replace(/<div class="row between mb"><h3>လုပ်သားခ \${i\+1}<\/h3>.*?<\/div>/, '')
               .replace(/<div class="row between mb"><h3>လုပ်သားခ [^<]*<\/h3>.*?<\/div>/, '');
  };

  deductionEditor = function(){
    if(!deductionEditId)return '';
    ensureDeductionRateMastersV43();
    const r=deductionEditId==='__new__'?null:deductionRateById(deductionEditId);
    const itemType=r?.itemType||'service',basis=r?.basis||'per_bag',applyAt=r?.applyAt||'purchase';
    const customWrap=`<div id="drCustomTypeWrap" class="deduction-custom-field ${itemType==='custom'?'':'hide'}">${field('နုတ်ငွေအမည်','drCustomType',{value:r?.customType||'',placeholder:'ဥပမာ ကုန်တင်ခ / အုပ်ချုပ်ခ / စိတ်ကြိုက်အမည်'})}</div>`;
    return `<section class="card mt"><h3>${r?'နုတ်ငွေနှုန်းထား ပြင်မယ်':'နုတ်ငွေနှုန်းထား အသစ်ထည့်မယ်'}</h3>
      <p class="small muted mt">စာရင်းထဲရှိအမျိုးအစားကို ရွေးနိုင်သလို “စိတ်ကြိုက် အသစ်ဖန်တီးမည်” ကိုရွေးပြီး မိမိလိုချင်သည့် နုတ်ငွေအမည်အသစ်ကိုလည်း Create လုပ်နိုင်သည်။</p>
      <div class="deduction-editor-horizontal">
        ${selectField('နုတ်ငွေအမျိုးအစား','drItemType',deductionItemChoices,itemType,'onchange="toggleDeductionItemV43()"')}
        ${selectField('အသုံးပြုမည့်အချိန်','drApplyAt',deductionStageChoices,applyAt)}
        ${selectField('တွက်ချက်ပုံ','drBasis',[['per_bag','တစ်အိတ်နှုန်း'],['percent_total','ကုန်ဖိုး / ရောင်းရငွေစုစုပေါင်း၏ %']],basis,'onchange="toggleDeductionBasis()"')}
        ${field('နှုန်းထား','drRate',{type:'number',min:0,step:.1,value:r?.rate??'',required:true,extra:'inputmode="decimal"'})}
        ${selectField('အခြေအနေ','drActive',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],r?.active===false?'no':'yes')}
        ${customWrap}
      </div>
      <p id="drUnitHelp" class="field-help">${basis==='percent_total'?'ရာခိုင်နှုန်း ဥပမာ 0.5 / 1 / 1.5 / 2 / 2.5 / 3':'တစ်အိတ်လျှင် ကျပ်ငွေနှုန်း'}</p>
      <div class="deduction-editor-actions">${btn('မသိမ်းတော့ပါ','cancelDeductionRate()','secondary')}${btn('သိမ်းမယ်','saveDeductionRate()','primary','check')}</div>
    </section>`;
  };
})();
