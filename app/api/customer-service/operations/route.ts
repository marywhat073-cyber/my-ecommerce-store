import { isCustomerServiceAuthenticated } from "@/lib/customer-service-auth";
import { isSameOrigin } from "@/lib/request-origin";
import { getServiceDashboard, serviceAction, StorePlatformError } from "@/lib/store-platform";

function actionFailure(error: unknown, operation: string) {
  if (error instanceof StorePlatformError) return Response.json({ error: error.message }, { status: 400 });
  console.error(`Unable to ${operation}.`, error);
  return Response.json({ error: `Unable to ${operation}.` }, { status: 500 });
}

export async function GET() {
  if (!(await isCustomerServiceAuthenticated())) {
    return Response.json({ error: "Customer-service sign-in required." }, { status: 401 });
  }
  try {
    return Response.json(await getServiceDashboard(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load customer-service data.", error);
    return Response.json({ error: "Customer-service data could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  if (!(await isCustomerServiceAuthenticated())) {
    return Response.json({ error: "Customer-service sign-in required." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("action" in body) || typeof body.action !== "string") {
    return Response.json({ error: "Choose a customer-service action." }, { status: 400 });
  }
  if (
    (body.action === "deposit" || body.action === "withdraw") &&
    "storeId" in body && typeof body.storeId === "string" &&
    "amountMMK" in body && typeof body.amountMMK === "number" &&
    (!("note" in body) || typeof body.note === "string")
  ) {
    try {
      return Response.json(await serviceAction({
        action: body.action,
        storeId: body.storeId,
        amountMMK: body.amountMMK,
        note: "note" in body && typeof body.note === "string" ? body.note : "",
      }));
    } catch (error) {
      return actionFailure(error, "update wallet");
    }
  }
  if (body.action === "deliver" && "orderId" in body && typeof body.orderId === "string") {
    try {
      return Response.json(await serviceAction({ action: "deliver", orderId: body.orderId }));
    } catch (error) {
      return actionFailure(error, "update delivery status");
    }
  }
  if (body.action === "resolve" && "ticketId" in body && typeof body.ticketId === "string" && "note" in body && typeof body.note === "string") {
    try {
      return Response.json(await serviceAction({ action: "resolve", ticketId: body.ticketId, note: body.note }));
    } catch (error) {
      return actionFailure(error, "resolve support request");
    }
  }
  return Response.json({ error: "Enter valid customer-service action details." }, { status: 400 });
}
