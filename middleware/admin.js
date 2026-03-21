const jwt = require("jsonwebtoken");
require("dotenv").config();

async function validateAdmin(req, res, next) {
    try {

        let token = req.cookies.token;

        if (!token) {
            return res.redirect("/admin/login");
        }

        let data = jwt.verify(token, process.env.JWT_KEY);

        req.user = data;

        next();

    } catch (err) {

        console.error("Admin Auth Error:", err);
        return res.redirect("/admin/login");

    }
}


// 🔐 Check if user logged in
async function userIsLoggedIn(req, res, next) {

    if (req.isAuthenticated()) {
        return next();
    }

    try {

        const redirectURL = req.originalUrl;

        // session में save करेंगे
        req.session.returnTo = redirectURL;

        console.log(`🔹 Saved redirect URL in session: ${redirectURL}`);

    } catch (err) {

        console.error("Session redirect error:", err);

    }

    return res.redirect("/users/signin");

}

module.exports = { validateAdmin, userIsLoggedIn };