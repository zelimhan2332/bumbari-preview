const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert(html.includes('fetch("./index.html?check="'));
assert(!html.includes('fetch("/?check="'));
for(const match of html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"/g)){
 assert(fs.existsSync(path.join(__dirname,match[1])),match[1]);
}
console.log('Pages subpath and script assets: OK');