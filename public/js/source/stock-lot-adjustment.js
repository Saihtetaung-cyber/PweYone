
/* Version 2: adjustment of one existing lot, physical unit entry and saved snapshots. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),eps=.000001,round=x=>Math.round(x*1e8)/1e8;
 const finite=x=>typeof x==='number'&&Number.isFinite(x),n=x=>Number.isFinite(Number(x))?Number(x):0;
 const fixed=l=>l?.stockForm==='packaged'&&n(l.packageViss)>0?n(l.packageViss):0;
 const unknown=l=>l?.weightKnown===false||!!l?.unweighedAdjustment2&&n(l.qty)===0;
 const receipt=l=>state.receipts.find(r=>r.id===l?.receiptId);
 const personId=l=>String(l?.partnerId||receipt(l)?.partnerId||l?.originPartnerId||'legacy:'+l?.name);
 const personName=l=>l?.owner==='owned'?'ပွဲရုံပိုင်':String(l?.name||receipt(l)?.name||state.masters.partners.find(p=>p.id===personId(l))?.name||'—');
 const ownership=o=>o==='supplier'?'ကုန်သည်ပိုင်ကုန်':o==='customer'?'ဝယ်သူပိုင်ကုန်':'ပွဲရုံပိုင်ကုန်';
 const bagInfo=l=>{
  if(!l)return {known:false,count:0};
  if(fixed(l))return {known:true,count:round(n(l.qty)/fixed(l))};
  const raw=l.actualBags??l.bags??l.rawBags,count=n(raw);
  const specified=count>0||l.actualBags!==null&&l.actualBags!==undefined||l.bagType==='raw';
  return {known:specified&&raw!==null&&raw!==undefined&&l.transferBagsKnown2!==false&&Number.isInteger(count)&&count>=0,count};
 };
 const eligible=l=>l&&['owned','supplier'].includes(l.owner)&&l.product&&l.warehouse&&Number.isFinite(Number(l.qty))&&n(l.qty)>=0&&(!unknown(l)||bagInfo(l).known);
 const allLots=()=>state.lots.filter(eligible),chosen=()=>state.lots.find(l=>l.id===value('ajLot2'));
 const pending=l=>(state.groundHistory64||[]).some(g=>g.lotId===l?.id&&g.status==='pending');
 const option=(id,label)=>`<option value="${E(id)}">${E(label)}</option>`;
 const options=(id,items,label)=>{const el=$(id);el.innerHTML=option('',label)+items.map(([key,text])=>option(key,text)).join('');el.value=items.length===1?items[0][0]:'';};
 const tabs=(items,current,fn)=>`<div class="aj2-tabs" role="group">${items.map(([key,text])=>`<button type="button" class="${key===current?'active':''}" aria-pressed="${key===current}" onclick="${fn}('${key}')">${E(text)}</button>`).join('')}</div>`;
 const weight=q=>q===null?'မချိန်ရသေး':finite(q)?vissText37(q)+' ပိဿာ':'—';
 const bags=b=>finite(b)?N(b)+' အိတ်':'—';
 const amount=(q,b)=>`<strong>${E(weight(q))}</strong>${finite(b)?`<span>${E(bags(b))}</span>`:''}`;
 const stamp=s=>s&&Number.isFinite(Date.parse(s))?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(s)):'—';
 let seenLot='',formToken='',saving=false;
 const reasonChoices=[['weighing','ချိန်တွယ်ကွာဟ'],['damage','ပျက်စီး / လေလွင့်'],['found','ပြန်တွေ့'],['other','အခြား']];
 function filtered(){return allLots().filter(l=>l.owner===value('ajOwner2')&&(l.owner==='owned'||personId(l)===value('ajPerson2')));}
 window.adjustOwner2=function(owner){
  if(!['owned','supplier'].includes(owner))return;
  $('ajOwner2').value=owner;$('ajOwnerTabs2').innerHTML=tabs([['supplier','ကုန်သည်ပိုင်ကုန်'],['owned','ပွဲရုံပိုင်ကုန်']],owner,'adjustOwner2');
  $('ajPersonWrap2').hidden=owner!=='supplier';$('ajPerson2').disabled=owner!=='supplier';$('ajPerson2').required=owner==='supplier';
  const people=new Map();for(const l of allLots().filter(l=>l.owner==='supplier'))people.set(personId(l),personName(l));
  options('ajPerson2',[...people],'ကုန်သည် ရွေးပါ');adjustPerson2();
 };
 window.adjustPerson2=function(){options('ajWh2',[...new Set(filtered().map(l=>l.warehouse))].map(id=>[id,W(id)]),'ဂိုဒေါင် ရွေးပါ');adjustWarehouse2();};
 window.adjustWarehouse2=function(){options('ajLot2',filtered().filter(l=>l.warehouse===value('ajWh2')).map(l=>[l.id,`${l.product} · ${l.batch||l.id}${fixed(l)?' · '+(l.packName||'ထုပ်ပိုးပြီး'):''}`]),'ကုန်အသုတ် ရွေးပါ');adjustLot2();};
 window.adjustLot2=function(){
  const l=chosen(),b=bagInfo(l);seenLot=l?JSON.stringify(l):'';
  $('adjustQty').value='';$('ajBags2').value='';
  $('ajSource2').innerHTML=l?`<div class="aj2-source-title"><strong>${E(l.product)}</strong><span>${E(ownership(l.owner))}${l.owner==='supplier'?' · '+E(personName(l)):''}</span></div><div>${E(W(l.warehouse))} · ${E(l.batch||l.id)}</div><div class="aj2-source-balance">${amount(unknown(l)?null:n(l.qty),b.known?b.count:undefined)}</div>${fixed(l)?`<div>${E(l.packName||'ထုပ်ပိုးပြီး')} · ${E(weight(fixed(l)))} / အိတ်</div>`:''}`:note('ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် ချိန်ညှိမည့်အသုတ်ကို ရွေးပါ။','blue');
  adjustUnit2(unknown(l)||fixed(l)?'bags':'viss');
 };
 window.adjustDirection2=function(direction){if(!['increase','decrease'].includes(direction))return;$('adjustDirection').value=direction;$('ajDirectionTabs2').innerHTML=tabs([['increase','တိုးမည်'],['decrease','လျှော့မည်']],direction,'adjustDirection2');adjustPreview2();};
 window.adjustUnit2=function(unit){
  const l=chosen();if(!['viss','bags'].includes(unit))return;if(unknown(l))unit='bags';$('ajUnit2').value=unit;
  $('ajUnitTabs2').innerHTML=tabs(unknown(l)?[['bags','အိတ်ဖြင့်']]:[['viss','ပိဿာဖြင့်'],['bags','အိတ်ဖြင့်']],unit,'adjustUnit2');
  const size=fixed(l),showBags=unit==='bags'||!!l&&!size&&bagInfo(l).known;
  $('ajQtyWrap2').hidden=unknown(l);$('adjustQty').disabled=unknown(l);$('adjustQty').readOnly=!!size&&unit==='bags';$('adjustQty').required=!unknown(l)&&(!!size||unit==='viss');$('adjustQty').min=unit==='viss'||size?'.01':'0';
  $('ajBagsWrap2').hidden=!showBags;$('ajBags2').disabled=!showBags;$('ajBags2').required=unit==='bags';
  $('ajBagsLabel2').textContent=unit==='bags'?'ချိန်ညှိမည့်အိတ်':'အိတ်ပါ ကွာဟလျှင် ဖြည့်ပါ';
  $('ajAmounts2').append(unit==='bags'?$('ajBagsWrap2'):$('ajQtyWrap2'),unit==='bags'?$('ajQtyWrap2'):$('ajBagsWrap2'));
  $('ajHelp2').textContent=unknown(l)?'ပိဿာမချိန်ရသေးသဖြင့် အိတ်အရေအတွက်ကိုသာ ချိန်ညှိမည်။ ပိဿာကို မခန့်မှန်းပါ။':size?'တစ်အိတ်ဝင်ပိဿာအတိုင်း အလိုအလျောက်တွက်မည်။ အိတ်ပြည့်သာ ချိန်ညှိပါ။':unit==='bags'?'အိတ်ကွာဟချက်ကို ဖြည့်ပါ။ ပိဿာပါ ကွာဟလျှင် တကယ်ကွာသည့်ပိဿာကို ဖြည့်ပါ။ ပိဿာမကွာလျှင် အလွတ် သို့မဟုတ် 0 ထားပါ။':'တကယ်ကွာဟသည့် ပိဿာကို ဖြည့်ပါ။ အိတ်အရေအတွက် မကွာလျှင် အိတ်နေရာကို အလွတ်ထားပါ။';
  adjustPreview2();
 };
 function plan(){
  const l=chosen(),b=bagInfo(l),size=fixed(l),unit=value('ajUnit2'),sign=value('adjustDirection')==='decrease'?-1:1;
  let qty=unknown(l)?null:value('adjustQty')===''?0:number('adjustQty'),count=value('ajBags2')===''?undefined:number('ajBags2');
  if(size){if(unit==='bags')qty=round(n(count)*size);else count=round(qty/size);}
  else if(unit==='viss'&&$('ajBags2').disabled)count=undefined;
  return {l,b,size,unit,sign,qty,count,afterQty:unknown(l)?null:round(n(l?.qty)+sign*n(qty)),afterBags:b.known?round(b.count+sign*n(count)):undefined};
 }
 function validation(p,full=false){
  const {l,b,size,unit,qty,count,afterQty,afterBags}=p;
  if(!l||!eligible(l)||l.owner!==value('ajOwner2')||l.warehouse!==value('ajWh2')||l.owner==='supplier'&&personId(l)!==value('ajPerson2'))return 'ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် အသုတ်ကို ပြန်ရွေးပါ။';
  if(JSON.stringify(l)!==seenLot)return 'ဖောင်ဖွင့်ပြီးနောက် အသုတ်လက်ကျန် ပြောင်းထားပါသည်။ အသုတ်ကို ပြန်ရွေးပါ။';
  if(pending(l))return 'ဤအသုတ်တွင် မြေပြင်စစ်ချက် Pending ရှိပါသည်။ မြေပြင်စစ်ချက်မှ ဆက်လက်စစ်ဆေးပါ။';
  if(!['increase','decrease'].includes(value('adjustDirection'))||!['viss','bags'].includes(unit)||unknown(l)&&unit!=='bags')return 'တိုး / လျှော့နှင့် ချိန်ညှိယူနစ်ကို ပြန်ရွေးပါ။';
  if(!unknown(l)&&(!finite(qty)||qty<0||qty>1e9||Math.abs(qty*100-Math.round(qty*100))>eps||(unit==='viss'||size)&&qty<=0))return 'ချိန်ညှိပိဿာကို ဒဿမ ၂ နေရာအထိ မှန်ကန်စွာ ဖြည့်ပါ။';
  if((unit==='bags'||count!==undefined)&&(!finite(count)||!Number.isInteger(count)||count<=0||count>1e9))return 'ချိန်ညှိအိတ်ကို သုညထက်ကြီးသော ကိန်းပြည့်ဖြင့် ဖြည့်ပါ။';
  if(!size&&(unit==='bags'||count!==undefined)&&!b.known)return 'ဤအသုတ်၏ အိတ်လက်ကျန် မသိသဖြင့် ပိဿာဖြင့် ချိန်ညှိပါ။';
  if(afterQty!==null&&afterQty<-eps||b.known&&afterBags<-eps)return 'လက်ကျန်ထက် ပိုလျှော့၍ မရပါ။';
  if(afterQty!==null&&afterQty>1e9||b.known&&afterBags>1e9)return 'ချိန်ညှိပြီးလက်ကျန် ပမာဏကို ပြန်စစ်ပါ။';
  if(size&&Math.abs(n(count)-Math.round(n(count)))>eps)return 'ထုပ်ပိုးပြီးကုန်ကို အိတ်ပြည့်နှင့် ကိုက်ညီသော ပိဿာဖြင့်သာ ချိန်ညှိပါ။';
  if(!reasonChoices.some(x=>x[0]===value('ajReason2')))return 'ချိန်ညှိအကြောင်းရင်းကို ရွေးပါ။';
  if(full&&value('ajReason2')==='other'&&!value('adjustReason'))return 'အခြားအကြောင်းရင်းကို မှတ်ချက်တွင် ရေးပါ။';
  return '';
 }
 window.adjustPreview2=function(){
  if(!$('adjustForm'))return;const p=plan(),l=p.l;
  const formError=$('modalError');if(formError){formError.textContent='';formError.style.display='none';}
  if(p.size&&p.unit==='bags')$('adjustQty').value=p.qty>0?String(p.qty):'';
  const warning=validation(p);$('ajSave2').disabled=!!warning;
  $('ajGroundLink2').hidden=!l||!pending(l);
  $('ajPreview2').innerHTML=l?`<div class="aj2-preview-grid"><div><span>လက်ရှိလက်ကျန်</span>${amount(unknown(l)?null:n(l.qty),p.b.known?p.b.count:undefined)}</div><div><span>${p.sign>0?'ယခုတိုးမည့်ပမာဏ':'ယခုလျှော့မည့်ပမာဏ'}</span>${amount(p.qty,p.count)}</div><div><span>ချိန်ညှိပြီးလက်ကျန်</span>${amount(p.afterQty,p.afterBags)}</div></div>${warning?`<p class="aj2-warning">${E(warning)}</p>`:''}`:'';
  $('ajOther2').textContent=value('ajReason2')==='other'?'မှတ်ချက် *':'မှတ်ချက်';$('adjustReason').required=value('ajReason2')==='other';
 };
 window.adjustGoGround2=function(){workDirty=false;closeModal();navigate('inventory');invTab='ground';renderInventoryBody();};
 openAdjustment=function(){
  if(!guardWork())return;
  if(!allLots().length)return toast('ချိန်ညှိရန် ကုန်အသုတ် မရှိပါ။ ကုန်ဝင် သို့မဟုတ် စတင်လက်ကျန်တွင် အရင်ထည့်ပါ။',true);
  formToken='AJ-'+Date.now()+'-'+Math.random().toString(36).slice(2);saving=false;
  const owner=['owned','supplier'].includes(inventoryOwner)&&allLots().some(l=>l.owner===inventoryOwner)?inventoryOwner:allLots()[0].owner;
  openModal('ကုန်ချိန်ညှိ','ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် အသုတ်ရွေးပြီး တကယ်ကွာဟသည့် ပမာဏကို ချိန်ညှိပါ။',`<form id="adjustForm" class="aj2-form" onsubmit="event.preventDefault();saveAdjustment()"><input id="ajOwner2" type="hidden"><input id="adjustDirection" type="hidden"><input id="ajUnit2" type="hidden">
   <div class="field"><label>ကုန်ပိုင်ဆိုင်မှု</label><div id="ajOwnerTabs2"></div></div>
   <div id="ajPersonWrap2" class="field"><label for="ajPerson2">ကုန်သည်</label><select id="ajPerson2" onchange="adjustPerson2()"></select></div>
   <div class="field-row">${selectField('ဂိုဒေါင်','ajWh2',[],'','required onchange="adjustWarehouse2()"')}${selectField('ကုန် / မူလအသုတ်','ajLot2',[],'','required onchange="adjustLot2()"')}</div>
   <div id="ajSource2" class="aj2-source" aria-live="polite"></div>
   <div class="field-row"><div class="field"><label>တိုး / လျှော့</label><div id="ajDirectionTabs2"></div></div><div class="field"><label>ချိန်ညှိယူနစ်</label><div id="ajUnitTabs2"></div></div></div>
   <div id="ajAmounts2" class="field-row"><div id="ajQtyWrap2">${field('ချိန်ညှိမည့်ပိဿာ','adjustQty',{type:'number',min:0,step:.01,suffix:'ပိဿာ',placeholder:'ဥပမာ 5.25',extra:'oninput="adjustPreview2()" max="1000000000"'})}</div><div id="ajBagsWrap2" class="field"><label id="ajBagsLabel2" for="ajBags2">ချိန်ညှိမည့်အိတ်</label><input type="number" id="ajBags2" min="1" max="1000000000" step="1" placeholder="ဥပမာ 1" oninput="adjustPreview2()"></div></div>
   <p id="ajHelp2" class="aj2-help"></p>
   <div class="field-row">${selectField('အကြောင်းရင်း','ajReason2',reasonChoices,'weighing','onchange="adjustPreview2()"')}${field('ရက်စွဲ','adjustDate',{type:'date',value:today(),required:true})}</div>
   <div class="field"><label id="ajOther2" for="adjustReason">မှတ်ချက်</label><input id="adjustReason" maxlength="300" placeholder="လိုအပ်လျှင် အသေးစိတ်ရေးပါ"></div>
   <div id="ajPreview2" class="summary-box" aria-live="polite"></div><div id="ajGroundLink2" class="mt" hidden>${btn('မြေပြင်စစ်ချက်သို့','adjustGoGround2()','secondary')}</div>
  </form>`,btn('ပြန်မယ်','closeModal()','secondary')+'<button type="button" id="ajSave2" class="btn btn-primary" onclick="saveAdjustment()">ချိန်ညှိပြီး သိမ်းမယ်</button>',true);
  $('adjustForm').dataset.token=formToken;adjustDirection2('decrease');adjustOwner2(owner);
 };
 function snapshot(l,before,after,meta){
  const r=receipt(l);return {schema:1,recordedAt:meta.recordedAt,role:state.role,source:meta.source,owner:l.owner,ownerName:personName(l),partnerId:l.owner==='supplier'?personId(l):'',
   product:l.product,grade:l.grade||'',warehouseId:l.warehouse,warehouseName:W(l.warehouse),lotId:l.id,sourceBatch:l.batch||'',sourceReceiptId:l.receiptId||'',sourceReceiptNo:r?.voucherNo||r?.no||l.originReceiptNo||'',
   packageViss:fixed(l)||null,packName:l.packName||'',qtyBefore:before.qty,bagsBefore:before.bags,qtyDelta:before.qty===null?null:round(after.qty-before.qty),bagsDelta:meta.source==='manual'?(meta.bagDelta??null):finite(before.bags)&&finite(after.bags)?round(after.bags-before.bags):null,
   qtyAfter:after.qty,bagsAfter:after.bags,unit:meta.unit,reasonCode:meta.reasonCode,reasonLabel:meta.reasonLabel,note:meta.note,unitCost:n(l.cost),groundCheckId:meta.groundCheckId||''};
 }
 saveAdjustment=function(){
  const form=$('adjustForm');if(!form||saving||form.dataset.token!==formToken||!guardWork()||!validForm('adjustForm'))return;
  const p=plan(),message=validation(p,true);if(message)return error(message);
  const date=value('adjustDate');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)return error('မှန်ကန်သော ရက်စွဲကို ရွေးပါ။');
  saving=true;const l=p.l,wasUnknown=unknown(l),recordedAt=new Date().toISOString(),reasonLabel=reasonChoices.find(x=>x[0]===value('ajReason2'))[1],note=value('adjustReason');
  const before={qty:wasUnknown?null:n(l.qty),bags:p.b.known?p.b.count:undefined};
  const after={qty:p.afterQty===null?null:Math.max(0,p.afterQty),bags:finite(p.afterBags)?Math.max(0,p.afterBags):undefined};
  const h=snapshot(l,before,after,{recordedAt,source:'manual',unit:p.unit,reasonCode:value('ajReason2'),reasonLabel,note,bagDelta:p.count===undefined?null:p.sign*p.count});
  l.qty=after.qty===null?0:after.qty;
  if(finite(after.bags)){l.bags=after.bags;l.actualBags=after.bags;l.transferBagsKnown2=true;if(l.bagType==='raw')l.rawBags=after.bags;}
  if(p.size)l.packageCount=after.bags;
  if(wasUnknown){l.unweighedAdjustment2=true;l.weightKnown=after.bags===0;}
  l.adjustmentTracked2=true;
  const id=uid('ADJ');state.adjustments.push({id,date,product:l.product,direction:value('adjustDirection'),qty:wasUnknown?0:p.qty,reason:reasonLabel+(note?' · '+note:''),lotId:l.id,warehouse:l.warehouse,batch:l.batch,owner:l.owner,sourceReceiptId:l.receiptId||'',recordedAt,formToken2:formToken,history2:h});
  if(p.qty>0)dateMove(l.product,p.qty,p.sign>0?'in':'out',id+' — '+reasonLabel,date,'adjustment');
  formToken='';audit4(l.product+' · '+(l.batch||l.id)+' အသုတ်ကို '+reasonLabel+' ဖြင့် ကုန်ချိန်ညှိခဲ့သည်။');invTab='adjustments';done4('ကုန်ချိန်ညှိမှတ်တမ်း သိမ်းပြီးပါပြီ။','inventory');
 };
 // Preserve ground-check approval, stale checks and owner permissions. Enrich
 // its single successful adjustment record instead of posting it a second time.
 const approveGround=pweApproveGround64;
 pweApproveGround64=function(id){
  const g=(state.groundHistory64||[]).find(x=>x.id===id),l=state.lots.find(x=>x.id===g?.lotId),b=bagInfo(l);
  const before=l?{qty:unknown(l)?null:n(l.qty),bags:b.known?b.count:undefined}:null,wasPending=g?.status==='pending';
  const result=approveGround(id);if(!wasPending||g?.status!=='approved'||!l||!before)return result;
  if(g.bags!==null&&g.bags!==undefined){l.bags=g.bags;l.actualBags=g.bags;l.transferBagsKnown2=true;if(!fixed(l)&&l.bagType==='raw')l.rawBags=g.bags;}
  const recordedAt=new Date().toISOString(),after={qty:n(l.qty),bags:bagInfo(l).known?bagInfo(l).count:undefined};
  let record=state.adjustments.find(x=>x.groundCheckId===g.id);
  if(!record&&finite(before.bags)&&finite(after.bags)&&before.bags!==after.bags){record={id:uid('ADJ'),date:g.approvedDate||today(),product:l.product,direction:after.bags>before.bags?'increase':'decrease',qty:0,reason:'မြေပြင်စစ်ချက် '+g.id+' · '+g.note,groundCheckId:g.id,lotId:l.id,warehouse:l.warehouse,batch:l.batch,owner:l.owner};state.adjustments.push(record);}
  if(record&&!record.history2){record.sourceReceiptId=l.receiptId||'';record.recordedAt=recordedAt;record.history2=snapshot(l,before,after,{recordedAt,source:'ground',groundCheckId:g.id,unit:'ground',reasonCode:'ground',reasonLabel:'မြေပြင်စစ်ချက်',note:g.note});}
  l.adjustmentTracked2=true;
  save();return result;
 };
 function dataFor(r){
  if(r.history2)return r.history2;
  // Legacy records never infer historic owner/balances from today's stock.
  return {schema:0,product:r.product,owner:r.owner||'',ownerName:'',warehouseName:r.warehouse?W(r.warehouse):'',sourceBatch:r.batch||'',lotId:r.lotId||'',sourceReceiptNo:'',recordedAt:r.recordedAt||'',role:'',qtyDelta:typeof r.qty==='number'?(r.direction==='decrease'?-r.qty:r.qty):undefined,bagsDelta:undefined,qtyBefore:undefined,qtyAfter:undefined,bagsBefore:undefined,bagsAfter:undefined,reasonLabel:r.reason||'',source:r.groundCheckId?'ground':'legacy',groundCheckId:r.groundCheckId||''};
 }
 const movement=h=>amount(h.qtyDelta===null?null:finite(h.qtyDelta)?Math.abs(h.qtyDelta):undefined,finite(h.bagsDelta)?Math.abs(h.bagsDelta):undefined);
 function history(){
  return table4(['ရက် / အချိန်','ကုန်ပိုင်ရှင်','ကုန် / ဂိုဒေါင် / အသုတ်','တိုး / လျှော့','ချိန်ညှိပမာဏ','ချိန်ညှိပြီးလက်ကျန်','အကြောင်းရင်း / အသေးစိတ်'],state.adjustments.map((r,i)=>({r,i})).reverse().map(({r,i})=>{const h=dataFor(r);return `<tr><td>${shortDate(r.date)}<div class="sub">${E(stamp(h.recordedAt))}</div></td><td><strong>${E(h.ownerName||'—')}</strong><div class="sub">${h.owner?E(ownership(h.owner)):'—'}</div></td><td><strong>${E(h.product)}</strong><div class="sub">${E(h.warehouseName||'—')}</div><div class="sub">${E(h.sourceBatch||'—')}</div></td><td>${pill((r.direction==='increase'||r.direction==='in')?'တိုး':'လျှော့',(r.direction==='increase'||r.direction==='in')?'blue':'amber')}</td><td class="aj2-quantity">${movement(h)}</td><td class="aj2-quantity">${amount(h.qtyAfter,h.bagsAfter)}</td><td><div>${E(h.reasonLabel)}</div>${h.groundCheckId?`<div class="sub">${E(h.groundCheckId)}</div>`:''}<div class="mt">${smallbtn('ကြည့်မယ်',`openAdjustmentDetail2(${i})`,'secondary','eye')}</div></td></tr>`;}));
 }
 window.backAdjustmentHistory2=function(){workDirty=false;closeModal();navigate('inventory');invTab='adjustments';renderInventoryBody();};
 window.openAdjustmentDetail2=function(index){
  const r=state.adjustments[index];if(!r)return;const h=dataFor(r),item=(label,value)=>`<div class="aj2-detail-item"><span>${E(label)}</span><strong>${value}</strong></div>`;
  openModal('ကုန်ချိန်ညှိမှတ်တမ်း အသေးစိတ်','ကုန်ပိုင်ရှင်၊ အသုတ်နှင့် ချိန်ညှိမီ / ပြီး လက်ကျန်ကို စစ်ဆေးပါ။',`<div class="aj2-detail-grid">${item('မှတ်တမ်းအမှတ်',E(r.id))}${item('ရက်စွဲ',shortDate(r.date))}${item('မှတ်တမ်းတင်သည့် ရက် / အချိန်',E(stamp(h.recordedAt)))}${item('မှတ်တမ်းတင်သူ အခန်းကဏ္ဍ',h.role?(h.role==='owner'?'ပိုင်ရှင်':'စာရေးမ'):'—')}${item('ကုန်ပိုင်ဆိုင်မှု',h.owner?E(ownership(h.owner)):'—')}${item('ကုန်ပိုင်ရှင်',E(h.ownerName||'—'))}${item('ကုန်ပစ္စည်း',E(h.product))}${item('ဂိုဒေါင်',E(h.warehouseName||'—'))}${item('မူလအသုတ်',E(h.sourceBatch||'—'))}${item('မူလကုန်လက်ခံမှတ်တမ်း',E(h.sourceReceiptNo||'—'))}${item('တိုး / လျှော့',(r.direction==='increase'||r.direction==='in')?'တိုးမည်':'လျှော့မည်')}${item('အကြောင်းရင်း',E(h.reasonLabel||'—'))}${item('မှတ်ချက်',E(h.note||'—'))}${h.groundCheckId?item('မြေပြင်စစ်ချက်အမှတ်',E(h.groundCheckId)):''}</div><div class="summary-box mt">${row4('ချိန်ညှိမီလက်ကျန်',amount(h.qtyBefore,h.bagsBefore))}${row4('ချိန်ညှိပမာဏ',movement(h))}${row4('ချိန်ညှိပြီးလက်ကျန်',amount(h.qtyAfter,h.bagsAfter))}</div>${!h.schema?'<p class="aj2-help">ယခင်မှတ်တမ်းတွင် မသိမ်းထားသော ပိုင်ရှင်၊ အသုတ်၊ အချိန်နှင့် လက်ကျန်ကို — ဖြင့် ပြထားပါသည်။</p>':''}`,btn('ကုန်ချိန်ညှိမှတ်တမ်းသို့ ပြန်မယ်','backAdjustmentHistory2()','secondary'),true);
 };
 const renderBefore=renderInventoryBody;
 renderInventoryBody=function(){
  const result=renderBefore();if(invTab!=='adjustments')return result;const root=$('inventoryBody');if(!root)return result;
  root.innerHTML=`<div class="aj2-workspace"><div class="adjust80-header"><div><h3>ကုန်ချိန်ညှိ</h3><p>ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် အသုတ်အလိုက် တိုး / လျှော့ကို မှတ်တမ်းတင်ပါ။</p></div>${state.role==='staff'?btn('ကုန်ချိန်ညှိအသစ်','openAdjustment()','primary','plus'):''}</div><section class="card adjust80-history"><h3>ကုန်ချိန်ညှိထားသော မှတ်တမ်းများ</h3><div class="aj2-history">${history()}</div></section></div>`;
  return result;
 };
 // Only adjusted, unpurchased receipts use these physical-stock quantities.
 // The original receipt is unchanged by adjustment; pricing retains its normal engine.
 window.adjustmentReceiptDelta2=r=>(state.adjustments||[]).filter(a=>a.sourceReceiptId===r?.id&&a.history2?.owner==='supplier'&&!a.receiptQtyIncluded2&&finite(a.history2.qtyDelta)).reduce((sum,a)=>sum+a.history2.qtyDelta,0);
 window.adjustmentExpectedQty2=r=>round(n(r?.qty)+adjustmentReceiptDelta2(r));
 window.receiptHasAdjustment2=r=>(state.adjustments||[]).some(a=>a.sourceReceiptId===r?.id&&a.history2?.owner==='supplier');
 const purchaseBefore=purchase4;
 purchase4=function(id){
  const result=purchaseBefore(id);if(v4Kind!=='purchase'||!$('voucher4'))return result;let changed=false;
  for(const row of readVoucherLines4()){
   if(row.r?.status==='purchased'||!receiptHasAdjustment2(row.r)||row.r.weightKnown===false)continue;
   const input=$('vq'+row.i);if(input){input.value=String(adjustmentExpectedQty2(row.r));changed=true;}
   const group=state.lots.filter(l=>l.receiptId===row.r.id),physical=group.map(bagInfo);
   if(row.r.bagType==='raw'&&group.every(l=>!fixed(l))&&physical.every(x=>x.known)){
    const count=physical.reduce((sum,x)=>sum+x.count,0),field=$('vpriceBags39'+row.i);if(field&&count>0)field.value=String(count);
   }
  }
  if(changed&&typeof purchaseBagChanged47==='function')purchaseBagChanged47();else calcVoucher4();
  return result;
 };
 const commitBefore=commitVoucher4;
 commitVoucher4=function(){
  if(v4Kind==='purchase'&&$('voucher4'))for(const row of readVoucherLines4()){
   const r=row.r;if(!r||r.status==='purchased'||!receiptHasAdjustment2(r)||r.weightKnown===false)continue;
   const group=state.lots.filter(l=>l.receiptId===r.id),expected=adjustmentExpectedQty2(r);
   if(group.some(l=>l.owner!=='supplier'||l.weightKnown===false)||Math.abs(group.reduce((sum,l)=>sum+n(l.qty),0)-expected)>eps||Math.abs(row.qty-expected)>eps)
    return error('ချိန်ညှိထားသော အသုတ်၏ ပိဿာနှင့် လက်ရှိလက်ကျန် မကိုက်ပါ။ ကုန်ထုတ်မှတ်တမ်းနှင့် ချိန်ညှိမှတ်တမ်းကို ပြန်စစ်ပါ။');
  }
  return commitBefore();
 };
 const recordWeightBefore=recordTransferWeight2;
 recordTransferWeight2=function(l,measurement){const result=recordWeightBefore(l,measurement);if(l.weightKnown===true)delete l.unweighedAdjustment2;if(canWeighTransferLot2(l))for(const a of state.adjustments||[])if(a.sourceReceiptId===l.receiptId&&a.history2?.owner==='supplier')a.receiptQtyIncluded2=true;return result;};
 // Once loose goods are poured out for packing/sale, a proportional bag ratio
 // is not a fresh physical count. Apply this only to lots tracked by this feature.
 const takeBefore=takeLot4;
 takeLot4=function(l,qty){const result=takeBefore(l,qty);if(l.adjustmentTracked2){if(fixed(l)&&Number.isInteger(n(l.packageCount))){l.actualBags=l.packageCount;l.transferBagsKnown2=true;}else {l.actualBags=null;l.transferBagsKnown2=false;}}return result;};
})();

