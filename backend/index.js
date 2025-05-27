const express = require("express");
const env = require("dotenv");
const { createClient } = require("redis");
const { QdrantClient } = require("@qdrant/js-client-rest");
const { GoogleGenAI } = require("@google/genai");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const cors = require("cors");
env.config();
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "text-embedding-004",
});

const client = createClient({
  socket: {
    host: "127.0.0.1",
    port: 6379,
  },
});
async function connectRedis() {
  try {
    await client.connect();
    console.log(" Connected to Redis");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
}
connectRedis();

const qdrantclient = new QdrantClient({
  host: "localhost",
  port: 6333,
});
async function ensureCollection() {
  const collections = await qdrantclient.getCollections();
  const exists = collections.collections.some(
    (col) => col.name === "girlfriend-chat"
  );

  if (!exists) {
    await qdrantclient.createCollection("girlfriend-chat", {
      vectors: {
        size: 768,
        distance: "Cosine",
      },
    });
    console.log("Collection created: girlfriend-chat");
  } else {
    console.log(" Collection already exists: girlfriend-chat");
  }
}

ensureCollection();

const elevenlabs = new ElevenLabsClient();

app.get("/", async (req, res) => res.send("Server is running 🚀"));

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const previousRaw = await client.lRange("conv", 0, 4);
    const previousConversations = previousRaw.map((c) => JSON.parse(c));
    const userEmbedding = await embeddings.embedQuery(message);
    const similarResults = await qdrantclient.search("girlfriend-chat", {
      vector: userEmbedding,
      limit: 3,
      with_payload: true,
    });
    const redisContext = previousConversations
      .map(
        (c) =>
          `User: ${c.user.message}\nAI (Mood: ${c.mood}): ${c.aigirlfriend.message}`
      )
      .join("\n");
    const similarContext = similarResults
      .map(
        (item) =>
          `User: ${item.payload.userMessage}\nAI (Mood: ${item.payload.mood}): ${item.payload.aiMessage}`
      )
      .join("\n");
    const prompt = `
You are a moody and emotional AI girlfriend. You respond to the user emotionally and naturally, sometimes showing mood swings.
Base your current mood on the recent chat history and the message. Don't ask about your mood — decide it yourself.

Always respond strictly in this JSON format:
{
  "answer": "your reply as a girlfriend",
  "mood": "your current mood"
}

Recent Conversation:
${redisContext}

Similar Past Chats:
${similarContext}

User: "${message}"
`;
    console.log(" Prompt to AI:", prompt);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText = response.text;
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error(" Invalid JSON from Gemini:", cleaned);
      return res.status(500).json({ error: "AI response invalid format" });
    }
    const audio = await getAudioResponse(parsed.answer);
    const base64Audio = audio.toString("base64");
    const conversation = {
      user: {
        message: message,
      },
      aigirlfriend: {
        message: parsed.answer,
      },
      mood: parsed.mood,
    };
    console.log("New Conversation:", conversation);
    await client.lPush("conv", JSON.stringify(conversation));
    await client.lTrim("conv", 0, 4);

    await qdrantclient.upsert("girlfriend-chat", {
      points: [
        {
          id: Date.now(),
          vector: userEmbedding,
          payload: {
            userMessage: message,
            aiMessage: parsed.answer,
            mood: parsed.mood,
          },
        },
      ],
    });
    res.json({
      message: parsed.answer,
      mood: parsed.mood,
      audio: base64Audio,
    });
  } catch (err) {
    console.error(" Chat Error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

const getAudioResponse = async (text) => {
  try {
    const response = await elevenlabs.textToSpeech.convert(
      "21m00Tcm4TlvDq8ikWAM",
      {
        text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.5,
          use_speaker_boost: true,
        },
      }
    );

    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("❌ Error generating audio:", error);
    return null;
  }
};

app.listen(5000, () => {
  console.log(" Server is running on http://localhost:5000");
});
