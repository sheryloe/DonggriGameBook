import json

def add_hardcore_items():
    file_path = 'codex_webgame_pack/data/inventory.items.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_items = [
        {
            "item_id": "itm_flashlight",
            "name": "군용 손전등",
            "description": "어두운 구역(침수 자료실 등)을 탐색하기 위한 필수 장비. 배터리 소모가 심하다.",
            "category": "tool",
            "stack_size": 1,
            "weight": 1.0,
            "effects": [
                { "type": "modify_stat", "target": "battery_charge", "value": -10 }
            ],
            "tags": ["light_source"]
        },
        {
            "item_id": "itm_director_key",
            "name": "국장실 마스터키",
            "description": "KBS 폐방송동 국장실(마크방)을 열 수 있는 전설적인 열쇠. 매우 희귀하다.",
            "category": "key",
            "stack_size": 1,
            "weight": 0.1,
            "effects": [],
            "tags": ["key", "high_value"]
        },
        {
            "item_id": "itm_escape_rope",
            "name": "전술 레펠 로프",
            "description": "헬기 착륙장이나 끊어진 엘리베이터 통로에서 탈출/숏컷을 만드는데 사용된다. 1회용.",
            "category": "tool",
            "stack_size": 1,
            "weight": 2.0,
            "effects": [],
            "tags": ["escape", "shortcut"]
        },
        {
            "item_id": "itm_gasmask_filter",
            "name": "여분 방독면 필터",
            "description": "고농도 오염 구역(수몰지)에서 오염을 정화한다. 소모품.",
            "category": "consumable",
            "stack_size": 3,
            "weight": 0.5,
            "effects": [
                { "type": "modify_stat", "target": "filter_integrity", "value": 100 }
            ],
            "tags": ["survival", "filter"]
        },
        {
            "item_id": "itm_secure_pouch",
            "name": "보안 컨테이너 (1칸)",
            "description": "죽어도 절대 떨어뜨리지 않는 마법의 주머니. 가장 귀중한 열쇠나 디스크를 보관하라.",
            "category": "container",
            "stack_size": 1,
            "weight": 0.0,
            "effects": [],
            "tags": ["secure"]
        }
    ]

    # append if not exists
    existing_ids = [item['item_id'] for item in data['items']]
    for new_item in new_items:
        if new_item['item_id'] not in existing_ids:
            data['items'].append(new_item)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    add_hardcore_items()
