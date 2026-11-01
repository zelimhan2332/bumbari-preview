const assert=require('node:assert/strict');
const {taperSkirt}=require('./skirt-modeling');
const base={halfWidth:25.5,hipHeight:20.8,length:61.5};
for(const startBelowHip of [8,9,10])for(const hemReduction of [0,1,2]){
 const t=taperSkirt({...base,startBelowHip,hemReduction});
 assert.equal(t.startY,20.8+startBelowHip);
 assert.equal(t.hemWidth,25.5-hemReduction);
 assert.equal(t.fullHemReduction,hemReduction*4);
 assert.equal(t.front[0].x,25.5);assert.equal(t.back[0].x,0);
 assert(Math.abs(t.front[2].x-t.front[1].x+hemReduction)<1e-9);
 assert.equal(t.back[2].x-t.back[1].x,hemReduction);
 const len=p=>p.slice(1).reduce((s,q,i)=>s+Math.hypot(q.x-p[i].x,q.y-p[i].y),0);
 assert(Math.abs(len(t.front)-len(t.back))<1e-9);
 assert(Math.abs(len(t.front)-t.sideBelowHip)<1e-9);
 assert.equal(t.needsVent,hemReduction>0);assert.equal(t.cutReady,false);
}
for(const override of [{startBelowHip:7},{startBelowHip:11},{hemReduction:-1},{hemReduction:3},{length:28},{halfWidth:0},{hipHeight:NaN}])assert.throws(()=>taperSkirt({...base,...override}));
console.log('Tapered skirt: source start depth, preserved hips, symmetric side lengths and safety limits OK');