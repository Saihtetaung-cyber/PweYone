
/* V49: scoped Packaging Setup CRUD. Keep package-batch ownership, pricing, cash and all other module flows intact. */
(function(){
  'use strict';
  // V60: Packaging setup can be maintained by Owner and Accountant (staff).
  // Do not broaden the global owner4() permissions (e.g. interest-bearing advances).
  const canManagePackaging60=()=>state.role==='owner'||state.role==='staff';
  const requirePackagingPermission60=()=>{
    if(canManagePackaging60())return true;
    toast('ထုပ်ပိုးပုံစံ သတ်မှတ်ချက်ကို ပြင်ဆင်ခွင့်မရှိပါ။',true);
    return false;
  };
  const priorSetup49=setupView;
  const priorPackOptions49=packOptions4;
  const packageUsed49=p=>{
    if(!p)return false;
    if(state.lots.some(l=>l.packType===p.id))return true;
    return state.packagingTransactions.some(t=>t.packType===p.id||
      (!t.packType&&t.product===p.product&&t.packName===p.name&&Math.abs(Number(t.packageViss)-Number(p.size))<.000001));
  };
  const packageProductExists49=name=>!!productBy(name);
  const enabledTypes49=()=>state.packTypes.filter(p=>p.active);
  window.packageSetup49=function(){
    const types=state.packTypes||[];
    const active=enabledTypes49().length;
    const productsForFilter=[...new Set(types.map(t=>t.product))].sort((a,b)=>a.localeCompare(b));
    return setupBack()+heading('','ထုပ်ပိုးပုံစံ သတ်မှတ်ချက်','ကုန်ပစ္စည်းအလိုက် ထုပ်ပိုးအိတ်အမည်နှင့် တစ်အိတ်ဝင်ပိဿာကို သတ်မှတ်ပြီး ထုပ်ပိုးမည် Form တွင် အသုံးပြုပါ။',canManagePackaging60()?btn('ထုပ်ပိုးပုံစံအသစ် ထည့်မယ်','editPackType4()','primary','plus'):'')+
      `<div id="packagingSetup49">
        <div class="pack49-summary">
          <div class="pack49-kpi"><span>သတ်မှတ်ထားသော ပုံစံ</span><strong>${N(types.length)}</strong></div>
          <div class="pack49-kpi"><span>အသုံးပြုနေ</span><strong>${N(active)}</strong></div>
          <div class="pack49-kpi"><span>ပိတ်ထား</span><strong>${N(types.length-active)}</strong></div>
        </div>
        <section class="card">
          <div class="row between wrap"><h3>ထုပ်ပိုးပုံစံများ</h3><span class="field-help">ပိုင်ရှင်နှင့် စာရေးမ ထည့် / ပြင် / ပိတ် / ဖျက်နိုင်ပါသည်။</span></div>
          <div class="pack49-toolbar">
            <div class="field"><label for="pack49Search">ရှာဖွေရန်</label><input id="pack49Search" type="search" placeholder="ထုပ်ပိုးပုံစံ သို့မဟုတ် ကုန်ပစ္စည်းရှာပါ" oninput="filterPackTypes49()"></div>
            <div class="field"><label for="pack49Product">ကုန်ပစ္စည်း</label><select id="pack49Product" onchange="filterPackTypes49()"><option value="">ကုန်အားလုံး</option>${productsForFilter.map(p=>`<option value="${E(p)}">${E(p)}</option>`).join('')}</select></div>
            <div class="field"><label for="pack49Status">Status</label><select id="pack49Status" onchange="filterPackTypes49()"><option value="">အားလုံး</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
          ${table4(['ကုန်ပစ္စည်း','ထုပ်ပိုးပုံစံ','တစ်အိတ်ဝင်','Status','လုပ်ဆောင်ရန်'],types.map(p=>`<tr class="pack49-record" data-product="${E(p.product)}" data-status="${p.active?'active':'inactive'}">
            <td><strong>${E(p.product)}</strong></td>
            <td><div class="pack49-name">${E(p.name)}</div>${packageUsed49(p)?'<div class="pack49-hint">ထုပ်ပိုးမှတ်တမ်းရှိ</div>':''}</td>
            <td>${vissText37(p.size)} ${E(p.unit||'ပိဿာ')}</td>
            <td>${pill(p.active?'Active':'Inactive',p.active?'':'gray')}</td>
            <td><div class="pack49-actions">${canManagePackaging60()?
              smallbtn('ပြင်မယ်',`editPackType4('${p.id}')`,'secondary')+
              smallbtn(p.active?'ပိတ်မယ်':'ဖွင့်မယ်',`togglePackType49('${p.id}')`,'ghost')+
              (packageUsed49(p)?'<span class="field-help" title="အသုံးပြုပြီးသောပုံစံကို မဖျက်နိုင်ပါ">ဖျက်မရ</span>':smallbtn('ဖျက်မယ်',`confirmPackDelete49('${p.id}')`,'danger')):
              '<span class="field-help">ကြည့်ရှုရန်သာ</span>'}</div></td>
          </tr>`))}
          <p id="pack49NoResults" class="field-help pack49-hidden" role="status" style="margin-top:13px">ရှာဖွေမှုနှင့် ကိုက်ညီသော ထုပ်ပိုးပုံစံ မရှိပါ။</p>
          <div class="pack49-steps">ထုပ်ပိုးပြီးမှ ပုံစံကို ပြင်လျှင် အဟောင်း Stock နှင့် မှတ်တမ်းတွင် မူလ တစ်အိတ်ဝင်ကို ဆက်လက်သိမ်းထားပါမည်။ အသုံးပြုပြီးသားပုံစံကို ဖျက်မရပါ၊ Inactive ပြုလုပ်နိုင်ပါသည်။</div>
        </section>
      </div>`;
  };
  window.filterPackTypes49=function(){
    const root=document.getElementById('packagingSetup49');if(!root)return;
    const query=value('pack49Search').toLowerCase(),product=value('pack49Product'),status=value('pack49Status');
    let shown=0;
    root.querySelectorAll('.pack49-record').forEach(row=>{
      const matching=(!query||row.textContent.toLowerCase().includes(query))&&
        (!product||row.dataset.product===product)&&(!status||row.dataset.status===status);
      row.hidden=!matching;if(matching)shown++;
    });
    root.querySelector('#pack49NoResults')?.classList.toggle('pack49-hidden',shown>0);
  };
  setupView=function(){
    if(setupSection==='packaging49')return packageSetup49();
    let html=priorSetup49();
    if(setupSection!=='overview'&&setupSection!=='additional38')return html;
    const tpl=document.createElement('template');tpl.innerHTML=html;
    if(setupSection==='overview'){
      const grid=tpl.content.querySelector('.v3-master-grid');
      if(grid){
        const interestCard=[...grid.querySelectorAll('button')].find(b=>b.getAttribute('onclick')==="beginSetup('additional38')");
        if(interestCard){
          const headline=interestCard.querySelector('strong');if(headline)headline.textContent='ကြိုထုတ်ငွေ အတိုးမူဝါဒ';
          const desc=interestCard.querySelector('p');if(desc)desc.textContent='ကုန်သည်အတွက် ကြိုထုတ်ငွေ အတိုးသတ်မှတ်ချက်';
          const sub=interestCard.querySelector('.v3-card-bottom > span');if(sub)sub.textContent='အတိုးသတ်မှတ်ချက်';
        }
        const button=document.createElement('button');button.type='button';button.className='v2-records-card v3-master-card';button.setAttribute('onclick',"beginSetup('packaging49')");
        button.innerHTML=`<span class="icon-box">${I('stock')}</span><strong>ထုပ်ပိုးပုံစံ သတ်မှတ်ချက်</strong><p>ကုန်အလိုက် တစ်အိတ်ဝင် ပိဿာနှင့် ထုပ်ပိုးပုံစံ CRUD</p><div class="v3-card-bottom"><span>${N(enabledTypes49().length)} ပုံစံ Active</span><span class="end-link">စီမံမယ် ${I('arrow')}</span></div>`;
        if(interestCard)grid.insertBefore(button,interestCard);else grid.appendChild(button);
      }
    }else{
      // V48 used one combined advanced page. Retain interest policy in its original location,
      // and move only Packaging Setup into its own Settings entry.
      const headings=[...tpl.content.querySelectorAll('h1,h2')];
      const pageHeading=headings.find(h=>h.textContent.includes('ထုပ်ပိုးပုံစံနှင့် အတိုးမူဝါဒ'));
      if(pageHeading)pageHeading.textContent='ကြိုထုတ်ငွေ အတိုးမူဝါဒ';
      const section=[...tpl.content.querySelectorAll('section')].find(s=>s.querySelector('h3')?.textContent.includes('ထုပ်ပိုးပုံစံ'));
      if(section)section.remove();
    }
    return [...tpl.content.childNodes].map(n=>n.outerHTML||n.textContent).join('');
  };
  editPackType4=function(id=''){
    if(!requirePackagingPermission60())return;
    const item=state.packTypes.find(p=>p.id===id);if(id&&!item)return toast('ထုပ်ပိုးပုံစံ မရှိတော့ပါ။',true);
    const used=item&&packageUsed49(item);
    const opts=pOpts();if(item&&!opts.some(([v])=>v===item.product))opts.unshift([item.product,item.product]);
    const product=selectField('ကုန်ပစ္စည်း','ptProduct',opts,item?.product||opts[0]?.[0]||'')+
      (used?`<p class="field-help" style="margin-top:-12px">ထုပ်ပိုးမှတ်တမ်းရှိပြီးဖြစ်လို့ ကုန်ပစ္စည်းကို ပြောင်း၍မရပါ။</p>`:'');
    const body=`<form id="packTypeForm4" onsubmit="event.preventDefault();savePackType4('${id}')">
      ${product}
      ${field('ထုပ်ပိုးပုံစံအမည်','ptName',{value:item?.name||'',required:true,placeholder:'ဥပမာ - 30 ပိဿာအိတ်'})}
      <div class="field-row">
        ${num4('တစ်အိတ်ဝင်','ptSize',item?.size??'',.001)}
        ${field('Unit','ptUnit',{value:'ပိဿာ',readonly:true})}
      </div>
      ${selectField('Status','ptActive',[['yes','Active — အသုံးပြုနေ'],['no','Inactive — ပိတ်ထား']],item?.active===false?'no':'yes')}
      ${note('တစ်အိတ်ဝင်ကို ဤနေရာတွင် သတ်မှတ်ပြီး ထုပ်ပိုးမည် Form တွင် Auto အသုံးပြုပါမည်။ ယခင်ထုပ်ပိုးမှတ်တမ်း၏ တစ်အိတ်ဝင်ကို မပြောင်းပါ။','blue')}
    </form>`;
    openModal(item?'ထုပ်ပိုးပုံစံ ပြင်မယ်':'ထုပ်ပိုးပုံစံအသစ် ထည့်မယ်', 'Settings → ထုပ်ပိုးပုံစံ သတ်မှတ်ချက်',body,
      btn('မလုပ်တော့ပါ','closeModal()','secondary')+btn(item?'ပြင်ဆင်သိမ်းမယ်':'အသစ်သိမ်းမယ်',`savePackType4('${id}')`,'primary','check'));
    if(used){const select=document.getElementById('ptProduct');if(select)select.disabled=true;}
  };
  savePackType4=function(id=''){
    if(!requirePackagingPermission60()||!validForm('packTypeForm4'))return;
    const current=state.packTypes.find(p=>p.id===id);
    if(id&&!current)return error('ထုပ်ပိုးပုံစံ ရှာမတွေ့ပါ။');
    const product=current&&packageUsed49(current)?current.product:value('ptProduct');
    const name=value('ptName').trim(),size=number('ptSize'),active=value('ptActive')==='yes';
    if(!packageProductExists49(product))return error('ကုန်ပစ္စည်းကို မှန်ကန်စွာ ရွေးပါ။');
    if(!safeLabel(name))return error('အမည်ကို ၁ လုံးမှ ၆၀ လုံးအတွင်း မှန်ကန်စွာထည့်ပါ။');
    if(!Number.isFinite(size)||size<=0||Math.abs(size*1000-Math.round(size*1000))>1e-7)
      return error('တစ်အိတ်ဝင်ကို ၀ ထက်ကြီးသော ပိဿာပမာဏဖြင့် ထည့်ပါ။ (ဒဿမ ၃ လုံးအထိ)');
    if(state.packTypes.some(p=>p.id!==id&&p.product===product&&p.name.trim().toLowerCase()===name.toLowerCase()))
      return error('ဤကုန်ပစ္စည်းအတွက် ထုပ်ပိုးပုံစံအမည် တူပြီးသား ရှိပါသည်။');
    if(current){
      // Backfill links for pre-V49 records before allowing the name/size to change.
      for(const transaction of state.packagingTransactions){
        if(!transaction.packType&&transaction.product===current.product&&transaction.packName===current.name&&
           Math.abs(Number(transaction.packageViss)-Number(current.size))<.000001)
          transaction.packType=current.id;
      }
      Object.assign(current,{product,name,size,unit:'ပိဿာ',active});
    }else state.packTypes.push({id:uid('PT'),product,name,size,unit:'ပိဿာ',active});
    audit4(`${name} ထုပ်ပိုးပုံစံ ${current?'ပြင်ဆင်':'အသစ်ထည့်'}ခဲ့သည်။`);
    save();closeModal();setupSection='packaging49';page='setup';render();
    toast('ထုပ်ပိုးပုံစံ သိမ်းဆည်းပြီးပါပြီ။');
  };
  window.togglePackType49=function(id){
    if(!requirePackagingPermission60())return;
    const p=state.packTypes.find(p=>p.id===id);if(!p)return toast('ထုပ်ပိုးပုံစံ ရှာမတွေ့ပါ။',true);
    p.active=!p.active;audit4(`${p.name} ထုပ်ပိုးပုံစံ ${p.active?'Active':'Inactive'} ပြောင်းခဲ့သည်။`);
    save();render();toast(p.active?'ထုပ်ပိုးပုံစံ အသုံးပြုနိုင်ပါပြီ။':'ထုပ်ပိုးပုံစံ ပိတ်ထားပြီးပါပြီ။');
  };
  window.confirmPackDelete49=function(id){
    if(!requirePackagingPermission60())return;
    const p=state.packTypes.find(p=>p.id===id);if(!p)return toast('ထုပ်ပိုးပုံစံ ရှာမတွေ့ပါ။',true);
    if(packageUsed49(p))return toast('အသုံးပြုပြီးသားပုံစံကို မဖျက်နိုင်ပါ။ Inactive ပြောင်းပါ။',true);
    openModal('ထုပ်ပိုးပုံစံ ဖျက်မည်','အသုံးမပြုရသေးသော Master Data ကိုသာ ဖျက်နိုင်သည်။',
      `<div class="summary-box">${row4('ကုန်ပစ္စည်း',E(p.product))}${row4('ထုပ်ပိုးပုံစံ',E(p.name))}${row4('တစ်အိတ်ဝင်',vissText37(p.size)+' ပိဿာ')}</div>${note('ဖျက်ပြီးလျှင် ဤပုံစံကို ထုပ်ပိုးမှုအသစ်တွင် ရွေးလို့မရတော့ပါ။','amber')}`,
      btn('မဖျက်တော့ပါ','closeModal()','secondary')+btn('ဖျက်မယ်',`deletePackType49('${p.id}')`,'danger'));
  };
  window.deletePackType49=function(id){
    if(!requirePackagingPermission60())return;
    const i=state.packTypes.findIndex(p=>p.id===id);if(i<0)return error('ထုပ်ပိုးပုံစံ ရှာမတွေ့ပါ။');
    const p=state.packTypes[i];if(packageUsed49(p))return error('ထုပ်ပိုးမှတ်တမ်းရှိပြီးသားပုံစံကို မဖျက်နိုင်ပါ။ Inactive ပြောင်းပါ။');
    state.packTypes.splice(i,1);audit4(`${p.name} အသုံးမပြုရသေးသော ထုပ်ပိုးပုံစံ ဖျက်ခဲ့သည်။`);
    save();closeModal();setupSection='packaging49';page='setup';render();toast('အသုံးမပြုရသေးသော ထုပ်ပိုးပုံစံ ဖျက်ပြီးပါပြီ။');
  };
  packOptions4=function(){
    priorPackOptions49();
    const wrap=document.getElementById('pkTypeWrap');if(!wrap)return;
    wrap.insertAdjacentHTML('beforeend',`<div class="pack49-setup-link"><span>Settings မှ Active ဖြစ်သော ထုပ်ပိုးပုံစံများကိုသာ ပြသထားသည်။</span>${canManagePackaging60()?`<button type="button" class="btn-link" onclick="closeModal();beginSetup('packaging49')">ထုပ်ပိုးပုံစံ သတ်မှတ်ချက် →</button>`:''}</div>`);
  };
  document.title='ပွဲရုံ · V49 Packaging Setup CRUD';
})();
