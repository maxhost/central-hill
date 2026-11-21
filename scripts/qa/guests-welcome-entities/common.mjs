import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const helpers=process.env.WELCOME_QA_HELPERS?pathToFileURL(process.env.WELCOME_QA_HELPERS):new URL('../guests-welcome-media/common.mjs',import.meta.url);
const {browser,login,base,root,req,until,fixture,imageMeasurement}=await import(helpers.href);
export {browser,login,base,root,req,until,fixture,imageMeasurement};
export const artifact=root+'/entities';await fs.mkdir(artifact,{recursive:true});
const connection=new URL(process.env.DATABASE_URL||'');
assert.equal(connection.hostname,'welcomeqa20261121.local');assert.equal(connection.pathname,'/welcomeqa20261121');assert.equal(connection.username,'welcomeqa20261121');
export const sql=req('@neondatabase/serverless').neon(process.env.DATABASE_URL);
assert.deepEqual((await sql`select current_database() db,current_user role`)[0],{db:'welcomeqa20261121',role:'welcomeqa20261121'});
export function field(p,label){return p.locator('label').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\*?$')}).first().locator('..');}
export async function fill(p,label,value){await field(p,label).locator('input:not([type=file]):not([type=checkbox]),textarea').first().fill(value);}
export async function select(p,label,value){await field(p,label).locator('select').selectOption(value);}
export async function go(p,route){await p.goto(base+route,{waitUntil:'domcontentloaded',timeout:180000});await p.waitForTimeout(700);}
export async function upload(p,label,file,index=0){const f=typeof label==='string'?field(p,label):label;await f.locator('input[type=file]').nth(index).setInputFiles(file);await until(async()=>!(await p.getByText('Preparing…',{exact:true}).count()),'reserve');await (typeof p.waitForTimeout==='function'?p:p.page()).waitForTimeout(100);}
export async function clickSave(p,name='Save draft'){
 const btn=p.getByRole('button',{name,exact:true}).first();await until(()=>btn.isEnabled(),'save enabled');
 const ack=p.waitForResponse(r=>r.request().method()==='POST'&&r.request().headers()['next-action']&&new URL(r.url()).pathname===new URL(p.url()).pathname&&!/contentType|r2Key/.test(r.request().postData()||''),{timeout:120000});
 await btn.click();const response=await ack;assert.equal(response.status(),200);await response.finished();await p.waitForTimeout(300);
 const errs=await p.locator('[aria-invalid=true]').count();assert.equal(errs,0,await p.locator('body').innerText());
 // Publish may retain a pending router.refresh transition while the saved state is already durable.
 // A real document reload is the required persistence check and completes that transition.
 if(name==='Publish')await p.reload({waitUntil:'domcontentloaded',timeout:120000});
 else if(!new URL(p.url()).pathname.endsWith('/new'))await until(()=>btn.isEnabled(),'save settled');
}

export async function write(name,value){if(name.endsWith('-error')){await fs.mkdir(artifact+'/history',{recursive:true});for(const ext of ['json','png'])await fs.copyFile(artifact+'/'+name+'.'+ext,artifact+'/history/'+Date.now()+'-'+name+'.'+ext).catch(e=>{if(e.code!=='ENOENT')throw e;});}await fs.writeFile(artifact+'/'+name+'.json',JSON.stringify(value,null,2));}
export async function assets(ids){if(!ids.length)return [];return sql.query('select id,r2_key,width,height,mime from media_asset where id=any($1::uuid[])',[ids]);}
export async function capture(p,name,locator,ratio){const measurements=[];for(const [vp,w,h]of[['D',1440,1000],['M',390,844]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);const n=await locator.count();assert.ok(n>0,name+' no selected image');for(let i=0;i<n;i++){const l=locator.nth(i);if(!await l.isVisible())continue;const m=await imageMeasurement(l);assert.ok(m.naturalWidth>0&&m.naturalHeight>0,name+' decode');if(Math.abs(m.width/m.height-m.naturalWidth/m.naturalHeight)>0.02)assert.ok(['cover','contain'].includes(m.objectFit),name+' deformed '+JSON.stringify(m));assert.ok(['50% 50%','50% 62%'].includes(m.objectPosition),name+' off-center '+m.objectPosition);if(ratio)assert.ok(Math.abs(m.height-m.width/ratio)<=1,name+' ratio '+JSON.stringify(m));assert.equal(m.overflow,false,name+' overflow');measurements.push({vp,index:i,...m});}await locator.first().scrollIntoViewIfNeeded();await p.screenshot({path:artifact+'/'+name+'-'+vp+'.png'});}return measurements;}
export async function selected(p,keys){const escaped=keys.map(s=>s.replace(/[^a-zA-Z0-9_./-]/g,''));return p.locator('img').filter({visible:true}).and(p.locator(escaped.map(k=>'img[src*="'+k+'"],img[srcset*="'+encodeURIComponent(k)+'"]').join(',')));}
export async function state(){try{return JSON.parse(await fs.readFile(artifact+'/state.json','utf8'));}catch{return {};}}
export function imageByKey(p,key){return p.locator('img[src*="'+encodeURIComponent(key)+'"],img[src*="'+key+'"]');}
export async function publishLocales(p){for(const locale of ['ES','PT','FR']){const tab=p.getByRole('tab',{name:locale,exact:true});await until(async()=>{await tab.click();return await tab.getAttribute('aria-selected')==='true';},'selected '+locale);await clickSave(p);await clickSave(p,'Publish');}await p.getByRole('tab',{name:/^EN/}).click();}
export async function metadata(p,route,asset){await go(p,route);const result=await p.locator('meta[property^="og:image"],meta[name="twitter:image"]').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.getAttribute('property')||e.getAttribute('name'),e.content])));assert.ok(result['og:image']?.includes(asset.r2_key),route+' wrong OG '+JSON.stringify(result));assert.equal(Number(result['og:image:width']),asset.width);assert.equal(Number(result['og:image:height']),asset.height);assert.ok(result['twitter:image']?.includes(asset.r2_key));return {route,...result};}
export async function captureBackground(p,name,key){const loc=p.locator('[style*="'+encodeURIComponent(key)+'"],[style*="'+key+'"]');assert.ok(await loc.count(),name+' selected CSS background missing');const result=[];for(const [vp,w,h]of[['D',1440,1000],['M',390,844]]){await p.setViewportSize({width:w,height:h});const l=loc.first();await l.scrollIntoViewIfNeeded();const m=await l.evaluate(async e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),url=s.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];const img=new Image();img.src=url;await img.decode();return {width:r.width,height:r.height,src:url,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,backgroundSize:s.backgroundSize,backgroundPosition:s.backgroundPosition,overflow:document.documentElement.scrollWidth>innerWidth};});assert.equal(m.backgroundSize,'cover');assert.equal(m.backgroundPosition,'50% 50%');assert.ok(m.naturalWidth>0&&m.naturalHeight>0);assert.equal(m.overflow,false);result.push({vp,...m});await p.screenshot({path:artifact+'/'+name+'-'+vp+'.png'});}return result;}
