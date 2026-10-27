(function(){
 'use strict';
 const pageSize=30,memory=new Map();
 const recordActions=new Set(['receiptDetail4','saleDetail4','openReceiptDetailForm','openSaleDetail','openProductEdit','openPartnerEdit','openPartnerStatement62','openAccountMaster','openExpenseReasonEdit','editDeductionRate','pweEditServiceRate','pweEditLoanPolicy','editLaborRate51','editLaborMael51','editPackType4','openWarehouseMaster61','viewCashIn50','loanDetail38','viewNotebook63','openNotebook63']);
 function identity(node){
  for(const el of node.querySelectorAll('[onclick]')){
   const match=el.getAttribute('onclick').match(/^\s*([\w]+)\(['"]([^'"]+)['"]/);
   if(!match||!recordActions.has(match[1]))continue;
   const raw=match[1]==='openAccountMaster'?state.__ids?.accounts?.[match[2]]:match[2];
   const id=String(raw||'').replace(/^note:/,'');
   if(/^\d+$/.test(id)||/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id))return {kind:match[1],id};
  }
  if(page==='setup'){
   const collections={products:state.masters.products,partners:state.masters.partners,accounts:state.masters.accounts,deductions:state.masters.purchaseDeductionRates,'service-rates':state.masters.purchaseDeductionRates,additional38:state.loanInterestPolicies,warehouses:state.warehouses};
   const name=(node.querySelector('strong')||(node.cells&&node.cells[0]))?.textContent.trim();
   const matches=(collections[setupSection]||[]).filter(record=>record.name===name);
   if(matches.length===1){const record=matches[0],id=setupSection==='accounts'?state.__ids?.accounts?.[record.id]:record.id;if(/^\d+$/.test(String(id)))return {kind:setupSection,id:String(id)};}
  }
  return null;
 }
 function latest(units){
  const ranked=units.map(unit=>({unit,key:identity(unit[0])}));
  if(ranked.every(item=>item.key)&&new Set(ranked.map(item=>item.key.kind)).size===1){
   ranked.sort((a,b)=>/^\d+$/.test(a.key.id)&&/^\d+$/.test(b.key.id)?(BigInt(a.key.id)>BigInt(b.key.id)?-1:BigInt(a.key.id)<BigInt(b.key.id)?1:0):b.key.id.localeCompare(a.key.id));
   return ranked.map(item=>item.unit);
  }
  return units;
 }
 function paginate(container,units,key){
  if(!units.length)return;
  const ordered=latest(units);
  // Reorder rendered records only: canonical arrays keep their stock/payment semantics.
  if(ordered.some((unit,i)=>unit!==units[i])){
   const marker=document.createComment('record-list'),fragment=document.createDocumentFragment();
   container.insertBefore(marker,units[0][0]);ordered.flat().forEach(node=>fragment.append(node));container.insertBefore(fragment,marker);marker.remove();
  }
  const signature=JSON.stringify(ordered.map(unit=>[identity(unit[0]),unit[0].textContent]));
  let entry=memory.get(key);
  if(!entry||entry.signature!==signature){entry={signature,page:1};memory.set(key,entry);}
  const pages=Math.max(1,Math.ceil(ordered.length/pageSize));entry.page=Math.min(entry.page,pages);
  function show(){ordered.forEach((unit,index)=>unit.forEach(node=>node.classList.toggle('pwe-page-hidden',index<(entry.page-1)*pageSize||index>=entry.page*pageSize)));}
  show();
  if(pages===1)return;
  const nav=document.createElement('nav');nav.className='pwe-pagination';nav.dataset.listPagination=key;nav.setAttribute('aria-label','စာရင်း စာမျက်နှာများ');
  const status=document.createElement('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const previous=document.createElement('button'),next=document.createElement('button');
  previous.type=next.type='button';previous.className=next.className='btn btn-secondary';previous.textContent='ရှေ့သို့';next.textContent='နောက်သို့';
  function update(){
   const mounted=nav.isConnected;if(mounted)observer?.disconnect();
   show();status.textContent=((entry.page-1)*pageSize+1)+'–'+Math.min(entry.page*pageSize,ordered.length)+' / '+ordered.length+' · စာမျက်နှာ '+entry.page+' / '+pages;previous.disabled=entry.page===1;next.disabled=entry.page===pages;
   if(mounted)observer?.observe(document.getElementById('main'),{childList:true,subtree:true});
  }
  previous.onclick=()=>{entry.page--;update();};next.onclick=()=>{entry.page++;update();};
  nav.append(status,previous,next);update();
  const table=container.closest('table');
  if(table)(table.closest('.table-wrap')||table).after(nav);else container.after(nav);
 }
 let observer;
 function refresh(){
  const main=document.getElementById('main');if(!main)return;
  observer?.disconnect();
  try{
   main.querySelectorAll('.pwe-pagination').forEach(nav=>nav.remove());
   const context=String(page)+'|'+(page==='setup'?setupSection:'')+'|'+[...main.querySelectorAll('.tab.active,[aria-selected="true"]')].map(el=>el.textContent).join('|')+'|'+[...main.querySelectorAll('input[type="search"],.search input,input[type="date"]')].map(el=>el.value).join('|');
   ['receiptRows','saleRows'].forEach(id=>{const root=document.getElementById(id);if(root){const cards=[...root.querySelectorAll(':scope > article,:scope > .v2-list > article')];if(cards.length)paginate(cards[0].parentElement,cards.map(card=>[card]),context+'|'+id);}});
   main.querySelectorAll('.v2-list').forEach((root,index)=>{
    if(root.closest('#receiptRows,#saleRows,form,.modal-body,.work-page,.op69-shell'))return;
    const records=[...root.children].filter(el=>el.matches('article,.v3-partner-row,.v3-product-row,.v2-record'));
    if(records.length)paginate(root,records.map(record=>[record]),context+'|list-'+index);
   });
   main.querySelectorAll('table').forEach((table,index)=>{
    if(table.closest('form,.modal-body,.work-page,.op69-shell')||table.matches('.sl2-history-table')||!table.tBodies[0])return;
    const units=[];
    for(const row of table.tBodies[0].rows){
     if(row.classList.contains('sl2-extra')&&units.length){units.at(-1).push(row);continue;}
     if(row.querySelector('[colspan]')||!row.querySelector('td'))continue;
     units.push([row]);
    }
    paginate(table.tBodies[0],units,context+'|table-'+index+'|'+(table.tHead?.textContent||''));
   });
  }finally{observer?.observe(main,{childList:true,subtree:true});}
 }
 const baseRender=render;render=function(...args){const result=baseRender.apply(this,args);refresh();return result;};
 for(const name of ['renderReceiptRows','renderSaleRows','renderInventoryBody','renderCashBody']){
  const before=window[name];window[name]=function(...args){const result=before.apply(this,args);refresh();return result;};
 }
 observer=new MutationObserver(refresh);
 window.pwePagination={refresh,pageSize};
 refresh();
})();
