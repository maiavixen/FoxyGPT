# FoxyGPT

**FoxyGPT** is a concept Discord bot, which has the ability to decide whether or not it wants to respond to a message on Discord, allowing it to be summoned in the chat by addressing it like you would address any human user on Discord, in addition, it is able to recognise that it is within the scope or is relevant to a conversation, and respond when FoxyGPT deems it appropriate to do so.

## How does it work?

It's pretty simple. When a message is sent to a Discord channel, FoxyGPT will first use OpenAI's moderation endpoint to make sure that the message does not have anything explicit, this is to prevent API abuse and consequentially, getting banned from OpenAI's platform. If a message is explicit, it will delete the message from the Discord channel.

It then goes directly into GPT 4 Vision, where it decides if it wants to message or not, and if it does, it will send a reply. GPT 4 Vision allows it to both react, and decide if it wants to react to a message, as well as images.

## How to build?

- Make sure you have [node.js](https://nodejs.org/)
- Install all the dependencies

```sh
npm i
```

- Compile the Typescript code

```sh
npm build
```

## How to run?

After having built the bot:

- Run the bot

```sh
node run start
```

- A new file called `.env` will have been created in the root directory of the project, modify it to add your API keys and your preferred Discord channel ID.

## Goals

- [x] Use OpenAI's API to moderate messages
- ~~[x] Use Google Vision's API to caption images~~
- ~~[ ] Use Google Vision's API to moderate images~~ - Migrated to GPT-4 Vision.
- [x] Replace Google Vision API with GPT-4-Vision preview
- [ ] Easy prompt customisation (it's currently hardcoded)
- [ ] Support for multiple channels
- [ ] Fine tune Discord Arbiter

## **_!!! WARNING !!!_**

This project contains a **LOT** of spaghetti code right now. OpenAI has changed their node.js library quite a lot since I last touched this project, and I made this on a whim. This kind of needs a total recode, at least the logic that handles the GPT-4 chat completion.

For now, this is how it is, and why it stays on it's own branch, for now.

## Another heads up

Considering this is meant to be using the preview of GPT-4 Vision, this may not work for everyone, as AFAIK not everyone has vision access, and it's also quite expensive to run. I wouldn't run this in a busy server overnight unless you set up a limit on the OpenAI platform.
