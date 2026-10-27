
/* V5.3 — Fix 1 Mael as “တစ်ပိုင်း တစ်ခါကိုင်”. Other Mael values remain CRUD. */
(function(){
  const FIXED_MAEL_NAME_53='1 မယ် — တစ်ပိုင်း တစ်ခါကိုင်';

  function enforceFixedMael53(){
    if(typeof window.ensureLaborMasters51==='function') window.ensureLaborMasters51();
    if(!Array.isArray(state.laborMaelMasters51)) state.laborMaelMasters51=[];

    let one=state.laborMaelMasters51.find(x=>Number(x?.value)===1);
    if(!one)return null;
    one.value=1;
    one.name=FIXED_MAEL_NAME_53;
    one.active=one.active!==false;
    one.fixed=true;

    /* Keep only one record for the fixed 1 Mael definition. */
    let kept=false;
    state.laborMaelMasters51=state.laborMaelMasters51.filter(x=>{
      if(Number(x?.value)!==1)return true;
      if(x===one&&!kept){kept=true;return true;}
      return false;
    });
    return one;
  }

  window.enforceFixedMael53=enforceFixedMael53;

  function mael53(id){
    enforceFixedMael53();
    return state.laborMaelMasters51.find(x=>x.id===id);
  }
  function activeMaels53(){
    enforceFixedMael53();
    return state.laborMaelMasters51.filter(x=>x.active!==false).sort((a,b)=>Number(a.value)-Number(b.value));
  }

  /* Dropdown: 1 Mael is always present and always means one half, one handling. */
  window.laborMaelOptions51=function(){
    return activeMaels53().map(m=>[m.id,m.name]);
  };

  /* CRUD editor: 1 Mael cannot be edited; 2+ Mael values can still be managed. */
  window.editLaborMael51=function(id=''){
    enforceFixedMael53();
    const existing=id?mael53(id):null;
    if(existing&&Number(existing.value)===1){
      toast('1 မယ် = တစ်ပိုင်း တစ်ခါကိုင် ဖြစ်ပြီး အသေသတ်မှတ်ထားသောကြောင့် ပြင်၍မရပါ။');
      return;
    }
    const m=existing||{id:'',value:'',name:'',active:true};
    openModal(
      id?'မယ် ပြင်မယ်':'မယ် အသစ်ထည့်မယ်',
      '1 မယ်ကို “တစ်ပိုင်း တစ်ခါကိုင်” အဖြစ် အသေထားပြီး၊ 2 မယ်နှင့်အထက်ကို လိုအပ်သလို CRUD လုပ်နိုင်ပါတယ်။',
      `<form id="laborMaelForm51" onsubmit="event.preventDefault();saveLaborMael51('${id}')">
        <div class="labor-master-form-grid-52">
          ${field('မယ်','laborMaelValue51',{type:'number',min:2,step:1,value:m.value??'',required:true,suffix:'မယ်',placeholder:'ဥပမာ 2'})}
          ${field('ဖော်ပြမည့်အမည်','laborMaelName51',{value:m.name||'',placeholder:'ဥပမာ — 2 မယ်',extra:'maxlength="60"'})}
          ${selectField('အခြေအနေ','laborMaelActive51',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],m.active===false?'no':'yes')}
        </div>
        <div class="fixed-mael-note-53">${note('1 မယ် = တစ်ပိုင်း တစ်ခါကိုင်။ ဒီအဓိပ္ပါယ်ကို System မှ အသေသတ်မှတ်ထားပါတယ်။','blue')}</div>
      </form>`,
      btn('မသိမ်းတော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveLaborMael51('${id}')`,'primary','check'),
      true
    );
  };

  window.saveLaborMael51=function(id=''){
    if(!validForm('laborMaelForm51'))return;
    enforceFixedMael53();
    const mv=Number(value('laborMaelValue51'));
    let name=cleanText(value('laborMaelName51'));
    const active=value('laborMaelActive51')==='yes';
    if(!Number.isFinite(mv)||!Number.isInteger(mv)||mv<2)
      return error('1 မယ်သည် အသေသတ်မှတ်ထားပြီးဖြစ်သောကြောင့် အသစ်ဖန်တီးမည့် မယ်ကို 2 နှင့်အထက် ထည့်ပါ။');
    if(!name)name=N(mv)+' မယ်';
    if(!safeLabel(name))return error('မယ်အမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
    if(state.laborMaelMasters51.some(x=>x.id!==id&&(Number(x.value)===mv||x.name===name)))
      return error('ဤမယ် သတ်မှတ်ချက် ရှိပြီးသားဖြစ်ပါတယ်။');
    const old=id?mael53(id):null;
    if(old)Object.assign(old,{value:mv,name,active,fixed:false});
    else state.laborMaelMasters51.push({id:uid('LM'),value:mv,name,active,fixed:false});
    enforceFixedMael53();
    audit4('လုပ်သားခ '+name+' သတ်မှတ်ခဲ့သည်။');
    save();closeModal();render();toast('မယ် သတ်မှတ်ချက် သိမ်းပြီးပါပြီ။');
  };

  window.deleteLaborMael51=function(id){
    enforceFixedMael53();
    const m=mael53(id);if(!m)return;
    if(Number(m.value)===1){
      toast('1 မယ် = တစ်ပိုင်း တစ်ခါကိုင် ဖြစ်ပြီး အသေသတ်မှတ်ထားသောကြောင့် ဖျက်၍မရပါ။');
      return;
    }
    const used=[...state.receipts,...state.sales].some(x=>x.charges4?.laborRows?.some(row=>row.maelId===id));
    if(!window.confirm(used?m.name+' ကို ယခင်စာရင်းတွင် သုံးထားပြီးဖြစ်၍ ပိတ်ထားမလား။':m.name+' ကို ဖျက်မလား။'))return;
    if(used)m.active=false;
    else state.laborMaelMasters51=state.laborMaelMasters51.filter(x=>x.id!==id);
    enforceFixedMael53();
    audit4('လုပ်သားခ '+m.name+' '+(used?'ပိတ်ထား':'ဖျက်')+'ခဲ့သည်။');
    save();render();
  };

  /* Rebuild labor settings page so the fixed rule is visible and cannot be edited/deleted. */
  handlingPage=function(){
    enforceFixedMael53();
    const rateRows=(state.laborRateMasters51||[]).map(r=>`<tr>
      <td><strong>${E(r.name)}</strong></td>
      <td>${cashText(r.rate)} / မယ်</td>
      <td>${pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')}</td>
      <td><div class="row wrap">${smallbtn('ပြင်',`editLaborRate51('${r.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteLaborRate51('${r.id}')`,'danger')}</div></td>
    </tr>`);
    const maelRows=state.laborMaelMasters51.slice().sort((a,b)=>Number(a.value)-Number(b.value)).map(m=>{
      const fixed=Number(m.value)===1;
      return `<tr>
        <td><strong>${E(m.name)}</strong>${fixed?'<div class="small muted">အသေသတ်မှတ်ချက်</div>':''}</td>
        <td>${N(m.value)} မယ်</td>
        <td>${fixed?'<span class="fixed-mael-53">အသေသတ်မှတ်ထား</span>':pill(m.active?'အသုံးပြုနေ':'ပိတ်ထား',m.active?'':'gray')}</td>
        <td>${fixed?'<span class="small muted">ပြင် / ဖျက် မရ</span>':`<div class="row wrap">${smallbtn('ပြင်',`editLaborMael51('${m.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteLaborMael51('${m.id}')`,'danger')}</div>`}</td>
      </tr>`;
    });
    return setupBack()+heading('','လုပ်သားခနှုန်း','မယ်နှုန်းကို CRUD လုပ်နိုင်ပြီး 1 မယ်ကို “တစ်ပိုင်း တစ်ခါကိုင်” အဖြစ် အသေသတ်မှတ်ထားသည်။')+
      `<section class="card mb">${note('လုပ်သားခ = မယ်နှုန်း × မယ် × အိတ်အရေအတွက်။ 1 မယ် = တစ်ပိုင်း တစ်ခါကိုင် ဖြစ်ပြီး မပြင်နိုင်၊ မဖျက်နိုင်ပါ။ 2 မယ်နှင့်အထက်ကို လိုအပ်သလို CRUD လုပ်နိုင်ပါတယ်။','blue')}</section>
       <div class="labor-master-grid-51">
        <section class="card">
          <div class="card-title"><div><h3>မယ်နှုန်း</h3><p class="small muted mt">1 မယ် (တစ်ပိုင်း တစ်ခါကိုင်) အတွက် ကျပ်နှုန်းကို သတ်မှတ်ပါ။</p></div>${btn('+ မယ်နှုန်း အသစ်ထည့်မယ်','editLaborRate51()','primary')}</div>
          ${rateRows.length?table4(['မယ်နှုန်း','တစ်မယ်နှုန်း','အခြေအနေ','လုပ်ဆောင်ရန်'],rateRows):`<div class="empty">မယ်နှုန်း မရှိသေးပါ။</div>`}
        </section>
        <section class="card">
          <div class="card-title"><div><h3>မယ်</h3><p class="small muted mt">1 မယ်ကို အသေထားပြီး 2 မယ်နှင့်အထက်ကို လိုအပ်သလို သတ်မှတ်ပါ။</p></div>${btn('+ မယ် အသစ်ထည့်မယ်','editLaborMael51()','primary')}</div>
          ${table4(['အမည်','မယ်','အခြေအနေ','လုပ်ဆောင်ရန်'],maelRows)}
        </section>
       </div>`;
  };

  /* Make the pricing form wording match the fixed business definition. */
  const laborRow53Base=laborRowHtml;
  laborRowHtml=function(i){
    let html=laborRow53Base(i);
    html=html.replace('မယ်နှုန်း ရွေးပါ','မယ်နှုန်း ရွေးပါ (1 မယ် = တစ်ပိုင်းတစ်ခါကိုင်)');
    return html;
  };

  enforceFixedMael53();
  save();
  if(page==='setup'||document.getElementById('purchaseLaborRows'))render();
})();
