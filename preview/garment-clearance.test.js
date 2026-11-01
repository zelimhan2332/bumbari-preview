const assert=require('node:assert/strict');
global.window=global;
require('./assets/human-data.js');require('./human-viewer.js');
const {skirtEnvelope}=require('./garment-preview.js');
const data=MUELLER_HUMAN_DATA;
function inside(x,z,polygon){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])result=!result;
}return result;}
for(const v of [{height:170,bust:92,waist:72,hip:100,hipheight:20.8,length:61.5},{height:180,bust:110,waist:95,hip:125,hipheight:25,length:85}]){
  const positions=[];for(let i=0;i<data.positions.length;i+=3)positions.push(...humanPreviewModel.deform(...data.positions.slice(i,i+3),v));
  const g=skirtEnvelope(v,data.sections,{body:{positions,indices:data.indices,base:data.positions}});
  let checked=0,penetrations=0;
  for(let i=0;i<positions.length;i+=3){
    const [x,y,z]=positions.slice(i,i+3);
    if(y>=g.top||y<=g.bottom||(data.positions[i+1]>76&&Math.abs(data.positions[i])>21))continue;
    const r=(g.top-y)/v.length*g.rows,row=Math.min(g.rows-1,Math.floor(r)),f=r-row;
    const polygon=Array.from({length:g.segments},(_,j)=>{const a=(row*g.segments+j)*3,b=a+g.segments*3;return [g.positions[a]*(1-f)+g.positions[b]*f,g.positions[a+2]*(1-f)+g.positions[b+2]*f];});
    checked++;if(!inside(x,z,polygon))penetrations++;
  }
  assert.ok(checked>1000);assert.equal(penetrations,0,`body penetrations for hip=${v.hip}`);
  console.log(`Garment clearance: ${checked} body vertices covered, hip ${v.hip} cm`);
}
