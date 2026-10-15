# MWS F1 통합 v1.1 수동 시험

구 피트 전략·QA API가 통합 엔진과 별도로 자동 피트를 요청하거나 피트 상태를 바꾸지 않도록 연결했다. 기존 통합 피트 수식과 물리·밸런스 수치는 유지한다. 이번 단계의 시작 개발 HEAD는 bd18e85db2dfc4b410e6a3b8a64d8b799cc781c3이다. Production은 변경하지 않았다.

## 직접 실행

Node.js 24에서 작업 브랜치를 선택하고 실행한다.

```sh
git switch f1-unified-redesign-v11-20261012
node scripts/serve-f1-unified-v11-preview.mjs
```

http://127.0.0.1:8766 을 열고 Public 선택 → Public 입장 → F1 레이싱으로 이동한다. 시험용 연락처 12명이 제공된다. 참가자·트랙·랩수를 선택하고 기존 그리드 연출이 끝나면 경기 시작을 누른다. 로컬 Public 세션에서 연락처를 수정할 수 있다. 실제 사용자 데이터나 Production에 쓰지 않으며 클라우드 저장·Admin API는 연결하지 않는다. Ctrl+C로 종료한다.

## 1단계 - 세계 좌표와 경로 물리

- SVG 길이를 트랙의 미터 길이에 대응시킨 중심선과 법선을 만든다. 실제 차량의 횡위치는 미터 단위로 적용한다.
- 차량 방향을 포함한 회전 사각형을 세계 좌표에서 검사한다. 길이 5.2m, 폭 2m, 총 여유 0.30m를 사용한다.
- 이동 구간을 반복 분할하고, 구간 내 이동·회전의 상한으로 사각형을 보수적으로 확장해 검사한다. 검사 해상도 안에서 해소하지 못한 근접도 안전 정지하며, 접촉 후 위치를 고치지 않는다.
- 안쪽·바깥쪽 경로와 횡이동의 길이 차이를 중심선 진행거리 환산에 연결한다. 타이어 마모에는 실행 경로 거리를 사용한다.
- 기존 원형 경로 곡률 계산이 실제 곡률의 절반이던 오류를 수정했다. 원의 곡률 1/R과 대조하는 회귀 검증을 추가했다.
- 후보 횡위치의 곡률·길이와 마찰 여유를 사용해 역방향 제동 및 정방향 가속 계획을 반복한다. ERS·필살기의 실행 가능 출력도 계획에 들어간다. 코너 속도 하한이나 순위 속도 보정은 추가하지 않았다.
- 상대가 감속 중 횡그립을 회복해 더 강하게 제동할 가능성을 반영한다. 가까운 곡선에서는 세계 좌표 간격을 사용한다. 속도 변경은 현재 가능한 제동량을 넘지 않는다.
- 출발 전 횡경로가 접히는지 검사하고, 접힌 경로는 TRACK_OFFSET_FOLD로 기록한다.
- 마왕 스피드 파크의 시작·종료 연결점과 무한 8자 서킷의 중앙 두 연결점에 있던 방향 불연속을 제어점 수정으로 없앴다. 7개 트랙의 ID·전체 구성·랩수·피트·마커 메타데이터는 유지했다.

## 2단계 - 줌과 링 기하

기존 링 크기와 기존 카메라 모드는 유지한다. 전체 보기에서도 차량을 숨기거나 옮기지 않는다.

새 버튼 ‘겹침 확인’은 가장 가까운 차량 쌍을 찾아, 현재 링을 분리할 수 있는 줌이 지원 범위 안에 있으면 그 줌으로 초점을 맞춘다. 최대 확대에서도 분리할 수 없으면 ‘확대 한계’라고 표시한다. 드래그·휠과 기존 전체·선두·상위권·배틀·자동 카메라는 사용할 수 있다.

`window.mwsF1UnifiedV11Report()`의 `screenFit`은 현재 줌, 현재 링 겹침 수, 가장 가까운 차량 쌍, 최소 필요 줌과 지원 가능 여부를 반환한다. 일시정지 중 카메라를 바꿔도 현재 줌의 겹침을 다시 계산한다. 누적 모니터 수치와 즉시 계산 결과를 구분한다. 카메라·링 계산은 차량의 위치·속도·난수·타이어·에너지를 변경하지 않는다.

## 실제 검증

```sh
node --check assets/f1-racing-v1.js
node --check assets/f1-track-v1.js
node scripts/qa-f1-unified-v11-smoke.mjs
```

현재 합성 결과: PASS. 12대, 480 시뮬레이션초, 확정 추월 16회. 현재 원형 fixture의 코너 단계는 STRAIGHT이며, 자연 실수 단계별 검증은 별도의 명시적 단계 fixture에서 수행한다. 이 추월 횟수는 실제 경기 밸런스 결론이 아니다. 배열 역순 동치, 정확히 40% 잔량의 자동 피트 금지, 에너지·마모 범위 확인 포함.

회귀 검증: 두 축 접촉 구간, 랩 차이 차량, 실패 스텝 상태 복원, 정지·재개, 실제 에너지, 필살기 시작·페이드·피트 분리, 정지 장애물, 연출 어댑터 3명 연계, 결승선 통과시각, 안쪽 경로 길이, 회전 사각형, 고속 세계 좌표 접촉, 줌 분리 가능·불가능 판정, 계획 후 필살기 출력 통과.

```sh
npm install --no-save playwright
MWS_CHROME_PATH=/path/to/chrome node scripts/qa-f1-unified-v11-real-tracks.mjs
MWS_CHROME_PATH=/path/to/chrome node scripts/qa-f1-unified-v11-browser.mjs
```

