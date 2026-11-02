const assert=require('node:assert/strict'),K=require('./half-circle-kit'),P=require('./dynamic-pattern'),J=require('./project-file');
const close=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const v={waist:72,hip:100,hipHeight:20.8,length:61.5},k=K.buildCircle(v);
close(k.radius,73/(2*Math.PI));close(k.audit.waistSeam,73);close(k.audit.halfWaist,36.5);close(k.audit.beltError,0);
assert.equal(k.fullAngle,360);assert.equal(k.pieces[0].count,2);assert.equal(k.pieces[0].onFold,false);
const arc=K.arc(k.radius,-Math.PI/2,Math.PI/2);let length=0;for(let i=1;i<arc.length;i++)length+=Math.hypot(arc[i].x-arc[i-1].x,arc[i].y-arc[i-1].y);close(length*2,73,.01);
const cut=k.pieces[0].cut;close(cut[0].x,-1);close(cut.at(-1).x,-1);
close(Math.hypot(cut[0].x,cut[0].y),k.radius-1);close(Math.hypot(cut.at(-1).x,cut.at(-1).y),k.hemRadius+1);
assert.equal(cut.filter(p=>Math.abs(p.x+1)<1e-8).length,4,'Both side seams get allowances');
close(k.layout.skirtWidth,2*(k.hemRadius+1));close(k.layout.skirtLength,2*(k.hemRadius+2));
assert.equal(K.buildCircle(v,{fabricWidth:150}).layout.fits,true);
assert.equal(K.buildCircle(v,{fabricWidth:140}).layout.fits,false);
assert.ok(K.build(v).radius>k.radius);
for(const values of [v,{waist:40,hip:60,hipHeight:10,length:20},{waist:180,hip:200,hipHeight:40,length:140}]){
 const d=K.buildCircle(values,values.length===20?{zipperLength:10}:{}),a=K.artwork(d);
 for(const f of ['a4','plotter']){
  const pages=P.pages(a,f),sq=a.square;assert.ok(pages.some(p=>sq.x>=p.x&&sq.x+100<=p.x+p.width-20&&sq.y>=p.y&&sq.y+100<=p.y+p.height-20));
  for(const c of a.cmd.filter(c=>c[0]==='L'))for(const [x,y]of [[c[1],c[2]],[c[3],c[4]]])assert.ok(x>=0&&x<=a.width&&y>=0&&y<=a.height&&pages.some(p=>x>=p.x&&x<=p.x+p.width-20&&y>=p.y&&y<=p.y+p.height-20));
  const text=new TextDecoder().decode(P.pdf(a,pages));assert.match(text,/FULL-CIRCLE SKIRT/);assert.match(text,/CUT 2 SEMICIRCLES/);assert.ok(!text.includes('HALF-CIRCLE SKIRT'));assert.ok(!text.includes('FOLD / NO ALLOWANCE'));
 }
}
const project={format:'mueller-project',version:1,units:'cm',name:'Солнце',item:'skirt180',measurements:v,fullCircle:K.settings({beltWidth:4}),material:'woven',hipEaseHalf:1,notes:'Проверить отвисание'};
assert.deepEqual(J.parseProject(JSON.stringify(project)),project);
assert.throws(()=>J.validateProject({...project,halfCircle:{}}));assert.throws(()=>J.validateProject({...project,item:'skirt90'}));
assert.throws(()=>J.validateProject({...project,material:'stretch'}));
console.log('Full-circle kit: 2 semicircles, side allowances, matching belt, layout, A4/A0 coverage, JSON isolation OK');
