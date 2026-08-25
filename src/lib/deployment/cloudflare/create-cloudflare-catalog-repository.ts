import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { D1MusicCatalogRepository } from "../../music-catalog/d1-catalog-repository";

export function createCloudflareCatalogRepository() {
  const { env } = getCloudflareContext();

  if (!env.MUSIC_DB) {
    throw new Error("Cloudflare 环境缺少 MUSIC_DB D1 绑定");
  }

  return new D1MusicCatalogRepository(env.MUSIC_DB);
}
