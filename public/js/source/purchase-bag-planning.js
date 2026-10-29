
/* V55 scoped purchase bag-count planning field + reorganization of existing form elements.
   No changes to purchase/sale posting functions, pricing basis, stock consumption, cash or permissions. */
(function(){
 'use strict';
 const beforeForm55=window.voucherForm4;
 const beforeRead55=window.readVoucherLines4;
 const beforeCalc55=window.calcVoucher4;
 const beforeCommit55=window.commitVoucher4;
 const beforeDetail55=window.receiptDetail4;
 const beforePrint55=window.printVoucher4;
 const round55=n=>Math.round(n*1000)/1000;
 const valid55=n=>Number.isFinite(n)&&n>0;
 function initial55(qty,size){return valid55(qty)&&valid55(size)?Math.floor((qty+0.000001)/size):0;}
 function purchaseInfo55(i){
   const sizeEl=document.getElementById('vPurchaseBag47'+i),countEl=document.getElementById('vPurchaseCount55'+i),qtyEl=document.getElementById('vq'+i);
   const info=document.getElementById('v55CountInfo'+i);
   if(!sizeEl||!countEl||!info||!qtyEl)return;
   const size=Number(sizeEl.value),count=Number(countEl.value),qty=Number(qtyEl.value);
   const countValid=countEl.value!==''&&Number.isInteger(count)&&count>0;
   let html='',invalid=false;
   if(!valid55(size)||!valid55(qty)){
      html='တစ်အိတ်ဝင်နှင့် လက်ခံထားသော စုစုပေါင်းပိဿာကို စစ်ဆေးပါ။';invalid=true;
   }else if(!countValid){
      html='ဝယ်ယူလိုသော အိတ်အရေအတွက်ကို ၁ အိတ်နှင့်အထက် ကိန်းပြည့်ဖြင့် ထည့်ပါ။';invalid=true;
   }else{
      const packed=round55(size*count),rem=round55(qty-packed);
      invalid=rem<-.001;
      html=`အိတ်အဖြစ် စီစဉ်ထားမှု — <strong>${N(count)} အိတ် × ${vissText37(size)} ပိဿာ = ${vissText37(packed)} ပိဿာ</strong><div>${invalid?'လက်ခံထားသော စုစုပေါင်းပိဿာထက် '+vissText37(-rem)+' ပိဿာ ပိုနေပါသည်။ အိတ်အရေအတွက် လျှော့ပါ။':'စီစဉ်ထားသော အိတ်ပမာဏအပြင် ကျန်ပိဿာ '+vissText37(Math.max(0,rem))+' ပိဿာ'} · ဈေးနှုန်းတွက်ချက်မှုသည် မူလလက်ခံပိဿာအတိုင်းသာ ဖြစ်ပါသည်။</div>`;
   }
   info.innerHTML=html;
   const oldHint=document.getElementById('v47BagInfo'+i);
   if(oldHint)oldHint.textContent='အိတ်အရေအတွက်သည် ဝယ်ယူလိုသော အိတ်အဖြစ် စီစဉ်မှုသာဖြစ်ပြီး Stock ထုပ်ပိုးမှု မဟုတ်ပါ။';
   info.classList.toggle('v55-alert',invalid);
   countEl.setCustomValidity(invalid?'ဝယ်ယူလိုသော အိတ်အရေအတွက်နှင့် ပိဿာကို စစ်ဆေးပါ။':'');
 }
 window.purchaseCountChanged55=function(i){
   const el=document.getElementById('vPurchaseCount55'+i);if(el)el.dataset.manuallyChanged55='1';
   calcVoucher4();
 };
 const oldBagChanged55=window.purchaseBagChanged47;
 window.purchaseBagChanged47=function(){
   if(v4Kind==='purchase'){
     document.querySelectorAll('#voucherLines4 .req-line').forEach(line=>{
       const i=line.dataset.i,bag=document.getElementById('vPurchaseBag47'+i),count=document.getElementById('vPurchaseCount55'+i),qty=document.getElementById('vq'+i);
       if(bag&&count&&qty&&count.dataset.manuallyChanged55!=='1'){
         const suggested=initial55(Number(qty.value),Number(bag.value));
         count.value=suggested>0?String(suggested):'';
       }
     });
   }
   if(typeof oldBagChanged55==='function')oldBagChanged55();
   else calcVoucher4();
 };
 function installCount55(rs){
   if(v4Kind!=='purchase')return;
   const lookup=new Map(rs.map(r=>[String(r.id),r]));
   document.querySelectorAll('#voucherLines4 .req-line').forEach(line=>{
     const i=line.dataset.i,r=lookup.get(String(line.dataset.rid));
     const region=line.querySelector('.v47-purchase-bag');
     if(!r||!region||document.getElementById('vPurchaseCount55'+i))return;
     const target=region.querySelector('.field-row'),std=region.querySelector('.v47-standard');
     if(!target)return;
     const size=Number(document.getElementById('vPurchaseBag47'+i)?.value)||0,oldCount=Number(r.purchaseBagCount55)||0;
     const count=oldCount>0?oldCount:initial55(Number(r.qty),size);
     const holder=document.createElement('div');holder.innerHTML=field('ဝယ်ယူလိုသော အိတ်အရေအတွက်','vPurchaseCount55'+i,{type:'number',min:1,step:1,value:count>0?count:'',required:true,suffix:'အိတ်',extra:`oninput="purchaseCountChanged55('${i}')"`,help:'ဝယ်ယူလိုသော တစ်အိတ်ဝင်ပိဿာနှင့် တွဲဖက်၍ ထည့်ပါ။ ကုန်လက်ခံအိတ်အရေအတွက်နှင့် သီးခြားမှတ်တမ်းဖြစ်သည်။'});
     const fieldNode=holder.firstElementChild;
     if(fieldNode)target.insertBefore(fieldNode,std||null);
     target.classList.add('v55-target-grid');
     region.insertAdjacentHTML('beforeend',`<div class="v55-count-state" id="v55CountInfo${i}" role="status" aria-live="polite"></div>`);
     const sizeLabel=document.getElementById('vPurchaseBag47'+i)?.closest('.field')?.querySelector('label');
     if(sizeLabel)sizeLabel.textContent='ဝယ်ယူလိုသော တစ်အိတ်ဝင် (ပိဿာ)';
     const oldLabel=line.querySelector('.pricing-raw-bags39 label');
     if(oldLabel)oldLabel.textContent='တကယ်လက်ခံထားသော အကြမ်းအိတ်အရေအတွက်';
   });
 }
 function makeBlock55(cls,title,sub,number){
   const div=document.createElement('section');div.className='v55-section '+cls;
   div.innerHTML=`<div class="v55-section-heading"><span class="v55-section-num">${number}</span><div><h2>${title}</h2><p>${sub}</p></div></div>`;
   return div;
 }
 function groupForm55(){
   const form=document.getElementById('voucher4');if(!form)return;
   const sale=v4Kind==='sale',nodes=[...form.children];
   const lines=nodes.indexOf(document.getElementById('voucherLines4'));
   const fee=nodes.findIndex(x=>x.matches('details.req-details'));
   const money=nodes.findIndex(x=>x.tagName==='H3'&&x.textContent.includes('ယခု'));
   const summary=nodes.indexOf(document.getElementById('voucherSummary4'));
   if(lines<0||fee<lines||money<fee||summary<money)return;
   const first=makeBlock55('v55-basics','အခြေခံအချက်အလက်','ဝယ်သူ / ကုန်သည်၊ ရက်စွဲနှင့် ဈေးတွက်နည်းကို ရွေးပါ။','01');
   const goods=makeBlock55('v55-goods','ကုန်ပစ္စည်းနှင့် အိတ်အရေအတွက်',sale?'မူလကုန်သည်၊ ဂိုဒေါင်၊ အသုတ်၊ အိတ်နှင့် အလေးချိန်ကို ဖြည့်ပါ။':'လက်ခံပိဿာ၊ ဝယ်ယူလိုသော တစ်အိတ်ဝင်နှင့် အိတ်အရေအတွက်ကို စစ်ဆေးပါ။','02');
   const fees=makeBlock55('v55-fees','ဝန်ဆောင်ခနှင့် နုတ်ငွေများ','ရှိပြီးသား နှုန်းထားနှင့် လုပ်သားခတွက်ချက်မှုအတိုင်း ဆက်လက်အသုံးပြုပါ။','03');
   const payment=makeBlock55('v55-payments',sale?'အရောင်းငွေလက်ခံခြင်း':'အဝယ်ငွေပေးချေခြင်း','ယခုငွေရှင်းပမာဏနှင့် ငွေသိမ်းရာ ခွဲသတ်မှတ်ပါ။','04');
   nodes.slice(0,lines).forEach(e=>first.appendChild(e));
   nodes.slice(lines,fee).forEach(e=>goods.appendChild(e));
   nodes.slice(fee,money).forEach(e=>fees.appendChild(e));
   nodes.slice(money,summary).forEach(e=>payment.appendChild(e));
   const summaryNode=nodes[summary];
   const intro=document.createElement('div');intro.className='v55-intro';
   intro.innerHTML=`<div><strong>${sale?'အရောင်းစာရင်းအသစ်':'ဈေးဖြတ်ပြီး ဝယ်ယူမည့်စာရင်း'}</strong><p>${sale?'ကုန်ပစ္စည်းနှင့် Batch ကို ရွေးပြီး ပမာဏ၊ ဈေးနှုန်း၊ ငွေရှင်းမှုကို စစ်ဆေးပါ။':'ကုန်လက်ခံထားသော ပိဿာကို မပြောင်းဘဲ အိတ်ဖွဲ့ရန် စီစဉ်သည့် အချက်အလက်များကို သီးခြားသိမ်းပါမည်။'}</p></div><span class="v55-intro-label">${sale?'အရောင်း':'အဝယ်'} · Voucher</span>`;
   const layout=document.createElement('div');layout.className='v55-layout';
   const main=document.createElement('div');main.className='v55-main';
   main.append(first,goods,fees,payment);
   const side=document.createElement('aside');side.className='v55-side';
   side.innerHTML=`<div class="v55-aside-head"><strong>${sale?'အရောင်း':'အဝယ်'} စာရင်းအနှစ်ချုပ်</strong><small>ဈေးနှုန်း/နုတ်ငွေပြောင်းလျှင် Auto ပြန်တွက်ပါမည်။</small></div>`;
   side.appendChild(summaryNode);
   side.insertAdjacentHTML('beforeend',`<div class="v55-aside-foot">${sale?'အိတ်အရေအတွက်၊ တစ်အိတ်ဝင်နှင့် စုစုပေါင်းပိဿာကို မသိမ်းခင် ပြန်စစ်ပါ။':'ဝယ်ယူလိုသော အိတ်အရေအတွက်သည် ဈေးတွက်ရန် ကုန်ပိဿာ သို့မဟုတ် စံအိတ်ဝင်ကို မပြောင်းပါ။'}</div>`);
   layout.append(main,side);form.append(intro,layout);
   form.classList.add('v55-voucher',sale?'v55-sale':'v55-purchase');
   const page=form.closest('.work-page');if(page)page.classList.add('v55-voucher-page');
   if(sale){
     form.querySelectorAll('input[id^="vbag43"]').forEach(el=>{
       const label=el.closest('.field')?.querySelector('label');if(label)label.textContent='အရောင်းအိတ်အရေအတွက်';
     });
     const existing=form.querySelector('#saleStockSource60 .field-help');
     if(existing)existing.style.marginTop='10px';
   }
 }
 voucherForm4=function(records){
   beforeForm55(records);
   if(!['purchase','sale'].includes(v4Kind))return;
   installCount55(records);
   groupForm55();
   calcVoucher4();
 };
 readVoucherLines4=function(){
   const rows=beforeRead55();
   if(v4Kind==='purchase')for(const r of rows){
     const el=document.getElementById('vPurchaseCount55'+r.i);
     r.purchaseBagCount55=el&&el.value!==''?Number(el.value):NaN;
   }
   return rows;
 };
 calcVoucher4=function(){
   beforeCalc55();
   if(v4Kind!=='purchase')return;
   document.querySelectorAll('#voucherLines4 .req-line').forEach(el=>purchaseInfo55(el.dataset.i));
 };
 commitVoucher4=function(){
   if(v4Kind!=='purchase')return beforeCommit55();
   const rows=readVoucherLines4();
   if(rows.some(x=>!Number.isInteger(x.purchaseBagCount55)||x.purchaseBagCount55<=0))return error('ဝယ်ယူလိုသော အိတ်အရေအတွက်ကို ၁ အိတ်နှင့်အထက် ကိန်းပြည့်ဖြင့် ထည့်ပါ။');
   if(rows.some(x=>!(x.purchaseBagViss47>0)||x.purchaseBagCount55*x.purchaseBagViss47>x.qty+.001))return error('ဝယ်ယူလိုသော အိတ်အရေအတွက် × တစ်အိတ်ဝင်သည် ကုန်လက်ခံထားသော စုစုပေါင်းပိဿာထက် မပိုရပါ။');
   const snapshots=rows.map(x=>({id:x.r?.id,count:x.purchaseBagCount55}));
   const had=snapshots.map(x=>state.receipts.find(r=>r.id===x.id)?.status);
   const result=beforeCommit55();
   let changed=false;
   snapshots.forEach((x,index)=>{
     const r=state.receipts.find(r=>r.id===x.id);
     if(r&&had[index]!=='purchased'&&r.status==='purchased'){r.purchaseBagCount55=x.count;changed=true;}
   });
   if(changed){save();}
   return result;
 };
 receiptDetail4=function(id){
   beforeDetail55(id);
   const rs=voucherRecords4('purchase',id).filter(r=>Number.isInteger(r.purchaseBagCount55)&&r.purchaseBagCount55>0);
   if(!rs.length)return;
   const body=document.querySelector('.work-page .modal-body')||document.querySelector('#modalRoot .modal-body');if(!body)return;
   const info=document.createElement('section');info.className='summary-box mt';
   info.innerHTML=`<h3 style="margin:0 0 12px">ဝယ်ယူလိုသော အိတ်အရေအတွက်</h3>`+rs.map(r=>`<div class="summary-line"><span>${E(r.product)} · ${vissText37(r.purchaseBagViss47||0)} ပိဿာဝင် × ${N(r.purchaseBagCount55)} အိတ်</span><strong>${vissText37(round55((r.purchaseBagViss47||0)*r.purchaseBagCount55))} ပိဿာ</strong></div>`).join('')+`<p class="field-help">အဝယ်မူလပိဿာနှင့် ဈေးတွက်နည်း မပြောင်းလဲပါ။</p>`;
   body.appendChild(info);
 };
 printVoucher4=function(kind,id){
   const rs=kind==='purchase'?voucherRecords4('purchase',id):[];
   if(kind!=='purchase'||!rs.some(r=>r.purchaseBagCount55>0))return beforePrint55(kind,id);
   const first=rs[0];if(!first)return beforePrint55(kind,id);
   // Preserve the V47 printed purchase totals, original bags, and actual received bags.
   const lines=table4(['ကုန်','ပိဿာ','မူလ အကြမ်းအိတ်','တကယ်လက်ခံအိတ်','ကုန်ဖိုး'],rs.map(r=>`<tr><td>${E(r.product)}</td><td>${vissText37(r.qty)}</td><td>${r.bagType==='raw'?N(r.rawBags??r.bags??0):r.bagType==='finished'?N(r.packageCount??r.bags??0):'&mdash;'}</td><td>${r.bagType==='raw'?N(r.priceBags??r.rawBags??r.bags??0):r.bagType==='finished'?N(r.packageCount??r.bags??0):'&mdash;'}</td><td>${cashText(gross(r))}</td></tr>`));
   const detail='<h3 style="margin-top:17px">အဝယ် တစ်အိတ်ဝင်နှင့် အိတ်အရေအတွက်</h3>'+rs.map(r=>`<p>${E(r.product)} — တစ်အိတ်ဝင် ${vissText37(r.purchaseBagViss47||0)} ပိဿာ · ဝယ်ယူလိုသော ${N(r.purchaseBagCount55||0)} အိတ် · ${r.priceBasis==='standard_bag'?'တစ်စံအိတ်ဈေး ('+vissText37(r.standardBagViss47||productStandard(r.product))+' ပိဿာ စံအိတ်ဝင်)':'တစ်ပိဿာဈေး'} ${cashText(r.price)}</p>`).join('');
   const summary=(first.charges4?chargesSummary4(first.charges4).replaceAll('<details','<details open'):'')+
     row4('အသားတင် ပေးရန်',cashText(rs.reduce((n,r)=>n+purchaseNet(r),0)))+
     row4('ပေးရန်ကျန်',cashText(rs.reduce((n,r)=>n+due(r),0)));
   printDocument('အဝယ် / ဈေးဖြတ်ဘောက်ချာ',first.purchaseNo||first.voucherNo||first.no,`<p>${E(first.name)} · ${E(first.purchaseDate||first.date)}</p>${first.car?`<p>ကားနံပါတ် — ${E(first.car)}</p>`:''}${lines}${detail}${summary}`);
 };
 document.title='ပွဲရုံ · V55 Purchase Bag Count & Easy Forms';
})();
