<template>
  <section v-if="hasContent" class="qa-cards">
    <template v-if="cardType === 'city'">
      <section class="qa-recommend-panel qa-recommend-panel--city">
        <details v-for="(item, index) in cardData" :key="item.id || index" class="where-card">
          <summary><span>{{ item.shortName || item.name }}</span><label class="city-choice" @click.stop><input v-model="selectedCity" type="checkbox" :value="item.id || item.shortName || item.name" :aria-label="`选择${item.shortName || item.name}`"><span class="selection-indicator" aria-hidden="true"></span></label></summary>
          <p><b>推荐景点：</b>{{ item.recommendedAttractions || '暂无' }}</p><p><b>小众推荐：</b>{{ item.nicheAttractions || '暂无' }}</p><p><b>当地美食：</b>{{ item.specialFood || '暂无' }}</p>
        </details>
        <button class="plan-button" type="button" @click="generateCity">生成路线规划</button>
      </section>
    </template>

    <template v-else-if="cardType === 'area'">
      <section class="qa-recommend-panel qa-recommend-panel--area">
        <article v-for="(item, index) in paginatedAreaData" :key="item.id || areaItemKey(item, index)" class="scenic-card" @click="open(item)">
          <img :src="image(item)" alt="" @error="fallbackImageLoad"><span v-if="!image(item)" class="image-placeholder"></span>
          <div><b>{{ item.scenicSpotAlias || item.specialSpotName || item.scenicSpotName || item.name }}</b><p class="tags"><i v-if="item.scenicSpotScore">{{ Number(item.scenicSpotScore).toFixed(1) }}分</i><i v-for="tag in tags(item)" :key="tag">{{ tag }}</i></p><small v-if="item.openingStart || item.openingEnd">开放：{{ item.openingStart }}-{{ item.openingEnd }}</small><small>门票：{{ item.cost || item.ticketPrice || item.charging || '免费' }}　游览：{{ item.tourDurationText || item.tourDuration || '' }}</small><small>{{ item.addressDetail || item.address || item.city || '' }}</small></div>
          <label v-if="!orderSupported" class="choice" @click.stop><input v-model="selectedArea" type="checkbox" :value="item.id || item.scenicSpotAlias || item.name" :aria-label="`选择${item.scenicSpotAlias || item.specialSpotName || item.scenicSpotName || item.name}`"><span class="selection-indicator" aria-hidden="true"></span></label>
        </article>
        <nav v-if="areaPageCount > 1" class="scenic-pagination" aria-label="景点结果分页">
          <button type="button" :disabled="scenicPage === 1" @click="goToScenicPage(scenicPage - 1)">上一页</button>
          <span>第 {{ scenicPage }} / {{ areaPageCount }} 页</span>
          <button type="button" :disabled="scenicPage === areaPageCount" @click="goToScenicPage(scenicPage + 1)">下一页</button>
        </nav>
        <button v-if="!orderSupported" class="plan-button" type="button" @click="generateArea">生成路线规划</button>
      </section>
    </template>

    <template v-else-if="cardType === 'food' || cardType === 'holiday'">
      <div class="folk-grid"><article v-for="(item, index) in cardData" :key="item.id || index" class="folk-card" @click="open(item)"><img :src="image(item)" alt="" @error="fallbackImageLoad"><div><b>{{ item.specialFood || item.eventName || item.productName || item.name }}</b><small>{{ item.introduction || item.eventDescription || '' }}</small></div></article></div>
    </template>

    <template v-else-if="cardType === 'hotel' || cardType === 'restaurant'">
      <!-- 对齐 CardItem > CardNodeType：灰色头部 + 图文内容区，而非普通横向商品行。 -->
      <article v-for="(item, index) in cardData" :key="item.id || index" class="entity-node-card" @click="open(item)">
        <header><div><b>{{ item.hotelName || item.restaurantName || item.name || item.title }}</b><small>{{ entitySubtitle(item) }}</small></div><span v-if="item.sourceFrom === 'outside'">手动添加</span></header>
        <div class="entity-node-body"><img :src="image(item)" alt="" @error="fallbackImageLoad"><div><strong>⌖ {{ entityAddress(item) }}</strong><p><i v-for="tag in entityTags(item)" :key="tag">{{ tag }}</i></p></div></div>
      </article>
    </template>

    <template v-else-if="['train', 'airplane', 'activity'].includes(cardType)">
      <!-- 与 travel-client/components/card/Order.vue 一致：按票种使用原卡片背景和日期/星期结构。 -->
      <article v-for="(item, index) in cardData" :key="item.id || index" class="order-card" :class="orderBackground(item)" @click="open(item)">
        <b>{{ orderName(item) }}</b>
        <small v-if="item.starting_date"><span>{{ item.starting_date }}</span><span>{{ orderWeekday(item.starting_date) }}</span></small>
      </article>
    </template>

    <template v-else-if="candidates.length">
      <section class="qa-recommend-panel qa-recommend-panel--candidate">
        <div class="candidate-strip">
          <article v-for="(item, index) in candidates" :key="item.id || index" class="candidate-card" @click="open(item)">
            <img :src="image(item)" alt="" @error="fallbackImageLoad">
            <span class="candidate-type" :class="typeClass(item)">{{ typeLabel(item) }}</span>
            <span class="candidate-bottom"><b>{{ item.scenicSpotAlias || item.scenicSpotName || item.specialFood || item.hotelName || item.restaurantName || item.name }}</b><i>{{ candidateTag(item) }}</i><em v-if="candidatePrice(item)">¥{{ candidatePrice(item) }}起</em></span>
          </article>
        </div>
      </section>
    </template>
    <section v-if="suggestions.length" class="trip-suggest">
      <p>{{ cueText || '您可以这样问' }}</p>
      <button v-for="(question, index) in suggestions" :key="index" type="button" @click="ask(question)">{{ questionText(question) }}</button>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
