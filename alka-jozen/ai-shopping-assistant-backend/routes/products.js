// routes/products.js
import { Router } from "express";
import { getDb } from "../db/seed.js";

const router = Router();

// GET /api/products  -> list all products (optional ?category= & ?search=)
router.get("/", (req, res) => {
  const db = getDb();
  const { category, search } = req.query;

  let query = "SELECT * FROM products";
  const conditions = [];
  const params = {};

  if (category) {
    conditions.push("category = @category");
    params.category = category;
  }
  if (search) {
    conditions.push("(name LIKE @search OR tags LIKE @search OR description LIKE @search)");
    params.search = `%${search}%`;
  }
  if (conditions.length) query += " WHERE " + conditions.join(" AND ");

  const products = db.prepare(query).all(params);
  db.close();
  res.json({ count: products.length, products });
});

// GET /api/products/:id -> single product
router.get("/:id", (req, res) => {
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  db.close();
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

export default router;
