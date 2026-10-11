import { isSameOrigin } from "@/lib/request-origin";
import { createStoreOrder, getCurrentStoreId, listStoreOrders, StorePlatformError } from "@/lib/store-platform";

export async function GET() {
  const storeId = await getCurrentStoreId();
  if (!storeId) return Response.json({ error: "Store sign-in required." }, { status: 401 });
  try {
    return Response.json({ orders: await listStoreOrders(storeId) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load store orders.", error);
    return Response.json({ error: "Unable to load store orders." }, { status: 500 });
  }
}

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
  if (
    typeof body !== "object" || body === null ||
    !("items" in body) || !Array.isArray(body.items) ||
    !body.items.every((item) => typeof item === "object" && item !== null &&
      "productId" in item && typeof item.productId === "string" &&
      "quantity" in item && typeof item.quantity === "number") ||
    !("address" in body) || typeof body.address !== "string" ||
    !("paymentMethod" in body) || (body.paymentMethod !== "K Pay" && body.paymentMethod !== "Wave Pay") ||
    !("promoCode" in body) || typeof body.promoCode !== "string"
  ) return Response.json({ error: "Enter a valid order and delivery address." }, { status: 400 });
  try {
    return Response.json({
      order: await createStoreOrder({
        buyerStoreId: storeId,
        items: body.items,
        address: body.address,
        paymentMethod: body.paymentMethod,
        promoCode: body.promoCode,
      }),
    }, { status: 201 });
  } catch (error) {
    if (error instanceof StorePlatformError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Unable to create store order.", error);
    return Response.json({ error: "Unable to place this order." }, { status: 500 });
  }
}
