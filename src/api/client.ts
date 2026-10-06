import type {
  Brand,
  AdminOrder,
  Category,
  CreateOrderInput,
  CreatedOrder,
  HomePayload,
  PhoneModel,
  Product,
  ProductPage,
  SearchSuggestion,
} from "@vision-pro/types";

const baseUrl = (import.meta.env["VITE_API_URL"] || "http://127.0.0.1:5000/api").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `The request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export const api = {
  home: () => request<HomePayload>("/home"),
  categories: () => request<Category[]>("/categories"),
  brands: () => request<Brand[]>("/brands"),
  models: (brandSlug: string) =>
    request<PhoneModel[]>(`/brands/${encodeURIComponent(brandSlug)}/models`),
  products: (query: URLSearchParams) => request<ProductPage>(`/products?${query.toString()}`),
  search: (query: string) =>
    request<{ total: number; items: Product[] }>(`/search?q=${encodeURIComponent(query)}`),
  suggestions: (query: string) =>
    request<SearchSuggestion[]>(`/search/suggest?q=${encodeURIComponent(query)}`),
  product: (slug: string) => request<Product>(`/products/${encodeURIComponent(slug)}`),
  placeOrder: (input: CreateOrderInput) =>
    request<CreatedOrder>("/orders", { method: "POST", body: JSON.stringify(input) }),
  wilayas: () => request<import("@vision-pro/types").Wilaya[]>("/wilayas"),
  adminLogin: (email: string, password: string) =>
    request<{ token: string; user: { id: string; email: string; role: string } }>(
      "/admin/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    ),
  adminProducts: (token: string) =>
    request<ProductPage>("/admin/products?limit=100", undefined, token),
  adminOrders: (token: string) =>
    request<{ items: AdminOrder[] }>("/admin/orders?limit=100", undefined, token),
  updateStock: (token: string, productId: string, stockQuantity: number, stockStatus: string) =>
    request(
      `/admin/products/${encodeURIComponent(productId)}/stock`,
      {
        method: "PUT",
        body: JSON.stringify({ stockQuantity, stockStatus }),
      },
      token,
    ),
  updateOrderStatus: (token: string, orderId: string, status: string) =>
    request(
      `/admin/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      },
      token,
    ),
};
