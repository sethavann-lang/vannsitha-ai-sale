import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filterStatus = searchParams.get("status");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = {};
    if (filterStatus && filterStatus !== "ALL") {
      if (filterStatus === "OVERDUE") {
        where.status = "PENDING";
        where.scheduledAt = { lt: now };
      } else if (filterStatus === "TODAY") {
        where.status = "PENDING";
        where.scheduledAt = { gte: startOfToday, lte: endOfToday };
      } else {
        where.status = filterStatus;
      }
    }

    const tasks = await db.followUpTask.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            psid: true,
            productInterest: true,
            stage: true,
            assignedSeller: true,
            source: true,
          },
        },
      },
    });

    // Compute metrics
    const overdueCount = await db.followUpTask.count({
      where: {
        status: "PENDING",
        scheduledAt: { lt: now },
      },
    });

    const todayCount = await db.followUpTask.count({
      where: {
        status: "PENDING",
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    const pendingCount = await db.followUpTask.count({
      where: { status: "PENDING" },
    });

    const completedCount = await db.followUpTask.count({
      where: { status: "COMPLETED" },
    });

    return NextResponse.json({
      tasks,
      metrics: {
        overdueCount,
        todayCount,
        pendingCount,
        completedCount,
      },
    });
  } catch (error: any) {
    console.error("[FollowUp] Error fetching tasks:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, scheduledAt, reason, customReason, aiSuggestedText } = body;

    if (!customerId || !scheduledAt || !reason) {
      return NextResponse.json(
        { error: "customerId, scheduledAt, and reason are required" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);

    const task = await db.followUpTask.create({
      data: {
        customerId,
        scheduledAt: scheduledDate,
        reason,
        customReason: customReason || null,
        status: "PENDING",
        aiSuggestedText: aiSuggestedText || null,
      },
      include: {
        customer: true,
      },
    });

    // Update customer nextFollowUpAt & advance stage to FOLLOW_UP if currently NEW_LEAD or INTERESTED
    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (customer) {
      const updateData: any = { nextFollowUpAt: scheduledDate };
      if (customer.stage === "NEW_LEAD" || customer.stage === "INTERESTED") {
        updateData.stage = "FOLLOW_UP";
      }
      await db.customer.update({
        where: { id: customerId },
        data: updateData,
      });
    }

    // Telegram notification for Follow-up scheduled
    import("@/lib/telegram").then(({ notifyFollowUpDueTelegram }) => {
      notifyFollowUpDueTelegram({
        customerName: task.customer.name,
        phone: task.customer.phone,
        reason: task.reason,
        aiSuggestedText: task.aiSuggestedText,
      }).catch((err) => console.warn("[Telegram] Follow-up alert error:", err));
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("[FollowUp] Error creating task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, outcomeNotes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Task id and status are required" },
        { status: 400 }
      );
    }

    const task = await db.followUpTask.update({
      where: { id },
      data: {
        status,
        outcomeNotes: outcomeNotes || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("[FollowUp] Error updating task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
