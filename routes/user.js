const express = require("express");
const router = express.Router();

// Route to render signup page
router.get("/signup", (req, res) => {
    res.render("usersignup"); // 'signup.ejs' ko render karega
});

router.get("/signin", (req, res) => {
    res.render("usersignin"); // 'log in.ejs' ko render karega
});

module.exports = router;