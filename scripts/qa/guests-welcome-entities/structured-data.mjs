import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {browser,login,sql,go,write,assets,artifact} from './common.mjs';
const b=await browser(),c=await b.newContext(),p=await login(c),results=JSON.parse(await fs.readFile(artifact+'/site-structured-data.json','utf8').catch(()=>'[]'));
try{const id=(await sql`select default_og_image_media_id id from company_settings limit 1`)[0].id,asset=(await assets([id]))[0];
const routes=['','/owners','/about','/guests','/real-estate','/buildings','/services','/guides','/blog','/privacy-policy','/cookies-policy','/complaints-book','/buildings/welcome-qa-entity-building','/services/welcome-qa-entity-service','/guides/welcome-qa-entity-city/welcome-qa-entity-guide','/blog/welcome-qa-entity-post'];
for(const locale of ['en','es','pt','fr'])for(const suffix of routes){const route='/'+locale+suffix;if(results.some(r=>r.route===route&&r.asset===asset.id))continue;await go(p,route);const raw=await p.locator('script[type="application/ld+json"]').allTextContents();const site=raw.map(s=>JSON.parse(s)).flat().filter(j=>['Organization','LodgingBusiness'].includes(j['@type']));assert.equal(site.length,2,route+' site structured data');assert.ok(site.every(j=>String(j.logo||j.image||'').includes(asset.r2_key)),route+' selected default social image');results.push({route,asset:asset.id,structuredData:site});await write('site-structured-data',results);console.log('site JSONLD',route,'pass');}
}catch(e){await write('structured-data-error',{message:e.message,url:p.url()});throw e;}finally{await b.close();}
