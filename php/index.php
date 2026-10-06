<?php
declare(strict_types=1);

function escape_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function normalize_search(string $value): string
{
    $value = function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);

    return strtr($value, [
        'À' => 'a', 'Á' => 'a', 'Â' => 'a', 'Ä' => 'a', 'à' => 'a', 'á' => 'a', 'â' => 'a', 'ä' => 'a',
        'Ç' => 'c', 'ç' => 'c',
        'É' => 'e', 'È' => 'e', 'Ê' => 'e', 'Ë' => 'e', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'Î' => 'i', 'Ï' => 'i', 'î' => 'i', 'ï' => 'i',
        'Ô' => 'o', 'Ö' => 'o', 'ô' => 'o', 'ö' => 'o',
        'Ù' => 'u', 'Û' => 'u', 'Ü' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u',
        'Ÿ' => 'y', 'ÿ' => 'y',
    ]);
}

function category_image_path(string $category): ?string
{
    return match ($category) {
        'ecrans', 'vitre-camera' => 'assets/products/screen.jpg',
        'batteries' => 'assets/products/battery.jpg',
        'napolons', 'connecteurs' => 'assets/products/flex.jpg',
        'cameras' => 'assets/products/repair-bench.jpg',
        default => null,
    };
}

function product_image_path(string $category): string
{
    return category_image_path($category) ?? 'assets/products/repair-bench.jpg';
}

$whatsapp = 'https://wa.me/213551041751';
$search = isset($_GET['q']) && is_string($_GET['q']) ? trim($_GET['q']) : '';
$categoryFilter = isset($_GET['category']) && is_string($_GET['category']) ? trim($_GET['category']) : '';

$categories = [
    ['slug' => 'ecrans', 'name' => 'Écrans', 'arabic' => 'شاشات', 'count' => '+120 réf.', 'kind' => 'feature', 'tone' => 'screen'],
    ['slug' => 'batteries', 'name' => 'Batteries', 'arabic' => 'بطاريات', 'count' => '+80 réf.', 'kind' => 'feature', 'tone' => 'battery'],
    ['slug' => 'napolons', 'name' => 'Napolons', 'arabic' => 'نابولون الشحن', 'count' => '+65 réf.', 'kind' => 'feature', 'tone' => 'flex'],
    ['slug' => 'connecteurs', 'name' => 'Connecteurs', 'arabic' => 'منافذ الشحن', 'count' => '+48 réf.', 'kind' => 'feature', 'tone' => 'connector'],
    ['slug' => 'vitre-camera', 'name' => 'Vitre caméra', 'arabic' => 'زجاج الكاميرا', 'count' => '+32 réf.', 'kind' => 'small', 'tone' => 'camera-glass'],
    ['slug' => 'cameras', 'name' => 'Caméras', 'arabic' => 'كاميرات', 'count' => '+44 réf.', 'kind' => 'small', 'tone' => 'camera'],
    ['slug' => 'haut-parleurs', 'name' => 'Haut-parleurs', 'arabic' => 'مكبرات الصوت', 'count' => '+24 réf.', 'kind' => 'icon', 'icon' => 'vector-06.svg'],
    ['slug' => 'micros', 'name' => 'Micros', 'arabic' => 'ميكروفونات', 'count' => '+18 réf.', 'kind' => 'icon', 'icon' => 'vector-07.svg'],
    ['slug' => 'boutons', 'name' => 'Boutons', 'arabic' => 'أزرار', 'count' => '+20 réf.', 'kind' => 'icon', 'icon' => 'vector-08.svg'],
    ['slug' => 'tirages-sim', 'name' => 'Tirages SIM', 'arabic' => 'أدراج الشرائح', 'count' => '+16 réf.', 'kind' => 'icon', 'icon' => 'vector-01.svg'],
    ['slug' => 'frames', 'name' => 'Châssis / Frames', 'arabic' => 'هياكل', 'count' => '+30 réf.', 'kind' => 'icon', 'icon' => 'vector-03.svg'],
    ['slug' => 'cache-arriere', 'name' => 'Cache arrière', 'arabic' => 'الغطاء الخلفي', 'count' => '+40 réf.', 'kind' => 'icon', 'icon' => 'vector-02.svg'],
    ['slug' => 'capteur-empreinte', 'name' => 'Capteur empreinte', 'arabic' => 'مستشعر البصمة', 'count' => '+14 réf.', 'kind' => 'icon', 'icon' => 'vector-04.svg'],
    ['slug' => 'autres-pieces', 'name' => 'Autres pièces', 'arabic' => 'قطع أخرى', 'count' => '+90 réf.', 'kind' => 'icon', 'icon' => 'vector-10.svg'],
];

