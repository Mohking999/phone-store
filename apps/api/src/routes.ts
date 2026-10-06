import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { wilayas } from "@vision-pro/types";
import type { AuthenticatedRequest } from "./auth.js";
import { requireAdmin } from "./auth.js";
import { prisma } from "./db.js";
import { buildStrictSearchWhere, fuzzyScore, normalizeSearch, parseSearch } from "./search.js";

export const router = Router();

const searchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many search requests. Please try again shortly." },
});
const orderLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many orders from this connection. Please try again later." },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  compatibilities: { include: { phoneModel: { include: { brand: true } } } },
};

const productAdminInclude = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  _count: { select: { compatibilities: true } },
};

const productFiltersSchema = z.object({
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  stock: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "popular"]).default("popular"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

const orderSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    phone: z.string().regex(/^0[567]\d{8}$/, "Use an Algerian mobile number such as 0551041751."),
    wilayaCode: z.coerce.number().int().min(1).max(58),
    commune: z.string().trim().min(2).max(120),
    deliveryType: z.enum(["HOME", "STOPDESK"]),
    notes: z.string().trim().max(1000).optional(),
    items: z
      .array(
        z
          .object({
            productId: z.string().uuid(),
            quantity: z.number().int().min(1).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict();

const adminProductFieldsSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    sku: z
      .string()
      .trim()
      .min(4)
      .max(64)
      .regex(/^[A-Z0-9-]+$/),
    categoryId: z.string().uuid(),
    description: z.string().trim().min(1).max(5000),
    descriptionAr: z.string().trim().max(5000).nullable().optional(),
    priceDzd: z.number().int().nonnegative(),
    comparePriceDzd: z.number().int().nonnegative().nullable().optional(),
    stockQuantity: z.number().int().nonnegative(),
    stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).optional(),
    isFeatured: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isNewArrival: z.boolean().default(false),
    isActive: z.boolean().default(true),
    images: z
      .array(
        z
          .object({
            url: z.string().url(),
            alt: z.string().max(240).nullable().optional(),
            sortOrder: z.number().int().nonnegative().default(0),
          })
          .strict(),
      )
      .max(20)
      .default([]),
  })
  .strict();

const adminProductSchema = adminProductFieldsSchema.refine(
  (product) =>
    product.stockStatus === undefined || product.stockStatus === stockStatus(product.stockQuantity),
  { path: ["stockStatus"], message: "Stock status must match stock quantity." },
);

const adminProductUpdateSchema = adminProductFieldsSchema
  .partial()
  .refine(
    (value) =>
      Object.keys(value).length > 0 &&
      (value.stockQuantity === undefined ||
        value.stockStatus === undefined ||
        value.stockStatus === stockStatus(value.stockQuantity)),
    "Provide valid product fields; stock status must match stock quantity.",
  );

function stockStatus(quantity: number): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= 5) return "LOW_STOCK";
  return "IN_STOCK";
}

function badQuery<S extends z.ZodTypeAny>(
  schema: S,
  query: Request["query"],
  response: Response,
): z.output<S> | undefined {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    response
      .status(400)
      .json({ error: "Invalid query parameters.", details: parsed.error.flatten() });
    return undefined;
  }
  return parsed.data;
}

function routeParam(request: Request, key: string, response: Response): string | undefined {
  const value = request.params[key];
  if (typeof value !== "string" || !value) {
    response.status(400).json({ error: `Invalid ${key} path parameter.` });
    return undefined;
  }
  return value;
}

function routeId(request: Request, response: Response): string | undefined {
  const value = routeParam(request, "id", response);
  if (!value) return undefined;
  const parsed = z.string().uuid().safeParse(value);
  if (!parsed.success) {
    response.status(400).json({ error: "Invalid record ID." });
    return undefined;
  }
  return parsed.data;
}

router.get("/health", (_request, response) => response.json({ status: "ok" }));

router.get("/brands", async (_request, response) => {
  const brands = await prisma.brand.findMany({
    orderBy: [{ isPopular: "desc" }, { name: "asc" }],
  });
  response.json(brands);
});

router.get("/brands/:slug/models", async (request, response) => {
  const slug = routeParam(request, "slug", response);
  if (!slug) return;
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { phoneModels: { orderBy: [{ isPopular: "desc" }, { name: "asc" }] } },
  });
  if (!brand) {
    response.status(404).json({ error: "Brand not found." });
    return;
  }
  response.json(
    brand.phoneModels.map((model) => ({
      ...model,
      brand: { id: brand.id, name: brand.name, slug: brand.slug },
    })),
  );
});

