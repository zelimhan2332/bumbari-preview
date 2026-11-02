(function(root){
 const K=root.HalfCircleKit,panels={};
 for(const step of [2,3,4]){const p=document.createElement('div');p.dataset.itemPanel='skirt90';p.hidden=true;document.getElementById('s'+step).append(p);panels[step]=p;}
 const mFields=[['waist','Обхват талии',72,'По линии притачивания пояса, без стягивания'],['hip','Обхват бёдер',100,'Горизонтально через выступающие точки'],['hipHeight','Высота бёдер',20.8,'От талии до уровня бёдер'],['length','Длина юбки',61.5,'От шва притачивания пояса до низа; пояс выше этой линии']];
 const sFields=[['waistEase','Прибавка к полному обхвату талии',1],['seamAllowance','Припуск талии, заднего шва и пояса',1],['hemAllowance','Припуск подгибки низа',1],['zipperLength','Длина молнии от талии',20],['beltWidth','Ширина пояса в готовом виде',3],['fabricWidth','Полезная ширина ткани без кромок',180]];
 const form=fields=>'<div class="form">'+fields.map(([key,label,value,hint])=>`<div class="field"><label for="half-${key}">${label}, см</label><input id="half-${key}" inputmode="decimal" value="${String(value).replace('.',',')}">${hint?'<p class="hint">'+hint+'</p>':''}</div>`).join('')+'</div>';
 panels[2].innerHTML='<h2>Проект полусолнца · мерки</h2><p>Отдельная модель: юбка 180°, половина выкройки 90°. Ткань без растяжения, без подкладки. Все обхваты полные, в сантиметрах.</p>'+form(mFields)+'<details><summary>Посадка, обработка и ткань</summary>'+form(sFields)+'<p class="hint">Прибавка к талии задаётся отдельно от припусков. Для дугообразного низа выбран узкий подгиб 1 см; широкая подгибка требует сутюживания. Выступ пояса под застёжку — 3 см.</p></details><p id="half-error" role="alert"></p><div class="actions"><button class="secondary" data-half-go="1">← Выбрать модель</button><button class="primary" data-half-go="3">Построить полусолнце →</button></div>';
 panels[3].innerHTML='<h2>Полусолнце · комплект лекал</h2><p>Юбка: один сектор 180° со средним швом спинки. На чертеже половина 90°; зеркально перенесите её относительно середины переда либо используйте сгиб. Пояс: 1 деталь и прокладка.</p><div class="guide-tabs"><button class="secondary" data-half-piece="">Весь комплект</button><button class="secondary" data-half-piece="A">Юбка</button><button class="secondary" data-half-piece="B">Пояс</button></div><div id="half-preview" style="background:white;max-width:100%;overflow:hidden"></div><p id="half-audit" class="note" role="status"></p><details><summary>Порядок построения и пошива</summary><ol><li>Радиус талии: (От + прибавка) / π. От талии отложить высоту бёдер и длину юбки, провести дуги.</li><li>Чёрная сплошная линия — срез с припусками; синий пунктир — линия шва или сгиба. Совместить четвертные метки талии и пояса.</li><li>На сгибе переда припуска нет. Для раскроя в один слой зеркально перенести шаблон; сохранить долевую параллельно середине переда.</li><li>Стабилизировать талию от растяжения. Выполнить средний шов спинки и молнию, притачать укреплённый пояс. Выступ пояса 3 см под крючок или пуговицу.</li><li>Сначала проверить макет. Перед окончательной подгибкой дать юбке отвисеться и выровнять низ на фигуре.</li></ol><p>Основа рассчитана по геометрии полусолнца. Пояс сверён с «Ателье — 2001», PDF9, рис.9. Посадка на фигуре и бумажная печать отдельно проверяются вами.</p></details><label for="half-notes">Заметки проекта и примерки</label><textarea id="half-notes" style="width:100%;min-height:90px" maxlength="20000"></textarea><div class="actions"><button class="secondary" data-half-go="2">← Изменить мерки</button><button class="primary" data-half-go="4">Сохранить и печатать →</button></div>';
 panels[4].innerHTML='<h2>Полусолнце · PDF 1:1</h2><p>Векторный комплект содержит юбку, пояс, припуски, четвертные метки, конец молнии, долевую и квадрат 100 × 100 мм. Без подкладки.</p><div class="radio-row"><button id="half-a4" class="selected">A4 · склейка листов</button><button id="half-a0">A0 · плоттер</button></div><p>Печатать строго 100%, без вписывания. A4: нахлёст 10 мм, листы по рядам R и колонкам C. A0 также разбивается на листы, если комплект больше формата. Подписи в PDF латиницей.</p><label><input id="half-consent" type="checkbox"> Подготовить PDF для пробного макета; перед основной тканью проверю масштаб и посадку.</label><div class="actions"><button class="secondary" data-half-go="3">← К чертежу</button><button class="primary" id="half-download">Скачать PDF 1:1</button><button class="secondary" id="half-print">Открыть PDF для печати</button></div><p id="half-print-status" role="status"></p>';
 let piece='',format='a4';
 const read=fs=>Object.fromEntries(fs.map(([key])=>{const t=document.getElementById('half-'+key).value.trim();return [key,t===''?NaN:Number(t.replace(',','.'))];}));
 const values=()=>read(mFields),options=()=>read(sFields),build=()=>K.build(values(),options());
 root.getHalfCircleProject=()=>({measurements:values(),halfCircle:options(),notes:document.getElementById('half-notes').value});
 root.setHalfCircleProject=data=>{
  K.build(data.measurements,data.halfCircle);
  for(const [key] of mFields)document.getElementById('half-'+key).value=String(data.measurements[key]).replace('.',',');
  for(const [key,value] of Object.entries(K.settings(data.halfCircle)))document.getElementById('half-'+key).value=String(value).replace('.',',');
  document.getElementById('half-notes').value=data.notes||'';document.getElementById('half-consent').checked=false;persist();
 };
 function persist(){try{build();localStorage.setItem('bumbari-half-circle-v1',JSON.stringify(root.getHalfCircleProject()));}catch{/* Keep the last valid project. */}}
 function refresh(){
  try{
   const k=build(),art=K.artwork(k),f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
   document.getElementById('half-error').textContent='';document.getElementById('half-preview').innerHTML=K.svg(art,piece);
   document.getElementById('half-preview').querySelector('svg').style.cssText='width:100%;height:auto;max-height:700px';
   const l=k.layout,layout=l.fits?`Раскладка в один слой без сгиба: полезная ширина ${f(k.settings.fabricWidth)} см, ориентировочная длина ${f(l.requiredLength)} см с поясом и промежутками. Шаблон зеркалится по середине переда; долевая вдоль ткани.`:`Для этой раскладки нужна полезная ширина не менее ${f(l.requiredWidth)} см. Выбрано ${f(k.settings.fabricWidth)} см: комплект не помещается. Нужна более широкая ткань либо другая конструкция со швами.`;
   document.getElementById('half-audit').textContent=`Талия по шву ${f(k.audit.waistSeam)} см = мерка ${f(k.values.waist)} + прибавка ${f(k.settings.waistEase)}. Дуга половины ${f(k.audit.halfWaist)} см. Пояс без выступа ${f(k.belt.length-3)} см; совпадение ${f(k.audit.beltError)} см. Обхват по бёдрам ${f(k.audit.hipCircumference)} см, запас ${f(k.audit.hipEase)} см. Длина среднего шва ${f(k.audit.backSeam)} см. ${layout} Расход без усадки, ворса, рисунка и запаса на выравнивание низа.`;
   document.getElementById('half-print-status').textContent=`Комплект: ${root.MuellerPattern.pages(art,format).length} листов ${format==='a4'?'A4':'A0'}. Припуски включены. Проверка посадки на макете обязательна.`;
   return true;
  }catch(e){document.getElementById('half-error').textContent=e.message;document.getElementById('half-audit').textContent=e.message;document.getElementById('half-print-status').textContent='Построение остановлено: '+e.message;document.getElementById('half-preview').replaceChildren();return false;}
 }
 for(const p of Object.values(panels))p.querySelectorAll('[data-half-go]').forEach(b=>b.onclick=()=>{const step=Number(b.dataset.halfGo);if(step>=3&&!refresh())return;go(step);});
 panels[3].querySelectorAll('[data-half-piece]').forEach(b=>b.onclick=()=>{piece=b.dataset.halfPiece;panels[3].querySelectorAll('[data-half-piece]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refresh();});
 for(const [id,f] of [['half-a4','a4'],['half-a0','plotter']])document.getElementById(id).onclick=()=>{format=f;for(const other of ['half-a4','half-a0'])document.getElementById(other).classList.toggle('selected',other===id);refresh();};
 for(const id of ['half-download','half-print'])document.getElementById(id).onclick=()=>{
  try{const k=build();if(!document.getElementById('half-consent').checked)throw Error('Подтвердите подготовку PDF для макета.');
   const art=K.artwork(k),P=root.MuellerPattern,tiles=P.pages(art,format),bytes=P.pdf(art,tiles),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;
   if(id==='half-download')link.download=`bumbari-half-circle-${k.values.waist}-${k.values.length}-1to1.pdf`;else{link.target='_blank';link.rel='noopener';}
   document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
   document.getElementById('half-print-status').textContent=`PDF полусолнца подготовлен: ${tiles.length} листов. Печатайте 100%, проверьте квадрат 100 × 100 мм.`;
  }catch(e){document.getElementById('half-print-status').textContent=e.message;}
 };
 panels[2].addEventListener('input',()=>{document.getElementById('half-consent').checked=false;persist();refresh();});panels[3].addEventListener('input',persist);
 try{const saved=JSON.parse(localStorage.getItem('bumbari-half-circle-v1')||'null');if(saved)root.setHalfCircleProject(saved);}catch{/* Damaged cache does not replace defaults. */}
 root.renderHalfCircleFlow=()=>{
  const active=item==='skirt90';for(const p of Object.values(panels))p.hidden=!active;
  if(!active||current===1)return false;
  for(const step of [2,3,4])document.getElementById('s'+step).querySelectorAll('[data-item-panel]').forEach(p=>p.hidden=p.dataset.itemPanel!=='skirt90');
  document.body.classList.toggle('measure-screen',current===2);document.body.classList.remove('catalog-screen');
  for(let step=1;step<=4;step++){document.getElementById('s'+step).classList.toggle('hidden',step!==current);document.querySelector('[data-step="'+step+'"]').classList.toggle('active',step===current);}
  refresh();return true;
 };
 render();
})(window);
