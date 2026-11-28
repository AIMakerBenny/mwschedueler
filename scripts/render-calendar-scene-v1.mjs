// Deterministic 1280x720 pre-rendered mountain lake, with no runtime renderer or dependency.
// Pass R: sculpted alpine relief, directional ridges, warm atmospheric light and shore reflections.
// --check validates decoded pixels; --write regenerates using standard Node zlib.
import {readFileSync,writeFileSync} from 'node:fs';
import {inflateSync,deflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
function render(){
 const W=1280,H=720,horizon=.66;
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
 function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
 function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),a=sm(x-X),b=sm(y-Y);return mix(mix(hash(X,Y),hash(X+1,Y),a),mix(hash(X,Y+1),hash(X+1,Y+1),a),b)}
 function fb(x,y){let v=0,a=.56;for(let k=0;k<4;k++){v+=a*noise(x,y);x=x*2.03+13.7;y=y*2.11-8.1;a*=.46}return v}
 const rgb=new Uint8Array(W*H*3);
 function put(x,y,r,g,b){const i=(y*W+x)*3;rgb[i]=clamp(Math.round(r),0,255);rgb[i+1]=clamp(Math.round(g),0,255);rgb[i+2]=clamp(Math.round(b),0,255)}
 // Quiet dusk sky with broken cloud strata lit from the upper left.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const u=x/W,v=y/H,t=clamp(v/horizon);
   const glow=Math.exp(-(((u-.23)/.45)**2+((v-.54)/.25)**2)*1.55);
   const flow=fb(u*5.7+8,v*15+fb(u*4,v*9)*2.2);
   const cloud=sm(clamp((flow-.40)/.25))*Math.exp(-((v-.29)**2)/.052);
   const edge=sm(clamp((flow-.38)/.12))*(1-sm(clamp((flow-.51)/.15)));
   const rim=edge*glow*17, veil=fb(u*3+44,v*12+2);
   put(x,y,21+41*t+glow*48-cloud*15+rim+veil*4,31+47*t+glow*26-cloud*12+rim*.65+veil*4,47+55*t+glow*13-cloud*8+rim*.35+veil*5);
 }
 // Overlapping, asymmetric massifs. Terrain shading uses an oblique relief field
 // sampled on both axes, rather than extruding a silhouette into vertical bands.
 const layers=[
 {seed:23,base:.665,foot:.685,amp:.34,peaks:[[.00,.63,.19],[.17,.43,.13],[.36,.70,.15],[.49,.45,.10],[.62,.80,.16],[.75,.58,.14],[.91,.85,.20]],c:[76,94,117],fog:[95,113,134],detail:.48},
 {seed:41,base:.674,foot:.700,amp:.39,peaks:[[.00,.70,.22],[.12,.98,.15],[.25,.53,.13],[.40,.22,.11],[.73,.48,.16],[.87,.85,.14],[1.00,.97,.20]],c:[43,62,82],fog:[73,94,112],detail:.78},
 {seed:67,base:.688,foot:.741,amp:.34,peaks:[[.02,.84,.25],[.17,.69,.18],[.31,.32,.18],[.76,.34,.13],[.91,.72,.18],[1.04,.92,.23]],c:[23,40,51],fog:[47,68,82],detail:1},
 {seed:91,base:.70,foot:.83,amp:.26,peaks:[[-.06,.98,.27],[.08,.49,.17],[.96,.58,.18],[1.05,.93,.25]],c:[12,29,36],fog:[27,48,59],detail:1}
 ];
 for(const layer of layers){
   function profile(u){
     const warp=(fb(u*7+layer.seed,9)-.45)*.065;
     let p=0;
     for(const [center,ht,w] of layer.peaks){const offset=u+warp-center,d=offset/(w*(.96+.20*Math.tanh(offset/.035)));p=Math.max(p,ht*Math.max(0,1-Math.abs(d))**.79)}
     const small=fb(u*39+layer.seed,7),rough=fb(u*109+layer.seed,31);
     return layer.base-layer.amp*(p+.13*fb(u*15+layer.seed,5)+.085*small+.028*rough);
   }
   function relief(u,v,top){
     const skew=u+v*(.36+.14*noise(u*10+layer.seed,4));
     const bend=fb(u*9+layer.seed,v*10)*.027;
     const mass=fb((skew+bend)*26+layer.seed,v*19+layer.seed);
     const strata=fb((u-v*.41+bend)*36+layer.seed,v*24+4);
     const gully=1-Math.abs(2*noise((skew+bend)*48+layer.seed,v*21)-1);
     return mass*.62+strata*.25+gully*.13;
   }
   for(let x=0;x<W;x++){
     const u=x/W,top=profile(u),side=(profile(u+.024)-profile(u-.024))/.048;
     const face=clamp(.52-side*.27,.20,.82);
     const edge=clamp((Math.abs(u-.5)-.20)/.30);
     let foot=layer.foot;
     if(layer.seed>=67)foot=mix(.682,layer.foot,sm(edge));
     if(layer.seed===91)foot=mix(top,foot,sm(clamp((Math.abs(u-.5)-.21)/.18)));
     for(let y=Math.max(0,Math.floor(top*H));y<Math.min(H,Math.ceil(foot*H));y++){
       const v=y/H,t=clamp((v-top)/Math.max(.01,foot-top));
       const r=relief(u,v,top);
       const dx=relief(u+.003,v,top)-relief(u-.003,v,top);
       const dy=relief(u,v+.004,top)-relief(u,v-.004,top);
       const rock=fb(u*66+layer.seed,v*59+7);
       const light=clamp(.5+(dx*.78+dy*.54)*3.5,0,1);
       const ridge=sm(clamp((r-.42)/.24));
       const snow=sm(clamp((.49-v)*6))*sm(clamp((r-.49)/.20))*sm(clamp((face-.24)/.60));
       const lit=((face-.47)*13+(light-.47)*43+(ridge-.45)*21+(rock-.45)*10+snow*35)*layer.detail;
       const trees=sm(clamp((t-.43)/.55))*sm(clamp((.61-r)/.3))*layer.detail;
       const haze=sm(clamp((t-.24)/.76))*(layer.seed===23?.77:.45);
       const color=layer.c.map((c,i)=>mix(c+lit+(i===0?-10:i===1?3:-4)*trees+(i===0?9:i===1?4:0)*Math.max(0,face-.45),layer.fog[i],haze));
       const alpha=clamp((v-top)*H+.45),i=(y*W+x)*3;
       put(x,y,mix(rgb[i],color[0],alpha),mix(rgb[i+1],color[1],alpha),mix(rgb[i+2],color[2],alpha));
     }
   }
 }
 // Clustered conifers along irregular banks, with tiered branches and depth.
 for(let side=0;side<2;side++){
   for(let n=0;n<162;n++){
     const u=(n+hash(n,side+85)*.85)/162*.34;
     const x=Math.floor((side?1-u:u)*W);
     const edge=clamp((Math.abs(x/W-.5)-.21)/.29);
     const bank=horizon+.13*sm(edge);
     const cluster=fb(u*25+side*21,8),depth=hash(n,side+12);
     const y=Math.floor((bank-.004-depth*.025)*H);
     const ht=Math.floor(3+hash(n,side+7)*17*(.22+.78*edge)*(.45+.55*cluster));
     const half=Math.max(1,Math.round(ht*.23));
     for(let dy=0;dy<ht;dy++){
       const tier=.62+.38*Math.sin(dy*1.8+hash(n,5)*3);
       const span=Math.max(0,Math.round(half*dy/ht*tier));
       for(let dx=-span;dx<=span;dx++){
         const xx=x+dx,yy=y-ht+dy;if(xx<0||xx>=W||yy<0||yy>=H)continue;
         const i=(yy*W+xx)*3,t=.64+.25*edge,light=(dx<0?5:0)+depth*5;
         put(xx,yy,mix(rgb[i],11+light,t),mix(rgb[i+1],28+light,t),mix(rgb[i+2],33+light,t));
       }
     }
   }
 }
 // Reflected far bank and sky, with compressed vertical perspective and soft horizontal wave ribbons.
 const src=rgb.slice();
 for(let y=Math.ceil(horizon*H);y<H;y++)for(let x=0;x<W;x++){
   const u=x/W,v=y/H,t=(v-horizon)/(1-horizon),edge=clamp((Math.abs(u-.5)-.21)/.29);
   const bank=horizon+.13*sm(edge);
   if(v<bank)continue;
   const wave=noise(u*11+3,v*95),ripple=noise(u*26+9,v*57+13);
   const sy=Math.floor(clamp((horizon-(v-horizon)*.82+(wave-.5)*(.002+.012*t))*H,0,H-1));
   const sx=Math.floor(clamp(x+(ripple-.5)*(2+13*t),0,W-1)),i=(sy*W+sx)*3;
   const fresnel=.83-.37*t,glow=Math.exp(-((u-.25)**2)/.07),streak=sm(clamp((wave-.56)/.35))*glow*(4+5*t);
   const cols=[mix(10,src[i]*.91,fresnel)+streak,mix(23,src[i+1]*.94,fresnel)+streak*.8,mix(33,src[i+2]*.96,fresnel)+streak*.55];
   const alpha=clamp((v-bank)*H/2+.3),j=(y*W+x)*3;
   put(x,y,mix(rgb[j],cols[0],alpha),mix(rgb[j+1],cols[1],alpha),mix(rgb[j+2],cols[2],alpha));
 }
 // Chromatic ramps with moderate precision: spatial detail, not random texture.
 const pal=[],ramps=[[10,20,33,128,157,186],[9,23,30,98,139,155],[16,25,38,157,155,154],[12,24,32,130,142,149]];
 for(let i=0;i<256;i++){const l=(i%64)/63,c=ramps[i>>6];pal.push(...[0,1,2].map(j=>Math.round(mix(c[j],c[j+3],l))))}
 const raw=new Uint8Array((W+1)*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const p=(y*W+x)*3,r=rgb[p],g=rgb[p+1],b=rgb[p+2];let best=Infinity,idx=0;
   for(let band=0;band<4;band++){const k=band*192,dr=pal[k+189]-pal[k],dg=pal[k+190]-pal[k+1],db=pal[k+191]-pal[k+2],l=clamp(((r-pal[k])*dr+(g-pal[k+1])*dg+(b-pal[k+2])*db)/(dr*dr+dg*dg+db*db));const j=band*64+Math.round(l*63),d=(r-pal[j*3])**2+(g-pal[j*3+1])**2+(b-pal[j*3+2])**2;if(d<best){best=d;idx=j}}
   raw[y*(W+1)+x+1]=idx;
 }
 return {W,H,pal,raw};
}
const {W,H,pal,raw}=render();
const path=new URL('../assets/workspace-clean-v1.css',import.meta.url),css=readFileSync(path,'utf8');
const match=css.match(/--calendar-atmosphere-art:url\("data:image\/png;base64,([A-Za-z0-9+/=]+)"\)/);
assert(match,'Calendar art not found');
const old=Buffer.from(match[1],'base64');
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const header=Buffer.alloc(13);header.writeUInt32BE(W,0);header.writeUInt32BE(H,4);header[8]=8;header[9]=3;
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?(0xedb88320^(n>>>1)):n>>>1;return n>>>0});
function chunk(name,data){
 const n=Buffer.from(name),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);
 let crc=0xffffffff;for(const v of n)crc=crcTable[(crc^v)&255]^(crc>>>8);for(const v of data)crc=crcTable[(crc^v)&255]^(crc>>>8);tail.writeUInt32BE((crc^0xffffffff)>>>0);
 return Buffer.concat([head,n,data,tail]);
}
if(process.argv.includes('--write')){
 const png=Buffer.concat([signature,chunk('IHDR',header),chunk('PLTE',Buffer.from(pal)),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
 assert(png.length<=240000,'Image exceeds embedded asset budget');
 writeFileSync(path,css.replace(match[1],png.toString('base64')));console.log('CALENDAR_SCENE_WRITTEN',png.length);
}else{
 assert(process.argv.includes('--check'),'Use --check or --write');
 assert(old.subarray(0,8).equals(signature)&&old.length<=240000);
 const idat=[];let seenHeader=false,seenPalette=false;
 for(let i=8;i<old.length;){const len=old.readUInt32BE(i),type=old.toString('ascii',i+4,i+8),data=old.subarray(i+8,i+8+len);assert(i+12+len<=old.length);if(type==='IHDR'){assert(data.equals(header));seenHeader=true}if(type==='PLTE'){assert(data.equals(Buffer.from(pal)));seenPalette=true}if(type==='IDAT')idat.push(data);i+=len+12}
 assert(seenHeader&&seenPalette&&idat.length>0);
 assert(inflateSync(Buffer.concat(idat)).equals(Buffer.from(raw)),'Rendered pixels differ from embedded art');
 console.log('CALENDAR_SCENE_SOURCE_OK',W,H,old.length);
}
