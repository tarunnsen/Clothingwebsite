const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { userModel } = require("../models/user");
const passport = require("passport");
require("dotenv").config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
  },
  async function (accessToken, refreshToken, profile, done) {
    try {
      console.log("🔹 Google Profile:", profile);

      let user = await userModel.findOne({ email: profile.emails[0].value });

      if (!user) {
        user = new userModel({
          name: profile.displayName,
          email: profile.emails[0].value,
        });

        await user.save();
        console.log("✅ New user saved:", user.email);
      } else {
        console.log("✅ Existing user found:", user.email);
      }

      return done(null, user);
    } catch (err) {
      console.error("❌ Google Auth Error:", err);
      return done(err, null);
    }
  }
));

// 🔐 Session Management
passport.serializeUser(function (user, done) {
  console.log("🔐 Serializing User ID:", user._id);
  done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
  try {
    const user = await userModel.findById(id);

    if (!user) {
      console.warn("⚠️ User not found in DB during deserialize");
      return done(null, false); // ✅ Important: false instead of throwing error
    }

    console.log("🔓 Deserialized User:", user.email);
    done(null, user);
  } catch (err) {
    console.error("❌ Deserialize Error:", err);
    done(err, null);
  }
});

module.exports = passport;
