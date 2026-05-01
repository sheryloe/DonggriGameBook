import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const LARGE_GROUP_MODELS = new Set([
  "gpt-5.5-2026-04-23",
  "gpt-5.4-2026-03-05",
  "gpt-5.2-2025-12-11",
  "gpt-5.1-2025-11-13",
  "gpt-5.1-codex",
  "gpt-5-codex",
  "gpt-5-2025-08-07",
  "gpt-5-chat-latest",
  "gpt-4.1-2025-04-14",
  "gpt-4o-2024-05-13",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-11-20",
  "o3-2025-04-16",
  "o1-preview-2024-09-12",
  "o1-2024-12-17",
]);

const SMALL_GROUP_MODELS = new Set([
  "gpt-5.4-mini-2026-03-17",
  "gpt-5.4-nano-2026-03-17",
  "gpt-5.1-codex-mini",
  "gpt-5-mini-2025-08-07",
  "gpt-5-nano-2025-08-07",
  "gpt-4.1-mini-2025-04-14",
  "gpt-4.1-nano-2025-04-14",
  "gpt-4o-mini-2024-07-18",
  "o4-mini-2025-04-16",
  "o1-mini-2024-09-12",
  "codex-mini-latest",
]);

const DEFAULT_CONFIG = {
  largeModel: process.env.OPENAI_LARGE_TEXT_MODEL || "gpt-5.4-2026-03-05",
  smallModel: process.env.OPENAI_SMALL_TEXT_MODEL || "gpt-5.4-mini-2026-03-17",
  largeQuotaTokens: Number(process.env.OPENAI_LARGE_DAILY_TOKEN_QUOTA || 1_000_000),
  smallQuotaTokens: Number(process.env.OPENAI_SMALL_DAILY_TOKEN_QUOTA || 10_000_000),
  switchAtRatio: Number(process.env.OPENAI_LARGE_SWITCH_RATIO || 0.9),
  usageDir: process.env.OPENAI_TOKEN_ROUTER_DIR || path.join(process.cwd(), "output", "openai-token-router"),
};

function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function usageFile(config = DEFAULT_CONFIG, day = utcDay()) {
  return path.join(config.usageDir, `usage-${day}.json`);
}

function emptyUsage(day = utcDay(), config = DEFAULT_CONFIG) {
  return {
    utc_day: day,
    policy: {
      large_quota_tokens: config.largeQuotaTokens,
      large_switch_at_tokens: Math.floor(config.largeQuotaTokens * config.switchAtRatio),
      small_quota_tokens: config.smallQuotaTokens,
      token_count_rule: "input_tokens + output_tokens",
      refresh: "00:00 UTC",
    },
    totals: {
      large: { input_tokens: 0, output_tokens: 0, total_tokens: 0, requests: 0 },
      small: { input_tokens: 0, output_tokens: 0, total_tokens: 0, requests: 0 },
    },
    requests: [],
  };
}

export function modelGroup(model) {
  if (LARGE_GROUP_MODELS.has(model)) return "large";
  if (SMALL_GROUP_MODELS.has(model)) return "small";
  if (/\b(mini|nano)\b/u.test(model) || model.includes("-mini") || model.includes("-nano")) return "small";
  return "large";
}

export function tokensFromUsage(usage = {}) {
  const inputTokens = Number(usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokenCount ?? 0);
  const outputTokens = Number(usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokenCount ?? 0);
  const totalTokens = inputTokens + outputTokens;
  return { input_tokens: inputTokens, output_tokens: outputTokens, total_tokens: totalTokens };
}

export async function loadTokenUsage(config = DEFAULT_CONFIG) {
  const day = utcDay();
  const file = usageFile(config, day);
  if (!existsSync(file)) {
    return emptyUsage(day, config);
  }
  const parsed = JSON.parse(await readFile(file, "utf8"));
  return {
    ...emptyUsage(day, config),
    ...parsed,
    policy: { ...emptyUsage(day, config).policy, ...(parsed.policy ?? {}) },
    totals: { ...emptyUsage(day, config).totals, ...(parsed.totals ?? {}) },
  };
}

export async function saveTokenUsage(usage, config = DEFAULT_CONFIG) {
  await mkdir(config.usageDir, { recursive: true });
  await writeFile(usageFile(config, usage.utc_day), `${JSON.stringify(usage, null, 2)}\n`, "utf8");
}

export function selectTextModel(usage, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const estimatedInputTokens = Number(options.estimatedInputTokens ?? 0);
  const estimatedOutputTokens = Number(options.estimatedOutputTokens ?? 0);
  const estimatedRequestTokens = estimatedInputTokens + estimatedOutputTokens;
  const largeUsed = usage.totals.large.total_tokens;
  const largeSwitchAt = Math.floor(config.largeQuotaTokens * config.switchAtRatio);
  const wouldCrossLargeSwitch = largeUsed + estimatedRequestTokens >= largeSwitchAt;

  if (wouldCrossLargeSwitch) {
    return {
      model: config.smallModel,
      group: "small",
      reason: `large token group is at ${largeUsed}/${largeSwitchAt}; route to small model before 90% threshold`,
    };
  }

  return {
    model: config.largeModel,
    group: "large",
    reason: `large token group is below switch threshold: ${largeUsed}/${largeSwitchAt}`,
  };
}

export async function recordTextUsage({ model, usage, meta = {} }, config = DEFAULT_CONFIG) {
  const current = await loadTokenUsage(config);
  const group = modelGroup(model);
  const tokens = tokensFromUsage(usage);
  current.totals[group].input_tokens += tokens.input_tokens;
  current.totals[group].output_tokens += tokens.output_tokens;
  current.totals[group].total_tokens += tokens.total_tokens;
  current.totals[group].requests += 1;
  current.requests.push({
    at: new Date().toISOString(),
    model,
    group,
    ...tokens,
    meta,
  });
  await saveTokenUsage(current, config);
  return current;
}

export { DEFAULT_CONFIG, LARGE_GROUP_MODELS, SMALL_GROUP_MODELS };
