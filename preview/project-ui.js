(function(){
  const nameInput=document.getElementById('project-name'),status=document.getElementById('project-status');
  nameInput.value=localStorage.getItem('mueller-project-name-v1')||'';
  nameInput.addEventListener('input',()=>localStorage.setItem('mueller-project-name-v1',nameInput.value));
  const currentProject=()=>MuellerProject.validateProject({format:'mueller-project',version:1,units:'cm',name:nameInput.value,item,measurements:Object.fromEntries(fields.map(key=>[key,number(key)])),material:document.getElementById('material').value,hipEaseHalf:Number(document.getElementById('hip-ease').value),notes:document.getElementById('fit-notes').value});
  document.getElementById('save-project').onclick=()=>{
    try{
      const data=MuellerProject.validateProject({...currentProject(),modeling:window.getSkirtModeling?.()}),blob=new Blob([JSON.stringify({...data,savedAt:new Date().toISOString(),appVersion:'0.5'},null,2)],{type:'application/json'});
      const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;
      link.download=(data.name||'Bumbari-юбка').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').slice(0,80)+'.mueller.json';
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      status.textContent='Файл подготовлен для скачивания. Перенесите его на другой компьютер и нажмите «Открыть проект». Это данные проекта, а не PDF лекал.';
    }catch(e){status.textContent=e.message;}
  };
  const picker=document.getElementById('project-file'),pending=document.getElementById('project-import'),summary=document.getElementById('project-import-summary');
  let candidate=null;
  document.getElementById('open-project').onclick=()=>{picker.value='';picker.click();};
  picker.onchange=async()=>{
    candidate=null;pending.hidden=true;const file=picker.files[0];if(!file)return;
    try{
      if(file.size>100000)throw Error('Файл слишком большой: максимум 100 КБ.');
      candidate=MuellerProject.parseProject(await file.text());
      const m=candidate.measurements;
      summary.textContent=`${candidate.name||'Без названия'}: талия ${m.waist}, бёдра ${m.hip}, длина ${m.length} см. Загрузка заменит текущие мерки и заметки. При необходимости сначала сохраните текущий проект.`;
      pending.hidden=false;status.textContent='Файл проверен. Подтвердите загрузку ниже.';
    }catch(e){status.textContent=e.message;}
  };
  document.getElementById('cancel-import').onclick=()=>{candidate=null;pending.hidden=true;status.textContent='Загрузка отменена. Текущий проект сохранён.';};
  document.getElementById('apply-import').onclick=()=>{
    if(!candidate)return;const data=candidate;
    // Complete validation precedes any edit. Text is never inserted as HTML.
    for(const key of fields)document.getElementById(key).value=String(data.measurements[key]).replace('.',',');
    nameInput.value=data.name;document.getElementById('material').value=data.material;document.getElementById('hip-ease').value=data.hipEaseHalf;
    document.getElementById('fit-notes').value=data.notes;item=data.item;current=2;
    window.setSkirtModeling?.(data.modeling);
    document.querySelectorAll('[data-item]').forEach(card=>card.classList.toggle('selected',card.dataset.item===item));
    document.getElementById('next1').disabled=false;
    // Imported items must remain visible even if a different catalogue filter was selected.
    document.querySelectorAll('[data-item]').forEach(card=>card.hidden=false);
    document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category==='all')));
    localStorage.setItem('mueller-preview-v1',JSON.stringify(data.measurements));
    localStorage.setItem('mueller-material-v1',JSON.stringify({material:data.material,hipEaseHalf:data.hipEaseHalf}));
    localStorage.setItem('mueller-fitting-notes-v1',data.notes);localStorage.setItem('mueller-project-name-v1',data.name);
    candidate=null;pending.hidden=true;status.textContent='Проект открыт. Проверьте мерки перед построением.';render();
  };
})();
