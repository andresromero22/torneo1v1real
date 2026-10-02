const COOKIE_NAME = "admin_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getSessionToken(): Promise<string> {
  return sha256Hex(`torneo1v1real:${process.env.ADMIN_PASSWORD}`);
}

export async function isCorrectPassword(password: string): Promise<boolean> {
  return password === process.env.ADMIN_PASSWORD;
}

/** Throws if the current request doesn't carry a valid admin session cookie. */
export async function requireAdmin(): Promise<void> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const expected = await getSessionToken();

  if (!token || token !== expected) {
    throw new Error("No autorizado");
  }
}

export { COOKIE_NAME };
