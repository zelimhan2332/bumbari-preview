/* Ателье-2001 PDF 8 / printed 9, fig. 6. cm.
   Taper begins 8–10 cm below hips. Model hem reduction is chosen by the tailor.
   This module provides construction lines, not a finished hem or vent pattern. */
(function(root){
 function taperSkirt({halfWidth,hipHeight,length,startBelowHip=9,hemReduction=1}){
  for(const [key,n] of Object.entries({halfWidth,hipHeight,length,startBelowHip,hemReduction}))if(!Number.isFinite(n))throw Error('Некорректный параметр: '+key);
  if(halfWidth<=0||hipHeight<=0||length<=0)throw Error('Размеры должны быть положительными.');
  if(startBelowHip<8||startBelowHip>10)throw Error('По выбранному варианту начало заужения — 8–10 см ниже бёдер.');
  if(hemReduction<0||hemReduction>2)throw Error('Для этой учебной настройки выберите заужение 0–2 см. Это ограничение прототипа, не универсальный диапазон книги.');
  const startY=hipHeight+startBelowHip;
  if(startY>=length)throw Error('Низ должен находиться ниже начала заужения.');
  if(halfWidth-hemReduction<=0)throw Error('Заужение превышает ширину полотнища.');
  const segment=Math.hypot(length-startY,hemReduction);
  return {startY,hemWidth:halfWidth-hemReduction,halfWidth,hipHeight,length,hemReduction,startBelowHip,
   front:[{x:halfWidth,y:hipHeight},{x:halfWidth,y:startY},{x:halfWidth-hemReduction,y:length}],
   back:[{x:0,y:hipHeight},{x:0,y:startY},{x:hemReduction,y:length}],
   sideBelowHip:startBelowHip+segment,fullHemReduction:4*hemReduction,
   needsVent:hemReduction>0,cutReady:false,source:'Ателье-2001, PDF 8 (печатная 9), рис. 6'};
 }
 root.taperSkirt=taperSkirt;
 if(typeof module!=='undefined'){module.exports={taperSkirt};return;}
 const host=document.createElement('section');host.className='note';
 host.innerHTML='<h3>Заужение юбки · построение по книге</h3><p>Учебные линии моделирования, не отдельное готовое лекало. Основа и талия не изменяются. Для свободы движения книге нужны шлица или складка; их построение пока не добавлено.</p><label>Начало ниже бёдер, см <input id="taper-start" type="number" min="8" max="10" step="0.5" value="9"></label> <label>Заужение каждого бокового среза у низа, см <input id="taper-reduction" type="number" min="0" max="2" step="0.5" value="1"></label><p>Диапазон заужения 0–2 см ограничен прототипом. В книге величина связана с длиной и моделью, а не вычисляется одной универсальной формулой.</p><p id="taper-result" aria-live="polite"></p><div id="taper-preview"></div>';
 document.getElementById('s3').append(host);
 function refresh(){
  const output=document.getElementById('taper-result'),preview=document.getElementById('taper-preview');
  try{
   const c=root.calculateSkirtReference({waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value});
   const t=taperSkirt({halfWidth:c.hipHalfWithEase/2,hipHeight:number('hipheight'),length:number('length'),startBelowHip:Number(document.getElementById('taper-start').value),hemReduction:Number(document.getElementById('taper-reduction').value)});
   const f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
   output.textContent=`От талии до начала заужения: ${f(t.startY)} см. Ширина полотнища у низа: ${f(t.hemWidth)} см. Уменьшение полного обхвата низа: ${f(t.fullHemReduction)} см. Длина каждого бокового участка ниже бёдер: ${f(t.sideBelowHip)} см. ${t.source}. Эта настройка пока НЕ входит в PDF основы и файл проекта.`;
   const scale=260/t.length,x=v=>20+v*scale,y=v=>15+v*scale;
   preview.innerHTML=`<svg viewBox="0 0 ${40+t.halfWidth*scale} 295" style="max-height:300px" role="img" aria-label="Линии заужения одного полотнища"><path d="M${x(0)} ${y(t.hipHeight)}H${x(t.halfWidth)}V${y(t.length)}H${x(0)}Z" fill="none" stroke="#9cabbc" stroke-dasharray="4 3"/><path d="M${x(t.halfWidth)} ${y(t.hipHeight)}V${y(t.startY)}L${x(t.hemWidth)} ${y(t.length)}H${x(0)}" fill="none" stroke="#244d80" stroke-width="2"/></svg>`;
  }catch(e){output.textContent=e.message;preview.replaceChildren();}
 }
 document.addEventListener('input',refresh);document.addEventListener('change',refresh);refresh();
})(typeof window!=='undefined'?window:globalThis);