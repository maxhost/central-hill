import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browser,login,artifact,sql,field,go,upload,clickSave,write,state,fixture,assets,capture} from './common.mjs';
const st=await state(),b=await browser(),c=await b.newContext({viewport:{width:1440,height:1000}});await login(c);
const ratios=[['3-2',2250,1500],['2-3',1000,1500],['1-1',1200,1200],['16-9',1600,900]];
const result=JSON.parse(await fs.readFile(artifact+'/reference-results.json','utf8').catch(()=> '[]'));
try{for(const [kind,id,label,column,caseId]of[['cities',st.city,'Hero image','hero_media_id','E18'],['authors',st.author,'Avatar image','avatar_media_id','E17']]){
 assert.ok(id,'missing '+kind);const p=await c.newPage();
 for(const [name,w,h]of ratios){if(result.some(r=>r.case===caseId&&r.ratio===name))continue;await go(p,'/admin/'+kind+'/'+id);const file=await fixture('entity-reference-'+name,[w,h]);await upload(p,label,file);await clickSave(p,'Save');const table=kind==='cities'?'city':'author';const row=(await sql.query(`select ${column} id from ${table} where id=$1`,[id]))[0];const asset=(await assets([row.id]))[0];assert.deepEqual([asset.width,asset.height],[w,h]);await p.reload({waitUntil:'domcontentloaded'});const image=field(p,label).locator('img').first();await image.waitFor();const metrics=await capture(p,caseId+'-'+name,image);result.push({case:caseId,kind,ratio:name,asset,metrics,publicDestination:'none in current route renderers; editor persistence verified'});await write('reference-results',result);console.log(caseId,name,'pass');}
 await p.close();
}}catch(e){await write('reference-error',{message:e.message});throw e;}finally{await b.close();}
