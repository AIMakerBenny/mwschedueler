// Deterministic 1280x720 pre-rendered mountain lake, with no runtime renderer or dependency.
// Layered relief, distance haze and water reflection, with upper-left lighting.
// --check validates decoded pixels; --write regenerates using standard Node zlib.
import {readFileSync,writeFileSync} from 'node:fs';
import {inflateSync,deflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
function render(){
 const W=1280,H=720,horizon=.65;
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
 function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
 function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),a=sm(x-X),b=sm(y-Y);return mix(mix(hash(X,Y),hash(X+1,Y),a),mix(hash(X,Y+1),hash(X+1,Y+1),a),b)}
 function fb(x,y){let v=0,a=.56;for(let k=0;k<4;k++){v+=a*noise(x,y);x=x*2.03+13.7;y=y*2.11-8.1;a*=.46}return v}
 const rgb=new Uint8Array(W*H*3);
 function put(x,y,r,g,b){const i=(y*W+x)*3;rgb[i]=clamp(Math.round(r),0,255);rgb[i+1]=clamp(Math.round(g),0,255);rgb[i+2]=clamp(Math.round(b),0,255)}
 // Low-frequency sky, broad soft illumination, horizontal cloud banks.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const u=x/W,v=y/H,t=clamp(v/horizon),g=Math.exp(-(((u-.29)/.39)**2+((v-.37)/.28)**2)*1.35);
   const cloud=sm(clamp((fb(u*7+11,v*26+9)-.43)/.27))*Math.exp(-((v-.28)**2)/.05);
   put(x,y,10+34*t+g*42+cloud*10,19+46*t+g*44+cloud*12,36+60*t+g*37+cloud*12);
 }
 // Layered height profiles, directional face shading and independent atmospheric distances.
 const layers=[
 {seed:23,base:.625,foot:.676,amp:.30,peaks:[[.08,.34,.22],[.32,.49,.25],[.61,.36,.22],[.88,.49,.20]],c:[59,83,111],fog:[78,105,133],detail:.57},
 {seed:41,base:.646,foot:.691,amp:.28,peaks:[[.04,.57,.22],[.25,.31,.24],[.57,.20,.20],[.90,.60,.28]],c:[38,58,82],fog:[65,88,112],detail:.82},
 {seed:67,base:.665,foot:.711,amp:.22,peaks:[[.015,.80,.26],[.20,.50,.19],[.80,.45,.18],[1.00,.79,.26]],c:[22,37,58],fog:[47,68,91],detail:1.0},
 {seed:91,base:.68,foot:.79,amp:.19,peaks:[[-.05,.85,.22],[1.03,.98,.22]],c:[11,23,37],fog:[27,45,64],detail:1.0}
 ];
 for(const layer of layers){
   function profile(u){
     let p=0;for(const [center,ht,w] of layer.peaks){const d=Math.abs((u-center)/w);p=Math.max(p,ht*Math.max(0,1-d)**.76)}
     const broad=fb(u*12+layer.seed,layer.seed*.13),fine=fb(u*53+layer.seed,7);
     return layer.base-layer.amp*(p+.22*broad+.075*fine);
   }
   for(let x=0;x<W;x++){
     const u=x/W,top=profile(u),side=(profile(u+.0015)-profile(u-.0015))/.003,face=clamp(.46-side*.29,.10,.88);
     // Keep nearby terrain on either side, open a lake in the centre.
     let foot=layer.foot;
     if(layer.seed>=67){const edge=clamp((Math.abs(u-.5)-.23)/.27);foot=mix(.668,layer.foot,sm(edge))}
     if(layer.seed===91&&Math.abs(u-.5)<.31)continue;
     const start=Math.max(0,Math.floor(top*H)),end=Math.min(H,Math.ceil(foot*H));
     for(let y=start;y<end;y++){
       const v=y/H,t=clamp((v-top)/Math.max(.01,foot-top));
       const erode=fb((u+.055*t)*42+layer.seed,v*13+layer.seed);
       const stria=fb(u*75+layer.seed+(v-top)*28,v*7+3);
       const coarse=fb(u*18+layer.seed,v*24);
       const facet=sm(clamp((erode-.29)/.44)),frost=sm(clamp((.48-v)*4))*sm(clamp((coarse-.38)/.26));
       const lit=(face-.32)*22*layer.detail+(facet-.45)*17*layer.detail+(stria-.45)*9*layer.detail+frost*15;
       const haze=sm(clamp((t-.32)/.68))*.63;
       const base=layer.c.map((c,i)=>mix(c+lit,layer.fog[i],haze));
       // Blend the topmost pixel against the already-rendered distant layer.
       const alpha=clamp((v-top)*H+.35),i=(y*W+x)*3;
       put(x,y,mix(rgb[i],base[0],alpha),mix(rgb[i+1],base[1],alpha),mix(rgb[i+2],base[2],alpha));
     }
   }
 }
 // Reflected far bank and sky, with compressed vertical perspective and soft horizontal wave ribbons.
 const src=rgb.slice();
 for(let y=Math.ceil(horizon*H);y<H;y++)for(let x=0;x<W;x++){
   const u=x/W,v=y/H,t=(v-horizon)/(1-horizon),edge=clamp((Math.abs(u-.5)-.27)/.23);
   const bank=horizon+.115*sm(edge);
   if(v<bank)continue;
   const wave=noise(u*15+3,v*110),ripple=noise(u*36+9,v*68+13);
   const sy=Math.floor(clamp((horizon-(v-horizon)*.82+(wave-.5)*(.002+.009*t))*H,0,H-1));
   const sx=Math.floor(clamp(x+(ripple-.5)*(2+13*t),0,W-1)),i=(sy*W+sx)*3;
   const fresnel=.61-.33*t,glow=Math.exp(-((u-.30)**2)/.065),streak=sm(clamp((wave-.63)/.25))*glow*(4+4*t);
   const cols=[mix(8,src[i]*.82,fresnel)+streak,mix(20,src[i+1]*.91,fresnel)+streak,mix(34,src[i+2]*.96,fresnel)+streak];
   const alpha=clamp((v-bank)*H/2+.3),j=(y*W+x)*3;
   put(x,y,mix(rgb[j],cols[0],alpha),mix(rgb[j+1],cols[1],alpha),mix(rgb[j+2],cols[2],alpha));
 }
 // Chromatic ramps with moderate precision: spatial detail, not random texture.
 const pal=[],ramps=[[8,17,30,128,161,194],[8,20,33,102,143,174],[12,23,38,147,172,191],[10,19,36,155,180,204]];
 for(let i=0;i<256;i++){const l=Math.round((i%64)/63*39)/39,c=ramps[i>>6];pal.push(...[0,1,2].map(j=>Math.round(mix(c[j],c[j+3],l))))}
 const raw=new Uint8Array((W+1)*H);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const p=(y*W+x)*3,r=rgb[p],g=rgb[p+1],b=rgb[p+2];let best=Infinity,idx=0;
   for(let band=0;band<4;band++){const k=band*192,dr=pal[k+189]-pal[k],dg=pal[k+190]-pal[k+1],db=pal[k+191]-pal[k+2],l=clamp(((r-pal[k])*dr+(g-pal[k+1])*dg+(b-pal[k+2])*db)/(dr*dr+dg*dg+db*db));const j=band*64+Math.round(Math.round(l*39)/39*63),d=(r-pal[j*3])**2+(g-pal[j*3+1])**2+(b-pal[j*3+2])**2;if(d<best){best=d;idx=j}}
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