실제 Chromium의 SVG 경로를 사용한 7개 트랙 각각의 12대·30초 시험: PASS. 모든 트랙에서 해당 시험의 물리 오류 0건. 경로 방향 배율의 최소값은 마조쿠 링 0.8892, 캐슬 스트리트 0.6297, 블루 코스트 0.9736, 마왕 스피드 파크 0.7495, 로열 스트리트 0.6882, 무한 8자 0.8770, 하이랜드 0.9168로 양수다. 현재 이 시험은 실제 SVG와 기존 코너 기하·단계 함수를 사용한다. 피트·해설·UI 어댑터는 격리용 stub이므로 실제 UI 검증과 구분한다.

실제 UI 검증은 별도로 로컬 Public fixture 및 실제 Worker 로딩 변환을 사용한다. FHD·QHD, 12대 시작, 프로필 마커 구조, 정지·재개, 4개 카메라 모드 전환 중 물리 불변, 새 겹침 확인 버튼, 구 적분기 중복 호출 차단, 실제 피트 서비스·타이어·온도·HUD, 기존 강제 종료 시험 API를 사용한 포디엄 3자리, 새 경기 참가자 유지가 확인 대상이다. Production 인증·저장 API 검증은 아니다. 피트 서비스 단위 시험은 명시적인 PIT_BOX 초기조건을 사용한다. 별도의 12대 피트 여정 시험은 피트 진입 400m 전부터 120m 간격, MEDIUM·마모 .1·100도·예열 계수 1·차량별 고정 난수 상태의 명시적 초기조건으로 실행하며, 실제 엔진과 피트 어댑터로 진입·정차·서비스·랩 경계를 넘는 출구·합류를 검증한다. 시험 초기조건 설정은 QA에만 있으며 실제 경기 이동에는 사용하지 않는다. 선택 환경변수 MWS_QA_SCREENSHOT으로만 스크린샷을 저장한다.

## 이전 단계 - 검지선과 피트 여정

- 추월 자격은 실제로 커밋된 검지선 통과 스텝의 보간 시각으로 판정한다. 같은 검지선·같은 랩의 먼저 통과한 차량과 1초 이내일 때만 자격이 생긴다. 거리÷현재 속도 방식은 통합 경로와 기존 공개 어댑터 모두에서 사용하지 않는다.
- 검지선이 .992이고 시작이 .018인 경우처럼 랩 경계를 넘는 구간을 누적 진행도로 연결한다. 시작 전에 추월 공력은 켜지지 않으며, 종료·피트·기록 없는 다음 랩에서 꺼진다. 출발 시 통과 기록이 없으면 자격을 만들지 않는다.
- 기존 추월 공력 4%와 견인 포함 최대 12% 항목이 기록 기반 상태를 읽는다. 기존 공력 표시의 400ms 전환을 유지한다. 보고서의 timingGates에 차량별 검지선 시각·구간·자격을 추가했다.
- 피트 진입 제한과 박스 정차를 통합 제동 계획에 넣었다. 가능한 제동력 안에서 목표 속도를 추종하고, 실제 속도가 0이며 박스 부근에 있을 때만 서비스가 시작된다. 어댑터가 속도를 갑자기 0으로 쓰는 경로를 차단했다.
- 서비스 이후 기존 타이어·온도·HUD와 PIT_LANE → PIT_EXIT → TRACK 흐름을 사용한다. 피트 요청 전에 선택한 주행선도 복구한다. 자동 피트는 마모 .60 이하에서 금지하고 수동 요청은 유지한다.
- 자동 피트 판단의 고정 손실값을 진입 감속·제한속도 구간·박스 정차와 재가속·출구 합류·차가운 타이어의 예상 손실 합계로 바꿨다. 이는 예상 비용이며 실제 경기 밸런스 측정값이 아니다.

이전 검지선·피트 단계의 검증 기록: 문법·합성 회귀 PASS, 실제 SVG 7개 트랙 각각 30초 PASS, Chromium UI 및 피트 여정 PASS. 당시 피트 여정은 56.24 시뮬레이션초, 진입 속도 80km/h, 박스 정차 속도 0, 박스 위치 변화 0m, 최대 관측 가감속 21.45m/s², HARD 교체 1회, 기존 OUTSIDE 주행선 복구, 물리 정지 0건이었다. 이 여정의 초기조건은 위에 명시한 QA 조건이다.

수동 시험에서는 기존 피트 버튼으로 타이어 교체를 요청하고 진입 감속·박스 정차·복귀를 관찰한다. window.mwsF1UnifiedV11Report의 timingGates와 기존 추월 표시를 함께 보면 검지선 기록과 실제 활성 구간을 확인할 수 있다. 전체 보기의 링 기하 제약과 기존 카메라는 이전 단계와 같다.

## 이전 단계 - 예열·실수·LIVE 및 저속 회전 연결

