const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {

  try {

    await mongoose.connect(process.env.MONGOURL);

    console.log("✅ connected to mongodb");

  } catch (err) {

    console.error("❌ MongoDB connection error:", err.message);

  }

}

connectDB();

module.exports = mongoose.connection;