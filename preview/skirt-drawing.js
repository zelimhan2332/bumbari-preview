/* Construction preview: M. Müller & Sohn, Ателье-2001, PDF 5–7 (печатные 6–8).
   Coordinates are centimetres. Only the book's two complete examples have dart layouts. */
function buildSkirtDrawing(values, options = {}) {
  let c = calculateSkirtReference(values),generated=null;
  const generator=typeof window!=='undefined'?window.MuellerPattern:null;
  if(generator){try{generated=generator.build(values);c=generated.calculation;}catch(e){/* Unsupported proportions retain the reference grid. */}}
  const engine=typeof window!=='undefined'?window.MuellerSkirtGeometry:require('./skirt-geometry');
  const geometry=generated?generated.geometry:engine.buildSkirtGeometry(values,c);
  const width = c.hipHalfWithEase;
  const half = width / 2;
  const gap = 6;
  const back = half + gap;
  const stage = options.stage ?? 3;
  const exact = !!geometry && stage >= 2;
  const scale = Math.min(5.2, 330 / values.length, 320 / (width + gap));
  const px = x => +(34 + x * scale).toFixed(2);
  const py = y => +(35 + (y + 1.5) * scale).toFixed(2);
  const line = (x1,y1,x2,y2,cls='guide') => `<path class="${cls}" d="M${px(x1)} ${py(y1)}L${px(x2)} ${py(y2)}"/>`;
  const text = (x,y,label,anchor='middle') => `<text x="${px(x)}" y="${py(y)}" text-anchor="${anchor}">${label}</text>`;
  const dart = (center,amount,tip,top=0) => `<path class="dart" d="M${px(center-amount/2)} ${py(top)}L${px(center)} ${py(tip)}L${px(center+amount/2)} ${py(top)}"/>`;
  const side = exact ? c.darts.side / 2 : 0;
  let frontPath = exact
    ? `M${px(0)} ${py(0)}L${px(half-side)} ${py(-1)}C${px(half-1)} ${py(4)} ${px(half)} ${py(12)} ${px(half)} ${py(values.hipHeight)}L${px(half)} ${py(values.length)}L${px(0)} ${py(values.length)}Z`
    : `M${px(0)} ${py(0)}L${px(half)} ${py(0)}L${px(half)} ${py(values.length)}L${px(0)} ${py(values.length)}Z`;
  let backPath = exact
    ? `M${px(back+side)} ${py(-1)}L${px(back+half)} ${py(0)}L${px(back+half)} ${py(values.length)}L${px(back)} ${py(values.length)}L${px(back)} ${py(values.hipHeight)}C${px(back)} ${py(12)} ${px(back+1)} ${py(4)} ${px(back+side)} ${py(-1)}Z`
    : `M${px(back)} ${py(0)}L${px(back+half)} ${py(0)}L${px(back+half)} ${py(values.length)}L${px(back)} ${py(values.length)}Z`;
  let frontDarts = '', backDarts = ''; 
  if(exact&&geometry){
    const waistPath=(part,offset)=>{
      let result=`M${px(offset+part.start.x)} ${py(part.start.y)}`;
      part.waist.forEach((segment,i)=>{if(i){const d=part.darts.slice().sort((a,b)=>a.left.x-b.left.x)[i-1];result+=`L${px(offset+d.right.x)} ${py(d.right.y)}`;}
        result+=`C${px(offset+segment.c1.x)} ${py(segment.c1.y)} ${px(offset+segment.c2.x)} ${py(segment.c2.y)} ${px(offset+segment.b.x)} ${py(segment.b.y)}`;
      });return result;
    };
    const frontSide=geometry.front.end,backSide=geometry.back.start;
    frontPath=waistPath(geometry.front,0)+`C${px(frontSide.x+(half-frontSide.x)*.5)} ${py(frontSide.y+(values.hipHeight-frontSide.y)/3)} ${px(half)} ${py(values.hipHeight*.7)} ${px(half)} ${py(values.hipHeight)}L${px(half)} ${py(values.length)}L${px(0)} ${py(values.length)}Z`;
    backPath=waistPath(geometry.back,back)+`L${px(back+half)} ${py(values.length)}L${px(back)} ${py(values.length)}L${px(back)} ${py(values.hipHeight)}C${px(back)} ${py(values.hipHeight*.7)} ${px(back+backSide.x*.5)} ${py(backSide.y+(values.hipHeight-backSide.y)/3)} ${px(back+backSide.x)} ${py(backSide.y)}Z`;
    if(stage>=3){
      const drawDart=(d,offset)=>`<path class="dart" d="M${px(offset+d.left.x)} ${py(d.left.y)}L${px(offset+d.tip.x)} ${py(d.tip.y)}L${px(offset+d.right.x)} ${py(d.right.y)}"/>`;
      frontDarts=geometry.front.darts.map(d=>drawDart(d,0)).join('');
      backDarts=geometry.back.darts.map(d=>drawDart(d,back)).join('');
    }
  }
  const h = Math.ceil(py(values.length)+35);
  const w = Math.ceil(px(width+gap)+34);
  const showFront=options.piece!=='back',showBack=options.piece!=='front';
  const dimension=options.dimension;
  const highlights=[];
  const dimensionLines=[];
  const measure=(letter,x1,y1,x2,y2)=>{
    dimensionLines.push(line(x1,y1,x2,y2,'dimension'));
    const vertical=x1===x2;
    const tick=.55;
    dimensionLines.push(line(x1-(vertical?tick:0),y1-(vertical?0:tick),x1+(vertical?tick:0),y1+(vertical?0:tick),'dimension'));
    dimensionLines.push(line(x2-(vertical?tick:0),y2-(vertical?0:tick),x2+(vertical?tick:0),y2+(vertical?0:tick),'dimension'));
    dimensionLines.push(text((x1+x2)/2+(vertical?1.7:0),(y1+y2)/2-(vertical?0:1),letter));
  };
  // Letters refer to the current schematic grid; they are not newly verified drafting rules.
  const origin=showFront?0:back;
  if(options.annotations){
    measure('a',origin,-4,origin+half,-4);
    measure('b',origin+half+3,0,origin+half+3,values.length);
    if(stage>=1)measure('c',origin-3,0,origin-3,values.hipHeight);
    if(exact&&stage>=3&&options.piece==='front')measure('d',half-7-c.darts.front/2,-1.7,half-7+c.darts.front/2,-1.7);
  }
  if(dimension==='hip'&&stage>=1){if(showFront)highlights.push(line(0,values.hipHeight,half,values.hipHeight,'highlight'));if(showBack)highlights.push(line(back,values.hipHeight,back+half,values.hipHeight,'highlight'));}
  if(dimension==='hipHeight')highlights.push(line(showFront?0:back,0,showFront?0:back,values.hipHeight,'highlight'));
  if(dimension==='length')highlights.push(line(showFront?0:back,0,showFront?0:back,values.length,'highlight'));
  const viewX=options.piece==='back'?px(back)-28:0;
  const viewW=options.piece?Math.ceil(half*scale+75):w;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} 0 ${viewW} ${h}" role="img" aria-label="Чертёж прямой юбки: ${options.piece==='front'?'переднее полотнище':options.piece==='back'?'заднее полотнище':'переднее и заднее полотнища'}, этап ${stage+1}"><style>.piece{fill:white;stroke:#4d53b8;stroke-width:1.7;stroke-linejoin:round}.guide{fill:none;stroke:#9494ad;stroke-width:1;stroke-dasharray:5 4}.dart{fill:none;stroke:#4d53b8;stroke-width:1.8}.dimension{fill:none;stroke:#ed398d;stroke-width:1.2}.highlight{fill:none;stroke:#ed398d;stroke-width:2.7;stroke-linecap:round}text{font:11px system-ui,sans-serif;fill:#4d53b8}</style>${showFront?`<path class="piece" d="${frontPath}"/>${stage>=1?line(0,values.hipHeight,half,values.hipHeight):''}${text(half/2,values.length+5,'Переднее полотнище')}`:''}${showBack?`<path class="piece" d="${backPath}"/>${stage>=1?line(back,values.hipHeight,back+half,values.hipHeight):''}${text(back+half/2,values.length+5,'Заднее полотнище')}`:''}${showFront?frontDarts:''}${showBack?backDarts:''}${stage>=1?text(showFront?half/2:back+half/2,values.hipHeight-1,'Линия бёдер'):''}${highlights.join('')}${dimensionLines.join('')}</svg>`;
  return { svg, exact, width, half, gap, geometry, source:c.source };
}
if (typeof module !== 'undefined') module.exports = { buildSkirtDrawing };
