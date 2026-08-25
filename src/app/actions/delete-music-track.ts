"use server";

import { revalidatePath } from "next/cache";

import { deleteMusicTrack } from "@/lib/music-catalog/music-catalog-service";

export type DeleteMusicTrackResult = {
  ok: boolean;
  message: string;
};

export async function deleteMusicTrackAction(
  formData: FormData,
): Promise<DeleteMusicTrackResult> {
  try {
    const trackId = formData.get("trackId");
    if (typeof trackId !== "string" || !trackId.trim()) {
      throw new Error("缺少歌曲 ID");
    }

    await deleteMusicTrack(trackId);
    revalidatePath("/");
    return { ok: true, message: "歌曲已删除" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "删除失败，请稍后重试",
    };
  }
}
