import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { R2MusicStorageAdapter } from "../../storage/r2-storage-adapter";

export function createCloudflareObjectStorage() {
  const { env } = getCloudflareContext();

  if (!env.MUSIC_BUCKET) {
    throw new Error("Cloudflare 环境缺少 MUSIC_BUCKET R2 绑定");
  }

  return new R2MusicStorageAdapter(env.MUSIC_BUCKET);
}
