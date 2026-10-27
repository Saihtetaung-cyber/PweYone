const fs=require('node:fs');const assert=require('node:assert/strict');const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/closing-preview.html','utf8');html=html.replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const errors=[],blobs=[],prints=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>true;w.fetch=async()=>({ok:false,json:async()=>({message:'No live report request in print fixture'})});w.print=()=>prints.push(w.document.getElementById('printArea')?.textContent);w.focus=()=>{};w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.Blob=class Blob{constructor(parts,options){this.parts=parts;this.type=options.type;}text(){return this.parts.join('');}};w.HTMLAnchorElement.prototype.click=()=>{};}});
setTimeout(async()=>{try{
 const w=dom.window,s=w.eval('state');w.eval("ownerDateFrom='2026-10-25';ownerDateTo='2026-10-25'");
 w.eval(`printVoucher4('sale','${s.sales[0].id}')`);assert.ok(w.document.getElementById('printArea').textContent.includes('Sesame'));await new Promise(r=>setTimeout(r,120));
 const purchased=s.receipts[0];w.eval(`workView=null;workDirty=false;openReceiptDetail('${purchased.id}')`);
 assert.equal(w.document.querySelectorAll('[data-receipt-print]').length,1);
 w.document.querySelector('[data-receipt-print]').click();await new Promise(r=>setTimeout(r,120));
 assert.ok(w.document.getElementById('printArea').textContent.includes(purchased.product));
 assert.ok(w.document.getElementById('printArea').textContent.includes(purchased.purchaseNo||purchased.voucherNo||purchased.no));
 s.receipts.push({...purchased,id:'pending-print',voucherNo:'PENDING-PRINT',no:'PENDING-PRINT',purchaseNo:null,status:'await',price:null,backendGross:null,charges4:null,payments:[],remainingPurchase2:null});
 w.eval("workDirty=false;openReceiptDetail('pending-print')");assert.equal(w.document.querySelectorAll('[data-receipt-print]').length,1);
 w.document.querySelector('[data-receipt-print]').click();await new Promise(r=>setTimeout(r,120));
 assert.ok(w.document.getElementById('printArea').textContent.includes('PENDING-PRINT'));
 w.eval("printDaily53('2026-10-25')");assert.ok(w.document.getElementById('printArea').textContent.includes('25/10/2026'));await new Promise(r=>setTimeout(r,120));
 w.eval('exportPnL52CSV()');assert.equal(blobs.length,1);assert.match(blobs[0].type,/csv/);assert.ok(blobs[0].text().includes('Sesame'));assert.equal(prints.length,4);
}catch(e){errors.push(e.stack);}const evidence={errors,printCalls:prints.length,csvDownloads:blobs.length,scope:'DOM print markup and CSV payload; physical printing/browser PDF output not tested'};fs.writeFileSync('docs/evidence/print-export.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));process.exit(errors.length?1:0);},200);
