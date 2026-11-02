(function(root){
  const ranges={height:[120,220],bust:[50,180],waist:[40,180],hip:[60,200],hipheight:[10,40],length:[20,140]};
  function validateProject(input){
    if(!input||input.format!=='mueller-project'||input.version!==1||input.units!=='cm')throw Error('Это не поддерживаемый файл проекта Мюллер (версия 1, сантиметры).');
    if(!['skirt','pants'].includes(input.item))throw Error('Неизвестный вид изделия.');
    const measurements={};
    const trouserRanges={waist:[40,180],hip:[60,200],sideLength:[40,160],seatHeight:[10,60],hemCircumference:[10,100],shortening:[0,60],frontDart:[1.5,2.5],frontDartLength:[9,10],backShift:[1,2],seatShapeOffset:[3,5]};
    for(const [key,[min,max]] of Object.entries(input.item==='pants'?trouserRanges:ranges)){
      const value=input.measurements?.[key];
      if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`Некорректная мерка ${key}: допустимо ${min}–${max} см.`);
      measurements[key]=value;
    }
    if(measurements.hip<=measurements.waist||(input.item==='skirt'&&measurements.hipheight>=measurements.length))throw Error('Проверьте соотношение талии, бёдер, высоты бёдер и длины.');
    if(!['woven','stretch','leather'].includes(input.material)||![1,2].includes(input.hipEaseHalf))throw Error('Неизвестный материал или прибавка.');
    if(typeof input.name!=='string'||input.name.length>100||typeof input.notes!=='string'||input.notes.length>20000)throw Error('Название или заметки слишком длинные либо повреждены.');
    const result={format:'mueller-project',version:1,units:'cm',name:input.name.trim(),item:input.item,measurements,material:input.material,hipEaseHalf:input.hipEaseHalf,notes:input.notes};
    if(input.item==='pants'){
      const engine=typeof module!=='undefined'?require('./trouser-foundation'):root.TrouserFoundation;
      engine.build(measurements);
      if(input.modeling!==undefined||input.vent!==undefined)throw Error('Настройки юбки не относятся к брюкам.');
      return result;
    }
    if(input.modeling!==undefined){
      const m=input.modeling;
      if(!m||m.kind!=='taper-study'||!Number.isFinite(m.startBelowHip)||m.startBelowHip<8||m.startBelowHip>10||!Number.isFinite(m.hemReduction)||m.hemReduction<0||m.hemReduction>2)throw Error('Некорректные настройки учебного заужения.');
      result.modeling={kind:'taper-study',startBelowHip:m.startBelowHip,hemReduction:m.hemReduction};
    }
    if(input.vent!==undefined){
      const v=input.vent;
      if(!v||!Number.isFinite(v.width)||v.width<4||v.width>7||!Number.isFinite(v.ventLength)||v.ventLength<=0||v.ventLength>=measurements.length-measurements.hipheight)throw Error('Некорректные параметры шлицы: проверьте длину, ширину и положение относительно бёдер.');
      result.vent={ventLength:v.ventLength,width:v.width};
    }
    return result;
  }
  function parseProject(text){
    if(typeof text!=='string'||text.length>100000)throw Error('Файл слишком большой. Выберите файл проекта до 100 КБ.');
    let data;try{data=JSON.parse(text);}catch{throw Error('Не удалось прочитать JSON. Выберите файл, сохранённый кнопкой «Сохранить проект».');}
    return validateProject(data);
  }
  root.MuellerProject={validateProject,parseProject};
  if(typeof module!=='undefined')module.exports=root.MuellerProject;
})(typeof window!=='undefined'?window:globalThis);
