const fs=require('node:fs');let html=fs.readFileSync('reference/originals/'+fs.readdirSync('reference/originals').find(x=>x.endsWith('.html')),'utf8');
const scriptNames=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'interface-script-names.json'),'utf8'));
if(scriptNames.length!==new Set(scriptNames).size)throw Error('Duplicate interface script names.');
const styleNames=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'interface-style-names.json'),'utf8'));
// Remove prototype-only footers/help links and the reset call-to-action from the live interface.
html=html.replace(/<footer class="page-footer">[\s\S]*?<\/footer>/g,'')
 .replace(/<div class="page-footer">[\s\S]*?<\/div>/g,'')
 .replace(/<div class="work-footer">[\s\S]*?<\/div>/g,'')
 .replace(/<div class="v2-home-footer">\$\{btn\('[^']*','openReset\(\)'[\s\S]*?<\/div>/g,'');
if(styleNames.length!==new Set(styleNames).size)throw Error('Duplicate interface style names.');
html=html.replace('id="op69NewPartyForm"','id="op69NewPartyForm" data-kind="${ui.kind}"');
html=html.replace(/let storageOK=true,state;\s*try\{const saved=JSON\.parse\(localStorage\.getItem\(STORE_KEY\)\);state=saved&&saved\.version===1&&Array\.isArray\(saved\.lots\)\?saved:seed\(\);\}\s*catch\(e\)\{storageOK=false;state=seed\(\);\}/,'let storageOK=true,state=pweHydrate(JSON.parse(JSON.stringify(window.__PWE_BOOT__)));');
html=html.replace(/function save\(\)\{try\{localStorage\.setItem\(STORE_KEY,JSON\.stringify\(state\)\);\}catch\(e\)\{storageOK=false;\}\}/,'function save() { /* Initialization only; replaced by server command bridge after source scripts. */ }');
// Client password checks cannot be an authorization boundary; server session supplies the role.
html=html.replace(/<script\b[^>]*id="owner-password-version2"[^>]*>[\s\S]*?<\/script>/,'');
// Remove browser reset implementation, retaining the clean-start guide's layout.
html=html.replace(/localStorage\.setItem\(STORE_KEY,JSON\.stringify\(fresh\)\);/g,"throw new Error('Server business data cannot be reset here.');");
html=html.replace(/localStorage\.getItem\(STORE_KEY\)/g,'null');
fs.mkdirSync('working/pweyon/public/js/source',{recursive:true});fs.mkdirSync('working/pweyon/public/css/source',{recursive:true});
html=html.replace("!['3','4'].includes(d.values.loanRate)","!openingLoanRateValid(d.values.loanRate)");
html=html.replace('m.details.length/25','m.details.length/30').replace('(ui.page-1)*25','(ui.page-1)*30').replace('slice(start,start+25)','slice(start,start+30)');
let scriptNumber=0,styleNumber=0;
// Resolved opening checks retain the original difference as evidence, not an active cash warning.
html=html.replace('(state.opening.difference?',"(state.opening.difference&&!['linked','recounted'].includes(state.opening.status)?");
html=html.replace(/if\(!one\)\{\s*one=\{id:'LM51-1',value:1,name:FIXED_MAEL_NAME_53,active:true,fixed:true\};\s*state.laborMaelMasters51.unshift\(one\);\s*\}/,'if(!one)return null;');
html=html.replace('one.active=true;','one.active=one.active!==false;');
html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(_,attrs,code)=>{const name=scriptNames[scriptNumber++];if(!name)throw Error('Missing interface script name.');const file=`/js/source/${name}`;fs.writeFileSync('working/pweyon/public'+file,code);return `<script${attrs} src="${file}"></script>`;});
if(scriptNumber!==scriptNames.length)throw Error('Interface script count differs from the filename map.');
html=html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi,(_,attrs,css)=>{const name=styleNames[styleNumber++];if(!name)throw Error('Missing interface style name.');const file=`/css/source/${name}`;fs.writeFileSync('working/pweyon/public'+file,css);return `<link rel="stylesheet" href="${file}">`;});
if(styleNumber!==styleNames.length)throw Error('Interface style count differs from the filename map.');
const bootstrap='@endverbatim\n<meta name="csrf-token" content="{{ csrf_token() }}">\n<script>window.__PWE_BOOT__={{ Illuminate\\Support\\Js::from($bootstrap) }};</script>\n@verbatim\n<script src="/js/server-bootstrap.js"></script>';
html=html.replace(/<script\b/,bootstrap+'\n<script');
html=html.replace(/<\/body>/,'<link rel="stylesheet" href="/css/adjustment-rate-dialog.css">\n<link rel="stylesheet" href="/css/opening-product-picker.css">\n<script src="/js/server-bridge.js"></script><script src="/js/service-rate-settings.js"></script><script src="/js/opening-product-picker.js"></script><script src="/js/loan-interest-policies.js"></script><script src="/js/server-reports.js"></script><link rel="stylesheet" href="/css/list-pagination.css"><script src="/js/list-pagination.js"></script><link rel="stylesheet" href="/css/opening-cash-flow.css"><script src="/js/opening-cash-flow.js"></script><script src="/js/opening-excel-import.js"></script><script src="/js/money-input-format.js"></script></body>');
fs.writeFileSync('working/pweyon/resources/views/workspace.blade.php','@verbatim\n'+html+'\n@endverbatim\n');
console.log('Blade interface generated from the original HTML.');
