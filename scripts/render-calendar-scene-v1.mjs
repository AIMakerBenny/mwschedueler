// Deterministic build-time renderer for the embedded desktop calendar landscape.
// No runtime dependency. --check compares decoded pixels against the checked-in art;
// --write regenerates the inline PNG with Node's standard zlib compression.
// After --write, update the workspace-clean stylesheet cache key in index.html.
import {readFileSync,writeFileSync} from 'node:fs';
import {inflateSync,deflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
const W=800,H=450,horizon=250,F=396,cam=3.3;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
function hash(x,y){let n=Math.imul(x,374761393)+Math.imul(y,668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295}
function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),a=sm(x-X),b=sm(y-Y);return mix(mix(hash(X,Y),hash(X+1,Y),a),mix(hash(X,Y+1),hash(X+1,Y+1),a),b)}
function fb(x,y){let v=0,a=.53;for(let k=0;k<5;k++){v+=a*noise(x,y);x=x*2.07+13.7;y=y*2.11-8.1;a*=.49}return v}
function terrain(x,z){
 const shore=22+5*noise(x*.07,3),distant=clamp((z-shore)/18),sides=clamp((Math.abs(x)-z*.40-1)/13)*clamp((z-5)/10);
 const peaks=(.32+.68*noise(x*.045,z*.049))*(.35+.65*noise(x*.087+25,z*.077)),ridged=1-Math.abs(2*fb(x*.125,z*.125)-1);
 return (distant*(4+21*peaks+6*ridged)+sides*(4+13*peaks+4*ridged))*(.72+.48*fb(x*.27+6,z*.27))-2;
}
const rgb=new Uint8Array(W*H*3),depth=new Float32Array(W*H);depth.fill(Infinity);
function set(x,y,r,g,b,d=Infinity){const i=(y*W+x)*3;rgb[i]=clamp(Math.round(r),0,255);rgb[i+1]=clamp(Math.round(g),0,255);rgb[i+2]=clamp(Math.round(b),0,255);depth[y*W+x]=d}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const v=clamp(y/horizon),g=Math.exp(-(((x-W*.76)/(W*.38))**2+((y-horizon*.68)/(H*.54))**2)*2),cloud=fb(x*.008+17,y*.021+2),c=Math.max(0,cloud-.47)*sm(v)*34;
 const star=y<horizon*.59&&hash(x+35,y+719)>.99905?45+hash(x,y)*40:0;
 set(x,y,12+v*30+g*13+c+star,22+v*39+g*21+c+star,42+v*46+g*28+c+star);
}
// Front-to-back heightfield projection with directional slope illumination.
for(let x=0;x<W;x++){
 const ray=(x-W*.5)/F;let top=H;
 for(let z=5;z<165&&top>0;z+=.19+z*.010){
  const X=ray*z+1.5,h=terrain(X,z);if(h<.18)continue;
  const p=Math.floor(horizon+(cam-h)*F/z);if(p>=top)continue;
  const y0=Math.max(0,p),y1=top,dx=(terrain(X+.16,z)-terrain(X-.16,z))/.32,dz=(terrain(X,z+.16)-terrain(X,z-.16))/.32,n=1/Math.sqrt(dx*dx+dz*dz+1);
  const direct=clamp((-.48*dx+.72-.50*dz)*n),rock=fb(X*1.4+19,z*1.4),rough=fb(X*3.5,z*3.5);
  const snow=clamp((h-10)/8)*clamp((n-.26)*1.9)*(.45+.55*rock),fog=1-Math.exp(-z/83),shade=.24+direct*.78;
  const br=mix((17+rock*22+rough*7)*shade,102*shade,snow),bg=mix((29+rock*28+rough*7)*shade,133*shade,snow),bb=mix((47+rock*34+rough*9)*shade,161*shade,snow);
  const fr=mix(br,59,fog),fg=mix(bg,82,fog),fblue=mix(bb,111,fog);
  for(let y=y0;y<y1;y++){const k=clamp((y-y0)/Math.max(4,y1-y0)),dither=(hash(x,y)-.5)*2;set(x,y,fr*(1-k*.09)+dither,fg*(1-k*.08)+dither,fblue*(1-k*.06)+dither,z)}
  top=y0;
 }
}
// A projected water plane, approximate reflected image, wave distortion and Fresnel tint.
const src=rgb.slice(),oldDepth=depth.slice();
for(let y=horizon+1;y<H;y++)for(let x=0;x<W;x++){
 const z=cam*F/(y-horizon),X=(x-W*.5)*z/F+1.5;
 if(oldDepth[y*W+x]<z||terrain(X,z)>.18)continue;
 const v=(y-horizon)/(H-horizon),wave=noise(x*.064,y*.31),ripple=noise(x*.015,y*.55);
 const ry=Math.floor(clamp(2*horizon-y+48+(wave-.5)*(2+18*v),0,H-1)),rx=Math.floor(clamp(x+(ripple-.5)*(2+20*v),0,W-1)),i=(ry*W+rx)*3;
 const fresnel=.62-.31*v,light=Math.pow(Math.max(0,1-Math.abs(wave-.5)*12),5)*Math.exp(-(((x-W*.69)/(W*.23))**2))*5;
 set(x,y,mix(9,src[i]*.78,fresnel)+light,mix(22,src[i+1]*.86,fresnel)+light,mix(37,src[i+2]*.94,fresnel)+light,z);
}
const pal=[];
for(let i=0;i<256;i++){
 const l=i%64/63,band=i>>6,c=[[9,18,34,115,151,192],[8,19,29,103,142,168],[13,24,40,139,161,181],[10,20,37,151,176,203]][band];
 pal.push(...[0,1,2].map(j=>Math.round(mix(c[j],c[j+3],l))));
}
const raw=new Uint8Array((W+1)*H);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const p=(y*W+x)*3,r=rgb[p],g=rgb[p+1],b=rgb[p+2];let best=Infinity,idx=0;
 for(let band=0;band<4;band++){
  const k=band*64*3,dr=pal[k+189]-pal[k],dg=pal[k+190]-pal[k+1],db=pal[k+191]-pal[k+2],l=clamp(((r-pal[k])*dr+(g-pal[k+1])*dg+(b-pal[k+2])*db)/(dr*dr+dg*dg+db*db));
  const j=band*64+Math.round(l*63),d=(r-pal[j*3])**2+(g-pal[j*3+1])**2+(b-pal[j*3+2])**2;
  if(d<best){best=d;idx=j}
 }
 raw[y*(W+1)+x+1]=idx;
}
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
