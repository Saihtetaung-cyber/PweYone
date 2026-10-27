const fs=require('node:fs');const crypto=require('node:crypto');
const directory='reference/originals/';
const files=fs.readdirSync(directory).filter(p=>p.endsWith('.html')||p.endsWith('.pdf'));
const manifest=files.map(file=>({file,path:directory+file,bytes:fs.statSync(directory+file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(directory+file)).digest('hex')}));
fs.writeFileSync('reference/extracted/manifest.json',JSON.stringify({files:manifest,missing:['PweYon_testingDocumentation.pdf'].filter(p=>!fs.existsSync(directory+p))},null,2));console.log(manifest.map(x=>x.file+' '+x.sha256).join('\n'));
