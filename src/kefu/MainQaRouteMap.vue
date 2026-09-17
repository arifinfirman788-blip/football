<template>
  <section class="route-map" aria-label="行程地图">
    <div ref="mapEl" class="route-map-canvas"></div>
    <div v-if="!hasRenderableMap" class="route-map-empty">暂未获取到可展示的行程坐标</div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Point = { position: [number, number], day?: string, name?: string }
const props = defineProps<{ mapData: any, isR1?: boolean }>()
const mapEl = ref<HTMLElement | null>(null)
let map: any = null
let cancelled = false
let amapPromise: Promise<any> | null = null

const AMAP_KEY = import.meta.env.VITE_AMAP_JSAPI_KEY || '3afed7a246b0dedcdf312072949e5720'
const AMAP_SECURITY = import.meta.env.VITE_AMAP_SECURITY_JS_CODE || 'a5e7678cb73cd673474b3cf427bc5275'

function numeric(value: any) { const n = Number.parseFloat(value); return Number.isFinite(n) ? n : null }
function pointName(item: any) { return item?.name || item?.scenicSpotAlias || item?.scenicSpotName || item?.district || item?.city || '' }
function candidateOf(data: any, key: any) { return data?.candidates?.[key] || data?.candidates?.find?.((item: any) => String(item?.id) === String(key)) || null }
function first(list: any[]) { return Array.isArray(list) && list.length ? list[0] : null }
function last(list: any[]) { return Array.isArray(list) && list.length ? list[list.length - 1] : null }

function mergeSamePosition(rows: Point[]) {
  const result: Point[] = []
  rows.forEach((row) => {
    if (!row?.position || numeric(row.position[0]) == null || numeric(row.position[1]) == null) return
    const previous = result[result.length - 1]
    if (previous && previous.position.join(',') === row.position.join(',')) {
      const a = Number((previous.day || '').match(/\d+/)?.[0])
      const b = Number((row.day || '').match(/\d+/)?.[0])
      if (Number.isFinite(a) && Number.isFinite(b) && a !== b) previous.day = `第${a}-${b}天`
      return
    }
    result.push({ ...row })
  })
  return result
}

function normalRoute(data: any) {
  const result = Array.isArray(data?.result) ? data.result : []
  if (!result.length) return { markers: [], path: [] as [number, number][] }
  const activityStart = result[0]?.activities?.[0]
  const startId = activityStart?.commute?.from ?? activityStart?.from
  const endId = result[result.length - 1]?.end_location
  const start = candidateOf(data, startId)
  const end = candidateOf(data, endId)
  const markers: Point[] = []
  if (start) markers.push({ day: pointName(start) === pointName(end) ? '起点/终点' : '起点', position: [numeric(start.longitude)!, numeric(start.latitude)!], name: pointName(start) })
  if (end && pointName(start) !== pointName(end)) markers.push({ day: '终点', position: [numeric(end.longitude)!, numeric(end.latitude)!], name: pointName(end) })
  result.forEach((day: any) => {
    const place = candidateOf(data, day?.end_location)
    if (place && day?.end_location !== startId && day?.end_location !== endId) markers.push({ day: `第${day.day}天`, position: [numeric(place.longitude)!, numeric(place.latitude)!], name: pointName(place) })
  })
  const ids: any[] = []
  result.forEach((day: any) => {
    const activities = day?.activities || []
    if (!activities.length) return
    ids.push(activities[0]?.commute?.from ?? activities[0]?.from)
    ids.push(activities[activities.length - 1]?.commute?.to ?? activities[activities.length - 1]?.to)
  })
  const path = [...new Set(ids)].map((id) => candidateOf(data, id)).filter(Boolean).map((item: any) => [numeric(item.longitude), numeric(item.latitude)]).filter((item: any) => item[0] != null && item[1] != null) as [number, number][]
  return { markers: mergeSamePosition(markers), path }
}

function r1DayEdge(days: any[], index: number, edge: 'start' | 'end') {
  const day = days[index] || {}
  const start = first(day.starts) || first(day.spots) || first(day.ends)
  const end = first(day.ends) || last(day.spots) || last(day.starts)
  return edge === 'start' ? start : end
}

