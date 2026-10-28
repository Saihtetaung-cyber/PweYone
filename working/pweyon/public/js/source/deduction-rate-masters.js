
/* V4.3 — Generic deduction master: choose deduction item first, then define rate and where it is used. */
const deductionItemChoices=[
 ['service','ဝန်ဆောင်ခ'],
 ['transport','ကားခ / တန်ဆာခ'],
 ['cleaning','သန့်စင်ခ'],
 ['fumigation','ဆေးအုပ်ခ'],
 ['warehouse','ဂိုထောင်ထိန်းသိမ်းခ'],
 ['labor','လုပ်သားခ'],
 ['custom','စိတ်ကြိုက် အသစ်ဖန်တီးမည်']
];
const deductionStageChoices=[
 ['purchase','ကုန်လက်ခံ / အဝယ်ချိန်'],
 ['sale','ကုန်ရောင်းချိန်'],
 ['both','ကုန်လက်ခံ / အဝယ် + ကုန်ရောင်း နှစ်မျိုးလုံး']
];
function deductionItemLabel(code,custom=''){
 if((code==='custom'||code==='other')&&custom)return custom;
 return deductionItemChoices.find(x=>x[0]===code)?.[1]||custom||'နုတ်ငွေ';
}
function deductionStageLabel(stage){return deductionStageChoices.find(x=>x[0]===stage)?.[1]||'ကုန်လက်ခံ / အဝယ်ချိန်';}
function ensureDeductionRateMastersV43(){
 ensureDeductionRateMasters();
 state.masters.purchaseDeductionRates.forEach(r=>{
  if(!r.itemType){r.itemType=r.kind==='labor'?'labor':'service';}
  if(!r.applyAt){r.applyAt='purchase';}
  if((r.itemType==='other'||r.itemType==='custom')&&!r.customType){r.customType=r.name||'စိတ်ကြိုက် နုတ်ငွေ';}
  if(r.itemType==='other'){r.itemType='custom';}
  /* keep old kind for transaction compatibility */
  r.kind=r.itemType==='labor'?'labor':'service';
 });
 // Display compatibility only: rendering server masters must not issue a write.
}
const _deductionRateByIdV43=deductionRateById;
deductionRateById=function(id){ensureDeductionRateMastersV43();return state.masters.purchaseDeductionRates.find(r=>r.id===id);};
function deductionApplicable(r,stage){return r&&r.active&&(r.applyAt===stage||r.applyAt==='both'||(!r.applyAt&&stage==='purchase'));}
function deductionRatesFor(stage,activeOnly=true){ensureDeductionRateMastersV43();return state.masters.purchaseDeductionRates.filter(r=>(!activeOnly||r.active)&&deductionApplicable({...r,active:true},stage));}
deductionOptionLabel=function(r){return deductionItemLabel(r.itemType,r.customType)+' · '+deductionBasisLabel(r);};

const _editDeductionRateV43=editDeductionRate;
editDeductionRate=function(id=''){deductionEditId=id||'__new__';render();setTimeout(()=>{toggleDeductionItemV43();toggleDeductionBasis();},0);};
function toggleDeductionItemV43(){
 const t=value('drItemType'),custom=document.getElementById('drCustomTypeWrap');
 if(custom)custom.classList.toggle('hide',t!=='custom');
 const basis=document.getElementById('drBasis');
 if(basis&&t==='labor'){basis.value='per_bag';basis.disabled=true;}else if(basis)basis.disabled=false;
 toggleDeductionBasis();
}
toggleDeductionBasis=function(){
 const item=value('drItemType')||'service',basis=document.getElementById('drBasis');if(!basis)return;
 if(item==='labor'){basis.value='per_bag';basis.disabled=true;}else basis.disabled=false;
 const u=document.getElementById('drUnitHelp');if(u)u.textContent=basis.value==='percent_total'?'ရာခိုင်နှုန်း ဥပမာ 0.5 / 1 / 1.5 / 2 / 2.5 / 3':'တစ်အိတ်လျှင် ကျပ်ငွေနှုန်း';
};

