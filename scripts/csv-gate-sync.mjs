#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const REQUIRED_COLUMNS = [
  "canonical_id",
  "title",
  "status",
  "owner",
  "chapter_ref",
  "links_echo",
  "source_doc"
];

const STATUS_TO_LINEAR = {
  Approved: "Todo",
  "In Production": "In Progress",
  Locked: "Done"
};

const STATUS_ORDER = {
  Draft: 0,
  Approved: 1,
  "In Production": 2,
  Locked: 3,
  "Change Request": 4
};

const STATUS_NORMALIZE = new Map([
  ["approved", "Approved"],
  ["in production", "In Production"],
  ["locked", "Locked"],
  ["draft", "Draft"],
  ["change request", "Change Request"]
]);

const ID_PATTERNS = {
  arc: /^ARC-\d{2}-\d{2}$/,
  chapter: /^ARC\d{2}-CH\d{2}$/,
  node: /^ARC\d{2}-CH\d{2}-ND-[A-Z0-9-]+$/,
  npc: /^NPC-[A-Z0-9-]+$/,
  foreshadow: /^FS-\d{2}-\d{3}$/
};

function parseArgs(argv) {
  const out = {
    input: "",
    outDir: "output/csv-gate-sync",
    format: "jsonl"
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") {
      out.input = argv[++i] ?? "";
    } else if (arg === "--out-dir") {
      out.outDir = argv[++i] ?? "";
    } else if (arg === "--format") {
      out.format = argv[++i] ?? "";
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!out.input) {
    throw new Error("--input is required");
  }

  if (!out.outDir) {
    throw new Error("--out-dir must not be empty");
  }

  if (out.format !== "jsonl" && out.format !== "csv") {
    throw new Error("--format must be one of: jsonl, csv");
  }

  return out;
}

function printHelp() {
  console.log(`CSV Gate Sync\n\nUsage:\n  node scripts/csv-gate-sync.mjs --input <file.csv> [--out-dir output/csv-gate-sync] [--format jsonl|csv]\n\nContract:\n  - required columns: ${REQUIRED_COLUMNS.join(", ")}\n  - status mapping: Approved->Todo, In Production->In Progress, Locked->Done\n`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(value);
      value = "";
    } else if (ch === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (ch === "\r") {
    } else {
      value += ch;
    }

    i += 1;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  if (rows.length === 0) {
    return { headers: [], records: [] };
  }

  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? "").trim();
    });
    return record;
  });

  return { headers, records };
}

