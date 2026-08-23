"use server";

import { revalidatePath } from "next/cache";

import {
  saveMusicToCatalog,
} from "@/lib/music-catalog/music-catalog-service";
import { parseMusicDraft } from "@/lib/music-catalog/draft-validation";
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
    const draft = parseMusicDraft(
      formData.get("draft"),
      getTitleFromFileName(file.name),
    );
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
