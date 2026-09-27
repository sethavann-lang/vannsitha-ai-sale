import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME, TOKEN_TTL_SECONDS } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/db";

/**
 * Constant-time string comparison using fixed-length SHA-256 digests
 * to eliminate timing leaks without external dependencies.
 */
function timingSafeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function POST(req: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim();

    if (!authSecret) {
      console.error(
        "[Auth] Configuration error: AUTH_SECRET is missing from environment variables."
      );
      return NextResponse.json(
        {
          error:
            "ការកំណត់សុវត្ថិភាពមិនទាន់រួចរាល់ (AUTH_SECRET មិនទាន់បានកំណត់ក្នុង Environment Variables ឡើយ)",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const username = (body.username || "").trim();
    const password = (body.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់" },
        { status: 400 }
      );
    }

    let authenticatedUser: {
      username: string;
      fullName: string;
      role: "ADMIN" | "STAFF";
      userId?: string;
    } | null = null;

    // 1. Check Master Admin from environment variables
    if (adminPassword && timingSafeCompare(username, adminUsername) && timingSafeCompare(password, adminPassword)) {
      authenticatedUser = {
        username: adminUsername,
        fullName: "Vann Sitha (Owner)",
        role: "ADMIN",
      };
    } else {
      // 2. Query Database User (Staff or Additional Admins)
      const dbUser = await prisma.user.findUnique({
        where: { username },
      });

      if (dbUser) {
        if (!dbUser.isActive) {
          return NextResponse.json(
            { error: "គណនីនេះត្រូវបានផ្អាកដំណើរការជាបណ្តោះអាសន្ន។ សូមទាក់ទងម្ចាស់គ្រប់គ្រង" },
            { status: 403 }
          );
        }

        const isMatch = verifyPassword(password, dbUser.passwordHash);
        if (isMatch) {
          authenticatedUser = {
            username: dbUser.username,
            fullName: dbUser.fullName,
            role: dbUser.role as "ADMIN" | "STAFF",
            userId: dbUser.id,
          };
        }
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      username: authenticatedUser.username,
      fullName: authenticatedUser.fullName,
      role: authenticatedUser.role,
      userId: authenticatedUser.userId,
    });
    const isProd = process.env.NODE_ENV === "production";

    const res = NextResponse.json({
      success: true,
      message: "ចូលប្រព័ន្ធជោគជ័យ",
      user: authenticatedUser,
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_TTL_SECONDS,
    });

    return res;
  } catch (error: any) {
    console.error("[Auth Login Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់ សូមព្យាយាមម្តងទៀត" },
      { status: 500 }
    );
  }
}
