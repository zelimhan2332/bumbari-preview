/* Геометрический черновик юбки-сектора 90°.
   r = дуга талии / угол (в радианах); дуга на высоте бёдер = угол * (r + высота бёдер).
   Схемы Мюллера по юбке дают базовые мерки прямой юбки, но не метод 90°:
   Сборник Ателье 2004, PDF 130–140 (печатные 128–138); отдельные схемы прямой юбки.
   Никакие прибавки, припуски или готовность к раскрою здесь не предполагаются. */
(function(root){
  const angle=Math.PI/2;
  function build({waist,hip,hipHeight,length}){
    for(const [name,value,min,max] of [['waist',waist,40,180],['hip',hip,60,200],['hipHeight',hipHeight,10,40],['length',length,20,140]]){
      if(!Number.isFinite(value)||value<min||value>max) throw Error('Проверьте мерку «'+name+'»: допустимо '+min+'–'+max+' см.');
    }
    if(hipHeight>=length) throw Error('Длина юбки должна быть больше высоты бёдер.');
    const waistRadius=waist/angle, hipArc=angle*(waistRadius+hipHeight), hemRadius=waistRadius+length;
    return {waist,hip,hipHeight,length,angle:90,waistRadius,hipArc,hipEase:hipArc-hip,hemRadius,hemArc:angle*hemRadius,arcAtWaist:waist,cutReady:false};
  }
  function output(values){
    try{
      const d=build(values),scale=210/d.hemRadius,cx=26,cy=242,ri=d.waistRadius*scale,rh=(d.waistRadius+d.hipHeight)*scale,ro=d.hemRadius*scale;
      const svg='<svg viewBox="0 0 270 270" role="img" aria-label="Черновой сектор юбки 90 градусов с линией бёдер" style="display:block;width:min(100%,360px);height:auto;margin:10px auto"><path d="M '+cx+' '+(cy-ri)+' A '+ri+' '+ri+' 0 0 1 '+(cx+ri)+' '+cy+' L '+(cx+ro)+' '+cy+' A '+ro+' '+ro+' 0 0 0 '+cx+' '+(cy-ro)+' Z" fill="#dbe5f2" stroke="#142d50" stroke-width="2"/><path d="M '+cx+' '+(cy-rh)+' A '+rh+' '+rh+' 0 0 1 '+(cx+rh)+' '+cy+'" fill="none" stroke="#627a9a" stroke-dasharray="4 3"/><text x="48" y="28" fill="#142d50" font-size="12">90°</text><text x="'+(cx+rh*.45)+'" y="'+(cy-rh*.45)+'" fill="#405b7d" font-size="10">бёдра</text></svg>';
      const f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:1});
      const hipCheck=d.hipEase>=0?'Геометрический запас на бёдрах: '+f(d.hipEase)+' см.':'На уровне бёдер не хватает '+f(-d.hipEase)+' см по дуге сектора.';
      const hipColor=d.hipEase>=0?'#142d50':'#9b3328';
      return '<div>'+svg+'<p><b>Радиус талии:</b> '+f(d.waistRadius)+' см<br><b>Дуга по линии бёдер:</b> '+f(d.hipArc)+' см при мерке '+f(d.hip)+' см<br><b>Радиус низа:</b> '+f(d.hemRadius)+' см<br><b>Дуга низа:</b> '+f(d.hemArc)+' см</p><p style="color:'+hipColor+'"><b>'+hipCheck+'</b> Это только геометрическое сравнение, не гарантия посадки.</p><p><b>Черновик:</b> геометрия сектора 90°. Швы, припуски, долевая, застёжка и раскладка ткани не построены. Не печатать для раскроя.</p></div>';
    }catch(error){return '<p role="status">'+error.message+'</p>';}
  }
  function panel(values){
    return '<section class="note" style="background:#e4ebf4;color:#142d50"><h3 style="margin:0 0 8px">Первый чертёж · юбка 90°</h3><p>Введите четыре мерки — схема и проверка линии бёдер обновятся автоматически.</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+[['waist','Обхват талии'],['hip','Обхват бёдер'],['hipHeight','Высота бёдер от талии'],['length','Длина юбки']].map(([key,label])=>'<label>'+label+', см<input data-skirt90-measure="'+key+'" type="number" min="'+(key==='waist'?40:key==='hip'?60:key==='hipHeight'?10:20)+'" max="'+(key==='waist'?180:key==='hip'?200:key==='hipHeight'?40:140)+'" step="0.1" value="'+values[key]+'" style="display:block;width:100%;padding:10px;border:1px solid #aebdd0;border-radius:8px"></label>').join('')+'</div><div data-skirt90-output>'+output(values)+'</div><p>В схемах Мюллера есть эти базовые мерки для прямой юбки, но построения сектора 90° там нет. Радиусы рассчитаны по геометрии. Для рабочего лекала нужна отдельная проверка пробником.</p></section>';
  }
  root.Skirt90Draft={build,output,panel};
})(typeof window!=='undefined'?window:globalThis);
