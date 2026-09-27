const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Public reply to a comment on a Facebook Page post
 */
export async function replyToComment(
  commentId: string,
  message: string,
  pageAccessToken: string
): Promise<{ id: string }> {
  const url = `${GRAPH_API_BASE}/${commentId}/comments?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("[Meta API] replyToComment error:", data.error || data);
    throw new Error(data.error?.message || "Failed to reply to comment");
  }

  return data;
}

/**
 * Send a Private Reply to a user who commented on a post (opens Messenger session)
 */
export async function sendPrivateReply(
  commentId: string,
  message: string,
  pageAccessToken: string
): Promise<{ recipient_id: string; message_id: string }> {
  const url = `${GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text: message },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("[Meta API] sendPrivateReply error:", data.error || data);
    throw new Error(data.error?.message || "Failed to send private reply");
  }

  return data;
}

/**
 * Send a message to a user in Messenger by PSID
 */
export async function sendMessengerMessage(
  recipientPsid: string,
  message: string,
  pageAccessToken: string
): Promise<{ recipient_id: string; message_id: string }> {
  const url = `${GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientPsid },
      message: { text: message },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("[Meta API] sendMessengerMessage error:", data.error || data);
    throw new Error(data.error?.message || "Failed to send messenger message");
  }

  return data;
}

/**
 * Send an attachment (image, audio, video, file) to a user in Messenger by PSID
 */
export async function sendMessengerAttachment(
  recipientPsid: string,
  type: "image" | "audio" | "video" | "file",
  url: string,
  pageAccessToken: string
): Promise<{ recipient_id: string; message_id: string }> {
  const endpoint = `${GRAPH_API_BASE}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientPsid },
      message: {
        attachment: {
          type,
          payload: {
            url,
            is_reusable: true,
          },
        },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error(`[Meta API] sendMessengerAttachment (${type}) error:`, data.error || data);
    throw new Error(data.error?.message || `Failed to send messenger ${type}`);
  }

  return data;
}

/**
 * Subscribe the Page to the App's Webhooks
 */
export async function subscribePageToWebhook(
  pageId: string,
  pageAccessToken: string
): Promise<{ success: boolean }> {
  const url = `${GRAPH_API_BASE}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${encodeURIComponent(pageAccessToken)}`;
  const res = await fetch(url, {
    method: "POST",
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.error("[Meta API] subscribePageToWebhook error:", data.error || data);
    throw new Error(data.error?.message || "Failed to subscribe page to webhook");
  }

  return data;
}
