"use server";

import { revalidatePath } from "next/cache";

import { isTrackPublicationStatus } from "@/lib/music-catalog/publication-status";
import { updateMusicTrackStatus } from "@/lib/music-catalog/music-catalog-service";

export type UpdateMusicStatusResult = {
  ok: boolean;
  message: string;
};

export async function updateMusicStatus(
  formData: FormData,
): Promise<UpdateMusicStatusResult> {
  try {
    const trackId = formData.get("trackId");
    const nextStatus = formData.get("nextStatus");
    if (typeof trackId !== "string" || !trackId.trim()) {
      throw new Error("缺少歌曲 ID");
    }
    if (!isTrackPublicationStatus(nextStatus)) {
      throw new Error("目标状态无效");
    }

    await updateMusicTrackStatus(trackId, nextStatus);
    revalidatePath("/");
    return { ok: true, message: "歌曲状态已更新" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "状态更新失败，请稍后重试",
    };
  }
}
