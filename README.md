# SkillNotes — сервис личных заметок

Дипломный проект курса «Node.js»: полноценное веб-приложение для ведения персональных заметок в формате Markdown с аутентификацией, архивацией, поиском, подсветкой найденного и экспортом в PDF.

**Демо:** https://your-app.vercel.app (замените на ваш реальный URL после деплоя)

**Тестовый аккаунт:** `demo` / `test1234`

---

## Стек

**Backend**

- Node.js + Express
- MongoDB (Atlas) + Mongoose
- Passport.js (local, Google OAuth 2.0, GitHub OAuth 2.0)
- express-session + connect-mongo (сессии в MongoDB)
- Nunjucks (шаблонизация страниц `/` и `/dashboard`)
- ws (WebSocket-уведомления об изменениях)
- puppeteer-core + @sparticuz/chromium (генерация PDF)
- marked (Markdown → HTML для PDF)

**Frontend**

- Svelte 3
- svelte-spa-router (SPA-роутинг)
- EasyMDE (Markdown-редактор)
- UIKit 3 (CSS)
- date-fns (форматирование дат)
- Rollup + Babel (сборка)

**Деплой**

- Vercel (HTTPS включён автоматически для домена `*.vercel.app`)
- MongoDB Atlas

---

## Функциональность

### Базовые требования (раздел О ТЗ)

- Регистрация, вход, выход (локальная аутентификация)
- Создание, просмотр, редактирование заметок в Markdown
- Архивация, восстановление из архива
- Удаление заархивированных заметок (по одной и всех сразу)
- Фильтрация списка по диапазону дат: за неделю (по умолчанию), за месяц, за 3 месяца, за всё время, архив
- Пагинация по 20 записей
- Проверка прав: пользователь может работать только со своими заметками

### Поведение (раздел А ТЗ)

- Неаутентифицированный пользователь видит только `/` с формами входа/регистрации; `/dashboard` редиректит на `/`; несуществующие пути → 404
- Аутентифицированный пользователь с `/` редиректится на `/dashboard`
- Создание заметки открывает её в режиме просмотра
- Из просмотра можно перейти в редактирование
- Из списка и просмотра доступна архивация
- В режиме архива доступны восстановление, удаление по одной и «Удалить все»

### Улучшения (раздел С ТЗ) — реализованы все

- **C1.** При первом входе/регистрации создаётся приветственная заметка
- **C2.** Аутентификация через Google и GitHub (OAuth 2.0)
- **C3.** Скачивание заметки в PDF
- **C4.** Поиск заметок по тексту в заголовке
- **C5.** Подсветка найденного фрагмента в заголовке

### Дополнительно

- WebSocket-инфраструктура реализована (сервер + клиент с переподключением), polling каждые 20 секунд обеспечивает актуальность списка на serverless
- Адаптивная генерация PDF: `@sparticuz/chromium` на Vercel, локальный Chrome на Windows
- Сессии хранятся в MongoDB, поэтому корректно работают на serverless-платформе
- Все страницы и API доступны по HTTPS (Vercel)

---

## Структура проекта

```
99_diploma/
├── .env.sample
├── .eslintignore
├── .eslintrc.json
├── .gitignore
├── .prettierrc.json
├── .editorconfig
├── babel.config.js
├── index.js                  # Express-точка входа (module.exports = server)
├── package.json
├── rollup.config.js
├── vercel.json
│
├── config/
│   ├── db.js
│   └── passport.js
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   └── Note.js
├── routes/
│   ├── api.js
│   └── auth.js
├── utils/
│   ├── pdf.js
│   └── seedNote.js
├── migrations/
│   └── 001-seed-users-and-notes.js
│
├── views/
│   ├── _layout.njk
│   ├── index.njk
│   ├── dashboard.njk
│   └── 404.njk
│
├── public/                   # результат сборки: bundle.js, bundle.css
│
└── frontend-src/
    ├── .eslintrc.json
    ├── api.js
    ├── bus.js
    ├── lib.js
    ├── main.js
    ├── App.svelte
    ├── Main.svelte
    ├── NoteCard.svelte
    ├── NoteEdit.svelte
    ├── NoteNew.svelte
    ├── NoteView.svelte
    └── Progress.svelte
```

---

## API

Все маршруты `/api/*` требуют аутентификации (кроме упомянутых). Ответы — JSON.

| Метод  | Путь                                 | Описание                                  |
| ------ | ------------------------------------ | ----------------------------------------- |
| GET    | `/api/notes?age=week&search=&page=1` | Список заметок с фильтрацией и пагинацией |
| POST   | `/api/notes`                         | Создать заметку `{ title, text }`         |
| GET    | `/api/notes/:id`                     | Получить заметку                          |
| PUT    | `/api/notes/:id`                     | Обновить `{ title, text }`                |
| PATCH  | `/api/notes/:id/archive`             | В архив                                   |
| PATCH  | `/api/notes/:id/unarchive`           | Из архива                                 |
| DELETE | `/api/notes/:id`                     | Удалить (только заархивированную)         |
| DELETE | `/api/notes`                         | Удалить все заархивированные              |
| GET    | `/api/notes/:id/pdf`                 | Скачать PDF                               |

