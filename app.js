const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").RedisStore;
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const dotenv = require("dotenv");

const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();
require("./config/db");
require("./config/google_auth");
const redisClient = require("./config/redis");

const app = express();

// ✅ Trust proxy is very important on Render
app.set("trust proxy", 1);

// ✅ Middlewares
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(morgan("dev"));
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Redis Session Store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "session:",
});

// ✅ Session Configuration
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "PRODUCTION",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "PRODUCTION" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// ✅ Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ Save Redirect URL (before login)
app.use(async (req, res, next) => {
  if (
    !req.isAuthenticated?.() &&
    (req.path.startsWith("/product/") ||
      req.path.startsWith("/cart") ||
      req.path.startsWith("/checkout")) &&
    !req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)
  ) {
    try {
      await redisClient.set(
        `redirect:${req.sessionID}`,
        req.originalUrl,
        { EX: 300 }
      );
      console.log(`🔁 Saved redirect URL for session ${req.sessionID}: ${req.originalUrl}`);
    } catch (err) {
      console.error("Redis error while saving redirect path:", err);
    }
  }
  next();
});

// ✅ View Engine
app.set("view engine", "ejs");

// ✅ Routes
app.use("/", require("./routes"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/product", require("./routes/product"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));

// ✅ Route Listing for Debug
const expressListRoutes = require("express-list-routes");
expressListRoutes(app);

// ✅ Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
