// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { seedDatabase } from "./db/seed.js";
import productsRouter from "./routes/products.js";
import chatRouter from "./routes/chat.js";

dotenv.config();

// Make sure the DB exists and has sample data before the server starts
seedDatabase();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/products", productsRouter);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`   Try: GET  /api/health`);
  console.log(`        GET  /api/products`);
  console.log(`        POST /api/chat   { "sessionId": "abc", "message": "I need shoes for trail running" }`);
});