deductionEditor=function(){
 if(!deductionEditId)return '';
 ensureDeductionRateMastersV43();
 const r=deductionEditId==='__new__'?null:deductionRateById(deductionEditId);
 const itemType=r?.itemType||'service',basis=r?.basis||'per_bag',applyAt=r?.applyAt||'purchase';
 const customWrap=`<div id="drCustomTypeWrap" class="${itemType==='custom'?'':'hide'}">${field('နုတ်ငွေအမည်','drCustomType',{value:r?.customType||'',placeholder:'ဥပမာ ကုန်တင်ခ / အုပ်ချုပ်ခ / စိတ်ကြိုက်အမည်'})}</div>`;
 return `<section class="card mt v3-narrow-card"><h3>${r?'နုတ်ငွေနှုန်းထား ပြင်မယ်':'နုတ်ငွေနှုန်းထား အသစ်ထည့်မယ်'}</h3>
 <p class="small muted mt">ပထမဦးစွာ ဘာနုတ်ငွေထည့်မည်ကို ရွေးပါ။ ထို့နောက် မည်သည့်လုပ်ငန်းစဉ်တွင် သုံးမည်နှင့် နှုန်းထားကို သတ်မှတ်ပါ။</p>
 <div class="field-row mt">${selectField('ဘာနုတ်ငွေထည့်မလဲ','drItemType',deductionItemChoices,itemType,'onchange="toggleDeductionItemV43()"')}${selectField('အသုံးပြုမည့်အချိန်','drApplyAt',deductionStageChoices,applyAt)}</div>
 ${customWrap}
 <div class="field-row">${selectField('တွက်ချက်ပုံ','drBasis',[['per_bag','တစ်အိတ်နှုန်း'],['percent_total','ကုန်ဖိုး / ရောင်းရငွေစုစုပေါင်း၏ %']],basis,'onchange="toggleDeductionBasis()"')}${field('နှုန်းထား','drRate',{type:'number',min:0,step:.1,value:r?.rate??'',required:true,extra:'inputmode="decimal"'})}</div>
 <p id="drUnitHelp" class="field-help">${basis==='percent_total'?'ရာခိုင်နှုန်း ဥပမာ 0.5 / 1 / 1.5 / 2 / 2.5 / 3':'တစ်အိတ်လျှင် ကျပ်ငွေနှုန်း'}</p>
 ${selectField('အခြေအနေ','drActive',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],r?.active===false?'no':'yes')}
 <div class="row wrap mt">${btn('မသိမ်းတော့ပါ','cancelDeductionRate()','secondary')}${btn('သိမ်းမယ်','saveDeductionRate()','primary','check')}</div></section>`;
};

saveDeductionRate=function(){
 ensureDeductionRateMastersV43();
 const editing=deductionEditId!=='__new__'?deductionRateById(deductionEditId):null;
 const itemType=value('drItemType')||'service',customType=(value('drCustomType')||'').trim(),applyAt=value('drApplyAt')||'purchase';
 const basis=itemType==='labor'?'per_bag':value('drBasis'),rate=number('drRate'),active=value('drActive')==='yes';
 if(itemType==='custom'&&!safeLabel(customType))return error('စိတ်ကြိုက် နုတ်ငွေအမည် ထည့်ပါ။');
 if(!Number.isFinite(rate)||rate<0)return error('နှုန်းထားကို သုည သို့မဟုတ် အပေါင်းကိန်းဖြင့် ထည့်ပါ။');
 if(basis==='percent_total'&&rate>100)return error('ရာခိုင်နှုန်းသည် 0 မှ 100 အတွင်း ဖြစ်ရမည်။');
 const label=deductionItemLabel(itemType,customType);
 const autoName=label+' '+(basis==='percent_total'?N(rate)+'%':'တစ်အိတ် '+M(rate)+' ကျပ်');
 if(state.masters.purchaseDeductionRates.some(r=>r.id!==editing?.id&&r.itemType===itemType&&(r.customType||'')===customType&&r.applyAt===applyAt&&r.basis===basis&&Number(r.rate)===rate))return error('တူညီသော နုတ်ငွေနှုန်းထား ရှိပြီးဖြစ်ပါသည်။');
 const before=editing?{...editing}:null,rec=editing||{id:uid('DR')};
 Object.assign(rec,{name:autoName,itemType,customType:itemType==='custom'?customType:'',applyAt,basis,rate,active,kind:itemType==='labor'?'labor':'service'});
 if(!editing)state.masters.purchaseDeductionRates.push(rec);
 if(itemType==='service'&&basis==='per_bag'&&active)state.masters.purchaseDeductions.workRate=rate;
 if(itemType==='labor'&&active)state.masters.purchaseDeductions.laborRate=rate;
 masterLog?.('purchaseDeductionRates',rec.id,before,{...rec});audit4?.(label+' နုတ်ငွေနှုန်းထား သိမ်းခဲ့သည်။');deductionEditId='';save();render();toast('အဝယ်နုတ်ငွေ နှုန်းထား သိမ်းပြီးပါပြီ။');
};

