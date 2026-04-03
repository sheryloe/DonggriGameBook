#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAX_MB=10
STRICT=1
OUT_FILE=""

usage() {
  cat <<USAGE
Usage: ./scripts/audit-assets.sh [--max-mb N] [--out FILE] [--no-strict]

Options:
  --max-mb N   Large file threshold in MB (default: 10)
  --out FILE   Write report to FILE
  --no-strict  Always exit 0 (default: strict mode)
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-mb)
      MAX_MB="${2:-}"
      shift 2
      ;;
    --out)
      OUT_FILE="${2:-}"
      shift 2
      ;;
    --no-strict)
      STRICT=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! [[ "$MAX_MB" =~ ^[0-9]+$ ]]; then
  echo "--max-mb must be integer" >&2
  exit 1
fi

TARGET_DIRS=("img" "dist" "output" "music" "public/audio")
MAX_BYTES=$((MAX_MB * 1024 * 1024))
REPORT_FILE="${OUT_FILE:-$ROOT_DIR/output/repo-audit/asset-audit-report.txt}"
REPORT_DIR="$(dirname "$REPORT_FILE")"
mkdir -p "$REPORT_DIR"

{
  echo "[asset-audit]"
  echo "date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "root: $ROOT_DIR"
  echo "threshold_mb: $MAX_MB"
  echo

  echo "[directory-size]"
  for d in "${TARGET_DIRS[@]}"; do
    if [[ -d "$ROOT_DIR/$d" ]]; then
      du -sh "$ROOT_DIR/$d"
    else
      echo "missing: $ROOT_DIR/$d"
    fi
  done
  echo

  echo "[large-files]"
  LARGE_COUNT=0
  while IFS= read -r -d '' f; do
    size=$(stat -c%s "$f")
    if (( size > MAX_BYTES )); then
      LARGE_COUNT=$((LARGE_COUNT + 1))
      echo "LARGE(${MAX_MB}MB+): $f ($(numfmt --to=iec "$size"))"
    fi
  done < <(
    find "$ROOT_DIR/img" "$ROOT_DIR/dist" "$ROOT_DIR/output" "$ROOT_DIR/music" "$ROOT_DIR/public/audio" \
      -type f -print0 2>/dev/null
  )
  if (( LARGE_COUNT == 0 )); then
    echo "none"
  fi
  echo

  echo "[duplicates-by-sha256]"
  DUP_COUNT=0
  HASH_FILE="$(mktemp)"
  while IFS= read -r -d '' f; do
    sha256sum "$f"
  done < <(
    find "$ROOT_DIR/img" "$ROOT_DIR/music" "$ROOT_DIR/public/audio" -type f -print0 2>/dev/null
  ) | sort > "$HASH_FILE"

  awk '{
    hash=$1
    path=$2
    if (hash==prev_hash) {
      if (!printed[hash]) {
        print "DUP:", prev_path
        printed[hash]=1
      }
      print "DUP:", path
      dup=1
    }
    prev_hash=hash
    prev_path=path
  }
  END { if (dup!=1) print "none" }' "$HASH_FILE"

  DUP_COUNT=$(awk '{
    hash=$1
    if (hash==prev_hash) dup=1
    prev_hash=hash
  }
  END { if (dup==1) print 1; else print 0 }' "$HASH_FILE")

  rm -f "$HASH_FILE"
  echo

  echo "[summary]"
  echo "large_file_count=$LARGE_COUNT"
  echo "duplicate_exists=$DUP_COUNT"
} | tee "$REPORT_FILE"

if (( STRICT == 1 )); then
  if rg -q "^LARGE\(" "$REPORT_FILE" || rg -q "^DUP:" "$REPORT_FILE"; then
    echo "asset audit failed (strict mode): $REPORT_FILE" >&2
    exit 2
  fi
fi

echo "asset audit report: $REPORT_FILE"
