
/* V73: resolve empty sale-source states through existing receiving/opening flows.
   No generated stock, ownership changes, or changes to voucher posting/pricing. */
(function(){
 'use strict';
 let suspended=null;
 const eligible=l=>Number.isFinite(Number(l.qty))&&Number(l.qty)>0&&l.weightKnown!==false;
 const owner=()=>value('fSaleOwner60')||'owned';
 function diagnostic(){
  if(v4Kind!=='sale'||!document.getElementById('voucher4'))return;
  if(owner()==='supplier'&&window.saleSourceSummary76){saleSourceSummary76();return;}
  let box=document.getElementById('saleSource73');
  if(!box){box=document.createElement('section');box.id='saleSource73';box.className='sale-source73';document.getElementById('voucherLines4').before(box);}
  const kind=owner(),lots=state.lots||[],available=lots.filter(l=>l.owner===kind&&eligible(l));
  box.hidden=available.length>0;
  if(available.length)return;
  const unknown=lots.filter(l=>l.owner===kind&&l.weightKnown===false);
  const opening=state.initialOpening69;
  const draft=opening?.status==='draft'?(kind==='owned'?opening.own.rows:Object.entries(opening.parties||{}).filter(([id])=>supplierBy(id)?.kind==='supplier').flatMap(([,d])=>d.rows||[])):[];
  const name=kind==='supplier'?'ကုန်သည်ပိုင်':'ပွဲရုံပိုင်';
  const unknownReceipts=[...new Set(unknown.map(l=>l.receiptId))].map(id=>state.receipts.find(r=>r.id===id)).filter(r=>r&&r.status!=='purchased');
  box.innerHTML='<strong>'+E(name)+'ကုန် ရွေးနိုင်ရန်</strong>'+
    '<p>လက်ရှိ ရောင်းချနိုင်သော '+E(name)+'ကုန်အသုတ် ၀ ခု ဖြစ်ပါသည်။</p>'+
    (unknown.length?'<p>ပိဿာမတိုင်းရသေးသော အသုတ် '+N(unknown.length)+' ခု ရှိပါသည်။ ကုန်ဝင်မှတ်တမ်းတွင် တကယ်ချိန်ရရှိပိဿာ ဖြည့်ပြီး သိမ်းပါ။</p>':'')+
    (draft?.length?'<p>စတင်လက်ကျန် မူကြမ်းတွင် ကုန်လိုင်း '+N(draft.length)+' လိုင်း ရှိပါသည်။ ပိုင်ရှင် အတည်ပြုပြီးမှ အရောင်းတွင် ရွေးနိုင်ပါမည်။</p>':'')+
    (kind==='supplier'?'<p>ပွဲရုံက ဝယ်ယူပြီးသောကုန်သည် ပွဲရုံပိုင်ကုန် ဖြစ်ပါသည်။ ကုန်သည်ကိုယ်စား ရောင်းမည့်ကုန်ကို ကုန်သည်ပိုင်အဖြစ် လက်ခံသိမ်းပါ။</p>':'')+
    '<div class="sale-source-actions73">'+
    (kind==='supplier'?'<button type="button" class="btn btn-primary" onclick="saleSourceReceive73()">ကုန်သည်ပိုင်ကုန် လက်ခံမယ်</button>':'')+
    unknownReceipts.map((r,i)=>'<button type="button" class="btn btn-secondary" data-source-receipt73="'+E(r.id)+'">'+E(r.voucherNo||r.no)+' · ပိဿာဖြည့်မယ်</button>').join('')+
    (draft?.length?'<button type="button" class="btn btn-secondary" onclick="saleSourceOpening73()">စတင်လက်ကျန် ပြန်စစ်မယ်</button>':'')+
    (kind==='supplier'&&lots.some(l=>l.owner==='owned'&&eligible(l))?'<button type="button" class="btn btn-secondary" onclick="saleSourceOwned73()">ပွဲရုံပိုင်ကုန် ရွေးမယ်</button>':'')+
    '</div>';
  box.querySelectorAll('[data-source-receipt73]').forEach(b=>b.addEventListener('click',()=>saleSourceReceive73(b.dataset.sourceReceipt73)));
 }
 function suspend(){
  rememberPage();const snap=pageSnapshots.get(workView.id);
  return {snap,kind:v4Kind,rows:v4Rows,edit:v4Edit,receiptIds:[...v4ReceiptIds],role:state.role};
 }
 window.saleSourceOwned73=function(){const el=document.getElementById('fSaleOwner60');if(el){el.value='owned';saleOwnerChanged43();}};
 window.saleSourceOpening73=function(){if(!mayDiscard())return;workDirty=false;closeModal();openInitial69();opening69View('review');};
 window.saleSourceReceive73=function(id='',targetLine76=null,product76=''){
  if(v4Kind!=='sale'||!guardWork())return;
  const receipt=id?state.receipts.find(r=>r.id===id):null;
  if(id&&!receipt)return;
  suspended=suspend();suspended.targetLine76=targetLine76;suspended.product76=product76;
  openReceive4(receipt?(receipt.voucherNo||receipt.no):'');
  if(!receipt){const type=document.getElementById('rbt0');if(type){type.value='weight';toggleReceiveBagType4(0);}}
  receivingUI();
 };
 window.saleSourceReturn73=function(saved=false,receiptId=''){
  if(!suspended)return;
  if(!saved&&!mayDiscard())return;
  if(suspended.role!==state.role){suspended=null;return;}
  const d=suspended;suspended=null;workDirty=false;clearOldModal();
  page=d.snap.page;workView={...d.snap.view,epoch:workEpoch};
  v4Kind=d.kind;v4Rows=d.rows;v4Edit=d.edit;v4ReceiptIds=d.receiptIds;
  productReturn=d.snap.productReturn;wizard=d.snap.wizard;receiptWizard=d.snap.receiptWizard;
  document.getElementById('main').innerHTML=d.snap.html;workDirty=d.snap.dirty;renderNav();
  const lot=window.saleSourceRestore76?saleSourceRestore76(d,receiptId):null;diagnostic();calcVoucher4();
  writeRoute('work',workView.id,workView.route);rememberPage();
  document.getElementById('voucherLines4')?.scrollIntoView({block:'start'});
  if(saved)toast(lot?'ကုန်သည်ပိုင်ကုန် သိမ်းပြီးပါပြီ။ ပိဿာနှင့် ရောင်းဈေး ဖြည့်ပြီး ဆက်ရောင်းနိုင်ပါပြီ။':'ကုန်လက်ခံ သိမ်းပြီးပါပြီ။ မရောင်းမီ တကယ်ရှိပိဿာ ဖြည့်ရန် လိုပါသည်။');
 };
 function receivingUI(){
  const form=document.getElementById('receive4');if(!form)return;
  form.setAttribute('onsubmit',suspended?'event.preventDefault();saveReceiveForSale73()':"event.preventDefault();saveReceive4('list')");
  const footer=document.querySelector('#main .modal-footer .receive-action-stack4');if(!footer)return;
  let button=document.getElementById('receiveSupplier73');
  if(!button){button=document.createElement('button');button.id='receiveSupplier73';button.type='button';button.className='btn btn-primary receive-action4';footer.prepend(button);}
  button.textContent=suspended?'ကုန်သည်ပိုင်အဖြစ် သိမ်းပြီး အရောင်းဆက်မယ်':'ကုန်သည်ပိုင်အဖြစ် သိမ်းမယ်';
  button.setAttribute('onclick',suspended?'saveReceiveForSale73()':"saveReceive4('list')");
  if(!document.getElementById('receiveSupplierHelp73')){
   const note=document.createElement('p');note.id='receiveSupplierHelp73';note.className='note blue';
   note.textContent='ကုန်သည်ကိုယ်စား ရောင်းရန်ဆိုလျှင် “ကုန်သည်ပိုင်အဖြစ် သိမ်းမယ်” ကိုနှိပ်ပါ။ ပွဲရုံက ဝယ်ယူရန်ဆိုလျှင် ဈေးဖြတ်ဝယ်ယူခြင်းကို ဆက်လုပ်ပါ။';form.prepend(note);
  }
  if(suspended){
   footer.querySelectorAll('[onclick="saveReceive4(\'new\')"],[onclick="saveReceive4(\'price\')"]').forEach(b=>b.hidden=true);
   document.querySelector('#main .v2-back')?.setAttribute('onclick','saleSourceReturn73()');
   document.querySelectorAll('#main .modal-footer [onclick="closeModal()"]') .forEach(b=>b.setAttribute('onclick','saleSourceReturn73()'));
  }
 }
 window.saveReceiveForSale73=function(){
  if(!suspended)return;
  // Require measured quantity on this shortcut; the normal receive flow can still hold unweighed bags.
  const measured=[...document.querySelectorAll('#receiveLines4 .req-line')].every(el=>{
   const i=el.dataset.i,t=value('rbt'+i);
   return t==='weight'?number('rwoq'+i)>0:t==='finished'?number('rfv'+i)>0&&number('rfc'+i)>0:value('rw'+i)==='yes'&&number('rq'+i)>0;
  });
  if(!measured)return error('အရောင်းဆက်ရန် ကုန်လိုင်းတိုင်းတွင် တကယ်ချိန်ရရှိသော စုစုပေါင်းပိဿာကို ဖြည့်ပါ။');
  const no=value('fNo');saveReceive4('list');
  if(document.getElementById('receive4'))return; // Native validation failed; keep the receiving form.
  const receipt=state.receipts.find(r=>(r.voucherNo||r.no)===no&&r.product===suspended?.product76)||state.receipts.find(r=>(r.voucherNo||r.no)===no);
  if(receipt)saleSourceReturn73(true,receipt.id);
 };
 const previousReceive=openReceive4;
 openReceive4=function(...args){previousReceive(...args);receivingUI();};
 const previousForm=voucherForm4;
 voucherForm4=function(...args){if(!suspended||!document.getElementById('receive4'))suspended=null;previousForm(...args);diagnostic();};
 const previousOwner=saleOwnerChanged43;
 saleOwnerChanged43=function(...args){previousOwner(...args);diagnostic();};
 const previousNavigate=navigate;
 navigate=function(...args){const before=workView,result=previousNavigate(...args);if(workView!==before)suspended=null;return result;};
 document.title='ပွဲရုံ · V73 Trader Goods Receive and Sale';
})();

