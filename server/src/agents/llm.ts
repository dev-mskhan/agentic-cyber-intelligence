import { ChatGroq } from "@langchain/groq";
import env from "../config/env.js";

export const llm = new ChatGroq({
  apiKey: env.geminiApiKey,
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
  maxRetries: 3,
});
