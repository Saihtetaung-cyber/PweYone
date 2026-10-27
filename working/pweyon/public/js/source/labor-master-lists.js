
/* V5.5 — Mael first, rate second; each master is a full-width horizontal list. */
(function(){
  function laborList55(rows,emptyText){
    return rows.length?`<div class="labor-list-55">${rows.join('')}</div>`:`<div class="empty">${E(emptyText)}</div>`;
  }

  window.handlingPage=function(){
    enforceFixedMael53();

    const maelRows=state.laborMaelMasters51.slice().sort((a,b)=>Number(a.value)-Number(b.value)).map(m=>{
      const fixed=Number(m.value)===1;
      const status=fixed?'<span class="fixed-mael-53">အသေသတ်မှတ်ထား</span>':pill(m.active?'အသုံးပြုနေ':'ပိတ်ထား',m.active?'':'gray');
      const actions=fixed?'<span class="small muted">ပြင် / ဖျက် မရ</span>':`${smallbtn('ပြင်',`editLaborMael51('${m.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteLaborMael51('${m.id}')`,'danger')}`;
      return `<div class="labor-list-row-55">
        <div class="labor-list-main-55">
          <div class="labor-list-icon-55">မ</div>
          <div class="labor-list-copy-55">
            <strong>${E(m.name)}</strong>
            <div class="small muted">${fixed?'1 မယ် = တစ်ပိုင်း တစ်ခါကိုင် · အသေသတ်မှတ်ချက်':N(m.value)+' မယ်'}</div>
          </div>
        </div>
        <div class="labor-list-status-55">${status}</div>
        <div class="labor-list-actions-55">${actions}</div>
      </div>`;
    });

    const rateRows=(state.laborRateMasters51||[]).map(r=>`<div class="labor-list-row-55">
      <div class="labor-list-main-55">
        <div class="labor-list-icon-55">နှု</div>
        <div class="labor-list-copy-55">
          <strong>${E(r.name)}</strong>
          <div class="small muted">${cashText(r.rate)} / မယ်</div>
        </div>
      </div>
      <div class="labor-list-status-55">${pill(r.active?'အသုံးပြုနေ':'ပိတ်ထား',r.active?'':'gray')}</div>
      <div class="labor-list-actions-55">${smallbtn('ပြင်',`editLaborRate51('${r.id}')`,'secondary')}${smallbtn('ဖျက်',`deleteLaborRate51('${r.id}')`,'danger')}</div>
    </div>`);

    return setupBack()+heading('','လုပ်သားခနှုန်း','မယ်ကို အပေါ်တွင်၊ မယ်နှုန်းကို အောက်တွင် အလျားလိုက် Master List ပုံစံဖြင့် စီမံပါ။')+
      `<section class="card mb">${note('လုပ်သားခ = မယ်နှုန်း × မယ် × အိတ်အရေအတွက်။ 1 မယ် = တစ်ပိုင်း တစ်ခါကိုင် ဖြစ်ပြီး အသေသတ်မှတ်ထားသည်။','blue')}</section>
       <div class="labor-master-stack-55">
         <section class="card">
           <div class="card-title">
             <div><h3>မယ်</h3><p class="small muted mt">1 မယ်ကို အသေထားပြီး 2 မယ်နှင့်အထက်ကို လိုအပ်သလို သတ်မှတ်ပါ။</p></div>
             ${btn('+ မယ် အသစ်ထည့်မယ်','editLaborMael51()','primary')}
           </div>
           ${laborList55(maelRows,'မယ် သတ်မှတ်ချက် မရှိသေးပါ။')}
         </section>

         <section class="card">
           <div class="card-title">
             <div><h3>မယ်နှုန်း</h3><p class="small muted mt">1 မယ် (တစ်ပိုင်း တစ်ခါကိုင်) အတွက် ကျပ်နှုန်းကို သတ်မှတ်ပါ။</p></div>
             ${btn('+ မယ်နှုန်း အသစ်ထည့်မယ်','editLaborRate51()','primary')}
           </div>
           ${laborList55(rateRows,'မယ်နှုန်း မရှိသေးပါ။')}
         </section>
       </div>`;
  };

  if(page==='setup')render();
})();
