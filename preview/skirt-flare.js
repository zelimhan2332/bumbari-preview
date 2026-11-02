/* Ателье-2001 PDF 8 / printed 9, fig. 7–8, cm.
   Arithmetic control only: does not replace slash/spread geometry or dart closure. */
(function(root){
 function flareControl({frontCuts,frontSide,backCuts,backSide}){
  for(const cuts of [frontCuts,backCuts])if(!Array.isArray(cuts)||cuts.length<1||cuts.length>2||cuts.some(n=>!Number.isFinite(n)||n<0))throw Error('Укажите одно или два неотрицательных раскрытия разрезов на полотнище.');
  for(const n of [frontSide,backSide])if(!Number.isFinite(n)||n<0)throw Error('Расширение по боковому срезу должно быть неотрицательным.');
  const sum=a=>a.reduce((s,n)=>s+n,0),frontTotal=sum(frontCuts)+frontSide,backTotal=sum(backCuts)+backSide;
  if(frontTotal<=0||backTotal<=0)throw Error('Суммарное расширение должно быть положительным.');
  return {frontTotal,backTotal,difference:frontTotal-backTotal,balanced:Math.abs(frontTotal-backTotal)<1e-8,
   source:'Ателье-2001, PDF 8 (печатная 9), рис. 7–8',cutReady:false};
 }
 root.flareControl=flareControl;
 if(typeof module!=='undefined'){module.exports={flareControl};return;}
 const host=document.createElement('section');host.className='note';
 host.innerHTML='<h3>Расширение юбки · контроль распределения</h3><p>По инструкции расширение переднего полотнища служит ориентиром для заднего. Пример: два раскрытия по 3 см и боковое расширение 3 см дают 9 см. Это проверка суммы, не готовый чертёж. Для лекала нужны разрезы до концов вытачек, поворот частей, закрытие или перенос остатка вытачки и уточнение низа.</p><div class="form">'+[['front-cut-1','Перед: первый разрез'],['front-cut-2','Перед: второй разрез'],['front-side','Перед: боковой срез'],['back-cut-1','Спинка: первый разрез'],['back-cut-2','Спинка: второй разрез'],['back-side','Спинка: боковой срез']].map(([id,label])=>`<label>${label}, см <input id="${id}" type="number" min="0" step="0.5" value="3"></label>`).join('')+'</div><p id="flare-result" aria-live="polite"></p><p>Настройки этого контрольного расчёта пока не сохраняются в проект и не входят в PDF. Величины не подбираются автоматически по обхватам.</p>';
 document.getElementById('s3').append(host);
 function refresh(){
  const n=id=>Number(document.getElementById(id).value),out=document.getElementById('flare-result');
  try{const r=flareControl({frontCuts:[n('front-cut-1'),n('front-cut-2')],frontSide:n('front-side'),backCuts:[n('back-cut-1'),n('back-cut-2')],backSide:n('back-side')});const f=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});out.textContent=`Перед: ${f(r.frontTotal)} см; спинка: ${f(r.backTotal)} см. ${r.balanced?'Суммы расширения согласованы.':'Разница '+f(r.difference)+' см: проверьте распределение.'}  Равенство сумм не подтверждает геометрию или посадку.`;}catch(e){out.textContent=e.message;}
 }
 host.addEventListener('input',refresh);refresh();
})(typeof window!=='undefined'?window:globalThis);