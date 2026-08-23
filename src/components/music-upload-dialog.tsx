"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  FileAudio,
  LoaderCircle,
  Music2,
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

import { saveMusicDraft } from "@/app/actions/save-music-draft";
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
import { getTitleFromFileName } from "@/lib/music-file";

const supportedExtensions = new Set([
  "aac",
  "aiff",
  "flac",
  "m4a",
  "mp3",
  "ogg",
  "opus",
  "wav",
]);
const maxFileSizeBytes = 200 * 1024 * 1024;

type AnalysisState = "idle" | "analyzing" | "ready" | "error";
type SaveState = "idle" | "success" | "error";

type MusicAnalysis = {
  fileName: string;
  fileSize: string;
  format: string;
  duration: string;
  bitrate: string;
  sampleRate: string;
  channels: string;
  coverUrl?: string;
  nativeTagCount: number;
  warnings: string[];
};

type MusicDraft = {
  title: string;
  artist: string;
  album: string;
  genres: string;
  bpm: string;
  mood: string;
  year: string;
  comment: string;
};

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isSupportedAudioFile(file: File) {
  return file.type.startsWith("audio/") || supportedExtensions.has(getFileExtension(file.name));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "未知时长";
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

export function MusicUploadDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const analysisIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [draft, setDraft] = useState<MusicDraft | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isSaving, startSaving] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(
    () => () => {
      if (analysis?.coverUrl) URL.revokeObjectURL(analysis.coverUrl);
    },
    [analysis],
  );

  function resetAnalysis() {
    analysisIdRef.current += 1;
    setAnalysisState("idle");
    setAnalysis(null);
    setDraft(null);
    setSelectedFile(null);
    setSaveState("idle");
    setErrorMessage("");
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetAnalysis();
  }

  async function analyzeMusicFile(file: File) {
    if (!isSupportedAudioFile(file)) {
      setAnalysisState("error");
      setSelectedFile(null);
      setErrorMessage("请选择 MP3、M4A、AAC、WAV、FLAC、OGG、OPUS 或 AIFF 音频文件");
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setAnalysisState("error");
      setSelectedFile(null);
      setErrorMessage("单个文件不能超过 200 MB");
      return;
    }

    const analysisId = analysisIdRef.current + 1;
    analysisIdRef.current = analysisId;
    setAnalysisState("analyzing");
    setAnalysis(null);
    setDraft(null);
    setSelectedFile(null);
    setSaveState("idle");
    setErrorMessage("");

    try {
      const { parseBlob } = await import("music-metadata");
      const metadata = await parseBlob(file, { duration: true });
      if (analysisIdRef.current !== analysisId) return;

      const picture = metadata.common.picture?.[0];
      const coverUrl = picture
        ? URL.createObjectURL(
            new Blob([Uint8Array.from(picture.data)], { type: picture.format }),
          )
        : undefined;
      const nativeTagCount = Object.values(metadata.native).reduce(
        (total, tags) => total + tags.length,
        0,
      );

      setAnalysis({
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        format:
          metadata.format.container ||
          metadata.format.codec ||
          getFileExtension(file.name).toUpperCase(),
        duration: formatDuration(metadata.format.duration),
        bitrate: metadata.format.bitrate
          ? `${Math.round(metadata.format.bitrate / 1000)} kbps`
          : "未知码率",
        sampleRate: formatSampleRate(metadata.format.sampleRate),
        channels: metadata.format.numberOfChannels
          ? `${metadata.format.numberOfChannels} 声道`
          : "未知声道",
        coverUrl,
        nativeTagCount,
        warnings: metadata.quality.warnings.map((warning) => warning.message),
      });
      setDraft({
        title:
          metadata.common.title?.trim() || getTitleFromFileName(file.name),
        artist: metadata.common.artist ?? "",
        album: metadata.common.album ?? "",
        genres: metadata.common.genre?.join(", ") ?? "",
        bpm: metadata.common.bpm?.toString() ?? "",
        mood: metadata.common.mood ?? "",
        year: metadata.common.year?.toString() ?? "",
        comment:
          metadata.common.comment
            ?.map((item) => item.text)
            .filter(Boolean)
            .join(" · ") ?? "",
      });
      setSelectedFile(file);
      setAnalysisState("ready");
    } catch {
      if (analysisIdRef.current !== analysisId) return;
      setAnalysisState("error");
      setSelectedFile(null);
      setErrorMessage("无法解析这份音频文件，请检查文件是否完整或尝试其他格式");
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) void analyzeMusicFile(file);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void analyzeMusicFile(file);
  }

  function updateDraft(field: keyof MusicDraft, value: string) {
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft,
    );
    setSaveState("idle");
  }

  function handleSave() {
    if (!selectedFile || !draft || !draftIsValid) return;

    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("draft", JSON.stringify(draft));
    setSaveState("idle");
    setErrorMessage("");

    startSaving(async () => {
      const result = await saveMusicDraft(formData);
      if (result.ok) {
        setSaveState("success");
        router.refresh();
      } else {
        setSaveState("error");
        setErrorMessage(result.message);
      }
    });
  }

  const bpmIsValid =
    !draft?.bpm ||
    (Number.isFinite(Number(draft.bpm)) &&
      Number(draft.bpm) >= 1 &&
      Number(draft.bpm) <= 300);
  const yearIsValid =
    !draft?.year ||
    (Number.isInteger(Number(draft.year)) &&
      Number(draft.year) >= 1900 &&
      Number(draft.year) <= 2100);
  const draftIsValid = Boolean(
    draft?.title.trim() && bpmIsValid && yearIsValid,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="hidden lg:inline-flex" />}>
        <Upload aria-hidden="true" />
        导入歌曲
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="text-xl">导入音乐</DialogTitle>
          <DialogDescription>
            选择音乐文件，分析并确认 Tag 后保存到本地曲库。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-1">
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept="audio/*,.aac,.aiff,.flac,.m4a,.mp3,.ogg,.opus,.wav"
            onChange={handleInputChange}
          />
          <button
            type="button"
            className={`flex min-h-52 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
              <LoaderCircle className="size-9 animate-spin text-zinc-500" aria-hidden="true" />
            ) : (
              <FileAudio className="size-9 text-zinc-500" aria-hidden="true" />
            )}
            <strong className="mt-4 text-base">
              {analysisState === "analyzing" ? "正在读取文件与 Tag…" : "拖放音乐文件到这里"}
            </strong>
            <span className="mt-2 text-sm text-zinc-500">
              或点击选择 · 单文件 · 最大 200 MB
            </span>
            <span className="mt-1 text-xs text-zinc-400">
              MP3 / M4A / AAC / WAV / FLAC / OGG / OPUS / AIFF
            </span>
          </button>

          <div aria-live="polite">
            {analysisState === "idle" && (
              <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
                选择文件后将分析格式、时长、码率、封面和内嵌 Tag。
              </p>
            )}

            {analysisState === "error" && (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{errorMessage}</p>
              </div>
            )}

            {analysisState === "ready" && analysis && (
              <section aria-labelledby="analysis-title" className="grid gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-medium" id="analysis-title">
                      分析结果
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      共读取 {analysis.nativeTagCount} 个原始 Tag
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    分析完成
                  </span>
                </div>

                <div className="rounded-xl border bg-zinc-50 p-4">
                  <div className="flex min-w-0 gap-4">
                    {analysis.coverUrl ? (
                      <Image
                        unoptimized
                        className="size-24 shrink-0 rounded-lg object-cover"
                        src={analysis.coverUrl}
                        alt="音频内嵌封面"
                        width={96}
                        height={96}
                      />
                    ) : (
                      <span className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
                        <Music2 className="size-7" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0 self-center">
                      <p className="truncate font-medium">{analysis.fileName}</p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {analysis.format} · {analysis.duration} · {analysis.fileSize}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {analysis.bitrate} · {analysis.sampleRate} · {analysis.channels}
                      </p>
                    </div>
                  </div>

                  {draft && (
                    <div className="mt-4 border-t pt-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-medium">导入草稿</h3>
                          <p className="mt-1 text-xs text-zinc-500">
                            Tag 已自动填入，可以在当前窗体中修正。
                          </p>
                        </div>
                        {saveState === "success" && (
                          <span className="text-xs font-medium text-emerald-700">
                            已保存到本地曲库
                          </span>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="draft-title">标题 *</Label>
                          <Input
                            id="draft-title"
                            value={draft.title}
                            aria-invalid={!draft.title.trim()}
                            placeholder="未读取到 TITLE，请补充"
                            onChange={(event) =>
                              updateDraft("title", event.currentTarget.value)
                            }
                          />
                          {!draft.title.trim() && (
                            <p className="text-xs text-red-600">标题为必填字段</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="draft-artist">作者</Label>
                          <Input
                            id="draft-artist"
                            value={draft.artist}
                            placeholder="未读取到 ARTIST"
                            onChange={(event) =>
                              updateDraft("artist", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="draft-album">专辑</Label>
                          <Input
                            id="draft-album"
                            value={draft.album}
                            placeholder="未读取到 ALBUM"
                            onChange={(event) =>
                              updateDraft("album", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="draft-genres">风格</Label>
                          <Input
                            id="draft-genres"
                            value={draft.genres}
                            placeholder="多个值使用逗号分隔"
                            onChange={(event) =>
                              updateDraft("genres", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="draft-bpm">BPM</Label>
                          <Input
                            id="draft-bpm"
                            inputMode="numeric"
                            value={draft.bpm}
                            aria-invalid={!bpmIsValid}
                            placeholder="1–300"
                            onChange={(event) =>
                              updateDraft("bpm", event.currentTarget.value)
                            }
                          />
                          {!bpmIsValid && (
                            <p className="text-xs text-red-600">BPM 必须是 1–300</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="draft-mood">情绪</Label>
                          <Input
                            id="draft-mood"
                            value={draft.mood}
                            placeholder="例如：平静、专注"
                            onChange={(event) =>
                              updateDraft("mood", event.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="draft-year">年份</Label>
                          <Input
                            id="draft-year"
                            inputMode="numeric"
                            value={draft.year}
                            aria-invalid={!yearIsValid}
                            placeholder="1900–2100"
                            onChange={(event) =>
                              updateDraft("year", event.currentTarget.value)
                            }
                          />
                          {!yearIsValid && (
                            <p className="text-xs text-red-600">
                              年份必须是 1900–2100 的整数
                            </p>
                          )}
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor="draft-comment">备注</Label>
                          <Textarea
                            id="draft-comment"
                            value={draft.comment}
                            placeholder="未读取到 COMMENT"
                            onChange={(event) =>
                              updateDraft("comment", event.currentTarget.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {analysis.warnings.length > 0 && (
                    <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      解析器提示：{analysis.warnings.join("；")}
                    </div>
                  )}

                  {saveState === "error" && (
                    <div className="mt-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 px-6 py-4">
          <p className="mr-auto self-center text-xs text-zinc-500">
            文件保存到服务器本地目录，不会上传到云端
          </p>
          <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
          <Button
            type="button"
            variant="outline"
            disabled={analysisState === "analyzing" || isSaving}
            onClick={() => inputRef.current?.click()}
          >
            {analysisState === "idle" ? "选择文件" : "重新选择"}
          </Button>
          <Button
            type="button"
            disabled={
              analysisState !== "ready" ||
              !draftIsValid ||
              !selectedFile ||
              isSaving ||
              saveState === "success"
            }
            onClick={handleSave}
          >
            {isSaving
              ? "正在保存…"
              : saveState === "success"
                ? "已保存"
                : "保存到本地曲库"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
