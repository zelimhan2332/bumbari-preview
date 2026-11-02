/* Offline anatomical preview. Measurements control a regional deformation, not cloth fit. */
(function(){
  let state,softwareOnly=false,softwareView={yaw:0,pitch:0,zoom:1},softwareLast;
  const defaults={height:170,bust:92,waist:72,hip:100,hipheight:20.8,length:61.5};
  const sane=(v,d)=>Number.isFinite(v)&&v>0?v:d;
  let chestSurface;
  function neutralDepth(x,y,z){
    const dx=Math.abs(x)-10.9,dy=y-124,r=Math.hypot(dx,dy);
    if(z<10||r>=2.8)return z;
    if(!chestSurface){
      // Fit a smooth breast surface to a surrounding ring, excluding the protruding detail.
      const a=window.MUELLER_HUMAN_DATA.positions,normal=Array.from({length:6},()=>Array(7).fill(0));
      for(let i=0;i<a.length;i+=3){const u=Math.abs(a[i])-10.9,v=a[i+1]-124,d=Math.hypot(u,v);
        if(d<2.8||d>4.5||a[i+2]<10)continue;
        const row=[1,u,v,u*u,u*v,v*v];
        for(let j=0;j<6;j++){for(let k=0;k<6;k++)normal[j][k]+=row[j]*row[k];normal[j][6]+=row[j]*a[i+2];}
      }
      for(let j=0;j<6;j++){
        let pivot=j;for(let k=j+1;k<6;k++)if(Math.abs(normal[k][j])>Math.abs(normal[pivot][j]))pivot=k;
        [normal[j],normal[pivot]]=[normal[pivot],normal[j]];
        const divisor=normal[j][j];for(let k=j;k<=6;k++)normal[j][k]/=divisor;
        for(let k=0;k<6;k++)if(k!==j){const f=normal[k][j];for(let n=j;n<=6;n++)normal[k][n]-=f*normal[j][n];}
      }
      chestSurface=normal.map(row=>row[6]);
    }
    const row=[1,dx,dy,dx*dx,dx*dy,dy*dy],surface=row.reduce((sum,v,i)=>sum+v*chestSurface[i],0);
    const t=Math.max(0,Math.min(1,(r-1.2)/1.6)),blend=t*t*(3-2*t);
    return surface*(1-blend)+z*blend;
  }
  let neutralBust;
  function bustCircumference(){
    if(neutralBust)return neutralBust;
    const section=window.MUELLER_HUMAN_DATA.sections.bust,points=section.outline.map(([x,z])=>[x,neutralDepth(x,section.y,z)]);
    neutralBust=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+Math.hypot(p[0]-q[0],p[1]-q[1]);},0);
    return neutralBust;
  }
  function sample(y,anchors){for(let i=1;i<anchors.length;i++){if(y<=anchors[i][0]){const a=anchors[i-1],b=anchors[i],t=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));return a[1]+(b[1]-a[1])*(t*t*(3-2*t));}}return anchors.at(-1)[1];}
  // Monotone Hermite interpolation: continuous slope, no overshoot at measured levels.
  function smoothProfile(y,anchors){
    const n=anchors.length,d=anchors.slice(1).map((b,i)=>(b[1]-anchors[i][1])/(b[0]-anchors[i][0]));
    const m=anchors.map((a,i)=>{
      if(i===0)return d[0];if(i===n-1)return d[n-2];
      if(d[i-1]*d[i]<=0)return 0;
      const h0=a[0]-anchors[i-1][0],h1=anchors[i+1][0]-a[0];
      const w1=2*h1+h0,w2=h1+2*h0;return (w1+w2)/(w1/d[i-1]+w2/d[i]);
    });
    if(y<=anchors[0][0])return anchors[0][1];
    for(let i=1;i<n;i++)if(y<=anchors[i][0]){
      const a=anchors[i-1],b=anchors[i],h=b[0]-a[0],t=(y-a[0])/h;
      return (2*t**3-3*t*t+1)*a[1]+(t**3-2*t*t+t)*h*m[i-1]+(-2*t**3+3*t*t)*b[1]+(t**3-t*t)*h*m[i];
    }
    return anchors[n-1][1];
  }
  function heightAt(y,v){const wy=v.height*110/170,hy=wy-v.hipheight;return smoothProfile(y,[[0,0],[88,hy],[110,wy],[170,v.height]]);}
  function proportions(v){
    const source=window.MUELLER_HUMAN_DATA.sections;
    const hip=v.hip/source.hip.circumference,waist=v.waist/source.waist.circumference,bust=v.bust/bustCircumference();
    // Infer unmeasured parts conservatively. These are visual estimates, not extra measurements.
    const build=Math.exp(.4*Math.log(hip)+.25*Math.log(waist)+.35*Math.log(bust));
    const blend=(a,b,t)=>Math.exp((1-t)*Math.log(a)+t*Math.log(b));
    return [[0,1],[12,blend(1,build,.18)],[38,blend(build,hip,.35)],
      [65,blend(build,hip,.7)],[88,hip],[110,waist],[124,bust],
      [140,blend(build,bust,.5)],[150,blend(1,build,.25)],[160,1],[170,1]];
  }
  function deform(x,y,z,v){
    const factor=smoothProfile(y,proportions(v));
    // A single continuous field moves the body and limbs together, without a hard side mask.
    return [x*factor,heightAt(y,v),neutralDepth(x,y,z)*factor];
  }
  function init(){
    const T=window.THREE,data=window.MUELLER_HUMAN_DATA;
    const scene=new T.Scene();scene.background=new T.Color('#f3f6fa');
    const camera=new T.PerspectiveCamera(34,1,1,1500);camera.position.set(135,103,340);
    const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(340,390);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    const controls=new window.HumanOrbitControls(camera,renderer.domElement);controls.target.set(0,88,0);controls.update();controls.enablePan=false;controls.enableZoom=true;controls.minDistance=230;controls.maxDistance=480;controls.minPolarAngle=.32;controls.maxPolarAngle=2.5;
    scene.add(new T.HemisphereLight(0xffffff,0xb8b1a1,2.5));const key=new T.DirectionalLight(0xfff5e4,3.8);key.position.set(-100,220,150);scene.add(key);const rim=new T.DirectionalLight(0xe2efff,2);rim.position.set(100,150,-120);scene.add(rim);
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setIndex(data.indices);geometry.computeVertexNormals();
    const body=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xbfc9c4,roughness:.95,metalness:0}));scene.add(body);
    const floor=new T.Mesh(new T.CircleGeometry(62,64),new T.MeshStandardMaterial({color:0xe2e8f0,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.6;scene.add(floor);
    const marks=new T.Group();scene.add(marks);
    const garments=new T.Group();scene.add(garments);
    state={scene,camera,renderer,controls,geometry,marks,garments,values:null,active:null};
    controls.addEventListener('change',()=>renderer.render(scene,camera));
    state.draw=()=>renderer.render(scene,camera);
    state.resize=()=>{const c=renderer.domElement.parentElement;if(!c)return;const w=c.clientWidth,h=c.clientHeight;if(w<1||h<1)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();state.draw();};
    state.resizeObserver=new ResizeObserver(state.resize);
    renderer.domElement.style.cssText='width:100%;height:100%;touch-action:none;display:block;';renderer.domElement.setAttribute('aria-label','Объёмный манекен. Поворачивайте мышью или пальцем.');
    return state;
  }
  window.mountHumanMannequin=function(container,values,active,options={}){
    if(container.closest?.('[data-mannequin-hidden]'))return false;
    softwareLast={container,values,active,options};
    const software=()=>{const draw=()=>{if(typeof document!=='undefined'){let canvas=container.querySelector('canvas');if(!canvas){canvas=document.createElement('canvas');canvas.width=540;canvas.height=548;canvas.style.cssText='width:100%;height:100%;object-fit:contain;display:block';canvas.setAttribute('aria-label','Объёмный манекен: вращайте мышью или пальцем');container.replaceChildren(canvas);}window.renderHumanSoftware(values,active,options,softwareView,canvas);}else container.innerHTML=window.renderHumanSoftware(values,active,options,softwareView);container.dataset.humanSignature=JSON.stringify([values,options,softwareView]);};const signature=JSON.stringify([values,options,softwareView]);if(container.dataset.humanSignature!==signature)draw();window.bindHumanOrbit(container,softwareView,draw);return true;};
    if(softwareOnly&&window.renderHumanSoftware)return software();
    try{
      const s=state||init();const v=Object.fromEntries(Object.entries(defaults).map(([k,d])=>[k,sane(values[k],d)]));
      if(!container.contains(s.renderer.domElement)){container.replaceChildren(s.renderer.domElement);s.resizeObserver.disconnect();s.resizeObserver.observe(container);}
      s.resize();
      if(s.lastHeight!==v.height){const targetY=v.height/2+3;const fit=Math.max(1,v.height/185);const offset=s.camera.position.clone().sub(s.controls.target).multiplyScalar(fit/(s.lastFit||1));s.controls.target.set(0,targetY,0);s.camera.position.copy(s.controls.target).add(offset);s.controls.update();s.lastHeight=v.height;s.lastFit=fit;}const signature=JSON.stringify(v);
      if(s.values!==signature){
        const base=window.MUELLER_HUMAN_DATA.positions,pos=s.geometry.attributes.position.array;
        for(let i=0;i<base.length;i+=3){const p=deform(base[i],base[i+1],base[i+2],v);pos[i]=p[0];pos[i+1]=p[1];pos[i+2]=p[2];}
        s.geometry.attributes.position.needsUpdate=true;s.geometry.computeVertexNormals();s.geometry.computeBoundingSphere();s.values=signature;
      }
      while(s.marks.children.length){const o=s.marks.children[0];s.marks.remove(o);o.geometry.dispose();o.material.dispose();}
      const T=window.THREE;
      const garmentSignature=JSON.stringify([v,options]);
      if(s.garmentSignature!==garmentSignature){
        while(s.garments.children.length){const mesh=s.garments.children[0];s.garments.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();}
        s.garmentAvailable=false;
        if(options.mode==='garment'&&options.item==='skirt'){
          const envelope=window.skirtEnvelope(v,window.MUELLER_HUMAN_DATA.sections,{...options,body:{positions:s.geometry.attributes.position.array,indices:window.MUELLER_HUMAN_DATA.indices,base:window.MUELLER_HUMAN_DATA.positions}});
          if(envelope){
            const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(envelope.positions,3));geometry.setIndex(envelope.indices);geometry.computeVertexNormals();
            s.garments.add(new T.Mesh(geometry,new T.MeshStandardMaterial({color:new T.Color(options.garmentColor||'#142d50'),roughness:.86,side:T.DoubleSide})));
            // The top and hem edges make the garment length and opening easy to see.
            for(const row of [0,envelope.rows]){
              const points=Array.from({length:envelope.segments},(_,j)=>new T.Vector3(...envelope.positions.slice((row*envelope.segments+j)*3,(row*envelope.segments+j)*3+3)));
              s.garments.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points,true,'centripetal'),128,.18,6,true),new T.MeshBasicMaterial({color:new T.Color(options.garmentColor||'#142d50').multiplyScalar(.72)})));
            }
            s.garmentAvailable=true;
          }
        }
        s.garmentSignature=garmentSignature;
      }
      s.marks.visible=options.mode!=='garment';
      for(const [name,section] of Object.entries(window.MUELLER_HUMAN_DATA.sections)){
        const points=section.outline.map(([x,z])=>{let p=deform(x,section.y,z,v);if(name==='bust')p[1]+=Math.max(0,(-z+3)/7);return new T.Vector3(p[0]*1.025,p[1],p[2]*1.025);});
        const curve=new T.CatmullRomCurve3(points,true,'centripetal');
        const loop=new T.Mesh(new T.TubeGeometry(curve,Math.max(160,points.length),active===name?.42:.28,8,true),new T.MeshBasicMaterial({color:active===name?0xffb000:0x0754b8}));s.marks.add(loop);
      }
      const wy=v.height*110/170,hy=wy-v.hipheight,hem=wy-v.length;
      const linePoints=active==='height'?[new T.Vector3(-56,0,0),new T.Vector3(-56,v.height,0)]:active==='hipheight'?[new T.Vector3(47,hy,0),new T.Vector3(47,wy,0)]:active==='length'?[new T.Vector3(-49,Math.max(0,hem),0),new T.Vector3(-49,wy,0)]:[];
      if(linePoints.length)s.marks.add(new T.Mesh(new T.TubeGeometry(new T.LineCurve3(...linePoints),1,.35,8,false),new T.MeshBasicMaterial({color:0xffb000})));
      s.active=active;s.draw();return true;
    }catch(error){softwareOnly=true;if(window.renderHumanSoftware)return software();container.innerHTML='Не удалось загрузить человеческую модель. Обновите страницу.';console.warn('Mannequin preview',error);return false;}
  };
  window.setMannequinView=function(view){if(softwareOnly&&softwareLast){softwareView.yaw=view==='side'?Math.PI/2:view==='back'?Math.PI:0;softwareView.pitch=0;const s=softwareLast;window.mountHumanMannequin(s.container,s.values,s.active,s.options);return;}if(!state)return;const p=view==='side'?[350,94,0]:view==='back'?[0,94,-350]:[0,94,350];state.camera.position.set(...p);state.controls.target.set(0,88,0);state.controls.update();state.draw();};
  window.humanPreviewModel={deform,heightAt,defaults};
})();
