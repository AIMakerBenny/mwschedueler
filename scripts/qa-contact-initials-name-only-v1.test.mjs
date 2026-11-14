import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/app-core.js',import.meta.url),'utf8');
const start=source.indexOf("const MWS_KOREAN_INITIALS=");
const end=source.indexOf('function allContactLabels()',start);
assert(start>=0&&end>start,'Real app-core search helpers not found');
const context={window:{}};
vm.runInNewContext(source.slice(start,end),context);
const match=context.window.contactMatches;
const initials=context.window.mwsKoreanInitials;
assert.equal(typeof match,'function');

const persons=[
  {name:'김초코',labels:['버튜버'],notes:'메모에는 왁치동 출연 기록 있음'},
  {name:'로구구',labels:['버튜버','천타버스'],notes:'합방 기록 없음'},
  {name:'곽춘식',labels:['비튜버'],notes:'아카이브'},
  {name:'물초코',labels:['버튜버','왁치동'],notes:'SBO 연습경기'},
  {name:'우왁굳',labels:['버튜버'],notes:'음악'}
];
const selected=q=>persons.filter(p=>match(p,q)).map(p=>p.name);

test('Korean consonant sequences match displayed contact names only',()=>{
  assert.deepEqual(selected('ㄱㅊㅋ'),['김초코']);
  assert.deepEqual(selected('ㄱㅊㅅ'),['곽춘식']);
  assert.deepEqual(selected('ㄹㄱㄱ'),['로구구']);
  assert.deepEqual(selected('ᄀᄎᄉ'),['곽춘식']);
  assert.deepEqual(selected('ㅇㅇㄱ'),['우왁굳']);
});

test('popular tag and hidden notes cannot cause false consonant matches',()=>{
  assert.deepEqual(selected('ㅂㅌㅂ'),[]);
  assert.deepEqual(selected('ㅇㅊㄷ'),[]);
  assert.deepEqual(selected('ㅊㅌㅂㅅ'),[]);
  assert.equal(match({name:'미나',labels:['김초코'],notes:'곽춘식'},'ㄱㅊㅋ'),false);
  assert.equal(match({name:'미나',labels:['버튜버'],notes:'곽춘식'},'ㄱㅊㅅ'),false);
});

test('normal tag, notes and name full-text searches remain available',()=>{
  assert.deepEqual(selected('버튜버'),['김초코','로구구','물초코','우왁굳']);
  assert.deepEqual(selected('아카이브'),['곽춘식']);
  assert.deepEqual(selected('왁치동'),['김초코','물초코']);
  assert.deepEqual(selected('곽춘식'),['곽춘식']);
});

test('separate name and tag strings never create a synthetic cross-field initial sequence',()=>{
  assert.equal(match({name:'가',labels:['나'],notes:'다'},'ㄱㄴ'),false);
  assert.equal(match({name:'가',labels:['나'],notes:'다'},'가나'),false);
  assert.equal(match({name:'가나',labels:['다'],notes:''},'ㄱㄴ'),true);
});

test('blank query keeps every contact and normalization accepts IME compatibility and choseong',()=>{
  assert.equal(match({name:'리나'},''),true);
  assert.equal(match({name:'리나'},'  '),true);
  assert.equal(initials('우왁굳'),'ㅇㅇㄱ');
  assert.equal(match({name:'우왁굳'},'ᄋᄋᄀ'),true);
  assert.equal(match({name:'김초코'},'ㄱ ㅊ ㅋ'),true);
});
