const assert=require('node:assert/strict');
const K=require('./skirt-kit'),P=require('./dynamic-pattern'),Project=require('./project-file'),{printReadiness}=require('./print-readiness');
const v={waist:72,hip:100,hipHeight:20.8,length:61.5,hipEaseHalf:1,material:'woven'},options={vent:{width:5,ventLength:16}};
function check(values,settings){
 const k=K.build(values,settings),[f,b,belt]=k.pieces;
 for(const p of k.pieces){assert(K.simple(p.cut));assert(p.cut.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));}
 assert.equal(f.count,1);assert(f.onFold);assert.equal(b.count,2);assert.equal(b.onFold,false);
 assert(Math.abs(k.audit.beltSeam-(values.waist+2))<.001);
 assert(Math.abs(2*(k.audit.frontWaist+k.audit.backWaist)-k.audit.beltSeam)<1e-8);
 assert(Math.abs(belt.length-3-k.audit.beltSeam)<1e-8);
 assert(Math.abs(k.audit.sideError)<.001);assert.equal(k.audit.cutReady,false);
 const fb=K.bounds(f.cut),bb=K.bounds(b.cut),cb=K.bounds(belt.cut),s=k.settings.allowances?k.settings.seamAllowance:0,h=k.settings.allowances?k.settings.hemAllowance:0;
 assert(Math.abs(fb.minX)<1e-8,'fold never gains a seam allowance');
 assert(Math.abs(fb.maxY-values.length-h)<1e-8);assert(Math.abs(bb.maxY-values.length-h)<1e-8);
 assert(Math.abs(cb.maxX-cb.minX-belt.length-2*s)<1e-8);assert(Math.abs(cb.maxY-cb.minY-belt.width-2*s)<1e-8);
 if(k.settings.vent){assert.equal(bb.minX,-k.settings.vent.width,'vent total width must not double-count seam allowance');assert(b.cut.some(p=>p.x===-k.settings.vent.width&&p.y===values.length-k.settings.vent.ventLength-2));}else assert(Math.abs(bb.minX+s)<1e-8);
 const a=K.artwork(k);assert(K.svg(a).includes('спинка и пояс'));assert(K.svg(a,'B').includes(a.panels.B.join(' ')));
 const beltOriginX=a.panels.C[0]+3-cb.minX*10,beltOriginY=a.panels.C[1]+12-cb.minY*10;
 for(const waistPosition of [k.audit.backWaist,k.audit.backWaist+k.audit.frontWaist,k.audit.backWaist+2*k.audit.frontWaist])assert(a.cmd.some(c=>c[0]==='L'&&Math.abs(c[1]-beltOriginX-waistPosition*10)<1e-7&&Math.abs(c[2]-beltOriginY)<1e-7&&Math.abs(c[4]-beltOriginY-5)<1e-7),'waistband notches match actual front and back waist seams');
 for(const format of ['a4','plotter']){
  const pages=P.pages(a,format),bytes=P.pdf(a,pages),pdf=Buffer.from(bytes).toString();
  assert(pdf.startsWith('%PDF-1.4'));assert(pdf.includes(`/Count ${pages.length}`));assert(pdf.includes('FRONT / CUT 1 ON FOLD'));assert(pdf.includes('BACK / CUT 2 MIRRORED'));assert(pdf.includes('WAISTBAND / CUT 1'));
  assert(pdf.includes('[5.6693 2.8346] 0 d'),'seam dash expressed in real PDF units');
  assert(pages.at(-1).x+pages.at(-1).width-20>=a.width-10);assert(pages.at(-1).y+pages.at(-1).height-20>=a.height-10);
 }
 const square=a.cmd.filter(c=>c[0]==='T'&&c[3]==='CONTROL 100 x 100 mm')[0],sx=square[1],sy=square[2]+5;
 assert(P.pages(a,'a4').some(t=>sx>=t.x&&sy>=t.y&&sx+100<=t.x+190&&sy+100<=t.y+277),'entire 100 mm control square fits on a single A4 sheet');
 for(const expected of [['L',sx,sy,sx+100,sy],['L',sx+100,sy,sx+100,sy+100]])assert(a.cmd.some(c=>JSON.stringify(c)===JSON.stringify(expected)),'100 mm square');
 return k;
}
const normal=check(v,options),bare=check(v,{...options,allowances:false});assert.notDeepEqual(normal.pieces[0].cut,bare.pieces[0].cut);
check({...v,waist:76},options);check({...v,waist:80,hip:108,hipHeight:23,length:70},options);
check(v,{});check(v,{...options,seamAllowance:1,hemAllowance:2,zipperLength:18});
for(const bad of [{seamAllowance:0},{hemAllowance:NaN},{zipperLength:25},{vent:{width:3,ventLength:16}},{vent:{width:5,ventLength:50}},{vent:{width:5,ventLength:40}},{modeling:{hemReduction:1}}])assert.throws(()=>K.build(v,bad));
assert.throws(()=>K.build({...v,material:'stretch'},options));assert.throws(()=>K.build({...v,waist:70,hip:140},options));
assert(printReadiness({reference:true,vent:options.vent,completeKit:true}).allowed);assert(!printReadiness({reference:false,vent:options.vent,completeKit:true}).allowed);
assert(!printReadiness({reference:true,modeling:{hemReduction:1},completeKit:true}).allowed);
const saved={format:'mueller-project',version:1,units:'cm',name:'Юбка со шлицей',item:'skirt',measurements:{height:170,bust:92,waist:72,hip:100,hipheight:20.8,length:61.5},material:'woven',hipEaseHalf:1,notes:'Макет',vent:options.vent,skirtKit:{allowances:true,seamAllowance:2,hemAllowance:4,zipperLength:20}};
assert.deepEqual(Project.parseProject(JSON.stringify(saved)),saved);
for(const skirtKit of [null,{...saved.skirtKit,allowances:'true'},{...saved.skirtKit,seamAllowance:3},{...saved.skirtKit,hemAllowance:0},{...saved.skirtKit,zipperLength:30}])assert.throws(()=>Project.validateProject({...saved,skirtKit}));
console.log('Straight skirt kit: seam matching, fold, allowances, vent width, full pieces, A4/A0 tiles, scale, project round trip and blocked unsupported inputs OK');
