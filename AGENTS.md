# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.db.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.db.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## Local Dev Environment (Base44 sandbox)

- Run the app with `docker compose -f docker-compose.base44.yml up -d` and open http://localhost:3000 (Vite dev server, live reload).
- Dependencies are installed inside the container on every start from `package-lock.json`; do not install them on the host.
- Build check: `docker compose -f docker-compose.base44.yml exec -T web npm run build` (compiles all modules and catches broken imports — the exported snapshot has had truncated/missing files restored this way).
- The app talks to the Base44 backend through `src/api/base44Client.js`. In this sandbox there is no Base44 backend configured, so auth/entities are stubbed and every screen renders signed-out with empty data; public routes (`/onboarding`, `/login`, `/register`) are what can be verified locally.
- `AppSettings` is a single-record entity read with `db.entities.AppSettings.list()` and updated by id (`s[0].id`).