router.get("/categories", async (_request, response) => {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  response.json(categories);
});

router.get("/products", async (request, response) => {
  const filters = badQuery(productFiltersSchema, request.query, response);
  if (!filters) return;
  if (
    filters.minPrice !== undefined &&
    filters.maxPrice !== undefined &&
    filters.minPrice > filters.maxPrice
  ) {
    response.status(400).json({ error: "minPrice must not exceed maxPrice." });
    return;
  }

  const where = {
    AND: [
      { isActive: true },
      ...(filters.category ? [{ category: { slug: filters.category } }] : []),
      ...(filters.brand
        ? [{ compatibilities: { some: { phoneModel: { brand: { slug: filters.brand } } } } }]
        : []),
      ...(filters.model
        ? [{ compatibilities: { some: { phoneModel: { slug: filters.model } } } }]
        : []),
      ...(filters.stock ? [{ stockStatus: filters.stock }] : []),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? [
            {
              priceDzd: {
                ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
                ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
              },
            },
          ]
        : []),
    ],
  };
  const orderBy = {
    price_asc: { priceDzd: "asc" as const },
    price_desc: { priceDzd: "desc" as const },
    newest: { createdAt: "desc" as const },
    popular: { isBestSeller: "desc" as const },
  }[filters.sort];
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [orderBy, { name: "asc" }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  response.json({ total, page: filters.page, totalPages: Math.ceil(total / filters.limit), items });
});

router.get("/products/sku/:sku", async (request, response) => {
  const sku = routeParam(request, "sku", response);
  if (!sku) return;
  const product = await prisma.product.findUnique({
    where: { sku: sku.toUpperCase() },
    include: productInclude,
  });
  if (!product || !product.isActive) {
    response.status(404).json({ error: "Product not found." });
    return;
  }
  response.json(product);
});

router.get("/products/:slug", async (request, response) => {
  const slug = routeParam(request, "slug", response);
  if (!slug) return;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  if (!product || !product.isActive) {
    response.status(404).json({ error: "Product not found." });
    return;
  }
  response.json(product);
});

