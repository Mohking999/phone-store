import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { CreatedOrder, DeliveryType } from "@vision-pro/types";
import { formatDZD, useCart } from "../../store/cart";
import { ApiErrorNotice, PageLoader } from "./common";
import { productImage } from "./product-image";

export function CheckoutPage() {
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const remove = useCart((state) => state.remove);
  const clear = useCart((state) => state.clear);
  const wilayas = useQuery({ queryKey: ["wilayas"], queryFn: api.wilayas });
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("HOME");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.priceDzd * item.quantity, 0),
    [items],
  );
  const deliveryFee = deliveryType === "HOME" ? 600 : 400;

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const wilayaCode = Number(form.get("wilayaCode"));
    if (
      !Number.isInteger(wilayaCode) ||
      !wilayas.data?.some((wilaya) => wilaya.code === wilayaCode)
    ) {
      setError("Choisissez une wilaya valide.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await api.placeOrder({
        customerName: String(form.get("customerName") ?? ""),
        phone: String(form.get("phone") ?? ""),
        wilayaCode,
        commune: String(form.get("commune") ?? ""),
        deliveryType,
        ...(String(form.get("notes") ?? "").trim()
          ? { notes: String(form.get("notes")).trim() }
          : {}),
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      setOrder(result);
      clear();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "La commande n'a pas pu être envoyée.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (order) {
    return (
      <main className="container-page page-main checkout-page">
        <section className="order-success">
          <span className="success-check">
            <BadgeCheck size={35} />
          </span>
          <span className="section-eyebrow">C'EST BIEN NOTÉ</span>
          <h1>Merci pour votre commande.</h1>
          <p>
            Notre équipe vous appellera pour confirmer les références, le modèle et la livraison.
          </p>
          <div className="order-number-box">
            <span>Numéro de commande</span>
            <strong>{order.orderNumber}</strong>
            <small>Total, livraison comprise · {formatDZD(order.totalDzd)}</small>
          </div>
          <span className="arabic" lang="ar" dir="rtl">
            سنتصل بكم لتأكيد الطلب · الدفع عند الاستلام
          </span>
          <Link className="button button-primary" to="/products">
            Continuer mes achats <ArrowLeft size={16} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container-page page-main checkout-page">
      <nav className="breadcrumbs" aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link>
        <span>/</span>
        <span>Panier &amp; commande</span>
      </nav>
      <div className="page-title-row">
        <div>
          <span className="section-eyebrow">PAIEMENT À LA LIVRAISON</span>
          <h1>Votre commande</h1>
        </div>
        <span className="secure-note">
          <ShieldCheck size={16} /> Vos données restent privées
        </span>
      </div>
      {!items.length ? (
        <div className="empty-cart">
          <span>
            <PackageCheck size={31} />
          </span>
          <h2>Votre panier vous attend.</h2>
          <p>Choisissez une référence, et nous préparons votre commande pour l'atelier.</p>
          <Link className="button button-primary" to="/products">
            Voir les pièces <ArrowLeft size={16} />
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <section className="cart-panel">
            <div className="cart-panel-heading">
              <h2>Pièces sélectionnées</h2>
              <span>
                {items.length} référence{items.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="cart-lines">
              {items.map(({ product, quantity }) => (
                <li className="cart-line" key={product.id}>
                  <img src={productImage(product)} alt="" width="86" height="86" />
                  <div className="cart-line-copy">
                    <span className="product-sku">{product.sku}</span>
                    <Link to={`/product/${encodeURIComponent(product.slug)}`}>
                      <strong>{product.name}</strong>
                    </Link>
                    <span>{formatDZD(product.priceDzd)} / pièce</span>
                    <div className="quantity-control" aria-label={`Quantité de ${product.name}`}>
                      <button
                        aria-label="Diminuer la quantité"
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(product.id, quantity - 1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label="Augmenter la quantité"
                        disabled={quantity >= product.stockQuantity}
                        onClick={() => setQuantity(product.id, quantity + 1)}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        className="remove-line"
                        aria-label={`Retirer ${product.name}`}
                        onClick={() => remove(product.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <strong className="cart-line-total">
                    {formatDZD(product.priceDzd * quantity)}
                  </strong>
                </li>
              ))}
            </ul>
            <Link className="continue-shopping" to="/products">
              <ArrowLeft size={15} /> Continuer mes achats
            </Link>
            <div className="cart-assurance">
              <span>
                <PackageCheck size={17} /> Compatibilité vérifiée
              </span>
              <span>
                <Truck size={17} /> Paiement à la réception
              </span>
            </div>
          </section>
          <form className="checkout-form" onSubmit={(event) => void submitOrder(event)}>
            <div className="checkout-form-heading">
              <span>01</span>
              <div>
                <h2>Où vous livrer ?</h2>
                <p>Quelques informations pour préparer votre colis.</p>
              </div>
            </div>
            <label className="form-field">
              <span>
                Nom complet <b>*</b>
              </span>
              <input
                name="customerName"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                placeholder="Votre nom"
                required
              />
            </label>
            <label className="form-field">
              <span>
                Numéro de téléphone <b>*</b>
              </span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                pattern="0[567][0-9]{8}"
                maxLength={10}
                placeholder="0551 04 17 51"
                title="Saisissez un numéro algérien commençant par 05, 06 ou 07."
                required
              />
              <small>Format algérien : 10 chiffres, 05 / 06 / 07</small>
            </label>
            {wilayas.isPending ? (
              <PageLoader />
            ) : wilayas.error ? (
              <ApiErrorNotice message={wilayas.error.message} />
            ) : (
              <>
                <label className="form-field">
                  <span>
                    Wilaya <b>*</b>
                  </span>
                  <select name="wilayaCode" required defaultValue="">
                    <option value="" disabled>
                      Choisissez votre wilaya
                    </option>
                    {wilayas.data?.map((wilaya) => (
                      <option key={wilaya.code} value={wilaya.code}>
                        {String(wilaya.code).padStart(2, "0")} · {wilaya.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="form-field">
              <span>
                Commune <b>*</b>
              </span>
              <input
                name="commune"
                autoComplete="address-level2"
                minLength={2}
                maxLength={120}
                placeholder="Votre commune"
                required
              />
            </label>
            <fieldset className="delivery-choice">
              <legend>
                Mode de livraison <b>*</b>
              </legend>
              <label
                className={
                  deliveryType === "HOME" ? "delivery-option is-selected" : "delivery-option"
                }
              >
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === "HOME"}
                  onChange={() => setDeliveryType("HOME")}
                />
                <Truck size={19} />
                <span>
                  <strong>À domicile</strong>
                  <small>À partir de 600 DA</small>
                </span>
                <b>600 DA</b>
              </label>
              <label
                className={
                  deliveryType === "STOPDESK" ? "delivery-option is-selected" : "delivery-option"
                }
              >
                <input
                  type="radio"
                  name="deliveryType"
                  checked={deliveryType === "STOPDESK"}
                  onChange={() => setDeliveryType("STOPDESK")}
                />
                <PackageCheck size={19} />
                <span>
                  <strong>Stop desk</strong>
                  <small>À retirer au bureau de livraison</small>
                </span>
                <b>400 DA</b>
              </label>
            </fieldset>
            <label className="form-field">
              <span>
                Remarque <small>(facultatif)</small>
              </span>
              <textarea
                name="notes"
                maxLength={1000}
                rows={3}
                placeholder="Précision pour la livraison ou l'atelier…"
              />
            </label>
            <div className="checkout-totals">
              <div>
                <span>Sous-total</span>
                <strong>{formatDZD(subtotal)}</strong>
              </div>
              <div>
                <span>Livraison</span>
                <strong>{formatDZD(deliveryFee)}</strong>
              </div>
              <div className="grand-total">
                <span>Total à payer à la livraison</span>
                <strong>{formatDZD(subtotal + deliveryFee)}</strong>
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="button button-primary submit-order"
              disabled={isSubmitting || wilayas.isPending || Boolean(wilayas.error)}
            >
              {isSubmitting ? "Envoi de votre commande…" : "Confirmer ma commande"}{" "}
              <ArrowLeft size={17} />
            </button>
            <p className="cod-disclaimer">
              <ShieldCheck size={15} /> Vous payez uniquement à la réception du colis.
            </p>
          </form>
        </div>
      )}
    </main>
  );
}
