import json

def add_quests():
    file_path = 'codex_webgame_pack/data/stats.registry.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 퀘스트 진행도 및 빌런 상태 추적용 플래그 추가
    new_flags = [
        {"key": "quest.main.ch01.status", "type": "string", "default": "unassigned"},
        {"key": "quest.merchant.yoon.01", "type": "string", "default": "unassigned"},
        {"key": "villain.butcher.encounter", "type": "number", "default": 0},
        {"key": "villain.butcher.defeated", "type": "boolean", "default": False}
    ]

    existing_keys = [s['key'] for s in data['stats']]
    for nf in new_flags:
        if nf['key'] not in existing_keys:
            data['stats'].append(nf)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def add_story_events_ch02():
    file_path = 'codex_webgame_pack/data/chapters/ch02.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    villain_event = {
        "event_id": "EV_CH02_VILLAIN_BUTCHER",
        "type": "story",
        "title": "수로의 도살자 조우",
        "description": "어둠 속에서 거대한 그림자가 일어선다. 무수히 많은 방독면을 목걸이처럼 엮어 건 거구의 사내, 블랙마켓의 변절자 '도살자'다. 그는 당신의 방독면을 노리고 있다.",
        "choices": [
            {
                "choice_id": "c_butcher_fight",
                "text": "총을 뽑아든다. (보스전 돌입)",
                "requires": [],
                "effects": [
                    { "op": "set_flag", "target": "flag:villain.butcher.encounter", "value": 1 }
                ],
                "next_event_id": "EV_CH02_VILLAIN_BUTCHER_COMBAT"
            },
            {
                "choice_id": "c_butcher_run",
                "text": "가진 귀중품을 던지고 필사적으로 도망친다. (아이템 상실, 체력 피해)",
                "requires": ["item:itm_val_gold_watch>=1"],
                "effects": [
                    { "op": "remove_item", "target": "item:itm_val_gold_watch", "value": 1 },
                    { "op": "modify_stat", "target": "hp", "value": -20 }
                ],
                "next_event_id": None
            }
        ]
    }

    if not any(e['event_id'] == 'EV_CH02_VILLAIN_BUTCHER' for e in data['events']):
        data['events'].append(villain_event)

    # BW-04 심층 구역에 확률/조건부 등장 연결
    for node in data['nodes']:
        if node['node_id'] == 'BW-04':
             if 'EV_CH02_VILLAIN_BUTCHER' not in node['event_ids']:
                 node['event_ids'].append('EV_CH02_VILLAIN_BUTCHER')

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    add_quests()
    add_story_events_ch02()
