export const supportedHighQualityExtensions = new Set([
  "aac",
  "aiff",
  "flac",
  "m4a",
  "mp3",
  "ogg",
  "opus",
  "wav",
]);

export const maxMusicFileSizeBytes = 200 * 1024 * 1024;
export const maxCoverFileSizeBytes = 20 * 1024 * 1024;

export type IncomingMusicFile = {
  file: File;
  relativePath: string;
};

export type MusicFolder = {
  folderName: string;
  folderPath: string;
  baseName: string;
  highFile: File;
  lowFile: File;
  coverFile: File;
};

function validateAudioFile(file: File) {
  if (file.size === 0) throw new Error(`${file.name} 是空文件`);
  if (file.size > maxMusicFileSizeBytes) {
    throw new Error(`${file.name} 超过 200 MB`);
  }
}

function parseMusicFolder(
  folderPath: string,
  files: File[],
): MusicFolder {
  const folderName = folderPath.split("/").filter(Boolean).pop() ?? "";
  if (!folderName) throw new Error("音乐文件必须放在歌曲文件夹中");

  const visibleFiles = files.filter((file) => !file.name.startsWith("."));
  const highFiles = visibleFiles.filter((file) => /__h\.[^.]+$/.test(file.name));
  const lowVersionFiles = visibleFiles.filter((file) => /__l\.[^.]+$/.test(file.name));
  const coverFiles = visibleFiles.filter((file) => /^cover\.(png|jpe?g)$/i.test(file.name));

  if (highFiles.length !== 1) {
    throw new Error(`${folderName} 必须且只能包含一份 __h 高清音频`);
  }
  if (lowVersionFiles.length !== 1) {
    throw new Error(`${folderName} 必须且只能包含一份 __l 低清音频`);
  }
  if (coverFiles.length !== 1) {
    throw new Error(`${folderName} 必须且只能包含 cover.png、cover.jpg 或 cover.jpeg`);
  }
  if (visibleFiles.length !== 3) {
    throw new Error(`${folderName} 包含无法识别的额外文件`);
  }

  const highFile = highFiles[0];
  const lowFile = lowVersionFiles[0];
  const coverFile = coverFiles[0];
  const highMatch = /^(.+)__h\.([^.]+)$/.exec(highFile.name);
  const lowMatch = /^(.+)__l\.ogg$/.exec(lowFile.name);
  if (!highMatch) throw new Error(`${highFile.name} 的高清版命名无效`);
  if (!lowMatch) throw new Error(`${lowFile.name} 的低清版必须使用 __l.ogg`);
  if (!highMatch[1].trim()) throw new Error(`${highFile.name} 的基础文件名不能为空`);
  if (highMatch[1] !== lowMatch[1]) {
    throw new Error(`${folderName} 的高清版与低清版基础文件名必须完全一致`);
  }
  if (!supportedHighQualityExtensions.has(highMatch[2].toLowerCase())) {
    throw new Error(`${highFile.name} 的高清音频格式不受支持`);
  }

  validateAudioFile(highFile);
  validateAudioFile(lowFile);
  if (coverFile.size === 0) throw new Error(`${coverFile.name} 是空文件`);
  if (coverFile.size > maxCoverFileSizeBytes) {
    throw new Error(`${coverFile.name} 超过 20 MB`);
  }

  return {
    folderName,
    folderPath,
    baseName: highMatch[1].trim(),
    highFile,
    lowFile,
    coverFile,
  };
}

export function parseMusicFolderFiles(
  folderName: string,
  files: File[],
): MusicFolder {
  if (folderName.includes("/") || folderName.includes("\\") || !folderName.trim()) {
    throw new Error("歌曲文件夹名称无效");
  }
  return parseMusicFolder(folderName.trim(), files);
}

export function parseMusicFolderEntries(
  entries: IncomingMusicFile[],
): MusicFolder[] {
  const filesByFolder = new Map<string, File[]>();

  for (const entry of entries) {
    if (entry.file.name.startsWith(".")) continue;
    const normalizedPath = entry.relativePath.replaceAll("\\", "/");
    const parts = normalizedPath.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error(`${entry.file.name} 不在歌曲文件夹中`);
    }

    const folderParts = parts.slice(0, -1);
    if (folderParts.some((part) => part.startsWith("."))) continue;
    const folderPath = folderParts.join("/");
    const folderFiles = filesByFolder.get(folderPath) ?? [];
    folderFiles.push(entry.file);
    filesByFolder.set(folderPath, folderFiles);
  }

  if (filesByFolder.size === 0) throw new Error("没有找到歌曲文件夹");

  return Array.from(filesByFolder.entries())
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([folderPath, files]) => parseMusicFolder(folderPath, files));
}
