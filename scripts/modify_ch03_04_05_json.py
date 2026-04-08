import json

def update_json(file_path, logic_func):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logic_func(data)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def modify_ch03(data):
    for node in data['nodes']:
        if node['node_id'] == 'GG-05':
            for conn in node['connections']:
                if conn['to'] == 'GG-06':
                    conn['requires'].append("item:itm_elevator_module>=1")

def modify_ch04(data):
    for node in data['nodes']:
        if node['node_id'] == 'LC-03':
            for conn in node['connections']:
                if conn['to'] == 'LC-04':
                    conn['requires'].append("item:itm_heavy_battery>=1")

def modify_ch05(data):
    for node in data['nodes']:
        if node['node_id'] == 'MC-04':
            for conn in node['connections']:
                if conn['to'] == 'MC-05':
                    conn['requires'].append("flag:server_1_hacked")
                    conn['requires'].append("flag:server_2_hacked")

update_json('codex_webgame_pack/data/chapters/ch03.json', modify_ch03)
update_json('codex_webgame_pack/data/chapters/ch04.json', modify_ch04)
update_json('codex_webgame_pack/data/chapters/ch05.json', modify_ch05)
