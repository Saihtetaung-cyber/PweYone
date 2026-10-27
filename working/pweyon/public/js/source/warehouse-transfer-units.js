
/* Version 2: warehouse transfer form, exact unit entry and immutable history. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id), EPS=.000001;
 const receipt=l=>state.receipts.find(r=>r.id===l?.receiptId);
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const rounded=x=>Math.round(x*1e8)/1e8;
 const ownerLabel=o=>o==='supplier'?'ကုန်သည်ပိုင်ကုန်':o==='customer'?'ဝယ်သူပိုင်ကုန်':'ပွဲရုံပိုင်ကုန်';
 const personId=l=>String(l?.owner==='customer'?(l.buyerId||state.sales.find(s=>s.id===l.saleId)?.buyerId||'legacy:'+l.name):(l?.partnerId||receipt(l)?.partnerId||l?.originPartnerId||'legacy:'+l?.name));
 const personName=l=>l?.owner==='owned'?'ပွဲရုံပိုင်':String(l?.name||receipt(l)?.name||state.masters.partners.find(p=>p.id===personId(l))?.name||'—');
 const size=l=>l?.stockForm==='packaged'&&num(l.packageViss)>0?num(l.packageViss):0;
 const bagInfo=l=>{
  if(!l)return {known:false,count:0};
  if(size(l))return {known:true,count:rounded(num(l.qty)/size(l))};
  const n=num(l.bags??l.actualBags??l.rawBags);
  return {known:l.transferBagsKnown2!==false&&Number.isInteger(n)&&n>0,count:n};
 };
 const unknown=l=>l?.weightKnown===false;
 const eligible=l=>['owned','supplier','customer'].includes(l.owner)&&
  (unknown(l)?bagInfo(l).known&&bagInfo(l).count>0:num(l.qty)>EPS);
 const lots=()=>state.lots.filter(eligible);
 const selected=()=>state.lots.find(l=>l.id===value('tLot'));
 const option=(id,label)=>`<option value="${E(id)}">${E(label)}</option>`;
 const setOptions=(id,items,placeholder,keep='')=>{
  const el=$(id);if(!el)return;
  el.innerHTML=option('',placeholder)+items.map(([id,label])=>option(id,label)).join('');
  el.value=items.some(x=>x[0]===keep)?keep:items.length===1?items[0][0]:'';
 };
 const weight=q=>q===null||q===undefined?'မချိန်ရသေး':vissText37(q)+' ပိဿာ';
 const bags=n=>n===null||n===undefined?'—':N(n)+' အိတ်';
 const quantity=(q,b)=>`<strong>${E(weight(q))}</strong>${b!==null&&b!==undefined?`<span>${E(bags(b))}</span>`:''}`;
 window.transferStatementAmount2=t=>t.history2?weight(t.history2.qtyMoved)+(t.history2.bagsMoved!==null?' · '+bags(t.history2.bagsMoved):''):t.weightKnown===false?'မချိန်ရသေး':vissText37(t.qty)+' ပိဿာ';
 // Weigh only this transferred fragment. The original receiving total becomes
 // complete after every remaining fragment has a real weight.
 window.canWeighTransferLot2=l=>!!l?.receiptId&&state.lots.some(x=>x.receiptId===l.receiptId&&x.transferRecord2)&&state.lots.filter(x=>x.receiptId===l.receiptId).every(x=>x.owner==='supplier');
 window.recordTransferWeight2=function(l,measurement){
  const r=receipt(l);if(!canWeighTransferLot2(l)){Object.assign(r,{qty:measurement.qty,weightKnown:true,packWeight2:{...measurement}});return;}
  const group=state.lots.filter(x=>x.receiptId===l.receiptId);
  Object.assign(r,{qty:rounded(group.reduce((sum,x)=>sum+num(x.qty),0)),weightKnown:group.every(x=>x.weightKnown!==false),packWeight2:{...measurement,splitTransfer:true}});
 };
 const stamp=iso=>{if(!iso||!Number.isFinite(Date.parse(iso)))return '—';return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso));};
 const tabs=(items,active,fn)=>`<div class="wt2-tabs" role="group">${items.map(([id,label])=>`<button type="button" class="${id===active?'active':''}" aria-pressed="${id===active}" onclick="${fn}('${id}')">${E(label)}</button>`).join('')}</div>`;
 const ownershipChoices=()=>[['supplier','ကုန်သည်ပိုင်ကုန်'],['owned','ပွဲရုံပိုင်ကုန်'],...(lots().some(l=>l.owner==='customer')?[['customer','ဝယ်သူပိုင်ကုန်']]:[])];
 window.transferOwner2=function(owner){
  if(!ownershipChoices().some(x=>x[0]===owner))return;
  $('tOwner').value=owner;$('tOwnerTabs2').innerHTML=tabs(ownershipChoices(),owner,'transferOwner2');
  const trader=owner!=='owned';$('tPersonWrap2').hidden=!trader;
  $('tPerson').disabled=!trader;$('tPerson').required=trader;
  $('tPersonLabel2').textContent=owner==='customer'?'ဝယ်သူ':'ကုန်သည်';
  const people=new Map();for(const l of lots().filter(l=>l.owner===owner))people.set(personId(l),personName(l));
  setOptions('tPerson',[...people],owner==='customer'?'ဝယ်သူ ရွေးပါ':'ကုန်သည် ရွေးပါ');transferPerson2();
 };
 function filtered(){const owner=value('tOwner'),p=value('tPerson');return lots().filter(l=>l.owner===owner&&(owner==='owned'||personId(l)===p));}
 window.transferPerson2=function(){
  const whs=[...new Set(filtered().map(l=>l.warehouse))];
  setOptions('tFrom',whs.map(id=>[id,W(id)]),'မူလဂိုဒေါင် ရွေးပါ');transferFrom2();
 };
 window.transferFrom2=function(){
  setOptions('tLot',filtered().filter(l=>l.warehouse===value('tFrom')).map(l=>[l.id,`${l.product} · ${l.batch||l.id}${size(l)?' · '+(l.packName||'ထုပ်ပိုးပြီး'):''}`]),'ကုန်အသုတ် ရွေးပါ');transferLot2();
 };
 window.transferLot2=function(){
  const l=selected(),b=bagInfo(l),fixed=size(l),known=!!l&&!unknown(l);
  setOptions('tWh',state.warehouses.filter(w=>w.active&&w.id!==(l?.warehouse||value('tFrom'))).map(w=>[w.id,w.name]),'လက်ခံဂိုဒေါင် ရွေးပါ',value('tWh'));
  $('tSource2').innerHTML=l?`<div class="wt2-source-title"><strong>${E(l.product)}</strong><span>${E(ownerLabel(l.owner))}${l.owner!=='owned'?' · '+E(personName(l)):''}</span></div><div>${E(W(l.warehouse))} · ${E(l.batch||l.id)}</div><div class="wt2-balance">${quantity(known?num(l.qty):null,b.known?b.count:null)}</div>${fixed?`<div>${E(l.packName||'ထုပ်ပိုးပြီး')} · ${E(weight(fixed))} / အိတ်</div>`:''}`:note('ကုန်ပိုင်ဆိုင်မှု၊ မူလဂိုဒေါင်နှင့် ကုန်အသုတ်ကို ရွေးပါ။','blue');
  $('tQty').value='';$('tBags').value='';
  transferMode2(unknown(l)?'bags':fixed?'bags':'viss');
 };
 window.transferMode2=function(mode){
  const l=selected();if(!['viss','bags'].includes(mode))return;
  if(unknown(l))mode='bags';$('tMode').value=mode;
  $('tModeTabs2').innerHTML=tabs(unknown(l)?[['bags','အိတ်ဖြင့်']]:[['viss','ပိဿာဖြင့်'],['bags','အိတ်ဖြင့်']],mode,'transferMode2');
  const fixed=size(l),b=bagInfo(l),needBags=mode==='bags'||b.known&&!fixed;
  $('tQtyWrap2').hidden=unknown(l);$('tQty').disabled=unknown(l);$('tQty').required=!unknown(l);$('tQty').readOnly=!!fixed&&mode==='bags';
  $('tBagsWrap2').hidden=!needBags;$('tBags').disabled=!needBags;$('tBags').required=needBags;
  $('tBags').max=b.known?String(b.count):'1000000000';$('tQty').max=l&&!unknown(l)?String(l.qty):'1000000000';
  // Put the chosen unit first without rebuilding inputs or losing typed values.
  $('tAmounts2').append(mode==='bags'?$('tBagsWrap2'):$('tQtyWrap2'),mode==='bags'?$('tQtyWrap2'):$('tBagsWrap2'));
  $('tUnitHelp2').textContent=unknown(l)?'ပိဿာမချိန်ရသေးသဖြင့် အိတ်အရေအတွက်ဖြင့်သာ ရွှေ့မည်။ ပိဿာကို မခန့်မှန်းပါ။':fixed?'တစ်အိတ်ဝင်အတိုင်း ပိဿာနှင့် အိတ်ကို အလိုအလျောက်တွက်မည်။ အိတ်ပြည့်သာ ရွှေ့နိုင်ပါသည်။':mode==='bags'?'ယခုပြောင်းရွှေ့မည့် အိတ်အရေအတွက်နှင့် တကယ်ချိန်ရပိဿာကို ဖြည့်ပါ။':b.known?'ယခုပြောင်းရွှေ့ပိဿာနှင့် အတူပါမည့် အိတ်အရေအတွက်ကို ဖြည့်ပါ။':'ယခုပြောင်းရွှေ့မည့် ပိဿာကို ဖြည့်ပါ။';
  transferPreview2();
 };
 function plan(){
  const l=selected(),b=bagInfo(l),fixed=size(l),mode=value('tMode');
  let q=unknown(l)?null:number('tQty'),n=null;
  if(fixed){if(mode==='bags'){n=number('tBags');q=rounded(n*fixed);}else n=rounded(q/fixed);}
  else if(mode==='bags'||b.known)n=number('tBags');
  return {l,b,fixed,q,n,mode};
 }
 function validation(p){
  const {l,b,fixed,q,n}=p,wh=value('tWh');
  if(!l||!eligible(l)||l.owner!==value('tOwner')||l.warehouse!==value('tFrom')||l.owner!=='owned'&&personId(l)!==value('tPerson'))return 'မူလကုန်ပိုင်ရှင်၊ ဂိုဒေါင်နှင့် အသုတ်ကို ပြန်ရွေးပါ။';
  if(!state.warehouses.some(w=>w.id===wh&&w.active)||wh===l.warehouse)return 'မူလနှင့် မတူသော လက်ခံဂိုဒေါင်ကို ရွေးပါ။';
  if(!unknown(l)&&(!Number.isFinite(q)||q<=0||q>num(l.qty)+EPS||Math.abs(q*100-Math.round(q*100))>EPS))return 'ပြောင်းရွှေ့ပိဿာကို လက်ကျန်အတွင်း ဒဿမ ၂ နေရာအထိ ဖြည့်ပါ။';
  if((fixed||p.mode==='bags'||b.known)&&(!Number.isFinite(n)||!Number.isInteger(n)||n<1||n>1000000000||b.known&&n>b.count+EPS))return 'ပြောင်းရွှေ့အိတ်ကို အိတ်ပြည့်အရေအတွက်ဖြင့် လက်ကျန်အတွင်း ဖြည့်ပါ။';
  if(!unknown(l)&&b.known&&!fixed&&((Math.abs(q-num(l.qty))<EPS)!==(n===b.count)))return 'ပိဿာအားလုံး ရွှေ့လျှင် အိတ်အားလုံးကိုပါ ရွှေ့ရပါမည်။ ကျန်ပိဿာနှင့် ကျန်အိတ်ကို ပြန်စစ်ပါ။';
  if(fixed&&Math.abs(n-Math.round(n))>EPS)return 'ထုပ်ပိုးပြီးကုန်ကို အိတ်ပြည့်နှင့် ကိုက်ညီသော ပိဿာဖြင့်သာ ရွှေ့ပါ။';
  return '';
 }
 window.transferPreview2=function(){
  const p=plan(),root=$('tPreview2');if(!root)return;
  if(p.fixed&&p.mode==='bags')$('tQty').value=p.q>0?String(p.q):'';
  const l=p.l,warning=l?validation(p):'';
  if(!l){root.innerHTML='';$('tSave2').disabled=true;return;}
  const remain=unknown(l)?null:rounded(num(l.qty)-num(p.q)),remB=p.b.known?rounded(p.b.count-num(p.n)):null;
  root.innerHTML=`<div class="wt2-preview-grid"><div><span>ယခုပြောင်းရွှေ့မည်</span>${quantity(p.q,p.n)}</div><div><span>မူလဂိုဒေါင်တွင် ကျန်မည်</span>${quantity(remain,remB)}</div></div>${warning?`<p class="wt2-warning">${E(warning)}</p>`:''}`;
  $('tSave2').disabled=!!warning;
 };
 transfer4=function(){
  if(!guardWork())return;
  if(!lots().length)return toast('ပြောင်းရွှေ့ရန် ကုန်လက်ကျန် မရှိပါ။',true);
  if(state.warehouses.filter(w=>w.active).length<2)return toast('လက်ခံရန် အခြားဂိုဒေါင်ကို သတ်မှတ်ချက်တွင် အရင်ထည့်ပါ။',true);
  const owner=['supplier','owned','customer'].includes(inventoryOwner)&&lots().some(l=>l.owner===inventoryOwner)?inventoryOwner:lots().some(l=>l.owner==='supplier')?'supplier':lots()[0].owner;
  const content=`<form id="transferForm4" class="wt2-form" onsubmit="event.preventDefault();saveTransfer4()"><input type="hidden" id="tOwner"><input type="hidden" id="tMode">
   <div class="field"><label>ကုန်ပိုင်ဆိုင်မှု</label><div id="tOwnerTabs2"></div></div>
   <div id="tPersonWrap2" class="field"><label id="tPersonLabel2" for="tPerson">ကုန်သည်</label><select id="tPerson" onchange="transferPerson2()"></select></div>
   <div class="field-row">${selectField('မူလဂိုဒေါင်','tFrom',[],'','required onchange="transferFrom2()"')}${selectField('ကုန် / မူလအသုတ်','tLot',[],'','required onchange="transferLot2()"')}</div>
   <div id="tSource2" class="wt2-source" aria-live="polite"></div>
   <div class="field-row">${selectField('လက်ခံဂိုဒေါင်','tWh',[],'','required onchange="transferPreview2()"')}${date4()}</div>
   <div class="field"><label>ပြောင်းရွှေ့ယူနစ်</label><div id="tModeTabs2"></div></div>
   <div class="field-row" id="tAmounts2"><div id="tQtyWrap2">${field('ယခုပြောင်းရွှေ့ပိဿာ','tQty',{type:'number',min:.01,step:.01,required:true,suffix:'ပိဿာ',placeholder:'ဥပမာ 60.25',extra:'oninput="transferPreview2()"'})}</div><div id="tBagsWrap2">${field('ယခုပြောင်းရွှေ့အိတ်','tBags',{type:'number',min:1,step:1,required:true,suffix:'အိတ်',placeholder:'ဥပမာ 5',extra:'oninput="transferPreview2()"'})}</div></div>
   <p id="tUnitHelp2" class="wt2-help"></p><div id="tPreview2" class="summary-box" aria-live="polite"></div>
  </form>`;
  openModal('ဂိုဒေါင် ပြောင်းရွှေ့မယ်','ကုန်ပိုင်ရှင်နှင့် မူလအသုတ်ကို ဆက်ထိန်းပြီး ဂိုဒေါင်ပြောင်းရွှေ့မည်။',content,btn('ပြန်မယ်','closeModal()','secondary')+'<button id="tSave2" type="button" class="btn btn-primary" onclick="saveTransfer4()">ပြောင်းရွှေ့ သိမ်းမယ်</button>',true);
  transferOwner2(owner);
 };
 saveTransfer4=function(){
  if(!guardWork()||!validForm('transferForm4'))return;
  const p=plan(),message=validation(p);if(message)return error(message);
  const {l,b,q,n,fixed}=p,wh=value('tWh'),date=value('fDate');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)return error('မှန်ကန်သော ရက်စွဲကို ရွေးပါ။');
  const before=num(l.qty),beforeB=b.known?b.count:null,recordedAt=new Date().toISOString(),id=uid('TR'),wasUnknown=unknown(l);
  const after=wasUnknown?0:Math.max(0,rounded(before-q)),afterB=b.known?Math.max(0,rounded(b.count-n)):null;
  const to={...l,id:uid('L'),warehouse:wh,qty:wasUnknown?0:q,bags:n??0,
   packageCount:fixed?n:0,weightKnown:!wasUnknown,transferSourceLot2:l.id,transferRecord2:id,transferBagsKnown2:n!==null};
  if(!fixed&&(l.bagType==='raw'||wasUnknown)){to.rawBags=n??0;to.bagType='raw';}
  if(Object.hasOwn(to,'actualBags'))to.actualBags=n;
  // Subtract actual entered bags, never a proportional estimate for raw bags.
  l.qty=after;
  if(b.known){l.bags=afterB;if(!fixed&&l.bagType==='raw')l.rawBags=afterB;if(Object.hasOwn(l,'actualBags'))l.actualBags=afterB;}
  else {l.bags=before>0?rounded(num(l.bags)*after/before):0;l.transferBagsKnown2=false;}
  if(fixed)l.packageCount=afterB;
  if(wasUnknown&&afterB===0)l.weightKnown=true; // Empty source is no longer unknown stock.
  state.lots.push(to);
  const r=receipt(l);
  state.transfers.unshift({id,date,recordedAt,product:l.product,batch:l.batch,name:personName(l),owner:l.owner,from:l.warehouse,to:wh,qty:wasUnknown?0:q,bags:n,weightKnown:!wasUnknown,
   history2:{schema:1,recordedAt,role:state.role,owner:l.owner,ownerName:personName(l),partnerId:personId(l),product:l.product,
    sourceReceiptId:l.receiptId||'',sourceReceiptNo:r?.voucherNo||r?.no||l.originReceiptNo||'',sourceLotId:l.id,destinationLotId:to.id,sourceBatch:l.batch||'',
    fromName:W(l.warehouse),toName:W(wh),inputUnit:p.mode,packName:l.packName||'',packageViss:fixed||null,
    qtyBefore:wasUnknown?null:before,qtyMoved:wasUnknown?null:q,qtyAfter:wasUnknown?null:after,bagsBefore:beforeB,bagsMoved:n,bagsAfter:afterB}});
  audit4(l.product+' '+W(l.warehouse)+' မှ '+W(wh)+' သို့ ပြောင်းရွှေ့ခဲ့သည်။');
  invTab='transfers';done4('ဂိုဒေါင် ပြောင်းရွှေ့ပြီးပါပြီ။','inventory');
 };
 function history(){
  const rows=state.transfers.map((t,i)=>({t,i})).sort((a,b)=>String(b.t.recordedAt||b.t.date).localeCompare(String(a.t.recordedAt||a.t.date)));
  return table4(['ရက် / အချိန်','ကုန်ပိုင်ရှင်','ကုန် / မူလအသုတ်','မူလ → လက်ခံ','ပြောင်းရွှေ့ပမာဏ','ပြောင်းရွှေ့ပြီး မူလလက်ကျန်','အသေးစိတ်'],rows.map(({t,i})=>{
   const h=t.history2;return `<tr><td>${shortDate(t.date)}<div class="sub">${E(stamp(h?.recordedAt||t.recordedAt))}</div></td><td><strong>${E(h?.ownerName||t.name||ownerLabel(t.owner))}</strong><div class="sub">${E(ownerLabel(h?.owner||t.owner))}</div></td><td><strong>${E(h?.product||t.product)}</strong><div class="sub">${E(h?.sourceReceiptNo||h?.sourceBatch||t.batch||'—')}</div></td><td>${E(h?.fromName||W(t.from))}<div>→ ${E(h?.toName||W(t.to))}</div></td><td class="wt2-quantity">${quantity(h?h.qtyMoved:t.weightKnown===false?null:t.qty,h?h.bagsMoved:t.bags)}</td><td class="wt2-quantity">${h?quantity(h.qtyAfter,h.bagsAfter):'—'}</td><td>${smallbtn('ကြည့်မယ်',`openTransferDetail2(${i})`,'secondary','eye')}</td></tr>`;
  }));
 }
 window.backTransferHistory2=function(){workDirty=false;closeModal();navigate('inventory');invTab='transfers';renderInventoryBody();};
 window.openTransferDetail2=function(index){
  const t=state.transfers[index];if(!t)return;const h=t.history2;
  const item=(label,val)=>`<div class="wt2-detail-item"><span>${E(label)}</span><strong>${val}</strong></div>`;
  openModal('ဂိုဒေါင်ပြောင်းရွှေ့မှတ်တမ်း အသေးစိတ်','ကုန်ပိုင်ရှင်၊ မူလအသုတ်နှင့် ပြောင်းရွှေ့ပမာဏကို စစ်ဆေးပါ။',`<div class="wt2-detail-grid">
   ${item('မှတ်တမ်းအမှတ်',E(t.id))}${item('ရက်စွဲ',shortDate(t.date))}${item('မှတ်တမ်းတင်သည့် ရက် / အချိန်',E(stamp(h?.recordedAt||t.recordedAt)))}${item('မှတ်တမ်းတင်သူ အခန်းကဏ္ဍ',h?(h.role==='owner'?'ပိုင်ရှင်':'စာရေးမ'):'—')}
   ${item('ကုန်ပိုင်ဆိုင်မှု',E(ownerLabel(h?.owner||t.owner)))}${item('ကုန်ပိုင်ရှင်',E(h?.ownerName||t.name||'—'))}${item('ကုန်ပစ္စည်း',E(h?.product||t.product))}${item('မူလကုန်လက်ခံမှတ်တမ်း',E(h?.sourceReceiptNo||'—'))}${item('မူလအသုတ်',E(h?.sourceBatch||t.batch||'—'))}${item('မူလဂိုဒေါင်',E(h?.fromName||W(t.from)))}${item('လက်ခံဂိုဒေါင်',E(h?.toName||W(t.to)))}${item('ထုပ်ပိုးပုံစံ / တစ်အိတ်ဝင်',h?.packageViss?E(h.packName||'ထုပ်ပိုးပြီး')+' · '+E(weight(h.packageViss)):'—')}
  </div><div class="summary-box mt">${row4('မပြောင်းရွှေ့မီ မူလလက်ကျန်',h?quantity(h.qtyBefore,h.bagsBefore):'—')}${row4('ပြောင်းရွှေ့ပမာဏ',quantity(h?h.qtyMoved:t.weightKnown===false?null:t.qty,h?h.bagsMoved:t.bags))}${row4('ပြောင်းရွှေ့ပြီး မူလလက်ကျန်',h?quantity(h.qtyAfter,h.bagsAfter):'—')}</div>${!h?'<p class="wt2-help">ယခင်မှတ်တမ်းတွင် မသိမ်းထားသော အချိန်၊ အိတ်နှင့် လက်ကျန်ကို — ဖြင့် ပြထားပါသည်။</p>':''}`,btn('ပြောင်းရွှေ့မှတ်တမ်းသို့ ပြန်မယ်','backTransferHistory2()','secondary'),true);
 };
 const previous=renderInventoryBody;
 renderInventoryBody=function(){
  const result=previous();if(invTab!=='transfers')return result;
  const root=$('inventoryBody');if(!root)return result;
  root.innerHTML=`<div id="transferWorkspace82"><div class="transfer82-header"><div><h3>ဂိုဒေါင် ပြောင်းရွှေ့မည်</h3><p>ကုန်ပိုင်ရှင်ရွေးပြီး ပိဿာ သို့မဟုတ် အိတ်ဖြင့် ပြောင်းရွှေ့ပါ။</p></div>${btn('ပြောင်းရွှေ့အသစ်','transfer4()','primary','plus')}</div><section class="card transfer82-history"><h3>ဂိုဒေါင် ပြောင်းရွှေ့မှတ်တမ်းများ</h3><div class="wt2-history">${history()}</div></section></div>`;
  return result;
 };
})();

