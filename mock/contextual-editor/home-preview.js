/* Concept bridge only: no network, credentials, storage or CMS writes. */
const selectable = () => [...document.querySelectorAll('[data-edit]')];
function select(id, reveal=false){
 selectable().forEach(el=>el.classList.toggle('selected',el.dataset.edit===id));
 const item=selectable().find(el=>el.dataset.edit===id);
 if(reveal&&item)item.scrollIntoView({block:'center',behavior:'instant'});
}
document.addEventListener('click',e=>{const el=e.target.closest('[data-edit]');if(!el)return;e.preventDefault();e.stopPropagation();select(el.dataset.edit);parent.postMessage({type:'concept:select',id:el.dataset.edit},location.origin==='null'?'*':location.origin)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-edit]')){e.preventDefault();e.target.click()}});
window.addEventListener('message',e=>{
 if(e.source!==parent||(location.origin!=='null'&&e.origin!==location.origin))return;
 const m=e.data;if(m?.type==='concept:select'){select(m.id,m.reveal);return}
 if(m?.type!=='concept:render'||!m.values)return;
 document.documentElement.lang=m.locale;
 document.querySelectorAll('[data-copy]').forEach(el=>{if(typeof m.values[el.dataset.copy]==='string')el.textContent=m.values[el.dataset.copy]});
 if(m.image){document.querySelector('.hero-backdrop').style.backgroundImage=`linear-gradient(90deg,#1e1a16c9 0%,#1e1a1673 56%,#1e1a1626 100%), url("${m.image}")`}
 select(m.selection);
});
parent.postMessage({type:'concept:ready'},location.origin==='null'?'*':location.origin);
