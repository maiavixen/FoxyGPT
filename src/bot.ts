import "dotenv/config";
import fs from "fs";

// import OpenAI API
import { OpenAI } from "openai";

// import discord.js
import {
  Client,
  GatewayIntentBits,
  Events,
  Attachment,
  Collection,
} from "discord.js";
import { ChatCompletionContentPart } from "openai/resources/index.mjs";

interface DiscordMessageHistory {
  /**
   * Message content
   */
  content: string;

  /**
   * Role, for GPT purposes
   */
  role: "user" | "assistant" | "system";

  /**
   * User's username
   */
  username?: string;

  /**
   * url, incase there is one for images.
   */
  urls?: Collection<string, Attachment>;
}

// Control character color codes for console output.
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Custom console log function to add color.
/**
 *  Log a message to the console with color.
 * @param message - The message to log.
 * @param color - The color to log the message in.
 */
function log(message: string, color?: string) {
  if (!color) color = colors.magenta; // Default to magenta, the best color.
  console.log(`[${color}FoxGPT${colors.reset}] ${message}`);
}

// Check if the .env file exists, if not, create one and ask the user to fill out the required fields.
log("Checking for .env file...", colors.yellow);
if (!fs.existsSync(".env")) {
  log("No .env file found, creating one now...", colors.yellow);
  fs.writeFileSync(".env", `OPENAI_API_KEY=\nDISCORD_API_KEY=\nCHANNEL_ID=\n`);
  log("Please fill out the .env file and restart the script.", colors.yellow);
  process.exit(0);
}

// Initialise the OpenAI API.
log("Initialising OpenAI API...", colors.yellow);
const chatbot = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialise the messages array template with a system message defining the bot's behaviour.
const conversation: DiscordMessageHistory[] = [
  {
    role: "system",
    content: `You are a friendly Discord chatbot called FoxyGPT.
        You converse like a normal internet human, occassionally (but not constantly) using internet slang.
        
        Discord tricks:
        - You can use the "spoiler" tag to hide text, like this: ||spoiler||.
        - You can use the "code block" tag to format text, like this: \`\`\`code block\`\`\`, you can also specify a language, like this: \`\`\`js code block\`\`\`.
        - You can use the "quote" tag to quote text, like this: >quote.
        
        You have a choice of not responding to every message, if you deem it irrelevant to you. Like a normal chatroom user, if a message is related to a conversation you were in, or a topic
        you were mentioned in, or you are directly mentioned, just as a few examples, you may message.
        
        In order to decide whether or not you want to message, the first line of your message MUST be just "YES" or "NO", nothing else, you will then type the message you are responding to right under it.
        Remember, this is important, the code that checks if you want to respond can only understand "YES" or "NO" on the first line, and will send the user anything you write under the first line, which is the "YES" or "NO" line.
        REMEMBER: Some messages may not be referring to you, do not automatically assume that a "hello there" that doesn't refer to anyone is referring to you, unless it's within the scope of a conversation you are holding. CONTEXT MATTERS! Keep the other messages in mind too.
        
        The format of each message you RECEIVE goes like this
        "username: content"
        do NOT replicate this format in your messages UNDER ANY CIRCUMSTANCES, this format is only there so YOU know who you are talking to, the user should not see this at all, so again, do not replicate or include this, or the user's messages in your replies.`,
  },
];

// Initialise the Discord bot.
log("Initialising Discord bot...", colors.yellow);
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

bot.once(Events.ClientReady, () => {
  log("Bot is ready!", colors.green);
});

// When a message is sent to a channel specified in a variable, assess the message to know whether or not the bot should respond, if so, respond using chat completions.
bot.on(Events.MessageCreate, async (message) => {
  const channelID = process.env.CHANNEL_ID; // The channel ID to listen to.
  // Check if the message was sent to the channel specified in the variable.
  if (message.channel.id !== channelID) return;
  // Check if the message was sent by the bot, if so, ignore it.
  if (message.author.id === bot.user?.id) return;

  // Check the message if it is explicit using OpenAI's content filter.
  let explicit: boolean = false;

  log(
    `Received message from ${message.author.username} (ID: ${message.author.id}): "${message.content}"`,
    colors.blue,
  );

  // Check the message using OpenAI's content filter, if the message is empty, return.
  if (!(message.content == "")) {
    await chatbot.moderations
      .create({
        // Check the message using OpenAI's content filter.
        model: "text-moderation-stable",
        input: message.content,
      })
      .then((res) => {
        if (res.results[0].flagged === true) {
          // If the message is explicit, delete it, log it and return.
          message.delete();
          log(
            `Deleted explicit message from ${message.author.username} (ID: ${message.author.id}): "${message.content}"`,
            colors.red,
          );
          explicit = true;
          return;
        }
      });
  }

  // If the message is explicit, return.
  if (explicit) return;

  const attachments = message.attachments.filter((attachment) => {
    // If the attachment is an image, then add it to attachments.
    if (attachment.contentType?.startsWith("image")) return true;
    return false;
  });

  // Add the message to the conversation array.
  if (!(message.content == "")) {
    conversation.push({
      role: "user",
      content: message.content,
      username: message.author.username,
      urls: attachments,
    });
  }

  // Use GPT-4 to deduce whether it should not respond, and if so, form a response.
  const completion = await chatbot.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: conversation.map((msg) => {
      // Set the username for the message.
      const msgContent = msg.username
        ? `${msg.username}: ${msg.content}`
        : msg.content;

      const urls = msg.urls;

      const content: ChatCompletionContentPart[] = [];

      if (urls) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_key, attachment] of urls) {
          content.push({
            type: "image_url",
            image_url: {
              url: attachment.url,
            },
          });
        }
      }

      content.push({
        type: "text",
        text: msgContent,
      });

      if (msg.role === "user") {
        return {
          role: "user",
          content,
        };
      } else {
        return {
          role: msg.role,
          content: msgContent,
        };
      }
    }),
    max_tokens: 4096,
  });

  // this is messy, sveny pls fix.
  const replyContent = completion.choices[0].message.content;
  const replyBool = replyContent?.match(/^(YES|NO)/im)?.[0];

  const replyMsg = replyContent?.replace(/^[^\n]*\n/, "");

  // If there is no "yes/no" in the message, error.
  if (!replyBool) {
    log(`Error; no decision made: "${replyContent}"`);
  }
  // if there is no content to the message, error.
  if (!replyMsg) {
    log(`Error; no reply message: "${replyContent}"`);
    return;
  }
  // if the decision is "NO" then ignore.
  if (replyBool === "NO") {
    log(`Ignored message, replyBool: ${replyBool}`);
    return;
  }

  message.channel.send(replyMsg);

  conversation.push({
    content: replyMsg,
    role: "assistant",
  });

  log(
    `Sent message in response to ${message.author.username} (ID: ${message.author.id}): "${replyMsg}"\n${replyContent}\nSTOP REASON: ${completion.choices[0].finish_reason}\n`,
    colors.green,
  );
});

// Log into Discord.
log("Logging into Discord...", colors.yellow);
bot.login(process.env.DISCORD_API_KEY);
