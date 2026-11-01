/* Source: user-supplied Ателье-2001, PDF 5–7 / printed 6–8.
   Centimetres. Curve interpolation and tangent truing are engineering choices. */
(function(root){
  const rotate=(p,angle,center)=>{const x=p.x-center.x,y=p.y-center.y;return {x:center.x+x*Math.cos(angle)-y*Math.sin(angle),y:center.y+x*Math.sin(angle)+y*Math.cos(angle)};};
  function curveLength(curve){
    const {a,c1,c2,b}=curve;
    const speed=t=>{const u=1-t;return Math.hypot(3*u*u*(c1.x-a.x)+6*u*t*(c2.x-c1.x)+3*t*t*(b.x-c2.x),3*u*u*(c1.y-a.y)+6*u*t*(c2.y-c1.y)+3*t*t*(b.y-c2.y));};
    const integrate=(l,r,fl,fm,fr,whole,eps,depth)=>{
      const m=(l+r)/2,f1=speed((l+m)/2),f2=speed((m+r)/2),left=(m-l)*(fl+4*f1+fm)/6,right=(r-m)*(fm+4*f2+fr)/6,delta=left+right-whole;
      if(depth===0||Math.abs(delta)<=15*eps)return left+right+delta/15;
      return integrate(l,m,fl,f1,fm,left,eps/2,depth-1)+integrate(m,r,fm,f2,fr,right,eps/2,depth-1);
    };
    const fl=speed(0),fm=speed(.5),fr=speed(1);return integrate(0,1,fl,fm,fr,(fl+4*fm+fr)/6,1e-7,18);
  }
  function auditGeometry(g,values,c){
    const waist=g.front.waist.concat(g.back.waist).reduce((sum,curve)=>sum+curveLength(curve),0);
    const frontSide=curveLength(g.front.side)+values.length-values.hipHeight;
    const backSide=curveLength(g.back.side)+values.length-values.hipHeight;
    const waistError=waist-c.waistHalfWithEase,sideError=frontSide-backSide;
    // Engineering check tolerance (1 mm); not a tolerance specified by the book.
    return {waist,waistTarget:c.waistHalfWithEase,waistError,frontSide,backSide,sideError,tolerance:.1,waistPass:Math.abs(waistError)<=.1,sidePass:Math.abs(sideError)<=.1,cutReady:false};
  }
  function dart(center,intake,length,rise){
    const left={x:center-intake/2,y:-rise},right={x:center+intake/2,y:-rise},tip={x:center,y:length};
    const closeAngle=Math.atan2(left.y-tip.y,left.x-tip.x)-Math.atan2(right.y-tip.y,right.x-tip.x);
    const closed=rotate(right,closeAngle,tip);
    return {left,right,tip,intake,length,rise,closeAngle,closureError:Math.hypot(closed.x-left.x,closed.y-left.y)};
  }
  function waistSegments(start,end,darts){
    const baseAngle=Math.atan2(end.y-start.y,end.x-start.x),segments=[];
    let last=start,lastSlope=Math.tan(baseAngle);
    for(const d of [...darts].sort((a,b)=>a.left.x-b.left.x)){
      // When the right leg rotates onto the left, the two waist tangents coincide.
      const leftSlope=Math.tan(baseAngle+d.closeAngle/2),rightSlope=Math.tan(baseAngle-d.closeAngle/2);
      const span=d.left.x-last.x;
      segments.push({a:last,c1:{x:last.x+span/3,y:last.y+lastSlope*span/3},c2:{x:d.left.x-span/3,y:d.left.y-leftSlope*span/3},b:d.left});
      d.leftSlope=leftSlope;d.rightSlope=rightSlope;last=d.right;lastSlope=rightSlope;
    }
    const span=end.x-last.x;
    segments.push({a:last,c1:{x:last.x+span/3,y:last.y+lastSlope*span/3},c2:{x:end.x-span/3,y:end.y-Math.tan(baseAngle)*span/3},b:end});
    if(segments.some(s=>s.b.x<=s.a.x))throw Error('Вытачки пересекаются или выходят за контур.');
    return segments;
  }
  function buildSkirtGeometry(values,calculation){
    const c=calculation,half=c.hipHalfWithEase/2;
    if(!c.exactBookCase)return null;
    const p={sideRise:1.25,frontOffset:7,frontLength:9.5,frontRise:.6,backLength:14,backRise:.6,mainBackOffset:6,mainBackRise:.35,extraBackLength:12.5,extraBackRise:.6};
    const two=c.darts.back.length===2,shift=two?.5:0;
    const frontSide=half-c.darts.side/2-shift;
    const backSide=c.darts.side/2-shift;
    // PDF 6 / printed 7: measure 6–8 cm from the shaped side seam along the waist,
    // not from the original vertical side line of the rectangular grid.
    const frontDarts=[dart(frontSide-p.frontOffset,c.darts.front,p.frontLength,p.frontRise)];
    const mainCenter=two?half-p.mainBackOffset:(backSide+half)/2;
    const backDarts=two?[dart((backSide+mainCenter)/2,c.darts.back[1],p.extraBackLength,p.extraBackRise),dart(mainCenter,c.darts.back[0],p.backLength,p.mainBackRise)]:[dart(mainCenter,c.darts.back[0],p.backLength,p.backRise)];
    const front={start:{x:0,y:0},end:{x:frontSide,y:-p.sideRise},darts:frontDarts};
    const back={start:{x:backSide,y:-p.sideRise},end:{x:half,y:0},darts:backDarts};
    front.waist=waistSegments(front.start,front.end,front.darts);back.waist=waistSegments(back.start,back.end,back.darts);
    const hipPoint={x:half,y:values.hipHeight};
    front.side={a:front.end,c1:{x:front.end.x+(half-front.end.x)*.5,y:front.end.y+(values.hipHeight-front.end.y)/3},c2:{x:half,y:values.hipHeight*.7},b:hipPoint};
    back.side={a:{x:0,y:values.hipHeight},c1:{x:0,y:values.hipHeight*.7},c2:{x:back.start.x*.5,y:back.start.y+(values.hipHeight-back.start.y)/3},b:back.start};
    const g={half,front,back,parameters:p,sideShift:shift,source:'Ателье-2001, PDF 5–7 (печатные 6–8)',status:'reference-construction-with-engineered-curves'};
    g.audit=auditGeometry(g,values,c);return g;
  }
  root.MuellerSkirtGeometry={buildSkirtGeometry,rotate,curveLength,waistSegments,auditGeometry};
  if(typeof module!=='undefined')module.exports=root.MuellerSkirtGeometry;
})(typeof window!=='undefined'?window:globalThis);
