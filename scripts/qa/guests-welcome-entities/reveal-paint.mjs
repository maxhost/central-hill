import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {browser,login,sql,state,assets,go,imageByKey,until,artifact,write,base} from './common.mjs';
const st=await state(),ids=Object.values(st),b=await browser(),c=await b.newContext({reducedMotion:'no-preference'}),p=await login(c),results=JSON.parse(await fs.readFile(artifact+'/reveal-paint-progress.json','utf8').catch(()=>'[]')),mutations=[];
p.on('request',r=>{if(new URL(r.url()).origin===base&&!['GET','HEAD','OPTIONS'].includes(r.method()))mutations.push({method:r.method(),url:r.url()});});
async function snapshot(){
 const columns=await sql`select table_name,column_name from information_schema.columns where table_schema='public' and column_name in ('id','building_id','apartment_id','service_id','guide_id','post_id','author_id','city_id','entity_id') order by table_name,column_name`;
 const tables=new Map();for(const row of columns){if(!tables.has(row.table_name))tables.set(row.table_name,[]);tables.get(row.table_name).push(row.column_name);}
 const result={};for(const [table,cols]of tables){assert.match(table,/^[a-z_]+$/);const where=cols.map(col=>`"${col}"::text=any($1::text[])`).join(' or '),rows=await sql.query(`select row_to_json(t)::text value from "${table}" t where ${where} order by row_to_json(t)::text`,[ids]);if(rows.length)result[table]={rows:rows.length,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};}
 const media=await sql`select row_to_json(t)::text value from media_asset t where r2_key like '%/entity-%' order by id`;
 result.media_asset={rows:media.length,sha256:createHash('sha256').update(JSON.stringify(media)).digest('hex')};return result;
}
async function paint(locator){return locator.evaluate(e=>{const r=e.getBoundingClientRect(),chain=[];for(let a=e;a;a=a.parentElement){const s=getComputedStyle(a);chain.push({tag:a.tagName,reveal:a.getAttribute('data-reveal-label'),opacity:Number(s.opacity),visibility:s.visibility,display:s.display,transform:s.transform});}return {width:r.width,height:r.height,x:r.x,y:r.y,scrollX,scrollY,viewport:{width:innerWidth,height:innerHeight},chain};});}
async function capture(target,name,kind,key){
 await target.scrollIntoViewIfNeeded({timeout:30000});
 const rect=await target.boundingBox(),viewport=p.viewportSize();assert.ok(rect);
 await p.mouse.move(5,Math.min(200,viewport.height-20));await p.mouse.wheel(0,rect.y+rect.height/2-viewport.height/2);await p.waitForTimeout(200);
 await until(async()=>{const m=await paint(target);return m.chain.every(a=>a.opacity>=0.999&&a.visibility==='visible'&&a.display!=='none');},name+' painted ancestors',20000);
 await target.evaluate(async(e,kind)=>{const img=kind==='img'?e:new Image();if(kind!=='img'){const url=getComputedStyle(e).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];if(!url)throw Error('Missing CSS URL');img.src=url;}await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout')),15000))]);if(!(img.naturalWidth>0&&img.naturalHeight>0))throw Error('Undecoded selected asset');},kind);
 await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const first=await paint(target);await p.waitForTimeout(150);await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const second=await paint(target);
 for(const k of ['width','height','x','y','scrollX','scrollY'])assert.ok(Math.abs(first[k]-second[k])<0.5,name+' unstable '+k);
 assert.ok(second.chain.every(a=>a.opacity>=0.999&&a.visibility==='visible'&&a.display!=='none'));assert.ok(second.width>0&&second.height>0);assert.ok(second.y<second.viewport.height&&second.y+second.height>0,name+' outside viewport');
 await p.screenshot({path:artifact+'/paint-'+name+'.png',timeout:30000});await target.screenshot({path:artifact+'/paint-'+name+'-clip.png',timeout:30000});
 const final=await paint(target);for(const k of ['width','height','x','y','scrollX','scrollY'])assert.ok(Math.abs(second[k]-final[k])<0.5,name+' screenshot scroll changed '+k);assert.ok(final.chain.every(a=>a.opacity>=0.999),name+' changed opacity during capture');return {name,kind,key,first,second,afterCapture:final};
}
let before;
try{
 before=await snapshot();
 const building=(await sql`select data from building_shared_content where building_id=${st.building}`)[0].data.content.cover_media_id,service=(await sql`select data from service_shared_content where service_id=${st.service}`)[0].data.content.cover_media_id,guide=(await sql`select published from guide_locale_content where guide_id=${st.guide} and locale='en'`)[0].published.content.hero_media_id;
 const current=await assets([building,service,guide]),key=id=>current.find(a=>a.id===id).r2_key;
 const cases=[['home-building','/en',building,'img'],['guests-building','/en/guests',building,'img'],['guests-service','/en/guests',service,'css'],['guests-guide','/en/guests',guide,'css'],['services-listing','/en/services',service,'img'],['home-service','/en',service,'img']];
 for(const [name,route,id,kind]of cases)for(const [vp,width,height]of [['D',1440,1000],['M',390,844]]){
  if(results.some(r=>r.name===name+'-'+vp&&r.asset.id===id))continue;
  await p.setViewportSize({width,height});await go(p,route);const mediaKey=key(id),target=kind==='img'?imageByKey(p,mediaKey).filter({visible:true}).first():p.locator('[style*="'+mediaKey+'"],[style*="'+encodeURIComponent(mediaKey)+'"]').first();assert.equal(await target.count(),1,name+' current selected asset');
  results.push({runtime:base,route,asset:current.find(a=>a.id===id),vp,...await capture(target,name+'-'+vp,kind,mediaKey)});await write('reveal-paint-progress',results);console.log(name,vp,'paint pass');
 }
 assert.equal(results.length,12);for(const result of results)for(const sample of [result.first,result.second,result.afterCapture]){assert.ok(sample.chain.every(a=>a.opacity>=0.999&&a.visibility==='visible'&&a.display!=='none'));for(const k of ['width','height','x','y','scrollX','scrollY'])assert.ok(Math.abs(sample[k]-result.first[k])<0.5,result.name+' retained evidence unstable '+k);}
 const after=await snapshot();assert.deepEqual(after,before,'own entity source rows changed');assert.deepEqual(mutations,[],'read-only public browser issued mutations');await write('reveal-paint-results',{status:'pass',runtime:base,targets:results.length,results,conservation:{before,after,exact:true},mutations});
}catch(e){await write('reveal-paint-error',{message:e.message,url:p.url(),results,ownSourceBefore:before,reveals:await p.locator('[data-reveal]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {label:e.getAttribute('data-reveal-label'),opacity:s.opacity,height:r.height,top:r.top,viewport:innerHeight};})).catch(()=>[]),body:await p.locator('body').innerText({timeout:3000}).catch(()=>'<unavailable>')});await p.screenshot({path:artifact+'/reveal-paint-error.png',timeout:5000}).catch(()=>{});throw e;}finally{await b.close();}
