const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();
const discourseData = require("./discourse_data.json");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    // 🔍 Match relevant Discourse links
    const relevantLinks = discourseData
      .filter((item) =>
        item.content.toLowerCase().includes(question.toLowerCase())
      )
      .slice(0, 2)
      .map((item) => ({
        url: item.url,
        text: item.title,
      }));

    // 🧠 Ask GPT
    const prompt = `You are a helpful TA for IITM's Tools in Data Science course. Answer this question clearly:\n\n"${question}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [{ role: "user", content: prompt }],
    });

    const answer = response.choices[0].message.content;

    return res.json({
      answer,
      links: relevantLinks,
    });
  } catch (error) {
    console.error("❌ Full Error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
