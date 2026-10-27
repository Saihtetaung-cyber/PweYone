
/* V62 — Cash Request ID integration only.
 * Legacy received requests and non-request account transfers retain their records and flow.
 * An outstanding request is settled through exactly one posting function; partial receipts
 * are separate linked tranches, not new unlinked Cash In deposits. */
(function(){
 'use strict';
 const pending=()=>Array.isArray(state.requests)?state.requests.filter(r=>r.status==='issued'&&remainder(r)>0):[];
 const amountOf=x=>Number.isFinite(Number(x))?Number(x):0;
 const received=r=>Array.isArray(r.receipts62)&&r.receipts62.length?r.receipts62.reduce((n,x)=>n+amountOf(x.amount),0):amountOf(r.receivedAmount);
 function remainder(r){return Math.max(0,amountOf(r.amount)-received(r));}
 let posting=false;
 window.pweSettleRequest62=function(id,amount,reference='',viaCashIn=false){
   if(posting)return false;
   const r=(state.requests||[]).find(x=>x.id===id);
   if(!r||r.status!=='issued'||remainder(r)<=0){error('ဤငွေယူလက်မှတ်ကို ရှင်းပြီးသားဖြစ်၍ ထပ်မံလက်ခံမရပါ။');return false;}
   if(viaCashIn?state.role!=='owner':state.role!=='staff'){error('ဤငွေလက်ခံနည်းအတွက် Role Permission မရှိပါ။');return false;}
   if(state.closed||!state.opening.checked){error('နေ့ပိတ်ထားစဉ် သို့မဟုတ် ငွေစာရင်းမဖွင့်ရသေးစဉ် ငွေလက်ခံမရပါ။');return false;}
   const amt=Number(amount);
   if(!Number.isSafeInteger(amt)||amt<=0||amt>remainder(r)){error('ငွေလက်ခံပမာဏသည် ၀ ထက်ကြီးပြီး ငွေယူလက်မှတ်ကျန်ငွေထက် မပိုရပါ။');return false;}
   if(amt>bal('home')){error('အိမ်ငွေသိမ်းရာ လက်ကျန်မလုံလောက်ပါ။');return false;}
   if(!Number.isSafeInteger(bal('cash')+amt)){error('ငွေလက်ကျန် ကိန်းပြည့်အတိုင်းအတာကျော်နေသည်။');return false;}
   posting=true;
   try{
     const referenceText=String(reference||'').trim().slice(0,80);
     const rid=uid('RR'),ref=r.no+' / '+rid;
     const transactionStart=state.transactions.length;
     txn('home',-amt,'အိမ်ငွေယူလက်မှတ် ချိတ်ဆက် (ထွက်)',ref,r.collector);
     txn('cash',amt,'အိမ်ငွေယူလက်မှတ် ချိတ်ဆက် (ဝင်)',ref,r.collector);
     const ids=state.transactions.slice(transactionStart).map(t=>t.id);
     if(!Array.isArray(r.receipts62))r.receipts62=[];
     r.receipts62.push({id:rid,date:today(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),amount:amt,reference:referenceText,via:viaCashIn?'cashin':'request',by:state.role,txnIds:ids});
     r.receivedAmount=received(r);r.lastReceivedDate=today();
     if(remainder(r)===0){r.status='received';r.receivedDate=today();}
     activity(r.no+' ချိတ်ဆက်၍ '+cashText(amt)+' လက်ခံခဲ့သည်။ ကျန် '+cashText(remainder(r))+'။');
     save();
     return true;
   }finally{posting=false;}
 };
 // Staff confirmation: accept full or partial remaining, preserve pre-existing request identifiers.
 openReceiveMoney=window.openReceiveMoney=function(id){
   if(state.role!=='staff'||!guardWork())return;
   const r=(state.requests||[]).find(x=>x.id===id);
   if(!r||r.status!=='issued'||remainder(r)<=0)return error('ငွေယူလက်မှတ်ကို ရှင်းပြီးသားဖြစ်သည်။');
   const rest=remainder(r);
   openModal('အိမ်မှ ငွေလက်ခံမယ်',E(r.no)+' · '+E(r.collector),
     `<div class="summary-box mb">${row4('လက်မှတ်ပါငွေ',cashText(r.amount))}${row4('ယခင်လက်ခံပြီး',cashText(received(r)))}${row4('လက်ခံရန်ကျန်',cashText(rest))}</div>
      <form id="requestReceiveForm62" onsubmit="event.preventDefault();receiveMoney('${E(id)}')">
      ${field('ယခုတကယ်လက်ခံရရှိငွေ','requestReceived62',{type:'number',min:1,required:true,value:rest,suffix:'ကျပ်',extra:'step="1" max="'+rest+'"'})}
      ${field('အထောက်အထား Reference (ရှိပါက)','requestReference62',{placeholder:'လက်မှတ် / ဘဏ်လွှဲအမှတ်',extra:'maxlength="80"'})}</form>
      <div class="mt">${note('တစ်စိတ်တစ်ပိုင်းလက်ခံနိုင်သည်။ ကျန်ငွေရှိပါက Request ကို ဆက်ဖွင့်ထားပြီး တစ်ကြိမ်လက်ခံတိုင်း Home နှင့် Cash Ledger ကို အတူတိုး/လျော့မည်။ Cash In ထပ်မံမတင်ပါ။','blue')}</div>`,
     btn('ပိတ်မယ်','closeModal()','secondary')+btn('ရရှိငွေ သိမ်းမယ်',`receiveMoney('${E(id)}')`,'primary','check'),true);
 };
 receiveMoney=window.receiveMoney=function(id){
   if(state.role!=='staff'||!guardWork()||!validForm('requestReceiveForm62'))return;
   if(!window.pweSettleRequest62(id,number('requestReceived62'),value('requestReference62'),false))return;
   closeModal();render();toast('Request ID ဖြင့် ငွေလက်ခံမှု သိမ်းပြီးပါပြီ။');
 };
 function picker62(){
   const fields=document.getElementById('cash50Fields');if(!fields)return;
   const link=fields.querySelector('#pweCashRequestLink62');
   const active=value('cash50Mode')==='transfer'&&value('cash50Source')==='home'&&value('cash50Destination')==='cash';
   if(!active||!pending().length){if(link)link.remove();return;}
   if(link)return;
   const box=document.createElement('div');box.id='pweCashRequestLink62';box.className='v57-recovery-note';
   box.innerHTML=`<strong>အိမ်ငွေယူလက်မှတ်နှင့် ချိတ်ဆက်မှု</strong>
      <label class="field" style="display:block;margin-top:10px"><span class="label">Request ID ရွေးပါ</span>
       <select id="cash50RequestId62" onchange="pweCashRequestSelect62()"><option value="">ဤငွေလွှဲသည် Pending Request နှင့် မသက်ဆိုင်ပါ</option>
       ${pending().map(r=>`<option value="${E(r.id)}">${E(r.no)} · ${E(r.collector)} · ကျန် ${cashText(remainder(r))}</option>`).join('')}</select></label>
      <div id="pweCashRequestInfo62" class="field-help" aria-live="polite"></div>
      <label id="pweCashIndependentWrap62" class="cash50-confirm" style="margin-top:8px"><input id="cash50Independent62" type="checkbox"><span>ဤငွေလွှဲသည် အထက်ပါ Request များနှင့် မသက်ဆိုင်ကြောင်း၊ သီးခြားငွေလွှဲထားကြောင်း အတည်ပြုသည်။ Reference ဖြည့်ရန်လိုပါသည်။</span></label>`;
   const preview=fields.querySelector('#cash50Preview');if(preview)preview.before(box);else fields.append(box);
 };
 window.pweCashRequestSelect62=function(){
   const rid=value('cash50RequestId62'),r=pending().find(x=>x.id===rid);
   const independent=document.getElementById('pweCashIndependentWrap62'),info=document.getElementById('pweCashRequestInfo62');
   if(independent)independent.hidden=!!r;
   if(info)info.textContent=r?`${r.no} · လက်ခံပြီး ${cashText(received(r))} · ကျန် ${cashText(remainder(r))}။ ယခု Amount ကို ကျန်ငွေအထိ လျော့ထည့်နိုင်ပါသည်။`:'Request နှင့် မဆိုင်သော ငွေလွှဲအတွက် အထောက်အထား Reference မဖြစ်မနေ ဖြည့်ပါ။';
   if(r){
     const amt=document.getElementById('cash50Amount');if(amt)amt.value=String(remainder(r));
     const desc=document.getElementById('cash50Description');if(desc)desc.value=r.no+' · '+r.reason;
     const ref=document.getElementById('cash50Reference');if(ref)ref.value=r.no;
   }
   window.updateCash50Preview();
 };
 const previousPreview=window.updateCash50Preview;
 window.updateCash50Preview=function(){
   previousPreview();picker62();
   const r=pending().find(x=>x.id===value('cash50RequestId62'));
   const info=document.getElementById('pweCashRequestInfo62');
   if(r&&info){const amt=Number(value('cash50Amount'));info.textContent=`${r.no} · လက်ခံရန်ကျန် ${cashText(remainder(r))}။ ${amt>remainder(r)?'ထည့်ထားသောငွေသည် ကျန်ငွေထက်ပိုနေသည်။':'Request ID တစ်ခုတည်းဖြင့် Post လုပ်ပါမည်။'}`;}
 };
 const previousSave=window.saveCashIn50;
 window.saveCashIn50=function(){
   const mode=value('cash50Mode'),src=value('cash50Source'),dst=value('cash50Destination');
   const linked=mode==='transfer'&&src==='home'&&dst==='cash';
   const rid=linked?value('cash50RequestId62'):'';
   const ref=value('cash50Reference').trim();
   if(linked&&rid){
     const f=document.getElementById('cash50Form');if(!f||!f.reportValidity())return;
     if(!document.getElementById('cash50Confirmed')?.checked)return error('ငွေတကယ်ရရှိထားကြောင်း အတည်ပြုပါ။');
     if(!window.pweSettleRequest62(rid,number('cash50Amount'),ref,true))return;
     closeModal();cashTab='cashins50';render();toast('ငွေယူလက်မှတ်နှင့် ချိတ်ဆက်ပြီး Ledger တစ်ကြိမ်သာ Post လုပ်ထားပါသည်။');return;
   }
   if(linked){
     if(pending().length){
       if(!document.getElementById('cash50Independent62')?.checked)return error('Pending Request ရှိနေပါသည်။ သီးခြားလွှဲခြင်းဖြစ်ကြောင်း အတည်ပြုရန် သို့မဟုတ် Request ID ကို ရွေးရန် လိုပါသည်။');
       if(!ref)return error('Pending Request ရှိစဉ် သီးခြားငွေလွှဲပါက Reference ထည့်ရန်လိုပါသည်။');
     }
     if(ref&&(state.requests||[]).some(r=>ref.toLowerCase()===String(r.no||'').toLowerCase()||ref===r.id))return error('Reference သည် ငွေယူလက်မှတ် ID နှင့် ထပ်နေသည်။ Request ID ကိုသာ ချိတ်ဆက်ပါ။');
     if(ref&&(state.cashIns50||[]).some(x=>x.status==='posted'&&x.type==='transfer'&&x.source===src&&x.destination===dst&&String(x.reference||'').toLowerCase()===ref.toLowerCase()))return error('ဤ Reference ဖြင့် ငွေလွှဲပြီးသားဖြစ်ပါသည်။ ထပ်မတင်နိုင်ပါ။');
   }
   return previousSave();
 };
 // Purchase settlement metadata only: actually charged service fees are not temporary cash advances.
 // No change to purchase totals, stock ownership, cash movements, or fee calculation.
 const priorCommit62=commitVoucher4;
 commitVoucher4=function(){
   if(v4Kind!=='purchase')return priorCommit62();
   const existed=new Set((state.receipts||[]).filter(r=>r.status==='purchased').map(r=>r.id));
   const result=priorCommit62();
   const newly=(state.receipts||[]).filter(r=>r.status==='purchased'&&!existed.has(r.id));
   const first=newly[0],c=first?.charges4;
   if(c?.serviceFeeTaken58&&Number(c.serviceFee)>0&&Number(c.serviceRateValue)>0){
     const fee=Number(c.serviceFee),receiptRef=first.purchaseNo||first.voucherNo||first.no;
     if(Array.isArray(c.recoverableBreakdown57)){
       c.recoverableBreakdown57=c.recoverableBreakdown57.filter(item=>item.kind!=='service');
       c.recoverableTotal57=c.recoverableBreakdown57.reduce((n,item)=>n+(Number(item.amount)||0),0);
     }
     c.chargedServiceRevenue62=fee;
     for(const item of (state.expenses||[])){
       if(item.ref!==receiptRef||!item.paymentPending||!item.recoverable||!Array.isArray(item.recoverableBreakdown57))continue;
       item.recoverableBreakdown57=item.recoverableBreakdown57.filter(x=>x.kind!=='service');
       item.amount=item.recoverableBreakdown57.reduce((n,x)=>n+(Number(x.amount)||0),0);
     }
     save();
   }
   return result;
 };
 // A legacy request remains in its original status; do not manufacture missing trader/batch data.
 document.title='ပွဲရုံ · V62 Cash Request / P&L / Batch Review';
})();

