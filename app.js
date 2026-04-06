const express = require("express");
const session = require("express-session");
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

const app = express();

// ✅ Trust proxy (IMPORTANT for Render / production)
app.set("trust proxy", 1);

// ======================
// 🔧 GLOBAL MIDDLEWARES
// ======================

app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// Static files
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// 🔐 SESSION CONFIG (FIXED)
// ======================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,        
      sameSite: "none",   
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ======================
// 🔑 PASSPORT (FIXED)
// ======================

app.use(passport.initialize());
app.use(passport.session());

// ======================
// 🔁 AUTH REDIRECT MIDDLEWARE (CLEAN)
// ======================

app.use((req, res, next) => {
  const isStaticFile = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/);

  const needsAuthRoute =
    req.path.startsWith("/cart") ||
    req.path.startsWith("/checkout");

  if (!req.user && needsAuthRoute && !isStaticFile) {
    return res.redirect(
      `/users/signin?redirect=${encodeURIComponent(req.originalUrl)}`
    );
  }

  next();
});

// ======================
//  VIEW ENGINE
// ======================

app.set("view engine", "ejs");

// ======================
//  ROUTES
// ======================

app.use("/", require("./routes"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/product", require("./routes/product"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));

// ======================
//  DEBUG ROUTES (DEV ONLY)
// ======================

if (process.env.NODE_ENV !== "production") {
  const expressListRoutes = require("express-list-routes");
  expressListRoutes(app);
}

// ======================
//  GLOBAL ERROR HANDLER
// ======================

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).send("Something went wrong!");
});

// ======================
//  SERVER START
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});