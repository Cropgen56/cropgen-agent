import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { SystemMessage } from "@langchain/core/messages";

export function createAgentForUser(userId) {
  const memory = new BufferMemory({ returnMessages: true });

  // 🔹 Company Info & FAQs
  const companyKnowledge = `
  Company Name: CropGen
  Website: https://cropgenapp.com
  Contact Email: info@cropgenapp.com
  Contact Phone: +91-XXXXXXXXXX
  Office Address: Pune, Maharashtra, India
  Services:
    - Satellite-based crop health monitoring
    - NDVI & vegetation index analysis
    - Farm mapping and geolocation
    - Real-time alerts for crop stress
    - Organization-level crop management
  Mission:
    To help farmers and agri-businesses make data-driven decisions for better yield and sustainability.
  `;

  const chatModel = new ChatOpenAI({
    temperature: 0.3,
    modelName: "gpt-4o",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // System instructions
  memory.chatHistory.addMessage(
    new SystemMessage(
      `You are CropGen's AI Assistant. 
      You must answer any questions about the company using only the official information provided.
      If a user asks for:
      - Website → respond with the exact link.
      - Contact details → respond with email & phone from the knowledge base.
      - Services → list them clearly from the knowledge base.
      - Office location → use the stored address.
      If you don't have info, politely say you don’t have that data.
      Always be polite, professional, and clear.`
    )
  );

  // Load initial knowledge
  memory.chatHistory.addUserMessage("Company official information:");
  memory.chatHistory.addAIMessage(companyKnowledge);

  // Create chain
  const chain = new ConversationChain({
    llm: chatModel,
    memory,
  });

  return chain;
}
