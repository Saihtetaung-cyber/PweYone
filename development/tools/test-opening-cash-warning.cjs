const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('development/runtime/closing-preview.html','utf8');
html=html.replace(/<script\b([^>]*) src="(\/js\/[^" ]+)"><\/script>/g,(_,attrs,path)=>'<script'+attrs+'>'+fs.readFileSync('working/pweyon/public'+path,'utf8')+'</script>');
const errors=[],checks=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>({ok:false,json:async()=>({message:'UI fixture only'})});}});
setTimeout(()=>{
 try{
  const w=dom.window,s=w.eval('state');
  for(const role of ['staff','owner']){
   s.role=role;
   for(const [status,expected] of [['pending',true],['reviewed',true],['linked',false],['recounted',false],['invalid',true]]){
    s.opening={...s.opening,checked:true,difference:-9900,status};
    const cashPage=w.eval('cashPage()');
    assert.equal(cashPage.includes('အဖွင့်ငွေ ကွာဟချက်'),expected,role+' / '+status);
    assert.equal(s.opening.difference,-9900,'Original discrepancy must remain intact');
    if(expected)assert.ok(cashPage.includes('-9,900'));
   }
   s.opening.difference=0;s.opening.status='matched';assert.ok(!w.eval('cashPage()').includes('အဖွင့်ငွေ ကွာဟချက်'));
  }
  checks.push('Staff and owner cash pages show pending/reviewed discrepancies, hide linked/recounted ones, and show invalidated evidence again without altering original amounts');
  checks.push('Matched zero difference shows no warning');
  assert.deepEqual(errors,[]);
 }catch(e){errors.push(e.stack||e.message);process.exitCode=1;}
 finally{fs.writeFileSync('docs/evidence/opening-cash-warning.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));process.exit(errors.length?1:0);}
},250);
