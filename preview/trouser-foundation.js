/* Standard trousers, Atelier 2001 PDF19–22 / printed20–23, figures1–6.
   Visually reviewed. cm; y increases downward from waist.
   Experimental back contour uses seam-length trueing; all spline curves are digital approximations. */
(function(root){
 function buildTrouserFoundation(v){
  const {hip,waist,sideLength,seatHeight,hemCircumference,shortening=3.5,backEase=0,stepExtra=1,hemInset=1,hemTurn=6,frontDart=2,frontDartLength=9.5,frontWaistEase=.25,backShift=1.5,seatShapeOffset=4,backLengthReduction=.5,backTopShift=.75,backDart=3.5,backDartLength=14,backWaistEase=.25,backSideSeamReduction=.25,backInseamReduction=.25}=v;
  for(const [key,n] of Object.entries({hip,waist,sideLength,seatHeight,hemCircumference,shortening,backEase,stepExtra,hemInset,hemTurn,frontDart,frontDartLength,frontWaistEase,backShift,seatShapeOffset,backLengthReduction,backTopShift,backDart,backDartLength,backWaistEase,backSideSeamReduction,backInseamReduction}))if(!Number.isFinite(n))throw Error('Введите число: '+key);
  if(hip<=waist||waist<=0||sideLength<=seatHeight||seatHeight<=0||hemCircumference<=0)throw Error('Проверьте обхваты, боковую длину и высоту сидения.');
  if(shortening<0||shortening>=sideLength-seatHeight)throw Error('Укорочение должно оставлять низ ниже линии сидения.');
  if(backEase<0||backEase>1||stepExtra<.5||stepExtra>1||hemInset<0||hemInset>1||hemTurn<4||hemTurn>8||frontDart<1.5||frontDart>2.5||frontDartLength<9||frontDartLength>10||frontWaistEase<0||frontWaistEase>.5||backShift<1||backShift>2||seatShapeOffset<3||seatShapeOffset>5||backLengthReduction<0||backLengthReduction>1||backTopShift<.5||backTopShift>1||backDart<3||backDart>4||backDartLength<13||backDartLength>15||backWaistEase<0||backWaistEase>.5||backSideSeamReduction<0||backSideSeamReduction>.5||backInseamReduction<0||backInseamReduction>.5)throw Error('Параметры выходят за диапазоны выбранной инструкции.');
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
  // Source steps 1–3: waist, fly, knee and dart construction for the front half.
  // PDF20: point 20 lies on the vertical through point 8 shifted 0.5 cm right.
  points[20]={x:points[8].x+.5,y:0};
  points[21]={x:points[20].x-waist/4-frontDart-frontWaistEase,y:points[20].y};
  points[22]={x:points[21].x,y:points[21].y+1.25};
  points[23]={...points[18]};points[24]={...points[19]};
  // Source step 4 (PDF21): back half is shifted left; points 25–27 set its top reference.
  points[25]={x:points[11].x+backShift,y:points[11].y};
  points[26]={x:points[25].x+backWidth/4,y:points[25].y};
  points[27]={x:points['3a'].x,y:points['3a'].y-seatShapeOffset};
  const backGridLift=points[27].y-hipY;
  if(backGridLift<=0)throw Error('Для задней сетки точка 27 должна находиться ниже базовой линии бёдер.');
  points[28]={x:points[26].x,y:points[26].y-backGridLift};
  points[29]={x:points[27].x,y:hipY};
  points[30]={x:2*points[25].x-points[29].x,y:hipY};
  // Source step 5 (PDF21): lower back grid lines sit 2 cm outside front guides.
  points[31]={x:points[19].x+2,y:kneeY};points[32]={x:points[18].x-2,y:kneeY};
  points[33]={x:points[15].x-2,y:hemY};points['33a']={x:points[33].x,y:hemY-hemTurn};
  points[34]={x:points[16].x+2,y:hemY};points['34a']={x:points[34].x,y:hemY-hemTurn};
  const backWaistT=(0-points[32].y)/(points[29].y-points[32].y);
  points[35]={x:points[32].x+(points[29].x-points[32].x)*backWaistT,y:0};
  // Source step 6 (PDF22): set 13–36 to 13–35 minus 0–1 cm.
  // Figure 6 places 36 on the waist line; solve that circle/line intersection.
  const dist=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),r36=dist(points[13],points[35])-backLengthReduction,dy36=-points[13].y;
  if(r36<=Math.abs(dy36))throw Error('Длина 13–36 не достигает линии талии; проверьте сетку брюк.');
  points[36]={x:points[13].x+Math.sqrt(r36*r36-dy36*dy36),y:0};
  // Point 37 is shifted left on 36–35; 37–38 is the upper back segment
  // specified as 1/4 waist + dart intake + ease (PDF22, figure 6).
  const along=(a,b,length)=>{const n=dist(a,b);if(n<=1e-9)throw Error('Нельзя построить верх задней половинки.');return{x:a.x+(b.x-a.x)*length/n,y:a.y+(b.y-a.y)*length/n};};
  points[37]=along(points[36],points[35],backTopShift);
  points[38]=along(points[37],points[35],waist/4+backDart+backWaistEase);
  const waistAxis={x:points[36].x-points[35].x,y:points[36].y-points[35].y},waistAxisLength=Math.hypot(waistAxis.x,waistAxis.y);
  const dartCenter={x:(points[37].x+points[38].x)/2,y:(points[37].y+points[38].y)/2};
  const dartHalf={x:waistAxis.x/waistAxisLength*backDart/2,y:waistAxis.y/waistAxisLength*backDart/2};
  const backDartShape={left:{x:dartCenter.x-dartHalf.x,y:dartCenter.y-dartHalf.y},right:{x:dartCenter.x+dartHalf.x,y:dartCenter.y+dartHalf.y},apex:{x:dartCenter.x-waistAxis.y/waistAxisLength*backDartLength,y:dartCenter.y+waistAxis.x/waistAxisLength*backDartLength},intake:backDart,length:backDartLength};
  points['8b']={x:(points['8a'].x+points[17].x)/2,y:seatHeight};
  points['8c']={x:points[8].x+.5,y:seatHeight};
  const d0=points[22],d1=points[14],dx=d1.x-d0.x,dy=d1.y-d0.y,dl=Math.hypot(dx,dy),mx=(d0.x+d1.x)/2,my=(d0.y+d1.y)/2;
  if(dl<=frontDart+1||points[21].x< -1)throw Error('Передняя талиевая линия не согласуется с обхватами и раствором вытачки.');
  const dartLeft={x:mx-dx/dl*frontDart/2,y:my-dy/dl*frontDart/2},dartRight={x:mx+dx/dl*frontDart/2,y:my+dy/dl*frontDart/2};
  const frontDartShape={left:dartLeft,right:dartRight,apex:{x:mx,y:my+frontDartLength},intake:frontDart,length:frontDartLength};
  const through=pts=>{const out=[pts[0]],steps=8;for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];for(let j=1;j<=steps;j++){const t=j/steps,t2=t*t,t3=t2*t;out.push({x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)});}}return out;};
  const side=through([points[22],points[7],points['3a'],points[23],points['15a'],points[15]]);
  const fly=through([points[20],points['8c'],points['8b'],points[17]]);
  const inseamCurve=through([points[17],points[24],points['16a'],points[16]]);
  const frontOutline=[...side,points[16],...inseamCurve.slice(0,-1).reverse(),...fly.slice(0,-1).reverse(),points[14],points[22]];
  const curveLength=curve=>curve.slice(1).reduce((sum,q,i)=>sum+dist(curve[i],q),0);
  const frontSideLength=curveLength(side),frontInseamLength=curveLength(inseamCurve);
  // Step 7 trueing: adjust a digital waist endpoint so the back side seam
  // is 0–0.5 cm shorter than the front side seam.
  const backSideTarget=frontSideLength-backSideSeamReduction;
  const sideAt=y=>{const start={x:points[35].x,y};return curveLength(through([start,points[29],points[32],points[33]]));};
  let sideLow=-5,sideHigh=5;
  if(sideAt(sideLow)<backSideTarget||sideAt(sideHigh)>backSideTarget)throw Error('Не удаётся согласовать длину бокового среза задней половинки в выбранном диапазоне.');
  for(let i=0;i<48;i++){const mid=(sideLow+sideHigh)/2;if(sideAt(mid)>backSideTarget)sideLow=mid;else sideHigh=mid;}
  points['35a']={x:points[35].x,y:(sideLow+sideHigh)/2};
  const backSide=through([points['35a'],points[29],points[32],points[33]]);
  // Figure 6 places 39 on guide 30–31; solve its position by the source
  // inseam-length relation and the selected 0–0.5 cm reduction.
  const backInseamTarget=frontInseamLength-backInseamReduction;
  const point39At=t=>({x:points[30].x+(points[31].x-points[30].x)*t,y:points[30].y+(points[31].y-points[30].y)*t});
  const inseamAt=t=>curveLength(through([point39At(t),points[31],points[34]]));
  if(backInseamTarget>inseamAt(0)||backInseamTarget<inseamAt(1))throw Error('Нельзя согласовать задний шаговый срез с передним в диапазоне шага 6.');
  let inseamLow=0,inseamHigh=1;
  for(let i=0;i<48;i++){const mid=(inseamLow+inseamHigh)/2;if(inseamAt(mid)>backInseamTarget)inseamLow=mid;else inseamHigh=mid;}
  points[39]=point39At((inseamLow+inseamHigh)/2);
  const backInseam=through([points[39],points[31],points[34]]);
  const backCrotch=through([points[37],points[28],points[39]]);
  const backWaist=through([points['35a'],points[38],points[37]]);
  // Step 7 view only: fold one dart side about its apex; this does not replace the cut contour.
  const rotateAround=(q,c,a)=>{const dx=q.x-c.x,dy=q.y-c.y,co=Math.cos(a),si=Math.sin(a);return{x:c.x+dx*co-dy*si,y:c.y+dx*si+dy*co};};
  const closureRightVec={x:backDartShape.right.x-backDartShape.apex.x,y:backDartShape.right.y-backDartShape.apex.y};
  const closureLeftVec={x:backDartShape.left.x-backDartShape.apex.x,y:backDartShape.left.y-backDartShape.apex.y};
  const dartCloseAngle=Math.atan2(closureRightVec.x*closureLeftVec.y-closureRightVec.y*closureLeftVec.x,closureRightVec.x*closureLeftVec.x+closureRightVec.y*closureLeftVec.y);
  const closed37=rotateAround(points[37],backDartShape.apex,dartCloseAngle);
  const closedDartWaist=through([points[38],backDartShape.left,closed37]);
  const backDartClosure={angle:dartCloseAngle,closed37,waist:closedDartWaist};
  const backOutline=[...backWaist,...backCrotch.slice(1),...backInseam.slice(1),points[33],...backSide.slice(0,-1).reverse()];
  const backSideLength=curveLength(backSide),backInseamLength=curveLength(backInseam);
  return {values:{...v,shortening,backEase,stepExtra,hemInset,hemTurn,frontDart,frontDartLength,frontWaistEase,backShift,seatShapeOffset,backLengthReduction,backTopShift,backDart,backDartLength,backWaistEase,backSideSeamReduction,backInseamReduction},points,front:{outline:frontOutline,side,fly,inseam:inseamCurve,dart:frontDartShape,sideLength:frontSideLength,inseamLength:frontInseamLength},back:{outline:backOutline,side:backSide,inseam:backInseam,crotch:backCrotch,waist:backWaist,dartClosure:backDartClosure,sideLength:backSideLength,inseamLength:backInseamLength,sideReduction:frontSideLength-backSideLength,inseamReduction:frontInseamLength-backInseamLength},backGuide:{points:[points[25],points[26],points[27],points[28],points[29],points[30],points[31],points[32],points[33],points['33a'],points[34],points['34a'],points[35],points['35a'],points[36],points[37],points[38],points[39]],dart:backDartShape,lowerOffset:2,widthQuarter:backWidth/4,seatShapeOffset,gridLift:backGridLift},inseam,kneeFromSeat,frontWidth,backWidth,stepWidth,crease,hipY,kneeY,hemY,hemHalf,
  source:'Ателье-2001, PDF19–22, печатные20–23, рис.1–6; задний контур инженерно уточнён по длинам швов, требует макета',cutReady:false};
 }
 function foundationArtwork(d){
  const cmd=[],p=d.points,x=n=>20+n*10,y=n=>25+n*10;
  const line=(a,b)=>cmd.push(['L',x(a.x),y(a.y),x(b.x),y(b.y)]);
  cmd.push(['T',15,10,'BUMBARI / TROUSER STUDY / 1:1 / NO SEAM ALLOWANCES']);
  cmd.push(['T',15,17,'FRONT CONTOUR / BACK OUTLINE EXPERIMENTAL / NOT CUT READY']);
  for(const level of [0,d.hipY,d.values.seatHeight,d.kneeY,d.hemY])line({x:0,y:level},{x:d.frontWidth+d.stepWidth+3,y:level});
  for(const xx of [0,d.frontWidth,d.crease])line({x:xx,y:0},{x:xx,y:d.hemY});
  for(const [a,b] of [[7,'15a'],[9,'16a'],[15,'15a'],[16,'16a']])line(p[a],p[b]);
  cmd.push(['K',.58,.68,.82]);
  line(p[11],p[25]);line(p[25],p[26]);line(p[26],p[27]);line(p[7],p[26]);
  line(p[28],p[29]);line(p[29],p[30]);line(p[32],p[29]);line(p[29],p[35]);line(p[30],p[31]);
  line(p[32],p[33]);line(p[31],p[34]);line(p[33],p['33a']);line(p[34],p['34a']);
  line(p[35],p[36]);line(p[36],p[37]);line(p[37],p[38]);
  line(d.backGuide.dart.left,d.backGuide.dart.apex);line(d.backGuide.dart.right,d.backGuide.dart.apex);
  cmd.push(['K',0,0,0]);
  line(p[20],p['8c']);line(p['8b'],p[17]);
  line(d.front.dart.left,d.front.dart.apex);line(d.front.dart.right,d.front.dart.apex);
  cmd.push(['W',1.4]);for(let i=0;i<d.front.outline.length-1;i++)line(d.front.outline[i],d.front.outline[i+1]);cmd.push(['W',.6]);
  cmd.push(['K',.72,.25,.45]);cmd.push(['W',1]);for(let i=0;i<d.back.outline.length-1;i++)line(d.back.outline[i],d.back.outline[i+1]);cmd.push(['W',.6]);cmd.push(['K',0,0,0]);
  for(const [name,point] of Object.entries(p))cmd.push(['T',x(point.x)+1,y(point.y)-1,name]);
  const sx=x(d.frontWidth+d.stepWidth+5),sy=40;
  for(const [a,b,c,e] of [[sx,sy,sx+100,sy],[sx+100,sy,sx+100,sy+100],[sx+100,sy+100,sx,sy+100],[sx,sy+100,sx,sy]])cmd.push(['L',a,b,c,e]);
  cmd.push(['T',sx,sy-5,'CONTROL 100 x 100 mm']);
  return {cmd,width:sx+115,height:y(d.hemY)+20};
 }
 root.TrouserFoundation={build:buildTrouserFoundation,artwork:foundationArtwork};
 if(typeof module!=='undefined'){module.exports=root.TrouserFoundation;return;}
 const host=document.createElement('section');host.className='panel';host.style.marginTop='22px';
 const fields=[['waist','Талия',76],['hip','Бёдра',100],['sideLength','Длина сбоку до пола',106],['seatHeight','Высота сидения',26.5],['hemCircumference','Полный обхват низа одной штанины',42],['shortening','Укорочение от пола',3.5],['frontDart','Раствор передней вытачки',2],['frontDartLength','Длина передней вытачки',9.5],['backShift','Сдвиг задней части, шаг 4',1.5],['seatShapeOffset','Отступ по форме ягодиц: выпуклые 3, плоские 5',4],['backLengthReduction','Уменьшение длины 13–36, шаг 6',.5],['backTopShift','Сдвиг 36–37, шаг 6',.75],['backDart','Раствор вытачки спинки',3.5],['backDartLength','Длина вытачки спинки',14],['backWaistEase','Прибавка 37–38 на посадку',.25],['backSideSeamReduction','Укорочение бокового шва спинки, 0–0,5',.25],['backInseamReduction','Укорочение шагового шва спинки, 0–0,5',.25]];
 host.innerHTML='<div class="form">'+fields.map(([key,label,value])=>`<div class="field"><label for="trouser-${key}">${label}</label><div class="wrap"><input id="trouser-${key}" inputmode="decimal" value="${value}"><em>см</em></div></div>`).join('')+'</div><p id="trouser-result" aria-live="polite"></p><div id="trouser-preview"></div><button id="trouser-export" class="secondary">Скачать учебный чертёж переда и спинки 1:1</button>';

 // Keep existing skirt controls and their listeners together; use the same four steps.
 const skirtPanels={},trouserPanels={};
 for(const step of [2,3,4]){
  const section=document.getElementById('s'+step),skirt=document.createElement('div'),pants=document.createElement('div');
  skirt.dataset.itemPanel='skirt';pants.dataset.itemPanel='pants';pants.hidden=true;
  while(section.firstChild)skirt.append(section.firstChild);
  section.append(skirt,pants);skirtPanels[step]=skirt;trouserPanels[step]=pants;
 }
 const heading=(panel,title,copy)=>{const h=document.createElement('h2'),p=document.createElement('p');h.textContent=title;p.textContent=copy;panel.append(h,p);};
 const action=(panel,label,step,validate=false)=>{const b=document.createElement('button');b.className='primary';b.textContent=label;b.onclick=()=>{try{if(validate)buildTrouserFoundation(values());go(step);}catch(e){document.getElementById('trouser-error').textContent=e.message;}};let actions=panel.querySelector('.actions');if(!actions){actions=document.createElement('div');actions.className='actions';panel.append(actions);}actions.append(b);};
 heading(trouserPanels[2],'Мерки для классических брюк','Все размеры в сантиметрах. Сейчас доступны передняя половинка и вспомогательные линии спинки; полный комплект ещё не готов.');
 trouserPanels[2].append(host.querySelector('.form'));
 const error=document.createElement('p');error.id='trouser-error';error.setAttribute('role','alert');trouserPanels[2].append(error);
 action(trouserPanels[2],'← Выбрать изделие',1);action(trouserPanels[2],'Построить →',3,true);
 heading(trouserPanels[3],'Чертёж основы брюк','Передняя половинка и экспериментальный контур спинки по длинам швов. Шаг 7 показан только как экранное складывание вытачки. Без припусков; линия после закрытия и посадка не проверены.');
 const guideSteps=document.createElement('div');
 guideSteps.className='guide-stages';
 guideSteps.setAttribute('role','group');
 guideSteps.setAttribute('aria-label','Этапы построения задней половинки');
 guideSteps.innerHTML='<button type="button" class="secondary" data-back-stage="1" aria-pressed="true">Шаг 1 · Опоры спинки 25–35</button><button type="button" class="secondary" data-back-stage="2" aria-pressed="false">Шаг 2 · Талия и вытачка 36–38</button><button type="button" class="secondary" data-back-stage="3" aria-pressed="false">Шаг 3 · Точка 39 и контур спинки</button><button type="button" class="secondary" data-back-stage="4" aria-pressed="false">Шаг 4 · Закрыть вытачку</button>';
 const guideCopy=document.createElement('p');
 guideCopy.className='muted';
 guideCopy.id='trouser-guide-copy';
 guideCopy.setAttribute('aria-live','polite');
 guideCopy.textContent='Шаг 1. Сверьте верхнюю опору, линию бёдер и направляющие колена и низа. Выбранные линии задней половинки выделены оранжевым.';
 trouserPanels[3].append(guideSteps,guideCopy,host.querySelector('#trouser-result'),host.querySelector('#trouser-preview'));
 let backStage=1;
 guideSteps.querySelectorAll('[data-back-stage]').forEach(button=>button.addEventListener('click',()=>{
  backStage=Number(button.dataset.backStage);
  guideSteps.querySelectorAll('[data-back-stage]').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));
  guideCopy.textContent=backStage===1
   ?'Шаг 1. Сверьте верхнюю опору, линию бёдер и направляющие колена и низа. Выбранные линии задней половинки выделены оранжевым.'
   :backStage===2
    ?'Шаг 2. Проверьте отрезок 36–37, верхнюю линию 37–38 и вытачку. Точка 36 размещена на линии талии как цифровая интерпретация рисунка.'
    :backStage===3
     ?'Шаг 3. Точка 39 найдена на направляющей 30–31 по длине заднего шагового среза; контур спинки показан фиолетовым. Перпендикуляр из 38 остаётся условной экранной подсказкой.'
     :'Шаг 4. Зелёным показана линия талии после поворота одной стороны вытачки к другой вокруг вершины. Это экранная иллюстрация шага 7 и не заменяет уточнение линии на бумажной выкройке; контур печати остаётся с открытыми метками вытачки.';
  refresh();
 }));
 action(trouserPanels[3],'← Изменить мерки',2);action(trouserPanels[3],'Печать →',4,true);
 heading(trouserPanels[4],'Печать учебного чертежа брюк','PDF 1:1 содержит передний контур и экспериментальный контур спинки с несложенной вытачкой. Припусков нет; шаг 7 показан только в экранном просмотре. Линия талии после закрытия и посадка не проверены макетом. Не использовать для раскроя без проверки. Печатайте 100%, без подгонки; проверьте квадрат 100 × 100 мм.');
 trouserPanels[4].append(host.querySelector('#trouser-export'));
 const printStatus=document.createElement('p');printStatus.id='trouser-print-status';printStatus.setAttribute('role','status');trouserPanels[4].append(printStatus);
 action(trouserPanels[4],'← К чертежу',3);

 const values=()=>Object.fromEntries(fields.map(([key])=>{const text=document.getElementById('trouser-'+key).value.trim();return [key,text===''?NaN:Number(text.replace(',','.'))];}));
 function refresh(){
  const out=document.getElementById('trouser-result'),preview=document.getElementById('trouser-preview');
  try{document.getElementById('trouser-error').textContent='';const d=buildTrouserFoundation(values()),art=foundationArtwork(d),f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
   out.textContent=`Длина шага: ${f(d.inseam)}; от сидения до колена: ${f(d.kneeFromSeat)}; ширина передней сетки: ${f(d.frontWidth)}; ширина шага переда: ${f(d.stepWidth)}; линия бёдер от талии: ${f(d.hipY)} см. Боковой шов перед/спинка: ${f(d.front.sideLength)}/${f(d.back.sideLength)} см; шаговый: ${f(d.front.inseamLength)}/${f(d.back.inseamLength)} см.`;
   let stroke=.6,ink='#244d80';const drawn=art.cmd.map(c=>{if(c[0]==='W'){stroke=c[1];return '';}if(c[0]==='K'){ink='#'+c.slice(1).map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');return '';}if(c[0]==='L')return `<path d="M${c[1]} ${c[2]}L${c[3]} ${c[4]}" stroke="${ink}" fill="none" stroke-width="${stroke}"/>`;return '';}).join('');
   const backPairs=backStage===1
   ?[[11,25],[25,26],[26,27],[7,26],[28,29],[29,30],[32,29],[29,35],[30,31],[32,33],[31,34],[33,'33a'],[34,'34a']]
   :backStage===2?[[35,36],[36,37],[37,38]]:backStage===3?[[37,39],[39,31],[31,34],['35a',29],[29,32],[32,33]]:[];
  const px=n=>20+n*10,py=n=>25+n*10;
  const highlight=backPairs.map(([a,b])=>{const u=d.points[a],v=d.points[b];return `<path d="M${px(u.x)} ${py(u.y)}L${px(v.x)} ${py(v.y)}" stroke="#d17b17" stroke-width="2.8" fill="none"/>`;}).join('');
  const normalAxis={x:d.points[38].x-d.points[37].x,y:d.points[38].y-d.points[37].y};
  const normalLength=Math.hypot(normalAxis.x,normalAxis.y)||1;
  let normal={x:normalAxis.y/normalLength,y:-normalAxis.x/normalLength};
  if(normal.y>0)normal={x:-normal.x,y:-normal.y};
  const normalEnd={x:d.points[38].x+normal.x*1.5,y:d.points[38].y+normal.y*1.5};
  const perpendicularCue=backStage===3?`<path d="M${px(d.points[38].x)} ${py(d.points[38].y)}L${px(normalEnd.x)} ${py(normalEnd.y)}" stroke="#d17b17" stroke-width="2.8" stroke-dasharray="5 3" fill="none"/><circle cx="${px(normalEnd.x)}" cy="${py(normalEnd.y)}" r="2.5" fill="#d17b17"/><text x="${px(normalEnd.x)+4}" y="${py(normalEnd.y)-4}" font-size="10" fill="#8a4e0b">перпендикуляр из 38 · условно</text>`:'';
  const closedDartCue=backStage===4?`<path d="M${d.back.dartClosure.waist.map((p,i)=>`${i?'L':'M'}${px(p.x)} ${py(p.y)}`).join('')}" stroke="#169b62" stroke-width="3" fill="none"/><text x="${px(d.points[38].x)}" y="${py(d.points[38].y)+12}" font-size="10" fill="#147a4e">талия после складывания · учебный вид</text>`:'';
  const dart=backStage===2?`<path d="M${px(d.backGuide.dart.left.x)} ${py(d.backGuide.dart.left.y)}L${px(d.backGuide.dart.apex.x)} ${py(d.backGuide.dart.apex.y)}L${px(d.backGuide.dart.right.x)} ${py(d.backGuide.dart.right.y)}" stroke="#d17b17" stroke-width="2.8" fill="none"/>`:'';
  preview.innerHTML=`<svg viewBox="0 0 ${art.width} ${art.height}" style="height:520px;max-width:100%" role="img" aria-label="Чертёж брюк, этап ${backStage} задней половинки">${drawn}${highlight}${dart}${perpendicularCue}${closedDartCue}${Object.entries(d.points).map(([name,p])=>`<text x="${21+p.x*10}" y="${24+p.y*10}" font-size="10" fill="#203a60">${name}</text>`).join('')}</svg>`;
  }catch(e){out.textContent=e.message;document.getElementById('trouser-error').textContent=e.message;preview.replaceChildren();}
 }

 root.getTrouserMeasurements=values;
 root.setTrouserMeasurements=data=>{buildTrouserFoundation(data);for(const [key,,fallback] of fields)document.getElementById('trouser-'+key).value=Number.isFinite(data[key])?data[key]:fallback;refresh();};
 const persist=()=>localStorage.setItem('bumbari-trouser-measures-v1',JSON.stringify(values()));
 trouserPanels[2].addEventListener('input',()=>{refresh();persist();});
 for(const input of trouserPanels[2].querySelectorAll('input')){input.type='text';input.inputMode='decimal';}
 try{const saved=JSON.parse(localStorage.getItem('bumbari-trouser-measures-v1')||'null');if(saved)root.setTrouserMeasurements(saved);}catch{/* Ignore damaged local cache; project imports still report errors. */}
 root.renderTrouserFlow=()=>{
  const pants=item==='pants';
  for(const step of [2,3,4]){skirtPanels[step].hidden=pants;trouserPanels[step].hidden=!pants;}
  if(!pants)return false;
  document.body.classList.toggle('measure-screen',current===2);document.body.classList.toggle('catalog-screen',current===1);
  for(let step=1;step<=4;step++){document.getElementById('s'+step).classList.toggle('hidden',step!==current);document.querySelector('[data-step="'+step+'"]').classList.toggle('active',step===current);}
  refresh();return true;
 };

 document.getElementById('trouser-export').onclick=()=>{
  try{const art=foundationArtwork(buildTrouserFoundation(values())),P=root.MuellerPattern,bytes=P.pdf(art,P.pages(art,'a4')),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
   const a=document.createElement('a');a.href=url;a.download='bumbari-trouser-front-half.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);document.getElementById('trouser-print-status').textContent='Учебный PDF подготовлен: передний и задний контуры, без припусков. Печатайте 100%; проверьте квадрат 100 × 100 мм. Задний контур экспериментальный и не подтверждён макетом.';
  }catch(e){document.getElementById('trouser-print-status').textContent=e.message;}
 };render();
})(typeof window!=='undefined'?window:globalThis);

