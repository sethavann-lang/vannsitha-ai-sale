import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");

    const where: any = {};
    if (stage && stage !== "ALL") {
      where.stage = stage;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { productInterest: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await db.customer.findMany({
      where,
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
          orderBy: { scheduledAt: "desc" },
          take: 3,
        },
      },
    });

    const total = await db.customer.count({ where });

    return NextResponse.json({ customers, total });
  } catch (error: any) {
    console.error("[CRM] Error fetching customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, productInterest, stage, assignedSeller, notes, source } = body;

    const pageConfig = await db.pageConfig.findFirst();
    if (!pageConfig) {
      return NextResponse.json({ error: "PageConfig not found" }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        pageConfigId: pageConfig.id,
        name: name || "New Customer",
        phone: phone || null,
        productInterest: productInterest || null,
        stage: stage || "NEW_LEAD",
        assignedSeller: assignedSeller || null,
        notes: notes || null,
        source: source || "MESSENGER",
        lastContactAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error("[CRM] Error creating customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, productInterest, stage, assignedSeller, notes, nextFollowUpAt } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (productInterest !== undefined) updateData.productInterest = productInterest;
    if (stage !== undefined) updateData.stage = stage;
    if (assignedSeller !== undefined) updateData.assignedSeller = assignedSeller;
    if (notes !== undefined) updateData.notes = notes;
    if (nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
    }

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error("[CRM] Error updating customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[CRM] Error deleting customer:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
