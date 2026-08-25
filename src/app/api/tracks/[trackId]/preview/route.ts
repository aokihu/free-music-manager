import { publicApiCorsHeaders } from "@/lib/music-catalog/public-catalog-service";
import { createPublicMediaResponse } from "@/lib/music-catalog/public-media-response";

type RouteContext = {
  params: Promise<{ trackId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { trackId } = await context.params;
  return createPublicMediaResponse(request, trackId, "preview");
}

export async function HEAD(request: Request, context: RouteContext) {
  const { trackId } = await context.params;
  return createPublicMediaResponse(request, trackId, "preview", true);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: publicApiCorsHeaders });
}
