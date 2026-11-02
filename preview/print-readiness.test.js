const assert=require('node:assert/strict');
const {printReadiness}=require('./print-readiness');
assert(printReadiness({reference:true}).allowed);
assert(!printReadiness({reference:false}).allowed);
assert(printReadiness({reference:false,experimentalConsent:true}).allowed);
for(const reference of [true,false]){
 assert(!printReadiness({reference,experimentalConsent:true,vent:{width:5,ventLength:16}}).allowed);
 assert(!printReadiness({reference,experimentalConsent:true,modeling:{hemReduction:1}}).allowed);
}
assert(printReadiness({reference:true,modeling:{hemReduction:0}}).allowed);
assert.equal(printReadiness({reference:true}).cutReady,false);
console.log('Print readiness: unfinished options never silently omitted, experimental consent required OK');