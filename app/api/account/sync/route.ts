import { syncRegisteredUsers } from "@/lib/admin-store";
import { isSameOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("users" in body) || !Array.isArray(body.users) || body.users.length > 1000) {
    return Response.json({ error: "Invalid account details." }, { status: 400 });
  }
  try {
    const users: { userId: string; name: string; phone: string }[] = [];
    for (const item of body.users) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("userId" in item) ||
        typeof item.userId !== "string" ||
        !/^USER-\d{6}$/.test(item.userId) ||
        !("name" in item) ||
        typeof item.name !== "string" ||
        !("phone" in item) ||
        typeof item.phone !== "string"
      ) {
        return Response.json({ error: "Invalid account details." }, { status: 400 });
      }
      users.push({
        userId: item.userId,
        name: item.name.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ").trim().slice(0, 120),
        phone: item.phone.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim().slice(0, 24),
      });
    }
    await syncRegisteredUsers(users);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to synchronize a local account to the admin dashboard.", error);
    return Response.json({ error: "Account sync failed." }, { status: 500 });
  }
}
