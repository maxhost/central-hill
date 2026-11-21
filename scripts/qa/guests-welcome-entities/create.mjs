import {browser,login,artifact,sql,fill,select,go,upload,clickSave,write,state,fixture} from './common.mjs';
const st=await state(), b=await browser(),c=await b.newContext({viewport:{width:1440,height:1000}}),p=await login(c);
if(!st.building){st.building=(await sql`select id from building where slug='welcome-qa-entity-building'`)[0]?.id; if(st.building)await write('state',st);}
const file=await fixture('entity-3-2',[2250,1500]);
async function saveState(){await write('state',st);}
try{
if(!st.city){await go(p,'/admin/cities/new');await fill(p,'Name EN','Welcome QA Entity City');await fill(p,'Slug','welcome-qa-entity-city');await select(p,'Status','published');await upload(p,'Hero image',file);await clickSave(p,'Save');st.city=(await sql`select id from city where slug='welcome-qa-entity-city'`)[0]?.id;await saveState();console.log('city',st.city);}
if(!st.author){await go(p,'/admin/authors/new');await fill(p,'Name EN','Welcome QA Entity Author');await fill(p,'Slug','welcome-qa-entity-author');await select(p,'Status','published');await upload(p,'Avatar image',file);await clickSave(p,'Save');st.author=(await sql`select id from author where slug='welcome-qa-entity-author'`)[0]?.id;await saveState();console.log('author',st.author);}
if(!st.building){await go(p,'/admin/buildings/new');await fill(p,'Name','Welcome QA Entity Building');await fill(p,'Teaser','Known-ratio upload fixture building');await fill(p,'Slug','welcome-qa-entity-building');await select(p,'City',st.city);await fill(p,'Street address','QA Fixture Street 1');await upload(p,'Cover image',file);await clickSave(p);st.building=(await sql`select id from building where slug='welcome-qa-entity-building'`)[0]?.id;await saveState();console.log('building',st.building);await clickSave(p,'Publish');}
if(st.building){await go(p,'/admin/buildings/'+st.building);await fill(p,'Street address','QA Fixture Street 1');await p.getByRole('checkbox',{name:'Featured in portfolio'}).check();await clickSave(p);await clickSave(p,'Publish');}
await write('create-complete',st);
}catch(e){await write('create-error',{message:e.message,url:p.url(),body:await p.locator('body').innerText().catch(()=>'<body unavailable>')});await p.screenshot({path:artifact+'/create-error.png'});throw e;}finally{await b.close();}
