(function(root){
 const K={...root.HalfCircleKit,build:root.HalfCircleKit.buildCircle},panels={};
 for(const step of [2,3,4]){const p=document.createElement('div');p.dataset.itemPanel='skirt180';p.hidden=true;document.getElementById('s'+step).append(p);panels[step]=p;}
 const mFields=[['waist','Обхват талии',72,'По линии притачивания пояса, без стягивания'],['hip','Обхват бёдер',100,'Горизонтально через выступающие точки'],['hipHeight','Высота бёдер',20.8,'От талии до уровня бёдер'],['length','Длина юбки',61.5,'От шва притачивания пояса до низа; пояс выше этой линии']];
 const sFields=[['waistEase','Прибавка к полному обхвату талии',1],['seamAllowance','Припуск талии, боковых швов и пояса',1],['hemAllowance','Припуск подгибки низа',1],['zipperLength','Длина молнии от талии',20],['beltWidth','Ширина пояса в готовом виде',3],['fabricWidth','Полезная ширина ткани без кромок',180]];
 const form=fields=>'<div class="form">'+fields.map(([key,label,value,hint])=>`<div class="field"><label for="sun-${key}">${label}, см</label><input id="sun-${key}" inputmode="decimal" value="${String(value).replace('.',',')}">${hint?'<p class="hint">'+hint+'</p>':''}</div>`).join('')+'</div>';
 panels[2].innerHTML='<h2>Проект юбки-солнце · мерки</h2><p>Отдельная модель: юбка 360°, перед и спинка по 180°. Ткань без растяжения, без подкладки. Все обхваты полные, в сантиметрах.</p>'+form(mFields)+'<details><summary>Посадка, обработка и ткань</summary>'+form(sFields)+'<p class="hint">Прибавка к талии задаётся отдельно от припусков. Для дугообразного низа выбран узкий подгиб 1 см; широкая подгибка требует сутюживания. Выступ пояса под застёжку — 3 см.</p></details><p id="sun-error" role="alert"></p><div class="actions"><button class="secondary" data-sun-go="1">← Выбрать модель</button><button class="primary" data-sun-go="3">Построить юбку-солнце →</button></div>';
 panels[3].innerHTML='<h2>Юбка-солнце · комплект лекал</h2><p>Юбка: полный круг 360° из двух полотнищ по 180°. Один шаблон выкроить два раза без сгиба: перед и спинка. Два боковых шва, молния в одном из них. Пояс: 1 деталь и прокладка.</p><div class="guide-tabs"><button class="secondary" data-sun-piece="">Весь комплект</button><button class="secondary" data-sun-piece="A">Юбка</button><button class="secondary" data-sun-piece="B">Пояс</button></div><div id="sun-preview" style="background:white;max-width:100%;overflow:hidden"></div><p id="sun-audit" class="note" role="status"></p><details><summary>Порядок построения и пошива</summary><ol><li>Радиус талии: (От + прибавка) / (2π). От талии отложить высоту бёдер и длину юбки, провести дуги.</li><li>Чёрная сплошная линия — срез с припусками; синий пунктир — линия шва; на поясе также сгиб. Совместить четвертные метки талии и пояса.</li><li>Выкроить два одинаковых полотнища без сгиба. Припуски есть по обеим прямым сторонам. Долевая направлена по середине полотнища, перпендикулярно прямой линии боковых швов.</li><li>Стабилизировать талию от растяжения. Выполнить боковые швы и молнию в одном из них, притачать укреплённый пояс. Выступ пояса 3 см под крючок или пуговицу.</li><li>Сначала проверить макет. Перед окончательной подгибкой дать юбке отвисеться и выровнять низ на фигуре.</li></ol><p>Основа рассчитана по геометрии юбки-солнце. Тип юбки-солнце сверён по b07 PDF170,172. Радиус точно согласован с талией по геометрии; поправка свадебной модели не перенесена. Пояс: «Ателье — 2001», PDF9, рис.9. Посадка на фигуре и бумажная печать отдельно проверяются вами.</p></details><label for="sun-notes">Заметки проекта и примерки</label><textarea id="sun-notes" style="width:100%;min-height:90px" maxlength="20000"></textarea><div class="actions"><button class="secondary" data-sun-go="2">← Изменить мерки</button><button class="primary" data-sun-go="4">Сохранить и печатать →</button></div>';
 panels[4].innerHTML='<h2>Юбка-солнце · PDF 1:1</h2><p>Векторный комплект содержит юбку, пояс, припуски, четвертные метки, конец молнии, долевую и квадрат 100 × 100 мм. Без подкладки.</p><div class="radio-row"><button id="sun-a4" class="selected">A4 · склейка листов</button><button id="sun-a0">A0 · плоттер</button></div><p>Печатать строго 100%, без вписывания. A4: нахлёст 10 мм, листы по рядам R и колонкам C. A0 также разбивается на листы, если комплект больше формата. Подписи в PDF латиницей.</p><label><input id="sun-consent" type="checkbox"> Подготовить PDF для пробного макета; перед основной тканью проверю масштаб и посадку.</label><div class="actions"><button class="secondary" data-sun-go="3">← К чертежу</button><button class="primary" id="sun-download">Скачать PDF 1:1</button><button class="secondary" id="sun-print">Открыть PDF для печати</button></div><p id="sun-print-status" role="status"></p>';
 let piece='',format='a4';
 const read=fs=>Object.fromEntries(fs.map(([key])=>{const t=document.getElementById('sun-'+key).value.trim();return [key,t===''?NaN:Number(t.replace(',','.'))];}));
 const values=()=>read(mFields),options=()=>read(sFields),build=()=>K.build(values(),options());
 root.getFullCircleProject=()=>({measurements:values(),fullCircle:options(),notes:document.getElementById('sun-notes').value});
 root.setFullCircleProject=data=>{
  K.build(data.measurements,data.fullCircle);
  for(const [key] of mFields)document.getElementById('sun-'+key).value=String(data.measurements[key]).replace('.',',');
  for(const [key,value] of Object.entries(K.settings(data.fullCircle)))document.getElementById('sun-'+key).value=String(value).replace('.',',');
  document.getElementById('sun-notes').value=data.notes||'';document.getElementById('sun-consent').checked=false;persist();
 };
 function persist(){try{build();localStorage.setItem('bumbari-full-circle-v1',JSON.stringify(root.getFullCircleProject()));}catch{/* Keep the last valid project. */}}
 function refresh(){
  try{
   const k=build(),art=K.artwork(k),f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
   document.getElementById('sun-error').textContent='';document.getElementById('sun-preview').innerHTML=K.svg(art,piece);
   document.getElementById('sun-preview').querySelector('svg').style.cssText='width:100%;height:auto;max-height:700px';
   const l=k.layout,layout=l.fits?`Раскладка в один слой без сгиба: полезная ширина ${f(k.settings.fabricWidth)} см, ориентировочная длина ${f(l.requiredLength)} см с поясом и промежутками. Два полотнища размещаются последовательно без сгиба; долевая середины каждого вдоль ткани.`:`Для этой раскладки нужна полезная ширина не менее ${f(l.requiredWidth)} см. Выбрано ${f(k.settings.fabricWidth)} см: комплект не помещается. Нужна более широкая ткань либо другая конструкция со швами.`;
   document.getElementById('sun-audit').textContent=`Талия по шву ${f(k.audit.waistSeam)} см = мерка ${f(k.values.waist)} + прибавка ${f(k.settings.waistEase)}. Дуга одного полотнища ${f(k.audit.halfWaist)} см. Пояс без выступа ${f(k.belt.length-3)} см; совпадение ${f(k.audit.beltError)} см. Обхват по бёдрам ${f(k.audit.hipCircumference)} см, запас ${f(k.audit.hipEase)} см. Длина бокового шва ${f(k.audit.backSeam)} см. ${layout} Расход без усадки, ворса, рисунка и запаса на выравнивание низа.`;
   document.getElementById('sun-print-status').textContent=`Комплект: ${root.MuellerPattern.pages(art,format).length} листов ${format==='a4'?'A4':'A0'}. Припуски включены. Проверка посадки на макете обязательна.`;
   return true;
  }catch(e){document.getElementById('sun-error').textContent=e.message;document.getElementById('sun-audit').textContent=e.message;document.getElementById('sun-print-status').textContent='Построение остановлено: '+e.message;document.getElementById('sun-preview').replaceChildren();return false;}
 }
 for(const p of Object.values(panels))p.querySelectorAll('[data-sun-go]').forEach(b=>b.onclick=()=>{const step=Number(b.dataset.sunGo);if(step>=3&&!refresh())return;go(step);});
 panels[3].querySelectorAll('[data-sun-piece]').forEach(b=>b.onclick=()=>{piece=b.dataset.sunPiece;panels[3].querySelectorAll('[data-sun-piece]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refresh();});
 for(const [id,f] of [['sun-a4','a4'],['sun-a0','plotter']])document.getElementById(id).onclick=()=>{format=f;for(const other of ['sun-a4','sun-a0'])document.getElementById(other).classList.toggle('selected',other===id);refresh();};
 for(const id of ['sun-download','sun-print'])document.getElementById(id).onclick=()=>{
  try{const k=build();if(!document.getElementById('sun-consent').checked)throw Error('Подтвердите подготовку PDF для макета.');
   const art=K.artwork(k),P=root.MuellerPattern,tiles=P.pages(art,format),bytes=P.pdf(art,tiles),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;
   if(id==='sun-download')link.download=`bumbari-full-circle-${k.values.waist}-${k.values.length}-1to1.pdf`;else{link.target='_blank';link.rel='noopener';}
   document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
   document.getElementById('sun-print-status').textContent=`PDF юбки-солнце подготовлен: ${tiles.length} листов. Печатайте 100%, проверьте квадрат 100 × 100 мм.`;
  }catch(e){document.getElementById('sun-print-status').textContent=e.message;}
 };
 panels[2].addEventListener('input',()=>{document.getElementById('sun-consent').checked=false;persist();refresh();});panels[3].addEventListener('input',persist);
 try{const saved=JSON.parse(localStorage.getItem('bumbari-full-circle-v1')||'null');if(saved)root.setFullCircleProject(saved);}catch{/* Damaged cache does not replace defaults. */}
 root.renderFullCircleFlow=()=>{
  const active=item==='skirt180';for(const p of Object.values(panels))p.hidden=!active;
  if(!active||current===1)return false;
  for(const step of [2,3,4])document.getElementById('s'+step).querySelectorAll('[data-item-panel]').forEach(p=>p.hidden=p.dataset.itemPanel!=='skirt180');
  document.body.classList.toggle('measure-screen',current===2);document.body.classList.remove('catalog-screen');
  for(let step=1;step<=4;step++){document.getElementById('s'+step).classList.toggle('hidden',step!==current);document.querySelector('[data-step="'+step+'"]').classList.toggle('active',step===current);}
  refresh();return true;
 };
 render();
})(window);
