
/* V6.3 — မှတ်စုစာအုပ်: သတ်မှတ်ချက်အောက်တွင် CRUD */
(function(){
  function ensureNotebook63(){
    if(!state.masters) return;
    if(!Array.isArray(state.masters.notes)) state.masters.notes=[];
  }
  ensureNotebook63();

  function noteDate63(n){return n.date||today();}
  function notePreview63(s){
    const t=String(s||'').replace(/\s+/g,' ').trim();
    return t.length>110?t.slice(0,110)+'…':t;
  }
  function noteTime63(){
    try{return new Date().toLocaleString('en-GB',{timeZone:'Asia/Rangoon'});}
    catch(e){return new Date().toLocaleString();}
  }

  function notebookPage63(){
    ensureNotebook63();
    const notes=[...state.masters.notes].sort((a,b)=>{
      const d=(b.date||'').localeCompare(a.date||'');
      return d || String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));
    });
    const rows=notes.map(n=>`<div class="v3-partner-row notebook-row63">
      <span class="icon-box">${I('note')}</span>
      <div class="grow">
        <strong>${E(n.title||'ခေါင်းစဉ်မရှိ')}</strong>
        <div class="notebook-meta63"><span>${shortDate(noteDate63(n))}</span>${n.updatedAt?`<span>နောက်ဆုံးပြင် ${E(n.updatedAt)}</span>`:''}</div>
        <div class="note-preview63">${E(notePreview63(n.body))||'—'}</div>
      </div>
      <div class="row notebook-actions63">
        ${btn('ကြည့်မယ်',`viewNotebook63('${n.id}')`,'secondary','eye')}
        ${btn('ပြင်မယ်',`openNotebook63('${n.id}')`,'secondary','edit')}
        ${btn('ဖျက်မယ်',`deleteNotebook63('${n.id}')`,'danger')}
      </div>
    </div>`).join('');
    return setupBack()+
      heading('','မှတ်စုစာအုပ်','လုပ်ငန်းဆိုင်ရာ မှတ်စုများကို စာရင်းအဖြစ် သိမ်း၊ ကြည့်၊ ပြင်၊ ဖျက်နိုင်သည်။',btn('မှတ်စုအသစ် ထည့်မယ်','openNotebook63()','primary','plus'))+
      `${note('မှတ်စုစာအုပ်သည် ငွေစာရင်း၊ ကုန်စာရင်း သို့မဟုတ် ပေးရန် / ရရန် လက်ကျန်များကို မပြောင်းလဲပါ။ ကိုယ်ပိုင်မှတ်စုအဖြစ်သာ သိမ်းထားသည်။','blue')}
       <div class="v2-list mt">${rows||empty('မှတ်စု မရှိသေးပါ။','note')}</div>`;
  }

  window.openNotebook63=function(id=''){
    ensureNotebook63();
    const n=state.masters.notes.find(x=>x.id===id);
    openModal(n?'မှတ်စု ပြင်မယ်':'မှတ်စုအသစ် ထည့်မယ်',
      'ခေါင်းစဉ်၊ ရက်စွဲနှင့် အကြောင်းအရာကို သိမ်းထားနိုင်သည်။',
      `<form id="notebookForm63" onsubmit="event.preventDefault();saveNotebook63('${id}')">
        ${field('ခေါင်းစဉ်','noteTitle63',{value:n?.title||'',required:true,placeholder:'ဥပမာ — မနက်ဖြန် ငွေရှင်းရန်',extra:'maxlength="120"'})}
        ${field('ရက်စွဲ','noteDate63',{type:'date',value:n?.date||today(),required:true})}
        <div class="field"><label for="noteBody63">မှတ်စုအကြောင်းအရာ <span class="req">*</span></label>
          <textarea id="noteBody63" required maxlength="3000" placeholder="လိုအပ်သည့်အချက်များကို ရေးပါ။">${E(n?.body||'')}</textarea>
          <div class="field-help">ငွေ၊ ကုန်၊ ကြိုသုံးစာရင်းတို့နှင့် မချိတ်ဆက်ဘဲ မှတ်စုသဘောဖြင့်သာ သိမ်းမည်။</div>
        </div>
      </form>`,
      btn('မပြင်တော့ပါ','closeModal()','secondary')+btn('သိမ်းမယ်',`saveNotebook63('${id}')`,'primary','check'));
  };

  window.saveNotebook63=function(id=''){
    if(!validForm('notebookForm63'))return;
    ensureNotebook63();
    const title=cleanText(value('noteTitle63'));
    const date=value('noteDate63');
    const body=String(value('noteBody63')||'').trim();
    if(!title)return error('မှတ်စုခေါင်းစဉ် ထည့်ပါ။');
    if(!date)return error('ရက်စွဲ ရွေးပါ။');
    if(!body)return error('မှတ်စုအကြောင်းအရာ ထည့်ပါ။');
    const existing=state.masters.notes.find(x=>x.id===id);
    const before=existing?JSON.parse(JSON.stringify(existing)):null;
    const now=noteTime63();
    const n=existing||{id:uid('N'),createdAt:now};
    Object.assign(n,{title,date,body,updatedAt:now});
    if(!existing)state.masters.notes.push(n);
    if(typeof masterLog==='function')masterLog('notebook',n.id,before,n);
    save();closeModal();setupSection='notebook';page='setup';render();toast('မှတ်စု သိမ်းပြီးပါပြီ။');
  };

  window.viewNotebook63=function(id){
    ensureNotebook63();
    const n=state.masters.notes.find(x=>x.id===id);if(!n)return;
    openModal('မှတ်စု အသေးစိတ်',shortDate(noteDate63(n)),
      `<div class="summary-box mb">
        <div class="summary-line"><span>ခေါင်းစဉ်</span><strong>${E(n.title)}</strong></div>
        <div class="summary-line"><span>ရက်စွဲ</span><strong>${shortDate(noteDate63(n))}</strong></div>
      </div>
      <div class="notebook-view63">${E(n.body)}</div>
      ${n.updatedAt?`<p class="field-help mt">နောက်ဆုံးပြင်ဆင်ချိန် — ${E(n.updatedAt)}</p>`:''}`,
      btn('ပြန်မယ်','closeModal()','secondary')+btn('ပြင်မယ်',`closeModal();setTimeout(()=>openNotebook63('${n.id}'),0)`,'primary','edit'));
  };

  window.deleteNotebook63=function(id){
    ensureNotebook63();
    const n=state.masters.notes.find(x=>x.id===id);if(!n)return;
    if(!confirm('“'+n.title+'” မှတ်စုကို အပြီးဖျက်မလား။'))return;
    state.masters.notes=state.masters.notes.filter(x=>x.id!==id);
    if(typeof masterLog==='function')masterLog('notebook',id,n,null);
    save();setupSection='notebook';page='setup';render();toast('မှတ်စု ဖျက်ပြီးပါပြီ။');
  };

  const setupView63Base=setupView;
  setupView=function(){
    ensureNotebook63();
    if(setupSection==='notebook')return notebookPage63();
    let html=setupView63Base();
    if(setupSection!=='overview')return html;
    const total=state.masters.notes.length;
    const card=`<button class="v2-records-card v3-master-card" onclick="beginSetup('notebook')">
      <span class="icon-box">${I('note')}</span>
      <strong>မှတ်စုစာအုပ်</strong>
      <p>လုပ်ငန်းဆိုင်ရာ မှတ်စုများကို CRUD စီမံမယ်</p>
      <div class="v3-card-bottom"><span>${total} မှတ်စု</span><span class="end-link">ဖွင့်မယ် ${I('arrow')}</span></div>
    </button>`;
    return html.replace('</div><div class="v3-rule-strip">',card+'</div><div class="v3-rule-strip">');
  };
})();
