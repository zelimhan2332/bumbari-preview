const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx=vm.createContext({window:{}});
for(const f of ['assets/human-data.js','human-viewer.js'])vm.runInContext(fs.readFileSync(`${__dirname}/${f}`,'utf8'),ctx);
const {deform,heightAt,defaults}=ctx.window.humanPreviewModel;
const data=ctx.window.MUELLER_HUMAN_DATA;
function circumference(section,v){
  const points=section.outline.map(([x,z])=>deform(x,section.y,z,v));
  return points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+Math.hypot(p[0]-q[0],p[2]-q[2]);},0);
}
for(const v of [defaults,{...defaults,hip:130},{...defaults,waist:100},{...defaults,bust:120},{...defaults,height:195,hipheight:30}]){
  for(const key of ['hip','waist','bust'])assert.ok(Math.abs(circumference(data.sections[key],v)-v[key])<.01,`${key} must keep its entered circumference`);
  assert.equal(heightAt(170,v),v.height);
  assert.ok(Math.abs(heightAt(110,v)-heightAt(88,v)-v.hipheight)<1e-9);
  let previous=-1;
  for(let y=0;y<=170;y+=.1){const h=heightAt(y,v);assert.ok(h>previous,'height mapping must not fold');previous=h;}
  for(let i=0;i<data.positions.length;i+=3)assert.ok(deform(...data.positions.slice(i,i+3),v).every(Number.isFinite));
}
const larger={...defaults,hip:130};
for(const y of [38,65,95,140])assert.ok(deform(10,y,5,larger)[0]>deform(10,y,5,defaults)[0],`hip change must propagate at y=${y}`);
for(const y of [12,38,65,88,110,124,140,150,160]){
  const e=.001;
  const a=deform(10,y-e,5,larger),b=deform(10,y,5,larger),c=deform(10,y+e,5,larger);
  for(let k=0;k<3;k++)assert.ok(Math.abs((b[k]-a[k])/e-(c[k]-b[k])/e)<.01,'no kink at a body transition');
}
assert.deepEqual(deform(10,65,5,defaults),deform(10,65,5,{...defaults,length:90}),'skirt length must not change anatomy');
console.log('Mannequin: circumferences, coupled proportions, smoothness and height OK');
