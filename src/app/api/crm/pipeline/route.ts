import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALL_STAGES = [
  "NEW_LEAD",
  "INTERESTED",
  "HOT_LEAD",
  "FOLLOW_UP",
  "ORDERED",
  "LOST",
] as const;

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        conversations: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        followUps: {
          where: { status: "PENDING" },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
      },
    });

    const pipeline: Record<string, any[]> = {
      NEW_LEAD: [],
      INTERESTED: [],
      HOT_LEAD: [],
      FOLLOW_UP: [],
      ORDERED: [],
      LOST: [],
    };

    const counts: Record<string, number> = {
      NEW_LEAD: 0,
      INTERESTED: 0,
      HOT_LEAD: 0,
      FOLLOW_UP: 0,
      ORDERED: 0,
      LOST: 0,
    };

    for (const customer of customers) {
      const stage = customer.stage || "NEW_LEAD";
      if (pipeline[stage]) {
        pipeline[stage].push(customer);
        counts[stage]++;
      } else {
        pipeline.NEW_LEAD.push(customer);
        counts.NEW_LEAD++;
      }
    }

    return NextResponse.json({
      pipeline,
      counts,
      totalLeads: customers.length,
    });
  } catch (error: any) {
    console.error("[Pipeline] Error fetching pipeline:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, stage } = body;

    if (!customerId || !stage || !ALL_STAGES.includes(stage)) {
      return NextResponse.json(
        { error: "Valid customerId and stage are required" },
        { status: 400 }
      );
    }

    const updated = await db.customer.update({
      where: { id: customerId },
      data: {
        stage,
        updatedAt: new Date(),
      },
    });

    // Alert Telegram on ORDERED
    if (stage === "ORDERED") {
      import("@/lib/telegram").then(({ notifyOrderWonTelegram }) => {
        notifyOrderWonTelegram({
          name: updated.name,
          phone: updated.phone,
          product: updated.productInterest,
          notes: updated.notes,
        }).catch((err) => console.warn("[Telegram] Order alert error:", err));
      });
    }

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error("[Pipeline] Error moving lead stage:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
