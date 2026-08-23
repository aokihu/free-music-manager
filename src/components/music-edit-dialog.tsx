"use client";

import { AlertCircle, FileAudio, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import type { ManagerTrack } from "@/lib/music-catalog/types";

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

export function MusicEditDialog({
  track,
  mobile = false,
}: {
  track: ManagerTrack;
  mobile?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => createEditableDraft(track));
  const [savedDraft, setSavedDraft] = useState(() => createEditableDraft(track));
  const [errorMessage, setErrorMessage] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [isSaving, startSaving] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      const nextDraft = createEditableDraft(track);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
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
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(savedDraft);

  function handleSave() {
    if (!draftIsValid || !hasUnsavedChanges) return;

    const formData = new FormData();
    formData.set("trackId", track.id);
    formData.set("draft", JSON.stringify(draft));

    startSaving(async () => {
      const result = await updateMusicTrack(formData);
      if (result.ok) {
        setSavedDraft(draft);
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
            只更新曲库元数据，不会修改或重新写入音频文件。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-1">
          <section className="rounded-xl border bg-zinc-50 p-4" aria-label="音频文件信息">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-lime-300">
                <FileAudio className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{track.audio.fileName}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {track.audio.container ?? "未知格式"} · {formatDuration(track.audio.durationSeconds)} · {formatFileSize(track.audio.sizeBytes)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {track.audio.bitrateKbps ? `${track.audio.bitrateKbps} kbps` : "未知码率"} · {track.audio.sampleRateHz ? `${track.audio.sampleRateHz / 1000} kHz` : "未知采样率"} · {track.audio.numberOfChannels ? `${track.audio.numberOfChannels} 声道` : "未知声道"}
                </p>
              </div>
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
