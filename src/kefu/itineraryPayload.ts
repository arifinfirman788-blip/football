export type ItineraryCollectContext = {
  query?: string;
  sourceId: string;
  isR1?: boolean;
  routeDetail?: any;
  r1DayPlans?: any[];
};

const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const tomorrow = () => { const date = new Date(); date.setDate(date.getDate() + 1); return date; };
const nameOf = (item: any) => item?.name || item?.scenicSpotAlias || item?.scenicSpotName || item?.hotelName || item?.specialFood || '';
const imageOf = (item: any) => Array.isArray(item?.image) ? item.image[0] : (Array.isArray(item?.imageCompress) ? item.imageCompress[0] : item?.image || item?.imageCompress || '');
const descriptionOf = (item: any) => (item?.scenicSpotTags || []).find(Boolean) || '';

function node(type: string, detail: any, values: Partial<any> = {}) {
  return {
    nodeType: type || detail?.entity_type || '行程', nodeTime: '', name: nameOf(detail), remark: '', tips: '', businessId: detail?.id || '',
    extendJson: { nodeDetail: detail || {} }, ...values,
  };
}

function numberTime(value: any) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5);
  const valueNumber = Number(value);
  if (!Number.isFinite(valueNumber)) return '';
  const hours = Math.floor(valueNumber); const minutes = Math.round((valueNumber - hours) * 60);
  return `${pad(hours)}:${pad(minutes)}`;
}

/** Ported from packageMainQA/mainQA/component/chat-qa-item.ts#getCollectParams. */
export function buildItineraryCollectPayload(context: ItineraryCollectContext) {
  const start = tomorrow();
  const result: any = {
    sourceId: context.sourceId,
    sourceType: 'CHAT',
    title: context.query || '黄小西智能行程规划',
    description: '',
    daysCount: 0,
    r1Flag: context.isR1 ? 1 : 0,
    startedAt: formatDate(start),
    coverImageUrl: '',
    days: [] as any[],
  };
  let coverImageUrl = '';
  if (context.isR1) {
    (context.r1DayPlans || []).forEach((plan: any, index: number) => {
      const nodes: any[] = []; let description = '';
      (plan.starts || []).forEach((item: any) => nodes.push(node('起点', item, { extendJson: { isR1: true, nodeDetail: item } })));
      (plan.spots || []).forEach((item: any) => { nodes.push(node(item.entity_type || '景区', item, { extendJson: { isR1: true, nodeDetail: item } })); coverImageUrl ||= imageOf(item); description ||= descriptionOf(item); });
      (plan.foods || []).forEach((item: any) => nodes.push(node(item.entity_type || '美食', item, { extendJson: { isR1: true, nodeDetail: item } })));
      (plan.hotels || []).forEach((item: any) => nodes.push(node(item.entity_type || '酒店', item, { extendJson: { isR1: true, nodeDetail: item } })));
      (plan.ends || []).forEach((item: any) => nodes.push(node('终点', item, { extendJson: { isR1: true, nodeDetail: item } })));
      result.days.push({ dayIndex: plan.days || index + 1, dayDate: formatDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)), dayDescription: description, nodes });
    });
  } else {
    const detail = context.routeDetail || {}; const candidates = detail.candidates || {}; const foods = detail.food_days_info || {}; const hotels = detail.hotel_days_info || {};
    (detail.result || []).forEach((day: any, dayIndex: number) => {
      const nodes: any[] = []; let description = '';
      (day.activities || []).forEach((activity: any) => {
        if (activity.activity) {
          const info = candidates[activity.activity.id] || activity.activity;
          nodes.push(node(info.entity_type || '景区', info, { nodeTime: numberTime(activity.activity.start), businessId: info.id || activity.activity.id, extendJson: { nodeInfo: activity.activity, nodeDetail: info } }));
          coverImageUrl ||= imageOf(info); description ||= descriptionOf(info);
        }
        const commute = activity.commute || (activity.mode ? activity : null);
        if (commute) {
          const from = candidates[commute.from] || commute.from || {}; const to = candidates[commute.to] || commute.to || {};
          nodes.push(node('交通', { ...commute, from, to }, { nodeTime: numberTime(commute.start), name: `${nameOf(from)}->${nameOf(to)}`, businessId: '', extendJson: { nodeDetail: { ...commute, from, to } } }));
        }
      });
      const noTimeFoods: any[] = [];
      (foods[dayIndex + 1] || []).forEach((food: any) => { const value = node(food.entity_type || '美食', food, { nodeTime: numberTime(food.start) }); value.nodeTime ? nodes.push(value) : noTimeFoods.push(value); });
      nodes.sort((a, b) => String(a.nodeTime).localeCompare(String(b.nodeTime))); nodes.push(...noTimeFoods);
      (hotels[dayIndex + 1] || []).forEach((hotel: any) => nodes.push(node(hotel.entity_type || '酒店', hotel)));
      result.days.push({ dayIndex: dayIndex + 1, dayDate: formatDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayIndex)), dayDescription: description, nodes });
    });
  }
  result.coverImageUrl = coverImageUrl;
  result.daysCount = result.days.length;
  return result;
}
