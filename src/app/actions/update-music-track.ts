"use server";

import { revalidatePath } from "next/cache";

import { parseMusicDraft } from "@/lib/music-catalog/draft-validation";
import { updateMusicTrackDraft } from "@/lib/music-catalog/music-catalog-service";

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
    await updateMusicTrackDraft(trackId, draft);
    revalidatePath("/");
    return { ok: true, message: "歌曲信息已保存" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存失败，请稍后重试",
    };
  }
}
