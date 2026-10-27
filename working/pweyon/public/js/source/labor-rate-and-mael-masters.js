
/* V5.1 — Replace bag-size labor master with CRUD for Mael rate and Mael values. */
(function(){
  function ensureLaborMasters51(){
    if(!Array.isArray(state.laborRateMasters51)){
      const unique=[];
      (state.laborBagRates||[]).forEach(x=>{
        const rate=Number(x?.rate);
        if(Number.isFinite(rate)&&rate>=0&&!unique.includes(rate)) unique.push(rate);
      });
      if(!unique.length){
        const legacy=Number(state.masters?.handling?.rate);
        if(Number.isFinite(legacy)&&legacy>=0) unique.push(legacy);
      }
      state.laborRateMasters51=unique.map((rate,i)=>({
        id:'LR51-'+(i+1),
        name:'တစ်မယ် '+N(rate)+' ကျပ်',
        rate,
        active:true
      }));
    }
    if(!Array.isArray(state.laborMaelMasters51)){
      state.laborMaelMasters51=Array.from({length:8},(_,i)=>{
        const value=i+1;
        return {
          id:'LM51-'+value,
          value,
          name:value+' မယ်'+(value===1?' — ပုံခ':value===2?' — ပုံခ + ချခ':''),
          active:true
        };
      });
    }
    state.laborRateMasters51=state.laborRateMasters51.filter(x=>x&&Number.isFinite(Number(x.rate))).map(x=>({
      id:x.id||uid('LR'),
      name:cleanText(x.name||('တစ်မယ် '+N(Number(x.rate))+' ကျပ်')),
      rate:Number(x.rate),
      active:x.active!==false
    }));
    state.laborMaelMasters51=state.laborMaelMasters51.filter(x=>x&&Number.isFinite(Number(x.value))&&Number(x.value)>0).map(x=>({
      id:x.id||uid('LM'),
      value:Number(x.value),
      name:cleanText(x.name||N(Number(x.value))+' မယ်'),
      active:x.active!==false
    }));
  }

  window.ensureLaborMasters51=ensureLaborMasters51;

  function laborRate51(id){ensureLaborMasters51();return state.laborRateMasters51.find(x=>x.id===id);}
  function laborMael51(id){ensureLaborMasters51();return state.laborMaelMasters51.find(x=>x.id===id);}
  function activeLaborRates51(){ensureLaborMasters51();return state.laborRateMasters51.filter(x=>x.active);}
  function activeLaborMaels51(){ensureLaborMasters51();return state.laborMaelMasters51.filter(x=>x.active).sort((a,b)=>a.value-b.value);}

  window.editLaborRate51=function(id=''){
    ensureLaborMasters51();
    const r=laborRate51(id)||{id:'',name:'',rate:'',active:true};
    openModal(id?'မယ်နှုန်း ပြင်မယ်':'မယ်နှုန်း အသစ်ထည့်မယ်','လုပ်သားခတွက်ရာတွင် အသုံးပြုမည့် တစ်မယ်နှုန်းကို သတ်မှတ်ပါ။',
      `<form id="laborRateForm51" onsubmit="event.preventDefault();saveLaborRate51('${id}')">
        ${field('မယ်နှုန်းအမည်','laborRateName51',{value:r.name||'',placeholder:'ဥပမာ — ပုံမှန်နှုန်း',extra:'maxlength="60"'})}
        ${field('တစ်မယ်နှုန်း','laborRateValue51',{type:'number',min:0,step:1,value:r.rate??'',required:true,suffix:'ကျပ်',placeholder:'ဥပမာ 200'})}
        ${selectField('အခြေအနေ','laborRateActive51',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],r.active===false?'no':'yes')}
      </form>`,
      btn('မသိမ်းတော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveLaborRate51('${id}')`,'primary','check'));
  };

  window.saveLaborRate51=function(id=''){
    if(!validForm('laborRateForm51'))return;
    ensureLaborMasters51();
    const rate=Number(value('laborRateValue51'));
    let name=cleanText(value('laborRateName51'));
    const active=value('laborRateActive51')==='yes';
    if(!Number.isFinite(rate)||rate<0||!Number.isInteger(rate))return error('တစ်မယ်နှုန်းကို သုည သို့မဟုတ် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
    if(!name)name='တစ်မယ် '+N(rate)+' ကျပ်';
    if(!safeLabel(name))return error('မယ်နှုန်းအမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
    if(state.laborRateMasters51.some(x=>x.id!==id&&x.name===name&&x.rate===rate))return error('တူညီသော မယ်နှုန်း ရှိပြီးသားဖြစ်ပါတယ်။');
    const old=laborRate51(id);
    if(old)Object.assign(old,{name,rate,active});
    else state.laborRateMasters51.push({id:uid('LR'),name,rate,active});
    audit4('လုပ်သားခ မယ်နှုန်း '+name+' · '+cashText(rate)+' သတ်မှတ်ခဲ့သည်။');
    save();closeModal();render();toast('မယ်နှုန်း သိမ်းပြီးပါပြီ။');
  };

  window.deleteLaborRate51=function(id){
    ensureLaborMasters51();
    const r=laborRate51(id);if(!r)return;
    const used=[...state.receipts,...state.sales].some(x=>x.charges4?.laborRows?.some(row=>row.rateMasterId===id||row.masterId===id));
    if(!window.confirm(used?r.name+' ကို ယခင်စာရင်းတွင် သုံးထားပြီးဖြစ်၍ ပိတ်ထားမလား။':r.name+' ကို ဖျက်မလား။'))return;
    if(used)r.active=false;
    else state.laborRateMasters51=state.laborRateMasters51.filter(x=>x.id!==id);
    audit4('လုပ်သားခ မယ်နှုန်း '+r.name+' '+(used?'ပိတ်ထား':'ဖျက်')+'ခဲ့သည်။');
    save();render();
  };

  window.editLaborMael51=function(id=''){
    ensureLaborMasters51();
    const m=laborMael51(id)||{id:'',value:'',name:'',active:true};
    openModal(id?'မယ် ပြင်မယ်':'မယ် အသစ်ထည့်မယ်','လုပ်သားခတွက်ရာတွင် ရွေးချယ်အသုံးပြုမည့် မယ်ကို သတ်မှတ်ပါ။',
      `<form id="laborMaelForm51" onsubmit="event.preventDefault();saveLaborMael51('${id}')">
        ${field('မယ်','laborMaelValue51',{type:'number',min:1,step:1,value:m.value??'',required:true,suffix:'မယ်',placeholder:'ဥပမာ 4'})}
        ${field('ဖော်ပြမည့်အမည်','laborMaelName51',{value:m.name||'',placeholder:'ဥပမာ — 4 မယ်',extra:'maxlength="60"'})}
        ${selectField('အခြေအနေ','laborMaelActive51',[['yes','အသုံးပြုနေ'],['no','ပိတ်ထား']],m.active===false?'no':'yes')}
      </form>`,
      btn('မသိမ်းတော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveLaborMael51('${id}')`,'primary','check'));
  };

  window.saveLaborMael51=function(id=''){
    if(!validForm('laborMaelForm51'))return;
    ensureLaborMasters51();
    const mv=Number(value('laborMaelValue51'));
    let name=cleanText(value('laborMaelName51'));
    const active=value('laborMaelActive51')==='yes';
    if(!Number.isFinite(mv)||mv<=0||!Number.isInteger(mv))return error('မယ်ကို ၁ နှင့်အထက် အပေါင်းကိန်းပြည့်ဖြင့် ထည့်ပါ။');
    if(!name)name=N(mv)+' မယ်';
    if(!safeLabel(name))return error('မယ်အမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
    if(state.laborMaelMasters51.some(x=>x.id!==id&&(x.value===mv||x.name===name)))return error('ဤမယ် သတ်မှတ်ချက် ရှိပြီးသားဖြစ်ပါတယ်။');
    const old=laborMael51(id);
    if(old)Object.assign(old,{value:mv,name,active});
    else state.laborMaelMasters51.push({id:uid('LM'),value:mv,name,active});
    audit4('လုပ်သားခ '+name+' သတ်မှတ်ခဲ့သည်။');
    save();closeModal();render();toast('မယ် သတ်မှတ်ချက် သိမ်းပြီးပါပြီ။');
  };

  window.deleteLaborMael51=function(id){
    ensureLaborMasters51();
    const m=laborMael51(id);if(!m)return;
    const used=[...state.receipts,...state.sales].some(x=>x.charges4?.laborRows?.some(row=>row.maelId===id));
    if(!window.confirm(used?m.name+' ကို ယခင်စာရင်းတွင် သုံးထားပြီးဖြစ်၍ ပိတ်ထားမလား။':m.name+' ကို ဖျက်မလား။'))return;
    if(used)m.active=false;
    else state.laborMaelMasters51=state.laborMaelMasters51.filter(x=>x.id!==id);
    audit4('လုပ်သားခ '+m.name+' '+(used?'ပိတ်ထား':'ဖျက်')+'ခဲ့သည်။');
    save();render();
  };

  const handlingPage51Base=handlingPage;
  handlingPage=function(){
    ensureLaborMasters51();
    const rateRows=state.laborRateMasters51.map(r=>`<tr>
      <td><strong>${E(r.name)}</strong></td>
      <td>${cashText(r.rate)} / မယ်</td>
      <td>${pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')}</td>
      <td><div class="row wrap">${smallbtn('ပြင်',`editLaborRate51('${r.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteLaborRate51('${r.id}')`,'danger')}</div></td>
    </tr>`);
    const maelRows=state.laborMaelMasters51.slice().sort((a,b)=>a.value-b.value).map(m=>`<tr>
      <td><strong>${E(m.name)}</strong></td>
      <td>${N(m.value)} မယ်</td>
      <td>${pill(m.active?'အသုံးပြုနေ':'ပိတ်ထား',m.active?'':'gray')}</td>
      <td><div class="row wrap">${smallbtn('ပြင်',`editLaborMael51('${m.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteLaborMael51('${m.id}')`,'danger')}</div></td>
    </tr>`);
    return setupBack()+heading('','လုပ်သားခနှုန်း','မယ်နှုန်းနှင့် မယ်ကို CRUD ဖြင့် သတ်မှတ်ပြီး ဈေးဖြတ်ဝယ်ယူမည်ဖောင်တွင် ပြန်ရွေးသုံးပါ။')+
      `<section class="card mb">${note('လုပ်သားခ = မယ်နှုန်း × မယ် × အိတ်အရေအတွက်။ မယ်နှုန်းနှင့် မယ် နှစ်မျိုးလုံးကို ဒီနေရာမှာ Create / Edit / Delete / Active-Inactive လုပ်နိုင်ပါတယ်။','blue')}</section>
       <div class="labor-master-grid-51">
        <section class="card">
          <div class="card-title"><div><h3>မယ်နှုန်း</h3><p class="small muted mt">တစ်မယ်အတွက် ကျပ်နှုန်းကို သတ်မှတ်ပါ။</p></div>${btn('+ မယ်နှုန်း အသစ်ထည့်မယ်','editLaborRate51()','primary')}</div>
          ${rateRows.length?table4(['မယ်နှုန်း','တစ်မယ်နှုန်း','အခြေအနေ','လုပ်ဆောင်ရန်'],rateRows):`<div class="empty">မယ်နှုန်း မရှိသေးပါ။</div>`}
        </section>
        <section class="card">
          <div class="card-title"><div><h3>မယ်</h3><p class="small muted mt">ဈေးဖြတ်ဖောင်မှာ ရွေးချယ်မည့် မယ်စာရင်းကို သတ်မှတ်ပါ။</p></div>${btn('+ မယ် အသစ်ထည့်မယ်','editLaborMael51()','primary')}</div>
          ${maelRows.length?table4(['အမည်','မယ်','အခြေအနေ','လုပ်ဆောင်ရန်'],maelRows):`<div class="empty">မယ် သတ်မှတ်ချက် မရှိသေးပါ။</div>`}
        </section>
       </div>`;
  };

  window.laborRateOptions51=function(){
    return activeLaborRates51().map(r=>[r.id,`${r.name} · ${cashText(r.rate)} / မယ်`]);
  };
  window.laborMaelOptions51=function(){
    return activeLaborMaels51().map(m=>[m.id,m.name]);
  };

  laborRowHtml=function(i){
    ensureLaborMasters51();
    const rates=laborRateOptions51(),maels=laborMaelOptions51();
    const defaultRate=rates[0]?.[0]||'',defaultMael=maels[0]?.[0]||'';
    return `<section class="purchase-labor-row req-line" data-i="${i}">
      <div class="field-row">
        ${selectField('မယ်နှုန်း','laborSize'+i,[['','မယ်နှုန်း ရွေးပါ'],...rates],defaultRate,'onchange="calcVoucher4()"')}
        ${selectField('မယ်','laborMultiple'+i,[['','မယ် ရွေးပါ'],...maels],defaultMael,'onchange="calcVoucher4()"')}
      </div>
      ${field('အိတ်အရေအတွက်','laborBags'+i,{type:'number',min:0,step:1,value:0,extra:'oninput="calcVoucher4()"'})}
      <div id="laborCalculation${i}" class="summary-box" aria-live="polite"></div>
    </section>`;
  };

  purchaseLaborRows=function(){
    ensureLaborMasters51();
    return [...document.querySelectorAll('.purchase-labor-row')].map(el=>{
      const i=el.dataset.i;
      const rate=laborRate51(value('laborSize'+i));
      const mael=laborMael51(value('laborMultiple'+i));
      const bags=number('laborBags'+i);
      const multiple=mael?.value??0;
      const unitRate=rate&&mael?rate.rate*multiple:null;
      return {
        index:i,
        masterId:rate?.id||'',
        rateMasterId:rate?.id||'',
        maelId:mael?.id||'',
        name:rate?.name||'',
        weight:'',
        rate:rate?.rate??null,
        multiple,
        maelName:mael?.name||'',
        bags,
        unitRate,
        total:unitRate!==null?unitRate*bags:0,
        active:!!(rate?.active&&mael?.active)
      };
    });
  };

  refreshLaborMasters=function(){
    ensureLaborMasters51();
    document.querySelectorAll('.purchase-labor-row').forEach(el=>{
      const i=el.dataset.i;
      const rs=document.getElementById('laborSize'+i),ms=document.getElementById('laborMultiple'+i);
      if(rs){
        const selected=rs.value;
        rs.innerHTML='<option value="">မယ်နှုန်း ရွေးပါ</option>'+laborRateOptions51().map(([id,label])=>`<option value="${E(id)}" ${id===selected?'selected':''}>${E(label)}</option>`).join('');
      }
      if(ms){
        const selected=ms.value;
        ms.innerHTML='<option value="">မယ် ရွေးပါ</option>'+laborMaelOptions51().map(([id,label])=>`<option value="${E(id)}" ${id===selected?'selected':''}>${E(label)}</option>`).join('');
      }
    });
    if(document.getElementById('voucherSummary4'))calcVoucher4();
  };

  const calcVoucher51Base=calcVoucher4;
  calcVoucher4=function(){
    calcVoucher51Base();
    if(!document.getElementById('purchaseLaborRows'))return;
    purchaseLaborRows().forEach(r=>{
      const box=document.getElementById('laborCalculation'+r.index);if(!box)return;
      if(r.rate===null||!r.maelId){
        box.innerHTML=note('မယ်နှုန်းနှင့် မယ်ကို ရွေးပါ။','amber');
      }else{
        box.innerHTML=
          row4('မယ်နှုန်း',cashText(r.rate)+' / မယ်')+
          row4('ရွေးထားသည့်မယ်',E(r.maelName||N(r.multiple)+' မယ်'))+
          row4('တစ်အိတ်လုပ်သားခ',`${N(r.rate)} × ${N(r.multiple)} = ${cashText(r.unitRate)}`)+
          row4('စုစုပေါင်းလုပ်သားခ',`${N(r.unitRate)} × ${N(r.bags)} အိတ် = ${cashText(r.total)}`);
      }
    });
  };

  commitVoucher4=function(){
    if(v4Kind==='purchase'&&document.getElementById('purchaseLaborRows')){
      const rows=purchaseLaborRows();
      if(rows.some(r=>!Number.isInteger(r.bags)||r.bags<0||(r.bags>0&&(!r.active||r.rate===null||!r.maelId||!(r.multiple>0)))))
        return error('လုပ်သားခအတွက် မယ်နှုန်း၊ မယ်နှင့် အိတ်အရေအတွက်ကို ပြန်စစ်ပါ။');
    }
    return bagCommitBase();
  };

  const chargesSummary51Base=chargesSummary4;
  chargesSummary4=function(c){
    let html=chargesSummary51Base(c);
    html=html.replaceAll('အိတ်ဆိုဒ် / အလေးချိန်','မယ်နှုန်း')
             .replaceAll('အိတ်ဆိုဒ်','မယ်နှုန်း');
    return html;
  };

  const setupView51Base=setupView;
  setupView=function(){
    const html=setupView51Base();
    if(setupSection==='overview'){
      ensureLaborMasters51();
      return html.replace('တစ်ပိုင်း တစ်ခါကိုင်နှုန်း','မယ်နှုန်းနှင့် မယ် CRUD သတ်မှတ်ချက်');
    }
    return html;
  };

  ensureLaborMasters51();
  save();
  if(page==='setup'||document.getElementById('purchaseLaborRows'))render();
})();
