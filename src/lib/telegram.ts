/**
 * Telegram Bot Service (My CEO Assistant)
 * Used for instant Sales Alerts, New Lead Notifications, Order Confirmations & Follow-up Reminders.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org";

function getBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || "8956706300:AAHUgpM3_fD_nR95pK8S_hXs4_D-Qd5rNkE";
}

function getDefaultChatId(): string {
  return process.env.TELEGRAM_CHAT_ID || "";
}

/**
 * Get Bot profile details
 */
export async function getTelegramBotMe() {
  try {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getMe`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[Telegram] Error in getMe:", error);
    return { ok: false, error };
  }
}

/**
 * Auto-detect recent Chat ID from getUpdates
 */
export async function detectTelegramChatId(): Promise<{
  ok: boolean;
  chatId?: string;
  chatTitle?: string;
  chatType?: string;
  senderName?: string;
  error?: string;
}> {
  try {
    const token = getBotToken();
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getUpdates?limit=10`);
    const data = await res.json();

    if (!data.ok || !data.result || data.result.length === 0) {
      return {
        ok: false,
        error: "មិនទាន់មានសារថ្មីនៅឡើយទេ។ សូមចុច START ឬផ្ញើសារ 'hello' ទៅកាន់ Bot ជាមុនសិន។",
      };
    }

    // Get the most recent update with a message
    const lastUpdate = [...data.result].reverse().find((u: any) => u.message?.chat);
    if (!lastUpdate || !lastUpdate.message?.chat) {
      return {
        ok: false,
        error: "រកមិនឃើញ Chat ID ក្នុងសារចុងក្រោយទេ។",
      };
    }

    const chat = lastUpdate.message.chat;
    const from = lastUpdate.message.from;
    const chatId = String(chat.id);
    const chatTitle = chat.title || chat.username || `${from?.first_name || ""} ${from?.last_name || ""}`.trim();
    const chatType = chat.type; // "private", "group", "supergroup", "channel"
    const senderName = `${from?.first_name || ""} ${from?.last_name || ""}`.trim() || from?.username || "Telegram User";

    return {
      ok: true,
      chatId,
      chatTitle,
      chatType,
      senderName,
    };
  } catch (error: any) {
    console.error("[Telegram] Error detecting chat ID:", error);
    return { ok: false, error: error.message || "Failed to detect Chat ID" };
  }
}

/**
 * Send an HTML formatted message to Telegram
 */
export async function sendTelegramMessage(
  text: string,
  targetChatId?: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<{ ok: boolean; error?: any }> {
  try {
    const token = getBotToken();
    const chatId = targetChatId || getDefaultChatId();

    if (!chatId) {
      console.warn("[Telegram] Skipped sending message: TELEGRAM_CHAT_ID is not configured yet.");
      return { ok: false, error: "TELEGRAM_CHAT_ID is not set" };
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error("[Telegram] API returned error:", data);
      return { ok: false, error: data.description };
    }

    return { ok: true };
  } catch (error) {
    console.error("[Telegram] Network error sending message:", error);
    return { ok: false, error };
  }
}

/**
 * 1. Alert when a new Lead/Customer is created from Facebook Comment or Messenger
 */
export async function notifyNewLeadTelegram(lead: {
  name: string;
  phone?: string | null;
  source: string;
  product?: string | null;
  stage?: string;
  commentText?: string | null;
}) {
  const sourceLabel = lead.source === "COMMENT" ? "💬 Facebook Comment" : "📥 Messenger Inbox";
  const text = `
🌟 <b>[CRM Alert] អតិថិជនថ្មីទើបចូលមក!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>ឈ្មោះ៖</b> ${escapeHtml(lead.name)}
📞 <b>លេខទូរស័ព្ទ៖</b> ${lead.phone ? `<code>${lead.phone}</code>` : "<i>(មិនទាន់មាន)</i>"}
🌐 <b>ប្រភព៖</b> ${sourceLabel}
📦 <b>ផលិតផល៖</b> ${escapeHtml(lead.product || "Kidney Pro ឃីដនី ប្រូ")}
📊 <b>ដំណាក់កាល៖</b> <b>${escapeHtml(lead.stage || "NEW_LEAD")}</b>
${lead.commentText ? `💬 <b>ខ្លឹមសារ៖</b> <i>"${escapeHtml(lead.commentText)}"</i>\n` : ""}━━━━━━━━━━━━━━━━━━
⚡ <i>AI Sales Studio បាន Sync ចូល CRM ដោយស្វ័យប្រវត្តិ</i>
`.trim();

  return sendTelegramMessage(text);
}

/**
 * 2. Alert when a customer provides phone number or order is marked
 */
export async function notifyOrderWonTelegram(order: {
  name: string;
  phone?: string | null;
  product?: string | null;
  notes?: string | null;
  amount?: string | null;
}) {
  const text = `
🎉 <b>[HOT ALERT] មានការកុម្ម៉ង់ទិញថ្មី (ORDER WON)!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>អតិថិជន៖</b> ${escapeHtml(order.name)}
📞 <b>លេខទូរស័ព្ទ៖</b> <code>${order.phone || "ត្រូវការសួរលេខ"}</code>
📦 <b>ទំនិញកុម្ម៉ង់៖</b> ${escapeHtml(order.product || "Kidney Pro ឃីដនី ប្រូ")}
${order.amount ? `💰 <b>តម្លៃសរុប៖</b> <b>${order.amount}</b>\n` : ""}${order.notes ? `📝 <b>កំណត់ចំណាំ៖</b> <i>${escapeHtml(order.notes)}</i>\n` : ""}━━━━━━━━━━━━━━━━━━
🚀 <b>សូមក្រុមការងារ ឬអ្នកលក់ទាក់ទងរៀបចំដឹកជញ្ជូនជូនភ្ញៀវ!</b>
`.trim();

  return sendTelegramMessage(text);
}

/**
 * 3. Alert when Follow-up reminder is due
 */
export async function notifyFollowUpDueTelegram(task: {
  customerName: string;
  phone?: string | null;
  reason: string;
  aiSuggestedText?: string | null;
}) {
  const text = `
⏰ <b>[Reminder] ដល់ពេល Follow-up អតិថិជន!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>អតិថិជន៖</b> ${escapeHtml(task.customerName)}
📞 <b>លេខទូរស័ព្ទ៖</b> ${task.phone ? `<code>${task.phone}</code>` : "<i>(គ្មានលេខ)</i>"}
❓ <b>មូលហេតុ៖</b> ${escapeHtml(task.reason)}
${task.aiSuggestedText ? `\n💡 <b>សារ AI បានព្រាងទុក៖</b>\n<i>"${escapeHtml(task.aiSuggestedText)}"</i>\n` : ""}━━━━━━━━━━━━━━━━━━
👉 <i>សូមចូលទៅកាន់ Sales Studio ដើម្បីផ្ញើសារ ឬខលទៅកាន់ភ្ញៀវ</i>
`.trim();

  return sendTelegramMessage(text);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
