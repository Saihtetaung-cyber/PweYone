
/* Live ကျပ်သား explanation for V37 receipt, purchase, sales and stock forms. */
(function(){
 function updateWeightHint37(input){
  if(!input||!input.matches('[data-viss-weight="1"]'))return;
  const hint=document.querySelector('[data-weight-guide="'+input.id+'"]');
  if(!hint)return;
  const raw=input.value.trim();
  if(raw===''){hint.textContent='ဥပမာ 60.25 = 60 ပိဿာ 25 ကျပ်သား';return;}
  const n=Number(raw);
  if(!Number.isFinite(n)||n<0||Math.abs(n*100-Math.round(n*100))>1e-7){hint.textContent='ပိဿာကို ဒဿမ ၂ နေရာသာ ထည့်ပါ (ဥပမာ 60.25)';return;}
  hint.textContent=vissBreakdown37(n);
 }
 document.addEventListener('input',event=>updateWeightHint37(event.target));
 document.addEventListener('change',event=>updateWeightHint37(event.target));
})();
