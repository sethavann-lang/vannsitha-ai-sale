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
        { error: "GEMINI_API_KEY មិនទាន់ត្រូវបានកំណត់ឡើយ" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const topic = (body.topic || "").trim();
    const tone = body.tone || "HEALTH_TIP"; // HEALTH_TIP, PRODUCT_BENEFIT, TESTIMONIAL, PROMOTION
    const audience = body.audience || "ទូទៅ";

    // Fetch Knowledge Base items to inform the generation
    const knowledgeItems = await prisma.knowledgeItem
      .findMany({
        select: { title: true, category: true, content: true },
        take: 8,
      })
      .catch(() => []);

    const knowledgeSummary = knowledgeItems
      .map((k) => `- ${k.title}: ${k.content}`)
      .join("\n");

    let toneInstruction = "";
    switch (tone) {
      case "PRODUCT_BENEFIT":
        toneInstruction = "ផ្តោតលើអត្ថប្រយោជន៍ និងគុណសម្បត្តិពិសេសរបស់ Kidney Pro ឃីដនី ប្រូ ក្នុងការជួយដល់សុខភាពតម្រងនោម ផ្លូវទឹកនោម បំបាត់នោមញឹក នោមក្រហាយ ចុកចង្កេះ។";
        break;
      case "TESTIMONIAL":
        toneInstruction = "សរសេរជាទម្រង់រៀបរាប់បទពិសោធន៍ពិត ឬរឿងរ៉ាវរបស់អតិថិជនដែលធ្លាប់ពិបាកចិត្តដោយសារបញ្ហាតម្រងនោម ហើយទទួលបានភាពធូរស្បើយស្រឡះក្រោយប្រើ Kidney Pro។";
        break;
      case "PROMOTION":
        toneInstruction = "ផ្តោតលើការជំរុញការលក់ ប្រូម៉ូសិនពិសេស ការបញ្ចុះតម្លៃ ឬការថែមជូនពិសេស និងការដឹកជញ្ជូនឥតគិតថ្លៃ ២៥ ខេត្ត-ក្រុង។";
        break;
      case "HEALTH_TIP":
      default:
        toneInstruction = "ផ្តោតលើការចែករំលែកចំណេះដឹងសុខភាព គន្លឹះថែរក្សាតម្រងនោម រោគសញ្ញាគួរប្រុងប្រយ័ត្ន រួចភ្ជាប់ទៅកាន់ដំណោះស្រាយ Kidney Pro យ៉ាងទន់ភ្លន់។";
        break;
    }

    const systemInstruction = `
អ្នកគឺជាអ្នកនិពន្ធមាតិកាផ្សព្វផ្សាយជាន់ខ្ពស់ (Expert Facebook Copywriter) សម្រាប់ផលិតផល "Kidney Pro ឃីដនី ប្រូ" (អាហារបំប៉នជំនួយសុខភាពតម្រងនោម និងផ្លូវទឹកនោម)។

=== គោលដៅសរសេរ ===
សរសេរ Caption សម្រាប់ផុសលើ Facebook Page ដែលទាក់ទាញខ្លាំង មានអំណាចបញ្ចុះបញ្ចូល និងជំរុញឱ្យអតិថិជនឆាតចូល Inbox ឬខលកុម្ម៉ង់ទិញ។

=== ទម្រង់ Caption ស្តង់ដារ Facebook ដែលលក់ដាច់ខ្លាំង ===
១. Hook ទាក់ទាញចំណាប់អារម្មណ៍ (១-២ បន្ទាត់ដំបូង ដែលធ្វើឱ្យគេចង់អានបន្ត)
២. បញ្ហាដែលអតិថិជនកំពុងជួបប្រទះ (រោគសញ្ញាដូចជា នោមញឹក នោមក្រហាយ នោមមានក្លិន ចុកចង្កេះ ខ្សោយកម្លាំង...)
៣. ដំណោះស្រាយជាមួយ Kidney Pro (ចំណុចខ្លាំង និងអត្ថប្រយោជន៍)
៤. ការផ្តល់ជូនពិសេស (ហ្វ្រីសេវាដឹកជញ្ជូន ២៥ ខេត្ត-ក្រុង)
៥. Call To Action ច្បាស់លាស់៖
   👉 ទំនាក់ទំនងប្រឹក្សាយោបល់ និងកុម្ម៉ង់ទិញឥឡូវនេះ៖
   Tel: 088 413 1086 / 096 504 9685
   ឬឆាតចូលប្រអប់សារ (Inbox)
៦. Hashtags ពាក់ព័ន្ធ (ឧ. #KidneyPro #សុខភាពតម្រងនោម #នោមញឹក #ជំនួយសុខភាព)

=== ចំណេះដឹងផលិតផល ===
${knowledgeSummary || "Kidney Pro ឃីដនី ប្រូ ជួយសម្រួលការនោម បំបាត់នោមញឹក នោមក្រហាយ គ្រួសតម្រងនោម បំប៉នកម្លាំង"}

=== ច្បាប់នៃការតែង ===
- សរសេរជាភាសាខ្មែររលូន ធម្មជាតិ ងាយយល់ មានសោភ័ណភាព Emojis ត្រឹមត្រូវ មិនរញ៉េរញ៉ៃ។
- ដកឃ្លា និងចុះបន្ទាត់ឱ្យស្រឡះភ្នែកងាយអានតាមទូរស័ព្ទ។
- កុំដាក់ពាក្យថា "នេះជា Caption" ឬក្បាលរឿងនាំមុខឡើយ គឺផ្តល់ជូនតែអត្ថបទ Caption សុទ្ធតែម្តង។
`.trim();

    const prompt = `
សូមជួយតែង Facebook Caption មួយសម្រាប់ប្រធានបទ៖ "${topic || "ការថែរក្សាសុខភាពតម្រងនោម និងដំណោះស្រាយជាមួយ Kidney Pro"}"
ទម្រង់មាតិកា៖ ${toneInstruction}
ក្រុមគោលដៅ៖ ${audience}
`.trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = [
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let caption = "";
    for (const mName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: mName,
          systemInstruction,
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text()?.trim();
        if (text) {
          caption = text;
          break;
        }
      } catch (err: any) {
        console.warn(`[Content Gen] ${mName} error:`, err?.message);
      }
    }

    if (!caption) {
      caption = `តើបងប្អូនកំពុងជួបប្រទះរោគសញ្ញាទាំងនេះមែនទេ?
✅ នោមញឹក | នោមមានក្លិន
✅ ពិបាកនោម | នោមក្រហាយ
✅ គ្រួសក្នុងតម្រងនោម | រលាកតម្រងនោម
✅ ខ្សោយផ្លូវភេទ | រលាកក្រពេញប្រូស្តាត
✅ ខ្សោយសម្ពាធឈាម

ដោះស្រាយបានជាមួយ Kidney Pro ឃីដនី ប្រូ! ជួយឱ្យនោមស្រួល បំបាត់ចុកចង្កេះ និងស្ដារកម្លាំងពីខាងក្នុងមកវិញ។
ធ្លាប់ពិបាកចិត្ត ឥឡូវធូរស្បើយស្រឡះក្នុងខ្លួន!

🚚 កុម្ម៉ង់ថ្ងៃនេះ មានប្រូម៉ូសិន ហ្វ្រីសេវាដឹកជញ្ជូន ២៥ ខេត្ត-ក្រុងជូនភ្លាមៗ!
👉 ទំនាក់ទំនងប្រឹក្សាយោបល់ និងកុម្ម៉ង់ទិញឥឡូវនេះ៖
Tel: 088 413 1086 / 096 504 9685
ឬឆាតចូលប្រអប់សារ (Inbox)

#KidneyPro #សុខភាពតម្រងនោម #នោមញឹក #ជំនួយសុខភាព`;
    }

    return NextResponse.json({
      success: true,
      caption,
    });
  } catch (error: any) {
    console.error("[Content Generate Error]", error);
    return NextResponse.json(
      { error: error?.message || "មានបញ្ហាក្នុងការបង្កើតមាតិកា" },
      { status: 500 }
    );
  }
}
