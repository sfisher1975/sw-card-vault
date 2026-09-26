SW CARD VAULT v1.0

Release contents:
- index.html — main app
- cards-v1.0.json — fixed 902-card catalog
- prices-v1.0.json — starting/local price records and exact card links
- price-worker.js — Cloudflare Worker used by Update Prices
- sw.js — offline/PWA cache
- manifest.webmanifest + icons — installable web app files
- PRICE-UPDATER-SETUP.txt — updater setup notes

DEPLOYMENT
Upload all files in this release folder to the root of the GitHub Pages repository.
The service worker uses a new v1.0 cache name, so the release will replace older cached app files after reload.

PRICING
The app updates one selected card at a time from its individual PriceCharting page.
Tracked values are Raw, Grade 7, Grade 8, and Grade 9.
Missing values remain blank rather than being invented.
