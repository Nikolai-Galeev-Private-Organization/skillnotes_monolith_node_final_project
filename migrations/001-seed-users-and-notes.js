require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Note = require("../models/Note");

async function up() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const hash = await bcrypt.hash("test1234", 10);
  let user = await User.findOne({ username: "demo" });
  if (!user) {
    user = await User.create({ username: "demo", password: hash, provider: "local", isNewUser: false });
    console.log("Created demo user");
  }

  const count = await Note.countDocuments({ userId: user._id });
  if (count === 0) {
    const docs = [];
    for (let i = 1; i <= 30; i++) {
      docs.push({
        title: `Демо-заметка №${i}`,
        content: `# Заметка №${i}\n\nЭто **тестовая** заметка.`,
        userId: user._id,
        archived: i % 7 === 0,
        createdAt: new Date(Date.now() - i * 24 * 3600 * 1000),
      });
    }
    await Note.insertMany(docs);
    console.log("Inserted 30 demo notes");
  }

  await mongoose.disconnect();
  console.log("Migration completed");
}

up().catch((e) => {
  console.error(e);
  process.exit(1);
});
