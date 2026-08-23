"use client";

import { AlertCircle, Archive, RotateCcw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateMusicStatus } from "@/app/actions/update-music-status";
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
import {
  allowedTrackStatusTransitions,
  trackStatusLabels,
} from "@/lib/music-catalog/publication-status";
import type {
  ManagerTrack,
  TrackPublicationStatus,
} from "@/lib/music-catalog/types";

const triggerLabels: Record<TrackPublicationStatus, string> = {
  draft: "发布",
  published: "下架",
  offline: "状态",
};

const transitionContent: Record<
  TrackPublicationStatus,
  { label: string; description: string }
> = {
  draft: {
    label: "恢复为草稿",
    description: "歌曲回到待编辑状态，之后可以再次发布。",
  },
  published: {
    label: "确认发布",
    description: "歌曲会标记为已发布，为后续前台发布包提供依据。",
  },
  offline: {
    label: "确认下架",
    description: "歌曲会停止展示，但本地音频和曲库记录都会保留。",
  },
};

function StatusActionIcon({ status }: { status: TrackPublicationStatus }) {
  if (status === "offline") return <Archive aria-hidden="true" />;
  if (status === "draft") return <RotateCcw aria-hidden="true" />;
  return <Send aria-hidden="true" />;
}

export function MusicStatusDialog({
  track,
  mobile = false,
}: {
  track: ManagerTrack;
  mobile?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUpdating, startUpdating] = useTransition();
  const nextStatuses = allowedTrackStatusTransitions[track.status];

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setErrorMessage("");
  }

  function handleStatusChange(nextStatus: TrackPublicationStatus) {
    const formData = new FormData();
    formData.set("trackId", track.id);
    formData.set("nextStatus", nextStatus);
    setErrorMessage("");

    startUpdating(async () => {
      const result = await updateMusicStatus(formData);
      if (result.ok) {
        setOpen(false);
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
            variant={track.status === "published" ? "outline" : "default"}
          />
        }
      >
        {triggerLabels[track.status]}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更新歌曲状态</DialogTitle>
          <DialogDescription>
            《{track.title}》当前状态为“{trackStatusLabels[track.status]}”。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          {nextStatuses.map((nextStatus) => (
            <button
              key={nextStatus}
              type="button"
              className="flex min-h-16 w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isUpdating}
              onClick={() => handleStatusChange(nextStatus)}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-lime-300 [&_svg]:size-4">
                <StatusActionIcon status={nextStatus} />
              </span>
              <span>
                <strong className="block text-sm font-medium">
                  {transitionContent[nextStatus].label}
                </strong>
                <span className="mt-1 block text-xs leading-5 text-zinc-500">
                  {transitionContent[nextStatus].description}
                </span>
              </span>
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{errorMessage}</p>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isUpdating} />}>
            取消
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
