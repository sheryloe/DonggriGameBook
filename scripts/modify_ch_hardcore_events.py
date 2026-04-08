import json

def update_events():
    # Add new hardcore events to CH01
    file_path = 'codex_webgame_pack/data/chapters/ch01.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. EV_CH01_LOBBY_SCAVENGE (로비 파밍)
    if not any(e['event_id'] == 'EV_CH01_LOBBY_SCAVENGE' for e in data['events']):
        data['events'].append({
            "event_id": "EV_CH01_LOBBY_SCAVENGE",
            "type": "story",
            "title": "로비 잡동사니 수색",
            "description": "운이 좋다면 방송동 로비 구석에서 은축전지나 깨진 전구를 주울 수 있다. 하지만 소리를 내면 감염체가 몰려온다.",
            "choices": [
                {
                    "choice_id": "c_scavenge_safe",
                    "text": "조심스럽게 수색한다. (시간 소요, 소음 없음)",
                    "requires": [],
                    "effects": [
                        { "op": "modify_stat", "target": "time", "value": -2 },
                        { "op": "grant_item", "target": "item:itm_silver_battery", "value": 1 }
                    ],
                    "next_event_id": None
                },
                {
                    "choice_id": "c_scavenge_fast",
                    "text": "주변을 부수며 빠르게 뒤진다. (시간 절약, 소음 크게 증가)",
                    "requires": [],
                    "effects": [
                        { "op": "modify_stat", "target": "noise", "value": 5 },
                        { "op": "grant_item", "target": "item:itm_silver_battery", "value": 2 },
                        { "op": "grant_item", "target": "item:itm_broken_bulb", "value": 3 }
                    ],
                    "next_event_id": "EV_CH01_ELITE_AMBUSH"
                }
            ]
        })

    # 2. EV_CH01_ELITE_AMBUSH (엘리트 스폰 함정)
    if not any(e['event_id'] == 'EV_CH01_ELITE_AMBUSH' for e in data['events']):
        data['events'].append({
            "event_id": "EV_CH01_ELITE_AMBUSH",
            "type": "combat",
            "title": "소음에 이끌린 엘리트 감염체",
            "description": "너무 큰 소리를 냈다. '편집괴'의 파편 중 하나가 끔찍한 속도로 다가온다. 싸우는 것은 자살 행위다.",
            "enemy_id": "enm_ch01_elite_fragment",
            "combat_type": "boss",
            "choices": [
                {
                    "choice_id": "c_run_away",
                    "text": "가진 것을 일부 버리고 필사적으로 도망친다! (체력 피해, 소음 초기화)",
                    "requires": [],
                    "effects": [
                        { "op": "modify_stat", "target": "hp", "value": -30 },
                        { "op": "modify_stat", "target": "noise", "value": -5 }
                    ],
                    "next_event_id": None
                }
            ]
        })

    # 노드에 이벤트 연결
    for node in data['nodes']:
        if node['node_id'] == 'YD-03': # 로비
            if 'EV_CH01_LOBBY_SCAVENGE' not in node['event_ids']:
                node['event_ids'].append('EV_CH01_LOBBY_SCAVENGE')

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    update_events()
