import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import screenImg from "@/assets/cat-screen.jpg";
import batteryImg from "@/assets/cat-battery.jpg";
import flexImg from "@/assets/cat-flex.jpg";

export type Brand = { id: string; name: string; slug: string; popular: boolean; sort: number };
export type Model = { id: string; name: string; slug: string; brand_id: string; aliases: string[]; popular: boolean };
export type Category = { id: string; slug: string; name_fr: string; name_ar: string; keywords: string[]; sort: number };
export type Product = {
  id: string; sku: string; name: string; slug: string; description: string | null;
  category_id: string; brand_id: string | null; price: number; compare_price: number | null; stock: number;
  quality: string | null; warranty: string | null; specs: Record<string, string>; images: string[];
  featured: boolean; sold_count: number; created_at: string; active: boolean;
  model_ids: string[];
};

export const metaQuery = queryOptions({
  queryKey: ["meta"],
  queryFn: async () => {
    const [b, m, c] = await Promise.all([
      supabase.from("brands").select("*").order("sort"),
      supabase.from("phone_models").select("*").order("name"),
      supabase.from("categories").select("*").order("sort"),
    ]);
    if (b.error) throw b.error;
    if (m.error) throw m.error;
    if (c.error) throw c.error;
    return { brands: b.data as Brand[], models: m.data as Model[], categories: c.data as Category[] };
  },
  staleTime: 5 * 60_000,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_compatibility(model_id)")
      .eq("active", true)
      .limit(5000);
    if (error) throw error;
    return (data ?? []).map(({ product_compatibility, ...p }) => ({
      ...p,
      specs: (p.specs ?? {}) as Record<string, string>,
      model_ids: (product_compatibility ?? []).map((x: { model_id: string }) => x.model_id),
    })) as Product[];
  },
  staleTime: 60_000,
});

export const reviewsQuery = (productId: string | null) =>
  queryOptions({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      let q = supabase.from("reviews").select("*").eq("approved", true).order("created_at", { ascending: false }).limit(20);
      q = productId ? q.eq("product_id", productId) : q.is("product_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

export const shippingQuery = queryOptions({
  queryKey: ["shipping"],
  queryFn: async () => {
    const { data, error } = await supabase.from("shipping_rates").select("*").order("wilaya_code");
    if (error) throw error;
    return data;
  },
  staleTime: 10 * 60_000,
});

const catImages: Record<string, string> = {
  ecrans: screenImg, "vitres-arriere": screenImg, chassis: screenImg,
  batteries: batteryImg,
};
export function productImage(p: Pick<Product, "images" | "category_id">, cats: Category[]) {
  if (p.images?.[0]) return p.images[0];
  const slug = cats.find((c) => c.id === p.category_id)?.slug ?? "";
  return catImages[slug] ?? flexImg;
}
export const categoryImage = (slug: string) => catImages[slug] ?? flexImg;

/* ---------------- Smart search ---------------- */

export const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u0600-\u06ff]+/g, " ").trim();

function lev(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length] ?? 9;
}
const fuzzyEq = (a: string, b: string) => a === b || (a.length >= 4 && b.length >= 4 && lev(a, b) <= (a.length > 6 ? 2 : 1));

const brandAliases: Record<string, string[]> = {
  apple: ["iphone", "ipad", "apple"],
  samsung: ["samsung", "galaxy", "sam"],
  xiaomi: ["xiaomi", "redmi", "poco", "mi"],
};

const extraCatKeywords: Record<string, string[]> = {
  ecrans: ["lcd", "oled", "amoled", "incell", "شاشة", "شاشات"],
  batteries: ["batterie", "batteries", "battery", "بطارية"],
  "flex-charge": ["flex", "nappe", "charging"],
  connecteurs: ["connecteur", "port"],
};

export type Detection = { brand?: Brand; model?: Model; category?: Category; keywords: string[]; sku?: boolean };

