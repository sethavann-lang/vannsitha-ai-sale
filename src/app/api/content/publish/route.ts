import { NextRequest, NextResponse } from "next/server";
import { verifyAuthRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (process.env.FB_PAGE_ACCESS_TOKEN || "").trim().replace(/^["']|["']$/g, "");
    const pageId = (process.env.FB_PAGE_ID || "").trim().replace(/^["']|["']$/g, "");

    if (!token || !pageId) {
      return NextResponse.json(
        { error: "FB_PAGE_ACCESS_TOKEN ឬ FB_PAGE_ID មិនទាន់ត្រូវបានកំណត់ក្នុងប្រព័ន្ធឡើយ" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = (body.message || "").trim();
    const imageUrl = (body.imageUrl || "").trim();
    const scheduledTime = body.scheduledTime; // ISO string or timestamp

    if (!message && !imageUrl) {
      return NextResponse.json(
        { error: "សូមបញ្ចូលអត្ថបទ Caption ឬរូបភាពដើម្បីផុស" },
        { status: 400 }
      );
    }

    let isScheduled = false;
    let scheduledUnix: number | null = null;

    if (scheduledTime) {
      const targetDate = new Date(scheduledTime);
      const now = new Date();
      const diffSeconds = Math.floor((targetDate.getTime() - now.getTime()) / 1000);

      // Facebook requires scheduled posts to be at least 10 minutes (600s) and max 75 days in the future
      if (diffSeconds < 600) {
        return NextResponse.json(
          { error: "កាលវិភាគផុសត្រូវកំណត់យ៉ាងតិច ១០ នាទីទៅអនាគត" },
          { status: 400 }
        );
      }
      if (diffSeconds > 75 * 24 * 3600) {
        return NextResponse.json(
          { error: "កាលវិភាគផុសមិនអាចលើសពី ៧៥ ថ្ងៃឡើយ" },
          { status: 400 }
        );
      }

      isScheduled = true;
      scheduledUnix = Math.floor(targetDate.getTime() / 1000);
    }

    let fbEndpoint = "";
    const payload: Record<string, any> = {
      access_token: token,
    };

    if (imageUrl) {
      // Photo Post
      fbEndpoint = `https://graph.facebook.com/v21.0/${pageId}/photos`;
      payload.url = imageUrl;
      if (message) payload.caption = message;

      if (isScheduled && scheduledUnix) {
        payload.published = false;
        payload.scheduled_publish_time = scheduledUnix;
      }
    } else {
      // Text Post / Feed
      fbEndpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;
      payload.message = message;

      if (isScheduled && scheduledUnix) {
        payload.published = false;
        payload.scheduled_publish_time = scheduledUnix;
      }
    }

    const fbRes = await fetch(fbEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const fbData = await fbRes.json();

    if (!fbRes.ok || fbData.error) {
      console.error("[Facebook Publish Error]", fbData.error);
      return NextResponse.json(
        {
          error:
            fbData.error?.message ||
            "មានបញ្ហាក្នុងការបញ្ជូនទៅកាន់ Facebook Page សូមពិនិត្យម្តងទៀត",
          details: fbData.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      isScheduled,
      postId: fbData.id || fbData.post_id,
      message: isScheduled
        ? "🎉 បានកំណត់កាលវិភាគផុសស្វ័យប្រវត្តិដោយជោគជ័យ!"
        : "🎉 បានផុសចូល Facebook Page ដោយជោគជ័យ!",
    });
  } catch (error: any) {
    console.error("[Content Publish Route Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាបច្ចេកទេសក្នុងការផុស" },
      { status: 500 }
    );
  }
}
