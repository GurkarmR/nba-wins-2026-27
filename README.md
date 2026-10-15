# NBA Wins 2026–27 — five-person draft tracker

Public responsive website for Jordan, Gurkarm, Patrick, Harj and Ramandeep.

## Deploy to Vercel

1. Extract this ZIP and upload the folder to a **new GitHub repository**.
2. In https://vercel.com/new, import the repository and click Deploy. Framework preset: **Other**; output directory: leave blank. Root directory: repository root.
3. Vercel creates a public `*.vercel.app` URL. Share that link with the group.
4. In Vercel Project → Settings → Cron Jobs, confirm `/api/standings?warm=1` runs daily at **15:00 UTC** (8 AM PDT / 7 AM PST). The function uses Vercel's shared CDN cache for up to 12 hours; the cron warms it daily. A visitor can also cause a refresh when the cache expires.

No database or API key is needed. No manual entry. All standings calculated from finalized NBA games returned by ESPN's public scoreboard JSON feed, which is unofficial/undocumented and may change. If ESPN becomes unavailable, site displays an error rather than silently substituting fabricated scores. Opening preseason line values are fixed from Fanatics' article of October 13, 2026.

**Important:** Daily automated refresh is *configured* but runs only after deploying the repository on Vercel. It is not deployed by this download alone.

## Rules

- 2026–27 NBA regular season only, October 20, 2026 – April 11, 2027; excludes preseason and playoffs.
- Monthly records follow the game start date in **America/New_York** time.
- Overall manager wins = sum of six drafted teams' wins. Ranking by wins, then fewer losses, then alphabetical for display; tied wins are highlighted as tied rank.
- Fanatics line is a full-season 82-game win total, frozen at capture. `vs pace` compares current wins to line × games played ÷ 82, rather than incorrectly comparing partial wins against full-season line.
- Source list: https://betfanatics.com/blog/nba-win-totals-over-under-odds ; https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard

## Development / test

Node.js 20+; `npm test` for calculation checks. `npx vercel dev` for full app locally. Alternatively open `index.html` for a demonstration of the interface; record updates require the deployed `/api/standings` endpoint.

## Troubleshooting

If ESPN changes its endpoint, check `/api/standings` directly; it returns an explicit 503 error. ESPN's scoreboard month-range behavior and its 2026–27 data are not guaranteed, so verify returned standings against NBA.com after deployment. Source code is fully editable and can be switched to an official licensed feed if desired.
