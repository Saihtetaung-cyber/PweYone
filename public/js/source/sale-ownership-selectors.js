
/* V72: sale ownership / line selection only; native posting and totals retained. */
(function(){
 const before=voucherForm4;
 voucherForm4=function(records){before(records);if(v4Kind==='sale')refreshSaleSelectors72();};
 // Older back-navigation snapshots may still refer to these owner handlers.
 saleOwnershipChanged60=function(){saleOwnerChanged43();};
 saleSupplierChanged60=function(){saleOwnerChanged43();};
 document.title='ပွဲရုံ · V72 Supplier Stock Sale Selection';
})();
