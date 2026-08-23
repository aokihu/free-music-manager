export function getTitleFromFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  const title = extensionIndex > 0 ? fileName.slice(0, extensionIndex) : fileName;
  return title.trim();
}
