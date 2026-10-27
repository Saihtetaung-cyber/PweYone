const fs=require('node:fs');
for(const n of process.argv.slice(2)){
 const s=fs.readFileSync('reference/extracted/script-'+n+'.js','utf8');
 console.log('SCRIPT',n,[...new Set([...s.matchAll(/(?:value|number|field|selectField|num4|getElementById)\(['"]([^'"]{1,60})['"]/g)].map(m=>m[1]))].join(' | '));
}
