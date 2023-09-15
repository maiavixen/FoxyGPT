import 'dotenv/config';
import fs from 'fs';

// import OpenAI API
import { OpenAI } from 'openai';

// import discord.js
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';

// import vision
import { vision } from './vision.js';

// Control character color codes for console output.
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Custom console log function to add color.
function log(message: string, color?: string) {
    if(!color) color = colors.magenta; // Default to magenta, the best color.
    console.log(`[${color}FoxGPT${colors.reset}] ${message}`);
}

// Check if the .env file exists, if not, create one and ask the user to fill out the required fields.
log('Checking for .env file...', colors.yellow);
if(!fs.existsSync('.env')) {
    log('No .env file found, creating one now...', colors.yellow);
    fs.writeFileSync('.env', `OPENAI_API_KEY=\nDISCORD_API_KEY=\n`);
    log('Please fill out the .env file and restart the script.', colors.yellow);
    process.exit(0);
}

// Initialise the OpenAI API.
log('Initialising OpenAI API...', colors.yellow);
const chatbot = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialise the messages array template with a system message defining the bot's behaviour.
const conversation: ChatCompletionMessageParam[] = [
    { 
        role: 'system', 
        content: 'You are a friendly Discord chatbot called FoxyGPT. You converse like a normal internet human, occassionally (but not constantly) using internet slang. You are a furry. You don\'t have to respond to every message you see, as another LLM is deciding for you when you should send a response to a message. Images are described using the format [Image description: "description"].',
        name: 'System'
    }
];

// Initialise the Google Cloud Vision API.
log('Initialising Google Cloud Vision API...', colors.yellow);
const vis = new vision('AIzaSyCY8vdXcUDMT3xE9CAGQBRLeggG9tROMVQ', 'affable-ring-399020');

// Initialise the Discord bot.
log('Initialising Discord bot...', colors.yellow);
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

bot.once(Events.ClientReady, () => {
    log('Bot is ready!', colors.green);
});

// When a message is sent to a channel specified in a variable, assess the message to know whether or not the bot should respond, if so, respond using chat completions.
bot.on(Events.MessageCreate, async message => {

    const channelID = '1151959225652756550'; // The channel ID to listen to.
    // Check if the message was sent to the channel specified in the variable.
    if(message.channel.id === channelID) {
        // Check if the message was sent by the bot, if so, ignore it.
        if(message.author.id === bot.user?.id) return;

        // Check the message if it is explicit using OpenAI's content filter.
        let explicit: boolean = false;

        log(`Received message from ${message.author.username} (ID: ${message.author.id}): "${message.content}"`);

        // Check the message using OpenAI's content filter, if the message is empty, return.
        if(!(message.content == '')) {
            await chatbot.moderations.create({ // Check the message using OpenAI's content filter.
                model: 'text-moderation-stable',
                input: message.content
            }).then( res => {
                console.log(res);
                if(res.results[0].flagged === true) {
                    // If the message is explicit, delete it, log it and return.
                    message.delete();
                    log(`Deleted explicit message from ${message.author.username} (ID: ${message.author.id}): "${message.content}"`, colors.red);
                    explicit = true;
                    return;
                }
            });
        }

        // If the message is explicit, return.
        if(explicit) return;

        // Check if the message has an image attached, if so, describe it using Google Cloud Vision.
        if(message.attachments.size > 0) {
            if(message.attachments.first()?.contentType?.startsWith('image')) {
                // Get the image URL.
                const imageURL = message.attachments.first()?.url;

                log(`Image received, describing image: ${imageURL}`);

                if (!imageURL) return;

                // Get the image data.
                const imageData = await fetch(imageURL).then(res => res.blob()).then(blob => blob.arrayBuffer().then(buffer => Buffer.from(buffer).toString('base64'))); // Convert the image to base64.

                // Describe the image.
                const description = await vis.describe(imageData);

                if (!description.predictions[0]) {
                    // If the image could not be described, return.
                    log(`Google could not describe an image sent by ${message.author.username}`, colors.red);
                    conversation.push({ role: 'user', content: `[Image description: "Google could not describe this image"]`, name: message.author.username });
                }

                // Add the description to the conversation array.
                conversation.push({ role: 'user', content: `[Image description: "${description.predictions[0]}"]`, name: message.author.username });

                log(`Google described an image sent by ${message.author.username}: "${description.predictions[0]}"`, colors.green);
            }
        }

        // Add the message to the conversation array.
        if(!(message.content == '')) {
            conversation.push({ role: 'user', content: message.content, name: message.author.username });
        }

        // Use OpenAI completions to deduce if the bot should respond.
        chatbot.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [ {
                role: 'system',
                content: `The following is a snippet of conversation in Discord (up to 5 messages only). You are a Chatbot's decision engine.`,
                name: 'System' 
            },
            ...conversation.slice(-5).map( msg => {
                return {
                    role: msg.role,
                    content: msg.content,
                    name: msg.name,
                };
            }),
            {
                role: 'system',
                content: `
                Your task is to decide whether or not the chatbot should respond to the last of the messages below, as well as it's context (other messages).
                The bot you are deciding whether or not to respond to is called FoxyGPT (also known as Foxy, Fox, GPT, or chatbot).
                You should ideally respond to not only messages directed at it, but also messages that are not directly directed at it, but are still relevant to the conversation.
                Do not inject yourself into the conversation, but do not be afraid to respond to messages that are not directed at you.
                Do not respond to every message, but do not be afraid to respond to messages that are not directed at you.
                If you are not referenced, and the message in which you are not referenced has nothing to do with a conversation the bot was talking about, you should not respond.
                When deciding whether or not to respond, consider the following:
                - Is the message directed at FoxyGPT?
                - Is the message relevant to the conversation?
                - Is the message a question?
                - Is the message a response to a question?
                - Does the message contain an image? (marked with [Image description: "description"])
                
                Once you have decided whether or not FoxyGPT should respond, respond with a "yes" or a "no", aswell as your reasoning.`,
                name: 'System'
        }
        ],
            user: message.author.id
        }).then((classification) => {
            if(classification.choices[0].message.content?.toLowerCase().startsWith('yes')) {
                // If the bot should respond, respond using chat completions.

                // Typing indicator
                message.channel.sendTyping();

                // Send the message to the OpenAI chatbot.
                chatbot.chat.completions.create({
                    model: 'gpt-4',
                    messages: conversation
                }).then((response) => {
                    // Send the response to the channel.
                    message.channel.send(response.choices[0].message.content??='No response.');
                    // Add the response to the conversation array.
                    conversation.push({ role: 'assistant', content: response.choices[0].message.content });

                    log(`FoxyGPT responded to ${message.author.username}'s message: "${message.content}" with: "${response.choices[0].message.content}", response: "${classification.choices[0].message.content}"`, colors.green);
                });
            } else {
                log(`FoxyGPT to not respond to ${message.author.username}'s message: "${message.content}", response: "${classification.choices[0].message.content}"`, colors.red);
            }
        });
    }
});

// Log into Discord.
log('Logging into Discord...', colors.yellow);
bot.login(process.env.DISCORD_API_KEY);
