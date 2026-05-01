import { DEFAULT_CONFIG, loadTokenUsage, recordTextUsage, selectTextModel } from "./lib/openai-token-router.mjs";

function parseArgs(argv) {
  const args = {
    estimatedInputTokens: 0,
    estimatedOutputTokens: 0,
    recordModel: "",
    recordInputTokens: 0,
    recordOutputTokens: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--estimate-input") args.estimatedInputTokens = Number(argv[++index] ?? 0);
    else if (arg === "--estimate-output") args.estimatedOutputTokens = Number(argv[++index] ?? 0);
    else if (arg === "--record-model") args.recordModel = argv[++index] ?? "";
    else if (arg === "--record-input") args.recordInputTokens = Number(argv[++index] ?? 0);
    else if (arg === "--record-output") args.recordOutputTokens = Number(argv[++index] ?? 0);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.recordModel) {
    await recordTextUsage({
      model: args.recordModel,
      usage: {
        input_tokens: args.recordInputTokens,
        output_tokens: args.recordOutputTokens,
      },
      meta: { source: "manual-status-command" },
    });
  }

  const usage = await loadTokenUsage();
  const route = selectTextModel(usage, {
    estimatedInputTokens: args.estimatedInputTokens,
    estimatedOutputTokens: args.estimatedOutputTokens,
  });

  const largeSwitchAt = Math.floor(DEFAULT_CONFIG.largeQuotaTokens * DEFAULT_CONFIG.switchAtRatio);
  console.log(
    JSON.stringify(
      {
        utc_day: usage.utc_day,
        policy: usage.policy,
        configured_models: {
          large: DEFAULT_CONFIG.largeModel,
          small: DEFAULT_CONFIG.smallModel,
        },
        totals: usage.totals,
        next_route: route,
        percent_used: {
          large_until_switch: Number(((usage.totals.large.total_tokens / largeSwitchAt) * 100).toFixed(2)),
          large_quota: Number(((usage.totals.large.total_tokens / DEFAULT_CONFIG.largeQuotaTokens) * 100).toFixed(2)),
          small_quota: Number(((usage.totals.small.total_tokens / DEFAULT_CONFIG.smallQuotaTokens) * 100).toFixed(2)),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
