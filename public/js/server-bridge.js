/* Final overrides: only semantic commands reach Laravel; no browser business database. */
(function(){
 'use strict';
 // Release numeric focus before native wheel stepping; keep normal page scrolling.
 document.addEventListener('wheel',event=>{
  const input=event.target;
  if(!event.ctrlKey&&input instanceof HTMLInputElement&&input.type==='number'&&input===document.activeElement)input.blur();
 },{capture:true,passive:true});
 const $=id=>document.getElementById(id),v=id=>$(id)?.value??'',checked=id=>!!$(id)?.checked;
 const str=n=>String(n??'0'),decimal=id=>v(id)||'0',clone=x=>JSON.parse(JSON.stringify(x));
 state=pweHydrate(clone(window.__PWE_BOOT__));
 let committed=clone(state),busy=false,pending=null,openingTimer=null,openingPromise=Promise.resolve();
 let backgroundSaving=false,commandDone=Promise.resolve();
 const actualRole=window.__PWE_BOOT__.actorRole||window.__PWE_BOOT__.role;
 let viewRole=window.__PWE_BOOT__.role,switchingView=false;
 const originalToast=toast;
 const account=id=>state.__ids.accounts[id]??id;
 const product=name=>state.masters.products.find(p=>p.name===name)?.id;
 const report=message=>{const el=$('modalError')||$('opening69Error');if(el){el.textContent=message;el.style.display='block';}else originalToast(message,true);};
 function buttons(disabled){document.querySelectorAll('#main button,#main input,#main select,#main textarea,#roleSelect').forEach(b=>{if(disabled){if(b.dataset.serverWasDisabled===undefined)b.dataset.serverWasDisabled=String(b.disabled);b.disabled=true;}else if(b.dataset.serverWasDisabled!==undefined){b.disabled=b.dataset.serverWasDisabled==='true';delete b.dataset.serverWasDisabled;}});}
 function apply(data){state=pweHydrate(data);state.role=actualRole==='owner'?viewRole:'staff';committed=clone(state);syncMasters();storageOK=true;}
 async function command(action,input={},options={}){
  const background=!!(options.draft&&options.quiet);
  if(busy){
   if(!backgroundSaving&&!background)return false;
   if(!background)buttons(true);
   await commandDone;return command(action,input,options);
  }
  const intent=JSON.stringify({action,input});
  if(pending&&pending.intent!==intent){report('ယခင်သိမ်းဆည်းမှု၏ ရလဒ်မသေချာသေးပါ။ မူလပမာဏအတိုင်း ထပ်သိမ်း၍ အခြေအနေစစ်ပါ။');return false;}
  if(!pending)pending={intent,key:crypto.randomUUID()};
  let releaseCommand;commandDone=new Promise(resolve=>{releaseCommand=resolve;});
  busy=true;backgroundSaving=background;
  if(!background){buttons(true);document.body.dataset.saving='true';}
  let status=$('serverSaveStatus');if(!status){status=document.createElement('div');status.id='serverSaveStatus';status.setAttribute('role','status');status.style.cssText='position:fixed;right:20px;bottom:20px;padding:12px 18px;background:#215b3d;color:white;z-index:99999;border-radius:10px';document.body.append(status);}status.textContent='သိမ်းဆည်းနေသည်…';status.hidden=!!(options.draft&&options.quiet);
  try{
   const response=await fetch('/api/commands',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').content,'Idempotency-Key':pending.key},body:intent});
   const data=await response.json().catch(()=>({message:'Server returned an unreadable response.'}));
   if(!response.ok){if(response.status<500)pending=null;throw new Error(Object.values(data.errors||{}).flat().join('\n')||data.message||'သိမ်းမရပါ။');}
   pending=null;
   if(options.draft){committed=pweHydrate(data.state);if(JSON.stringify(state.initialOpening69)===JSON.stringify(input.draft))state.initialOpening69=clone(committed.initialOpening69);}
   else {apply(data.state);workDirty=false;if(!options.keepForm){workView=null;productReturn=null;page=options.page||page;render();}}
   if(options.after)options.after(data.result);
   if(!options.quiet)originalToast('သိမ်းပြီးပါပြီ။');return data.result;
  }catch(e){report(e.message);status.hidden=false;status.textContent='သိမ်းဆည်းမှုရလဒ်ကို ပြန်စစ်ရန် လိုပါသည်။';if(pending){const retry=document.createElement('button');retry.type='button';retry.className='btn btn-secondary btn-sm';retry.dataset.retrySave='true';retry.textContent='မူလသိမ်းဆည်းမှုကို ပြန်စစ်မယ်';retry.onclick=()=>{const original=JSON.parse(pending.intent);return command(original.action,original.input,options);};status.append(retry);}return false;}
  finally{busy=false;backgroundSaving=false;buttons(!!pending);delete document.body.dataset.saving;if(!pending)status.hidden=true;releaseCommand();}
 }
 window.pweServer={command};
 function bind(name,action,input,options={}){window[name]=function(...args){try{return command(typeof action==='function'?action(...args):action,input(...args),typeof options==='function'?options(...args):options);}catch(e){report(e.message);return false;}};}
 function splits(){return [...document.querySelectorAll('#splitRows4 .req-split')].map(el=>{const i=el.dataset.i;return {account_id:account(v('sa'+i)),amount:decimal('sm'+i)};}).filter(s=>Number(s.amount)>0);}
 function distributePurchasePayment(){
  if(v4Kind!=='purchase'||!$('voucher4'))return;
  const rows=[...document.querySelectorAll('#voucher4 #splitRows4 .req-split')];
  const amount=(v('fPaid')||'0').match(/^(\d*)(?:\.(\d{0,2}))?$/);
  if(!rows.length||!amount)return;
  // Divide exact hundredths; allocate the remainder without losing any money.
  const total=BigInt(amount[1]||'0')*100n+BigInt((amount[2]||'').padEnd(2,'0'));
  const count=BigInt(rows.length),share=total/count,remainder=total%count;
  rows.forEach((row,index)=>{
   const value=share+(BigInt(index)<remainder?1n:0n);
   $('sm'+row.dataset.i).value=value%100n===0n?String(value/100n):String(value/100n)+'.'+String(value%100n).padStart(2,'0');
  });
 }
 const addPaymentSplit=addSplit4;
 addSplit4=function(...args){const result=addPaymentSplit.apply(this,args);distributePurchasePayment();return result;};
 document.addEventListener('input',event=>{
  if(event.target.id==='fPaid'&&event.target.closest('#voucher4'))distributePurchasePayment();
 });
 document.addEventListener('click',event=>{
  const row=event.target.closest('#voucher4 #splitRows4 .req-split'),form=$('voucher4');
  if(!row)return;
  queueMicrotask(()=>{if(form===$('voucher4')&&!row.isConnected)distributePurchasePayment();});
 },true);
 function labor(){
  if(typeof purchaseLaborRows!=='function')return [];
  return purchaseLaborRows().filter(r=>r.bags>0).map(row=>{
   const rateId=row.rateMasterId||row.masterId;
   const rate=committed.laborRateMasters51?.find(rate=>rate.id===rateId&&rate.active!==false);
   const mael=committed.laborMaelMasters51?.find(mael=>mael.id===row.maelId&&mael.active!==false);
   if(!rate||!mael)throw Error('သတ်မှတ်ချက်တွင် သိမ်းထားသော မယ်နှုန်းနှင့် မယ်ကို ရွေးပါ။ မရှိပါက အရင်သတ်မှတ်ပါ။');
   return {labor_rate_id:rate.id,mael_id:mael.id,bags:str(row.bags)};
  });
 }
 function adjustments(){
  const out=[];
  const serviceId=v('fServiceRate')||v('fServiceRate48')||v('fServiceRate58');
  const serviceMode=v('fServiceMode')||v('fServiceMode48')||v('v58ServiceMode');
  const serviceDirection=v4Kind==='purchase'?(v('v58ServiceDirection')||'subtract'):'add';
  if(serviceId&&serviceMode==='yes')out.push({rate_id:serviceId,direction:serviceDirection});
  for(const [selector,prefix,amount,direction,dataKey]of [
   ['#purchaseDeductionRows4 .deduction-row4','pdr','pda','subtract','i'],
   ['#purchaseDeductionRows4 .purchase-addition-row2','par2-','paa2-','add','additionIndex'],
   ['#saleDeductionRows58 .sale-deduction-row58','sdr58','sda58','add','i'],
   ['#saleDeductionRows58 .sale-subtraction-row2','ssr2-','ssa2-','subtract','subtractionIndex']])
   for(const el of document.querySelectorAll(selector)){const i=el.dataset[dataKey],id=v(prefix+i);if(id)out.push({rate_id:id,amount:decimal(amount+i),direction});}
  // Service mode/rate input IDs differ across accumulated source revisions.
  const c=typeof readCharges4==='function'?readCharges4():{};
  if(serviceMode==='yes'&&Number(c.serviceRateValue)>0&&!c.serviceRateId)throw Error('သတ်မှတ်ချက်ရှိ ဝန်ဆောင်ခနှုန်းထားကို ရွေးပါ။');
  if(c.serviceRateId&&Number(c.serviceFee)>0&&!out.some(x=>x.rate_id===c.serviceRateId))out.push({rate_id:c.serviceRateId,direction:serviceDirection});
  return out;
 }
 function recoveries(partyId,requested){
  let left=Number(requested??0);const out=[];
  if(!Number.isFinite(left)||left<0)throw Error('ကြိုသုံးငွေ ပြန်နုတ်မည့် ပမာဏကို မှန်ကန်စွာ ဖြည့်ပါ။');
  for(const a of state.partnerAdvances.filter(a=>a.partnerId===partyId)){
   const available=a.amount-(a.allocations||[]).reduce((n,x)=>n+x.amount,0),amount=Math.min(left,available);
   if(amount>0){out.push({document_id:a.id,amount:str(amount)});left-=amount;}
  }if(left>0.00001)throw Error('ကြိုသုံးငွေလက်ကျန် မလောက်ပါ။');return out;
 }
 function carriageOutlays(rows){
  const partyId=rows[0]?.r?.partnerId,documents=new Set(rows.map(row=>String(row.r?.backendDocumentId||'')).filter(Boolean));
  const receipts=state.receipts.filter(receipt=>rows.some(row=>row.r?.id===receipt.id)||(receipt.backendDocumentId&&documents.has(String(receipt.backendDocumentId))));
  const ids=new Set(receipts.map(receipt=>String(receipt.carriageExpenseId||'')).filter(Boolean));
  return state.expenses.filter(expense=>expense.recoverable&&expense.partnerId===partyId&&(ids.has(String(expense.id))||(expense.sourceDocumentId&&documents.has(String(expense.sourceDocumentId)))));
 }
 function outlayRemaining(expense){return expense.recovered?0:Math.max(0,Math.round(Number(expense.amount)*100)-(expense.settlementRecoveries74||[]).reduce((sum,recovery)=>sum+Math.round(Number(recovery.amount)*100),0))/100;}
 function appendOutlayRecoveries(out,pool,requested){
  const amountRequested=Number(requested??0);let left=Math.round(amountRequested*100);
  if(!Number.isFinite(amountRequested)||amountRequested<0||Math.abs(amountRequested*100-left)>0.000001)throw Error('တန်ဆာခ ပြန်နုတ်မည့် ပမာဏကို မှန်ကန်စွာ ဖြည့်ပါ။');
  for(const expense of pool){
   const existing=out.find(row=>String(row.document_id)===String(expense.id));
   const previous=Math.round(Number(existing?.amount||0)*100),available=Math.max(0,Math.round(outlayRemaining(expense)*100)-previous),amount=Math.min(left,available);
   if(amount>0){if(existing)existing.amount=str((previous+amount)/100);else out.push({document_id:expense.id,amount:str(amount/100)});left-=amount;}
  }
  if(left>0)throw Error('တန်ဆာခ ယာယီစိုက်ငွေ လက်ကျန် မလောက်ပါ။');
 }
 function voucher(){
  const sale=v4Kind==='sale',rows=readVoucherLines4(),c=readCharges4();
  const input={date:v('fDate'),party_id:v('fParty'),delivery:v('fDelivery'),payments:splits(),payment_amount:decimal('fPaid'),adjustments:adjustments(),labor:labor(),lines:rows.map(x=>sale?{lot_id:x.l?.id,quantity:decimal('vq'+x.i),price:decimal('vr'+x.i),basis:v('fBasis')==='bag'?'standard_bag':'viss',buyer_package_viss:decimal('vBuyerBag46'+x.i)}:{receipt_line_id:x.r?.id,price:decimal('vr'+x.i),basis:v('fBasis')==='bag'?'standard_bag':'viss',purchase_package_viss:decimal('vPurchaseBag47'+x.i),purchase_bags:decimal('vPurchaseCount55'+x.i)})};
  if(!sale){const partyId=rows[0]?.r?.partnerId;input.recoveries=recoveries(partyId,c.advance);input.loan_offsets=(c.loanPayments38||[]).filter(x=>x.principal+x.interest>0).map(x=>({document_id:x.loanId,principal:str(x.principal),interest:str(x.interest)}));
   const carriage=Number(c.carriage||0),outlays=carriageOutlays(rows),available=outlays.reduce((sum,expense)=>sum+Math.round(outlayRemaining(expense)*100),0);
   if(!Number.isFinite(carriage)||carriage<0||Math.abs(carriage*100-Math.round(carriage*100))>0.000001)throw Error('တန်ဆာခ ပမာဏကို မှန်ကန်စွာ ဖြည့်ပါ။');
   const recovered=Math.min(Math.round(carriage*100),available);
   appendOutlayRecoveries(input.recoveries,outlays,recovered/100);
   input.carriage_deduction=str((Math.round(carriage*100)-recovered)/100);
   for(const row of c.dynamicRows||[]){if(row.recoveryKind==='carriage'||row.itemType==='carriage'){appendOutlayRecoveries(input.recoveries,state.expenses.filter(e=>e.recoverable&&e.partnerId===partyId&&!e.recovered),row.amount);input.adjustments=input.adjustments.filter(x=>x.rate_id!==row.rateId);}}
  }return input;
 }
 // No legacy save may publish a client-computed business state.
 save=function(){
  if(state.initialOpening69?.status==='draft'){
   clearTimeout(openingTimer);openingTimer=setTimeout(()=>{openingTimer=null;const draft=clone(state.initialOpening69);openingPromise=openingPromise.then(()=>command('opening.draft',{draft},{draft:true,quiet:true,keepForm:true}));},450);return;
  }
  state=clone(committed);report('ဤလုပ်ဆောင်ချက်၏ server ချိတ်ဆက်မှု မပြီးသေးပါ။ မသိမ်းထားပါ။');throw new Error('Unmapped source write prevented.');
 };
 toast=function(message,isError=false){if(openingTimer&&!isError)return;return originalToast(message,isError);};
 const morningCashCheck=openCashCheck;
 openCashCheck=function(...args){
  const result=morningCashCheck.apply(this,args);
  if(!state.opening.checked&&$('openingForm')){
   const label=document.querySelector('#main .summary-box .summary-line > span');
   if(label)label.textContent='ပွဲရုံ ငွေသား · စာရင်းအရ လက်ကျန်';
  }
  return result;
 };
 bind('saveOpening','day.open',()=>({actual:decimal('openingActual'),note:v('openingNote')}));
 const receiveFormWithHistory=openReceive4;
 openReceive4=function(...args){
  const result=receiveFormWithHistory.apply(this,args),input=$('fNo');
  if(input){
   input.readOnly=true;
   if(!v4Edit&&state.nextReceiptNumber)input.value=state.nextReceiptNumber;
   const help=input.closest('.field')?.querySelector('.field-help');
   if(help)help.textContent='System က အလိုအလျောက်ထုတ်ပေးသော အမှတ်ဖြစ်သည်။ သိမ်းချိန်တွင် နံပါတ်မထပ်အောင် သတ်မှတ်ပေးပါမည်။';
  }
  return result;
 };
 bind('saveReceive4',()=>v4Edit?'receipt.edit':'receipt.create',()=>{
  const old=v4Edit?state.receipts.find(r=>r.voucherNo===v4Edit):null;
  return {...(old?{document_id:old.backendDocumentId}:{}),date:v('fDate'),party_id:v('fParty'),warehouse_id:v('fWh'),vehicle:v('fCar'),note:v('fNote'),advance_amount:decimal('fAdvanceAmount'),advance_account_id:account(v('fAdvanceAccount')),carriage_amount:decimal('fCarriageAmount'),carriage_account_id:account(v('fCarriageAccount')),lines:[...document.querySelectorAll('#receiveLines4 .req-line')].map(el=>{const i=el.dataset.i,type=v('rbt'+i);const r={...(el.dataset.rid?{id:el.dataset.rid}:{}),product_id:product(v('rp'+i)),grade:v('rg'+i),bag_type:type};if(type==='finished')Object.assign(r,{bags:decimal('rfc'+i),package_viss:decimal('rfv'+i)});else if(type==='weight')r.quantity=decimal('rwoq'+i);else{r.bags=decimal('rb'+i);if(v('rw'+i)==='yes')r.quantity=decimal('rq'+i);}return r;})};
 },next=>({page:'receipts',after:result=>{const r=state.receipts.find(r=>r.backendDocumentId===result.document_id);if(next==='price'&&r)purchase4(r.id);if(next==='new')openReceive4();}}));
 window.commitVoucher4=()=>{try{return command(v4Kind==='sale'?'sale.create':'purchase.create',voucher(),{page:v4Kind==='sale'?'sales':'receipts'});}catch(e){report(e.message);}};
 bind('savePayment4','payment.create',(kind,id,slipId='')=>{const r=(kind==='sale'?state.sales:state.receipts).find(x=>x.id===id);return {document_id:kind==='sale'?r.backendDocumentId:r.purchaseDocumentId,date:v('fDate'),payments:splits(),payment_amount:decimal('fPaid'),...(slipId?{request_id:slipId}:{})};},{page:'cash'});
 bind('saveDispatch4','dispatch.create',()=>({lot_id:v('dLot'),quantity:decimal('dQty'),date:v('fDate'),vehicle:v('dCar2')||v('dispatchCar'),collector:v('dCollector2')||v('dispatchCollector')}),{page:'sales'});
 bind('savePack4','packaging.create',()=>({lot_id:v('pkLot'),package_type_id:v('pkType'),bags:decimal('pkCount'),date:v('fDate'),measured_quantity:decimal('pkActualWeight2')}),{page:'inventory'});
 bind('saveTransfer4','warehouse.transfer',()=>({lot_id:v('tLot'),warehouse_id:v('tWh'),date:v('fDate'),...(v('tQty')?{quantity:v('tQty')}:{}),...(v('tBags')?{bags:v('tBags')}:{})}),{page:'inventory'});
 bind('saveAdjustment','stock.adjust',()=>({lot_id:v('ajLot2'),unit:v('ajUnit2'),quantity:(v('adjustDirection')==='out'?'-':'')+decimal('adjustQty'),...(v('ajBags2')?{bags:(v('adjustDirection')==='out'?'-':'')+v('ajBags2')}:{}),reason:[v('ajReason2'),v('adjustReason')].filter(Boolean).join(' · '),date:v('adjustDate')}),{page:'inventory'});
 bind('pweSaveGround64','stock.check.submit',()=>({lot_id:v('gLot64'),date:v('gDate2'),quantity:v('gWeight64'),bags:v('gBags64'),reason:[v('gReason2'),v('gNote64')].filter(Boolean).join(' · ')}),{page:'inventory'});
 bind('pweApproveGround64','stock.check.approve',id=>({id}),{page:'inventory'});
 bind('pweConfirmReject64','stock.check.reject',id=>({id,note:v('gRejectReason64')||v('gReject64')||v('rejectReason64')}),{page:'inventory'});
 bind('saveSupplierAdvance','advance.create',id=>({party_id:id,amount:decimal('advanceAmount'),account_id:account(v('advanceAccount')),note:v('advanceReason')}),{page:'cash'});
 bind('saveLoan38','loan.create',()=>({party_id:v('loanParty38'),amount:decimal('loanAmount38'),policy_id:v('loanRate38'),account_id:account(v('loanAccount38')),date:v('loanDate38'),note:v('loanNote38')}),{page:'cash'});
 bind('saveRepay38','loan.repay',id=>({document_id:id,principal:decimal('repayPrincipal38'),interest:decimal('repayInterest38'),account_id:account(v('repayAccount38')),date:v('repayDate38')}),{page:'cash'});
 bind('saveExpense','expense.create',()=>({amount:decimal('expenseAmount'),reason_id:v('expenseReason'),account_id:account(v('expenseAccount'))}),{page:'cash'});
 bind('saveCashIn50','cash.fund',()=>({mode:v('cash50Mode'),source_id:account(v('cash50Source')),destination_id:account(v('cash50Destination')),amount:decimal('cash50Amount'),description:v('cash50Description'),reference:v('cash50Reference'),coa_id:v('cash50Coa'),category_id:state.__ids.categories?.[v('cash50Mode')==='transfer'?'COA50-TRANSFER':v('cash50Coa')],confirmed:checked('cash50Confirmed'),request_id:v('cash50RequestId62'),independent:checked('cash50Independent62')}),{page:'cash'});
 bind('reverseCashIn50','cash.reverse',id=>({document_id:id,reason:'Cash In Reversal'}),{page:'cash'});
 bind('saveMoneyRequest','request.create',()=>({kind:'home',amount:decimal('requestAmount'),collector:v('requestCollector'),reason:v('requestReason')}),{page:'cash'});
 bind('saveSlip4','request.create',id=>({kind:'collection',document_id:state.sales.find(s=>s.id===id)?.backendDocumentId,amount:decimal('slipAmount'),collector:v('slipCollector')||'စာရေးမ',reason:'အရောင်းငွေ တောင်းခံ',date:v('fDate')}),{page:'cash'});
 bind('pweSettleRequest62','request.receive',(id,amount)=>({document_id:id,amount:str(amount),account_id:account('cash'),confirmed:true}),{page:'cash'});
 bind('pweReceiveRequest62','request.receive',id=>({document_id:id,amount:decimal('requestReceived62'),account_id:account('cash'),confirmed:true}),{page:'cash'});
 bind('receiveMoney','request.receive',id=>({document_id:id,amount:decimal('requestReceived62'),account_id:account('cash'),confirmed:true}),{page:'cash'});
 bind('saveCloseDay','day.close',()=>({actual:decimal('closeActual'),transfer:decimal('closeTransfer'),note:v('closeNote'),confirmed:checked('close53Confirm')}));
 bind('startNextDay','day.next',()=>({}),{page:'home'});
 const nextDayForm=openNextDay;
 let refreshingClosedDay=false;
 async function refreshClosedDay(){
  if(refreshingClosedDay||busy||pending||switchingView||viewRole!=='staff'||!state.closed||workDirty||workView)return false;
  refreshingClosedDay=true;const previousDay=state.day;
  try{
   const response=await fetch('/api/state',{credentials:'same-origin',headers:{Accept:'application/json'}});
   if(!response.ok)return false;
   const data=await response.json();
   if(busy||pending||switchingView||viewRole!=='staff'||workDirty||workView||state.day!==previousDay||!state.closed)return false;
   state.canStartNextDay=data.canStartNextDay;committed.canStartNextDay=data.canStartNextDay;
   if(data.day===previousDay)return false;
   apply(data);closeModal();workView=null;page='home';render();
   originalToast('နေ့အသစ် ဖွင့်ထားပါပြီ။ နေ့ဖွင့်ငွေစစ်ပြီး အလုပ်ဆက်လုပ်နိုင်ပါသည်။');return true;
  }catch{return false;}finally{refreshingClosedDay=false;}
 }
 openNextDay=async function(...args){
  if(await refreshClosedDay())return;
  if(state.canStartNextDay===false)return report('ယနေ့ နောက်နေ့ဖွင့်ပြီးဖြစ်ပါသည်။ ထပ်ဖွင့်ရန် ပိုင်ရှင်ဘက်မှ ဆောင်ရွက်ပေးပါ။');
  return nextDayForm.apply(this,args);
 };
 window.addEventListener('focus',()=>refreshClosedDay());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshClosedDay();});
 setInterval(()=>{if(!document.hidden)refreshClosedDay();},15000);
 bind('saveProductMaster','master.save',id=>({kind:'product',id:id||null,data:{name:v('masterProductName'),standardViss:decimal('masterStandard'),grades:v('masterGrades').split(/[,၊]/).map(x=>x.trim()).filter(Boolean),active:v('masterProductActive')!=='false'}}),{page:'setup'});
 bind('savePartnerMaster','master.save',(id,kind)=>({kind:'partner',id:id||null,data:{name:v('masterPartnerName'),locality:v('masterPartnerLocality'),phone:v('masterPartnerPhone'),kind,active:v('masterPartnerActive')!=='false'}}),{page:'setup'});
 bind('saveAccountMaster','master.save',id=>({kind:'account',id:id?account(id):null,data:{name:v('masterAccountName'),type:state.masters.accounts.find(a=>a.id===id)?.type||v('masterAccountType'),staffCanView:checked('masterAccountStaffView68'),active:v('masterAccountActive')==='true',openingBalance:decimal('masterAccountOpening68')}}),{page:'setup'});
 bind('setAccountVisibility68','master.save',(id,visible)=>{const a=state.masters.accounts.find(a=>a.id===id);return {kind:'account',id:account(id),data:{...a,staffCanView:visible}};},{page:'setup'});
 bind('saveWarehouseMaster61','master.save',id=>({kind:'warehouse',id:id||null,data:{name:v('wmName61'),active:v('wmActive61')!=='no'}}),{page:'setup'});
 bind('saveWarehouse4','master.save',id=>({kind:'warehouse',id:id||null,data:{name:v('wName'),active:v('wActive')==='yes'}}),{page:'inventory'});
 bind('savePackType4','master.save',id=>({kind:'package',id:id||null,data:{name:v('ptName'),product_id:product(v('ptProduct')),size:decimal('ptSize'),active:v('ptActive')==='yes'}}),{page:'setup'});
 bind('saveLaborRate51','master.save',id=>({kind:'labor',id:id||null,data:{name:v('laborRateName51')||'တစ်မယ် '+decimal('laborRateValue51')+' ကျပ်',kind:'rate',rate:decimal('laborRateValue51'),active:v('laborRateActive51')==='yes'}}),{page:'setup'});
 bind('saveLaborMael51','master.save',id=>({kind:'labor',id:id||null,data:{name:v('laborMaelName51')||decimal('laborMaelValue51')+' မယ်',kind:'mael',rate:decimal('laborMaelValue51'),active:v('laborMaelActive51')==='yes'}}),{page:'setup'});
 bind('saveLaborBag','master.save',id=>({kind:'labor',id:id||null,data:{name:v('lbName'),kind:'bag',weight:v('lbWeight'),rate:decimal('lbRate'),active:v('lbActive')==='yes'}}),{page:'setup'});
 bind('saveDeductionRate','master.save',()=>{const name=v('drName48')||v('drCustomType')||v('drItemType');const mode=name==='ဝန်ဆောင်ခ'?'service_percent':name==='လုပ်သားခ'?'labor':'manual';return {kind:'adjustment',id:deductionEditId&&deductionEditId!=='__new__'?deductionEditId:null,data:{name,kind:v('drApplyAt')||'purchase',itemType:mode==='manual'?'custom':mode==='labor'?'labor':'service',customType:mode==='manual'?name:'',calcMode:mode,rate:decimal('drRate'),active:v('drActive')==='yes'}};},{page:'setup',after:()=>{deductionEditId='';render();}});
 for(const [name,kind]of [['deleteAccountMaster51','account'],['deleteWarehouseMaster61','warehouse'],['deleteProductMaster','product'],['deletePartnerMaster','partner'],['deletePackType4','package'],['deleteDeductionRate','adjustment']])bind(name,'master.inactivate',id=>({kind,id:kind==='account'?account(id):id}),{page:'setup'});
 bind('saveDetailAndNew','receipt.edit',id=>({document_id:state.receipts.find(r=>r.id===id)?.backendDocumentId,vehicle:v('detailCar'),note:v('detailNote')}),{page:'receipts'});
 window.savePrices=event=>{event?.preventDefault();return command('prices.save',{prices:products(true).flatMap((p,i)=>p.grades.map(g=>({product_id:p.id,grade:g,price:v('price_'+i+'_'+g)}))).filter(p=>p.price)},{page:'prices'});};
 const purchaseCarriageCharges=readCharges4;
 readCharges4=function(...args){
  const charges=purchaseCarriageCharges.apply(this,args),input=$('fCarriageRecovery');
  if(v4Kind!=='purchase'||!input)return charges;
  const previous=Number(charges.truck)||0,amount=Number(input.value);
  charges.carriage=amount;charges.truck=amount;
  if(charges.purchaseAdjustments2)charges.purchaseAdjustments2.deductionTotal+=amount-previous;
  return charges;
 };
 const purchaseMarketForm=voucherForm4;
 voucherForm4=function(...args){
  const result=purchaseMarketForm.apply(this,args);
  if(v4Kind!=='purchase'||!$('voucher4'))return result;
  const rows=readVoucherLines4();
  const advance=$('fAdvance'),partyId=rows[0]?.r?.partnerId;
  if(advance&&partyId){
   const balance=Number(supplierBalance(partyId)),available=Number.isFinite(balance)?Math.max(0,balance):0;
   advance.min='0';advance.max=String(available);advance.value=String(available);
  }
  const carriage=carriageOutlays(rows).reduce((sum,expense)=>sum+Math.round(outlayRemaining(expense)*100),0)/100,form=$('voucher4');
  const carriageBox=document.createElement('section');carriageBox.className='summary-box mb';carriageBox.id='purchaseCarriageRecovery';
  carriageBox.innerHTML=field('တန်ဆာခ (ခေါက်ရှည်)','fCarriageRecovery',{type:'number',value:carriage,min:0,step:0.01,suffix:'ကျပ်',help:'ကုန်သည်ရငွေမှ နုတ်မည့် တန်ဆာခကို ဖြည့်ပါ။ ကုန်လက်ခံချိန်တွင် မထည့်ခဲ့လျှင်လည်း ယခုထည့်နိုင်ပါသည်။ စိုက်ထားပြီးသားငွေကို ထပ်မနုတ်ပါ။',extra:'oninput="calcVoucher4()"'});
  const oldCarriage=[...form.querySelectorAll('.summary-box span')].find(node=>node.textContent.startsWith('တန်ဆာခ (ခေါက်ရှည်) · ကုန်လက်ခံချိန်'))?.closest('.summary-box');
  oldCarriage?.remove();
  const advanceField=advance?.closest('.field');
  if(advanceField){carriageBox.style.gridColumn='1 / -1';advanceField.after(carriageBox);}else{const fees=form.querySelector('.v55-fees')||form,heading=fees.querySelector('.v55-section-heading');if(heading)heading.after(carriageBox);else fees.prepend(carriageBox);}
  const basis=$('fBasis');
  let selected=basis.value;
  const drafts={};
  const snapshot=()=>rows.map(row=>$('vr'+row.i)?.value||'');
  const market=()=>rows.map(row=>{
   const price=Number(state.prices[row.product+'|'+row.r?.grade]);
   return state.priceDate===today()&&Number.isFinite(price)&&price>0&&productStandard(row.product)>0?String(price):'';
  });
  drafts[selected]=selected==='bag'?market():snapshot();
  function apply(){
   rows.forEach((row,index)=>{
    const input=$('vr'+row.i);if(!input)return;
    input.value=drafts[selected][index];
    input.title=selected==='bag'?'ယနေ့ တစ်စံအိတ်ပေါက်ဈေး — လိုအပ်သလို ပြန်ပြင်နိုင်သည်။':'';
   });
   calcVoucher4();
  }
  basis.addEventListener('change',()=>{
   if(basis.value===selected)return;
   drafts[selected]=snapshot();selected=basis.value;
   drafts[selected]??=selected==='bag'?market():rows.map(()=>'');
   apply();
  });
  if(selected==='bag')apply();else calcVoucher4();
  return result;
 };
 bind('saveNotebook63','note.save',id=>({...(id?{id:id.replace(/^note:/,'')}:{ }),title:v('noteTitle63'),body:v('noteBody63'),date:v('noteDate63')}),{page:'setup'});
 bind('deleteNotebook63','note.delete',id=>({id}),{page:'setup'});
 bind('saveExpenseReasonMaster','master.save',id=>({kind:'expense_reason',id:id||null,data:{name:v('masterExpenseReasonName'),active:v('masterExpenseReasonActive')!=='false'}}),{page:'setup'});
 bind('saveCoa50','master.save',id=>({kind:'funding_category',id:state.__ids.categories?.[id]||id||null,data:{name:v('coaName50'),code:v('coaCode50'),type:v('coaType50'),active:v('coaStatus50')==='active'}}),{page:'setup'});
 for(const [name,kind]of [['deleteLaborRate51','labor'],['deleteLaborMael51','labor'],['deleteLaborBag','labor'],['deletePackType49','package'],['deleteCoa50','funding_category']])bind(name,'master.inactivate',id=>({kind,id}),{page:'setup'});
 bind('togglePackType49','master.save',id=>{const p=state.packTypes.find(x=>x.id===id);return {kind:'package',id,data:{name:p.name,product_id:product(p.product),size:str(p.size),active:!p.active}};},{page:'setup'});
 bind('toggleCoa50','master.save',id=>{const c=state.coa50.find(c=>c.id===id);return {kind:'funding_category',id:state.__ids.categories[id],data:{name:c.name,code:c.code,type:c.type,active:!c.active}};},{page:'setup'});
 bind('opening69SavePayment','payment.create',id=>({document_id:id,date:v('op69PayDate'),payments:[{account_id:account(v('op69PayAccount')),amount:decimal('op69PayAmount')}]}),{page:'cash'});
 bind('opening69SaveDispatch','opening.dispatch',id=>({lot_id:id,quantity:decimal('op69DispatchQty'),date:v('op69DispatchDate')}),{page:'inventory'});
 bind('opening69ApplyDeposit','opening.credit',id=>({document_id:id,sale_line_id:v('op69CreditSale'),amount:decimal('op69CreditAmount')}),{page:'cash'});
 bind('opening69Reopen','opening.reopen',()=>({reason:v('op69ReopenReason')}),{page:'setup'});
 bind('opening69CreateProduct','master.save',()=>({kind:'product',data:{name:v('op69NewProductName'),grades:v('op69NewProductGrades').split(/[,၊]/).map(x=>x.trim()).filter(Boolean),...(v('op69NewProductStandard')?{standardViss:v('op69NewProductStandard')}:{})}}),{page:'setup',after:r=>{const p=state.masters.products.find(p=>p.id===String(r.id));if(state.initialOpening69?.pendingStock){state.initialOpening69.pendingStock.product=p.name;state.initialOpening69.pendingStock.grade=p.grades[0];opening69ResumeStock();save();}}});
 bind('opening69CreateParty','master.save',()=>({kind:'partner',data:{name:v('op69PartyName'),locality:v('op69PartyLocality'),phone:v('op69PartyPhone'),kind:document.querySelector('#op69NewPartyForm')?.dataset.kind||'supplier'}}),{page:'setup',after:r=>opening69Party(String(r.id))});
 window.opening69CreateAccount=async()=>{const input={kind:'account',opening_draft_amount:decimal('op69AccountAmount'),data:{name:v('op69AccountName'),type:v('op69AccountType'),staffCanView:checked('op69AccountVisible'),openingBalance:'0'}};clearTimeout(openingTimer);openingTimer=null;if(!await command('opening.draft',{draft:clone(state.initialOpening69)},{draft:true,quiet:true,keepForm:true}))return;return command('master.save',input,{page:'setup',after:()=>opening69OwnTab('cash')});};
 window.opening69Approve=async()=>{
  if(state.role!=='owner')return report('ပိုင်ရှင်ဘက်မှသာ အတည်ပြုနိုင်ပါသည်။');
  const confirmInput=$('op69Confirm');
  if(confirmInput?.disabled){
   const required=document.querySelector('.op69-pending-row');
   if(required){required.click();originalToast('ဤအပိုင်းကို စစ်ပြီးကြောင်း သတ်မှတ်ပြီး အားလုံးပြန်စစ်မယ်သို့ ပြန်သွားပါ။',true);return false;}
  }
  if(!confirmInput?.checked)return report('စစ်ဆေးပြီးကြောင်း အမှန်ခြစ်ပါ။');
  clearTimeout(openingTimer);openingTimer=null;await openingPromise;
  if(!await command('opening.draft',{draft:clone(state.initialOpening69)},{draft:true,quiet:true}))return false;
  return command('opening.approve',{}, {page:'setup'});
 };
 window.opening69SaveDraft=()=>{clearTimeout(openingTimer);openingTimer=null;return command('opening.draft',{draft:clone(state.initialOpening69)},{draft:true});};
 window.pweServer.prepareOpeningImport=async()=>{
  clearTimeout(openingTimer);openingTimer=null;await openingPromise;
  return command('opening.draft',{draft:clone(state.initialOpening69)},{draft:true,quiet:true,keepForm:true});
 };
 window.confirmTrader74=id=>{
  try{
   if(!checked('tsCheck74'))throw Error('ပေါင်းနုတ်ငွေ စစ်ပြီးကြောင်း အမှန်ခြစ်ပါ။');
   if(Number(decimal('tsInitialPaid75'))>0&&!checked('tsInitialCheck75'))throw Error('ငွေတကယ်ပေးချေပြီးကြောင်း အမှန်ခြစ်ပါ။');
   const s=state.traderSettlements74.find(x=>x.id===id);
   const adjustments=[...document.querySelectorAll('#tsOtherRows74 .ts74-other')].map(el=>({rate_id:el.querySelector('.ts74-other-name')?.value,amount:el.querySelector('.ts74-other-amount')?.value||'0',direction:'subtract'}));
   const recovery=recoveries(s.partnerId,decimal('tsAdvance74'));
   for(const el of document.querySelectorAll('#tsForm74 .ts74-recovery')){const amount=el.querySelector('input')?.value||'0';if(Number(amount)>0)recovery.push({document_id:el.dataset.expense,amount});}
   const offsets=[...document.querySelectorAll('#tsForm74 .ts75-loan')].map(el=>({document_id:el.dataset.loan,principal:el.querySelector('.ts75-loan-principal')?.value||'0',interest:el.querySelector('.ts75-loan-interest')?.value||'0'})).filter(x=>Number(x.principal)+Number(x.interest)>0);
   return command('settlement.confirm',{document_id:id,date:v('tsDate74'),service_mode:v('tsMode74'),service_rate:decimal('tsRate74'),adjustments,labor:labor(),recoveries:recovery,loan_offsets:offsets,payments:splits(),payment_amount:decimal('tsInitialPaid75')},{page:'cash'});
  }catch(e){report(e.message);}
 };
 bind('saveTraderPayment74','payment.create',id=>{if(!checked('tsPayCheck74'))throw Error('ငွေတကယ်ပေးချေပြီးကြောင်း အမှန်ခြစ်ပါ။');return {document_id:id,date:v('tsPayDate74'),payment_amount:decimal('tsPayAmount74'),payments:splits()};},{page:'cash'});
 window.traderNet74=s=>s.serverNet??s.gross;
 const previewGross=gross;gross=function(r){return r?.backendGross!==null&&r?.backendGross!==undefined?Number(r.backendGross):previewGross(r);};
 window.traderDue74=id=>state.traderSettlements74.filter(s=>!id||s.partnerId===id).reduce((n,s)=>n+(s.serverNet??s.gross)-(s.serverPaid??0),0);
 function receiptFullySettled(id){
  const receipts=voucherRecords4('purchase',id);if(!receipts.length)return false;
  const sales=new Map();
  for(const receipt of receipts){
   const info=typeof receiptSalePurchaseInfo2==='function'?receiptSalePurchaseInfo2(receipt.id):null;
   const linked=(info?.sales||[]).filter(sale=>!sale.sourceOwner||sale.sourceOwner==='supplier');
   for(const sale of linked)sales.set(sale.id,sale);
   if(receipt.status==='purchased'){if(due(receipt)>0)return false;}
   else if(!info?.full||!linked.length)return false;
  }
  for(const sale of sales.values()){
   const settlement=state.traderSettlements74?.find(record=>record.partnerId===(sale.sourceSupplierId||sale.originPartnerId)&&
    (record.saleIds?.includes(sale.id)||record.saleVoucher===(sale.voucherNo||sale.no)));
   if(!settlement||settlement.status!=='confirmed'||settlement.serverNet==null||settlement.serverPaid==null)return false;
   if(!Number.isFinite(Number(settlement.serverNet))||!Number.isFinite(Number(settlement.serverPaid))||Number(settlement.serverPaid)<Number(settlement.serverNet))return false;
  }
  return true;
 }
 function removeSettledActions(root){
  root.querySelectorAll('button').forEach(button=>{
   const action=button.getAttribute('onclick')||'',label=button.textContent.trim();
   if(action.startsWith('openSupplierAdvance(')||action.startsWith("payVoucher4('purchase',")||label==='ကုန်သည်ငွေရှင်းသို့')button.remove();
  });
 }
 const receiptRowsWithHistory=renderReceiptRows;
 renderReceiptRows=function(){
  const result=receiptRowsWithHistory.apply(this,arguments);
  document.querySelectorAll('#receiptRows article').forEach(card=>{
   const action=[...card.querySelectorAll('[onclick]')].map(button=>button.getAttribute('onclick')).find(action=>action.startsWith('receiptDetail4('));
   const id=action?.match(/^receiptDetail4\('([^']+)'/)?.[1];
   if(!id||!receiptFullySettled(id))return;
   const badge=card.querySelector('.pill');if(badge){badge.textContent='ငွေရှင်းပြီးသား';badge.className='pill';}
   card.dataset.receiptSettled='true';removeSettledActions(card);
  });return result;
 };
 const receiptDetailWithHistory=receiptDetail4;
 receiptDetail4=function(id){
  const result=receiptDetailWithHistory.apply(this,arguments);
  const footer=document.querySelector('#main .work-page .modal-footer');
  if(footer&&receiptFullySettled(id)){
   removeSettledActions(footer);
   const body=document.querySelector('#main .work-page .modal-body');
   if(body&&!body.querySelector('[data-receipt-settled]'))body.insertAdjacentHTML('afterbegin','<div class="mb" data-receipt-settled="true"><span class="pill">ငွေရှင်းပြီးသား</span></div>');
  }
  if(!footer||footer.querySelector('[data-receipt-print]')||!state.receipts.some(receipt=>receipt.id===id))return result;
  const print=document.createElement('button');print.type='button';print.className='btn btn-secondary';print.dataset.receiptPrint='true';
  print.innerHTML=I('print')+'<span>ဘောက်ချာ Print ထုတ်မယ်</span>';
  print.onclick=()=>printVoucher4('purchase',id);
  footer.insertBefore(print,footer.children[1]||null);return result;
 };
 // Adjustment masters open in a centered dialog instead of below the settings table.
 const adjustmentEditor=deductionEditor,adjustmentPage=deductionRatesPage;
 deductionEditor=function(){
  const body=adjustmentEditor();if(!body)return '';
  return '<dialog id="adjustmentRateDialog" aria-label="ပေါင်းငွေ / နုတ်ငွေအမျိုးအစား" oncancel="event.preventDefault();cancelDeductionRate()"><div id="modalError" class="form-error" role="alert"></div>'+body+'</dialog>';
 };
 deductionRatesPage=function(){
  const root=document.createElement('div');root.innerHTML=adjustmentPage();
  const add=root.querySelector('[onclick="editDeductionRate()"]');
  if(add)for(const node of add.childNodes)if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent.replace(/^\s*\+\s*/, ' ');
  return root.innerHTML;
 };
 editDeductionRate=function(id=''){
  if(busy||pending)return false;
  deductionEditId=id||'__new__';render();
  const dialog=$('adjustmentRateDialog');if(!dialog)return false;
  syncDeductionMode48();dialog.showModal();$('drName48')?.focus();return true;
 };
 cancelDeductionRate=function(){
  if(busy||pending)return false;
  deductionEditId='';render();document.querySelector('[onclick="editDeductionRate()"]')?.focus();
 };
 // Account/role controls reflect the authenticated session.
 async function switchWorkspace(view,password){
  if(busy||pending||switchingView)return false;
  switchingView=true;buttons(true);
  try{
   const response=await fetch('/api/workspace/view',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',Accept:'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').content},body:JSON.stringify({view,...(password!==undefined?{password}:{})})});
   const data=await response.json().catch(()=>({message:'ဆက်သွယ်မှု မအောင်မြင်ပါ။ စာမျက်နှာပြန်ဖွင့်ပြီး စစ်ဆေးပါ။'}));
   if(!response.ok)throw Error(Object.values(data.errors||{}).flat().join('\n')||data.message||'View ပြောင်း၍ မရပါ။');
   document.querySelector('meta[name="csrf-token"]').content=data.csrfToken;
   logout.querySelector('input[name="_token"]').value=data.csrfToken;
   viewRole=data.state.role;window.__PWE_BOOT__=clone(data.state);apply(data.state);
   window.dispatchEvent(new Event('pwe:workspace-change'));
   workDirty=false;workView=null;productReturn=null;page=viewRole==='owner'?'owner':'home';render();
   return true;
  }catch(e){report(e.message);return false;}
  finally{switchingView=false;buttons(false);if($('roleSelect'))$('roleSelect').value=viewRole;}
 }
 window.changeRole=role=>{
  if($('roleSelect'))$('roleSelect').value=viewRole;
  if(actualRole!=='owner'||!['owner','staff'].includes(role)||role===viewRole||busy||pending||switchingView)return false;
  if(workDirty&&!confirm('မသိမ်းရသေးသော အချက်အလက်များကို ပယ်ပြီး view ပြောင်းမလား။'))return false;
  if(role==='staff')return switchWorkspace('staff');
  workDirty=false;
  openModal('ပိုင်ရှင် view သို့ ဝင်မယ်','ပိုင်ရှင်ဘက်ဝင်ရန် သီးခြားသတ်မှတ်ထားသော စကားဝှက်ကို ထည့်ပါ။','<form id="ownerViewForm" onsubmit="event.preventDefault();pweConfirmOwnerView()"><div class="field"><label for="ownerViewPassword">စကားဝှက်</label><input id="ownerViewPassword" type="password" autocomplete="current-password" required></div></form>',btn('မပြောင်းတော့ပါ','closeModal()','secondary')+btn('အတည်ပြုပြီး ဝင်မယ်','pweConfirmOwnerView()'));
  $('ownerViewPassword')?.focus();return false;
 };
 window.pweConfirmOwnerView=async()=>{
  const input=$('ownerViewPassword');if(!input||!input.reportValidity())return false;
  const password=input.value;input.value='';
  const result=await switchWorkspace('owner',password);
  if(!result)$('ownerViewPassword')?.focus();return result;
 };
 async function accountRequest(method,input,ownerPassword=false){
  const response=await fetch(ownerPassword?'/api/account/owner-password':'/api/account',{method,credentials:'same-origin',headers:{Accept:'application/json','Content-Type':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]').content},...(input?{body:JSON.stringify(input)}:{})});
  const data=await response.json().catch(()=>({message:'ဆက်သွယ်မှု မအောင်မြင်ပါ။'}));
  if(!response.ok)throw Error(Object.values(data.errors||{}).flat().join('\n')||data.message||'ပြောင်းလဲ၍ မရပါ။');return data;
 }
 window.pweOpenAccount=async(ownerPassword=false)=>{
  if(viewRole!=='owner'||busy||pending||switchingView)return false;
  busy=true;buttons(true);
  try{
   const data=await accountRequest('GET');
   const field=(id,label,type='password',autocomplete='new-password',required=false)=>'<div class="field"><label for="'+id+'">'+label+'</label><input id="'+id+'" type="'+type+'" autocomplete="'+autocomplete+'" '+(required?'required ':'')+(type==='password'&&autocomplete==='new-password'?'minlength="8" maxlength="72"':'')+'></div>';
   openModal(ownerPassword?'ပိုင်ရှင် Password ပြောင်းမယ်':'Login Email နှင့် Password ပြောင်းမယ်',ownerPassword?'ပိုင်ရှင်ဘက်ဝင်ရန် စကားဝှက်အသစ်ကို တစ်ကြိမ်ထည့်ပါ။':'Login Password မပြောင်းလိုပါက အလွတ်ထားပါ။',
    '<form id="accountSettingsForm" data-owner-password="'+ownerPassword+'" onsubmit="event.preventDefault();pweSaveAccount()">'+
    (ownerPassword?field('accountOwnerPassword','ပိုင်ရှင် Password အသစ်','password','new-password',true):field('accountEmail','Login Email','email','username',true)+field('accountNewPassword','Login Password အသစ်'))+'</form>',
    btn('ပိတ်မယ်','closeModal()','secondary')+btn('ပြောင်းလဲမှု သိမ်းမယ်','pweSaveAccount()'));
   if(!ownerPassword)$('accountEmail').value=data.email;
   $(ownerPassword?'accountOwnerPassword':'accountEmail').focus();return true;
  }catch(e){report(e.message);return false;}finally{busy=false;buttons(false);}
 };
 window.pweSaveAccount=async()=>{
  if(viewRole!=='owner'||busy||pending||switchingView||!$('accountSettingsForm')?.reportValidity())return false;
  const ownerPassword=$('accountSettingsForm').dataset.ownerPassword==='true';
  const input=ownerPassword?{owner_view_password:v('accountOwnerPassword')}:{email:v('accountEmail'),password:v('accountNewPassword')};
  $('accountSettingsForm').querySelectorAll('input[type=password]').forEach(el=>el.value='');
  busy=true;buttons(true);document.querySelectorAll('#accountSettingsForm input').forEach(el=>el.disabled=true);
  try{const data=await accountRequest('POST',input,ownerPassword);closeModal();originalToast(data.message);return true;}
  catch(e){report(e.message);return false;}
  finally{busy=false;buttons(false);document.querySelectorAll('#accountSettingsForm input').forEach(el=>el.disabled=false);}
 };
 const oldNav=renderNav;renderNav=function(){oldNav();const select=$('roleSelect');if(select){select.disabled=actualRole!=='owner';select.title='အကောင့်ဖြင့် သတ်မှတ်ထားသော လုပ်ပိုင်ခွင့်';}document.querySelectorAll('[onclick="openReset()"],[onclick="resetDemo()"],.v2-home-footer,.side-foot,.clean-demo').forEach(el=>el.remove());if(viewRole==='owner')$('topNav')?.append(accountSettings,ownerPasswordSettings);$('topNav')?.append(logout);};
 const accountSettings=document.createElement('button');accountSettings.type='button';accountSettings.className='top-nav-btn';accountSettings.id='accountSettingsButton';accountSettings.innerHTML=I('users')+'<span>Login Email / Password</span>';accountSettings.onclick=()=>pweOpenAccount();
 const ownerPasswordSettings=document.createElement('button');ownerPasswordSettings.type='button';ownerPasswordSettings.className='top-nav-btn';ownerPasswordSettings.id='ownerPasswordSettingsButton';ownerPasswordSettings.innerHTML=I('lock')+'<span>ပိုင်ရှင် Password</span>';ownerPasswordSettings.onclick=()=>pweOpenAccount(true);
 window.openReset=window.resetDemo=()=>report('Server business history cannot be reset from this interface.');
 const logout=document.createElement('form');logout.id='logoutForm';logout.method='POST';logout.action='/logout';logout.style.display='contents';logout.innerHTML='<input type="hidden" name="_token"><button class="top-nav-btn" type="submit"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H5v14h4M13 8l4 4-4 4M8 12h9"/></svg><span>ထွက်မယ်</span></button>';logout.querySelector('input').value=document.querySelector('meta[name="csrf-token"]').content;
 // Persisted stock/money can only be refreshed from Laravel. Never send state back.
 window.addEventListener('beforeunload',e=>{if(busy||pending){e.preventDefault();e.returnValue='';}});
 render();
})();
