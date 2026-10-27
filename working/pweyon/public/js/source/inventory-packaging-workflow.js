
/* V48: Packaging only, plus necessary purchase-stock integration for split receipt lots. */
(function(){
 'use strict';
 const originalCommit48=commitVoucher4;
 const byId48=id=>(state.lots||[]).find(l=>l.id===id);
 const receipt48=l=>state.receipts.find(r=>r.id===l?.receiptId);
 const traderId48=l=>{
   const r=receipt48(l);
   return String(r?.partnerId||l?.partnerId||l?.originPartnerId||('legacy:'+String(r?.name||l?.name||'')));
 };
 const traderName48=l=>{
   const r=receipt48(l),id=traderId48(l);
   const p=state.masters.partners.find(p=>p.id===id);
   return String(r?.name||(p?((typeof supplierLabel==='function')?supplierLabel(p):p.name):'')||l?.name||'ကုန်သည်');
 };
 const rawBags48=l=>Number(l?.rawBags??receipt48(l)?.rawBags??l?.bags??receipt48(l)?.bags)||0;
 const unknownRaw48=l=>l?.owner==='supplier'&&l.weightKnown===false&&
   (l.bagType||receipt48(l)?.bagType)==='raw'&&rawBags48(l)>0;
 const eligible48=(owner='')=>state.lots.filter(l=>
   (!owner||l.owner===owner)&&(l.owner==='owned'||l.owner==='supplier')&&l.stockForm!=='packaged'&&
   ((Number.isFinite(Number(l.qty))&&Number(l.qty)>0&&l.weightKnown!==false)||unknownRaw48(l)));
 const measuredAvailable48=l=>unknownRaw48(l)?number('pkActualWeight2'):Number(l?.qty)||0;
 const option48=(id,label)=>`<option value="${E(id)}">${E(label)}</option>`;
 const sourceLabel48=l=>`${l.product} · ${W(l.warehouse)} · ${l.batch||l.id} · ${unknownRaw48(l)?N(rawBags48(l))+' အကြမ်းအိတ် · ပိဿာဖြည့်ရန်':vissText37(l.qty)+' ပိဿာ'}`;
 function packOwner48(){return value('pkOwner48')||'owned';}
 function availableTraders48(){const by=new Map();for(const l of eligible48('supplier'))by.set(traderId48(l),traderName48(l));return [...by.entries()];}
 function selectNewLot48(){
   const owner=packOwner48(),trader=value('pkTrader48'),el=document.getElementById('pkLot');
   const lots=eligible48(owner).filter(l=>owner!=='supplier'||traderId48(l)===trader);
   if(!el)return;
   el.innerHTML=option48('','ကုန် / ဂိုဒေါင် / အသုတ် ရွေးပါ')+lots.map(l=>option48(l.id,sourceLabel48(l))).join('');
   if(lots.length===1)el.value=lots[0].id;
   packOptions4();
 }
 window.packOwnershipChanged48=function(){
   const owner=packOwner48(),wrap=document.getElementById('pkTraderWrap48'),el=document.getElementById('pkTrader48');
   if(wrap)wrap.hidden=owner!=='supplier';
   if(el){const traders=availableTraders48();el.innerHTML=option48('','ကုန်သည် ရွေးပါ')+traders.map(([id,name])=>option48(id,name)).join('');el.value=traders.length===1?traders[0][0]:'';}
   selectNewLot48();
 };
 window.packTraderChanged48=selectNewLot48;
 window.packLotChanged48=function(){packOptions4();};
 openPackaging=function(){
   if(!guardWork())return;
   const owned=eligible48('owned'),supplier=eligible48('supplier');
   if(!owned.length&&!supplier.length)return toast('ထုပ်ပိုးရန် ပွဲရုံပိုင် သို့မဟုတ် ကုန်သည်ပိုင် မထုပ်ပိုးရသေးသော ကုန်လက်ကျန် မရှိပါ။',true);
   const defaultOwner=owned.length?'owned':'supplier';
   const content=`<form id="packForm4" onsubmit="event.preventDefault();savePack4()">
     ${selectField('ကုန်ပိုင်ဆိုင်မှု','pkOwner48',[
       ['owned','ပွဲရုံပိုင်ကုန်'],['supplier','ကုန်သည်ပိုင်ကုန်']
     ],defaultOwner,'onchange="packOwnershipChanged48()"')}
     <div id="pkTraderWrap48" hidden>${selectField('ကုန်သည်','pkTrader48',[['','ကုန်သည် ရွေးပါ']],'','onchange="packTraderChanged48()"')}</div>
     ${selectField('ကုန် / ဂိုဒေါင် / ကုန်လက်ခံအသုတ်','pkLot',[['','ကုန် / ဂိုဒေါင် / အသုတ် ရွေးပါ']],'','onchange="packLotChanged48()"')}
     <div id="pkOrigin48" class="v48-package-source" aria-live="polite"></div>
     <div id="pkActualWeightWrap2" hidden>${field('ဤအသုတ်၏ စုစုပေါင်းချိန်ရရှိပိဿာ','pkActualWeight2',{type:'number',min:.01,step:.01,required:true,suffix:'ပိဿာ',placeholder:'ချိန်ရရှိပိဿာ ဖြည့်ပါ',help:'ဤအကြမ်းအိတ်အသုတ်တစ်ခုလုံး၏ တကယ်ချိန်ရရှိပိဿာကို ဖြည့်ပါ။ သိမ်းမှသာ အလေးချိန်မှတ်တမ်းတင်မည်။',extra:'max="1000000000" oninput="packPreview4()"'})}</div>
     <div id="pkTypeWrap"></div>
     ${num4('ထုပ်ပိုးအိတ်အရေအတွက်','pkCount',1,1,'oninput="packPreview4()"')}
     ${date4()}
     <div id="pkPreview" class="summary-box" aria-live="polite"></div>
   </form>`;
   openModal('အသုတ်မှ ထုပ်ပိုးမယ်','ကုန်သည်ပိုင်ကုန်ကို ထုပ်ပိုးပြီးလည်း မူလကုန်သည်၊ ဂိုဒေါင်၊ ကုန်လက်ခံအသုတ်နှင့် ပိုင်ဆိုင်မှု မပြောင်းလဲပါ။',content,btn('ပြန်မယ်','closeModal()','secondary')+btn('ထုပ်ပိုး သိမ်းမယ်','savePack4()'),true);
   const count=document.getElementById('pkCount');if(count)count.step='1';
   packOwnershipChanged48();
 };
 packOptions4=function(){
   const lot=byId48(value('pkLot')),wrap=document.getElementById('pkTypeWrap'),origin=document.getElementById('pkOrigin48');
   if(!wrap||!origin)return;
   const weightWrap=document.getElementById('pkActualWeightWrap2'),weightInput=document.getElementById('pkActualWeight2');
   if(weightWrap)weightWrap.hidden=!unknownRaw48(lot);
   if(weightInput){weightInput.disabled=!unknownRaw48(lot);weightInput.value='';}
   origin.innerHTML=lot?`<div><strong>ကုန်ပိုင်ရှင် — ${E(lot.owner==='supplier'?'ကုန်သည်ပိုင် · '+traderName48(lot):'ပွဲရုံပိုင်')}</strong></div>
     <div>ကုန် — ${E(lot.product)} | ဂိုဒေါင် — ${E(W(lot.warehouse))}</div>
     <div>ကုန်လက်ခံအသုတ် — ${E(receipt48(lot)?.voucherNo||lot.batch||lot.id)}</div>
     ${rawBags48(lot)>0&&(lot.bagType||receipt48(lot)?.bagType)==='raw'?`<div>မူလအကြမ်းအိတ် — ${N(rawBags48(lot))} အိတ်</div>`:''}`:
     '<span class="muted">ထုပ်ပိုးလိုသော ကုန်အသုတ်ကို ရွေးပါ။</span>';
   const types=lot?state.packTypes.filter(p=>p.active&&p.product===lot.product):[];
   wrap.innerHTML=selectField('ထုပ်ပိုးပုံစံ','pkType',[['','ထုပ်ပိုးပုံစံ ရွေးပါ'],...types.map(p=>[p.id,`${p.name} · ${N(p.size)} ${p.unit}`])],'','onchange="packPreview4()"');
   if(types.length===1)document.getElementById('pkType').value=types[0].id;
   packPreview4();
 };
 packPreview4=function(){
   const root=document.getElementById('pkPreview');if(!root)return;
   const formError=document.getElementById('modalError');if(formError){formError.textContent='';formError.style.display='none';}
   const lot=byId48(value('pkLot')),type=state.packTypes.find(p=>p.id===value('pkType'));
   const count=number('pkCount'),q=(type?.size||0)*(Number.isFinite(count)?count:0);
   if(!lot){root.innerHTML=note('ကုန်ပိုင်ဆိုင်မှု၊ ကုန်သည်နှင့် အသုတ်ကို ရွေးပါ။','blue');return;}
   if(unknownRaw48(lot)&&!(measuredAvailable48(lot)>0)){root.innerHTML=note('ထုပ်ပိုးမတိုင်မီ ဤအကြမ်းအိတ်အသုတ်၏ စုစုပေါင်းချိန်ရရှိပိဿာကို ဖြည့်ပါ။','blue');return;}
   if(!type){root.innerHTML=note('ဤကုန်အတွက် ထုပ်ပိုးပုံစံကို ရွေးပါ။ အသုံးပြုနေသောပုံစံ မရှိပါက သတ်မှတ်ချက်မှ ထုပ်ပိုးပုံစံ အရင်ထည့်ပါ။','amber');return;}
   const rem=measuredAvailable48(lot)-q;
   root.innerHTML=row4('မူလကုန်ပိုင်ဆိုင်မှု',E(lot.owner==='supplier'?'ကုန်သည်ပိုင်':'ပွဲရုံပိုင်'))+
     (lot.owner==='supplier'?row4('ကုန်သည်',E(traderName48(lot))):'')+
     row4('ထုပ်ပိုးမည့်ပိဿာ',vissText37(q)+' ပိဿာ')+
     row4(unknownRaw48(lot)?'ယခု ချိန်ရရှိပိဿာ':'အသုတ်လက်ကျန်',vissText37(measuredAvailable48(lot))+' ပိဿာ')+
     row4('ထုပ်ပိုးပြီးကျန်ပိဿာ',`<span class="${rem<-.000001?'v48-package-alert':''}">${vissText37(rem)} ပိဿာ</span>`)+
     (rem<-.000001?'<p class="v48-package-alert">ရွေးထားသော အသုတ်လက်ကျန်ထက် ကျော်နေပါသည်။</p>':'');
 };
 savePack4=function(){
   if(!guardWork()||!validForm('packForm4'))return;
   const owner=packOwner48(),trader=value('pkTrader48'),lot=byId48(value('pkLot'));
   const type=state.packTypes.find(p=>p.id===value('pkType'));
   const count=number('pkCount'),qty=(Number(type?.size)||0)*count;
   const needsWeight=unknownRaw48(lot),available=measuredAvailable48(lot);
   const validLot=!!lot&&eligible48(owner).some(l=>l.id===lot.id)&&lot.owner===owner&&
     (owner!=='supplier'||!!trader&&traderId48(lot)===trader);
   if(!validLot)return error('ကုန်ပိုင်ဆိုင်မှု၊ ကုန်သည်နှင့် ကုန်လက်ခံအသုတ်ကို မှန်ကန်စွာ ရွေးပါ။');
   if(needsWeight&&(!Number.isFinite(available)||available<=0||available>1000000000||Math.abs(available*100-Math.round(available*100))>.000001))
     return error('ချိန်ရရှိပိဿာကို သုညထက်ကြီးသော ပမာဏဖြင့် ဖြည့်ပါ။ ဒဿမ ၂ နေရာအထိ ထည့်နိုင်ပါသည်။');
   const sourceReceipt=receipt48(lot);
   if(needsWeight&&(!sourceReceipt||sourceReceipt.status==='purchased'||(state.lots.filter(l=>l.receiptId===sourceReceipt.id).length!==1&&!canWeighTransferLot2(lot))))
     return error('အလေးချိန်မှတ်တမ်းတင်မည့် မူလကုန်လက်ခံအသုတ်ကို ပြန်စစ်ပါ။');
   if(!type||!type.active||type.product!==lot.product||!(Number(type.size)>0)||
      !Number.isInteger(count)||count<1||!Number.isFinite(qty)||qty>available+.000001)
     return error('ထုပ်ပိုးပုံစံ၊ အိတ်အရေအတွက်နှင့် အသုတ်လက်ကျန်ကို ပြန်စစ်ပါ။');
   const partnerId=owner==='supplier'?traderId48(lot):lot.partnerId||'',merchant=owner==='supplier'?traderName48(lot):'ပွဲရုံပိုင်';
   // Record an actual weighing only after every packaging validation succeeds.
   // The receipt keeps its original raw bag count and remains supplier-owned/unpriced.
   if(needsWeight){
     const measurement={qty:available,rawBags:rawBags48(lot),previousQty:Number(lot.qty)||0,date:value('fDate'),recordedAt:new Date().toISOString(),role:state.role};
     Object.assign(lot,{qty:available,weightKnown:true,packWeight2:{...measurement}});
     recordTransferWeight2(lot,measurement);
   }
   const made={...lot,id:uid('L'),qty,bags:count,packageCount:count,packageViss:type.size,
     stockForm:'packaged',packType:type.id,packName:type.name,
     owner:lot.owner,name:lot.name,sourcePackagingLot48:lot.id,
     ...(owner==='supplier'&&!partnerId.startsWith('legacy:')?{partnerId}:{})};
   takeLot4(lot,qty);
   state.lots.push(made);
   state.packagingTransactions.push({id:uid('PK'),date:value('fDate'),product:lot.product,
     qty,bagCount:count,packageViss:type.size,type:'pack',warehouse:lot.warehouse,
     batch:lot.batch,sourceLot:lot.id,sourceReceiptId:lot.receiptId||'',
     sourceReceiptNo:sourceReceipt?.voucherNo||sourceReceipt?.no||'',
     owner:lot.owner,ownerName:merchant,partnerId:owner==='supplier'&&!partnerId.startsWith('legacy:')?partnerId:'',
     packName:type.name,packType:type.id,...(needsWeight?{measuredSourceQty2:available,sourceRawBags2:rawBags48(lot),recordedAt:lot.packWeight2.recordedAt}:{}),
     history2:{schema:1,recordedAt:new Date().toISOString(),role:state.role,
       owner:lot.owner,ownerName:merchant,partnerId:owner==='supplier'&&!partnerId.startsWith('legacy:')?partnerId:'',
       originalTraderName:owner==='supplier'?merchant:(sourceReceipt?.name||lot.originSupplierName||supplierLabel(supplierBy(lot.originPartnerId))||''),
       product:lot.product,grade:lot.grade,warehouseId:lot.warehouse,warehouseName:W(lot.warehouse),
       sourceLotId:lot.id,sourceBatch:lot.batch||'',sourceReceiptId:lot.receiptId||'',
       sourceReceiptNo:sourceReceipt?.voucherNo||sourceReceipt?.no||lot.originReceiptNo||'',
       sourceBagType:lot.bagType||sourceReceipt?.bagType||'',
       originalRawBags:(lot.bagType||sourceReceipt?.bagType)==='raw'?rawBags48(lot):null,
       qtyBefore:available,packedQty:qty,qtyAfter:Number(lot.qty),bagCount:count,
       packageViss:Number(type.size),packName:type.name,outputLotId:made.id,
       weighedDuringPacking:needsWeight}
   });
   audit4(`${lot.batch||lot.id} အသုတ် (${merchant}) မှ ${type.name} ထုပ်ပိုးခဲ့သည်။`);
   invTab='packages';done4('မူလကုန်ပိုင်ဆိုင်မှု မပြောင်းလဲဘဲ ထုပ်ပိုးပြီးပါပြီ။','inventory');
 };
 /* Pricing the same receipt later must convert BOTH loose and supplier-packaged stock.
    V47 purchase validation allows one receipt lot only. Temporarily consolidate the
    split for that existing validation/transaction, then restore physical split lots.
    Do not alter ordinary purchase or sale execution paths. */
 commitVoucher4=function(){
   if(v4Kind!=='purchase'||!document.getElementById('voucher4'))return originalCommit48();
   const rows=readVoucherLines4(),groups=[];
   for(const row of rows){
     const r=row.r;if(!r||r.status==='purchased')continue;
     const all=state.lots.filter(l=>l.receiptId===r.id);
     const packages=all.filter(l=>l.owner==='supplier'&&l.sourcePackagingLot48);
     const transferred=all.some(l=>l.transferRecord2);
     const adjusted=receiptHasAdjustment2(r)&&r.weightKnown!==false;
     if(!packages.length&&!transferred&&!adjusted)continue;
     const source=all.find(l=>l.owner==='supplier'&&!l.sourcePackagingLot48);
     if(!source||all.some(l=>l.owner!=='supplier'||(!transferred&&l.warehouse!==source.warehouse))||
        all.some(l=>l.weightKnown===false)||
        Math.abs(all.reduce((s,l)=>s+(Number(l.qty)||0),0)-adjustmentExpectedQty2(r))>.001||
        Math.abs(Number(row.qty)-adjustmentExpectedQty2(r))>.001)
       return error('ထုပ်ပိုးပြီးသော ကုန်သည်ပိုင်အသုတ်ကို ဈေးဖြတ်ရန် မူလကုန်လက်ခံပိဿာနှင့် လက်ရှိအသုတ်စုစုပေါင်း တူရပါမည်။ ကုန်ထုတ်ခြင်း သို့မဟုတ် မချိန်ရသေးသော အသုတ် ရှိမရှိ စစ်ဆေးပါ။');
     groups.push({r,source,all,packages,qty:source.qty,bags:source.bags,packageCount:source.packageCount});
   }
   if(!groups.length)return originalCommit48();
   const excluded=new Set(groups.flatMap(g=>g.all.filter(l=>l!==g.source)));
   const beforeLots=state.lots;
   try{
     state.lots=beforeLots.filter(l=>!excluded.has(l));
     for(const g of groups)g.source.qty=adjustmentExpectedQty2(g.r);
     return originalCommit48();
   }finally{
     const success=groups.every(g=>g.r.status==='purchased');
     for(const g of groups){
       g.source.qty=g.qty;g.source.bags=g.bags;g.source.packageCount=g.packageCount;
       if(!success)continue;
       const cost=Number(g.source.cost)||0,batch=g.source.batch;
       for(const l of g.all){
         l.owner='owned';l.name='ပွဲရုံပိုင်';l.cost=cost;
         l.batch=batch;l.entryDate=g.source.entryDate;
         l.weightKnown=true;
         l.originPartnerId??=g.r.partnerId;
         l.originSupplierName??=g.r.name;
         l.originReceiptNo??=g.r.voucherNo||g.r.no;
       }
     }
     // Restore the original lot objects/order and persist the correctly split stock.
     state.lots=beforeLots;
     if(success){save();render();}
   }
 };
 document.title='ပွဲရုံ - V48 Supplier-Owned Packaging';
})();
