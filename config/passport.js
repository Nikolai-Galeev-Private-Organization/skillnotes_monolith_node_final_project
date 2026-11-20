const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username, provider: "local" });
      if (!user) return done(null, false, { message: "Неверное имя пользователя или пароль" });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return done(null, false, { message: "Неверное имя пользователя или пароль" });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ provider: "google", providerId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.emails?.[0]?.value || `google_${profile.id}`,
            provider: "google",
            providerId: profile.id,
            isNewUser: true,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ provider: "github", providerId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.username || `github_${profile.id}`,
            provider: "github",
            providerId: profile.id,
            isNewUser: true,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

module.exports = passport;
