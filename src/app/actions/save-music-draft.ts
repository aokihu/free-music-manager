"use server";

import { revalidatePath } from "next/cache";

import { saveMusicToCatalog } from "@/lib/music-catalog/music-catalog-service";
import { parseMusicDraft } from "@/lib/music-catalog/draft-validation";
import { parseMusicFolderFiles } from "@/lib/music-catalog/music-folder";

export type SaveMusicDraftResult = {
  ok: boolean;
  message: string;
  trackId?: string;
};

function getMusicFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) throw new Error("缺少音乐文件");
  return value;
}

export async function saveMusicDraft(
  formData: FormData,
): Promise<SaveMusicDraftResult> {
  try {
    const folderName = formData.get("folderName");
    if (typeof folderName !== "string") throw new Error("缺少歌曲文件夹名称");
    const folder = parseMusicFolderFiles(folderName, [
      getMusicFile(formData.get("highFile")),
      getMusicFile(formData.get("lowFile")),
      getMusicFile(formData.get("coverFile")),
    ]);
    const draft = parseMusicDraft(formData.get("draft"), folder.baseName);
    const track = await saveMusicToCatalog(
      folder.folderName,
      [folder.highFile, folder.lowFile, folder.coverFile],
      draft,
    );
    revalidatePath("/");
    return { ok: true, message: "歌曲上传并保存成功", trackId: track.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "保存失败，请稍后重试",
    };
  }
}