- 기존 피트 예열 계수 .90~1이 통합 그립에 반영되지 않던 누락을 수정했다. 실제 가속·제동·코너 계획이 같은 그립을 읽는다. 기존 온도·마모·S/M/H 계수는 유지한다.
- 언더스티어 .91 계수를 공통 그립에 연결하고, 코너 계획에서 별도로 적용하던 항목은 제거해 중복 적용을 막았다. 실수 효과가 끝나면 공통 그립도 복구된다.
- 자연 실수는 기존 코너 단계에서 BRAKING → LOCKUP, TURN_IN/APEX → UNDERSTEER, EXIT → EXIT_ERROR로 연결한다. 직선과 피트에서는 해당 자연 이벤트를 생성하지 않는다. 확률 계수·효과 지속시간·재발 대기시간은 그대로다.
- 공개 실수 발생·조회·갱신 API는 통합 이벤트와 시계를 사용한다. 구 타이머를 감산하거나 구 속도 배율·횡위치 보정을 다시 적용하지 않는다. 강제 실수 QA API는 실수 상태만 등록하며 위치·속도를 쓰지 않는다.
- LOCKUP/EXIT_ERROR를 기존 해설의 LOCK_UP/OVERSTEER 이름에 대응시켰다. 순번을 함께 전달해 짧은 실수가 250ms 해설 갱신 전에 종료되거나 같은 종류가 다시 발생해도 이벤트를 읽을 수 있다. 기존 LIVE 중복 억제·표시 간격은 유지한다.
- 저속 제동 중 횡변위÷이동거리의 순간 방향을 그대로 차체 방향으로 사용해 급회전하던 문제를 수정했다. 경로 접선의 변화와 조향 변화를 구분하고, 조향 변화량을 실제 경로 이동거리÷차체 길이로 제한한다. 정지 중 차체가 회전하지 않으며, 위치·속도·차체 크기는 이 처리에서 수정하지 않는다. 이는 현재 모델의 조향 제한이며 실제 F1 조향 계측값이라는 의미가 아니다.
- 확정 추월 기록에 실제 추월 대상 ID를 남겨, 해설이 현재 앞차를 잘못 지칭하는 경우를 방지했다. 보고서 incidents에 현재 실수·남은 종료시각·순번·그립·예열을 추가했다.

추가 회귀 검증: 예열/언더스티어 배율과 만료, 실수 단계 선택, 피트 차단, 공개 어댑터의 시계·물리 불변, 실제 냉간 가속·제동 차이, 종료된 짧은 실수와 반복 실수의 해설 기록, 실제 추월 대상 전달, 정지·저속 조향 변화 상한이 PASS다. 현재 합성 12대·480초 시험은 추월 14회이며 배열 역순 동치·물리 오류·에너지·마모 검사를 통과했다.

실제 SVG 7개 트랙 각각 30초 시험도 PASS다. Chromium에서는 명시적 언더스티어 이벤트가 진단·그립·기존 LIVE 기술 해설에 연결되고, 조회 어댑터가 위치·속도·타이머를 변경하지 않는 것을 확인했다. 기존 정지·재개·카메라·피트·포디엄·참가자 유지 시험도 함께 수행한다.

상태를 이어받는 추가 시험에서 저속 회전 접촉을 재현했고 실제 경로의 캡처 상태를 회귀 시험에 추가했다. 기존 순간 방향을 사용하면 접촉 true, 새 차체 조향 적분에서는 접촉 false다. 이 사례의 스텝 차체 회전은 약 .275rad에서 .00111rad로 줄었다. 변경 후 INHERITED 피트 여정은 56.32 시뮬레이션초에 복귀했고 박스 위치 변화·물리 정지는 0건이었다.

최종 FIXED 피트 여정은 56.26 시뮬레이션초, 진입 속도 80km/h, 최대 관측 가감속 24.76m/s², 박스 위치 변화 0m, HARD 교체·OUTSIDE 복귀, 물리 정지 0건으로 PASS다. 마지막 문법 검사·합성 회귀·실제 SVG 7개 트랙·Chromium 기본 UI 시험도 PASS다.

기본 피트 여정은 FIXED 초기조건을 사용한다. 이전 경기의 예열·마모·난수·실수 상태를 이어받는 추가 점검은 MWS_QA_PIT_INITIAL_STATE=INHERITED로 별도 실행할 수 있으며, 실행 결과를 고정 초기조건 결과와 구분한다. 이 선택은 QA에만 존재한다.

## 이전 단계 - 코너 주행선·다차량 통로

- 통합 일반 주행의 횡목표가 계속 중앙 0m이던 누락을 수정했다. 기존 idealRacingLineOffsetV343의 순수 기하 함수만 사용해 아웃–인–아웃 목표선을 트랙 표본에 저장한다. 기존 속도 하한·가감속 배율·4레인 강제 분산 함수는 호출하지 않는다.
- 일반 주행·추종 상태는 해당 코너 목표를 읽고, 공격 중의 짧은 의도 유지와 수동 주행선·피트 목표는 유지한다. 목표는 실제 횡속도·횡가속·jerk 제한을 거쳐 통합 엔진이 적분한다. 화면에만 오프셋을 주거나 위치를 덮어쓰지 않는다.
- 코너 속도 계획에도 미래 아웃–인–아웃 경로를 반영한다. 횡이동 가능량 안에서 경로를 전개하고 기존 역방향 제동·정방향 가속과 물리 그립을 사용한다.
- 공격 후보에 가운데 0m 통로를 추가했다. 앞차와 같은 통로를 공격 경로로 선택하지 않으며, 각 후보를 다른 차량 모두와 대조한다. 특정 두 차량에 경쟁을 독점시키는 연결은 추가하지 않는다.
- 후보 통로·병렬 상태·합류 판단은 실제 방향을 가진 차체의 횡투영과 여유 폭을 읽는다. 예를 들어 평행 직선 차체의 필요 중심 간격은 현재 2.3m다. 폭 10m 트랙의 중심 후보 0m와 양쪽 ±2.5m의 기본 선택도 별도 검증한다. 모든 곡선에서 3열이 가능하다는 의미는 아니다.
- 근처 차량의 차체 폭을 가로지르는 합류는 목표를 현재 실제 횡위치로 유지하고 기존 횡감속 적분으로 기다린다. 이 판단에는 정차 중인 피트 차량도 포함한다. 기존 충돌 검사는 모든 후보 스텝을 검증하고, 종방향 속도는 기존 통합 물리 제약이 담당한다. 간격 고정이나 강제 순위 변경은 사용하지 않는다.
- 보고서 lanes는 actual·ideal·target·state·blocked를 반환하고, worldGeometry.idealLineRange는 캐시된 목표선 범위를 보여준다.

