export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";

  try {
    const suppliedOrigin = new URL(origin);
    if (
      (suppliedOrigin.protocol !== "http:" && suppliedOrigin.protocol !== "https:") ||
      suppliedOrigin.username ||
      suppliedOrigin.password ||
      suppliedOrigin.origin !== origin
    ) {
      return false;
    }
    const expectedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      request.headers.get("host") ||
      new URL(request.url).host;
    const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const expectedProtocol = forwardedProtocol
      ? `${forwardedProtocol.replace(/:$/, "")}:`
      : new URL(request.url).protocol;

    return suppliedOrigin.origin === new URL(`${expectedProtocol}//${expectedHost}`).origin;
  } catch {
    return false;
  }
}
