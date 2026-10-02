export const HOLIDAY_JOURNAL_SETTING_KEY = 'private.holiday-journal'
export const HOLIDAY_JOURNAL_LOCAL_STORAGE_KEY = '2aran:private:holiday-journal'

const MAX_HOLIDAYS = 80
const MAX_DAYS_PER_HOLIDAY = 40

function cleanText(value, maxLength = 4000) {
  return String(value || '').trim().slice(0, maxLength)
}

function uniqueId(value, fallback) {
  const cleaned = cleanText(value, 80).replace(/[^a-zA-Z0-9_-]/g, '-')
  return cleaned || fallback
}

export function defaultHolidayJournal() {
  return {
    version: 1,
    holidays: [
      {
        id: '2026-national-day',
        title: '2026 国庆',
        year: 2026,
        dateRange: '10月1日—10月7日',
        status: 'recording',
        visibility: 'owner',
        days: [
          {
            id: '2026-10-01',
            date: '2026-10-01',
            label: '第一天',
            keywords: ['早起', '山姆', '宜家', '回家吃晚饭', '新疆杏干', '维权', '小茉莉发烧', '再次活跃推特'],
            note: '早起后去了山姆和宜家，回家吃晚饭。吃新疆杏干时发现虫子，维权后拿到 1000 元。晚上洗了澡就睡了；小茉莉发烧，喝了药。再次活跃推特。',
          },
          {
            id: '2026-10-02',
            date: '2026-10-02',
            label: '第二天',
            keywords: ['晚起', '小孩闹', '二手茶几', '在家带娃', '快吃晚饭'],
            note: '昨晚小孩很闹，所以今天晚起。早上没干什么，一晃就到中午了；准备去拖一个二手茶几回来。小孩不睡，中午吃了饭，下午一直在家陪孩子玩：喝奶、换尿片、换衣服、喝水、看书、在床上跳……记到这里，已经快要吃晚饭了。',
          },
        ],
      },
    ],
  }
}

function normalizeDay(day, holidayIndex, dayIndex) {
  const date = cleanText(day?.date, 10)
  const fallbackId = `holiday-${holidayIndex + 1}-day-${dayIndex + 1}`
  return {
    id: uniqueId(day?.id || date, fallbackId),
    date,
    label: cleanText(day?.label, 40) || `第 ${dayIndex + 1} 天`,
    keywords: Array.from(new Set((Array.isArray(day?.keywords) ? day.keywords : [])
      .map((item) => cleanText(item, 30))
      .filter(Boolean)))
      .slice(0, 30),
    note: cleanText(day?.note, 12000),
  }
}

function normalizeHoliday(holiday, holidayIndex) {
  const title = cleanText(holiday?.title, 80) || `节假日 ${holidayIndex + 1}`
  const fallbackId = `holiday-${holidayIndex + 1}`
  return {
    id: uniqueId(holiday?.id, fallbackId),
    title,
    year: Math.min(2200, Math.max(2000, Number(holiday?.year) || new Date().getFullYear())),
    dateRange: cleanText(holiday?.dateRange, 80),
    status: holiday?.status === 'complete' ? 'complete' : 'recording',
    visibility: 'owner',
    days: (Array.isArray(holiday?.days) ? holiday.days : [])
      .slice(0, MAX_DAYS_PER_HOLIDAY)
      .map((day, dayIndex) => normalizeDay(day, holidayIndex, dayIndex)),
  }
}

export function normalizeHolidayJournal(input) {
  const source = input && typeof input === 'object' ? input : defaultHolidayJournal()
  const holidays = (Array.isArray(source.holidays) ? source.holidays : [])
    .slice(0, MAX_HOLIDAYS)
    .map(normalizeHoliday)

  return {
    version: 1,
    holidays: holidays.length ? holidays : defaultHolidayJournal().holidays,
  }
}

export function serializeHolidayJournal(input) {
  return normalizeHolidayJournal(input)
}
