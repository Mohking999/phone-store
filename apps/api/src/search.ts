import type { Prisma } from "@prisma/client";

export const categorySynonyms: Record<string, string[]> = {
  ecrans: ["ecran", "écran", "lcd", "display", "oled", "amoled", "afficheur", "vitre avant"],
  batteries: ["batterie", "battery", "bat", "pile"],
  "napolons-de-charge": ["napolon", "flat", "flex", "charging flex", "nappe", "nappe de charge"],
  "connecteurs-de-charge": [
    "connecteur",
    "charging port",
    "prise de charge",
    "embout",
    "connecteur de charge",
  ],
  "vitres-camera": ["vitre caméra", "vitre camera", "camera glass", "lentille camera"],
  cameras: ["caméra", "camera", "cam", "appareil photo", "capteur photo"],
  "haut-parleurs": ["haut-parleur", "haut parleur", "speaker", "écouteur", "sonnerie", "buzzer"],
  micros: ["micro", "microphone", "mic"],
  boutons: ["bouton", "button", "flex bouton", "power", "volume"],
  "tirages-sim": ["tirage", "sim tray", "tiroir sim", "lecteur sim", "porte carte sim"],
  "chassis-frames": ["châssis", "chassis", "frame", "cadre", "contour"],
  "caches-arriere": ["cache", "coque arrière", "coque arriere", "back cover", "dos", "capot"],
  "capteurs-empreinte": ["empreinte", "fingerprint", "touch id", "capteur empreinte"],
};

const brandSynonyms: Record<string, string[]> = {
  apple: ["apple", "iphone", "ipad"],
  samsung: ["samsung", "galaxy"],
  xiaomi: ["xiaomi", "redmi", "poco", "mi"],
  oppo: ["oppo"],
  huawei: ["huawei", "honor"],
  realme: ["realme"],
  vivo: ["vivo"],
  infinix: ["infinix"],
  tecno: ["tecno"],
};

export function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removePhrase(source: string, phrase: string): string {
  return source
    .replace(new RegExp(`(^|\\s)${escapeRegExp(phrase)}(?=\\s|$)`, "i"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface ParsedSearch {
  brandSlugs: string[];
  modelNames: string[];
  categorySlugs: string[];
  keywords: string[];
  sku: string | null;
}

export function parseSearch(
  query: string,
  entities: {
    brands: Array<{ slug: string; name: string }>;
    models: Array<{ name: string; aliases: string[]; brand: { name: string } }>;
    categories: Array<{ slug: string; name: string; nameAr: string }>;
  },
): ParsedSearch {
  const normalized = normalizeSearch(query);
  const sku = normalized.replace(/\s/g, "").match(/^vp-[a-z]{3}-\d+(?:[a-z0-9-]*)?$/i)?.[0] ?? null;
  let remaining = normalized;

  const brandMatches = entities.brands
    .flatMap((brand) => {
      const terms = [brand.name, ...(brandSynonyms[brand.slug] ?? [])]
        .map(normalizeSearch)
        .filter((term) => term.length > 1);
      return terms.map((term) => ({ slug: brand.slug, term }));
    })
    .sort((a, b) => b.term.length - a.term.length);
  const brandSlugs: string[] = [];
  for (const entry of brandMatches) {
    if (containsPhrase(remaining, entry.term)) {
      if (!brandSlugs.includes(entry.slug)) brandSlugs.push(entry.slug);
      remaining = removePhrase(remaining, entry.term);
    }
  }

  const models = entities.models
    .flatMap((model) =>
      [model.name, ...model.aliases, `${model.brand.name} ${model.name}`].map((term) => ({
        name: model.name,
        term: normalizeSearch(term),
      })),
    )
    .sort((a, b) => b.term.length - a.term.length);
  const modelNames: string[] = [];
  for (const entry of models) {
    if (entry.term.length < 2 || !containsPhrase(remaining, entry.term)) continue;
    if (!modelNames.includes(entry.name)) modelNames.push(entry.name);
    remaining = removePhrase(remaining, entry.term);
  }

  const categoryMatches = entities.categories
    .flatMap((category) =>
      [category.name, category.nameAr, ...(categorySynonyms[category.slug] ?? [])].map((term) => ({
        slug: category.slug,
        term: normalizeSearch(term),
      })),
    )
    .sort((a, b) => b.term.length - a.term.length);
  const categorySlugs: string[] = [];
  for (const entry of categoryMatches) {
    if (!entry.term || !containsPhrase(remaining, entry.term)) continue;
    if (!categorySlugs.includes(entry.slug)) categorySlugs.push(entry.slug);
    remaining = removePhrase(remaining, entry.term);
  }

  return {
    brandSlugs,
    modelNames,
    categorySlugs,
    keywords: remaining.split(/\s+/).filter(Boolean),
    sku,
  };
}

function containsPhrase(source: string, phrase: string): boolean {
  return ` ${source} `.includes(` ${phrase} `);
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length] ?? 9;
}

export function buildStrictSearchWhere(
  parsed: ParsedSearch,
  brands: Array<{ id: string; slug: string }>,
  models: Array<{ id: string; name: string }>,
  categories: Array<{ id: string; slug: string }>,
  query: string,
): Prisma.ProductWhereInput {
  const filters: Prisma.ProductWhereInput[] = [{ isActive: true }];
  const brandIds = brands
    .filter((brand) => parsed.brandSlugs.includes(brand.slug))
    .map(({ id }) => id);
  const modelIds = models
    .filter((model) => parsed.modelNames.includes(model.name))
    .map(({ id }) => id);
  const categoryIds = categories
    .filter((category) => parsed.categorySlugs.includes(category.slug))
    .map(({ id }) => id);

  if (parsed.brandSlugs.length) {
    if (brandIds.length)
      filters.push({ compatibilities: { some: { phoneModel: { brandId: { in: brandIds } } } } });
    else return { id: "__no_brand_match__" };
  }
  if (parsed.modelNames.length) {
    if (modelIds.length)
      filters.push({ compatibilities: { some: { phoneModelId: { in: modelIds } } } });
    else return { id: "__no_model_match__" };
  }
  if (parsed.categorySlugs.length) {
    if (categoryIds.length) filters.push({ categoryId: { in: categoryIds } });
    else return { id: "__no_category_match__" };
  }

  const keywordTerms = parsed.keywords.filter((keyword) => keyword.length > 1);
  if (keywordTerms.length) {
    filters.push({
      AND: keywordTerms.map((keyword) => ({
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { sku: { contains: keyword, mode: "insensitive" } },
        ],
      })),
    });
  }
  if (!brandIds.length && !modelIds.length && !categoryIds.length && !keywordTerms.length) {
    filters.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  return { AND: filters };
}

export function fuzzyScore(value: string, query: string): number {
  const normalizedValue = normalizeSearch(value);
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedValue || !normalizedQuery) return 0;
  if (normalizedValue.includes(normalizedQuery)) return 1;
  const queryTokens = normalizedQuery.split(/\s+/);
  const valueTokens = normalizedValue.split(/\s+/);
  const matches = queryTokens.filter((queryToken) =>
    valueTokens.some(
      (valueToken) =>
        valueToken === queryToken ||
        (Math.min(valueToken.length, queryToken.length) >= 4 &&
          editDistance(valueToken, queryToken) <= (queryToken.length > 6 ? 2 : 1)),
    ),
  );
  return matches.length / queryTokens.length;
}
