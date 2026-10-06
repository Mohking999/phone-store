import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ListFilter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import { PageLoader, ApiErrorNotice, ProductGrid } from "./common";

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const filters = useMemo(() => {
    const clean = new URLSearchParams();
    for (const key of [
      "category",
      "brand",
      "model",
      "minPrice",
      "maxPrice",
      "stock",
      "sort",
      "page",
      "limit",
    ]) {
      const value = searchParams.get(key);
      if (value) clean.set(key, value);
    }
    return clean;
  }, [searchParams]);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
    staleTime: 5 * 60_000,
  });
  const catalog = useQuery({
    queryKey: query ? ["search", query] : ["products", filters.toString()],
    queryFn: () => (query ? api.search(query) : api.products(filters)),
  });
  const heading = query
    ? `Résultats pour « ${query} »`
    : (categories.data?.find((category) => category.slug === searchParams.get("category"))?.name ??
      (searchParams.get("brand") ? `Pièces ${searchParams.get("brand")}` : "Toutes les pièces"));
  const totalPages =
    !query &&
    catalog.data &&
    "totalPages" in catalog.data &&
    typeof catalog.data.totalPages === "number"
      ? catalog.data.totalPages
      : 0;

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  return (
    <main className="container-page page-main catalog-page">
      <nav className="breadcrumbs" aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link>
        <span>/</span>
        <span>Pièces</span>
        {query && (
          <>
            <span>/</span>
            <span>Recherche</span>
          </>
        )}
      </nav>
      <div className="catalog-heading">
        <div>
          <span className="section-eyebrow">
            {query ? "RECHERCHE COMPATIBLE" : "LE CATALOGUE VISION PRO"}
          </span>
          <h1>{heading}</h1>
          <p>
            {query
              ? "Nous vérifions le modèle, la catégorie et la référence pour vous proposer des pièces compatibles."
              : "Trouvez la référence exacte parmi nos pièces pour smartphones."}
          </p>
        </div>
        <label className="sort-select">
          <SlidersHorizontal size={16} />
          <span className="sr-only">Trier les pièces</span>
          <select
            value={searchParams.get("sort") ?? "popular"}
            onChange={(event) => setFilter("sort", event.target.value)}
          >
            <option value="popular">Meilleures ventes</option>
            <option value="newest">Nouveautés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </label>
      </div>
      {query && (
        <div className="search-result-note">
          <Search size={16} />
          <span>Recherche par compatibilité stricte</span>
          <Link to="/products">Effacer la recherche</Link>
        </div>
      )}
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="filter-heading">
            <ListFilter size={17} />
            <strong>Filtrer les pièces</strong>
          </div>
          <label className="filter-field">
            <span>Catégorie</span>
            <select
              value={searchParams.get("category") ?? ""}
              onChange={(event) => setFilter("category", event.target.value)}
            >
              <option value="">Toutes les catégories</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Marque</span>
            <select
              value={searchParams.get("brand") ?? ""}
              onChange={(event) => setFilter("brand", event.target.value)}
            >
              <option value="">Toutes les marques</option>
              {[
                "Apple",
                "Samsung",
                "Xiaomi",
                "OPPO",
                "Huawei",
                "Realme",
                "Vivo",
                "Infinix",
                "Tecno",
              ].map((name) => (
                <option key={name} value={name.toLowerCase()}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Modèle exact</span>
            <input
              value={searchParams.get("model") ?? ""}
              onChange={(event) => setFilter("model", event.target.value)}
              placeholder="Ex. samsung-galaxy-a52"
            />
          </label>
          <label className="filter-field">
            <span>Prix minimum (DA)</span>
            <input
              type="number"
              min="0"
              value={searchParams.get("minPrice") ?? ""}
              onChange={(event) => setFilter("minPrice", event.target.value)}
            />
          </label>
          <label className="filter-field">
            <span>Prix maximum (DA)</span>
            <input
              type="number"
              min="0"
              value={searchParams.get("maxPrice") ?? ""}
              onChange={(event) => setFilter("maxPrice", event.target.value)}
            />
          </label>
          <label className="filter-field">
            <span>Disponibilité</span>
            <select
              value={searchParams.get("stock") ?? ""}
              onChange={(event) => setFilter("stock", event.target.value)}
            >
              <option value="">Tous les stocks</option>
              <option value="IN_STOCK">En stock</option>
              <option value="LOW_STOCK">Stock faible</option>
            </select>
          </label>
          <button
            className="filter-reset"
            onClick={() => setSearchParams(query ? { q: query } : {})}
          >
            Réinitialiser les filtres
          </button>
          <div className="filter-compatible">
            <span className="compat-check">✓</span>
            <p>
              <strong>Pas de compatibilité au hasard.</strong>
              <br />
              Le filtre modèle ne renvoie que les pièces reliées à ce modèle.
            </p>
          </div>
        </aside>

        <section className="catalog-results" aria-live="polite">
          {catalog.isPending ? (
            <PageLoader />
          ) : catalog.error ? (
            <ApiErrorNotice message={catalog.error.message} />
          ) : (
            <>
              <div className="results-toolbar">
                <p>
                  <strong>{catalog.data?.total ?? 0}</strong> pièce
                  {catalog.data?.total === 1 ? "" : "s"} trouvée
                  {catalog.data?.total === 1 ? "" : "s"}
                </p>
                {query && (
                  <span>
                    <span className="compat-check">✓</span> Modèle validé par le catalogue
                  </span>
                )}
              </div>
              <ProductGrid
                products={catalog.data?.items ?? []}
                empty={
                  query
                    ? "Aucune référence compatible trouvée. Vérifiez le modèle ou essayez le SKU complet."
                    : "Aucune pièce ne correspond à ces filtres."
                }
              />
              {!query && totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="button button-outline"
                    disabled={(Number(searchParams.get("page")) || 1) <= 1}
                    onClick={() =>
                      setFilter("page", String((Number(searchParams.get("page")) || 1) - 1))
                    }
                  >
                    Précédent
                  </button>
                  <span>
                    Page {Number(searchParams.get("page")) || 1} sur {totalPages}
                  </span>
                  <button
                    className="button button-outline"
                    disabled={(Number(searchParams.get("page")) || 1) >= totalPages}
                    onClick={() =>
                      setFilter("page", String((Number(searchParams.get("page")) || 1) + 1))
                    }
                  >
                    Suivant <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
