(() => {
  const section = document.getElementById('careerTimeline');
  const source = section?.querySelector('.career-tree');
  if (!source) return;
  let controller;
  const activation = () => {
    if (section.classList.contains('active')) {
      if (!controller) controller = mount();
      else controller.resize();
    } else controller?.suspend();
  };
  new MutationObserver(activation).observe(section,{attributes:true,attributeFilter:['class']});
  activation();

  function mount() {
    const aliases = [
      [/릴동파/, '릴파 버츄얼 동계 스포츠 대회'],
      [/WBD/, '왁야대 VR챗 왁타버스 야구 대회 왁타버스야구'],
      [/왁타버스 체육대회/, '왁체대'], [/버츄얼 육상/, '버육대'],
      [/버츄얼 파이터|버복대/, '버복대 버츄얼 파이터 굳가대표 한국 대표 VR 복싱'],
      [/VR챗 축구 대전/, '브축대 VR 축구 VRChat 축구'],
      [/그란투리스모 7/, 'F1 챔스 데이토나 그란투리스모7'],
      [/릴파 버추얼 복싱/, '릴복대'], [/상황극 콘테스트/, '상컨'],
      [/와우 포에버/, 'WOW 월드 오브 워크래프트 와포'],
      [/배그/, 'PUBG 배틀그라운드'], [/배틀크러쉬/, '배틀크러시'],
      [/파블로프/, 'Pavlov'], [/레귤러원/, 'Regular One'],
      [/재활센터|브산동/, '센터장']
    ];
    // Display-only editorial labels. The source dates, facts and tags stay in index.html.
    const presentation = {
      '그란투리스모 7':['데이토나 개인 1위','와크-무런 · 팀 신짱게이밍','그란투리스모 7 데이토나 1위'],
      '신호등':['총감독 · 몸연기','아이네 뮤직비디오','신호등 총감독'],
      '제8회 상황극 콘테스트':['현수 역 몸연기','낙화','낙화 몸연기'],
      '에고시의 검':['몸연기','단편영화 콘테스트','에고시의 검 몸연기'],
      '그냥 살아!':['팀 감독','고멤가요제 · 김피탕&짬뽕','그냥 살아! 감독'],
      '제9회 상황극 콘테스트':['두 작품 몸연기','실종 · 신형식 역 / PUNK: Shutdown · 레브 역','실종 · PUNK 몸연기'],
      '버츄얼 파이터':['굳가대표 선출','버복대 · 한일 VR 복싱 한국 대표','버복대 굳가대표 선출'],
      '왁타버스 배그 대잔치':['듀오 라운드 우승','마다옴과 듀오','배그 대잔치 라운드 우승'],
      'VR챗 축구 대전':['팀 준우승','브축대 · 별 부수는 마단 팀장','브축대 팀 준우승'],
      '왁타버스 래프팅 대회':['대회 참가','마피아지 팀','래프팅 대회 참가'],
      '왁타버스 사이클 대회':['선수 참가','VR 멀미 극복 투어 진행','사이클 대회 참가'],
      '왁타버스 배그 삼국지':['개인 종합 3위','','배그 삼국지 개인 3위'],
      '나만 아니면 돼':['암벽등반 대결 1위','','나만 아니면 돼 1위'],
      '왁타버스 배틀크러쉬':['팀 종합 우승','현지인즈','배틀크러쉬 팀 종합 우승','최초 하드캐리 상 · 최다 하드캐리 상'],
      'VRChat 촉각슈트 동아리':['교관','7월 21일 · 주르르 주최 모임','촉각슈트 동아리 교관'],
      '왁타버스 체육대회':['팀 종합 우승','버스터콜','왁체대 종합 우승','개인 공동 1위 · 권총 사격·조정 금메달 · 클레이 사격 은메달'],
      '2024 마왕 재활센터':['정기 VR 운동 콘텐츠 시작','','마왕 재활센터 운영 시작'],
      '왁타버스 배그 티어게임':['한 라운드 우승','제2회 대회 · 총 18킬 · 1.5티어','배그 티어게임 라운드 우승'],
      '왁이큐':['대회 참가','사형선고 팀','왁이큐 참가'],
      '제1회 버츄페 어워드':['올해의 섹시상 공동 수상','VRChat 버추얼 연말 페스티벌','버츄페 섹시상 공동 수상'],
      '2024 SOOP 스트리머 대상':['수상자 인터뷰','','SOOP 대상 수상자 인터뷰','세부 상명 미확인'],
      '제1회 릴동파':['팀 종합 우승','죠뗌므','릴동파 종합 우승','개인 공동 1위 · 봅슬레이·눈덩이 금 · 바이애슬론 은 · 본선 최다 진출상·개인 메달 1위상'],
      'WBD 왁타버스 야구 대회':['4강','로얄 버팔로즈 · 선발투수 겸 2번 타자','WBD 4강'],
      '제6회 처니랜드 소대전투':['HONOR 진영 승리','배틀그라운드 · 저격병 참가','처니랜드 HONOR 승리'],
      '마인크래프트 지독서버':['다이아몬드 채집 3위','','지독서버 채집 3위'],
      'VR 비키니 비치발리볼 대회':['팀 우승','마다옴·예다·양도끼','VR 비치발리볼 팀 우승'],
      '2025 마왕 재활센터':['VRChat 전용 맵 개장','','재활센터 전용 맵 개장'],
      '버츄얼 육상 선수권 대회':['은메달 2 · 동메달 1','악성코드 팀','버육대 메달 3개'],
      '지육대':['팀 코치','털즈란','지육대 코치'],
      '아르마 3 랜덤 가챠 고지전':['퍼스트 킬 상 수상','한결을 잡아 수상','아르마 3 퍼스트 킬 상'],
      '릴파 버추얼 복싱 대회':['우승팀 코치','천양 팀','릴복대 우승팀 코치'],
      '2025 SOOP 스트리머 대상':['올해의 스트리머 수상','','SOOP 올해의 스트리머'],
      '천타버스 대 털즈란 VR 야구전':['팀 코치','털즈란','VR 야구전 털즈란 코치'],
      '레귤러원 F1 시즌 2':['팀 종합 우승','킥자우버','레귤러원 팀 우승','개인 4위'],
      '제2회 릴동파':['봅슬레이 은메달','꼭따라이 팀 · 2월 - 3월','릴동파 2 봅슬레이 은메달'],
      '파블로프 VR 대전쟁':['대회 주최','','파블로프 VR 대전쟁 주최'],
      '릴동파 배그 대회':['스쿼드 1라운드 우승','','릴동파 배그 라운드 우승'],
      '제3회 버종리 VR 겟투워크':['대회 1위','','버종리 VR 겟투워크 1위'],
      '브산동':['VR산책 동아리 운영','재활센터 개편','브산동 운영'],
      '이터널 리턴 「이리야 어서와」':['MVP','코렛트 선정','이터널 리턴 MVP'],
      'STALZONE 크루대전':['팀 준우승','환승센터','STALZONE 팀 준우승'],
      '제2회 파블로프 VR 대전쟁':['대회 주최','','파블로프 VR 대전쟁 2 주최'],
      'SBO 야구 대회':['포수 출전 · 타율 .400','무파 자이언츠','SBO 포수 출전'],
      '와우 포에버':['전사 1위','','와우 포에버 전사 1위','방송 제목에 기록 · 집계 기준 미확인']
    };
    // One verified game/platform image per recorded event; event-specific stills
    // take precedence over the platform cover. No guessed games for legacy rows.
    const steam=id=>'https://store.steampowered.com/app/'+id+'/';
    const video=id=>'https://www.youtube.com/watch?v='+id;
    const art={
      vrchat:['VRChat',steam(438100)],
      pubg:['배틀그라운드',steam(578080)],
      pavlov:['Pavlov VR',steam(555160)],
      arma3:['Arma 3',steam(107410)],
      eternal:['이터널 리턴',steam(1049590)],
      climbing:['A Difficult Game About Climbing',steam(2497920)],
      battlecrush:['배틀크러쉬',steam(2287920)],
      stalzone:['STALZONE / STALCRAFT X',steam(1818450)],
      gt7:['Gran Turismo 7','https://www.playstation.com/en-us/games/gran-turismo-7/'],
      minecraft:['Minecraft','https://www.minecraft.net/en-us/about-minecraft'],
      alive:['그냥 살아! · VRChat',video('K8WC6uWyC9I')],
      cycle:['사이클 대회 · VRChat',video('vP_TFkWnagI')],
      sports:['왁체대 · VRChat',video('FDe1jMQ94KQ')],
      award2024:['2024 SOOP 스트리머 대상','https://isplus.com/article/view/isp202412290086'],
      award2025:['2025 SOOP 스트리머 대상',video('GTGMfzUngV8')],
      wow:['WoW Forever','assets/announcements/20261121-warrior.webp'],
      f1:['F1 25',steam(3059520)]
    };
    const recordArt={
      '왁타버스 해상전쟁':'minecraft','SOOP OPEN 이터널 리턴':'eternal','그란투리스모 7':'gt7','신호등':'vrchat','제8회 상황극 콘테스트':'vrchat','에고시의 검':'vrchat',
      '그냥 살아!':'alive','제9회 상황극 콘테스트':'vrchat','버츄얼 파이터':'vrchat','VR챗 축구 대전':'vrchat','왁타버스 래프팅 대회':'vrchat',
      '왁타버스 사이클 대회':'cycle','나만 아니면 돼':'climbing','왁타버스 배틀크러쉬':'battlecrush','VRChat 촉각슈트 동아리':'vrchat',
      '왁타버스 체육대회':'sports','마왕 재활센터':'vrchat','왁이큐':'vrchat','제1회 버츄페 어워드':'vrchat','제1회 릴동파':'vrchat',
      'WBD 왁타버스 야구 대회':'vrchat','제6회 처니랜드 소대전투':'pubg','마인크래프트 지독서버':'minecraft','VR 비키니 비치발리볼 대회':'vrchat',
      '버츄얼 육상 선수권 대회':'vrchat','지육대':'vrchat','아르마 3 랜덤 가챠 고지전':'arma3','릴파 버추얼 복싱 대회':'vrchat',
      '2024 SOOP 스트리머 대상':'award2024','2025 SOOP 스트리머 대상':'award2025','천타버스 대 털즈란 VR 야구전':'vrchat','레귤러원 F1 시즌 2':'f1','제2회 릴동파':'vrchat',
      '제3회 버종리 VR 겟투워크':'vrchat','브산동':'vrchat','이터널 리턴 「이리야 어서와」':'eternal','STALZONE 크루대전':'stalzone',
      'SBO 야구 대회':'vrchat','와우 포에버':'wow'
    };
    const artFor=r=>recordArt[r.year+' '+r.name]||recordArt[r.name]||(/배그/.test(r.name)?'pubg':/파블로프/.test(r.name)?'pavlov':null);
    const descriptions={
      '그란투리스모 7':'2022년 4월 2일, 레이싱 게임 그란투리스모 7의 와크-무런 대회 4강에 Team 신짱게이밍 소속으로 출전했다. 데이토나 코스에서 개인 1위를 기록했고, 팀은 최종 3위에 올랐다.',
      '신호등':'아이네의 이무진 신호등 커버 뮤직비디오 제작에 총감독으로 참여했다. VRChat을 활용해 뮤직비디오의 연출과 아바타 제작, 카메라, 몸연기를 맡았다.',
      '제8회 상황극 콘테스트':'VRChat 상황극 작품 낙화에 출연했다. 현수 역의 움직임을 직접 몸연기로 표현하며 작품 제작에 참여했다.',
      '에고시의 검':'VRChat을 활용한 단편영화 콘테스트 출품작 에고시의 검에서 캐릭터의 움직임을 몸연기로 표현했다.',
      '그냥 살아!':'고멤가요제 참가팀 김피탕&짬뽕의 곡 그냥 살아!에서 팀 감독을 맡아 VRChat으로 제작된 뮤직비디오에 참여했다.',
      '제9회 상황극 콘테스트':'VRChat으로 제작된 두 상황극 작품에 몸연기로 참여했다. 실종에서는 신형식 역을, PUNK: Shutdown에서는 레브 역을 맡았다.',
      '버츄얼 파이터':'우왁굳이 주최한 VRChat 복싱 대회다. 6월 2일 국가대표 선발전을 통해 굳가대표로 선발되어, 6월 4일 한일 이벤트전에서 한국 팀 대표로 출전했다.',
      '왁타버스 배그 대잔치':'배틀그라운드 대회에서 마다옴과 듀오를 이루어 출전했고 한 라운드에서 우승했다.',
      'VR챗 축구 대전':'VRChat에서 풀트래킹으로 직접 공을 차는 축구 대회다. 별 부수는 마단을 이끄는 팀장으로 7월 16~17일 출전해 팀 준우승을 기록했다.',
      '왁타버스 래프팅 대회':'VRChat 래프팅 대회에 마피아지 팀 소속으로 참가했다.',
      '왁타버스 사이클 대회':'VRChat에서 진행된 사이클 대회에 선수로 출전했다. 대회를 준비하는 과정에서 VR 멀미 극복 투어도 진행했다.',
      '왁타버스 배그 삼국지':'배틀그라운드로 진행된 왁타버스 삼국지 대회에 출전해 개인 종합 순위 3위를 기록했다.',
      '나만 아니면 돼':'암벽등반 게임 A Difficult Game About Climbing으로 진행된 대결에서 1위에 올랐다.',
      '왁타버스 배틀크러쉬':'배틀크러쉬 대회에 현지인즈 팀으로 출전해 팀 종합 우승을 차지했다. 최초 하드캐리 상과 최다 하드캐리 상도 수상했다.',
      'VRChat 촉각슈트 동아리':'주르르가 주최한 VRChat 촉각슈트 동아리에서 교관을 맡았다.',
      '왁타버스 체육대회':'VRChat으로 구현된 종목별 체육대회에서 버스터콜 소속으로 팀 종합 우승을 차지했다. 권총 사격과 조정에서 금메달을 획득했고 개인 공동 1위에 올랐다.',
      '2024 마왕 재활센터':'VR 운동을 주제로 한 정기 방송 콘텐츠인 마왕 재활센터의 운영을 시작했다.',
      '왁타버스 배그 티어게임':'제2회 배틀그라운드 티어게임에 참가해 한 라운드를 우승했다.',
      '왁이큐':'VRChat에서 진행된 왁이큐 배구 대회에 사형선고 팀 소속으로 참가했다.',
      '제1회 버츄페 어워드':'VRChat에서 열린 버추얼 연말 페스티벌의 첫 어워드에서 올해의 섹시상을 공동 수상했다.',
      '2024 SOOP 스트리머 대상':'2024 SOOP 스트리머 대상 시상식에서 수상자 인터뷰에 참여했다. 기존 자료에서는 수상 부문의 세부 명칭을 확인할 수 없다.',
      '제1회 릴동파':'릴파가 주최한 VRChat 동계 스포츠 대회에 죠뗌므 소속으로 출전해 팀 종합 우승을 차지했다. 개인은 금메달 2개와 은메달 1개로 공동 1위를 기록했고 본선 최다 진출상과 개인 메달 1위상도 받았다.',
      'WBD 왁타버스 야구 대회':'VRChat 야구 대회에 로얄 버팔로즈의 선발투수로 출전해 8강 승부치기에서 팀이 승리해 4강에 진출했다.',
      '제6회 처니랜드 소대전투':'배틀그라운드로 진행된 처니랜드 소대전투에 저격병으로 참가했다. 소속된 HONOR 진영이 승리했다.',
      '마인크래프트 지독서버':'마인크래프트 지독서버에서 다이아몬드를 채집하는 부문에 참여해 3위를 기록했다.',
      'VR 비키니 비치발리볼 대회':'VR 비치발리볼 대회에서 마다옴, 예다, 양도끼와 함께 팀을 이루어 우승했다.',
      '2025 마왕 재활센터':'기존 VR 운동 콘텐츠인 마왕 재활센터를 위한 VRChat 전용 맵을 개장했다.',
      '버츄얼 육상 선수권 대회':'VRChat 육상 대회에 악성코드 팀 소속으로 출전해 은메달 2개와 동메달 1개를 획득했다.',
      '지육대':'털즈란 소속으로 대회를 준비하는 선수들을 지도하는 팀 코치를 맡았다.',
      '아르마 3 랜덤 가챠 고지전':'군사 전술 게임 Arma 3로 진행된 랜덤 가챠 고지전에 참가했다. 한결을 잡아 퍼스트 킬 상을 수상했다.',
      '릴파 버추얼 복싱 대회':'릴파 주최 버추얼 복싱 대회에서 천양 팀의 코치를 맡았고, 해당 팀이 우승했다.',
      '2025 SOOP 스트리머 대상':'2025 SOOP 스트리머 대상 시상식에서 올해의 스트리머로 선정되어 수상했다.',
      '천타버스 대 털즈란 VR 야구전':'천타버스와 털즈란의 VR 야구 대결에서 털즈란 팀 코치를 맡았다.',
      '레귤러원 F1 시즌 2':'F1 25로 진행된 레귤러원 시즌 2 레이싱 대회에서 킥자우버 팀으로 출전했다. 개인 순위 4위를 기록했고 팀 종합 우승을 차지했다.',
      '제2회 릴동파':'2월부터 3월에 걸쳐 열린 릴파의 두 번째 동계 스포츠 대회에 꼭따라이 팀으로 참가해 봅슬레이 종목에서 은메달을 획득했다. 왁체대, 제1회 릴동파, 버육대, 제2회 릴동파에서 획득한 개인 메달은 금 4개, 은 5개, 동 1개로 총 10개다.',
      '파블로프 VR 대전쟁':'VR 슈팅 게임 Pavlov를 사용하는 VR 대전쟁 콘텐츠를 주최했다.',
      '릴동파 배그 대회':'배틀그라운드 스쿼드 대회에 참가해 첫 번째 라운드에서 우승했다.',
      '제3회 버종리 VR 겟투워크':'VRChat의 겟투워크 맵을 활용한 제3회 버종리 대회에 참가해 1위를 차지했다.',
      '브산동':'기존 재활센터 콘텐츠를 VR 산책 동아리의 형태로 개편해 운영했다.',
      '이터널 리턴 「이리야 어서와」':'이터널 리턴 콘텐츠 이리야 어서와에 참여해 코렛트가 선정한 MVP로 뽑혔다.',
      'STALZONE 크루대전':'STALZONE 크루대전에 환승센터 팀 소속으로 참가해 팀 준우승을 차지했다.',
      '제2회 파블로프 VR 대전쟁':'Pavlov VR 대전쟁의 두 번째 대회를 주최했다.',
      'SBO 야구 대회':'무파 자이언츠 포수로 출전했다. 타요 스타포스와의 친선전에서는 3번 타자로 나서 4회에 2루타를 쳤다.',
      '와우 포에버':'월드 오브 워크래프트 와우 포에버를 플레이했다. 당시 방송 제목에 전사 1위라고 기록되어 있으며, 순위의 구체적인 집계 기준은 확인되지 않았다.',
      '왁타버스 최대 도움상':'왁타버스 활동에 기여한 공헌을 인정받아 최대 도움상을 받은 기록이다.',
      '이세계아이돌 VR 자문':'이세계아이돌 관련 VR 콘텐츠에 필요한 기술 지원 및 자문을 제공했다.',
      '다양한 VR 게임 플레이':'여러 해에 걸쳐 다양한 VR 게임을 플레이하고 관련 콘텐츠를 진행했다.',
      '파블로프 VR 대회 5회 운영':'Pavlov VR을 활용한 교육과 대회를 운영한 기록으로, 총 다섯 차례의 대회 운영 경력이 남아 있다.'
    };
    const norm = s => s.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
    const rows = [];
    for (const group of source.querySelectorAll('.career-year')) {
      const year = group.querySelector('summary').textContent.replace('년','');
      for (const month of group.querySelectorAll('.career-month')) {
        for (const li of month.querySelectorAll('li')) {
          const name = li.querySelector('strong').textContent;
          const info = li.querySelector('p').textContent;
          const tags = [...li.querySelectorAll('.career-tags span')].map(el=>el.textContent);
          const date = month.querySelector('h3').textContent;
          const [headline, context, caption, extra] = presentation[year+' '+name] || presentation[name] || [li.dataset.achievement || name,'',name,''];
          const synonyms = aliases.filter(([re])=>re.test(name)).map(([,alias])=>alias);
          const media=art[artFor({year,name})];
          rows.push({id:rows.length,year,date,month:parseInt(date),name,info,tags,headline,context,caption,extra,
            terms:norm([year,date,name,info,headline,context,extra||'',...tags,caption,media?.[0]||'',...synonyms].join(' '))});
        }
      }
    }
    const years = [...new Set(rows.map(r=>r.year))];
    const dated = rows.filter(r=>Number.isFinite(r.month));
    const byYear = y=>rows.filter(r=>r.year===y);
    const reduced = ()=>window.mwsMotionReduced?.()??false;
    const node = (tag, cls, value) => {
      const el=document.createElement(tag);
      if(cls)el.className=cls;
      if(value!=null)el.textContent=value;
      return el;
    };
    const button = (cls,label,action) => {
      const b=node('button',cls,label); b.type='button'; b.addEventListener('click',action); return b;
    };
    const panel=node('div','cv-panel');
    const bar=node('div','cv-bar');
    const barHost=node('div','cv-bar-host');barHost.append(bar);
    const toolbar=node('div','cv-toolbar');
    const info=node('div','cv-summary');
    const count=node('strong','',dated.length+'개 기록');info.append(count);
    const searchBox=node('div','cv-searchbox');
    const query=node('input','cv-search');
    query.type='search'; query.placeholder='전체 기록 검색'; query.setAttribute('aria-label','전체 타임라인 검색');
    const toggle=button('cv-result-toggle','검색 결과',()=>{results.hidden=!results.hidden;toggle.setAttribute('aria-expanded',String(!results.hidden));});
    toggle.hidden=true; toggle.setAttribute('aria-expanded','false');
    const clear=button('cv-clear','검색 지우기',()=>clearSearch(true)); clear.hidden=true;
    const exportButton=button('cv-export','',()=>{
      const lines=matches().map(r=>{
        const date=r.year==='레거시'?'시기 미상':r.year+'.'+String(r.month).padStart(2,'0');
        const result=r.headline===r.name?'':r.headline;
        return date+'  '+r.name+(result&&result!==r.name?' - '+result:'');
      });
      if(!lines.length)return;
      const url=URL.createObjectURL(new Blob(['\uFEFF',lines.join('\r\n')+'\r\n'],{type:'text/plain;charset=utf-8'}));
      const link=document.createElement('a');
      link.href=url;link.download='마왕_업적_타임라인.txt';
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    exportButton.title='현재 기록을 텍스트로 저장';
    exportButton.setAttribute('aria-label',exportButton.title);
    exportButton.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg>';
    searchBox.append(query,toggle,clear,exportButton);
    toolbar.append(info,searchBox);
    const nav=node('nav','cv-overview'); nav.setAttribute('aria-label','전체 연도 위치');
    const results=node('div','cv-results'); results.hidden=true;
    results.setAttribute('aria-label','검색 결과');
    toolbar.insertBefore(nav,searchBox);bar.append(toolbar,results);
    const axis=node('div','cv-axis'); axis.setAttribute('role','region');axis.setAttribute('aria-label','연속 업적 타임라인');
    const legacy=node('section','cv-legacy'); legacy.setAttribute('aria-label','레거시 기록');
    const empty=node('div','cv-empty','검색 결과가 없습니다.');empty.hidden=true;
    panel.append(barHost,empty,axis,legacy);section.append(panel);source.hidden=true;

    const entries=new Map(), markers=new Map(), yearButtons=new Map(), anim=[], months=[];
    let raf=0, attached=false, searchOrigin=null, pendingOrigin=null, selected=null, scrollRoot=null;
    let dirty=true, snapNext=true, lastFrame=0, lastBrowsePosition=0, restoreFrame=0;
    const motion=new Map();
    const clamp=(v)=>Math.max(0,Math.min(1,v));
    const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
    const getRoot=()=>{
      for(let el=panel.parentElement;el&&el!==document.body;el=el.parentElement){
        if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.clientHeight>0)return el;
      }
      return document.scrollingElement;
    };
    const scrollTop=()=>scrollRoot?.scrollTop||0;
    const setScroll=(top)=>{if(scrollRoot)scrollRoot.scrollTo({top,behavior:'instant'});};
    function tone(r){
      const s=r.headline+' '+(r.extra||'');
      if(/준우승|2위|은메달/.test(s)&&!/우승팀|종합 우승|팀 우승|공동 1위/.test(s))return 'silver';
      if(/우승|1위|금메달|대상|MVP|올해의|수상/.test(s))return 'gold';
      if(/3위|동메달/.test(s))return 'bronze';
      if(/감독|코치|교관/.test(s))return 'role';
      if(/제작|몸연기|주최|운영|개장|시작/.test(s))return 'creative';
      return 'neutral';
    }
    function makeCard(r){
      const entry=node('div','cv-entry'); entry.dataset.record=String(r.id);entry.dataset.tone=tone(r);
      const card=node('details','cv-card');
      const summary=node('summary','cv-record');
      const copy=node('span','cv-copy');
      copy.append(node('span','cv-headline',r.name));
      if(r.headline!==r.name)copy.append(node('span','cv-achievement',r.headline));
      if(r.context)copy.append(node('span','cv-context',r.context));
      if(r.extra&&!/미확인/.test(r.extra)&&r.extra!==r.info)copy.append(node('span','cv-extra',r.extra));
      summary.append(copy);
      const key=artFor(r),media=art[key];
      if(media){
        const cover=node('span','cv-media');cover.dataset.art=key;
        const image=node('img','cv-image');image.alt='';image.loading='lazy';image.decoding='async';image.src='assets/career-media/'+key+'.webp';
        image.addEventListener('error',()=>{image.hidden=true;cover.classList.add('cv-media-unavailable')},{once:true});
        cover.append(image,node('span','cv-media-label',media[0]));summary.classList.add('cv-with-media');summary.append(cover);
      }
      const detail=node('div','cv-detail');
      const meta=node('span','cv-detail-meta',[r.year==='레거시'?'':r.year+'년 '+r.date,media?media[0]:''].filter(Boolean).join(' · '));
      if(meta.textContent)detail.append(meta);
      detail.append(node('p','',descriptions[r.year+' '+r.name]||descriptions[r.name]||r.info));
      const detailsTags=r.tags.filter(t=>!t.includes('미확인'));
      if(detailsTags.length)detail.append(node('small','',detailsTags.join(' · ')));
      card.append(summary,detail);entry.append(card);entries.set(r.id,entry);
      anim.push(entry);
      card.addEventListener('toggle',()=>{schedule();detail.getAnimations?.().forEach(animation=>animation.cancel());if(card.open&&!reduced()&&!entry.hidden&&detail.animate){detail.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}});
      return entry;
    }
    for(const y of years.filter(y=>y!=='레거시')){
      const list=byYear(y);
      const year=node('section','cv-year');year.dataset.year=y;
      const heading=node('h2','cv-year-heading');heading.append(node('span','',y),node('small','',list.length+'건'));
      year.append(heading);axis.append(year);markers.set(y,heading);
      const mapButton=button('cv-map-year','',()=>jump(heading));mapButton.setAttribute('aria-label',y+'년 '+list.length+'건 위치로 이동');
      const mapLabel=node('span','cv-map-label');mapLabel.append(node('strong','',y));
      mapButton.append(mapLabel);nav.append(mapButton);yearButtons.set(y,mapButton);
      for(const m of [...new Set(list.map(r=>r.month))]){
        const records=list.filter(r=>r.month===m);
        const month=node('section','cv-month');month.dataset.month=String(m);month.dataset.year=y;
        const title=node('h3','cv-month-title',m+'월');month.append(title);months.push(month);
        for(let i=0;i<records.length;i+=2){
          const pair=node('div','cv-pair');pair.dataset.single=String(records.length-i===1);
          const left=makeCard(records[i]);left.classList.add(i%4===0?'cv-left':'cv-right');
          pair.append(left);
          if(records[i+1]){const right=makeCard(records[i+1]);right.classList.add(i%4===0?'cv-right':'cv-left');pair.append(right);}
          // Alternate single-record months without changing chronological DOM order.
          if(records.length===1){left.classList.toggle('cv-left',m%2===0);left.classList.toggle('cv-right',m%2!==0);}
          pair.append(node('i','cv-junction'));
          month.append(pair);
        }
        year.append(month);
      }
    }
    const legacyHead=node('h2','cv-legacy-heading','레거시');legacy.append(legacyHead);
    const legacyGrid=node('div','cv-legacy-grid'); legacy.append(legacyGrid);
    const legacyRecords=byYear('레거시');
    for(let i=0;i<legacyRecords.length;i+=2){
      const pair=node('div','cv-pair');
      const a=makeCard(legacyRecords[i]);a.classList.add('cv-left');a.dataset.legacy='true';pair.append(a);
      if(legacyRecords[i+1]){const b=makeCard(legacyRecords[i+1]);b.classList.add('cv-right');b.dataset.legacy='true';pair.append(b);}
      pair.append(node('i','cv-junction'));legacyGrid.append(pair);
    }
    const legacyButton=button('cv-legacy-link','레거시',()=>jump(legacyHead)); nav.append(legacyButton);
    const viewport=()=>{
      if(scrollRoot&&scrollRoot!==document.scrollingElement){const r=scrollRoot.getBoundingClientRect();return {top:Math.max(0,r.top),bottom:Math.min(innerHeight,r.bottom)};}
      return {top:0,bottom:innerHeight};
    };
    function readGeometry(){
      const root=getRoot();if(root!==scrollRoot){scrollRoot=root;snapNext=true;}
      if(!query.value.trim()&&!restoreFrame)lastBrowsePosition=scrollTop();
      const {top,bottom}=viewport(), h=bottom-top;
      const hostRect=barHost.getBoundingClientRect();
      const barHeight=bar.offsetHeight;
      const pin=hostRect.top<=top;
      const barBottom=(pin?top:hostRect.top)+barHeight;
      const activeTop=Math.max(top,Math.min(barBottom,bottom-80));
      const usable=bottom-activeTop;
      // The arrival zone is the lower half of the readable viewport, not the entire page.
      // An untransformed slot is the stable reference for both directions.
      const arrivalStart=activeTop+usable*.94;
      const arrivalEnd=activeTop+usable*.48;
      const travel=Math.max(120,arrivalStart-arrivalEnd);
      const scrollRange=Math.max(0,(scrollRoot?.scrollHeight||0)-(scrollRoot?.clientHeight||0));
      const distanceToEnd=Math.max(0,scrollRange-scrollTop());
      const tail=scrollRange>2?ease(1-distanceToEnd/Math.max(150,usable*.38)):1;
      const legacyTop=legacyHead.getBoundingClientRect().top;
      const compact=matchMedia('(max-width:700px)').matches;
      const pads=new Map([axis,legacyGrid].map(el=>[el,parseFloat(getComputedStyle(el).paddingRight)||0]));
      const states=anim.filter(entry=>!entry.hidden).map(entry=>{
        const r=entry.getBoundingClientRect();
        const height=entry.firstElementChild.open?entry.querySelector('summary').offsetHeight:r.height;
        const progress=ease((arrivalStart-(r.top+height/2))/travel);
        const p=Math.max(progress,tail);
        const parent=entry.closest('.cv-axis,.cv-legacy-grid');
        const width=entry.offsetWidth;
        const drift=((pads.get(parent)||0)+width*(compact?.18:.24))*(reduced()?.45:1);
        return [entry,p,r.bottom>=activeTop-120&&r.top<=bottom+120,drift,compact||entry.classList.contains('cv-right')?1:-1,compact];
      });
      let current=null;
      const visibleMarkers=[...markers].filter(([,marker])=>!marker.parentElement.hidden);
      for(const [y,marker] of visibleMarkers){if(marker.getBoundingClientRect().top<=activeTop+Math.max(70,usable*.35))current=y;}
      if(!current)current=visibleMarkers[0]?.[0];
      barHost.style.height=barHeight+'px';
      bar.style.setProperty('--cv-top',top+'px');
      bar.style.setProperty('--cv-left',hostRect.left+'px');
      bar.style.setProperty('--cv-width',hostRect.width+'px');
      bar.classList.toggle('cv-pinned',pin);
      for(const [entry,target,visible,drift,direction,compact] of states){
        const previous=motion.get(entry);
        const value=snapNext||reduced()||!visible||!previous?target:previous.value;
        motion.set(entry,{value,target,visible,drift,direction,compact,applied:previous?.applied});
      }
      const legacyActive=!legacy.hidden&&(legacyTop<=activeTop+usable*.48||distanceToEnd<=2);
      for(const [y,b] of yearButtons)b.setAttribute('aria-current',String(!legacyActive&&current===y));
      legacyButton.setAttribute('aria-current',String(legacyActive));
      snapNext=false;dirty=false;
    }
    function update(time){
      raf=0;
      if(!attached||document.hidden||!section.classList.contains('active')){lastFrame=0;return;}
      if(dirty)readGeometry();
      // A short, time-based damping filter makes discrete wheel notches flow smoothly.
      // No queued animations: new scroll input immediately replaces the target.
      const dt=lastFrame?Math.min(48,Math.max(1,time-lastFrame)):16;
      lastFrame=time;
      const alpha=1-Math.exp(-dt/35);
      let moving=false;
      for(const [entry,state] of motion){
        const delta=state.target-state.value;
        state.value=Math.abs(delta)<.004||!state.visible||reduced()?state.target:state.value+delta*alpha;
        moving||=state.value!==state.target;
        const next=state.value.toFixed(3);
        const key=[next,state.drift,state.direction,state.compact,reduced()].join(':');
        if(state.applied===key)continue;
        state.applied=key;
        if(entry.style.getPropertyValue('--cv-p')!==next)entry.style.setProperty('--cv-p',next);
        // Direct numeric transforms work even on browsers with incomplete CSS calc support.
        const v=state.value, drift=(1-v)*state.drift, rm=reduced();
        const card=entry.firstElementChild;
        card.style.transform=`translate3d(${(state.direction*drift).toFixed(2)}px,${(rm?0:(1-v)*(state.compact?24:28)).toFixed(2)}px,0) scale(${(rm?1:1-(1-v)*(state.compact?.18:.24)).toFixed(4)})`;
        card.style.opacity=rm?'1':(.22+.78*v).toFixed(3);
        entry.style.setProperty('--cv-drift',drift.toFixed(2)+'px');
        entry.style.setProperty('--cv-branch',String(clamp((v-.46)/.54)));
      }
      if(moving||dirty)raf=requestAnimationFrame(update);else lastFrame=0;
    }
    function schedule(){dirty=true;if(attached&&!raf&&!document.hidden)raf=requestAnimationFrame(update);}
    function jump(target,focus=false){
      scrollRoot=getRoot();
      const r=target.getBoundingClientRect(), v=viewport();
      // Header remains visible, and selected card lands in its fully attached region.
      const reserved=Math.max(76,bar.offsetHeight+24);
      snapNext=true;setScroll(scrollTop()+r.top-v.top-reserved);
      if(focus)target.querySelector('summary')?.focus({preventScroll:true});
      schedule();
    }
    function matches(){
      const tokens=query.value.trim().normalize('NFKC').toLowerCase().split(/\s+/).filter(Boolean);
      return rows.filter(r=>tokens.every(token=>{
        const t=norm(token), index={vr:1,'비vr':1,'게임':0,'비게임':0}[t];
        if(typeof index==='number')return norm(r.tags[index])===t;
        if(t==='우승')return r.terms.replaceAll('준우승','').includes(t);
        if(t==='코치')return r.terms.includes('코치')||r.terms.includes('코칭');
        return r.terms.includes(t);
      }));
    }
    function choose(r){
      results.hidden=true;toggle.setAttribute('aria-expanded','false');
      if(selected)entries.get(selected.id)?.removeAttribute('data-selected');
      selected=r;
      const entry=entries.get(r.id);entry.dataset.selected='true';jump(entry,true);
    }
    function filterTimeline(list){
      const ids=list&&new Set(list.map(r=>r.id));
      for(const [id,entry] of entries){
        entry.hidden=!!ids&&!ids.has(id);
        if(entry.hidden)motion.delete(entry);
        if(ids)entry.dataset.match=String(ids.has(id));else entry.removeAttribute('data-match');
      }
      for(const pair of panel.querySelectorAll('.cv-pair'))pair.hidden=!pair.querySelector('.cv-entry:not([hidden])');
      for(const month of months)month.hidden=!month.querySelector('.cv-entry:not([hidden])');
      for(const [y,marker] of markers){
        const visible=byYear(y).filter(r=>!ids||ids.has(r.id)).length;
        marker.parentElement.hidden=!visible;marker.querySelector('small').textContent=visible+'건';
        const b=yearButtons.get(y);b.disabled=!visible;b.title=visible?`${y}년 ${visible}건`:'검색 결과 없음';
      }
      legacy.hidden=!legacy.querySelector('.cv-entry:not([hidden])');legacyButton.disabled=legacy.hidden;
      axis.hidden=!axis.querySelector('.cv-entry:not([hidden])');empty.hidden=!ids||ids.size>0;
      exportButton.disabled=ids?.size===0;
      count.textContent=(ids?ids.size:dated.length)+'개 기록';
      snapNext=true;schedule();
    }
    function renderSearch(){
      const list=matches();
      panel.classList.add('cv-searching');
      if(selected)entries.get(selected.id)?.removeAttribute('data-selected');selected=null;
      filterTimeline(list);
      toggle.hidden=false;clear.hidden=false;toggle.textContent='목록';toggle.setAttribute('aria-expanded','false');
      results.replaceChildren(node('div','cv-result-count','검색 결과 '+list.length+'건'));
      for(const y of years){
        const found=list.filter(r=>r.year===y);if(!found.length)continue;
        const group=node('div','cv-result-group');group.append(node('h3','',y==='레거시'?y:y+'년'));
        for(const r of found){
          const b=button('cv-result','',()=>choose(r));
          b.append(node('span','cv-result-date',r.date),node('strong','',r.name),node('span','cv-result-info',r.headline===r.name?r.info:r.headline+' · '+r.context));group.append(b);
        }
        results.append(group);
      }
      if(!list.length)results.append(node('p','','일치하는 기록이 없습니다.'));
      results.hidden=true;
      if(list.length)jump(list[0].year==='레거시'?legacyHead:markers.get(list[0].year));
      else{scrollRoot=getRoot();setScroll(0);}
    }
    function clearSearch(restore){
      if(restoreFrame)cancelAnimationFrame(restoreFrame);restoreFrame=0;
      const origin=searchOrigin;
      query.value='';results.hidden=true;toggle.hidden=true;clear.hidden=true;panel.classList.remove('cv-searching');
      toggle.setAttribute('aria-expanded','false');
      if(selected)entries.get(selected.id)?.removeAttribute('data-selected');selected=null;
      filterTimeline(null);
      if(restore&&origin!==null){
        scrollRoot=getRoot();snapNext=true;setScroll(origin);
        // Re-expose the original month geometry before restoring a position that was
        // beyond the shortened, filtered scroll range. No queued restore survives input.
        restoreFrame=requestAnimationFrame(()=>{
          scrollRoot=getRoot();snapNext=true;setScroll(origin);
          restoreFrame=requestAnimationFrame(()=>{restoreFrame=0;scrollRoot=getRoot();snapNext=true;setScroll(origin);lastBrowsePosition=origin;schedule()});
        });
      }
      searchOrigin=null;pendingOrigin=null;schedule();
    }
    query.addEventListener('input',()=>{
      if(restoreFrame)cancelAnimationFrame(restoreFrame);restoreFrame=0;
      if(!query.value.trim()){clearSearch(true);return;}
      if(searchOrigin===null){scrollRoot=getRoot();searchOrigin=pendingOrigin??lastBrowsePosition;}
      renderSearch();
    });
    query.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();clearSearch(true);}});
    query.addEventListener('pointerdown',()=>{if(searchOrigin===null&&!query.value.trim()){scrollRoot=getRoot();pendingOrigin=scrollTop();}});
    query.addEventListener('focus',()=>{if(searchOrigin===null&&!query.value.trim()&&pendingOrigin===null)pendingOrigin=lastBrowsePosition;});
    const outside=e=>{if(!bar.contains(e.target)&&!results.hidden){results.hidden=true;toggle.setAttribute('aria-expanded','false');}};
    const observer=new ResizeObserver(schedule);
    const resize=()=>{
      if(!attached){
        attached=true;window.addEventListener('scroll',schedule,{passive:true,capture:true});
        window.addEventListener('resize',schedule,{passive:true});
        document.addEventListener('pointerdown',outside);
        window.addEventListener('mws-motion-change',schedule);observer.observe(panel);observer.observe(bar);
      }
      scrollRoot=getRoot();snapNext=true;schedule();
    };
    const suspend=()=>{
      if(!attached)return;attached=false;if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;snapNext=true;
      if(restoreFrame)cancelAnimationFrame(restoreFrame);restoreFrame=0;
      for(const entry of anim)entry.querySelector('.cv-detail').getAnimations?.().forEach(animation=>animation.cancel());
      window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);
      document.removeEventListener('pointerdown',outside);window.removeEventListener('mws-motion-change',schedule);observer.disconnect();
      bar.classList.remove('cv-pinned');barHost.style.removeProperty('height');
    };
    document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;lastFrame=0;if(restoreFrame)cancelAnimationFrame(restoreFrame);restoreFrame=0;for(const entry of anim)entry.querySelector('.cv-detail').getAnimations?.().forEach(animation=>animation.cancel());}else{snapNext=true;schedule();}});
    resize();
    return {resize,suspend};
  }
})();