추가 검증: 왼쪽·오른쪽 원형 경로에서 목표와 실제 아웃–인–아웃 이동, 스텝 횡변위 상한 .05m, 정차 피트 차체를 향한 합류 보류, 가운데 차량이 양쪽 차량을 실제로 추월하는 12초 합성 사례와 배열 역순 동치, 폭 10m의 가운데 후보 선택이 PASS다. 장시간 밸런스 조정이나 강제 순위 시험이 아니다.

기존 12대·480초 합성 회귀는 PASS이며 확정 추월 16회였다. 실제 7개 SVG 트랙의 각 12대·30초 시험은 이번부터 실제 코너 단계와 목표선 캐시를 사용하며, 모두 PASS다. 각 트랙의 캐시에 중앙 이외 목표가 있고 해당 실행의 물리 오류가 없음을 확인했다. 이전 상태를 이어받는 Chromium 피트 여정은 55.82 시뮬레이션초에 복귀했고 박스 위치 변화·물리 정지는 0건이었다. 최종 FIXED 여정은 56.00 시뮬레이션초에 HARD 교체·OUTSIDE 복귀를 완료했고 박스 위치 변화·물리 정지는 0건이었다. FHD/QHD·정지/재개·카메라·실수 해설 연결·포디엄·참가자 유지와 실제 UI의 목표선 캐시·차선 보고도 PASS다.

수동 시험에서는 단독 주행과 추월 중 주행을 나누어 관찰한다. lanes의 ideal이 코너 기하 목표이고 target은 현재 AI·합류 판단을 거친 목표다. 실제 y는 actual로 확인한다. 여러 차량이 가까이 있을 때는 안전한 공간이 생길 때까지 실제 경로가 이상선과 다를 수 있다. 기존 미리보기 실행법과 UI는 그대로다.

## 이전 단계 - 현재 모델 조회와 QA 연결

- specialEffectV401의 통합 분기는 실제 unifiedSkillPowerV11을 읽는다. 구 속도 보너스·가속 배율·연계 및 추월 후 출력 보정을 조회 결과에 섞지 않는다. 호환용 bonus/straight는 0, accel은 1이고 powerKW가 현재 가능한 물리 출력을 표시한다.
- 필살기 조회는 통합 엔진과 같은 10초 지속·마지막 1.5초 페이드를 사용한다. 피트·종료 차량은 가용 출력 0이다. specialTelemetryV401의 power에는 가용 출력 availableKW와 실행 출력 executedKW를 나눈다. 일시정지·컷인·비활성 상태에서는 과거 출력 필드가 남아 있어도 실행 출력 0을 보고한다.
- 후방 필살기 발생률과 타이어 마모에 따른 실수 발생률은 기존 수식을 공통 함수로 옮겼다. 실제 발생 루프와 진단이 같은 함수를 읽으며 계수는 변경하지 않았다.
- 기존 mwsF1QaSpecialV401과 mwsF1QaDynamicsContractV348은 통합 엔진에서 함수 문자열·구 수치 대신 현재 모델의 출력·페이드·S/M/H 그립과 마모·실수 발생률을 조회하고 검증한다. API의 scope와 allPass는 해당 읽기 전용 모델 계약을 뜻한다. 경기 밸런스나 실제 주행 전체를 통과했다는 뜻이 아니다. 실제 적분·충돌·컷인 어댑터·UI 검증은 별도의 스크립트 결과를 읽는다.
- 위험도 표의 ratePerSecond는 제동·코너 등 이벤트가 가능한 단계에서 사용하는 발생률이다. 현재 risk 필드는 같은 값의 호환 이름이다. 실제 경기의 발동 횟수는 이 표만으로 보장하지 않는다.
- 경기 스냅샷이 없으면 트랙 길이를 임의로 가정하지 않고 선형 검사 lineStatus를 Not available, linePass/allPass를 null로 반환한다. 모델 자체의 타이어·마모 검사 modelPass는 따로 반환한다.

```js
window.mwsF1QaSpecialV401()
window.mwsF1QaDynamicsContractV348()
window.mwsF1GetSpecialTelemetryV401()
```

추가 회귀 검증: 실제 조회 어댑터의 150kW 반감 페이드, 구 연계/추월 계수 미반영, 종료 차량 및 일시정지 중 실행 출력 0, 조회 중 차량·시계·난수 불변, 경기 없는 문맥의 Not available이 PASS다. 현재 모델의 마모 기본값은 SOFT .110, MEDIUM .085, HARD .060으로 실제 함수와 일치한다. 기본 물리·밸런스 계수는 이번 단계에서 튜닝하지 않았다.

Chromium에서는 실제 공개 QA API와 레이아웃 exact/persistence QA를 호출했다. 레이아웃 저장 성공, 다른 설정 저장 후 같은 배치 보존, 저장 배치 복원, 기존 배치로 되돌림, 패널 겹침 0, 차량·시계 불변이 PASS다. 레이아웃 구현은 변경하지 않았다. 저장 검증은 로컬 Public fixture의 F1 설정 저장·복원이며 Production 인증·클라우드 데이터 저장 검증은 아니다.

문법·12대 480초 합성·7개 실제 SVG 트랙 각 30초·Chromium 기본 UI 및 피트 여정은 PASS다. 합성 확정 추월은 16회였다. 이번 FIXED 피트 여정은 56.64 시뮬레이션초에 HARD 교체·OUTSIDE 복귀를 완료했고, 박스 위치 변화와 물리 정지는 0건이었다.

