
/* V6.1 — Warehouse master CRUD inside Main Settings. */
(function(){
  function warehouseCurrentQty61(id){
    return (state.lots||[]).filter(l=>l.warehouse===id).reduce((n,l)=>n+(Number(l.qty)||0),0);
  }
  function warehouseHasUnknownStock61(id){
    return (state.lots||[]).some(l=>l.warehouse===id && l.weightKnown===false);
  }
  function warehouseRefs61(id){
    const lots=(state.lots||[]).filter(l=>l.warehouse===id).length;
    const receipts=(state.receipts||[]).filter(r=>r.warehouse===id).length;
    const sales=(state.sales||[]).filter(s=>s.warehouse===id).length;
    const transfers=(state.transfers||[]).filter(t=>t.from===id||t.to===id).length;
    return {lots,receipts,sales,transfers,total:lots+receipts+sales+transfers};
  }
  function warehouseActiveCount61(){
    return (state.warehouses||[]).filter(w=>w.active!==false).length;
  }
  function warehouseSetupPage61(){
    const rows=(state.warehouses||[]).map(w=>{
      const qty=warehouseCurrentQty61(w.id), unknown=warehouseHasUnknownStock61(w.id), refs=warehouseRefs61(w.id);
      const stockText=unknown?'အလေးချိန်မသိသေးသောကုန်ရှိ':`${vissText37(qty)} ပိဿာ လက်ကျန်`;
      const historyText=`မှတ်တမ်း ${refs.total} ခု`;
      return `<div class="v3-partner-row warehouse-master-row61">
        <span class="icon-box">${I('stock')}</span>
        <div class="grow">
          <strong>${E(w.name)}</strong>
          <div class="record-meta">${w.active!==false?'အသုံးပြုနေသည်':'အသုံးမပြုတော့ပါ'} · ${stockText} · ${historyText}</div>
        </div>
        ${pill(w.active!==false?'အသုံးပြုနေ':'ပိတ်ထား',w.active!==false?'':'gray')}
        <div class="row warehouse-master-actions61">
          ${btn('ပြင်မယ်',`openWarehouseMaster61('${w.id}')`,'secondary','edit')}
          ${btn('ဖျက်မယ်',`deleteWarehouseMaster61('${w.id}')`,'danger')}
        </div>
      </div>`;
    }).join('');
    return setupBack()+heading('','ဂိုထောင်များ','ကုန်လက်ခံ၊ အရောင်း၊ ကုန်အသုတ်နှင့် ဂိုထောင်ပြောင်းရွှေ့မှုများတွင် ပြန်ရွေးသုံးမည့် ဂိုထောင် Master စာရင်း။',btn('ဂိုထောင်အသစ် ထည့်မယ်','openWarehouseMaster61()','primary','plus'))+
      `${note('အသုံးပြုနေသော ဂိုထောင်များသည် ကုန်လက်ခံမည်နှင့် အရောင်းဖောင်တို့၏ ဂိုထောင် Dropdown တွင် အလိုအလျောက် ပေါ်လာမည်။ လက်ကျန်ကုန်ရှိသော ဂိုထောင်ကို ပိတ်၍မရပါ။ မှတ်တမ်းအသုံးပြုပြီးသော ဂိုထောင်ကို Data integrity အတွက် ဖျက်မရဘဲ “ပိတ်ထား” သာလုပ်နိုင်သည်။','blue')}
       <div class="v2-list mt">${rows||empty('ဂိုထောင် မရှိသေးပါ။','stock')}</div>`;
  }

  window.openWarehouseMaster61=function(id=''){
    const w=(state.warehouses||[]).find(x=>x.id===id);
    const qty=w?warehouseCurrentQty61(id):0, unknown=w?warehouseHasUnknownStock61(id):false;
    const refs=w?warehouseRefs61(id):{total:0};
    const statusHelp=w?`လက်ရှိ ${unknown?'အလေးချိန်မသိသေးသောကုန်ရှိသည်':vissText37(qty)+' ပိဿာ'} · မှတ်တမ်း ${refs.total} ခု`:'အသစ်ဖန်တီးပြီးလျှင် နေ့စဉ်ဖောင်များတွင် ချက်ချင်းရွေးသုံးနိုင်သည်။';
    openModal(w?'ဂိုထောင် ပြင်မယ်':'ဂိုထောင်အသစ် ထည့်မယ်','ဂိုထောင်အမည်နှင့် အသုံးပြုမှုအခြေအနေကို စီမံပါ။',
      `<form id="warehouseMasterForm61" onsubmit="event.preventDefault();saveWarehouseMaster61('${id}')">
        ${field('ဂိုထောင်အမည်','wmName61',{value:w?.name||'',required:true,placeholder:'ဥပမာ — ပင်မဂိုထောင်',extra:'maxlength="80"'})}
        ${w?selectField('အခြေအနေ','wmActive61',[['yes','အသုံးပြုမည်'],['no','ပိတ်ထားမည်']],w.active===false?'no':'yes'):''}
      </form><p class="field-help mt">${E(statusHelp)}</p>`,
      btn('မပြင်တော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveWarehouseMaster61('${id}')`,'primary','check'));
  };

  window.saveWarehouseMaster61=function(id=''){
    if(!validForm('warehouseMasterForm61'))return;
    const name=cleanText(value('wmName61'));
    if(!safeLabel(name))return error('ဂိုထောင်အမည်ကို မှန်ကန်စွာ ထည့်ပါ။');
    if((state.warehouses||[]).some(w=>w.id!==id&&cleanText(w.name).toLowerCase()===name.toLowerCase()))return error('ဤဂိုထောင်အမည် ရှိပြီးသားဖြစ်ပါတယ်။');
    const w=(state.warehouses||[]).find(x=>x.id===id), before=w?JSON.parse(JSON.stringify(w)):null;
    const active=w?value('wmActive61')!=='no':true;
    if(w && !active && w.active!==false){
      if(warehouseActiveCount61()<=1)return error('အနည်းဆုံး ဂိုထောင်တစ်ခုကို အသုံးပြုနေအဖြစ် ထားရပါမည်။');
      if(warehouseCurrentQty61(id)>0||warehouseHasUnknownStock61(id))return error('ကုန်လက်ကျန်ရှိသော ဂိုထောင်ကို ပိတ်၍မရပါ။ ကုန်ကို အခြားဂိုထောင်သို့ အရင်ပြောင်းရွှေ့ပါ။');
    }
    if(w){
      Object.assign(w,{name,active});
    }else{
      state.warehouses??=[];
      state.warehouses.push({id:uid('W'),name,active:true});
    }
    const saved=w||(state.warehouses||[]).at(-1);
    if(typeof masterLog==='function')masterLog('warehouse',saved.id,before,saved);
    if(typeof audit4==='function')audit4(name+' ဂိုထောင်သတ်မှတ်ချက် သိမ်းခဲ့သည်။');
    save();closeModal();setupSection='warehouses';page='setup';render();toast('ဂိုထောင် သတ်မှတ်ချက် သိမ်းပြီးပါပြီ။');
  };

  window.deleteWarehouseMaster61=function(id){
    const w=(state.warehouses||[]).find(x=>x.id===id);if(!w)return;
    const refs=warehouseRefs61(id);
    if(refs.total>0||warehouseCurrentQty61(id)>0||warehouseHasUnknownStock61(id))return error('ဤဂိုထောင်ကို စာရင်းမှတ်တမ်းများတွင် အသုံးပြုပြီးဖြစ်သောကြောင့် ဖျက်၍မရပါ။ လက်ကျန်မရှိပါက “ပိတ်ထား” အဖြစ် ပြောင်းပါ။');
    if(w.active!==false&&warehouseActiveCount61()<=1)return error('အနည်းဆုံး ဂိုထောင်တစ်ခု လိုအပ်သောကြောင့် မဖျက်နိုင်ပါ။');
    if(!confirm('“'+w.name+'” ဂိုထောင်ကို အပြီးဖျက်မလား။'))return;
    state.warehouses=state.warehouses.filter(x=>x.id!==id);
    if(typeof masterLog==='function')masterLog('warehouse',id,w,null);
    save();setupSection='warehouses';page='setup';render();toast('ဂိုထောင် ဖျက်ပြီးပါပြီ။');
  };

  const setupView61Base=setupView;
  setupView=function(){
    if(setupSection==='warehouses')return warehouseSetupPage61();
    let html=setupView61Base();
    if(setupSection!=='overview')return html;
    const active=(state.warehouses||[]).filter(w=>w.active!==false).length;
    const total=(state.warehouses||[]).length;
    const card=`<button class="v2-records-card v3-master-card" onclick="beginSetup('warehouses')"><span class="icon-box">${I('stock')}</span><strong>ဂိုထောင်များ</strong><p>ကုန်လက်ခံ၊ အရောင်းနှင့် အသုတ်များအတွက် ဂိုထောင် Master</p><div class="v3-card-bottom"><span>${active} / ${total} နေရာ အသုံးပြုနေသည်</span><span class="end-link">ပြင်ဆင်မယ် ${I('arrow')}</span></div></button>`;
    return html.replace('</div><div class="v3-rule-strip">',card+'</div><div class="v3-rule-strip">');
  };
})();
