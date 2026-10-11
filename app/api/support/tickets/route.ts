import { isSameOrigin } from "@/lib/request-origin";
import { createSupportTicket, getCurrentStoreId, StorePlatformError } from "@/lib/store-platform";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  const storeId = await getCurrentStoreId();
  if (!storeId) return Response.json({ error: "Store sign-in required." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("message" in body) || typeof body.message !== "string") {
    return Response.json({ error: "Enter a support message." }, { status: 400 });
  }
  try {
    return Response.json({ ticket: await createSupportTicket(storeId, body.message) }, { status: 201 });
  } catch (error) {
    if (error instanceof StorePlatformError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Unable to create support ticket.", error);
    return Response.json({ error: "Unable to submit support request." }, { status: 500 });
  }
}
