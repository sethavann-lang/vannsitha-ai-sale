import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyAuthRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuthRequest(req);
    if (!session.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY មិនទាន់ត្រូវបានកំណត់ក្នុង Environment Variables ឡើយ" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const question = (body.question || "").trim();
    const chatHistory = Array.isArray(body.history) ? body.history : [];

    if (!question) {
      return NextResponse.json(
        { error: "សូមបញ្ចូលសំណួររបស់អ្នក" },
        { status: 400 }
      );
    }

    // 1. Gather Real-Time Business Data
    const [
      totalLeads,
      newLeads,
      hotLeads,
      orderedLeads,
      pendingFollowups,
      overdueFollowups,
      totalStaff,
      knowledgeItems,
      pageConfig,
    ] = await Promise.all([
      prisma.customer.count().catch(() => 0),
      prisma.customer.count({ where: { stage: "NEW_LEAD" } }).catch(() => 0),
      prisma.customer.count({ where: { stage: "HOT_LEAD" } }).catch(() => 0),
      prisma.customer.count({ where: { stage: "ORDERED" } }).catch(() => 0),
      prisma.followUpTask.count({ where: { status: "PENDING" } }).catch(() => 0),
      prisma.followUpTask
        .count({ where: { status: "PENDING", scheduledAt: { lt: new Date() } } })
        .catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.knowledgeItem
        .findMany({
          select: { title: true, category: true, content: true, imageUrl: true, audioUrl: true },
          take: 10,
        })
        .catch(() => []),
      prisma.pageConfig
        .findFirst({
          select: {
            pageName: true,
            isActive: true,
            autoReplyInbox: true,
            autoReplyComment: true,
            welcomeAudioEnabled: true,
            welcomeAudioUrl: true,
          },
        })
        .catch(() => null),
    ]);

    const knowledgeSummary = knowledgeItems.length > 0
      ? knowledgeItems
          .map(
            (k, idx) =>
              `${idx + 1}. [${k.category || "ទូទៅ"}] ${k.title}: ${k.content} ${
                k.imageUrl ? `(មានរូបភាព Poster: ${k.imageUrl})` : ""
              } ${k.audioUrl ? `(មានសំឡេង Voice: ${k.audioUrl})` : ""}`
          )
          .join("\n")
      : "Kidney Pro ឃីដនី ប្រូ (អាហារបំប៉នជំនួយសុខភាពតម្រងនោម និងផ្លូវទឹកនោម)";

    // 2. Build Copilot System Instruction
    const systemInstruction = `
អ្នកគឺជា "VANN SITHA AI Copilot" ដែលជាជំនួយការវៃឆ្លាតប្រចាំប្រព័ន្ធ "VANN SITHA AI Sale Studio"។
អ្នកប្រើប្រាស់បច្ចុប្បន្ន: ${session.fullName || session.username} (តួនាទី: ${session.role === "ADMIN" ? "ម្ចាស់អាជីវកម្ម / Admin" : "បុគ្គលិកលក់ / Sales Staff"})។

=== ទិន្នន័យជាក់ស្តែងនៃអាជីវកម្មបច្ចុប្បន្ន (LIVE STORE DATA) ===
- ផេក Facebook ដែលបានភ្ជាប់: ${pageConfig?.pageName || "Kidney Pro ឃីដនី ប្រូ"} (ស្ថានភាព: ${pageConfig?.isActive ? "ដំណើរការ" : "ផ្អាក"})
- អតិថិជនសរុបក្នុង CRM: ${totalLeads} នាក់
- អតិថិជនថ្មី (New Leads): ${newLeads} នាក់
- អតិថិជនចង់ទិញខ្លាំង (Hot Leads): ${hotLeads} នាក់
- ការលក់ជោគជ័យ (Won Orders): ${orderedLeads} នាក់
- កិច្ចការតាមដានរង់ចាំ (Pending Follow-ups): ${pendingFollowups}
- ការតាមដានហួសកាលកំណត់ (Overdue Follow-ups): ${overdueFollowups}
- ចំនួនគណនីបុគ្គលិកក្នុងប្រព័ន្ធ: ${totalStaff} នាក់
- សំឡេងស្វាគមន៍ស្វ័យប្រវត្តិ (Welcome Voice Note): ${pageConfig?.welcomeAudioEnabled ? "បើកដំណើរការ" : "បិទ"}

=== ចំណេះដឹងផលិតផល (KNOWLEDGE BASE) ===
${knowledgeSummary}

=== ការណែនាំអំពីម៉ូឌុល និងរបៀបប្រើប្រាស់ប្រព័ន្ធ (SYSTEM USER GUIDE) ===
១. ទិដ្ឋភាពទូទៅ (Overview): មើលស្ថិតិលក់សរុប (KPIs), ល្បឿន AI, សារសន្ទនាចុងក្រោយរបស់អតិថិជន។
២. អតិថិជន (Customers / CRM): បញ្ជីអតិថិជនទាំងអស់, លេខទូរស័ព្ទ, ដំណាក់កាលលក់, ចំណាប់អារម្មណ៍ទំនិញ, និងកំណត់ពេល Follow-up។
៣. ដំណើរការលក់ (Sales Pipeline): ផ្ទាំង Kanban តាមដានដំណើរការលក់ ៦ ដំណាក់កាល (អតិថិជនថ្មី ➔ ចាប់អារម្មណ៍ ➔ ចង់ទិញខ្លាំង ➔ កំពុងតាមដាន ➔ បានកុម្ម៉ង់ ➔ បោះបង់)។
៤. ការតាមដាន (Follow-ups): គ្រប់គ្រងកាលវិភាគតាមដានអតិថិជន, ការរំលឹក Overdue, និងមានប៊ូតុង "AI ជួយព្រាងសារ" ដោយប្រើ Gemini ដើម្បីផ្ញើចូល Messenger ភ្ញៀវ។
៥. ការសន្ទនាផ្ទាល់ (Inbox): ឆាតផ្ទាល់ជាមួយភ្ញៀវលើ Messenger, មានប៊ូតុង "ផ្អាក AI / បើក AI វិញ" ដើម្បីឱ្យមនុស្សឆ្លើយផ្ទាល់នៅពេលភ្ញៀវត្រូវការពន្យល់ស៊ីជម្រៅ។
៦. ចំណេះដឹងផលិតផល (Knowledge Base): កន្លែងផ្ទុកព័ត៌មានទំនិញ, អត្ថប្រយោជន៍, តម្លៃ, Link រូបភាព Poster, និង Link សំឡេង Voice Note ដើម្បីឱ្យ AI ឆ្លើយ និងផ្ញើចូល Inbox ភ្ញៀវដោយស្វ័យប្រវត្តិ។
៧. ស្វ័យប្រវត្តិកម្ម (Automation): កុងតាក់បើក/បិទ ឆ្លើយតប Comment លើ Facebook Post, ផ្ញើសារ Private Reply, និងកែប្រែ System Prompt (អត្តចរិតអ្នកលក់ AI)។
៨. គ្រប់គ្រងក្រុមការងារ & បុគ្គលិក (Staff Management): ស្ថិតក្នុងម៉ឺនុយ "ការកំណត់ប្រព័ន្ធ" (សម្រាប់តែ Admin), ចុច "+ បន្ថែមបុគ្គលិកថ្មី", ដាក់ Username/Password និងកំណត់តួនាទី (Staff/Admin), អាចបិទ/បើក ឬលុបគណនីបុគ្គលិកបាន។
៩. Telegram Bot (CEO Assistant): ផ្ញើសារដំណឹងភ្លាមៗទៅ Telegram របស់ម្ចាស់ហាង ពេលមាន Lead ថ្មី ឬការកុម្ម៉ង់ទិញ។

=== ច្បាប់នៃការឆ្លើយតប (RESPONSE GUIDELINES) ===
- ឆ្លើយតបជាភាសាខ្មែរគួរសម រាក់ទាក់ ច្បាស់លាស់ ខ្លីខ្លឹម និងចំចំណុច។
- ប្រសិនបើសួរអំពីរបៀបប្រើប្រាស់ប្រព័ន្ធ សូមប្រាប់មួយជំហានៗ (Step-by-step) យ៉ាងងាយយល់។
- ប្រសិនបើសួរអំពីទិន្នន័យ (ដូចជាចំនួនអតិថិជន, ការលក់, Follow-up) សូមឆ្លើយយោងតាម LIVE STORE DATA ខាងលើ។
- ប្រសិនបើសួរអំពីផលិតផល Kidney Pro សូមផ្តល់ព័ត៌មានតាម KNOWLEDGE BASE។
- ប្រើ Formatting ស្អាត (Bullet points, Bold, Emojis សមរម្យ)។
`.trim();

    const genAI = new GoogleGenerativeAI(apiKey);

    // Format previous conversation context if any
    const contents: any[] = [];
    for (const msg of chatHistory.slice(-6)) {
      if (msg.role === "user" || msg.role === "model") {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text || "" }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: question }],
    });

    const candidateModels = [
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let answer = "";
    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: mName,
          systemInstruction,
        });

        const result = await model.generateContent({ contents });
        const response = await result.response;
        const text = response.text()?.trim();
        if (text) {
          answer = text;
          break;
        }
      } catch (err: any) {
        console.warn(`[Ask AI Copilot] ${mName} error:`, err?.message || err);
      }
    }

    if (!answer) {
      answer = `សួស្តីបង ${session.fullName || ""}! ខ្ញុំជាជំនួយការ AI របស់ប្រព័ន្ធ។ បច្ចុប្បន្ន ហាងយើងមានអតិថិជនសរុប ${totalLeads} នាក់ និងការតាមដានរង់ចាំ ${pendingFollowups} នាក់។ តើបងចង់ឱ្យខ្ញុំជួយពន្យល់អំពីម៉ូឌុលណា ឬជួយការងារអ្វីដែរចាស/បាទ?`;
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error: any) {
    console.error("[Ask AI Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាបច្ចេកទេសក្នុងការទាក់ទង AI" },
      { status: 500 }
    );
  }
}
