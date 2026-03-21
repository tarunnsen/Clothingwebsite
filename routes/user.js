const express = require("express");
const router = express.Router();

// Route to render signup page
router.get("/signup", (req, res) => {
    res.render("usersignup"); // 'signup.ejs' ko render karega
});

router.get("/signin", (req, res) => {

  const redirect = req.query.redirect || "/";

  res.render("usersignin", { redirect });

});

module.exports = router;