import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMessengerMessage } from "@/lib/meta/graph";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, customerId, messageText } = body;

    if (!customerId || !messageText) {
      return NextResponse.json(
        { error: "customerId and messageText are required" },
        { status: 400 }
      );
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        pageConfig: true,
        conversations: {
          take: 1,
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (!customer.psid) {
      return NextResponse.json(
        {
          error:
            "អតិថិជននេះមិនទាន់មាន Messenger Session (PSID) នៅឡើយទេ (ប្រហែលមកពី Comment)។ សូមទាក់ទងតាមលេខទូរស័ព្ទ ឬរង់ចាំអតិថិជន Inbox មកកាន់ Page។",
        },
        { status: 400 }
      );
    }

    const token = customer.pageConfig?.pageAccessToken || process.env.FB_PAGE_ACCESS_TOKEN || "";
    if (!token) {
      return NextResponse.json(
        { error: "Page Access Token not found" },
        { status: 500 }
      );
    }

    // Send to Meta Messenger via Graph API
    await sendMessengerMessage(customer.psid, messageText, token);
    console.log(`[FollowUp] Sent approved message to ${customer.name} (PSID: ${customer.psid})`);

    // Log message into Conversation history
    let conversationId = customer.conversations[0]?.id;
    if (!conversationId) {
      const conv = await db.conversation.create({
        data: {
          pageConfigId: customer.pageConfigId,
          psid: customer.psid,
          customerId: customer.id,
          customerName: customer.name,
        },
      });
      conversationId = conv.id;
    }

    await db.message.create({
      data: {
        conversationId,
        sender: "AI",
        text: messageText,
      },
    });

    // Update FollowUpTask if taskId was provided
    if (taskId) {
      await db.followUpTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          actualSentText: messageText,
          sentAt: new Date(),
          sentBy: "Admin (Approved)",
        },
      });
    }

    // Update customer last contact
    await db.customer.update({
      where: { id: customer.id },
      data: {
        lastContactAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Follow-up message sent and recorded successfully!",
    });
  } catch (error: any) {
    console.error("[FollowUp Send] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
