const assert=require('node:assert/strict'),fs=require('fs');
const P=require('./dynamic-pattern');
let previous;
for(const v of [{waist:72,hip:100,hipHeight:20.8,length:61.5},{waist:76,hip:100,hipHeight:20.8,length:61.5},{waist:80,hip:108,hipHeight:23,length:70}]){
 const d=P.build(v),a=P.artwork(d),t=P.pages(a,'a4'),bytes=P.pdf(a,t);
 assert(Math.abs(d.geometry.audit.waist*2-(v.waist+2))<.001);
 assert(Math.abs(d.geometry.audit.sideError)<.001);
 assert(a.height>v.length*10);
 assert((t.at(-1).x+190)>=a.width && (t.at(-1).y+277)>=a.height);
 const content=Buffer.from(bytes).toString();assert(content.includes(`/Count ${t.length}`));
 assert(content.includes('BUMBARI / TOILE'));
 assert(!content.includes('MUELLER /'));
 assert(content.includes('SOURCE: ATELIER 2001, PDF 5-7'));
 assert(content.includes(d.reference?'BOOK NUMERIC CASE / CONTOURS REQUIRE VERIFICATION':'EXPERIMENTAL DART DISTRIBUTION / NOT BOOK-VERIFIED'));
 if(previous)assert.notEqual(content,previous);previous=content;

 console.log('PASS',v.waist,v.hip,v.length,t.length,'pages');
}
assert.throws(()=>P.build({waist:70,hip:140,hipHeight:22,length:65}));
console.log('PASS unsupported proportions blocked');
