# CSV Gate Sync Contract

## 1. Purpose

Validate Airtable-exported CSV before Linear issue creation.

- Rejected rows block sync.
- Approved rows generate Linear-ready payload.

## 2. Input

- Script: `node scripts/csv-gate-sync.mjs`
- Required argument: `--input <csv>`
- Optional:
  - `--out-dir output/csv-gate-sync`
  - `--format jsonl|csv` (default: `jsonl`)

## 3. Required Columns

- `canonical_id`
- `title`
- `status`
- `owner`
- `chapter_ref`
- `links_echo`
- `source_doc`

Optional columns:

- `prev_status` (status transition guard)
- `continuity_review` (required when status is `Locked`)

## 4. Validation Rules

1. Required columns must exist and contain non-empty values.
2. `canonical_id` must match one canonical regex.
3. `chapter_ref` must match chapter regex (`^ARC\d{2}-CH\d{2}$`).
4. Syncable statuses only: `Approved`, `In Production`, `Locked`.
5. If `prev_status` exists, rollback transitions are blocked.
6. `Locked` requires `continuity_review` value (`pass|approved|done`).
7. `source_doc` must resolve to an existing file path in this repo.
8. `links_echo` must start with `http://` or `https://`.

## 5. Status Mapping

- `Approved -> Todo`
- `In Production -> In Progress`
- `Locked -> Done`

## 6. Output Files

- `linear-ready.jsonl` or `linear-ready.csv`
- `rejected.csv`
- `summary.json`

If `rejected.csv` contains one or more rows, script exits with code `2`.

## 7. Example

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
node scripts/csv-gate-sync.mjs \
  --input scripts/examples/airtable-view-sample.csv \
  --out-dir output/csv-gate-sync \
  --format jsonl
```
