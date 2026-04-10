# UI Flow Overview (CH01~CH20)

## 공통 화면 계층
1. `chapter_briefing`
2. `route_select` / `safehouse`
3. `world_map`
4. `event_dialogue`
5. `loot_resolution`
6. `boss_intro` -> `combat_arena`
7. `result_summary`

## Part별 디자인 리듬
- **P2 남하 회랑:** 적색 경고등, 젖은 콘크리트, 차단봉, 좁은 통로, 군중 압박
- **P3 동해 격리선:** 푸른 응급등, 백색 서리, 철골, 넓은 음영, 구조 기록 보드
- **P4 외해 관문:** 염분 바람, 새벽 회색, 수기 명단, 방송 장비, 공공 배급 보드

## 신규 장 전용 위젯
- **CH06 하강 관문:** checkpoint_priority, route_compare, crowd_pressure
- **CH07 적색 회랑:** red_line_alarm, escort_manifest, pursuit_meter
- **CH08 봉쇄선의 방:** stamp_auth, queue_record, betrayal_trace
- **CH09 연기 저장고:** smoke_density, cargo_split, respirator_status
- **CH10 침하 항만:** tide_depth, cargo_crane_risk, boarding_slot
- **CH11 철의 우회:** rail_switch_map, cold_exposure, route_weight
- **CH12 잔향 기지:** signal_decoder, archive_trace, frequency_map
- **CH13 백색 야적장:** freeze_meter, evidence_balance, cargo_temperature
- **CH14 해무 변전소:** fog_density, power_router, line_priority
- **CH15 격리 파수:** checkpoint_auth, breaker_load, sacrifice_state
- **CH16 균열 사구:** loss_loadout, rope_stability, salt_exposure
- **CH17 파편 수문:** floodgate_pressure, boarding_manifest, corrosion_meter
- **CH18 소금 정거장:** public_queue, ration_balance, broadcast_prep
- **CH19 외해 전초:** platform_vote, auth_stack, storm_pressure
- **CH20 독도의 문:** core_state, ending_matrix, record_release
