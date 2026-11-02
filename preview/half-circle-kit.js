/* Half-circle geometry in cm. Arc chords deviate by at most 0.002 cm.
   Fold x=0; center-back seam y=0. Analytic circular offsets meet y=-seam.
   Geometry and assembly choices: docs/HALF-CIRCLE-SKIRT.md. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined';
 const beltBuilder=node?require('./waistband').buildWaistband:root.buildWaistband;
 const defaults={waistEase:1,seamAllowance:1,hemAllowance:1,zipperLength:20,beltWidth:3,fabricWidth:180};
 const ranges={waist:[40,180],hip:[60,200],hipHeight:[10,40],length:[20,140]};
 const settingsRanges={waistEase:[0,4],seamAllowance:[.5,2],hemAllowance:[.5,4],zipperLength:[10,35],beltWidth:[2,5],fabricWidth:[70,300]};
 function settings(options={}){
  if(!options||typeof options!=='object'||Array.isArray(options))throw Error('Некорректные настройки полусолнца.');
  const out={...defaults};
  for(const [key,[min,max]] of Object.entries(settingsRanges)){
   if(Object.hasOwn(options,key))out[key]=options[key];
   if(!Number.isFinite(out[key])||out[key]<min||out[key]>max)throw Error(`Проверьте настройку ${key}: ${min}–${max} см.`);
  }return out;
 }
 function arc(r,from,to){
  const count=Math.max(2,Math.ceil(Math.abs(to-from)/(2*Math.acos(1-.002/r))));
  return Array.from({length:count+1},(_,i)=>{const a=from+(to-from)*i/count;return {x:r*Math.cos(a),y:r*Math.sin(a)};});
 }
 function build(values,options={}){
  const v={};for(const [key,[min,max]] of Object.entries(ranges)){v[key]=values?.[key];if(!Number.isFinite(v[key])||v[key]<min||v[key]>max)throw Error(`Проверьте мерку ${key}: ${min}–${max} см.`);}
  if(v.hip<=v.waist||v.hipHeight>=v.length)throw Error('Бёдра должны быть больше талии; высота бёдер — меньше длины юбки.');
  const s=settings(options),waistSeam=v.waist+s.waistEase,r=waistSeam/Math.PI,R=r+v.length,hipCircumference=Math.PI*(r+v.hipHeight);
  if(hipCircumference<v.hip)throw Error('Недостаточно ширины по бёдрам. Эта основа не подходит к введённым меркам.');
  if(s.zipperLength>v.length-2)throw Error('Молния должна заканчиваться минимум за 2 см до низа.');
  const inner=r-s.seamAllowance,outer=R+s.hemAllowance,a=s.seamAllowance;
  if(inner<=a)throw Error('Припуск талии не помещается на радиусе.');
  const seam=[...arc(r,Math.PI/2,0),...arc(R,0,Math.PI/2)];
  const cut=[...arc(inner,Math.PI/2,-Math.asin(a/inner)),...arc(outer,-Math.asin(a/outer),Math.PI/2)];
  const belt=beltBuilder({waistSeam,finishedWidth:s.beltWidth});
  const beltSeam=[{x:0,y:0},{x:belt.length,y:0},{x:belt.length,y:belt.cutWidth},{x:0,y:belt.cutWidth}];
  const beltCut=[{x:-a,y:-a},{x:belt.length+a,y:-a},{x:belt.length+a,y:belt.cutWidth+a},{x:-a,y:belt.cutWidth+a}];
  const skirtWidth=2*outer,skirtLength=outer+a,beltWidth=belt.cutWidth+2*a,beltLength=belt.length+2*a;
  // Conservative flat, single-layer bounding-box layout. Mirror the template at CF;
  // grain and CF run along the fabric length. No fold-width assumption is needed.
  const layout={fits:s.fabricWidth>=Math.max(skirtWidth,beltWidth),skirtWidth,skirtLength,beltLength,beltWidth,
   requiredWidth:Math.max(skirtWidth,beltWidth),requiredLength:skirtLength+beltLength+4,mode:'flat-single-layer'};
  return {version:'half-circle-kit-1',values:v,settings:s,radius:r,hemRadius:R,hipRadius:r+v.hipHeight,
   pieces:[{id:'A',seam,cut},{id:'B',seam:beltSeam,cut:beltCut}],belt,layout,
   audit:{waistSeam,halfWaist:waistSeam/2,hipCircumference,hipEase:hipCircumference-v.hip,beltError:belt.length-belt.overlap-waistSeam,
    backSeam:v.length,completeOuterKit:true,liningIncluded:false,physicalPrintVerified:false,fittingVerified:false,cutReady:false}};
 }
 function artwork(k){
  const cmd=[],a=k.settings.seamAllowance,outer=k.hemRadius+k.settings.hemAllowance;
  const o={x:8,y:55+a*10},bo={x:8+a*10,y:55+(outer+a)*10+35+a*10};
  const line=(p,q,origin=o)=>cmd.push(['L',origin.x+p.x*10,origin.y+p.y*10,origin.x+q.x*10,origin.y+q.y*10]);
  const text=(x,y,t)=>cmd.push(['T',x,y,t]);
  const chain=(ps,origin=o,closed=true)=>{for(let i=1;i<ps.length;i++)line(ps[i-1],ps[i],origin);if(closed)line(ps.at(-1),ps[0],origin);};
  text(8,10,'BUMBARI / HALF-CIRCLE SKIRT / 1:1 / UNLINED');
  text(8,17,`W ${k.values.waist}; H ${k.values.hip}; HH ${k.values.hipHeight}; L ${k.values.length} cm`);
  text(8,24,`WAIST EASE ${k.settings.waistEase}; SEAMS ${a}; HEM ${k.settings.hemAllowance} cm INCLUDED`);
  text(8,31,'GEOMETRIC MODEL / PRINT 100% / FIT A TOILE BEFORE FINAL FABRIC');
  text(8,43,'A: SKIRT / HALF TEMPLATE 90 DEG / FULL PIECE 180 DEG');
  for(const [p,origin] of [[k.pieces[0],o],[k.pieces[1],bo]]){
   cmd.push(['K',0,0,0],['W',.4],['D']);chain(p.cut,origin);
   cmd.push(['K',.25,.4,.6],['W',.2],['D',2,1]);chain(p.seam,origin);cmd.push(['D']);
  }
  // Hip guide and waist quarter marks: side match, mirrored through CF.
  cmd.push(['D',3,2]);chain(arc(k.hipRadius,0,Math.PI/2),o,false);cmd.push(['D']);
  const radial=(t,r1,r2)=>line({x:r1*Math.cos(t),y:r1*Math.sin(t)},{x:r2*Math.cos(t),y:r2*Math.sin(t)});
  radial(Math.PI/4,k.radius-a,k.radius+.4);
  line({x:k.radius+k.settings.zipperLength,y:-a},{x:k.radius+k.settings.zipperLength,y:.5});
  text(o.x+(k.radius+k.settings.zipperLength)*10,o.y+8,'ZIP END');
  text(o.x+5,o.y+(k.radius+k.values.length*.6)*10,'CENTER FRONT / FOLD / NO ALLOWANCE');
  const gx=k.radius*.35,gy=k.radius+5,ge=Math.min(gy+15,k.hemRadius-3);
  line({x:gx,y:gy},{x:gx,y:ge});line({x:gx,y:gy},{x:gx-.4,y:gy+1});line({x:gx,y:gy},{x:gx+.4,y:gy+1});
  text(o.x+gx*10+5,o.y+(gy+ge)*5,'GRAIN');
  text(o.x+(k.radius+3)*10,o.y+17,'CENTER BACK / SEAM / ZIP FROM WAIST');
  const by=bo.y-a*10;
  text(8,by-7,'B: WAISTBAND / CUT 1 + FUSIBLE / GRAIN ALONG LENGTH');
  cmd.push(['D',3,1]);line({x:0,y:k.belt.finishedWidth},{x:k.belt.length,y:k.belt.finishedWidth},bo);cmd.push(['D']);
  line({x:k.audit.waistSeam,y:0},{x:k.audit.waistSeam,y:k.belt.cutWidth},bo);
  for(const x of [k.audit.waistSeam/4,k.audit.waistSeam/2,k.audit.waistSeam*3/4]){
   line({x,y:-a},{x,y:.4},bo);line({x,y:k.belt.cutWidth-.4},{x,y:k.belt.cutWidth+a},bo);
  }
  text(bo.x+8,bo.y+k.belt.finishedWidth*10-4,`FOLD / WIDTH ${k.belt.finishedWidth} / OVERLAP 3 cm`);
  const bottom=bo.y+(k.belt.cutWidth+a)*10;
  let squareY=bottom+45;
  // Keep the calibration square and caption intact on both A4 and A0 tiles.
  while(squareY%267>160||squareY%1159>1050){
   if(squareY%267>160)squareY=Math.ceil(squareY/267)*267+8;
   if(squareY%1159>1050)squareY=Math.ceil(squareY/1159)*1159+8;
  }
  const square=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];cmd.push(['K',0,0,0],['W',.3]);chain(square,{x:8,y:squareY});
  text(8,squareY-6,'CONTROL 100 x 100 mm');
  text(135,squareY+10,'BLACK: CUT / BLUE DASH: STITCH OR FOLD');
  text(135,squareY+18,'MIRROR A AT CENTER FRONT FOR FLAT CUTTING');
  text(135,squareY+26,'ONE FULL SKIRT PIECE / BACK SEAM / NO LINING');
  text(8,bottom+12,`BELT SEAM ${k.audit.waistSeam.toFixed(2)} cm / ZIP ${k.settings.zipperLength} cm`);
  text(8,bottom+20,'HANG SKIRT BEFORE LEVELLING AND HEMMING / TOILE FIRST');
  return {cmd,width:Math.max(outer*10+16,(k.belt.length+2*a)*10+16,560),height:squareY+115,
   panels:{A:[0,35,outer*10+20,(outer+a)*10+45],B:[0,by-18,(k.belt.length+2*a)*10+20,(k.belt.cutWidth+2*a)*10+35]},square:{x:8,y:squareY,size:100}};
 }
 function svg(art,piece){
  let ink='#142d50',width=.4,dash='';const out=[];
  const labels={'A: SKIRT / HALF TEMPLATE 90 DEG / FULL PIECE 180 DEG':'Юбка · половина 90° · целая деталь 180°',
   'B: WAISTBAND / CUT 1 + FUSIBLE / GRAIN ALONG LENGTH':'Пояс · 1 деталь + прокладка · долевая вдоль',
   'CENTER FRONT / FOLD / NO ALLOWANCE':'Середина переда · сгиб без припуска','GRAIN':'Долевая',
   'CENTER BACK / SEAM / ZIP FROM WAIST':'Средний шов спинки · молния','ZIP END':'Конец молнии','CONTROL 100 x 100 mm':'Контроль 100 × 100 мм'};
  for(const c of art.cmd){if(c[0]==='K')ink=c[1]===0?'#142d50':'#627a9a';if(c[0]==='W')width=c[1];if(c[0]==='D')dash=c.slice(1).join(' ');
   if(c[0]==='L')out.push(`<path d="M${c[1]} ${c[2]}L${c[3]} ${c[4]}" fill="none" stroke="${ink}" stroke-width="${Math.max(.7,width*2)}" vector-effect="non-scaling-stroke" stroke-dasharray="${dash}"/>`);
   if(c[0]==='T'&&labels[c[3]])out.push(`<text x="${c[1]}" y="${c[2]}" font-family="Arial,sans-serif" font-size="12" fill="#142d50">${labels[c[3]]}</text>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${piece?art.panels[piece].join(' '):`0 0 ${art.width} ${art.height}`}" role="img" aria-label="Полусолнце: юбка, пояс, припуски и метки">${out.join('')}</svg>`;
 }
 const api={defaults,settings,build,artwork,svg,arc};root.HalfCircleKit=api;if(node)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
