import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClarificationReply,
  detectConversationalReply,
  isUnderspecified,
  parseAssistantQuery,
  rankProducts,
} from "../src/lib/assistant/intent.ts";

function product(overrides = {}) {
  return {
    id: overrides.id ?? "000000000000000000000001",
    slug: "sample",
    name: overrides.name ?? "Sample Product",
    sku: "SKU-1",
    summary: overrides.summary ?? "A useful everyday product.",
    description: overrides.description ?? "A longer description.",
    highlights: [],
    tags: overrides.tags ?? [],
    priceInCents: overrides.priceInCents ?? 5000,
    compareAtPriceInCents: null,
    category: { id: "1", name: "Audio", slug: "audio", icon: "headphones" },
    images: [],
    stock: 10,
    inStock: true,
    badge: null,
    featured: false,
    active: true,
    rating: 4,
    reviewCount: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("greetings get a friendly answer and no product search", () => {
  for (const greeting of ["hi", "Hi!", "hello", "Hey there", "hi, can you help me", "good morning", "assalamu alaikum"]) {
    const reply = detectConversationalReply(greeting);
    assert.ok(reply, `expected a reply for "${greeting}"`);
    assert.match(reply.message, /shopping assistant|help|find/i);
    assert.ok(reply.followUps.length > 0);
  }
});

test("a bare number asks whether it is a budget instead of listing products", () => {
  for (const input of ["50", "$50", "50 dollars"]) {
    const reply = detectConversationalReply(input);
    assert.ok(reply, `expected a reply for "${input}"`);
    assert.match(reply.message, /\$50/);
    assert.match(reply.message, /budget/i);
  }
});

test("real shopping requests are not treated as small talk", () => {
  for (const input of [
    "headphones under $50",
    "hi-fi speaker",
    "show me a gift for a student",
    "compare two audio products",
    "under 50",
  ]) {
    assert.equal(detectConversationalReply(input), null, input);
  }
});

test("thanks, goodbye, help and acknowledgements are answered conversationally", () => {
  for (const input of ["thanks", "thank you!", "bye", "what can you do", "ok"]) {
    assert.ok(detectConversationalReply(input), input);
  }
});

test("a short word no longer matches inside longer words", () => {
  const catalog = [
    product({ name: "Arc Desk Lamp", summary: "A slim lamp with this warm light." }),
    product({ id: "2", name: "Daypack", summary: "Fits all your things with ease." }),
  ];
  const query = parseAssistantQuery("hi");
  assert.deepEqual(rankProducts(catalog, query), []);
});

test("whole words and plurals still match", () => {
  const lamp = product({ name: "Arc Desk Lamp" });
  const query = parseAssistantQuery("lamps");
  assert.equal(rankProducts([lamp], query).length, 1);
});

test("requests with nothing to act on are asked to clarify", () => {
  assert.equal(isUnderspecified(parseAssistantQuery("please")), true);
  assert.equal(isUnderspecified(parseAssistantQuery("headphones")), false);
  assert.equal(isUnderspecified(parseAssistantQuery("under $40")), false);
  assert.equal(isUnderspecified(parseAssistantQuery("Show me something cheaper")), false);
  assert.equal(isUnderspecified(parseAssistantQuery("Only show products in stock")), false);
  assert.equal(isUnderspecified(parseAssistantQuery("Compare two audio products")), false);
  assert.ok(buildClarificationReply().message.length > 10);
});

test("asking for something cheaper sorts by price", () => {
  const catalog = [
    product({ id: "1", name: "Pro Lamp", priceInCents: 9000 }),
    product({ id: "2", name: "Basic Lamp", priceInCents: 2000 }),
    product({ id: "3", name: "Mid Lamp", priceInCents: 5000 }),
  ];
  const query = parseAssistantQuery("cheaper lamp");
  assert.deepEqual(
    rankProducts(catalog, query).map((entry) => entry.priceInCents),
    [2000, 5000, 9000],
  );
});
