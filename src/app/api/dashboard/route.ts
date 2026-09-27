import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const pageId = process.env.FB_PAGE_ID || "";
    const pageConfig = await db.pageConfig.findFirst({
      where: pageId ? { pageId } : undefined,
      include: {
        knowledgeItems: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const totalConversations = await db.conversation.count();
    const totalMessages = await db.message.count();
    const totalKnowledge = pageConfig?.knowledgeItems.length || 0;

    // Detect Host & Protocol dynamically for permanent/production Webhook URL
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");

    const customDomain = "vannsitha.com";
    const customDomainWebhookUrl = `https://${customDomain}/api/webhook`;
    const vercelWebhookUrl = "https://vannsitha-ai-sale.vercel.app/api/webhook";

    // Primary webhook URL:
    // If NEXT_PUBLIC_APP_URL or APP_URL is specified, use it.
    // If accessed through custom domain or Vercel, reflect that URL dynamically.
    // Otherwise fallback to custom domain production URL.
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    if (!baseUrl && host) {
      baseUrl = `${proto}://${host}`;
    }
    if (!baseUrl) {
      baseUrl = `https://${customDomain}`;
    }
    const currentWebhookUrl = `${baseUrl.replace(/\/$/, "")}/api/webhook`;

    // Fetch recent conversations with their messages for Overview table
    const recentConversations = await db.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 2,
        },
      },
    });

    const formattedRecent = recentConversations.map((c) => {
      const userMsg = c.messages.find((m) => m.sender === "USER") || c.messages[0];
      const aiMsg = c.messages.find((m) => m.sender === "AI");
      return {
        id: c.id,
        psid: c.psid,
        customerName: c.customerName || `Customer #${c.psid.slice(-6)}`,
        source: "Messenger",
        lastUserMessage: userMsg?.text || "គ្មានសារ",
        lastAiReply: aiMsg?.text || "រង់ចាំការឆ្លើយតប",
        updatedAt: c.updatedAt,
        isAiPaused: c.isAiPaused,
      };
    });

    return NextResponse.json({
      pageConfig,
      stats: {
        totalConversations,
        totalMessages,
        totalKnowledge,
        aiProvider: process.env.AI_PROVIDER || "gemini",
        aiModel: "gemini-3.5-flash-lite",
        tunnelUrl: currentWebhookUrl.replace(/\/api\/webhook$/, ""),
      },
      health: {
        facebook: {
          connected: Boolean(pageConfig?.pageId),
          name: pageConfig?.pageName || "Kidney Pro",
          id: pageConfig?.pageId || "955747057621489",
        },
        webhook: {
          active: true,
          url: currentWebhookUrl,
          customDomainUrl: customDomainWebhookUrl,
          vercelUrl: vercelWebhookUrl,
        },
        ai: {
          online: true,
          provider: "Google Gemini",
          model: "gemini-3.5-flash-lite",
          latency: "< 1s",
        },
        database: {
          connected: true,
          type: "Supabase PostgreSQL",
        },
        token: {
          type: "Permanent Page Token",
          status: "Never Expires",
          valid: true,
        },
      },
      recentConversations: formattedRecent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      systemPrompt,
      autoReplyComment,
      privateReplyComment,
      autoReplyInbox,
      welcomeAudioUrl,
      welcomeAudioEnabled,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "PageConfig id is required" }, { status: 400 });
    }

    const updated = await db.pageConfig.update({
      where: { id },
      data: {
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
        ...(autoReplyComment !== undefined ? { autoReplyComment: Boolean(autoReplyComment) } : {}),
        ...(privateReplyComment !== undefined ? { privateReplyComment: Boolean(privateReplyComment) } : {}),
        ...(autoReplyInbox !== undefined ? { autoReplyInbox: Boolean(autoReplyInbox) } : {}),
        ...(welcomeAudioUrl !== undefined ? { welcomeAudioUrl: welcomeAudioUrl ? String(welcomeAudioUrl).trim() : null } : {}),
        ...(welcomeAudioEnabled !== undefined ? { welcomeAudioEnabled: Boolean(welcomeAudioEnabled) } : {}),
      },
    });

    return NextResponse.json({ success: true, pageConfig: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
