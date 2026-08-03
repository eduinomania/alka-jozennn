// lib/claude.js
import Anthropic from "@anthropic-ai/sdk";

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

function normalizeText(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreProduct(product, userMessage, history) {
  const combinedText = normalizeText([userMessage, ...history.map((item) => item.content)].join(" "));
  const haystack = normalizeText(
    `${product.name} ${product.category} ${product.tags} ${product.description}`
  );

  let score = 0;
  const tokens = combinedText.split(" ").filter(Boolean);
  const categoryTokens = normalizeText(product.category).split(" ").filter(Boolean);
  const priceBand = Number(product.price);

  for (const token of tokens) {
    if (token.length < 2) continue;

    if (haystack.includes(token)) {
      score += 3;
    }

    if (categoryTokens.includes(token)) {
      score += 5;
    }
  }

  if (combinedText.includes("cheap") || combinedText.includes("budget") || combinedText.includes("affordable")) {
    if (priceBand <= 50) score += 4;
    if (priceBand <= 100) score += 2;
  }

  if (combinedText.includes("premium") || combinedText.includes("best") || combinedText.includes("top")) {
    if (priceBand >= 100) score += 3;
  }

  if (combinedText.includes("outdoor") || combinedText.includes("hiking") || combinedText.includes("trail")) {
    if (haystack.includes("outdoor") || haystack.includes("hiking") || haystack.includes("trail")) {
      score += 2;
    }
  }

  if (combinedText.includes("fitness") || combinedText.includes("workout") || combinedText.includes("training")) {
    if (haystack.includes("fitness") || haystack.includes("workout") || haystack.includes("training")) {
      score += 2;
    }
  }

  if (combinedText.includes("electronics") || combinedText.includes("audio") || combinedText.includes("wireless")) {
    if (haystack.includes("electronics") || haystack.includes("audio") || haystack.includes("wireless")) {
      score += 2;
    }
  }

  return score;
}

function buildFallbackRecommendation(userMessage, history, products) {
  const rankedProducts = products
    .map((product) => ({ product, score: scoreProduct(product, userMessage, history) }))
    .sort((a, b) => b.score - a.score || a.product.price - b.product.price);

  const recommended = rankedProducts
    .filter((entry) => entry.score > 0)
    .slice(0, 3)
    .map((entry) => entry.product);

  const fallbackProducts = recommended.length ? recommended : products.slice(0, 3);
  const recommendedIds = fallbackProducts.map((product) => product.id);

  const reasons = fallbackProducts
    .map((product, index) => `${index + 1}. ${product.name} — ${product.description}`)
    .join(" ");

  const reply = `I found a few good matches for that request: ${reasons} If you want, I can narrow the list by budget, category, or use case.`;

  return { reply, recommendedIds };
}

/**
 * Ask Claude to recommend products from the catalog based on the
 * user's message and recent conversation history.
 *
 * @param {string} userMessage
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {Array<object>} products - full product catalog from the DB
 * @returns {Promise<{reply: string, recommendedIds: number[]}>}
 */
export async function getRecommendation(userMessage, history, products) {
  const anthropic = getClient();

  if (!anthropic) {
    return buildFallbackRecommendation(userMessage, history, products);
  }

  const catalogText = products
    .map(
      (p) =>
        `id=${p.id} | ${p.name} | category=${p.category} | $${p.price} | tags=${p.tags} | stock=${p.stock}\n  ${p.description}`
    )
    .join("\n");

  const systemPrompt = `You are a friendly shopping assistant for an outdoor/fitness gear store.
You must ONLY recommend products from the catalog below — never invent products.
When you recommend items, mention them by name and briefly explain why they fit the user's request.
At the very end of your reply, on its own line, output a machine-readable tag listing the ids of every
product you recommended, formatted exactly like this (empty array if none):
RECOMMENDED_IDS: [1, 4, 7]

Catalog:
${catalogText}`;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const match = text.match(/RECOMMENDED_IDS:\s*\[([^\]]*)\]/);
    const recommendedIds = match
      ? match[1]
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !Number.isNaN(n))
      : [];

    const reply = text.replace(/RECOMMENDED_IDS:\s*\[[^\]]*\]/, "").trim();

    return { reply, recommendedIds };
  } catch (err) {
    console.warn("Anthropic recommendation failed, using local fallback.", err.message);
    return buildFallbackRecommendation(userMessage, history, products);
  }
}
