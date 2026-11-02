const assert=require('node:assert/strict');
const {ventArtwork}=require('./vent-export');
const P=require('./dynamic-pattern');
for(const width of [4,5,7]){
 const art=ventArtwork({length:50,hipHeight:20.8,width,ventLength:16});
 const text=Buffer.from(P.pdf(art,P.pages(art,'a4'))).toString();
 assert(text.includes('NOT COMPLETE PATTERN PIECES'));
 assert(text.includes('RIGHT / CENTRE BACK EDGE ONLY'));
 assert(text.includes('LEFT / CENTRE BACK EDGE ONLY'));
 assert(text.includes('100 x 100 mm'));
 const square=art.cmd.filter(c=>c[0]==='L'&&c[2]===565&&c[4]===565);
 assert(square.some(c=>Math.abs(c[3]-c[1])===100),'100 mm control edge');
 const tiles=P.pages(art,'a4'),last=tiles.at(-1);
 assert(last.x+190>=art.width&&last.y+277>=art.height);
}
assert.throws(()=>ventArtwork({length:30,hipHeight:20.8,width:5,ventLength:16}));
console.log('Vent PDF: mirrored edge labels, 1:1 square, coverage and unsafe-input rejection OK');