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

module.exports = router;