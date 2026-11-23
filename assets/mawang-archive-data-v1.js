/* Public avatar reference archive, checked 2026-11-22. Dates are records, not
   inferred from thumbnails or video uploads. No private fan community sources. */
(()=>{
  const wiki='https://namu.moe/w/MaWang#s-8.1';
  const sona='https://sona.wiki/w/MaWang#s-8';
  const official='https://www.youtube.com/channel/UCNpcMizRJ73OJm48LszuytQ';
  const soop='https://www.sooplive.com/station/mawang0216';
  // Individually labelled public character portraits, verified against the
  // PIKU candidate table. Fan-uploaded reference, not an official art release.
  const piku='https://www.piku.co.kr/w/rank/9M736q';
  const portraits={
    yoo:'92410adeced440bb2ac2ec62825be786',mi:'0b0cb744df1355a9f2b32aa167492d67',
    ye:'47d41c8cfbdf4894e7cb9ce96d45cbc9',seon:'9ed2473f3920ac273d23886bc888679c',
    su:'a89edd18634425a13370bf873a908116',so:'176f3ad54a6ba09ad8b6ff8a3b694bf6',
    hakka:'7b7a7f211e26f92cd10c50f0187c8479',lena:'b220de1d125f9a55a7b4a334e51c560a',
    kokoa:'ee80f4cb5e8ba9285c13a222a6185238',devil:'40896051c7856c3947e4d59056128a02',
    hina:'d498eb861227351c08bb183b641ad40a',real:'caef53208a105c3c071aecbfcd585333',
    wolferia:'44b66d18361cbbbc982fe942af01fb6e',mike:'a5a9f5ebf631019466ebfdba2dba5a07',
    coco:'f41cf240457133be57b143d23795e10b',azuki:'c54d7817c01a4d98afa5c81c948e514d',
    nyasuka:'ed92a3af9a99f1d12d4f6a275a68906b',chibi:'fac3763d17f95417284ec5ac614aaa6a',
    'baby-shark':'4dd0dc60ac4ed227835051caead1f4d8','baby-kuma':'6cd39e95206a1f9debd50fdc07f46a48'
  };
  const videos={
    intro:{id:'k1dm9mmHOKY',title:'1주년 캐릭터 소개',kind:'공식 영상',published:'2021-07-27'},
    profile:{id:'BS5W_GSRS-U',title:'Who is MaWang?',kind:'공식 영상',published:'2024-02-07'},
    mi:{id:'f_PUpKJvJdA',title:'미정 소개 영상',kind:'공개 기록에 연결된 영상'},
    hakka:{id:'wLenu624veU',title:'A day with mawang 2',kind:'공식 영상',published:'2022-01-17'},
    kokoa:{id:'mBbtB811rJM',title:'A day with kokoa mawang',kind:'공식 영상',published:'2021-08-08'},
    devil:{id:'oP565EZ4Mwo',title:'A day with devil mawang',kind:'공식 영상',published:'2021-12-23'},
    hina:{id:'Kla2-2hjXw8',title:'Find the MaWang Hamster',kind:'공식 영상',published:'2021-09-20'},
    hamsterAdventure:{id:'9zIknidFEJ8',title:'The Adventures of a Hamster',kind:'공식 영상',published:'2021-06-11'},
    hamsterMeal:{id:'slhaxObZjKs',title:'What are you doing, MaWang hamster? 2',kind:'공식 영상',published:'2021-07-05'},
    babyShark:{id:'QLfDcsu3RG4',title:'Baby Shark',kind:'공식 영상',published:'2021-02-28'},
    real:{id:'d8pOSpkgw1I',title:'Burn Out · Real MaWang',kind:'공식 영상',published:'2021-11-27'},
    hamster:{id:'PEO110rb3bU',title:'뭐하고 있니 마왕 햄스터',kind:'공식 영상'},
    voice:{id:'RKQ2XmEfFB8',title:'2.0 보이스 관련 영상',kind:'공개 기록에 연결된 영상'},
    pianoman:{id:'yiHUdhBJmjA',title:'Piano Man - Cover by Mawang0216',kind:'공개 AI 커버 영상'}
  };
  // Requested display priority, not a measured last-used timestamp.
  const order='yoo da su su-black su-half ae kkomwang ye-new ye seon so mi mi-gold hakka lena kokoa devil hina real wolferia mike coco azuki nyasuka chibi baby-shark baby-kuma marorong'.split(' ');
  // Character introductions use the public avatar descriptions and original channel
  // videos as reference. Color variants share the same character narrative.
  const profiles={
    yoo:['마왕의 대표 아바타 중 하나로, 개백수티를 처음 입고 시그니처로 자리잡게 한 캐릭터다. 2.0 보이스 도입 이후 저스트 채팅과 게임, 합방에 주로 사용되었으며 마스코트 마로롱의 디자인 바탕이 되었다.',[
      ['개백수티','개백수티의 원조 아바타다. 개백수티는 직접 손으로 그린 글씨가 들어간 마왕의 시그니처 의상이다.'],
      ['방송','2023년 4월 제작을 시작해 2.0 보이스 도입 이후 방송의 대표 캐릭터로 자리잡았다.'],
      ['마로롱','마왕의 마스코트 마로롱은 유정이의 디자인을 바탕으로 만들어졌다.']]],
    da:['다른 마왕 아바타에 비해 밝은 분위기와 웃는 인상이 특징이다. 의상의 노출도 비교적 적은 편이다.',[
      ['제작','생방송에서 아바타를 작업했다.']]],
    su:['코로나에 걸렸을 때 제작한 아바타로, 수정은 2022년 12월 10일 공개되었다. VRChat 방송에 주로 사용된 캐릭터 중 하나다.',[
      ['세 가지 스타일','백수정, 흑수정, 반반수정은 머리색을 달리한 수정의 변형으로, 동일한 캐릭터 콘셉트를 공유한다.']]],
    ae:['은둔형 외톨이와 대인관계가 서툰 사람을 콘셉트로 제작한 아바타다. 개백수 콘셉트의 유정보다 흐트러진 외형을 표현했다. 2024년 9월 11일 생방송에서 제작을 시작했다.',[]],
    ye:['직장 생활에 지친 사람을 콘셉트로 제작한 아바타다. 시크한 인상과 다크서클이 특징이며, 초기 트위치 방송에서 자주 사용했다.',[
      ['사원증','사원증에 담긴 신입 사원 시절의 모습에는 다크서클이 없다.']]],
    'ye-new':['직장인 콘셉트 아바타 예정의 리메이크 버전이다.',[]],
    seon:['선정적인 디자인을 구상하며 제작을 시작했으나 완성된 아바타는 청순하고 귀여운 외형으로 바뀌었다.',[
      ['이름의 유래','초기의 선정적인 디자인 방향을 반영해 선정이라는 이름을 붙였다.'],
      ['제작 과정','제작 초기에 디자인 아이디어를 떠올리는 데 어려움을 겪었으며, 노출이 있는 의상을 사용한다.']]],
    so:['2023년 9월 10일 생방송에서 제작을 시작한 아바타다. 어린아이와 지뢰계 스타일을 구상했으며 완성된 디자인에서는 지뢰계 요소가 약해졌다.',[]],
    mi:['트위치 생방송에서 갸루 콘셉트로 제작한 아바타다. 이름을 정하지 못해 임시로 미정이라 부르다가 실제 이름으로 굳어졌다. 이후 예정과 선정의 이름에도 영향을 주었다.',[
      ['두 가지 스타일','검은 머리의 흑미정과 금발의 금미정이 있다.'],
      ['방송','트위치 생방송에서 자주 사용하던 아바타 중 하나다.']]],
    hakka:['마왕의 초창기 유튜브를 대표한 고양이 귀 아바타다. 레나와 함께 영상에 자주 등장하며 귀엽고 엉뚱한 모습으로 알려졌다. 처음 AI 노래를 선보인 캐릭터로서 Piano Man 커버와도 연결된다.',[
      ['대표 콘텐츠','2022년 공개된 360도 영상 A day with mawang 2에서 하카와 함께하는 하루를 보여준다.'],
      ['AI 노래 · Piano Man','마왕이 처음 AI 노래를 선보인 캐릭터다. 공개된 AI 커버 Piano Man으로도 알려져 있다.'],
      ['외무부장관','외부 시참과 합방에 주로 사용되면서 외무부장관이라는 별명을 얻었다.'],
      ['엔딩','초기 영상 말미에 발레 동작으로 마무리하는 모습이 등장한다.']]],
    lena:['악마를 연상시키는 뿔을 가진 아바타다. 영상에서는 남성 목소리와 몸개그가 등장하기도 한다.',[
      ['대표 캐릭터','2022년 하카의 360도 콘텐츠 A day with mawang 2에서 마왕은 하카와 레나를 채널의 대표 캐릭터로 소개했다.']]],
    kokoa:['섹시한 콘셉트의 아바타다. 문신과 광택 있는 피부, 노출이 있는 의상이 특징이다.',[
      ['대표 콘텐츠','2021년 8월 8일 공개한 A day with kokoa mawang은 코코아와 하루를 보내는 360도 체험 영상으로, 조회수 1,000만 회를 넘겼다.']]],
    devil:['분홍색 계열의 악마 콘셉트 아바타다.',[
      ['대표 콘텐츠','2021년 12월 23일 공개한 A day with devil mawang은 악마 마왕과 하루를 보내는 360도 영상으로, 조회수 1,000만 회를 넘겼다.']]],
    hina:['햄스터 옷을 입은 작은 아바타다. 빠른 움직임과 강한 힘이 특징이며, 초기에는 햄스터 옷을 입지 않은 모습으로도 등장했다.',[
      ['대표 콘텐츠','2021년 6월 The Adventures of a Hamster, 7월 What are you doing, MaWang hamster? 2, 9월 360도 숨바꼭질 영상 Find the MaWang Hamster가 공개되었다.'],
      ['아바타의 확장','성장한 햄스터 형태도 등장하며, 이세계아이돌 햄스터 아바타 제작에도 히나 에셋이 활용되었다.']]],
    real:['뮤직비디오 Burn Out에 등장하는 편집자 마왕이다. 마왕이 유튜브 활동 중 경험한 번아웃을 소재로 만든 VRChat 영상이다.',[
      ['대표 작품','2021년 11월 27일 공개한 VRChat 뮤직비디오 Burn Out에 등장한다.'],
      ['세계관','일반 마왕 캐릭터들과 별개의 세계관에 속하며, 생방송에서도 사용한 적이 있다.']]],
    wolferia:['큰 키와 뾰족한 치아가 특징인 초기 아바타다.',[]],
    mike:['큰 키와 근육질의 체격을 가진 남성 아바타다. 영상에서는 이불을 터는 장면에 등장한다.',[]],
    coco:['레나처럼 뿔을 가진 캐릭터다. 어린 시절의 자신인 치비와 만나는 에피소드가 있다.',[]],
    azuki:['처음에는 마왕냥이라는 이름으로 등장한 고양이 캐릭터다. 족제비 콘셉트를 거친 뒤 고양이 콘셉트로 돌아왔으며 몸개그 영상에 등장한다.',[]],
    nyasuka:['노란색을 중심으로 꾸민 아바타로, 뺨에 붙인 반창고가 특징이다. 초기 캐릭터들 가운데 중간 정도의 키를 가졌으며 마왕의 캐릭터 소개 영상에도 등장했다.',[]],
    chibi:['코코의 어린 시절을 표현한 아바타로, 마왕의 초창기 유튜브 영상에 등장한다.',[]],
    'baby-shark':['아기쿠마와 쌍둥이인 작은 캐릭터다. 히나보다 조금 큰 체구이며, 에피소드에 따라 성장한 모습으로도 등장한다.',[['대표 콘텐츠','2021년 2월 28일 공개한 VRChat 단편 Baby Shark는 아기상어를 건드렸다가 곤란해지는 코미디를 소재로 제작했다.']]],
    'baby-kuma':['아기상어와 쌍둥이인 작은 캐릭터다. 히나보다 키가 조금 크고, 아기상어와 마찬가지로 어른 형태도 존재한다.',[]],
    marorong:['유정이를 바탕으로 만들어진 마왕의 마스코트다. 제공된 일러스트에서는 연분홍색 머리, 고양이 귀, 커다란 파란 눈과 풍성한 꼬리를 가진 네 발 캐릭터로 표현된다.',[
      ['디자인','유정이 아바타에서 이어지는 마스코트로, 첨부된 원본 그림을 그대로 사용한다.']]],
    kkomwang:['',[]]
  };
  const profileKey=id=>id.startsWith('su-')?'su':id==='mi-gold'?'mi':id;
  const entries=[
    ['yoo','유정','Yoo-Jeong','jeong','#7dd3fc','2023-04-13','제작 시작','개백수티의 원조 · 마로롱의 바탕',['개백수티','대표 아바타','2.0 보이스','마로롱'],'유정마왕.png','d541b4870fbecc5ccab53d15322e696d77bd346c64f291d765fac779fee495da',['voice']],
    ['mi','흑미정','Black Mi-Jeong','jeong','#edbb76','2022-04-14','미정 제작일','정 시리즈의 시작 · 흑발',['미정','흑발','갸루','정 시리즈'],'갸루마왕.png','b6a9097bd28d8d5478ac6fbb49770be6741e3d34fb61cbd72044f18d2c0dfa0a',['mi']],
    ['mi-gold','금미정','Gold Mi-Jeong','jeong','#f6d47d',null,null,'미정 · 금발 버전',['미정','금발','갸루','정 시리즈'],null,null,['mi']],
    ['ye','예정','Ye-Jeong','jeong','#9db2d3','2022-07-04','제작일','직장인 콘셉트',['직장인','다크서클','사원증'],'예정마왕.png','ddec6662ede6e6678d777fccbd67a60875e839a59a65f7ffe93af2bdd9ac716b',[]],
    ['seon','선정','Seon-Jeong','jeong','#f5a8c7','2022-08-06','제작일','청순한 외형',['청순한 인상','정 시리즈'],'선정이.jpg','0d9b2bf7db871e2fbba7f076614a1f155d3fb93a11118969ac78901798a4572b',[]],
    ['su','백수정','White Su-Jeong','jeong','#c4b5fd','2022-12-10','수정 공개일','수정 · 백발 버전',['수정','백발','VRChat','정 시리즈'],'수정마왕.png','194a5bf451e4b8aca2c6e0b27e3c0392f3ab06667e65b60beb7549417d153e6c',[]],
    ['su-black','흑수정','Black Su-Jeong','jeong','#8d86c9',null,null,'수정 · 흑발 버전',['수정','흑발','VRChat','정 시리즈'],null,null,[]],
    ['su-half','반반수정','Half & Half Su-Jeong','jeong','#b2a2db',null,null,'수정 · 반반 버전',['수정','반반','VRChat','정 시리즈'],null,null,[]],
    ['so','소정','So-Jeong','jeong','#f0a3e2','2023-09-10','제작 시작','어린아이 콘셉트',['지뢰계 모티브','생방송 제작'],'Sojung.png','110d57d05b46c540677f75b5241b52e7ea458bc85371aa06d2e5539498d20855',[]],
    ['ae','애정','Ae-Jeong','jeong','#7dc7a5','2024-09-11','제작 시작','은둔형 외톨이 콘셉트',['은둔형 외톨이','생방송 제작'],'Aejeong.png','5e1f74946bd55f8a4e7bde95d9f096e945817b7473aeede56d40f516a4051f94',[]],
    ['da','다정','Da-Jeong','jeong','#f4d58b',null,null,'밝은 미소',['밝은 분위기','웃는 표정','정 시리즈'],'Dajeong.jpg','35f8cb26e1ee34cb7d8db7bd573bc488bfb6cb5c08ae46ea4dc29acfa0e1941c',[]],
    ['ye-new','예정 리메이크','Ye-Jeong · NEW','jeong','#a5b4fc',null,null,'예정의 새로운 버전',['리메이크','예정'],'(new)예정이.png','11d3fee08109663ae488cee5f237fcadca5307f88618b510ddf534bfef235700',[]],
    ['hakka','하카','Hakka','classic','#86c8fa',null,null,'초창기 대표 캐릭터 · Piano Man',['대표 아바타','Piano Man','첫 AI 노래','외무부장관','레나'],'하카.jpg','232aa75ab6c2b84924ca55326b97478a2424f27d784a5a5a0ca4569b4860aced',['hakka','pianoman']],
    ['lena','레나','Lena','classic','#bd9df7',null,null,'몸개그의 단골',['악마 뿔','몸개그','하카'],'레나2.png','02681fed83a249fde61298c8256afd852c376456b0c2e0953466029eeb06a790',['hakka']],
    ['kokoa','코코아','Kokoa','classic','#d8a0cf',null,null,'개성 있는 비주얼',['문신','광택','360° 영상'],'코코아2.jpg','5ff9e546b063c8e07b023ab6223645305d3cbdd030c59fcf5fb25ddfc7d0e046',['kokoa']],
    ['devil','악마','Devil','classic','#f291b6',null,null,'분홍빛 악마',['분홍색','악마','360° 영상'],'악마22.jpg','b73e1835568115bc62ecd438c30e900a377294bcf4525e3ca43c38ea163b8532',['devil']],
    ['hina','히나','Hina','classic','#f2cc8a',null,null,'마왕 햄스터',['햄스터','숨바꼭질','밈 영상'],'히나.jpg','8628d0c9dcd41a0fc8e0102302e2d6fc91b7580d290ef1938620f45f5cfb85b8',['hina','hamster','hamsterAdventure','hamsterMeal']],
    ['real','리얼 마왕','Real MaWang','classic','#9eabd0',null,null,'영상 속 편집자',['편집자','Burn Out','뮤직비디오'],'리얼마왕.jpg','01648034426c6f14e19783f071d454dbf4fe4d46fad9817b78d42ac4c2a50af2',['real']],
    ['wolferia','울페리아','Wolferia','classic','#a3c7db',null,null,'날카로운 인상',['큰 체격','뾰족한 치아','초기 영상'],'울페리아.jpg','840acd08bcc1f54c00958af91dfefa65fb4b788c25e2ce3bf410f1875d975507',[]],
    ['mike','마이크','Mike','classic','#b9c2a4',null,null,'근육질 캐릭터',['근육','슬랩스틱','초기 영상'],'Mawang_Mike1.png','84d00d6259cc7d02741649747336f87cd557dc4defed49e9380b19dcd5182294',[]],
    ['coco','코코','Coco','classic','#b9b2e8',null,null,'치비와 이어지는 이야기',['뿔','치비','스토리 영상'],'코코22.jpg','0babc98697978ba20fda80a3bc5ecac4cddddf96ad49779fe1adfc9c23e1e1b9',[]],
    ['azuki','아즈키','Azuki','classic','#e5b5b0',null,null,'고양이 마왕냥',['마왕냥','고양이','몸개그'],'Mawang_Azuki1.png','b0b786c47acc69ff07d47ebbc28b522a2b9da65655dadf8a11d21d82a2636569',[]],
    ['nyasuka','냐스카','Nyasuka','classic','#e8d180',null,null,'노란색 포인트',['노란색','반창고','초기 영상'],'Nyasuka1.png','ed5914710a494ef265b0730f1f41a2e3b05d8dadabc32e1f1673ce04cd9b6787',[]],
    ['chibi','치비','Chibi','classic','#a8d5ef',null,null,'어린 코코',['아기코코','코코','극초기 영상'],'아기코코.jpg','5a0a03b7812726e3b597ad400ff472895d5df71dd2aedd85f006e9eb5a92889b',[]],
    ['baby-shark','아기상어','Baby Shark','classic','#6ec8ef',null,null,'쌍둥이 캐릭터',['상어','아기쿠마','쌍둥이'],'Mawang_BabyShark1.png','00dfaedebee250634a384d1c77e39bce47180676e71d83480f4c3a82c4c0dc64',['babyShark']],
    ['baby-kuma','아기쿠마','Baby Kuma','classic','#d2b28a',null,null,'쌍둥이 캐릭터',['쿠마','아기상어','쌍둥이'],'Mawang_BabyKuma1.png','00dfaedebee250634a384d1c77e39bceb627428e66b3ac5ad88586e5b7b2231d',[]],
    ['kkomwang','꼬뫙','Kkomwang','jeong','#bca7ea',null,null,'',['꼬뫙','신작','정 시리즈'],null,null,[]],
    ['marorong','마로롱','Marorong','mascot','#f1a6c1',null,null,'유정이를 바탕으로 한 마스코트',['마스코트','유정','고양이 귀','파란 눈'],null,null,[]]
  ].sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0])).map(([id,name,english,group,color,date,dateLabel,tagline,tags,imageName,imageId,media],index)=>Object.freeze({
    id,name,english,group,color,date,dateLabel,tagline,description:profiles[profileKey(id)][0],tags,imageName,
    image:id==='marorong'?'/assets/mawang-archive-portraits/marorong.webp':portraits[id]?'/assets/mawang-archive-portraits/'+id+'.jpg':imageId?'https://file.namu.moe/file/'+imageId:null,
    imageOriginal:id==='marorong'?'/assets/mawang-archive-portraits/marorong.webp':portraits[id]?'https://img2.piku.co.kr/w/uploads/9M736q/'+portraits[id]+'.jpg':imageId?'https://file.namu.moe/file/'+imageId:null,
    imageSource:id==='marorong'?'사용자 제공 일러스트':portraits[id]?'PIKU 공개 이미지 · 2차 자료':imageId?'나무위키 미러 · 2차 자료':'이미지 미등록',
    variantOf:['mi','mi-gold'].includes(id)?'미정':['su','su-black','su-half'].includes(id)?'수정':null,
    media,number:index+1,details:profiles[profileKey(id)][1],
    sources:['kkomwang','marorong'].includes(id)?[]:[{label:'나무위키 미러 · 2차 자료',url:wiki},...(id!=='ye-new'?[{label:'소나위키 · 2차 자료',url:sona}]:[]),...(group==='classic'?[{label:'공식 캐릭터 소개 영상',url:'https://www.youtube.com/watch?v='+videos.intro.id}]:[]),...media.map(k=>({label:videos[k].title,url:'https://www.youtube.com/watch?v='+videos[k].id})),...(portraits[id]?[{label:'PIKU 이미지 출처',url:piku}]:[])]
  }));
  window.mwsMawangArchiveDataV1=Object.freeze({entries:Object.freeze(entries),videos:Object.freeze(videos),
    channels:{official,soop,secondary:'https://www.youtube.com/channel/UCsc6HwSjfU8ig2spLjAtAig'},wiki,sona,
    profileImage:'/assets/mawang-archive-portraits/yoo.jpg'});
})();