$productGroups = [
    'featured' => [
        ['name' => 'Écran LCD compatible Redmi 9A / 9C', 'compatibility' => 'compatible : Redmi 9A, Redmi 9C', 'reference' => 'VP-ECR-0912', 'price' => '4 200', 'category' => 'ecrans', 'stock' => 'En stock'],
        ['name' => 'Écran OLED compatible iPhone 13', 'compatibility' => 'compatible : iPhone 13', 'reference' => 'VP-ECR-1310', 'price' => '14 500', 'category' => 'ecrans', 'stock' => 'Stock limité'],
        ['name' => 'Écran Super AMOLED compatible Samsung A52', 'compatibility' => 'compatible : A525F / A52', 'reference' => 'VP-ECR-5204', 'price' => '9 800', 'category' => 'ecrans', 'stock' => 'En stock'],
        ['name' => 'Batterie compatible iPhone 13', 'compatibility' => 'compatible : iPhone 13', 'reference' => 'VP-BAT-1311', 'price' => '5 600', 'category' => 'batteries', 'stock' => 'En stock'],
    ],
    'best-sellers' => [
        ['name' => 'Batterie compatible Redmi Note 11', 'compatibility' => '5000 mAh · compatible : Note 11', 'reference' => 'VP-BAT-1107', 'price' => '3 100', 'category' => 'batteries', 'stock' => 'En stock'],
        ['name' => 'Napolon de charge compatible OPPO A16', 'compatibility' => 'compatible : OPPO A16', 'reference' => 'VP-FLX-1614', 'price' => '1 400', 'category' => 'napolons', 'stock' => 'Stock limité'],
        ['name' => 'Connecteur de charge compatible Samsung A12', 'compatibility' => 'compatible : Samsung A12', 'reference' => 'VP-CON-1203', 'price' => '900', 'category' => 'connecteurs', 'stock' => 'En stock'],
        ['name' => 'Caméra arrière compatible Redmi Note 12', 'compatibility' => 'compatible : Redmi Note 12', 'reference' => 'VP-CAM-1208', 'price' => '4 500', 'category' => 'cameras', 'stock' => 'En stock'],
    ],
    'new-arrivals' => [
        ['name' => 'Vitre caméra arrière compatible iPhone 12 Pro Max', 'compatibility' => 'compatible : iPhone 12 Pro Max', 'reference' => 'VP-VIT-1201', 'price' => '1 200', 'category' => 'vitre-camera', 'stock' => 'Stock limité'],
        ['name' => 'Haut-parleur compatible Samsung A32', 'compatibility' => 'compatible : Samsung A32', 'reference' => 'VP-SPK-3202', 'price' => '1 100', 'category' => 'haut-parleurs', 'stock' => 'En stock'],
        ['name' => 'Napolon de charge compatible OPPO A78', 'compatibility' => 'compatible : OPPO A78', 'reference' => 'VP-FLX-7811', 'price' => '1 600', 'category' => 'napolons', 'stock' => 'En stock'],
        ['name' => 'Écran LCD compatible Redmi Note 12', 'compatibility' => 'compatible : Redmi Note 12', 'reference' => 'VP-ECR-1213', 'price' => '4 800', 'category' => 'ecrans', 'stock' => 'En stock'],
    ],
];

$allProducts = array_merge(...array_values($productGroups));
$visibleProducts = $allProducts;
$normalizedSearch = normalize_search($search);
$searchTerms = array_values(array_filter(preg_split('/\s+/u', $normalizedSearch) ?: []));

if ($search !== '') {
    $visibleProducts = array_values(array_filter(
        $visibleProducts,
        static function (array $product) use ($searchTerms): bool {
            $searchable = normalize_search(implode(' ', [
                $product['name'],
                $product['compatibility'],
                $product['reference'],
                $product['category'],
            ]));

            foreach ($searchTerms as $term) {
                if (!str_contains($searchable, $term)) {
                    return false;
                }
            }

            return $searchTerms !== [];
        }
    ));
}

