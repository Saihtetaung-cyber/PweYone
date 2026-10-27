(function(){
 'use strict';
 let opened=null;
 const normalize=text=>String(text).normalize('NFC').trim().toLocaleLowerCase();
 function enhance(){
  const input=document.getElementById('op69Product');
  if(!input||input.dataset.productPicker)return;
  input.dataset.productPicker='true';input.removeAttribute('list');
  input.autocomplete='off';input.placeholder='ကုန်အမည် ရိုက်ရှာပါ သို့မဟုတ် ရွေးပါ';
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-expanded','false');input.setAttribute('aria-controls','openingProductOptions');
  const wrap=document.createElement('div');wrap.className='opening-product-picker';
  input.replaceWith(wrap);wrap.append(input);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='opening-product-toggle';
  toggle.setAttribute('aria-label','ကုန်အမျိုးအစားစာရင်း ဖွင့် / ပိတ်');toggle.setAttribute('aria-expanded','false');toggle.textContent='⌄';
  const list=document.createElement('div');list.id='openingProductOptions';list.className='opening-product-options';list.setAttribute('role','listbox');list.setAttribute('aria-label','ကုန်အမျိုးအစားများ');list.hidden=true;
  wrap.append(toggle,list);let choices=[],active=-1;
  const products=()=>state.masters.products.filter(p=>p.active!==false);
  function close(){list.hidden=true;input.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');if(opened===wrap)opened=null;}
  wrap.closePicker=close;
  function highlight(index){
   active=index;[...list.querySelectorAll('[role=option]')].forEach((el,i)=>{el.classList.toggle('is-active',i===active);});
   const selected=list.querySelectorAll('[role=option]')[active];
   if(selected){input.setAttribute('aria-activedescendant',selected.id);selected.scrollIntoView({block:'nearest'});}
  }
  function choose(product){
   input.value=product.name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close();input.focus();
  }
  function show(filter=''){
   if(opened&&opened!==wrap)opened.closePicker();opened=wrap;
   choices=products().filter(p=>normalize(p.name).includes(normalize(filter)));active=-1;list.replaceChildren();
   choices.forEach((product,index)=>{
    const option=document.createElement('button');option.type='button';option.className='opening-product-option';option.id='openingProductOption'+index;option.setAttribute('role','option');option.setAttribute('aria-selected',String(product.name===input.value));
    const name=document.createElement('strong');name.textContent=product.name;
    const detail=document.createElement('small');detail.textContent='အဆင့် · '+(product.grades||[]).join(' / ');
    const mark=document.createElement('span');mark.className='opening-product-check';mark.textContent=product.name===input.value?'✓':'';mark.setAttribute('aria-hidden','true');
    option.append(name,detail,mark);option.addEventListener('mousedown',e=>e.preventDefault());option.onclick=()=>choose(product);list.append(option);
   });
   if(!choices.length){const empty=document.createElement('p');empty.className='opening-product-empty';empty.setAttribute('role','status');empty.textContent=products().length?'ရှာထားသောကုန် မတွေ့ပါ။ အောက်ရှိ ကုန်အသစ်ထည့်မယ်ကို သုံးနိုင်ပါတယ်။':'ကုန်အမျိုးအစား မရှိသေးပါ။ အောက်ရှိ ကုန်အသစ်ထည့်မယ်ကို နှိပ်ပါ။';list.append(empty);}
   list.hidden=false;input.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');
  }
  toggle.onclick=()=>{if(list.hidden){show();input.focus();}else close();};
  input.addEventListener('click',()=>show());
  input.addEventListener('input',()=>show(input.value));
  input.addEventListener('keydown',event=>{
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();if(list.hidden)show();if(choices.length)highlight(active<0?(event.key==='ArrowDown'?0:choices.length-1):(active+(event.key==='ArrowDown'?1:-1)+choices.length)%choices.length);
   }else if(event.key==='Enter'&&!list.hidden){event.preventDefault();if(choices[active])choose(choices[active]);else if(choices.length===1)choose(choices[0]);}
   else if(event.key==='Escape'&&!list.hidden){event.preventDefault();event.stopPropagation();close();}
   else if(event.key==='Tab')close();
  });
  wrap.addEventListener('focusout',event=>{if(!wrap.contains(event.relatedTarget))close();});
 }
 document.addEventListener('pointerdown',event=>{if(opened&&!opened.contains(event.target))opened.closePicker();});
 const baseRender=render;render=function(...args){const result=baseRender.apply(this,args);enhance();return result;};
 enhance();
})();
