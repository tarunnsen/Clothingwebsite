const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  googleAuth,
  googleCallback,
  logoutUser
} = require("../controllers/authController");

// Google OAuth start
router.get("/google", googleAuth);

// Google callback (IMPORTANT: passport stays here)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/users/signin"
  }),
  googleCallback
);

// Logout
router.get("/logout", logoutUser);

module.exports = router;