## 이전 단계 - 물리 설정 책임 통합

- UNIFIED_ENGINE_V11의 질량·구동 가속·제동·횡그립·트랙션·일반 및 공격 ERS 출력·추가 출력 상한을 실제 스텝과 미래 코너 계획에서 읽는다. 교통 제동과 피트 손실 추정도 같은 구동·제동 값을 읽는다. 회전 충돌의 이동 경계 반경도 고정 .15m 대신 설정된 clearance의 절반을 사용해 실제 차체 판정과 일치시킨다. 기본 숫자는 변경하지 않았다.
- 공기 저항의 기준 가속은 기존 식 그대로 drive를 읽는다. 미래 계획과 실제 스텝에서 같은 기준을 사용한다. 온도 부하의 18도, 트랙 폭 기본값 14m, 저속 계산 기준 등 다른 의미의 숫자는 물리 가속 설정으로 치환하지 않는다.
- ERS 용량은 차량 초기화의 잔량 상한, 제동 회수 상한과 배터리 진단 목표에 공통으로 반영한다. 상한을 넘는 잔량을 외부 QA에서 넣어도 음수 회수량을 기록하지 않도록 회수 가능한 공간을 0 이상으로 제한한다. 용량을 높여도 기존 초기 잔량을 자동 충전하지 않는다.
- mwsF1UnifiedV11Report의 physics는 실제 설정을 반환하고 simulationStepMs는 기존 시계의 고정 스텝을 반환한다. revision은 shared-physics-config-v11이다. dt .020은 기준 스텝 정보이며, 실제 적분은 전달된 stepMs를 사용한다. 기존 20ms 시계와 스텝 방식은 변경하지 않았다.
- 설정의 단위는 mass kg, drive/brake/lateral/traction m/s², specialPower/additionalPower W, baseBoostKW/attackBoostKW kW, ersCapacity MJ다. 새로운 수치 조정 UI나 실시간 물리 설정 API는 추가하지 않았다.

```js
window.mwsF1UnifiedV11Report().physics
window.mwsF1UnifiedV11Report().simulationStepMs
```

```sh
node scripts/qa-f1-unified-v11-config.mjs
```

새 QA는 별도 격리 fixture에서만 설정을 바꿔 질량·구동·트랙션·횡그립·제동·일반/공격 ERS·필살기·추가 출력 상한이 실제 가감속과 에너지에 반영되는지 확인한다. 피트 손실 추정의 설정 반영, 용량 상한과 음수 회수 방지도 확인한다. 이 시험 값은 앱 소스에 적용하지 않는다. baseline 인자를 생략하면 수정 전 비교는 Not available로 표시한다.

기본값의 수정 전 비교는 12대·120 시뮬레이션초에서 전체 차량 상태, 난수와 주행 기록이 정확히 일치했다. 문법 검사와 기존 12대·480초 합성 회귀는 PASS, 확정 추월 16회다. 실제 SVG 7개 트랙 각각 12대·30초도 PASS이며 물리 오류는 없었다.

Chromium 기본 UI의 FHD/QHD, 참가자·프로필, 정지/재개, 카메라, 실수 LIVE, 필살기 조회, 레이아웃 저장·보존·복원과 포디엄이 PASS다. FIXED 피트 여정은 56.32 시뮬레이션초에 HARD 교체·OUTSIDE 복귀를 완료했다. 진입 80km/h, 박스 속도 0과 위치 변화 0m, 최대 관측 가감속 26.32m/s², 물리 정지 0건이다. 이는 로컬 Public fixture의 기본 점검이며 Production 인증·클라우드 저장 및 Scheduler 전체 시나리오 검증 결과는 Not available이다. 해당 기능의 코드는 변경하지 않았다.

## 이전 단계 - 에너지·타이어 공개 API의 상태 변경 책임

- 정상 프레임의 simulateRaceStepV192는 기존대로 통합 엔진에 바로 전달된다. simulateVehicleDynamicsV196도 기존대로 통합 모드에서 물리 변경을 하지 않는다. 이번 감사에서는 별도로 공개된 mwsF1UpdateEnergySystemV201과 mwsF1UpdateTyreSystemV203이 구 배터리·마모 계산을 실행할 수 있음을 확인했다. 정상 주행에서 이 구 계산이 중복 실행된다는 의미는 아니다.
- 두 공개 갱신 API는 통합 모드에서 읽기 전용 상태를 반환한다. 요청한 stepMs로 배터리·온도·마모·시계를 적분하지 않는다. engine은 unified-v1.1이고 readOnly는 true다. 에너지 API의 호출별 harvestedMJ/deployedMJ/boostEnergyMJ는 0이며 powerUnitFactor는 중립값 1이다. 실제 누적 기록은 energyHarvestMJ/energyDeployMJ/totalBoostEnergyMJ에서 읽는다.
- mwsF1GetEnergyStatesV201도 같은 통합 조회를 사용한다. 일시정지·필살기 컷인·종료·피트 박스 정차·주행 루프 중단 중에는 실행 출력과 회수 출력이 0이다. 저장된 누적 사용량과 배터리 잔량은 보존한다. 목록 API의 기존 boostEnergyMJ는 누적 실제 추가 출력 사용량이며, 통합 모델에서 ERS 외에 실제 사용된 필살기 출력의 적분량을 뜻한다.
- mwsF1GetTyreStatesV203은 현재 그립 함수의 예열·온도·마모·언더스티어를 읽는다. 섭씨 temperatureC와 warmup/damage를 함께 반환한다. 통합 모델이 별도로 계산하지 않는 구 thermalDeg/graining/flatSpot/strategyPressure는 null이다. 해당 별도 모델 결과는 Not available이며 실제 계산값처럼 표시하지 않는다.
- 통합 스텝이 실제 제동 회수량을 energyHarvestLapMJ에 누적하고 랩 경계에서 초기화한다. 경계를 넘는 스텝은 해당 스텝의 회수량을 진행거리 비율로 나눠 새 랩 몫을 기록한다. 스텝 안에서 출력이 일정하다는 현재 적분 모델의 진단 방식이다. 구 세대의 랩별 회수 제한을 실제 물리에 적용하지 않는다.
- boostEnergyMJ는 실제 사용된 추가 출력 중 ERS 소비를 제외한 출력을 시간 적분해 누적한다. 이 진단 갱신은 충돌 검증 후 확정된 스텝에서만 수행한다. 새 에너지나 속도 보너스를 생성하지 않는다. 기존 타이어 교체·피트 서비스의 명시적 상태 변경 경로는 유지한다.

