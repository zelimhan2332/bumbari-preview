/* Ателье-2001, PDF 5–7 / printed 6–8, visually reviewed 2026-11-02. All values: cm. */
(function(root){
 const calculate=typeof module!=='undefined'?require('./skirt-calculation').calculateSkirtReference:root.calculateSkirtReference;
 function bookSkirtSteps(values){
  const c=calculate(values),f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
  const distribution=c.exactBookCase
   ?`${f(c.intake)} = ${[c.darts.side,c.darts.front,...c.darts.back].map(f).join(' + ')} см: боковые срезы, передняя, задние вытачки.`
   :'Для этих мерок книжный контрольный пример отсутствует. Автоматическое распределение в текущем чертеже экспериментальное, не подтверждено книгой.';
  return {source:c.source,reference:c.exactBookCase,steps:[
   {title:'1. Базисная сетка',text:`Длина ${f(values.length)} см. Ширина половины изделия: ${f(values.hip)} / 2 + ${f(c.hipEaseHalf)} = ${f(c.hipHalfWithEase)} см. PDF 5, рис. 1.`},
   {title:'2. Бёдра и боковая линия',text:`От талии вниз ${f(values.hipHeight)} см. Боковая линия делит ширину сетки пополам: ${f(c.hipHalfWithEase)} / 2 = ${f(c.hipHalfWithEase/2)} см. PDF 5.`},
   {title:'3. Расчёт приталивания',text:`Половина по талии: ${f(values.waist)} / 2 + 1 = ${f(c.waistHalfWithEase)} см. Общий раствор на половину изделия: ${f(c.hipHalfWithEase)} − ${f(c.waistHalfWithEase)} = ${f(c.intake)} см. PDF 5–6.`},
   {title:'4. Распределение вытачек',text:distribution+' PDF 5–7. Боковой раствор распределяется на два среза; это не раствор одной вытачки.'},
   {title:'5. Уточнение талии',text:'Закрыть вытачки и уточнить линию талии. Положение и форма вытачек выбираются по фигуре и модели. Цифровые кривые и численное согласование швов — инженерная реализация, а не подтверждённая форма всех контуров книги. PDF 6–7. Далее обязательны пробный макет и примерка.'}
  ]};
 }
 root.bookSkirtSteps=bookSkirtSteps;
 if(typeof module!=='undefined')module.exports={bookSkirtSteps};
})(typeof window!=='undefined'?window:globalThis);