(function(root){
  function imagePdf(jpeg,width,height,format='a4'){
    const page=format==='plotter'?[2383.94,3370.39]:[595.276,841.89];
    const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
    const put=data=>{const bytes=typeof data==='string'?enc.encode(data):data;chunks.push(bytes);length+=bytes.length;};
    const obj=(n,text)=>{offsets[n]=length;put(`${n} 0 obj\n${text}\nendobj\n`);};
    put('%PDF-1.4\n');
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page[0]} ${page[1]}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    offsets[4]=length;put(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);put(jpeg);put('\nendstream\nendobj\n');
    const stream=`q\n${page[0]-40} 0 0 ${page[1]-40} 20 20 cm\n/Im0 Do\nQ\n`;
    obj(5,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);
    const xref=length;put('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<6;i++)put(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    put(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out=new Uint8Array(length);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}return out;
  }
  root.MuellerPdf={imagePdf};
  if(typeof module!=='undefined'){module.exports=root.MuellerPdf;return;}
  const button=document.getElementById('download-scheme-pdf'),status=document.getElementById('print-status');
  root.muellerPrintFormat='a4';
  for(const format of ['a4','plotter'])document.getElementById('format-'+format).onclick=()=>{
    root.muellerPrintFormat=format;
    for(const other of ['a4','plotter']){const b=document.getElementById('format-'+other);b.classList.toggle('selected',other===format);b.setAttribute('aria-pressed',String(other===format));}
    let style=document.getElementById('selected-print-page');if(!style){style=document.createElement('style');style.id='selected-print-page';document.head.append(style);}
    style.textContent=`@media print{@page{size:${format==='plotter'?'841mm 1189mm':'A4 portrait'};margin:14mm}}`;
    status.textContent=format==='plotter'?'Выбран A0 для плоттера. Схема не в масштабе 1:1.':'Выбран A4. Схема не в масштабе 1:1.';
  };
  button.onclick=async()=>{
    button.disabled=true;status.textContent='Подготавливаю PDF…';
    try{
      const values={waist:number('waist'),hip:number('hip'),hipHeight:number('hipheight'),length:number('length'),hipEaseHalf:Number(document.getElementById('hip-ease').value),material:document.getElementById('material').value};
      const c=calculateSkirtReference(values),canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1733;
      const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1200,1733);ctx.fillStyle='#1d2434';ctx.font='bold 38px Arial';ctx.fillText('Bumbari · схема прямой юбки',40,60);
      ctx.fillStyle='#a31b3b';ctx.font='bold 22px Arial';ctx.fillText('УЧЕБНАЯ СХЕМА · НЕ 1:1 · НЕ ДЛЯ РАСКРОЯ',40,105);
      const svg=buildSkirtDrawing(values,{annotations:true}).svg;
      const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
      try{
        const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Не удалось отрисовать чертёж.'));image.src=url;});
        const box=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number),ratio=Math.min(1100/box[2],1050/box[3]);
        ctx.drawImage(image, (1200-box[2]*ratio)/2,130,box[2]*ratio,box[3]*ratio);
      }finally{URL.revokeObjectURL(url);}
      ctx.fillStyle='#1d2434';ctx.font='25px Arial';let y=1230;
      const fmt=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2})+' см';
      for(const [label,value] of [['Талия',values.waist],['Бёдра',values.hip],['Высота бёдер (c)',values.hipHeight],['Длина юбки (b)',values.length],['Ширина сетки полотнища (a), схематично',c.hipHalfWithEase/2],['Приталивание, половина изделия',c.intake]]){ctx.fillText(label,40,y);ctx.fillText(fmt(value),990,y);y+=48;}
      ctx.font='21px Arial';ctx.fillStyle='#555';ctx.fillText('Источник контроля: Ателье-2001, PDF 5–7.',40,1570);ctx.fillText('Масштаб изображения подогнан под страницу A4.',40,1610);ctx.fillText(c.exactBookCase?'Контрольный пример; контур требует проверки перед раскроем.':'Для этих мерок показана сетка; вытачки не рассчитаны.',40,1650);
      const binary=atob(canvas.toDataURL('image/jpeg',.95).split(',')[1]),jpeg=Uint8Array.from(binary,c=>c.charCodeAt(0));
      const pdf=imagePdf(jpeg,1200,1733,root.muellerPrintFormat),downloadUrl=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
      const link=document.createElement('a');link.href=downloadUrl;link.download='Bumbari-схема-юбки.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(downloadUrl),30000);
      status.textContent='PDF подготовлен для скачивания. Откройте его из загрузок Chrome; оттуда также можно распечатать.';
    }catch(e){status.textContent='Ошибка: '+e.message;}finally{button.disabled=false;}
  };
})(typeof window!=='undefined'?window:globalThis);
