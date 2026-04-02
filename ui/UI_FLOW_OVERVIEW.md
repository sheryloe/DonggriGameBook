# UI Flow Overview (CH01~CH05)

## 공통 화면 계층
1. **chapter_briefing**
   - 임무 목표, 권장 장비, 챕터별 특수 위험을 노출
2. **world_map**
   - 노드 선택, 이동 비용, 특수 오버레이(수심/층/열/노선) 표시
3. **event_dialogue / choice**
   - 서사 이벤트, 분기 선택, 신뢰/평판 변화
4. **loot_resolution**
   - 루팅 결과, 인벤토리 압박, 오버웨이트/오염 처리
5. **boss_intro**
   - 보스 기믹과 위험 요소 선고지
6. **combat_arena**
   - 전투 HUD, 특수 미터, 이동/기믹 상호작용
7. **result_summary**
   - 챕터 종료 결과, 다음 장 해금, 후속 변수 요약

## 챕터별 핵심 위젯
- **CH01:** `noise_meter`, `contamination_meter`, `tutorial_movement`
- **CH02:** `water_depth`, `route_compare`, `wet_item_badge`
- **CH03:** `floor_navigator`, `power_router`, `fall_warning`
- **CH04:** `line_status`, `card_auth_state`, `hazard_overlay`
- **CH05:** `heat_meter`, `signal_decoder`, `signal_noise_overlay`

## 구현 메모
- 이벤트 텍스트는 서버에서 내려주는 JSON을 그대로 렌더하고, UI는 `presentation.layout`과 `widget_overrides`에 따라 화면 조합을 바꾸는 쪽이 관리가 쉽다.
- 노드 선택 → 이벤트 진입 → 루팅/전투 → 결과 정산의 공통 루프는 동일하게 유지하고, 챕터마다 특수 오버레이만 추가하는 구조가 프론트엔드 난이도를 낮춘다.
- `conditions` 문자열은 DSL처럼 해석해도 되고, Codex로 파서/validator를 생성해도 된다.
