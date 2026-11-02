/* Separate 1:1 construction aid, NOT complete garment pieces. Geometry in cm,
   artwork in mm. Source geometry/provenance: skirt-vent.js and BOOK-REVIEW.md. */
(function(root){
 const node=typeof module!=='undefined';
 const build=node?require('./skirt-vent').buildVent:root.buildVent;
 function ventArtwork(values){
  const v=build(values),cmd=[],line=(...p)=>cmd.push(['L',...p]),text=(...p)=>cmd.push(['T',...p]);
  text(10,10,'БУМБАРИ / ПОСТРОЕНИЕ ШЛИЦЫ / 1:1');
  text(10,17,'НЕ ПОЛНЫЕ ДЕТАЛИ СПИНКИ / БЕЗ ПРИПУСКОВ ШВОВ И НИЗА');
  text(10,24,`ДЛИНА ШЛИЦЫ ${v.ventLength} СМ; ШИРИНА ${v.width} СМ; НАЧАЛО НИЖЕ ТАЛИИ НА ${v.top} СМ`);
  for(const [index,side] of ['right','left'].entries()){
   const x=20+v.width*10+index*(v.width*20+30),y=45;
   const edge=v.backSeamEdges[side];
   for(let i=1;i<edge.length;i++)line(x+edge[i-1].x*10,y+edge[i-1].y*10,x+edge[i].x*10,y+edge[i].y*10);
   for(let dy=v.top*10;dy<v.length*10;dy+=8)line(x,y+dy,x,y+Math.min(dy+4,v.length*10));
   const sign=side==='right'?1:-1;
   line(x,y+v.top*10,x+sign*v.width*10,y+(v.top-1.5)*10);
   text(x-v.width*10,y+v.length*10+10,(side==='right'?'ПРАВЫЙ':'ЛЕВЫЙ')+' КРАЙ СРЕДНЕГО ШВА СПИНКИ');
  }
  const sx=25,sy=65+v.length*10;
  line(sx,sy,sx+100,sy);line(sx+100,sy,sx+100,sy+100);line(sx+100,sy+100,sx,sy+100);line(sx,sy+100,sx,sy);
  text(sx,sy+110,'КОНТРОЛЬНЫЙ КВАДРАТ 100 × 100 ММ / ПЕЧАТАТЬ 100%');
  return {cmd,width:Math.max(220,v.width*40+90),height:sy+120};
 }
 root.ventArtwork=ventArtwork;
 if(node){module.exports={ventArtwork};return;}
 const button=document.createElement('button');button.className='secondary';button.textContent='Скачать схему краёв шлицы 1:1';
 document.getElementById('vent-preview').after(button);
 button.onclick=()=>{
  const out=document.getElementById('vent-result');
  try{
   const art=ventArtwork({length:number('length'),hipHeight:number('hipheight'),ventLength:Number(document.getElementById('vent-length').value),width:Number(document.getElementById('vent-width').value)});
   const p=root.MuellerPattern,bytes=p.pdf(art,p.pages(art,'a4')),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
   const a=document.createElement('a');a.href=url;a.download='bumbari-vent-construction.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
   out.textContent='Схема краёв шлицы подготовлена: это не полные детали спинки. Печатать 100%, проверить квадрат 100 мм. Припуски швов и подгибки не включены.';
  }catch(e){out.textContent=e.message;}
 };
})(typeof window!=='undefined'?window:globalThis);