import { clearAdminSession } from "@/lib/admin-auth";

export async function POST() {
  await clearAdminSession();
  return Response.json({ ok: true });
}
