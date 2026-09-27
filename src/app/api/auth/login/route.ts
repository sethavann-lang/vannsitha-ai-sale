import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME, TOKEN_TTL_SECONDS } from "@/lib/auth";

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

    // FAIL CLOSED: If ADMIN_PASSWORD or AUTH_SECRET is not configured in env, refuse login with 500 error
    if (!adminPassword || !authSecret) {
      console.error(
        "[Auth] Configuration error: ADMIN_PASSWORD or AUTH_SECRET is missing from environment variables."
      );
      return NextResponse.json(
        {
          error:
            "ការកំណត់សុវត្ថិភាពមិនទាន់រួចរាល់ (ADMIN_PASSWORD ឬ AUTH_SECRET មិនទាន់បានកំណត់ក្នុង Environment Variables ឡើយ)",
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

    const isUserValid = timingSafeCompare(username, adminUsername);
    const isPassValid = timingSafeCompare(password, adminPassword);

    if (!isUserValid || !isPassValid) {
      return NextResponse.json(
        { error: "ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(username);
    const isProd = process.env.NODE_ENV === "production";

    const res = NextResponse.json({
      success: true,
      message: "ចូលប្រព័ន្ធជោគជ័យ",
      user: { username },
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
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់" },
      { status: 500 }
    );
  }
}
