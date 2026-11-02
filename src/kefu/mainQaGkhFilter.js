function parseTzId(value) {
  if (typeof value === 'string') {
    try {
      return parseTzId(JSON.parse(value))
    } catch {
      return []
    }
  }
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  return []
}

export function getGkhTzId(record) {
  return parseTzId(record?.tzId).find((item) => String(item?.channelType || '').trim().toUpperCase() === 'GKH') || null
}

export function hasGkhTzId(record) {
  return Boolean(getGkhTzId(record))
}

export function filterGkhRecords(records) {
  return Array.isArray(records) ? records.filter(hasGkhTzId) : []
}

export function filterGkhCandidateCollection(candidates) {
  if (Array.isArray(candidates)) return filterGkhRecords(candidates)
  if (!candidates || typeof candidates !== 'object') return candidates
  return Object.fromEntries(Object.entries(candidates).filter(([, item]) => hasGkhTzId(item)))
}

export function filterGkhRouteMapData(data) {
  if (Array.isArray(data)) {
    return data.map((day) => {
      if (!day || typeof day !== 'object') return day
      return {
        ...day,
        starts: filterGkhRecords(day.starts),
        spots: filterGkhRecords(day.spots),
        ends: filterGkhRecords(day.ends),
      }
    }).filter((day) => day?.starts?.length || day?.spots?.length || day?.ends?.length)
  }
  if (!data || typeof data !== 'object') return data
  return {
    ...data,
    ...(data.candidates ? { candidates: filterGkhCandidateCollection(data.candidates) } : {}),
  }
}