function escapeCsvValue(value) {
  const safe = value ?? "";
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function toCsv(records, headers) {
  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(headers.map((h) => escapeCsvValue(String(record[h] ?? ""))).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function normalizeStatus(raw) {
  const key = raw.trim().toLowerCase();
  return STATUS_NORMALIZE.get(key) ?? raw.trim();
}

function matchesCanonicalId(canonicalId) {
  return Object.values(ID_PATTERNS).some((re) => re.test(canonicalId));
}

function pathExistsInRepo(p) {
  const normalized = p.replace(/^\/+/u, "");
  return fs.existsSync(path.resolve(normalized));
}

function validateRecord(record, rowIndex, hasPrevStatus, hasContinuity) {
  const reasons = [];

  for (const column of REQUIRED_COLUMNS) {
    if (!record[column] || record[column].trim() === "") {
      reasons.push(`MISSING_${column.toUpperCase()}`);
    }
  }

  const canonicalId = record.canonical_id?.trim() ?? "";
  if (canonicalId && !matchesCanonicalId(canonicalId)) {
    reasons.push("INVALID_CANONICAL_ID_PATTERN");
  }

  const chapterRef = record.chapter_ref?.trim() ?? "";
  if (chapterRef && !ID_PATTERNS.chapter.test(chapterRef)) {
    reasons.push("INVALID_CHAPTER_REF_PATTERN");
  }

  const normalizedStatus = normalizeStatus(record.status ?? "");
  record.status = normalizedStatus;

  if (!Object.hasOwn(STATUS_TO_LINEAR, normalizedStatus)) {
    reasons.push("STATUS_NOT_SYNCABLE");
  }

  if (hasPrevStatus && record.prev_status) {
    const prev = normalizeStatus(record.prev_status);
    record.prev_status = prev;
    if (!Object.hasOwn(STATUS_ORDER, prev) || !Object.hasOwn(STATUS_ORDER, normalizedStatus)) {
      reasons.push("INVALID_STATUS_TRANSITION");
    } else if (STATUS_ORDER[normalizedStatus] < STATUS_ORDER[prev]) {
      reasons.push("STATUS_ROLLBACK_BLOCKED");
    }
  }

  if (normalizedStatus === "Locked") {
    if (!hasContinuity) {
      reasons.push("MISSING_CONTINUITY_REVIEW_COLUMN");
    } else {
      const c = (record.continuity_review ?? "").trim().toLowerCase();
      if (!["pass", "approved", "done"].includes(c)) {
        reasons.push("CONTINUITY_REVIEW_REQUIRED");
      }
    }
  }

  if (record.source_doc && !pathExistsInRepo(record.source_doc)) {
    reasons.push("SOURCE_DOC_NOT_FOUND");
  }

  if (record.links_echo && !/^https?:\/\//u.test(record.links_echo)) {
    reasons.push("INVALID_LINKS_ECHO");
  }

  return {
    row: rowIndex,
    reasons
  };
}

function buildLinearPayload(record) {
  return {
    canonical_id: record.canonical_id,
    title: record.title,
    owner: record.owner,
    chapter_ref: record.chapter_ref,
    links_echo: record.links_echo,
    source_doc: record.source_doc,
    linear_state: STATUS_TO_LINEAR[record.status],
    status: record.status
  };
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(args.input);
  const outDir = path.resolve(args.outDir);
  const raw = fs.readFileSync(inputPath, "utf8");
  const { headers, records } = parseCsv(raw);

  for (const required of REQUIRED_COLUMNS) {
    if (!headers.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const hasPrevStatus = headers.includes("prev_status");
  const hasContinuity = headers.includes("continuity_review");

  const approved = [];
  const rejected = [];

  records.forEach((record, idx) => {
    const rowIndex = idx + 2;
    const result = validateRecord(record, rowIndex, hasPrevStatus, hasContinuity);

    if (result.reasons.length > 0) {
      rejected.push({
        row: String(result.row),
        canonical_id: record.canonical_id ?? "",
        title: record.title ?? "",
        status: record.status ?? "",
        reason_code: result.reasons.join("|"),
        source_doc: record.source_doc ?? ""
      });
      return;
    }

    approved.push(buildLinearPayload(record));
  });

  fs.mkdirSync(outDir, { recursive: true });

  const summary = {
    generated_at: new Date().toISOString(),
    input: inputPath,
    total_rows: records.length,
    approved_rows: approved.length,
    rejected_rows: rejected.length,
    output_format: args.format,
    outputs: {
      approved: args.format === "jsonl" ? "linear-ready.jsonl" : "linear-ready.csv",
      rejected: "rejected.csv",
      summary: "summary.json"
    }
  };

  if (args.format === "jsonl") {
    const jsonl = approved.map((r) => JSON.stringify(r)).join("\n");
    fs.writeFileSync(path.join(outDir, "linear-ready.jsonl"), `${jsonl}${jsonl ? "\n" : ""}`);
  } else {
    const headersOut = [
      "canonical_id",
      "title",
      "owner",
      "chapter_ref",
      "links_echo",
      "source_doc",
      "linear_state",
      "status"
    ];
    fs.writeFileSync(path.join(outDir, "linear-ready.csv"), toCsv(approved, headersOut));
  }

  const rejectedHeaders = ["row", "canonical_id", "title", "status", "reason_code", "source_doc"];
  fs.writeFileSync(path.join(outDir, "rejected.csv"), toCsv(rejected, rejectedHeaders));
  fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`CSV Gate Sync complete: approved=${approved.length}, rejected=${rejected.length}, out=${outDir}`);

  if (rejected.length > 0) {
    process.exit(2);
  }
}

try {
  main();
} catch (error) {
  console.error(`[csv-gate-sync] ${(error && error.message) || error}`);
  process.exit(1);
}
