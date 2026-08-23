import type { TrackPublicationStatus } from "./types";

export const trackStatusLabels: Record<TrackPublicationStatus, string> = {
  draft: "草稿",
  published: "已发布",
  offline: "已下架",
};

export const allowedTrackStatusTransitions: Record<
  TrackPublicationStatus,
  TrackPublicationStatus[]
> = {
  draft: ["published"],
  published: ["offline"],
  offline: ["draft", "published"],
};

export function isTrackPublicationStatus(
  value: unknown,
): value is TrackPublicationStatus {
  return value === "draft" || value === "published" || value === "offline";
}

export function canChangeTrackStatus(
  currentStatus: TrackPublicationStatus,
  nextStatus: TrackPublicationStatus,
) {
  return allowedTrackStatusTransitions[currentStatus].includes(nextStatus);
}
