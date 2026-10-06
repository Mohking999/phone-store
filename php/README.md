# VISION PRO — PHP edition

This folder contains a standalone PHP storefront modeled on the supplied VISION PRO Figma design. It does not change or depend on the React/Vite application in the repository root.

## Requirements

- PHP 8.1 or newer
- Internet access for the Readex Pro, Cairo, and Cousine fonts (Google Fonts)

No Composer packages, database, Node.js, or build step are required. The product cards intentionally show clearly marked sample catalog data. Local screen, battery, flex-cable, and repair-bench photos are bundled in `assets/products/`; the TypeScript storefront uses the same source photos from `src/assets/`.

## Run locally

From the repository root:

```powershell
php -S 127.0.0.1:8000 -t php
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Search, category filters, responsive navigation, the model compatibility picker, and WhatsApp order links are included.
