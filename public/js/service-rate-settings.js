(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const services=()=>state.masters.purchaseDeductionRates.filter(r=>r.calcMode==='service_percent');
 const rateName=rate=>rate.displayName||rate.name||rate.customType||'';
 const stageName=stage=>({purchase:'အဝယ်',sale:'အရောင်း',both:'နှစ်မျိုးလုံး'})[stage]||stage;
 const baseSetup=setupView;
 setupView=function(){
  if(setupSection==='service-rates')return servicePage();
  const root=document.createElement('div');root.innerHTML=baseSetup();
  if(setupSection==='overview'){
   const adjustmentCard=root.querySelector('[onclick="beginSetup(\'deductions\')"]');
   const description=adjustmentCard?.querySelector('p');if(description)description.textContent='ပေါင်းငွေ / နုတ်ငွေအမျိုးအစားများကို သတ်မှတ်မယ်။';
   const count=adjustmentCard?.querySelector('.v3-card-bottom > span');if(count)count.textContent=state.masters.purchaseDeductionRates.filter(r=>r.calcMode!=='service_percent').length+' အမျိုးအစား';
   const grid=root.querySelector('.v3-master-grid');
   if(grid&&!root.querySelector('[onclick="beginSetup(\'service-rates\')"]'))grid.insertAdjacentHTML('beforeend',
    '<button class="v2-records-card v3-master-card" onclick="beginSetup(\'service-rates\')"><span class="icon-box">'+I('price')+'</span><strong>ဝန်ဆောင်ခ နှုန်းထား</strong><p>အဝယ် / အရောင်း ဝန်ဆောင်ခ ရာခိုင်နှုန်းများကို သီးခြားသတ်မှတ်မယ်။</p><div class="v3-card-bottom"><span>'+services().filter(r=>r.active).length+' နှုန်းထား</span><span class="end-link">ပြင်ဆင်မယ် '+I('arrow')+'</span></div></button>');
  }
  return root.innerHTML;
 };
 function servicePage(){
  const rows=services().map(r=>'<tr><td>'+E(r.displayName||r.name)+'</td><td>'+N(r.rate)+'%</td><td>'+E(stageName(r.applyAt))+'</td><td>'+pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')+'</td><td><div class="row wrap">'+smallbtn('ပြင်',"pweEditServiceRate('"+r.id+"')",'secondary')+(r.active?smallbtn('ပိတ်မယ်',"pweDisableServiceRate('"+r.id+"')",'danger'):'')+'</div></td></tr>');
  return setupBack()+heading('','ဝန်ဆောင်ခ နှုန်းထား','စုစုပေါင်းကုန်ဖိုးအပေါ် ရာခိုင်နှုန်းဖြင့် တွက်မည့် ဝန်ဆောင်ခများကို သီးခြားစီမံပါ။',btn('အသစ်ထည့်မယ်','pweEditServiceRate()','primary','plus'))+
   '<section class="card">'+(rows.length?table4(['အမည်','ရာခိုင်နှုန်း','အသုံးပြုမည့်အချိန်','အခြေအနေ','လုပ်ဆောင်ရန်'],rows):'<div class="empty">ဝန်ဆောင်ခနှုန်းထား မရှိသေးပါ။ အသစ်ထည့်မယ်ကို နှိပ်ပါ။</div>')+'</section>';
 }
 window.pweEditServiceRate=function(id=''){
  const rate=id?services().find(r=>r.id===id):null;if(id&&!rate)return;
  $('serviceRateDialog')?.remove();
  const dialog=document.createElement('dialog');dialog.id='serviceRateDialog';dialog.dataset.rateId=id;
  dialog.setAttribute('aria-label',id?'ဝန်ဆောင်ခ ပြင်မယ်':'ဝန်ဆောင်ခ အသစ်ထည့်မယ်');
  dialog.innerHTML='<h3>'+(id?'ဝန်ဆောင်ခ ပြင်မယ်':'ဝန်ဆောင်ခ အသစ်ထည့်မယ်')+'</h3><div id="modalError" class="form-error" role="alert"></div><form id="serviceRateForm" onsubmit="event.preventDefault();pweSaveServiceRate()"><div class="deduction-editor-horizontal">'+
   field('ဝန်ဆောင်ခအမည်','serviceRateName',{value:rate?.displayName||rate?.name||'ဝန်ဆောင်ခ',required:true,extra:rate?'':'readonly'})+
   field('ရာခိုင်နှုန်း (%)','serviceRatePercent',{type:'number',value:rate?.rate??'',required:true,min:0,max:100,step:'any'})+
   selectField('အသုံးပြုမည့်အချိန်','serviceRateStage',[['purchase','အဝယ်'],['sale','အရောင်း'],['both','နှစ်မျိုးလုံး']],rate?.applyAt||'both')+
   selectField('အခြေအနေ','serviceRateActive',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],rate?.active===false?'no':'yes')+
   '</div></form><div class="deduction-editor-actions">'+btn('မသိမ်းတော့ပါ','pweCloseServiceRate()','secondary')+btn('သိမ်းမယ်','pweSaveServiceRate()','primary','check')+'</div>';
  dialog.addEventListener('cancel',e=>{e.preventDefault();pweCloseServiceRate();});
  $('main').append(dialog);dialog.showModal();$(rate?'serviceRateName':'serviceRatePercent').focus();
 };
 window.pweCloseServiceRate=function(){
  if(document.body.dataset.saving)return;
  $('serviceRateDialog')?.remove();document.querySelector('[onclick="pweEditServiceRate()"]')?.focus();
 };
 window.pweSaveServiceRate=function(){
  if(!$('serviceRateForm')?.reportValidity())return false;
  return pweServer.command('master.save',{kind:'service_rate',id:$('serviceRateDialog').dataset.rateId||null,data:{name:$('serviceRateName').value,rate:$('serviceRatePercent').value,kind:$('serviceRateStage').value,active:$('serviceRateActive').value==='yes'}},{page:'setup'});
 };
 window.pweDisableServiceRate=function(id){
  if(!confirm('ဤဝန်ဆောင်ခနှုန်းထားကို အသစ်ရွေးသုံးမရအောင် ပိတ်မလား။'))return false;
  return pweServer.command('master.inactivate',{kind:'service_rate',id},{page:'setup'});
 };
 deductionRatesPage=function(){
  const rows=state.masters.purchaseDeductionRates.filter(r=>r.calcMode!=='service_percent');
  return setupBack()+heading('','ပေါင်းနုတ်ငွေ နှုန်းထား','ပေါင်းငွေ / နုတ်ငွေအမျိုးအစားများကို စီမံပါ။ ဝန်ဆောင်ခကို သီးခြားဝန်ဆောင်ခနှုန်းထားတွင် သတ်မှတ်ပါ။',btn('အသစ်ထည့်မယ်','editDeductionRate()','primary','plus'))+
   '<section class="card">'+(rows.length?table4(['အမည်','အသုံးပြုမည့်အချိန်','တွက်ချက်ပုံ','အခြေအနေ','လုပ်ဆောင်ရန်'],rows.map(r=>'<tr><td>'+E(rateName(r))+'</td><td>'+E(stageName(r.applyAt))+'</td><td>'+(r.calcMode==='labor_auto'?'လုပ်သားခ Auto':'Manual')+'</td><td>'+pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')+'</td><td>'+smallbtn('ပြင်',"editDeductionRate('"+r.id+"')",'secondary')+' '+smallbtn('ဖျက်',"deleteDeductionRate('"+r.id+"')",'danger')+'</td></tr>')):'<div class="empty">ပေါင်းနုတ်ငွေနှုန်းထား မရှိသေးပါ။</div>')+'</section>'+deductionEditor();
 };
 const baseAdjustmentEditor=deductionEditor;
 deductionEditor=function(){
  const root=document.createElement('div');root.innerHTML=baseAdjustmentEditor();
  root.querySelector('#drServiceRateWrap48')?.remove();
  const name=root.querySelector('#drName48');if(name)name.placeholder='ဥပမာ ကားခ / သန့်စင်ခ / စိတ်ကြိုက်အမည်';
  const help=root.querySelector('.card > p');if(help)help.textContent='ပေါင်းငွေ / နုတ်ငွေအမျိုးအစားကို ရိုက်ထည့်ပါ။ လုပ်သားခကို Auto တွက်ပြီး အခြားအမျိုးအစားများကို ဈေးဖြတ်ချိန်တွင် ငွေပမာဏထည့်ပါ။';
  return root.innerHTML;
 };
 const baseSync=syncDeductionMode48;
 syncDeductionMode48=function(){
  baseSync();$('drServiceRateWrap48')?.classList.add('hide');
  if($('drName48')?.value.trim()==='ဝန်ဆောင်ခ'&&$('drModeNote48'))$('drModeNote48').textContent='ဝန်ဆောင်ခကို သတ်မှတ်ချက်ရှိ ဝန်ဆောင်ခ နှုန်းထားတွင် သီးခြားထည့်ပါ။';
 };
 const baseSave=saveDeductionRate;
 saveDeductionRate=function(){
  if($('drName48')?.value.trim()==='ဝန်ဆောင်ခ'){
   $('modalError').textContent='ဝန်ဆောင်ခကို သီးခြား ဝန်ဆောင်ခ နှုန်းထားတွင် ထည့်ပါ။';return false;
  }
  return baseSave();
 };
 const baseVoucher=voucherForm4;
 const directionStyle=document.createElement('style');
 directionStyle.textContent='.v58-service-box .v58-service-fields.service-direction-fields{grid-template-columns:repeat(3,minmax(0,1fr))}@media(max-width:900px){.v58-service-box .v58-service-fields.service-direction-fields{grid-template-columns:1fr}}';
 document.head.append(directionStyle);
 const baseToggleService=toggleService58;
 toggleService58=function(...args){
  const result=baseToggleService.apply(this,args);
  if($('v58ServiceDirectionBox'))$('v58ServiceDirectionBox').hidden=value('v58ServiceMode')!=='yes';
  return result;
 };
 const baseCharges=readCharges4;
 readCharges4=function(...args){
  const charges=baseCharges.apply(this,args);
  if(v4Kind!=='purchase'||!$('voucher4'))return charges;
  charges.serviceDirection=value('v58ServiceDirection')||'subtract';
  if(charges.serviceDirection==='add'&&charges.purchaseAdjustments2){
   charges.purchaseAdjustments2.additionTotal+=charges.serviceFee||0;
   charges.purchaseAdjustments2.deductionTotal-=charges.serviceFee||0;
  }
  return charges;
 };
 voucherForm4=function(...args){
  const result=baseVoucher.apply(this,args),select=$('v58ServiceRate');
  if(select){
   const stage=v4Kind==='sale'?'sale':'purchase';
   const rates=[...new Set(services().filter(r=>r.active&&(r.applyAt===stage||r.applyAt==='both')).map(r=>String(Number(r.rate))))];
   select.replaceChildren(new Option('ရာခိုင်နှုန်း ရွေးပါ',''),...rates.map(rate=>new Option(rate+'%',rate)));
   if(v4Kind==='purchase'){
    const fields=$('serviceChoice58')?.querySelector('.v58-service-fields');
    if(fields&&!$('v58ServiceDirection')){
     fields.classList.add('service-direction-fields');
     $('v58ServiceRateBox').insertAdjacentHTML('beforebegin','<div id="v58ServiceDirectionBox" hidden>'+selectField('ဝန်ဆောင်ခ ပုံစံ','v58ServiceDirection',[['add','ပေါင်းမည်'],['subtract','နှုတ်မည်']],'subtract','onchange="calcVoucher4()"')+'</div>');
     $('serviceChoice58').querySelector('.v58-service-caption').textContent='“ယူမည်” ရွေးပြီး ပေါင်း / နှုတ်ပုံစံနှင့် ရာခိုင်နှုန်းကို ရွေးပါ။ စုစုပေါင်းကုန်ဖိုးအပေါ် အလိုအလျောက် တွက်ပေးပါမည်။';
    }
   }
  }
  return result;
 };
 render();
})();
