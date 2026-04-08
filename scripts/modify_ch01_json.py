import json

def expand_scenario():
    file_path = 'codex_webgame_pack/data/chapters/ch01.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Add Flashlight requirement to YD-04 (침수 자료실)
    for node in data['nodes']:
        if node['node_id'] == 'YD-03': # 방송동 로비
            # Ensure it can go to YD-04
            pass

        # Make YD-04 require 'itm_flashlight'
        if node['node_id'] == 'YD-04':
            node['description'] = "[암흑 구역] 빛이 전혀 들지 않는 지하 자료실. 내부를 탐색하려면 강력한 광원이 필요하다."

    # Update connections
    for node in data['nodes']:
        if node['node_id'] == 'YD-03':
            for conn in node['connections']:
                if conn['to'] == 'YD-04':
                    # Add requires item condition
                    conn['requires'].append("item:itm_flashlight>=1")

        # Allow return from YD-04, 05, etc. to earlier nodes to form a loop
        if node['node_id'] == 'YD-04':
            # return to YD-03
            if not any(c['to'] == 'YD-03' for c in node['connections']):
                node['connections'].append({
                    "to": "YD-03",
                    "travel_type": "walk",
                    "requires": [],
                    "cost": { "time": 1, "noise": 1, "contamination": 2 }
                })

        if node['node_id'] == 'YD-02':
            # return to YD-01 (Hub)
            if not any(c['to'] == 'YD-01' for c in node['connections']):
                node['connections'].append({
                    "to": "YD-01",
                    "travel_type": "walk",
                    "requires": [],
                    "cost": { "time": 1, "noise": 0, "contamination": 0 }
                })

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    expand_scenario()
