import json

def apply_hardcore_mechanics():
    # CH01 하드코어 맵 연결 변경
    file_path = 'codex_webgame_pack/data/chapters/ch01.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Add new Exit Node and Hardcore routes
    has_exit = False
    for node in data['nodes']:
        if node['node_id'] == 'YD-08':
            has_exit = True
            node['node_type'] = 'exit'
            node['description'] = "[탈출구] 헬기 착륙장. 이곳을 통해 획득한 아이템을 가지고 안전하게 귀환할 수 있다. 로프가 필요하다."

        if node['node_id'] == 'YD-03': # 로비
            # Add secret connection to director's room
            if not any(c['to'] == 'YD-99' for c in node['connections']):
                node['connections'].append({
                    "to": "YD-99",
                    "travel_type": "breach",
                    "requires": ["item:itm_director_key>=1"],
                    "cost": { "time": 1, "noise": 3, "contamination": 0 }
                })

    # Add Director Room
    if not any(n['node_id'] == 'YD-99' for n in data['nodes']):
        data['nodes'].append({
            "node_id": "YD-99",
            "name": "국장실 (마크방)",
            "node_type": "loot",
            "description": "굳게 잠겨있던 최고위층의 방. 엄청난 가치의 물자(의약품, 금괴)가 보존되어 있다.",
            "connections": [
                {
                    "to": "YD-03",
                    "travel_type": "walk",
                    "requires": [],
                    "cost": { "time": 1, "noise": 0, "contamination": 0 }
                }
            ],
            "loot_table_ids": ["loot_high_value_medical"]
        })

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


    # CH02 하드코어 (오염 킬존)
    file_path2 = 'codex_webgame_pack/data/chapters/ch02.json'
    with open(file_path2, 'r', encoding='utf-8') as f:
        data2 = json.load(f)

    for node in data2['nodes']:
        if node['node_id'] == 'BW-03': # 수몰 터널
             node['description'] += " [킬존] 오염도 급증 구역. 방독면 필터가 없다면 진입하지 마라."
             for conn in node['connections']:
                 # Going deeper costs heavy contamination
                 conn['cost']['contamination'] = 15

    with open(file_path2, 'w', encoding='utf-8') as f:
        json.dump(data2, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    apply_hardcore_mechanics()
