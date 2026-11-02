/* Export policy, not drafting formulas. Prevent silently omitted model settings. */
(function(root){
 function printReadiness({reference,modeling,vent,experimentalConsent=false,completeKit=false}){
  const errors=[];
  if(vent&&!completeKit)errors.push('Шлица выбрана, но ещё не встроена в полный комплект. Печать основы не заменяет лекало со шлицей.');
  if(modeling&&modeling.hemReduction>0)errors.push('Заужение выбрано, но ещё не встроено в печатные детали.');
  if(!reference&&!experimentalConsent)errors.push('Распределение вытачек для этих мерок экспериментальное. Для учебного PDF требуется явное подтверждение; готовность к раскрою не подтверждена.');
  return {allowed:errors.length===0,errors,cutReady:false};
 }
 root.printReadiness=printReadiness;
 if(typeof module!=='undefined')module.exports={printReadiness};
})(typeof window!=='undefined'?window:globalThis);