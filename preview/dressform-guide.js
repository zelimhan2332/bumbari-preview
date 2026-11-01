/* WebGL-free dress form. Visual proportions only, not a body scan or fit simulation. */
(function(root){
 function dressformGuide(active='waist',values={},options={}){
  const value=(key,fallback)=>Number.isFinite(values[key])&&values[key]>0?values[key]:fallback;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const w=clamp(value('waist',72)*.43,24,64),h=clamp(value('hip',100)*.43,32,78),b=clamp(value('bust',92)*.42,30,72);
  const wy=154,hy=wy+clamp(value('hipheight',20.8)*1.65,20,65),hem=clamp(wy+value('length',61.5)*1.65,hy+20,310);
  const garment=options.mode==='garment'&&options.item==='skirt';
  const torso=`M166 48 L194 48 L195 64 Q205 68 218 73 Q${180+b+7} 91 ${180+b} 107 C${180+b} 124 ${180+w} 137 ${180+w} ${wy} C${180+w} ${wy+18} ${180+h} ${hy-18} ${180+h} ${hy} Q${180+h+2} ${hy+25} ${180+h-9} ${hy+42} Q180 ${hy+52} ${180-h+9} ${hy+42} Q${180-h-2} ${hy+25} ${180-h} ${hy} C${180-h} ${hy-18} ${180-w} ${wy+18} ${180-w} ${wy} C${180-w} 137 ${180-b} 124 ${180-b} 107 Q${180-b-7} 91 142 73 Q155 68 165 64 Z`;
  const ring=(key,y,half,label)=>`<g fill="none" stroke="${active===key?'#c08636':'#597a9e'}" stroke-width="${active===key?2.5:1.2}"><path d="M${180-half-4} ${y} Q180 ${y+8} ${180+half+4} ${y}" stroke-dasharray="${active===key?'none':'4 3'}"/></g><g fill="#24456d" font-family="system-ui,sans-serif" font-size="10"><text x="12" y="${y-7}">${label}</text><text x="348" y="${y-7}" text-anchor="end">${value(key, key==='bust'?92:key==='waist'?72:100)} см</text></g>`;
  return `<svg viewBox="0 0 360 390" role="img" aria-label="Портновский манекен по меркам, схематичный вид спереди">
   <defs><linearGradient id="dressform-body"><stop stop-color="#a6b3c2"/><stop offset=".4" stop-color="#edf0f3"/><stop offset=".65" stop-color="#d5dce4"/><stop offset="1" stop-color="#8e9eaf"/></linearGradient><linearGradient id="dressform-skirt"><stop stop-color="#17365e"/><stop offset=".45" stop-color="#426d9f"/><stop offset="1" stop-color="#18385f"/></linearGradient></defs>
   <ellipse cx="180" cy="361" rx="65" ry="7" fill="#203b5b" opacity=".08"/>
   <path d="M180 ${hy+36} V349 M180 344 L145 358 M180 344 L215 358" fill="none" stroke="#7b8da2" stroke-width="5" stroke-linecap="round"/>
   <rect x="170" y="39" width="20" height="12" rx="4" fill="#7b8da2"/>
   <path d="${torso}" fill="url(#dressform-body)" stroke="#8191a5" stroke-width="1.3"/>
   <path d="M180 53 V${hy+45} M150 73 Q180 87 210 73" fill="none" stroke="#72869e" stroke-width=".8" opacity=".5"/>
   ${garment?`<path d="M${180-w-2} ${wy} Q180 ${wy+5} ${180+w+2} ${wy} Q${180+h+3} ${hy-8} ${180+h+3} ${hy} L${180+h+6} ${hem} Q180 ${hem+8} ${180-h-6} ${hem} L${180-h-3} ${hy} Q${180-h-3} ${hy-8} ${180-w-2} ${wy} Z" fill="url(#dressform-skirt)" stroke="#18385f" stroke-width="1.5"/><path d="M180 ${wy+5} V${hem}" stroke="#b1c8e2" opacity=".5"/>`:''}
   ${!garment?ring('bust',106,b,'ГРУДЬ'):''}${ring('waist',wy,w,'ТАЛИЯ')}${ring('hip',hy,h,'БЁДРА')}
   <text x="180" y="381" text-anchor="middle" fill="#61758e" font-family="system-ui,sans-serif" font-size="10">Схематичный манекен · не проверка посадки</text>
  </svg>`;
 }
 root.bodyGuide=dressformGuide;
 if(typeof module!=='undefined')module.exports={dressformGuide};
})(typeof window!=='undefined'?window:globalThis);