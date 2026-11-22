/* Editorial activity archive. Dates are not inferred from upload dates. A common
   reference for a group of entries is explicitly labelled as a secondary source. */
(()=>{
  const sources={
    s:['소나위키 활동 목록 · 2차 자료','https://sona.wiki/w/MaWang'],
    n:['나무위키 활동 목록 · 2차 자료','https://dark.namu.moe/w/MaWang'],
    a:['기존 업적 타임라인 · 기존 기록',''],
    c:['마왕 공식 유튜브','https://www.youtube.com/@MaWangVR'],
    p:['SOOP 공식 방송국','https://www.sooplive.com/station/mawang0216']
  };
  // date | category | title | context | source key or URL | optional end date | date basis
  // category: game, collab, host, event, server, media. Basis: event, publication, record, announcement.
  const raw=`2020-12-10|media|MaWang Compilation Video 1|VRChat 영상 모음|https://www.youtube.com/watch?v=srBfBijJobA||publication
2020-12-20|media|How to play with a MaWang Cat|VRChat 고양이 캐릭터 영상|https://www.youtube.com/watch?v=xTeb7T7misM||publication
2021-01-13|media|A Day with MaWang|VRChat 360도 체험 영상|https://www.youtube.com/watch?v=yEobsmqpvlc||publication
2021-05-24|media|PACMAN Ghost Dance Challenge|VRChat 댄스 영상|c||publication
2021-09-21|media|Find the MaWang Hamster!!|햄스터 아바타 영상|c||publication
2021-11-06|media|A Day with MaWang's|VRChat 360도 영상|https://www.youtube.com/watch?v=GCCKjTuj6_E||publication
2021-11-11|media|Today Is Pocky's Day with Kokoa MaWang|VRChat 360도 영상|c||publication
2021-12-23|media|A Day with Devil MaWang|VRChat 360도 영상|c||publication
2022-01-17|media|A Day with MaWang 2|VRChat 360도 영상|https://www.youtube.com/watch?v=wLenu624veU||publication
2022-03|media|고세구 눈나구 아바타|아바타 제작 참여|a||record
2022-02-26|event|고정멤버 시즌 3 오디션|왁타버스 오디션 참가|s
2022-03|event|그란투리스모 7 와크무런|신짱게이밍 팀 레이싱 · 4월 2일 4강 경기|s|2022-04-02
2022-04-19|media|아이네 신호등 MV|연출 및 몸연기|s||publication
2022-04-24|media|제8회 상황극 콘테스트 낙화|VRChat 상황극 제작 참여|s
2022-04|media|이세계아이돌 싸이퍼|VRChat 영상 제작 관련 활동|a||record
2022-04-23|media|이세계아이돌 햄스터 아바타|주르르 영상 공개 기준|a||publication
2022-05|media|릴파 전투 메이드|아바타 관련 활동|a||record
2022-06|event|고세구 찐짜사나이|VRChat 군대 체험 조교|a
2022-07-05|media|NEW MAWANG|VRChat 영상|https://www.youtube.com/watch?v=f_PUpKJvJdA||publication
2022-07-18|media|에고시의 검|단편영화 몸연기|s
2022-09-17|media|그냥 살아!|고멤가요제 김피탕&짬뽕 감독|s
2022-10-15|media|제9회 상황극 콘테스트|실종 및 PUNK: Shutdown 몸연기|s
2023-06-04|event|버츄얼 파이터 한일전|VR 복싱 대회|s
2023-06-10|collab|Outlast Trials|김챠멜 · 재수피기 · 베르|s
2023-07-02|event|왁타버스 배그 대잔치|마다옴과 듀오|s
2023-07-16|event|VR챗 축구 대전|별 부수는 마단 팀장|s|2023-07-17
2023-07-18|server|Rust 스트리머 서버|서버 관련 팀 교육|s
2023-11-17|event|왁타버스 래프팅 대회|마피아지 팀|s
2024-01-28|collab|VRChat Just Dance|9호 · 마다옴 · 양도끼|s
2024-02-14|collab|미르 합방|밍턴 · 미르 · 마이곰이 · 여르미 · 재수피기 · 하디아|s
2024-02-15|host|사이클 참가자 VR 멀미 극복 투어|마다옴 · 모구구 · 미르 등 참가자 교육|s
2024-02-17|event|왁타버스 사이클 대회|사이클 경기 참가|s
2024-02-17|event|버츄얼 컴퍼니|김챠멜 주최 상황극|n
2024-02-18|host|트위치 코리아 장례식|VRChat 상황극 합방|s
2024-02-18|event|레알 아이언피스트|참가|s
2024-02-25|event|왁타버스 배그 삼국지|배틀그라운드 대회|s
2024-03-02|collab|VRChat 메이드 합방|9호 · 김챠멜 · 양도끼|s
2024-03-03|game|Party Animals 팀 대결|천양 팀|s
2024-03-13|event|나만 아니면 돼|암벽등반 게임|s
2024-03-14|collab|Legendary Tales|마다옴 · 미르 · 여르미|s
2024-03-16|collab|VRChat 댄스 교류회|마다옴 · 미르 · 마이곰이|s
2024-03-17|collab|Arma 3 Sahara|9호 · 마다옴 · 마이곰이 · 양도끼|s
2024-03-17|server|포켓꾸 마인크래프트 서버|서버 참가|s
2024-03-22|host|VR 멀미 극복 합방|빙밍 · 쿠마묭 · 하디아|s
2024-03-23|event|버튜버 총회|고세구 주최 토론 콘텐츠|https://pick.sooplive.com/daily/view/159805
2024-03-24|event|왁타버스 배틀크러쉬|현지인즈 팀|s
2024-03-27|event|왁타버스 마라톤|마라톤 콘텐츠|s
2024-03-28|event|에휴 마라톤|Arma 3|s
2024-04-03|collab|Content Warning|9호 · 여르미 · 재수피기|s
2024-04-06|collab|VRChat 조커 어몽어스|9호 · 마이곰이 · 밍턴 · 여르미 · 한결|s
2024-04-07|collab|임재천 메이드 합방|VRChat|s
2024-04-10|collab|Arizona Sunshine 2|빙밍|s
2024-04-12|collab|VRChat 산책회|마이곰이 · 이주인 · 제갈금자|s
2024-04-13|collab|Escape Simulator|마다옴 · 마이곰이 · 하디아|s
2024-04-19|media|지피티 VR 체험|장비 설정과 VR 체험 지원 · 편집 영상 기준|a||publication
2024-04-23|host|방송 1000일 기념 파티|기념일 합방|s
2024-04-27|collab|VRChat 반상회|마이곰이 · 양도끼 · 여르미 · 임재천 · 하디아|s
2024-04-28|event|왁타버스 해상전쟁|마인크래프트 대전|s
2024-04-28|event|아세토 코르사 고갯길 대회|데빌 키즈|s
2024-05|media|기동전함 왁데시코|한불새 역 몸연기|a||record
2024-05-04|collab|VRChat 헬스장|마이곰이 · 밍턴 · 양도끼 · 여르미 · 하디아|s
2024-05-06|collab|임재천 방송 게스트|방송 참여|s
2024-05-08|server|악어의 놀이터 2|마인크래프트 · 왁두랜드와 신세카이|s
2024-05-24|collab|종합 콘텐츠 합방|제갈금자 · 마이곰이 · 이주인|https://www.youtube.com/watch?v=J0tVdjFOXLY||publication
2024-06-22|event|배틀그라운드 3배싸움|배그 대전|s
2024-06-27|media|프리터 뭘 해도 글렀어 MV|공동 기획 · 촬영 · 편집 · 몸연기|s||publication
2024-06-28|collab|Chained Together|여르미 · 재수피기 · 하디아|s
2024-07-04|collab|Feign · Gartic Phone|두칠|s
2024-07-10|event|왁타버스 배그 티어게임|첫 대회 기록|s
2024-07-11|event|재수피기 · 제갈금자 노래 대결|관객 참여|s
2024-07-12|host|VRChat 찜질방|악어의 놀이터 참가자 합방|s
2024-07-13|collab|국밥걸즈 풀트 합방|마이곰이 · 양도끼 · 여르미 · 임재천|s
2024-07-19|event|양도끼 VRChat 선수촌|선수촌 콘텐츠|s|2024-07-21
2024-07-19|server|킴성태 Rust 시즌 3|생존 서버|s|2024-07-21
2024-07-21|event|VRChat 촉각슈트 동아리|주르르 주최 · 교관|s
2024-07-23|collab|아카이브 멀미 특훈|비몽 · 여르미 · 한결|s
2024-07-25|event|VR 체력장|양도끼 주최|s
2024-07-27|event|왁타버스 체육대회|버스터콜 팀|s|2024-07-30
2024-08-19|game|좀보이드 팀 탈출 CK|마다옴 · 천양 · 카린야 · 코렛트 · 한결|n|2024-08-21
2024-08-03|event|VR 라이어게임|단츄 주최|s
2024-08-04|server|금마의 놀이터 시즌 1|제갈금자와 공동 운영 · 프로젝트 좀보이드|s|2024-08-06
2024-08-09|collab|행복배그|구슬요 · 빙밍 · 제갈금자|s
2024-08-10|collab|AFK 새로운 여정|마이곰이와 공동 광고 게임 플레이|s
2024-08-12|collab|배틀그라운드|멋사 · 빙밍 · 제갈금자|s
2024-08-15|server|마인크래프트 틈새서버|서버 참여|s
2024-08-17|event|제2회 처니랜드|천양 주최 대회|n
2024-08-19|game|일곱 개의 대죄 키우기|게임 광고 방송|s
2024-08-24|event|제갈금자 여름휴가|VRChat 합방|s
2024-08-27|event|버츄얼 풀파티|한결 주최|s
2024-08-30|collab|Arena Breakout|천양 · 코렛트|s
2024-09|host|마왕 재활센터|VR 운동 방송 운영|a
2024-09-13|collab|오늘 무슨 합방 하는데|멋사 · 비몽 · 두칠 · 제갈금자 · 카린야 · 샤르망 · 손냐미|https://www.youtube.com/watch?v=lW1Yqs7hIuM||publication
2024-10-14|host|아프리카TV 장례식|서비스명 변경 기념 VRChat 상황극|s
2024-10-15|server|GTA 요양타운|모요 · 화양 주최 RP 서버|n
2024-10-20|event|VRChat 주식의 왕|주식 콘텐츠 참가|s
2024-10-23|event|왁타버스 배그 티어게임 2|두 번째 대회|s
2024-10-25|event|왁타버스 VS 크래프톤|배틀그라운드 대결|s
2024-10-31|collab|Dark Hours|샤르망 · 쿠우 · 호미밍|s
2024-11-30|event|SOOP OPEN 이터널 리턴|게임 대회 참가|n
2024-11-09|event|왁이큐|사형선고 팀|s
2024-11-10|collab|Death Note Killer Within|거대별 등|s
2024-11-20|server|금마의 놀이터 시즌 2|제갈금자와 공동 운영 · 프로젝트 좀보이드|a|2024-11-24
2024-11-25|server|GTA The Dead Zone|엄춘팔 주최 좀비 서버|n
2024-11-29|collab|Lockdown Protocol|모구구 등|s
2024-12-04|collab|Lethal Company|마다옴 · 멋사 · 제갈금자|s
2024-12-12|event|와르르 사녹 대작전|맏쎄이 x PUBG 알사배|n
2024-12-21|collab|VRChat 웃지 않는 송년회|연말 합방|s
2024-12-23|server|마인크래프트 오두막 서버|밍턴 주최|n|2024-12-27
2025-01-06|server|아봉 서버|끠끼 주최 마인크래프트|n
2025-01-07|server|천코이드 좀보이드 서버|천양 · 코렛트 주최 · 팀장|n|2025-01-09
2025-01-12|event|제갈금자 주주총회|VRChat 합방|s
2025-01-12|event|고징어게임|고세구 주최 VRChat 게임|n
2025-01-15|event|왁징어게임 2|게임 참가|s
2025-01-18|event|제4회 처니랜드 소대전투|김웰로 · 망개 · 설채이|n
2025-01-19|collab|재수피기 생일 합방|VRChat|s
2025-02-01|event|여왕을 지켜라! 버츄얼 좀보이드|릴파 주최 · 다이아 팀|n
2025-02-02|collab|The Headliners|거대별 · 민결희 · 코렛트|s
2025-02-06|collab|Carry the Glass|하디아|s
2025-02-10|collab|Goose Goose Duck|거대별|s
2025-02-19|collab|Chained in the Backrooms|송밤 · 민결희 · 코렛트|s
2025-02|event|제1회 릴동파|죠뗌므 팀 · VR 스포츠 대회|https://pick.sooplive.com/daily/view/161657
2025-02-28|collab|Monster Hunter Wilds|코렛트 · 달타 · 유키라|s|2025-03-01
2025-03|event|WBD 왁타버스 야구 대회|로얄 버팔로즈 · 투수와 타자|a
2025-03-11|collab|머독 풀트 체험|머독 · 양도끼|s
2025-03-15|event|VRChat 배그 퀴즈쇼|퀴즈 콘텐츠|s
2025-04-18|event|제6회 처니랜드 소대전투|HONOR 진영 · 배그 저격병|n
2025-04-13|event|버추얼 스트리머 마왕총회|비챤 주최 · 마왕 콘셉트 스트리머 토론|https://blog.mascari4615.com/posts/mawang-assemble/
2025-05|server|아봉 서버 시즌 2|끠끼 주최 마인크래프트 서버|https://pick.sooplive.com/daily/view/162279
2025-05-07|server|러스트 힐링 서버|천양 주최|n|2025-05-08
2025-05-19|server|좀보이드 금창서버|제갈금자 주최|n|2025-05-20
2025-05-27|collab|감스트 VR 체험|VR 체험과 아바타 지원|a
2025-05-27|server|마인크래프트 지독서버|VLYZ 주최 자원 채집 서버|a|2025-05-31
2025-05-29|media|코렛트 코순이 아바타|코렛트 등장 영상 공개 기준|a||publication
2025-06-05|server|마인크래프트 레오펠 서버|춘봉 주최 RP 서버|n|2025-07-06
2025-06-21|event|제7회 처니랜드 소대전투|COURAGE 진영 · 중화기병|n
2025-08-09|event|VR 비치발리볼 대회|마다옴 · 예다 · 양도끼|n
2025-08-16|event|고세구 스트리트파이터 6|나솜 · 유시노 리냐|n
2025-08-16|server|GTA 여우도시|화양 주최 RP 서버|n|2025-08-30
2025-09|host|마왕 재활센터 전용 맵|VRChat 운동 콘텐츠|a
2025-09-06|media|VRChat 360도 생방송|실시간 체험형 방송|a
2025-09-19|event|버츄얼 육상 선수권 대회|악성코드 팀|https://pick.sooplive.com/daily/view/166092|2025-09-21
2025-09-29|event|레귤러원 F1 시즌 1|문모모와 메르세데스 팀|n
2025-10|event|지육대|털즈란 코치|a
2025-10-26|collab|재활센터 김피탕&짬뽕|김치만두번영택사스가 · 뢴트게늄 · 부정형인간 · 비챤|n
2025-10-30|event|Arma 3 랜덤 가챠 고지전|천양 팀|n
2025-10-31|server|진보이드|진호 주최 · 코렛트 팀|n|2025-11-01
2025-11|server|감스트 돌발서버|마인크래프트 참가|n
2025-11-22|event|릴파 버추얼 복싱 대회|천양 팀 코치|n|2025-11-23
2025-11-28|host|환승센터 크루 멤버 발표|크루 소개 방송|n
2025-12-03|server|맹든링|게임 콘텐츠 참가|n|2025-12-24
2025-12-25|collab|환승센터 첫 모임|거대별 · 예다 · 유키라|n
2025-12-29|event|최강버튜버 2|대회 참가|n
2026-01-03|collab|Mimesis|환승센터 크루 합방|n
2026-01-10|event|천타버스 VS 털즈란 VR 야구전|털즈란 코치|a
2026-02-03|server|천벌 서버|서버 참여|n|2026-02-05
2026-02-06|collab|환승센터 투표 독려 합방|양도끼 · 거대별 · 예다 · 햇비|n
2026-02-07|collab|환승센터 퀴즈쇼|크루 합방|n
2026-02-14|event|레귤러원 F1 시즌 2|킥자우버 팀|n|2026-02-15
2026-02|event|제2회 릴동파|꼭따라이 팀 · VR 스포츠|n|2026-03
2026-03-09|event|와우 동계 스포츠 대회|우왁굳 주최 · SOOP 보도 날짜|https://pick.sooplive.com/daily/view/173268||publication
2026-03-19|event|와튜버100|참가|n
2026-03-25|server|밍챵 좀보이드 서버|프로젝트 좀보이드|n|2026-03-26
2026-03-28|host|파블로프 VR 대전쟁|대회 개최|n
2026-04|host|브산동|VRChat 산책 동아리 운영|a
2026-04-05|event|릴동파 배그 대회|스쿼드 대회|n
2026-04-08|event|제3회 버종리 VR 겟투워크|VR 게임 대회|n
2026-04-24|event|제5회 버종리 배그|배틀그라운드 대회|n
2026-04-30|host|문명 6 멀티 대회|나솜 · 릴파 · 천양 · 코렛트 · 하치|n
2026-06-04|event|이터널 리턴 이리야 어서와|단츄 · 코렛트 주최 · SOOP 보도 날짜|https://pick.sooplive.com/daily/view/177625||publication
2026-06-14|host|MECCHA CHAMELEON|멀티플레이 합방 개최|n
2026-06-28|server|테라리아 마왕의 놀이터|멀티플레이 서버 주최|n|2026-07-03
2026-08-01|event|STALZONE 크루대전|환승센터 팀|n
2026-08-08|host|제2회 파블로프 VR 대전쟁|대회 개최|n
2026-10|event|SBO 세구 베이스볼 온라인|무파 자이언츠 포수 · VRChat 야구|a
2026-10-25|server|워독스 마왕 한국 서버 재오픈|공식 방송국에서 재개를 공지|p||announcement
2026-11|game|와우 포에버|월드 오브 워크래프트 방송|p||record`;
  (typeof window==='object'?window:globalThis).mwsCareerActivitiesDataV1=Object.freeze(raw.split('\n').map(line=>{
    const [date,kind,title,context,source,end='',basis='event']=line.split('|');
    const ref=sources[source]||[source.includes('youtube.com')?'공식 유튜브 영상':source.includes('pick.sooplive.com')?'SOOP PICK · 보도': '콘텐츠 제작자 기록',source];
    return Object.freeze({date,kind,title,context,source:ref[0],url:ref[1],end,basis,origin:'archive'});
  }));
})();
