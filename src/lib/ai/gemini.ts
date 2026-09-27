import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, GenerateReplyOptions } from "./types";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName = "gemini-3.5-flash-lite") {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = modelName;
  }

  async generateReply(options: GenerateReplyOptions): Promise<string> {
    const { systemPrompt, knowledgeBase, history, incomingMessage, contextType } = options;

    const fullSystemInstruction = `
${systemPrompt}

=== ព័ត៌មានទំនិញ និងសេវាកម្ម (KNOWLEDGE BASE) ===
${knowledgeBase || "គ្មានព័ត៌មានបន្ថែម"}

=== ច្បាប់ឆ្លើយតបពិសេស (RULES) ===
- ប្រភេទការសន្ទនាបច្ចុប្បន្ន: ${contextType === "comment" ? "ឆ្លើយតប Comment លើ Facebook Post" : "ឆ្លើយតបសារក្នុង Messenger Inbox"}
- ប្រសិនបើជា Comment: សូមឆ្លើយតបឲ្យខ្លី គួរសម មិនលើសពី ២-៣ ជួរ ហើយប្រាប់ថា Page បានផ្ញើព័ត៌មានលម្អិតចូលក្នុង Inbox រួចរាល់ហើយ។
- ប្រសិនបើជា Messenger: អាចផ្តល់ព័ត៌មានលម្អិត តម្លៃ ប្រូម៉ូសិន និងសួរនាំពីទំហំ/ពណ៌ ឬស្នើសុំលេខទូរស័ព្ទ និងទីតាំងដឹកជញ្ជូនដើម្បីបិទការលក់។
- ឆ្លើយតបជាភាសាខ្មែរគួរសម រាក់ទាក់ (ឧ. ចាស/បាទ បង, អរគុណបង)។
- ឆ្លើយតែអ្វីដែលមានក្នុង Knowledge Base ខាងលើប៉ុណ្ណោះ។ បើគ្មានព័ត៌មានច្បាស់លាស់ សូមសុំការអភ័យទោស និងប្រាប់ថានឹងឲ្យបុគ្គលិកផ្ទាល់ទាក់ទងមកបន្ថែម។
`.trim();

    // Format chat history for Gemini
    const contents = [
      ...history.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
      {
        role: "user" as const,
        parts: [{ text: incomingMessage }],
      },
    ];

    // Ultra-fast model sequence
    const candidateModels = [this.modelName, "gemini-3.8-flash"];

    for (const mName of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: mName,
          systemInstruction: fullSystemInstruction,
        });

        const result = await model.generateContent({ contents });
        const response = await result.response;
        const text = response.text().trim();
        if (text) return text;
      } catch (err: any) {
        console.warn(`[Gemini] ${mName} error: ${err.message || err}`);
      }
    }

    // Graceful fallback response
    if (contextType === "comment") {
      return "សួស្តីបង! អរគុណសម្រាប់ការចាប់អារម្មណ៍ ខាងប្អូនបានផ្ញើព័ត៌មានលម្អិត និងតម្លៃជូនក្នុង Messenger រួចរាល់ហើយចាស/បាទ! សូមបងពិនិត្យមើលប្រអប់សារណា៎។";
    } else {
      return "សួស្តីបង! អរគុណសម្រាប់ការទាក់ទងមកកាន់ Kidney Pro។ តើបងចង់ដឹងពីតម្លៃ ឬពិគ្រោះបញ្ហាសុខភាពតម្រងនោមដែរចាស/បាទ? ខាងប្អូនត្រៀមខ្លួនជួយជានិច្ច!";
    }
  }
}
