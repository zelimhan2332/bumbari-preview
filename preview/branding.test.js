const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const html=read('index.html');
assert(html.includes('<title>Bumbari · Лекала по вашим меркам</title>'));
assert(html.includes('class="mark">B<'));
assert(/:root\{[^}]*background:#142d50/.test(html));
assert(html.includes('.brand{color:#fff}'));
assert(!html.includes('Мюллер'));
// Existing storage and project formats remain compatible after rebranding.
assert(html.includes('mueller-preview-v1'));
assert(read('project-ui.js').includes("format:'mueller-project'"));
for(const name of ['pdf-export.js','print-scheme.js']){
 assert(read(name).includes('Bumbari · схема прямой юбки'));
 assert(!read(name).includes('Мюллер · схема'));
}
console.log('Bumbari dark navy branding and legacy storage compatibility: OK');
