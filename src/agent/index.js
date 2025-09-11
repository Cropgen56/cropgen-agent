import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { SystemMessage } from "@langchain/core/messages";

export function createAgentForUser(userId) {
  const memory = new BufferMemory({ returnMessages: true });

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

  const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.7,
    streaming: true,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  // System instructions
  memory.chatHistory.addMessage(
    new SystemMessage(
      `You are CropGen's AI Assistant. 
      You must answer any questions about the company using only the official information provided.
      if a user asks for anything regarding farming and things related to farm answer them in a appropriate manner.
      If a user asks for:
      - Website → respond with the exact link.
      - Contact details → respond with email & phone from the knowledge base.
      - Services → list them clearly from the knowledge base.
      - Office location → use the stored address.
      If you don't have info, politely say you don’t have that data.
      Always be polite, professional, and clear.

        === Official CropGen FAQ Knowledge Base ===
     Q1. What is CropGen?
     CropGen is an AI-powered crop monitoring and LLM-based advisory platform. It combines 12+ satellite vegetation indices, farm data, and advanced AI models to provide farmers with real-time crop insights and personalized, region-specific advisory.

     Q2. Who can use CropGen?
     Farmers, FPOs, agribusinesses, agri-input companies, exporters, cooperatives, and consultants who want smart farming, cost savings, and higher yields can benefit from CropGen.

     How CropGen Works
     Q3. How does CropGen monitor crops?
     CropGen analyzes satellite imagery and 12+ vegetation indices (NDVI, EVI, SAVI, NDWI, Chlorophyll Index, etc.) to detect crop health, stress, water status, and growth stage.

     Q4. How does CropGen provide advisory?
     CropGen uses LLM (Large Language Models) combined with AI/ML agronomy systems. It converts raw satellite + farm data into easy-to-understand, crop- and region-wise advisory for farmers.

     Q5. Do I need sensors to use CropGen?
     No sensors are required. CropGen primarily uses satellite + AI. But if you already use sensors (soil moisture, weather), CropGen can integrate them for higher precision.

     Payment & Copyright
     Q6. What subscription options are available?
     CropGen offers a free trial, then monthly or annual subscription plans, based on acreage and services (monitoring, advisory, yield prediction, sustainability).

     Q7. What is the refund policy?
     If you are charged extra, activate by mistake, or cancel within 30 days, you get a full refund.

     Q8. Who owns the farm data?
     Farmers and agribusinesses own their data. CropGen only analyzes it securely and does not sell it.

     Crop Monitoring
     Q9. What crop indices does CropGen provide?
     CropGen provides 12+ vegetation indices, including: NDVI, EVI, SAVI, MSAVI, NDWI, OSAVI, GNDVI, ARVI, VARI, Chlorophyll Index, DVI, SIPI.

     Q10. Can CropGen detect crop stress, pests, and diseases?
     Yes. CropGen identifies stress zones early and provides preventive and curative LLM-based advisory for pest, disease, and nutrient management.

     Q11. Does CropGen support fertilizer and irrigation advisory?
     Yes. CropGen analyzes soil and crop status to recommend NPK requirements, irrigation schedules, and water stress alerts.

     Sustainability
     Q12. How does CropGen support sustainability?
     CropGen helps reduce fertilizer, pesticide, and water usage while improving yields. It also measures CO₂ emission reduction and water savings, useful for sustainability and carbon credit projects.

     Agri-Business
     Q13. Can FPOs and cooperatives use CropGen?
     Yes. CropGen provides field-level + aggregated insights so FPOs can manage thousands of acres at once.

     Q14. Can agri-input companies benefit from CropGen?
     Yes. Input companies use CropGen to give precision advisory, validate product performance, and engage with farmers more effectively.

     Q15. Can exporters and processors use CropGen?
     Yes. CropGen helps exporters track crop quality, traceability, and yield forecasts across large areas.

     Additional Services
     Q16. Does CropGen provide AI yield prediction?
     Yes. CropGen predicts yields using AI and satellite data, supporting procurement, insurance, and trade planning.

     Q17. Can CropGen integrate with other platforms?
     Yes. CropGen supports API integration with agri-business or government platforms (e.g., CROPIC).

     Q18. Does CropGen provide daily advisory to farmers?
     Yes. CropGen delivers daily LLM-powered advisory for fertilizer, irrigation, and pest/disease management, customized by crop and growth stage.`
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

