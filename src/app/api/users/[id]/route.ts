import { NextRequest, NextResponse } from "next/server";
import { verifyAuthRequest } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: មានតែ Admin ទើបអាចកែប្រែគណនីបុគ្គលិកបាន" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));

    const updateData: any = {};

    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }

    if (body.role === "ADMIN" || body.role === "STAFF") {
      updateData.role = body.role;
    }

    if (typeof body.fullName === "string" && body.fullName.trim().length >= 2) {
      updateData.fullName = body.fullName.trim();
    }

    if (typeof body.newPassword === "string" && body.newPassword.trim().length >= 4) {
      updateData.passwordHash = hashPassword(body.newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "បានកែប្រែព័ត៌មានជោគជ័យ",
    });
  } catch (error: any) {
    console.error("[Users API PATCH Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការកែប្រែគណនី" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: មានតែ Admin ទើបអាចលុបគណនីបុគ្គលិកបាន" },
        { status: 403 }
      );
    }

    const { id } = params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "បានលុបគណនីបុគ្គលិកជោគជ័យ",
    });
  } catch (error: any) {
    console.error("[Users API DELETE Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការលុបគណនី" },
      { status: 500 }
    );
  }
}
