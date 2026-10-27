
/* V5.1.1 — Keep the secondary operations settings consistent with the new labor CRUD. */
(function(){
  if(typeof laborSettingsBase==='function'){
    settings4=function(){
      ensureLaborMasters51();
      return `<section class="card mb">
        <div class="row between wrap">
          <div><h3>လုပ်သားခနှုန်း</h3><p class="small muted mt">မယ်နှုန်းနှင့် မယ်ကို အခြေခံသတ်မှတ်ချက်ထဲတွင် CRUD လုပ်ပြီး ဈေးဖြတ်ဖောင်မှာ ပြန်ရွေးသုံးပါ။</p></div>
          ${btn('လုပ်သားခနှုန်း စီမံမယ်',"beginSetup('handling')",'secondary')}
        </div>
        <div class="mini-metrics mt">
          <div class="mini-metric"><div class="value">${state.laborRateMasters51.filter(x=>x.active).length}</div><div class="label">အသုံးပြုနေသော မယ်နှုန်း</div></div>
          <div class="mini-metric"><div class="value">${state.laborMaelMasters51.filter(x=>x.active).length}</div><div class="label">အသုံးပြုနေသော မယ်</div></div>
        </div>
      </section>`+laborSettingsBase();
    };
  }
  const setupView511Base=setupView;
  setupView=function(){
    let html=setupView511Base();
    if(setupSection==='overview'){
      ensureLaborMasters51();
      const oldSummary=state.masters.handling?.rate===null
        ?'နှုန်းထား မသတ်မှတ်ရသေး'
        :`${cashText(state.masters.handling.rate)} / တစ်ခါကိုင်`;
      html=html.replace(oldSummary,`${state.laborRateMasters51.filter(x=>x.active).length} မယ်နှုန်း · ${state.laborMaelMasters51.filter(x=>x.active).length} မယ်`);
    }
    return html;
  };
  const req10=coverage4?.find?.(r=>r[0]==='၁၀');
  if(req10)req10[2]='အဝယ်/အရောင်းတွင် မယ်နှုန်းနှင့် မယ်ကို Master CRUD ဖြင့် သတ်မှတ်ပြီး မယ်နှုန်း × မယ် × အိတ်အရေအတွက်ဖြင့် လုပ်သားခ Auto တွက်။';
})();
