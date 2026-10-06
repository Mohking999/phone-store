import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Battery,
  Camera,
  Cable,
  Fingerprint,
  Mic,
  Monitor,
  Package,
  Smartphone,
  Volume2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../../api/client";
import workshopPhoto from "../../assets/04 LE GESTE JUSTE.webp";
import batteryPhoto from "../../assets/cat-battery.jpg";
import flexPhoto from "../../assets/cat-flex.jpg";
import screenPhoto from "../../assets/cat-screen.jpg";
import repairPhoto from "../../assets/hero.jpg";
import heroWhatsappIcon from "../../assets/figma/hero-whatsapp.svg";
import backCoverPhoto from "../../../pic/cache arrire.jfif";
import buttonPhoto from "../../../pic/buttons for phone peice.jfif";
import fingerprintPhoto from "../../../pic/finger print.jfif";
import framePhoto from "../../../pic/frame.jfif";
import microphonePhoto from "../../../pic/microphone.jpg";
import simTrayPhoto from "../../../pic/tirage sim.jfif";
import speakerPhoto from "../../../pic/haut parler.jfif";
import { ApiErrorNotice, PageLoader, ProductGrid, SearchBar } from "./common";

const heroSearchExamples = [
  { brand: "Samsung", model: "A52", part: "Écran", query: "Samsung A52 écran" },
  { brand: "Xiaomi / Redmi", model: "Note 12", part: "Écran", query: "Redmi Note 12 LCD" },
  { brand: "Apple / iPhone", model: "iPhone 13", part: "Batterie", query: "iPhone 13 batterie" },
];

const popularSearches = ["iPhone 13 batterie", "Redmi Note 12 LCD", "OPPO A16 napolon"];

const modelOptions: Record<string, string[]> = {
  Samsung: ["Galaxy A12", "Galaxy A32", "Galaxy A52"],
  "Apple / iPhone": ["iPhone 12", "iPhone 13", "iPhone 14"],
  "Xiaomi / Redmi": ["Redmi 9A", "Redmi Note 11", "Redmi Note 12"],
  OPPO: ["A16", "A38", "A78"],
  Realme: ["C11", "C21", "C35"],
  Huawei: ["Y7", "Y9", "P30"],
  Honor: ["X7", "X8", "50 Lite"],
  Infinix: ["Hot 12", "Note 12", "Smart 7"],
  Tecno: ["Spark 8", "Camon 18"],
};

const categoryItems: {
  slug: string;
  name: string;
  arabic: string;
  count: string;
  kind: "feature" | "small" | "icon";
  tone: string;
  icon: LucideIcon;
  image?: string;
}[] = [
  {
    slug: "ecrans",
    name: "Écrans",
    arabic: "شاشات",
    count: "+120 réf.",
    kind: "feature",
    tone: "screen",
    icon: Monitor,
    image: screenPhoto,
  },
  {
    slug: "batteries",
    name: "Batteries",
    arabic: "بطاريات",
    count: "+80 réf.",
    kind: "feature",
    tone: "battery",
    icon: Battery,
    image: batteryPhoto,
  },
  {
    slug: "napolons-de-charge",
    name: "Napolons",
    arabic: "نابولون الشحن",
    count: "+65 réf.",
    kind: "feature",
    tone: "flex",
    icon: Cable,
    image: flexPhoto,
  },
  {
    slug: "connecteurs",
    name: "Connecteurs",
    arabic: "منافذ الشحن",
    count: "+48 réf.",
    kind: "feature",
    tone: "connector",
    icon: Zap,
    image: flexPhoto,
  },
  {
    slug: "vitre-camera",
    name: "Vitre caméra",
    arabic: "زجاج الكاميرا",
    count: "+32 réf.",
    kind: "small",
    tone: "camera-glass",
    icon: Camera,
    image: screenPhoto,
  },
  {
    slug: "cameras",
    name: "Caméras",
    arabic: "كاميرات",
    count: "+44 réf.",
    kind: "small",
    tone: "camera",
    icon: Camera,
    image: repairPhoto,
  },
  {
    slug: "haut-parleurs",
    name: "Haut-parleurs",
    arabic: "مكبرات الصوت",
    count: "+24 réf.",
    kind: "icon",
    tone: "",
    icon: Volume2,
    image: speakerPhoto,
  },
  {
    slug: "micros",
    name: "Micros",
    arabic: "ميكروفونات",
    count: "+18 réf.",
    kind: "icon",
    tone: "",
    icon: Mic,
    image: microphonePhoto,
  },
  {
    slug: "boutons",
    name: "Boutons",
    arabic: "أزرار",
    count: "+20 réf.",
    kind: "icon",
    tone: "",
    icon: Smartphone,
    image: buttonPhoto,
  },
  {
    slug: "tirages-sim",
    name: "Tirages SIM",
    arabic: "أدراج الشرائح",
    count: "+16 réf.",
    kind: "icon",
    tone: "",
    icon: Smartphone,
    image: simTrayPhoto,
  },
  {
    slug: "frames",
    name: "Châssis / Frames",
    arabic: "هياكل",
    count: "+30 réf.",
    kind: "icon",
    tone: "",
    icon: Package,
    image: framePhoto,
  },
  {
    slug: "cache-arriere",
    name: "Cache arrière",
    arabic: "الغطاء الخلفي",
    count: "+40 réf.",
    kind: "icon",
    tone: "",
    icon: Smartphone,
    image: backCoverPhoto,
  },
  {
    slug: "capteur-empreinte",
    name: "Capteur empreinte",
    arabic: "مستشعر البصمة",
    count: "+14 réf.",
    kind: "icon",
    tone: "",
    icon: Fingerprint,
    image: fingerprintPhoto,
  },
  {
    slug: "autres-pieces",
    name: "Autres pièces",
    arabic: "قطع أخرى",
    count: "+90 réf.",
    kind: "icon",
    tone: "",
    icon: Package,
  },
];

