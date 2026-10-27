
/* Version_2: replace the adjacent +/- row buttons with one explicit selector. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const prompt='နုတ်ငွေ / ပေါင်းငွေ ရွေးပါ';
 window.purchaseAdjustmentChoice2=function(){
  const mode=$('purchaseAdjustmentKind2')?.value,button=$('purchaseAdjustmentAdd2'),hint=$('purchaseAdjustmentHint2');
  if(!button||!hint)return;
  button.disabled=!['subtract','add'].includes(mode);
  button.textContent=mode==='subtract'?'− နုတ်ငွေ Row ထည့်မည်':mode==='add'?'+ ပေါင်းငွေ Row ထည့်မည်':'Row အသစ်ထည့်မည်';
  hint.textContent=mode==='subtract'?'နုတ်ငွေကို ရွေးထားပါသည်။ ပေးရန်ငွေ လျော့ပါမည်။':mode==='add'?'ပေါင်းငွေကို ရွေးထားပါသည်။ ပေးရန်ငွေ တိုးပါမည်။':'ထည့်မည့် Row အတွက် နုတ်ငွေ သို့မဟုတ် ပေါင်းငွေကို အရင်ရွေးပါ။';
 };
 window.addSelectedPurchaseAdjustment2=function(){
  if(v4Kind!=='purchase')return;
  const select=$('purchaseAdjustmentKind2'),mode=select?.value;
  if(!['subtract','add'].includes(mode))return;
  const root=$('purchaseDeductionRows4');if(!root)return;
  const count=root.children.length;
  if(mode==='subtract')addPurchaseDeductionRow4();else addPurchaseAdditionRow2();
  if(root.children.length<=count)return;
  // Each new row requires an explicit direction; never carry a previous choice.
  select.value='';purchaseAdjustmentChoice2();
  root.lastElementChild?.querySelector('select')?.focus({preventScroll:true});
 };
 const formBefore=voucherForm4;
 voucherForm4=function(...args){
  const result=formBefore.apply(this,args);
  if(v4Kind!=='purchase'||!$('voucher4'))return result;
  const actions=$('voucher4').querySelector('.purchase-adjustment-actions2');if(!actions)return result;
  actions.classList.add('purchase-dropdown-actions2');
  actions.innerHTML='<div class="purchase-adjustment-picker2"><label for="purchaseAdjustmentKind2">ထည့်မည့်ငွေအမျိုးအစား</label><select id="purchaseAdjustmentKind2" aria-describedby="purchaseAdjustmentHint2" onchange="purchaseAdjustmentChoice2()"><option value="">'+prompt+'</option><option value="subtract">− နုတ်ငွေ</option><option value="add">+ ပေါင်းငွေ</option></select></div>'+
   '<button type="button" id="purchaseAdjustmentAdd2" class="btn btn-secondary" onclick="addSelectedPurchaseAdjustment2()" disabled>Row အသစ်ထည့်မည်</button>'+
   '<p id="purchaseAdjustmentHint2" role="status" aria-live="polite">ထည့်မည့် Row အတွက် နုတ်ငွေ သို့မဟုတ် ပေါင်းငွေကို အရင်ရွေးပါ။</p>';
  return result;
 };
})();

