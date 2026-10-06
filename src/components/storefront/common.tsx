import {
  ArrowRight,
  Battery,
  Camera,
  Cable,
  Fingerprint,
  Mic,
  Monitor,
  Package,
  Search,
  ShoppingBag,
  Smartphone,
  Volume2,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Category, Product, SearchSuggestion } from "@vision-pro/types";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { formatDZD, useCart } from "../../store/cart";
import { useI18n } from "../../lib/i18n";
import { productImage } from "./product-image";

const iconByName: Record<string, LucideIcon> = {
  Monitor,
  Battery,
  Cable,
  Camera,
  Volume2,
  Mic,
  Zap,
  Smartphone,
  Fingerprint,
  Wrench,
  Package,
};

export function CategoryIcon({ name, size = 22 }: { name: string | null; size?: number }) {
  const Icon = name ? iconByName[name] : undefined;
  return Icon ? (
    <Icon size={size} strokeWidth={1.7} aria-hidden="true" />
  ) : (
    <Package size={size} aria-hidden="true" />
  );
}

export function StoreHeader() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { lang, setLang } = useI18n();
  const count = useCart((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  return (
    <>
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <header className="site-header" id="top">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="VISION PRO, accueil">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>VISION PRO</span>
          </Link>
          <Link className="header-search-link" to="/#recherche">
            <Search size={17} aria-hidden="true" />
            Rechercher une pièce
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label={mobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="primary-nav"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            <i />
            <i />
          </button>
          <nav
            className={`primary-nav${mobileNavOpen ? " is-open" : ""}`}
            id="primary-nav"
            aria-label="Navigation principale"
          >
            <Link to="/#catalogue" onClick={() => setMobileNavOpen(false)}>
              Catalogue
            </Link>
            <Link to="/#compatibilite" onClick={() => setMobileNavOpen(false)}>
              Par modèle
            </Link>
            <Link to="/#atelier" onClick={() => setMobileNavOpen(false)}>
              Pourquoi nous
            </Link>
            <Link to="/#livraison" onClick={() => setMobileNavOpen(false)}>
              Livraison{" "}
              <span lang="ar" dir="rtl">
                التوصيل
              </span>
            </Link>
          </nav>
          <Link
            className="cart-header-link"
            to="/checkout"
            aria-label={`Panier, ${count} article(s)`}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            <span>{count}</span>
          </Link>
          <div className="header-contact">
            <a className="phone-number" href="tel:+213551041751">
              0551 04 17 51
            </a>
            <button
              className="language-toggle"
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              aria-label={
                lang === "fr" ? "Afficher l'interface en arabe" : "Afficher l'interface en français"
              }
            >
              {lang === "fr" ? "عربي" : "FR"}
            </button>
            <a className="call-link" href="tel:+213551041751">
              Appeler
            </a>
            <a
              className="whatsapp-button"
              href="https://wa.me/213551041751"
              target="_blank"
              rel="noreferrer"
            >
              <span aria-hidden="true">↗</span> WhatsApp
            </a>
          </div>
        </div>
      </header>
    </>
  );
}

export function SearchBar({
  hero = false,
  placeholder: placeholderOverride,
}: {
  hero?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestError, setSuggestError] = useState("");
  const navigate = useNavigate();
  const { lang } = useI18n();
  const inputId = hero ? "hero-search" : "header-search";

  useEffect(() => {
    if (!focused || query.trim().length < 2) {
      setSuggestions([]);
      setSuggestError("");
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      api
        .suggestions(query.trim())
        .then((results) => {
          if (!cancelled) {
            setSuggestions(results);
            setSelectedIndex(-1);
            setSuggestError("");
          }
        })
        .catch((error: unknown) => {
          if (!cancelled)
            setSuggestError(error instanceof Error ? error.message : "Suggestions indisponibles.");
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [focused, query]);

  const readRecent = () => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("vision-pro-searches") ?? "[]");
      setRecent(
        Array.isArray(saved)
          ? saved.filter((value): value is string => typeof value === "string").slice(0, 5)
          : [],
      );
    } catch {
      setRecent([]);
    }
  };
  const remember = (value: string) => {
    const next = [
      value.trim(),
      ...recent.filter((item) => item.toLowerCase() !== value.trim().toLowerCase()),
    ].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem("vision-pro-searches", JSON.stringify(next));
    } catch {
      // Search navigation remains available when browser storage is disabled.
    }
  };
  const submit = (value = query) => {
    const clean = value.trim();
    if (!clean) return;
    remember(clean);
    setFocused(false);
    navigate(`/products?q=${encodeURIComponent(clean)}`);
  };
  const pickSuggestion = (suggestion: SearchSuggestion) => {
    remember(query);
    setFocused(false);
    navigate(suggestion.to);
  };
  const showRecent = focused && !query.trim() && recent.length > 0;
  const showSuggestions = focused && query.trim().length >= 2;
  const groupNames: Record<SearchSuggestion["group"], string> = {
    models: "Modèles de téléphone",
    categories: "Catégories",
    products: "Pièces compatibles",
    brands: "Marques",
  };
  const groupOrder: SearchSuggestion["group"][] = ["models", "categories", "products", "brands"];

  return (
    <div className={`search-wrap${hero ? " search-wrap-hero" : ""}`}>
      <form
        className={`search-form${hero ? " hero-search-form" : ""}`}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Search className="search-icon" size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor={inputId}>
          Rechercher une pièce ou un modèle
        </label>
        <input
          id={inputId}
          value={query}
          autoComplete="off"
          placeholder={
            placeholderOverride ??
            (hero
              ? lang === "fr"
                ? "Redmi Note 12 LCD…"
                : "مثال: شاشة Samsung A52، بطارية iPhone 13…"
              : lang === "fr"
                ? "Référence, modèle, pièce…"
                : "المرجع، الموديل، القطعة…")
          }
          aria-expanded={showRecent || showSuggestions}
          aria-controls={`${inputId}-suggestions`}
          aria-activedescendant={
            selectedIndex >= 0 ? `${inputId}-suggestion-${selectedIndex}` : undefined
          }
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            setFocused(true);
            readRecent();
          }}
          onBlur={() => setTimeout(() => setFocused(false), 140)}
          onKeyDown={(event) => {
            const count = showSuggestions ? suggestions.length : showRecent ? recent.length : 0;
            if (event.key === "ArrowDown" && count) {
              event.preventDefault();
              setSelectedIndex((index) => (index + 1) % count);
            } else if (event.key === "ArrowUp" && count) {
              event.preventDefault();
              setSelectedIndex((index) => (index <= 0 ? count - 1 : index - 1));
            } else if (event.key === "Enter" && selectedIndex >= 0) {
              event.preventDefault();
              if (showRecent) submit(recent[selectedIndex] ?? query);
              else if (suggestions[selectedIndex]) pickSuggestion(suggestions[selectedIndex]!);
            } else if (event.key === "Escape") {
              setFocused(false);
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Effacer la recherche"
            onClick={() => setQuery("")}
          >
            <X size={16} />
          </button>
        )}
        <button className="search-submit" type="submit">
          {hero ? "Trouver ma pièce" : "Rechercher"}
          <ArrowRight size={16} />
        </button>
      </form>
      {(showRecent || showSuggestions) && (
        <div
          id={`${inputId}-suggestions`}
          className="suggestion-panel"
          role="listbox"
          aria-label={showRecent ? "Recherches récentes" : "Suggestions de recherche"}
          onMouseDown={(event) => event.preventDefault()}
        >
          {showRecent && (
            <>
              <div className="suggestion-heading">Recherches récentes</div>
              {recent.map((item, index) => (
                <button
                  key={item}
                  id={`${inputId}-suggestion-${index}`}
                  role="option"
                  aria-selected={selectedIndex === index}
                  className="suggestion-row recent-row"
                  onClick={() => submit(item)}
                >
                  <Search size={15} />
                  {item}
                </button>
              ))}
            </>
          )}
          {showSuggestions &&
            groupOrder.map((group) => {
              const grouped = suggestions.filter((item) => item.group === group);
              return grouped.length ? (
                <section key={group}>
                  <div className="suggestion-heading">{groupNames[group]}</div>
                  {grouped.map((item) => {
                    const index = suggestions.indexOf(item);
                    return (
                      <button
                        key={`${item.group}-${item.to}`}
                        id={`${inputId}-suggestion-${index}`}
                        role="option"
                        aria-selected={selectedIndex === index}
                        className="suggestion-row"
                        onClick={() => pickSuggestion(item)}
                      >
                        {item.group === "products" && item.imageUrl ? (
                          <img
                            className="suggestion-product-image"
                            src={item.imageUrl}
                            alt=""
                            width="38"
                            height="38"
                          />
                        ) : (
                          <Search size={15} />
                        )}
                        <span className="suggestion-copy">
                          <strong>{item.label}</strong>
                          {item.sku && <small>{item.sku}</small>}
                        </span>
                        {item.priceDzd !== undefined && (
                          <strong className="suggestion-price">{formatDZD(item.priceDzd)}</strong>
                        )}
                      </button>
                    );
                  })}
                </section>
              ) : null;
            })}
          {suggestError && <p className="suggestion-error">{suggestError}</p>}
          {showSuggestions && suggestions.length > 0 && (
            <button className="suggestion-all" onClick={() => submit()}>
              Voir tous les résultats pour « {query} » <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((state) => state.add);
  const { lang } = useI18n();
  const inStock = product.stockQuantity > 0;
  return (
    <article className="product-card">
      <Link to={`/product/${encodeURIComponent(product.slug)}`} className="product-card-link">
        <div className="product-image-wrap">
          <img
            src={productImage(product)}
            alt={product.images?.[0]?.alt ?? product.name}
            loading="lazy"
            width="340"
            height="260"
          />
          {product.isNewArrival && (
            <span className="product-badge badge-new">{lang === "fr" ? "Nouveau" : "جديد"}</span>
          )}
          {product.comparePriceDzd && <span className="product-badge badge-deal">Bon prix</span>}
          <span className={`stock-pill ${inStock ? "stock-available" : "stock-unavailable"}`}>
            <span />
            {inStock
              ? product.stockQuantity <= 5
                ? lang === "fr"
                  ? "Stock faible"
                  : "كمية محدودة"
                : lang === "fr"
                  ? "En stock"
                  : "متوفر"
              : lang === "fr"
                ? "Épuisé"
                : "غير متوفر"}
          </span>
        </div>
        <div className="product-card-copy">
          <span className="product-sku">{product.sku}</span>
          <h3>{product.name}</h3>
          <p className="product-compatible">
            {product.compatibilities
              ?.slice(0, 2)
              .map((item) => `${item.phoneModel.brand?.name ?? ""} ${item.phoneModel.name}`)
              .join(" · ") || product.category?.name}
          </p>
          <div className="product-price-line">
            <strong>{formatDZD(product.priceDzd)}</strong>
            {product.comparePriceDzd && <del>{formatDZD(product.comparePriceDzd)}</del>}
          </div>
        </div>
      </Link>
      <button className="button button-card-add" onClick={() => add(product)} disabled={!inStock}>
        <ShoppingBag size={16} /> {lang === "fr" ? "Ajouter" : "أضف"}
      </button>
    </article>
  );
}

export function ProductGrid({
  products,
  empty = "Aucune pièce trouvée.",
}: {
  products: Product[];
  empty?: string;
}) {
  if (!products.length)
    return (
      <div className="empty-state">
        <Package size={26} />
        <p>{empty}</p>
      </div>
    );
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link to={`/products?category=${encodeURIComponent(category.slug)}`} className="category-tile">
      <span className="category-icon">
        <CategoryIcon name={category.icon} />
      </span>
      <span className="category-name">
        {category.name}
        <small lang="ar" dir="rtl">
          {category.nameAr}
        </small>
      </span>
      <ArrowRight className="category-arrow" size={15} />
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  to = "/products",
  link = "Tout voir",
}: {
  eyebrow?: string;
  title: string;
  to?: string;
  link?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      <Link className="text-link" to={to}>
        {link}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      <span>Chargement du catalogue…</span>
    </div>
  );
}

export function ApiErrorNotice({ message }: { message: string }) {
  return (
    <div className="api-error" role="alert">
      <strong>Le catalogue n'est pas disponible.</strong>
      <p>{message}</p>
      <small>Vérifiez que l'API et PostgreSQL sont démarrés, puis réessayez.</small>
    </div>
  );
}

export function StoreFooter() {
  return (
    <footer className="site-footer">
      <div className="content-width">
        <div className="footer-main">
          <div className="footer-brand-column">
            <Link className="brand brand-footer" to="/" aria-label="VISION PRO, retour en haut">
              <span className="brand-mark" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>VISION PRO</span>
            </Link>
            <p>
              Pièces détachées téléphone, références lisibles et compatibilité confirmée avant
              commande.
            </p>
            <a className="footer-phone" href="tel:+213551041751">
              0551 04 17 51
            </a>
            <a
              className="footer-whatsapp"
              href="https://wa.me/213551041751"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp · واتساب
            </a>
          </div>
          <div className="footer-link-column">
            <h2>Catalogue</h2>
            <Link to="/products?category=ecrans">Écrans · شاشات</Link>
            <Link to="/products?category=batteries">Batteries · بطاريات</Link>
            <Link to="/products?category=napolons-de-charge">Napolons</Link>
            <Link to="/products?category=connecteurs">Connecteurs</Link>
            <Link to="/products?category=vitre-camera">Vitre caméra</Link>
          </div>
          <div className="footer-link-column">
            <h2>Pièces</h2>
            <Link to="/products?category=cameras">Caméras</Link>
            <Link to="/products?category=haut-parleurs">Haut-parleurs</Link>
            <Link to="/products?category=micros">Micros</Link>
            <Link to="/products?category=boutons">Boutons</Link>
            <Link to="/products?category=tirages-sim">Tirages SIM</Link>
          </div>
          <div className="footer-link-column">
            <h2>Châssis &amp; plus</h2>
            <Link to="/products?category=frames">Frames</Link>
            <Link to="/products?category=cache-arriere">Cache arrière</Link>
            <Link to="/products?category=capteur-empreinte">Capteur empreinte</Link>
            <Link to="/products?category=autres-pieces">Autres pièces</Link>
            <Link to="/#compatibilite">Par modèle</Link>
          </div>
          <div className="footer-contact-column">
            <h2>Horaires de contact</h2>
            <p>Conseil par téléphone et WhatsApp Vision Pro · Algérie</p>
            <a href="tel:+213551041751">
              Appeler maintenant <span aria-hidden="true">→</span>
            </a>
            <Link to="/admin">Espace équipe</Link>
            <Link to="/checkout">Mon panier</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© VISION PRO · Exemples de catalogue marqués SAMPLE</p>
          <a href="#top">Retour en haut ↑</a>
        </div>
      </div>
    </footer>
  );
}

export function CartHeaderLink({ compact = false }: { compact?: boolean }) {
  const count = useCart((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { t } = useI18n();
  return (
    <Link className={`cart-link ${compact ? "cart-link-compact" : ""}`} to="/checkout">
      <ShoppingBag size={18} />
      <span>{t("cart")}</span>
      <b>{count}</b>
    </Link>
  );
}
