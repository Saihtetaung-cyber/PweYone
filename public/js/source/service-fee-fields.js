
/* V58 - scoped display/service-fee update. All receiving, sale, stock, loan,
   transaction, payment and prior deduction calculations continue unchanged. */
(function(){
 'use strict';
 const fixed58=[0.5,1,1.5,2,2.5,3];
 const list58=stage=>{
   const rates=deductionRatesFor(stage,true).filter(r=>r.calcMode==='service_percent')
      .map(r=>Number(r.rate)).filter(n=>Number.isFinite(n)&&n>0&&n<=100);
   return [...new Set([...fixed58,...rates])].sort((a,b)=>a-b);
 };
 const stage58=()=>v4Kind==='sale'?'sale':'purchase';
 const serviceRate58=()=>{
   if(!document.getElementById('v58ServiceMode')||value('v58ServiceMode')!=='yes')return 0;
   const n=Number(value('v58ServiceRate'));
   return list58(stage58()).includes(n)&&n>0?n:0;
 };
 function install58(){
   if(!['purchase','sale'].includes(v4Kind))return;
   const legacy=document.getElementById(v4Kind==='sale'?'saleService58':'purchaseService48');
   if(!legacy||document.getElementById('v58ServiceMode'))return;
   const container=legacy.closest('.field');
   if(!container)return;
   const p=document.createElement('div');p.className='v58-service-box';p.id='serviceChoice58';
   p.innerHTML=`<div class="v58-service-title">ဝန်ဆောင်ခ</div>
     <div class="v58-service-fields">
       ${selectField('ဝန်ဆောင်ခ ယူမလား','v58ServiceMode',[['no','မယူပါ'],['yes','ယူမည်']],'no','onchange="toggleService58()"')}
       <div id="v58ServiceRateBox" hidden>${selectField('ဝန်ဆောင်ခ ရာခိုင်နှုန်း (%)','v58ServiceRate',[['','ရာခိုင်နှုန်း ရွေးပါ'],...list58(stage58()).map(n=>[String(n),String(n)+'%'])],'','onchange="calcVoucher4()"')}</div>
     </div>
     <p class="v58-service-caption">Default မှာ ဝန်ဆောင်ခ မယူပါ။ “ယူမည်” ရွေးမှ ရာခိုင်နှုန်းကို Dropdown မှ ရွေးနိုင်ပါမည်။ အခြားနုတ်ငွေ၊ လုပ်သားခနှင့် ငွေရှင်း Flow မပြောင်းပါ။</p>`;
   container.replaceWith(p);
 }
 window.toggleService58=function(){
   const show=value('v58ServiceMode')==='yes';
   const box=document.getElementById('v58ServiceRateBox'),rate=document.getElementById('v58ServiceRate');
   if(box)box.hidden=!show;
   if(!show&&rate)rate.value='';
   calcVoucher4();
 };
 const voucherBefore58=voucherForm4;
 voucherForm4=function(records){
   voucherBefore58(records);
   if(v4Kind!=='purchase'&&v4Kind!=='sale')return;
   install58();
   calcVoucher4();
 };
 const readBefore58=readCharges4;
 readCharges4=function(){
   const c=readBefore58();
   if(!['purchase','sale'].includes(v4Kind)||!document.getElementById('v58ServiceMode'))return c;
   const percent=serviceRate58();
   const gross=readVoucherLines4().reduce((n,r)=>n+(Number(r.total)||0),0);
   const master=deductionRatesFor(stage58(),true).find(r=>r.calcMode==='service_percent'&&Number(r.rate)===percent);
   c.serviceFee=Math.round(gross*percent/100);
   c.serviceRateValue=percent;
   c.serviceRateBasis='percent_total';
   c.serviceRateId=percent&&master?master.id:'';
   c.serviceFeeTaken58=percent>0;
   return c;
 };
 const commitBefore58=commitVoucher4;
 commitVoucher4=function(){
   if(['purchase','sale'].includes(v4Kind)&&value('v58ServiceMode')==='yes'&&!serviceRate58()){
     return error('ဝန်ဆောင်ခ ယူမည်ဆိုပါက ရာခိုင်နှုန်းကို Dropdown မှ ရွေးပါ။');
   }
   return commitBefore58();
 };
 const detailBefore58=chargesSummary4;
 chargesSummary4=function(c){
   let html=detailBefore58(c);
   if(c&&c.serviceFee>0&&Number(c.serviceRateValue)>0&&!c.serviceRateId){
     html=html.replace(/ဝန်ဆောင်ခ · 0%/g,'ဝန်ဆောင်ခ · '+N(c.serviceRateValue)+'%');
   }
   return html;
 };
 document.title='ပွဲရုံ · V60 Simple UI + Accountant Packaging Permission';
})();
