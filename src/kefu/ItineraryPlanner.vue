<template>
  <section class="itinerary-overlay" role="dialog" aria-modal="true" aria-label="行程规划">
    <header class="itinerary-header" :class="{ 'has-tabs': !!detail }">
      <button type="button" class="itinerary-header-button" aria-label="返回" @click="goBack">
        <span>‹</span>
      </button>
      <div>
        <b>{{ detail ? detail.title || '行程规划' : '我的行程' }}</b>
        <small>{{ detail ? `${days.length} 天行程安排` : '查看已生成的行程规划' }}</small>
      </div>
      <nav v-if="detail" class="itinerary-tabs itinerary-header-tabs" aria-label="行程视图">
        <button type="button" :class="{ active: tab === 'overview' }" @click="tab = 'overview'">总览</button>
        <button type="button" :class="{ active: tab === 'daily' }" @click="tab = 'daily'">每日</button>
      </nav>
      <button type="button" class="itinerary-header-button close" aria-label="关闭" @click="emit('close')">×</button>
    </header>

    <main class="itinerary-content">
      <div v-if="loading" class="itinerary-state itinerary-loading" role="status" aria-live="polite"><i></i><span>{{ loadingText }}</span></div>
      <div v-else-if="error" class="itinerary-state error">
        <span>{{ error }}</span><button type="button" @click="loadList">重新加载</button>
      </div>

      <template v-else-if="!detail">
        <!-- Ported from travel-client/pagesHuangxx/itinerary/Index.vue. -->
        <section class="rxh-selected-routes" :style="{ backgroundImage: `url(${bgIndexTop})` }">
          <span class="rxh-selected-routes__eyebrow">SELECTED ROUTES</span>
          <h2>精选路线</h2>
          <p>从黄小西的智能规划中，开启一段贵州之旅。</p>
        </section>
        <section class="rxh-my-itinerary">
          <header class="rxh-my-itinerary__head"><div><h2>我的行程</h2><small>EXPLORE GUIZHOU</small></div><div class="rxh-filter-row"><button type="button" @click="openMonthSelector">{{ timeDisplayText }}</button><button type="button" @click="showStatusFilter = true">{{ statusDisplayText }}</button></div></header>
          <button v-for="item in filteredItineraries" :key="item.itineraryId" type="button" class="rxh-card" @click="openDetail(item)">
            <img class="rxh-card__image" :src="cover(item)" alt="">
            <span class="rxh-card__top"><i>{{ statusText(item.status) }}</i><button type="button" aria-label="删除行程" @click.stop="deleteTrip(item)">×</button></span>
            <span class="rxh-card__bottom"><span><b>{{ item.title || '未命名行程' }}</b><small>{{ tripDate(item) }}</small></span><em>◷ {{ item.daysCount || item.days?.length || 0 }} 天</em></span>
            <span v-if="item.r1Flag !== 1" class="rxh-card__action" :class="{ end: item.status === 'IN_PROGRESS' }" @click.stop="toggleTrip(item)">{{ item.status === 'IN_PROGRESS' ? '结束行程' : item.status === 'COMPLETED' ? '重新开始' : '开始行程' }}</span>
          </button>
          <button v-if="hasMore && filteredItineraries.length" type="button" class="rxh-load-more" :disabled="loadingMore" @click="loadList(true)">{{ loadingMore ? '正在加载…' : '加载更多行程' }}</button>
          <p v-else-if="filteredItineraries.length" class="rxh-load-end">— 没有更多了 —</p>
          <div v-if="!filteredItineraries.length" class="itinerary-empty"><span>暂无行程，快去规划你的第一次旅行吧</span><button type="button" @click="emit('close')">去添加行程</button></div>
        </section>
        <div v-if="showDateFilter" class="itinerary-sheet-mask" @click.self="closeMonthSelector">
          <section class="month-popup-content">
            <button type="button" class="popup-all-btn" @click="setDateFilter()"><span>全部</span></button>
            <h3>选择年</h3><div class="popup-year-grid"><button v-for="year in years" :key="year" type="button" :class="{ 'popup-item-active': selectedYear === year }" @click="selectYear(year)">{{ year }}年</button></div>
            <h3>选择月</h3><div class="popup-month-grid"><button v-for="month in 12" :key="month" type="button" :class="{ 'popup-item-active': selectedMonth === month }" @click="selectMonth(month)">{{ month }}月</button></div>
          </section>
        </div>
        <div v-if="showStatusFilter" class="itinerary-sheet-mask" @click.self="showStatusFilter = false"><section class="status-popup-content"><h3>选择行程状态</h3><button v-for="option in statusOptions" :key="option.value || 'all'" type="button" :class="{ 'status-popup-item-active': selectedStatus === option.value }" @click="selectStatus(option.value)">{{ option.label }}</button></section></div>
        <div v-if="startTripItem" class="itinerary-sheet-mask itinerary-sheet-mask--bottom" @click.self="cancelStartTrip"><section class="start-trip-popup-content"><header><span>▣</span><b>开启行程: {{ startTripItem.title }}</b><small>请选择您的出发时间，我们将为您开启行程倒计时</small></header><label>选择出发日期<input v-model="departureDate" :min="minDepartureDate" type="date"></label><footer><button type="button" @click="cancelStartTrip">取消</button><button type="button" @click="confirmStartTrip">确认开启</button></footer></section></div>
      </template>

      <template v-else>
        <section v-if="tab === 'overview'" class="itinerary-overview">
          <MainQaRouteMap v-if="plannerMapData" class="rxh-route-map" :map-data="plannerMapData" />
          <div v-else class="rxh-map-placeholder"><span>⌖</span><b>行程地图</b><small>暂无可用坐标，地图将在行程补全后展示</small></div>
          <nav class="rxh-category-tabs"><button v-for="category in categories" :key="category" type="button" :class="{active: category === categoryFilter}" @click="categoryFilter = category">{{ category }}</button></nav>
          <article v-for="(day, index) in filteredDays" :key="day.dayId || index" class="rxh-day-block" @click="selectDay(dayIndexOf(day))">
            <header :style="{ backgroundImage: `url(${bgDayHeader})` }"><span>♥</span><b>Day {{ day.dayIndex || index + 1 }}</b><small><i></i>{{ formatDate(day.dayDate) }}</small></header>
            <em v-if="day.dayDescription" class="rxh-day-subtitle">{{ day.dayDescription }}</em>
            <div v-for="(node, nodeIndex) in dayNodes(day)" :key="node.nodeId || nodeIndex" class="rxh-schedule-card"><time>{{ node.nodeTime || '--:--' }}</time><i></i><ItineraryNodeCard :node="node" :day-date="day.dayDate" :trip-status="detail?.status" @open="openNodeDetail" /></div>
          </article>
        </section>

        <section v-else class="itinerary-daily">
          <MainQaRouteMap v-if="activeDayMapData" class="rxh-route-map" :map-data="activeDayMapData" />
          <div class="itinerary-day-switcher">
            <button v-for="(day, index) in days" :key="day.dayId || index" type="button" :class="{ active: dayIndex === index }" @click="dayIndex = index"><b>{{ day.dayIndex || index + 1 }}</b><small>Day</small></button>
            <button v-if="canEditDetail && showDailyEditing" type="button" class="day-editor-button" @click="addDay">＋</button>
            <button v-if="canEditDetail && showDailyEditing" type="button" class="day-editor-button" :class="{ active: showDayDelete }" @click="showDayDelete = !showDayDelete">−</button>
          </div>
          <section v-if="activeDay" class="daily-day-section">
            <article class="daily-header" :style="{ backgroundImage: `url(${bgDayHeader})` }"><span class="daily-header-heart">♥</span><b>Day {{ activeDay.dayIndex || dayIndex + 1 }}</b><small><i></i>{{ formatDate(activeDay.dayDate) }}</small><button v-if="canEditDetail && showDailyEditing && showDayDelete" type="button" @click="deleteDay">删除当天</button></article>
            <em v-if="activeDay.dayDescription" class="daily-day-subtitle">{{ activeDay.dayDescription }}</em>
            <ol class="itinerary-timeline">
              <li v-for="(node, index) in activeNodes" :key="node.nodeId || index">
                <time>{{ node.nodeTime || '--:--' }}</time><span class="timeline-dot"></span>
                <div class="daily-node-wrap"><ItineraryNodeCard :node="node" :day-date="activeDay?.dayDate" :trip-status="detail?.status" @open="openNodeDetail" /><button v-if="canEditDetail && showDailyEditing" type="button" class="remove-node" @click="deleteNode(node)">删除</button></div>
              </li>
            </ol>
          </section>
          <button v-if="canEditDetail && showDailyEditing" type="button" class="add-schedule-item" @click="openNewNodeForm">＋ 添加行程节点</button>
          <div v-if="!activeNodes.length" class="itinerary-empty">当天暂无行程节点</div>
          <div v-if="showAddNode" class="itinerary-sheet-mask itinerary-sheet-mask--bottom" @click.self="showAddNode = false"><section class="add-node-modal"><header><b>添加行程节点</b><button type="button" @click="showAddNode = false">×</button></header><div class="add-node-controls"><select v-model="newNode.nodeType"><option v-for="type in nodeTypes" :key="type">{{ type }}</option></select><input v-model="newNode.nodeTime" type="time"><select v-model="newNode.dayIndex"><option v-for="(day, index) in days" :key="day.dayId || index" :value="index">Day {{ day.dayIndex || index + 1 }}</option></select></div><input v-model.trim="newNode.name" placeholder="地点/活动名称"><textarea v-model.trim="newNode.remark" placeholder="备注说明（选填）"></textarea><p>小西提醒：手动添加的节点仅用于展示，不会触发行程通知。</p><button type="button" class="confirm-add-node" @click="addNode">确认添加</button></section></div>
        </section>
      </template>
    </main>
    <p v-if="nodeNotice" class="itinerary-node-notice" role="status">{{ nodeNotice }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MainQaRouteMap from './MainQaRouteMap.vue'
import ItineraryNodeCard from './ItineraryNodeCard.vue'
import bgIndexTop from './assets/itinerary/bg_top-min.jpg'
import bgDayHeader from './assets/itinerary/bg_day-min.jpg'

const props = defineProps<{ authorization?: string; clientId?: string; apiBase: string; previewDetail?: any; initialItineraryId?: string | number | null; nodeOpen?: (node: any) => string | void }>()
const emit = defineEmits<{ close: []; openDetail: [id: string | number]; openNode: [node: any] }>()
const itineraries = ref<any[]>([])
const detail = ref<any | null>(null)
const loading = ref(false)
const loadingText = ref('正在加载我的行程…')
const loadingMore = ref(false)
const error = ref('')
const tab = ref<'overview' | 'daily'>('overview')
const dayIndex = ref(0)
const currentYear = new Date().getFullYear()
const selectedYear = ref<number | null>(null)
const selectedMonth = ref<number | null>(null)
const selectedStatus = ref<string | null>(null)
const showDateFilter = ref(false)
const showStatusFilter = ref(false)
const categoryFilter = ref('全部')
const pageNum = ref(1)
const hasMore = ref(false)
const startTripItem = ref<any | null>(null)
const departureDate = ref('')
const showDayDelete = ref(false)
const showAddNode = ref(false)
const nodeNotice = ref('')
let nodeNoticeTimer: number | undefined
// 每日页暂不开放编辑；恢复时改为 true 即可。
const showDailyEditing = false
const nodeTypes = ['景区', '美食', '餐饮', '酒店', '交通', '自定义活动']
const newNode = ref({ nodeType: '景区', nodeTime: '10:00', dayIndex: 0, name: '', remark: '' })
const pageSize = 10
const fallbackCover = 'https://weblibs.rxhui.com/uniapp/intelligent/wdgz/qa/img_no-min.jpg'

const days = computed(() => detail.value?.days || detail.value?.data?.days || detail.value?.result?.days || [])
const activeDay = computed(() => days.value[dayIndex.value] || null)
const activeNodes = computed(() => (activeDay.value?.nodes || activeDay.value?.items || []).filter((node: any) => !['起点', '终点'].includes(node?.nodeType || nodeDetail(node).nodeType)))
const plannerMapData = computed(() => createMapData(days.value))
const activeDayMapData = computed(() => createMapData(activeDay.value ? [activeDay.value] : []))
const years = [currentYear - 1, currentYear, currentYear + 1]
const statusOptions = [{ label: '全部状态', value: null }, { label: '待出发', value: 'PLANNED' }, { label: '进行中', value: 'IN_PROGRESS' }, { label: '已完成', value: 'COMPLETED' }]
const categories = ['全部', '交通', '景区', '美食', '酒店', '文娱']
const filteredItineraries = computed(() => itineraries.value.filter((item) => {
  if (selectedStatus.value && item.status !== selectedStatus.value) return false
  const date = String(item.startedAt || item.days?.[0]?.dayDate || '')
  if (selectedYear.value && !date.startsWith(String(selectedYear.value))) return false
  if (selectedMonth.value && date.slice(5, 7) !== String(selectedMonth.value).padStart(2, '0')) return false
  return true
}))
const filteredDays = computed(() => days.value.map((day: any) => ({ ...day, nodes: dayNodes(day) })).filter((day: any) => day.nodes.length))
const timeDisplayText = computed(() => selectedYear.value ? `${selectedYear.value}${selectedMonth.value ? `年${selectedMonth.value}月` : '年'}` : '时间')
const statusDisplayText = computed(() => statusOptions.find((option) => option.value === selectedStatus.value)?.label || '状态')
const headers = computed(() => ({
  ...(props.clientId ? { clientId: props.clientId } : {}),
  ...(props.authorization ? { Authorization: `Bearer ${props.authorization}` } : {}),
}))
const canEditDetail = computed(() => Boolean(detail.value?.itineraryId) && detail.value?.status !== 'IN_PROGRESS' && !props.previewDetail)

function unwrap(response: any) {
  if (response?.code != null && ![0, 200].includes(Number(response.code))) throw new Error(response.msg || response.message || '行程服务暂不可用')
  return response?.data ?? response?.result ?? response
}
function requestUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
async function requestFrom(base: string, path: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8000)
  let response: Response
  try {
    response = await fetch(requestUrl(base, path), { headers: headers.value, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
  if (!response.ok) throw new Error(`行程服务请求失败（${response.status}）`)
  return unwrap(await response.json())
}
async function request(path: string) {
  return requestFrom(props.apiBase, path)
}
async function requestMutation(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${props.apiBase.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`, { method: 'POST', headers: { ...headers.value, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) throw new Error(`行程服务请求失败（${response.status}）`)
  return unwrap(await response.json())
}
async function loadList(loadMore = false) {
  if (loadMore && (loadingMore.value || !hasMore.value)) return
  if (loadMore) loadingMore.value = true
  else { loading.value = true; loadingText.value = '正在加载我的行程…'; pageNum.value = 1; error.value = '' }
  try {
    const params = new URLSearchParams({ pageNum: String(pageNum.value), pageSize: String(pageSize) })
    if (selectedStatus.value) params.set('status', selectedStatus.value)
    if (selectedYear.value) params.set('date', selectedMonth.value ? `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}` : String(selectedYear.value))
    const data = await request(`api/itinerary/list?${params.toString()}`)
    const list = Array.isArray(data) ? data : (data?.rows || data?.list || data?.records || data?.data?.rows || data?.data?.list || data?.data?.records || [])
    itineraries.value = loadMore ? [...itineraries.value, ...list] : list
    const total = Number(data?.total ?? data?.count ?? data?.data?.total ?? 0)
    hasMore.value = total ? itineraries.value.length < total : list.length >= pageSize
    if (hasMore.value) pageNum.value += 1
  } catch (cause: any) {
    error.value = cause?.message || '行程加载失败，请稍后重试'
  } finally { loading.value = false; loadingMore.value = false }
}
async function openDetail(item: any) {
  const id = typeof item === 'object' ? item?.itineraryId : item
  if (!id) return
  loading.value = true; loadingText.value = '正在加载行程详情…'; error.value = ''
  try {
    detail.value = await request(`api/itinerary/detail?itineraryId=${encodeURIComponent(id)}`)
    dayIndex.value = 0; tab.value = 'overview'; emit('openDetail', id)
  } catch (cause: any) { error.value = cause?.message || '行程详情加载失败' }
  finally { loading.value = false }
}
function goBack() { if (detail.value) { detail.value = null; error.value = ''; return } emit('close') }
function openNodeDetail(node: any) {
  const message = props.nodeOpen?.(node)
  if (!props.nodeOpen) emit('openNode', node)
  if (!message) return
  nodeNotice.value = message
  window.clearTimeout(nodeNoticeTimer)
  nodeNoticeTimer = window.setTimeout(() => { nodeNotice.value = '' }, 1600)
}
function selectDay(index: number) { dayIndex.value = index; tab.value = 'daily' }
function openMonthSelector() { showDateFilter.value = true }
function closeMonthSelector() { showDateFilter.value = false }
function setDateFilter(year: number | null = null, month: number | null = null) { selectedYear.value = year; selectedMonth.value = month; showDateFilter.value = false; void loadList() }
function selectYear(year: number) { selectedYear.value = year; if (selectedMonth.value) { closeMonthSelector(); void loadList() } }
function selectMonth(month: number) { selectedMonth.value = month; if (selectedYear.value) { closeMonthSelector(); void loadList() } }
function selectStatus(value: string | null) { selectedStatus.value = value; showStatusFilter.value = false; void loadList() }
const minDepartureDate = computed(() => new Date().toISOString().slice(0, 10))
async function toggleTrip(item: any) {
  if (item.status !== 'IN_PROGRESS') { startTripItem.value = item; departureDate.value = minDepartureDate.value; return }
  if (!window.confirm('确定要提前结束该行程吗？结束行程后将停止行程提醒。')) return
  try { await requestMutation('api/itinerary/end', { itineraryId: item.itineraryId }); await loadList() } catch (cause: any) { error.value = cause?.message || '行程状态更新失败' }
}
function cancelStartTrip() { startTripItem.value = null }
async function confirmStartTrip() { if (!startTripItem.value || !departureDate.value) return; try { await requestMutation('api/itinerary/start', { itineraryId: startTripItem.value.itineraryId, startedAt: `${departureDate.value} 09:00:00` }); startTripItem.value = null; await loadList() } catch (cause: any) { error.value = cause?.message || '开启行程失败' } }
async function refreshCurrentDetail() { if (detail.value?.itineraryId) await openDetail(detail.value.itineraryId) }
async function addDay() { if (!detail.value?.itineraryId) return; try { await requestMutation('api/itinerary/day/edit', { action: 'ADD', itineraryId: detail.value.itineraryId, dayDescription: '新行程' }); await refreshCurrentDetail() } catch (cause: any) { error.value = cause?.message || '添加行程天数失败' } }
async function deleteDay() { if (!detail.value?.itineraryId || !activeDay.value || days.value.length <= 1 || !window.confirm('确定删除当天行程吗？')) return; try { await requestMutation('api/itinerary/day/edit', { action: 'DELETE', itineraryId: detail.value.itineraryId, dayIndex: activeDay.value.dayIndex || dayIndex.value + 1 }); showDayDelete.value = false; await refreshCurrentDetail() } catch (cause: any) { error.value = cause?.message || '删除行程天数失败' } }
function openNewNodeForm() { newNode.value = { nodeType: '景区', nodeTime: '10:00', dayIndex: dayIndex.value, name: '', remark: '' }; showAddNode.value = true }
async function addNode() { const day = days.value[Number(newNode.value.dayIndex)]; if (!detail.value?.itineraryId || !day || !newNode.value.name) return; try { await requestMutation('api/itinerary/node/add', { itineraryId: detail.value.itineraryId, dayIndex: day.dayIndex || Number(newNode.value.dayIndex) + 1, nodeType: newNode.value.nodeType, nodeTime: newNode.value.nodeTime, name: newNode.value.name, remark: newNode.value.remark }); showAddNode.value = false; await refreshCurrentDetail() } catch (cause: any) { error.value = cause?.message || '添加行程节点失败' } }
async function deleteNode(node: any) { const nodeId = node?.nodeId || node?.id; if (!detail.value?.itineraryId || !nodeId || !window.confirm('确定删除该行程节点吗？')) return; try { await requestMutation('api/itinerary/node/remove', { itineraryId: detail.value.itineraryId, nodeId }); await refreshCurrentDetail() } catch (cause: any) { error.value = cause?.message || '删除行程节点失败' } }
async function deleteTrip(item: any) { if (!window.confirm(`确定删除“${item.title || '该行程'}”吗？`)) return; try { await requestMutation('api/itinerary/collect/cancel', { itineraryId: item.itineraryId }); await loadList() } catch (cause: any) { error.value = cause?.message || '删除行程失败' } }
function nodeDetail(node: any) { return node?.extendJson?.nodeDetail || node?.detail || {} }
function createMapData(dayList: any[]) {
  const candidates: Record<string, any> = {}
  const result = (dayList || []).map((day, index) => {
    const nodes = (day?.nodes || day?.items || []).filter((node: any) => {
      const detail = nodeDetail(node)
      return Number.isFinite(Number(detail.longitude ?? node.longitude)) && Number.isFinite(Number(detail.latitude ?? node.latitude))
    })
    if (!nodes.length) return null
    const ids = nodes.map((node: any, nodeIndex: number) => {
      const detail = nodeDetail(node); const id = String(detail.id || node.nodeId || `${index}-${nodeIndex}`)
      candidates[id] = { ...detail, id, longitude: detail.longitude ?? node.longitude, latitude: detail.latitude ?? node.latitude, name: nodeName(node) }
      return id
    })
    return { day: day.dayIndex || index + 1, end_location: ids[ids.length - 1], activities: [{ from: ids[0], commute: { from: ids[0], to: ids[ids.length - 1] } }] }
  }).filter(Boolean)
  return result.length ? { result, candidates } : null
}
function nodeName(node: any) { const detail = nodeDetail(node); return node?.name || detail.scenicSpotAlias || detail.hotelName || detail.specialFood || '行程节点' }
function dayNodes(day: any) { const nodes = (day?.nodes || day?.items || []).filter((node: any) => !['起点', '终点'].includes(node?.nodeType || nodeDetail(node).nodeType)); return categoryFilter.value === '全部' ? nodes : nodes.filter((node: any) => nodeType(node) === categoryFilter.value) }
function dayIndexOf(day: any) { return days.value.findIndex((item: any) => item.dayId === day.dayId || item.dayIndex === day.dayIndex) }
function nodeNames(day: any) { return (day?.nodes || day?.items || []).filter((node: any) => node?.nodeType !== '交通').map((node: any) => node?.name || nodeDetail(node).scenicSpotAlias).filter(Boolean).slice(0, 4) }
function nodeType(node: any) { return node?.nodeType || nodeDetail(node).entity_type || '行程' }
function formatDate(value: any) { const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return match ? `${match[2]}月${match[3]}日` : '' }
function tripDate(item: any) { const start = formatDate(item?.startedAt || item?.days?.[0]?.dayDate); return start || '待定出发日期' }
function statusText(status: string) { return ({ PLANNED: '待出发', IN_PROGRESS: '进行中', COMPLETED: '已完成' } as Record<string, string>)[status] || '已保存' }
function statusClass(status: string) { return `status-${String(status || 'saved').toLowerCase()}` }
function cover(item: any) { const value = item?.coverImageUrl; if (!value) return fallbackCover; return /^https?:\/\//.test(value) ? value : `https://gzwlcs-obs.aihuangxiaoxi.com/${String(value).replace(/^\/+/, '')}` }

onMounted(() => {
  if (props.previewDetail) {
    detail.value = props.previewDetail
    return
  }
  if (props.initialItineraryId) {
    void openDetail(props.initialItineraryId)
    return
  }
  void loadList()
})
onBeforeUnmount(() => window.clearTimeout(nodeNoticeTimer))
</script>

<style scoped>
.itinerary-overlay{position:absolute;z-index:90;inset:0;display:flex;flex-direction:column;color:#1d2f62;background:linear-gradient(160deg,#edf7ff 0%,#f8f5ff 100%);font-family:"PingFang SC","Hiragino Sans GB",-apple-system,sans-serif}.itinerary-header{min-height:56px;padding:env(safe-area-inset-top) 16px 0;display:grid;grid-template-columns:36px 1fr 36px;gap:9px;align-items:center;background:transparent;border:0}.itinerary-header div{min-width:0}.itinerary-header b,.itinerary-header small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.itinerary-header b{font-size:16px}.itinerary-header small{margin-top:2px;color:#8190aa;font-size:10px}.itinerary-header-button{width:34px;height:34px;border:0;border-radius:13px;color:#20315c;background:rgba(255,255,255,.5);font:24px/1 sans-serif;box-shadow:none}.itinerary-header-button.close{font-size:23px}.itinerary-content{flex:1;min-height:0;overflow-y:auto;padding:14px 16px calc(20px + env(safe-area-inset-bottom));scrollbar-width:none}.itinerary-content::-webkit-scrollbar{display:none}.itinerary-state,.itinerary-empty{min-height:160px;display:grid;place-content:center;gap:12px;color:#71809b;text-align:center;font-size:13px}.itinerary-loading{place-content:center}.itinerary-loading i{width:25px;height:25px;margin:0 auto;border:3px solid rgba(119,134,252,.2);border-top-color:#7786fc;border-radius:50%;animation:itinerary-spin .75s linear infinite}.itinerary-loading span{color:#6677a0}@keyframes itinerary-spin{to{transform:rotate(360deg)}}.itinerary-state button{border:0;border-radius:999px;padding:7px 14px;color:#fff;background:linear-gradient(135deg,#3d86ff,#6757ff);font:inherit}.itinerary-state.error{color:#bd5e45}.itinerary-hero{margin:0 0 14px;padding:19px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#397ef5,#765ef5);box-shadow:0 12px 25px rgba(69,88,216,.24)}.itinerary-hero span{opacity:.72;font-size:10px;letter-spacing:1.5px}.itinerary-hero h2{margin:5px 0;font-size:23px}.itinerary-hero p{margin:0;opacity:.84;font-size:12px}.itinerary-card{width:100%;margin:0 0 10px;padding:9px;display:grid;grid-template-columns:76px minmax(0,1fr) 18px;gap:10px;align-items:center;border:1px solid rgba(91,115,167,.12);border-radius:15px;color:inherit;background:rgba(255,255,255,.8);text-align:left;box-shadow:0 5px 16px rgba(47,74,125,.07);font:inherit}.itinerary-card img{width:76px;height:76px;border-radius:10px;object-fit:cover;background:#e7eef9}.itinerary-card-copy{min-width:0}.itinerary-card-copy i{display:inline-block;padding:3px 6px;border-radius:99px;color:#3973dd;background:#eef4ff;font-size:10px;font-style:normal}.itinerary-card-copy .status-in_progress{color:#c46d25;background:#fff1df}.itinerary-card-copy .status-completed{color:#70809a;background:#f0f3f7}.itinerary-card-copy b,.itinerary-card-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.itinerary-card-copy b{margin-top:7px;font-size:14px}.itinerary-card-copy small{margin-top:5px;color:#7d8ba4;font-size:11px}.itinerary-card em,.itinerary-day-card em{color:#6d83b9;font-size:23px;font-style:normal}.itinerary-summary{padding:15px;border-radius:17px;background:linear-gradient(135deg,rgba(225,239,255,.92),rgba(247,241,255,.88));border:1px solid rgba(94,129,196,.13)}.itinerary-summary span{color:#5f7fc7;font-size:11px}.itinerary-summary h2{margin:6px 0;color:#233b70;font-size:19px}.itinerary-summary p{margin:0;color:#71809b;font-size:12px;line-height:1.5}.itinerary-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:14px 0}.itinerary-tabs button,.itinerary-day-switcher button{border:0;border-radius:10px;padding:8px;color:#71809b;background:rgba(255,255,255,.68);font:inherit;font-size:12px}.itinerary-tabs button.active,.itinerary-day-switcher button.active{color:#fff;background:linear-gradient(135deg,#3d86ff,#6757ff);box-shadow:0 6px 13px rgba(74,92,226,.2)}.itinerary-day-card{width:100%;display:grid;grid-template-columns:52px minmax(0,1fr) 18px;gap:10px;align-items:center;margin:0 0 9px;padding:11px;border:1px solid rgba(90,110,160,.12);border-radius:14px;color:inherit;background:rgba(255,255,255,.8);text-align:left;font:inherit}.day-badge{padding:7px 2px;border-radius:9px;color:#4b72cf;background:#edf3ff;font-size:10px;text-align:center}.itinerary-day-card b,.itinerary-day-card small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.itinerary-day-card b{font-size:13px}.itinerary-day-card small{margin-top:5px;color:#77869f;font-size:11px}.itinerary-day-switcher{display:flex;gap:7px;overflow-x:auto;margin-bottom:12px}.itinerary-day-switcher button{flex:0 0 48px}.daily-header{padding:10px 2px;border-bottom:1px solid rgba(104,131,183,.15)}.daily-header b,.daily-header span{display:block}.daily-header b{font-size:14px}.daily-header span{margin-top:3px;color:#7585a0;font-size:11px}.itinerary-timeline{margin:0;padding:12px 0 0;list-style:none}.itinerary-timeline li{display:grid;grid-template-columns:42px 18px minmax(0,1fr);gap:7px;min-height:67px}.itinerary-timeline time{padding-top:3px;color:#71809b;font-size:10px}.timeline-dot{position:relative;width:10px;height:10px;margin-top:5px;border:3px solid #dfeaff;border-radius:50%;background:#4f79e5}.timeline-dot:after{content:"";position:absolute;top:10px;left:2px;width:2px;height:54px;background:#dce5f7}.itinerary-timeline li:last-child .timeline-dot:after{display:none}.itinerary-timeline i{display:inline-block;padding:2px 5px;border-radius:4px;color:#4c7de7;background:#edf4ff;font-size:10px;font-style:normal}.itinerary-timeline b,.itinerary-timeline small{display:block}.itinerary-timeline b{margin-top:4px;font-size:13px}.itinerary-timeline small{margin-top:3px;color:#75849b;font-size:11px;line-height:1.4}
</style>

<style scoped>
/* Direct visual port of the itinerary Index/List page structure. */
.itinerary-content { padding: 0 0 calc(16px + env(safe-area-inset-bottom)); background: #f5f5f5; }
.rxh-selected-routes { min-height: 172px; padding: 31px 20px 70px; color: #fff; background-color:#766be3; background-position:center; background-size:cover; }
.rxh-selected-routes__eyebrow { display: block; opacity: .66; font-size: 10px; letter-spacing: 1.8px; }.rxh-selected-routes h2 { margin: 9px 0 6px; font-size: 25px; }.rxh-selected-routes p { max-width:220px; margin:0; opacity:.86; font-size:12px; line-height:1.6; }
.rxh-my-itinerary { min-height: calc(100% - 100px); margin-top: -39px; padding: 18px 14px 24px; border-radius: 24px 24px 0 0; background: #fff; }
.rxh-my-itinerary__head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding: 0 3px 13px; }.rxh-my-itinerary__head h2 { margin:0; color:#0f172a; font-size:18px; font-weight:800; }.rxh-my-itinerary__head small { display:block; margin-top:3px; color:#64748b; font-size:9px; letter-spacing:.45px; }.rxh-filter-row { display:flex; align-items:center; gap:5px; }.rxh-filter-row button { min-height:28px; border:1px solid #e2e8f0; border-radius:99px; padding:0 11px; display:inline-flex; align-items:center; justify-content:center; gap:6px; color:#0f172a; background:#fff; font:11px/1 inherit; white-space:nowrap; }.rxh-filter-row button::after { content:""; width:5px; height:5px; margin-top:-3px; border-right:1.5px solid currentColor; border-bottom:1.5px solid currentColor; transform:rotate(45deg); }
.rxh-filter-panel { margin: 0 0 12px; padding: 10px; border-radius: 12px; background:#f7f7ff; }.rxh-filter-group { display:flex; flex-wrap:wrap; gap:6px; }.rxh-filter-group + .rxh-filter-group { margin-top:8px; }.rxh-filter-group button { min-width:45px; border:0; border-radius:7px; padding:6px 7px; color:#52627e; background:#fff; font:11px inherit; }.rxh-filter-group button.active { color:#fff; background:#7786fc; }
.itinerary-sheet-mask{position:absolute;z-index:8;inset:0;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(15,23,42,.38)}.itinerary-sheet-mask--bottom{align-items:flex-end;padding:0}.month-popup-content{width:min(310px,100%);padding:18px;border-radius:16px;color:#0f172a;background:#fff;box-shadow:0 16px 42px rgba(15,23,42,.22)}.popup-all-btn{width:100%;border:0;border-radius:9px;padding:11px;color:#fff;background:linear-gradient(135deg,#7a88fc,#8270ee);font:inherit;font-size:14px}.month-popup-content h3{margin:18px 0 9px;font-size:13px}.popup-year-grid,.popup-month-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.popup-month-grid{grid-template-columns:repeat(4,1fr)}.popup-year-grid button,.popup-month-grid button{border:0;border-radius:7px;padding:9px 3px;color:#52627e;background:#f5f7fb;font:11px inherit}.popup-year-grid .popup-item-active,.popup-month-grid .popup-item-active{color:#fff;background:#7786fc}.status-popup-content,.start-trip-popup-content{width:100%;padding:14px 16px calc(16px + env(safe-area-inset-bottom));border-radius:18px 18px 0 0;background:#fff}.status-popup-content button{display:block;width:100%;border:0;border-bottom:1px solid #edf0f5;padding:15px 5px;color:#334155;background:#fff;font:14px inherit;text-align:left}.status-popup-content button:last-child{border-bottom:0}.status-popup-content .status-popup-item-active{color:#6d6ce9;font-weight:700}.start-trip-popup-content header{display:grid;grid-template-columns:34px 1fr;gap:3px 9px;align-items:center}.start-trip-popup-content header span{grid-row:span 2;width:32px;height:32px;display:grid;place-items:center;border-radius:50%;color:#7786fc;background:#edf0ff}.start-trip-popup-content header b{font-size:15px}.start-trip-popup-content header small{color:#8390a5;font-size:11px;line-height:1.4}.start-trip-popup-content label{display:block;margin:20px 0 16px;color:#334155;font-size:13px}.start-trip-popup-content input{box-sizing:border-box;display:block;width:100%;margin-top:8px;border:1px solid #e1e6ef;border-radius:9px;padding:11px;color:#334155;background:#fff;font:inherit}.start-trip-popup-content footer{display:grid;grid-template-columns:1fr 1fr;gap:10px}.start-trip-popup-content footer button{border:0;border-radius:9px;padding:11px;color:#607089;background:#eff2f7;font:14px inherit}.start-trip-popup-content footer button:last-child{color:#fff;background:#7786fc}.rxh-load-end{margin:4px 0 18px;color:#94a3b8;font-size:11px;text-align:center}
.status-popup-content{width:min(286px,calc(100% - 44px));padding:15px 16px;border-radius:16px;box-shadow:0 18px 48px rgba(15,23,42,.22)}.status-popup-content h3{margin:0 0 8px;color:#0f172a;font-size:15px;text-align:center}.status-popup-content button{text-align:center}
.rxh-card { position:relative; display:block; width:100%; height:278px; overflow:hidden; margin:0 0 14px; border:0; border-radius:12px; color:#fff; background:#cbd5e1; text-align:left; font:inherit; }.rxh-card__image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }.rxh-card::after { content:""; position:absolute; inset:42% 0 0; background:linear-gradient(0deg,rgba(0,0,0,.6),rgba(0,0,0,0)); }.rxh-card__top,.rxh-card__bottom,.rxh-card__action { position:absolute; z-index:1; }.rxh-card__top { top:12px; right:12px; left:12px; display:flex; justify-content:space-between; align-items:center; }.rxh-card__top i,.rxh-card__top button { border:0; border-radius:99px; color:#0f172a; background:rgba(255,255,255,.82); font:600 11px inherit; }.rxh-card__top i { padding:6px 10px; font-style:normal; }.rxh-card__top button { width:28px; height:28px; font-size:20px; line-height:1; }.rxh-card__bottom { right:12px; bottom:50px; left:12px; display:flex; align-items:flex-end; justify-content:space-between; gap:10px; }.rxh-card__bottom b,.rxh-card__bottom small { display:block; text-shadow:0 1px 3px rgba(0,0,0,.26); }.rxh-card__bottom b { display:-webkit-box; max-width:220px; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:2; font-size:16px; line-height:1.4; }.rxh-card__bottom small { margin-top:5px; font-size:11px; }.rxh-card__bottom em { flex:none; font-size:11px; font-style:normal; }.rxh-card__action { right:12px; bottom:12px; left:12px; height:37px; border-radius:10px; display:grid; place-items:center; background:rgba(255,255,255,.3); backdrop-filter:blur(5px); color:#fff; font-size:13px; font-weight:600; }.rxh-card__action.end { background:rgba(209,41,32,.5); }.rxh-load-more{display:block;margin:4px auto 18px;border:0;border-radius:99px;padding:9px 18px;color:#6672c9;background:#f0f1ff;font:12px inherit}.rxh-load-more:disabled{opacity:.6}
.itinerary-empty { min-height:250px; padding:0 18px; color:#0f172a; }.itinerary-empty button { border:0; border-radius:99px; margin:auto; padding:10px 22px; color:#fff; background:linear-gradient(180deg,#5a4eff,#4b37f5); font:inherit; box-shadow:0 5px 12px rgba(75,55,245,.28); }
.day-editor-button{color:#6672c9!important;background:#f0f1ff!important}.daily-header{position:relative}.daily-header button{position:absolute;right:3px;top:8px;border:0;border-radius:6px;padding:4px 7px;color:#e05246;background:#fff0ed;font:10px inherit}.daily-node-wrap{min-width:0;position:relative}.remove-node{position:absolute;right:8px;top:7px;border:0;border-radius:4px;padding:3px 5px;color:#dd6555;background:#fff0ed;font:9px inherit}.add-schedule-item{display:block;width:calc(100% - 28px);margin:3px 14px 12px;border:1px dashed #9ba7f8;border-radius:9px;padding:11px;color:#6e76d9;background:#f8f8ff;font:12px inherit}.add-node-modal{width:100%;padding:15px 16px calc(16px + env(safe-area-inset-bottom));border-radius:18px 18px 0 0;background:#fff}.add-node-modal header{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.add-node-modal header b{font-size:16px}.add-node-modal header button{border:0;color:#71809a;background:none;font:24px/1 sans-serif}.add-node-controls{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}.add-node-modal select,.add-node-modal input,.add-node-modal textarea{box-sizing:border-box;width:100%;border:1px solid #e3e8f1;border-radius:8px;margin-bottom:10px;padding:10px;color:#334155;background:#fff;font:12px inherit}.add-node-modal textarea{height:72px;resize:none}.add-node-modal p{margin:0 0 13px;color:#a58155;font-size:10px}.confirm-add-node{width:100%;border:0;border-radius:8px;padding:11px;color:#fff;background:#7786fc;font:14px inherit}
.itinerary-summary { margin:14px; }.itinerary-tabs { position:sticky; top:0; z-index:2; margin:0; padding:11px 14px; background:linear-gradient(180deg,#f6f1ff,#fff0); }.itinerary-tabs { display:flex; justify-content:center; gap:10px; }.itinerary-tabs button { width:124px; border-radius:99px; background:#e0defd; font-size:14px; font-weight:600; }.itinerary-tabs button.active { background:#7786fc; }.itinerary-header.has-tabs{grid-template-columns:34px minmax(0,1fr) auto 34px;gap:7px}.itinerary-header-tabs{grid-column:auto!important;position:static!important;padding:0!important;gap:4px!important;background:transparent!important}.itinerary-header-tabs button{width:60px;min-height:28px;padding:5px 0;font-size:12px}.itinerary-header.has-tabs>div{padding-right:2px}
.itinerary-overview,.itinerary-daily{padding:0 0 16px;background:#f5f5f5}.rxh-route-map,.rxh-map-placeholder { display:block; height:164px; margin:0; overflow:hidden; border-radius:0; }.itinerary-overview>.rxh-route-map,.itinerary-overview>.rxh-map-placeholder,.itinerary-daily>.rxh-route-map{width:100%;margin:0}.rxh-route-map :deep(.route-map),.rxh-route-map :deep(.route-map-canvas) { height:164px; border-radius:0; }.rxh-map-placeholder { display:grid; place-content:center; gap:4px; color:#5a70a6; background:radial-gradient(circle at 25% 25%,#d5edcf 0 8%,transparent 9%),radial-gradient(circle at 75% 70%,#bde2ff 0 13%,transparent 14%),linear-gradient(135deg,#dceff9,#e7e6f9); text-align:center; }.rxh-map-placeholder span { color:#7786fc; font-size:28px; }.rxh-map-placeholder b { font-size:13px; }.rxh-map-placeholder small { font-size:10px; }
.itinerary-daily .itinerary-day-switcher{position:sticky;top:0;z-index:2;align-items:center;margin:0;padding:12px 16px;gap:8px;background:#f7f8fa}.itinerary-daily .itinerary-day-switcher button{display:flex;flex:0 0 auto;align-items:center;justify-content:center;flex-direction:column;min-width:42px;height:41px;padding:8px 15px;border:.5px solid #e2e8f0;border-radius:8px;color:#0f172a;background:#fff;line-height:1}.itinerary-daily .itinerary-day-switcher button b{font-size:15px;font-weight:800;line-height:17px}.itinerary-daily .itinerary-day-switcher button small{margin-top:4px;color:#94a3b8;font-size:10px;line-height:11px}.itinerary-daily .itinerary-day-switcher button.active{border-color:#7786fc;color:#fff;background:#7786fc;box-shadow:none}.itinerary-daily .itinerary-day-switcher button.active small{color:#fff}.itinerary-daily .daily-header{min-height:58px;margin:0;padding:10px 16px;color:#1e293b;background-color:#fff;background-repeat:no-repeat;background-size:100% auto}.itinerary-daily .daily-header span{display:inline-block;margin-top:5px;padding:4px 8px;border-radius:4px;color:#475569;background:#fefae8}.itinerary-daily .itinerary-timeline{margin:0;padding:12px 16px 16px;background:#fff}.rxh-category-tabs { display:flex; gap:8px; overflow-x:auto; padding:13px 14px; background:transparent; scrollbar-width:none; }.rxh-category-tabs::-webkit-scrollbar{display:none}.rxh-category-tabs button { flex:0 0 auto; border:0; border-radius:99px; padding:7px 10px; color:#64748b; background:#f3f4f6; font:11px inherit; }.rxh-category-tabs button.active { color:#fff; background:#7786fc; }
.rxh-day-block { margin:0; padding:0 0 16px; background:#fff; }.rxh-day-block>header { height:62px; min-height:0; box-sizing:border-box; padding:0 16px; display:grid; grid-template-columns:24px minmax(0,1fr) auto; column-gap:8px; align-items:center; color:#1e293b; background-color:#fff;background-position:center top;background-repeat:no-repeat;background-size:100% auto }.rxh-day-block>header>span { width:24px; height:24px; display:grid; place-items:center; border-radius:50%; color:#fff; background:#f87f5f; font-size:12px; }.rxh-day-block>header b { color:#333; font-size:16px; font-weight:600; }.rxh-day-block>header small { display:flex; align-items:center; gap:4px; color:#1e293b; font-size:11px; white-space:nowrap; }.rxh-day-block>header small i{width:10px;height:10px;box-sizing:border-box;border:1.4px solid currentColor;border-radius:2px}.rxh-day-block>header small i::before{content:"";display:block;margin-top:2px;border-top:1.4px solid currentColor}.rxh-day-subtitle { display:block; width:fit-content; max-width:calc(100% - 32px); box-sizing:border-box; margin:0 16px 4px; overflow:hidden; padding:6px 8px; border-radius:4px; color:#475569; background:#fefae8; font-size:11px; font-style:normal; line-height:1.25; text-overflow:ellipsis; white-space:nowrap; }.rxh-schedule-card { position:relative; display:grid; grid-template-columns:42px 17px minmax(0,1fr); gap:7px; padding:12px 12px 0; }.rxh-schedule-card time { padding-top:4px; color:#8a96aa; font-size:10px; }.rxh-schedule-card>i { width:9px; height:9px; margin-top:5px; border:3px solid #dfe6fb; border-radius:50%; background:#7786fc; }.rxh-schedule-card>i::after { content:""; position:absolute; top:25px; width:2px; height:calc(100% - 18px); background:#e2e7f3; }.rxh-schedule-card:last-child>i::after { display:none; }.itinerary-timeline li{position:relative;grid-template-columns:42px 18px minmax(0,1fr);min-height:0;padding-bottom:12px}.itinerary-timeline li::after{content:"";position:absolute;z-index:0;top:21px;bottom:-12px;left:53px;width:2px;background:#dce5f7}.itinerary-timeline li:last-child::after{display:none}.itinerary-timeline li>*{position:relative;z-index:1}.itinerary-timeline li>.node-card{min-width:0}.timeline-dot:after{display:none}
.daily-day-section{background:#fff}.itinerary-daily .daily-header{height:62px;min-height:0;box-sizing:border-box;margin:0;padding:0 16px;display:grid;grid-template-columns:24px minmax(0,1fr) auto;column-gap:8px;align-items:center;color:#1e293b;background-color:#fff;background-repeat:no-repeat;background-size:100% auto}.itinerary-daily .daily-header .daily-header-heart{width:24px;height:24px;display:grid!important;place-items:center;margin:0!important;padding:0!important;border-radius:50%!important;color:#fff!important;background:#f87f5f!important;font-size:12px}.itinerary-daily .daily-header b{color:#333;font-size:16px;font-weight:600}.itinerary-daily .daily-header small{display:flex;align-items:center;gap:4px;color:#1e293b;font-size:11px;white-space:nowrap}.itinerary-daily .daily-header small i{width:10px;height:10px;box-sizing:border-box;border:1.4px solid currentColor;border-radius:2px}.itinerary-daily .daily-header small i::before{content:"";display:block;margin-top:2px;border-top:1.4px solid currentColor}.daily-day-subtitle{display:block;width:fit-content;max-width:calc(100% - 32px);box-sizing:border-box;margin:0 16px 4px;overflow:hidden;padding:6px 8px;border-radius:4px;color:#475569;background:#fefae8;font-size:11px;font-style:normal;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}
.daily-day-section{background:#fff}.itinerary-daily .daily-header{height:62px;min-height:0;box-sizing:border-box;margin:0;padding:0 16px;display:grid;grid-template-columns:24px minmax(0,1fr) auto;column-gap:8px;align-items:center;color:#1e293b;background-color:#fff;background-repeat:no-repeat;background-size:100% auto}.itinerary-daily .daily-header .daily-header-heart{width:24px;height:24px;display:grid!important;place-items:center;margin:0!important;padding:0!important;border-radius:50%!important;color:#fff!important;background:#f87f5f!important;font-size:12px}.itinerary-daily .daily-header b{color:#333;font-size:16px;font-weight:600}.itinerary-daily .daily-header small{display:flex;align-items:center;gap:4px;color:#1e293b;font-size:11px;white-space:nowrap}.itinerary-daily .daily-header small i{width:10px;height:10px;box-sizing:border-box;border:1.4px solid currentColor;border-radius:2px}.itinerary-daily .daily-header small i::before{content:"";display:block;margin-top:2px;border-top:1.4px solid currentColor}.daily-day-subtitle{display:block;width:fit-content;max-width:calc(100% - 32px);box-sizing:border-box;margin:0 16px 4px;overflow:hidden;padding:6px 8px;border-radius:4px;color:#475569;background:#fefae8;font-size:11px;font-style:normal;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}.itinerary-node-notice{position:absolute;z-index:120;top:50%;left:50%;max-width:310px;margin:0;padding:10px 14px;border-radius:999px;color:#fff;background:rgba(26,41,74,.86);box-shadow:0 16px 38px rgba(18,32,58,.24);transform:translate(-50%,-50%);font-size:12px;font-weight:600;line-height:1.4;text-align:center;white-space:nowrap;pointer-events:none}
</style>
