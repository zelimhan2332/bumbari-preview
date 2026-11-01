const assert=require('node:assert/strict');
const {calculateSkirtReference}=require('./skirt-calculation');
const {buildSkirtGeometry,rotate,curveLength}=require('./skirt-geometry');
assert.ok(Math.abs(curveLength({a:{x:0,y:0},c1:{x:1,y:4/3},c2:{x:2,y:8/3},b:{x:3,y:4}})-5)<1e-9);
function polylineLength(c){let length=0,last=c.a;for(let i=1;i<=20000;i++){const t=i/20000,u=1-t,p={x:u**3*c.a.x+3*u*u*t*c.c1.x+3*u*t*t*c.c2.x+t**3*c.b.x,y:u**3*c.a.y+3*u*u*t*c.c1.y+3*u*t*t*c.c2.y+t**3*c.b.y};length+=Math.hypot(p.x-last.x,p.y-last.y);last=p;}return length;}
for(const waist of [76,72]){
  const values={waist,hip:100,hipHeight:20.8,length:61.5};
  const c=calculateSkirtReference(values),g=buildSkirtGeometry(values,c);
  for(const part of [g.front,g.back])for(const curve of [...part.waist,part.side])assert.ok(Math.abs(curveLength(curve)-polylineLength(curve))<1e-5,'independent sampled length check');
  assert.equal(g.audit.waistPass,false,'reference curve discrepancy must remain visible');
  assert.equal(g.audit.cutReady,false);
  assert.equal(g.audit.sidePass,waist===76);
  assert.equal(g.front.darts[0].left.y,-.6);
  assert.equal(g.front.end.x-g.front.darts[0].tip.x,7,'front dart offset measured from shaped waist side seam');
  assert.equal(g.front.darts[0].tip.x,waist===76?15:14.5);
  assert.equal(g.front.darts[0].tip.y,9.5);
  assert.equal(g.back.darts.length,waist===72?2:1);
  if(waist===72){assert.equal(g.sideShift,.5);assert.equal(g.back.darts[1].tip.x,19.5);assert.equal(g.back.darts[0].tip.x,11.25);assert.equal(g.back.darts[1].rise,.35);}
  for(const part of [g.front,g.back])for(const d of part.darts){
    const closed=rotate(d.right,d.closeAngle,d.tip);
    assert.ok(Math.hypot(closed.x-d.left.x,closed.y-d.left.y)<1e-10,'dart legs must coincide after closure');
    const leftAngle=Math.atan(d.leftSlope),rightAngle=Math.atan(d.rightSlope)+d.closeAngle;
    assert.ok(Math.abs(leftAngle-rightAngle)<1e-10,'waist tangents must match on the folded dart');
  }
  assert.equal(c.darts.side+c.darts.front+c.darts.back.reduce((a,b)=>a+b,0),c.intake);
}
const custom={waist:90,hip:120,hipHeight:24,length:70};
assert.equal(buildSkirtGeometry(custom,calculateSkirtReference(custom)),null,'unsupported figures cannot receive unverified dart geometry');
console.log('Source points, dart closure and folded-waist tangency: OK');
