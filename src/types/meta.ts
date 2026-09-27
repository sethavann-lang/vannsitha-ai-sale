// Meta Webhook & Graph API Types

export interface WebhookEntry {
  id: string; // Page ID
  time: number;
  messaging?: MessagingEvent[];
  changes?: FeedChangeEvent[];
}

export interface MessagingEvent {
  sender: { id: string }; // User's PSID
  recipient: { id: string }; // Page ID
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{
      type: string;
      payload: { url?: string };
    }>;
  };
  postback?: {
    title: string;
    payload: string;
  };
}

export interface FeedChangeEvent {
  field: string; // "feed"
  value: {
    item: string; // "comment", "status", "photo", etc.
    verb: string; // "add", "edit", "remove"
    comment_id?: string;
    post_id?: string;
    parent_id?: string;
    created_time?: number;
    message?: string; // Text of the comment
    from?: {
      id: string; // User ID
      name?: string;
    };
  };
}

export interface WebhookPayload {
  object: "page";
  entry: WebhookEntry[];
}