const props = defineProps<{ cardType?: string, cardData?: any[], candidates?: any[], orderSupported?: boolean, cueText?: string, suggestions?: any[] }>()
const emit = defineEmits<{ open: [item: any], generate: [payload: { city: boolean, items: any[] }], ask: [question: string] }>()
const selectedCity = ref<any[]>([]); const selectedArea = ref<any[]>([])
const cardData = computed(() => props.cardData || []); const candidates = computed(() => props.candidates || [])
const suggestions = computed(() => props.suggestions || [])
const hasContent = computed(() => cardData.value.length || candidates.value.length || suggestions.value.length)
const SCENIC_PAGE_SIZE = 3
const scenicPage = ref(1)
const areaPageCount = computed(() => Math.max(1, Math.ceil(cardData.value.length / SCENIC_PAGE_SIZE)))
const paginatedAreaData = computed(() => {
  const start = (scenicPage.value - 1) * SCENIC_PAGE_SIZE
  return cardData.value.slice(start, start + SCENIC_PAGE_SIZE)
})
const areaItemKey = (item: any, index: number) => `${scenicPage.value}-${item?.scenicSpotAlias || item?.scenicSpotName || item?.name || index}`
function goToScenicPage(page: number) {
  scenicPage.value = Math.min(areaPageCount.value, Math.max(1, page))
}
watch(cardData, () => {
  scenicPage.value = 1
  selectedArea.value = []
})
// 同 travel-client 的 utils.formatImage：压缩图优先、支持 | 分隔、多类型默认图，
// 并为 DFS 相对路径补 CDN。这样接口返回的 imageCompress 不会被当成本地相对路径。
const IMAGE_CDN = 'https://gzwlcs-obs.aihuangxiaoxi.com/'
const QA_IMAGE_DOMAIN = 'https://glsw-wdgz.aihuangxiaoxi.com/rxqdata/'
const GENERIC_FALLBACK = 'https://weblibs.rxhui.com/uniapp/intelligent/wdgz/qa/img_no-min.jpg'
function fallbackImage(item: any) {
  const type = item?.entity_type || item?.nodeType
  if (type === '美食') return `${QA_IMAGE_DOMAIN}gzwl/imgs/bg_food-min.jpg`
  if (type === '景区' || type === '打卡') return `${QA_IMAGE_DOMAIN}gzwl/imgs/bg_area-min.jpg`
  if (type === '文娱') return `${QA_IMAGE_DOMAIN}gzwl/imgs/bg_holiday-min.jpg`
  if (type === '酒店' || type === '启发') return `${QA_IMAGE_DOMAIN}gzwl/imgs/bg_address-min.jpg`
  return GENERIC_FALLBACK
}
function image(item: any) {
  let source = item?.isAgent === '是' ? item?.agentImage : undefined
  if (!source || (Array.isArray(source) && !source.length)) source = item?.imageCompress || item?.image || item?.imgUrl || item?.image_url || item?.cover || item?.pic || item?.picture
  const raw = String(Array.isArray(source) ? source[0] : String(source || '').split('|')[0] || '').trim()
  if (!raw) return fallbackImage(item)
  if (/^http:\/\//i.test(raw)) return raw.replace(/^http:\/\//i, 'https://')
  if (/^(https?:|data:|blob:|\/\/|\/static\/)/i.test(raw)) return raw
  return `${IMAGE_CDN}${raw.replace(/^\/+/, '')}`
}
function fallbackImageLoad(event: Event) {
  const target = event.target as HTMLImageElement
  if (target.dataset.fallbackApplied === 'true') return
  target.dataset.fallbackApplied = 'true'
  target.src = GENERIC_FALLBACK
}
const tags = (item: any) => (item?.scenicSpotTags || item?.subjectPreference || []).slice(0, 2)
const typeLabel = (item: any) => item?.nodeType || item?.entity_type || '推荐'
const typeClass = (item: any) => ({ '景区': 'scenic', '打卡': 'scenic', '酒店': 'hotel', '美食': 'food', '餐饮': 'food', '文娱': 'activity' }[item?.nodeType || item?.entity_type] || 'default')
const candidateTag = (item: any) => (item?.scenicSpotTags || item?.subjectPreference || [item?.district || item?.city || ''])[0] || ''
const candidatePrice = (item: any) => item?.slowSeasonPrice || item?.cost || item?.ticketPrice || item?.price || ''
function entitySubtitle(item: any) {
  if (item?.entity_type === '酒店') {
    const stars = starCount(item) ? `${'★'.repeat(starCount(item))} ` : ''
    const score = item?.hotelScore || item?.searchScore
    const price = item?.slowSeasonPrice || item?.cost
    return `${stars}${score ? Number(score).toFixed(1) : ''}${score || price ? '｜' : ''}${price ? `¥${price}` : '暂无房型'}`
  }
  return [item?.businessHours, item?.otaScore ? Number(item.otaScore).toFixed(1) : '', item?.perCapitaConsumption ? `¥${item.perCapitaConsumption}` : ''].filter(Boolean).join('｜')
}
function starCount(item: any) {
  if (Number.isFinite(Number(item?.starLevelCode))) return Math.min(5, Math.max(0, Math.round(Number(item.starLevelCode))))
  const value = String(item?.starLevel || '')
  const found = value.match(/[一二两三四五1-5]/)?.[0] || ''
  return ({ 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5 } as Record<string, number>)[found] || Number(found) || 0
}
function entityAddress(item: any) { return item?.hotelAddress || item?.restaurantAddress || item?.addressDetail || item?.remark || item?.address || item?.city || '' }
function entityTags(item: any) { const values = item?.entity_type === '酒店' ? item?.tags : item?.cateringNote; return (Array.isArray(values) ? values : []).slice(0, item?.entity_type === '酒店' ? 2 : 4) }
function orderBackground(item: any) {
  if (item?.entity_type === '飞机票订购') return 'order-airplane'
  if (item?.entity_type === '火车票订购') return 'order-train'
  return 'order-activity'
}
function orderName(item: any) {
  if (item?.starting_name) return `${item.starting_name}${item.arriving_name ? `-${item.arriving_name}` : ''}`
  return item?.category_name ? `${item.category_name}订购` : (item?.entity_type || '订购服务')
}
function orderWeekday(value: any) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
}
const open = (item: any) => emit('open', item)
function generateCity() { emit('generate', { city: true, items: cardData.value.filter((item) => selectedCity.value.includes(item.id || item.shortName || item.name)) }) }
function generateArea() { emit('generate', { city: false, items: cardData.value.filter((item) => selectedArea.value.includes(item.id || item.scenicSpotAlias || item.name)) }) }
function questionText(question: any) { return typeof question === 'string' ? question : (question?.question || question?.title || question?.text || '继续咨询') }
function ask(question: any) { emit('ask', questionText(question)) }
</script>

