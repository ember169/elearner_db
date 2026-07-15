Learner DB — a personal learning dashboard aggregating progress across 42 Paris, TryHackMe, HackTheBox, Root-me, and a maldev elearning platform.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database lives at `data/learner.db` by default (override with the `DATABASE_PATH` env var) — the directory is created and all migrations are applied automatically on startup, so a fresh clone works with no manual setup.

Configure platform credentials in Settings once it's running.

### Docker

```bash
docker compose up -d
```

Data persists in the `db-data` volume, mounted at `/app/data`.

### Schema changes

After editing `src/lib/db/schema.ts`, run `npm run db:generate` to create a migration. It picks up automatically on the next server start — no manual `migrate` step needed.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
