export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type DeliveryType = "HOME" | "STOPDESK";
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "RETURNED";
export type AdminRole = "SUPERADMIN" | "STAFF";
export type ProductSort = "price_asc" | "price_desc" | "newest" | "popular";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isPopular: boolean;
}

export interface PhoneModel {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  releaseYear: number | null;
  aliases: string[];
  isPopular: boolean;
  brand?: Brand;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  description: string;
  descriptionAr: string | null;
  priceDzd: number;
  comparePriceDzd: number | null;
  stockQuantity: number;
  stockStatus: StockStatus;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  category?: Category;
  images?: ProductImage[];
  compatibilities?: Array<{ phoneModel: PhoneModel }>;
  _count?: { compatibilities: number };
}

export interface ProductPage {
  total: number;
  page: number;
  totalPages: number;
  items: Product[];
}

export interface SearchSuggestion {
  group: "brands" | "models" | "categories" | "products";
  label: string;
  to: string;
  imageUrl?: string;
  sku?: string;
  priceDzd?: number;
}

export interface HomePayload {
  featuredProducts: Product[];
  bestSellers: Product[];
  newArrivals: Product[];
  popularBrands: Brand[];
  popularModels: PhoneModel[];
  categories: Category[];
  approvedReviews: Review[];
}

export interface Review {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface CartOrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  wilayaCode: number;
  commune: string;
  deliveryType: DeliveryType;
  notes?: string;
  items: CartOrderItem[];
}

export interface CreatedOrder {
  orderNumber: string;
  totalDzd: number;
  deliveryFee: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  wilayaCode: number;
  wilaya: string;
  commune: string;
  deliveryType: DeliveryType;
  deliveryFee: number;
  totalDzd: number;
  status: OrderStatus;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: Product;
  }>;
}

export interface Wilaya {
  code: number;
  name: string;
  nameAr: string;
}

export const wilayas: Wilaya[] = [
  ["Adrar", "أدرار"],
  ["Chlef", "الشلف"],
  ["Laghouat", "الأغواط"],
  ["Oum El Bouaghi", "أم البواقي"],
  ["Batna", "باتنة"],
  ["Béjaïa", "بجاية"],
  ["Biskra", "بسكرة"],
  ["Béchar", "بشار"],
  ["Blida", "البليدة"],
  ["Bouira", "البويرة"],
  ["Tamanrasset", "تمنراست"],
  ["Tébessa", "تبسة"],
  ["Tlemcen", "تلمسان"],
  ["Tiaret", "تيارت"],
  ["Tizi Ouzou", "تيزي وزو"],
  ["Alger", "الجزائر"],
  ["Djelfa", "الجلفة"],
  ["Jijel", "جيجل"],
  ["Sétif", "سطيف"],
  ["Saïda", "سعيدة"],
  ["Skikda", "سكيكدة"],
  ["Sidi Bel Abbès", "سيدي بلعباس"],
  ["Annaba", "عنابة"],
  ["Guelma", "قالمة"],
  ["Constantine", "قسنطينة"],
  ["Médéa", "المدية"],
  ["Mostaganem", "مستغانم"],
  ["M'Sila", "المسيلة"],
  ["Mascara", "معسكر"],
  ["Ouargla", "ورقلة"],
  ["Oran", "وهران"],
  ["El Bayadh", "البيض"],
  ["Illizi", "إليزي"],
  ["Bordj Bou Arréridj", "برج بوعريريج"],
  ["Boumerdès", "بومرداس"],
  ["El Tarf", "الطارف"],
  ["Tindouf", "تندوف"],
  ["Tissemsilt", "تيسمسيلت"],
  ["El Oued", "الوادي"],
  ["Khenchela", "خنشلة"],
  ["Souk Ahras", "سوق أهراس"],
  ["Tipaza", "تيبازة"],
  ["Mila", "ميلة"],
  ["Aïn Defla", "عين الدفلى"],
  ["Naâma", "النعامة"],
  ["Aïn Témouchent", "عين تموشنت"],
  ["Ghardaïa", "غرداية"],
  ["Relizane", "غليزان"],
  ["Timimoun", "تيميمون"],
  ["Bordj Badji Mokhtar", "برج باجي مختار"],
  ["Ouled Djellal", "أولاد جلال"],
  ["Béni Abbès", "بني عباس"],
  ["In Salah", "عين صالح"],
  ["In Guezzam", "عين قزام"],
  ["Touggourt", "تقرت"],
  ["Djanet", "جانت"],
  ["El M'Ghair", "المغير"],
  ["El Meniaa", "المنيعة"],
].map(([name, nameAr], index) => ({ code: index + 1, name: name!, nameAr: nameAr! }));
