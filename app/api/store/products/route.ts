import { isSameOrigin } from "@/lib/request-origin";
import { addStoreProduct, getCurrentStoreId, listStoreProducts, StorePlatformError } from "@/lib/store-platform";

export async function GET() {
  if (!(await getCurrentStoreId())) return Response.json({ error: "Store registration required." }, { status: 401 });
  try {
    return Response.json({ products: await listStoreProducts() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load store-listed products.", error);
    return Response.json({ error: "Unable to load store-listed products." }, { status: 500 });
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
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Enter valid product details." }, { status: 400 });
  }
  const name = "name" in body ? body.name : undefined;
  const category = "category" in body ? body.category : undefined;
  const description = "description" in body ? body.description : undefined;
  const costPriceMMK = "costPriceMMK" in body ? body.costPriceMMK : undefined;
  const imageUrl = "imageUrl" in body ? body.imageUrl : undefined;
  if (
    typeof name !== "string" || typeof category !== "string" ||
    typeof description !== "string" || typeof costPriceMMK !== "number" ||
    typeof imageUrl !== "string"
  ) return Response.json({ error: "Enter valid product details." }, { status: 400 });
  try {
    const product = await addStoreProduct(storeId, { name, category, description, costPriceMMK, imageUrl });
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof StorePlatformError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Unable to list store product.", error);
    return Response.json({ error: "Unable to list this product." }, { status: 500 });
  }
}
