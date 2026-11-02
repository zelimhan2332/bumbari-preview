(function(root){
const node=typeof module!=='undefined',E=node?require('./skirt-geometry'):root.MuellerSkirtGeometry,calc=node?require('./skirt-calculation').calculateSkirtReference:calculateSkirtReference,waistband=node?require('./waistband').buildWaistband:root.buildWaistband;
function build(v){
 const c=calc(v),reference=c.exactBookCase;
 if(!c.darts){
  if(c.intake<8||c.intake>18)throw Error('Для такого соотношения талии и бёдер построение ещё не поддерживается.');
  const front=Math.min(2.5,Math.max(1.5,c.intake/7)),side=c.intake/2,b=c.intake-side-front;
  c.darts={side,front,back:b>4?[b*.6,b*.4]:[b]};
 }
 const base=E.buildSkirtGeometry(v,{...c,exactBookCase:true});
 function candidate(take,rise){
  const g=JSON.parse(JSON.stringify(base)),h=g.half,H=v.hipHeight;
  g.front.end.x-=take/2;g.back.start.x+=take/2;g.back.start.y=-rise;
   // Preserve the selected source offset as numerical truing moves the side endpoint.
   for(const d of g.front.darts)for(const point of [d.left,d.right,d.tip])point.x-=take/2;
  for(const p of [g.front,g.back]){if(!reference)for(const d of p.darts){d.tip.y*=H/20.8;d.closeAngle=Math.atan2(d.left.y-d.tip.y,d.left.x-d.tip.x)-Math.atan2(d.right.y-d.tip.y,d.right.x-d.tip.x);}p.waist=E.waistSegments(p.start,p.end,p.darts);}
  const f=g.front.end,b=g.back.start;
  g.front.side={a:f,c1:{x:f.x+(h-f.x)/2,y:f.y+(H-f.y)/3},c2:{x:h,y:H*.7},b:{x:h,y:H}};
  g.back.side={a:{x:0,y:H},c1:{x:0,y:H*.7},c2:{x:b.x/2,y:b.y+(H-b.y)/3},b};
  g.audit=E.auditGeometry(g,v,c);return g;
 }
 let take=0,rise=1.25,g;
 for(let i=0;i<15;i++){
  g=candidate(take,rise);const a=g.audit;if(Math.abs(a.waistError)<1e-7&&Math.abs(a.sideError)<1e-7)break;
  const e=.0001,t=candidate(take+e,rise).audit,r=candidate(take,rise+e).audit;
  const A=(t.waistError-a.waistError)/e,B=(r.waistError-a.waistError)/e,C=(t.sideError-a.sideError)/e,D=(r.sideError-a.sideError)/e,det=A*D-B*C;
  if(Math.abs(det)<1e-9)throw Error('Не удалось согласовать контуры.');take-=(D*a.waistError-B*a.sideError)/det;rise-=(-C*a.waistError+A*a.sideError)/det;
 }
 if(!g.audit.waistPass||!g.audit.sidePass||rise<0||rise>3)throw Error('Контроль контуров не пройден.');
 return {values:v,geometry:g,calculation:c,reference};
}
function artwork(data){
 const v=data.values,g=data.geometry,cmd=[],h=g.half*10,H=v.hipHeight*10,L=v.length*10,bx=h+55;
 const line=(...p)=>cmd.push(['L',...p]),text=(...p)=>cmd.push(['T',...p]);
 const curve=(s,x,y)=>cmd.push(['C',...[s.a,s.c1,s.c2,s.b].flatMap(p=>[x+p.x*10,y+p.y*10])]);
  text(15,10,'BUMBARI / TOILE / 1:1 / NO SEAM ALLOWANCES');text(15,17,`Waist ${v.waist}; hip ${v.hip}; hip height ${v.hipHeight}; length ${v.length} cm`);
  text(15,24,data.reference?'BOOK NUMERIC CASE / CONTOURS REQUIRE VERIFICATION':'EXPERIMENTAL DART DISTRIBUTION / NOT BOOK-VERIFIED');
  text(15,31,'SOURCE: ATELIER 2001, PDF 5-7 / NUMERICAL TRUING / TEST TOILE REQUIRED');
 for(const [p,x,front] of [[g.front,15,true],[g.back,bx,false]]){
  const y=40;for(const s of p.waist)curve(s,x,y);curve(p.side,x,y);
  for(const d of p.darts){for(const end of [d.left,d.right])line(x+end.x*10,y+end.y*10,x+d.tip.x*10,y+d.tip.y*10);line(x+d.left.x*10,y+d.left.y*10,x+d.right.x*10,y+d.right.y*10);}
  line(x,y+L,x+h,y+L);line(x+(front?0:h),y,x+(front?0:h),y+L);line(x+(front?h:0),y+H,x+(front?h:0),y+L);line(x,y+H,x+h,y+H);
  text(x+20,y+L*.55,front?'FRONT: 1 ON FOLD':'BACK: 2 MIRRORED');text(x+20,y+L*.55+8,'SEAM LINE - ADD ALLOWANCES');
  line(x+h*.6,y+L*.65,x+h*.6,y+L*.9);line(x+h*.6,y+L*.65,x+h*.6-3,y+L*.65+7);line(x+h*.6,y+L*.65,x+h*.6+3,y+L*.65+7);text(x+h*.6+4,y+L*.77,'GRAIN');
 }
  const belt=waistband({waistSeam:g.audit.waist*2}),band=belt.length*10,by=L+65;
  line(15,by,15+band,by);line(15,by+belt.cutWidth*10,15+band,by+belt.cutWidth*10);line(15,by,15,by+belt.cutWidth*10);line(15+band,by,15+band,by+belt.cutWidth*10);line(15,by+belt.finishedWidth*10,15+band,by+belt.finishedWidth*10);line(15+band-belt.overlap*10,by,15+band-belt.overlap*10,by+belt.cutWidth*10);
  text(20,by+13,`WAISTBAND ${belt.length.toFixed(2)} x ${belt.cutWidth} cm / overlap ${belt.overlap} cm / ADD ALLOWANCES`);
  text(20,by+23,'ATELIER 2001 PDF 9 FIG 9 / LENGTH MATCHED TO GENERATED WAIST SEAM');
 const sx=bx+h+20;line(sx,40,sx+100,40);line(sx,140,sx+100,140);line(sx,40,sx,140);line(sx+100,40,sx+100,140);text(sx,32,'CONTROL 100 x 100 mm');
 return {cmd,width:Math.max(sx+110,band+30),height:by+75};
}
function pages(art,format){
 if(format==='plotter'){if(art.width>821||art.height>1169)throw Error('Не помещается на А0. Выберите А4.');return [{width:841,height:1189,x:0,y:0,label:'A0 / 100% / NO FIT TO PAGE'}];}
 const cols=Math.ceil((art.width-10)/180),rows=Math.ceil((art.height-10)/267),out=[];
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out.push({width:210,height:297,x:c*180,y:r*267,label:`R${r+1}C${c+1} / ${rows} rows x ${cols} columns / overlap 10 mm / 100%`});return out;
}
function pdf(art,tiles){
 const enc=new TextEncoder(),o=[],n=x=>(x*72/25.4).toFixed(4),esc=s=>s.replace(/[\\()]/g,'\\$&');
 o[1]='<< /Type /Catalog /Pages 2 0 R >>';o[2]=`<< /Type /Pages /Kids [${tiles.map((_,i)=>`${4+i*2} 0 R`).join(' ')}] /Count ${tiles.length} >>`;o[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
 tiles.forEach((t,i)=>{
  const id=4+i*2,W=t.width,H=t.height,X=x=>n(x-t.x+10),Y=y=>n(H-10-y+t.y);
  let s=`0.6 w\nBT /F1 8 Tf 28 ${n(H-5)} Td (${esc(t.label)}) Tj ET\nq\n${n(10)} ${n(10)} ${n(W-20)} ${n(H-20)} re W n\n`;
  for(const c of art.cmd){
   if(c[0]==='W')s+=`${n(c[1])} w\n`;
   if(c[0]==='K')s+=`${c.slice(1).map(x=>Number(x).toFixed(4)).join(' ')} RG\n`;
   if(c[0]==='L')s+=`${X(c[1])} ${Y(c[2])} m ${X(c[3])} ${Y(c[4])} l S\n`;
   if(c[0]==='C')s+=`${X(c[1])} ${Y(c[2])} m ${X(c[3])} ${Y(c[4])} ${X(c[5])} ${Y(c[6])} ${X(c[7])} ${Y(c[8])} c S\n`;
   if(c[0]==='T')s+=`BT /F1 9 Tf ${X(c[1])} ${Y(c[2])} Td (${esc(c[3])}) Tj ET\n`;
  }
  s+=`Q\n${n(10)} ${n(10)} ${n(W-20)} ${n(H-20)} re S\n`;
  o[id]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(W)} ${n(H)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id+1} 0 R >>`;o[id+1]=`<< /Length ${enc.encode(s).length} >>\nstream\n${s}endstream`;
 });
 let out='%PDF-1.4\n',offset=[0];for(let i=1;i<o.length;i++){offset[i]=enc.encode(out).length;out+=`${i} 0 obj\n${o[i]}\nendobj\n`;}
 const start=enc.encode(out).length;out+=`xref\n0 ${o.length}\n0000000000 65535 f \n`;for(let i=1;i<o.length;i++)out+=String(offset[i]).padStart(10,'0')+' 00000 n \n';return enc.encode(out+`trailer\n<< /Size ${o.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
}
const api={build,artwork,pages,pdf};if(node){module.exports=api;return;}root.MuellerPattern=api;
const status=document.getElementById('print-status');
for(const format of ['a4','plotter'])document.getElementById('format-'+format).addEventListener('click',()=>{status.textContent=format==='a4'?'Печать 1:1 на А4, нахлёст 10 мм.':'Печать 1:1 на А0 для плоттера.';});
for(const id of ['print-scheme','download-scheme-pdf'])document.getElementById(id).onclick=()=>{
 try{
  const reference=calc({waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value}).exactBookCase;
  const readiness=root.printReadiness({reference,modeling:root.getSkirtModeling?.(),vent:root.getSkirtVent?.(),experimentalConsent:document.getElementById('experimental-print-consent').checked});
  if(!readiness.allowed)throw Error(readiness.errors.join(' '));
  const v={waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value},d=build(v),a=artwork(d),tiles=pages(a,root.muellerPrintFormat),bytes=pdf(a,tiles);
   const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;if(id==='download-scheme-pdf')link.download=`bumbari-${v.waist}-${v.hip}-1to1.pdf`;else{link.target='_blank';link.rel='noopener';}document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
  status.textContent=`Лекало построено по текущим меркам: ${tiles.length} листов. Талия по шву ${(d.geometry.audit.waist*2).toFixed(2)} см. Боковые швы согласованы. Печатать 100%; квадрат 10 × 10 см. ${d.reference?'Контрольный пример.':'Расчётное распределение вытачек, посадка не проверена.'} Сначала пробник.`;
 }catch(e){status.textContent='Построение остановлено: '+e.message;}
};
const note=document.createElement('p');note.textContent='Лекало 1:1 строится по текущим меркам. А4: нахлёст 10 мм, сборка по R (ряд) и C (колонка). Плоттер: А0. Печатать 100%, без подгонки. Контуры БЕЗ припусков: добавьте 1 см по талии, 1,5 см по бокам и середине спинки, 3 см по низу, 1 см вокруг пояса. По сгибу переда припуска нет. Вытачки не вырезать. Сначала сшейте пробник.';status.before(note);
const consent=document.createElement('label');consent.innerHTML='<input id="experimental-print-consent" type="checkbox"> Разрешить учебный PDF с экспериментальным распределением вытачек. Не считать готовым лекалом для раскроя.';status.before(consent);
function refresh(){
 try{const d=build({waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value});document.getElementById('calculation-note').textContent='Контуры пересчитаны по текущим меркам. Талия по шву: '+(d.geometry.audit.waist*2).toFixed(2)+' см (включая 2 см прибавки). Боковые швы согласованы. '+(d.reference?'Основа контрольного примера.':'Распределение вытачек расчётное, посадка не проверена.')+' Для первого пошива используйте пробную ткань.';}catch(e){document.getElementById('calculation-note').textContent=e.message;}
}
document.addEventListener('input',refresh);document.addEventListener('change',refresh);document.addEventListener('click',refresh);
if(typeof render==='function')render();refresh();
})(typeof window!=='undefined'?window:globalThis);
