
/* V64: Scoped Ground Check Tab, append-only immutable history and lot-specific approval.
 * The V63 purchase, sales, packaging, bag calculations, roles and accounting remain intact.
 * An approved adjustment changes only the selected lot; no aggregate group is guessed. */
(function(){
 'use strict';
 const stockPage63=inventoryPage;
 const stockBody63=renderInventoryBody;
 const WEIGHT_TOL=0.00001;
 const id64=v=>String(v??'');
 const in64=(a,b)=>Math.abs((Number(a)||0)-(Number(b)||0))<WEIGHT_TOL;
 const pretty64=n=>vissText37(Number(n)||0);
 const group64=l=>l?.product+'|'+l?.grade;
 const visible64=()=>state.lots.filter(l=>l&&l.id&&l.weightKnown!==false&&Number.isFinite(Number(l.qty))&&Number(l.qty)>=0);
 const reviewable64=()=>Array.isArray(state.groundHistory64)?state.groundHistory64:[];
 const wh64=l=>state.warehouses?.find(w=>w.id===l?.warehouse)?.name||l?.warehouse||'မူလဂိုဒေါင်';
 const owner64=l=>({owned:'ပွဲရုံပိုင်',supplier:'ကုန်သည်ပိုင်',customer:'ဝယ်သူပိုင်'})[l?.owner]||'မသိ';
 const physicalBag64=l=>{
   if(!l)return null;
   const x=l.stockForm==='packaged'?l.packageCount??l.bags:l.actualBags;
   return x!==undefined&&x!==null&&x!==''&&Number.isInteger(Number(x))&&Number(x)>=0?Number(x):null;
 };
 const qty64=l=>Math.round(Number(l?.qty||0)*100)/100;
 function view64(){
   const all=reviewable64().slice().reverse();
   const pending=all.filter(x=>x.status==='pending').length;
   const approved=all.filter(x=>x.status==='approved').length;
   const done=all.filter(x=>x.status==='matched').length;
   const items=all.map(g=>{
     const live=state.lots.find(l=>l.id===g.lotId);
     const current=live?qty64(live):null;
     const stale=g.status==='pending'&&(!live||!in64(current,g.expectedQty)||physicalBag64(live)!==g.expectedBags);
     const label={pending:'စစ်ဆေးရန်',approved:'အတည်ပြုပြီး',matched:'ကိုက်ညီ',rejected:'ပယ်ချပြီး'}[g.status]||g.status;
     const action=g.status==='pending'&&state.role==='owner'?
       `<div class="v64-actions">${smallbtn('စစ်ဆေး / အတည်ပြု',`pweReviewGround64('${g.id}')`,'secondary','check')}${smallbtn('ပယ်ချမယ်',`pweRejectGround64('${g.id}')`,'ghost')}</div>`:
       (g.status==='pending'?'<span class="v64-muted">ပိုင်ရှင် အတည်ပြုရန်</span>':'—');
     return `<tr><td><strong>${E(g.id)}</strong><div class="sub">${shortDate(g.date)} · ${E(g.time||'')}</div></td>`+
       `<td><strong>${E(g.product)}</strong><div class="sub">${E(g.batch||'အဟောင်းအသုတ်')} · ${E(g.warehouseName)}</div><div class="sub">${E(g.ownerName)} · ${E(g.personName)}</div></td>`+
       `<td>${pretty64(g.expectedQty)} → <strong>${pretty64(g.qty)}</strong> ပိဿာ<div class="sub">${g.expectedBags===null?'အိတ်စာရင်းမရှိ':N(g.expectedBags)+' အိတ်'} → ${g.bags===null?'မရေတွက်ထား':N(g.bags)+' အိတ်'}</div></td>`+
       `<td>${pretty64(g.difference)} ပိဿာ${g.bagDifference===null?'':`<div class="sub">အိတ် ${N(g.bagDifference)}</div>`}</td>`+
       `<td><span class="v64-status ${E(g.status)}">${label}</span>${stale?'<div class="v64-stale">အသုတ်လက်ကျန် ပြောင်းထားပြီး</div>':''}<div class="sub">${E(g.note)||'—'}</div>${g.decisionNote?`<div class="sub">ဆုံးဖြတ်ချက် — ${E(g.decisionNote)}</div>`:''}</td><td>${action}</td></tr>`;
   });
   const old=[];
   Object.entries(state.grounds||{}).forEach(([key,g])=>old.push({key,g,date:g.date}));
   (state.days||[]).forEach(day=>Object.entries(day.grounds||{}).forEach(([key,g])=>old.push({key,g,date:g.date||day.date})));
   const legacy=old.length?`<details class="details mt"><summary>ယခင်စနစ် မြေပြင်စစ်ချက်များ (${old.length})</summary><div class="table-wrap mt"><table><thead><tr><th>ရက် / ကုန်</th><th>စစ်ချိန်စာရင်း</th><th>တကယ်ရှိ</th><th>မှတ်ချက်</th></tr></thead><tbody>${old.slice().reverse().map(x=>`<tr><td>${E(x.key.replace('|',' · '))}<div class="sub">${shortDate(x.date)}</div></td><td>${pretty64(x.g.expectedQty)} ပိဿာ</td><td>${pretty64(x.g.qty)} ပိဿာ</td><td>${E(x.g.note||'—')}</td></tr>`).join('')}</tbody></table></div><p class="v64-muted">ယခင်စစ်ချက်များသည် ကုန်/အဆင့် စုစုပေါင်းဖြစ်၍ အသုတ်တစ်ခုသို့ အလိုအလျောက် Stock မချိန်ညှိပါ။</p></details>`:'';
   return `<div class="v64-ground"><div class="v64-controls"><div><h3>မြေပြင်စစ်ချက်နှင့် အတည်ပြုမှု</h3><p class="v64-muted">ဂိုဒေါင် · အသုတ် · ပိုင်ဆိုင်မှုအလိုက် သီးခြားစစ်ဆေးပါ။ စစ်ချက်သိမ်းချိန် Stock မပြင်ပါ။</p></div>${btn('မြေပြင်စစ်ချက် အသစ်','pweOpenGround64()','primary','plus')}</div>`+
     `<div class="v64-metrics"><div class="v64-metric"><span>အတည်ပြုရန်</span><strong>${pending}</strong></div><div class="v64-metric"><span>Stock ချိန်ညှိအတည်ပြုပြီး</span><strong>${approved}</strong></div><div class="v64-metric"><span>စစ်ချက်ကိုက်ညီ</span><strong>${done}</strong></div></div>`+
     `<div class="v64-history"><h3>မြေပြင်စစ်ချက် History</h3>${all.length?table4(['စစ်ချက် / ရက်','ကုန် / အသုတ် / ပိုင်ရှင်','စာရင်း → မြေပြင်','ကွာဟချက်','Status / မှတ်ချက်','လုပ်ဆောင်ရန်'],items):empty('စစ်ချက် မရှိသေးပါ။','scale')}${legacy}</div>`+
     `<p class="v64-note">${note('Stock ကွာဟချက်ကို ပိုင်ရှင် အတည်ပြုပြီးမှ သက်ဆိုင်ရာအသုတ်တစ်ခုတည်းမှာ ချိန်ညှိမည်။ အိတ်ပုံစံနှင့် အလေးချိန် မကိုက်သော စစ်ချက်ကို အလိုအလျောက် ချိန်ညှိမပေးပါ။','blue')}</p></div>`;
 }
 inventoryPage=function(){
   let html=stockPage63();
   html=html.replace(/(<div class="clean-tabs tabs">[\s\S]*?)(<\/div>)/,
     (all,tabs,end)=>tabs+`<button type="button" class="tab ${invTab==='ground'?'active':''}" onclick="invTab='ground';render()">မြေပြင်စစ်ချက်</button>`+end);
   return html;
 };
 renderInventoryBody=function(){
   if(invTab==='ground'){
     const el=document.getElementById('inventoryBody');if(el)el.innerHTML=view64();
     return;
   }
   return stockBody63();
 };
 window.pweOpenGround64=function(){
   if(!guardWork())return;
   const lots=visible64().sort((a,b)=>Number(b.qty)-Number(a.qty));
   if(!lots.length)return toast('စစ်ဆေးရန် Stock အသုတ် မရှိသေးပါ။',true);
   const opts=lots.map(l=>[l.id,`${l.product} · ${l.batch||l.id} · ${wh64(l)} · ${owner64(l)} · ${pretty64(l.qty)} ပိဿာ`]);
   openModal('မြေပြင်စစ်ချက် မှတ်မယ်','အသုတ်တစ်ခုချင်း ရွေးပြီး တကယ်ရှိသောပိဿာနှင့် အိတ်ကို ရေတွက်မှတ်ပါ။',
     `<form id="groundForm64" onsubmit="event.preventDefault();pweSaveGround64()">${selectField('ကုန် / အသုတ် / ဂိုဒေါင်','gLot64',opts,opts[0][0],'onchange="pweGroundPreview64(true)"')}`+
     `<div id="gExpected64" class="summary-box mb"></div><div class="field-row">`+
     `${field('မြေပြင်ရှိ အလေးချိန်','gWeight64',{type:'number',min:0,step:.01,required:true,suffix:'ပိဿာ',extra:'oninput="pweGroundPreview64(false)"'})}`+
     `${field('တကယ်ရေတွက်ထားသော အိတ်','gBags64',{type:'number',min:0,step:1,suffix:'အိတ်',extra:'oninput="pweGroundPreview64(false)"',help:'အိတ်တကယ်ရေတွက်ထားမှ ဖြည့်ပါ။ ပိဿာအချိုးမှ အိတ်မတွက်ပါ။'})}</div>`+
     `<div id="gPreview64" class="mb" aria-live="polite"></div>`+
     `${field('စစ်ဆေးချက် / ကွာဟချက် အကြောင်းပြချက်','gNote64',{placeholder:'ကွာဟချက်ရှိလျှင် မဖြစ်မနေ ရေးပါ',extra:'maxlength="300"'})}</form>`+
     note('Save လုပ်ရုံဖြင့် Stock မပြင်ပါ။ စစ်ချက်ကွာဟပါက ပိုင်ရှင်က စစ်ပြီး အတည်ပြုမှ အသုတ်လက်ကျန် ပြောင်းမည်။','blue'),
     btn('ပိတ်မယ်','closeModal()','secondary')+btn('စစ်ချက် သိမ်းမယ်','pweSaveGround64()','primary','check'),true);
   window.pweGroundPreview64(true);
 };
 window.pweGroundPreview64=function(reinit=false){
   const l=state.lots.find(x=>x.id===value('gLot64'));
   const view=document.getElementById('gPreview64'),expected=document.getElementById('gExpected64');
   if(!l||!view||!expected)return;
   const count=physicalBag64(l);
   if(reinit){document.getElementById('gWeight64').value=qty64(l).toFixed(2);document.getElementById('gBags64').value=count===null?'':String(count);}
   expected.innerHTML=row4('စာရင်းအရ အလေးချိန်',`${pretty64(l.qty)} ပိဿာ`)+row4('စာရင်းအရ တကယ်ရှိအိတ်',count===null?'သီးခြားမသိ':' '+N(count)+' အိတ်')+
     `<p class="field-help">${E(l.product)} · ${E(l.batch||l.id)} · ${E(wh64(l))} · ${E(owner64(l))} · ${E(l.name||'')}</p>`;
   const weight=number('gWeight64'),bagText=value('gBags64'),bags=bagText===''?null:Number(bagText);
   if(!Number.isFinite(weight)||weight<0){view.innerHTML=note('မြေပြင်အလေးချိန် ထည့်ပါ။','amber');return;}
   const diff=Math.round((weight-qty64(l))*100)/100;
   view.innerHTML=`<div class="summary-box"><div class="summary-line"><span>အလေးချိန် ကွာဟချက်</span><strong>${pretty64(diff)} ပိဿာ</strong></div><div class="summary-line"><span>အိတ်ကွာဟချက်</span><strong>${count===null||bags===null?'မနှိုင်းယှဉ်ထား':N(bags-count)+' အိတ်'}</strong></div></div>`;
 };
 window.pweSaveGround64=function(){
   if(!guardWork()||!validForm('groundForm64'))return;
   const l=state.lots.find(x=>x.id===value('gLot64'));
   if(!l)return error('ကုန်အသုတ်ကို ပြန်ရွေးပါ။');
   const raw=value('gWeight64'),qty=Number(raw),bagRaw=value('gBags64'),bags=bagRaw===''?null:Number(bagRaw),expectedBags=physicalBag64(l),noteText=value('gNote64');
   if(!/^(?:\d+)(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(qty)||qty<0||bags!==null&&(!Number.isInteger(bags)||bags<0))return error('ပိဿာကို ဒဿမနှစ်နေရာအထိ၊ အိတ်ကို ကိန်းပြည့်ဖြင့် မှန်ကန်စွာ ထည့်ပါ။');
   const expectedQty=qty64(l),difference=Math.round((qty-expectedQty)*100)/100,bagDifference=expectedBags===null||bags===null?null:bags-expectedBags;
   const mismatch=!in64(difference,0)||bagDifference!==null&&bagDifference!==0;
   if(mismatch&&!noteText)return error('ကွာဟချက်ရှိသဖြင့် အကြောင်းပြချက် ထည့်ပါ။');
   state.groundHistory64??=[];
   const id=uid('GC'),record={id,seq:state.counter,date:today(),time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
     role:state.role,lotId:l.id,product:l.product,grade:l.grade,batch:l.batch||l.id,warehouse:l.warehouse,warehouseName:wh64(l),owner:l.owner,ownerName:owner64(l),personName:l.name||'',
     stockForm:l.stockForm,packageViss:Number(l.packageViss)||0,qty,expectedQty,bags,expectedBags,difference,bagDifference,note:noteText,status:mismatch?'pending':'matched'};
   state.groundHistory64.push(record);
   activity(`${l.product} · ${l.batch||l.id} မြေပြင်စစ်ချက် ${id} သိမ်းခဲ့သည်။`);
   save();closeModal();invTab='ground';page='inventory';render();toast(mismatch?'စစ်ချက် သိမ်းပြီးပါပြီ။ ပိုင်ရှင် အတည်ပြုရန် စောင့်နေသည်။':'စစ်ချက် သိမ်းပြီးပါပြီ။ ကွာဟချက်မရှိပါ။');
 };
 function canReview64(g){
   const l=state.lots.find(x=>x.id===g.lotId);
   if(!l)return {why:'ရွေးထားသောအသုတ် ပျောက်နေပါသည်။ Stock ကို မပြင်ပါ။'};
   if(g.status!=='pending')return {why:'ဤစစ်ချက်သည် အတည်ပြုရန် Pending မဟုတ်တော့ပါ။'};
   if(!in64(l.qty,g.expectedQty)||physicalBag64(l)!==g.expectedBags)return {why:'စစ်ချက်မှတ်ပြီးနောက် အသုတ်လက်ကျန်/အိတ် ပြောင်းထားပါသည်။ အသစ်ပြန်စစ်ပြီးမှ အတည်ပြုပါ။'};
   if(reviewable64().some(x=>x.lotId===g.lotId&&x.status==='approved'&&x.seq>g.seq))return {why:'နောက်ပိုင်း စစ်ချက်တစ်ခု အတည်ပြုပြီးသားဖြစ်ပါသည်။'};
   if(l.stockForm==='packaged'){
     const size=Number(l.packageViss)||0;
     if(!(size>0)||g.bags===null||!Number.isInteger(g.bags)||!in64(size*g.bags,g.qty))return {why:'ထုပ်ပိုးအိတ်အရေအတွက်နှင့် တစ်အိတ်ဝင်ပိဿာ မကိုက်ညီပါ။ ထုပ်ပိုး Flow ကို မပြောင်းဘဲ အလိုအလျောက် Stock ချိန်ညှိမရပါ။ မှန်ကန်သော စစ်ချက်ပြန်တင်ပါ သို့မဟုတ် သီးခြားပြန်လည်စစ်ဆေးပါ။'};
   }
   return {lot:l};
 }
 window.pweReviewGround64=function(id){
   if(state.role!=='owner')return toast('ပိုင်ရှင်သာ အတည်ပြုခွင့်ရှိပါသည်။',true);
   const g=reviewable64().find(x=>x.id===id);if(!g)return toast('စစ်ချက် မတွေ့ပါ။',true);
   const review=canReview64(g),blocked=!!review.why;
   openModal('မြေပြင်စစ်ချက် အတည်ပြုမယ်','အသုတ်တစ်ခုတည်း၏ လက်ကျန်ကိုသာ ချိန်ညှိမည်။',
     `<div class="summary-box">${row4('စစ်ချက်',E(g.id))}${row4('ကုန် / အသုတ်',E(g.product+' / '+g.batch))}${row4('ဂိုဒေါင် / ပိုင်ဆိုင်မှု',E(g.warehouseName+' / '+g.ownerName))}`+
     `${row4('လက်ရှိ စာရင်း',pretty64(g.expectedQty)+' ပိဿာ')}${row4('မြေပြင်စစ်ချက်',pretty64(g.qty)+' ပိဿာ')}${row4('ကွာဟချက်',pretty64(g.difference)+' ပိဿာ')}`+
     `${row4('အိတ်ရေတွက်ချက်',g.bags===null?'မရေတွက်ထား':N(g.bags)+' အိတ်')}</div>`+
     `${blocked?note(E(review.why),'amber'):`<label class="v64-confirm"><input id="gApprove64" type="checkbox"><span>အချက်အလက်ကို စစ်ဆေးပြီးဖြစ်ကြောင်း၊ အသုတ်တစ်ခုတည်း၏ Stock ပြင်ခြင်းကို အတည်ပြုပါသည်။</span></label>`}`,
     btn('မလုပ်သေးပါ','closeModal()','secondary')+(blocked?'':btn('အတည်ပြုပြီး Stock ချိန်ညှိမယ်',`pweApproveGround64('${id}')`,'primary','check')),true);
 };
 window.pweApproveGround64=function(id){
   if(state.role!=='owner')return error('ပိုင်ရှင်သာ အတည်ပြုနိုင်ပါသည်။');
   if(!guardWork())return;
   const g=reviewable64().find(x=>x.id===id);if(!g)return error('စစ်ချက် မတွေ့ပါ။');
   if(!document.getElementById('gApprove64')?.checked)return error('Stock ချိန်ညှိရန် အတည်ပြုချက်ကို ရွေးပါ။');
   const decision=canReview64(g);if(decision.why)return error(decision.why);
   const l=decision.lot,delta=Math.round((g.qty-g.expectedQty)*100)/100;
   // Do not alter packaging standards or generic bag calculations. Packaged lots
   // change their literal package count only if size * count matches actual weight.
   if(l.stockForm==='packaged'){
     l.packageCount=g.bags;l.bags=g.bags;l.actualBags=g.bags;
   }else if(g.bags!==null){l.actualBags=g.bags;}
   l.qty=g.qty;
   if(!in64(delta,0)){
     const direction=delta>0?'increase':'decrease',amount=Math.abs(delta);
     state.adjustments??=[];
     state.adjustments.push({id:uid('ADJ'),date:today(),product:l.product,direction,qty:amount,reason:`မြေပြင်စစ်ချက် ${g.id} · ${g.note}`,
       groundCheckId:g.id,lotId:l.id,warehouse:l.warehouse,batch:l.batch,owner:l.owner});
     dateMove(l.product,amount,delta>0?'in':'out',`Ground Check ${g.id}`,today(),'ground-check');
   }
   g.status='approved';g.approvedDate=today();g.approvedRole=state.role;g.afterQty=l.qty;g.afterBags=physicalBag64(l);
   activity(`မြေပြင်စစ်ချက် ${g.id} အတည်ပြုပြီး ${l.product} · ${l.batch||l.id} Stock ချိန်ညှိခဲ့သည်။`);
   save();closeModal();invTab='ground';page='inventory';render();toast('အသုတ်တစ်ခုတည်း၏ Stock ချိန်ညှိပြီးပါပြီ။ History နှင့် Adjustment မှတ်တမ်းသိမ်းထားပါသည်။');
 };
 window.pweRejectGround64=function(id){
   if(state.role!=='owner')return toast('ပိုင်ရှင်သာ ပယ်ချနိုင်ပါသည်။',true);
   const g=reviewable64().find(x=>x.id===id);if(!g||g.status!=='pending')return toast('ပယ်ချရန် Pending စစ်ချက် မတွေ့ပါ။',true);
   openModal('မြေပြင်စစ်ချက် ပယ်ချမယ်','ပယ်ချလျှင် Stock မပြောင်းပါ။ စစ်ချက် History ထဲမှာ ဆက်ရှိမည်။',
     `<div class="summary-box">${row4('စစ်ချက်',E(g.id))}${row4('ကုန် / အသုတ်',E(g.product+' / '+g.batch))}</div>`+
     `<div class="mt">${field('ပယ်ချသည့် အကြောင်းပြချက်','gRejectReason64',{required:true,placeholder:'ပြန်စစ်ရန် လိုအပ်သည့်အကြောင်း',extra:'maxlength="300"'})}</div>`,
     btn('ပြန်မယ်','closeModal()','secondary')+btn('ပယ်ချပြီး သိမ်းမယ်',`pweConfirmReject64('${id}')`,'primary','check'));
 };
 window.pweConfirmReject64=function(id){
   if(state.role!=='owner')return error('ပိုင်ရှင်သာ ပယ်ချနိုင်ပါသည်။');
   if(!guardWork())return;
   const g=reviewable64().find(x=>x.id===id),reason=value('gRejectReason64');
   if(!g||g.status!=='pending')return error('Pending စစ်ချက် မတွေ့ပါ။');
   if(!reason)return error('ပယ်ချသည့်အကြောင်းပြချက် ထည့်ပါ။');
   g.status='rejected';g.decisionNote=reason;g.decidedDate=today();g.approvedRole=state.role;
   activity(`မြေပြင်စစ်ချက် ${g.id} ပယ်ချခဲ့သည်။`);save();closeModal();invTab='ground';page='inventory';render();toast('စစ်ချက် ပယ်ချပြီးပါပြီ။ Stock မပြောင်းပါ။');
 };
})();
