
/* Version 2 — UI adaptation of the native P&L report. No financial values,
   posting functions, filters, date handlers, CSV or print generators are changed. */
(function(){
 const previous=profitPage;
 profitPage=function(){
  const root=document.createElement('div');root.className='profit-ui2';root.innerHTML=previous();
  const heading=root.querySelector('.page-heading h1');if(heading)heading.textContent='အရှုံးအမြတ်';
  const subtitle=root.querySelector('.page-heading .subtitle');if(subtitle)subtitle.textContent='ရက်ကာလအလိုက် ရငွေ၊ ဝယ်ရင်း၊ အသုံးစရိတ်နှင့် အမြတ် / အရှုံးကို ကြည့်ပါ။';
  const badge=root.querySelector('.page-heading .pill');if(badge)badge.innerHTML='<span class="dot"></span>ယာယီစာရင်း';
  const range=root.querySelector('.owner-date-filter');if(range){
   range.classList.add('stock-ledger-range83');
   const title=range.querySelector('.owner-date-filter-title strong');if(title)title.textContent='ရက်ကာလရွေးရန်';
   const noteText=range.querySelector('.owner-date-filter-title span');if(noteText)noteText.textContent='ရွေးထားသောရက်ကာလအတွက် လုပ်ငန်းတစ်ခုလုံး၏ အရှုံးအမြတ်ကို ကြည့်ပါ။';
   for(const [id,text] of [['ownerDateFrom','စရက်'],['ownerDateTo','ဆုံးရက်']]){const input=range.querySelector('#'+id),label=input?.closest('label');if(label){const node=[...label.childNodes].find(x=>x.nodeType===3);if(node)node.textContent=text;}}
  }
  const report=root.querySelector('#pnl52');if(!report)return root.outerHTML;
  const metrics=report.querySelector('.pnl52-metrics'),alerts=report.querySelector('.pnl52-alerts');if(metrics)report.prepend(metrics);
  const names=['စုစုပေါင်း ရငွေ','ရောင်းပြီးကုန်၏ ဝယ်ရင်း','ပွဲရုံခံ အသုံးစရိတ်','အသားတင် အမြတ် / အရှုံး (ယာယီ)'];
  report.querySelectorAll('.pnl52-metric>span').forEach((span,i)=>{if(names[i])span.textContent=names[i];});
  const revenueNote=metrics?.querySelector('.pnl52-metric small');if(revenueNote)revenueNote.textContent='ပွဲရုံပိုင်အရောင်း + ပွဲခနှင့် ကောက်ခံခ';
  const help=document.createElement('details');help.className='profit2-help';help.innerHTML='<summary>တွက်ချက်ပုံနှင့် မှတ်ချက်များ ကြည့်ရန်</summary>';
  alerts?.querySelectorAll('.note.blue').forEach(x=>help.append(x));
  if(alerts&&!alerts.children.length)alerts.remove();
  const tabNames={summary:'အနှစ်ချုပ်',product:'ကုန်ပစ္စည်းအလိုက်',voucher:'အရောင်းအသေးစိတ်',expense:'အသုံးစရိတ်အသေးစိတ်',review:'စစ်ဆေးရန်'};
  report.querySelectorAll('.pnl52-tabs button').forEach(button=>{const key=button.getAttribute('onclick')?.match(/setPnL52View\('([^']+)'\)/)?.[1];if(tabNames[key])button.textContent=tabNames[key];});
  report.querySelectorAll('.pnl52-actions button').forEach(button=>{if(button.getAttribute('onclick')==='printPnL52()')button.innerHTML=I('print')+'Print / PDF';});
  report.querySelectorAll('.pnl52-filters').forEach(filter=>{const note=document.createElement('p');note.className='profit2-filter-note';note.textContent='ဤ Filter သည် အောက်ပါအသေးစိတ်စာရင်းကိုသာ စစ်ထုတ်ပါသည်။ အပေါ်က အနှစ်ချုပ်ကို မပြောင်းပါ။';filter.after(note);});
  const labels={
   'A. ပွဲရုံပိုင်ကုန် အရောင်းတန်ဖိုး (Gross)':'ပွဲရုံပိုင်ကုန် အရောင်းတန်ဖိုး',
   'စုစုပေါင်း Revenue':'စုစုပေါင်း ရငွေ',
   'B. Cost of Goods Sold — အရောင်းမှတ်တမ်းတွင် သိမ်းထားသောဝယ်ရင်း':'ရောင်းပြီးကုန်၏ ဝယ်ရင်း',
   'Gross Profit':'အကြမ်းအမြတ်',
   'C. Operating Expenses (ပြန်ရမည့်ငွေများဖယ်)':'ပွဲရုံခံ အသုံးစရိတ်',
   'Net Profit / Loss (ယာယီ)':'အသားတင် အမြတ် / အရှုံး (ယာယီ)'
  };
  report.querySelectorAll('.pnl52-line>span').forEach(span=>{if(labels[span.textContent])span.textContent=labels[span.textContent];});
  report.querySelectorAll('.pnl52-card>h3').forEach(h=>{if(h.textContent.startsWith('Profit & Loss Statement — '))h.textContent=h.textContent.replace('Profit & Loss Statement — ','အရှုံးအမြတ် အနှစ်ချုပ် — ');});
  // Keep the business explanation; remove implementation/version chatter from the screen.
  [...report.children].filter(x=>x.matches('p.pnl52-note')).forEach(x=>{x.remove();});
  const feeNote=document.createElement('p');feeNote.textContent='ကုန်သည်ဘက် အတည်ပြုပြီးအခများနှင့် ဝယ်သူဘက် ကောက်ခံခများကို သီးခြားတစ်ကြိမ်စီ တွက်ထားပါသည်။';help.append(feeNote);report.append(help);
  return root.outerHTML;
 };
 document.title='ပွဲရုံ · Version 2 Daily Closing UI';
 if(page==='profit'&&!workView)render();
})();

