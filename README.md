# FoxyGPT

**FoxyGPT** is a concept Discord bot, which has the ability to decide whether or not it wants to respond to a message on Discord, allowing it to be summoned in the chat by addressing it like you would address any human user on Discord, in addition, it is able to recognise that it is within the scope or is relevant to a conversation, and respond when FoxyGPT deems it appropriate to do so.

## How to build?

- Install Node.js
- Install all the dependencies
```sh
npm i
```
- Compile the Typescript code (Doesn't work on Windows, see below for steps on Windows)
```sh
tsc
```
-----
### Windows only:
- Compile the Typescript code
```powershell
tsc.cmd
```

## How to run?

After having built the bot:

- Make sure you have [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Run the bot
```sh
node dist/bot.js
```

## Help! I just installed the gcloud CLI and I don't know how to login...

gcloud requires an application default login set up correctly for Application Default Credentials to work. Here's how you can get that working:

- If you haven't, install [gcloud CLI](https://cloud.google.com/sdk/docs/install).
- Aquire new user credentials to use for ADC (Application Default Credentials) (Doesn't work on Windows- see below for steps on Windows)
```sh
gcloud auth application-default login
```

### Windows only

- Aquire new user credentials to use for ADC (Application Default Credentials)
```powershell
gcloud.cmd auth application-default login
```