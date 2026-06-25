# Alpine Mar Admin

Внутренняя CMS для alpinemar.com. Команда SEO редактирует блог / сервисы / индустрии / команду / медиа через веб-интерфейс — изменения пишутся как `.md` файлы в репозиторий `alpinemar`, Vercel автоматически пересобирает сайт.

Стек: Next.js 16, Tailwind v4, shadcn/ui-стиль примитивы, TipTap (rich text), gray-matter (frontmatter), Octokit (GitHub Contents API).

## Архитектура

```
admin/                          ← это приложение
└── app/
    ├── login/                  ← пароль-гейт
    ├── (dashboard)/            ← всё под auth
    │   ├── dashboard/
    │   ├── blog/               ← src/content/insights/*.md
    │   ├── services/           ← src/content/services/*.md
    │   ├── industries/         ← src/content/industries/*.md
    │   ├── team/               ← src/content/team/*.md
    │   └── media/              ← public/images/**
```

Контент в Astro-репо — единственный source of truth. Админка не держит свою БД: всё пишется в `.md` через абстракцию `lib/store/`:

- **dev:** `CONTENT_STORE=fs` — пишет напрямую в файловую систему. Удобно когда `admin/` лежит внутри `alpinemar/`.
- **prod:** `CONTENT_STORE=github` — коммитит через Octokit. Vercel-деплой сайта триггерится автоматически на push.

## Локальный запуск

```bash
cd admin
cp .env.example .env.local
# Заполнить минимум:
#   ADMIN_PASSWORD=<длинный пароль>
#   SESSION_SECRET=<32+ случайных символа>
#   CONTENT_STORE=fs
#   CONTENT_REPO_ROOT=..
npm install
npm run dev
# → http://localhost:3030
```

В FS-режиме изменения попадают сразу в рабочее дерево alpinemar (`src/content/**`, `public/images/**`). Закоммитить и запушить нужно вручную (`git status` покажет, что изменилось).

## Деплой на Vercel

Админка — **отдельный Vercel-проект** с `Root Directory` = `admin/`.

### Переменные окружения (Vercel → Settings → Environment Variables)

| Имя | Описание |
| --- | --- |
| `ADMIN_PASSWORD` | Пароль для входа на /login |
| `SESSION_SECRET` | Случайные 32+ символа для подписи cookie |
| `CONTENT_STORE` | `github` |
| `GITHUB_TOKEN` | Fine-grained PAT, scope: Contents R/W на репо alpinemar |
| `GITHUB_OWNER` | GitHub username / org владельца репо |
| `GITHUB_REPO` | `alpinemar` |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_COMMIT_NAME` | (опц.) Имя коммитера |
| `GITHUB_COMMIT_EMAIL` | (опц.) Email коммитера |
| `VERCEL_DEPLOY_HOOK_URL` | (опц.) URL deploy-hook основного сайта, если нужно форсировать ребилд |

### Поддомен

В Vercel-проекте админки добавить кастомный домен, например `admin.alpinemar.com`. Сайт alpinemar.com остаётся на основном проекте.

### GitHub PAT

1. github.com → Settings → Developer settings → Fine-grained tokens → Generate new token
2. Repository access: только `alpinemar`
3. Permissions:
   - **Contents:** Read and write
   - **Metadata:** Read-only (выдаётся автоматически)
4. Скопировать токен в `GITHUB_TOKEN` на Vercel.

## Воркфлоу публикации

1. SEO-команда заходит на `admin.alpinemar.com`, логинится паролем.
2. Создаёт/редактирует пост в TipTap → нажимает **Save** или **Publish**.
3. Server action сериализует frontmatter+HTML в `.md` и коммитит в `main` (`content(blog): create/update <slug>`).
4. Vercel ловит push, пересобирает `alpinemar.com` (~1–2 минуты).
5. Через GitHub видно полную историю изменений по каждому посту.

## Дальнейшие улучшения (по запросу)

- Draft / scheduled publish (отдельная ветка / status в frontmatter).
- Несколько пользователей (вместо общего пароля — auth через Clerk / NextAuth + журнал авторства).
- Bulk-импорт из CSV.
- AI-ассистент в редакторе (генерация excerpt, SEO-метатегов).
- Preview серверного билда (Vercel preview deployments) до публикации.
