import { NextRequest, NextResponse } from "next/server";
import { WebhookPayload } from "@/types/meta";
import { replyToComment, sendPrivateReply, sendMessengerMessage, sendMessengerAttachment } from "@/lib/meta/graph";
import { getAIProvider, ChatMessage } from "@/lib/ai";
import { db } from "@/lib/db";

// Fallback config from environment variables for single-page MVP
const DEFAULT_PAGE_ID = process.env.FB_PAGE_ID || "";
const DEFAULT_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || "";
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "chatkh_secret_token";

/**
 * 1. Webhook Verification (GET)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Verification successful!");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[Webhook] Verification failed. Token mismatch.");
  return new Response("Forbidden", { status: 403 });
}

/**
 * Helper to get Page configuration and knowledge base
 */
async function getPageConfigWithKnowledge(pageId: string) {
  try {
    const config = await db.pageConfig.findUnique({
      where: { pageId },
      include: { knowledgeItems: true },
    });

    if (config) {
      const knowledgeText = config.knowledgeItems
        .map((k) => {
          let itemStr = `[${k.category || "General"}] ${k.title}:\n${k.content}`;
          if (k.imageUrl) itemStr += `\n[IMAGE: ${k.imageUrl}]`;
          if (k.audioUrl) itemStr += `\n[AUDIO: ${k.audioUrl}]`;
          return itemStr;
        })
        .join("\n\n");
      return { config, knowledgeText, token: config.pageAccessToken };
    }
  } catch (error) {
    console.error("[DB] Error fetching PageConfig:", error);
  }

  // Fallback to default environment variables if not yet in database
  const defaultKnowledge = process.env.DEFAULT_KNOWLEDGE_BASE || "ហាងយើងខ្ញុំមានលក់សម្លៀកបំពាក់ និងទំនិញគុណភាពខ្ពស់ ដឹកជញ្ជូនឥតគិតថ្លៃគ្រប់ខេត្តក្រុង។";
  const defaultPrompt = process.env.DEFAULT_SYSTEM_PROMPT || "អ្នកគឺជាជំនួយការលក់ប្រចាំហាង (Sales Assistant) ដែលរួសរាយ រាក់ទាក់ និងឆ្លើយតបជាភាសាខ្មែរ។";

  return {
    config: {
      pageId: DEFAULT_PAGE_ID || pageId,
      systemPrompt: defaultPrompt,
      autoReplyComment: true,
      privateReplyComment: true,
      autoReplyInbox: true,
    },
    knowledgeText: defaultKnowledge,
    token: DEFAULT_PAGE_ACCESS_TOKEN,
  };
}

/**
 * Helper to check deduplication
 */
async function isAlreadyProcessed(id: string, eventType: string): Promise<boolean> {
  try {
    const existing = await db.processedEvent.findUnique({ where: { id } });
    if (existing) return true;

    await db.processedEvent.create({
      data: { id, eventType },
    });
    return false;
  } catch {
    // If DB is offline, continue without deduplication
    return false;
  }
}

