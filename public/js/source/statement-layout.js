
/* Version 2 — only scope the existing Statement UI; preserve all native data,
   selection handlers, date validation, tab transitions and print output. */
(function(){
 const previous=statements4;
 statements4=function(){return '<div class="statement-ui2">'+previous()+'</div>';};
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
 if(page==='operations'&&opsTab==='statements'&&!workView)render();
})();

