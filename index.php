<?php
$basePath = '/landing';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');
if ($uri === '') $uri = '/';

// Strip base path prefix so routes stay clean
if ($basePath !== '' && strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
    if ($uri === '' || $uri === false) $uri = '/';
}

$isHtmx = isset($_SERVER['HTTP_HX_REQUEST']);

// --- HTMX Partial Routes ---
if ($isHtmx && preg_match('#^/(spread|detail)/(\w+)$#', $uri, $m)) {
    $type = $m[1] === 'spread' ? 'spreads' : 'details';
    $name = $m[2];
    $allowed = ['cover', 'about', 'cv', 'diss'];
    if (!in_array($name, $allowed, true)) {
        http_response_code(404);
        echo 'Not found';
        exit;
    }
    $file = __DIR__ . "/partials/{$type}/{$name}.php";
    if (file_exists($file)) {
        include $file;
    } else {
        http_response_code(404);
        echo 'Not found';
    }
    exit;
}

// --- Full Page Routes ---
$sections = [
    '/'              => ['view' => 'book',   'spread' => 'cover'],
    '/about'         => ['view' => 'detail', 'section' => 'about',  'spreadIndex' => 1],
    '/cv'            => ['view' => 'detail', 'section' => 'cv',     'spreadIndex' => 2],
    '/dissertation'  => ['view' => 'detail', 'section' => 'diss',   'spreadIndex' => 3],
];

$route = $sections[$uri] ?? null;

if (!$route) {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><title>404</title></head><body><p>Page not found.</p></body></html>';
    exit;
}

$view = $route['view'];
$initialSpread = $route['spread'] ?? 'cover';
$initialDetail = $route['section'] ?? null;
$initialSpreadIndex = $route['spreadIndex'] ?? 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mono</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= $basePath ?>/css/style.css">
    <script src="https://unpkg.com/htmx.org@2.0.4" defer></script>
    <noscript>
        <style>
            .turn-zone,
            .spread-dots,
            .theme-toggle { display: none; }
            .book { opacity: 1; }
        </style>
    </noscript>
</head>
<body>

    <!-- Skip Link -->
    <a href="#spread-content" class="sr-only sr-only--focusable">
        Skip to content
    </a>

    <!-- Ambient particle canvas -->
    <canvas id="ambient-canvas" aria-hidden="true"></canvas>

    <!-- Dark/Light Toggle -->
    <button class="theme-toggle" role="switch" aria-checked="false"
            aria-label="Dark mode" id="theme-toggle">
        <span class="theme-toggle__icon theme-toggle__icon--sun">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </span>
        <span class="theme-toggle__icon theme-toggle__icon--moon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
        </span>
    </button>

    <!-- Book View -->
    <div class="scene" id="scene">
        <div class="ambient-glow" aria-hidden="true"></div>
        <div class="book" id="book" role="navigation" aria-label="Portfolio book">
            <div class="book__cover">

                <!-- Spread content — swapped by HTMX -->
                <div class="book__spread" id="spread-content">
                    <?php include __DIR__ . "/partials/spreads/{$initialSpread}.php"; ?>
                </div>

                <!-- Spine -->
                <div class="book__spine"></div>

            </div>
        </div>

        <!-- Position indicator dots -->
        <nav class="spread-dots" id="spread-dots" role="tablist"
             aria-label="Page navigation">
            <!-- Generated by JS -->
        </nav>

        <p class="hint" id="hint">Click a page to read more · Use arrow keys to turn pages</p>
    </div>

    <!-- Detail View -->
    <div class="detail <?= $view === 'detail' ? 'detail--active' : '' ?>"
         id="detail-view" role="main"
         aria-hidden="<?= $view === 'book' ? 'true' : 'false' ?>">
        <a href="<?= $basePath ?>/" class="detail__back" id="detail-back">
            &larr; Back to book
        </a>
        <div class="detail__page">
            <div class="detail__content" id="detail-content">
                <?php if ($view === 'detail' && $initialDetail): ?>
                    <?php include __DIR__ . "/partials/details/{$initialDetail}.php"; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Initial state for JS -->
    <script>
        window.__INITIAL_STATE__ = {
            view: '<?= $view ?>',
            section: <?= json_encode($initialDetail) ?>,
            spreadIndex: <?= $initialSpreadIndex ?>,
            basePath: '<?= $basePath ?>'
        };
    </script>

    <script src="<?= $basePath ?>/js/book.js"></script>
    <script src="<?= $basePath ?>/js/particles.js"></script>
</body>
</html>
