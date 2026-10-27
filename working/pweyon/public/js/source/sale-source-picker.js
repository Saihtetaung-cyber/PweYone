
/* V76: sales source selection only. Uses native lots, receipts and V73 receive/return. */
(function(){
 'use strict';
 const eligible=l=>l.owner==='supplier'&&Number.isFinite(Number(l.qty))&&Number(l.qty)>0&&l.weightKnown!==false;
 const supplierSale=()=>v4Kind==='sale'&&document.getElementById('voucher4')&&value('fSaleOwner60')==='supplier';
 const norm=s=>String(s??'').normalize('NFC').toLocaleLowerCase().replace(/[၀-၉]/g,c=>String('၀၁၂၃၄၅၆၇၈၉'.indexOf(c))).replace(/\s+/g,' ').trim();
 const receiptFor=(l,index)=>index?index.get(l.receiptId):(state.receipts||[]).find(r=>r.id===l.receiptId);
 const origin=(l,index)=>{const r=receiptFor(l,index),id=r?.partnerId||l.partnerId||l.originPartnerId||'',p=r?.name?null:supplierBy(id);return {id,name:r?.name||(p?supplierLabel(p):'')||l.originSupplierName||l.name||'ကုန်သည် မသိရသေး',no:r?.voucherNo||r?.no||l.originReceiptNo||l.batch||'',receipt:r};};
 function pending(){
  const groups=new Map(),receipts=new Map((state.receipts||[]).map(r=>[r.id,r]));
  for(const l of state.lots||[]){
   if(l.owner!=='supplier'||l.weightKnown!==false)continue;
   const r=receipts.get(l.receiptId);if(!r||r.status==='purchased')continue;
   const key=r.voucherNo||r.no||r.id;
   if(!groups.has(key))groups.set(key,{key,receipt:r,rows:[],lots:[]});
   const g=groups.get(key);if(!g.rows.some(x=>x.id===r.id))g.rows.push(r);g.lots.push(l);
  }
  return [...groups.values()].sort((a,b)=>String(b.receipt.date||'').localeCompare(String(a.receipt.date||''))||String(a.key).localeCompare(String(b.key),undefined,{numeric:true}));
 }
 const available=()=>(state.lots||[]).filter(eligible);
 const bm=(text,action,kind='secondary')=>'<button type="button" class="btn btn-'+kind+'" onclick="'+action+'">'+text+'</button>';
 function targetLine(i){
  if(i!==null&&i!==undefined&&document.querySelector('#voucherLines4 .req-line[data-i="'+Number(i)+'"]'))return String(Number(i));
  return [...document.querySelectorAll('#voucherLines4 .req-line')].find(el=>!value('vl'+el.dataset.i))?.dataset.i??null;
 }
 window.saleSourceSummary76=function(){
  if(!supplierSale())return;
  const form=document.getElementById('voucher4');form.classList.add('sale-source-mode76');
  let box=document.getElementById('saleSource73');if(!box){box=document.createElement('section');box.id='saleSource73';document.getElementById('voucherLines4').before(box);}
  const wait=pending(),ready=available(),draft=state.initialOpening69?.status==='draft'&&Object.entries(state.initialOpening69.parties||{}).some(([id,d])=>supplierBy(id)?.kind==='supplier'&&d.rows?.length);
  box.hidden=!!ready.length&&!wait.length&&!draft;box.className='sale-source73 sale-source76';
  const text=wait.length?'ပိဿာဖြည့်ရန် ကျန်သည့် ကုန်ဝင် '+N(wait.length)+' ခု':draft?'စတင်ကုန်လက်ကျန် အတည်ပြုရန် ကျန်ပါသည်။':'ရောင်းရန် ကုန်သည်ပိုင်ကုန် မရှိသေးပါ။';
  const help=wait.length?(ready.length?'ရောင်းရန် အသင့်ဖြစ်သောကုန်ကို အောက်တွင် ရွေးနိုင်ပါသည်။':'စာရင်းထဲမှ ကုန်ရွေးပြီး တကယ်ချိန်ရရှိသော ပိဿာကို ဖြည့်ပါ။'):draft?'ပိုင်ရှင် အတည်ပြုပြီးမှ ရောင်းနိုင်ပါမည်။':'ကုန်လက်ခံပြီးမှ အရောင်း ဆက်လုပ်နိုင်ပါမည်။';
  box.innerHTML='<div class="source-summary76"><div><strong>'+text+'</strong><p>'+help+'</p></div>'+(wait.length?bm('စာရင်းကြည့်ပြီး ပိဿာဖြည့်မယ်',"saleSourcePicker76('pending')",ready.length?'secondary':'primary'):draft?bm('စတင်လက်ကျန် ပြန်စစ်မယ်','saleSourceOpening73()'):bm('ကုန်သည်ပိုင်ကုန် လက်ခံမယ်','saleSourceReceive73()','primary'))+'</div>'+
   (wait.length||draft?'<details class="source-other76"><summary>အခြားလုပ်ဆောင်ချက်များ</summary><div>'+bm('ကုန်အသစ် လက်ခံမယ်','saleSourceReceive73()')+(draft&&wait.length?bm('စတင်လက်ကျန် ပြန်စစ်မယ်','saleSourceOpening73()'):'')+((state.lots||[]).some(l=>l.owner==='owned'&&Number(l.qty)>0&&l.weightKnown!==false)?bm('ပွဲရုံပိုင်ကုန် ရွေးမယ်','saleSourceOwned73()'):'')+'</div></details>':'');
  for(const line of document.querySelectorAll('#voucherLines4 .req-line')){
   let bar=line.querySelector('.sale-search76');if(!bar){bar=document.createElement('div');bar.className='sale-search76';line.querySelector('.field-row').before(bar);}
   bar.innerHTML=bm('ကုန်ရှာပြီး ရွေးမယ်',"saleSourcePicker76('ready',"+Number(line.dataset.i)+')','primary')+'<span>ကုန်သည်၊ ကုန်အမည် သို့မဟုတ် ဘောက်ချာနံပါတ်ဖြင့် ရှာပါ။</span>';
   bar.hidden=!ready.length;
   if(!line.querySelector('.sale-manual76')){
    const first=line.querySelector('[id^="vsp59"]')?.closest('.field-row'),second=line.querySelector('[id^="vsw59"]')?.closest('.field-row');
    if(first&&second){const detail=document.createElement('details');detail.className='sale-manual76';detail.innerHTML='<summary>အဆင့်လိုက် ကိုယ်တိုင်ရွေးမယ်</summary>';first.before(detail);detail.append(first,second);}
   }
   updateLine(line.dataset.i);
  }
 };
 let picker=null;
 window.saleSourcePicker76=function(mode='ready',i=null){
  if(!supplierSale()||!guardWork())return;
  saleSourceClose76();const button=document.activeElement;
  const d=document.createElement('dialog');d.id='salePicker76';d.className='sale-picker76';d.setAttribute('aria-labelledby','salePickerTitle76');d.setAttribute('aria-describedby','salePickerHelp76');
  const isPending=mode==='pending';
  picker={dialog:d,mode:isPending?'pending':'ready',line:targetLine(i),page:1,search:'',warehouse:'',focus:button,view:workView?.id,role:state.role,scroll:document.body.style.overflow};
  const wh=[...new Set((isPending?pending().flatMap(g=>g.lots):available()).map(l=>l.warehouse))];
  d.innerHTML='<header><div><h2 id="salePickerTitle76">'+(isPending?'ပိဿာဖြည့်ရန် ကုန်ဝင်ရွေးမယ်':'ရောင်းမည့် ကုန်ရှာရွေးမယ်')+'</h2><p id="salePickerHelp76">'+(isPending?'ဘောက်ချာတစ်ခုကို တစ်ကြောင်းစီ စုစည်းပြထားပါသည်။':'လိုချင်သည့် ကုန်အသုတ်ကို ရွေးလိုက်ပါ။')+'</p></div><button type="button" class="btn-icon" aria-label="ပိတ်မယ်" onclick="saleSourceClose76()">'+I('close')+'</button></header>'+
   '<div class="source-filters76"><label>ရှာဖွေမယ်<input id="saleSearch76" type="search" placeholder="ကုန်သည် / ကုန်အမည် / ဘောက်ချာနံပါတ်" autocomplete="off" oninput="saleSourceFilter76()"></label><label>ဂိုဒေါင်<select id="saleWarehouse76" onchange="saleSourceFilter76()"><option value="">ဂိုဒေါင်အားလုံး</option>'+wh.map(id=>'<option value="'+E(id)+'">'+E(W(id))+'</option>').join('')+'</select></label></div>'+
   '<p id="saleResultCount76" class="source-count76" role="status" aria-live="polite"></p><div id="saleResults76" class="source-results76"></div><footer><button type="button" class="btn btn-secondary" onclick="saleSourceClose76()">အရောင်းသို့ ပြန်မယ်</button><nav class="source-pagination76" aria-label="စာမျက်နှာပြောင်းရန်"><button id="salePrevious76" type="button" class="btn btn-secondary" onclick="saleSourcePage76(-1)">ရှေ့သို့</button><span id="salePage76"></span><button id="saleNext76" type="button" class="btn btn-secondary" onclick="saleSourcePage76(1)">နောက်သို့</button></nav></footer>';
  d.addEventListener('cancel',e=>{e.preventDefault();saleSourceClose76();});
  document.body.appendChild(d);d.showModal();document.body.style.overflow='hidden';renderPicker();document.getElementById('saleSearch76').focus();
 };
 window.saleSourceClose76=function(){if(!picker)return;const p=picker;picker=null;p.dialog.close();p.dialog.remove();document.body.style.overflow=p.scroll;if(p.focus?.isConnected)p.focus.focus({preventScroll:true});};
 function current(){return picker&&supplierSale()&&picker.view===workView?.id&&picker.role===state.role;}
 window.saleSourceFilter76=function(){if(!current())return saleSourceClose76();picker.search=value('saleSearch76');picker.warehouse=value('saleWarehouse76');picker.page=1;renderPicker();};
 window.saleSourcePage76=function(delta){if(!current())return saleSourceClose76();picker.page+=delta;renderPicker();document.getElementById('saleResults76').scrollTop=0;};
 function renderPicker(){
  if(!current())return saleSourceClose76();const p=picker,isPending=p.mode==='pending',q=norm(p.search),tokens=q.split(' ').filter(Boolean),index=new Map((state.receipts||[]).map(r=>[r.id,r]));
  const rows=(isPending?pending():available()).filter(row=>{
   const lots=isPending?row.lots:[row],src=isPending?row.receipt:origin(row,index),names=norm(lots.map(l=>{const o=origin(l,index);return [l.product,l.batch,o.name,o.no,W(l.warehouse)].join(' ');}).join(' ')+' '+(isPending?row.key:src.no)),matches=tokens.every(t=>names.includes(t));
   return matches&&(!p.warehouse||lots.some(l=>l.warehouse===p.warehouse));
  });
  const pages=Math.max(1,Math.ceil(rows.length/10));p.page=Math.min(pages,Math.max(1,p.page));
  document.getElementById('saleResultCount76').textContent=(q||p.warehouse?'ရှာတွေ့သော ':'စုစုပေါင်း ')+(isPending?'ကုန်ဝင် ':'ကုန်အသုတ် ')+N(rows.length)+' ခု';
  const body=document.getElementById('saleResults76');body.innerHTML='';
  for(const row of rows.slice((p.page-1)*10,p.page*10)){
   const r=isPending?row.receipt:origin(row).receipt,o=isPending?origin(row.lots[0]):origin(row),products=isPending?[...new Set(row.rows.map(x=>x.product))].join('၊ '):row.product;
   const wh=isPending?[...new Set(row.lots.map(x=>W(x.warehouse)))].join('၊ '):W(row.warehouse),no=isPending?row.key:o.no;
   const detail=isPending?N(row.rows.reduce((sum,x)=>sum+(Number(x.rawBags??x.bags)||0),0))+' အကြမ်းအိတ် · ပိဿာဖြည့်ရန်':vissText37(row.qty)+' ပိဿာ လက်ကျန်';
   const el=document.createElement('article');el.className='source-item76';
   el.innerHTML='<div class="source-product76"><strong title="'+E(products)+'">'+E(products)+'</strong><span>'+E(o.name)+'</span></div><div class="source-meta76"><strong>'+E(detail)+'</strong><span>'+E(no)+' · '+E(wh)+'</span>'+(r?.date?'<small>'+E(shortDate(r.date))+'</small>':'')+'</div><button type="button" class="btn btn-'+(isPending?'secondary':'primary')+'">'+(isPending?'ပိဿာဖြည့်မယ်':'ရွေးမယ်')+'</button>';
   el.querySelector('button').addEventListener('click',()=>selectRow(row));body.appendChild(el);
  }
  if(!rows.length)body.innerHTML='<div class="source-empty76"><strong>ကိုက်ညီသောကုန် မတွေ့ပါ။</strong><p>ရှာထားသည့်စာသား သို့မဟုတ် ဂိုဒေါင်ကို ပြောင်းကြည့်ပါ။</p><button type="button" class="btn btn-secondary" onclick="saleSourceClear76()">ရှာထားတာ ရှင်းမယ်</button></div>';
  document.getElementById('salePrevious76').disabled=p.page===1;document.getElementById('saleNext76').disabled=p.page===pages;document.getElementById('salePage76').textContent=N(p.page)+' / '+N(pages);
 }
 window.saleSourceClear76=function(){if(!current())return;document.getElementById('saleSearch76').value='';document.getElementById('saleWarehouse76').value='';saleSourceFilter76();document.getElementById('saleSearch76').focus();};
 function applyLot(l,i){
  if(!l||!eligible(l))return false;
  const choose=(prefix,val,fn)=>{const el=document.getElementById(prefix+i);if(!el||![...el.options].some(x=>x.value===String(val)))return false;el.value=val;fn(i);return true;};
  if(!choose('vsp59',l.product,saleProductChanged43))return false;
  const o=origin(l),el=document.getElementById('vso43'+i),opts=[...el.options],opt=opts.find(x=>x.value&&x.value===o.id)||opts.find(x=>x.value&&x.textContent.trim()===o.name.trim());
  if(!opt)return false;
  return choose('vso43',opt.value,saleOriginChanged43)&&choose('vsw59',l.warehouse,saleWarehouseChanged43)&&choose('vl',l.id,saleBatchChanged43);
 }
 function updateLine(i){const l=(state.lots||[]).find(l=>l.id===value('vl'+i)),text=document.querySelector('#voucherLines4 .req-line[data-i="'+Number(i)+'"] .sale-search76>span');if(text)text.textContent=l?l.product+' · '+origin(l).name:'ကုန်သည်၊ ကုန်အမည် သို့မဟုတ် ဘောက်ချာနံပါတ်ဖြင့် ရှာပါ။';}
 function selectRow(row){
  if(!current())return saleSourceClose76();const p=picker;
  if(p.mode==='pending'){
   const g=pending().find(g=>g.key===row.key);if(!g)return renderPicker();
   saleSourceClose76();saleSourceReceive73(g.receipt.id,p.line,g.receipt.product);return;
  }
  const l=available().find(l=>l.id===row.id);if(!l)return renderPicker();
  saleSourceClose76();let i=p.line;
  if(i===null){addVoucherLine4();i=document.querySelector('#voucherLines4 .req-line:last-child').dataset.i;}
  if(applyLot(l,i)){workDirty=true;calcVoucher4();document.getElementById('vq'+i)?.focus({preventScroll:true});document.getElementById('slineHint43'+i)?.scrollIntoView({block:'center'});}
 }
 // Native V73 snapshot restoration refreshes the selectors; replay all entered lines afterwards.
 window.saleSourceRestore76=function(d,receiptId){
  const rows=[...document.querySelectorAll('#voucherLines4 .req-line')].map(el=>{const i=el.dataset.i;return {i,values:Object.fromEntries([...el.querySelectorAll('input[id],select[id]')].map(n=>[n.id,n.value]))};});
  refreshSaleSelectors72();
  for(const row of rows){
   const i=row.i,v=row.values,l=(state.lots||[]).find(l=>l.id===v['vl'+i]);
   if(l&&l.owner==='supplier')applyLot(l,i);
   else for(const [prefix,fn] of [['vsp59',saleProductChanged43],['vso43',saleOriginChanged43],['vsw59',saleWarehouseChanged43],['vl',saleBatchChanged43]]){const el=document.getElementById(prefix+i);if(el&&[...el.options].some(o=>o.value===v[prefix+i])){el.value=v[prefix+i];fn(i);}}
   for(const [id,val] of Object.entries(v)){const el=document.getElementById(id);if(el?.tagName==='INPUT')el.value=val;}
  }
  const lot=receiptId?(state.lots||[]).find(l=>l.receiptId===receiptId&&eligible(l)):null;
  if(lot){let i=targetLine(d.targetLine76);if(i===null){addVoucherLine4();i=document.querySelector('#voucherLines4 .req-line:last-child').dataset.i;}applyLot(lot,i);workDirty=true;}
  saleSourceSummary76();calcVoucher4();return lot;
 };
 const oldOwner=saleOwnerChanged43;
 saleOwnerChanged43=function(...args){const r=oldOwner(...args);const form=document.getElementById('voucher4');if(form)form.classList.toggle('sale-source-mode76',supplierSale());if(!supplierSale()){document.querySelectorAll('.sale-search76').forEach(b=>b.hidden=true);document.querySelectorAll('.sale-manual76').forEach(d=>{d.querySelector('summary').remove();d.replaceWith(...d.children);});}return r;};
 const oldBatch=saleBatchChanged43;
 saleBatchChanged43=function(i){const r=oldBatch(i);updateLine(i);return r;};
 const oldAdd=addVoucherLine4;
 addVoucherLine4=function(...args){const r=oldAdd(...args);if(supplierSale())saleSourceSummary76();return r;};
 const oldNavigate=navigate;
 navigate=function(...args){saleSourceClose76();return oldNavigate(...args);};
 window.addEventListener('popstate',()=>saleSourceClose76());
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
})();

