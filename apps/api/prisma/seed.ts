import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  ["Écrans", "شاشات", "ecrans", "Monitor"],
  ["Batteries", "بطاريات", "batteries", "Battery"],
  ["Nappes de charge", "نابولون الشحن", "napolons-de-charge", "Cable"],
  ["Connecteurs de charge", "منافذ الشحن", "connecteurs-de-charge", "Cable"],
  ["Vitres caméra", "زجاج الكاميرا", "vitres-camera", "Camera"],
  ["Caméras", "كاميرات", "cameras", "Camera"],
  ["Haut-parleurs", "سماعات", "haut-parleurs", "Volume2"],
  ["Micros", "مايكروفونات", "micros", "Mic"],
  ["Boutons", "أزرار", "boutons", "Power"],
  ["Tirages SIM", "حافظة الشريحة", "tirages-sim", "CreditCard"],
  ["Châssis / Frames", "شاسيه", "chassis-frames", "Smartphone"],
  ["Caches arrière", "الكفر الخلفي", "caches-arriere", "Smartphone"],
  ["Capteurs d'empreinte", "حساس البصمة", "capteurs-empreinte", "Fingerprint"],
  ["Accessoires & outils", "إكسسوارات وأدوات", "accessoires-outils", "Wrench"],
] as const;

const brandDefinitions = [
  {
    name: "Apple",
    slug: "apple",
    popular: true,
    models: [
      ["iPhone 11", ["11", "A2111", "A2221"], 2019],
      ["iPhone 12", ["12", "A2172"], 2020],
      ["iPhone 13", ["13", "A2482"], 2021],
      ["iPhone 14", ["14", "A2649"], 2022],
    ],
  },
  {
    name: "Samsung",
    slug: "samsung",
    popular: true,
    models: [
      ["Galaxy A12", ["A12", "A125F"], 2020],
      ["Galaxy A32", ["A32", "A325F"], 2021],
      ["Galaxy A52", ["A52", "A525F"], 2021],
      ["Galaxy A14", ["A14", "A145F"], 2023],
    ],
  },
  {
    name: "Xiaomi",
    slug: "xiaomi",
    popular: true,
    models: [
      ["Redmi 9A", ["9A", "M2006C3LG"], 2020],
      ["Redmi 9C", ["9C", "M2006C3MG"], 2020],
      ["Redmi Note 11", ["Note 11", "2201117TG"], 2022],
      ["Redmi Note 12", ["Note 12", "23021RAAEG"], 2023],
    ],
  },
  {
    name: "OPPO",
    slug: "oppo",
    popular: true,
    models: [
      ["A16", ["OPPO A16", "CPH2269"], 2021],
      ["A57", ["OPPO A57", "CPH2387"], 2022],
    ],
  },
  {
    name: "Huawei",
    slug: "huawei",
    popular: true,
    models: [
      ["P30 Lite", ["MAR-LX1"], 2019],
      ["Y9 Prime 2019", ["STK-L21"], 2019],
    ],
  },
  {
    name: "Realme",
    slug: "realme",
    popular: true,
    models: [
      ["C11", ["RMX2185"], 2020],
      ["C21", ["RMX3201"], 2021],
    ],
  },
  {
    name: "Vivo",
    slug: "vivo",
    popular: true,
    models: [
      ["Y20", ["V2027"], 2020],
      ["Y21", ["V2111"], 2021],
    ],
  },
  {
    name: "Infinix",
    slug: "infinix",
    popular: true,
    models: [
      ["Hot 10", ["X682B"], 2020],
      ["Hot 12", ["X6817"], 2022],
    ],
  },
  {
    name: "Tecno",
    slug: "tecno",
    popular: true,
    models: [
      ["Spark 8", ["KG6"], 2021],
      ["Spark 10", ["KI5q"], 2023],
    ],
  },
] as const;

