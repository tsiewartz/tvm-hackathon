# Snowflake × TVM Hackathon site

Static site, no build step and no external dependencies. Open `index.html` or serve the folder:

```bash
python3 -m http.server 8000 --directory site
```

## Pages
- `index.html` (hero, agenda, build path, definition of done, roles, rules, architecture; `hackathon.html` redirects here), `prework.html`
- Build path: `build/golden-path.html` (09:50, step by step) → `discover` → `semantic-view` → `agent` → `mcp` → `guardrails`
- Knowledge and finish: best practices, idea bank, resources, MVP handoff, cheat sheet, troubleshooting

## Team picker
The **Your team…** menu in the top bar (stored in localStorage) fills these tokens in every `<code>` and `.tpl` element:
`{{N}}`, `{{SCHEMA}}` (HACK_TEAM_n), `{{BRANCH}}` (hackathon/team-n), `{{FOLDER}}` (models/hackathon/team_n), `{{TARGET}}` (team_n).

## TVM's names
Fill in `CONFIG` at the top of the team picker in `assets/app.js` (dev database, dev role, warehouse, Git integration, repo URL). Until then the site shows `<DEV_DB>` etc. Tokens: `{{DEV_DB}}`, `{{DEV_ROLE}}`, `{{DEV_WH}}`, `{{GIT_API}}`, `{{REPO}}`, `{{EAI}}`.

## Live "Now" bar
On 6 November (Stockholm time) every page shows the current block and its checkpoint. Preview any time with `?now=10:40`.

## Starter files
The skeletons on the golden path page and `downloads/hackathon_starter.zip` come from
`../hackathon_starter/template/`. After changing a template, regenerate both:

```bash
python3 tools/build_starter.py          # zip + golden path page
python3 tools/build_starter.py dryrun   # test-account version in hackathon_starter/dryrun
```

## Not included on purpose
Account identifier, repo URL, user names and tokens. They go on the kick-off slide.

## Hosting
Not decided yet. GitHub Pages works with no changes (`gh api -X POST repos/<owner>/<repo>/pages ...`).
