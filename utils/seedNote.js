const Note = require("../models/Note");

const WELCOME_TITLE = "Добро пожаловать в SkillNotes!";
const WELCOME_TEXT = `# Добро пожаловать! 👋

Это ваш персональный сервис заметок.

- Создавайте заметки в **Markdown**
- Архивируйте и восстанавливайте
- Ищите по заголовку
- Скачивайте в **PDF**

Приятного использования!`;

async function seedWelcomeNote(user) {
  if (!user.isNewUser) return;
  const exists = await Note.findOne({ userId: user._id, title: WELCOME_TITLE });
  if (!exists) {
    await Note.create({ title: WELCOME_TITLE, content: WELCOME_TEXT, userId: user._id });
  }
  user.isNewUser = false;
  await user.save();
}

module.exports = { seedWelcomeNote };
