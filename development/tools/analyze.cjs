const fs=require('node:fs');const parser=require('@babel/parser');const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('reference/originals/'+fs.readdirSync('reference/originals').find(x=>x.endsWith('.html')),'utf8');
const inventory=[];
for(const [i,script] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()){
 const code=script[1];const ast=parser.parse(code,{sourceType:'script',errorRecovery:true});
 function walk(n){if(!n||typeof n!=='object')return;
  if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type)){
   const body=code.slice(n.start,n.end);if(/\bsave\s*\(|\.push\(|\.status\s*=/.test(body)&&n.id?.name)inventory.push({script:i+1,name:n.id.name,line:n.loc.start.line,body});
  }
  if(n.type==='AssignmentExpression'&&['FunctionExpression','ArrowFunctionExpression'].includes(n.right.type)){
   const body=code.slice(n.start,n.end);if(/\bsave\s*\(|\.push\(|\.status\s*=/.test(body))inventory.push({script:i+1,name:code.slice(n.left.start,n.left.end),line:n.loc.start.line,body});
  }
  for(const [k,v]of Object.entries(n))if(k!=='loc'){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);}
 }walk(ast.program);
}
fs.writeFileSync('reference/extracted/mutations.json',JSON.stringify(inventory,null,2));
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.confirm=()=>false;w.print=()=>{};}});
setTimeout(()=>{
 const state=dom.window.eval('JSON.parse(JSON.stringify(state))');fs.writeFileSync('reference/extracted/empty-interface-state.json',JSON.stringify(state,null,2));
 console.log(JSON.stringify({mutators:inventory.length,stateKeys:Object.keys(state),errors},null,2));process.exit(errors.length?1:0);
},500);