Параметры `age`: `week`, `month`, `threeMonths`, `all`, `archive`. По умолчанию `week`. `page` начинается с 1, размер страницы — 20.

---

## Локальный запуск

### Требования

- Node.js 18+ (рекомендуется 20 LTS)
- MongoDB Atlas (или локальный MongoDB)
- Google Chrome или Microsoft Edge (для генерации PDF на Windows)

### Шаги

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your/your-repo.git
cd your-repo

# 2. Установить зависимости
npm install

# 3. Создать .env из шаблона и заполнить
cp .env.sample .env
```

Заполните `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/skillnotes?retryWrites=true&w=majority
SESSION_SECRET=<сгенерируйте: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# OAuth (опционально локально, обязательно для C2 на Vercel)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

```bash
# 4. Применить миграцию (создаст demo/test1234 и 30 заметок)
npm run migrate

# 5. Собрать клиент
npm run build

# 6. Запустить сервер
npm start
```

Откройте `http://localhost:3000`, войдите как `demo` / `test1234`.

### Скрипты

| Скрипт            | Что делает                                               |
| ----------------- | -------------------------------------------------------- |
| `npm start`       | Запуск сервера                                           |
| `npm run dev`     | Запуск с nodemon (перезапуск при изменениях)             |
| `npm run build`   | Сборка Svelte в `public/bundle.js` и `public/bundle.css` |
| `npm run watch`   | Сборка в watch-режиме                                    |
| `npm run migrate` | Создание demo-пользователя и 30 заметок                  |

---

## Деплой на Vercel

1. Запушьте репозиторий на GitHub.
2. На [vercel.com/new](https://vercel.com/new) импортируйте репозиторий.
3. **Root Directory** оставьте пустым (проект в корне).
4. **Build Command** — `npm run build` (Vercel подхватит автоматически из `package.json`).
5. **Environment Variables** — добавьте:

| Переменная             | Значение                                           |
| ---------------------- | -------------------------------------------------- |
| `MONGODB_URI`          | строка подключения Atlas                           |
| `SESSION_SECRET`       | случайная строка (отдельная от локальной)          |
| `NODE_ENV`             | `production`                                       |
| `GOOGLE_CLIENT_ID`     | из Google Cloud Console                            |
| `GOOGLE_CLIENT_SECRET` |                                                    |
| `GOOGLE_CALLBACK_URL`  | `https://your-app.vercel.app/auth/google/callback` |
| `GITHUB_CLIENT_ID`     | из GitHub OAuth App                                |
| `GITHUB_CLIENT_SECRET` |                                                    |
| `GITHUB_CALLBACK_URL`  | `https://your-app.vercel.app/auth/github/callback` |

6. В MongoDB Atlas → **Network Access** добавьте `0.0.0.0/0` (Vercel использует динамические IP).
7. В настройках Google OAuth и GitHub OAuth App добавьте прод-callback URL (`https://your-app.vercel.app/auth/...`).
8. Deploy.

Vercel автоматически обслуживает проект по HTTPS на домене `*.vercel.app` — требование по HTTPS выполнено без отдельного домена и Nginx.

### Про PDF на Vercel

Генерация PDF использует `puppeteer-core` + `@sparticuz/chromium` (Linux-бинарник). На бесплатном плане Vercel функция может не уложиться в лимит времени (10 секунд), особенно при холодном старте. Если PDF не генерируется на Vercel, а локально работает — это ограничение платформы, а не ошибка кода. Варианты:

- Оставить как есть (на платных планах лимит выше).
- Перенести бэкенд на VPS (Nginx + Certbot) без изменения кода.
- Временно отключить маршрут PDF на время демонстрации.

---

## Переменные окружения

Полный список — в `.env.sample`. Кратко:

| Переменная                             | Обязательна   | Описание                         |
| -------------------------------------- | ------------- | -------------------------------- |
| `MONGODB_URI`                          | да            | строка подключения MongoDB       |
| `SESSION_SECRET`                       | да            | секрет подписи cookie сессии     |
| `NODE_ENV`                             | рекомендуется | `development` / `production`     |
| `PORT`                                 | локально      | порт сервера (по умолчанию 3000) |
| `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL` | для C2        | Google OAuth                     |
| `GITHUB_CLIENT_ID/SECRET/CALLBACK_URL` | для C2        | GitHub OAuth                     |

---

## Известные ограничения

- **Уязвимости в dev-зависимостях.** `npm audit` показывает 16 уязвимостей (6 moderate, 10 high) в `puppeteer-core`, `svelte`, `nodemon`, `@rollup/plugin-terser`. Все они либо в dev-инструментах (не попадают в production на Vercel), либо эксплуатируются только при работе с недоверенными внешними файлами (PDF генерируется из собственного Markdown-контента). `npm audit fix --force` обновит `puppeteer-core` до 25.x и `svelte` до 5.x — это breaking changes, которые сломают проект.
- **WebSocket на Vercel** работает в режиме Public Beta; клиент автоматически переподключается, а polling каждые 20 секунд служит fallback.
- **PDF на бесплатном плане Vercel** может падать по таймауту (см. выше).

---

## Лицензия

Учебный проект. Свободное использование в образовательных целях.
