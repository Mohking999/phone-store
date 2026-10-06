import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleHelp,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { formatDZD, useCart } from "../../store/cart";
import { ApiErrorNotice, PageLoader, ProductGrid } from "./common";
import { productImage } from "./product-image";

export function ProductPage() {
  const { slug = "" } = useParams();
  const {
    data: product,
    isPending,
    error,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.product(slug),
    enabled: Boolean(slug),
  });
  const add = useCart((state) => state.add);

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} · ${product.sku} | VISION PRO`;
    const canonicalDescription = document.querySelector('meta[name="description"]');
    canonicalDescription?.setAttribute(
      "content",
      `${product.name} — ${product.description} Compatibilité et livraison en Algérie.`,
    );
    const script = document.createElement("script");
    script.type = "application/ld+json";
    const availability =
      product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      sku: product.sku,
      description: product.description,
      brand: {
        "@type": "Brand",
        name: product.compatibilities?.[0]?.phoneModel.brand?.name ?? "VISION PRO",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "DZD",
        price: String(product.priceDzd),
        itemCondition: "https://schema.org/NewCondition",
        availability,
        seller: { "@type": "Organization", name: "VISION PRO", telephone: "+213551041751" },
      },
    }).replace(/</g, "\\u003c");
    document.head.append(script);
    return () => {
      script.remove();
      document.title = "VISION PRO — Pièces détachées mobiles";
    };
  }, [product]);

  if (isPending)
    return (
      <main className="container-page page-main">
        <PageLoader />
      </main>
    );
  if (error || !product)
    return (
      <main className="container-page page-main">
        <ApiErrorNotice message={error?.message ?? "Cette référence n'existe pas."} />
        <Link className="text-link" to="/products">
          <ArrowLeft size={16} /> Retour au catalogue
        </Link>
      </main>
    );

  const compatiblePhones = product.compatibilities ?? [];
  const relatedQuery = new URLSearchParams({ category: product.category?.slug ?? "", limit: "8" });

  return (
    <main className="container-page page-main detail-page">
      <nav className="breadcrumbs" aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link>
        <span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category?.slug ?? "")}`}>
          {product.category?.name}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="product-detail-layout">
        <div className="detail-gallery">
          <div className="detail-image-panel">
            <img
              src={productImage(product)}
              alt={product.images?.[0]?.alt ?? product.name}
              width="816"
              height="816"
            />
          </div>
          <div className="detail-gallery-caption">
            <PackageCheck size={16} />
            <span>Photo de la catégorie · Vérifiez la référence {product.sku}</span>
          </div>
        </div>
        <section className="detail-info">
          <Link
            className="back-link"
            to={`/products?category=${encodeURIComponent(product.category?.slug ?? "")}`}
          >
            <ArrowLeft size={15} /> {product.category?.name}
          </Link>
          <span className="detail-sku">{product.sku}</span>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>
          <div className="detail-stock">
            <span
              className={`stock-pill ${product.stockQuantity > 0 ? "stock-available" : "stock-unavailable"}`}
            >
              <span />
              {product.stockQuantity > 5
                ? "En stock"
                : product.stockQuantity > 0
                  ? "Stock faible"
                  : "Épuisé"}
            </span>
            {product.stockQuantity > 0 && (
              <span>
                {product.stockQuantity} disponible{product.stockQuantity > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="detail-price">
            {formatDZD(product.priceDzd)}
            {product.comparePriceDzd && <del>{formatDZD(product.comparePriceDzd)}</del>}
          </div>
          <div className="detail-assurance">
            <BadgeCheck size={19} />
            <div>
              <strong>Compatibilité contrôlée par modèle</strong>
              <span>Consultez la liste exhaustive avant d'ajouter à votre panier.</span>
            </div>
          </div>
          <div className="detail-compatibility">
            <h2>
              <Check size={18} /> Modèles compatibles <span>{compatiblePhones.length}</span>
            </h2>
            {compatiblePhones.length ? (
              <ul>
                {compatiblePhones.map(({ phoneModel }) => (
                  <li key={phoneModel.id}>
                    <span>{phoneModel.brand?.name}</span>
                    <strong>{phoneModel.name}</strong>
                    {phoneModel.aliases.length > 0 && (
                      <small>{phoneModel.aliases.slice(0, 2).join(" · ")}</small>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                Aucun modèle n'est lié à cette référence. Contactez-nous avant commande pour
                vérifier.
              </p>
            )}
          </div>
          <button
            className="button button-primary detail-add"
            onClick={() => add(product)}
            disabled={product.stockQuantity <= 0}
          >
            <ShoppingBag size={18} /> Ajouter au panier · {formatDZD(product.priceDzd)}
          </button>
          <div className="detail-delivery">
            <Truck size={18} />
            <span>Livraison à domicile dès 600 DA · Stop desk dès 400 DA</span>
          </div>
          <a
            className="detail-help"
            href={`https://wa.me/213551041751?text=${encodeURIComponent(`Bonjour, pouvez-vous vérifier la compatibilité du SKU ${product.sku} ?`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <CircleHelp size={17} /> Un doute sur la compatibilité ? Demandez-nous avant de
            commander.
          </a>
        </section>
      </div>
      <section className="detail-related">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">PIÈCES DU MÊME UNIVERS</span>
            <h2>À découvrir aussi</h2>
          </div>
          <Link className="text-link" to={`/products?${relatedQuery.toString()}`}>
            Voir la catégorie <ArrowLeft size={15} />
          </Link>
        </div>
        <RelatedProducts categorySlug={product.category?.slug ?? ""} currentId={product.id} />
      </section>
    </main>
  );
}

function RelatedProducts({ categorySlug, currentId }: { categorySlug: string; currentId: string }) {
  const query = new URLSearchParams({ category: categorySlug, limit: "5" });
  const { data } = useQuery({
    queryKey: ["related", categorySlug],
    queryFn: () => api.products(query),
    enabled: Boolean(categorySlug),
  });
  const related = data?.items.filter((item) => item.id !== currentId).slice(0, 4) ?? [];
  return related.length ? <ProductGrid products={related} /> : null;
}
