const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(`${__dirname}/index.html`,'utf8');
assert(html.includes('<aside class="panel aside" data-mannequin-hidden hidden>'));
assert(html.includes('body .layout{grid-template-columns:minmax(0,1fr)!important}'));
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(`${__dirname}/human-viewer.js`,'utf8'),ctx);
assert.equal(ctx.window.mountHumanMannequin({closest:()=>({})},{},'waist'),false);
for(const id of ['waist','hip','print-scheme','download-scheme-pdf'])assert(html.includes(`id="${id}"`));
console.log('Mannequin hidden: no rendering, full-width layout and drafting controls retained OK');