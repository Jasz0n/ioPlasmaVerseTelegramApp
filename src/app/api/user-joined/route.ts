import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, username, groupId, isAdmin, isFounder } = await req.json();

    console.log("👤 User Entered the App:", { userId, username, groupId, isAdmin, isFounder });

    // Here, you can store this information in a database if needed

    return NextResponse.json({ success: true, message: "User entry recorded." });
  } catch (error) {
    console.error("❌ Error Logging User Entry:", error);
    return NextResponse.json({ error: "Failed to log user entry" }, { status: 500 });
  }
}
