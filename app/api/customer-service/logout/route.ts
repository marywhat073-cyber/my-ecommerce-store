import { clearCustomerServiceSession } from "@/lib/customer-service-auth";
import { isSameOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  try {
    await clearCustomerServiceSession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to clear customer-service session.", error);
    return Response.json({ error: "Unable to sign out." }, { status: 500 });
  }
}
