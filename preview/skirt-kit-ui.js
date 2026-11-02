/* One view and one vector artwork for the complete straight-skirt outer kit. */
(function(root){
 const defaults={allowances:true,seamAllowance:2,hemAllowance:4,zipperLength:20};
 const controls=document.createElement('section');controls.id='skirt-kit-controls';controls.className='note';
 controls.innerHTML='<h3>Комплект прямой юбки</h3><p>Модель без подкладки: перед на сгиб, две зеркальные детали спинки и притачной пояс шириной 3 см с выступом застёжки 3 см. Параметры шлицы задаются ниже.</p><label><input id="kit-allowances" type="checkbox" checked> Добавить припуски в чертёж и PDF</label><div class="form"><label>Припуск швов, см <input id="kit-seam" inputmode="decimal" value="2"></label><label>Подгибка низа, см <input id="kit-hem" inputmode="decimal" value="4"></label><label>Длина молнии, см <input id="kit-zipper" inputmode="decimal" value="20"></label></div><p class="hint">В показанном варианте инструкции: швы 2 см, низ 4 см, молния 18–20 см. Другая ширина припусков — ваш выбор обработки; на сгибе переда припуск всегда 0.</p><div class="guide-tabs" role="group" aria-label="Просмотр комплекта юбки"><button class="secondary" data-kit-piece="">Весь комплект</button><button class="secondary" data-kit-piece="A">Перед</button><button class="secondary" data-kit-piece="B">Спинка</button><button class="secondary" data-kit-piece="C">Пояс</button><button class="secondary" data-kit-piece="construction">Учебное построение</button></div><p id="kit-status" role="status"></p><p>Тёмно-синяя сплошная линия — срез; тёмно-синий пунктир — шов или сгиб. Вытачки не вырезать. A — перед: 1 деталь на сгибе; B — спинка: 2 зеркальные детали; C — пояс: 1 деталь и прокладка. Сначала распечатайте квадрат 100 × 100 мм и сшейте пробный макет.</p>';
 const preview=document.getElementById('large-preview');preview.before(controls);
 let piece='',busy=false;
 const numberValue=id=>{const s=document.getElementById(id).value.trim();return s===''?NaN:Number(s.replace(',','.'));};
 root.getSkirtKitSettings=()=>({allowances:document.getElementById('kit-allowances').checked,seamAllowance:numberValue('kit-seam'),hemAllowance:numberValue('kit-hem'),zipperLength:numberValue('kit-zipper')});
 root.setSkirtKitSettings=v=>{const s=v||defaults;document.getElementById('kit-allowances').checked=s.allowances;for(const [key,id] of [['seamAllowance','kit-seam'],['hemAllowance','kit-hem'],['zipperLength','kit-zipper']])document.getElementById(id).value=s[key];};
 const values=()=>({waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value});
 root.getCurrentSkirtKit=()=>root.SkirtKit.build(values(),{...root.getSkirtKitSettings(),vent:root.getSkirtVent(),modeling:root.getSkirtModeling()});
 const original=root.renderDraftingGuide;
 root.renderDraftingGuide=function(v){original(v);refresh();};
 function refresh(){
  if(busy||item!=='skirt')return;busy=true;
  try{
   const kit=root.getCurrentSkirtKit(),art=root.SkirtKit.artwork(kit);
   const format=root.muellerPrintFormat||'a4',pages=root.MuellerPattern.pages(art,format);
   const fmt=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
   const text=`Комплект построен: перед, спинка на две зеркальные детали и пояс. Талиевой шов ${fmt(kit.audit.beltSeam)} см, пояс без выступа ${fmt(kit.pieces[2].length-3)} см. Разница боковых швов ${fmt(Math.abs(kit.audit.sideError)*10)} мм. ${kit.settings.vent?'Шлица включена в детали спинки.':'Без шлицы.'} ${kit.settings.allowances?'Припуски включены.':'Припуски швов и низа выключены; припуск шлицы сохраняется.'} PDF: ${pages.length} листов ${format==='a4'?'A4':'A0'}. Посадка не подтверждена примеркой.`;
   document.getElementById('kit-status').textContent=text;
   if(piece!=='construction'){preview.innerHTML=root.SkirtKit.svg(art,piece);document.getElementById('drafting-guide').hidden=true;}else document.getElementById('drafting-guide').hidden=false;
   document.getElementById('print-status').textContent=text;
  }catch(e){document.getElementById('kit-status').textContent='Комплект не построен: '+e.message;document.getElementById('print-status').textContent='Экспорт остановлен: '+e.message;if(piece!=='construction'){preview.replaceChildren();document.getElementById('drafting-guide').hidden=true;}}
  finally{busy=false;}
 }
 controls.querySelectorAll('[data-kit-piece]').forEach(b=>b.onclick=()=>{piece=b.dataset.kitPiece;controls.querySelectorAll('[data-kit-piece]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(piece==='construction')original(values());refresh();});
 controls.querySelector('[data-kit-piece=""]').setAttribute('aria-pressed','true');
 const ventToggle=document.getElementById('vent-save');ventToggle.checked=true;
 ventToggle.parentElement.lastChild.textContent=' Добавить шлицу в комплект';
 document.getElementById('vent-preview').hidden=true;
 const ventPanel=ventToggle.closest('section');ventPanel.querySelector('p:last-child').textContent='Шлица входит в чертёж спинки и основной PDF. Ширина — полный припуск от середины спинки; дополнительный припуск к внешнему краю шлицы не добавляется.';
 ventPanel.querySelector('h3').textContent='Задняя шлица';
 ventPanel.querySelector('button').hidden=true;
 const settings=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Настройки: припуски, молния и шлица';settings.append(summary);
 settings.append(document.getElementById('kit-allowances').parentElement,controls.querySelector('.form'),controls.querySelector('.hint'),ventPanel);
 controls.querySelector('.guide-tabs').before(settings);
 const studies=document.createElement('details');studies.className='note';const studyTitle=document.createElement('summary');studyTitle.textContent='Учебные варианты: заужение и расширение (отдельные модели)';studies.append(studyTitle);
 const taper=document.getElementById('taper-enabled').closest('section'),flare=document.getElementById('front-cut-1').closest('section');
 taper.querySelector('p').textContent='Это отдельная учебная модель. Заужение пока не входит в полный комплект прямой юбки; при его выборе экспорт останавливается.';
 document.getElementById('s3').append(studies);studies.append(taper,flare);
 const oldVentRefresh=root.setSkirtVent;root.setSkirtVent=v=>{oldVentRefresh(v);refresh();};
 const ventResult=document.getElementById('vent-result');
 const updateVentCopy=()=>{try{const v=root.getSkirtVent();ventResult.textContent=v?`Шлица ${v.ventLength} см; полный припуск ${v.width} см. Параметры входят в проект и основной PDF.`:'Шлица отключена.';}catch{/* Build reports errors. */}};
 const instructions=document.getElementById('pattern-print-instructions');
 instructions.textContent='Печать в масштабе 100%, без подгонки под страницу. Контрольный квадрат 100 × 100 мм. A4: нахлёст 10 мм, сборка по R (ряд) и C (колонка). A0: при необходимости несколько листов. Припуски, шлица и мерки совпадают с показанным комплектом. Подкладка в этой модели не предусмотрена. Сначала макет и примерка.';
 document.getElementById('experimental-consent-label').lastChild.textContent=' Разрешить учебный PDF для моих мерок с расчётным распределением вытачек. Посадка требует проверки на макете.';
 for(const format of ['a4','plotter'])document.getElementById('format-'+format).onclick=()=>{root.muellerPrintFormat=format;for(const other of ['a4','plotter']){const b=document.getElementById('format-'+other);b.classList.toggle('selected',other===format);b.setAttribute('aria-pressed',String(other===format));}refresh();};
 for(const id of ['print-scheme','download-scheme-pdf'])document.getElementById(id).onclick=()=>{
  const status=document.getElementById('print-status');
  try{
   const kit=root.getCurrentSkirtKit(),readiness=root.printReadiness({reference:kit.reference,completeKit:true,modeling:root.getSkirtModeling(),vent:root.getSkirtVent(),experimentalConsent:document.getElementById('experimental-print-consent').checked});
   if(!readiness.allowed)throw Error(readiness.errors.join(' '));
   const art=root.SkirtKit.artwork(kit),pages=root.MuellerPattern.pages(art,root.muellerPrintFormat||'a4'),bytes=root.MuellerPattern.pdf(art,pages),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
   const link=document.createElement('a');link.href=url;
   if(id==='download-scheme-pdf')link.download=`bumbari-straight-skirt-${kit.values.waist}-${kit.values.hip}-1to1.pdf`;else{link.target='_blank';link.rel='noopener';}
   document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);
   status.textContent=`PDF комплекта подготовлен: ${pages.length} листов. ${kit.settings.allowances?'Припуски включены.':'Без припусков швов и низа.'} ${kit.settings.vent?'Шлица включена.':'Без шлицы.'} Печатать 100%; проверить квадрат 100 × 100 мм. Сначала пробный макет.`;
  }catch(e){status.textContent='Экспорт остановлен: '+e.message;}
 };
 // The existing listeners calculate their study diagrams first, then this updates the shared kit.
 document.addEventListener('input',()=>{refresh();updateVentCopy();});document.addEventListener('change',()=>{refresh();updateVentCopy();});document.addEventListener('click',()=>{if(current===3&&piece!=='construction')refresh();updateVentCopy();});
 refresh();updateVentCopy();
})(window);
