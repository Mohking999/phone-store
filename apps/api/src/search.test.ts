import { describe, expect, it } from "vitest";
import { parseSearch } from "./search.js";

const entities = {
  brands: [
    { id: "samsung", name: "Samsung", slug: "samsung" },
    { id: "apple", name: "Apple", slug: "apple" },
    { id: "oppo", name: "OPPO", slug: "oppo" },
    { id: "xiaomi", name: "Xiaomi", slug: "xiaomi" },
  ],
  models: [
    { name: "Galaxy A52", aliases: ["A52", "A525F"], brand: { name: "Samsung" } },
    { name: "iPhone 13", aliases: ["13"], brand: { name: "Apple" } },
    { name: "Redmi Note 11", aliases: ["Note 11"], brand: { name: "Xiaomi" } },
    { name: "Redmi Note 12", aliases: ["Note 12"], brand: { name: "Xiaomi" } },
    { name: "A16", aliases: ["CPH2269"], brand: { name: "OPPO" } },
  ],
  categories: [
    { name: "Écrans", nameAr: "شاشات", slug: "ecrans" },
    { name: "Batteries", nameAr: "بطاريات", slug: "batteries" },
    { name: "Nappes de charge", nameAr: "نابولون الشحن", slug: "napolons-de-charge" },
  ],
};

describe("Vision Pro smart search parser", () => {
  it.each([
    ["Samsung A52 écran", "samsung", "Galaxy A52", "ecrans"],
    ["iPhone 13 batterie", "apple", "iPhone 13", "batteries"],
    ["OPPO A16 charging flex", "oppo", "A16", "napolons-de-charge"],
  ])("resolves %s into a strict brand/model/category", (query, brand, model, category) => {
    const parsed = parseSearch(query, entities);

    expect(parsed.brandSlugs).toContain(brand);
    expect(parsed.modelNames).toContain(model);
    expect(parsed.categorySlugs).toContain(category);
    expect(parsed.keywords).toEqual([]);
  });

  it("chooses the longest model match before shorter aliases", () => {
    const parsed = parseSearch("Redmi Note 12 batterie", entities);
    expect(parsed.modelNames).toEqual(["Redmi Note 12"]);
  });

  it("recognizes product SKU searches", () => {
    expect(parseSearch("vp-ecr-0520", entities).sku).toBe("vp-ecr-0520");
  });
});
