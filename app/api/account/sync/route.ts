import { syncRegisteredUser } from "@/lib/admin-store";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !/^USER-\d{6}$/.test(body.userId) ||
    !("name" in body) ||
    typeof body.name !== "string" ||
    !("phone" in body) ||
    typeof body.phone !== "string"
  ) {
    return Response.json({ error: "Invalid account details." }, { status: 400 });
  }
  try {
    await syncRegisteredUser({
      userId: body.userId,
      name: body.name.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").trim().slice(0, 120),
      phone: body.phone.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().slice(0, 24),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to synchronize a local account to the admin dashboard.", error);
    return Response.json({ error: "Account sync failed." }, { status: 500 });
  }
}
