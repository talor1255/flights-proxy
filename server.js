// server.js
import express from "express";
import cors from "cors";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import offerSchema from "./schemas/offer.schema.json" assert { type: "json" };

const app = express();
app.use(cors());
app.use(express.json());

const ajv = new Ajv({allErrors:true}); addFormats(ajv);
const validateOffer = ajv.compile(offerSchema);

// In-memory cache (replace with Redis in production)
const cache = new Map();
const TTL_MS = 2 * 60 * 1000; // 2 minutes

const now = () => Date.now();
const keyOf = (b) => JSON.stringify(b);

function daysTo(dateStr) {
  const d = new Date(dateStr);
  const diffMs = (d - new Date());
  return Math.ceil(diffMs / (1000*60*60*24));
}

// TODO: Replace with a real supplier call (Amadeus/Duffel/Kiwi) later.
async function supplierSearch(body) {
  const demo = [{
    id: "demo-1",
    origin: body.origin,
    destination: body.destination,
    departAt: `${body.departDate}T06:30:00Z`,
    returnAt: body.returnDate ? `${body.returnDate}T20:15:00Z` : null,
    airline: "ITA Airways",
    stops: 0,
    durationMin: 215,
    baggage: "not_included",
    price: 149,
    currency: body.currency || "USD",
    updatedAt: new Date().toISOString(),
    offerId: "SUPPLIER_OFFER_123",
    deeplink: "https://example.com/book?id=SUPPLIER_OFFER_123",
    isLastMinute: daysTo(body.departDate) <= (body.lastMinuteWindowDays || 14)
  }];
  return { offers: demo };
}

app.post("/search", async (req, res) => {
  const key = keyOf(req.body);
  const hit = cache.get(key);
  if (hit && hit.exp > now()) return res.json(hit.data);

  try {
    const data = await supplierSearch(req.body);
    for (const offer of data.offers) {
      if (!validateOffer(offer)) {
        console.error(validateOffer.errors);
        return res.status(500).json({error:"Invalid offer shape"});
      }
    }
    cache.set(key, {exp: now()+TTL_MS, data});
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: "Supplier error", detail: String(e) });
  }
});

app.post("/price-check", async (req, res) => {
  const { offerId, currency = "USD" } = req.body;
  // TODO: Integrate with supplier price recheck endpoint
  const price = 149; // demo
  res.json({ price, currency, isStillValid: true });
});

app.post("/deeplink", async (req, res) => {
  const { offerId } = req.body;
  // TODO: Return real deeplink from supplier later
  res.json({ deeplink: `https://example.com/book?id=${offerId}` });
});

// Health check
app.get("/", (req, res) => res.send("Flights Proxy is up"));

const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Proxy listening on", port));
