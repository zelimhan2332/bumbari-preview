const assert = require('node:assert/strict');
global.calculateSkirtReference = require('./skirt-calculation').calculateSkirtReference;
const { buildSkirtDrawing } = require('./skirt-drawing');

const reference = buildSkirtDrawing({waist:76,hip:100,hipHeight:20.8,length:61.5,hipEaseHalf:1,material:'woven'});
assert.equal(reference.width,51);
assert.equal(reference.half,25.5);
assert.equal(reference.exact,true);
assert.equal((reference.svg.match(/class="dart"/g)||[]).length,2);
assert.match(reference.svg,/Линия бёдер/);

const second = buildSkirtDrawing({waist:72,hip:100,hipHeight:20.8,length:61.5,hipEaseHalf:1,material:'woven'});
assert.equal((second.svg.match(/class="dart"/g)||[]).length,3);

const custom = buildSkirtDrawing({waist:88,hip:118,hipHeight:24,length:75,hipEaseHalf:2,material:'woven'});
assert.equal(custom.width,61);
assert.equal(custom.exact,false);
assert.doesNotMatch(custom.svg,/class="dart"/);
assert.notEqual(custom.svg,reference.svg);
const values={waist:72,hip:100,hipHeight:20.8,length:61.5,hipEaseHalf:1,material:'woven'};
for(let stage=0;stage<4;stage++){
  const svg=buildSkirtDrawing(values,{stage}).svg;
  assert.equal((svg.match(/class="dart"/g)||[]).length,stage===3?3:0);
  assert.equal((svg.match(/class="guide"/g)||[]).length,stage>=1?2:0);
}
const front=buildSkirtDrawing(values,{piece:'front',dimension:'length'}).svg;
const back=buildSkirtDrawing(values,{piece:'back',dimension:'hipHeight'}).svg;
assert.equal((front.match(/class="dart"/g)||[]).length,1);
assert.equal((back.match(/class="dart"/g)||[]).length,2);
assert.doesNotMatch(front,/Заднее полотнище/);
assert.doesNotMatch(back,/Переднее полотнище/);
assert.match(front,/class="highlight"/);
assert.match(back,/class="highlight"/);
assert.doesNotMatch(buildSkirtDrawing({waist:88,hip:118,hipHeight:24,length:75},{stage:3,piece:'back'}).svg,/class="dart"/);
console.log('Skirt drawing reference, second dart, and custom grid: OK');
