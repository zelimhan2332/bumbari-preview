/* Visual envelope only. Not a sewn-pattern reconstruction or fabric simulation. */
(function(root){
  function sectionPoint(section,angle){
    const center=section.outline.reduce((s,p)=>s+p[1],0)/section.outline.length;
    const points=section.outline.map(([x,z])=>({a:Math.atan2(z-center,x),r:Math.hypot(x,z-center)})).sort((a,b)=>a.a-b.a);
    // atan2 uses [-PI, PI], whereas the mesh samples [0, 2*PI).
    // Wrap both halves into the same interval, including the last-to-first seam.
    const period=Math.PI*2;
    let a=((angle-points[0].a)%period+period)%period+points[0].a;
    const extended=[...points,{a:points[0].a+Math.PI*2,r:points[0].r}];
    for(let i=1;i<extended.length;i++)if(a<=extended[i].a){const p=extended[i-1],q=extended[i],t=(a-p.a)/(q.a-p.a),r=p.r+(q.r-p.r)*t;return [Math.cos(angle)*r,center+Math.sin(angle)*r];}
    return [0,center];
  }
  function hull(points){
    points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const chain=list=>{const out=[];for(const p of list){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
    const lo=chain(points),hi=chain([...points].reverse());return lo.slice(0,-1).concat(hi.slice(0,-1));
  }
  function clearBody(positions,segments,rows,body){
    const {positions:vertices,indices,base}=body;
    const step=Math.abs(positions[1]-positions[segments*3+1]);
    const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
    for(let row=0;row<=rows;row++){
      const y=positions[row*segments*3+1],low=y-step,high=y+step,points=[];
      for(let t=0;t<indices.length;t+=3){
        const ia=indices[t]*3,ib=indices[t+1]*3,ic=indices[t+2]*3;
        if(Math.min(vertices[ia+1],vertices[ib+1],vertices[ic+1])>high||Math.max(vertices[ia+1],vertices[ib+1],vertices[ic+1])<low)continue;
        const ids=[indices[t],indices[t+1],indices[t+2]];
        // Exclude the arms using the original mesh, independently of entered body size.
        if(base&&ids.some(i=>base[i*3+1]>76&&Math.abs(base[i*3])>21))continue;
        const tri=ids.map(i=>[vertices[i*3],vertices[i*3+1],vertices[i*3+2]]);
        for(let k=0;k<3;k++){
          const a=tri[k],b=tri[(k+1)%3];
          if(a[1]>=low&&a[1]<=high)points.push([a[0],a[2]]);
          for(const level of [low,high])if((a[1]<level&&b[1]>level)||(a[1]>level&&b[1]<level)){
            const f=(level-a[1])/(b[1]-a[1]);points.push([a[0]+f*(b[0]-a[0]),a[2]+f*(b[2]-a[2])]);
          }
        }
      }
      if(points.length<3)continue;
      const polygon=hull(points),centerZ=(Math.min(...polygon.map(p=>p[1]))+Math.max(...polygon.map(p=>p[1])))/2;
      for(let j=0;j<segments;j++){
        const angle=j/segments*Math.PI*2,dir=[Math.cos(angle),Math.sin(angle)],i=(row*segments+j)*3;
        let radius=0;
        for(let k=0;k<polygon.length;k++){
          const a=[polygon[k][0],polygon[k][1]-centerZ],b=polygon[(k+1)%polygon.length],edge=[b[0]-a[0],b[1]-centerZ-a[1]],den=cross(dir,edge);
          if(Math.abs(den)<1e-10)continue;
          const r=cross(a,edge)/den,u=cross(a,dir)/den;
          if(r>=0&&u>=-1e-8&&u<=1+1e-8)radius=Math.max(radius,r);
        }
        // Project the original envelope onto the same rays; cover the complete body slab.
        radius=Math.max(radius+1,Math.hypot(positions[i],positions[i+2]-centerZ));
        positions[i]=radius*dir[0];positions[i+2]=centerZ+radius*dir[1];
      }
    }
  }
  function skirtEnvelope(values,sections,{hipEaseHalf=1,body=null}={}){
    const {height,waist,hip,hipheight,length}=values;
    if(![height,waist,hip,hipheight,length].every(n=>Number.isFinite(n)&&n>0)||hipheight>=length||hip<=waist)return null;
    const top=height*110/170,bottom=top-length;
    if(bottom<1)return null;
    const segments=96,rows=32,positions=[],indices=[];
    const waistScale=(waist+2)/sections.waist.circumference;
    const hipScale=(hip+2*hipEaseHalf)/sections.hip.circumference;
    const waistRing=Array.from({length:segments},(_,j)=>sectionPoint(sections.waist,j/segments*Math.PI*2));
    const hipRing=Array.from({length:segments},(_,j)=>sectionPoint(sections.hip,j/segments*Math.PI*2));
    for(let i=0;i<=rows;i++){
      const down=i/rows*length,t=Math.min(1,down/hipheight),blend=t*t*(3-2*t);
      for(let j=0;j<segments;j++){
        const w=waistRing[j],h=hipRing[j];
        const x=w[0]*waistScale*(1-blend)+h[0]*hipScale*blend;
        const z=w[1]*waistScale*(1-blend)+h[1]*hipScale*blend;
        // Small display clearance avoids flicker against the body. This is not a seam allowance.
        const angle=j/segments*Math.PI*2;
        positions.push(x+.45*Math.cos(angle),top-down,z+.45*Math.sin(angle));
        if(i<rows){const a=i*segments+j,b=i*segments+(j+1)%segments,c=a+segments,d=b+segments;indices.push(a,c,b,b,c,d);}
      }
    }
    if(body)clearBody(positions,segments,rows,body);
    return {positions,indices,segments,rows,top,bottom};
  }
  root.skirtEnvelope=skirtEnvelope;
  if(typeof module!=='undefined')module.exports={skirtEnvelope};
})(typeof window!=='undefined'?window:globalThis);
