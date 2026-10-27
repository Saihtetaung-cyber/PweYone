import fs from 'node:fs';
globalThis.DOMMatrix=class DOMMatrix {};
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
for(const file of fs.readdirSync('reference/originals').filter(x=>x.endsWith('.pdf'))){
 const pdf=await getDocument({data:new Uint8Array(fs.readFileSync('reference/originals/'+file)),useSystemFonts:true}).promise;
 let all='';
 for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const t=await page.getTextContent();all+=`\n\n=== PAGE ${p} ===\n`+t.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('');}
 const dest='reference/extracted/'+file.replace('.pdf','.txt');fs.writeFileSync(dest,all);console.log({file,pages:pdf.numPages,characters:all.length,dest});
}
