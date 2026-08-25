"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  LoaderCircle,
  Pause,
  Play,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaxonomyMultiSelect } from "@/components/taxonomy-multi-select";
import {
  parseMusicFolderEntries,
  recommendedSongAudioSizeBytes,
  type IncomingMusicFile,
  type MusicFolder,
} from "@/lib/music-catalog/music-folder";
import {
  findMusicTaxonomyIds,
  musicGenreOptions,
  musicMoodOptions,
  musicUseCaseOptions,
} from "@/lib/music-catalog/music-taxonomy";

type AnalysisState = "idle" | "analyzing" | "ready" | "error";
type SaveState = "ready" | "saving" | "saved" | "error";
type AudioVersion = "high" | "low";

type ActivePreview = {
  itemIndex: number;
  version: AudioVersion;
};

type MusicFileAnalysis = {
  fileName: string;
  fileSize: string;
  format: string;
  duration: string;
  durationSeconds?: number;
  bitrate: string;
  sampleRate: string;
  channels: string;
};

type MusicDraft = {
  title: string;
  artist: string;
  album: string;
  genreIds: string[];
  bpm: string;
  moodIds: string[];
  useCaseIds: string[];
  year: string;
  comment: string;
};

type UploadBatchSize = {
  audioBytes: number;
  coverBytes: number;
  totalBytes: number;
};

type UploadMusicDraftResult = {
  ok: boolean;
  message: string;
  trackId?: string;
};

function uploadMusicDraft(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<UploadMusicDraftResult> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/manager/tracks");
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      const result = request.response as UploadMusicDraftResult | null;
      if (result && typeof result.ok === "boolean") {
        resolve(
          request.status >= 200 && request.status < 300
            ? result
            : { ...result, ok: false },
        );
        return;
      }
      resolve({ ok: false, message: "上传失败，请稍后重试" });
    });
    request.addEventListener("error", () => {
      resolve({ ok: false, message: "网络连接中断，请重新上传" });
    });
    request.addEventListener("abort", () => {
      resolve({ ok: false, message: "上传已取消" });
    });
    request.send(formData);
  });
}

type BatchMusicItem = {
  folder: MusicFolder;
  uploadSize: UploadBatchSize;
  high: MusicFileAnalysis;
  low: MusicFileAnalysis;
  coverUrl: string;
  highUrl: string;
  lowUrl: string;
  nativeTagCount: number;
  warnings: string[];
  draft: MusicDraft;
  saveState: SaveState;
  errorMessage: string;
};

