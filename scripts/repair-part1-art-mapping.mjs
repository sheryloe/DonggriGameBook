/**
 * Rebind every Part 1 (CH01-CH05) art_key to an image file that actually exists.
 *
 * The stored runtimeArtOverrides entries pointed at a `p1_wave12_*_v01.png`
 * naming scheme that was never delivered, so all 344 CH01-CH05 art references
 * resolved to nothing and 154 of the 155 generated images sat unused. This pass
 * rewrites only the CH01-CH05 mappings, leaves CH06-CH20 untouched, and refuses
 * to emit a mapping whose target file is missing.
 *
 * Usage:
 *   node scripts/repair-part1-art-mapping.mjs --plan
 *   node scripts/repair-part1-art-mapping.mjs --apply --confirm-part1-art-mapping
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const imageDirs = [
  path.join(root, "public", "generated", "images"),
  path.join(root, "apps", "part1", "public", "generated", "images"),
];
const overridePath = path.join(root, "packages", "app-runtime", "src", "assets", "runtimeArtOverrides.json");
const PART1 = new Set(["CH01", "CH02", "CH03", "CH04", "CH05"]);

/**
 * art_key → image stem, grouped by chapter.
 *
 * Each chapter has two generated backgrounds plus three teasers (entry / pressure
 * / preclimax), so distinct locations get distinct art instead of one flat plate.
 */
const MAPPING = {
  CH01: {
    p1_ch01_yellow_radio_record_warning: "poster_ch01_yeouido_ash",
    p1_ch01_abandoned_broadcast_lobby: "bg_broadcast_lobby",
    p1_ch01_flooded_archive_room: "bg_archive_flooded",
    p1_ch01_rooftop_transmitter: "teaser_ch01_preclimax",
    bg_yeouido_ashroad: "bg_yeouido_ashroad",
    bg_saetgang_entry: "teaser_ch01_entry",
    bg_broadcast_corridor: "bg_ch01_yeouido_ash_primary",
    bg_service_stair: "bg_ch01_yeouido_ash_secondary",
    bg_emergency_stairs: "bg_ch01_yeouido_ash_secondary",
    bg_security_office: "teaser_ch01_pressure",
    bg_sorting_hall: "bg_ch01_yeouido_ash_primary",
    npc_support_writer: "portrait_npc_jung_noah_ch01_support",
    portrait_yoon_haein: "portrait_npc_yoon_haein_ch01_anchor",
    boss_editing_aberration: "threat_editing_aberration",
    briefing_p1_ch01: "poster_ch01_yeouido_ash",
    map_p1_ch01: "bg_ch01_yeouido_ash_secondary",
    result_p1_ch01: "poster_ch01_yeouido_ash",
  },
  CH02: {
    bg_saetgang_entry: "teaser_ch02_entry",
    bg_dongjak_culvert: "teaser_ch02_entry",
    bg_noryangjin_market: "bg_ch02_flooded_market_primary",
    bg_flooded_market: "bg_ch02_flooded_market_primary",
    bg_cold_storage: "bg_ch02_flooded_market_secondary",
    bg_flooded_pier: "teaser_ch02_pressure",
    bg_sluice_control: "teaser_ch02_preclimax",
    portrait_jung_noah: "portrait_npc_jung_noah_ch02_anchor",
    portrait_seo_jinseo: "portrait_npc_seo_jinseo_ch02_support",
    boss_cheongeum: "threat_sluice_sac_cheongeum",
    briefing_p1_ch02: "poster_ch02_flooded_market",
    map_p1_ch02: "bg_ch02_flooded_market_secondary",
    result_p1_ch02: "poster_ch02_flooded_market",
  },
  CH03: {
    bg_jamsil_lobby: "teaser_ch03_entry",
    bg_jamsil_showroom: "bg_ch03_jamsil_vertical_primary",
    bg_service_stair: "bg_ch03_jamsil_vertical_secondary",
    bg_basement_cache: "bg_ch03_jamsil_vertical_secondary",
    bg_power_room: "bg_ch03_jamsil_vertical_secondary",
    bg_skybridge: "teaser_ch03_preclimax",
    bg_rooftop_escape: "teaser_ch03_pressure",
    portrait_ahn_bogyeong: "portrait_npc_ahn_bogyeong_ch03_anchor",
    portrait_ryu_seon: "portrait_npc_ryu_seon_ch03_support",
    boss_glassgarden: "threat_vista_amalgam_glassgarden",
    briefing_p1_ch03: "poster_ch03_jamsil_vertical",
    map_p1_ch03: "bg_ch03_jamsil_vertical_secondary",
    result_p1_ch03: "poster_ch03_jamsil_vertical",
  },
  CH04: {
    bg_tancheon_embankment: "teaser_ch04_entry",
    bg_rail_transfer: "teaser_ch04_preclimax",
    bg_delivery_tunnel: "bg_ch04_munjeong_logistics_secondary",
    bg_sorting_hall: "bg_ch04_munjeong_logistics_primary",
    bg_logistics_main: "bg_ch04_munjeong_logistics_primary",
    bg_security_office: "bg_ch04_munjeong_logistics_primary",
    bg_cold_warehouse: "teaser_ch04_pressure",
    bg_cold_storage: "teaser_ch04_pressure",
    portrait_han_somyeong: "portrait_npc_han_somyeong_ch04_anchor",
    portrait_yoon_haein: "portrait_npc_yoon_haein_ch04_support",
    boss_picker_prime: "threat_picker_prime",
    briefing_p1_ch04: "poster_ch04_munjeong_logistics",
    map_p1_ch04: "bg_ch04_munjeong_logistics_secondary",
    result_p1_ch04: "poster_ch04_munjeong_logistics",
  },
  CH05: {
    bg_pangyo_interchange: "teaser_ch05_entry",
    bg_pangyo_lobby: "teaser_ch05_entry",
    bg_pangyo_skywalk: "teaser_ch05_pressure",
    bg_arkp_serverhall: "bg_ch05_pangyo_server_primary",
    bg_server_hall: "bg_ch05_pangyo_server_primary",
    bg_cooling_room: "bg_ch05_pangyo_server_secondary",
    bg_arkp_exit: "teaser_ch05_preclimax",
    portrait_kim_ara: "portrait_npc_kim_ara_ch05_anchor",
    portrait_yoon_haein: "portrait_npc_yoon_haein_ch05_support",
    boss_mirror_lines: "threat_mirror_core_lines",
    briefing_p1_ch05: "poster_ch05_pangyo_server",
    map_p1_ch05: "bg_ch05_pangyo_server_secondary",
    result_p1_ch05: "poster_ch05_pangyo_server",
  },
};