const sampleShelves = [
  {
    key: "featured",
    title: "En vedette",
    caption: "Références choisies",
    products: [
      {
        name: "Écran LCD compatible Redmi 9A / 9C",
        compatibility: "Compatible : Redmi 9A, Redmi 9C",
        reference: "VP-ECR-0912",
        price: "4 200",
        category: "ecrans",
        stock: "En stock",
      },
      {
        name: "Écran OLED compatible iPhone 13",
        compatibility: "Compatible : iPhone 13",
        reference: "VP-ECR-1310",
        price: "14 500",
        category: "ecrans",
        stock: "Stock limité",
      },
      {
        name: "Écran Super AMOLED compatible Samsung A52",
        compatibility: "Compatible : A525F / A52",
        reference: "VP-ECR-5204",
        price: "9 800",
        category: "ecrans",
        stock: "En stock",
      },
      {
        name: "Batterie compatible iPhone 13",
        compatibility: "Compatible : iPhone 13",
        reference: "VP-BAT-1311",
        price: "5 600",
        category: "batteries",
        stock: "En stock",
      },
    ],
  },
  {
    key: "best-sellers",
    title: "Meilleures ventes",
    caption: "Pour l’atelier",
    products: [
      {
        name: "Batterie compatible Redmi Note 11",
        compatibility: "5000 mAh · compatible : Note 11",
        reference: "VP-BAT-1107",
        price: "3 100",
        category: "batteries",
        stock: "En stock",
      },
      {
        name: "Napolon de charge compatible OPPO A16",
        compatibility: "Compatible : OPPO A16",
        reference: "VP-FLX-1614",
        price: "1 400",
        category: "napolons-de-charge",
        stock: "Stock limité",
      },
      {
        name: "Connecteur de charge compatible Samsung A12",
        compatibility: "Compatible : Samsung A12",
        reference: "VP-CON-1203",
        price: "900",
        category: "connecteurs",
        stock: "En stock",
      },
      {
        name: "Caméra arrière compatible Redmi Note 12",
        compatibility: "Compatible : Redmi Note 12",
        reference: "VP-CAM-1208",
        price: "4 500",
        category: "cameras",
        stock: "En stock",
      },
    ],
  },
  {
    key: "new-arrivals",
    title: "Nouveautés",
    caption: "Arrivages atelier",
    products: [
      {
        name: "Vitre caméra arrière compatible iPhone 12 Pro Max",
        compatibility: "Compatible : iPhone 12 Pro Max",
        reference: "VP-VIT-1201",
        price: "1 200",
        category: "vitre-camera",
        stock: "Stock limité",
      },
      {
        name: "Haut-parleur compatible Samsung A32",
        compatibility: "Compatible : Samsung A32",
        reference: "VP-SPK-3202",
        price: "1 100",
        category: "haut-parleurs",
        stock: "En stock",
      },
      {
        name: "Napolon de charge compatible OPPO A78",
        compatibility: "Compatible : OPPO A78",
        reference: "VP-FLX-7811",
        price: "1 600",
        category: "napolons-de-charge",
        stock: "En stock",
      },
      {
        name: "Écran LCD compatible Redmi Note 12",
        compatibility: "Compatible : Redmi Note 12",
        reference: "VP-ECR-1213",
        price: "4 800",
        category: "ecrans",
        stock: "En stock",
      },
    ],
  },
] as const;

