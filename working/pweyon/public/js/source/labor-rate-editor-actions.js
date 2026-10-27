
/* V5.6 — Fix Mael-rate Create/Edit after the horizontal-layout overrides. */
(function(){
  window.editLaborRate51=function(id=''){
    if(typeof window.ensureLaborMasters51==='function') window.ensureLaborMasters51();
    if(!Array.isArray(state.laborRateMasters51)) state.laborRateMasters51=[];
    const existing=id?state.laborRateMasters51.find(x=>x.id===id):null;
    if(id&&!existing){ toast('မယ်နှုန်း မှတ်တမ်းကို မတွေ့ပါ။',true); return; }
    const r=existing||{id:'',name:'',rate:'',active:true};
    openModal(
      id?'မယ်နှုန်း ပြင်မယ်':'မယ်နှုန်း အသစ်ထည့်မယ်',
      '1 မယ် (တစ်ပိုင်း တစ်ခါကိုင်) အတွက် အသုံးပြုမည့် ကျပ်နှုန်းကို သတ်မှတ်ပါ။',
      `<form id="laborRateForm51" onsubmit="event.preventDefault();saveLaborRate51('${id}')">
        <div class="labor-master-form-grid-52">
          ${field('မယ်နှုန်းအမည်','laborRateName51',{value:r.name||'',placeholder:'ဥပမာ — ပုံမှန်နှုန်း',extra:'maxlength="60"'})}
          ${field('တစ်မယ်နှုန်း','laborRateValue51',{type:'number',min:0,step:1,value:r.rate??'',required:true,suffix:'ကျပ်',placeholder:'ဥပမာ 200'})}
          ${selectField('အခြေအနေ','laborRateActive51',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],r.active===false?'no':'yes')}
        </div>
      </form>`,
      btn('မသိမ်းတော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveLaborRate51('${id}')`,'primary','check'),
      true
    );
  };

  /* Save is also overridden so Create/Edit never depends on a private helper from an older script. */
  window.saveLaborRate51=function(id=''){
    if(!validForm('laborRateForm51'))return;
    if(typeof window.ensureLaborMasters51==='function') window.ensureLaborMasters51();
    if(!Array.isArray(state.laborRateMasters51)) state.laborRateMasters51=[];
    const rate=Number(value('laborRateValue51'));
    let name=cleanText(value('laborRateName51'));
    const active=value('laborRateActive51')==='yes';
    if(!Number.isFinite(rate)||rate<0||!Number.isInteger(rate))return error('တစ်မယ်နှုန်းကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
    if(!name)name='တစ်မယ် '+N(rate)+' ကျပ်';
    if(!safeLabel(name))return error('မယ်နှုန်းအမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
    if(state.laborRateMasters51.some(x=>x.id!==id&&x.name===name&&Number(x.rate)===rate))return error('တူညီသော မယ်နှုန်း ရှိပြီးသားဖြစ်ပါတယ်။');
    const old=id?state.laborRateMasters51.find(x=>x.id===id):null;
    if(id&&!old)return error('ပြင်မည့် မယ်နှုန်း မှတ်တမ်းကို မတွေ့ပါ။');
    if(old)Object.assign(old,{name,rate,active});
    else state.laborRateMasters51.push({id:uid('LR'),name,rate,active});
    audit4('လုပ်သားခ မယ်နှုန်း '+name+' · '+cashText(rate)+' သတ်မှတ်ခဲ့သည်။');
    save();closeModal();render();toast(id?'မယ်နှုန်း ပြင်ပြီးပါပြီ။':'မယ်နှုန်း အသစ်ထည့်ပြီးပါပြီ။');
  };

  if(page==='setup')render();
})();
