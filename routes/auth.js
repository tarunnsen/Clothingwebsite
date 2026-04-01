const express = require("express");
const router = express.Router();
const passport = require("passport");


// 🚀 Start Google OAuth
router.get("/google", (req, res, next) => {

  try {

    const redirectURL = req.query.redirect || "/";

    console.log("🔁 Passing redirect in OAuth state:", redirectURL);

    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
      state: redirectURL
    })(req, res, next);

  } catch (err) {

    console.error("Google OAuth start error:", err);
    res.redirect("/");

  }

});


router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/users/signin"
  }),
  (req, res) => {

    try {

      const redirectURL = req.query.state || "/";

      console.log("✅ Redirecting user to:", redirectURL);

      res.redirect(redirectURL);

    } catch (err) {

      console.error("Redirect error:", err);
      res.redirect("/");

    }

  }
);


// 🚀 Logout
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