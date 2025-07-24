const express = require("express");
const router = express.Router();
const passport = require("passport");
const redisClient = require("../config/redis");

// Start Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

// Google OAuth Callback
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", async (err, user) => {
    const fallbackURL = "/users/signin"; // fallback route if redirect fails

    if (err || !user) {
      console.error("Google Auth Error:", err || "User not found");

      // Try to redirect back to saved URL from Redis (even on error)
      const redirectKey = `redirect:${req.sessionID}`;
      try {
        const savedURL = await redisClient.get(redirectKey);
        if (savedURL) {
          await redisClient.del(redirectKey);
          return res.redirect(savedURL);
        }
      } catch (e) {
        console.error("Redis error during fallback redirect:", e);
      }

      return res.redirect(fallbackURL);
    }

    const oldSessionID = req.sessionID;

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error("Session regeneration error:", regenErr);
        return res.redirect(fallbackURL);
      }

      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect(fallbackURL);
        }

        try {
          const redirectKey = `redirect:${oldSessionID}`;
          const redirectURL = await redisClient.get(redirectKey);

          if (redirectURL) {
            await redisClient.del(redirectKey);
            console.log("Redirecting to saved URL:", redirectURL);
            return res.redirect(redirectURL);
          }

          return res.redirect("/");
        } catch (e) {
          console.error("Redis fetch error:", e);
          return res.redirect("/");
        }
      });
    });
  })(req, res, next);
});

// Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

module.exports = router;
