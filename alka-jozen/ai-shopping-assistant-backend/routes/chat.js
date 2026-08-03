// routes/chat.js
import { Router } from "express";
import { getDb } from "../db/seed.js";
import { getRecommendation } from "../lib/claude.js";

const router = Router();

// POST /api/chat
// body: { sessionId: string, message: string }
router.post("/", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required" });
  }

  const db = getDb();

  try {
    // Pull recent conversation history for this session (last 10 turns)
    const historyRows = db
      .prepare(
        "SELECT role, message FROM conversations WHERE session_id = ? ORDER BY id DESC LIMIT 10"
      )
      .all(sessionId)
      .reverse();
    const history = historyRows.map((r) => ({ role: r.role, content: r.message }));

    const products = db.prepare("SELECT * FROM products").all();

    const { reply, recommendedIds } = await getRecommendation(message, history, products);

    const recommendedProducts = recommendedIds.length
      ? db
          .prepare(
            `SELECT * FROM products WHERE id IN (${recommendedIds.map(() => "?").join(",")})`
          )
          .all(...recommendedIds)
      : [];

    // Persist the turn
    const insert = db.prepare(
      "INSERT INTO conversations (session_id, role, message) VALUES (?, ?, ?)"
    );
    insert.run(sessionId, "user", message);
    insert.run(sessionId, "assistant", reply);

    res.json({ reply, recommendedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    db.close();
  }
});

// GET /api/chat/:sessionId -> conversation history for a session
router.get("/:sessionId", (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT role, message, created_at FROM conversations WHERE session_id = ? ORDER BY id ASC")
    .all(req.params.sessionId);
  db.close();
  res.json({ history: rows });
});

export default router;
