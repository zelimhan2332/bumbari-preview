const assert=require('node:assert/strict');
const K=require('./half-circle-kit'),P=require('./dynamic-pattern'),Project=require('./project-file');
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const v={waist:72,hip:100,hipHeight:20.8,length:61.5};
const k=K.build(v);
close(k.radius,73/Math.PI);close(k.audit.waistSeam,73);close(k.audit.halfWaist,36.5);
close(k.audit.beltError,0);close(k.belt.length,76);close(k.belt.cutWidth,6);
close(k.audit.backSeam,61.5);
// Actual sampled waist length is accurate to below 0.1 mm, independently of audit.
let sum=0;const arc=K.arc(k.radius,0,Math.PI/2);
for(let i=1;i<arc.length;i++)sum+=Math.hypot(arc[i].x-arc[i-1].x,arc[i].y-arc[i-1].y);
close(sum,k.audit.halfWaist,.01);
const cut=k.pieces[0].cut,inner=k.radius-1,outer=k.hemRadius+1;
close(cut[0].x,0);close(cut[0].y,inner);close(cut.at(-1).x,0);close(cut.at(-1).y,outer);
const back=cut.filter(p=>Math.abs(p.y+1)<1e-8);assert.equal(back.length,2);
close(Math.hypot(back[0].x,back[0].y),inner);close(Math.hypot(back[1].x,back[1].y),outer);
for(const p of cut)assert.ok(p.x>=-1e-8&&p.y>=-1.000001);
assert.equal(k.audit.cutReady,false);
assert.equal(k.layout.fits,true);assert.equal(K.build(v,{fabricWidth:70}).layout.fits,false);
// Mirroring across the CF fold doubles the width, with grain along CF.
close(k.layout.skirtWidth,2*(k.hemRadius+k.settings.hemAllowance));
close(k.layout.skirtLength,k.hemRadius+k.settings.hemAllowance+k.settings.seamAllowance);
assert.equal(K.build(v,{fabricWidth:150}).layout.fits,false);
for(const values of [v,{waist:40,hip:60,hipHeight:10,length:20},{waist:180,hip:200,hipHeight:40,length:140}]){
 const opts=values.length===20?{zipperLength:10}:{};
 const kit=K.build(values,opts),art=K.artwork(kit);
 for(const format of ['a4','plotter']){
  const pages=P.pages(art,format);assert.ok(pages.length);
  for(const c of art.cmd.filter(c=>c[0]==='L'))for(const [x,y] of [[c[1],c[2]],[c[3],c[4]]]){
   assert.ok(x>=0&&x<=art.width&&y>=0&&y<=art.height,'art bounds');
   assert.ok(pages.some(p=>x>=p.x&&x<=p.x+p.width-20&&y>=p.y&&y<=p.y+p.height-20),'tile coverage');
  }
  const sq=art.square;assert.ok(pages.some(p=>sq.x>=p.x&&sq.x+100<=p.x+p.width-20&&sq.y>=p.y&&sq.y+100<=p.y+p.height-20),'square fits one page');
  const pdf=P.pdf(art,pages),text=new TextDecoder().decode(pdf);
  assert.match(text,/HALF-CIRCLE SKIRT/);assert.match(text,/WAISTBAND/);assert.ok(!text.includes('STRAIGHT SKIRT'));
  // 100mm line in PDF units equals 283.4646pt; compare encoded endpoints.
  const page=pages.find(p=>sq.x>=p.x&&sq.x+100<=p.x+p.width-20&&sq.y>=p.y&&sq.y+100<=p.y+p.height-20);
  const x1=(sq.x-page.x+10)*72/25.4,x2=(sq.x+100-page.x+10)*72/25.4;
  assert.ok(text.includes(x1.toFixed(4))&&text.includes(x2.toFixed(4)));
  close(x2-x1,283.46456692913387);
 }
}
for(const options of [{waistEase:-1},{seamAllowance:NaN},{hemAllowance:5},{beltWidth:6},{zipperLength:35},{fabricWidth:0},null]){
 if(options?.zipperLength===35)assert.throws(()=>K.build({...v,length:25,hipHeight:15},options));else assert.throws(()=>K.build(v,options));
}
assert.throws(()=>K.build({waist:40,hip:200,hipHeight:10,length:60}));
const project={format:'mueller-project',version:1,units:'cm',name:'Полусолнце',item:'skirt90',measurements:v,halfCircle:K.settings({waistEase:2,hemAllowance:2,beltWidth:4}),material:'woven',hipEaseHalf:1,notes:'Проверить низ'};
assert.deepEqual(Project.parseProject(JSON.stringify(project)),project);
assert.throws(()=>Project.validateProject({...project,vent:{width:5,ventLength:16}}));
assert.throws(()=>Project.validateProject({...project,material:'stretch'}));
assert.throws(()=>Project.validateProject({...project,halfCircle:{waistEase:'2'}}));
console.log('Half-circle kit: true arc lengths, analytic allowances, fold, belt matching, tiles/100mm scale, project round trip OK');
