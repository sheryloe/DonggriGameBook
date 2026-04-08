import json

def verify():
    with open('codex_webgame_pack/data/inventory.items.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Total items in registry: {len(data['items'])}")

    categories = {}
    for item in data['items']:
        cat = item.get('category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1

    for cat, count in categories.items():
        print(f"  - {cat}: {count} items")

if __name__ == "__main__":
    verify()
