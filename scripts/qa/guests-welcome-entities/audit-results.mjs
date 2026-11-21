import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {artifact,write,sql,state} from './common.mjs';
const counts={'reference-results':8,'settings-results':4,'building-results':6,'service-results':5,'itinerary-retests':15,'guide-results':6,'guide-templates':9,'apartment-results':4,'post-results':5,'gallery-results':21,'cover-fallback-results':16,'apartment-locales':3,'site-structured-data':64},data={};
for(const [name,count]of Object.entries(counts)){data[name]=JSON.parse(await fs.readFile(artifact+'/'+name+'.json','utf8'));assert.equal(data[name].length,count,name);}
const ratios={'settings-results':['og','3-2','2-3','1-1'],'building-results':['16-9','3-2','2-3','1-1','4-3','og'],'service-results':['4-3','3-2','2-3','1-1','og'],'guide-results':['16-9','4-3','3-2','2-3','1-1','og'],'post-results':['4-3','3-2','2-3','1-1','og'],'apartment-results':['4-3','3-2','2-3','1-1']};
for(const [name,expected]of Object.entries(ratios))assert.deepEqual(data[name].map(r=>r.ratio).sort(),expected.sort(),name+' source ratios');
for(const kind of ['authors','cities'])assert.deepEqual(data['reference-results'].filter(r=>r.kind===kind).map(r=>r.ratio).sort(),['3-2','2-3','1-1','16-9'].sort());
function inspect(value,key){if(Array.isArray(value)){if(key==='measurements')assert.ok(value.length,'empty destination evidence');const viewports=value.filter(v=>v?.vp).map(v=>v.vp);if(viewports.length)assert.deepEqual([...new Set(viewports)].sort(),['D','M']);for(const entry of value)inspect(entry);return;}if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))inspect(v,k);}
for(const value of Object.values(data))inspect(value);
assert.deepEqual(data['guide-templates'].map(r=>r.template).sort(),['landing','eat','beaches','events','secrets','families','groups','travellers','custom'].sort());
for(const kind of ['E02','E06','E09/E11'])assert.deepEqual(data['gallery-results'].filter(r=>r.case===kind).map(r=>r.count).sort(),[1,2,3,4,5,6]);
assert.equal(data['gallery-results'].filter(r=>r.case==='E12-repeated').length,2);
assert.equal(data['gallery-results'].filter(r=>r.case==='E07-fallback'&&r.restoredThroughUi).length,1);
for(const kind of ['building','service','post']){const rows=data['cover-fallback-results'].filter(r=>r.kind===kind);assert.equal(rows.length,kind==='building'?6:5);assert.ok(rows.every(r=>r.metadata.length===4));}
assert.ok(data['apartment-locales'].every(r=>r.englishRowExact));
assert.deepEqual(data['apartment-locales'].map(r=>r.locale).sort(),['es','fr','pt']);
const fixtureState=await state(),apartmentNames=await sql`select locale,published->'content'->>'name' name from apartment_locale_content where apartment_id=${fixtureState.apartment}`;
assert.equal(apartmentNames.length,4);assert.ok(apartmentNames.every(r=>r.name==='Welcome QA Entity Apartment'),'temporary local copy restored');
const es=JSON.parse(await fs.readFile(artifact+'/post-es-own-body.json','utf8'));assert.equal(es.englishFullRowExact,true);assert.notEqual(es.enId,es.esId);
const created=JSON.parse(await fs.readFile(artifact+'/post-new-route.json','utf8'));assert.equal(created.createdThrough,'/admin/posts/new');assert.equal(created.assets.length,3);
for(const row of data['post-results']){const featured=row.destinations.find(d=>d.dest==='featured');assert.ok(featured.measurements.some(m=>m.vp==='D'&&m.width>600&&m.height>=340),'actual featured hero geometry');}
const bytes=JSON.parse(await fs.readFile(artifact+'/asset-bytes-audit.json','utf8'));assert.ok(bytes.selectedAssets>150);
await write('completion-audit',{status:'pass',primaryCounts:counts,primaryGroups:Object.values(counts).reduce((a,b)=>a+b,0),postExtraGroups:2,selectedAssets:bytes.selectedAssets,apartmentNames,legacyE15:'N/A: no mounted route',activeEntityUploadTypes:18});console.log('Entity completion audit PASS',bytes.selectedAssets,'actual assets');
