const assert=require('node:assert/strict');
const {buildWaistband}=require('./waistband');
for(const waistSeam of [74,78,82])for(const finishedWidth of [2,3,5]){
 const b=buildWaistband({waistSeam,finishedWidth});
 assert.equal(b.length,waistSeam+3);assert.equal(b.cutWidth,finishedWidth*2);
 assert.equal(b.length-b.overlap,waistSeam);assert.equal(b.seamAllowances,false);
 assert(b.source.includes('PDF 9'));
}
for(const finishedWidth of [0,1,5.1,NaN])assert.throws(()=>buildWaistband({waistSeam:78,finishedWidth}));
for(const waistSeam of [0,-10,NaN,Infinity])assert.throws(()=>buildWaistband({waistSeam}));
assert.throws(()=>buildWaistband({waistSeam:78,overlap:5}));
console.log('Straight waistband: source width, fold, overlap and seam matching OK');