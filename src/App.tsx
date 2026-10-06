import { lazy, Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { I18nProvider } from "./lib/i18n";
import { PageLoader, StoreFooter, StoreHeader } from "./components/storefront/common";

const HomePage = lazy(() =>
  import("./components/storefront/HomePage").then((module) => ({ default: module.HomePage })),
);
const CatalogPage = lazy(() =>
  import("./components/storefront/CatalogPage").then((module) => ({ default: module.CatalogPage })),
);
const ProductPage = lazy(() =>
  import("./components/storefront/ProductPage").then((module) => ({ default: module.ProductPage })),
);
const CheckoutPage = lazy(() =>
  import("./components/storefront/CheckoutPage").then((module) => ({
    default: module.CheckoutPage,
  })),
);
const AdminPage = lazy(() =>
  import("./components/storefront/AdminPage").then((module) => ({ default: module.AdminPage })),
);

export function App() {
  return (
    <I18nProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route
            index
            element={
              <LazyPage>
                <HomePage />
              </LazyPage>
            }
          />
          <Route
            path="products"
            element={
              <LazyPage>
                <CatalogPage />
              </LazyPage>
            }
          />
          <Route
            path="search"
            element={
              <LazyPage>
                <CatalogPage />
              </LazyPage>
            }
          />
          <Route
            path="product/:slug"
            element={
              <LazyPage>
                <ProductPage />
              </LazyPage>
            }
          />
          <Route
            path="checkout"
            element={
              <LazyPage>
                <CheckoutPage />
              </LazyPage>
            }
          />
          <Route path="404" element={<NotFoundPage />} />
        </Route>
        <Route
          path="admin"
          element={
            <LazyPage>
              <AdminPage />
            </LazyPage>
          }
        />
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Routes>
    </I18nProvider>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="container-page page-main">
          <PageLoader />
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

function StoreLayout() {
  return (
    <div className="legacy-storefront">
      <StoreHeader />
      <Outlet />
      <StoreFooter />
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "instant" });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function NotFoundPage() {
  return (
    <main className="container-page page-main">
      <div className="empty-cart">
        <h1>Cette page n'existe pas.</h1>
        <p>Le lien a peut-être changé. Retrouvez les pièces depuis notre catalogue.</p>
        <Link className="button button-primary" to="/products">
          Voir le catalogue
        </Link>
      </div>
    </main>
  );
}
