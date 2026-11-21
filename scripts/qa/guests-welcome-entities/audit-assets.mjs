import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {artifact,root,req,write} from './common.mjs';
const names=['reference-results','settings-results','building-results','service-results','itinerary-retests','guide-results','guide-templates','post-results','apartment-results','gallery-results','cover-fallback-results','post-es-own-body','post-new-route'];const rows=new Map();
function collect(value){if(Array.isArray(value))return value.forEach(collect);if(!value||typeof value!=='object')return;if(value.id&&value.r2_key&&value.mime)rows.set(value.id,value);Object.values(value).forEach(collect);}
for(const name of names){const value=JSON.parse(await fs.readFile(artifact+'/'+name+'.json','utf8'));collect(value);}
const result=[],sharp=req('sharp'),entries=[...rows.values()];let index=0;
async function worker(){while(index<entries.length){const row=entries[index++];assert.match(row.r2_key,/^[0-9a-f-]+\/entity-[a-z0-9-]+\.png$/i);const fixture=await fs.readFile(path.join(root,'fixtures',path.basename(row.r2_key)));const response=await fetch('http://127.0.0.1:9092/welcome-qa/'+row.r2_key);assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer()),expected=createHash('sha256').update(fixture).digest('hex'),actual=createHash('sha256').update(bytes).digest('hex');assert.equal(actual,expected,row.r2_key+' selected bytes');const meta=await sharp(bytes).metadata();assert.deepEqual([meta.width,meta.height],[row.width,row.height]);assert.equal(row.mime,'image/png');result.push({id:row.id,key:row.r2_key,sha256:actual,width:meta.width,height:meta.height,orientation:meta.orientation??null,bytes:bytes.length});}}
await Promise.all(Array.from({length:4},worker));await write('asset-bytes-audit',{selectedAssets:result.length,results:result.sort((a,b)=>a.key.localeCompare(b.key))});console.log('Actual selected bytes/metadata verified',result.length);
