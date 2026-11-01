/* CPU projection of the SAME deformed mesh used by WebGL. No inferred sewing measurements. */
(function(root){
 function renderHumanSoftware(values,active,options={},view='front'){
  const model=root.humanPreviewModel,data=root.MUELLER_HUMAN_DATA;
  const v=Object.fromEntries(Object.entries(model.defaults).map(([k,d])=>[k,Number.isFinite(values[k])&&values[k]>0?values[k]:d]));
  const positions=[];
  for(let i=0;i<data.positions.length;i+=3)positions.push(...model.deform(...data.positions.slice(i,i+3),v));
  const orbit=typeof view==='object'?view:{yaw:view==='side'?Math.PI/2:view==='back'?Math.PI:0,pitch:0,zoom:1};
  const co=Math.cos(orbit.yaw),si=Math.sin(orbit.yaw),cp=Math.cos(orbit.pitch),sp=Math.sin(orbit.pitch),scale=300/v.height*orbit.zoom;
  const project=(x,y,z)=>{const depth=-x*si+z*co,up=y-v.height/2;return [(x*co+z*si)*scale+180,175-(up*cp-depth*sp)*scale,up*sp+depth*cp];};
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
 root.bindHumanOrbit=function(container,orbit,draw){
  let pointer=null,lastX=0,lastY=0;
  container.style.touchAction='none';container.style.cursor='grab';
  container.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;container.setPointerCapture?.(pointer);container.style.cursor='grabbing';e.preventDefault();};
  container.onpointermove=e=>{if(e.pointerId!==pointer)return;orbit.yaw+=(e.clientX-lastX)*.012;orbit.pitch=Math.max(-.8,Math.min(.8,orbit.pitch+(e.clientY-lastY)*.008));lastX=e.clientX;lastY=e.clientY;draw();};
  container.onpointerup=container.onpointercancel=()=>{pointer=null;container.style.cursor='grab';};
  container.onwheel=e=>{e.preventDefault();orbit.zoom=Math.max(.65,Math.min(1.8,orbit.zoom*Math.exp(-e.deltaY*.001)));draw();};
  container.ondblclick=()=>{Object.assign(orbit,{yaw:0,pitch:0,zoom:1});draw();};
 };
})(typeof window!=='undefined'?window:globalThis);