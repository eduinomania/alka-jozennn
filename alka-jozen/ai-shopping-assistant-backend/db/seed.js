// db/seed.js
// Creates the SQLite database file and fills it with sample data.
// Run manually with: npm run seed
// (server.js also calls this automatically on first boot if the DB is empty)

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "store.db");

export function getDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

const SAMPLE_PRODUCTS = [
  {
    name: "AeroFit Running Shoes",
    category: "Footwear",
    price: 89.99,
    tags: "running,lightweight,breathable,sport",
    description: "Lightweight running shoes with breathable mesh and responsive cushioning. Great for daily training and long runs.",
    stock: 42,
  },
  {
    name: "TrailBlazer Hiking Boots",
    category: "Footwear",
    price: 129.99,
    tags: "hiking,waterproof,outdoor,durable",
    description: "Waterproof hiking boots with reinforced ankle support, built for rugged trails and wet conditions.",
    stock: 18,
  },
  {
    name: "UrbanFlex Sneakers",
    category: "Footwear",
    price: 74.5,
    tags: "casual,everyday,comfortable,city",
    description: "Everyday casual sneakers with a flexible sole, designed for comfort during city walking and commuting.",
    stock: 65,
  },
  {
    name: "PowerCore Wireless Earbuds",
    category: "Electronics",
    price: 59.99,
    tags: "audio,wireless,workout,bluetooth",
    description: "Sweat-resistant wireless earbuds with noise isolation, ideal for workouts and daily commutes.",
    stock: 30,
  },
  {
    name: "PulseTrack Fitness Watch",
    category: "Electronics",
    price: 149.0,
    tags: "fitness,tracker,heart-rate,gps",
    description: "Fitness tracker with heart-rate monitoring, GPS, and sleep tracking. Syncs with most workout apps.",
    stock: 24,
  },
  {
    name: "ChargeUp Power Bank 10000mAh",
    category: "Electronics",
    price: 29.99,
    tags: "travel,charging,portable,electronics",
    description: "Compact portable charger with fast charging support, perfect for travel and outdoor trips.",
    stock: 80,
  },
  {
    name: "FlexFit Yoga Mat",
    category: "Fitness",
    price: 34.99,
    tags: "yoga,fitness,home-workout,non-slip",
    description: "Non-slip yoga mat with extra cushioning, suitable for yoga, pilates, and home workouts.",
    stock: 55,
  },
  {
    name: "IronGrip Adjustable Dumbbells",
    category: "Fitness",
    price: 199.99,
    tags: "strength,home-gym,weights,fitness",
    description: "Space-saving adjustable dumbbell set for home strength training, adjustable from 5 to 50 lbs.",
    stock: 12,
  },
  {
    name: "RainShield Packable Jacket",
    category: "Apparel",
    price: 64.99,
    tags: "rain,jacket,travel,outdoor,packable",
    description: "Lightweight packable rain jacket that folds into its own pocket. Great for hiking and travel.",
    stock: 37,
  },
  {
    name: "ThermaCore Insulated Jacket",
    category: "Apparel",
    price: 119.99,
    tags: "winter,warm,jacket,cold-weather",
    description: "Insulated winter jacket designed to keep you warm in cold weather without added bulk.",
    stock: 20,
  },
  {
    name: "HydroFlow Insulated Bottle 32oz",
    category: "Outdoor",
    price: 24.99,
    tags: "hydration,travel,outdoor,insulated",
    description: "Insulated stainless steel water bottle that keeps drinks cold for 24 hours, ideal for hiking and gym.",
    stock: 90,
  },
  {
    name: "SummitPack 40L Backpack",
    category: "Outdoor",
    price: 94.99,
    tags: "hiking,travel,backpack,outdoor",
    description: "40-liter hiking backpack with multiple compartments and a padded hip belt for long treks.",
    stock: 15,
  },
];

export function seedDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      tags TEXT NOT NULL,
      description TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,       -- 'user' | 'assistant'
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = db.prepare("SELECT COUNT(*) AS c FROM products").get().c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (name, category, price, tags, description, stock)
      VALUES (@name, @category, @price, @tags, @description, @stock)
    `);
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(SAMPLE_PRODUCTS);
    console.log(`Seeded ${SAMPLE_PRODUCTS.length} sample products.`);
  } else {
    console.log(`Database already has ${count} products, skipping seed.`);
  }

  db.close();
}

// Allow running directly: `node db/seed.js`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}
