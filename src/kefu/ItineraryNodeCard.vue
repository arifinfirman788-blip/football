<template>
  <!-- 总览页的 Day 容器可切换到每日页；节点卡片点击必须截断冒泡，
       否则在触发节点跳转时会同时切换视图，造成页面被“重新刷新”的错觉。 -->
  <article class="rxh-card-container" @click.stop>
    <header class="rxh-card-header">
      <div><time v-if="node.nodeTime">{{ displayTime(node.nodeTime) }}</time><span class="type-label" :class="`type-label--${typeKey}`">{{ typeLabel }}</span></div>
      <span v-if="timeStatus && !isOutside" class="time-status" :class="`time-status--${statusKey}`"><i></i>{{ timeStatus === '进行时' ? '进行中' : timeStatus }}</span>
    </header>
    <section class="rxh-card-item">
      <div class="rxh-wrap-node-type" :class="{ 'rxh-wrap-node-type--clickable': canOpen }" @click="openNode">
        <template v-if="typeKey === '航班'">
          <div class="rxh-hd"><div><b>{{ item.flightNo || item.name || '航班' }}</b><small v-if="item.fromTime && item.toTime">▣ 全程预计{{ tripTime }}</small></div><span v-if="isOutside">手动添加</span></div>
          <div class="rxh-bd traffic"><div><b>{{ hhmm(item.fromTime) }}</b><strong>{{ item.orgAirportName || placeName(item.from) || '出发地' }}</strong></div><div class="route-line route-line--flight"></div><div><b>{{ hhmm(item.toTime) }}</b><strong>{{ item.dstAirportName || placeName(item.to) || '目的地' }}</strong></div></div>
        </template>
        <template v-else-if="typeKey === '火车'">
          <div class="rxh-hd"><div><b>{{ item.trainNum || item.name || '火车出行' }}</b><small v-if="item.starting_date">▣ {{ item.starting_date }}</small><small v-else-if="item.fromTime && item.toTime">▣ 全程预计{{ tripTime }}</small></div></div>
          <div class="rxh-bd traffic"><div><b>{{ hhmm(item.fromTime) }}</b><strong>{{ item.fromStationName || placeName(item.from) || '出发地' }}</strong></div><div class="route-line"></div><div><b>{{ hhmm(item.toTime) }}</b><strong>{{ item.toStationName || placeName(item.to) || '目的地' }}</strong></div></div>
        </template>
        <template v-else-if="typeKey === '自驾' || typeKey === '交通'">
          <div class="rxh-hd"><div><b>自驾出行</b><small v-if="item.commute_distance">▣ 全程约{{ item.commute_distance }}km</small></div></div>
          <div class="rxh-bd"><small v-if="tripTime" class="traffic-note">▣ 全程预计{{ tripTime }}</small><div class="traffic"><div><b>{{ hhmm(item.start || item.fromTime) }}</b><strong>{{ placeName(item.from) || item.city || '出发地' }}</strong></div><div class="route-line"></div><div><b>{{ hhmm(item.end || item.toTime) }}</b><strong>{{ placeName(item.to) || item.name || item.city || '目的地' }}</strong></div></div></div>
        </template>
        <template v-else>
          <div class="rxh-hd"><div><b>{{ entityName }}</b><small v-if="metaText">{{ metaText }}</small></div><span v-if="isOutside">手动添加</span></div>
          <div class="rxh-bd entity"><div class="entity-image" :class="{ 'entity-image--custom': typeKey === '自定义活动' }"><img v-if="image && typeKey !== '自定义活动'" :src="image" :alt="entityName" @error="imageFailed = true"></div><div class="entity-info"><p v-if="address">⌖ {{ address }}</p><div v-if="tags.length" class="rxh-tag"><span v-for="tag in tags" :key="tag">{{ tag }}</span></div></div></div>
        </template>
      </div>
      <footer v-if="node.tips || node.remark || item.tips" class="rxh-wrap-tips"><img :src="avatarIp" alt="黄小西"><p><b>黄小西 TIPS：</b>{{ node.tips || node.remark || item.tips }}</p></footer>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import avatarIp from './assets/itinerary/avatar_ip_3-min.png'

