const assert=require('node:assert/strict');
const {flareControl}=require('./skirt-flare');
const example={frontCuts:[3,3],frontSide:3,backCuts:[3,3],backSide:3};
const r=flareControl(example);
assert.equal(r.frontTotal,9);assert.equal(r.backTotal,9);assert(r.balanced);assert.equal(r.cutReady,false);
assert(flareControl({...example,backCuts:[6],backSide:3}).balanced);
const mismatch=flareControl({...example,backSide:2});assert(!mismatch.balanced);assert.equal(mismatch.difference,1);
for(const override of [{frontCuts:[]},{frontCuts:[NaN]},{backCuts:[-1]},{frontSide:-1},{backSide:Infinity},{frontCuts:[0],frontSide:0}])assert.throws(()=>flareControl({...example,...override}));
console.log('Flare distribution: book 9 cm control, unequal totals and invalid inputs OK');