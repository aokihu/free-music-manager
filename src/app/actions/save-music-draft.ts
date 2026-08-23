"use server";

import { revalidatePath } from "next/cache";

import {
  saveMusicToCatalog,
  type MusicDraftInput,
} from "@/lib/music-catalog/music-catalog-service";
import { getTitleFromFileName } from "@/lib/music-file";

const maxFileSizeBytes = 200 * 1024 * 1024;
const supportedExtensions = new Set([
  "aac",
  "aiff",
  "flac",
  "m4a",
  "mp3",
  "ogg",
  "opus",
  "wav",
]);

export type SaveMusicDraftResult = {
  ok: boolean;
  message: string;
  trackId?: string;
};

function parseOptionalNumber(value: unknown, minimum: number, maximum: number) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error("草稿中的数字字段无效");
  }
  return number;
}

function parseMusicDraft(
  value: FormDataEntryValue | null,
  fileName: string,
): MusicDraftInput {
  if (typeof value !== "string") throw new Error("缺少歌曲草稿");

  const draft = JSON.parse(value) as Record<string, unknown>;
  const tagTitle = typeof draft.title === "string" ? draft.title.trim() : "";
  const title = tagTitle || getTitleFromFileName(fileName);
  if (!title) throw new Error("歌曲标题不能为空");

  return {
    title,
    artist: typeof draft.artist === "string" ? draft.artist.trim() : "",
    album: typeof draft.album === "string" ? draft.album.trim() : "",
    genres:
      typeof draft.genres === "string"
        ? draft.genres
            .split(/[,，]/)
            .map((genre) => genre.trim())
            .filter(Boolean)
        : [],
    bpm: parseOptionalNumber(draft.bpm, 1, 300),
    mood: typeof draft.mood === "string" ? draft.mood.trim() : "",
    year: (() => {
      const year = parseOptionalNumber(draft.year, 1900, 2100);
      if (year !== undefined && !Number.isInteger(year)) {
        throw new Error("年份必须是整数");
      }
      return year;
    })(),
    comment: typeof draft.comment === "string" ? draft.comment.trim() : "",
  };
}

function validateMusicFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error("请选择有效的音乐文件");
  }
  if (value.size > maxFileSizeBytes) throw new Error("单个文件不能超过 200 MB");

  const extension = value.name.split(".").pop()?.toLowerCase() ?? "";
  if (!value.type.startsWith("audio/") && !supportedExtensions.has(extension)) {
    throw new Error("不支持这份音频文件的格式");
  }

  return value;
}

export async function saveMusicDraft(
  formData: FormData,
): Promise<SaveMusicDraftResult> {
  try {
    const file = validateMusicFile(formData.get("file"));
    const draft = parseMusicDraft(formData.get("draft"), file.name);
    const track = await saveMusicToCatalog(file, draft);
    revalidatePath("/");
    return { ok: true, message: "歌曲已保存到本地曲库", trackId: track.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存失败，请稍后重试",
    };
  }
}
