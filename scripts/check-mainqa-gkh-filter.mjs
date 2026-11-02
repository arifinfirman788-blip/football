import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  filterGkhCandidateCollection,
  filterGkhRecords,
  filterGkhRouteMapData,
  getGkhTzId,
  hasGkhTzId,
} from '../src/kefu/mainQaGkhFilter.js'

const gkh = { id: 1, tzId: [{ channelType: 'GKH', itemId: 'a' }] }
const lowerGkh = { id: 2, tzId: JSON.stringify([{ channelType: 'gkh', itemId: 'b' }]) }
const other = { id: 3, tzId: [{ channelType: 'OTHER' }] }
const missing = { id: 4 }

assert.equal(hasGkhTzId(gkh), true)
assert.equal(hasGkhTzId(lowerGkh), true)
assert.equal(hasGkhTzId(other), false)
assert.equal(hasGkhTzId(missing), false)
assert.equal(getGkhTzId({ tzId: { channelType: ' GKH ', itemId: 'object-entry' } })?.itemId, 'object-entry')
assert.deepEqual(filterGkhRecords([gkh, other, missing, lowerGkh]).map((item) => item.id), [1, 2])
assert.deepEqual(Object.keys(filterGkhCandidateCollection({ 1: gkh, 3: other })), ['1'])
assert.deepEqual(filterGkhRouteMapData([{ starts: [other], spots: [gkh, missing], ends: [] }])[0].spots, [gkh])

const kefuSource = await readFile(new URL('../src/kefu/Kefu.vue', import.meta.url), 'utf8')
const answerCardSource = await readFile(new URL('../src/kefu/MainQaAnswerCards.vue', import.meta.url), 'utf8')
const itineraryNodeSource = await readFile(new URL('../src/kefu/ItineraryNodeCard.vue', import.meta.url), 'utf8')
assert.match(kefuSource, /gz_dialogue_entity_info[^\n]+hasGkhTzId\(data\)/)
assert.match(kefuSource, /TravelOrderTool-FinalResult[\s\S]+?const filteredData = filterGkhRecords\(data\)/)
assert.match(kefuSource, /state\.candidates = filterGkhRecords\(state\.candidates\)/)
assert.match(kefuSource, /state\.cardData = filterGkhRecords\(state\.cardData\)/)
assert.match(kefuSource, /state\.filteredCardData = filterGkhRecords\(state\.filteredCardData\)/)
assert.doesNotMatch(kefuSource, /该(?:内容|节点)暂未提供可跳转详情/)
assert.match(kefuSource, /sourceFrom === "outside"\) return \{ miniPath: "", external: "" \}/)
assert.doesNotMatch(kefuSource, /miniPath:\s*miniPath\s*\|\|\s*String\(record\.(?:commodityLink|url|link)/)
assert.match(answerCardSource, /const canOpen = \(item: any\) => hasGkhTzId\(item\)/)
assert.match(itineraryNodeSource, /const canOpen = computed\(\(\) => hasGkhTzId\(item\.value\)/)

console.log('MainQA GKH tzId filter checks passed (18).')
