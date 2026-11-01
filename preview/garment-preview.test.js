const assert=require('node:assert/strict');
global.window=global;
require('./assets/human-data.js');
const {skirtEnvelope}=require('./garment-preview.js');
const sections=MUELLER_HUMAN_DATA.sections;
const v={height:170,waist:72,hip:100,hipheight:20.8,length:61.5};
const base=skirtEnvelope(v,sections);
assert.ok(base.positions.every(Number.isFinite));
assert.ok(base.indices.every(i=>Number.isInteger(i)&&i>=0&&i<base.positions.length/3));
assert.ok(Math.abs(base.top-base.bottom-v.length)<1e-9);
// Every angle must reach the surface: the rear half must not collapse into the axis.
for(const row of [0,base.rows]){
  const ring=Array.from({length:base.segments},(_,j)=>base.positions.slice((row*base.segments+j)*3,(row*base.segments+j)*3+3));
  const centerZ=ring.reduce((sum,p)=>sum+p[2],0)/ring.length;
  for(const p of ring)assert.ok(Math.hypot(p[0],p[2]-centerZ)>5,'collapsed garment contour');
  for(let j=0;j<ring.length;j++){
    const mirror=ring[(base.segments/2-j+base.segments)%base.segments];
    assert.ok(Math.abs(ring[j][0]+mirror[0])<.15,'left/right symmetry');
    const next=ring[(j+1)%ring.length];
    assert.ok(Math.hypot(ring[j][0]-next[0],ring[j][2]-next[2])<3,'broken circumferential seam');
  }
}
const ringWidth=(g,row)=>{const xs=Array.from({length:g.segments},(_,j)=>g.positions[(row*g.segments+j)*3]);return Math.max(...xs)-Math.min(...xs);};
const largerHip=skirtEnvelope({...v,hip:125},sections);
assert.equal(ringWidth(base,0),ringWidth(largerHip,0),'hip must not silently change waist');
assert.ok(ringWidth(largerHip,base.rows)>ringWidth(base,base.rows));
const longer=skirtEnvelope({...v,length:80},sections);
assert.equal(longer.top,base.top);
assert.ok(Math.abs(longer.bottom-base.bottom+18.5)<1e-9);
assert.equal(ringWidth(longer,longer.rows),ringWidth(base,base.rows));
assert.ok(ringWidth(skirtEnvelope(v,sections,{hipEaseHalf:2}),base.rows)>ringWidth(base,base.rows));
for(const invalid of [{length:150},{length:10},{waist:120},{height:NaN}])assert.equal(skirtEnvelope({...v,...invalid},sections),null);
console.log('Garment preview: topology, dimensions, ease and invalid measurements OK');
