import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminReceipt } from "@/lib/admin-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  }
  const { id } = await params;
  const dataUrl = await getAdminReceipt(id);
  if (!dataUrl) return Response.json({ error: "Receipt not found." }, { status: 404 });
  const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return Response.json({ error: "Receipt data is invalid." }, { status: 500 });
  const bytes = Buffer.from(match[2], "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": match[1],
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "attachment; filename=\"wallet-receipt\"",
    },
  });
}
