import json

def refine_ch01():
    file_path = 'codex_webgame_pack/data/chapters/ch01.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. 숏컷 탈출 루트 (로프 사용) 이벤트 추가
    rope_escape_event = {
        "event_id": "EV_CH01_ROPE_ESCAPE",
        "type": "story",
        "title": "옥상 헬기장 탈출",
        "description": "헬기장에 도달했다. 계단은 끊어졌지만, 전술 레펠 로프가 있다면 안전하게 지상으로 내려가 베이스캠프로 복귀할 수 있다.",
        "choices": [
            {
                "choice_id": "c_use_rope",
                "text": "레펠 로프를 사용하여 탈출한다. (챕터 1 목표달성 시 귀환)",
                "requires": ["item:itm_escape_rope>=1", "item:itm_shortwave_amplifier>=1"],
                "effects": [
                    { "op": "remove_item", "target": "item:itm_escape_rope", "value": 1 },
                    { "op": "set_flag", "target": "flag:chapter_01_completed", "value": True },
                    { "op": "modify_stat", "target": "noise", "value": -100 } # reset noise
                ],
                "next_event_id": "EV_CH01_CLEARED"
            },
            {
                "choice_id": "c_no_rope",
                "text": "로프가 없다. 혹은 퀘스트 템이 없다. 걸어서 돌아가야 한다.",
                "requires": [],
                "effects": [],
                "next_event_id": None
            }
        ]
    }

    # 2. 강제 무력 돌파 루트 (침수 자료실)
    dark_room_event = {
        "event_id": "EV_CH01_DARK_ROOM_RUSH",
        "type": "story",
        "title": "침수 자료실 진입",
        "description": "빛 하나 없는 칠흑의 공간. 손전등이 있다면 은밀하게 목표를 찾을 수 있지만, 없다면 닥치는대로 부수며 찾아야 한다.",
        "choices": [
            {
                "choice_id": "c_stealth_search",
                "text": "손전등을 켜고 은밀히 수색한다. (단파 증폭기 획득)",
                "requires": ["item:itm_flashlight>=1"],
                "effects": [
                    { "op": "modify_stat", "target": "battery_charge", "value": -20 },
                    { "op": "grant_item", "target": "item:itm_shortwave_amplifier", "value": 1 }
                ],
                "next_event_id": None
            },
            {
                "choice_id": "c_brute_force",
                "text": "어둠 속을 더듬으며 강제로 물건을 빼낸다. (소음 폭발, HP 감소, 증폭기 획득)",
                "requires": [],
                "effects": [
                    { "op": "modify_stat", "target": "hp", "value": -30 },
                    { "op": "modify_stat", "target": "noise", "value": 15 }, # Guaranteed Elite Spawn Trigger
                    { "op": "grant_item", "target": "item:itm_shortwave_amplifier", "value": 1 }
                ],
                "next_event_id": "EV_CH01_ELITE_AMBUSH"
            }
        ]
    }

    # 3. 챕터 클리어 브리핑 이벤트
    clear_event = {
         "event_id": "EV_CH01_CLEARED",
         "type": "story",
         "title": "임무 완수: 잿빛 개장",
         "description": "단파 증폭기를 무사히 회수했다. 이제 다음 구역인 검은 수로(CH02)로 나아갈 수 있다.",
         "choices": [
             {
                 "choice_id": "c_extract",
                 "text": "베이스캠프로 무사 귀환",
                 "requires": [],
                 "effects": [
                     { "op": "set_flag", "target": "flag:chapter_01_completed", "value": True }
                 ],
                 "next_event_id": None
             }
         ]
    }

    # 이벤트 삽입
    new_events = [rope_escape_event, dark_room_event, clear_event]
    existing_ids = [e['event_id'] for e in data['events']]
    for ne in new_events:
        if ne['event_id'] not in existing_ids:
            data['events'].append(ne)

    # 노드와 이벤트 연결
    for node in data['nodes']:
        if node['node_id'] == 'YD-08': # 헬기장 탈출구
            if 'EV_CH01_ROPE_ESCAPE' not in node['event_ids']:
                node['event_ids'].append('EV_CH01_ROPE_ESCAPE')
        if node['node_id'] == 'YD-04': # 침수 자료실
            if 'EV_CH01_DARK_ROOM_RUSH' not in node['event_ids']:
                node['event_ids'].append('EV_CH01_DARK_ROOM_RUSH')
            # 손전등 없이도 들어갈 수는 있게 하되, 이벤트에서 분기가 갈리게 연결 변경
            for conn in node['connections']:
                if "item:itm_flashlight>=1" in conn['requires']:
                    conn['requires'].remove("item:itm_flashlight>=1")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    refine_ch01()