```js
window.mwsF1GetEnergyStatesV201()
window.mwsF1GetTyreStatesV203()
```

추가 합성 검증: 실제 에너지 소비·회수·필살기 사용량의 MJ 단위 계산, 랩 경계 회수량 분할, 큰 stepMs의 공개 갱신 요청에서 모든 차량 상태·시계·난수 불변, 현재 그립 조회, 정지·컷인·종료·피트 박스·주행 중단 출력 0이 PASS다. 설정 연결 QA는 baseline 인자 없이 PASS다. 과거 전체 객체 baseline 비교는 새 진단 필드도 비교하므로 이번 단계 이전 커밋과는 그대로 일치하지 않는다.

622ab78과의 별도 12대·120초 비교에서는 새 진단 energyLapNumber/energyHarvestLapMJ/boostEnergyMJ를 제외한 전체 차량 상태, 난수와 엔진 주행 기록이 정확히 일치했다. 문법 검사, 기존 12대·480초 합성 회귀는 PASS이며 확정 추월 16회다. 실제 SVG 7개 트랙 각각 12대·30초도 물리 오류 없이 PASS다.

Chromium에서는 실제 공개 API를 큰 stepMs로 호출하고 갱신 및 목록 조회 전후의 차량 전체 객체와 시계가 변하지 않는지 확인했다. FHD/QHD·프로필·참가자·카메라·정지/재개·실수 LIVE·필살기 조회·레이아웃 저장/복원·피트·포디엄이 PASS다. FIXED 피트 여정은 56.34 시뮬레이션초, 진입 80km/h, 박스 속도 0과 위치 변화 0m, HARD 교체·OUTSIDE 복귀, 최대 관측 가감속 26.34m/s², 물리 정지 0건이다. Production 인증·클라우드 저장·Scheduler 전체 시나리오 및 전체 경기 밸런스 결과는 Not available이다.

## 이번 단계 - 피트 전략 공개 API의 상태 변경 책임

- 정상 주행은 기존대로 unifiedPitV11에서 자동 피트를 판단한다. 별도로 공개된 구 evaluate/update 전략 API에는 다른 세대의 수식과 자동 요청 경로가 남아 있었다. 통합 모드의 mwsF1EvaluatePitStrategyV206/mwsF1UpdatePitStrategiesV206/mwsF1GetPitStrategyStatesV206은 이제 현재 통합 판단을 읽으며 요청·대기 타이머·차량 상태·난수를 변경하지 않는다.
- 기존 통합 피트 수식을 순수 unifiedPitPlanV11로 옮겼다. 실제 자동 피트와 공개 진단이 같은 후보 타이어·피트 손실·예상 이득을 읽는다. .60 이하 마모 자동 피트 금지, 남은 랩 1.1 미만 금지, 이득 1.5초 초과 조건과 기존 재평가 시각·난수는 유지한다. 수동 피트 요청 버튼과 실제 서비스 흐름은 그대로다.
- 통합 경로가 현재 경기의 초기화를 마치지 않았다면 available은 false, reason은 MODEL_NOT_INITIALIZED이며 비용·이득·남은 랩은 null이다. 조회를 위해 초기화하거나 이전 경기의 요청 이력을 섞지 않는다. 해당 예측은 Not available이다.
- 구 피트 전략 점수와 마지막 평가 랩은 통합 모델이 계산하지 않으므로 score/lastLap은 null이다. context의 pitLossSeconds/benefit/candidates는 모델 예측이며 실제 경기에서 계측한 정차 손실이나 밸런스 결론이 아니다. history는 통합 엔진에서 확정된 자동 요청 기록의 복사본이다.
- 구 mwsF1QaPitCycleV205는 통합 모드에서 실제 차량을 PIT_ENTRY/PIT_BOX 등으로 강제 전환하거나 즉시 서비스하지 않는다. 현재 상태만 반환한다. mwsF1QaPitStrategyV206도 구 가상 시나리오를 위해 차량의 진행률·마모를 덮어쓰지 않는다. 두 QA의 allPass는 null, status는 Not available이며 실제 여정 검증은 Chromium 스크립트에서 따로 수행한다.

```js
window.mwsF1GetPitStrategyStatesV206()
```

추가 합성 검증은 초기화 전 조회의 불변, 큰 stepMs의 전략 갱신과 두 QA 호출에서 차량·시계·난수·요청 수 불변, 이득이 있는 사례에서 조회와 실제 자동 요청의 타이어·이득 일치, 정확히 .60 마모의 자동 요청 금지, 막판 및 피트 없는 트랙의 보류를 확인했다. PASS다. 기본값 비교는 bd18e85의 12대·120초와 전체 차량 상태·난수·주행 기록이 정확히 일치했다.

