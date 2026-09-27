import { NextRequest, NextResponse } from "next/server";
import { verifyAuthRequest } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: មានតែ Admin ទើបអាចមើលបញ្ជីបុគ្គលិកបាន" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("[Users API GET Error]", error);
    return NextResponse.json(
      { error: "មានបញ្ហាក្នុងការទាញយកបញ្ជីបុគ្គលិក" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: មានតែ Admin ទើបអាចបង្កើតគណនីបុគ្គលិកបាន" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const fullName = (body.fullName || "").trim();
    const username = (body.username || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    const role = body.role === "ADMIN" ? "ADMIN" : "STAFF";

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: "សូមបញ្ចូលឈ្មោះពេញរបស់បុគ្គលិក (យ៉ាងតិច ២ តួអក្សរ)" },
        { status: 400 }
      );
    }

    if (!username || username.length < 3 || !/^[a-z0-9_.]+$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username ត្រូវមានយ៉ាងតិច ៣ តួអក្សរ និងប្រើបានតែអក្សរតូច លេខ និងសញ្ញា _ ឬ . ប៉ុណ្ណោះ",
        },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: "ពាក្យសម្ងាត់ (Password) ត្រូវមានយ៉ាងតិច ៤ តួអក្សរ" },
        { status: 400 }
      );
    }

    const adminUsername = (process.env.ADMIN_USERNAME || "admin").toLowerCase().trim();
    if (username === adminUsername) {
      return NextResponse.json(
        { error: "Username នេះត្រូវបានប្រើប្រាស់ដោយ Master Admin រួចហើយ" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Username "${username}" នេះមានក្នុងប្រព័ន្ធរួចហើយ សូមជ្រើសរើសឈ្មោះផ្សេង` },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        username,
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `បានបង្កើតគណនី ${fullName} ដោយជោគជ័យ`,
    });
  } catch (error: any) {
    console.error("[Users API POST Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការបង្កើតគណនីបុគ្គលិក" },
      { status: 500 }
    );
  }
}
