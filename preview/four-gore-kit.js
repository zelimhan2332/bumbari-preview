/* Four equal gores, derived from the straight-skirt block and the flare-by-slashing
   instruction in Ателье-2001 PDF 8 (printed p. 9). This is a geometric adaptation,
   not a complete reproduction of the book's two-piece front/back method. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined',beltBuilder=node?require('./waistband').buildWaistband:root.buildWaistband;
 const defaults={waistEase:1,hipEase:2,hemExpansion:3,seamAllowance:1,hemAllowance:1,beltWidth:3,zipperLength:20};
 const limits={waist:[40,180],hip:[60,200],hipHeight:[10,40],length:[20,140]};
 const optionLimits={waistEase:[0,4],hipEase:[0,8],hemExpansion:[0,10],seamAllowance:[.5,2],hemAllowance:[.5,4],beltWidth:[2,5],zipperLength:[10,35]};
 function settings(input={}){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Некорректные настройки юбки из четырёх клиньев.');const out={...defaults};for(const [k,[lo,hi]] of Object.entries(optionLimits)){if(Object.hasOwn(input,k))out[k]=input[k];if(!Number.isFinite(out[k])||out[k]<lo||out[k]>hi)throw Error(`Проверьте настройку ${k}: ${lo}–${hi} см.`);}return out;}
 function pointWidth(y,v,s){const top=(v.waist+s.waistEase)/4,hip=(v.hip+s.hipEase)/4,hem=hip+2*s.hemExpansion;if(y<=v.hipHeight){const t=y/v.hipHeight;return top+(hip-top)*(t*t*(3-2*t));}const t=(y-v.hipHeight)/(v.length-v.hipHeight);return hip+(hem-hip)*(t*t*(3-2*t));}
 function build(values,options={}){
  const v={};for(const [k,[lo,hi]] of Object.entries(limits)){v[k]=values?.[k];if(!Number.isFinite(v[k])||v[k]<lo||v[k]>hi)throw Error(`Проверьте мерку ${k}: ${lo}–${hi} см.`);}
  if(v.hip<=v.waist||v.hipHeight>=v.length)throw Error('Обхват бёдер должен быть больше талии; высота бёдер — меньше длины юбки.');
  const s=settings(options);if(s.zipperLength>v.length-2)throw Error('Молния должна заканчиваться минимум за 2 см до низа.');
  const ys=[0,...Array.from({length:24},(_,i)=>v.length*i/24),v.hipHeight,v.length].filter((y,i,a)=>a.indexOf(y)===i).sort((a,b)=>a-b);
  const seam=[...ys.map(y=>({x:pointWidth(y,v,s)/2,y})),...ys.slice().reverse().map(y=>({x:-pointWidth(y,v,s)/2,y}))];
  const a=s.seamAllowance,h=s.hemAllowance;
  const cut=[{x:-pointWidth(0,v,s)/2-a,y:-a},...ys.slice(1).map(y=>({x:pointWidth(y,v,s)/2+a,y})),{x:pointWidth(v.length,v,s)/2+a,y:v.length+h},
   ...ys.slice(1).reverse().map(y=>({x:-pointWidth(y,v,s)/2-a,y})),{x:-pointWidth(0,v,s)/2-a,y:-a}];
  const waistSeam=v.waist+s.waistEase,belt=beltBuilder({waistSeam,finishedWidth:s.beltWidth});
  const bSeam=[{x:0,y:0},{x:belt.length,y:0},{x:belt.length,y:belt.cutWidth},{x:0,y:belt.cutWidth}],bCut=[{x:-a,y:-a},{x:belt.length+a,y:-a},{x:belt.length+a,y:belt.cutWidth+a},{x:-a,y:belt.cutWidth+a}];
  const hipCircumference=4*pointWidth(v.hipHeight,v,s),hemCircumference=4*pointWidth(v.length,v,s);
  return {version:'four-gore-kit-1',values:v,settings:s,pieces:[{id:'A',seam,cut,count:4},{id:'B',seam:bSeam,cut:bCut,count:1}],belt,
   audit:{waistSeam,hipCircumference,hipEase:hipCircumference-v.hip,hemCircumference,totalHemExpansion:hemCircumference-4*(v.hip+s.hipEase)/4,
    seamCount:4,waistError:waistSeam-(v.waist+s.waistEase),beltError:belt.length-belt.overlap-waistSeam,cutReady:false,fittingVerified:false}};
 }
 function artwork(k){
  const cmd=[],a=k.settings.seamAllowance,L=k.values.length,top=pointWidth(0,k.values,k.settings)/2,hem=pointWidth(L,k.values,k.settings)/2;
  const o={x:28+top*10+a*10,y:55+a*10},line=(p,q,origin=o)=>cmd.push(['L',origin.x+p.x*10,origin.y+p.y*10,origin.x+q.x*10,origin.y+q.y*10]),text=(x,y,t)=>cmd.push(['T',x,y,t]);
  const chain=(pts,origin,close=true)=>{for(let i=1;i<pts.length;i++)line(pts[i-1],pts[i],origin);if(close)line(pts.at(-1),pts[0],origin);};
  text(8,10,'BUMBARI / FOUR-GORE SKIRT / 1:1 / WOVEN / TOILE FIRST');
  text(8,17,`WAIST ${k.values.waist}; HIP ${k.values.hip}; HIP HEIGHT ${k.values.hipHeight}; LENGTH ${L} cm`);
  text(8,24,`WAIST EASE ${k.settings.waistEase}; HIP EASE ${k.settings.hipEase}; HEM EXPANSION ${k.settings.hemExpansion} PER SIDE / SEAM ALLOWANCE ${a} / HEM ${k.settings.hemAllowance} cm`);
  text(8,31,'FOUR IDENTICAL PANELS / GEOMETRIC ADAPTATION / FIT NOT VERIFIED');
  const p=k.pieces[0];cmd.push(['K',0,0,0],['W',.4],['D']);chain(p.cut,o);cmd.push(['K',.25,.4,.6],['W',.2],['D',2,1]);chain(p.seam,o);cmd.push(['D']);
  text(o.x+top*10+8,o.y+L*5,'A: GORED PANEL / CUT 4');
  const yhip=o.y+k.values.hipHeight*10;cmd.push(['D',3,2]);line({x:-pointWidth(k.values.hipHeight,k.values,k.settings)/2,y:k.values.hipHeight},{x:pointWidth(k.values.hipHeight,k.values,k.settings)/2,y:k.values.hipHeight},o);cmd.push(['D']);
  line({x:0,y:8},{x:0,y:Math.min(L-3,23)});line({x:0,y:8},{x:-.4,y:9});line({x:0,y:8},{x:.4,y:9});text(o.x+5,o.y+150,'GRAIN / CENTRE');
  const zipY=Math.min(k.settings.zipperLength,L-2),zipX=pointWidth(zipY,k.values,k.settings)/2;
  line({x:zipX-.5,y:zipY},{x:zipX+.5,y:zipY});text(o.x+zipX*10+8,o.y+zipY*10,'ZIP END');
  text(o.x+top*10+8,yhip,'HIP LINE / MATCH ALL 4 PANELS');
  const belt=k.pieces[1],bo={x:8+a*10,y:o.y+(L+k.settings.hemAllowance+a+4)*10};cmd.push(['K',0,0,0],['W',.4],['D']);chain(belt.cut,bo);cmd.push(['K',.25,.4,.6],['W',.2],['D',2,1]);chain(belt.seam,bo);cmd.push(['D']);
  text(bo.x,bo.y+k.belt.cutWidth*10+9,`B: WAISTBAND / CUT 1 + FUSIBLE / LENGTH ${k.belt.length.toFixed(2)} cm`);
  const sx=Math.max(o.x+hem*10+a*10+30,bo.x+(k.belt.length+a*2)*10+15),sy=bo.y+k.belt.cutWidth*10+48;
  line({x:0,y:0},{x:10,y:0},{x:sx,y:sy});line({x:10,y:0},{x:10,y:10},{x:sx,y:sy});line({x:10,y:10},{x:0,y:10},{x:sx,y:sy});line({x:0,y:10},{x:0,y:0},{x:sx,y:sy});text(sx,sy-6,'CONTROL 100 x 100 mm');
  text(8,sy+120,'DARK SOLID: CUT LINE / DASH: STITCH LINE / PRINT AT 100%');
  return {cmd,width:Math.max(sx+115,560),height:sy+145};
 }
 function svg(art){let color='#142d50',width=.4,dash='',out=[];for(const c of art.cmd){if(c[0]==='K')color=c[1]===0?'#142d50':'#627a9a';if(c[0]==='W')width=c[1];if(c[0]==='D')dash=c.slice(1).join(' ');if(c[0]==='L')out.push(`<path d="M${c[1]} ${c[2]}L${c[3]} ${c[4]}" fill="none" stroke="${color}" stroke-width="${Math.max(.7,width*2)}" stroke-dasharray="${dash}"/>`);if(c[0]==='T')out.push(`<text x="${c[1]}" y="${c[2]}" font-family="Arial,sans-serif" font-size="12" fill="#142d50">${c[3]}</text>`);}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.width} ${art.height}" role="img" aria-label="Четырёхклинная юбка, выкройка клина и пояса">${out.join('')}</svg>`;}
 const api={defaults,settings,build,artwork,svg,pointWidth};root.FourGoreKit=api;if(node)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