router.get("/search", searchLimiter, async (request, response) => {
  const query = z.string().trim().min(1).max(200).safeParse(request.query.q);
  if (!query.success) {
    response.status(400).json({ error: "Provide a search query between 1 and 200 characters." });
    return;
  }
  const normalized = normalizeSearch(query.data);
  const entities = await Promise.all([
    prisma.brand.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.phoneModel.findMany({
      select: { id: true, name: true, aliases: true, brand: { select: { name: true } } },
    }),
    prisma.category.findMany({ select: { id: true, slug: true, name: true, nameAr: true } }),
  ]);
  const [brands, models, categories] = entities;
  const parsed = parseSearch(query.data, { brands, models, categories });
  if (parsed.sku) {
    const skuProducts = await prisma.product.findMany({
      where: { isActive: true, sku: { startsWith: parsed.sku.toUpperCase() } },
      include: productInclude,
      take: 20,
    });
    if (skuProducts.length) {
      response.json({ total: skuProducts.length, items: skuProducts, parsed });
      return;
    }
  }

  const strictWhere = buildStrictSearchWhere(parsed, brands, models, categories, normalized);
  const strictProducts = await prisma.product.findMany({
    where: strictWhere,
    include: productInclude,
    take: 50,
    orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
  });
  if (strictProducts.length) {
    response.json({ total: strictProducts.length, items: strictProducts, parsed });
    return;
  }

  const fuzzyIds = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT DISTINCT p."id"
    FROM "Product" p
    LEFT JOIN "ProductCompatibility" pc ON pc."productId" = p."id"
    LEFT JOIN "PhoneModel" pm ON pc."phoneModelId" = pm."id"
    WHERE p."isActive" = TRUE
      AND (
        similarity(p."name", ${normalized}) > 0.28
        OR similarity(pm."name", ${normalized}) > 0.35
        OR p."sku" ILIKE ${`%${query.data.replace(/[%_]/g, "\\$&")}%`}
      )
    ORDER BY p."id"
    LIMIT 20
  `;
  const idOrder = new Map(fuzzyIds.map(({ id }, index) => [id, index]));
  const fuzzyFacetWhere = buildStrictSearchWhere(
    { ...parsed, keywords: [] },
    brands,
    models,
    categories,
    "",
  );
  const fuzzyProducts = await prisma.product.findMany({
    where: { AND: [fuzzyFacetWhere, { id: { in: [...idOrder.keys()] } }] },
    include: productInclude,
  });
  fuzzyProducts.sort(
    (a, b) =>
      fuzzyScore(
        `${a.name} ${a.compatibilities.map((item) => item.phoneModel.name).join(" ")}`,
        query.data,
      ) -
        fuzzyScore(
          `${b.name} ${b.compatibilities.map((item) => item.phoneModel.name).join(" ")}`,
          query.data,
        ) || (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0),
  );
  fuzzyProducts.reverse();
  response.json({ total: fuzzyProducts.length, items: fuzzyProducts, parsed });
});

router.get("/search/suggest", searchLimiter, async (request, response) => {
  const query = z.string().trim().min(2).max(120).safeParse(request.query.q);
  if (!query.success) {
    response.status(400).json({ error: "Type at least 2 characters to see suggestions." });
    return;
  }
  const needle = normalizeSearch(query.data);
  const [brands, models, categories, products] = await Promise.all([
    prisma.brand.findMany({
      where: { name: { contains: query.data, mode: "insensitive" } },
      take: 5,
    }),
    prisma.phoneModel.findMany({
      where: {
        OR: [
          { name: { contains: query.data, mode: "insensitive" } },
          { aliases: { hasSome: query.data.split(/\s+/) } },
        ],
      },
      include: { brand: true },
      take: 8,
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query.data, mode: "insensitive" } },
          { nameAr: { contains: query.data } },
        ],
      },
      take: 5,
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { startsWith: query.data.toUpperCase() } },
          { name: { contains: query.data, mode: "insensitive" } },
        ],
      },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 8,
    }),
  ]);

  const suggestions = [
    ...brands.map((brand) => ({
      group: "brands" as const,
      label: brand.name,
      to: `/products?brand=${encodeURIComponent(brand.slug)}`,
    })),
    ...models.map((model) => ({
      group: "models" as const,
      label: `${model.brand.name} ${model.name}`,
      to: `/products?model=${encodeURIComponent(model.slug)}`,
    })),
    ...categories.map((category) => ({
      group: "categories" as const,
      label: category.name,
      to: `/products?category=${encodeURIComponent(category.slug)}`,
    })),
    ...products.map((product) => ({
      group: "products" as const,
      label: product.name,
      to: `/product/${encodeURIComponent(product.slug)}`,
      imageUrl: product.images[0]?.url,
      sku: product.sku,
      priceDzd: product.priceDzd,
    })),
  ]
    .map((suggestion) => ({ ...suggestion, score: fuzzyScore(suggestion.label, needle) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score: _score, ...suggestion }) => suggestion);
  response.json(suggestions);
});

router.get("/home", async (_request, response) => {
  const [
    featuredProducts,
    bestSellers,
    newArrivals,
    popularBrands,
    popularModels,
    categories,
    approvedReviews,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.brand.findMany({
      where: { isPopular: true },
      take: 9,
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    }),
    prisma.phoneModel.findMany({
      where: { isPopular: true },
      include: { brand: true },
      take: 10,
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  response.json({
    featuredProducts,
    bestSellers,
    newArrivals,
    popularBrands,
    popularModels,
    categories,
    approvedReviews,
  });
});

router.get("/wilayas", (_request, response) => response.json(wilayas));

router.post("/orders", orderLimiter, async (request, response) => {
  const input = orderSchema.safeParse(request.body);
  if (!input.success) {
    response.status(400).json({
      error: "Check your contact details and order items.",
      details: input.error.flatten(),
    });
    return;
  }
  const wilaya = wilayas.find(({ code }) => code === input.data.wilayaCode);
  if (!wilaya) {
    response.status(400).json({ error: "Select a valid wilaya." });
    return;
  }
  const deliveryFee = input.data.deliveryType === "HOME" ? 600 : 400;
  const orderNumber = `VP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    const order = await prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: { id: { in: input.data.items.map(({ productId }) => productId) }, isActive: true },
      });
      if (products.length !== new Set(input.data.items.map(({ productId }) => productId)).size) {
        throw new OrderConflict("One or more selected products are unavailable.");
      }
      let subtotal = 0;
      const orderItems: Array<{ productId: string; quantity: number; unitPrice: number }> = [];
      for (const item of input.data.items) {
        const product = products.find(({ id }) => id === item.productId);
        if (!product) throw new OrderConflict("One or more selected products are unavailable.");
        const updated = await transaction.product.updateMany({
          where: { id: product.id, isActive: true, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (!updated.count) throw new OrderConflict(`${product.name} does not have enough stock.`);
        const updatedProduct = await transaction.product.findUniqueOrThrow({
          where: { id: product.id },
          select: { stockQuantity: true },
        });
        await transaction.product.update({
          where: { id: product.id },
          data: { stockStatus: stockStatus(updatedProduct.stockQuantity) },
        });
        subtotal += product.priceDzd * item.quantity;
        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.priceDzd,
        });
      }
      return transaction.order.create({
        data: {
          orderNumber,
          customerName: input.data.customerName,
          phone: input.data.phone,
          wilayaCode: wilaya.code,
          wilaya: wilaya.name,
          commune: input.data.commune,
          deliveryType: input.data.deliveryType,
          deliveryFee,
          totalDzd: subtotal + deliveryFee,
          notes: input.data.notes,
          items: { create: orderItems },
        },
        select: { orderNumber: true, totalDzd: true, deliveryFee: true },
      });
    });
    response.status(201).json(order);
  } catch (error) {
    if (error instanceof OrderConflict) {
      response.status(409).json({ error: error.message });
      return;
    }
    throw error;
  }
});

