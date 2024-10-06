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
        const response = result.response.text();
        if (response) {
          bot.sendMessage(chatId, response, {
            parse_mode: "Markdown",
          });
        } else {
          bot.sendMessage(chatId, "Please Try Again Later");
        }
      } catch (error) {
        bot.sendMessage(chatId, "bot is currently down");
      }
    }
    generateText(chatId, messageText);
  }
});
