import { story1 } from "../src/data/story1";
import { story2 } from "../src/data/story2";
import {
  advanceStory,
  applyEffects,
  getBootstrapSnapshot,
  requirementsMet,
} from "../src/lib/storyEngine";
import { StoryDefinition, StorySnapshot } from "../src/types/story";

type EndingCode = "clear" | "debt" | "quarantine";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function playRoute(story: StoryDefinition, choiceIndexes: number[]) {
  let snapshot: StorySnapshot = getBootstrapSnapshot(story, story.startNodeId);
  let currentNodeId = story.startNodeId;

  choiceIndexes.forEach((choiceIndex, stepIndex) => {
    const currentNode = story.nodes[currentNodeId];
    const choice = currentNode.choices[choiceIndex];

    assert(
      choice,
      `[${story.id}] Step ${stepIndex + 1}: missing choice index ${choiceIndex} from ${currentNodeId}`,
    );
    assert(
      requirementsMet(snapshot.state, choice.requirements),
      `[${story.id}] Step ${stepIndex + 1}: requirements not met for "${choice.label}"`,
    );

    snapshot = advanceStory(story, snapshot, currentNodeId, choice);
    currentNodeId = snapshot.nodeId;
  });

  return snapshot;
}

function findRouteToEndingCode(
  story: StoryDefinition,
  targetCode: EndingCode,
  maxDepth = 40,
) {
  const queue: Array<{
    nodeId: string;
    state: StorySnapshot["state"];
    choices: number[];
  }> = [
    {
      nodeId: story.startNodeId,
      state: { ...story.initialState },
      choices: [],
    },
  ];
  const visitedDepth = new Map<string, number>();
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;

    const node = story.nodes[current.nodeId];
    const key = `${current.nodeId}:${current.state.supplies}:${current.state.noise}`;
    const seenDepth = visitedDepth.get(key);

    if (seenDepth !== undefined && seenDepth <= current.choices.length) {
      continue;
    }
    visitedDepth.set(key, current.choices.length);

    if (node.ending) {
      if (node.ending.code === targetCode) {
        return current.choices;
      }
      continue;
    }

    if (current.choices.length >= maxDepth) {
      continue;
    }

    node.choices.forEach((choice, choiceIndex) => {
      if (!requirementsMet(current.state, choice.requirements)) {
        return;
      }

      const targetNode = story.nodes[choice.to];
      const afterChoice = applyEffects(current.state, choice.effects);
      const nextState = applyEffects(afterChoice, targetNode.effects);

      queue.push({
        nodeId: targetNode.id,
        state: nextState,
        choices: [...current.choices, choiceIndex],
      });
    });
  }

  return null;
}

function verifyStoryRoutes(story: StoryDefinition) {
  const cases: EndingCode[] = ["clear", "debt", "quarantine"];
  const results = Object.fromEntries(
    cases.map((code) => {
      const route = findRouteToEndingCode(story, code);

      assert(route, `[${story.id}] could not find a route to ending code "${code}"`);

      const snapshot = playRoute(story, route);
      const ending = story.nodes[snapshot.nodeId]?.ending;

      assert(
        ending?.code === code,
        `[${story.id}] ${code} route ending code mismatch`,
      );
      assert(
        snapshot.status === "ended",
        `[${story.id}] ${code} route snapshot should be ended`,
      );

      return [code, { route, snapshot }];
    }),
  ) as Record<EndingCode, { route: number[]; snapshot: StorySnapshot }>;

  return results;
}

function verifyBootstrap(story: StoryDefinition) {
  const bootstrapNodeIds = Object.keys(story.bootstrap);

  bootstrapNodeIds.forEach((nodeId) => {
    const snapshot = getBootstrapSnapshot(story, nodeId);
    const ending = story.nodes[snapshot.nodeId]?.ending;

    assert(
      snapshot.nodeId === nodeId,
      `[${story.id}] bootstrap should resolve ${nodeId}`,
    );

    if (ending) {
      assert(
        snapshot.status === "ended",
        `[${story.id}] bootstrap for ending node ${nodeId} should be ended`,
      );
    }
  });
}

const story1Results = verifyStoryRoutes(story1);
const story2Results = verifyStoryRoutes(story2);

verifyBootstrap(story1);
verifyBootstrap(story2);

console.log(`[${story1.id}] verified routes:`);
console.log(
  `- clear: ${story1Results.clear.snapshot.nodeId} (보급 ${story1Results.clear.snapshot.state.supplies}, 소음 ${story1Results.clear.snapshot.state.noise})`,
);
console.log(
  `- debt: ${story1Results.debt.snapshot.nodeId} (보급 ${story1Results.debt.snapshot.state.supplies}, 소음 ${story1Results.debt.snapshot.state.noise})`,
);
console.log(
  `- quarantine: ${story1Results.quarantine.snapshot.nodeId} (보급 ${story1Results.quarantine.snapshot.state.supplies}, 소음 ${story1Results.quarantine.snapshot.state.noise})`,
);
console.log(
  `[${story1.id}] verified bootstrap nodes: ${Object.keys(story1.bootstrap).join(", ")}`,
);

console.log(`[${story2.id}] verified routes:`);
console.log(
  `- clear: ${story2Results.clear.snapshot.nodeId} (보급 ${story2Results.clear.snapshot.state.supplies}, 소음 ${story2Results.clear.snapshot.state.noise})`,
);
console.log(
  `- debt: ${story2Results.debt.snapshot.nodeId} (보급 ${story2Results.debt.snapshot.state.supplies}, 소음 ${story2Results.debt.snapshot.state.noise})`,
);
console.log(
  `- quarantine: ${story2Results.quarantine.snapshot.nodeId} (보급 ${story2Results.quarantine.snapshot.state.supplies}, 소음 ${story2Results.quarantine.snapshot.state.noise})`,
);
console.log(
  `[${story2.id}] verified bootstrap nodes: ${Object.keys(story2.bootstrap).join(", ")}`,
);
