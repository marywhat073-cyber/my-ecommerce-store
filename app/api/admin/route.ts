import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listAdminData } from "@/lib/admin-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  }
  try {
    return Response.json(await listAdminData(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to load admin dashboard data.", error);
    return Response.json({ error: "Admin data could not be loaded." }, { status: 500 });
  }
}
