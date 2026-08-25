"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteMusicTrackAction } from "@/app/actions/delete-music-track";
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
import type { ManagerTrack } from "@/lib/music-catalog/types";

export function MusicDeleteDialog({
  track,
  mobile = false,
}: {
  track: ManagerTrack;
  mobile?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, startDeleting] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setErrorMessage("");
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("trackId", track.id);
    setErrorMessage("");

    startDeleting(async () => {
      const result = await deleteMusicTrackAction(formData);
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
            className={mobile ? "w-full" : "text-red-600 hover:text-red-700"}
            size={mobile ? "sm" : "icon-sm"}
            variant="ghost"
            aria-label={mobile ? undefined : `删除《${track.title}》`}
            title={mobile ? undefined : "删除歌曲"}
          />
        }
      >
        <Trash2 aria-hidden="true" />
        {mobile && "删除"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>删除歌曲</DialogTitle>
          <DialogDescription>
            确认永久删除《{track.title}》吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>高清音频、低清 OGG、封面和曲库记录都会被删除。</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
            取消
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 aria-hidden="true" />
            {isDeleting ? "正在删除…" : "永久删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
