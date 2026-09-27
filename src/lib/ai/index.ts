import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerType = process.env.AI_PROVIDER || "gemini";

  switch (providerType.toLowerCase()) {
    case "gemini":
    default:
      cachedProvider = new GeminiProvider();
      return cachedProvider;
  }
}

export * from "./types";
export * from "./gemini";
