import { extname } from "node:path";
import { getAsset } from "../../../../lib/docs";

const contentTypes: Record<string, string> = {
  ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg",
  ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp",
};

type Context = { params: Promise<{ path: string[] }> };

export async function GET(_: Request, { params }: Context) {
  try {
    const segments = (await params).path;
    const relativePath = segments.join("/");
    const body = await getAsset(relativePath);
    return new Response(body, {
      headers: {
        "Content-Type": contentTypes[extname(relativePath).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
