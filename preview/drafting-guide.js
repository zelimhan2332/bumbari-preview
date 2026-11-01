/* UI explanations refer to existing verified numeric controls, not new drafting rules. */
(function(){
  let stage=3,piece='front',dimension='hip';
  const labels=['1. Базовая сетка','2. Линия бёдер','3. Боковой контур','4. Вытачки'];
  const descriptions=[
    'Задаём длину и ширину половины изделия: полуобхват бёдер плюс выбранная прибавка 1–2 см. Боковая линия делит сетку пополам (PDF 5).',
    'Откладываем высоту бёдер вниз от талии. Розовым можно выделить нужное измерение в таблице ниже.',
    'Боковой контур пересчитывается по меркам. Длины боковых швов согласуются численно. Для нестандартных пропорций построение может быть остановлено.',
    'Для контрольных примеров используются растворы из книги. Для других мерок распределение расчётное; посадка проверяется на пробнике.'
  ];
  const fmt=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
  window.renderDraftingGuide=function(values){
    const host=document.getElementById('drafting-guide');if(!host)return;
    let c;try{c=calculateSkirtReference(values);}catch(e){host.textContent=e.message;document.getElementById('large-preview').innerHTML='';return;}
    const rows=[
      ['hip','a',c.hipHalfWithEase/2,'Ширина сетки полотнища','Половина ширины базисной сетки: боковая линия делит сетку пополам (PDF 5). Это не длина талиевого среза.'],
      ['length','b',values.length,'Длина юбки','От талии до выбранного низа.'],
      ['hipHeight','c',values.hipHeight,'Высота бёдер','От талии до линии бёдер.']
    ];
    if(piece==='front'&&c.exactBookCase&&stage===3)rows.push(['dart','d',c.darts.front,'Передняя вытачка','Раствор передней вытачки в контрольном примере.']);
    if(!rows.some(r=>r[0]===dimension))dimension='hip';
    host.innerHTML=`<div class="pattern-result-title">ПРЯМАЯ ЮБКА · ${piece==='front'?'ПЕРЕД':piece==='back'?'СПИНКА':'ОБЕ ДЕТАЛИ'}</div><p class="pattern-caption">Размеры на чертеже · сантиметры</p><div class="pattern-dimensions" role="group" aria-label="Размеры чертежа">${rows.map(([key,letter,value,label])=>`<button data-dimension="${key}" aria-pressed="${dimension===key}" title="${label}"><b>${letter}</b> = ${fmt(value)} см<span>${label}</span></button>`).join('')}</div><p class="hint" aria-live="polite">${rows.find(row=>row[0]===dimension)[4]}</p><div class="pattern-piece-tabs" role="group" aria-label="Деталь чертежа">${[['back','Спинка'],['front','Перед'],['','Обе детали']].map(([key,label])=>`<button class="secondary" data-piece="${key}" aria-pressed="${piece===key}">${label}</button>`).join('')}</div><details class="pattern-parameters"><summary>Параметры построения по источнику</summary><p class="hint">В контрольной основе выбраны значения внутри диапазонов книги: подъём бока 1,25 см; передняя вытачка — от бока 7 см, длина 9,5 см, подъём 0,6 см; задняя — длина 14 см. Для двух задних: основная в 6 см от середины спинки, дополнительная посередине оставшегося участка, длиной 12,5 см. Верхние касательные сопрягаются после математического закрытия вытачек. Кривые — цифровая интерполяция; длина талии и посадка ещё требуют проверки.</p></details><details class="pattern-guide"><summary>Показать построение по шагам</summary><div class="guide-stages" role="group" aria-label="Этапы построения">${labels.map((label,i)=>`<button class="secondary" data-stage="${i}" aria-pressed="${stage===i}">${label}${i>=2&&!c.exactBookCase?' · не проверено':''}</button>`).join('')}</div><p class="note">${descriptions[stage]}</p><div class="guide-tabs"><button class="secondary" data-stage="${Math.max(0,stage-1)}" ${stage===0?'disabled':''}>← Назад</button><button class="secondary" data-stage="${Math.min(3,stage+1)}" ${stage===3?'disabled':''}>Далее →</button></div></details><p class="hint">Источник числового контроля: «Ателье-2001», PDF 5–7. Учебная схема; не готовое лекало для раскроя.</p>`;
    document.getElementById('large-preview').innerHTML=buildSkirtDrawing(values,{stage,piece:piece||undefined,dimension:dimension==='dart'?undefined:dimension,annotations:true}).svg;
    const book=window.bookSkirtSteps(values),bookPanel=document.createElement('section');
    bookPanel.className='note';bookPanel.setAttribute('aria-label','Построение по книге');
    const title=document.createElement('h3');title.textContent='По книге: от мерок к основе';bookPanel.append(title);
    for(const step of book.steps){const heading=document.createElement('strong'),p=document.createElement('p');heading.textContent=step.title;p.textContent=step.text;bookPanel.append(heading,p);}
    const source=document.createElement('p');source.textContent='Источник: '+book.source+'. Все расчёты в сантиметрах.';bookPanel.append(source);host.append(bookPanel);
    let audit;
    try{audit=window.MuellerPattern?window.MuellerPattern.build(values).geometry.audit:window.MuellerSkirtGeometry.buildSkirtGeometry(values,c)?.audit;}catch(e){audit=null;}
    const panel=document.createElement('div');panel.className='note';
    if(audit){
      const mm=n=>fmt(n*10)+' мм';
      const heading=document.createElement('strong');heading.textContent='Контроль контуров';panel.append(heading);
      for(const text of [
        'Талия после закрытия вытачек, половина изделия: '+fmt(audit.waist)+' см; расчёт '+fmt(audit.waistTarget)+' см.',
        'Отклонение талии: '+mm(audit.waistError)+(audit.waistPass?' — в допуске проверки.':' — требуется корректировка.'),
        'Бок переда: '+fmt(audit.frontSide)+' см; бок спинки: '+fmt(audit.backSide)+' см.',
        'Разница боковых срезов: '+mm(Math.abs(audit.sideError))+(audit.sidePass?' — в допуске проверки.':' — требуется сопряжение.'),
        'Рабочий допуск проверки: 1 мм, выбран для разработки. Точность посадки и раскрой ещё не подтверждены.'
      ]){const p=document.createElement('p');p.textContent=text;panel.append(p);}
    }else panel.textContent='Контроль контуров недоступен: построение для этих мерок не прошло проверку или не поддерживается. Не использовать для раскроя.';
    host.append(panel);
    host.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stage=Number(b.dataset.stage);window.renderDraftingGuide(values);document.querySelector('.pattern-guide').open=true});
    host.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>{piece=b.dataset.piece;window.renderDraftingGuide(values)});
    host.querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>{dimension=b.dataset.dimension;if(dimension==='hip'&&stage===0)stage=1;window.renderDraftingGuide(values)});
  };
})();