type BrowserFileEntry = {
  isDirectory: boolean;
  isFile: boolean;
  name: string;
  file?: (success: (file: File) => void, failure: (error: Error) => void) => void;
  createReader?: () => {
    readEntries: (
      success: (entries: BrowserFileEntry[]) => void,
      failure: (error: Error) => void,
    ) => void;
  };
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readUploadBatchSize(folder: MusicFolder): UploadBatchSize {
  const audioBytes = folder.highFile.size + folder.lowFile.size;
  const coverBytes = folder.coverFile.size;

  return {
    audioBytes,
    coverBytes,
    totalBytes: audioBytes + coverBytes,
  };
}

function formatDuration(seconds?: number) {
  if (seconds === undefined || !Number.isFinite(seconds)) return "未知时长";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function formatSampleRate(sampleRate?: number) {
  if (!sampleRate) return "未知采样率";
  return `${(sampleRate / 1000).toFixed(sampleRate % 1000 === 0 ? 0 : 1)} kHz`;
}

function VersionAnalysisCard({
  analysis,
  isActive,
  isPlaying,
  label,
  onTogglePreview,
}: {
  analysis: MusicFileAnalysis;
  isActive: boolean;
  isPlaying: boolean;
  label: string;
  onTogglePreview: () => void;
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border bg-white p-3 ${
        isActive ? "border-zinc-500 ring-1 ring-zinc-200" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="rounded bg-zinc-900 px-2 py-1 text-[10px] font-medium text-lime-300">
          {label}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          {analysis.fileName}
        </p>
        <Button
          type="button"
          size="icon-sm"
          variant={isActive ? "default" : "outline"}
          aria-label={`${isActive && isPlaying ? "暂停" : "试听"}${label}`}
          onClick={onTogglePreview}
        >
          {isActive && isPlaying ? (
            <Pause aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {analysis.format} · {analysis.duration} · {analysis.fileSize}
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        {analysis.bitrate} · {analysis.sampleRate} · {analysis.channels}
      </p>
    </div>
  );
}

async function readDirectoryEntries(entry: BrowserFileEntry) {
  const reader = entry.createReader?.();
  if (!reader) return [];
  const entries: BrowserFileEntry[] = [];

  while (true) {
    const nextEntries = await new Promise<BrowserFileEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (nextEntries.length === 0) break;
    entries.push(...nextEntries);
  }

  return entries;
}

async function collectDroppedEntry(
  entry: BrowserFileEntry,
  parentPath: string,
): Promise<IncomingMusicFile[]> {
  const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) =>
      entry.file?.(resolve, reject),
    );
    return [{ file, relativePath }];
  }

  if (entry.isDirectory) {
    const children = await readDirectoryEntries(entry);
    const nestedFiles = await Promise.all(
      children.map((child) => collectDroppedEntry(child, relativePath)),
    );
    return nestedFiles.flat();
  }

  return [];
}

async function getDroppedFiles(dataTransfer: DataTransfer) {
  const entries = Array.from(dataTransfer.items)
    .map<BrowserFileEntry | null | undefined>((item) => {
      const getEntry = (
        item as unknown as {
          webkitGetAsEntry?: () => BrowserFileEntry | null;
        }
      ).webkitGetAsEntry;
      return getEntry?.call(item);
    })
    .filter((entry): entry is BrowserFileEntry => Boolean(entry));

  if (entries.length > 0) {
    return (await Promise.all(entries.map((entry) => collectDroppedEntry(entry, "")))).flat();
  }

  return Array.from(dataTransfer.files).map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
}

export function MusicUploadDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaUrlsRef = useRef(new Set<string>());
  const analysisIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [items, setItems] = useState<BatchMusicItem[]>([]);
  const [globalError, setGlobalError] = useState("");
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewError, setPreviewError] = useState("");
  const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isSaving, startSaving] = useTransition();

  useEffect(
    () => () => {
      audioRef.current?.pause();
      mediaUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  function setDirectoryInput(node: HTMLInputElement | null) {
    inputRef.current = node;
    if (node) {
      node.setAttribute("webkitdirectory", "");
      node.setAttribute("directory", "");
    }
  }

  function stopPreview() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setActivePreview(null);
    setPreviewCurrentTime(0);
    setPreviewDuration(0);
    setPreviewError("");
    setPreviewIsPlaying(false);
  }

  function clearMediaUrls() {
    mediaUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    mediaUrlsRef.current.clear();
  }

  function resetAnalysis() {
    analysisIdRef.current += 1;
    stopPreview();
    clearMediaUrls();
    setAnalysisState("idle");
    setItems([]);
    setGlobalError("");
    setIsDragging(false);
    setUploadPercent(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetAnalysis();
  }

  async function analyzeMusicFolders(entries: IncomingMusicFile[]) {
    const analysisId = analysisIdRef.current + 1;
    analysisIdRef.current = analysisId;
    stopPreview();
    clearMediaUrls();
    setAnalysisState("analyzing");
    setItems([]);
    setGlobalError("");

    try {
      const folders = parseMusicFolderEntries(entries);
      const uploadBatchSizes = folders.map(readUploadBatchSize);
      const { parseBlob } = await import("music-metadata");
      const nextItems: BatchMusicItem[] = [];

      for (const [folderIndex, folder] of folders.entries()) {
        const uploadSize = uploadBatchSizes[folderIndex];
        const [highMetadata, lowMetadata] = await Promise.all([
          parseBlob(folder.highFile, { duration: true }),
          parseBlob(folder.lowFile, { duration: true }),
        ]);
        if (analysisIdRef.current !== analysisId) return;

        function createFileAnalysis(
          file: File,
          metadata: Awaited<ReturnType<typeof parseBlob>>,
        ): MusicFileAnalysis {
          return {
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            format: metadata.format.container || metadata.format.codec || "未知格式",
            duration: formatDuration(metadata.format.duration),
            durationSeconds: metadata.format.duration,
            bitrate: metadata.format.bitrate
              ? `${Math.round(metadata.format.bitrate / 1000)} kbps`
              : "未知码率",
            sampleRate: formatSampleRate(metadata.format.sampleRate),
            channels: metadata.format.numberOfChannels
              ? `${metadata.format.numberOfChannels} 声道`
              : "未知声道",
          };
        }

        const warnings = [
          ...highMetadata.quality.warnings.map(
            (warning) => `高清版：${warning.message}`,
          ),
          ...lowMetadata.quality.warnings.map(
            (warning) => `低清版：${warning.message}`,
          ),
        ];
        const highDuration = highMetadata.format.duration;
        const lowDuration = lowMetadata.format.duration;
        if (
          highDuration &&
          lowDuration &&
          Math.abs(highDuration - lowDuration) > Math.max(2, highDuration * 0.02)
        ) {
          warnings.push("高清版与低清版时长差异明显，请确认它们是同一首歌曲");
        }
        if (uploadSize.audioBytes > recommendedSongAudioSizeBytes) {
          warnings.push(
            `高清版与低清版合计 ${formatFileSize(uploadSize.audioBytes)}，建议控制在 20 MB 以内`,
          );
        }
        const coverUrl = URL.createObjectURL(folder.coverFile);
        const highUrl = URL.createObjectURL(folder.highFile);
        const lowUrl = URL.createObjectURL(folder.lowFile);
        mediaUrlsRef.current.add(coverUrl);
        mediaUrlsRef.current.add(highUrl);
        mediaUrlsRef.current.add(lowUrl);

        nextItems.push({
          folder,
          uploadSize,
          high: createFileAnalysis(folder.highFile, highMetadata),
          low: createFileAnalysis(folder.lowFile, lowMetadata),
          coverUrl,
          highUrl,
          lowUrl,
          nativeTagCount: Object.values(highMetadata.native).reduce(
            (total, tags) => total + tags.length,
            0,
          ),
          warnings,
          draft: {
            title: highMetadata.common.title?.trim() || folder.baseName,
            artist: highMetadata.common.artist ?? "",
            album: highMetadata.common.album ?? "",
            genreIds: findMusicTaxonomyIds(
              highMetadata.common.genre ?? [],
              musicGenreOptions,
            ),
            bpm: highMetadata.common.bpm?.toString() ?? "",
            moodIds: findMusicTaxonomyIds(
              highMetadata.common.mood ? [highMetadata.common.mood] : [],
              musicMoodOptions,
            ),
            useCaseIds: [],
            year: highMetadata.common.year?.toString() ?? "",
            comment:
              highMetadata.common.comment
                ?.map((comment) => comment.text)
                .filter(Boolean)
                .join(" · ") ?? "",
          },
          saveState: "ready",
          errorMessage: "",
        });
      }

      setItems(nextItems);
      setAnalysisState("ready");
    } catch (error) {
      if (analysisIdRef.current !== analysisId) return;
      clearMediaUrls();
      setAnalysisState("error");
      setGlobalError(
        error instanceof Error ? error.message : "无法分析这些歌曲文件夹",
      );
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const entries = Array.from(event.currentTarget.files ?? []).map((file) => ({
      file,
      relativePath: file.webkitRelativePath || file.name,
    }));
    void analyzeMusicFolders(entries);
  }

  async function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    try {
      await analyzeMusicFolders(await getDroppedFiles(event.dataTransfer));
    } catch {
      setAnalysisState("error");
      setGlobalError("无法读取拖放的文件夹，请改用“选择文件夹”");
    }
  }

  async function togglePreview(itemIndex: number, version: AudioVersion) {
    const audio = audioRef.current;
    const item = items[itemIndex];
    if (!audio || !item) return;

    const isCurrentPreview =
      activePreview?.itemIndex === itemIndex &&
      activePreview.version === version;
    if (isCurrentPreview && !audio.paused) {
      audio.pause();
      return;
    }

    if (!isCurrentPreview) {
      audio.pause();
      audio.src = version === "high" ? item.highUrl : item.lowUrl;
      audio.load();
      setActivePreview({ itemIndex, version });
      setPreviewCurrentTime(0);
      setPreviewDuration(
        (version === "high" ? item.high : item.low).durationSeconds ?? 0,
      );
    }

    setPreviewError("");
    try {
      await audio.play();
    } catch {
      setPreviewError("浏览器无法播放这个音频格式，请下载后检查");
      setPreviewIsPlaying(false);
    }
  }

  function seekPreview(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setPreviewCurrentTime(value);
  }

  function updateDraft<Field extends keyof MusicDraft>(
    itemIndex: number,
    field: Field,
    value: MusicDraft[Field],
  ) {
    setItems((currentItems) =>
      currentItems.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              draft: { ...item.draft, [field]: value },
              saveState: item.saveState === "saved" ? "ready" : item.saveState,
              errorMessage: "",
            }
          : item,
      ),
    );
  }

  function draftIsValid(draft: MusicDraft) {
    const bpmIsValid =
      !draft.bpm ||
      (Number.isFinite(Number(draft.bpm)) &&
        Number(draft.bpm) >= 1 &&
        Number(draft.bpm) <= 300);
    const yearIsValid =
      !draft.year ||
      (Number.isInteger(Number(draft.year)) &&
        Number(draft.year) >= 1900 &&
        Number(draft.year) <= 2100);
    return Boolean(draft.title.trim() && bpmIsValid && yearIsValid);
  }

  function handleSaveAll() {
    if (items.some((item) => !draftIsValid(item.draft))) return;

    startSaving(async () => {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        if (item.saveState === "saved") continue;

        setItems((currentItems) =>
          currentItems.map((currentItem, currentIndex) =>
            currentIndex === index
              ? { ...currentItem, saveState: "saving", errorMessage: "" }
              : currentItem,
          ),
        );

        const formData = new FormData();
        formData.set("folderName", item.folder.folderName);
        formData.set("highFile", item.folder.highFile);
        formData.set("lowFile", item.folder.lowFile);
        formData.set("coverFile", item.folder.coverFile);
        formData.set("draft", JSON.stringify(item.draft));
        setUploadPercent(0);
        const result = await uploadMusicDraft(formData, setUploadPercent);

        setItems((currentItems) =>
          currentItems.map((currentItem, currentIndex) =>
            currentIndex === index
              ? {
                  ...currentItem,
                  saveState: result.ok ? "saved" : "error",
                  errorMessage: result.ok ? "" : result.message,
                }
              : currentItem,
          ),
        );
      }

      router.refresh();
    });
  }

  const savedCount = items.filter((item) => item.saveState === "saved").length;
  const allDraftsValid = items.every((item) => draftIsValid(item.draft));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="hidden lg:inline-flex" />}>
        <Upload aria-hidden="true" />
        导入歌曲
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="text-xl">批量导入歌曲文件夹</DialogTitle>
          <DialogDescription>
            每个文件夹形成一个上传批次；双版本音频建议合计不超过 20 MB。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-1">
          <input
            ref={setDirectoryInput}
            multiple
            className="hidden"
            type="file"
            onChange={handleInputChange}
          />
          <audio
            ref={audioRef}
            className="hidden"
            onDurationChange={(event) => {
              const duration = event.currentTarget.duration;
              if (Number.isFinite(duration)) setPreviewDuration(duration);
            }}
            onEnded={() => setPreviewIsPlaying(false)}
            onPause={() => setPreviewIsPlaying(false)}
            onPlay={() => setPreviewIsPlaying(true)}
            onTimeUpdate={(event) =>
              setPreviewCurrentTime(event.currentTarget.currentTime)
            }
          />
          <button
            type="button"
            className={`flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isDragging
                ? "border-lime-500 bg-lime-50"
                : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {analysisState === "analyzing" ? (
              <LoaderCircle className="size-8 animate-spin text-zinc-500" aria-hidden="true" />
            ) : (
              <FolderOpen className="size-8 text-zinc-500" aria-hidden="true" />
            )}
            <strong className="mt-3 text-base">
              {analysisState === "analyzing"
                ? "正在逐个分析歌曲文件夹…"
                : "选择批量根目录或拖放多个歌曲文件夹"}
            </strong>
            <span className="mt-2 text-sm text-zinc-500">
              song/song__h.flac · song/song__l.ogg · song/cover.jpg
            </span>
          </button>

          {analysisState === "idle" && (
            <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
              可以直接选择单个歌曲文件夹，也可以选择包含多个歌曲子文件夹的根目录。
            </p>
          )}

          {analysisState === "error" && (
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{globalError}</p>
            </div>
          )}

          {analysisState === "ready" && (
            <section className="grid gap-3" aria-label="批量歌曲分析结果">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-medium">已识别 {items.length} 个上传批次</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    已先读取本地文件大小；每首歌曲作为一个批次顺序上传。
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  结构校验通过
                </span>
              </div>

              {items.map((item, itemIndex) => {
                const activeVersion =
                  activePreview?.itemIndex === itemIndex
                    ? activePreview.version
                    : null;
                const bpmIsValid =
                  !item.draft.bpm ||
                  (Number.isFinite(Number(item.draft.bpm)) &&
                    Number(item.draft.bpm) >= 1 &&
                    Number(item.draft.bpm) <= 300);
                const yearIsValid =
                  !item.draft.year ||
                  (Number.isInteger(Number(item.draft.year)) &&
                    Number(item.draft.year) >= 1900 &&
                    Number(item.draft.year) <= 2100);

                return (
                  <details
                    className="group overflow-hidden rounded-xl border bg-zinc-50"
                    key={item.folder.folderPath}
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 bg-white p-4 [&::-webkit-details-marker]:hidden">
                      <Image
                        unoptimized
                        className="size-12 shrink-0 rounded-lg object-cover"
                        src={item.coverUrl}
                        alt={`${item.draft.title} 封面`}
                        width={48}
                        height={48}
                      />
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-medium">
                          {item.draft.title || item.folder.baseName}
                        </strong>
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          批次 {itemIndex + 1} · 音频 {formatFileSize(item.uploadSize.audioBytes)} ·
                          封面 {formatFileSize(item.uploadSize.coverBytes)} · 合计 {formatFileSize(item.uploadSize.totalBytes)}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-zinc-500">
                        {item.saveState === "saving"
                          ? "正在上传…"
                          : item.saveState === "saved"
                            ? "已上传"
                            : item.saveState === "error"
                              ? "保存失败"
                              : "待保存"}
                      </span>
                    </summary>

                    <div className="grid gap-4 border-t p-4">
                      <div className="grid gap-3 lg:grid-cols-2">
                        <VersionAnalysisCard
                          analysis={item.high}
                          isActive={activeVersion === "high"}
                          isPlaying={previewIsPlaying}
                          label="高清版"
                          onTogglePreview={() =>
                            void togglePreview(itemIndex, "high")
                          }
                        />
                        <VersionAnalysisCard
                          analysis={item.low}
                          isActive={activeVersion === "low"}
                          isPlaying={previewIsPlaying}
                          label="低清版 OGG"
                          onTogglePreview={() =>
                            void togglePreview(itemIndex, "low")
                          }
                        />
                      </div>

                      {activeVersion && (
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-2">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            aria-label={previewIsPlaying ? "暂停试听" : "继续试听"}
                            onClick={() =>
                              void togglePreview(itemIndex, activeVersion)
                            }
                          >
                            {previewIsPlaying ? (
                              <Pause aria-hidden="true" />
                            ) : (
                              <Play aria-hidden="true" />
                            )}
                          </Button>
                          <span className="text-xs font-medium text-zinc-600">
                            {activeVersion === "high" ? "高清版" : "低清版 OGG"}
                          </span>
                          <input
                            className="h-2 min-w-40 flex-1 cursor-pointer accent-zinc-900"
                            type="range"
                            min="0"
                            max={previewDuration || 0}
                            step="0.1"
                            value={Math.min(
                              previewCurrentTime,
                              previewDuration || 0,
                            )}
                            aria-label="试听进度"
                            onChange={(event) =>
                              seekPreview(Number(event.currentTarget.value))
                            }
                          />
                          <span className="tabular-nums text-xs text-zinc-500">
                            {formatDuration(previewCurrentTime)} / {formatDuration(previewDuration)}
                          </span>
                          {previewError && (
                            <p className="basis-full text-xs text-red-600">
                              {previewError}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor={`batch-title-${itemIndex}`}>标题 *</Label>
                          <Input
                            id={`batch-title-${itemIndex}`}
                            value={item.draft.title}
                            aria-invalid={!item.draft.title.trim()}
                            onChange={(event) =>
                              updateDraft(itemIndex, "title", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`batch-artist-${itemIndex}`}>作者</Label>
                          <Input
                            id={`batch-artist-${itemIndex}`}
                            value={item.draft.artist}
                            onChange={(event) =>
                              updateDraft(itemIndex, "artist", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`batch-album-${itemIndex}`}>专辑</Label>
                          <Input
                            id={`batch-album-${itemIndex}`}
                            value={item.draft.album}
                            onChange={(event) =>
                              updateDraft(itemIndex, "album", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>风格</Label>
                          <TaxonomyMultiSelect
                            label="风格"
                            options={musicGenreOptions}
                            value={item.draft.genreIds}
                            onChange={(genreIds) =>
                              updateDraft(itemIndex, "genreIds", genreIds)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`batch-bpm-${itemIndex}`}>BPM</Label>
                          <Input
                            id={`batch-bpm-${itemIndex}`}
                            inputMode="numeric"
                            value={item.draft.bpm}
                            aria-invalid={!bpmIsValid}
                            onChange={(event) =>
                              updateDraft(itemIndex, "bpm", event.currentTarget.value)
                            }
                          />
                          {!bpmIsValid && (
                            <p className="text-xs text-red-600">BPM 必须是 1–300</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label>情绪</Label>
                          <TaxonomyMultiSelect
                            label="情绪"
                            options={musicMoodOptions}
                            value={item.draft.moodIds}
                            onChange={(moodIds) =>
                              updateDraft(itemIndex, "moodIds", moodIds)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>场景</Label>
                          <TaxonomyMultiSelect
                            label="场景"
                            options={musicUseCaseOptions}
                            value={item.draft.useCaseIds}
                            onChange={(useCaseIds) =>
                              updateDraft(itemIndex, "useCaseIds", useCaseIds)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`batch-year-${itemIndex}`}>年份</Label>
                          <Input
                            id={`batch-year-${itemIndex}`}
                            inputMode="numeric"
                            value={item.draft.year}
                            aria-invalid={!yearIsValid}
                            onChange={(event) =>
                              updateDraft(itemIndex, "year", event.currentTarget.value)
                            }
                          />
                          {!yearIsValid && (
                            <p className="text-xs text-red-600">
                              年份必须是 1900–2100 的整数
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor={`batch-comment-${itemIndex}`}>备注</Label>
                          <Textarea
                            id={`batch-comment-${itemIndex}`}
                            value={item.draft.comment}
                            onChange={(event) =>
                              updateDraft(itemIndex, "comment", event.currentTarget.value)
                            }
                          />
                        </div>
                      </div>

                      {item.warnings.length > 0 && (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          解析器提示：{item.warnings.join("；")}
                        </div>
                      )}
                      {item.errorMessage && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {item.errorMessage}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </section>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 px-6 py-4">
          <p className="mr-auto self-center text-xs text-zinc-500">
            {items.length > 0
              ? `已上传 ${savedCount}/${items.length} 个批次 · 总计 ${formatFileSize(
                  items.reduce((total, item) => total + item.uploadSize.totalBytes, 0),
                )}`
              : "每首歌曲作为一个独立上传批次"}
          </p>
          <DialogClose render={<Button variant="outline" disabled={isSaving} />}>
            关闭
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            disabled={analysisState === "analyzing" || isSaving}
            onClick={() => inputRef.current?.click()}
          >
            重新选择文件夹
          </Button>
          <Button
            type="button"
            className={isSaving ? "hidden" : undefined}
            disabled={
              analysisState !== "ready" ||
              items.length === 0 ||
              !allDraftsValid ||
              savedCount === items.length
            }
            onClick={handleSaveAll}
          >
            上传 {items.length - savedCount} 个批次
          </Button>
          {isSaving && (
            <div
              className="relative flex h-9 min-w-60 items-center justify-center overflow-hidden rounded-md border border-zinc-300 bg-zinc-100 px-4 text-sm font-medium text-zinc-900"
              role="progressbar"
              aria-label="歌曲上传进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadPercent}
            >
              <span
                className="absolute inset-y-0 left-0 bg-lime-300 transition-[width] duration-150 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
              <span className="relative tabular-nums">
                第 {Math.min(savedCount + 1, items.length)}/{items.length} 批 · {uploadPercent}%
              </span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
