/** Run with pnpm exec tsx scripts/qa/guests-welcome-media/inventory.ts. */
import { pageSchemas } from '../../../src/slices/pages/schemas';
import { describe, type FieldNode } from '../../../src/slices/pages/admin/form-model';

const rows: {page:string;path:string;accept:string;hidden:boolean;hint:string;array?:{min:number;max:number}}[]=[];
function walk(page:string,node:FieldNode,path:string[]=[],hidden=false,array?:{min:number,max:number}) {
 if(node.kind==='hidden') return walk(page,node.node,path,true,array);
 if(node.kind==='object') for(const {key,node:child} of node.fields) walk(page,child,[...path,key],hidden,array);
 if(node.kind==='array') walk(page,node.element,[...path,'[]'],hidden,{min:node.min,max:node.max});
 if(node.kind==='media') rows.push({page,path:path.join('.').replaceAll('.[]','[]'),accept:node.accept,hidden,hint:node.hint||'',...(array?{array}: {})});
}
for(const [page,schema] of Object.entries(pageSchemas))walk(page,describe(schema));
console.log(JSON.stringify(rows,null,2));