문법 검사, 12대·480초 합성 회귀는 PASS이며 확정 추월 16회다. 실제 SVG 7개 트랙 각각 12대·30초도 물리 오류 없이 PASS다. Chromium의 공개 피트 API 불변·FHD/QHD·프로필·참가자·카메라·정지/재개·LIVE·필살기 조회·레이아웃 저장/복원·포디엄과 실제 수동 피트 여정이 PASS다. FIXED 여정은 56.44 시뮬레이션초, 진입 80km/h, 박스 속도 0과 위치 변화 0m, HARD 교체·OUTSIDE 복귀, 최대 관측 가감속 26.21m/s², 물리 정지 0건이다. 전체 경기 밸런스와 Production 인증·클라우드 저장·Scheduler 전체 시나리오 검증 결과는 Not available이다.

## 남은 범위

낮은 줌에서 기존 링 크기를 유지하며 가까운 모든 차량의 링 겹침을 0으로 만드는 것은 현재 표시 기하에서 불가능한 경우가 있다. 예를 들어 마조쿠 링은 14m 폭, SVG 표시 폭 42.9에서 1x 링 외곽 지름이 약 12.10m에 해당하지만, 차량 중심의 최대 횡차이는 9m다. 차량이나 링을 바꾸지 않으므로 전체 보기의 이 제약은 남는다. 새 카메라는 가능한 줌을 선택하거나 확대 한계를 알린다. 모든 줌에서 링 겹침 0을 보장하는 수정이라고 해석하지 않는다.

전체 7개 트랙 완주·다중 시드 밸런스·최저 줌 병렬 링·7개 트랙별 복수 차량 피트 여정의 전체 검증 결과는 Not available. 사용자가 경기 밸런스와 추가 수치를 직접 시험한다. 대규모 경기 시험을 이번 두 단계의 완료조건으로 요구하지 않는다.


## Unified v1.1 public legacy API ownership - 2026-10-13

- Active race frame: `raceFrameV189 -> simulateRaceStepV192 -> simulateUnifiedRaceStepV11`. The older loop is bypassed, even though its source remains.
- `mwsF1UpdateVisualLateralOffsetV258` is a read-only lateral snapshot in unified mode. It cannot integrate a second physical or display lane transition.
- `mwsF1UpdatePassStateMachineV208` is a read-only current-state listing in unified mode. It cannot modify lanes, passing AI, biases, or timers.
- Legacy lateral smoothing and V386 speed/emergency QA now return `Not available` and `allPass: null` when their legacy mechanisms are not running, instead of presenting source-string matches as active integration.
- The smoke script includes a public-API no-mutation regression. Full Node, real-track and Chromium tests remain separate from isolated validation. Production has not been changed by this work.


## Unified v1.1 legacy wake, pace, traffic, blue-flag API audit - 2026-10-15

- Active simulation still enters `simulateUnifiedRaceStepV11` before any old physics loop.
- Public `mwsF1UpdateSlipstreamStatesV198` and `mwsF1UpdateDirtyAirStatesV199` now read the unified position-based `unifiedAeroV11` wake, with no mutation of vehicles, clock, or random state. Values are null and `available: false` before the unified simulation initializes.
- Dirty-air `aeroGripMultiplier` is the unified lateral-acceleration factor. The old stand-alone `understeerRisk`, `slideRisk`, and `dirtyAirTyreHeatLoad` are not computed by the unified model and are null.
- `mwsF1UpdateDriverPaceStateV200` cannot advance legacy pace noise or RNG in unified mode.
- `mwsF1UpdateTrafficAndDefenceV207` returns its legacy compatibility state view without writing AI lane decisions. These older traffic fields are not authoritative unified physics telemetry.
- `mwsF1UpdateBackmarkerBlueFlagsV215` calculates a non-mutating classification in unified mode, and cannot override the unified lane or battle bias. It does not itself apply a blue-flag manoeuvre.
- `mwsF1QaTrafficV207` reports `Not available`, `integrated: false`, `allPass: null`; the legacy QA previously edited live vehicle positions and then attempted partial restoration.
- The synthetic smoke adds pre-initialization null availability, true aero correspondence, no-state-mutation and no-legacy-random-advance regressions. Full Node CLI and Chromium QA remain separate verification requirements.


## Unified v1.1 V274 / V275 / V303 legacy API ownership - 2026-10-15

- `raceFrameV189 -> simulateRaceStepV192 -> simulateUnifiedRaceStepV11` bypasses the legacy racing loop. V274 leader pressure, V275 chase burst and V303 catch-up bias updates are only called from that bypassed loop under normal race-frame execution.
- Direct legacy update calls now leave vehicle state, legacy and unified random streams, clock, timers, lateral intent and speed biases unchanged.
- `mwsF1UpdateLeaderPressureV274` and `mwsF1UpdateChaseBurstV275` return compatibility lists reporting `available:false` and unavailable legacy-only metrics as null.
- `mwsF1ApplyGameVariabilityV303` does not apply legacy catch-up or position bias and returns no legacy corrections in unified mode.
- Corresponding V274/V275/V303 QAs indicate `status:'Not available'`, `integrated:false`, `allPass:null`, avoiding false pass claims from validating disabled legacy tuning rules.
- The existing unified AI, actual pace/traction and special-skill cut-in remain unchanged. No complete-race tuning, Chromium validation or Cloudflare Production release is asserted.


## Unified v1.1 legacy micro-battle ownership and development QA - 2026-10-15

