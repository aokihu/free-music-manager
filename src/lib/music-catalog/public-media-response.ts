import "server-only";

import { getMusicStorage } from "../storage";
import {
  createPublicApiError,
  getPublishedTrack,
  publicApiCorsHeaders,
} from "./public-catalog-service";

type MediaKind = "cover" | "preview";

type ParsedRange = {
  end: number;
  start: number;
};

function parseByteRange(value: string, size: number): ParsedRange | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(size - suffixLength, 0),
      end: size - 1,
    };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    start >= size ||
    requestedEnd < start
  ) {
    return null;
  }

  return { start, end: Math.min(requestedEnd, size - 1) };
}

function toResponseBody(bytes: Uint8Array, headOnly: boolean) {
  if (headOnly) return null;
  return bytes.slice().buffer;
}

export async function createPublicMediaResponse(
  request: Request,
  trackId: string,
  kind: MediaKind,
  headOnly = false,
) {
  const track = await getPublishedTrack(trackId);
  if (!track) return createPublicApiError("未找到已发布歌曲", 404);

  if (kind === "cover" && !track.cover) {
    return createPublicApiError("歌曲尚未设置封面", 404);
  }

  const media = kind === "preview" ? track.audio.low : track.cover;
  if (!media) return createPublicApiError("歌曲媒体文件不存在", 404);
  const bytes = await getMusicStorage().getObject(media.key);
  if (!bytes) return createPublicApiError("歌曲媒体文件不存在", 404);

  const contentType = kind === "preview" ? "audio/ogg" : media.contentType;
  const etag =
    kind === "preview"
      ? `"${track.audio.low.sha256}"`
      : `"${track.id}-cover-${track.updatedAt}"`;
  const commonHeaders = {
    ...publicApiCorsHeaders,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=300, must-revalidate",
    "Content-Type": contentType,
    ETag: etag,
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: commonHeaders });
  }

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) {
    return new Response(toResponseBody(bytes, headOnly), {
      status: 200,
      headers: {
        ...commonHeaders,
        "Content-Length": bytes.byteLength.toString(),
      },
    });
  }

  const range = parseByteRange(rangeHeader, bytes.byteLength);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes */${bytes.byteLength}`,
      },
    });
  }

  const partialBytes = bytes.slice(range.start, range.end + 1);
  return new Response(toResponseBody(partialBytes, headOnly), {
    status: 206,
    headers: {
      ...commonHeaders,
      "Content-Length": partialBytes.byteLength.toString(),
      "Content-Range": `bytes ${range.start}-${range.end}/${bytes.byteLength}`,
    },
  });
}