router.post("/admin/auth/login", loginLimiter, async (request, response) => {
  const input = z
    .object({
      email: z.string().trim().email().max(254),
      password: z.string().min(1).max(200),
    })
    .strict()
    .safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: "Enter a valid email and password." });
    return;
  }
  const admin = await prisma.adminUser.findUnique({
    where: { email: input.data.email.toLowerCase() },
  });
  if (!admin || !(await bcrypt.compare(input.data.password, admin.passwordHash))) {
    response.status(401).json({ error: "Email or password is incorrect." });
    return;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    response.status(500).json({ error: "Admin authentication is not configured." });
    return;
  }
  const expiresIn = z.enum(["1h", "7d", "30d"]).default("7d").parse(process.env.JWT_EXPIRES_IN);
  const token = jwt.sign({ email: admin.email, role: admin.role }, secret, {
    subject: admin.id,
    expiresIn,
  });
  response.json({ token, user: { id: admin.id, email: admin.email, role: admin.role } });
});

router.get("/admin/products", requireAdmin, async (request, response) => {
  const filters = badQuery(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(30),
    }),
    request.query,
    response,
  );
  if (!filters) return;
  const [total, items] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      include: productAdminInclude,
      orderBy: { updatedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  response.json({ total, page: filters.page, totalPages: Math.ceil(total / filters.limit), items });
});

router.post("/admin/products", requireAdmin, async (request, response) => {
  const input = adminProductSchema.safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: "Invalid product data.", details: input.error.flatten() });
    return;
  }
  const { images, ...data } = input.data;
  const product = await prisma.product.create({
    data: {
      ...data,
      stockStatus: data.stockStatus ?? stockStatus(data.stockQuantity),
      images: { create: images },
    },
    include: productAdminInclude,
  });
  response.status(201).json(product);
});

router.put("/admin/products/:id", requireAdmin, async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const input = adminProductUpdateSchema.safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: "Invalid product update.", details: input.error.flatten() });
    return;
  }
  const { images, ...data } = input.data;
  if (data.stockStatus !== undefined) {
    const existingStock = await prisma.product.findUnique({
      where: { id },
      select: { stockQuantity: true },
    });
    if (!existingStock) {
      response.status(404).json({ error: "Product not found." });
      return;
    }
    const resultingQuantity = data.stockQuantity ?? existingStock.stockQuantity;
    if (data.stockStatus !== stockStatus(resultingQuantity)) {
      response.status(400).json({
        error: `Stock status must be ${stockStatus(resultingQuantity)} for this quantity.`,
      });
      return;
    }
  }
  const product = await prisma.$transaction(async (transaction) => {
    if (images) await transaction.image.deleteMany({ where: { productId: id } });
    return transaction.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.stockQuantity !== undefined && data.stockStatus === undefined
          ? { stockStatus: stockStatus(data.stockQuantity) }
          : {}),
        ...(images ? { images: { create: images } } : {}),
      },
      include: productAdminInclude,
    });
  });
  response.json(product);
});

router.post("/admin/products/:id/compatibilities", requireAdmin, async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const input = z
    .object({ phoneModelIds: z.array(z.string().uuid()).max(500) })
    .strict()
    .safeParse(request.body);
  if (!input.success) {
    response
      .status(400)
      .json({ error: "Provide valid phone model IDs.", details: input.error.flatten() });
    return;
  }
  const ids = [...new Set(input.data.phoneModelIds)];
  const compatibilities = await prisma.$transaction(async (transaction) => {
    const [product, models] = await Promise.all([
      transaction.product.findUnique({ where: { id }, select: { id: true } }),
      transaction.phoneModel.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    ]);
    if (!product) throw new OrderConflict("Product not found.");
    if (models.length !== ids.length)
      throw new OrderConflict("One or more phone models do not exist.");
    for (const phoneModelId of ids) {
      await transaction.productCompatibility.upsert({
        where: { productId_phoneModelId: { productId: product.id, phoneModelId } },
        create: { productId: product.id, phoneModelId },
        update: {},
      });
    }
    return transaction.productCompatibility.findMany({
      where: { productId: product.id },
      include: { phoneModel: { include: { brand: true } } },
    });
  });
  response.json(compatibilities);
});

