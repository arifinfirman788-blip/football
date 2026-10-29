import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/kefu/index.html', import.meta.url), 'utf8');

const checks = [
  ['dynamic viewport height', /\.screen-shell\s*\{[^}]*height:\s*100dvh/s],
  ['shrinkable composer column', /\.composer\s*\{[^}]*grid-template-columns:\s*36px\s+36px\s+minmax\(0,\s*1fr\)\s+42px/s],
  ['input may shrink on mobile', /\.input\s*\{[^}]*min-width:\s*0/s],
  ['hero clips mascot overflow', /\.hero\s*\{[^}]*overflow:\s*(?:hidden|clip)/s],
  ['hero has collapse transition', /\.hero\s*\{[^}]*transition:[^}]*(?:min-height|grid-template-columns)/s],
  ['mascot has opacity transition', /\.mascot\s*\{[^}]*transition:[^}]*opacity/s],
  ['expanded mascot is visually collapsed', /\.screen\.chat-expanded\s+\.mascot\s*\{[^}]*opacity:\s*0[^}]*height:\s*0/s],
  ['expanded mascot is not display none', (source) => !/\.screen\.chat-expanded\s+\.hello h2,\s*\n\s*\.screen\.chat-expanded\s+\.mascot\s*\{[^}]*display:\s*none/s.test(source)],
  ['modal stays inside stable app shell', /\.modal-layer\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0[^}]*height:\s*100%[^}]*min-height:\s*0/s],
  ['order modal has no backdrop background or blur', /\.order-layer\s*\{[^}]*background:\s*transparent[^}]*backdrop-filter:\s*none[^}]*-webkit-backdrop-filter:\s*none[^}]*contain:\s*layout paint/s],
  ['transparent order layer does not animate opacity', /\.order-layer\s*\{[^}]*opacity:\s*1[^}]*transition:\s*visibility 0s linear \.34s/s],
  ['scenario cards do not scale during order modal compositing', /\.scenario-card:active\s*\{[^}]*transform:\s*none/s],
  ['icon refresh is scoped and idempotent', /function iconRefresh\(root = document\)[\s\S]*?createIcons\(\{[\s\S]*?root[\s\S]*?svg\[data-lucide\][\s\S]*?removeAttribute\("data-lucide"\)/s],
  ['order rendering only refreshes order icons', /function renderOrderCards[\s\S]*?iconRefresh\(orderList\);/s],
  ['opening a cached order list does not rebuild it', /const shouldResetOrderList = chatState\.orderFilter !== "全部"[\s\S]*?if \(chatState\.ordersLoadedAt > 0 && shouldResetOrderList\)/s],
  ['order sheet avoids iOS backdrop blur', /\.order-layer \.order-sheet\s*\{[^}]*backdrop-filter:\s*none[^}]*-webkit-backdrop-filter:\s*none/s],
  ['order consultation is a non-submit button', /<button class="scenario-card" type="button" data-order-consult="entry">/s],
  ['order consultation prevents default click behavior', /const orderConsultTarget[\s\S]*?event\.preventDefault\(\)[\s\S]*?event\.stopPropagation\(\)[\s\S]*?startOrderConsultationFlow/s],
  ['opening order modal does not update the underlying page', /function startOrderConsultationFlow\(options = \{\}\) \{(?:(?!setScreen|activateChatReadingMode)[\s\S])*?openOrders\(\);[\s\S]*?\}/s],
  ['order consultation reuses the same modal path as supplemental orders', /function startOrderConsultationFlow\(options = \{\}\) \{\s*chatState\.orderGuidanceActive = true;\s*openOrders\(\);\s*\}/s],
  ['selecting an order does not relayout the underlying page', /function sendOrder\(order\) \{(?:(?!setScreen|activateChatReadingMode)[\s\S])*?closeOrders\([\s\S]*?renderOrderCard/s],
  ['order selection prevents default behavior and stops dispatch', /const orderTarget[\s\S]*?event\.preventDefault\(\)[\s\S]*?event\.stopPropagation\(\)[\s\S]*?sendOrder\(order\);[\s\S]*?return;/s],
  ['order selection commits user and AI messages together', /chatList\.insertAdjacentHTML\(\s*"beforeend",\s*`\$\{userOrderMessageHtml\([\s\S]*?\}\)\}\$\{aiMessageHtml\(orderSelectionFollowupHtml\(\)\)\}`\s*\);\s*iconRefresh\(chatList\);/s],
  ['order selection does not globally refresh icons', /const renderOrderCard[\s\S]*?iconRefresh\(chatList\);/s],
  ['order query is cached after initial load', /ordersLoadedAt:\s*0[\s\S]*?if \(!force && chatState\.ordersLoadedAt > 0\)[\s\S]*?ordersLoadedAt = Date\.now\(\)/s],
  ['concurrent order queries are deduplicated', /ordersLoadingPromise:\s*null[\s\S]*?if \(chatState\.ordersLoadingPromise\) return chatState\.ordersLoadingPromise/s],
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
