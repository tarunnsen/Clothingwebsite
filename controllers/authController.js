const passport = require("passport");

// Start Google OAuth
exports.googleAuth = (req, res, next) => {
  const redirectURL = req.query.redirect || "/";

  console.log("🔁 Passing redirect in OAuth state:", redirectURL);

  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    state: redirectURL
  })(req, res, next);
};

// Google Callback
exports.googleCallback = (req, res) => {
  try {
    let redirectURL = req.query.state || "/";

    // 🔒 security (important)
    if (!redirectURL.startsWith("/")) {
      redirectURL = "/";
    }

    console.log("✅ Redirecting user to:", redirectURL);

    res.redirect(redirectURL);

  } catch (err) {
    console.error("Redirect error:", err);
    res.redirect("/");
  }
};

// Logout
exports.logoutUser = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
    }

    req.session.destroy(() => {
      res.redirect("/");
    });
  });
};