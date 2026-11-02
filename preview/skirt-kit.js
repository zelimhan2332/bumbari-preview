/* Straight, unlined skirt kit. Atelier 2001 PDF5-7,9,16; cm internally.
   Source: seam allowances 2 cm, hem 4 cm; folded waistband 3 cm + overlap 3 cm.
   Sampling, offset joins and dart-cap arcs are documented engineering choices.
   Physical print and fitting remain independent acceptance gates. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined';
 const P=node?require('./dynamic-pattern'):root.MuellerPattern;
 const E=node?require('./skirt-geometry'):root.MuellerSkirtGeometry;
 const beltBuilder=node?require('./waistband').buildWaistband:root.buildWaistband;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const cross=(a,b)=>a.x*b.y-a.y*b.x;
 const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
 function cubic(c,t){const u=1-t;return {x:u*u*u*c.a.x+3*u*u*t*c.c1.x+3*u*t*t*c.c2.x+t*t*t*c.b.x,y:u*u*u*c.a.y+3*u*u*t*c.c1.y+3*u*t*t*c.c2.y+t*t*t*c.b.y};}
 function sample(c){
  // Subdivide until the midpoint and quarter points are within 0.02 mm of a chord.
  const out=[c.a],error=(p,a,b)=>Math.abs(cross(sub(b,a),sub(p,a)))/Math.max(dist(a,b),1e-12);
  function visit(t0,t1,a,b,depth){const mid=(t0+t1)/2,m=cubic(c,mid),q1=cubic(c,(3*t0+t1)/4),q3=cubic(c,(t0+3*t1)/4);
   if(depth<16&&Math.max(error(m,a,b),error(q1,a,b),error(q3,a,b))>.002){visit(t0,mid,a,m,depth+1);visit(mid,t1,m,b,depth+1);}else out.push(b);
  }visit(0,1,c.a,c.b,0);return out;
 }
 function simple(poly){
  for(let i=0;i<poly.length;i++)for(let j=i+2;j<poly.length;j++){
   if(i===0&&j===poly.length-1)continue;
   const a=poly[i],b=poly[(i+1)%poly.length],c=poly[j],d=poly[(j+1)%poly.length],ab=sub(b,a),cd=sub(d,c),den=cross(ab,cd);
   if(Math.abs(den)<1e-10)continue;
   const t=cross(sub(c,a),cd)/den,u=cross(sub(c,a),ab)/den;
   if(t>1e-7&&t<1-1e-7&&u>1e-7&&u<1-1e-7)return false;
  }return true;
 }
 function offset(poly,amounts){
  const area=poly.reduce((n,a,i)=>n+cross(a,poly[(i+1)%poly.length]),0);
  if(area<=0)throw Error('Неверное направление контура детали.');
  const lines=poly.map((a,i)=>{const b=poly[(i+1)%poly.length],v=sub(b,a),len=dist(a,b),s=amounts[i];if(len<1e-9)throw Error('Нулевой участок контура.');return {a:{x:a.x+v.y/len*s,y:a.y-v.x/len*s},v};});
  const result=poly.map((p,i)=>{const prev=lines[(i+lines.length-1)%lines.length],next=lines[i],den=cross(prev.v,next.v);
   if(Math.abs(den)<1e-9){if(Math.abs(amounts[i]-amounts[(i+poly.length-1)%poly.length])>1e-7)throw Error('Не удалось соединить разные припуски.');return next.a;}
   const t=cross(sub(next.a,prev.a),next.v)/den,q={x:prev.a.x+prev.v.x*t,y:prev.a.y+prev.v.y*t};
   if(dist(p,q)>12)throw Error('Острый угол припуска требует ручного уточнения.');return q;
  });
  if(!simple(result))throw Error('Припуски пересекаются: проверьте мерки и ширину припуска.');return result;
 }
 function normalized(part,half,back){
  const point=p=>({x:back?half-p.x:p.x,y:p.y});
  const curve=c=>back?{a:point(c.b),c1:point(c.c2),c2:point(c.c1),b:point(c.a)}:c;
  const waist=(back?[...part.waist].reverse():part.waist).map(curve);
  const darts=part.darts.map(d=>({left:point(back?d.right:d.left),right:point(back?d.left:d.right),tip:point(d.tip)})).sort((a,b)=>a.left.x-b.left.x);
  return {waist,darts,side:back?curve(part.side):part.side};
 }
 function makePiece(part,values,half,back,settings){
  const n=normalized(part,half,back),seam=[],kinds=[];
  const add=(p,kind)=>{if(seam.length&&dist(seam.at(-1),p)<1e-8)return;if(seam.length)kinds.push(kind);seam.push(p);};
  n.waist.forEach((c,i)=>{
   if(i){const d=n.darts[i-1],a=Math.atan2(d.left.y-d.tip.y,d.left.x-d.tip.x),b=Math.atan2(d.right.y-d.tip.y,d.right.x-d.tip.x),r=dist(d.left,d.tip);
    // Retain fabric above each dart; do not cut a V into its intake.
    const count=Math.max(4,Math.ceil(Math.abs(b-a)*r/.1));
    for(let j=1;j<count;j++){const t=a+(b-a)*j/count;add({x:d.tip.x+r*Math.cos(t),y:d.tip.y+r*Math.sin(t)},'waist');}
    add(d.right,'waist');
   }
   sample(c).forEach(p=>add(p,'waist'));
  });
  sample(n.side).forEach(p=>add(p,'side'));
  add({x:half,y:values.length},'side');add({x:0,y:values.length},'hem');kinds.push(back?'center':'fold');
  const s=settings.allowances?settings.seamAllowance:0,h=settings.allowances?settings.hemAllowance:0;
  const cut=offset(seam,kinds.map(kind=>kind==='fold'?0:kind==='hem'?h:s));
  if(back&&settings.vent){
   const top=values.length-settings.vent.ventLength,width=settings.vent.width;
   if(width<=s)throw Error('Припуск шлицы должен быть шире припуска среднего шва.');
   // The source's 4-7 cm is the TOTAL vent extension, not an extra seam allowance.
   const end=cut.at(-1),upper=cut[0],raise=2;
   if(top-raise<=settings.zipperLength+1)throw Error('Между концом молнии и началом припуска шлицы нужен участок среднего шва. Уменьшите шлицу или молнию.');
   if(end.x< -width||Math.abs(end.y-(values.length+h))>1e-5)throw Error('Не удалось соединить низ со шлицей.');
   cut.splice(cut.length-1,1,{x:-width,y:end.y},{x:-width,y:top-raise},{x:upper.x,y:top-raise});
  }
  if(!simple(cut))throw Error('Контур детали пересекается.');
  return {id:back?'B':'A',name:back?'BACK / CUT 2 MIRRORED':'FRONT / CUT 1 ON FOLD',count:back?2:1,onFold:!back,seam,cut,kinds,darts:n.darts,waist:n.waist,side:n.side,hipHeight:values.hipHeight,length:values.length,halfWidth:half};
 }
 function build(values,options={}){
  const settings={allowances:options.allowances??true,seamAllowance:options.seamAllowance??2,hemAllowance:options.hemAllowance??4,zipperLength:options.zipperLength??20,vent:options.vent};
  if(typeof settings.allowances!=='boolean'||![settings.seamAllowance,settings.hemAllowance,settings.zipperLength].every(Number.isFinite))throw Error('Некорректные настройки комплекта.');
  if(settings.seamAllowance<1||settings.seamAllowance>2||settings.hemAllowance<2||settings.hemAllowance>4||settings.zipperLength<18||settings.zipperLength>20)throw Error('Припуски: швы 1–2 см, низ 2–4 см; молния 18–20 см. Значения вне примера требуют отдельной проверки.');
  if(settings.zipperLength>=values.length-5)throw Error('Молния не помещается по длине юбки.');
  if(options.modeling&&options.modeling.hemReduction>0)throw Error('Этот комплект — прямая юбка. Отключите учебное заужение: оно относится к другой модели.');
  if(settings.vent){const v=settings.vent;if(![v.width,v.ventLength].every(Number.isFinite)||v.width<4||v.width>7||v.ventLength<=0||v.ventLength>=values.length-values.hipHeight)throw Error('Проверьте ширину и длину шлицы.');}
  const base=P.build(values),half=base.geometry.half;
  const front=makePiece(base.geometry.front,values,half,false,settings),back=makePiece(base.geometry.back,values,half,true,settings);
  const belt=beltBuilder({waistSeam:base.geometry.audit.waist*2}),s=settings.allowances?settings.seamAllowance:0;
  const waistband={id:'C',name:'WAISTBAND / CUT 1 + FUSIBLE',count:1,onFold:false,length:belt.length,width:belt.cutWidth,overlap:belt.overlap,
   seam:[{x:0,y:0},{x:belt.length,y:0},{x:belt.length,y:belt.cutWidth},{x:0,y:belt.cutWidth}],
   cut:[{x:-s,y:-s},{x:belt.length+s,y:-s},{x:belt.length+s,y:belt.cutWidth+s},{x:-s,y:belt.cutWidth+s}]};
  const frontWaist=front.waist.reduce((sum,c)=>sum+E.curveLength(c),0),backWaist=back.waist.reduce((sum,c)=>sum+E.curveLength(c),0);
  const audit={...base.geometry.audit,frontWaist,backWaist,beltSeam:belt.waistSeam,beltError:belt.length-belt.overlap-base.geometry.audit.waist*2,
   completeOuterKit:true,liningIncluded:false,allowancesIncluded:settings.allowances,physicalPrintVerified:false,fittingVerified:false,cutReady:false};
  return {values,settings,base,pieces:[front,back,waistband],audit,reference:base.reference,source:'Atelier 2001 PDF5-7,9,16 / printed6-8,10,17',version:'straight-kit-1'};
 }
 function bounds(points){return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};}
 function artwork(kit){
  const cmd=[],[front,back,belt]=kit.pieces,fb=bounds(front.cut),bb=bounds(back.cut),cb=bounds(belt.cut),gap=20;
  const frontOrigin={x:5-fb.minX*10,y:45-fb.minY*10};
  const backOrigin={x:5+(fb.maxX-fb.minX)*10+gap-bb.minX*10,y:45-bb.minY*10};
  const bottoms=Math.max(frontOrigin.y+fb.maxY*10,backOrigin.y+bb.maxY*10),beltOrigin={x:5-cb.minX*10,y:bottoms+35-cb.minY*10};
  // Put the full calibration square on a single A4 tile, below the pieces.
  const squareX=5;let squareY=beltOrigin.y+cb.maxY*10+45;
  if(squareY%267>167)squareY=Math.ceil(squareY/267)*267+5;
  const text=(x,y,t)=>cmd.push(['T',x,y,t]),line=(a,b,o)=>cmd.push(['L',o.x+a.x*10,o.y+a.y*10,o.x+b.x*10,o.y+b.y*10]);
  const chain=(points,o,closed=true)=>{for(let i=1;i<points.length;i++)line(points[i-1],points[i],o);if(closed)line(points.at(-1),points[0],o);};
  text(5,10,'BUMBARI / STRAIGHT SKIRT / UNLINED / 1:1');
  text(5,17,`W ${kit.values.waist} / H ${kit.values.hip} / L ${kit.values.length} cm / ${kit.version}`);
  text(5,24,'SOURCE: ATELIER 2001 PDF5-7,9,16 / DIGITAL CURVES AND OFFSETS');
  text(5,31,kit.reference?'REFERENCE NUMERIC CASE / PRINT AND FIT A TOILE FIRST':'EXPERIMENTAL DART DISTRIBUTION / FIT A TOILE FIRST');
  text(350,31,`A4 CONTROL SQUARE: R${Math.floor(squareY/267)+1}C1`);
  for(const [piece,o] of [[front,frontOrigin],[back,backOrigin],[belt,beltOrigin]]){
   const b=bounds(piece.cut);text(o.x+b.minX*10,o.y+b.minY*10-7,`${piece.id}: ${piece.name}`);
   cmd.push(['K',0,0,0],['W',.45],['D']);chain(piece.cut,o);
   cmd.push(['K',.35,.45,.65],['W',.2],['D',2,1]);chain(piece.seam,o);
   cmd.push(['D']);
   for(const d of piece.darts||[]){line(d.left,d.tip,o);line(d.tip,d.right,o);}
   if(piece.id==='C'){
    cmd.push(['D',3,1]);line({x:0,y:piece.width/2},{x:piece.length,y:piece.width/2},o);cmd.push(['D']);
    line({x:piece.length-piece.overlap,y:0},{x:piece.length-piece.overlap,y:piece.width},o);
    for(const x of [kit.audit.backWaist,kit.audit.backWaist+kit.audit.frontWaist,kit.audit.backWaist+2*kit.audit.frontWaist]){line({x,y:0},{x,y:.5},o);line({x,y:piece.width},{x,y:piece.width-.5},o);}
    text(o.x+10,o.y+18,`FOLD / FINISHED WIDTH 3 cm / OVERLAP 3 cm / SEAM MATCH ${kit.audit.beltSeam.toFixed(2)} cm`);
   }else{
    const y=piece.hipHeight,side={x:piece.halfWidth,y};line({x:0,y},side,o);
    line({x:side.x-.4,y},{x:side.x+((kit.settings.allowances)?kit.settings.seamAllowance:0),y},o);
    const gx=piece.halfWidth*.5,gy=Math.max(y+3,piece.length*.55),end=Math.min(piece.length-4,gy+15);
    line({x:gx,y:gy},{x:gx,y:end},o);line({x:gx,y:gy},{x:gx-.4,y:gy+1},o);line({x:gx,y:gy},{x:gx+.4,y:gy+1},o);text(o.x+gx*10+5,o.y+(gy+end)*5,'GRAIN');
    if(piece.onFold){text(o.x+4,o.y+piece.length*7,'FOLD / NO ALLOWANCE');}
    else{
     line({x:-.5,y:kit.settings.zipperLength},{x:.5,y:kit.settings.zipperLength},o);text(o.x+5,o.y+kit.settings.zipperLength*10-5,'ZIP END');
     if(kit.settings.vent){const top=piece.length-kit.settings.vent.ventLength,w=kit.settings.vent.width;
      cmd.push(['D',3,1]);line({x:0,y:top},{x:0,y:piece.length},o);line({x:0,y:top},{x:-w,y:top-1.5},o);cmd.push(['D']);
      text(o.x+5,o.y+top*10+5,`VENT ${kit.settings.vent.ventLength} cm / FOLD AT CENTER BACK`);
     }
    }
   }
  }
  cmd.push(['K',0,0,0],['W',.3],['D']);
  chain([{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}],{x:squareX,y:squareY});
  text(squareX,squareY-5,'CONTROL 100 x 100 mm');
  const notesY=squareY+15;text(squareX+125,notesY,'BLACK: CUT LINE');text(squareX+125,notesY+7,'BLUE DASH: SEAM / FOLD');text(squareX+125,notesY+14,'DO NOT CUT DARTS');
  text(5,beltOrigin.y+cb.maxY*10+12,kit.settings.allowances?`ALLOWANCES INCLUDED: SEAMS ${kit.settings.seamAllowance} cm; HEM ${kit.settings.hemAllowance} cm; FRONT FOLD 0`:'NO SEAM OR HEM ALLOWANCES / VENT EXTENSION INCLUDED');
  text(5,beltOrigin.y+cb.maxY*10+19,'BACK: 2 MIRRORED PIECES FROM TEMPLATE B / NO LINING / PRINT 100%');
  const panels={};for(const [p,o] of [[front,frontOrigin],[back,backOrigin],[belt,beltOrigin]]){const b=bounds(p.cut);panels[p.id]=[o.x+b.minX*10-3,o.y+b.minY*10-28,(b.maxX-b.minX)*10+6,(b.maxY-b.minY)*10+34];}
  return {cmd,width:Math.max(beltOrigin.x+cb.maxX*10+5,backOrigin.x+bb.maxX*10+5),height:squareY+115,panels};
 }
 function svg(art,piece){
  let ink='#142d50',width=.45,dash='';const drawn=[];
  for(const c of art.cmd){if(c[0]==='K')ink='#142d50';
   if(c[0]==='W')width=c[1];if(c[0]==='D')dash=c.slice(1).join(' ');
   if(c[0]==='L')drawn.push(`<path d="M${c[1]} ${c[2]}L${c[3]} ${c[4]}" fill="none" stroke="${ink}" stroke-width="${Math.max(.8,width*2.7)}" vector-effect="non-scaling-stroke" stroke-dasharray="${dash}"/>`);
   if(c[0]==='T'){
    const key=c[3].slice(0,2),labels={'A:':'Перед · 1 на сгибе','B:':'Спинка · 2 зеркальные детали','C:':'Пояс · 1 деталь'},label=labels[key]||(c[3]==='CONTROL 100 x 100 mm'?'Контроль 100 × 100 мм':'');
    if(label)drawn.push(`<text x="${c[1]}" y="${c[2]}" font-family="Arial,sans-serif" font-size="${key==='C:'?14:18}" fill="#142d50">${label}</text>`);
   }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${piece?art.panels[piece].join(' '):`0 0 ${art.width} ${art.height}`}" role="img" aria-label="Комплект прямой юбки: ${piece==='A'?'перед на сгиб':piece==='B'?'спинка на две зеркальные детали':piece==='C'?'пояс':'перед, спинка и пояс'}">${drawn.join('')}</svg>`;
 }
 const api={build,artwork,svg,sample,offset,simple,bounds};root.SkirtKit=api;if(node){module.exports=api;return;}
})(typeof window!=='undefined'?window:globalThis);
