import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browser,login,sql,go,field,write,state,assets,capture,imageByKey,until,artifact,base} from './common.mjs';
const st=await state();assert.ok(st.apartment);
const b=await browser(),c=await b.newContext({viewport:{width:1440,height:1000}}),p=await login(c),pub=await c.newPage();
const result=JSON.parse(await fs.readFile(artifact+'/apartment-locales.json','utf8').catch(()=>'[]'));
let phase='initial',activeLocale='en';
p.on('dialog',async dialog=>{console.log('dialog',dialog.type());await dialog.accept();});
function stage(value){phase=value;console.log(new Date().toISOString(),value);}
async function bounded(work,label,timeout=60000){let timer;try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Timeout '+label)),timeout);})]);}finally{clearTimeout(timer);}}

async function submit(name){
 const button=p.getByRole('button',{name,exact:true}).first();await until(()=>button.isEnabled(),name+' enabled',30000);
 const ack=p.waitForResponse(r=>r.request().method()==='POST'&&r.request().headers()['next-action']&&new URL(r.url()).pathname===new URL(p.url()).pathname,{timeout:45000});
 await button.click();const response=await ack;assert.equal(response.status(),200);console.log(name,'ACK200');
 let streamFinished=true;try{const streamError=await bounded(response.finished(),name+' response stream',10000);if(streamError)throw streamError;}catch{streamFinished=false;console.log(name,'stream unfinished; independent persistence check follows');}
 await p.reload({waitUntil:'domcontentloaded',timeout:45000});const activeTab=p.getByRole('tab',{name:activeLocale.toUpperCase(),exact:true});await until(async()=>{await activeTab.click();return await activeTab.getAttribute('aria-selected')==='true';},'reopened '+activeLocale,30000);return {name,status:response.status(),streamFinished};
}
async function ownRow(locale){return (await sql`select * from apartment_locale_content where apartment_id=${st.apartment} and locale=${locale}`)[0];}
try{
 const en=(await sql`select * from apartment_locale_content where apartment_id=${st.apartment} and locale='en'`)[0];
 const content=(await sql`select data from apartment_shared_content where apartment_id=${st.apartment}`)[0].data.content,asset=(await assets([content.cover_media_id]))[0];
 stage('open editor');await go(p,'/admin/buildings/'+st.building+'/apartments/'+st.apartment);
 for(const locale of ['es','pt','fr']){
  if(result.some(r=>r.locale===locale))continue;
  activeLocale=locale;stage(locale+' select');const tab=p.getByRole('tab',{name:locale.toUpperCase(),exact:true});
  await until(async()=>{await tab.click();return await tab.getAttribute('aria-selected')==='true';},'selected '+locale);
  const nameInput=field(p,'Name').locator('input'),originalName=(await ownRow(locale)).published?.content.name??await nameInput.inputValue(),acks=[];
  for(const [variant,value]of [['edited',originalName+' QA locale check'],['restored',originalName]]){
   stage(locale+' '+variant+' name');await field(p,'Name').locator('input').fill(value);
   stage(locale+' '+variant+' save');acks.push(await submit('Save draft'));
   assert.equal((await ownRow(locale)).draft.content.name,value);
   stage(locale+' '+variant+' publish');acks.push(await submit('Publish'));
   assert.equal((await ownRow(locale)).published.content.name,value);
  }
  assert.deepEqual((await sql`select * from apartment_locale_content where apartment_id=${st.apartment} and locale='en'`)[0],en);
  stage(locale+' public navigation');await go(pub,'/'+locale+'/buildings/welcome-qa-entity-building');
  stage(locale+' decode measure screenshot');const measurements=await bounded(capture(pub,'E04-locale-'+locale,imageByKey(pub,asset.r2_key),4/3),'public image capture '+locale);
  result.push({locale,asset,measurements,englishRowExact:true,runtime:base,acks,localNameRestored:true});await write('apartment-locales',result);stage(locale+' pass');
 }
}catch(e){await write('apartment-locales-error',{message:e.message,phase,url:p.url(),publicUrl:pub.url(),body:await p.locator('body').innerText({timeout:3000}).catch(()=>'<unavailable>')});throw e;}
finally{await b.close();}
