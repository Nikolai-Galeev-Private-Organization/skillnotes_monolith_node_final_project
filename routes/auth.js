const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { seedWelcomeNote } = require("../utils/seedNote");

router.get("/", (req, res) => {
  if (req.isAuthenticated()) return res.redirect("/dashboard");
  res.render("index", { authError: null });
});

router.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/");
  res.render("dashboard", { username: req.user.username });
});

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.render("index", { authError: "Заполните все поля" });
    const exists = await User.findOne({ username });
    if (exists) return res.render("index", { authError: "Пользователь уже существует" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hash, provider: "local" });
    await seedWelcomeNote(user);
    req.login(user, (err) => {
      if (err) throw err;
      res.redirect("/dashboard");
    });
  } catch (err) {
    res.render("index", { authError: err.message });
  }
});

router.post("/login", passport.authenticate("local", { failureRedirect: "/?error=1" }), async (req, res) => {
  await seedWelcomeNote(req.user);
  res.redirect("/dashboard");
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }), async (req, res) => {
  await seedWelcomeNote(req.user);
  res.redirect("/dashboard");
});

router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/auth/github/callback", passport.authenticate("github", { failureRedirect: "/" }), async (req, res) => {
  await seedWelcomeNote(req.user);
  res.redirect("/dashboard");
});

router.use((req, res) => res.status(404).render("404"));

module.exports = router;
