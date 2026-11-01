(function(){
  document.getElementById('print-scheme').onclick=()=>{
    const sheet=document.getElementById('print-sheet');
    try{
      const values={waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value};
      const c=calculateSkirtReference(values),fmt=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2})+' см';
      sheet.replaceChildren();
      const add=(tag,text,parent=sheet)=>{const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;};
      add('h1','Bumbari · схема прямой юбки');
      add('p','УЧЕБНАЯ СХЕМА · НЕ В МАСШТАБЕ 1:1 · НЕ ДЛЯ РАСКРОЯ').className='print-warning';
      const name=document.getElementById('project-name').value.trim();if(name)add('p','Проект: '+name);
      const drawing=document.createElement('div');drawing.innerHTML=buildSkirtDrawing(values,{annotations:true}).svg;sheet.append(drawing);
      const table=document.createElement('table');sheet.append(table);
      const rows=[['Мерка / расчёт','Значение'],['Обхват талии',fmt(values.waist)],['Обхват бёдер',fmt(values.hip)],['Высота бёдер',fmt(values.hipHeight)],['Длина юбки',fmt(values.length)],['Прибавка по бёдрам к полуобхвату',fmt(c.hipEaseHalf)],['Ширина сетки, половина изделия',fmt(c.hipHalfWithEase)],['Ширина сетки полотнища, схематично (a)',fmt(c.hipHalfWithEase/2)],['Приталивание, половина изделия',fmt(c.intake)]];
      rows.forEach((cells,i)=>{const tr=document.createElement('tr');table.append(tr);cells.forEach(text=>add(i?'td':'th',text,tr));});
      add('p',c.exactBookCase?'Показано распределение вытачек контрольного примера. Контур ещё требует проверки перед раскроем.':'Распределение вытачек для этих мерок не рассчитано; показана только сетка.');
      add('p','Источник числового контроля: «Ателье-2001», PDF 5–7. Масштаб изображения зависит от настроек печати.');
      const notes=document.getElementById('fit-notes').value;if(notes){add('h2','Заметки');add('p',notes).className='print-note';}
      document.getElementById('print-status').textContent='Схема подготовлена. Открываю окно печати Chrome. Если оно не появилось, скачайте PDF отдельной кнопкой.';
      window.print();
    }catch(e){document.getElementById('print-status').textContent='Не удалось подготовить печать: '+e.message;}
  };
})();
