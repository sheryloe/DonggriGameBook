import json

def expand_scenario():
    file_path = 'codex_webgame_pack/data/chapters/ch02.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # BW-01 is Hub. BW-03, 04 are high contamination. BW-05 is Black Market.
    for node in data['nodes']:
        if node['node_id'] == 'BW-03':
            node['description'] += " [위험 구역] 오염도가 매우 높다. 오래 머물 수 없으니 방독면이 없다면 즉각 귀환해야 한다."
        if node['node_id'] == 'BW-05':
            node['description'] += " [블랙 마켓] 여의도에서 파밍한 자원을 방독면 필터와 항생제로 교환할 수 있는 곳."

    # Update connections to require items for deep areas
    for node in data['nodes']:
        if node['node_id'] == 'BW-04':
            # return to BW-03
            if not any(c['to'] == 'BW-03' for c in node['connections']):
                node['connections'].append({
                    "to": "BW-03",
                    "travel_type": "walk",
                    "requires": [],
                    "cost": { "time": 1, "noise": 1, "contamination": 2 }
                })
        if node['node_id'] == 'BW-06':
             for conn in node['connections']:
                if conn['to'] == 'BW-07':
                    conn['requires'].append("item:itm_drain_key>=1")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    expand_scenario()
