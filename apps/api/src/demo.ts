import { Router, type Request } from "express";
import type { ProductSort, SearchSuggestion, StockStatus } from "@vision-pro/types";
import { wilayas } from "@vision-pro/types";
import { demoBrands, demoCategories, demoHome, demoModels, demoProducts } from "./demo-data.js";

export const demoRouter = Router();

function queryString(request: Request, key: string): string | undefined {
  const value = request.query[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function containsQuery(value: string, query: string): boolean {
  const normalized = value.toLocaleLowerCase();
  return query
    .toLocaleLowerCase()
    .split(/\s+/)
    .every((word) => normalized.includes(word));
}

function matchesSearch(product: (typeof demoProducts)[number], query: string): boolean {
  const compatibility = (product.compatibilities ?? [])
    .flatMap(({ phoneModel }) => [
      phoneModel.name,
      ...phoneModel.aliases,
      phoneModel.brand?.name ?? "",
    ])
    .join(" ");
  return containsQuery(
    [product.name, product.sku, product.category?.name ?? "", compatibility].join(" "),
    query,
  );
}

demoRouter.use((_request, response, next) => {
  response.setHeader("X-Catalog-Mode", "sample");
  next();
});

demoRouter.get("/health", (_request, response) =>
  response.json({ status: "ok", catalogMode: "sample", readOnly: true }),
);
demoRouter.get("/home", (_request, response) => response.json(demoHome));
demoRouter.get("/wilayas", (_request, response) => response.json(wilayas));
demoRouter.get("/categories", (_request, response) => response.json(demoCategories));
demoRouter.get("/brands", (_request, response) => response.json(demoBrands));
demoRouter.get("/brands/:slug/models", (request, response) => {
  const brand = demoBrands.find((item) => item.slug === request.params.slug);
  if (!brand) {
    response.status(404).json({ error: "Brand not found." });
    return;
  }
  response.json(demoModels.filter((model) => model.brandId === brand.id));
});

demoRouter.get("/products", (request, response) => {
  const page = Number(queryString(request, "page") ?? "1");
  const limit = Number(queryString(request, "limit") ?? "24");
  const minPrice = queryString(request, "minPrice");
  const maxPrice = queryString(request, "maxPrice");
  const sort = (queryString(request, "sort") ?? "popular") as ProductSort;
  const stock = queryString(request, "stock") as StockStatus | undefined;
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !["price_asc", "price_desc", "newest", "popular"].includes(sort) ||
    (stock && !["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(stock)) ||
    (minPrice !== undefined && (!/^\d+$/.test(minPrice) || Number(minPrice) < 0)) ||
    (maxPrice !== undefined && (!/^\d+$/.test(maxPrice) || Number(maxPrice) < 0)) ||
    (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice))
  ) {
    response.status(400).json({ error: "Invalid query parameters." });
    return;
  }

  let products = demoProducts.filter((product) => {
    const category = queryString(request, "category");
    const brand = queryString(request, "brand");
    const model = queryString(request, "model");
    const modelSlugs = product.compatibilities?.map(({ phoneModel }) => phoneModel.slug) ?? [];
    const brandSlugs =
      product.compatibilities?.map(({ phoneModel }) => phoneModel.brand?.slug) ?? [];
    return (
      (!category || product.category?.slug === category) &&
      (!brand || brandSlugs.includes(brand)) &&
      (!queryString(request, "model") ||
        (model !== undefined && modelSlugs.includes(model)) ||
        product.compatibilities?.some(
          ({ phoneModel }) =>
            model !== undefined && phoneModel.name.toLowerCase() === model.toLowerCase(),
        )) &&
      (!stock || product.stockStatus === stock) &&
      (minPrice === undefined || product.priceDzd >= Number(minPrice)) &&
      (maxPrice === undefined || product.priceDzd <= Number(maxPrice))
    );
  });

  products = products.sort((a, b) => {
    if (sort === "price_asc") return a.priceDzd - b.priceDzd;
    if (sort === "price_desc") return b.priceDzd - a.priceDzd;
    if (sort === "newest") return Number(b.isNewArrival) - Number(a.isNewArrival);
    return Number(b.isBestSeller) - Number(a.isBestSeller);
  });
  const total = products.length;
  response.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    items: products.slice((page - 1) * limit, page * limit),
  });
});

demoRouter.get("/products/sku/:sku", (request, response) => {
  const product = demoProducts.find(
    (item) => item.sku.toLowerCase() === String(request.params.sku).toLowerCase(),
  );
  if (!product) {
    response.status(404).json({ error: "Product not found." });
    return;
  }
  response.json(product);
});

demoRouter.get("/products/:slug", (request, response) => {
  const product = demoProducts.find((item) => item.slug === request.params.slug);
  if (!product) {
    response.status(404).json({ error: "Product not found." });
    return;
  }
  response.json(product);
});

demoRouter.get("/search", (request, response) => {
  const query = queryString(request, "q");
  if (!query || query.length < 2 || query.length > 120) {
    response.status(400).json({ error: "Search query must contain 2 to 120 characters." });
    return;
  }
  const items = demoProducts.filter((product) => matchesSearch(product, query));
  response.json({ total: items.length, items });
});

demoRouter.get("/search/suggest", (request, response) => {
  const query = queryString(request, "q");
  if (!query || query.length < 2 || query.length > 120) {
    response.json([]);
    return;
  }
  const suggestions: SearchSuggestion[] = [
    ...demoBrands
      .filter((brand) => containsQuery(brand.name, query))
      .map((brand) => ({
        group: "brands" as const,
        label: brand.name,
        to: `/products?brand=${encodeURIComponent(brand.slug)}`,
      })),
    ...demoModels
      .filter((model) =>
        containsQuery(`${model.name} ${model.aliases.join(" ")} ${model.brand?.name ?? ""}`, query),
      )
      .map((model) => ({
        group: "models" as const,
        label: `${model.brand?.name ?? ""} ${model.name}`.trim(),
        to: `/products?model=${encodeURIComponent(model.slug)}`,
      })),
    ...demoCategories
      .filter((category) => containsQuery(category.name, query))
      .map((category) => ({
        group: "categories" as const,
        label: category.name,
        to: `/products?category=${encodeURIComponent(category.slug)}`,
      })),
    ...demoProducts
      .filter((product) => matchesSearch(product, query))
      .map((product) => ({
        group: "products" as const,
        label: product.name,
        to: `/products/${encodeURIComponent(product.slug)}`,
        sku: product.sku,
        priceDzd: product.priceDzd,
      })),
  ];
  response.json(suggestions.slice(0, 8));
});

demoRouter.use((_request, response) =>
  response.status(503).json({
    error:
      "The sample catalog is read-only. Start the API with PostgreSQL for orders and administration.",
  }),
);
