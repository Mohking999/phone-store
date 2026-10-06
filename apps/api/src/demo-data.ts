import type { Brand, Category, HomePayload, PhoneModel, Product, Review } from "@vision-pro/types";

const demoId = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
const toSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const demoCategories: Category[] = [
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
].map(([name, nameAr, slug, icon], index) => ({
  id: demoId(index + 1),
  name: name!,
  nameAr: nameAr!,
  slug: slug!,
  icon: icon!,
  sortOrder: index,
}));

const brandDefinitions = [
  {
    name: "Apple",
    slug: "apple",
    models: [
      ["iPhone 12", ["12", "A2172"], 2020],
      ["iPhone 13", ["13", "A2482"], 2021],
      ["iPhone 14", ["14", "A2649"], 2022],
    ],
  },
  {
    name: "Samsung",
    slug: "samsung",
    models: [
      ["Galaxy A12", ["A12", "A125F"], 2020],
      ["Galaxy A32", ["A32", "A325F"], 2021],
      ["Galaxy A52", ["A52", "A525F"], 2021],
    ],
  },
  {
    name: "Xiaomi",
    slug: "xiaomi",
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
    models: [
      ["A16", ["OPPO A16", "CPH2269"], 2021],
      ["A57", ["OPPO A57", "CPH2387"], 2022],
    ],
  },
  {
    name: "Tecno",
    slug: "tecno",
    models: [
      ["Spark 8", ["KG6"], 2021],
      ["Spark 10", ["KI5q"], 2023],
    ],
  },
] as const;

export const demoBrands: Brand[] = brandDefinitions.map(({ name, slug }, index) => ({
  id: demoId(100 + index),
  name,
  slug,
  logoUrl: null,
  isPopular: true,
}));

export const demoModels: PhoneModel[] = brandDefinitions.flatMap((brand, brandIndex) =>
  brand.models.map(([name, aliases, releaseYear], modelIndex) => ({
    id: demoId(200 + brandIndex * 10 + modelIndex),
    brandId: demoBrands[brandIndex]!.id,
    name,
    slug: `${brand.slug}-${toSlug(name)}`,
    releaseYear,
    aliases: [...aliases],
    isPopular: true,
    brand: demoBrands[brandIndex],
  })),
);

const categoryBySlug = new Map(demoCategories.map((category) => [category.slug, category]));
const modelBySlug = new Map(demoModels.map((model) => [model.slug, model]));

function makeProduct(
  index: number,
  name: string,
  sku: string,
  categorySlug: string,
  priceDzd: number,
  comparePriceDzd: number | null,
  modelSlugs: string[],
  flags: { featured?: boolean; bestSeller?: boolean; newArrival?: boolean } = {},
): Product {
  const category = categoryBySlug.get(categorySlug);
  if (!category) throw new Error(`Sample category not found: ${categorySlug}`);
  const compatibilities = modelSlugs.map((slug) => {
    const phoneModel = modelBySlug.get(slug);
    if (!phoneModel) throw new Error(`Sample phone model not found: ${slug}`);
    return { phoneModel };
  });
  const stockQuantity = 3 + (index % 10);
  return {
    id: demoId(300 + index),
    name,
    slug: `${sku.toLowerCase()}-${toSlug(name)}`,
    sku: `${sku}-SAMPLE`,
    categoryId: category.id,
    description: `${name}. Exemple de catalogue : vérifiez le modèle exact avant de commander.`,
    descriptionAr: "مثال من الكتالوج. يرجى التأكد من الموديل قبل الطلب.",
    priceDzd,
    comparePriceDzd,
    stockQuantity,
    stockStatus: stockQuantity <= 5 ? "LOW_STOCK" : "IN_STOCK",
    isFeatured: flags.featured ?? false,
    isBestSeller: flags.bestSeller ?? false,
    isNewArrival: flags.newArrival ?? false,
    category,
    images: [],
    compatibilities,
  };
}

export const demoProducts: Product[] = [
  makeProduct(
    0,
    "Écran Super AMOLED Samsung A52",
    "VP-ECR-0520",
    "ecrans",
    9800,
    12500,
    ["samsung-galaxy-a52"],
    { featured: true, bestSeller: true },
  ),
  makeProduct(
    1,
    "Écran Incell iPhone 13",
    "VP-ECR-1301",
    "ecrans",
    14500,
    17500,
    ["apple-iphone-13"],
    { featured: true, bestSeller: true },
  ),
  makeProduct(
    2,
    "Batterie iPhone 12 haute capacité",
    "VP-BAT-1201",
    "batteries",
    4200,
    null,
    ["apple-iphone-12"],
    { featured: true },
  ),
  makeProduct(
    3,
    "Batterie Xiaomi Redmi Note 11",
    "VP-BAT-1102",
    "batteries",
    2800,
    3400,
    ["xiaomi-redmi-note-11"],
    { bestSeller: true },
  ),
  makeProduct(
    4,
    "Nappe de charge OPPO A16",
    "VP-NAP-1601",
    "napolons-de-charge",
    1850,
    null,
    ["oppo-a16"],
    { featured: true },
  ),
  makeProduct(
    5,
    "Connecteur de charge Samsung A12",
    "VP-CON-1201",
    "connecteurs-de-charge",
    950,
    null,
    ["samsung-galaxy-a12"],
    { bestSeller: true },
  ),
  makeProduct(
    6,
    "Vitre caméra iPhone 14",
    "VP-VIT-1401",
    "vitres-camera",
    800,
    null,
    ["apple-iphone-14"],
    { newArrival: true },
  ),
  makeProduct(7, "Batterie OPPO A57", "VP-BAT-5701", "batteries", 3100, null, ["oppo-a57"], {
    bestSeller: true,
    newArrival: true,
  }),
  makeProduct(
    8,
    "Écran Redmi 9A / 9C",
    "VP-ECR-0901",
    "ecrans",
    3600,
    4200,
    ["xiaomi-redmi-9a", "xiaomi-redmi-9c"],
    { featured: true, bestSeller: true, newArrival: true },
  ),
  makeProduct(
    9,
    "Haut-parleur Samsung A32",
    "VP-SON-3201",
    "haut-parleurs",
    1250,
    null,
    ["samsung-galaxy-a32"],
    { newArrival: true },
  ),
  makeProduct(
    10,
    "Écran LCD Xiaomi Redmi Note 12",
    "VP-ECR-1213",
    "ecrans",
    4800,
    null,
    ["xiaomi-redmi-note-12"],
    { featured: true, newArrival: true },
  ),
];

export const demoReviews: Review[] = [
  {
    id: "seed-review-blida",
    authorName: "Ahmed B.",
    city: "Blida",
    rating: 5,
    body: "La référence écran correspond parfaitement à l'A52. Envoi rapide et pièce bien protégée.",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "seed-review-oran",
    authorName: "Yacine K.",
    city: "Oran",
    rating: 5,
    body: "Commande facile, compatibilité confirmée par téléphone avant expédition.",
    createdAt: "2026-09-24T10:00:00.000Z",
  },
];

export const demoHome: HomePayload = {
  featuredProducts: demoProducts.filter((product) => product.isFeatured),
  bestSellers: demoProducts.filter((product) => product.isBestSeller),
  newArrivals: demoProducts.filter((product) => product.isNewArrival),
  popularBrands: demoBrands,
  popularModels: demoModels,
  categories: demoCategories,
  approvedReviews: demoReviews,
};
