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
    intro:{id:'k1dm9mmHOKY',title:'1주년 캐릭터 소개',kind:'공식 영상'},
    profile:{id:'BS5W_GSRS-U',title:'Who is MaWang?',kind:'공식 영상'},
    mi:{id:'f_PUpKJvJdA',title:'미정 소개 영상',kind:'공개 기록에 연결된 영상'},
    kokoa:{id:'mBbtB811rJM',title:'Kokoa MaWang · 360° 영상',kind:'공식 영상'},
    devil:{id:'oP565EZ4Mwo',title:'A Day with Devil MaWang',kind:'공식 영상'},
    hina:{id:'Kla2-2hjXw8',title:'Find the MaWang Hamster',kind:'공식 영상'},
    real:{id:'d8pOSpkgw1I',title:'Burn Out · Real MaWang',kind:'공식 영상'},
    hamster:{id:'PEO110rb3bU',title:'뭐하고 있니 마왕 햄스터',kind:'공식 영상'},
    voice:{id:'RKQ2XmEfFB8',title:'2.0 보이스 관련 영상',kind:'공개 기록에 연결된 영상'}
  };
  const entries=[
    ['yoo','유정','Yoo-Jeong','jeong','#7dd3fc','2023-04-13','제작 시작','개백수티의 주인공','개백수티와 함께 알려진 마왕의 대표 아바타. 2.0 보이스가 도입된 시기 이후 토크와 게임 방송에서 중심적으로 사용되었다.',['개백수티','2.0 보이스','게임 · 저챗'],'유정마왕.png','d541b4870fbecc5ccab53d15322e696d77bd346c64f291d765fac779fee495da',['voice']],
    ['mi','미정','Mi-Jeong','jeong','#edbb76','2022-04-14','제작 기록','정 시리즈의 시작','갸루 분위기의 아바타로, 검은 머리와 금발 버전을 사용한다. 이름을 정하지 못해 부르던 명칭이 실제 이름이 되었고 이후 정 시리즈의 계기가 되었다.',['갸루','흑발 · 금발','이름의 시작'],'갸루마왕.png','b6a9097bd28d8d5478ac6fbb49770be6741e3d34fb61cbd72044f18d2c0dfa0a',['mi']],
    ['ye','예정','Ye-Jeong','jeong','#9db2d3','2022-07-04','제작 기록','직장인 콘셉트','일상에 지친 직장인을 모티브로 한 캐릭터. 다크서클과 사원증이 캐릭터의 개성을 드러낸다. 사원증은 이전의 밝은 모습을 담고 있다는 기록이 있다.',['직장인','다크서클','사원증'],'예정마왕.png','ddec6662ede6e6678d777fccbd67a60875e839a59a65f7ffe93af2bdd9ac716b',[]],
    ['seon','선정','Seon-Jeong','jeong','#f5a8c7','2022-08-06','제작 기록','반전 매력','독특한 분위기를 의도해 만든 아바타지만 완성된 모습은 청순하고 귀여운 인상으로 알려졌다. 제작 과정에서 아이디어를 고민했다는 기록이 남아 있다.',['청순한 인상','VRChat','정 시리즈'],'선정이.jpg','0d9b2bf7db871e2fbba7f076614a1f155d3fb93a11118969ac78901798a4572b',[]],
    ['su','수정','Su-Jeong','jeong','#a78bfa','2022-12-10','공개 기록','VRChat 대표 아바타','2022년 겨울에 공개된 아바타. 이후 VRChat에서 주로 사용되었다는 기록이 남아 있다.',['VRChat','2022년 겨울','정 시리즈'],'수정마왕.png','194a5bf451e4b8aca2c6e0b27e3c0392f3ab06667e65b60beb7549417d153e6c',[]],
    ['so','소정','So-Jeong','jeong','#f0a3e2','2023-09-10','제작 시작','장난기 있는 스타일','생방송에서 작업한 캐릭터. 구상할 때 어린아이 같은 장난기와 지뢰계 패션을 참고했으며 완성 단계에서 후자의 인상이 약해졌다고 기록되어 있다.',['장난기','지뢰계 모티브','생방송 제작'],'Sojung.png','110d57d05b46c540677f75b5241b52e7ea458bc85371aa06d2e5539498d20855',[]],
    ['ae','애정','Ae-Jeong','jeong','#7dc7a5','2024-09-11','제작 시작','느슨한 일상','집에 머무는 사람의 수수하고 흐트러진 모습을 의도한 아바타. 유정과 다른 생활감 있는 이미지로 구상되었다.',['생활감','수수한 분위기','생방송 제작'],'Aejeong.png','5e1f74946bd55f8a4e7bde95d9f096e945817b7473aeede56d40f516a4051f94',[]],
    ['da','다정','Da-Jeong','jeong','#f4d58b',null,'제작일 미확인','밝은 미소','다른 아바타와 비교해 밝은 분위기로 알려진 캐릭터. 웃는 표정이 특히 인상적이라는 공개 기록이 있다.',['밝은 분위기','웃는 표정','정 시리즈'],'Dajeong.jpg','35f8cb26e1ee34cb7d8db7bd573bc488bfb6cb5c08ae46ea4dc29acfa0e1941c',[]],
    ['ye-new','예정 리메이크','Ye-Jeong · NEW','jeong','#a5b4fc','2026-05-12','등장 기록','예정의 새로운 버전','기존 예정 아바타의 리메이크. 공개 위키에 2026년 5월 12일 방송에서 보였다는 기록이 있으며, 최초 공개를 직접 확인할 수 있는 공식 원본은 확보하지 못했다.',['리메이크','예정','2026년'],'(new)예정이.png','11d3fee08109663ae488cee5f237fcadca5307f88618b510ddf534bfef235700',[]],
    ['hakka','하카','Hakka','classic','#86c8fa',null,'최초 등장일 미확인','초기 마왕의 얼굴','고양이 귀가 특징인 초기 대표 아바타. 레나와 함께 등장하는 영상이 많았고 발레를 활용한 영상 엔딩으로도 알려져 있다.',['고양이 귀','발레','레나'],'하카.jpg','232aa75ab6c2b84924ca55326b97478a2424f27d784a5a5a0ca4569b4860aced',[]],
    ['lena','레나','Lena','classic','#bd9df7',null,'최초 등장일 미확인','몸개그의 단골','악마를 연상시키는 뿔이 있는 초기 캐릭터. 하카와 어울리며 다양한 슬랩스틱 코미디를 보여주었다.',['악마 뿔','몸개그','하카'],'레나2.png','02681fed83a249fde61298c8256afd852c376456b0c2e0953466029eeb06a790',[]],
    ['kokoa','코코아','Kokoa','classic','#d8a0cf',null,'최초 등장일 미확인','개성 있는 비주얼','문신과 광택 있는 표현이 눈에 띄는 아바타. 공식 채널의 캐릭터 중심 360도 영상에서 이름을 확인할 수 있다.',['문신','광택','360° 영상'],'코코아2.jpg','5ff9e546b063c8e07b023ab6223645305d3cbdd030c59fcf5fb25ddfc7d0e046',['kokoa']],
    ['devil','악마','Devil','classic','#f291b6',null,'최초 등장일 미확인','분홍빛 악마','기존 아바타의 푸른 이미지와 달리 분홍 계열의 캐릭터. 공식 VRChat 360도 영상에서 악마 마왕이라는 이름으로 소개된다.',['분홍색','악마','360° 영상'],'악마22.jpg','b73e1835568115bc62ecd438c30e900a377294bcf4525e3ca43c38ea163b8532',['devil']],
    ['hina','히나','Hina','classic','#f2cc8a',null,'최초 등장일 미확인','마왕 햄스터','햄스터 의상을 입은 작은 캐릭터. 빠른 움직임과 과장된 힘을 보여주는 코미디가 특징이며, 햄스터 숨바꼭질 영상으로도 알려져 있다.',['햄스터','숨바꼭질','밈 영상'],'히나.jpg','8628d0c9dcd41a0fc8e0102302e2d6fc91b7580d290ef1938620f45f5cfb85b8',['hina','hamster']],
    ['real','리얼 마왕','Real MaWang','classic','#9eabd0',null,'최초 등장일 미확인','영상 속 편집자','공식 뮤직비디오 Burn Out에 등장하는 편집자 역할의 아바타. 기존 코미디 캐릭터와는 다른 배경 설정으로 소개된다.',['편집자','Burn Out','뮤직비디오'],'리얼마왕.jpg','01648034426c6f14e19783f071d454dbf4fe4d46fad9817b78d42ac4c2a50af2',['real']],
    ['wolferia','울페리아','Wolferia','classic','#a3c7db',null,'최초 등장일 미확인','날카로운 인상','큰 체격과 뾰족한 치아가 특징으로 기록된 초기 아바타. 현재 새로운 등장 기록은 확인되지 않았다.',['큰 체격','뾰족한 치아','초기 영상'],'울페리아.jpg','840acd08bcc1f54c00958af91dfefa65fb4b788c25e2ce3bf410f1875d975507',[]],
    ['mike','마이크','Mike','classic','#b9c2a4',null,'최초 등장일 미확인','근육질 캐릭터','근육질의 큰 남성 아바타. 이불을 터는 장면과 같은 코미디 연출에 등장한 것으로 알려져 있다.',['근육','슬랩스틱','초기 영상'],'Mawang_Mike1.png','84d00d6259cc7d02741649747336f87cd557dc4defed49e9380b19dcd5182294',[]],
    ['coco','코코','Coco','classic','#b9b2e8',null,'최초 등장일 미확인','치비와 이어지는 이야기','레나와 비슷한 뿔을 가진 캐릭터. 어린 시절의 자기 자신인 치비와 만나는 이야기가 영상에 등장한다. 직업은 확인되지 않았다.',['뿔','치비','스토리 영상'],'코코22.jpg','0babc98697978ba20fda80a3bc5ecac4cddddf96ad49779fe1adfc9c23e1e1b9',[]],
    ['azuki','아즈키','Azuki','classic','#e5b5b0',null,'최초 등장일 미확인','고양이 마왕냥','초기에는 마왕냥이라는 이름으로 등장했다고 전해진다. 이후 고양이 콘셉트로 알려졌으며 코미디 연출에도 등장한다.',['마왕냥','고양이','몸개그'],'Mawang_Azuki1.png','b0b786c47acc69ff07d47ebbc28b522a2b9da65655dadf8a11d21d82a2636569',[]],
    ['nyasuka','냐스카','Nyasuka','classic','#e8d180',null,'최초 등장일 미확인','노란색 포인트','노란색 계열의 디자인과 뺨의 반창고가 특징인 초기 캐릭터. 정확한 등장일은 확보하지 못했다.',['노란색','반창고','초기 영상'],'Nyasuka1.png','ed5914710a494ef265b0730f1f41a2e3b05d8dadabc32e1f1673ce04cd9b6787',[]],
    ['chibi','치비','Chibi','classic','#a8d5ef',null,'최초 등장일 미확인','어린 코코','마왕의 극초기 영상에 등장한 캐릭터로, 코코 마왕의 어린 시절이라는 설정이 기록되어 있다.',['아기코코','코코','극초기 영상'],'아기코코.jpg','5a0a03b7812726e3b597ad400ff472895d5df71dd2aedd85f006e9eb5a92889b',[]],
    ['baby-shark','아기상어','Baby Shark','classic','#6ec8ef',null,'최초 등장일 미확인','쌍둥이 캐릭터','아기쿠마와 쌍둥이인 초기 아바타. 공개 기록에서는 히나보다 조금 큰 캐릭터로 설명된다.',['상어','아기쿠마','쌍둥이'],'Mawang_BabyShark1.png','00dfaedebee250634a384d1c77e39bce47180676e71d83480f4c3a82c4c0dc64',[]],
    ['baby-kuma','아기쿠마','Baby Kuma','classic','#d2b28a',null,'최초 등장일 미확인','쌍둥이 캐릭터','아기상어와 쌍둥이인 초기 아바타. 등장 빈도가 낮다고 기록되어 있으며 세부 설정은 미확인 상태다.',['쿠마','아기상어','쌍둥이'],'Mawang_BabyKuma1.png','00dfaedebee250634a384d1c77e39bceb627428e66b3ac5ad88586e5b7b2231d',[]]
  ].map(([id,name,english,group,color,date,dateLabel,tagline,description,tags,imageName,imageId,media],index)=>Object.freeze({
    id,name,english,group,color,date,dateLabel,tagline,description,tags,imageName,
    image:portraits[id]?'/assets/mawang-archive-portraits/'+id+'.jpg':'https://file.namu.moe/file/'+imageId,
    imageOriginal:portraits[id]?'https://img2.piku.co.kr/w/uploads/9M736q/'+portraits[id]+'.jpg':'https://file.namu.moe/file/'+imageId,
    imageSource:portraits[id]?'PIKU 공개 이미지 · 2차 자료':'나무위키 미러 · 2차 자료',
    media,number:index+1,
    sources:[{label:'나무위키 미러 · 2차 자료',url:wiki},...(group==='jeong'&&id!=='ye-new'?[{label:'소나위키 · 2차 자료',url:sona}]:[]),...(portraits[id]?[{label:'PIKU 이미지 출처',url:piku}]:[])]
  }));
  window.mwsMawangArchiveDataV1=Object.freeze({entries:Object.freeze(entries),videos:Object.freeze(videos),
    channels:{official,soop,secondary:'https://www.youtube.com/channel/UCsc6HwSjfU8ig2spLjAtAig'},wiki,sona,
    profileImage:'/assets/mawang-archive-portraits/yoo.jpg'});
})();
