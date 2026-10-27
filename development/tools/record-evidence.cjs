const fs=require('node:fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('development/runtime/login-response.html','utf8');assert.match(html,/name=["']_token["']/);assert.match(html,/<form[^>]+method="post"/i);
assert.equal(fs.readFileSync('development/runtime/http-status.txt','utf8').replace(/^\uFEFF/,'').trim(),'200');
const ui=JSON.parse(fs.readFileSync('development/runtime/interface-results.json','utf8'));assert.equal(ui.errors.length,0);
fs.copyFileSync('development/runtime/interface-results.json','docs/evidence/interface-results.json');
fs.writeFileSync('docs/evidence/http-smoke.json',JSON.stringify({url:'http://127.0.0.1:8000/login',status:200,form:true,csrfField:true,description:'Anonymous login HTTP smoke check; existing owner account preserved.'},null,2));
console.log('Login HTTP smoke: PASS; form and CSRF field present. DOM checks: PASS; '+ui.commands.length+' intents captured.');
