# Canonical ID Spine and Alias Policy

## 1. Canonical IDs (Fixed)

- Arc: `ARC-01-05`
- Chapter: `ARC01-CH01` ~ `ARC01-CH05`
- Node: `ARC01-CHxx-ND-*`
- NPC: `NPC-*`
- Foreshadow: `FS-*`

## 2. Regex Contract

- Arc: `^ARC-\d{2}-\d{2}$`
- Chapter: `^ARC\d{2}-CH\d{2}$`
- Node: `^ARC\d{2}-CH\d{2}-ND-[A-Z0-9-]+$`
- NPC: `^NPC-[A-Z0-9-]+$`
- Foreshadow: `^FS-\d{2}-\d{3}$`

## 3. Alias Mapping Rule

- Existing JSON IDs and legacy names are preserved as `alias`.
- Canonical ID is immutable once `Locked`.
- Alias can be appended only via `Change Requests`.

## 4. Alias Mapping Table (Starter)

| canonical_id | alias_type | alias_value | source_doc |
|---|---|---|---|
| ARC01-CH01 | chapter_id | CH01 | docs/concept_arc_01_05_md/CHAPTER_01_잿빛_개장.md |
| ARC01-CH02 | chapter_id | CH02 | docs/concept_arc_01_05_md/CHAPTER_02_검은_수로.md |
| ARC01-CH03 | chapter_id | CH03 | docs/concept_arc_01_05_md/CHAPTER_03_유리정원.md |
| ARC01-CH04 | chapter_id | CH04 | docs/concept_arc_01_05_md/CHAPTER_04_상자들의_도시.md |
| ARC01-CH05 | chapter_id | CH05 | docs/concept_arc_01_05_md/CHAPTER_05_미러센터.md |

## 5. Card Templates (Public / Internal)

### Public Card Template

```md
# [PUBLIC] <canonical_id> <title>

- Public Summary:
- Allowed Exposure:
- Related Chapter:
- Public Links:
```

### Internal Card Template

```md
# [INTERNAL] <canonical_id> <title>

- Canon Status:
- Continuity Risks:
- Dependency Chain:
- Decision Log:
- Change Request Links:
```

## 6. Canon Sources (Fixed)

- `docs/concept_arc_01_05_md/MASTER_PACK_01_05.md`
- `docs/world/main-npc-cast.md`
- `docs/world/world-audit-yeouido-jamsil-ikea.md`

Any canon change must be proposed through `Change Requests` first.
