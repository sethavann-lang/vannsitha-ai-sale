import { NextRequest, NextResponse } from "next/server";
import {
  getTelegramBotMe,
  detectTelegramChatId,
  sendTelegramMessage,
} from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // 1. Detect Chat ID from recent messages
  if (action === "detect") {
    const result = await detectTelegramChatId();
    return NextResponse.json(result);
  }

  // 2. Default: return bot info & configured status
  const botInfo = await getTelegramBotMe();
  const configuredChatId = process.env.TELEGRAM_CHAT_ID || "";

  return NextResponse.json({
    ok: botInfo.ok,
    bot: botInfo.result || null,
    configuredChatId: configuredChatId || null,
    isConnected: !!(botInfo.ok && configuredChatId),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, chatId, message } = body;

    // Save Chat ID to .env and runtime
    if (action === "save_chat_id") {
      if (!chatId) {
        return NextResponse.json(
          { ok: false, error: "Chat ID is required" },
          { status: 400 }
        );
      }

      process.env.TELEGRAM_CHAT_ID = String(chatId);

      // Persist to .env file
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const envPath = path.join(process.cwd(), ".env");
        let envContent = await fs.readFile(envPath, "utf-8");

        if (envContent.includes("TELEGRAM_CHAT_ID=")) {
          envContent = envContent.replace(
            /TELEGRAM_CHAT_ID=.*/g,
            `TELEGRAM_CHAT_ID="${chatId}"`
          );
        } else {
          envContent += `\nTELEGRAM_CHAT_ID="${chatId}"\n`;
        }

        await fs.writeFile(envPath, envContent, "utf-8");
      } catch (fsErr) {
        console.warn("[Telegram] Could not persist to .env:", fsErr);
      }

      return NextResponse.json({
        ok: true,
        message: "Telegram Chat ID saved successfully",
        chatId: String(chatId),
      });
    }

    // Send Test Alert
    if (action === "test") {
      const cleanChatId = chatId && !chatId.includes("*") ? chatId : null;
      const targetId = cleanChatId || process.env.TELEGRAM_CHAT_ID;
      if (!targetId) {
        return NextResponse.json(
          { ok: false, error: "សូមបញ្ចូល Chat ID ឬភ្ជាប់ Telegram ជាមុនសិន។" },
          { status: 400 }
        );
      }

      const text =
        message ||
        `
🤖 <b>ការតេស្តជោគជ័យពី VANN SITHA AI SALE!</b>
━━━━━━━━━━━━━━━━━━
✨ Telegram Bot <b>@My_CEO_Assitant_bot</b> ត្រូវបានភ្ជាប់ជាមួយប្រព័ន្ធលក់ដោយជោគជ័យ។

🔔 រាល់ពេលមាន៖
• <b>អតិថិជនថ្មីចូលមកពី Facebook (New Lead)</b>
• <b>អតិថិជនចង់ទិញ ឬកុម្ម៉ង់ទំនិញ (Order Won)</b>
• <b>កាលវិភាគដល់ពេលត្រូវ Follow-up</b>
ប្រព័ន្ធនឹងផ្ញើសារ Alert មកកាន់ Telegram នេះភ្លាមៗ ២៤/៧!
━━━━━━━━━━━━━━━━━━
🚀 <i>រៀបចំដោយ VANN SITHA STUDIO</i>
`.trim();

      const result = await sendTelegramMessage(text, targetId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Telegram API] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