- The V278 micro-battle updater is called by the bypassed legacy `simulateRaceStepV192` body. The active unified step already records actual passes, incidents and commentary separately; direct V278 calls must not generate synthetic second-pass events.
- `mwsF1UpdateMicroBattleEventsV278` therefore returns an empty legacy-update list without mutating vehicle state, clock, RNG or micro-battle event maps under unified mode.
- `mwsF1GetMicroBattleEventsV278` retains its catalog, history and count keys for UI compatibility, and labels the old event ledger `available:false`, `readOnly:true`. It is not the active unified LIVE history.
- `mwsF1QaMicroBattleEventsV278` reports `Not available`, `integrated:false`, `allPass:null` in unified mode rather than marking a static legacy event catalog as active integration.
- Smoke adds an explicit invariant test for both vehicle state and all V278 event bookkeeping structures.
- A new branch-specific GitHub Actions workflow attempts full Node smoke, short real-SVG tracks, and baseline Chromium UI regression without touching the Cloudflare Production deploy workflow. Check its actual run status before claiming tests passed.


## Unified v1.1 legacy-only QA integration status - 2026-10-15

The active `simulateRaceStepV192` immediately delegates to `simulateUnifiedRaceStepV11`. Checking for a function name in a bypassed legacy function body does **not** verify active integration.

The following historical phase-level integration QAs now report `status:'Not available'`, `activeModel:'unified-v1.1'`, `integrated:false` and `allPass:null` while v1.1 is active: `qaTacticalPitValueV391`, `qaLateStintPitDeferralV393`, `qaCommittedPassLineV383`, `qaPhysicalClosureV386`, `qaSafeThirdPartyPitV384`, `qaCornerRetimingV382`, `qaSafePaceReleaseV385`, `qaPhysicalPassClearanceV371`, `qaFinalStintPitEconomicsV374`, `qaCornerPhysicsV375`, `qaMulticarCorridorV376`, `qaProjectedSafeFollowingV378`, `qaLongRunRearPaceV372`, `qaNeighborBrakingV381`, `qaPreemptivePassCorridorV379`.

- The old implementation and historical QA source remain present for compatibility; only the active v1.1 report path is qualified.
- Unified pit entry/service, physical collision handling, AI lanes, corners and tyre dynamics are not modified by this audit.
- The v1.1 smoke test invokes each guarded QA directly, making it impossible for these old source-string checks to report a false active-engine pass.
- Active rendering, shared pit service, special cinematic and marker/UI QAs are intentionally not blanket-disabled. They need live observational evidence instead of legacy-path source-string heuristics.
- This classification is not a substitute for finish-to-finish multi-seed balance validation or all-zoom marker overlap validation.


## Recovery H legacy diagnostic compatibility - 2026-10-15

The standalone `scripts/diagnose-recovery-h-f1-live.mjs` used historical `allPass === true` assertions even for legacy solvers already retired from the active unified path. These assertions could make the diagnostic fail for a healthy v1.1 run.

- The pre-existing assertions are preserved for an active or legacy QA result, but a report with `status: Not available`, `activeModel: unified-v1.1`, `integrated: false`, and `allPass: null` is explicitly classified as an inactive historical QA instead of a failure.
- All 34 affected assertions now use the same strict classifier. The diagnostic response exposes `unavailableLegacyQAsV11` listing the excluded reason codes.
- Actual errors, missing results, failed current-model checks, DOM overlap assertions and live telemetry checks are not exempted.
- A new Node contract test covers strict acceptance and rejection, verifies every guarded diagnostic assertion and runs in development-branch GitHub Actions.
- This does not convert the old full Recovery H diagnostic into a verified unified browser QA. Continue to use `qa-f1-unified-v11-browser.mjs` and real SVG tests for v1.1.


## Unified v1.1 active real-SVG physics invariants - 2026-10-15

- The seven-track Chromium real-SVG regression now runs 12 cars for 30 simulated seconds per track in both normal and reversed vehicle-array order. All final physical states, including energy, tyres and unified RNG, must match exactly.
- At each committed 20ms step, it rejects negative progress, nonfinite/negative path distance and path travel beyond the actual speed envelope plus a small lateral-movement allowance.
- It also checks every eligible on-track pair with the current unified world-space rotated-body overlap predicate, counts actual checked pairs, and requires zero physical overlaps. Energy, wear and world coordinates must remain within valid bounds.
- Unlike the retired V371/V375/V376/V378 source-string QA, these properties are measured on steps genuinely executed by `simulateUnifiedRaceStepV11`, using each real circuit's SVG geometry.
- This is a short deterministic physics integration check, not a multi-seed full-race balance study, full-route pit test, or proof of zero profile-ring overlap at all camera zoom levels.


## Unified v1.1 active competition and pit-exit contracts - 2026-10-15

- The dedicated `qa-f1-unified-v11-competition.mjs` uses the real unified physics step with controlled three-car starts. A third car crossing a defended middle lane must be blocked, with all real-world bodies separate. It checks the same run with vehicle-array order reversed.
- A controlled `PIT_EXIT` candidate is kept physically apart from TRACK cars, and its expired, deliberately seeded candidate must be discarded rather than counted as a committed pass. The pit transition is stubbed here; the separate Chromium UI test covers actual pit entry, service, exit and merge.
- The existing 480s synthetic smoke now matches every confirmed overtaking reward against an actual committed crossing of the same pair and same leading car, with a 20ms integration-window tolerance. It verifies the pass counters and prevents duplicate reward signatures.
- A physical crossing need not result in a confirmed pass: the engine already requires 500ms of stable changed order. This check validates confirmed-pass provenance but does not claim all attempted overtakes are captured as explicit failure events.
- Neither game physics, balance parameters, AI weights, participant selection, UI panels nor Production deployment are modified.
