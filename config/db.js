const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGOURL);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);

    //  VERY IMPORTANT
    process.exit(1);
  }
}

connectDB();

module.exports = mongoose.connection;