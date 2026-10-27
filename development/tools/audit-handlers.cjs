const fs=require('node:fs');const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/test-workspace.html','utf8').replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:new VirtualConsole(),beforeParse(w){w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>false;w.fetch=async()=>({ok:false,json:async()=>({message:'audit only'})});}});
setTimeout(()=>{
 const names=[...new Set(JSON.parse(fs.readFileSync('reference/extracted/mutations.json','utf8')).map(x=>x.name.replace(/^window\./,'')))];const rows=[];
 for(const name of names){if(!/^[A-Za-z_$][\w$]*$/.test(name))continue;try{const fn=dom.window.eval(name);if(typeof fn==='function'&&/\bsave\s*\(/.test(String(fn)))rows.push({name,body:String(fn)});}catch{}}
 fs.writeFileSync('development/runtime/unmapped-handlers.json',JSON.stringify(rows,null,2));console.log(rows.map(r=>r.name).join('\n'));process.exit(0);
},100);
