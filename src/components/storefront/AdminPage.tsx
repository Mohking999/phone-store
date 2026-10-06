import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Box, LogOut, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api } from "../../api/client";
import type { AdminOrder, OrderStatus, StockStatus } from "@vision-pro/types";
import { formatDZD } from "../../store/cart";
import { ApiErrorNotice, PageLoader } from "./common";

const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "RETURNED"],
  CONFIRMED: ["SHIPPED", "RETURNED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
};

export function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("vision-pro-admin-token") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [actionError, setActionError] = useState("");
  const queryClient = useQueryClient();
  const products = useQuery({
    queryKey: ["admin-products", token],
    queryFn: () => api.adminProducts(token),
    enabled: Boolean(token),
    retry: false,
  });
  const orders = useQuery({
    queryKey: ["admin-orders", token],
    queryFn: () => api.adminOrders(token),
    enabled: Boolean(token),
    retry: false,
  });

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsSigningIn(true);
    try {
      const result = await api.adminLogin(email, password);
      sessionStorage.setItem("vision-pro-admin-token", result.token);
      setToken(result.token);
      setPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "La connexion a échoué.");
    } finally {
      setIsSigningIn(false);
    }
  }

  function signOut() {
    sessionStorage.removeItem("vision-pro-admin-token");
    setToken("");
    void queryClient.removeQueries({ queryKey: ["admin-products"] });
    void queryClient.removeQueries({ queryKey: ["admin-orders"] });
  }

  async function changeOrderStatus(order: AdminOrder, status: OrderStatus) {
    setActionError("");
    try {
      await api.updateOrderStatus(token, order.id, status);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders", token] }),
        queryClient.invalidateQueries({ queryKey: ["admin-products", token] }),
      ]);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "La mise à jour de la commande a échoué.",
      );
    }
  }

  if (!token)
    return (
      <main className="container-page admin-page">
        <form className="admin-login" onSubmit={(event) => void signIn(event)}>
          <span className="admin-login-icon">
            <ShieldCheck size={25} />
          </span>
          <span className="section-eyebrow">ACCÈS ÉQUIPE</span>
          <h1>Espace atelier</h1>
          <p>Connectez-vous pour gérer le catalogue et les commandes.</p>
          <label className="form-field">
            <span>Adresse e-mail</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>Mot de passe</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {loginError && (
            <p className="form-error" role="alert">
              {loginError}
            </p>
          )}
          <button className="button button-primary submit-order" disabled={isSigningIn}>
            {isSigningIn ? "Connexion…" : "Se connecter"} <ShieldCheck size={17} />
          </button>
        </form>
      </main>
    );

  return (
    <main className="container-page page-main admin-dashboard">
      <div className="admin-title-row">
        <div>
          <span className="section-eyebrow">GESTION DU COMPTOIR</span>
          <h1>Tableau de bord</h1>
        </div>
        <button className="button button-outline" onClick={signOut}>
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {products.error || orders.error ? (
        <ApiErrorNotice
          message={products.error?.message ?? orders.error?.message ?? "Réessayez plus tard."}
        />
      ) : products.isPending || orders.isPending ? (
        <PageLoader />
      ) : (
        <>
          <div className="admin-stat-grid">
            <article>
              <span>
                <Box />
              </span>
              <small>Références catalogue</small>
              <strong>{products.data?.total ?? 0}</strong>
            </article>
            <article>
              <span>
                <Truck />
              </span>
              <small>Commandes en cours</small>
              <strong>
                {orders.data?.items.filter(
                  (order) => !["DELIVERED", "RETURNED"].includes(order.status),
                ).length ?? 0}
              </strong>
            </article>
            <article>
              <span>
                <BadgeCheck />
              </span>
              <small>Stock à vérifier</small>
              <strong>
                {products.data?.items.filter((product) => product.stockQuantity <= 5).length ?? 0}
              </strong>
            </article>
          </div>
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <span className="section-eyebrow">FLUX DE COMMANDE</span>
                <h2>Dernières commandes</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Actualiser les commandes"
                onClick={() => void orders.refetch()}
              >
                <RefreshCw size={17} />
              </button>
            </div>
            {!orders.data?.items.length ? (
              <div className="admin-empty">Aucune commande pour le moment.</div>
            ) : (
              <div className="admin-order-list">
                {orders.data.items.map((order) => (
                  <article className="admin-order" key={order.id}>
                    <div className="admin-order-top">
                      <div>
                        <strong>{order.orderNumber}</strong>
                        <span>{new Date(order.createdAt).toLocaleString("fr-DZ")}</span>
                      </div>
                      <span className={`order-status status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="admin-order-details">
                      <span>
                        <strong>{order.customerName}</strong> · {order.phone}
                      </span>
                      <span>
                        {order.commune}, {order.wilaya}
                      </span>
                      <span>
                        {order.deliveryType === "HOME" ? "Domicile" : "Stop desk"} ·{" "}
                        {formatDZD(order.totalDzd)}
                      </span>
                    </div>
                    <ul className="admin-order-items">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity} × {item.product.name} <small>({item.product.sku})</small>
                        </li>
                      ))}
                    </ul>
                    <div className="admin-order-actions">
                      {orderTransitions[order.status].map((status) => (
                        <button
                          className={
                            status === "RETURNED" ? "button button-danger" : "button button-outline"
                          }
                          key={status}
                          onClick={() => void changeOrderStatus(order, status)}
                        >
                          {status === "RETURNED" ? "Marquer retournée" : `Passer à ${status}`}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <span className="section-eyebrow">INVENTAIRE</span>
                <h2>Stocks catalogue</h2>
              </div>
              <button
                className="icon-button"
                aria-label="Actualiser les stocks"
                onClick={() => void products.refetch()}
              >
                <RefreshCw size={17} />
              </button>
            </div>
            <div className="inventory-list">
              {products.data?.items.map((product) => (
                <InventoryRow
                  key={product.id}
                  productId={product.id}
                  name={product.name}
                  sku={product.sku}
                  initialQuantity={product.stockQuantity}
                  initialStatus={product.stockStatus}
                  onSave={async (quantity, status) => {
                    setActionError("");
                    try {
                      await api.updateStock(token, product.id, quantity, status);
                      await queryClient.invalidateQueries({ queryKey: ["admin-products", token] });
                    } catch (error) {
                      setActionError(
                        error instanceof Error
                          ? error.message
                          : "La mise à jour du stock a échoué.",
                      );
                    }
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function InventoryRow({
  productId,
  name,
  sku,
  initialQuantity,
  initialStatus,
  onSave,
}: {
  productId: string;
  name: string;
  sku: string;
  initialQuantity: number;
  initialStatus: StockStatus;
  onSave: (quantity: number, status: StockStatus) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const status: StockStatus =
    quantity <= 0 ? "OUT_OF_STOCK" : quantity <= 5 ? "LOW_STOCK" : "IN_STOCK";
  const changed = quantity !== initialQuantity || status !== initialStatus;
  return (
    <div className="inventory-row" data-product-id={productId}>
      <div>
        <strong>{name}</strong>
        <small>
          {sku} · {initialStatus.replaceAll("_", " ")}
        </small>
      </div>
      <label>
        <span className="sr-only">Quantité de stock {name}</span>
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(0, Number(event.target.value)))}
        />
      </label>
      <span className={`order-status stock-${status.toLowerCase().replaceAll("_", "-")}`}>
        {status.replaceAll("_", " ")}
      </span>
      <button
        className="button button-outline"
        disabled={!changed}
        onClick={() => void onSave(quantity, status)}
      >
        Enregistrer
      </button>
    </div>
  );
}