export function detect(q: string, meta: { brands: Brand[]; models: Model[]; categories: Category[] }): Detection {
  let text = ` ${norm(q)} `;
  const out: Detection = { keywords: [] };

  // model: longest matching name/alias
  let best: { m: Model; len: number } | null = null;
  for (const m of meta.models) {
    const brand = meta.brands.find((b) => b.id === m.brand_id);
    const full = norm(m.name);
    const stripped = norm(m.name.replace(/^(galaxy|iphone|redmi)\s+/i, ""));
    const cands = [full, ...m.aliases.map(norm), brand ? `${norm(brand.name)} ${full}` : ""].filter(Boolean);
    if (/\d/.test(stripped) && stripped.split(" ").length > 1) cands.push(stripped);
    for (const c of cands) {
      if (c.length >= 2 && text.includes(` ${c} `) && (!best || c.length > best.len)) best = { m, len: c.length };
    }
  }
  if (best) {
    out.model = best.m;
    out.brand = meta.brands.find((b) => b.id === best!.m.brand_id);
    const n = norm(best.m.name);
    for (const piece of [n, ...best.m.aliases.map(norm)]) text = text.replace(` ${piece} `, " ");
  }

  const tokens = text.split(" ").filter(Boolean);
  const rest: string[] = [];
  for (const tok of tokens) {
    // brand
    const b = meta.brands.find((br) => norm(br.name) === tok || (brandAliases[br.slug] ?? []).includes(tok));
    if (b) {
      out.brand ??= b;
      continue;
    }
    // category
    const c = meta.categories.find((cat) => {
      const kws = [...cat.keywords, ...(extraCatKeywords[cat.slug] ?? []), cat.name_fr, cat.name_ar].map(norm);
      return kws.some((k) => fuzzyEq(tok, k) || (tok.length >= 4 && k.startsWith(tok)));
    });
    if (c && !out.category) {
      out.category = c;
      continue;
    }
    rest.push(tok);
  }
  out.keywords = rest;
  return out;
}

export function searchProducts(products: Product[], q: string, meta: Parameters<typeof detect>[1]) {
  const qn = norm(q);
  if (!qn) return { results: products.map((p) => ({ p, score: 0 })), detection: { keywords: [] } as Detection };
  const d = detect(q, meta);
  const qCompact = q.toLowerCase().replace(/[^a-z0-9]/g, "");
  const results: { p: Product; score: number }[] = [];
  for (const p of products) {
    let score = 0;
    const skuC = p.sku.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (qCompact.length >= 3 && skuC.includes(qCompact)) {
      results.push({ p, score: 1000 });
      continue;
    }
    if (d.model) {
      if (!p.model_ids.includes(d.model.id)) continue;
      score += 60;
    } else if (d.brand) {
      const brandModelIds = meta.models.filter((m) => m.brand_id === d.brand!.id).map((m) => m.id);
      if (p.brand_id !== d.brand.id && !p.model_ids.some((id) => brandModelIds.includes(id))) continue;
      score += 20;
    }
    if (d.category) {
      if (p.category_id !== d.category.id) continue;
      score += 30;
    }
    const hay = norm(`${p.name} ${p.description ?? ""} ${p.sku}`).split(" ");
    let kwHits = 0;
    for (const k of d.keywords) if (hay.some((h) => h.includes(k) || fuzzyEq(k, h))) kwHits++;
    score += kwHits * 8;
    if (d.keywords.length && kwHits === 0 && !d.model && !d.category && !d.brand) continue;
    score += Math.min(p.sold_count, 200) / 50;
    results.push({ p, score });
  }
  results.sort((a, b) => b.score - a.score);
  return { results, detection: d };
}

export function suggestions(q: string, products: Product[], meta: Parameters<typeof detect>[1]) {
  const qn = norm(q);
  if (qn.length < 2) return { models: [], categories: [], products: [] };
  const models = meta.models
    .filter((m) => {
      const b = meta.brands.find((x) => x.id === m.brand_id);
      const s = norm(`${b?.name ?? ""} ${m.name} ${m.aliases.join(" ")}`);
      return qn.split(" ").every((t) => s.includes(t) || s.split(" ").some((w) => fuzzyEq(t, w)));
    })
    .slice(0, 5);
  const { results, detection } = searchProducts(products, q, meta);
  return {
    models,
    categories: detection.model && !detection.category ? meta.categories.slice(0, 4).map((c) => ({ c, model: detection.model! })) : [],
    products: results.slice(0, 5).map((r) => r.p),
    detection,
  };
}

export function stockState(stock: number) {
  if (stock <= 0) return "out" as const;
  if (stock <= 5) return "low" as const;
  return "in" as const;
}
