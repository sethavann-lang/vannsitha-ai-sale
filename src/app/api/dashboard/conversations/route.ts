import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, isAiPaused } = await req.json();

    if (!id || typeof isAiPaused !== "boolean") {
      return NextResponse.json({ error: "id and isAiPaused boolean are required" }, { status: 400 });
    }

    const updated = await db.conversation.update({
      where: { id },
      data: { isAiPaused },
    });

    return NextResponse.json({ success: true, conversation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
