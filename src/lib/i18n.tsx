import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "ar";

const dict = {
  fr: {
    tagline: "Pièces détachées mobiles",
    searchPlaceholder: "Ex : Samsung A52 écran, iPhone 13 batterie, réf. SKU…",
    search: "Rechercher",
    cart: "Panier",
    categories: "Catégories",
    brands: "Marques populaires",
    models: "Modèles populaires",
    featured: "En vedette",
    bestSellers: "Meilleures ventes",
    newArrivals: "Nouveautés",
    seeAll: "Tout voir",
    add: "Ajouter",
    inStock: "En stock",
    lowStock: "Stock faible",
    outOfStock: "Rupture",
    compatible: "Compatible",
    heroTitle: "La bonne pièce, pour le bon modèle.",
    heroSub: "Écrans, batteries, nappes de charge et plus — compatibilité vérifiée modèle par modèle, livrés dans les 58 wilayas.",
    why: "Pourquoi nous choisir",
    w1: "Compatibilité vérifiée", w1d: "Chaque pièce est liée aux modèles exacts qu'elle équipe.",
    w2: "Paiement à la livraison", w2d: "Vous payez uniquement à réception du colis.",
    w3: "Pièces testées", w3d: "Contrôle qualité avant chaque expédition.",
    w4: "Garantie", w4d: "Jusqu'à 6 mois selon la pièce.",
    delivery: "Livraison",
    deliveryText: "Livraison à domicile ou en point relais (stop desk) dans les 58 wilayas. 24–48 h à Alger, Oran, Constantine et Blida.",
    reviews: "Avis clients",
    footer: "Pièces détachées pour smartphones, livrées partout en Algérie.",
    results: "résultats",
    noResults: "Aucune pièce trouvée. Essayez un autre modèle ou une autre pièce.",
    sort: "Trier",
    sortRelevance: "Pertinence", sortPriceAsc: "Prix croissant", sortPriceDesc: "Prix décroissant", sortNew: "Nouveautés", sortBest: "Meilleures ventes",
    brand: "Marque", model: "Modèle", category: "Catégorie", all: "Tous",
    detected: "Détecté",
    qty: "Quantité",
    addToCart: "Ajouter au panier",
    buyNow: "Acheter maintenant",
    quickOrder: "Commande rapide",
    specs: "Caractéristiques",
    warranty: "Garantie",
    compatModels: "Modèles compatibles",
    related: "Produits similaires",
    emptyCart: "Votre panier est vide.",
    subtotal: "Sous-total", shipping: "Livraison", total: "Total",
    checkout: "Commander",
    fullName: "Nom complet", phone: "Téléphone", wilaya: "Wilaya", commune: "Commune", address: "Adresse",
    home: "À domicile", desk: "Stop desk", notes: "Remarque (optionnel)",
    confirm: "Confirmer la commande",
    cod: "Paiement à la livraison",
    orderOk: "Commande confirmée !",
    orderOkSub: "Nous vous appellerons pour confirmer. Numéro de commande :",
    continue: "Continuer mes achats",
    writeReview: "Laisser un avis",
    send: "Envoyer",
    reviewThanks: "Merci ! Votre avis sera publié après validation.",
    allParts: "Toutes les pièces",
    login: "Connexion",
  },
  ar: {
    tagline: "قطع غيار الهواتف",
    searchPlaceholder: "مثال: Samsung A52 écran، iPhone 13 batterie، رقم المرجع…",
    search: "بحث",
    cart: "السلة",
    categories: "الفئات",
    brands: "العلامات الشائعة",
    models: "الموديلات الشائعة",
    featured: "مختارات",
    bestSellers: "الأكثر مبيعاً",
    newArrivals: "وصل حديثاً",
    seeAll: "عرض الكل",
    add: "أضف",
    inStock: "متوفر",
    lowStock: "كمية محدودة",
    outOfStock: "غير متوفر",
    compatible: "متوافق",
    heroTitle: "القطعة الصحيحة، للموديل الصحيح.",
    heroSub: "شاشات، بطاريات، فليكس الشحن وغيرها — توافق مؤكد لكل موديل، توصيل إلى 58 ولاية.",
    why: "لماذا نحن",
    w1: "توافق مؤكد", w1d: "كل قطعة مرتبطة بالموديلات الدقيقة.",
    w2: "الدفع عند الاستلام", w2d: "تدفع فقط عند استلام الطرد.",
    w3: "قطع مُختبرة", w3d: "فحص الجودة قبل كل شحن.",
    w4: "ضمان", w4d: "حتى 6 أشهر حسب القطعة.",
    delivery: "التوصيل",
    deliveryText: "التوصيل للمنزل أو إلى مكتب التوصيل في 58 ولاية. 24–48 ساعة في الجزائر العاصمة، وهران، قسنطينة والبليدة.",
    reviews: "آراء الزبائن",
    footer: "قطع غيار الهواتف الذكية، توصيل لكل الجزائر.",
    results: "نتيجة",
    noResults: "لا توجد نتائج. جرّب موديلاً أو قطعة أخرى.",
    sort: "ترتيب",
    sortRelevance: "الأنسب", sortPriceAsc: "السعر تصاعدي", sortPriceDesc: "السعر تنازلي", sortNew: "الأحدث", sortBest: "الأكثر مبيعاً",
    brand: "العلامة", model: "الموديل", category: "الفئة", all: "الكل",
    detected: "تم التعرف",
    qty: "الكمية",
    addToCart: "أضف إلى السلة",
    buyNow: "اشترِ الآن",
    quickOrder: "طلب سريع",
    specs: "المواصفات",
    warranty: "الضمان",
    compatModels: "الموديلات المتوافقة",
    related: "منتجات مشابهة",
    emptyCart: "سلتك فارغة.",
    subtotal: "المجموع الفرعي", shipping: "التوصيل", total: "المجموع",
    checkout: "اطلب الآن",
    fullName: "الاسم الكامل", phone: "الهاتف", wilaya: "الولاية", commune: "البلدية", address: "العنوان",
    home: "للمنزل", desk: "مكتب التوصيل", notes: "ملاحظة (اختياري)",
    confirm: "تأكيد الطلب",
    cod: "الدفع عند الاستلام",
    orderOk: "تم تأكيد الطلب!",
    orderOkSub: "سنتصل بك للتأكيد. رقم الطلب:",
    continue: "مواصلة التسوق",
    writeReview: "اترك رأيك",
    send: "إرسال",
    reviewThanks: "شكراً! سيتم نشر رأيك بعد المراجعة.",
    allParts: "كل القطع",
    login: "دخول",
  },
} as const;

export type DictKey = keyof (typeof dict)["fr"];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }>({
  lang: "fr",
  setLang: () => {},
  t: (k) => dict.fr[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ar" || saved === "fr") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[lang][k] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

export const formatDZD = (n: number) => new Intl.NumberFormat("fr-DZ").format(n).replace(/\u202f|\u00a0/g, " ") + " DA";
