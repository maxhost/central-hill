import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const req=createRequire(new URL('../../../package.json',import.meta.url));
const root=process.env.WELCOME_QA_ROOT||'/private/tmp/central-hill-guests-welcome';
await fs.mkdir(root+'/fixtures',{recursive:true});
const ratios={'3-2':[900,600],'2-3':[600,900],'1-1':[600,600],'16-9':[960,540]};
for(const [name,[w,h]] of Object.entries(ratios)){
 const animation={v:'5.7.4',fr:30,ip:0,op:90,w,h,nm:`Welcome-${name}`,ddd:0,assets:[],layers:[{ddd:0,ind:1,ty:4,nm:'Moving centre marker',sr:1,ks:{o:{a:0,k:100},r:{a:0,k:0},p:{a:1,k:[{t:0,s:[w*.3,h*.5,0],e:[w*.7,h*.5,0],o:{x:.3,y:0},i:{x:.7,y:1}},{t:89,s:[w*.7,h*.5,0]}]},a:{a:0,k:[0,0,0]},s:{a:0,k:[100,100,100]}},ao:0,shapes:[{ty:'el',p:{a:0,k:[0,0]},s:{a:0,k:[w*.3,w*.3]},nm:'Circle'},{ty:'fl',c:{a:0,k:[.05,.5,.3,1]},o:{a:0,k:100},r:1,nm:'Green'}],ip:0,op:90,st:0,bm:0}]};
 await fs.writeFile(root+`/fixtures/lottie-${name}.json`,JSON.stringify(animation));
}
// The real dotLottie archive contains a valid v1 manifest and an animation.
execFileSync('python3',['-c',`import pathlib,zipfile,json\nr=pathlib.Path(${JSON.stringify(root+'/fixtures')})\nfor n in ['3-2','2-3','1-1','16-9']:\n with zipfile.ZipFile(r/('lottie-'+n+'.lottie'),'w',zipfile.ZIP_DEFLATED) as z:\n  z.writestr('manifest.json',json.dumps({'version':'1.0','generator':'Central Hill QA','animations':[{'id':'welcome','loop':True}]}))\n  z.writestr('animations/welcome.json',(r/('lottie-'+n+'.json')).read_bytes())`]);
const sharp=req('sharp');
const w=600,h=400;const pixels=Buffer.alloc(w*h*2*3);for(let y=0;y<h*2;y++)for(let x=0;x<w;x++){let color=y<h?[220,40,70]:[30,130,90];if(Math.abs(x-w/2)<30||Math.abs(y%h-h/2)<30)color=[20,50,150];const i=(y*w+x)*3;pixels.set(color,i);}
await sharp(pixels,{raw:{width:w,height:h*2,channels:3,pageHeight:h}}).webp({loop:0,delay:[250,250]}).toFile(root+'/fixtures/animated-3-2.webp');
const meta=await sharp(root+'/fixtures/animated-3-2.webp',{animated:true}).metadata();if(meta.pages!==2)throw Error('Animated fixture lost frames');
const {chromium}=req('playwright');const browser=await chromium.launch({headless:true});const p=await browser.newPage();
for(const [ext,mime] of [['webm','video/webm;codecs=vp8'],['mp4','video/mp4;codecs=avc1.42001E']]){
 const result=await p.evaluate(async mime=>{if(!MediaRecorder.isTypeSupported(mime))return {unsupported:mime};const c=document.createElement('canvas');c.width=900;c.height=600;const ctx=c.getContext('2d');const stream=c.captureStream(30),chunks=[];const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:600000});recorder.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start();const start=performance.now();await new Promise(resolve=>{function draw(){const t=(performance.now()-start)/2000;ctx.fillStyle='#d0a75b';ctx.fillRect(0,0,900,600);ctx.strokeStyle='#df3050';ctx.lineWidth=25;ctx.strokeRect(12,12,876,576);ctx.fillStyle='#207b53';ctx.beginPath();ctx.arc(200+t*500,300,80,0,Math.PI*2);ctx.fill();if(t<1)requestAnimationFrame(draw);else resolve();}draw();});recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const buffer=new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer());return {bytes:Array.from(buffer),mime};},mime);
 if(result.unsupported)throw Error('Browser fixture codec unsupported '+mime);
 await fs.writeFile(root+`/fixtures/loop-3-2.${ext}`,Buffer.from(result.bytes));
}
await browser.close();console.log('Real Lottie JSON/dotLottie4ratios, animated WebP2frames, MP4/WebM fixtures generated.');
