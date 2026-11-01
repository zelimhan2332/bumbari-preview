const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=vm.createContext({window:{},console});
for(const name of ['assets/human-data.js','garment-preview.js','human-viewer.js','human-software.js'])vm.runInContext(fs.readFileSync(`${__dirname}/${name}`,'utf8'),ctx);
const r=ctx.window.renderHumanSoftware,v=ctx.window.humanPreviewModel.defaults;
const front=r(v,'waist');
assert(front.includes('человеческая модель'));
assert(!front.includes('NaN'));
for(const key of ['height','bust','waist','hip','hipheight'])assert.notEqual(front,r({...v,[key]:v[key]+10},key),key);
assert.notEqual(front,r(v,'waist',{},'side'));
assert.notEqual(front,r(v,'waist',{},'back'));
// No WebGL library: mounting must still show the SAME human mesh, not a cartoon.
const container={dataset:{},innerHTML:''};
assert(ctx.window.mountHumanMannequin(container,v,'waist',{}));
assert(container.innerHTML.includes('человеческая модель'));
const previous=container.innerHTML;
ctx.window.setMannequinView('side');
assert.notEqual(container.innerHTML,previous);
console.log('CPU human mesh: all measurements, three views and WebGL-free mounting OK');