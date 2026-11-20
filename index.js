require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const nunjucks = require("nunjucks");
const http = require("http");
const path = require("path");

const connectDB = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");

const app = express();
const server = http.createServer(app);

connectDB();

nunjucks.configure(path.join(__dirname, "views"), {
  autoescape: true,
  express: app,
});

app.set("view engine", "njk");
app.set("trust proxy", 1); // критично для secure cookies за прокси Vercel

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// На Vercel public/ раздается CDN, express.static не нужен.
// Локально — полезно.
if (process.env.NODE_ENV !== "production") {
  app.use(express.static(path.join(__dirname, "public")));
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", apiRoutes);
app.use("/", authRoutes);

// WebSocket (опционально для Vercel Public Beta)
let wss = null;
try {
  const WebSocket = require("ws");
  wss = new WebSocket.Server({ server, path: "/ws" });
  wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === "auth" && msg.userId) ws.userId = String(msg.userId);
      } catch (_) {}
    });
  });
  app.set("broadcast", (userId, payload) => {
    const msg = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.userId === String(userId)) {
        client.send(msg);
      }
    });
  });
} catch (e) {
  console.warn("WebSocket не инициализирован:", e.message);
  app.set("broadcast", () => {});
}

// Локальный запуск (не выполняется на Vercel)
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server on ${PORT}`));
}

module.exports = server;
