
/* V41: Purchase charge categories are shown individually in live pricing, saved details and print. */
(function(){
 'use strict';
 const T={
  labor:'\u101c\u102f\u1015\u103a\u101e\u102c\u1038\u1001',
  service:'\u101d\u1014\u103a\u1006\u1031\u102c\u1004\u103a\u1001',
  carriage:'\u1010\u1014\u103a\u1006\u102c\u1001 (\u1001\u1031\u102b\u1000\u103a\u101b\u103e\u100a\u103a) \u00b7 \u101a\u102c\u101a\u102e\u1005\u102d\u102f\u1000\u103a\u1004\u103d\u1031 \u1015\u103c\u1014\u103a\u1014\u102f\u1010\u103a',
  advance:'\u1000\u103c\u102d\u102f\u101e\u102f\u1036\u1038\u1004\u103d\u1031 (\u1021\u1010\u102d\u102f\u1038\u1019\u1032\u1037) \u1015\u103c\u1014\u103a\u1014\u102f\u1010\u103a',
  principal:'\u1000\u103c\u102d\u102f\u1011\u102f\u1010\u103a\u1004\u103d\u1031 \u1021\u101b\u1004\u103a\u1038\u1015\u103c\u1014\u103a\u1006\u1015\u103a',
  interest:'\u1000\u103c\u102d\u102f\u1011\u102f\u1010\u103a\u1004\u103d\u1031 \u1021\u1010\u102d\u102f\u1038\u1015\u1031\u1038',
  gross:'\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038\u1000\u102f\u1014\u103a\u1016\u102d\u102f\u1038',
  details:'\u1014\u102f\u1010\u103a\u1004\u103d\u1031\u1021\u1019\u103b\u102d\u102f\u1038\u1021\u1005\u102c\u1038\u1021\u101c\u102d\u102f\u1000\u103a \u1021\u101e\u1031\u1038\u1005\u102d\u1010\u103a',
  total:'\u1005\u102f\u1005\u102f\u1015\u1031\u102b\u1004\u103a\u1038\u1014\u102f\u1010\u103a\u1004\u103d\u1031',
  net:'\u1021\u101e\u102c\u1038\u1010\u1004\u103a \u1015\u1031\u1038\u101b\u1014\u103a',
  paid:'\u101a\u1001\u102f \u1004\u103d\u1031\u101b\u103e\u1004\u103a\u1038',
  due:'\u1015\u1031\u1038\u101b\u1014\u103a\u1000\u103b\u1014\u103a',
  other:'\u1021\u1001\u103c\u102c\u1038\u1014\u102f\u1010\u103a\u1004\u103d\u1031',
  truck:'\u1000\u102c\u1038\u1001',
  clean:'\u101e\u1014\u1037\u103a\u1005\u1004\u103a\u1001',
  plastic:'\u1015\u101c\u1010\u103a\u1005\u1010\u1005\u103a\u1021\u102d\u1010\u103a\u1001',
  sack:'\u1021\u102d\u1010\u103a\u1001',
  bag:'\u1021\u102d\u1010\u103a'
 };
 const amount41=x=>Number.isFinite(Number(x))?Number(x):0;
 function list41(c){
  c=c||{};
  const items=[];
  const add=(label,amount)=>items.push({label:String(label),amount:amount41(amount)});
  let sr=null;
  if(c.serviceRateId&&typeof deductionRateById==='function')sr=deductionRateById(c.serviceRateId);
  const rate=c.serviceRateValue??sr?.rate;
  add(T.service+(rate>0?' \u00b7 '+N(rate)+'%':''),c.serviceFee||0);
  const laborRows=Array.isArray(c.laborRows)?c.laborRows.filter(r=>amount41(r.bags)>0):[];
  const subtotal=laborRows.reduce((n,r)=>n+amount41(r.total),0);
  // One labor row in current purchase flow; retained detail for older multi-labor purchases.
  if(laborRows.length>1&&Math.abs(subtotal-amount41(c.labor))<.001){
   laborRows.forEach(r=>add(T.labor+' \u00b7 '+(r.name||r.weight||T.bag),r.total));
  }else add(T.labor,c.labor||0);
  if(c.carriage!==undefined)add(T.carriage,c.carriage);
  else if(amount41(c.truck))add(T.truck,c.truck);
  if(amount41(c.clean))add(T.clean,c.clean);
  if(amount41(c.plastic))add(T.plastic,c.plastic);
  if(amount41(c.sack))add(T.sack,c.sack);
  const manual=Array.isArray(c.dynamicRows)?c.dynamicRows:Array.isArray(c.deductionRows)?c.deductionRows:[];
  manual.forEach(item=>{
   const label=item.label||item.name||item.customType||item.itemType||T.other;
   add(label,item.amount);
  });
  add(T.advance,c.advance||0);
  const offsets=Array.isArray(c.loanPayments38)?c.loanPayments38:[];
  const p=offsets.reduce((n,x)=>n+amount41(x.principal),0);
  const i=offsets.reduce((n,x)=>n+amount41(x.interest),0);
  add(T.principal,p);add(T.interest,i);
  const remainder=amount41(c.loanTotal38)-p-i;
  if(remainder>.001)add(T.other+' (Loan)',remainder);
  return items;
 }
 function sum41(items){return items.reduce((n,x)=>n+x.amount,0);}
 function feeRows41(items,minus){return items.map(x=>row4(E(x.label),(minus&&x.amount>0?'\u2212 ':'')+cashText(x.amount))).join('');}
 function markRows41(root){
  if(!root)return;
  const rows=root.querySelectorAll('.summary-line');
  if(rows.length>=4){rows[rows.length-4]?.classList.add('v41-total-row');rows[rows.length-3]?.classList.add('v41-net-row');}
 }
 const calcBefore41=calcVoucher4;
 calcVoucher4=function(){
  calcBefore41();
  if(v4Kind!=='purchase')return;
  const root=document.getElementById('voucherSummary4');if(!root)return;
  const c=readCharges4(),items=list41(c),g=readVoucherLines4().reduce((n,x)=>n+x.total,0);
  const d=sum41(items),paid=number('fPaid')||0;
  root.classList.add('v41-itemized');
  root.innerHTML=row4(T.gross,cashText(g))+
    '<div class="v41-fee-title">'+T.details+'</div>'+feeRows41(items,true)+
    row4(T.total,cashText(d))+row4(T.net,cashText(g-d))+
    row4(T.paid,cashText(paid))+row4(T.due,cashText(g-d-paid));
  markRows41(root);
 };
 // Detailed saved view and printed voucher: always show each selected charge, not a closed disclosure.
 const summaryBefore41=chargesSummary4;
 chargesSummary4=function(c){
  if(!c || (!Array.isArray(c.dynamicRows)&&!Array.isArray(c.laborRows)&&c.loanPayments38===undefined))return summaryBefore41(c);
  const items=list41(c);const d=c.total!==undefined?amount41(c.total):sum41(items);
  const body='<section class="v41-details-card v41-itemized"><h3>'+T.details+'</h3>'+feeRows41(items,false)+row4(T.total,cashText(d))+'</section>';
  return body;
 };
 // Print wrapper defined by the V38 purchase workflow calls chargesSummary4 dynamically.
})();
