(function(){
 'use strict';
 const $=id=>document.getElementById(id),policies=()=>state.loanInterestPolicies||[];
 const formula='အတိုး = ကျန်အရင်း × လစဉ်နှုန်း ÷ 100 ÷ 30 × ရက်။ တစ်ရက်တည်း 0 ရက်ဖြစ်ပြီး အတိုးကို အရင်းထဲ မပေါင်းပါ။';
 const baseSetup=setupView;
 setupView=function(){
  if(setupSection!=='additional38')return baseSetup();
  const owner=state.role==='owner';
  const rows=policies().map(p=>'<tr><td>'+E(p.name)+'</td><td>'+N(p.monthlyRate)+'%</td><td>'+pill(p.active?'အသုံးပြုနေ':'ပိတ်ထား',p.active?'':'gray')+'</td><td>'+(owner?smallbtn('ပြင်',"pweEditLoanPolicy('"+p.id+"')",'secondary')+(p.active?' '+smallbtn('ပိတ်မယ်',"pweDisableLoanPolicy('"+p.id+"')",'danger'):''):'—')+'</td></tr>');
  return setupBack()+heading('','ကြိုထုတ်ငွေ အတိုးမူဝါဒ','မူဝါဒပြင်ခြင်းသည် နောက်မှထုတ်ပေးမည့် ကြိုထုတ်ငွေများအတွက် ဖြစ်ပြီး ယခင်မှတ်တမ်းနှုန်းထား မပြောင်းပါ။',owner?btn('အသစ်ထည့်မယ်','pweEditLoanPolicy()','primary','plus'):'')+
   '<section class="card">'+note(formula,'blue')+(rows.length?table4(['မူဝါဒအမည်','လစဉ် အတိုးနှုန်း','အခြေအနေ','လုပ်ဆောင်ရန်'],rows):'<div class="empty">အတိုးမူဝါဒ မရှိသေးပါ။</div>')+'</section>';
 };
 window.pweEditLoanPolicy=function(id=''){
  if(state.role!=='owner')return false;
  const policy=id?policies().find(p=>p.id===id):null;if(id&&!policy)return false;
  $('loanPolicyDialog')?.remove();const dialog=document.createElement('dialog');dialog.id='loanPolicyDialog';dialog.dataset.policyId=id;
  dialog.setAttribute('aria-label','ကြိုထုတ်ငွေ အတိုးမူဝါဒ');
  dialog.innerHTML='<h3>'+(id?'အတိုးမူဝါဒ ပြင်မယ်':'အတိုးမူဝါဒ အသစ်ထည့်မယ်')+'</h3><div id="modalError" class="form-error" role="alert"></div><form id="loanPolicyForm" onsubmit="event.preventDefault();pweSaveLoanPolicy()"><div class="deduction-editor-horizontal">'+
   field('မူဝါဒအမည်','loanPolicyName',{value:policy?.name||'',required:true})+
   field('လစဉ် အတိုးနှုန်း (%)','loanPolicyRate',{value:policy?.monthlyRate??'',type:'number',min:0,max:100,step:'any',required:true})+
   selectField('အခြေအနေ','loanPolicyActive',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],policy?.active===false?'no':'yes')+'</div><p class="field-help">'+formula+'</p></form><div class="deduction-editor-actions">'+btn('မသိမ်းတော့ပါ','pweCloseLoanPolicy()','secondary')+btn('သိမ်းမယ်','pweSaveLoanPolicy()','primary','check')+'</div>';
  dialog.addEventListener('cancel',event=>{event.preventDefault();pweCloseLoanPolicy();});$('main').append(dialog);dialog.showModal();$('loanPolicyName').focus();
 };
 window.pweCloseLoanPolicy=function(){if(!document.body.dataset.saving)$('loanPolicyDialog')?.remove();};
 window.pweSaveLoanPolicy=function(){
  if(state.role!=='owner'||!$('loanPolicyForm')?.reportValidity())return false;
  return pweServer.command('master.save',{kind:'loan_policy',id:$('loanPolicyDialog').dataset.policyId||null,data:{name:$('loanPolicyName').value,monthlyRate:$('loanPolicyRate').value,active:$('loanPolicyActive').value==='yes'}},{page:'setup'});
 };
 window.pweDisableLoanPolicy=function(id){
  if(state.role!=='owner'||!confirm('ဤမူဝါဒကို အသစ်ရွေးသုံးမရအောင် ပိတ်မလား။ ယခင်ချေးငွေများ၏ အတိုးနှုန်း မပြောင်းပါ။'))return false;
  return pweServer.command('master.inactivate',{kind:'loan_policy',id},{page:'setup'});
 };
 const baseLoan=newLoan38;
 newLoan38=function(...args){
  const result=baseLoan.apply(this,args),select=$('loanRate38');if(!select)return result;
  select.replaceChildren(new Option('အတိုးမူဝါဒ ရွေးပါ',''),...policies().filter(p=>p.active).map(p=>new Option(p.name+' · '+N(p.monthlyRate)+'%',p.id)));
  select.required=true;const label=document.querySelector('label[for="loanRate38"]');if(label)label.textContent='အတိုးမူဝါဒ';
  const help=document.querySelector('#loanForm38 .note > div');if(help)help.textContent=formula;
  return result;
 };
 const baseSaveLoan=saveLoan38;
 saveLoan38=function(){if(!$('loanForm38')?.reportValidity())return false;return baseSaveLoan();};
 window.openingLoanRateValid=value=>value!==null&&value!==undefined&&String(value).trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=100;
 function openingPolicyChoices(){
  const select=$('op69LoanRate');if(!select)return;
  const previous=select.value,rates=[...new Set(policies().filter(p=>p.active).map(p=>String(Number(p.monthlyRate))))];
  if(openingLoanRateValid(previous)&&!rates.includes(String(Number(previous))))rates.unshift(String(Number(previous)));
  select.replaceChildren(...rates.map(rate=>new Option(rate+'%',rate)));select.value=String(Number(previous));
 }
 function updateHelp(){document.querySelectorAll('#main .note > div').forEach(node=>{if(node.textContent.includes('3% / 4%'))node.textContent=formula;});}
 const baseDetail=loanDetail38;loanDetail38=function(...args){const result=baseDetail.apply(this,args);updateHelp();return result;};
 const baseRender=render;render=function(...args){const result=baseRender.apply(this,args);openingPolicyChoices();updateHelp();return result;};
 render();
})();
