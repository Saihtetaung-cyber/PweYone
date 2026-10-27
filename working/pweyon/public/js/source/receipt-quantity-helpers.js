
/* Receiving history and purchase quantities are distinct after a residual purchase. */
window.receiptReceivedQuantity2=function(r){const value=r?.remainingPurchase2?.schema===1?r.remainingPurchase2.original.qty:r?.qty;return Number(value)||0;};
