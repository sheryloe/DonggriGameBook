import json

def expand_items():
    file_path = 'codex_webgame_pack/data/inventory.items.json'
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_items = [
        # --- MEDICAL / STIMS ---
        {
            "item_id": "itm_med_morphine",
            "name": "군용 모르핀 자동주사기",
            "description": "즉각적인 고통 억제. 사용 시 체력이 일시적으로 회복되지만, 오염도가 소폭 증가한다.",
            "category": "consumable",
            "stack_size": 2,
            "weight": 0.1,
            "effects": [
                { "type": "modify_stat", "target": "hp", "value": 50 },
                { "type": "modify_stat", "target": "contamination", "value": 5 }
            ],
            "tags": ["medical", "stim", "rare"]
        },
        {
            "item_id": "itm_med_bandage_dirty",
            "name": "오염된 붕대",
            "description": "급한 지혈용. 감염 위험이 높다.",
            "category": "consumable",
            "stack_size": 5,
            "weight": 0.2,
            "effects": [
                { "type": "modify_stat", "target": "hp", "value": 15 },
                { "type": "modify_stat", "target": "contamination", "value": 2 }
            ],
            "tags": ["medical", "common"]
        },
        {
            "item_id": "itm_stim_adrenaline",
            "name": "아드레날린 에피펜",
            "description": "한계 돌파. 스태미나(행동력)를 극한으로 끌어올리나, 사용 후 극심한 부작용이 동반된다.",
            "category": "consumable",
            "stack_size": 1,
            "weight": 0.1,
            "effects": [],
            "tags": ["medical", "stim", "epic"]
        },

        # --- WEAPON PARTS & AMMO ---
        {
            "item_id": "itm_ammo_9mm",
            "name": "9x19mm 파라벨럼 탄",
            "description": "가장 흔한 권총탄. 블랙마켓에서 화폐 대용으로도 쓰인다.",
            "category": "ammo",
            "stack_size": 60,
            "weight": 0.5,
            "effects": [],
            "tags": ["ammo", "currency"]
        },
        {
            "item_id": "itm_part_silencer",
            "name": "사제 소음기",
            "description": "발사 소음을 극적으로 줄여주지만, 내구도가 약해 몇 번 쏘면 망가진다.",
            "category": "attachment",
            "stack_size": 1,
            "weight": 0.8,
            "effects": [],
            "tags": ["weapon_part", "stealth"]
        },
        {
            "item_id": "itm_part_optic",
            "name": "깨진 홀로그래픽 사이트",
            "description": "렌즈가 깨져 조준이 어렵지만, 없는 것보다는 낫다.",
            "category": "attachment",
            "stack_size": 1,
            "weight": 0.3,
            "effects": [],
            "tags": ["weapon_part"]
        },

        # --- HIGH TIER LOOT (BARTER / SELL) ---
        {
            "item_id": "itm_val_gold_watch",
            "name": "롤렉스 금시계",
            "description": "멸망 전 부의 상징. 이제는 그저 무거운 금속 덩어리지만 상인들은 좋아한다.",
            "category": "barter",
            "stack_size": 1,
            "weight": 0.5,
            "effects": [],
            "tags": ["valuable", "barter"]
        },
        {
            "item_id": "itm_val_ssd",
            "name": "암호화된 군용 SSD",
            "description": "독도 아크의 기밀 데이터가 들어있을지 모르는 저장매체. 매우 희귀하다.",
            "category": "intel",
            "stack_size": 1,
            "weight": 0.2,
            "effects": [],
            "tags": ["valuable", "intel", "quest"]
        },
        {
            "item_id": "itm_val_gpu",
            "name": "고성능 그래픽 카드",
            "description": "과거 가상화폐 채굴에 쓰이던 물건. 베이스캠프 전산망 복구에 쓰인다.",
            "category": "barter",
            "stack_size": 1,
            "weight": 2.5,
            "effects": [],
            "tags": ["valuable", "heavy"]
        },

        # --- SURVIVAL UTILITY ---
        {
            "item_id": "itm_util_flare",
            "name": "비상 신호탄",
            "description": "붉은빛을 내뿜어 주변의 시선을 끈다. 탈출 헬기를 부를 때 필수적이다.",
            "category": "tool",
            "stack_size": 2,
            "weight": 0.5,
            "effects": [
                { "type": "modify_stat", "target": "noise", "value": 10 }
            ],
            "tags": ["tool", "extraction"]
        },
        {
            "item_id": "itm_util_lockpick",
            "name": "티타늄 락픽 세트",
            "description": "단순한 자물쇠부터 보안 패널까지 뜯을 수 있다. 사용 시 소음이 발생한다.",
            "category": "tool",
            "stack_size": 3,
            "weight": 0.1,
            "effects": [],
            "tags": ["tool", "stealth"]
        },
        {
            "item_id": "itm_util_geiger",
            "name": "소형 가이거 계수기",
            "description": "오염도가 높은 구역을 미리 감지해 경고음을 낸다. 필수 생존 장비.",
            "category": "gear",
            "stack_size": 1,
            "weight": 0.6,
            "effects": [],
            "tags": ["gear", "sensor"]
        },

        # --- JUNK & CRAFTING MATERIALS ---
        {
            "item_id": "itm_junk_duct_tape",
            "name": "공업용 덕트 테이프",
            "description": "만능 수리 도구. 무기 부착물을 임시로 고정할 때 쓴다.",
            "category": "material",
            "stack_size": 10,
            "weight": 0.1,
            "effects": [],
            "tags": ["crafting"]
        },
        {
            "item_id": "itm_junk_screws",
            "name": "녹슨 나사못 한 줌",
            "description": "제작대의 기본 재료.",
            "category": "material",
            "stack_size": 50,
            "weight": 0.5,
            "effects": [],
            "tags": ["crafting"]
        },
        {
            "item_id": "itm_junk_wires",
            "name": "구리 전선 다발",
            "description": "전자 기기 수리 및 IED 제작에 필요한 부품.",
            "category": "material",
            "stack_size": 10,
            "weight": 0.8,
            "effects": [],
            "tags": ["crafting"]
        },
        {
            "item_id": "itm_junk_bleach",
            "name": "공업용 표백제",
            "description": "독성이 강한 화학물질. 오염된 장비를 세척하거나 독성 무기를 만들 때 쓰인다.",
            "category": "material",
            "stack_size": 2,
            "weight": 1.5,
            "effects": [],
            "tags": ["crafting", "chemical"]
        },

        # --- KEYS & ACCESS CARDS ---
        {
            "item_id": "itm_key_red_card",
            "name": "적색 보안 키카드 (Red Card)",
            "description": "문정동 지하 물류센터의 최고 보안 구역을 열 수 있는 전설의 카드.",
            "category": "key",
            "stack_size": 1,
            "weight": 0.1,
            "effects": [],
            "tags": ["key", "legendary"]
        },
        {
            "item_id": "itm_key_subway",
            "name": "지하철 스크린도어 마스터키",
            "description": "여의도-잠실을 잇는 어둠의 터널 노선을 개방할 때 사용한다.",
            "category": "key",
            "stack_size": 1,
            "weight": 0.2,
            "effects": [],
            "tags": ["key", "rare"]
        }
    ]

    existing_ids = [item['item_id'] for item in data['items']]
    count = 0
    for new_item in new_items:
        if new_item['item_id'] not in existing_ids:
            data['items'].append(new_item)
            count += 1

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully added {count} new hardcore items.")

if __name__ == "__main__":
    expand_items()
