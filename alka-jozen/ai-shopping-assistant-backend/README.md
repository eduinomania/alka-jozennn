# AI Shopping Assistant — Backend

A small Node.js/Express backend for an AI chatbot that recommends products
from a sample SQLite database. The "AI" part calls the Claude API, feeding
it your product catalog as context so it can only recommend real items.

## Stack
- **Express** — HTTP API
- **better-sqlite3** — embedded SQLite database (file-based, zero setup)
- **@anthropic-ai/sdk** — calls Claude to generate recommendations
- **dotenv** — loads your API key from a local `.env` file

## 1. Install dependencies
```bash
npm install
```

## 2. Add your Claude API key
```bash
cp .env.example .env
# then edit .env and paste in your key:
# ANTHROPIC_API_KEY=sk-ant-...
```
Get a key at https://console.anthropic.com/settings/keys if you don't have one.

## 3. Run the server
```bash
npm start
```
On first boot it automatically creates `db/store.db` and seeds it with
12 sample products (shoes, jackets, fitness gear, electronics, etc).
You'll see:
```
✅ Backend running at http://localhost:3001
```

## API Endpoints

### `GET /api/health`
Simple health check.

### `GET /api/products`
List all products. Optional query params:
- `?category=Footwear`
- `?search=hiking` (matches name, tags, or description)

### `GET /api/products/:id`
Get a single product.

### `POST /api/chat`
Talk to the AI assistant. It reads the product catalog, considers the
conversation history for that session, and returns a natural-language
reply plus a structured list of recommended products.

Request body:
```json
{ "sessionId": "any-string-you-choose", "message": "I need shoes for trail running" }
```

Response:
```json
{
  "reply": "For trail running I'd suggest the AeroFit Running Shoes ...",
  "recommendedProducts": [ { "id": 1, "name": "AeroFit Running Shoes", ... } ]
}
```
Conversation history is stored per `sessionId` in the `conversations`
table, so follow-up messages ("what about something cheaper?") keep context.

### `GET /api/chat/:sessionId`
Fetch the raw message history for a session.

## Sample database schema
```
products (id, name, category, price, tags, description, stock)
conversations (id, session_id, role, message, created_at)
```
Edit the `SAMPLE_PRODUCTS` array in `db/seed.js` to change the catalog,
then delete `db/store.db` and restart the server to reseed.

## Quick test with curl
```bash
curl http://localhost:3001/api/products

curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"I want something for a rainy hiking trip"}'
```

## Notes
- Without a valid `ANTHROPIC_API_KEY`, `/api/products` and `/api/health`
  still work fully (tested), but `/api/chat` will return a clear error
  telling you to set the key — this was verified during build.
- CORS is enabled for all origins so you can point any frontend at this
  backend during development. Lock this down before deploying to production.
