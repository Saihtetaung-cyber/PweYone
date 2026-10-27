
// V68 metadata only; balance comes from state.bases + existing transactions.
const openCashCheckBefore68=openCashCheck;
openCashCheck=function(){if(!canViewAccount68('cash'))return toast('ဤငွေသိမ်းရာကို ကြည့်ခွင့်မရှိပါ။',true);return openCashCheckBefore68();};
document.title='ပွဲရုံ · V68 Account Opening Balance / Staff Visibility';
