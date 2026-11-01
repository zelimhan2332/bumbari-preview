const assert=require('node:assert/strict');
const {bookSkirtSteps}=require('./book-skirt-steps');
const base={hip:100,hipHeight:20.8,length:61.5};
for(const [waist,total,parts] of [[76,12,'7 + 2 + 3'],[72,14,'7 + 2 + 3 + 2']]){
 const r=bookSkirtSteps({...base,waist});
 assert(r.reference);assert.equal(r.steps.length,5);
 assert(r.steps[3].text.includes(`${total} = ${parts}`));
 assert(r.steps[0].text.includes('51'));assert(r.steps[1].text.includes('25,5'));
 assert(r.steps[4].text.includes('Закрыть вытачки'));
}
const custom=bookSkirtSteps({...base,waist:80});
assert(!custom.reference);assert(custom.steps[3].text.includes('экспериментальное'));
assert.throws(()=>bookSkirtSteps({...base,waist:110}));
console.log('Book steps: both visually verified numeric examples and custom-case warning OK');