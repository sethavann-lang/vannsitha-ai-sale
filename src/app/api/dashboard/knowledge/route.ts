import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { pageConfigId, title, category, content, imageUrl, audioUrl } = await req.json();

    if (!pageConfigId || !title || !content) {
      return NextResponse.json(
        { error: "pageConfigId, title, and content are required" },
        { status: 400 }
      );
    }

    const item = await db.knowledgeItem.create({
      data: {
        pageConfigId,
        title,
        category: category || "General",
        content,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        audioUrl: audioUrl ? String(audioUrl).trim() : null,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.knowledgeItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
