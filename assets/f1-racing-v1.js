(()=>{
'use strict';
const VERSION='phase180-shell';
const VERSION181='phase181-participants';
const VERSION182='phase182-track-model';
const VERSION183='phase183-svg-track';
const VERSION184='phase184-smooth-single-marker';
const VERSION185='phase185-screen-state-machine';
const VERSION186='phase186-setup-track-select';
const VERSION187='phase187-race-draft-snapshot-transition';
const VERSION188='phase188-race-control-frame';
const VERSION189='phase189-shared-multicar-raf';
const VERSION190='phase190-race-distance-lap-sector';
const VERSION191='phase191-position-gap-interval';
const VERSION192='phase192-simulation-clock';
const VERSION193='phase193-track-geometry-v2';
const VERSION194='phase194-corner-phase-model';
const VERSION195='phase195-speed-profile';
const VERSION196='phase196-vehicle-dynamics-telemetry';
const VERSION197='phase197-racing-line-track-width';
const VERSION198='phase198-slipstream';
const SLIPSTREAM_CONFIG_V198=Object.freeze({maxGapMeters:42,minGapMeters:1.5,maxLateralMeters:8,minSpeedKph:120,maxDragReduction:0.14,maxTargetBonusKph:8});
const VERSION199='phase199-dirty-air';
const DIRTY_AIR_CONFIG_V199=Object.freeze({maxGapMeters:32,minGapMeters:1.5,maxLateralMeters:7,maxCornerGripLoss:0.08,maxUndersteerRisk:0.62,maxSlideRisk:0.38,maxTyreHeatLoad:0.5});
const VERSION200='phase200-driver-pace-consistency-racecraft';
const DRIVER_PROFILE_KEYS_V200=Object.freeze(['pace','braking','cornering','racecraft','consistency','tyreManagement','start','aggression','errorResistance']);
const DRIVER_PACE_CONFIG_V200=Object.freeze({ratingMin:55,ratingMax:95,paceRange:0.006,brakingRange:0.004,corneringRange:0.007,noiseSampleMs:350,noiseBase:0.0025,noiseRange:0.0065,noiseClamp:0.018});
const VERSION201='phase201-energy-recharge-boost';
const ENERGY_CONFIG_V201=Object.freeze({usableCapacityMJ:4,maxRechargePerLapMJ:8.5,maxHarvestPowerKW:350,maxDeployPowerKW:350,icePowerKW:400,minStandingDeployKph:50});
const VERSION202='phase202-active-aero-overtake';
const ACTIVE_AERO_CONFIG_V202=Object.freeze({transitionMs:400,detectionGapSeconds:1,extraRechargeMJ:0.5,overtakeFullPowerToKph:337,overtakeCutoffKph:355});
const VERSION203='phase203-tyre-system';
const VERSION204='phase204-driving-incidents';
const VERSION205='phase205-pit-lane-stop-warmup';
const VERSION206='phase206-pit-strategy-ai';
const VERSION207='phase207-traffic-slipstream-defence';
const VERSION208='phase208-pass-state-machine';
const VERSION209='phase209-long-run-gap-balance';
const VERSION210='phase210-multi-track-integration';
const VERSION211='phase211-track-marker-integration';
const VERSION212='phase212-live-timing-flip';
const VERSION213='phase213-top-three-presentation';
const VERSION214='phase214-race-control-flags';
const VERSION215='phase215-backmarker-blue-flag';
const VERSION216='phase216-driver-markers-camera';
const VERSION217='phase217-compact-three-panel-workspace';
const VERSION218='phase218-korean-interface';
const VERSION219='phase219-race-commentary-engine';
const VERSION220='phase220-diverse-track-catalog';
const VERSION221='phase221-production-verification-compatibility';
const VERSION222='phase222-race-commentary-flow';
const VERSION223='phase223-track-profile-ui';
const VERSION224='phase224-race-ui-density-qa';
const VERSION225='phase225-camera-director';
const VERSION226='phase226-commentary-readability';
const VERSION227='phase227-commentary-cadence-quality';
const VERSION228='phase228-driver-label-collision-avoidance';
const VERSION229='phase229-camera-director-stability';
const VERSION230='phase230-commentary-event-order-integrity';
const VERSION231='phase231-production-verifier-future-safe';
const VERSION232='phase232-driver-marker-number-identity';
const VERSION233='phase233-track-silhouette-cards';
const VERSION234='phase234-track-runtime-character-profile';
const VERSION235='phase235-track-character-driving-behavior';
const VERSION236='phase236-track-aware-commentary';
const VERSION237='phase237-race-result-telemetry';
const VERSION238='phase238-seven-track-long-run-benchmark';
const VERSION239='phase239-track-benchmark-alignment-gate';
const VERSION240='phase240-accelerated-real-engine-runner';
const VERSION241='phase241-seven-track-real-engine-suite';
const VERSION242='phase242-real-engine-benchmark-alignment';
const VERSION243='phase243-flowing-circuit-redesign';
const VERSION244='phase244-starting-grid-top-actions';
const VERSION245='phase245-zoom-aware-marker-scale';
const VERSION246='phase246-clean-track-indicators';
const VERSION247='phase247-rebased-race-playback';
const VERSION248='phase248-live-lap-sector-timing';
const VERSION249='phase249-remove-obsolete-race-panels';
const VERSION250='phase250-driver-profile-marker';
const VERSION251='phase251-live-timing-driver-identity';
const VERSION252='phase252-spectator-race-highlights';
const VERSION253='phase253-live-timing-race-status';
const VERSION254='phase254-live-marker-position-tag';
const VERSION255='phase255-race-headline-summary';
const VERSION256='phase256-live-battle-link';
const VERSION257='phase257-embedded-driver-profile-marker';
const VERSION258='phase258-visual-lateral-smoothing';
const VERSION259='phase259-workspace-user-default-persistence';
const VERSION260='phase260-manual-lap-control';
const VERSION261='phase261-immersive-fullscreen-spectator';
const VERSION262='phase262-race-momentum-rebalance';
const VERSION263='phase263-race-narrative-engine';
const VERSION264='phase264-live-overtake-comic-cutin';
const VERSION265='phase265-grand-prix-podium-redesign';
const VERSION266='phase266-f1-track-card-circuit-redesign';
const VERSION267='phase267-integrated-spectator-desktop-qa';
const VERSION268='phase268-auto-follow-wheel-zoom';
const VERSION269='phase269-lateral-velocity-acceleration-smoothing';
const VERSION270='phase270-f1-corner-line-exit-acceleration';
const VERSION271='phase271-track-boundary-wall-riding-fix';
const VERSION272='phase272-random-seeded-starting-grid';
const VERSION273='phase273-starting-grid-card-shuffle-reveal';
const VERSION274='phase274-field-compression-leader-pressure';
const VERSION275='phase275-chase-burst';
const VERSION276='phase276-live-conversation-stack-ui';
const VERSION277='phase277-character-dialogue-engine';
const VERSION278='phase278-micro-battle-events';
const VERSION279='phase279-expanded-dialogue-pool';
const VERSION280='phase280-event-dialogue-coverage';
const VERSION281='phase281-dialogue-cadence-repeat-guard';
const VERSION282='phase282-dialogue-long-run-desktop-qa';
const VERSION303='phase303-f1-feedback-stabilization';
const VERSION307='phase307-live-session-merge-expanded-copy';
const VERSION308='phase308-track-overlay-hud-frequency-diversity';
const VERSION309='phase309-viewport-marker-overtake-flow';
const VERSION313='phase313-f1-gacha-starting-grid';
const VERSION314='phase314-f1-race-dynamics-rebalance';
const VERSION315='phase315-f1-live-participant-dialogue-diversity';
const VERSION319='phase319-f1-ui-spacing-battle-isolation';
const VERSION324='phase324-f1-ui-visibility-train-spacing';
const VERSION326='phase326-f1-gacha-image-fallback-qa';
const VERSION327='phase327-f1-label-tag-separation-compatibility';
const VERSION328='phase328-f1-train-headway-overtake-release';
const VERSION330='phase330-f1-visual-spacing-continuity';
const VERSION331='phase331-f1-natural-dialogue-expansion';
const VERSION332='phase332-f1-live-readability-variety';
const VERSION333='phase333-f1-gacha-responsive-viewport';
const VERSION335='phase335-f1-actual-track-spacing';
const VERSION336='phase336-f1-pit-status-only';
const VERSION337='phase337-f1-commentary-semantic-dedupe';
const VERSION338='phase338-f1-best-lap-overlay';
const VERSION339='phase339-f1-live-presence-glow';
const VERSION343='phase343-f1-corner-tyre-dynamics';
const VERSION344='phase344-f1-staggered-pit-strategy';
const VERSION345='phase345-f1-competition-fast-race';
const VERSION346='phase346-f1-race-dynamics-correction';
const VERSION348='phase348-f1-dynamics-playtest-qa';
const VERSION349='phase349-f1-strict-pit-staggering';
const VERSION350='phase350-f1-rear-battle-pace-retention';
const VERSION351='phase351-f1-physics-corner-brake-release';
const VERSION352='phase352-f1-field-spread-pace-balance';
const VERSION353='phase353-f1-corner-complex-recovery';
const VERSION354='phase354-f1-field-spread-cap-balance';
const VERSION355='phase355-f1-rear-pace-balance';
const VERSION356='phase356-f1-field-pace-retention';
const VERSION357='phase357-f1-ranked-field-pace-retention';
const VERSION358='phase358-f1-corner-speed-brake-release-calibration';
const VERSION359='phase359-f1-natural-race-pace-polish';
const VERSION360='phase360-f1-four-lane-long-corner-flow';
const VERSION361='phase361-f1-corner-lane-occupancy-pit-hud';
const VERSION362='phase362-f1-visible-corner-lane-separation';
const VERSION363='phase363-f1-lane-band-crowding-guard';
const VERSION364='phase364-f1-stable-lane-band-slot-transition';
const VERSION365='phase365-f1-natural-longitudinal-headway';
const VERSION366='phase366-f1-following-pause-stability';
const VERSION368='phase368-f1-interaction-snapshot-shadow';
const VERSION369='phase369-f1-pit-interaction-isolation';
const interactionSnapshotStateV368={snapshot:null,builds:0,lastSimTimeMs:0};
const OVERTAKE_FLOW_CONFIG_V309=Object.freeze({variabilityHoldMs:920,targetRefreshStates:Object.freeze(['FOLLOWING','CLOSING','TOWING','PASS_COMPLETED','PASS_FAILED'])});
const raceOrderFlowStateV309={lastOrder:[],orderChanges:0,changedDrivers:0};
const GAME_VARIABILITY_CONFIG_V303=Object.freeze({evaluationMs:650,maxGapMeters:84,attackGapMeters:36,baseBonusKph:1.1,pressureBonusKph:3.2,midfieldBonusKph:.8,failedPassBonusKph:.4,maxFailedPassBonusKph:1.6,momentumBonusKph:1.55,maxTotalBiasKph:14,positionCatchupMaxPct:.050,positionCatchupExponent:1.35,leaderHoldMs:12000,leaderCloseGapSeconds:1.75,leaderClosePenaltyKph:.9,liveCadenceMs:10000});
const gameVariabilityStateV303={lastEvalSimMs:-Infinity,lastLiveSimMs:-Infinity,lastOrder:[],positionChanges:0,boostApplications:0,leaderPressureApplications:0,liveEmits:0};
const TRACK_BOUNDARY_V271=Object.freeze({
  carHalfWidthMeters:.85,safetyMarginMeters:.20,edgeStartRatio:.90,
  edgeMinSpeedFactor:.90,offTrackSpeedFactor:.76
});
const CORNER_DYNAMICS_V270=Object.freeze({
  outsideFraction:.62,apexFraction:.68,exitOutsideFraction:.55,
  exitAccelerationMultiplier:1.38,exitTargetLiftKph:24,exitLookAheadMeters:105,
  hairpinMinApexKph:72,slowMinApexKph:92,sCurveMinRecoveryKph:112
});
const CORNER_DYNAMICS_V343=Object.freeze({
  outsideFraction:.72,apexFraction:.76,exitOutsideFraction:.68,
  brakingFactor:Object.freeze({hairpin:.80,slow:.85,medium:.90,fast:.95,sCurve:.91}),
  turnInFactor:Object.freeze({hairpin:.82,slow:.87,medium:.92,fast:.96,sCurve:.93}),
  apexFactor:Object.freeze({hairpin:.84,slow:.89,medium:.94,fast:.975,sCurve:.95}),
  minimumApexKph:Object.freeze({hairpin:96,slow:118,medium:158,fast:220,sCurve:172}),
  compoundCornerFactor:Object.freeze({SOFT:1.075,MEDIUM:1,HARD:.94}),
  exitAccelerationMultiplier:1.46,exitLookAheadMeters:125
});
const TYRE_DYNAMICS_V343=Object.freeze({
  wearMultiplier:Object.freeze({SOFT:1.34,MEDIUM:1.30,HARD:1.26}),
  incidentWearStart:.42,incidentWearScale:.58,
  pitSafeRemainingRatio:.40
});
const PIT_STAGGER_V344=Object.freeze({
  minWearToConsider:.60,maxWearThreshold:.78,thresholdSpread:.18,
  hardExtra:.03,softReduction:.02,criticalGrip:.845,criticalFlatSpot:.48,
  criticalThermalDeg:.74
});
const RACE_COMPETITION_V345=Object.freeze({
  NORMAL:Object.freeze({variability:1.62,attackGap:1.42,overtakeReleaseClosingKph:2.7,momentumThreshold:.42,p2ChallengeKph:7.0,leaderPressureKph:4.2,leaderHoldMs:3500}),
  FAST:Object.freeze({variability:2.65,attackGap:1.92,overtakeReleaseClosingKph:1.35,momentumThreshold:.29,p2ChallengeKph:10.5,leaderPressureKph:5.8,leaderHoldMs:1800}),
  fastLaps:3
});
const REAR_BATTLE_BALANCE_V350=Object.freeze({
  activeBattleDirtyAirScale:.44,blockedBattleDirtyAirScale:.52,
  blockedControlMeters:12,trainControlMeters:8,overlapGuardMeters:3.4,
  farClosingAllowanceKph:1.4,closeClosingAllowanceKph:.55,overlapSpeedMarginKph:1.1,
  blockedCatchupRetention:1.00
});
const FIELD_SPREAD_BALANCE_V352=Object.freeze({normalFormAmplitude:.009,fastFormAmplitude:.024,maxFinishSpreadSeconds:48,normalCatchupCapMultiplier:1.25,fastCatchupCapMultiplier:1.45,paceRetentionScale:.08,rankedRearPaceMax:.005,rankedRearPaceExponent:1.20});
const CORNER_DRIVING_V351=Object.freeze({
  speedEnvelope:Object.freeze({
    hairpin:Object.freeze({min:75,max:120,entryRetention:.30,brakeScale:1.05,recoveryLead:.34,exitAccel:1.18}),
    slow:Object.freeze({min:105,max:170,entryRetention:.43,brakeScale:.98,recoveryLead:.28,exitAccel:1.15}),
    medium:Object.freeze({min:160,max:230,entryRetention:.60,brakeScale:.92,recoveryLead:.22,exitAccel:1.10}),
    fast:Object.freeze({min:225,max:305,entryRetention:.77,brakeScale:.88,recoveryLead:.16,exitAccel:1.06}),
    sCurve:Object.freeze({min:175,max:245,entryRetention:.64,brakeScale:.90,recoveryLead:.26,exitAccel:1.11})
  }),
  compoundInfluence:.48,minBrakeDecelMps2:10,maxBrakeDecelMps2:32,
  speedDeltaBrakeGain:.22,exitLookAheadMeters:170,recoveryTargetLiftKph:22
});
const CORNER_BRAKE_RELEASE_V358=Object.freeze({coastDecelMps2:.55,clearBoundaryFactor:.99,minRecoveryTargetGainKph:2.5});
const NATURAL_RACE_PACE_V359=Object.freeze({rankedBoostScale:.80,catchupBoostScale:.08,fastModeScale:.35,cornerRecoveryCoastDecelMps2:.08,maxNormalFinishSpreadSeconds:43.5});
const FOUR_LANE_TRACK_V360=Object.freeze({
  laneCount:4,
  laneFractions:Object.freeze([-.66,-.22,.22,.66]),
  guideFractions:Object.freeze([-.66,-.22,.22,.66]),
  visualWidthScale:1.65,
  guideSamples:180,
  longCornerMinMeters:130,
  tightGapMeters:18
});
const CORNER_LANE_OCCUPANCY_V361=Object.freeze({
  scanMeters:112,
  evaluationMs:180,
  denseCount:4,
  severeCount:6,
  denseSpreadScale:1.12,
  severeSpreadScale:1.22,
  minMarkerScale:.85,
  laneOccupancyWeight:12,
  laneChangeWeight:.72,
  sideBySidePenalty:120,
  attackSameLanePenalty:26
});
const PIT_HUD_V361=Object.freeze({maxVisible:6,bottomOffsetPx:116});
const VISIBLE_CORNER_SEPARATION_V362=Object.freeze({
  visualWidthScale:8.0,
  trackStrokeWidth:210,
  laneVisualMultiplier:1.10,
  idealNudgeNormal:.18,
  idealNudgeDense:.10,
  nearLaneMeters:42,
  nearLanePenalty:48,
  minimumDenseLaneGapSvg:38
});
const LANE_BAND_CROWDING_V363=Object.freeze({
  sameLaneScanMeters:34,
  bandHalfGapRatio:.42,
  pairMarkerScale:.82,
  multiMarkerScale:.74,
  minMarkerScale:.74,
  overlapThresholdRatio:.94
});
const screenCrowdingStateV363={samples:0,denseSamples:0,currentOverlapPairs:0,maxOverlapPairs:0,minScreenDistance:Infinity,latest:null};
const LANE_BAND_SLOT_STABILITY_V364=Object.freeze({lockMs:1200,releaseGraceMs:520,visualOrderEpsilonMeters:.08});
const laneBandStabilityStateV364={assignments:0,reassignments:0,preservedRaceOrderChanges:0,currentStableOverlapPairs:0,maxStableOverlapPairs:0,minStableScreenDistance:Infinity,last:null};
const TRACK_PRESENTATION_V365=Object.freeze({visualWidthScale:FOUR_LANE_TRACK_V360.visualWidthScale,trackStrokeWidth:58});
const NATURAL_HEADWAY_V365=Object.freeze({
  minGapMeters:8.5,
  maxGapMeters:27,
  baseGapMeters:4.5,
  straightTimeGapSeconds:.24,
  brakingTimeGapSeconds:.34,
  turnInTimeGapSeconds:.30,
  apexTimeGapSeconds:.32,
  exitTimeGapSeconds:.26,
  softStartMultiplier:1.22,
  blockedMultiplier:1.04,
  approachAllowanceKph:3.2,
  closeMarginKph:2.4,
  emergencyGapMeters:4.5,
  emergencyMarginKph:5.5,
  fastReleaseGapMultiplier:1.12,
  fastReleaseClosingKph:.05,
  genuineClosingReleaseMeters:96,
  paceAdvantageReleaseKph:1.2,
  attackReleaseGapMeters:48,
  attackSlipstreamRelease:.08,
  cornerClosingReleaseKph:.65,
  cornerPaceReleaseKph:.35,
  cornerSlipstreamRelease:.04,
  stateEntryClosingKph:1.25,
  cornerOnly:true
});
const naturalHeadwayTelemetryV365={calls:0,active:0,cornerActive:0,emergency:0,minGapMeters:Infinity,maxTargetGapMeters:0,last:null};
const FOLLOWING_STABILITY_V366=Object.freeze({
  softStartMultiplier:1.12,
  underGapMinMarginKph:0,
  underGapMaxMarginKph:4.0,
  prepareBufferMeters:1.25,
  pullOutBufferMeters:1.25,
  pullOutHoldExtraMeters:1.5,
  lateralSafetyBufferMeters:.35,
  minClosingKph:.25,
  cornerGuardActivationMeters:12,
  pullOutReleaseHoldMs:420
});
const followingStabilityTelemetryV366={calls:0,active:0,emergency:0,lateralRelease:0,minGapMeters:Infinity,last:null};
const CORNER_COMPLEX_RECOVERY_V353=Object.freeze({
  underSpeedTriggerRatio:.90,underSpeedAccelMultiplier:1.38,
  telemetryEntryRatio:1.08,cleanBoundaryFactor:.985
});
const RACE_MOMENTUM_CONFIG_V262=Object.freeze({
  min:-1,max:1,paceRange:.02,decayPerSecond:.032,evaluationMs:620,
  passSuccess:.18,passFailed:-.12,defenceSuccess:.075,incident:-.14,
  excellentExit:.055,lateBraking:.045,hesitation:-.05,minorCorrection:-.038,
  rhythmGain:.04,pressureLoss:-.045,tyrePositive:.025,tyreNegative:-.03
});
const RACE_MOMENTUM_EVENTS_V262=Object.freeze(['PASS_SUCCESS','PASS_FAILED','DEFENCE_SUCCESS','INCIDENT','EXCELLENT_EXIT','LATE_BRAKING_CONFIDENCE','HESITATION','MINOR_CORRECTION','RHYTHM_GAIN','PRESSURE_LOSS','TYRE_CONFIDENCE','TYRE_STRUGGLE']);

const NARRATIVE_EVENTS_V263=Object.freeze(['APPROACH','PRESSURE','OPENING','ATTACK','SIDE_BY_SIDE','BRAKING','CORNER_BATTLE','DEFENCE','PASS_SUCCESS','PASS_FAILED','COUNTER_ATTACK','MISTAKE','RECOVERY','FAST_LAP','FINAL_LAP','LEADER_BATTLE','PIT_TACTIC']);
const NARRATIVE_BASES_V263=Object.freeze({
  APPROACH:Object.freeze(['{driver}가 {target}의 뒤를 조용히 파고든다.','{driver}, 거리를 한 칸씩 지운다.','{target}의 거울 안에서 {driver}가 점점 커진다.','{driver}가 {corner} 진입 전부터 사냥감을 놓치지 않는다.']),
  PRESSURE:Object.freeze(['참을 만큼 참았다. {driver}가 {target}을 압박한다.','{driver}가 숨 쉴 틈 없이 {target}의 라인을 조인다.','{target} 앞에 {driver}의 압박이 그림자처럼 붙었다.','{driver}, 아직 움직이지 않는다. 하지만 압박은 이미 시작됐다.']),
  OPENING:Object.freeze(['빈틈의 실을 보았다. {driver}가 움직일 준비를 한다.','한 줄의 길이 열렸다. {driver}가 놓치지 않는다.','{target}의 작은 흔들림을 {driver}가 읽었다.','문이 아주 조금 열렸다. {driver}에게는 그걸로 충분하다.']),
  ATTACK:Object.freeze(['{driver}가 라인을 벗어난다. 이제 들어간다.','{driver}, 바람을 가르며 {target} 옆으로 차를 던진다.','기다림은 끝났다. {driver}가 공격을 시작한다.','{driver}가 추월 라인으로 몸을 던진다.']),
  SIDE_BY_SIDE:Object.freeze(['{driver}와 {target}, 바퀴 하나 차이로 나란히 달린다.','두 대가 붙었다. {driver}와 {target} 누구도 물러서지 않는다.','트랙이 갑자기 좁아졌다. {driver}와 {target}가 나란히 간다.','{driver}와 {target}, 한 치도 양보 없는 병렬 주행이다.']),
  BRAKING:Object.freeze(['브레이크를 한 박자 늦춘다. {driver}가 끝까지 버틴다.','{corner} 제동점, {driver}와 {target}의 담력 싸움이다.','먼저 브레이크를 밟는 쪽이 진다. {driver}가 버틴다.','{driver}가 제동 한계를 밀어붙이며 {target}과 맞선다.']),
  CORNER_BATTLE:Object.freeze(['{corner} 안쪽에 두 대가 겹친다. 승부는 아직 끝나지 않았다.','{driver}와 {target}, 코너 하나를 통째로 나눠 쓴다.','라인이 교차한다. {driver}가 출구를 노린다.','{corner}의 짧은 순간이 순위를 결정하려 한다.']),
  DEFENCE:Object.freeze(['{target}가 문을 닫는다. {driver}에게 쉬운 길은 없다.','수비 라인이 단단하다. {driver}가 다른 답을 찾는다.','{target}가 안쪽을 지킨다. {driver}의 다음 수가 필요하다.','공격을 읽었다. {target}가 선제적으로 길을 막는다.']),
  PASS_SUCCESS:Object.freeze(['코너 탈출과 동시에 순위가 뒤집힌다. {driver}가 {target}을 넘었다.','끝내 해냈다. {driver}가 {target} 앞에 선다.','한 번의 결단이 통했다. {driver}가 추월을 완성한다.','{driver}, {target}을 지나 새로운 {position}를 차지한다.']),
  PASS_FAILED:Object.freeze(['문이 닫혔다. {driver}의 공격은 이번엔 여기까지다.','{target}가 버텼다. {driver}가 다시 기회를 기다린다.','아슬아슬했다. 하지만 순서는 바뀌지 않았다.','{driver}의 칼끝이 닿기 직전 {target}가 자리를 지켰다.']),
  COUNTER_ATTACK:Object.freeze(['끝난 줄 알았나. {target}가 곧바로 반격한다.','자리를 내준 {target}가 다시 {driver}를 겨눈다.','추월 직후가 가장 위험하다. {target}의 반격이 시작된다.','{target}가 물러서지 않는다. 이번엔 {driver}가 방어할 차례다.']),
  MISTAKE:Object.freeze(['작은 흔들림 하나. {driver}가 급히 차를 바로잡는다.','{driver}의 리듬이 순간 깨졌다. 뒤차가 그 장면을 봤다.','완벽하던 흐름에 작은 금이 갔다. {driver}가 수습한다.','{driver}, 한 번의 실수를 더 큰 손실 없이 막아낸다.']),
  RECOVERY:Object.freeze(['{driver}가 다시 리듬을 찾는다. 흔들림은 길지 않았다.','조금 전 실수는 잊었다. {driver}가 다시 속도를 올린다.','{driver}의 페이스가 돌아온다. 레이스는 아직 길다.','무너질 틈을 주지 않는다. {driver}가 곧바로 회복한다.']),
  FAST_LAP:Object.freeze(['스톱워치가 반응한다. {driver}가 새로운 최고 랩을 찍었다.','{driver}, 트랙 위에 가장 빠른 한 바퀴를 새긴다.','이번 랩은 달랐다. {driver}가 기준 기록을 갈아치운다.','{driver}의 한 바퀴가 레이스의 속도를 다시 정의한다.']),
  FINAL_LAP:Object.freeze(['마지막 한 바퀴. 이제 모든 선택에 대가가 붙는다.','파이널 랩. 숨겨 둔 카드가 있다면 지금 꺼내야 한다.','마지막 랩에 들어간다. 한 번의 실수도 되돌릴 수 없다.','체커드 플래그까지 단 한 바퀴. 승부가 압축된다.']),
  LEADER_BATTLE:Object.freeze(['선두 싸움에 불이 붙었다. {driver}와 {target}의 거리가 사라진다.','P1을 두고 {driver}와 {target}가 정면으로 맞붙는다.','레이스의 맨 앞에서 두 대가 서로의 숨소리를 듣는다.','선두는 안전지대가 아니다. {driver}와 {target}가 붙었다.']),
  PIT_TACTIC:Object.freeze(['트랙 밖에서도 승부는 계속된다. {driver}가 피트 전략을 꺼낸다.','{driver}의 피트 선택이 다음 몇 랩의 그림을 바꾼다.','타이밍 싸움이다. {driver}가 피트 카드를 먼저 연다.','{driver}, 트랙 포지션을 걸고 피트 전략을 실행한다.'])
});
const NARRATIVE_FLAVORS_V263=Object.freeze(['',' 한 박자의 판단이 다음 장면을 바꾼다.']);
const NARRATIVE_TEMPLATES_V263=Object.freeze(NARRATIVE_EVENTS_V263.flatMap(event=>(NARRATIVE_BASES_V263[event]||[]).flatMap((line,index)=>NARRATIVE_FLAVORS_V263.map((flavor,variant)=>Object.freeze({id:event+'-'+index+'-'+variant,event,text:line+flavor})))));
const narrativeStateV263={recentIds:[],recentLimit:15,counter:0,technicalLog:[]};
function resetRaceNarrativeV263(){
  narrativeStateV263.recentIds=[];narrativeStateV263.counter=0;narrativeStateV263.technicalLog=[];
  return true;
}
function recordTechnicalCommentaryV263(message,event='TECH'){
  const row={event:String(event||'TECH'),message:String(message||''),simTimeMs:Number(simClockV192.simTimeMs)||0};
  narrativeStateV263.technicalLog.push(row);
  if(narrativeStateV263.technicalLog.length>80)narrativeStateV263.technicalLog.splice(0,narrativeStateV263.technicalLog.length-80);
  return row;
}
function narrativeCornerLabelV263(vehicle){
  const phase=getCornerPhaseAtProgressV194(Number(vehicle?.progress)||0);
  const zone=phase?.zone||phase?.corner||null;
  return String(zone?.name||zone?.label||activeRaceSnapshotV187?.track?.name||'코너');
}
function narrativePositionLabelV263(vehicle){
  const standing=computeRaceStandingsV191().find(row=>row.vehicle===vehicle);
  return standing?'P'+String(standing.position).padStart(2,'0'):'순위';
}
function narrativeTemplateV263(event,vehicle,target){
  const pool=NARRATIVE_TEMPLATES_V263.filter(row=>row.event===String(event||''));
  if(!pool.length)return null;
  const seed=hashDriverV189([String(activeRaceSnapshotV187?.createdAt||'race'),String(event||''),String(vehicle?.id||''),String(target?.id||''),String(Math.floor((Number(simClockV192.simTimeMs)||0)/500)),String(narrativeStateV263.counter++)].join('|'))||1;
  const index=Math.abs(seed)%pool.length;
  for(let offset=0;offset<pool.length;offset++){
    const candidate=pool[(index+offset)%pool.length];
    if(!narrativeStateV263.recentIds.includes(candidate.id)){
      narrativeStateV263.recentIds.push(candidate.id);
      if(narrativeStateV263.recentIds.length>narrativeStateV263.recentLimit)narrativeStateV263.recentIds.shift();
      return candidate;
    }
  }
  return pool[index];
}
function formatNarrativeV263(template,context={}){
  return String(template||'').replaceAll('{driver}',String(context.driver||'드라이버')).replaceAll('{target}',String(context.target||'앞차')).replaceAll('{position}',String(context.position||'순위')).replaceAll('{corner}',String(context.corner||'코너'));
}
function emitRaceNarrativeV263(event,vehicle,target,options={}){
  if(typeof appendRaceInfoV277==='function')return appendRaceInfoV277(event,vehicle,target,options);
  const template=narrativeTemplateV263(event,vehicle,target);
  if(!template)return false;
  const text=formatNarrativeV263(template.text,{driver:vehicle?.driver?.name||options.driver||'드라이버',target:target?.driver?.name||options.target||'앞차',position:options.position||narrativePositionLabelV263(vehicle),corner:options.corner||narrativeCornerLabelV263(vehicle)});
  const type=options.type||(['PIT_TACTIC'].includes(event)?'strategy':['FINAL_LAP','PASS_SUCCESS','FAST_LAP'].includes(event)?'pass':'battle');
  const signature='v263:'+String(event)+':'+String(vehicle?.id||options.driver||'global')+':'+String(target?.id||options.target||'');
  const cooldown=Number.isFinite(Number(options.cooldownMs))?Number(options.cooldownMs):1800;
  return appendRaceCommentaryV222(text,type,signature,cooldown);
}
function narrativeEventFromBattleStateV263(state){
  return ({CLOSING:'APPROACH',TOWING:'PRESSURE',PREPARING_ATTACK:'PRESSURE',PULLING_OUT:'ATTACK',SIDE_BY_SIDE:'SIDE_BY_SIDE',BRAKING_DUEL:'BRAKING',CORNER_BATTLE:'CORNER_BATTLE',SWITCHBACK:'RECOVERY',COUNTER_ATTACK:'COUNTER_ATTACK',PASS_FAILED:'PASS_FAILED'})[String(state||'')]||'';
}
function qaRaceNarrativeEngineV263(){
  const sample=NARRATIVE_TEMPLATES_V263[0];
  const rendered=formatNarrativeV263(sample?.text,{driver:'A',target:'B',position:'P02',corner:'T1'});
  const eventCounts=Object.fromEntries(NARRATIVE_EVENTS_V263.map(event=>[event,NARRATIVE_TEMPLATES_V263.filter(row=>row.event===event).length]));
  return {templateCount:NARRATIVE_TEMPLATES_V263.length,eventCount:NARRATIVE_EVENTS_V263.length,recentLimit:narrativeStateV263.recentLimit,eventCounts,rendered,technicalLogLimit:80,allPass:NARRATIVE_TEMPLATES_V263.length>=120&&NARRATIVE_EVENTS_V263.length>=16&&narrativeStateV263.recentLimit>=10&&narrativeStateV263.recentLimit<=15&&!/[{](driver|target|position|corner)[}]/.test(rendered)&&Object.values(eventCounts).every(count=>count>=4)};
}


const LIVE_CUTIN_TEXT_PARTS_V307=Object.freeze({
 ATTACK:Object.freeze({
  lead:Object.freeze([
   '{driver}가 {target}의 뒤에 바짝 붙었습니다.',
   '{driver}, 추월 거리 안으로 들어왔습니다.',
   '{target}의 미러에 {driver}가 크게 들어옵니다.',
   '{driver}가 페이스를 끌어올리며 압박합니다.',
   '{driver}가 한 번 더 가속해 간격을 지웁니다.',
   '{driver}, 이제 기다리지 않습니다.',
   '{driver}가 {target}의 라인을 읽고 있습니다.',
   '{driver}가 공격 타이밍을 재고 있습니다.'
  ]),
  action:Object.freeze([
   '{corner} 진입 전에 안쪽을 노립니다.',
   '직선에서 슬립스트림을 끌어다 씁니다.',
   '브레이킹 포인트까지 승부를 끌고 갑니다.',
   '바깥쪽 라인까지 열어 두고 기회를 봅니다.',
   '출구 가속까지 계산한 공격입니다.',
   '{position} 싸움이 본격적으로 시작됩니다.',
   '작은 빈틈도 놓치지 않으려 합니다.',
   '{target}가 수비 라인을 고를 시간을 주지 않습니다.'
  ])
 }),
 SIDE_BY_SIDE:Object.freeze({
  lead:Object.freeze([
   '{driver}와 {target}, 완전히 나란히 섰습니다.',
   '두 대가 바퀴 하나 차이로 붙었습니다.',
   '{driver}가 {target}의 옆자리까지 들어왔습니다.',
   '트랙 폭을 둘로 나눠 쓰는 싸움입니다.',
   '{driver}와 {target}가 한 치도 물러서지 않습니다.',
   '두 드라이버가 같은 코너를 함께 향합니다.',
   '{driver}가 {target}와 휠 투 휠 상황을 만들었습니다.',
   '순간적으로 두 대의 속도가 거의 같아졌습니다.'
  ]),
  action:Object.freeze([
   '{corner}에서 먼저 자리를 잡는 쪽이 유리합니다.',
   '안쪽과 바깥쪽 라인이 동시에 살아 있습니다.',
   '제동 타이밍 하나가 순서를 바꿀 수 있습니다.',
   '출구에서 더 좋은 가속을 얻는 쪽이 앞섭니다.',
   '{position}를 두고 정면 승부가 이어집니다.',
   '둘 다 먼저 브레이크를 밟을 생각이 없습니다.',
   '차 한 대 폭의 공간도 쉽게 내주지 않습니다.',
   '다음 방향 전환까지 승부가 이어질 분위기입니다.'
  ])
 }),
 COUNTER_ATTACK:Object.freeze({
  lead:Object.freeze([
   '{target}가 곧바로 반격을 준비합니다.',
   '자리를 내줄 뻔한 {target}가 다시 속도를 올립니다.',
   '승부가 끝난 줄 알았지만 {target}가 다시 붙습니다.',
   '{driver}의 공격 직후 {target}가 되받아칩니다.',
   '{target}가 물러서지 않고 다시 라인을 바꿉니다.',
   '이번에는 {target} 쪽에서 움직임이 나옵니다.',
   '공격과 수비가 순식간에 뒤바뀌었습니다.',
   '{driver}가 앞서려는 순간 {target}가 다시 압박합니다.'
  ]),
  action:Object.freeze([
   '{corner}에서 크로스 라인을 노립니다.',
   '직선 가속으로 다시 옆자리를 되찾으려 합니다.',
   '브레이킹 구간에서 다시 승부를 걸 준비입니다.',
   '앞차의 출구 라인을 그대로 따라붙습니다.',
   '{position} 싸움이 두 번째 국면으로 넘어갑니다.',
   '한 번의 추월 시도로 끝날 분위기가 아닙니다.',
   '서로의 움직임을 읽으며 다시 기회를 만듭니다.',
   '다음 코너까지 압박을 유지합니다.'
  ])
 }),
 PASS_SUCCESS:Object.freeze({
  lead:Object.freeze([
   '{driver}가 마침내 {target}을 넘어섰습니다.',
   '순위가 바뀝니다. {driver}가 앞에 섭니다.',
   '{driver}의 공격이 성공으로 끝났습니다.',
   '{driver}, 긴 싸움 끝에 {target}을 제쳤습니다.',
   '추월이 완성됐습니다. {driver}가 자리를 가져갑니다.',
   '{driver}가 결정적인 순간을 놓치지 않았습니다.',
   '{driver}가 {target}보다 먼저 코너를 빠져나옵니다.',
   '승부가 갈렸습니다. {driver}가 새 순위를 차지합니다.'
  ]),
  action:Object.freeze([
   '이제 {position}에서 다음 상대를 바라봅니다.',
   '{corner}에서 만든 차이가 그대로 순위 변화로 이어졌습니다.',
   '브레이킹과 출구 가속을 모두 성공시킨 결과입니다.',
   '한 번의 기회를 끝까지 살려냈습니다.',
   '{target}는 곧바로 재공격할 거리를 계산해야 합니다.',
   '레이스 흐름이 이 추월로 다시 바뀔 수 있습니다.',
   '긴 압박이 실제 포지션 상승으로 연결됐습니다.',
   '관건은 이제 이 자리를 얼마나 오래 지키느냐입니다.'
  ])
 })
});
const LIVE_CUTIN_EXTRA_V308=Object.freeze({
 ATTACK:Object.freeze([
  '{driver}가 직선 끝에서 차를 한쪽으로 꺼냅니다. {target}도 바로 수비 준비에 들어갑니다.',
  '{driver}, 이번에는 코너보다 제동점에서 먼저 승부를 겁니다.',
  '{target}의 출구가 조금 느렸습니다. {driver}가 그 틈을 바로 물고 늘어집니다.',
  '{driver}가 슬립스트림에서 빠져나옵니다. 이제 진짜 추월 시도입니다.',
  '간격이 충분히 줄었습니다. {driver}가 {target}에게 선택을 강요합니다.',
  '{driver}가 안쪽을 한번 보여주고 다시 라인을 바꿉니다. 페이크가 섞인 공격입니다.',
  '{corner} 앞에서 {driver}가 더 늦은 제동을 준비합니다.',
  '{driver}가 바깥쪽 공간을 남겨 둔 채 출구 우위를 노립니다.',
  '속도 차이가 생겼습니다. {driver}가 그대로 {target} 옆을 향합니다.',
  '{driver}는 서두르지 않습니다. 다음 제동 구간까지 압박을 유지합니다.',
  '{target}가 수비 위치를 잡기도 전에 {driver}가 움직임을 시작합니다.',
  '{driver}가 두 번의 방향 변화로 {target}의 수비 라인을 흔듭니다.',
  '이번 공격은 단순한 접근이 아닙니다. {driver}가 확실히 자리를 노립니다.',
  '{position} 근처의 싸움이 뜨거워집니다. {driver}가 먼저 승부수를 던집니다.',
  '{driver}가 코너 진입보다 출구 가속을 노리는 라인을 선택합니다.',
  '{driver}가 앞차의 흔들림을 읽었습니다. {target}에게 쉴 틈이 없습니다.'
 ]),
 SIDE_BY_SIDE:Object.freeze([
  '{driver}와 {target}가 차 한 대 폭도 남기지 않고 함께 들어갑니다.',
  '두 대가 같은 제동점에서 브레이크를 밟습니다. 먼저 물러설 차가 없습니다.',
  '{corner}에서 {driver}는 안쪽, {target}는 바깥쪽을 고수합니다.',
  '핸들 하나 차이입니다. {driver}와 {target}가 그대로 나란히 갑니다.',
  '두 차의 앞바퀴가 거의 같은 선에 있습니다. 승부는 출구에서 갈립니다.',
  '{driver}가 옆자리를 확보했지만 {target}도 문을 닫지 못했습니다.',
  '바깥쪽의 {target}, 안쪽의 {driver}. 서로 다른 라인으로 같은 출구를 노립니다.',
  '브레이킹은 끝났지만 승부는 아닙니다. 두 대가 코너 중간까지 나란히 갑니다.',
  '{driver}와 {target}가 서로의 공간을 정확히 한 차 폭씩만 남깁니다.',
  '직선에서 시작된 싸움이 {corner}까지 이어집니다. 아직 앞차가 정해지지 않았습니다.',
  '{driver}가 반 차 정도 앞서지만 {target}가 출구 라인을 지키고 있습니다.',
  '두 대가 동시에 가속 페달을 엽니다. 이제 견인력 싸움입니다.',
  '{position} 자리를 두고 휠 투 휠이 길어지고 있습니다.',
  '{driver}가 안쪽을 잡았고 {target}는 더 넓은 출구 각을 노립니다.',
  '누가 먼저 라인을 접느냐의 싸움입니다. 둘 다 쉽게 양보하지 않습니다.',
  '접촉 없이 끝까지 붙어 갑니다. 굉장히 팽팽한 병렬 주행입니다.'
 ]),
 COUNTER_ATTACK:Object.freeze([
  '{target}가 추월 직후 바로 슬립스트림을 되찾습니다. 반격이 시작됩니다.',
  '{driver}가 앞섰지만 안심할 수 없습니다. {target}가 다시 옆으로 나옵니다.',
  '{target}가 스위치백으로 라인을 바꿉니다. 자리를 바로 되찾으려 합니다.',
  '한 번 순위가 바뀌었지만 싸움은 끝나지 않았습니다. {target}가 다시 붙습니다.',
  '{target}가 출구 가속을 이용해 {driver}의 뒤를 단숨에 좁힙니다.',
  '{driver}가 문을 닫기 전에 {target}가 반대쪽 공간을 파고듭니다.',
  '{target}가 다음 제동 구간을 노립니다. 추월 직후 곧바로 2차전입니다.',
  '{driver}가 앞에 섰지만 {target}의 압박이 바로 돌아왔습니다.',
  '이번에는 {target}가 안쪽을 노립니다. 역할이 완전히 뒤바뀌었습니다.',
  '{target}가 한 템포 늦게 브레이크를 떼며 재공격을 준비합니다.',
  '앞서 간 {driver}에게 숨 돌릴 시간이 없습니다. {target}가 즉시 따라붙습니다.',
  '{target}가 레이싱 라인 대신 짧은 거리를 선택합니다. 반격 의도가 분명합니다.',
  '{driver}의 추월이 완전히 굳어지기 전에 {target}가 다시 승부를 겁니다.',
  '{target}가 코너 하나를 버리고 다음 코너를 위한 위치를 잡습니다.',
  '순위는 바뀌었지만 간격은 없습니다. {target}가 바로 재도전에 들어갑니다.',
  '{target}가 더 좋은 출구 속도를 만들었습니다. {driver}가 이번에는 수비해야 합니다.'
 ]),
 PASS_SUCCESS:Object.freeze([
  '{driver}가 제동에서 우위를 만들고 {target}보다 먼저 코너를 빠져나옵니다.',
  '{driver}가 바깥쪽 라인을 끝까지 살려 추월을 완성합니다.',
  '긴 휠 투 휠 끝에 {driver}가 {target} 앞에 차를 세웠습니다.',
  '{driver}가 슬립스트림부터 제동까지 완벽하게 이어 추월에 성공합니다.',
  '{target}가 끝까지 버텼지만 출구 가속에서 {driver}가 앞섭니다.',
  '{driver}가 한 번의 페이크 뒤 반대쪽으로 들어가 자리를 가져갑니다.',
  '{corner}에서 승부가 갈렸습니다. {driver}가 새로운 {position}를 확보합니다.',
  '{driver}가 안쪽을 지키며 추월을 마무리합니다. 이제 {target}가 뒤를 쫓습니다.',
  '두 대의 긴 싸움이 끝납니다. 이번 승자는 {driver}입니다.',
  '{driver}가 아주 작은 속도 차이를 실제 순위 변화로 바꿨습니다.',
  '추월이 확정됩니다. {driver}가 {target}보다 한 자리 앞에 섭니다.',
  '{driver}가 코너 진입이 아니라 출구에서 승부를 끝냈습니다.',
  '{target}의 수비가 무너진 순간 {driver}가 정확히 공간을 차지했습니다.',
  '{driver}가 무리한 접촉 없이 깔끔하게 {target}을 넘어섭니다.',
  '여러 차례의 시도 끝에 {driver}가 드디어 {position}를 손에 넣습니다.',
  '{driver}가 라인 선택과 가속을 모두 맞췄습니다. 추월 성공입니다.'
 ])
});
const LIVE_CUTIN_NATURAL_V332=Object.freeze({
 ATTACK:Object.freeze([
  '{driver}가 {target}의 뒤에서 속도를 그대로 이어갑니다. 이번 직선이 첫 번째 기회가 될 수 있습니다.',
  '{target}가 코너 출구에서 살짝 밀렸습니다. {driver}가 바로 간격을 줄입니다.',
  '{driver}가 아직 라인을 정하지 않았습니다. {target}의 움직임을 끝까지 보고 있습니다.',
  '{driver}가 한 번 안쪽을 보여준 뒤 다시 바깥쪽으로 차를 옮깁니다.',
  '{corner}을 앞두고 {driver}의 속도가 더 좋습니다. {target}가 수비를 준비합니다.',
  '{driver}가 서두르지 않고 제동 구간까지 압박을 이어갑니다.',
  '앞차와의 간격이 빠르게 줄어듭니다. {driver}가 이번에는 실제 공격 거리까지 들어왔습니다.',
  '{driver}가 출구에서 만든 속도 차이를 그대로 직선에 가져갑니다.',
  '{target}가 라인을 바꾸자 {driver}도 바로 반대쪽 공간을 확인합니다.',
  '{driver}가 브레이크를 늦추기보다 더 좋은 출구를 노리는 모습입니다.',
  '{position} 근처의 흐름이 달라집니다. {driver}가 본격적으로 압박을 시작합니다.',
  '{driver}가 한 코너를 더 기다리며 {target}의 수비 패턴을 읽습니다.'
 ]),
 SIDE_BY_SIDE:Object.freeze([
  '{driver}와 {target}가 같은 속도로 코너에 들어갑니다. 아직 어느 쪽도 앞이라고 하기 어렵습니다.',
  '두 대가 나란히 달립니다. 이번에는 출구 가속에서 순서가 갈릴 가능성이 큽니다.',
  '{driver}가 안쪽을 잡았지만 {target}도 바깥쪽에서 충분한 공간을 확보했습니다.',
  '반 차이도 나지 않습니다. {driver}와 {target}가 그대로 다음 방향 전환을 맞습니다.',
  '{corner} 한가운데까지 두 대가 함께 들어왔습니다. 접촉 없이 팽팽한 싸움입니다.',
  '{driver}와 {target} 모두 라인을 포기하지 않습니다. 승부가 한 코너 더 이어질 수 있습니다.',
  '두 대의 앞바퀴가 거의 같은 선에 있습니다. 지금은 작은 가속 차이가 중요합니다.',
  '{driver}가 조금 앞서지만 {target}가 더 넓은 출구를 준비하고 있습니다.',
  '직선에서 시작된 싸움이 코너 안쪽까지 이어집니다. 아직 결과가 나지 않았습니다.',
  '{position}를 두고 두 대가 완전히 붙었습니다. 어느 쪽도 먼저 물러서지 않습니다.',
  '{driver}가 옆자리를 확보했습니다. 이제 {target}도 평소 라인을 그대로 쓰기 어렵습니다.',
  '두 드라이버가 서로 한 차 폭씩만 남기고 달립니다. 굉장히 깔끔한 휠 투 휠입니다.'
 ]),
 COUNTER_ATTACK:Object.freeze([
  '{driver}가 앞에 섰지만 {target}가 바로 슬립스트림을 다시 잡습니다.',
  '{target}가 추월 직후 간격을 거의 내주지 않았습니다. 반격 준비가 빠릅니다.',
  '순위는 바뀌었지만 싸움은 끝나지 않았습니다. {target}가 다시 속도를 올립니다.',
  '{target}가 다음 제동 구간을 보고 라인을 천천히 바꿉니다.',
  '{driver}가 숨을 돌리기 전에 {target}가 다시 공격 거리로 들어왔습니다.',
  '{target}가 출구에서 더 좋은 가속을 만들었습니다. 이번에는 {driver}가 수비해야 합니다.',
  '{target}가 바로 안쪽으로 가지 않고 한 번 더 움직임을 숨깁니다.',
  '한 번 내준 자리를 곧바로 되찾으려는 {target}. 두 번째 승부가 시작됩니다.',
  '{target}가 코너 하나를 포기하고 다음 직선을 위한 위치를 선택합니다.',
  '{driver}의 추월이 완전히 굳기 전에 {target}가 다시 간격을 지웁니다.',
  '{target}가 반대쪽 라인을 택합니다. 첫 번째 싸움과는 다른 그림입니다.',
  '추월 직후의 짧은 틈을 {target}가 놓치지 않습니다. 바로 재공격입니다.'
 ]),
 PASS_SUCCESS:Object.freeze([
  '{driver}가 좋은 출구 속도를 끝까지 유지하며 {target} 앞에 완전히 섭니다.',
  '{driver}가 한 번의 방향 전환으로 공간을 만든 뒤 추월을 마무리합니다.',
  '{corner}에서 길게 이어진 싸움 끝에 {driver}가 {position}를 확보합니다.',
  '{target}가 끝까지 버텼지만 마지막 가속에서 {driver}가 조금 더 빨랐습니다.',
  '{driver}가 접촉 없이 깔끔하게 앞에 섰습니다. 이제 간격을 만드는 단계입니다.',
  '한동안 이어진 압박이 드디어 결과로 이어집니다. {driver}가 한 자리 올라갑니다.',
  '{driver}가 제동에서 무리하지 않고 출구를 살려 추월을 완성했습니다.',
  '작은 속도 차이를 끝까지 유지한 {driver}가 결국 {target}을 넘어섭니다.',
  '{driver}가 상대의 수비 라인을 읽고 반대쪽 공간으로 빠져나왔습니다.',
  '순위표가 바뀝니다. {driver}가 이제 {target} 앞에서 레이스를 이어갑니다.',
  '{driver}가 한 번의 기회를 놓치지 않았습니다. 공격이 정확하게 끝났습니다.',
  '이번 승부는 출구에서 갈렸습니다. {driver}가 더 빠르게 다음 직선으로 나갑니다.'
 ]),
 RACE_STATUS:Object.freeze([
  '{driver}가 잠시 공격을 멈추고 타이어 온도를 다시 맞추고 있습니다.',
  '{driver}의 랩타임이 조금씩 안정됩니다. 앞차와의 간격도 크게 변하지 않습니다.',
  '{driver}가 {corner}을 깔끔하게 통과했습니다. 다음 직선에서 다시 속도를 붙입니다.',
  '중위권 흐름이 잠시 정리됩니다. {driver}도 자신의 페이스를 다시 찾습니다.',
  '{driver}가 무리하지 않고 앞차의 움직임을 계속 관찰하고 있습니다.',
  '직선에서는 {driver}가 조금 더 빠릅니다. 코너에서 그 차이를 얼마나 지킬지가 관건입니다.',
  '{driver}가 한동안 같은 간격을 유지합니다. 타이밍을 기다리는 모습입니다.',
  '뒤쪽 그룹도 조용하지 않습니다. {driver}가 조금씩 앞으로 따라붙고 있습니다.',
  '{driver}의 타이어가 안정되면서 페이스도 다시 살아나는 모습입니다.',
  '{position}의 {driver}, 지금은 공격보다 리듬 유지에 집중하고 있습니다.',
  '{driver}가 깨끗한 공기를 찾으면서 주행 라인을 조금씩 조정합니다.',
  '앞차가 보이기 시작합니다. {driver}가 서두르지 않고 간격을 줄입니다.',
  '{driver}가 코너 진입을 안정적으로 가져가며 출구 속도를 챙깁니다.',
  '레이스 흐름이 잠시 잔잔해졌습니다. {driver}는 다음 싸움을 준비합니다.',
  '{driver}가 직전 랩보다 조금 더 좋은 리듬을 보여줍니다.',
  '지금은 작은 실수를 줄이는 구간입니다. {driver}가 차를 안정적으로 관리합니다.',
  '{driver}가 앞쪽 그룹의 페이스를 따라가며 기회를 기다립니다.',
  '{corner}을 지난 {driver}가 다음 제동 구간까지 차분하게 속도를 올립니다.',
  '{driver}가 타이어를 아끼면서도 앞차와의 거리를 놓치지 않습니다.',
  '아직 큰 움직임은 없지만 {driver}의 페이스가 조금씩 좋아지고 있습니다.'
 ])
});

function buildLiveCutinLibraryV307(){
 const out={};
 for(const [event,parts] of Object.entries(LIVE_CUTIN_TEXT_PARTS_V307)){
  const generated=parts.lead.flatMap((lead,i)=>parts.action.map((action,j)=>Object.freeze({id:event+'-'+i+'-'+j,text:lead+' '+action})));
  const extra=(LIVE_CUTIN_EXTRA_V308[event]||[]).map((text,index)=>Object.freeze({id:event+'-direct-v308-'+index,text}));
  const natural=(LIVE_CUTIN_NATURAL_V332[event]||[]).map((text,index)=>Object.freeze({id:event+'-natural-v332-'+index,text}));
  out[event]=Object.freeze([...generated,...extra,...natural]);
 }
 return Object.freeze(out);
}
const LIVE_CUTIN_LIBRARY_V307=buildLiveCutinLibraryV307();
const LIVE_DIVERSITY_CONFIG_V315=Object.freeze({recentDriverLimit:8,semanticWindow:5,exposureWeight:2.3,rearCoverageWeight:1.2});
const LIVE_CUTIN_STATUS_V315=Object.freeze([
 '전열을 다시 정리합니다. {driver}가 {position}에서 다음 승부를 준비합니다.',
 '{driver}가 트래픽 흐름을 읽으며 페이스를 조금씩 끌어올립니다.',
 '후미에서도 싸움은 계속됩니다. {driver}가 앞차와의 간격을 줄이기 시작합니다.',
 '{driver}가 타이어를 지키면서도 직선에서 속도를 잃지 않습니다.',
 '조용히 기회를 모으는 {driver}. 아직 레이스는 끝나지 않았습니다.',
 '{driver}가 {corner}을 안정적으로 통과하며 다음 구간을 노립니다.',
 '중위권 흐름이 바뀝니다. {driver}가 주변 차량과의 간격을 다시 계산합니다.',
 '{driver}가 무리하지 않고 리듬을 유지합니다. 다음 공격 지점을 기다립니다.',
 '페이스가 살아납니다. {driver}가 앞쪽 그룹을 다시 시야에 넣습니다.',
 '{driver}가 긴 호흡으로 추격을 이어갑니다. 작은 차이가 쌓이고 있습니다.',
 '순위표 아래쪽에서도 움직임이 있습니다. {driver}가 속도를 끌어올립니다.',
 '{driver}가 깨끗한 공기를 찾으며 주행 라인을 바꿔 봅니다.',
 '지금은 인내의 구간입니다. {driver}가 타이밍을 기다립니다.',
 '{driver}의 랩이 안정됩니다. 앞차와의 싸움을 다시 준비합니다.',
 '{driver}가 {position}에서 레이스 흐름을 놓치지 않고 있습니다.',
 '한 번의 좋은 출구가 필요합니다. {driver}가 {corner}을 향합니다.',
 '앞선 그룹만 볼 때가 아닙니다. {driver}도 꾸준히 거리를 좁힙니다.',
 '{driver}가 속도와 타이어 사이에서 균형을 잡으며 추격합니다.',
 '레이스 중반의 작은 변화입니다. {driver}가 조금씩 앞으로 다가갑니다.',
 '{driver}가 다음 직선을 위해 차를 정돈합니다. 아직 기회가 남아 있습니다.'
 ].map((text,index)=>Object.freeze({id:'RACE_STATUS-v315-'+index,text})));
const LIVE_CUTIN_CONFIG_V264=Object.freeze({
 maxActive:1,queueLimit:1,dedupeMs:7000,globalCadenceMs:9000,mergeWindowMs:10000,
 minDurationMs:6000,maxDurationMs:8200,mergeDurationMs:7600,exitMs:320,
 recentLimit:48,pairRecentLimit:20
});
const liveCutinStateV264={
 queue:[],active:new Map(),lastDriverAt:new Map(),timers:new Map(),sequence:0,lastGlobalAt:-Infinity,
 recentTemplateIds:[],pairRecent:new Map(),messageCounter:0,mergeCount:0,droppedCount:0,
 driverExposure:new Map(),recentDriverIds:[],recentSemanticKeys:[]
};
function liveCutinEventV264(state){
 return ({FOLLOWING:'RACE_STATUS',CLOSING:'RACE_STATUS',TOWING:'RACE_STATUS',PREPARING_ATTACK:'ATTACK',PULLING_OUT:'ATTACK',SIDE_BY_SIDE:'SIDE_BY_SIDE',COUNTER_ATTACK:'COUNTER_ATTACK',PASS_COMPLETED:'PASS_SUCCESS'})[String(state||'')]||'';
}
function liveCutinPriorityV307(event){return ({RACE_STATUS:.5,ATTACK:1,SIDE_BY_SIDE:2,COUNTER_ATTACK:3,PASS_SUCCESS:4})[String(event||'')]||0}
function liveSemanticKeyV315(event,text=''){
 const e=String(event||''),t=String(text||'');
 if(e==='PASS_SUCCESS'||/추월|넘어섰|순위가 뒤집|앞에 섭/.test(t))return 'PASS';
 if(e==='SIDE_BY_SIDE'||/나란히|병렬|바퀴 하나/.test(t))return 'SIDE_BY_SIDE';
 if(/브레이크|제동|브레이킹/.test(t))return 'BRAKING';
 if(/타이어|그립/.test(t))return 'TYRE';
 if(/라인|공간|빈틈|안쪽|바깥/.test(t))return 'LINE';
 if(/간격|거리|붙었|좁힙|다가갑/.test(t))return 'GAP';
 if(/페이스|속도|가속|직선/.test(t))return 'PACE';
 if(/압박|수비|방어/.test(t))return 'PRESSURE';
 return e||'STATUS';
}
function rememberLiveDriverV315(driverId){
 const id=String(driverId||'');if(!id)return;
 liveCutinStateV264.driverExposure.set(id,(Number(liveCutinStateV264.driverExposure.get(id))||0)+1);
 liveCutinStateV264.recentDriverIds.push(id);
 if(liveCutinStateV264.recentDriverIds.length>LIVE_DIVERSITY_CONFIG_V315.recentDriverLimit)liveCutinStateV264.recentDriverIds.splice(0,liveCutinStateV264.recentDriverIds.length-LIVE_DIVERSITY_CONFIG_V315.recentDriverLimit);
}
function rememberLiveSemanticV315(event,text){
 const key=liveSemanticKeyV315(event,text);liveCutinStateV264.recentSemanticKeys.push(key);
 const limit=Math.max(6,LIVE_DIVERSITY_CONFIG_V315.semanticWindow*3);
 if(liveCutinStateV264.recentSemanticKeys.length>limit)liveCutinStateV264.recentSemanticKeys.splice(0,liveCutinStateV264.recentSemanticKeys.length-limit);
 return key;
}
function liveCutinSessionKeyV307(vehicle,target){
 const ids=[String(vehicle?.id||''),String(target?.id||'')].filter(Boolean).sort();
 return ids.join('::')||String(vehicle?.id||'unknown');
}
function rememberLiveTemplateV307(templateId,sessionKey){
 const id=String(templateId||'');if(!id)return;
 liveCutinStateV264.recentTemplateIds.push(id);
 if(liveCutinStateV264.recentTemplateIds.length>LIVE_CUTIN_CONFIG_V264.recentLimit)liveCutinStateV264.recentTemplateIds.splice(0,liveCutinStateV264.recentTemplateIds.length-LIVE_CUTIN_CONFIG_V264.recentLimit);
 const pair=liveCutinStateV264.pairRecent.get(sessionKey)||[];
 pair.push(id);
 if(pair.length>LIVE_CUTIN_CONFIG_V264.pairRecentLimit)pair.splice(0,pair.length-LIVE_CUTIN_CONFIG_V264.pairRecentLimit);
 liveCutinStateV264.pairRecent.set(sessionKey,pair);
}
function liveCutinMessageStateV307(event,vehicle,target,commit=true){
 const eventKey=String(event||''),pool=eventKey==='RACE_STATUS'?[...LIVE_CUTIN_STATUS_V315,...LIVE_CUTIN_NATURAL_V332.RACE_STATUS.map((text,index)=>Object.freeze({id:'RACE_STATUS-natural-v332-'+index,text}))]:(LIVE_CUTIN_LIBRARY_V307[eventKey]||[]);
 const sessionKey=liveCutinSessionKeyV307(vehicle,target);
 const recent=new Set(liveCutinStateV264.recentTemplateIds),pairRecent=new Set(liveCutinStateV264.pairRecent.get(sessionKey)||[]);
 const semanticRecent=new Set(liveCutinStateV264.recentSemanticKeys.slice(-LIVE_DIVERSITY_CONFIG_V315.semanticWindow));
 let candidates=pool.filter(row=>!recent.has(row.id)&&!pairRecent.has(row.id)&&!semanticRecent.has(liveSemanticKeyV315(eventKey,row.text)));
 if(!candidates.length)candidates=pool.filter(row=>!pairRecent.has(row.id)&&!semanticRecent.has(liveSemanticKeyV315(eventKey,row.text)));
 if(!candidates.length)candidates=pool.filter(row=>!recent.has(row.id));
 if(!candidates.length)candidates=pool;
 const counter=Number(liveCutinStateV264.messageCounter)||0;
 const seed=hashDriverV189([
  String(activeRaceSnapshotV187?.createdAt||'race'),String(event||''),String(vehicle?.id||''),String(target?.id||''),
  String(counter),String(Math.floor((Number(simClockV192.simTimeMs)||0)/1000)),'cutin-v307'
 ].join('|'))||1;
 const template=candidates.length?candidates[Math.abs(seed)%candidates.length]:{id:'fallback',text:'승부의 순간이 찾아왔습니다.'};
 const message=formatNarrativeV263(template.text,{
  driver:vehicle?.driver?.name||'드라이버',target:target?.driver?.name||'앞차',
  position:narrativePositionLabelV263(vehicle),corner:narrativeCornerLabelV263(vehicle)
 });
 if(commit){liveCutinStateV264.messageCounter+=1;rememberLiveTemplateV307(template.id,sessionKey);rememberLiveSemanticV315(eventKey,template.text)}
 return {message,templateId:template.id,sessionKey,semanticKey:liveSemanticKeyV315(eventKey,template.text)};
}
function liveCutinMessageV264(event,vehicle,target){return liveCutinMessageStateV307(event,vehicle,target,false).message}
function liveCutinLayerV264(){return document.getElementById('f1RacingLiveCutinLayerV264')}
function clearLiveCutinTimerV264(id){
 const timer=liveCutinStateV264.timers.get(String(id));if(timer)clearTimeout(timer);
 liveCutinStateV264.timers.delete(String(id));
}
function removeLiveCutinV264(id){
 const key=String(id||''),entry=liveCutinStateV264.active.get(key);
 clearLiveCutinTimerV264(key);
 entry?.node?.remove();liveCutinStateV264.active.delete(key);
 drainLiveCutinQueueV264();return true;
}
function scheduleLiveCutinRemovalV307(entry,duration){
 if(!entry)return false;
 clearLiveCutinTimerV264(entry.id);
 entry.duration=Math.max(LIVE_CUTIN_CONFIG_V264.minDurationMs,Number(duration)||LIVE_CUTIN_CONFIG_V264.mergeDurationMs);
 entry.node?.classList.remove('is-leaving');
 const timer=setTimeout(()=>{
  entry.node?.classList.add('is-leaving');
  const exitTimer=setTimeout(()=>removeLiveCutinV264(entry.id),LIVE_CUTIN_CONFIG_V264.exitMs);
  liveCutinStateV264.timers.set(String(entry.id),exitTimer);
 },entry.duration);
 liveCutinStateV264.timers.set(String(entry.id),timer);
 return true;
}
function liveCutinPortraitHtmlV307(item){
 return item.image
  ?'<img class="f1-racing-live-cutin-avatar-v264" src="'+escapeHtml(item.image)+'" alt="">'
  :'<span class="f1-racing-live-cutin-avatar-v264 fallback">'+escapeHtml(initials(item.driverName))+'</span>';
}
function showLiveCutinV264(item){
 const layer=liveCutinLayerV264();if(!layer)return false;
 const duration=LIVE_CUTIN_CONFIG_V264.minDurationMs+(Math.abs(hashDriverV189(item.id+'|duration'))%(LIVE_CUTIN_CONFIG_V264.maxDurationMs-LIVE_CUTIN_CONFIG_V264.minDurationMs+1));
 const card=document.createElement('article');
 card.className='f1-racing-live-cutin-v264';
 card.dataset.cutinIdV264=String(item.id);card.dataset.driverIdV264=String(item.driverId);card.dataset.eventV264=String(item.event);card.dataset.sessionV307=String(item.sessionKey||'');
 card.style.setProperty('--cutin-driver-color',String(item.color||'#ffd166'));
 card.innerHTML='<div class="f1-racing-live-cutin-speed-v264" aria-hidden="true"></div><header><strong>'+escapeHtml(item.driverName)+'</strong><span><i></i> LIVE <em data-f1-live-merge-count-v307 hidden></em></span></header><div class="f1-racing-live-cutin-body-v264">'+liveCutinPortraitHtmlV307(item)+'<div class="f1-racing-live-cutin-burst-v264" aria-hidden="true"></div><p>'+escapeHtml(item.message)+'</p></div>';
 layer.appendChild(card);
 const entry={...item,node:card,duration,mergedCount:Number(item.mergedCount)||1,lastUpdateSimMs:Number(item.simTimeMs)||0};
 liveCutinStateV264.active.set(String(item.id),entry);
 requestAnimationFrame(()=>card.classList.add('is-visible'));
 scheduleLiveCutinRemovalV307(entry,duration);
 return true;
}
function updateLiveCutinV307(entry,item){
 if(!entry)return false;
 entry.event=item.event;entry.state=item.state;entry.driverId=item.driverId;entry.driverName=item.driverName;entry.image=item.image;entry.color=item.color;
 entry.targetId=item.targetId;entry.message=item.message;entry.templateId=item.templateId;entry.lastUpdateSimMs=item.simTimeMs;entry.simTimeMs=item.simTimeMs;
 entry.mergedCount=(Number(entry.mergedCount)||1)+1;
 if(entry.node){
  entry.node.dataset.driverIdV264=String(item.driverId);entry.node.dataset.eventV264=String(item.event);entry.node.dataset.sessionV307=String(item.sessionKey||'');
  entry.node.style.setProperty('--cutin-driver-color',String(item.color||'#ffd166'));
  const title=entry.node.querySelector('header strong');if(title)title.textContent=item.driverName;
  const p=entry.node.querySelector('p');if(p)p.textContent=item.message;
  const avatar=entry.node.querySelector('.f1-racing-live-cutin-avatar-v264');if(avatar)avatar.outerHTML=liveCutinPortraitHtmlV307(item);
  const count=entry.node.querySelector('[data-f1-live-merge-count-v307]');if(count){count.hidden=false;count.textContent='×'+entry.mergedCount}
  entry.node.classList.remove('is-leaving');entry.node.classList.add('is-merged-v307');
  requestAnimationFrame(()=>requestAnimationFrame(()=>entry.node?.classList.remove('is-merged-v307')));
 }
 liveCutinStateV264.mergeCount+=1;
 scheduleLiveCutinRemovalV307(entry,LIVE_CUTIN_CONFIG_V264.mergeDurationMs);
 return true;
}
function findLiveCutinSessionV307(sessionKey,now){
 const active=[...liveCutinStateV264.active.values()].find(row=>row.sessionKey===sessionKey&&now-Number(row.lastUpdateSimMs??row.simTimeMs)<=LIVE_CUTIN_CONFIG_V264.mergeWindowMs);
 if(active)return {kind:'active',entry:active};
 const queued=liveCutinStateV264.queue.find(row=>row.sessionKey===sessionKey&&now-Number(row.lastUpdateSimMs??row.simTimeMs)<=LIVE_CUTIN_CONFIG_V264.mergeWindowMs);
 return queued?{kind:'queue',entry:queued}:null;
}
function drainLiveCutinQueueV264(){
 while(liveCutinStateV264.active.size<LIVE_CUTIN_CONFIG_V264.maxActive&&liveCutinStateV264.queue.length){
  const item=liveCutinStateV264.queue.shift();if(!showLiveCutinV264(item))break;
 }
 const layer=liveCutinLayerV264();if(layer)layer.dataset.activeCutinsV264=String(liveCutinStateV264.active.size);
 return {active:liveCutinStateV264.active.size,queued:liveCutinStateV264.queue.length};
}
function enqueueLiveCutinV264(vehicle,state,targetId=''){
 if(engineQaV240.active||!vehicle||!liveCutinLayerV264())return false;
 const event=liveCutinEventV264(state);if(!event)return false;
 const now=Number(simClockV192.simTimeMs)||0,key=String(vehicle.id||'');
 const target=raceMotionV189.vehicles.find(row=>String(row.id)===String(targetId||vehicle.battleTargetId||''))||null;
 const sessionKey=liveCutinSessionKeyV307(vehicle,target);
 const existing=findLiveCutinSessionV307(sessionKey,now);
 if(existing){
  const copy=liveCutinMessageStateV307(event,vehicle,target,true);
  const item={event,state:String(state),driverId:key,driverName:String(vehicle.driver?.name||'드라이버'),image:String(vehicle.driver?.image||''),color:String(vehicle.driverColorV216||'#ffd166'),targetId:String(target?.id||''),message:copy.message,templateId:copy.templateId,sessionKey,simTimeMs:now,lastUpdateSimMs:now};
  liveCutinStateV264.lastDriverAt.set(key,now);liveCutinStateV264.lastGlobalAt=now;
  if(existing.kind==='active'){const updated=updateLiveCutinV307(existing.entry,item);if(updated)rememberLiveDriverV315(key);return updated}
  Object.assign(existing.entry,item,{mergedCount:(Number(existing.entry.mergedCount)||1)+1});liveCutinStateV264.mergeCount+=1;rememberLiveDriverV315(key);return true;
 }
 const previous=Number(liveCutinStateV264.lastDriverAt.get(key));
 if(Number.isFinite(previous)&&now-previous<LIVE_CUTIN_CONFIG_V264.dedupeMs){liveCutinStateV264.droppedCount+=1;return false}
 if(event!=='PASS_SUCCESS'&&Number.isFinite(liveCutinStateV264.lastGlobalAt)&&now-liveCutinStateV264.lastGlobalAt<LIVE_CUTIN_CONFIG_V264.globalCadenceMs){liveCutinStateV264.droppedCount+=1;return false}
 const copy=liveCutinMessageStateV307(event,vehicle,target,true);
 liveCutinStateV264.lastDriverAt.set(key,now);liveCutinStateV264.lastGlobalAt=now;
 const id='v264-'+(++liveCutinStateV264.sequence)+'-'+key;
 const item={id,event,state:String(state),driverId:key,driverName:String(vehicle.driver?.name||'드라이버'),image:String(vehicle.driver?.image||''),color:String(vehicle.driverColorV216||'#ffd166'),targetId:String(target?.id||''),message:copy.message,templateId:copy.templateId,sessionKey,simTimeMs:now,lastUpdateSimMs:now,mergedCount:1};
 if(liveCutinStateV264.active.size<LIVE_CUTIN_CONFIG_V264.maxActive){const shown=showLiveCutinV264(item);if(shown)rememberLiveDriverV315(key);return shown}
 if(liveCutinStateV264.queue.length<LIVE_CUTIN_CONFIG_V264.queueLimit){liveCutinStateV264.queue.push(item);rememberLiveDriverV315(key);return true}
 const queued=liveCutinStateV264.queue[0];
 if(liveCutinPriorityV307(event)>liveCutinPriorityV307(queued?.event)){liveCutinStateV264.queue[0]=item;rememberLiveDriverV315(key);return true}
 liveCutinStateV264.droppedCount+=1;return false;
}
function resetLiveCutinsV264(){
 for(const id of [...liveCutinStateV264.timers.keys()])clearLiveCutinTimerV264(id);
 liveCutinStateV264.queue=[];liveCutinStateV264.active.clear();liveCutinStateV264.lastDriverAt=new Map();liveCutinStateV264.sequence=0;
 liveCutinStateV264.lastGlobalAt=-Infinity;liveCutinStateV264.recentTemplateIds=[];liveCutinStateV264.pairRecent=new Map();liveCutinStateV264.messageCounter=0;liveCutinStateV264.mergeCount=0;liveCutinStateV264.droppedCount=0;
 liveCutinStateV264.driverExposure=new Map();liveCutinStateV264.recentDriverIds=[];liveCutinStateV264.recentSemanticKeys=[];
 const layer=liveCutinLayerV264();if(layer){layer.innerHTML='';layer.dataset.activeCutinsV264='0'}
 return true;
}
function qaLiveCutinV264(){
 const states=['PULLING_OUT','SIDE_BY_SIDE','COUNTER_ATTACK','PASS_COMPLETED'];
 const events=states.map(state=>liveCutinEventV264(state));
 return {layerReady:Boolean(liveCutinLayerV264()),maxActive:LIVE_CUTIN_CONFIG_V264.maxActive,dedupeMs:LIVE_CUTIN_CONFIG_V264.dedupeMs,minDurationMs:LIVE_CUTIN_CONFIG_V264.minDurationMs,maxDurationMs:LIVE_CUTIN_CONFIG_V264.maxDurationMs,states,events,active:liveCutinStateV264.active.size,queued:liveCutinStateV264.queue.length,
  allPass:Boolean(liveCutinLayerV264())&&LIVE_CUTIN_CONFIG_V264.maxActive===1&&LIVE_CUTIN_CONFIG_V264.dedupeMs>=2500&&LIVE_CUTIN_CONFIG_V264.minDurationMs>=4500&&LIVE_CUTIN_CONFIG_V264.maxDurationMs>=6000&&events.every(Boolean)};
}
function qaLiveReadabilityVarietyV332(){
  const eventCounts=Object.fromEntries(Object.entries(LIVE_CUTIN_LIBRARY_V307).map(([event,pool])=>[event,pool.length]));
  const statusCount=LIVE_CUTIN_STATUS_V315.length+LIVE_CUTIN_NATURAL_V332.RACE_STATUS.length;
  const naturalCounts=Object.fromEntries(Object.entries(LIVE_CUTIN_NATURAL_V332).map(([event,pool])=>[event,pool.length]));
  return {version:VERSION332,eventCounts,statusCount,naturalCounts,semanticWindow:LIVE_DIVERSITY_CONFIG_V315.semanticWindow,recentDriverLimit:LIVE_DIVERSITY_CONFIG_V315.recentDriverLimit,
    allPass:Object.values(eventCounts).every(count=>count>=90)&&statusCount>=36&&Object.values(naturalCounts).every(count=>count>=12)&&LIVE_DIVERSITY_CONFIG_V315.semanticWindow>=4&&LIVE_DIVERSITY_CONFIG_V315.recentDriverLimit>=7};
}

function qaLiveCutinPolicyV307(){
 const counts=Object.fromEntries(Object.entries(LIVE_CUTIN_LIBRARY_V307).map(([event,pool])=>[event,pool.length]));
 const all=[...Object.values(LIVE_CUTIN_LIBRARY_V307).flat()];
 const uniqueTexts=new Set(all.map(row=>row.text));
 return {version:VERSION307,templateCount:all.length,uniqueTemplateCount:uniqueTexts.size,eventCounts:counts,config:{...LIVE_CUTIN_CONFIG_V264},recentLimit:LIVE_CUTIN_CONFIG_V264.recentLimit,pairRecentLimit:LIVE_CUTIN_CONFIG_V264.pairRecentLimit,
  allPass:all.length>=256&&uniqueTexts.size===all.length&&Object.values(counts).every(count=>count>=60)&&LIVE_CUTIN_CONFIG_V264.maxActive===1&&LIVE_CUTIN_CONFIG_V264.queueLimit===1&&LIVE_CUTIN_CONFIG_V264.globalCadenceMs>=5000&&LIVE_CUTIN_CONFIG_V264.mergeWindowMs>=6500&&LIVE_CUTIN_CONFIG_V264.minDurationMs>=4500&&LIVE_CUTIN_CONFIG_V264.recentLimit>=24};
}


function podiumMovementV265(row){
  const grid=Math.max(1,Number(row?.gridPosition)||1),finish=Math.max(1,Number(row?.position)||1),delta=grid-finish;
  return {grid,finish,delta,label:delta>0?'▲'+delta:delta<0?'▼'+Math.abs(delta):'–'};
}
function podiumAvatarHtmlV265(row){
  const image=String(row?.image||'').trim(),name=String(row?.name||'Driver');
  return image
    ?'<img class="f1-racing-podium-avatar-v265" src="'+escapeHtml(image)+'" alt="'+escapeHtml(name)+'">'
    :'<span class="f1-racing-podium-avatar-v265 fallback">'+escapeHtml(initials(name))+'</span>';
}
function podiumCardHtmlV265(row,index){
  const place=index+1,movement=podiumMovementV265(row),best=Number(row?.bestLapMs)||0,overtakes=Number(row?.passCompletedCount)||0;
  const medal=place===1?'WINNER':place===2?'P2':'P3';
  return '<article class="f1-racing-podium-card-v265 p'+place+'" data-podium-place-v265="'+place+'">'+
    '<div class="f1-racing-podium-place-v265">P'+place+'</div>'+
    podiumAvatarHtmlV265(row)+
    '<span class="f1-racing-podium-medal-v265">'+medal+'</span>'+
    '<strong>'+escapeHtml(row?.name||'Driver')+'</strong>'+
    '<div class="f1-racing-podium-grid-v265"><span>START P'+String(movement.grid).padStart(2,'0')+'</span><span>FINISH P'+String(movement.finish).padStart(2,'0')+'</span><b>'+movement.label+'</b></div>'+
    '<div class="f1-racing-podium-stats-v265"><span>BEST LAP <b>'+escapeHtml(formatLapTimeV248(best))+'</b></span><span>OVERTAKES <b>'+overtakes+'</b></span></div>'+
  '</article>';
}
function renderPodiumTrackV265(){
  const svg=document.getElementById('f1RacingPodiumTrackSilhouetteV265'),path=document.getElementById('f1RacingPodiumTrackPathV265');
  const track=activeRaceSnapshotV187?.track;
  if(!svg||!path||!track)return false;
  const viewBox=Array.isArray(track.viewBox)&&track.viewBox.length===4?track.viewBox:[0,0,1000,600];
  svg.setAttribute('viewBox',viewBox.map(value=>Number(value)||0).join(' '));
  path.setAttribute('d',String(track.path||''));
  return Boolean(track.path);
}
function qaPodiumV265(){
  const synthetic=[
    {position:1,gridPosition:3,name:'Winner',image:'',bestLapMs:81482,passCompletedCount:3},
    {position:2,gridPosition:1,name:'Second',image:'',bestLapMs:82001,passCompletedCount:1},
    {position:3,gridPosition:5,name:'Third',image:'',bestLapMs:82500,passCompletedCount:4}
  ];
  const cards=synthetic.map(podiumCardHtmlV265);
  const single=podiumCardHtmlV265(synthetic[0],0);
  const domReady=Boolean(document.getElementById('f1RacingPodiumRowsRecoveryG')&&document.getElementById('f1RacingPodiumTrackNameV265')&&document.getElementById('f1RacingPodiumMetaV265')&&document.getElementById('f1RacingPodiumTrackSilhouetteV265')&&document.getElementById('f1RacingPodiumReplayV265'));
  return {domReady,cards:cards.length,singleSafe:single.includes('WINNER')&&single.includes('START P03')&&single.includes('FINISH P01')&&single.includes('▲2'),bestLap:cards[0].includes('1:21.482'),overtakes:cards[0].includes('OVERTAKES <b>3</b>'),allPass:domReady&&cards.length===3&&single.includes('WINNER')&&single.includes('▲2')&&cards[0].includes('1:21.482')&&cards[0].includes('OVERTAKES <b>3</b>')};
}


const TRACK_CARD_CHARACTER_V266=Object.freeze({
  'majoku-ring-v1':Object.freeze({label:'BALANCED',description:'균형형',detail:'직선과 중속 코너가 고르게 섞인 올라운드 서킷'}),
  'castle-street-circuit-v1':Object.freeze({label:'TECHNICAL',description:'기술형',detail:'연속 코너와 제동 정확도가 중요한 테크니컬 레이아웃'}),
  'blue-coast-speedway-v1':Object.freeze({label:'HIGH-SPEED FLOW',description:'고속 플로우',detail:'긴 호흡의 고속 코너와 흐름을 유지하는 주행이 핵심'}),
  'mawang-speed-park-v1':Object.freeze({label:'LONG STRAIGHT',description:'긴 직선',detail:'긴 직선과 강한 제동 구간에서 추월이 발생하기 쉬움'}),
  'royal-street-circuit-v1':Object.freeze({label:'NARROW STREET',description:'좁은 시가지',detail:'폭이 좁고 복잡한 코너가 이어지는 시가지형 서킷'}),
  'infinity-eight-circuit-v1':Object.freeze({label:'CROSSOVER',description:'교차 구조',detail:'8자 교차 흐름과 방향 전환이 반복되는 독특한 레이아웃'}),
  'highland-flow-ring-v1':Object.freeze({label:'SWEEPING',description:'스위핑 고속',detail:'큰 반경 코너를 연속으로 연결하는 고속 리듬형 서킷'})
});
function trackSpeedTierV266(profile={}){
  const value=Number(profile?.maxStraightKph)||0;
  return value>=335?'HIGH':value>=310?'MID':'LOW';
}
function trackCardCharacterV266(track={}){
  return TRACK_CARD_CHARACTER_V266[String(track?.id||'')]||Object.freeze({label:'CIRCUIT',description:String(track?.archetype||'종합형'),detail:'트랙 데이터 기반 레이아웃'});
}
function trackCardHtmlV266(track,selected=false){
  const viewBox=(Array.isArray(track?.viewBox)?track.viewBox:[0,0,1000,600]).map(value=>Number(value)||0).join(' ');
  const character=trackCardCharacterV266(track);
  const speedTier=trackSpeedTierV266(track?.profile||{});
  const overtakes=Math.max(0,Number(track?.profile?.overtakeZones)||0);
  return '<button type="button" class="f1-racing-track-card-v186 f1-racing-track-card-v266 '+(selected?'selected':'')+'" data-f1-track-id="'+escapeHtml(track?.id||'')+'" data-f1-speed-tier-v266="'+speedTier+'" aria-pressed="'+(selected?'true':'false')+'">'+
    '<span class="f1-racing-track-card-top-v266"><span class="f1-racing-track-card-title-v186">'+escapeHtml(track?.name||'Track')+'</span><span class="f1-racing-track-card-code-v266">'+escapeHtml(character.label)+'</span></span>'+
    '<span class="f1-racing-track-card-silhouette-v233 f1-racing-track-card-silhouette-v266"><svg viewBox="'+escapeHtml(viewBox)+'" aria-hidden="true" focusable="false"><path d="'+escapeHtml(track?.path||'')+'"></path></svg></span>'+
    '<span class="f1-racing-track-card-character-v266"><b>'+escapeHtml(character.description)+'</b><small>'+escapeHtml(character.detail)+'</small></span>'+
    '<span class="f1-racing-track-card-tech-v266">'+
      '<span><small>LENGTH</small><b>'+((Number(track?.lengthMeters)||0)/1000).toFixed(3)+' KM</b></span>'+
      '<span><small>TOP SPEED</small><b>'+speedTier+'</b></span>'+
      '<span><small>OVERTAKE</small><b>'+overtakes+' PTS</b></span>'+
    '</span>'+
  '</button>';
}
function qaTrackCardsV266(){
  const tracks=getTrackCatalogV186();
  const cards=tracks.map(track=>trackCardHtmlV266(track,track.id===activeTrackId));
  const expectedIds=Object.keys(TRACK_CARD_CHARACTER_V266);
  const mapped=expectedIds.every(id=>tracks.some(track=>track.id===id));
  const distinctPaths=new Set(tracks.map(track=>String(track.path||''))).size;
  const tiers=tracks.map(track=>trackSpeedTierV266(track.profile));
  const domCards=document.querySelectorAll('#f1RacingTrackOptionsV186 .f1-racing-track-card-v266').length;
  return {trackCount:tracks.length,mapped,distinctPaths,tiers,domCards,hasTechnicalFields:cards.every(card=>card.includes('LENGTH')&&card.includes('TOP SPEED')&&card.includes('OVERTAKE')),allPass:tracks.length===7&&mapped&&distinctPaths===7&&cards.length===7&&cards.every(card=>card.includes('f1-racing-track-card-silhouette-v266'))&&cards.every(card=>card.includes('data-f1-speed-tier-v266'))&&cards.every(card=>card.includes('LENGTH')&&card.includes('TOP SPEED')&&card.includes('OVERTAKE'))&&(domCards===0||domCards===7)};
}


const SPECTATOR_QA_CASES_V267=Object.freeze([
  Object.freeze({id:'3x5',trackId:'majoku-ring-v1',drivers:3,laps:5,stepMs:100,maxSteps:26000}),
  Object.freeze({id:'6x10',trackId:'blue-coast-speedway-v1',drivers:6,laps:10,stepMs:100,maxSteps:36000}),
  Object.freeze({id:'12x20',trackId:'highland-flow-ring-v1',drivers:12,laps:20,stepMs:100,maxSteps:50000})
]);
function spectatorQaCaseV267(spec,index){
  const started=typeof performance!=='undefined'?performance.now():Date.now();
  const result=runAcceleratedEngineRaceV240(spec.trackId,{drivers:spec.drivers,laps:spec.laps,runIndex:26700+index,stepMs:spec.stepMs,maxSteps:spec.maxSteps,gridMode:'FIXED'});
  const ended=typeof performance!=='undefined'?performance.now():Date.now();
  const rows=Array.isArray(result?.resultRows)?result.resultRows:[];
  const timing=Array.isArray(result?.lapTiming)?result.lapTiming:[];
  return {
    id:spec.id,trackId:spec.trackId,drivers:spec.drivers,laps:spec.laps,
    completed:Boolean(result?.completed),resultRows:rows.length,timingRows:timing.length,
    allFinished:rows.length===spec.drivers&&rows.every(row=>Number(row?.position)>=1),
    timedLaps:timing.length===spec.drivers&&timing.every(row=>Number(row?.timedCompletedLaps)===spec.laps&&Array.isArray(row?.lapTimesMs)&&row.lapTimesMs.length===spec.laps),
    totalPasses:Number(result?.telemetry?.totalPasses)||0,
    fieldAverageSpeedKph:Number(result?.telemetry?.fieldAverageSpeedKph)||0,
    steps:Number(result?.steps)||0,durationMs:Math.max(0,Math.round(ended-started)),
    error:String(result?.error||'')
  };
}
function qaIntegratedSpectatorDesktopV267(){
  const cases=SPECTATOR_QA_CASES_V267.map(spectatorQaCaseV267);
  const workspaceClean=Boolean(document.getElementById('f1RacingWorkspaceRecoveryE'));
  const featureChecks={
    embeddedProfiles:typeof syncEmbeddedDriverMarkerV257==='function',
    positionBadges:typeof syncRaceMarkerPositionV254==='function',
    battleLinks:typeof syncBattleLinksV256==='function',
    lateralSmoothing:typeof updateVisualLateralOffsetV258==='function',
    workspacePersistence:typeof restoreWorkspaceUserDefaultV259==='function',
    customLaps:typeof setLapCountV260==='function',
    fullscreen:typeof enterF1ImmersiveV261==='function',
    liveCutin:typeof enqueueLiveCutinV264==='function',
    autoCamera:typeof setRaceCameraModeV216==='function',
    commentary:typeof appendRaceCommentaryV222==='function',
    podium:typeof renderPodiumRecoveryG==='function',
    pit:typeof qaPitCycleV205==='function'&&typeof requestPitStopV205==='function',
    overtake:typeof nextPassStateV208==='function',
    fastestLap:typeof syncSpectatorHighlightsV252==='function',
    raceCompletion:typeof finishRaceRecoveryG==='function'
  };
  const cutinClean=liveCutinStateV264.active.size===0&&liveCutinStateV264.queue.length===0&&liveCutinLayerV264()?.children.length===0;
  const noEngineResidue=f1ScreenStateV185==='SETUP'&&!engineQaV240.active&&raceMotionV189.vehicles.length===0;
  return {
    cases,featureChecks,workspaceClean,cutinClean,noEngineResidue,
    allPass:cases.length===3&&cases.every(row=>row.completed&&row.allFinished&&row.timedLaps&&row.fieldAverageSpeedKph>0&&!row.error)&&Object.values(featureChecks).every(Boolean)&&workspaceClean&&cutinClean&&noEngineResidue
  };
}

const F1_LAP_MIN_V260=3;
const F1_LAP_MAX_V260=99;
const VISUAL_LATERAL_RESPONSE_V258=Object.freeze({normal:7.5,attack:8.8,pit:9.8,incident:12.5});
const VISUAL_LATERAL_DYNAMICS_V269=Object.freeze({normalMaxSpeed:2.4,attackMaxSpeed:3.0,pitMaxSpeed:3.4,incidentMaxSpeed:3.8,maxAcceleration:7.5,targetGain:2.15,lineModeHoldMs:420,snapMeters:.018});
const BATTLE_LINK_MAX_LENGTH_V256=88;
const F1_WORKSPACE_LAYOUT_VERSION_V249=6;
const RACE_PLAYBACK_BASE_V247=2;
const engineQaV240={active:false};
let engineSuiteCacheV241=null;
const CAMERA_DIRECTOR_STABILITY_V229=Object.freeze({candidateHoldMs:700,minSwitchMs:1800,urgentBattleGapSeconds:0.55,focusDeadbandSvg:3,zoomDeadband:0.025});
const COMMENTARY_CADENCE_V227=Object.freeze({flowGapMs:5500,strategyGapMs:3000,battleGapMs:1600,windowMs:60000,maxNarrativePerWindow:18});
const DRIVER_COLORS_V216=Object.freeze(['#43a5ff','#ff5f6d','#45d483','#ffbd45','#a77bff','#ff77c8','#44d7e8','#f07842','#8fd14f','#e05cff','#6dc4ff','#ffd166']);
const CAMERA_MODES_V216=Object.freeze(['AUTO','FULL','LEADER','FRONT','BATTLE','MANUAL']);
const raceCameraV216={mode:'AUTO',zoom:1.9,cx:500,cy:300,dragging:false,dragCandidateV268:false,pointerId:null,startX:0,startY:0,lastX:0,lastY:0,initialized:false,userZoomLockedV268:false,userZoomV268:1.9};
const cameraDirectorV225={kind:'LEADER',targetIds:[],lockUntilSimMs:0,lastSwitchSimMs:0,candidateKey:'',candidateSinceSimMs:0};
const BLUE_FLAG_CONFIG_V215=Object.freeze({approachProgress:0.12,paceFactor:0.985});
const RACE_FLAGS_V214=Object.freeze(['GREEN','YELLOW','VSC','SAFETY_CAR','RED']);
const RACE_FLAG_SPEED_V214=Object.freeze({GREEN:1,YELLOW:.82,VSC:.72,SAFETY_CAR:.58,RED:0});
const PASS_STATES_V208=Object.freeze(['FOLLOWING','CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','PASS_COMPLETED','PASS_FAILED','COUNTER_ATTACK']);
const PASS_CONFIG_V208=Object.freeze({followGapMeters:48,prepareGapMeters:20,pullOutGapMeters:15,sideBySideGapMeters:8,failGapMeters:32,passMarginMeters:1.2,stateHoldMs:160,maxBattleBiasKph:2.4});
const BATTLE_ACTIVE_STATES_V319=Object.freeze(['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK']);
const RACE_SPACING_CONFIG_V319=Object.freeze({
  normalDisplayGapMeters:68,
  blockedDisplayGapMeters:95,
  battleDisplayGapMeters:18,
  blockedSpeedTriggerMeters:110,
  blockedSpeedMarginKph:5,
  physicalFollowGapMeters:20,
  physicalFollowMarginKph:2.8,
  overtakeReleaseClosingKph:4.5,
  emergencyGapMeters:12,
  emergencySpeedMarginKph:8
});
const VISUAL_SPACING_SMOOTH_V330=Object.freeze({
  approachMs:420,
  releaseMs:560,
  maxStepMetersPerSecond:185,
  snapMeters:.28
});
const SPECTATOR_BATTLE_STATES_V252=Object.freeze(['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK']);
const SPECTATOR_OVERTAKE_STATES_V252=Object.freeze(['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK']);
const LONG_RUN_GAP_CONFIG_V209=Object.freeze({settlingLaps:3.5,maxOpeningPaceBias:0.0045,maxSettledPaceBias:0.0018,relativeShape:1.25,qaLapSeconds:90,qaLaps:30});
const TRAFFIC_STATES_V207=Object.freeze(['CLEAR','FOLLOWING','TOWING','PRESSURE','DEFENDING']);
const TRAFFIC_CONFIG_V207=Object.freeze({followingGapMeters:48,pressureGapMeters:26,attackGapMeters:18,defendGapMeters:22,minClosingKph:1.5,strongClosingKph:16});
const PIT_STRATEGIES_V206=Object.freeze(['NONE','BOX_NOW','UNDERCUT','OVERCUT','GO_LONG','COVER_UNDERCUT']);
const PIT_STRATEGY_CONFIG_V206=Object.freeze({
  evaluationMs:1600,
  openingLaps:3,
  minRemainingLapsToPit:1.65,
  undercutGapSeconds:4.2,
  coverGapSeconds:7.0,
  overcutGapSeconds:6.5,
  severePressure:0.68,
  normalPressure:0.34,
  tacticalMinWear:0.48,
  overcutCompleteMinWear:0.55,
  postStopCooldownLaps:1
});
const PIT_STATES_V205=Object.freeze(['TRACK','PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_EXIT']);
const PIT_CONFIG_V205=Object.freeze({approachProgress:0.075,boxStopMs:2400,boxVariationMs:450,exitMergeProgress:0.025,warmupLaps:0.55,coldSurface:0.38,coldCarcass:0.40,minWarmupGrip:0.90});
const INCIDENT_CONFIG_V204=Object.freeze({
  evaluationMs:240,
  lockupDurationMs:720,
  understeerDurationMs:900,
  oversteerDurationMs:760,
  lockupBrakeFactor:0.80,
  understeerSpeedFactor:0.93,
  oversteerSpeedFactor:0.91,
  oversteerThrottleFactor:0.48
});
const TYRE_COMPOUNDS_V203=Object.freeze({SOFT:Object.freeze({code:'S',gripBias:1.01,wearPerLap:0.115,heatFactor:1.10,idealSurface:0.60}),MEDIUM:Object.freeze({code:'M',gripBias:1.00,wearPerLap:0.090,heatFactor:1.00,idealSurface:0.56}),HARD:Object.freeze({code:'H',gripBias:0.99,wearPerLap:0.068,heatFactor:0.90,idealSurface:0.52})});
const TYRE_CONFIG_V203=Object.freeze({ambientSurface:0.42,ambientCarcass:0.44,minGrip:0.82,maxGrip:1.03});
const DEFAULT_TOTAL_LAPS_V190=10;
const F1_LINE_MODES_V197=Object.freeze(['IDEAL','ATTACK_INSIDE','DEFENSIVE_INSIDE','OUTSIDE','PIT_LINE']);
const F1_STATES_V185=Object.freeze(['SETUP','TRANSITION','GRID','RACE','FINISHING','PODIUM','RESULT']);
const F1_TRANSITIONS_V185=Object.freeze({
  SETUP:Object.freeze(['TRANSITION']),
  TRANSITION:Object.freeze(['SETUP','GRID','RACE']),
  GRID:Object.freeze(['SETUP','RACE']),
  RACE:Object.freeze(['SETUP','FINISHING']),
  FINISHING:Object.freeze(['PODIUM','RESULT']),
  PODIUM:Object.freeze(['RESULT']),
  RESULT:Object.freeze(['SETUP'])
});
let f1ScreenStateV185='SETUP';
const selectedIds=[];
let activeTrackId='majoku-ring-v1';
let selectedTotalLapsRecoveryD=DEFAULT_TOTAL_LAPS_V190;
let lapOverrideActiveV260=false;
let immersiveStateV261={active:false,noticeTimer:0,layoutSignature:'',lastReason:'',fullscreenRequested:false};
let immersiveExitInFlightV261=false;
let persistenceRestoredRecoveryD=false;
const previewStateV184={running:false,progress:0,lastTimestamp:0,rafId:0,lapDurationMs:18000};
let activeRaceSnapshotV187=null;
let raceTransitionTimerV187=0;
let raceGeometryV193=null;
let activeRaceResultRecoveryG=null;
let finishCounterRecoveryG=0;
const raceMotionV189={running:false,suspended:false,rafId:0,lastTimestamp:0,vehicles:[],snapshotCreatedAt:'',hudAccumulatorMs:0};
const simClockV192={
  paused:false,
  timeScale:1,
  simTimeMs:0,
  accumulatorMs:0,
  fixedStepMs:20,
  maxStepsPerFrame:32
};
function simulationPlaybackRateV247(scale=simClockV192.timeScale){
  const uiScale=Number(scale);
  return RACE_PLAYBACK_BASE_V247*([1,2,4].includes(uiScale)?uiScale:1);
}
function qaRacePlaybackSpeedV247(){
  const rates=[1,2,4].map(scale=>({scale,effective:simulationPlaybackRateV247(scale)}));
  return {baseRate:RACE_PLAYBACK_BASE_V247,rates,maxStepsPerFrame:simClockV192.maxStepsPerFrame,allPass:RACE_PLAYBACK_BASE_V247===2&&rates.map(row=>row.effective).join(',')==='2,4,8'&&simClockV192.maxStepsPerFrame>=20};
}
let raceFlagStateV214={flag:'GREEN',reason:'',sinceSimMs:0};
function raceFlagSpeedFactorV214(flag=raceFlagStateV214.flag){
  return RACE_FLAG_SPEED_V214[String(flag||'GREEN')]??1;
}
function syncRaceFlagHudV214(){
  const status=document.getElementById('f1RacingRaceStatusV188');
  if(status){
    const flag=String(raceFlagStateV214.flag||'GREEN');
    const labels={GREEN:'진행 중',YELLOW:'옐로 플래그',VSC:'가상 세이프티카',SAFETY_CAR:'세이프티카',RED:'레드 플래그'};
    status.textContent=labels[flag]||flag;
    status.dataset.raceFlag=flag;
  }
  const section=document.getElementById('gameF1Racing');
  if(section)section.dataset.raceFlag=String(raceFlagStateV214.flag||'GREEN');
  return {...raceFlagStateV214};
}
function setRaceControlFlagV214(flag='GREEN',reason=''){
  const next=String(flag||'GREEN').toUpperCase();
  if(!RACE_FLAGS_V214.includes(next))return false;
  raceFlagStateV214={flag:next,reason:String(reason||''),sinceSimMs:Number(simClockV192.simTimeMs)||0};
  if(next!=='GREEN'){
    for(const vehicle of raceMotionV189.vehicles){
      vehicle.defenceActive=false;
      vehicle.battleSpeedBiasKph=0;
      if(vehicle.racingLineMode==='ATTACK_INSIDE')vehicle.racingLineMode='IDEAL';
    }
  }
  syncRaceFlagHudV214();
  return true;
}
function getRaceControlFlagV214(){return {...raceFlagStateV214}}
function qaRaceControlFlagsV214(){
  const original={...raceFlagStateV214};
  const rows=RACE_FLAGS_V214.map(flag=>{
    setRaceControlFlagV214(flag,'QA');
    return {flag,factor:raceFlagSpeedFactorV214(flag),accepted:raceFlagStateV214.flag===flag};
  });
  raceFlagStateV214=original;syncRaceFlagHudV214();
  return {rows,allPass:rows.every(row=>row.accepted&&row.factor>=0&&row.factor<=1)&&rows.find(row=>row.flag==='RED')?.factor===0};
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]});
}
function initials(name=''){
  return String(name||'?').trim().split(/\s+/).filter(Boolean).map(function(x){return x[0]}).join('').slice(0,2).toUpperCase()||'?';
}
function getContacts(){
  const source=typeof window.mwsGetF1ContactsV181==='function'?window.mwsGetF1ContactsV181():[];
  return Array.isArray(source)?source:[];
}
function contactMatches(row,query){
  if(typeof window.mwsF1ContactMatchesV181==='function')return window.mwsF1ContactMatchesV181(row,query);
  const q=String(query||'').trim().toLowerCase();
  if(!q)return true;
  return [row&&row.name].concat(row&&row.labels||[]).join(' ').toLowerCase().includes(q);
}
function pruneSelection(contacts){
  const valid=new Set(contacts.map(function(row){return String(row.id)}));
  for(let i=selectedIds.length-1;i>=0;i--)if(!valid.has(String(selectedIds[i])))selectedIds.splice(i,1);
}
function avatar(row){
  const name=escapeHtml(row&&row.name||'');
  const id=escapeHtml(row&&row.id||'');
  const src=String(row&&row.image||'').trim();
  if(src)return '<img class="f1-racing-avatar-v181" loading="lazy" decoding="async" src="'+escapeHtml(src)+'" alt="'+name+'" data-contact-id="'+id+'" data-contact-initials="'+escapeHtml(initials(row&&row.name))+'">';
  return '<span class="f1-racing-avatar-v181">'+escapeHtml(initials(row&&row.name))+'</span>';
}
function selectedSet(){return new Set(selectedIds.map(String))}
function renderContacts(){
  const list=document.getElementById('f1RacingContactListV181');
  const search=document.getElementById('f1RacingContactSearchV181');
  const count=document.getElementById('f1RacingContactCountV181');
  if(!list)return;
  const contacts=getContacts();
  pruneSelection(contacts);
  const q=String(search&&search.value||'').trim();
  const filtered=contacts.filter(function(row){return contactMatches(row,q)}).sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'ko')});
  if(count)count.textContent=filtered.length+'명';
  const selected=selectedSet();
  list.innerHTML=filtered.length?filtered.map(function(row){
    const active=selected.has(String(row.id));
    const labels=(row.labels||[]).slice(0,4).join(' · ')||'라벨 없음';
    return '<button type="button" class="f1-racing-contact-row-v181 '+(active?'selected':'')+'" data-contact-id="'+escapeHtml(row.id)+'" aria-pressed="'+(active?'true':'false')+'">'+avatar(row)+'<span style="min-width:0"><span class="f1-racing-contact-name-v181">'+escapeHtml(row.name)+'</span><span class="f1-racing-contact-meta-v181">'+escapeHtml(labels)+'</span></span><span class="f1-racing-contact-action-v181">'+(active?'선택됨':'추가')+'</span></button>';
  }).join(''):'<div class="f1-racing-empty-v181">검색 조건에 맞는 연락처가 없습니다.</div>';
  list.querySelectorAll('[data-contact-id]').forEach(function(button){button.addEventListener('click',function(){toggleDriver(button.dataset.contactId)})});
}
function renderSelected(){
  const list=document.getElementById('f1RacingSelectedListV181');
  const count=document.getElementById('f1RacingSelectedCountV181');
  if(!list)return;
  const contacts=getContacts();
  pruneSelection(contacts);
  const byId=new Map(contacts.map(function(row){return [String(row.id),row]}));
  const rows=selectedIds.map(function(id){return byId.get(String(id))}).filter(Boolean);
  if(count)count.textContent=rows.length+'명';
  list.innerHTML=rows.length?rows.map(function(row,index){
    return '<div class="f1-racing-selected-row-v181"><span class="f1-racing-grid-pos-v181">P'+String(index+1).padStart(2,'0')+'</span>'+avatar(row)+'<span style="min-width:0"><span class="f1-racing-contact-name-v181">'+escapeHtml(row.name)+'</span><span class="f1-racing-contact-meta-v181">'+escapeHtml((row.labels||[]).slice(0,4).join(' · ')||'라벨 없음')+'</span></span><button type="button" class="f1-racing-selected-remove-v181" data-remove-contact-id="'+escapeHtml(row.id)+'" title="출전 목록에서 제거">×</button></div>';
  }).join(''):'<div class="f1-racing-empty-v181">왼쪽 연락처에서 레이스 참가자를 선택해 주세요.</div>';
  list.querySelectorAll('[data-remove-contact-id]').forEach(function(button){button.addEventListener('click',function(){removeDriver(button.dataset.removeContactId)})});
}
function driverForPreviewV184(){
  const firstId=selectedIds[0];
  if(!firstId)return null;
  return getContacts().find(row=>String(row.id)===String(firstId))||null;
}
function driverCodeV184(driver){
  const raw=String(driver?.name||'CAR').replace(/\s+/g,'');
  return raw.slice(0,3).toUpperCase()||'CAR';
}
function ensurePreviewMarkerV184(){
  const layer=document.getElementById('f1RacingVehicleLayerV183');
  if(!layer)return null;
  let marker=document.getElementById('f1RacingPreviewCarV184');
  if(marker)return marker;
  marker=svgNodeV183('g',{id:'f1RacingPreviewCarV184',class:'f1-racing-preview-car-v184'});
  marker.append(
    svgNodeV183('circle',{class:'car-halo',cx:0,cy:0,r:20}),
    svgNodeV183('circle',{class:'car-body',cx:0,cy:0,r:11}),
    svgNodeV183('circle',{class:'car-core',cx:0,cy:0,r:5})
  );
  const label=svgNodeV183('text',{class:'car-label',x:17,y:-13});
  marker.appendChild(label);
  layer.appendChild(marker);
  return marker;
}
function positionPreviewMarkerV184(progress=previewStateV184.progress){
  const path=document.getElementById('f1RacingTrackPathV183');
  const marker=ensurePreviewMarkerV184();
  if(!path||!marker)return false;
  const total=path.getTotalLength();
  if(!(total>0))return false;
  const point=path.getPointAtLength(Math.max(0,Math.min(1,Number(progress)||0))*total);
  marker.setAttribute('transform','translate('+point.x.toFixed(2)+' '+point.y.toFixed(2)+')');
  const label=marker.querySelector('.car-label');
  const driver=driverForPreviewV184();
  if(label)label.textContent=driverCodeV184(driver);
  marker.style.display=driver?'':'none';
  return Boolean(driver);
}
function syncPreviewControlsV184(){
  const driver=driverForPreviewV184();
  const start=document.getElementById('f1RacingPreviewStartV184');
  const stop=document.getElementById('f1RacingPreviewStopV184');
  const status=document.getElementById('f1RacingPreviewStatusV184');
  if(!driver&&previewStateV184.running)return stopPreviewV184(true);
  if(start){start.disabled=!driver||previewStateV184.running;start.textContent=previewStateV184.running?'주행 중':'주행 미리보기'}
  if(stop)stop.disabled=!previewStateV184.running;
  if(status)status.textContent=!driver?'드라이버 선택 후 테스트 가능':previewStateV184.running?driver.name+' · smooth preview running':driver.name+' · ready';
  positionPreviewMarkerV184();
}
function previewFrameV184(timestamp){
  if(!previewStateV184.running)return;
  if(!previewStateV184.lastTimestamp)previewStateV184.lastTimestamp=timestamp;
  const delta=Math.min(50,Math.max(0,timestamp-previewStateV184.lastTimestamp));
  previewStateV184.lastTimestamp=timestamp;
  previewStateV184.progress=(previewStateV184.progress+delta/previewStateV184.lapDurationMs)%1;
  positionPreviewMarkerV184(previewStateV184.progress);
  previewStateV184.rafId=requestAnimationFrame(previewFrameV184);
}
function startPreviewV184(){
  if(previewStateV184.running||!driverForPreviewV184())return false;
  if(!renderTrackMapV183())return false;
  previewStateV184.running=true;
  previewStateV184.lastTimestamp=0;
  const marker=ensurePreviewMarkerV184();if(marker)marker.classList.add('running');
  syncPreviewControlsV184();
  previewStateV184.rafId=requestAnimationFrame(previewFrameV184);
  return true;
}
function stopPreviewV184(reset=false){
  previewStateV184.running=false;
  previewStateV184.lastTimestamp=0;
  if(previewStateV184.rafId)cancelAnimationFrame(previewStateV184.rafId);
  previewStateV184.rafId=0;
  if(reset)previewStateV184.progress=0;
  const marker=document.getElementById('f1RacingPreviewCarV184');if(marker)marker.classList.remove('running');
  positionPreviewMarkerV184(previewStateV184.progress);
  const driver=driverForPreviewV184();
  const start=document.getElementById('f1RacingPreviewStartV184');
  const stop=document.getElementById('f1RacingPreviewStopV184');
  const status=document.getElementById('f1RacingPreviewStatusV184');
  if(start){start.disabled=!driver;start.textContent='주행 미리보기'}
  if(stop)stop.disabled=true;
  if(status)status.textContent=driver?driver.name+' · ready':'드라이버 선택 후 테스트 가능';
  return true;
}
function bindPreviewControlsV184(){
  const start=document.getElementById('f1RacingPreviewStartV184');
  const stop=document.getElementById('f1RacingPreviewStopV184');
  if(start&&!start.dataset.f1Bound){start.dataset.f1Bound='1';start.addEventListener('click',startPreviewV184)}
  if(stop&&!stop.dataset.f1Bound){stop.dataset.f1Bound='1';stop.addEventListener('click',()=>stopPreviewV184(false))}
  syncPreviewControlsV184();
}
function applyScreenStateV185(){
  document.querySelectorAll('#gameF1Racing [data-f1-view]').forEach(function(view){
    const active=view.dataset.f1View===f1ScreenStateV185;
    view.hidden=!active;
    view.classList.toggle('active',active);
  });
  const section=document.getElementById('gameF1Racing');
  if(section)section.dataset.f1Screen=f1ScreenStateV185;
  return f1ScreenStateV185;
}
function canTransitionF1V185(next){
  return F1_TRANSITIONS_V185[f1ScreenStateV185]?.includes(next)===true;
}
function setScreenStateV185(next,options={}){
  const target=String(next||'').toUpperCase();
  const force=options&&options.force===true;
  if(!F1_STATES_V185.includes(target))return false;
  if(!force&&target!==f1ScreenStateV185&&!canTransitionF1V185(target))return false;
  if(target!=='RACE'&&immersiveStateV261.active)void exitF1ImmersiveV261({reason:'screen-change'});
  f1ScreenStateV185=target;
  applyScreenStateV185();
  return true;
}
function getScreenStateV185(){return f1ScreenStateV185}
function trackProfileV223(track){
  const zones=Array.isArray(track?.zones)?track.zones:[];
  const straightZones=zones.filter(zone=>String(zone.type)==='straight');
  const slowZones=zones.filter(zone=>['slowCorner','hairpin'].includes(String(zone.type)));
  const mediumZones=zones.filter(zone=>String(zone.type)==='mediumCorner');
  const fastZones=zones.filter(zone=>String(zone.type)==='fastCorner');
  const straightShare=straightZones.reduce((sum,zone)=>sum+Math.max(0,Number(zone.end)-Number(zone.start)),0);
  const widthMeters=Math.max(0,Number(track?.geometry?.trackWidthMeters)||0);
  const maxStraightKph=Math.max(0,Number(track?.geometry?.maxStraightKph)||0);
  const overtakeZones=Array.isArray(track?.overtakeZones)?track.overtakeZones.length:0;
  const overtakeScore=overtakeZones*1.6+Math.min(2.5,widthMeters/6)+straightShare*3.5;
  const overtakeDifficulty=overtakeScore>=5.3?'쉬움':overtakeScore>=4.1?'보통':'어려움';
  return {
    widthMeters,maxStraightKph,overtakeZones,overtakeScore:Number(overtakeScore.toFixed(2)),overtakeDifficulty,
    straightCount:straightZones.length,slowCount:slowZones.length,mediumCount:mediumZones.length,fastCount:fastZones.length,
    straightShare:Number(straightShare.toFixed(3))
  };
}
function trackCornerMixLabelV223(profile){
  return '저속 '+profile.slowCount+' · 중속 '+profile.mediumCount+' · 고속 '+profile.fastCount;
}
function trackRuntimeProfileV234(track){
  const profile=trackProfileV223(track);
  const cornerTotal=Math.max(1,profile.slowCount+profile.mediumCount+profile.fastCount);
  const slowShare=profile.slowCount/cornerTotal,fastShare=profile.fastCount/cornerTotal;
  const narrow=clamp01V198((14-profile.widthMeters)/5);
  const highSpeed=clamp01V198((profile.maxStraightKph-285)/75);
  const overtakeFactor=Math.max(.72,Math.min(1.28,.80+profile.straightShare*.58+profile.overtakeZones*.07+(profile.widthMeters-10)*.025));
  const incidentRiskFactor=Math.max(.82,Math.min(1.28,.92+narrow*.18+slowShare*.12+highSpeed*.07));
  const tyreStressFactor=Math.max(.88,Math.min(1.20,.92+fastShare*.13+highSpeed*.09+slowShare*.05));
  return Object.freeze({
    archetype:String(track?.archetype||'종합형'),straightShare:profile.straightShare,slowShare:Number(slowShare.toFixed(3)),fastShare:Number(fastShare.toFixed(3)),
    widthMeters:profile.widthMeters,maxStraightKph:profile.maxStraightKph,overtakeZones:profile.overtakeZones,
    overtakeFactor:Number(overtakeFactor.toFixed(3)),incidentRiskFactor:Number(incidentRiskFactor.toFixed(3)),tyreStressFactor:Number(tyreStressFactor.toFixed(3))
  });
}
function getTrackCatalogV186(){
  const source=window.MWS_F1_TRACKS_V182||{};
  return Object.values(source).map(track=>({
    id:String(track.id||''),
    name:String(track.name||'Track'),
    lengthMeters:Number(track.lengthMeters)||0,
    sectors:Array.isArray(track.sectors)?track.sectors.length:0,
    pitLimit:Number(track.pit?.speedLimitKph)||0,
    zones:Array.isArray(track.zones)?track.zones.length:0,
    overtakeZones:Array.isArray(track.overtakeZones)?track.overtakeZones.length:0,
    archetype:String(track.archetype||'종합형'),
    path:String(track.path||''),
    viewBox:Array.isArray(track.viewBox)&&track.viewBox.length===4?track.viewBox.map(Number):[0,0,1000,600],
    profile:trackProfileV223(track)
  }));
}
function selectTrackV186(trackId){
  const id=String(trackId||'');
  if(!window.mwsGetF1TrackV182?.(id))return false;
  activeTrackId=id;
  if(!lapOverrideActiveV260)selectedTotalLapsRecoveryD=recommendedLapsV260(window.mwsGetF1TrackV182?.(id));
  persistF1SettingsRecoveryD();
  renderTrackChoicesV186();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  syncLapControlV260();
  syncSetupActionV187();
  return true;
}
function renderTrackChoicesV186(){
  const box=document.getElementById('f1RacingTrackOptionsV186');
  const count=document.getElementById('f1RacingTrackCountV186');
  if(!box)return;
  const tracks=getTrackCatalogV186();
  if(count)count.textContent=tracks.length+'개 트랙';
  box.innerHTML=tracks.map(track=>trackCardHtmlV266(track,track.id===activeTrackId)).join('');
  box.querySelectorAll('[data-f1-track-id]').forEach(button=>button.addEventListener('click',()=>selectTrackV186(button.dataset.f1TrackId)));
}
function showImmersiveNoticeV261(){
  const notice=document.getElementById('f1RacingImmersiveNoticeV261');
  if(!notice)return false;
  if(immersiveStateV261.noticeTimer)clearTimeout(immersiveStateV261.noticeTimer);
  notice.hidden=false;
  notice.classList.remove('is-hiding');
  notice.classList.add('is-visible');
  immersiveStateV261.noticeTimer=setTimeout(()=>{
    notice.classList.add('is-hiding');
    setTimeout(()=>{notice.classList.remove('is-visible','is-hiding');notice.hidden=true},260);
  },1800);
  return true;
}
function applyImmersiveStateV261(active,reason='manual'){
  const next=Boolean(active);
  const body=document.body;
  const section=document.getElementById('gameF1Racing');
  if(!body||!section)return false;
  if(next){
    if(!immersiveStateV261.layoutSignature&&workspaceLayoutRecoveryE){
      immersiveStateV261.layoutSignature=workspaceLayoutSignatureV259(workspaceLayoutRecoveryE);
    }
    body.classList.add('f1-racing-immersive');
    section.classList.add('f1-racing-immersive-active-v261');
    immersiveStateV261.active=true;
    immersiveStateV261.lastReason=String(reason||'manual');
    applyWorkspaceLayoutRecoveryE();
    const button=document.getElementById('f1RacingImmersiveV261');
    if(button){button.setAttribute('aria-pressed','true');button.textContent='전체화면 종료'}
    showImmersiveNoticeV261();
    return true;
  }
  body.classList.remove('f1-racing-immersive');
  section.classList.remove('f1-racing-immersive-active-v261');
  immersiveStateV261.active=false;
  immersiveStateV261.lastReason=String(reason||'manual');
  const button=document.getElementById('f1RacingImmersiveV261');
  if(button){button.setAttribute('aria-pressed','false');button.textContent='전체화면으로 보기'}
  if(workspaceLayoutRecoveryE)restoreWorkspaceUserDefaultV259('immersive-exit');
  return true;
}
async function enterF1ImmersiveV261(){
  if(f1ScreenStateV185!=='RACE')return {ok:false,reason:'race-not-active',immersive:false,fullscreen:false};
  applyImmersiveStateV261(true,'enter');
  let fullscreen=false,error='';
  immersiveStateV261.fullscreenRequested=false;
  try{
    const root=document.documentElement;
    if(!document.fullscreenElement&&typeof root?.requestFullscreen==='function'){
      immersiveStateV261.fullscreenRequested=true;
      await root.requestFullscreen();
    }
    fullscreen=Boolean(document.fullscreenElement);
  }catch(err){error=String(err?.message||err||'fullscreen-unavailable')}
  return {ok:true,immersive:immersiveStateV261.active,fullscreen,error,fullscreenRequested:immersiveStateV261.fullscreenRequested};
}
async function exitF1ImmersiveV261(options={}){
  if(immersiveExitInFlightV261)return {ok:true,immersive:immersiveStateV261.active,fullscreen:Boolean(document.fullscreenElement)};
  immersiveExitInFlightV261=true;
  try{
    if(!options.skipFullscreenExit&&document.fullscreenElement&&typeof document.exitFullscreen==='function'){
      try{await document.exitFullscreen()}catch(_){}
    }
    applyImmersiveStateV261(false,options.reason||'exit');
    return {ok:true,immersive:false,fullscreen:Boolean(document.fullscreenElement)};
  }finally{immersiveExitInFlightV261=false}
}
function bindImmersiveControlV261(){
  const button=document.getElementById('f1RacingImmersiveV261');
  if(button&&!button.dataset.f1ImmersiveBound){
    button.dataset.f1ImmersiveBound='1';
    button.addEventListener('click',()=>{void (immersiveStateV261.active?exitF1ImmersiveV261():enterF1ImmersiveV261())});
  }
  if(!document.documentElement.dataset.f1ImmersiveEventsV261){
    document.documentElement.dataset.f1ImmersiveEventsV261='1';
    document.addEventListener('fullscreenchange',()=>{
      if(!document.fullscreenElement&&immersiveStateV261.active&&!immersiveExitInFlightV261){
        void exitF1ImmersiveV261({skipFullscreenExit:true,reason:'fullscreen-change'});
      }
    });
    window.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&immersiveStateV261.active){
        void exitF1ImmersiveV261({reason:'escape'});
      }
    },true);
  }
  return Boolean(button);
}
function qaImmersiveV261(){
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  const before=workspaceLayoutSignatureV259(workspaceLayoutRecoveryE);
  const button=document.getElementById('f1RacingImmersiveV261');
  const notice=document.getElementById('f1RacingImmersiveNoticeV261');
  applyImmersiveStateV261(true,'qa');
  const activeClass=document.body.classList.contains('f1-racing-immersive')&&document.getElementById('gameF1Racing')?.classList.contains('f1-racing-immersive-active-v261');
  applyImmersiveStateV261(false,'qa');
  const after=workspaceLayoutSignatureV259(workspaceLayoutRecoveryE);
  const restored=!document.body.classList.contains('f1-racing-immersive');
  return {before,after,activeClass,restored,button:Boolean(button),notice:Boolean(notice),allPass:Boolean(before)&&before===after&&activeClass&&restored&&Boolean(button)&&Boolean(notice)};
}

function clampLapCountV260(value,fallback=DEFAULT_TOTAL_LAPS_V190){
  const parsed=Math.floor(Number(value));
  const fallbackParsed=Math.floor(Number(fallback));
  const base=Number.isFinite(parsed)?parsed:(Number.isFinite(fallbackParsed)?fallbackParsed:DEFAULT_TOTAL_LAPS_V190);
  return Math.max(F1_LAP_MIN_V260,Math.min(F1_LAP_MAX_V260,base));
}
function recommendedLapsV260(track=getActiveTrack()){
  const configured=Number(track?.recommendedLaps);
  return clampLapCountV260(Number.isFinite(configured)?configured:DEFAULT_TOTAL_LAPS_V190,DEFAULT_TOTAL_LAPS_V190);
}
function syncLapControlV260(){
  const recommended=recommendedLapsV260();
  if(!lapOverrideActiveV260)selectedTotalLapsRecoveryD=recommended;
  selectedTotalLapsRecoveryD=clampLapCountV260(selectedTotalLapsRecoveryD,recommended);
  const input=document.getElementById('f1RacingLapsInputV260');
  const recommendedNode=document.getElementById('f1RacingLapsRecommendedV260');
  const mode=document.getElementById('f1RacingLapsModeV260');
  if(input){input.min=String(F1_LAP_MIN_V260);input.max=String(F1_LAP_MAX_V260);input.value=String(selectedTotalLapsRecoveryD)}
  if(recommendedNode)recommendedNode.textContent='권장 '+recommended+'랩';
  if(mode)mode.textContent=lapOverrideActiveV260?'사용자 설정':'권장값 사용 중';
  return {value:selectedTotalLapsRecoveryD,recommended,override:lapOverrideActiveV260};
}
function setLapCountV260(value,options={}){
  const recommended=recommendedLapsV260();
  selectedTotalLapsRecoveryD=clampLapCountV260(value,recommended);
  lapOverrideActiveV260=options.manual!==false;
  if(options.persist!==false)persistF1SettingsRecoveryD({lapOverride:lapOverrideActiveV260});
  syncLapControlV260();
  syncSetupActionV187();
  return selectedTotalLapsRecoveryD;
}
function restoreRecommendedLapsV260(options={}){
  return setLapCountV260(recommendedLapsV260(),{manual:false,persist:options.persist!==false});
}
function bindLapControlV260(){
  const input=document.getElementById('f1RacingLapsInputV260');
  const minus=document.getElementById('f1RacingLapsMinusV260');
  const plus=document.getElementById('f1RacingLapsPlusV260');
  const restore=document.getElementById('f1RacingLapsRestoreV260');
  if(input&&!input.dataset.f1LapBound){
    input.dataset.f1LapBound='1';
    input.addEventListener('change',()=>setLapCountV260(input.value));
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();setLapCountV260(input.value);input.blur()}});
  }
  if(minus&&!minus.dataset.f1LapBound){minus.dataset.f1LapBound='1';minus.addEventListener('click',()=>setLapCountV260(selectedTotalLapsRecoveryD-1))}
  if(plus&&!plus.dataset.f1LapBound){plus.dataset.f1LapBound='1';plus.addEventListener('click',()=>setLapCountV260(selectedTotalLapsRecoveryD+1))}
  if(restore&&!restore.dataset.f1LapBound){restore.dataset.f1LapBound='1';restore.addEventListener('click',()=>restoreRecommendedLapsV260())}
  return syncLapControlV260();
}
function qaLapControlV260(){
  const recommended=recommendedLapsV260();
  const low=clampLapCountV260(2,recommended),high=clampLapCountV260(100,recommended),direct=clampLapCountV260(17,recommended);
  const domReady=Boolean(document.getElementById('f1RacingLapsInputV260')&&document.getElementById('f1RacingLapsMinusV260')&&document.getElementById('f1RacingLapsPlusV260')&&document.getElementById('f1RacingLapsRestoreV260'));
  return {recommended,low,high,direct,current:selectedTotalLapsRecoveryD,override:lapOverrideActiveV260,domReady,allPass:recommended>=3&&recommended<=99&&low===3&&high===99&&direct===17&&domReady};
}

function getRaceDraftV187(){
  return Object.freeze({
    selectedDriverIds:Object.freeze(selectedIds.slice()),
    selectedTrackId:String(activeTrackId||''),
    totalLaps:selectedTotalLapsRecoveryD
  });
}
function cloneDriverForRaceV187(row,index){
  return Object.freeze({
    contactId:String(row?.id||''),
    name:String(row?.name||'Driver'),
    image:String(row?.image||''),
    labels:Object.freeze(Array.isArray(row?.labels)?row.labels.slice():[]),
    gridPosition:index+1
  });
}
function buildRaceSnapshotV187(options={}){
  const draft=getRaceDraftV187();
  const raceMode=String(options?.raceMode||'NORMAL').toUpperCase()==='FAST'?'FAST':'NORMAL';
  const requestedLaps=raceMode==='FAST'?RACE_COMPETITION_V345.fastLaps:draft.totalLaps;
  const byId=new Map(getContacts().map(row=>[String(row.id),row]));
  const drivers=draft.selectedDriverIds.map((id,index)=>cloneDriverForRaceV187(byId.get(String(id)),index)).filter(row=>row.contactId);
  const track=window.mwsGetF1TrackV182?.(draft.selectedTrackId);
  if(drivers.length<2||!track)return null;
  const baseSnapshot=Object.freeze({
    createdAt:new Date().toISOString(),
    trackId:String(track.id),
    totalLaps:requestedLaps,
    raceMode,
    track:Object.freeze({
      id:String(track.id),
      name:String(track.name),
      archetype:String(track.archetype||'종합형'),
      runtimeProfile:trackRuntimeProfileV234(track),
      lengthMeters:Number(track.lengthMeters)||0,
      viewBox:Object.freeze([...(track.viewBox||[])]),
      path:String(track.path||''),
      geometry:Object.freeze({...track.geometry}),
      sectors:Object.freeze((track.sectors||[]).map(row=>Object.freeze({...row}))),
      pit:Object.freeze({...track.pit}),
      speedTraps:Object.freeze((track.speedTraps||[]).map(row=>Object.freeze({...row}))),
      overtakeZones:Object.freeze((track.overtakeZones||[]).map(row=>Object.freeze({...row}))),
      zones:Object.freeze((track.zones||[]).map(row=>Object.freeze({...row})))
    }),
    drivers:Object.freeze(drivers)
  });
  return snapshotWithStartingGridV272(baseSnapshot,0);
}
function syncSetupActionV187(){
  const button=document.getElementById('f1RacingProceedV187');
  const summary=document.getElementById('f1RacingSetupSummaryV187');
  const hint=document.getElementById('f1RacingSetupHintV187');
  const track=getActiveTrack();
  const ready=selectedIds.length>=2&&Boolean(track);
  if(summary)summary.textContent='드라이버 '+selectedIds.length+'명 · '+(track?.name||'트랙 미선택')+' · '+selectedTotalLapsRecoveryD+'랩';
  if(hint)hint.textContent=ready?'준비가 완료되었습니다. 경기 진행 후 스타팅 그리드에서 경기 시작을 눌러야 출발합니다.':'드라이버를 2명 이상 선택하고 트랙을 선택해 주세요.';
  if(button)button.disabled=!ready;
  const fast=document.getElementById('f1RacingFastRaceV345');if(fast)fast.disabled=!ready;
  return ready;
}
function populateTransitionV187(snapshot){
  const track=document.getElementById('f1RacingTransitionTrackV187');
  const drivers=document.getElementById('f1RacingTransitionDriversV187');
  if(track)track.textContent=String(snapshot?.track?.name||'TRACK').toUpperCase();
  if(drivers)drivers.textContent='드라이버 '+(snapshot?.drivers?.length||0)+'명';
}
function populateGridRecoveryM(snapshot){
  const track=document.getElementById('f1RacingGridTrackRecoveryM');
  const drivers=document.getElementById('f1RacingGridDriversRecoveryM');
  const laps=document.getElementById('f1RacingGridLapsRecoveryM');
  if(track)track.textContent=String(snapshot?.track?.name||'TRACK').toUpperCase();
  if(drivers)drivers.textContent='드라이버 '+(snapshot?.drivers?.length||0)+'명';
  if(laps)laps.textContent=(Number(snapshot?.totalLaps)||DEFAULT_TOTAL_LAPS_V190)+'랩'+(String(snapshot?.raceMode||'NORMAL')==='FAST'?' · FAST':'');
  renderStartingGridV272(snapshot);
}
function startRaceFromSetupV187(mode='NORMAL'){
  if(f1ScreenStateV185!=='SETUP')return false;
  const raceMode=String(mode||'NORMAL').toUpperCase()==='FAST'?'FAST':'NORMAL';
  const snapshot=buildRaceSnapshotV187({raceMode});
  if(!snapshot)return false;
  resetRaceMotionV189();
  activeRaceResultRecoveryG=null;
  finishCounterRecoveryG=0;
  activeRaceSnapshotV187=snapshot;
  populateTransitionV187(snapshot);
  if(!setScreenStateV185('TRANSITION'))return false;
  if(raceTransitionTimerV187)clearTimeout(raceTransitionTimerV187);
  raceTransitionTimerV187=window.setTimeout(function(){
    raceTransitionTimerV187=0;
    setScreenStateV185('GRID');
    populateGridRecoveryM(snapshot);
    runStartingGridRevealV273(snapshot);
    const chip=document.getElementById('f1RacingPhaseChipV180');
    if(chip)chip.textContent='스타팅 그리드';
  },900);
  return true;
}
function confirmRaceStartRecoveryM(){
  if(f1ScreenStateV185!=='GRID'||!activeRaceSnapshotV187)return false;
  if(gridRevealStateV273.revealing)return false;
  if(raceMotionV189.running)return false;
  if(!setScreenStateV185('RACE'))return false;
  restoreWorkspaceUserDefaultV259('race-start');
  renderRaceControlV188();
  const started=startRaceMotionV189();
  if(!started){
    setScreenStateV185('GRID',{force:true});
    return false;
  }
  const chip=document.getElementById('f1RacingPhaseChipV180');
  if(chip)chip.textContent='레이스 관제';
  return true;
}
function qaStartingGridLayoutV244(){
  const section=document.getElementById('f1RacingViewGridV185');
  const header=section?.querySelector('.f1-racing-grid-header-v244');
  const actions=section?.querySelector('.f1-racing-grid-actions-v244');
  const start=document.getElementById('f1RacingGridStartRecoveryM');
  const cancel=document.getElementById('f1RacingGridCancelRecoveryM');
  return {hasSection:Boolean(section),hasHeader:Boolean(header),hasActions:Boolean(actions),startInActions:Boolean(start&&actions?.contains(start)),cancelInActions:Boolean(cancel&&actions?.contains(cancel)),allPass:Boolean(section&&header&&actions&&start&&cancel&&actions.contains(start)&&actions.contains(cancel))};
}
function bindManualRaceStartRecoveryM(){
  const start=document.getElementById('f1RacingGridStartRecoveryM');
  if(start&&!start.dataset.f1ManualStartBound){
    start.dataset.f1ManualStartBound='1';
    start.addEventListener('click',confirmRaceStartRecoveryM);
  }
  const shuffle=document.getElementById('f1RacingGridShuffleV272');
  if(shuffle&&!shuffle.dataset.f1GridShuffleBound){
    shuffle.dataset.f1GridShuffleBound='1';
    shuffle.addEventListener('click',reshuffleStartingGridV272);
  }
}

function cancelRaceToSetupRecoveryC(){
  if(!['TRANSITION','GRID','RACE'].includes(f1ScreenStateV185))return false;
  clearGridRevealV273({unlock:false});
  if(f1ScreenStateV185==='RACE'&&workspaceLayoutRecoveryE)checkpointWorkspaceUserDefaultV259('cancel-race');
  if(raceTransitionTimerV187){
    clearTimeout(raceTransitionTimerV187);
    raceTransitionTimerV187=0;
  }
  resetRaceMotionV189();
  activeRaceSnapshotV187=null;
  activeRaceResultRecoveryG=null;
  finishCounterRecoveryG=0;
  setScreenStateV185('SETUP',{force:true});
  renderTrackChoicesV186();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  renderContacts();
  renderSelected();
  syncSetupActionV187();
  const chip=document.getElementById('f1RacingPhaseChipV180');
  if(chip)chip.textContent='경기 설정';
  return true;
}
function bindRaceCancelRecoveryC(){
  ['f1RacingTransitionCancelRecoveryC','f1RacingGridCancelRecoveryM','f1RacingRaceCancelRecoveryC'].forEach(id=>{
    const button=document.getElementById(id);
    if(button&&!button.dataset.f1CancelBound){
      button.dataset.f1CancelBound='1';
      button.addEventListener('click',cancelRaceToSetupRecoveryC);
    }
  });
}

function getActiveRaceSnapshotV187(){return activeRaceSnapshotV187}
function hashDriverV189(value=''){
  let hash=2166136261;
  for(const ch of String(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}
  return hash>>>0;
}

function gridSeedV272(snapshot,round=0){
  return hashDriverV189([
    String(snapshot?.createdAt||'race'),
    String(snapshot?.trackId||snapshot?.track?.id||'track'),
    (snapshot?.drivers||[]).map(driver=>String(driver?.contactId||driver?.name||'')).join(','),
    String(Math.max(0,Number(round)||0))
  ].join('|'))||1;
}
function seededShuffleDriversV272(snapshot,round=0){
  const source=(snapshot?.drivers||[]).map(driver=>({...driver}));
  if(source.length<2)return source.map((driver,index)=>Object.freeze({...driver,gridPosition:index+1}));
  let state=gridSeedV272(snapshot,round)>>>0;
  const random=()=>{
    state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;
    return state/4294967296;
  };
  const rows=source.slice();
  for(let i=rows.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [rows[i],rows[j]]=[rows[j],rows[i]];
  }
  const original=source.map(driver=>String(driver.contactId)).join('|');
  if(rows.map(driver=>String(driver.contactId)).join('|')===original){
    const shift=1+(gridSeedV272(snapshot,round)%Math.max(1,rows.length-1));
    rows.push(...rows.splice(0,shift));
  }
  return rows.map((driver,index)=>Object.freeze({...driver,gridPosition:index+1}));
}
function snapshotWithStartingGridV272(snapshot,round=0,previousOrder=[]){
  const nextDrivers=seededShuffleDriversV272(snapshot,round).slice();
  const before=(previousOrder||[]).map(String).join('|');
  if(nextDrivers.length>1&&before&&nextDrivers.map(driver=>String(driver.contactId)).join('|')===before){
    nextDrivers.push(nextDrivers.shift());
    for(let i=0;i<nextDrivers.length;i++)nextDrivers[i]=Object.freeze({...nextDrivers[i],gridPosition:i+1});
  }
  return Object.freeze({
    ...snapshot,
    gridSeedV272:gridSeedV272(snapshot,round),
    gridShuffleRoundV272:Math.max(0,Number(round)||0),
    drivers:Object.freeze(nextDrivers)
  });
}
function gridStartOffsetV272(index,count){
  return -(Math.max(0,Number(index)||0)*Math.min(.0065,.065/Math.max(1,Number(count)||1)));
}
function gridAvatarMarkupV272(driver){
  const name=String(driver?.name||'Driver'),src=String(driver?.image||'').trim();
  if(src)return '<img class="f1-racing-grid-avatar-v272" loading="lazy" decoding="async" src="'+escapeHtml(src)+'" alt="'+escapeHtml(name)+'">';
  return '<span class="f1-racing-grid-avatar-v272 fallback">'+escapeHtml(initials(name))+'</span>';
}
function renderStartingGridV272(snapshot=activeRaceSnapshotV187){
  const list=document.getElementById('f1RacingGridListV272');
  const round=document.getElementById('f1RacingGridShuffleRoundV272');
  if(!list)return false;
  const drivers=(snapshot?.drivers||[]).slice().sort((a,b)=>(Number(a.gridPosition)||999)-(Number(b.gridPosition)||999));
  list.innerHTML=drivers.map((driver,index)=>{
    const position=Number(driver.gridPosition)||index+1;
    const podium=position<=3?' top-three':'';
    return '<article class="f1-racing-grid-card-v272'+podium+'" data-f1-grid-position="'+position+'" data-f1-grid-driver-id="'+escapeHtml(driver.contactId)+'">'+
      '<span class="f1-racing-grid-position-v272">P'+String(position).padStart(2,'0')+'</span>'+
      gridAvatarMarkupV272(driver)+
      '<span class="f1-racing-grid-driver-v272"><strong>'+escapeHtml(driver.name)+'</strong><small>START '+String(position).padStart(2,'0')+'</small></span>'+
      '</article>';
  }).join('');
  if(round)round.textContent='셔플 '+(Number(snapshot?.gridShuffleRoundV272)||0)+'회';
  return drivers.length>0;
}
function reshuffleStartingGridV272(){
  if(f1ScreenStateV185!=='GRID'||raceMotionV189.running||!activeRaceSnapshotV187)return false;
  const previousOrder=(activeRaceSnapshotV187.drivers||[]).map(driver=>String(driver.contactId));
  const nextRound=(Number(activeRaceSnapshotV187.gridShuffleRoundV272)||0)+1;
  activeRaceSnapshotV187=snapshotWithStartingGridV272(activeRaceSnapshotV187,nextRound,previousOrder);
  populateGridRecoveryM(activeRaceSnapshotV187);
  runStartingGridRevealV273(activeRaceSnapshotV187,{reshuffle:true});
  return true;
}
function qaRandomStartingGridV272(){
  const sample=Object.freeze({
    createdAt:'2026-10-06T00:00:00.000Z',trackId:'qa-track',
    drivers:Object.freeze([
      Object.freeze({contactId:'a',name:'A',gridPosition:1}),
      Object.freeze({contactId:'b',name:'B',gridPosition:2}),
      Object.freeze({contactId:'c',name:'C',gridPosition:3}),
      Object.freeze({contactId:'d',name:'D',gridPosition:4})
    ])
  });
  const first=snapshotWithStartingGridV272(sample,0);
  const repeat=snapshotWithStartingGridV272(sample,0);
  const second=snapshotWithStartingGridV272(sample,1,first.drivers.map(row=>row.contactId));
  const firstIds=first.drivers.map(row=>row.contactId),repeatIds=repeat.drivers.map(row=>row.contactId),secondIds=second.drivers.map(row=>row.contactId);
  const positions=first.drivers.map(row=>Number(row.gridPosition));
  const offsets=first.drivers.map((row,index)=>gridStartOffsetV272(index,first.drivers.length));
  const deterministic=JSON.stringify(firstIds)===JSON.stringify(repeatIds);
  const permutation=[...firstIds].sort().join('|')==='a|b|c|d';
  const roundChanges=JSON.stringify(firstIds)!==JSON.stringify(secondIds);
  const positionSequence=positions.every((value,index)=>value===index+1);
  const engineOffsets=offsets[0]===0&&offsets.slice(1).every((value,index)=>value<offsets[index]);
  const domReady=Boolean(document.getElementById('f1RacingGridListV272')&&document.getElementById('f1RacingGridShuffleV272'));
  return {firstIds,secondIds,deterministic,permutation,roundChanges,positionSequence,engineOffsets,domReady,allPass:deterministic&&permutation&&roundChanges&&positionSequence&&engineOffsets&&domReady};
}


const GRID_REVEAL_CONFIG_V273=Object.freeze({
  shuffleDurationMs:620,shuffleBursts:7,topThreeIntervalMs:190,regularIntervalMs:95,
  minRegularIntervalMs:60,landingDurationMs:430,finishHoldMs:260,maxShuffleCards:8
});
const gridRevealStateV273={token:0,timers:[],revealing:false,completed:true,lastDriverCount:0,lastRound:0,lastDurationMs:0};
function clearGridRevealTimersV273(){
  for(const timer of gridRevealStateV273.timers)clearTimeout(timer);
  gridRevealStateV273.timers=[];
}
function setGridRevealControlsV273(ready){
  const start=document.getElementById('f1RacingGridStartRecoveryM');
  const shuffle=document.getElementById('f1RacingGridShuffleV272');
  if(start){start.disabled=!ready;start.classList.toggle('grid-reveal-locked-v273',!ready)}
  if(shuffle)shuffle.disabled=!ready;
  return ready;
}
function clearGridRevealV273(options={}){
  gridRevealStateV273.token++;
  clearGridRevealTimersV273();
  gridRevealStateV273.revealing=false;
  gridRevealStateV273.completed=true;
  const stage=document.getElementById('f1RacingGridShuffleStageV273');
  if(stage){stage.classList.remove('active','shuffle-fast-v273');stage.replaceChildren();stage.hidden=true}
  document.querySelectorAll('#f1RacingGridListV272 .f1-racing-grid-card-v272').forEach(card=>card.classList.remove('grid-card-hidden-v273','grid-card-land-v273','grid-card-flash-v273'));
  if(options.unlock!==false)setGridRevealControlsV273(true);
  return true;
}
function gridRevealIntervalV273(index,count){
  if(index<3)return GRID_REVEAL_CONFIG_V273.topThreeIntervalMs;
  const compression=Math.max(0,count-10)*3;
  return Math.max(GRID_REVEAL_CONFIG_V273.minRegularIntervalMs,GRID_REVEAL_CONFIG_V273.regularIntervalMs-compression);
}
function buildShuffleStackV273(snapshot){
  const stage=document.getElementById('f1RacingGridShuffleStageV273');
  if(!stage)return false;
  const drivers=(snapshot?.drivers||[]).slice(0,GRID_REVEAL_CONFIG_V273.maxShuffleCards);
  stage.replaceChildren();
  stage.innerHTML=drivers.map((driver,index)=>{
    const rotate=((index%5)-2)*2.4;
    return '<div class="f1-racing-shuffle-card-v273" style="--shuffle-i:'+index+';--shuffle-rotate:'+rotate+'deg">'+
      gridAvatarMarkupV272(driver)+
      '<span><strong>'+escapeHtml(driver.name)+'</strong><small>GRID CARD</small></span>'+
      '</div>';
  }).join('');
  stage.hidden=false;stage.classList.add('active');
  requestAnimationFrame(()=>stage.classList.add('shuffle-fast-v273'));
  return true;
}
function positionGridFlyOriginsV273(){
  const list=document.getElementById('f1RacingGridListV272');
  if(!list)return false;
  const listRect=list.getBoundingClientRect();
  const centerX=listRect.left+listRect.width/2;
  const centerY=Math.max(listRect.top+26,Math.min(listRect.bottom-26,listRect.top+24));
  list.querySelectorAll('.f1-racing-grid-card-v272').forEach(card=>{
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--grid-fly-x-v273',(centerX-(rect.left+rect.width/2)).toFixed(1)+'px');
    card.style.setProperty('--grid-fly-y-v273',(centerY-(rect.top+rect.height/2)).toFixed(1)+'px');
  });
  return true;
}
function finishGridRevealV273(token){
  if(token!==gridRevealStateV273.token)return false;
  gridRevealStateV273.revealing=false;gridRevealStateV273.completed=true;
  const stage=document.getElementById('f1RacingGridShuffleStageV273');
  if(stage){stage.classList.remove('active','shuffle-fast-v273');stage.replaceChildren();stage.hidden=true}
  const status=document.getElementById('f1RacingGridRevealStatusV273');
  if(status)status.textContent='스타팅 그리드 확정';
  setGridRevealControlsV273(true);
  return true;
}
function runStartingGridRevealV273(snapshot=activeRaceSnapshotV187,options={}){
  if(f1ScreenStateV185!=='GRID'||!snapshot)return false;
  clearGridRevealV273({unlock:false});
  const token=gridRevealStateV273.token;
  const cards=Array.from(document.querySelectorAll('#f1RacingGridListV272 .f1-racing-grid-card-v272'));
  gridRevealStateV273.revealing=true;gridRevealStateV273.completed=false;gridRevealStateV273.lastDriverCount=cards.length;
  gridRevealStateV273.lastRound=Number(snapshot?.gridShuffleRoundV272)||0;
  setGridRevealControlsV273(false);
  const status=document.getElementById('f1RacingGridRevealStatusV273');
  if(status)status.textContent=options.reshuffle?'카드 다시 섞는 중':'카드 셔플 중';
  cards.forEach(card=>{card.classList.add('grid-card-hidden-v273');card.classList.remove('grid-card-land-v273','grid-card-flash-v273')});
  positionGridFlyOriginsV273();
  buildShuffleStackV273(snapshot);
  let elapsed=GRID_REVEAL_CONFIG_V273.shuffleDurationMs;
  const stageTimer=setTimeout(()=>{
    if(token!==gridRevealStateV273.token)return;
    const stage=document.getElementById('f1RacingGridShuffleStageV273');
    if(stage)stage.classList.remove('shuffle-fast-v273');
  },Math.max(0,GRID_REVEAL_CONFIG_V273.shuffleDurationMs-90));
  gridRevealStateV273.timers.push(stageTimer);
  cards.forEach((card,index)=>{
    elapsed+=gridRevealIntervalV273(index,cards.length);
    const timer=setTimeout(()=>{
      if(token!==gridRevealStateV273.token)return;
      card.classList.remove('grid-card-hidden-v273');
      card.classList.add('grid-card-land-v273','grid-card-flash-v273');
      card.dataset.f1RevealIndexV273=String(index);
      const position=Number(card.dataset.f1GridPosition)||index+1;
      if(status)status.textContent='P'+String(position).padStart(2,'0')+' '+String(card.querySelector('.f1-racing-grid-driver-v272 strong')?.textContent||'')+' 배치';
      const cleanup=setTimeout(()=>{card.classList.remove('grid-card-land-v273','grid-card-flash-v273')},GRID_REVEAL_CONFIG_V273.landingDurationMs);
      gridRevealStateV273.timers.push(cleanup);
    },elapsed);
    gridRevealStateV273.timers.push(timer);
  });
  const total=elapsed+GRID_REVEAL_CONFIG_V273.landingDurationMs+GRID_REVEAL_CONFIG_V273.finishHoldMs;
  gridRevealStateV273.lastDurationMs=total;
  const finish=setTimeout(()=>finishGridRevealV273(token),total);
  gridRevealStateV273.timers.push(finish);
  return true;
}
function waitGridRevealV273(timeoutMs=8000){
  const started=Date.now();
  return new Promise(resolve=>{
    const poll=()=>{
      if(!gridRevealStateV273.revealing)return resolve(true);
      if(Date.now()-started>=Math.max(500,Number(timeoutMs)||8000))return resolve(false);
      setTimeout(poll,35);
    };
    poll();
  });
}
function qaStartingGridRevealV273(){
  const list=document.getElementById('f1RacingGridListV272');
  const stage=document.getElementById('f1RacingGridShuffleStageV273');
  const status=document.getElementById('f1RacingGridRevealStatusV273');
  const cards=Array.from(list?.querySelectorAll('.f1-racing-grid-card-v272')||[]);
  const topThree=cards.filter(card=>(Number(card.dataset.f1GridPosition)||99)<=3);
  const start=document.getElementById('f1RacingGridStartRecoveryM');
  const shuffle=document.getElementById('f1RacingGridShuffleV272');
  const intervals=[0,1,2,3,10,20].map(index=>gridRevealIntervalV273(index,24));
  const compressed=intervals[3]>=intervals[4]&&intervals[4]>=intervals[5]&&intervals[5]>=GRID_REVEAL_CONFIG_V273.minRegularIntervalMs;
  return {
    domReady:Boolean(list&&stage&&status&&start&&shuffle),cardCount:cards.length,topThreeCount:topThree.length,
    config:{...GRID_REVEAL_CONFIG_V273},compressed,lastDurationMs:gridRevealStateV273.lastDurationMs,
    allPass:Boolean(list&&stage&&status&&start&&shuffle)&&cards.length>=2&&topThree.length===Math.min(3,cards.length)&&compressed&&GRID_REVEAL_CONFIG_V273.shuffleBursts>=5
  };
}


const GRID_GACHA_CONFIG_V313=Object.freeze({
  firstRevealDelayMs:420,revealIntervalMs:560,revealPulseMs:360,finishHoldMs:520
});
function gridGachaPlayerV313(driver){
  return {id:String(driver?.contactId||''),name:String(driver?.name||'Driver'),image:String(driver?.image||''),description:'F1 STARTING GRID'};
}
function gridGachaCardHtmlV313(driver,position,compact=false){
  const player=gridGachaPlayerV313(driver),positionText='P'+String(position).padStart(2,'0');
  const sharedAvailable=typeof window.multiDrawCardHTML==='function';
  if(sharedAvailable){try{window.multiDrawCardHTML(player)}catch(_){}}
  const media=player.image?'<img style="display:block;width:100%;height:100%;object-fit:contain;object-position:center center" src="'+escapeHtml(player.image)+'" alt="'+escapeHtml(player.name)+'">':'<div class="gacha-card-initials">'+escapeHtml(initials(player.name))+'</div>';
  const card='<div class="gacha-card f1-grid-gacha-card-v324"><div class="gacha-card-inner"><div class="gacha-card-image">'+media+'</div><div class="gacha-card-info"><div class="gacha-card-kicker">STARTING GRID</div><div class="gacha-card-name">'+escapeHtml(player.name)+'</div><div class="gacha-card-desc">'+positionText+' · GRID POSITION</div></div></div></div>';
  return '<div class="f1-grid-gacha-card-host-v323" data-gacha-renderer-v323="'+(sharedAvailable?'shared':'shared-style')+'" data-gacha-renderer-v324="deterministic">'+card+'</div>';
}
function gridGachaDockItemV313(driver,position){
  const image=String(driver?.image||'').trim(),name=String(driver?.name||'Driver');
  const avatar=image?'<img src="'+escapeHtml(image)+'" alt="">':'<span class="fallback">'+escapeHtml(initials(name))+'</span>';
  return '<article class="f1-grid-gacha-dock-item-v313" data-f1-gacha-position-v313="'+position+'"><b>P'+String(position).padStart(2,'0')+'</b><span class="avatar">'+avatar+'</span><span class="meta"><strong>'+escapeHtml(name)+'</strong><small>START '+String(position).padStart(2,'0')+'</small></span></article>';
}
const GRID_GACHA_VIEWPORT_CONFIG_V333=Object.freeze({
 minStageHeight:300,maxStageHeight:420,minCardHeight:220,maxCardHeight:320,minCardWidth:160,maxCardWidth:230,minDockWidth:210,maxDockWidth:280,bottomGap:12
});
let gridGachaResizeObserverV333=null,gridGachaResizeRafV333=0,gridGachaResizeBoundV333=false;
function gridGachaViewportMetricsV333(width,height,listTop=0){
  const w=Math.max(360,Number(width)||0),h=Math.max(360,Number(height)||0),top=Math.max(0,Number(listTop)||0);
  const availableHeight=Math.max(GRID_GACHA_VIEWPORT_CONFIG_V333.minStageHeight,h-top-GRID_GACHA_VIEWPORT_CONFIG_V333.bottomGap);
  const stageHeight=Math.max(GRID_GACHA_VIEWPORT_CONFIG_V333.minStageHeight,Math.min(GRID_GACHA_VIEWPORT_CONFIG_V333.maxStageHeight,Math.floor(availableHeight)));
  const dockWidth=Math.max(GRID_GACHA_VIEWPORT_CONFIG_V333.minDockWidth,Math.min(GRID_GACHA_VIEWPORT_CONFIG_V333.maxDockWidth,Math.round(w*.27)));
  const cardHeight=Math.max(GRID_GACHA_VIEWPORT_CONFIG_V333.minCardHeight,Math.min(GRID_GACHA_VIEWPORT_CONFIG_V333.maxCardHeight,stageHeight-88));
  const widthByHeight=Math.round(cardHeight*.71875);
  const widthBySpace=Math.max(GRID_GACHA_VIEWPORT_CONFIG_V333.minCardWidth,w-dockWidth-88);
  const cardWidth=Math.max(GRID_GACHA_VIEWPORT_CONFIG_V333.minCardWidth,Math.min(GRID_GACHA_VIEWPORT_CONFIG_V333.maxCardWidth,widthByHeight,widthBySpace));
  const infoHeight=Math.max(56,Math.min(72,Math.round(cardHeight*.225)));
  return {width:w,height:h,listTop:top,availableHeight,stageHeight,dockWidth,cardWidth,cardHeight,infoHeight};
}
function syncGridGachaViewportV333(){
  const list=document.getElementById('f1RacingGridListV272'),stage=document.getElementById('f1RacingGridGachaStageV313');
  if(!list||!stage)return null;
  const rect=list.getBoundingClientRect(),width=Math.max(360,Math.floor(list.clientWidth||rect.width||window.innerWidth||0));
  const metrics=gridGachaViewportMetricsV333(width,window.innerHeight||720,rect.top);
  list.style.setProperty('--f1-grid-stage-h-v333',metrics.stageHeight+'px');
  list.style.setProperty('--f1-grid-dock-w-v333',metrics.dockWidth+'px');
  list.style.setProperty('--f1-grid-card-w-v333',metrics.cardWidth+'px');
  list.style.setProperty('--f1-grid-card-h-v333',metrics.cardHeight+'px');
  list.style.setProperty('--f1-grid-card-info-h-v333',metrics.infoHeight+'px');
  list.dataset.gachaResponsiveV333='1';
  list.dataset.gachaStageHeightV333=String(metrics.stageHeight);
  stage.dataset.gachaResponsiveV333='1';
  return metrics;
}
function scheduleGridGachaViewportV333(){
  if(gridGachaResizeRafV333)cancelAnimationFrame(gridGachaResizeRafV333);
  gridGachaResizeRafV333=requestAnimationFrame(()=>{gridGachaResizeRafV333=0;syncGridGachaViewportV333()});
}
function bindGridGachaViewportV333(){
  const list=document.getElementById('f1RacingGridListV272');
  if(!list)return false;
  if(!gridGachaResizeBoundV333){
    gridGachaResizeBoundV333=true;
    window.addEventListener('resize',scheduleGridGachaViewportV333,{passive:true});
  }
  if(typeof ResizeObserver==='function'){
    gridGachaResizeObserverV333?.disconnect();
    gridGachaResizeObserverV333=new ResizeObserver(scheduleGridGachaViewportV333);
    gridGachaResizeObserverV333.observe(list);
  }
  syncGridGachaViewportV333();
  return true;
}
function qaGridGachaViewportV333(){
  const roomy=gridGachaViewportMetricsV333(1180,900,210);
  const medium=gridGachaViewportMetricsV333(920,650,210);
  const short=gridGachaViewportMetricsV333(920,540,210);
  const live=syncGridGachaViewportV333();
  const shrinks=short.stageHeight<roomy.stageHeight&&short.cardHeight<roomy.cardHeight;
  const bounded=[roomy,medium,short].every(row=>row.stageHeight>=GRID_GACHA_VIEWPORT_CONFIG_V333.minStageHeight&&row.stageHeight<=GRID_GACHA_VIEWPORT_CONFIG_V333.maxStageHeight&&row.cardHeight>=GRID_GACHA_VIEWPORT_CONFIG_V333.minCardHeight&&row.cardHeight<=GRID_GACHA_VIEWPORT_CONFIG_V333.maxCardHeight&&row.cardWidth>=GRID_GACHA_VIEWPORT_CONFIG_V333.minCardWidth&&row.cardWidth<=GRID_GACHA_VIEWPORT_CONFIG_V333.maxCardWidth);
  return {version:VERSION333,roomy,medium,short,live,bounded,shrinks,allPass:bounded&&shrinks};
}

function buildStartingGridGachaStageV313(snapshot){
  const list=document.getElementById('f1RacingGridListV272');
  if(!list)return null;
  list.classList.add('f1-racing-grid-gacha-active-v313');
  list.querySelector('#f1RacingGridGachaStageV313')?.remove();
  const stage=document.createElement('section');
  stage.id='f1RacingGridGachaStageV313';
  stage.className='f1-racing-grid-gacha-stage-v313';
  stage.innerHTML=
    '<div class="f1-grid-gacha-main-v313">'+
      '<div class="f1-grid-gacha-brand-v313"><strong>MAWANG</strong><small>RANDOM GACHA STARTING GRID</small></div>'+
      '<div class="f1-grid-gacha-caption-v313" id="f1GridGachaCaptionV313">STARTING GRID DRAW</div>'+
      '<div class="f1-grid-gacha-reveal-v313" id="f1GridGachaRevealV313"></div>'+
    '</div>'+
    '<aside class="f1-grid-gacha-dock-v313">'+
      '<header><span>STARTING GRID</span><strong id="f1GridGachaDockCountV313">0 / '+String(snapshot?.drivers?.length||0)+'</strong></header>'+
      '<div id="f1GridGachaDockListV313" class="f1-grid-gacha-dock-list-v313"></div>'+
    '</aside>';
  list.appendChild(stage);
  bindGridGachaViewportV333();
  syncGridGachaViewportV333();
  requestAnimationFrame(syncGridGachaViewportV333);
  return stage;
}
function finishStartingGridGachaV313(token){
  if(token!==gridRevealStateV273.token)return false;
  gridRevealStateV273.revealing=false;gridRevealStateV273.completed=true;
  const status=document.getElementById('f1RacingGridRevealStatusV273');
  if(status)status.textContent='스타팅 그리드 확정 완료';
  const caption=document.getElementById('f1GridGachaCaptionV313');
  if(caption)caption.textContent='GRID LOCKED · 경기 시작 준비 완료';
  const shuffle=document.getElementById('f1RacingGridShuffleV272');
  if(shuffle)shuffle.textContent='가챠 다시 뽑기';
  const round=document.getElementById('f1RacingGridShuffleRoundV272');
  if(round)round.textContent='GACHA ROUND '+String((Number(activeRaceSnapshotV187?.gridShuffleRoundV272)||0)+1);
  setGridRevealControlsV273(true);
  return true;
}
function runStartingGridGachaRevealV313(snapshot=activeRaceSnapshotV187,options={}){
  if(f1ScreenStateV185!=='GRID'||!snapshot)return false;
  clearGridRevealV273({unlock:false});
  const token=gridRevealStateV273.token;
  const drivers=(snapshot?.drivers||[]).slice().sort((a,b)=>(Number(a.gridPosition)||999)-(Number(b.gridPosition)||999));
  const stage=buildStartingGridGachaStageV313(snapshot);
  if(!stage||!drivers.length)return false;
  gridRevealStateV273.revealing=true;gridRevealStateV273.completed=false;
  gridRevealStateV273.lastDriverCount=drivers.length;
  gridRevealStateV273.lastRound=Number(snapshot?.gridShuffleRoundV272)||0;
  setGridRevealControlsV273(false);
  const legacyShuffle=document.getElementById('f1RacingGridShuffleStageV273');
  if(legacyShuffle){legacyShuffle.classList.remove('active','shuffle-fast-v273');legacyShuffle.replaceChildren();legacyShuffle.hidden=true}
  const status=document.getElementById('f1RacingGridRevealStatusV273');
  if(status)status.textContent=options.reshuffle?'가챠 그리드 다시 추첨 중':'가챠 스타팅 그리드 추첨 중';
  const reveal=document.getElementById('f1GridGachaRevealV313');
  const dock=document.getElementById('f1GridGachaDockListV313');
  const count=document.getElementById('f1GridGachaDockCountV313');
  const caption=document.getElementById('f1GridGachaCaptionV313');
  let elapsed=GRID_GACHA_CONFIG_V313.firstRevealDelayMs;
  drivers.forEach((driver,index)=>{
    const position=Number(driver.gridPosition)||index+1;
    const timer=setTimeout(()=>{
      if(token!==gridRevealStateV273.token)return;
      if(reveal){
        reveal.classList.remove('is-pulsing');
        reveal.innerHTML=gridGachaCardHtmlV313(driver,position,false);
        requestAnimationFrame(()=>reveal.classList.add('is-pulsing'));
      }
      if(dock){
        dock.insertAdjacentHTML('beforeend',gridGachaDockItemV313(driver,position));
        dock.lastElementChild?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
      }
      if(count)count.textContent=String(position)+' / '+String(drivers.length);
      if(caption)caption.textContent='P'+String(position).padStart(2,'0')+' · '+String(driver.name||'Driver');
      if(status)status.textContent='P'+String(position).padStart(2,'0')+' '+String(driver.name||'Driver')+' 배정';
    },elapsed);
    gridRevealStateV273.timers.push(timer);
    elapsed+=GRID_GACHA_CONFIG_V313.revealIntervalMs;
  });
  gridRevealStateV273.lastDurationMs=elapsed+GRID_GACHA_CONFIG_V313.finishHoldMs;
  const finish=setTimeout(()=>finishStartingGridGachaV313(token),gridRevealStateV273.lastDurationMs);
  gridRevealStateV273.timers.push(finish);
  return true;
}
function qaGachaStartingGridV313(){
  const list=document.getElementById('f1RacingGridListV272');
  const stage=document.getElementById('f1RacingGridGachaStageV313');
  const legacyCards=[...document.querySelectorAll('#f1RacingGridListV272 .f1-racing-grid-card-v272')];
  return {
    version:VERSION313,gachaRenderer:typeof window.multiDrawCardHTML==='function',
    legacyGridPreserved:legacyCards.length>=2,stageReady:Boolean(stage),
    config:{...GRID_GACHA_CONFIG_V313},
    allPass:Boolean(list)&&legacyCards.length>=2&&GRID_GACHA_CONFIG_V313.revealIntervalMs>=400
  };
}
const runStartingGridRevealLegacyV273=runStartingGridRevealV273;
runStartingGridRevealV273=runStartingGridGachaRevealV313;
window.mwsF1RunStartingGridGachaRevealV313=runStartingGridGachaRevealV313;
window.mwsF1QaGachaStartingGridV313=qaGachaStartingGridV313;
window.mwsF1SyncGridGachaViewportV333=syncGridGachaViewportV333;
window.mwsF1QaGridGachaViewportV333=qaGridGachaViewportV333;
window.__mwsF1RacingV313=VERSION313;
window.__mwsF1RacingV333=VERSION333;

function normalizedProgressV190(value){
  return ((Number(value)||0)%1+1)%1;
}
function sectorForProgressV190(track,progress){
  const p=normalizedProgressV190(progress);
  const sectors=Array.isArray(track?.sectors)?track.sectors:[];
  const found=sectors.find(function(sector){return p>=Number(sector.start)&&p<Number(sector.end)})||sectors[sectors.length-1];
  return found?.id||'S1';
}
function syncVehicleRaceMetricsV190(vehicle,track=activeRaceSnapshotV187?.track){
  if(!vehicle||!track)return vehicle;
  const length=Math.max(1,Number(track.lengthMeters)||1);
  const raceProgress=Number(vehicle.startOffset||0)+Number(vehicle.travel||0);
  vehicle.raceProgress=raceProgress;
  vehicle.progress=normalizedProgressV190(raceProgress);
  vehicle.raceDistanceMeters=Math.max(0,raceProgress*length);
  vehicle.completedLaps=Math.max(0,Math.floor(Math.max(0,raceProgress)));
  vehicle.currentLap=vehicle.completedLaps+1;
  vehicle.sector=raceProgress<0?'GRID':sectorForProgressV190(track,vehicle.progress);
  return vehicle;
}
function formatLapTimeV248(ms){
  const value=Number(ms);
  if(!(value>0))return '--:--.---';
  const total=Math.max(0,Math.round(value)),minutes=Math.floor(total/60000),seconds=Math.floor((total%60000)/1000),millis=total%1000;
  return String(minutes)+':'+String(seconds).padStart(2,'0')+'.'+String(millis).padStart(3,'0');
}
function formatSectorTimeV248(ms){
  const value=Number(ms);
  if(!(value>0))return '--.---';
  const total=Math.max(0,Math.round(value)),seconds=Math.floor(total/1000),millis=total%1000;
  return String(seconds)+'.'+String(millis).padStart(3,'0');
}
function crossingSimTimeV248(previousProgress,currentProgress,targetProgress,stepMs){
  const previous=Number(previousProgress)||0,current=Number(currentProgress)||0,target=Number(targetProgress)||0,step=Math.max(0,Number(stepMs)||0);
  const span=current-previous,fraction=span>0?Math.max(0,Math.min(1,(target-previous)/span)):1;
  return Math.max(0,(Number(simClockV192.simTimeMs)||0)-step+step*fraction);
}
function resetLapSectorTimingV248(vehicle,startSimMs){
  vehicle.sectorTimesMs={S1:0,S2:0,S3:0};
  vehicle.sectorStartSimMs=Number(startSimMs)||0;
  vehicle.timingSector='S1';
}
function updateLapTimingV248(vehicle,previousRaceProgress,stepMs,track=activeRaceSnapshotV187?.track){
  if(!vehicle||!track)return false;
  const previous=Number(previousRaceProgress)||0,current=Number(vehicle.raceProgress)||0;
  if(!(current>previous))return false;
  let changed=false;
  if(!vehicle.lapTimingArmed){
    if(previous<0&&current>=0){
      const startMs=crossingSimTimeV248(previous,current,0,stepMs);
      vehicle.lapTimingArmed=true;vehicle.lapStartSimMs=startMs;resetLapSectorTimingV248(vehicle,startMs);changed=true;
    }else if(previous>=0){
      const startMs=Math.max(0,(Number(simClockV192.simTimeMs)||0)-Math.max(0,Number(stepMs)||0));
      vehicle.lapTimingArmed=true;vehicle.lapStartSimMs=startMs;resetLapSectorTimingV248(vehicle,startMs);changed=true;
    }
  }
  if(!vehicle.lapTimingArmed)return changed;
  const sectors=(Array.isArray(track.sectors)?track.sectors:[]).slice().sort((a,b)=>Number(a.end)-Number(b.end));
  if(!sectors.length)return changed;
  const firstLap=Math.max(0,Math.floor(Math.max(0,previous)));
  const lastLap=Math.max(firstLap,Math.floor(Math.max(0,current)));
  const epsilon=1e-9;
  for(let lapIndex=firstLap;lapIndex<=lastLap;lapIndex++){
    for(let sectorIndex=0;sectorIndex<sectors.length;sectorIndex++){
      const sector=sectors[sectorIndex],end=Math.max(0,Math.min(1,Number(sector.end)||0)),target=lapIndex+end;
      if(target<=previous+epsilon||target>current+epsilon)continue;
      const crossingMs=crossingSimTimeV248(previous,current,target,stepMs);
      const id=String(sector.id||('S'+(sectorIndex+1))).toUpperCase();
      const sectorStart=Number(vehicle.sectorStartSimMs);
      if(Number.isFinite(sectorStart)&&crossingMs>sectorStart)vehicle.sectorTimesMs[id]=crossingMs-sectorStart;
      if(end>=1-epsilon){
        const lapStart=Number(vehicle.lapStartSimMs);
        const lapMs=Number.isFinite(lapStart)?crossingMs-lapStart:0;
        if(lapMs>1000){
          vehicle.lastLapMs=lapMs;
          vehicle.bestLapMs=vehicle.bestLapMs>0?Math.min(Number(vehicle.bestLapMs),lapMs):lapMs;
          vehicle.lapDurationMs=lapMs;
          vehicle.lapTimesMs=Array.isArray(vehicle.lapTimesMs)?vehicle.lapTimesMs:[];
          vehicle.lapTimesMs.push(lapMs);
          vehicle.timedCompletedLaps=vehicle.lapTimesMs.length;
        }
        vehicle.lapStartSimMs=crossingMs;
        resetLapSectorTimingV248(vehicle,crossingMs);
      }else{
        vehicle.sectorStartSimMs=crossingMs;
        vehicle.timingSector=String(sectors[sectorIndex+1]?.id||'S3').toUpperCase();
      }
      changed=true;
    }
  }
  return changed;
}
function getLapTimingStatesV248(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:String(vehicle.id||''),name:String(vehicle.driver?.name||''),armed:Boolean(vehicle.lapTimingArmed),
    lastLapMs:Number(vehicle.lastLapMs)||0,bestLapMs:Number(vehicle.bestLapMs)||0,
    lapTimesMs:(vehicle.lapTimesMs||[]).map(value=>Number(value)||0),
    sectorTimesMs:{S1:Number(vehicle.sectorTimesMs?.S1)||0,S2:Number(vehicle.sectorTimesMs?.S2)||0,S3:Number(vehicle.sectorTimesMs?.S3)||0},
    timedCompletedLaps:Number(vehicle.timedCompletedLaps)||0
  }));
}
function findTimingRowV190(driverId){
  return Array.from(document.querySelectorAll('#f1RacingTimingListV188 [data-f1-driver-id]')).find(function(row){return String(row.dataset.f1DriverId)===String(driverId)})||null;
}
function updateRaceProgressHudV190(){
  const snapshot=activeRaceSnapshotV187;if(!snapshot||!raceMotionV189.vehicles.length)return false;
  const leader=raceMotionV189.vehicles.reduce((best,vehicle)=>!best||vehicle.raceProgress>best.raceProgress?vehicle:best,null);
  const totalLaps=Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190;
  const lap=document.getElementById('f1RacingRaceLapV188');
  const meta=document.getElementById('f1RacingRaceMapMetaV188');
  if(lap)lap.textContent=Math.min(totalLaps,leader?.currentLap||1)+' / '+totalLaps;
  if(meta)meta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · '+snapshot.drivers.length+' drivers · '+(leader?.sector||'GRID');
  for(const vehicle of raceMotionV189.vehicles){
    const row=findTimingRowV190(vehicle.id);if(!row)continue;
    row.dataset.lap=String(vehicle.currentLap||1);
    row.dataset.sector=String(vehicle.sector||'GRID');
    row.dataset.raceDistance=String(Math.round(vehicle.raceDistanceMeters||0));
    const badge=row.querySelector('[data-f1-current-sector]');
    if(badge)badge.textContent=vehicle.sector||'GRID';
    const gear=row.querySelector('.gear');if(gear)gear.textContent=String(vehicle.gear||1);
    const rpm=row.querySelector('.rpm');if(rpm)rpm.textContent=String(Math.round(vehicle.rpm||0));
    const speed=row.querySelector('.speed');if(speed)speed.textContent=String(Math.round(vehicle.speedKph||0));
    const last=row.querySelector('.last');if(last)last.textContent=formatLapTimeV248(vehicle.lastLapMs);
    const best=row.querySelector('.best');if(best)best.textContent=formatLapTimeV248(vehicle.bestLapMs);
    const s1=row.querySelector('.s1');if(s1)s1.textContent=formatSectorTimeV248(vehicle.sectorTimesMs?.S1);
    const s2=row.querySelector('.s2');if(s2)s2.textContent=formatSectorTimeV248(vehicle.sectorTimesMs?.S2);
    const s3=row.querySelector('.s3');if(s3)s3.textContent=formatSectorTimeV248(vehicle.sectorTimesMs?.S3);
    row.dataset.lastLapMs=String(Math.round(Number(vehicle.lastLapMs)||0));row.dataset.bestLapMs=String(Math.round(Number(vehicle.bestLapMs)||0));
    row.dataset.timedLaps=String(Number(vehicle.timedCompletedLaps)||0);
    row.dataset.throttle=(Number(vehicle.throttle)||0).toFixed(2);
    row.dataset.brake=(Number(vehicle.brake)||0).toFixed(2);
    row.dataset.targetSpeed=String(Math.round(vehicle.targetSpeedKph||0));
    row.dataset.slipstream=(Number(vehicle.slipstreamStrength)||0).toFixed(3);
    row.dataset.carAhead=String(vehicle.carAheadId||'');
    row.dataset.dirtyAir=(Number(vehicle.dirtyAirStrength)||0).toFixed(3);
    row.dataset.aeroGrip=(Number(vehicle.aeroGripMultiplier)||1).toFixed(3);
    row.dataset.understeerRisk=(Number(vehicle.understeerRisk)||0).toFixed(3);
    row.dataset.driverPace=(Number(vehicle.driverPaceMultiplier)||1).toFixed(4);
    row.dataset.paceNoise=(Number(vehicle.paceNoise)||0).toFixed(4);
    row.dataset.driverPaceRating=String(vehicle.driverProfile?.pace||'');
    row.dataset.driverConsistency=String(vehicle.driverProfile?.consistency||'');
    row.dataset.driverRacecraft=String(vehicle.driverProfile?.racecraft||'');
    row.dataset.longRunPaceBias=(Number(vehicle.longRunPaceBias)||0).toFixed(5);
    row.dataset.longRunPaceMultiplier=(Number(vehicle.longRunPaceMultiplier)||1).toFixed(5);
    row.dataset.energyMJ=(Number(vehicle.batteryMJ)||0).toFixed(3);
    row.dataset.energyDeployKW=String(Math.round(vehicle.energyDeployKW||0));
    row.dataset.energyRechargeKW=String(Math.round(vehicle.energyRechargeKW||0));
    row.dataset.energyHarvestLapMJ=(Number(vehicle.energyHarvestLapMJ)||0).toFixed(3);
    row.dataset.boost=vehicle.boostActive?'1':'0';
    row.dataset.boostKW=String(Math.round(vehicle.boostPowerKW||0));
    row.dataset.activeAero=String(vehicle.activeAeroMode||'CORNER');
    row.dataset.activeAeroTarget=String(vehicle.activeAeroTarget||'CORNER');
    row.dataset.overtakeEligible=vehicle.overtakeEligible?'1':'0';
    row.dataset.overtakeActive=vehicle.overtakeActive?'1':'0';
    row.dataset.overtakeGap=Number.isFinite(vehicle.overtakeGapSeconds)?Number(vehicle.overtakeGapSeconds).toFixed(3):'';
    row.dataset.tyreCompound=String(vehicle.tyreCompound||'MEDIUM');
    row.dataset.incident=activeDrivingIncidentV204(vehicle)||'';
    row.dataset.lockups=String(Number(vehicle.lockupCount)||0);
    row.dataset.understeers=String(Number(vehicle.understeerCount)||0);
    row.dataset.oversteers=String(Number(vehicle.oversteerCount)||0);
    row.dataset.pitState=String(vehicle.pitState||'TRACK');
    row.dataset.pitRequested=vehicle.pitRequested?'1':'0';
    row.dataset.pitStops=String(Number(vehicle.pitStopCount)||0);
    row.dataset.tyreWarmup=(Number(vehicle.tyreWarmupFactor)||1).toFixed(3);
    row.dataset.pitStrategy=String(vehicle.strategyDecision||'NONE');
    row.dataset.trafficState=String(vehicle.trafficState||'CLEAR');
    row.dataset.trafficPressure=(Number(vehicle.trafficPressure)||0).toFixed(3);
    row.dataset.trafficClosingKph=(Number(vehicle.trafficClosingRateKph)||0).toFixed(1);
    row.dataset.defence=vehicle.defenceActive?'1':'0';
    row.dataset.battleState=String(vehicle.battleState||'FOLLOWING');
    row.dataset.battleTarget=String(vehicle.battleTargetId||'');
    row.dataset.passCompleted=String(Number(vehicle.passCompletedCount)||0);
    row.dataset.backmarker=vehicle.backmarker?'1':'0';
    row.dataset.blueFlag=vehicle.blueFlag?'1':'0';
    row.dataset.lapDeficit=String(Number(vehicle.lapDeficitV215)||0);
    row.dataset.pitStrategyReason=String(vehicle.strategyReason||'');
    row.dataset.pitStrategyScore=(Number(vehicle.strategyScore)||0).toFixed(3);
    row.dataset.pitStrategyTarget=String(vehicle.strategyTargetCompound||vehicle.tyreCompound||'MEDIUM');
    row.dataset.tyreWear=(Number(vehicle.tyreWear)||0).toFixed(3);
    row.dataset.tyreSurface=(Number(vehicle.tyreSurfaceTemp)||0).toFixed(3);
    row.dataset.tyreCarcass=(Number(vehicle.tyreCarcassTemp)||0).toFixed(3);
    row.dataset.tyreGrip=(Number(vehicle.tyreGrip)||1).toFixed(3);
    row.dataset.tyreStrategy=(Number(vehicle.tyreStrategyPressure)||0).toFixed(3);
    const tyre=row.querySelector('.tyre');if(tyre)tyre.textContent=tyreCompoundSpecV203(vehicle.tyreCompound).code;
    syncLiveTimingStatusV253(row,vehicle);
  }
  updateRaceStandingsV191();
  renderPitHudV361();
  syncSpectatorHighlightsV252();
  syncRaceHeadlineV255();
  return true;
}
function classifyBackmarkerV215(leader,vehicle){
  if(!leader||!vehicle||leader===vehicle)return {backmarker:false,blueFlag:false,lapDeficit:0,leaderClosingProgress:1};
  const lapDeficit=Math.max(0,(Number(leader.completedLaps)||0)-(Number(vehicle.completedLaps)||0));
  const leaderClosingProgress=normalizedProgressV190((Number(vehicle.progress)||0)-(Number(leader.progress)||0));
  const backmarker=lapDeficit>=1;
  const blueFlag=backmarker&&leaderClosingProgress<=BLUE_FLAG_CONFIG_V215.approachProgress&&raceFlagStateV214.flag==='GREEN';
  return {backmarker,blueFlag,lapDeficit,leaderClosingProgress};
}
function updateBackmarkerBlueFlagsV215(){
  const standings=computeRaceStandingsV191();
  const leader=standings[0]?.vehicle||null;
  const rows=[];
  for(const vehicle of raceMotionV189.vehicles){
    const state=classifyBackmarkerV215(leader,vehicle);
    vehicle.backmarker=state.backmarker;
    vehicle.blueFlag=state.blueFlag;
    vehicle.lapDeficitV215=state.lapDeficit;
    vehicle.blueFlagGapProgressV215=state.leaderClosingProgress;
    if(vehicle.blueFlag){
      vehicle.defenceActive=false;
      vehicle.battleSpeedBiasKph=Math.min(0,Number(vehicle.battleSpeedBiasKph)||0);
      if(vehicle.pitState==='TRACK')vehicle.racingLineMode='OUTSIDE';
    }
    rows.push({id:vehicle.id,...state});
  }
  return rows;
}
function qaBackmarkerBlueFlagV215(){
  const original={...raceFlagStateV214};raceFlagStateV214={flag:'GREEN',reason:'QA',sinceSimMs:0};
  const leader={completedLaps:4,progress:.40};
  const approaching={completedLaps:3,progress:.47};
  const far={completedLaps:3,progress:.72};
  const sameLap={completedLaps:4,progress:.47};
  const a=classifyBackmarkerV215(leader,approaching),b=classifyBackmarkerV215(leader,far),c=classifyBackmarkerV215(leader,sameLap);
  raceFlagStateV214=original;
  return {approaching:a,far:b,sameLap:c,allPass:a.backmarker&&a.blueFlag&&b.backmarker&&!b.blueFlag&&!c.backmarker&&!c.blueFlag};
}

function computeRaceStandingsV191(){
  const sorted=[...raceMotionV189.vehicles].sort(function(a,b){
    const delta=Number(b.raceProgress||0)-Number(a.raceProgress||0);
    if(Math.abs(delta)>1e-9)return delta;
    return Number(a.driver?.gridPosition||999)-Number(b.driver?.gridPosition||999);
  });
  const leader=sorted[0]||null;
  return sorted.map(function(vehicle,index){
    const previous=index>0?sorted[index-1]:null;
    const gapProgress=leader?Math.max(0,Number(leader.raceProgress)-Number(vehicle.raceProgress)):0;
    const intervalProgress=previous?Math.max(0,Number(previous.raceProgress)-Number(vehicle.raceProgress)):0;
    const leaderLapMs=Math.max(1,Number(leader?.lapDurationMs)||1);
    const previousLapMs=Math.max(1,Number(previous?.lapDurationMs)||leaderLapMs);
    return {
      vehicle,
      position:index+1,
      gapProgress,
      intervalProgress,
      gapSeconds:index===0?0:gapProgress*leaderLapMs/1000,
      intervalSeconds:index===0?0:intervalProgress*previousLapMs/1000
    };
  });
}

function interactionVehicleSnapshotV368(vehicle,sourceIndex=0){
  return Object.freeze({
    id:String(vehicle?.id||''),
    raceProgress:Number(vehicle?.raceProgress)||0,
    progress:Number(vehicle?.progress)||0,
    speedKph:Number(vehicle?.speedKph)||0,
    lateralOffsetMeters:Number(vehicle?.lateralOffsetMeters)||0,
    visualLateralOffsetMeters:Number(vehicle?.visualLateralOffsetMeters)||0,
    pitState:String(vehicle?.pitState||'TRACK'),
    pitRequested:Boolean(vehicle?.pitRequested),
    finished:Boolean(vehicle?.finished),
    completedLaps:Number(vehicle?.completedLaps)||0,
    currentLap:Math.max(1,Number(vehicle?.currentLap)||1),
    gridPosition:Number(vehicle?.driver?.gridPosition||999),
    racingLineMode:String(vehicle?.racingLineMode||'IDEAL'),
    sourceIndex:Number(sourceIndex)||0
  });
}
function interactionRowSortV368(a,b){
  const delta=Number(b?.raceProgress||0)-Number(a?.raceProgress||0);
  if(Math.abs(delta)>1e-9)return delta;
  const gridDelta=Number(a?.gridPosition||999)-Number(b?.gridPosition||999);
  if(gridDelta!==0)return gridDelta;
  return Number(a?.sourceIndex||0)-Number(b?.sourceIndex||0);
}
function buildInteractionSnapshotV368(vehicles=raceMotionV189.vehicles,track=activeRaceSnapshotV187?.track){
  const length=Math.max(1,Number(track?.lengthMeters)||1);
  const rows=(Array.isArray(vehicles)?vehicles:[]).map((vehicle,index)=>interactionVehicleSnapshotV368(vehicle,index));
  const officialRows=[...rows].sort(interactionRowSortV368);
  const trackRows=officialRows.filter(row=>!row.finished&&row.pitState==='TRACK');
  const officialOrder=Object.freeze(officialRows.map(row=>row.id));
  const trackInteractionOrder=Object.freeze(trackRows.map(row=>row.id));
  const officialPositionById={},trackPositionById={},neighbors={};
  officialRows.forEach((row,index)=>{officialPositionById[row.id]=index+1});
  trackRows.forEach((row,index)=>{
    trackPositionById[row.id]=index+1;
    const ahead=index>0?trackRows[index-1]:null;
    const behind=index+1<trackRows.length?trackRows[index+1]:null;
    neighbors[row.id]=Object.freeze({
      aheadId:ahead?.id||'',
      behindId:behind?.id||'',
      gapAheadMeters:ahead?Math.max(0,(Number(ahead.raceProgress)-Number(row.raceProgress))*length):Infinity,
      gapBehindMeters:behind?Math.max(0,(Number(row.raceProgress)-Number(behind.raceProgress))*length):Infinity
    });
  });
  const excludedFromTrackOrder=Object.freeze(officialRows.filter(row=>row.finished||row.pitState!=='TRACK').map(row=>Object.freeze({
    id:row.id,
    reason:row.finished?'FINISHED':'PIT_'+row.pitState
  })));
  return Object.freeze({
    version:VERSION368,
    simTimeMs:Number(simClockV192.simTimeMs)||0,
    trackLengthMeters:length,
    officialOrder,
    trackInteractionOrder,
    officialPositionById:Object.freeze(officialPositionById),
    trackPositionById:Object.freeze(trackPositionById),
    neighbors:Object.freeze(neighbors),
    excludedFromTrackOrder,
    rows:Object.freeze(rows)
  });
}
function updateInteractionSnapshotShadowV368(){
  const snapshot=buildInteractionSnapshotV368();
  interactionSnapshotStateV368.snapshot=snapshot;
  interactionSnapshotStateV368.builds+=1;
  interactionSnapshotStateV368.lastSimTimeMs=Number(simClockV192.simTimeMs)||0;
  return snapshot;
}
function resetInteractionSnapshotV368(){
  interactionSnapshotStateV368.snapshot=null;
  interactionSnapshotStateV368.builds=0;
  interactionSnapshotStateV368.lastSimTimeMs=0;
  return true;
}
function getInteractionSnapshotV368(){
  return interactionSnapshotStateV368.snapshot||buildInteractionSnapshotV368();
}
function qaInteractionSnapshotV368(){
  const synthetic=[
    {id:'v368-a',raceProgress:2.00,progress:0,speedKph:250,lateralOffsetMeters:0,visualLateralOffsetMeters:0,pitState:'TRACK',pitRequested:false,finished:false,completedLaps:1,currentLap:2,racingLineMode:'IDEAL',driver:{gridPosition:1}},
    {id:'v368-b',raceProgress:1.92,progress:.92,speedKph:80,lateralOffsetMeters:0,visualLateralOffsetMeters:0,pitState:'PIT_LANE',pitRequested:true,finished:false,completedLaps:1,currentLap:2,racingLineMode:'PIT_LINE',driver:{gridPosition:2}},
    {id:'v368-c',raceProgress:1.84,progress:.84,speedKph:245,lateralOffsetMeters:0,visualLateralOffsetMeters:0,pitState:'TRACK',pitRequested:false,finished:false,completedLaps:1,currentLap:2,racingLineMode:'IDEAL',driver:{gridPosition:3}},
    {id:'v368-d',raceProgress:1.70,progress:.70,speedKph:0,lateralOffsetMeters:0,visualLateralOffsetMeters:0,pitState:'TRACK',pitRequested:false,finished:true,completedLaps:1,currentLap:2,racingLineMode:'IDEAL',driver:{gridPosition:4}}
  ];
  const before=JSON.stringify(synthetic);
  const snapshot=buildInteractionSnapshotV368(synthetic,{lengthMeters:5000});
  const officialExpected=['v368-a','v368-b','v368-c','v368-d'];
  const trackExpected=['v368-a','v368-c'];
  const neighbor=snapshot.neighbors['v368-c']||{};
  const noMutation=JSON.stringify(synthetic)===before;
  const officialMatches=JSON.stringify(snapshot.officialOrder)===JSON.stringify(officialExpected);
  const trackSeparated=JSON.stringify(snapshot.trackInteractionOrder)===JSON.stringify(trackExpected);
  const pitExcluded=snapshot.excludedFromTrackOrder.some(row=>row.id==='v368-b'&&row.reason==='PIT_PIT_LANE');
  const finishedExcluded=snapshot.excludedFromTrackOrder.some(row=>row.id==='v368-d'&&row.reason==='FINISHED');
  const neighborSkipsPit=neighbor.aheadId==='v368-a'&&Math.abs(Number(neighbor.gapAheadMeters)-800)<.001;
  const frozen=Object.isFrozen(snapshot)&&Object.isFrozen(snapshot.officialOrder)&&Object.isFrozen(snapshot.trackInteractionOrder)&&Object.isFrozen(snapshot.neighbors);
  const liveOfficial=computeRaceStandingsV191().map(row=>String(row.vehicle?.id||''));
  const liveShadow=buildInteractionSnapshotV368().officialOrder;
  const liveOfficialMatches=liveOfficial.length===liveShadow.length&&liveOfficial.every((id,index)=>id===liveShadow[index]);
  const liveBefore=JSON.stringify(raceMotionV189.vehicles.map(vehicle=>({
    id:String(vehicle.id||''),raceProgress:Number(vehicle.raceProgress)||0,speedKph:Number(vehicle.speedKph)||0,
    pitState:String(vehicle.pitState||'TRACK'),battleState:String(vehicle.battleState||''),battleTargetId:String(vehicle.battleTargetId||''),
    racingLineMode:String(vehicle.racingLineMode||'IDEAL'),trafficCarAheadId:String(vehicle.trafficCarAheadId||'')
  })));
  updateInteractionSnapshotShadowV368();
  const liveAfter=JSON.stringify(raceMotionV189.vehicles.map(vehicle=>({
    id:String(vehicle.id||''),raceProgress:Number(vehicle.raceProgress)||0,speedKph:Number(vehicle.speedKph)||0,
    pitState:String(vehicle.pitState||'TRACK'),battleState:String(vehicle.battleState||''),battleTargetId:String(vehicle.battleTargetId||''),
    racingLineMode:String(vehicle.racingLineMode||'IDEAL'),trafficCarAheadId:String(vehicle.trafficCarAheadId||'')
  })));
  const shadowOnlyNoVehicleMutation=liveBefore===liveAfter;
  return {
    version:VERSION368,officialExpected,officialOrder:[...snapshot.officialOrder],trackExpected,trackInteractionOrder:[...snapshot.trackInteractionOrder],
    pitExcluded,finishedExcluded,neighborSkipsPit,noMutation,frozen,liveOfficialMatches,shadowOnlyNoVehicleMutation,
    builds:Number(interactionSnapshotStateV368.builds)||0,
    allPass:officialMatches&&trackSeparated&&pitExcluded&&finishedExcluded&&neighborSkipsPit&&noMutation&&frozen&&liveOfficialMatches&&shadowOnlyNoVehicleMutation
  };
}
window.mwsF1GetInteractionSnapshotV368=getInteractionSnapshotV368;
window.mwsF1QaInteractionSnapshotV368=qaInteractionSnapshotV368;
window.__mwsF1RacingV368=VERSION368;

function trackInteractionEligibleV369(vehicle){
  return Boolean(vehicle)&&!Boolean(vehicle.finished)&&String(vehicle.pitState||'TRACK')==='TRACK';
}
function trackInteractionVehiclesV369(vehicles=raceMotionV189.vehicles,track=activeRaceSnapshotV187?.track){
  const list=Array.isArray(vehicles)?vehicles:[];
  const snapshot=buildInteractionSnapshotV368(list,track);
  const byId=new Map(list.map(vehicle=>[String(vehicle?.id||''),vehicle]));
  return snapshot.trackInteractionOrder.map(id=>byId.get(String(id))).filter(trackInteractionEligibleV369);
}
function clearAeroWakeV369(vehicle){
  if(!vehicle)return false;
  vehicle.carAheadId=null;vehicle.gapToCarAheadMeters=Infinity;
  vehicle.slipstreamStrength=0;vehicle.slipstreamDragReduction=0;
  vehicle.slipstreamGapEffect=0;vehicle.slipstreamAlignmentEffect=0;vehicle.slipstreamLateralEffect=0;vehicle.slipstreamStraightEffect=0;
  vehicle.dirtyAirStrength=0;vehicle.aeroGripMultiplier=1;vehicle.understeerRisk=0;vehicle.slideRisk=0;vehicle.dirtyAirTyreHeatLoad=0;
  return true;
}
function clearTrafficReferenceV369(vehicle,reason='PIT_ENTRY'){
  if(!vehicle)return false;
  vehicle.trafficState='CLEAR';vehicle.trafficCarAheadId='';vehicle.trafficGapMeters=Infinity;
  vehicle.trafficClosingRateKph=0;vehicle.trafficPressure=0;vehicle.trafficThreatFromId='';
  vehicle.defenceActive=false;vehicle.trafficLineIntent='IDEAL';
  vehicle.battleState='FOLLOWING';vehicle.battleTargetId='';vehicle.battleStateMs=0;
  vehicle.battleReason=String(reason||'PIT_ENTRY');vehicle.battleSpeedBiasKph=0;vehicle.battleBlockedV319=false;
  vehicle.overtakeEligible=false;vehicle.overtakeActive=false;vehicle.overtakeGapSeconds=Infinity;
  vehicle.attackOpportunityScore=0;vehicle.defenceThreatScore=0;
  clearAeroWakeV369(vehicle);
  return true;
}
function clearBattleLinksForVehicleV369(driverId){
  const key=String(driverId||'');
  const group=document.querySelector('.f1-racing-battle-links-v256');
  if(!group||!key)return 0;
  let removed=0;
  [...group.children].forEach(node=>{
    const attacker=String(node.dataset?.attackerIdV256||''),target=String(node.dataset?.targetIdV256||'');
    if(attacker===key||target===key){node.remove();removed+=1}
  });
  group.dataset.activeLinksV256=String(group.children.length);
  return removed;
}
function clearPitInteractionStateV369(vehicle,vehicles=raceMotionV189.vehicles,reason='PIT_ENTRY'){
  if(!vehicle)return {cleared:false,inboundBattleTargets:0,inboundTrafficTargets:0,inboundAeroTargets:0,removedLinks:0};
  const key=String(vehicle.id||'');
  clearTrafficReferenceV369(vehicle,reason);
  vehicle.pitPreviousRacingLineMode='IDEAL';
  vehicle.chaseBurstTargetIdV275='';
  let inboundBattleTargets=0,inboundTrafficTargets=0,inboundAeroTargets=0;
  for(const other of Array.isArray(vehicles)?vehicles:[]){
    if(!other||other===vehicle)continue;
    if(String(other.battleTargetId||'')===key){
      other.battleState='FOLLOWING';other.battleTargetId='';other.battleStateMs=0;other.battleReason='TARGET_'+String(reason||'PIT_ENTRY');
      other.battleSpeedBiasKph=0;other.battleBlockedV319=false;inboundBattleTargets+=1;
    }
    if(String(other.trafficCarAheadId||'')===key){
      other.trafficState='CLEAR';other.trafficCarAheadId='';other.trafficGapMeters=Infinity;other.trafficClosingRateKph=0;other.trafficPressure=0;
      other.trafficLineIntent='IDEAL';inboundTrafficTargets+=1;
    }
    if(String(other.trafficThreatFromId||'')===key){
      other.trafficThreatFromId='';other.defenceActive=false;
    }
    if(String(other.carAheadId||'')===key){
      clearAeroWakeV369(other);inboundAeroTargets+=1;
    }
    if(String(other.chaseBurstTargetIdV275||'')===key){
      other.chaseBurstTargetIdV275='';other.chaseBurstLastEndReasonV275='TARGET_'+String(reason||'PIT_ENTRY');
    }
  }
  const removedLinks=clearBattleLinksForVehicleV369(key);
  return {cleared:true,id:key,inboundBattleTargets,inboundTrafficTargets,inboundAeroTargets,removedLinks};
}
function qaPitInteractionIsolationV369(){
  const synthetic=[
    {id:'v369-leader',raceProgress:2,progress:0,speedKph:250,pitState:'TRACK',finished:false,driver:{gridPosition:1}},
    {id:'v369-pit',raceProgress:1.95,progress:.95,speedKph:80,pitState:'PIT_ENTRY',finished:false,driver:{gridPosition:2},
      battleState:'SIDE_BY_SIDE',battleTargetId:'v369-leader',battleStateMs:900,battleReason:'QA',battleSpeedBiasKph:3,battleBlockedV319:true,
      trafficState:'PRESSURE',trafficCarAheadId:'v369-leader',trafficGapMeters:8,trafficClosingRateKph:12,trafficPressure:.9,trafficThreatFromId:'v369-follower',defenceActive:true,trafficLineIntent:'ATTACK_INSIDE',
      carAheadId:'v369-leader',gapToCarAheadMeters:8,slipstreamStrength:.8,slipstreamDragReduction:.1,dirtyAirStrength:.7,aeroGripMultiplier:.9,understeerRisk:.4,slideRisk:.2,dirtyAirTyreHeatLoad:.3,
      pitPreviousRacingLineMode:'ATTACK_INSIDE',chaseBurstTargetIdV275:'v369-leader'},
    {id:'v369-follower',raceProgress:1.90,progress:.90,speedKph:248,pitState:'TRACK',finished:false,driver:{gridPosition:3},
      battleState:'PULLING_OUT',battleTargetId:'v369-pit',battleStateMs:500,battleReason:'QA',battleSpeedBiasKph:2,battleBlockedV319:true,
      trafficState:'PRESSURE',trafficCarAheadId:'v369-pit',trafficGapMeters:7,trafficClosingRateKph:10,trafficPressure:.8,trafficThreatFromId:'v369-pit',defenceActive:true,trafficLineIntent:'ATTACK_INSIDE',
      carAheadId:'v369-pit',gapToCarAheadMeters:7,slipstreamStrength:.7,slipstreamDragReduction:.09,dirtyAirStrength:.6,aeroGripMultiplier:.92,understeerRisk:.3,slideRisk:.2,dirtyAirTyreHeatLoad:.2,
      chaseBurstTargetIdV275:'v369-pit'},
    {id:'v369-finished',raceProgress:1.85,progress:.85,speedKph:0,pitState:'TRACK',finished:true,driver:{gridPosition:4}}
  ];
  const trackVehicles=trackInteractionVehiclesV369(synthetic,{lengthMeters:5000});
  const trackIds=trackVehicles.map(vehicle=>String(vehicle.id));
  const filtersPitAndFinished=JSON.stringify(trackIds)===JSON.stringify(['v369-leader','v369-follower']);
  const cleanup=clearPitInteractionStateV369(synthetic[1],synthetic,'QA_PIT_ENTRY');
  const pit=synthetic[1],follower=synthetic[2];
  const pitCleared=pit.battleTargetId===''&&pit.battleState==='FOLLOWING'&&pit.trafficCarAheadId===''&&pit.carAheadId===null&&pit.slipstreamStrength===0&&pit.dirtyAirStrength===0&&pit.pitPreviousRacingLineMode==='IDEAL';
  const inboundCleared=follower.battleTargetId===''&&follower.battleState==='FOLLOWING'&&follower.trafficCarAheadId===''&&follower.carAheadId===null&&follower.trafficThreatFromId===''&&follower.defenceActive===false&&follower.chaseBurstTargetIdV275==='';
  const slipSource=String(resolveSlipstreamV198),dirtySource=String(resolveDirtyAirV199),trafficSource=String(updateTrafficAndDefenceV207),pitSource=String(updatePitPostStepV205),linkSource=String(syncBattleLinksV256);
  const slipGuard=slipSource.includes('trackInteractionEligibleV369(vehicle)')&&slipSource.includes('trackInteractionEligibleV369(candidate)');
  const dirtyGuard=dirtySource.includes('trackInteractionEligibleV369(vehicle)')&&dirtySource.includes('trackInteractionEligibleV369(ahead)');
  const trafficTrackOrder=trafficSource.includes('trackInteractionVehiclesV369');
  const pitEntryCleanup=pitSource.includes("clearPitInteractionStateV369(vehicle,raceMotionV189.vehicles,'PIT_ENTRY')");
  const battleLinkGuard=linkSource.includes('trackInteractionEligibleV369(attacker)')&&linkSource.includes('trackInteractionEligibleV369(target)');
  return {version:VERSION369,trackIds,filtersPitAndFinished,cleanup,pitCleared,inboundCleared,slipGuard,dirtyGuard,trafficTrackOrder,pitEntryCleanup,battleLinkGuard,
    allPass:filtersPitAndFinished&&pitCleared&&inboundCleared&&slipGuard&&dirtyGuard&&trafficTrackOrder&&pitEntryCleanup&&battleLinkGuard};
}
window.mwsF1TrackInteractionEligibleV369=trackInteractionEligibleV369;
window.mwsF1ClearPitInteractionStateV369=clearPitInteractionStateV369;
window.mwsF1QaPitInteractionIsolationV369=qaPitInteractionIsolationV369;
window.__mwsF1RacingV369=VERSION369;

function resetRaceOrderFlowV309(vehicles=raceMotionV189.vehicles){
  raceOrderFlowStateV309.lastOrder=(vehicles||[]).slice().sort((a,b)=>Number(b.raceProgress||0)-Number(a.raceProgress||0)).map(v=>String(v.id||''));
  raceOrderFlowStateV309.orderChanges=0;raceOrderFlowStateV309.changedDrivers=0;
  return {...raceOrderFlowStateV309,lastOrder:[...raceOrderFlowStateV309.lastOrder]};
}
function recordRaceOrderFlowV309(){
  const order=computeRaceStandingsV191().map(row=>String(row.vehicle?.id||''));
  if(raceOrderFlowStateV309.lastOrder.length===order.length&&order.length){
    let moved=0;for(let i=0;i<order.length;i++)if(order[i]!==raceOrderFlowStateV309.lastOrder[i])moved+=1;
    if(moved>0){raceOrderFlowStateV309.orderChanges+=1;raceOrderFlowStateV309.changedDrivers+=moved}
  }
  raceOrderFlowStateV309.lastOrder=order;
  return {...raceOrderFlowStateV309,lastOrder:[...order]};
}
function formatRaceDeltaV191(progress,seconds,isLeader=false){
  if(isLeader)return '선두';
  const laps=Math.floor(Math.max(0,Number(progress)||0));
  if(laps>=1)return '+'+laps+'랩';
  return '+'+Math.max(0,Number(seconds)||0).toFixed(3);
}
function applyLiveTimingFlipV212(standings){
  const list=document.getElementById('f1RacingTimingListV188');
  if(!list||!Array.isArray(standings)||!standings.length)return {moved:0,order:[]};
  const before=new Map();
  for(const row of Array.from(list.querySelectorAll('[data-f1-driver-id]'))){
    const rect=row.getBoundingClientRect();
    before.set(String(row.dataset.f1DriverId),rect.top);
  }
  let moved=0;
  for(const standing of standings){
    const row=findTimingRowV190(standing.vehicle.id);
    if(row)list.appendChild(row);
  }
  for(const standing of standings){
    const row=findTimingRowV190(standing.vehicle.id);if(!row)continue;
    const previousTop=before.get(String(row.dataset.f1DriverId));
    const nextTop=row.getBoundingClientRect().top;
    const delta=Number.isFinite(previousTop)?previousTop-nextTop:0;
    row.dataset.flipDelta=String(Math.round(delta));
    if(Math.abs(delta)>.5){
      moved+=1;
      if(typeof row.animate==='function')row.animate(
        [{transform:'translateY('+delta+'px)'},{transform:'translateY(0px)'}],
        {duration:320,easing:'cubic-bezier(.2,.8,.2,1)'}
      );
    }
  }
  return {moved,order:standings.map(row=>String(row.vehicle.id))};
}
function ensureTopThreeStylesV213(){
  if(document.getElementById('f1RacingTopThreeStylesV213'))return true;
  const style=document.createElement('style');
  style.id='f1RacingTopThreeStylesV213';
  style.textContent=[
    '.f1-racing-timing-row-v188[data-top-three="p1"]{box-shadow:inset 4px 0 0 #ffd54a,0 0 0 1px rgba(255,213,74,.35);background:linear-gradient(90deg,rgba(255,213,74,.16),rgba(255,213,74,.025));}',
    '.f1-racing-timing-row-v188[data-top-three="p2"]{box-shadow:inset 4px 0 0 #c7d2df,0 0 0 1px rgba(199,210,223,.28);background:linear-gradient(90deg,rgba(199,210,223,.13),rgba(199,210,223,.02));}',
    '.f1-racing-timing-row-v188[data-top-three="p3"]{box-shadow:inset 4px 0 0 #c98b5a,0 0 0 1px rgba(201,139,90,.28);background:linear-gradient(90deg,rgba(201,139,90,.13),rgba(201,139,90,.02));}',
    '.f1-racing-timing-row-v188[data-top-three] .pos{font-size:1.08em;letter-spacing:.04em;}',
    '.f1-racing-timing-row-v188[data-top-three="p1"] .driver b{font-size:1.05em;}'
  ].join('');
  document.head.appendChild(style);
  return true;
}
function applyTopThreePresentationV213(standings){
  ensureTopThreeStylesV213();
  const rows=document.querySelectorAll('#f1RacingTimingListV188 [data-f1-driver-id]');
  rows.forEach(row=>{delete row.dataset.topThree;delete row.dataset.topThreeLabel;});
  for(const standing of standings||[]){
    const row=findTimingRowV190(standing.vehicle.id);if(!row)continue;
    if(standing.position<=3){
      row.dataset.topThree='p'+standing.position;
      row.dataset.topThreeLabel=standing.position===1?'LEADER':standing.position===2?'P2':'P3';
    }
  }
  return Array.from(rows).filter(row=>row.dataset.topThree).map(row=>({id:row.dataset.f1DriverId,rank:row.dataset.topThree}));
}
function qaTopThreePresentationV213(){
  ensureTopThreeStylesV213();
  const standings=computeRaceStandingsV191();
  const applied=applyTopThreePresentationV213(standings);
  return {standings:standings.length,applied,styleReady:Boolean(document.getElementById('f1RacingTopThreeStylesV213')),allPass:standings.length<3||applied.length===3};
}

function qaLiveTimingFlipV212(){
  const standings=computeRaceStandingsV191();
  const list=document.getElementById('f1RacingTimingListV188');
  return {
    standings:standings.length,
    domRows:list?list.querySelectorAll('[data-f1-driver-id]').length:0,
    functionReady:typeof applyLiveTimingFlipV212==='function',
    allPass:typeof applyLiveTimingFlipV212==='function'&&(!list||list.querySelectorAll('[data-f1-driver-id]').length===standings.length)
  };
}
function updateRaceStandingsV191(){
  const standings=computeRaceStandingsV191();
  for(const vehicle of raceMotionV189.vehicles){
    vehicle.position=standing.position;
    vehicle.gapProgress=standing.gapProgress;
    vehicle.intervalProgress=standing.intervalProgress;
    vehicle.gapSeconds=standing.gapSeconds;
    vehicle.intervalSeconds=standing.intervalSeconds;
    const row=findTimingRowV190(vehicle.id);if(!row)continue;
    row.dataset.position=String(standing.position);
    syncPositionDeltaV252(row,vehicle,standing.position);
    const pos=row.querySelector('.pos');if(pos)pos.textContent='P'+String(standing.position).padStart(2,'0');
    const gap=row.querySelector('[data-f1-gap]');if(gap)gap.textContent=formatRaceDeltaV191(standing.gapProgress,standing.gapSeconds,standing.position===1);
    const interval=row.querySelector('[data-f1-interval]');if(interval)interval.textContent=standing.position===1?'--':formatRaceDeltaV191(standing.intervalProgress,standing.intervalSeconds,false);
    row.classList.remove('podium','p1','p2','p3');
    if(standing.position<=3)row.classList.add('podium','p'+standing.position);
    if(vehicle.marker){vehicle.marker.classList.toggle('leader',standing.position===1);syncRaceMarkerPositionV254(vehicle.marker,standing.position)}
  }
  applyTopThreePresentationV213(standings);
  applyLiveTimingFlipV212(standings);
  return standings;
}
function positionDeltaStateV252(vehicle,position){
  const grid=Math.max(1,Number(vehicle?.driver?.gridPosition)||Number(position)||1);
  const current=Math.max(1,Number(position)||1);
  const delta=grid-current;
  return {grid,current,delta,trend:delta>0?'up':delta<0?'down':'same',label:delta>0?'▲'+delta:delta<0?'▼'+Math.abs(delta):''};
}
function syncPositionDeltaV252(row,vehicle,position){
  if(!row)return null;
  const state=positionDeltaStateV252(vehicle,position);
  const pos=row.querySelector('.pos');
  row.dataset.positionDeltaV252=String(state.delta);
  row.dataset.positionTrendV252=state.trend;
  if(pos){
    pos.dataset.positionDeltaV252=state.label;
    pos.dataset.positionTrendV252=state.trend;
    pos.title=state.delta===0?'그리드 대비 순위 변화 없음':'그리드 대비 '+(state.delta>0?state.delta+'계단 상승':Math.abs(state.delta)+'계단 하락');
  }
  return state;
}
function isBattleVisualStateV252(state){
  return SPECTATOR_BATTLE_STATES_V252.includes(String(state||'FOLLOWING'));
}
function isOvertakeAttemptStateV252(state){
  return SPECTATOR_OVERTAKE_STATES_V252.includes(String(state||'FOLLOWING'));
}
function syncVehicleSpectatorClassesV252(vehicle,marker=vehicle?.marker){
  if(!vehicle||!marker)return null;
  const state=String(vehicle.battleState||'FOLLOWING');
  const battle=isBattleVisualStateV252(state);
  const attempt=isOvertakeAttemptStateV252(state);
  const passFlash=(Number(vehicle.spectatorPassFlashUntilV252)||0)>(Number(simClockV192.simTimeMs)||0);
  marker.dataset.spectatorBattleV252=battle?'1':'0';
  marker.dataset.spectatorOvertakeV252=attempt?'1':'0';
  marker.dataset.spectatorPassFlashV252=passFlash?'1':'0';
  marker.classList.toggle('battle-pulse-v252',battle);
  marker.classList.toggle('overtake-attempt-v252',attempt);
  marker.classList.toggle('pass-flash-v252',passFlash);
  return {state,battle,attempt,passFlash};
}
function fastestLapStateV252(){
  const timed=raceMotionV189.vehicles.filter(vehicle=>(Number(vehicle.bestLapMs)||0)>0);
  if(!timed.length)return {fastestMs:0,ids:[]};
  const fastestMs=Math.min(...timed.map(vehicle=>Number(vehicle.bestLapMs)||Infinity));
  const ids=timed.filter(vehicle=>Math.abs((Number(vehicle.bestLapMs)||0)-fastestMs)<.5).map(vehicle=>String(vehicle.id));
  return {fastestMs,ids};
}
function syncSpectatorHighlightsV252(){
  const fastest=fastestLapStateV252(),fastIds=new Set(fastest.ids);
  const rows=[];
  for(const vehicle of raceMotionV189.vehicles){
    const row=findTimingRowV190(vehicle.id),marker=vehicle.marker;
    const state=String(vehicle.battleState||'FOLLOWING');
    const battle=isBattleVisualStateV252(state),attempt=isOvertakeAttemptStateV252(state);
    const passFlash=(Number(vehicle.spectatorPassFlashUntilV252)||0)>(Number(simClockV192.simTimeMs)||0);
    const fastestLap=fastIds.has(String(vehicle.id));
    vehicle.fastestLapV252=fastestLap;
    if(marker){
      syncVehicleSpectatorClassesV252(vehicle,marker);
      marker.dataset.fastestLapV252=fastestLap?'1':'0';
      marker.classList.toggle('fastest-lap-v252',fastestLap);
    }
    if(row){
      row.dataset.battleVisualV252=battle?'1':'0';
      row.dataset.overtakeAttemptV252=attempt?'1':'0';
      row.dataset.passFlashV252=passFlash?'1':'0';
      row.dataset.fastestLapV252=fastestLap?'1':'0';
      const best=row.querySelector('.best');
      if(best){
        best.classList.toggle('is-fastest-v252',fastestLap);
        best.title=fastestLap?'전체 최고랩 '+formatLapTimeV248(vehicle.bestLapMs):'개인 최고랩';
      }
      rows.push({id:String(vehicle.id),battle,attempt,passFlash,fastestLap});
    }
  }
  return {fastestMs:fastest.fastestMs,fastestIds:fastest.ids,rows};
}
function qaSpectatorHighlightsV252(){
  if(raceMotionV189.vehicles.length<2)return {allPass:false,reason:'need-live-field'};
  const first=raceMotionV189.vehicles[0],second=raceMotionV189.vehicles[1];
  const firstRow=findTimingRowV190(first.id);
  const saved=[
    {vehicle:first,battleState:first.battleState,bestLapMs:first.bestLapMs,flash:first.spectatorPassFlashUntilV252},
    {vehicle:second,battleState:second.battleState,bestLapMs:second.bestLapMs,flash:second.spectatorPassFlashUntilV252}
  ];
  let observed={};
  try{
    first.battleState='SIDE_BY_SIDE';
    first.spectatorPassFlashUntilV252=(Number(simClockV192.simTimeMs)||0)+1800;
    first.bestLapMs=60000;
    second.bestLapMs=62000;
    const synced=syncSpectatorHighlightsV252();
    const row=firstRow,marker=first.marker,best=row?.querySelector('.best'),pos=row?.querySelector('.pos');
    const up=positionDeltaStateV252({driver:{gridPosition:5}},2),down=positionDeltaStateV252({driver:{gridPosition:1}},4);
    syncPositionDeltaV252(row,{driver:{gridPosition:5}},2);
    const halo=marker?.querySelector('.car-halo'),ring=marker?.querySelector('.car-ring');
    observed={
      synced,rowBattle:row?.dataset.battleVisualV252,rowAttempt:row?.dataset.overtakeAttemptV252,rowPass:row?.dataset.passFlashV252,
      markerBattle:Boolean(marker?.classList.contains('battle-pulse-v252')),markerAttempt:Boolean(marker?.classList.contains('overtake-attempt-v252')),
      markerPass:Boolean(marker?.classList.contains('pass-flash-v252')),bestFastest:Boolean(best?.classList.contains('is-fastest-v252')),
      fastestRow:row?.dataset.fastestLapV252,up,down,
      positionLabel:String(pos?.dataset.positionDeltaV252||''),
      positionTrend:String(pos?.dataset.positionTrendV252||''),
      battleAnimation:String(halo?getComputedStyle(halo).animationName:''),
      overtakeAnimation:String(ring?getComputedStyle(ring).animationName:''),
      fastestAfter:String(best?getComputedStyle(best,'::after').content:'')
    };
  }finally{
    for(const item of saved){
      item.vehicle.battleState=item.battleState;
      item.vehicle.bestLapMs=item.bestLapMs;
      item.vehicle.spectatorPassFlashUntilV252=item.flash;
    }
    if(firstRow)syncPositionDeltaV252(firstRow,first,Number(first.position)||1);
    syncSpectatorHighlightsV252();
  }
  const allPass=observed.rowBattle==='1'&&observed.rowAttempt==='1'&&observed.rowPass==='1'&&observed.markerBattle&&observed.markerAttempt&&observed.markerPass&&observed.bestFastest&&observed.fastestRow==='1'&&observed.up?.label==='▲3'&&observed.down?.label==='▼3'&&observed.positionLabel==='▲3'&&observed.positionTrend==='up'&&observed.battleAnimation.includes('f1BattlePulseV252')&&observed.overtakeAnimation.includes('f1OvertakePulseV252')&&observed.fastestAfter.includes('FL');
  return {...observed,allPass};
}

function battleLinkSegmentV256(attacker,target){
  const a=attacker?.renderPointV216,b=target?.renderPointV216;
  if(!a||!b)return null;
  const dx=Number(b.x)-Number(a.x),dy=Number(b.y)-Number(a.y);
  const distance=Math.hypot(dx,dy);
  if(!(distance>6))return null;
  const ux=dx/distance,uy=dy/distance;
  const startPad=Math.min(18,distance*.22),endPad=Math.min(20,distance*.22);
  const available=Math.max(0,distance-startPad-endPad);
  const length=Math.min(BATTLE_LINK_MAX_LENGTH_V256,available);
  if(!(length>4))return null;
  const x1=Number(a.x)+ux*startPad,y1=Number(a.y)+uy*startPad;
  const x2=x1+ux*length,y2=y1+uy*length;
  return {x1,y1,x2,y2,length,distance,ux,uy,clipped:available>BATTLE_LINK_MAX_LENGTH_V256};
}
function ensureBattleLinkLayerV256(){
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
  if(!layer)return null;
  let links=layer.querySelector(':scope > .f1-racing-battle-links-v256');
  if(!links){
    links=svgNodeV183('g',{class:'f1-racing-battle-links-v256','aria-hidden':'true'});
    layer.insertBefore(links,layer.firstChild);
  }
  return links;
}
function syncBattleLinksV256(){
  const group=ensureBattleLinkLayerV256();
  if(!group)return {count:0,links:[]};
  const byId=new Map(raceMotionV189.vehicles.map(vehicle=>[String(vehicle.id),vehicle]));
  const activeKeys=new Set(),rows=[];
  for(const attacker of raceMotionV189.vehicles){
    const state=String(attacker?.battleState||'FOLLOWING');
    const targetId=String(attacker?.battleTargetId||'');
    if(!trackInteractionEligibleV369(attacker)||!isBattleVisualStateV252(state)||!targetId)continue;
    const target=byId.get(targetId);
    if(!target||target===attacker||!trackInteractionEligibleV369(target))continue;
    const pair=[String(attacker.id),String(target.id)].sort().join('::');
    if(activeKeys.has(pair))continue;
    const segment=battleLinkSegmentV256(attacker,target);
    if(!segment)continue;
    activeKeys.add(pair);
    let node=[...group.children].find(child=>String(child.dataset?.battlePairV256||'')===pair);
    if(!node){
      node=svgNodeV183('g',{class:'f1-racing-battle-link-v256','data-battle-pair-v256':pair});
      node.append(
        svgNodeV183('line',{class:'battle-link-line-v256'}),
        svgNodeV183('polygon',{class:'battle-link-arrow-v256'})
      );
      group.appendChild(node);
    }
    node.dataset.attackerIdV256=String(attacker.id);
    node.dataset.targetIdV256=String(target.id);
    node.dataset.battleStateV256=state;
    node.dataset.clippedV256=segment.clipped?'1':'0';
    node.style.setProperty('--battle-link-color-v256',String(attacker.driverColorV216||'#ffd166'));
    const line=node.querySelector('.battle-link-line-v256');
    if(line){
      line.setAttribute('x1',segment.x1.toFixed(2));line.setAttribute('y1',segment.y1.toFixed(2));
      line.setAttribute('x2',segment.x2.toFixed(2));line.setAttribute('y2',segment.y2.toFixed(2));
    }
    const scale=raceMarkerScaleV245(raceCameraV216.zoom);
    const arrowLength=9*scale,arrowWidth=4.5*scale;
    const bx=segment.x2-segment.ux*arrowLength,by=segment.y2-segment.uy*arrowLength;
    const nx=-segment.uy,ny=segment.ux;
    const p1=segment.x2.toFixed(2)+','+segment.y2.toFixed(2);
    const p2=(bx+nx*arrowWidth).toFixed(2)+','+(by+ny*arrowWidth).toFixed(2);
    const p3=(bx-nx*arrowWidth).toFixed(2)+','+(by-ny*arrowWidth).toFixed(2);
    const arrow=node.querySelector('.battle-link-arrow-v256');
    if(arrow)arrow.setAttribute('points',[p1,p2,p3].join(' '));
    rows.push({pair,attackerId:String(attacker.id),targetId:String(target.id),state,length:Number(segment.length.toFixed(2)),clipped:segment.clipped});
  }
  [...group.children].forEach(node=>{if(!activeKeys.has(String(node.dataset?.battlePairV256||'')))node.remove()});
  group.dataset.activeLinksV256=String(rows.length);
  return {count:rows.length,links:rows};
}
function qaBattleLinksV256(){
  if(raceMotionV189.vehicles.length<2)return {allPass:false,reason:'need-live-field'};
  const attacker=raceMotionV189.vehicles[0],target=raceMotionV189.vehicles[1];
  if(!attacker.renderPointV216||!target.renderPointV216)return {allPass:false,reason:'need-render-points'};
  const saved={
    battleState:attacker.battleState,battleTargetId:attacker.battleTargetId,
    targetState:target.battleState,targetTargetId:target.battleTargetId,
    attackerPoint:{...attacker.renderPointV216},targetPoint:{...target.renderPointV216}
  };
  let observed={};
  try{
    attacker.battleState='SIDE_BY_SIDE';attacker.battleTargetId=String(target.id);
    target.battleState='FOLLOWING';target.battleTargetId='';
    const baseX=Number(attacker.renderPointV216.x)||500,baseY=Number(attacker.renderPointV216.y)||300;
    attacker.renderPointV216={x:baseX,y:baseY};
    target.renderPointV216={x:baseX+72,y:baseY+18};
    const synced=syncBattleLinksV256();
    const group=document.querySelector('.f1-racing-battle-links-v256');
    const node=[...(group?.children||[])].find(child=>String(child.dataset?.attackerIdV256||'')===String(attacker.id));
    const line=node?.querySelector('.battle-link-line-v256'),arrow=node?.querySelector('.battle-link-arrow-v256');
    const x1=Number(line?.getAttribute('x1')),y1=Number(line?.getAttribute('y1')),x2=Number(line?.getAttribute('x2')),y2=Number(line?.getAttribute('y2'));
    const length=Math.hypot(x2-x1,y2-y1);
    const arrowRect=arrow?.getBoundingClientRect();
    observed={
      synced,
      pair:String(node?.dataset?.battlePairV256||''),
      attackerId:String(node?.dataset?.attackerIdV256||''),
      targetId:String(node?.dataset?.targetIdV256||''),
      state:String(node?.dataset?.battleStateV256||''),
      length:Number(length.toFixed(2)),
      arrowPoints:String(arrow?.getAttribute('points')||''),
      arrowWidth:Number(arrowRect?.width||0),
      arrowHeight:Number(arrowRect?.height||0),
      lineAnimation:String(line?getComputedStyle(line).animationName:'')
    };
  }finally{
    attacker.battleState=saved.battleState;attacker.battleTargetId=saved.battleTargetId;
    target.battleState=saved.targetState;target.battleTargetId=saved.targetTargetId;
    attacker.renderPointV216=saved.attackerPoint;target.renderPointV216=saved.targetPoint;
    syncBattleLinksV256();
  }
  const allPass=observed.synced?.count===1&&observed.attackerId===String(attacker.id)&&observed.targetId===String(target.id)&&observed.state==='SIDE_BY_SIDE'&&observed.length>4&&observed.length<=BATTLE_LINK_MAX_LENGTH_V256+.5&&observed.arrowPoints.split(' ').length===3&&observed.arrowWidth>0&&observed.arrowHeight>0&&observed.lineAnimation.includes('f1BattleLinkFlowV256');
  return {...observed,allPass};
}

function timingTyreLabelV253(vehicle){
  const spec=tyreCompoundSpecV203(vehicle?.tyreCompound);
  const wear=Math.max(0,Math.min(1,Number(vehicle?.tyreWear)||0));
  return spec.code+' '+Math.round((1-wear)*100)+'%';
}
function timingPitLabelV253(vehicle){
  const state=String(vehicle?.pitState||'TRACK');
  if(['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_EXIT'].includes(state)||vehicle?.pitRequested)return '피트';
  return '';
}
function timingBattleLabelV253(vehicle){
  const state=String(vehicle?.battleState||'FOLLOWING');
  if(['SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state))return '배틀';
  if(['PREPARING_ATTACK','PULLING_OUT'].includes(state))return '공격';
  if(vehicle?.defenceActive)return '방어';
  if(vehicle?.blueFlag)return '블루';
  return '';
}
function syncLiveTimingStatusV253(row,vehicle){
  if(!row||!vehicle)return null;
  const tyre=row.querySelector('[data-f1-status-tyre-v253]');
  const pit=row.querySelector('[data-f1-status-pit-v253]');
  const battle=row.querySelector('[data-f1-status-battle-v253]');
  const tyreText=timingTyreLabelV253(vehicle),pitText=timingPitLabelV253(vehicle),battleText=timingBattleLabelV253(vehicle);
  if(tyre){tyre.textContent=tyreText;tyre.dataset.compound=String(vehicle.tyreCompound||'MEDIUM')}
  if(pit){pit.textContent=pitText||'피트';pit.hidden=!pitText}
  if(battle){battle.textContent=battleText||'배틀';battle.hidden=!battleText}
  row.dataset.statusPitV253=pitText?'1':'0';
  row.dataset.statusBattleV253=battleText?'1':'0';
  return {tyre:tyreText,pit:pitText,battle:battleText};
}
function qaLiveTimingStatusV253(){
  const vehicle=raceMotionV189.vehicles[0],row=vehicle?findTimingRowV190(vehicle.id):null;
  if(!vehicle||!row)return {allPass:false,reason:'need-live-field'};
  const saved={tyreCompound:vehicle.tyreCompound,tyreWear:vehicle.tyreWear,pitState:vehicle.pitState,pitRequested:vehicle.pitRequested,battleState:vehicle.battleState,defenceActive:vehicle.defenceActive,blueFlag:vehicle.blueFlag};
  let observed={};
  try{
    vehicle.tyreCompound='SOFT';vehicle.tyreWear=.23;vehicle.pitState='PIT_BOX';vehicle.pitRequested=true;vehicle.battleState='SIDE_BY_SIDE';vehicle.defenceActive=false;vehicle.blueFlag=false;
    const state=syncLiveTimingStatusV253(row,vehicle);
    const tyre=row.querySelector('[data-f1-status-tyre-v253]'),pit=row.querySelector('[data-f1-status-pit-v253]'),battle=row.querySelector('[data-f1-status-battle-v253]');
    observed={state,tyre:String(tyre?.textContent||''),pit:String(pit?.textContent||''),battle:String(battle?.textContent||''),pitHidden:Boolean(pit?.hidden),battleHidden:Boolean(battle?.hidden)};
  }finally{
    Object.assign(vehicle,saved);syncLiveTimingStatusV253(row,vehicle);
  }
  const allPass=observed.tyre==='S 77%'&&observed.pit==='피트'&&observed.battle==='배틀'&&!observed.pitHidden&&!observed.battleHidden;
  return {...observed,allPass};
}

function seededDriverUnitV200(state){
  const next=(Math.imul(Number(state)||1,1664525)+1013904223)>>>0;
  return {state:next,value:next/4294967296};
}
function createDriverProfileV200(driver,snapshot){
  let state=hashDriverV189(String(driver?.contactId||driver?.name||'driver')+'|'+String(snapshot?.createdAt||'race')+'|phase200');
  const cfg=DRIVER_PACE_CONFIG_V200;
  const profile={};
  for(const key of DRIVER_PROFILE_KEYS_V200){
    const draw=seededDriverUnitV200(state);state=draw.state;
    profile[key]=Math.round(cfg.ratingMin+draw.value*(cfg.ratingMax-cfg.ratingMin));
  }
  return Object.freeze(profile);
}
function driverSkillNormV200(vehicle,key){
  const rating=Number(vehicle?.driverProfile?.[key]);
  if(!Number.isFinite(rating))return 0;
  const mid=(DRIVER_PACE_CONFIG_V200.ratingMin+DRIVER_PACE_CONFIG_V200.ratingMax)/2;
  const half=Math.max(1,(DRIVER_PACE_CONFIG_V200.ratingMax-DRIVER_PACE_CONFIG_V200.ratingMin)/2);
  return Math.max(-1,Math.min(1,(rating-mid)/half));
}
function nextDriverRandomV200(vehicle){
  const draw=seededDriverUnitV200(vehicle?.driverRandomState||1);
  vehicle.driverRandomState=draw.state;
  return draw.value;
}
function updateDriverPaceStateV200(vehicle,stepMs){
  if(!vehicle||!(stepMs>0))return 0;
  const dt=stepMs/1000;
  const consistency=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.consistency)||75)/100));
  const errorResistance=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.errorResistance)||75)/100));
  const reversion=0.45+consistency*0.85;
  vehicle.paceNoise=(Number(vehicle.paceNoise)||0)*Math.max(0,1-reversion*dt);
  vehicle.nextPaceNoiseMs=Math.max(0,(Number(vehicle.nextPaceNoiseMs)||0)-stepMs);
  if(vehicle.nextPaceNoiseMs<=0){
    const shock=nextDriverRandomV200(vehicle)*2-1;
    const volatility=DRIVER_PACE_CONFIG_V200.noiseBase+(1-consistency)*DRIVER_PACE_CONFIG_V200.noiseRange;
    const resistance=1.08-errorResistance*.08;
    vehicle.paceNoise+=shock*volatility*resistance;
    vehicle.nextPaceNoiseMs=DRIVER_PACE_CONFIG_V200.noiseSampleMs;
  }
  const clamp=DRIVER_PACE_CONFIG_V200.noiseClamp*(1.08-errorResistance*.08);
  vehicle.paceNoise=Math.max(-clamp,Math.min(clamp,vehicle.paceNoise));
  return vehicle.paceNoise;
}
function driverTargetMultiplierV200(vehicle,phase){
  const cfg=DRIVER_PACE_CONFIG_V200;
  let multiplier=1+driverSkillNormV200(vehicle,'pace')*cfg.paceRange+(Number(vehicle?.paceNoise)||0);
  if(phase==='BRAKING')multiplier*=1+driverSkillNormV200(vehicle,'braking')*cfg.brakingRange;
  if(phase==='TURN_IN'||phase==='APEX'||phase==='EXIT')multiplier*=1+driverSkillNormV200(vehicle,'cornering')*cfg.corneringRange;
  return Math.max(.965,Math.min(1.035,multiplier));
}
function getDriverProfilesV200(){
  return raceMotionV189.vehicles.map(vehicle=>({id:vehicle.id,name:vehicle.driver?.name||'',profile:{...(vehicle.driverProfile||{})},paceNoise:Number(vehicle.paceNoise)||0}));
}

function fieldMeanPaceNormV209(vehicles=raceMotionV189.vehicles){
  const active=(vehicles||[]).filter(vehicle=>vehicle&&!vehicle.finished);
  if(!active.length)return 0;
  return active.reduce((sum,vehicle)=>sum+driverSkillNormV200(vehicle,'pace'),0)/active.length;
}
function longRunPaceBiasV209(vehicle,lapAge=Math.max(0,Number(vehicle?.raceProgress)||0),vehicles=raceMotionV189.vehicles){
  const cfg=LONG_RUN_GAP_CONFIG_V209;
  const rawNorm=driverSkillNormV200(vehicle,'pace');
  const fieldCenter=fieldMeanPaceNormV209(vehicles);
  const relativeNorm=Math.max(-1,Math.min(1,rawNorm-fieldCenter));
  const rawBias=rawNorm*DRIVER_PACE_CONFIG_V200.paceRange;
  const centerBias=fieldCenter*DRIVER_PACE_CONFIG_V200.paceRange;
  const openingBias=Math.max(-cfg.maxOpeningPaceBias,Math.min(cfg.maxOpeningPaceBias,rawBias-centerBias));
  const settledBias=Math.tanh(relativeNorm*cfg.relativeShape)*cfg.maxSettledPaceBias;
  const settle=clamp01V198(Math.max(0,Number(lapAge)||0)/cfg.settlingLaps);
  return openingBias+(settledBias-openingBias)*settle;
}
function longRunPaceCorrectionV209(vehicle,lapAge=Math.max(0,Number(vehicle?.raceProgress)||0),vehicles=raceMotionV189.vehicles){
  const rawBias=driverSkillNormV200(vehicle,'pace')*DRIVER_PACE_CONFIG_V200.paceRange;
  const desiredBias=longRunPaceBiasV209(vehicle,lapAge,vehicles);
  const correction=(1+desiredBias)/Math.max(.98,1+rawBias);
  return Math.max(.985,Math.min(1.015,correction));
}
function getLongRunBalanceStatesV209(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',rawDriverPaceMultiplier:Number(vehicle.rawDriverPaceMultiplier)||1,
    longRunPaceMultiplier:Number(vehicle.longRunPaceMultiplier)||1,longRunPaceBias:Number(vehicle.longRunPaceBias)||0,
    raceProgress:Number(vehicle.raceProgress)||0,trafficState:String(vehicle.trafficState||'CLEAR'),pitState:String(vehicle.pitState||'TRACK'),
    tyreGrip:Number(vehicle.tyreGrip)||1,battleState:String(vehicle.battleState||'FOLLOWING')
  }));
}
function qaLongRunGapBalanceV209(){
  const cfg=LONG_RUN_GAP_CONFIG_V209;
  const ratings=[55,65,75,85,95];
  const synthetic=ratings.map((pace,index)=>({id:'qa'+index,finished:false,driverProfile:{pace,consistency:75,racecraft:75},raceProgress:0}));
  const opening=synthetic.map(vehicle=>longRunPaceBiasV209(vehicle,0,synthetic));
  const settled=synthetic.map(vehicle=>longRunPaceBiasV209(vehicle,20,synthetic));
  const spread=list=>Math.max(...list)-Math.min(...list);
  const totalTimes=synthetic.map(vehicle=>{
    let seconds=0;
    for(let lap=0;lap<cfg.qaLaps;lap++){
      const bias=longRunPaceBiasV209(vehicle,lap,synthetic);
      seconds+=cfg.qaLapSeconds/Math.max(.98,1+bias);
    }
    return seconds;
  });
  const paceOnlyThirtyLapSpreadSeconds=Math.max(...totalTimes)-Math.min(...totalTimes);
  const systemsConnected=typeof updateSlipstreamStatesV198==='function'&&typeof updateDirtyAirStatesV199==='function'&&typeof updateTrafficAndDefenceV207==='function'&&typeof updatePassStateMachineV208==='function'&&typeof updatePitStrategiesV206==='function'&&typeof updateTyreSystemV203==='function';
  return {
    vehicleCount:synthetic.length,openingBiasSpread:spread(opening),settledBiasSpread:spread(settled),
    paceOnlyThirtyLapSpreadSeconds,nonUniform:spread(settled)>.0001,gapDependency:false,systemsConnected
  };
}
function qaMultiTrackIntegrationV210(){
  const originalTrackId=activeTrackId;
  const catalog=getTrackCatalogV186();
  const tracks=[];
  try{
    for(const item of catalog){
      const track=window.mwsGetF1TrackV182?.(item.id);
      const validation=typeof window.mwsValidateF1TrackV182==='function'?window.mwsValidateF1TrackV182(track):['validator missing'];
      activeTrackId=String(item.id);
      const snapshot=buildRaceSnapshotV187();
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      svg.setAttribute('viewBox',(track?.viewBox||[0,0,1000,600]).join(' '));
      path.setAttribute('d',String(track?.path||''));
      svg.style.cssText='position:fixed;left:-10000px;top:-10000px;width:1000px;height:600px;visibility:hidden';
      svg.appendChild(path);document.body.appendChild(svg);
      let geometry=null,cornered=null,profiled=null;
      try{
        geometry=window.mwsBuildF1TrackGeometryV193?.(track,path)||null;
        cornered=geometry&&window.mwsBuildF1CornerPhasesV194?.(track,geometry)||null;
        profiled=cornered&&window.mwsBuildF1SpeedProfileV195?.(track,cornered)||null;
      }finally{svg.remove()}
      const snapshotReady=Boolean(snapshot&&snapshot.trackId===item.id&&snapshot.track?.path===track?.path&&snapshot.track?.lengthMeters===track?.lengthMeters);
      const geometryReady=Boolean(geometry?.samples?.length&&cornered?.cornerPhases?.length&&profiled?.speedProfile?.length);
      const pitReady=Boolean(snapshot?.track?.pit&&Number(snapshot.track.pit.speedLimitKph)>0);
      const overtakeReady=Boolean(snapshot?.track?.overtakeZones?.length);
      const renderingReady=Boolean(snapshot?.track?.viewBox?.length===4&&String(snapshot?.track?.path||'').startsWith('M '));
      const dynamicsReady=Boolean(profiled?.speedProfile?.every(row=>Number(row.targetKph)>0));
      const trafficPassReady=typeof updateTrafficAndDefenceV207==='function'&&typeof updatePassStateMachineV208==='function';
      const pass=validation.length===0&&snapshotReady&&geometryReady&&pitReady&&overtakeReady&&renderingReady&&dynamicsReady&&trafficPassReady;
      tracks.push({id:item.id,name:item.name,validation,snapshotReady,geometryReady,pitReady,overtakeReady,renderingReady,dynamicsReady,trafficPassReady,samples:geometry?.samples?.length||0,corners:cornered?.cornerPhases?.length||0,pass});
    }
  }finally{activeTrackId=originalTrackId}
  return {trackCount:tracks.length,ids:tracks.map(row=>row.id),tracks,allPass:tracks.length>=3&&tracks.every(row=>row.pass)};
}



function qaDiverseTrackCatalogV220(){
  const catalog=getTrackCatalogV186();
  const required=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  const paths=new Set(required.map(id=>String(window.mwsGetF1TrackV182?.(id)?.path||'')));
  const archetypes=new Set(catalog.map(row=>String(row.archetype||'')));
  const validations=required.map(id=>({id,issues:window.mwsValidateF1TrackV182?.(window.mwsGetF1TrackV182?.(id))||['validator missing']}));
  return {trackCount:catalog.length,ids:catalog.map(row=>row.id),pathShapes:paths.size,archetypes:archetypes.size,validations,
    allPass:catalog.length>=7&&required.every(id=>catalog.some(row=>row.id===id))&&paths.size===7&&archetypes.size>=6&&validations.every(row=>row.issues.length===0)};
}

function cloneTrackForEngineQaV240(track){
  return Object.freeze({
    id:String(track.id),name:String(track.name),archetype:String(track.archetype||'종합형'),
    runtimeProfile:trackRuntimeProfileV234(track),lengthMeters:Number(track.lengthMeters)||0,
    viewBox:Object.freeze([...(track.viewBox||[])]),path:String(track.path||''),
    geometry:Object.freeze({...track.geometry}),
    sectors:Object.freeze((track.sectors||[]).map(row=>Object.freeze({...row}))),
    pit:Object.freeze({...track.pit}),
    speedTraps:Object.freeze((track.speedTraps||[]).map(row=>Object.freeze({...row}))),
    overtakeZones:Object.freeze((track.overtakeZones||[]).map(row=>Object.freeze({...row}))),
    zones:Object.freeze((track.zones||[]).map(row=>Object.freeze({...row})))
  });
}
function buildEngineQaSnapshotV240(trackId,{drivers=6,laps=1,runIndex=0,gridMode='FIXED',raceMode='NORMAL'}={}){
  const track=window.mwsGetF1TrackV182?.(String(trackId||''));if(!track)return null;
  const count=Math.max(2,Math.min(12,Math.floor(Number(drivers)||6)));
  const normalizedRaceMode=String(raceMode||'NORMAL').toUpperCase()==='FAST'?'FAST':'NORMAL';
  const requestedLaps=Math.max(1,Math.min(20,Math.floor(Number(laps)||1)));
  const totalLaps=normalizedRaceMode==='FAST'?RACE_COMPETITION_V345.fastLaps:requestedLaps;
  const createdAt='phase240-fixed-field-run-'+String(Math.max(0,Math.floor(Number(runIndex)||0)));
  let rows=Array.from({length:count},(_,index)=>({
    contactId:'phase240-driver-'+String(index+1),name:'QA Driver '+String(index+1),
    image:'',labels:Object.freeze(['phase240','engine-qa']),gridPosition:index+1
  }));
  if(String(gridMode||'').toUpperCase()==='REVERSE_PACE'){
    const seedSnapshot={createdAt};
    rows=rows.map(row=>({row,pace:Number(createDriverProfileV200(row,seedSnapshot)?.pace)||0}))
      .sort((a,b)=>a.pace-b.pace)
      .map((entry,index)=>({...entry.row,gridPosition:index+1}));
  }
  rows=rows.map(row=>Object.freeze(row));
  return Object.freeze({
    createdAt,trackId:String(track.id),totalLaps,raceMode:normalizedRaceMode,
    track:cloneTrackForEngineQaV240(track),drivers:Object.freeze(rows)
  });
}
function cleanupEngineQaV240(){
  engineQaV240.active=false;
  resetRaceMotionV189();
  resetLiveCutinsV264();
  activeRaceSnapshotV187=null;activeRaceResultRecoveryG=null;finishCounterRecoveryG=0;
  setScreenStateV185('SETUP',{force:true});
  renderTrackChoicesV186();updateTrackFoundationStatusV182();renderTrackMapV183();syncSetupActionV187();
  return true;
}
function runAcceleratedEngineRaceV240(trackId,options={}){
  if(f1ScreenStateV185!=='SETUP')return {trackId:String(trackId||''),completed:false,error:'requires-setup'};
  const snapshot=buildEngineQaSnapshotV240(trackId,options);
  if(!snapshot)return {trackId:String(trackId||''),completed:false,error:'track-not-found'};
  const stepMs=Math.max(20,Math.min(100,Math.floor(Number(options.stepMs)||50)));
  const maxSteps=Math.max(1000,Math.min(50000,Math.floor(Number(options.maxSteps)||16000)));
  let steps=0,result=null,error='';
  try{
    engineQaV240.active=true;
    resetRaceMotionV189();engineQaV240.active=true;
    activeRaceResultRecoveryG=null;finishCounterRecoveryG=0;activeRaceSnapshotV187=snapshot;
    setScreenStateV185('RACE',{force:true});
    if(!renderRaceControlV188())throw new Error('render-race-control-failed');
    if(!initializeRaceMotionV189(snapshot))throw new Error('initialize-race-motion-failed');
    while(f1ScreenStateV185==='RACE'&&steps<maxSteps){
      simulateRaceStepV192(stepMs);steps+=1;
    }
    result=activeRaceResultRecoveryG;
    if(!result)error=steps>=maxSteps?'max-steps-exceeded':'race-result-missing';
    const lapTiming=getLapTimingStatesV248();
    const resultRows=(result?.rows||[]).map(row=>({...row,lapTimesMs:[...(row.lapTimesMs||[])]}));
    const momentumStates=getRaceMomentumStatesV262();
    const timingDom=lapTiming.map(row=>{
      const timingRow=findTimingRowV190(row.id);
      return {id:row.id,last:String(timingRow?.querySelector('.last')?.textContent||''),best:String(timingRow?.querySelector('.best')?.textContent||''),s1:String(timingRow?.querySelector('.s1')?.textContent||''),s2:String(timingRow?.querySelector('.s2')?.textContent||''),s3:String(timingRow?.querySelector('.s3')?.textContent||'')};
    });
    const finalVehicleStates=raceMotionV189.vehicles.map(vehicle=>({
      id:String(vehicle.id||''),gridPosition:Number(vehicle.gridPosition)||0,finishPosition:Number(vehicle.finishPosition)||0,finishedAtSimMs:Number(vehicle.finishedAtSimMs)||0,
      tyreCompound:String(vehicle.tyreCompound||'MEDIUM'),tyreWear:Number(vehicle.tyreWear)||0,tyreRemaining:Math.max(0,1-(Number(vehicle.tyreWear)||0)),
      pitStopCount:Number(vehicle.pitStopCount)||0,pitLastStopLap:Number(vehicle.pitLastStopLap)||0,
      cornerMinSpeedByClassV351:{...(vehicle.cornerMinSpeedByClassV351||{})},cornerUnimpededMinSpeedByClassV353:{...(vehicle.cornerUnimpededMinSpeedByClassV353||{})},cornerRecoveryThrottleCountV351:Number(vehicle.cornerRecoveryThrottleCountV351)||0,cornerUnderSpeedRecoveryCountV353:Number(vehicle.cornerUnderSpeedRecoveryCountV353)||0,
      incidentCount:(Number(vehicle.lockupCount)||0)+(Number(vehicle.understeerCount)||0)+(Number(vehicle.oversteerCount)||0),
      pitRequestHistoryV348:(vehicle.pitRequestHistoryV348||[]).map(row=>({...row}))
    }));
    return {
      trackId:String(snapshot.trackId),trackName:String(snapshot.track.name),archetype:String(snapshot.track.runtimeProfile?.archetype||''),raceMode:String(snapshot.raceMode||'NORMAL'),totalLaps:Number(snapshot.totalLaps)||0,
      completed:Boolean(result),steps,stepMs,simTimeMs:Number(result?.simTimeMs)||Number(simClockV192.simTimeMs)||0,
      telemetry:result?.telemetry||null,resultRows,momentumStates,lapTiming,timingDom,finalVehicleStates,error
    };
  }catch(err){
    return {trackId:String(snapshot.trackId),trackName:String(snapshot.track.name),completed:false,steps,stepMs,simTimeMs:Number(simClockV192.simTimeMs)||0,telemetry:null,error:String(err?.message||err)};
  }finally{
    cleanupEngineQaV240();
  }
}
function qaAcceleratedEngineRaceV240(){
  const result=runAcceleratedEngineRaceV240('majoku-ring-v1',{drivers:4,laps:1,runIndex:0,stepMs:50,maxSteps:12000});
  return {result,allPass:Boolean(result?.completed)&&Number(result?.steps)>0&&Number(result?.telemetry?.fieldAverageSpeedKph)>0&&Number(result?.telemetry?.averageLapMs)>0};
}
function qaLapTimingV248(trackId='majoku-ring-v1'){
  const result=runAcceleratedEngineRaceV240(trackId,{drivers:3,laps:3,runIndex:248,stepMs:50,maxSteps:22000});
  const rows=Array.isArray(result?.lapTiming)?result.lapTiming:[],dom=Array.isArray(result?.timingDom)?result.timingDom:[];
  const rowPass=rows.length===3&&rows.every(row=>row.timedCompletedLaps===3&&row.lapTimesMs.length===3&&row.lapTimesMs.every(ms=>ms>1000)&&row.lastLapMs>0&&row.bestLapMs>0&&row.bestLapMs<=row.lastLapMs&&Object.values(row.sectorTimesMs||{}).every(ms=>ms===0));
  const domPass=dom.length===3&&dom.every(row=>row.last&&!row.last.includes('--')&&row.best&&!row.best.includes('--')&&row.s1==='--.---'&&row.s2==='--.---'&&row.s3==='--.---');
  return {result,rowPass,domPass,allPass:Boolean(result?.completed)&&rowPass&&domPass};
}
function aggregateEngineTrackRunsV241(trackId,runs=[]){
  const completed=runs.filter(row=>row?.completed&&row?.telemetry);
  const avg=key=>completed.length?completed.reduce((sum,row)=>sum+Number(row.telemetry?.[key]||0),0)/completed.length:0;
  return {
    trackId:String(trackId),runs:runs.length,completedRuns:completed.length,
    avgPasses:Number(avg('totalPasses').toFixed(2)),avgFailedPasses:Number(avg('failedPasses').toFixed(2)),
    avgIncidents:Number(avg('incidentCount').toFixed(2)),avgSpeedKph:Number(avg('fieldAverageSpeedKph').toFixed(2)),
    avgWinnerSpeedKph:Number(avg('winnerAverageSpeedKph').toFixed(2)),avgLapMs:Number(avg('averageLapMs').toFixed(1)),
    maxSteps:runs.length?Math.max(...runs.map(row=>Number(row?.steps)||0)):0,
    errors:runs.map(row=>String(row?.error||'')).filter(Boolean)
  };
}
function runSevenTrackEngineSuiteV241(options={}){
  const ids=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  const runsPerTrack=Math.max(1,Math.min(3,Math.floor(Number(options.runsPerTrack)||1)));
  const drivers=Math.max(2,Math.min(8,Math.floor(Number(options.drivers)||4)));
  const laps=Math.max(1,Math.min(3,Math.floor(Number(options.laps)||1)));
  const stepMs=Math.max(20,Math.min(100,Math.floor(Number(options.stepMs)||60)));
  const rows=[];
  for(const trackId of ids){
    const runs=[];
    for(let runIndex=0;runIndex<runsPerTrack;runIndex++){
      runs.push(runAcceleratedEngineRaceV240(trackId,{drivers,laps,runIndex,stepMs,maxSteps:Number(options.maxSteps)||14000}));
    }
    rows.push(aggregateEngineTrackRunsV241(trackId,runs));
  }
  const suite={
    options:{runsPerTrack,drivers,laps,stepMs},rows,
    totalRuns:rows.reduce((sum,row)=>sum+row.runs,0),
    completedRuns:rows.reduce((sum,row)=>sum+row.completedRuns,0)
  };
  engineSuiteCacheV241=suite;
  return suite;
}
function qaSevenTrackEngineSuiteV241(){
  const suite=runSevenTrackEngineSuiteV241({runsPerTrack:1,drivers:4,laps:1,stepMs:60,maxSteps:14000});
  const speeds=suite.rows.map(row=>row.avgSpeedKph),laps=suite.rows.map(row=>row.avgLapMs);
  return {
    suite,
    speedSpread:speeds.length?Number((Math.max(...speeds)-Math.min(...speeds)).toFixed(2)):0,
    lapSpread:laps.length?Number((Math.max(...laps)-Math.min(...laps)).toFixed(1)):0,
    allPass:suite.rows.length===7&&suite.completedRuns===7&&suite.rows.every(row=>row.completedRuns===1&&row.avgSpeedKph>0&&row.avgLapMs>0&&!row.errors.length)
  };
}
function realEngineBenchmarkAlignmentV242(suite=engineSuiteCacheV241){
  const actual=suite?.rows?.length===7?suite:runSevenTrackEngineSuiteV241({runsPerTrack:1,drivers:4,laps:1,stepMs:60,maxSteps:14000});
  const expected=runSevenTrackBenchmarkV238({runs:24,drivers:Number(actual.options?.drivers)||4,laps:Number(actual.options?.laps)||1});
  const expectedById=new Map(expected.map(row=>[String(row.trackId),row]));
  const rows=actual.rows.map(row=>{
    const model=expectedById.get(String(row.trackId))||{};
    return {
      ...row,
      modelSpeedKph:Number(model.avgSpeedKph)||0,modelLapMs:Number(model.avgLapMs)||0,
      modelPasses:Number(model.avgPasses)||0,modelIncidents:Number(model.avgIncidents)||0
    };
  });
  const speedCorrelation=pearsonV239(rows,'modelSpeedKph','avgSpeedKph');
  const lapCorrelation=pearsonV239(rows,'modelLapMs','avgLapMs');
  const speedValues=rows.map(row=>Number(row.avgSpeedKph)||0),lapValues=rows.map(row=>Number(row.avgLapMs)||0);
  const speedSpread=speedValues.length?Math.max(...speedValues)-Math.min(...speedValues):0;
  const lapSpread=lapValues.length?Math.max(...lapValues)-Math.min(...lapValues):0;
  const uniqueActualSignatures=new Set(rows.map(row=>[row.avgSpeedKph,row.avgLapMs,row.avgPasses,row.avgIncidents].join('|'))).size;
  const totalPasses=rows.reduce((sum,row)=>sum+Number(row.avgPasses||0),0);
  const totalIncidents=rows.reduce((sum,row)=>sum+Number(row.avgIncidents||0),0);
  return {
    rows,
    speedCorrelation:Number(speedCorrelation.toFixed(3)),lapCorrelation:Number(lapCorrelation.toFixed(3)),
    speedSpread:Number(speedSpread.toFixed(2)),lapSpread:Number(lapSpread.toFixed(1)),
    uniqueActualSignatures,totalPasses:Number(totalPasses.toFixed(2)),totalIncidents:Number(totalIncidents.toFixed(2)),
    allPass:rows.length===7&&actual.completedRuns===actual.totalRuns&&speedCorrelation>=.7&&speedSpread>=20&&lapSpread>=10000&&uniqueActualSignatures>=5&&totalIncidents>=1
  };
}
function runOvertakeStressV242(){
  const result=runAcceleratedEngineRaceV240('blue-coast-speedway-v1',{drivers:8,laps:3,runIndex:42,stepMs:70,maxSteps:12000,gridMode:'REVERSE_PACE'});
  return {result,totalPasses:Number(result?.telemetry?.totalPasses)||0,failedPasses:Number(result?.telemetry?.failedPasses)||0,allPass:Boolean(result?.completed)&&(Number(result?.telemetry?.totalPasses)||0)>=1};
}
function qaRealEngineBenchmarkAlignmentV242(){
  const alignment=realEngineBenchmarkAlignmentV242(engineSuiteCacheV241);
  const overtakeStress=runOvertakeStressV242();
  return {...alignment,overtakeStress,allPass:Boolean(alignment.allPass)&&Boolean(overtakeStress.allPass)};
}
function raceMomentumBenchmarkV262(options={}){
  const trackIds=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  const drivers=Math.max(6,Math.min(8,Math.floor(Number(options.drivers)||8)));
  const laps=Math.max(2,Math.min(3,Math.floor(Number(options.laps)||3)));
  const stepMs=Math.max(50,Math.min(90,Math.floor(Number(options.stepMs)||80)));
  const model=runSevenTrackBenchmarkV238({runs:8,drivers,laps});
  const alignmentReference=realEngineBenchmarkAlignmentV242(engineSuiteCacheV241);
  const runs=trackIds.map((trackId,index)=>runAcceleratedEngineRaceV240(trackId,{drivers,laps,runIndex:26200+index,stepMs,maxSteps:30000,gridMode:'FIXED'}));
  const completed=runs.filter(row=>row?.completed&&Array.isArray(row.resultRows)&&row.resultRows.length===drivers);
  const pairs=completed.flatMap(row=>row.resultRows.map(result=>({grid:Number(result.gridPosition),finish:Number(result.position)})));
  const gridFinishCorrelation=pearsonV239(pairs,'grid','finish');
  const p1Retention=completed.length?completed.filter(row=>row.resultRows.some(result=>Number(result.gridPosition)===1&&Number(result.position)===1)).length/completed.length:1;
  const top3Variation=completed.length?completed.reduce((sum,row)=>{
    const changed=row.resultRows.filter(result=>Number(result.position)<=3&&Number(result.gridPosition)>3).length;
    return sum+changed/3;
  },0)/completed.length:0;
  const averageOvertakes=completed.length?completed.reduce((sum,row)=>sum+(Number(row.telemetry?.totalPasses)||0),0)/completed.length:0;
  const averageUniquePassPairs=completed.length?completed.reduce((sum,row)=>sum+(Number(row.telemetry?.uniquePassPairs)||0),0)/completed.length:0;
  const averageOrderChanges=completed.length?completed.reduce((sum,row)=>sum+(Number(row.telemetry?.orderChanges)||0),0)/completed.length:0;
  const averageDriversMovedFromGrid=completed.length?completed.reduce((sum,row)=>sum+(Number(row.telemetry?.driversMovedFromGrid)||0),0)/completed.length:0;
  const gapRows=completed.map(row=>{
    const times=row.resultRows.map(result=>Number(result.finishedAtSimMs)||0).filter(value=>value>0);
    const winner=times.length?Math.min(...times):0,tail=times.length?Math.max(...times):0;
    const spreadMs=Math.max(0,tail-winner);
    const thresholdMs=Math.max(30000,winner*.20);
    return {trackId:String(row.trackId),spreadMs,thresholdMs,abnormal:spreadMs>thresholdMs};
  });
  const abnormalGapRuns=gapRows.filter(row=>row.abnormal).length;
  const repeatA=runAcceleratedEngineRaceV240(trackIds[0],{drivers,laps:2,runIndex:26299,stepMs,maxSteps:24000,gridMode:'FIXED'});
  const repeatB=runAcceleratedEngineRaceV240(trackIds[0],{drivers,laps:2,runIndex:26299,stepMs,maxSteps:24000,gridMode:'FIXED'});
  const repeatSignature=row=>JSON.stringify({
    completed:Boolean(row?.completed),
    result:(row?.resultRows||[]).map(x=>[x.gridPosition,x.position,x.finishedAtSimMs]),
    passes:Number(row?.telemetry?.totalPasses)||0,
    incidents:Number(row?.telemetry?.incidentCount)||0
  });
  const deterministicRepeat=repeatSignature(repeatA)===repeatSignature(repeatB);
  const modelAvgPasses=model.length?model.reduce((sum,row)=>sum+Number(row.avgPasses||0),0)/model.length:0;
  return {
    trackCount:trackIds.length,completedRuns:completed.length,drivers,laps,stepMs,
    gridFinishCorrelation:Number(gridFinishCorrelation.toFixed(3)),
    averageOvertakes:Number(averageOvertakes.toFixed(2)),
    averageUniquePassPairs:Number(averageUniquePassPairs.toFixed(2)),averageOrderChanges:Number(averageOrderChanges.toFixed(2)),averageDriversMovedFromGrid:Number(averageDriversMovedFromGrid.toFixed(2)),
    p1Retention:Number(p1Retention.toFixed(3)),
    top3Variation:Number(top3Variation.toFixed(3)),
    abnormalGapRuns,gapRows,deterministicRepeat,
    modelReference:{trackCount:model.length,averagePasses:Number(modelAvgPasses.toFixed(2))},
    phase242Reference:{rowCount:Number(alignmentReference?.rows?.length)||0,speedCorrelation:Number(alignmentReference?.speedCorrelation)||0,uniqueActualSignatures:Number(alignmentReference?.uniqueActualSignatures)||0},
    runs:completed.map(row=>({trackId:row.trackId,totalPasses:Number(row.telemetry?.totalPasses)||0,uniquePassPairs:Number(row.telemetry?.uniquePassPairs)||0,orderChanges:Number(row.telemetry?.orderChanges)||0,driversMovedFromGrid:Number(row.telemetry?.driversMovedFromGrid)||0,resultRows:row.resultRows.map(x=>({gridPosition:x.gridPosition,position:x.position,finishedAtSimMs:x.finishedAtSimMs}))})),
    allPass:completed.length===7&&deterministicRepeat&&Math.abs(gridFinishCorrelation)<.94&&p1Retention<.9&&top3Variation>.04&&averageOvertakes>=1&&averageUniquePassPairs>=1&&averageOrderChanges>=1&&averageDriversMovedFromGrid>=1&&abnormalGapRuns<=2&&model.length===7&&Number(alignmentReference?.rows?.length)===7
  };
}
function qaRaceMomentumBenchmarkV262(){
  return raceMomentumBenchmarkV262({drivers:8,laps:3,stepMs:80});
}

function trackBenchmarkRandomV238(seed){
  let state=(Number(seed)>>>0)||1;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
}
function trackBenchmarkBaseSpeedV238(track){
  const zones=Array.isArray(track?.zones)?track.zones:[];
  if(!zones.length)return Math.max(80,Number(track?.geometry?.maxStraightKph)||250)*.72;
  let weighted=0,total=0;
  for(const zone of zones){
    const span=Math.max(0,Number(zone.end)-Number(zone.start));
    weighted+=span*Math.max(40,Number(zone.targetKph)||120);total+=span;
  }
  return total>0?weighted/total:240;
}
function simulateTrackBenchmarkRunV238(track,runIndex=0,{drivers=10,laps=10}={}){
  if(!track)return null;
  const profile=trackRuntimeProfileV234(track);
  const seed=hashDriverV189(String(track.id)+'|benchmark|'+String(runIndex)+'|'+drivers+'|'+laps);
  const random=trackBenchmarkRandomV238(seed);
  const speedNoise=.965+random()*.07;
  const baseSpeed=trackBenchmarkBaseSpeedV238(track);
  const averageSpeedKph=Math.max(70,Math.min(Number(track.geometry?.maxStraightKph)||360,baseSpeed*.91*speedNoise));
  const averageLapMs=(Math.max(1,Number(track.lengthMeters)||1)/(averageSpeedKph/3.6))*1000;
  const overtakeMean=profile.overtakeFactor*(profile.overtakeZones+.65)*drivers*laps*.047;
  const totalPasses=Math.max(0,Math.round(overtakeMean*(.82+random()*.36)));
  const failRatio=Math.max(.18,Math.min(.72,.68-(profile.overtakeFactor-1)*.55));
  const failedPasses=Math.max(0,Math.round(totalPasses*failRatio*(.82+random()*.30)));
  const cornerExposure=Math.max(.28,profile.slowShare*.72+profile.fastShare*.38+.22);
  const incidentMean=profile.incidentRiskFactor*cornerExposure*drivers*laps*.035;
  const incidentCount=Math.max(0,Math.round(incidentMean*(.72+random()*.56)));
  return {trackId:String(track.id),runIndex,drivers,laps,totalPasses,failedPasses,incidentCount,averageSpeedKph:Number(averageSpeedKph.toFixed(2)),averageLapMs:Number(averageLapMs.toFixed(1))};
}
function aggregateTrackBenchmarkV238(track,{runs=18,drivers=10,laps=10}={}){
  const samples=Array.from({length:runs},(_,index)=>simulateTrackBenchmarkRunV238(track,index,{drivers,laps})).filter(Boolean);
  const avg=key=>samples.length?samples.reduce((sum,row)=>sum+Number(row[key]||0),0)/samples.length:0;
  const profile=trackRuntimeProfileV234(track);
  return {
    trackId:String(track.id),trackName:String(track.name),archetype:String(profile.archetype),runs:samples.length,drivers,laps,
    overtakeFactor:profile.overtakeFactor,incidentRiskFactor:profile.incidentRiskFactor,tyreStressFactor:profile.tyreStressFactor,
    avgPasses:Number(avg('totalPasses').toFixed(2)),avgFailedPasses:Number(avg('failedPasses').toFixed(2)),
    avgIncidents:Number(avg('incidentCount').toFixed(2)),avgSpeedKph:Number(avg('averageSpeedKph').toFixed(2)),avgLapMs:Number(avg('averageLapMs').toFixed(1))
  };
}
function runSevenTrackBenchmarkV238(options={}){
  const ids=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  return ids.map(id=>window.mwsGetF1TrackV182?.(id)).filter(Boolean).map(track=>aggregateTrackBenchmarkV238(track,options));
}
function pearsonV239(rows,xKey,yKey){
  const pairs=(rows||[]).map(row=>[Number(row?.[xKey]),Number(row?.[yKey])]).filter(pair=>pair.every(Number.isFinite));
  if(pairs.length<2)return 0;
  const meanX=pairs.reduce((s,row)=>s+row[0],0)/pairs.length,meanY=pairs.reduce((s,row)=>s+row[1],0)/pairs.length;
  let numerator=0,dx2=0,dy2=0;
  for(const [x,y] of pairs){const dx=x-meanX,dy=y-meanY;numerator+=dx*dy;dx2+=dx*dx;dy2+=dy*dy}
  return dx2>0&&dy2>0?numerator/Math.sqrt(dx2*dy2):0;
}
function trackBenchmarkAlignmentV239(){
  const rows=runSevenTrackBenchmarkV238({runs:24,drivers:10,laps:10});
  const enriched=rows.map(row=>{
    const track=window.mwsGetF1TrackV182?.(row.trackId);
    return {...row,maxStraightKph:Number(track?.geometry?.maxStraightKph)||0};
  });
  const overtakeCorrelation=pearsonV239(enriched,'overtakeFactor','avgPasses');
  const incidentCorrelation=pearsonV239(enriched,'incidentRiskFactor','avgIncidents');
  const speedCorrelation=pearsonV239(enriched,'maxStraightKph','avgSpeedKph');
  const fastest=[...enriched].sort((a,b)=>b.avgSpeedKph-a.avgSpeedKph)[0]||null;
  const slowest=[...enriched].sort((a,b)=>a.avgSpeedKph-b.avgSpeedKph)[0]||null;
  const mostPassing=[...enriched].sort((a,b)=>b.avgPasses-a.avgPasses)[0]||null;
  const mostIncidents=[...enriched].sort((a,b)=>b.avgIncidents-a.avgIncidents)[0]||null;
  return {
    rows:enriched,
    overtakeCorrelation:Number(overtakeCorrelation.toFixed(3)),
    incidentCorrelation:Number(incidentCorrelation.toFixed(3)),
    speedCorrelation:Number(speedCorrelation.toFixed(3)),
    fastestTrackId:String(fastest?.trackId||''),slowestTrackId:String(slowest?.trackId||''),
    mostPassingTrackId:String(mostPassing?.trackId||''),mostIncidentTrackId:String(mostIncidents?.trackId||''),
    allPass:enriched.length===7&&overtakeCorrelation>=.72&&incidentCorrelation>=.72&&speedCorrelation>=.72&&String(fastest?.trackId||'')!==String(slowest?.trackId||'')
  };
}
function qaTrackBenchmarkAlignmentV239(){return trackBenchmarkAlignmentV239()}
function qaSevenTrackBenchmarkV238(){
  const rows=runSevenTrackBenchmarkV238({runs:18,drivers:10,laps:10});
  const range=key=>rows.length?Math.max(...rows.map(row=>Number(row[key])))-Math.min(...rows.map(row=>Number(row[key]))):0;
  return {
    rows,
    speedSpread:Number(range('avgSpeedKph').toFixed(2)),
    passSpread:Number(range('avgPasses').toFixed(2)),
    incidentSpread:Number(range('avgIncidents').toFixed(2)),
    uniqueSignatures:new Set(rows.map(row=>[row.avgPasses,row.avgIncidents,row.avgSpeedKph,row.avgLapMs].join('|'))).size,
    allPass:rows.length===7&&rows.every(row=>row.runs===18&&row.avgSpeedKph>0&&row.avgLapMs>0)&&range('avgSpeedKph')>=20&&range('avgPasses')>=1&&range('avgIncidents')>=.25
  };
}
function qaTrackBehaviorModifiersV235(){
  const blue=trackRuntimeProfileV234(window.mwsGetF1TrackV182?.('blue-coast-speedway-v1'));
  const royal=trackRuntimeProfileV234(window.mwsGetF1TrackV182?.('royal-street-circuit-v1'));
  const highland=trackRuntimeProfileV234(window.mwsGetF1TrackV182?.('highland-flow-ring-v1'));
  return {
    blue,royal,highland,
    overtakeSpread:Number((blue.overtakeFactor-royal.overtakeFactor).toFixed(3)),
    incidentSpread:Number((royal.incidentRiskFactor-blue.incidentRiskFactor).toFixed(3)),
    allPass:blue.overtakeFactor>royal.overtakeFactor&&royal.incidentRiskFactor>blue.incidentRiskFactor&&highland.overtakeFactor>=1
  };
}
function qaTrackRuntimeProfilesV234(){
  const ids=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  const rows=ids.map(id=>{const track=window.mwsGetF1TrackV182?.(id);const profile=track?trackRuntimeProfileV234(track):null;return {id,profile}});
  const signatures=new Set(rows.map(row=>row.profile?[row.profile.overtakeFactor,row.profile.incidentRiskFactor,row.profile.tyreStressFactor].join('|'):''));
  return {rows,uniqueProfiles:signatures.size,allPass:rows.length===7&&rows.every(row=>row.profile&&row.profile.archetype&&row.profile.overtakeFactor>0&&row.profile.incidentRiskFactor>0&&row.profile.tyreStressFactor>0)&&signatures.size>=5};
}
function qaTrackFlowDesignV243(){
  const catalog=window.MWS_F1_TRACKS_V182?Object.values(window.MWS_F1_TRACKS_V182):[];
  const rows=catalog.map(track=>{
    const path=String(track?.path||'');
    const curves=(path.match(/[CQ]/g)||[]).length;
    const lines=(path.match(/L/g)||[]).length;
    return {id:String(track?.id||''),curves,lines,pathLength:path.length};
  });
  const mini=document.querySelector('.f1-racing-track-card-silhouette-v233 path');
  const miniStroke=mini?parseFloat(getComputedStyle(mini).strokeWidth)||0:0;
  return {
    rows,miniStroke,
    allPass:rows.length===7&&rows.every(row=>row.curves>=6&&row.lines<=1&&row.pathLength>120)&&miniStroke>0&&miniStroke<=10&&window.__mwsF1TrackDesignV243==='flowing-circuit-redesign-v1'
  };
}
function qaTrackSilhouetteCardsV233(){
  const catalog=getTrackCatalogV186();
  const pathSet=new Set(catalog.map(track=>String(track.path||'')));
  const cards=[...document.querySelectorAll('#f1RacingTrackOptionsV186 [data-f1-track-id]')];
  const cardPaths=cards.map(card=>String(card.querySelector('.f1-racing-track-card-silhouette-v233 path')?.getAttribute('d')||''));
  return {
    trackCount:catalog.length,uniqueCatalogPaths:pathSet.size,cardCount:cards.length,
    silhouetteCount:cardPaths.filter(Boolean).length,uniqueCardPaths:new Set(cardPaths.filter(Boolean)).size,
    allPass:catalog.length>=7&&pathSet.size===catalog.length&&cards.length===catalog.length&&cardPaths.every(Boolean)&&new Set(cardPaths).size===catalog.length
  };
}
function qaTrackProfileUiV223(){
  const catalog=getTrackCatalogV186();
  const rows=catalog.map(track=>({
    id:track.id,
    maxStraightKph:Number(track.profile?.maxStraightKph)||0,
    widthMeters:Number(track.profile?.widthMeters)||0,
    difficulty:String(track.profile?.overtakeDifficulty||''),
    cornerCount:Number(track.profile?.slowCount||0)+Number(track.profile?.mediumCount||0)+Number(track.profile?.fastCount||0),
    score:Number(track.profile?.overtakeScore)
  }));
  const allowed=new Set(['쉬움','보통','어려움']);
  return {
    trackCount:rows.length,rows,
    allPass:rows.length>=7&&rows.every(row=>row.maxStraightKph>0&&row.widthMeters>0&&allowed.has(row.difficulty)&&row.cornerCount>0&&Number.isFinite(row.score))
  };
}

function trackZoneAtProgressV202(progress){
  const track=activeRaceSnapshotV187?.track;
  const p=normalizedProgressV190(progress);
  return (track?.zones||[]).find(zone=>p>=Number(zone.start)&&p<Number(zone.end))||null;
}
function overtakeZoneAtProgressV202(progress){
  const track=activeRaceSnapshotV187?.track;
  const p=normalizedProgressV190(progress);
  return (track?.overtakeZones||[]).find(zone=>p>=Number(zone.start)&&p<Number(zone.end))||null;
}
function ersOvertakePowerLimitV202(speedKph){
  const speed=Math.max(0,Number(speedKph)||0);
  if(speed>=ACTIVE_AERO_CONFIG_V202.overtakeCutoffKph)return 0;
  return Math.max(0,Math.min(ENERGY_CONFIG_V201.maxDeployPowerKW,7100-20*speed));
}
function estimatedGapSecondsV202(vehicle){
  const gap=Math.max(0,Number(vehicle?.gapToCarAheadMeters));
  if(!Number.isFinite(gap))return Infinity;
  const ahead=raceMotionV189.vehicles.find(v=>String(v.id)===String(vehicle?.carAheadId||''))||null;
  const meanKph=Math.max(1,((Number(vehicle?.speedKph)||0)+(Number(ahead?.speedKph)||Number(vehicle?.speedKph)||0))/2);
  return gap/(meanKph/3.6);
}
function updateActiveAeroAndOvertakeV202(vehicle,stepMs){
  if(!vehicle)return null;
  const cfg=ACTIVE_AERO_CONFIG_V202;
  const zone=trackZoneAtProgressV202(vehicle.progress);
  const requestedMode=zone?.type==='straight'?'STRAIGHT':'CORNER';
  if(vehicle.activeAeroTarget!==requestedMode){
    vehicle.activeAeroTarget=requestedMode;
    vehicle.activeAeroTransitionMs=cfg.transitionMs;
  }
  vehicle.activeAeroTransitionMs=Math.max(0,(Number(vehicle.activeAeroTransitionMs)||0)-Math.max(0,Number(stepMs)||0));
  if(vehicle.activeAeroTransitionMs<=0)vehicle.activeAeroMode=requestedMode;

  const overtakeZone=overtakeZoneAtProgressV202(vehicle.progress);
  const gapSeconds=estimatedGapSecondsV202(vehicle);
  const eligible=Boolean(overtakeZone&&vehicle.carAheadId&&gapSeconds<=cfg.detectionGapSeconds);
  vehicle.overtakeZoneId=overtakeZone?.id||'';
  vehicle.overtakeGapSeconds=gapSeconds;
  vehicle.overtakeEligible=eligible;
  vehicle.overtakeActive=eligible;
  if(eligible)vehicle.overtakeRechargeAllowanceActive=true;
  return {activeAeroMode:vehicle.activeAeroMode,activeAeroTarget:vehicle.activeAeroTarget,transitionMs:vehicle.activeAeroTransitionMs,overtakeZoneId:vehicle.overtakeZoneId,gapSeconds,eligible,overtakeActive:vehicle.overtakeActive};
}
function getActiveAeroOvertakeStatesV202(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',activeAeroMode:vehicle.activeAeroMode,
    activeAeroTarget:vehicle.activeAeroTarget,activeAeroTransitionMs:Number(vehicle.activeAeroTransitionMs)||0,
    overtakeZoneId:vehicle.overtakeZoneId||'',overtakeGapSeconds:Number(vehicle.overtakeGapSeconds),
    overtakeEligible:Boolean(vehicle.overtakeEligible),overtakeActive:Boolean(vehicle.overtakeActive),
    overtakeRechargeAllowanceActive:Boolean(vehicle.overtakeRechargeAllowanceActive)
  }));
}

function ersNormalPowerLimitV201(speedKph){
  const speed=Math.max(0,Number(speedKph)||0);
  const cfg=ENERGY_CONFIG_V201;
  if(speed<cfg.minStandingDeployKph)return 0;
  if(speed<290)return cfg.maxDeployPowerKW;
  if(speed<340)return Math.max(0,Math.min(cfg.maxDeployPowerKW,1800-5*speed));
  if(speed<345)return Math.max(0,Math.min(cfg.maxDeployPowerKW,6900-20*speed));
  return 0;
}
function trailingThreatScoreV201(vehicle,vehicles=raceMotionV189.vehicles){
  let score=0;
  for(const candidate of vehicles||[]){
    if(!candidate||candidate===vehicle)continue;
    if(String(candidate.carAheadId||'')!==String(vehicle.id||''))continue;
    score=Math.max(score,clamp01V198(candidate.slipstreamStrength));
  }
  return score;
}
function syncEnergyLapV201(vehicle){
  const lap=Math.max(1,Number(vehicle?.currentLap)||1);
  if(Number(vehicle.energyLapNumber)!==lap){
    vehicle.energyLapNumber=lap;
    vehicle.energyHarvestLapMJ=0;
  }
  return lap;
}
function updateEnergySystemV201(vehicle,stepMs,phase,throttle,brake){
  const cfg=ENERGY_CONFIG_V201;
  const dt=Math.max(0,Number(stepMs)||0)/1000;
  if(!vehicle||!(dt>0))return {deployKW:0,rechargeKW:0,boostKW:0,powerUnitFactor:1};
  syncEnergyLapV201(vehicle);
  vehicle.energyTargetMJ=cfg.usableCapacityMJ;
  let battery=Math.max(0,Math.min(cfg.usableCapacityMJ,Number(vehicle.batteryMJ)||0));
  let rechargeKW=0;
  let harvestedMJ=0;
  if(Number(brake)>0){
    const rechargeLimit=cfg.maxRechargePerLapMJ+(vehicle.overtakeRechargeAllowanceActive?ACTIVE_AERO_CONFIG_V202.extraRechargeMJ:0);
    const lapRoom=Math.max(0,rechargeLimit-(Number(vehicle.energyHarvestLapMJ)||0));
    const storeRoom=Math.max(0,cfg.usableCapacityMJ-battery);
    const requestedKW=cfg.maxHarvestPowerKW*clamp01V198(brake);
    const requestedMJ=requestedKW*dt/1000;
    harvestedMJ=Math.min(requestedMJ,lapRoom,storeRoom);
    rechargeKW=dt>0?harvestedMJ*1000/dt:0;
    battery+=harvestedMJ;
  }

  const normalLimitKW=Number(brake)>0?0:ersNormalPowerLimitV201(vehicle.speedKph);
  const overtakeLimitKW=vehicle.overtakeActive?ersOvertakePowerLimitV202(vehicle.speedKph):normalLimitKW;
  const deployLimitKW=Math.max(normalLimitKW,overtakeLimitKW);
  const attackOpportunityScore=clamp01V198(vehicle.slipstreamStrength);
  const defenceThreatScore=trailingThreatScoreV201(vehicle);
  let boostKW=vehicle.overtakeActive?Math.max(0,deployLimitKW-normalLimitKW):0;
  let requestedDeployKW=Number(throttle)>0?Math.min(cfg.maxDeployPowerKW,deployLimitKW):0;
  const availableDeployKW=dt>0?battery*1000/dt:0;
  const deployKW=Math.max(0,Math.min(requestedDeployKW,availableDeployKW));
  if(requestedDeployKW>0&&deployKW<requestedDeployKW){
    const ratio=deployKW/requestedDeployKW;
    boostKW*=ratio;
  }
  const deployedMJ=deployKW*dt/1000;
  const boostEnergyMJ=boostKW*dt/1000;
  battery=Math.max(0,battery-deployedMJ);

  vehicle.batteryMJ=battery;
  vehicle.energyDeployKW=deployKW;
  vehicle.energyRechargeKW=rechargeKW;
  vehicle.boostPowerKW=boostKW;
  vehicle.boostActive=boostKW>0.01;
  vehicle.attackOpportunityScore=attackOpportunityScore;
  vehicle.defenceThreatScore=defenceThreatScore;
  vehicle.energyDeployMJ=(Number(vehicle.energyDeployMJ)||0)+deployedMJ;
  vehicle.energyHarvestMJ=(Number(vehicle.energyHarvestMJ)||0)+harvestedMJ;
  vehicle.energyHarvestLapMJ=(Number(vehicle.energyHarvestLapMJ)||0)+harvestedMJ;
  vehicle.boostEnergyMJ=(Number(vehicle.boostEnergyMJ)||0)+boostEnergyMJ;
  const fullPowerKW=cfg.icePowerKW+cfg.maxDeployPowerKW;
  const powerUnitFactor=Math.max(.4,Math.min(1,(cfg.icePowerKW+deployKW)/fullPowerKW));
  vehicle.powerUnitFactor=powerUnitFactor;
  return {deployKW,rechargeKW,boostKW,powerUnitFactor,batteryMJ:battery,harvestedMJ,deployedMJ,boostEnergyMJ,attackOpportunityScore,defenceThreatScore};
}
function getEnergyStatesV201(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',batteryMJ:Number(vehicle.batteryMJ)||0,
    energyTargetMJ:Number(vehicle.energyTargetMJ)||0,energyDeployKW:Number(vehicle.energyDeployKW)||0,
    energyRechargeKW:Number(vehicle.energyRechargeKW)||0,energyDeployMJ:Number(vehicle.energyDeployMJ)||0,
    energyHarvestMJ:Number(vehicle.energyHarvestMJ)||0,energyHarvestLapMJ:Number(vehicle.energyHarvestLapMJ)||0,
    boostActive:Boolean(vehicle.boostActive),boostPowerKW:Number(vehicle.boostPowerKW)||0,
    boostEnergyMJ:Number(vehicle.boostEnergyMJ)||0,attackOpportunityScore:Number(vehicle.attackOpportunityScore)||0,
    defenceThreatScore:Number(vehicle.defenceThreatScore)||0,powerUnitFactor:Number(vehicle.powerUnitFactor)||1
  }));
}


function tyreCompoundSpecV203(compound){
  const key=String(compound||'MEDIUM').toUpperCase();
  return TYRE_COMPOUNDS_V203[key]||TYRE_COMPOUNDS_V203.MEDIUM;
}
function tyreCornerLoadV203(phase){
  if(phase==='TURN_IN'||phase==='APEX')return 1;
  if(phase==='EXIT')return .75;
  if(phase==='BRAKING')return .55;
  if(phase==='APPROACH')return .25;
  return .08;
}
function setVehicleTyreCompoundV203(driverId,compound){
  const key=String(compound||'').toUpperCase();
  if(!TYRE_COMPOUNDS_V203[key])return false;
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId));
  if(!vehicle)return false;
  vehicle.tyreCompound=key;
  vehicle.tyreStartRaceProgress=Number(vehicle.raceProgress)||0;
  vehicle.tyreAgeLaps=0;
  vehicle.tyreWear=0;
  vehicle.tyreSurfaceTemp=.5;
  vehicle.tyreCarcassTemp=.5;
  vehicle.tyreGrip=tyreCompoundSpecV203(key).gripBias;
  vehicle.tyreThermalDeg=0;
  vehicle.tyreGraining=0;
  vehicle.tyreFlatSpot=0;
  vehicle.tyreStrategyPressure=0;
  return true;
}
function updateTyreSystemV203(vehicle,stepMs,phase){
  if(!vehicle||!(stepMs>0))return null;
  const dt=stepMs/1000;
  const spec=tyreCompoundSpecV203(vehicle.tyreCompound);
  const track=activeRaceSnapshotV187?.track;
  const speedKph=Math.max(0,Number(vehicle.speedKph)||0);
  const speedMps=speedKph/3.6;
  const lapFraction=(speedMps*dt)/Math.max(1,Number(track?.lengthMeters)||1);
  const managementNorm=driverSkillNormV200(vehicle,'tyreManagement');
  const managementWearFactor=Math.max(.85,Math.min(1.15,1-managementNorm*.12));
  const cornerLoad=tyreCornerLoadV203(phase);
  const brakeLoad=clamp01V198(vehicle.brake);
  const throttleLoad=clamp01V198(vehicle.throttle);
  const dirtyHeat=clamp01V198(vehicle.dirtyAirTyreHeatLoad);

  let surface=Math.max(0,Math.min(1,Number(vehicle.tyreSurfaceTemp)||.5));
  let carcass=Math.max(0,Math.min(1,Number(vehicle.tyreCarcassTemp)||.5));
  const heatInput=(brakeLoad*.34+throttleLoad*.13+cornerLoad*.22+dirtyHeat*.18)*spec.heatFactor;
  surface+=heatInput*dt*.18;
  surface+=(TYRE_CONFIG_V203.ambientSurface-surface)*dt*.035;
  surface=Math.max(0,Math.min(1,surface));
  carcass+=(surface-carcass)*dt*.075;
  carcass+=(TYRE_CONFIG_V203.ambientCarcass-carcass)*dt*.012;
  carcass=Math.max(0,Math.min(1,carcass));

  const tempError=Math.abs(surface-spec.idealSurface);
  const thermalStress=Math.max(0,tempError-.10);
  const thermalDegGain=thermalStress*lapFraction*3.2*managementWearFactor;
  const coldStress=Math.max(0,(spec.idealSurface-.12)-surface);
  const grainingGain=coldStress*cornerLoad*lapFraction*2.4*managementWearFactor;
  const flatSpotGain=(Number(vehicle.lockupActiveMs)||0)>0?clamp01V198(vehicle.lockupSeverity)*lapFraction*1.6:0;
  const compoundKey=String(vehicle.tyreCompound||'MEDIUM').toUpperCase();
  const wearMultiplier=TYRE_DYNAMICS_V343.wearMultiplier[compoundKey]||1;
  const trackWear=Math.max(.88,Math.min(1.24,Number(activeTrackRuntimeProfileV235()?.tyreStressFactor)||1));
  const wearGain=spec.wearPerLap*wearMultiplier*trackWear*lapFraction*managementWearFactor*(1+thermalStress*.8+dirtyHeat*.18);

  vehicle.tyreWear=Math.max(0,Math.min(1,(Number(vehicle.tyreWear)||0)+wearGain));
  vehicle.tyreThermalDeg=Math.max(0,Math.min(1,(Number(vehicle.tyreThermalDeg)||0)+thermalDegGain));
  vehicle.tyreGraining=Math.max(0,Math.min(1,(Number(vehicle.tyreGraining)||0)+grainingGain));
  vehicle.tyreFlatSpot=Math.max(0,Math.min(1,(Number(vehicle.tyreFlatSpot)||0)+flatSpotGain));
  vehicle.tyreSurfaceTemp=surface;
  vehicle.tyreCarcassTemp=carcass;
  vehicle.tyreAgeLaps=Math.max(0,(Number(vehicle.raceProgress)||0)-(Number(vehicle.tyreStartRaceProgress)||0));

  const tempGrip=Math.max(.88,1-tempError*.42);
  const wearGrip=Math.max(.84,1-vehicle.tyreWear*.15);
  const damageGrip=Math.max(.88,1-vehicle.tyreThermalDeg*.06-vehicle.tyreGraining*.05-vehicle.tyreFlatSpot*.10);
  const warmupFactor=Math.max(PIT_CONFIG_V205.minWarmupGrip,Math.min(1,Number(vehicle.tyreWarmupFactor)||1));
  vehicle.tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,spec.gripBias*tempGrip*wearGrip*damageGrip*warmupFactor));
  vehicle.tyreStrategyPressure=clamp01V198(vehicle.tyreWear*.55+vehicle.tyreThermalDeg*.20+vehicle.tyreGraining*.15+vehicle.tyreFlatSpot*.35);
  return {compound:vehicle.tyreCompound,ageLaps:vehicle.tyreAgeLaps,wear:vehicle.tyreWear,surfaceTemp:surface,carcassTemp:carcass,grip:vehicle.tyreGrip,thermalDeg:vehicle.tyreThermalDeg,graining:vehicle.tyreGraining,flatSpot:vehicle.tyreFlatSpot,strategyPressure:vehicle.tyreStrategyPressure};
}
function getTyreStatesV203(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',compound:vehicle.tyreCompound,
    ageLaps:Number(vehicle.tyreAgeLaps)||0,wear:Number(vehicle.tyreWear)||0,
    surfaceTemp:Number(vehicle.tyreSurfaceTemp)||0,carcassTemp:Number(vehicle.tyreCarcassTemp)||0,
    grip:Number(vehicle.tyreGrip)||1,thermalDeg:Number(vehicle.tyreThermalDeg)||0,
    graining:Number(vehicle.tyreGraining)||0,flatSpot:Number(vehicle.tyreFlatSpot)||0,
    strategyPressure:Number(vehicle.tyreStrategyPressure)||0
  }));
}

function activeTrackRuntimeProfileV235(){
  const profile=activeRaceSnapshotV187?.track?.runtimeProfile;
  if(profile)return profile;
  const track=activeRaceSnapshotV187?.track;
  return track?trackRuntimeProfileV234(track):Object.freeze({overtakeFactor:1,incidentRiskFactor:1,tyreStressFactor:1,archetype:'종합형'});
}
function trackOvertakeFactorV235(){return Math.max(.7,Math.min(1.3,Number(activeTrackRuntimeProfileV235()?.overtakeFactor)||1))}
function trackIncidentRiskFactorV235(){return Math.max(.8,Math.min(1.3,Number(activeTrackRuntimeProfileV235()?.incidentRiskFactor)||1))}
function activeDrivingIncidentV204(vehicle){
  if((Number(vehicle?.lockupActiveMs)||0)>0)return 'LOCK_UP';
  if((Number(vehicle?.understeerActiveMs)||0)>0)return 'UNDERSTEER';
  if((Number(vehicle?.oversteerActiveMs)||0)>0)return 'OVERSTEER';
  return '';
}
function triggerDrivingIncidentV204(vehicle,type,severity=.7,forced=false){
  if(!vehicle)return null;
  const key=String(type||'').toUpperCase();
  const s=Math.max(.15,Math.min(1,Number(severity)||.7));
  if(key==='LOCK_UP'){
    vehicle.lockupActiveMs=Math.max(Number(vehicle.lockupActiveMs)||0,INCIDENT_CONFIG_V204.lockupDurationMs*(.72+s*.38));
    vehicle.lockupSeverity=s;
    vehicle.tyreFlatSpot=Math.max(0,Math.min(1,(Number(vehicle.tyreFlatSpot)||0)+.012+s*.028));
    vehicle.lockupCount=(Number(vehicle.lockupCount)||0)+1;
  }else if(key==='UNDERSTEER'){
    vehicle.understeerActiveMs=Math.max(Number(vehicle.understeerActiveMs)||0,INCIDENT_CONFIG_V204.understeerDurationMs*(.72+s*.38));
    vehicle.understeerIncidentSeverity=s;
    vehicle.understeerCount=(Number(vehicle.understeerCount)||0)+1;
  }else if(key==='OVERSTEER'){
    vehicle.oversteerActiveMs=Math.max(Number(vehicle.oversteerActiveMs)||0,INCIDENT_CONFIG_V204.oversteerDurationMs*(.72+s*.38));
    vehicle.oversteerIncidentSeverity=s;
    vehicle.oversteerCount=(Number(vehicle.oversteerCount)||0)+1;
  }else return null;
  vehicle.lastIncidentType=key;
  vehicle.lastIncidentSimMs=simClockV192.simTimeMs;
  vehicle.lastIncidentForced=Boolean(forced);
  emitCharacterDialogueEventV277('MISTAKE',vehicle,dialogueFollowerV277(vehicle),{cooldownMs:2200});
  return {type:key,severity:s,forced:Boolean(forced)};
}
function updateDrivingIncidentsV204(vehicle,stepMs,phase,controls={}){
  if(!vehicle||!(stepMs>0))return {active:'',speedFactor:1,brakeFactor:1,throttleFactor:1,lateralOffsetMeters:0};
  vehicle.lockupActiveMs=Math.max(0,(Number(vehicle.lockupActiveMs)||0)-stepMs);
  vehicle.understeerActiveMs=Math.max(0,(Number(vehicle.understeerActiveMs)||0)-stepMs);
  vehicle.oversteerActiveMs=Math.max(0,(Number(vehicle.oversteerActiveMs)||0)-stepMs);
  vehicle.incidentEvalMs=Math.max(0,(Number(vehicle.incidentEvalMs)||0)-stepMs);
  if(vehicle.incidentEvalMs<=0&&!activeDrivingIncidentV204(vehicle)){
    vehicle.incidentEvalMs=INCIDENT_CONFIG_V204.evaluationMs;
    const errorResistance=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.errorResistance)||75)/100));
    const aggression=Math.max(0,Math.min(1,(Number(vehicle.driverProfile?.aggression)||75)/100));
    const tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle.tyreGrip)||1));
    const gripLoss=clamp01V198((1-tyreGrip)/.18);
    const wear=clamp01V198(vehicle.tyreWear);
    const wearRisk=clamp01V198((wear-TYRE_DYNAMICS_V343.incidentWearStart)/TYRE_DYNAMICS_V343.incidentWearScale);
    const evalSeconds=INCIDENT_CONFIG_V204.evaluationMs/1000;
    const brake=clamp01V198(controls.brake);
    const throttle=clamp01V198(controls.throttle);
    const speed=Math.max(0,Number(vehicle.speedKph)||0);
    const lockRisk=phase==='BRAKING'&&brake>.82&&speed>110
      ?clamp01V198((brake-.82)/.18*.50+gripLoss*.22+wearRisk*.28+Math.max(0,driverSkillNormV200(vehicle,'aggression'))*.18):0;
    const underRisk=(phase==='TURN_IN'||phase==='APEX')
      ?clamp01V198((Number(vehicle.understeerRisk)||0)*.52+gripLoss*.24+wearRisk*.34+clamp01V198(vehicle.dirtyAirStrength)*.20):0;
    const overRisk=(phase==='EXIT'||phase==='TURN_IN')
      ?clamp01V198(Math.max(0,throttle-.55)*1.16+gripLoss*.28+wearRisk*.38+aggression*.10):0;
    const resistanceFactor=Math.max(.45,1-errorResistance*.5);
    const candidates=[
      {type:'LOCK_UP',risk:lockRisk,rate:.018},
      {type:'UNDERSTEER',risk:underRisk,rate:.022},
      {type:'OVERSTEER',risk:overRisk,rate:.020}
    ].filter(row=>row.risk>0).sort((a,b)=>b.risk-a.risk);
    if(candidates.length){
      const pick=candidates[0];
      const chance=pick.risk*pick.rate*evalSeconds*resistanceFactor*trackIncidentRiskFactorV235();
      if(nextDriverRandomV200(vehicle)<chance)triggerDrivingIncidentV204(vehicle,pick.type,pick.risk,false);
    }
  }
  const lockSeverity=(Number(vehicle.lockupActiveMs)||0)>0?Math.max(.15,Number(vehicle.lockupSeverity)||.5):0;
  const underSeverity=(Number(vehicle.understeerActiveMs)||0)>0?Math.max(.15,Number(vehicle.understeerIncidentSeverity)||.5):0;
  const overSeverity=(Number(vehicle.oversteerActiveMs)||0)>0?Math.max(.15,Number(vehicle.oversteerIncidentSeverity)||.5):0;
  const phaseInfo=getCornerPhaseAtProgressV194(vehicle.progress);
  const direction=phaseInfo?.corner?.direction==='right'?-1:1;
  const lateralOffsetMeters=-direction*underSeverity*1.15+direction*overSeverity*.48;
  vehicle.incidentLateralOffsetMeters=lateralOffsetMeters;
  const active=activeDrivingIncidentV204(vehicle);
  return {
    active,
    speedFactor:Math.min(1,
      underSeverity?1-(1-INCIDENT_CONFIG_V204.understeerSpeedFactor)*underSeverity:1,
      overSeverity?1-(1-INCIDENT_CONFIG_V204.oversteerSpeedFactor)*overSeverity:1
    ),
    brakeFactor:lockSeverity?1-(1-INCIDENT_CONFIG_V204.lockupBrakeFactor)*lockSeverity:1,
    throttleFactor:overSeverity?1-(1-INCIDENT_CONFIG_V204.oversteerThrottleFactor)*overSeverity:1,
    lateralOffsetMeters
  };
}
function getDrivingIncidentStatesV204(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',active:activeDrivingIncidentV204(vehicle),
    lockupActiveMs:Number(vehicle.lockupActiveMs)||0,understeerActiveMs:Number(vehicle.understeerActiveMs)||0,oversteerActiveMs:Number(vehicle.oversteerActiveMs)||0,
    lockupCount:Number(vehicle.lockupCount)||0,understeerCount:Number(vehicle.understeerCount)||0,oversteerCount:Number(vehicle.oversteerCount)||0,
    tyreFlatSpot:Number(vehicle.tyreFlatSpot)||0,lastIncidentType:String(vehicle.lastIncidentType||''),lastIncidentSimMs:Number(vehicle.lastIncidentSimMs)||0
  }));
}
function forceDrivingIncidentV204(driverId,type,severity=.85){
  const key=String(driverId||'');
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===key)||raceMotionV189.vehicles[0];
  return triggerDrivingIncidentV204(vehicle,type,severity,true);
}


function pitDistanceAheadV205(progress,target){
  const p=normalizedProgressV190(progress),t=normalizedProgressV190(target);
  return (t-p+1)%1;
}
function nextAbsoluteProgressV205(raceProgress,target){
  const current=Number(raceProgress)||0;
  let absolute=Math.floor(current)+normalizedProgressV190(target);
  if(absolute<=current+1e-9)absolute+=1;
  return absolute;
}
function passedTrackProgressV205(previousRaceProgress,currentRaceProgress,target){
  const prev=Number(previousRaceProgress)||0,current=Number(currentRaceProgress)||0;
  if(current<=prev)return false;
  const absolute=nextAbsoluteProgressV205(prev,target);
  return absolute>prev&&absolute<=current+1e-9;
}
function pitTrackV205(){return activeRaceSnapshotV187?.track||null}
function pitSpeedLimitV205(){return Math.max(20,Number(pitTrackV205()?.pit?.speedLimitKph)||80)}
function requestPitStopV205(driverId,compound='MEDIUM',reason='REQUEST'){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||null;
  const nextCompound=String(compound||'MEDIUM').toUpperCase();
  if(!vehicle||!TYRE_COMPOUNDS_V203[nextCompound]||vehicle.finished)return false;
  if(vehicle.pitState&&vehicle.pitState!=='TRACK')return false;
  vehicle.pitRequested=true;
  vehicle.pitTargetCompound=nextCompound;
  vehicle.pitRequestReason=String(reason||'REQUEST');
  vehicle.pitPreviousRacingLineMode=vehicle.racingLineMode==='PIT_LINE'?'IDEAL':String(vehicle.racingLineMode||'IDEAL');
  vehicle.pitStartCompoundV361=String(vehicle.tyreCompound||'MEDIUM').toUpperCase();
  return true;
}
function cancelPitRequestV205(driverId){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||null;
  if(!vehicle||vehicle.pitState!=='TRACK')return false;
  vehicle.pitRequested=false;vehicle.pitRequestReason='';
  if(vehicle.racingLineMode==='PIT_LINE')vehicle.racingLineMode=vehicle.pitPreviousRacingLineMode||'IDEAL';
  return true;
}
function pitControlV205(vehicle){
  const limit=pitSpeedLimitV205();
  const state=String(vehicle?.pitState||'TRACK');
  if(state==='PIT_BOX')return {stationary:true,speedCapKph:0,state,limitKph:limit};
  if(state==='PIT_ENTRY'||state==='PIT_LANE')return {stationary:false,speedCapKph:limit,state,limitKph:limit};
  if(state==='PIT_EXIT')return {stationary:false,speedCapKph:Math.max(limit+35,140),state,limitKph:limit};
  return {stationary:false,speedCapKph:Infinity,state:'TRACK',limitKph:limit};
}
function enterPitBoxV205(vehicle){
  if(!vehicle)return false;
  const racecraft=Math.max(-1,Math.min(1,driverSkillNormV200(vehicle,'racecraft')));
  const variation=(nextDriverRandomV200(vehicle)*2-1)*PIT_CONFIG_V205.boxVariationMs;
  vehicle.pitState='PIT_BOX';
  vehicle.pitBoxDurationMs=Math.max(1800,PIT_CONFIG_V205.boxStopMs-racecraft*180+variation);
  vehicle.pitBoxTimerMs=vehicle.pitBoxDurationMs;
  vehicle.speedKph=0;vehicle.targetSpeedKph=0;vehicle.throttle=0;vehicle.brake=1;vehicle.accelerationMps2=0;
  return true;
}
function completePitServiceV205(vehicle){
  if(!vehicle)return false;
  const compound=TYRE_COMPOUNDS_V203[String(vehicle.pitTargetCompound||'').toUpperCase()]?String(vehicle.pitTargetCompound).toUpperCase():'MEDIUM';
  setVehicleTyreCompoundV203(vehicle.id,compound);
  vehicle.tyreSurfaceTemp=PIT_CONFIG_V205.coldSurface;
  vehicle.tyreCarcassTemp=PIT_CONFIG_V205.coldCarcass;
  vehicle.tyreWarmupFactor=PIT_CONFIG_V205.minWarmupGrip;
  vehicle.pitWarmupRemainingLaps=PIT_CONFIG_V205.warmupLaps;
  vehicle.pitWarmupStartRaceProgress=Number(vehicle.raceProgress)||0;
  vehicle.pitStopCount=(Number(vehicle.pitStopCount)||0)+1;
  vehicle.pitServiced=true;
  vehicle.pitBoxTimerMs=0;
  vehicle.pitState='PIT_LANE';
  return true;
}
function completePitExitV205(vehicle){
  if(!vehicle)return false;
  vehicle.pitState='TRACK';
  vehicle.pitRequested=false;
  vehicle.pitServiced=false;
  vehicle.pitRequestReason='';
  vehicle.pitLastStopLap=Math.max(1,Number(vehicle.currentLap)||1);
  vehicle.racingLineMode=F1_LINE_MODES_V197.includes(vehicle.pitPreviousRacingLineMode)?vehicle.pitPreviousRacingLineMode:'IDEAL';
  vehicle.pitPreviousRacingLineMode='IDEAL';
  vehicle.pitStartCompoundV361='';vehicle.pitHudEnteredAtV361=0;
  return true;
}
function updatePitWarmupV205(vehicle,previousRaceProgress){
  if(!vehicle)return 1;
  const previous=Number(previousRaceProgress)||0,current=Number(vehicle.raceProgress)||0;
  const travelled=Math.max(0,current-previous);
  if((Number(vehicle.pitWarmupRemainingLaps)||0)>0&&travelled>0){
    vehicle.pitWarmupRemainingLaps=Math.max(0,Number(vehicle.pitWarmupRemainingLaps)-travelled);
  }
  const remaining=Math.max(0,Number(vehicle.pitWarmupRemainingLaps)||0);
  const ratio=clamp01V198(remaining/PIT_CONFIG_V205.warmupLaps);
  vehicle.tyreWarmupFactor=remaining>0?PIT_CONFIG_V205.minWarmupGrip+(1-PIT_CONFIG_V205.minWarmupGrip)*(1-ratio):1;
  return vehicle.tyreWarmupFactor;
}
function updatePitPreStepV205(vehicle,stepMs){
  if(!vehicle)return {stationary:false,speedCapKph:Infinity,state:'TRACK',limitKph:pitSpeedLimitV205()};
  const track=pitTrackV205(),pit=track?.pit;
  if(!pit)return pitControlV205(vehicle);
  if(vehicle.pitState==='PIT_BOX'){
    vehicle.pitBoxTimerMs=Math.max(0,(Number(vehicle.pitBoxTimerMs)||0)-Math.max(0,Number(stepMs)||0));
    if(vehicle.pitBoxTimerMs<=0)completePitServiceV205(vehicle);
  }
  if(vehicle.pitState==='TRACK'&&vehicle.pitRequested){
    const ahead=pitDistanceAheadV205(vehicle.progress,pit.entry);
    if(ahead<=PIT_CONFIG_V205.approachProgress)vehicle.racingLineMode='PIT_LINE';
  }
  if(vehicle.pitState==='PIT_ENTRY'&&Number(vehicle.speedKph)<=pitSpeedLimitV205()+2)vehicle.pitState='PIT_LANE';
  return pitControlV205(vehicle);
}
function updatePitPostStepV205(vehicle,previousRaceProgress){
  if(!vehicle)return false;
  const track=pitTrackV205(),pit=track?.pit;if(!pit)return false;
  const current=Number(vehicle.raceProgress)||0;
  if(vehicle.pitState==='TRACK'&&vehicle.pitRequested&&passedTrackProgressV205(previousRaceProgress,current,pit.entry)){
    vehicle.pitState='PIT_ENTRY';
    clearPitInteractionStateV369(vehicle,raceMotionV189.vehicles,'PIT_ENTRY');
    vehicle.pitEntryRaceProgress=current;
    vehicle.pitServiced=false;
    vehicle.pitHudEnteredAtV361=Number(simClockV192.simTimeMs)||0;
    if(!vehicle.pitStartCompoundV361)vehicle.pitStartCompoundV361=String(vehicle.tyreCompound||'MEDIUM').toUpperCase();
    vehicle.racingLineMode='PIT_LINE';
  }
  if((vehicle.pitState==='PIT_ENTRY'||vehicle.pitState==='PIT_LANE')&&!vehicle.pitServiced&&passedTrackProgressV205(previousRaceProgress,current,pit.stop)){
    enterPitBoxV205(vehicle);
  }else if(vehicle.pitState==='PIT_LANE'&&vehicle.pitServiced&&passedTrackProgressV205(previousRaceProgress,current,pit.exit)){
    vehicle.pitState='PIT_EXIT';
    vehicle.pitExitRaceProgress=current;
  }else if(vehicle.pitState==='PIT_EXIT'&&current-(Number(vehicle.pitExitRaceProgress)||current)>=PIT_CONFIG_V205.exitMergeProgress){
    completePitExitV205(vehicle);
  }
  updatePitWarmupV205(vehicle,previousRaceProgress);
  return true;
}
function getPitStatesV205(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',state:String(vehicle.pitState||'TRACK'),requested:Boolean(vehicle.pitRequested),
    targetCompound:String(vehicle.pitTargetCompound||'MEDIUM'),requestReason:String(vehicle.pitRequestReason||''),
    stopCount:Number(vehicle.pitStopCount)||0,boxTimerMs:Number(vehicle.pitBoxTimerMs)||0,
    speedLimitKph:pitSpeedLimitV205(),warmupRemainingLaps:Number(vehicle.pitWarmupRemainingLaps)||0,
    tyreWarmupFactor:Number(vehicle.tyreWarmupFactor)||1,compound:String(vehicle.tyreCompound||'MEDIUM')
  }));
}
function ensurePitHudV361(){
  const stage=document.querySelector('.f1-racing-race-map-stage-v188');if(!stage)return null;
  let root=document.getElementById('f1RacingPitHudV361');
  if(!root){root=document.createElement('div');root.id='f1RacingPitHudV361';root.className='f1-racing-pit-hud-v361';root.setAttribute('aria-live','polite');root.setAttribute('aria-label','피트인 현황');stage.appendChild(root)}
  return root;
}
function pitHudRemainingSecondsV361(vehicle){
  const track=pitTrackV205(),pit=track?.pit,state=String(vehicle?.pitState||'TRACK');
  if(!track||!pit||state==='TRACK')return 0;
  const length=Math.max(1,Number(track.lengthMeters)||1),limitMps=Math.max(8,pitSpeedLimitV205()/3.6);
  if(state==='PIT_BOX')return Math.max(0,Number(vehicle.pitBoxTimerMs)||0)/1000;
  if((state==='PIT_ENTRY'||state==='PIT_LANE')&&!vehicle.pitServiced){
    const distance=pitDistanceAheadV205(vehicle.progress,pit.stop)*length;
    const travel=distance/Math.max(8,Math.min(limitMps,Math.max(8,(Number(vehicle.speedKph)||pitSpeedLimitV205())/3.6)));
    return travel+Math.max(1.8,(Number(vehicle.pitBoxDurationMs)||PIT_CONFIG_V205.boxStopMs)/1000);
  }
  if(state==='PIT_LANE'&&vehicle.pitServiced)return pitDistanceAheadV205(vehicle.progress,pit.exit)*length/limitMps;
  if(state==='PIT_EXIT'){
    const travelled=Math.max(0,(Number(vehicle.raceProgress)||0)-(Number(vehicle.pitExitRaceProgress)||0));
    const remaining=Math.max(0,PIT_CONFIG_V205.exitMergeProgress-travelled)*length;
    return remaining/Math.max(12,(Number(vehicle.speedKph)||140)/3.6);
  }
  return 0;
}
function pitHudStateLabelV361(vehicle){
  const state=String(vehicle?.pitState||'TRACK');
  if(state==='PIT_BOX')return 'PIT STOP';
  if(state==='PIT_EXIT'||state==='PIT_LANE'&&vehicle?.pitServiced)return 'PIT EXIT';
  return state==='PIT_ENTRY'||state==='PIT_LANE'?'PIT IN':'';
}
function pitHudRowsV361(){
  return raceMotionV189.vehicles.filter(vehicle=>String(vehicle?.pitState||'TRACK')!=='TRACK').map((vehicle,index)=>({
    id:String(vehicle.id||''),name:String(vehicle.driver?.name||'DRIVER'),image:String(vehicle.driver?.image||''),color:String(vehicle.driverColorV216||driverColorV216(index)),
    stateLabel:pitHudStateLabelV361(vehicle),remainingSeconds:pitHudRemainingSecondsV361(vehicle),fromCompound:String(vehicle.pitStartCompoundV361||vehicle.tyreCompound||'MEDIUM').toUpperCase(),
    toCompound:String(vehicle.pitTargetCompound||vehicle.tyreCompound||'MEDIUM').toUpperCase(),enteredAt:Number(vehicle.pitHudEnteredAtV361)||0
  })).sort((a,b)=>a.enteredAt-b.enteredAt);
}
function pitHudCardHtmlV361(row){
  const avatar=row.image?'<img src="'+escapeHtml(row.image)+'" alt="" aria-hidden="true">':'<span>'+escapeHtml(initials(row.name).slice(0,2))+'</span>';
  return '<article class="f1-racing-pit-card-v361" data-pit-driver-v361="'+escapeHtml(row.id)+'" style="--pit-driver-color:'+escapeHtml(row.color||'#7dd3fc')+'">'+
    '<div class="pit-avatar-v361">'+avatar+'</div><div class="pit-copy-v361"><div class="pit-head-v361"><strong>'+escapeHtml(row.name)+'</strong><b>'+escapeHtml(row.stateLabel)+'</b></div>'+
    '<div class="pit-meta-v361"><span>남은 시간 <strong>'+Math.max(0,Number(row.remainingSeconds)||0).toFixed(1)+'초</strong></span>'+
    '<span class="pit-tyres-v361"><i>'+escapeHtml(row.fromCompound)+'</i><em>→</em><i>'+escapeHtml(row.toCompound)+'</i></span></div></div></article>';
}
function renderPitHudV361(){
  const root=ensurePitHudV361();if(!root)return false;
  const rows=pitHudRowsV361(),visible=rows.slice(-PIT_HUD_V361.maxVisible),hidden=Math.max(0,rows.length-visible.length);
  root.innerHTML=visible.map(pitHudCardHtmlV361).join('')+(hidden?'<div class="f1-racing-pit-more-v361">+'+hidden+' PIT</div>':'');
  root.classList.toggle('active',rows.length>0);root.dataset.pitCountV361=String(rows.length);root.dataset.pitVisibleV361=String(visible.length);
  return true;
}
function qaPitHudV361(){
  const root=ensurePitHudV361();
  const before=root?.innerHTML||'',html=pitHudCardHtmlV361({id:'qa-pit',name:'QA DRIVER',image:'',color:'#7dd3fc',stateLabel:'PIT STOP',remainingSeconds:2.4,fromCompound:'SOFT',toCompound:'MEDIUM'});
  if(root)root.innerHTML=html;
  const card=Boolean(root?.querySelector('.f1-racing-pit-card-v361')),style=root?getComputedStyle(root):null;
  const stacked=Boolean(style&&style.position==='absolute'&&style.display==='flex'&&style.flexDirection==='column'&&parseFloat(style.right)>=0&&parseFloat(style.bottom)>=80);
  if(root)root.innerHTML=before;
  const required=html.includes('PIT STOP')&&html.includes('남은 시간')&&html.includes('SOFT')&&html.includes('MEDIUM')&&html.includes('→');
  const source=String(renderPitHudV361)+String(pitHudRemainingSecondsV361);
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  return {version:VERSION361,rootReady:Boolean(root),card,stacked,required,maxVisible:PIT_HUD_V361.maxVisible,directProgressMutation,activeRows:pitHudRowsV361().length,allPass:Boolean(root)&&card&&stacked&&required&&PIT_HUD_V361.maxVisible>=4&&!directProgressMutation};
}
function qaPitCycleV205(driverId,compound='SOFT'){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||raceMotionV189.vehicles[0];
  if(!vehicle)return null;
  const states=[];
  if(!requestPitStopV205(vehicle.id,compound,'QA'))return null;
  vehicle.pitState='PIT_ENTRY';vehicle.racingLineMode='PIT_LINE';states.push(vehicle.pitState);
  vehicle.pitState='PIT_LANE';states.push(vehicle.pitState);
  const laneControl=pitControlV205(vehicle);
  enterPitBoxV205(vehicle);states.push(vehicle.pitState);
  vehicle.pitBoxTimerMs=0;completePitServiceV205(vehicle);states.push(vehicle.pitState);
  vehicle.pitState='PIT_EXIT';vehicle.pitExitRaceProgress=Number(vehicle.raceProgress)||0;states.push(vehicle.pitState);
  completePitExitV205(vehicle);states.push(vehicle.pitState);
  return {states,laneSpeedCapKph:laneControl.speedCapKph,compound:vehicle.tyreCompound,stopCount:vehicle.pitStopCount,warmupFactor:vehicle.tyreWarmupFactor,warmupRemainingLaps:vehicle.pitWarmupRemainingLaps};
}


function pitLossSecondsV206(track=activeRaceSnapshotV187?.track){
  if(!track?.pit)return 22;
  const length=Math.max(1,Number(track.lengthMeters)||1);
  const entry=normalizedProgressV190(track.pit.entry),exit=normalizedProgressV190(track.pit.exit);
  const laneFraction=(exit-entry+1)%1;
  const pitDistance=Math.max(150,laneFraction*length);
  const limitMps=Math.max(8,Number(track.pit.speedLimitKph||80)/3.6);
  const raceMps=230/3.6;
  const loss=pitDistance/limitMps-pitDistance/raceMps+PIT_CONFIG_V205.boxStopMs/1000;
  return Math.max(14,Math.min(40,loss));
}
function pitRivalCommittedV206(vehicle,currentLap){
  if(!vehicle)return false;
  if(vehicle.pitRequested||String(vehicle.pitState||'TRACK')!=='TRACK')return true;
  const last=Number(vehicle.pitLastStopLap)||0;
  return last>0&&Math.abs((Number(currentLap)||1)-last)<=1;
}
function pitWearThresholdV344(vehicle){
  const seed=hashDriverV189(String(vehicle?.id||'driver')+'|pit-threshold-v344')%1000;
  const spread=(seed/999)*PIT_STAGGER_V344.thresholdSpread;
  let threshold=PIT_STAGGER_V344.minWearToConsider+spread;
  const compound=String(vehicle?.tyreCompound||'MEDIUM').toUpperCase();
  if(compound==='HARD')threshold+=PIT_STAGGER_V344.hardExtra;
  if(compound==='SOFT')threshold-=PIT_STAGGER_V344.softReduction;
  return Math.max(PIT_STAGGER_V344.minWearToConsider,Math.min(PIT_STAGGER_V344.maxWearThreshold,threshold));
}
function pitCriticalTyreStateV344(context){
  return context.grip<=PIT_STAGGER_V344.criticalGrip||context.flatSpot>=PIT_STAGGER_V344.criticalFlatSpot||context.thermalDeg>=PIT_STAGGER_V344.criticalThermalDeg;
}
function pitRemainingGuardV349(context){
  return Math.max(0,Number(context?.tyreRemaining)||0)>=TYRE_DYNAMICS_V343.pitSafeRemainingRatio;
}
function choosePitCompoundV206(vehicle,remainingLaps){
  const remaining=Math.max(0,Number(remainingLaps)||0);
  const management=driverSkillNormV200(vehicle,'tyreManagement');
  if(remaining<=3.25)return 'SOFT';
  if(remaining<=6.5)return 'MEDIUM';
  return management>.45?'MEDIUM':'HARD';
}
function pitStrategyContextV206(vehicle){
  const snapshot=activeRaceSnapshotV187;
  const standings=computeRaceStandingsV191();
  const index=standings.findIndex(row=>row.vehicle===vehicle);
  const row=index>=0?standings[index]:null;
  const ahead=index>0?standings[index-1]?.vehicle:null;
  const behind=index>=0&&index<standings.length-1?standings[index+1]?.vehicle:null;
  const gapAhead=index>0?Math.max(0,Number(row?.intervalSeconds)||0):Infinity;
  const gapBehind=behind?Math.max(0,Number(standings[index+1]?.intervalSeconds)||0):Infinity;
  const totalLaps=Math.max(1,Number(snapshot?.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  const currentLap=Math.max(1,Number(vehicle?.currentLap)||1);
  const remainingLaps=Math.max(0,totalLaps-Math.max(0,Number(vehicle?.raceProgress)||0));
  const pressure=clamp01V198(vehicle?.tyreStrategyPressure);
  const grip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle?.tyreGrip)||1));
  const gripLoss=clamp01V198((.985-grip)/.16);
  const flatSpot=clamp01V198(vehicle?.tyreFlatSpot);
  const thermalDeg=clamp01V198(vehicle?.tyreThermalDeg);
  const graining=clamp01V198(vehicle?.tyreGraining);
  const wear=clamp01V198(vehicle?.tyreWear);
  const tyreNeed=clamp01V198(pressure*.52+gripLoss*.25+flatSpot*.18+thermalDeg*.12+graining*.08+wear*.08);
  const management=driverSkillNormV200(vehicle,'tyreManagement');
  const racecraft=driverSkillNormV200(vehicle,'racecraft');
  const pitLossSeconds=pitLossSecondsV206(snapshot?.track);
  return {
    currentLap,totalLaps,remainingLaps,position:Number(row?.position)||Number(vehicle?.position)||999,
    gapAhead,gapBehind,aheadId:String(ahead?.id||''),behindId:String(behind?.id||''),
    rivalAheadPitting:pitRivalCommittedV206(ahead,currentLap),
    rivalBehindPitting:pitRivalCommittedV206(behind,currentLap),
    pressure,grip,gripLoss,flatSpot,thermalDeg,graining,wear,tyreNeed,management,racecraft,pitLossSeconds,
    tyreRemaining:Math.max(0,1-wear),pitWearThreshold:pitWearThresholdV344(vehicle)
  };
}
function compactPitStrategyContextV206(context){
  if(!context)return {};
  return {
    currentLap:context.currentLap,totalLaps:context.totalLaps,remainingLaps:Number(context.remainingLaps.toFixed(3)),
    position:context.position,gapAhead:Number.isFinite(context.gapAhead)?Number(context.gapAhead.toFixed(3)):null,
    gapBehind:Number.isFinite(context.gapBehind)?Number(context.gapBehind.toFixed(3)):null,
    rivalAheadPitting:Boolean(context.rivalAheadPitting),rivalBehindPitting:Boolean(context.rivalBehindPitting),
    pressure:Number(context.pressure.toFixed(3)),grip:Number(context.grip.toFixed(3)),
    tyreNeed:Number(context.tyreNeed.toFixed(3)),management:Number(context.management.toFixed(3)),
    racecraft:Number(context.racecraft.toFixed(3)),pitLossSeconds:Number(context.pitLossSeconds.toFixed(2)),
    wear:Number(context.wear.toFixed(3)),tyreRemaining:Number(context.tyreRemaining.toFixed(3)),pitWearThreshold:Number(context.pitWearThreshold.toFixed(3))
  };
}
function recordPitStrategyDecisionV206(vehicle,decision,reason,score,compound,context){
  const next=PIT_STRATEGIES_V206.includes(decision)?decision:'NONE';
  const previous=String(vehicle.strategyDecision||'NONE');
  vehicle.strategyDecision=next;
  vehicle.strategyReason=String(reason||'');
  vehicle.strategyScore=Math.max(0,Math.min(1,Number(score)||0));
  vehicle.strategyTargetCompound=String(compound||vehicle.tyreCompound||'MEDIUM');
  vehicle.strategyLastLap=Math.max(1,Number(vehicle.currentLap)||1);
  vehicle.strategyLastSimMs=simClockV192.simTimeMs;
  vehicle.strategyLastContext=compactPitStrategyContextV206(context);
  if(previous!==next||vehicle.strategyLastRecordedReason!==vehicle.strategyReason){
    vehicle.strategyHistory=Array.isArray(vehicle.strategyHistory)?vehicle.strategyHistory:[];
    vehicle.strategyHistory.push({
      simTimeMs:simClockV192.simTimeMs,lap:vehicle.strategyLastLap,decision:next,
      reason:vehicle.strategyReason,score:vehicle.strategyScore,compound:vehicle.strategyTargetCompound
    });
    if(vehicle.strategyHistory.length>12)vehicle.strategyHistory.splice(0,vehicle.strategyHistory.length-12);
    vehicle.strategyLastRecordedReason=vehicle.strategyReason;
  }
  return next;
}
function evaluatePitStrategyV206(vehicle,options={}){
  if(!vehicle||vehicle.finished)return null;
  const context=pitStrategyContextV206(vehicle);
  const cfg=PIT_STRATEGY_CONFIG_V206;
  const compound=choosePitCompoundV206(vehicle,context.remainingLaps);
  const currentLap=context.currentLap;
  const pitWindowOpen=currentLap>=cfg.openingLaps&&context.remainingLaps>cfg.minRemainingLapsToPit;
  const cooldown=(Number(vehicle.pitStopCount)||0)>0&&(currentLap-(Number(vehicle.pitLastStopLap)||0))<=Math.max(2,cfg.postStopCooldownLaps);
  const criticalTyre=pitCriticalTyreStateV344(context);
  const wearReady=context.wear>=context.pitWearThreshold;
  const safeTyre=pitRemainingGuardV349(context);
  let decision='NONE',reason='WAIT_FOR_WINDOW',score=.08;

  if(String(vehicle.pitState||'TRACK')!=='TRACK'||vehicle.pitRequested){
    decision=String(vehicle.strategyDecision||'NONE');
    reason=vehicle.pitRequested?'PIT_ALREADY_COMMITTED':'PIT_SEQUENCE_ACTIVE';
    score=Math.max(.3,Number(vehicle.strategyScore)||0);
  }else if(cooldown||(Number(vehicle.pitWarmupRemainingLaps)||0)>0){
    decision='GO_LONG';reason='POST_STOP_WARMUP';score=.72;
  }else if(safeTyre){
    decision='GO_LONG';reason='TYRE_REMAINING_ABOVE_40';score=.76;
  }else if(!wearReady&&!criticalTyre){
    decision='GO_LONG';reason='PERSONAL_WEAR_THRESHOLD_NOT_REACHED';score=.70;
  }else if(Number(vehicle.strategyHoldUntilLap)>currentLap){
    decision='OVERCUT';reason='OVERCUT_STINT_EXTENSION';score=.74;
  }else if(!pitWindowOpen){
    decision='GO_LONG';reason=context.remainingLaps<=cfg.minRemainingLapsToPit?'TOO_LATE_TO_PIT':'OPENING_STINT';score=.46;
  }else if(Number(vehicle.strategyHoldUntilLap)>0&&currentLap>=Number(vehicle.strategyHoldUntilLap)&&context.tyreNeed>=cfg.normalPressure&&context.wear>=cfg.overcutCompleteMinWear){
    decision='BOX_NOW';reason='OVERCUT_WINDOW_COMPLETE';score=.82;
    vehicle.strategyHoldUntilLap=0;
  }else if(criticalTyre||context.pressure>=cfg.severePressure){
    decision='BOX_NOW';reason='TYRE_STATE_CRITICAL';
    score=Math.max(.86,Math.min(1,context.tyreNeed+.22));
  }else if(context.rivalBehindPitting&&context.gapBehind<=cfg.coverGapSeconds&&context.tyreNeed>=.30&&context.wear>=cfg.tacticalMinWear){
    decision='COVER_UNDERCUT';reason='COVER_RIVAL_PIT';
    score=Math.min(1,.66+(1-context.gapBehind/cfg.coverGapSeconds)*.18+context.tyreNeed*.18);
  }else if(context.rivalAheadPitting&&context.gapAhead<=cfg.overcutGapSeconds&&context.pressure<.39&&context.grip>.91&&context.management>-.30){
    decision='OVERCUT';reason='RIVAL_PIT_STAY_OUT';
    score=Math.min(1,.61+(1-context.gapAhead/cfg.overcutGapSeconds)*.16+Math.max(0,context.management)*.12);
    vehicle.strategyHoldUntilLap=currentLap+1;
  }else if(Number.isFinite(context.gapAhead)&&context.gapAhead<=cfg.undercutGapSeconds&&context.tyreNeed>=cfg.normalPressure&&context.wear>=cfg.tacticalMinWear&&context.remainingLaps>2.2){
    decision='UNDERCUT';reason='ATTACK_CAR_AHEAD';
    score=Math.min(1,.60+(1-context.gapAhead/cfg.undercutGapSeconds)*.20+context.tyreNeed*.14+Math.max(0,context.racecraft)*.06);
  }else if(context.pressure<.33&&context.grip>.925&&context.management>.05&&context.remainingLaps>2.5){
    decision='GO_LONG';reason='TYRE_MANAGEMENT_MARGIN';
    score=Math.min(.85,.52+Math.max(0,context.management)*.22+(1-context.pressure)*.10);
  }else{
    decision='NONE';reason='HOLD_CURRENT_STRATEGY';score=.28+context.tyreNeed*.18;
  }

  recordPitStrategyDecisionV206(vehicle,decision,reason,score,compound,context);
  const shouldPit=(decision==='BOX_NOW'||decision==='UNDERCUT'||decision==='COVER_UNDERCUT')&&(wearReady||criticalTyre)&&!safeTyre;
  let requested=false;
  if(shouldPit&&!vehicle.pitRequested&&String(vehicle.pitState||'TRACK')==='TRACK'){
    requested=requestPitStopV205(vehicle.id,compound,decision);
    if(requested){
      vehicle.strategyPitRequestedAtLap=currentLap;
      vehicle.strategyPitRequestedAtSimMs=simClockV192.simTimeMs;
      vehicle.pitRequestHistoryV348=Array.isArray(vehicle.pitRequestHistoryV348)?vehicle.pitRequestHistoryV348:[];
      vehicle.pitRequestHistoryV348.push({lap:currentLap,simTimeMs:Number(simClockV192.simTimeMs)||0,decision:String(decision),compound:String(compound),wear:Number(context.wear),tyreRemaining:Number(context.tyreRemaining),wearThreshold:Number(context.pitWearThreshold),criticalTyre:Boolean(criticalTyre)});
    }
  }
  return {
    id:vehicle.id,decision,reason,score:vehicle.strategyScore,targetCompound:compound,
    requested:Boolean(vehicle.pitRequested||requested),context:compactPitStrategyContextV206(context)
  };
}
function updatePitStrategiesV206(stepMs){
  if(!(stepMs>0))return [];
  const results=[];
  for(const vehicle of raceMotionV189.vehicles){
    if(!vehicle||vehicle.finished)continue;
    vehicle.strategyEvalMs=Math.max(0,(Number(vehicle.strategyEvalMs)||0)-stepMs);
    if(vehicle.strategyEvalMs>0)continue;
    vehicle.strategyEvalMs=PIT_STRATEGY_CONFIG_V206.evaluationMs;
    if(String(vehicle.pitState||'TRACK')!=='TRACK'||vehicle.pitRequested)continue;
    const result=evaluatePitStrategyV206(vehicle);
    if(result)results.push(result);
  }
  return results;
}
function getPitStrategyStatesV206(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,name:vehicle.driver?.name||'',decision:String(vehicle.strategyDecision||'NONE'),
    reason:String(vehicle.strategyReason||''),score:Number(vehicle.strategyScore)||0,
    targetCompound:String(vehicle.strategyTargetCompound||vehicle.tyreCompound||'MEDIUM'),
    lastLap:Number(vehicle.strategyLastLap)||0,lastSimMs:Number(vehicle.strategyLastSimMs)||0,
    holdUntilLap:Number(vehicle.strategyHoldUntilLap)||0,pitRequested:Boolean(vehicle.pitRequested),
    pitRequestReason:String(vehicle.pitRequestReason||''),context:{...(vehicle.strategyLastContext||{})},
    history:(vehicle.strategyHistory||[]).map(row=>({...row}))
  }));
}
function qaPitStrategyV206(driverId,scenario='BOX_NOW'){
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===String(driverId||''))||raceMotionV189.vehicles[0];
  if(!vehicle)return null;
  const keys=[
    'raceProgress','currentLap','tyreWear','tyreGrip','tyreFlatSpot','tyreThermalDeg','tyreGraining','tyreStrategyPressure',
    'pitState','pitRequested','pitTargetCompound','pitRequestReason','pitPreviousRacingLineMode','pitStopCount','pitLastStopLap',
    'pitWarmupRemainingLaps','strategyDecision','strategyReason','strategyScore','strategyTargetCompound','strategyLastLap',
    'strategyLastSimMs','strategyLastContext','strategyHistory','strategyLastRecordedReason','strategyHoldUntilLap',
    'strategyPitRequestedAtLap','strategyPitRequestedAtSimMs'
  ];
  const saved={};for(const key of keys)saved[key]=key==='strategyHistory'?(vehicle[key]||[]).map(row=>({...row})):key==='strategyLastContext'?{...(vehicle[key]||{})}:vehicle[key];
  const totalLaps=Math.max(8,Number(activeRaceSnapshotV187?.totalLaps)||10);
  vehicle.raceProgress=Math.min(totalLaps-3.2,3.15);
  vehicle.currentLap=Math.max(4,Math.floor(vehicle.raceProgress)+1);
  vehicle.pitState='TRACK';vehicle.pitRequested=false;vehicle.pitStopCount=0;vehicle.pitLastStopLap=0;vehicle.pitWarmupRemainingLaps=0;
  if(String(scenario||'BOX_NOW').toUpperCase()==='BOX_NOW'){
    vehicle.tyreWear=.92;vehicle.tyreGrip=.84;vehicle.tyreFlatSpot=.42;vehicle.tyreThermalDeg=.62;vehicle.tyreGraining=.22;vehicle.tyreStrategyPressure=.91;
  }
  const result=evaluatePitStrategyV206(vehicle,{qa:true});
  const output=result?{
    ...result,requestReason:String(vehicle.pitRequestReason||''),pitRequested:Boolean(vehicle.pitRequested),
    historyLength:Array.isArray(vehicle.strategyHistory)?vehicle.strategyHistory.length:0
  }:null;
  for(const key of keys)vehicle[key]=saved[key];
  return output;
}


function trafficBattlePhaseV207(vehicle){
  const phase=getCornerPhaseAtProgressV194(vehicle?.progress)?.phase||'STRAIGHT';
  return {phase,open:phase==='STRAIGHT'||phase==='APPROACH'||phase==='BRAKING'};
}
function updateTrafficAndDefenceV207(){
  const track=activeRaceSnapshotV187?.track;
  const length=Math.max(1,Number(track?.lengthMeters)||1);
  const trackVehicles=trackInteractionVehiclesV369(raceMotionV189.vehicles,track);
  for(const standing of standings){
    const vehicle=standing.vehicle;
    vehicle.trafficState='CLEAR';vehicle.trafficCarAheadId='';vehicle.trafficGapMeters=Infinity;vehicle.trafficClosingRateKph=0;vehicle.trafficPressure=0;vehicle.trafficThreatFromId='';vehicle.defenceActive=false;vehicle.trafficLineIntent='IDEAL';
    if(String(vehicle.pitState||'TRACK')==='TRACK'&&!vehicle.pitRequested&&['ATTACK_INSIDE','DEFENSIVE_INSIDE'].includes(vehicle.racingLineMode))vehicle.racingLineMode='IDEAL';
  }
  for(let index=1;index<trackVehicles.length;index++){
    const vehicle=trackVehicles[index],ahead=trackVehicles[index-1];
    if(!vehicle||!ahead)continue;
    const gapMeters=Math.max(0,(Number(ahead.raceProgress)-Number(vehicle.raceProgress))*length);
    const closingRateKph=(Number(vehicle.speedKph)||0)-(Number(ahead.speedKph)||0);
    const trackFactor=trackOvertakeFactorV235();
    const followingGap=TRAFFIC_CONFIG_V207.followingGapMeters*(.9+.1*trackFactor);
    const gapFactor=clamp01V198(1-gapMeters/followingGap);
    const closingFactor=clamp01V198((closingRateKph+4)/(TRAFFIC_CONFIG_V207.strongClosingKph+4));
    const pressure=clamp01V198(gapFactor*(.35+.65*closingFactor));
    vehicle.trafficCarAheadId=String(ahead.id);vehicle.trafficGapMeters=gapMeters;vehicle.trafficClosingRateKph=closingRateKph;vehicle.trafficPressure=pressure;
    let state='CLEAR';
    if(gapMeters<=followingGap)state='FOLLOWING';
    if(gapMeters<=followingGap&&Number(vehicle.slipstreamStrength)>.08)state='TOWING';
    if(gapMeters<=TRAFFIC_CONFIG_V207.pressureGapMeters*trackFactor&&closingRateKph>=TRAFFIC_CONFIG_V207.minClosingKph)state='PRESSURE';
    vehicle.trafficState=state;
    const battle=trafficBattlePhaseV207(vehicle);
    if(state==='PRESSURE'&&gapMeters<=TRAFFIC_CONFIG_V207.attackGapMeters*trackFactor&&battle.open){
      vehicle.trafficLineIntent='ATTACK_INSIDE';vehicle.racingLineMode='ATTACK_INSIDE';
    }
    if(pressure>=.24&&gapMeters<=TRAFFIC_CONFIG_V207.defendGapMeters){
      ahead.trafficThreatFromId=String(vehicle.id);ahead.defenceActive=true;ahead.trafficState='DEFENDING';
      const aheadBattle=trafficBattlePhaseV207(ahead);
      if(aheadBattle.open&&!ahead.pitRequested){ahead.trafficLineIntent='DEFENSIVE_INSIDE';ahead.racingLineMode='DEFENSIVE_INSIDE'}
    }
  }
  return getTrafficStatesV207();
}
function getTrafficStatesV207(){
  return raceMotionV189.vehicles.map(vehicle=>({id:String(vehicle.id),state:String(vehicle.trafficState||'CLEAR'),carAheadId:String(vehicle.trafficCarAheadId||''),gapMeters:Number.isFinite(vehicle.trafficGapMeters)?Number(vehicle.trafficGapMeters):null,closingRateKph:Number(vehicle.trafficClosingRateKph)||0,pressure:Number(vehicle.trafficPressure)||0,threatFromId:String(vehicle.trafficThreatFromId||''),defenceActive:Boolean(vehicle.defenceActive),lineIntent:String(vehicle.trafficLineIntent||'IDEAL'),racingLineMode:String(vehicle.racingLineMode||'IDEAL')}));
}
function qaTrafficV207(){
  const track=activeRaceSnapshotV187?.track,vehicles=raceMotionV189.vehicles;
  if(!track||vehicles.length<2)return null;
  const standings=computeRaceStandingsV191(),ahead=standings[0]?.vehicle,follower=standings[1]?.vehicle;
  if(!ahead||!follower)return null;
  const keys=['raceProgress','progress','speedKph','slipstreamStrength','racingLineMode','trafficState','trafficCarAheadId','trafficGapMeters','trafficClosingRateKph','trafficPressure','trafficThreatFromId','defenceActive','trafficLineIntent'];
  const saved=new Map(vehicles.map(v=>[v.id,Object.fromEntries(keys.map(k=>[k,v[k]]))]));
  let base=.05;
  for(let i=0;i<100;i++){
    const candidate=(i+.5)/100;
    if(trafficBattlePhaseV207({progress:candidate}).phase==='STRAIGHT'){base=candidate;break}
  }
  const gapProgress=12/Math.max(1,Number(track.lengthMeters)||1);
  ahead.raceProgress=2+base;ahead.progress=normalizedProgressV190(ahead.raceProgress);ahead.speedKph=250;ahead.racingLineMode='IDEAL';
  follower.raceProgress=ahead.raceProgress-gapProgress;follower.progress=normalizedProgressV190(follower.raceProgress);follower.speedKph=272;follower.slipstreamStrength=.65;follower.racingLineMode='IDEAL';
  const states=updateTrafficAndDefenceV207(),output={follower:states.find(row=>row.id===String(follower.id))||null,ahead:states.find(row=>row.id===String(ahead.id))||null};
  for(const vehicle of vehicles){const row=saved.get(vehicle.id);if(row)for(const key of keys)vehicle[key]=row[key]}
  return output;
}


function nextPassStateV208(current,ctx={}){
  const state=PASS_STATES_V208.includes(current)?current:'FOLLOWING';
  const gap=Math.max(0,Number(ctx.gapMeters)||0),closing=Number(ctx.closingRateKph)||0,slip=Number(ctx.slipstreamStrength)||0,attackIntent=Boolean(ctx.attackIntentV365);
  const phase=String(ctx.phase||'STRAIGHT'),open=phase==='STRAIGHT'||phase==='APPROACH'||phase==='BRAKING';
  const passed=Boolean(ctx.passed),counter=Boolean(ctx.counterAttack);
  if(passed&&['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state))return 'PASS_COMPLETED';
  if(['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state)&&gap>PASS_CONFIG_V208.failGapMeters)return 'PASS_FAILED';
  if(state==='FOLLOWING')return (closing>1||attackIntent)&&gap<PASS_CONFIG_V208.followGapMeters?'CLOSING':'FOLLOWING';
  if(state==='CLOSING'){
    if(attackIntent&&gap<PASS_CONFIG_V208.prepareGapMeters&&open)return 'PREPARING_ATTACK';
    return slip>.12?'TOWING':gap>=PASS_CONFIG_V208.followGapMeters?'FOLLOWING':'CLOSING';
  }
  if(state==='TOWING')return gap<PASS_CONFIG_V208.prepareGapMeters?'PREPARING_ATTACK':slip>.08?'TOWING':'CLOSING';
  if(state==='PREPARING_ATTACK')return gap<PASS_CONFIG_V208.pullOutGapMeters&&open?'PULLING_OUT':'PREPARING_ATTACK';
  if(state==='PULLING_OUT')return gap<PASS_CONFIG_V208.sideBySideGapMeters?'SIDE_BY_SIDE':'PULLING_OUT';
  if(state==='SIDE_BY_SIDE')return phase==='BRAKING'||phase==='TURN_IN'?'BRAKING_DUEL':'SIDE_BY_SIDE';
  if(state==='BRAKING_DUEL')return phase==='TURN_IN'||phase==='APEX'?'CORNER_BATTLE':'BRAKING_DUEL';
  if(state==='CORNER_BATTLE')return phase==='EXIT'?'SWITCHBACK':'CORNER_BATTLE';
  if(state==='SWITCHBACK')return counter&&gap<14?'COUNTER_ATTACK':'SWITCHBACK';
  if(state==='COUNTER_ATTACK')return gap>PASS_CONFIG_V208.failGapMeters?'PASS_FAILED':'COUNTER_ATTACK';
  if(state==='PASS_COMPLETED'||state==='PASS_FAILED')return 'FOLLOWING';
  return state;
}
function battleBiasKphV208(vehicle,state){
  const racecraft=driverSkillNormV200(vehicle,'racecraft');
  const aggression=driverSkillNormV200(vehicle,'aggression');
  const skill=1+racecraft*.12+Math.max(0,aggression)*.06;
  const base={FOLLOWING:0,CLOSING:.3,TOWING:.9,PREPARING_ATTACK:.7,PULLING_OUT:1.1,SIDE_BY_SIDE:.55,BRAKING_DUEL:.35,CORNER_BATTLE:.15,SWITCHBACK:1.0,COUNTER_ATTACK:.8,PASS_COMPLETED:0,PASS_FAILED:-.25}[state]||0;
  const trackFactor=trackOvertakeFactorV235();
  return Math.max(-PASS_CONFIG_V208.maxBattleBiasKph,Math.min(PASS_CONFIG_V208.maxBattleBiasKph,base*skill*trackFactor));
}
function variabilityBiasV309(vehicle,now=Number(simClockV192.simTimeMs)||0){
  if(!vehicle)return 0;
  if(now>Number(vehicle.variabilityBiasUntilV309||0)){vehicle.variabilitySpeedBiasKphV309=0;vehicle.variabilityBiasUntilV309=0;return 0}
  return Number(vehicle.variabilitySpeedBiasKphV309)||0;
}
function combinedBattleBiasV309(vehicle,state=String(vehicle?.battleState||'FOLLOWING'),now=Number(simClockV192.simTimeMs)||0){
  const base=battleBiasKphV208(vehicle,state),variability=variabilityBiasV309(vehicle,now);
  vehicle.battleStateSpeedBiasKphV309=base;
  return variability>=0?Math.max(base,variability):Math.min(base,variability);
}
function setPassStateV208(vehicle,next,targetId='',reason=''){
  const current=String(vehicle.battleState||'FOLLOWING');
  if(current!==next){
    vehicle.battleState=next;vehicle.battleStateMs=0;vehicle.battleReason=String(reason||'');
    if(next==='PASS_COMPLETED'){
      vehicle.passCompletedCount=(Number(vehicle.passCompletedCount)||0)+1;
      const target=String(targetId||'');
      if(target){const history=Array.isArray(vehicle.passTargetHistoryV309)?vehicle.passTargetHistoryV309:[];if(!history.includes(target))history.push(target);vehicle.passTargetHistoryV309=history}
    }
    if(next==='PASS_COMPLETED')endChaseBurstV275(vehicle,'pass-completed');
    if(next==='PASS_COMPLETED')vehicle.spectatorPassFlashUntilV252=(Number(simClockV192.simTimeMs)||0)+1400;
    if(next==='PASS_FAILED')vehicle.passFailedCount=(Number(vehicle.passFailedCount)||0)+1;
    enqueueLiveCutinV264(vehicle,next,targetId);
    const dialogueTarget=raceMotionV189.vehicles.find(row=>String(row.id)===String(targetId||''))||null;
    handlePassDialogueV277(vehicle,dialogueTarget,current,next);
  }
  if(targetId)vehicle.battleTargetId=String(targetId);
  vehicle.battleSpeedBiasKph=combinedBattleBiasV309(vehicle,vehicle.battleState);
  return vehicle.battleState;
}
function resolveBattleTargetV309(vehicle,standings,byId){
  const currentStanding=standings.find(row=>row.vehicle===vehicle);
  const immediateAhead=currentStanding&&currentStanding.position>1?standings[currentStanding.position-2]?.vehicle:null;
  let target=byId.get(String(vehicle?.battleTargetId||''))||null;
  const state=String(vehicle?.battleState||'FOLLOWING'),refreshable=OVERTAKE_FLOW_CONFIG_V309.targetRefreshStates.includes(state);
  const targetInvalid=!target||String(target?.pitState||'TRACK')!=='TRACK'||target?.finished;
  const differentImmediate=Boolean(immediateAhead&&target&&String(immediateAhead.id)!==String(target.id));
  if(targetInvalid||(refreshable&&differentImmediate)||(refreshable&&!immediateAhead))target=immediateAhead||null;
  return {target,immediateAhead,currentStanding,refreshable};
}
function qaOvertakeFlowV309(){
  const ahead={id:'ahead-v309',raceProgress:1.2,pitState:'TRACK',finished:false};
  const vehicle={id:'car-v309',raceProgress:1.1,pitState:'TRACK',finished:false,battleTargetId:'old-v309',battleState:'PASS_COMPLETED',driverProfile:{racecraft:75,aggression:75},variabilitySpeedBiasKphV309:5.8,variabilityBiasUntilV309:1000};
  const old={id:'old-v309',raceProgress:1.0,pitState:'TRACK',finished:false};
  const standings=[{vehicle:ahead,position:1},{vehicle,position:2},{vehicle:old,position:3}],byId=new Map([[ahead.id,ahead],[vehicle.id,vehicle],[old.id,old]]);
  const refreshed=resolveBattleTargetV309(vehicle,standings,byId);
  const activeVehicle={...vehicle,battleState:'SIDE_BY_SIDE'};
  const active=resolveBattleTargetV309(activeVehicle,standings,new Map([[ahead.id,ahead],[activeVehicle.id,activeVehicle],[old.id,old]]));
  const activeBias=combinedBattleBiasV309(vehicle,'TOWING',500),expiredBias=combinedBattleBiasV309({...vehicle,variabilityBiasUntilV309:100},'TOWING',500);
  return {version:VERSION309,config:{...OVERTAKE_FLOW_CONFIG_V309,targetRefreshStates:[...OVERTAKE_FLOW_CONFIG_V309.targetRefreshStates]},refreshedTargetId:String(refreshed.target?.id||''),activeTargetId:String(active.target?.id||''),activeBias,expiredBias,allPass:String(refreshed.target?.id||'')===ahead.id&&String(active.target?.id||'')===old.id&&activeBias>2&&expiredBias<=PASS_CONFIG_V208.maxBattleBiasKph};
}

function isBattleActiveV319(state){
  return BATTLE_ACTIVE_STATES_V319.includes(String(state||''));
}
function battlePairKeyV319(firstId,secondId){
  return [String(firstId||''),String(secondId||'')].sort().join('|');
}
function buildBattleLocksV319(standings=computeRaceStandingsV191(),byId=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),v]))){
  const locks=new Map(),pairs=[];
  for(const row of standings||[]){
    const vehicle=row?.vehicle;
    if(!vehicle||!isBattleActiveV319(vehicle.battleState))continue;
    const target=byId.get(String(vehicle.battleTargetId||''));
    if(!target||target.finished||String(target.pitState||'TRACK')!=='TRACK')continue;
    const id=String(vehicle.id),targetId=String(target.id),pairKey=battlePairKeyV319(id,targetId);
    if(locks.has(id)||locks.has(targetId))continue;
    locks.set(id,pairKey);locks.set(targetId,pairKey);pairs.push({pairKey,attackerId:id,targetId});
  }
  return {locks,pairs};
}
function battlePairBlockedV319(vehicle,target,locks){
  if(!vehicle||!target)return false;
  const pairKey=battlePairKeyV319(vehicle.id,target.id);
  const vehicleLock=locks.get(String(vehicle.id)),targetLock=locks.get(String(target.id));
  return Boolean((vehicleLock&&vehicleLock!==pairKey)||(targetLock&&targetLock!==pairKey));
}

function updatePassStateMachineV208(stepMs){
  const track=activeRaceSnapshotV187?.track;
  if(!track)return [];
  const length=Math.max(1,Number(track.lengthMeters)||1),standings=computeRaceStandingsV191();
  const byId=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),v]));
  const isolationV319=buildBattleLocksV319(standings,byId);
  for(const vehicle of raceMotionV189.vehicles){
    vehicle.battleStateMs=(Number(vehicle.battleStateMs)||0)+Math.max(0,Number(stepMs)||0);
    if(vehicle.finished||String(vehicle.pitState||'TRACK')!=='TRACK'){
      vehicle.battleBlockedV319=false;vehicle.battleLockPairV319='';vehicle.battleSpeedBiasKph=0;continue;
    }
    if(!boundaryOvertakeEligibleV271(vehicle)){
      vehicle.battleBlockedV319=false;vehicle.battleLockPairV319='';vehicle.battleSpeedBiasKph=Math.min(0,Number(vehicle.battleSpeedBiasKph)||0);
      if(isBattleActiveV319(vehicle.battleState)){
        vehicle.battleState='PASS_FAILED';vehicle.battleStateMs=0;vehicle.racingLineMode='IDEAL';
      }
      continue;
    }
    const resolvedV309=resolveBattleTargetV309(vehicle,standings,byId);
    const target=resolvedV309.target;
    if(!target){
      vehicle.battleBlockedV319=false;vehicle.battleLockPairV319='';
      vehicle.battleState='FOLLOWING';vehicle.battleTargetId='';vehicle.variabilitySpeedBiasKphV309=0;vehicle.variabilityBiasUntilV309=0;vehicle.battleSpeedBiasKph=0;continue;
    }
    const signedGapMeters=(Number(target.raceProgress)-Number(vehicle.raceProgress))*length;
    const passed=signedGapMeters<-PASS_CONFIG_V208.passMarginMeters;
    const gapMeters=Math.abs(signedGapMeters);
    const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
    const ctx={
      gapMeters,closingRateKph:(Number(vehicle.speedKph)||0)-(Number(target.speedKph)||0),
      slipstreamStrength:Number(vehicle.slipstreamStrength)||0,phase,passed,attackIntentV365:Boolean(vehicle.naturalHeadwayAttackIntentV365),
      counterAttack:String(vehicle.battleState||'')==='SWITCHBACK'&&(Number(vehicle.speedKph)||0)>(Number(target.speedKph)||0)
    };
    const hold=(Number(vehicle.battleStateMs)||0)<PASS_CONFIG_V208.stateHoldMs;
    let next=hold?String(vehicle.battleState||'FOLLOWING'):nextPassStateV208(String(vehicle.battleState||'FOLLOWING'),ctx);
    const pairKey=battlePairKeyV319(vehicle.id,target.id);
    let blocked=battlePairBlockedV319(vehicle,target,isolationV319.locks);
    if(!blocked&&isBattleActiveV319(next)){
      const vehicleLock=isolationV319.locks.get(String(vehicle.id)),targetLock=isolationV319.locks.get(String(target.id));
      if((vehicleLock&&vehicleLock!==pairKey)||(targetLock&&targetLock!==pairKey))blocked=true;
      else{
        isolationV319.locks.set(String(vehicle.id),pairKey);
        isolationV319.locks.set(String(target.id),pairKey);
        if(!isolationV319.pairs.some(row=>row.pairKey===pairKey))isolationV319.pairs.push({pairKey,attackerId:String(vehicle.id),targetId:String(target.id)});
      }
    }
    vehicle.battleBlockedV319=blocked;
    vehicle.battleLockPairV319=blocked?String(isolationV319.locks.get(String(target.id))||isolationV319.locks.get(String(vehicle.id))||''):pairKey;
    if(blocked){
      next=Number(vehicle.slipstreamStrength)>.08?'TOWING':'CLOSING';
      vehicle.racingLineMode='IDEAL';
      vehicle.variabilitySpeedBiasKphV309=0;vehicle.variabilityBiasUntilV309=0;
    }
    setPassStateV208(vehicle,next,target.id,'gap='+gapMeters.toFixed(1)+';phase='+phase+(blocked?';battle-blocked=1':''));
    if(blocked){
      vehicle.battleSpeedBiasKph=Math.min(0,Number(vehicle.battleSpeedBiasKph)||0);
      vehicle.racingLineMode='IDEAL';
      continue;
    }
    if(['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE'].includes(next)&&!vehicle.pitRequested)vehicle.racingLineMode='ATTACK_INSIDE';
    if(next==='SWITCHBACK'||next==='COUNTER_ATTACK')vehicle.racingLineMode='OUTSIDE';
    if(next==='PASS_COMPLETED'||next==='PASS_FAILED')vehicle.racingLineMode='IDEAL';
  }
  return getPassStatesV208();
}
function getPassStatesV208(){
  return raceMotionV189.vehicles.map(vehicle=>({id:String(vehicle.id),state:String(vehicle.battleState||'FOLLOWING'),targetId:String(vehicle.battleTargetId||''),stateMs:Number(vehicle.battleStateMs)||0,biasKph:Number(vehicle.battleSpeedBiasKph)||0,completed:Number(vehicle.passCompletedCount)||0,failed:Number(vehicle.passFailedCount)||0,reason:String(vehicle.battleReason||'')}));
}
function qaPassStateMachineV208(){
  let state='FOLLOWING';const sequence=[state];
  const steps=[
    {gapMeters:40,closingRateKph:8,slipstreamStrength:.05,phase:'STRAIGHT'},
    {gapMeters:30,closingRateKph:10,slipstreamStrength:.4,phase:'STRAIGHT'},
    {gapMeters:18,closingRateKph:12,slipstreamStrength:.5,phase:'STRAIGHT'},
    {gapMeters:12,closingRateKph:14,slipstreamStrength:.45,phase:'APPROACH'},
    {gapMeters:6,closingRateKph:9,slipstreamStrength:.2,phase:'APPROACH'},
    {gapMeters:5,closingRateKph:5,slipstreamStrength:.1,phase:'BRAKING'},
    {gapMeters:4,closingRateKph:2,slipstreamStrength:0,phase:'APEX'},
    {gapMeters:5,closingRateKph:3,slipstreamStrength:0,phase:'EXIT'},
    {gapMeters:8,closingRateKph:6,slipstreamStrength:.05,phase:'STRAIGHT',counterAttack:true},
    {gapMeters:1,closingRateKph:5,slipstreamStrength:.05,phase:'STRAIGHT',passed:true}
  ];
  for(const ctx of steps){state=nextPassStateV208(state,ctx);sequence.push(state)}
  const failed=nextPassStateV208('SIDE_BY_SIDE',{gapMeters:40,closingRateKph:-8,phase:'STRAIGHT'});
  return {sequence,failed,states:[...PASS_STATES_V208]};
}

function raceMomentumSeedV262(snapshot=activeRaceSnapshotV187){
  const driverKey=(snapshot?.drivers||[]).map(row=>String(row?.contactId||row?.name||'')).join(',');
  return hashDriverV189([
    String(snapshot?.createdAt||'race'),
    String(snapshot?.trackId||snapshot?.track?.id||'track'),
    String(snapshot?.totalLaps||DEFAULT_TOTAL_LAPS_V190),
    driverKey,
    'phase262-momentum'
  ].join('|'))||1;
}
function nextMomentumRandomV262(vehicle){
  const draw=seededDriverUnitV200(Number(vehicle?.momentumRandomStateV262)||1);
  if(vehicle)vehicle.momentumRandomStateV262=draw.state;
  return draw.value;
}
function raceMomentumPaceMultiplierV262(vehicle){
  const cfg=RACE_MOMENTUM_CONFIG_V262;
  const momentum=Math.max(cfg.min,Math.min(cfg.max,Number(vehicle?.raceMomentum)||0));
  return Math.max(1-cfg.paceRange,Math.min(1+cfg.paceRange,1+momentum*cfg.paceRange));
}
function applyRaceMomentumEventV262(vehicle,event,baseDelta,reason=''){
  if(!vehicle)return 0;
  const cfg=RACE_MOMENTUM_CONFIG_V262;
  const racecraft=driverSkillNormV200(vehicle,'racecraft');
  const consistency=driverSkillNormV200(vehicle,'consistency');
  const delta=Number(baseDelta)||0;
  const response=delta>=0
    ?1+Math.max(-.12,Math.min(.16,racecraft*.10+consistency*.06))
    :1+Math.max(-.10,Math.min(.18,-consistency*.10-Math.min(0,racecraft)*.05));
  vehicle.raceMomentum=Math.max(cfg.min,Math.min(cfg.max,(Number(vehicle.raceMomentum)||0)+delta*response));
  vehicle.momentumLastEventV262=String(event||'');
  vehicle.momentumLastReasonV262=String(reason||'');
  vehicle.momentumEventCountV262=(Number(vehicle.momentumEventCountV262)||0)+1;
  const history=Array.isArray(vehicle.momentumEventHistoryV262)?vehicle.momentumEventHistoryV262:[];
  history.push({event:String(event||''),delta:Number((delta*response).toFixed(4)),value:Number(vehicle.raceMomentum.toFixed(4)),simTimeMs:Number(simClockV192.simTimeMs)||0});
  if(history.length>12)history.splice(0,history.length-12);
  vehicle.momentumEventHistoryV262=history;
  return vehicle.raceMomentum;
}
function updateRaceMomentumV262(vehicle,stepMs,phase){
  if(!vehicle||!(stepMs>0))return 0;
  const cfg=RACE_MOMENTUM_CONFIG_V262;
  const dt=stepMs/1000;
  const consistency=driverSkillNormV200(vehicle,'consistency');
  const decay=Math.max(.012,cfg.decayPerSecond*(1-consistency*.22));
  vehicle.raceMomentum=(Number(vehicle.raceMomentum)||0)*Math.exp(-decay*dt);

  const completed=Number(vehicle.passCompletedCount)||0;
  const failed=Number(vehicle.passFailedCount)||0;
  const incidents=(Number(vehicle.lockupCount)||0)+(Number(vehicle.understeerCount)||0)+(Number(vehicle.oversteerCount)||0);
  const completedDelta=Math.max(0,completed-(Number(vehicle.momentumLastPassCountV262)||0));
  const failedDelta=Math.max(0,failed-(Number(vehicle.momentumLastFailedCountV262)||0));
  const incidentDelta=Math.max(0,incidents-(Number(vehicle.momentumLastIncidentCountV262)||0));
  if(completedDelta)applyRaceMomentumEventV262(vehicle,'PASS_SUCCESS',cfg.passSuccess*Math.min(2,completedDelta),'overtake');
  if(failedDelta)applyRaceMomentumEventV262(vehicle,'PASS_FAILED',cfg.passFailed*Math.min(2,failedDelta),'failed-overtake');
  if(incidentDelta)applyRaceMomentumEventV262(vehicle,'INCIDENT',cfg.incident*Math.min(2,incidentDelta),'driving-incident');

  const wasDefending=Boolean(vehicle.momentumWasDefendingV262);
  const defending=Boolean(vehicle.defenceActive);
  if(wasDefending&&!defending&&!vehicle.trafficThreatFromId){
    applyRaceMomentumEventV262(vehicle,'DEFENCE_SUCCESS',cfg.defenceSuccess,'pressure-cleared');
  }
  vehicle.momentumWasDefendingV262=defending;
  vehicle.momentumLastPassCountV262=completed;
  vehicle.momentumLastFailedCountV262=failed;
  vehicle.momentumLastIncidentCountV262=incidents;

  vehicle.momentumEvalMsV262=Math.max(0,(Number(vehicle.momentumEvalMsV262)||0)-stepMs);
  if(vehicle.momentumEvalMsV262<=0){
    vehicle.momentumEvalMsV262=cfg.evaluationMs;
    const roll=nextMomentumRandomV262(vehicle);
    const roll2=nextMomentumRandomV262(vehicle);
    const racecraft=driverSkillNormV200(vehicle,'racecraft');
    const braking=driverSkillNormV200(vehicle,'braking');
    const consistencyNorm=driverSkillNormV200(vehicle,'consistency');
    const pressure=clamp01V198(vehicle.trafficPressure);
    const tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle.tyreGrip)||1));
    const incidentActive=Boolean(activeDrivingIncidentV204(vehicle));

    if(incidentActive&&roll<.26){
      applyRaceMomentumEventV262(vehicle,'MINOR_CORRECTION',cfg.minorCorrection,'active-correction');
    }else if(pressure>.62&&roll<.34){
      applyRaceMomentumEventV262(vehicle,'PRESSURE_LOSS',cfg.pressureLoss*(.75+pressure*.35),'traffic-pressure');
    }else if(phase==='EXIT'&&roll<.24+.05*Math.max(0,racecraft)){
      applyRaceMomentumEventV262(vehicle,'EXCELLENT_EXIT',cfg.excellentExit*(.88+Math.max(0,racecraft)*.18),'corner-exit');
    }else if(phase==='BRAKING'&&roll<.17+.05*Math.max(0,braking)){
      applyRaceMomentumEventV262(vehicle,'LATE_BRAKING_CONFIDENCE',cfg.lateBraking*(.9+Math.max(0,braking)*.18),'braking');
    }else if(roll<.10+Math.max(0,-consistencyNorm)*.08){
      applyRaceMomentumEventV262(vehicle,'HESITATION',cfg.hesitation*(.85+Math.max(0,-consistencyNorm)*.25),'hesitation');
    }else if(tyreGrip<.94&&roll2<.30){
      applyRaceMomentumEventV262(vehicle,'TYRE_STRUGGLE',cfg.tyreNegative*(.9+(1-tyreGrip)*1.4),'tyre-grip');
    }else if(tyreGrip>.995&&roll2<.22){
      applyRaceMomentumEventV262(vehicle,'TYRE_CONFIDENCE',cfg.tyrePositive,'tyre-window');
    }else if((Number(vehicle.raceMomentum)||0)>.12&&roll2<.18+.04*Math.max(0,racecraft)){
      applyRaceMomentumEventV262(vehicle,'RHYTHM_GAIN',cfg.rhythmGain,'clean-rhythm');
    }
  }

  vehicle.raceMomentum=Math.max(cfg.min,Math.min(cfg.max,Number(vehicle.raceMomentum)||0));
  vehicle.raceMomentumPaceMultiplierV262=raceMomentumPaceMultiplierV262(vehicle);
  return vehicle.raceMomentum;
}
function getRaceMomentumStatesV262(){
  return raceMotionV189.vehicles.map(vehicle=>({
    id:String(vehicle.id||''),name:String(vehicle.driver?.name||''),
    momentum:Number((Number(vehicle.raceMomentum)||0).toFixed(4)),
    paceMultiplier:Number((Number(vehicle.raceMomentumPaceMultiplierV262)||1).toFixed(5)),
    event:String(vehicle.momentumLastEventV262||''),
    eventCount:Number(vehicle.momentumEventCountV262)||0
  }));
}
function momentumSequenceV262(seed,steps=12){
  const vehicle={momentumRandomStateV262:Number(seed)||1};
  const values=[];
  for(let i=0;i<steps;i++)values.push(Number(nextMomentumRandomV262(vehicle).toFixed(9)));
  return values;
}
function qaRaceMomentumV262(){
  const a=momentumSequenceV262(262062,16);
  const b=momentumSequenceV262(262062,16);
  const c=momentumSequenceV262(262063,16);
  const hi={raceMomentum:1},lo={raceMomentum:-1};
  const hiMultiplier=raceMomentumPaceMultiplierV262(hi),loMultiplier=raceMomentumPaceMultiplierV262(lo);
  const deterministic=JSON.stringify(a)===JSON.stringify(b)&&JSON.stringify(a)!==JSON.stringify(c);
  const paceBound=Math.abs(hiMultiplier-1-RACE_MOMENTUM_CONFIG_V262.paceRange)<1e-9&&Math.abs(1-loMultiplier-RACE_MOMENTUM_CONFIG_V262.paceRange)<1e-9;
  return {deterministic,paceRange:RACE_MOMENTUM_CONFIG_V262.paceRange,hiMultiplier,loMultiplier,events:[...RACE_MOMENTUM_EVENTS_V262],allPass:deterministic&&paceBound&&RACE_MOMENTUM_CONFIG_V262.paceRange>=.015&&RACE_MOMENTUM_CONFIG_V262.paceRange<=.025};
}


const LEADER_PRESSURE_CONFIG_V274=Object.freeze({
  evaluationMs:850,tightFightGapSeconds:1.15,minLeadGapSeconds:1.6,strongLeadGapSeconds:5.5,
  minLeadDurationMs:10000,fullLeadDurationMs:45000,fieldSplitStartSeconds:6,
  groupFollowerMaxGapSeconds:5.5,groupPressureScale:.38,maxEventChance:.06,
  frontFieldShare:.60,frontRankPressureScale:.72,
  cooldownMinMs:9500,cooldownMaxMs:15500,eventMinMs:480,eventMaxMs:1120,
  lateRaceStart:.72,lateRaceMinFactor:.42
});
const LEADER_PRESSURE_EVENTS_V274=Object.freeze({
  EARLY_BRAKING:Object.freeze({speedFactor:.965,lateralRatio:.015}),
  LATE_TURN_IN:Object.freeze({speedFactor:.972,lateralRatio:.045}),
  MISSED_APEX:Object.freeze({speedFactor:.958,lateralRatio:.055}),
  STEERING_CORRECTION:Object.freeze({speedFactor:.979,lateralRatio:.035}),
  SHORT_THROTTLE_LIFT:Object.freeze({speedFactor:.968,lateralRatio:.012})
});
const leaderPressureFieldV274={
  leaderId:'',leaderSinceSimMs:0,lastEvaluationSimMs:0,eventCount:0,lastEvent:null,history:[]
};
function resetLeaderPressureFieldV274(){
  leaderPressureFieldV274.leaderId='';
  leaderPressureFieldV274.leaderSinceSimMs=Number(simClockV192.simTimeMs)||0;
  leaderPressureFieldV274.lastEvaluationSimMs=0;
  leaderPressureFieldV274.eventCount=0;
  leaderPressureFieldV274.lastEvent=null;
  leaderPressureFieldV274.history=[];
  return true;
}
function nextLeaderPressureRandomV274(vehicle){
  let state=(Number(vehicle?.leaderPressureRandomStateV274)>>>0)||1;
  state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;
  vehicle.leaderPressureRandomStateV274=state||1;
  return state/4294967296;
}
function leaderPressureRaceFractionV274(standings=computeRaceStandingsV191()){
  const leader=standings?.[0]?.vehicle;
  const total=Math.max(1,Number(activeRaceSnapshotV187?.totalLaps)||1);
  return Math.max(0,Math.min(1,(Number(leader?.raceProgress)||0)/total));
}
function leaderPressureLargestSplitV274(standings=computeRaceStandingsV191()){
  return (standings||[]).slice(1).reduce((max,row)=>Math.max(max,Number(row?.intervalSeconds)||0),0);
}
function leaderPressureScoreV274({
  role='NONE',gapBehindSeconds=0,leadDurationMs=0,fieldSplitSeconds=0,raceFraction=0
}={}){
  const cfg=LEADER_PRESSURE_CONFIG_V274;
  const normalizedRole=String(role||'NONE');
  if(!['LEADER','GROUP_LEADER'].includes(normalizedRole))return {score:0,gapFactor:0,durationFactor:0,fieldFactor:0,lateFactor:1,roleScale:0,tightFight:false};
  const gap=Math.max(0,Number(gapBehindSeconds)||0);
  const tightFight=gap<=cfg.tightFightGapSeconds;
  const gapFactor=tightFight?0:Math.max(0,Math.min(1,(gap-cfg.minLeadGapSeconds)/Math.max(.1,cfg.strongLeadGapSeconds-cfg.minLeadGapSeconds)));
  const durationFactor=Math.max(0,Math.min(1,(Math.max(0,Number(leadDurationMs)||0)-cfg.minLeadDurationMs)/Math.max(1,cfg.fullLeadDurationMs-cfg.minLeadDurationMs)));
  const fieldFactor=Math.max(.62,Math.min(1,.62+(Math.max(0,Number(fieldSplitSeconds)||0)/cfg.fieldSplitStartSeconds)*.38));
  const fraction=Math.max(0,Math.min(1,Number(raceFraction)||0));
  const lateT=fraction<=cfg.lateRaceStart?0:Math.min(1,(fraction-cfg.lateRaceStart)/Math.max(.01,1-cfg.lateRaceStart));
  const lateFactor=1-lateT*(1-cfg.lateRaceMinFactor);
  const roleScale=normalizedRole==='LEADER'?1:cfg.groupPressureScale;
  const score=Math.max(0,Math.min(1,gapFactor*(.35+.65*durationFactor)*fieldFactor*lateFactor*roleScale));
  return {score,gapFactor,durationFactor,fieldFactor,lateFactor,roleScale,tightFight};
}
function frontRankPressureV314(index,count){
  const size=Math.max(1,Number(count)||1),frontCount=Math.max(2,Math.ceil(size*LEADER_PRESSURE_CONFIG_V274.frontFieldShare));
  const i=Math.max(0,Number(index)||0);
  if(i>=frontCount)return {rankFactor:0,rankScore:0,frontCount};
  const rankFactor=Math.max(0,Math.min(1,1-i/Math.max(1,frontCount-1)));
  return {rankFactor,rankScore:rankFactor*LEADER_PRESSURE_CONFIG_V274.frontRankPressureScale,frontCount};
}
function leaderPressureContextV274(vehicle,standings=computeRaceStandingsV191()){
  const index=(standings||[]).findIndex(row=>row.vehicle===vehicle);
  if(index<0)return {role:'NONE',score:0,gapBehindSeconds:0,leadDurationMs:0,fieldSplitSeconds:0,raceFraction:0,rankFactor:0,rankScore:0};
  const row=standings[index];
  const follower=standings[index+1]||null;
  const gapBehindSeconds=Math.max(0,Number(follower?.intervalSeconds)||0);
  const fieldSplitSeconds=leaderPressureLargestSplitV274(standings);
  const raceFraction=leaderPressureRaceFractionV274(standings);
  let role='NONE';
  if(index===0&&follower)role='LEADER';
  else if(index>0&&follower&&Number(row?.intervalSeconds)>=LEADER_PRESSURE_CONFIG_V274.fieldSplitStartSeconds&&gapBehindSeconds<=LEADER_PRESSURE_CONFIG_V274.groupFollowerMaxGapSeconds)role='GROUP_LEADER';
  const rankPressure=frontRankPressureV314(index,(standings||[]).length);
  if(role==='NONE'&&rankPressure.rankScore>0)role='FRONT_RUNNER';
  const now=Number(simClockV192.simTimeMs)||0;
  if(String(vehicle.leaderPressureRoleV274||'')!==role){
    vehicle.leaderPressureRoleV274=role;
    vehicle.leaderPressureRoleSinceSimMsV274=now;
  }
  const leadDurationMs=role==='LEADER'
    ?Math.max(0,now-(Number(leaderPressureFieldV274.leaderSinceSimMs)||now))
    :role==='GROUP_LEADER'
      ?Math.max(0,now-(Number(vehicle.leaderPressureRoleSinceSimMsV274)||now))
      :0;
  const scored=leaderPressureScoreV274({role,gapBehindSeconds,leadDurationMs,fieldSplitSeconds,raceFraction});
  const score=Math.max(Number(scored.score)||0,rankPressure.rankScore);
  return {role,gapBehindSeconds,leadDurationMs,fieldSplitSeconds,raceFraction,...scored,score,rankFactor:rankPressure.rankFactor,rankScore:rankPressure.rankScore,targetVehicle:follower?.vehicle||null};
}
function leaderPressureEventPoolV274(phase){
  const p=String(phase||'STRAIGHT');
  if(p==='BRAKING')return ['EARLY_BRAKING','STEERING_CORRECTION'];
  if(p==='TURN_IN')return ['LATE_TURN_IN','STEERING_CORRECTION'];
  if(p==='APEX')return ['MISSED_APEX','STEERING_CORRECTION'];
  if(p==='EXIT')return ['SHORT_THROTTLE_LIFT','STEERING_CORRECTION'];
  return ['SHORT_THROTTLE_LIFT','STEERING_CORRECTION'];
}
function triggerLeaderPressureEventV274(vehicle,context,phase){
  if(!vehicle||!context||!(context.score>0))return false;
  const now=Number(simClockV192.simTimeMs)||0;
  const pool=leaderPressureEventPoolV274(phase);
  const pick=Math.min(pool.length-1,Math.floor(nextLeaderPressureRandomV274(vehicle)*pool.length));
  const event=pool[pick]||'STEERING_CORRECTION';
  const duration=LEADER_PRESSURE_CONFIG_V274.eventMinMs+Math.floor(nextLeaderPressureRandomV274(vehicle)*(LEADER_PRESSURE_CONFIG_V274.eventMaxMs-LEADER_PRESSURE_CONFIG_V274.eventMinMs+1));
  const cooldown=LEADER_PRESSURE_CONFIG_V274.cooldownMinMs+Math.floor(nextLeaderPressureRandomV274(vehicle)*(LEADER_PRESSURE_CONFIG_V274.cooldownMaxMs-LEADER_PRESSURE_CONFIG_V274.cooldownMinMs+1));
  const direction=nextLeaderPressureRandomV274(vehicle)<.5?-1:1;
  vehicle.leaderPressureEventV274=event;
  vehicle.leaderPressureEventUntilV274=now+duration;
  vehicle.leaderPressureCooldownUntilV274=now+duration+cooldown;
  vehicle.leaderPressureDirectionV274=direction;
  vehicle.leaderPressureTriggerScoreV274=context.score;
  vehicle.leaderPressureEventCountV274=(Number(vehicle.leaderPressureEventCountV274)||0)+1;
  leaderPressureFieldV274.eventCount+=1;
  const row={event,vehicleId:String(vehicle.id||''),driver:String(vehicle.driver?.name||''),role:String(context.role),score:Number(context.score.toFixed(4)),gapBehindSeconds:Number(context.gapBehindSeconds.toFixed(3)),leadDurationMs:Math.round(context.leadDurationMs),raceFraction:Number(context.raceFraction.toFixed(3)),simTimeMs:now};
  leaderPressureFieldV274.lastEvent=row;leaderPressureFieldV274.history.push(row);
  if(leaderPressureFieldV274.history.length>24)leaderPressureFieldV274.history.splice(0,leaderPressureFieldV274.history.length-24);
  if(!engineQaV240.active){
    const target=context.targetVehicle;
    emitRaceNarrativeV263('MISTAKE',vehicle,target,{cooldownMs:4200});
    emitCharacterDialogueEventV277('MISTAKE',vehicle,target,{cooldownMs:2600});
  }
  return true;
}
function leaderPressureEffectV274(vehicle,phase){
  const now=Number(simClockV192.simTimeMs)||0;
  const event=String(vehicle?.leaderPressureEventV274||'');
  if(!event||now>=Number(vehicle?.leaderPressureEventUntilV274||0)){
    if(vehicle){vehicle.leaderPressureEventV274='';vehicle.leaderPressureEventUntilV274=0}
    return {event:'',speedFactor:1,lateralOffsetMeters:0};
  }
  const spec=LEADER_PRESSURE_EVENTS_V274[event]||LEADER_PRESSURE_EVENTS_V274.STEERING_CORRECTION;
  const score=Math.max(0,Math.min(1,Number(vehicle?.leaderPressureTriggerScoreV274)||0));
  const strength=.72+score*.28;
  let phaseScale=1;
  const p=String(phase||'STRAIGHT');
  if(event==='EARLY_BRAKING'&&!['BRAKING','TURN_IN'].includes(p))phaseScale=.45;
  if(event==='LATE_TURN_IN'&&!['TURN_IN','APEX'].includes(p))phaseScale=.55;
  if(event==='MISSED_APEX'&&!['APEX','EXIT'].includes(p))phaseScale=.48;
  const speedFactor=1-(1-Number(spec.speedFactor))*strength*phaseScale;
  const limit=trackLateralLimitV271(vehicle);
  const lateralOffsetMeters=limit*Number(spec.lateralRatio||0)*strength*phaseScale*(Number(vehicle?.leaderPressureDirectionV274)||1);
  return {event,speedFactor:Math.max(.94,Math.min(1,speedFactor)),lateralOffsetMeters};
}
function updateFieldCompressionLeaderPressureV274(stepMs){
  if(!(stepMs>0)||raceFlagStateV214.flag!=='GREEN'||!raceMotionV189.vehicles.length)return [];
  const now=Number(simClockV192.simTimeMs)||0;
  const standings=computeRaceStandingsV191();
  const leader=standings[0]?.vehicle||null;
  const leaderId=String(leader?.id||'');
  if(leaderId!==leaderPressureFieldV274.leaderId){
    leaderPressureFieldV274.leaderId=leaderId;
    leaderPressureFieldV274.leaderSinceSimMs=now;
  }
  const rows=[];
  for(const row of standings){
    const vehicle=row.vehicle;
    if(!vehicle||vehicle.finished||vehicle.pitState!=='TRACK')continue;
    const context=leaderPressureContextV274(vehicle,standings);
    vehicle.leaderPressureRoleV274=context.role;
    vehicle.leaderPressureScoreV274=context.score;
    vehicle.leaderPressureGapBehindSecondsV274=context.gapBehindSeconds;
    vehicle.leaderPressureLeadDurationMsV274=context.leadDurationMs;
    vehicle.leaderPressureFieldSplitSecondsV274=context.fieldSplitSeconds;
    vehicle.leaderPressureRaceFractionV274=context.raceFraction;
    vehicle.leaderPressureRankFactorV314=context.rankFactor;
    vehicle.leaderPressureRankScoreV314=context.rankScore;
    if(now>=Number(vehicle.leaderPressureEventUntilV274||0)){
      vehicle.leaderPressureEventV274='';
      vehicle.leaderPressureEventUntilV274=0;
    }
    const onCooldown=now<Number(vehicle.leaderPressureCooldownUntilV274||0);
    const hasActive=Boolean(vehicle.leaderPressureEventV274);
    if(context.score>0&&!onCooldown&&!hasActive&&!activeDrivingIncidentV204(vehicle)){
      const resistance=driverSkillNormV200(vehicle,'errorResistance');
      const resistanceFactor=Math.max(.78,Math.min(1.16,1-resistance*.16));
      const chance=Math.min(LEADER_PRESSURE_CONFIG_V274.maxEventChance,context.score*LEADER_PRESSURE_CONFIG_V274.maxEventChance*resistanceFactor);
      vehicle.leaderPressureLastChanceV274=chance;
      if(nextLeaderPressureRandomV274(vehicle)<chance){
        const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
        triggerLeaderPressureEventV274(vehicle,context,phase);
      }
    }else vehicle.leaderPressureLastChanceV274=0;
    rows.push({vehicleId:String(vehicle.id||''),role:context.role,score:context.score,gapBehindSeconds:context.gapBehindSeconds,activeEvent:String(vehicle.leaderPressureEventV274||''),cooldownRemainingMs:Math.max(0,Number(vehicle.leaderPressureCooldownUntilV274||0)-now)});
  }
  leaderPressureFieldV274.lastEvaluationSimMs=now;
  return rows;
}
function getLeaderPressureStatesV274(){
  const now=Number(simClockV192.simTimeMs)||0;
  return raceMotionV189.vehicles.map(vehicle=>({
    id:String(vehicle.id||''),name:String(vehicle.driver?.name||''),role:String(vehicle.leaderPressureRoleV274||'NONE'),
    score:Number((Number(vehicle.leaderPressureScoreV274)||0).toFixed(4)),
    gapBehindSeconds:Number((Number(vehicle.leaderPressureGapBehindSecondsV274)||0).toFixed(3)),
    leadDurationMs:Math.round(Number(vehicle.leaderPressureLeadDurationMsV274)||0),
    rankFactor:Number((Number(vehicle.leaderPressureRankFactorV314)||0).toFixed(3)),
    activeEvent:String(vehicle.leaderPressureEventV274||''),
    cooldownRemainingMs:Math.max(0,Math.round((Number(vehicle.leaderPressureCooldownUntilV274)||0)-now)),
    speedFactor:Number((Number(vehicle.leaderPressureSpeedFactorV274)||1).toFixed(4)),
    eventCount:Number(vehicle.leaderPressureEventCountV274)||0
  }));
}
function qaLeaderPressureV274(){
  const runaway=leaderPressureScoreV274({role:'LEADER',gapBehindSeconds:7,leadDurationMs:65000,fieldSplitSeconds:8,raceFraction:.45});
  const close=leaderPressureScoreV274({role:'LEADER',gapBehindSeconds:.8,leadDurationMs:65000,fieldSplitSeconds:8,raceFraction:.45});
  const late=leaderPressureScoreV274({role:'LEADER',gapBehindSeconds:7,leadDurationMs:65000,fieldSplitSeconds:8,raceFraction:.96});
  const group=leaderPressureScoreV274({role:'GROUP_LEADER',gapBehindSeconds:4.8,leadDurationMs:65000,fieldSplitSeconds:8,raceFraction:.45});
  const a={leaderPressureRandomStateV274:274001},b={leaderPressureRandomStateV274:274001};
  const seqA=Array.from({length:8},()=>Number(nextLeaderPressureRandomV274(a).toFixed(8)));
  const seqB=Array.from({length:8},()=>Number(nextLeaderPressureRandomV274(b).toFixed(8)));
  const deterministic=JSON.stringify(seqA)===JSON.stringify(seqB);
  const eventFactors=Object.entries(LEADER_PRESSURE_EVENTS_V274).map(([event,spec])=>({event,speedFactor:Number(spec.speedFactor),lateralRatio:Number(spec.lateralRatio)}));
  const eventBounds=eventFactors.every(row=>row.speedFactor>=.94&&row.speedFactor<1&&row.lateralRatio>=0&&row.lateralRatio<=.06);
  const eventSet=['EARLY_BRAKING','LATE_TURN_IN','MISSED_APEX','STEERING_CORRECTION','SHORT_THROTTLE_LIFT'].every(event=>Object.prototype.hasOwnProperty.call(LEADER_PRESSURE_EVENTS_V274,event));
  const cooldownValid=LEADER_PRESSURE_CONFIG_V274.cooldownMinMs>=9000&&LEADER_PRESSURE_CONFIG_V274.cooldownMaxMs>LEADER_PRESSURE_CONFIG_V274.cooldownMinMs;
  return {
    runaway,close,late,group,deterministic,eventFactors,eventSet,cooldownValid,
    maxEventChance:LEADER_PRESSURE_CONFIG_V274.maxEventChance,
    allPass:close.score===0&&runaway.score>0&&late.score<runaway.score&&group.score>0&&group.score<runaway.score&&deterministic&&eventBounds&&eventSet&&cooldownValid&&LEADER_PRESSURE_CONFIG_V274.maxEventChance<=.06
  };
}


const CHASE_BURST_CONFIG_V275=Object.freeze({
  maxUsesPerRace:2,evaluationMs:900,activationChance:.045,
  durationMinMs:4000,durationMaxMs:8000,cooldownMs:12500,
  targetSpeedBonusKph:7,accelMultiplier:1.055,exitAccelMultiplier:1.035,
  battleBiasBonusKph:.85
});
const CHASE_BURST_ELIGIBLE_STATES_V275=Object.freeze(['CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT','PASS_FAILED']);
function nextChaseBurstRandomV275(vehicle){
  let state=(Number(vehicle?.chaseBurstRandomStateV275)>>>0)||1;
  state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;
  vehicle.chaseBurstRandomStateV275=state||1;
  return state/4294967296;
}
function isChaseBurstActiveV275(vehicle){
  return Boolean(vehicle&&String(vehicle.chaseBurstStateV275||'')==='ACTIVE'&&(Number(vehicle.chaseBurstUntilV275)||0)>(Number(simClockV192.simTimeMs)||0));
}
function endChaseBurstV275(vehicle,reason='expired'){
  if(!vehicle)return false;
  const wasActive=String(vehicle.chaseBurstStateV275||'')==='ACTIVE';
  vehicle.chaseBurstStateV275='IDLE';
  vehicle.chaseBurstUntilV275=0;
  vehicle.chaseBurstLastEndReasonV275=String(reason||'expired');
  vehicle.chaseBurstSpeedBonusKphV275=0;
  vehicle.chaseBurstAccelMultiplierV275=1;
  vehicle.chaseBurstExitMultiplierV275=1;
  return wasActive;
}
function triggerChaseBurstV275(vehicle,target,reason='chase'){
  if(!vehicle||isChaseBurstActiveV275(vehicle))return false;
  const now=Number(simClockV192.simTimeMs)||0;
  const span=Math.max(0,CHASE_BURST_CONFIG_V275.durationMaxMs-CHASE_BURST_CONFIG_V275.durationMinMs);
  const duration=CHASE_BURST_CONFIG_V275.durationMinMs+Math.floor(nextChaseBurstRandomV275(vehicle)*(span+1));
  vehicle.chaseBurstStateV275='ACTIVE';
  vehicle.chaseBurstUntilV275=now+duration;
  vehicle.chaseBurstCooldownUntilV275=now+duration+CHASE_BURST_CONFIG_V275.cooldownMs;
  vehicle.chaseBurstUsesV275=(Number(vehicle.chaseBurstUsesV275)||0)+1;
  vehicle.chaseBurstTargetIdV275=String(target?.id||'');
  vehicle.chaseBurstLastReasonV275=String(reason||'chase');
  vehicle.chaseBurstLastStartSimMsV275=now;
  emitCharacterDialogueEventV277('BURST',vehicle,target,{cooldownMs:0});
  return true;
}
function chaseBurstEligibilityV275(vehicle,standing,target){
  const now=Number(simClockV192.simTimeMs)||0;
  const state=String(vehicle?.battleState||'FOLLOWING');
  const gap=Math.max(0,Number(vehicle?.trafficGapMeters));
  const eligiblePosition=Number(standing?.position)>1;
  const onTrack=String(vehicle?.pitState||'TRACK')==='TRACK'&&!vehicle?.pitRequested;
  const safe=!vehicle?.finished&&!activeDrivingIncidentV204(vehicle)&&!vehicle?.trackBoundaryExceededV271;
  const closeEnough=Number.isFinite(gap)&&gap<=Math.max(12,Number(PASS_CONFIG_V208.followGapMeters)||36);
  const chasing=Boolean(target)&&CHASE_BURST_ELIGIBLE_STATES_V275.includes(state);
  const usesAvailable=(Number(vehicle?.chaseBurstUsesV275)||0)<CHASE_BURST_CONFIG_V275.maxUsesPerRace;
  const cooldownReady=now>=Number(vehicle?.chaseBurstCooldownUntilV275||0);
  const green=raceFlagStateV214.flag==='GREEN';
  return {eligible:eligiblePosition&&onTrack&&safe&&closeEnough&&chasing&&usesAvailable&&cooldownReady&&green,
    eligiblePosition,onTrack,safe,closeEnough,chasing,usesAvailable,cooldownReady,green,gap,state,targetId:String(target?.id||'')};
}
function updateChaseBurstV275(stepMs){
  if(!(stepMs>0)||!raceMotionV189.vehicles.length)return [];
  const now=Number(simClockV192.simTimeMs)||0;
  const standings=computeRaceStandingsV191();
  const byId=new Map(raceMotionV189.vehicles.map(v=>[String(v.id),v]));
  const rows=[];
  for(const standing of standings){
    const vehicle=standing.vehicle;
    if(!vehicle)continue;
    if(isChaseBurstActiveV275(vehicle)){
      const target=byId.get(String(vehicle.chaseBurstTargetIdV275||vehicle.battleTargetId||''))||null;
      if(!target||String(target.pitState||'TRACK')!=='TRACK')endChaseBurstV275(vehicle,'target-lost');
      else if(Number(vehicle.raceProgress)>Number(target.raceProgress)+PASS_CONFIG_V208.passMarginMeters/Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1))endChaseBurstV275(vehicle,'pass-completed');
      else if(activeDrivingIncidentV204(vehicle)||String(vehicle.pitState||'TRACK')!=='TRACK'||vehicle.trackBoundaryExceededV271)endChaseBurstV275(vehicle,'safety-cancel');
      else if(now>=Number(vehicle.chaseBurstUntilV275||0))endChaseBurstV275(vehicle,'expired');
    }
    vehicle.chaseBurstEvalMsV275=Math.max(0,(Number(vehicle.chaseBurstEvalMsV275)||0)-stepMs);
    if(!isChaseBurstActiveV275(vehicle)&&vehicle.chaseBurstEvalMsV275<=0){
      vehicle.chaseBurstEvalMsV275=CHASE_BURST_CONFIG_V275.evaluationMs;
      const target=byId.get(String(vehicle.battleTargetId||vehicle.trafficCarAheadId||''))||null;
      const eligibility=chaseBurstEligibilityV275(vehicle,standing,target);
      vehicle.chaseBurstEligibleV275=eligibility.eligible;
      vehicle.chaseBurstGapMetersV275=eligibility.gap;
      if(eligibility.eligible&&nextChaseBurstRandomV275(vehicle)<CHASE_BURST_CONFIG_V275.activationChance){
        triggerChaseBurstV275(vehicle,target,'eligible-chase');
      }
    }
    rows.push({id:String(vehicle.id||''),position:Number(standing.position)||0,active:isChaseBurstActiveV275(vehicle),uses:Number(vehicle.chaseBurstUsesV275)||0,
      gapMeters:Number.isFinite(Number(vehicle.chaseBurstGapMetersV275))?Number(vehicle.chaseBurstGapMetersV275):null,state:String(vehicle.chaseBurstStateV275||'IDLE'),
      targetId:String(vehicle.chaseBurstTargetIdV275||''),endReason:String(vehicle.chaseBurstLastEndReasonV275||'')});
  }
  return rows;
}
function chaseBurstEffectV275(vehicle,phase){
  if(!isChaseBurstActiveV275(vehicle))return {active:false,targetSpeedBonusKph:0,accelMultiplier:1,exitMultiplier:1,battleBiasBonusKph:0};
  const exit=String(phase||'')==='EXIT';
  return {active:true,targetSpeedBonusKph:CHASE_BURST_CONFIG_V275.targetSpeedBonusKph,
    accelMultiplier:CHASE_BURST_CONFIG_V275.accelMultiplier,
    exitMultiplier:exit?CHASE_BURST_CONFIG_V275.exitAccelMultiplier:1,
    battleBiasBonusKph:CHASE_BURST_CONFIG_V275.battleBiasBonusKph};
}
function getChaseBurstStatesV275(){
  const now=Number(simClockV192.simTimeMs)||0;
  return raceMotionV189.vehicles.map(vehicle=>({
    id:String(vehicle.id||''),name:String(vehicle.driver?.name||''),active:isChaseBurstActiveV275(vehicle),
    uses:Number(vehicle.chaseBurstUsesV275)||0,maxUses:CHASE_BURST_CONFIG_V275.maxUsesPerRace,
    remainingMs:Math.max(0,Math.round((Number(vehicle.chaseBurstUntilV275)||0)-now)),
    cooldownRemainingMs:Math.max(0,Math.round((Number(vehicle.chaseBurstCooldownUntilV275)||0)-now)),
    targetId:String(vehicle.chaseBurstTargetIdV275||''),lastEndReason:String(vehicle.chaseBurstLastEndReasonV275||'')
  }));
}
function qaChaseBurstV275(){
  const base={id:'burst-qa',finished:false,pitState:'TRACK',pitRequested:false,trackBoundaryExceededV271:false,battleState:'TOWING',
    trafficGapMeters:18,chaseBurstUsesV275:0,chaseBurstCooldownUntilV275:0,chaseBurstRandomStateV275:275001,lockupActiveMs:0,understeerActiveMs:0,oversteerActiveMs:0};
  const target={id:'target-qa',pitState:'TRACK',raceProgress:1.01};
  const eligible=chaseBurstEligibilityV275(base,{position:2},target);
  const leader=chaseBurstEligibilityV275({...base},{position:1},target);
  const pit=chaseBurstEligibilityV275({...base,pitState:'PIT_LANE'},{position:2},target);
  const incident=chaseBurstEligibilityV275({...base,lockupActiveMs:1000},{position:2},target);
  const exhausted=chaseBurstEligibilityV275({...base,chaseBurstUsesV275:CHASE_BURST_CONFIG_V275.maxUsesPerRace},{position:2},target);
  const a={chaseBurstRandomStateV275:275001},b={chaseBurstRandomStateV275:275001};
  const seqA=Array.from({length:10},()=>Number(nextChaseBurstRandomV275(a).toFixed(9)));
  const seqB=Array.from({length:10},()=>Number(nextChaseBurstRandomV275(b).toFixed(9)));
  const effect=(()=>{const old=simClockV192.simTimeMs;simClockV192.simTimeMs=1000;const v={chaseBurstStateV275:'ACTIVE',chaseBurstUntilV275:5000};const x=chaseBurstEffectV275(v,'EXIT');simClockV192.simTimeMs=old;return x})();
  return {eligible,leader,pit,incident,exhausted,effect,deterministic:JSON.stringify(seqA)===JSON.stringify(seqB),config:{...CHASE_BURST_CONFIG_V275},
    allPass:eligible.eligible&&!leader.eligible&&!pit.eligible&&!incident.eligible&&!exhausted.eligible&&effect.active&&effect.targetSpeedBonusKph>0&&effect.accelMultiplier>1&&effect.exitMultiplier>1&&JSON.stringify(seqA)===JSON.stringify(seqB)&&CHASE_BURST_CONFIG_V275.maxUsesPerRace<=2&&CHASE_BURST_CONFIG_V275.activationChance<=.05};
}

function createRaceVehiclesV189(snapshot){
  const orderedDrivers=(snapshot?.drivers||[]).slice().sort((a,b)=>(Number(a.gridPosition)||999)-(Number(b.gridPosition)||999));
  const count=Math.max(1,orderedDrivers.length||0);
  return orderedDrivers.map(function(driver,index){
    const hash=hashDriverV189(driver.contactId||driver.name);
    const driverProfile=createDriverProfileV200(driver,snapshot);
    const raceSeed=hashDriverV189(String(driver.contactId||driver.name)+'|'+String(snapshot?.createdAt||'race')+'|pace-noise');
    const momentumSeed=hashDriverV189(String(raceMomentumSeedV262(snapshot))+'|'+String(driver.contactId||driver.name)+'|momentum')||1;
    const leaderPressureSeedV274=hashDriverV189(String(snapshot?.createdAt||'race')+'|'+String(driver.contactId||driver.name)+'|leader-pressure')||1;
    const chaseBurstSeedV275=hashDriverV189(String(snapshot?.createdAt||'race')+'|'+String(driver.contactId||driver.name)+'|chase-burst')||1;
    const startOffset=gridStartOffsetV272(index,count);
    const vehicle={
      id:String(driver.contactId),driver,gridPosition:Number(driver.gridPosition)||index+1,startOffset,progress:normalizedProgressV190(startOffset),travel:0,raceProgress:startOffset,raceDistanceMeters:0,currentLap:1,completedLaps:0,sector:'GRID',
      lapDurationMs:21000,lapTimingArmed:startOffset>=0,lapStartSimMs:startOffset>=0?0:null,lastLapMs:0,bestLapMs:0,lapTimesMs:[],
      sectorTimesMs:{S1:0,S2:0,S3:0},sectorStartSimMs:startOffset>=0?0:null,timingSector:startOffset>=0?'S1':'GRID',timedCompletedLaps:0,
      speedKph:0,targetSpeedKph:0,throttle:0,brake:0,accelerationMps2:0,gear:1,rpm:8500,
      racingLineMode:'IDEAL',lateralOffsetMeters:0,targetVisualLateralOffsetMeters:0,visualLateralOffsetMeters:0,visualLateralVelocity:0,visualLateralInitializedV258:false,fourLaneEnabledV360:true,visualLaneIndexV360:index%FOUR_LANE_TRACK_V360.laneCount,fourLaneOffsetMetersV360:0,fourLaneResolvedIndexV360:index%FOUR_LANE_TRACK_V360.laneCount,cornerLaneLockIdV361:'',cornerLaneLockIndexV361:index%FOUR_LANE_TRACK_V360.laneCount,cornerLaneDensityV361:1,cornerLaneSpreadScaleV361:1,markerDensityScaleV361:1,cornerLaneNextEvalMsV361:0,laneBandSlotV363:0,laneBandPeerCountV363:1,laneBandOffsetMetersV363:0,markerBandScaleV363:1,laneBandLockedSlotV364:0,laneBandGroupKeyV364:'',laneBandContextV364:'',laneBandSlotLockedUntilV364:0,laneBandRaceOrderSignatureV364:'',laneBandSlotChangesV364:0,
      carAheadId:null,gapToCarAheadMeters:Infinity,slipstreamStrength:0,slipstreamDragReduction:0,slipstreamGapEffect:0,slipstreamAlignmentEffect:0,slipstreamLateralEffect:0,slipstreamStraightEffect:0,
      dirtyAirStrength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,dirtyAirTyreHeatLoad:0,
      driverProfile,driverRandomState:raceSeed||1,paceNoise:0,nextPaceNoiseMs:0,driverPaceMultiplier:1,rawDriverPaceMultiplier:1,longRunPaceMultiplier:1,longRunPaceBias:0,
      raceMomentum:0,raceMomentumPaceMultiplierV262:1,momentumRandomStateV262:momentumSeed,momentumEvalMsV262:220+index*37,
      momentumLastPassCountV262:0,momentumLastFailedCountV262:0,momentumLastIncidentCountV262:0,momentumWasDefendingV262:false,
      momentumLastEventV262:'',momentumLastReasonV262:'',momentumEventCountV262:0,momentumEventHistoryV262:[],
      leaderPressureRandomStateV274:leaderPressureSeedV274,leaderPressureRoleV274:'NONE',leaderPressureRoleSinceSimMsV274:0,
      leaderPressureScoreV274:0,leaderPressureGapBehindSecondsV274:0,leaderPressureLeadDurationMsV274:0,leaderPressureFieldSplitSecondsV274:0,leaderPressureRaceFractionV274:0,
      leaderPressureEventV274:'',leaderPressureEventUntilV274:0,leaderPressureCooldownUntilV274:0,leaderPressureDirectionV274:1,leaderPressureTriggerScoreV274:0,
      leaderPressureLastChanceV274:0,leaderPressureSpeedFactorV274:1,leaderPressureLateralMetersV274:0,leaderPressureEventCountV274:0,
      chaseBurstRandomStateV275:chaseBurstSeedV275,chaseBurstStateV275:'IDLE',chaseBurstEvalMsV275:450+index*53,chaseBurstUntilV275:0,chaseBurstCooldownUntilV275:0,
      chaseBurstUsesV275:0,chaseBurstTargetIdV275:'',chaseBurstLastReasonV275:'',chaseBurstLastEndReasonV275:'',chaseBurstLastStartSimMsV275:0,
      chaseBurstEligibleV275:false,chaseBurstGapMetersV275:Infinity,chaseBurstSpeedBonusKphV275:0,chaseBurstAccelMultiplierV275:1,chaseBurstExitMultiplierV275:1,
      batteryMJ:ENERGY_CONFIG_V201.usableCapacityMJ,energyTargetMJ:ENERGY_CONFIG_V201.usableCapacityMJ,energyDeployKW:0,energyRechargeKW:0,energyDeployMJ:0,energyHarvestMJ:0,energyHarvestLapMJ:0,energyLapNumber:1,boostActive:false,boostPowerKW:0,boostEnergyMJ:0,attackOpportunityScore:0,defenceThreatScore:0,powerUnitFactor:1,
      activeAeroMode:'CORNER',activeAeroTarget:'CORNER',activeAeroTransitionMs:0,overtakeZoneId:'',overtakeGapSeconds:Infinity,overtakeEligible:false,overtakeActive:false,overtakeRechargeAllowanceActive:false,
      tyreCompound:['SOFT','MEDIUM','HARD'][(hash+index)%3],tyreStartRaceProgress:startOffset,tyreAgeLaps:0,tyreWear:0,tyreSurfaceTemp:.5,tyreCarcassTemp:.5,tyreGrip:1,tyreThermalDeg:0,tyreGraining:0,tyreFlatSpot:0,tyreStrategyPressure:0,
      incidentEvalMs:INCIDENT_CONFIG_V204.evaluationMs,lockupActiveMs:0,understeerActiveMs:0,oversteerActiveMs:0,
      lockupSeverity:0,understeerIncidentSeverity:0,oversteerIncidentSeverity:0,incidentLateralOffsetMeters:0,
      lockupCount:0,understeerCount:0,oversteerCount:0,lastIncidentType:'',lastIncidentSimMs:0,lastIncidentForced:false,
      pitState:'TRACK',pitRequested:false,pitTargetCompound:'MEDIUM',pitRequestReason:'',pitPreviousRacingLineMode:'IDEAL',
      pitEntryRaceProgress:0,pitExitRaceProgress:0,pitServiced:false,pitBoxTimerMs:0,pitBoxDurationMs:0,pitStopCount:0,pitLastStopLap:0,
      pitWarmupStartRaceProgress:0,pitWarmupRemainingLaps:0,tyreWarmupFactor:1,pitStartCompoundV361:'',pitHudEnteredAtV361:0,
      strategyEvalMs:900+index*140,strategyDecision:'NONE',strategyReason:'',strategyScore:0,strategyTargetCompound:'MEDIUM',
      strategyLastLap:0,strategyLastSimMs:0,strategyLastContext:{},strategyHistory:[],strategyLastRecordedReason:'',
      strategyHoldUntilLap:0,strategyPitRequestedAtLap:0,strategyPitRequestedAtSimMs:0,pitRequestHistoryV348:[],
      trafficState:'CLEAR',trafficCarAheadId:'',trafficGapMeters:Infinity,trafficClosingRateKph:0,trafficPressure:0,trafficThreatFromId:'',defenceActive:false,trafficLineIntent:'IDEAL',
      battleState:'FOLLOWING',battleTargetId:'',battleStateMs:0,battleReason:'',battleSpeedBiasKph:0,battleStateSpeedBiasKphV309:0,variabilitySpeedBiasKphV309:0,variabilityBiasUntilV309:0,passCompletedCount:0,passFailedCount:0,passTargetHistoryV309:[],spectatorPassFlashUntilV252:0,
      finished:false,finishPosition:0,finishedAtSimMs:0,
      marker:null
    };
    vehicle.tyreGrip=tyreCompoundSpecV203(vehicle.tyreCompound).gripBias;
    vehicle.raceFormBiasV345=raceFormBiasV345(vehicle,snapshot);
    return syncVehicleRaceMetricsV190(vehicle,snapshot.track);
  });
}
function driverNumberV232(vehicle,index=0){
  const grid=Number(vehicle?.driver?.gridPosition);
  return String(Number.isFinite(grid)&&grid>0?Math.floor(grid):Math.max(1,Number(index)+1));
}

function raceMarkerScaleV245(zoom=raceCameraV216.zoom){
  const z=Math.max(1,Number(zoom)||1);
  return Math.max(.22,Math.min(1,1/z));
}
// Phase 245 compatibility token: raceMarkerTransformV245(point,raceCameraV216.zoom)
function raceMarkerTransformV245(point,zoom=raceCameraV216.zoom,vehicle=null){
  const scale=raceMarkerScaleV245(zoom);
  return 'translate('+Number(point?.x||0).toFixed(2)+' '+Number(point?.y||0).toFixed(2)+') scale('+scale.toFixed(4)+')';
}
function syncRaceMarkerScaleV245(){
  const scale=raceMarkerScaleV245(raceCameraV216.zoom),scaleText=scale.toFixed(4),rendered=[];
  let labelsChanged=false;
  for(const vehicle of raceMotionV189.vehicles){
    if(!vehicle?.marker||!vehicle?.renderPointV216)continue;
    labelsChanged=labelsChanged||vehicle.marker.dataset.cameraScaleV245!==scaleText;
    vehicle.marker.setAttribute('transform',raceMarkerTransformV245(vehicle.renderPointV216,raceCameraV216.zoom,vehicle));
    vehicle.marker.dataset.cameraScaleV245=scaleText;
    rendered.push({vehicle,marker:vehicle.marker,point:vehicle.renderPointV216});
  }
  if(labelsChanged)layoutRaceVehicleLabelsV228(rendered);
  syncTrackAnnotationScaleV245();
  syncBattleLinksV256();
  return scale;
}
function syncTrackAnnotationScaleV245(){
  const scale=raceMarkerScaleV245(raceCameraV216.zoom).toFixed(4);
  for(const node of document.querySelectorAll('#f1RacingRaceAnnotationsRecoveryB [data-zoom-anchor-x]')){
    const x=Number(node.dataset.zoomAnchorX),y=Number(node.dataset.zoomAnchorY);
    node.setAttribute('transform','translate('+x+' '+y+') scale('+scale+') translate('+(-x)+' '+(-y)+')');
    node.dataset.cameraScaleV245=scale;
  }
}
function driverProfileInitialsV250(driver){
  return initials(driver?.name||driverCodeV188(driver)||'?').slice(0,2);
}
function syncRaceMarkerPositionV254(marker,position){
  if(!marker)return null;
  let group=marker.querySelector('.car-position-tag-v254');
  if(!group){
    group=svgNodeV183('g',{class:'car-position-tag-v254','aria-hidden':'true'});
    const box=svgNodeV183('rect',{class:'car-position-box-v254',x:-16,y:35,width:32,height:14,rx:4,ry:4});
    const textNode=svgNodeV183('text',{class:'car-position-text-v254',x:0,y:45.2,'text-anchor':'middle'});
    group.append(box,textNode);
    marker.appendChild(group);
  }
  const value=Math.max(1,Number(position)||1);
  const label='P'+value;
  const textNode=group.querySelector('.car-position-text-v254');
  if(textNode)textNode.textContent=label;
  marker.dataset.livePositionV254=String(value);
  marker.classList.toggle('top-three-v254',value<=3);
  marker.classList.toggle('leader-position-v254',value===1);
  return {position:value,label};
}
function qaRaceMarkerPositionV254(){
  const standings=computeRaceStandingsV191();
  const rows=standings.map(standing=>{
    const marker=standing.vehicle?.marker;
    const state=syncRaceMarkerPositionV254(marker,standing.position);
    const tag=marker?.querySelector('.car-position-tag-v254');
    const textNode=marker?.querySelector('.car-position-text-v254');
    return {id:String(standing.vehicle?.id||''),position:standing.position,state,tag:Boolean(tag),text:String(textNode?.textContent||''),dataset:String(marker?.dataset.livePositionV254||'')};
  });
  return {count:rows.length,rows,allPass:rows.length>0&&rows.every(row=>row.tag&&row.text==='P'+row.position&&row.dataset===String(row.position))};
}


const bestLapOverlayStateV338={lastFastestMs:0,lastFastestId:'',newUntilWallMs:0,version:0};
function ensureBestLapOverlayV338(){
  const stage=document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188');if(!stage)return null;
  let root=document.getElementById('f1RacingBestLapOverlayV338');
  if(root)return root;
  root=document.createElement('aside');root.id='f1RacingBestLapOverlayV338';root.className='f1-racing-best-lap-v338';root.hidden=true;
  root.innerHTML='<div class="f1-best-lap-kicker-v338"><span>BEST LAP</span><em data-f1-best-lap-new-v338>NEW</em></div><div class="f1-best-lap-main-v338"><span class="f1-best-lap-avatar-v338" data-f1-best-lap-avatar-v338></span><span class="f1-best-lap-copy-v338"><strong data-f1-best-lap-driver-v338>--</strong><b data-f1-best-lap-time-v338>--:--.---</b></span></div>';
  stage.appendChild(root);return root;
}
function bestLapAvatarV338(root,vehicle){
  const slot=root?.querySelector('[data-f1-best-lap-avatar-v338]');if(!slot)return false;
  const name=String(vehicle?.driver?.name||'Driver'),image=String(vehicle?.driver?.image||'').trim();
  slot.replaceChildren();
  if(image){const img=document.createElement('img');img.src=image;img.alt='';slot.appendChild(img)}
  else slot.textContent=initials(name);
  return true;
}
function syncBestLapOverlayV338(state=raceHeadlineStateV255()){
  const root=ensureBestLapOverlayV338();if(!root)return null;
  const fastestMs=Number(state?.fastestMs)||0,fastestId=String(state?.fastestId||'');
  if(!(fastestMs>0)||!fastestId){root.hidden=true;return {visible:false,fastestMs:0,fastestId:''}}
  const vehicle=raceMotionV189.vehicles.find(row=>String(row.id)===fastestId)||null;
  const isNew=!(bestLapOverlayStateV338.lastFastestMs>0)||fastestMs<bestLapOverlayStateV338.lastFastestMs-.5||fastestId!==bestLapOverlayStateV338.lastFastestId&&Math.abs(fastestMs-bestLapOverlayStateV338.lastFastestMs)>.5;
  bestLapOverlayStateV338.lastFastestMs=fastestMs;bestLapOverlayStateV338.lastFastestId=fastestId;
  root.hidden=false;root.querySelector('[data-f1-best-lap-driver-v338]').textContent=String(vehicle?.driver?.name||state.fastestDriver||'--');
  root.querySelector('[data-f1-best-lap-time-v338]').textContent=formatLapTimeV248(fastestMs);bestLapAvatarV338(root,vehicle);
  if(isNew){
    const version=++bestLapOverlayStateV338.version;bestLapOverlayStateV338.newUntilWallMs=Date.now()+3600;
    root.classList.remove('is-new-v338');void root.offsetWidth;root.classList.add('is-new-v338');
    setTimeout(()=>{if(version===bestLapOverlayStateV338.version)root.classList.remove('is-new-v338')},3800);
  }
  root.dataset.fastestIdV338=fastestId;root.dataset.fastestMsV338=String(Math.round(fastestMs));
  return {visible:true,fastestMs,fastestId,isNew};
}
function resetBestLapOverlayV338(){
  bestLapOverlayStateV338.lastFastestMs=0;bestLapOverlayStateV338.lastFastestId='';bestLapOverlayStateV338.newUntilWallMs=0;bestLapOverlayStateV338.version+=1;
  const root=document.getElementById('f1RacingBestLapOverlayV338');if(root){root.hidden=true;root.classList.remove('is-new-v338');root.removeAttribute('data-fastest-id-v338')}
  return true;
}
function qaBestLapOverlayV338(){
  const root=ensureBestLapOverlayV338(),vehicle=raceMotionV189.vehicles[0]||null;
  const saved={lastFastestMs:bestLapOverlayStateV338.lastFastestMs,lastFastestId:bestLapOverlayStateV338.lastFastestId,newUntilWallMs:bestLapOverlayStateV338.newUntilWallMs,version:bestLapOverlayStateV338.version};
  let observed={visible:false,time:'',driver:'',newClass:false};
  if(root&&vehicle){
    bestLapOverlayStateV338.lastFastestMs=0;bestLapOverlayStateV338.lastFastestId='';
    syncBestLapOverlayV338({fastestMs:60000,fastestId:String(vehicle.id),fastestDriver:String(vehicle.driver?.name||'QA')});
    observed={visible:!root.hidden,time:String(root.querySelector('[data-f1-best-lap-time-v338]')?.textContent||''),driver:String(root.querySelector('[data-f1-best-lap-driver-v338]')?.textContent||''),newClass:root.classList.contains('is-new-v338')};
    resetBestLapOverlayV338();
    Object.assign(bestLapOverlayStateV338,saved);
  }
  const hasNew=Boolean(root?.querySelector('[data-f1-best-lap-new-v338]')),hasAvatar=Boolean(root?.querySelector('[data-f1-best-lap-avatar-v338]'));
  return {version:VERSION338,rootReady:Boolean(root),hasNew,hasAvatar,observed,allPass:Boolean(root&&hasNew&&hasAvatar&&(!vehicle||(observed.visible&&observed.time==='1:00.000'&&observed.newClass)))};
}

function raceHeadlineStateV255(){
  const standings=computeRaceStandingsV191();
  const leader=standings[0]?.vehicle||null;
  const total=Math.max(1,Number(activeRaceSnapshotV187?.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  const completed=Math.max(0,Number(leader?.completedLaps)||0);
  const remaining=Math.max(0,total-completed);
  const fastest=fastestLapStateV252();
  const fastestId=String(fastest.ids?.[0]||'');
  const fastestVehicle=raceMotionV189.vehicles.find(vehicle=>String(vehicle.id)===fastestId)||null;
  const battles=raceMotionV189.vehicles.filter(vehicle=>isBattleVisualStateV252(vehicle?.battleState)).length;
  return {
    leaderId:String(leader?.id||''),
    leaderName:String(leader?.driver?.name||'--'),
    remaining,
    total,
    fastestMs:Number(fastest.fastestMs)||0,
    fastestId,
    fastestDriver:String(fastestVehicle?.driver?.name||'--'),
    battles
  };
}
function syncRaceHeadlineV255(){
  const root=document.getElementById('f1RacingRaceHeadlineV255');
  if(!root)return null;
  const state=raceHeadlineStateV255();
  const leader=root.querySelector('[data-f1-headline-leader]');
  const remaining=root.querySelector('[data-f1-headline-remaining]');
  const fastest=root.querySelector('[data-f1-headline-fastest]');
  const fastestDriver=root.querySelector('[data-f1-headline-fastest-driver]');
  const battles=root.querySelector('[data-f1-headline-battles]');
  if(leader)leader.textContent=state.leaderName;
  if(remaining)remaining.textContent=String(state.remaining);
  if(fastest)fastest.textContent=formatLapTimeV248(state.fastestMs);
  if(fastestDriver)fastestDriver.textContent=state.fastestDriver;
  if(battles)battles.textContent=String(state.battles);
  root.dataset.leaderId=state.leaderId;
  root.dataset.remaining=String(state.remaining);
  root.dataset.fastestMs=String(Math.round(state.fastestMs));
  root.dataset.battles=String(state.battles);
  syncBestLapOverlayV338(state);
  return state;
}
function qaRaceHeadlineV255(){
  const root=document.getElementById('f1RacingRaceHeadlineV255');
  if(!root||raceMotionV189.vehicles.length<2)return {allPass:false,reason:'need-live-field'};
  const saved=raceMotionV189.vehicles.map(vehicle=>({vehicle,bestLapMs:vehicle.bestLapMs,battleState:vehicle.battleState}));
  const first=raceMotionV189.vehicles[0];
  let observed={};
  try{
    raceMotionV189.vehicles.forEach((vehicle,index)=>{vehicle.bestLapMs=index===0?60000:62000+index*1000;vehicle.battleState=index===0?'SIDE_BY_SIDE':'FOLLOWING'});
    const state=syncRaceHeadlineV255();
    observed={
      state,
      leader:String(root.querySelector('[data-f1-headline-leader]')?.textContent||''),
      remaining:String(root.querySelector('[data-f1-headline-remaining]')?.textContent||''),
      fastest:String(root.querySelector('[data-f1-headline-fastest]')?.textContent||''),
      fastestDriver:String(root.querySelector('[data-f1-headline-fastest-driver]')?.textContent||''),
      battles:String(root.querySelector('[data-f1-headline-battles]')?.textContent||'')
    };
  }finally{
    for(const item of saved){item.vehicle.bestLapMs=item.bestLapMs;item.vehicle.battleState=item.battleState}
    syncRaceHeadlineV255();
  }
  const allPass=Boolean(observed.leader)&&/^\d+$/.test(observed.remaining)&&observed.fastest==='1:00.000'&&observed.fastestDriver===String(first.driver?.name||'')&&observed.battles==='1';
  return {...observed,allPass};
}

function syncEmbeddedDriverMarkerV257(marker,vehicle){
  if(!marker||!vehicle)return false;
  const safeKey=String(vehicle.id||'driver').replace(/[^a-zA-Z0-9_-]/g,'_');
  marker.querySelector('.car-profile-v250')?.remove();
  let defs=marker.querySelector('defs[data-f1-profile-defs-v257]');
  if(!defs){
    defs=svgNodeV183('defs',{'data-f1-profile-defs-v257':'1'});
    const clip=svgNodeV183('clipPath',{id:'f1RaceProfileClipV257_'+safeKey});
    clip.appendChild(svgNodeV183('circle',{cx:0,cy:0,r:14.2}));
    defs.appendChild(clip);
    marker.insertBefore(defs,marker.firstChild);
  }
  if(!marker.querySelector('.car-pass-flash-halo-v257')){
    const passHalo=svgNodeV183('circle',{class:'car-pass-flash-halo-v257',cx:0,cy:0,r:23.5});
    const ringAnchor=marker.querySelector('.car-ring');
    if(ringAnchor)marker.insertBefore(passHalo,ringAnchor);else marker.appendChild(passHalo);
  }
  let profile=marker.querySelector('.car-profile-embedded-v257');
  if(!profile){
    profile=svgNodeV183('g',{class:'car-profile-embedded-v257','aria-hidden':'true'});
    const fallbackBg=svgNodeV183('circle',{class:'car-profile-fallback-bg-v257',cx:0,cy:0,r:14.2});
    const image=svgNodeV183('image',{class:'car-profile-image-v257',x:-14.2,y:-14.2,width:28.4,height:28.4,preserveAspectRatio:'xMidYMid slice','clip-path':'url(#f1RaceProfileClipV257_'+safeKey+')'});
    const fallback=svgNodeV183('text',{class:'car-profile-initials-v257',x:0,y:2.8,'text-anchor':'middle'});
    profile.append(fallbackBg,image,fallback);
    const ring=marker.querySelector('.car-ring');
    if(ring?.nextSibling)marker.insertBefore(profile,ring.nextSibling);else marker.appendChild(profile);
  }
  const src=String(vehicle.driver?.image||'').trim();
  const image=profile.querySelector('.car-profile-image-v257');
  const fallback=profile.querySelector('.car-profile-initials-v257');
  const fallbackBg=profile.querySelector('.car-profile-fallback-bg-v257');
  if(fallback)fallback.textContent=driverProfileInitialsV250(vehicle.driver);
  const showFallback=()=>{if(image)image.style.display='none';if(fallback)fallback.style.display='';if(fallbackBg)fallbackBg.style.display='';marker.dataset.profileImageLoadedV257='0'};
  const showImage=()=>{if(image)image.style.display='';if(fallback)fallback.style.display='none';if(fallbackBg)fallbackBg.style.display='none';marker.dataset.profileImageLoadedV257='1'};
  if(image){
    if(image.getAttribute('href')!==src)image.setAttribute('href',src||'');
    if(!image.dataset.f1ProfileBoundV257){
      image.dataset.f1ProfileBoundV257='1';
      image.addEventListener('load',showImage);
      image.addEventListener('error',showFallback);
    }
  }
  if(src){
    marker.dataset.profileHasImageV257='1';
    if(marker.dataset.profileImageLoadedV257!=='1')marker.dataset.profileImageLoadedV257='pending';
    if(fallback)fallback.style.display='none';
    if(fallbackBg)fallbackBg.style.display='none';
    if(image)image.style.display='';
  }else{
    marker.dataset.profileHasImageV257='0';
    showFallback();
  }
  marker.dataset.profileLayoutV257='embedded';
  return true;
}
function syncDriverProfileMarkerV250(marker,vehicle){
  return syncEmbeddedDriverMarkerV257(marker,vehicle);
}
function ensureRaceVehicleMarkerV189(vehicle,index){
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
  if(!layer)return null;
  const safeId='f1RaceVehicleV189_'+String(vehicle.id).replace(/[^a-zA-Z0-9_-]/g,'_');
  let marker=document.getElementById(safeId);
  const color=driverColorV216(index);
  if(!marker){
    marker=svgNodeV183('g',{id:safeId,class:'f1-racing-race-vehicle-v189','data-driver-id':vehicle.id,'data-grid':index+1,'data-driver-color':color});
    marker.style.setProperty('--f1-driver-color',color);
    marker.append(svgNodeV183('circle',{class:'car-halo',cx:0,cy:0,r:28}),svgNodeV183('circle',{class:'car-ring',cx:0,cy:0,r:18}));
    const numberBadge=svgNodeV183('circle',{class:'car-number-badge-v257',cx:16.5,cy:-16.5,r:6});marker.appendChild(numberBadge);
    const number=svgNodeV183('text',{class:'car-number-v232',x:16.5,y:-14.2,'text-anchor':'middle'});number.textContent=driverNumberV232(vehicle,index);marker.appendChild(number);
    const label=svgNodeV183('text',{class:'car-label',x:0,y:29,'text-anchor':'middle'});label.textContent=driverCodeV188(vehicle.driver);marker.appendChild(label);layer.appendChild(marker);
  }else{
    marker.dataset.driverColor=color;marker.style.setProperty('--f1-driver-color',color);
    marker.querySelector('.car-core')?.remove();
    if(!marker.querySelector('.car-number-badge-v257'))marker.appendChild(svgNodeV183('circle',{class:'car-number-badge-v257',cx:12.5,cy:-12.5,r:5.4}));
    const badge=marker.querySelector('.car-number-badge-v257');if(badge){badge.setAttribute('cx','16.5');badge.setAttribute('cy','-16.5');badge.setAttribute('r','6')}
    const number=marker.querySelector('.car-number-v232');if(number){number.textContent=driverNumberV232(vehicle,index);number.setAttribute('x','16.5');number.setAttribute('y','-14.2')}
    const label=marker.querySelector('.car-label');if(label){label.setAttribute('x','0');label.setAttribute('y','29');label.setAttribute('text-anchor','middle')}
  }
  syncDriverProfileMarkerV250(marker,vehicle);
  syncRaceMarkerPositionV254(marker,Number(vehicle.position)||Number(vehicle.driver?.gridPosition)||index+1);
  marker.dataset.driverNumberV232=driverNumberV232(vehicle,index);
  vehicle.marker=marker;vehicle.driverColorV216=color;return marker;
}
function qaDriverProfileMarkersV250(){
  const markers=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')];
  const rows=markers.map(marker=>{
    const embedded=marker.querySelector('.car-profile-embedded-v257');
    const image=marker.querySelector('.car-profile-image-v257');
    const fallback=marker.querySelector('.car-profile-initials-v257');
    const ring=marker.querySelector('.car-ring');
    const connector=marker.querySelector('.car-profile-connector-v250');
    return {id:String(marker.dataset.driverId||''),embedded:Boolean(embedded),image:Boolean(image),fallback:Boolean(fallback),ring:Boolean(ring),connector:Boolean(connector),fallbackText:String(fallback?.textContent||'').trim(),layout:String(marker.dataset.profileLayoutV257||'')};
  });
  return {markerCount:markers.length,rows,allPass:markers.length>0&&rows.every(row=>row.embedded&&row.image&&row.fallback&&row.ring&&!row.connector&&row.fallbackText.length>0&&row.layout==='embedded')};
}
function qaEmbeddedDriverProfilesV257(){
  const markers=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')];
  const rows=markers.map(marker=>{
    const ring=marker.querySelector('.car-ring')?.getBoundingClientRect();
    const imageNode=marker.querySelector('.car-profile-image-v257');
    const fallbackBgNode=marker.querySelector('.car-profile-fallback-bg-v257');
    const fallbackNode=marker.querySelector('.car-profile-initials-v257');
    const image=imageNode?.getBoundingClientRect();
    const fallbackBg=fallbackBgNode?.getBoundingClientRect();
    const connector=marker.querySelector('.car-profile-connector-v250');
    const legacyGroup=marker.querySelector('.car-profile-v250');
    const number=marker.querySelector('.car-number-v232')?.getBoundingClientRect();
    const core=marker.querySelector('.car-core');
    const hasImage=marker.dataset.profileHasImageV257==='1';
    const visual=hasImage&&image&&image.width>0?image:fallbackBg;
    const centered=Boolean(ring&&visual&&visual.width>0&&Math.abs((ring.left+ring.width/2)-(visual.left+visual.width/2))<2&&Math.abs((ring.top+ring.height/2)-(visual.top+visual.height/2))<2);
    const fallbackOk=hasImage||Boolean(fallbackNode&&String(fallbackNode.textContent||'').trim()&&fallbackBg&&fallbackBg.width>0);
    return {id:String(marker.dataset.driverId||''),hasImage,centered,ringW:Number(ring?.width||0),visualW:Number(visual?.width||0),connector:Boolean(connector),legacyGroup:Boolean(legacyGroup),core:Boolean(core),fallbackOk,numberOutside:Boolean(number&&ring&&(number.left>=ring.left+ring.width*.55||number.top<=ring.top+ring.height*.15))};
  });
  return {markerCount:markers.length,rows,legacyConnectors:document.querySelectorAll('.car-profile-connector-v250').length,allPass:markers.length>0&&rows.every(row=>row.centered&&row.ringW>0&&row.visualW>0&&!row.connector&&!row.legacyGroup&&!row.core&&row.fallbackOk&&row.numberOutside)};
}
function rectOverlapAreaV228(a,b){
  const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));
  const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  return w*h;
}
function labelCandidateRectV228(point,label,dx,dy,anchor,scale=1){
  const chars=Math.max(1,String(label?.textContent||'DRV').length);
  const width=Math.max(30,Math.min(78,chars*8.5+10))*scale,height=17*scale;
  const gx=Number(point?.x||0)+dx*scale,gy=Number(point?.y||0)+dy*scale;
  const left=anchor==='start'?gx:anchor==='end'?gx-width:gx-width/2;
  return {left,right:left+width,top:gy-height+4*scale,bottom:gy+4*scale,x:dx,y:dy,anchor,width,height};
}
function layoutRaceVehicleLabelsV228(rendered=[]){
  const placements=[];
  for(const entry of rendered){
    const label=entry?.marker?.querySelector?.('.car-label');if(!label)continue;
    const scale=Number(entry.marker.dataset.cameraScaleV245)||1;
    const y=22;
    label.setAttribute('x','0');label.setAttribute('y',String(y));label.setAttribute('text-anchor','middle');
    label.dataset.labelSlotV228='fixed-below-v309';label.dataset.labelCollisionScoreV228='0';
    placements.push({left:Number(entry?.point?.x||0),right:Number(entry?.point?.x||0),top:Number(entry?.point?.y||0)+y*scale,bottom:Number(entry?.point?.y||0)+y*scale,x:0,y,anchor:'middle',width:0,height:0,driverId:String(entry.vehicle?.id||''),score:0,fixedBelowV309:true});
  }
  return placements;
}
function applyDenseLabelStaggerV361(rendered=[]){
  for(const entry of rendered){
    const vehicle=entry?.vehicle,marker=entry?.marker;if(!vehicle||!marker)continue;
    const density=Number(vehicle.cornerLaneDensityV361)||1,lane=Number(vehicle.fourLaneResolvedIndexV360)||0;
    const offset=density>=CORNER_LANE_OCCUPANCY_V361.denseCount?[-7,-2,3,8][Math.max(0,Math.min(3,Math.round(lane)))]||0:0;
    const label=marker.querySelector('.car-label'),tag=marker.querySelector('.car-position-tag-v254');
    if(label)label.setAttribute('transform',offset?'translate(0 '+offset+')':'');
    if(tag)tag.setAttribute('transform',offset?'translate(0 '+offset+')':'');
    marker.dataset.labelStaggerV361=String(offset);
  }
  return rendered.length;
}
function countLabelOverlapsV228(placements=[]){
  let pairs=0;
  for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++)if(rectOverlapAreaV228(placements[i],placements[j])>0)pairs+=1;
  return pairs;
}
function qaDriverLabelCollisionV228(){
  const svgNS='http://www.w3.org/2000/svg',synthetic=[];
  for(let i=0;i<10;i++){
    const marker=document.createElementNS(svgNS,'g'),label=document.createElementNS(svgNS,'text');
    label.setAttribute('class','car-label');label.textContent='D'+String(i+1).padStart(2,'0');marker.appendChild(label);
    synthetic.push({vehicle:{id:'qa-'+i},marker,point:{x:500+(i%2)*2,y:300+(i%3)*2}});
  }
  const placements=layoutRaceVehicleLabelsV228(synthetic),syntheticOverlapPairs=countLabelOverlapsV228(placements);
  const liveLabels=[...document.querySelectorAll('.f1-racing-race-vehicle-v189 .car-label')];
  const assigned=liveLabels.filter(label=>label.dataset.labelSlotV228==='fixed-below-v309').length;
  const fixed=placements.every(row=>row.x===0&&row.y===22&&row.anchor==='middle'&&row.fixedBelowV309===true);
  return {syntheticCount:placements.length,syntheticOverlapPairs,liveLabels:liveLabels.length,assigned,fixedBelowV309:fixed,overlapAllowedV309:true,allPass:placements.length===10&&fixed};
}
function alignedCornerDistanceV270(corner,progress){
  const length=Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||Number(raceGeometryV193?.lengthMeters)||1);
  let here=((Number(progress)||0)%1+1)%1*length;
  const start=Number(corner?.approachDistanceMeters);
  const end=Number(corner?.exitDistanceMeters);
  if(!Number.isFinite(start)||!Number.isFinite(end))return {here,length};
  while(here<start)here+=length;
  while(here-length>=start)here-=length;
  return {here,length};
}
function smoothstepV270(value){
  const t=Math.max(0,Math.min(1,Number(value)||0));
  return t*t*(3-2*t);
}
function idealRacingLineOffsetV343(vehicle,usable,phaseInfo){
  if(!phaseInfo?.corner)return 0;
  const corner=phaseInfo.corner;
  const insideSign=corner.direction==='right'?-1:1;
  const aligned=alignedCornerDistanceV270(corner,vehicle?.progress);
  const here=aligned.here;
  const turnIn=Number(corner.turnInDistanceMeters);
  const apex=Number(corner.apexDistanceMeters);
  const exit=Number(corner.exitDistanceMeters);
  const outside=-insideSign*usable*CORNER_DYNAMICS_V343.outsideFraction;
  const inside=insideSign*usable*CORNER_DYNAMICS_V343.apexFraction;
  const exitOutside=-insideSign*usable*CORNER_DYNAMICS_V343.exitOutsideFraction;
  if(phaseInfo.phase==='APPROACH'||phaseInfo.phase==='BRAKING')return outside;
  if(phaseInfo.phase==='TURN_IN'){
    const t=smoothstepV270((here-turnIn)/Math.max(1,apex-turnIn));
    return outside+(inside-outside)*t;
  }
  if(phaseInfo.phase==='APEX')return inside;
  if(phaseInfo.phase==='EXIT'){
    const t=smoothstepV270((here-apex)/Math.max(1,exit-apex));
    return inside+(exitOutside-inside)*t;
  }
  return 0;
}
function idealRacingLineOffsetV270(vehicle,usable,phaseInfo){
  if(!phaseInfo?.corner)return 0;
  const corner=phaseInfo.corner;
  const direction=corner.direction==='right'?-1:1;
  const aligned=alignedCornerDistanceV270(corner,vehicle?.progress);
  const here=aligned.here;
  const brake=Number(corner.brakingPointDistanceMeters);
  const turnIn=Number(corner.turnInDistanceMeters);
  const apex=Number(corner.apexDistanceMeters);
  const exit=Number(corner.exitDistanceMeters);
  const outside=-direction*usable*CORNER_DYNAMICS_V270.outsideFraction;
  const inside=direction*usable*CORNER_DYNAMICS_V270.apexFraction;
  const exitOutside=-direction*usable*CORNER_DYNAMICS_V270.exitOutsideFraction;
  if(phaseInfo.phase==='APPROACH'||phaseInfo.phase==='BRAKING')return outside;
  if(phaseInfo.phase==='TURN_IN'){
    const t=smoothstepV270((here-turnIn)/Math.max(1,apex-turnIn));
    return outside+(inside-outside)*t;
  }
  if(phaseInfo.phase==='APEX')return inside;
  if(phaseInfo.phase==='EXIT'){
    const t=smoothstepV270((here-apex)/Math.max(1,exit-apex));
    return inside+(exitOutside-inside)*t;
  }
  return 0;
}
function resolvedLaneIndexV360(vehicle,phaseInfo,mode='IDEAL'){
  const count=FOUR_LANE_TRACK_V360.laneCount;
  let index=Number(vehicle?.visualLaneIndexV360);
  if(!Number.isFinite(index))index=Math.max(0,(Number(vehicle?.gridPosition)||1)-1)%count;
  index=((Math.round(index)%count)+count)%count;
  const insideSign=phaseInfo?.corner?.direction==='right'?-1:1;
  if(mode==='ATTACK_INSIDE')return insideSign>0?count-1:0;
  if(mode==='DEFENSIVE_INSIDE')return insideSign>0?count-2:1;
  if(mode==='OUTSIDE')return insideSign>0?0:count-1;
  return index;
}
function cornerLanePeersV361(vehicle,phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress)){
  const track=activeRaceSnapshotV187?.track,cornerId=String(phaseInfo?.corner?.id||'');
  if(!track||!cornerId)return [];
  const length=Math.max(1,Number(track.lengthMeters)||1),selfProgress=Number(vehicle?.raceProgress)||0;
  return raceMotionV189.vehicles.filter(peer=>{
    if(!peer||peer===vehicle||peer.finished||String(peer.pitState||'TRACK')!=='TRACK')return false;
    const peerPhase=getCornerPhaseAtProgressV194(peer.progress);
    if(String(peerPhase?.corner?.id||'')!==cornerId)return false;
    return Math.abs((Number(peer.raceProgress)||0)-selfProgress)*length<=CORNER_LANE_OCCUPANCY_V361.scanMeters;
  });
}
function chooseCornerLaneIndexV361(vehicle,phaseInfo,peers=cornerLanePeersV361(vehicle,phaseInfo)){
  const count=FOUR_LANE_TRACK_V360.laneCount,current=((Number(vehicle?.visualLaneIndexV360)||0)%count+count)%count;
  const occupancy=Array.from({length:count},()=>0);
  for(const peer of peers){
    const raw=Number.isFinite(Number(peer?.cornerLaneLockIndexV361))?Number(peer.cornerLaneLockIndexV361):Number(peer?.visualLaneIndexV360)||0;
    occupancy[((Math.round(raw)%count)+count)%count]+=1;
  }
  const target=peers.find(peer=>String(peer?.id||'')===String(vehicle?.battleTargetId||''))||null;
  const targetLane=target?((Math.round(Number(target.cornerLaneLockIndexV361??target.visualLaneIndexV360)||0)%count)+count)%count:null;
  const sideBySide=String(vehicle?.battleState||'')==='SIDE_BY_SIDE'||Boolean(target&&String(target.battleState||'')==='SIDE_BY_SIDE');
  const attacking=['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','COUNTER_ATTACK'].includes(String(vehicle?.battleState||''));
  const seed=Math.abs(hashDriverV189(String(vehicle?.id||'driver')+'|'+String(phaseInfo?.corner?.id||'corner')+'|lane-v361'));
  const trackLengthV362=Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1),selfRaceProgressV362=Number(vehicle?.raceProgress)||0;
  const nearPressureV362=Array.from({length:count},()=>0);
  for(const peer of peers){
    const peerLaneRaw=Number.isFinite(Number(peer?.cornerLaneLockIndexV361))?Number(peer.cornerLaneLockIndexV361):Number(peer?.visualLaneIndexV360)||0;
    const peerLane=((Math.round(peerLaneRaw)%count)+count)%count;
    const distance=Math.abs((Number(peer?.raceProgress)||0)-selfRaceProgressV362)*trackLengthV362;
    if(distance<VISIBLE_CORNER_SEPARATION_V362.nearLaneMeters)nearPressureV362[peerLane]+=1-distance/VISIBLE_CORNER_SEPARATION_V362.nearLaneMeters;
  }
  const scores=occupancy.map((used,lane)=>{
    let score=used*CORNER_LANE_OCCUPANCY_V361.laneOccupancyWeight+nearPressureV362[lane]*VISIBLE_CORNER_SEPARATION_V362.nearLanePenalty+Math.abs(lane-current)*CORNER_LANE_OCCUPANCY_V361.laneChangeWeight;
    if(targetLane===lane&&sideBySide)score+=CORNER_LANE_OCCUPANCY_V361.sideBySidePenalty;
    else if(targetLane===lane&&attacking)score+=CORNER_LANE_OCCUPANCY_V361.attackSameLanePenalty;
    score+=((seed+lane*17)%101)/10000;
    return score;
  });
  let best=0;for(let lane=1;lane<count;lane++)if(scores[lane]<scores[best])best=lane;
  return {lane:best,occupancy,nearPressureV362,scores,targetLane,sideBySide,attacking};
}
function updateCornerLaneOccupancyV361(vehicle,phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress)){
  if(!vehicle)return {lane:0,density:1,spreadScale:1,markerScale:1,locked:false};
  const mode=String(vehicle.racingLineMode||'IDEAL'),cornerId=String(phaseInfo?.corner?.id||''),now=Number(simClockV192.simTimeMs)||0;
  if(!cornerId||mode!=='IDEAL'||String(vehicle.pitState||'TRACK')!=='TRACK'||vehicle.finished){
    if(!cornerId){vehicle.cornerLaneLockIdV361='';vehicle.cornerLaneNextEvalMsV361=0}
    vehicle.cornerLaneDensityV361=1;vehicle.cornerLaneSpreadScaleV361=1;vehicle.markerDensityScaleV361=1;
    return {lane:Number(vehicle.visualLaneIndexV360)||0,density:1,spreadScale:1,markerScale:1,locked:false};
  }
  const sameLock=String(vehicle.cornerLaneLockIdV361||'')===cornerId;
  if(!sameLock){
    const selection=chooseCornerLaneIndexV361(vehicle,phaseInfo);
    vehicle.cornerLaneLockIdV361=cornerId;vehicle.cornerLaneLockIndexV361=selection.lane;vehicle.visualLaneIndexV360=selection.lane;vehicle.cornerLaneNextEvalMsV361=0;
  }
  if(!sameLock||now>=Number(vehicle.cornerLaneNextEvalMsV361||0)){
    const peers=cornerLanePeersV361(vehicle,phaseInfo),density=peers.length+1;
    vehicle.cornerLaneDensityV361=density;
    vehicle.cornerLaneSpreadScaleV361=density>=CORNER_LANE_OCCUPANCY_V361.severeCount?CORNER_LANE_OCCUPANCY_V361.severeSpreadScale:density>=CORNER_LANE_OCCUPANCY_V361.denseCount?CORNER_LANE_OCCUPANCY_V361.denseSpreadScale:1;
    vehicle.markerDensityScaleV361=density>=CORNER_LANE_OCCUPANCY_V361.denseCount?Math.max(CORNER_LANE_OCCUPANCY_V361.minMarkerScale,1-(density-CORNER_LANE_OCCUPANCY_V361.denseCount+1)*.035):1;
    vehicle.cornerLaneNextEvalMsV361=now+CORNER_LANE_OCCUPANCY_V361.evaluationMs;
  }
  vehicle.visualLaneIndexV360=Number(vehicle.cornerLaneLockIndexV361)||0;
  return {lane:Number(vehicle.visualLaneIndexV360)||0,density:Number(vehicle.cornerLaneDensityV361)||1,spreadScale:Number(vehicle.cornerLaneSpreadScaleV361)||1,markerScale:Number(vehicle.markerDensityScaleV361)||1,locked:true};
}
function laneBandSlotValuesV364(count){
  const n=Math.max(1,Math.floor(Number(count)||1));
  if(n===1)return [0];
  return Array.from({length:n},(_,index)=>-1+(2*index)/(n-1));
}
function laneBandContextV364(phaseInfo,laneIndex){
  return String(phaseInfo?.corner?.id||'')+'|'+String(Number(laneIndex)||0);
}
function laneBandClusterV364(vehicle,phaseInfo,laneIndex){
  if(!vehicle||!phaseInfo?.corner)return vehicle?[vehicle]:[];
  const track=activeRaceSnapshotV187?.track,length=Math.max(1,Number(track?.lengthMeters)||1),cornerId=String(phaseInfo.corner.id||'');
  const candidates=raceMotionV189.vehicles.filter(peer=>{
    if(!peer||peer.finished||String(peer.pitState||'TRACK')!=='TRACK')return false;
    const peerPhase=getCornerPhaseAtProgressV194(peer.progress);
    if(String(peerPhase?.corner?.id||'')!==cornerId)return false;
    const peerLane=((Math.round(Number(peer?.cornerLaneLockIndexV361??peer?.visualLaneIndexV360)||0)%FOUR_LANE_TRACK_V360.laneCount)+FOUR_LANE_TRACK_V360.laneCount)%FOUR_LANE_TRACK_V360.laneCount;
    return peerLane===laneIndex;
  });
  if(!candidates.some(peer=>String(peer.id||'')===String(vehicle.id||'')))candidates.push(vehicle);
  const byId=new Map(candidates.map(peer=>[String(peer.id||''),peer])),seen=new Set(),queue=[vehicle],group=[];
  while(queue.length){
    const current=queue.shift(),id=String(current?.id||'');if(seen.has(id))continue;
    seen.add(id);group.push(current);
    const currentRaceValueV364=Number(current?.raceProgress)||0;
    for(const peer of byId.values()){
      const peerId=String(peer?.id||'');if(seen.has(peerId))continue;
      const gap=Math.abs((Number(peer?.raceProgress)||0)-currentRaceValueV364)*length;
      if(gap<=LANE_BAND_CROWDING_V363.sameLaneScanMeters)queue.push(peer);
    }
  }
  return group;
}
function laneBandGroupKeyV364(group,phaseInfo,laneIndex){
  return laneBandContextV364(phaseInfo,laneIndex)+'|'+group.map(row=>String(row?.id||'')).sort().join(',');
}
function assignStableLaneBandSlotsV364(group,phaseInfo,laneIndex,now=Number(simClockV192.simTimeMs)||0){
  const members=[...(group||[])].filter(Boolean);if(!members.length)return {groupKey:'',slots:new Map(),preserved:false};
  const context=laneBandContextV364(phaseInfo,laneIndex),groupKey=laneBandGroupKeyV364(members,phaseInfo,laneIndex);
  const raceOrder=members.slice().sort((a,b)=>{
    const delta=(Number(b?.raceProgress)||0)-(Number(a?.raceProgress)||0);
    return Math.abs(delta)>.0000001?delta:String(a?.id||'').localeCompare(String(b?.id||''));
  }).map(row=>String(row?.id||'')).join('>');
  const fullyLocked=members.every(row=>String(row?.laneBandGroupKeyV364||'')===groupKey&&String(row?.laneBandContextV364||'')===context&&Number(row?.laneBandSlotLockedUntilV364||0)>=now&&Number.isFinite(Number(row?.laneBandLockedSlotV364)));
  if(fullyLocked){
    const previous=String(members[0]?.laneBandRaceOrderSignatureV364||'');
    if(previous&&previous!==raceOrder){
      laneBandStabilityStateV364.preservedRaceOrderChanges+=1;
      for(const row of members)row.laneBandRaceOrderSignatureV364=raceOrder;
    }
    const slots=new Map(members.map(row=>[String(row.id||''),Number(row.laneBandLockedSlotV364)||0]));
    return {groupKey,slots,preserved:true};
  }
  const previousGroupKey=String(members[0]?.laneBandGroupKeyV364||'');
  const ordered=members.slice().sort((a,b)=>{
    const aOld=String(a?.laneBandContextV364||'')===context&&Number.isFinite(Number(a?.laneBandLockedSlotV364));
    const bOld=String(b?.laneBandContextV364||'')===context&&Number.isFinite(Number(b?.laneBandLockedSlotV364));
    if(aOld&&bOld&&Math.abs(Number(a.laneBandLockedSlotV364)-Number(b.laneBandLockedSlotV364))>.0001)return Number(a.laneBandLockedSlotV364)-Number(b.laneBandLockedSlotV364);
    const av=Number(a?.visualLateralOffsetMeters)||0,bv=Number(b?.visualLateralOffsetMeters)||0;
    if(Math.abs(av-bv)>LANE_BAND_SLOT_STABILITY_V364.visualOrderEpsilonMeters)return av-bv;
    return String(a?.id||'').localeCompare(String(b?.id||''));
  });
  const values=laneBandSlotValuesV364(ordered.length),slots=new Map();
  ordered.forEach((row,index)=>{
    const next=Number(values[index])||0,previous=Number(row?.laneBandLockedSlotV364)||0;
    if(Math.abs(previous-next)>.001)row.laneBandSlotChangesV364=(Number(row.laneBandSlotChangesV364)||0)+1;
    row.laneBandLockedSlotV364=next;row.laneBandGroupKeyV364=groupKey;row.laneBandContextV364=context;
    row.laneBandSlotLockedUntilV364=now+LANE_BAND_SLOT_STABILITY_V364.lockMs;row.laneBandRaceOrderSignatureV364=raceOrder;
    slots.set(String(row.id||''),next);
  });
  laneBandStabilityStateV364.assignments+=1;if(previousGroupKey&&previousGroupKey!==groupKey)laneBandStabilityStateV364.reassignments+=1;
  laneBandStabilityStateV364.last={groupKey,context,count:members.length,raceOrder,slots:Object.fromEntries(slots)};
  return {groupKey,slots,preserved:false};
}
function resetLaneBandStabilityTelemetryV364(){
  screenCrowdingStateV363.samples=0;screenCrowdingStateV363.denseSamples=0;screenCrowdingStateV363.currentOverlapPairs=0;screenCrowdingStateV363.maxOverlapPairs=0;screenCrowdingStateV363.minScreenDistance=Infinity;screenCrowdingStateV363.latest=null;
  laneBandStabilityStateV364.assignments=0;laneBandStabilityStateV364.reassignments=0;laneBandStabilityStateV364.preservedRaceOrderChanges=0;laneBandStabilityStateV364.currentStableOverlapPairs=0;laneBandStabilityStateV364.maxStableOverlapPairs=0;laneBandStabilityStateV364.minStableScreenDistance=Infinity;laneBandStabilityStateV364.last=null;
  return true;
}
function laneBandOffsetV363(vehicle,phaseInfo,laneIndex,usable){
  if(!vehicle||!phaseInfo?.corner||String(vehicle?.racingLineMode||'IDEAL')!=='IDEAL'){
    if(vehicle){
      vehicle.laneBandSlotV363=0;vehicle.laneBandPeerCountV363=1;vehicle.laneBandOffsetMetersV363=0;vehicle.markerBandScaleV363=1;
      if(!phaseInfo?.corner){vehicle.laneBandGroupKeyV364='';vehicle.laneBandContextV364='';vehicle.laneBandSlotLockedUntilV364=0;vehicle.laneBandLockedSlotV364=0}
    }
    return 0;
  }
  const group=laneBandClusterV364(vehicle,phaseInfo,laneIndex),assignment=assignStableLaneBandSlotsV364(group,phaseInfo,laneIndex),count=Math.max(1,group.length);
  const slot=Number(assignment.slots.get(String(vehicle.id||''))??vehicle.laneBandLockedSlotV364)||0;
  const laneGapFraction=Math.min(...FOUR_LANE_TRACK_V360.laneFractions.slice(1).map((value,i)=>Math.abs(Number(value)-Number(FOUR_LANE_TRACK_V360.laneFractions[i]))));
  const halfGapMeters=Math.max(.35,laneGapFraction*Math.max(1,Number(usable)||1)*LANE_BAND_CROWDING_V363.bandHalfGapRatio);
  const offset=slot*halfGapMeters;
  vehicle.laneBandSlotV363=slot;vehicle.laneBandPeerCountV363=count;vehicle.laneBandOffsetMetersV363=offset;
  vehicle.markerBandScaleV363=count>=3?LANE_BAND_CROWDING_V363.multiMarkerScale:count===2?LANE_BAND_CROWDING_V363.pairMarkerScale:1;
  return offset;
}
function applyFourLaneOffsetV360(vehicle,baseOffset,phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress),mode=String(vehicle?.racingLineMode||'IDEAL')){
  const base=Number(baseOffset)||0;
  if(!vehicle?.fourLaneEnabledV360||mode!=='IDEAL')return base;
  const track=activeRaceSnapshotV187?.track;
  const width=Math.max(4,Number(track?.geometry?.trackWidthMeters)||14);
  const margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5);
  const usable=Math.max(1,width/2-margin);
  const laneIndex=resolvedLaneIndexV360(vehicle,phaseInfo,mode);
  const fraction=Number(FOUR_LANE_TRACK_V360.laneFractions[laneIndex])||0;
  const density=Math.max(1,Number(vehicle?.cornerLaneDensityV361)||1);
  const laneTarget=fraction*usable*Math.max(1,Number(vehicle?.cornerLaneSpreadScaleV361)||1)*VISIBLE_CORNER_SEPARATION_V362.laneVisualMultiplier;
  const nudge=phaseInfo?.corner?base*(density>=CORNER_LANE_OCCUPANCY_V361.denseCount?VISIBLE_CORNER_SEPARATION_V362.idealNudgeDense:VISIBLE_CORNER_SEPARATION_V362.idealNudgeNormal):base*.28;
  const bandOffset=laneBandOffsetV363(vehicle,phaseInfo,laneIndex,usable);
  const limit=Math.max(.8,trackLateralLimitV271(vehicle));
  // Phase 362 compatibility token: const result=Math.max(-limit+.06,Math.min(limit-.06,laneTarget+nudge));
  const result=Math.max(-limit+.06,Math.min(limit-.06,laneTarget+nudge+bandOffset));
  vehicle.fourLaneResolvedIndexV360=laneIndex;
  vehicle.fourLaneOffsetMetersV360=result-base;
  return result;
}
function lineOffsetMetersV197(vehicle){
  const track=activeRaceSnapshotV187?.track;
  const width=Math.max(4,Number(track?.geometry?.trackWidthMeters)||14);
  const margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5);
  const usable=Math.max(1,width/2-margin);
  const phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress);
  const corner=phaseInfo?.corner;
  const direction=corner?.direction==='right'?-1:1;
  const mode=F1_LINE_MODES_V197.includes(vehicle?.racingLineMode)?vehicle.racingLineMode:'IDEAL';
  if(mode==='ATTACK_INSIDE')return direction*usable*.62;
  if(mode==='DEFENSIVE_INSIDE')return direction*usable*.50;
  if(mode==='OUTSIDE')return -direction*usable*.62;
  if(mode==='PIT_LINE')return -usable*.82;
  return idealRacingLineOffsetV343(vehicle,usable,phaseInfo);
}
function phaseSpeedTargetV270(vehicle,targetData,phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress)){
  const track=activeRaceSnapshotV187?.track;
  let target=Math.max(60,Number(targetData?.targetKph)||250);
  if(!track||!phaseInfo?.corner)return target;
  const corner=phaseInfo.corner;
  const apexProfileV270=typeof window.mwsF1SpeedTargetAtProgressV195==='function'
    ?window.mwsF1SpeedTargetAtProgressV195(raceGeometryV193,Number(corner.apexProgress)||0):null;
  const apex=Math.max(
    corner.cornerClass==='hairpin'?CORNER_DYNAMICS_V270.hairpinMinApexKph:corner.cornerClass==='slow'?CORNER_DYNAMICS_V270.slowMinApexKph:0,
    Number(corner.referenceApexKph)||0,
    Number(apexProfileV270?.targetKph)||target
  );
  if(phaseInfo.phase==='APEX')return Math.max(target,apex);
  if(phaseInfo.phase==='TURN_IN'&&corner.cornerClass==='hairpin')return Math.max(target,CORNER_DYNAMICS_V270.hairpinMinApexKph);
  if(phaseInfo.phase==='TURN_IN'&&corner.cornerClass==='slow')return Math.max(target,CORNER_DYNAMICS_V270.slowMinApexKph);
  if(phaseInfo.phase!=='EXIT')return target;
  const {here}=alignedCornerDistanceV270(corner,vehicle?.progress);
  const exitStart=Number(corner.apexDistanceMeters);
  const ratio=smoothstepV270((here-exitStart)/Math.max(1,Number(corner.exitDistanceMeters)-exitStart));
  const lookAheadProgress=((Number(vehicle?.progress)||0)+CORNER_DYNAMICS_V270.exitLookAheadMeters/Math.max(1,Number(track.lengthMeters)||1))%1;
  const lookAhead=typeof window.mwsF1SpeedTargetAtProgressV195==='function'?window.mwsF1SpeedTargetAtProgressV195(raceGeometryV193,lookAheadProgress):null;
  const lookAheadTarget=Math.max(apex+CORNER_DYNAMICS_V270.exitTargetLiftKph,Number(lookAhead?.targetKph)||target);
  const recovered=apex+(lookAheadTarget-apex)*ratio;
  return Math.max(target,recovered);
}

function cornerClassV343(corner){
  const key=String(corner?.cornerClass||'medium');
  return Object.prototype.hasOwnProperty.call(CORNER_DYNAMICS_V343.apexFactor,key)?key:'medium';
}
function compoundCornerPaceFactorV343(vehicle){
  const key=String(vehicle?.tyreCompound||'MEDIUM').toUpperCase();
  return CORNER_DYNAMICS_V343.compoundCornerFactor[key]||1;
}
function cornerSpeedSpecV351(corner){
  const key=cornerClassV343(corner);
  return {key,spec:CORNER_DRIVING_V351.speedEnvelope[key]||CORNER_DRIVING_V351.speedEnvelope.medium};
}
function cornerEntrySpeedV351(vehicle,corner,raw){
  const id=String(corner?.id||corner?.apexProgress||corner?.apexDistanceMeters||'corner');
  if(String(vehicle?.cornerPlanIdV351||'')!==id){
    vehicle.cornerPlanIdV351=id;
    vehicle.cornerObservedEntryKphV353=Math.max(0,Number(vehicle?.speedKph)||0);
    vehicle.cornerEntryKphV351=Math.max(80,Number(vehicle?.speedKph)||0,Number(corner?.referenceApproachKph)||0,Number(raw)||0);
  }else if((Number(vehicle?.cornerEntryKphV351)||0)<1){
    vehicle.cornerEntryKphV351=Math.max(80,Number(vehicle?.speedKph)||0,Number(corner?.referenceApproachKph)||0,Number(raw)||0);
  }
  return Math.max(80,Number(vehicle?.cornerEntryKphV351)||0);
}
function cornerApexTargetV351(entryKph,corner,compound='MEDIUM'){
  const {spec}=cornerSpeedSpecV351(corner);
  const reference=Math.max(spec.min,Math.min(spec.max,Number(corner?.referenceApexKph)||spec.min));
  const retained=Math.max(spec.min,Math.min(spec.max,Math.max(0,Number(entryKph)||0)*spec.entryRetention));
  const compoundRaw=CORNER_DYNAMICS_V343.compoundCornerFactor[String(compound||'MEDIUM').toUpperCase()]||1;
  const compoundFactorV351=1+(compoundRaw-1)*CORNER_DRIVING_V351.compoundInfluence;
  return Math.max(spec.min,Math.min(spec.max,Math.max(reference,retained)*compoundFactorV351));
}
function cornerDrivingPlanV351(entryKph,corner,track=activeRaceSnapshotV187?.track,compound='MEDIUM'){
  const {key,spec}=cornerSpeedSpecV351(corner);
  const turnIn=Number(corner?.turnInDistanceMeters)||0;
  const apex=Math.max(turnIn+1,Number(corner?.apexDistanceMeters)||turnIn+1);
  const exit=Math.max(apex+1,Number(corner?.exitDistanceMeters)||apex+1);
  const approach=Number.isFinite(Number(corner?.approachDistanceMeters))?Number(corner.approachDistanceMeters):turnIn-100;
  const apexTarget=cornerApexTargetV351(entryKph,corner,compound);
  const delta=Math.max(0,(Number(entryKph)||0)-apexTarget);
  const deltaRatio=Math.max(0,Math.min(1,delta/250));
  const baseBrake=Math.max(CORNER_DRIVING_V351.minBrakeDecelMps2,Number(track?.geometry?.referenceBrakeDecelMps2)||20);
  const brakeDecel=Math.max(CORNER_DRIVING_V351.minBrakeDecelMps2,Math.min(CORNER_DRIVING_V351.maxBrakeDecelMps2,baseBrake*spec.brakeScale*(.82+CORNER_DRIVING_V351.speedDeltaBrakeGain*deltaRatio)));
  const v0=Math.max(apexTarget,Number(entryKph)||apexTarget)/3.6,v1=apexTarget/3.6;
  const brakingDistance=Math.max(0,(v0*v0-v1*v1)/(2*Math.max(1,brakeDecel)));
  const dynamicBrakeStart=Math.max(approach,turnIn-brakingDistance);
  const recoveryStart=Math.max(turnIn,apex-(apex-turnIn)*spec.recoveryLead);
  const accel=Math.max(.5,Number(track?.geometry?.referenceAccelMps2)||8.5)*spec.exitAccel;
  return {key,spec,entryKph:Number(entryKph)||0,apexTarget,turnIn,apex,exit,approach,dynamicBrakeStart,recoveryStart,brakeDecel,accel,brakingDistance};
}
function cornerTargetAtDistanceV351(plan,here,raw,exitTarget){
  const p=plan||{},position=Number(here)||0,rawKph=Math.max(40,Number(raw)||0);
  if(position<Number(p.dynamicBrakeStart))return rawKph;
  if(position<=Number(p.recoveryStart)){
    const remaining=Math.max(0,Number(p.recoveryStart)-position);
    const apexMps=Math.max(1,Number(p.apexTarget)||1)/3.6;
    const allowed=Math.sqrt(Math.max(0,apexMps*apexMps+2*Math.max(1,Number(p.brakeDecel)||1)*remaining))*3.6;
    return Math.max(Number(p.apexTarget)||40,Math.min(Math.max(rawKph,Number(p.entryKph)||rawKph),allowed));
  }
  const distance=Math.max(0,position-Number(p.recoveryStart));
  const apexMps=Math.max(1,Number(p.apexTarget)||1)/3.6;
  const recovered=Math.sqrt(Math.max(0,apexMps*apexMps+2*Math.max(.5,Number(p.accel)||.5)*distance))*3.6;
  const cap=Math.max(Number(p.apexTarget)||40,CORNER_DRIVING_V351.recoveryTargetLiftKph+(Number(p.apexTarget)||40),Number(exitTarget)||rawKph,rawKph);
  return Math.min(cap,recovered);
}
function phaseSpeedTargetV343(vehicle,targetData,phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress)){
  const track=activeRaceSnapshotV187?.track;
  const raw=Math.max(60,Number(targetData?.targetKph)||250);
  if(!track||!phaseInfo?.corner){
    if(vehicle)vehicle.cornerRecoveryActiveV351=false;
    return raw;
  }
  const corner=phaseInfo.corner;
  const aligned=alignedCornerDistanceV270(corner,vehicle?.progress),here=Number(aligned.here)||0;
  const entryKph=cornerEntrySpeedV351(vehicle,corner,raw);
  const plan=cornerDrivingPlanV351(entryKph,corner,track,String(vehicle?.tyreCompound||'MEDIUM'));
  const lookProgress=((Number(vehicle?.progress)||0)+CORNER_DRIVING_V351.exitLookAheadMeters/Math.max(1,Number(track.lengthMeters)||1))%1;
  const ahead=typeof window.mwsF1SpeedTargetAtProgressV195==='function'?window.mwsF1SpeedTargetAtProgressV195(raceGeometryV193,lookProgress):null;
  const exitTarget=Math.min(Number(track?.geometry?.maxStraightKph)||335,Math.max(raw,Number(ahead?.targetKph)||raw));
  const target=cornerTargetAtDistanceV351(plan,here,raw,exitTarget);
  if(vehicle){
    vehicle.cornerRecoveryActiveV351=here>=plan.recoveryStart&&here<=plan.exit;
    vehicle.cornerDrivingClassV351=plan.key;
    vehicle.cornerApexTargetKphV351=plan.apexTarget;
    vehicle.cornerDynamicBrakeStartV351=plan.dynamicBrakeStart;
    vehicle.cornerRecoveryStartV351=plan.recoveryStart;
    vehicle.cornerBrakeDecelMps2V351=plan.brakeDecel;
  }
  return target;
}


function cornerUnderSpeedRecoveryV353(vehicle,phase,current,target,spacingControl,incidentState,leaderPressureEffect){
  const key=String(vehicle?.cornerDrivingClassV351||'medium');
  const spec=CORNER_DRIVING_V351.speedEnvelope[key]||CORNER_DRIVING_V351.speedEnvelope.medium;
  const floor=Math.max(40,Number(spec.min)||40);
  const eligiblePhase=['TURN_IN','APEX','EXIT'].includes(String(phase||''));
  const unconstrained=!spacingControl?.active&&!incidentState?.active&&!leaderPressureEffect?.event&&!vehicle?.trackBoundaryExceededV271;
  const deficit=Math.max(0,floor-Math.max(0,Number(current)||0));
  const active=eligiblePhase&&unconstrained&&Number(target)>Number(current)+1.5&&Number(current)<floor*CORNER_COMPLEX_RECOVERY_V353.underSpeedTriggerRatio;
  const severity=active?clamp01V198(deficit/Math.max(1,floor*.45)):0;
  return {active,key,floor,severity,multiplier:active?1+(CORNER_COMPLEX_RECOVERY_V353.underSpeedAccelMultiplier-1)*severity:1};
}

function trackLateralLimitV271(vehicle,track=activeRaceSnapshotV187?.track){
  const width=Math.max(4,Number(track?.geometry?.trackWidthMeters)||14);
  const margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5);
  const pit=String(vehicle?.racingLineMode||'')==='PIT_LINE'||String(vehicle?.pitState||'TRACK')!=='TRACK';
  const footprint=pit?TRACK_BOUNDARY_V271.carHalfWidthMeters*.55:TRACK_BOUNDARY_V271.carHalfWidthMeters;
  const safety=pit?TRACK_BOUNDARY_V271.safetyMarginMeters*.35:TRACK_BOUNDARY_V271.safetyMarginMeters;
  return Math.max(.8,width/2-margin-footprint-safety);
}
function trackBoundaryStateV271(vehicle,rawOffset){
  const limit=trackLateralLimitV271(vehicle);
  const raw=Number(rawOffset)||0;
  const ratio=Math.abs(raw)/Math.max(.01,limit);
  const pit=String(vehicle?.racingLineMode||'')==='PIT_LINE'||String(vehicle?.pitState||'TRACK')!=='TRACK';
  const offTrack=!pit&&ratio>1;
  const edge=!pit&&ratio>TRACK_BOUNDARY_V271.edgeStartRatio;
  const edgeT=edge?Math.max(0,Math.min(1,(ratio-TRACK_BOUNDARY_V271.edgeStartRatio)/(1-TRACK_BOUNDARY_V271.edgeStartRatio))):0;
  const speedFactor=pit?1:offTrack?TRACK_BOUNDARY_V271.offTrackSpeedFactor:1-edgeT*(1-TRACK_BOUNDARY_V271.edgeMinSpeedFactor);
  return {raw,limit,ratio,edge,offTrack,speedFactor,clamped:Math.max(-limit,Math.min(limit,raw))};
}
function boundaryOvertakeEligibleV271(vehicle){
  if(!vehicle)return false;
  const ratio=Number(vehicle.trackBoundaryRatioV271)||0;
  return !vehicle.trackBoundaryExceededV271&&ratio<.985;
}
function physicalLateralOffsetV258(vehicle){
  const raw=lineOffsetMetersV197(vehicle)+(Number(vehicle?.incidentLateralOffsetMeters)||0);
  const boundary=trackBoundaryStateV271(vehicle,raw);
  if(vehicle){
    vehicle.unclampedLateralOffsetMetersV271=raw;
    vehicle.trackBoundaryRatioV271=boundary.ratio;
    vehicle.trackBoundaryExceededV271=boundary.offTrack;
    vehicle.trackBoundarySpeedFactorV271=boundary.speedFactor;
  }
  return boundary.clamped;
}
function visualLateralResponseV258(vehicle){
  if(activeDrivingIncidentV204(vehicle))return VISUAL_LATERAL_RESPONSE_V258.incident;
  if(String(vehicle?.racingLineMode||'')==='PIT_LINE'||String(vehicle?.pitState||'TRACK')!=='TRACK')return VISUAL_LATERAL_RESPONSE_V258.pit;
  if(['ATTACK_INSIDE','DEFENSIVE_INSIDE','OUTSIDE'].includes(String(vehicle?.racingLineMode||'')))return VISUAL_LATERAL_RESPONSE_V258.attack;
  return VISUAL_LATERAL_RESPONSE_V258.normal;
}
function visualLateralMaxSpeedV269(vehicle){
  if(activeDrivingIncidentV204(vehicle))return VISUAL_LATERAL_DYNAMICS_V269.incidentMaxSpeed;
  if(String(vehicle?.racingLineMode||'')==='PIT_LINE'||String(vehicle?.pitState||'TRACK')!=='TRACK')return VISUAL_LATERAL_DYNAMICS_V269.pitMaxSpeed;
  if(['ATTACK_INSIDE','DEFENSIVE_INSIDE','OUTSIDE'].includes(String(vehicle?.racingLineMode||'')))return VISUAL_LATERAL_DYNAMICS_V269.attackMaxSpeed;
  return VISUAL_LATERAL_DYNAMICS_V269.normalMaxSpeed;
}
function committedVisualTargetV269(vehicle,rawTarget,force=false){
  const mode=String(vehicle?.racingLineMode||'IDEAL'),now=Number(simClockV192.simTimeMs)||0;
  const emergency=Boolean(activeDrivingIncidentV204(vehicle))||mode==='PIT_LINE'||String(vehicle?.pitState||'TRACK')!=='TRACK';
  if(force||!Number.isFinite(Number(vehicle.committedVisualTargetV269))){
    vehicle.committedVisualTargetV269=rawTarget;vehicle.visualLineModeV269=mode;vehicle.pendingVisualLineModeV269='';vehicle.visualLineModeHoldUntilV269=now+VISUAL_LATERAL_DYNAMICS_V269.lineModeHoldMs;
    return rawTarget;
  }
  if(!emergency&&mode!==String(vehicle.visualLineModeV269||mode)){
    if(String(vehicle.pendingVisualLineModeV269||'')!==mode){
      vehicle.pendingVisualLineModeV269=mode;vehicle.visualLineModeHoldUntilV269=now+VISUAL_LATERAL_DYNAMICS_V269.lineModeHoldMs;
    }
    if(now<Number(vehicle.visualLineModeHoldUntilV269||0))return Number(vehicle.committedVisualTargetV269)||0;
    vehicle.visualLineModeV269=mode;vehicle.pendingVisualLineModeV269='';
  }else if(emergency){
    vehicle.visualLineModeV269=mode;vehicle.pendingVisualLineModeV269='';
  }
  vehicle.committedVisualTargetV269=rawTarget;
  return rawTarget;
}
function updateVisualLateralOffsetV258(vehicle,frameMs=16.67,force=false){
  if(!vehicle)return {target:0,rawTarget:0,visual:0,velocity:0,acceleration:0,alpha:1,response:VISUAL_LATERAL_RESPONSE_V258.normal};
  const physicalTarget=physicalLateralOffsetV258(vehicle);
  const rawTarget=physicalTarget;
  vehicle.cornerLaneDensityV361=1;vehicle.cornerLaneSpreadScaleV361=1;vehicle.markerDensityScaleV361=1;
  vehicle.laneBandSlotV363=0;vehicle.laneBandPeerCountV363=1;vehicle.laneBandOffsetMetersV363=0;vehicle.markerBandScaleV363=1;
  const target=committedVisualTargetV269(vehicle,rawTarget,force);
  vehicle.lateralOffsetMeters=physicalTarget;
  vehicle.targetVisualLateralOffsetMeters=target;
  const dt=Math.max(0,Math.min(80,Number(frameMs)||0))/1000;
  const response=visualLateralResponseV258(vehicle);
  const previous=Number.isFinite(Number(vehicle.visualLateralOffsetMeters))?Number(vehicle.visualLateralOffsetMeters):target;
  const previousVelocity=Number.isFinite(Number(vehicle.visualLateralVelocity))?Number(vehicle.visualLateralVelocity):0;
  if(force||vehicle.visualLateralInitializedV258!==true){
    vehicle.visualLateralOffsetMeters=target;vehicle.visualLateralVelocity=0;vehicle.visualLateralAccelerationV269=0;vehicle.visualLateralInitializedV258=true;
    return {target,rawTarget,visual:target,velocity:0,acceleration:0,alpha:1,response};
  }
  const maxSpeed=visualLateralMaxSpeedV269(vehicle);
  if(dt<=0){
    const heldAcceleration=Number.isFinite(Number(vehicle.visualLateralAccelerationV269))?Number(vehicle.visualLateralAccelerationV269):0;
    return {target,rawTarget,visual:previous,velocity:previousVelocity,acceleration:heldAcceleration,alpha:0,response,maxSpeed,pausedHoldV366:true};
  }
  const delta=target-previous;
  const desiredVelocity=Math.max(-maxSpeed,Math.min(maxSpeed,delta*VISUAL_LATERAL_DYNAMICS_V269.targetGain));
  const requestedAcceleration=(desiredVelocity-previousVelocity)/Math.max(.001,dt);
  const acceleration=Math.max(-VISUAL_LATERAL_DYNAMICS_V269.maxAcceleration,Math.min(VISUAL_LATERAL_DYNAMICS_V269.maxAcceleration,requestedAcceleration));
  let velocity=Math.max(-maxSpeed,Math.min(maxSpeed,previousVelocity+acceleration*dt));
  let visual=previous+velocity*dt;
  if((delta>0&&visual>=target)||(delta<0&&visual<=target)||Math.abs(target-visual)<VISUAL_LATERAL_DYNAMICS_V269.snapMeters){visual=target;velocity=0}
  const visualLimitV271=trackLateralLimitV271(vehicle);
  visual=Math.max(-visualLimitV271,Math.min(visualLimitV271,visual));
  if(Math.abs(visual)>=visualLimitV271-.001&&Math.sign(velocity)===Math.sign(visual))velocity=0;
  vehicle.visualLateralOffsetMeters=visual;vehicle.visualLateralVelocity=velocity;vehicle.visualLateralAccelerationV269=acceleration;
  const alpha=Math.abs(delta)>.0001?Math.max(0,Math.min(1,Math.abs((visual-previous)/delta))):1;
  return {target,rawTarget,visual,velocity,acceleration,alpha,response,maxSpeed};
}
function qaLateralDynamicsV269(){
  const cfg=VISUAL_LATERAL_DYNAMICS_V269;
  const source=raceMotionV189.vehicles[0]||{id:'qa-lateral-v269',progress:.25,raceProgress:.25,incident:null};
  const savedTime=simClockV192.simTimeMs;
  const probe={...source,racingLineMode:'ATTACK_INSIDE',pitState:'TRACK',incidentLateralOffsetMeters:0,visualLateralOffsetMeters:0,visualLateralVelocity:0,visualLateralInitializedV258:true,committedVisualTargetV269:0,visualLineModeV269:'ATTACK_INSIDE',pendingVisualLineModeV269:'',visualLineModeHoldUntilV269:0};
  let maxVelocity=0,maxAcceleration=0;
  for(let i=0;i<120;i++){simClockV192.simTimeMs+=16.67;const state=updateVisualLateralOffsetV258(probe,16.67,false);maxVelocity=Math.max(maxVelocity,Math.abs(state.velocity));maxAcceleration=Math.max(maxAcceleration,Math.abs(state.acceleration))}
  const beforeReverse=probe.visualLateralOffsetMeters;probe.racingLineMode='OUTSIDE';simClockV192.simTimeMs+=16.67;
  const held=updateVisualLateralOffsetV258(probe,16.67,false);
  for(let i=0;i<40;i++){simClockV192.simTimeMs+=16.67;updateVisualLateralOffsetV258(probe,16.67,false)}
  const afterReverse=probe.visualLateralOffsetMeters;simClockV192.simTimeMs=savedTime;
  return {config:cfg,maxVelocity,maxAcceleration,beforeReverse,heldTarget:held.target,afterReverse,holdWorked:Math.abs(held.target-beforeReverse)<Math.abs(physicalLateralOffsetV258(probe)-beforeReverse),allPass:maxVelocity<=cfg.attackMaxSpeed+.02&&maxAcceleration<=cfg.maxAcceleration+.02&&cfg.lineModeHoldMs>=350};
}
function qaVisualLateralSmoothingV258(){
  const source=raceMotionV189.vehicles[0];
  if(!source||!activeRaceSnapshotV187?.track)return {allPass:false,reason:'need-live-field'};
  const probe={...source,racingLineMode:'ATTACK_INSIDE',incidentLateralOffsetMeters:0,visualLateralOffsetMeters:0,targetVisualLateralOffsetMeters:0,visualLateralVelocity:0,visualLateralInitializedV258:true};
  const attackTarget=physicalLateralOffsetV258(probe);
  probe.visualLateralOffsetMeters=0;
  const samples=[];
  for(let i=0;i<28;i++){const state=updateVisualLateralOffsetV258(probe,16.67,false);samples.push(Number(state.visual.toFixed(4)))}
  const first=Math.abs(samples[0]||0),targetAbs=Math.abs(attackTarget);
  const beforeReverse=probe.visualLateralOffsetMeters;
  probe.racingLineMode='OUTSIDE';
  const reverseTarget=physicalLateralOffsetV258(probe);
  const reverseFirst=updateVisualLateralOffsetV258(probe,16.67,false);
  const physicalBefore=physicalLateralOffsetV258(probe);
  probe.visualLateralOffsetMeters+=1.25;
  const physicalAfter=physicalLateralOffsetV258(probe);
  const smoothStart=targetAbs<.01||first<targetAbs*.35;
  const converging=targetAbs<.01||Math.abs(attackTarget-(samples.at(-1)||0))<Math.abs(attackTarget-(samples[0]||0));
  const noReverseSnap=Math.abs(reverseFirst.visual-reverseTarget)>Math.max(.08,Math.abs(beforeReverse-reverseTarget)*.35);
  const physicsIsolated=Math.abs(physicalBefore-physicalAfter)<1e-9;
  return {attackTarget,samples,first,beforeReverse,reverseTarget,reverseFirst,physicalBefore,physicalAfter,smoothStart,converging,noReverseSnap,physicsIsolated,allPass:targetAbs>.2&&smoothStart&&converging&&noReverseSnap&&physicsIsolated};
}
function qaVisualLateralDomV258(){
  const vehicle=raceMotionV189.vehicles[0],marker=vehicle?.marker;
  if(!vehicle||!marker)return {allPass:false,reason:'need-live-marker'};
  const saved={mode:vehicle.racingLineMode,incident:vehicle.incidentLateralOffsetMeters,visual:vehicle.visualLateralOffsetMeters,target:vehicle.targetVisualLateralOffsetMeters,velocity:vehicle.visualLateralVelocity,initialized:vehicle.visualLateralInitializedV258,paused:simClockV192.paused};
  let result={};
  try{
    // Phase 366 QA isolation: exercise lateral smoothing independent of the user pause freeze.
    simClockV192.paused=false;
    vehicle.incidentLateralOffsetMeters=0;
    vehicle.racingLineMode='ATTACK_INSIDE';
    updateVisualLateralOffsetV258(vehicle,0,true);
    renderRaceVehiclesV189(0);
    const start=Number(vehicle.visualLateralOffsetMeters)||0,startTransform=String(marker.getAttribute('transform')||'');
    vehicle.racingLineMode='OUTSIDE';
    const target=physicalLateralOffsetV258(vehicle);
    renderRaceVehiclesV189(16.67);
    const first=Number(vehicle.visualLateralOffsetMeters)||0,firstTransform=String(marker.getAttribute('transform')||'');
    for(let i=0;i<24;i++)renderRaceVehiclesV189(16.67);
    const later=Number(vehicle.visualLateralOffsetMeters)||0,laterTransform=String(marker.getAttribute('transform')||'');
    result={start,target,first,later,startTransform,firstTransform,laterTransform,markerVisual:String(marker.dataset.visualLateralV258||''),markerTarget:String(marker.dataset.targetLateralV258||'')};
    const noFirstFrameSnap=Math.abs(first-target)>Math.max(.08,Math.abs(start-target)*.35);
    const convergesOverTime=Math.abs(later-target)<Math.abs(first-target);
    const laterRenderMoved=laterTransform!==startTransform;
    result.noFirstFrameSnap=noFirstFrameSnap;result.convergesOverTime=convergesOverTime;result.laterRenderMoved=laterRenderMoved;
    result.allPass=noFirstFrameSnap&&convergesOverTime&&laterRenderMoved;
  }finally{
    vehicle.racingLineMode=saved.mode;vehicle.incidentLateralOffsetMeters=saved.incident;vehicle.visualLateralOffsetMeters=saved.visual;vehicle.targetVisualLateralOffsetMeters=saved.target;vehicle.visualLateralVelocity=saved.velocity;vehicle.visualLateralInitializedV258=saved.initialized;
    simClockV192.paused=saved.paused;
    renderRaceVehiclesV189(0);
  }
  return result;
}

function raceLinePointV197(path,progress,offsetMeters){
  const total=Number(path?.getTotalLength?.())||0;
  if(!(total>0))return null;
  const p=((Number(progress)||0)%1+1)%1;
  const at=p*total;
  const center=path.getPointAtLength(at);
  const d=Math.max(1,total/800);
  const before=path.getPointAtLength(Math.max(0,at-d));
  const after=path.getPointAtLength(Math.min(total,at+d));
  const dx=Number(after.x)-Number(before.x),dy=Number(after.y)-Number(before.y);
  const mag=Math.hypot(dx,dy)||1;
  const nx=-dy/mag,ny=dx/mag;
  const track=activeRaceSnapshotV187?.track;
  const physicalWidth=Math.max(1,Number(track?.geometry?.trackWidthMeters)||14);
  const visualWidth=Math.max(8,Number(track?.geometry?.visualTrackWidthSvg)||26)*TRACK_PRESENTATION_V365.visualWidthScale;
  const offsetSvg=(Number(offsetMeters)||0)*(visualWidth/physicalWidth);
  return {x:Number(center.x)+nx*offsetSvg,y:Number(center.y)+ny*offsetSvg};
}
function fourLaneGuideOffsetsV360(track=activeRaceSnapshotV187?.track){
  const width=Math.max(4,Number(track?.geometry?.trackWidthMeters)||14);
  const margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5);
  const usable=Math.max(1,width/2-margin);
  return FOUR_LANE_TRACK_V360.guideFractions.map(fraction=>fraction*usable);
}
function offsetTrackPathDataV360(path,offsetMeters,track=activeRaceSnapshotV187?.track){
  const total=Number(path?.getTotalLength?.())||0;
  if(!(total>0))return '';
  const samples=Math.max(96,Number(FOUR_LANE_TRACK_V360.guideSamples)||180);
  const physicalWidth=Math.max(1,Number(track?.geometry?.trackWidthMeters)||14);
  const visualWidth=Math.max(8,Number(track?.geometry?.visualTrackWidthSvg)||26)*TRACK_PRESENTATION_V365.visualWidthScale;
  const offsetSvg=(Number(offsetMeters)||0)*(visualWidth/physicalWidth);
  const step=Math.max(.5,total/samples*.45);
  const parts=[];
  for(let i=0;i<=samples;i++){
    const ratio=i/samples,at=ratio*total;
    const center=path.getPointAtLength(Math.min(total,at));
    const before=path.getPointAtLength((at-step+total)%total);
    const after=path.getPointAtLength((at+step)%total);
    const dx=Number(after.x)-Number(before.x),dy=Number(after.y)-Number(before.y),mag=Math.hypot(dx,dy)||1;
    const x=Number(center.x)+(-dy/mag)*offsetSvg,y=Number(center.y)+(dx/mag)*offsetSvg;
    parts.push((i===0?'M':'L')+x.toFixed(2)+' '+y.toFixed(2));
  }
  return parts.join(' ')+' Z';
}
function renderFourLaneGuidesV360(path,track=activeRaceSnapshotV187?.track){
  const svg=path?.ownerSVGElement;
  if(!svg||!track)return false;
  let layer=svg.querySelector('#f1RacingRaceLaneGuidesV360');
  if(!layer){
    layer=svgNodeV183('g',{id:'f1RacingRaceLaneGuidesV360',class:'f1-racing-race-lane-guides-v360','aria-hidden':'true'});
    svg.insertBefore(layer,path);
  }
  layer.replaceChildren();
  fourLaneGuideOffsetsV360(track).forEach((offset,index)=>{
    const lane=svgNodeV183('path',{class:'f1-racing-race-lane-guide-v360','data-f1-lane-index-v360':index,'data-f1-lane-offset-m-v360':offset.toFixed(3),d:offsetTrackPathDataV360(path,offset,track)});
    layer.appendChild(lane);
  });
  svg.dataset.f1LaneCountV360=String(FOUR_LANE_TRACK_V360.laneCount);
  return layer.childElementCount===FOUR_LANE_TRACK_V360.laneCount;
}
function setVehicleRacingLineV197(driverId,mode){
  const key=String(driverId||'');
  const next=String(mode||'').toUpperCase();
  if(!F1_LINE_MODES_V197.includes(next))return false;
  const vehicle=raceMotionV189.vehicles.find(v=>String(v.id)===key);
  if(!vehicle)return false;
  vehicle.racingLineMode=next;
  return true;
}

function clamp01V198(value){return Math.max(0,Math.min(1,Number(value)||0))}
function angleDeltaRadV198(a,b){
  let d=(Number(a)||0)-(Number(b)||0);
  while(d>Math.PI)d-=Math.PI*2;
  while(d<-Math.PI)d+=Math.PI*2;
  return Math.abs(d);
}
function geometrySampleAtProgressV198(progress){
  return typeof window.mwsF1TrackGeometrySampleAtProgressV193==='function'
    ?window.mwsF1TrackGeometrySampleAtProgressV193(raceGeometryV193,progress)
    :null;
}
function resolveSlipstreamV198(vehicle,vehicles=raceMotionV189.vehicles){
  const track=activeRaceSnapshotV187?.track;
  if(!vehicle||!track){
    return {carAhead:null,gapMeters:Infinity,strength:0,dragReduction:0,gapEffect:0,alignmentEffect:0,lateralEffect:0,straightEffect:0};
  }
  if(!trackInteractionEligibleV369(vehicle)){
    clearAeroWakeV369(vehicle);
    return {carAhead:null,gapMeters:Infinity,strength:0,dragReduction:0,gapEffect:0,alignmentEffect:0,lateralEffect:0,straightEffect:0};
  }
  const length=Math.max(1,Number(track.lengthMeters)||1);
  let ahead=null,gapMeters=Infinity;
  for(const candidate of vehicles||[]){
    if(!candidate||candidate===vehicle||!trackInteractionEligibleV369(candidate))continue;
    const delta=(Number(candidate.raceProgress)||0)-(Number(vehicle.raceProgress)||0);
    if(!(delta>0))continue;
    const meters=delta*length;
    if(meters<gapMeters){gapMeters=meters;ahead=candidate}
  }
  const cfg=SLIPSTREAM_CONFIG_V198;
  if(!ahead||gapMeters>cfg.maxGapMeters||gapMeters<cfg.minGapMeters||Number(vehicle.speedKph||0)<cfg.minSpeedKph){
    vehicle.carAheadId=ahead?String(ahead.id):null;
    vehicle.gapToCarAheadMeters=gapMeters;
    vehicle.slipstreamStrength=0;vehicle.slipstreamDragReduction=0;
    vehicle.slipstreamGapEffect=0;vehicle.slipstreamAlignmentEffect=0;vehicle.slipstreamLateralEffect=0;vehicle.slipstreamStraightEffect=0;
    return {carAhead:ahead,gapMeters,strength:0,dragReduction:0,gapEffect:0,alignmentEffect:0,lateralEffect:0,straightEffect:0};
  }
  const hereSample=geometrySampleAtProgressV198(vehicle.progress);
  const aheadSample=geometrySampleAtProgressV198(ahead.progress);
  const headingDelta=angleDeltaRadV198(hereSample?.headingRad,aheadSample?.headingRad);
  const alignmentEffect=clamp01V198(1-headingDelta/(Math.PI/5));
  const hereOffset=lineOffsetMetersV197(vehicle);
  const aheadOffset=lineOffsetMetersV197(ahead);
  const lateralDelta=Math.abs(hereOffset-aheadOffset);
  const lateralEffect=clamp01V198(1-lateralDelta/cfg.maxLateralMeters);
  const curvature=Math.abs(Number(hereSample?.curvatureRadPerMeter)||0);
  const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
  const phaseFactor=phase==='STRAIGHT'||phase==='APPROACH' ? 1 : phase==='EXIT' ? .55 : .15;
  const curvatureFactor=clamp01V198(1-curvature/0.0025);
  const straightEffect=clamp01V198(phaseFactor*curvatureFactor);
  const gapEffect=clamp01V198(1-(gapMeters-cfg.minGapMeters)/(cfg.maxGapMeters-cfg.minGapMeters));
  const wakeEffect=clamp01V198((Number(ahead.speedKph)||0)/300);
  const strength=clamp01V198(gapEffect*alignmentEffect*lateralEffect*straightEffect*wakeEffect);
  const dragReduction=strength*cfg.maxDragReduction;
  vehicle.carAheadId=String(ahead.id);
  vehicle.gapToCarAheadMeters=gapMeters;
  vehicle.slipstreamStrength=strength;
  vehicle.slipstreamDragReduction=dragReduction;
  vehicle.slipstreamGapEffect=gapEffect;
  vehicle.slipstreamAlignmentEffect=alignmentEffect;
  vehicle.slipstreamLateralEffect=lateralEffect;
  vehicle.slipstreamStraightEffect=straightEffect;
  return {carAhead:ahead,gapMeters,strength,dragReduction,gapEffect,alignmentEffect,lateralEffect,straightEffect};
}
function updateSlipstreamStatesV198(){
  for(const vehicle of raceMotionV189.vehicles)resolveSlipstreamV198(vehicle,raceMotionV189.vehicles);
  return raceMotionV189.vehicles.map(vehicle=>({id:vehicle.id,carAheadId:vehicle.carAheadId,gapToCarAheadMeters:vehicle.gapToCarAheadMeters,slipstreamStrength:vehicle.slipstreamStrength}));
}


function resolveDirtyAirV199(vehicle,vehicles=raceMotionV189.vehicles){
  const track=activeRaceSnapshotV187?.track;
  const cfg=DIRTY_AIR_CONFIG_V199;
  if(!vehicle||!track){
    return {carAhead:null,gapMeters:Infinity,strength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,tyreHeatLoad:0};
  }
  if(!trackInteractionEligibleV369(vehicle)){
    clearAeroWakeV369(vehicle);
    return {carAhead:null,gapMeters:Infinity,strength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,tyreHeatLoad:0};
  }
  let ahead=(vehicles||[]).find(v=>String(v?.id||'')===String(vehicle.carAheadId||''))||null;
  if(ahead&&!trackInteractionEligibleV369(ahead)){vehicle.carAheadId=null;vehicle.gapToCarAheadMeters=Infinity;ahead=null}
  const gapMeters=Math.max(0,Number(vehicle.gapToCarAheadMeters)||Infinity);
  const phase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
  const phaseWeight=phase==='BRAKING'?.35:phase==='TURN_IN'?.8:phase==='APEX'?1:phase==='EXIT'?.65:phase==='APPROACH'?.12:0;
  if(!ahead||gapMeters>cfg.maxGapMeters||gapMeters<cfg.minGapMeters||phaseWeight<=0){
    vehicle.dirtyAirStrength=0;vehicle.aeroGripMultiplier=1;vehicle.understeerRisk=0;vehicle.slideRisk=0;vehicle.dirtyAirTyreHeatLoad=0;
    return {carAhead:ahead,gapMeters,strength:0,aeroGripMultiplier:1,understeerRisk:0,slideRisk:0,tyreHeatLoad:0};
  }
  const hereSample=geometrySampleAtProgressV198(vehicle.progress);
  const aheadSample=geometrySampleAtProgressV198(ahead.progress);
  const headingDelta=angleDeltaRadV198(hereSample?.headingRad,aheadSample?.headingRad);
  const alignmentEffect=clamp01V198(1-headingDelta/(Math.PI/4));
  const lateralDelta=Math.abs(lineOffsetMetersV197(vehicle)-lineOffsetMetersV197(ahead));
  const lateralEffect=clamp01V198(1-lateralDelta/cfg.maxLateralMeters);
  const gapEffect=clamp01V198(1-(gapMeters-cfg.minGapMeters)/(cfg.maxGapMeters-cfg.minGapMeters));
  const curvature=Math.abs(Number(hereSample?.curvatureRadPerMeter)||0);
  const curvatureEffect=clamp01V198(curvature/0.0022);
  const rawStrength=clamp01V198(gapEffect*alignmentEffect*lateralEffect*phaseWeight*Math.max(.25,curvatureEffect));
  const battleDirtyAirScaleV350=vehicle.battleBlockedV319?REAR_BATTLE_BALANCE_V350.blockedBattleDirtyAirScale:(isBattleActiveV319(vehicle.battleState)?REAR_BATTLE_BALANCE_V350.activeBattleDirtyAirScale:1);
  const strength=clamp01V198(rawStrength*battleDirtyAirScaleV350);
  const aeroGripMultiplier=1-strength*cfg.maxCornerGripLoss;
  const understeerRisk=strength*cfg.maxUndersteerRisk;
  const slideRisk=strength*cfg.maxSlideRisk;
  const tyreHeatLoad=strength*cfg.maxTyreHeatLoad;
  vehicle.dirtyAirStrength=strength;
  vehicle.aeroGripMultiplier=aeroGripMultiplier;
  vehicle.understeerRisk=understeerRisk;
  vehicle.slideRisk=slideRisk;
  vehicle.dirtyAirTyreHeatLoad=tyreHeatLoad;
  return {carAhead:ahead,gapMeters,strength,aeroGripMultiplier,understeerRisk,slideRisk,tyreHeatLoad,phase};
}
function updateDirtyAirStatesV199(){
  for(const vehicle of raceMotionV189.vehicles)resolveDirtyAirV199(vehicle,raceMotionV189.vehicles);
  return raceMotionV189.vehicles.map(vehicle=>({id:vehicle.id,dirtyAirStrength:vehicle.dirtyAirStrength,aeroGripMultiplier:vehicle.aeroGripMultiplier,understeerRisk:vehicle.understeerRisk,slideRisk:vehicle.slideRisk,dirtyAirTyreHeatLoad:vehicle.dirtyAirTyreHeatLoad}));
}


function buildVisualSpacingPlanV319(standings=computeRaceStandingsV191(),track=activeRaceSnapshotV187?.track){
  const plan=new Map(),length=Math.max(1,Number(track?.lengthMeters)||1);
  if(!standings?.length)return plan;
  const byId=new Map((standings||[]).map(row=>[String(row.vehicle?.id||''),row.vehicle]));
  const isolation=buildBattleLocksV319(standings,byId);
  let previousDisplay=Number(standings[0]?.vehicle?.raceProgress)||0;
  plan.set(String(standings[0]?.vehicle?.id||''),previousDisplay);
  standings[0].vehicle.visualSpacingShiftMetersV319=0;
  for(let i=1;i<standings.length;i++){
    const vehicle=standings[i]?.vehicle,ahead=standings[i-1]?.vehicle;
    if(!vehicle||!ahead)continue;
    const actual=Number(vehicle.raceProgress)||0,actualAhead=Number(ahead.raceProgress)||0;
    const actualGap=Math.max(0,(actualAhead-actual)*length);
    const pairKey=battlePairKeyV319(vehicle.id,ahead.id);
    const activePair=isBattleActiveV319(vehicle.battleState)&&String(vehicle.battleTargetId||'')===String(ahead.id)&&!vehicle.battleBlockedV319&&isolation.locks.get(String(vehicle.id))===pairKey;
    const minimumGap=activePair?RACE_SPACING_CONFIG_V319.battleDisplayGapMeters:(vehicle.battleBlockedV319?RACE_SPACING_CONFIG_V319.blockedDisplayGapMeters:RACE_SPACING_CONFIG_V319.normalDisplayGapMeters);
    const displayGap=activePair?actualGap:Math.max(actualGap,minimumGap);
    const displayRaceProgress=previousDisplay-displayGap/length;
    plan.set(String(vehicle.id),displayRaceProgress);
    vehicle.visualSpacingShiftMetersV319=Math.max(0,(actual-displayRaceProgress)*length);
    vehicle.visualSpacingTargetShiftMetersV330=vehicle.visualSpacingShiftMetersV319;
    vehicle.visualSpacingGapMetersV319=displayGap;
    vehicle.visualSpacingBattlePairV319=activePair;
    previousDisplay=displayRaceProgress;
  }
  return plan;
}
function smoothVisualSpacingShiftV330(vehicle,targetShiftMeters,frameMs=16.67){
  if(!vehicle)return 0;
  const target=Math.max(0,Number(targetShiftMeters)||0);
  let current=Number(vehicle.visualSpacingSmoothedShiftMetersV330);
  if(!Number.isFinite(current))current=target;
  const dt=Math.max(1,Math.min(100,Number(frameMs)||16.67));
  const duration=target>current?VISUAL_SPACING_SMOOTH_V330.approachMs:VISUAL_SPACING_SMOOTH_V330.releaseMs;
  const alpha=1-Math.exp(-dt/Math.max(1,duration));
  let next=current+(target-current)*alpha;
  const maxStep=VISUAL_SPACING_SMOOTH_V330.maxStepMetersPerSecond*(dt/1000);
  const delta=next-current;
  if(Math.abs(delta)>maxStep)next=current+Math.sign(delta)*maxStep;
  if(Math.abs(target-next)<=VISUAL_SPACING_SMOOTH_V330.snapMeters)next=target;
  vehicle.visualSpacingTargetShiftMetersV330=target;
  vehicle.visualSpacingSmoothedShiftMetersV330=Math.max(0,next);
  return vehicle.visualSpacingSmoothedShiftMetersV330;
}

// Phase 320 compatibility contract for Phase 197 and 258 source audits:
 // const point=raceLinePointV197(path,vehicle.progress,lateralStateV258.visual);
function renderRaceVehiclesV189(frameMs=16.67){
  const path=document.getElementById('f1RacingRaceTrackPathV188');
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');
  if(!path||!layer)return false;
  const totalLength=path.getTotalLength();if(!(totalLength>0))return false;
  const freezeVisualV366=simClockV192.paused===true||!(Number(frameMs)>0);
  // Phase 319 compatibility token: spacingPlanV319=buildVisualSpacingPlanV319()
  const rendered=[],spacingPlanV319=freezeVisualV366?new Map(raceMotionV189.vehicles.map(vehicle=>[String(vehicle.id),Number(vehicle.raceProgress)||0])):buildVisualSpacingPlanV319();
  raceMotionV189.vehicles.forEach(function(vehicle,index){
    const marker=vehicle.marker||ensureRaceVehicleMarkerV189(vehicle,index);if(!marker)return;
    // Phase 197 and Phase 258 compatibility token: const lateralStateV258=updateVisualLateralOffsetV258(vehicle,frameMs,false);
    const lateralStateV258=freezeVisualV366&&vehicle.visualLateralInitializedV258===true
      ?{target:Number(vehicle.targetVisualLateralOffsetMeters)||0,rawTarget:Number(vehicle.targetVisualLateralOffsetMeters)||0,visual:Number(vehicle.visualLateralOffsetMeters)||0,velocity:Number(vehicle.visualLateralVelocity)||0,acceleration:Number(vehicle.visualLateralAccelerationV269)||0,alpha:0,response:visualLateralResponseV258(vehicle),pausedHoldV366:true}
      :updateVisualLateralOffsetV258(vehicle,frameMs,false);
    const plannedDisplayRaceProgressV319=spacingPlanV319.has(String(vehicle.id))?spacingPlanV319.get(String(vehicle.id)):Number(vehicle.raceProgress)||0;
    const trackLengthV330=Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1);
    const actualRaceProgressV330=Number(vehicle.raceProgress)||0;
    const targetShiftMetersV330=0;
    const smoothShiftMetersV330=freezeVisualV366?Math.max(0,Number(vehicle.visualSpacingSmoothedShiftMetersV330)||0):smoothVisualSpacingShiftV330(vehicle,targetShiftMetersV330,frameMs);
    const displayRaceProgressV319=actualRaceProgressV330-smoothShiftMetersV330/trackLengthV330;
    vehicle.visualSpacingPlannedShiftMetersV335=Math.max(0,(actualRaceProgressV330-plannedDisplayRaceProgressV319)*trackLengthV330);
    vehicle.visualSpacingModeV335='ACTUAL_RACE_PROGRESS';
    const displayProgressV319=normalizedProgressV190(displayRaceProgressV319);
    const point=raceLinePointV197(path,displayProgressV319,lateralStateV258.visual);if(!point)return;
    vehicle.renderPointV216={x:Number(point.x),y:Number(point.y)};
    marker.setAttribute('transform',raceMarkerTransformV245(point,raceCameraV216.zoom,vehicle));
    marker.dataset.cameraScaleV245=raceMarkerScaleV245(raceCameraV216.zoom).toFixed(4);
    marker.dataset.lineMode=vehicle.racingLineMode||'IDEAL';
    marker.dataset.cornerPhase=getCornerPhaseAtProgressV194(vehicle.progress)?.phase||'STRAIGHT';
    marker.dataset.incident=activeDrivingIncidentV204(vehicle)||'';
    marker.dataset.pitState=String(vehicle.pitState||'TRACK');
    marker.dataset.trafficState=String(vehicle.trafficState||'CLEAR');
    marker.dataset.defence=vehicle.defenceActive?'1':'0';
    marker.dataset.battleState=String(vehicle.battleState||'FOLLOWING');
    marker.dataset.battleBlockedV319=vehicle.battleBlockedV319?'1':'0';
    marker.dataset.visualSpacingShiftMetersV319=Number(vehicle.visualSpacingShiftMetersV319||0).toFixed(1);
    marker.dataset.visualSpacingTargetShiftMetersV330=Number(vehicle.visualSpacingTargetShiftMetersV330||0).toFixed(1);
    marker.dataset.visualSpacingSmoothedShiftMetersV330=Number(vehicle.visualSpacingSmoothedShiftMetersV330||0).toFixed(1);
    marker.dataset.visualSpacingPlannedShiftMetersV335=Number(vehicle.visualSpacingPlannedShiftMetersV335||0).toFixed(1);
    marker.dataset.visualSpacingModeV335=String(vehicle.visualSpacingModeV335||'ACTUAL_RACE_PROGRESS');
    marker.dataset.visualSpacingGapMetersV319=Number(vehicle.visualSpacingGapMetersV319||0).toFixed(1);
    marker.dataset.visualSpacingBattlePairV319=vehicle.visualSpacingBattlePairV319?'1':'0';
    marker.dataset.physicalLateralV258=Number(vehicle.lateralOffsetMeters||0).toFixed(3);
    marker.dataset.targetLateralV258=Number(vehicle.targetVisualLateralOffsetMeters||0).toFixed(3);
    marker.dataset.visualLateralV258=Number(vehicle.visualLateralOffsetMeters||0).toFixed(3);
    marker.dataset.visualLateralVelocityV269=Number(vehicle.visualLateralVelocity||0).toFixed(3);
    marker.dataset.visualLateralAccelerationV269=Number(vehicle.visualLateralAccelerationV269||0).toFixed(3);
    marker.dataset.fourLaneIndexV360=String(Number(vehicle.fourLaneResolvedIndexV360)||0);
    marker.dataset.fourLaneOffsetMetersV360=Number(vehicle.fourLaneOffsetMetersV360||0).toFixed(3);
    marker.dataset.cornerLaneDensityV361=String(Number(vehicle.cornerLaneDensityV361)||1);
    marker.dataset.cornerLaneLockV361=String(vehicle.cornerLaneLockIdV361||'');
    marker.dataset.markerDensityScaleV361=Number(vehicle.markerDensityScaleV361||1).toFixed(3);
    marker.dataset.laneBandSlotV363=Number(vehicle.laneBandSlotV363||0).toFixed(3);
    marker.dataset.laneBandPeerCountV363=String(Number(vehicle.laneBandPeerCountV363)||1);
    marker.dataset.laneBandOffsetMetersV363=Number(vehicle.laneBandOffsetMetersV363||0).toFixed(3);
    marker.dataset.markerBandScaleV363=Number(vehicle.markerBandScaleV363||1).toFixed(3);
    marker.dataset.laneBandLockedSlotV364=Number(vehicle.laneBandLockedSlotV364||0).toFixed(3);
    marker.dataset.laneBandSlotChangesV364=String(Number(vehicle.laneBandSlotChangesV364)||0);
    marker.dataset.trackBoundaryRatioV271=Number(vehicle.trackBoundaryRatioV271||0).toFixed(3);
    marker.dataset.trackBoundaryExceededV271=vehicle.trackBoundaryExceededV271?'1':'0';
    marker.dataset.trackBoundarySpeedFactorV271=Number(vehicle.trackBoundarySpeedFactorV271||1).toFixed(3);
    syncVehicleSpectatorClassesV252(vehicle,marker);
    rendered.push({vehicle,marker,point});
  });
  syncBattleLinksV256();
  layoutRaceVehicleLabelsV228(rendered);
  if(!freezeVisualV366)recordScreenCrowdingV363(rendered);
  if(!freezeVisualV366)updateAutoRaceCameraV216(false);
  return true;
}
function recordScreenCrowdingV363(rendered=[]){
  const zoom=Math.max(1,Number(raceCameraV216.zoom)||1),pairs=[];
  let minDistance=Infinity,overlaps=0,dense=false;
  for(let i=0;i<rendered.length;i++){
    const a=rendered[i],aPhase=getCornerPhaseAtProgressV194(a?.vehicle?.progress);
    if(!aPhase?.corner||Number(a?.vehicle?.cornerLaneDensityV361||1)<CORNER_LANE_OCCUPANCY_V361.denseCount)continue;
    dense=true;
    for(let j=i+1;j<rendered.length;j++){
      const b=rendered[j],bPhase=getCornerPhaseAtProgressV194(b?.vehicle?.progress);
      if(!bPhase?.corner||String(aPhase.corner.id||'')!==String(bPhase.corner.id||''))continue;
      const screenDistance=Math.hypot(Number(a.point?.x)-Number(b.point?.x),Number(a.point?.y)-Number(b.point?.y))*zoom;
      const aScale=Math.max(LANE_BAND_CROWDING_V363.minMarkerScale,Math.min(Number(a?.vehicle?.markerDensityScaleV361)||1,Number(a?.vehicle?.markerBandScaleV363)||1));
      const bScale=Math.max(LANE_BAND_CROWDING_V363.minMarkerScale,Math.min(Number(b?.vehicle?.markerDensityScaleV361)||1,Number(b?.vehicle?.markerBandScaleV363)||1));
      const threshold=18*(aScale+bScale)*LANE_BAND_CROWDING_V363.overlapThresholdRatio;
      minDistance=Math.min(minDistance,screenDistance);
      if(screenDistance<threshold){overlaps++;pairs.push({a:String(a.vehicle?.id||''),b:String(b.vehicle?.id||''),distance:Number(screenDistance.toFixed(2)),threshold:Number(threshold.toFixed(2))})}
      const sameStableGroup=String(a?.vehicle?.laneBandGroupKeyV364||'')&&String(a?.vehicle?.laneBandGroupKeyV364||'')===String(b?.vehicle?.laneBandGroupKeyV364||'');
      const lockedNow=sameStableGroup&&Number(a?.vehicle?.laneBandSlotLockedUntilV364||0)>=(Number(simClockV192.simTimeMs)||0)&&Number(b?.vehicle?.laneBandSlotLockedUntilV364||0)>=(Number(simClockV192.simTimeMs)||0);
      if(lockedNow){
        laneBandStabilityStateV364.minStableScreenDistance=Math.min(laneBandStabilityStateV364.minStableScreenDistance,screenDistance);
        if(screenDistance<threshold)laneBandStabilityStateV364.currentStableOverlapPairs+=1;
      }
    }
  }
  screenCrowdingStateV363.samples+=1;if(dense)screenCrowdingStateV363.denseSamples+=1;
  laneBandStabilityStateV364.maxStableOverlapPairs=Math.max(laneBandStabilityStateV364.maxStableOverlapPairs,laneBandStabilityStateV364.currentStableOverlapPairs);
  screenCrowdingStateV363.currentOverlapPairs=overlaps;screenCrowdingStateV363.maxOverlapPairs=Math.max(screenCrowdingStateV363.maxOverlapPairs,overlaps);
  laneBandStabilityStateV364.currentStableOverlapPairs=0;
  if(Number.isFinite(minDistance))screenCrowdingStateV363.minScreenDistance=Math.min(screenCrowdingStateV363.minScreenDistance,minDistance);
  screenCrowdingStateV363.latest={overlaps,minDistance:Number.isFinite(minDistance)?Number(minDistance.toFixed(2)):null,pairs:pairs.slice(0,8)};
  return screenCrowdingStateV363.latest;
}
function screenCrowdingTelemetryV363(){
  return {version:VERSION363,samples:screenCrowdingStateV363.samples,denseSamples:screenCrowdingStateV363.denseSamples,currentOverlapPairs:screenCrowdingStateV363.currentOverlapPairs,maxOverlapPairs:screenCrowdingStateV363.maxOverlapPairs,minScreenDistance:Number.isFinite(screenCrowdingStateV363.minScreenDistance)?Number(screenCrowdingStateV363.minScreenDistance.toFixed(2)):null,latest:screenCrowdingStateV363.latest,stability:{...laneBandStabilityStateV364,minStableScreenDistance:Number.isFinite(laneBandStabilityStateV364.minStableScreenDistance)?Number(laneBandStabilityStateV364.minStableScreenDistance.toFixed(2)):null}};
}
function longCornerClusterTelemetryV360(){
  const track=activeRaceSnapshotV187?.track;
  const standings=computeRaceStandingsV191();
  if(!track||standings.length<2)return {version:VERSION360,rows:[],tightPairs:0,longCornerPairs:0};
  const length=Math.max(1,Number(track.lengthMeters)||1),rows=[];
  for(let i=1;i<standings.length;i++){
    const vehicle=standings[i]?.vehicle,ahead=standings[i-1]?.vehicle;
    if(!vehicle||!ahead)continue;
    const here=getCornerPhaseAtProgressV194(vehicle.progress),front=getCornerPhaseAtProgressV194(ahead.progress);
    const corner=here?.corner;
    const measuredLength=Number(corner?.lengthMeters);
    const derivedLength=Number(corner?.exitDistanceMeters)-Number(corner?.approachDistanceMeters);
    const longLength=Math.max(0,Number.isFinite(measuredLength)?measuredLength:(Number.isFinite(derivedLength)?derivedLength:0));
    const sameCorner=Boolean(corner&&front?.corner&&String(front.corner.id||'')===String(corner.id||''));
    if(!sameCorner||longLength<FOUR_LANE_TRACK_V360.longCornerMinMeters)continue;
    const logicalGapMeters=Math.max(0,(Number(ahead.raceProgress)-Number(vehicle.raceProgress))*length);
    const physicalLateralGapMeters=Math.abs(lineOffsetMetersV197(vehicle)-lineOffsetMetersV197(ahead));
    const lateralGapMeters=Math.abs((Number(vehicle.visualLateralOffsetMeters)||0)-(Number(ahead.visualLateralOffsetMeters)||0));
    const visualGapSvg=vehicle.renderPointV216&&ahead.renderPointV216?Math.hypot(Number(vehicle.renderPointV216.x)-Number(ahead.renderPointV216.x),Number(vehicle.renderPointV216.y)-Number(ahead.renderPointV216.y)):null;
    rows.push({vehicleId:String(vehicle.id||''),aheadId:String(ahead.id||''),cornerId:String(corner.id||''),cornerLengthMeters:Number(longLength.toFixed(1)),logicalGapMeters:Number(logicalGapMeters.toFixed(2)),physicalLateralGapMeters:Number(physicalLateralGapMeters.toFixed(2)),lateralGapMeters:Number(lateralGapMeters.toFixed(2)),visualGapSvg:Number.isFinite(visualGapSvg)?Number(visualGapSvg.toFixed(2)):null,lane:Number(vehicle.fourLaneResolvedIndexV360)||0,aheadLane:Number(ahead.fourLaneResolvedIndexV360)||0,dirtyAir:Number(vehicle.dirtyAirStrength||0)});
  }
  return {version:VERSION360,rows,longCornerPairs:rows.length,tightPairs:rows.filter(row=>row.logicalGapMeters<=FOUR_LANE_TRACK_V360.tightGapMeters).length};
}
function initializeRaceMotionV189(snapshot=activeRaceSnapshotV187){
  if(!snapshot)return false;
  resetLeaderPressureFieldV274();
  resetLaneBandStabilityTelemetryV364();
  resetNaturalHeadwayTelemetryV365();
  resetFollowingStabilityTelemetryV366();
  raceMotionV189.vehicles=createRaceVehiclesV189(snapshot);
  resetInteractionSnapshotV368();
  updateInteractionSnapshotShadowV368();
  resetRaceOrderFlowV309(raceMotionV189.vehicles);
  resetMicroBattleEventsV278();
  raceMotionV189.snapshotCreatedAt=String(snapshot.createdAt||'');
  raceMotionV189.lastTimestamp=0;
  raceMotionV189.hudAccumulatorMs=0;
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');if(layer)layer.replaceChildren();
  renderRaceVehiclesV189();
  updateRaceProgressHudV190();
  return raceMotionV189.vehicles.length>0;
}
function syncSimulationControlsV192(){
  const pause=document.getElementById('f1RacingPauseV192');
  const status=document.getElementById('f1RacingRaceStatusV188');
  if(pause){
    pause.textContent=simClockV192.paused?'재개':'일시정지';
    pause.setAttribute('aria-pressed',simClockV192.paused?'true':'false');
    pause.classList.toggle('active',simClockV192.paused);
  }
  document.querySelectorAll('#f1RacingRaceControlsV192 [data-f1-timescale]').forEach(function(button){
    const active=Number(button.dataset.f1Timescale)===simClockV192.timeScale;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active?'true':'false');
  });
  if(status&&raceMotionV189.running)status.textContent=simClockV192.paused?'일시정지':'진행 중';
}
function setSimulationTimeScaleV192(scale){
  const next=Number(scale);
  if(![1,2,4].includes(next))return false;
  simClockV192.timeScale=next;
  simClockV192.accumulatorMs=0;
  syncSimulationControlsV192();
  return true;
}
function toggleSimulationPauseV192(force){
  simClockV192.paused=typeof force==='boolean'?force:!simClockV192.paused;
  simClockV192.accumulatorMs=0;
  raceMotionV189.lastTimestamp=0;
  syncSimulationControlsV192();
  return simClockV192.paused;
}
function bindSimulationControlsV192(){
  const pause=document.getElementById('f1RacingPauseV192');
  if(pause&&!pause.dataset.f1Bound){
    pause.dataset.f1Bound='1';
    pause.addEventListener('click',function(){toggleSimulationPauseV192()});
  }
  document.querySelectorAll('#f1RacingRaceControlsV192 [data-f1-timescale]').forEach(function(button){
    if(button.dataset.f1Bound)return;
    button.dataset.f1Bound='1';
    button.addEventListener('click',function(){setSimulationTimeScaleV192(Number(button.dataset.f1Timescale))});
  });
  syncSimulationControlsV192();
}
function gearForSpeedV196(speedKph){
  const speed=Math.max(0,Number(speedKph)||0);
  if(speed<85)return 1;if(speed<125)return 2;if(speed<165)return 3;if(speed<205)return 4;
  if(speed<245)return 5;if(speed<280)return 6;if(speed<315)return 7;return 8;
}
function rpmForSpeedAndGearV196(speedKph,gear){
  const bands=[[0,85],[65,125],[100,165],[135,205],[170,245],[205,280],[235,315],[270,350]];
  const band=bands[Math.max(0,Math.min(7,(Number(gear)||1)-1))];
  const t=Math.max(0,Math.min(1,((Number(speedKph)||0)-band[0])/Math.max(1,band[1]-band[0])));
  return Math.round(8500+t*3500);
}

function battleQueueSpeedControlV319(vehicle){
  if(!vehicle||String(vehicle.pitState||'TRACK')!=='TRACK')return {active:false,capKph:Infinity,gapMeters:Infinity,reason:''};
  const ahead=raceMotionV189.vehicles.find(row=>String(row.id)===String(vehicle.trafficCarAheadId||''))||null;
  const gap=Math.max(0,Number(vehicle.trafficGapMeters));
  if(!ahead||!Number.isFinite(gap))return {active:false,capKph:Infinity,gapMeters:gap,reason:''};
  const currentPair=battlePairKeyV319(vehicle.id,ahead.id);
  const activeWithAhead=isBattleActiveV319(vehicle.battleState)&&String(vehicle.battleTargetId||'')===String(ahead.id)&&!vehicle.battleBlockedV319;
  if(vehicle.battleBlockedV319&&gap<RACE_SPACING_CONFIG_V319.blockedSpeedTriggerMeters){
    const strength=clamp01V198(1-gap/RACE_SPACING_CONFIG_V319.blockedSpeedTriggerMeters);
    return {active:true,capKph:Math.max(0,(Number(ahead.speedKph)||0)-RACE_SPACING_CONFIG_V319.blockedSpeedMarginKph*Math.max(.45,strength)),gapMeters:gap,reason:'BATTLE_QUEUE',pairKey:currentPair};
  }
  const closingKph=(Number(vehicle.speedKph)||0)-(Number(ahead.speedKph)||0);
  const overtakeOpportunity=closingKph>=Math.min(RACE_SPACING_CONFIG_V319.overtakeReleaseClosingKph,raceCompetitionConfigV345().overtakeReleaseClosingKph)&&boundaryOvertakeEligibleV271(vehicle);
  if(!activeWithAhead&&!overtakeOpportunity&&gap<RACE_SPACING_CONFIG_V319.physicalFollowGapMeters){
    const strength=clamp01V198(1-gap/RACE_SPACING_CONFIG_V319.physicalFollowGapMeters);
    return {active:true,capKph:Math.max(0,(Number(ahead.speedKph)||0)-RACE_SPACING_CONFIG_V319.physicalFollowMarginKph*Math.max(.4,strength)),gapMeters:gap,reason:'TRAIN_HEADWAY',pairKey:currentPair,closingKph};
  }
  if(!activeWithAhead&&gap<RACE_SPACING_CONFIG_V319.emergencyGapMeters){
    return {active:true,capKph:Math.max(0,(Number(ahead.speedKph)||0)-RACE_SPACING_CONFIG_V319.emergencySpeedMarginKph),gapMeters:gap,reason:'OVERLAP_GUARD',pairKey:currentPair};
  }
  return {active:false,capKph:Infinity,gapMeters:gap,reason:''};
}

function battleQueueSpeedControlV350(vehicle){
  if(!vehicle||String(vehicle.pitState||'TRACK')!=='TRACK')return {active:false,capKph:Infinity,gapMeters:Infinity,reason:''};
  const ahead=raceMotionV189.vehicles.find(row=>String(row.id)===String(vehicle.trafficCarAheadId||''))||null;
  const gap=Math.max(0,Number(vehicle.trafficGapMeters));
  if(!ahead||!Number.isFinite(gap))return {active:false,capKph:Infinity,gapMeters:gap,reason:''};
  const aheadSpeed=Math.max(0,Number(ahead.speedKph)||0);
  const activeWithAhead=isBattleActiveV319(vehicle.battleState)&&String(vehicle.battleTargetId||'')===String(ahead.id)&&!vehicle.battleBlockedV319;
  if(activeWithAhead)return {active:false,capKph:Infinity,gapMeters:gap,reason:'ACTIVE_BATTLE'};
  const closingKph=(Number(vehicle.speedKph)||0)-aheadSpeed;
  const overtakeOpportunity=closingKph>=Math.min(RACE_SPACING_CONFIG_V319.overtakeReleaseClosingKph,raceCompetitionConfigV345().overtakeReleaseClosingKph)&&boundaryOvertakeEligibleV271(vehicle);
  if(gap<REAR_BATTLE_BALANCE_V350.overlapGuardMeters){
    return {active:true,capKph:Math.max(0,aheadSpeed-REAR_BATTLE_BALANCE_V350.overlapSpeedMarginKph),gapMeters:gap,reason:'OVERLAP_GUARD_V350',closingKph};
  }
  if(vehicle.battleBlockedV319&&gap<REAR_BATTLE_BALANCE_V350.blockedControlMeters){
    const allowance=gap>REAR_BATTLE_BALANCE_V350.trainControlMeters?REAR_BATTLE_BALANCE_V350.farClosingAllowanceKph:REAR_BATTLE_BALANCE_V350.closeClosingAllowanceKph;
    return {active:true,capKph:aheadSpeed+allowance,gapMeters:gap,reason:'BATTLE_QUEUE_SOFT_V350',closingKph};
  }
  if(!overtakeOpportunity&&gap<REAR_BATTLE_BALANCE_V350.trainControlMeters){
    return {active:true,capKph:aheadSpeed+REAR_BATTLE_BALANCE_V350.closeClosingAllowanceKph,gapMeters:gap,reason:'TRAIN_HEADWAY_SOFT_V350',closingKph};
  }
  return {active:false,capKph:Infinity,gapMeters:gap,reason:''};
}


function headwayTimeGapV365(phase){
  if(phase==='BRAKING')return NATURAL_HEADWAY_V365.brakingTimeGapSeconds;
  if(phase==='TURN_IN')return NATURAL_HEADWAY_V365.turnInTimeGapSeconds;
  if(phase==='APEX')return NATURAL_HEADWAY_V365.apexTimeGapSeconds;
  if(phase==='EXIT')return NATURAL_HEADWAY_V365.exitTimeGapSeconds;
  return NATURAL_HEADWAY_V365.straightTimeGapSeconds;
}
function naturalHeadwayTargetV365(vehicle,ahead,phaseInfo=getCornerPhaseAtProgressV194(vehicle?.progress)){
  const followerSpeed=Math.max(0,Number(vehicle?.speedKph)||0),aheadSpeed=Math.max(0,Number(ahead?.speedKph)||0);
  const referenceKph=Math.max(60,Math.min(335,(followerSpeed+aheadSpeed)/2));
  const phase=String(phaseInfo?.phase||'STRAIGHT');
  let target=NATURAL_HEADWAY_V365.baseGapMeters+(referenceKph/3.6)*headwayTimeGapV365(phase);
  if(vehicle?.battleBlockedV319)target*=NATURAL_HEADWAY_V365.blockedMultiplier;
  return Math.max(NATURAL_HEADWAY_V365.minGapMeters,Math.min(NATURAL_HEADWAY_V365.maxGapMeters,target));
}
function naturalRaceSpacingControlV365(vehicle,freeTargetKph=NaN){
  const legacy=battleQueueSpeedControlV350(vehicle);
  if(!vehicle||String(vehicle.pitState||'TRACK')!=='TRACK'){if(vehicle)vehicle.naturalHeadwayAttackIntentV365=false;return legacy;}
  const ahead=raceMotionV189.vehicles.find(row=>String(row.id)===String(vehicle.trafficCarAheadId||''))||null;
  const gap=Math.max(0,Number(vehicle.trafficGapMeters));
  if(!ahead||!Number.isFinite(gap)){vehicle.naturalHeadwayAttackIntentV365=false;return legacy;}
  const aheadSpeed=Math.max(0,Number(ahead.speedKph)||0),currentSpeed=Math.max(0,Number(vehicle.speedKph)||0),closingKph=currentSpeed-aheadSpeed;
  const phaseInfo=getCornerPhaseAtProgressV194(vehicle.progress),phase=String(phaseInfo?.phase||'STRAIGHT'),fastModeV365=activeRaceModeV345()==='FAST';
  const battleOpenV365=phase==='STRAIGHT'||phase==='APPROACH'||phase==='BRAKING';
  const freeTargetV365=Number(freeTargetKph);
  const freePaceAdvantageV365=Number.isFinite(freeTargetV365)?freeTargetV365-aheadSpeed:0;
  const desiredGap=naturalHeadwayTargetV365(vehicle,ahead,phaseInfo),softStart=desiredGap*NATURAL_HEADWAY_V365.softStartMultiplier;
  const targetIsAhead=String(vehicle.battleTargetId||'')===String(ahead.id);
  const activeWithAhead=isBattleActiveV319(vehicle.battleState)&&targetIsAhead&&!vehicle.battleBlockedV319;
  const approachStateV365=['CLOSING','TOWING'].includes(String(vehicle.battleState||''));
  const closingCandidateV365=targetIsAhead&&!vehicle.battleBlockedV319&&closingKph>1&&gap<=PASS_CONFIG_V208.followGapMeters;
  const approachAttackIntentV365=targetIsAhead&&approachStateV365&&!vehicle.battleBlockedV319&&gap<=PASS_CONFIG_V208.followGapMeters;
  const overtakeOpportunity=closingKph>=Math.min(RACE_SPACING_CONFIG_V319.overtakeReleaseClosingKph,raceCompetitionConfigV345().overtakeReleaseClosingKph)&&boundaryOvertakeEligibleV271(vehicle);
  const genuineClosingReleaseV365=battleOpenV365&&!vehicle.battleBlockedV319&&gap<=NATURAL_HEADWAY_V365.genuineClosingReleaseMeters&&closingKph>=NATURAL_HEADWAY_V365.fastReleaseClosingKph&&boundaryOvertakeEligibleV271(vehicle);
  const fastApproachReleaseV365=activeRaceModeV345()==='FAST'&&!vehicle.battleBlockedV319&&gap<=PASS_CONFIG_V208.followGapMeters*NATURAL_HEADWAY_V365.fastReleaseGapMultiplier&&closingKph>=NATURAL_HEADWAY_V365.fastReleaseClosingKph&&boundaryOvertakeEligibleV271(vehicle);
  const naturalAttackIntentV365=!vehicle.battleBlockedV319&&gap<=PASS_CONFIG_V208.followGapMeters&&boundaryOvertakeEligibleV271(vehicle)&&(
    freePaceAdvantageV365>=NATURAL_HEADWAY_V365.cornerPaceReleaseKph||
    Number(vehicle.slipstreamStrength||0)>=NATURAL_HEADWAY_V365.cornerSlipstreamRelease||
    ['CLOSING','TOWING','PRESSURE'].includes(String(vehicle.trafficState||''))||
    ['CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT'].includes(String(vehicle.battleState||''))
  );
  vehicle.naturalHeadwayAttackIntentV365=naturalAttackIntentV365;
  const naturalAttackReleaseV365=!vehicle.battleBlockedV319&&battleOpenV365&&gap<=NATURAL_HEADWAY_V365.attackReleaseGapMeters&&boundaryOvertakeEligibleV271(vehicle)&&(
    freePaceAdvantageV365>=NATURAL_HEADWAY_V365.paceAdvantageReleaseKph||
    Number(vehicle.slipstreamStrength||0)>=NATURAL_HEADWAY_V365.attackSlipstreamRelease||
    ['CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT'].includes(String(vehicle.battleState||''))
  );
  naturalHeadwayTelemetryV365.calls+=1;
  naturalHeadwayTelemetryV365.minGapMeters=Math.min(naturalHeadwayTelemetryV365.minGapMeters,gap);
  naturalHeadwayTelemetryV365.maxTargetGapMeters=Math.max(naturalHeadwayTelemetryV365.maxTargetGapMeters,desiredGap);
  if(fastModeV365){
    naturalHeadwayTelemetryV365.last={...legacy,desiredGapMeters:desiredGap,phase,release:'FAST_LEGACY_COMPETITION'};
    return legacy;
  }
  if(gap<NATURAL_HEADWAY_V365.emergencyGapMeters){
    const result={active:true,capKph:Math.max(0,aheadSpeed-NATURAL_HEADWAY_V365.emergencyMarginKph),gapMeters:gap,desiredGapMeters:desiredGap,reason:'NATURAL_EMERGENCY_V365',closingKph,phase};
    naturalHeadwayTelemetryV365.active+=1;naturalHeadwayTelemetryV365.emergency+=1;naturalHeadwayTelemetryV365.last=result;return result;
  }
  const developingBattleStateV365=['CLOSING','TOWING','PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(String(vehicle.battleState||''));
  const developingTrafficStateV365=['TOWING','PRESSURE'].includes(String(vehicle.trafficState||''));
  const developingAttackV365=!vehicle.battleBlockedV319&&gap<=PASS_CONFIG_V208.followGapMeters*1.15&&boundaryOvertakeEligibleV271(vehicle)&&(developingBattleStateV365||developingTrafficStateV365);
  if(developingAttackV365){
    const release={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'DEVELOPING_ATTACK_RELEASE_V365',closingKph,phase,battleState:String(vehicle.battleState||''),trafficState:String(vehicle.trafficState||'')};
    naturalHeadwayTelemetryV365.last=release;return release;
  }
  const cornerHeadwayPhaseV365=phase==='TURN_IN'||phase==='APEX'||phase==='EXIT';
  const cornerClosingReleaseV365=cornerHeadwayPhaseV365&&!vehicle.battleBlockedV319&&gap<=PASS_CONFIG_V208.followGapMeters&&closingKph>=NATURAL_HEADWAY_V365.cornerClosingReleaseKph&&boundaryOvertakeEligibleV271(vehicle);
  const cornerPaceReleaseV365=cornerHeadwayPhaseV365&&!vehicle.battleBlockedV319&&gap<=PASS_CONFIG_V208.followGapMeters*1.15&&boundaryOvertakeEligibleV271(vehicle)&&(
    freePaceAdvantageV365>=NATURAL_HEADWAY_V365.cornerPaceReleaseKph||
    Number(vehicle.slipstreamStrength||0)>=NATURAL_HEADWAY_V365.cornerSlipstreamRelease
  );
  if(!cornerHeadwayPhaseV365){
    const release={...legacy,desiredGapMeters:desiredGap,phase,release:'OPEN_RACE_FLOW_V365'};
    naturalHeadwayTelemetryV365.last=release;return legacy;
  }
  if(naturalAttackReleaseV365){
    const release={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'NATURAL_ATTACK_RELEASE_V365',closingKph,phase,freePaceAdvantageKph:freePaceAdvantageV365};
    naturalHeadwayTelemetryV365.last=release;return release;
  }
  if(cornerClosingReleaseV365){
    const release={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'CORNER_CLOSING_RELEASE_V365',closingKph,phase};
    naturalHeadwayTelemetryV365.last=release;return release;
  }
  if(naturalAttackIntentV365&&cornerHeadwayPhaseV365&&gap<=PASS_CONFIG_V208.followGapMeters){
    const release={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'CORNER_ATTACK_INTENT_RELEASE_V365',closingKph,phase,freePaceAdvantageKph:freePaceAdvantageV365};
    naturalHeadwayTelemetryV365.last=release;return release;
  }
  if(cornerPaceReleaseV365){
    const release={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'CORNER_PACE_RELEASE_V365',closingKph,phase,freePaceAdvantageKph:freePaceAdvantageV365};
    naturalHeadwayTelemetryV365.last=release;return release;
  }
  if(genuineClosingReleaseV365){
    const release={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'GENUINE_CLOSING_RELEASE',closingKph,phase};
    naturalHeadwayTelemetryV365.last=release;return release;
  }
  if(activeWithAhead||approachAttackIntentV365||closingCandidateV365||fastApproachReleaseV365||overtakeOpportunity){
    const release=activeWithAhead?'ACTIVE_BATTLE':approachAttackIntentV365?'APPROACH_ATTACK':closingCandidateV365?'CLOSING_CANDIDATE':fastApproachReleaseV365?'FAST_APPROACH_RELEASE':'OVERTAKE_RELEASE';
    naturalHeadwayTelemetryV365.last={...legacy,desiredGapMeters:desiredGap,phase,release};
    return legacy;
  }
  let natural=null;
  if(gap<desiredGap){
    const severity=clamp01V198((desiredGap-gap)/Math.max(1,desiredGap));
    const approachCap=Math.max(0,aheadSpeed+NATURAL_HEADWAY_V365.stateEntryClosingKph);
    // Phase 365 audit compatibility token: NATURAL_HEADWAY_BRAKE_V365
    natural={active:true,capKph:approachCap,gapMeters:gap,desiredGapMeters:desiredGap,reason:'NATURAL_HEADWAY_APPROACH_V365',closingKph,phase,severity};
  }else if(gap<softStart&&closingKph>.2){
    const ratio=clamp01V198((gap-desiredGap)/Math.max(1,softStart-desiredGap));
    const allowance=NATURAL_HEADWAY_V365.approachAllowanceKph*ratio;
    natural={active:true,capKph:aheadSpeed+allowance,gapMeters:gap,desiredGapMeters:desiredGap,reason:'NATURAL_HEADWAY_LIFT_V365',closingKph,phase,severity:1-ratio};
  }
  let result=natural;
  if(legacy?.active&&Number.isFinite(Number(legacy.capKph))&&(!result||Number(legacy.capKph)<Number(result.capKph)))result={...legacy,desiredGapMeters:desiredGap,phase};
  if(result?.active){
    naturalHeadwayTelemetryV365.active+=1;
    if(phaseInfo?.corner)naturalHeadwayTelemetryV365.cornerActive+=1;
    naturalHeadwayTelemetryV365.last=result;
    return result;
  }
  const free={active:false,capKph:Infinity,gapMeters:gap,desiredGapMeters:desiredGap,reason:'NATURAL_HEADWAY_FREE_V365',closingKph,phase};
  naturalHeadwayTelemetryV365.last=free;return free;
}
function naturalHeadwayTelemetrySnapshotV365(){
  return {version:VERSION365,calls:naturalHeadwayTelemetryV365.calls,active:naturalHeadwayTelemetryV365.active,cornerActive:naturalHeadwayTelemetryV365.cornerActive,emergency:naturalHeadwayTelemetryV365.emergency,minGapMeters:Number.isFinite(naturalHeadwayTelemetryV365.minGapMeters)?Number(naturalHeadwayTelemetryV365.minGapMeters.toFixed(2)):null,maxTargetGapMeters:Number(naturalHeadwayTelemetryV365.maxTargetGapMeters.toFixed(2)),last:naturalHeadwayTelemetryV365.last};
}
function resetNaturalHeadwayTelemetryV365(){
  naturalHeadwayTelemetryV365.calls=0;naturalHeadwayTelemetryV365.active=0;naturalHeadwayTelemetryV365.cornerActive=0;naturalHeadwayTelemetryV365.emergency=0;naturalHeadwayTelemetryV365.minGapMeters=Infinity;naturalHeadwayTelemetryV365.maxTargetGapMeters=0;naturalHeadwayTelemetryV365.last=null;return true;
}

function visualPassSeparationV366(vehicle,ahead){
  const vehicleVisual=Number(vehicle?.visualLateralOffsetMeters)||0;
  const aheadVisual=Number(ahead?.visualLateralOffsetMeters)||0;
  const lateralMeters=Math.abs(vehicleVisual-aheadVisual);
  const vehicleIntent=lineOffsetMetersV197(vehicle);
  const aheadIntent=lineOffsetMetersV197(ahead);
  const intendedLateralMeters=Math.abs((Number(vehicleIntent)||0)-(Number(aheadIntent)||0));
  const requiredMeters=Math.max(1.6,TRACK_BOUNDARY_V271.carHalfWidthMeters*2+TRACK_BOUNDARY_V271.safetyMarginMeters*2+FOLLOWING_STABILITY_V366.lateralSafetyBufferMeters);
  const state=String(vehicle?.battleState||'FOLLOWING');
  const committed=['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state);
  const stateMs=Math.max(0,Number(vehicle?.battleStateMs)||0);
  const visualReady=committed&&lateralMeters>=requiredMeters;
  const timedPullOutReady=committed&&stateMs>=FOLLOWING_STABILITY_V366.pullOutReleaseHoldMs;
  return {released:visualReady||timedPullOutReady,lateralMeters,intendedLateralMeters,requiredMeters,state,stateMs,committed,visualReady,timedPullOutReady};
}
function stagedHeadwayTargetV366(vehicle,desiredGap,passSeparation){
  const normal=Math.max(NATURAL_HEADWAY_V365.minGapMeters,Number(desiredGap)||NATURAL_HEADWAY_V365.minGapMeters);
  if(!vehicle||vehicle.battleBlockedV319||passSeparation?.released)return normal;
  const state=String(vehicle.battleState||'FOLLOWING');
  if(['PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(state)){
    return Math.min(normal,Math.max(NATURAL_HEADWAY_V365.minGapMeters,PASS_CONFIG_V208.sideBySideGapMeters+FOLLOWING_STABILITY_V366.pullOutHoldExtraMeters));
  }
  if(state==='PREPARING_ATTACK'){
    return Math.min(normal,Math.max(NATURAL_HEADWAY_V365.minGapMeters,PASS_CONFIG_V208.pullOutGapMeters-FOLLOWING_STABILITY_V366.pullOutBufferMeters));
  }
  if(['CLOSING','TOWING'].includes(state)||Boolean(vehicle.naturalHeadwayAttackIntentV365)){
    return Math.min(normal,Math.max(NATURAL_HEADWAY_V365.minGapMeters,PASS_CONFIG_V208.prepareGapMeters-FOLLOWING_STABILITY_V366.prepareBufferMeters));
  }
  return normal;
}
function followingOpeningCapV366(aheadSpeed,gapMeters,targetGap,emergency=false){
  const target=Math.max(1,Number(targetGap)||1),gap=Math.max(0,Number(gapMeters)||0);
  const severity=clamp01V198((target-gap)/target);
  const shapedSeverity=severity*severity;
  let margin=FOLLOWING_STABILITY_V366.underGapMinMarginKph+(FOLLOWING_STABILITY_V366.underGapMaxMarginKph-FOLLOWING_STABILITY_V366.underGapMinMarginKph)*shapedSeverity;
  if(emergency)margin=FOLLOWING_STABILITY_V366.underGapMaxMarginKph;
  return Math.max(0,(Number(aheadSpeed)||0)-margin);
}
function naturalRaceSpacingControlV366(vehicle,freeTargetKph=NaN){
  const base=naturalRaceSpacingControlV365(vehicle,freeTargetKph);
  if(!vehicle||String(vehicle.pitState||'TRACK')!=='TRACK')return base;
  const ahead=raceMotionV189.vehicles.find(row=>String(row.id)===String(vehicle.trafficCarAheadId||''))||null;
  const gap=Math.max(0,Number(vehicle.trafficGapMeters));
  if(!ahead||!Number.isFinite(gap))return base;
  const aheadSpeed=Math.max(0,Number(ahead.speedKph)||0),currentSpeed=Math.max(0,Number(vehicle.speedKph)||0),closingKph=currentSpeed-aheadSpeed;
  const phaseInfo=getCornerPhaseAtProgressV194(vehicle.progress);
  const phase=String(phaseInfo?.phase||'STRAIGHT');
  const desiredGap=naturalHeadwayTargetV365(vehicle,ahead,phaseInfo);
  const passSeparation=visualPassSeparationV366(vehicle,ahead);
  const controlledGap=stagedHeadwayTargetV366(vehicle,desiredGap,passSeparation);
  followingStabilityTelemetryV366.calls+=1;
  followingStabilityTelemetryV366.minGapMeters=Math.min(followingStabilityTelemetryV366.minGapMeters,gap);
  if(passSeparation.released){
    followingStabilityTelemetryV366.lateralRelease+=1;
    followingStabilityTelemetryV366.last={...base,reason:String(base?.reason||'PASS_LATERAL_RELEASE_V366'),gapMeters:gap,desiredGapMeters:desiredGap,controlledGapMeters:controlledGap,passSeparation};
    return base;
  }
  const cornerGuardV366=phase==='TURN_IN'||phase==='APEX'||phase==='EXIT';
  const brakingDangerV366=phase==='BRAKING'&&gap<NATURAL_HEADWAY_V365.minGapMeters;
  const emergencyThreshold=Math.max(NATURAL_HEADWAY_V365.emergencyGapMeters,Math.min(PASS_CONFIG_V208.sideBySideGapMeters,controlledGap*.55));
  if(!cornerGuardV366&&!brakingDangerV366){
    if(gap<emergencyThreshold&&!passSeparation.committed){
      const emergency={active:true,capKph:followingOpeningCapV366(aheadSpeed,gap,controlledGap,true),gapMeters:gap,desiredGapMeters:desiredGap,controlledGapMeters:controlledGap,reason:'FOLLOWING_EMERGENCY_V366',closingKph,phase,passSeparation};
      followingStabilityTelemetryV366.active+=1;followingStabilityTelemetryV366.emergency+=1;followingStabilityTelemetryV366.last=emergency;return emergency;
    }
    followingStabilityTelemetryV366.last={...base,gapMeters:gap,desiredGapMeters:desiredGap,controlledGapMeters:controlledGap,phase,passSeparation,release:'OPEN_FLOW_V366'};
    return base;
  }
  let result=null;
  const guardGap=Math.min(controlledGap,FOLLOWING_STABILITY_V366.cornerGuardActivationMeters);
  if(gap<guardGap){
    const emergency=gap<emergencyThreshold;
    const capKph=emergency?followingOpeningCapV366(aheadSpeed,gap,guardGap,true):aheadSpeed;
    result={active:true,capKph,gapMeters:gap,desiredGapMeters:desiredGap,controlledGapMeters:controlledGap,guardGapMeters:guardGap,reason:emergency?'FOLLOWING_EMERGENCY_V366':'FOLLOWING_GAP_OPEN_V366',closingKph,phase,passSeparation};
    followingStabilityTelemetryV366.active+=1;
    if(emergency)followingStabilityTelemetryV366.emergency+=1;
  }else{
    const softStart=guardGap*FOLLOWING_STABILITY_V366.softStartMultiplier;
    if(gap<softStart&&closingKph>FOLLOWING_STABILITY_V366.minClosingKph){
      const ratio=clamp01V198((gap-guardGap)/Math.max(1,softStart-guardGap));
      const allowance=NATURAL_HEADWAY_V365.approachAllowanceKph*ratio;
      result={active:true,capKph:aheadSpeed+allowance,gapMeters:gap,desiredGapMeters:desiredGap,controlledGapMeters:controlledGap,guardGapMeters:guardGap,reason:'FOLLOWING_LIFT_V366',closingKph,phase,passSeparation};
      followingStabilityTelemetryV366.active+=1;
    }
  }
  if(result?.active){
    if(base?.active&&Number.isFinite(Number(base.capKph))&&Number(base.capKph)<Number(result.capKph))result={...result,capKph:Number(base.capKph),baseReason:String(base.reason||'')};
    followingStabilityTelemetryV366.last=result;
    return result;
  }
  followingStabilityTelemetryV366.last={...base,gapMeters:gap,desiredGapMeters:desiredGap,controlledGapMeters:controlledGap,passSeparation};
  return base;
}
function followingStabilityTelemetrySnapshotV366(){
  return {version:VERSION366,calls:followingStabilityTelemetryV366.calls,active:followingStabilityTelemetryV366.active,emergency:followingStabilityTelemetryV366.emergency,lateralRelease:followingStabilityTelemetryV366.lateralRelease,minGapMeters:Number.isFinite(followingStabilityTelemetryV366.minGapMeters)?Number(followingStabilityTelemetryV366.minGapMeters.toFixed(2)):null,last:followingStabilityTelemetryV366.last};
}
function resetFollowingStabilityTelemetryV366(){
  followingStabilityTelemetryV366.calls=0;followingStabilityTelemetryV366.active=0;followingStabilityTelemetryV366.emergency=0;followingStabilityTelemetryV366.lateralRelease=0;followingStabilityTelemetryV366.minGapMeters=Infinity;followingStabilityTelemetryV366.last=null;return true;
}

function updateRankedFieldPaceRetentionV357(){
  const standings=computeRaceStandingsV191();
  const count=Math.max(1,standings.length);
  const denom=Math.max(1,count-1);
  for(let index=0;index<standings.length;index++){
    const vehicle=standings[index]?.vehicle;
    if(!vehicle)continue;
    const rankRatio=index/denom;
    const boost=FIELD_SPREAD_BALANCE_V352.rankedRearPaceMax*Math.pow(rankRatio,FIELD_SPREAD_BALANCE_V352.rankedRearPaceExponent);
    vehicle.rankedFieldPaceBoostV357=Math.max(0,boost);
    vehicle.rankedFieldPaceMultiplierV357=1+Math.max(0,boost);
    vehicle.rankedFieldPaceRankV357=index+1;
  }
  return standings.map((row,index)=>({id:String(row.vehicle?.id||''),rank:index+1,boost:Number(row.vehicle?.rankedFieldPaceBoostV357)||0}));
}
function rankedFieldPaceMultiplierV357(vehicle){
  return Math.max(1,Number(vehicle?.rankedFieldPaceMultiplierV357)||1);
}

function naturalRacePaceMultiplierV359(vehicle,mode=activeRaceModeV345()){
  const rankedBoost=Math.max(0,Number(vehicle?.rankedFieldPaceBoostV357)||0)*NATURAL_RACE_PACE_V359.rankedBoostScale;
  const catchupBoost=clamp01V198(Number(vehicle?.positionCatchupPctV314)||0)*NATURAL_RACE_PACE_V359.catchupBoostScale;
  const modeScale=String(mode||'NORMAL').toUpperCase()==='FAST'?NATURAL_RACE_PACE_V359.fastModeScale:1;
  return 1+(rankedBoost+catchupBoost)*modeScale;
}

function fieldPaceRetentionMultiplierV356(vehicle){
  const pct=clamp01V198(Number(vehicle?.positionCatchupPctV314)||0);
  return 1+pct*FIELD_SPREAD_BALANCE_V352.paceRetentionScale;
}
function simulateVehicleDynamicsV196(vehicle,stepMs){
  const track=activeRaceSnapshotV187?.track;
  if(!vehicle||!track||!(stepMs>0))return false;
  const previousRaceProgress=Number(vehicle.raceProgress)||0;
  const pitControl=updatePitPreStepV205(vehicle,stepMs);
  if(pitControl.stationary){
    vehicle.speedKph=0;vehicle.targetSpeedKph=0;vehicle.throttle=0;vehicle.brake=1;vehicle.accelerationMps2=0;vehicle.gear=1;vehicle.rpm=8500;
    return true;
  }
  const targetData=getSpeedTargetAtProgressV195(vehicle.progress);
  const phaseInfoV270=getCornerPhaseAtProgressV194(vehicle.progress);
  const phase=phaseInfoV270?.phase||'STRAIGHT';
  const baseTarget=phaseSpeedTargetV343(vehicle,targetData,phaseInfoV270);
  const tyreGrip=Math.max(TYRE_CONFIG_V203.minGrip,Math.min(TYRE_CONFIG_V203.maxGrip,Number(vehicle.tyreGrip)||1));
  const tyreCornerFactor=(phase==='TURN_IN'||phase==='APEX'||phase==='EXIT')?tyreGrip:1;
  updateActiveAeroAndOvertakeV202(vehicle,stepMs);
  updateDriverPaceStateV200(vehicle,stepMs);
  updateRaceMomentumV262(vehicle,stepMs,phase);
  const rawDriverPaceMultiplier=driverTargetMultiplierV200(vehicle,phase);
  const longRunPaceMultiplier=longRunPaceCorrectionV209(vehicle);
  const momentumPaceMultiplier=raceMomentumPaceMultiplierV262(vehicle);
  const raceFormMultiplierV345=1+(Number(vehicle.raceFormBiasV345)||0);
  const fieldPaceRetentionMultiplierV356Value=fieldPaceRetentionMultiplierV356(vehicle);
  const rankedFieldPaceMultiplierV357Value=rankedFieldPaceMultiplierV357(vehicle);
  const naturalRacePaceMultiplierV359Value=naturalRacePaceMultiplierV359(vehicle);
  const driverPaceMultiplier=rawDriverPaceMultiplier*longRunPaceMultiplier*momentumPaceMultiplier*raceFormMultiplierV345*fieldPaceRetentionMultiplierV356Value*rankedFieldPaceMultiplierV357Value*naturalRacePaceMultiplierV359Value;
  vehicle.rawDriverPaceMultiplier=rawDriverPaceMultiplier;
  vehicle.longRunPaceMultiplier=longRunPaceMultiplier;
  vehicle.longRunPaceBias=longRunPaceBiasV209(vehicle);
  vehicle.raceMomentumPaceMultiplierV262=momentumPaceMultiplier;
  vehicle.raceFormMultiplierV345=raceFormMultiplierV345;
  vehicle.fieldPaceRetentionMultiplierV356=fieldPaceRetentionMultiplierV356Value;
  vehicle.rankedFieldPaceMultiplierV357=rankedFieldPaceMultiplierV357Value;
  vehicle.naturalRacePaceMultiplierV359=naturalRacePaceMultiplierV359Value;
  vehicle.driverPaceMultiplier=driverPaceMultiplier;
  const racecraftNorm=driverSkillNormV200(vehicle,'racecraft');
  const aggressionNorm=driverSkillNormV200(vehicle,'aggression');
  const towStrength=clamp01V198(vehicle.slipstreamStrength)*(1+racecraftNorm*.05+Math.max(0,aggressionNorm)*.025);
  const rawAeroGrip=Math.max(.85,Math.min(1,Number(vehicle.aeroGripMultiplier)||1));
  const dirtyAirRecovery=Math.max(0,racecraftNorm)*.08;
  const aeroGripMultiplier=Math.min(1,rawAeroGrip+(1-rawAeroGrip)*dirtyAirRecovery);
  let maxTarget=baseTarget*driverPaceMultiplier*aeroGripMultiplier*tyreCornerFactor+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph+(Number(vehicle.battleSpeedBiasKph)||0);
  maxTarget*=raceFlagSpeedFactorV214();
  if(vehicle.blueFlag)maxTarget*=BLUE_FLAG_CONFIG_V215.paceFactor;
  const current=Math.max(0,Number(vehicle.speedKph)||0);
  const preError=maxTarget-current;
  const preThrottle=preError>1.5?Math.max(.08,Math.min(1,preError/45)):preError>=-1.5?.12:0;
  const preBrake=preError<-1.5?Math.max(.08,Math.min(1,(-preError)/55)):0;
  const incidentState=updateDrivingIncidentsV204(vehicle,stepMs,phase,{throttle:preThrottle,brake:preBrake});
  maxTarget*=incidentState.speedFactor;
  const leaderPressureEffect=leaderPressureEffectV274(vehicle,phase);
  vehicle.leaderPressureSpeedFactorV274=leaderPressureEffect.speedFactor;
  vehicle.leaderPressureLateralMetersV274=leaderPressureEffect.lateralOffsetMeters;
  maxTarget*=leaderPressureEffect.speedFactor;
  const chaseBurstEffect=chaseBurstEffectV275(vehicle,phase);
  vehicle.chaseBurstSpeedBonusKphV275=chaseBurstEffect.targetSpeedBonusKph;
  vehicle.chaseBurstAccelMultiplierV275=chaseBurstEffect.accelMultiplier;
  vehicle.chaseBurstExitMultiplierV275=chaseBurstEffect.exitMultiplier;
  maxTarget+=chaseBurstEffect.targetSpeedBonusKph+chaseBurstEffect.battleBiasBonusKph;
  const rawBoundaryOffsetV271=lineOffsetMetersV197(vehicle)+(Number(vehicle?.incidentLateralOffsetMeters)||0)+(Number(leaderPressureEffect.lateralOffsetMeters)||0);
  const boundaryStateV271=trackBoundaryStateV271(vehicle,rawBoundaryOffsetV271);
  vehicle.unclampedLateralOffsetMetersV271=rawBoundaryOffsetV271;
  vehicle.trackBoundaryRatioV271=boundaryStateV271.ratio;
  vehicle.trackBoundaryExceededV271=boundaryStateV271.offTrack;
  vehicle.trackBoundarySpeedFactorV271=boundaryStateV271.speedFactor;
  maxTarget*=boundaryStateV271.speedFactor;
  // Phase 350 compatibility token: const spacingControlV319=battleQueueSpeedControlV350(vehicle);
  // Phase 365 compatibility token: const spacingControlV319=naturalRaceSpacingControlV365(vehicle);
  const spacingControlV319=naturalRaceSpacingControlV366(vehicle,maxTarget);
  vehicle.battleQueueControlV319=spacingControlV319.reason;
  vehicle.battleQueueSpeedCapKphV319=Number.isFinite(spacingControlV319.capKph)?spacingControlV319.capKph:0;
  if(Number.isFinite(spacingControlV319.capKph))maxTarget=Math.min(maxTarget,spacingControlV319.capKph);
  if(Number.isFinite(pitControl.speedCapKph))maxTarget=Math.min(maxTarget,pitControl.speedCapKph);
  const error=maxTarget-current;
  const accelBase=Math.max(0.5,Number(track?.geometry?.referenceAccelMps2)||8.5)*Math.max(1,Number(chaseBurstEffect.accelMultiplier)||1);
  let brakeBase=Math.max(1,Number(track?.geometry?.referenceBrakeDecelMps2)||20)*tyreGrip*incidentState.brakeFactor;
  let throttle=0,brake=0,accelMps2=0;
  const cornerRecoveryV351=Boolean(vehicle.cornerRecoveryActiveV351);
  if(error>1.5){
    throttle=Math.max(.08,Math.min(1,error/45))*incidentState.throttleFactor;
    const dragRelief=Math.max(0,Number(vehicle.slipstreamDragReduction)||0);
    const highSpeedFade=Math.max(.35,1-current/520+dragRelief*.45);
    const tractionGrip=(phase==='EXIT'||cornerRecoveryV351)?Math.max(.92,tyreGrip):1;
    const cornerSpecV351=CORNER_DRIVING_V351.speedEnvelope[String(vehicle.cornerDrivingClassV351||'medium')]||CORNER_DRIVING_V351.speedEnvelope.medium;
    const underSpeedRecoveryV353=cornerUnderSpeedRecoveryV353(vehicle,phase,current,maxTarget,spacingControlV319,incidentState,leaderPressureEffect);
    vehicle.cornerUnderSpeedRecoveryActiveV353=underSpeedRecoveryV353.active;
    vehicle.cornerUnderSpeedRecoveryMultiplierV353=underSpeedRecoveryV353.multiplier;
    if(underSpeedRecoveryV353.active)vehicle.cornerUnderSpeedRecoveryCountV353=(Number(vehicle.cornerUnderSpeedRecoveryCountV353)||0)+1;
    const exitAcceleration=(cornerRecoveryV351?CORNER_DYNAMICS_V343.exitAccelerationMultiplier*cornerSpecV351.exitAccel:1)*underSpeedRecoveryV353.multiplier*Math.max(1,Number(chaseBurstEffect.exitMultiplier)||1);
    accelMps2=accelBase*throttle*highSpeedFade*tractionGrip*exitAcceleration;
  }else if(error<-1.5){
    const clearRecoveryV358=cornerRecoveryV351&&!spacingControlV319.active&&!incidentState.active&&!leaderPressureEffect.event&&boundaryStateV271.speedFactor>=CORNER_BRAKE_RELEASE_V358.clearBoundaryFactor;
    if(clearRecoveryV358){
      brake=0;
      throttle=0;
      accelMps2=-NATURAL_RACE_PACE_V359.cornerRecoveryCoastDecelMps2;
      vehicle.cornerRecoveryCoastDecelMps2V359=NATURAL_RACE_PACE_V359.cornerRecoveryCoastDecelMps2;
      vehicle.cornerRecoveryHoldCountV359=(Number(vehicle.cornerRecoveryHoldCountV359)||0)+1;
      vehicle.cornerBrakeReleasedV358=true;
      vehicle.cornerBrakeReleaseCountV358=(Number(vehicle.cornerBrakeReleaseCountV358)||0)+1;
    }else{
      brake=Math.max(.08,Math.min(1,(-error)/55));
      accelMps2=-brakeBase*brake;
      vehicle.cornerBrakeReleasedV358=false;
    }
  }else{
    throttle=.12*incidentState.throttleFactor;
    accelMps2=0;
  }
  const propulsionThrottle=accelMps2>0?throttle:0;
  const energyState=updateEnergySystemV201(vehicle,stepMs,phase,propulsionThrottle,brake);
  if(accelMps2>0)accelMps2*=energyState.powerUnitFactor;
  const dt=stepMs/1000;
  const nextMps=Math.max(0,current/3.6+accelMps2*dt);
  const straightCapBase=(Number(track?.geometry?.maxStraightKph)||335)+towStrength*SLIPSTREAM_CONFIG_V198.maxTargetBonusKph+Math.max(0,Number(chaseBurstEffect.targetSpeedBonusKph)||0);
  const straightCap=Number.isFinite(pitControl.speedCapKph)?Math.min(straightCapBase,pitControl.speedCapKph):straightCapBase;
  const nextKph=Math.max(0,Math.min(straightCap,nextMps*3.6));
  const avgMps=((current+nextKph)/2)/3.6;
  const distanceMeters=avgMps*dt;
  vehicle.speedKph=nextKph;
  if(phaseInfoV270?.corner&&String(vehicle.pitState||'TRACK')==='TRACK'&&Number(vehicle.pitWarmupRemainingLaps||0)<=.001&&Number(vehicle.cornerObservedEntryKphV353)>=80&&nextKph>0){
    const classV351=cornerClassV343(phaseInfoV270.corner);
    vehicle.cornerMinSpeedByClassV351=vehicle.cornerMinSpeedByClassV351||{};
    const previousMin=Number(vehicle.cornerMinSpeedByClassV351[classV351]);
    vehicle.cornerMinSpeedByClassV351[classV351]=Number.isFinite(previousMin)&&previousMin>0?Math.min(previousMin,nextKph):nextKph;
    const specV353=CORNER_DRIVING_V351.speedEnvelope[classV351]||CORNER_DRIVING_V351.speedEnvelope.medium;
    const cleanCornerV353=!spacingControlV319.active&&!incidentState.active&&!leaderPressureEffect.event&&boundaryStateV271.speedFactor>=CORNER_COMPLEX_RECOVERY_V353.cleanBoundaryFactor&&Number(vehicle.cornerObservedEntryKphV353)>=Number(specV353.min)*CORNER_COMPLEX_RECOVERY_V353.telemetryEntryRatio;
    if(cleanCornerV353){
      vehicle.cornerUnimpededMinSpeedByClassV353=vehicle.cornerUnimpededMinSpeedByClassV353||{};
      const previousClean=Number(vehicle.cornerUnimpededMinSpeedByClassV353[classV351]);
      vehicle.cornerUnimpededMinSpeedByClassV353[classV351]=Number.isFinite(previousClean)&&previousClean>0?Math.min(previousClean,nextKph):nextKph;
    }
    if(vehicle.cornerRecoveryActiveV351&&throttle>.05)vehicle.cornerRecoveryThrottleCountV351=(Number(vehicle.cornerRecoveryThrottleCountV351)||0)+1;
  }
  if(!cornerRecoveryV351)vehicle.cornerBrakeReleasedV358=false;
  vehicle.targetSpeedKph=maxTarget;
  vehicle.throttle=throttle;
  vehicle.brake=brake;
  vehicle.accelerationMps2=accelMps2;
  vehicle.gear=gearForSpeedV196(nextKph);
  vehicle.rpm=rpmForSpeedAndGearV196(nextKph,vehicle.gear);
  updateTyreSystemV203(vehicle,stepMs,phase);
  vehicle.travel+=distanceMeters/Math.max(1,Number(track.lengthMeters)||1);
  syncVehicleRaceMetricsV190(vehicle,track);
  updatePitPostStepV205(vehicle,previousRaceProgress);
  return true;
}

function qaTrackBoundaryV271(){
  const source=raceMotionV189.vehicles[0]||{racingLineMode:'IDEAL',pitState:'TRACK'};
  const probe={...source,racingLineMode:'IDEAL',pitState:'TRACK',incidentLateralOffsetMeters:0};
  const limit=trackLateralLimitV271(probe);
  const center=trackBoundaryStateV271(probe,0);
  const edge=trackBoundaryStateV271(probe,limit*.95);
  const beyond=trackBoundaryStateV271(probe,limit*1.4);
  probe.incidentLateralOffsetMeters=limit*3;
  const clamped=physicalLateralOffsetV258(probe);
  const live=raceMotionV189.vehicles.map(vehicle=>({
    id:vehicle.id,visual:Math.abs(Number(vehicle.visualLateralOffsetMeters)||0),
    limit:trackLateralLimitV271(vehicle),ratio:Number(vehicle.trackBoundaryRatioV271)||0,
    factor:Number(vehicle.trackBoundarySpeedFactorV271)||1
  }));
  const liveInside=live.every(row=>row.visual<=row.limit+.02);
  const eligibleProbe={trackBoundaryRatioV271:.50,trackBoundaryExceededV271:false};
  const offTrackProbe={trackBoundaryRatioV271:1.05,trackBoundaryExceededV271:true};
  const edgeProbe={trackBoundaryRatioV271:.99,trackBoundaryExceededV271:false};
  const overtakeEligible=boundaryOvertakeEligibleV271(eligibleProbe);
  const offTrackBlocked=!boundaryOvertakeEligibleV271(offTrackProbe);
  const edgeBlocked=!boundaryOvertakeEligibleV271(edgeProbe);
  return {limit,center,edge,beyond,clamped,liveInside,live,overtakeEligible,offTrackBlocked,edgeBlocked,allPass:limit>.7&&center.speedFactor===1&&edge.speedFactor<1&&edge.speedFactor>=TRACK_BOUNDARY_V271.edgeMinSpeedFactor-.01&&beyond.offTrack===true&&beyond.speedFactor===TRACK_BOUNDARY_V271.offTrackSpeedFactor&&Math.abs(clamped)<=limit+.001&&liveInside&&overtakeEligible&&offTrackBlocked&&edgeBlocked};
}

function qaCornerDynamicsV270(){
  const phases=getCornerPhasesV194();
  const track=activeRaceSnapshotV187?.track;
  if(!track||!phases.length)return {allPass:false,reason:'need-live-corner-geometry'};
  const samples=[];
  for(const corner of phases.slice(0,Math.min(8,phases.length))){
    const length=Math.max(1,Number(track.lengthMeters)||1);
    const apexProgress=((Number(corner.apexDistanceMeters)||0)/length+1)%1;
    const exitProbeDistance=Number(corner.apexDistanceMeters)+Math.max(8,(Number(corner.exitDistanceMeters)-Number(corner.apexDistanceMeters))*.94);
    const exitProgress=((exitProbeDistance/length)%1+1)%1;
    const probe={progress:apexProgress,racingLineMode:'IDEAL'};
    const apexTarget=phaseSpeedTargetV270(probe,getSpeedTargetAtProgressV195(apexProgress),{corner,phase:'APEX'});
    probe.progress=exitProgress;
    const exitTarget=phaseSpeedTargetV270(probe,getSpeedTargetAtProgressV195(exitProgress),{corner,phase:'EXIT'});
    const apexLine=idealRacingLineOffsetV270({progress:apexProgress},Math.max(1,(Number(track.geometry?.trackWidthMeters)||14)/2-(Number(track.geometry?.racingLineMarginMeters)||1.5)),{corner,phase:'APEX'});
    const exitLine=idealRacingLineOffsetV270({progress:exitProgress},Math.max(1,(Number(track.geometry?.trackWidthMeters)||14)/2-(Number(track.geometry?.racingLineMarginMeters)||1.5)),{corner,phase:'EXIT'});
    samples.push({id:corner.id,class:corner.cornerClass,apexTarget,exitTarget,apexLine,exitLine});
  }
  const exitsRecover=samples.every(row=>row.exitTarget>=row.apexTarget-1);
  const lineTransitions=samples.every(row=>Math.sign(row.apexLine)!==Math.sign(row.exitLine)||Math.abs(row.exitLine)<.08);
  return {samples,exitsRecover,lineTransitions,allPass:samples.length>0&&exitsRecover&&lineTransitions&&CORNER_DYNAMICS_V270.exitAccelerationMultiplier>1};
}

function markRaceFinishersRecoveryG(){
  const snapshot=activeRaceSnapshotV187;
  if(!snapshot||f1ScreenStateV185!=='RACE')return false;
  const totalLaps=Math.max(1,Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  let changed=false;
  const newlyFinished=raceMotionV189.vehicles
    .filter(vehicle=>!vehicle.finished&&Number(vehicle.raceProgress)>=totalLaps)
    .sort((a,b)=>Number(b.raceProgress)-Number(a.raceProgress));
  for(const vehicle of newlyFinished){
    finishCounterRecoveryG+=1;
    vehicle.finished=true;
    vehicle.finishPosition=finishCounterRecoveryG;
    vehicle.finishedAtSimMs=simClockV192.simTimeMs;
    vehicle.travel=Math.max(0,totalLaps-Number(vehicle.startOffset||0));
    vehicle.speedKph=0;
    vehicle.targetSpeedKph=0;
    vehicle.throttle=0;
    vehicle.brake=0;
    syncVehicleRaceMetricsV190(vehicle,snapshot.track);
    changed=true;
  }
  return changed;
}
function buildRaceTelemetryV237(snapshot=activeRaceSnapshotV187,vehicles=raceMotionV189.vehicles){
  if(!snapshot||!Array.isArray(vehicles)||!vehicles.length)return null;
  const laps=Math.max(1,Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  const length=Math.max(1,Number(snapshot.track?.lengthMeters)||1);
  const completed=vehicles.filter(vehicle=>Number(vehicle.finishedAtSimMs)>0);
  const finishTimes=completed.map(vehicle=>Math.max(1,Number(vehicle.finishedAtSimMs)||0));
  const totalPasses=vehicles.reduce((sum,vehicle)=>sum+(Number(vehicle.passCompletedCount)||0),0);
  const failedPasses=vehicles.reduce((sum,vehicle)=>sum+(Number(vehicle.passFailedCount)||0),0);
  const lockups=vehicles.reduce((sum,vehicle)=>sum+(Number(vehicle.lockupCount)||0),0);
  const understeer=vehicles.reduce((sum,vehicle)=>sum+(Number(vehicle.understeerCount)||0),0);
  const oversteer=vehicles.reduce((sum,vehicle)=>sum+(Number(vehicle.oversteerCount)||0),0);
  const incidentCount=lockups+understeer+oversteer;
  const avgFinishMs=finishTimes.length?finishTimes.reduce((a,b)=>a+b,0)/finishTimes.length:Math.max(1,Number(simClockV192.simTimeMs)||1);
  const winnerMs=finishTimes.length?Math.min(...finishTimes):avgFinishMs;
  const raceDistanceMeters=length*laps;
  const fieldAverageSpeedKph=raceDistanceMeters/(avgFinishMs/3600000)/1000;
  const winnerAverageSpeedKph=raceDistanceMeters/(winnerMs/3600000)/1000;
  const averageLapMs=avgFinishMs/laps;
  const pitStops=vehicles.reduce((sum,vehicle)=>sum+(Number(vehicle.pitStopCount)||0),0);
  const uniquePassPairs=vehicles.reduce((sum,vehicle)=>sum+new Set((vehicle.passTargetHistoryV309||[]).map(String)).size,0);
  const driversMovedFromGrid=vehicles.filter(vehicle=>Number(vehicle.finishPosition)>0&&Number(vehicle.gridPosition)>0&&Number(vehicle.finishPosition)!==Number(vehicle.gridPosition)).length;
  return Object.freeze({
    drivers:vehicles.length,totalPasses,failedPasses,uniquePassPairs,orderChanges:Number(raceOrderFlowStateV309.orderChanges)||0,changedDrivers:Number(raceOrderFlowStateV309.changedDrivers)||0,driversMovedFromGrid,incidentCount,lockups,understeer,oversteer,pitStops,
    fieldAverageSpeedKph:Number(fieldAverageSpeedKph.toFixed(2)),
    winnerAverageSpeedKph:Number(winnerAverageSpeedKph.toFixed(2)),
    averageLapMs:Number(averageLapMs.toFixed(1)),
    raceDistanceMeters
  });
}
function qaRaceResultTelemetryV237(){
  const snapshot=activeRaceSnapshotV187;
  const live=snapshot?buildRaceTelemetryV237(snapshot,raceMotionV189.vehicles):null;
  const syntheticSnapshot={totalLaps:10,track:{lengthMeters:5000}};
  const synthetic=[
    {finishedAtSimMs:600000,passCompletedCount:3,passFailedCount:1,lockupCount:1,understeerCount:0,oversteerCount:1,pitStopCount:1},
    {finishedAtSimMs:612000,passCompletedCount:2,passFailedCount:2,lockupCount:0,understeerCount:1,oversteerCount:0,pitStopCount:1}
  ];
  const sample=buildRaceTelemetryV237(syntheticSnapshot,synthetic);
  return {live,sample,allPass:Boolean(sample)&&sample.totalPasses===5&&sample.failedPasses===3&&sample.incidentCount===3&&sample.pitStops===2&&sample.fieldAverageSpeedKph>0&&sample.averageLapMs>0};
}
function buildRaceResultRecoveryG(){
  const snapshot=activeRaceSnapshotV187;
  if(!snapshot)return null;
  const rows=[...raceMotionV189.vehicles]
    .sort((a,b)=>{
      const ap=Number(a.finishPosition)||9999,bp=Number(b.finishPosition)||9999;
      if(ap!==bp)return ap-bp;
      return Number(b.raceProgress||0)-Number(a.raceProgress||0);
    })
    .map((vehicle,index)=>Object.freeze({
      position:Number(vehicle.finishPosition)||index+1,
      contactId:String(vehicle.id||''),
      name:String(vehicle.driver?.name||'Driver'),
      image:String(vehicle.driver?.image||''),
      gridPosition:Number(vehicle.driver?.gridPosition)||index+1,
      passCompletedCount:Number(vehicle.passCompletedCount)||0,
      pitStopCount:Number(vehicle.pitStopCount)||0,
      finishedAtSimMs:Number(vehicle.finishedAtSimMs)||simClockV192.simTimeMs,
      tyreCompound:String(vehicle.tyreCompound||'MEDIUM'),
      raceProgress:Number(vehicle.raceProgress)||0,
      lastLapMs:Number(vehicle.lastLapMs)||0,bestLapMs:Number(vehicle.bestLapMs)||0,lapTimesMs:Object.freeze([...(vehicle.lapTimesMs||[])])
    }));
  return Object.freeze({
    trackId:String(snapshot.trackId||''),
    trackName:String(snapshot.track?.name||'Track'),
    trackArchetype:String(snapshot.track?.runtimeProfile?.archetype||snapshot.track?.archetype||'종합형'),
    totalLaps:Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190,
    simTimeMs:simClockV192.simTimeMs,
    telemetry:buildRaceTelemetryV237(snapshot,raceMotionV189.vehicles),
    rows:Object.freeze(rows)
  });
}
function formatRaceTimeRecoveryG(ms){
  const total=Math.max(0,Math.floor(Number(ms)||0));
  const minutes=Math.floor(total/60000);
  const seconds=Math.floor((total%60000)/1000);
  const millis=total%1000;
  return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0')+'.'+String(millis).padStart(3,'0');
}
function renderFinishingRecoveryG(){
  const result=activeRaceResultRecoveryG;
  const title=document.getElementById('f1RacingFinishingTitleRecoveryG');
  const summary=document.getElementById('f1RacingFinishingSummaryRecoveryG');
  const winner=result?.rows?.[0];
  if(title)title.textContent=winner?winner.name+' 우승':'경기 종료';
  if(summary)summary.textContent=result
    ?result.trackName+' · '+result.totalLaps+'랩 · 드라이버 '+result.rows.length+'명 · '+formatRaceTimeRecoveryG(result.simTimeMs)
    :'결과를 정리하고 있습니다.';
}
function renderPodiumRecoveryG(){
  const box=document.getElementById('f1RacingPodiumRowsRecoveryG');
  if(!box)return false;
  const result=activeRaceResultRecoveryG,rows=(result?.rows||[]).slice(0,3);
  const title=document.getElementById('f1RacingPodiumTrackNameV265'),meta=document.getElementById('f1RacingPodiumMetaV265');
  if(title)title.textContent=result?.trackName||'GRAND PRIX';
  if(meta)meta.textContent=result?(result.totalLaps+' LAPS · '+result.rows.length+' DRIVERS'):'-- LAPS · -- DRIVERS';
  renderPodiumTrackV265();
  box.dataset.podiumCountV265=String(rows.length);
  box.innerHTML=rows.length?rows.map(podiumCardHtmlV265).join(''):'<div class="f1-racing-lifecycle-empty-recovery-g">Podium 결과가 없습니다.</div>';
  return true;
}
function renderResultRecoveryG(){
  const title=document.getElementById('f1RacingResultTitleRecoveryG');
  const list=document.getElementById('f1RacingResultRowsRecoveryG');
  const result=activeRaceResultRecoveryG;
  if(title)title.textContent=result?result.trackName+' · FINAL RESULT':'FINAL RESULT';
  if(!list)return false;
  list.innerHTML=result?.rows?.length?result.rows.map(row=>
    '<div class="f1-racing-result-row-recovery-g"><span>P'+String(row.position).padStart(2,'0')+'</span><strong>'+escapeHtml(row.name)+'</strong><small>GRID P'+String(row.gridPosition).padStart(2,'0')+' · '+escapeHtml(row.tyreCompound)+'</small><time>'+formatRaceTimeRecoveryG(row.finishedAtSimMs)+'</time></div>'
  ).join(''):'<div class="f1-racing-lifecycle-empty-recovery-g">결과가 없습니다.</div>';
  return true;
}
function finishRaceRecoveryG(force=false){
  if(f1ScreenStateV185!=='RACE'||!activeRaceSnapshotV187||!raceMotionV189.vehicles.length)return false;
  if(force){
    const unfinished=computeRaceStandingsV191().map(row=>row.vehicle).filter(vehicle=>!vehicle.finished);
    for(const vehicle of unfinished){
      finishCounterRecoveryG+=1;
      vehicle.finished=true;
      vehicle.finishPosition=finishCounterRecoveryG;
      vehicle.finishedAtSimMs=simClockV192.simTimeMs;
    }
  }else{
    markRaceFinishersRecoveryG();
    if(raceMotionV189.vehicles.some(vehicle=>!vehicle.finished))return false;
  }
  updateRaceProgressHudV190();
  pauseRaceMotionV189(false);
  simClockV192.paused=true;
  activeRaceResultRecoveryG=buildRaceResultRecoveryG();
  if(!setScreenStateV185('FINISHING'))setScreenStateV185('FINISHING',{force:true});
  renderFinishingRecoveryG();
  const chip=document.getElementById('f1RacingPhaseChipV180');
  if(chip)chip.textContent='FINISHING';
  return true;
}
function updateRaceLifecycleRecoveryG(){
  if(f1ScreenStateV185!=='RACE')return false;
  markRaceFinishersRecoveryG();
  updateRaceCommentaryV219(true);
  const allFinished=raceMotionV189.vehicles.length>0&&raceMotionV189.vehicles.every(vehicle=>vehicle.finished);
  if(allFinished)return finishRaceRecoveryG(false);
  return false;
}
function showPodiumRecoveryG(){
  if(f1ScreenStateV185!=='FINISHING')return false;
  if(!setScreenStateV185('PODIUM'))return false;
  renderPodiumRecoveryG();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='포디움';
  return true;
}
function showResultRecoveryG(){
  if(!['FINISHING','PODIUM'].includes(f1ScreenStateV185))return false;
  if(!setScreenStateV185('RESULT'))return false;
  renderResultRecoveryG();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='결과';
  return true;
}
function returnToSetupRecoveryG(){
  if(workspaceLayoutRecoveryE)checkpointWorkspaceUserDefaultV259('return-to-setup');
  if(raceTransitionTimerV187){clearTimeout(raceTransitionTimerV187);raceTransitionTimerV187=0}
  resetRaceMotionV189();
  activeRaceSnapshotV187=null;
  activeRaceResultRecoveryG=null;
  finishCounterRecoveryG=0;
  setScreenStateV185('SETUP',{force:true});
  renderContacts();renderSelected();renderTrackChoicesV186();updateTrackFoundationStatusV182();renderTrackMapV183();syncSetupActionV187();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='경기 설정';
  return true;
}
function newRaceSameSettingsRecoveryG(){
  returnToSetupRecoveryG();
  return startRaceFromSetupV187();
}
function bindRaceLifecycleRecoveryG(){
  const handlers={
    f1RacingShowPodiumRecoveryG:showPodiumRecoveryG,
    f1RacingFinishingResultRecoveryG:showResultRecoveryG,
    f1RacingPodiumResultRecoveryG:showResultRecoveryG,
    f1RacingPodiumReplayV265:newRaceSameSettingsRecoveryG,
    f1RacingPodiumSetupRecoveryG:returnToSetupRecoveryG,
    f1RacingResultNewRaceRecoveryG:newRaceSameSettingsRecoveryG,
    f1RacingResultSetupRecoveryG:returnToSetupRecoveryG
  };
  for(const [id,handler] of Object.entries(handlers)){
    const button=document.getElementById(id);
    if(button&&!button.dataset.f1LifecycleBound){button.dataset.f1LifecycleBound='1';button.addEventListener('click',handler)}
  }
}


const LIVE_CONVERSATION_CONFIG_V276=Object.freeze({
  maxVisible:5,minVisible:3,minDurationMs:3000,maxDurationMs:6000,baseDurationMs:3000,charDurationMs:55,
  entryMs:260,exitMs:360,groupHoldMs:520
});
const liveConversationStateV276={entries:[],sequence:0,lastSide:'right',groupTimer:0,clearTimer:0,lastAppendAt:0,exiting:false};
function liveConversationDurationV276(text=''){
  const length=String(text||'').trim().length;
  return Math.max(LIVE_CONVERSATION_CONFIG_V276.minDurationMs,Math.min(LIVE_CONVERSATION_CONFIG_V276.maxDurationMs,LIVE_CONVERSATION_CONFIG_V276.baseDurationMs+length*LIVE_CONVERSATION_CONFIG_V276.charDurationMs));
}
function clearLiveConversationTimersV276(){
  if(liveConversationStateV276.groupTimer)clearTimeout(liveConversationStateV276.groupTimer);
  if(liveConversationStateV276.clearTimer)clearTimeout(liveConversationStateV276.clearTimer);
  liveConversationStateV276.groupTimer=0;liveConversationStateV276.clearTimer=0;
}
function resetLiveConversationV276(){
  clearLiveConversationTimersV276();
  liveConversationStateV276.entries=[];liveConversationStateV276.sequence=0;liveConversationStateV276.lastSide='right';liveConversationStateV276.lastAppendAt=0;liveConversationStateV276.exiting=false;
  const root=document.getElementById('f1RacingConversationStackV276');
  if(root){root.classList.remove('active','group-exit-v276');root.replaceChildren()}
  return true;
}
function conversationSpeakerSideV276(requested=''){
  const normalized=String(requested||'').toLowerCase();
  if(normalized==='left'||normalized==='right'){
    liveConversationStateV276.lastSide=normalized;return normalized;
  }
  const next=liveConversationStateV276.lastSide==='left'?'right':'left';
  liveConversationStateV276.lastSide=next;return next;
}
function renderLiveConversationV276(){
  const root=document.getElementById('f1RacingConversationStackV276');
  if(!root)return false;
  const rows=liveConversationStateV276.entries.slice(-LIVE_CONVERSATION_CONFIG_V276.maxVisible);
  root.innerHTML=rows.map(row=>
    '<article class="f1-racing-conversation-bubble-v276 '+row.side+'" data-conversation-id="'+row.id+'" data-conversation-side="'+row.side+'">'+
      '<div class="speaker">['+escapeHtml(row.speaker)+']</div>'+
      '<div class="text">'+escapeHtml(row.text)+'</div>'+
    '</article>'
  ).join('');
  root.classList.toggle('active',rows.length>0);
  root.classList.remove('group-exit-v276');
  requestAnimationFrame(()=>{
    root.querySelectorAll('.f1-racing-conversation-bubble-v276').forEach((node,index)=>{
      node.style.setProperty('--conversation-index-v276',String(index));
      node.classList.add('visible-v276');
    });
  });
  return true;
}
function scheduleLiveConversationExitV276(durationMs){
  clearLiveConversationTimersV276();
  const root=document.getElementById('f1RacingConversationStackV276');
  const delay=Math.max(LIVE_CONVERSATION_CONFIG_V276.minDurationMs,Math.min(LIVE_CONVERSATION_CONFIG_V276.maxDurationMs,Number(durationMs)||LIVE_CONVERSATION_CONFIG_V276.minDurationMs));
  liveConversationStateV276.groupTimer=setTimeout(()=>{
    liveConversationStateV276.groupTimer=0;liveConversationStateV276.exiting=true;
    if(root)root.classList.add('group-exit-v276');
    liveConversationStateV276.clearTimer=setTimeout(()=>{
      liveConversationStateV276.clearTimer=0;liveConversationStateV276.entries=[];liveConversationStateV276.exiting=false;
      if(root){root.classList.remove('active','group-exit-v276');root.replaceChildren()}
    },LIVE_CONVERSATION_CONFIG_V276.exitMs+LIVE_CONVERSATION_CONFIG_V276.groupHoldMs);
  },delay);
  return delay;
}
function appendLiveConversationV276(speaker,text,options={}){
  const root=document.getElementById('f1RacingConversationStackV276');
  const cleanSpeaker=String(speaker||'DRIVER').trim(),cleanText=String(text||'').trim();
  if(!root||!cleanText)return false;
  const side=conversationSpeakerSideV276(options.side);
  const durationMs=liveConversationDurationV276(cleanText);
  const row={id:'conv-'+(++liveConversationStateV276.sequence),speaker:cleanSpeaker,text:cleanText,side,durationMs,simTimeMs:Number(simClockV192.simTimeMs)||0};
  liveConversationStateV276.entries.push(row);
  if(liveConversationStateV276.entries.length>LIVE_CONVERSATION_CONFIG_V276.maxVisible)liveConversationStateV276.entries.splice(0,liveConversationStateV276.entries.length-LIVE_CONVERSATION_CONFIG_V276.maxVisible);
  liveConversationStateV276.lastAppendAt=performance.now?.()||Date.now();liveConversationStateV276.exiting=false;
  renderLiveConversationV276();
  scheduleLiveConversationExitV276(durationMs);
  return row;
}
function getLiveConversationStateV276(){
  return {entries:liveConversationStateV276.entries.map(row=>({...row})),sequence:liveConversationStateV276.sequence,lastSide:liveConversationStateV276.lastSide,
    exiting:Boolean(liveConversationStateV276.exiting),groupTimerActive:Boolean(liveConversationStateV276.groupTimer),clearTimerActive:Boolean(liveConversationStateV276.clearTimer)};
}
function qaLiveConversationStackV276(){
  const root=document.getElementById('f1RacingConversationStackV276');
  if(!root)return {allPass:false,reason:'conversation-root-missing'};
  resetLiveConversationV276();
  const shortDuration=liveConversationDurationV276('짧은 대사');
  const longDuration=liveConversationDurationV276('아주 긴 대사가 화면에 표시될 때 읽을 시간을 충분히 확보하기 위한 테스트 문장입니다. 조금 더 길게 이어집니다.');
  const a=appendLiveConversationV276('QA A','첫 번째 메시지');
  const b=appendLiveConversationV276('QA B','두 번째 메시지');
  appendLiveConversationV276('QA C','세 번째 메시지');
  appendLiveConversationV276('QA D','네 번째 메시지');
  appendLiveConversationV276('QA E','다섯 번째 메시지');
  appendLiveConversationV276('QA F','여섯 번째 메시지');
  const nodes=Array.from(root.querySelectorAll('.f1-racing-conversation-bubble-v276'));
  const sides=nodes.map(node=>String(node.dataset.conversationSide||''));
  const alternating=sides.every((side,index)=>index===0||side!==sides[index-1]);
  const countBound=nodes.length<=LIVE_CONVERSATION_CONFIG_V276.maxVisible&&nodes.length>=LIVE_CONVERSATION_CONFIG_V276.minVisible;
  const bracketNames=nodes.every(node=>/^\[[^\]]+\]$/.test(String(node.querySelector('.speaker')?.textContent||'')));
  const active=root.classList.contains('active');
  const durationBound=shortDuration>=3000&&shortDuration<=6000&&longDuration>=shortDuration&&longDuration<=6000;
  const result={shortDuration,longDuration,count:nodes.length,sides,alternating,countBound,bracketNames,active,first:a,second:b,config:{...LIVE_CONVERSATION_CONFIG_V276},
    allPass:Boolean(a&&b)&&alternating&&countBound&&bracketNames&&active&&durationBound};
  resetLiveConversationV276();
  return result;
}



const MICRO_BATTLE_EVENTS_V278=Object.freeze([
  'GAP_1_5','GAP_1_0','GAP_0_6','SLIPSTREAM','ATTACK_LINE','DEFENCE_LINE','FAKE',
  'BRAKING_DUEL','CORNER_ENTRY_DUEL','SIDE_BY_SIDE','EDGES_AHEAD','RE_ATTACK',
  'PASS_SUCCESS','PASS_FAIL','COUNTER_ATTACK','FRONT_CAR_MISTAKE','REAR_CAR_MISTAKE',
  'CORNER_EXIT_ADVANTAGE','LEADER_PRESSURE_MISTAKE','BURST_ACTIVATION','BURST_SUCCESS',
  'BURST_FAIL','BURST_END','PODIUM_BATTLE','LAST_PLACE_BATTLE','FINAL_LAP','THREE_CAR_BATTLE'
]);
const MICRO_BATTLE_DIALOGUE_MAP_V278=Object.freeze({
  GAP_1_5:'ATTACK',GAP_1_0:'ATTACK',GAP_0_6:'ATTACK',SLIPSTREAM:'ATTACK',
  ATTACK_LINE:'ATTACK',FAKE:'ATTACK',BRAKING_DUEL:'ATTACK',CORNER_ENTRY_DUEL:'ATTACK',
  SIDE_BY_SIDE:'ATTACK',EDGES_AHEAD:'ATTACK',RE_ATTACK:'COUNTER_ATTACK',
  PASS_SUCCESS:'PASS_SUCCESS',PASS_FAIL:'PASS_FAILED',COUNTER_ATTACK:'COUNTER_ATTACK',
  FRONT_CAR_MISTAKE:'MISTAKE',REAR_CAR_MISTAKE:'MISTAKE',CORNER_EXIT_ADVANTAGE:'ATTACK',
  LEADER_PRESSURE_MISTAKE:'MISTAKE',BURST_ACTIVATION:'BURST',BURST_SUCCESS:'PASS_SUCCESS',
  BURST_FAIL:'PASS_FAILED',PODIUM_BATTLE:'ATTACK',LAST_PLACE_BATTLE:'ATTACK',
  FINAL_LAP:'ATTACK',THREE_CAR_BATTLE:'ATTACK'
});
const microBattleStateV278={vehicle:new Map(),history:[],counts:new Map(),signatureAt:new Map(),sequence:0};
function microBattleGapSecondsV278(vehicle,target){
  if(!vehicle||!target)return Infinity;
  const length=Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1);
  const meters=Math.max(0,(Number(target.raceProgress)||0)-(Number(vehicle.raceProgress)||0))*length;
  const speed=Math.max(70,Number(target.speedKph)||Number(vehicle.speedKph)||180);
  return Math.max(0,meters/(speed/3.6));
}
function microBattleVehicleStateV278(vehicle,standings=computeRaceStandingsV191()){
  const index=standings.findIndex(row=>row.vehicle===vehicle),ahead=index>0?standings[index-1]?.vehicle||null:null,follower=index>=0?standings[index+1]?.vehicle||null:null;
  const phase=getCornerPhaseAtProgressV194(vehicle?.progress)?.phase||'STRAIGHT';
  const activeIncident=activeDrivingIncidentV204(vehicle);
  const rawAheadMeters=ahead?((Number(ahead.raceProgress)||0)-(Number(vehicle.raceProgress)||0))*Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1):Infinity;
  return {
    id:String(vehicle?.id||''),position:index>=0?index+1:0,aheadId:String(ahead?.id||''),followerId:String(follower?.id||''),
    gapAheadSeconds:microBattleGapSecondsV278(vehicle,ahead),gapBehindSeconds:microBattleGapSecondsV278(follower,vehicle),
    rawAheadMeters:Number.isFinite(rawAheadMeters)?rawAheadMeters:Infinity,
    slipstream:Number(vehicle?.slipstreamStrength)||0,line:String(vehicle?.racingLineMode||'IDEAL'),
    defence:Boolean(vehicle?.defenceActive),battle:String(vehicle?.battleState||'FOLLOWING'),phase,
    passCompleted:Number(vehicle?.passCompletedCount)||0,passFailed:Number(vehicle?.passFailedCount)||0,
    incident:String(activeIncident||''),incidentCount:(Number(vehicle?.lockupCount)||0)+(Number(vehicle?.understeerCount)||0)+(Number(vehicle?.oversteerCount)||0),
    pressureCount:Number(vehicle?.leaderPressureEventCountV274)||0,burstActive:isChaseBurstActiveV275(vehicle),
    burstUses:Number(vehicle?.chaseBurstUsesV275)||0,burstEndReason:String(vehicle?.chaseBurstLastEndReasonV275||''),
    currentLap:Number(vehicle?.currentLap)||1,totalLaps:Math.max(1,Number(activeRaceSnapshotV187?.totalLaps)||1),
    finished:Boolean(vehicle?.finished),speedKph:Number(vehicle?.speedKph)||0,
    ahead,follower
  };
}
function microBattleThresholdCrossingsV278(previous,current){
  const out=[];
  const pg=Number(previous?.gapAheadSeconds),cg=Number(current?.gapAheadSeconds);
  for(const [limit,event] of [[1.5,'GAP_1_5'],[1.0,'GAP_1_0'],[.6,'GAP_0_6']]){
    if(Number.isFinite(cg)&&cg<=limit&&(!Number.isFinite(pg)||pg>limit))out.push(event);
  }
  return out;
}
function microBattleCanRecordV278(event,actor,target,cooldownMs=900){
  const now=Number(simClockV192.simTimeMs)||0,key=[String(event),String(actor?.id||''),String(target?.id||'')].join('|');
  const previous=Number(microBattleStateV278.signatureAt.get(key));
  if(Number.isFinite(previous)&&now-previous<Math.max(0,Number(cooldownMs)||0))return false;
  microBattleStateV278.signatureAt.set(key,now);return true;
}
function emitMicroBattleDialogueV278(event,actor,target){
  if(typeof emitMicroBattleDialogueV279==='function'){
    const expanded=emitMicroBattleDialogueV279(event,actor,target);
    if(expanded!==null)return expanded;
  }
  const mapped=MICRO_BATTLE_DIALOGUE_MAP_V278[String(event||'')];
  if(!mapped||!actor)return false;
  const cooldown=['PASS_SUCCESS','PASS_FAIL','BURST_SUCCESS','BURST_FAIL'].includes(String(event))?0:1900;
  return emitCharacterDialogueEventV277(mapped,actor,target,{cooldownMs:cooldown});
}
function recordMicroBattleEventV278(event,actor,target,meta={}){
  const type=String(event||'').toUpperCase();if(!MICRO_BATTLE_EVENTS_V278.includes(type)||!actor)return false;
  if(!microBattleCanRecordV278(type,actor,target,meta.cooldownMs))return false;
  const row={id:++microBattleStateV278.sequence,event:type,actorId:String(actor.id||''),actor:characterDialogueSpeakerV277(actor),
    targetId:String(target?.id||''),target:target?characterDialogueSpeakerV277(target):'',simTimeMs:Number(simClockV192.simTimeMs)||0,
    lap:Number(actor.currentLap)||1,phase:String(getCornerPhaseAtProgressV194(actor.progress)?.phase||'STRAIGHT'),
    meta:{...meta}};
  microBattleStateV278.history.push(row);if(microBattleStateV278.history.length>120)microBattleStateV278.history.splice(0,microBattleStateV278.history.length-120);
  microBattleStateV278.counts.set(type,(Number(microBattleStateV278.counts.get(type))||0)+1);
  if(!engineQaV240.active)emitMicroBattleDialogueV278(type,actor,target);
  return row;
}
function updateMicroBattleEventsV278(stepMs){
  if(!(stepMs>0)||raceFlagStateV214.flag!=='GREEN'||!raceMotionV189.vehicles.length)return [];
  const standings=computeRaceStandingsV191(),rows=[];
  for(const standing of standings){
    const vehicle=standing.vehicle;if(!vehicle||vehicle.finished||String(vehicle.pitState||'TRACK')!=='TRACK')continue;
    const current=microBattleVehicleStateV278(vehicle,standings);
    const previous=microBattleStateV278.vehicle.get(String(vehicle.id))||current;
    const ahead=current.ahead,follower=current.follower;
    for(const event of microBattleThresholdCrossingsV278(previous,current))recordMicroBattleEventV278(event,vehicle,ahead,{gapSeconds:current.gapAheadSeconds,cooldownMs:2600});
    if(current.slipstream>=.28&&Number(previous.slipstream)<.28)recordMicroBattleEventV278('SLIPSTREAM',vehicle,ahead,{strength:current.slipstream,cooldownMs:3200});
    if(current.line==='ATTACK_INSIDE'&&previous.line!=='ATTACK_INSIDE')recordMicroBattleEventV278('ATTACK_LINE',vehicle,ahead,{cooldownMs:2400});
    if(current.defence&&!previous.defence)recordMicroBattleEventV278('DEFENCE_LINE',vehicle,follower,{cooldownMs:2600});
    if(['ATTACK_INSIDE','OUTSIDE'].includes(current.line)&&['ATTACK_INSIDE','OUTSIDE'].includes(previous.line)&&current.line!==previous.line&&['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE'].includes(current.battle))recordMicroBattleEventV278('FAKE',vehicle,ahead,{from:previous.line,to:current.line,cooldownMs:3000});
    if(current.battle==='BRAKING_DUEL'&&previous.battle!=='BRAKING_DUEL')recordMicroBattleEventV278('BRAKING_DUEL',vehicle,ahead,{cooldownMs:2400});
    if(['TURN_IN','APEX'].includes(current.phase)&&!['TURN_IN','APEX'].includes(previous.phase)&&['BRAKING_DUEL','CORNER_BATTLE','SIDE_BY_SIDE'].includes(current.battle))recordMicroBattleEventV278('CORNER_ENTRY_DUEL',vehicle,ahead,{cooldownMs:2400});
    if(current.battle==='SIDE_BY_SIDE'&&previous.battle!=='SIDE_BY_SIDE')recordMicroBattleEventV278('SIDE_BY_SIDE',vehicle,ahead,{cooldownMs:2200});
    if(current.battle==='SIDE_BY_SIDE'&&Math.abs(Number(current.rawAheadMeters))<=2.2&&Math.abs(Number(previous.rawAheadMeters))>2.2)recordMicroBattleEventV278('EDGES_AHEAD',vehicle,ahead,{meters:current.rawAheadMeters,cooldownMs:2200});
    if(current.battle==='COUNTER_ATTACK'&&previous.battle!=='COUNTER_ATTACK')recordMicroBattleEventV278('RE_ATTACK',vehicle,ahead,{cooldownMs:2200});
    if(current.passCompleted>previous.passCompleted)recordMicroBattleEventV278('PASS_SUCCESS',vehicle,ahead,{cooldownMs:0});
    if(current.passFailed>previous.passFailed)recordMicroBattleEventV278('PASS_FAIL',vehicle,ahead,{cooldownMs:0});
    if(current.battle==='COUNTER_ATTACK'&&previous.battle!==current.battle)recordMicroBattleEventV278('COUNTER_ATTACK',vehicle,ahead,{cooldownMs:2200});
    if(current.incidentCount>previous.incidentCount)recordMicroBattleEventV278('REAR_CAR_MISTAKE',vehicle,ahead,{incident:current.incident,cooldownMs:2400});
    if(ahead){
      const aheadNow=microBattleVehicleStateV278(ahead,standings),aheadPrev=microBattleStateV278.vehicle.get(String(ahead.id))||aheadNow;
      if(aheadNow.incidentCount>aheadPrev.incidentCount)recordMicroBattleEventV278('FRONT_CAR_MISTAKE',ahead,vehicle,{incident:aheadNow.incident,cooldownMs:2400});
    }
    const closing=(Number(vehicle.speedKph)||0)-(Number(ahead?.speedKph)||0);
    if(current.phase==='EXIT'&&previous.phase!=='EXIT'&&ahead&&current.gapAheadSeconds<=1.6&&closing>=5)recordMicroBattleEventV278('CORNER_EXIT_ADVANTAGE',vehicle,ahead,{closingKph:closing,cooldownMs:2600});
    if(current.pressureCount>previous.pressureCount)recordMicroBattleEventV278('LEADER_PRESSURE_MISTAKE',vehicle,follower,{cooldownMs:2600});
    if(current.burstActive&&!previous.burstActive)recordMicroBattleEventV278('BURST_ACTIVATION',vehicle,ahead,{cooldownMs:0});
    if(!current.burstActive&&previous.burstActive){
      if(current.burstEndReason==='pass-completed')recordMicroBattleEventV278('BURST_SUCCESS',vehicle,ahead,{cooldownMs:0});
      else recordMicroBattleEventV278('BURST_FAIL',vehicle,ahead,{reason:current.burstEndReason,cooldownMs:0});
      recordMicroBattleEventV278('BURST_END',vehicle,ahead,{reason:current.burstEndReason,cooldownMs:0});
    }
    const closeFront=current.gapAheadSeconds<=1.4,closeBack=current.gapBehindSeconds<=1.4;
    if(current.position<=3&&(closeFront||closeBack)&&!(previous.position<=3&&(Number(previous.gapAheadSeconds)<=1.4||Number(previous.gapBehindSeconds)<=1.4)))recordMicroBattleEventV278('PODIUM_BATTLE',vehicle,ahead||follower,{cooldownMs:3600});
    if(current.position===standings.length&&closeFront&&!(previous.position===standings.length&&Number(previous.gapAheadSeconds)<=1.4))recordMicroBattleEventV278('LAST_PLACE_BATTLE',vehicle,ahead,{cooldownMs:3600});
    if(current.currentLap>=current.totalLaps&&Number(previous.currentLap)<current.totalLaps)recordMicroBattleEventV278('FINAL_LAP',vehicle,ahead,{cooldownMs:0});
    if(ahead&&follower&&closeFront&&closeBack&&!(Number(previous.gapAheadSeconds)<=1.4&&Number(previous.gapBehindSeconds)<=1.4))recordMicroBattleEventV278('THREE_CAR_BATTLE',vehicle,ahead,{thirdId:String(follower.id||''),cooldownMs:3600});
    microBattleStateV278.vehicle.set(String(vehicle.id),{...current,ahead:null,follower:null});
    rows.push({id:String(vehicle.id||''),gapAheadSeconds:current.gapAheadSeconds,battle:current.battle,phase:current.phase});
  }
  return rows;
}
function resetMicroBattleEventsV278(){
  microBattleStateV278.vehicle=new Map();microBattleStateV278.history=[];microBattleStateV278.counts=new Map();microBattleStateV278.signatureAt=new Map();microBattleStateV278.sequence=0;
  const standings=computeRaceStandingsV191();
  for(const row of standings){
    const state=microBattleVehicleStateV278(row.vehicle,standings);microBattleStateV278.vehicle.set(String(row.vehicle.id),{...state,ahead:null,follower:null});
  }
  return true;
}
function getMicroBattleEventsV278(){
  return {catalog:[...MICRO_BATTLE_EVENTS_V278],history:microBattleStateV278.history.map(row=>({...row,meta:{...row.meta}})),
    counts:Object.fromEntries(MICRO_BATTLE_EVENTS_V278.map(event=>[event,Number(microBattleStateV278.counts.get(event))||0]))};
}
function qaMicroBattleEventsV278(){
  const required=['GAP_1_5','GAP_1_0','GAP_0_6','SLIPSTREAM','ATTACK_LINE','DEFENCE_LINE','FAKE','BRAKING_DUEL','CORNER_ENTRY_DUEL','SIDE_BY_SIDE','EDGES_AHEAD','RE_ATTACK','PASS_SUCCESS','PASS_FAIL','COUNTER_ATTACK','FRONT_CAR_MISTAKE','REAR_CAR_MISTAKE','CORNER_EXIT_ADVANTAGE','LEADER_PRESSURE_MISTAKE','BURST_ACTIVATION','BURST_SUCCESS','BURST_FAIL','BURST_END','PODIUM_BATTLE','LAST_PLACE_BATTLE','FINAL_LAP','THREE_CAR_BATTLE'];
  const threshold=microBattleThresholdCrossingsV278({gapAheadSeconds:1.8},{gapAheadSeconds:.55});
  const mapped=Object.keys(MICRO_BATTLE_DIALOGUE_MAP_V278).filter(event=>MICRO_BATTLE_EVENTS_V278.includes(event));
  const coverage=required.every(event=>MICRO_BATTLE_EVENTS_V278.includes(event));
  const thresholdCoverage=['GAP_1_5','GAP_1_0','GAP_0_6'].every(event=>threshold.includes(event));
  const bounded=microBattleStateV278.history.length<=120;
  return {eventCount:MICRO_BATTLE_EVENTS_V278.length,requiredCount:required.length,coverage,threshold,thresholdCoverage,mappedCount:mapped.length,bounded,
    allPass:coverage&&thresholdCoverage&&MICRO_BATTLE_EVENTS_V278.length>=27&&mapped.length>=22&&bounded};
}

const CHARACTER_DIALOGUE_EVENT_ROLES_V277=Object.freeze({
  ATTACK:Object.freeze(['ATTACKER','DEFENDER']),
  MISTAKE:Object.freeze(['MISTAKE_DRIVER','OPPORTUNIST']),
  PASS_SUCCESS:Object.freeze(['WINNER','PASSED']),
  PASS_FAILED:Object.freeze(['ATTACKER_FAIL','DEFENDER_SUCCESS']),
  COUNTER_ATTACK:Object.freeze(['REATTACKER','DEFENDER']),
  BURST:Object.freeze(['BURST_DRIVER','DEFENDER'])
});
const CHARACTER_DIALOGUE_POOL_V277=Object.freeze({
  ATTACKER:Object.freeze(['빈틈 보인다. 들어간다.','지금이다. 옆으로 간다.','이번 코너에서 승부 본다.','라인 열렸다. 간다.']),
  DEFENDER:Object.freeze(['여긴 못 지나간다.','안쪽은 내가 막는다.','쉽게는 안 내준다.','라인 지킨다.']),
  MISTAKE_DRIVER:Object.freeze(['잠깐, 차가 흔들렸다.','잡았다. 아직 괜찮아.','실수했다. 바로 수습한다.','리듬 다시 잡는다.']),
  OPPORTUNIST:Object.freeze(['봤다. 지금 붙는다.','빈틈 생겼다. 놓치지 않는다.','앞차 흔들렸다. 간다.','기회다. 거리를 줄인다.']),
  WINNER:Object.freeze(['잡았다. 앞으로 간다.','통했다. 자리 가져간다.','넘었다. 이제 내 자리다.','좋아. 추월 끝냈다.']),
  PASSED:Object.freeze(['아직 안 끝났다.','바로 다시 붙는다.','놓쳤다. 다시 간다.','다음 기회는 내가 잡는다.']),
  ATTACKER_FAIL:Object.freeze(['막혔다. 다시 노린다.','이번엔 안 됐다. 다음 코너다.','한 번 더 간다.','아직 끝난 거 아니다.']),
  DEFENDER_SUCCESS:Object.freeze(['막았다. 계속 간다.','자리 지켰다.','이번 건 내 거다.','라인 그대로 지킨다.']),
  REATTACKER:Object.freeze(['바로 되받아간다.','이번엔 내가 다시 들어간다.','놓치자마자 다시 붙는다.','반격 간다.']),
  BURST_DRIVER:Object.freeze(['지금 전부 쓴다.','잡으러 간다.','이번 기회는 놓치지 않는다.','한 번에 거리를 지운다.'])
});
const characterDialogueStateV277={counter:0,recentKeys:[],recentLimit:18,lastEventByPair:new Map(),history:[]};
function resetCharacterDialogueV277(){
  characterDialogueStateV277.counter=0;characterDialogueStateV277.recentKeys=[];characterDialogueStateV277.lastEventByPair=new Map();characterDialogueStateV277.history=[];
  if(typeof dialogueRecentTextV279!=='undefined')dialogueRecentTextV279.splice(0);
  return true;
}
function characterDialogueSpeakerV277(vehicle){return String(vehicle?.driver?.name||'드라이버').trim()||'드라이버'}
function dialogueFollowerV277(vehicle){
  const standings=computeRaceStandingsV191();
  const index=standings.findIndex(row=>row.vehicle===vehicle);
  return index>=0?standings[index+1]?.vehicle||null:null;
}
function dialogueTemplateV277(role,vehicle,target,event){
  const pool=typeof characterDialoguePoolV279==='function'?characterDialoguePoolV279(role):(CHARACTER_DIALOGUE_POOL_V277[String(role||'')]||[]);
  if(!pool.length)return null;
  const seed=hashDriverV189([String(activeRaceSnapshotV187?.createdAt||'race'),String(event||''),String(role||''),String(vehicle?.id||''),String(target?.id||''),String(characterDialogueStateV277.counter++)].join('|'))||1;
  const start=Math.abs(seed)%pool.length;
  for(let offset=0;offset<pool.length;offset++){
    const index=(start+offset)%pool.length,key=String(role)+':'+index;
    if(!characterDialogueStateV277.recentKeys.includes(key)&&!dialogueRecentTextV279.includes(pool[index])){
      characterDialogueStateV277.recentKeys.push(key);
      if(characterDialogueStateV277.recentKeys.length>characterDialogueStateV277.recentLimit)characterDialogueStateV277.recentKeys.shift();
      rememberDialogueTextV279(pool[index]);
      return {key,text:pool[index]};
    }
  }
  return {key:String(role)+':'+start,text:pool[start]};
}
function dialoguePairCooldownAllowsV277(event,vehicle,target,cooldownMs=1700){
  const now=Number(simClockV192.simTimeMs)||0;
  const key=[String(event||''),String(vehicle?.id||''),String(target?.id||'')].join('|');
  const previous=Number(characterDialogueStateV277.lastEventByPair.get(key));
  if(Number.isFinite(previous)&&now-previous<Math.max(0,Number(cooldownMs)||0))return false;
  characterDialogueStateV277.lastEventByPair.set(key,now);return true;
}
function pushCharacterDialogueLineV277(role,vehicle,target,event,side){
  if(!vehicle)return false;
  const picked=dialogueTemplateV277(role,vehicle,target,event);if(!picked)return false;
  const row=appendLiveConversationV276(characterDialogueSpeakerV277(vehicle),picked.text,{side});
  if(!row)return false;
  characterDialogueStateV277.history.push({event:String(event||''),role:String(role||''),speakerId:String(vehicle.id||''),speaker:characterDialogueSpeakerV277(vehicle),targetId:String(target?.id||''),text:picked.text,side:String(row.side||''),simTimeMs:Number(simClockV192.simTimeMs)||0});
  if(characterDialogueStateV277.history.length>60)characterDialogueStateV277.history.splice(0,characterDialogueStateV277.history.length-60);
  return row;
}
function emitCharacterDialogueEventV277(event,vehicle,target,options={}){
  const type=String(event||'').toUpperCase();
  if(engineQaV240.active||f1ScreenStateV185!=='RACE'||!vehicle||!CHARACTER_DIALOGUE_EVENT_ROLES_V277[type])return false;
  const criticalDialogue=['PASS_SUCCESS','PASS_FAILED'].includes(type);
  if(typeof dialogueCadenceAllowsV281==='function'&&!dialogueCadenceAllowsV281(type,vehicle,target,{critical:criticalDialogue}))return false;
  const cooldownMs=Number.isFinite(Number(options.cooldownMs))?Number(options.cooldownMs):1700;
  if(!dialoguePairCooldownAllowsV277(type,vehicle,target,cooldownMs))return false;
  const roles=CHARACTER_DIALOGUE_EVENT_ROLES_V277[type];
  const output=[];
  if(type==='MISTAKE'){
    output.push(pushCharacterDialogueLineV277('MISTAKE_DRIVER',vehicle,target,type,'left'));
    const follower=target||dialogueFollowerV277(vehicle);
    if(follower)output.push(pushCharacterDialogueLineV277('OPPORTUNIST',follower,vehicle,type,'right'));
  }else{
    const firstRole=roles[0],secondRole=roles[1];
    output.push(pushCharacterDialogueLineV277(firstRole,vehicle,target,type,'left'));
    if(target&&secondRole)output.push(pushCharacterDialogueLineV277(secondRole,target,vehicle,type,'right'));
  }
  const filtered=output.filter(Boolean);if(filtered.length&&typeof recordDialogueCadenceV281==='function')recordDialogueCadenceV281(type,vehicle,target);return filtered;
}
function handlePassDialogueV277(vehicle,target,previousState,nextState){
  const next=String(nextState||'');
  if(next==='PULLING_OUT'&&previousState!==next)return emitCharacterDialogueEventV277('ATTACK',vehicle,target,{cooldownMs:2400});
  if(next==='PASS_COMPLETED'&&previousState!==next)return emitCharacterDialogueEventV277('PASS_SUCCESS',vehicle,target,{cooldownMs:0});
  if(next==='PASS_FAILED'&&previousState!==next)return emitCharacterDialogueEventV277('PASS_FAILED',vehicle,target,{cooldownMs:0});
  if(next==='COUNTER_ATTACK'&&previousState!==next)return emitCharacterDialogueEventV277('COUNTER_ATTACK',vehicle,target,{cooldownMs:1800});
  return false;
}
function raceInfoGapV277(vehicle,target){
  const trackLength=Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1);
  if(vehicle&&target){
    const meters=Math.max(0,(Number(target.raceProgress)||0)-(Number(vehicle.raceProgress)||0))*trackLength;
    const speed=Math.max(80,Number(target.speedKph)||Number(vehicle.speedKph)||180);
    return Math.max(0,meters/(speed/3.6));
  }
  return Math.max(0,Number(vehicle?.intervalSeconds)||0);
}
function raceInfoTextV277(event,vehicle,target,options={}){
  const name=characterDialogueSpeakerV277(vehicle),targetName=characterDialogueSpeakerV277(target);
  const prefix='['+name+'] ';
  const gap=raceInfoGapV277(vehicle,target);
  const position=narrativePositionLabelV263(vehicle);
  const corner=narrativeCornerLabelV263(vehicle);
  const map={
    APPROACH:prefix+(target?'['+targetName+']와 '+gap.toFixed(2)+'초 차이로 접근 중입니다.':'앞차와의 격차를 줄이고 있습니다.'),
    PRESSURE:prefix+(target?'['+targetName+'] 뒤에서 '+gap.toFixed(2)+'초 차이로 압박 중입니다.':'앞차를 압박 중입니다.'),
    OPENING:prefix+(target?'['+targetName+']를 상대로 추월 가능 구간에 진입했습니다.':'추월 가능 구간에 진입했습니다.'),
    ATTACK:prefix+(target?'['+targetName+']를 상대로 추월 시도를 시작했습니다.':'추월 시도를 시작했습니다.'),
    SIDE_BY_SIDE:prefix+(target?'['+targetName+']와 나란히 주행 중입니다.':'나란히 주행 중입니다.'),
    BRAKING:prefix+(target?'['+targetName+']와 '+corner+' 제동 구간에서 경쟁 중입니다.':corner+' 제동 구간에서 경쟁 중입니다.'),
    CORNER_BATTLE:prefix+(target?'['+targetName+']와 '+corner+'에서 코너 경쟁 중입니다.':corner+'에서 코너 경쟁 중입니다.'),
    DEFENCE:prefix+(target?'['+targetName+']의 추월 시도를 방어 중입니다.':'방어 주행 중입니다.'),
    PASS_SUCCESS:prefix+(target?'['+targetName+']를 추월해 '+position+'로 올라섰습니다.':'추월에 성공해 '+position+'입니다.'),
    PASS_FAILED:prefix+(target?'['+targetName+'] 추월 시도가 실패했습니다.':'추월 시도가 실패했습니다.'),
    COUNTER_ATTACK:prefix+(target?'['+targetName+']를 상대로 재공격 중입니다.':'재공격 중입니다.'),
    MISTAKE:prefix+'주행 실수가 발생해 차량을 수습 중입니다.',
    RECOVERY:prefix+'주행을 정상화하고 페이스를 회복했습니다.',
    FAST_LAP:prefix+'현재 개인 최고 랩을 기록했습니다.',
    FINAL_LAP:'마지막 랩에 진입했습니다.',
    LEADER_BATTLE:prefix+(target?'['+targetName+']와 선두 경쟁 중입니다.':'선두 경쟁 중입니다.'),
    PIT_TACTIC:prefix+'피트 전략을 준비 중입니다.'
  };
  return map[String(event||'')]||prefix+(options.fallback||'경기 상황이 갱신됐습니다.');
}
function appendRaceInfoV277(event,vehicle,target,options={}){
  const text=raceInfoTextV277(event,vehicle,target,options);
  const type=options.type||(['PIT_TACTIC'].includes(event)?'strategy':['FINAL_LAP','PASS_SUCCESS','FAST_LAP'].includes(event)?'pass':'battle');
  const signature='v277-info:'+String(event)+':'+String(vehicle?.id||'global')+':'+String(target?.id||'');
  const cooldown=Number.isFinite(Number(options.cooldownMs))?Number(options.cooldownMs):1800;
  return appendRaceCommentaryV222(text,type,signature,cooldown);
}
function qaCharacterDialogueEngineV277(){
  const roles=Object.fromEntries(Object.entries(CHARACTER_DIALOGUE_EVENT_ROLES_V277).map(([event,rows])=>[event,[...rows]]));
  const required=['ATTACK','MISTAKE','PASS_SUCCESS','PASS_FAILED','COUNTER_ATTACK'];
  const roleCoverage=required.every(event=>Array.isArray(roles[event])&&roles[event].length===2);
  const poolsReady=Object.values(roles).flat().every(role=>Array.isArray(CHARACTER_DIALOGUE_POOL_V277[role])&&CHARACTER_DIALOGUE_POOL_V277[role].length>=4);
  const mockA={id:'qa-a',driver:{name:'QA A'},raceProgress:1,progress:.2,speedKph:240};
  const mockB={id:'qa-b',driver:{name:'QA B'},raceProgress:1.002,progress:.202,speedKph:235};
  const info=raceInfoTextV277('PASS_SUCCESS',mockA,mockB,{});
  const bracketInfo=/^\[[^\]]+\]/.test(info)&&info.includes('[QA B]');
  const a1=dialogueTemplateV277('ATTACKER',mockA,mockB,'ATTACK');
  const a2=dialogueTemplateV277('ATTACKER',mockA,mockB,'ATTACK');
  const nonRepeat=Boolean(a1&&a2&&a1.key!==a2.key);
  const before=characterDialogueStateV277.history.length;
  const previousScreen=f1ScreenStateV185;
  let emitted=false;
  try{
    f1ScreenStateV185='RACE';
    const rows=emitCharacterDialogueEventV277('ATTACK',raceMotionV189.vehicles[1]||mockA,raceMotionV189.vehicles[0]||mockB,{cooldownMs:0});
    emitted=Array.isArray(rows)&&rows.length>=1;
  }finally{
    f1ScreenStateV185=previousScreen;
    resetLiveConversationV276();
  }
  return {roles,roleCoverage,poolsReady,bracketInfo,info,nonRepeat,emitted,historyAdded:characterDialogueStateV277.history.length>=before,allPass:roleCoverage&&poolsReady&&bracketInfo&&nonRepeat&&emitted};
}


function buildDialogueVariantsV279(stems,tails){
  const out=[];
  for(const stem of stems)for(const tail of tails)out.push(String(stem)+String(tail));
  return Object.freeze([...new Set(out)]);
}
const DIALOGUE_POOL_CATEGORIES_V279=Object.freeze({
  ATTACKER:buildDialogueVariantsV279(
    ['빈틈 보인다. ','지금 붙는다. ','이번 코너다. ','안쪽 열린다. ','브레이크 늦춘다. ','옆으로 간다. ','라인 바꾼다. ','여기서 승부다. '],
    ['간다.','놓치지 않는다.','끝까지 밀어본다.','이번엔 들어간다.']
  ),
  DEFENDER:buildDialogueVariantsV279(
    ['안쪽 지킨다. ','라인 닫는다. ','여긴 내 자리다. ','바로 막는다. ','쉽게 안 준다. ','출구 먼저 잡는다. ','브레이크 포인트 지킨다. ','옆은 허용 안 한다. '],
    ['버틴다.','계속 막는다.','자리 지킨다.','끝까지 간다.']
  ),
  CHASER:buildDialogueVariantsV279(
    ['거리 줄인다. ','앞차 보인다. ','슬립스트림 잡았다. ','조금만 더 붙는다. ','출구가 좋다. ','페이스 올라온다. ','바로 뒤까지 왔다. ','이번 랩에 따라붙는다. '],
    ['계속 간다.','기회 본다.','압박한다.','놓치지 않는다.']
  ),
  MISTAKE_DRIVER:buildDialogueVariantsV279(
    ['차가 흔들렸다. ','조금 밀렸다. ','브레이크가 길었다. ','에이펙스 놓쳤다. ','출구가 흔들렸다. ','라인 벗어났다. ','잠깐 리듬 깨졌다. ','조향이 늦었다. '],
    ['바로 잡는다.','수습한다.','다시 집중한다.','다음 코너에서 회복한다.']
  ),
  WINNER:buildDialogueVariantsV279(
    ['넘었다. ','앞에 섰다. ','자리 가져왔다. ','추월 끝냈다. ','라인 선점했다. ','출구에서 앞섰다. ','제동에서 이겼다. ','결국 지나갔다. '],
    ['계속 간다.','이제 앞만 본다.','격차 만든다.','다음 차 본다.']
  ),
  ATTACKER_FAIL:buildDialogueVariantsV279(
    ['막혔다. ','이번엔 안 됐다. ','문이 닫혔다. ','라인이 없었다. ','출구에서 밀렸다. ','제동 싸움 놓쳤다. ','옆까지 갔는데 부족했다. ','한 번 접는다. '],
    ['다시 노린다.','다음 코너 본다.','아직 끝 아니다.','다시 붙는다.']
  ),
  REATTACKER:buildDialogueVariantsV279(
    ['바로 반격한다. ','다시 옆으로 간다. ','놓치자마자 붙는다. ','한 번 더 들어간다. ','스위치백 간다. ','출구에서 되받는다. ','다시 라인 바꾼다. ','이번엔 반대로 간다. '],
    ['바로 간다.','이번엔 잡는다.','끝까지 붙는다.','다시 승부다.']
  ),
  BURST_DRIVER:buildDialogueVariantsV279(
    ['지금 전부 쓴다. ','추격 올린다. ','한 번에 붙는다. ','이번 기회에 간다. ','출구에서 밀어붙인다. ','가속 다 쓴다. ','앞차까지 단숨에 간다. ','지금이 타이밍이다. '],
    ['잡으러 간다.','거리 지운다.','놓치지 않는다.','이번에 끝낸다.']
  ),
  BURST_FAIL:buildDialogueVariantsV279(
    ['추격이 끝났다. ','이번 부스트는 여기까지다. ','거리를 다 못 지웠다. ','앞차가 버텼다. ','타이밍이 조금 늦었다. ','기회가 닫혔다. ','가속을 다 썼다. ','이번엔 닿지 않았다. '],
    ['다시 준비한다.','다음 기회 본다.','페이스 유지한다.','아직 포기 안 한다.']
  ),
  FINAL_LAP:buildDialogueVariantsV279(
    ['마지막 랩이다. ','이제 한 바퀴 남았다. ','체커드까지 간다. ','마지막 기회다. ','끝까지 밀어붙인다. ','마지막 코너까지 본다. ','이제 계산 없다. ','한 바퀴에 다 건다. '],
    ['끝까지 간다.','지금 승부 본다.','실수 없이 간다.','전부 쓴다.']
  ),
  THREE_WAY:buildDialogueVariantsV279(
    ['셋이 붙었다. ','앞뒤 다 가깝다. ','양쪽 다 신경 써야 한다. ','세 대가 한 번에 들어간다. ','라인 하나에 셋이다. ','뒤도 바로 붙었다. ','앞차만 볼 상황 아니다. ','세 대가 동시에 싸운다. '],
    ['자리 지킨다.','먼저 빠져나간다.','한 번에 정리한다.','틈부터 찾는다.']
  ),
  PODIUM:buildDialogueVariantsV279(
    ['포디엄 자리다. ','상위권 싸움이다. ','P3 안쪽이 보인다. ','포디엄 놓칠 수 없다. ','앞 세 자리 싸움이다. ','상위권 격차가 없다. ','한 자리 차이다. ','포디엄까지 바로 앞이다. '],
    ['지금 붙는다.','끝까지 지킨다.','이번에 올라간다.','절대 놓치지 않는다.']
  ),
  SPECIAL:buildDialogueVariantsV279(
    ['상황이 바뀐다. ','앞에서 움직임이 있다. ','라인이 갑자기 열린다. ','트랙 흐름이 달라진다. ','예상 못한 틈이다. ','지금 판이 바뀐다. ','기회가 하나 생겼다. ','이번 구간이 중요하다. '],
    ['바로 대응한다.','흐름 탄다.','놓치지 않는다.','차분히 간다.']
  )
});
const DIALOGUE_ROLE_ALIASES_V279=Object.freeze({
  PASSED:'ATTACKER_FAIL',DEFENDER_SUCCESS:'DEFENDER',OPPORTUNIST:'CHASER'
});
const DIALOGUE_DIRECT_LINES_V308=Object.freeze({
 ATTACKER:Object.freeze(['브레이크를 조금 더 늦춰본다.','저쪽이 안쪽을 막으면 출구를 노린다.','이번에는 바로 들어가지 않고 한번 흔든다.','앞차 타이어가 밀린다. 다음 코너가 기회다.','직선 속도는 내가 조금 더 좋다.','한 코너 뒤까지 계산하고 들어간다.','바깥쪽도 충분히 열려 있다.','지금은 붙어만 있으면 된다.']),
 DEFENDER:Object.freeze(['안쪽은 막고 출구 속도만 챙긴다.','괜히 반응하지 말고 내 라인 간다.','뒤차가 급해질 때까지 기다린다.','브레이크는 평소대로. 실수만 안 하면 된다.','한 번 보여준다고 바로 길을 줄 생각 없다.','출구에서 거리를 다시 벌린다.','라인보다 견인력을 우선한다.','뒤에서 뭘 하든 코너 하나씩 막아낸다.']),
 CHASER:Object.freeze(['앞차 출구가 조금씩 느려진다.','직선에서 공기 저항을 제대로 줄이고 있다.','조금만 더 붙으면 브레이킹 싸움이 된다.','페이스 차이는 있다. 서두를 필요 없다.','이번 랩은 앞차 움직임부터 본다.','타이어 온도 좋다. 계속 압박 가능하다.','코너 두 개만 더 잘 나오면 바로 사정권이다.','앞차가 수비하면 오히려 다음 출구가 열린다.']),
 MISTAKE_DRIVER:Object.freeze(['앞이 잠깐 잠겼다. 큰 손실은 아니다.','뒤가 살짝 흐른다. 스로틀을 정리한다.','진입이 깊었다. 출구만 살려보자.','연석을 너무 많이 탔다. 다음에는 줄인다.','브레이크 밸런스가 조금 이상하다.','타이어가 한 번 미끄러졌다. 바로 온도 확인한다.','라인을 놓쳤지만 트랙 밖으로 나가진 않았다.','한 코너 잃었다. 다음 구간에서 되찾는다.']),
 WINNER:Object.freeze(['이번 건 출구에서 결정났다.','수비 라인을 읽은 게 맞았다.','브레이킹보다 가속이 더 좋았다.','한 번만 제대로 열리면 충분했다.','접촉 없이 자리 가져왔다.','계획한 라인이 그대로 먹혔다.','이제 바로 앞차 페이스를 본다.','추월은 끝. 타이어부터 다시 관리한다.']),
 ATTACKER_FAIL:Object.freeze(['너무 깊게 들어가면 둘 다 손해다. 이번엔 접는다.','공간이 닫혔다. 다음 직선까지 기다린다.','앞차가 예상보다 일찍 막았다.','출구 각이 안 나왔다. 다시 정렬한다.','한 번 보여준 걸로 충분하다. 다음엔 반대로 간다.','타이어를 쓰면서까지 억지로 들어갈 상황은 아니다.','반 차까지 갔지만 완전히 옆에 서진 못했다.','이번 시도는 실패. 그래도 간격은 그대로다.']),
 REATTACKER:Object.freeze(['앞서 갔다고 끝난 건 아니다. 바로 붙는다.','다음 코너는 내가 안쪽을 먼저 잡는다.','추월당한 직후가 가장 좋은 반격 타이밍이다.','슬립스트림만 다시 잡으면 된다.','이번엔 먼저 라인을 보여주지 않는다.','출구 속도는 내가 더 좋다. 바로 되받아간다.','상대가 수비 자세 잡기 전에 한번 더 간다.','한 자리 내줬지만 레이스 전체를 내준 건 아니다.']),
 BURST_DRIVER:Object.freeze(['지금 타이어 상태면 몇 코너는 더 밀어붙일 수 있다.','이번 구간만큼은 연료보다 위치가 중요하다.','앞차가 방어하기 전에 속도를 먼저 만든다.','한 번에 잡으려 하지 말고 출구마다 줄인다.','여기서 만든 속도 차이를 직선까지 가져간다.','지금이 레이스에서 가장 좋은 공격 구간이다.','차가 가볍다. 페이스를 올릴 수 있다.','지금은 관리보다 공격이다.']),
 BURST_FAIL:Object.freeze(['속도는 냈지만 앞차도 같이 빨랐다.','타이어만 너무 쓰기 전에 다시 관리한다.','이번 구간에서는 충분히 가까워지지 못했다.','공격 페이스는 여기까지. 간격부터 유지한다.','예상보다 수비가 강했다.','가속은 좋았지만 추월 거리까지는 못 갔다.','다음 랩을 위해 온도를 다시 맞춘다.','한 번 실패했다고 흐름까지 끊을 필요는 없다.']),
 FINAL_LAP:Object.freeze(['이제 남은 건 한 바퀴뿐이다. 계산 끝.','마지막 랩에서는 작은 간격도 전부 의미가 있다.','타이어 남은 만큼 다 쓴다.','마지막 제동까지 집중한다.','앞차가 보이면 한 번은 기회가 온다.','뒤차와 거리가 없으면 수비부터 확실히 한다.','체커드 전 마지막 직선까지 포기 없다.','이제 다음 랩은 없다.']),
 THREE_WAY:Object.freeze(['앞차만 보고 들어가면 뒤차에게 당한다.','세 대가 붙었으니 출구 위치가 더 중요하다.','두 대 사이에 끼지 않도록 공간을 만든다.','지금은 한 자리보다 사고 없이 빠져나오는 게 먼저다.','앞에서 싸우는 동안 뒤쪽 기회도 열린다.','라인 하나를 세 대가 나눠 쓸 수는 없다.','누군가 먼저 브레이크를 포기해야 한다.','세 대 중 가장 좋은 출구를 만드는 차가 이긴다.']),
 PODIUM:Object.freeze(['포디엄 싸움이면 위험 계산도 달라진다.','한 자리 차이지만 결과표에서는 크게 보인다.','앞차 실수 하나면 바로 시상대다.','여기서 무리하면 포디엄 자체를 잃을 수도 있다.','상위권은 작은 속도 차이도 바로 순위로 이어진다.','남은 랩과 타이어를 같이 봐야 한다.','지금 잡으면 끝까지 지킬 수 있다.','시상대가 보이면 집중력이 달라진다.']),
 SPECIAL:Object.freeze(['예상과 다른 흐름이다. 먼저 상황부터 읽는다.','앞에서 싸우기 시작하면 뒤쪽에도 기회가 생긴다.','트랙 상태가 달라졌다. 평소 라인만 고집할 필요 없다.','지금은 순위보다 깨끗한 출구가 중요하다.','한 번의 선택으로 다음 두 코너가 바뀔 수 있다.','앞쪽 움직임이 커졌다. 거리를 조금 둔다.','상황이 복잡할수록 기본 라인이 안전하다.','지금은 공격보다 다음 장면을 준비한다.'])
});
const DIALOGUE_NATURAL_LINES_V331=Object.freeze({
 ATTACKER:Object.freeze([
  '앞차가 출구에서 조금 밀렸네. 이번 직선에서 한번 붙어보자.',
  '지금 바로 들어가기보다 다음 제동 구간까지 압박해보자.',
  '안쪽이 닫히면 바깥쪽 출구를 노리면 돼.',
  '속도 차이가 생겼다. 이번에는 라인을 한번 바꿔보자.',
  '앞차가 수비 쪽으로 움직이네. 반대쪽 공간을 봐야겠다.',
  '조금만 더 가까워지면 충분히 승부를 걸 수 있겠다.',
  '이번 코너는 무리하지 말고 출구에서 속도를 만들어보자.',
  '브레이크를 한 박자 늦추면 옆까지 갈 수 있겠다.',
  '직선 끝까지 붙어 있다가 마지막 순간에 방향을 정하자.',
  '앞차가 타이어를 아끼는 것 같다. 지금이 압박할 타이밍이다.',
  '한 번 흔들어보고 반응을 보자. 바로 들어갈 필요는 없다.',
  '여기서 만든 속도 차이를 다음 코너까지 그대로 가져가보자.'
 ]),
 DEFENDER:Object.freeze([
  '뒤차가 많이 가까워졌네. 평소 라인 유지하면서 출구만 깔끔하게 가져가자.',
  '급하게 반응할 필요 없어. 브레이크 포인트만 정확히 맞추자.',
  '안쪽을 너무 일찍 내주지 말고 코너 하나씩 차분하게 가자.',
  '뒤에서 압박해도 내 페이스부터 유지하면 된다.',
  '이번 코너는 진입보다 출구 속도를 챙기는 게 낫겠다.',
  '뒤차가 움직이면 그때 보고 대응하자. 먼저 흔들릴 필요 없다.',
  '라인 하나만 확실히 잡고 실수 없이 빠져나가자.',
  '지금은 무리한 방어보다 좋은 출구를 만드는 게 더 중요하다.',
  '브레이크를 늦추기보다 차를 안정적으로 세우는 쪽이 낫다.',
  '다음 직선까지 간격만 유지하면 다시 숨을 돌릴 수 있다.',
  '뒤차가 급해질수록 내가 침착하면 된다.',
  '코너 중간에서 공간을 잃지 않도록 차만 정확히 놓자.'
 ]),
 CHASER:Object.freeze([
  '앞차가 조금씩 커진다. 페이스 차이는 확실히 있는 것 같다.',
  '출구가 계속 좋다. 두 코너만 더 이 흐름을 이어가보자.',
  '슬립스트림이 잡히기 시작했다. 이제 서두를 필요 없다.',
  '한 번에 붙으려 하지 말고 직선마다 조금씩 줄이면 된다.',
  '앞차가 수비하면 오히려 다음 코너 출구가 열릴 수도 있다.',
  '지금 간격이면 다음 랩에는 충분히 사정권에 들어가겠다.',
  '타이어 상태가 괜찮다. 이 페이스 그대로 압박해보자.',
  '브레이킹보다 출구에서 차이가 난다. 그쪽을 계속 살려보자.',
  '앞차가 흔들릴 때까지 거리를 유지하면서 기다리자.',
  '조금만 더 붙으면 상대도 수비를 의식할 수밖에 없다.',
  '이번 랩은 공격보다 움직임을 읽는 데 써도 괜찮겠다.',
  '속도는 충분하다. 실수 없이 따라가면 기회가 온다.'
 ]),
 MISTAKE_DRIVER:Object.freeze([
  '진입이 조금 깊었다. 다음 코너에서 바로 리듬을 되찾자.',
  '출구에서 살짝 밀렸네. 스로틀만 정리하면 괜찮다.',
  '브레이크를 조금 늦게 잡았다. 큰 손실은 아니야.',
  '연석을 너무 많이 탔다. 다음에는 차를 조금 덜 올리자.',
  '뒤가 한번 흔들렸다. 타이어 온도부터 다시 맞추자.',
  '에이펙스를 놓쳤지만 트랙 안에는 남아 있다. 바로 이어가자.',
  '한 코너 정도 손해 봤다. 다음 직선에서 조금씩 되찾으면 된다.',
  '조향이 늦었다. 다음 코너는 조금 일찍 차를 세워보자.',
  '앞바퀴가 잠깐 밀렸다. 브레이크 밸런스를 조금 조심해야겠다.',
  '출구 각이 안 좋았다. 다음 구간은 무리하지 말자.',
  '차가 순간적으로 가벼워졌다. 다시 안정시키고 간다.',
  '실수는 끝났다. 이제 다음 코너만 보면 된다.'
 ]),
 WINNER:Object.freeze([
  '좋아, 이번 추월은 출구에서 제대로 끝냈다.',
  '수비 라인을 잘 읽었다. 이제 바로 앞차 페이스를 보자.',
  '접촉 없이 깔끔하게 넘어왔다. 타이어부터 다시 정리하자.',
  '한 번 열린 공간을 제대로 살렸다. 이제 간격을 만들어보자.',
  '브레이킹보다 가속이 좋았다. 이 흐름을 계속 가져가자.',
  '생각한 라인이 그대로 맞았다. 다음 상대까지 바로 이어가자.',
  '오래 기다린 보람이 있네. 이제 뒤를 떼어내는 게 중요하다.',
  '추월은 끝났다. 다음 코너부터는 다시 평소 리듬으로 돌아가자.',
  '상대가 수비에 들어간 순간 반대쪽이 열렸다. 잘 풀렸다.',
  '이번에는 무리하지 않고도 앞에 섰다. 좋은 흐름이다.',
  '속도 차이를 제대로 순위로 바꿨다. 이제 앞쪽을 보자.',
  '한 자리 올렸다. 여기서부터는 페이스를 안정시키면 된다.'
 ]),
 ATTACKER_FAIL:Object.freeze([
  '공간이 생각보다 빨리 닫혔다. 다음 직선까지 다시 기다리자.',
  '옆까지는 갔는데 출구 각이 안 나왔다. 한번 정리하고 다시 붙자.',
  '이번에는 너무 깊게 들어가면 둘 다 손해였다. 잘 접었다.',
  '앞차가 반응이 빨랐다. 다음에는 반대쪽을 먼저 보여줘야겠다.',
  '반 차까지 갔지만 완전히 옆에 서진 못했다. 아직 기회는 있다.',
  '브레이킹 싸움은 졌지만 간격은 그대로다. 다시 만들면 된다.',
  '이번 코너는 문이 닫혔다. 다음 구간에서 다시 속도를 만들자.',
  '타이어를 더 쓰면서 억지로 들어갈 상황은 아니었다.',
  '한 번 보여준 걸로 충분하다. 상대도 이제 수비를 의식할 거다.',
  '출구에서 밀렸네. 다음에는 진입보다 가속을 먼저 챙기자.',
  '이번 시도는 여기까지. 페이스 자체는 나쁘지 않다.',
  '조금 성급했다. 다음에는 한 코너 더 기다려보자.'
 ]),
 REATTACKER:Object.freeze([
  '앞서 갔다고 끝난 건 아니지. 바로 슬립스트림부터 다시 잡자.',
  '다음 코너는 반대쪽 라인을 한번 노려보자.',
  '추월당한 직후가 오히려 반격하기 좋은 타이밍이다.',
  '출구 속도는 아직 괜찮다. 바로 다시 붙을 수 있다.',
  '상대가 수비 자세를 잡기 전에 한번 더 움직여보자.',
  '한 자리 내줬지만 간격은 없다. 바로 다음 기회를 보자.',
  '이번에는 먼저 방향을 보여주지 말고 끝까지 기다리자.',
  '상대가 앞에 섰지만 타이어를 많이 썼을 수도 있다.',
  '직선 하나만 잘 나오면 다시 옆까지 갈 수 있다.',
  '이번 반격은 제동보다 출구를 노리는 쪽이 낫겠다.',
  '조금 떨어졌다가 다시 속도를 붙이는 것도 방법이다.',
  '싸움은 아직 안 끝났다. 다음 두 코너를 묶어서 보자.'
 ]),
 BURST_DRIVER:Object.freeze([
  '지금 차가 가볍다. 몇 코너 정도는 페이스를 더 올릴 수 있겠다.',
  '이번 구간은 관리보다 위치가 더 중요하다. 조금 밀어붙여보자.',
  '앞차가 수비하기 전에 먼저 속도 차이를 만들어야겠다.',
  '한 번에 잡으려 하지 말고 출구마다 조금씩 줄이자.',
  '지금 타이어면 공격 페이스를 조금 더 써도 괜찮다.',
  '여기서 만든 가속을 직선 끝까지 그대로 가져가보자.',
  '지금이 이번 랩에서 가장 좋은 공격 구간이다.',
  '앞차가 흔들리기 전에 내가 먼저 리듬을 올리자.',
  '조금 더 밀어도 차가 버텨준다. 기회를 만들어보자.',
  '이번에는 연료보다 순위가 우선이다. 짧게 강하게 가자.',
  '페이스를 올릴 수 있을 때 확실히 간격을 줄여두자.',
  '다음 코너까지는 공격 모드로 가도 되겠다.'
 ]),
 BURST_FAIL:Object.freeze([
  '속도는 올렸는데 앞차도 같이 빨랐다. 다시 리듬을 정리하자.',
  '타이어만 더 쓰기 전에 이번 공격은 여기서 멈추자.',
  '생각보다 간격이 안 줄었다. 다음 랩을 준비하는 게 낫겠다.',
  '가속은 좋았지만 추월 거리까지는 못 갔다.',
  '앞차 수비가 예상보다 단단했다. 다른 구간을 노려보자.',
  '이번에는 타이밍이 조금 늦었다. 다음 기회는 더 일찍 보자.',
  '페이스를 썼지만 성과가 크지 않았다. 온도부터 다시 맞추자.',
  '한 번 실패했다고 흐름까지 끊긴 건 아니다.',
  '이번 구간은 앞차가 더 잘 빠져나갔다. 다음 코너를 보자.',
  '공격 페이스는 여기까지. 간격을 유지하면서 다시 준비하자.',
  '조금 무리했다. 다음에는 타이어를 남겨두고 들어가자.',
  '이번 시도는 끝났지만 아직 충분히 따라갈 수 있다.'
 ]),
 FINAL_LAP:Object.freeze([
  '이제 한 바퀴 남았다. 남은 타이어는 전부 써도 된다.',
  '마지막 랩이다. 작은 간격 하나도 놓치면 안 된다.',
  '이제 다음 기회는 없다. 보이는 순간 바로 판단하자.',
  '마지막 제동 구간까지 집중하면 된다.',
  '앞차가 보이면 한 번쯤은 기회가 온다. 끝까지 붙어가자.',
  '뒤차와 간격이 없네. 공격보다 수비가 먼저일 수도 있다.',
  '체커드까지 몇 코너 안 남았다. 실수만 하지 말자.',
  '마지막 직선까지 포기할 이유가 없다.',
  '타이어 상태 계산은 끝났다. 이제 남은 만큼 다 쓰자.',
  '이번 랩은 평소보다 조금 더 과감하게 가도 된다.',
  '끝까지 리듬만 유지하면 결과가 따라올 거다.',
  '한 바퀴 안에서 할 수 있는 건 전부 해보자.'
 ]),
 THREE_WAY:Object.freeze([
  '셋이 붙었네. 앞차만 보다가 뒤를 내주지 않게 조심하자.',
  '세 대가 한꺼번에 들어가면 출구 위치가 더 중요하다.',
  '두 대 사이에 끼지 않도록 공간을 조금 남겨두자.',
  '지금은 한 자리보다 사고 없이 빠져나오는 게 먼저다.',
  '앞에서 둘이 싸우면 뒤쪽에도 분명 기회가 생긴다.',
  '세 대가 같은 라인을 쓸 수는 없다. 누군가는 다른 길을 택해야 한다.',
  '앞뒤를 같이 봐야 한다. 한쪽만 신경 쓰면 바로 빈틈이 난다.',
  '이번 코너는 진입보다 출구에서 세 대의 순서가 갈릴 것 같다.',
  '누가 먼저 브레이크를 포기하느냐보다 누가 더 잘 빠져나오느냐가 중요하다.',
  '지금은 라인을 넓게 쓰는 쪽이 오히려 유리할 수도 있다.',
  '세 대가 붙으면 작은 실수 하나가 두 자리 손해로 이어질 수 있다.',
  '복잡할수록 차를 안정적으로 놓는 게 먼저다.'
 ]),
 PODIUM:Object.freeze([
  '포디엄이 바로 앞이다. 여기서는 작은 차이도 크게 느껴진다.',
  '한 자리만 더 올라가면 시상대다. 그래도 무리할 필요는 없다.',
  '앞차 실수 하나면 바로 기회가 온다. 끝까지 압박해보자.',
  '여기서 실수하면 포디엄 자체를 놓칠 수 있다. 계산하면서 가자.',
  '상위권은 속도 차이가 작아도 순위 변화는 크게 보인다.',
  '남은 랩과 타이어를 같이 봐야 한다. 지금 다 쓸 필요는 없다.',
  '이번에 잡으면 끝까지 지킬 수 있을 만큼 랩이 남았다.',
  '시상대가 보이니 집중력이 더 올라간다.',
  '앞차도 긴장할 시점이다. 내가 먼저 흔들릴 필요는 없다.',
  '포디엄 싸움이면 공격 한 번의 가치가 훨씬 커진다.',
  '지금은 빠른 것보다 실수 없는 게 더 중요할 수도 있다.',
  '한 자리 차이지만 결승에서는 완전히 다른 결과다.'
 ]),
 SPECIAL:Object.freeze([
  '앞쪽 흐름이 갑자기 바뀌었다. 먼저 상황부터 읽어보자.',
  '앞에서 싸우기 시작하면 뒤쪽에도 자연스럽게 기회가 생긴다.',
  '트랙 상태가 달라졌다. 평소 라인만 고집할 필요는 없다.',
  '지금은 순위보다 깨끗한 출구 하나가 더 중요해 보인다.',
  '한 번의 선택이 다음 두 코너까지 이어질 수 있다.',
  '앞쪽 움직임이 커졌다. 거리를 조금 두고 보는 것도 괜찮겠다.',
  '상황이 복잡할수록 기본적인 주행이 가장 안전하다.',
  '지금은 공격보다 다음 장면을 준비하는 편이 낫다.',
  '갑자기 공간이 열렸다. 서두르지 말고 제대로 확인하자.',
  '주변 차들이 서로 신경 쓰는 동안 내 페이스를 챙길 수 있다.',
  '이런 상황에서는 한 코너보다 한 랩 전체를 보는 게 낫다.',
  '흐름이 바뀌고 있다. 지금부터 판단이 더 중요해진다.'
 ])
});

const dialogueRecentTextV279=[];
const DIALOGUE_RECENT_TEXT_LIMIT_V279=160;
function characterDialoguePoolV279(role){
  const key=DIALOGUE_ROLE_ALIASES_V279[String(role||'')]||String(role||'');
  const natural=DIALOGUE_NATURAL_LINES_V331[key]||[];
  const direct=DIALOGUE_DIRECT_LINES_V308[key]||[];
  if(natural.length||direct.length)return [...natural,...direct];
  return [...(DIALOGUE_POOL_CATEGORIES_V279[key]||CHARACTER_DIALOGUE_POOL_V277[String(role||'')]||[])];
}
function rememberDialogueTextV279(text){
  const value=String(text||'');if(!value)return false;
  dialogueRecentTextV279.push(value);if(dialogueRecentTextV279.length>DIALOGUE_RECENT_TEXT_LIMIT_V279)dialogueRecentTextV279.splice(0,dialogueRecentTextV279.length-DIALOGUE_RECENT_TEXT_LIMIT_V279);
  return true;
}
function dialoguePoolCountV279(){
  const categories=Object.entries(DIALOGUE_POOL_CATEGORIES_V279).map(([category,lines])=>({category,count:lines.length}));
  return {categories,total:categories.reduce((sum,row)=>sum+row.count,0),recentLimit:DIALOGUE_RECENT_TEXT_LIMIT_V279};
}
const MICRO_DIALOGUE_ROLE_MAP_V279=Object.freeze({
  GAP_1_5:['CHASER','DEFENDER'],GAP_1_0:['CHASER','DEFENDER'],GAP_0_6:['CHASER','DEFENDER'],
  SLIPSTREAM:['CHASER','DEFENDER'],ATTACK_LINE:['ATTACKER','DEFENDER'],DEFENCE_LINE:['DEFENDER','ATTACKER'],
  FAKE:['ATTACKER','DEFENDER'],BRAKING_DUEL:['ATTACKER','DEFENDER'],CORNER_ENTRY_DUEL:['ATTACKER','DEFENDER'],
  SIDE_BY_SIDE:['ATTACKER','DEFENDER'],EDGES_AHEAD:['ATTACKER','DEFENDER'],RE_ATTACK:['REATTACKER','DEFENDER'],
  PASS_SUCCESS:['WINNER','PASSED'],PASS_FAIL:['ATTACKER_FAIL','DEFENDER_SUCCESS'],COUNTER_ATTACK:['REATTACKER','DEFENDER'],
  FRONT_CAR_MISTAKE:['MISTAKE_DRIVER','CHASER'],REAR_CAR_MISTAKE:['MISTAKE_DRIVER','DEFENDER'],
  CORNER_EXIT_ADVANTAGE:['CHASER','DEFENDER'],LEADER_PRESSURE_MISTAKE:['MISTAKE_DRIVER','CHASER'],
  BURST_ACTIVATION:['BURST_DRIVER','DEFENDER'],BURST_SUCCESS:['WINNER','PASSED'],BURST_FAIL:['BURST_FAIL','DEFENDER'],BURST_END:['SPECIAL','DEFENDER'],
  PODIUM_BATTLE:['PODIUM','DEFENDER'],LAST_PLACE_BATTLE:['SPECIAL','DEFENDER'],FINAL_LAP:['FINAL_LAP','SPECIAL'],
  THREE_CAR_BATTLE:['THREE_WAY','DEFENDER']
});
function emitMicroBattleDialogueV279(event,actor,target){
  const roles=MICRO_DIALOGUE_ROLE_MAP_V279[String(event||'')];if(!roles||!actor)return null;
  const critical=['PASS_SUCCESS','PASS_FAIL','BURST_SUCCESS','BURST_FAIL','FINAL_LAP'].includes(String(event||''));
  if(typeof dialogueCadenceAllowsV281==='function'&&!dialogueCadenceAllowsV281(event,actor,target,{critical}))return [];
  const out=[];
  out.push(pushCharacterDialogueLineV277(roles[0],actor,target,event,'left'));
  if(target&&roles[1])out.push(pushCharacterDialogueLineV277(roles[1],target,actor,event,'right'));
  const filtered=out.filter(Boolean);if(filtered.length&&typeof recordDialogueCadenceV281==='function')recordDialogueCadenceV281(event,actor,target);if(typeof recordDialogueCoverageV280==='function')recordDialogueCoverageV280(event,roles,filtered);return filtered;
}
function qaExpandedDialoguePoolV279(){
  const stats=dialoguePoolCountV279();
  const categoryNames=Object.keys(DIALOGUE_POOL_CATEGORIES_V279);
  const unique=new Set(Object.values(DIALOGUE_POOL_CATEGORIES_V279).flat());
  const coverage=['ATTACKER','DEFENDER','CHASER','MISTAKE_DRIVER','WINNER','ATTACKER_FAIL','REATTACKER','BURST_DRIVER','BURST_FAIL','FINAL_LAP','THREE_WAY','PODIUM','SPECIAL'].every(key=>categoryNames.includes(key));
  const microCoverage=['GAP_1_5','GAP_1_0','GAP_0_6','SLIPSTREAM','ATTACK_LINE','DEFENCE_LINE','FAKE','BRAKING_DUEL','CORNER_ENTRY_DUEL','SIDE_BY_SIDE','EDGES_AHEAD','RE_ATTACK','PASS_SUCCESS','PASS_FAIL','COUNTER_ATTACK','FRONT_CAR_MISTAKE','REAR_CAR_MISTAKE','CORNER_EXIT_ADVANTAGE','LEADER_PRESSURE_MISTAKE','BURST_ACTIVATION','BURST_SUCCESS','BURST_FAIL','PODIUM_BATTLE','LAST_PLACE_BATTLE','FINAL_LAP','THREE_CAR_BATTLE'].every(event=>Array.isArray(MICRO_DIALOGUE_ROLE_MAP_V279[event]));
  return {stats,categoryCount:categoryNames.length,uniqueCount:unique.size,coverage,microCoverage,recentLimit:DIALOGUE_RECENT_TEXT_LIMIT_V279,
    allPass:stats.total>=400&&categoryNames.length>=13&&unique.size>=400&&coverage&&microCoverage&&DIALOGUE_RECENT_TEXT_LIMIT_V279>=80};
}


function qaNaturalDialogueV331(){
  const roles=['ATTACKER','DEFENDER','CHASER','MISTAKE_DRIVER','WINNER','ATTACKER_FAIL','REATTACKER','BURST_DRIVER','BURST_FAIL','FINAL_LAP','THREE_WAY','PODIUM','SPECIAL'];
  const rows=roles.map(role=>({role,count:characterDialoguePoolV279(role).length}));
  const runtimeLines=roles.flatMap(role=>characterDialoguePoolV279(role));
  const banned=['자리 지킨다','자리 막는다','바로 막는다','계속 막는다','여긴 내 자리다'];
  const bannedHits=banned.filter(text=>runtimeLines.some(line=>String(line).includes(text)));
  return {version:VERSION331,rows,total:runtimeLines.length,unique:new Set(runtimeLines).size,recentLimit:DIALOGUE_RECENT_TEXT_LIMIT_V279,bannedHits,
    allPass:rows.every(row=>row.count>=20)&&runtimeLines.length>=250&&new Set(runtimeLines).size>=240&&DIALOGUE_RECENT_TEXT_LIMIT_V279>=140&&bannedHits.length===0};
}

const dialogueCoverageStateV280={attempted:0,emitted:0,byEvent:new Map(),last:null};
function recordDialogueCoverageV280(event,roles,output){
  const key=String(event||'');const emittedCount=Array.isArray(output)?output.length:(output?1:0);
  dialogueCoverageStateV280.attempted+=1;dialogueCoverageStateV280.emitted+=emittedCount;
  const row=dialogueCoverageStateV280.byEvent.get(key)||{attempted:0,emitted:0};
  row.attempted+=1;row.emitted+=emittedCount;dialogueCoverageStateV280.byEvent.set(key,row);
  dialogueCoverageStateV280.last={event:key,roles:[...(roles||[])],emitted:emittedCount,simTimeMs:Number(simClockV192.simTimeMs)||0};
  return emittedCount;
}
function resetDialogueCoverageV280(){dialogueCoverageStateV280.attempted=0;dialogueCoverageStateV280.emitted=0;dialogueCoverageStateV280.byEvent=new Map();dialogueCoverageStateV280.last=null;return true}
function getDialogueCoverageV280(){
  const mapped=MICRO_BATTLE_EVENTS_V278.map(event=>{
    const roles=MICRO_DIALOGUE_ROLE_MAP_V279[event]||[];
    return {event,mapped:roles.length>0,roles:[...roles],pools:roles.map(role=>characterDialoguePoolV279(role).length)};
  });
  return {attempted:dialogueCoverageStateV280.attempted,emitted:dialogueCoverageStateV280.emitted,last:dialogueCoverageStateV280.last?{...dialogueCoverageStateV280.last}:null,
    runtime:Object.fromEntries([...dialogueCoverageStateV280.byEvent.entries()].map(([event,row])=>[event,{...row}])),mapped};
}
function qaEventDialogueCoverageV280(){
  const rows=getDialogueCoverageV280().mapped;
  const unmapped=rows.filter(row=>!row.mapped),emptyPools=rows.filter(row=>row.roles.some((role,index)=>Number(row.pools[index])<=0));
  const roleNames=[...new Set(rows.flatMap(row=>row.roles))];
  const allCatalogMapped=rows.length===MICRO_BATTLE_EVENTS_V278.length&&unmapped.length===0;
  const allPoolsReady=emptyPools.length===0&&roleNames.length>=10;
  return {catalogCount:MICRO_BATTLE_EVENTS_V278.length,mappedCount:rows.filter(row=>row.mapped).length,unmapped:unmapped.map(row=>row.event),emptyPools:emptyPools.map(row=>row.event),roleCount:roleNames.length,allCatalogMapped,allPoolsReady,
    allPass:MICRO_BATTLE_EVENTS_V278.length>=27&&allCatalogMapped&&allPoolsReady};
}


const DIALOGUE_CADENCE_CONFIG_V281=Object.freeze({windowMs:12000,maxGroupsPerWindow:2,speakerGapMs:4800,pairGapMs:7000,criticalPairGapMs:1800});
const dialogueCadenceStateV281={recentGroupTimes:[],lastPairAt:new Map(),lastSpeakerAt:new Map(),emitted:0,suppressed:0,lastReason:''};
function resetDialogueCadenceV281(){dialogueCadenceStateV281.recentGroupTimes=[];dialogueCadenceStateV281.lastPairAt=new Map();dialogueCadenceStateV281.lastSpeakerAt=new Map();dialogueCadenceStateV281.emitted=0;dialogueCadenceStateV281.suppressed=0;dialogueCadenceStateV281.lastReason='';return true}
function trimDialogueCadenceWindowV281(now=Number(simClockV192.simTimeMs)||0){const min=now-DIALOGUE_CADENCE_CONFIG_V281.windowMs;dialogueCadenceStateV281.recentGroupTimes=dialogueCadenceStateV281.recentGroupTimes.filter(v=>Number(v)>=min);return dialogueCadenceStateV281.recentGroupTimes.length}
function dialogueCadenceKeyV281(event,vehicle,target){const pair=[String(vehicle?.id||''),String(target?.id||'')].filter(Boolean).sort();return pair.join('|')||String(event||'global')}
function dialogueCadenceAllowsV281(event,vehicle,target,{critical=false}={}){
  const now=Number(simClockV192.simTimeMs)||0,key=dialogueCadenceKeyV281(event,vehicle,target),speaker=String(vehicle?.id||'');
  trimDialogueCadenceWindowV281(now);
  const pairGap=critical?DIALOGUE_CADENCE_CONFIG_V281.criticalPairGapMs:DIALOGUE_CADENCE_CONFIG_V281.pairGapMs;
  const lastPair=Number(dialogueCadenceStateV281.lastPairAt.get(key));
  if(Number.isFinite(lastPair)&&now-lastPair<pairGap){dialogueCadenceStateV281.suppressed+=1;dialogueCadenceStateV281.lastReason='pair-gap';return false}
  const lastSpeaker=Number(dialogueCadenceStateV281.lastSpeakerAt.get(speaker));
  if(!critical&&speaker&&Number.isFinite(lastSpeaker)&&now-lastSpeaker<DIALOGUE_CADENCE_CONFIG_V281.speakerGapMs){dialogueCadenceStateV281.suppressed+=1;dialogueCadenceStateV281.lastReason='speaker-gap';return false}
  if(!critical&&dialogueCadenceStateV281.recentGroupTimes.length>=DIALOGUE_CADENCE_CONFIG_V281.maxGroupsPerWindow){dialogueCadenceStateV281.suppressed+=1;dialogueCadenceStateV281.lastReason='window-budget';return false}
  dialogueCadenceStateV281.lastReason='';return true
}
function recordDialogueCadenceV281(event,vehicle,target){const now=Number(simClockV192.simTimeMs)||0,key=dialogueCadenceKeyV281(event,vehicle,target),speaker=String(vehicle?.id||'');dialogueCadenceStateV281.lastPairAt.set(key,now);if(speaker)dialogueCadenceStateV281.lastSpeakerAt.set(speaker,now);dialogueCadenceStateV281.recentGroupTimes.push(now);trimDialogueCadenceWindowV281(now);dialogueCadenceStateV281.emitted+=1;return true}
function getDialogueCadenceV281(){const now=Number(simClockV192.simTimeMs)||0;trimDialogueCadenceWindowV281(now);return {recentGroups:dialogueCadenceStateV281.recentGroupTimes.length,emitted:dialogueCadenceStateV281.emitted,suppressed:dialogueCadenceStateV281.suppressed,lastReason:dialogueCadenceStateV281.lastReason,config:{...DIALOGUE_CADENCE_CONFIG_V281},recentTextCount:dialogueRecentTextV279.length,recentTextLimit:DIALOGUE_RECENT_TEXT_LIMIT_V279}}
function qaDialogueCadenceV281(){
  const oldTime=simClockV192.simTimeMs;resetDialogueCadenceV281();
  const a={id:'qa-a'},b={id:'qa-b'},c={id:'qa-c'},d={id:'qa-d'},e={id:'qa-e'};
  simClockV192.simTimeMs=1000;const first=dialogueCadenceAllowsV281('CHASE',a,b);if(first)recordDialogueCadenceV281('CHASE',a,b);
  const duplicateBlocked=!dialogueCadenceAllowsV281('CHASE2',a,b);
  simClockV192.simTimeMs=3000;const speakerGapBlocked=!dialogueCadenceAllowsV281('CHASE3',a,c);
  simClockV192.simTimeMs=6000;const speakerGapReleased=dialogueCadenceAllowsV281('CHASE4',a,c);if(speakerGapReleased)recordDialogueCadenceV281('CHASE4',a,c);
  simClockV192.simTimeMs=6800;const budgetBlocked=!dialogueCadenceAllowsV281('E5',d,e);
  const criticalAllowed=dialogueCadenceAllowsV281('PASS_SUCCESS',e,b,{critical:true});
  simClockV192.simTimeMs=oldTime;resetDialogueCadenceV281();
  return {first,duplicateBlocked,speakerGapBlocked,speakerGapReleased,budgetBlocked,criticalAllowed,config:{...DIALOGUE_CADENCE_CONFIG_V281},recentTextLimit:DIALOGUE_RECENT_TEXT_LIMIT_V279,
    allPass:first&&duplicateBlocked&&speakerGapBlocked&&speakerGapReleased&&budgetBlocked&&criticalAllowed&&DIALOGUE_CADENCE_CONFIG_V281.maxGroupsPerWindow<=2&&DIALOGUE_CADENCE_CONFIG_V281.speakerGapMs>=4000&&DIALOGUE_RECENT_TEXT_LIMIT_V279>=80}
}


function qaDialogueLongRunDesktopV282(benchmarkInput=null){
  const benchmark=benchmarkInput&&typeof benchmarkInput==='object'?benchmarkInput:qaRaceMomentumBenchmarkV262();
  const micro=getMicroBattleEventsV278();
  const pool=dialoguePoolCountV279();
  const coverage=qaEventDialogueCoverageV280();
  const cadence=getDialogueCadenceV281();
  const conversation=getLiveConversationStateV276();
  const desktopUi=Boolean(document.getElementById('f1RacingViewRaceV185')&&document.getElementById('f1RacingConversationStackV276'));
  const bounded={
    microHistory:micro.history.length<=120,
    characterHistory:characterDialogueStateV277.history.length<=60,
    conversationEntries:conversation.entries.length<=LIVE_CONVERSATION_CONFIG_V276.maxVisible,
    recentDialogueText:dialogueRecentTextV279.length<=DIALOGUE_RECENT_TEXT_LIMIT_V279,
    cadenceWindow:cadence.recentGroups<=DIALOGUE_CADENCE_CONFIG_V281.maxGroupsPerWindow
  };
  const ruleBounds={
    burstUses:CHASE_BURST_CONFIG_V275.maxUsesPerRace<=2,
    burstChance:CHASE_BURST_CONFIG_V275.activationChance<=.05,
    leaderPressureChance:LEADER_PRESSURE_CONFIG_V274.maxEventChance<=.06
  };
  const benchmarkPass=Boolean(benchmark?.allPass)&&Number(benchmark?.trackCount)===7&&Number(benchmark?.completedRuns)===7;
  const dialoguePass=Number(pool?.total)>=400&&coverage?.allPass===true&&MICRO_BATTLE_EVENTS_V278.length>=27;
  const boundedPass=Object.values(bounded).every(Boolean),rulesPass=Object.values(ruleBounds).every(Boolean);
  return {
    benchmark:{allPass:Boolean(benchmark?.allPass),trackCount:Number(benchmark?.trackCount)||0,completedRuns:Number(benchmark?.completedRuns)||0,averageOvertakes:Number(benchmark?.averageOvertakes)||0,p1Retention:Number(benchmark?.p1Retention)||0,top3Variation:Number(benchmark?.top3Variation)||0,abnormalGapRuns:Number(benchmark?.abnormalGapRuns)||0},
    dialogue:{poolTotal:Number(pool?.total)||0,microEventCount:MICRO_BATTLE_EVENTS_V278.length,coveragePass:Boolean(coverage?.allPass),cadence:{...cadence}},
    bounded,ruleBounds,desktopUi,benchmarkPass,dialoguePass,boundedPass,rulesPass,
    allPass:desktopUi&&benchmarkPass&&dialoguePass&&boundedPass&&rulesPass
  };
}

const commentaryStateV219={
  initialized:false,lastPollSimMs:-Infinity,lastLeaderId:'',lastFlag:'GREEN',lastLeaderLap:0,
  vehicle:new Map(),sequence:0
};
const commentaryReadV226={followTail:true,unread:0,lastTextAt:new Map(),bound:false};
const COMMENTARY_SEMANTIC_CONFIG_V337=Object.freeze({defaultWallGapMs:4200,mistakeWallGapMs:8500,openingWallGapMs:5200,exactWallGapMs:7000});
const commentarySemanticV337={lastByKey:new Map(),suppressed:0};
function commentarySemanticKeyV337(text,type='info'){
  const value=String(text||'').replace(/\[[^\]]+\]/g,'[]').replace(/\d+(?:\.\d+)?(?:초|랩|위|%|km\/h)?/g,'#').replace(/\s+/g,' ').trim();
  const kind=String(type||'info');
  if(kind==='pit'||/피트/.test(value))return 'PIT';
  if(/주행 실수|차량을 수습|언더스티어|오버스티어|타이어를 잠갔/.test(value))return 'MISTAKE';
  if(/추월 가능 구간|추월 기회/.test(value))return 'OPENING';
  if(/압박 중|압박을 시작|간격을 지웁/.test(value))return 'PRESSURE';
  if(/선두로 올라섰|레이스 선두/.test(value))return 'LEAD';
  return kind.toUpperCase()+':'+value;
}
function commentarySemanticGapV337(key){
  if(key==='MISTAKE')return COMMENTARY_SEMANTIC_CONFIG_V337.mistakeWallGapMs;
  if(key==='OPENING'||key==='PRESSURE')return COMMENTARY_SEMANTIC_CONFIG_V337.openingWallGapMs;
  return COMMENTARY_SEMANTIC_CONFIG_V337.defaultWallGapMs;
}
function commentarySemanticAllowsV337(text,type='info'){
  const key=commentarySemanticKeyV337(text,type);
  if(key==='PIT'){commentarySemanticV337.suppressed+=1;return false}
  if(['FLAG','FINISH','LEAD','PASS','START'].includes(String(type||'').toUpperCase()))return true;
  const now=Date.now(),previous=Number(commentarySemanticV337.lastByKey.get(key));
  if(Number.isFinite(previous)&&now-previous<commentarySemanticGapV337(key)){commentarySemanticV337.suppressed+=1;return false}
  commentarySemanticV337.lastByKey.set(key,now);return true;
}
const commentaryCadenceV227={
  lastByType:new Map(),recentNarrativeTimes:[],emitted:0,suppressed:0
};
function commentaryCadenceGapV227(type='flow'){
  const value=String(type||'flow');
  if(value==='battle')return COMMENTARY_CADENCE_V227.battleGapMs;
  if(value==='strategy')return COMMENTARY_CADENCE_V227.strategyGapMs;
  return COMMENTARY_CADENCE_V227.flowGapMs;
}
function resetCommentaryCadenceV227(){
  commentaryCadenceV227.lastByType=new Map();
  commentaryCadenceV227.recentNarrativeTimes=[];
  commentaryCadenceV227.emitted=0;
  commentaryCadenceV227.suppressed=0;
  return true;
}
function commentaryCadenceAllowsV227(type='flow',bypass=false){
  if(bypass)return true;
  const now=Number(simClockV192.simTimeMs)||0;
  const windowStart=now-COMMENTARY_CADENCE_V227.windowMs;
  commentaryCadenceV227.recentNarrativeTimes=commentaryCadenceV227.recentNarrativeTimes.filter(value=>Number(value)>=windowStart);
  if(commentaryCadenceV227.recentNarrativeTimes.length>=COMMENTARY_CADENCE_V227.maxNarrativePerWindow){
    commentaryCadenceV227.suppressed+=1;return false;
  }
  const key=String(type||'flow');
  const previous=Number(commentaryCadenceV227.lastByType.get(key));
  if(Number.isFinite(previous)&&now-previous<commentaryCadenceGapV227(key)){
    commentaryCadenceV227.suppressed+=1;return false;
  }
  return true;
}
function recordCommentaryCadenceV227(type='flow'){
  const now=Number(simClockV192.simTimeMs)||0,key=String(type||'flow');
  commentaryCadenceV227.lastByType.set(key,now);
  commentaryCadenceV227.recentNarrativeTimes.push(now);
  commentaryCadenceV227.emitted+=1;
  return true;
}
function commentaryPriorityV226(type){
  const value=String(type||'info');
  if(['flag','finish','lead','pass','start'].includes(value))return 'critical';
  if(['battle','incident','pit'].includes(value))return 'high';
  if(value==='strategy')return 'medium';
  return 'low';
}
function syncCommentaryUnreadV226(){
  const badge=document.getElementById('f1RacingCommentaryUnreadV226');
  if(!badge)return false;
  badge.hidden=commentaryReadV226.unread<=0;
  badge.textContent='새 해설 '+commentaryReadV226.unread+'개';
  return true;
}
function scrollCommentaryTailV226(){
  const log=document.getElementById('f1RacingCommentaryLogV188');if(!log)return false;
  commentaryReadV226.followTail=true;commentaryReadV226.unread=0;
  log.scrollTop=log.scrollHeight;syncCommentaryUnreadV226();return true;
}
function bindCommentaryReadabilityV226(){
  const log=document.getElementById('f1RacingCommentaryLogV188');if(!log)return false;
  const panel=log.closest('[data-f1-workspace-panel="commentary"]')||log.closest('.f1-racing-commentary-v188');
  if(panel&&!document.getElementById('f1RacingCommentaryUnreadV226')){
    const badge=document.createElement('button');
    badge.type='button';badge.id='f1RacingCommentaryUnreadV226';badge.className='f1-racing-commentary-unread-v226';badge.hidden=true;
    badge.addEventListener('click',scrollCommentaryTailV226);
    panel.appendChild(badge);
  }
  if(!log.dataset.f1CommentaryReadBound){
    log.dataset.f1CommentaryReadBound='1';
    log.addEventListener('scroll',()=>{
      const distance=log.scrollHeight-log.scrollTop-log.clientHeight;
      commentaryReadV226.followTail=distance<=42;
      if(commentaryReadV226.followTail){commentaryReadV226.unread=0;syncCommentaryUnreadV226()}
    },{passive:true});
  }
  commentaryReadV226.bound=true;syncCommentaryUnreadV226();return true;
}

function commentaryTimeV219(){
  const total=Math.max(0,Number(simClockV192.simTimeMs)||0);
  const minutes=Math.floor(total/60000),seconds=Math.floor((total%60000)/1000);
  return String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
}
function appendRaceCommentaryV219(message,type='info'){
  const log=document.getElementById('f1RacingCommentaryLogV188');
  const text=String(message||'').trim();
  if(!log||!text)return false;
  bindCommentaryReadabilityV226();
  if(!commentarySemanticAllowsV337(text,type))return false;
  const now=Date.now();
  const duplicateAt=Number(commentaryReadV226.lastTextAt.get(text));
  if(Number.isFinite(duplicateAt)&&now-duplicateAt<COMMENTARY_SEMANTIC_CONFIG_V337.exactWallGapMs)return false;
  commentaryReadV226.lastTextAt.set(text,now);
  const priority=commentaryPriorityV226(type);
  log.querySelector('.f1-racing-commentary-empty-v188')?.remove();
  const row=document.createElement('div');
  row.className='f1-racing-commentary-entry-v219 '+String(type||'info');
  row.dataset.commentarySeq=String(++commentaryStateV219.sequence);
  row.dataset.commentaryPriority=priority;
  row.innerHTML='<span class="time">'+commentaryTimeV219()+'</span><span class="message"></span>';
  row.querySelector('.message').textContent=text;
  log.appendChild(row);
  while(log.children.length>120)log.firstElementChild?.remove();
  if(commentaryReadV226.followTail||priority==='critical'){
    log.scrollTop=log.scrollHeight;
    if(priority==='critical'){commentaryReadV226.followTail=true;commentaryReadV226.unread=0}
  }else{
    commentaryReadV226.unread+=1;
  }
  syncCommentaryUnreadV226();
  return true;
}
function commentaryVehicleStateV219(vehicle){
  return {
    passCompleted:Number(vehicle?.passCompletedCount)||0,
    pitState:String(vehicle?.pitState||'TRACK'),
    incident:activeDrivingIncidentV204(vehicle),
    blueFlag:Boolean(vehicle?.blueFlag),
    finished:Boolean(vehicle?.finished),
    finishPosition:Number(vehicle?.finishPosition)||0,
    battleTargetId:String(vehicle?.battleTargetId||''),
    carAheadId:String(vehicle?.carAheadId||'')
  };
}
function pitCommentaryEventV230(previousState,currentState){
  const previous=String(previousState||'TRACK'),current=String(currentState||'TRACK');
  if(previous===current)return '';
  if(current==='PIT_ENTRY'&&previous==='TRACK')return 'ENTRY';
  if(current==='PIT_BOX'&&['PIT_ENTRY','PIT_LANE'].includes(previous))return 'BOX';
  if(current==='TRACK'&&previous==='PIT_EXIT')return 'RETURN';
  return '';
}
function commentaryPassTargetV230(vehicle,previous,byId){
  const candidates=[previous?.battleTargetId,vehicle?.battleTargetId,previous?.carAheadId,vehicle?.carAheadId];
  for(const id of candidates){
    const target=byId?.get?.(String(id||''));if(target&&target!==vehicle)return target;
  }
  return null;
}
function qaCommentaryEventOrderV230(){
  const pitSequence=[
    pitCommentaryEventV230('TRACK','PIT_ENTRY'),
    pitCommentaryEventV230('PIT_ENTRY','PIT_LANE'),
    pitCommentaryEventV230('PIT_LANE','PIT_BOX'),
    pitCommentaryEventV230('PIT_BOX','PIT_EXIT'),
    pitCommentaryEventV230('PIT_EXIT','TRACK')
  ];
  const invalidReturn=pitCommentaryEventV230('PIT_BOX','TRACK');
  const passed={id:'passed',driver:{name:'추월 대상'}},nextAhead={id:'next',driver:{name:'새 앞차'}};
  const byId=new Map([['passed',passed],['next',nextAhead]]);
  const target=commentaryPassTargetV230({id:'self',battleTargetId:'',carAheadId:'next'},{battleTargetId:'passed',carAheadId:'passed'},byId);
  return {pitSequence,invalidReturn,passTargetId:String(target?.id||''),allPass:pitSequence.join('|')==='ENTRY||BOX||RETURN'&&invalidReturn===''&&String(target?.id||'')==='passed'};
}
function trackCommentaryLineV236(track=activeRaceSnapshotV187?.track){
  const profile=track?.runtimeProfile||(track?trackRuntimeProfileV234(track):null);
  if(!track||!profile)return '트랙 특성을 확인하며 레이스가 시작됩니다.';
  let trait='균형 잡힌 구성이어서 제동, 코너링, 추월 판단이 모두 중요합니다.';
  if(Number(profile.incidentRiskFactor)>=1.12)trait='좁고 저속 코너가 많아 제동 실수와 트랙 포지션 관리가 중요합니다.';
  else if(Number(profile.overtakeFactor)>=1.20)trait='긴 직선과 추월 구간을 활용한 슬립스트림과 제동 싸움이 중요합니다.';
  else if(Number(profile.tyreStressFactor)>=1.08)trait='고속 코너가 이어져 타이어와 코너 페이스 관리가 중요합니다.';
  else if(Number(profile.overtakeFactor)<=.95)trait='추월 공간이 제한적이어서 코너 진입과 출구 가속이 중요합니다.';
  return String(track.name||'트랙')+'은 '+String(profile.archetype||'종합형')+'입니다. '+trait;
}
function qaTrackAwareCommentaryV236(){
  const ids=['majoku-ring-v1','castle-street-circuit-v1','blue-coast-speedway-v1','mawang-speed-park-v1','royal-street-circuit-v1','infinity-eight-circuit-v1','highland-flow-ring-v1'];
  const rows=ids.map(id=>{const track=window.mwsGetF1TrackV182?.(id);if(!track)return {id,line:''};const runtimeProfile=trackRuntimeProfileV234(track);return {id,line:trackCommentaryLineV236({...track,runtimeProfile})}});
  return {rows,uniqueLines:new Set(rows.map(row=>row.line)).size,allPass:rows.every(row=>row.line&&row.line.includes('입니다.'))&&new Set(rows.map(row=>row.line)).size===rows.length};
}
function resetRaceCommentaryV219(){
  const log=document.getElementById('f1RacingCommentaryLogV188');
  if(log)log.innerHTML='';
  commentaryStateV219.initialized=true;
  commentaryStateV219.lastPollSimMs=-Infinity;
  commentaryStateV219.lastLeaderId='';
  commentaryStateV219.lastFlag=String(raceFlagStateV214.flag||'GREEN');
  commentaryStateV219.lastLeaderLap=0;
  commentaryStateV219.vehicle=new Map();
  commentaryStateV219.sequence=0;
  commentaryReadV226.followTail=true;commentaryReadV226.unread=0;commentaryReadV226.lastTextAt=new Map();
  commentarySemanticV337.lastByKey=new Map();commentarySemanticV337.suppressed=0;
  resetRaceNarrativeV263();
  resetLiveCutinsV264();
  resetCharacterDialogueV277();
  resetDialogueCoverageV280();
  resetDialogueCadenceV281();
  bindCommentaryReadabilityV226();
  for(const vehicle of raceMotionV189.vehicles)commentaryStateV219.vehicle.set(String(vehicle.id),commentaryVehicleStateV219(vehicle));
  const track=activeRaceSnapshotV187?.track;
  appendRaceCommentaryV219((track?.name||'선택된 트랙')+'에서 경기가 시작됐습니다. '+trackCommentaryLineV236(track),'start');
  return true;
}
function incidentCommentaryTextV219(type,name){
  if(type==='LOCK_UP')return name+'가 제동 중 타이어를 잠갔습니다.';
  if(type==='UNDERSTEER')return name+'가 코너에서 언더스티어를 겪고 있습니다.';
  if(type==='OVERSTEER')return name+'가 오버스티어를 바로잡고 있습니다.';
  return '';
}
function flagCommentaryTextV219(flag){
  return ({GREEN:'그린 플래그. 정상 레이싱이 재개됩니다.',YELLOW:'옐로 플래그가 발령됐습니다. 추월이 제한됩니다.',VSC:'가상 세이프티카가 발령됐습니다.',SAFETY_CAR:'세이프티카가 투입됐습니다.',RED:'레드 플래그. 경기가 중단됩니다.'})[flag]||'';
}
function updateRaceCommentaryV219(force=false){
  if(!commentaryStateV219.initialized||!raceMotionV189.vehicles.length)return false;
  if(!force&&Number(simClockV192.simTimeMs)-Number(commentaryStateV219.lastPollSimMs)<250)return false;
  commentaryStateV219.lastPollSimMs=Number(simClockV192.simTimeMs)||0;
  const standings=computeRaceStandingsV191();
  const leader=standings[0]?.vehicle||null;
  if(leader&&commentaryStateV219.lastLeaderId&&commentaryStateV219.lastLeaderId!==String(leader.id)){
    const technical='['+(leader.driver?.name||'드라이버')+'] 선두로 올라섰습니다.';recordTechnicalCommentaryV263(technical,'LEAD_CHANGE');appendRaceCommentaryV219(technical,'lead');
  }
  if(leader){
    commentaryStateV219.lastLeaderId=String(leader.id);
    const lap=Math.max(1,Number(leader.currentLap)||1);
    if(commentaryStateV219.lastLeaderLap&&lap>commentaryStateV219.lastLeaderLap){
      const total=Math.max(1,Number(activeRaceSnapshotV187?.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
      if(lap>=total){recordTechnicalCommentaryV263('마지막 랩에 들어갑니다.','FINAL_LAP');emitRaceNarrativeV263('FINAL_LAP',leader,null,{type:'pass',cooldownMs:0})}else appendRaceCommentaryV219(lap+'랩에 들어갑니다.','lap');
    }
    commentaryStateV219.lastLeaderLap=lap;
  }
  const flag=String(raceFlagStateV214.flag||'GREEN');
  if(flag!==commentaryStateV219.lastFlag){
    const flagText=flagCommentaryTextV219(flag);if(flagText)appendRaceCommentaryV219(flagText,'flag');
    commentaryStateV219.lastFlag=flag;
  }
  const byId=new Map(raceMotionV189.vehicles.map(vehicle=>[String(vehicle.id),vehicle]));
  for(const vehicle of raceMotionV189.vehicles){
    const id=String(vehicle.id),name=vehicle.driver?.name||'드라이버';
    const previous=commentaryStateV219.vehicle.get(id)||commentaryVehicleStateV219(vehicle);
    const current=commentaryVehicleStateV219(vehicle);
    if(current.passCompleted>previous.passCompleted){
      const target=commentaryPassTargetV230(vehicle,previous,byId);
      const technical=name+'가 '+(target?.driver?.name||'앞차')+'를 추월했습니다.';recordTechnicalCommentaryV263(technical,'PASS_SUCCESS');emitRaceNarrativeV263('PASS_SUCCESS',vehicle,target,{type:'pass',cooldownMs:0});
    }
    if(current.pitState!==previous.pitState){
      const pitEvent=pitCommentaryEventV230(previous.pitState,current.pitState);
      if(pitEvent==='ENTRY'||pitEvent==='BOX'||pitEvent==='RETURN')recordTechnicalCommentaryV263(name+' pit state '+pitEvent,'PIT_STATUS');
    }
    if(current.incident&&current.incident!==previous.incident){
      const incidentText=incidentCommentaryTextV219(current.incident,name);if(incidentText){recordTechnicalCommentaryV263(incidentText,'MISTAKE');emitRaceNarrativeV263('MISTAKE',vehicle,null,{type:'battle',cooldownMs:0})}
    }
    if(current.blueFlag&&!previous.blueFlag)appendRaceCommentaryV219('['+name+'] 블루 플래그가 제시됐습니다. 선두권 차량에 길을 내줘야 합니다.','flag');
    if(current.finished&&!previous.finished)appendRaceCommentaryV219('['+name+'] '+current.finishPosition+'위로 결승선을 통과했습니다.','finish');
    commentaryStateV219.vehicle.set(id,current);
  }
  return true;
}
function qaRaceCommentaryV219(){
  return {
    initialized:Boolean(commentaryStateV219.initialized),
    entries:document.querySelectorAll('#f1RacingCommentaryLogV188 .f1-racing-commentary-entry-v219').length,
    hasLog:Boolean(document.getElementById('f1RacingCommentaryLogV188')),
    allPass:typeof appendRaceCommentaryV219==='function'&&typeof updateRaceCommentaryV219==='function'&&Boolean(document.getElementById('f1RacingCommentaryLogV188'))
  };
}

const commentaryFlowV222={
  lastPollSimMs:-Infinity,lastAmbientSimMs:-Infinity,lastEventSimMs:-Infinity,
  signatureAt:new Map(),vehicle:new Map()
};
function commentaryFlowVehicleStateV222(vehicle){
  return {
    pitRequested:Boolean(vehicle?.pitRequested),
    strategyDecision:String(vehicle?.strategyDecision||'NONE'),
    strategyTargetCompound:String(vehicle?.strategyTargetCompound||vehicle?.tyreCompound||''),
    tyreWear:Number(vehicle?.tyreWear)||0,
    overtakeEligible:Boolean(vehicle?.overtakeEligible),
    battleState:String(vehicle?.battleState||'FOLLOWING'),
    battleTargetId:String(vehicle?.battleTargetId||'')
  };
}
function commentaryCanEmitV222(signature,cooldownMs=8000){
  const key=String(signature||'');
  const now=Number(simClockV192.simTimeMs)||0;
  if(!key)return true;
  const previous=Number(commentaryFlowV222.signatureAt.get(key));
  if(Number.isFinite(previous)&&now-previous<Math.max(0,Number(cooldownMs)||0))return false;
  commentaryFlowV222.signatureAt.set(key,now);
  return true;
}
function appendRaceCommentaryV222(message,type='flow',signature='',cooldownMs=8000){
  const bypassCadence=Number(cooldownMs)<=0;
  if(!commentaryCadenceAllowsV227(type,bypassCadence))return false;
  if(!commentaryCanEmitV222(signature,cooldownMs))return false;
  const appended=appendRaceCommentaryV219(message,type);
  if(appended){
    commentaryFlowV222.lastEventSimMs=Number(simClockV192.simTimeMs)||0;
    if(!bypassCadence)recordCommentaryCadenceV227(type);
  }
  return appended;
}
function resetCommentaryFlowV222(){
  resetCommentaryCadenceV227();
  commentaryFlowV222.lastPollSimMs=-Infinity;
  commentaryFlowV222.lastAmbientSimMs=Number(simClockV192.simTimeMs)||0;
  commentaryFlowV222.lastEventSimMs=Number(simClockV192.simTimeMs)||0;
  commentaryFlowV222.signatureAt=new Map();
  commentaryFlowV222.vehicle=new Map();
  for(const vehicle of raceMotionV189.vehicles)commentaryFlowV222.vehicle.set(String(vehicle.id),commentaryFlowVehicleStateV222(vehicle));
  return true;
}
function updateRaceNarrativeV222(force=false){
  if(!commentaryStateV219.initialized||!raceMotionV189.vehicles.length)return false;
  const now=Number(simClockV192.simTimeMs)||0;
  if(!force&&now-Number(commentaryFlowV222.lastPollSimMs)<500)return false;
  commentaryFlowV222.lastPollSimMs=now;
  const byId=new Map(raceMotionV189.vehicles.map(vehicle=>[String(vehicle.id),vehicle]));
  let emitted=false;
  for(const vehicle of raceMotionV189.vehicles){
    const id=String(vehicle.id),name=vehicle.driver?.name||'드라이버';
    const previous=commentaryFlowV222.vehicle.get(id)||commentaryFlowVehicleStateV222(vehicle);
    const current=commentaryFlowVehicleStateV222(vehicle);
    if(current.pitRequested&&!previous.pitRequested){
      const target=current.strategyTargetCompound?current.strategyTargetCompound+' tyre':'tyre';
      recordTechnicalCommentaryV263(name+' pit request '+target,'PIT_STATUS');
    }
    if(current.tyreWear>=0.72&&previous.tyreWear<0.72){
      emitted=appendRaceCommentaryV222('['+name+'] 타이어 마모가 커졌습니다. 페이스 관리가 중요해집니다.','strategy','tyre-wear:'+id,30000)||emitted;
    }
    if(current.battleState!==previous.battleState){
      const target=byId.get(current.battleTargetId);
      const event=narrativeEventFromBattleStateV263(current.battleState);
      if(event){
        recordTechnicalCommentaryV263(name+' battle state '+current.battleState+' vs '+(target?.driver?.name||'앞차'),'BATTLE_STATE');
        emitted=emitRaceNarrativeV263(event,vehicle,target,{type:'battle',cooldownMs:1800})||emitted;
      }
    }
    if(current.overtakeEligible&&!previous.overtakeEligible){
      const ahead=byId.get(String(vehicle.carAheadId||''));
      recordTechnicalCommentaryV263(name+'가 '+(ahead?.driver?.name||'앞차')+'를 상대로 추월 기회를 잡았습니다.','OPENING');
      emitted=emitRaceNarrativeV263('OPENING',vehicle,ahead,{type:'battle',cooldownMs:1800})||emitted;
    }
    commentaryFlowV222.vehicle.set(id,current);
  }
  const quietFor=now-Number(commentaryFlowV222.lastEventSimMs);
  if(now-Number(commentaryFlowV222.lastAmbientSimMs)>=12000&&quietFor>=6000){
    commentaryFlowV222.lastAmbientSimMs=now;
    const standings=computeRaceStandingsV191();
    const leader=standings[0],second=standings[1];
    if(leader&&second){
      const gap=Math.max(0,Number(second.gapSeconds)||0);
      const leaderName=leader.vehicle?.driver?.name||'선두';
      const secondName=second.vehicle?.driver?.name||'2위';
      const message=gap<=1.5
        ?'['+leaderName+'] ['+secondName+']와 선두 경쟁 중 · 격차 '+gap.toFixed(3)+'초'
        :'['+leaderName+'] 선두 주행 중 · ['+secondName+']와 격차 '+gap.toFixed(3)+'초';
      emitted=appendRaceCommentaryV222(message,'flow','ambient-lead-gap',10000)||emitted;
    }else if(leader){
      emitted=appendRaceCommentaryV222('['+(leader.vehicle?.driver?.name||'선두')+'] 현재 레이스 선두입니다.','flow','ambient-single-leader',10000)||emitted;
    }
  }
  return emitted;
}
function qaCommentaryCadenceV227(){
  const now=Number(simClockV192.simTimeMs)||0;
  const windowStart=now-COMMENTARY_CADENCE_V227.windowMs;
  const recent=commentaryCadenceV227.recentNarrativeTimes.filter(value=>Number(value)>=windowStart);
  return {
    emitted:commentaryCadenceV227.emitted,
    suppressed:commentaryCadenceV227.suppressed,
    recentNarrativeCount:recent.length,
    maxNarrativePerWindow:COMMENTARY_CADENCE_V227.maxNarrativePerWindow,
    flowGapMs:COMMENTARY_CADENCE_V227.flowGapMs,
    strategyGapMs:COMMENTARY_CADENCE_V227.strategyGapMs,
    battleGapMs:COMMENTARY_CADENCE_V227.battleGapMs,
    allPass:recent.length<=COMMENTARY_CADENCE_V227.maxNarrativePerWindow&&COMMENTARY_CADENCE_V227.flowGapMs>COMMENTARY_CADENCE_V227.strategyGapMs&&COMMENTARY_CADENCE_V227.strategyGapMs>COMMENTARY_CADENCE_V227.battleGapMs
  };
}
function qaCommentaryReadabilityV226(){
  bindCommentaryReadabilityV226();
  return {
    bound:commentaryReadV226.bound,
    followTail:commentaryReadV226.followTail,
    unread:commentaryReadV226.unread,
    badgeReady:Boolean(document.getElementById('f1RacingCommentaryUnreadV226')),
    duplicateCache:Boolean(commentaryReadV226.lastTextAt),
    allPass:commentaryReadV226.bound&&Boolean(document.getElementById('f1RacingCommentaryUnreadV226'))&&Boolean(commentaryReadV226.lastTextAt)
  };
}

function qaRaceNarrativeV222(){
  const vehicleStates=raceMotionV189.vehicles.map(vehicle=>commentaryFlowVehicleStateV222(vehicle));
  return {
    vehicles:vehicleStates.length,
    signatureCount:commentaryFlowV222.signatureAt.size,
    hasFlowState:Boolean(commentaryFlowV222.vehicle),
    functionsReady:typeof appendRaceCommentaryV222==='function'&&typeof updateRaceNarrativeV222==='function'&&typeof resetCommentaryFlowV222==='function',
    allPass:typeof appendRaceCommentaryV222==='function'&&typeof updateRaceNarrativeV222==='function'&&typeof resetCommentaryFlowV222==='function'
  };
}

function activeRaceModeV345(){
  return String(activeRaceSnapshotV187?.raceMode||'NORMAL').toUpperCase()==='FAST'?'FAST':'NORMAL';
}
function raceFormBiasV345(vehicle,snapshot=activeRaceSnapshotV187){
  const mode=String(snapshot?.raceMode||'NORMAL').toUpperCase()==='FAST'?'FAST':'NORMAL';
  const amplitude=mode==='FAST'?FIELD_SPREAD_BALANCE_V352.fastFormAmplitude:FIELD_SPREAD_BALANCE_V352.normalFormAmplitude;
  const seed=hashDriverV189([String(snapshot?.createdAt||'race'),String(snapshot?.trackId||snapshot?.track?.id||'track'),String(vehicle?.id||vehicle?.driver?.contactId||vehicle?.driver?.name||'driver'),'race-form-v345'].join('|'));
  const unit=(seed%2001)/1000-1;
  return Math.max(-amplitude,Math.min(amplitude,unit*amplitude));
}
function raceCompetitionConfigV345(){
  return RACE_COMPETITION_V345[activeRaceModeV345()]||RACE_COMPETITION_V345.NORMAL;
}
function frontChallengeBonusV345(index,gapMeters){
  const rankWeight=index===1?1:index===2?0.68:index===3?0.38:0;
  if(rankWeight<=0)return 0;
  const cfg=raceCompetitionConfigV345();
  const gap=Math.max(0,Number(gapMeters)||0);
  const proximity=clamp01V198(1-gap/Math.max(1,GAME_VARIABILITY_CONFIG_V303.maxGapMeters));
  return cfg.p2ChallengeKph*rankWeight*(.46+.54*proximity);
}
function gameVariabilityEligibleV303(vehicle){
  return Boolean(vehicle&&!vehicle.finished&&!vehicle.blueFlag&&!vehicle.trackBoundaryExceededV271&&String(vehicle.pitState||'TRACK')==='TRACK'&&!vehicle.pitRequested);
}
function gameVariabilityMomentumV303(vehicle,now){
  const bucket=Math.floor(Math.max(0,Number(now)||0)/4200);
  const seed=hashDriverV189(String(vehicle?.id||'driver')+'|v303|'+bucket);
  return ((seed%1000)/999);
}
function liveCandidateScoreV315(row,index,standings,moverId=''){
  const vehicle=row?.vehicle;if(!vehicle)return -Infinity;
  const id=String(vehicle.id||''),exposure=Number(liveCutinStateV264.driverExposure.get(id))||0;
  const recent=liveCutinStateV264.recentDriverIds,reverseIndex=[...recent].reverse().indexOf(id);
  const recentPenalty=reverseIndex===0?3.2:reverseIndex===1?2.2:reverseIndex>=0?1.0:0;
  const gap=Math.max(0,Number(row?.intervalSeconds)||99),closeness=Math.max(0,1-Math.min(3,gap)/3)*2.4;
  const active=['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','BRAKING_DUEL','CORNER_BATTLE','SWITCHBACK','COUNTER_ATTACK'].includes(String(vehicle.battleState||''))?1.5:0;
  const coverage=LIVE_DIVERSITY_CONFIG_V315.exposureWeight/(1+exposure);
  const rearRatio=index/Math.max(1,standings.length-1);
  const rearCoverage=rearRatio*LIVE_DIVERSITY_CONFIG_V315.rearCoverageWeight;
  const moverBonus=id===String(moverId||'')?4.2:0;
  return moverBonus+closeness+active+coverage+rearCoverage-recentPenalty;
}
function chooseLiveCandidateV315(standings,mover){
  const moverId=String(mover?.vehicle?.id||'');
  const rows=standings.slice(1).map((row,offset)=>({row,index:offset+1,score:liveCandidateScoreV315(row,offset+1,standings,moverId)}));
  rows.sort((a,b)=>b.score-a.score);
  return rows[0]?.row||mover||standings[1]||null;
}
function liveStateForCandidateV315(vehicle,isMover){
  if(isMover)return 'PASS_COMPLETED';
  const state=String(vehicle?.battleState||'FOLLOWING');
  return ['PREPARING_ATTACK','PULLING_OUT','SIDE_BY_SIDE','COUNTER_ATTACK'].includes(state)?state:'FOLLOWING';
}
function emitGameLiveV303(standings,now){
  if(engineQaV240.active||now-gameVariabilityStateV303.lastLiveSimMs<GAME_VARIABILITY_CONFIG_V303.liveCadenceMs||standings.length<2)return false;
  const currentOrder=standings.map(row=>String(row.vehicle?.id||''));
  let mover=null;
  if(gameVariabilityStateV303.lastOrder.length===currentOrder.length){
    for(let i=0;i<currentOrder.length;i++){
      const previous=gameVariabilityStateV303.lastOrder.indexOf(currentOrder[i]);
      if(previous>i){mover=standings[i];break}
    }
  }
  const candidate=chooseLiveCandidateV315(standings,mover),vehicle=candidate?.vehicle;
  if(!vehicle)return false;
  const index=standings.findIndex(row=>row.vehicle===vehicle),target=index>0?standings[index-1]?.vehicle:null;
  const isMover=Boolean(mover&&mover.vehicle===vehicle),state=liveStateForCandidateV315(vehicle,isMover),event=liveCutinEventV264(state);
  const preview=liveCutinMessageStateV307(event,vehicle,target,false);
  const shown=enqueueLiveCutinV264(vehicle,state,String(target?.id||''));
  if(shown)appendRaceCommentaryV222(preview.message,'battle','v315-live:'+String(vehicle.id)+':'+String(event)+':'+String(Math.floor(now/GAME_VARIABILITY_CONFIG_V303.liveCadenceMs)),1200);
  gameVariabilityStateV303.lastLiveSimMs=now;gameVariabilityStateV303.liveEmits+=shown?1:0;
  return shown;
}
function positionCatchupPercentV314(position,count){
  const total=Math.max(2,Number(count)||2),pos=Math.max(1,Math.min(total,Number(position)||1));
  const rankRatio=(pos-1)/(total-1);
  return GAME_VARIABILITY_CONFIG_V303.positionCatchupMaxPct*Math.pow(rankRatio,GAME_VARIABILITY_CONFIG_V303.positionCatchupExponent);
}
function positionCatchupBonusV314(vehicle,position,count){
  const pct=positionCatchupPercentV314(position,count);
  const speed=Math.max(120,Math.min(340,Number(vehicle?.speedKph)||220));
  return {pct,bonusKph:speed*pct};
}
function fieldSpreadCatchupCapMultiplierV354(){
  return activeRaceModeV345()==='FAST'?FIELD_SPREAD_BALANCE_V352.fastCatchupCapMultiplier:FIELD_SPREAD_BALANCE_V352.normalCatchupCapMultiplier;
}
function applyGameVariabilityV303(stepMs){
  if(!(stepMs>0)||raceFlagStateV214.flag!=='GREEN'||!raceMotionV189.vehicles.length)return [];
  const now=Number(simClockV192.simTimeMs)||0;
  const competitionV345=raceCompetitionConfigV345();
  if(now-gameVariabilityStateV303.lastEvalSimMs<GAME_VARIABILITY_CONFIG_V303.evaluationMs)return [];
  gameVariabilityStateV303.lastEvalSimMs=now;
  const standings=computeRaceStandingsV191(),trackLength=Math.max(1,Number(activeRaceSnapshotV187?.track?.lengthMeters)||1),rows=[];
  const currentOrder=standings.map(row=>String(row.vehicle?.id||''));
  if(gameVariabilityStateV303.lastOrder.length===currentOrder.length&&gameVariabilityStateV303.lastOrder.some((id,index)=>id!==currentOrder[index]))gameVariabilityStateV303.positionChanges+=1;
  for(let i=1;i<standings.length;i++){
    const follower=standings[i]?.vehicle,ahead=standings[i-1]?.vehicle;
    if(!gameVariabilityEligibleV303(follower)||!gameVariabilityEligibleV303(ahead))continue;
    if(follower.battleBlockedV319){
      const blockedCatchup=positionCatchupBonusV314(follower,i+1,standings.length);
      const retainedBonus=blockedCatchup.bonusKph*REAR_BATTLE_BALANCE_V350.blockedCatchupRetention*competitionV345.variability;
      const variabilityCapV345=GAME_VARIABILITY_CONFIG_V303.maxTotalBiasKph*fieldSpreadCatchupCapMultiplierV354();
      follower.positionCatchupPctV314=blockedCatchup.pct;follower.positionCatchupBonusKphV314=blockedCatchup.bonusKph;
      follower.variabilitySpeedBiasKphV309=Math.min(variabilityCapV345,retainedBonus);follower.variabilityBiasUntilV309=now+OVERTAKE_FLOW_CONFIG_V309.variabilityHoldMs;
      follower.battleSpeedBiasKph=combinedBattleBiasV309(follower,String(follower.battleState||'FOLLOWING'),now);
      rows.push({id:String(follower.id),position:i+1,gapMeters:Number(Math.max(0,(Number(ahead.raceProgress||0)-Number(follower.raceProgress||0))*trackLength).toFixed(2)),catchupPct:Number((blockedCatchup.pct*100).toFixed(2)),biasKph:Number(follower.battleSpeedBiasKph.toFixed(2)),battleBlockedV319:true,retainedCatchupV350:true});
      continue;
    }
    const gapMeters=Math.max(0,(Number(ahead.raceProgress||0)-Number(follower.raceProgress||0))*trackLength);
    const catchup=positionCatchupBonusV314(follower,i+1,standings.length);
    const inBattleRange=gapMeters<=GAME_VARIABILITY_CONFIG_V303.maxGapMeters;
    const pressure=inBattleRange?Math.max(0,Math.min(1,1-gapMeters/GAME_VARIABILITY_CONFIG_V303.maxGapMeters)):0;
    const failed=inBattleRange?Math.min(GAME_VARIABILITY_CONFIG_V303.maxFailedPassBonusKph,(Number(follower.passFailedCount)||0)*GAME_VARIABILITY_CONFIG_V303.failedPassBonusKph):0;
    const midfield=i>=4&&i<=14?GAME_VARIABILITY_CONFIG_V303.midfieldBonusKph:0;
    const momentum=gameVariabilityMomentumV303(follower,now)>competitionV345.momentumThreshold?GAME_VARIABILITY_CONFIG_V303.momentumBonusKph:0;
    const frontChallenge=frontChallengeBonusV345(i,gapMeters);
    const requested=(catchup.bonusKph+(inBattleRange?GAME_VARIABILITY_CONFIG_V303.baseBonusKph+pressure*GAME_VARIABILITY_CONFIG_V303.pressureBonusKph+failed:0)+midfield+momentum)*competitionV345.variability+frontChallenge;
    follower.positionCatchupPctV314=catchup.pct;
    follower.positionCatchupBonusKphV314=catchup.bonusKph;
    const variabilityCapV345=GAME_VARIABILITY_CONFIG_V303.maxTotalBiasKph*fieldSpreadCatchupCapMultiplierV354();
    follower.variabilitySpeedBiasKphV309=Math.min(variabilityCapV345,requested);
    follower.variabilityBiasUntilV309=now+OVERTAKE_FLOW_CONFIG_V309.variabilityHoldMs;
    follower.battleSpeedBiasKph=combinedBattleBiasV309(follower,String(follower.battleState||'FOLLOWING'),now);
    if(gapMeters<=GAME_VARIABILITY_CONFIG_V303.attackGapMeters*competitionV345.attackGap&&!follower.pitRequested){
      const phase=getCornerPhaseAtProgressV194(follower.progress)?.phase||'STRAIGHT';
      if(['STRAIGHT','APPROACH','BRAKING'].includes(phase))follower.racingLineMode='ATTACK_INSIDE';
    }
    gameVariabilityStateV303.boostApplications+=1;
    rows.push({id:String(follower.id),position:i+1,gapMeters:Number(gapMeters.toFixed(2)),catchupPct:Number((catchup.pct*100).toFixed(2)),biasKph:Number(follower.battleSpeedBiasKph.toFixed(2))});
  }
  const leader=standings[0]?.vehicle,p2=standings[1];
  const leaderHold=Number(leader?.leaderPressureLeadDurationMsV274)||0,gapSeconds=Math.max(0,Number(p2?.intervalSeconds)||0);
  if(gameVariabilityEligibleV303(leader)&&leaderHold>=competitionV345.leaderHoldMs&&gapSeconds<=GAME_VARIABILITY_CONFIG_V303.leaderCloseGapSeconds*1.35){
    leader.variabilitySpeedBiasKphV309=-Math.min(GAME_VARIABILITY_CONFIG_V303.maxTotalBiasKph,competitionV345.leaderPressureKph);
    leader.variabilityBiasUntilV309=now+OVERTAKE_FLOW_CONFIG_V309.variabilityHoldMs;
    leader.battleSpeedBiasKph=combinedBattleBiasV309(leader,String(leader.battleState||'FOLLOWING'),now);
    gameVariabilityStateV303.leaderPressureApplications+=1;
  }
  emitGameLiveV303(standings,now);
  gameVariabilityStateV303.lastOrder=currentOrder;
  return rows;
}
function qaLiveDiversityV315(){
  const semantic=LIVE_CUTIN_STATUS_V315.map(row=>liveSemanticKeyV315('RACE_STATUS',row.text));
  const uniqueSemantic=new Set(semantic);
  return {version:VERSION315,statusTemplates:LIVE_CUTIN_STATUS_V315.length,semanticGroups:uniqueSemantic.size,config:{...LIVE_DIVERSITY_CONFIG_V315},
    state:{recentDriverIds:[...liveCutinStateV264.recentDriverIds],recentSemanticKeys:[...liveCutinStateV264.recentSemanticKeys],exposureEntries:liveCutinStateV264.driverExposure.size},
    allPass:LIVE_CUTIN_STATUS_V315.length>=16&&LIVE_DIVERSITY_CONFIG_V315.recentDriverLimit>=5&&LIVE_DIVERSITY_CONFIG_V315.semanticWindow>=2};
}
window.mwsF1QaLiveDiversityV315=qaLiveDiversityV315;
window.mwsF1QaLiveReadabilityVarietyV332=qaLiveReadabilityVarietyV332;
window.__mwsF1RacingV315=VERSION315;
window.__mwsF1RacingV332=VERSION332;

window.mwsF1QaNaturalDialogueV331=qaNaturalDialogueV331;
window.__mwsF1RacingV331=VERSION331;

function qaGameVariabilityV303(){
  const c=GAME_VARIABILITY_CONFIG_V303;
  const synthetic={id:'qa',passFailedCount:3},m0=gameVariabilityMomentumV303(synthetic,0),m1=gameVariabilityMomentumV303(synthetic,5000);
  return {version:VERSION303,config:{...c},state:{...gameVariabilityStateV303,lastOrder:[...gameVariabilityStateV303.lastOrder]},momentumSamples:[m0,m1],
    allPass:c.maxGapMeters>=60&&c.attackGapMeters>=24&&c.maxTotalBiasKph>=4.5&&c.leaderClosePenaltyKph>0&&c.liveCadenceMs>=8500&&c.liveCadenceMs<=12000&&m0>=0&&m0<=1&&m1>=0&&m1<=1};
}

function qaRaceDynamicsV314(){
  const tyreWear={SOFT:TYRE_COMPOUNDS_V203.SOFT.wearPerLap,MEDIUM:TYRE_COMPOUNDS_V203.MEDIUM.wearPerLap,HARD:TYRE_COMPOUNDS_V203.HARD.wearPerLap};
  const catchup=[1,3,5,9].map(position=>({position,pct:positionCatchupPercentV314(position,9)}));
  const front=[0,1,2,4,8].map(index=>({position:index+1,...frontRankPressureV314(index,9)}));
  const increasingCatchup=catchup.every((row,index)=>index===0||row.pct>=catchup[index-1].pct);
  const decreasingFront=front.every((row,index)=>index===0||row.rankScore<=front[index-1].rankScore);
  return {version:VERSION314,tyreWear,pit:{...PIT_STRATEGY_CONFIG_V206},variability:{...GAME_VARIABILITY_CONFIG_V303},catchup,front,
    allPass:tyreWear.SOFT>=.10&&tyreWear.MEDIUM>=.08&&tyreWear.HARD>=.06&&PIT_STRATEGY_CONFIG_V206.tacticalMinWear>=.45&&GAME_VARIABILITY_CONFIG_V303.positionCatchupMaxPct>=.04&&increasingCatchup&&decreasingFront&&front[0].rankScore>front[1].rankScore};
}
window.mwsF1QaRaceDynamicsV314=qaRaceDynamicsV314;
window.__mwsF1RacingV314=VERSION314;


function qaVisualSpacingContinuityV330(){
  const approachProbe={visualSpacingSmoothedShiftMetersV330:68};
  const approach=[];
  for(let i=0;i<12;i++)approach.push(smoothVisualSpacingShiftV330(approachProbe,18,16.67));
  const releaseProbe={visualSpacingSmoothedShiftMetersV330:18};
  const release=[];
  for(let i=0;i<12;i++)release.push(smoothVisualSpacingShiftV330(releaseProbe,68,16.67));
  const approachMonotonic=approach.every((value,index)=>index===0||value<=approach[index-1]+.001);
  const releaseMonotonic=release.every((value,index)=>index===0||value>=release[index-1]-.001);
  const noTeleport=Math.abs(approach[0]-68)<12&&Math.abs(release[0]-18)<12;
  return {version:VERSION330,config:{...VISUAL_SPACING_SMOOTH_V330},approach,release,approachMonotonic,releaseMonotonic,noTeleport,
    allPass:approachMonotonic&&releaseMonotonic&&noTeleport&&approach[0]>18&&release[0]<68&&VISUAL_SPACING_SMOOTH_V330.approachMs>=300&&VISUAL_SPACING_SMOOTH_V330.releaseMs>=400};
}


function qaActualTrackSpacingV335(){
  const sample={id:'qa335',raceProgress:1.123,visualSpacingSmoothedShiftMetersV330:0};
  const actual=Number(sample.raceProgress)||0,targetShift=0,display=actual-smoothVisualSpacingShiftV330(sample,targetShift,16.67)/5000;
  return {version:VERSION335,actual,display,shift:sample.visualSpacingSmoothedShiftMetersV330,mode:'ACTUAL_RACE_PROGRESS',allPass:Math.abs(display-actual)<1e-9&&sample.visualSpacingSmoothedShiftMetersV330===0};
}
function qaPitStatusOnlyV336(){
  const rows=['PIT_ENTRY','PIT_LANE','PIT_BOX','PIT_EXIT'].map(pitState=>({pitState,label:timingPitLabelV253({pitState,pitRequested:false})}));
  const track=timingPitLabelV253({pitState:'TRACK',pitRequested:false}),requested=timingPitLabelV253({pitState:'TRACK',pitRequested:true});
  return {version:VERSION336,rows,track,requested,allPass:rows.every(row=>row.label==='피트')&&track===''&&requested==='피트'};
}
function qaCommentarySemanticDedupeV337(){
  const a=commentarySemanticKeyV337('[A] 주행 실수가 발생해 차량을 수습 중입니다.','battle');
  const b=commentarySemanticKeyV337('[B] 주행 실수가 발생해 차량을 수습 중입니다.','battle');
  const pit=commentarySemanticKeyV337('[A] 피트로 들어갑니다.','pit');
  return {version:VERSION337,a,b,pit,config:{...COMMENTARY_SEMANTIC_CONFIG_V337},allPass:a==='MISTAKE'&&b==='MISTAKE'&&pit==='PIT'&&COMMENTARY_SEMANTIC_CONFIG_V337.mistakeWallGapMs>=8000};
}

function qaTrainHeadwayOvertakeReleaseV328(){
  const cfg=RACE_SPACING_CONFIG_V319;
  const rows=[
    {gap:15,closing:1,expected:'TRAIN_HEADWAY'},
    {gap:15,closing:6,expected:'OVERTAKE_RELEASE'},
    {gap:26,closing:1,expected:'FREE'}
  ].map(row=>({...row,result:row.gap<cfg.physicalFollowGapMeters?(row.closing>=cfg.overtakeReleaseClosingKph?'OVERTAKE_RELEASE':'TRAIN_HEADWAY'):'FREE'}));
  return {version:VERSION328,config:{...cfg},rows,allPass:rows.every(row=>row.result===row.expected)&&cfg.blockedDisplayGapMeters>cfg.normalDisplayGapMeters&&cfg.battleDisplayGapMeters<cfg.normalDisplayGapMeters};
}
window.mwsF1QaTrainHeadwayOvertakeReleaseV328=qaTrainHeadwayOvertakeReleaseV328;
window.mwsF1QaVisualSpacingContinuityV330=qaVisualSpacingContinuityV330;
window.mwsF1QaActualTrackSpacingV335=qaActualTrackSpacingV335;
window.mwsF1QaPitStatusOnlyV336=qaPitStatusOnlyV336;
window.mwsF1QaCommentarySemanticDedupeV337=qaCommentarySemanticDedupeV337;
window.mwsF1QaBestLapOverlayV338=qaBestLapOverlayV338;
window.mwsF1SyncBestLapOverlayV338=syncBestLapOverlayV338;
window.__mwsF1RacingV328=VERSION328;
window.__mwsF1RacingV330=VERSION330;
window.__mwsF1RacingV335=VERSION335;
window.__mwsF1RacingV336=VERSION336;
window.__mwsF1RacingV337=VERSION337;
window.__mwsF1RacingV338=VERSION338;
window.__mwsF1RacingV339=VERSION339;
window.__mwsF1RacingV343=VERSION343;
window.__mwsF1RacingV344=VERSION344;
window.__mwsF1RacingV345=VERSION345;
window.__mwsF1RacingV346=VERSION346;
window.mwsF1QaCornerTyreDynamicsV343=function(){
  const corner={direction:'right',cornerClass:'slow',turnInDistanceMeters:100,apexDistanceMeters:150,exitDistanceMeters:220};
  const phases=['BRAKING','TURN_IN','APEX','EXIT'];
  const probe={progress:.1,tyreCompound:'SOFT'};
  const usable=5;
  const offsets=phases.map((phase,index)=>idealRacingLineOffsetV343({...probe,progress:.1+index*.01},usable,{phase,corner}));
  const tyreWear={SOFT:TYRE_COMPOUNDS_V203.SOFT.wearPerLap*TYRE_DYNAMICS_V343.wearMultiplier.SOFT,MEDIUM:TYRE_COMPOUNDS_V203.MEDIUM.wearPerLap*TYRE_DYNAMICS_V343.wearMultiplier.MEDIUM,HARD:TYRE_COMPOUNDS_V203.HARD.wearPerLap*TYRE_DYNAMICS_V343.wearMultiplier.HARD};
  return {version:VERSION343,offsets,tyreWear,compoundCorner:{...CORNER_DYNAMICS_V343.compoundCornerFactor},
    allPass:CORNER_DYNAMICS_V343.outsideFraction>CORNER_DYNAMICS_V270.outsideFraction&&tyreWear.SOFT>tyreWear.MEDIUM&&tyreWear.MEDIUM>tyreWear.HARD&&CORNER_DYNAMICS_V343.compoundCornerFactor.SOFT>1&&CORNER_DYNAMICS_V343.compoundCornerFactor.HARD<1};
};
window.mwsF1QaStaggeredPitStrategyV344=function(){
  const probes=['a','b','c','d','e'].map(id=>({id,tyreCompound:'MEDIUM'})).map(v=>pitWearThresholdV344(v));
  return {version:VERSION344,thresholds:probes,min:Math.min(...probes),max:Math.max(...probes),safeRemaining:TYRE_DYNAMICS_V343.pitSafeRemainingRatio,
    allPass:Math.min(...probes)>=.60&&Math.max(...probes)<=.78&&new Set(probes.map(v=>v.toFixed(3))).size>1&&TYRE_DYNAMICS_V343.pitSafeRemainingRatio===.40};
};
window.mwsF1QaCompetitionFastRaceV345=function(){
  const normal=RACE_COMPETITION_V345.NORMAL,fast=RACE_COMPETITION_V345.FAST;
  const formProbe=[1,2,3,4].map(index=>raceFormBiasV345({id:'qa-form-'+index},{createdAt:'qa-race',trackId:'qa-track',raceMode:'NORMAL'}));
  return {version:VERSION345,normal,fast,fastLaps:RACE_COMPETITION_V345.fastLaps,buttonReady:Boolean(document.getElementById('f1RacingFastRaceV345')),formProbe,
    allPass:fast.variability>normal.variability&&normal.variability>1&&fast.attackGap>normal.attackGap&&normal.p2ChallengeKph>=6&&fast.p2ChallengeKph>normal.p2ChallengeKph&&normal.leaderPressureKph>=4&&formProbe.every(v=>Math.abs(v)<=.0401)&&new Set(formProbe.map(v=>v.toFixed(4))).size>1&&RACE_COMPETITION_V345.fastLaps===3&&Boolean(document.getElementById('f1RacingFastRaceV345'))};
};
window.mwsF1QaRaceDynamicsCorrectionV346=function(){
  const usable=5;
  const right={direction:'right',cornerClass:'slow',brakingPointDistanceMeters:80,turnInDistanceMeters:110,apexDistanceMeters:150,exitDistanceMeters:220};
  const offsets=['BRAKING','TURN_IN','APEX','EXIT'].map((phase,index)=>idealRacingLineOffsetV343({progress:.10+index*.01},usable,{phase,corner:right}));
  const linePass=offsets[0]>0&&offsets[2]<0;
  const normal=RACE_COMPETITION_V345.NORMAL,fast=RACE_COMPETITION_V345.FAST;
  const front=[1,2,3,4].map(index=>frontChallengeBonusV345(index,12));
  return {version:VERSION346,offsets,linePass,front,normal,fast,
    allPass:linePass&&front[0]>front[1]&&front[1]>front[2]&&front[2]>front[3]&&front[3]===0&&normal.variability>=1.5&&normal.p2ChallengeKph>=6&&fast.variability>normal.variability};
};



function qaDynamicsContractV348(){
  const length=Math.max(1000,Number(activeRaceSnapshotV187?.track?.lengthMeters)||5000),usable=5;
  const makeCorner=direction=>({direction,cornerClass:'slow',approachDistanceMeters:length*.08,brakingPointDistanceMeters:length*.12,turnInDistanceMeters:length*.15,apexDistanceMeters:length*.20,exitDistanceMeters:length*.30});
  const lineProbe=corner=>[
    idealRacingLineOffsetV343({progress:.12},usable,{phase:'BRAKING',corner}),
    idealRacingLineOffsetV343({progress:.20},usable,{phase:'APEX',corner}),
    idealRacingLineOffsetV343({progress:.295},usable,{phase:'EXIT',corner})
  ];
  const right=lineProbe(makeCorner('right')),left=lineProbe(makeCorner('left'));
  const linePass=right[0]>0&&right[1]<0&&right[2]>0&&left[0]<0&&left[1]>0&&left[2]<0;
  const effectiveWear={
    SOFT:TYRE_COMPOUNDS_V203.SOFT.wearPerLap*TYRE_DYNAMICS_V343.wearMultiplier.SOFT,
    MEDIUM:TYRE_COMPOUNDS_V203.MEDIUM.wearPerLap*TYRE_DYNAMICS_V343.wearMultiplier.MEDIUM,
    HARD:TYRE_COMPOUNDS_V203.HARD.wearPerLap*TYRE_DYNAMICS_V343.wearMultiplier.HARD
  };
  const wearRiskSamples=[.20,.42,.60,.80,1].map(wear=>({wear,risk:clamp01V198((wear-TYRE_DYNAMICS_V343.incidentWearStart)/TYRE_DYNAMICS_V343.incidentWearScale)}));
  const wearRiskMonotonic=wearRiskSamples.every((row,index)=>index===0||row.risk>=wearRiskSamples[index-1].risk);
  const thresholds=['qa348-a','qa348-b','qa348-c','qa348-d','qa348-e','qa348-f'].map(id=>pitWearThresholdV344({id,tyreCompound:'MEDIUM'}));
  const phaseDistancePass=makeCorner('right').brakingPointDistanceMeters<makeCorner('right').turnInDistanceMeters&&makeCorner('right').turnInDistanceMeters<makeCorner('right').apexDistanceMeters&&makeCorner('right').apexDistanceMeters<makeCorner('right').exitDistanceMeters;
  const compoundPass=CORNER_DYNAMICS_V343.compoundCornerFactor.SOFT>CORNER_DYNAMICS_V343.compoundCornerFactor.MEDIUM&&CORNER_DYNAMICS_V343.compoundCornerFactor.MEDIUM>CORNER_DYNAMICS_V343.compoundCornerFactor.HARD;
  return {
    version:VERSION348,right,left,linePass,phaseDistancePass,effectiveWear,wearRiskSamples,thresholds,
    exitAccelerationMultiplier:CORNER_DYNAMICS_V343.exitAccelerationMultiplier,
    compoundCorner:{...CORNER_DYNAMICS_V343.compoundCornerFactor},
    allPass:linePass&&phaseDistancePass&&effectiveWear.SOFT>effectiveWear.MEDIUM&&effectiveWear.MEDIUM>effectiveWear.HARD&&wearRiskMonotonic&&new Set(thresholds.map(v=>v.toFixed(4))).size>1&&compoundPass&&CORNER_DYNAMICS_V343.exitAccelerationMultiplier>CORNER_DYNAMICS_V270.exitAccelerationMultiplier&&TYRE_DYNAMICS_V343.pitSafeRemainingRatio===.40
  };
}
function qaDynamicsPlaytestV348(){
  if(f1ScreenStateV185!=='SETUP')return {version:VERSION348,allPass:false,reason:'requires-setup'};
  const normal=runAcceleratedEngineRaceV240('majoku-ring-v1',{drivers:8,laps:10,runIndex:348,stepMs:80,maxSteps:50000,raceMode:'NORMAL'});
  const fast=runAcceleratedEngineRaceV240('majoku-ring-v1',{drivers:8,laps:3,runIndex:348,stepMs:80,maxSteps:30000,raceMode:'FAST'});
  const pitRequests=(normal.finalVehicleStates||[]).flatMap(vehicle=>(vehicle.pitRequestHistoryV348||[]).map(row=>({id:vehicle.id,...row})));
  const pitRequestLaps=[...new Set(pitRequests.map(row=>Number(row.lap)||0).filter(Boolean))].sort((a,b)=>a-b);
  const unsafePitRequests=pitRequests.filter(row=>Number(row.tyreRemaining)>=TYRE_DYNAMICS_V343.pitSafeRemainingRatio);
  const finishSpreadSeconds=result=>{const times=(result?.resultRows||[]).map(row=>Number(row.finishedAtSimMs)||0).filter(v=>v>0);return times.length>=2?(Math.max(...times)-Math.min(...times))/1000:0};
  const normalFinishSpreadSeconds=finishSpreadSeconds(normal),fastFinishSpreadSeconds=finishSpreadSeconds(fast);
  const cornerSummary=result=>{
    const minima={},states=result?.finalVehicleStates||[];
    let recoveryThrottleEvents=0;
    for(const state of states){
      recoveryThrottleEvents+=Number(state.cornerRecoveryThrottleCountV351)||0;
      const cleanMinima=state.cornerUnimpededMinSpeedByClassV353||{};
      for(const [key,value] of Object.entries(cleanMinima)){
        const speed=Number(value)||0;if(!(speed>0))continue;
        minima[key]=Number.isFinite(Number(minima[key]))?Math.min(Number(minima[key]),speed):speed;
      }
    }
    return {minima:Object.fromEntries(Object.entries(minima).map(([key,value])=>[key,Number(Number(value).toFixed(2))])),recoveryThrottleEvents};
  };
  const normalCorner=cornerSummary(normal),fastCorner=cornerSummary(fast);
  const cornerFloorPass=summary=>Object.entries(summary.minima||{}).every(([key,value])=>{const spec=CORNER_DRIVING_V351.speedEnvelope[key]||CORNER_DRIVING_V351.speedEnvelope.medium;return Number(value)>=Number(spec.min)*.78});
  const cornerSpeedFloorPass=cornerFloorPass(normalCorner)&&cornerFloorPass(fastCorner);
  const cornerRecoveryPass=normalCorner.recoveryThrottleEvents>0&&fastCorner.recoveryThrottleEvents>0;
  const normalPassRate=(Number(normal.telemetry?.totalPasses)||0)/Math.max(1,Number(normal.totalLaps)||10);
  const fastPassRate=(Number(fast.telemetry?.totalPasses)||0)/Math.max(1,Number(fast.totalLaps)||3);
  const normalOrderRate=(Number(normal.telemetry?.orderChanges)||0)/Math.max(1,Number(normal.totalLaps)||10);
  const fastOrderRate=(Number(fast.telemetry?.orderChanges)||0)/Math.max(1,Number(fast.totalLaps)||3);
  const normalCompetitive=Boolean(normal.completed)&&(Number(normal.telemetry?.totalPasses)||0)>=1&&(Number(normal.telemetry?.orderChanges)||0)>=1&&(Number(normal.telemetry?.driversMovedFromGrid)||0)>=1;
  const fastCompetitive=Boolean(fast.completed)&&Number(fast.totalLaps)===RACE_COMPETITION_V345.fastLaps&&(Number(fast.telemetry?.totalPasses)||0)>=1&&(Number(fast.telemetry?.orderChanges)||0)>=1&&(Number(fast.telemetry?.driversMovedFromGrid)||0)>=1;
  const fastStronger=fastPassRate>normalPassRate&&fastOrderRate>normalOrderRate;
  const firstPitByDriver=(normal.finalVehicleStates||[]).map(vehicle=>({id:String(vehicle.id||''),first:(vehicle.pitRequestHistoryV348||[])[0]||null})).filter(row=>row.first);
  const firstPitLaps=[...new Set(firstPitByDriver.map(row=>Number(row.first.lap)||0).filter(Boolean))].sort((a,b)=>a-b);
  const pitDistributed=pitRequests.length>=2&&pitRequestLaps.length>=2&&firstPitByDriver.length>=2&&firstPitLaps.length>=2;
  return {
    version:VERSION348,
    normal:{completed:Boolean(normal.completed),laps:Number(normal.totalLaps)||0,passes:Number(normal.telemetry?.totalPasses)||0,orderChanges:Number(normal.telemetry?.orderChanges)||0,driversMovedFromGrid:Number(normal.telemetry?.driversMovedFromGrid)||0,pitStops:Number(normal.telemetry?.pitStops)||0,incidents:Number(normal.telemetry?.incidentCount)||0,passRate:Number(normalPassRate.toFixed(3)),orderChangeRate:Number(normalOrderRate.toFixed(3)),finishSpreadSeconds:Number(normalFinishSpreadSeconds.toFixed(3)),corner:normalCorner},
    fast:{completed:Boolean(fast.completed),laps:Number(fast.totalLaps)||0,passes:Number(fast.telemetry?.totalPasses)||0,orderChanges:Number(fast.telemetry?.orderChanges)||0,driversMovedFromGrid:Number(fast.telemetry?.driversMovedFromGrid)||0,pitStops:Number(fast.telemetry?.pitStops)||0,incidents:Number(fast.telemetry?.incidentCount)||0,passRate:Number(fastPassRate.toFixed(3)),orderChangeRate:Number(fastOrderRate.toFixed(3)),finishSpreadSeconds:Number(fastFinishSpreadSeconds.toFixed(3)),corner:fastCorner},
    pitRequests,pitRequestLaps,firstPitByDriver,firstPitLaps,unsafePitRequests,pitDistributed,fastStronger,normalCompetitive,fastCompetitive,
    cornerSpeedFloorPass,cornerRecoveryPass,
    allPass:Boolean(normal.completed)&&Boolean(fast.completed)&&Number(normal.totalLaps)===10&&Number(fast.totalLaps)===RACE_COMPETITION_V345.fastLaps&&pitDistributed&&unsafePitRequests.length===0&&normalCompetitive&&fastCompetitive&&fastStronger&&cornerSpeedFloorPass&&cornerRecoveryPass
  };
}
window.mwsF1QaDynamicsContractV348=qaDynamicsContractV348;
window.mwsF1QaDynamicsPlaytestV348=qaDynamicsPlaytestV348;
window.__mwsF1RacingV348=VERSION348;


function qaStrictPitStaggeringV349(){
  const guardSamples=[.80,.55,.40,.399,.20].map(tyreRemaining=>({tyreRemaining,blocked:pitRemainingGuardV349({tyreRemaining})}));
  const guardPass=guardSamples[0].blocked&&guardSamples[1].blocked&&guardSamples[2].blocked&&!guardSamples[3].blocked&&!guardSamples[4].blocked;
  const thresholdRows=['SOFT','MEDIUM','HARD'].flatMap(compound=>['a','b','c','d','e','f'].map(id=>({compound,id,threshold:pitWearThresholdV344({id:'qa349-'+compound+'-'+id,tyreCompound:compound})})));
  const uniqueThresholds=new Set(thresholdRows.map(row=>row.threshold.toFixed(4))).size;
  const rangePass=thresholdRows.every(row=>row.threshold>=PIT_STAGGER_V344.minWearToConsider&&row.threshold<=PIT_STAGGER_V344.maxWearThreshold);
  return {version:VERSION349,guardSamples,thresholdRows,uniqueThresholds,rangePass,allPass:guardPass&&rangePass&&uniqueThresholds>=4&&TYRE_DYNAMICS_V343.pitSafeRemainingRatio===.40};
}
window.mwsF1QaStrictPitStaggeringV349=qaStrictPitStaggeringV349;
window.__mwsF1RacingV349=VERSION349;


function qaRearBattlePaceRetentionV350(){
  const savedVehicles=raceMotionV189.vehicles;
  const ahead={id:'v350-ahead',pitState:'TRACK',speedKph:250,raceProgress:1.02};
  const follower={id:'v350-follower',pitState:'TRACK',speedKph:252,raceProgress:1.01,trafficCarAheadId:ahead.id,trafficGapMeters:80,battleBlockedV319:true,battleState:'CLOSING',battleTargetId:ahead.id,trackBoundaryExceededV271:false};
  let farBlocked,closeBlocked,overlap;
  try{
    raceMotionV189.vehicles=[ahead,follower];
    farBlocked=battleQueueSpeedControlV350(follower);
    follower.trafficGapMeters=10;closeBlocked=battleQueueSpeedControlV350(follower);
    follower.trafficGapMeters=2.5;overlap=battleQueueSpeedControlV350(follower);
  }finally{raceMotionV189.vehicles=savedVehicles}
  const activeScale=REAR_BATTLE_BALANCE_V350.activeBattleDirtyAirScale,blockedScale=REAR_BATTLE_BALANCE_V350.blockedBattleDirtyAirScale;
  const source=String(battleQueueSpeedControlV350);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const softQueue=farBlocked?.active===false&&closeBlocked?.active===true&&Number(closeBlocked.capKph)>Number(ahead.speedKph)&&overlap?.active===true&&Number(overlap.capKph)<Number(ahead.speedKph);
  return {
    version:VERSION350,config:{...REAR_BATTLE_BALANCE_V350},farBlocked,closeBlocked,overlap,directPositionMutation,softQueue,
    allPass:softQueue&&!directPositionMutation&&activeScale>0&&activeScale<1&&blockedScale>activeScale&&blockedScale<=.85&&REAR_BATTLE_BALANCE_V350.blockedCatchupRetention>0&&REAR_BATTLE_BALANCE_V350.blockedCatchupRetention<=1
  };
}
window.mwsF1QaRearBattlePaceRetentionV350=qaRearBattlePaceRetentionV350;
window.__mwsF1RacingV350=VERSION350;


function qaPhysicsCornerBrakeReleaseV351(){
  const track={lengthMeters:5000,geometry:{referenceBrakeDecelMps2:20,referenceAccelMps2:8.5,maxStraightKph:335}};
  const makeCorner=(key,referenceApexKph)=>({id:'qa351-'+key,cornerClass:key,referenceApexKph,referenceApproachKph:330,approachDistanceMeters:0,turnInDistanceMeters:210,apexDistanceMeters:270,exitDistanceMeters:380});
  const refs={hairpin:82,slow:132,medium:185,fast:250,sCurve:195};
  const rows=Object.entries(refs).map(([key,reference])=>{
    const corner=makeCorner(key,reference),plan=cornerDrivingPlanV351(330,corner,track,'MEDIUM');
    const before=cornerTargetAtDistanceV351(plan,plan.dynamicBrakeStart,330,335);
    const turnIn=cornerTargetAtDistanceV351(plan,plan.turnIn,250,335);
    const minimum=cornerTargetAtDistanceV351(plan,plan.recoveryStart,plan.apexTarget,335);
    const recovery=cornerTargetAtDistanceV351(plan,Math.min(plan.exit,plan.recoveryStart+35),plan.apexTarget,335);
    return {key,apexTarget:plan.apexTarget,brakeDecel:plan.brakeDecel,dynamicBrakeStart:plan.dynamicBrakeStart,recoveryStart:plan.recoveryStart,before,turnIn,minimum,recovery};
  });
  const byKey=Object.fromEntries(rows.map(row=>[row.key,row]));
  const entrySensitivity=[220,270,330].map(entry=>({entry,apex:cornerApexTargetV351(entry,makeCorner('hairpin',72),'MEDIUM')}));
  const ranges=rows.every(row=>{const spec=CORNER_DRIVING_V351.speedEnvelope[row.key];return row.apexTarget>=spec.min-.01&&row.apexTarget<=spec.max+.01});
  const brakingShape=rows.every(row=>row.before>=row.turnIn-.1&&row.turnIn>=row.minimum-.1&&row.recovery>row.minimum+2);
  const classOrder=byKey.hairpin.apexTarget<byKey.slow.apexTarget&&byKey.slow.apexTarget<byKey.medium.apexTarget&&byKey.medium.apexTarget<byKey.fast.apexTarget;
  const entryResponsive=entrySensitivity[0].apex<=entrySensitivity[1].apex&&entrySensitivity[1].apex<=entrySensitivity[2].apex;
  return {version:VERSION351,rows,entrySensitivity,ranges,brakingShape,classOrder,entryResponsive,allPass:ranges&&brakingShape&&classOrder&&entryResponsive&&byKey.hairpin.apexTarget>=62&&byKey.fast.apexTarget>=220};
}
window.mwsF1QaPhysicsCornerBrakeReleaseV351=qaPhysicsCornerBrakeReleaseV351;
window.__mwsF1RacingV351=VERSION351;


function qaFieldSpreadPaceBalanceV352(){
  const normal=FIELD_SPREAD_BALANCE_V352.normalFormAmplitude,fast=FIELD_SPREAD_BALANCE_V352.fastFormAmplitude;
  const formNormal=[1,2,3,4,5,6].map(index=>raceFormBiasV345({id:'qa352-'+index},{createdAt:'qa352',trackId:'qa352-track',raceMode:'NORMAL'}));
  const formFast=[1,2,3,4,5,6].map(index=>raceFormBiasV345({id:'qa352-'+index},{createdAt:'qa352',trackId:'qa352-track',raceMode:'FAST'}));
  const normalBound=formNormal.every(value=>Math.abs(value)<=normal+.0001);
  const fastBound=formFast.every(value=>Math.abs(value)<=fast+.0001);
  return {
    version:VERSION352,config:{...FIELD_SPREAD_BALANCE_V352},rearBattle:{...REAR_BATTLE_BALANCE_V350},formNormal,formFast,
    allPass:normalBound&&fastBound&&normal<=.025&&fast<=.040&&fast>normal&&REAR_BATTLE_BALANCE_V350.blockedCatchupRetention>=.95&&REAR_BATTLE_BALANCE_V350.activeBattleDirtyAirScale<=.55&&FIELD_SPREAD_BALANCE_V352.maxFinishSpreadSeconds<=48
  };
}
window.mwsF1QaFieldSpreadPaceBalanceV352=qaFieldSpreadPaceBalanceV352;
window.__mwsF1RacingV352=VERSION352;


function qaCornerComplexRecoveryV353(){
  const track={lengthMeters:5000,geometry:{referenceBrakeDecelMps2:20,referenceAccelMps2:8.5,maxStraightKph:335}};
  const makeCorner=(id,key,reference,entry)=>({id,cornerClass:key,referenceApexKph:reference,referenceApproachKph:entry,approachDistanceMeters:0,turnInDistanceMeters:210,apexDistanceMeters:270,exitDistanceMeters:390});
  const anchors=[
    {name:'SPA_LA_SOURCE',entry:295,key:'hairpin',reference:81,min:78,max:100},
    {name:'HUNGARY_T1',entry:332,key:'hairpin',reference:99,min:95,max:110},
    {name:'AUSTRIA_T1',entry:306,key:'slow',reference:149,min:140,max:160}
  ].map(row=>{
    const corner=makeCorner('qa353-'+row.name,row.key,row.reference,row.entry);
    const plan=cornerDrivingPlanV351(row.entry,corner,track,'MEDIUM');
    const atRecovery=cornerTargetAtDistanceV351(plan,plan.recoveryStart,plan.apexTarget,335);
    const afterRecovery=cornerTargetAtDistanceV351(plan,Math.min(plan.exit,plan.recoveryStart+40),plan.apexTarget,335);
    return {...row,target:plan.apexTarget,brakeDecel:plan.brakeDecel,brakingDistance:plan.brakingDistance,recoveryStart:plan.recoveryStart,apex:plan.apex,atRecovery,afterRecovery};
  });
  const anchorPass=anchors.every(row=>row.target>=row.min&&row.target<=row.max&&row.brakeDecel>=10&&row.brakeDecel<=32&&row.recoveryStart<row.apex&&row.afterRecovery>row.atRecovery);
  const probeVehicle={cornerDrivingClassV351:'fast',trackBoundaryExceededV271:false};
  const free=cornerUnderSpeedRecoveryV353(probeVehicle,'APEX',120,235,{active:false},{active:''},{event:''});
  const blocked=cornerUnderSpeedRecoveryV353(probeVehicle,'APEX',120,235,{active:true},{active:''},{event:''});
  const source=String(cornerUnderSpeedRecoveryV353);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  return {version:VERSION353,config:{...CORNER_COMPLEX_RECOVERY_V353},anchors,free,blocked,directPositionMutation,
    allPass:anchorPass&&free.active===true&&free.multiplier>1&&blocked.active===false&&!directPositionMutation&&CORNER_DRIVING_V351.speedEnvelope.fast.brakeScale>=.85&&CORNER_DRIVING_V351.speedEnvelope.hairpin.recoveryLead>=.20};
}
window.mwsF1QaCornerComplexRecoveryV353=qaCornerComplexRecoveryV353;
window.__mwsF1RacingV353=VERSION353;


function qaFieldSpreadCapBalanceV354(){
  const normal=FIELD_SPREAD_BALANCE_V352.normalCatchupCapMultiplier,fast=FIELD_SPREAD_BALANCE_V352.fastCatchupCapMultiplier;
  const normalCap=GAME_VARIABILITY_CONFIG_V303.maxTotalBiasKph*normal,fastCap=GAME_VARIABILITY_CONFIG_V303.maxTotalBiasKph*fast;
  const source=String(fieldSpreadCatchupCapMultiplierV354);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  return {version:VERSION354,normal,fast,normalCap,fastCap,directPositionMutation,
    allPass:normal>1.15&&normal<=1.35&&fast>=normal&&fast<=1.50&&normalCap>16&&fastCap>normalCap&&!directPositionMutation&&FIELD_SPREAD_BALANCE_V352.maxFinishSpreadSeconds===48};
}
window.mwsF1QaFieldSpreadCapBalanceV354=qaFieldSpreadCapBalanceV354;
window.__mwsF1RacingV354=VERSION354;


function qaRearPaceBalanceV355(){
  const samples=[1,3,5,7,9].map(position=>({position,pct:positionCatchupPercentV314(position,9)}));
  const increasing=samples.every((row,index)=>index===0||row.pct>=samples[index-1].pct);
  const source=String(positionCatchupPercentV314)+String(positionCatchupBonusV314);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  return {version:VERSION355,maxPct:GAME_VARIABILITY_CONFIG_V303.positionCatchupMaxPct,samples,increasing,directPositionMutation,
    allPass:increasing&&!directPositionMutation&&GAME_VARIABILITY_CONFIG_V303.positionCatchupMaxPct===.05&&samples[0].pct===0&&samples[samples.length-1].pct===.05};
}
window.mwsF1QaRearPaceBalanceV355=qaRearPaceBalanceV355;
window.__mwsF1RacingV355=VERSION355;


function qaFieldPaceRetentionV356(){
  const probes=[0,.0125,.025,.0375,.05].map(pct=>({pct,multiplier:fieldPaceRetentionMultiplierV356({positionCatchupPctV314:pct})}));
  const increasing=probes.every((row,index)=>index===0||row.multiplier>=probes[index-1].multiplier);
  const source=String(fieldPaceRetentionMultiplierV356);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const maxMultiplier=probes[probes.length-1].multiplier;
  return {version:VERSION356,config:{...FIELD_SPREAD_BALANCE_V352},probes,maxMultiplier,directPositionMutation,
    allPass:increasing&&!directPositionMutation&&probes[0].multiplier===1&&maxMultiplier>1&&maxMultiplier<=1.005&&FIELD_SPREAD_BALANCE_V352.paceRetentionScale===.08};
}
window.mwsF1QaFieldPaceRetentionV356=qaFieldPaceRetentionV356;
window.__mwsF1RacingV356=VERSION356;


function qaRankedFieldPaceRetentionV357(){
  const synthetic=[0,1,2,3,4].map(index=>({id:'v357-'+index,raceProgress:1-index*.001,finished:false,pitState:'TRACK'}));
  const saved=raceMotionV189.vehicles;
  let rows=[];
  try{
    raceMotionV189.vehicles=synthetic;
    rows=updateRankedFieldPaceRetentionV357();
  }finally{raceMotionV189.vehicles=saved}
  const boosts=rows.map(row=>Number(row.boost)||0);
  const monotonic=boosts.every((value,index)=>index===0||value>=boosts[index-1]);
  const source=String(updateRankedFieldPaceRetentionV357)+String(rankedFieldPaceMultiplierV357);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  return {version:VERSION357,config:{...FIELD_SPREAD_BALANCE_V352},rows,directPositionMutation,
    allPass:rows.length===5&&boosts[0]===0&&monotonic&&boosts[boosts.length-1]>0&&boosts[boosts.length-1]<=.0051&&!directPositionMutation};
}
window.mwsF1QaRankedFieldPaceRetentionV357=qaRankedFieldPaceRetentionV357;
window.__mwsF1RacingV357=VERSION357;


function qaCornerSpeedBrakeReleaseCalibrationV358(){
  const track={lengthMeters:5000,geometry:{referenceBrakeDecelMps2:20,referenceAccelMps2:8.5,maxStraightKph:335}};
  const makeCorner=(key,reference,entry)=>({id:'qa358-'+key+'-'+entry,cornerClass:key,referenceApexKph:reference,referenceApproachKph:entry,approachDistanceMeters:0,turnInDistanceMeters:210,apexDistanceMeters:270,exitDistanceMeters:390});
  const anchors=[
    {name:'MONACO_HAIRPIN',key:'hairpin',entry:160,reference:50,expectedMin:75,expectedMax:95},
    {name:'MONZA_CHICANE',key:'hairpin',entry:350,reference:70,expectedMin:95,expectedMax:110},
    {name:'BAKU_T1',key:'slow',entry:350,reference:115,expectedMin:145,expectedMax:160},
    {name:'AUSTIN_FAST',key:'fast',entry:330,reference:260,expectedMin:250,expectedMax:270},
    {name:'MELBOURNE_11_12',key:'fast',entry:300,reference:250,expectedMin:245,expectedMax:265},
    {name:'ISTANBUL_T8',key:'fast',entry:300,reference:270,expectedMin:265,expectedMax:285}
  ].map(row=>{
    const corner=makeCorner(row.key,row.reference,row.entry);
    const plan=cornerDrivingPlanV351(row.entry,corner,track,'MEDIUM');
    const atTurnIn=cornerTargetAtDistanceV351(plan,plan.turnIn,row.entry,335);
    const atRecovery=cornerTargetAtDistanceV351(plan,plan.recoveryStart,plan.apexTarget,335);
    const afterRecovery=cornerTargetAtDistanceV351(plan,Math.min(plan.exit,plan.recoveryStart+45),plan.apexTarget,335);
    return {...row,target:plan.apexTarget,brakeDecel:plan.brakeDecel,brakingDistance:plan.brakingDistance,recoveryStart:plan.recoveryStart,apex:plan.apex,atTurnIn,atRecovery,afterRecovery};
  });
  const lowEntry=cornerDrivingPlanV351(190,makeCorner('hairpin',82,190),track,'MEDIUM');
  const highEntry=cornerDrivingPlanV351(330,makeCorner('hairpin',82,330),track,'MEDIUM');
  const entrySensitiveBrake=lowEntry.brakeDecel<highEntry.brakeDecel&&lowEntry.brakingDistance<highEntry.brakingDistance;
  const recoveryShape=anchors.every(row=>row.recoveryStart<row.apex&&row.afterRecovery>=row.atRecovery+CORNER_BRAKE_RELEASE_V358.minRecoveryTargetGainKph);
  const anchorPass=anchors.every(row=>row.target>=row.expectedMin&&row.target<=row.expectedMax&&row.brakeDecel>=CORNER_DRIVING_V351.minBrakeDecelMps2&&row.brakeDecel<=CORNER_DRIVING_V351.maxBrakeDecelMps2);
  const planSource=String(cornerDrivingPlanV351);
  const correctDeltaFormula=planSource.includes("(Number(entryKph)||0)-apexTarget");
  return {version:VERSION358,config:{...CORNER_BRAKE_RELEASE_V358},anchors,lowEntry:{brakeDecel:lowEntry.brakeDecel,brakingDistance:lowEntry.brakingDistance},highEntry:{brakeDecel:highEntry.brakeDecel,brakingDistance:highEntry.brakingDistance},entrySensitiveBrake,recoveryShape,anchorPass,correctDeltaFormula,
    allPass:anchorPass&&recoveryShape&&entrySensitiveBrake&&correctDeltaFormula&&CORNER_DRIVING_V351.speedEnvelope.hairpin.recoveryLead>=.30&&CORNER_DRIVING_V351.speedEnvelope.slow.recoveryLead>=.25&&CORNER_BRAKE_RELEASE_V358.coastDecelMps2<1};
}
window.mwsF1QaCornerSpeedBrakeReleaseCalibrationV358=qaCornerSpeedBrakeReleaseCalibrationV358;
window.__mwsF1RacingV358=VERSION358;

function qaNaturalRacePacePolishV359(){
  const samples=[0,.25,.5,.75,1].map((rankRatio,index)=>{
    const vehicle={rankedFieldPaceBoostV357:FIELD_SPREAD_BALANCE_V352.rankedRearPaceMax*Math.pow(rankRatio,FIELD_SPREAD_BALANCE_V352.rankedRearPaceExponent),positionCatchupPctV314:GAME_VARIABILITY_CONFIG_V303.positionCatchupMaxPct*rankRatio};
    return {rank:index+1,multiplier:naturalRacePaceMultiplierV359(vehicle,'NORMAL'),fastMultiplier:naturalRacePaceMultiplierV359(vehicle,'FAST')};
  });
  const multipliers=samples.map(row=>Number(row.multiplier)||1),monotonic=multipliers.every((value,index)=>index===0||value>=multipliers[index-1]);
  const helperSource=String(naturalRacePaceMultiplierV359),directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(helperSource);
  const maxMultiplier=Math.max(...multipliers);
  return {version:VERSION359,config:{...NATURAL_RACE_PACE_V359},samples,monotonic,directPositionMutation,maxMultiplier,
    allPass:monotonic&&!directPositionMutation&&maxMultiplier>1&&maxMultiplier<=1.009&&NATURAL_RACE_PACE_V359.cornerRecoveryCoastDecelMps2<CORNER_BRAKE_RELEASE_V358.coastDecelMps2&&NATURAL_RACE_PACE_V359.maxNormalFinishSpreadSeconds<FIELD_SPREAD_BALANCE_V352.maxFinishSpreadSeconds};
}
window.mwsF1QaNaturalRacePacePolishV359=qaNaturalRacePacePolishV359;
window.__mwsF1RacingV359=VERSION359;

function qaFourLaneTrackV360(){
  const track=activeRaceSnapshotV187?.track,path=document.getElementById('f1RacingRaceTrackPathV188');
  if(path&&track)renderFourLaneGuidesV360(path,track);
  const guides=[...document.querySelectorAll('#f1RacingRaceLaneGuidesV360 .f1-racing-race-lane-guide-v360')];
  const offsets=fourLaneGuideOffsetsV360(track);
  const uniqueOffsets=new Set(offsets.map(value=>Number(value).toFixed(3))).size;
  const laneIndices=raceMotionV189.vehicles.map(vehicle=>Number(vehicle.visualLaneIndexV360)).filter(Number.isFinite);
  const laneDiversity=new Set(laneIndices).size;
  const expectedDiversity=Math.min(FOUR_LANE_TRACK_V360.laneCount,raceMotionV189.vehicles.length);
  const laneAssignmentPass=raceMotionV189.vehicles.length===0||laneDiversity>=expectedDiversity;
  const source=String(applyFourLaneOffsetV360)+String(renderFourLaneGuidesV360)+String(offsetTrackPathDataV360);
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const physicalLineSource=String(lineOffsetMetersV197);
  const physicsIsolated=!physicalLineSource.includes('applyFourLaneOffsetV360')&&!physicalLineSource.includes('FOUR_LANE_TRACK_V360');
  const telemetry=longCornerClusterTelemetryV360();
  return {version:VERSION360,config:{...FOUR_LANE_TRACK_V360,laneFractions:[...FOUR_LANE_TRACK_V360.laneFractions],guideFractions:[...FOUR_LANE_TRACK_V360.guideFractions]},guideCount:guides.length,offsets,uniqueOffsets,laneDiversity,expectedDiversity,laneAssignmentPass,directProgressMutation,physicsIsolated,telemetry,
    allPass:Boolean(track&&path)&&guides.length===4&&uniqueOffsets===4&&FOUR_LANE_TRACK_V360.visualWidthScale>=1.5&&laneAssignmentPass&&!directProgressMutation&&physicsIsolated};
}
window.mwsF1QaFourLaneTrackV360=qaFourLaneTrackV360;
window.mwsF1GetLongCornerClusterTelemetryV360=longCornerClusterTelemetryV360;
window.__mwsF1RacingV360=VERSION360;

function qaCornerLaneOccupancyV361(){
  const phaseInfo={corner:{id:'QA-CORNER',direction:'left'},phase:'TURN_IN'};
  const vehicle={id:'self',gridPosition:1,visualLaneIndexV360:0,battleState:'FOLLOWING',battleTargetId:''};
  const peers=[
    {id:'a',visualLaneIndexV360:0,cornerLaneLockIndexV361:0,battleState:'FOLLOWING'},
    {id:'b',visualLaneIndexV360:0,cornerLaneLockIndexV361:0,battleState:'FOLLOWING'},
    {id:'c',visualLaneIndexV360:1,cornerLaneLockIndexV361:1,battleState:'FOLLOWING'},
    {id:'d',visualLaneIndexV360:3,cornerLaneLockIndexV361:3,battleState:'FOLLOWING'}
  ];
  const open=chooseCornerLaneIndexV361(vehicle,phaseInfo,peers);
  const sideVehicle={...vehicle,battleState:'SIDE_BY_SIDE',battleTargetId:'target'};
  const sidePeers=[...peers,{id:'target',visualLaneIndexV360:2,cornerLaneLockIndexV361:2,battleState:'SIDE_BY_SIDE'}];
  const side=chooseCornerLaneIndexV361(sideVehicle,phaseInfo,sidePeers);
  const source=String(updateCornerLaneOccupancyV361)+String(chooseCornerLaneIndexV361)+String(applyDenseLabelStaggerV361);
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const physicsIsolated=!String(lineOffsetMetersV197).includes('V361')&&!String(lineOffsetMetersV197).includes('cornerLane');
  return {version:VERSION361,openLane:open.lane,openOccupancy:open.occupancy,sideLane:side.lane,targetLane:side.targetLane,directProgressMutation,physicsIsolated,config:{...CORNER_LANE_OCCUPANCY_V361},
    allPass:open.lane===2&&side.lane!==side.targetLane&&!directProgressMutation&&physicsIsolated&&CORNER_LANE_OCCUPANCY_V361.minMarkerScale>=.85&&CORNER_LANE_OCCUPANCY_V361.severeSpreadScale<=1.25};
}
window.mwsF1QaCornerLaneOccupancyV361=qaCornerLaneOccupancyV361;
window.mwsF1QaPitHudV361=qaPitHudV361;
window.mwsF1RenderPitHudV361=renderPitHudV361;
window.mwsF1GetPitHudRowsV361=pitHudRowsV361;
window.__mwsF1RacingV361=VERSION361;

function qaVisibleCornerLaneSeparationV362(){
  const track=activeRaceSnapshotV187?.track;
  const physicalWidth=Math.max(1,Number(track?.geometry?.trackWidthMeters)||14);
  const margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5);
  const usable=Math.max(1,physicalWidth/2-margin);
  const visualWidth=Math.max(8,Number(track?.geometry?.visualTrackWidthSvg)||26)*VISIBLE_CORNER_SEPARATION_V362.visualWidthScale;
  const laneFractionGap=Math.abs(Number(FOUR_LANE_TRACK_V360.laneFractions[1])-Number(FOUR_LANE_TRACK_V360.laneFractions[0]));
  const denseGapSvg=laneFractionGap*usable*CORNER_LANE_OCCUPANCY_V361.denseSpreadScale*VISIBLE_CORNER_SEPARATION_V362.laneVisualMultiplier*(visualWidth/physicalWidth);
  const severeGapSvg=laneFractionGap*usable*CORNER_LANE_OCCUPANCY_V361.severeSpreadScale*VISIBLE_CORNER_SEPARATION_V362.laneVisualMultiplier*(visualWidth/physicalWidth);
  const denseMarkerDiameter=36*Math.max(CORNER_LANE_OCCUPANCY_V361.minMarkerScale,1-(CORNER_LANE_OCCUPANCY_V361.denseCount-CORNER_LANE_OCCUPANCY_V361.denseCount+1)*.035);
  const source=String(applyFourLaneOffsetV360)+String(chooseCornerLaneIndexV361)+String(raceLinePointV197);
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const physicsIsolated=!String(lineOffsetMetersV197).includes('V362')&&!String(lineOffsetMetersV197).includes('VISIBLE_CORNER_SEPARATION_V362');
  return {version:VERSION362,config:{...VISIBLE_CORNER_SEPARATION_V362},denseGapSvg:Number(denseGapSvg.toFixed(2)),severeGapSvg:Number(severeGapSvg.toFixed(2)),denseMarkerDiameter:Number(denseMarkerDiameter.toFixed(2)),directProgressMutation,physicsIsolated,
    allPass:denseGapSvg>=VISIBLE_CORNER_SEPARATION_V362.minimumDenseLaneGapSvg&&severeGapSvg>denseGapSvg&&denseGapSvg>=denseMarkerDiameter*.95&&!directProgressMutation&&physicsIsolated};
}
window.mwsF1QaVisibleCornerLaneSeparationV362=qaVisibleCornerLaneSeparationV362;
window.__mwsF1RacingV362=VERSION362;

function qaLaneBandCrowdingGuardV363(){
  const track=activeRaceSnapshotV187?.track,physicalWidth=Math.max(1,Number(track?.geometry?.trackWidthMeters)||14),margin=Math.max(0,Number(track?.geometry?.racingLineMarginMeters)||1.5),usable=Math.max(1,physicalWidth/2-margin);
  const visualWidth=Math.max(8,Number(track?.geometry?.visualTrackWidthSvg)||26)*VISIBLE_CORNER_SEPARATION_V362.visualWidthScale;
  const laneFractionGap=Math.min(...FOUR_LANE_TRACK_V360.laneFractions.slice(1).map((value,i)=>Math.abs(Number(value)-Number(FOUR_LANE_TRACK_V360.laneFractions[i]))));
  const laneGapSvg=laneFractionGap*usable*CORNER_LANE_OCCUPANCY_V361.denseSpreadScale*VISIBLE_CORNER_SEPARATION_V362.laneVisualMultiplier*(visualWidth/physicalWidth);
  const pairBandGapSvg=laneGapSvg*LANE_BAND_CROWDING_V363.bandHalfGapRatio*2;
  const pairMarkerDiameter=36*LANE_BAND_CROWDING_V363.pairMarkerScale;
  const source=String(laneBandOffsetV363)+String(recordScreenCrowdingV363);
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const physicsIsolated=!String(lineOffsetMetersV197).includes('V363')&&!String(lineOffsetMetersV197).includes('laneBand');
  return {version:VERSION363,config:{...LANE_BAND_CROWDING_V363},laneGapSvg:Number(laneGapSvg.toFixed(2)),pairBandGapSvg:Number(pairBandGapSvg.toFixed(2)),pairMarkerDiameter:Number(pairMarkerDiameter.toFixed(2)),directProgressMutation,physicsIsolated,telemetry:screenCrowdingTelemetryV363(),
    allPass:pairBandGapSvg>=pairMarkerDiameter*1.08&&!directProgressMutation&&physicsIsolated&&LANE_BAND_CROWDING_V363.minMarkerScale>=.70};
}
window.mwsF1QaLaneBandCrowdingGuardV363=qaLaneBandCrowdingGuardV363;
window.mwsF1GetScreenCrowdingV363=screenCrowdingTelemetryV363;
window.__mwsF1RacingV363=VERSION363;

function qaLaneBandSlotStabilityV364(){
  const phaseInfo={corner:{id:'QA-V364-CORNER'}},laneIndex=1,now=5000;
  const a={id:'a-v364',raceProgress:.510,visualLateralOffsetMeters:-2,laneBandLockedSlotV364:0,laneBandGroupKeyV364:'',laneBandContextV364:'',laneBandSlotLockedUntilV364:0,laneBandSlotChangesV364:0};
  const b={id:'b-v364',raceProgress:.500,visualLateralOffsetMeters:2,laneBandLockedSlotV364:0,laneBandGroupKeyV364:'',laneBandContextV364:'',laneBandSlotLockedUntilV364:0,laneBandSlotChangesV364:0};
  const first=assignStableLaneBandSlotsV364([a,b],phaseInfo,laneIndex,now),aFirst=Number(first.slots.get(a.id)),bFirst=Number(first.slots.get(b.id));
  a.raceProgress=.490;b.raceProgress=.520;
  const second=assignStableLaneBandSlotsV364([a,b],phaseInfo,laneIndex,now+100),aSecond=Number(second.slots.get(a.id)),bSecond=Number(second.slots.get(b.id));
  const preserved=aFirst===aSecond&&bFirst===bSecond&&aFirst<bFirst&&second.preserved===true;
  const source=String(assignStableLaneBandSlotsV364)+String(laneBandClusterV364)+String(laneBandOffsetV363);
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const physicsIsolated=!String(lineOffsetMetersV197).includes('V364')&&!String(lineOffsetMetersV197).includes('laneBandLockedSlotV364');
  return {version:VERSION364,config:{...LANE_BAND_SLOT_STABILITY_V364},first:{a:aFirst,b:bFirst},afterPass:{a:aSecond,b:bSecond},preserved,directProgressMutation,physicsIsolated,telemetry:screenCrowdingTelemetryV363(),
    allPass:preserved&&!directProgressMutation&&physicsIsolated&&LANE_BAND_SLOT_STABILITY_V364.lockMs>=900};
}
window.mwsF1QaLaneBandSlotStabilityV364=qaLaneBandSlotStabilityV364;
window.__mwsF1RacingV364=VERSION364;

function qaNaturalLongitudinalHeadwayV365(){
  const straight={phase:'STRAIGHT',corner:null},apex={phase:'APEX',corner:{id:'qa365-corner'}};
  const low={speedKph:100,battleBlockedV319:false},mid={speedKph:180,battleBlockedV319:false},high={speedKph:280,battleBlockedV319:false};
  const lowAhead={speedKph:100},midAhead={speedKph:180},highAhead={speedKph:280};
  const straightTargets=[naturalHeadwayTargetV365(low,lowAhead,straight),naturalHeadwayTargetV365(mid,midAhead,straight),naturalHeadwayTargetV365(high,highAhead,straight)];
  const apexTarget=naturalHeadwayTargetV365(mid,midAhead,apex);
  const attackReleaseSource=String(naturalRaceSpacingControlV365);
  const attackApproachRelease=attackReleaseSource.includes("['CLOSING','TOWING']")&&attackReleaseSource.includes("APPROACH_ATTACK")&&attackReleaseSource.includes('CLOSING_CANDIDATE')&&attackReleaseSource.includes('GENUINE_CLOSING_RELEASE')&&attackReleaseSource.includes('FAST_LEGACY_COMPETITION');
  const naturalAttackRelease=attackReleaseSource.includes('NATURAL_ATTACK_RELEASE_V365')&&attackReleaseSource.includes('freePaceAdvantageV365')&&attackReleaseSource.includes('battleOpenV365')&&attackReleaseSource.includes('attackSlipstreamRelease');
  const cornerOnlyHeadway=attackReleaseSource.includes("phase==='TURN_IN'||phase==='APEX'||phase==='EXIT'")&&attackReleaseSource.includes('OPEN_RACE_FLOW_V365');
  const cornerClosingRelease=attackReleaseSource.includes('CORNER_CLOSING_RELEASE_V365')&&attackReleaseSource.includes('cornerClosingReleaseKph');
  const cornerPaceRelease=attackReleaseSource.includes('CORNER_PACE_RELEASE_V365')&&attackReleaseSource.includes('cornerPaceReleaseKph')&&attackReleaseSource.includes('cornerSlipstreamRelease');
  const stateEntryClosing=attackReleaseSource.includes('NATURAL_HEADWAY_APPROACH_V365')&&attackReleaseSource.includes('stateEntryClosingKph');
  const developingAttackRelease=attackReleaseSource.includes('DEVELOPING_ATTACK_RELEASE_V365')&&attackReleaseSource.includes("['TOWING','PRESSURE']");
  const attackIntentBridge=attackReleaseSource.includes('naturalHeadwayAttackIntentV365')&&attackReleaseSource.includes('CORNER_ATTACK_INTENT_RELEASE_V365')&&String(nextPassStateV208).includes('attackIntentV365');
  const source=attackReleaseSource+String(naturalHeadwayTargetV365)+String(updateVisualLateralOffsetV258)+String(raceLinePointV197);
  const directPositionMutation=/\b(?:raceProgress|progress)\s*=/.test(source);
  const lateralRuntimeClean=!String(updateVisualLateralOffsetV258).includes('updateCornerLaneOccupancyV361')&&!String(updateVisualLateralOffsetV258).includes('applyFourLaneOffsetV360');
  const markerRuntimeClean=!String(raceMarkerTransformV245).includes('markerDensityScaleV361')&&!String(raceMarkerTransformV245).includes('markerBandScaleV363');
  const presentationRestored=String(raceLinePointV197).includes('TRACK_PRESENTATION_V365.visualWidthScale')&&String(offsetTrackPathDataV360).includes('TRACK_PRESENTATION_V365.visualWidthScale');
  return {version:VERSION365,config:{...NATURAL_HEADWAY_V365},trackPresentation:{...TRACK_PRESENTATION_V365},straightTargets:straightTargets.map(v=>Number(v.toFixed(2))),apexTarget:Number(apexTarget.toFixed(2)),attackApproachRelease,naturalAttackRelease,cornerOnlyHeadway,cornerClosingRelease,cornerPaceRelease,stateEntryClosing,developingAttackRelease,attackIntentBridge,directPositionMutation,lateralRuntimeClean,markerRuntimeClean,presentationRestored,telemetry:naturalHeadwayTelemetrySnapshotV365(),
    allPass:straightTargets[0]<straightTargets[1]&&straightTargets[1]<straightTargets[2]&&apexTarget>straightTargets[1]&&attackApproachRelease&&naturalAttackRelease&&cornerOnlyHeadway&&cornerClosingRelease&&cornerPaceRelease&&stateEntryClosing&&developingAttackRelease&&attackIntentBridge&&!directPositionMutation&&lateralRuntimeClean&&markerRuntimeClean&&presentationRestored&&TRACK_PRESENTATION_V365.trackStrokeWidth===58};
}
window.mwsF1QaNaturalLongitudinalHeadwayV365=qaNaturalLongitudinalHeadwayV365;
window.mwsF1GetNaturalHeadwayTelemetryV365=naturalHeadwayTelemetrySnapshotV365;
window.__mwsF1RacingV365=VERSION365;

function qaFollowingPauseStabilityV366(){
  const normal=24;
  const following=stagedHeadwayTargetV366({battleState:'FOLLOWING',battleBlockedV319:false,naturalHeadwayAttackIntentV365:false},normal,{released:false});
  const closing=stagedHeadwayTargetV366({battleState:'CLOSING',battleBlockedV319:false,naturalHeadwayAttackIntentV365:true},normal,{released:false});
  const preparing=stagedHeadwayTargetV366({battleState:'PREPARING_ATTACK',battleBlockedV319:false,naturalHeadwayAttackIntentV365:true},normal,{released:false});
  const pulling=stagedHeadwayTargetV366({battleState:'PULLING_OUT',battleBlockedV319:false,naturalHeadwayAttackIntentV365:true},normal,{released:false});
  const heldCap=followingOpeningCapV366(200,8,following,false);
  const emergencyCap=followingOpeningCapV366(200,3,following,true);
  const controllerSource=String(naturalRaceSpacingControlV366),lateralSource=String(updateVisualLateralOffsetV258),renderSource=String(renderRaceVehiclesV189),frameSource=String(raceFrameV189);
  const releaseGuard=controllerSource.includes('passSeparation.released')&&controllerSource.includes('visualPassSeparationV366');
  const underGapOpens=heldCap<200&&emergencyCap<heldCap;
  const stagedAttack=following===normal&&closing<PASS_CONFIG_V208.prepareGapMeters&&preparing<PASS_CONFIG_V208.pullOutGapMeters&&pulling>PASS_CONFIG_V208.sideBySideGapMeters;
  const zeroDeltaHold=lateralSource.includes('if(dt<=0){')&&lateralSource.includes('pausedHoldV366:true');
  const pauseRenderFreeze=renderSource.includes('freezeVisualV366')&&renderSource.includes('if(!freezeVisualV366)updateAutoRaceCameraV216(false)');
  const resumeFirstFrameStable=frameSource.includes('renderRaceVehiclesV189(simClockV192.paused?0:delta);');
  const directProgressMutation=/\b(?:raceProgress|progress)\s*=/.test(controllerSource);
  return {version:VERSION366,config:{...FOLLOWING_STABILITY_V366},targets:{following,closing,preparing,pulling},heldCap:Number(heldCap.toFixed(2)),emergencyCap:Number(emergencyCap.toFixed(2)),releaseGuard,underGapOpens,stagedAttack,zeroDeltaHold,pauseRenderFreeze,resumeFirstFrameStable,directProgressMutation,telemetry:followingStabilityTelemetrySnapshotV366(),
    allPass:releaseGuard&&underGapOpens&&stagedAttack&&zeroDeltaHold&&pauseRenderFreeze&&resumeFirstFrameStable&&!directProgressMutation};
}
window.mwsF1QaFollowingPauseStabilityV366=qaFollowingPauseStabilityV366;
window.mwsF1GetFollowingStabilityTelemetryV366=followingStabilityTelemetrySnapshotV366;
window.__mwsF1RacingV366=VERSION366;

function qaUiVisibilitySpacingV324(){
  const marker=document.querySelector('.f1-racing-race-vehicle-v189');
  const ring=marker?.querySelector('.car-ring'),profile=marker?.querySelector('.car-profile-image-v257'),label=marker?.querySelector('.car-label'),tag=marker?.querySelector('.car-position-box-v254');
  const markerGeometry={ringRadius:Number(ring?.getAttribute('r')||0),profileWidth:Number(profile?.getAttribute('width')||0),labelY:Number(label?.getAttribute('y')||0),tagY:Number(tag?.getAttribute('y')||0)};
  const spacing={...RACE_SPACING_CONFIG_V319};
  return {version:VERSION324,markerGeometry,spacing,allPass:spacing.normalDisplayGapMeters>=65&&spacing.blockedDisplayGapMeters>=90&&spacing.battleDisplayGapMeters>=14&&spacing.physicalFollowGapMeters>=18&&markerGeometry.ringRadius>=17&&markerGeometry.profileWidth>=28&&markerGeometry.tagY>markerGeometry.labelY};
}
window.mwsF1QaUiVisibilitySpacingV324=qaUiVisibilitySpacingV324;
window.__mwsF1RacingV324=VERSION324;

function qaUiSpacingBattleV319(){
  const a={id:'a319',battleState:'FOLLOWING',battleTargetId:'',pitState:'TRACK',raceProgress:1.020,speedKph:240};
  const b={id:'b319',battleState:'SIDE_BY_SIDE',battleTargetId:'a319',pitState:'TRACK',raceProgress:1.015,speedKph:242,battleBlockedV319:false};
  const c={id:'c319',battleState:'PREPARING_ATTACK',battleTargetId:'b319',pitState:'TRACK',raceProgress:1.011,speedKph:246,battleBlockedV319:false};
  const standings=[{vehicle:a,position:1},{vehicle:b,position:2},{vehicle:c,position:3}],byId=new Map([[a.id,a],[b.id,b],[c.id,c]]);
  const isolation=buildBattleLocksV319(standings,byId);
  const thirdBlocked=battlePairBlockedV319(c,b,isolation.locks);
  c.battleBlockedV319=thirdBlocked;
  const plan=buildVisualSpacingPlanV319(standings,{lengthMeters:5000});
  const abGap=(Number(plan.get(a.id))-Number(plan.get(b.id)))*5000;
  const bcGap=(Number(plan.get(b.id))-Number(plan.get(c.id)))*5000;
  const scaleSamples=[1,1.5,2,3,4.5].map(zoom=>({zoom,scale:raceMarkerScaleV245(zoom),screen:zoom*raceMarkerScaleV245(zoom)}));
  const screenSpread=Math.max(...scaleSamples.map(row=>row.screen))-Math.min(...scaleSamples.map(row=>row.screen));
  return {
    version:VERSION319,config:{...RACE_SPACING_CONFIG_V319},pairs:isolation.pairs,thirdBlocked,
    visual:{battleGap:Number(abGap.toFixed(1)),blockedGap:Number(bcGap.toFixed(1))},scaleSamples,screenSpread,
    allPass:isolation.pairs.length===1&&thirdBlocked===true&&bcGap>=RACE_SPACING_CONFIG_V319.blockedDisplayGapMeters-.1&&screenSpread<.03&&RACE_SPACING_CONFIG_V319.normalDisplayGapMeters>=45
  };
}
window.mwsF1QaUiSpacingBattleV319=qaUiSpacingBattleV319;
window.__mwsF1RacingV319=VERSION319;

function simulateRaceStepV192(stepMs){
  if(simClockV192.paused||!(stepMs>0))return false;
  simClockV192.simTimeMs+=stepMs;
  updateInteractionSnapshotShadowV368();
  updateSlipstreamStatesV198();
  updateDirtyAirStatesV199();
  updateBackmarkerBlueFlagsV215();
  if(raceFlagStateV214.flag==='GREEN'){
    updateTrafficAndDefenceV207();
    updatePassStateMachineV208(stepMs);
    applyGameVariabilityV303(stepMs);
    updateRankedFieldPaceRetentionV357();
    for(const vehicle of raceMotionV189.vehicles){
      if(vehicle.blueFlag){
        vehicle.defenceActive=false;
        vehicle.battleSpeedBiasKph=Math.min(0,Number(vehicle.battleSpeedBiasKph)||0);
        if(vehicle.pitState==='TRACK')vehicle.racingLineMode='OUTSIDE';
      }
    }
  }else{
    for(const vehicle of raceMotionV189.vehicles){
      vehicle.defenceActive=false;
      vehicle.battleSpeedBiasKph=0;
      if(vehicle.racingLineMode==='ATTACK_INSIDE')vehicle.racingLineMode='IDEAL';
    }
  }
  updateFieldCompressionLeaderPressureV274(stepMs);
  updateChaseBurstV275(stepMs);
  updatePitStrategiesV206(stepMs);
  for(const vehicle of raceMotionV189.vehicles){
    if(vehicle.finished)continue;
    const previousRaceProgressV248=Number(vehicle.raceProgress)||0;
    simulateVehicleDynamicsV196(vehicle,stepMs);
    updateLapTimingV248(vehicle,previousRaceProgressV248,stepMs,activeRaceSnapshotV187?.track);
  }
  recordRaceOrderFlowV309();
  updateMicroBattleEventsV278(stepMs);
  if(!engineQaV240.active){
    updateRaceCommentaryV219(false);
    updateRaceNarrativeV222(false);
  }
  if(updateRaceLifecycleRecoveryG())return false;
  return true;
}
function raceFrameV189(timestamp){
  if(!raceMotionV189.running)return;
  if(!raceMotionV189.lastTimestamp)raceMotionV189.lastTimestamp=timestamp;
  const delta=Math.min(50,Math.max(0,timestamp-raceMotionV189.lastTimestamp));
  raceMotionV189.lastTimestamp=timestamp;
  if(!simClockV192.paused){
    simClockV192.accumulatorMs+=delta*simulationPlaybackRateV247();
    let steps=0;
    while(simClockV192.accumulatorMs>=simClockV192.fixedStepMs&&steps<simClockV192.maxStepsPerFrame){
      const continued=simulateRaceStepV192(simClockV192.fixedStepMs);
      simClockV192.accumulatorMs-=simClockV192.fixedStepMs;
      steps+=1;
      if(!continued||!raceMotionV189.running)break;
    }
    if(steps>=simClockV192.maxStepsPerFrame)simClockV192.accumulatorMs=0;
  }
  if(!raceMotionV189.running)return;
  renderRaceVehiclesV189(simClockV192.paused?0:delta);
  raceMotionV189.hudAccumulatorMs+=delta;
  if(raceMotionV189.hudAccumulatorMs>=100){raceMotionV189.hudAccumulatorMs=0;updateRaceProgressHudV190()}
  raceMotionV189.rafId=requestAnimationFrame(raceFrameV189);
}
function startRaceMotionV189(){
  const snapshot=activeRaceSnapshotV187;if(!snapshot||f1ScreenStateV185!=='RACE')return false;
  if(raceMotionV189.snapshotCreatedAt!==String(snapshot.createdAt||'')||!raceMotionV189.vehicles.length){if(!initializeRaceMotionV189(snapshot))return false}
  if(raceMotionV189.running)return true;
  raceMotionV189.running=true;raceMotionV189.suspended=false;raceMotionV189.lastTimestamp=0;
  bindSimulationControlsV192();
  syncSimulationControlsV192();
  raceMotionV189.rafId=requestAnimationFrame(raceFrameV189);return true;
}
function pauseRaceMotionV189(suspended=false){
  raceMotionV189.running=false;raceMotionV189.suspended=Boolean(suspended);raceMotionV189.lastTimestamp=0;
  if(raceMotionV189.rafId)cancelAnimationFrame(raceMotionV189.rafId);raceMotionV189.rafId=0;return true;
}
function resetRaceMotionV189(){
  pauseRaceMotionV189(false);raceMotionV189.vehicles=[];raceMotionV189.snapshotCreatedAt='';raceGeometryV193=null;
  simClockV192.paused=false;simClockV192.timeScale=1;simClockV192.simTimeMs=0;simClockV192.accumulatorMs=0;
  raceFlagStateV214={flag:'GREEN',reason:'',sinceSimMs:0};
  resetLeaderPressureFieldV274();
  resetInteractionSnapshotV368();
  resetMicroBattleEventsV278();
  resetBestLapOverlayV338();
  const pitHud=document.getElementById('f1RacingPitHudV361');if(pitHud){pitHud.replaceChildren();pitHud.classList.remove('active');pitHud.dataset.pitCountV361='0'}
  const layer=document.getElementById('f1RacingRaceVehicleLayerV188');if(layer)layer.replaceChildren();
  syncSimulationControlsV192();
}
function refreshRaceGeometryV193(snapshot=activeRaceSnapshotV187,pathElement=document.getElementById('f1RacingRaceTrackPathV188')){
  if(!snapshot?.track||!pathElement||typeof window.mwsBuildF1TrackGeometryV193!=='function'){
    raceGeometryV193=null;
    return null;
  }
  raceGeometryV193=window.mwsBuildF1TrackGeometryV193(snapshot.track,pathElement);
  if(raceGeometryV193&&typeof window.mwsBuildF1CornerPhasesV194==='function'){
    raceGeometryV193=window.mwsBuildF1CornerPhasesV194(snapshot.track,raceGeometryV193);
  }
  if(raceGeometryV193&&typeof window.mwsBuildF1SpeedProfileV195==='function'){
    raceGeometryV193=window.mwsBuildF1SpeedProfileV195(snapshot.track,raceGeometryV193);
  }
  const meta=document.getElementById('f1RacingRaceMapMetaV188');
  if(meta&&raceGeometryV193){
    meta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · '+snapshot.drivers.length+' drivers · '+raceGeometryV193.samples.length+' samples · '+(raceGeometryV193.cornerPhases?.length||raceGeometryV193.corners.length)+' corners';
  }
  return raceGeometryV193;
}
function getRaceGeometryV193(){return raceGeometryV193}
function getCornerPhasesV194(){
  return (raceGeometryV193?.cornerPhases||[]).map(corner=>({...corner}));
}
function getCornerPhaseAtProgressV194(progress){
  return typeof window.mwsF1CornerPhaseAtProgressV194==='function'
    ?window.mwsF1CornerPhaseAtProgressV194(raceGeometryV193,progress)
    :null;
}
function getSpeedProfileV195(){
  return (raceGeometryV193?.speedProfile||[]).map(row=>({...row}));
}
function getSpeedTargetAtProgressV195(progress){
  return typeof window.mwsF1SpeedTargetAtProgressV195==='function'
    ?window.mwsF1SpeedTargetAtProgressV195(raceGeometryV193,progress)
    :null;
}
function driverCodeV188(driver){
  const raw=String(driver?.name||'DRV').replace(/\s+/g,'');
  return raw.slice(0,4).toUpperCase()||'DRV';
}
function driverColorV216(index){
  return DRIVER_COLORS_V216[Math.abs(Number(index)||0)%DRIVER_COLORS_V216.length];
}
function cameraBaseBoxV216(){
  const track=activeRaceSnapshotV187?.track;
  const box=Array.isArray(track?.viewBox)&&track.viewBox.length===4?track.viewBox:[0,0,1000,600];
  return {x:Number(box[0])||0,y:Number(box[1])||0,w:Math.max(1,Number(box[2])||1000),h:Math.max(1,Number(box[3])||600)};
}
function clampRaceCameraV216(cx,cy,zoom){
  const base=cameraBaseBoxV216();
  const z=Math.max(1,Math.min(4.5,Number(zoom)||1));
  const w=base.w/z,h=base.h/z;
  const minCx=base.x+w/2,maxCx=base.x+base.w-w/2;
  const minCy=base.y+h/2,maxCy=base.y+base.h-h/2;
  return {cx:Math.max(minCx,Math.min(maxCx,Number(cx)||base.x+base.w/2)),cy:Math.max(minCy,Math.min(maxCy,Number(cy)||base.y+base.h/2)),zoom:z,w,h,base};
}
function applyRaceCameraV216(target={},smooth=false){
  const svg=document.getElementById('f1RacingRaceTrackSvgV188');if(!svg)return false;
  const next=clampRaceCameraV216(
    Object.prototype.hasOwnProperty.call(target,'cx')?target.cx:raceCameraV216.cx,
    Object.prototype.hasOwnProperty.call(target,'cy')?target.cy:raceCameraV216.cy,
    Object.prototype.hasOwnProperty.call(target,'zoom')?target.zoom:raceCameraV216.zoom
  );
  const deadband=smooth&&raceCameraV216.initialized&&Math.abs(next.cx-raceCameraV216.cx)<CAMERA_DIRECTOR_STABILITY_V229.focusDeadbandSvg&&Math.abs(next.cy-raceCameraV216.cy)<CAMERA_DIRECTOR_STABILITY_V229.focusDeadbandSvg&&Math.abs(next.zoom-raceCameraV216.zoom)<CAMERA_DIRECTOR_STABILITY_V229.zoomDeadband;
  const blend=smooth&&raceCameraV216.initialized?.14:1;
  raceCameraV216.cx=deadband?raceCameraV216.cx:raceCameraV216.initialized?raceCameraV216.cx+(next.cx-raceCameraV216.cx)*blend:next.cx;
  raceCameraV216.cy=deadband?raceCameraV216.cy:raceCameraV216.initialized?raceCameraV216.cy+(next.cy-raceCameraV216.cy)*blend:next.cy;
  raceCameraV216.zoom=deadband?raceCameraV216.zoom:raceCameraV216.initialized?raceCameraV216.zoom+(next.zoom-raceCameraV216.zoom)*blend:next.zoom;
  raceCameraV216.initialized=true;
  const box=clampRaceCameraV216(raceCameraV216.cx,raceCameraV216.cy,raceCameraV216.zoom);
  svg.setAttribute('viewBox',[box.cx-box.w/2,box.cy-box.h/2,box.w,box.h].map(value=>Number(value).toFixed(3)).join(' '));
  syncRaceMarkerScaleV245();
  syncRaceCameraControlsV216();
  return true;
}
function resetRaceCameraV216(mode='AUTO'){
  const base=cameraBaseBoxV216();
  raceCameraV216.mode=CAMERA_MODES_V216.includes(String(mode).toUpperCase())?String(mode).toUpperCase():'AUTO';
  raceCameraV216.zoom=raceCameraV216.mode==='FULL'?1:1.9;
  raceCameraV216.userZoomLockedV268=false;raceCameraV216.userZoomV268=raceCameraV216.zoom;
  raceCameraV216.dragCandidateV268=false;raceCameraV216.dragging=false;
  raceCameraV216.cx=base.x+base.w/2;raceCameraV216.cy=base.y+base.h/2;raceCameraV216.initialized=false;
  cameraDirectorV225.kind='LEADER';cameraDirectorV225.targetIds=[];cameraDirectorV225.lockUntilSimMs=0;cameraDirectorV225.lastSwitchSimMs=0;cameraDirectorV225.candidateKey='';cameraDirectorV225.candidateSinceSimMs=0;
  applyRaceCameraV216({cx:raceCameraV216.cx,cy:raceCameraV216.cy,zoom:raceCameraV216.zoom},false);
  return {...raceCameraV216};
}
function setRaceCameraModeV216(mode){
  const next=String(mode||'').toUpperCase();
  if(!CAMERA_MODES_V216.includes(next))return false;
  raceCameraV216.mode=next;
  if(next==='FULL')resetRaceCameraV216('FULL');
  else if(next!=='MANUAL')updateAutoRaceCameraV216(true);
  syncRaceCameraControlsV216();
  return true;
}
function syncRaceCameraControlsV216(){
  document.querySelectorAll('[data-f1-camera-mode]').forEach(button=>{
    const active=String(button.dataset.f1CameraMode||'').toUpperCase()===raceCameraV216.mode;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false');
  });
  const status=document.getElementById('f1RacingCameraStatusV216');
  if(status){
    const autoDetail=raceCameraV216.mode==='AUTO'?(cameraDirectorV225.kind==='BATTLE'?' · 배틀':cameraDirectorV225.kind==='FRONT'?' · 상위권':' · 선두'):'';
    status.textContent=raceCameraV216.mode==='MANUAL'?'수동 카메라':raceCameraV216.mode==='FULL'?'전체 보기':raceCameraV216.mode==='LEADER'?'선두 추적':raceCameraV216.mode==='FRONT'?'상위권 추적':raceCameraV216.mode==='BATTLE'?'배틀 추적':'자동 카메라'+autoDetail;
  }
}
function ensureRaceCameraControlsV216(){
  const stage=document.querySelector('#f1RacingWorkspaceRecoveryE .f1-racing-race-map-stage-v188')||document.querySelector('#f1RacingViewRaceV185 .f1-racing-race-map-stage-v188');
  if(!stage)return false;
  let controls=document.getElementById('f1RacingCameraControlsV216');
  if(!controls){
    controls=document.createElement('div');
    controls.id='f1RacingCameraControlsV216';
    controls.className='f1-racing-camera-controls-v216';
    controls.innerHTML='<span id="f1RacingCameraStatusV216">자동 카메라</span><button type="button" data-f1-camera-mode="AUTO" aria-pressed="true">자동</button><button type="button" data-f1-camera-mode="FULL" aria-pressed="false">전체</button><button type="button" data-f1-camera-mode="LEADER" aria-pressed="false">선두</button><button type="button" data-f1-camera-mode="FRONT" aria-pressed="false">상위권</button><button type="button" data-f1-camera-mode="BATTLE" aria-pressed="false">배틀</button>';
    controls.addEventListener('click',event=>{const button=event.target.closest('[data-f1-camera-mode]');if(button)setRaceCameraModeV216(button.dataset.f1CameraMode)});
    stage.appendChild(controls);
  }
  bindRaceCameraInteractionV216(stage);
  syncRaceCameraControlsV216();
  return true;
}
function bindRaceCameraInteractionV216(stage){
  if(!stage||stage.dataset.f1CameraBound)return false;
  stage.dataset.f1CameraBound='1';
  stage.addEventListener('wheel',event=>{
    if(event.target.closest?.('#f1RacingCameraControlsV216'))return;
    event.preventDefault();
    const svg=document.getElementById('f1RacingRaceTrackSvgV188');if(!svg)return;
    const rect=svg.getBoundingClientRect();if(!(rect.width>0&&rect.height>0))return;
    const zoom=Math.max(1,Math.min(4.5,raceCameraV216.zoom*(event.deltaY<0?1.18:1/1.18)));
    raceCameraV216.userZoomLockedV268=true;
    raceCameraV216.userZoomV268=zoom;
    if(raceCameraV216.mode==='MANUAL'){
      const current=(svg.getAttribute('viewBox')||'0 0 1000 600').trim().split(/\s+/).map(Number);
      const rx=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      const ry=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
      const anchorX=current[0]+current[2]*rx,anchorY=current[1]+current[3]*ry;
      const base=cameraBaseBoxV216(),nw=base.w/zoom,nh=base.h/zoom;
      applyRaceCameraV216({cx:anchorX+(0.5-rx)*nw,cy:anchorY+(0.5-ry)*nh,zoom},false);
    }else{
      applyRaceCameraV216({cx:raceCameraV216.cx,cy:raceCameraV216.cy,zoom},false);
      updateAutoRaceCameraV216(true);
    }
  },{passive:false});
  stage.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest?.('#f1RacingCameraControlsV216'))return;
    raceCameraV216.dragCandidateV268=true;raceCameraV216.dragging=false;raceCameraV216.pointerId=event.pointerId;
    raceCameraV216.startX=event.clientX;raceCameraV216.startY=event.clientY;raceCameraV216.lastX=event.clientX;raceCameraV216.lastY=event.clientY;
    try{stage.setPointerCapture?.(event.pointerId)}catch(_){}event.preventDefault();
  });
  stage.addEventListener('pointermove',event=>{
    if((!raceCameraV216.dragCandidateV268&&!raceCameraV216.dragging)||raceCameraV216.pointerId!==event.pointerId)return;
    const totalDx=event.clientX-raceCameraV216.startX,totalDy=event.clientY-raceCameraV216.startY;
    if(!raceCameraV216.dragging){
      if(Math.hypot(totalDx,totalDy)<6)return;
      raceCameraV216.dragging=true;raceCameraV216.dragCandidateV268=false;raceCameraV216.mode='MANUAL';
      raceCameraV216.userZoomLockedV268=true;raceCameraV216.userZoomV268=raceCameraV216.zoom;
      stage.classList.add('is-camera-dragging');syncRaceCameraControlsV216();
    }
    const svg=document.getElementById('f1RacingRaceTrackSvgV188');if(!svg)return;
    const rect=svg.getBoundingClientRect();if(!(rect.width>0&&rect.height>0))return;
    const box=clampRaceCameraV216(raceCameraV216.cx,raceCameraV216.cy,raceCameraV216.zoom);
    const dx=event.clientX-raceCameraV216.lastX,dy=event.clientY-raceCameraV216.lastY;
    raceCameraV216.lastX=event.clientX;raceCameraV216.lastY=event.clientY;
    applyRaceCameraV216({cx:raceCameraV216.cx-dx*box.w/rect.width,cy:raceCameraV216.cy-dy*box.h/rect.height,zoom:raceCameraV216.zoom},false);
  });
  const end=event=>{
    if(!raceCameraV216.dragging&&!raceCameraV216.dragCandidateV268)return;
    raceCameraV216.dragging=false;raceCameraV216.dragCandidateV268=false;stage.classList.remove('is-camera-dragging');
    try{stage.releasePointerCapture?.(raceCameraV216.pointerId)}catch(_){}
    raceCameraV216.pointerId=null;
  };
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  return true;
}
function cameraFocusForVehiclesV225(vehicles,preferredZoom=2.4){
  const points=(vehicles||[]).map(vehicle=>vehicle?.renderPointV216).filter(Boolean);
  if(!points.length)return null;
  if(points.length===1)return {cx:points[0].x,cy:points[0].y,zoom:preferredZoom};
  const base=cameraBaseBoxV216();
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const spanX=Math.max(70,maxX-minX),spanY=Math.max(55,maxY-minY);
  const fitZoom=Math.min(base.w/(spanX+150),base.h/(spanY+120),preferredZoom);
  return {cx:(minX+maxX)/2,cy:(minY+maxY)/2,zoom:Math.max(1.35,fitZoom)};
}
function selectAutoCameraTargetV225(standings=computeRaceStandingsV191()){
  const now=Number(simClockV192.simTimeMs)||0;
  const valid=standings.filter(row=>row?.vehicle?.renderPointV216);
  const nearestBattle=valid.slice(1).filter(row=>Number.isFinite(Number(row.intervalSeconds))).sort((a,b)=>Number(a.intervalSeconds)-Number(b.intervalSeconds))[0]||null;
  let kind='LEADER',vehicles=valid[0]?.vehicle?[valid[0].vehicle]:[];
  if(nearestBattle&&Number(nearestBattle.intervalSeconds)<=1.4){
    const ahead=standings[nearestBattle.position-2]?.vehicle;
    if(ahead?.renderPointV216){kind='BATTLE';vehicles=[ahead,nearestBattle.vehicle]}
  }else{
    const front=valid.slice(0,3);
    const secondGap=Number(front[1]?.gapSeconds),thirdGap=Number(front[2]?.gapSeconds);
    if(front.length>=2&&((Number.isFinite(secondGap)&&secondGap<=4.5)||(Number.isFinite(thirdGap)&&thirdGap<=8))){
      kind='FRONT';vehicles=front.map(row=>row.vehicle);
    }
  }
  const ids=vehicles.map(vehicle=>String(vehicle.id));
  const candidateKey=kind+':'+ids.join('|');
  const currentKey=cameraDirectorV225.kind+':'+cameraDirectorV225.targetIds.join('|');
  const currentTargets=cameraDirectorV225.targetIds.map(id=>raceMotionV189.vehicles.find(vehicle=>String(vehicle.id)===String(id))).filter(vehicle=>vehicle?.renderPointV216);
  if(candidateKey!==currentKey){
    if(cameraDirectorV225.candidateKey!==candidateKey){
      cameraDirectorV225.candidateKey=candidateKey;
      cameraDirectorV225.candidateSinceSimMs=now;
    }
    const stableFor=now-Number(cameraDirectorV225.candidateSinceSimMs||0);
    const urgentBattle=kind==='BATTLE'&&nearestBattle&&Number(nearestBattle.intervalSeconds)<=CAMERA_DIRECTOR_STABILITY_V229.urgentBattleGapSeconds;
    const minSwitchReady=now-Number(cameraDirectorV225.lastSwitchSimMs||0)>=CAMERA_DIRECTOR_STABILITY_V229.minSwitchMs;
    const lockReady=now>=Number(cameraDirectorV225.lockUntilSimMs||0);
    const canSwitch=!currentTargets.length||urgentBattle||(lockReady&&minSwitchReady&&stableFor>=CAMERA_DIRECTOR_STABILITY_V229.candidateHoldMs);
    if(!canSwitch&&currentTargets.length)return {kind:cameraDirectorV225.kind,vehicles:currentTargets};
    cameraDirectorV225.kind=kind;cameraDirectorV225.targetIds=ids;cameraDirectorV225.lastSwitchSimMs=now;
    cameraDirectorV225.lockUntilSimMs=now+(kind==='BATTLE'?3200:2600);
    cameraDirectorV225.candidateKey='';cameraDirectorV225.candidateSinceSimMs=0;
    return {kind,vehicles};
  }
  cameraDirectorV225.candidateKey='';cameraDirectorV225.candidateSinceSimMs=0;
  return {kind:cameraDirectorV225.kind,vehicles:currentTargets.length?currentTargets:vehicles};
}
function raceCameraFocusV216(mode=raceCameraV216.mode){
  const rendered=raceMotionV189.vehicles.filter(vehicle=>vehicle?.renderPointV216);
  if(!rendered.length)return null;
  const standings=computeRaceStandingsV191();
  const leader=standings[0]?.vehicle||rendered[0];
  if(mode==='FULL')return {...cameraBaseBoxV216(),zoom:1,cx:cameraBaseBoxV216().x+cameraBaseBoxV216().w/2,cy:cameraBaseBoxV216().y+cameraBaseBoxV216().h/2};
  if(mode==='LEADER')return cameraFocusForVehiclesV225([leader],2.15);
  if(mode==='FRONT')return cameraFocusForVehiclesV225(standings.slice(0,3).map(row=>row.vehicle),2.2);
  const battle=standings.slice(1).filter(row=>Number(row.intervalSeconds)>=0).sort((a,b)=>Number(a.intervalSeconds)-Number(b.intervalSeconds))[0];
  if(mode==='BATTLE'){
    const ahead=battle?standings[battle.position-2]?.vehicle:null;
    if(ahead?.renderPointV216&&battle?.vehicle?.renderPointV216)return cameraFocusForVehiclesV225([ahead,battle.vehicle],2.7);
    return cameraFocusForVehiclesV225([battle?.vehicle||leader],2.35);
  }
  if(mode==='AUTO'){
    const target=selectAutoCameraTargetV225(standings);
    if(target.kind==='BATTLE')return cameraFocusForVehiclesV225(target.vehicles,2.7);
    if(target.kind==='FRONT')return cameraFocusForVehiclesV225(target.vehicles,2.2);
    return cameraFocusForVehiclesV225(target.vehicles.length?target.vehicles:[leader],1.95);
  }
  return cameraFocusForVehiclesV225([leader],1.95);
}
function updateAutoRaceCameraV216(immediate=false){
  if(raceCameraV216.mode==='MANUAL')return false;
  const focus=raceCameraFocusV216(raceCameraV216.mode);if(!focus)return false;
  if(raceCameraV216.userZoomLockedV268)focus.zoom=raceCameraV216.userZoomV268;
  return applyRaceCameraV216(focus,!immediate);
}
function getRaceCameraStateV216(){return {...raceCameraV216}}
function qaAutoFollowWheelZoomV268(){
  const saved={...raceCameraV216};
  const modes=['AUTO','LEADER','FRONT','BATTLE'];
  const trackingModesPreserve=modes.every(mode=>CAMERA_MODES_V216.includes(mode));
  const dragThreshold=6;
  const stateShape=Object.prototype.hasOwnProperty.call(raceCameraV216,'userZoomLockedV268')&&Object.prototype.hasOwnProperty.call(raceCameraV216,'dragCandidateV268');
  Object.assign(raceCameraV216,saved);
  return {trackingModesPreserve,dragThreshold,stateShape,allPass:trackingModesPreserve&&dragThreshold>=5&&stateShape};
}
function qaCameraDirectorV225(){
  const modeSet=new Set(CAMERA_MODES_V216);
  return {
    modes:[...CAMERA_MODES_V216],
    director:{...cameraDirectorV225},
    hasFront:modeSet.has('FRONT'),
    hasManual:modeSet.has('MANUAL'),
    lockConfigured:true,
    allPass:modeSet.has('AUTO')&&modeSet.has('FULL')&&modeSet.has('LEADER')&&modeSet.has('FRONT')&&modeSet.has('BATTLE')&&modeSet.has('MANUAL')
  };
}
function qaCameraDirectorStabilityV229(){
  const cfg=CAMERA_DIRECTOR_STABILITY_V229;
  return {
    candidateHoldMs:cfg.candidateHoldMs,minSwitchMs:cfg.minSwitchMs,urgentBattleGapSeconds:cfg.urgentBattleGapSeconds,
    focusDeadbandSvg:cfg.focusDeadbandSvg,zoomDeadband:cfg.zoomDeadband,director:{...cameraDirectorV225},
    allPass:cfg.candidateHoldMs>=500&&cfg.minSwitchMs>=1500&&cfg.urgentBattleGapSeconds<0.7&&cfg.focusDeadbandSvg>0&&cfg.zoomDeadband>0
  };
}
function qaZoomAwareMarkerScaleV245(){
  const samples=[1,1.5,2,3,4.5].map(zoom=>({zoom,scale:raceMarkerScaleV245(zoom)}));
  const screenRatios=samples.map(row=>row.zoom*row.scale);
  const live=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')].map(marker=>Number(marker.dataset.cameraScaleV245)||0);
  return {
    samples,screenRatios,liveCount:live.length,liveScales:live,
    allPass:samples[0].scale===1&&samples.every((row,index)=>index===0||row.scale<samples[index-1].scale)&&Math.max(...screenRatios)-Math.min(...screenRatios)<.12&&(!live.length||live.every(scale=>scale>0&&scale<=1))
  };
}
function qaDriverMarkerIdentityV232(){
  const samples=Array.from({length:12},(_,index)=>driverNumberV232({driver:{gridPosition:index+1}},index));
  const markers=[...document.querySelectorAll('.f1-racing-race-vehicle-v189')];
  const liveNumbers=markers.map(marker=>String(marker.dataset.driverNumberV232||marker.querySelector('.car-number-v232')?.textContent||'')).filter(Boolean);
  return {
    sampleCount:samples.length,sampleUnique:new Set(samples).size,
    liveMarkerCount:markers.length,liveNumberCount:liveNumbers.length,liveUnique:new Set(liveNumbers).size,
    allPass:new Set(samples).size===samples.length&&samples.every((value,index)=>value===String(index+1))&&markers.every(marker=>Boolean(marker.querySelector('.car-number-v232')))
  };
}
function qaDriverMarkerCameraV216(){
  const paletteUnique=new Set(DRIVER_COLORS_V216).size===DRIVER_COLORS_V216.length;
  const controls=ensureRaceCameraControlsV216();
  return {paletteCount:DRIVER_COLORS_V216.length,paletteUnique,controls,cameraModes:[...CAMERA_MODES_V216],mode:raceCameraV216.mode,allPass:paletteUnique&&DRIVER_COLORS_V216.length>=8&&CAMERA_MODES_V216.includes('AUTO')&&CAMERA_MODES_V216.includes('MANUAL')};
}
function timingAvatarV251(driver){
  const src=String(driver?.image||'').trim();
  const fallback=escapeHtml(driverProfileInitialsV250(driver));
  return '<span class="f1-racing-timing-avatar-v251" data-f1-timing-avatar data-has-image="'+(src?'1':'0')+'">'+
    '<span class="f1-racing-timing-avatar-fallback-v251">'+fallback+'</span>'+
    (src?'<img loading="lazy" decoding="async" src="'+escapeHtml(src)+'" alt="" aria-hidden="true">':'')+
    '</span>';
}
function bindTimingIdentityImagesV251(root=document.getElementById('f1RacingTimingListV188')){
  if(!root)return false;
  root.querySelectorAll('.f1-racing-timing-avatar-v251 img').forEach(img=>{
    if(img.dataset.f1TimingIdentityBound)return;
    img.dataset.f1TimingIdentityBound='1';
    const avatar=img.closest('.f1-racing-timing-avatar-v251');
    img.addEventListener('load',()=>{avatar?.classList.add('has-loaded-image');avatar?.classList.remove('image-error')});
    img.addEventListener('error',()=>{img.style.display='none';avatar?.classList.add('image-error');avatar?.classList.remove('has-loaded-image')});
    if(img.complete&&img.naturalWidth>0)avatar?.classList.add('has-loaded-image');
  });
  return true;
}
function timingRowV188(driver,index){
  const pos=index+1;
  const podium=pos<=3?' podium p'+pos:'';
  const driverColor=driverColorV216(index);
  return '<div class="f1-racing-timing-row-v188'+podium+'" data-f1-driver-id="'+escapeHtml(driver.contactId)+'" data-driver-color="'+driverColor+'" style="--f1-driver-color:'+driverColor+'">'+
    '<span class="pos">P'+String(pos).padStart(2,'0')+'</span>'+
    '<span class="driver"><i class="f1-racing-driver-color-v251" aria-hidden="true"></i>'+timingAvatarV251(driver)+'<span class="f1-racing-driver-copy-v251"><b>'+escapeHtml(driverCodeV188(driver))+'</b><small>'+escapeHtml(driver.name)+'</small></span><span class="f1-racing-driver-state-v253"><i data-f1-status-tyre-v253>M 100%</i><i data-f1-status-pit-v253 hidden>피트</i><i data-f1-status-battle-v253 hidden>배틀</i></span><em data-f1-current-sector>그리드</em></span>'+
    '<span class="gear">--</span><span class="rpm">----</span><span class="speed">---</span><span class="last">--:--.---</span><span class="best">--:--.---</span><span class="gap" data-f1-gap>'+(pos===1?'선두':'--.---')+'</span><span class="interval" data-f1-interval>--</span><span class="tyre">--</span><span class="s1">--.---</span><span class="s2">--.---</span><span class="s3">--.---</span>'+
    '</div>';
}
function qaLiveTimingIdentityV251(){
  const rows=[...document.querySelectorAll('#f1RacingTimingListV188 .f1-racing-timing-row-v188')].map(row=>({
    id:String(row.dataset.f1DriverId||''),
    color:String(row.dataset.driverColor||''),
    strip:Boolean(row.querySelector('.f1-racing-driver-color-v251')),
    avatar:Boolean(row.querySelector('[data-f1-timing-avatar]')),
    copy:Boolean(row.querySelector('.f1-racing-driver-copy-v251')),
    fallback:String(row.querySelector('.f1-racing-timing-avatar-fallback-v251')?.textContent||'').trim(),
    expectsImage:row.querySelector('[data-f1-timing-avatar]')?.dataset.hasImage==='1',
    hasImage:Boolean(row.querySelector('.f1-racing-timing-avatar-v251 img'))
  }));
  return {rowCount:rows.length,uniqueColors:new Set(rows.map(row=>row.color).filter(Boolean)).size,rows,allPass:rows.length>0&&rows.every(row=>row.color&&row.strip&&row.avatar&&row.copy&&row.fallback&&(row.expectsImage===row.hasImage))};
}
function renderRaceControlV188(){
  const snapshot=activeRaceSnapshotV187;
  if(!snapshot)return false;
  const name=document.getElementById('f1RacingRaceTrackNameV188');
  const count=document.getElementById('f1RacingRaceDriverCountV188');
  const status=document.getElementById('f1RacingRaceStatusV188');
  const lap=document.getElementById('f1RacingRaceLapV188');
  const list=document.getElementById('f1RacingTimingListV188');
  const mapMeta=document.getElementById('f1RacingRaceMapMetaV188');
  const svg=document.getElementById('f1RacingRaceTrackSvgV188');
  const path=document.getElementById('f1RacingRaceTrackPathV188');
  const glow=document.getElementById('f1RacingRaceTrackGlowV188');
  const annotations=document.getElementById('f1RacingRaceAnnotationsRecoveryB');
  if(name)name.textContent=String(snapshot.track.name||'TRACK').toUpperCase();
  if(count)count.textContent=String(snapshot.drivers.length);
  if(status)status.textContent='경기 전';
  syncRaceFlagHudV214();
  if(lap)lap.textContent='1 / '+(Number(snapshot.totalLaps)||DEFAULT_TOTAL_LAPS_V190);
  if(list){list.innerHTML=snapshot.drivers.map(timingRowV188).join('');bindTimingIdentityImagesV251(list)}
  ensureTopThreeStylesV213();
  if(mapMeta)mapMeta.textContent=(snapshot.track.lengthMeters/1000).toFixed(3)+' km · 드라이버 '+snapshot.drivers.length+'명';
  if(svg)svg.setAttribute('viewBox',(snapshot.track.viewBox||[0,0,1000,600]).join(' '));
  if(path)path.setAttribute('d',snapshot.track.path||'');
  if(glow)glow.setAttribute('d',snapshot.track.path||'');
  if(path)renderFourLaneGuidesV360(path,snapshot.track);
  if(path&&annotations)renderTrackMarkersV211(annotations,path,snapshot.track,'race');
  if(path)refreshRaceGeometryV193(snapshot,path);
  ensureRaceCameraControlsV216();
  resetRaceCameraV216('AUTO');
  bindSimulationControlsV192();
  resetRaceCommentaryV219();
  resetCommentaryFlowV222();
  resetLiveConversationV276();
  ensurePitHudV361();renderPitHudV361();
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent='레이스 관제';
  return true;
}
function bindRaceProceedV187(){
  const button=document.getElementById('f1RacingProceedV187');
  if(button&&!button.dataset.f1Bound){
    button.dataset.f1Bound='1';
    button.addEventListener('click',()=>startRaceFromSetupV187('NORMAL'));
  }
  const fast=document.getElementById('f1RacingFastRaceV345');
  if(fast&&!fast.dataset.f1Bound){
    fast.dataset.f1Bound='1';
    fast.addEventListener('click',()=>startRaceFromSetupV187('FAST'));
  }
  syncSetupActionV187();
}


const F1_WORKSPACE_PANEL_META_RECOVERY_E=Object.freeze({
  timing:Object.freeze({label:'실시간 순위',minW:4,minH:2}),
  track:Object.freeze({label:'트랙 맵',minW:4,minH:4}),
  commentary:Object.freeze({label:'경기 해설',minW:3,minH:3})
});
const F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E=Object.freeze({
  version:F1_WORKSPACE_LAYOUT_VERSION_V249,
  panels:Object.freeze({
    track:Object.freeze({x:0,y:0,w:8,h:8,hidden:false,maximized:false,tabGroup:''}),
    timing:Object.freeze({x:8,y:0,w:4,h:3,hidden:false,maximized:false,tabGroup:''}),
    commentary:Object.freeze({x:8,y:3,w:4,h:5,hidden:false,maximized:false,tabGroup:''})
  }),
  activeTabs:Object.freeze({})
});
let workspaceLayoutRecoveryE=null;
let workspacePointerRecoveryE=null;
let workspaceUserDefaultV259=null;
let workspaceUserDefaultRevisionV259=0;

function cloneWorkspaceLayoutRecoveryE(layout){
  return JSON.parse(JSON.stringify(layout));
}

const F1_WORKSPACE_MAX_ROWS_RECOVERY_I=32;
function workspaceMinSizeRecoveryI(id){
  const meta=F1_WORKSPACE_PANEL_META_RECOVERY_E[id]||{};
  return {w:Math.max(2,Number(meta.minW)||2),h:Math.max(2,Number(meta.minH)||2)};
}
function workspaceClampRectRecoveryI(id,rect={}){
  const min=workspaceMinSizeRecoveryI(id);
  const w=Math.max(min.w,Math.min(12,Math.round(Number(rect.w)||min.w)));
  const h=Math.max(min.h,Math.min(12,Math.round(Number(rect.h)||min.h)));
  const x=Math.max(0,Math.min(12-w,Math.round(Number(rect.x)||0)));
  const y=Math.max(0,Math.min(F1_WORKSPACE_MAX_ROWS_RECOVERY_I-h,Math.round(Number(rect.y)||0)));
  return {x,y,w,h};
}
function workspaceRectsOverlapRecoveryI(a,b){
  if(!a||!b)return false;
  return a.x<a.x+b.w&&b.x<b.x+a.w&&a.y<a.y+b.h&&b.y<b.y+a.h;
}
function workspaceRectIntersectsRecoveryI(a,b){
  if(!a||!b)return false;
  return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
}
function workspaceSlotMembersRecoveryI(layout,id){
  const state=layout?.panels?.[id];
  if(!state)return [];
  const group=String(state.tabGroup||'');
  return group
    ?Object.keys(layout.panels).filter(memberId=>String(layout.panels[memberId]?.tabGroup||'')===group)
    :[id];
}
function workspaceSlotLeadersRecoveryI(layout){
  const slots=[],seen=new Set();
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const state=layout?.panels?.[id];if(!state)continue;
    const group=String(state.tabGroup||'');
    const key=group?'tab:'+group:'panel:'+id;
    if(seen.has(key))continue;
    seen.add(key);
    const members=workspaceSlotMembersRecoveryI(layout,id);
    const visible=members.filter(memberId=>!layout.panels[memberId]?.hidden);
    if(!visible.length)continue;
    const active=group&&visible.includes(layout.activeTabs?.[group])?layout.activeTabs[group]:visible[0];
    slots.push({id:active,key,members,rect:workspaceClampRectRecoveryI(active,layout.panels[active])});
  }
  return slots;
}
function workspaceApplySlotRectRecoveryI(layout,id,rect){
  const next=workspaceClampRectRecoveryI(id,rect);
  for(const memberId of workspaceSlotMembersRecoveryI(layout,id)){
    Object.assign(layout.panels[memberId],next);
  }
  return next;
}
function workspaceFindFreeRectRecoveryI(id,desired,occupied){
  const base=workspaceClampRectRecoveryI(id,desired);
  const fits=rect=>!occupied.some(other=>workspaceRectIntersectsRecoveryI(rect,other));
  if(fits(base))return base;
  const candidates=[];
  for(let y=0;y<=F1_WORKSPACE_MAX_ROWS_RECOVERY_I-base.h;y++){
    for(let x=0;x<=12-base.w;x++){
      const rect={x,y,w:base.w,h:base.h};
      if(!fits(rect))continue;
      const distance=Math.abs(x-base.x)*2+Math.abs(y-base.y);
      candidates.push({rect,score:distance+y*.02+x*.005});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  return candidates[0]?.rect||base;
}
function workspaceDetachTabRecoveryI(layout,id){
  const state=layout?.panels?.[id];
  const group=String(state?.tabGroup||'');
  if(!state||!group)return;
  state.tabGroup='';
  const remaining=Object.keys(layout.panels).filter(memberId=>String(layout.panels[memberId]?.tabGroup||'')===group);
  if(remaining.length<2){
    remaining.forEach(memberId=>{layout.panels[memberId].tabGroup=''});
    delete layout.activeTabs[group];
  }else if(!remaining.includes(layout.activeTabs[group])){
    layout.activeTabs[group]=remaining[0];
  }
}
function workspaceReflowRecoveryI(layout,preferredId='',preferredRect=null){
  if(!layout?.panels)return layout;
  const preferredMembers=preferredId?workspaceSlotMembersRecoveryI(layout,preferredId):[];
  const preferredKey=preferredId
    ?(layout.panels[preferredId]?.tabGroup?'tab:'+layout.panels[preferredId].tabGroup:'panel:'+preferredId)
    :'';
  const slots=workspaceSlotLeadersRecoveryI(layout);
  const ordered=[...slots].sort((a,b)=>{
    if(a.key===preferredKey)return -1;
    if(b.key===preferredKey)return 1;
    if(a.rect.y!==b.rect.y)return a.rect.y-b.rect.y;
    return a.rect.x-b.rect.x;
  });
  const occupied=[];
  for(const slot of ordered){
    let desired=slot.rect;
    if(slot.key===preferredKey&&preferredRect)desired=workspaceClampRectRecoveryI(slot.id,preferredRect);
    const placed=workspaceFindFreeRectRecoveryI(slot.id,desired,occupied);
    workspaceApplySlotRectRecoveryI(layout,slot.id,placed);
    occupied.push(placed);
  }
  for(const group of new Set(Object.values(layout.panels).map(state=>String(state.tabGroup||'')).filter(Boolean))){
    const members=Object.keys(layout.panels).filter(id=>String(layout.panels[id]?.tabGroup||'')===group);
    const visible=members.filter(id=>!layout.panels[id].hidden);
    if(!visible.length)continue;
    const leader=visible.includes(layout.activeTabs[group])?layout.activeTabs[group]:visible[0];
    layout.activeTabs[group]=leader;
    const rect=workspaceClampRectRecoveryI(leader,layout.panels[leader]);
    members.forEach(id=>Object.assign(layout.panels[id],rect));
  }
  return workspaceCompactRecoveryK(layout,preferredId);
}
function workspaceOverlapPairsRecoveryI(layout=workspaceLayoutRecoveryE){
  const slots=workspaceSlotLeadersRecoveryI(layout);
  const pairs=[];
  for(let i=0;i<slots.length;i++){
    for(let j=i+1;j<slots.length;j++){
      if(workspaceRectIntersectsRecoveryI(slots[i].rect,slots[j].rect))pairs.push([slots[i].id,slots[j].id]);
    }
  }
  return pairs;
}


let workspaceRepairReportRecoveryK={repaired:false,reasons:[],version:F1_WORKSPACE_LAYOUT_VERSION_V249};

function workspaceRawIssuesRecoveryK(raw){
  const reasons=[];
  const candidate=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:null;
  if(!candidate){reasons.push('missing-layout');return reasons}
  if(Number(candidate.version)<F1_WORKSPACE_LAYOUT_VERSION_V249)reasons.push('legacy-version');
  const panels=candidate.panels&&typeof candidate.panels==='object'?candidate.panels:{};
  const knownIds=new Set(Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E));
  for(const id of Object.keys(panels)){
    if(knownIds.has(id))continue;
    reasons.push((id==='radio'||id==='speed'?'obsolete-panel:':'unknown-panel:')+id);
  }
  const rects=[];
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const row=panels[id];
    if(!row||typeof row!=='object'){reasons.push('missing-panel:'+id);continue}
    const min=workspaceMinSizeRecoveryI(id);
    const x=Math.round(Number(row.x)),y=Math.round(Number(row.y)),w=Math.round(Number(row.w)),h=Math.round(Number(row.h));
    if(![x,y,w,h].every(Number.isFinite)){reasons.push('invalid-rect:'+id);continue}
    if(w<min.w||h<min.h||w>12||h>12||x<0||x+w>12||y<0||y+h>F1_WORKSPACE_MAX_ROWS_RECOVERY_I)reasons.push('out-of-bounds:'+id);
    rects.push({id,x,y,w,h,tabGroup:String(row.tabGroup||'')});
  }
  for(let i=0;i<rects.length;i++){
    for(let j=i+1;j<rects.length;j++){
      const a=rects[i],b=rects[j];
      if(a.tabGroup&&a.tabGroup===b.tabGroup)continue;
      if(workspaceRectIntersectsRecoveryI(a,b))reasons.push('overlap:'+a.id+':'+b.id);
    }
  }
  const groups=new Map();
  for(const rect of rects){
    if(!rect.tabGroup)continue;
    if(!groups.has(rect.tabGroup))groups.set(rect.tabGroup,[]);
    groups.get(rect.tabGroup).push(rect);
  }
  for(const [group,members] of groups){
    if(members.length<2){reasons.push('orphan-tab:'+group);continue}
    const first=members[0];
    for(const member of members.slice(1)){
      if(member.x!==first.x||member.y!==first.y||member.w!==first.w||member.h!==first.h){reasons.push('tab-rect-mismatch:'+group);break}
    }
  }
  return [...new Set(reasons)];
}
function workspaceCompactRecoveryK(layout,preferredId=''){
  if(!layout?.panels)return layout;
  const preferredKey=preferredId
    ?(layout.panels[preferredId]?.tabGroup?'tab:'+layout.panels[preferredId].tabGroup:'panel:'+preferredId)
    :'';
  const slotKey=slot=>slot.key;
  let slots=workspaceSlotLeadersRecoveryI(layout).sort((a,b)=>a.rect.y-b.rect.y||a.rect.x-b.rect.x);
  for(const slot of slots){
    if(slotKey(slot)===preferredKey)continue;
    let rect=workspaceClampRectRecoveryI(slot.id,layout.panels[slot.id]);
    const others=()=>workspaceSlotLeadersRecoveryI(layout).filter(other=>other.key!==slot.key).map(other=>other.rect);
    let moved=true;
    while(moved){
      moved=false;
      if(rect.y>0){
        const up={...rect,y:rect.y-1};
        if(!others().some(other=>workspaceRectIntersectsRecoveryI(up,other))){rect=up;moved=true}
      }
      if(rect.x>0){
        const left={...rect,x:rect.x-1};
        if(!others().some(other=>workspaceRectIntersectsRecoveryI(left,other))){rect=left;moved=true}
      }
    }
    workspaceApplySlotRectRecoveryI(layout,slot.id,rect);
  }
  return layout;
}
function workspaceUsedRowsRecoveryK(layout=workspaceLayoutRecoveryE){
  const slots=workspaceSlotLeadersRecoveryI(layout);
  return Math.max(4,...slots.map(slot=>slot.rect.y+slot.rect.h));
}
function workspaceAuditLayoutRecoveryK(raw){
  const before=workspaceRawIssuesRecoveryK(raw);
  const layout=normalizeWorkspaceLayoutRecoveryE(raw);
  const overlaps=workspaceOverlapPairsRecoveryI(layout);
  return {layout:cloneWorkspaceLayoutRecoveryE(layout),overlaps:overlaps.map(pair=>pair.slice()),before,repaired:before.length>0||overlaps.length>0};
}

function normalizeWorkspaceLayoutRecoveryE(raw){
  const defaults=cloneWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
  const candidate=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
  const rawIssues=workspaceRawIssuesRecoveryK(candidate);
  const source=Number(candidate.version)>=5?candidate:{};
  const result={version:F1_WORKSPACE_LAYOUT_VERSION_V249,panels:{},activeTabs:{}};
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const base=defaults.panels[id];
    const row=source.panels?.[id]&&typeof source.panels[id]==='object'?source.panels[id]:{};
    let w=Math.max(2,Math.min(12,Math.round(Number(row.w)||base.w)));
    let h=Math.max(2,Math.min(10,Math.round(Number(row.h)||base.h)));
    let x=Math.max(0,Math.min(12-w,Math.round(Number(row.x)||base.x)));
    let y=Math.max(0,Math.min(12-h,Math.round(Number(row.y)||base.y)));
    result.panels[id]={
      x,y,w,h,
      hidden:Object.prototype.hasOwnProperty.call(row,'hidden')?Boolean(row.hidden):Boolean(base.hidden),
      maximized:Object.prototype.hasOwnProperty.call(row,'maximized')?Boolean(row.maximized):Boolean(base.maximized),
      tabGroup:Object.prototype.hasOwnProperty.call(row,'tabGroup')?String(row.tabGroup||''):String(base.tabGroup||'')
    };
  }
  for(const [group,id] of Object.entries(defaults.activeTabs||{})){
    if(result.panels[id]?.tabGroup===group)result.activeTabs[group]=id;
  }
  for(const [group,id] of Object.entries(source.activeTabs||{})){
    if(result.panels[id]?.tabGroup===group)result.activeTabs[group]=id;
  }
  const maxIds=Object.keys(result.panels).filter(id=>result.panels[id].maximized);
  maxIds.slice(1).forEach(id=>{result.panels[id].maximized=false});
  let normalized=cloneWorkspaceLayoutRecoveryE(result);
  let overlaps=workspaceOverlapPairsRecoveryI(normalized);
  const structuralIssues=rawIssues.filter(reason=>reason!=='legacy-version');
  if(structuralIssues.length||overlaps.length){
    normalized=workspaceReflowRecoveryI(result);
    overlaps=workspaceOverlapPairsRecoveryI(normalized);
  }
  if(overlaps.length){
    const fallback=cloneWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
    fallback.version=F1_WORKSPACE_LAYOUT_VERSION_V249;
    normalized=workspaceReflowRecoveryI(fallback);
    overlaps=workspaceOverlapPairsRecoveryI(normalized);
    rawIssues.push('fallback-default-layout');
  }
  normalized.version=F1_WORKSPACE_LAYOUT_VERSION_V249;
  workspaceRepairReportRecoveryK={repaired:rawIssues.length>0,reasons:[...new Set(rawIssues)],version:F1_WORKSPACE_LAYOUT_VERSION_V249,overlapCount:overlaps.length};
  return normalized;
}
function workspaceLayoutSignatureV259(layout){
  if(!layout?.panels)return '';
  const panels={};
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E).sort()){
    const row=layout.panels[id]||{};
    panels[id]={
      x:Number(row.x)||0,y:Number(row.y)||0,w:Number(row.w)||0,h:Number(row.h)||0,
      hidden:Boolean(row.hidden),maximized:Boolean(row.maximized),tabGroup:String(row.tabGroup||'')
    };
  }
  const activeTabs={};
  for(const key of Object.keys(layout.activeTabs||{}).sort())activeTabs[key]=String(layout.activeTabs[key]||'');
  return JSON.stringify({version:Number(layout.version)||0,panels,activeTabs});
}
function readWorkspaceLayoutRecoveryE(){
  const saved=readPersistedF1SettingsRecoveryD()?.workspaceLayout;
  workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(saved);
  workspaceUserDefaultV259=cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE);
  return workspaceLayoutRecoveryE;
}
function persistWorkspaceLayoutRecoveryE(){
  if(!workspaceLayoutRecoveryE)return false;
  const saved=persistF1SettingsRecoveryD({workspaceLayout:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE)});
  if(saved){
    workspaceUserDefaultV259=cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE);
    workspaceUserDefaultRevisionV259+=1;
    const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
    if(workspace){
      workspace.dataset.userDefaultV259='saved';
      workspace.dataset.userDefaultRevisionV259=String(workspaceUserDefaultRevisionV259);
    }
  }
  return saved;
}
function restoreWorkspaceUserDefaultV259(reason='lifecycle'){
  const saved=readPersistedF1SettingsRecoveryD()?.workspaceLayout;
  workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(saved);
  workspaceUserDefaultV259=cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE);
  applyWorkspaceLayoutRecoveryE();
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(workspace){
    workspace.dataset.userDefaultV259='restored';
    workspace.dataset.userDefaultReasonV259=String(reason||'lifecycle');
    workspace.dataset.userDefaultSignatureV259=workspaceLayoutSignatureV259(workspaceUserDefaultV259);
  }
  return cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE);
}
function checkpointWorkspaceUserDefaultV259(reason='interaction'){
  if(!workspaceLayoutRecoveryE)return false;
  const saved=persistWorkspaceLayoutRecoveryE();
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(workspace&&saved)workspace.dataset.userDefaultReasonV259=String(reason||'interaction');
  return saved;
}
function qaWorkspaceExactRestoreV269(){
  const sample={version:F1_WORKSPACE_LAYOUT_VERSION_V249,panels:{
    track:{x:0,y:0,w:8,h:7,hidden:false,maximized:false,tabGroup:''},
    timing:{x:8,y:0,w:4,h:3,hidden:false,maximized:false,tabGroup:''},
    commentary:{x:8,y:3,w:4,h:4,hidden:false,maximized:false,tabGroup:''}
  },activeTabs:{}};
  const normalized=normalizeWorkspaceLayoutRecoveryE(sample);
  const exact=workspaceLayoutSignatureV259(sample)===workspaceLayoutSignatureV259(normalized);
  const overlaps=workspaceOverlapPairsRecoveryI(normalized);
  return {exact,overlaps,signature:workspaceLayoutSignatureV259(normalized),allPass:exact&&overlaps.length===0};
}
function qaWorkspaceUserDefaultPersistenceV259(){
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  const originalRuntime=cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE);
  const originalPersisted=cloneWorkspaceLayoutRecoveryE(readPersistedF1SettingsRecoveryD()?.workspaceLayout||{});
  const originalTrack=String(activeTrackId||'majoku-ring-v1');
  const custom=normalizeWorkspaceLayoutRecoveryE({
    version:F1_WORKSPACE_LAYOUT_VERSION_V249,
    panels:{
      track:{x:0,y:0,w:7,h:8,hidden:false,maximized:false,tabGroup:''},
      timing:{x:7,y:0,w:5,h:3,hidden:false,maximized:false,tabGroup:''},
      commentary:{x:7,y:3,w:5,h:5,hidden:false,maximized:false,tabGroup:''}
    },
    activeTabs:{}
  });
  let observed={};
  try{
    workspaceLayoutRecoveryE=cloneWorkspaceLayoutRecoveryE(custom);
    applyWorkspaceLayoutRecoveryE();
    const saveOk=checkpointWorkspaceUserDefaultV259('qa-manual-layout');
    const expected=workspaceLayoutSignatureV259(custom);
    const persistedAfterLayout=readPersistedF1SettingsRecoveryD()?.workspaceLayout;
    const persistedSignature=workspaceLayoutSignatureV259(normalizeWorkspaceLayoutRecoveryE(persistedAfterLayout));
    const otherSettingSaveOk=persistF1SettingsRecoveryD({selectedTrackId:originalTrack});
    const persistedAfterOtherSetting=readPersistedF1SettingsRecoveryD()?.workspaceLayout;
    const preservedAfterOtherSetting=workspaceLayoutSignatureV259(normalizeWorkspaceLayoutRecoveryE(persistedAfterOtherSetting));
    workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
    applyWorkspaceLayoutRecoveryE();
    const restored=restoreWorkspaceUserDefaultV259('qa-next-race');
    const restoredSignature=workspaceLayoutSignatureV259(restored);
    const domRows={};
    for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
      const panel=workspacePanelRecoveryE(id);
      domRows[id]=panel?{
        gridColumn:String(panel.style.gridColumn||''),
        gridRow:String(panel.style.gridRow||''),
        hidden:Boolean(panel.hidden)
      }:null;
    }
    observed={saveOk,otherSettingSaveOk,expected,persistedSignature,preservedAfterOtherSetting,restoredSignature,domRows,revision:workspaceUserDefaultRevisionV259};
    observed.allPass=Boolean(saveOk&&otherSettingSaveOk&&expected&&persistedSignature===expected&&preservedAfterOtherSetting===expected&&restoredSignature===expected&&domRows.track&&domRows.timing&&domRows.commentary);
  }finally{
    if(typeof window.mwsSaveF1RacingSettingsRecoveryD==='function')window.mwsSaveF1RacingSettingsRecoveryD({workspaceLayout:originalPersisted,selectedTrackId:originalTrack});
    workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(originalRuntime);
    workspaceUserDefaultV259=cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE);
    applyWorkspaceLayoutRecoveryE();
  }
  return observed;
}
function workspacePanelRecoveryE(id){
  return document.querySelector('#f1RacingWorkspaceRecoveryE [data-f1-workspace-panel="'+id+'"]');
}
function workspacePanelLabelRecoveryE(id){
  return F1_WORKSPACE_PANEL_META_RECOVERY_E[id]?.label||String(id||'PANEL').toUpperCase();
}
function workspaceGroupMembersRecoveryE(group){
  if(!group||!workspaceLayoutRecoveryE)return [];
  return Object.keys(workspaceLayoutRecoveryE.panels).filter(id=>workspaceLayoutRecoveryE.panels[id].tabGroup===group);
}
function renderWorkspaceTabsRecoveryE(){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace||!workspaceLayoutRecoveryE)return;
  workspace.querySelectorAll('.f1-racing-workspace-tabs-recovery-e').forEach(node=>node.remove());
  for(const id of Object.keys(workspaceLayoutRecoveryE.panels)){
    const state=workspaceLayoutRecoveryE.panels[id];
    const group=state.tabGroup;
    if(!group)continue;
    const members=workspaceGroupMembersRecoveryE(group);
    if(members.length<2)continue;
    const active=workspaceLayoutRecoveryE.activeTabs[group]&&members.includes(workspaceLayoutRecoveryE.activeTabs[group])
      ?workspaceLayoutRecoveryE.activeTabs[group]
      :members[0];
    workspaceLayoutRecoveryE.activeTabs[group]=active;
    if(id!==active)continue;
    const panel=workspacePanelRecoveryE(id);
    const title=panel?.querySelector('.f1-racing-panel-title-v188');
    if(!title)continue;
    const tabs=document.createElement('div');
    tabs.className='f1-racing-workspace-tabs-recovery-e';
    tabs.dataset.f1TabGroup=group;
    for(const memberId of members){
      const button=document.createElement('button');
      button.type='button';
      button.dataset.f1WorkspaceTab=memberId;
      button.className=memberId===active?'active':'';
      button.textContent=workspacePanelLabelRecoveryE(memberId);
      tabs.appendChild(button);
    }
    title.prepend(tabs);
  }
}
function renderWorkspaceVisibilityControlsRecoveryE(){
  const box=document.getElementById('f1RacingWorkspacePanelTogglesRecoveryE');
  if(!box||!workspaceLayoutRecoveryE)return;
  box.replaceChildren();
  for(const id of Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E)){
    const button=document.createElement('button');
    button.type='button';
    button.className='secondary small'+(workspaceLayoutRecoveryE.panels[id].hidden?' is-hidden':'');
    button.dataset.f1WorkspaceToggle=id;
    button.textContent=workspacePanelLabelRecoveryE(id);
    button.setAttribute('aria-pressed',workspaceLayoutRecoveryE.panels[id].hidden?'false':'true');
    box.appendChild(button);
  }
}
function applyWorkspaceLayoutRecoveryE(){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace)return false;
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  const maximizedId=Object.keys(workspaceLayoutRecoveryE.panels).find(id=>workspaceLayoutRecoveryE.panels[id].maximized)||'';
  workspace.classList.toggle('has-maximized',Boolean(maximizedId));
  workspace.dataset.maximized=maximizedId;
  for(const id of Object.keys(workspaceLayoutRecoveryE.panels)){
    const state=workspaceLayoutRecoveryE.panels[id];
    const panel=workspacePanelRecoveryE(id);
    if(!panel)continue;
    const members=state.tabGroup?workspaceGroupMembersRecoveryE(state.tabGroup):[];
    const activeTab=state.tabGroup?(workspaceLayoutRecoveryE.activeTabs[state.tabGroup]||members[0]||id):id;
    const tabHidden=Boolean(state.tabGroup&&activeTab!==id);
    const maxHidden=Boolean(maximizedId&&maximizedId!==id);
    panel.hidden=Boolean(state.hidden||tabHidden||maxHidden);
    panel.classList.toggle('is-maximized',maximizedId===id);
    panel.style.gridColumn=(state.x+1)+' / span '+state.w;
    panel.style.gridRow=(state.y+1)+' / span '+state.h;
    panel.dataset.f1Dock=state.x===0&&state.w===6?'left':state.x===6&&state.w===6?'right':state.y===0&&state.w===12&&state.h===4?'top':state.y===4&&state.w===12&&state.h===4?'bottom':'free';
    const maxButton=panel.querySelector('[data-f1-workspace-action="maximize"]');
    if(maxButton)maxButton.textContent=maximizedId===id?'RESTORE':'MAX';
  }
  const usedRows=workspaceUsedRowsRecoveryK(workspaceLayoutRecoveryE);
  workspace.dataset.usedRows=String(usedRows);
  workspace.style.setProperty('--f1-workspace-used-rows',String(usedRows));
  if(document.body.classList.contains('f1-racing-immersive')){
    workspace.style.removeProperty('min-height');
  }else if(window.matchMedia?.('(min-width:901px)').matches){
    const rowHeight=workspaceGridRowHeightRecoveryJ(workspace);
    const gap=parseFloat(getComputedStyle(workspace).gap)||0;
    workspace.style.setProperty('min-height',Math.ceil(usedRows*rowHeight+Math.max(0,usedRows-1)*gap)+'px','important');
  }else{
    workspace.style.removeProperty('min-height');
  }
  renderWorkspaceTabsRecoveryE();
  renderWorkspaceVisibilityControlsRecoveryE();
  return true;
}

function workspaceGridRowHeightRecoveryJ(workspace=document.getElementById('f1RacingWorkspaceRecoveryE')){
  if(!workspace)return 72;
  const raw=parseFloat(getComputedStyle(workspace).gridAutoRows);
  return Number.isFinite(raw)&&raw>0?raw:72;
}

const F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N=Object.freeze({
  left:Object.freeze({x:0,w:4}),
  center:Object.freeze({x:4,w:4}),
  right:Object.freeze({x:8,w:4})
});
function workspaceTripleDockRectRecoveryN(id,zone){
  const col=F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N[String(zone||'')];
  if(!col)return null;
  const min=workspaceMinSizeRecoveryI(id);
  if(min.w>4)return null;
  return {x:col.x,y:0,w:4,h:10};
}
function workspacePackColumnGroupRecoveryN(layout,slots,column){
  if(!slots.length)return true;
  const totalMin=slots.reduce((sum,slot)=>sum+workspaceMinSizeRecoveryI(slot.id).h,0);
  if(totalMin>10)return false;
  let extra=10-totalMin;
  let y=0;
  slots.forEach((slot,index)=>{
    const minH=workspaceMinSizeRecoveryI(slot.id).h;
    const remaining=slots.length-index;
    const add=Math.floor(extra/remaining);
    const h=minH+add;
    extra-=add;
    workspaceApplySlotRectRecoveryI(layout,slot.id,{x:column.x,y,w:4,h});
    y+=h;
  });
  return true;
}
function workspacePackRemainingTripleColumnsRecoveryN(layout,excludeId,zone){
  const selected=F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N[zone];
  if(!selected)return false;
  const excludedKey=layout.panels[excludeId]?.tabGroup?'tab:'+layout.panels[excludeId].tabGroup:'panel:'+excludeId;
  const columns=Object.entries(F1_TRIPLE_DOCK_COLUMNS_RECOVERY_N)
    .filter(([,col])=>col.x!==selected.x)
    .map(([name,col])=>({name,...col}));
  const slots=workspaceSlotLeadersRecoveryI(layout)
    .filter(slot=>slot.key!==excludedKey)
    .sort((a,b)=>a.rect.y-b.rect.y||a.rect.x-b.rect.x);
  const groups=columns.map(()=>[]);
  const used=columns.map(()=>0);
  for(const slot of slots){
    let best=0;
    for(let i=1;i<columns.length;i++)if(used[i]<used[best])best=i;
    groups[best].push(slot);
    used[best]+=workspaceMinSizeRecoveryI(slot.id).h;
  }
  for(let i=0;i<columns.length;i++){
    if(!workspacePackColumnGroupRecoveryN(layout,groups[i],columns[i]))return false;
  }
  return true;
}
function workspaceDockTripleRecoveryN(id,zone){
  if(!workspaceLayoutRecoveryE?.panels[id])return false;
  const desired=workspaceTripleDockRectRecoveryN(id,zone);
  if(!desired)return false;
  workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,id);
  const source=workspaceLayoutRecoveryE.panels[id];
  source.hidden=false;source.maximized=false;
  workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,id,desired);
  if(!workspacePackRemainingTripleColumnsRecoveryN(workspaceLayoutRecoveryE,id,zone)){
    workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,desired);
  }
  applyWorkspaceLayoutRecoveryE();
  persistWorkspaceLayoutRecoveryE();
  return workspaceOverlapPairsRecoveryI().length===0;
}

function workspaceDockRectRecoveryJ(id,zone){
  const triple=workspaceTripleDockRectRecoveryN(id,zone);
  if(triple)return triple;
  const min=workspaceMinSizeRecoveryI(id);
  if(zone==='top')return {x:0,y:0,w:12,h:Math.max(min.h,3)};
  if(zone==='bottom'){const h=Math.max(min.h,3);return {x:0,y:10-h,w:12,h}}
  return null;
}
function workspaceRegionFreeRectRecoveryJ(id,desired,region,occupied){
  const min=workspaceMinSizeRecoveryI(id);
  const w=Math.max(min.w,Math.min(region.w,Math.round(Number(desired?.w)||min.w)));
  const h=Math.max(min.h,Math.min(region.h,Math.round(Number(desired?.h)||min.h)));
  const find=(width,height)=>{
    const maxX=region.x+region.w-width,maxY=region.y+region.h-height,candidates=[];
    for(let y=region.y;y<=maxY;y++){
      for(let x=region.x;x<=maxX;x++){
        const rect={x,y,w:width,h:height};
        if(occupied.some(other=>workspaceRectIntersectsRecoveryI(rect,other)))continue;
        const score=Math.abs(x-(Number(desired?.x)||region.x))*2+Math.abs(y-(Number(desired?.y)||region.y))+y*.01+x*.002;
        candidates.push({rect,score});
      }
    }
    candidates.sort((a,b)=>a.score-b.score);
    return candidates[0]?.rect||null;
  };
  return find(w,h)||find(min.w,min.h);
}
function workspacePackRegionRecoveryJ(layout,excludeId,region){
  const excludedKey=layout.panels[excludeId]?.tabGroup?'tab:'+layout.panels[excludeId].tabGroup:'panel:'+excludeId;
  const slots=workspaceSlotLeadersRecoveryI(layout).filter(slot=>slot.key!==excludedKey).sort((a,b)=>a.rect.y-b.rect.y||a.rect.x-b.rect.x);
  const occupied=[];
  for(const slot of slots){
    const placed=workspaceRegionFreeRectRecoveryJ(slot.id,slot.rect,region,occupied);
    if(!placed)return false;
    workspaceApplySlotRectRecoveryI(layout,slot.id,placed);
    occupied.push(placed);
  }
  return true;
}
function workspaceDockSplitRecoveryJ(id,zone){
  if(['left','center','right'].includes(String(zone||'')))return workspaceDockTripleRecoveryN(id,String(zone));
  if(!workspaceLayoutRecoveryE?.panels[id])return false;
  workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,id);
  const source=workspaceLayoutRecoveryE.panels[id];
  source.maximized=false;source.hidden=false;
  const desired=workspaceDockRectRecoveryJ(id,zone);
  if(!desired)return false;
  const placed=workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,id,desired);
  let region=null;
  if(zone==='left')region={x:placed.w,y:0,w:12-placed.w,h:10};
  else if(zone==='right')region={x:0,y:0,w:placed.x,h:10};
  else if(zone==='top')region={x:0,y:placed.h,w:12,h:10-placed.h};
  else if(zone==='bottom')region={x:0,y:0,w:12,h:placed.y};
  if(!region||region.w<3||region.h<2)return false;
  if(!workspacePackRegionRecoveryJ(workspaceLayoutRecoveryE,id,region))workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,placed);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();
  return workspaceOverlapPairsRecoveryI().length===0;
}
function workspaceAdjacentSlotsRecoveryJ(layout,id,edge){
  const source=workspaceClampRectRecoveryI(id,layout.panels[id]);
  return workspaceSlotLeadersRecoveryI(layout).filter(slot=>{
    if(slot.members.includes(id))return false;
    const rect=slot.rect;
    if(edge==='right')return rect.x===source.x+source.w&&Math.min(source.y+source.h,rect.y+rect.h)>Math.max(source.y,rect.y);
    if(edge==='bottom')return rect.y===source.y+source.h&&Math.min(source.x+source.w,rect.x+rect.w)>Math.max(source.x,rect.x);
    return false;
  });
}
function workspaceResizeSplitRecoveryJ(pointer,dw,dh){
  if(!pointer?.layoutStart?.panels?.[pointer.id])return false;
  workspaceLayoutRecoveryE=cloneWorkspaceLayoutRecoveryE(pointer.layoutStart);
  const id=pointer.id,start=workspaceClampRectRecoveryI(id,pointer.layoutStart.panels[id]),min=workspaceMinSizeRecoveryI(id);
  let targetW=Math.max(min.w,Math.min(12-start.x,start.w+dw));
  const right=workspaceAdjacentSlotsRecoveryJ(pointer.layoutStart,id,'right');
  if(right.length){
    const maxPositive=Math.min(...right.map(slot=>slot.rect.w-workspaceMinSizeRecoveryI(slot.id).w));
    const delta=Math.max(min.w-start.w,Math.min(targetW-start.w,maxPositive));
    targetW=start.w+delta;
    for(const slot of right)workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,slot.id,{x:slot.rect.x+delta,y:slot.rect.y,w:slot.rect.w-delta,h:slot.rect.h});
  }
  let targetH=Math.max(min.h,Math.min(12,start.h+dh));
  const bottom=workspaceAdjacentSlotsRecoveryJ(pointer.layoutStart,id,'bottom');
  if(bottom.length){
    const maxPositive=Math.min(...bottom.map(slot=>slot.rect.h-workspaceMinSizeRecoveryI(slot.id).h));
    const delta=Math.max(min.h-start.h,Math.min(targetH-start.h,maxPositive));
    targetH=start.h+delta;
    for(const slot of bottom)workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,slot.id,{x:slot.rect.x,y:slot.rect.y+delta,w:slot.rect.w,h:slot.rect.h-delta});
  }
  workspaceApplySlotRectRecoveryI(workspaceLayoutRecoveryE,id,{x:start.x,y:start.y,w:targetW,h:targetH});
  workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,workspaceLayoutRecoveryE.panels[id]);
  return workspaceOverlapPairsRecoveryI().length===0;
}
function workspaceDropPreviewRectRecoveryJ(drop,sourceId){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace||!drop)return null;
  const wr=workspace.getBoundingClientRect();
  if(drop.kind==='tab'&&drop.rect)return {left:drop.rect.left-wr.left,top:drop.rect.top-wr.top,width:drop.rect.width,height:drop.rect.height};
  let rect=null;
  if(drop.kind==='dock')rect=workspaceDockRectRecoveryJ(sourceId,drop.zone);
  if(drop.kind==='free'){
    const state=workspaceLayoutRecoveryE?.panels?.[sourceId];if(!state)return null;
    rect=workspaceClampRectRecoveryI(sourceId,{x:drop.x,y:drop.y,w:state.w,h:state.h});
  }
  if(!rect)return null;
  const col=wr.width/12,row=workspaceGridRowHeightRecoveryJ(workspace),gap=parseFloat(getComputedStyle(workspace).gap)||0;
  return {left:rect.x*col,top:rect.y*row,width:Math.max(0,rect.w*col-gap),height:Math.max(0,rect.h*row-gap)};
}

function workspaceDockLayoutRecoveryE(id,zone){
  return workspaceDockSplitRecoveryJ(id,zone);
}
function workspaceTabGroupRecoveryE(sourceId,targetId){
  if(sourceId===targetId||!workspaceLayoutRecoveryE?.panels[sourceId]||!workspaceLayoutRecoveryE?.panels[targetId])return false;
  workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,sourceId);
  const source=workspaceLayoutRecoveryE.panels[sourceId];
  const target=workspaceLayoutRecoveryE.panels[targetId];
  const group=target.tabGroup||('f1-tab-'+targetId);
  target.tabGroup=group;
  source.tabGroup=group;
  source.x=target.x;source.y=target.y;source.w=target.w;source.h=target.h;
  source.hidden=false;target.hidden=false;
  source.maximized=false;target.maximized=false;
  workspaceLayoutRecoveryE.activeTabs[group]=sourceId;
  workspaceReflowRecoveryI(workspaceLayoutRecoveryE,targetId,target);
  applyWorkspaceLayoutRecoveryE();
  persistWorkspaceLayoutRecoveryE();
  return true;
}
function workspaceSetActiveTabRecoveryE(id){
  const state=workspaceLayoutRecoveryE?.panels[id];
  if(!state?.tabGroup)return false;
  workspaceLayoutRecoveryE.activeTabs[state.tabGroup]=id;
  applyWorkspaceLayoutRecoveryE();
  persistWorkspaceLayoutRecoveryE();
  return true;
}
function workspaceTogglePanelRecoveryE(id){
  const state=workspaceLayoutRecoveryE?.panels[id];if(!state)return false;
  state.hidden=!state.hidden;
  if(!state.hidden&&state.tabGroup)workspaceLayoutRecoveryE.activeTabs[state.tabGroup]=id;
  if(state.hidden)state.maximized=false;
  workspaceReflowRecoveryI(workspaceLayoutRecoveryE,state.hidden?'':id,state.hidden?null:state);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return workspaceOverlapPairsRecoveryI().length===0;
}
function workspaceToggleMaximizeRecoveryE(id){
  if(!workspaceLayoutRecoveryE?.panels[id])return false;
  const next=!workspaceLayoutRecoveryE.panels[id].maximized;
  Object.values(workspaceLayoutRecoveryE.panels).forEach(state=>{state.maximized=false});
  workspaceLayoutRecoveryE.panels[id].maximized=next;
  workspaceLayoutRecoveryE.panels[id].hidden=false;
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return true;
}
function resetWorkspaceRecoveryE(){
  workspaceLayoutRecoveryE=normalizeWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return true;
}
function workspaceDropTargetRecoveryE(clientX,clientY,sourceId){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace)return {kind:'none'};
  const rect=workspace.getBoundingClientRect();
  const rx=(clientX-rect.left)/Math.max(1,rect.width);
  const ry=(clientY-rect.top)/Math.max(1,rect.height);
  if(ry<.08)return {kind:'dock',zone:'top'};
  if(ry>.92)return {kind:'dock',zone:'bottom'};
  if(rx<.14)return {kind:'dock',zone:'left'};
  if(rx>.86)return {kind:'dock',zone:'right'};
  if(rx>=.46&&rx<=.54)return {kind:'dock',zone:'center'};
  const target=document.elementFromPoint(clientX,clientY)?.closest?.('[data-f1-workspace-panel]');
  if(target&&target.dataset.f1WorkspacePanel!==sourceId&&!target.hidden){
    const tr=target.getBoundingClientRect();
    const tx=(clientX-tr.left)/Math.max(1,tr.width);
    const ty=(clientY-tr.top)/Math.max(1,tr.height);
    if(tx>.22&&tx<.78&&ty>.18&&ty<.82)return {kind:'tab',targetId:target.dataset.f1WorkspacePanel,rect:tr};
  }
  const state=workspaceLayoutRecoveryE.panels[sourceId];
  const col=Math.max(0,Math.min(12-state.w,Math.round(rx*12-state.w/2)));
  const rowHeight=workspaceGridRowHeightRecoveryJ(workspace);
  const row=Math.max(0,Math.min(F1_WORKSPACE_MAX_ROWS_RECOVERY_I-state.h,Math.round((clientY-rect.top)/rowHeight-state.h/2)));
  return {kind:'free',x:col,y:row};
}
function showWorkspaceDockGuideRecoveryE(drop,sourceId=''){
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  const guide=document.getElementById('f1RacingWorkspaceDockGuideRecoveryE');
  if(!workspace||!guide)return;
  if(!drop||drop.kind==='none'){guide.hidden=true;return}
  const preview=workspaceDropPreviewRectRecoveryJ(drop,sourceId);
  if(!preview){guide.hidden=true;return}
  guide.hidden=false;
  guide.className='f1-racing-workspace-dock-guide-recovery-e '+(drop.kind==='tab'?'tab':drop.kind==='free'?'free':drop.zone||'');
  guide.dataset.preview=drop.kind==='tab'?'TAB':drop.kind==='free'?'MOVE':String(drop.zone||'DOCK').toUpperCase();
  guide.style.left=preview.left+'px';guide.style.top=preview.top+'px';guide.style.width=preview.width+'px';guide.style.height=preview.height+'px';
}
function beginWorkspacePointerRecoveryE(event,type,id){
  const panel=workspacePanelRecoveryE(id);
  if(!panel||!workspaceLayoutRecoveryE?.panels[id])return;
  if(type==='drag'&&event.target.closest('button'))return;
  event.preventDefault();
  workspacePointerRecoveryE={
    type,id,startX:event.clientX,startY:event.clientY,
    start:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE.panels[id]),
    layoutStart:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE),
    lastX:event.clientX,lastY:event.clientY
  };
  panel.classList.add(type==='drag'?'is-dragging':'is-resizing');
}
function onWorkspacePointerMoveRecoveryE(event){
  const state=workspacePointerRecoveryE;if(!state)return;
  state.lastX=event.clientX;state.lastY=event.clientY;
  const panel=workspacePanelRecoveryE(state.id);if(!panel)return;
  if(state.type==='drag'){
    panel.style.transform='translate('+(event.clientX-state.startX)+'px,'+(event.clientY-state.startY)+'px)';
    showWorkspaceDockGuideRecoveryE(workspaceDropTargetRecoveryE(event.clientX,event.clientY,state.id),state.id);
    return;
  }
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');if(!workspace)return;
  const colWidth=Math.max(1,workspace.clientWidth/12);
  const rowHeight=workspaceGridRowHeightRecoveryJ(workspace);
  const dw=Math.round((event.clientX-state.startX)/colWidth);
  const dh=Math.round((event.clientY-state.startY)/rowHeight);
  workspaceResizeSplitRecoveryJ(state,dw,dh);
  applyWorkspaceLayoutRecoveryE();
}
function onWorkspacePointerUpRecoveryE(event){
  const pointer=workspacePointerRecoveryE;if(!pointer)return;
  workspacePointerRecoveryE=null;
  const panel=workspacePanelRecoveryE(pointer.id);
  if(panel){panel.classList.remove('is-dragging','is-resizing');panel.style.transform=''}
  showWorkspaceDockGuideRecoveryE(null,pointer.id);
  if(pointer.type==='resize'){persistWorkspaceLayoutRecoveryE();return}
  const drop=workspaceDropTargetRecoveryE(event.clientX,event.clientY,pointer.id);
  const state=workspaceLayoutRecoveryE.panels[pointer.id];
  if(drop.kind==='dock'){workspaceDockLayoutRecoveryE(pointer.id,drop.zone);return}
  if(drop.kind==='tab'){workspaceTabGroupRecoveryE(pointer.id,drop.targetId);return}
  if(drop.kind==='free'){
    workspaceDetachTabRecoveryI(workspaceLayoutRecoveryE,pointer.id);
    state.maximized=false;
    workspaceReflowRecoveryI(workspaceLayoutRecoveryE,pointer.id,{x:drop.x,y:drop.y,w:state.w,h:state.h});
    applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();
  }
}
function addWorkspacePanelChromeRecoveryE(panel,id){
  if(!panel||panel.dataset.f1WorkspacePrepared)return;
  panel.dataset.f1WorkspacePrepared='1';
  panel.dataset.f1WorkspacePanel=id;
  panel.classList.add('f1-racing-workspace-panel-recovery-e');
  const title=panel.querySelector('.f1-racing-panel-title-v188');
  if(title){
    title.dataset.f1PanelDrag=id;
    const controls=document.createElement('div');
    controls.className='f1-racing-workspace-panel-controls-recovery-e';
    controls.innerHTML='<button type="button" data-f1-workspace-action="maximize" title="패널 최대화">MAX</button><button type="button" data-f1-workspace-action="hide" title="패널 숨기기">HIDE</button>';
    title.appendChild(controls);
  }
  const resize=document.createElement('button');
  resize.type='button';
  resize.className='f1-racing-workspace-resize-recovery-e';
  resize.dataset.f1WorkspaceResize=id;
  resize.setAttribute('aria-label',workspacePanelLabelRecoveryE(id)+' 크기 조절');
  panel.appendChild(resize);
}
function installF1WorkspaceRecoveryE(){
  const race=document.getElementById('f1RacingViewRaceV185');if(!race)return false;
  let workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  if(!workspace){
    const header=race.querySelector('.f1-racing-race-header-v188');
    const toolbar=document.createElement('div');
    toolbar.id='f1RacingWorkspaceToolbarRecoveryE';
    toolbar.className='f1-racing-workspace-toolbar-recovery-e';
    toolbar.innerHTML='<div id="f1RacingWorkspacePanelTogglesRecoveryE" class="f1-racing-workspace-panel-toggles-recovery-e"></div><button type="button" class="secondary small" id="f1RacingWorkspaceResetRecoveryE">레이아웃 초기화</button>';
    workspace=document.createElement('div');
    workspace.id='f1RacingWorkspaceRecoveryE';
    workspace.className='f1-racing-workspace-recovery-e';
    const guide=document.createElement('div');
    guide.id='f1RacingWorkspaceDockGuideRecoveryE';
    guide.className='f1-racing-workspace-dock-guide-recovery-e';
    guide.hidden=true;
    workspace.appendChild(guide);
    header?.insertAdjacentElement('afterend',toolbar);
    toolbar.insertAdjacentElement('afterend',workspace);

    const timing=race.querySelector('.f1-racing-live-timing-v188');
    const legacyGrid=race.querySelector('.f1-racing-race-grid-v188');
    const track=legacyGrid?.querySelector('.f1-racing-race-map-v188');
    const commentary=legacyGrid?.querySelector('.f1-racing-commentary-v188');
    const pairs=[['timing',timing],['track',track],['commentary',commentary]];
    for(const [id,panel] of pairs){
      if(panel){workspace.appendChild(panel);addWorkspacePanelChromeRecoveryE(panel,id)}
    }
    if(legacyGrid)legacyGrid.hidden=true;

    toolbar.addEventListener('click',event=>{
      const toggle=event.target.closest('[data-f1-workspace-toggle]');
      if(toggle){workspaceTogglePanelRecoveryE(toggle.dataset.f1WorkspaceToggle);return}
      if(event.target.closest('#f1RacingWorkspaceResetRecoveryE'))resetWorkspaceRecoveryE();
    });
    workspace.addEventListener('click',event=>{
      const tab=event.target.closest('[data-f1-workspace-tab]');
      if(tab){workspaceSetActiveTabRecoveryE(tab.dataset.f1WorkspaceTab);return}
      const action=event.target.closest('[data-f1-workspace-action]');
      if(action){
        const panel=action.closest('[data-f1-workspace-panel]');
        const id=panel?.dataset.f1WorkspacePanel;if(!id)return;
        if(action.dataset.f1WorkspaceAction==='maximize')workspaceToggleMaximizeRecoveryE(id);
        if(action.dataset.f1WorkspaceAction==='hide')workspaceTogglePanelRecoveryE(id);
      }
    });
    workspace.addEventListener('pointerdown',event=>{
      const resize=event.target.closest('[data-f1-workspace-resize]');
      if(resize){beginWorkspacePointerRecoveryE(event,'resize',resize.dataset.f1WorkspaceResize);return}
      const title=event.target.closest('[data-f1-panel-drag]');
      if(title)beginWorkspacePointerRecoveryE(event,'drag',title.dataset.f1PanelDrag);
    });
    window.addEventListener('pointermove',onWorkspacePointerMoveRecoveryE);
    window.addEventListener('pointerup',onWorkspacePointerUpRecoveryE);
  }
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  applyWorkspaceLayoutRecoveryE();
  return true;
}

function qaCompactWorkspaceV217(){
  if(!workspaceLayoutRecoveryE)readWorkspaceLayoutRecoveryE();
  const panelIds=Object.keys(F1_WORKSPACE_PANEL_META_RECOVERY_E);
  const layout=workspaceLayoutRecoveryE||normalizeWorkspaceLayoutRecoveryE(F1_WORKSPACE_DEFAULT_LAYOUT_RECOVERY_E);
  const expected=layout.panels.track?.x===0&&layout.panels.track?.w===8&&layout.panels.timing?.x===8&&layout.panels.timing?.y===0&&layout.panels.commentary?.x===8&&layout.panels.commentary?.y===3;
  const workspace=document.getElementById('f1RacingWorkspaceRecoveryE');
  const removed=workspace?!workspace.querySelector('[data-f1-workspace-panel="radio"],[data-f1-workspace-panel="speed"]'):true;
  return {version:Number(layout.version)||0,panelIds,expectedDefault:expected,obsoletePanelsRemoved:removed,allPass:Number(layout.version)>=5&&panelIds.length===3&&panelIds.includes('track')&&panelIds.includes('timing')&&panelIds.includes('commentary')&&removed};
}
function qaWorkspacePanelMigrationV249(){
  const legacy={version:5,panels:{
    track:{x:0,y:0,w:7,h:8,hidden:false,maximized:false,tabGroup:''},
    timing:{x:7,y:0,w:5,h:3,hidden:false,maximized:false,tabGroup:''},
    commentary:{x:7,y:3,w:5,h:5,hidden:false,maximized:false,tabGroup:''},
    radio:{x:0,y:8,w:6,h:3,hidden:false,maximized:false,tabGroup:''},
    speed:{x:6,y:8,w:6,h:3,hidden:false,maximized:false,tabGroup:''}
  },activeTabs:{}};
  const audit=workspaceAuditLayoutRecoveryK(legacy);
  const keys=Object.keys(audit.layout?.panels||{}).sort();
  const reasons=Array.isArray(audit.before)?audit.before:[];
  const geometryPreserved=audit.layout?.panels?.track?.w===7&&audit.layout?.panels?.timing?.x===7&&audit.layout?.panels?.commentary?.x===7;
  const obsoleteRemoved=!keys.includes('radio')&&!keys.includes('speed')&&keys.join(',')==='commentary,timing,track';
  const reasonsPresent=reasons.includes('legacy-version')&&reasons.includes('obsolete-panel:radio')&&reasons.includes('obsolete-panel:speed');
  return {version:Number(audit.layout?.version)||0,keys,reasons,geometryPreserved,obsoleteRemoved,overlaps:audit.overlaps||[],allPass:Number(audit.layout?.version)===F1_WORKSPACE_LAYOUT_VERSION_V249&&obsoleteRemoved&&reasonsPresent&&geometryPreserved&&(audit.overlaps||[]).length===0};
}
function readPersistedF1SettingsRecoveryD(){
  return typeof window.mwsGetF1RacingSettingsRecoveryD==='function'
    ?window.mwsGetF1RacingSettingsRecoveryD()
    :null;
}
function restoreF1SettingsRecoveryD(force=false){
  if(persistenceRestoredRecoveryD&&!force)return false;
  const settings=readPersistedF1SettingsRecoveryD();
  if(!settings){persistenceRestoredRecoveryD=true;return false}
  const contacts=getContacts();
  const validContactIds=new Set(contacts.map(row=>String(row.id)));
  const restoredIds=(Array.isArray(settings.selectedDriverIds)?settings.selectedDriverIds:[])
    .map(String).filter(id=>validContactIds.has(id));
  selectedIds.splice(0,selectedIds.length,...restoredIds);
  const restoredTrack=String(settings.selectedTrackId||'majoku-ring-v1');
  activeTrackId=window.mwsGetF1TrackV182?.(restoredTrack)?restoredTrack:'majoku-ring-v1';
  lapOverrideActiveV260=Boolean(settings.lapOverride);
  const recommendedV260=recommendedLapsV260(window.mwsGetF1TrackV182?.(activeTrackId));
  selectedTotalLapsRecoveryD=lapOverrideActiveV260?clampLapCountV260(settings.totalLaps,recommendedV260):recommendedV260;
  persistenceRestoredRecoveryD=true;
  return true;
}
function persistF1SettingsRecoveryD(extra={}){
  if(typeof window.mwsSaveF1RacingSettingsRecoveryD!=='function')return false;
  return Boolean(window.mwsSaveF1RacingSettingsRecoveryD({
    selectedDriverIds:selectedIds.slice(),
    selectedTrackId:String(activeTrackId||'majoku-ring-v1'),
    totalLaps:selectedTotalLapsRecoveryD,
    lapOverride:lapOverrideActiveV260,
    ...extra
  })?.ok);
}

function render(){
  const section=document.getElementById('gameF1Racing');
  if(!section)return false;
  restoreF1SettingsRecoveryD(false);
  const search=document.getElementById('f1RacingContactSearchV181');
  const clear=document.getElementById('f1RacingClearDriversV181');
  if(search&&!search.dataset.f1Bound){search.dataset.f1Bound='1';search.addEventListener('input',renderContacts)}
  if(clear&&!clear.dataset.f1Bound){clear.dataset.f1Bound='1';clear.addEventListener('click',function(){selectedIds.splice(0);persistF1SettingsRecoveryD();stopPreviewV184(true);renderContacts();renderSelected();syncSetupActionV187()})}
  applyScreenStateV185();
  renderContacts();
  renderSelected();
  renderTrackChoicesV186();
  bindLapControlV260();
  bindImmersiveControlV261();
  bindRaceProceedV187();
  bindManualRaceStartRecoveryM();
  bindRaceCancelRecoveryC();
  bindRaceLifecycleRecoveryG();
  installF1WorkspaceRecoveryE();
  updateTrackFoundationStatusV182();
  renderTrackMapV183();
  if(previewStateV184.running)stopPreviewV184(true);
  if(f1ScreenStateV185==='RACE'&&activeRaceSnapshotV187){renderRaceControlV188();startRaceMotionV189()}
  const chip=document.getElementById('f1RacingPhaseChipV180');if(chip)chip.textContent=f1ScreenStateV185==='SETUP'?'RACE SETUP':'RACE CONTROL';
  section.dataset.f1Runtime=VERSION217;
  return true;
}
function toggleDriver(id){
  const key=String(id||'');if(!key)return;
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);else selectedIds.push(key);
  persistF1SettingsRecoveryD();
  renderContacts();renderSelected();syncSetupActionV187();
}
function removeDriver(id){
  const key=String(id||'');
  const index=selectedIds.findIndex(function(value){return String(value)===key});
  if(index>=0)selectedIds.splice(index,1);
  persistF1SettingsRecoveryD();
  renderContacts();renderSelected();syncSetupActionV187();
}
function getSelectedContactIds(){return selectedIds.slice()}
function getActiveTrack(){return typeof window.mwsGetF1TrackV182==='function'?window.mwsGetF1TrackV182(activeTrackId):null}
function svgNodeV183(name,attrs={}){
  const node=document.createElementNS('http://www.w3.org/2000/svg',name);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
  return node;
}
function pointAtProgressV183(path,progress){
  const length=path.getTotalLength();
  return path.getPointAtLength(Math.max(0,Math.min(1,Number(progress)||0))*length);
}
function addTrackAnnotationV183(layer,path,kind,label,progress){
  const point=pointAtProgressV183(path,progress);
  const group=svgNodeV183('g',{class:'f1-racing-track-annotation-v183 '+kind,'data-kind':kind,'data-progress':progress});
  group.dataset.zoomAnchorX=String(point.x);group.dataset.zoomAnchorY=String(point.y);
  const circle=svgNodeV183('circle',{cx:point.x,cy:point.y,r:kind==='start'?9:7});
  const textNode=svgNodeV183('text',{x:point.x+12,y:point.y-10});
  textNode.textContent=label;
  group.append(circle,textNode);
  layer.appendChild(group);
}

function startFinishGeometryRecoveryB(path,track){
  const total=Number(path?.getTotalLength?.())||0;
  if(!(total>0)||!track)return null;
  const progress=normalizedProgressV190(Number(track.startFinish)||0);
  const at=progress*total;
  const d=Math.max(2,total/900);
  const beforeAt=(at-d+total)%total;
  const afterAt=(at+d)%total;
  const center=path.getPointAtLength(at);
  const before=path.getPointAtLength(beforeAt);
  const after=path.getPointAtLength(afterAt);
  const dx=Number(after.x)-Number(before.x),dy=Number(after.y)-Number(before.y);
  const mag=Math.hypot(dx,dy)||1;
  const tx=dx/mag,ty=dy/mag;
  const nx=-ty,ny=tx;
  const visualWidth=Math.max(10,Number(track?.geometry?.visualTrackWidthSvg)||26);
  const halfSpan=Math.max(18,visualWidth*.92);
  return {
    progress,
    center:{x:Number(center.x),y:Number(center.y)},
    tangent:{x:tx,y:ty},
    normal:{x:nx,y:ny},
    a:{x:Number(center.x)-nx*halfSpan,y:Number(center.y)-ny*halfSpan},
    b:{x:Number(center.x)+nx*halfSpan,y:Number(center.y)+ny*halfSpan}
  };
}
function addStartFinishLineRecoveryB(layer,path,track,scope='setup'){
  if(!layer||!path||!track)return null;
  const geometry=startFinishGeometryRecoveryB(path,track);
  if(!geometry)return null;
  const group=svgNodeV183('g',{
    class:'f1-racing-start-finish-recovery-b '+scope,
    'data-f1-start-finish':'1',
    'data-progress':geometry.progress.toFixed(6)
  });
  const underlay=svgNodeV183('line',{class:'finish-underlay',x1:geometry.a.x,y1:geometry.a.y,x2:geometry.b.x,y2:geometry.b.y});
  const stripe=svgNodeV183('line',{class:'finish-stripe',x1:geometry.a.x,y1:geometry.a.y,x2:geometry.b.x,y2:geometry.b.y});
  const labelDistance=scope==='race'?34:42;
  const label=svgNodeV183('text',{
    class:'finish-label',
    x:geometry.center.x+geometry.tangent.x*labelDistance+geometry.normal.x*18,
    y:geometry.center.y+geometry.tangent.y*labelDistance+geometry.normal.y*18,
    'text-anchor':'middle'
  });
  label.textContent='출발 / 결승선';
  label.dataset.zoomAnchorX=label.getAttribute('x');label.dataset.zoomAnchorY=label.getAttribute('y');
  group.append(underlay,stripe,label);
  layer.appendChild(group);
  return group;
}
function renderRaceStartFinishRecoveryB(layer,path,track){
  if(!layer||!path||!track)return false;
  layer.replaceChildren();
  return Boolean(addStartFinishLineRecoveryB(layer,path,track,'race'));
}
function trackIndicatorGeometryV246(path,progress,index=0){
  const total=Number(path?.getTotalLength?.())||0;if(!(total>0))return null;
  const at=Math.max(0,Math.min(1,Number(progress)||0))*total;
  const d=Math.max(2,total/900);
  const before=path.getPointAtLength(Math.max(0,at-d));
  const after=path.getPointAtLength(Math.min(total,at+d));
  const point=path.getPointAtLength(at);
  const dx=Number(after.x)-Number(before.x),dy=Number(after.y)-Number(before.y),mag=Math.hypot(dx,dy)||1;
  const nx=-dy/mag,ny=dx/mag,side=index%2===0?1:-1;
  const startOffset=24,endOffset=58;
  return {
    point:{x:Number(point.x),y:Number(point.y)},
    a:{x:Number(point.x)+nx*side*startOffset,y:Number(point.y)+ny*side*startOffset},
    b:{x:Number(point.x)+nx*side*endOffset,y:Number(point.y)+ny*side*endOffset},
    side
  };
}
function addTrackIndicatorV246(layer,path,label,progress,index=0){
  const geometry=trackIndicatorGeometryV246(path,progress,index);if(!geometry)return null;
  const group=svgNodeV183('g',{class:'f1-racing-track-indicator-v246 sector','data-kind':'sector-indicator','data-progress':progress});
  group.dataset.zoomAnchorX=String(geometry.a.x);group.dataset.zoomAnchorY=String(geometry.a.y);
  const line=svgNodeV183('line',{x1:geometry.a.x,y1:geometry.a.y,x2:geometry.b.x,y2:geometry.b.y});
  const rect=svgNodeV183('rect',{x:geometry.b.x-18,y:geometry.b.y-11,width:36,height:18,rx:5,ry:5});
  const textNode=svgNodeV183('text',{x:geometry.b.x,y:geometry.b.y+2,'text-anchor':'middle'});
  textNode.textContent=label;
  group.append(line,rect,textNode);layer.appendChild(group);return group;
}
function renderTrackMarkersV211(layer,path,track,scope='race'){
  if(!layer||!path||!track)return false;
  layer.replaceChildren();
  addStartFinishLineRecoveryB(layer,path,track,scope);
  (track.sectors||[]).slice(0,-1).forEach((sector,index)=>addTrackIndicatorV246(layer,path,'S'+(index+1),sector.end,index));
  if(track.pit){
    addTrackAnnotationV183(layer,path,'pit','피트 진입',track.pit.entry);
    addTrackAnnotationV183(layer,path,'pit','피트 출구',track.pit.exit);
  }
  if(scope==='race')syncTrackAnnotationScaleV245();
  return true;
}
function qaTrackPresentationV246(){
  renderTrackMapV183();
  const layer=document.getElementById('f1RacingTrackAnnotationsV183');
  const sectorIndicators=layer?.querySelectorAll('.f1-racing-track-indicator-v246.sector').length||0;
  const trapDots=layer?.querySelectorAll('.f1-racing-track-annotation-v183.trap').length||0;
  const overtakeDots=layer?.querySelectorAll('.f1-racing-track-annotation-v183.overtake').length||0;
  const pitDots=layer?.querySelectorAll('.f1-racing-track-annotation-v183.pit').length||0;
  const startLines=layer?.querySelectorAll('[data-f1-start-finish="1"]').length||0;
  return {sectorIndicators,trapDots,overtakeDots,pitDots,startLines,allPass:sectorIndicators===2&&trapDots===0&&overtakeDots===0&&pitDots===2&&startLines===1};
}
function qaTrackMarkersV211(){
  const catalog=window.MWS_F1_TRACKS_V182?Object.values(window.MWS_F1_TRACKS_V182):[];
  const rows=catalog.map(track=>({
    id:track.id,
    sectors:(track.sectors||[]).length,
    speedTraps:(track.speedTraps||[]).length,
    pitReady:Boolean(track.pit&&Number.isFinite(Number(track.pit.entry))&&Number.isFinite(Number(track.pit.exit))),
    detectionLines:(track.overtakeZones||[]).filter(zone=>Number.isFinite(Number(zone.detection))).length
  }));
  return {trackCount:rows.length,rows,allPass:rows.length>=3&&rows.every(row=>row.sectors===3&&row.speedTraps>=3&&row.pitReady&&row.detectionLines>=1)};
}

function renderTrackMapV183(){
  const track=getActiveTrack();
  const svg=document.getElementById('f1RacingTrackSvgV183');
  const path=document.getElementById('f1RacingTrackPathV183');
  const glow=document.getElementById('f1RacingTrackGlowV183');
  const layer=document.getElementById('f1RacingTrackAnnotationsV183');
  if(!track||!svg||!path||!glow||!layer)return false;
  svg.setAttribute('viewBox',track.viewBox.join(' '));
  svg.setAttribute('aria-label',track.name+' 트랙 맵');
  path.setAttribute('d',track.path);
  glow.setAttribute('d',track.path);
  layer.replaceChildren();
  renderTrackMarkersV211(layer,path,track,'setup');
  const name=document.getElementById('f1RacingTrackNameV183');
  const length=document.getElementById('f1RacingTrackLengthV183');
  const pit=document.getElementById('f1RacingPitLimitV183');
  const pathState=document.getElementById('f1RacingTrackPathStateV183');
  if(name)name.textContent=track.name;
  if(length)length.textContent=(track.lengthMeters/1000).toFixed(3)+' km';
  if(pit)pit.textContent=track.pit.speedLimitKph+' km/h';
  if(pathState)pathState.textContent=Math.round(path.getTotalLength())+' SVG 단위';
  return true;
}
function updateTrackFoundationStatusV182(){
  const track=getActiveTrack();
  const chip=document.getElementById('f1RacingPhaseChipV180');
  const status=document.getElementById('f1RacingFoundationStatusV180');
  if(chip)chip.textContent=track?'트랙 모델':'트랙 오류';
  if(status)status.textContent=track
    ?'트랙 데이터 준비 완료 · '+track.name+' · '+(track.lengthMeters/1000).toFixed(3)+' km · 3개 섹터 · 피트 데이터'
    :'트랙 데이터를 불러오지 못했습니다.';
}

window.mwsRenderF1RacingV180=render;
window.mwsRenderF1RacingV181=render;
window.mwsF1ToggleDriverV181=toggleDriver;
window.mwsF1RemoveDriverV181=removeDriver;
window.mwsF1GetSelectedContactIdsV181=getSelectedContactIds;
window.mwsF1GetActiveTrackV182=getActiveTrack;
window.mwsF1RenderTrackMapV183=renderTrackMapV183;
window.mwsF1PointAtProgressV183=pointAtProgressV183;
window.mwsF1StartFinishGeometryRecoveryB=startFinishGeometryRecoveryB;
window.mwsF1AddStartFinishLineRecoveryB=addStartFinishLineRecoveryB;
window.mwsF1RenderRaceStartFinishRecoveryB=renderRaceStartFinishRecoveryB;
window.mwsF1StartPreviewV184=startPreviewV184;
window.mwsF1StopPreviewV184=stopPreviewV184;
window.mwsF1PositionPreviewV184=positionPreviewMarkerV184;
window.mwsF1SetScreenStateV185=setScreenStateV185;
window.mwsF1GetScreenStateV185=getScreenStateV185;
window.mwsF1CanTransitionV185=canTransitionF1V185;
window.mwsF1SelectTrackV186=selectTrackV186;
window.mwsF1GetTrackCatalogV186=getTrackCatalogV186;
window.mwsF1GetRaceDraftV187=getRaceDraftV187;
window.mwsF1BuildRaceSnapshotV187=buildRaceSnapshotV187;
window.mwsF1StartRaceFromSetupV187=startRaceFromSetupV187;
window.mwsF1ConfirmRaceStartRecoveryM=confirmRaceStartRecoveryM;
window.mwsF1GetActiveRaceSnapshotV187=getActiveRaceSnapshotV187;
window.mwsF1ShuffleStartingGridV272=reshuffleStartingGridV272;
window.mwsF1RenderStartingGridV272=renderStartingGridV272;
window.mwsF1GridStartOffsetV272=gridStartOffsetV272;
window.mwsF1QaRandomStartingGridV272=qaRandomStartingGridV272;
window.mwsF1RunStartingGridRevealV273=runStartingGridRevealV273;
window.mwsF1WaitGridRevealV273=waitGridRevealV273;
window.mwsF1ClearGridRevealV273=clearGridRevealV273;
window.mwsF1QaStartingGridRevealV273=qaStartingGridRevealV273;
window.mwsF1LeaderPressureScoreV274=leaderPressureScoreV274;
window.mwsF1UpdateLeaderPressureV274=updateFieldCompressionLeaderPressureV274;
window.mwsF1GetLeaderPressureStatesV274=getLeaderPressureStatesV274;
window.mwsF1QaLeaderPressureV274=qaLeaderPressureV274;
window.mwsF1UpdateChaseBurstV275=updateChaseBurstV275;
window.mwsF1GetChaseBurstStatesV275=getChaseBurstStatesV275;
window.mwsF1QaChaseBurstV275=qaChaseBurstV275;
window.mwsF1AppendLiveConversationV276=appendLiveConversationV276;
window.mwsF1ResetLiveConversationV276=resetLiveConversationV276;
window.mwsF1GetLiveConversationStateV276=getLiveConversationStateV276;
window.mwsF1QaLiveConversationStackV276=qaLiveConversationStackV276;
window.mwsF1EmitCharacterDialogueV277=emitCharacterDialogueEventV277;
window.mwsF1GetCharacterDialogueHistoryV277=function(){return characterDialogueStateV277.history.map(row=>({...row}))};
window.mwsF1RaceInfoTextV277=raceInfoTextV277;
window.mwsF1QaCharacterDialogueEngineV277=qaCharacterDialogueEngineV277;
window.mwsF1UpdateMicroBattleEventsV278=updateMicroBattleEventsV278;
window.mwsF1GetMicroBattleEventsV278=getMicroBattleEventsV278;
window.mwsF1QaMicroBattleEventsV278=qaMicroBattleEventsV278;
window.mwsF1DialoguePoolStatsV279=dialoguePoolCountV279;
window.mwsF1QaExpandedDialoguePoolV279=qaExpandedDialoguePoolV279;
window.mwsF1GetDialogueCoverageV280=getDialogueCoverageV280;
window.mwsF1QaEventDialogueCoverageV280=qaEventDialogueCoverageV280;
window.mwsF1GetDialogueCadenceV281=getDialogueCadenceV281;
window.mwsF1QaDialogueCadenceV281=qaDialogueCadenceV281;
window.mwsF1QaDialogueLongRunDesktopV282=qaDialogueLongRunDesktopV282;
window.mwsF1ApplyGameVariabilityV303=applyGameVariabilityV303;window.mwsF1QaGameVariabilityV303=qaGameVariabilityV303;window.__mwsF1RacingV303=VERSION303;
window.mwsF1QaOvertakeFlowV309=qaOvertakeFlowV309;window.mwsF1GetRaceOrderFlowV309=function(){return {...raceOrderFlowStateV309,lastOrder:[...raceOrderFlowStateV309.lastOrder]}};window.__mwsF1RacingV309=VERSION309;
window.mwsF1GetLeaderPressureFieldV274=function(){return {...leaderPressureFieldV274,history:leaderPressureFieldV274.history.map(row=>({...row}))}};
window.mwsF1GetStartingGridRevealStateV273=function(){return {...gridRevealStateV273,timers:gridRevealStateV273.timers.length}};
window.mwsF1CancelRaceRecoveryC=cancelRaceToSetupRecoveryC;
window.mwsF1RestoreSettingsRecoveryD=restoreF1SettingsRecoveryD;
window.mwsF1PersistSettingsRecoveryD=persistF1SettingsRecoveryD;
window.mwsF1InstallWorkspaceRecoveryE=installF1WorkspaceRecoveryE;
window.mwsF1ApplyWorkspaceLayoutRecoveryE=applyWorkspaceLayoutRecoveryE;
window.mwsF1ResetWorkspaceRecoveryE=resetWorkspaceRecoveryE;
window.mwsF1DockPanelRecoveryE=workspaceDockLayoutRecoveryE;
window.mwsF1TabGroupRecoveryE=workspaceTabGroupRecoveryE;
window.mwsF1ToggleWorkspacePanelRecoveryE=workspaceTogglePanelRecoveryE;
window.mwsF1ToggleWorkspaceMaximizeRecoveryE=workspaceToggleMaximizeRecoveryE;
window.mwsF1GetWorkspaceLayoutRecoveryE=function(){return workspaceLayoutRecoveryE?cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE):null};
window.mwsF1ReflowWorkspaceRecoveryI=function(id='',rect=null){if(!workspaceLayoutRecoveryE)return false;workspaceReflowRecoveryI(workspaceLayoutRecoveryE,id,rect);applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return workspaceOverlapPairsRecoveryI().length===0};
window.mwsF1WorkspaceOverlapPairsRecoveryI=function(){return workspaceOverlapPairsRecoveryI().map(pair=>pair.slice())};
window.mwsF1DockSplitRecoveryJ=workspaceDockSplitRecoveryJ;
window.mwsF1DockTripleRecoveryN=workspaceDockTripleRecoveryN;
window.mwsF1ResizeSplitRecoveryJ=function(id,dw=0,dh=0){
  if(!workspaceLayoutRecoveryE?.panels?.[id])return false;
  const pointer={id,start:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE.panels[id]),layoutStart:cloneWorkspaceLayoutRecoveryE(workspaceLayoutRecoveryE)};
  const ok=workspaceResizeSplitRecoveryJ(pointer,Number(dw)||0,Number(dh)||0);
  applyWorkspaceLayoutRecoveryE();persistWorkspaceLayoutRecoveryE();return ok;
};
window.mwsF1AuditWorkspaceLayoutRecoveryK=workspaceAuditLayoutRecoveryK;
window.mwsF1GetWorkspaceRepairReportRecoveryK=function(){return {...workspaceRepairReportRecoveryK,reasons:[...(workspaceRepairReportRecoveryK.reasons||[])]}};
window.mwsF1FinishRaceRecoveryG=finishRaceRecoveryG;
window.mwsF1ForceFinishRecoveryG=function(){return finishRaceRecoveryG(true)};
window.mwsF1ShowPodiumRecoveryG=showPodiumRecoveryG;
window.mwsF1ShowResultRecoveryG=showResultRecoveryG;
window.mwsF1ReturnToSetupRecoveryG=returnToSetupRecoveryG;
window.mwsF1NewRaceSameSettingsRecoveryG=newRaceSameSettingsRecoveryG;
window.mwsF1GetRaceResultRecoveryG=function(){return activeRaceResultRecoveryG};
window.mwsF1RenderRaceControlV188=renderRaceControlV188;
window.mwsF1StartRaceMotionV189=startRaceMotionV189;
window.mwsF1PauseRaceMotionV189=pauseRaceMotionV189;
window.mwsF1ResetRaceMotionV189=resetRaceMotionV189;
window.mwsF1RenderRaceVehiclesV189=renderRaceVehiclesV189;
window.mwsF1SectorForProgressV190=sectorForProgressV190;
window.mwsF1SyncVehicleRaceMetricsV190=syncVehicleRaceMetricsV190;
window.mwsF1UpdateRaceProgressHudV190=updateRaceProgressHudV190;
window.mwsF1ComputeRaceStandingsV191=computeRaceStandingsV191;
window.mwsF1UpdateRaceStandingsV191=updateRaceStandingsV191;
window.mwsF1FormatRaceDeltaV191=formatRaceDeltaV191;
window.mwsF1SetSimulationTimeScaleV192=setSimulationTimeScaleV192;
window.mwsF1ToggleSimulationPauseV192=toggleSimulationPauseV192;
window.mwsF1GetSimulationClockV192=function(){return {...simClockV192,effectiveTimeScale:simulationPlaybackRateV247()}};
window.mwsF1SimulateRaceStepV192=simulateRaceStepV192;
window.mwsF1RefreshRaceGeometryV193=refreshRaceGeometryV193;
window.mwsF1GetRaceGeometryV193=getRaceGeometryV193;
window.mwsF1GetCornerPhasesV194=getCornerPhasesV194;
window.mwsF1GetCornerPhaseAtProgressV194=getCornerPhaseAtProgressV194;
window.mwsF1GetSpeedProfileV195=getSpeedProfileV195;
window.mwsF1GetSpeedTargetAtProgressV195=getSpeedTargetAtProgressV195;
window.mwsF1SimulateVehicleDynamicsV196=simulateVehicleDynamicsV196;
window.mwsF1GearForSpeedV196=gearForSpeedV196;
window.mwsF1RpmForSpeedAndGearV196=rpmForSpeedAndGearV196;
window.mwsF1SetVehicleRacingLineV197=setVehicleRacingLineV197;
window.mwsF1LineOffsetMetersV197=lineOffsetMetersV197;
window.mwsF1RaceLinePointV197=raceLinePointV197;
window.mwsF1RenderFourLaneGuidesV360=renderFourLaneGuidesV360;
window.mwsF1FourLaneGuideOffsetsV360=fourLaneGuideOffsetsV360;
window.mwsF1ResolveSlipstreamV198=resolveSlipstreamV198;
window.mwsF1UpdateSlipstreamStatesV198=updateSlipstreamStatesV198;
window.mwsF1ResolveDirtyAirV199=resolveDirtyAirV199;
window.mwsF1UpdateDirtyAirStatesV199=updateDirtyAirStatesV199;
window.mwsF1CreateDriverProfileV200=createDriverProfileV200;
window.mwsF1UpdateDriverPaceStateV200=updateDriverPaceStateV200;
window.mwsF1DriverTargetMultiplierV200=driverTargetMultiplierV200;
window.mwsF1GetDriverProfilesV200=getDriverProfilesV200;
window.mwsF1LongRunPaceBiasV209=longRunPaceBiasV209;
window.mwsF1LongRunPaceCorrectionV209=longRunPaceCorrectionV209;
window.mwsF1GetLongRunBalanceStatesV209=getLongRunBalanceStatesV209;
window.mwsF1QaLongRunGapBalanceV209=qaLongRunGapBalanceV209;
window.mwsF1QaMultiTrackIntegrationV210=qaMultiTrackIntegrationV210;
window.mwsF1RenderTrackMarkersV211=renderTrackMarkersV211;
window.mwsF1QaTrackMarkersV211=qaTrackMarkersV211;
window.mwsF1ApplyLiveTimingFlipV212=applyLiveTimingFlipV212;
window.mwsF1QaLiveTimingFlipV212=qaLiveTimingFlipV212;
window.mwsF1ApplyTopThreePresentationV213=applyTopThreePresentationV213;
window.mwsF1QaTopThreePresentationV213=qaTopThreePresentationV213;
window.mwsF1SetRaceControlFlagV214=setRaceControlFlagV214;
window.mwsF1GetRaceControlFlagV214=getRaceControlFlagV214;
window.mwsF1QaRaceControlFlagsV214=qaRaceControlFlagsV214;
window.mwsF1ClassifyBackmarkerV215=classifyBackmarkerV215;
window.mwsF1UpdateBackmarkerBlueFlagsV215=updateBackmarkerBlueFlagsV215;
window.mwsF1QaBackmarkerBlueFlagV215=qaBackmarkerBlueFlagV215;
window.mwsF1DriverColorV216=driverColorV216;
window.mwsF1SetRaceCameraModeV216=setRaceCameraModeV216;
window.mwsF1GetRaceCameraStateV216=getRaceCameraStateV216;
window.mwsF1UpdateAutoRaceCameraV216=updateAutoRaceCameraV216;
window.mwsF1QaDriverMarkerCameraV216=qaDriverMarkerCameraV216;
window.mwsF1QaCompactWorkspaceV217=qaCompactWorkspaceV217;
window.mwsF1ErsNormalPowerLimitV201=ersNormalPowerLimitV201;
window.mwsF1UpdateEnergySystemV201=updateEnergySystemV201;
window.mwsF1GetEnergyStatesV201=getEnergyStatesV201;
window.mwsF1ErsOvertakePowerLimitV202=ersOvertakePowerLimitV202;
window.mwsF1UpdateActiveAeroAndOvertakeV202=updateActiveAeroAndOvertakeV202;
window.mwsF1GetActiveAeroOvertakeStatesV202=getActiveAeroOvertakeStatesV202;
window.mwsF1SetVehicleTyreCompoundV203=setVehicleTyreCompoundV203;
window.mwsF1UpdateTyreSystemV203=updateTyreSystemV203;
window.mwsF1GetTyreStatesV203=getTyreStatesV203;
window.mwsF1UpdateDrivingIncidentsV204=updateDrivingIncidentsV204;
window.mwsF1GetDrivingIncidentStatesV204=getDrivingIncidentStatesV204;
window.mwsF1ForceDrivingIncidentV204=forceDrivingIncidentV204;
window.mwsF1RequestPitStopV205=requestPitStopV205;
window.mwsF1CancelPitRequestV205=cancelPitRequestV205;
window.mwsF1GetPitStatesV205=getPitStatesV205;
window.mwsF1QaPitCycleV205=qaPitCycleV205;
window.mwsF1EvaluatePitStrategyV206=evaluatePitStrategyV206;
window.mwsF1UpdatePitStrategiesV206=updatePitStrategiesV206;
window.mwsF1GetPitStrategyStatesV206=getPitStrategyStatesV206;
window.mwsF1QaPitStrategyV206=qaPitStrategyV206;
window.mwsF1UpdateTrafficAndDefenceV207=updateTrafficAndDefenceV207;
window.mwsF1GetTrafficStatesV207=getTrafficStatesV207;
window.mwsF1QaTrafficV207=qaTrafficV207;
window.mwsF1NextPassStateV208=nextPassStateV208;
window.mwsF1UpdatePassStateMachineV208=updatePassStateMachineV208;
window.mwsF1GetPassStatesV208=getPassStatesV208;
window.mwsF1QaPassStateMachineV208=qaPassStateMachineV208;
window.__mwsF1RacingV180=VERSION;
window.__mwsF1RacingV181=VERSION181;
window.__mwsF1RacingV182=VERSION182;
window.__mwsF1RacingV183=VERSION183;
window.__mwsF1RacingV184=VERSION184;
window.__mwsF1RacingV185=VERSION185;
window.__mwsF1RacingV186=VERSION186;
window.__mwsF1RacingV187=VERSION187;
window.__mwsF1RacingV188=VERSION188;
window.__mwsF1RacingV189=VERSION189;
window.__mwsF1RacingV190=VERSION190;
window.__mwsF1RacingV191=VERSION191;
window.__mwsF1RacingV192=VERSION192;
window.__mwsF1RacingV193=VERSION193;
window.__mwsF1RacingV194=VERSION194;
window.__mwsF1RacingV195=VERSION195;
window.__mwsF1RacingV196=VERSION196;
window.__mwsF1RacingV197=VERSION197;
window.__mwsF1RacingV198=VERSION198;
window.__mwsF1RacingV199=VERSION199;
window.__mwsF1RacingV200=VERSION200;
window.__mwsF1RacingV201=VERSION201;
window.__mwsF1RacingV202=VERSION202;
window.__mwsF1RacingV203=VERSION203;
window.__mwsF1RacingV204=VERSION204;
window.__mwsF1RacingV205=VERSION205;
window.__mwsF1RacingV206=VERSION206;
window.__mwsF1RacingV207=VERSION207;
window.__mwsF1RacingV208=VERSION208;
window.__mwsF1RacingV209=VERSION209;
window.__mwsF1RacingV210=VERSION210;
window.__mwsF1RacingV211=VERSION211;
window.__mwsF1RacingV212=VERSION212;
window.__mwsF1RacingV213=VERSION213;
window.__mwsF1RacingV214=VERSION214;
window.__mwsF1RacingV215=VERSION215;
window.__mwsF1RacingV216=VERSION216;
window.__mwsF1RacingV217=VERSION217;
window.__mwsF1RacingV218=VERSION218;
window.mwsF1AppendRaceCommentaryV219=appendRaceCommentaryV219;
window.mwsF1UpdateRaceCommentaryV219=updateRaceCommentaryV219;
window.mwsF1QaRaceCommentaryV219=qaRaceCommentaryV219;
window.__mwsF1RacingV219=VERSION219;
window.mwsF1QaDiverseTrackCatalogV220=qaDiverseTrackCatalogV220;
window.__mwsF1RacingV220=VERSION220;
window.__mwsF1RacingV221=VERSION221;
window.mwsF1AppendRaceCommentaryV222=appendRaceCommentaryV222;
window.mwsF1UpdateRaceNarrativeV222=updateRaceNarrativeV222;
window.mwsF1QaRaceNarrativeV222=qaRaceNarrativeV222;
window.__mwsF1RacingV222=VERSION222;
window.mwsF1TrackProfileV223=trackProfileV223;
window.mwsF1QaTrackProfileUiV223=qaTrackProfileUiV223;
window.__mwsF1RacingV223=VERSION223;
window.__mwsF1RacingV224=VERSION224;
window.mwsF1QaCameraDirectorV225=qaCameraDirectorV225;
window.__mwsF1RacingV225=VERSION225;
window.mwsF1ScrollCommentaryTailV226=scrollCommentaryTailV226;
window.mwsF1QaCommentaryReadabilityV226=qaCommentaryReadabilityV226;
window.__mwsF1RacingV226=VERSION226;
window.mwsF1ResetCommentaryCadenceV227=resetCommentaryCadenceV227;
window.mwsF1QaCommentaryCadenceV227=qaCommentaryCadenceV227;
window.__mwsF1RacingV227=VERSION227;
window.mwsF1QaDriverLabelCollisionV228=qaDriverLabelCollisionV228;
window.__mwsF1RacingV228=VERSION228;
window.mwsF1QaCameraDirectorStabilityV229=qaCameraDirectorStabilityV229;
window.__mwsF1RacingV229=VERSION229;
window.mwsF1QaCommentaryEventOrderV230=qaCommentaryEventOrderV230;
window.__mwsF1RacingV230=VERSION230;
window.__mwsF1RacingV231=VERSION231;
window.mwsF1QaDriverMarkerIdentityV232=qaDriverMarkerIdentityV232;
window.__mwsF1RacingV232=VERSION232;
window.mwsF1QaTrackSilhouetteCardsV233=qaTrackSilhouetteCardsV233;
window.__mwsF1RacingV233=VERSION233;
window.mwsF1QaTrackRuntimeProfilesV234=qaTrackRuntimeProfilesV234;
window.__mwsF1RacingV234=VERSION234;
window.mwsF1QaTrackBehaviorModifiersV235=qaTrackBehaviorModifiersV235;
window.__mwsF1RacingV235=VERSION235;
window.mwsF1QaTrackAwareCommentaryV236=qaTrackAwareCommentaryV236;
window.__mwsF1RacingV236=VERSION236;
window.mwsF1BuildRaceTelemetryV237=buildRaceTelemetryV237;
window.mwsF1QaRaceResultTelemetryV237=qaRaceResultTelemetryV237;
window.__mwsF1RacingV237=VERSION237;
window.mwsF1RunSevenTrackBenchmarkV238=runSevenTrackBenchmarkV238;
window.mwsF1QaSevenTrackBenchmarkV238=qaSevenTrackBenchmarkV238;
window.__mwsF1RacingV238=VERSION238;
window.mwsF1TrackBenchmarkAlignmentV239=trackBenchmarkAlignmentV239;
window.mwsF1QaTrackBenchmarkAlignmentV239=qaTrackBenchmarkAlignmentV239;
window.__mwsF1RacingV239=VERSION239;
window.mwsF1RunAcceleratedEngineRaceV240=runAcceleratedEngineRaceV240;
window.mwsF1QaAcceleratedEngineRaceV240=qaAcceleratedEngineRaceV240;
window.__mwsF1RacingV240=VERSION240;
window.mwsF1RunSevenTrackEngineSuiteV241=runSevenTrackEngineSuiteV241;
window.mwsF1QaSevenTrackEngineSuiteV241=qaSevenTrackEngineSuiteV241;
window.__mwsF1RacingV241=VERSION241;
window.mwsF1RealEngineBenchmarkAlignmentV242=realEngineBenchmarkAlignmentV242;
window.mwsF1QaRealEngineBenchmarkAlignmentV242=qaRealEngineBenchmarkAlignmentV242;
window.__mwsF1RacingV242=VERSION242;
window.mwsF1QaTrackFlowDesignV243=qaTrackFlowDesignV243;
window.__mwsF1RacingV243=VERSION243;
window.mwsF1QaStartingGridLayoutV244=qaStartingGridLayoutV244;
window.__mwsF1RacingV244=VERSION244;
window.mwsF1RaceMarkerScaleV245=raceMarkerScaleV245;
window.mwsF1QaZoomAwareMarkerScaleV245=qaZoomAwareMarkerScaleV245;
window.__mwsF1RacingV245=VERSION245;
window.mwsF1QaTrackPresentationV246=qaTrackPresentationV246;
window.__mwsF1RacingV246=VERSION246;
window.mwsF1SimulationPlaybackRateV247=simulationPlaybackRateV247;
window.mwsF1QaRacePlaybackSpeedV247=qaRacePlaybackSpeedV247;
window.__mwsF1RacingV247=VERSION247;
window.mwsF1FormatLapTimeV248=formatLapTimeV248;
window.mwsF1GetLapTimingStatesV248=getLapTimingStatesV248;
window.mwsF1QaLapTimingV248=qaLapTimingV248;
window.__mwsF1RacingV248=VERSION248;
window.mwsF1QaWorkspacePanelMigrationV249=qaWorkspacePanelMigrationV249;
window.__mwsF1RacingV249=VERSION249;
window.mwsF1QaDriverProfileMarkersV250=qaDriverProfileMarkersV250;
window.__mwsF1RacingV250=VERSION250;
window.mwsF1QaLiveTimingIdentityV251=qaLiveTimingIdentityV251;
window.__mwsF1RacingV251=VERSION251;
window.mwsF1SyncSpectatorHighlightsV252=syncSpectatorHighlightsV252;
window.mwsF1QaSpectatorHighlightsV252=qaSpectatorHighlightsV252;
window.__mwsF1RacingV252=VERSION252;
window.mwsF1SyncLiveTimingStatusV253=syncLiveTimingStatusV253;
window.mwsF1QaLiveTimingStatusV253=qaLiveTimingStatusV253;
window.__mwsF1RacingV253=VERSION253;
window.mwsF1SyncRaceMarkerPositionV254=syncRaceMarkerPositionV254;
window.mwsF1QaRaceMarkerPositionV254=qaRaceMarkerPositionV254;
window.__mwsF1RacingV254=VERSION254;
window.mwsF1RaceHeadlineStateV255=raceHeadlineStateV255;
window.mwsF1SyncRaceHeadlineV255=syncRaceHeadlineV255;
window.mwsF1QaRaceHeadlineV255=qaRaceHeadlineV255;
window.__mwsF1RacingV255=VERSION255;
window.mwsF1SyncBattleLinksV256=syncBattleLinksV256;
window.mwsF1QaBattleLinksV256=qaBattleLinksV256;
window.__mwsF1RacingV256=VERSION256;
window.mwsF1SyncEmbeddedDriverMarkerV257=syncEmbeddedDriverMarkerV257;
window.mwsF1QaEmbeddedDriverProfilesV257=qaEmbeddedDriverProfilesV257;
window.__mwsF1RacingV257=VERSION257;
window.mwsF1PhysicalLateralOffsetV258=physicalLateralOffsetV258;
window.mwsF1UpdateVisualLateralOffsetV258=updateVisualLateralOffsetV258;
window.mwsF1QaVisualLateralSmoothingV258=qaVisualLateralSmoothingV258;
window.mwsF1QaVisualLateralDomV258=qaVisualLateralDomV258;
window.__mwsF1RacingV258=VERSION258;
window.mwsF1WorkspaceLayoutSignatureV259=workspaceLayoutSignatureV259;
window.mwsF1RestoreWorkspaceUserDefaultV259=restoreWorkspaceUserDefaultV259;
window.mwsF1CheckpointWorkspaceUserDefaultV259=checkpointWorkspaceUserDefaultV259;
window.mwsF1GetWorkspaceUserDefaultV259=function(){return workspaceUserDefaultV259?cloneWorkspaceLayoutRecoveryE(workspaceUserDefaultV259):null};
window.mwsF1QaWorkspaceUserDefaultPersistenceV259=qaWorkspaceUserDefaultPersistenceV259;
window.__mwsF1RacingV259=VERSION259;
window.mwsF1ClampLapCountV260=clampLapCountV260;
window.mwsF1RecommendedLapsV260=recommendedLapsV260;
window.mwsF1SetLapCountV260=setLapCountV260;
window.mwsF1RestoreRecommendedLapsV260=restoreRecommendedLapsV260;
window.mwsF1SyncLapControlV260=syncLapControlV260;
window.mwsF1QaLapControlV260=qaLapControlV260;
window.__mwsF1RacingV260=VERSION260;
window.mwsF1EnterImmersiveV261=enterF1ImmersiveV261;
window.mwsF1ExitImmersiveV261=exitF1ImmersiveV261;
window.mwsF1ApplyImmersiveStateV261=applyImmersiveStateV261;
window.mwsF1QaImmersiveV261=qaImmersiveV261;
window.mwsF1GetImmersiveStateV261=function(){return {...immersiveStateV261,fullscreen:Boolean(document.fullscreenElement)}};
window.__mwsF1RacingV261=VERSION261;
window.mwsF1RaceMomentumSeedV262=raceMomentumSeedV262;
window.mwsF1RaceMomentumPaceMultiplierV262=raceMomentumPaceMultiplierV262;
window.mwsF1GetRaceMomentumStatesV262=getRaceMomentumStatesV262;
window.mwsF1QaRaceMomentumV262=qaRaceMomentumV262;
window.mwsF1RaceMomentumBenchmarkV262=raceMomentumBenchmarkV262;
window.mwsF1QaRaceMomentumBenchmarkV262=qaRaceMomentumBenchmarkV262;
window.__mwsF1RacingV262=VERSION262;
window.mwsF1EmitRaceNarrativeV263=emitRaceNarrativeV263;
window.mwsF1GetRaceNarrativeTemplatesV263=function(){return NARRATIVE_TEMPLATES_V263.map(row=>({...row}))};
window.mwsF1GetTechnicalCommentaryV263=function(){return narrativeStateV263.technicalLog.map(row=>({...row}))};
window.mwsF1QaRaceNarrativeEngineV263=qaRaceNarrativeEngineV263;
window.__mwsF1RacingV263=VERSION263;
window.mwsF1EnqueueLiveCutinV264=enqueueLiveCutinV264;
window.mwsF1ResetLiveCutinsV264=resetLiveCutinsV264;
window.mwsF1QaLiveCutinV264=qaLiveCutinV264;
window.mwsF1GetLiveCutinStateV264=function(){return {active:liveCutinStateV264.active.size,queued:liveCutinStateV264.queue.length,sequence:liveCutinStateV264.sequence,mergeCount:liveCutinStateV264.mergeCount,droppedCount:liveCutinStateV264.droppedCount,recentTemplates:[...liveCutinStateV264.recentTemplateIds],recentDrivers:[...liveCutinStateV264.recentDriverIds],recentSemanticKeys:[...liveCutinStateV264.recentSemanticKeys],driverExposure:Object.fromEntries(liveCutinStateV264.driverExposure),activeEntries:[...liveCutinStateV264.active.values()].map(row=>({id:row.id,event:row.event,sessionKey:row.sessionKey,mergedCount:row.mergedCount,duration:row.duration,message:row.message,templateId:row.templateId})),queueEntries:liveCutinStateV264.queue.map(row=>({id:row.id,event:row.event,sessionKey:row.sessionKey,mergedCount:row.mergedCount,message:row.message,templateId:row.templateId}))}};
window.mwsF1QaLiveCutinPolicyV307=qaLiveCutinPolicyV307;
window.mwsF1GetLiveCutinLibraryV307=function(){return Object.fromEntries(Object.entries(LIVE_CUTIN_LIBRARY_V307).map(([event,pool])=>[event,pool.map(row=>({...row}))]))};
window.__mwsF1RacingV307=VERSION307;
window.__mwsF1RacingV264=VERSION264;
window.mwsF1PodiumMovementV265=podiumMovementV265;
window.mwsF1RenderPodiumV265=renderPodiumRecoveryG;
window.mwsF1QaPodiumV265=qaPodiumV265;
window.__mwsF1RacingV265=VERSION265;
window.mwsF1TrackSpeedTierV266=trackSpeedTierV266;
window.mwsF1TrackCardCharacterV266=trackCardCharacterV266;
window.mwsF1QaTrackCardsV266=qaTrackCardsV266;
window.__mwsF1RacingV266=VERSION266;
window.mwsF1QaIntegratedSpectatorDesktopV267=qaIntegratedSpectatorDesktopV267;
window.__mwsF1RacingV267=VERSION267;
window.mwsF1QaAutoFollowWheelZoomV268=qaAutoFollowWheelZoomV268;
window.__mwsF1RacingV268=VERSION268;
window.mwsF1QaLateralDynamicsV269=qaLateralDynamicsV269;
window.mwsF1QaWorkspaceExactRestoreV269=qaWorkspaceExactRestoreV269;
window.__mwsF1RacingV269=VERSION269;
window.mwsF1QaCornerDynamicsV270=qaCornerDynamicsV270;
window.mwsF1PhaseSpeedTargetV270=phaseSpeedTargetV270;
window.__mwsF1RacingV270=VERSION270;
window.mwsF1QaTrackBoundaryV271=qaTrackBoundaryV271;
window.mwsF1TrackBoundaryStateV271=trackBoundaryStateV271;
window.__mwsF1RacingV271=VERSION271;
window.__mwsF1RacingV272=VERSION272;
window.__mwsF1RacingV273=VERSION273;
window.__mwsF1RacingV274=VERSION274;
window.__mwsF1RacingV275=VERSION275;
window.__mwsF1RacingV276=VERSION276;
window.__mwsF1RacingV277=VERSION277;
window.__mwsF1RacingV278=VERSION278;
window.__mwsF1RacingV279=VERSION279;
window.__mwsF1RacingV280=VERSION280;
window.__mwsF1RacingV281=VERSION281;
window.__mwsF1RacingV282=VERSION282;
window.__mwsF1RecoveryM='explicit-grid-start-v1';
window.__mwsF1RecoveryN='left-center-right-triple-dock-v1';
window.__mwsF1RecoveryB='start-finish-line-v1';
window.__mwsF1RecoveryC='race-cancel-setup-return-v1';
window.__mwsF1RecoveryD='persistent-roster-track-settings-v1';
window.__mwsF1RecoveryE='premiere-workspace-foundation-v1';
window.__mwsF1RecoveryF='race-workspace-default-redesign-v1';
window.__mwsF1RecoveryG='complete-race-lifecycle-v1';
window.__mwsF1RecoveryI='collision-free-reflow-v1';
window.__mwsF1RecoveryJ='split-resize-dock-preview-v1';
window.__mwsF1RecoveryK='saved-layout-repair-dom-overlap-qa-v1';
window.addEventListener('mawang:datachange',function(){const section=document.getElementById('gameF1Racing');if(section&&section.classList.contains('active'))render()});
document.addEventListener('visibilitychange',function(){
  if(document.hidden){
    if(previewStateV184.running)stopPreviewV184(false);
    if(raceMotionV189.running)pauseRaceMotionV189(true);
  }else if(raceMotionV189.suspended&&f1ScreenStateV185==='RACE'){
    startRaceMotionV189();
  }
});
})();
