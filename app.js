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
app.set("trust proxy", 1); // Very important for secure cookies behind proxies like Render

// Middleware
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(morgan("dev"));

// Static files
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

// Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis session store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: "session:",
});

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

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Save redirect URL for unauthenticated requests
app.use((req, res, next) => {
  if (
    !req.isAuthenticated?.() &&
    (req.path.startsWith("/product/") ||
     req.path.startsWith("/cart") ||
     req.path.startsWith("/checkout")) &&
    !req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)
  ) {
    redisClient.set(
      `redirect:${req.sessionID}`,
      req.originalUrl,
      "EX",
      300,
      (err) => {
        if (err) console.error("Redis error:", err);
      }
    );
  }
  next();
});

// View engine
app.set("view engine", "ejs");

// Routes
app.use("/", require("./routes"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/product", require("./routes/product"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));

// Route listing (for debugging)
const expressListRoutes = require("express-list-routes");
expressListRoutes(app);

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