if ($categoryFilter !== '') {
    $visibleProducts = array_values(array_filter(
        $visibleProducts,
        static fn (array $product): bool => $product['category'] === $categoryFilter
    ));
}

$activeCategory = null;
foreach ($categories as $category) {
    if ($category['slug'] === $categoryFilter) {
        $activeCategory = $category['name'];
        break;
    }
}

$renderProducts = static function (array $products) use ($whatsapp): void {
    foreach ($products as $index => $product) {
        $message = rawurlencode('Bonjour, je souhaite commander : ' . $product['name'] . ' (' . $product['reference'] . ').');
        $stockClass = $product['stock'] === 'Stock limité' ? 'stock-limited' : 'stock-available';
        $productImage = product_image_path($product['category']);
        ?>
        <article class="product-card">
            <div class="product-art product-art-<?= ($index % 4) + 1 ?>">
                <img src="<?= escape_html($productImage) ?>" alt="" width="340" height="260" loading="lazy" decoding="async" aria-hidden="true">
                <span class="stock-badge <?= escape_html($stockClass) ?>"><i></i><?= escape_html($product['stock']) ?></span>
            </div>
            <div class="product-details">
                <h3><?= escape_html($product['name']) ?></h3>
                <p class="product-compatibility"><?= escape_html($product['compatibility']) ?></p>
                <p class="product-reference"><?= escape_html($product['reference']) ?> · SAMPLE</p>
                <div class="product-buy">
                    <p class="product-price"><?= escape_html($product['price']) ?> <span>DA</span></p>
                    <a class="order-link" href="<?= escape_html($whatsapp . '?text=' . $message) ?>" target="_blank" rel="noreferrer">
                        Commander <img src="assets/figma/hero-whatsapp.svg" alt="" aria-hidden="true">
                    </a>
                </div>
            </div>
        </article>
        <?php
    }
};
?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#eef2f9">
    <meta name="description" content="Pièces détachées pour téléphone, références lisibles et compatibilité vérifiée modèle par modèle. Livraison dans les 58 wilayas.">
    <title>VISION PRO — Pièces détachées téléphone</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="image" href="assets/products/repair-bench.jpg" fetchpriority="high">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Cousine:wght@400;700&family=Readex+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/site.css">
    <script src="assets/main.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Aller au contenu</a>
<header class="site-header" id="top">
    <div class="header-inner">
        <a class="brand" href="#top" aria-label="VISION PRO, accueil">
            <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <span>VISION PRO</span>
        </a>
        <a class="header-search-link" href="#recherche">
            <img src="assets/figma/vector-15.svg" alt="" aria-hidden="true">
            Rechercher une pièce
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
            <span class="sr-only">Ouvrir le menu</span>
            <i></i><i></i>
        </button>
        <nav class="primary-nav" id="primary-nav" aria-label="Navigation principale">
            <a href="#catalogue">Catalogue</a>
            <a href="#compatibilite">Par modèle</a>
            <a href="#atelier">Pourquoi nous</a>
            <a href="#livraison">Livraison <span lang="ar" dir="rtl">التوصيل</span></a>
        </nav>
        <div class="header-contact">
            <a class="phone-number" href="tel:+213551041751">0551 04 17 51</a>
            <a class="call-link" href="tel:+213551041751">Appeler</a>
            <a class="whatsapp-button" href="<?= escape_html($whatsapp) ?>" target="_blank" rel="noreferrer">
                <img src="assets/figma/vector-11.svg" alt="" aria-hidden="true"> WhatsApp
            </a>
        </div>
    </div>
</header>

