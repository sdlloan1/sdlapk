# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through db.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.

See the [Base44 CLI docs](https://docs.db.com/developers/references/cli/get-started/overview) if you want to run Base44 commands directly.

## Run Locally

Run the full local development environment from the project root:

```bash
base44 dev
```

`base44 dev` starts the local Base44 development backend and, when this app is configured for it, also starts the frontend dev server for you. Use the frontend URL printed by the command.

For example, when the Base44 project config includes a `serveCommand`, `base44 dev` can launch the frontend too:

```json5
{
  "site": {
    "serveCommand": "npm run dev"
  }
}
```

In a Base44 project this lives in `base44/config.jsonc`.

## Run Only The Frontend

If you only want to work on the frontend against the hosted Base44 backend, run:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Use The Hosted Backend

For frontend-only development, create or update `.env.local` in the project root:

```bash
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.db.app
```

`VITE_BASE44_APP_ID` identifies the Base44 app.

`VITE_BASE44_APP_BASE_URL` tells the Base44 Vite plugin where to send local `/api` requests. Point it at your deployed Base44 app URL when you want the local frontend to use the hosted backend.

When you use `base44 dev`, the command injects the local Base44 values for you, so `.env.local` is mainly needed for frontend-only workflows.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

## Host on GitHub Pages

`.github/workflows/deploy-pages.yml` publishes the web app to GitHub Pages on every push to `main` (or from **Actions → Deploy to GitHub Pages → Run workflow**):

- The build sets `VITE_BASE_PATH=/<repo>/`, so assets and routes live under `https://<owner>.github.io/<repo>/` (`vite.config.js` reads it; local dev and the Base44 build keep `/`).
- Pages has no backend, so the bundle calls the hosted Base44 backend through `VITE_BASE44_API_BASE_URL` (set in the workflow to `https://sdlapk-02aafe92.base44.app`; update it when the app gets its published URL).
- `index.html` is copied to `404.html` so deep links such as `/login` still load the app.

One-time setup: in the repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**. After the first successful run the site is at `https://<owner>.github.io/<repo>/`.

## Docs & Support

Documentation: [https://docs.db.com/Integrations/Using-GitHub](https://docs.db.com/Integrations/Using-GitHub)

Base44 CLI command reference: [https://docs.db.com/developers/references/cli/commands/introduction](https://docs.db.com/developers/references/cli/commands/introduction)

Support: [https://app.db.com/support](https://app.db.com/support)
