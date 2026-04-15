import { getChapterCatalogEntry } from "@donggrol/world-registry";
import { PART1_ENDINGS, PART1_ENDING_ORDER } from "./part1Endings";
import type { EndingId, GameContentPack } from "../types/game";

export interface RuntimeEndingCard {
  ending_id: EndingId;
  chapter_id?: string;
  title: string;
  summary: string;
  hint: string;
  art_key: string;
  thumb_key: string;
  video_id?: string;
  unlocked_at?: string;
  unlocked: boolean;
}

function titleCaseToken(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function humanizeEndingId(endingId: string): string {
  return endingId
    .replace(/^P\d+_END_/u, "")
    .split(/[_:. -]+/u)
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

export function buildEndingArtKey(endingId: string): string {
  return `ending_${endingId.toLowerCase().replace(/_end_/u, "_")}`;
}

export function buildEndingThumbKey(endingId: string): string {
  return `ending_thumb_${endingId.toLowerCase().replace(/_end_/u, "_")}`;
}

export function buildEndingVideoId(endingId: string): string {
  return endingId;
}

function isPart1EndingId(endingId: EndingId): endingId is (typeof PART1_ENDING_ORDER)[number] {
  return Object.prototype.hasOwnProperty.call(PART1_ENDINGS, endingId);
}

export function getEndingCardById(
  content: GameContentPack,
  endingId: EndingId,
  unlockedAt?: string,
  chapterId?: string
): RuntimeEndingCard | null {
  if (isPart1EndingId(endingId)) {
    const ending = PART1_ENDINGS[endingId];
    return {
      ending_id: endingId,
      chapter_id: chapterId ?? "CH05",
      title: ending.title,
      summary: ending.summary,
      hint: ending.hint,
      art_key: ending.art_key,
      thumb_key: ending.thumb_key,
      video_id: endingId,
      unlocked_at: unlockedAt,
      unlocked: Boolean(unlockedAt)
    };
  }

  for (const chapterIdInPack of content.chapter_order) {
    const chapter = content.chapters[chapterIdInPack];
    const matchedRule = chapter.ending_matrix.find((rule) => rule.ending_id === endingId);
    if (!matchedRule) {
      continue;
    }

    return {
      ending_id: endingId,
      chapter_id: chapterId ?? chapterIdInPack,
      title: matchedRule.title || humanizeEndingId(endingId),
      summary: matchedRule.summary || `${humanizeEndingId(endingId)} 寃쎈줈??寃곕쭚?대떎.`,
      hint: matchedRule.hint || `${humanizeEndingId(endingId)} ?닿툑 議곌굔???꾩쭅 異⑹”?섏? ?딆븯??`,
      art_key: buildEndingArtKey(endingId),
      thumb_key: buildEndingThumbKey(endingId),
      video_id: buildEndingVideoId(endingId),
      unlocked_at: unlockedAt,
      unlocked: Boolean(unlockedAt)
    };
  }

  if (!endingId) {
    return null;
  }

  return {
    ending_id: endingId,
    chapter_id: chapterId,
    title: humanizeEndingId(endingId),
    summary: `${humanizeEndingId(endingId)} ?붾뵫???꾨떖?덈떎.`,
    hint: `${humanizeEndingId(endingId)} ?붾뵫? ?꾩쭅 ?좉꺼 ?덈떎.`,
    art_key: buildEndingArtKey(endingId),
    thumb_key: buildEndingThumbKey(endingId),
    video_id: buildEndingVideoId(endingId),
    unlocked_at: unlockedAt,
    unlocked: Boolean(unlockedAt)
  };
}

export function collectPartEndingCards(
  content: GameContentPack,
  partId: string,
  unlockedEndings: Partial<Record<EndingId, string>> = {}
): RuntimeEndingCard[] {
  if (partId === "P1") {
    return PART1_ENDING_ORDER.map((endingId) => getEndingCardById(content, endingId, unlockedEndings[endingId], "CH05")).filter(
      Boolean
    ) as RuntimeEndingCard[];
  }

  const cards = new Map<EndingId, RuntimeEndingCard>();
  for (const chapterId of content.chapter_order) {
    if (getChapterCatalogEntry(chapterId)?.part_id !== partId) {
      continue;
    }

    const chapter = content.chapters[chapterId];
    const sortedRules = [...chapter.ending_matrix].sort((left, right) => Number(right.priority ?? 0) - Number(left.priority ?? 0));
    for (const rule of sortedRules) {
      if (cards.has(rule.ending_id)) {
        continue;
      }

      cards.set(rule.ending_id, {
        ending_id: rule.ending_id,
        chapter_id: chapterId,
        title: rule.title || humanizeEndingId(rule.ending_id),
        summary: rule.summary || `${humanizeEndingId(rule.ending_id)} ?붾뵫???꾨떖?덈떎.`,
        hint: rule.hint || `${humanizeEndingId(rule.ending_id)} ?붾뵫? ?꾩쭅 ?좉꺼 ?덈떎.`,
        art_key: buildEndingArtKey(rule.ending_id),
        thumb_key: buildEndingThumbKey(rule.ending_id),
        video_id: buildEndingVideoId(rule.ending_id),
        unlocked_at: unlockedEndings[rule.ending_id],
        unlocked: Boolean(unlockedEndings[rule.ending_id])
      });
    }
  }

  return [...cards.values()];
}


