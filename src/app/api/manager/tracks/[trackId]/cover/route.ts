import { getMusicStorage } from "@/lib/storage";
import { listStoredTracks } from "@/lib/music-catalog/catalog-repository";

type RouteContext = {
  params: Promise<{ trackId: string }>;
};

async function createManagerCoverResponse(
  request: Request,
  context: RouteContext,
  headOnly = false,
) {
  const { trackId } = await context.params;
  const track = (await listStoredTracks()).find((item) => item.id === trackId);
  if (!track) return new Response("未找到歌曲", { status: 404 });

  if (!track.cover) {
    return Response.redirect(new URL("/cover-placeholder.png", request.url));
  }

  const bytes = await getMusicStorage().getObject(track.cover.key);
  if (!bytes) {
    return Response.redirect(new URL("/cover-placeholder.png", request.url));
  }

  return new Response(headOnly ? null : bytes.slice().buffer, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Length": bytes.byteLength.toString(),
      "Content-Type": track.cover.contentType,
    },
  });
}

export function GET(request: Request, context: RouteContext) {
  return createManagerCoverResponse(request, context);
}

export function HEAD(request: Request, context: RouteContext) {
  return createManagerCoverResponse(request, context, true);
}
