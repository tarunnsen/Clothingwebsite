const { adminModel } = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.createAdmin = async (req, res) => {
  try {
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash("Tamonika@2580", salt);

    let user = new adminModel({
      name: "Tarun",
      email: "Techfocus@gmail.com",
      password: hash,
      role: "admin",
    });

    await user.save();

    let token = jwt.sign(
      { email: "tarun@gmail.com", admin: true },
      process.env.JWT_KEY
    );

    res.cookie("token", token);
    res.send("admin created successfully ✅");

  } catch (err) {
    res.send(err.message);
  }
};

exports.loginPage = (req, res) => {
  res.render("Admin_login");
};

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await adminModel.findOne({ email });
  if (!admin) return res.send("Admin not found");

  const valid = await bcrypt.compare(password, admin.password);

  if (valid) {
    const token = jwt.sign(
      { email: admin.email, admin: true },
      process.env.JWT_KEY
    );

    res.cookie("token", token);
    res.redirect("/admin/dashboard");
  }
};

exports.logoutAdmin = (req, res) => {
  res.cookie("token", "");
  res.redirect("/admin/login");
};

exports.dashboard = (req, res) => {
  res.render("Admin_dashboard");
};