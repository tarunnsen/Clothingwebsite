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


// ✅ Trust proxy (important for deployment)
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

app.use(morgan("dev"));

app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());




app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// ======================
// 🔐 SESSION CONFIG
// ======================

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: false, // development में false
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// ======================
// 🔑 PASSPORT
// ======================

app.use(passport.initialize());
app.use(passport.session());


// ======================
// 🔁 REDIRECT SAVE MIDDLEWARE
// ======================

app.use((req, res, next) => {

  const isStaticFile = req.path.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/);

  const needsAuthRoute =
    req.path.startsWith("/product/") ||
    req.path.startsWith("/cart") ||
    req.path.startsWith("/payment/checkout");

  if (!req.user && needsAuthRoute && !isStaticFile) {

    req.session.returnTo = req.originalUrl;

    console.log("🔁 Saved redirect URL in session:", req.originalUrl);

  }

  next();
});


// ======================
// 🎨 VIEW ENGINE
// ======================

app.set("view engine", "ejs");


// ======================
// 🧭 ROUTES
// ======================

app.use("/", require("./routes"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/user"));
app.use("/admin", require("./routes/admin"));
app.use("/product", require("./routes/product"));
app.use("/payment", require("./routes/payment"));
app.use("/order", require("./routes/order"));


// ======================
// 📜 DEBUG ROUTES LIST
// ======================

const expressListRoutes = require("express-list-routes");
expressListRoutes(app);


// ======================
// 🚀 SERVER START
// ======================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});