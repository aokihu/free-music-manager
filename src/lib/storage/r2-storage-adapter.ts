import "server-only";

import { parseStorageObjectKey } from "./parse-storage-object-key";
import type { MusicStorageAdapter, StoredObjectOptions } from "./types";

export class R2MusicStorageAdapter implements MusicStorageAdapter {
  constructor(private readonly bucket: R2Bucket) {}

  async deleteObject(key: string) {
    await this.bucket.delete(parseStorageObjectKey(key));
  }

  async getObject(key: string) {
    const object = await this.bucket.get(parseStorageObjectKey(key));
    if (!object) return null;

    return new Uint8Array(await object.arrayBuffer());
  }

  async putObject(
    key: string,
    body: Uint8Array,
    options?: StoredObjectOptions,
  ) {
    await this.bucket.put(parseStorageObjectKey(key), body, {
      httpMetadata: options?.contentType
        ? { contentType: options.contentType }
        : undefined,
    });
  }
}
