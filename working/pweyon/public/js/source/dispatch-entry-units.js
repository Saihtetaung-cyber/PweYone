
/* Dispatch entry units only. Existing lot selection, validation and stock-posting engine are retained. */
(function(){
 'use strict';
 const originalDispatch=dispatch4,originalOpenDispatch=openDispatch,originalSave=saveDispatch4;
 const tolerance=0.000001;
 const quantityText=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:6}).format(Number(n)||0);
 const inputNumber=n=>String(Number(Number(n).toFixed(12)));
 function context(form){
  const sale=state.sales.find(s=>s.id===form.dataset.dispatchSale2);
  const lot=state.lots.find(l=>l.id===form.querySelector('#dLot')?.value&&l.saleId===sale?.id&&l.owner==='customer');
  const remaining=sale?saleRemaining(sale):0,available=lot?Math.max(0,Math.min(Number(lot.qty)||0,remaining)):0;
  // Prefer the selected lot's bag size. Fall back only to existing lot/sale quantities or saved bag sizes.
  const sizes=[Number(lot?.packageViss),lot?.bags>0?Number(lot.qty)/Number(lot.bags):0,Number(sale?.buyerBagViss46),Number(sale?.packageViss),sale?.bags>0?Number(sale.qty)/Number(sale.bags):0];
  const size=lot?(sizes.find(n=>Number.isFinite(n)&&n>0)||0):0;
  return {sale,lot,available,size};
 }
 function errorText(form,message,field){
  error(message);if(field){field.setAttribute('aria-invalid','true');field.focus({preventScroll:true});}
 }
 function rememberEquivalent(form){
  const weight=form.querySelector('#dQty'),bags=form.querySelector('#dispatchBagCount2'),{size}=context(form),q=number('dQty');
  bags.value=Number.isFinite(q)&&size>0?inputNumber(q/size):'';
  bags.dataset.generatedValue=bags.value;bags.dataset.exactWeight=weight.value;
 }
 function applyBags(form){
  const weight=form.querySelector('#dQty'),bags=form.querySelector('#dispatchBagCount2'),{size}=context(form);
  if(!bags.value.trim()||!Number.isFinite(Number(bags.value))||!(size>0)){weight.value='';return;}
  weight.value=bags.value===bags.dataset.generatedValue?bags.dataset.exactWeight:inputNumber(Number(bags.value)*size);
  const hint=form.querySelector('[data-weight-guide="dQty"]');if(hint)hint.textContent=weight.value?vissBreakdown37(Number(weight.value)):'';
 }
 function refresh(form){
  const {available,size}=context(form),mode=form.querySelector('#dispatchUnit2'),bags=form.querySelector('#dispatchBagCount2');
  mode.querySelector('option[value="bags"]').disabled=!(size>0);
  if(!(size>0))mode.value='viss';
  const bagMode=mode.value==='bags';
  form.querySelector('.dispatch-weight-field2').hidden=bagMode;
  form.querySelector('.dispatch-bag-field2').hidden=!bagMode;
  bags.disabled=!bagMode;bags.required=bagMode;
  if(size>0)bags.max=inputNumber(available/size);else bags.removeAttribute('max');
  form.querySelector('#dispatchAvailable2').textContent=quantityText(available)+' ပိဿာ'+(size>0?' · '+quantityText(available/size)+' အိတ်':'');
  form.querySelector('#dispatchBagSize2').textContent=size>0?quantityText(size)+' ပိဿာ':'မသတ်မှတ်ရသေး';
  form.querySelector('#dispatchBagMissing2').hidden=size>0;
  const q=number('dQty'),output=form.querySelector('#dispatchEquivalentValue2');
  form.querySelector('#dispatchEquivalentLabel2').textContent=bagMode?'ထုတ်ပေးမည့်ပိဿာ':'ညီမျှသော အိတ်အရေအတွက်';
  output.textContent=Number.isFinite(q)&&q>0?(bagMode?quantityText(q)+' ပိဿာ':size>0?quantityText(q/size)+' အိတ်':'—'):'—';
  const over=Number.isFinite(q)&&q>available+tolerance;
  form.querySelector('#dispatchLimit2').hidden=!over;
 }
 function augment(id){
  const form=document.getElementById('dispatch4');if(!form||form.dataset.dispatchSale2)return;
  const weight=form.querySelector('#dQty'),lot=form.querySelector('#dLot');if(!weight||!lot)return;
  form.dataset.dispatchSale2=id;form.classList.add('dispatch-unit-form2');
  const weightField=weight.closest('.field');weightField.classList.add('dispatch-weight-field2');
  const row=document.createElement('div');row.className='dispatch-method-row2';
  row.innerHTML=selectField('ထုတ်ပေးနည်း','dispatchUnit2',[['viss','ပိဿာအလိုက် ထုတ်ပေးမယ်'],['bags','အိတ်အရေအတွက်အလိုက် ထုတ်ပေးမယ်']],'viss')+'<div class="dispatch-quantity-slot2"></div>';
  weightField.before(row);const slot=row.querySelector('.dispatch-quantity-slot2');slot.append(weightField);
  slot.insertAdjacentHTML('beforeend',field('ထုတ်ပေးအိတ်အရေအတွက်','dispatchBagCount2',{type:'number',min:0,step:'any',value:'',required:false,suffix:'အိတ်'}));
  const bags=form.querySelector('#dispatchBagCount2');bags.closest('.field').classList.add('dispatch-bag-field2');
  const stock=document.createElement('div');stock.className='dispatch-stock-info2';stock.innerHTML='<div><span>ရွေးထားသောအသုတ်မှ ထုတ်ပေးနိုင်သည့်လက်ကျန်</span><strong id="dispatchAvailable2"></strong></div><div><span>တစ်အိတ်ဝင်</span><strong id="dispatchBagSize2"></strong></div>';row.before(stock);
  row.insertAdjacentHTML('afterend','<div class="dispatch-equivalent2" role="status" aria-live="polite"><span id="dispatchEquivalentLabel2"></span><strong id="dispatchEquivalentValue2"></strong></div><p class="dispatch-unit-help2" id="dispatchBagMissing2" hidden>ဤအသုတ်တွင် တစ်အိတ်ဝင်စာရင်း မရှိပါ။ ပိဿာအလိုက် ထုတ်ပေးပါ။</p><p class="dispatch-unit-limit2" id="dispatchLimit2" role="alert" hidden>ထုတ်ပေးပမာဏသည် ရွေးထားသောအသုတ်၏ လက်ကျန်ထက် မပိုရပါ။</p>');
  const current=context(form);if(current.lot)weight.value=inputNumber(current.available);
  const guide=form.querySelector('[data-weight-guide="dQty"]');if(guide)guide.textContent=weight.value?vissBreakdown37(Number(weight.value)):'';
  rememberEquivalent(form);refresh(form);
  form.addEventListener('change',event=>{
   if(event.target===lot){if(form.querySelector('#dispatchUnit2').value==='bags'){delete bags.dataset.generatedValue;delete bags.dataset.exactWeight;applyBags(form);}else rememberEquivalent(form);refresh(form);}
   if(event.target.id==='dispatchUnit2'){if(event.target.value==='bags')rememberEquivalent(form);refresh(form);}
  });
  form.addEventListener('input',event=>{
   if(event.target===bags){delete bags.dataset.generatedValue;delete bags.dataset.exactWeight;bags.removeAttribute('aria-invalid');applyBags(form);refresh(form);}
   if(event.target===weight){rememberEquivalent(form);refresh(form);}
  });
 }
 dispatch4=function(id){originalDispatch(id);augment(id);};
 openDispatch=originalOpenDispatch===originalDispatch?dispatch4:function(id){originalOpenDispatch(id);augment(id);};
 saveDispatch4=function(id){
  const form=document.getElementById('dispatch4');
  if(form?.dataset.dispatchSale2===id&&form.querySelector('#dispatchUnit2').value==='bags'){
   const bags=form.querySelector('#dispatchBagCount2'),weight=form.querySelector('#dQty'),{size}=context(form);
   if(!(size>0))return errorText(form,'တစ်အိတ်ဝင်စာရင်း မရှိပါ။ ပိဿာအလိုက် ထုတ်ပေးပါ။',bags);
   if(!bags.value.trim()||!Number.isFinite(Number(bags.value))||!(Number(bags.value)>0))return errorText(form,'ထုတ်ပေးအိတ်အရေအတွက်ကို သုညထက်ကြီးသော ပမာဏ ဖြည့်ပါ။',bags);
   if(!bags.checkValidity()){bags.reportValidity();return;}
   applyBags(form);refresh(form);
   // Keep the existing weight precision/minimum instead of silently rounding the entered bag quantity.
   if(!weight.checkValidity())return errorText(form,'တွက်ချက်ထားသောပိဿာကို ကျပ်သားအထိ (ဒဿမ ၂ နေရာ) ရရှိအောင် အိတ်အရေအတွက်ကို ပြန်စစ်ပါ။',bags);
  }
  return originalSave(id);
 };
})();

