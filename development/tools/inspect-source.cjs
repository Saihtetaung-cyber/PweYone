const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync('reference/originals/'+fs.readdirSync('reference/originals').find(x=>x.endsWith('.html')), 'utf8');
fs.mkdirSync('reference/extracted', {recursive:true});
let clean = html.replace(/data:[^;"'\s]+;base64,[A-Za-z0-9+/=\s]+/g, '[embedded asset omitted]');
fs.writeFileSync('reference/extracted/interface-readable.html',clean);
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
let inventory = {scripts:[],functions:[],storage:[],screens:[],events:[]};
for(let i=0;i<scripts.length;i++) {
 const js = scripts[i][2];
 fs.writeFileSync(`reference/extracted/script-${i+1}.js`,js);
 inventory.scripts.push({number:i+1,attributes:scripts[i][1],lines:js.split('\n').length});
 for(const m of js.matchAll(/(?:function\s+([\w$]+)\s*\(|(?:window\.)?([\w$]+)\s*=\s*(?:async\s*)?function\s*\()/g)) inventory.functions.push({name:m[1]||m[2],script:i+1,line:js.slice(0,m.index).split('\n').length});
 for(const m of js.matchAll(/localStorage\.(getItem|setItem|removeItem)\(([^\n]{0,160})/g)) inventory.storage.push({script:i+1,line:js.slice(0,m.index).split('\n').length,call:m[0]});
}
for(const m of clean.matchAll(/<(?:section|div|form)\b[^>]*\bid=["']([^"']+)["'][^>]*>/g)) inventory.screens.push(m[1]);
for(const m of clean.matchAll(/\bon(?:click|submit|change)=["']([^"']*)["']/g)) inventory.events.push(m[1]);
fs.writeFileSync('reference/extracted/inventory.json',JSON.stringify(inventory,null,2));
console.log(JSON.stringify({bytes:html.length,scripts:inventory.scripts,functions:inventory.functions.length,storage:inventory.storage,screens:inventory.screens},null,2));
