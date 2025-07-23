const { createClient } = require("redis");
require("dotenv").config();

// ❌ NO legacyMode
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    tls: process.env.REDIS_USE_TLS === "true" ? {} : undefined,
  },
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis Client Connected");
  } catch (err) {
    console.error("❌ Redis Connection Error:", err);
  }
})();

module.exports = redisClient;
