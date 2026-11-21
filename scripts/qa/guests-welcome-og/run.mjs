import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {browser,login,root,base,section,saveDraft,publish,fixture,until} from '../guests-welcome-media/common.mjs';
const req=createRequire(new URL('../../../package.json',import.meta.url));
const {neon}=req('@neondatabase/serverless');
const u=new URL(process.env.DATABASE_URL);assert.equal(u.hostname,'welcomeqa20261121.local');assert.equal(u.username,'welcomeqa20261121');assert.equal(u.pathname,'/welcomeqa20261121');const sql=neon(u.href);
assert.deepEqual((await sql`select current_database() db,current_user role`)[0],{db:'welcomeqa20261121',role:'welcomeqa20261121'});
const routes={home:'',owners:'owners',real_estate:'real-estate',about:'about',guest:'guests',blog:'blog',guides:'guides',buildings:'buildings',services:'services',privacy_policy:'privacy-policy',cookies_policy:'cookies-policy',complaints_book:'complaints-book'};
const requested=process.argv.slice(2);assert.ok(requested.length);assert.ok(requested.every(k=>Object.hasOwn(routes,k)));
const out=root+'/og';await fs.mkdir(out,{recursive:true});
const b=await browser();const context=await b.newContext({viewport:{width:1440,height:1000}});const p=await login(context);p.setDefaultTimeout(30000);p.setDefaultNavigationTimeout(90000);const errors=[];p.on('pageerror',e=>errors.push(e.message));const records=await fs.readFile(out+'/results.json','utf8').then(text=>JSON.parse(text).records).catch(()=>[]);
const ratios=[['recommended',[1200,630]],['3-2',[1200,800]],['2-3',[600,900]],['1-1',[800,800]]];
async function row(key){return (await sql`select * from page_locale_content where page_key=${key} and locale='en'`)[0];}
try{
for(const key of requested){
 const targetsBefore=(await sql`select locale,published->'content' content from page_locale_content where page_key=${key} and locale<>'en' order by locale`).filter(row=>row.content!==null);
 await p.goto(base+'/admin/pages/'+key,{waitUntil:'domcontentloaded',timeout:90000});
 // Legal QA text belongs only to the isolated fixture document and is authored through its controls.
 if(['privacy_policy','cookies_policy','complaints_book'].includes(key)&&!(await row(key))?.published){
  await section(p,'title');await p.locator(`#page-field-${key}-title`).fill('Welcome media QA '+key);
  await section(p,'body');await p.locator('[data-page-rich-text][contenteditable=true]').fill('Isolated media upload verification document.');
 }
 for(const [ratio,dims] of ratios){
  if(records.some(record=>record.key===key&&record.ratio===ratio&&record.result==='pass')){console.log('RESUME PASS',key,ratio);continue;}
  console.log('OG START',key,ratio);
  await p.getByRole('button',{name:/^SEO EN$/}).click();
  const file=await fixture(`og-${key}-${ratio}`,dims);const before=await row(key);
  await p.locator('input[type=file]').first().setInputFiles(file);
  await until(async()=>await p.locator('img[src^="blob:"]').count(),'OG local selection');
  await saveDraft(p);
  const saved=await until(async()=>{const r=await row(key);return r?.revision>(before?.revision||0)&&r.draft?.ogImageMediaId?r:null;},'OG draft persist');
  const id=saved.draft.ogImageMediaId;
  const privateCheck=await context.newPage();const privateResponse=await privateCheck.goto(base+'/en'+(routes[key]?'/'+routes[key]:''),{waitUntil:'domcontentloaded',timeout:90000});await privateResponse.finished();assert.equal(await privateCheck.locator(`meta[property="og:image"][content*="${id}"]`).count(),0,'Unpublished OG must stay private');await privateCheck.close();
  const asset=(await sql`select id,r2_key,mime,width,height from media_asset where id=${id}::uuid`)[0];
  assert.equal(asset.width,dims[0]);assert.equal(asset.height,dims[1]);assert.equal(asset.mime,'image/png');
  const raw=await fetch('http://127.0.0.1:9092/welcome-qa/'+asset.r2_key);assert.equal(raw.status,200);const sharp=req('sharp');const meta=await sharp(Buffer.from(await raw.arrayBuffer())).metadata();assert.equal(meta.width,dims[0]);assert.equal(meta.height,dims[1]);
  await p.reload({waitUntil:'domcontentloaded',timeout:90000});await p.getByRole('button',{name:/^SEO EN$/}).click();
  await until(()=>p.locator('img').evaluateAll((es,id)=>es.some(e=>e.src.includes(id)),id),'OG reloaded selection');
  await publish(p);
  const published=await until(async()=>{const r=await row(key);return r?.published?.ogImageMediaId===id&&!r.draft?r:null;},'OG publication');
  assert.deepEqual((await sql`select locale,published->'content' content from page_locale_content where page_key=${key} and locale<>'en' order by locale`).filter(row=>row.content!==null),targetsBefore,'EN OG preserves all target documents and SEO');
  const destinations=[];
  for(const locale of ['en','es','pt','fr']){
   const route=base+'/'+locale+(routes[key]?'/'+routes[key]:'');const pub=await context.newPage();const response=await pub.goto(route,{waitUntil:'domcontentloaded',timeout:90000});assert.equal(response.status(),200,route);
   await until(()=>pub.locator('meta[property="og:image"]').getAttribute('content').then(value=>value?.includes(id)),'streamed OG metadata '+route);
   const tags=await pub.locator('meta[property^="og:image"],meta[name^="twitter:image"]').evaluateAll(es=>es.map(e=>({key:e.getAttribute('property')||e.getAttribute('name'),value:e.content})));
   assert.ok(tags.some(t=>t.key==='og:image'&&t.value.includes(id)),JSON.stringify({route,id,tags}));
   await until(()=>pub.locator('meta[name="twitter:image"]').getAttribute('content').then(value=>value?.includes(id)),'streamed Twitter metadata');
   assert.ok(tags.some(t=>t.key==='twitter:image'&&t.value.includes(id)),'Twitter selected image '+route);
   const width=tags.find(t=>t.key==='og:image:width')?.value,height=tags.find(t=>t.key==='og:image:height')?.value;
   assert.equal(Number(width),dims[0]);assert.equal(Number(height),dims[1]);
   destinations.push({locale,route,status:response.status(),tags});await pub.close();
  }
  await p.screenshot({path:out+`/${key}-${ratio}-desktop.png`});await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+`/${key}-${ratio}-mobile.png`});await p.setViewportSize({width:1440,height:1000});
  records.push({key,ratio,dims,id,asset,revision:published.revision,destinations,result:'pass'});await fs.writeFile(out+'/results.json',JSON.stringify({records,errors,complete:false},null,2));console.log(JSON.stringify({key,ratio,id,result:'pass'}));
 }
 await fs.writeFile(out+`/${key}-complete.json`,JSON.stringify(records.filter(r=>r.key===key),null,2));
}
await fs.writeFile(out+'/results-'+requested.join('-')+'.json',JSON.stringify({records,errors,complete:true},null,2));
} catch(error){await fs.writeFile(out+'/failure-'+requested.join('-')+'.json',JSON.stringify({records,errors,error:error.stack},null,2));await p.screenshot({path:out+'/failure.png'});throw error;}finally{await b.close();}
