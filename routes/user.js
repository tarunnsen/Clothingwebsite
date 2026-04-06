const express = require("express");
const router = express.Router();

const {
  getSignupPage,
  getSigninPage
} = require("../controllers/userController");

// Signup page
router.get("/signup", getSignupPage);

// Signin page
router.get("/signin", getSigninPage);

router.get("/details", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json({
    name: req.user.name,
    email: req.user.email
  });
});

module.exports = router;