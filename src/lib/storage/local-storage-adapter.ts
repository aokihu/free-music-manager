import "server-only";

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { MusicStorageAdapter } from "./types";

function resolveStorageObjectPath(rootPath: string, key: string) {
  const normalizedKey = key.replaceAll("\\", "/");

  if (
    !normalizedKey ||
    path.posix.isAbsolute(normalizedKey) ||
    normalizedKey.split("/").some((segment) => segment === ".." || !segment)
  ) {
    throw new Error(`无效的存储对象路径：${key}`);
  }

  const objectPath = path.resolve(rootPath, ...normalizedKey.split("/"));
  const relativePath = path.relative(rootPath, objectPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`存储对象超出本地曲库目录：${key}`);
  }

  return objectPath;
}

export class LocalMusicStorageAdapter implements MusicStorageAdapter {
  private readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);
  }

  async getObject(key: string) {
    try {
      return new Uint8Array(
        await readFile(resolveStorageObjectPath(this.rootPath, key)),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }

      throw error;
    }
  }

  async putObject(key: string, body: Uint8Array) {
    const objectPath = resolveStorageObjectPath(this.rootPath, key);
    const directoryPath = path.dirname(objectPath);
    const temporaryPath = `${objectPath}.${randomUUID()}.tmp`;

    await mkdir(directoryPath, { recursive: true });

    try {
      await writeFile(temporaryPath, body);
      await rename(temporaryPath, objectPath);
    } finally {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  }
}
