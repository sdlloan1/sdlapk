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
- The app talks to the Base44 backend through `src/api/base44Client.js`, which creates the SDK client for app `6a65ccde323b932e9e9dc990` (`VITE_BASE44_APP_ID` overrides it) and installs it as `globalThis.__B44_DB__` before React mounts. Most source files read the client from that global.
- `vite.config.js` proxies `^/api/(apps|app-logs)` to `https://base44.app` only when `BASE44_PREVIEW_MODE=1`, because the Base44 Vite plugin skips its own platform proxy in the preview sandbox. With the flag unset the app keeps the plugin's original behavior.
- Entities and backend functions are live in the preview. Signed out, entity reads return public data (the app is `public_without_login`) and authenticated functions such as `lookupPincode` answer `Authentication required to view users` (HTTP 500 from the platform); signed-in flows need a real login.
- `AppSettings` is a single-record entity read with `db.entities.AppSettings.list()` and updated by id (`s[0].id`).
