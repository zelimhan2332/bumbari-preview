(function(){
  const svg=path=>`<svg viewBox="0 0 100 110" aria-hidden="true"><path d="${path}"/></svg>`;
  const shapes={
    upper:'M32 12 Q50 26 68 12 L87 22 L78 43 L69 38 L74 99 L26 99 L31 38 L22 43 L13 22 Z M31 38 Q50 48 69 38',
    lower:'M30 12 L70 12 L81 99 L56 99 L50 51 L44 99 L19 99 Z M30 19 L70 19',
    sleeves:'M22 32 Q50 1 78 32 L65 99 L35 99 Z M35 89 L65 89',
    details:'M26 22 Q50 8 74 22 L90 46 L66 75 L50 48 L34 75 L10 46 Z M26 22 L50 48 L74 22',
    skirt:'M30 15 L70 15 L82 97 L18 97 Z M29 23 L71 23 M39 23 L41 44 M61 23 L59 44',
    dress:'M34 10 Q50 23 66 10 L77 19 L71 42 L65 40 L66 55 L83 99 L17 99 L34 55 L35 40 L29 42 L23 19 Z',
    bodice:'M32 12 Q50 26 68 12 L80 20 Q70 37 75 48 L70 98 L30 98 L25 48 Q30 37 20 20 Z M40 50 L43 75 L39 93 M60 50 L57 75 L61 93',
    hood:'M27 94 Q3 39 24 20 Q50 -1 76 20 Q97 39 73 94 Z M31 89 Q17 37 35 25 Q50 14 65 25 Q83 37 69 89 Z'
  };
  const categories=[['upper','Плечевые изделия','Лифы, платья, блузы'],['lower','Поясные изделия','Юбки и брюки'],['sleeves','Рукава','Базовые и модельные'],['details','Воротники и детали','Воротники и капюшон']];
  const models=[
    ['bodice-waist','upper','Лиф до талии','bodice'],['bodice-hip','upper','Лиф до бёдер','bodice'],['dress','upper','Платье','dress'],['kimono','upper','Короткое кимоно','upper'],['bustier','upper','Бюстье','bodice'],['jersey','upper','Трикотажная футболка','upper'],['hoodie','upper','Худи','upper'],
    ['skirt','lower','Прямая юбка','skirt'],['skirt90','lower','Юбка 90°','skirt'],['skirt180','lower','Юбка 180°','skirt'],['skirt4','lower','Юбка из 4 клиньев','skirt'],['skirt6','lower','Юбка из 6 клиньев','skirt'],['skirt8','lower','Юбка из 8 клиньев','skirt'],['pajama','lower','Пижамные брюки','lower'],['sport-pants','lower','Спортивные брюки','lower'],['pants','lower','Классические брюки','lower'],
    ['basic-sleeve','sleeves','Базовый рукав','sleeves'],['sport-sleeve','sleeves','Спортивный рукав','sleeves'],['formal-sleeve','sleeves','Классический рукав','sleeves'],
    ['basic-collar','details','Базовый воротник','details'],['shaped-collar','details','Фигурный воротник','details'],['shirt-collar','details','Рубашечный воротник','details'],['hood','details','Капюшон','hood']
  ];
  const home=document.getElementById('category-home'),catalog=document.getElementById('model-catalog'),cards=catalog.querySelector('.cards'),next=document.getElementById('next1');
  home.innerHTML=categories.map(([id,title,description])=>`<button class="category-card" data-family="${id}">${svg(shapes[id])}<strong>${title}</strong><small>${description}</small></button>`).join('');
  cards.innerHTML=models.map(([id,group,title,shape])=>`<button class="card${id===item?' selected':''}" data-item="${id}" data-family="${group}"><span class="icon">${svg(shapes[shape])}</span><strong>${title}</strong><small>${id==='skirt'?'Учебная демонстрация':'Планируется · построения пока нет'}</small></button>`).join('');
  home.querySelectorAll('button').forEach(button=>button.onclick=()=>{
    home.hidden=true;catalog.hidden=false;
    document.getElementById('category-title').textContent=categories.find(c=>c[0]===button.dataset.family)[1]+' · выберите модель';
    cards.querySelectorAll('[data-item]').forEach(card=>card.hidden=card.dataset.family!==button.dataset.family);
    next.hidden=button.dataset.family!=='lower';next.disabled=item!=='skirt';
  });
  document.getElementById('back-categories').onclick=()=>{home.hidden=false;catalog.hidden=true;next.hidden=true;};
  cards.querySelectorAll('[data-item]').forEach(card=>card.onclick=()=>{
    item=card.dataset.item;cards.querySelectorAll('[data-item]').forEach(c=>c.classList.toggle('selected',c===card));
    next.hidden=false;next.disabled=item!=='skirt';
    document.getElementById('catalog-note').textContent=item==='skirt'?'Прямая юбка: доступен ввод мерок и учебное построение. Точные лекала для раскроя ещё проверяются.':'Эта конструкция запланирована. Расчёт и мерки появятся после проверки методики Мюллера.';
    render();
  });
  document.getElementById('build-from-top').onclick=()=>document.getElementById('next2').click();
  // Editing a measurement should expose its measurement line rather than hide it under clothing.
  fields.forEach(key=>document.getElementById(key).addEventListener('focus',()=>{previewMode='measures';render();}));
  render();
})();