const imageByCategory: Record<string, string> = {
  ecrans: screenPhoto,
  "vitre-camera": screenPhoto,
  batteries: batteryPhoto,
  "napolons-de-charge": flexPhoto,
  connecteurs: flexPhoto,
  cameras: repairPhoto,
};

export function HomePage() {
  const { hash } = useLocation();
  const [heroExampleIndex, setHeroExampleIndex] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState("Tecno");
  const [selectedModel, setSelectedModel] = useState("Spark 8");
  const [selectedPart, setSelectedPart] = useState("Écran");
  const { data, isPending, error, refetch, isRefetching } = useQuery({
    queryKey: ["home"],
    queryFn: api.home,
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      const search = document.querySelector(".legacy-storefront .hero-search");
      if (document.activeElement?.id === "hero-search" || search?.matches(":hover")) {
        return;
      }
      setHeroExampleIndex((index) => (index + 1) % heroSearchExamples.length);
    }, 3600);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "instant" });
  }, [hash]);

  const heroExample = heroSearchExamples[heroExampleIndex]!;
  const models = modelOptions[selectedBrand] ?? [];
  const shelves = [
    {
      key: "featured",
      title: "En vedette",
      caption: "Références choisies",
      products: data?.featuredProducts ?? [],
    },
    {
      key: "best-sellers",
      title: "Meilleures ventes",
      caption: "Pour l’atelier",
      products: data?.bestSellers ?? [],
    },
    {
      key: "new-arrivals",
      title: "Nouveautés",
      caption: "Arrivages atelier",
      products: data?.newArrivals ?? [],
    },
  ];

  return (
    <main id="main">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-glow hero-glow-blue" aria-hidden="true" />
        <div className="hero-glow hero-glow-mint" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">
              <i />
              <span>Banc de précision</span>
              <span className="eyebrow-arabic" lang="ar" dir="rtl">
                مختبر الدقة
              </span>
            </p>
            <h1 id="hero-title">
              La bonne
              <br />
              pièce.
              <br />
              Au bon
              <br />
              modèle.
            </h1>
            <p className="hero-description">
              Pièces détachées téléphone, références claires et compatibilité vérifiée avant chaque
              commande.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/products">
                Explorer le catalogue
              </Link>
              <a
                className="button button-quiet"
                href="https://wa.me/213551041751"
                target="_blank"
                rel="noreferrer"
              >
                <img src={heroWhatsappIcon} alt="" aria-hidden="true" />
                Commander par WhatsApp
              </a>
            </div>
          </div>
          <div className="hero-figure">
            <div className="hero-photo-frame">
              <img
                src={repairPhoto}
                alt="Pièces détachées de téléphone disposées sur un tapis antistatique"
                width={1600}
                height={1008}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <div className="hero-photo-badge">
              <span className="hero-photo-check" aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Compatibilité vérifiée</strong>
                <small>La bonne pièce, au bon modèle</small>
              </span>
            </div>
            <div className="hero-search" id="recherche">
              <SearchBar hero placeholder={`${heroExample.query}…`} />
              <div className="hero-anatomy" aria-hidden="true">
                {[
                  ["MARQUE", heroExample.brand],
                  ["MODÈLE", heroExample.model],
                  ["PIÈCE", heroExample.part],
                ].map(([label, value]) => (
                  <span className="anatomy-chip" key={`${label}-${value}`}>
                    <b>{label}</b>
                    <span>{value}</span>
                  </span>
                ))}
              </div>
              <div className="popular-searches" aria-label="Recherches populaires">
                {popularSearches.map((search) => (
                  <Link
                    key={search}
                    to={`/products?q=${encodeURIComponent(search)}`}
                    aria-label={`Rechercher ${search}`}
                  >
                    {search}
                  </Link>
                ))}
              </div>
              <p className="search-note">
                <i />
                Décomposez votre recherche. Nous confirmons la référence par téléphone.
              </p>
            </div>
          </div>
          <a className="scroll-cue" href="#catalogue">
            <span>Défiler pour chercher</span>
            <i />
          </a>
        </div>
      </section>

      <section
        className="catalogue-section section-shell"
        id="catalogue"
        aria-labelledby="categories-title"
      >
        <div className="content-width">
          <div className="section-intro category-intro">
            <div>
              <p className="eyebrow">
                <i />
                <span>01 / Le catalogue</span>
                <span className="eyebrow-arabic" lang="ar" dir="rtl">
                  الأصناف الرئيسية
                </span>
              </p>
              <h2 id="categories-title">Chaque pièce a sa place.</h2>
            </div>
            <p className="section-copy">
              Écrans, batteries, flex et pièces d’atelier pour les marques les plus utilisées en
              Algérie. Un rayon lisible avant même de demander une référence.
            </p>
            <span className="section-rule" aria-hidden="true" />
          </div>
          <div className="category-grid">
            {categoryItems.map(({ slug, name, arabic, count, kind, tone, icon: Icon, image }) => (
              <Link
                key={slug}
                className={`category-card ${kind === "icon" && image ? "category-photo-card" : `category-${kind}`}${tone ? ` category-tone-${tone}` : ""}`}
                to={`/products?category=${encodeURIComponent(slug)}`}
              >
                {image ? (
                  <img
                    className="category-photo"
                    src={image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    aria-hidden="true"
                  />
                ) : (
                  <Icon className="category-icon" size={36} strokeWidth={1.5} aria-hidden="true" />
                )}
                <span className="category-copy">
                  <strong>{name}</strong>
                  <span className="category-arabic" lang="ar" dir="rtl">
                    {arabic}
                  </span>
                </span>
                <span className="category-count">{count}</span>
              </Link>
            ))}
            <Link className="model-category" to="#compatibilite">
              <span className="mini-eyebrow">La sortie du rayon</span>
              <strong>Chercher par modèle</strong>
              <span lang="ar" dir="rtl">
                البحث بالموديل
              </span>
              <small>Samsung · Apple · Xiaomi · +6</small>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="compatibility-section section-shell"
        id="compatibilite"
        aria-labelledby="compatibility-title"
      >
        <div className="content-width compatibility-layout">
          <div className="compatibility-copy">
            <p className="eyebrow">
              <i />
              <span>02 / La compatibilité</span>
              <span className="eyebrow-arabic" lang="ar" dir="rtl">
                التوافق الدقيق
              </span>
            </p>
            <h2 id="compatibility-title">Trouvez la pièce exacte de votre téléphone.</h2>
            <p>
              Marque, modèle, pièce. Trois choix simples pour éviter la mauvaise référence — et un
              humain disponible pour confirmer.
            </p>
            <div className="gradient-rule" aria-hidden="true" />
            <aside className="reading-example">
              <strong>Exemple de lecture</strong>
              <p>Écran LCD Redmi 9A / 9C — compatible : Redmi 9A, Redmi 9C</p>
            </aside>
          </div>
          <div className="compatibility-picker">
            <div className="picker-step">
              <div className="picker-heading">
                <h3>
                  <span>01</span> Choisissez la marque
                </h3>
                <span>Marque</span>
              </div>
              <div
                className="choice-list brand-choices"
                role="group"
                aria-label="Choisissez la marque"
              >
                {Object.keys(modelOptions).map((brand) => (
                  <button
                    key={brand}
                    className={`choice-button${brand === selectedBrand ? " is-selected" : ""}`}
                    type="button"
                    data-brand={brand}
                    aria-pressed={brand === selectedBrand}
                    onClick={() => {
                      setSelectedBrand(brand);
                      setSelectedModel(modelOptions[brand]?.[0] ?? "");
                    }}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
            <div className="picker-step">
              <div className="picker-heading">
                <h3>
                  <span>02</span> Choisissez le modèle
                </h3>
                <span>Modèle</span>
              </div>
              <div
                className="choice-list model-choices"
                role="group"
                aria-label="Choisissez le modèle"
              >
                {models.map((model) => (
                  <button
                    key={model}
                    className={`choice-button${model === selectedModel ? " is-selected" : ""}`}
                    type="button"
                    data-model={model}
                    aria-pressed={model === selectedModel}
                    onClick={() => setSelectedModel(model)}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
            <div className="picker-step">
              <div className="picker-heading">
                <h3>
                  <span>03</span> Voyez les pièces compatibles
                </h3>
                <span>Pièce</span>
              </div>
              <div
                className="choice-list part-choices"
                role="group"
                aria-label="Choisissez la pièce"
              >
                {["Écran", "Batterie", "Charge / flex", "Caméra"].map((part) => (
                  <button
                    key={part}
                    className={`choice-button${part === selectedPart ? " is-selected" : ""}`}
                    type="button"
                    data-part={part}
                    aria-pressed={part === selectedPart}
                    onClick={() => setSelectedPart(part)}
                  >
                    {part}
                  </button>
                ))}
              </div>
              <p className="compatibility-status" aria-live="polite">
                <i />
                Filtre actif :{" "}
                <strong>
                  {selectedBrand.replace(" / iPhone", "")} · {selectedModel} · {selectedPart}
                </strong>
                <Link
                  className="compatibility-submit"
                  to={`/products?q=${encodeURIComponent(`${selectedBrand} ${selectedModel} ${selectedPart}`)}`}
                >
                  Voir les pièces
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="products-section section-shell"
        id="references"
        aria-labelledby="products-title"
      >
        <div className="content-width">
          <div className="section-intro product-intro">
            <div>
              <p className="eyebrow">
                <i />
                <span>03 / Les références</span>
                <span className="eyebrow-arabic" lang="ar" dir="rtl">
                  قطع جاهزة
                </span>
              </p>
              <h2 id="products-title">Le catalogue, pièce par pièce.</h2>
            </div>
            <p className="section-copy sample-copy">
              Exemples de catalogue — références, prix et stocks SAMPLE.
            </p>
            <span className="section-rule" aria-hidden="true" />
          </div>
          {error && (
            <div className="catalogue-feedback">
              <ApiErrorNotice message={error.message || "Réessayez dans quelques instants."} />
              <button
                className="button button-primary"
                disabled={isRefetching}
                onClick={() => void refetch()}
              >
                Réessayer
              </button>
            </div>
          )}
          {isPending && !data && (
            <div className="catalogue-feedback">
              <PageLoader />
            </div>
          )}
          {shelves.map((shelf, shelfIndex) => {
            const products = shelf.products.length ? shelf.products : null;
            const samples = sampleShelves[shelfIndex]!;
            return (
              <div className="product-shelf" key={shelf.key}>
                <div className="shelf-heading">
                  <h3>{shelf.title}</h3>
                  <span>{shelf.caption}</span>
                </div>
                {products ? (
                  <ProductGrid products={products} />
                ) : (
                  <div className="product-grid">
                    {samples.products.map((product, index) => {
                      const message = encodeURIComponent(
                        `Bonjour, je souhaite commander : ${product.name} (${product.reference}).`,
                      );
                      const limited = product.stock === "Stock limité";
                      return (
                        <article className="product-card" key={product.reference}>
                          <div className={`product-art product-art-${(index % 4) + 1}`}>
                            <img
                              src={imageByCategory[product.category] ?? repairPhoto}
                              alt=""
                              width={340}
                              height={260}
                              loading="lazy"
                              decoding="async"
                              aria-hidden="true"
                            />
                            <span
                              className={`stock-badge ${limited ? "stock-limited" : "stock-available"}`}
                            >
                              <i />
                              {product.stock}
                            </span>
                          </div>
                          <div className="product-details">
                            <h3>{product.name}</h3>
                            <p className="product-compatibility">{product.compatibility}</p>
                            <p className="product-reference">{product.reference} · SAMPLE</p>
                            <div className="product-buy">
                              <p className="product-price">
                                {product.price} <span>DA</span>
                              </p>
                              <a
                                className="order-link"
                                href={`https://wa.me/213551041751?text=${message}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Commander <img src={heroWhatsappIcon} alt="" aria-hidden="true" />
                              </a>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="atelier-section section-shell"
        id="atelier"
        aria-labelledby="atelier-title"
      >
        <div className="content-width atelier-layout">
          <figure
            className="atelier-art"
            role="img"
            aria-label="Technicien réparant un smartphone sur un établi"
            style={{
              backgroundImage: `url("${workshopPhoto}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <span>06 / ATELIER</span>
            <figcaption className="sr-only">
              Technicien réparant un smartphone sur un établi
            </figcaption>
          </figure>
          <div className="atelier-copy">
            <p className="eyebrow">
              <i />
              <span>04 / Le geste juste</span>
              <span className="eyebrow-arabic" lang="ar" dir="rtl">
                لماذا فيجن برو
              </span>
            </p>
            <h2 id="atelier-title">Une référence nette. Un atelier qui avance.</h2>
            <p>
              Vision Pro parle le langage des réparateurs : une pièce identifiée, un conseil rapide,
              une expédition qui ne bloque pas le comptoir.
            </p>
            <div className="gradient-rule" aria-hidden="true" />
            <ol className="atelier-points">
              <li>
                <span>01</span>
                <div>
                  <strong>Pièces testées à l’atelier</strong>
                  <small lang="ar" dir="rtl">
                    قطع مجرّبة في الورشة
                  </small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Compatibilité vérifiée modèle par modèle</strong>
                  <small lang="ar" dir="rtl">
                    توافق مؤكد لكل موديل
                  </small>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Conseils techniques par téléphone</strong>
                  <small lang="ar" dir="rtl">
                    نصيحة تقنية عبر الهاتف
                  </small>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Prix grossiste pour les réparateurs</strong>
                  <small lang="ar" dir="rtl">
                    أسعار بالجملة للمصلحين
                  </small>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section
        className="delivery-section section-shell"
        id="livraison"
        aria-labelledby="delivery-title"
      >
        <div className="delivery-panel content-width">
          <div className="delivery-glow" aria-hidden="true" />
          <div className="delivery-heading">
            <div>
              <p className="eyebrow">
                <i />
                <span>05 / Le réseau</span>
                <span className="eyebrow-arabic" lang="ar" dir="rtl">
                  التوصيل
                </span>
              </p>
              <h2 id="delivery-title">
                La pièce part.
                <br />
                L’atelier reprend.
              </h2>
              <p className="delivery-arabic" lang="ar" dir="rtl">
                توصيل إلى 58 ولاية
              </p>
            </div>
            <p className="delivery-description">
              Livraison dans les 58 wilayas, à domicile ou en stopdesk. Paiement à la livraison.
            </p>
          </div>
          <div className="delivery-metrics">
            <div>
              <strong>58</strong>
              <span>wilayas desservies</span>
              <small lang="ar" dir="rtl">
                ولاية
              </small>
            </div>
            <div>
              <strong>&lt;24h</strong>
              <span>expédition</span>
              <small lang="ar" dir="rtl">
                إرسال
              </small>
            </div>
            <div>
              <strong>2</strong>
              <span>modes de livraison</span>
              <small lang="ar" dir="rtl">
                طرق التوصيل
              </small>
            </div>
            <div>
              <strong>0 DA</strong>
              <span>paiement à la livraison</span>
              <small lang="ar" dir="rtl">
                الدفع عند الاستلام
              </small>
            </div>
          </div>
          <div className="delivery-footnotes">
            <span>Stopdesk à partir de 400 DA</span>
            <span>Domicile à partir de 600 DA</span>
            <span>Tarifs indicatifs</span>
          </div>
        </div>
      </section>

      <section className="reviews-section section-shell" id="avis" aria-labelledby="reviews-title">
        <div className="content-width">
          <div className="reviews-intro">
            <p className="eyebrow">
              <i />
              <span>06 / Retours d’atelier</span>
              <span className="eyebrow-arabic" lang="ar" dir="rtl">
                آراء الحرفاء
              </span>
            </p>
            <h2 id="reviews-title">Quand la référence est juste, le geste suit.</h2>
            <div className="gradient-rule" aria-hidden="true" />
          </div>
          <div className="review-grid">
            {(data?.approvedReviews.length
              ? data.approvedReviews.slice(0, 3).map((review) => ({
                  id: review.id,
                  body: review.body,
                  author: review.authorName,
                  city: review.city,
                }))
              : [
                  {
                    id: "sample-karim",
                    body: "Je donne le modèle, je reçois une réponse claire. C’est ce qu’il faut quand le téléphone est déjà ouvert sur l’établi.",
                    author: "Karim",
                    city: "Blida",
                  },
                  {
                    id: "sample-yacine",
                    body: "La pièce est arrivée vite et la référence correspondait à ma demande.",
                    author: "Yacine",
                    city: "Oran",
                  },
                  {
                    id: "sample-sarah",
                    body: "Un appel avant de commander, cela évite une erreur de modèle.",
                    author: "Sarah",
                    city: "Alger",
                  },
                ]
            ).map((review, index) => (
              <figure
                className={`review-card${index === 0 ? " review-featured" : ""}`}
                key={review.id}
              >
                <span className="quote-mark" aria-hidden="true">
                  “
                </span>
                <blockquote>{review.body}</blockquote>
                <figcaption>
                  <strong>{review.author}</strong>
                  <span>
                    {review.city} · {data?.approvedReviews.length ? "Réparateur" : "avis SAMPLE"}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
