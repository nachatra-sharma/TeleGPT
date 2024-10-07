const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (messageText === "/start") {
    bot.sendMessage(
      chatId,
      "Welcome to my AI bot you can ask your questions here."
    );
  } else {
    async function generateText(chatId, messageText) {
      try {
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: messageText,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.1,
          },
        });
        const response = result.response.text();
        if (response) {
          try {
            const maxMessageLength = 4096;
            let messages = [];

            for (let i = 0; i < response.length; i += maxMessageLength) {
              let chunk = response.slice(i, i + maxMessageLength);

              if (
                chunk.endsWith("_") ||
                chunk.endsWith("*") ||
                chunk.endsWith("`")
              ) {
                const lastSafeIndex = chunk.lastIndexOf(" ", maxMessageLength);
                chunk = chunk.slice(
                  0,
                  lastSafeIndex !== -1 ? lastSafeIndex : maxMessageLength
                );
              }

              messages.push(chunk);
            }
            for (const message of messages) {
              try {
                await bot.sendMessage(chatId, message, {
                  parse_mode: "Markdown",
                });
              } catch (sendError) {
                console.error("Failed to send message:");
                await bot.sendMessage(chatId, message);
              }
            }
          } catch (error) {
            bot.sendMessage(chatId, "Please Try Again Later");
          }
        } else {
          bot.sendMessage(chatId, "Please Try Again Later");
        }
      } catch (error) {
        bot.sendMessage(
          chatId,
          "The bot is currently down. Please try again later."
        );
      }
    }

    generateText(chatId, messageText);
  }
});

// Bind to a port to satisfy Render's requirements
const express = require("express");
const app = express();

const PORT = process.env.PORT || 8001;

app.get("/", (req, res) => {
  res.send("Telegram bot is running");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
