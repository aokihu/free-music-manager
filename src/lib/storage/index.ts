import "server-only";

import path from "node:path";

import { LocalMusicStorageAdapter } from "./local-storage-adapter";
import type { MusicStorageAdapter } from "./types";

export type MusicStorageDriver = "local" | "r2";

let adapter: MusicStorageAdapter | undefined;

function parseStorageDriver(value?: string): MusicStorageDriver {
  if (!value || value === "local") return "local";
  if (value === "r2") return "r2";
  throw new Error(`不支持的 MUSIC_STORAGE_DRIVER：${value}`);
}

export function getMusicStorage(): MusicStorageAdapter {
  if (adapter) return adapter;

  const driver = parseStorageDriver(process.env.MUSIC_STORAGE_DRIVER);

  if (driver === "r2") {
    throw new Error("R2 存储适配器尚未实现，请暂时使用 MUSIC_STORAGE_DRIVER=local");
  }

  const localPath =
    process.env.MUSIC_LOCAL_STORAGE_PATH ?? path.join(process.cwd(), "storage");
  adapter = new LocalMusicStorageAdapter(localPath);
  return adapter;
}

export type { MusicStorageAdapter, StoredObjectOptions } from "./types";
