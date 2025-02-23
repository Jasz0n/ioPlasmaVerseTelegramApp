import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// ✅ Temporary store for active tokens
const tempTokens = new Map<string, number>(); // { token: expirationTime }

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// ✅ Function to escape special characters for Telegram MarkdownV2
function escapeMarkdownV2(text: string) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, "\\$&"); // ✅ Escape Telegram reserved characters
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface ChatAdministrator {
  user: TelegramUser;
  status: string; // e.g., 'administrator', 'creator'
}

// ✅ Helper function to check if user is an admin
async function getUserAdminStatus(chatId: number, userId: number) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatAdministrators?chat_id=${chatId}`;
    const response = await axios.get<{ result: ChatAdministrator[] }>(url);
    const admins = response.data.result; // ✅ List of administrators

    console.log("🔹 Admin List Response:", admins);

    const isAdmin = admins.some((admin) => admin.user.id === userId);
    const isFounder = admins.some((admin) => admin.status === "creator" && admin.user.id === userId);

    return { isAdmin, isFounder };
  } catch (error) {
    console.error("❌ Error fetching admin list:", error);
    return { isAdmin: false, isFounder: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    console.log("📩 Incoming Telegram update:", update);

    // ✅ Validate the incoming update
    if (!update || !update.message || !update.message.text) {
      console.error("❌ Bad Request: Missing or malformed update object.");
      return NextResponse.json({ status: "OK" });
    }

    // ✅ Extract Telegram data
    const chatId = update.message.chat.id;
    const userId = update.message.from?.id || "";
    const username = update.message.from?.first_name || "User";
    const messageText = update.message.text.trim();
    const chatType = update.message.chat.type;
    const messageThreadId = update.message.message_thread_id || null; // ✅ Extract thread ID if available

    // ✅ Only process the message if it's a `/start` command
    if (!messageText.startsWith("/start")) {
      console.log("❌ Ignoring message as it's not /start.");
      return NextResponse.json({ status: "IGNORED" });
    }

    let groupId: number | null = null;
    let isAdmin = false;
    let isFounder = false;
    let mentionUser = "";

    // ✅ Check if the bot was opened from a group (Extract Params)
    if (messageText.startsWith("/start group_")) {
      const params = messageText.replace("/start group_", "").split("_");
      groupId = Number(params[0]) || null;
      isAdmin = params[2] === "true";
      isFounder = params[4] === "true";

      console.log("🔹 Extracted Data from Start Command:", { groupId, isAdmin, isFounder });
    }

    // ✅ If inside a group, detect admin status
    const isGroup = chatType === "group" || chatType === "supergroup";
    if (isGroup) {
      groupId = chatId;
      mentionUser = `[${escapeMarkdownV2(username)}](tg://user?id=${userId})`;

      // ✅ Get admin status
      const adminStatus = await getUserAdminStatus(chatId, userId);
      isAdmin = adminStatus.isAdmin;
      isFounder = adminStatus.isFounder;
    }

    console.log("🔹 Final Detected User Info:", {
      userId,
      groupId,
      isAdmin,
      isFounder,
      messageThreadId,
    });

    // ✅ Generate a Unique Token with Expiry Time (Valid for 5 Minutes)
    const token = `${userId}-${Date.now()}`;
    const expirationTime = Date.now() + 300000; // 300 seconds (5 min)

    // ✅ Store token in memory
    tempTokens.set(token, expirationTime);

    // ✅ Generate Login URL with Token
    const frontendUrl = "https://telegram-app-psi-ashen.vercel.app";
    const loginUrl = `${frontendUrl}/?token=${token}&groupId=${groupId || ""}&userId=${userId}&isAdmin=${isAdmin}&isFounder=${isFounder}`;

    // ✅ Pass Group Data When Redirecting to Private Chat
    const privateChatUrl = `https://t.me/ioPlasmaVerseBot?start=group_${groupId}_admin_${isAdmin}_founder_${isFounder}`;

    // ✅ Escape MarkdownV2 text
    const messageTextFormatted = escapeMarkdownV2(
      isGroup
        ? `🚀 ${mentionUser}, open the bot in **private chat** to access the ioPlasmaVerseApp:\n\n[🔗 Click here to open](tg://user?id=${userId})`
        : `🚀 Click below to Open ioPlasmaVerseApp:`
    );

    // ✅ Send Telegram Message with Correct Button Type
    const inlineKeyboard = isGroup
      ? [[{ text: "🤖 Open in Private Chat", url: privateChatUrl }]]
      : [[{ text: "⚙️ Open ioPlasmaVerseApp", web_app: { url: loginUrl } }]];

    // ✅ Include `message_thread_id` when sending a message to a **channel** or **supergroup forum topic**
    const sendMessagePayload: any = {
      chat_id: chatId,
      text: messageTextFormatted,
      parse_mode: "MarkdownV2",
      reply_markup: { inline_keyboard: inlineKeyboard },
    };

    // ✅ If `message_thread_id` exists, add it to the payload
    if (messageThreadId) {
      sendMessagePayload.message_thread_id = messageThreadId;
    }

    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendMessagePayload),
    });

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("❌ Telegram API Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
