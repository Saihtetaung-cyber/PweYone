
/* Receipt form presentation only; keep all native button handlers and return paths. */
(function(){
 'use strict';
 document.title='ပွဲရုံ · Version 2 · Receiving Vehicle UI Update';
 const previousOpen=openReceive4;
 openReceive4=function(...args){
  const result=previousOpen(...args),form=document.getElementById('receive4');
  if(!form)return result;
  const footer=document.querySelector('#main .modal-footer'),actions=footer?.querySelector('.receive-action-stack4');
  if(!footer||!actions)return result;
  footer.classList.add('receive-footer-car2');
  const utilities=document.createElement('div'),submit=document.createElement('div');
  utilities.className='receive-utilities-car2';submit.className='receive-submit-car2';
  for(const button of [...actions.querySelectorAll('button')]){
   const handler=button.getAttribute('onclick')||'';
   if(handler==='saveCurrentReceiveLineAndAdd4()'||handler==="saveReceive4('new')")utilities.append(button);
   else submit.append(button);
   if(handler==="saveReceive4('price')"){
    button.classList.remove('btn-primary');button.classList.add('btn-secondary','receive-price-car2');
   }
  }
  actions.append(utilities,submit);
  // Hide empty groups (including the native sale-source return mode).
  for(const group of [utilities,submit]){
   const visible=[...group.children].filter(b=>!b.hidden);
   group.hidden=!visible.length;group.classList.toggle('receive-single-car2',visible.length===1);
  }
  return result;
 };
})();

