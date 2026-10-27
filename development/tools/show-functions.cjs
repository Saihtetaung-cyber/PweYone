const fs=require('node:fs');const rows=JSON.parse(fs.readFileSync('reference/extracted/mutations.json'));
const names=process.argv.slice(2);for(const x of rows)if(names.includes(x.name)||names.includes(x.script+':'+x.name))console.log('\nSCRIPT '+x.script+' '+x.name+'\n'+x.body);
