# Canon Operating Model (Airtable + Linear)

## 1. Scope and Ownership

- Canon source of truth: Airtable
- Execution tracker: Linear
- Runtime dependency: none (game runtime must not call Airtable/Linear)
- Effective date: 2026-04-04

## 2. Airtable Tables (Fixed 6)

1. `Chapters`
2. `NPCs`
3. `World Elements`
4. `Foreshadow Threads`
5. `Story Beats`
6. `Change Requests`

## 3. Required Fields (all syncable records)

- `canonical_id`
- `title`
- `status`
- `owner`
- `chapter_ref`
- `links_echo`
- `source_doc`

## 4. Status Gate

- `Approved` before Linear creation is mandatory.
- `Continuity Review` is mandatory before closing chapter-level work.
- After `Locked`, all modifications must be submitted as `Change Requests`.

### Sync eligibility

- Only these statuses are syncable to Linear:
  - `Approved`
  - `In Production`
  - `Locked`

## 5. Linear Modeling Rules

- Epic: Arc level (`ARC-01-05`)
- Issue: Chapter/NPC/World/Foreshadow thread level
- Sub-issue: Node/Choice/Payoff level
- Labels:
  - `chapter`
  - `npc`
  - `world`
  - `foreshadow`
  - `continuity`
  - `canon-change`

## 6. Status Mapping (Airtable -> Linear)

- `Approved -> Todo`
- `In Production -> In Progress`
- `Locked -> Done`

## 7. Operational Sequence

1. Update Airtable canon record.
2. Run CSV Gate Sync validation.
3. If rejected rows exist, block sync and fix data.
4. Use approved payload to create/update Linear issues.
5. Keep `links_echo` back-reference between systems.
