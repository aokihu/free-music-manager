import {
  createPublicApiError,
  listPublicAlbums,
  publicApiCorsHeaders,
} from "@/lib/music-catalog/public-catalog-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    return Response.json(await listPublicAlbums(origin), {
      headers: { ...publicApiCorsHeaders, "Cache-Control": "no-store" },
    });
  } catch {
    return createPublicApiError("专辑暂时无法读取", 500);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: publicApiCorsHeaders });
}
