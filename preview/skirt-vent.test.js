const assert=require('node:assert/strict');
const {buildVent}=require('./skirt-vent');
for(const width of [4,5,7]){
 const v=buildVent({length:50,hipHeight:20.8,width});
 assert.equal(v.top,34);assert.equal(v.outline[1].x,width);
 assert.equal(v.outline[2].y-v.outline[1].y,16);
 assert.equal(v.stitchGuide[0].y-v.stitchGuide[1].y,1.5);
 assert.equal(v.cutReady,false);assert.equal(v.allowancesIncluded,false);
}
for(const args of [{width:3},{width:8},{ventLength:0},{ventLength:40},{length:20},{width:NaN}])assert.throws(()=>buildVent({length:50,hipHeight:20.8,...args}));
console.log('Vent: source extension widths, 16 cm example, top position and invalid inputs OK');