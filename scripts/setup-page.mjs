import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const pageId = "955747057621489";
const token = "EAAXCz7cbTvABSsF57gFyZBuZCEW8dCf6J8cZCCQAavgnP4bluPfUbLjN3TWnqYkKnD3IjhmAtDGmiH1IoQD1U6q8GZCrg1kJTdhzRrlF1ETF0WMZCfoi44jEmWxMnZC6Y41DpHwWPZAtPWZBQGoTux48j7Dn34g92UPR6t0UeyBYiS5uSZAqen4vfpe3CnyP8pmpgoGvPKRJNFgZDZD";

async function main() {
  console.log("1. Verifying Token with Graph API...");
  const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(token)}`);
  const meData = await meRes.json();
  console.log("Graph API /me response:", meData);

  if (meData.error) {
    console.error("Token invalid:", meData.error);
    return;
  }

  console.log("2. Subscribing Page to App Webhook fields (messages, messaging_postbacks, feed)...");
  const subRes = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${encodeURIComponent(token)}`,
    { method: "POST" }
  );
  const subData = await subRes.json();
  console.log("Subscribed apps response:", subData);

  console.log("3. Upserting PageConfig & Knowledge Base in Supabase Database...");
  const pageConfig = await prisma.pageConfig.upsert({
    where: { pageId },
    update: {
      pageName: meData.name || "Kidney Pro",
      pageAccessToken: token,
      isActive: true,
      autoReplyComment: true,
      privateReplyComment: true,
      autoReplyInbox: true,
      systemPrompt: "អ្នកគឺជាជំនួយការពិគ្រោះយោបល់ និងលក់ផលិតផលប្រចាំផេក (Sales & Support Assistant) ដែលរួសរាយ រាក់ទាក់ និងឆ្លើយតបអតិថិជនជាភាសាខ្មែរបានយ៉ាងត្រឹមត្រូវ គួរសម និងរហ័ស។ ពេលអតិថិជន Comment សូមឆ្លើយតបខ្លីៗ និងប្រាប់ថាបានផ្ញើព័ត៌មានលម្អិតចូល Inbox រួចរាល់។ ពេលនៅក្នុង Messenger សូមពន្យល់ពីគុណប្រយោជន៍ តម្លៃ និងសួរទីតាំងដឹកជញ្ជូនដើម្បីបិទការលក់។",
    },
    create: {
      pageId,
      pageName: meData.name || "Kidney Pro",
      pageAccessToken: token,
      isActive: true,
      autoReplyComment: true,
      privateReplyComment: true,
      autoReplyInbox: true,
      systemPrompt: "អ្នកគឺជាជំនួយការពិគ្រោះយោបល់ និងលក់ផលិតផលប្រចាំផេក (Sales & Support Assistant) ដែលរួសរាយ រាក់ទាក់ និងឆ្លើយតបអតិថិជនជាភាសាខ្មែរបានយ៉ាងត្រឹមត្រូវ គួរសម និងរហ័ស។ ពេលអតិថិជន Comment សូមឆ្លើយតបខ្លីៗ និងប្រាប់ថាបានផ្ញើព័ត៌មានលម្អិតចូល Inbox រួចរាល់។ ពេលនៅក្នុង Messenger សូមពន្យល់ពីគុណប្រយោជន៍ តម្លៃ និងសួរទីតាំងដឹកជញ្ជូនដើម្បីបិទការលក់។",
    },
  });

  // Check if knowledge items exist
  const count = await prisma.knowledgeItem.count({ where: { pageConfigId: pageConfig.id } });
  if (count === 0) {
    await prisma.knowledgeItem.createMany({
      data: [
        {
          pageConfigId: pageConfig.id,
          title: "ព័ត៌មានផលិតផល និងតម្លៃ (Products & Pricing)",
          category: "Product",
          content: "ផលិតផល៖ អាហារបំប៉នសុខភាព Kidney Pro (ជំនួយសុខភាពតម្រងនោម)\n- តម្លៃ ១ កំប៉ុង៖ $25\n- ប្រូម៉ូសិនពិសេស៖ ទិញ ២ កំប៉ុង ថែម ១ កំប៉ុង (សរុប $50)\n- ការដឹកជញ្ជូន៖ ដឹកជញ្ជូនឥតគិតថ្លៃទូទាំងប្រទេស (ភ្នំពេញ ១-២ ថ្ងៃ, តាមខេត្ត ២-៣ ថ្ងៃ)",
        },
        {
          pageConfigId: pageConfig.id,
          title: "អត្ថប្រយោជន៍ និងរបៀបប្រើប្រាស់ (Benefits & Usage)",
          category: "FAQ",
          content: "គុណប្រយោជន៍៖ ជួយទ្រទ្រង់ និងថែទាំសុខភាពតម្រងនោម បន្សាបជាតិពុលក្នុងរាងកាយ សម្រួលដល់ការបត់ជើងតូច។\nរបៀបប្រើ៖ ញ៉ាំ ១ គ្រាប់ ក្រោយអាហារពេលព្រឹក និង ១ គ្រាប់ ក្រោយអាហារពេលល្ងាច។",
        },
      ],
    });
    console.log("Added default Knowledge Items for the Page!");
  }

  console.log("Setup complete! PageConfig ready:", pageConfig.id);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
