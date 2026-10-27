const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');process.chdir(root);
const app='working/pweyon';
const rows=[];
function add(category,file,usedBy,explanation){rows.push({category,file,usedBy,explanation});}
function walk(directory,callback){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=directory+'/'+entry.name;if(entry.isDirectory())walk(file,callback);else callback(file);}}
function applicationFile(file){
 if(file.startsWith(app+'/tests/'))return add('DEVELOPMENT_TEST',file,'PHPUnit / browser fixtures','သီးခြား test database ဖြင့် စမ်းသပ်ရာတွင် အသုံးပြုသည်။');
 if(file.startsWith(app+'/database/'))return add('SETUP_AND_TEST',file,'Laravel migrations / seeders / test factories','Database တည်ဆောက်မှုနှင့် စမ်းသပ်မှုအတွက် ဆက်စပ်ထားသည်။');
 if(file.startsWith(app+'/app/Console/'))return add('CONNECTED_CLI',file,'Artisan','Owner setup၊ workspace setup နှင့် diagnostics အတွက် အသုံးပြုသည်။');
 if(file.startsWith(app+'/app/'))return add('CONNECTED_APPLICATION',file,'Laravel controllers / models / domain services','လက်ရှိ authentication၊ လုပ်ငန်းစည်းမျဉ်း၊ database နှင့် reports ချိတ်ဆက်မှု။');
 if(file.startsWith(app+'/public/'))return add('CONNECTED_WEB',file,'Public entry / Blade asset links / browser requests','လက်ရှိ web application မှ အသုံးပြုသော entry၊ script၊ style သို့မဟုတ် web asset။');
 if(file.startsWith(app+'/resources/'))return add('CONNECTED_VIEW_DATA',file,'WorkspaceController / AuthController / Projection','လက်ရှိမျက်နှာပြင်နှင့် server read model က အသုံးပြုသည်။');
 return add('CONNECTED_FRAMEWORK',file,'Laravel bootstrap / routing / configuration','Laravel framework က load လုပ်သော configuration၊ bootstrap သို့မဟုတ် route ဖြစ်သည်။');
}
for(const directory of ['app','config','database','public','resources','routes'])walk(app+'/'+directory,applicationFile);
walk(app+'/bootstrap',file=>{if(!file.includes('/cache/'))applicationFile(file);});
walk(app+'/tests',applicationFile);
for(const entry of fs.readdirSync(app,{withFileTypes:true})){
 if(!entry.isFile())continue;
 const file=app+'/'+entry.name;
 const category=entry.name==='.env'?'CONNECTED_PRIVATE_CONFIGURATION':['artisan','composer.json','composer.lock'].includes(entry.name)?'CONNECTED_PROJECT_ENTRY':['.env.example'].includes(entry.name)?'SETUP_CONFIGURATION':entry.name.startsWith('.env.')?'DEVELOPMENT_PRIVATE_CONFIGURATION':entry.name.includes('cache')?'GENERATED_DEVELOPMENT':'DEVELOPMENT_METADATA';
 add(category,file,'Application / Composer / Artisan / development tooling','ဖိုင်အကြောင်းအရာနှင့် လျှို့ဝှက်တန်ဖိုးများကို ဤစာရင်းတွင် မထုတ်ထားပါ။');
}
for(const entry of fs.readdirSync('development/tools',{withFileTypes:true}))if(entry.isFile())add('DEVELOPMENT_TOOL','development/tools/'+entry.name,'Developer commands','စမ်းသပ်ခြင်း၊ source စိစစ်ခြင်း၊ interface ထုတ်လုပ်ခြင်း သို့မဟုတ် စာတမ်းထုတ်ခြင်းအတွက်။');
walk('reference',file=>add('REFERENCE_ONLY',file,'Source inspection / interface generator','Application request အတွင်း တိုက်ရိုက် load မလုပ်သော မူရင်းနှင့် ရည်ညွှန်းဖိုင်။'));
for(const directory of ['archive/unused-scaffold','archive/migration-tools','archive/organization-tools'])if(fs.existsSync(directory))walk(directory,file=>add('NOT_RUNTIME_ARCHIVE',file,'Historical reference only','လက်ရှိ application နှင့် မချိတ်ဆက်ထားပါ။ အဟောင်း script များကို ပြန်မ run ပါနှင့်။'));
for(const entry of fs.readdirSync('docs',{withFileTypes:true}))if(entry.isFile()&&!['FILE_CONNECTIONS.csv'].includes(entry.name))add('DOCUMENTATION','docs/'+entry.name,'People / development handoff','လူဖတ်ရန် စာတမ်းနှင့် project မှတ်တမ်း။');
add('CONNECTED_DEPENDENCIES',app+'/vendor/','public/index.php / artisan / Composer autoload','Laravel/PHP dependency ဖိုင်များ။ Composer က စီမံထားသော folder တည်နေရာကို ထိန်းထားသည်။');
add('CONNECTED_GENERATED',app+'/storage/','Laravel sessions / logs / compiled views','Application က ထုတ်ပေးပြီး အသုံးပြုသည့် runtime storage။');
add('CONNECTED_GENERATED',app+'/bootstrap/cache/','Laravel package / service discovery','Framework က ထုတ်ပေးသော cache။');
add('DEVELOPMENT_DEPENDENCIES','development/tools/node_modules/','Development Node scripts','Browser/DOM/PDF/source စမ်းသပ်ရေး dependencies။');
add('DEVELOPMENT_GENERATED_PRIVATE','development/runtime/','Tests / document generators','Preview၊ fixture၊ စမ်းသပ်ရလဒ်နှင့် ယာယီဖိုင်များ။ Git မှ ဖယ်ထားသည်။');
add('ARCHIVED_PRIVATE_BACKUPS','archive/private/','Recovery only','အဟောင်း MySQL data၊ backup နှင့် လျှို့ဝှက် configuration များ။ လက်ရှိ application က မသုံးပါ။ Git မှ ဖယ်ထားသည်။');
add('EVIDENCE','docs/evidence/','Verification records','စမ်းသပ်မှုနှင့် data ရွှေ့ပြောင်းမှု မှတ်တမ်းများ။');
add('DOCUMENTATION','README.md','Workspace setup / folder guide','Project စတင်အသုံးပြုခြင်းနှင့် folder များ၏ ရည်ရွယ်ချက်။');
add('DEVELOPMENT_METADATA','.gitignore','Git ignore configuration','Private backup၊ environment နှင့် generated development ဖိုင်များကို မမျှဝေစေရန်။');
for(const file of ['development/README.md','archive/README.md'])add('DOCUMENTATION',file,'Folder guide','ဤ folder ၏ ရည်ရွယ်ချက်နှင့် အသုံးပြုပုံ။');
rows.sort((a,b)=>a.file.localeCompare(b.file));
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
fs.writeFileSync('docs/FILE_CONNECTIONS.csv','\uFEFF'+[['Category','File','Used by','Explanation'],...rows.map(row=>[row.category,row.file,row.usedBy,row.explanation])].map(row=>row.map(quote).join(',')).join('\r\n'),'utf8');
const blade=fs.readFileSync(app+'/resources/views/workspace.blade.php','utf8');
const assets=[...new Set([...blade.matchAll(/(?:src|href)="(\/(?:js|css)\/[^"?#]+)"/g)].map(match=>match[1]))];
for(const asset of assets)if(!fs.existsSync(app+'/public'+asset))throw Error('Broken active asset link: '+asset);
const manifestPath='docs/evidence/file-organization.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8').replace(/^\uFEFF/,''));
let approvedChangedActiveFiles=0;
for(const file of [...manifest.protectedActiveFiles,...(manifest.addedRuntimeFiles||[]),...manifest.originalReferences]){
 const revision=manifest.currentFileRevisions?.[file.path.replaceAll('\\','/')];
 if(revision&&revision.originalSha256!==file.sha256)throw Error('Invalid original hash in recorded file revision: '+file.path);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
 if(actual!==(revision?.sha256??file.sha256))throw Error('Protected application/reference file changed: '+file.path);
 if(revision&&actual!==file.sha256)approvedChangedActiveFiles++;
}
manifest.validation={protectedActiveFilesUnchanged:manifest.protectedActiveFiles.length-approvedChangedActiveFiles,approvedChangedActiveFiles,addedRuntimeFiles:(manifest.addedRuntimeFiles||[]).length,originalReferencesUnchanged:manifest.originalReferences.length,linkedAssetsPresent:assets.length,listedFileAndFolderEntries:rows.length};
const backupPath='archive/private/pweyon-before-mariadb-20261026.sql';
const originalCopy=JSON.parse(fs.readFileSync('docs/evidence/mariadb-data-copy.json','utf8'));
if(crypto.createHash('sha256').update(fs.readFileSync(backupPath)).digest('hex')!==originalCopy.backupSha256)throw Error('Archived database backup differs from its recorded hash.');
manifest.validation.archivedSqlBackupHashMatches=true;
manifest.additionalMoves=[
 {source:'development/tools/reorganize-workspace.ps1',destination:'archive/organization-tools/reorganize-workspace.ps1',category:'completed-organization-script'},
 {source:'development/tools/update-organized-paths.cjs',destination:'archive/organization-tools/update-organized-paths.cjs',category:'completed-organization-script'}
];
if(fs.existsSync('docs/evidence/organization-phpunit.xml')){
 const suite=fs.readFileSync('docs/evidence/organization-phpunit.xml','utf8').match(/<testsuite\b[^>]*>/)[0];
 manifest.validation.phpunit={tests:Number(suite.match(/tests="(\d+)"/)[1]),assertions:Number(suite.match(/assertions="(\d+)"/)[1]),errors:Number(suite.match(/errors="(\d+)"/)[1]),failures:Number(suite.match(/failures="(\d+)"/)[1])};
}
if(fs.existsSync('docs/evidence/organization-browser.json'))manifest.validation.browserPassed=JSON.parse(fs.readFileSync('docs/evidence/organization-browser.json','utf8')).passed;
if(fs.existsSync('docs/evidence/workspace-password-phpunit.xml')){
 const suite=fs.readFileSync('docs/evidence/workspace-password-phpunit.xml','utf8').match(/<testsuite\b[^>]*>/)[0];
 manifest.validation.workspacePasswordTests={tests:Number(suite.match(/tests="(\d+)"/)[1]),assertions:Number(suite.match(/assertions="(\d+)"/)[1]),errors:Number(suite.match(/errors="(\d+)"/)[1]),failures:Number(suite.match(/failures="(\d+)"/)[1])};
}
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2),'utf8');
console.log(JSON.stringify(manifest.validation));
