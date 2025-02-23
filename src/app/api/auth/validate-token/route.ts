import { NextRequest, NextResponse } from "next/server";
import { tempTokens } from "../../tokenStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token || !tempTokens.has(token)) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  // ✅ Check token expiration
  const expirationTime = tempTokens.get(token)!;
  if (Date.now() > expirationTime) {
    tempTokens.delete(token);
    return NextResponse.json({ error: "Token expired" }, { status: 403 });
  }

  // ✅ Remove token after use (one-time login)
  tempTokens.delete(token);

  return NextResponse.json({ success: "Token valid. Proceed to login." }, { status: 200 });
}
