# MWS F1 v1.2 — R1 주행 성향과 동적 전략

개발 브랜치: f1-unified-redesign-v11-20261012. Production 미반영. v1.1 물리 솔버 유지.

## 새 행동 정책

- 4종 역할: FRONTRUNNER(선행형), BALANCED(균형형), CHASER(추격형), CLOSER(추입형). 참가자 ID + 레이스 키의 **deterministic hashed sort**를 사용해 고르게 배정. 차량 배열 순서에 무관하고 새 RNG 호출이 없다.
- 진행률 \`raceProgress / totalLaps\`로 경기 구간을 보간한다. 따라서 FAST 3랩과 NORMAL 모두 상대적으로 동일한 전략 단계.
- 선행형: 초반 가속/ERS 적극 사용, 중후반 관리. 추입형: 초반 절약, 후반 사용. 다른 두 성향은 중간 수준으로 설계.
- 기존 \`A0\` 물리 가속에 \`thrustScale\`을 적용 (강제 순위·간격·좌표 변경 없음), 기존 \`unifiedEnergyAndTyreV11\`에서 실제 이동거리 기반의 \`wearLoad * strategyWear\`를 적용.
- ERS는 기존 에너지 보유량의 상한 및 \`UNIFIED_ENGINE_V11.attackBoostKW\`를 준수하고, 공격할 때만 최대 25kW 추가 요청. 배터리 없음·PIT 구간에는 0 요청. 엔진의 기본 한도 \`additionalPower\` 유지.
- 타이어 마모 58% 초과 시 단계적으로 노력량 감소. 낮은 공격성의 전략이 실제로 타이어를 덜 소비할 수 있지만 그 대신 초반 주행 페이스가 낮아진다.
- 새 API: \`window.mwsF1StrategyV12Report()\`. 오염 없는 read-only 스냅샷으로 차량별 성향/노력/ERS 요청/마모 계수/배터리 보고.
- R0 \`window.mwsF1CompetitionBaselineV12()\`의 5초 샘플에 \`style/effort/ersRequestKW\` 컬럼을 추가.

## 불변 조건

- 20ms 물리 간격, 차체 sweep/collision 원자적 커밋, 500ms 추월 확정/ledger, 배속·카메라·UI·피트 전략 기존 규칙, 필살기 시스템은 보존. 통합 경로에 별도 물리 솔버·타이어 엔진·자동 순위 교환을 추가하지 않았다.
- R0의 90초 당시 수치(선두 격차 9→148.2m, 물리적 추월 0)를 **변경 전의 역사적 baseline**으로 보존한다. R1 이후 QA에서는 그 결과가 정확히 0이어야 한다는 부적절한 결과 고정식 테스트를 제거하고 기존 계측 무결성 테스트는 유지했다.
- 사용자 보고한 거대별 사례의 직접 재현, 7개 전체 트랙 장거리·다중 시드 레이스 균형 및 고배속 관전 연출은 추후 단계. R1에서는 단기 통합/물리 안전성을 먼저 검증한다.
- 다음 단계 R2는 3개 대표 차선 판단을 교체할 다차량 추월 AI. R1은 추월 솔버를 교체하지 않는다.

## QA

Node V8 순수 함수+90초 12대 통합 QA에서 배열 입력 역순 재현, 역할 분포, 초중후 전략 차이, 배터리 제한, PIT 정지, 타이어 절약, RNG 미소모, 진단 결과 격리, 물리 거부 스텝의 상태 불변을 확인. 기존 전체 CI + 7트랙 실제 SVG + Chromium FHD/QHD 성공 시 완료.
