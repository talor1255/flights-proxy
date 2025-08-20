# Flights Proxy (Plug & Play)

A tiny serverless-friendly proxy for your Base44 flight app. Ships with:
- `/search` — returns demo offers in a **unified JSON** shape
- `/price-check` — returns a demo price validation
- `/deeplink` — returns a demo booking link

Swap the demo with a real supplier later (Amadeus/Duffel/Kiwi).

## Quick start (local)

```bash
npm i
npm run start
# Visit http://localhost:8080/  (health check)
```

Test search:
```bash
curl -X POST http://localhost:8080/search \
 -H "Content-Type: application/json" \
 -d '{"origin":"TLV","destination":"ROM","departDate":"2025-08-26","returnDate":"2025-08-31","adults":1,"cabin":"ECONOMY","currency":"USD","maxStops":1,"lastMinuteWindowDays":14}'
```

## Deploy (Vercel)

1. Push this folder to GitHub as `flights-proxy`.
2. In Vercel: **New Project** → Import → Framework: Node.
3. No build step needed. Vercel auto-detects `server.js` via `vercel.json`.
4. After deploy, copy your URL (e.g. `https://<project>.vercel.app`).
5. In Base44, set env: `API_BASE_URL=https://<project>.vercel.app/`  *(note trailing slash)*.

## Endpoints

### `POST /search`
**Body**
```json
{
  "origin": "TLV",
  "destination": "ROM",
  "departDate": "2025-08-26",
  "returnDate": "2025-08-31",
  "adults": 1,
  "cabin": "ECONOMY",
  "maxStops": 1,
  "currency": "USD",
  "lastMinuteWindowDays": 14
}
```

**Response**
```json
{
  "offers": [{ "...offer fields..." }]
}
```

### `POST /price-check`
```json
{ "offerId": "SUPPLIER_OFFER_123", "currency": "USD" }
```

### `POST /deeplink`
```json
{ "offerId": "SUPPLIER_OFFER_123" }
```

## Notes
- Cache: in-memory (2 minutes). Replace with Redis/Upstash in prod.
- Never store supplier API keys in the client; keep them in the proxy ENV.
- Next step: replace `supplierSearch` with real supplier calls and map to `offer.schema.json`.
