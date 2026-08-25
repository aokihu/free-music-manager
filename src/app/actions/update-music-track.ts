"use server";

import { revalidatePath } from "next/cache";

import { parseMusicDraft } from "@/lib/music-catalog/draft-validation";
import { updateMusicTrackContent } from "@/lib/music-catalog/music-catalog-service";

export type UpdateMusicTrackResult = {
  ok: boolean;
  message: string;
};

export async function updateMusicTrack(
  formData: FormData,
): Promise<UpdateMusicTrackResult> {
  try {
    const trackId = formData.get("trackId");
    if (typeof trackId !== "string" || !trackId.trim()) {
      throw new Error("缺少歌曲 ID");
    }

    const draft = parseMusicDraft(formData.get("draft"));
    const coverValue = formData.get("coverFile");
    if (coverValue !== null && !(coverValue instanceof File)) {
      throw new Error("封面文件无效");
    }

    const coverFile = coverValue instanceof File ? coverValue : undefined;
    const removeCover = formData.get("removeCover") === "true";
    if (coverFile && removeCover) {
      throw new Error("不能同时替换和删除封面");
    }

    await updateMusicTrackContent(trackId, draft, coverFile, removeCover);
    revalidatePath("/");
    return {
      ok: true,
      message: coverFile
        ? "歌曲信息和封面已保存"
        : removeCover
          ? "歌曲信息已保存，封面已删除"
          : "歌曲信息已保存",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存失败，请稍后重试",
    };
  }
}
