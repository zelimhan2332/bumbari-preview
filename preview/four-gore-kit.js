/* Four-panel geometric conversion of the straight-skirt block.
   Ателье-2001 PDF 8 (printed p. 9), fig. 7: front/back divided 1/3 + 2/3;
   PDF 8 fig. 8: slashing and spreading. Seam-length truing is an engineering step. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined',beltBuilder=node?require('./waistband').buildWaistband:root.buildWaistband,
  geometry=node?require('./skirt-geometry'):root.MuellerSkirtGeometry,patternKit=node?require('./skirt-kit'):root.SkirtKit;
 const defaults={hipEase:2,hemExpansion:3,seamAllowance:1,hemAllowance:1,beltWidth:3,zipperLength:20};
 const limits={waist:[40,180],hip:[60,200],hipHeight:[10,40],length:[20,140]};
 const optionLimits={hipEase:[2,4],hemExpansion:[1.5,7],seamAllowance:[.5,2],hemAllowance:[.5,4],beltWidth:[2,5],zipperLength:[10,35]};
 const panelDefs=[
  {id:'A',name:'Передний центральный клин',ratio:1/3,part:'front'},
  {id:'B',name:'Передний боковой клин',ratio:2/3,part:'front'},
  {id:'C',name:'Задний боковой клин',ratio:2/3,part:'back'},
  {id:'D',name:'Задний центральный клин',ratio:1/3,part:'back'}
 ];
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function settings(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Некорректные настройки юбки из четырёх клиньев.');
  const out={...defaults};for(const [k,[lo,hi]] of Object.entries(optionLimits)){if(Object.hasOwn(input,k))out[k]=input[k];if(!Number.isFinite(out[k])||out[k]<lo||out[k]>hi)throw Error(`Проверьте настройку ${k}: ${lo}–${hi} см.`);}
  if(out.hipEase!==2&&out.hipEase!==4)throw Error('Для основы по книге прибавка по бёдрам — 2 или 4 см к полному обхвату.');return out;
 }
 function segmentLength(a,b){return dist(a,b);}
 function build(values,options={}){
  const v={};for(const [k,[lo,hi]] of Object.entries(limits)){v[k]=values?.[k];if(!Number.isFinite(v[k])||v[k]<lo||v[k]>hi)throw Error(`Проверьте мерку ${k}: ${lo}–${hi} см.`);}
  if(v.hip<=v.waist||v.hipHeight>=v.length)throw Error('Обхват бёдер должен быть больше талии; высота бёдер — меньше длины юбки.');
  const s=settings(options);if(s.zipperLength>v.length-2)throw Error('Молния должна заканчиваться минимум за 2 см до низа.');
  const block=patternKit.build({...v,hipEaseHalf:s.hipEase/2,material:'woven'},{allowances:false,seamAllowance:1,hemAllowance:2,zipperLength:s.zipperLength});
  const waistSeam=block.audit.beltSeam,hipCircumference=v.hip+s.hipEase,
   frontTop=2*block.audit.frontWaist,backTop=2*block.audit.backWaist,frontHip=2*block.base.geometry.half,backHip=frontHip,
   topWidths=[frontTop/3,frontTop*2/3,backTop*2/3,backTop/3],hipWidths=[frontHip/3,frontHip*2/3,backHip*2/3,backHip/3];
  if(Math.abs(topWidths.reduce((a,b)=>a+b,0)-waistSeam)>.1||Math.abs(hipWidths.reduce((a,b)=>a+b,0)-hipCircumference)>.1)throw Error('Деление основы на четыре клина не сохранило обхват талии или бёдер.');
  const vertical=v.length-v.hipHeight,
   upperLengths=topWidths.map((w,i)=>Math.hypot(v.hipHeight,(hipWidths[i]-w)/2)),
   minimumSideLength=Math.max(...upperLengths.map(x=>x+vertical)),truingSpread=amountFor(minimumSideLength),wanted=truingSpread+4*s.hemExpansion;
  // Solve the hem widths so every side seam has the same length and the
  // sum of the four hem openings equals the selected circumference increase.
  const expanded=side=>hipWidths.map((w,i)=>{
   const lower=Math.sqrt(Math.max(0,(side-upperLengths[i])**2-vertical**2));
   return w+2*lower;
  });
  const amount=ws=>ws.reduce((sum,w,i)=>sum+w-hipWidths[i],0);
  function amountFor(side){return hipWidths.reduce((sum,w,i)=>sum+2*Math.sqrt(Math.max(0,(side-upperLengths[i])**2-vertical**2)),0);}
  let lo=minimumSideLength,hi=minimumSideLength+Math.max(10,wanted);
  if(amount(expanded(lo))>wanted+.02)throw Error('Выбранного раскрытия недостаточно, чтобы согласовать боковые швы. Увеличьте раскрытие каждого разреза.');
  while(amount(expanded(hi))<wanted)hi+=Math.max(10,wanted);
  for(let i=0;i<64;i++){const mid=(lo+hi)/2;if(amount(expanded(mid))<wanted)lo=mid;else hi=mid;}
  const seamLength=(lo+hi)/2,finalHemWidths=expanded(seamLength);
  const allowance=s.seamAllowance,hemAllowance=s.hemAllowance,pieces=[];
  for(let i=0;i<4;i++){
   const widths=[topWidths[i],hipWidths[i],finalHemWidths[i]];
   // Use indexed points so equal widths never collapse a level.
   const l=[{x:-widths[0]/2,y:0},{x:-widths[1]/2,y:v.hipHeight},{x:-widths[2]/2,y:v.length}],
    r=[{x:widths[0]/2,y:0},{x:widths[1]/2,y:v.hipHeight},{x:widths[2]/2,y:v.length}],
    seam=[l[0],r[0],r[1],r[2],l[2],l[1]],amounts=[allowance,allowance,allowance,hemAllowance,allowance,allowance];
   const cut=patternKit.offset(seam,amounts);
   const lengths=[dist(l[0],l[1])+dist(l[1],l[2]),dist(r[0],r[1])+dist(r[1],r[2])];
   pieces.push({id:panelDefs[i].id,name:panelDefs[i].name,count:1,part:panelDefs[i].part,ratio:panelDefs[i].ratio,seam,cut,
    topWidth:widths[0],hipWidth:widths[1],hemWidth:widths[2],hemSpread:widths[2]-widths[1],sideLengths:lengths,zipper:i===3});
  }
  const belt=beltBuilder({waistSeam,finishedWidth:s.beltWidth}),beltSeam=[{x:0,y:0},{x:belt.length,y:0},{x:belt.length,y:belt.cutWidth},{x:0,y:belt.cutWidth}],
   beltCut=[{x:-allowance,y:-allowance},{x:belt.length+allowance,y:-allowance},{x:belt.length+allowance,y:belt.cutWidth+allowance},{x:-allowance,y:belt.cutWidth+allowance}],
   waistError=waistSeam-(v.waist+2),hipError=hipCircumference-v.hip-s.hipEase,
   hemCircumference=finalHemWidths.reduce((a,b)=>a+b,0);
  return {version:'four-gore-kit-2',values:v,settings:s,pieces:[...pieces,{id:'E',name:'Пояс',count:1,seam:beltSeam,cut:beltCut}],belt,base:block,
   audit:{waistSeam,waistError,hipCircumference,hipEase:hipCircumference-v.hip,hipError,hemCircumference,totalHemExpansion:hemCircumference-hipCircumference,
   sideSeamLength:seamLength,sideSeamSpreadError:Math.max(...pieces.flatMap(p=>p.sideLengths))-Math.min(...pieces.flatMap(p=>p.sideLengths)),truingSpread,requestedHemExpansion:4*s.hemExpansion,panels:4,panelRatios:[1/6,1/3,1/3,1/6],beltError:belt.length-belt.overlap-waistSeam,
    completeOuterKit:true,cutReady:false,fittingVerified:false}};
 }
 function bounds(points){return {minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))};}
 function artwork(k){
  const cmd=[],line=(a,b,o)=>cmd.push(['L',o.x+a.x*10,o.y+a.y*10,o.x+b.x*10,o.y+b.y*10]),text=(x,y,t)=>cmd.push(['T',x,y,t]),
   chain=(pts,o)=>{for(let j=1;j<pts.length;j++)line(pts[j-1],pts[j],o);line(pts.at(-1),pts[0],o);};
  const gap=25, panelBounds=k.pieces.slice(0,4).map(p=>bounds(p.cut)),
   colWidth=[Math.max(panelBounds[0].maxX-panelBounds[0].minX,panelBounds[2].maxX-panelBounds[2].minX),Math.max(panelBounds[1].maxX-panelBounds[1].minX,panelBounds[3].maxX-panelBounds[3].minX)],
   rowHeight=[Math.max(panelBounds[0].maxY-panelBounds[0].minY,panelBounds[1].maxY-panelBounds[1].minY),Math.max(panelBounds[2].maxY-panelBounds[2].minY,panelBounds[3].maxY-panelBounds[3].minY)],
   colX=[12,12+colWidth[0]*10+gap],rowY=[65,65+rowHeight[0]*10+gap],
   origins=panelBounds.map((b,i)=>({x:colX[i%2]-b.minX*10,y:rowY[Math.floor(i/2)]-b.minY*10})),
   x=colX[1]+colWidth[1]*10+12;
  text(8,10,'БУМБАРИ · ЮБКА ИЗ ЧЕТЫРЁХ КЛИНЬЕВ · МАСШТАБ 1:1');
  text(8,17,`ОТ ${k.values.waist}; ОБ ${k.values.hip}; ВБ ${k.values.hipHeight}; ДЛИНА ${k.values.length} СМ`);
  text(8,24,`ПРИПУСКИ: БОК ${k.settings.seamAllowance} СМ; НИЗ ${k.settings.hemAllowance} СМ; ДОП. РАСКРЫТИЕ КАЖДОГО РАЗРЕЗА ${k.settings.hemExpansion} СМ`);
  text(8,31,`ДЕЛЕНИЕ ПЕРЕДА И СПИНКИ: 1/3 + 2/3 / ДЛЯ РАВЕНСТВА ШВОВ ДОБАВЛЕНО ${k.audit.truingSpread.toFixed(1)} СМ`);
  for(let i=0;i<4;i++){
   const p=k.pieces[i],o=origins[i],ys=[0,k.values.hipHeight,k.values.length],a=p.seam;
   cmd.push(['K',0,0,0],['W',.4],['D']);chain(p.cut,o);cmd.push(['K',.25,.4,.6],['W',.2],['D',2,1]);chain(p.seam,o);cmd.push(['D']);
   text(o.x+8,o.y+(k.values.length*4.8),`${p.id}: ${p.name.toUpperCase()} / ВЫКРОИТЬ 1`);
   cmd.push(['D',3,2]);line(a[0],a[1],o);line(a[2],a[3],o);cmd.push(['D']);
   // Notches cross each side seam at the actual hip point.
   for(const [point,before,after] of [[a[2],a[1],a[3]],[a[5],a[0],a[4]]]){
    const dx=after.x-before.x,dy=after.y-before.y,n=Math.hypot(dx,dy)||1;
    line({x:point.x-dy/n*.4,y:point.y+dx/n*.4},{x:point.x+dy/n*.4,y:point.y-dx/n*.4},o);
   }
   const gx=(a[0].x+a[1].x)/2,gy=k.values.hipHeight+5;line({x:gx,y:gy},{x:gx,y:Math.min(k.values.length-4,gy+12)},o);text(o.x+gx*10+4,o.y+(gy+12)*5,'ДОЛЕВАЯ');
   if(p.zipper){
    const y=k.settings.zipperLength,from=y<=k.values.hipHeight?a[1]:a[2],to=y<=k.values.hipHeight?a[2]:a[3],t=(y-from.y)/(to.y-from.y),point={x:from.x+(to.x-from.x)*t,y};
    const dx=to.x-from.x,dy=to.y-from.y,n=Math.hypot(dx,dy)||1;
    line({x:point.x-dy/n*.45,y:point.y+dx/n*.45},{x:point.x+dy/n*.45,y:point.y-dx/n*.45},o);
    text(o.x+(point.x+.7)*10,o.y+(point.y+1)*10,'КОНЕЦ МОЛНИИ');
   }
  }
  const belt=k.pieces[4],bo={x:12,y:rowY[1]+rowHeight[1]*10+35};cmd.push(['K',0,0,0],['W',.4],['D']);chain(belt.cut,bo);cmd.push(['K',.25,.4,.6],['W',.2],['D',2,1]);chain(belt.seam,bo);cmd.push(['D']);
  text(bo.x,bo.y+k.belt.cutWidth*10+9,`ПОЯС: ВЫКРОИТЬ 1 + ПРОКЛАДКА / ДЛИНА ${k.belt.length.toFixed(2)} СМ`);
  const squareX=Math.max(x+5,bo.x+(k.belt.length+k.settings.seamAllowance*2)*10+15),squareY=bo.y+k.belt.cutWidth*10+48;
  chain([{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}],{x:squareX,y:squareY});
  text(squareX,squareY-6,'КОНТРОЛЬНЫЙ КВАДРАТ 100 × 100 ММ');
  text(8,squareY+120,'СПЛОШНАЯ ЛИНИЯ — СРЕЗ / ПУНКТИР — ЛИНИЯ ШВА / ПЕЧАТАТЬ 100%');
  const panels={};for(let i=0;i<4;i++){const b=bounds(k.pieces[i].cut),o=origins[i];panels[k.pieces[i].id]=[o.x+b.minX*10-4,o.y+b.minY*10-22,(b.maxX-b.minX)*10+8,(b.maxY-b.minY)*10+28];}
  panels.E=[bo.x-4,bo.y-22,(k.belt.length+k.settings.seamAllowance*2)*10+8,(k.belt.cutWidth+k.settings.seamAllowance*2)*10+28];
  return {cmd,width:Math.max(squareX+115,x),height:squareY+145,panels};
 }
 function svg(art,piece){let ink='#142d50',width=.4,dash='',out=[];for(const c of art.cmd){if(c[0]==='K')ink=c[1]===0?'#142d50':'#627a9a';if(c[0]==='W')width=c[1];if(c[0]==='D')dash=c.slice(1).join(' ');if(c[0]==='L')out.push(`<path d="M${c[1]} ${c[2]}L${c[3]} ${c[4]}" fill="none" stroke="${ink}" stroke-width="${Math.max(.7,width*2)}" stroke-dasharray="${dash}"/>`);if(c[0]==='T')out.push(`<text x="${c[1]}" y="${c[2]}" font-family="Arial,sans-serif" font-size="4" fill="#142d50">${c[3]}</text>`);if(c[0]==='G')out.push(`<rect x="${c[1]}" y="${c[2]}" width="${c[3]}" height="${c[4]}" fill="${ink}"/>`);}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${piece?art.panels[piece].join(' '):`0 0 ${art.width} ${art.height}`}" role="img" aria-label="Юбка из четырёх клиньев: передний и задний клинья, припуски и пояс">${out.join('')}</svg>`;}
 const api={defaults,settings,build,artwork,svg,bounds,panelDefs};root.FourGoreKit=api;if(node)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