<style scoped>
.qa-cards{margin-top:10px}.qa-card-heading{margin:0 0 7px;color:#42567d;font-size:12px;font-weight:700}.where-card{margin:8px 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff}.where-card summary{display:flex;justify-content:space-between;padding:10px;color:#fff;background:linear-gradient(105deg,#557ad1,#8e6dd5);font-weight:700}.where-card p{margin:0;padding:7px 10px 0;color:#63738d;font-size:12px}.where-card p:last-of-type{padding-bottom:8px}.plan-button{width:100%;margin-top:10px;border:0;border-radius:10px;padding:9px;color:#fff;background:#448ef7;font:inherit;font-size:13px}.scenic-card{position:relative;display:grid;grid-template-columns:92px minmax(0,1fr);align-items:stretch;gap:10px;margin:8px 0;padding:10px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}.scenic-card img,.scenic-card .image-placeholder{width:92px;height:auto;min-height:92px;border-radius:10px;object-fit:cover;background:#edf1f7}.scenic-card b{display:block;padding-right:24px;color:#1d2129;font-size:14px}.tags{display:flex;gap:4px;margin:6px 0}.tags i{padding:2px 5px;border-radius:4px;color:#4c7de7;background:#edf4ff;font-size:10px;font-style:normal}.scenic-card small{display:block;color:#788397;font-size:11px;line-height:1.65}.choice{position:absolute;right:10px;top:10px}.choice input{width:19px;height:19px;accent-color:#448ef7}.scenic-pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0 4px;color:#667796;font-size:12px}.scenic-pagination button{min-width:58px;border:1px solid #d8e2f1;border-radius:999px;padding:6px 10px;color:#3973dd;background:#fff;font:inherit;cursor:pointer}.scenic-pagination button:disabled{color:#aebbd0;background:#f4f7fb;cursor:not-allowed}.folk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.folk-card{overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.06)}.folk-card img{width:100%;height:94px;object-fit:cover}.folk-card div{padding:9px}.folk-card b{display:block;overflow:hidden;color:#1d2129;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.folk-card small{display:-webkit-box;overflow:hidden;margin-top:4px;color:#696c6f;font-size:11px;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.entity-node-card{overflow:hidden;margin:8px 0;border:1px solid #e2e8f0;border-radius:14px;background:#fff;cursor:pointer}.entity-node-card header{display:flex;justify-content:space-between;gap:9px;padding:12px 10px 9px;background:#f9f9f9}.entity-node-card header b{display:block;color:#0f172a;font-size:14px;font-weight:800;line-height:1.4}.entity-node-card header small{display:block;margin-top:3px;color:#23aa26;font-size:11px;line-height:1.4}.entity-node-card header>span{flex:none;align-self:flex-start;border:1px solid #7786fc;border-radius:99px;padding:3px 7px;color:#7786fc;background:#fff;font-size:10px}.entity-node-body{display:flex;align-items:stretch;gap:9px;padding:12px 10px}.entity-node-body img{width:60px;min-height:60px;height:auto;align-self:stretch;flex:none;border:1px solid #e2e8f0;border-radius:10px;object-fit:cover}.entity-node-body>div{min-width:0}.entity-node-body strong{display:-webkit-box;overflow:hidden;color:#0f172a;font-size:12px;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}.entity-node-body p{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 0}.entity-node-body i{max-width:130px;overflow:hidden;padding:3px 5px;border-radius:4px;color:#475569;background:#f1f5f9;font-size:10px;font-style:normal;text-overflow:ellipsis;white-space:nowrap}.order-card{display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;min-height:74px;margin:8px 10px 8px 0;padding:10px 90px 10px 12px;border-radius:12px;background-color:rgba(119,134,252,.08);background-repeat:no-repeat;background-position:100% 0;background-size:auto 100%;cursor:pointer}.order-card.order-train{background-image:url('https://weblibs.rxhui.com/uniapp/intelligent/wdgz/qa/question_card_huoche-min.png')}.order-card.order-airplane{background-image:url('https://weblibs.rxhui.com/uniapp/intelligent/wdgz/qa/question_card_feiji-min.png')}.order-card.order-activity{background-image:url('https://weblibs.rxhui.com/uniapp/intelligent/wdgz/qa/question_card_huodong-min.png')}.order-card b{color:#1d2129;font-size:15px;font-weight:500;line-height:1.55}.order-card small{display:flex;gap:13px;margin-top:5px;color:#898d98;font-size:12px;line-height:1.4}.candidate-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 0 7px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.candidate-card{position:relative;flex:0 0 142px;height:176px;overflow:hidden;border-radius:13px;background:#dbe4f6;scroll-snap-align:start}.candidate-card img,.candidate-image-placeholder{width:100%;height:100%;display:block;object-fit:cover;background:linear-gradient(135deg,#d9e7ff,#dcd5ff)}.candidate-card:after{content:'';position:absolute;inset:40% 0 0;background:linear-gradient(transparent,rgba(14,25,52,.78))}.candidate-type{position:absolute;z-index:1;left:8px;top:8px;padding:3px 6px;border-radius:99px;color:#fff;background:#4e78e5;font-size:10px}.candidate-type.hotel{background:#e48650}.candidate-type.food{background:#d95d83}.candidate-type.activity{background:#8c66d5}.candidate-bottom{position:absolute;z-index:1;right:8px;bottom:8px;left:8px;color:#fff}.candidate-bottom b{display:block;overflow:hidden;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.candidate-bottom i{display:block;margin-top:3px;overflow:hidden;color:rgba(255,255,255,.86);font-size:10px;font-style:normal;text-overflow:ellipsis;white-space:nowrap}.candidate-bottom em{display:block;margin-top:4px;color:#ffdf92;font-size:11px;font-style:normal;font-weight:700}.trip-suggest{margin-top:16px}.trip-suggest p{margin:0 0 10px;color:#71809b;font-size:13px}.trip-suggest button{display:block;width:100%;margin-top:8px;padding:9px 11px;border:0;border-radius:12px;color:#448ef7;background:#fff;box-shadow:0 4px 10px rgba(30,141,161,.04);font:inherit;font-size:13px;text-align:left}
</style>

<style scoped>
/* Keep the structured-answer card aligned with the parent mainQA bubble. */
.qa-cards {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.qa-recommend-panel {
  box-sizing: border-box;
  width: 100%;
  margin: 8px 0;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, .78);
  border-radius: 19px;
  background: rgba(255, 255, 255, .62);
  backdrop-filter: blur(18px) saturate(1.28);
  -webkit-backdrop-filter: blur(18px) saturate(1.28);
  isolation: isolate;
}

.qa-recommend-panel .where-card,
.qa-recommend-panel .scenic-card {
  margin: 8px 0;
}

.qa-recommend-panel .where-card:first-of-type,
.qa-recommend-panel .scenic-card:first-of-type {
  margin-top: 0;
}

.qa-recommend-panel .where-card:last-of-type,
.qa-recommend-panel .scenic-card:last-of-type {
  margin-bottom: 0;
}

.qa-recommend-panel .candidate-strip {
  margin: 0;
  padding: 2px 0 6px;
}

.city-choice,
.choice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.city-choice {
  position: relative;
  flex: 0 0 22px;
}

.choice input,
.city-choice input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
  -webkit-tap-highlight-color: transparent;
}

