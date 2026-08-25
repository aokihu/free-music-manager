import "server-only";

import { mkdir, readFile, rename, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { parseStorageObjectKey } from "./parse-storage-object-key";
import type { MusicStorageAdapter } from "./types";

function resolveStorageObjectPath(rootPath: string, key: string) {
  const normalizedKey = parseStorageObjectKey(key);

  const objectPath = path.resolve(rootPath, ...normalizedKey.split("/"));
  const relativePath = path.relative(rootPath, objectPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`存储对象超出本地曲库目录：${key}`);
  }

  return objectPath;
}

async function removeEmptyParentDirectories(rootPath: string, objectPath: string) {
  let directoryPath = path.dirname(objectPath);

  while (directoryPath !== rootPath) {
    try {
      await rmdir(directoryPath);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error.code === "ENOENT" ||
          error.code === "ENOTEMPTY" ||
          error.code === "EEXIST")
      ) {
        return;
      }
      throw error;
    }
    directoryPath = path.dirname(directoryPath);
  }
}

export class LocalMusicStorageAdapter implements MusicStorageAdapter {
  private readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);
  }

  async deleteObject(key: string) {
    const objectPath = resolveStorageObjectPath(this.rootPath, key);
    await rm(objectPath, { force: true });
    await removeEmptyParentDirectories(this.rootPath, objectPath);
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
