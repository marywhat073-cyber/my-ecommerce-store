import { isAdminAuthenticated } from "@/lib/admin-auth";
import { reviewAdminTransaction } from "@/lib/admin-store";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid origin." }, { status: 403 });
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("decision" in body) ||
    (body.decision !== "Approved" && body.decision !== "Rejected") ||
    !("reviewNote" in body) ||
    typeof body.reviewNote !== "string"
  ) {
    return Response.json({ error: "Choose an approval decision." }, { status: 400 });
  }
  const { id } = await params;
  const result = await reviewAdminTransaction(id, body.decision, body.reviewNote.slice(0, 300));
  if (result.kind !== "ok") {
    const status = result.kind === "not-found" ? 404 : result.kind === "insufficient-balance" ? 409 : 409;
    const error = result.kind === "not-found"
      ? "Transaction not found."
      : result.kind === "insufficient-balance"
        ? "The user wallet has insufficient balance for this withdrawal."
        : result.kind === "user-not-found"
          ? "Transaction user not found."
          : "This transaction has already been reviewed.";
    return Response.json({ error }, { status });
  }
  return Response.json({ ok: true, walletBalance: result.walletBalance });
}
