/* Standard trousers, Atelier 2001 PDF19–20 / printed20–21, figures1–2.
   Visually reviewed. cm; y increases downward from waist.
   Foundation points only, not finished contours or allowances. */
(function(root){
 function buildTrouserFoundation(v){
  const {hip,waist,sideLength,seatHeight,hemCircumference,shortening=3.5,backEase=0,stepExtra=1,hemInset=1,hemTurn=6}=v;
  for(const [key,n] of Object.entries({hip,waist,sideLength,seatHeight,hemCircumference,shortening,backEase,stepExtra,hemInset,hemTurn}))if(!Number.isFinite(n))throw Error('Введите число: '+key);
  if(hip<=waist||waist<=0||sideLength<=seatHeight||seatHeight<=0||hemCircumference<=0)throw Error('Проверьте обхваты, боковую длину и высоту сидения.');
  if(shortening<0||shortening>=sideLength-seatHeight)throw Error('Укорочение должно оставлять низ ниже линии сидения.');
  if(backEase<0||backEase>1||stepExtra<.5||stepExtra>1||hemInset<0||hemInset>1||hemTurn<4||hemTurn>8)throw Error('Параметры выходят за диапазоны выбранной инструкции.');
  const inseam=sideLength-seatHeight,kneeFromSeat=inseam*.4;
  const frontWidth=hip/4-1,backWidth=hip/4+1+backEase,stepWidth=hip/20+stepExtra;
  const hipY=seatHeight-(hip/20+3),kneeY=seatHeight+kneeFromSeat,hemY=sideLength-shortening;
  if(hipY<=1.5||hemY<=kneeY)throw Error('Для этих длин базисная сетка не поддерживается: проверьте высоту сидения и укорочение.');
  const crease=(frontWidth+stepWidth)/2,hemHalf=hemCircumference/4-hemInset;
  if(hemHalf<=0||crease<=hemHalf||frontWidth<=0)throw Error('Ширина низа не согласуется с сеткой.');
  const points={
   1:{x:0,y:0},2:{x:0,y:1.25},3:{x:0,y:seatHeight},4:{x:0,y:kneeY},5:{x:0,y:sideLength},6:{x:0,y:hemY},
   7:{x:0,y:hipY},8:{x:frontWidth,y:hipY},9:{x:frontWidth+stepWidth,y:hipY},
   '8a':{x:frontWidth,y:seatHeight},10:{x:frontWidth,y:0},11:{x:crease,y:hipY},12:{x:crease,y:hemY},13:{x:crease,y:kneeY},14:{x:crease,y:0},
   15:{x:crease-hemHalf,y:hemY},16:{x:crease+hemHalf,y:hemY},'15a':{x:crease-hemHalf,y:hemY-hemTurn},'16a':{x:crease+hemHalf,y:hemY-hemTurn}
  };
  // Intersections of hip→turned-hem guides with seat and knee levels (fig.2).
  const onY=(a,b,y)=>({x:a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y),y});
  if(hemY-hemTurn<=seatHeight)throw Error('Участок низа слишком короткий для выбранной обработки.');
  points['3a']=onY(points[7],points['15a'],seatHeight);
  points[17]=onY(points[9],points['16a'],seatHeight);
  points[18]=onY(points[7],points['15a'],kneeY);
  points[19]=onY(points[9],points['16a'],kneeY);
  return {values:{...v,shortening,backEase,stepExtra,hemInset,hemTurn},points,inseam,kneeFromSeat,frontWidth,backWidth,stepWidth,crease,hipY,kneeY,hemY,hemHalf,
   source:'Ателье-2001, PDF19–20, печатные20–21, рис.1–2',cutReady:false};
 }
 function foundationArtwork(d){
  const cmd=[],p=d.points,x=n=>20+n*10,y=n=>25+n*10;
  const line=(a,b)=>cmd.push(['L',x(a.x),y(a.y),x(b.x),y(b.y)]);
  cmd.push(['T',15,10,'BUMBARI / TROUSER FOUNDATION / 1:1 / NOT A CUTTING PATTERN']);
  cmd.push(['T',15,17,'FRONT GRID ONLY / NO FINISHED CURVES OR SEAM ALLOWANCES']);
  for(const level of [0,d.hipY,d.values.seatHeight,d.kneeY,d.hemY])line({x:0,y:level},{x:d.frontWidth+d.stepWidth+3,y:level});
  for(const xx of [0,d.frontWidth,d.crease])line({x:xx,y:0},{x:xx,y:d.hemY});
  for(const [a,b] of [[7,'15a'],[9,'16a'],[15,'15a'],[16,'16a']])line(p[a],p[b]);
  for(const [name,point] of Object.entries(p))cmd.push(['T',x(point.x)+1,y(point.y)-1,name]);
  const sx=x(d.frontWidth+d.stepWidth+5),sy=40;
  for(const [a,b,c,e] of [[sx,sy,sx+100,sy],[sx+100,sy,sx+100,sy+100],[sx+100,sy+100,sx,sy+100],[sx,sy+100,sx,sy]])cmd.push(['L',a,b,c,e]);
  cmd.push(['T',sx,sy-5,'CONTROL 100 x 100 mm']);
  return {cmd,width:sx+115,height:y(d.hemY)+20};
 }
 root.TrouserFoundation={build:buildTrouserFoundation,artwork:foundationArtwork};
 if(typeof module!=='undefined'){module.exports=root.TrouserFoundation;return;}
 const host=document.createElement('section');host.className='panel';host.style.marginTop='22px';
 const fields=[['waist','Талия',76],['hip','Бёдра',100],['sideLength','Длина сбоку до пола',106],['seatHeight','Высота сидения',26.5],['hemCircumference','Полный обхват низа одной штанины',42],['shortening','Укорочение от пола',3.5]];
 host.innerHTML='<h2>Стандартные брюки · базисная сетка</h2><p>Отдельная модель в разработке. Здесь построены точки и линии передней сетки, а не готовые лекала. Мерки юбки не изменяются. Все значения в сантиметрах.</p><div class="form">'+fields.map(([key,label,value])=>`<label>${label}<input id="trouser-${key}" type="number" min="0" step="0.1" value="${value}"></label>`).join('')+'</div><p id="trouser-result" aria-live="polite"></p><div id="trouser-preview"></div><button id="trouser-export" class="secondary">Скачать сетку брюк 1:1</button><p>Задняя половинка, оформление банта, талии и вытачек, сопряжение швов и припуски ещё не построены. Эта сетка не предназначена для раскроя. Мерки этого блока пока не сохраняются в файле проекта.</p>';
 document.querySelector('.shell').append(host);
 const values=()=>Object.fromEntries(fields.map(([key])=>[key,Number(document.getElementById('trouser-'+key).value)]));
 function refresh(){
  const out=document.getElementById('trouser-result'),preview=document.getElementById('trouser-preview');
  try{const d=buildTrouserFoundation(values()),art=foundationArtwork(d),f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
   out.textContent=`Длина шага: ${f(d.inseam)}; от сидения до колена: ${f(d.kneeFromSeat)}; ширина передней половинки: ${f(d.frontWidth)}; задней: ${f(d.backWidth)}; ширина шага переда: ${f(d.stepWidth)}; линия бёдер от талии: ${f(d.hipY)} см.`;
   preview.innerHTML=`<svg viewBox="0 0 ${art.width} ${art.height}" style="height:520px;max-width:100%" role="img" aria-label="Базисная сетка брюк с номерами точек">${art.cmd.filter(c=>c[0]==='L').map(c=>`<path d="M${c[1]} ${c[2]}L${c[3]} ${c[4]}" stroke="#244d80" fill="none" stroke-width="1"/>`).join('')}${Object.entries(d.points).map(([name,p])=>`<text x="${21+p.x*10}" y="${24+p.y*10}" font-size="10" fill="#203a60">${name}</text>`).join('')}</svg>`;
  }catch(e){out.textContent=e.message;preview.replaceChildren();}
 }
 host.addEventListener('input',refresh);
 document.getElementById('trouser-export').onclick=()=>{
  try{const art=foundationArtwork(buildTrouserFoundation(values())),P=root.MuellerPattern,bytes=P.pdf(art,P.pages(art,'a4')),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
   const a=document.createElement('a');a.href=url;a.download='bumbari-trouser-foundation.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){document.getElementById('trouser-result').textContent=e.message;}
 };refresh();
})(typeof window!=='undefined'?window:globalThis);