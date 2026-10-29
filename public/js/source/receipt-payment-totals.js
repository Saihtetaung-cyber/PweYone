
/* Display only: use the same payment rows as the history and the native balance. */
window.receiptPaymentTotals2=function(records){
 if(!records.some(r=>r.status==='purchased'))return '';
 const sum=values=>values.reduce((n,x)=>n+(Number(x)||0),0);
 const paid=sum(records.flatMap(r=>(r.payments||[]).map(p=>p.amount)));
 const remaining=sum(records.map(r=>due(r)));
 return '<div class="receipt-payment-totals2" role="group" aria-label="ဘောက်ချာ၏ ငွေပေးချေမှုအနှစ်ချုပ်"><div><span>ပေးချေပြီးစုစုပေါင်း</span><strong id="receiptPaidTotal2">'+cashText(paid)+'</strong></div><div><span>ပေးရန်ကျန်</span><strong id="receiptDueTotal2">'+cashText(remaining)+'</strong></div></div>';
};