<main id="main">
    <section class="hero-section" aria-labelledby="hero-title">
        <div class="hero-glow hero-glow-blue" aria-hidden="true"></div>
        <div class="hero-glow hero-glow-mint" aria-hidden="true"></div>
        <div class="hero-inner">
            <div class="hero-copy">
                <p class="eyebrow"><i></i><span>Banc de précision</span><span class="eyebrow-arabic" lang="ar" dir="rtl">مختبر الدقة</span></p>
                <h1 id="hero-title">La bonne<br>pièce.<br>Au bon<br>modèle.</h1>
                <p class="hero-description">Pièces détachées téléphone, références claires et compatibilité vérifiée avant chaque commande.</p>
                <div class="hero-actions">
                    <a class="button button-primary" href="#catalogue">Explorer le catalogue</a>
                    <a class="button button-quiet" href="<?= escape_html($whatsapp) ?>" target="_blank" rel="noreferrer">
                        <img src="assets/figma/hero-whatsapp.svg" alt="" aria-hidden="true"> Commander par WhatsApp
                    </a>
                </div>
            </div>
            <div class="hero-figure">
                <div class="hero-photo-frame">
                    <img src="assets/products/repair-bench.jpg" alt="Pièces détachées de téléphone disposées sur un tapis antistatique" width="1600" height="1008" fetchpriority="high" decoding="async">
                </div>
                <div class="hero-photo-badge">
                    <span class="hero-photo-check" aria-hidden="true">✓</span>
                    <span><strong>Compatibilité vérifiée</strong><small>La bonne pièce, au bon modèle</small></span>
                </div>
                <div class="hero-search" id="recherche">
                    <form class="hero-search-form" method="get" action="#catalogue" role="search">
                        <label class="sr-only" for="product-search">Rechercher une pièce ou un modèle</label>
                        <img src="assets/figma/vector-12.svg" alt="" aria-hidden="true">
                        <input id="product-search" type="search" name="q" value="<?= escape_html($search) ?>" placeholder="Samsung A52 écran…" autocomplete="off">
                        <button class="button button-primary" type="submit">Rechercher</button>
                    </form>
                    <div class="hero-anatomy" aria-hidden="true">
                        <span class="anatomy-chip"><b>MARQUE</b><span data-anatomy="brand">Samsung</span></span>
                        <span class="anatomy-chip"><b>MODÈLE</b><span data-anatomy="model">A52</span></span>
                        <span class="anatomy-chip"><b>PIÈCE</b><span data-anatomy="part">Écran</span></span>
                    </div>
                    <div class="popular-searches" aria-label="Recherches populaires">
                        <a href="?q=iPhone%2013%20batterie#catalogue">iPhone 13 batterie</a>
                        <a href="?q=Redmi%20Note%2012%20LCD#catalogue">Redmi Note 12 LCD</a>
                        <a href="?q=OPPO%20A16%20napolon#catalogue">OPPO A16 napolon</a>
                    </div>
                    <p class="search-note"><i></i>Décomposez votre recherche. Nous confirmons la référence par téléphone.</p>
                </div>
            </div>
            <a class="scroll-cue" href="#catalogue"><span>Défiler pour chercher</span><i></i></a>
        </div>
    </section>

    <section class="catalogue-section section-shell" id="catalogue" aria-labelledby="categories-title">
        <div class="content-width">
            <div class="section-intro category-intro">
                <div>
                    <p class="eyebrow"><i></i><span>01 / Le catalogue</span><span class="eyebrow-arabic" lang="ar" dir="rtl">الأصناف الرئيسية</span></p>
                    <h2 id="categories-title">Chaque pièce a sa place.</h2>
                </div>
                <p class="section-copy">Écrans, batteries, flex et pièces d’atelier pour les marques les plus utilisées en Algérie. Un rayon lisible avant même de demander une référence.</p>
                <span class="section-rule" aria-hidden="true"></span>
            </div>
            <div class="category-grid">
                <?php foreach ($categories as $category): ?>
                    <a class="category-card category-<?= escape_html($category['kind']) ?> <?= isset($category['tone']) ? 'category-tone-' . escape_html($category['tone']) : '' ?>" href="?category=<?= escape_html($category['slug']) ?>#catalogue">
                        <?php if ($image = category_image_path($category['slug'])): ?>
                            <img class="category-photo" src="<?= escape_html($image) ?>" alt="" width="400" height="400" loading="lazy" decoding="async" aria-hidden="true">
                        <?php endif; ?>
                        <?php if ($category['kind'] === 'icon'): ?>
                            <img class="category-icon" src="assets/figma/<?= escape_html($category['icon']) ?>" alt="" aria-hidden="true">
                        <?php endif; ?>
                        <span class="category-copy">
                            <strong><?= escape_html($category['name']) ?></strong>
                            <span class="category-arabic" lang="ar" dir="rtl"><?= escape_html($category['arabic']) ?></span>
                        </span>
                        <span class="category-count"><?= escape_html($category['count']) ?></span>
                    </a>
                <?php endforeach; ?>
                <a class="model-category" href="#compatibilite">
                    <span class="mini-eyebrow">La sortie du rayon</span>
                    <strong>Chercher par modèle</strong>
                    <span lang="ar" dir="rtl">البحث بالموديل</span>
                    <small>Samsung · Apple · Xiaomi · +6</small>
                </a>
            </div>
        </div>
    </section>

    <section class="compatibility-section section-shell" id="compatibilite" aria-labelledby="compatibility-title">
        <div class="content-width compatibility-layout">
            <div class="compatibility-copy">
                <p class="eyebrow"><i></i><span>02 / La compatibilité</span><span class="eyebrow-arabic" lang="ar" dir="rtl">التوافق الدقيق</span></p>
                <h2 id="compatibility-title">Trouvez la pièce exacte de votre téléphone.</h2>
                <p>Marque, modèle, pièce. Trois choix simples pour éviter la mauvaise référence — et un humain disponible pour confirmer.</p>
                <div class="gradient-rule" aria-hidden="true"></div>
                <aside class="reading-example">
                    <strong>Exemple de lecture</strong>
                    <p>Écran LCD Redmi 9A / 9C — compatible : Redmi 9A, Redmi 9C</p>
                </aside>
            </div>
            <div class="compatibility-picker">
                <div class="picker-step">
                    <div class="picker-heading"><h3><span>01</span> Choisissez la marque</h3><span>Marque</span></div>
                    <div class="choice-list brand-choices" role="group" aria-label="Choisissez la marque">
                        <?php foreach (['Samsung', 'Apple / iPhone', 'Xiaomi / Redmi', 'OPPO', 'Realme', 'Huawei', 'Honor', 'Infinix', 'Tecno'] as $brand): ?>
                            <button class="choice-button<?= $brand === 'Tecno' ? ' is-selected' : '' ?>" type="button" data-brand="<?= escape_html($brand) ?>" aria-pressed="<?= $brand === 'Tecno' ? 'true' : 'false' ?>"><?= escape_html($brand) ?></button>
                        <?php endforeach; ?>
                    </div>
                </div>
                <div class="picker-step">
                    <div class="picker-heading"><h3><span>02</span> Choisissez le modèle</h3><span>Modèle</span></div>
                    <div class="choice-list model-choices" role="group" aria-label="Choisissez le modèle">
                        <button class="choice-button is-selected" type="button" data-model="Spark 8" aria-pressed="true">Spark 8</button>
                        <button class="choice-button" type="button" data-model="Camon 18" aria-pressed="false">Camon 18</button>
                    </div>
                </div>
                <div class="picker-step">
                    <div class="picker-heading"><h3><span>03</span> Voyez les pièces compatibles</h3><span>Pièce</span></div>
                    <div class="choice-list part-choices" role="group" aria-label="Choisissez la pièce">
                        <button class="choice-button is-selected" type="button" data-part="Écran" aria-pressed="true">Écran</button>
                        <button class="choice-button" type="button" data-part="Batterie" aria-pressed="false">Batterie</button>
                        <button class="choice-button" type="button" data-part="Charge / flex" aria-pressed="false">Charge / flex</button>
                        <button class="choice-button" type="button" data-part="Caméra" aria-pressed="false">Caméra</button>
                    </div>
                    <p class="compatibility-status" aria-live="polite"><i></i>Filtre actif : <strong class="selected-compatibility">Tecno · Spark 8 · Écran</strong><a class="compatibility-submit" href="#references">Voir les pièces</a></p>
                </div>
            </div>
        </div>
    </section>

    <section class="products-section section-shell" id="references" aria-labelledby="products-title">
        <div class="content-width">
            <div class="section-intro product-intro">
                <div>
                    <p class="eyebrow"><i></i><span>03 / Les références</span><span class="eyebrow-arabic" lang="ar" dir="rtl">قطع جاهزة</span></p>
                    <h2 id="products-title">Le catalogue, pièce par pièce.</h2>
                </div>
                <p class="section-copy sample-copy">Exemples de catalogue — références, prix et stocks SAMPLE.</p>
                <span class="section-rule" aria-hidden="true"></span>
            </div>
            <?php if ($search !== '' || $categoryFilter !== ''): ?>
                <div class="filter-notice">
                    <p>
                        <?= $search !== '' ? 'Résultats pour « ' . escape_html($search) . ' »' : 'Catégorie : ' . escape_html($activeCategory ?? $categoryFilter) ?>
                    </p>
                    <a href="#references">Effacer le filtre</a>
                </div>
                <?php if ($visibleProducts === []): ?>
                    <p class="empty-results" role="status">Aucune référence ne correspond à votre recherche. Appelez-nous et nous confirmerons la pièce qu’il vous faut.</p>
                <?php else: ?>
                    <div class="product-grid filtered-products"><?php $renderProducts($visibleProducts); ?></div>
                <?php endif; ?>
            <?php else: ?>
                <?php
                $groupLabels = [
                    'featured' => ['En vedette', 'Références choisies'],
                    'best-sellers' => ['Meilleures ventes', 'Pour l’atelier'],
                    'new-arrivals' => ['Nouveautés', 'Arrivages atelier'],
                ];
                foreach ($productGroups as $groupKey => $products):
                    [$label, $caption] = $groupLabels[$groupKey];
                ?>
                    <div class="product-shelf">
                        <div class="shelf-heading"><h3><?= escape_html($label) ?></h3><span><?= escape_html($caption) ?></span></div>
                        <div class="product-grid"><?php $renderProducts($products); ?></div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </section>

    <section class="atelier-section section-shell" id="atelier" aria-labelledby="atelier-title">
        <div class="content-width atelier-layout">
            <figure class="atelier-art">
                <img src="assets/products/04 LE GESTE JUSTE.webp" alt="Technicien réparant un smartphone sur un établi" width="1536" height="1024" loading="lazy" decoding="async">
                <span>06 / ATELIER</span>
                <figcaption class="sr-only">Technicien réparant un smartphone sur un établi</figcaption>
            </figure>
            <div class="atelier-copy">
                <p class="eyebrow"><i></i><span>04 / Le geste juste</span><span class="eyebrow-arabic" lang="ar" dir="rtl">لماذا فيجن برو</span></p>
                <h2 id="atelier-title">Une référence nette. Un atelier qui avance.</h2>
                <p>Vision Pro parle le langage des réparateurs : une pièce identifiée, un conseil rapide, une expédition qui ne bloque pas le comptoir.</p>
                <div class="gradient-rule" aria-hidden="true"></div>
                <ol class="atelier-points">
                    <li><span>01</span><div><strong>Pièces testées à l’atelier</strong><small lang="ar" dir="rtl">قطع مجرّبة في الورشة</small></div></li>
                    <li><span>02</span><div><strong>Compatibilité vérifiée modèle par modèle</strong><small lang="ar" dir="rtl">توافق مؤكد لكل موديل</small></div></li>
                    <li><span>03</span><div><strong>Conseils techniques par téléphone</strong><small lang="ar" dir="rtl">نصيحة تقنية عبر الهاتف</small></div></li>
                    <li><span>04</span><div><strong>Prix grossiste pour les réparateurs</strong><small lang="ar" dir="rtl">أسعار بالجملة للمصلحين</small></div></li>
                </ol>
            </div>
        </div>
    </section>

    <section class="delivery-section section-shell" id="livraison" aria-labelledby="delivery-title">
        <div class="delivery-panel content-width">
            <div class="delivery-glow" aria-hidden="true"></div>
            <div class="delivery-heading">
                <div>
                    <p class="eyebrow"><i></i><span>05 / Le réseau</span><span class="eyebrow-arabic" lang="ar" dir="rtl">التوصيل</span></p>
                    <h2 id="delivery-title">La pièce part.<br>L’atelier reprend.</h2>
                    <p class="delivery-arabic" lang="ar" dir="rtl">توصيل إلى 58 ولاية</p>
                </div>
                <p class="delivery-description">Livraison dans les 58 wilayas, à domicile ou en stopdesk. Paiement à la livraison.</p>
            </div>
            <div class="delivery-metrics">
                <div><strong>58</strong><span>wilayas desservies</span><small lang="ar" dir="rtl">ولاية</small></div>
                <div><strong>&lt;24h</strong><span>expédition</span><small lang="ar" dir="rtl">إرسال</small></div>
                <div><strong>2</strong><span>modes de livraison</span><small lang="ar" dir="rtl">طرق التوصيل</small></div>
                <div><strong>0 DA</strong><span>paiement à la livraison</span><small lang="ar" dir="rtl">الدفع عند الاستلام</small></div>
            </div>
            <div class="delivery-footnotes"><span>Stopdesk à partir de 400 DA</span><span>Domicile à partir de 600 DA</span><span>Tarifs indicatifs</span></div>
        </div>
    </section>

    <section class="reviews-section section-shell" id="avis" aria-labelledby="reviews-title">
        <div class="content-width">
            <div class="reviews-intro">
                <p class="eyebrow"><i></i><span>06 / Retours d’atelier</span><span class="eyebrow-arabic" lang="ar" dir="rtl">آراء الحرفاء</span></p>
                <h2 id="reviews-title">Quand la référence est juste, le geste suit.</h2>
                <div class="gradient-rule" aria-hidden="true"></div>
            </div>
            <div class="review-grid">
                <figure class="review-card review-featured">
                    <span class="quote-mark" aria-hidden="true">“</span>
                    <blockquote>Je donne le modèle, je reçois une réponse claire. C’est ce qu’il faut quand le téléphone est déjà ouvert sur l’établi.</blockquote>
                    <figcaption><strong>Karim</strong><span>Blida · avis SAMPLE</span></figcaption>
                </figure>
                <figure class="review-card">
                    <span class="quote-mark" aria-hidden="true">“</span>
                    <blockquote>La pièce est arrivée vite et la référence correspondait à ma demande.</blockquote>
                    <figcaption><strong>Yacine</strong><span>Oran · avis SAMPLE</span></figcaption>
                </figure>
                <figure class="review-card">
                    <span class="quote-mark" aria-hidden="true">“</span>
                    <blockquote>Un appel avant de commander, cela évite une erreur de modèle.</blockquote>
                    <figcaption><strong>Sarah</strong><span>Alger · avis SAMPLE</span></figcaption>
                </figure>
            </div>
        </div>
    </section>