// `/generated/images` is served from both the repo-wide public directory and the
// per-app copy; a target only has to exist in one of them.
const stemToFile = new Map();
for (const dir of imageDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const stem = entry.name.replace(/\.[^.]+$/u, "");
    if (!stemToFile.has(stem)) stemToFile.set(stem, entry.name);
  }
}

const missing = [];
const rebuilt = [];
for (const [chapterId, table] of Object.entries(MAPPING)) {
  // one mapping entry per target image, carrying every art_key that points at it
  const byTarget = new Map();
  for (const [artKey, stem] of Object.entries(table)) {
    const file = stemToFile.get(stem);
    if (!file) {
      missing.push({ chapterId, artKey, stem });
      continue;
    }
    const src = `/generated/images/${file}`;
    if (!byTarget.has(src)) byTarget.set(src, []);
    byTarget.get(src).push(artKey);
  }
  for (const [src, keys] of byTarget) {
    rebuilt.push({ chapter_id: chapterId, runtime_art_keys: keys, src });
  }
}

const current = JSON.parse(fs.readFileSync(overridePath, "utf8"));
const preserved = (current.mappings ?? []).filter((m) => !PART1.has(m.chapter_id));
const next = { ...current, mappings: [...rebuilt, ...preserved] };

const summary = {
  part1_mappings_before: (current.mappings ?? []).filter((m) => PART1.has(m.chapter_id)).length,
  part1_mappings_after: rebuilt.length,
  part1_art_keys_bound: rebuilt.reduce((n, m) => n + m.runtime_art_keys.length, 0),
  other_chapter_mappings_preserved: preserved.length,
  missing_targets: missing,
  distinct_images_used: new Set(rebuilt.map((m) => m.src)).size,
};

if (missing.length > 0) {
  console.error(JSON.stringify({ pass: false, reason: "target image missing", summary }, null, 2));
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("--apply") && args.includes("--confirm-part1-art-mapping")) {
  fs.writeFileSync(overridePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ pass: true, mode: "apply", file: overridePath, summary }, null, 2));
} else {
  console.log(JSON.stringify({ pass: true, mode: "plan", summary, sample: rebuilt.slice(0, 6) }, null, 2));
}
