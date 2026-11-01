(function(root){
  const ranges={height:[120,220],bust:[50,180],waist:[40,180],hip:[60,200],hipheight:[10,40],length:[20,140]};
  function validateProject(input){
    if(!input||input.format!=='mueller-project'||input.version!==1||input.units!=='cm')throw Error('Это не поддерживаемый файл проекта Мюллер (версия 1, сантиметры).');
    if(input.item!=='skirt')throw Error('В этой версии можно открыть только проект прямой юбки.');
    const measurements={};
    for(const [key,[min,max]] of Object.entries(ranges)){
      const value=input.measurements?.[key];
      if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`Некорректная мерка ${key}: допустимо ${min}–${max} см.`);
      measurements[key]=value;
    }
    if(measurements.hip<=measurements.waist||measurements.hipheight>=measurements.length)throw Error('Проверьте соотношение талии, бёдер, высоты бёдер и длины.');
    if(!['woven','stretch','leather'].includes(input.material)||![1,2].includes(input.hipEaseHalf))throw Error('Неизвестный материал или прибавка.');
    if(typeof input.name!=='string'||input.name.length>100||typeof input.notes!=='string'||input.notes.length>20000)throw Error('Название или заметки слишком длинные либо повреждены.');
    return {format:'mueller-project',version:1,units:'cm',name:input.name.trim(),item:'skirt',measurements,material:input.material,hipEaseHalf:input.hipEaseHalf,notes:input.notes};
  }
  function parseProject(text){
    if(typeof text!=='string'||text.length>100000)throw Error('Файл слишком большой. Выберите файл проекта до 100 КБ.');
    let data;try{data=JSON.parse(text);}catch{throw Error('Не удалось прочитать JSON. Выберите файл, сохранённый кнопкой «Сохранить проект».');}
    return validateProject(data);
  }
  root.MuellerProject={validateProject,parseProject};
  if(typeof module!=='undefined')module.exports=root.MuellerProject;
})(typeof window!=='undefined'?window:globalThis);
