/* Straight folded waistband: Ателье-2001 PDF 9 / printed 10, fig. 9.
   cm. Width 2–5 cm finished, overlap 3 cm as illustrated. No seam allowances.
   Matching length to the generated waist seam is an engineering assembly choice. */
(function(root){
 function buildWaistband({waistSeam,finishedWidth=3,overlap=3}){
  if(!Number.isFinite(waistSeam)||waistSeam<=0)throw Error('Некорректная длина талиевого шва для пояса.');
  if(!Number.isFinite(finishedWidth)||finishedWidth<2||finishedWidth>5)throw Error('Ширина прямого пояса по выбранному варианту: 2–5 см.');
  if(overlap!==3)throw Error('В проверенном варианте припуск на застёжку — 3 см.');
  return {length:waistSeam+overlap,cutWidth:finishedWidth*2,finishedWidth,overlap,waistSeam,
   seamAllowances:false,source:'Ателье-2001, PDF 9 (печатная 10), рис. 9',
   status:'source-width-and-overlap-engineered-seam-match'};
 }
 root.buildWaistband=buildWaistband;
 if(typeof module!=='undefined')module.exports={buildWaistband};
})(typeof window!=='undefined'?window:globalThis);