async function seed() {
  const categoryIds = new Map<string, string>();
  for (const [sortOrder, [name, nameAr, slug, icon]] of categories.entries()) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, nameAr, icon, sortOrder },
      create: { name, nameAr, slug, icon, sortOrder },
    });
    categoryIds.set(slug, category.id);
  }

  const modelIds = new Map<string, string>();
  for (const definition of brandDefinitions) {
    const brand = await prisma.brand.upsert({
      where: { slug: definition.slug },
      update: { name: definition.name, isPopular: definition.popular },
      create: { name: definition.name, slug: definition.slug, isPopular: definition.popular },
    });
    for (const [name, aliases, releaseYear] of definition.models) {
      const slug = `${definition.slug}-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-$/, "")}`;
      const model = await prisma.phoneModel.upsert({
        where: { slug },
        update: { name, aliases: [...aliases], releaseYear, isPopular: true, brandId: brand.id },
        create: {
          brandId: brand.id,
          name,
          slug,
          aliases: [...aliases],
          releaseYear,
          isPopular: true,
        },
      });
      modelIds.set(`${definition.slug}:${name}`, model.id);
    }
  }

  const products = [
    [
      "Écran Super AMOLED Samsung A52",
      "VP-ECR-0520",
      "ecrans",
      9800,
      12500,
      ["samsung:Galaxy A52"],
      true,
      true,
    ],
    [
      "Écran Incell iPhone 13",
      "VP-ECR-1301",
      "ecrans",
      14500,
      17500,
      ["apple:iPhone 13"],
      true,
      true,
    ],
    [
      "Batterie iPhone 12 haute capacité",
      "VP-BAT-1201",
      "batteries",
      4200,
      null,
      ["apple:iPhone 12"],
      true,
      false,
    ],
    [
      "Batterie Xiaomi Redmi Note 11",
      "VP-BAT-1102",
      "batteries",
      2800,
      3400,
      ["xiaomi:Redmi Note 11"],
      false,
      true,
    ],
    [
      "Nappe de charge OPPO A16",
      "VP-NAP-1601",
      "napolons-de-charge",
      1850,
      null,
      ["oppo:A16"],
      true,
      false,
    ],
    [
      "Connecteur de charge Samsung A12",
      "VP-CON-1201",
      "connecteurs-de-charge",
      950,
      null,
      ["samsung:Galaxy A12"],
      false,
      true,
    ],
    [
      "Vitre caméra iPhone 14",
      "VP-CAM-1401",
      "vitres-camera",
      800,
      null,
      ["apple:iPhone 14"],
      false,
      false,
    ],
    ["Batterie OPPO A57", "VP-BAT-5701", "batteries", 3100, null, ["oppo:A57"], false, true],
    [
      "Écran Redmi 9A / 9C",
      "VP-ECR-0901",
      "ecrans",
      3600,
      4200,
      ["xiaomi:Redmi 9A", "xiaomi:Redmi 9C"],
      true,
      true,
    ],
    [
      "Haut-parleur Samsung A32",
      "VP-SON-3201",
      "haut-parleurs",
      1250,
      null,
      ["samsung:Galaxy A32"],
      false,
      false,
    ],
  ] as const;

  for (const [
    index,
    [name, sku, categorySlug, priceDzd, comparePriceDzd, modelRefs, featured, bestSeller],
  ] of products.entries()) {
    const categoryId = categoryIds.get(categorySlug);
    if (!categoryId) throw new Error(`Seed category not found: ${categorySlug}`);
    const slug = `${sku.toLowerCase()}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-$/, "")}`;
    const quantity = 3 + (index % 10);
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        categoryId,
        priceDzd,
        comparePriceDzd,
        isFeatured: featured,
        isBestSeller: bestSeller,
        isNewArrival: index > 6,
      },
      create: {
        name,
        slug,
        sku,
        categoryId,
        description: `${name}. Pièce contrôlée avant expédition. Vérifiez le modèle exact avant de commander.`,
        descriptionAr: "قطعة غيار تم فحصها قبل الشحن. تأكد من الموديل قبل الطلب.",
        priceDzd,
        comparePriceDzd,
        stockQuantity: quantity,
        stockStatus: quantity <= 5 ? "LOW_STOCK" : "IN_STOCK",
        isFeatured: featured,
        isBestSeller: bestSeller,
        isNewArrival: index > 6,
      },
    });
    for (const modelRef of modelRefs) {
      const phoneModelId = modelIds.get(modelRef);
      if (!phoneModelId) throw new Error(`Seed model not found: ${modelRef}`);
      await prisma.productCompatibility.upsert({
        where: { productId_phoneModelId: { productId: product.id, phoneModelId } },
        update: {},
        create: { productId: product.id, phoneModelId },
      });
    }
  }

  const exampleReviews = [
    [
      "Ahmed B.",
      "Blida",
      "La référence écran correspond parfaitement à l'A52. Envoi rapide et pièce bien protégée.",
    ],
    [
      "Yacine K.",
      "Oran",
      "Commande facile, compatibilité confirmée par téléphone avant expédition.",
    ],
    ["Samir M.", "Alger", "Bon choix de pièces et livraison en point relais sans problème."],
  ];
  for (const [authorName, city, body] of exampleReviews) {
    await prisma.review.upsert({
      where: { id: `seed-review-${city.toLowerCase()}` },
      update: { authorName, city, body, rating: 5, isApproved: true },
      create: {
        id: `seed-review-${city.toLowerCase()}`,
        authorName,
        city,
        body,
        rating: 5,
        isApproved: true,
      },
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (email && passwordHash) {
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash, role: "SUPERADMIN" },
      create: { email, passwordHash, role: "SUPERADMIN" },
    });
  } else {
    console.info(
      "Admin user not seeded. Configure ADMIN_EMAIL and ADMIN_PASSWORD_HASH to enable admin login.",
    );
  }
  console.info(
    "Vision Pro catalog seed complete: 14 categories, 9 brands, 24 models, 10 products.",
  );
}

try {
  await seed();
} finally {
  await prisma.$disconnect();
}
