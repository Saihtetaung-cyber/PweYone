
/* V5.2 — Horizontal CRUD editors for Mael rate and Mael. */
(function(){
  window.editLaborRate51=function(id=''){
    ensureLaborMasters51();
    const r=laborRate51(id)||{id:'',name:'',rate:'',active:true};
    openModal(
      id?'မယ်နှုန်း ပြင်မယ်':'မယ်နှုန်း အသစ်ထည့်မယ်',
      'လုပ်သားခတွက်ရာတွင် အသုံးပြုမည့် မယ်နှုန်းကို အလျားလိုက်ဖောင်ဖြင့် သတ်မှတ်ပါ။',
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

  window.editLaborMael51=function(id=''){
    ensureLaborMasters51();
    const m=laborMael51(id)||{id:'',value:'',name:'',active:true};
    openModal(
      id?'မယ် ပြင်မယ်':'မယ် အသစ်ထည့်မယ်',
      'လုပ်သားခတွက်ရာတွင် ရွေးချယ်အသုံးပြုမည့် မယ်ကို အလျားလိုက်ဖောင်ဖြင့် သတ်မှတ်ပါ။',
      `<form id="laborMaelForm51" onsubmit="event.preventDefault();saveLaborMael51('${id}')">
        <div class="labor-master-form-grid-52">
          ${field('မယ်','laborMaelValue51',{type:'number',min:1,step:1,value:m.value??'',required:true,suffix:'မယ်',placeholder:'ဥပမာ 4'})}
          ${field('ဖော်ပြမည့်အမည်','laborMaelName51',{value:m.name||'',placeholder:'ဥပမာ — 4 မယ်',extra:'maxlength="60"'})}
          ${selectField('အခြေအနေ','laborMaelActive51',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],m.active===false?'no':'yes')}
        </div>
      </form>`,
      btn('မသိမ်းတော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveLaborMael51('${id}')`,'primary','check'),
      true
    );
  };
})();
