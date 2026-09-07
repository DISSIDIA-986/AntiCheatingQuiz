# AntiCheatingQuiz

Personalized paper MCQ exams for in-person classes: same 10 stems, number variants, shuffled order/options, QR per student, phone/web grading (manual bubbles), class CSV export.

Design: [`docs/designs/anti-cheating-quiz-mvp.md`](docs/designs/anti-cheating-quiz-mvp.md)

## Quick start (local)

```bash
npm install
echo 'ADMIN_SECRET=dev-secret-change-me' > .dev.vars
npx wrangler d1 migrations apply anti-cheating-quiz --local
npm run dev
```

In another terminal, create a private exam workspace:

```bash
curl -s -X POST http://127.0.0.1:8787/api/admin/exams \
  -H 'content-type: application/json' \
  -H 'X-Admin-Secret: dev-secret-change-me' \
  -d '{"title":"SGMA demo"}'
```

Open the returned `path` (e.g. `/e/<token>`). Download CSV templates from the page (or `/templates/…`), upload bank + roster, generate the ZIP, grade via instance id / QR, download CSV.

**Do not put real student data in git.**

## Deploy (Cloudflare)

1. `npx wrangler login`
2. `npx wrangler d1 create anti-cheating-quiz` — paste `database_id` into `wrangler.jsonc`
3. `npx wrangler d1 migrations apply anti-cheating-quiz --remote`
4. `npx wrangler secret put ADMIN_SECRET`
5. `npm run deploy`

Send the instructor only the `/e/<token>` URL (not the admin secret).

## Instructor confirm questions (with the link)

1. Same 10 questions for all + shuffle numbers/order/options — OK?
2. Structured CSV bank (not Word) — OK?
3. Letter PDF + phone/web photo (manual bubble confirm) — OK?
