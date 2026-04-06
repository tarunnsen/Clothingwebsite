exports.getSignupPage = (req, res) => {
  res.render("usersignup");
};

exports.getSigninPage = (req, res) => {
   const redirect = req.query.redirect
    ? decodeURIComponent(req.query.redirect)
    : "/";

  res.render("usersignin", { redirect });
};