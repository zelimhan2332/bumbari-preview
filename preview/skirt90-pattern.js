/* Полусолнце: полный сектор 180°, половина на сгибе 90°.
   r = полный обхват талии / pi; на половине чертежа дуга равна половине От.
   Геометрическая модель по согласованному фото, не подтверждённая формула Мюллера.
   Источники и границы проверки: docs/HALF-CIRCLE-SKIRT.md. */
(function(root){
  const angle=Math.PI;
  function build({waist,hip,hipHeight,length}){
    for(const [name,value,min,max] of [['waist',waist,40,180],['hip',hip,60,200],['hipHeight',hipHeight,10,40],['length',length,20,140]]){
      if(!Number.isFinite(value)||value<min||value>max) throw Error('Проверьте мерку «'+name+'»: допустимо '+min+'–'+max+' см.');
    }
    if(hipHeight>=length) throw Error('Длина юбки должна быть больше высоты бёдер.');
    const waistRadius=waist/angle, hipArc=angle*(waistRadius+hipHeight), hemRadius=waistRadius+length;
    return {waist,hip,hipHeight,length,angle:90,fullAngle:180,waistRadius,hipArc,hipEase:hipArc-hip,hemRadius,hemArc:angle*hemRadius,arcAtWaist:waist,halfWaistArc:waist/2,halfHipArc:hipArc/2,halfHemArc:angle*hemRadius/2,cutOnFold:true,cutReady:false};
  }
  function output(values){
    try{
      const d=build(values),scale=210/d.hemRadius,cx=26,cy=242,ri=d.waistRadius*scale,rh=(d.waistRadius+d.hipHeight)*scale,ro=d.hemRadius*scale;
      const svg='<svg viewBox="0 0 300 285" role="img" aria-label="Полусолнце: половина выкройки 90 градусов, сгиб по середине переда, средний шов сзади" style="display:block;width:min(100%,400px);height:auto;margin:10px auto"><path d="M '+cx+' '+(cy-ri)+' A '+ri+' '+ri+' 0 0 1 '+(cx+ri)+' '+cy+' L '+(cx+ro)+' '+cy+' A '+ro+' '+ro+' 0 0 0 '+cx+' '+(cy-ro)+' Z" fill="#dbe5f2" stroke="#142d50" stroke-width="2"/><path d="M '+cx+' '+(cy-rh)+' A '+rh+' '+rh+' 0 0 1 '+(cx+rh)+' '+cy+'" fill="none" stroke="#627a9a" stroke-dasharray="4 3"/><text x="48" y="20" fill="#142d50" font-size="12">90° — половина полусолнца</text><text x="'+(cx+rh*.55)+'" y="'+(cy-rh*.75)+'" fill="#405b7d" font-size="10">бёдра</text><text x="16" y="170" transform="rotate(-90 16 170)" fill="#142d50" font-size="11">СГИБ · середина переда · долевая</text><text x="45" y="260" fill="#142d50" font-size="11">Средний шов спинки · молния от талии</text></svg>';
      const f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:1});
      const hipCheck=d.hipEase>=0?'Геометрический запас на полном обхвате бёдер: '+f(d.hipEase)+' см.':'На уровне бёдер не хватает '+f(-d.hipEase)+' см по полному обхвату.';
      const hipColor=d.hipEase>=0?'#142d50':'#9b3328';
      return '<div>'+svg+'<p><b>На чертеже:</b> половина юбки, сектор 90°. После разворота по сгибу — одна деталь 180°, со средним швом сзади.</p><p><b>Радиус талии:</b> '+f(d.waistRadius)+' см<br><b>Талия на половине:</b> '+f(d.halfWaistArc)+' см; на всей юбке: '+f(d.arcAtWaist)+' см<br><b>Бёдра на половине:</b> '+f(d.halfHipArc)+' см; на всей юбке: '+f(d.hipArc)+' см при мерке '+f(d.hip)+' см<br><b>Радиус низа:</b> '+f(d.hemRadius)+' см<br><b>Низ на половине:</b> '+f(d.halfHemArc)+' см; на всей юбке: '+f(d.hemArc)+' см</p><p style="color:'+hipColor+'"><b>'+hipCheck+'</b> Это только геометрическое сравнение, не гарантия посадки.</p><p><b>Порядок построения:</b> прямой угол → дуга талии радиусом От / π → дуга бёдер на заданной высоте → дуга низа на длине юбки. Левая прямая — сгиб переда; нижняя — средний шов спинки с застёжкой.</p><p><b>Учебная основа без припусков и прибавки к талии.</b> Пояс, припуски, длина молнии и раскладка на ширину ткани ещё не построены. Печать для раскроя недоступна; посадку нужно проверить на макете.</p></div>';
    }catch(error){return '<p role="status">'+error.message+'</p>';}
  }
  function panel(values){
    return '<section class="note" style="background:#e4ebf4;color:#142d50"><h3 style="margin:0 0 8px">Полусолнце · половина выкройки 90°</h3><p>Введите четыре мерки — схема и проверка линии бёдер обновятся автоматически.</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+[['waist','Обхват талии'],['hip','Обхват бёдер'],['hipHeight','Высота бёдер от талии'],['length','Длина юбки']].map(([key,label])=>'<label>'+label+', см<input data-skirt90-measure="'+key+'" type="number" min="'+(key==='waist'?40:key==='hip'?60:key==='hipHeight'?10:20)+'" max="'+(key==='waist'?180:key==='hip'?200:key==='hipHeight'?40:140)+'" step="0.1" value="'+values[key]+'" style="display:block;width:100%;padding:10px;border:1px solid #aebdd0;border-radius:8px"></label>').join('')+'</div><div data-skirt90-output>'+output(values)+'</div><p>Форма полусолнца выбрана по фото. Расчёт — геометрическая модель; точная методика Мюллера для этой модели по имеющимся книгам не подтверждена.</p></section>';
  }
  root.Skirt90Draft={build,output,panel};
})(typeof window!=='undefined'?window:globalThis);
