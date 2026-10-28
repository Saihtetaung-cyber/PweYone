
/* V4.8 — free-text deduction type. Service = % of gross-before-deductions; Labor = auto; others = manual. */
(function(){
 function deductionName48(r){
  return (r?.displayName||r?.customType||deductionItemLabel(r?.itemType,r?.customType)||r?.name||'').trim();
 }
 function modeFromName48(name){
  const n=(name||'').trim();
  if(n==='ဝန်ဆောင်ခ')return 'service_percent';
  if(n==='လုပ်သားခ')return 'labor_auto';
  return 'manual';
 }
 function migrate48(){
  ensureDeductionRateMastersV43();
  state.masters.purchaseDeductionRates.forEach(r=>{
   const oldLabel=deductionName48(r);
   if(!r.displayName){r.displayName=oldLabel;}
   const mode=r.calcMode||((r.itemType==='service'&&oldLabel==='ဝန်ဆောင်ခ')?'service_percent':(r.itemType==='labor'?'labor_auto':'manual'));
   if(r.calcMode!==mode){r.calcMode=mode;}
   if(mode==='service_percent'){
    if(r.itemType!=='service'){r.itemType='service';}
    if(r.basis!=='percent_total'){r.basis='percent_total';}
    r.kind='service';
   }else if(mode==='labor_auto'){
    if(r.itemType!=='labor'){r.itemType='labor';}
    if(r.basis!=='labor_auto'){r.basis='labor_auto';}
    r.kind='labor';
   }else{
    if(r.itemType!=='custom'){r.itemType='custom';}
    if(r.customType!==r.displayName){r.customType=r.displayName;}
    if(r.basis!=='manual'){r.basis='manual';}
    if(Number(r.rate)!==0){r.rate=0;}
    r.kind='service';
   }
  });
  // Display compatibility only: persist edits through the server master command.
 }
 const init48=initV4;
 initV4=function(){init48();migrate48();};

 deductionOptionLabel=function(r){
  const name=deductionName48(r);
  if(r?.calcMode==='service_percent')return name+' · '+N(r.rate||0)+'%';
  if(r?.calcMode==='labor_auto')return name+' · Auto';
  return name+' · Manual';
 };
 deductionBasisLabel=function(r){
  if(r?.calcMode==='service_percent'||r?.basis==='percent_total')return 'အနုတ်ငွေမနုတ်ခင် စုစုပေါင်း၏ '+N(r.rate||0)+'%';
  if(r?.calcMode==='labor_auto'||r?.basis==='labor_auto')return 'Auto';
  if(r?.calcMode==='manual'||r?.basis==='manual')return 'Manual';
  return r?.basis==='per_bag'?'တစ်အိတ် '+cashText(r.rate||0):'Manual';
 };

 function syncDeductionMode48(){
  const name=(value('drName48')||'').trim(),mode=modeFromName48(name);
  const rateWrap=document.getElementById('drServiceRateWrap48'),noteBox=document.getElementById('drModeNote48');
  if(rateWrap)rateWrap.classList.toggle('hide',mode!=='service_percent');
  if(noteBox){
   noteBox.textContent=mode==='service_percent'
    ?'ဝန်ဆောင်ခကို အနုတ်ငွေများ မနုတ်ခင် စုစုပေါင်းကုန်ဖိုးပေါ်မှ ရာခိုင်နှုန်းအလိုက် Auto တွက်မည်။'
    :mode==='labor_auto'
      ?'လုပ်သားခကို ဈေးဖြတ်ဖောင်ရှိ လုပ်သားခတွက်ချက်မှုမှ Auto တွက်မည်။'
      :'ဤနုတ်ငွေကို ဈေးဖြတ်ဖောင်တွင် အသုံးပြုချိန် ငွေပမာဏကို Manual ရိုက်ထည့်မည်။';
  }
 }
 window.syncDeductionMode48=syncDeductionMode48;

 deductionEditor=function(){
  if(!deductionEditId)return '';
  migrate48();
  const r=deductionEditId==='__new__'?null:deductionRateById(deductionEditId);
  const name=r?deductionName48(r):'',mode=r?.calcMode||modeFromName48(name),applyAt=r?.applyAt||'purchase';
  return `<section class="card mt"><h3>${r?'နုတ်ငွေ ပြင်မယ်':'နုတ်ငွေအမျိုးအစား အသစ်ထည့်မယ်'}</h3>
   <p class="small muted mt">နုတ်ငွေအမျိုးအစားကို စိတ်ကြိုက်ရိုက်ထည့်ပါ။ <strong>ဝန်ဆောင်ခ</strong> နှင့် <strong>လုပ်သားခ</strong> ကိုသာ Auto တွက်ပြီး အခြားအမျိုးအစားအားလုံးကို ဈေးဖြတ်ချိန်တွင် Manual ငွေပမာဏထည့်ပါမယ်။</p>
   <div class="deduction-editor-horizontal" style="grid-template-columns:minmax(220px,1.5fr) minmax(210px,1.1fr) minmax(190px,1fr) minmax(150px,.8fr)">
    ${field('နုတ်ငွေအမျိုးအစား','drName48',{value:name,required:true,placeholder:'ဥပမာ ဝန်ဆောင်ခ / ကားခ / သန့်စင်ခ / စိတ်ကြိုက်အမည်',extra:'oninput="syncDeductionMode48()"'})}
    ${selectField('အသုံးပြုမည့်အချိန်','drApplyAt',deductionStageChoices,applyAt)}
    <div id="drServiceRateWrap48" class="${mode==='service_percent'?'':'hide'}">${field('ဝန်ဆောင်ခ ရာခိုင်နှုန်း','drRate',{type:'number',min:0,max:100,step:.1,value:mode==='service_percent'?(r?.rate??''):'',suffix:'%',placeholder:'ဥပမာ 1.5'})}</div>
    ${selectField('အခြေအနေ','drActive',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],r?.active===false?'no':'yes')}
   </div>
   <div id="drModeNote48" class="deduction-mode-note mt">${mode==='service_percent'?'ဝန်ဆောင်ခကို အနုတ်ငွေများ မနုတ်ခင် စုစုပေါင်းကုန်ဖိုးပေါ်မှ ရာခိုင်နှုန်းအလိုက် Auto တွက်မည်။':mode==='labor_auto'?'လုပ်သားခကို ဈေးဖြတ်ဖောင်ရှိ လုပ်သားခတွက်ချက်မှုမှ Auto တွက်မည်။':'ဤနုတ်ငွေကို ဈေးဖြတ်ဖောင်တွင် အသုံးပြုချိန် ငွေပမာဏကို Manual ရိုက်ထည့်မည်။'}</div>
   <div class="deduction-editor-actions">${btn('မသိမ်းတော့ပါ','cancelDeductionRate()','secondary')}${btn('သိမ်းမယ်','saveDeductionRate()','primary','check')}</div>
  </section>`;
 };

 editDeductionRate=function(id=''){deductionEditId=id||'__new__';render();setTimeout(syncDeductionMode48,0);};
 saveDeductionRate=function(){
  migrate48();
  const editing=deductionEditId!=='__new__'?deductionRateById(deductionEditId):null;
  const displayName=(value('drName48')||'').trim(),calcMode=modeFromName48(displayName),applyAt=value('drApplyAt')||'purchase',active=value('drActive')==='yes';
  if(!safeLabel(displayName))return error('နုတ်ငွေအမျိုးအစားအမည် ထည့်ပါ။');
  let rate=0,itemType='custom',basis='manual',kind='service',customType=displayName;
  if(calcMode==='service_percent'){
   rate=number('drRate');itemType='service';basis='percent_total';customType='';
   if(!Number.isFinite(rate)||rate<0||rate>100)return error('ဝန်ဆောင်ခ ရာခိုင်နှုန်းကို 0 မှ 100 အတွင်း ထည့်ပါ။');
  }else if(calcMode==='labor_auto'){
   itemType='labor';basis='labor_auto';kind='labor';customType='';rate=0;
  }
  if(state.masters.purchaseDeductionRates.some(x=>x.id!==editing?.id&&deductionName48(x)===displayName&&x.applyAt===applyAt&&x.calcMode===calcMode&&(calcMode!=='service_percent'||Number(x.rate)===rate)))return error('တူညီသော နုတ်ငွေအမျိုးအစား ရှိပြီးဖြစ်ပါသည်။');
  const before=editing?{...editing}:null,rec=editing||{id:uid('DR')};
  Object.assign(rec,{name:displayName,displayName,calcMode,itemType,customType,applyAt,basis,rate,active,kind});
  if(!editing)state.masters.purchaseDeductionRates.push(rec);
  masterLog?.('purchaseDeductionRates',rec.id,before,{...rec});audit4?.(displayName+' နုတ်ငွေအမျိုးအစား သိမ်းခဲ့သည်။');deductionEditId='';save();render();toast('အဝယ်နုတ်ငွေ သတ်မှတ်ချက် သိမ်းပြီးပါပြီ။');
 };

 deductionRatesPage=function(){
  migrate48();const rows=state.masters.purchaseDeductionRates;
  const table=rows.length?table4(['နုတ်ငွေအမျိုးအစား','အသုံးပြုမည့်အချိန်','တွက်ချက်ပုံ','နှုန်း','အခြေအနေ','လုပ်ဆောင်ရန်'],rows.map(r=>{
   const mode=r.calcMode||modeFromName48(deductionName48(r));
   const calc=mode==='service_percent'?'Auto — အနုတ်မနုတ်ခင်စုစုပေါင်း၏ %':mode==='labor_auto'?'Auto — လုပ်သားခတွက်ချက်မှု':'Manual';
   const rate=mode==='service_percent'?N(r.rate||0)+'%':'—';
   return `<tr><td><strong>${E(deductionName48(r))}</strong></td><td>${E(deductionStageLabel(r.applyAt))}</td><td>${calc}</td><td>${rate}</td><td>${pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')}</td><td><div class="row wrap">${smallbtn('ပြင်',`editDeductionRate('${r.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteDeductionRate('${r.id}')`,'danger')}</div></td></tr>`;
  })):`<div class="empty"><div class="icon-box">${I('price')}</div><strong>နုတ်ငွေအမျိုးအစား မရှိသေးပါ</strong><p class="small muted mt">“+ အသစ်ထည့်မည်” ကိုနှိပ်ပြီး စိတ်ကြိုက်အမည် ရိုက်ထည့်ပါ။</p></div>`;
  return setupBack()+heading('','ပေါင်းနုတ်ငွေ နှုန်းထား','နုတ်ငွေအမျိုးအစားကို စိတ်ကြိုက် Create လုပ်နိုင်သည်။ ဝန်ဆောင်ခနှင့် လုပ်သားခသာ Auto တွက်ပြီး ကျန်အမျိုးအစားများကို ဈေးဖြတ်ချိန်တွင် Manual ငွေပမာဏထည့်မည်။',btn('+ အသစ်ထည့်မည်','editDeductionRate()','primary','plus'))+
   `<section class="card">${note('ဝန်ဆောင်ခ = အနုတ်ငွေမနုတ်ခင် စုစုပေါင်းကုန်ဖိုး × ရာခိုင်နှုန်း။ လုပ်သားခ = လုပ်သားခတွက်ချက်မှုမှ Auto။ ကားခ၊ သန့်စင်ခ၊ အိတ်ခ၊ ဆေးအုပ်ခ၊ ဂိုထောင်ထိန်းသိမ်းခနှင့် စိတ်ကြိုက်နုတ်ငွေများ = ဈေးဖြတ်ဖောင်တွင် Manual ငွေပမာဏထည့်ရန်။','blue')}<div class="mt">${table}</div></section>`+deductionEditor();
 };

 function serviceRules48(){migrate48();return deductionRatesFor('purchase',true).filter(r=>r.calcMode==='service_percent');}
 function manualRules48(){migrate48();return deductionRatesFor('purchase',true).filter(r=>r.calcMode==='manual');}
 function serviceField48(){
  const opts=serviceRules48();return `<div class="field mt">${selectField('ဝန်ဆောင်ခ','purchaseService48',[['','မသုံးပါ'],...opts.map(r=>[r.id,deductionOptionLabel(r)])],opts[0]?.id||'','onchange="calcVoucher4()"')}<p class="field-help">အနုတ်ငွေများ မနုတ်ခင် စုစုပေါင်းကုန်ဖိုးပေါ်မှ ရာခိုင်နှုန်းအလိုက် Auto တွက်မည်။</p></div>`;
 }

 addPurchaseDeductionRow4=function(rateId=''){
  const root=document.getElementById('purchaseDeductionRows4');if(!root)return;
  const opts=manualRules48();if(!opts.length)return error('Manual အသုံးပြုမည့် နုတ်ငွေအမျိုးအစားကို “အဝယ် နုတ်ငွေ နှုန်းထား” တွင် အရင် Create လုပ်ပါ။');
  const i=purchaseDeductionRowSeq4++;
  root.insertAdjacentHTML('beforeend',`<section class="card deduction-row4" data-i="${i}"><div class="row between wrap"><strong>နုတ်ငွေ ${i+1}</strong>${smallbtn('ဖယ်ရှားမယ်','removePurchaseDeductionRow4(this)','ghost')}</div><div class="field-row mt">${selectField('နုတ်ငွေအမျိုးအစား','pdr'+i,[['','ရွေးပါ'],...opts.map(r=>[r.id,deductionName48(r)])],rateId,'onchange="calcVoucher4()"')}<div class="manual-deduction-amount4">${field('ငွေပမာဏ','pda'+i,{type:'number',min:0,step:1,value:0,suffix:'ကျပ်',extra:'oninput="calcVoucher4()"'})}</div></div></section>`);
  calcVoucher4();
 };
 readPurchaseDeductionRows4=function(rows){
  const seen=new Set(),items=[];
  document.querySelectorAll('#purchaseDeductionRows4 .deduction-row4').forEach(el=>{
   const i=el.dataset.i,id=value('pdr'+i);if(!id)return;if(seen.has(id))return;seen.add(id);
   const rule=deductionRateById(id);if(!deductionApplicable(rule,'purchase')||rule.calcMode!=='manual')return;
   const amount=Math.max(0,number('pda'+i)||0);items.push({rateId:id,itemType:rule.itemType,customType:rule.customType||'',label:deductionName48(rule),basis:'manual',rate:0,amount});
  });
  return {items,total:items.reduce((n,x)=>n+x.amount,0),gross:rows.reduce((n,r)=>n+r.total,0),bags:purchaseDeductionBagCount4(rows)};
 };

 chargesForm4=function(){
  if(v4Kind!=='purchase') return chargesFormBeforeV44();
  purchaseDeductionRowSeq4=0;laborSeq=1;
  return `<details class="req-details mt" open><summary>အဝယ်နုတ်ငွေ ထည့်ရန်</summary>
   ${serviceField48()}
   <div class="row between wrap mt"><h3>လုပ်သားခ</h3></div><p class="small muted mt">လုပ်သားခကို အဝယ်တစ်စောင်လုံးအတွက် Auto တွက်ပါမယ်။</p><div id="purchaseLaborRows">${laborRowHtml(0)}</div>
   <div class="divider"></div><p class="small muted">ဝန်ဆောင်ခနှင့် လုပ်သားခမှလွဲ၍ ကျန်နုတ်ငွေအမျိုးအစားများကို လိုအပ်သလို Row ထည့်ပြီး ငွေပမာဏကို Manual ရိုက်ထည့်ပါ။</p>
   <div id="purchaseDeductionRows4" class="stack-sm mt"></div><div class="mt">${btn('နုတ်ငွေ Row အသစ်ထည့်မယ်','addPurchaseDeductionRow4()','secondary','plus')}</div>
   <div class="divider"></div>${num4('ကြိုသုံးငွေ ပြန်နုတ်ရန်','fAdvance',0,0,'oninput="calcVoucher4()"')}
  </details>`;
 };

 readCharges4=function(){
  if(v4Kind!=='purchase') return readChargesBeforeV44();
  const rows=readVoucherLines4(),d=readPurchaseDeductionRows4(rows),gross=rows.reduce((n,r)=>n+r.total,0);
  const serviceRule=deductionRateById(value('purchaseService48')),serviceFee=serviceRule?.calcMode==='service_percent'?Math.round(gross*(Number(serviceRule.rate)||0)/100):0;
  const laborRows=document.getElementById('purchaseLaborRows')?purchaseLaborRows().filter(r=>r.bags>0):[],labor=laborRows.reduce((n,r)=>n+(r.total||0),0);
  return {trip:'',truck:0,laborAuto:labor,labor,laborBasis:'bag-size-multiplier',laborRange:laborRows.map(r=>r.name+' · '+r.weight).join(', '),laborRows,clean:0,plastic:0,sack:0,advance:number('fAdvance')||0,serviceRateId:serviceRule?.id||'',serviceRateBasis:'percent_total',serviceRateValue:Number(serviceRule?.rate)||0,serviceFee,dynamicRows:d.items,deductionRows:d.items};
 };

 calcVoucher4=function(){
  if(v4Kind!=='purchase')return calcVoucherBeforeV44();
  if(document.getElementById('purchaseLaborRows'))purchaseLaborRows().forEach(r=>{const box=document.getElementById('laborCalculation'+r.index);if(box)box.innerHTML=r.rate===null?note('ရွေးထားသောအိတ်ဆိုဒ်၏ တစ်မယ်နှုန်း မသတ်မှတ်ရသေးပါ။','amber'):row4('တစ်မယ်နှုန်း',cashText(r.rate))+row4('ရွေးထားသည့်မယ်',N(r.multiple)+' မယ်')+row4('တစ်အိတ်လုပ်သားခ',`${N(r.rate)} × ${N(r.multiple)} = ${cashText(r.unitRate)}`)+row4('စုစုပေါင်းလုပ်သားခ',`${N(r.unitRate)} × ${N(r.bags)} အိတ် = ${cashText(r.total)}`);});
  const root=document.getElementById('voucherSummary4');if(!root)return;
  const rows=readVoucherLines4(),gross=rows.reduce((n,r)=>n+r.total,0),c=readCharges4(),manual=(c.dynamicRows||[]).reduce((n,x)=>n+x.amount,0),deductionTotal=(c.serviceFee||0)+(c.labor||0)+manual+(c.advance||0),net=gross-deductionTotal,paid=number('fPaid')||0;
  const sr=c.serviceRateId?deductionRateById(c.serviceRateId):null,serviceLine=c.serviceFee?row4(`ဝန်ဆောင်ခ · ${N(sr?.rate||0)}%`,'− '+cashText(c.serviceFee)):'';
  const laborLine=c.labor?row4('လုပ်သားခ','− '+cashText(c.labor)):'';
  const manualLines=(c.dynamicRows||[]).map(x=>row4(E(x.label)+' · Manual','− '+cashText(x.amount))).join('');
  root.innerHTML=row4('အနုတ်ငွေမနုတ်ခင် စုစုပေါင်း',cashText(gross))+serviceLine+laborLine+manualLines+(c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု','− '+cashText(c.advance)):'')+row4('စုစုပေါင်းနုတ်ငွေ',cashText(deductionTotal))+row4('အသားတင်',cashText(net))+row4('ယခုငွေရှင်း',cashText(paid))+row4('ပေးရန်ကျန်',cashText(net-paid));
 };

 chargesSummary4=function(c){
  if(!Array.isArray(c?.dynamicRows)&&!Array.isArray(c?.laborRows))return chargesSummaryBeforeV44(c);
  const laborDetail=(c.laborRows||[]).length?`<section class="card mt"><h3>လုပ်သားခ တွက်ချက်မှု</h3>${table4(['အိတ်ဆိုဒ် / အလေးချိန်','တစ်မယ်နှုန်း','မယ်','တစ်အိတ်လုပ်သားခ','အိတ်အရေအတွက်','လုပ်သားခ'],c.laborRows.map(r=>`<tr><td>${E(r.name)}<div class="small muted">${E(r.weight)}</div></td><td>${cashText(r.rate)}</td><td>${N(r.multiple)} မယ်</td><td>${cashText(r.unitRate)}</td><td>${N(r.bags)}</td><td><strong>${cashText(r.total)}</strong></td></tr>`))}</section>`:'';
  const sr=c.serviceRateId?deductionRateById(c.serviceRateId):null,serviceLine=c.serviceFee?row4(`ဝန်ဆောင်ခ · ${N(sr?.rate||0)}%`,cashText(c.serviceFee)):'';
  const manualLines=(c.dynamicRows||[]).map(x=>row4(E(x.label)+' · Manual',cashText(x.amount))).join('');
  const total=(c.serviceFee||0)+(c.labor||0)+(c.dynamicRows||[]).reduce((n,x)=>n+x.amount,0)+(c.advance||0);
  return laborDetail+`<details class="req-details mt"><summary>နုတ်ငွေအသေးစိတ်</summary><div class="summary-box">${serviceLine}${c.labor?row4('လုပ်သားခ',cashText(c.labor)):''}${manualLines}${c.advance?row4('ကြိုသုံးငွေနုတ်ယူမှု',cashText(c.advance)):''}${row4('စုစုပေါင်းနုတ်ငွေ',cashText(c.total??total))}</div></details>`;
 };

 migrate48();save();render();
})();
