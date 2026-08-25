import { saveMusicToCatalog } from "@/lib/music-catalog/music-catalog-service";
import { parseMusicDraft } from "@/lib/music-catalog/draft-validation";
import { parseMusicFolderFiles } from "@/lib/music-catalog/music-folder";

type UploadMusicDraftResult = {
  ok: boolean;
  message: string;
  trackId?: string;
};

function getMusicFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) throw new Error("缺少音乐文件");
  return value;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const folderName = formData.get("folderName");
    if (typeof folderName !== "string") {
      throw new Error("缺少歌曲文件夹名称");
    }

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

    return Response.json({
      ok: true,
      message: "歌曲上传并保存成功",
      trackId: track.id,
    } satisfies UploadMusicDraftResult);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "保存失败，请稍后重试",
      } satisfies UploadMusicDraftResult,
      { status: 400 },
    );
  }
}