const props = defineProps<{ node: any; dayDate?: string; tripStatus?: string }>()
const emit = defineEmits<{ open: [node: any] }>()
const imageFailed = ref(false)
const node = computed(() => props.node || {})
const item = computed(() => ({ ...(node.value.extendJson?.nodeDetail || node.value.detail || {}), ...node.value }))
const typeKey = computed(() => {
  const original = String(item.value.nodeType || item.value.entity_type || '')
  if (original === '交通') return ({ by_plane: '航班', by_train: '火车', by_car: '自驾' } as Record<string, string>)[item.value.mode] || '交通'
  return ({ FLIGHT: '航班', TRAIN: '火车', SELF_DRIVE: '自驾', ATTRACTION: '景区', DINING: '餐饮', ACCOMMODATION: '酒店', ENTERTAINMENT: '文娱', CUSTOM: '自定义活动', 住宿: '酒店' } as Record<string, string>)[original] || original || '自定义活动'
})
const typeLabel = computed(() => typeKey.value === '打卡' ? '景区' : typeKey.value)
const entityName = computed(() => item.value.name || item.value.scenicSpotAlias || item.value.scenicSpotName || item.value.hotelName || item.value.restaurantName || item.value.specialFood || '未命名')
const isOutside = computed(() => item.value.sourceFrom === 'outside')
const canOpen = computed(() => !isOutside.value && !['航班', '火车', '自驾', '交通', '自定义活动'].includes(typeKey.value))
const image = computed(() => { const value = item.value.imageUrl || item.value.imageCompress?.[0] || item.value.image?.[0] || item.value.coverImageUrl; return !imageFailed.value && value ? (/^https?:\/\//.test(value) ? value : `https://gzwlcs-obs.aihuangxiaoxi.com/${String(value).replace(/^\/+/, '')}`) : '' })
const address = computed(() => item.value.addressDetail || item.value.restaurantAddress || item.value.hotelAddress || item.value.address || item.value.remark || item.value.city || '')
const tags = computed(() => { const raw = typeKey.value === '美食' ? item.value.cuisineTypes : typeKey.value === '餐饮' ? item.value.cateringNote : typeKey.value === '酒店' ? item.value.tags : item.value.scenicSpotTags || item.value.subjectPreference || item.value.eventType; return (Array.isArray(raw) ? raw : String(raw || '').split(/[，,、]/)).filter(Boolean).slice(0, 4) })
const metaText = computed(() => {
  if (typeKey.value === '景区' || typeKey.value === '打卡') return [item.value.scenicSpotRatingText, num(item.value.scenicSpotScore), item.value.cost ? `¥${item.value.cost}` : item.value.ticketPrice ? `¥${item.value.ticketPrice}` : item.value.charging === '不收费' ? '免费' : ''].filter(Boolean).join(' | ')
  if (typeKey.value === '酒店') return [`${'★'.repeat(stars.value)}`, num(item.value.hotelScore || item.value.searchScore), item.value.slowSeasonPrice || item.value.cost ? `¥${item.value.slowSeasonPrice || item.value.cost}` : '暂无房型'].filter(Boolean).join(' | ')
  if (typeKey.value === '餐饮') return [item.value.businessHours, num(item.value.otaScore), item.value.perCapitaConsumption ? `¥${item.value.perCapitaConsumption}` : ''].filter(Boolean).join(' | ')
  if (typeKey.value === '美食') return num(item.value.overallScore)
  if (typeKey.value === '文娱') return [num(item.value.scenicSpotScore), item.value.cost ? `¥${item.value.cost}` : '免费', item.value.eventTimeText].filter(Boolean).join(' | ')
  return ''
})
const stars = computed(() => { const value = Number(item.value.starLevelCode || String(item.value.starLevel || '').match(/[一二三四五12345]/)?.[0] || 0); return Math.max(0, Math.min(5, Number.isNaN(value) ? 0 : value)) })
const tripTime = computed(() => {
  const from = Number(item.value.fromTime); const to = Number(item.value.toTime)
  const duration = Number(item.value.commute_duration ?? item.value.duration)
  if (typeKey.value === '航班' || typeKey.value === '火车') return Number.isFinite(from) && Number.isFinite(to) ? humanDuration(to - from) : ''
  if (typeKey.value === '自驾' || typeKey.value === '交通') return Number.isFinite(duration) ? humanDuration(duration) : ''
  return ''
})
const timeStatus = computed(() => { if (props.tripStatus === 'COMPLETED') return '已结束'; if (props.tripStatus === 'PLANNED') return '未开始'; const value = node.value.nodeTime; if (!value || !props.dayDate) return ''; const at = new Date(`${props.dayDate}T${displayTime(value)}:00`); return new Date() < at ? '未开始' : '进行时' })
const statusKey = computed(() => ({ '进行时': 'active', '已结束': 'ended', '未开始': 'pending' } as Record<string, string>)[timeStatus.value] || '')
function num(value: any) { return value == null || value === '' ? '' : Number(value).toFixed(1) }
function displayTime(value: any) { const str = String(value || ''); return str.includes(' ') ? str.slice(-5) : str.slice(0, 5) }
function hhmm(value: any) { if (value == null || value === '') return ''; if (typeof value === 'string' && /\d{1,2}:\d{2}/.test(value)) return displayTime(value); const numeric = Number(value); if (!Number.isFinite(numeric)) return ''; return `${String(Math.floor(numeric)).padStart(2, '0')}:${String(Math.round((numeric % 1) * 60)).padStart(2, '0')}` }
function humanDuration(value: number) { const hour = Math.floor(value); const minute = Math.round((value % 1) * 60); return `${hour > 0 ? `${hour}小时` : ''}${minute > 0 ? `${minute}分钟` : ''}` }
function placeName(value: any) { return value?.name || value?.scenicSpotAlias || value?.scenicSpotName || '' }
function openNode() { if (canOpen.value) emit('open', node.value) }
</script>

<style scoped>
.rxh-card-container{min-width:0}.rxh-card-header{height:32px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between}.rxh-card-header>div{display:flex;align-items:center;gap:8px}.rxh-card-header time{color:#f4462c;font-size:12px;font-weight:800}.type-label{padding:3px 7px;border-radius:99px;color:#fff;background:#23aa26;font-size:10px}.type-label--航班,.type-label--火车,.type-label--自驾,.type-label--交通,.type-label--自定义活动{background:#0153ff}.type-label--美食,.type-label--餐饮{background:#f87f5f}.time-status{display:flex;align-items:center;gap:4px;font-size:10px}.time-status i{width:6px;height:6px;border-radius:50%;background:currentColor}.time-status--active{color:#23aa26}.time-status--ended{color:#cbd5e1}.time-status--pending{color:#f4462c}.rxh-card-item{overflow:hidden;border:1px solid #e2e8f0;border-radius:12px;background:#fff}.rxh-wrap-node-type--clickable{cursor:pointer}.rxh-wrap-node-type--clickable:active{opacity:.78}.rxh-hd{min-height:45px;padding:10px 12px;display:flex;align-items:flex-start;justify-content:space-between;background:#f9f9f9}.rxh-hd b{display:block;color:#0f172a;font-size:14px;line-height:1.45}.rxh-hd small{display:block;margin-top:3px;color:#23aa26;font-size:10px;line-height:1.3}.rxh-hd>span{border:1px solid #7786fc;border-radius:99px;padding:3px 6px;color:#7786fc;background:#fff;font-size:10px}.rxh-bd{padding:12px}.traffic{display:grid;grid-template-columns:minmax(0,1fr) 85px minmax(0,1fr);align-items:end}.traffic>div:last-child{text-align:right}.traffic b,.traffic strong{display:block}.traffic b{color:#475569;font-size:11px}.traffic strong{overflow:hidden;margin-top:4px;color:#0f172a;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.route-line{height:25px;background:url('./assets/itinerary/line_straight-min.jpg') center/82% auto no-repeat}.route-line--flight{background-image:url('./assets/itinerary/line_flight-min.jpg')}.traffic-note{display:block;color:#475569;font-size:10px}.traffic-note+.traffic{margin-top:10px}.entity{padding:12px;display:flex;align-items:center;gap:10px}.entity-image{width:60px;height:60px;flex:none;overflow:hidden;border:1px solid #e2e8f0;border-radius:8px;background:#e5edf8}.entity-image--custom{background:url('./assets/itinerary/card_custom-min.jpg') center/cover}.entity-image img{width:100%;height:100%;object-fit:cover}.entity-info{min-width:0;flex:1}.entity-info p{display:-webkit-box;overflow:hidden;margin:0;color:#0f172a;font-size:12px;font-weight:700;line-height:1.4;-webkit-box-orient:vertical;-webkit-line-clamp:2}.rxh-tag{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}.rxh-tag span{max-width:108px;overflow:hidden;border-radius:4px;padding:3px 5px;color:#475569;background:#f1f5f9;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.rxh-wrap-tips{display:flex;align-items:center;gap:4px;margin:0 10px 12px;padding:4px 5px 4px 0;border-radius:5px;background:#fef7e3}.rxh-wrap-tips img{width:42px;height:30px;object-fit:contain}.rxh-wrap-tips p{margin:0;border:1px solid rgba(248,127,95,.6);border-radius:5px;padding:5px 7px;color:#f87f5f;font-size:10px;line-height:1.45}.rxh-wrap-tips b{font-weight:700}
</style>
