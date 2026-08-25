import type { MusicDraftInput } from "./types";
import {
  musicGenreOptions,
  musicMoodOptions,
  musicUseCaseOptions,
  parseMusicTaxonomyIds,
} from "./music-taxonomy";

function parseOptionalNumber(value: unknown, minimum: number, maximum: number) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error("草稿中的数字字段无效");
  }
  return number;
}

export function parseMusicDraft(
  value: FormDataEntryValue | null,
  fallbackTitle = "",
): MusicDraftInput {
  if (typeof value !== "string") throw new Error("缺少歌曲草稿");

  const draft = JSON.parse(value) as Record<string, unknown>;
  const tagTitle = typeof draft.title === "string" ? draft.title.trim() : "";
  const title = tagTitle || fallbackTitle.trim();
  if (!title) throw new Error("歌曲标题不能为空");

  const year = parseOptionalNumber(draft.year, 1900, 2100);
  if (year !== undefined && !Number.isInteger(year)) {
    throw new Error("年份必须是整数");
  }

  return {
    title,
    artist: typeof draft.artist === "string" ? draft.artist.trim() : "",
    album: typeof draft.album === "string" ? draft.album.trim() : "",
    genreIds: parseMusicTaxonomyIds(draft.genreIds, musicGenreOptions),
    bpm: parseOptionalNumber(draft.bpm, 1, 300),
    moodIds: parseMusicTaxonomyIds(draft.moodIds, musicMoodOptions),
    useCaseIds: parseMusicTaxonomyIds(draft.useCaseIds, musicUseCaseOptions),
    year,
    comment: typeof draft.comment === "string" ? draft.comment.trim() : "",
  };
}
