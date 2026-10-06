import type { Product } from "@vision-pro/types";
import screenImage from "../../assets/cat-screen.jpg";
import batteryImage from "../../assets/cat-battery.jpg";
import flexImage from "../../assets/cat-flex.jpg";
import partsImage from "../../assets/hero.jpg";

export function productImage(product: Product): string {
  if (product.images?.[0]?.url) return product.images[0].url;
  const slug = product.category?.slug ?? "";
  if (["ecrans", "vitre-camera", "vitres-camera"].includes(slug)) return screenImage;
  if (slug === "batteries") return batteryImage;
  if (["napolons", "connecteurs"].includes(slug)) return flexImage;
  return partsImage;
}