deductionRatesPage=function(){
 ensureDeductionRateMastersV43();const rows=state.masters.purchaseDeductionRates;
 const table=rows.length?table4(['နုတ်ငွေအမျိုးအစား','အသုံးပြုမည့်အချိန်','တွက်ချက်ပုံ','နှုန်း','အခြေအနေ','လုပ်ဆောင်ရန်'],rows.map(r=>`<tr><td><strong>${E(deductionItemLabel(r.itemType,r.customType))}</strong></td><td>${E(deductionStageLabel(r.applyAt))}</td><td>${r.basis==='percent_total'?'စုစုပေါင်းတန်ဖိုး၏ %':'တစ်အိတ်နှုန်း'}</td><td>${r.basis==='percent_total'?N(r.rate)+'%':cashText(r.rate)}</td><td>${pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')}</td><td><div class="row wrap">${smallbtn('ပြင်',`editDeductionRate('${r.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteDeductionRate('${r.id}')`,'danger')}</div></td></tr>`)):`<div class="empty"><div class="icon-box">${I('price')}</div><strong>နုတ်ငွေနှုန်းထား မရှိသေးပါ</strong><p class="small muted mt">“+ အသစ်ထည့်မည်” ကိုနှိပ်ပြီး ဘာနုတ်ငွေထည့်မည်ကို အရင်ရွေးပါ။</p></div>`;
 return setupBack()+heading('','ပေါင်းနုတ်ငွေ နှုန်းထား','ဝယ်ယူ/ရောင်းချလုပ်ငန်းစဉ်တွင် နုတ်ယူမည့် အရာများကို ကိုယ်တိုင် Create လုပ်ပြီး CRUD စီမံနိုင်သည်။',btn('+ အသစ်ထည့်မည်','editDeductionRate()','primary','plus'))+
 `<section class="card">${note('အသစ်ထည့်ရာတွင် ဝန်ဆောင်ခ၊ ကားခ / တန်ဆာခ၊ သန့်စင်ခ၊ ဆေးအုပ်ခ၊ ဂိုထောင်ထိန်းသိမ်းခ၊ လုပ်သားခ စသည့် အသင့်ရွေးချယ်စရာများအပြင် “စိတ်ကြိုက် အသစ်ဖန်တီးမည်” ကိုရွေးပြီး မိမိလိုချင်သည့် နုတ်ငွေအမည်ကို ကိုယ်တိုင် Create လုပ်နိုင်သည်။ ထို့နောက် ကုန်လက်ခံ / အဝယ်ချိန်၊ ကုန်ရောင်းချိန် သို့မဟုတ် နှစ်မျိုးလုံးတွင် အသုံးပြုမည်ကို သတ်မှတ်ပါ။','blue')}<div class="mt">${table}</div></section>`+deductionEditor();
};

/* Keep old transaction selectors working, but only show rates applicable to the current stage. */
deductionSelect=function(kind,id,selected='',extra='onchange="updatePricingSheetFromRates()"'){
 ensureDeductionRateMastersV43();
 let opts=deductionRatesFor('purchase',true).filter(r=>kind==='labor'?r.itemType==='labor':r.itemType!=='labor');
 return selectField(kind==='labor'?'လုပ်သားခနှုန်းထား':'ပေါင်းနုတ်ငွေ နှုန်းထား',id,[['','မရွေးပါ'],...opts.map(r=>[r.id,deductionOptionLabel(r)])],selected||'',extra);
};
/* For the multi-product purchase voucher, list all non-labor purchase deductions in the existing deduction selector. */
chargesForm4=function(){
 let html=deductionChargesFormBase();if(v4Kind!=='purchase')return html;
 const opts=deductionRatesFor('purchase',true).filter(r=>r.itemType!=='labor'),selected='';
 const control=`<div class="field mt">${selectField('ပေါင်းနုတ်ငွေ နှုန်းထား','fServiceRate',[['','မရွေးပါ'],...opts.map(r=>[r.id,deductionOptionLabel(r)])],selected,'onchange="calcVoucher4()"')}</div>`;
 return html.replace('<div class="row between wrap mt"><h3>အိတ်ဆိုဒ်အလိုက် လုပ်သားခ</h3></div>',control+'<div class="row between wrap mt"><h3>အိတ်ဆိုဒ်အလိုက် လုပ်သားခ</h3></div>');
};
ensureDeductionRateMastersV43();save();render();