/**
 * 2. Webhook Event Receiver (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const body: WebhookPayload = await req.json();

    if (body.object !== "page") {
      return NextResponse.json({ message: "Unsupported object" }, { status: 404 });
    }

    const ai = getAIProvider();

    for (const entry of body.entry) {
      const pageId = entry.id;
      const { config, knowledgeText, token } = await getPageConfigWithKnowledge(pageId);

      if (!token) {
        console.warn(`[Webhook] No access token found for Page ID ${pageId}`);
        continue;
      }

      // ==========================================
      // FLOW A: Handle Comments on Posts (feed)
      // ==========================================
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === "feed") {
            const val = change.value;
            const isComment = val.item === "comment" && val.verb === "add";

            if (isComment && val.comment_id && val.message) {
              const commentId = val.comment_id;
              const commenterId = val.from?.id;

              // Don't reply to page's own comment
              if (commenterId === pageId) continue;

              // Deduplication
              if (await isAlreadyProcessed(commentId, "comment")) {
                console.log(`[Webhook] Comment ${commentId} already processed. Skipping.`);
                continue;
              }

              console.log(`[Webhook] New customer comment: "${val.message}" by ${val.from?.name || commenterId}`);

              // Auto-sync customer to CRM
              if ((config as any).id && commenterId) {
                try {
                  const pageConfigId = (config as any).id;
                  const customerName = val.from?.name || `Commenter #${commenterId.slice(-4)}`;
                  const existingCustomer = await db.customer.findFirst({
                    where: { pageConfigId, facebookId: commenterId },
                  });
                  if (!existingCustomer) {
                    const newLead = await db.customer.create({
                      data: {
                        pageConfigId,
                        name: customerName,
                        facebookId: commenterId,
                        source: "COMMENT",
                        stage: "NEW_LEAD",
                        lastContactAt: new Date(),
                        notes: `Commented: "${val.message.slice(0, 100)}"`,
                      },
                    });

                    // Telegram Alert for new Comment Lead
                    import("@/lib/telegram").then(({ notifyNewLeadTelegram }) => {
                      notifyNewLeadTelegram({
                        name: customerName,
                        source: "COMMENT",
                        stage: "NEW_LEAD",
                        commentText: val.message,
                      }).catch((err) => console.warn("[Telegram] Comment alert error:", err));
                    });
                  } else {
                    await db.customer.update({
                      where: { id: existingCustomer.id },
                      data: {
                        lastContactAt: new Date(),
                        notes: `Last comment: "${val.message.slice(0, 100)}"`,
                      },
                    });
                  }
                } catch (crmErr) {
                  console.warn("[CRM] Failed to auto-sync commenter lead:", crmErr);
                }
              }

              // 1. AI Public Reply
              if (config.autoReplyComment) {
                try {
                  const publicReplyText = await ai.generateReply({
                    systemPrompt: config.systemPrompt,
                    knowledgeBase: knowledgeText,
                    history: [],
                    incomingMessage: val.message,
                    contextType: "comment",
                  });

                  await replyToComment(commentId, publicReplyText, token);
                  console.log(`[Webhook] Answered public comment: "${publicReplyText}"`);
                } catch (err) {
                  console.error("[Webhook] Failed to reply public comment:", err);
                }
              }

              // 2. Private Reply to Messenger
              if (config.privateReplyComment) {
                try {
                  const privateReplyPrompt = `អតិថិជនបាន Comment ថា: "${val.message}"។ សូមសរសេរសារស្វាគមន៍គួរសម ខ្លី និងផ្តល់ព័ត៌មានបន្ថែម ឬសួរថាតើគាត់ចង់ដឹងព័ត៌មានអ្វីខ្លះទៀត ដើម្បីផ្ញើចូល Messenger របស់គាត់។`;
                  const privateReplyText = await ai.generateReply({
                    systemPrompt: config.systemPrompt,
                    knowledgeBase: knowledgeText,
                    history: [],
                    incomingMessage: privateReplyPrompt,
                    contextType: "inbox",
                  });

                  await sendPrivateReply(commentId, privateReplyText, token);
                  console.log(`[Webhook] Sent private reply to Messenger: "${privateReplyText}"`);
                } catch (err) {
                  console.error("[Webhook] Failed to send private reply:", err);
                }
              }
            }
          }
        }
      }

      // ==========================================
      // FLOW B: Handle Messages in Messenger (messages)
      // ==========================================
      if (entry.messaging) {
        for (const msgEvent of entry.messaging) {
          const senderPsid = msgEvent.sender.id;
          const msg = msgEvent.message;

          // Ignore echo messages (messages sent by the page itself)
          if (!msg || msg.is_echo || !msg.text) continue;

          const mid = msg.mid;
          if (await isAlreadyProcessed(mid, "message")) {
            console.log(`[Webhook] Message ${mid} already processed. Skipping.`);
            continue;
          }

          console.log(`[Webhook] Incoming Messenger message: "${msg.text}" from PSID: ${senderPsid}`);

          // Fetch chat history and auto-sync customer to CRM
          let history: ChatMessage[] = [];
          let conversationId: string | null = null;
          let conv: any = null;

          // Simple Cambodian phone number regex: e.g. 012345678, +85512345678, 098 765 432
          const phoneRegex = /(?:0|\+?855)\s*[1-9]\d{1,2}[\s.-]?\d{3}[\s.-]?\d{3,4}/;
          const phoneMatch = msg.text.match(phoneRegex);
          const detectedPhone = phoneMatch ? phoneMatch[0].replace(/\s+/g, "") : null;

          try {
            const pageConfigId = (config as any).id || "default";

            // Find or auto-create Customer in CRM
            let customer: any = null;
            if ((config as any).id) {
              customer = await db.customer.findUnique({
                where: {
                  pageConfigId_psid: { pageConfigId, psid: senderPsid },
                },
              });

              if (!customer) {
                customer = await db.customer.create({
                  data: {
                    pageConfigId,
                    name: `Customer #${senderPsid.slice(-6)}`,
                    psid: senderPsid,
                    phone: detectedPhone,
                    source: "MESSENGER",
                    stage: "NEW_LEAD",
                    lastContactAt: new Date(),
                  },
                });

                // Telegram Alert for new Inbox Lead
                import("@/lib/telegram").then(({ notifyNewLeadTelegram }) => {
                  notifyNewLeadTelegram({
                    name: customer.name,
                    phone: detectedPhone,
                    source: "MESSENGER",
                    stage: "NEW_LEAD",
                    commentText: msg.text,
                  }).catch((err) => console.warn("[Telegram] Inbox alert error:", err));
                });
              } else {
                const hadNoPhone = !customer.phone && !!detectedPhone;
                await db.customer.update({
                  where: { id: customer.id },
                  data: {
                    lastContactAt: new Date(),
                    ...(detectedPhone && !customer.phone ? { phone: detectedPhone } : {}),
                  },
                });

                // Alert if customer just provided their phone number
                if (hadNoPhone && detectedPhone) {
                  import("@/lib/telegram").then(({ notifyOrderWonTelegram }) => {
                    notifyOrderWonTelegram({
                      name: customer.name,
                      phone: detectedPhone,
                      product: customer.productInterest || "Kidney Pro ឃីដនី ប្រូ",
                      notes: "អតិថិជនបានផ្តល់លេខទូរស័ព្ទក្នុង Messenger Chat",
                    }).catch((err) => console.warn("[Telegram] Phone captured alert error:", err));
                  });
                }
              }
            }

            conv = await db.conversation.findUnique({
              where: {
                pageConfigId_psid: {
                  pageConfigId,
                  psid: senderPsid,
                },
              },
              include: {
                messages: {
                  orderBy: { createdAt: "desc" },
                  take: 6, // Last 6 messages for context
                },
              },
            });

            const isNewConversation = !conv || conv.messages.length === 0;

            if (!conv && (config as any).id) {
              conv = await db.conversation.create({
                data: {
                  pageConfigId,
                  psid: senderPsid,
                  customerId: customer?.id || null,
                  customerName: customer?.name || null,
                },
                include: { messages: true },
              });
            } else if (conv && customer && !conv.customerId) {
              await db.conversation.update({
                where: { id: conv.id },
                data: { customerId: customer.id },
              });
            }

            if (conv) {
              conversationId = conv.id;
              // Format for AI
              history = conv.messages
                .reverse()
                .map((m: any) => ({
                  role: m.sender === "USER" ? ("user" as const) : ("model" as const),
                  content: m.text,
                }));
            }

            // Instant Welcome Voice Note (if enabled and this is customer's first contact)
            if ((config as any).welcomeAudioEnabled && (config as any).welcomeAudioUrl && isNewConversation) {
              try {
                await sendMessengerAttachment(senderPsid, "audio", (config as any).welcomeAudioUrl, token);
                console.log(`[Webhook] Sent Welcome Audio Note to ${senderPsid}`);
                if (conversationId) {
                  await db.message.create({
                    data: {
                      conversationId,
                      sender: "AI",
                      text: `[សារសំឡេងស្វាគមន៍ Welcome Voice]: ${(config as any).welcomeAudioUrl}`,
                    },
                  });
                }
              } catch (audioErr) {
                console.error("[Webhook] Failed to send welcome audio note:", audioErr);
              }
            }
          } catch (err) {
            console.warn("[DB] Could not load conversation history or sync customer:", err);
          }

          // Human Takeover check
          if (conv?.isAiPaused) {
            console.log(`[Webhook] AI is paused for customer ${senderPsid} (Human Takeover active). Skipping auto-reply.`);
            if (conversationId) {
              await db.message.create({
                data: { conversationId, sender: "USER", text: msg.text },
              });
            }
            continue;
          }

          if (!config.autoReplyInbox) {
            console.log(`[Webhook] autoReplyInbox is turned off. Skipping.`);
            if (conversationId) {
              await db.message.create({
                data: { conversationId, sender: "USER", text: msg.text },
              });
            }
            continue;
          }
          try {
            const aiReply = await ai.generateReply({
              systemPrompt: config.systemPrompt,
              knowledgeBase: knowledgeText,
              history,
              incomingMessage: msg.text,
              contextType: "inbox",
            });

            // Parse Attachment Tags
            const imageTagMatch = aiReply.match(/\[ATTACH_IMAGE:\s*(https?:\/\/[^\s\]]+)\]/i);
            const audioTagMatch = aiReply.match(/\[ATTACH_AUDIO:\s*(https?:\/\/[^\s\]]+)\]/i);

            let imageUrlToSend = imageTagMatch ? imageTagMatch[1] : null;
            let audioUrlToSend = audioTagMatch ? audioTagMatch[1] : null;

            // Clean tags from user text
            let cleanReply = aiReply
              .replace(/\[ATTACH_IMAGE:\s*(https?:\/\/[^\s\]]+)\]/gi, "")
              .replace(/\[ATTACH_AUDIO:\s*(https?:\/\/[^\s\]]+)\]/gi, "")
              .trim();

            // Fallback: If no image tag was output, check if user asked for poster/image and knowledge item has image
            if (!imageUrlToSend && (config as any).knowledgeItems) {
              const lowerMsg = msg.text.toLowerCase();
              if (lowerMsg.includes("រូប") || lowerMsg.includes("poster") || lowerMsg.includes("មើល") || lowerMsg.includes("អត្ថប្រយោជន៍")) {
                for (const item of (config as any).knowledgeItems) {
                  if (item.imageUrl) {
                    imageUrlToSend = item.imageUrl;
                    break;
                  }
                }
              }
            }

            // 1. Send clean text message back to user in Messenger
            if (cleanReply) {
              await sendMessengerMessage(senderPsid, cleanReply, token);
              console.log(`[Webhook] Sent Messenger reply: "${cleanReply}"`);
            }

            // 2. Send Image attachment if present
            if (imageUrlToSend) {
              try {
                await sendMessengerAttachment(senderPsid, "image", imageUrlToSend, token);
                console.log(`[Webhook] Sent Image attachment: ${imageUrlToSend}`);
              } catch (imgErr) {
                console.error("[Webhook] Failed to send image attachment:", imgErr);
              }
            }

            // 3. Send Audio attachment if present
            if (audioUrlToSend) {
              try {
                await sendMessengerAttachment(senderPsid, "audio", audioUrlToSend, token);
                console.log(`[Webhook] Sent Audio attachment: ${audioUrlToSend}`);
              } catch (audErr) {
                console.error("[Webhook] Failed to send audio attachment:", audErr);
              }
            }

            // Save conversation to DB
            if (conversationId) {
              const messagesToCreate = [
                { conversationId, sender: "USER", text: msg.text },
              ];
              if (cleanReply) {
                messagesToCreate.push({ conversationId, sender: "AI", text: cleanReply });
              }
              if (imageUrlToSend) {
                messagesToCreate.push({ conversationId, sender: "AI", text: `[Poster រូបភាព]: ${imageUrlToSend}` });
              }
              if (audioUrlToSend) {
                messagesToCreate.push({ conversationId, sender: "AI", text: `[Voice Note សំឡេង]: ${audioUrlToSend}` });
              }

              await db.message.createMany({
                data: messagesToCreate,
              });
            }
          } catch (err) {
            console.error("[Webhook] Failed to generate or send Messenger reply:", err);
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error: any) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
