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
        const result = await model.generateContent(messageText);
        const response = await result.response.text();

        if (response) {
          const splitMessage = (message, chunkSize = 1500) => {
            const messageChunks = [];
            let currentIndex = 0;

            while (currentIndex < message.length) {
              let chunk = message.slice(currentIndex, currentIndex + chunkSize);

              if (currentIndex + chunkSize < message.length) {
                const lastSpaceIndex = chunk.lastIndexOf(" ");
                if (lastSpaceIndex > -1) {
                  chunk = message.slice(
                    currentIndex,
                    currentIndex + lastSpaceIndex
                  );
                  currentIndex += lastSpaceIndex + 1;
                } else {
                  currentIndex += chunkSize;
                }
              } else {
                currentIndex += chunkSize;
              }

              messageChunks.push(chunk);
            }
            return messageChunks;
          };

          const escapedResponse = response;

          const messageChunks = splitMessage(escapedResponse, 1500);

          for (const chunk of messageChunks) {
            await bot.sendMessage(chatId, chunk, {
              parse_mode: "Markdown",
            });
          }
        } else {
          bot.sendMessage(chatId, "Please Try Again Later");
        }
      } catch (error) {
        bot.sendMessage(
          chatId,
          "The bot is currently down. Please try again later."
        );
        console.error("Error in generateText:", error);
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
