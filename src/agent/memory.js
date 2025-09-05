import { RedisChatMessageHistory } from "langchain/stores/message/redis";

const memory = new BufferMemory({
  chatHistory: new RedisChatMessageHistory({
    sessionId: userId,
    config: { url: "redis://localhost:6379" },
  }),
});
