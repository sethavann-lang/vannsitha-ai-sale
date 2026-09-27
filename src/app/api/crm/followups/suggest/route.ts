import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAIProvider } from "@/lib/ai";

const REASON_LABELS: Record<string, string> = {
  PRICE_OBJECTION: "អតិថិជនគិតថាតម្លៃរាងថ្លៃ ឬសុំចុះថ្លៃ (Price Objection)",
  NEED_TO_THINK: "អតិថិជនសុំគិតមើលសិន (Need to think)",
  NO_RESPONSE: "អតិថិជនអានហើយមិនទាន់ឆ្លើយតប (No response / Ghosting)",
  WAITING_SALARY: "អតិថិជនរង់ចាំបើកប្រាក់ខែ (Waiting salary)",
  ASK_FAMILY: "អតិថិជនសុំពិភាក្សាជាមួយគ្រួសារ ឬស្វាមី/ភរិយាសិន (Ask family/spouse)",
  INTERESTED_NOT_READY: "អតិថិជនចាប់អារម្មណ៍ខ្លាំងតែមិនទាន់រួចរាល់ (Interested but not ready)",
  OTHER: "មូលហេតុផ្សេងៗ (Other)",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, reason, customReason } = body;

    if (!customerId || !reason) {
      return NextResponse.json(
        { error: "customerId and reason are required" },
        { status: 400 }
      );
    }

    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        conversations: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 6,
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const pageConfig = await db.pageConfig.findFirst({
      include: { knowledgeItems: true },
    });

    const knowledgeText = pageConfig?.knowledgeItems
      .map((k) => `[${k.category || "Info"}] ${k.title}: ${k.content}`)
      .join("\n") || "Kidney Pro ឃីដនី ប្រូ ផលិតផលជំនួយសុខភាពតម្រងនោម ដឹកជញ្ជូនឥតគិតថ្លៃ។";

    const reasonDesc = customReason
      ? `${REASON_LABELS[reason] || reason} - កំណត់ត្រាបន្ថែម: ${customReason}`
      : REASON_LABELS[reason] || reason;

    const recentMsgs = customer.conversations[0]?.messages || [];
    const chatSnippet = recentMsgs
      .reverse()
      .map((m) => `${m.sender === "USER" ? "អតិថិជន" : "AI/ហាង"}: ${m.text}`)
      .join("\n");

    const prompt = `អ្នកគឺជាអ្នកជំនាញផ្នែកលក់ (Sales Expert) ប្រចាំហាងនៅកម្ពុជា។ 
សូមជួយរៀបចំសេចក្តីព្រាងសារ Follow-up មួយយ៉ាងគួរសម ខ្លី ខ្លឹម រាក់ទាក់ និងមានទឹកដមទាក់ទាញ (ជាភាសាខ្មែរ) ផ្ញើទៅកាន់អតិថិជន។

ព័ត៌មានអតិថិជន៖
- ឈ្មោះអតិថិជន៖ ${customer.name}
- ផលិតផលចាប់អារម្មណ៍៖ ${customer.productInterest || "Kidney Pro ឃីដនី ប្រូ"}
- មូលហេតុត្រូវ Follow-up៖ ${reasonDesc}

ប្រវត្តិសារថ្មីៗ (បើមាន)៖
${chatSnippet || "គ្មាន"}

ព័ត៌មានផលិតផល និងប្រូម៉ូសិន៖
${knowledgeText}

គោលការណ៍សំខាន់៖
1. ផ្ដើមដោយការសួរសុខទុក្ខយ៉ាងសមរម្យ។
2. ឆ្លើយតបត្រូវនឹងមូលហេតុ Follow-up (ឧ. បើចាំបើកប្រាក់ខែ សួរនាំឱកាសដើមខែ និងរក្សាកាដូប្រូម៉ូសិនជូន, បើគិតថាតម្លៃថ្លៃ លើកពីតម្លៃប្រយោជន៍សុខភាព ឬជម្រើសកញ្ចប់សន្សំ)។
3. សរសេរតែខ្លឹមសារសារ Follow-up សុទ្ធសាធ កុំដាក់ចំណងជើង ឬពាក្យពន្យល់ក្រៅ។`;

    const ai = getAIProvider();
    const suggestedText = await ai.generateReply({
      systemPrompt: "អ្នកគឺជាជំនួយការលក់អាជីពដែលរៀបចំសារ Follow-up ជាភាសាខ្មែរដ៏ទាក់ទាញ និងសមរម្យបំផុត។",
      knowledgeBase: knowledgeText,
      history: [],
      incomingMessage: prompt,
      contextType: "inbox",
    });

    return NextResponse.json({
      success: true,
      suggestedText: suggestedText.trim(),
    });
  } catch (error: any) {
    console.error("[FollowUp Suggest] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
