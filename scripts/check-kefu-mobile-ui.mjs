import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../src/kefu/Kefu.vue', import.meta.url), 'utf8');
const mainQaAnswerCards = await readFile(new URL('../src/kefu/MainQaAnswerCards.vue', import.meta.url), 'utf8');
const itineraryPlanner = await readFile(new URL('../src/kefu/ItineraryPlanner.vue', import.meta.url), 'utf8');
const buildScript = await readFile(new URL('./inline-dist-assets.mjs', import.meta.url), 'utf8');
const entryHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

const checks = [
  ['dynamic viewport height', /\.screen-shell\s*\{[^}]*height:\s*100dvh/s],
  ['shrinkable composer column', /\.composer\s*\{[^}]*grid-template-columns:\s*36px\s+36px\s+minmax\(0,\s*1fr\)\s+42px/s],
  ['input may shrink on mobile', /\.input\s*\{[^}]*min-width:\s*0/s],
  ['hero clips mascot overflow', /\.hero\s*\{[^}]*overflow:\s*(?:hidden|clip)/s],
  ['hero has collapse transition', /\.hero\s*\{[^}]*transition:[^}]*(?:min-height|grid-template-columns)/s],
  ['mascot has opacity transition', /\.mascot\s*\{[^}]*transition:[^}]*opacity/s],
  ['expanded mascot is visually collapsed', /\.screen\.chat-expanded\s+\.mascot\s*\{[^}]*opacity:\s*0[^}]*height:\s*0/s],
  ['expanded mascot is not display none', (source) => !/\.screen\.chat-expanded\s+\.hello h2,\s*\n\s*\.screen\.chat-expanded\s+\.mascot\s*\{[^}]*display:\s*none/s.test(source)],
  ['modal covers visual viewport', /\.modal-layer\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s],
  ['reduced motion fallback', /@media\s*\(prefers-reduced-motion:\s*reduce\)/s],
  ['chat images are interactive', /\.bubble img\.chat-image\s*\{[^}]*cursor:\s*zoom-in/s],
  ['image preview covers visual viewport', /\.image-preview\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0/s],
  ['image preview preserves full image', /\.image-preview__image\s*\{[^}]*object-fit:\s*contain/s],
  ['image preview dialog exists', /id="imagePreview"[^>]*role="dialog"[^>]*aria-modal="true"/s],
  ['image preview has close control', /data-close-image-preview[^>]*aria-label="关闭图片预览"/s],
  ['chat image click opens preview', /chatList\.addEventListener\("click",[\s\S]*?closest\("\.chat-image"\)[\s\S]*?openImagePreview/s],
  ['escape closes image preview', /event\.key\s*===\s*"Escape"[\s\S]*?closeImagePreview/s],
  ['browser back closes image preview', /window\.addEventListener\("popstate",[\s\S]*?closeImagePreview/s],
  ['image preview owns touch gestures', /\.image-preview\s*\{[^}]*touch-action:\s*none/s],
  ['image gesture scale limits exist', /IMAGE_PREVIEW_MIN_SCALE\s*=\s*1[\s\S]*?IMAGE_PREVIEW_MAX_SCALE\s*=\s*4[\s\S]*?IMAGE_PREVIEW_DOUBLE_TAP_SCALE\s*=\s*2\.5/s],
  ['image gesture uses pointer tracking', /const imagePreviewPointers\s*=\s*new Map\(\)/s],
  ['image gesture applies unified transform', /function applyImagePreviewTransform[\s\S]*?translate3d\([\s\S]*?scale\(/s],
  ['image gesture constrains translation', /function constrainImagePreviewTransform[\s\S]*?Math\.max\(0,[\s\S]*?clamp\(/s],
  ['image gesture handles pointer lifecycle', /imagePreviewImage\?\.addEventListener\("pointerdown"[\s\S]*?"pointermove"[\s\S]*?"pointerup"[\s\S]*?"pointercancel"/s],
  ['image gesture supports double tap', /function toggleImagePreviewZoom[\s\S]*?IMAGE_PREVIEW_DOUBLE_TAP_SCALE/s],
  ['image gesture resets with preview lifecycle', /function openImagePreview[\s\S]*?resetImagePreviewGesture[\s\S]*?function closeImagePreview[\s\S]*?resetImagePreviewGesture/s],
  ['custom pinch prevents native gestures', /imagePreviewImage\?\.addEventListener\("pointermove"[\s\S]*?event\.preventDefault\(\)/s],
  ['mainqa card host may shrink inside bubble', /\.mainqa-stream-host,\s*\.mainqa-answer,\s*\[data-mainqa-answer-cards\]\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*100%/s],
  ['candidate panel is inset-free, transparent, and clips fixed-width cards', () => /\.qa-recommend-panel--candidate\s*\{[^}]*padding:\s*0[^}]*overflow:\s*hidden[^}]*background:\s*transparent[^}]*backdrop-filter:\s*none/s.test(mainQaAnswerCards)],
  ['candidate strip owns horizontal scrolling', () => /\.qa-recommend-panel\s+\.candidate-strip\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*max-width:\s*100%[^}]*overflow-x:\s*auto/s.test(mainQaAnswerCards)],
  ['short chat messages keep content height and follow the history entry', /\.chat-list\s*\{[^}]*grid-auto-rows:\s*max-content[^}]*align-content:\s*start/s],
  ['streaming answer removes the upper transient status', (source) => !/class="mainqa-status"/.test(source)],
  ['GKH mini program navigation uses the bundled WeChat SDK', /import wx from "weixin-js-sdk"[\s\S]*?function navigateToGkhMiniProgram[\s\S]*?wx\?\.miniProgram[\s\S]*?miniProgram\.navigateTo/s],
  ['all GKH entity entry points share the navigation helper', (source) => (source.match(/navigateToGkhMiniProgram\(target\.miniPath(?:,|\))/g) || []).length >= 3],
  ['GKH navigation emits request, environment, success and failure diagnostics', /\[GKH_NAV\][\s\S]*?navigateTo success[\s\S]*?navigateTo failed/s],
  ['customer-service back exits through the mini program bridge', /function navigateBackFromKefu[\s\S]*?miniProgram\.getEnv[\s\S]*?miniProgram\.navigateBack[\s\S]*?miniProgram\.switchTab/s],
  ['header back exits only after internal screens return to entry', /if \(current && current !== "entry"\) setScreen\("entry"\);\s*else navigateBackFromKefu\(\)/s],
  ['returning from itinerary detail reloads the itinerary list', () => /async function goBack\(\)[\s\S]*?detail\.value\s*=\s*null[\s\S]*?await loadList\(\)/s.test(itineraryPlanner)],
  ['itinerary list and detail use distinct clean History routes', /ITINERARY_LIST_PATH\s*=\s*`\$\{appBasePath\}\/itinerary`[\s\S]*?ITINERARY_DETAIL_PATH_PREFIX\s*=\s*`\$\{ITINERARY_LIST_PATH\}\/`[\s\S]*?history\.pushState/s],
  ['itinerary browser back and swipe restore the routed page', /window\.addEventListener\("popstate"[\s\S]*?syncItineraryRoute\(\)/s],
  ['itinerary header back delegates to History when route managed', () => /if \(props\.routeManaged\)[\s\S]*?emit\('routeBack',[\s\S]*?return/s.test(itineraryPlanner)],
  ['direct itinerary detail pushes only its real history entry', (source) => {
    const detailRoute = source.match(/async function openItineraryDetailRoute[\s\S]*?(?=\n\s*async function syncItineraryRoute)/)?.[0] || '';
    return (detailRoute.match(/history\.pushState/g) || []).length === 1;
  }],
  ['itinerary header has no separate close button', () => !/itinerary-header-button close/.test(itineraryPlanner)],
  ['itinerary route pages cover the dynamic viewport instead of the phone container', () => /\.itinerary-overlay\{[^}]*position:fixed[^}]*width:100dvw[^}]*height:100dvh/s.test(itineraryPlanner)],
  ['itinerary route mount is outside the clipped phone shell', /<\/div>\s*<!-- 路由页面独立挂载[\s\S]*?<div id="itineraryPlannerMount"><\/div>/s],
  ['itinerary routes animate forward and back with reduced-motion handling', () => /itinerary-transition-exit-forward[\s\S]*?itinerary-transition-enter-forward[\s\S]*?itinerary-transition-exit-back[\s\S]*?itinerary-transition-enter-back[\s\S]*?prefers-reduced-motion/s.test(itineraryPlanner)],
  ['itinerary transition cross-fades old and new DOM snapshots without movement', () => /cloneNode\(true\)[\s\S]*?itinerary-transition-exit-[\s\S]*?itinerary-transition-enter-/s.test(itineraryPlanner) && itineraryPlanner.includes('@keyframes itinerary-page-old-forward{from{opacity:1}to{opacity:0}}') && itineraryPlanner.includes('@keyframes itinerary-page-new-forward{from{opacity:0}to{opacity:1}}') && !/itinerary-page-(?:old|new)-(?:forward|back)[^\n]*translate/s.test(itineraryPlanner)],
  ['home page participates in the same route cross-fade', /currentPage\s*=\s*mountNode\?\.querySelector\("\.itinerary-overlay"\)\s*\|\|\s*document\.querySelector\("\.board"\)[\s\S]*?nextPage\s*=\s*mountNode\?\.querySelector\("\.itinerary-overlay"\)\s*\|\|\s*document\.querySelector\("\.board"\)/s],
  ['itinerary transition no longer depends on unstable native view transitions', () => !/startViewTransition/.test(itineraryPlanner)],
  ['iOS swipe back does not replay the page transition after popstate', /if \(itineraryHistoryBackPending\)[\s\S]*?runItineraryRouteTransition\("back"[\s\S]*?else \{[\s\S]*?syncItineraryRoute\("none"\)/s],
  ['detail back reuses the retained list instead of remounting it', () => /kefuItineraryFromList[\s\S]*?runRouteViewTransition\('back'[\s\S]*?detail\.value = null[\s\S]*?emit\('routeBack', true\)/s.test(itineraryPlanner)],
  ['itinerary popstate uses the back transition', /popstate[\s\S]*?runItineraryRouteTransition\("back"[\s\S]*?syncItineraryRoute/s],
  ['entry HTML declares no-store caching', () => /Cache-Control[^>]*no-store[^>]*no-cache/s.test(entryHtml)],
  ['build emits a WebView version manifest', () => /version\.json[\s\S]*?BUILD_VERSION[\s\S]*?writeFile\(versionFile/s.test(buildScript)],
  ['WebView checks version on resume and visibility', () => /cache:\s*'no-store'/s.test(buildScript) && /pageshow/s.test(buildScript) && /visibilitychange/s.test(buildScript)],
];

const failures = checks.filter(([, matcher]) => (
  matcher instanceof RegExp ? !matcher.test(html) : !matcher(html)
));

if (failures.length) {
  console.error(`Kefu mobile UI checks failed (${failures.length}):`);
  failures.forEach(([name]) => console.error(`- ${name}`));
  process.exit(1);
}

console.log(`Kefu mobile UI checks passed (${checks.length}).`);