.selection-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 1.5px solid rgba(121, 145, 190, .72);
  border-radius: 50%;
  color: transparent;
  background: rgba(255, 255, 255, .82);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, .9), 0 2px 5px rgba(50, 79, 137, .1);
  transition: border-color .18s ease, background .18s ease, box-shadow .18s ease, transform .18s ease;
  -webkit-tap-highlight-color: transparent;
}

.choice input:checked + .selection-indicator,
.city-choice input:checked + .selection-indicator {
  border-color: transparent;
  color: #fff;
  background: linear-gradient(135deg, #2589ff, #6f62ef);
  box-shadow: 0 4px 9px rgba(49, 103, 230, .28);
}

.choice input:checked + .selection-indicator::after,
.city-choice input:checked + .selection-indicator::after {
  content: '✓';
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
}

.choice:active .selection-indicator,
.city-choice:active .selection-indicator {
  transform: scale(.92);
}

.qa-recommend-panel .plan-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  height: 34px;
  margin: 10px 0 0;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, .82);
  border-radius: 999px;
  color: #1d3569;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .88), rgba(237, 247, 255, .54)),
    radial-gradient(circle at 14% 0%, rgba(48, 198, 217, .25), transparent 46%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .78),
    0 10px 22px rgba(54, 85, 146, .14);
  backdrop-filter: blur(22px) saturate(1.32);
  -webkit-backdrop-filter: blur(22px) saturate(1.32);
  font-size: 12px;
  font-weight: 600;
}

