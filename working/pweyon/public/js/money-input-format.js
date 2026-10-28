(function(){
 'use strict';
 const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
 const enhanced=new WeakSet(),composing=new WeakSet();
 const raw=value=>String(value??'').replace(/,/g,'').replace(/[၀-၉]/g,digit=>String(digit.charCodeAt(0)-0x1040));
 function format(value){
  const text=raw(value),parts=text.match(/^(-?)(\d*)(\.\d*)?$/);
  return parts?parts[1]+parts[2].replace(/\B(?=(\d{3})+(?!\d))/g,',')+(parts[3]||''):text;
 }
 function isMoney(input){
  if(input.dataset.moneyFormat==='off')return false;
  if(input.dataset.moneyInput==='true')return true;
  if(input.type!=='number'||input.hasAttribute('data-viss-weight'))return false;
  if(input.dataset.moneyFormat==='on')return true;
  const id=input.id,label=input.labels?.[0]?.textContent||'',suffix=input.closest('.input-suffix')?.querySelector('span')?.textContent||'';
  if(/loanPolicyRate|loanRate|serviceRatePercent|ServiceRate|mael|multiple|bags|count|qty|viss|weight|size/i.test(id)||/%|ရာခိုင်နှုန်း|အတိုးနှုန်း|အိတ်အရေအတွက်/.test(label))return false;
  return /^(?:vr\d+|sm\d+|ln\d+|lp38|li38|price_|op69Cash_)/.test(id)||/amount|price|cost|balance/i.test(id)||/ငွေ|ဈေး|ဝယ်ရင်း|အရင်း|အတိုး|ကုန်ဖိုး|လက်ကျန်|ကိုင်နှုန်း|ကျပ်(?!သား)|ခ(?:\s|\/|$)/.test(label+' '+suffix);
 }
 function validate(input){
  const text=input.value;
  let message='';
  if(text!==''&&!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))message='ငွေပမာဏကို မှန်ကန်စွာ ဖြည့်ပါ။';
  else if(text!==''){
   const n=Number(text),min=input.getAttribute('min'),max=input.getAttribute('max'),step=input.getAttribute('step')||'1';
   if(!Number.isFinite(n))message='ငွေပမာဏကို မှန်ကန်စွာ ဖြည့်ပါ။';
   else if(min!==null&&n<Number(min))message='အနည်းဆုံး '+format(min)+' ဖြည့်ပါ။';
   else if(max!==null&&n>Number(max))message='အများဆုံး '+format(max)+' အထိသာ ဖြည့်နိုင်ပါသည်။';
   else if(step!=='any'&&Number(step)>0){const base=min===null?Number(input.defaultValue)||0:Number(min),steps=(n-base)/Number(step);if(Math.abs(steps-Math.round(steps))>1e-7)message='သတ်မှတ်ထားသော ငွေပမာဏအဆင့်အလိုက် ဖြည့်ပါ။';}
  }
  input.setCustomValidity(message);
 }
 function paint(input,keepCaret=false){
  const before=nativeValue.get.call(input),caret=keepCaret?input.selectionStart:null;
  const offset=caret===null?null:raw(before.slice(0,caret)).length,after=format(before);
  if(before!==after)nativeValue.set.call(input,after);
  if(offset!==null&&before!==after){let position=0,count=0;while(position<after.length&&count<offset){if(after[position]!==',')count++;position++;}input.setSelectionRange(position,position);}
  validate(input);
 }
 function enhance(input){
  if(enhanced.has(input)||!isMoney(input))return;
  const initial=nativeValue.get.call(input);
  input.type='text';input.inputMode='decimal';input.dataset.moneyInput='true';
  // Existing calculators/commands read raw decimals through .value; only the native
  // text display contains commas. Keep one input/ID and its existing event handlers.
  Object.defineProperty(input,'value',{configurable:true,enumerable:true,
   get(){return raw(nativeValue.get.call(this));},
   set(value){nativeValue.set.call(this,format(value));validate(this);}
  });
  Object.defineProperty(input,'valueAsNumber',{configurable:true,get(){return this.value===''?NaN:Number(this.value);},set(value){this.value=Number.isNaN(value)?'':String(value);}});
  enhanced.add(input);input.value=initial;
 }
 function refresh(root=document){root.querySelectorAll('input[type="number"],input[data-money-input]').forEach(enhance);}
 document.addEventListener('focusin',event=>{if(event.target instanceof HTMLInputElement)enhance(event.target);},true);
 document.addEventListener('input',event=>{const input=event.target;if(input instanceof HTMLInputElement){enhance(input);if(enhanced.has(input)&&!event.isComposing&&!composing.has(input))paint(input,true);}},true);
 document.addEventListener('compositionstart',event=>{if(enhanced.has(event.target))composing.add(event.target);},true);
 document.addEventListener('compositionend',event=>{composing.delete(event.target);if(enhanced.has(event.target))paint(event.target,true);},true);
 document.addEventListener('change',event=>{if(enhanced.has(event.target))paint(event.target);},true);
 document.addEventListener('focusout',event=>{if(enhanced.has(event.target)){const input=event.target;if(/\d\.$/.test(input.value))input.value=input.value.slice(0,-1);else paint(input);}},true);
 document.addEventListener('formdata',event=>{for(const input of event.target.querySelectorAll('input[data-money-input]'))if(input.name&&!input.disabled)event.formData.set(input.name,input.value);},true);
 document.addEventListener('reset',event=>queueMicrotask(()=>event.target.querySelectorAll('input[data-money-input]').forEach(input=>paint(input))),true);
 new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'){if(enhanced.has(record.target))validate(record.target);continue;}
   for(const node of record.addedNodes)if(node.nodeType===1){if(node instanceof HTMLInputElement)enhance(node);refresh(node);}
  }
 }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['min','max','step']});
 window.pweMoneyInputs={refresh,format,raw,display:input=>nativeValue.get.call(input)};
 refresh();
})();
