import { NextRequest, NextResponse } from "next/server";
import { verifyAuthRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (process.env.FB_PAGE_ACCESS_TOKEN || "").trim().replace(/^["']|["']$/g, "");
    const pageId = (process.env.FB_PAGE_ID || "").trim().replace(/^["']|["']$/g, "");

    if (!token || !pageId) {
      return NextResponse.json(
        { error: "FB_PAGE_ACCESS_TOKEN ឬ FB_PAGE_ID មិនទាន់ត្រូវបានកំណត់ឡើយ" },
        { status: 500 }
      );
    }

    // Fetch published posts and scheduled posts in parallel
    const [publishedRes, scheduledRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v21.0/${pageId}/published_posts?fields=id,message,created_time,permalink_url,full_picture&limit=10&access_token=${token}`
      ).catch(() => null),
      fetch(
        `https://graph.facebook.com/v21.0/${pageId}/scheduled_posts?fields=id,message,created_time,scheduled_publish_time,full_picture&limit=10&access_token=${token}`
      ).catch(() => null),
    ]);

    const publishedData = publishedRes ? await publishedRes.json().catch(() => ({})) : {};
    const scheduledData = scheduledRes ? await scheduledRes.json().catch(() => ({})) : {};

    const published = Array.isArray(publishedData?.data) ? publishedData.data : [];
    const scheduled = Array.isArray(scheduledData?.data) ? scheduledData.data : [];

    return NextResponse.json({
      success: true,
      pageId,
      published,
      scheduled,
    });
  } catch (error: any) {
    console.error("[Fetch Posts Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការទាញយកទិន្នន័យផុស" },
      { status: 500 }
    );
  }
}
