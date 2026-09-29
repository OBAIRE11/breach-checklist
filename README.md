# I Got Breached — Now What?

A one-page guide: pick the company that leaked your data and get a prioritized checklist of what to do next.

## Adding a breach

All breaches live in [`breaches.json`](breaches.json), one entry per company. Each company lists its breaches, oldest first:

```json
{"name": "Example Corp", "breaches": [{"year": 2026, "types": ["email", "password"], "added": "2026-09-26"}]},
```

A company that has been breached more than once gets one entry with several breaches. The site then asks "Which breach?" and defaults to "Not sure / all of them", which combines every breach's steps:

```json
{"name": "LinkedIn", "breaches": [
  {"year": 2012, "types": ["password", "email"], "added": "2026-09-26", "note": "Password leak"},
  {"year": 2021, "types": ["email", "phone"], "added": "2026-09-26"}
]},
```

- `name`: the company as people would search for it
- `aliases` (optional): other names people might search for, e.g. `["Experian"]` on T-Mobile
- `breaches`: one item per breach, with:
  - `year`: the year the breach happened
  - `types`: what was exposed. Use any of `password`, `ssn`, `financial`, `email`, `phone`, `address`, `security_q`, `gov_id`
  - `added`: the date you added it to this list
  - `note` (optional): a short description, e.g. `"[24]7.ai chat vendor"`

Only mark `ssn` or `financial` when full numbers were exposed (not just the last four digits), since those types add credit freeze and bank steps to the checklist.

A GitHub Action checks every change for typos, duplicates and unknown types. To run the same check yourself:

```sh
node scripts/validate-breaches.mjs
```

## Previewing locally

The page loads `breaches.json` with `fetch`, which browsers block when you open the file directly. Serve the folder instead:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Email alerts (Buttondown)

The "Get notified about new breaches" form sends signups to [Buttondown](https://buttondown.com). To turn it on, set `BUTTONDOWN_USERNAME` near the top of the script in `index.html` to your Buttondown username. While it's empty, the form shows "coming soon".

Submitting opens a small Buttondown window, because Buttondown may need to show a CAPTCHA or confirmation step. Subscribers then confirm by email. To send an alert, write a new email in the Buttondown dashboard.

To move to another service later, export your subscribers from Buttondown as a CSV file (Subscribers, then Export), import it into the new service, and point the form at that service instead.
