
/* Capture a timestamp for newly created direct-delivery sales without adding a dispatch or stock movement. */
(function(){
 'use strict';
 const persist=save,commit=commitVoucher4,legacyCommit=typeof saveSaleV37==='function'?saveSaleV37:null;
 let creating=null;
 save=function(...args){
  if(creating){for(const sale of state.sales){
   if(creating.has(sale.id)||sale.mode!=='direct'||!(Number(sale.deliveredQty)>0)||sale.directDispatch2)continue;
   sale.directDispatch2={schema:1,recordedAt:new Date().toISOString()};
  }}
  return persist(...args);
 };
 function invoke(original,context,args){const previous=creating;creating=new Set(state.sales.map(s=>s.id));try{return original.apply(context,args);}finally{creating=previous;}}
 commitVoucher4=function(...args){return invoke(commit,this,args);};
 if(legacyCommit)saveSaleV37=function(...args){return invoke(legacyCommit,this,args);};
})();

