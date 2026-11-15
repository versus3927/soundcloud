# VERSUSCLOUD

Десктопное музыкальное приложение в стиле SoundCloud, но **в зелёных тонах** и
**работающее без VPN**: поиск треков, тренды, лайки, библиотека, свои плейлисты,
история прослушиваний, профиль с привязкой к аккаунту Audius.

Стрим и каталог работают через открытую сеть **Audius** — миллионы треков,
публичный API без ключей, доступен из России без VPN. Прямая интеграция с
настоящим SoundCloud невозможна без их закрытого API-ключа (у них отключена
саморегистрация ключей + SoundCloud сам требует VPN в твоём регионе).

## Стек

- **Next.js 16** (App Router) + React 19 + Tailwind CSS 4
- **PostgreSQL** (Drizzle ORM) — лайки, плейлисты, история, профиль
- **Audius API** — каталог, поиск, тренды, стриминг
- **Electron** — обёртка для Windows `.exe`
- **Railway** — хостинг веб-приложения
- **GitHub Actions** — автоматическая сборка `.exe`

---

## ⚠️ ВАЖНО ПРО БЕЗОПАСНОСТЬ

GitHub-токен, который ты прислал в чат, теперь **скампрометирован** — такие токены
GitHub отзывает автоматически, а любой, кто его видел, может писать в твои репозитории.

1. Открой https://github.com/settings/tokens → удали/отозви токен `ghp_l7cp…`.
2. Создай новый (Settings → Developer settings → Personal access tokens →
   Generate new token (classic), галочка `workflow` + `contents` достаточно).
3. **Никогда не вставляй токены в чаты, код и README.**

---

## 1. Запустить код у себя в репозитории

```bash
# в папке этого проекта
git init
git add .
git commit -m "VERSUSCLOUD: green soundcloud client"
git branch -M main
git remote add origin https://github.com/versus3927/soundcloud.git
git push -u origin main
# логин: твой логин, пароль: НОВЫЙ токен (не пароль от аккаунта!)
```

Или через VS Code: Source Control → Publish to GitHub.

## 2. Задеплоить на Railway

1. https://railway.app → **New Project → Deploy from GitHub repo** → выбери
   `versus3927/soundcloud`. Railway сам найдёт `Dockerfile`.
2. В проекте: **+ New → Database → PostgreSQL**.
3. Открой сервис приложения → **Variables** → добавь:
   `DATABASE_URL = ${{Postgres.DATABASE_URL}}` (магическая ссылка-Ref).
4. После деплоя открой **Settings → Domains → Generate Domain** — получишь URL
   вида `https://xxxx.up.railway.app`.
5. Таблицы (`profile`, `likes`, `playlists`, `playlist_tracks`, `history`)
   создадутся **автоматически при первом старте** (см. `src/instrumentation.ts`).

Готово: приложение живо по этому URL, лайки/плейлисты хранятся в твоей БД.

## 3. Получить `.exe` (Windows)

### Вариант А — автоматически через GitHub Actions (рекомендую)

В репозитории уже лежит workflow `.github/workflows/desktop-release.yml`.

```bash
# один раз: укажи свой Railway-URL
echo https://ТВОЙ-ДОМЕН.up.railway.app > desktop/url.txt
git add desktop/url.txt && git commit -m "set app url" && git push

# запуск сборки:
git tag desktop-v1.0.0
git push --tags
```

Дальше: GitHub → **Actions** → дождаться зелёной галочки → артефакт
`versuscloud-windows` (или вкладка **Releases**, если сборка шла по тегу).
Внутри — `VERSUSCLOUD Setup 1.0.0.exe` (установщик) и portable-версия.

### Вариант Б — собрать локально на своём ПК

Нужен Node.js 20+ на Windows:

```bash
cd desktop
npm install
npm run dist      # сборка займёт ~3-5 минут
# результат: desktop/release/VERSUSCLOUD Setup 1.0.0.exe
```

После смены Railway-домена пересобери или просто поменяй `desktop/url.txt`
в установленной копии.

## 4. Как устроен `.exe`

`desktop/` — это лёгкая Electron-оболочка (~90 МБ), которая открывает твой
Railway-URL в нативном окне с зелёной темой. Поэтому:

- музыка, лайки, плейлисты — общие между ПК и браузером;
- приложение всегда свежее, обновляешь только Railway-деплой (`git push`);
- при желании можно зашить Next.js standalone-сервер внутрь exe
  (offline-режим) — структура проекта это позволяет.

## 5. Локальная разработка

```bash
cp .env.example .env     # пропиши DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
npm install
npx drizzle-kit push     # или просто запусти — таблицы создадутся сами
npm run dev              # http://localhost:3000

# десктоп-превью:
cd desktop && npm install && npm start
```

## Возможности

| Экран | Что умеет |
| --- | --- |
| Главная | Тренды недели, фильтр жанров, топ-5, подборки сообщества |
| Поиск | Треки / артисты / плейлисты по всей сети Audius |
| Библиотека | Лайки, свои плейлисты, история (с очисткой) |
| Плеер | Очередь, shuffle, repeat, громкость, «играть следующим» |
| Плейлисты | Создание, переименование, описание, удаление, обложка из первого трека |
| Профиль | Имя, статистика, привязка Audius-аккаунта (@handle) |
| Артист | Аватар, обложка, слушатели, все треки |
