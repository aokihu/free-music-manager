"use client";

import {
  AlertCircle,
  ImagePlus,
  Save,
  Trash2,
  Undo2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { updateMusicTrack } from "@/app/actions/update-music-track";
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
import type {
  ManagerTrack,
  StoredAudioFile,
} from "@/lib/music-catalog/types";

type EditableMusicDraft = {
  title: string;
  artist: string;
  album: string;
  genres: string;
  bpm: string;
  mood: string;
  year: string;
  comment: string;
};

const mediaPanelStyle = { height: "11rem" } as const;

function createEditableDraft(track: ManagerTrack): EditableMusicDraft {
  return {
    title: track.title,
    artist: track.artist,
    album: track.album,
    genres: track.genres.join(", "),
    bpm: track.bpm?.toString() ?? "",
    mood: track.mood,
    year: track.year?.toString() ?? "",
    comment: track.comment,
  };
}

function formatFileSize(bytes: number) {
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

function AudioFileSummary({
  audio,
  label,
}: {
  audio: StoredAudioFile;
  label: string;
}) {
  return (
    <li className="flex min-w-0 items-center px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-zinc-500">
            {label}
          </span>
          <p className="truncate text-sm font-medium">{audio.fileName}</p>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {audio.container ?? "未知格式"} · {formatDuration(audio.durationSeconds)} · {formatFileSize(audio.sizeBytes)}
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          {audio.bitrateKbps ? `${audio.bitrateKbps} kbps` : "未知码率"} · {audio.sampleRateHz ? `${audio.sampleRateHz / 1000} kHz` : "未知采样率"} · {audio.numberOfChannels ? `${audio.numberOfChannels} 声道` : "未知声道"}
        </p>
      </div>
    </li>
  );
}

export function MusicEditDialog({
  track,
  mobile = false,
}: {
  track: ManagerTrack;
  mobile?: boolean;
}) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => createEditableDraft(track));
  const [savedDraft, setSavedDraft] = useState(() => createEditableDraft(track));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      const nextDraft = createEditableDraft(track);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setCoverFile(null);
      setRemoveCover(false);
      setErrorMessage("");
      setSaveSucceeded(false);
    }
  }

  function updateDraft(field: keyof EditableMusicDraft, value: string) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    setErrorMessage("");
    setSaveSucceeded(false);
  }

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
  const draftIsValid = Boolean(draft.title.trim() && bpmIsValid && yearIsValid);
  const hasUnsavedChanges =
    JSON.stringify(draft) !== JSON.stringify(savedDraft) ||
    Boolean(coverFile) ||
    removeCover;
  const coverPreviewUrl = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : ""),
    [coverFile],
  );

  useEffect(
    () => () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    },
    [coverPreviewUrl],
  );

  function handleSave() {
    if (!draftIsValid || !hasUnsavedChanges) return;

    const formData = new FormData();
    formData.set("trackId", track.id);
    formData.set("draft", JSON.stringify(draft));
    if (coverFile) formData.set("coverFile", coverFile);
    if (removeCover) formData.set("removeCover", "true");

    startSaving(async () => {
      const result = await updateMusicTrack(formData);
      if (result.ok) {
        setSavedDraft(draft);
        setCoverFile(null);
        setRemoveCover(false);
        if (coverInputRef.current) coverInputRef.current.value = "";
        setSaveSucceeded(true);
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            className={mobile ? "w-full" : undefined}
            size="sm"
            variant={mobile ? "outline" : "ghost"}
          />
        }
      >
        编辑
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="text-xl">编辑歌曲信息</DialogTitle>
          <DialogDescription>
            可更新歌曲封面和曲库元数据，不会修改或重新写入音频文件。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-1">
          <section
            className="grid gap-5 sm:grid-cols-2"
            aria-label="歌曲封面和文件信息"
          >
            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <h3 className="text-sm font-medium">歌曲封面</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  支持 PNG、JPG、JPEG，最大 20 MB。
                </p>
              </div>
              <div
                className="group relative isolate w-full shrink-0 overflow-hidden rounded-xl bg-zinc-950 shadow-sm [clip-path:inset(0_round_0.75rem)]"
                data-cover-editor
                style={mediaPanelStyle}
              >
                <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
                  <Image
                    alt={
                      coverFile
                        ? "新封面预览"
                        : removeCover || !track.hasCover
                          ? "歌曲封面占位图"
                          : `${track.title} 的当前封面`
                    }
                    className="scale-[1.01] transform-gpu object-cover transition-[filter,transform] duration-200 group-hover:scale-[1.03] group-hover:blur-[2px]"
                    fill
                    sizes="(min-width: 640px) 340px, calc(100vw - 3rem)"
                    src={
                      coverPreviewUrl ||
                      (removeCover || !track.hasCover
                        ? "/cover-placeholder.png"
                        : track.coverUrl)
                    }
                    unoptimized
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/25 p-4 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                  <div className="flex items-center gap-2 rounded-xl bg-black/15 p-1.5 shadow-sm backdrop-blur-sm">
                    <Button
                      className="rounded-lg bg-white/95 px-4 text-zinc-950 hover:bg-white"
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      <ImagePlus aria-hidden="true" />
                      替换
                    </Button>
                    <Button
                      className={
                        removeCover
                          ? "rounded-lg bg-white/95 px-4 text-zinc-950 hover:bg-white"
                          : "rounded-lg bg-red-600 px-4 text-white shadow-sm hover:bg-red-700 focus-visible:border-red-400 focus-visible:ring-red-600/30 dark:bg-red-600 dark:hover:bg-red-700"
                      }
                      disabled={!removeCover && !track.hasCover && !coverFile}
                      size="sm"
                      type="button"
                      variant={removeCover ? "secondary" : "destructive"}
                      onClick={() => {
                        if (removeCover) {
                          setRemoveCover(false);
                          setErrorMessage("");
                          setSaveSucceeded(false);
                          return;
                        }
                        setCoverFile(null);
                        setRemoveCover(true);
                        setErrorMessage("");
                        setSaveSucceeded(false);
                        if (coverInputRef.current) {
                          coverInputRef.current.value = "";
                        }
                      }}
                    >
                      {removeCover ? (
                        <Undo2 aria-hidden="true" />
                      ) : (
                        <Trash2 aria-hidden="true" />
                      )}
                      {removeCover ? "撤销" : "删除"}
                    </Button>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/15" />
                <Input
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  className="sr-only"
                  id={`edit-cover-${track.id}`}
                  ref={coverInputRef}
                  type="file"
                  onChange={(event) => {
                    setCoverFile(event.currentTarget.files?.[0] ?? null);
                    setRemoveCover(false);
                    setErrorMessage("");
                    setSaveSucceeded(false);
                  }}
                />
              </div>
              {(coverFile || removeCover) && (
                <p className="truncate text-xs text-zinc-500">
                  {coverFile
                    ? `待替换：${coverFile.name}`
                    : "保存后将删除当前封面"}
                </p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <div>
                <h3 className="text-sm font-medium">歌曲文件</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  音频文件仅供查看，编辑时不会重新写入。
                </p>
              </div>
              <ul
                className="grid grid-rows-2 divide-y overflow-hidden rounded-xl border bg-zinc-50"
                style={mediaPanelStyle}
              >
                <AudioFileSummary audio={track.audio.high} label="高清版" />
                <AudioFileSummary audio={track.audio.low} label="低清版" />
              </ul>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2" aria-label="可编辑歌曲信息">
            <div className="grid gap-2">
              <Label htmlFor={`edit-title-${track.id}`}>标题 *</Label>
              <Input
                id={`edit-title-${track.id}`}
                value={draft.title}
                aria-invalid={!draft.title.trim()}
                onChange={(event) => updateDraft("title", event.currentTarget.value)}
              />
              {!draft.title.trim() && <p className="text-xs text-red-600">标题为必填字段</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-artist-${track.id}`}>作者</Label>
              <Input
                id={`edit-artist-${track.id}`}
                value={draft.artist}
                placeholder="未填写作者"
                onChange={(event) => updateDraft("artist", event.currentTarget.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-album-${track.id}`}>专辑</Label>
              <Input
                id={`edit-album-${track.id}`}
                value={draft.album}
                placeholder="未填写专辑"
                onChange={(event) => updateDraft("album", event.currentTarget.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-genres-${track.id}`}>风格</Label>
              <Input
                id={`edit-genres-${track.id}`}
                value={draft.genres}
                placeholder="多个值使用逗号分隔"
                onChange={(event) => updateDraft("genres", event.currentTarget.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-bpm-${track.id}`}>BPM</Label>
              <Input
                id={`edit-bpm-${track.id}`}
                inputMode="numeric"
                value={draft.bpm}
                aria-invalid={!bpmIsValid}
                placeholder="1–300"
                onChange={(event) => updateDraft("bpm", event.currentTarget.value)}
              />
              {!bpmIsValid && <p className="text-xs text-red-600">BPM 必须是 1–300</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-mood-${track.id}`}>情绪</Label>
              <Input
                id={`edit-mood-${track.id}`}
                value={draft.mood}
                placeholder="例如：平静、专注"
                onChange={(event) => updateDraft("mood", event.currentTarget.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-year-${track.id}`}>年份</Label>
              <Input
                id={`edit-year-${track.id}`}
                inputMode="numeric"
                value={draft.year}
                aria-invalid={!yearIsValid}
                placeholder="1900–2100"
                onChange={(event) => updateDraft("year", event.currentTarget.value)}
              />
              {!yearIsValid && <p className="text-xs text-red-600">年份必须是 1900–2100 的整数</p>}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={`edit-comment-${track.id}`}>备注</Label>
              <Textarea
                id={`edit-comment-${track.id}`}
                value={draft.comment}
                placeholder="补充制作、使用场景等内部备注"
                onChange={(event) => updateDraft("comment", event.currentTarget.value)}
              />
            </div>
          </section>

          {errorMessage && (
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 px-6 py-4">
          <p className="mr-auto self-center text-xs text-zinc-500" aria-live="polite">
            {saveSucceeded
              ? "歌曲信息已保存"
              : hasUnsavedChanges
                ? "有尚未保存的修改"
                : "当前没有未保存的修改"}
          </p>
          <DialogClose render={<Button variant="outline" disabled={isSaving} />}>
            关闭
          </DialogClose>
          <Button
            type="button"
            disabled={!draftIsValid || !hasUnsavedChanges || isSaving}
            onClick={handleSave}
          >
            <Save aria-hidden="true" />
            {isSaving ? "正在保存…" : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