</main>

<footer class="site-footer">
    <div class="content-width">
        <div class="footer-main">
            <div class="footer-brand-column">
                <a class="brand brand-footer" href="#top" aria-label="VISION PRO, retour en haut">
                    <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>VISION PRO</span>
                </a>
                <p>Pièces détachées téléphone, références lisibles et compatibilité confirmée avant commande.</p>
                <a class="footer-phone" href="tel:+213551041751">0551 04 17 51</a>
                <a class="footer-whatsapp" href="<?= escape_html($whatsapp) ?>" target="_blank" rel="noreferrer"><img src="assets/figma/hero-whatsapp.svg" alt="" aria-hidden="true"> WhatsApp · واتساب</a>
            </div>
            <div class="footer-link-column"><h2>Catalogue</h2>
                <a href="?category=ecrans#catalogue">Écrans · شاشات</a><a href="?category=batteries#catalogue">Batteries · بطاريات</a><a href="?category=napolons#catalogue">Napolons</a><a href="?category=connecteurs#catalogue">Connecteurs</a><a href="?category=vitre-camera#catalogue">Vitre caméra</a>
            </div>
            <div class="footer-link-column"><h2>Pièces</h2>
                <a href="?category=cameras#catalogue">Caméras</a><a href="?category=haut-parleurs#catalogue">Haut-parleurs</a><a href="?category=micros#catalogue">Micros</a><a href="?category=boutons#catalogue">Boutons</a><a href="?category=tirages-sim#catalogue">Tirages SIM</a>
            </div>
            <div class="footer-link-column"><h2>Châssis &amp; plus</h2>
                <a href="?category=frames#catalogue">Frames</a><a href="?category=cache-arriere#catalogue">Cache arrière</a><a href="?category=capteur-empreinte#catalogue">Capteur empreinte</a><a href="?category=autres-pieces#catalogue">Autres pièces</a><a href="#compatibilite">Par modèle</a>
            </div>
            <div class="footer-contact-column"><h2>Horaires de contact</h2><p>Conseil par téléphone et WhatsApp Vision Pro · Algérie</p><a href="tel:+213551041751">Appeler maintenant <span aria-hidden="true">→</span></a></div>
        </div>
        <div class="footer-bottom"><p>© VISION PRO · Exemples de catalogue marqués SAMPLE</p><a href="#top">Retour en haut ↑</a></div>
    </div>
</footer>
</body>
</html>
