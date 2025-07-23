const express = require("express");
const router = express.Router();
const passport = require("passport");
const redisClient = require("../config/redis");

// 🔹 Start Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", async (err, user) => {
    if (err || !user) {
      console.error("❌ Google Auth Error:", err);
      return res.redirect("/users/login");
    }

    // 🔁 REGENERATE the session to prevent sessionID mismatch
    const oldSessionID = req.sessionID;

    req.session.regenerate((regenErr) => {
      if (regenErr) {
        console.error("❌ Session regeneration error:", regenErr);
        return res.redirect("/users/login");
      }

      // 🔐 Login the user into the regenerated session
      req.logIn(user, async (loginErr) => {
        if (loginErr) {
          console.error("❌ Login error:", loginErr);
          return res.redirect("/users/login");
        }

        try {
          // ✅ Restore any old data if needed (like redirectURL)
          const redirectKey = `redirect:${oldSessionID}`;
          const redirectURL = await redisClient.get(redirectKey);
          if (redirectURL) {
            await redisClient.del(redirectKey);
            console.log("✅ Redirecting to saved URL:", redirectURL);
            return res.redirect(redirectURL);
          }

          return res.redirect("/");
        } catch (e) {
          console.error("❌ Redis error:", e);
          return res.redirect("/");
        }
      });
    });
  })(req, res, next);
});


// 🔹 Logout Route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("❌ Logout error:", err);
    }
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

module.exports = router;
