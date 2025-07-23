const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
require("dotenv").config();

async function validateAdmin(req, res, next) {
    try {
        let token = req.cookies.token;
        if (!token) return res.redirect('/admin/login');
        let data = await jwt.verify(token, process.env.JWT_KEY);
        req.user = data;
        next();
    } catch (err) {
        res.send(err.message);
    }
}

async function userIsLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();

    try {
        const redirectKey = `redirect:${req.sessionID}`;
        const redirectURL = req.originalUrl;
        await redisClient.setEx(redirectKey, 300, redirectURL);
        console.log(`🔹 Saved redirect URL: ${redirectURL}`);
    } catch (err) {
        console.error("❌ Redis Error:", err);
    }

    res.redirect("/users/signin");
}

module.exports = { validateAdmin, userIsLoggedIn };
