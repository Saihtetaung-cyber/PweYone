'use strict';
window.pweHydrate=function(data){
 // PHP may encode numeric-keyed opening maps as sparse arrays with null slots.
 // Restore maps before review code iterates accounts and partner drafts.
 if(data.initialOpening69){
  for(const key of ['accounts','parties']){
   const entries=data.initialOpening69[key];
   data.initialOpening69[key]=Object.fromEntries(Object.entries(entries||{}).filter(([,entry])=>entry&&typeof entry==='object'&&!Array.isArray(entry)));
  }
 }
 const numeric=new Set(('qty bags rawBags actualBags packageCount packageViss size cost price total grossTotal gross net4 paid deliveredQty deliveredBags amount principal interest rate value standardViss standardWeight openingBalance expected actual difference expectedQty expectedBags bagDifference packageViss standardBagViss46 buyerBagViss46 advance wage weigh net service serviceFee serviceRateValue labor truck clean plastic sack carriage loanTotal38 additionTotal deductionTotal purchaseBagViss47 purchaseBagCount55 standardBagViss47 openingInterest69 received receivedAmount serverNet serverPaid').split(' '));
 function walk(x,parent=''){if(Array.isArray(x))return x.map(v=>walk(v,parent));if(x&&typeof x==='object'){for(const k of Object.keys(x)){if(x[k]!==null&&(numeric.has(k)||parent==='bases'||parent==='prices')&&typeof x[k]==='string'&&/^-?\d+(\.\d+)?$/.test(x[k]))x[k]=Number(x[k]);else x[k]=walk(x[k],k);} }return x;}
 return walk(data);
};
