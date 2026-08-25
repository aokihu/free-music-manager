export function parseStorageObjectKey(key: string) {
  const normalizedKey = key.replaceAll("\\", "/");

  if (
    !normalizedKey ||
    normalizedKey.startsWith("/") ||
    normalizedKey.split("/").some((segment) => segment === ".." || !segment)
  ) {
    throw new Error(`无效的存储对象路径：${key}`);
  }

  return normalizedKey;
}