.scenic-card {
  box-sizing: border-box;
  width: 100%;
  border-color: rgba(90, 110, 160, .12);
  background: rgba(255, 255, 255, .76);
  box-shadow: 0 4px 12px rgba(49, 76, 130, .06);
}

.scenic-pagination {
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  margin: 10px 0 2px;
  gap: 8px;
  color: #71809b;
}

.scenic-pagination button {
  box-sizing: border-box;
  flex: 0 0 66px;
  min-width: 66px;
  height: 34px;
  border-color: rgba(255, 255, 255, .82);
  color: #1d3569;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .88), rgba(237, 247, 255, .54)),
    radial-gradient(circle at 14% 0%, rgba(48, 198, 217, .25), transparent 46%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .78),
    0 10px 22px rgba(54, 85, 146, .14);
  backdrop-filter: blur(22px) saturate(1.32);
  -webkit-backdrop-filter: blur(22px) saturate(1.32);
  font-size: 12px;
  font-weight: 600;
}

.scenic-pagination span {
  width: 72px;
  text-align: center;
  white-space: nowrap;
}

.scenic-pagination button:not(:disabled):active {
  transform: scale(.98);
}

.scenic-pagination button:disabled {
  color: #9ba7ba;
  background: rgba(255, 255, 255, .42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .5);
}

</style>
