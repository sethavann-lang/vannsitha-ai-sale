export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface GenerateReplyOptions {
  systemPrompt: string;
  knowledgeBase: string;
  history: ChatMessage[];
  incomingMessage: string;
  contextType: "comment" | "inbox";
}

export interface AIProvider {
  name: string;
  generateReply(options: GenerateReplyOptions): Promise<string>;
}