function r1Route(days: any[]) {
  if (!Array.isArray(days) || !days.length) return { markers: [], path: [] as [number, number][] }
  const start = r1DayEdge(days, 0, 'start'); const end = r1DayEdge(days, days.length - 1, 'end')
  const toPoint = (item: any, day?: string): Point | null => {
    const lng = numeric(item?.longitude); const lat = numeric(item?.latitude)
    return lng == null || lat == null ? null : { day, position: [lng, lat], name: pointName(item) }
  }
  const markers: Point[] = []
  const startPoint = toPoint(start, pointName(start) === pointName(end) ? '起点/终点' : '起点'); if (startPoint) markers.push(startPoint)
  const endPoint = toPoint(end, '终点'); if (endPoint && pointName(start) !== pointName(end)) markers.push(endPoint)
  days.slice(0, -1).forEach((day, index) => { const point = toPoint(r1DayEdge(days, index, 'end'), `第${day?.days || index + 1}天`); if (point) markers.push(point) })
  const path = days.flatMap((_day, index) => index === 0 ? [r1DayEdge(days, index, 'start'), r1DayEdge(days, index, 'end')] : [r1DayEdge(days, index, 'end')]).map((item) => toPoint(item)).filter(Boolean).map((item: any) => item.position)
  return { markers: mergeSamePosition(markers), path }
}

const route = computed(() => props.isR1 ? r1Route(props.mapData) : normalRoute(props.mapData))
const hasRenderableMap = computed(() => route.value.markers.length > 0)

function loadAmap() {
  if (amapPromise) return amapPromise
  amapPromise = new Promise((resolve, reject) => {
    const existing = (window as any).AMap
    if (existing) { resolve(existing); return }
    ;(window as any)._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(AMAP_KEY)}&plugin=AMap.ToolBar`
    script.async = true; script.onload = () => resolve((window as any).AMap); script.onerror = reject
    document.head.appendChild(script)
  })
  return amapPromise
}

function destroy() { try { map?.destroy?.() } catch { /* ignore */ } map = null }
async function render() {
  destroy(); if (!hasRenderableMap.value || !mapEl.value) return
  try {
    const AMap: any = await loadAmap(); if (cancelled || !mapEl.value || !AMap) return
    const firstPoint = route.value.markers[0].position
    map = new AMap.Map(mapEl.value, { viewMode: '2D', zoom: 11, center: firstPoint })
    map.addControl(new AMap.ToolBar({ position: { top: '8px', left: '8px' } }))
    if (route.value.path.length >= 2) map.add(new AMap.Polyline({ path: route.value.path, strokeColor: '#1890FF', strokeWeight: 4, lineJoin: 'round' }))
    route.value.markers.forEach((item) => new AMap.Marker({ map, position: item.position, anchor: 'center', content: `<div class="mainqa-amap-marker"><b>${item.day || ''}</b><span>${String(item.name || '').slice(0, 4)}${String(item.name || '').length > 4 ? '…' : ''}</span></div>` }))
    map.setFitView(null, false, [24, 24, 24, 24]); await nextTick(); map.resize?.()
  } catch { /* fallback marker list remains visible only when no map */ }
}
onMounted(() => { void render() })
watch(route, () => { void render() }, { deep: true })
onBeforeUnmount(() => { cancelled = true; destroy() })
</script>

<style>
.route-map { position: relative; min-height: 160px; overflow: hidden; border-radius: 12px; background: #edf4ff; }
.route-map-canvas { width: 100%; height: 200px; }
.route-map-empty { display: grid; min-height: 160px; place-items: center; color: #71809b; font-size: 12px; }
.mainqa-amap-marker { width: 64px; overflow: hidden; border: 2px solid #7786fc; border-radius: 5px; background: #fff; text-align: center; font: 11px/1.25 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.mainqa-amap-marker b { display: block; padding: 4px 3px; color: #fff; background: #7786fc; font-weight: 500; }.mainqa-amap-marker span { display: block; padding: 4px 3px; color: #233557; }
</style>
