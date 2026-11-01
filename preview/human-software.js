/* CPU projection of the SAME deformed mesh used by WebGL. No inferred sewing measurements. */
(function(root){
 function renderHumanSoftware(values,active,options={},view='front'){
  const model=root.humanPreviewModel,data=root.MUELLER_HUMAN_DATA;
  const v=Object.fromEntries(Object.entries(model.defaults).map(([k,d])=>[k,Number.isFinite(values[k])&&values[k]>0?values[k]:d]));
  const positions=[];
  for(let i=0;i<data.positions.length;i+=3)positions.push(...model.deform(...data.positions.slice(i,i+3),v));
  const angle=view==='side'?Math.PI/2:view==='back'?Math.PI:0,co=Math.cos(angle),si=Math.sin(angle),scale=300/v.height;
  const project=(x,y,z)=>[(x*co+z*si)*scale+180,325-y*scale,-x*si+z*co];
  const faces=[];
  function mesh(p,indices,blue){
   for(let i=0;i<indices.length;i+=3){
    const a=indices.slice(i,i+3).map(j=>project(...p.slice(j*3,j*3+3)));
    const u=a[1].map((x,k)=>x-a[0][k]),w=a[2].map((x,k)=>x-a[0][k]);
    const n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],len=Math.hypot(...n)||1;
    const light=.55+.35*Math.abs((n[0]*-.4+n[1]*-.5+n[2]*.75)/len);
    const rgb=(blue?[45,86,139]:[207,215,225]).map(c=>Math.round(c*light)).join(',');
    faces.push({z:a.reduce((s,p)=>s+p[2],0)/3,svg:`<path d="M${a.map(p=>p.slice(0,2).map(n=>n.toFixed(1)).join(',')).join('L')}Z" fill="rgb(${rgb})" stroke="rgb(${rgb})" stroke-width=".35"/>`});
   }
  }
  mesh(positions,data.indices,false);
  if(options.mode==='garment'&&options.item==='skirt'){
   const g=root.skirtEnvelope(v,data.sections,{hipEaseHalf:options.hipEaseHalf||1,body:{positions,indices:data.indices,base:data.positions}});
   if(g)mesh(g.positions,g.indices,true);
  }
  faces.sort((a,b)=>a.z-b.z);
  return `<svg viewBox="0 0 360 365" role="img" aria-label="Объёмная человеческая модель по меркам"><ellipse cx="180" cy="329" rx="60" ry="7" fill="#142d50" opacity=".1"/>${faces.map(f=>f.svg).join('')}<text x="180" y="354" text-anchor="middle" font-size="10" fill="#61758e">Пропорции по меркам · не проверка посадки</text></svg>`;
 }
 root.renderHumanSoftware=renderHumanSoftware;
})(typeof window!=='undefined'?window:globalThis);