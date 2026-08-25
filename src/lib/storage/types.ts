export type StoredObjectOptions = {
  contentType?: string;
};

export interface MusicStorageAdapter {
  deleteObject(key: string): Promise<void>;
  getObject(key: string): Promise<Uint8Array | null>;
  putObject(
    key: string,
    body: Uint8Array,
    options?: StoredObjectOptions,
  ): Promise<void>;
}
