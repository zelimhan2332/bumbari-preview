/* Ателье-2001 PDF 15–16 / printed 16–17, figs. 26,29.
   cm. Drafting extension only; allowances and lining are separate. */
(function(root){
 function buildVent({length,hipHeight,ventLength=16,width=5}){
  if(![length,hipHeight,ventLength,width].every(Number.isFinite)||hipHeight<=0||length<=hipHeight)throw Error('Проверьте длину юбки и высоту бёдер.');
  if(ventLength<=0||ventLength>=length-hipHeight)throw Error('Верх шлицы должен находиться ниже бёдер и выше низа.');
  if(width<4||width>7)throw Error('Ширина припуска шлицы в выбранной инструкции — 4–7 см.');
  const top=length-ventLength;
  return {length,ventLength,width,top,fold:[{x:0,y:top},{x:0,y:length}],
   outline:[{x:0,y:top},{x:width,y:top},{x:width,y:length},{x:0,y:length}],
   stitchGuide:[{x:0,y:top},{x:width,y:top-1.5}],
   source:'Ателье-2001, PDF 15–16 (печатные 16–17), рис. 26, 29',
   hemAllowance:4,seamAllowance:2,allowancesIncluded:false,cutReady:false};
 }
 root.buildVent=buildVent;
 if(typeof module!=='undefined'){module.exports={buildVent};return;}
 const host=document.createElement('section');host.className='note';
 host.innerHTML='<h3>Шлица в среднем шве спинки · по инструкции</h3><p>Припуск шлицы от линии середины спинки: 4–7 см. Длина 16 см показана в варианте инструкции; для другой длины юбки её выбирает портной с проверкой свободы шага.</p><label>Длина шлицы, см <input id="vent-length" type="number" min="1" step="0.5" value="16"></label> <label>Ширина припуска шлицы, см <input id="vent-width" type="number" min="4" max="7" step="0.5" value="5"></label><p id="vent-result" aria-live="polite"></p><div id="vent-preview"></div><p>Схема показывает участок среднего шва, сгиб и ориентир закрепления. Это не полный комплект правой/левой деталей: подкладка, уточнение углов и припуски обработки требуют отдельного построения. В PDF основы шлица пока не включена; настройки этого блока не сохраняются в проект.</p>';
 document.getElementById('s3').append(host);
 function refresh(){
  const out=document.getElementById('vent-result'),preview=document.getElementById('vent-preview');
  try{const v=buildVent({length:number('length'),hipHeight:number('hipheight'),ventLength:Number(document.getElementById('vent-length').value),width:Number(document.getElementById('vent-width').value)});
   out.textContent=`Верх шлицы: ${v.top.toLocaleString('ru-RU')} см от талии. Припуск: ${v.width} × ${v.ventLength} см. На рис. 29 указаны припуски: швы 2 см, низ 4 см; они НЕ включены в эту схему. Источник: ${v.source}.`;
   const s=220/v.ventLength,x=n=>55+n*s,y=n=>25+(n-v.top)*s;
   preview.innerHTML=`<svg viewBox="0 0 ${90+v.width*s} 280" style="max-height:300px" role="img" aria-label="Припуск шлицы у среднего шва спинки"><path d="M55 10V245" stroke="#8296af" stroke-dasharray="5 3"/><path d="M${x(0)} ${y(v.top)}H${x(v.width)}V${y(v.length)}H55" fill="none" stroke="#244d80" stroke-width="2"/><path d="M55 ${y(v.top)}L${x(v.width)} ${y(v.top-1.5)}" stroke="#bd8335" stroke-dasharray="3 2"/><text x="15" y="267" font-size="11" fill="#244d80">Сгиб — пунктир; низ — без подгибки</text></svg>`;
  }catch(e){out.textContent=e.message;preview.replaceChildren();}
 }
 document.addEventListener('input',refresh);document.addEventListener('change',refresh);refresh();
})(typeof window!=='undefined'?window:globalThis);