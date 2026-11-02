/* Юбка 90°: геометрический черновик сектора.
   Радиус талии выводится из длины дуги: s = r * pi/2.
   Это математическая модель, не проверенная методика Ателье и не лекало для раскроя. */
(function(root){
  function build({waist,length}){
    if(!Number.isFinite(waist)||waist<40||waist>180) throw Error('Введите обхват талии от 40 до 180 см.');
    if(!Number.isFinite(length)||length<20||length>140) throw Error('Введите длину юбки от 20 до 140 см.');
    const waistRadius=waist/(Math.PI/2), hemRadius=waistRadius+length;
    return {waist,length,angle:90,waistRadius,hemRadius,arcAtWaist:waist,cutReady:false};
  }
  function panel(values){
    try{
      const d=build(values),scale=210/d.hemRadius,cx=26,cy=242,ri=d.waistRadius*scale,ro=d.hemRadius*scale;
      const svg='<svg viewBox="0 0 270 270" role="img" aria-label="Черновой сектор юбки 90 градусов" style="display:block;width:min(100%,360px);height:auto;margin:10px auto"><path d="M '+cx+' '+(cy-ri)+' A '+ri+' '+ri+' 0 0 1 '+(cx+ri)+' '+cy+' L '+(cx+ro)+' '+cy+' A '+ro+' '+ro+' 0 0 0 '+cx+' '+(cy-ro)+' Z" fill="#dbe5f2" stroke="#142d50" stroke-width="2"/><path d="M '+cx+' '+(cy-ri)+' L '+cx+' '+(cy-ro)+' M '+(cx+ri)+' '+cy+' L '+(cx+ro)+' '+cy+'" stroke="#627a9a" stroke-dasharray="4 3"/><text x="48" y="28" fill="#142d50" font-size="12">90°</text></svg>';
      return '<section class="note" style="background:#e4ebf4;color:#142d50"><h3 style="margin:0 0 8px">Первый чертёж · сектор 90°</h3><p>Сейчас используются мерки талии и длины из шага «Мерки».</p>'+svg+'<p><b>Радиус талии:</b> '+d.waistRadius.toLocaleString('ru-RU',{maximumFractionDigits:1})+' см<br><b>Радиус низа:</b> '+d.hemRadius.toLocaleString('ru-RU',{maximumFractionDigits:1})+' см<br><b>Длина дуги талии:</b> '+d.arcAtWaist+' см</p><p><b>Пока черновик:</b> это сектор с углом 90° по формуле длины дуги. Не учитывает швы, припуски, долевую, застёжку и проверку посадки. Печать и раскрой не готовы. Для превращения в рабочее лекало нужно сшить пробник и сверить методику.</p></section>';
    }catch(error){return '<section class="note" style="background:#e4ebf4;color:#142d50"><h3>Первый чертёж · сектор 90°</h3><p>'+error.message+'</p></section>';}
  }
  root.Skirt90Draft={build,panel};
})(typeof window!=='undefined'?window:globalThis);
