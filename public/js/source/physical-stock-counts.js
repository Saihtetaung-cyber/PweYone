
/* Version 2: physical counts entered explicitly, with lot-specific owner review. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),eps=.000001;
 const finite=x=>typeof x==='number'&&Number.isFinite(x),num=x=>Number.isFinite(Number(x))?Number(x):0,round=x=>Math.round(x*1e8)/1e8;
 const receipt=l=>state.receipts.find(r=>r.id===l?.receiptId);
 const size=l=>l?.stockForm==='packaged'&&num(l.packageViss)>0?num(l.packageViss):0;
 const unknown=l=>l?.weightKnown===false||!!l?.unweighedAdjustment2&&num(l.qty)===0;
 const ownerText=o=>({owned:'ပွဲရုံပိုင်ကုန်',supplier:'ကုန်သည်ပိုင်ကုန်',customer:'ဝယ်သူပိုင်ကုန်'})[o]||'—';
 const personId=l=>String(l?.owner==='customer'?(l.buyerId||state.sales.find(s=>s.id===l.saleId)?.buyerId||'legacy:'+l.name):(l?.partnerId||receipt(l)?.partnerId||l?.originPartnerId||'legacy:'+l?.name));
 const personName=l=>l?.owner==='owned'?'ပွဲရုံပိုင်':String(l?.name||receipt(l)?.name||state.masters.partners.find(p=>p.id===personId(l))?.name||'—');
 function bagCount(l){
  if(!l)return null;
  const raw=size(l)?l.packageCount??l.bags:l.actualBags??l.bags??l.rawBags;
  const count=Number(raw),specified=count>0||l.actualBags!==undefined&&l.actualBags!==null||l.bagType==='raw'||!!size(l);
  return specified&&raw!==null&&raw!==undefined&&raw!==''&&l.transferBagsKnown2!==false&&Number.isInteger(count)&&count>=0?count:null;
 }
 const eligible=l=>l&&['owned','supplier','customer'].includes(l.owner)&&l.product&&l.warehouse&&Number.isFinite(Number(l.qty))&&num(l.qty)>=0&&(!unknown(l)||bagCount(l)!==null);
 const lots=()=>state.lots.filter(eligible),selected=()=>state.lots.find(l=>l.id===value('gLot64'));
 const ownershipChoices=[['supplier','ကုန်သည်ပိုင်ကုန်'],['owned','ပွဲရုံပိုင်ကုန်'],['customer','ဝယ်သူပိုင်ကုန်']];
 const reasons=[['weighing','ချိန်တွယ်ကွာဟ'],['damage','ပျက်စီး / လေလွင့်'],['found','ပြန်တွေ့'],['other','အခြား']];
 const option=(id,label)=>`<option value="${E(id)}">${E(label)}</option>`;
 function options(id,items,placeholder){const el=$(id);el.innerHTML=option('',placeholder)+items.map(([key,text])=>option(key,text)).join('');el.value=items.length===1?items[0][0]:'';}
 const tabs=(items,current,fn)=>`<div class="gc2-tabs" role="group">${items.map(([key,label])=>`<button type="button" class="${key===current?'active':''}" aria-pressed="${key===current}" onclick="${fn}('${key}')">${E(label)}</button>`).join('')}</div>`;
 const signature=l=>JSON.stringify(l?{id:l.id,owner:l.owner,person:personId(l),warehouse:l.warehouse,receipt:l.receiptId||'',sale:l.saleId||'',batch:l.batch||'',qty:num(l.qty),unknown:unknown(l),bags:bagCount(l),stockForm:l.stockForm||'',size:size(l),cost:num(l.cost)}:null);
 const weight=q=>finite(q)?vissText37(q)+' ပိဿာ':q===null?'မချိန်ထား':'—';
 const bags=b=>finite(b)?N(b)+' အိတ်':b===null?'မရေတွက်ထား':'—';
 const stamp=iso=>iso&&Number.isFinite(Date.parse(iso))?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso)):'—';
 const statusLabel=s=>({pending:'ပိုင်ရှင်အတည်ပြုရန်',approved:'အတည်ပြုပြီး',matched:'ကိုက်ညီ',rejected:'ပယ်ချပြီး'})[s]||s;
 const signText=(x,unit)=>!finite(x)?'မနှိုင်းယှဉ်ထား':Math.abs(x)<eps?'ကိုက်ညီ':(unit==='bags'?N(Math.abs(x))+' အိတ်':vissText37(Math.abs(x))+' ပိဿာ')+' · '+(x<0?'လျော့':'ပို');
 let savedSignature='',token='',saving=false;
 function filtered(){const owner=value('gOwner2');return lots().filter(l=>l.owner===owner&&(owner==='owned'||personId(l)===value('gPerson2')));}
 window.groundOwner2=function(owner){
  if(!ownershipChoices.some(x=>x[0]===owner))return;
  $('gOwner2').value=owner;$('gOwnerTabs2').innerHTML=tabs(ownershipChoices,owner,'groundOwner2');
  const personal=owner!=='owned';$('gPersonWrap2').hidden=!personal;$('gPerson2').disabled=!personal;$('gPerson2').required=personal;
  $('gPersonLabel2').textContent=owner==='customer'?'ဝယ်သူ':'ကုန်သည်';
  const people=new Map();for(const l of lots().filter(l=>l.owner===owner))people.set(personId(l),personName(l));options('gPerson2',[...people],owner==='customer'?'ဝယ်သူ ရွေးပါ':'ကုန်သည် ရွေးပါ');groundPerson2();
 };
 window.groundPerson2=function(){options('gWh2',[...new Set(filtered().map(l=>l.warehouse))].map(id=>[id,W(id)]),'ဂိုဒေါင် ရွေးပါ');groundWarehouse2();};
 window.groundWarehouse2=function(){options('gLot64',filtered().filter(l=>l.warehouse===value('gWh2')).map(l=>[l.id,`${l.product} · ${l.batch||l.id}${size(l)?' · '+(l.packName||'ထုပ်ပိုးပြီး'):''}`]),'ကုန်အသုတ် ရွေးပါ');groundLot2();};
 window.groundLot2=function(){
  const l=selected();savedSignature=signature(l);$('gWeight64').value='';$('gBags64').value='';$('gMeasured2').value='';$('gWeighAlso2').checked=false;
  $('gExpected64').innerHTML=l?`<div class="gc2-source-title"><strong>${E(l.product)}</strong><span>${E(ownerText(l.owner))}${l.owner!=='owned'?' · '+E(personName(l)):''}</span></div><div>${E(W(l.warehouse))} · ${E(l.batch||l.id)}</div><div class="gc2-source-values"><strong>${unknown(l)?'မချိန်ရသေး':E(weight(num(l.qty)))}</strong><span>${bagCount(l)===null?'အိတ်စာရင်း မသိ':E(bags(bagCount(l)))}</span></div>${size(l)?`<div>${E(l.packName||'ထုပ်ပိုးပြီး')} · ${E(weight(size(l)))} / အိတ်</div>`:''}`:note('ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် စစ်ဆေးမည့်အသုတ်ကို ရွေးပါ။','blue');
  groundUnit2(unknown(l)||size(l)?'bags':'viss');
 };
 window.groundUnit2=function(unit){
  if(!['viss','bags'].includes(unit))return;const l=selected(),previousUnit=value('gUnit2');if(unknown(l))unit='bags';
  if(size(l)&&previousUnit==='bags'&&unit==='viss')$('gWeight64').value='';
  $('gUnit2').value=unit;
  $('gUnitTabs2').innerHTML=tabs(unknown(l)?[['bags','အိတ်ဖြင့်']]:[['viss','ပိဿာဖြင့်'],['bags','အိတ်ဖြင့်']],unit,'groundUnit2');
  const fixed=!!size(l),calculated=fixed&&unit==='bags';
  $('gWeightWrap2').hidden=unknown(l);$('gWeight64').disabled=unknown(l);$('gWeight64').readOnly=calculated;$('gWeight64').required=!unknown(l)&&unit==='viss';
  $('gBags64').required=unit==='bags'||fixed;
  $('gWeightLabel2').textContent=calculated?'အိတ်ဝင်အရတွက်ထားသောပိဿာ':'တကယ်ချိန်ရ စုစုပေါင်းပိဿာ';
  $('gExtraWeighWrap2').hidden=!calculated;$('gWeighAlso2').disabled=!calculated;
  $('gMeasuredWrap2').hidden=!calculated||!$('gWeighAlso2').checked;$('gMeasured2').disabled=!calculated||!$('gWeighAlso2').checked;$('gMeasured2').required=calculated&&$('gWeighAlso2').checked;
  $('gActuals2').append(unit==='bags'?$('gBagsWrap2'):$('gWeightWrap2'),unit==='bags'?$('gWeightWrap2'):$('gBagsWrap2'));
  $('gHelp2').textContent=unknown(l)?'ပိဿာမချိန်ရသေးသော အသုတ်ဖြစ်၍ တကယ်ရေတွက်ထားသော အိတ်အရေအတွက်ကိုသာ မှတ်ပါ။':calculated?'တကယ်ရေတွက်ရ အိတ်ကို ဖြည့်ပါ။ အိတ်ဝင်အရ ပိဿာတွက်ပြမည်။ တကယ်ချိန်ထားလျှင် သီးခြားမှတ်နိုင်ပါသည်။':unit==='bags'?'တကယ်ရှိသော စုစုပေါင်းအိတ်ကို ဖြည့်ပါ။ တကယ်မချိန်ထားလျှင် ပိဿာကို အလွတ်ထားပါ။':'တကယ်ချိန်ရ စုစုပေါင်းပိဿာကို ဖြည့်ပါ။ အိတ်မရေတွက်ထားလျှင် အိတ်ကို အလွတ်ထားပါ။';
  pweGroundPreview64(false);
 };
 window.groundWeighAlso2=function(){groundUnit2(value('gUnit2'));};
 function plan(){
  const l=selected(),unit=value('gUnit2'),fixed=size(l),bagRaw=value('gBags64'),bag=bagRaw===''?null:Number(bagRaw);
  const calc=fixed&&bag!==null?round(fixed*bag):null,derived=fixed&&unit==='bags',measured=derived&&$('gWeighAlso2').checked;
  let qty=null;if(!unknown(l)){const raw=derived?(measured?value('gMeasured2'):''):value('gWeight64');qty=derived&&!measured?calc:raw===''?null:Number(raw);}
  const expected=unknown(l)?null:num(l?.qty),expectedBags=bagCount(l),difference=finite(qty)&&expected!==null?round(qty-expected):null,bagDifference=bag!==null&&expectedBags!==null?bag-expectedBags:null;
  const conflict=!!fixed&&finite(qty)&&finite(calc)&&Math.abs(qty-calc)>eps;
  const mismatch=finite(difference)&&Math.abs(difference)>eps||finite(bagDifference)&&bagDifference!==0||bag!==null&&expectedBags===null||conflict;
  return {l,unit,fixed,bag,calc,derived,measured,qty,expected,expectedBags,difference,bagDifference,conflict,mismatch};
 }
 function validation(p,full=false){
  const l=p.l;if(!l||!eligible(l)||l.owner!==value('gOwner2')||l.warehouse!==value('gWh2')||l.owner!=='owned'&&personId(l)!==value('gPerson2'))return 'ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် အသုတ်ကို ပြန်ရွေးပါ။';
  if(signature(l)!==savedSignature)return 'ဖောင်ဖွင့်ပြီးနောက် အသုတ်လက်ကျန် ပြောင်းထားပါသည်။ အသုတ်ကို ပြန်ရွေးပါ။';
  if(!['viss','bags'].includes(p.unit)||unknown(l)&&p.unit!=='bags')return 'စစ်ဆေးယူနစ်ကို ပြန်ရွေးပါ။';
  if((p.unit==='bags'||p.fixed)&&p.bag===null)return 'တကယ်ရေတွက်ထားသော စုစုပေါင်းအိတ်ကို ဖြည့်ပါ။';
  if(p.bag!==null&&(!Number.isInteger(p.bag)||p.bag<0||p.bag>1e9))return 'အိတ်ကို 0 နှင့်အထက် ကိန်းပြည့်ဖြင့် ဖြည့်ပါ။';
  if(!unknown(l)&&p.unit==='viss'&&p.qty===null||p.measured&&p.qty===null)return 'တကယ်ချိန်ရ စုစုပေါင်းပိဿာကို ဖြည့်ပါ။';
  if(p.qty!==null&&(!finite(p.qty)||p.qty<0||p.qty>1e9||Math.abs(p.qty*100-Math.round(p.qty*100))>eps))return 'ပိဿာကို 0 နှင့်အထက် ဒဿမ ၂ နေရာအထိ ဖြည့်ပါ။';
  if(p.qty===null&&p.bag===null)return 'တကယ်ချိန်ရပိဿာ သို့မဟုတ် ရေတွက်ရအိတ်ကို ဖြည့်ပါ။';
  if(full&&p.mismatch&&!reasons.some(x=>x[0]===value('gReason2')))return 'ကွာဟချက်အတွက် အကြောင်းရင်းကို ရွေးပါ။';
  if(full&&value('gReason2')==='other'&&!value('gNote64'))return 'အခြားအကြောင်းရင်းကို မှတ်ချက်တွင် ရေးပါ။';
  return '';
 }
 pweGroundPreview64=function(reinit=false){
  if(!$('groundForm64'))return;if(reinit){groundLot2();return;}
  const p=plan(),err=$('modalError');if(err){err.textContent='';err.style.display='none';}
  if(p.derived)$('gWeight64').value=finite(p.calc)?String(p.calc):'';
  const warning=validation(p);$('gSave2').disabled=!!warning;
  $('gNote64').required=value('gReason2')==='other';
  const actualWeight=p.qty===null?'မချိန်ထား':weight(p.qty),originalWeight=p.expected===null?'မချိန်ရသေး':weight(p.expected);
  $('gPreview64').innerHTML=p.l?`<div class="gc2-comparison"><table><thead><tr><th>စစ်ဆေးမည့်အချက်</th><th>စာရင်းအရ</th><th>တကယ်ရှိ</th><th>ကွာဟချက်</th></tr></thead><tbody><tr><td>ပိဿာ</td><td>${E(originalWeight)}</td><td><strong>${E(actualWeight)}</strong>${p.derived&&!p.measured?'<span class="gc2-hint">အိတ်ဝင်အရ တွက်ထားသည်</span>':''}</td><td class="${finite(p.difference)&&Math.abs(p.difference)>eps?'gc2-difference':''}">${E(signText(p.difference,'viss'))}</td></tr><tr><td>အိတ်</td><td>${p.expectedBags===null?'အိတ်စာရင်း မသိ':E(bags(p.expectedBags))}</td><td><strong>${E(bags(p.bag))}</strong></td><td class="${p.bagDifference?'gc2-difference':''}">${E(signText(p.bagDifference,'bags'))}</td></tr></tbody></table></div>${p.conflict?note('တကယ်ချိန်ရပိဿာနှင့် အိတ်ဝင်အရတွက်ထားသောပိဿာ မကိုက်ပါ။ စစ်ချက်ကို တင်နိုင်သော်လည်း Stock အလိုအလျောက် ချိန်ညှိမည်မဟုတ်ပါ။','amber'):''}${warning?`<p class="gc2-warning">${E(warning)}</p>`:''}`:'';
  $('gPendingNote2').textContent=p.mismatch?'ကွာဟချက်ရှိပါသည်။ သိမ်းပြီးလျှင် ပိုင်ရှင်အတည်ပြုရန် Pending ဖြစ်မည်။':'စစ်ချက်သိမ်းရုံဖြင့် Stock မပြောင်းပါ။';
 };
 pweOpenGround64=function(){
  if(!guardWork())return;if(!lots().length)return toast('စစ်ဆေးရန် ကုန်အသုတ် မရှိပါ။',true);
  token='GC-'+Date.now()+'-'+Math.random().toString(36).slice(2);saving=false;
  const owner=ownershipChoices.some(x=>x[0]===inventoryOwner)&&lots().some(l=>l.owner===inventoryOwner)?inventoryOwner:lots()[0].owner;
  openModal('မြေပြင်စစ်ချက် မှတ်မယ်','တကယ်ရှိသော စုစုပေါင်းပမာဏကို ဖြည့်ပါ။ စာရင်းလက်ကျန်နှင့် ကွာဟချက်ကို တွက်ပြပါမည်။',`<form id="groundForm64" class="gc2-form" onsubmit="event.preventDefault();pweSaveGround64()"><input id="gOwner2" type="hidden"><input id="gUnit2" type="hidden">
   <div class="field"><label>ကုန်ပိုင်ဆိုင်မှု</label><div id="gOwnerTabs2"></div></div><div id="gPersonWrap2" class="field"><label for="gPerson2" id="gPersonLabel2">ကုန်သည်</label><select id="gPerson2" onchange="groundPerson2()"></select></div>
   <div class="field-row">${selectField('ဂိုဒေါင်','gWh2',[],'','required onchange="groundWarehouse2()"')}${selectField('ကုန် / မူလအသုတ်','gLot64',[],'','required onchange="groundLot2()"')}</div>
   <div id="gExpected64" class="gc2-source" aria-live="polite"></div>
   <div class="field"><label>စစ်ဆေးယူနစ်</label><div id="gUnitTabs2"></div></div>
   <div class="field-row" id="gActuals2"><div id="gWeightWrap2" class="field"><label id="gWeightLabel2" for="gWeight64">တကယ်ချိန်ရ စုစုပေါင်းပိဿာ</label><input id="gWeight64" type="number" min="0" max="1000000000" step=".01" placeholder="တကယ်ရှိပိဿာ ဖြည့်ပါ" oninput="pweGroundPreview64(false)"></div><div id="gBagsWrap2" class="field"><label for="gBags64">တကယ်ရေတွက်ရ စုစုပေါင်းအိတ်</label><input id="gBags64" type="number" min="0" max="1000000000" step="1" placeholder="တကယ်ရှိအိတ် ဖြည့်ပါ" oninput="pweGroundPreview64(false)"></div></div>
   <div id="gExtraWeighWrap2" class="gc2-extra"><label><input id="gWeighAlso2" type="checkbox" onchange="groundWeighAlso2()"><span>တကယ်ချိန်ရပိဿာပါ မှတ်မယ်</span></label></div>
   <div id="gMeasuredWrap2">${field('တကယ်ချိန်ရ စုစုပေါင်းပိဿာ','gMeasured2',{type:'number',min:0,step:.01,extra:'max="1000000000" oninput="pweGroundPreview64(false)"',suffix:'ပိဿာ'})}</div>
   <p id="gHelp2" class="gc2-help"></p><p class="gc2-help">0 သည် တကယ်မရှိတော့ခြင်းဖြစ်သည်။ မစစ်ထားသောနေရာကို အလွတ်ထားပါ။</p>
   <div id="gPreview64" aria-live="polite"></div>
   <div class="field-row">${selectField('အကြောင်းရင်း','gReason2',[['','အကြောင်းရင်း ရွေးပါ'],...reasons],'','onchange="pweGroundPreview64(false)"')}${field('စစ်ဆေးရက်','gDate2',{type:'date',value:today(),required:true})}</div>
   ${field('မှတ်ချက်','gNote64',{extra:'maxlength="300"',placeholder:'လိုအပ်လျှင် အသေးစိတ်ရေးပါ'})}<p id="gPendingNote2" class="gc2-save-note"></p>
  </form>`,btn('ပြန်မယ်','closeModal()','secondary')+'<button type="button" id="gSave2" class="btn btn-primary" onclick="pweSaveGround64()">စစ်ချက် သိမ်းမယ်</button>',true);
  $('groundForm64').dataset.token=token;groundOwner2(owner);
 };
 pweSaveGround64=function(){
  const form=$('groundForm64');if(!form||saving||form.dataset.token!==token||!guardWork()||!validForm('groundForm64'))return;
  const p=plan(),warning=validation(p,true);if(warning)return error(warning);
  const date=value('gDate2');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)return error('မှန်ကန်သော ရက်စွဲကို ရွေးပါ။');
  const note=value('gNote64'),code=value('gReason2'),reasonLabel=reasons.find(x=>x[0]===code)?.[1]||'',l=p.l;
  if((state.groundHistory64||[]).some(g=>g.groundSchema2===2&&g.status==='pending'&&g.lotId===l.id&&g.sourceSignature2===savedSignature&&g.qty===p.qty&&g.bags===p.bag&&g.weightMethod2===(p.derived&&!p.measured?'calculated':p.qty===null?'uncounted':'weighed')))
   return error('တူညီသော စစ်ချက်ကို Pending အဖြစ် တင်ထားပြီးပါပြီ။ ရှိပြီးသားမှတ်တမ်းကို စစ်ဆေးပါ။');
  saving=true;const id=uid('GC'),recordedAt=new Date().toISOString(),r=receipt(l);
  state.groundHistory64??=[];state.groundHistory64.push({id,seq:state.counter,date,recordedAt,time:stamp(recordedAt).split(', ')[1]||'',role:state.role,
   groundSchema2:2,lotId:l.id,product:l.product,grade:l.grade,batch:l.batch||l.id,warehouse:l.warehouse,warehouseName:W(l.warehouse),owner:l.owner,ownerName:ownerText(l.owner),personName:personName(l),partnerId:l.owner==='owned'?'':personId(l),
   sourceReceiptId:l.receiptId||'',sourceReceiptNo:r?.voucherNo||r?.no||l.originReceiptNo||'',stockForm:l.stockForm,packageViss:size(l),packName:l.packName||'',
   qty:p.qty,expectedQty:p.expected,bags:p.bag,expectedBags:p.expectedBags,difference:p.difference,bagDifference:p.bagDifference,
   expectedWeightKnown2:!unknown(l),weightMethod2:p.derived&&!p.measured?'calculated':p.qty===null?'uncounted':'weighed',calculatedQty2:p.calc,packageConflict2:p.conflict,
   reasonCode2:code,reasonLabel2:reasonLabel,note:[reasonLabel,note].filter(Boolean).join(' · '),detailNote2:note,status:p.mismatch?'pending':'matched',sourceSignature2:savedSignature,formToken2:token});
  token='';activity(l.product+' · '+(l.batch||l.id)+' မြေပြင်စစ်ချက် '+id+' သိမ်းခဲ့သည်။');save();workDirty=false;closeModal();invTab='ground';page='inventory';render();toast(p.mismatch?'စစ်ချက် သိမ်းပြီးပါပြီ။ ပိုင်ရှင် အတည်ပြုရန် စောင့်နေသည်။':'စစ်ချက် သိမ်းပြီးပါပြီ။ ကွာဟချက်မရှိပါ။');
 };
 const records=()=>state.groundHistory64||[],find=id=>records().find(g=>g.id===id);
 function review(g){
  if(!g||g.status!=='pending')return {why:'ဤစစ်ချက်သည် အတည်ပြုရန် Pending မဟုတ်တော့ပါ။'};
  const l=state.lots.find(l=>l.id===g.lotId);if(!l)return {why:'ရွေးထားသောအသုတ် ပျောက်နေပါသည်။ Stock ကို မပြင်ပါ။'};
  if(signature(l)!==g.sourceSignature2||records().some(x=>x.lotId===g.lotId&&x.status==='approved'&&x.seq>g.seq))return {why:'စစ်ချက်တင်ပြီးနောက် အသုတ်လက်ကျန် ပြောင်းထားပါသည်။ အသစ်ပြန်စစ်ပါ။'};
  if(size(l)&&(!Number.isInteger(g.bags)||!finite(g.qty)||Math.abs(g.bags*size(l)-g.qty)>eps))return {why:'တကယ်ချိန်ရပိဿာနှင့် ထုပ်ပိုးအိတ်ပမာဏ မကိုက်ပါ။ ပြန်စစ်ပြီး စစ်ချက်အသစ် တင်ပါ။ ဤစစ်ချက်မှ Stock မချိန်ညှိပါ။'};
  return {lot:l};
 }
 function summary(g){return `<div class="gc2-comparison"><table><thead><tr><th>စစ်ဆေးမည့်အချက်</th><th>စာရင်းအရ</th><th>တကယ်ရှိ</th><th>ကွာဟချက်</th></tr></thead><tbody><tr><td>ပိဿာ</td><td>${g.expectedQty===null?'မချိန်ရသေး':E(weight(g.expectedQty))}</td><td>${E(weight(g.qty))}</td><td>${E(signText(g.difference,'viss'))}</td></tr><tr><td>အိတ်</td><td>${g.expectedBags===null?'အိတ်စာရင်း မသိ':E(bags(g.expectedBags))}</td><td>${E(bags(g.bags))}</td><td>${E(signText(g.bagDifference,'bags'))}</td></tr></tbody></table></div>`;}
 const previousReview=pweReviewGround64,previousApprove=pweApproveGround64;
 pweReviewGround64=function(id){
  const g=find(id);if(g?.groundSchema2!==2)return previousReview(id);if(state.role!=='owner')return toast('ပိုင်ရှင်သာ အတည်ပြုခွင့်ရှိပါသည်။',true);
  const decision=review(g);openModal('မြေပြင်စစ်ချက် အတည်ပြုမယ်','စစ်ချက်ကို ပြန်ကြည့်ပြီး သက်ဆိုင်ရာအသုတ်တစ်ခုတည်းကိုသာ အတည်ပြုချိန်ညှိမည်။',`<div class="gc2-review"><div class="gc2-source"><strong>${E(g.product)} · ${E(g.batch)}</strong><div>${E(g.warehouseName)} · ${E(g.ownerName)} · ${E(g.personName)}</div></div>${summary(g)}<p class="gc2-help">${E(g.note||'—')}</p>${decision.why?note(decision.why,'amber'):'<label class="gc2-confirm"><input type="checkbox" id="gApprove64"><span>စစ်ချက်ကို စစ်ဆေးပြီး Stock ချိန်ညှိရန် အတည်ပြုပါသည်။</span></label>'}</div>`,btn('ပြန်မယ်','closeModal()','secondary')+(decision.why?'':btn('အတည်ပြုပြီး Stock ချိန်ညှိမယ်',`pweApproveGround64('${g.id}')`,'primary','check')),true);
 };
 pweApproveGround64=function(id){
  const g=find(id);if(g?.groundSchema2!==2)return previousApprove(id);if(state.role!=='owner')return error('ပိုင်ရှင်သာ အတည်ပြုနိုင်ပါသည်။');if(!guardWork())return;
  if(!$('gApprove64')?.checked)return error('Stock ချိန်ညှိရန် အတည်ပြုချက်ကို ရွေးပါ။');const result=review(g);if(result.why)return error(result.why);
  const l=result.lot,beforeQty=unknown(l)?null:num(l.qty),beforeBags=bagCount(l),wasUnknown=unknown(l),qty=finite(g.qty)?g.qty:beforeQty;
  const delta=finite(beforeQty)&&finite(qty)?round(qty-beforeQty):null,bagDelta=finite(beforeBags)&&finite(g.bags)?g.bags-beforeBags:null,recordedAt=new Date().toISOString();
  if(finite(g.qty))l.qty=g.qty;
  if(g.bags!==null){l.bags=g.bags;l.actualBags=g.bags;l.transferBagsKnown2=true;if(l.bagType==='raw')l.rawBags=g.bags;if(size(l))l.packageCount=g.bags;}
  if(wasUnknown){l.qty=0;l.unweighedAdjustment2=true;l.weightKnown=g.bags===0;}
  l.adjustmentTracked2=true;
  if(delta!==null&&Math.abs(delta)>eps||bagDelta!==null&&bagDelta!==0||g.bags!==null&&beforeBags===null){
   const aid=uid('ADJ'),direction=delta!==null&&Math.abs(delta)>eps?(delta>0?'increase':'decrease'):(bagDelta||0)>=0?'increase':'decrease';
   state.adjustments.push({id:aid,date:today(),product:l.product,direction,qty:delta===null?0:Math.abs(delta),reason:'မြေပြင်စစ်ချက် '+g.id+' · '+g.note,groundCheckId:g.id,lotId:l.id,warehouse:l.warehouse,batch:l.batch,owner:l.owner,sourceReceiptId:l.receiptId||'',recordedAt,
    history2:{schema:1,recordedAt,role:state.role,source:'ground',groundCheckId:g.id,owner:l.owner,ownerName:g.personName,partnerId:g.partnerId||'',product:l.product,grade:l.grade||'',warehouseId:l.warehouse,warehouseName:g.warehouseName,lotId:l.id,sourceBatch:g.batch,sourceReceiptId:g.sourceReceiptId||'',sourceReceiptNo:g.sourceReceiptNo||'',packageViss:size(l)||null,packName:l.packName||'',qtyBefore:beforeQty,bagsBefore:beforeBags,qtyDelta:delta,bagsDelta:bagDelta,qtyAfter:wasUnknown?null:num(l.qty),bagsAfter:bagCount(l),unit:'ground',reasonCode:'ground',reasonLabel:'မြေပြင်စစ်ချက်',note:g.note,unitCost:num(l.cost)}});
   if(delta!==null&&Math.abs(delta)>eps)dateMove(l.product,Math.abs(delta),delta>0?'in':'out','Ground Check '+g.id,today(),'ground-check');
  }
  Object.assign(g,{status:'approved',approvedDate:today(),approvedAt2:recordedAt,approvedRole:state.role,afterQty:wasUnknown?null:num(l.qty),afterBags:bagCount(l)});
  activity('မြေပြင်စစ်ချက် '+g.id+' အတည်ပြုပြီး '+l.product+' အသုတ်လက်ကျန် ချိန်ညှိခဲ့သည်။');save();workDirty=false;closeModal();invTab='ground';page='inventory';render();toast('အသုတ်တစ်ခုတည်း၏ Stock ချိန်ညှိပြီးပါပြီ။ History နှင့် Adjustment မှတ်တမ်းသိမ်းထားပါသည်။');
 };
 const rejectBefore=pweConfirmReject64;
 pweConfirmReject64=function(id){const g=find(id),before=g?.status,result=rejectBefore(id);if(g?.groundSchema2===2&&before==='pending'&&g.status==='rejected'){g.decidedAt2=new Date().toISOString();save();}return result;};
 window.backGroundHistory2=function(){workDirty=false;closeModal();navigate('inventory');invTab='ground';render();};
 window.openGroundDetail2=function(id){
  const g=find(id);if(!g)return;const item=(label,text)=>`<div class="gc2-detail-item"><span>${E(label)}</span><strong>${E(text||'—')}</strong></div>`;
  openModal('မြေပြင်စစ်ချက် အသေးစိတ်','စာရင်းပမာဏ၊ တကယ်ရှိပမာဏနှင့် အတည်ပြုအခြေအနေကို ကြည့်ပါ။',`<div class="gc2-detail-grid">${item('စစ်ချက်အမှတ်',g.id)}${item('စစ်ဆေးရက်',shortDate(g.date))}${item('မှတ်တမ်းတင်သည့် ရက် / အချိန်',g.recordedAt?stamp(g.recordedAt):g.time||'—')}${item('မှတ်တမ်းတင်သူ အခန်းကဏ္ဍ',g.role?g.role==='owner'?'ပိုင်ရှင်':'စာရေးမ':'—')}${item('ကုန်ပိုင်ဆိုင်မှု',g.ownerName||ownerText(g.owner))}${item('ကုန်ပိုင်ရှင်',g.personName)}${item('ကုန်ပစ္စည်း',g.product)}${item('ဂိုဒေါင်',g.warehouseName)}${item('မူလအသုတ်',g.batch)}${item('မူလကုန်လက်ခံမှတ်တမ်း',g.sourceReceiptNo)}${item('ပိဿာမှတ်တမ်းပုံစံ',g.weightMethod2==='calculated'?'အိတ်ဝင်အရ တွက်ထားသည်':g.weightMethod2==='uncounted'?'မချိန်ထား':g.weightMethod2==='weighed'?'တကယ်ချိန်ထားသည်':'—')}${item('အခြေအနေ',statusLabel(g.status))}${item('အကြောင်းရင်း / မှတ်ချက်',g.note)}${g.decisionNote?item('ပယ်ချသည့်အကြောင်းပြချက်',g.decisionNote):''}${g.approvedAt2?item('အတည်ပြုသည့် ရက် / အချိန်',stamp(g.approvedAt2)):''}${g.decidedAt2?item('ပယ်ချသည့် ရက် / အချိန်',stamp(g.decidedAt2)):''}</div>${summary(g)}${g.packageConflict2?note('တကယ်ချိန်ရပိဿာနှင့် အိတ်ဝင်အရတွက်ထားသောပိဿာ မကိုက်ပါ။ စစ်ချက်ကို တင်နိုင်သော်လည်း Stock အလိုအလျောက် ချိန်ညှိမည်မဟုတ်ပါ။','amber'):''}${g.groundSchema2!==2?'<p class="gc2-help">ယခင်မှတ်တမ်းတွင် မသိမ်းထားသော အချက်အလက်များကို — ဖြင့် ပြထားပါသည်။</p>':''}`,btn('မြေပြင်စစ်ချက်မှတ်တမ်းသို့ ပြန်မယ်','backGroundHistory2()','secondary'),true);
 };
 function view(legacy){
  const rows=records().slice().reverse(),pending=rows.filter(g=>g.status==='pending').length,approved=rows.filter(g=>g.status==='approved').length,matched=rows.filter(g=>g.status==='matched').length;
  return `<div class="gc2-workspace"><div class="gc2-heading"><div><h3>မြေပြင်စစ်ချက်နှင့် အတည်ပြုမှု</h3><p>ကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် အသုတ်အလိုက် တကယ်ရှိပမာဏကို စစ်ဆေးပါ။</p></div>${btn('မြေပြင်စစ်ချက် အသစ်','pweOpenGround64()','primary','plus')}</div><div class="gc2-metrics"><div><span>ပိုင်ရှင်အတည်ပြုရန်</span><strong>${N(pending)}</strong></div><div><span>အတည်ပြုပြီး</span><strong>${N(approved)}</strong></div><div><span>ကိုက်ညီ</span><strong>${N(matched)}</strong></div></div><section class="card gc2-history"><h3>မြေပြင်စစ်ချက် History</h3>${table4(['ရက် / အချိန်','ကုန် / ဂိုဒေါင် / အသုတ်','ကုန်ပိုင်ရှင်','စာရင်း → တကယ်ရှိ','ကွာဟချက်','အခြေအနေ / အသေးစိတ်'],rows.map(g=>{
   const l=state.lots.find(l=>l.id===g.lotId),stale=g.status==='pending'&&(g.groundSchema2===2?!!review(g).why&&!g.packageConflict2:!l||Math.abs(num(l.qty)-num(g.expectedQty))>eps),action=g.status==='pending'&&state.role==='owner'?smallbtn('စစ်ဆေး / အတည်ပြု',`pweReviewGround64('${g.id}')`,'secondary','check')+smallbtn('ပယ်ချမယ်',`pweRejectGround64('${g.id}')`,'ghost'):'';
   return `<tr><td>${shortDate(g.date)}<div class="sub">${E(g.recordedAt?stamp(g.recordedAt):g.time||'—')}</div><div class="sub">${E(g.id)}</div></td><td><strong>${E(g.product)}</strong><div class="sub">${E(g.warehouseName)}</div><div class="sub">${E(g.batch)}</div></td><td><strong>${E(g.personName||'—')}</strong><div class="sub">${E(g.ownerName||ownerText(g.owner))}</div></td><td><div>${g.expectedQty===null?'မချိန်ရသေး':E(weight(g.expectedQty))} → <strong>${E(weight(g.qty))}</strong></div><div class="sub">${g.expectedBags===null?'အိတ်စာရင်း မသိ':E(bags(g.expectedBags))} → ${E(bags(g.bags))}</div></td><td><strong>${E(signText(g.difference,'viss'))}</strong><div class="sub">${E(signText(g.bagDifference,'bags'))}</div></td><td>${pill(statusLabel(g.status),g.status==='pending'?'amber':g.status==='approved'||g.status==='matched'?'blue':'gray')}${stale?'<div class="gc2-warning">အသုတ်လက်ကျန် ပြောင်းထားပြီး</div>':''}<div class="sub">${E(g.note||'')}</div><div class="gc2-actions">${smallbtn('ကြည့်မယ်',`openGroundDetail2('${g.id}')`,'secondary','eye')}${action}</div></td></tr>`;
  }))}${legacy||''}</section><p class="gc2-help">စစ်ချက်သိမ်းရုံဖြင့် Stock မပြောင်းပါ။ ကွာဟချက်ကို ပိုင်ရှင် အတည်ပြုပြီးမှ အသုတ်တစ်ခုတည်းမှာ ချိန်ညှိမည်။</p></div>`;
 }
 const renderBefore=renderInventoryBody;
 renderInventoryBody=function(){const result=renderBefore();if(invTab!=='ground')return result;const root=$('inventoryBody');if(root){const legacy=root.querySelector('.v64-ground details.details')?.outerHTML||'';root.innerHTML=view(legacy);}return result;};
})();