router.put("/admin/products/:id/stock", requireAdmin, async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const input = z
    .object({
      stockQuantity: z.number().int().nonnegative(),
      stockStatus: z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]),
    })
    .strict()
    .safeParse(request.body);
  if (!input.success) {
    response.status(400).json({
      error: "Provide a valid stock quantity and status.",
      details: input.error.flatten(),
    });
    return;
  }
  const status = stockStatus(input.data.stockQuantity);
  if (input.data.stockStatus !== status) {
    response.status(400).json({ error: `Stock status must be ${status} for this quantity.` });
    return;
  }
  const product = await prisma.product.update({
    where: { id },
    data: input.data,
    select: { id: true, stockQuantity: true, stockStatus: true },
  });
  response.json(product);
});

router.get("/admin/orders", requireAdmin, async (request, response) => {
  const filters = badQuery(
    z.object({
      status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(30),
    }),
    request.query,
    response,
  );
  if (!filters) return;
  const where = filters.status ? { status: filters.status } : {};
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
  ]);
  response.json({ total, page: filters.page, totalPages: Math.ceil(total / filters.limit), items });
});

router.put("/admin/orders/:id/status", requireAdmin, async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const input = z
    .object({ status: z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"]) })
    .strict()
    .safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: "Provide a valid order status." });
    return;
  }
  const order = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new OrderConflict("Order not found.");
    if (!isAllowedOrderTransition(existing.status, input.data.status)) {
      throw new OrderConflict(
        `Cannot change an order from ${existing.status} to ${input.data.status}.`,
      );
    }
    if (input.data.status === "RETURNED") {
      for (const item of existing.items) {
        const product = await transaction.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true },
        });
        if (!product) continue;
        const quantity = product.stockQuantity + item.quantity;
        await transaction.product.update({
          where: { id: item.productId },
          data: { stockQuantity: quantity, stockStatus: stockStatus(quantity) },
        });
      }
    }
    const updated = await transaction.order.updateMany({
      where: { id: existing.id, status: existing.status },
      data: { status: input.data.status },
    });
    if (!updated.count) {
      throw new OrderConflict("This order was updated by another user. Refresh and try again.");
    }
    return transaction.order.findUniqueOrThrow({
      where: { id: existing.id },
      include: { items: { include: { product: true } } },
    });
  });
  response.json(order);
});

router.put("/admin/reviews/:id/approve", requireAdmin, async (request, response) => {
  const id = routeId(request, response);
  if (!id) return;
  const input = z.object({ isApproved: z.boolean() }).strict().safeParse(request.body);
  if (!input.success) {
    response.status(400).json({ error: "Provide an approval value." });
    return;
  }
  const review = await prisma.review.update({
    where: { id },
    data: { isApproved: input.data.isApproved },
  });
  response.json(review);
});

export function isAllowedOrderTransition(
  current: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "RETURNED",
  next: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "RETURNED",
): boolean {
  const allowed: Record<typeof current, (typeof next)[]> = {
    PENDING: ["CONFIRMED", "RETURNED"],
    CONFIRMED: ["SHIPPED", "RETURNED"],
    SHIPPED: ["DELIVERED", "RETURNED"],
    DELIVERED: ["RETURNED"],
    RETURNED: [],
  };
  return allowed[current].includes(next);
}

class OrderConflict extends Error {}

router.use(
  (error: unknown, _request: Request, response: Response, _next: (error?: unknown) => void) => {
    if (error instanceof OrderConflict) {
      response
        .status(error.message === "Order not found." ? 404 : 409)
        .json({ error: error.message });
      return;
    }
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: "Invalid request.", details: error.flatten() });
      return;
    }
    const knownError = error as { code?: string; message?: string };
    if (knownError.code === "P2002") {
      response.status(409).json({ error: "A record with this SKU, slug, or name already exists." });
      return;
    }
    if (knownError.code === "P2025") {
      response.status(404).json({ error: "Requested record not found." });
      return;
    }
    console.error("[api] Request failed:", error);
    response.status(500).json({ error: "An unexpected server error occurred." });
  },
);
