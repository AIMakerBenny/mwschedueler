// Deterministic 1280x720 pre-rendered mountain lake, with no runtime renderer or dependency.
// Pass Y: perspective terrain mesh with interpolated world-space lighting, occlusion, aerial perspective and lake reflections.
// --check validates decoded pixels; --write regenerates using standard Node zlib.
import {readFileSync,writeFileSync} from 'node:fs';
import {inflateSync,deflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
function render(){
 const W=1280,H=720,horizon=438,F=680,cam=2.1;
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
 function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
 function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),a=sm(x-X),b=sm(y-Y);return mix(mix(hash(X,Y),hash(X+1,Y),a),mix(hash(X,Y+1),hash(X+1,Y+1),a),b)}
 function fb(x,y,n=4){let v=0,a=.55;for(let k=0;k<n;k++){v+=a*noise(x,y);x=x*2.03+13.7;y=y*2.11-8.1;a*=.47}return v}
 const peaks=[[-17,30,16,13,20],[-31,51,28,22,28],[-11,69,27,18,24],[1,100,36,25,24],[25,67,30,24,30],[15,33,15,12,19],[39,44,27,20,23],[-6,13,3.8,6,10],[9,17,5,7,11]];
 function terrain(x,z){
   const bend=2.4*Math.sin(z*.068)+1.1*Math.sin(z*.14),width=2.5+Math.min(z,45)*.115;
   const shore=(Math.abs(x-bend)-width)+(fb(x*.33,z*.29,3)-.45)*3;
   const bank=sm(clamp(shore/5));
   const far=sm(clamp((z-58)/24));
   let mass=0;
   const wx=x+(fb(x*.06,z*.06,3)-.45)*8,wz=z+(fb(x*.08+30,z*.08,3)-.45)*9;
   for(const [px,pz,h,rx,rz] of peaks){
     const dx=(wx-px)/rx,dz=(wz-pz)/rz;
     mass=Math.max(mass,h*Math.max(0,1-Math.sqrt(dx*dx+dz*dz))**.85);
   }
   const ridged=1-Math.abs(2*noise(x*.27+z*.12,z*.20)-1);
   const ridge2=1-Math.abs(2*noise(x*.63-z*.19,z*.47)-1);
   const shape=mass*(.64+.24*sm(ridged)+.05*sm(ridge2))+1.8*fb(x*.45,z*.43,3)+.22;
   const land=Math.max(bank,far);
   return shore<=0&&far<.02?-0.1:shape*land-.28;
 }
 const rgb=new Uint8Array(W*H*3),water=new Uint8Array(W*H);
 const put=(x,y,r,g,b)=>{const i=(y*W+x)*3;rgb[i]=clamp(Math.round(r),0,255);rgb[i+1]=clamp(Math.round(g),0,255);rgb[i+2]=clamp(Math.round(b),0,255)};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const u=x/W,v=y/H,t=clamp(y/horizon);
   const glow=Math.exp(-(((u-.29)/.43)**2+((v-.55)/.30)**2)*1.6);
   const flow=fb(u*6+18,v*19+fb(u*4,v*10)*2.3);
   const cloud=sm(clamp((flow-.40)/.24))*Math.exp(-((v-.28)**2)/.055);
   const rim=sm(clamp((flow-.36)/.15))*(1-sm(clamp((flow-.51)/.18)))*glow;
   put(x,y,23+51*t+glow*61-cloud*24+rim*16,35+57*t+glow*30-cloud*19+rim*10,56+64*t+glow*8-cloud*12+rim*4);
 }
 // Project a continuous terrain mesh. Each depth strip is drawn back to
 // front, interpolating both world-space lighting and projected elevation
 // across its vertices. This removes the former flat per-ray color bands.
 const step=4,N=Math.ceil(W/step)+1;
 function vertex(x,z){
   const wx=(x-W*.5)/F*z,h=terrain(wx,z),wet=h<=0;
   const y=horizon+F*(cam-Math.max(0,h))/z;
   if(wet)return [y,12,28,40,1];
   const d=.26,dx=(terrain(wx+d,z)-terrain(wx-d,z))/(2*d),dz=(terrain(wx,z+d)-terrain(wx,z-d))/(2*d);
   const norm=Math.hypot(dx,1,dz),direct=clamp((dx*.58+.68+dz*.44)/norm,0,1);
   const slope=Math.hypot(dx,dz),grain=fb(wx*1.1+10,z*1.05,3),strata=noise(wx*.44+z*.3,h*.7);
   const stone=sm(clamp((h-4)/11)),snow=sm(clamp((h-13)/8))*sm(clamp((1.9-slope)/1.5))*sm(clamp((grain-.20)/.45));
   const veg=sm(clamp((5.3-h)/4.2))*sm(clamp((1.8-slope)/1.6));
   const forest=veg*sm(clamp((fb(wx*2.2,z*2.1,3)-.32)/.4));
   const lit=.57+.64*direct,variation=(grain-.45)*20+(strata-.5)*7-forest*10;
   const local=[mix(23,76,stone)-veg*7,mix(43,88,stone)+veg*6,mix(46,105,stone)-veg*3].map((c,i)=>mix(c*lit+variation+(i===0?direct*7:i===1?direct*3:0),[153,169,184][i]*(.70+.30*direct),snow));
   const fog=1-Math.exp(-z*.0087),fogColor=[96,119,140];
   const c=local.map((v,i)=>mix(v,fogColor[i],fog));
   return [y,...c,0];
 }
 const depths=[];for(let z=1.7;z<132;z+=Math.max(.085,z*.0075))depths.push(z);
 const row=z=>Array.from({length:N},(_,i)=>vertex(i*step,z));
 let far=row(depths.at(-1));
 for(let zi=depths.length-2;zi>=0;zi--){
   const near=row(depths[zi]);
   for(let x=0;x<W;x++){
     const j=Math.floor(x/step),t=(x%step)/step;
     const a=far[j].map((v,k)=>mix(v,far[j+1][k],t)),b=near[j].map((v,k)=>mix(v,near[j+1][k],t));
     const low=Math.max(0,Math.floor(Math.min(a[0],b[0]))),high=Math.min(H-1,Math.ceil(Math.max(a[0],b[0])));
     for(let y=low;y<=high;y++){
       const p=Math.abs(b[0]-a[0])<.001?.5:clamp((y+.5-a[0])/(b[0]-a[0]));
       const wet=mix(a[4],b[4],p)>.5;water[y*W+x]=wet?1:0;
       if(!wet)put(x,y,mix(a[1],b[1],p),mix(a[2],b[2],p),mix(a[3],b[3],p));
     }
   }
   far=near;
 }
 // Surface water is filled only where the heightfield has exposed lake;
 // directional reflection samples the completed terrain and sky image.
 const src=rgb.slice();
 for(let y=horizon;y<H;y++)for(let x=0;x<W;x++){
   if(!water[y*W+x])continue;
   const u=x/W,t=(y-horizon)/(H-horizon);
   const wave=noise(u*14+3,y*.13),ripple=noise(u*49+9,y*.071+13);
   const sy=Math.floor(clamp(horizon-(y-horizon)*.87+(wave-.5)*(1+7*t),0,H-1));
   const sx=Math.floor(clamp(x+(ripple-.5)*(2+13*t),0,W-1)),i=(sy*W+sx)*3;
   const reflect=.80-.33*t,shine=Math.exp(-((u-.29)**2)/.048)*sm(clamp((wave-.57)/.32))*8;
   put(x,y,mix(12,src[i]*.91,reflect)+shine,mix(28,src[i+1]*.94,reflect)+shine*.8,mix(40,src[i+2]*.98,reflect)+shine*.5);
 }
 // Palette quantization: four chromatic ramps, 64 luminance steps each.
 const pal=[],ramps=[[10,20,33,150,179,208],[9,23,30,111,151,164],[16,25,38,174,169,163],[12,24,32,150,165,177]];
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
